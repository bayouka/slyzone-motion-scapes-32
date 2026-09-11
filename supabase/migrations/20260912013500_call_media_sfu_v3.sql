-- 2b2c Call Engine V3 — SFU media registry + technical telemetry

create table if not exists public.call_media_tracks_v3 (
  id uuid primary key default gen_random_uuid(),
  call_session_id uuid not null references public.call_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider_session_id text not null,
  provider_track_id text not null,
  role text not null check (role in ('audio','camera','screen')),
  mid text,
  state text not null default 'live' check (state in ('publishing','live','ended','failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ended_at timestamptz,
  unique (call_session_id, user_id, role)
);

create index if not exists call_media_tracks_v3_call_state_idx
  on public.call_media_tracks_v3(call_session_id, state);
create index if not exists call_media_tracks_v3_provider_idx
  on public.call_media_tracks_v3(provider_session_id, provider_track_id);

alter table public.call_media_tracks_v3 enable row level security;
revoke all on table public.call_media_tracks_v3 from anon, authenticated;

create table if not exists public.call_media_telemetry_v3 (
  id bigint generated always as identity primary key,
  call_session_id uuid not null references public.call_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event text not null,
  role text check (role is null or role in ('audio','camera','screen')),
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists call_media_telemetry_v3_call_created_idx
  on public.call_media_telemetry_v3(call_session_id, created_at desc);

alter table public.call_media_telemetry_v3 enable row level security;
revoke all on table public.call_media_telemetry_v3 from anon, authenticated;

create or replace function public.register_call_provider_session_v3(
  p_call_id uuid,
  p_provider_session_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_call public.call_sessions%rowtype;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  if nullif(btrim(coalesce(p_provider_session_id,'')), '') is null then raise exception 'PROVIDER_SESSION_REQUIRED'; end if;
  if not app_private.can_access_call_v1(p_call_id) then raise exception 'CALL_ACCESS_DENIED'; end if;

  select * into v_call from public.call_sessions where id=p_call_id;
  if not found then raise exception 'CALL_NOT_FOUND'; end if;
  if v_call.status <> 'active' then raise exception 'CALL_NOT_ACTIVE'; end if;

  update public.call_participants
     set provider_session_id=p_provider_session_id,
         last_seen_at=clock_timestamp()
   where call_session_id=p_call_id
     and user_id=v_actor
     and left_at is null;
  if not found then raise exception 'CALL_PARTICIPANT_REQUIRED'; end if;

  return jsonb_build_object('ok',true,'call_id',p_call_id,'provider_session_id',p_provider_session_id);
end;
$$;

create or replace function public.upsert_call_media_track_v3(
  p_call_id uuid,
  p_provider_session_id text,
  p_provider_track_id text,
  p_role text,
  p_mid text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_row public.call_media_tracks_v3%rowtype;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_role not in ('audio','camera','screen') then raise exception 'INVALID_MEDIA_ROLE'; end if;
  if nullif(btrim(coalesce(p_provider_session_id,'')), '') is null then raise exception 'PROVIDER_SESSION_REQUIRED'; end if;
  if nullif(btrim(coalesce(p_provider_track_id,'')), '') is null then raise exception 'PROVIDER_TRACK_REQUIRED'; end if;
  if not app_private.can_access_call_v1(p_call_id) then raise exception 'CALL_ACCESS_DENIED'; end if;
  if not exists (
    select 1 from public.call_participants cp
     where cp.call_session_id=p_call_id
       and cp.user_id=v_actor
       and cp.left_at is null
       and cp.provider_session_id=p_provider_session_id
  ) then raise exception 'PROVIDER_SESSION_MISMATCH'; end if;

  insert into public.call_media_tracks_v3(
    call_session_id,user_id,provider_session_id,provider_track_id,role,mid,state,updated_at,ended_at
  ) values (
    p_call_id,v_actor,p_provider_session_id,p_provider_track_id,p_role,p_mid,'live',clock_timestamp(),null
  )
  on conflict (call_session_id,user_id,role)
  do update set
    provider_session_id=excluded.provider_session_id,
    provider_track_id=excluded.provider_track_id,
    mid=excluded.mid,
    state='live',
    updated_at=clock_timestamp(),
    ended_at=null
  returning * into v_row;

  return to_jsonb(v_row);
end;
$$;

create or replace function public.end_call_media_track_v3(
  p_call_id uuid,
  p_role text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_count integer;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_role not in ('audio','camera','screen') then raise exception 'INVALID_MEDIA_ROLE'; end if;
  if not app_private.can_access_call_v1(p_call_id) then raise exception 'CALL_ACCESS_DENIED'; end if;

  update public.call_media_tracks_v3
     set state='ended',updated_at=clock_timestamp(),ended_at=clock_timestamp()
   where call_session_id=p_call_id and user_id=v_actor and role=p_role and state<>'ended';
  get diagnostics v_count = row_count;
  return jsonb_build_object('ok',true,'ended',v_count);
end;
$$;

create or replace function public.end_all_call_media_tracks_v3(p_call_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_count integer;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  if not app_private.can_access_call_v1(p_call_id) then raise exception 'CALL_ACCESS_DENIED'; end if;

  update public.call_media_tracks_v3
     set state='ended',updated_at=clock_timestamp(),ended_at=clock_timestamp()
   where call_session_id=p_call_id and user_id=v_actor and state<>'ended';
  get diagnostics v_count = row_count;
  return jsonb_build_object('ok',true,'ended',v_count);
end;
$$;

create or replace function public.get_call_media_catalog_v3(p_call_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  if not app_private.can_access_call_v1(p_call_id) then raise exception 'CALL_ACCESS_DENIED'; end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'user_id',t.user_id,
      'provider_session_id',t.provider_session_id,
      'provider_track_id',t.provider_track_id,
      'role',t.role,
      'mid',t.mid,
      'state',t.state,
      'updated_at',t.updated_at
    ) order by t.user_id,t.role)
    from public.call_media_tracks_v3 t
    where t.call_session_id=p_call_id and t.state='live'
  ),'[]'::jsonb);
end;
$$;

create or replace function public.record_call_media_telemetry_v3(
  p_call_id uuid,
  p_event text,
  p_role text default null,
  p_metrics jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_event text := lower(btrim(coalesce(p_event,'')));
  v_metrics jsonb := coalesce(p_metrics,'{}'::jsonb);
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  if not app_private.can_access_call_v1(p_call_id) then raise exception 'CALL_ACCESS_DENIED'; end if;
  if v_event not in ('connecting','connected','media_waiting','degraded','reconnecting','interrupted','track_live','track_ended','error') then
    raise exception 'INVALID_MEDIA_EVENT';
  end if;
  if p_role is not null and p_role not in ('audio','camera','screen') then raise exception 'INVALID_MEDIA_ROLE'; end if;
  if octet_length(v_metrics::text) > 4096 then raise exception 'METRICS_TOO_LARGE'; end if;

  insert into public.call_media_telemetry_v3(call_session_id,user_id,event,role,metrics)
  values(p_call_id,v_actor,v_event,p_role,v_metrics);
end;
$$;

grant execute on function public.register_call_provider_session_v3(uuid,text) to authenticated;
grant execute on function public.upsert_call_media_track_v3(uuid,text,text,text,text) to authenticated;
grant execute on function public.end_call_media_track_v3(uuid,text) to authenticated;
grant execute on function public.end_all_call_media_tracks_v3(uuid) to authenticated;
grant execute on function public.get_call_media_catalog_v3(uuid) to authenticated;
grant execute on function public.record_call_media_telemetry_v3(uuid,text,text,jsonb) to authenticated;

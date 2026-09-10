-- 4b4c communication live V1 — governed native calls
create table if not exists public.call_sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  meeting_id uuid references public.meetings(id) on delete set null,
  started_by uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'live' check (status in ('live','ended')),
  provider text not null default 'cloudflare_sfu' check (provider='cloudflare_sfu'),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  ended_by uuid references public.profiles(id) on delete set null,
  version integer not null default 1 check (version > 0),
  check ((status='live' and ended_at is null) or (status='ended' and ended_at is not null))
);

create table if not exists public.call_participants (
  id uuid primary key default gen_random_uuid(),
  call_session_id uuid not null references public.call_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  provider_session_id text,
  mic_enabled boolean not null default true,
  camera_enabled boolean not null default false,
  screen_enabled boolean not null default false,
  media_updated_at timestamptz not null default now()
);

create unique index if not exists call_one_live_meeting_v1
  on public.call_sessions(meeting_id) where meeting_id is not null and ended_at is null;
create unique index if not exists call_one_live_conversation_v1
  on public.call_sessions(conversation_id) where conversation_id is not null and meeting_id is null and ended_at is null;
create unique index if not exists call_one_live_project_v1
  on public.call_sessions(project_id) where conversation_id is null and meeting_id is null and ended_at is null;
create unique index if not exists call_one_active_user_v1
  on public.call_participants(call_session_id,user_id) where left_at is null;
create unique index if not exists call_provider_session_unique_v1
  on public.call_participants(provider_session_id) where provider_session_id is not null;
create index if not exists call_participants_active_v1
  on public.call_participants(call_session_id,joined_at) where left_at is null;

alter table public.call_sessions enable row level security;
alter table public.call_participants enable row level security;

revoke all on public.call_sessions from public, anon, authenticated;
revoke all on public.call_participants from public, anon, authenticated;
grant select on public.call_sessions to authenticated;
grant select on public.call_participants to authenticated;

create or replace function app_private.can_access_call_v1(p_call_id uuid)
returns boolean
language sql stable security definer set search_path=''
as $$
  select exists (
    select 1 from public.call_sessions c
    where c.id=p_call_id
      and app_private.can_access_project(c.project_id)
      and (c.conversation_id is null or app_private.can_access_conversation(c.conversation_id))
      and (c.meeting_id is null or app_private.can_access_meeting(c.meeting_id))
  );
$$;
revoke all on function app_private.can_access_call_v1(uuid) from public,anon,authenticated;

drop policy if exists call_sessions_select_v1 on public.call_sessions;
create policy call_sessions_select_v1 on public.call_sessions
for select to authenticated
using (
  app_private.can_access_project(project_id)
  and (conversation_id is null or app_private.can_access_conversation(conversation_id))
  and (meeting_id is null or app_private.can_access_meeting(meeting_id))
);

drop policy if exists call_participants_select_v1 on public.call_participants;
create policy call_participants_select_v1 on public.call_participants
for select to authenticated
using (app_private.can_access_call_v1(call_session_id));

create or replace function public.start_call_v1(
  p_project_id uuid,
  p_conversation_id uuid default null,
  p_meeting_id uuid default null
)
returns public.call_sessions
language plpgsql security definer set search_path=''
as $$
declare
  v_actor uuid:=auth.uid();
  v_project public.projects%rowtype;
  v_call public.call_sessions%rowtype;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_project from public.projects where id=p_project_id;
  if not found then raise exception 'PROJECT_NOT_FOUND'; end if;
  if v_project.status<>'active' then raise exception 'PROJECT_NOT_ACTIVE'; end if;
  if not app_private.can_access_project(p_project_id) then raise exception 'CALL_ACCESS_DENIED'; end if;

  if p_conversation_id is not null then
    if not exists(select 1 from public.conversations c
      where c.id=p_conversation_id
        and coalesce(c.project_id,c.linked_project_id)=p_project_id
        and app_private.can_access_conversation(c.id)) then
      raise exception 'CALL_CONVERSATION_INVALID';
    end if;
  end if;

  if p_meeting_id is not null then
    if not exists(select 1 from public.meetings m
      where m.id=p_meeting_id and m.project_id=p_project_id
        and m.status in ('planned','live')
        and app_private.can_access_meeting(m.id)) then
      raise exception 'CALL_MEETING_INVALID';
    end if;
  end if;

  if p_conversation_id is null and p_meeting_id is null and not app_private.can_write_project(p_project_id) then
    raise exception 'CALL_START_DENIED';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(
    '4b4c-call:'||coalesce(p_meeting_id::text,p_conversation_id::text,p_project_id::text),0));

  select * into v_call from public.call_sessions c
  where c.ended_at is null
    and (
      (p_meeting_id is not null and c.meeting_id=p_meeting_id)
      or (p_meeting_id is null and p_conversation_id is not null and c.meeting_id is null and c.conversation_id=p_conversation_id)
      or (p_meeting_id is null and p_conversation_id is null and c.meeting_id is null and c.conversation_id is null and c.project_id=p_project_id)
    )
  limit 1 for update;

  if not found then
    insert into public.call_sessions(workspace_id,project_id,conversation_id,meeting_id,started_by)
    values(v_project.workspace_id,p_project_id,p_conversation_id,p_meeting_id,v_actor)
    returning * into v_call;
  end if;

  if not exists(select 1 from public.call_participants cp where cp.call_session_id=v_call.id and cp.user_id=v_actor and cp.left_at is null) then
    insert into public.call_participants(call_session_id,user_id) values(v_call.id,v_actor);
  end if;
  return v_call;
end;
$$;

create or replace function public.join_call_v1(p_call_id uuid)
returns public.call_participants
language plpgsql security definer set search_path=''
as $$
declare v_actor uuid:=auth.uid(); v_call public.call_sessions%rowtype; v_p public.call_participants%rowtype; v_count int;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_call from public.call_sessions where id=p_call_id for update;
  if not found or v_call.ended_at is not null then raise exception 'CALL_NOT_LIVE'; end if;
  if not app_private.can_access_call_v1(p_call_id) then raise exception 'CALL_ACCESS_DENIED'; end if;
  select * into v_p from public.call_participants where call_session_id=p_call_id and user_id=v_actor and left_at is null limit 1;
  if found then return v_p; end if;
  select count(*) into v_count from public.call_participants where call_session_id=p_call_id and left_at is null;
  if v_count>=6 then raise exception 'CALL_FULL'; end if;
  insert into public.call_participants(call_session_id,user_id) values(p_call_id,v_actor) returning * into v_p;
  return v_p;
end;
$$;

create or replace function public.set_call_media_state_v1(
  p_call_id uuid,
  p_mic boolean,
  p_camera boolean,
  p_screen boolean
)
returns void
language plpgsql security definer set search_path=''
as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  update public.call_participants
  set mic_enabled=p_mic,camera_enabled=p_camera,screen_enabled=p_screen,media_updated_at=now()
  where call_session_id=p_call_id and user_id=auth.uid() and left_at is null;
  if not found then raise exception 'CALL_NOT_JOINED'; end if;
end;
$$;

create or replace function public.leave_call_v1(p_call_id uuid)
returns public.call_sessions
language plpgsql security definer set search_path=''
as $$
declare v_actor uuid:=auth.uid(); v_call public.call_sessions%rowtype;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  if not app_private.can_access_call_v1(p_call_id) then raise exception 'CALL_ACCESS_DENIED'; end if;
  update public.call_participants set left_at=now(),provider_session_id=null,
    mic_enabled=false,camera_enabled=false,screen_enabled=false,media_updated_at=now()
  where call_session_id=p_call_id and user_id=v_actor and left_at is null;
  if not found then raise exception 'CALL_NOT_JOINED'; end if;
  if not exists(select 1 from public.call_participants where call_session_id=p_call_id and left_at is null) then
    update public.call_sessions set status='ended',ended_at=now(),ended_by=v_actor,version=version+1
    where id=p_call_id and ended_at is null;
  end if;
  select * into v_call from public.call_sessions where id=p_call_id;
  return v_call;
end;
$$;

create or replace function public.end_call_v1(p_call_id uuid,p_expected_version integer)
returns public.call_sessions
language plpgsql security definer set search_path=''
as $$
declare v_actor uuid:=auth.uid(); v_call public.call_sessions%rowtype; v_ws uuid; v_lead uuid;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  select c.* into v_call
  from public.call_sessions c
  where c.id=p_call_id
  for update;
  if not found then raise exception 'CALL_NOT_FOUND'; end if;
  select p.workspace_id,p.lead_user_id into v_ws,v_lead
  from public.projects p
  where p.id=v_call.project_id;
  if v_call.ended_at is not null then return v_call; end if;
  if v_call.version<>p_expected_version then raise exception 'CALL_STALE'; end if;
  if not (v_call.started_by=v_actor or v_lead=v_actor or app_private.can_manage_workspace(v_ws)) then
    raise exception 'CALL_END_DENIED';
  end if;
  update public.call_sessions set status='ended',ended_at=now(),ended_by=v_actor,version=version+1
    where id=p_call_id returning * into v_call;
  update public.call_participants set left_at=coalesce(left_at,now()),provider_session_id=null,
    mic_enabled=false,camera_enabled=false,screen_enabled=false,media_updated_at=now()
    where call_session_id=p_call_id and left_at is null;
  return v_call;
end;
$$;

revoke all on function public.start_call_v1(uuid,uuid,uuid) from public,anon,authenticated;
revoke all on function public.join_call_v1(uuid) from public,anon,authenticated;
revoke all on function public.set_call_media_state_v1(uuid,boolean,boolean,boolean) from public,anon,authenticated;
revoke all on function public.leave_call_v1(uuid) from public,anon,authenticated;
revoke all on function public.end_call_v1(uuid,integer) from public,anon,authenticated;
grant execute on function public.start_call_v1(uuid,uuid,uuid) to authenticated;
grant execute on function public.join_call_v1(uuid) to authenticated;
grant execute on function public.set_call_media_state_v1(uuid,boolean,boolean,boolean) to authenticated;
grant execute on function public.leave_call_v1(uuid) to authenticated;
grant execute on function public.end_call_v1(uuid,integer) to authenticated;

do $$
begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='call_sessions') then
    alter publication supabase_realtime add table public.call_sessions;
  end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='call_participants') then
    alter publication supabase_realtime add table public.call_participants;
  end if;
end$$;

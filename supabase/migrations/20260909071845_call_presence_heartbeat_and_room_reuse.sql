
alter table public.call_participants
  add column if not exists last_seen_at timestamptz;

update public.call_participants
set last_seen_at = coalesce(last_seen_at, media_updated_at, joined_at, now())
where last_seen_at is null;

alter table public.call_participants
  alter column last_seen_at set default now();

create index if not exists call_participants_last_seen_idx
  on public.call_participants(call_session_id,last_seen_at)
  where left_at is null;

create or replace function public.heartbeat_call_v1(p_call_id uuid)
returns boolean
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_actor uuid:=auth.uid();
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  update public.call_participants
  set last_seen_at=now()
  where call_session_id=p_call_id
    and user_id=v_actor
    and left_at is null;
  return found;
end;
$function$;

create or replace function public.join_call_v1(p_call_id uuid)
returns public.call_participants
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_actor uuid:=auth.uid();
  v_call public.call_sessions%rowtype;
  v_p public.call_participants%rowtype;
  v_count int;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;

  select * into v_call
  from public.call_sessions
  where id=p_call_id
  for update;

  if not found or v_call.ended_at is not null then raise exception 'CALL_NOT_LIVE'; end if;
  if not app_private.can_access_call_v1(p_call_id) then raise exception 'CALL_ACCESS_DENIED'; end if;

  update public.call_participants
  set left_at=now(),
      provider_session_id=null,
      mic_enabled=false,
      camera_enabled=false,
      screen_enabled=false,
      media_updated_at=now()
  where call_session_id=p_call_id
    and left_at is null
    and coalesce(last_seen_at,media_updated_at,joined_at) < now()-interval '75 seconds';

  select * into v_p
  from public.call_participants
  where call_session_id=p_call_id
    and user_id=v_actor
    and left_at is null
  limit 1;

  if found then
    update public.call_participants
    set last_seen_at=now()
    where id=v_p.id
    returning * into v_p;
    return v_p;
  end if;

  select count(*) into v_count
  from public.call_participants
  where call_session_id=p_call_id and left_at is null;

  if v_count>=6 then raise exception 'CALL_FULL'; end if;

  insert into public.call_participants(call_session_id,user_id,last_seen_at)
  values(p_call_id,v_actor,now())
  returning * into v_p;

  return v_p;
end;
$function$;

create or replace function public.start_private_call_v2(
  p_workspace_id uuid,
  p_target_user_ids uuid[],
  p_project_id uuid default null::uuid
)
returns public.call_sessions
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_targets uuid[];
  v_call public.call_sessions%rowtype;
  v_reserved integer:=0;
  v_new_targets uuid[];
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;

  if not exists(
    select 1 from public.workspace_members wm
    where wm.workspace_id=p_workspace_id
      and wm.user_id=v_actor
      and wm.status='active'
  ) then raise exception 'CALL_ACCESS_DENIED'; end if;

  select coalesce(array_agg(distinct x), '{}')
  into v_targets
  from unnest(coalesce(p_target_user_ids,'{}'::uuid[])) x
  where x<>v_actor;

  if cardinality(v_targets)<1 then raise exception 'CALL_TARGET_REQUIRED'; end if;
  if cardinality(v_targets)>5 then raise exception 'CALL_FULL'; end if;

  if exists(
    select 1 from unnest(v_targets) x
    where not exists(
      select 1 from public.workspace_members wm
      where wm.workspace_id=p_workspace_id
        and wm.user_id=x
        and wm.status='active'
    )
  ) then raise exception 'CALL_TARGET_UNAVAILABLE'; end if;

  if p_project_id is not null then
    if not exists(
      select 1 from public.projects p
      where p.id=p_project_id
        and p.workspace_id=p_workspace_id
        and p.status='active'
    ) or not app_private.can_access_project(p_project_id)
    then raise exception 'CALL_PROJECT_INVALID'; end if;
  end if;

  -- Drop ghost participants that stopped heartbeating.
  update public.call_participants cp
  set left_at=now(),
      provider_session_id=null,
      mic_enabled=false,
      camera_enabled=false,
      screen_enabled=false,
      media_updated_at=now()
  where cp.left_at is null
    and coalesce(cp.last_seen_at,cp.media_updated_at,cp.joined_at) < now()-interval '75 seconds'
    and exists(
      select 1 from public.call_sessions cs
      where cs.id=cp.call_session_id
        and cs.workspace_id=p_workspace_id
        and cs.ended_at is null
    );

  -- End empty stale rooms and cancel their outstanding invitations.
  update public.call_sessions cs
  set status='ended',
      ended_at=now(),
      ended_by=v_actor,
      version=version+1
  where cs.workspace_id=p_workspace_id
    and cs.ended_at is null
    and cs.started_at < now()-interval '75 seconds'
    and not exists(
      select 1 from public.call_participants cp
      where cp.call_session_id=cs.id and cp.left_at is null
    );

  update public.call_invites ci
  set status='cancelled',
      responded_at=coalesce(responded_at,now())
  where ci.status='pending'
    and exists(
      select 1 from public.call_sessions cs
      where cs.id=ci.call_session_id and cs.ended_at is not null
    );

  -- Reuse the existing contextual room rather than violating the one-live-room constraint.
  select * into v_call
  from public.call_sessions cs
  where cs.workspace_id=p_workspace_id
    and cs.ended_at is null
    and cs.conversation_id is null
    and cs.meeting_id is null
    and (
      (p_project_id is null and cs.project_id is null)
      or cs.project_id=p_project_id
    )
  order by cs.started_at desc
  limit 1
  for update;

  if found then
    select coalesce(array_agg(x),'{}')
    into v_new_targets
    from unnest(v_targets) x
    where not exists(
      select 1 from public.call_participants cp
      where cp.call_session_id=v_call.id and cp.user_id=x and cp.left_at is null
    )
    and not exists(
      select 1 from public.call_invites ci
      where ci.call_session_id=v_call.id
        and ci.invited_user_id=x
        and ci.status in ('pending','accepted')
    );

    select count(distinct u.user_id)
    into v_reserved
    from (
      select cp.user_id
      from public.call_participants cp
      where cp.call_session_id=v_call.id and cp.left_at is null
      union
      select ci.invited_user_id
      from public.call_invites ci
      where ci.call_session_id=v_call.id
        and ci.status in ('pending','accepted')
      union
      select v_call.started_by
    ) u;

    if cardinality(v_new_targets) > greatest(0,6-v_reserved) then
      raise exception 'CALL_FULL';
    end if;

    if cardinality(v_new_targets)>0 then
      insert into public.call_invites(
        call_session_id,workspace_id,invited_user_id,invited_by,status,responded_at
      )
      select v_call.id,p_workspace_id,x,v_actor,'pending',null
      from unnest(v_new_targets) x
      on conflict(call_session_id,invited_user_id)
      do update set
        status='pending',
        invited_by=excluded.invited_by,
        created_at=now(),
        responded_at=null
      where public.call_invites.status in ('declined','cancelled');
    end if;

    return v_call;
  end if;

  insert into public.call_sessions(
    workspace_id,project_id,conversation_id,meeting_id,started_by,direct_user_id
  )
  values(p_workspace_id,p_project_id,null,null,v_actor,null)
  returning * into v_call;

  insert into public.call_invites(
    call_session_id,workspace_id,invited_user_id,invited_by
  )
  select v_call.id,p_workspace_id,x,v_actor
  from unnest(v_targets) x;

  return v_call;
end;
$function$;

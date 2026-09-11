
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
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  if not exists(
    select 1 from public.workspace_members wm
    where wm.workspace_id=p_workspace_id and wm.user_id=v_actor and wm.status='active'
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
      where wm.workspace_id=p_workspace_id and wm.user_id=x and wm.status='active'
    )
  ) then raise exception 'CALL_TARGET_UNAVAILABLE'; end if;

  if p_project_id is not null then
    if not exists(
      select 1 from public.projects p
      where p.id=p_project_id and p.workspace_id=p_workspace_id and p.status='active'
    ) or not app_private.can_access_project(p_project_id)
    then raise exception 'CALL_PROJECT_INVALID'; end if;
  end if;

  insert into public.call_sessions(workspace_id,project_id,conversation_id,meeting_id,started_by,direct_user_id)
  values(p_workspace_id,p_project_id,null,null,v_actor,null)
  returning * into v_call;

  insert into public.call_invites(call_session_id,workspace_id,invited_user_id,invited_by)
  select v_call.id,p_workspace_id,x,v_actor from unnest(v_targets) x;

  return v_call;
end;
$function$;

create or replace function public.invite_to_call_v1(
  p_call_id uuid,
  p_target_user_ids uuid[]
)
returns integer
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_call public.call_sessions%rowtype;
  v_targets uuid[];
  v_count integer := 0;
  v_reserved integer := 0;
  v_available integer := 0;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;

  select * into v_call
  from public.call_sessions
  where id=p_call_id and ended_at is null
  for update;

  if not found then raise exception 'CALL_NOT_LIVE'; end if;

  if not (
    v_call.started_by=v_actor
    or exists(
      select 1 from public.call_participants cp
      where cp.call_session_id=p_call_id and cp.user_id=v_actor and cp.left_at is null
    )
  ) then raise exception 'CALL_INVITE_DENIED'; end if;

  select coalesce(array_agg(distinct x), '{}')
  into v_targets
  from unnest(coalesce(p_target_user_ids,'{}'::uuid[])) x
  where x<>v_actor
    and not exists(
      select 1 from public.call_participants cp
      where cp.call_session_id=p_call_id and cp.user_id=x and cp.left_at is null
    )
    and not exists(
      select 1 from public.call_invites ci
      where ci.call_session_id=p_call_id
        and ci.invited_user_id=x
        and ci.status in ('pending','accepted')
    );

  if cardinality(v_targets)<1 then return 0; end if;

  if exists(
    select 1 from unnest(v_targets) x
    where not exists(
      select 1 from public.workspace_members wm
      where wm.workspace_id=v_call.workspace_id and wm.user_id=x and wm.status='active'
    )
  ) then raise exception 'CALL_TARGET_UNAVAILABLE'; end if;

  select count(distinct u.user_id)
  into v_reserved
  from (
    select cp.user_id
    from public.call_participants cp
    where cp.call_session_id=p_call_id and cp.left_at is null
    union
    select ci.invited_user_id
    from public.call_invites ci
    where ci.call_session_id=p_call_id
      and ci.status in ('pending','accepted')
      and not exists(
        select 1 from public.call_participants cp2
        where cp2.call_session_id=p_call_id
          and cp2.user_id=ci.invited_user_id
          and cp2.left_at is null
      )
    union
    select v_call.started_by
  ) u;

  v_available := greatest(0, 6 - v_reserved);

  if cardinality(v_targets) > v_available then
    raise exception 'CALL_FULL';
  end if;

  insert into public.call_invites(call_session_id,workspace_id,invited_user_id,invited_by,status,responded_at)
  select p_call_id,v_call.workspace_id,x,v_actor,'pending',null
  from unnest(v_targets) x
  on conflict(call_session_id,invited_user_id)
  do update set
    status='pending',
    invited_by=excluded.invited_by,
    created_at=now(),
    responded_at=null
  where public.call_invites.status in ('declined','cancelled');

  get diagnostics v_count=row_count;
  return v_count;
end;
$function$;

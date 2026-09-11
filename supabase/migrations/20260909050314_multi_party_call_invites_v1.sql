
create table if not exists public.call_invites (
  id uuid primary key default gen_random_uuid(),
  call_session_id uuid not null references public.call_sessions(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  invited_user_id uuid not null references public.profiles(id) on delete cascade,
  invited_by uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique(call_session_id, invited_user_id)
);

create index if not exists call_invites_target_pending_v1
  on public.call_invites(invited_user_id, created_at desc)
  where status='pending';

alter table public.call_invites enable row level security;

create or replace function app_private.can_access_call_v1(p_call_id uuid)
returns boolean
language sql stable security definer set search_path=''
as $$
  select exists (
    select 1
    from public.call_sessions c
    where c.id=p_call_id
      and (
        (
          exists(select 1 from public.call_invites ci where ci.call_session_id=c.id)
          and (
            c.started_by=auth.uid()
            or exists(
              select 1 from public.call_invites ci
              where ci.call_session_id=c.id
                and ci.invited_user_id=auth.uid()
                and ci.status in ('pending','accepted')
            )
          )
        )
        or
        (
          not exists(select 1 from public.call_invites ci where ci.call_session_id=c.id)
          and c.direct_user_id is not null
          and auth.uid() in (c.started_by,c.direct_user_id)
        )
        or
        (
          not exists(select 1 from public.call_invites ci where ci.call_session_id=c.id)
          and c.direct_user_id is null and c.project_id is not null
          and app_private.can_access_project(c.project_id)
          and (c.conversation_id is null or app_private.can_access_conversation(c.conversation_id))
          and (c.meeting_id is null or app_private.can_access_meeting(c.meeting_id))
        )
        or
        (
          not exists(select 1 from public.call_invites ci where ci.call_session_id=c.id)
          and c.direct_user_id is null and c.project_id is null
          and exists (
            select 1 from public.workspace_members wm
            where wm.workspace_id=c.workspace_id
              and wm.user_id=auth.uid()
              and wm.status='active'
          )
        )
      )
  );
$$;
revoke all on function app_private.can_access_call_v1(uuid) from public,anon,authenticated;

drop policy if exists call_sessions_select_v1 on public.call_sessions;
create policy call_sessions_select_v1 on public.call_sessions
for select to authenticated
using (app_private.can_access_call_v1(id));

drop policy if exists call_invites_select_v1 on public.call_invites;
create policy call_invites_select_v1 on public.call_invites
for select to authenticated
using (
  invited_user_id=auth.uid()
  or invited_by=auth.uid()
  or exists(
    select 1 from public.call_sessions c
    where c.id=call_session_id
      and c.started_by=auth.uid()
  )
  or exists(
    select 1 from public.call_participants cp
    where cp.call_session_id=call_session_id
      and cp.user_id=auth.uid()
      and cp.left_at is null
  )
);

create or replace function public.start_private_call_v2(
  p_workspace_id uuid,
  p_target_user_ids uuid[],
  p_project_id uuid default null
)
returns public.call_sessions
language plpgsql security definer set search_path=''
as $$
declare
  v_actor uuid:=auth.uid();
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
  if cardinality(v_targets)>7 then raise exception 'CALL_TOO_MANY_INVITES'; end if;

  if exists(
    select 1 from unnest(v_targets) x
    where not exists(
      select 1 from public.workspace_members wm
      where wm.workspace_id=p_workspace_id and wm.user_id=x and wm.status='active'
    )
  ) then raise exception 'CALL_TARGET_UNAVAILABLE'; end if;

  if p_project_id is not null then
    if not exists(select 1 from public.projects p where p.id=p_project_id and p.workspace_id=p_workspace_id and p.status='active')
       or not app_private.can_access_project(p_project_id)
    then raise exception 'CALL_PROJECT_INVALID'; end if;
  end if;

  insert into public.call_sessions(workspace_id,project_id,conversation_id,meeting_id,started_by,direct_user_id)
  values(p_workspace_id,p_project_id,null,null,v_actor,null)
  returning * into v_call;

  insert into public.call_invites(call_session_id,workspace_id,invited_user_id,invited_by)
  select v_call.id,p_workspace_id,x,v_actor from unnest(v_targets) x;

  return v_call;
end;
$$;
revoke all on function public.start_private_call_v2(uuid,uuid[],uuid) from public,anon,authenticated;
grant execute on function public.start_private_call_v2(uuid,uuid[],uuid) to authenticated;

create or replace function public.invite_to_call_v1(
  p_call_id uuid,
  p_target_user_ids uuid[]
)
returns integer
language plpgsql security definer set search_path=''
as $$
declare
  v_actor uuid:=auth.uid();
  v_call public.call_sessions%rowtype;
  v_targets uuid[];
  v_count integer:=0;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_call from public.call_sessions where id=p_call_id and ended_at is null;
  if not found then raise exception 'CALL_NOT_LIVE'; end if;

  if not (
    v_call.started_by=v_actor
    or exists(select 1 from public.call_participants cp where cp.call_session_id=p_call_id and cp.user_id=v_actor and cp.left_at is null)
  ) then raise exception 'CALL_INVITE_DENIED'; end if;

  select coalesce(array_agg(distinct x), '{}') into v_targets
  from unnest(coalesce(p_target_user_ids,'{}'::uuid[])) x
  where x<>v_actor;

  if cardinality(v_targets)<1 then return 0; end if;
  if cardinality(v_targets)>7 then raise exception 'CALL_TOO_MANY_INVITES'; end if;

  if exists(
    select 1 from unnest(v_targets) x
    where not exists(
      select 1 from public.workspace_members wm
      where wm.workspace_id=v_call.workspace_id and wm.user_id=x and wm.status='active'
    )
  ) then raise exception 'CALL_TARGET_UNAVAILABLE'; end if;

  insert into public.call_invites(call_session_id,workspace_id,invited_user_id,invited_by,status,responded_at)
  select p_call_id,v_call.workspace_id,x,v_actor,'pending',null
  from unnest(v_targets) x
  on conflict(call_session_id,invited_user_id)
  do update set status='pending',invited_by=excluded.invited_by,created_at=now(),responded_at=null
  where public.call_invites.status in ('declined','cancelled');

  get diagnostics v_count=row_count;
  return v_count;
end;
$$;
revoke all on function public.invite_to_call_v1(uuid,uuid[]) from public,anon,authenticated;
grant execute on function public.invite_to_call_v1(uuid,uuid[]) to authenticated;

create or replace function public.respond_call_invite_v1(p_call_id uuid,p_accept boolean)
returns public.call_sessions
language plpgsql security definer set search_path=''
as $$
declare
  v_actor uuid:=auth.uid();
  v_call public.call_sessions%rowtype;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;

  update public.call_invites
  set status=case when p_accept then 'accepted' else 'declined' end,
      responded_at=now()
  where call_session_id=p_call_id
    and invited_user_id=v_actor
    and status='pending';

  if not found then raise exception 'CALL_INVITE_NOT_FOUND'; end if;

  select * into v_call from public.call_sessions where id=p_call_id;
  return v_call;
end;
$$;
revoke all on function public.respond_call_invite_v1(uuid,boolean) from public,anon,authenticated;
grant execute on function public.respond_call_invite_v1(uuid,boolean) to authenticated;

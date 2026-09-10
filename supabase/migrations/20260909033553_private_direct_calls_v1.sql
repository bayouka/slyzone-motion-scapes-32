
alter table public.call_sessions
  add column if not exists direct_user_id uuid references public.profiles(id) on delete set null;

create index if not exists call_sessions_direct_target_v1
  on public.call_sessions(workspace_id,direct_user_id,started_at desc)
  where direct_user_id is not null and ended_at is null;

create or replace function app_private.can_access_call_v1(p_call_id uuid)
returns boolean
language sql stable security definer set search_path=''
as $$
  select exists (
    select 1
    from public.call_sessions c
    where c.id=p_call_id
      and (
        (c.direct_user_id is not null
          and auth.uid() in (c.started_by,c.direct_user_id))
        or
        (c.direct_user_id is null and c.project_id is not null
          and app_private.can_access_project(c.project_id)
          and (c.conversation_id is null or app_private.can_access_conversation(c.conversation_id))
          and (c.meeting_id is null or app_private.can_access_meeting(c.meeting_id)))
        or
        (c.direct_user_id is null and c.project_id is null
          and exists (
            select 1
            from public.workspace_members wm
            where wm.workspace_id=c.workspace_id
              and wm.user_id=auth.uid()
              and wm.status='active'
          ))
      )
  );
$$;
revoke all on function app_private.can_access_call_v1(uuid) from public,anon,authenticated;

drop policy if exists call_sessions_select_v1 on public.call_sessions;
create policy call_sessions_select_v1 on public.call_sessions
for select to authenticated
using (
  (direct_user_id is not null and auth.uid() in (started_by,direct_user_id))
  or
  (direct_user_id is null and project_id is not null
    and app_private.can_access_project(project_id)
    and (conversation_id is null or app_private.can_access_conversation(conversation_id))
    and (meeting_id is null or app_private.can_access_meeting(meeting_id)))
  or
  (direct_user_id is null and project_id is null
    and exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id=call_sessions.workspace_id
        and wm.user_id=auth.uid()
        and wm.status='active'
    ))
);

create or replace function public.start_direct_call_v1(
  p_workspace_id uuid,
  p_target_user_id uuid,
  p_project_id uuid default null
)
returns public.call_sessions
language plpgsql security definer set search_path=''
as $$
declare
  v_actor uuid:=auth.uid();
  v_call public.call_sessions%rowtype;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_target_user_id=v_actor then raise exception 'CALL_SELF_DENIED'; end if;

  if not exists(
    select 1 from public.workspace_members wm
    where wm.workspace_id=p_workspace_id and wm.user_id=v_actor and wm.status='active'
  ) then raise exception 'CALL_ACCESS_DENIED'; end if;

  if not exists(
    select 1 from public.workspace_members wm
    where wm.workspace_id=p_workspace_id and wm.user_id=p_target_user_id and wm.status='active'
  ) then raise exception 'CALL_TARGET_UNAVAILABLE'; end if;

  if p_project_id is not null then
    if not exists(select 1 from public.projects p where p.id=p_project_id and p.workspace_id=p_workspace_id and p.status='active')
      or not app_private.can_access_project(p_project_id)
    then raise exception 'CALL_PROJECT_INVALID'; end if;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(
    '4b4c-direct:'||p_workspace_id::text||':'||
    least(v_actor::text,p_target_user_id::text)||':'||
    greatest(v_actor::text,p_target_user_id::text),0));

  update public.call_sessions
  set status='ended',ended_at=now(),ended_by=v_actor,version=version+1
  where direct_user_id is not null
    and ended_at is null
    and started_at < now()-interval '90 seconds'
    and (
      (started_by=v_actor and direct_user_id=p_target_user_id)
      or (started_by=p_target_user_id and direct_user_id=v_actor)
    );

  select * into v_call
  from public.call_sessions c
  where c.ended_at is null
    and c.direct_user_id is not null
    and (
      (c.started_by=v_actor and c.direct_user_id=p_target_user_id)
      or (c.started_by=p_target_user_id and c.direct_user_id=v_actor)
    )
  order by c.started_at desc
  limit 1
  for update;

  if not found then
    insert into public.call_sessions(workspace_id,project_id,conversation_id,meeting_id,started_by,direct_user_id)
    values(p_workspace_id,p_project_id,null,null,v_actor,p_target_user_id)
    returning * into v_call;
  end if;

  return v_call;
end;
$$;
revoke all on function public.start_direct_call_v1(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.start_direct_call_v1(uuid,uuid,uuid) to authenticated;

create or replace function public.decline_direct_call_v1(p_call_id uuid)
returns void
language plpgsql security definer set search_path=''
as $$
declare
  v_actor uuid:=auth.uid();
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;

  update public.call_sessions
  set status='ended',ended_at=now(),ended_by=v_actor,version=version+1
  where id=p_call_id
    and direct_user_id=v_actor
    and ended_at is null;

  if not found then raise exception 'CALL_DECLINE_DENIED'; end if;
end;
$$;
revoke all on function public.decline_direct_call_v1(uuid) from public,anon,authenticated;
grant execute on function public.decline_direct_call_v1(uuid) to authenticated;

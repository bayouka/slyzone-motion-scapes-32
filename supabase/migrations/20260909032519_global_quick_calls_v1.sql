-- 4b4c global quick calls v1
alter table public.call_sessions alter column project_id drop not null;

drop index if exists call_one_live_workspace_v1;
create unique index call_one_live_workspace_v1
  on public.call_sessions(workspace_id)
  where project_id is null and conversation_id is null and meeting_id is null and ended_at is null;

create or replace function app_private.can_access_call_v1(p_call_id uuid)
returns boolean
language sql stable security definer set search_path=''
as $$
  select exists (
    select 1
    from public.call_sessions c
    where c.id=p_call_id
      and (
        (c.project_id is not null
          and app_private.can_access_project(c.project_id)
          and (c.conversation_id is null or app_private.can_access_conversation(c.conversation_id))
          and (c.meeting_id is null or app_private.can_access_meeting(c.meeting_id)))
        or
        (c.project_id is null
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
  (project_id is not null
    and app_private.can_access_project(project_id)
    and (conversation_id is null or app_private.can_access_conversation(conversation_id))
    and (meeting_id is null or app_private.can_access_meeting(meeting_id)))
  or
  (project_id is null
    and exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id=call_sessions.workspace_id
        and wm.user_id=auth.uid()
        and wm.status='active'
    ))
);

create or replace function public.start_workspace_call_v1(p_workspace_id uuid)
returns public.call_sessions
language plpgsql security definer set search_path=''
as $$
declare
  v_actor uuid:=auth.uid();
  v_call public.call_sessions%rowtype;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  if not exists(
    select 1 from public.workspace_members wm
    where wm.workspace_id=p_workspace_id
      and wm.user_id=v_actor
      and wm.status='active'
  ) then
    raise exception 'CALL_ACCESS_DENIED';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('4b4c-call-workspace:'||p_workspace_id::text,0));

  select * into v_call
  from public.call_sessions c
  where c.workspace_id=p_workspace_id
    and c.project_id is null
    and c.conversation_id is null
    and c.meeting_id is null
    and c.ended_at is null
  limit 1
  for update;

  if not found then
    insert into public.call_sessions(workspace_id,project_id,conversation_id,meeting_id,started_by)
    values(p_workspace_id,null,null,null,v_actor)
    returning * into v_call;
  end if;

  return v_call;
end;
$$;
revoke all on function public.start_workspace_call_v1(uuid) from public,anon,authenticated;
grant execute on function public.start_workspace_call_v1(uuid) to authenticated;

create or replace function public.end_call_v1(p_call_id uuid,p_expected_version integer)
returns public.call_sessions
language plpgsql security definer set search_path=''
as $$
declare
  v_actor uuid:=auth.uid();
  v_call public.call_sessions%rowtype;
  v_lead uuid;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;

  select * into v_call
  from public.call_sessions
  where id=p_call_id
  for update;

  if not found then raise exception 'CALL_NOT_FOUND'; end if;
  if v_call.ended_at is not null then return v_call; end if;
  if v_call.version<>p_expected_version then raise exception 'CALL_STALE'; end if;

  if v_call.project_id is not null then
    select p.lead_user_id into v_lead
    from public.projects p
    where p.id=v_call.project_id;
  end if;

  if not (
    v_call.started_by=v_actor
    or (v_lead is not null and v_lead=v_actor)
    or app_private.can_manage_workspace(v_call.workspace_id)
  ) then
    raise exception 'CALL_END_DENIED';
  end if;

  update public.call_sessions
  set status='ended',ended_at=now(),ended_by=v_actor,version=version+1
  where id=p_call_id
  returning * into v_call;

  update public.call_participants
  set left_at=coalesce(left_at,now()),
      provider_session_id=null,
      mic_enabled=false,
      camera_enabled=false,
      screen_enabled=false,
      media_updated_at=now()
  where call_session_id=p_call_id and left_at is null;

  return v_call;
end;
$$;
revoke all on function public.end_call_v1(uuid,integer) from public,anon,authenticated;
grant execute on function public.end_call_v1(uuid,integer) to authenticated;

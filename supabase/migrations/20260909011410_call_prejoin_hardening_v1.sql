-- 4b4c communication live V1.1 — prejoin lifecycle hardening
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

  return v_call;
end;
$$;

create or replace function public.cancel_empty_call_v1(p_call_id uuid,p_expected_version integer)
returns boolean
language plpgsql security definer set search_path=''
as $$
declare v_actor uuid:=auth.uid(); v_call public.call_sessions%rowtype;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_call from public.call_sessions where id=p_call_id for update;
  if not found or v_call.ended_at is not null then return false; end if;
  if v_call.started_by<>v_actor or v_call.version<>p_expected_version then return false; end if;
  if exists(select 1 from public.call_participants where call_session_id=p_call_id and left_at is null) then return false; end if;
  update public.call_sessions
  set status='ended',ended_at=now(),ended_by=v_actor,version=version+1
  where id=p_call_id and ended_at is null;
  return found;
end;
$$;

revoke all on function public.cancel_empty_call_v1(uuid,integer) from public,anon,authenticated;
grant execute on function public.cancel_empty_call_v1(uuid,integer) to authenticated;

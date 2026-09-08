-- Ensure a meeting thread is always owned by the meeting creator, even when another attendee opens it first.
create or replace function public.get_or_create_meeting_conversation_v1(p_meeting_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid(); v_meeting public.meetings%rowtype; v_id uuid;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_meeting from public.meetings where id=p_meeting_id;
  if not found then raise exception 'MEETING_NOT_FOUND'; end if;
  if v_actor<>v_meeting.created_by and not exists(select 1 from public.meeting_attendees ma where ma.meeting_id=p_meeting_id and ma.user_id=v_actor) then raise exception 'MEETING_THREAD_ATTENDEE_ONLY'; end if;
  if not exists(select 1 from public.workspace_members wm where wm.workspace_id=v_meeting.workspace_id and wm.user_id=v_actor and wm.status='active') then raise exception 'WORKSPACE_ACCESS_DENIED'; end if;
  select c.id into v_id from public.conversations c where c.workspace_id=v_meeting.workspace_id and c.kind='context' and c.context_type='meeting' and c.context_id=p_meeting_id;
  if v_id is null then
    begin
      insert into public.conversations(workspace_id,kind,title,context_type,context_id,linked_project_id,created_by)
      values(v_meeting.workspace_id,'context','Réunion · '||v_meeting.title,'meeting',p_meeting_id,v_meeting.project_id,v_meeting.created_by) returning id into v_id;
    exception when unique_violation then
      select c.id into v_id from public.conversations c where c.workspace_id=v_meeting.workspace_id and c.kind='context' and c.context_type='meeting' and c.context_id=p_meeting_id;
    end;
  end if;
  perform app_private.sync_meeting_conversation_members_v1(p_meeting_id);
  return v_id;
end;$$;

revoke all on function public.get_or_create_meeting_conversation_v1(uuid) from public,anon;
grant execute on function public.get_or_create_meeting_conversation_v1(uuid) to authenticated,service_role;

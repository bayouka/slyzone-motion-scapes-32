-- Applied migration: agenda_meeting_manager_scope_v1
create or replace function public.get_meeting_capabilities_v1(p_meeting_id uuid)
returns table(can_manage boolean,can_rsvp boolean,response text)
language sql stable security definer set search_path=''
as $$
 select app_private.can_access_meeting(m.id) and (
   m.created_by=auth.uid()
   or app_private.can_manage_workspace(m.workspace_id)
   or exists(select 1 from public.projects p where p.id=m.project_id and p.lead_user_id=auth.uid())
 ) as can_manage,
 app_private.can_access_meeting(m.id) and m.status='planned' and m.created_by<>auth.uid() and coalesce(ma.response,'') in ('pending','accepted','declined') as can_rsvp,
 ma.response
 from public.meetings m
 left join public.meeting_attendees ma on ma.meeting_id=m.id and ma.user_id=auth.uid()
 where m.id=p_meeting_id and app_private.can_access_meeting(m.id);
$$;

create or replace function public.update_meeting_v2(
 p_meeting_id uuid,p_title text,p_starts_at timestamptz,p_ends_at timestamptz default null,
 p_video_room text default null,p_visibility text default 'internal',p_agenda text default '',
 p_live_notes text default '',p_summary text default '',p_status text default 'planned',p_attendee_ids uuid[] default null
)
returns jsonb
language plpgsql security definer set search_path=''
as $$
declare v_actor uuid:=auth.uid();v_meeting public.meetings%rowtype;v_user uuid;v_role text;v_attendees uuid[];v_can_manage boolean;
begin
 if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
 select * into v_meeting from public.meetings where id=p_meeting_id for update;
 if not found or not app_private.can_access_meeting(p_meeting_id) then raise exception 'MEETING_ACCESS_DENIED'; end if;
 v_can_manage:=v_meeting.created_by=v_actor or app_private.can_manage_workspace(v_meeting.workspace_id) or exists(select 1 from public.projects p where p.id=v_meeting.project_id and p.lead_user_id=v_actor);
 if not v_can_manage then raise exception 'MEETING_MANAGE_DENIED'; end if;
 if nullif(btrim(p_title),'') is null then raise exception 'MEETING_TITLE_REQUIRED'; end if;
 if p_starts_at is null then raise exception 'MEETING_START_REQUIRED'; end if;
 if p_ends_at is not null and p_ends_at<p_starts_at then raise exception 'MEETING_END_BEFORE_START'; end if;
 if p_visibility not in ('internal','shared') then raise exception 'INVALID_MEETING_VISIBILITY'; end if;
 if v_meeting.project_id is null and p_visibility<>'internal' then raise exception 'WORKSPACE_MEETING_INTERNAL_ONLY'; end if;
 if p_status not in ('planned','live','completed','cancelled') then raise exception 'INVALID_MEETING_STATUS'; end if;
 if v_meeting.status in ('completed','cancelled') and p_status<>v_meeting.status then raise exception 'MEETING_FINALIZED_STATUS_IMMUTABLE'; end if;
 if v_meeting.status='live' and p_status='planned' then raise exception 'MEETING_STATUS_BACKWARD_DENIED'; end if;
 if p_attendee_ids is not null and v_meeting.status not in ('completed','cancelled') then
   select array_agg(distinct user_id) into v_attendees from unnest(coalesce(p_attendee_ids,array[]::uuid[])||array[v_meeting.created_by]) x(user_id);
   foreach v_user in array coalesce(v_attendees,array[v_meeting.created_by]) loop
     select wm.role into v_role from public.workspace_members wm where wm.workspace_id=v_meeting.workspace_id and wm.user_id=v_user and wm.status='active';
     if v_role is null then raise exception 'MEETING_ATTENDEE_NOT_ACTIVE'; end if;
     if v_meeting.project_id is not null and not app_private.user_can_access_project_v2(v_meeting.project_id,v_user) then raise exception 'MEETING_ATTENDEE_NO_PROJECT_ACCESS'; end if;
     if v_role='guest' and (v_meeting.project_id is null or p_visibility<>'shared') then raise exception 'GUEST_MEETING_REQUIRES_SHARED_PROJECT'; end if;
   end loop;
   delete from public.meeting_attendees ma where ma.meeting_id=p_meeting_id and ma.user_id<>v_meeting.created_by and not(ma.user_id=any(coalesce(v_attendees,array[]::uuid[])));
   foreach v_user in array coalesce(v_attendees,array[v_meeting.created_by]) loop
     insert into public.meeting_attendees(meeting_id,user_id,response) values(p_meeting_id,v_user,case when v_user=v_meeting.created_by then 'accepted' else 'pending' end) on conflict(meeting_id,user_id) do nothing;
   end loop;
 end if;
 update public.meetings set title=btrim(p_title),starts_at=p_starts_at,ends_at=p_ends_at,video_room=nullif(btrim(coalesce(p_video_room,'')),''),visibility=p_visibility,agenda=btrim(coalesce(p_agenda,'')),live_notes=btrim(coalesce(p_live_notes,'')),summary=btrim(coalesce(p_summary,'')),status=p_status where id=p_meeting_id;
 perform app_private.sync_meeting_conversation_members_v1(p_meeting_id);
 return jsonb_build_object('meeting_id',p_meeting_id,'status',p_status,'updated',true);
end;$$;

revoke all on function public.get_meeting_capabilities_v1(uuid) from public,anon;
revoke all on function public.update_meeting_v2(uuid,text,timestamptz,timestamptz,text,text,text,text,text,text,uuid[]) from public,anon;
grant execute on function public.get_meeting_capabilities_v1(uuid) to authenticated;
grant execute on function public.update_meeting_v2(uuid,text,timestamptz,timestamptz,text,text,text,text,text,text,uuid[]) to authenticated;

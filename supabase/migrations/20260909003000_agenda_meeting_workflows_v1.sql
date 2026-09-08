-- 2b2c / 4b4c — Agenda + secure meeting workflows v1

create or replace function public.get_agenda_items_v1(
  p_workspace_id uuid,
  p_from timestamptz default (now() - interval '90 days'),
  p_to timestamptz default (now() + interval '180 days')
)
returns table(
  item_type text,
  item_id uuid,
  project_id uuid,
  title text,
  event_at timestamptz,
  end_at timestamptz,
  date_only boolean,
  status text,
  priority text,
  visibility text,
  is_mine boolean,
  needs_attention boolean,
  route text,
  meta jsonb
)
language sql
stable
security invoker
set search_path=''
as $$
  with me as (
    select auth.uid() as user_id
  ),
  meeting_items as (
    select
      'meeting'::text as item_type,
      m.id as item_id,
      m.project_id,
      m.title,
      m.starts_at as event_at,
      m.ends_at as end_at,
      false as date_only,
      m.status,
      null::text as priority,
      m.visibility,
      exists(
        select 1 from public.meeting_attendees ma, me
        where ma.meeting_id=m.id and ma.user_id=me.user_id and ma.response <> 'declined'
      ) as is_mine,
      exists(
        select 1 from public.meeting_attendees ma, me
        where ma.meeting_id=m.id and ma.user_id=me.user_id and ma.response='pending'
      ) and m.status='planned' and m.starts_at >= now() as needs_attention,
      '#/calendar/meeting/' || m.id::text as route,
      jsonb_build_object(
        'created_by',m.created_by,
        'video_room',m.video_room,
        'agenda',m.agenda,
        'attendee_response',(
          select ma.response from public.meeting_attendees ma, me
          where ma.meeting_id=m.id and ma.user_id=me.user_id limit 1
        )
      ) as meta
    from public.meetings m
    where m.workspace_id=p_workspace_id
      and app_private.can_access_meeting(m.id)
      and m.starts_at is not null
      and m.starts_at between p_from and p_to
  ),
  action_items as (
    select
      'action'::text,
      a.id,
      a.project_id,
      a.title,
      a.due_at,
      null::timestamptz,
      false,
      a.status,
      a.priority,
      a.visibility,
      exists(select 1 from public.action_assignees aa, me where aa.action_id=a.id and aa.user_id=me.user_id),
      exists(select 1 from public.action_assignees aa, me where aa.action_id=a.id and aa.user_id=me.user_id)
        and a.status not in ('done','cancelled')
        and (a.status='blocked' or a.due_at < now() or a.due_at <= now()+interval '48 hours'),
      '#/projects/' || a.project_id::text || '/work/list',
      jsonb_build_object('blocked_reason',a.blocked_reason,'description',a.description,'created_by',a.created_by)
    from public.actions a
    where a.workspace_id=p_workspace_id
      and app_private.can_access_project(a.project_id)
      and a.due_at is not null
      and a.due_at between p_from and p_to
      and a.status <> 'cancelled'
  ),
  milestone_items as (
    select
      'milestone'::text,
      m.id,
      m.project_id,
      m.title,
      (m.due_date::timestamp + interval '12 hours') at time zone 'UTC',
      null::timestamptz,
      true,
      m.status,
      null::text,
      m.visibility,
      m.owner_id=(select user_id from me),
      m.owner_id=(select user_id from me) and m.status not in ('done','cancelled') and m.due_date <= current_date + 2,
      '#/projects/' || m.project_id::text || '/work/roadmap',
      jsonb_build_object('owner_id',m.owner_id,'description',m.description,'due_date',m.due_date)
    from public.milestones m
    where m.workspace_id=p_workspace_id
      and app_private.can_access_project(m.project_id)
      and m.due_date is not null
      and ((m.due_date::timestamp + interval '12 hours') at time zone 'UTC') between p_from and p_to
      and m.status <> 'cancelled'
  ),
  request_items as (
    select
      'request'::text,
      r.id,
      r.project_id,
      r.title,
      r.due_at,
      null::timestamptz,
      false,
      r.status,
      null::text,
      'internal'::text,
      r.recipient_id=(select user_id from me),
      r.recipient_id=(select user_id from me) and r.status='open' and r.due_at <= now()+interval '48 hours',
      '#/work',
      jsonb_build_object('requester_id',r.requester_id,'recipient_id',r.recipient_id,'body',r.body,'response_mode',r.response_mode)
    from public.requests r
    where r.workspace_id=p_workspace_id
      and r.due_at is not null
      and r.due_at between p_from and p_to
      and (r.requester_id=(select user_id from me) or r.recipient_id=(select user_id from me))
  ),
  project_target_items as (
    select
      'project_target'::text,
      p.id,
      p.id,
      p.name || ' · date cible',
      (p.target_date::timestamp + interval '12 hours') at time zone 'UTC',
      null::timestamptz,
      true,
      p.status,
      null::text,
      p.visibility,
      p.lead_user_id=(select user_id from me),
      p.lead_user_id=(select user_id from me) and p.status='active' and p.target_date <= current_date + 2,
      '#/projects/' || p.id::text || '/overview',
      jsonb_build_object('lead_user_id',p.lead_user_id,'target_date',p.target_date,'objective',p.objective)
    from public.projects p
    where p.workspace_id=p_workspace_id
      and app_private.can_access_project(p.id)
      and p.target_date is not null
      and ((p.target_date::timestamp + interval '12 hours') at time zone 'UTC') between p_from and p_to
      and p.status not in ('archived','completed')
  )
  select * from meeting_items
  union all select * from action_items
  union all select * from milestone_items
  union all select * from request_items
  union all select * from project_target_items
  order by event_at asc, item_type asc;
$$;

create or replace function public.create_meeting_with_attendees_v2(
  p_workspace_id uuid,
  p_title text,
  p_starts_at timestamptz,
  p_ends_at timestamptz default null,
  p_project_id uuid default null,
  p_video_room text default null,
  p_visibility text default 'internal',
  p_attendee_ids uuid[] default array[]::uuid[],
  p_agenda text default ''
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_actor uuid := auth.uid();
  v_meeting_id uuid;
  v_user uuid;
  v_role text;
  v_attendees uuid[];
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  if nullif(btrim(p_title),'') is null then raise exception 'MEETING_TITLE_REQUIRED'; end if;
  if p_starts_at is null then raise exception 'MEETING_START_REQUIRED'; end if;
  if p_ends_at is not null and p_ends_at < p_starts_at then raise exception 'MEETING_END_BEFORE_START'; end if;
  if p_visibility not in ('internal','shared') then raise exception 'INVALID_MEETING_VISIBILITY'; end if;

  if p_project_id is null then
    if not app_private.can_write_workspace(p_workspace_id) then raise exception 'WORKSPACE_WRITE_DENIED'; end if;
    if p_visibility <> 'internal' then raise exception 'WORKSPACE_MEETING_INTERNAL_ONLY'; end if;
  else
    if not exists(select 1 from public.projects p where p.id=p_project_id and p.workspace_id=p_workspace_id) then
      raise exception 'PROJECT_WORKSPACE_MISMATCH';
    end if;
    if not app_private.can_write_project(p_project_id) then raise exception 'PROJECT_WRITE_DENIED'; end if;
  end if;

  select array_agg(distinct user_id) into v_attendees
  from unnest(coalesce(p_attendee_ids,array[]::uuid[]) || array[v_actor]) as x(user_id);

  insert into public.meetings(
    workspace_id,project_id,title,status,starts_at,ends_at,video_room,visibility,agenda,created_by
  ) values (
    p_workspace_id,p_project_id,btrim(p_title),'planned',p_starts_at,p_ends_at,
    nullif(btrim(coalesce(p_video_room,'')),''),p_visibility,btrim(coalesce(p_agenda,'')),v_actor
  ) returning id into v_meeting_id;

  foreach v_user in array coalesce(v_attendees,array[v_actor]) loop
    select wm.role into v_role from public.workspace_members wm
    where wm.workspace_id=p_workspace_id and wm.user_id=v_user and wm.status='active';
    if v_role is null then raise exception 'MEETING_ATTENDEE_NOT_ACTIVE'; end if;
    if p_project_id is not null and not app_private.user_can_access_project_v2(p_project_id,v_user) then
      raise exception 'MEETING_ATTENDEE_NO_PROJECT_ACCESS';
    end if;
    if v_role='guest' and (p_project_id is null or p_visibility<>'shared') then
      raise exception 'GUEST_MEETING_REQUIRES_SHARED_PROJECT';
    end if;
    insert into public.meeting_attendees(meeting_id,user_id,response)
    values(v_meeting_id,v_user,case when v_user=v_actor then 'accepted' else 'pending' end);
  end loop;

  return v_meeting_id;
end;
$$;

create or replace function public.get_meeting_capabilities_v1(p_meeting_id uuid)
returns table(can_manage boolean, can_rsvp boolean, response text)
language sql
stable
security definer
set search_path=''
as $$
  select
    app_private.can_access_meeting(m.id) and (
      m.created_by=auth.uid()
      or app_private.can_manage_workspace(m.workspace_id)
      or (m.project_id is not null and app_private.can_write_project(m.project_id))
      or (m.project_id is null and app_private.can_write_workspace(m.workspace_id))
    ) as can_manage,
    app_private.can_access_meeting(m.id)
      and m.status='planned'
      and m.created_by<>auth.uid()
      and coalesce(ma.response,'') in ('pending','accepted','declined') as can_rsvp,
    ma.response
  from public.meetings m
  left join public.meeting_attendees ma on ma.meeting_id=m.id and ma.user_id=auth.uid()
  where m.id=p_meeting_id and app_private.can_access_meeting(m.id);
$$;

create or replace function public.set_meeting_response_v2(p_meeting_id uuid,p_response text)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_actor uuid := auth.uid();
  v_meeting public.meetings%rowtype;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_response not in ('accepted','declined') then raise exception 'INVALID_MEETING_RESPONSE'; end if;
  select * into v_meeting from public.meetings where id=p_meeting_id;
  if not found or not app_private.can_access_meeting(p_meeting_id) then raise exception 'MEETING_ACCESS_DENIED'; end if;
  if v_meeting.status <> 'planned' then raise exception 'MEETING_RSVP_CLOSED'; end if;
  if v_meeting.created_by=v_actor and p_response='declined' then raise exception 'MEETING_CREATOR_CANNOT_DECLINE'; end if;
  update public.meeting_attendees set response=p_response where meeting_id=p_meeting_id and user_id=v_actor;
  if not found then raise exception 'MEETING_ATTENDEE_REQUIRED'; end if;
end;
$$;

create or replace function public.update_meeting_v2(
  p_meeting_id uuid,
  p_title text,
  p_starts_at timestamptz,
  p_ends_at timestamptz default null,
  p_video_room text default null,
  p_visibility text default 'internal',
  p_agenda text default '',
  p_live_notes text default '',
  p_summary text default '',
  p_status text default 'planned',
  p_attendee_ids uuid[] default null
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_actor uuid := auth.uid();
  v_meeting public.meetings%rowtype;
  v_user uuid;
  v_role text;
  v_attendees uuid[];
  v_can_manage boolean;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_meeting from public.meetings where id=p_meeting_id for update;
  if not found or not app_private.can_access_meeting(p_meeting_id) then raise exception 'MEETING_ACCESS_DENIED'; end if;

  v_can_manage := v_meeting.created_by=v_actor
    or app_private.can_manage_workspace(v_meeting.workspace_id)
    or (v_meeting.project_id is not null and app_private.can_write_project(v_meeting.project_id))
    or (v_meeting.project_id is null and app_private.can_write_workspace(v_meeting.workspace_id));
  if not v_can_manage then raise exception 'MEETING_MANAGE_DENIED'; end if;

  if nullif(btrim(p_title),'') is null then raise exception 'MEETING_TITLE_REQUIRED'; end if;
  if p_starts_at is null then raise exception 'MEETING_START_REQUIRED'; end if;
  if p_ends_at is not null and p_ends_at < p_starts_at then raise exception 'MEETING_END_BEFORE_START'; end if;
  if p_visibility not in ('internal','shared') then raise exception 'INVALID_MEETING_VISIBILITY'; end if;
  if v_meeting.project_id is null and p_visibility <> 'internal' then raise exception 'WORKSPACE_MEETING_INTERNAL_ONLY'; end if;
  if p_status not in ('planned','live','completed','cancelled') then raise exception 'INVALID_MEETING_STATUS'; end if;
  if v_meeting.status in ('completed','cancelled') and p_status <> v_meeting.status then raise exception 'MEETING_FINALIZED_STATUS_IMMUTABLE'; end if;
  if v_meeting.status='live' and p_status='planned' then raise exception 'MEETING_STATUS_BACKWARD_DENIED'; end if;

  if p_attendee_ids is not null and v_meeting.status not in ('completed','cancelled') then
    select array_agg(distinct user_id) into v_attendees
    from unnest(coalesce(p_attendee_ids,array[]::uuid[]) || array[v_meeting.created_by]) as x(user_id);

    foreach v_user in array coalesce(v_attendees,array[v_meeting.created_by]) loop
      select wm.role into v_role from public.workspace_members wm
      where wm.workspace_id=v_meeting.workspace_id and wm.user_id=v_user and wm.status='active';
      if v_role is null then raise exception 'MEETING_ATTENDEE_NOT_ACTIVE'; end if;
      if v_meeting.project_id is not null and not app_private.user_can_access_project_v2(v_meeting.project_id,v_user) then
        raise exception 'MEETING_ATTENDEE_NO_PROJECT_ACCESS';
      end if;
      if v_role='guest' and (v_meeting.project_id is null or p_visibility<>'shared') then
        raise exception 'GUEST_MEETING_REQUIRES_SHARED_PROJECT';
      end if;
    end loop;

    delete from public.meeting_attendees ma
    where ma.meeting_id=p_meeting_id and ma.user_id <> v_meeting.created_by
      and not (ma.user_id=any(coalesce(v_attendees,array[]::uuid[])));

    foreach v_user in array coalesce(v_attendees,array[v_meeting.created_by]) loop
      insert into public.meeting_attendees(meeting_id,user_id,response)
      values(p_meeting_id,v_user,case when v_user=v_meeting.created_by then 'accepted' else 'pending' end)
      on conflict (meeting_id,user_id) do nothing;
    end loop;
  end if;

  update public.meetings set
    title=btrim(p_title),
    starts_at=p_starts_at,
    ends_at=p_ends_at,
    video_room=nullif(btrim(coalesce(p_video_room,'')),''),
    visibility=p_visibility,
    agenda=btrim(coalesce(p_agenda,'')),
    live_notes=btrim(coalesce(p_live_notes,'')),
    summary=btrim(coalesce(p_summary,'')),
    status=p_status
  where id=p_meeting_id;

  perform app_private.sync_meeting_conversation_members_v1(p_meeting_id);
  return jsonb_build_object('meeting_id',p_meeting_id,'status',p_status,'updated',true);
end;
$$;

revoke all on function public.get_agenda_items_v1(uuid,timestamptz,timestamptz) from public, anon;
revoke all on function public.create_meeting_with_attendees_v2(uuid,text,timestamptz,timestamptz,uuid,text,text,uuid[],text) from public, anon;
revoke all on function public.get_meeting_capabilities_v1(uuid) from public, anon;
revoke all on function public.set_meeting_response_v2(uuid,text) from public, anon;
revoke all on function public.update_meeting_v2(uuid,text,timestamptz,timestamptz,text,text,text,text,text,text,uuid[]) from public, anon;

grant execute on function public.get_agenda_items_v1(uuid,timestamptz,timestamptz) to authenticated;
grant execute on function public.create_meeting_with_attendees_v2(uuid,text,timestamptz,timestamptz,uuid,text,text,uuid[],text) to authenticated;
grant execute on function public.get_meeting_capabilities_v1(uuid) to authenticated;
grant execute on function public.set_meeting_response_v2(uuid,text) to authenticated;
grant execute on function public.update_meeting_v2(uuid,text,timestamptz,timestamptz,text,text,text,text,text,text,uuid[]) to authenticated;

create index if not exists meetings_workspace_starts_at_idx on public.meetings(workspace_id,starts_at) where starts_at is not null;
create index if not exists actions_workspace_due_at_idx on public.actions(workspace_id,due_at) where due_at is not null;
create index if not exists milestones_workspace_due_date_idx on public.milestones(workspace_id,due_date) where due_date is not null;
create index if not exists requests_workspace_due_at_idx on public.requests(workspace_id,due_at) where due_at is not null;

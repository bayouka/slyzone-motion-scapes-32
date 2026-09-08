-- Communication V3: secure contextual messaging workflows.
-- Replays the production state introduced by migration 20260908213711.

create or replace function app_private.can_announce_conversation_v1(p_conversation_id uuid,p_user_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select p_user_id is not null and exists (
    select 1
    from public.conversations c
    join public.workspace_members wm on wm.workspace_id=c.workspace_id and wm.user_id=p_user_id and wm.status='active'
    left join public.projects p on p.id=c.project_id
    where c.id=p_conversation_id
      and c.kind in ('team','project')
      and (wm.role in ('owner','admin') or (c.kind='project' and p.lead_user_id=p_user_id))
      and app_private.user_can_access_conversation_v2(c.id,p_user_id)
  );
$$;

create or replace function app_private.notify_mention_v2()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_conversation uuid; v_announcement boolean:=false; v_level text:='all'; v_route text:='/work';
begin
  if new.message_id is not null then
    select m.conversation_id,m.is_announcement into v_conversation,v_announcement from public.messages m where m.id=new.message_id;
    select coalesce(cm.notification_level,'all') into v_level from public.conversation_members cm where cm.conversation_id=v_conversation and cm.user_id=new.mentioned_user_id;
    if v_level='muted' then return new; end if;
    if v_announcement and v_level='all' then return new; end if;
    if v_conversation is not null then v_route:='/messages/'||v_conversation||'/message/'||new.message_id; end if;
  end if;
  insert into public.notifications(workspace_id,user_id,kind,title,route)
  values(new.workspace_id,new.mentioned_user_id,'mention','Vous avez été mentionné',v_route);
  return new;
end;$$;

create or replace function app_private.sync_message_mentions_v3(p_message_id uuid,p_user_ids uuid[])
returns void language plpgsql security definer set search_path='' as $$
declare v_message public.messages%rowtype; v_user uuid; v_keep uuid[]; v_route text;
begin
  select * into v_message from public.messages where id=p_message_id;
  if not found then raise exception 'MESSAGE_NOT_FOUND'; end if;
  select coalesce(array_agg(distinct x),array[]::uuid[]) into v_keep
  from unnest(coalesce(p_user_ids,array[]::uuid[])) x where x is not null and x<>v_message.author_id;
  if coalesce(array_length(v_keep,1),0)>20 then raise exception 'MESSAGE_MENTION_LIMIT'; end if;
  foreach v_user in array v_keep loop
    if not app_private.user_can_access_conversation_v2(v_message.conversation_id,v_user) then raise exception 'MENTION_TARGET_CANNOT_READ_SOURCE'; end if;
  end loop;
  v_route := '/messages/'||v_message.conversation_id||'/message/'||v_message.id;
  delete from public.notifications n
   where n.kind='mention' and n.route=v_route and n.read_at is null
     and n.user_id in (select mn.mentioned_user_id from public.mentions mn where mn.message_id=p_message_id and not (mn.mentioned_user_id=any(v_keep)));
  delete from public.mentions mn where mn.message_id=p_message_id and not (mn.mentioned_user_id=any(v_keep));
  foreach v_user in array v_keep loop
    insert into public.mentions(workspace_id,mentioned_user_id,mentioned_by,message_id)
    values(v_message.workspace_id,v_user,v_message.author_id,p_message_id)
    on conflict (message_id,mentioned_user_id) do nothing;
  end loop;
end;$$;

create or replace function app_private.validate_conversation_update_v2()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.workspace_id is distinct from old.workspace_id
     or new.project_id is distinct from old.project_id
     or new.kind is distinct from old.kind
     or new.context_type is distinct from old.context_type
     or new.context_id is distinct from old.context_id
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at
     or new.is_general is distinct from old.is_general
     or new.direct_pair_key is distinct from old.direct_pair_key then
    raise exception 'CONVERSATION_CONTEXT_IMMUTABLE';
  end if;
  if new.linked_project_id is distinct from old.linked_project_id then
    if new.kind<>'direct' or coalesce(current_setting('app.allow_conversation_project_link',true),'0')<>'1' then
      raise exception 'CONVERSATION_PROJECT_LINK_USE_WORKFLOW';
    end if;
  end if;
  return new;
end;$$;

create unique index if not exists conversations_context_unique_v1
on public.conversations(workspace_id,context_type,context_id)
where kind='context' and context_type is not null and context_id is not null;

create or replace function app_private.sync_meeting_conversation_members_v1(p_meeting_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_conv uuid; v_creator uuid;
begin
  select c.id into v_conv from public.conversations c where c.kind='context' and c.context_type='meeting' and c.context_id=p_meeting_id;
  if v_conv is null then return; end if;
  select m.created_by into v_creator from public.meetings m where m.id=p_meeting_id;
  if v_creator is null then return; end if;
  delete from public.conversation_members cm
   where cm.conversation_id=v_conv and cm.user_id<>v_creator
     and not exists(select 1 from public.meeting_attendees ma where ma.meeting_id=p_meeting_id and ma.user_id=cm.user_id);
  insert into public.conversation_members(conversation_id,user_id,last_read_at)
  select v_conv,x.user_id,now()
  from (select v_creator user_id union select ma.user_id from public.meeting_attendees ma where ma.meeting_id=p_meeting_id) x
  join public.workspace_members wm on wm.user_id=x.user_id and wm.status='active'
  join public.meetings m on m.id=p_meeting_id and m.workspace_id=wm.workspace_id
  on conflict (conversation_id,user_id) do nothing;
end;$$;

create or replace function app_private.sync_meeting_conversation_member_trigger_v1()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  perform app_private.sync_meeting_conversation_members_v1(coalesce(new.meeting_id,old.meeting_id));
  return coalesce(new,old);
end;$$;

drop trigger if exists trg_sync_meeting_conversation_members_v1 on public.meeting_attendees;
create trigger trg_sync_meeting_conversation_members_v1
after insert or delete on public.meeting_attendees
for each row execute function app_private.sync_meeting_conversation_member_trigger_v1();

create or replace function public.send_message_v3(
  p_conversation_id uuid,p_body text,p_format text default 'chat',p_subject text default null,
  p_is_announcement boolean default false,p_reply_to_id uuid default null,
  p_mentioned_user_ids uuid[] default array[]::uuid[],p_attachments jsonb default '[]'::jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare
  v_actor uuid:=auth.uid(); v_conversation public.conversations%rowtype; v_message_id uuid;
  v_attachment jsonb; v_path text; v_name text; v_mime text; v_size bigint; v_total bigint:=0; v_count int:=0;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_conversation from public.conversations where id=p_conversation_id;
  if not found or not app_private.user_can_access_conversation_v2(p_conversation_id,v_actor) then raise exception 'CONVERSATION_ACCESS_DENIED'; end if;
  if v_conversation.status='archived' then raise exception 'CONVERSATION_ARCHIVED'; end if;
  if coalesce(p_is_announcement,false) then
    if not app_private.can_announce_conversation_v1(p_conversation_id,v_actor) then raise exception 'ANNOUNCEMENT_PERMISSION_DENIED'; end if;
    if p_format<>'structured' then raise exception 'ANNOUNCEMENT_FORMAT_INVALID'; end if;
  elsif p_format<>'chat' then raise exception 'MESSAGE_FORMAT_INVALID'; end if;
  if jsonb_typeof(coalesce(p_attachments,'[]'::jsonb))<>'array' then raise exception 'MESSAGE_ATTACHMENTS_INVALID'; end if;
  v_count:=jsonb_array_length(coalesce(p_attachments,'[]'::jsonb));
  if v_count>10 then raise exception 'MESSAGE_ATTACHMENT_LIMIT'; end if;
  for v_attachment in select value from jsonb_array_elements(coalesce(p_attachments,'[]'::jsonb)) loop
    v_path:=nullif(btrim(coalesce(v_attachment->>'storage_path','')),'');
    v_name:=nullif(btrim(coalesce(v_attachment->>'file_name','')),'');
    v_mime:=nullif(btrim(coalesce(v_attachment->>'mime_type','')),'');
    begin v_size:=coalesce((v_attachment->>'size_bytes')::bigint,0); exception when others then raise exception 'MESSAGE_ATTACHMENT_SIZE_INVALID'; end;
    if v_path is null or v_name is null or char_length(v_name)>255 then raise exception 'MESSAGE_ATTACHMENT_INVALID'; end if;
    if v_size<0 or v_size>25*1024*1024 then raise exception 'MESSAGE_ATTACHMENT_TOO_LARGE'; end if;
    v_total:=v_total+v_size; if v_total>100*1024*1024 then raise exception 'MESSAGE_ATTACHMENTS_TOTAL_TOO_LARGE'; end if;
    if v_path not like v_conversation.workspace_id::text||'/messages/'||v_conversation.id::text||'/%' then raise exception 'MESSAGE_ATTACHMENT_PATH_INVALID'; end if;
  end loop;
  insert into public.messages(workspace_id,conversation_id,author_id,body,reply_to_id,format,subject,is_announcement)
  values(v_conversation.workspace_id,p_conversation_id,v_actor,p_body,p_reply_to_id,p_format,p_subject,coalesce(p_is_announcement,false)) returning id into v_message_id;
  perform app_private.sync_message_mentions_v3(v_message_id,p_mentioned_user_ids);
  for v_attachment in select value from jsonb_array_elements(coalesce(p_attachments,'[]'::jsonb)) loop
    v_path:=btrim(v_attachment->>'storage_path'); v_name:=btrim(v_attachment->>'file_name');
    v_mime:=nullif(btrim(coalesce(v_attachment->>'mime_type','')),''); v_size:=coalesce((v_attachment->>'size_bytes')::bigint,0);
    insert into public.attachments(workspace_id,message_id,storage_path,file_name,mime_type,size_bytes,created_by)
    values(v_conversation.workspace_id,v_message_id,v_path,v_name,v_mime,v_size,v_actor);
  end loop;
  return v_message_id;
end;$$;

create or replace function public.edit_message_v3(p_message_id uuid,p_body text,p_subject text default null,p_mentioned_user_ids uuid[] default array[]::uuid[])
returns void language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid(); v_message public.messages%rowtype;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_message from public.messages where id=p_message_id for update;
  if not found or v_message.author_id<>v_actor or not app_private.can_access_conversation(v_message.conversation_id) then raise exception 'MESSAGE_EDIT_DENIED'; end if;
  if v_message.deleted_at is not null then raise exception 'MESSAGE_DELETED'; end if;
  if v_message.is_announcement and not app_private.can_announce_conversation_v1(v_message.conversation_id,v_actor) then raise exception 'ANNOUNCEMENT_PERMISSION_DENIED'; end if;
  update public.messages set body=p_body,subject=case when format='structured' then p_subject else null end,edited_at=now() where id=p_message_id;
  perform app_private.sync_message_mentions_v3(p_message_id,p_mentioned_user_ids);
end;$$;

create or replace function public.delete_message_v3(p_message_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid(); v_message public.messages%rowtype; v_route text;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_message from public.messages where id=p_message_id for update;
  if not found or v_message.author_id<>v_actor or not app_private.can_access_conversation(v_message.conversation_id) then raise exception 'MESSAGE_DELETE_DENIED'; end if;
  if v_message.deleted_at is not null then return; end if;
  update public.messages set deleted_at=now() where id=p_message_id;
  v_route:='/messages/'||v_message.conversation_id||'/message/'||v_message.id;
  delete from public.notifications where route=v_route and kind in ('mention','announcement') and read_at is null;
  delete from public.mentions where message_id=p_message_id;
end;$$;

create or replace function public.mark_conversation_read_v3(p_conversation_id uuid,p_seen_at timestamptz default now())
returns void language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid(); v_seen timestamptz:=coalesce(p_seen_at,now()); v_workspace uuid;
begin
  if v_actor is null or not app_private.can_access_conversation(p_conversation_id) then raise exception 'CONVERSATION_ACCESS_DENIED'; end if;
  select workspace_id into v_workspace from public.conversations where id=p_conversation_id;
  insert into public.conversation_members(conversation_id,user_id,last_read_at,hidden_at)
  values(p_conversation_id,v_actor,v_seen,null)
  on conflict (conversation_id,user_id) do update set last_read_at=greatest(coalesce(public.conversation_members.last_read_at,'epoch'::timestamptz),excluded.last_read_at),hidden_at=null;
  update public.mentions mn set read_at=coalesce(mn.read_at,v_seen)
  from public.messages m where mn.message_id=m.id and mn.mentioned_user_id=v_actor and mn.read_at is null and m.conversation_id=p_conversation_id and m.created_at<=v_seen;
  update public.notifications n set read_at=coalesce(n.read_at,v_seen)
  where n.workspace_id=v_workspace and n.user_id=v_actor and n.read_at is null and n.kind in ('mention','announcement') and n.route like '/messages/'||p_conversation_id::text||'/message/%';
end;$$;

create or replace function public.get_conversation_capabilities_v1(p_conversation_id uuid)
returns table(can_manage boolean,can_announce boolean,can_link_project boolean)
language sql stable security definer set search_path='' as $$
  select app_private.can_manage_conversation(p_conversation_id),app_private.can_announce_conversation_v1(p_conversation_id,auth.uid()),
         exists(select 1 from public.conversations c where c.id=p_conversation_id and c.kind='direct') and app_private.can_access_conversation(p_conversation_id);
$$;

create or replace function public.link_direct_to_project_v3(p_conversation_id uuid,p_project_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid(); v_conversation public.conversations%rowtype; v_project public.projects%rowtype; v_missing int;
begin
  if v_actor is null or not app_private.can_access_conversation(p_conversation_id) then raise exception 'CONVERSATION_ACCESS_DENIED'; end if;
  select * into v_conversation from public.conversations where id=p_conversation_id;
  if not found or v_conversation.kind<>'direct' then raise exception 'DIRECT_REQUIRED'; end if;
  select * into v_project from public.projects where id=p_project_id;
  if not found or v_project.workspace_id is distinct from v_conversation.workspace_id then raise exception 'PROJECT_WORKSPACE_MISMATCH'; end if;
  if not app_private.user_can_access_project_v2(p_project_id,v_actor) then raise exception 'PROJECT_ACCESS_DENIED'; end if;
  select count(*) into v_missing from public.conversation_members cm where cm.conversation_id=p_conversation_id and not app_private.user_can_access_project_v2(p_project_id,cm.user_id);
  if v_missing>0 then raise exception 'DIRECT_PROJECT_NOT_SHARED_BY_ALL_PARTICIPANTS'; end if;
  perform set_config('app.allow_conversation_project_link','1',true);
  update public.conversations set linked_project_id=p_project_id where id=p_conversation_id;
  perform set_config('app.allow_conversation_project_link','0',true);
end;$$;

create or replace function public.search_messages_v1(p_workspace_id uuid,p_query text,p_project_id uuid default null,p_kind text default null,p_limit integer default 40)
returns table(message_id uuid,conversation_id uuid,author_id uuid,body text,subject text,created_at timestamptz,conversation_kind text,conversation_title text,project_id uuid,linked_project_id uuid,context_type text,context_id uuid)
language plpgsql stable security definer set search_path='' as $$
declare v_actor uuid:=auth.uid(); v_q text:=lower(btrim(coalesce(p_query,''))); v_limit int:=least(greatest(coalesce(p_limit,40),1),100);
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  if char_length(v_q)<2 then raise exception 'SEARCH_QUERY_TOO_SHORT'; end if;
  if not exists(select 1 from public.workspace_members wm where wm.workspace_id=p_workspace_id and wm.user_id=v_actor and wm.status='active') then raise exception 'WORKSPACE_ACCESS_DENIED'; end if;
  if p_kind is not null and p_kind not in ('team','project','direct','context') then raise exception 'CONVERSATION_KIND_INVALID'; end if;
  return query
  select m.id,m.conversation_id,m.author_id,m.body,m.subject,m.created_at,c.kind,c.title,c.project_id,c.linked_project_id,c.context_type,c.context_id
  from public.messages m join public.conversations c on c.id=m.conversation_id
  where m.workspace_id=p_workspace_id and m.deleted_at is null and c.status<>'archived'
    and app_private.user_can_access_conversation_v2(c.id,v_actor)
    and (p_project_id is null or c.project_id=p_project_id or c.linked_project_id=p_project_id)
    and (p_kind is null or c.kind=p_kind)
    and lower(coalesce(m.subject,'')||' '||m.body) like '%'||v_q||'%'
  order by m.created_at desc limit v_limit;
end;$$;

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
      values(v_meeting.workspace_id,'context','Réunion · '||v_meeting.title,'meeting',p_meeting_id,v_meeting.project_id,v_actor) returning id into v_id;
    exception when unique_violation then
      select c.id into v_id from public.conversations c where c.workspace_id=v_meeting.workspace_id and c.kind='context' and c.context_type='meeting' and c.context_id=p_meeting_id;
    end;
  end if;
  perform app_private.sync_meeting_conversation_members_v1(p_meeting_id);
  return v_id;
end;$$;

revoke all on function public.send_message_v3(uuid,text,text,text,boolean,uuid,uuid[],jsonb) from public,anon;
revoke all on function public.edit_message_v3(uuid,text,text,uuid[]) from public,anon;
revoke all on function public.delete_message_v3(uuid) from public,anon;
revoke all on function public.mark_conversation_read_v3(uuid,timestamptz) from public,anon;
revoke all on function public.get_conversation_capabilities_v1(uuid) from public,anon;
revoke all on function public.link_direct_to_project_v3(uuid,uuid) from public,anon;
revoke all on function public.search_messages_v1(uuid,text,uuid,text,integer) from public,anon;
revoke all on function public.get_or_create_meeting_conversation_v1(uuid) from public,anon;
grant execute on function public.send_message_v3(uuid,text,text,text,boolean,uuid,uuid[],jsonb) to authenticated,service_role;
grant execute on function public.edit_message_v3(uuid,text,text,uuid[]) to authenticated,service_role;
grant execute on function public.delete_message_v3(uuid) to authenticated,service_role;
grant execute on function public.mark_conversation_read_v3(uuid,timestamptz) to authenticated,service_role;
grant execute on function public.get_conversation_capabilities_v1(uuid) to authenticated,service_role;
grant execute on function public.link_direct_to_project_v3(uuid,uuid) to authenticated,service_role;
grant execute on function public.search_messages_v1(uuid,text,uuid,text,integer) to authenticated,service_role;
grant execute on function public.get_or_create_meeting_conversation_v1(uuid) to authenticated,service_role;

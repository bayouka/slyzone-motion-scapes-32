-- Route legacy messaging RPCs through Communication V3 so older clients cannot bypass V3 rules.
create or replace function public.send_message_v2(p_conversation_id uuid,p_body text,p_format text default 'chat',p_subject text default null,p_is_announcement boolean default false,p_reply_to_id uuid default null)
returns uuid language plpgsql security definer set search_path='' as $$
begin
  return public.send_message_v3(p_conversation_id,p_body,p_format,p_subject,p_is_announcement,p_reply_to_id,array[]::uuid[],'[]'::jsonb);
end;$$;

create or replace function public.send_message_with_mentions_v2(p_conversation_id uuid,p_body text,p_format text default 'chat',p_subject text default null,p_is_announcement boolean default false,p_reply_to_id uuid default null,p_mentioned_user_ids uuid[] default array[]::uuid[])
returns uuid language plpgsql security definer set search_path='' as $$
begin
  return public.send_message_v3(p_conversation_id,p_body,p_format,p_subject,p_is_announcement,p_reply_to_id,p_mentioned_user_ids,'[]'::jsonb);
end;$$;

create or replace function public.edit_message_v2(p_message_id uuid,p_body text,p_subject text default null)
returns void language plpgsql security definer set search_path='' as $$
declare v_mentions uuid[];
begin
  select coalesce(array_agg(mn.mentioned_user_id),array[]::uuid[]) into v_mentions from public.mentions mn where mn.message_id=p_message_id;
  perform public.edit_message_v3(p_message_id,p_body,p_subject,v_mentions);
end;$$;

create or replace function public.delete_message_v2(p_message_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
  perform public.delete_message_v3(p_message_id);
end;$$;

create or replace function public.mark_conversation_read_v2(p_conversation_id uuid,p_seen_at timestamptz default now())
returns void language plpgsql security definer set search_path='' as $$
begin
  perform public.mark_conversation_read_v3(p_conversation_id,p_seen_at);
end;$$;

create or replace function public.link_direct_to_project_v2(p_conversation_id uuid,p_project_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
  perform public.link_direct_to_project_v3(p_conversation_id,p_project_id);
end;$$;

create or replace function public.add_attachment_to_message_v2(p_message_id uuid,p_storage_path text,p_file_name text,p_mime_type text default null,p_size_bytes bigint default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_message public.messages%rowtype; v_conversation public.conversations%rowtype; v_id uuid; v_size bigint:=coalesce(p_size_bytes,0);
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_message from public.messages where id=p_message_id;
  if not found or v_message.author_id<>auth.uid() or not app_private.can_access_conversation(v_message.conversation_id) then raise exception 'ATTACHMENT_MESSAGE_AUTHOR_REQUIRED'; end if;
  select * into v_conversation from public.conversations where id=v_message.conversation_id;
  if nullif(btrim(coalesce(p_storage_path,'')),'') is null or p_storage_path not like v_message.workspace_id::text||'/messages/'||v_message.conversation_id::text||'/%' then raise exception 'MESSAGE_ATTACHMENT_PATH_INVALID'; end if;
  if nullif(btrim(coalesce(p_file_name,'')),'') is null or char_length(btrim(p_file_name))>255 then raise exception 'MESSAGE_ATTACHMENT_INVALID'; end if;
  if v_size<0 or v_size>25*1024*1024 then raise exception 'MESSAGE_ATTACHMENT_TOO_LARGE'; end if;
  insert into public.attachments(workspace_id,message_id,storage_path,file_name,mime_type,size_bytes,created_by)
  values(v_message.workspace_id,p_message_id,btrim(p_storage_path),btrim(p_file_name),nullif(btrim(coalesce(p_mime_type,'')),''),p_size_bytes,auth.uid()) returning id into v_id;
  return v_id;
end;$$;

revoke all on function public.send_message_v2(uuid,text,text,text,boolean,uuid) from public,anon;
revoke all on function public.send_message_with_mentions_v2(uuid,text,text,text,boolean,uuid,uuid[]) from public,anon;
revoke all on function public.edit_message_v2(uuid,text,text) from public,anon;
revoke all on function public.delete_message_v2(uuid) from public,anon;
revoke all on function public.mark_conversation_read_v2(uuid,timestamptz) from public,anon;
revoke all on function public.link_direct_to_project_v2(uuid,uuid) from public,anon;
revoke all on function public.add_attachment_to_message_v2(uuid,text,text,text,bigint) from public,anon;
grant execute on function public.send_message_v2(uuid,text,text,text,boolean,uuid) to authenticated,service_role;
grant execute on function public.send_message_with_mentions_v2(uuid,text,text,text,boolean,uuid,uuid[]) to authenticated,service_role;
grant execute on function public.edit_message_v2(uuid,text,text) to authenticated,service_role;
grant execute on function public.delete_message_v2(uuid) to authenticated,service_role;
grant execute on function public.mark_conversation_read_v2(uuid,timestamptz) to authenticated,service_role;
grant execute on function public.link_direct_to_project_v2(uuid,uuid) to authenticated,service_role;
grant execute on function public.add_attachment_to_message_v2(uuid,text,text,text,bigint) to authenticated,service_role;

-- DRAFT ONLY — DO NOT APPLY TO THE LIVE V4.2.2 DATABASE.
-- Communication v2 / Migration 003: message formats, integrity and safe editing.

begin;

alter table public.messages
  add column if not exists format text not null default 'chat',
  add column if not exists subject text,
  add column if not exists is_announcement boolean not null default false,
  add column if not exists deleted_at timestamptz;

alter table public.messages drop constraint if exists messages_format_check_v2;
alter table public.messages
  add constraint messages_format_check_v2
  check (format in ('chat','structured'));

alter table public.messages drop constraint if exists messages_subject_length_v2;
alter table public.messages
  add constraint messages_subject_length_v2
  check (subject is null or (char_length(btrim(subject)) between 1 and 240));

create index if not exists messages_conversation_unread_v2
  on public.messages(conversation_id, created_at, id)
  where deleted_at is null;

create index if not exists messages_structured_v2
  on public.messages(conversation_id, created_at desc)
  where format='structured' and deleted_at is null;

create or replace function app_private.validate_message_v2()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conversation public.conversations%rowtype;
  v_reply_conversation uuid;
begin
  if tg_op = 'UPDATE' then
    if new.workspace_id is distinct from old.workspace_id
       or new.conversation_id is distinct from old.conversation_id
       or new.author_id is distinct from old.author_id
       or new.created_at is distinct from old.created_at
       or new.reply_to_id is distinct from old.reply_to_id
       or new.format is distinct from old.format
       or new.is_announcement is distinct from old.is_announcement then
      raise exception 'MESSAGE_IMMUTABLE_FIELDS';
    end if;
  end if;

  select * into v_conversation from public.conversations where id=new.conversation_id;
  if not found then raise exception 'CONVERSATION_NOT_FOUND'; end if;
  if v_conversation.workspace_id is distinct from new.workspace_id then raise exception 'MESSAGE_WORKSPACE_MISMATCH'; end if;

  new.body := btrim(new.body);
  if char_length(new.body) < 1 or char_length(new.body) > 20000 then raise exception 'MESSAGE_BODY_INVALID'; end if;

  if new.format='chat' then
    if new.subject is not null or new.is_announcement then raise exception 'CHAT_MESSAGE_SHAPE_INVALID'; end if;
  else
    new.subject := nullif(btrim(coalesce(new.subject,'')),'');
    if new.subject is null then raise exception 'STRUCTURED_MESSAGE_SUBJECT_REQUIRED'; end if;
  end if;

  if new.is_announcement and v_conversation.kind not in ('team','project') then
    raise exception 'ANNOUNCEMENT_AUDIENCE_INVALID';
  end if;

  if new.reply_to_id is not null then
    select conversation_id into v_reply_conversation from public.messages where id=new.reply_to_id;
    if v_reply_conversation is null or v_reply_conversation is distinct from new.conversation_id then
      raise exception 'MESSAGE_REPLY_CROSS_CONVERSATION';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function app_private.validate_message_v2() from public, anon, authenticated;

drop trigger if exists trg_validate_message_v2 on public.messages;
create trigger trg_validate_message_v2
before insert or update on public.messages
for each row execute function app_private.validate_message_v2();

create or replace function app_private.touch_conversation_from_message_v2()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversations
  set last_message_at=new.created_at, updated_at=greatest(updated_at,new.created_at)
  where id=new.conversation_id;
  return new;
end;
$$;

revoke all on function app_private.touch_conversation_from_message_v2() from public, anon, authenticated;

drop trigger if exists trg_touch_conversation_from_message_v2 on public.messages;
create trigger trg_touch_conversation_from_message_v2
after insert on public.messages
for each row execute function app_private.touch_conversation_from_message_v2();

-- Tighten the existing author edit policy and make sensitive columns immutable
-- from ordinary client UPDATE calls.
drop policy if exists messages_update on public.messages;
create policy messages_update_author_v2 on public.messages
for update
using (author_id=auth.uid() and deleted_at is null and app_private.can_access_conversation(conversation_id))
with check (author_id=auth.uid() and app_private.can_access_conversation(conversation_id));

revoke update on public.messages from authenticated;
grant update(body,subject,edited_at,deleted_at) on public.messages to authenticated;

create or replace function public.send_message_v2(
  p_conversation_id uuid,
  p_body text,
  p_format text default 'chat',
  p_subject text default null,
  p_is_announcement boolean default false,
  p_reply_to_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid:=auth.uid();
  v_workspace uuid;
  v_id uuid;
begin
  if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
  if not app_private.can_access_conversation(p_conversation_id) then raise exception 'CONVERSATION_ACCESS_DENIED'; end if;
  select workspace_id into v_workspace from public.conversations where id=p_conversation_id;

  insert into public.messages(workspace_id,conversation_id,author_id,body,reply_to_id,format,subject,is_announcement)
  values(v_workspace,p_conversation_id,v_actor,p_body,p_reply_to_id,p_format,p_subject,coalesce(p_is_announcement,false))
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.edit_message_v2(
  p_message_id uuid,
  p_body text,
  p_subject text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_message public.messages%rowtype;
begin
  select * into v_message from public.messages where id=p_message_id for update;
  if not found or v_message.author_id<>auth.uid() or not app_private.can_access_conversation(v_message.conversation_id) then
    raise exception 'MESSAGE_EDIT_DENIED';
  end if;
  if v_message.deleted_at is not null then raise exception 'MESSAGE_DELETED'; end if;

  update public.messages
  set body=p_body,
      subject=case when format='structured' then p_subject else null end,
      edited_at=now()
  where id=p_message_id;
end;
$$;

create or replace function public.delete_message_v2(p_message_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_message public.messages%rowtype;
begin
  select * into v_message from public.messages where id=p_message_id for update;
  if not found or v_message.author_id<>auth.uid() or not app_private.can_access_conversation(v_message.conversation_id) then
    raise exception 'MESSAGE_DELETE_DENIED';
  end if;
  update public.messages set deleted_at=coalesce(deleted_at,now()) where id=p_message_id;
end;
$$;

revoke all on function public.send_message_v2(uuid,text,text,text,boolean,uuid) from public, anon;
revoke all on function public.edit_message_v2(uuid,text,text) from public, anon;
revoke all on function public.delete_message_v2(uuid) from public, anon;
grant execute on function public.send_message_v2(uuid,text,text,text,boolean,uuid) to authenticated;
grant execute on function public.edit_message_v2(uuid,text,text) to authenticated;
grant execute on function public.delete_message_v2(uuid) to authenticated;

commit;

-- 2b2c Communication V4 — C1 rollback candidate V0.1
-- SAFE ONLY BEFORE ANY USER V4 DATA EXISTS.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.conversations
    WHERE parent_conversation_id IS NOT NULL OR source_message_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'COMMUNICATION_V4_ROLLBACK_BLOCKED_BY_LINEAGE_DATA';
  END IF;
  IF to_regclass('public.conversation_focus_members') IS NOT NULL
     AND EXISTS (SELECT 1 FROM public.conversation_focus_members) THEN
    RAISE EXCEPTION 'COMMUNICATION_V4_ROLLBACK_BLOCKED_BY_FOCUS_DATA';
  END IF;
END
$$;

-- Restore the production V3 message validator exactly as audited before C1.
create or replace function app_private.validate_message_v2()
returns trigger
language plpgsql
security definer
set search_path=''
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

drop trigger if exists trg_auto_follow_discussion_author_v1 on public.messages;
drop function if exists app_private.auto_follow_discussion_author_v1();

drop function if exists public.mark_conversation_read_v4(uuid,uuid);
drop function if exists public.reopen_discussion_v1(uuid);
drop function if exists public.resolve_discussion_v1(uuid);
drop function if exists public.set_conversation_follow_v1(uuid,text);
drop function if exists public.set_discussion_focus_members_v1(uuid,uuid[]);
drop function if exists public.create_discussion_v1(uuid,text,text,uuid,text,uuid[],uuid[]);
drop function if exists app_private.can_manage_discussion_v1(uuid,uuid);

drop trigger if exists trg_cleanup_conversation_focus_on_member_delete_v1 on public.conversation_members;
drop function if exists app_private.cleanup_conversation_focus_on_member_delete_v1();

drop table if exists public.conversation_focus_members;
drop function if exists app_private.validate_conversation_focus_member_v1();

drop trigger if exists trg_validate_conversation_v4_shape on public.conversations;
drop function if exists app_private.validate_conversation_v4_shape();

drop index if exists public.conversations_source_message_unique_v4;
drop index if exists public.conversations_parent_activity_v4;

alter table public.conversations drop constraint if exists conversations_source_message_id_fkey;
alter table public.conversations drop constraint if exists conversations_parent_conversation_id_fkey;
alter table public.conversations drop column if exists source_message_id;
alter table public.conversations drop column if exists parent_conversation_id;

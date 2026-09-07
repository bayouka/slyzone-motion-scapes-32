-- DRAFT ONLY — DO NOT APPLY TO THE LIVE V4.2.2 DATABASE.
-- Communication v2 / Migration 006: unread is not a bell notification.
-- Apply only when the new Messages UI is ready to consume last_read_at.

begin;

-- V4.2.2 creates a bell notification for every message. Communication v2
-- removes that coupling: unread Messages are computed from last_read_at.
drop trigger if exists trg_notify_message on public.messages;

create or replace function app_private.notify_announcement_v2()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not new.is_announcement then return new; end if;

  insert into public.notifications(workspace_id,user_id,kind,title,route)
  select new.workspace_id,
         cm.user_id,
         'announcement',
         coalesce(new.subject,'Nouvelle annonce'),
         '/messages/'||new.conversation_id||'?message='||new.id
  from public.conversation_members cm
  where cm.conversation_id=new.conversation_id
    and cm.user_id<>new.author_id
    and cm.notification_level<>'muted'
    and app_private.user_can_access_conversation_v2(new.conversation_id,cm.user_id);

  return new;
end;
$$;

create or replace function app_private.notify_mention_v2()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conversation uuid;
  v_announcement boolean:=false;
  v_muted boolean:=false;
begin
  if new.message_id is not null then
    select m.conversation_id,m.is_announcement into v_conversation,v_announcement
    from public.messages m where m.id=new.message_id;

    -- An announcement already produces one bell notification. Keep the mention
    -- in the Mentions inbox but do not create a second bell item for the same message.
    if v_announcement then return new; end if;

    select coalesce(cm.notification_level='muted',false) into v_muted
    from public.conversation_members cm
    where cm.conversation_id=v_conversation and cm.user_id=new.mentioned_user_id;
    if v_muted then return new; end if;
  end if;

  insert into public.notifications(workspace_id,user_id,kind,title,route)
  values(
    new.workspace_id,
    new.mentioned_user_id,
    'mention',
    'Vous avez été mentionné',
    '/messages?mention='||new.id
  );
  return new;
end;
$$;

revoke all on function app_private.notify_announcement_v2() from public,anon,authenticated;
revoke all on function app_private.notify_mention_v2() from public,anon,authenticated;

drop trigger if exists trg_notify_announcement_v2 on public.messages;
create trigger trg_notify_announcement_v2
after insert on public.messages
for each row when (new.is_announcement=true)
execute function app_private.notify_announcement_v2();

drop trigger if exists trg_notify_mention_v2 on public.mentions;
create trigger trg_notify_mention_v2
after insert on public.mentions
for each row execute function app_private.notify_mention_v2();

create or replace function public.get_unread_conversations_v2(p_workspace_id uuid)
returns table(
  conversation_id uuid,
  unread_count bigint,
  first_unread_at timestamptz,
  last_unread_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id,
         count(m.id)::bigint,
         min(m.created_at),
         max(m.created_at)
  from public.conversations c
  join public.conversation_members cm
    on cm.conversation_id=c.id and cm.user_id=auth.uid()
  join public.messages m
    on m.conversation_id=c.id
   and m.deleted_at is null
   and m.author_id<>auth.uid()
   and m.created_at>coalesce(cm.last_read_at,'epoch'::timestamptz)
  where c.workspace_id=p_workspace_id
    and cm.hidden_at is null
    and app_private.can_access_conversation(c.id)
  group by c.id
  having count(m.id)>0
  order by max(m.created_at) desc;
$$;

create or replace function public.get_message_badges_v2(p_workspace_id uuid)
returns table(unread_messages bigint, unread_mentions bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce((
      select sum(x.unread_count)
      from public.get_unread_conversations_v2(p_workspace_id) x
    ),0)::bigint,
    coalesce((
      select count(*)
      from public.mentions mn
      where mn.workspace_id=p_workspace_id
        and mn.mentioned_user_id=auth.uid()
        and mn.read_at is null
    ),0)::bigint;
$$;

create or replace function public.mark_mention_read_v2(p_mention_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.mentions
  set read_at=coalesce(read_at,now())
  where id=p_mention_id and mentioned_user_id=auth.uid();
  if not found then raise exception 'MENTION_NOT_FOUND_OR_FORBIDDEN'; end if;
end;
$$;

revoke all on function public.get_unread_conversations_v2(uuid) from public,anon;
revoke all on function public.get_message_badges_v2(uuid) from public,anon;
revoke all on function public.mark_mention_read_v2(uuid) from public,anon;
grant execute on function public.get_unread_conversations_v2(uuid) to authenticated;
grant execute on function public.get_message_badges_v2(uuid) to authenticated;
grant execute on function public.mark_mention_read_v2(uuid) to authenticated;

-- Existing request notification triggers remain intentionally active:
-- Requests are obligations and belong in the bell/À traiter model.

commit;

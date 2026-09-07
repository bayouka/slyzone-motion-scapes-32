-- Communication v2 / Migration 007: make notification levels semantically distinct.
-- all      => announcements + mentions
-- mentions => mentions only
-- muted    => no communication bell notifications

begin;

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
    and cm.notification_level='all'
    and app_private.user_can_access_conversation_v2(new.conversation_id,cm.user_id);

  return new;
end;
$$;

revoke all on function app_private.notify_announcement_v2() from public,anon,authenticated;

commit;

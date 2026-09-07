begin;
\ir _fixture.sql

create temporary table qa_messages(
  direct_marc uuid,
  direct_julie uuid,
  normal_message uuid,
  other_message uuid,
  mention_message uuid,
  announcement_message uuid,
  marc_notifications_before bigint
) on commit drop;
grant select,update on qa_messages to authenticated;
insert into qa_messages(marc_notifications_before)
select count(*) from public.notifications where user_id='11000000-0000-4000-8000-000000000002';

set local role authenticated;
select pg_temp.as_user('11000000-0000-4000-8000-000000000001'); -- Fred
update qa_messages set direct_marc=public.get_or_create_direct_v2('21000000-0000-4000-8000-000000000001','11000000-0000-4000-8000-000000000002');
update qa_messages set direct_julie=public.get_or_create_direct_v2('21000000-0000-4000-8000-000000000001','11000000-0000-4000-8000-000000000003');
update qa_messages set normal_message=public.send_message_v2(direct_marc,'Message normal sans cloche') where direct_marc is not null;

select pg_temp.assert_eq(
  (select count(*) from public.notifications where user_id='11000000-0000-4000-8000-000000000002'),
  (select marc_notifications_before from qa_messages),
  'Normal message does not create bell notification'
);

select pg_temp.as_user('11000000-0000-4000-8000-000000000002'); -- Marc
select pg_temp.assert_eq(
  (select coalesce(sum(unread_count),0)::bigint from public.get_unread_conversations_v2('21000000-0000-4000-8000-000000000001') where conversation_id=(select direct_marc from qa_messages)),
  1,
  'Normal Direct message appears as unread in Messages'
);
select public.mark_conversation_read_v2((select direct_marc from qa_messages));
select pg_temp.assert_eq(
  (select coalesce(sum(unread_count),0)::bigint from public.get_unread_conversations_v2('21000000-0000-4000-8000-000000000001') where conversation_id=(select direct_marc from qa_messages)),
  0,
  'Marking conversation read clears unread count'
);

select pg_temp.as_user('11000000-0000-4000-8000-000000000001'); -- Fred
update qa_messages set mention_message=public.send_message_with_mentions_v2(
  direct_marc,
  '@Marc peux-tu regarder ?',
  'chat',null,false,null,
  array['11000000-0000-4000-8000-000000000002'::uuid]
) where direct_marc is not null;

select pg_temp.assert_eq(
  (select count(*) from public.mentions where message_id=(select mention_message from qa_messages) and mentioned_user_id='11000000-0000-4000-8000-000000000002'),
  1,
  'Message mention is normalized exactly once'
);
select pg_temp.assert_eq(
  (select count(*) from public.notifications where user_id='11000000-0000-4000-8000-000000000002' and kind='mention' and route like '/messages?mention=%'),
  1,
  'Normal mention creates one bell notification'
);

update qa_messages set announcement_message=public.send_message_with_mentions_v2(
  (select id from public.conversations where workspace_id='21000000-0000-4000-8000-000000000001' and kind='team' and is_general limit 1),
  'Information importante pour toute l’équipe',
  'structured','Organisation lundi',true,null,
  array['11000000-0000-4000-8000-000000000002'::uuid]
);

select pg_temp.assert_eq(
  (select count(*) from public.notifications where user_id='11000000-0000-4000-8000-000000000002' and kind='announcement' and route like '%'||(select announcement_message::text from qa_messages)),
  1,
  'Announcement creates one bell notification for Marc'
);
select pg_temp.assert_eq(
  (select count(*) from public.mentions where message_id=(select announcement_message from qa_messages) and mentioned_user_id='11000000-0000-4000-8000-000000000002'),
  1,
  'Announcement mention still appears in Mentions'
);
select pg_temp.assert_eq(
  (
    select count(*)
    from public.notifications n
    where n.user_id='11000000-0000-4000-8000-000000000002'
      and n.kind='mention'
      and n.route=(
        select '/messages?mention='||mn.id::text
        from public.mentions mn
        where mn.message_id=(select announcement_message from qa_messages)
          and mn.mentioned_user_id='11000000-0000-4000-8000-000000000002'
      )
  ),
  0,
  'Announcement mention does not duplicate bell notification'
);

do $$
begin
  begin
    perform public.send_message_v2((select direct_marc from qa_messages),'Sans objet','structured',null,false,null);
    raise exception 'ASSERT_NO_ERROR_STRUCTURED_SUBJECT';
  exception when others then
    if sqlerrm='ASSERT_NO_ERROR_STRUCTURED_SUBJECT' then raise; end if;
    if position('STRUCTURED_MESSAGE_SUBJECT_REQUIRED' in sqlerrm)=0 then raise; end if;
  end;
end $$;

update qa_messages set other_message=public.send_message_v2(direct_julie,'Autre conversation') where direct_julie is not null;
do $$
begin
  begin
    perform public.send_message_v2(
      (select direct_marc from qa_messages),
      'Réponse croisée interdite',
      'chat',null,false,
      (select other_message from qa_messages)
    );
    raise exception 'ASSERT_NO_ERROR_CROSS_REPLY';
  exception when others then
    if sqlerrm='ASSERT_NO_ERROR_CROSS_REPLY' then raise; end if;
    if position('MESSAGE_REPLY_CROSS_CONVERSATION' in sqlerrm)=0 then raise; end if;
  end;
end $$;

rollback;

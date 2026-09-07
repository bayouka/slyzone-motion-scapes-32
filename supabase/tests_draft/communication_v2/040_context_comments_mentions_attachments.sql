begin;
\ir _fixture.sql

create temporary table qa_context(action_id uuid,comment_id uuid,comment_attachment_id uuid,direct_id uuid,message_id uuid,message_attachment_id uuid) on commit drop;
insert into qa_context default values;

reset role;
with created_action as (
  insert into public.actions(workspace_id,project_id,title,description,created_by,visibility)
  select '21000000-0000-4000-8000-000000000001',project_id,'Prototype V4 QA','Action commentable','11000000-0000-4000-8000-000000000001','internal'
  from qa_comm_ids
  returning id
)
update qa_context set action_id=(select id from created_action);

set local role authenticated;
select pg_temp.as_user('11000000-0000-4000-8000-000000000001'); -- Fred
update qa_context
set comment_id=public.create_comment_v2(
  'action',action_id,
  '@Julie peux-tu vérifier sur mobile ?',
  null,
  array['11000000-0000-4000-8000-000000000003'::uuid]
) where action_id is not null;

update qa_context
set comment_attachment_id=public.add_attachment_to_comment_v2(
  comment_id,
  'qa/communication-v2/comment-prototype.pdf',
  'prototype-v4.pdf',
  'application/pdf',
  12345
) where comment_id is not null;

update qa_context
set direct_id=public.get_or_create_direct_v2('21000000-0000-4000-8000-000000000001','11000000-0000-4000-8000-000000000002');
update qa_context set message_id=public.send_message_v2(direct_id,'Fichier privé pour Marc') where direct_id is not null;
update qa_context
set message_attachment_id=public.add_attachment_to_message_v2(
  message_id,
  'qa/communication-v2/private-marc.pdf',
  'private-marc.pdf',
  'application/pdf',
  999
) where message_id is not null;

select pg_temp.as_user('11000000-0000-4000-8000-000000000003'); -- Julie, project participant
select pg_temp.assert_eq((select count(*) from public.comments where id=(select comment_id from qa_context)),1,'Julie can read Action comment in her project');
select pg_temp.assert_eq((select count(*) from public.mentions where comment_id=(select comment_id from qa_context)),1,'Julie sees normalized contextual mention');
select pg_temp.assert_eq((select count(*) from public.attachments where id=(select comment_attachment_id from qa_context)),1,'Julie can read attachment on accessible comment');
select pg_temp.assert_eq((select count(*) from public.attachments where id=(select message_attachment_id from qa_context)),0,'Julie cannot read attachment from Fred/Marc Direct');

select pg_temp.as_user('11000000-0000-4000-8000-000000000004'); -- workspace member not selected for project
select pg_temp.assert_eq((select count(*) from public.comments where id=(select comment_id from qa_context)),0,'Unrelated selected-access member cannot read project comment');
select pg_temp.assert_eq((select count(*) from public.attachments where id=(select comment_attachment_id from qa_context)),0,'Unrelated member cannot read comment attachment');

select pg_temp.as_user('11000000-0000-4000-8000-000000000005'); -- guest viewer; Action is internal
select pg_temp.assert_eq((select count(*) from public.comments where id=(select comment_id from qa_context)),0,'Guest cannot read comment on internal Action');

-- A mention must never be used to grant/infer access to somebody who cannot
-- read the underlying object.
select pg_temp.as_user('11000000-0000-4000-8000-000000000001');
do $$
begin
  begin
    perform public.create_comment_v2(
      'action',(select action_id from qa_context),
      '@Outsider ceci ne doit pas fuiter',null,
      array['11000000-0000-4000-8000-000000000004'::uuid]
    );
    raise exception 'ASSERT_NO_ERROR_INACCESSIBLE_MENTION';
  exception when others then
    if sqlerrm='ASSERT_NO_ERROR_INACCESSIBLE_MENTION' then raise; end if;
  end;
end $$;

rollback;

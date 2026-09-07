begin;
\ir _fixture.sql

create temporary table qa_topics(team_general uuid,team_topic uuid,project_topic uuid) on commit drop;
grant select,update on qa_topics to authenticated;
insert into qa_topics(team_general)
select id from public.conversations
where workspace_id='21000000-0000-4000-8000-000000000001' and kind='team' and is_general;

select pg_temp.assert_eq(
  (select count(*) from public.conversation_members where conversation_id=(select team_general from qa_topics)),
  4,
  'Team General contains active non-guest members only'
);
select pg_temp.assert_eq(
  (select count(*) from public.conversation_members where conversation_id=(select project_general_id from qa_comm_ids)),
  4,
  'Project General contains Fred Marc Julie and project Guest viewer, not unrelated member'
);

set local role authenticated;
select pg_temp.as_user('11000000-0000-4000-8000-000000000001'); -- Fred
update qa_topics set team_topic=public.create_team_topic_v2('21000000-0000-4000-8000-000000000001','Organisation QA');
update qa_topics set project_topic=public.create_project_topic_v2((select project_id from qa_comm_ids),'Prototype V4 QA');
reset role;

select pg_temp.assert_eq((select count(*) from public.conversation_members where conversation_id=(select team_topic from qa_topics)),4,'New Team topic copies eligible Team audience');
select pg_temp.assert_eq((select count(*) from public.conversation_members where conversation_id=(select project_topic from qa_topics)),4,'New Project topic copies project participants');

-- Guest is project participant but excluded from Team topics.
select pg_temp.assert_eq((select count(*) from public.conversation_members where conversation_id=(select team_topic from qa_topics) and user_id='11000000-0000-4000-8000-000000000005'),0,'Guest excluded from Team topic');
select pg_temp.assert_eq((select count(*) from public.conversation_members where conversation_id=(select project_topic from qa_topics) and user_id='11000000-0000-4000-8000-000000000005'),1,'Guest project viewer included in Project topic');

-- Role change guest -> member adds Team topic audience; reverting removes it.
update public.workspace_members set role='member' where workspace_id='21000000-0000-4000-8000-000000000001' and user_id='11000000-0000-4000-8000-000000000005';
select pg_temp.assert_eq((select count(*) from public.conversation_members where conversation_id=(select team_topic from qa_topics) and user_id='11000000-0000-4000-8000-000000000005'),1,'Guest promoted to member is added to Team topic');
update public.workspace_members set role='guest' where workspace_id='21000000-0000-4000-8000-000000000001' and user_id='11000000-0000-4000-8000-000000000005';
select pg_temp.assert_eq((select count(*) from public.conversation_members where conversation_id=(select team_topic from qa_topics) and user_id='11000000-0000-4000-8000-000000000005'),0,'Member demoted to guest is removed from Team topic');

-- Outsider is an active workspace member but not a selected project participant.
set local role authenticated;
select pg_temp.as_user('11000000-0000-4000-8000-000000000004');
select pg_temp.assert_eq((select count(*) from public.conversations where id=(select project_topic from qa_topics)),0,'Selected-access member cannot see Project topic before assignment');
reset role;

insert into public.project_members(project_id,user_id,role)
select project_id,'11000000-0000-4000-8000-000000000004','member' from qa_comm_ids;
select pg_temp.assert_eq((select count(*) from public.conversation_members where conversation_id=(select project_topic from qa_topics) and user_id='11000000-0000-4000-8000-000000000004'),1,'Adding project participant synchronizes Project topic memberships');

set local role authenticated;
select pg_temp.as_user('11000000-0000-4000-8000-000000000004');
select pg_temp.assert_eq((select count(*) from public.conversations where id=(select project_topic from qa_topics)),1,'New project participant can read Project topic');
reset role;

delete from public.project_members where project_id=(select project_id from qa_comm_ids) and user_id='11000000-0000-4000-8000-000000000004';
select pg_temp.assert_eq((select count(*) from public.conversation_members where conversation_id=(select project_topic from qa_topics) and user_id='11000000-0000-4000-8000-000000000004'),0,'Removing project participant removes Project topic membership');

set local role authenticated;
select pg_temp.as_user('11000000-0000-4000-8000-000000000004');
select pg_temp.assert_eq((select count(*) from public.conversations where id=(select project_topic from qa_topics)),0,'Removed project participant loses Project topic access');

rollback;

begin;
\ir _fixture.sql

create temporary table qa_runtime(direct_id uuid,message_id uuid,request_id uuid,action_id uuid) on commit drop;
insert into qa_runtime default values;

set local role authenticated;
select pg_temp.as_user('11000000-0000-4000-8000-000000000001'); -- Fred

update qa_runtime
set direct_id=public.get_or_create_direct_v2(
  '21000000-0000-4000-8000-000000000001',
  '11000000-0000-4000-8000-000000000002'
);

update qa_runtime
set message_id=public.send_message_v2(direct_id,'Message privé Fred → Marc')
where direct_id is not null;

select public.link_direct_to_project_v2(
  (select direct_id from qa_runtime),
  (select project_id from qa_comm_ids)
);

update qa_runtime
set request_id=public.create_request_from_message_v2(
  message_id,
  '11000000-0000-4000-8000-000000000002',
  'Marc, merci de répondre avant jeudi',
  'Validation attendue',
  now()+interval '2 days',
  'approval'
)
where message_id is not null;

-- A second 1-to-1 request must reuse the canonical Direct.
select pg_temp.assert_true(
  public.get_or_create_direct_v2('21000000-0000-4000-8000-000000000001','11000000-0000-4000-8000-000000000002')
  = (select direct_id from qa_runtime),
  'Fred/Marc 1-to-1 Direct is reused'
);

-- Private message -> broader Project Action must require explicit confirmation.
do $$
begin
  begin
    perform public.create_action_from_message_v2(
      (select message_id from qa_runtime),
      (select project_id from qa_comm_ids),
      'Action issue du Direct',
      'Doit élargir l’audience',
      'normal',null,'internal',false
    );
    raise exception 'ASSERT_NO_ERROR_AUDIENCE_EXPANSION';
  exception when others then
    if sqlerrm='ASSERT_NO_ERROR_AUDIENCE_EXPANSION' then raise; end if;
    if position('AUDIENCE_EXPANSION_CONFIRMATION_REQUIRED' in sqlerrm)=0 then raise; end if;
  end;
end $$;

update qa_runtime
set action_id=public.create_action_from_message_v2(
  message_id,
  (select project_id from qa_comm_ids),
  'Action issue du Direct',
  'Audience élargie après confirmation explicite',
  'normal',null,'internal',true
)
where message_id is not null;

select pg_temp.as_user('11000000-0000-4000-8000-000000000002'); -- Marc
select pg_temp.assert_eq((select count(*) from public.conversations where id=(select direct_id from qa_runtime)),1,'Marc reads his Direct');
select pg_temp.assert_eq((select count(*) from public.messages where id=(select message_id from qa_runtime)),1,'Marc reads the private message');
select pg_temp.assert_eq((select count(*) from public.requests where id=(select request_id from qa_runtime)),1,'Marc reads the request addressed to him');

select pg_temp.as_user('11000000-0000-4000-8000-000000000003'); -- Julie, already member of HFConcept
select pg_temp.assert_eq((select count(*) from public.conversations where id=(select direct_id from qa_runtime)),0,'Julie cannot read Fred/Marc Direct even though it is linked to her project');
select pg_temp.assert_eq((select count(*) from public.messages where id=(select message_id from qa_runtime)),0,'Julie cannot read private source message');
select pg_temp.assert_eq((select count(*) from public.requests where id=(select request_id from qa_runtime)),0,'Message-source Request inherits Direct confidentiality');
select pg_temp.assert_eq((select count(*) from public.actions where id=(select action_id from qa_runtime)),1,'Julie can read the explicitly broadened Project Action');

select pg_temp.as_user('11000000-0000-4000-8000-000000000004'); -- workspace member, no selected project access
select pg_temp.assert_eq((select count(*) from public.conversations where id=(select direct_id from qa_runtime)),0,'Unrelated workspace member cannot read Direct');
select pg_temp.assert_eq((select count(*) from public.requests where id=(select request_id from qa_runtime)),0,'Unrelated workspace member cannot read private Request');
select pg_temp.assert_eq((select count(*) from public.actions where id=(select action_id from qa_runtime)),0,'Unrelated selected-access member cannot read Project Action');

select pg_temp.as_user('11000000-0000-4000-8000-000000000005'); -- guest/project viewer
select pg_temp.assert_eq((select count(*) from public.conversations where id=(select direct_id from qa_runtime)),0,'Guest cannot read unrelated Direct');
select pg_temp.assert_eq((select count(*) from public.requests where id=(select request_id from qa_runtime)),0,'Guest cannot infer request through linked project');
select pg_temp.assert_eq((select count(*) from public.actions where id=(select action_id from qa_runtime)),0,'Guest cannot read internal derived Action');

-- Soft deletion keeps the source row/address stable for derived work, while the
-- UI can hide its body. The broader Action remains usable by project members.
select pg_temp.as_user('11000000-0000-4000-8000-000000000001'); -- Fred
select public.delete_message_v2((select message_id from qa_runtime));
select pg_temp.assert_eq((select count(*) from public.messages where id=(select message_id from qa_runtime) and deleted_at is not null),1,'Deleted source message keeps a stable row id');

select pg_temp.as_user('11000000-0000-4000-8000-000000000003'); -- Julie
select pg_temp.assert_eq((select count(*) from public.actions where id=(select action_id from qa_runtime)),1,'Derived Action survives source message soft deletion');
select pg_temp.assert_eq((select count(*) from public.messages where id=(select message_id from qa_runtime)),0,'Julie still cannot use derived Action to open private source');

-- Leaving/suspending the workspace cuts access even if stale Direct membership
-- rows remain. Access is gated by active workspace membership as well as audience.
reset role;
update public.workspace_members
set status='suspended'
where workspace_id='21000000-0000-4000-8000-000000000001'
  and user_id='11000000-0000-4000-8000-000000000002';

set local role authenticated;
select pg_temp.as_user('11000000-0000-4000-8000-000000000002'); -- Marc suspended
select pg_temp.assert_eq((select count(*) from public.conversations where id=(select direct_id from qa_runtime)),0,'Suspended Marc loses Direct access despite stale membership');
select pg_temp.assert_eq((select count(*) from public.messages where id=(select message_id from qa_runtime)),0,'Suspended Marc loses message access');
select pg_temp.assert_eq((select count(*) from public.requests where id=(select request_id from qa_runtime)),0,'Suspended Marc loses message-derived Request access');

rollback;

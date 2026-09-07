-- Shared disposable fixture for Communication v2 SQL/RLS tests.
-- Each test must BEGIN before \ir this file and ROLLBACK afterwards.
-- Never run this file against production outside a wrapping transaction.

create or replace function pg_temp.assert_true(p_value boolean,p_message text)
returns void language plpgsql as $$
begin
  if not coalesce(p_value,false) then raise exception 'ASSERT_TRUE_FAILED: %',p_message; end if;
end $$;

create or replace function pg_temp.assert_eq(p_actual bigint,p_expected bigint,p_message text)
returns void language plpgsql as $$
begin
  if p_actual is distinct from p_expected then
    raise exception 'ASSERT_EQ_FAILED: % (actual %, expected %)',p_message,p_actual,p_expected;
  end if;
end $$;

create or replace function pg_temp.as_user(p_user uuid)
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub',p_user::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);
end $$;

-- Fixed QA identities.
insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at)
values
('11000000-0000-4000-8000-000000000001','authenticated','authenticated','fred-v2@example.invalid','',now(),now(),now()),
('11000000-0000-4000-8000-000000000002','authenticated','authenticated','marc-v2@example.invalid','',now(),now(),now()),
('11000000-0000-4000-8000-000000000003','authenticated','authenticated','julie-v2@example.invalid','',now(),now(),now()),
('11000000-0000-4000-8000-000000000004','authenticated','authenticated','outsider-v2@example.invalid','',now(),now(),now()),
('11000000-0000-4000-8000-000000000005','authenticated','authenticated','guest-v2@example.invalid','',now(),now(),now())
on conflict (id) do nothing;

insert into public.profiles(id,display_name)
values
('11000000-0000-4000-8000-000000000001','Fred QA'),
('11000000-0000-4000-8000-000000000002','Marc QA'),
('11000000-0000-4000-8000-000000000003','Julie QA'),
('11000000-0000-4000-8000-000000000004','Outsider QA'),
('11000000-0000-4000-8000-000000000005','Guest QA')
on conflict (id) do nothing;

insert into public.workspaces(id,name,slug,created_by)
values('21000000-0000-4000-8000-000000000001','Communication V2 QA','communication-v2-qa','11000000-0000-4000-8000-000000000001');

insert into public.workspace_members(workspace_id,user_id,role,status,access_mode)
values
('21000000-0000-4000-8000-000000000001','11000000-0000-4000-8000-000000000001','owner','active','all'),
('21000000-0000-4000-8000-000000000001','11000000-0000-4000-8000-000000000002','member','active','all'),
('21000000-0000-4000-8000-000000000001','11000000-0000-4000-8000-000000000003','member','active','selected'),
('21000000-0000-4000-8000-000000000001','11000000-0000-4000-8000-000000000004','member','active','selected'),
('21000000-0000-4000-8000-000000000001','11000000-0000-4000-8000-000000000005','guest','active','selected');

create temporary table qa_comm_ids(
  workspace_id uuid primary key,
  project_id uuid,
  project_general_id uuid
) on commit drop;

grant select,update on qa_comm_ids to authenticated;

insert into qa_comm_ids(workspace_id)
values('21000000-0000-4000-8000-000000000001');

set local role authenticated;
select pg_temp.as_user('11000000-0000-4000-8000-000000000001');

with created as (
  select public.create_project_with_setup(
    '21000000-0000-4000-8000-000000000001',
    'HFConcept QA',
    'Communication v2 security fixture',
    null,
    array['11000000-0000-4000-8000-000000000002'::uuid,'11000000-0000-4000-8000-000000000003'::uuid],
    array['Prototype'::text]
  ) as result
)
update qa_comm_ids
set project_id=(select (result->>'project_id')::uuid from created),
    project_general_id=(select (result->>'conversation_id')::uuid from created)
where workspace_id='21000000-0000-4000-8000-000000000001';

reset role;

-- Guest can participate in the project but must remain excluded from Team topics.
insert into public.project_members(project_id,user_id,role)
select project_id,'11000000-0000-4000-8000-000000000005','viewer' from qa_comm_ids;

-- DRAFT VALIDATION PATCH — consolidate into 004_request_inheritance.sql after QA.
-- Keep arbitrary-user helpers private; expose only auth.uid()-scoped RLS predicates.

begin;

create or replace function app_private.can_access_message_v2(p_message_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.user_can_access_message_v2(p_message_id,auth.uid());
$$;

create or replace function app_private.can_access_request_v2(p_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.user_can_access_request_v2(p_request_id,auth.uid());
$$;

create or replace function app_private.can_create_request_v2(
  p_workspace_id uuid,
  p_project_id uuid,
  p_source_type text,
  p_source_id uuid,
  p_recipient_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and app_private.user_is_active_workspace_member_v2(p_workspace_id,auth.uid())
    and app_private.user_is_active_workspace_member_v2(p_workspace_id,p_recipient_id)
    and (
      p_source_type is distinct from 'message'
      or (
        p_source_id is not null
        and app_private.user_can_access_message_v2(p_source_id,auth.uid())
        and app_private.user_can_access_message_v2(p_source_id,p_recipient_id)
      )
    )
    and (p_project_id is null or app_private.user_can_access_project_v2(p_project_id,auth.uid()));
$$;

revoke all on function app_private.can_access_message_v2(uuid) from public,anon,authenticated;
revoke all on function app_private.can_access_request_v2(uuid) from public,anon,authenticated;
revoke all on function app_private.can_create_request_v2(uuid,uuid,text,uuid,uuid) from public,anon,authenticated;
grant execute on function app_private.can_access_message_v2(uuid) to authenticated;
grant execute on function app_private.can_access_request_v2(uuid) to authenticated;
grant execute on function app_private.can_create_request_v2(uuid,uuid,text,uuid,uuid) to authenticated;

drop policy if exists requests_select_v2 on public.requests;
create policy requests_select_v2 on public.requests
for select using (app_private.can_access_request_v2(id));

drop policy if exists requests_insert_v2 on public.requests;
create policy requests_insert_v2 on public.requests
for insert with check (
  requester_id=auth.uid()
  and app_private.can_create_request_v2(workspace_id,project_id,source_type,source_id,recipient_id)
);

drop policy if exists requests_update_v2 on public.requests;
create policy requests_update_v2 on public.requests
for update
using (
  app_private.can_access_request_v2(id)
  and (
    requester_id=auth.uid()
    or recipient_id=auth.uid()
    or (source_type is distinct from 'message' and app_private.can_manage_workspace(workspace_id))
  )
)
with check (
  app_private.can_access_request_v2(id)
  and (
    requester_id=auth.uid()
    or recipient_id=auth.uid()
    or (source_type is distinct from 'message' and app_private.can_manage_workspace(workspace_id))
  )
);

commit;

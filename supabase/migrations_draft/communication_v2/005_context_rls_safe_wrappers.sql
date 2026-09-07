-- DRAFT VALIDATION PATCH — consolidate into 005_context_comments_mentions_attachments.sql after QA.
-- RLS may call only auth.uid()-scoped predicates. Arbitrary-user helpers remain private.

begin;

create or replace function app_private.can_access_comment_target_v2(
  p_target_type text,
  p_target_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.user_can_access_comment_target_v2(p_target_type,p_target_id,auth.uid());
$$;

create or replace function app_private.can_write_comment_v2(
  p_target_type text,
  p_target_id uuid,
  p_workspace_id uuid,
  p_project_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and app_private.user_can_access_comment_target_v2(p_target_type,p_target_id,auth.uid())
    and app_private.comment_target_scope_matches_v2(p_target_type,p_target_id,p_workspace_id,p_project_id);
$$;

revoke all on function app_private.can_access_comment_target_v2(text,uuid) from public,anon,authenticated;
revoke all on function app_private.can_write_comment_v2(text,uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function app_private.can_access_comment_target_v2(text,uuid) to authenticated;
grant execute on function app_private.can_write_comment_v2(text,uuid,uuid,uuid) to authenticated;

drop policy if exists comments_select_v2 on public.comments;
create policy comments_select_v2 on public.comments
for select using (app_private.can_access_comment_target_v2(target_type,target_id));

drop policy if exists comments_insert_v2 on public.comments;
create policy comments_insert_v2 on public.comments
for insert with check (
  author_id=auth.uid()
  and app_private.can_write_comment_v2(target_type,target_id,workspace_id,project_id)
);

drop policy if exists comments_update_author_v2 on public.comments;
create policy comments_update_author_v2 on public.comments
for update
using (
  author_id=auth.uid()
  and deleted_at is null
  and app_private.can_access_comment_target_v2(target_type,target_id)
)
with check (
  author_id=auth.uid()
  and app_private.can_write_comment_v2(target_type,target_id,workspace_id,project_id)
);

-- Comment creation is RPC-owned. This closes the direct INSERT path that the
-- original draft comment already intended to close but had not revoked.
revoke insert on public.comments from authenticated;

-- Parent visibility is already enforced by the parent tables' RLS. Reusing it
-- avoids exposing arbitrary-user helper predicates through attachment RLS.
drop policy if exists attachments_select_v2 on public.attachments;
create policy attachments_select_v2 on public.attachments
for select using (
  (message_id is not null and exists(
    select 1 from public.messages m where m.id=message_id
  ))
  or
  (comment_id is not null and exists(
    select 1 from public.comments c where c.id=comment_id
  ))
);

-- These tables are created by migration 005, after the baseline grants that
-- existed on V4.2.2. PostgreSQL table privileges must therefore be granted
-- explicitly; RLS remains the row-level authorization boundary.
grant select on public.comments to authenticated;
grant select on public.mentions to authenticated;
grant select on public.attachments to authenticated;

commit;

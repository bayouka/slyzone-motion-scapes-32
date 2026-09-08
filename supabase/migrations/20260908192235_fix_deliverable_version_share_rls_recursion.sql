-- 2b2c / 4b4c — break the RLS recursion between deliverable_versions and
-- deliverable_version_shares.
--
-- deliverable_versions_select checks deliverable_version_shares for external
-- users. The share table therefore must not query deliverable_versions again
-- from its own SELECT policy, otherwise PostgreSQL detects recursive RLS.
-- Writes to this table remain unavailable to authenticated clients and are
-- performed only by the secured deliverable RPCs.

drop policy if exists deliverable_version_shares_select
on public.deliverable_version_shares;

create policy deliverable_version_shares_select
on public.deliverable_version_shares
for select
to authenticated
using (app_private.can_access_project(project_id));

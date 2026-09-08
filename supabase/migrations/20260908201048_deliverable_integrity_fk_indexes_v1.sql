-- Cover foreign keys introduced by exact-version sharing and project closure snapshots.
create index if not exists deliverable_version_shares_workspace_idx
  on public.deliverable_version_shares(workspace_id);
create index if not exists deliverable_version_shares_shared_by_idx
  on public.deliverable_version_shares(shared_by);
create index if not exists project_closure_versions_workspace_idx
  on public.project_closure_versions(workspace_id);
create index if not exists project_closure_versions_deliverable_idx
  on public.project_closure_versions(deliverable_id);
create index if not exists project_closure_versions_version_idx
  on public.project_closure_versions(deliverable_version_id);

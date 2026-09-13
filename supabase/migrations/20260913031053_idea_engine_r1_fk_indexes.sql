-- 4b4c Idea Engine R1 FK coverage indexes
-- Added from Supabase performance-advisor findings after the persistence core migration.

create index idea_sources_created_by_idx on public.idea_sources(created_by) where created_by is not null;
create index idea_action_runs_created_by_idx on public.idea_action_runs(created_by) where created_by is not null;
create index idea_information_items_supersedes_idx on public.idea_information_items(supersedes_id) where supersedes_id is not null;
create index idea_information_items_action_run_idx on public.idea_information_items(created_by_action_run_id) where created_by_action_run_id is not null;
create index idea_information_items_created_by_idx on public.idea_information_items(created_by) where created_by is not null;
create index idea_snapshots_created_by_idx on public.idea_snapshots(created_by) where created_by is not null;
create index project_definitions_workspace_idx on public.project_definitions(workspace_id);
create index idea_artifacts_source_snapshot_idx on public.idea_artifacts(source_snapshot_id) where source_snapshot_id is not null;
create index idea_artifacts_action_run_idx on public.idea_artifacts(created_by_action_run_id) where created_by_action_run_id is not null;
create index idea_artifacts_created_by_idx on public.idea_artifacts(created_by) where created_by is not null;
create index idea_ledger_entries_supersedes_idx on public.idea_ledger_entries(supersedes_id) where supersedes_id is not null;
create index idea_ledger_entries_action_run_idx on public.idea_ledger_entries(created_by_action_run_id) where created_by_action_run_id is not null;
create index idea_ledger_entries_created_by_idx on public.idea_ledger_entries(created_by) where created_by is not null;

-- 4b4c Idea Engine R1 persistence core
-- Additive persistence for deterministic Idea -> Project Definition lifecycle.

alter table public.ideas
  add column blueprint_id text null,
  add column blueprint_version text null,
  add column blueprint_status text null check (blueprint_status is null or blueprint_status in ('active','mismatch','migration_required')),
  add column engine_revision bigint not null default 0 check (engine_revision >= 0),
  add column active_project_definition_id uuid null;

create table public.idea_sources (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  source_kind text not null check (source_kind in ('human_raw','url','document','image','connector','system_observation')),
  locator text null,
  title text null,
  human_note text null,
  content_hash text null,
  source_version integer not null default 1 check (source_version > 0),
  fetched_at timestamptz null,
  freshness_at timestamptz null,
  status text not null default 'registered' check (status in ('registered','ingested','stale','superseded','failed')),
  sensitivity text not null default 'internal' check (sensitivity in ('public','internal','personal','sensitive')),
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.idea_action_runs (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  action_type text not null check (nullif(btrim(action_type),'') is not null),
  target_requirement_ids text[] not null default array[]::text[],
  target_artifact_keys text[] not null default array[]::text[],
  target_signature text not null default '',
  input_fingerprint text not null check (nullif(btrim(input_fingerprint),'') is not null),
  input_refs jsonb not null default '{}'::jsonb check (jsonb_typeof(input_refs)='object'),
  provider text null,
  model text null,
  prompt_version text null,
  schema_version text null,
  tool_version text null,
  permission_scope jsonb not null default '{}'::jsonb check (jsonb_typeof(permission_scope)='object'),
  status text not null default 'queued' check (status in ('queued','running','succeeded','failed','cancelled','stale')),
  attempt integer not null default 1 check (attempt > 0),
  result jsonb not null default '{}'::jsonb,
  proposed_mutations jsonb not null default '[]'::jsonb check (jsonb_typeof(proposed_mutations)='array'),
  error_code text null,
  latency_ms integer null check (latency_ms is null or latency_ms >= 0),
  cost_metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(cost_metadata)='object'),
  idempotency_key text null,
  started_at timestamptz null,
  completed_at timestamptz null,
  created_by uuid null references auth.users(id) on delete set null,
  created_by_actor text not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index idea_action_runs_idempotency_uidx
  on public.idea_action_runs(idea_id,idempotency_key)
  where idempotency_key is not null;

create table public.idea_information_items (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  semantic_key text null,
  item_type text not null check (item_type in ('FACT','PREFERENCE','CONSTRAINT','ASSUMPTION','OPTION','EVIDENCE','RISK','QUESTION','DECISION_INPUT')),
  value_jsonb jsonb not null,
  provenance_type text not null check (provenance_type in ('HUMAN_DECLARED','HUMAN_GUIDED_ANSWER','SOURCE_EXTRACTED','CONNECTOR_EXTRACTED','WEB_RESEARCH','SYSTEM_CALCULATED','AI_INFERRED','AI_RECOMMENDED')),
  source_id uuid null references public.idea_sources(id) on delete set null,
  source_locator text null,
  confidence_class text not null default 'UNKNOWN' check (confidence_class in ('DIRECT','HIGH','MEDIUM','LOW','UNKNOWN')),
  state text not null default 'ACTIVE' check (state in ('ACTIVE','SUPERSEDED','REJECTED','CONFLICTED','STALE')),
  sensitivity text not null default 'internal' check (sensitivity in ('public','internal','personal','sensitive')),
  valid_from timestamptz not null default now(),
  supersedes_id uuid null references public.idea_information_items(id) on delete set null,
  created_by_action_run_id uuid null references public.idea_action_runs(id) on delete set null,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.idea_requirement_states (
  idea_id uuid not null references public.ideas(id) on delete cascade,
  requirement_id text not null,
  blueprint_version text not null,
  applicability_state text not null check (applicability_state in ('ACTIVE','NOT_RELEVANT')),
  resolution_state text not null check (resolution_state in ('UNRESOLVED','RESOLVED','ACCEPTED_UNKNOWN','STALE','CONFLICTED','NOT_RELEVANT')),
  criticality_current text null check (criticality_current is null or criticality_current in ('BLOCKING','REQUIRED','CONDITIONAL','INFORMATIONAL')),
  lock_state text not null default 'WORKING' check (lock_state in ('WORKING','AI_PROPOSED','VALIDATED_CURRENT','LOCKED_FOR_DEPENDENTS','FROZEN_IN_DECISION_SNAPSHOT','APPROVED_FOR_PROJECT','FROZEN_FOR_BUILD','REVIEW_REQUIRED','STALE','SUPERSEDED','REJECTED')),
  resolution_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(resolution_refs)='array'),
  input_fingerprint text not null,
  last_evaluated_at timestamptz not null default now(),
  stale_reason text null,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (idea_id,requirement_id)
);

create table public.idea_snapshots (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  snapshot_type text not null check (snapshot_type in ('DECISION_SNAPSHOT','APPROVED_IDEA_SNAPSHOT','PROJECT_BASELINE_SNAPSHOT','BUILD_READY_SNAPSHOT')),
  blueprint_id text not null,
  blueprint_version text not null,
  engine_revision bigint not null check (engine_revision >= 0),
  manifest jsonb not null check (jsonb_typeof(manifest)='object'),
  content_hash text not null check (nullif(btrim(content_hash),'') is not null),
  created_by uuid null references auth.users(id) on delete set null,
  created_by_actor text not null default 'system',
  created_at timestamptz not null default now()
);

create unique index idea_snapshots_content_uidx
  on public.idea_snapshots(idea_id,snapshot_type,content_hash);

create table public.project_definitions (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  approved_idea_snapshot_id uuid not null unique references public.idea_snapshots(id) on delete restrict,
  status text not null default 'defining' check (status in ('defining','ready_for_review','build_ready','superseded')),
  version bigint not null default 1 check (version > 0),
  build_ready_snapshot_id uuid null unique references public.idea_snapshots(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ideas
  add constraint ideas_active_project_definition_fkey
  foreign key (active_project_definition_id) references public.project_definitions(id) on delete set null;

create unique index ideas_active_project_definition_uidx
  on public.ideas(active_project_definition_id)
  where active_project_definition_id is not null;

create table public.idea_artifacts (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  artifact_key text not null check (nullif(btrim(artifact_key),'') is not null),
  artifact_type text not null check (nullif(btrim(artifact_type),'') is not null),
  purpose_stage text not null check (purpose_stage in ('FOR_DECISION','FOR_PROJECT','FOR_BUILD')),
  version integer not null check (version > 0),
  state text not null default 'draft' check (state in ('draft','current','frozen','stale','superseded','rejected')),
  payload jsonb not null default '{}'::jsonb,
  file_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(file_refs)='array'),
  source_snapshot_id uuid null references public.idea_snapshots(id) on delete set null,
  input_fingerprint text not null,
  created_by_action_run_id uuid null references public.idea_action_runs(id) on delete set null,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (idea_id,artifact_key,version)
);

create table public.idea_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  entry_type text not null check (entry_type in ('ASSUMPTION','RISK_UNKNOWN','CONFLICT','CHANGE','RECOMMENDATION','ACCEPTED_UNKNOWN')),
  target_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(target_refs)='array'),
  payload jsonb not null default '{}'::jsonb,
  state text not null default 'open' check (state in ('open','resolved','accepted','superseded','stale','rejected')),
  materiality text not null default 'LOCAL' check (materiality in ('COSMETIC','LOCAL','SUBSTANTIVE','CRITICAL')),
  authority_ref text null,
  source_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(source_refs)='array'),
  supersedes_id uuid null references public.idea_ledger_entries(id) on delete set null,
  created_by uuid null references auth.users(id) on delete set null,
  created_by_action_run_id uuid null references public.idea_action_runs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idea_sources_idea_status_idx on public.idea_sources(idea_id,status,updated_at desc);
create index idea_information_items_idea_semantic_idx on public.idea_information_items(idea_id,semantic_key,state,updated_at desc);
create index idea_information_items_source_idx on public.idea_information_items(source_id) where source_id is not null;
create index idea_requirement_states_idea_state_idx on public.idea_requirement_states(idea_id,resolution_state,lock_state);
create index idea_action_runs_idea_status_idx on public.idea_action_runs(idea_id,status,created_at desc);
create index idea_snapshots_idea_type_idx on public.idea_snapshots(idea_id,snapshot_type,created_at desc);
create index project_definitions_idea_status_idx on public.project_definitions(idea_id,status,updated_at desc);
create index idea_artifacts_idea_key_state_idx on public.idea_artifacts(idea_id,artifact_key,state,version desc);
create index idea_ledger_entries_idea_type_state_idx on public.idea_ledger_entries(idea_id,entry_type,state,updated_at desc);

create trigger idea_sources_set_updated_at before update on public.idea_sources for each row execute function app_private.set_updated_at();
create trigger idea_action_runs_set_updated_at before update on public.idea_action_runs for each row execute function app_private.set_updated_at();
create trigger idea_information_items_set_updated_at before update on public.idea_information_items for each row execute function app_private.set_updated_at();
create trigger idea_requirement_states_set_updated_at before update on public.idea_requirement_states for each row execute function app_private.set_updated_at();
create trigger project_definitions_set_updated_at before update on public.project_definitions for each row execute function app_private.set_updated_at();
create trigger idea_artifacts_set_updated_at before update on public.idea_artifacts for each row execute function app_private.set_updated_at();
create trigger idea_ledger_entries_set_updated_at before update on public.idea_ledger_entries for each row execute function app_private.set_updated_at();

create or replace function app_private.protect_idea_engine_columns_v1()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (
    new.blueprint_id is distinct from old.blueprint_id
    or new.blueprint_version is distinct from old.blueprint_version
    or new.blueprint_status is distinct from old.blueprint_status
    or new.engine_revision is distinct from old.engine_revision
    or new.active_project_definition_id is distinct from old.active_project_definition_id
  ) and current_user not in ('postgres','service_role','supabase_admin') then
    raise exception 'IDEA_ENGINE_COLUMNS_SYSTEM_OWNED' using errcode='42501';
  end if;
  return new;
end;
$$;

create trigger ideas_protect_engine_columns_v1
before update on public.ideas
for each row execute function app_private.protect_idea_engine_columns_v1();

create or replace function app_private.prevent_idea_snapshot_mutation_v1()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'IDEA_SNAPSHOT_IMMUTABLE' using errcode='55000';
end;
$$;

create trigger idea_snapshots_immutable_update_v1 before update on public.idea_snapshots for each row execute function app_private.prevent_idea_snapshot_mutation_v1();
create trigger idea_snapshots_immutable_delete_v1 before delete on public.idea_snapshots for each row execute function app_private.prevent_idea_snapshot_mutation_v1();

alter table public.idea_sources enable row level security;
alter table public.idea_information_items enable row level security;
alter table public.idea_requirement_states enable row level security;
alter table public.idea_action_runs enable row level security;
alter table public.idea_snapshots enable row level security;
alter table public.project_definitions enable row level security;
alter table public.idea_artifacts enable row level security;
alter table public.idea_ledger_entries enable row level security;

create policy idea_sources_select_v1 on public.idea_sources for select to authenticated using (app_private.can_access_idea(idea_id));
create policy idea_information_items_select_v1 on public.idea_information_items for select to authenticated using (app_private.can_access_idea(idea_id));
create policy idea_requirement_states_select_v1 on public.idea_requirement_states for select to authenticated using (app_private.can_access_idea(idea_id));
create policy idea_action_runs_select_v1 on public.idea_action_runs for select to authenticated using (app_private.can_access_idea(idea_id));
create policy idea_snapshots_select_v1 on public.idea_snapshots for select to authenticated using (app_private.can_access_idea(idea_id));
create policy project_definitions_select_v1 on public.project_definitions for select to authenticated using (app_private.can_access_idea(idea_id));
create policy idea_artifacts_select_v1 on public.idea_artifacts for select to authenticated using (app_private.can_access_idea(idea_id));
create policy idea_ledger_entries_select_v1 on public.idea_ledger_entries for select to authenticated using (app_private.can_access_idea(idea_id));

revoke all on table public.idea_sources, public.idea_information_items, public.idea_requirement_states, public.idea_action_runs, public.idea_snapshots, public.project_definitions, public.idea_artifacts, public.idea_ledger_entries from anon, authenticated;

grant select on table public.idea_sources, public.idea_information_items, public.project_definitions, public.idea_artifacts, public.idea_ledger_entries to authenticated;
grant all on table public.idea_sources, public.idea_information_items, public.idea_requirement_states, public.idea_action_runs, public.idea_snapshots, public.project_definitions, public.idea_artifacts, public.idea_ledger_entries to service_role;

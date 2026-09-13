-- 4b4c / 2b2c — G2 additive schema additions V0.1 FINAL CANDIDATE
-- Date: 2026-09-14
-- STATUS: COMPILE/ROLLBACK CANDIDATE ONLY — DO NOT APPLY AS A MIGRATION.
-- No data rewrite. G1 columns/functions remain untouched.

-- 1. System lineage for Sources created/reused by research Action Runs.
alter table public.idea_sources
  add column if not exists created_by_action_run_id uuid null
  references public.idea_action_runs(id) on delete set null;

create index if not exists idea_sources_action_run_idx
  on public.idea_sources(created_by_action_run_id)
  where created_by_action_run_id is not null;

-- 2. Basis lineage for direct-human Information Item -> Requirement support.
alter table public.idea_information_requirement_refs
  add column if not exists target_basis_fingerprint text null;

alter table public.idea_information_requirement_refs
  drop constraint if exists idea_information_requirement_refs_target_basis_nonempty;

alter table public.idea_information_requirement_refs
  add constraint idea_information_requirement_refs_target_basis_nonempty
  check (
    target_basis_fingerprint is null
    or nullif(btrim(target_basis_fingerprint),'') is not null
  );

create index if not exists idea_information_requirement_refs_basis_idx
  on public.idea_information_requirement_refs(
    idea_id,requirement_id,target_basis_fingerprint
  )
  where target_basis_fingerprint is not null;

-- 3. Runtime vocabulary parity with Blueprint criticality vocabulary.
alter table public.idea_requirement_states
  drop constraint if exists idea_requirement_states_criticality_current_check;

alter table public.idea_requirement_states
  add constraint idea_requirement_states_criticality_current_check
  check (
    criticality_current is null
    or criticality_current in (
      'BLOCKING','REQUIRED','CONDITIONAL','INFORMATIONAL','ENHANCER','NOT_RELEVANT'
    )
  );

-- Invariants:
-- - additive columns are nullable, so existing G1 rows remain valid;
-- - no existing row is rewritten;
-- - Source lineage FK is ON DELETE SET NULL to preserve canonical Source history;
-- - direct-human basis lineage is optional for legacy/G1 rows but mandatory by G2 writer contract;
-- - criticality parity widens the accepted vocabulary only.
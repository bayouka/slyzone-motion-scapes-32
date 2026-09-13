-- 4b4c / 2b2c — Requirement criticality parity V0.1
-- Date: 2026-09-13
-- STATUS: ROLLBACK CANDIDATE ONLY — DO NOT APPLY AS A MIGRATION.

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

-- Additive only: no existing value is rewritten.
-- applicability_state remains authoritative for ACTIVE / NOT_RELEVANT.

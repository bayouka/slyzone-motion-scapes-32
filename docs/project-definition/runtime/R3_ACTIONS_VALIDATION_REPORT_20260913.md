# 4b4c — R3 System Actions Validation Report — 2026-09-13

Status: **R3 PASS_ACTION_LIFECYCLE_BASELINE**

## Scope

R3 implements the durable System Action lifecycle and deterministic promotion boundary on top of R0/R1/R2. It does not choose or invoke a production AI provider, does not deploy a durable workflow, and does not switch frontend/Worker behavior.

## Applied migration

- `20260913032224_idea_engine_r3_action_lifecycle`

Canonical GitHub source:
`supabase/migrations/20260913032224_idea_engine_r3_action_lifecycle.sql`

## Implemented server-only RPCs

- `create_action_run_v1`
- `start_action_run_v1`
- `complete_action_run_v1`
- `fail_action_run_v1`
- `mark_action_run_stale_v1`
- `materialize_requirement_states_v1`
- `promote_action_result_v1`

All seven RPCs are executable by `service_role` only. `PUBLIC`, `anon` and `authenticated` have no EXECUTE privilege.

## Action-run persistence additions

`idea_action_runs` now records creation/completion/promotion engine revisions, projection/request/result fingerprints, stale reason and promotion timestamp.

`idea_requirement_states` now records `resolution_levels` and `authority_ok` in addition to its R2 `evaluated_engine_revision` freshness boundary.

## Deterministic promotion allowlist

R3 V0.1 permits only the mutation kinds explicitly allowed by each run's permission scope:
- `INFORMATION_ITEM`
- `LEDGER_ENTRY`

Machine Information Item provenance allowed:
- `SOURCE_EXTRACTED`
- `CONNECTOR_EXTRACTED`
- `WEB_RESEARCH`
- `SYSTEM_CALCULATED`
- `AI_INFERRED`
- `AI_RECOMMENDED`

Machine ledger types allowed:
- `ASSUMPTION`
- `RISK_UNKNOWN`
- `RECOMMENDATION`

Human/formal provenance and approvals cannot be promoted by R3.

## Transactional validation

All tests ran against the real production schema inside explicit transactions followed by `ROLLBACK`.

Validated:
1. Requirement-state cache materialization at the exact Idea revision ;
2. Action Run creation + idempotent creation retry ;
3. authenticated client cannot read `idea_action_runs` directly ;
4. Action Run start with current input fingerprint ;
5. Action Run completion with historical result + proposed mutations ;
6. successful deterministic promotion creates one machine Information Item and one allowed ledger entry atomically ;
7. promoted records preserve `created_by_action_run_id` lineage ;
8. promotion increments `engine_revision` exactly once ;
9. direct target Requirement cache becomes `STALE` while preserving its older `evaluated_engine_revision` ;
10. promotion retry is idempotent and does not duplicate canonical mutations ;
11. input changed during execution causes completed run to become non-promotable `stale` ;
12. `HUMAN_DECLARED` machine promotion is rejected (`INVALID_MACHINE_PROVENANCE`) ;
13. stale Requirement-state materialization is rejected (`STALE_ENGINE`) ;
14. Action Run failure transition + retry are idempotent ;
15. input changed before start marks queued run `stale` instead of executing ;
16. run permission scope prevents a non-authorized mutation kind (`MUTATION_KIND_NOT_PERMITTED`) ;
17. explicit `mark_action_run_stale_v1` + retry are idempotent.

Test markers returned:
- `R3_TRANSACTIONAL_TEST_PASS`
- `R3_SCOPE_AND_STALE_TEST_PASS`

## Production non-regression

After rollback verification:
- the existing legacy Idea remains untouched (`engine_revision = 0`, no Blueprint assignment) ;
- `idea_action_runs`: 0 rows ;
- `idea_requirement_states`: 0 rows ;
- `idea_information_items`: 0 rows ;
- `idea_ledger_entries`: 0 rows ;
- no test data persisted.

No frontend, Worker, provider or Cloudflare deployment was changed by R3.

## R3 verdict

**PASS_ACTION_LIFECYCLE_BASELINE**.

R4 may now implement prefiguration/artifact versioning and freshness boundaries on top of validated snapshots/actions, without making visual/concept artifacts final build specifications.

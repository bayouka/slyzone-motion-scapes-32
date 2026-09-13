# 4b4c — R3 System Actions Implementation Plan — V0.1

Date: 2026-09-13
Status: IMPLEMENTATION BASELINE FOR R3

## Objective

Implement the durable lifecycle of deterministic System Actions around `idea_action_runs` and a narrow promotion boundary for safe machine-produced mutations. R3 does not choose an AI provider, does not deploy a durable workflow, and does not allow an LLM/provider to write canonical state directly.

## Trust boundary

R0 decides eligibility and fingerprints. R3 persists execution lifecycle. A provider/LLM may only return `result + proposed_mutations`. Canonical changes occur only through `promote_action_result_v1` after server-side freshness, permission-scope and mutation-schema checks.

All R3 lifecycle/promotion RPCs are server-only (`service_role`). No browser role receives direct action-run or Requirement-state write access.

## Action-run lifecycle

### `create_action_run_v1`
Requires current Idea revision, stable input fingerprint, targets, permission scope and idempotency key. Stores request fingerprint, creation revision and audit metadata. Same idempotency key + same request is a no-op; different request is rejected.

### `start_action_run_v1`
Requires the current deterministic input fingerprint. If the input is no longer current, the run becomes `stale` instead of starting.

### `complete_action_run_v1`
Persists provider result and proposed mutations. If the input fingerprint changed during execution, stores the historical result as `stale` and makes it non-promotable. Repeated identical completion is idempotent.

### `fail_action_run_v1`
Classifies a queued/running run as failed without mutating canonical dossier state.

### `mark_action_run_stale_v1`
Explicitly retires queued/running/succeeded work when a deterministic caller knows its target is no longer admissible.

## Permission scope

Each run contains `permission_scope.allowed_mutation_kinds`. R3 V0.1 recognizes only:
- `INFORMATION_ITEM`
- `LEDGER_ENTRY`

Absence of a kind means the action cannot promote that mutation kind.

## `promote_action_result_v1`

Preconditions:
- run `succeeded` and not already stale ;
- current Idea revision equals caller's expected revision ;
- run input fingerprint equals freshly recomputed current input fingerprint ;
- mutation kind explicitly permitted by the run ;
- mutation payload conforms to the R3 allowlist.

R3 V0.1 INFORMATION_ITEM provenance allowlist:
- `SOURCE_EXTRACTED`
- `CONNECTOR_EXTRACTED`
- `WEB_RESEARCH`
- `SYSTEM_CALCULATED`
- `AI_INFERRED`
- `AI_RECOMMENDED`

R3 can never create `HUMAN_DECLARED`, `HUMAN_GUIDED_ANSWER`, HUMAN_DECISION, EXPERT_SIGNOFF, Idea approval or Build Ready approval.

R3 V0.1 LEDGER_ENTRY allowlist:
- `ASSUMPTION`
- `RISK_UNKNOWN`
- `RECOMMENDATION`

Promotion increments `engine_revision` once for the entire atomic promotion, marks directly targeted persisted Requirement-cache rows stale, records lineage to the action run and writes minimal audit metadata without copying generated content into `audit_events`.

## Requirement-state materialization

`materialize_requirement_states_v1` is a server-only cache boundary. It receives a deterministic full projection for one Idea/revision/Blueprint and replaces the persisted Requirement-state cache atomically. It does not increment `engine_revision` because it materializes derived state rather than changing canonical inputs.

Each row records `evaluated_engine_revision`; consumers must not treat a row evaluated at an older Idea revision as current.

## R3 completion criteria

- lifecycle transitions and idempotency verified ;
- stale-before-start and stale-on-complete verified ;
- direct client access remains unavailable ;
- promotion allowlist blocks human/formal-authority mutations ;
- promotion retries do not duplicate mutations or increment revision twice ;
- promoted records preserve action-run lineage ;
- Requirement-state cache materialization is revision/Blueprint guarded ;
- production validation uses rollback-only fixtures ;
- no provider, Worker runtime or durable async mechanism is activated yet.

# 4b4c / 2b2c — G2 Action Lifecycle V0.3 Validation — 2026-09-15

Status: **TARGETED RECOVERY / ATTEMPT-FENCING ROLLBACK PASS — NON ACTIVE**

Candidates:

- `G2_ACTION_LIFECYCLE_V0_3_ATTEMPT_FENCED.sql`;
- `G2_ACTION_INPUT_BOUNDARY_V0_2_ATTEMPT_FENCED.sql`;
- `G2_EVIDENCE_PLANNER_V0_11_RECOVERY.sql`.

## Defect addressed

Before an adapter is allowed to execute external work, interrupted HTTP requests must not leave Action Runs permanently blocking the planner.

Without recovery/fencing, failures after create/start/complete could leave:

- `queued` work never started;
- `running` work stuck forever;
- `succeeded` work never promoted;
- an old executor completing after a retry and overwriting a newer attempt.

## Candidate semantics

Planner V0.11 surfaces current-basis run recovery:

- `queued` → `START`;
- recent `running` → inflight;
- `running` older than 300 seconds → `RECOVER_EXPIRED`;
- `succeeded` + unpromoted → `PROMOTE`.

Lifecycle V0.3:

- every start returns the current `attempt`;
- retry/recovery increments attempt;
- executor input requires exact attempt;
- completion requires exact attempt;
- an executor from attempt N cannot read or complete attempt N+1.

## Rollback scenario

A synthetic `SITE_VITRINE@0.5` CALC Action Run exercised the full interruption sequence:

1. newly created queued run surfaced as `START` recoverable — PASS;
2. start returned `running / attempt=1` — PASS;
3. planner classified recent running as inflight, not recoverable — PASS;
4. started_at moved beyond 5-minute lease; planner surfaced `RECOVER_EXPIRED` — PASS;
5. recovery returned `queued / attempt=2` — PASS;
6. restart returned `running / attempt=2` — PASS;
7. attempt-1 executor input rejected with `ACTION_RUN_ATTEMPT_STALE` — PASS;
8. attempt-2 input accepted — PASS;
9. attempt-1 completion rejected with `ACTION_RUN_ATTEMPT_STALE` — PASS;
10. attempt-2 completion succeeded — PASS;
11. succeeded/unpromoted run surfaced as `PROMOTE` recoverable — PASS.

## Rollback verification

After rollback:

- start V2 absent;
- complete V2 absent;
- recovery RPC absent;
- planner V0.11 absent;
- input boundary V0.2 absent;
- synthetic fixture absent.

## Result

**RECOVERY / ATTEMPT FENCING: PASS.**

This closes the request-interruption/stuck-run race before `evidence.advance` implementation. G2 remains non-active.

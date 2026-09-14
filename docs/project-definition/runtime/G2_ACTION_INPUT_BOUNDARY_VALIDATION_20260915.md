# 4b4c / 2b2c — G2 Action Input Boundary Validation — 2026-09-15

Status: **TARGETED ROLLBACK PASS — NON ACTIVE**

Candidate:
`sql-candidates/G2_ACTION_INPUT_BOUNDARY_V0_1.sql`.

## Purpose

Future `evidence.advance` executors need bounded canonical inputs after an Action Run starts. The Worker must not gain an arbitrary service-role SQL/select surface.

`get_g2_action_input_candidate_v1(action_run_id,current_input_fingerprint)` therefore exposes only a fixed G2 context contract after validating:

- Action Run exists and is a G2 path;
- status is `running`;
- exact Action input fingerprint;
- active `SITE_VITRINE@0.5`;
- unchanged engine revision;
- exact current target Requirement basis fingerprints.

Returned data is bounded to:

- Idea identity/revision/title/description;
- Action Run path/targets/fingerprints/permissions;
- fixed Requirement-state allowlist;
- currently referenced active Information Items only;
- at most 40 current Source metadata records, without fetched page bodies;
- selected RAW source + max 22k original text only when acquisition path is RAW.

## Rollback test

The full validated G2 V0.4 package plus this candidate was loaded into one explicit transaction.

A synthetic `SITE_VITRINE@0.5` Idea exercised both CALC and RAW paths.

Assertions:

1. read before lifecycle `start` → rejected `ACTION_RUN_NOT_RUNNING`;
2. CALC after valid start → input snapshot returned;
3. CALC output contains no `raw_input`;
4. wrong Action input fingerprint → rejected `STALE_INPUT_FINGERPRINT`;
5. target Requirement basis changed after run creation → rejected `STALE_TARGET_REQUIREMENT`;
6. RAW run after valid start → selected canonical `human_raw` Source returned;
7. RAW text available only on RAW path and bounded by the RPC contract.

Result: **PASS**.

## Rollback verification

After rollback:

- `get_g2_action_input_candidate_v1` absent;
- synthetic Idea absent.

No persistent G2 DDL or fixture remained.

## Conclusion

The future adapter now has a safe read boundary and does not need arbitrary service-role table reads.

**TARGETED INPUT-BOUNDARY PASS — NON ACTIVE.**

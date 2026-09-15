# 4b4c / 2b2c — G2 Migration Package Manifest V0.7

Date: 2026-09-15
Status: **CANDIDATE PACKAGE — NON ACTIVE — DO NOT APPLY TO PRODUCTION**

V0.7 supersedes V0.6 as candidate-package authority.

Delta from V0.6:
- retain the exact attempt-fenced/recoverable V0.6 package;
- add terminal `NO_RESOLUTION` finalization so a valid executor can finish without fabricating evidence or bumping Idea revision.

## Exact package order

| # | File | Git blob SHA | Role |
|---|---|---|---|
| 1 | `sql-candidates/G2_SCHEMA_ADDITIONS_V0_1_FINAL.sql` | `b7edf9d24e89ecef41ee3cae34534aa0d76ec261` | schema/lineage |
| 2 | `sql-candidates/G0_CREATION_REDESIGN_RESOLVER_V0_4_RAW_SELECTION.sql` | `1de7c2b71aef27d51ee90edec52dc85755ccd439` | structural prerequisite |
| 3 | `sql-candidates/G2_FINAL_HELPERS_V0_1_AUTHORITY.sql` | `d26ebabf8adad81518b3a984d1bab37e39107da4` | deterministic helpers |
| 4 | `sql-candidates/G2_REQUIREMENT_REF_FRESHNESS_V0_1.sql` | `5fd671a55cc1923d1c53b45ebbf9af1e0e05c34b` | ref freshness |
| 5 | `sql-candidates/G2_EVIDENCE_RECOMPUTE_V0_6_REF_FRESHNESS.sql` | `dda11080beff3dccdc5351d793488468fbb1ef80` | recompute |
| 6 | `sql-candidates/G2_RESOLUTION_PATH_POLICY_V0_1.sql` | `d6e3f4f9cd8451b7453163a5371c7d0070e483e3` | resolving/supportive path authority |
| 7 | `sql-candidates/G2_EVIDENCE_PLANNER_V0_10_RESOLUTION_SAFE.sql` | `9d02bbfdf72dc9187c9a7f72d6030b6426747cad` | resolution-safe base planner |
| 8 | `sql-candidates/G2_HUMAN_BASIS_LINEAGE_V0_2_IDEMPOTENCY.sql` | `6c76a9002e58761cf7007f9e858e62634fbe58bc` | human basis writer |
| 9 | `sql-candidates/G2_ACCEPTED_UNKNOWN_V0_1_BASIS.sql` | `bc9efd2428c6f7b01ce3385620b450dee080c98f` | basis unknown writer |
| 10 | `sql-candidates/G2_SYSTEM_ACTION_BOUNDARY_V0_1.sql` | `0d6b344ff5aa24c4a925ef2bb8123ea58655085e` | non-research create/promotion |
| 11 | `sql-candidates/G2_ACTION_LIFECYCLE_V0_3_ATTEMPT_FENCED.sql` | `7b3a57e5dd12cb909b5b997387f20b40f1ead90f` | start/retry/recovery/complete with attempt fencing |
| 12 | `sql-candidates/G2_EVIDENCE_PLANNER_V0_11_RECOVERY.sql` | `dad9816946a88617926af0eebc0299af3f29b08c` | recovery-aware planner wrapper |
| 13 | `sql-candidates/G2_ACTION_INPUT_BOUNDARY_V0_2_ATTEMPT_FENCED.sql` | `b38bd43084953f7224f0e0bec4bd33790bccbceb` | bounded attempt-fenced executor inputs |
| 14 | `sql-candidates/G2_ATOMIC_RESEARCH_PROMOTION_V0_2_HARDENING.sql` | `96a79139a2dd75976dd1824858f6e5bfb8dd3c19` | atomic research promotion core |
| 15 | `sql-candidates/G2_RESEARCH_ACTION_V0_4_BLUEPRINT_GUARD.sql` | `75b5605fc61e909ce997044df7ece5170a50fb27` | final research create boundary |
| 16 | `sql-candidates/G2_RESEARCH_PROMOTION_V0_3_BLUEPRINT_GUARD.sql` | `7f37fb85a531b3a2e0a8973ddbbac066843dad60` | final research promotion entrypoint |
| 17 | `sql-candidates/G2_NO_RESOLUTION_FINALIZATION_V0_1.sql` | `56fe8d58bf2fcc845d2a964e8cfced48902bc8a6` | honest zero-mutation terminal finalization |

## Additional V0.7 invariants

1. An executor is never required to fabricate evidence merely to close an Action Run.
2. `NO_RESOLUTION` is terminal only after a succeeded run with zero proposed mutations.
3. The terminal reason is explicit and allowlisted.
4. Exact attempt/input/Blueprint/revision/Requirement basis remain mandatory.
5. `NO_RESOLUTION` does not increment Idea revision.
6. The finalized run becomes exhausted on the same path+basis, allowing the planner to try another resolving path or declare capability exhaustion.
7. A material basis change permits a new run naturally.

## Adapter authority

Future `evidence.advance` must:
- call planner V0.11;
- process recovery before creating new work;
- use attempt-fenced start/input/complete;
- promote valid mutations through the correct research/non-research boundary;
- call `finalize_g2_action_no_resolution_candidate_v1` only for an explicit empty-mutation `NO_RESOLUTION` result.

## Validation authority

- V0.6 exact package compile: PASS — 16/16 blobs, 161,978 source bytes, rollback clean;
- NO_RESOLUTION targeted compile/security: `G2_NO_RESOLUTION_FINALIZATION_VALIDATION_20260915.md` — PASS;
- V0.7 exact 17-blob package compile/rollback remains required before V0.7 becomes the strongest validated package baseline.

## Remaining activation blockers

- V0.7 exact-manifest compile/SHA/rollback proof;
- real two-session same-Source advisory-lock concurrency proof;
- candidate adapter + executors QA;
- authenticated G2 E2E;
- explicit Blueprint 0.5/migration/runtime activation authority.

**NON ACTIVE.**

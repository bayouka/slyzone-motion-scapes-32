# 4b4c / 2b2c — G2 Migration Package Manifest V0.6

Date: 2026-09-15
Status: **CANDIDATE PACKAGE — NON ACTIVE — DO NOT APPLY TO PRODUCTION**

V0.6 supersedes V0.5 as candidate-package authority.

Delta:

- replace lifecycle V0.2 with attempt-fenced/recoverable lifecycle V0.3;
- replace action input boundary V0.1 with attempt-fenced V0.2;
- retain resolution-safe planner V0.10 as deterministic base;
- add planner V0.11 recovery wrapper.

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

## Recovery invariants

1. queued current run is resumed, not duplicated;
2. recent running run remains inflight;
3. running run older than 300 s may be recovered only through `recover_g2_action_run_candidate_v1`;
4. recovery/retry increments `attempt`;
5. executor input requires exact attempt;
6. completion requires exact attempt;
7. old executor from attempt N cannot read/complete attempt N+1;
8. succeeded/unpromoted run is surfaced by planner V0.11 as `PROMOTE` recoverable;
9. planner projection fingerprint includes recovery/inflight state;
10. no recovery bypasses current Blueprint/revision/target basis.

## Adapter authority

Future `evidence.advance` must call planner V0.11, not V0.10 directly.

Recovery modes are authoritative:

- `START` → start existing queued run;
- `RECOVER_EXPIRED` → recover with expected attempt, then start new attempt;
- `PROMOTE` → promote existing completed run without re-running provider work.

Only after recovery work is handled may `eligible_system_actions` create a new run.

## Validation authority

- path safety: `G2_RESOLUTION_PATH_POLICY_VALIDATION_20260915.md`;
- V0.5 package baseline: `G2_CONSOLIDATED_PACKAGE_V0_5_VALIDATION_20260915.md`;
- attempt recovery/fencing: `G2_ACTION_LIFECYCLE_V0_3_VALIDATION_20260915.md`.

V0.6 requires exact-manifest package compile/SHA/rollback proof before becoming the strongest validated baseline.

## Remaining activation blockers

- real two-session same-Source advisory-lock concurrency proof;
- candidate adapter + executors QA;
- authenticated G2 E2E;
- explicit Blueprint 0.5/migration/runtime activation authority.

**NON ACTIVE.**

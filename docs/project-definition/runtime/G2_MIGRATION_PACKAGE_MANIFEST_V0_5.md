# 4b4c / 2b2c — G2 Migration Package Manifest V0.5

Date: 2026-09-15
Status: **CANDIDATE PACKAGE — NON ACTIVE — DO NOT APPLY TO PRODUCTION**

V0.5 supersedes V0.4 as the candidate-package authority by adding the bounded service-only executor input boundary validated in `G2_ACTION_INPUT_BOUNDARY_VALIDATION_20260915.md`.

## Exact package order

| # | File | Git blob SHA | Role |
|---|---|---|---|
| 1 | `sql-candidates/G2_SCHEMA_ADDITIONS_V0_1_FINAL.sql` | `b7edf9d24e89ecef41ee3cae34534aa0d76ec261` | Additive schema parity/lineage |
| 2 | `sql-candidates/G0_CREATION_REDESIGN_RESOLVER_V0_4_RAW_SELECTION.sql` | `1de7c2b71aef27d51ee90edec52dc85755ccd439` | Structural prerequisite |
| 3 | `sql-candidates/G2_FINAL_HELPERS_V0_1_AUTHORITY.sql` | `d26ebabf8adad81518b3a984d1bab37e39107da4` | Deterministic G2 helpers |
| 4 | `sql-candidates/G2_REQUIREMENT_REF_FRESHNESS_V0_1.sql` | `5fd671a55cc1923d1c53b45ebbf9af1e0e05c34b` | Unified ref freshness |
| 5 | `sql-candidates/G2_EVIDENCE_RECOMPUTE_V0_6_REF_FRESHNESS.sql` | `dda11080beff3dccdc5351d793488468fbb1ef80` | G2 recompute |
| 6 | `sql-candidates/G2_RESOLUTION_PATH_POLICY_V0_1.sql` | `d6e3f4f9cd8451b7453163a5371c7d0070e483e3` | Resolving/supportive path contract |
| 7 | `sql-candidates/G2_EVIDENCE_PLANNER_V0_10_RESOLUTION_SAFE.sql` | `9d02bbfdf72dc9187c9a7f72d6030b6426747cad` | Resolution-safe planner |
| 8 | `sql-candidates/G2_HUMAN_BASIS_LINEAGE_V0_2_IDEMPOTENCY.sql` | `6c76a9002e58761cf7007f9e858e62634fbe58bc` | Human basis writer |
| 9 | `sql-candidates/G2_ACCEPTED_UNKNOWN_V0_1_BASIS.sql` | `bc9efd2428c6f7b01ce3385620b450dee080c98f` | Basis unknown writer |
| 10 | `sql-candidates/G2_SYSTEM_ACTION_BOUNDARY_V0_1.sql` | `0d6b344ff5aa24c4a925ef2bb8123ea58655085e` | Non-research Action Run boundary |
| 11 | `sql-candidates/G2_ACTION_LIFECYCLE_V0_2_UNIFIED.sql` | `c2c99b930bf5a2c11f7b4b0184d8c757e6e1ec0e` | Unified start/retry/complete guards |
| 12 | `sql-candidates/G2_ACTION_INPUT_BOUNDARY_V0_1.sql` | `ca78c4cdb635c5de89880da0ec412266a4b37b40` | Bounded service-only executor inputs |
| 13 | `sql-candidates/G2_ATOMIC_RESEARCH_PROMOTION_V0_2_HARDENING.sql` | `96a79139a2dd75976dd1824858f6e5bfb8dd3c19` | Tested atomic research promotion core; contains transient older create boundary |
| 14 | `sql-candidates/G2_RESEARCH_ACTION_V0_4_BLUEPRINT_GUARD.sql` | `75b5605fc61e909ce997044df7ece5170a50fb27` | Final research create boundary; MUST immediately replace transient definition |
| 15 | `sql-candidates/G2_RESEARCH_PROMOTION_V0_3_BLUEPRINT_GUARD.sql` | `7f37fb85a531b3a2e0a8973ddbbac066843dad60` | Final research promotion entrypoint |

## New V0.5 invariant

No G2 executor may obtain its canonical input through arbitrary service-role table queries.

After `start_g2_action_run_candidate_v1` succeeds, executor input must come through:

`get_g2_action_input_candidate_v1(action_run_id,current_input_fingerprint)`.

The RPC verifies Blueprint, run state, engine revision, Action input fingerprint and current target Requirement basis before returning a bounded fixed payload.

## Assembly invariants

All V0.4 invariants continue to apply, plus:

1. file #12 must load after unified lifecycle because it depends on `idea_g2_run_targets_current_v2`;
2. input boundary must remain service-role only;
3. provider/executor work must not begin before lifecycle start returns current/running;
4. RAW original text must only be returned on RAW path;
5. fetched WEB page bodies must never be returned by this RPC;
6. no arbitrary table/query selector is permitted.

## Validation authority

- planner/path safety: `G2_RESOLUTION_PATH_POLICY_VALIDATION_20260915.md`;
- V0.4 exact package: `G2_CONSOLIDATED_PACKAGE_V0_4_VALIDATION_20260915.md`;
- input boundary: `G2_ACTION_INPUT_BOUNDARY_VALIDATION_20260915.md`.

V0.5 still requires exact-manifest SHA/compile/rollback validation as a single package before it becomes the strongest validated baseline.

## Remaining blockers before production activation

- real two-session same-Source advisory-lock concurrency proof;
- candidate `evidence.advance` adapter implementation + red-team/QA;
- authenticated G2 runtime/business E2E after future activation;
- explicit Blueprint 0.5 + migration + runtime activation authority.

**NON ACTIVE.**

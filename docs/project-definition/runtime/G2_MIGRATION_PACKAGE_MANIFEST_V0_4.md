# 4b4c / 2b2c — G2 Migration Package Manifest V0.4

Date: 2026-09-15
Status: **CANDIDATE PACKAGE — NON ACTIVE — DO NOT APPLY TO PRODUCTION**

V0.4 supersedes V0.3 as the executable candidate-package authority.

The only functional package delta is the planner safety correction discovered before `evidence.advance` implementation:

- remove `G2_EVIDENCE_PLANNER_V0_9_REF_FRESHNESS.sql` from the executable package;
- add `G2_RESOLUTION_PATH_POLICY_V0_1.sql`;
- add `G2_EVIDENCE_PLANNER_V0_10_RESOLUTION_SAFE.sql`.

The new policy separates **gate-satisfying resolving paths** from **supportive-only paths** and prevents automatic reruns of a path already promoted on the same Requirement + basis without resolving it.

## Exact package order

| # | File | Git blob SHA | Role |
|---|---|---|---|
| 1 | `sql-candidates/G2_SCHEMA_ADDITIONS_V0_1_FINAL.sql` | `b7edf9d24e89ecef41ee3cae34534aa0d76ec261` | Additive schema parity/lineage |
| 2 | `sql-candidates/G0_CREATION_REDESIGN_RESOLVER_V0_4_RAW_SELECTION.sql` | `1de7c2b71aef27d51ee90edec52dc85755ccd439` | Structural prerequisite |
| 3 | `sql-candidates/G2_FINAL_HELPERS_V0_1_AUTHORITY.sql` | `d26ebabf8adad81518b3a984d1bab37e39107da4` | G2 deterministic helpers |
| 4 | `sql-candidates/G2_REQUIREMENT_REF_FRESHNESS_V0_1.sql` | `5fd671a55cc1923d1c53b45ebbf9af1e0e05c34b` | Unified ref freshness |
| 5 | `sql-candidates/G2_EVIDENCE_RECOMPUTE_V0_6_REF_FRESHNESS.sql` | `dda11080beff3dccdc5351d793488468fbb1ef80` | G2 recompute |
| 6 | `sql-candidates/G2_RESOLUTION_PATH_POLICY_V0_1.sql` | `d6e3f4f9cd8451b7453163a5371c7d0070e483e3` | Resolving/supportive path contract |
| 7 | `sql-candidates/G2_EVIDENCE_PLANNER_V0_10_RESOLUTION_SAFE.sql` | `9d02bbfdf72dc9187c9a7f72d6030b6426747cad` | Resolution-safe / loop-resistant planner |
| 8 | `sql-candidates/G2_HUMAN_BASIS_LINEAGE_V0_2_IDEMPOTENCY.sql` | `6c76a9002e58761cf7007f9e858e62634fbe58bc` | Human basis writer |
| 9 | `sql-candidates/G2_ACCEPTED_UNKNOWN_V0_1_BASIS.sql` | `bc9efd2428c6f7b01ce3385620b450dee080c98f` | Basis unknown writer |
| 10 | `sql-candidates/G2_SYSTEM_ACTION_BOUNDARY_V0_1.sql` | `0d6b344ff5aa24c4a925ef2bb8123ea58655085e` | Non-research G2 boundary |
| 11 | `sql-candidates/G2_ACTION_LIFECYCLE_V0_2_UNIFIED.sql` | `c2c99b930bf5a2c11f7b4b0184d8c757e6e1ec0e` | Unified lifecycle |
| 12 | `sql-candidates/G2_ATOMIC_RESEARCH_PROMOTION_V0_2_HARDENING.sql` | `96a79139a2dd75976dd1824858f6e5bfb8dd3c19` | Previously tested atomic research promotion core; includes transient older `create_action_run_v4` |
| 13 | `sql-candidates/G2_RESEARCH_ACTION_V0_4_BLUEPRINT_GUARD.sql` | `75b5605fc61e909ce997044df7ece5170a50fb27` | MUST immediately replace transient create boundary with final Blueprint/target guard |
| 14 | `sql-candidates/G2_RESEARCH_PROMOTION_V0_3_BLUEPRINT_GUARD.sql` | `7f37fb85a531b3a2e0a8973ddbbac066843dad60` | Final research promotion entrypoint |

## Assembly invariants

1. Every blob SHA MUST match before execution.
2. Files #12 and #13 MUST remain adjacent and in this order.
3. Post-load validation MUST prove the final `create_action_run_v4` contains Blueprint 0.5 + current target-basis guards.
4. `G2_EVIDENCE_PLANNER_V0_9_REF_FRESHNESS.sql` is superseded and MUST NOT be assembled.
5. `G2_RESEARCH_PROMOTION_CORE_V0_1_FINAL.sql` remains superseded and MUST NOT be assembled.
6. `eligible_system_actions` from planner V0.10 may contain only paths that `idea_g2_path_can_resolve_v1(...)` proves gate-satisfying.
7. Supportive paths MUST remain metadata-only (`supportive_capabilities`).
8. A successfully promoted path on the same Requirement+basis that did not resolve the Requirement MUST be exhausted rather than auto-rerun.

## Runtime routing

- `WEB`, `AUDIT`, `CONN` → research Action Run boundary → unified lifecycle → atomic research promotion.
- `MEM`, `RAW`, `SRC`, `CALC`, `AI_H`, `AI_R` → non-research G2 Action Run boundary → unified lifecycle → basis-aware system promotion.
- human correction → basis-scoped human writer.
- accepted unknown → basis-scoped unknown writer.

The planner may expose supportive capabilities, but the future adapter MUST NOT execute them as standalone Requirement-completion attempts.

## Validation authority

Targeted path/planner validation:
`G2_RESOLUTION_PATH_POLICY_VALIDATION_20260915.md`.

V0.3 package single-transaction baseline:
`G2_CONSOLIDATED_PACKAGE_VALIDATION_20260914.md`.

V0.4 still requires its own exact-manifest single-transaction compile/SHA/rollback proof before it can replace V0.3 as the validated package baseline.

## Remaining blockers

- real two-session Source advisory-lock concurrency proof;
- authenticated release/E2E proof for any future G2 runtime;
- Blueprint `SITE_VITRINE@0.5`, `evidence.advance`, frontend G2 and production migration remain non-active until explicit activation authority.

**NON ACTIVE.**

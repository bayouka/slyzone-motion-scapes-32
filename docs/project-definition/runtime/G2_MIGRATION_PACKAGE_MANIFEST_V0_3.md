# 4b4c / 2b2c — G2 Migration Package Manifest V0.3

Date: 2026-09-14
Status: **CANDIDATE PACKAGE — NON ACTIVE — DO NOT APPLY TO PRODUCTION**

V0.3 supersedes V0.2 as the executable assembly authority. The standalone extracted research core V0.1 is excluded because single-transaction compilation detected an extraction defect. V0.3 deliberately uses the previously rollback-tested V0.2 hardening source, immediately followed by the final Blueprint-guarded `create_action_run_v4` definition. Final catalog state, not intermediate DDL order, is authoritative.

## Exact package order

| # | File | Git blob SHA | Role |
|---|---|---|---|
| 1 | `sql-candidates/G2_SCHEMA_ADDITIONS_V0_1_FINAL.sql` | `b7edf9d24e89ecef41ee3cae34534aa0d76ec261` | Additive schema parity/lineage |
| 2 | `sql-candidates/G0_CREATION_REDESIGN_RESOLVER_V0_4_RAW_SELECTION.sql` | `1de7c2b71aef27d51ee90edec52dc85755ccd439` | Structural prerequisite |
| 3 | `sql-candidates/G2_FINAL_HELPERS_V0_1_AUTHORITY.sql` | `d26ebabf8adad81518b3a984d1bab37e39107da4` | G2 deterministic helpers |
| 4 | `sql-candidates/G2_REQUIREMENT_REF_FRESHNESS_V0_1.sql` | `5fd671a55cc1923d1c53b45ebbf9af1e0e05c34b` | Unified ref freshness |
| 5 | `sql-candidates/G2_EVIDENCE_RECOMPUTE_V0_6_REF_FRESHNESS.sql` | `dda11080beff3dccdc5351d793488468fbb1ef80` | G2 recompute |
| 6 | `sql-candidates/G2_EVIDENCE_PLANNER_V0_9_REF_FRESHNESS.sql` | `ba59b9562622328fed28ca206bdfc5f11f19cce4` | G2 planner |
| 7 | `sql-candidates/G2_HUMAN_BASIS_LINEAGE_V0_2_IDEMPOTENCY.sql` | `6c76a9002e58761cf7007f9e858e62634fbe58bc` | Human basis writer |
| 8 | `sql-candidates/G2_ACCEPTED_UNKNOWN_V0_1_BASIS.sql` | `bc9efd2428c6f7b01ce3385620b450dee080c98f` | Basis unknown writer |
| 9 | `sql-candidates/G2_SYSTEM_ACTION_BOUNDARY_V0_1.sql` | `0d6b344ff5aa24c4a925ef2bb8123ea58655085e` | Non-research G2 boundary |
| 10 | `sql-candidates/G2_ACTION_LIFECYCLE_V0_2_UNIFIED.sql` | `c2c99b930bf5a2c11f7b4b0184d8c757e6e1ec0e` | Unified lifecycle |
| 11 | `sql-candidates/G2_ATOMIC_RESEARCH_PROMOTION_V0_2_HARDENING.sql` | `96a79139a2dd75976dd1824858f6e5bfb8dd3c19` | Previously tested atomic research promotion core; includes transient older `create_action_run_v4` |
| 12 | `sql-candidates/G2_RESEARCH_ACTION_V0_4_BLUEPRINT_GUARD.sql` | `75b5605fc61e909ce997044df7ece5170a50fb27` | MUST immediately replace transient create boundary with final Blueprint/target guard |
| 13 | `sql-candidates/G2_RESEARCH_PROMOTION_V0_3_BLUEPRINT_GUARD.sql` | `7f37fb85a531b3a2e0a8973ddbbac066843dad60` | Final research promotion entrypoint |

## Assembly invariant

Files #11 and #12 are intentionally adjacent. Any assembler must verify both blob SHAs and preserve this order. Post-load validation MUST inspect `pg_get_functiondef(public.create_action_run_v4)` and prove the final definition contains `G2_BLUEPRINT_0_5_NOT_ACTIVE` and `STALE_TARGET_REQUIREMENT` / target-state validation. Intermediate function definitions inside a transaction are not activation state.

`G2_RESEARCH_PROMOTION_CORE_V0_1_FINAL.sql` is explicitly superseded and MUST NOT be assembled.

## Runtime routing

- `WEB`, `AUDIT`, `CONN` → `create_action_run_v4` → unified G2 lifecycle → `promote_research_action_result_v3`.
- `MEM`, `RAW`, `SRC`, `CALC`, `AI_H`, `AI_R` → `create_g2_system_action_run_candidate_v1` → unified G2 lifecycle → `promote_g2_system_action_result_candidate_v1`.
- human correction → `apply_human_g2_information_candidate_v2`.
- accepted unknown → `accept_idea_g2_requirement_unknown_candidate_v1`.

G1 RPCs remain untouched and authoritative for Blueprint 0.4.

## Remaining blockers

1. Full manifest V0.3 package must compile and validate in one `BEGIN … ROLLBACK` transaction.
2. Post-rollback zero-residue verification.
3. Real two-session Source advisory-lock concurrency proof (connector calls are serialized; sequential calls are not proof).
4. Release authority blockers outside G2, including G1 build 544 runtime/E2E certification as applicable.

**NON ACTIVE.** No G2 migration has been applied; Blueprint 0.5 remains non-active.

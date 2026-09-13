# 4b4c / 2b2c — G2 Migration Package Manifest V0.1

Date: 2026-09-14
Status: **CANDIDATE PACKAGE — NON ACTIVE — DO NOT APPLY TO PRODUCTION**

This manifest freezes the exact SQL candidate set and load order for the future single-file G2 migration candidate. GitHub remains the canonical source. Blueprint `SITE_VITRINE@0.5` remains non-active.

## 1. Package order

| # | File | Blob SHA | Role | Status in package |
|---|---|---|---|---|
| 1 | `sql-candidates/G2_SCHEMA_ADDITIONS_V0_1_FINAL.sql` | `b7edf9d24e89ecef41ee3cae34534aa0d76ec261` | Additive Source lineage, direct-human basis lineage, criticality vocabulary parity | FINAL |
| 2 | `sql-candidates/G0_CREATION_REDESIGN_RESOLVER_V0_4_RAW_SELECTION.sql` | `1de7c2b71aef27d51ee90edec52dc85755ccd439` | Selected-RAW basis + authority-aware creation/redesign prerequisite | FINAL |
| 3 | `sql-candidates/G2_FINAL_HELPERS_V0_1_AUTHORITY.sql` | `d26ebabf8adad81518b3a984d1bab37e39107da4` | Deterministic G2 policy, paths, materiality, dependencies | FINAL |
| 4 | `sql-candidates/G2_REQUIREMENT_REF_FRESHNESS_V0_1.sql` | `5fd671a55cc1923d1c53b45ebbf9af1e0e05c34b` | Unified machine/direct-human basis-current predicate | FINAL |
| 5 | `sql-candidates/G2_EVIDENCE_RECOMPUTE_V0_6_REF_FRESHNESS.sql` | `dda11080beff3dccdc5351d793488468fbb1ef80` | Basis-aware G2 materialization using unified ref freshness | FINAL |
| 6 | `sql-candidates/G2_EVIDENCE_PLANNER_V0_9_REF_FRESHNESS.sql` | `ba59b9562622328fed28ca206bdfc5f11f19cce4` | Integrated deterministic G2 planner | FINAL |
| 7 | `sql-candidates/G2_HUMAN_BASIS_LINEAGE_V0_2_IDEMPOTENCY.sql` | `6c76a9002e58761cf7007f9e858e62634fbe58bc` | Human G2 writer bound to current basis, exact retry safe | FINAL |
| 8 | `sql-candidates/G2_ACCEPTED_UNKNOWN_V0_1_BASIS.sql` | `bc9efd2428c6f7b01ce3385620b450dee080c98f` | Basis-scoped accepted-unknown writer | FINAL |
| 9 | `sql-candidates/G2_SYSTEM_ACTION_BOUNDARY_V0_1.sql` | `0d6b344ff5aa24c4a925ef2bb8123ea58655085e` | Non-research G2 create/promote boundary for MEM/RAW/SRC/CALC/AI_H/AI_R | FINAL |
| 10 | `sql-candidates/G2_ACTION_LIFECYCLE_V0_2_UNIFIED.sql` | `c2c99b930bf5a2c11f7b4b0184d8c757e6e1ec0e` | Unified G2 start/retry/complete basis/revision guards | FINAL |
| 11 | `sql-candidates/G2_ATOMIC_RESEARCH_PROMOTION_V0_2_HARDENING.sql` | `96a79139a2dd75976dd1824858f6e5bfb8dd3c19` | Atomic research Source + observation promotion core (`idea_sensitivity_rank_v1`, `promote_research_action_result_v2`) | TRANSITIONAL SOURCE — see ordering note |
| 12 | `sql-candidates/G2_RESEARCH_ACTION_V0_4_BLUEPRINT_GUARD.sql` | `75b5605fc61e909ce997044df7ece5170a50fb27` | Final research-only `create_action_run_v4`; MUST overwrite V0.2's earlier create definition | FINAL |
| 13 | `sql-candidates/G2_RESEARCH_PROMOTION_V0_3_BLUEPRINT_GUARD.sql` | `7f37fb85a531b3a2e0a8973ddbbac066843dad60` | Final Blueprint-guarded research promotion entrypoint | FINAL |

## 2. Important assembly rule

`G2_ATOMIC_RESEARCH_PROMOTION_V0_2_HARDENING.sql` contains both the required promotion core and an older `create_action_run_v4` definition. Until the promotion core is extracted into a clean standalone final file, package assembly MUST load file #12 after #11 so the final database definition of `public.create_action_run_v4` is the V0.4 Blueprint + target-basis guarded version.

The future single-file migration should preferably **extract only** `app_private.idea_sensitivity_rank_v1` + `public.promote_research_action_result_v2` from #11, avoiding the transient old create definition entirely.

## 3. Explicitly superseded — never assemble

Do not include older candidates when building the package, including:

- `G0_CREATION_REDESIGN_RESOLVER_V0_1.sql`
- `G0_CREATION_REDESIGN_RESOLVER_V0_2_BASIS.sql`
- `G0_CREATION_REDESIGN_RESOLVER_V0_3_AUTHORITY.sql`
- `G2_EVIDENCE_RECOMPUTE_V0_1.sql`
- `G2_EVIDENCE_RECOMPUTE_V0_2_BASIS_FINGERPRINT.sql`
- `G2_EVIDENCE_RECOMPUTE_V0_3_G0_BASIS.sql`
- `G2_EVIDENCE_RECOMPUTE_V0_4_FINAL.sql`
- `G2_EVIDENCE_RECOMPUTE_V0_5_RAW_V4.sql`
- planners V0.1 through V0.8
- `G2_HUMAN_BASIS_LINEAGE_V0_1.sql`
- `G2_RESEARCH_ACTION_LIFECYCLE_V0_1_TARGET_GUARDS.sql`
- `G2_RESEARCH_ACTION_V0_3_TARGET_GUARD.sql`
- standalone criticality parity candidate now absorbed by schema additions.

## 4. Runtime routing contract

The privileged adapter must route planner actions as follows:

- `WEB`, `AUDIT`, `CONN` → research creation boundary `create_action_run_v4` → unified G2 lifecycle → `promote_research_action_result_v3`.
- `MEM`, `RAW`, `SRC`, `CALC`, `AI_H`, `AI_R` → `create_g2_system_action_run_candidate_v1` → unified G2 lifecycle → `promote_g2_system_action_result_candidate_v1`.
- direct-human G2 corrections → `apply_human_g2_information_candidate_v2`.
- deliberate unknown acceptance → `accept_idea_g2_requirement_unknown_candidate_v1`.

G1 RPCs remain authoritative for active Blueprint 0.4 and MUST NOT be replaced:
`create_action_run_v3`, `start_action_run_v1`, `retry_action_run_v1`, `complete_action_run_v1`, `promote_action_result_v1`, `apply_human_information_v1`, `accept_idea_requirement_unknown_v1`.

## 5. Rollback validation already passed

Validated against the live 4b4c PostgreSQL schema, always inside rollbacked transactions:

- creation/redesign authority: machine redesign → human creation override → human conflict;
- selected RAW basis: non-selected RAW changes do not stale; selected RAW change does stale;
- greenfield/refonte competitive materiality;
- 9 G2 Requirement materialization and basis propagation;
- machine result accepted only on exact current target basis;
- direct-human result accepted only on exact current target basis;
- legacy unscoped direct ref ignored by G2;
- accepted unknown exact-basis semantics + idempotency + supersession;
- research create target/Blueprint guards;
- research start/retry target/revision guards;
- non-research CALC create → start → complete → promote happy path;
- target change during non-research run → stale/non-promotable;
- unified retry: current queued idempotent, current failed requeued, old-basis queued stale;
- direct-human writer: initial write, exact retry after revision bump, idempotency-key reuse rejection.

## 6. Remaining pre-migration blockers

1. Build the literal single-file consolidated SQL candidate from this manifest and compile/run it as ONE transaction (`BEGIN ... ROLLBACK`).
2. Verify post-rollback zero residue: candidate functions, columns, indexes, constraints, fixtures.
3. Real two-session concurrency test for research Source advisory lock / same Source identity promotion.
4. Preserve previously required release blockers: G1 build 544 E2E/certification as applicable and any release authority checks still open.
5. No activation of Blueprint 0.5, Worker `evidence.advance`, frontend G2 or production migration before all blockers are closed.

## 7. Activation status

**NON ACTIVE.** This manifest is an assembly authority only. It is not a migration and must not be placed in `supabase/migrations/` until the complete pre-migration proof is green.
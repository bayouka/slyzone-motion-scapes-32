# 4b4c / 2b2c — G2 Consolidated Package V0.4 Validation — 2026-09-15

Status: **PASS FOR EXACT-MANIFEST SINGLE-TRANSACTION COMPILE / ROLLBACK — NON ACTIVE**

Authority: `G2_MIGRATION_PACKAGE_MANIFEST_V0_4.md`.

## Purpose

Revalidate the full G2 package after replacing planner V0.9 with the resolution-safe path policy + planner V0.10.

## Exact-source verification

PostgreSQL fetched all raw files directly from canonical GitHub `main` and recomputed each Git blob SHA using:

`SHA1("blob <byte_length>\0" || file_bytes)`.

Result:

- manifest files: **14**;
- Git blob SHA verified: **14/14**;
- source bytes: **144,454**;
- concatenated source MD5: `8451a4abc27896fd97651b04c32c7b4a`.

A SHA mismatch or HTTP failure was configured as a hard failure before package execution.

## Single-transaction compilation

The 14 verified sources were concatenated in manifest order and dynamically executed as one unit inside explicit `BEGIN … ROLLBACK`.

Catalog assertions passed:

- `plan_idea_evidence_context_candidate_v10(...)` present;
- `idea_g2_policy_v3()` present;
- `idea_g2_path_can_resolve_v1(...)` present;
- superseded planner V0.9 absent from the V0.4 package state;
- final `create_action_run_v4` contains `G2_BLUEPRINT_0_5_NOT_ACTIVE` and `STALE_TARGET_REQUIREMENT` guards;
- `idea_sources.created_by_action_run_id` present during the transaction;
- `idea_information_requirement_refs.target_basis_fingerprint` present during the transaction;
- key resolution-path invariants still pass after full-package load.

## G1 non-regression

Before package load, definition hashes were captured for these eight active G1 RPCs:

- `accept_idea_requirement_unknown_v1`;
- `apply_human_information_v1`;
- `complete_action_run_v1`;
- `create_action_run_v3`;
- `get_idea_workspace_projection_v1`;
- `plan_idea_foundation_v1`;
- `promote_action_result_v1`;
- `start_action_run_v1`.

During package load:

- present: **8/8**;
- definition changes: **0**.

## Zero-residue verification after rollback

Independent post-rollback inspection returned:

- planner V0.10: absent;
- policy V3: absent;
- path guard: absent;
- Source Action Run lineage column: absent;
- human Requirement basis-lineage column: absent;
- active G1 RPCs: **8/8 intact**.

No G2 DDL, function or fixture persisted.

## Related behavioural validation

`G2_RESOLUTION_PATH_POLICY_VALIDATION_20260915.md` separately proved:

1. supportive-only capability does not enter `eligible_system_actions`;
2. a gate-satisfying resolving path is selected when available;
3. a path already promoted on the same Requirement+basis without resolution is exhausted rather than automatically rerun.

## Result

**V0.4 EXACT PACKAGE: PASS / ROLLBACK CLEAN / G1 UNCHANGED.**

This supersedes V0.3 as the strongest validated G2 SQL package baseline, but it remains strictly **NON ACTIVE**.

## Remaining blockers before production G2 activation

- real two-session advisory-lock concurrency proof for same Source identity;
- authenticated G2 runtime/business E2E after a future adapter exists;
- explicit activation authority for Blueprint `SITE_VITRINE@0.5`, migration, `evidence.advance` and G2 frontend.

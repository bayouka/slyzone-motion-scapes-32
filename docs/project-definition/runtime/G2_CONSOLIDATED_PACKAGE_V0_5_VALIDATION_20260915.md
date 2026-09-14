# 4b4c / 2b2c — G2 Consolidated Package V0.5 Validation — 2026-09-15

Status: **PASS FOR EXACT-MANIFEST SINGLE-TRANSACTION COMPILE / ROLLBACK — NON ACTIVE**

Authority: `G2_MIGRATION_PACKAGE_MANIFEST_V0_5.md`.

## Exact package proof

Canonical GitHub raw files were fetched directly by PostgreSQL. Each file's Git blob SHA was recomputed and compared with the manifest before execution.

Result:

- exact files: **15**;
- SHA verified: **15/15**;
- source bytes: **152,969**;
- concatenated bundle MD5: `ce7ea65fcbff7250215c89960127d4c1`;
- full package compilation: **PASS**.

## Added V0.5 authority

`get_g2_action_input_candidate_v1(uuid,text)` is present in the loaded package and its final definition contains the required guards:

- `ACTION_RUN_NOT_RUNNING`;
- `STALE_TARGET_REQUIREMENT`;
- `G2_BLUEPRINT_0_5_NOT_ACTIVE`.

Planner V0.10 and the resolution path guard are also present in the exact assembled state.

## Related behaviour proof

`G2_ACTION_INPUT_BOUNDARY_VALIDATION_20260915.md` separately proves:

- no executor read before lifecycle start;
- exact input fingerprint required;
- stale target basis rejected;
- CALC never receives RAW text;
- RAW receives only the canonical selected RAW Source and bounded original text.

## Zero-residue after rollback

Independent post-rollback inspection returned:

- action input boundary: absent;
- planner V0.10: absent;
- path guard: absent;
- candidate Source lineage column: absent.

No G2 package state persisted.

## Result

**V0.5 EXACT PACKAGE: PASS / ROLLBACK CLEAN / NON ACTIVE.**

V0.5 is now the strongest validated SQL package baseline for future G2 adapter implementation.

Remaining production-activation blockers continue to include real two-session same-Source concurrency proof, adapter/runtime QA, authenticated G2 E2E and explicit Blueprint 0.5 activation authority.

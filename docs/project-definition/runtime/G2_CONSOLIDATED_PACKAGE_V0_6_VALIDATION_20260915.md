# 4b4c / 2b2c — G2 Consolidated Package V0.6 Validation — 2026-09-15

Status: **PASS FOR EXACT-MANIFEST SINGLE-TRANSACTION COMPILE / ROLLBACK — NON ACTIVE**

Authority: `G2_MIGRATION_PACKAGE_MANIFEST_V0_6.md`.

## Exact source proof

Canonical GitHub raw files were fetched directly by PostgreSQL and every Git blob SHA was recomputed before execution.

Result:

- exact files: **16**;
- SHA verified: **16/16**;
- source bytes: **161,978**;
- concatenated bundle MD5: `98f9bef34716acbb0799fddf5e91cc1e`;
- full package compilation: **PASS**.

## Catalog assertions

The assembled package contains:

- planner V0.11 recovery wrapper;
- start V2;
- retry V2;
- expired-run recovery RPC;
- completion V2 with attempt fencing;
- input boundary V0.2 with attempt fencing.

Function-definition inspection additionally confirmed:

- `ACTION_RUN_ATTEMPT_STALE` fencing in completion;
- `RECOVER_EXPIRED` and `PROMOTE` recovery modes in planner V0.11.

## Behaviour proof

`G2_ACTION_LIFECYCLE_V0_3_VALIDATION_20260915.md` separately proves the complete interrupted-request sequence:

`queued → START → recent running → expired running → recovery attempt+1 → old executor rejected → current completion → PROMOTE recovery`.

## Zero-residue after rollback

Independent post-rollback checks returned absent:

- planner V0.11;
- start V2;
- recovery RPC;
- completion V2;
- input V0.2;
- candidate Source Action Run lineage column.

No G2 runtime or schema state persisted.

## Result

**V0.6 EXACT PACKAGE: PASS / ROLLBACK CLEAN / NON ACTIVE.**

V0.6 is the strongest validated G2 SQL baseline for candidate `evidence.advance` implementation.

The remaining production-activation blockers include the real two-session same-Source advisory-lock concurrency proof, adapter/executor QA, authenticated G2 E2E and explicit Blueprint 0.5/migration/runtime activation authority.

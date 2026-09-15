# 4b4c / 2b2c — G2 Consolidated Package V0.7 Validation

Date: 2026-09-15
Status: **PASS — NON ACTIVE**

Authority: `G2_MIGRATION_PACKAGE_MANIFEST_V0_7.md`.

## Exact-manifest proof

The 17 candidate SQL sources were fetched from canonical GitHub `main` from their exact manifest paths. For every source, PostgreSQL recomputed the Git blob SHA-1 from the fetched UTF-8 bytes (`blob <len>\0<content>`) and compared it with the manifest SHA before assembly.

Result:
- verified blobs: **17/17**;
- SHA mismatches: **0**;
- all sources concatenated in manifest order;
- dynamic compilation/execution inside one explicit PostgreSQL transaction: **PASS**;
- planner V0.11 present inside transaction: **PASS**;
- attempt-fenced input boundary V0.2 present inside transaction: **PASS**;
- NO_RESOLUTION finalizer V0.1 present inside transaction: **PASS**;
- explicit `ROLLBACK` executed.

Post-rollback verification:
- planner V0.11 absent: **PASS**;
- NO_RESOLUTION finalizer absent: **PASS**;
- G2 input V0.2 absent: **PASS**.

Therefore no candidate DDL from this validation remains active in production.

## Harness note

An initial catalogue assertion used an incomplete `to_regprocedure` signature for planner V0.11 and correctly failed/rolled back. The exact function signature is `(uuid,bigint,text[],boolean)`. Re-running the same 17-blob SHA-verified package with the correct catalogue assertion passed. This was a harness assertion error, not a package compilation error.

## Baseline decision

V0.7 is now the strongest **validated candidate backend package baseline**. It remains explicitly NON ACTIVE. The next implementation target is the candidate Worker orchestration for `evidence.advance`, followed by executor QA and authenticated E2E before any activation decision.

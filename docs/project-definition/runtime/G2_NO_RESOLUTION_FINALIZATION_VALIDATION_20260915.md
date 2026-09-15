# 4b4c / 2b2c — G2 NO_RESOLUTION Finalization Validation

Date: 2026-09-15
Status: **TARGETED COMPILE/SECURITY PASS — NON ACTIVE**

Candidate validated:
- `sql-candidates/G2_NO_RESOLUTION_FINALIZATION_V0_1.sql`
- Git blob SHA: `56fe8d58bf2fcc845d2a964e8cfced48902bc8a6`

## Purpose

Allow a correctly executed G2 Action Run to terminate honestly when current inputs cannot produce a valid resolving mutation, without fabricating an Information Item/Ledger entry and without incrementing `ideas.engine_revision`.

## Validation executed against canonical Supabase

A transaction-scoped compile/security harness was executed against project `wexfzhegiewhldkugtow` and rolled back.

Result: **PASS**.

Verified:
1. candidate RPC compiles with the G2 current-context guard;
2. `anon` has no EXECUTE privilege;
3. `authenticated` has no EXECUTE privilege;
4. `service_role` retains EXECUTE privilege;
5. transaction rollback leaves no candidate function in production.

## Harness correction

The first harness intentionally exposed a test-harness error: the temporary test definition omitted the candidate file's `REVOKE ALL ... FROM public,anon,authenticated`, so PostgreSQL's default PUBLIC function EXECUTE privilege triggered `ANON_EXECUTE_FORBIDDEN`.

This was **not a candidate-code failure**. The transaction aborted and persisted nothing. The harness was corrected to reproduce the candidate privilege statements exactly; the security test then passed.

## Candidate invariants retained

- exact Action Run attempt required;
- only succeeded runs may finalize;
- proposed mutations must be empty;
- result must explicitly contain `terminal_outcome=NO_RESOLUTION` and an allowlisted terminal reason;
- current Blueprint/revision/input/Requirement target basis remains mandatory;
- stale context yields `stale`, not a false terminal success;
- finalization sets the canonical terminal marker without bumping Idea revision;
- repeated finalization of the same already-finalized NO_RESOLUTION run is idempotent.

## Remaining validation

Before activation, this primitive still needs to be included in the exact package manifest and exercised through the full adapter/E2E path. No production migration is authorized by this validation.

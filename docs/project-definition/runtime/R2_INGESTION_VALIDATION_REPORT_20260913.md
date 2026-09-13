# 4b4c — R2 Ingestion Validation Report — 2026-09-13

Status: **R2 PASS_INGESTION_BASELINE**

## Scope

R2 introduces RAW-first source/human mutation boundaries on top of R1. It does not enable autonomous AI actions, change the frontend flow, or switch the Cloudflare Worker to the new engine.

## Applied migration

- `20260913031644_idea_engine_r2_ingestion_rpcs`

Canonical GitHub source:
`supabase/migrations/20260913031644_idea_engine_r2_ingestion_rpcs.sql`

## Implemented boundaries

- `initialize_idea_engine_v1`
- `register_idea_source_v1`
- `commit_source_ingestion_v1`
- `supersede_source_v1`
- `apply_human_information_v1`

R2 also adds idempotency/request fingerprints to source and information rows and `evaluated_engine_revision` to persisted Requirement-state cache rows.

## Authorization / exposure

- human RPCs: authenticated + service role only ;
- `commit_source_ingestion_v1`: service role only ;
- no R2 RPC is executable by `anon` ;
- direct authenticated writes to R1 engine tables remain unavailable ;
- every human RPC checks `auth.uid()` and `app_private.can_write_idea` ;
- functions use empty `search_path`.

Supabase Security Advisor classifies the four intentionally authenticated R2 RPCs as signed-in `SECURITY DEFINER` endpoints. This is expected: clients deliberately have no direct table-write grants, so the narrow RPC is the authorization boundary. The functions have explicit EXECUTE grants and internal Idea access checks. `commit_source_ingestion_v1` is not exposed to authenticated users.

No R2 function appears in the anonymous SECURITY DEFINER finding.

## Transactional validation

Tests were run against the real production schema inside explicit transactions followed by `ROLLBACK`; no test data was retained.

Validated:
1. owner-authenticated engine initialization succeeds ;
2. exact initialization retry is idempotent and does not bump revision twice ;
3. authenticated direct INSERT into `idea_sources` is rejected ;
4. source registration increments revision once ;
5. source registration retry returns the original source without revision bump ;
6. stale expected engine revision is rejected (`STALE_ENGINE`) ;
7. human information insertion increments revision once ;
8. human information retry is idempotent ;
9. superseding human information preserves the old row as `SUPERSEDED` and creates a new `ACTIVE` row ;
10. service ingestion commits source content/version metadata ;
11. repeated ingestion of identical content is idempotent ;
12. source supersession is idempotent ;
13. reuse of one idempotency key with different source payload is rejected (`IDEMPOTENCY_KEY_REUSE`) ;
14. changed ingested source content stales directly linked active Information Items ;
15. stale source version is rejected (`STALE_SOURCE`) ;
16. a user without Idea write access is rejected.

Test markers returned:
- `R2_TRANSACTIONAL_TEST_PASS`
- `R2_SOURCE_CHANGE_TEST_PASS`
- `R2_UNAUTHORIZED_TEST_PASS`

## Production non-regression

After rollback verification:
- existing Ideas: unchanged ;
- legacy Idea remains `engine_revision = 0` with no assigned Blueprint ;
- `idea_sources`: 0 rows ;
- `idea_information_items`: 0 rows ;
- `idea_ledger_entries`: 0 rows ;
- no test artifacts persisted.

No frontend/Worker/Cloudflare runtime behavior was modified.

## Advisor review

Performance Advisor after R2 shows no unindexed-foreign-key finding introduced by R1/R2. The remaining seven FK findings concern pre-existing tables.

Security Advisor still reports pre-existing platform debt plus the four intentional signed-in R2 SECURITY DEFINER RPC endpoints. Their execution scope was explicitly verified. Existing unrelated warnings remain separately actionable and are not blockers for the R2 contract.

## R2 verdict

**PASS_INGESTION_BASELINE**.

R3 may now implement autonomous System Action lifecycle/orchestration boundaries (`idea_action_runs`) and deterministic result promotion. R3 must preserve R2/R1 permissions, idempotency and stale-safety and must not let an LLM mutate canonical state directly.

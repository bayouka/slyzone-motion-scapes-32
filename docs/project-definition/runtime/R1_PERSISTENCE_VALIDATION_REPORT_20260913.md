# 4b4c — R1 Persistence Validation Report — 2026-09-13

Status: **R1 PASS_PERSISTENCE_BASELINE**

## Scope

R1 implements only the durable persistence substrate required by the R0 deterministic engine. It does not switch the frontend, Worker, ingestion pipeline, AI orchestration or legacy Idea UX to the new engine.

## Applied Supabase migrations

- `20260913031001_idea_engine_r1_persistence_core`
- `20260913031053_idea_engine_r1_fk_indexes`

Both migrations are represented in the canonical GitHub repository under `supabase/migrations/` with matching versions/names.

## Persisted core

`ideas` now has nullable Blueprint metadata plus `engine_revision` and `active_project_definition_id`.

New tables:
- `idea_sources`
- `idea_information_items`
- `idea_requirement_states`
- `idea_action_runs`
- `idea_snapshots`
- `project_definitions`
- `idea_artifacts`
- `idea_ledger_entries`

The 77 Blueprint Requirements are not duplicated as a Postgres catalog.

## Security verification

- RLS enabled on all 8 new tables: PASS.
- no direct `anon` access to new tables: PASS.
- no direct `authenticated` INSERT/UPDATE/DELETE grants: PASS.
- authenticated SELECT only on intended dossier-facing tables (`idea_sources`, `idea_information_items`, `project_definitions`, `idea_artifacts`, `idea_ledger_entries`): PASS.
- `idea_action_runs`, `idea_requirement_states`, raw `idea_snapshots` remain non-exposed to authenticated Data API by grants: PASS.
- all new RLS policies derive row access from `app_private.can_access_idea`: PASS.
- `ideas` engine-owned columns protected by trigger from ordinary client-role mutation: PASS.
- snapshots protected against UPDATE/DELETE by immutability triggers: PASS.

Supabase Security Advisor after R1 reports no finding introduced by the R1 tables/migration. Remaining advisor findings concern pre-existing tables/functions, notably historical public `SECURITY DEFINER` RPC exposure, call-media policy debt and leaked-password protection configuration.

Relevant advisor remediation references:
- https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
- https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
- https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Performance verification

Initial advisor run identified R1 foreign keys without covering indexes. Migration `20260913031053_idea_engine_r1_fk_indexes` added those indexes.

Second Performance Advisor run: no `unindexed_foreign_keys` finding remains for any R1 table. Remaining seven FK findings belong to pre-existing tables.

`unused_index` notices on brand-new R1 indexes are expected immediately after creation and are not deletion candidates before real workload exists.

## Compatibility / non-regression

At validation time the existing production Idea dataset contains one legacy Idea. It remains unassigned to the new Blueprint (`blueprint_*` null) with `engine_revision = 0`. No R1 table was backfilled; all eight new tables remain empty until R2/R3 mutations deliberately populate them.

No legacy Idea status/readiness/item/decision data was rewritten. No Worker, Cloudflare deployment or frontend runtime was changed by R1.

## R1 verdict

**PASS_PERSISTENCE_BASELINE**.

R2 (ingestion / RAW-first mutation paths) may now begin. R2 must not open generic table writes; it must introduce narrow, explicit, stale-safe mutation RPCs and tests on top of this baseline.

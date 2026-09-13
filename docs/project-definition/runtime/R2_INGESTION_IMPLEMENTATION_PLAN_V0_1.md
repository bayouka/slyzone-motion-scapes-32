# 4b4c — R2 Ingestion Implementation Plan — V0.1

Date: 2026-09-13
Status: IMPLEMENTATION BASELINE FOR R2

## Objective

Implement RAW-first, provenance-preserving mutation boundaries on top of R1 without enabling autonomous AI orchestration, generic table writes, or a new frontend flow.

## R2 invariants

- persist raw/source references before semantic analysis ;
- every engaging mutation is authenticated/authorized, stale-safe and idempotent where network retry can duplicate work ;
- `engine_revision` is the coarse freshness barrier for every persisted engine cache ;
- direct Requirement-state mutation remains system-owned ;
- source changes stale their directly derived Information Items ;
- human information never silently overwrites history: supersession is explicit ;
- audit payloads never duplicate sensitive values ;
- no R2 RPC may create HUMAN_DECISION, EXPERT_SIGNOFF, Idea approval or Build Ready approval ;
- R2 does not call an LLM.

## Schema additions

Add idempotency metadata to `idea_sources` and `idea_information_items`:
- `idempotency_key`
- `request_fingerprint`

Add `evaluated_engine_revision` to `idea_requirement_states`. A persisted Requirement state is never considered current if its evaluation revision is older than the Idea's current `engine_revision`, even if it has not yet been explicitly marked stale by targeted Change Impact.

## `initialize_idea_engine_v1`

Authenticated writer-only RPC. Assigns the currently supported `SITE_VITRINE / 0.4` Blueprint once, creates a provenance source referencing `ideas.original_text`, and increments `engine_revision` atomically. Exact repeat is a no-op; assigning a different Blueprint requires a future explicit migration/remap operation.

## `register_idea_source_v1`

Authenticated writer-only RPC. Registers source metadata before any analysis. Requires expected engine revision and an idempotency key. It does not extract or interpret source content.

## `commit_source_ingestion_v1`

Service-role-only RPC. Commits content hash/freshness after technical ingestion. Same content is idempotent. Changed source content versions the source, marks directly linked active Information Items stale and increments `engine_revision`.

## `supersede_source_v1`

Authenticated writer-only RPC. Preserves the source row, marks it superseded, stales directly linked Information Items, records minimal change/audit lineage, and increments `engine_revision`. Repeating an already-completed supersession is a no-op.

## `apply_human_information_v1`

Authenticated writer-only RPC. Creates a typed Information Item with provenance restricted to `HUMAN_DECLARED` or `HUMAN_GUIDED_ANSWER`. Optional `supersedes_id` preserves history. Optional direct Requirement target may be marked stale, but downstream dependency recomputation remains owned by the deterministic engine. Requires expected revision and idempotency key.

## Freshness strategy

Every successful non-idempotent R2 mutation increments `ideas.engine_revision`. R0/R3 consumers must reject/cache-miss persisted Requirement states whose `evaluated_engine_revision != ideas.engine_revision` unless a deterministic compatibility proof exists.

Direct targets may additionally be marked `STALE` immediately. This provides targeted UI/audit signal without pretending SQL owns the Blueprint dependency graph.

## Permissions

Human RPCs are `SECURITY DEFINER` only because clients have no table write grants. They must:
- set empty `search_path` ;
- require `auth.uid()` ;
- call `app_private.can_write_idea` ;
- explicitly revoke EXECUTE from `PUBLIC`/`anon` and grant only `authenticated` (+ service role for server use).

System ingestion commit is executable only by `service_role`.

## Validation

R2 PASS requires:
- migration source in GitHub and Supabase history agree ;
- direct table writes remain unavailable to authenticated clients ;
- idempotency replay returns the original object without a second revision bump ;
- stale expected revision is rejected ;
- source content change stales directly derived information ;
- human supersession preserves the old item ;
- audit/change payloads omit human/source content ;
- no frontend/Worker switch is performed.

# 4b4c — R1 Persistence Implementation Plan — V0.1

Date: 2026-09-13
Status: IMPLEMENTATION BASELINE FOR R1

## Objective

Persist the minimum durable state required by the R0 deterministic engine without replacing the legacy Idea runtime, duplicating the 77-Requirement Blueprint in Postgres, or exposing system-owned state to arbitrary browser writes.

## Compatibility rules

- additive schema only; no destructive rewrite or backfill of legacy Idea objects;
- `ideas.status`, `ideas.readiness`, `idea_items` and legacy decision brief remain compatibility surfaces, not the new engine truth;
- Blueprint definitions remain versioned in GitHub/YAML;
- Gate readiness, active Contexts and Next Best Action remain derived;
- all new tables use RLS and reuse `app_private.can_access_idea` for row visibility;
- no new R1 table grants direct INSERT/UPDATE/DELETE to `anon` or `authenticated`;
- internal engine tables are not exposed to authenticated Data API reads unless needed by a product surface;
- future canonical mutations must use narrow stale-safe RPCs.

## `ideas` engine metadata

Add: `blueprint_id`, `blueprint_version`, `blueprint_status`, `engine_revision`, `active_project_definition_id`.
Owner: deterministic engine. Read: existing Idea visibility. Mutation: future engine/RPC only. Idempotency/stale: `engine_revision`. Audit: engaging mutations emit `audit_events`. Retention: lifetime of Idea. Sensitivity: internal. Direct browser modification of these columns must be blocked.

## `idea_sources`

Owner: source ingestion layer. Read: Idea members. Mutation: future register/ingest/supersede RPCs. Idempotency: idea + source identity/content hash/version. Stale: source version/hash. Audit: source registration/supersession when material. Retention: preserve lineage; deletion follows future source-retention policy. Sensitivity: explicit per row.

## `idea_information_items`

Owner: canonical atomic memory. Read: Idea members. Mutation: human-information RPC or validated action-result promotion. Idempotency: mutation request/source lineage. Stale: supersession plus source/input fingerprints. Audit: material corrections and authority changes. Retention: preserve superseded lineage. Sensitivity: explicit per row.

## `idea_requirement_states`

Owner: deterministic engine cache. Read: server/internal by default. Mutation: materialization RPC only. Idempotency: `(idea_id, requirement_id)` + revision/fingerprint. Stale: explicit state/reason/input fingerprint. Audit: only material lock/authority transitions. Retention: reconstructible cache, but retained for audit while active. Sensitivity: internal.

## `idea_action_runs`

Owner: orchestrator. Read: server/internal by default. Mutation: action lifecycle RPCs only. Idempotency: optional explicit key unique per Idea. Stale: target/input fingerprint. Audit: run row is itself execution audit; engaging promotion separately audited. Retention: retain metadata/results according to future AI/data retention policy. Sensitivity: internal; permission scope must never contain secrets.

## `idea_snapshots`

Owner: deterministic snapshot service. Read: Idea members when product needs them. Mutation: create-only RPC; immutable after creation. Idempotency: Idea + snapshot type + content hash. Stale: snapshots never mutate; freshness is evaluated against current projection. Audit: creation and formal use. Retention: immutable decision/handoff history. Sensitivity: inherits contained dossier sensitivity.

## `idea_artifacts`

Owner: artifact service. Read: Idea members. Mutation: artifact-version/state RPCs only. Idempotency: `(idea_id, artifact_key, version)` and future input-fingerprint checks. Stale: state + input fingerprint + source snapshot. Audit: promotions/freezes. Retention: preserve historical versions. Sensitivity: internal unless explicitly exported/shared.

## `idea_ledger_entries`

Owner: deterministic engine/review system. Read: Idea members. Mutation: narrow human/system RPCs only. Idempotency: future mutation key or supersession chain. Stale: state/target refs. Audit: material entries are themselves trace records. Retention: preserve conflict/risk/change lineage. Sensitivity: explicit payload discipline; no unnecessary secrets.

## `project_definitions`

Owner: Idea→Project promotion service. Read: users who can access source Idea. Mutation: promotion/build-ready RPCs only. Idempotency: unique approved Idea snapshot. Stale: snapshots determine freshness. Audit: promotion/build-ready decisions. Retention: preserve superseded definitions. Sensitivity: internal workspace data.

## Security boundary

RLS is defense in depth, not the mutation API. New tables revoke direct `anon`/`authenticated` writes. Authenticated reads are granted only to user-facing persistence surfaces; engine-internal tables remain server-only. Service role retains backend access but must not be exposed to clients. System-owned columns on `ideas` are protected against direct client modification.

## R1 completion criteria

R1 is complete only when: schema migration is applied; migration history and GitHub source agree; all tables have RLS/grants/policies; schema/constraints/indexes are verified; security and performance advisors are reviewed; no legacy Idea flow is broken; no production UI/Worker behavior is switched to the new engine yet.

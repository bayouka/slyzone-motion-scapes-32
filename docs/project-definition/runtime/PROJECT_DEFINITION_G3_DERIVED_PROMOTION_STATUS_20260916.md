# 4b4c — Canonical G3 server-derived promotion — status — 2026-09-16

## Status

**BACKEND APPLIED / REPOSITORY ADAPTER READY / P4 PRODUCTION CUTOVER NOT YET CERTIFIED**

Current certified production remains:

- Worker runtime `v4.5.16-project-definition-preproject-p3`;
- transport build `556`;
- canonical Idea adapter `0.1.0`;
- browser commands `canonical.read`, `decision.record`;
- G3 promotion not browser-exposed in the certified p3 Worker.

The next additive candidate is:

- Worker runtime `v4.5.17-project-definition-g3-derived-p4`;
- canonical Idea adapter `0.2.0`;
- additional browser command `project.promote`;
- no shell/UI asset change required.

## Problem closed by p4

The hardened G3 v2 RPC was service-role only and revalidated human authority, but still accepted caller-provided:

- `baseline_manifest`;
- `promotion_diff`;
- `artifact_promotions`.

That was acceptable as an internal compatibility boundary but was not an appropriate browser-facing product contract.

p4 removes this trust surface.

## Server-derived G3 contract

Applied Supabase migration:

`20260916185631_project_master_blueprint_v1_g3_server_derived_promotion_v1`

New public privileged RPC:

`public.promote_canonical_approved_idea_to_project_definition_v3(uuid,uuid,uuid,bigint,text)`

The browser/server adapter may provide only:

- `idea_id`;
- `decision_record_id`;
- expected `engine_revision`;
- idempotency key.

The authenticated actor is injected from the verified JWT by the Worker.

The browser cannot provide:

- baseline manifest;
- promotion diff;
- artifact promotion decisions;
- actor/authorized-by identity.

## Baseline derivation

`app_private.build_canonical_project_baseline_payload_v1(...)` derives the promotion payload exclusively from current/frozen canonical runtime material:

- canonical G2 state and matching Decision Record;
- frozen Decision Package;
- immutable Decision Snapshot;
- current Requirement States on the expected engine revision;
- active information items and their provenance/source linkage;
- current/accepted Idea ledger entries;
- decision conditions;
- frozen fresh `FOR_DECISION / CONCEPT_NOT_FINAL_SPEC` artifacts.

The R6 baseline fields are structured and provenance-first rather than generated as an unconstrained text summary:

- vision;
- decision rationale;
- business outcomes;
- approved targets;
- positioning;
- macro scope;
- non-goals;
- critical constraints;
- risks;
- accepted unknowns;
- source evidence refs;
- decision authority.

The payload is deterministic for the same frozen input state and includes a stable fingerprint.

## Artifact promotion policy

All frozen `CONCEPT_NOT_FINAL_SPEC` artifacts captured by the Decision Snapshot use:

`PROMOTE_AND_DEEPEN`

They do not become final Project specifications merely because the Idea was approved.

The mapping from R4 artifact key to canonical target domain is closed and deterministic. All 12 currently supported R4 artifact keys were checked live and have a non-null canonical domain mapping.

An unmapped project-promotable artifact blocks G3 rather than being silently guessed.

## Security / authority

Live ACL verification for G3 v3:

- `anon`: no EXECUTE;
- `authenticated`: no EXECUTE;
- `service_role`: EXECUTE allowed.

The v3 RPC delegates the final mutation to the existing hardened v2/R6 promotion path, which revalidates that the actor is the Idea creator or an active workspace owner/admin.

The repository adapter candidate additionally performs the existing user-scoped RLS projection precheck before service-role execution.

## Repository candidate

`src/idea-canonical-adapter.js` now exposes exactly:

- `canonical.read`;
- `decision.record`;
- `project.promote`.

`project.promote` accepts only:

- `command`;
- `idea_id`;
- `decision_record_id`;
- `expected_engine_revision`;
- `idempotency_key`.

Repository candidate health metadata declares:

- adapter `0.2.0`;
- runtime `v4.5.17-project-definition-g3-derived-p4`;
- `g3_promotion_browser_exposed=true`;
- `g3_promotion_actor_from_jwt=true`;
- `g3_baseline_derivation=SERVER_DERIVED_FROM_FROZEN_IDEA_DECISION`;
- `g3_manifest_client_controlled=false`;
- `g3_promotion_diff_client_controlled=false`;
- `g3_artifact_promotions_client_controlled=false`;
- `service_role_browser_exposed=false`.

## Validation already completed

- migration applied successfully to authoritative Supabase project `4b4c`;
- migration version confirmed as `20260916185631`;
- G3 v3 ACL confirmed service-role only;
- all 12 R4 artifact mappings checked live;
- controlled invalid-ID invocation fails closed with `DECISION_RECORD_NOT_FOUND`;
- production remains at 0 Idea / 0 Project Definition rows, so no user dossier was reclassified or modified;
- migration synchronized into canonical GitHub history;
- migration-history guard extended;
- canonical adapter and bridge contract checks updated.

## Remaining proof

Do not mark p4 production-certified until the canonical transport/Cloudflare release proves:

1. exact runtime file byte alignment;
2. successful build/deploy;
3. live `/health = v4.5.17-project-definition-g3-derived-p4`;
4. adapter `0.2.0` and exactly three commands;
5. unauthenticated `project.promote` fails `401 / UNAUTHORIZED`;
6. health keeps all three client-control flags false;
7. G2 remains `CALC + RAW` only;
8. source-fetch remains internal/reachable but SRC inactive;
9. Project Definition adapter remains `0.1.1` with 11/9 predicates and G4/G5 intact.

A real authenticated G0→G5 lifecycle E2E remains a separate proof and cannot be inferred while production contains no real Idea dossier.

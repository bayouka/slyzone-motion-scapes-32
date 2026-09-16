# 4b4c — Canonical G3 server-derived promotion — status — 2026-09-16

## Status

**PRODUCTION CERTIFIED — P4 / BUILD 557**

Current independently certified production:

- Worker runtime `v4.5.17-project-definition-g3-derived-p4`;
- transport build `557`;
- canonical Idea adapter `0.2.0`;
- browser commands `canonical.read`, `decision.record`, `project.promote`;
- Cloudflare active deployment version `429b297d` observed after the successful final build;
- no shell/UI asset change required.

The build-557 release gate completed successfully on the final transport commit `c7ce65b02696c9d33a873d376bfc24f2c155095c`. Because that gate is fail-closed and executes the live runtime smoke before success, the green final Cloudflare build certifies the runtime and unauthenticated-boundary assertions encoded in the gate.

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

Production privileged RPC:

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

The production adapter additionally performs the existing user-scoped RLS projection precheck before service-role execution.

## Production Worker contract

`src/idea-canonical-adapter.js` exposes exactly:

- `canonical.read`;
- `decision.record`;
- `project.promote`.

`project.promote` accepts only:

- `command`;
- `idea_id`;
- `decision_record_id`;
- `expected_engine_revision`;
- `idempotency_key`.

Production health contract declares:

- adapter `0.2.0`;
- runtime `v4.5.17-project-definition-g3-derived-p4`;
- `g3_promotion_browser_exposed=true`;
- `g3_promotion_actor_from_jwt=true`;
- `g3_baseline_derivation=SERVER_DERIVED_FROM_FROZEN_IDEA_DECISION`;
- `g3_manifest_client_controlled=false`;
- `g3_promotion_diff_client_controlled=false`;
- `g3_artifact_promotions_client_controlled=false`;
- `service_role_browser_exposed=false`.

## Production certification

Certified by the final Cloudflare build-557 release gate:

1. canonical/transport runtime files byte-aligned before release;
2. final Cloudflare build succeeded and became the active deployment;
3. live runtime contract expected `v4.5.17-project-definition-g3-derived-p4`;
4. adapter contract expected `0.2.0` and exactly three canonical commands;
5. unauthenticated `canonical.read`, `decision.record` and `project.promote` are required to fail `401 / UNAUTHORIZED`;
6. all three G3 client-control flags are required false;
7. G2 remains `CALC + RAW` only;
8. source-fetch remains internal/reachable while SRC stays inactive;
9. Project Definition adapter remains `0.1.1` with 11 RFD predicates, 9 pre-baseline predicates and G4/G5 intact;
10. shell build remains `553`.

The final successful Cloudflare deployment observed after this gate is version `429b297d` at 100% traffic.

## Validation already completed

- migration applied successfully to authoritative Supabase project `4b4c`;
- migration version confirmed as `20260916185631`;
- G3 v3 ACL confirmed service-role only;
- all 12 R4 artifact mappings checked live;
- controlled invalid-ID invocation fails closed with `DECISION_RECORD_NOT_FOUND`;
- production remained at 0 Idea / 0 Project Definition rows during migration validation, so no user dossier was reclassified or modified;
- migration synchronized into canonical GitHub history;
- migration-history guard extended;
- canonical adapter and bridge contract checks updated;
- p4 transport release deployed successfully as build 557.

## Remaining E2E limitation

A real authenticated G0→G5 lifecycle remains a separate proof. Production certification of build 557 proves the runtime contract and fail-closed unauthenticated boundaries; it does **not** fabricate a real authenticated dossier.

Still unproven until a legitimate Idea exists or an explicitly authorized non-production fixture is used:

- authenticated `canonical.read` on a real `SITE_VITRINE@0.5` Idea;
- G1 fingerprint binding on real R4/R5 material;
- authenticated `decision.record` by the actual decision authority;
- authenticated `project.promote` with server-derived G3 baseline;
- inspection of the resulting Project Definition baseline and promotion lineage;
- continuity into Delivery Lot creation and G4/G5 RFD approval;
- stale/idempotent retry behavior through the full browser/server path.

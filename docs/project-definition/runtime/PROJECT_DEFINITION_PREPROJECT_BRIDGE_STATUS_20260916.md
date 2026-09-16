# 4b4c — Canonical Pre-Project Bridge G0→G3 — implementation status — 2026-09-16

## Status

**SERVICE-SIDE IMPLEMENTED / REPOSITORY ADAPTER READY / PRODUCTION CUTOVER NOT YET CERTIFIED**

This document records the canonical pre-project bridge added after the Project Definition RFD p2 production slice.

It does **not** claim that Worker runtime `v4.5.16-project-definition-preproject-p3` is already live. The last independently certified production Worker remains the previously recorded p2 release until the canonical transport/Cloudflare release chain and live `/health` prove otherwise.

## Canonical scope

The bridge closes the Master Blueprint formal-gate chain before RFD:

- `G0_BLUEPRINT_FIT`;
- `G1_IDEA_DECISION_READY`;
- `G2_GO_PROJECT`;
- `G3_PROJECT_BASELINE`.

The existing RFD gates remain unchanged:

- `G4_RFD_LOT`;
- `G5_RFD_PROJECT`.

No parallel gate-state database was introduced for G0→G3. Readiness is derived from existing Idea Engine / R4 / R5 / R6 runtime objects.

## Derived pre-project predicates

`G1_IDEA_DECISION_READY` is based on five canonical predicates:

1. `FOUNDATION_READY`;
2. `EVIDENCE_READY`;
3. `STRATEGY_READY`;
4. `PREFIGURATION_READY`;
5. `DECISION_PACKAGE_READY`.

These predicates are **derived, not persisted as a second truth source**.

The evaluator checks, as applicable:

- current Idea `engine_revision`;
- requirement resolution state and resolution level;
- requirement authority state;
- stale/conflicted/review-required state;
- current/frozen fresh `FOR_DECISION` prefiguration artifacts;
- immutable Decision Snapshot;
- package/output snapshot binding and freshness;
- open material review feedback;
- canonical evaluation fingerprints.

Unknown or missing state is not coerced to Ready.

## G1 decision paths

Two paths are represented explicitly.

### Launch path

Requires the complete pre-project predicate closure, including prefiguration and Decision Package readiness. It may allow approval outcomes that can lead to Project promotion.

### Early non-GO decision path

Allows an evidence-backed decision such as `REVISE`, `DEEPEN_RESEARCH`, `PAUSE`, `STOP` or `INSUFFICIENT_INFORMATION` without forcing unnecessary launch prefiguration.

An early non-GO path cannot be reused to authorize `APPROVE_TO_PROJECT`.

## G2 — human GO binding

Canonical decision recording is exposed by:

`public.record_canonical_idea_decision_v1(...)`

It binds the immutable R5 Decision Record to the **exact current G1 evaluation fingerprint**.

This removes the legacy weakness where a caller-provided `gate_g7_ready` boolean could be treated as if it were canonical readiness evidence.

The repository Worker adapter injects `p_decided_by` from the authenticated JWT user. Client payloads do not control the decision actor.

## G3 — Project Baseline promotion

Canonical promotion is hardened by:

`public.promote_canonical_approved_idea_to_project_definition_v2(...)`

It requires:

- the canonical G2 decision to be Ready;
- the expected current Idea engine revision;
- an authorized actor;
- actor authorization revalidated in PostgreSQL;
- actor = Idea creator or active workspace `owner` / `admin`;
- the existing versioned R6 Project Definition baseline contract.

### Browser boundary

G3 promotion is **intentionally not exposed** through the first canonical browser adapter.

Reason: a browser-supplied arbitrary `baseline_manifest` would create a needless trust surface even for an authorized actor. A future product-level promotion command must assemble/derive its promotion payload server-side from the approved snapshot and current canonical material before the G3 mutation is exposed.

## Idea Blueprint runtime authority

A cross-audit after P4 found and corrected a real compatibility mismatch.

The live `app_private.resolve_idea_blueprint_fit_v1` currently assigns a newly accepted `SITE_VITRINE` Idea to:

`SITE_VITRINE@0.5`.

Therefore:

- `SITE_VITRINE@0.5` is the **current live Blueprint Fit assignment for new compatible Ideas**;
- `SITE_VITRINE@0.4` remains supported for legacy/existing Ideas that legitimately carry that version;
- canonical G0 accepts 0.4 or 0.5 only when the persisted `BlueprintFitDecision.blueprint_version` exactly matches the current `Idea.blueprint_version`;
- the canonical bridge did not itself activate 0.5; that activation predates P3/P5.

The original P3 assumption that 0.4 was still the only active fit version was incorrect and was corrected forward-only before Worker production cutover.

## Supabase migrations

Applied to authoritative project `4b4c`:

- `20260916174121_project_master_blueprint_v1_g0_g3_preproject_bridge_p3`;
- `20260916174307_project_master_blueprint_v1_g0_g3_preproject_bridge_p3_g0_column_fix`;
- `20260916174852_project_master_blueprint_v1_g3_promotion_actor_hardening_p4`;
- `20260916182111_project_master_blueprint_v1_g0_blueprint_05_compat_fix_p5`.

The two corrective migrations are deliberately forward-only:

- `174307` corrects legacy G0 column names used by the first P3 function body;
- `182111` corrects G0 Blueprint-version compatibility after verifying the live Blueprint Fit authority.

Already-applied migrations were not rewritten.

## ACL verified live

The following canonical RPCs were checked on the live Supabase schema:

- `get_canonical_idea_preproject_readiness_v1`;
- `record_canonical_idea_decision_v1`;
- `promote_canonical_approved_idea_to_project_definition_v2`.

For all three:

- `anon`: no EXECUTE;
- `authenticated`: no EXECUTE;
- `service_role`: EXECUTE allowed.

After P5 the canonical evaluator ACL was rechecked and remains unchanged.

The browser never receives the service-role credential.

## Transactional evaluator smoke

A temporary Idea fixture was inserted inside an explicit transaction and rolled back.

The complete canonical evaluator executed without runtime error and correctly returned an incomplete fixture as Not Ready, including explicit blockers for missing requirement states and missing prefiguration artifacts.

Conditional prefiguration requirements whose applicability is not yet materialized are surfaced as coverage warnings rather than silently asserted as satisfied applicability.

After rollback, production `public.ideas` remained empty.

## Real E2E limitation

At this cut, production contains **zero real Idea rows**.

Therefore the following remain unproven against a real authenticated production dossier:

- canonical G0 read after a real 0.5 Blueprint-fit decision;
- canonical G0 compatibility against a legitimate existing 0.4 Idea;
- G1 launch-path closure from real requirement states and R4 artifacts;
- G1 early non-GO path from real data;
- canonical Decision Package readiness on a real R5 package;
- `decision.record` through the Worker with a real authenticated decision owner;
- canonical G2 GO with same-fingerprint binding;
- stale G1 fingerprint rejection through the Worker;
- server-side canonical G3 promotion on a real approved Idea;
- resulting Project Definition baseline inspection;
- end-to-end continuity from G3 into existing G4/G5 RFD runtime.

These items must stay **unproven**, not inferred from fixture tests.

## Repository adapter candidate

Repository runtime candidate:

`v4.5.16-project-definition-preproject-p3`

New route:

`POST /api/ideas/canonical`

Browser commands exposed:

- `canonical.read`;
- `decision.record`.

Not exposed:

- G3 Project Baseline promotion.

Health metadata declares:

- active Idea Blueprint Fit runtime `SITE_VITRINE@0.5`;
- legacy Idea Blueprint support `SITE_VITRINE@0.4`;
- four pre-project formal gates;
- five pre-project readiness predicates;
- JWT decision actor binding;
- user-RLS precheck;
- G3 browser promotion disabled;
- service-role browser exposure disabled.

## Repository enforcement

The repository contains dedicated contract enforcement:

- `scripts/idea-canonical-adapter-v1-check.mjs`;
- `scripts/canonical-runtime-bridge-v1-check.mjs`;
- `scripts/project-definition-adapter-v1-check.mjs`;
- `npm run check` includes syntax + canonical adapter/bridge checks;
- CI may be used as an additional manual source check, but it is **not** the canonical production deployment path.

## Canonical production cutover rule

Do not mark p3 production-certified until all of the following are observed:

1. canonical source passes `npm ci` + `npm run check` in the validated release chain;
2. only validated runtime files are mirrored to `bayouka/2b2c/4b4c/`;
3. canonical/transport runtime files are byte-aligned for the release;
4. `4b4c/TRANSPORT_RELEASE.txt` identifies the intended p3 transport release;
5. Cloudflare Workers Builds runs the canonical `scripts/deploy-4b4c-direct.sh` release path successfully;
6. live `/health` reports `v4.5.16-project-definition-preproject-p3`;
7. live health exposes `idea_canonical_adapter_v1` with `configured=true`;
8. unauthenticated `canonical.read` returns `401 / UNAUTHORIZED`;
9. unauthenticated `decision.record` returns `401 / UNAUTHORIZED`;
10. `g3_promotion_browser_exposed=false` remains visible;
11. previous Project Definition p2 invariants remain present and unchanged.

GitHub Actions must not be substituted for this production release chain.

A real authenticated Idea E2E is a separate certification and remains blocked until a suitable real Idea exists or an explicitly authorized non-production test fixture/environment is used.

## Authority

Use together:

- `docs/project-definition/machine/MASTER_BLUEPRINT_V1.json`;
- `docs/project-definition/machine/CANONICAL_RUNTIME_BRIDGE_V1.json`;
- the four migrations listed above;
- `src/idea-canonical-adapter.js`;
- `src/worker-entry.js`;
- `scripts/idea-canonical-adapter-v1-check.mjs`;
- `scripts/canonical-runtime-bridge-v1-check.mjs`;
- this status document.

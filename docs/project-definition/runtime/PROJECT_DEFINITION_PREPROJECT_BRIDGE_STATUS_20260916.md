# 4b4c — Canonical Pre-Project Bridge G0→G3 — implementation status — 2026-09-16

## Status

**SERVICE-SIDE IMPLEMENTED / REPOSITORY ADAPTER READY / PRODUCTION CUTOVER NOT YET CERTIFIED**

This document records the canonical pre-project bridge added after the Project Definition RFD p2 production slice.

It does **not** claim that Worker runtime `v4.5.16-project-definition-preproject-p3` is already live. The last independently certified production Worker remains the previously recorded p2 release until a manual CI/deploy run and live `/health` observation prove otherwise.

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

Reason: a browser-supplied arbitrary `baseline_manifest` would create a needless trust surface even for an authorized actor. The next implementation step should derive/assemble the promotion payload server-side from the approved snapshot and current canonical material before exposing a product-level promotion command.

## Active vs candidate Idea Blueprint

The bridge does not silently activate a new Idea Blueprint version.

- active fit/runtime assignment remains `SITE_VITRINE@0.4`;
- `SITE_VITRINE@0.5` remains a candidate/evolving backend surface;
- the canonical bridge explicitly records that activation was not changed.

## Supabase migrations

Applied to authoritative project `4b4c`:

- `20260916174121_project_master_blueprint_v1_g0_g3_preproject_bridge_p3`;
- `20260916174307_project_master_blueprint_v1_g0_g3_preproject_bridge_p3_g0_column_fix`;
- `20260916174852_project_master_blueprint_v1_g3_promotion_actor_hardening_p4`.

The `174307` migration is a deliberate forward-only correction to the first P3 function body. The already-applied `174121` migration was not rewritten.

## ACL verified live

The following canonical RPCs were checked on the live Supabase schema:

- `get_canonical_idea_preproject_readiness_v1`;
- `record_canonical_idea_decision_v1`;
- `promote_canonical_approved_idea_to_project_definition_v2`.

For all three:

- `anon`: no EXECUTE;
- `authenticated`: no EXECUTE;
- `service_role`: EXECUTE allowed.

The browser never receives the service-role credential.

## Transactional evaluator smoke

A temporary Idea fixture was inserted inside an explicit transaction and rolled back.

The complete canonical evaluator executed without runtime error and correctly returned an incomplete fixture as Not Ready, including explicit blockers for missing requirement states and missing prefiguration artifacts.

Conditional prefiguration requirements whose applicability is not yet materialized are surfaced as coverage warnings rather than silently asserted as satisfied applicability.

After rollback, production `public.ideas` remained empty.

## Real E2E limitation

At this cut, production contains **zero real Idea rows**.

Therefore the following remain unproven against a real authenticated production dossier:

- canonical G0 read after a real Blueprint-fit decision;
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

- four pre-project formal gates;
- five pre-project readiness predicates;
- JWT decision actor binding;
- user-RLS precheck;
- G3 browser promotion disabled;
- service-role browser exposure disabled.

## Repository enforcement

The repository now contains dedicated contract enforcement:

- `scripts/idea-canonical-adapter-v1-check.mjs`;
- updated `scripts/canonical-runtime-bridge-v1-check.mjs`;
- updated `scripts/project-definition-adapter-v1-check.mjs`;
- `npm run check` includes syntax + canonical adapter contract checks;
- CI checks the canonical route/runtime metadata;
- production deployment smoke is prepared for the p3 runtime and unauthenticated `401` boundary.

## Production cutover rule

Do not mark p3 production-certified until all of the following are observed:

1. manual repository CI passes on the intended main commit;
2. manual production deployment completes;
3. live `/health` reports `v4.5.16-project-definition-preproject-p3`;
4. live health exposes `idea_canonical_adapter_v1` with `configured=true`;
5. unauthenticated `canonical.read` returns `401 / UNAUTHORIZED`;
6. unauthenticated `decision.record` returns `401 / UNAUTHORIZED`;
7. `g3_promotion_browser_exposed=false` remains visible;
8. previous Project Definition p2 invariants remain present and unchanged.

A real authenticated Idea E2E is a separate certification and remains blocked until a suitable real Idea exists or an explicitly authorized non-production test fixture/environment is used.

## Authority

Use together:

- `docs/project-definition/machine/MASTER_BLUEPRINT_V1.json`;
- `docs/project-definition/machine/CANONICAL_RUNTIME_BRIDGE_V1.json`;
- the three migrations listed above;
- `src/idea-canonical-adapter.js`;
- `src/worker-entry.js`;
- `scripts/idea-canonical-adapter-v1-check.mjs`;
- `scripts/canonical-runtime-bridge-v1-check.mjs`;
- this status document.

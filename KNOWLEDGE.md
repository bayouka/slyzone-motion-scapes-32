# KNOWLEDGE.md — 4b4c knowledge map

## Purpose

This file tells humans and AI agents **where the reliable knowledge for 4b4c lives**. It is an index, not a second specification.

---

## Global authority

### Repository / production / release

**Primary source:** `README.md`

Use it for canonical repository identity, canonical Supabase backend, transport-mirror status, runtime ownership, deployment/release chain and current production baseline.

Supporting dated operational sources include notably:
- `docs/RECOVERY_BASELINE_20260911.md`
- `docs/RUNTIME_OWNERSHIP_20260911.md`
- `docs/TECHNICAL_AUDIT_20260909.md`
- `docs/PRODUCT_AUDIT_20260911.md`
- `docs/UX_PRODUCT_DA_GATE_20260911.md`
- `docs/E2E_TEST_MATRIX_20260911.md`

Dated evidence does not automatically override a newer explicit canonical contract.

---

## Idea Engine — current canonical target

Current canonical sources remain:

1. `docs/idea-engine/canonical/IDEA_ENGINE_MASTER_BLUEPRINT_V1.md`
2. `docs/idea-engine/canonical/WORKFLOW_V7_1_CONSOLIDATED.md`
3. `docs/idea-engine/canonical/INFORMATION_MATRIX_V5_OUTPUT_DRIVEN.md`
4. `docs/idea-engine/canonical/CAPTURE_INGESTION_MEMORY_CONTRACT_V1_2.md`
5. `docs/idea-engine/ux/CAPTURE_UX_V5_VALIDATED.md`

The reference Blueprint currently validated is `Site vitrine`.

Important: the professional boundary beyond the current Idea Engine is under controlled redesign. Do **not** mutate the canonical Master Blueprint/Matrix from the candidate Project Definition work until explicit validation/promotion.

Matrix V5 remains valuable and canonical for the current Idea-level model, but is no longer assumed to be the future master referential through `READY_FOR_DEVELOPMENT`.

Coverage audit:
`docs/project-definition/validation/MATRIX_V5_TO_REFERENCE_ARCHITECTURE_COVERAGE_AUDIT_20260913.md`

---

# Professional Idea → Prefiguration → Decision → Project → Build Ready — CURRENT DESIGN PRIORITY

Workspace UX work remains **paused** while this referential is designed and validated.

## Current architecture candidate

`docs/project-definition/PROJECT_DEFINITION_REFERENCE_ARCHITECTURE_V0_4.md`

Status: **NON CANONIQUE / CURRENT ARCHITECTURE CANDIDATE**.

Lifecycle candidate:

`Capture → Foundation → Evidence/Market → Strategy/Options → Prefiguration/Concept Alpha → conditional Concept Validation → Decision Package/Presentation/Review → Approved Idea → Project Baseline → Project Definition → Build Ready`.

V0.4 defines notably:
- 22 professional Domains D01→D22 ;
- INFO / ANALYSIS / DECISION / SPEC / VERIFY ;
- G0→G12 dependency Gates ;
- Prefiguration Budget ;
- provisional journeys/sitemap/capabilities/content/visual concepts before Project ;
- conditional real-user concept validation ;
- business case/projection rules ;
- Decision Package including editable PPTX/PDF target ;
- review feedback + targeted Change Impact ;
- progressive lock/freeze ;
- Idea artifact promotion rather than Project restart ;
- traceability and `READY_FOR_DEVELOPMENT` contract.

---

## Domain / requirement registries

- Idea D01→D07: `docs/project-definition/03_REQUIREMENT_REGISTRY_IDEA_V0_2.md`
- Prefiguration / Decision: `docs/project-definition/04_PREFIGURATION_DECISION_PACKAGE_REGISTRY_V0_1.md`
- Project product / experience D08→D15: `docs/project-definition/04A_REQUIREMENT_REGISTRY_PROJECT_PRODUCT_V0_1.md`
- Project technical / Build Ready D16→D20: `docs/project-definition/04B_REQUIREMENT_REGISTRY_PROJECT_TECH_BUILDREADY_V0_1.md`

Detailed catalogs:
- index: `docs/project-definition/detail/05_MASTER_DETAIL_INDEX_V0_1.md`
- Idea: `docs/project-definition/detail/05A_IDEA_DETAIL_CATALOG_V0_1.md`
- Prefiguration / Decision: `docs/project-definition/detail/05B_PREFIGURATION_DECISION_DETAIL_CATALOG_V0_1.md`
- Project product: `docs/project-definition/detail/05C_PROJECT_PRODUCT_DETAIL_CATALOG_V0_1.md`
- Project tech / Build Ready: `docs/project-definition/detail/05D_PROJECT_TECH_BUILDREADY_DETAIL_CATALOG_V0_1.md`

These catalogs are **not visible questionnaires**. Their internal questions are requirements to resolve, not necessarily things to ask a user.

---

## Cross-cutting candidate mechanisms

- Context applicability: `docs/project-definition/06_CONTEXT_OVERLAY_CATALOG_V0_1.md`
- Approved Idea → Project promotion: `docs/project-definition/07_APPROVED_IDEA_TO_PROJECT_PROMOTION_CONTRACT_V0_1.md`
- Human intervention minimization: `docs/project-definition/08_HUMAN_INTERVENTION_MAP_V0_1.md`
- Cross-cutting ledgers: `docs/project-definition/09_CROSS_CUTTING_LEDGER_MODEL_V0_1.md`
- Progressive lock/freeze: `docs/project-definition/PROGRESSIVE_LOCK_PROMOTION_MODEL_V0_1.md`
- AI vs Human resolution: `docs/project-definition/AI_HUMAN_RESOLUTION_POLICY_V0_1.md`

Key invariant:

> **aucune question évitable, aucune décision humaine escamotée.**

And:
`Requirement exists ≠ question user`.

---

# Machine-readable Site vitrine Blueprint — CURRENT R0 CANDIDATE

The machine-readable layer is **non-canonical** and does not authorize backend/runtime implementation yet.

## Active machine manifest

`docs/project-definition/machine/site-vitrine/BLUEPRINT_SITE_VITRINE_V0_4.yaml`

V0.4 is the active executable candidate for R0. It supersedes V0.3 as the active manifest because context derivation is now machine-readable rather than semi-textual.

Load set:
- `CONTEXT_OVERLAYS_V0_2.yaml`
- `REQUIREMENTS_IDEA_V0_1.yaml`
- `REQUIREMENTS_PREFIGURATION_DECISION_V0_1.yaml`
- `REQUIREMENTS_PROJECT_BUILD_V0_1.yaml`
- `DELIVERABLE_CONTRACTS_V0_1.yaml`
- `GATES_V0_1.yaml`
- `GATE_BINDINGS_V0_1.yaml`
- `OVERRIDES_V0_1.yaml`

## Context DSL

`docs/project-definition/machine/site-vitrine/CONTEXT_OVERLAYS_V0_2.yaml`

R0 accepts only a closed deterministic predicate DSL:
`all / any / not` and `fact + exists/eq/neq/in/contains/gt/gte/lt/lte`.

No free-text rule interpretation, no Python/JS `eval`, no LLM authority.

## Atom schema

`docs/project-definition/machine/REQUIREMENT_ATOM_SCHEMA_V0_2.md`

Supports alternative acceptable resolution forms per Gate, versioned overrides and separate `IDEA_DECISION_OWNER` / `BUILD_READY_OWNER` role references.

## Previous machine validation

`scripts/validate_site_vitrine_blueprint.py`

Report:
`docs/project-definition/validation/SITE_VITRINE_MACHINE_BLUEPRINT_AUTOMATED_VALIDATION_20260913.md`

V0.3 fresh-clone result before Context DSL V0.2:
- 77 Requirements ;
- 21 Contexts ;
- 14 Gates ;
- 19 Deliverables ;
- 5 Overrides ;
- 0 errors / 0 warnings.

This does **not** by itself promote V0.4 to final R0 PASS.

---

# Runtime architecture / R0 — CURRENT EXECUTION PRIORITY

Runtime architecture index:
`docs/project-definition/runtime/README.md`

Supporting contracts:
- `RUNTIME_EXECUTION_MAPPING_V0_1.md`
- `PERSISTENCE_MODEL_V0_1.md`
- `DETERMINISTIC_ENGINE_CONTRACT_V0_1.md`
- `MUTATION_RPC_BOUNDARIES_V0_1.md`
- `RUNTIME_EXECUTION_MAPPING_RED_TEAM_20260913.md`

## Active R0 engine

**Only active candidate:** `scripts/r0_engine_v0_3.py`

**Active test suite:** `scripts/test_r0_engine_v0_3.py`

Report:
`docs/project-definition/runtime/R0_ENGINE_V0_3_TEST_REPORT_20260913.md`

Older `scripts/r0_engine.py`, `scripts/r0_engine_v0_2.py` and `tests/r0/*` remain historical/regression material. Do not use them as active engine contracts for new work.

V0.3 fixes a material planning bug found during testing: a Requirement may be generically resolved yet still fail the minimum level demanded by the current Gate. Action planning must therefore compare against the **current Gate minimum**, not merely `RESOLVED` status.

Current R0 validation state:
- deterministic Context DSL: implemented ;
- contexts/applicability/Requirement fingerprints/Gates/Change Impact/stale guards: implemented as local reference ;
- isolated algorithmic suite: **12/12 PASS** ;
- actual replay of `scripts/test_r0_engine_v0_3.py` on fresh `main` + V0.4: **PENDING** because the authorized remote execution device became unavailable ;
- R0: **NOT_YET_PASS_REFERENCE** ;
- R1 persistence/Supabase: **BLOCKED until R0 PASS_REFERENCE**.

No production backend, Worker, frontend or Supabase schema has been changed by R0.

---

## Runtime mapping decisions already established

- reuse backend additively, do not rewrite it ;
- existing Idea RLS, decisions, optimistic concurrency, audit and stale approval logic are useful ;
- `ideas.status/readiness`, `idea_items` and old `clarify → strengthen → prove → share → decide` are too coarse to be the new canonical engine state ;
- candidate persistent additions include `idea_sources`, `idea_information_items`, `idea_requirement_states`, `idea_action_runs`, `idea_artifacts`, `idea_snapshots`, `idea_ledger_entries`, `project_definitions` ;
- the 77 Requirements stay in the versioned Blueprint, not duplicated as canonical DB configuration ;
- LLM/workflows never mutate canonical state directly ;
- new GO creates a **Project Definition baseline**, not milestones/tasks ;
- future mutations use narrow, versioned, idempotent, stale-safe RPC boundaries.

Future implementation order:
`R0 deterministic engine → R1 persistence → R2 ingestion → R3 autonomous actions → R4 prefiguration/artifacts → R5 decision package → R6 project definition → R7 build ready`.

---

## Validation support

Current relevant validation material includes:
- `docs/project-definition/PROJECT_DEFINITION_REFERENCE_ARCHITECTURE_RED_TEAM_20260913.md`
- `docs/project-definition/PREFIGURATION_DECISION_PACKAGE_RED_TEAM_20260913.md`
- `docs/project-definition/validation/IDEA_REQUIREMENT_REGISTRY_RED_TEAM_20260913.md`
- `docs/project-definition/validation/MATRIX_V5_TO_REFERENCE_ARCHITECTURE_COVERAGE_AUDIT_20260913.md`
- `docs/project-definition/validation/DETAILED_REFERENTIAL_RED_TEAM_20260913.md`
- `docs/project-definition/validation/SITE_VITRINE_DETAILED_REFERENTIAL_COVERAGE_AUDIT_20260913.md`
- `docs/project-definition/validation/SITE_VITRINE_MACHINE_BLUEPRINT_SIMULATION_20260913.md`
- `docs/project-definition/validation/SITE_VITRINE_MACHINE_BLUEPRINT_AUTOMATED_VALIDATION_20260913.md`
- `docs/project-definition/runtime/R0_ENGINE_V0_3_TEST_REPORT_20260913.md`
- `docs/idea-engine/validation/IDEA_TO_PROJECT_PROFESSIONAL_LIFECYCLE_AUDIT_20260913.md`

Earlier exploratory inventory:
`docs/idea-engine/validation/PROFESSIONAL_REQUIREMENTS_MASTER_MATRIX_V0_1.md`

Do not treat the earlier inventory as the active schema.

---

## Workspace UX — PAUSED / historical candidates

Historical only:
- `docs/idea-engine/ux/WORKSPACE_PROJECTION_CONTRACT_V0_2.md`
- `docs/idea-engine/ux/WORKSPACE_PROJECTION_CONTRACT_V0_3.md`
- `docs/idea-engine/ux/WORKSPACE_WIREFRAMES_V0_1.md`
- associated prototype/red-team docs.

No new workspace prototype should be promoted or implemented until the professional lifecycle/master referential and R0 semantics are explicitly validated.

---

## Production implementation vs design candidates

Do not conflate:
- current production implementation ;
- current canonical Idea Engine ;
- non-canonical Project Definition architecture/registries ;
- non-canonical machine-readable Blueprint/R0 reference engine.

No production/backend implementation is authorized from these candidates yet unless explicitly decided.

---

## Key established invariants

- raw input/provenance survives AI interpretation ;
- exhaustive internal coverage never becomes a giant visible form ;
- human questions are last-mile ;
- AI inference is not human truth ;
- stale results cannot overwrite newer state ;
- accepted unknown can be valid ;
- research/challenge serve actual decisions ;
- GO is not privileged over revise/pause/stop ;
- Idea ≠ Project ;
- approval of a prefigured Idea ≠ Ready for Development ;
- high-fidelity pre-Project mockups are decision artifacts, not final specs ;
- AI/synthetic persona simulation is not user evidence ;
- Project inherits valid Idea artifacts instead of restarting ;
- requirements/standards are proportional to applicability/risk ;
- structural requirements should be traceable to specification and verification ;
- developers retain implementation discretion when it does not alter product behavior/constraints ;
- Idea approval authority and Build Ready approval authority may be different roles ;
- Context rules used by R0 must be deterministic structured predicates ;
- generic Requirement resolution never substitutes for satisfying a stricter Gate-specific minimum.

---

## Knowledge maintenance rule

When a structural invariant is discovered:
- do not leave it only in chat ;
- update the owning document after validation ;
- preserve superseded/history material ;
- update this map when authority/path/version/status changes ;
- avoid duplicating full specifications here.

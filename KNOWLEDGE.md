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

### Remote-tool workflow

`docs/REMOTE_DESKTOP_POLICY.md`

Canonical work proceeds through GitHub and the relevant remote services/connectors (notably Supabase and Cloudflare). Remote Desktop Commander is last-resort/local-only tooling and its absence must never block normal project progress.

---

## Idea Engine — current canonical target

Current canonical sources remain:

1. `docs/idea-engine/canonical/IDEA_ENGINE_MASTER_BLUEPRINT_V1.md`
2. `docs/idea-engine/canonical/WORKFLOW_V7_1_CONSOLIDATED.md`
3. `docs/idea-engine/canonical/INFORMATION_MATRIX_V5_OUTPUT_DRIVEN.md`
4. `docs/idea-engine/canonical/CAPTURE_INGESTION_MEMORY_CONTRACT_V1_2.md`
5. `docs/idea-engine/ux/CAPTURE_UX_V5_VALIDATED.md`

The reference Blueprint currently validated is `Site vitrine`.

Important: the professional boundary beyond the current canonical Idea Engine remains under controlled redesign/implementation. Do **not** mutate the canonical Master Blueprint/Matrix from Project Definition work unless explicitly validated/promoted.

Matrix V5 remains canonical for the current Idea-level model, but is not the future master referential through `READY_FOR_DEVELOPMENT`.

Coverage audit:
`docs/project-definition/validation/MATRIX_V5_TO_REFERENCE_ARCHITECTURE_COVERAGE_AUDIT_20260913.md`

---

# Professional Idea → Prefiguration → Decision → Project → Build Ready

Workspace UX work remains **paused** while the professional referential/runtime is implemented and validated beyond the current R1 baseline.

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

## Cross-cutting mechanisms

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

# Machine-readable Site vitrine Blueprint — R0 PASS_REFERENCE

## Active machine manifest

`docs/project-definition/machine/site-vitrine/BLUEPRINT_SITE_VITRINE_V0_4.yaml`

V0.4 is the active executable R0 reference. Context derivation is machine-readable and deterministic.

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

## R0 validation

Active validator: `scripts/validate_site_vitrine_blueprint.py`

Active engine: `scripts/r0_engine_v0_3.py`

Active tests: `scripts/test_r0_engine_v0_3.py`

Result on fresh canonical `main` (2026-09-13):
- 77 Requirements ;
- 21 Contexts ;
- 14 Gates ;
- 19 Deliverables ;
- 5 Overrides ;
- 0 errors / 0 warnings ;
- engine replay: **12/12 PASS** ;
- R0 status: **PASS_REFERENCE**.

Report:
`docs/project-definition/runtime/R0_ENGINE_V0_3_TEST_REPORT_20260913.md`

Older `scripts/r0_engine.py`, `scripts/r0_engine_v0_2.py` and `tests/r0/*` remain historical/regression material only.

---

# Runtime architecture — R1 PASS / R2 CURRENT EXECUTION PRIORITY

Runtime authority/index:
`docs/project-definition/runtime/README.md`

Supporting contracts:
- `RUNTIME_EXECUTION_MAPPING_V0_1.md`
- `PERSISTENCE_MODEL_V0_1.md`
- `R1_PERSISTENCE_IMPLEMENTATION_PLAN_V0_1.md`
- `R1_PERSISTENCE_VALIDATION_REPORT_20260913.md`
- `DETERMINISTIC_ENGINE_CONTRACT_V0_1.md`
- `MUTATION_RPC_BOUNDARIES_V0_1.md`
- `RUNTIME_EXECUTION_MAPPING_RED_TEAM_20260913.md`

## R1 persistence — PASS_PERSISTENCE_BASELINE

Applied canonical migrations:
- `20260913031001_idea_engine_r1_persistence_core`
- `20260913031053_idea_engine_r1_fk_indexes`

R1 added Blueprint/engine metadata to `ideas` and the additive persistent core:
- `idea_sources`
- `idea_information_items`
- `idea_requirement_states`
- `idea_action_runs`
- `idea_snapshots`
- `project_definitions`
- `idea_artifacts`
- `idea_ledger_entries`

Security baseline:
- RLS on every new table ;
- no generic `anon/authenticated` writes ;
- internal engine tables not exposed by client grants ;
- engine-owned `ideas` fields protected ;
- snapshots immutable ;
- R1 FK coverage checked/corrected after Supabase advisor run.

R1 did not backfill historical Ideas and did not switch frontend/Worker behavior.

## R2 — current priority

R2 implements RAW-first ingestion and human/source mutation boundaries without introducing autonomous AI orchestration yet.

Target scope:
- safe Blueprint assignment/initialization ;
- `register_idea_source_v1` ;
- source ingestion/version/supersession ;
- `apply_human_information_v1` ;
- deterministic `engine_revision` increments ;
- minimal audit/change lineage ;
- targeted stale impact ;
- permission/idempotency/stale-safety tests.

Future implementation order:
`R0 deterministic engine ✅ → R1 persistence ✅ → R2 ingestion → R3 autonomous actions → R4 prefiguration/artifacts → R5 decision package → R6 project definition → R7 build ready`.

---

## Validation support

Relevant material includes:
- `docs/project-definition/PROJECT_DEFINITION_REFERENCE_ARCHITECTURE_RED_TEAM_20260913.md`
- `docs/project-definition/PREFIGURATION_DECISION_PACKAGE_RED_TEAM_20260913.md`
- `docs/project-definition/validation/IDEA_REQUIREMENT_REGISTRY_RED_TEAM_20260913.md`
- `docs/project-definition/validation/MATRIX_V5_TO_REFERENCE_ARCHITECTURE_COVERAGE_AUDIT_20260913.md`
- `docs/project-definition/validation/DETAILED_REFERENTIAL_RED_TEAM_20260913.md`
- `docs/project-definition/validation/SITE_VITRINE_DETAILED_REFERENTIAL_COVERAGE_AUDIT_20260913.md`
- `docs/project-definition/validation/SITE_VITRINE_MACHINE_BLUEPRINT_SIMULATION_20260913.md`
- `docs/project-definition/validation/SITE_VITRINE_MACHINE_BLUEPRINT_AUTOMATED_VALIDATION_20260913.md`
- `docs/project-definition/runtime/R0_ENGINE_V0_3_TEST_REPORT_20260913.md`
- `docs/project-definition/runtime/R1_PERSISTENCE_VALIDATION_REPORT_20260913.md`
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

R0 is validated, but the professional runtime is only at R1. Do not promote or implement a new post-capture workspace UX until the required runtime semantics for that surface are explicitly validated.

---

## Production implementation vs design candidates

Do not conflate:
- current production implementation ;
- current canonical Idea Engine ;
- Project Definition architecture/registries ;
- R0 deterministic reference ;
- R1 persistence baseline ;
- future R2+ runtime capabilities.

A validated lower runtime layer does not authorize unimplemented higher-layer behavior.

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
- generic Requirement resolution never substitutes for satisfying a stricter Gate-specific minimum ;
- canonical writes use provenance, idempotency and stale-safety boundaries ;
- Remote Desktop availability is never a normal project dependency.

---

## Knowledge maintenance rule

When a structural invariant is discovered:
- do not leave it only in chat ;
- update the owning document after validation ;
- preserve superseded/history material ;
- update this map when authority/path/version/status changes ;
- avoid duplicating full specifications here.

# KNOWLEDGE.md — 4b4c knowledge map

## Purpose

This file tells humans and AI agents where the reliable knowledge for 4b4c lives. It is an index, not a second specification.

---

## Global authority

### Repository / production / release

Primary source: `README.md`.

Use it for canonical repository identity, canonical Supabase backend, transport-mirror status, runtime ownership, deployment/release chain and current production baseline.

Supporting dated operational sources include notably:
- `docs/RECOVERY_BASELINE_20260911.md`
- `docs/RUNTIME_OWNERSHIP_20260911.md`
- `docs/TECHNICAL_AUDIT_20260909.md`
- `docs/PRODUCT_AUDIT_20260911.md`
- `docs/UX_PRODUCT_DA_GATE_20260911.md`
- `docs/E2E_TEST_MATRIX_20260911.md`

Dated evidence does not automatically override a newer explicit canonical contract.

### Tooling workflow

`docs/REMOTE_DESKTOP_POLICY.md`

Canonical work proceeds through GitHub and the relevant remote services/connectors (notably Supabase and Cloudflare). Remote Desktop Commander is last-resort/local-only tooling and its absence must never block normal project progress.

---

## Idea Engine — canonical product target

Current canonical sources:
1. `docs/idea-engine/canonical/IDEA_ENGINE_MASTER_BLUEPRINT_V1.md`
2. `docs/idea-engine/canonical/WORKFLOW_V7_1_CONSOLIDATED.md`
3. `docs/idea-engine/canonical/INFORMATION_MATRIX_V5_OUTPUT_DRIVEN.md`
4. `docs/idea-engine/canonical/CAPTURE_INGESTION_MEMORY_CONTRACT_V1_2.md`
5. `docs/idea-engine/ux/CAPTURE_UX_V5_VALIDATED.md`

The currently validated reference Blueprint is `Site vitrine`.

Matrix V5 remains canonical for the current Idea-level dossier model, but it is not assumed to be the future master referential through `READY_FOR_DEVELOPMENT`.

Coverage audit:
`docs/project-definition/validation/MATRIX_V5_TO_REFERENCE_ARCHITECTURE_COVERAGE_AUDIT_20260913.md`

---

## Professional lifecycle / referential

Current architecture candidate:
`docs/project-definition/PROJECT_DEFINITION_REFERENCE_ARCHITECTURE_V0_4.md`

Status: non-canonical/current architecture candidate.

Lifecycle candidate:
`Capture → Foundation → Evidence/Market → Strategy/Options → Prefiguration/Concept Alpha → conditional Concept Validation → Decision Package/Presentation/Review → Approved Idea → Project Baseline → Project Definition → Build Ready`.

V0.4 defines 22 professional Domains D01→D22, INFO/ANALYSIS/DECISION/SPEC/VERIFY objects, G0→G12 Gates, prefiguration/decision artifacts, progressive lock/freeze, Idea→Project promotion and the `READY_FOR_DEVELOPMENT` contract.

Domain/requirement sources:
- `docs/project-definition/03_REQUIREMENT_REGISTRY_IDEA_V0_2.md`
- `docs/project-definition/04_PREFIGURATION_DECISION_PACKAGE_REGISTRY_V0_1.md`
- `docs/project-definition/04A_REQUIREMENT_REGISTRY_PROJECT_PRODUCT_V0_1.md`
- `docs/project-definition/04B_REQUIREMENT_REGISTRY_PROJECT_TECH_BUILDREADY_V0_1.md`
- detailed catalog index: `docs/project-definition/detail/05_MASTER_DETAIL_INDEX_V0_1.md`

Cross-cutting sources:
- `docs/project-definition/06_CONTEXT_OVERLAY_CATALOG_V0_1.md`
- `docs/project-definition/07_APPROVED_IDEA_TO_PROJECT_PROMOTION_CONTRACT_V0_1.md`
- `docs/project-definition/08_HUMAN_INTERVENTION_MAP_V0_1.md`
- `docs/project-definition/09_CROSS_CUTTING_LEDGER_MODEL_V0_1.md`
- `docs/project-definition/PROGRESSIVE_LOCK_PROMOTION_MODEL_V0_1.md`
- `docs/project-definition/AI_HUMAN_RESOLUTION_POLICY_V0_1.md`

Invariant: `Requirement exists ≠ question user` and **aucune question évitable, aucune décision humaine escamotée**.

---

## Machine-readable Site vitrine Blueprint — R0 PASS_REFERENCE

Active manifest:
`docs/project-definition/machine/site-vitrine/BLUEPRINT_SITE_VITRINE_V0_4.yaml`

Context DSL:
`docs/project-definition/machine/site-vitrine/CONTEXT_OVERLAYS_V0_2.yaml`

Atom schema:
`docs/project-definition/machine/REQUIREMENT_ATOM_SCHEMA_V0_2.md`

Active R0 engine:
`scripts/r0_engine_v0_3.py`

Active tests:
`scripts/test_r0_engine_v0_3.py`

Validator:
`scripts/validate_site_vitrine_blueprint.py`

Fresh canonical validation on 2026-09-13:
- 77 Requirements ;
- 21 Contexts ;
- 14 Gates ;
- 19 Deliverables ;
- 5 Overrides ;
- 0 errors / 0 warnings ;
- engine replay: 12/12 PASS ;
- R0: **PASS_REFERENCE**.

Report:
`docs/project-definition/runtime/R0_ENGINE_V0_3_TEST_REPORT_20260913.md`

Older R0 engines/tests are historical/regression material only.

---

# Runtime status — R2 PASS / R3 CURRENT PRIORITY

Runtime authority/index:
`docs/project-definition/runtime/README.md`

Core supporting sources:
- `docs/project-definition/runtime/RUNTIME_EXECUTION_MAPPING_V0_1.md`
- `docs/project-definition/runtime/PERSISTENCE_MODEL_V0_1.md`
- `docs/project-definition/runtime/DETERMINISTIC_ENGINE_CONTRACT_V0_1.md`
- `docs/project-definition/runtime/MUTATION_RPC_BOUNDARIES_V0_1.md`
- `docs/project-definition/runtime/RUNTIME_EXECUTION_MAPPING_RED_TEAM_20260913.md`

## R1 — PASS_PERSISTENCE_BASELINE

Implementation/validation:
- `docs/project-definition/runtime/R1_PERSISTENCE_IMPLEMENTATION_PLAN_V0_1.md`
- `docs/project-definition/runtime/R1_PERSISTENCE_VALIDATION_REPORT_20260913.md`

Applied migrations:
- `20260913031001_idea_engine_r1_persistence_core`
- `20260913031053_idea_engine_r1_fk_indexes`

R1 added Blueprint/engine metadata to `ideas` plus:
`idea_sources`, `idea_information_items`, `idea_requirement_states`, `idea_action_runs`, `idea_snapshots`, `project_definitions`, `idea_artifacts`, `idea_ledger_entries`.

Security baseline: RLS, no generic client writes, internal engine tables not client-exposed by grants, protected engine columns, immutable snapshots, FK coverage checked after advisor review.

## R2 — PASS_INGESTION_BASELINE

Implementation/validation:
- `docs/project-definition/runtime/R2_INGESTION_IMPLEMENTATION_PLAN_V0_1.md`
- `docs/project-definition/runtime/R2_INGESTION_VALIDATION_REPORT_20260913.md`

Applied migration:
- `20260913031644_idea_engine_r2_ingestion_rpcs`

Active R2 boundaries:
- `initialize_idea_engine_v1`
- `register_idea_source_v1`
- `commit_source_ingestion_v1` (service-role only)
- `supersede_source_v1`
- `apply_human_information_v1`

Validated guarantees:
- RAW/source before analysis ;
- `engine_revision` stale barrier ;
- idempotency key + request fingerprint ;
- source-version stale guard ;
- explicit human supersession/history ;
- source change stales directly derived active information ;
- authenticated direct engine-table writes remain forbidden ;
- unauthorized Idea writers are rejected ;
- all production validation tests were transactionally rolled back.

## R3 — current priority

R3 is the System Action lifecycle and deterministic promotion layer around `idea_action_runs`:
- create/start/complete/fail/stale action-run boundaries ;
- permission scope and target fingerprints ;
- deterministic `promote_action_result_v1` ;
- server-controlled `materialize_requirement_states_v1` ;
- no direct LLM/provider canonical writes.

Implementation sequence:
`R0 ✅ → R1 ✅ → R2 ✅ → R3 autonomous actions → R4 prefiguration/artifacts → R5 decision package → R6 project definition → R7 build ready`.

---

## Workspace UX — PAUSED

Historical candidates only:
- `docs/idea-engine/ux/WORKSPACE_PROJECTION_CONTRACT_V0_2.md`
- `docs/idea-engine/ux/WORKSPACE_PROJECTION_CONTRACT_V0_3.md`
- `docs/idea-engine/ux/WORKSPACE_WIREFRAMES_V0_1.md`

R0–R2 are validated, but the professional runtime is not complete. Do not promote a new post-capture workspace UX until the runtime semantics required by that surface are explicitly validated.

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
- Project inherits valid Idea artifacts instead of restarting ;
- synthetic persona simulation is not user evidence ;
- generic Requirement resolution never substitutes for a stricter Gate-specific minimum ;
- canonical writes require provenance, authorization, idempotency and stale-safety ;
- LLM/providers never own canonical state ;
- Remote Desktop availability is never a normal project dependency.

---

## Knowledge maintenance rule

When a structural invariant is discovered:
- do not leave it only in chat ;
- update the owning document after validation ;
- preserve superseded/history material ;
- update this map when authority/path/version/status changes ;
- avoid duplicating full specifications here.

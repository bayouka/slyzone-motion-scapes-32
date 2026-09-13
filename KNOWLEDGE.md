# KNOWLEDGE.md — 4b4c knowledge map

## Purpose

This file tells humans and AI agents where the reliable knowledge for 4b4c lives. It is an index, not a second specification.

---

## Global authority

### Repository / production / release

Primary source: `README.md`.

Use it for canonical repository identity, canonical Supabase backend, transport-mirror status, runtime ownership, deployment/release chain and current production baseline.

Supporting operational sources include notably:
- `docs/RECOVERY_BASELINE_20260911.md`
- `docs/RUNTIME_OWNERSHIP_20260911.md`
- `docs/TECHNICAL_AUDIT_20260909.md`
- `docs/PRODUCT_AUDIT_20260911.md`
- `docs/UX_PRODUCT_DA_GATE_20260911.md`
- `docs/E2E_TEST_MATRIX_20260911.md`

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

The validated reference Blueprint is `Site vitrine`.

Matrix V5 remains canonical for the current Idea-level dossier model, but is not the future master referential through `READY_FOR_DEVELOPMENT`.

Coverage audit: `docs/project-definition/validation/MATRIX_V5_TO_REFERENCE_ARCHITECTURE_COVERAGE_AUDIT_20260913.md`.

---

## Professional lifecycle / referential

Current architecture candidate:
`docs/project-definition/PROJECT_DEFINITION_REFERENCE_ARCHITECTURE_V0_4.md`

Lifecycle candidate:
`Capture → Foundation → Evidence/Market → Strategy/Options → Prefiguration/Concept Alpha → conditional Concept Validation → Decision Package/Presentation/Review → Approved Idea → Project Baseline → Project Definition → Build Ready`.

Domain/requirement sources:
- `docs/project-definition/03_REQUIREMENT_REGISTRY_IDEA_V0_2.md`
- `docs/project-definition/04_PREFIGURATION_DECISION_PACKAGE_REGISTRY_V0_1.md`
- `docs/project-definition/04A_REQUIREMENT_REGISTRY_PROJECT_PRODUCT_V0_1.md`
- `docs/project-definition/04B_REQUIREMENT_REGISTRY_PROJECT_TECH_BUILDREADY_V0_1.md`
- detail index: `docs/project-definition/detail/05_MASTER_DETAIL_INDEX_V0_1.md`

Cross-cutting sources:
- `docs/project-definition/06_CONTEXT_OVERLAY_CATALOG_V0_1.md`
- `docs/project-definition/07_APPROVED_IDEA_TO_PROJECT_PROMOTION_CONTRACT_V0_1.md`
- `docs/project-definition/08_HUMAN_INTERVENTION_MAP_V0_1.md`
- `docs/project-definition/09_CROSS_CUTTING_LEDGER_MODEL_V0_1.md`
- `docs/project-definition/PROGRESSIVE_LOCK_PROMOTION_MODEL_V0_1.md`
- `docs/project-definition/AI_HUMAN_RESOLUTION_POLICY_V0_1.md`

Invariant: `Requirement exists ≠ question user` and **aucune question évitable, aucune décision humaine escamotée**.

---

## Machine-readable Blueprint — R0 PASS_REFERENCE

Active manifest: `docs/project-definition/machine/site-vitrine/BLUEPRINT_SITE_VITRINE_V0_4.yaml`.

Context DSL: `docs/project-definition/machine/site-vitrine/CONTEXT_OVERLAYS_V0_2.yaml`.

Atom schema: `docs/project-definition/machine/REQUIREMENT_ATOM_SCHEMA_V0_2.md`.

Active engine/tests/validator:
- `scripts/r0_engine_v0_3.py`
- `scripts/test_r0_engine_v0_3.py`
- `scripts/validate_site_vitrine_blueprint.py`

Fresh canonical result (2026-09-13): 77 Requirements / 21 Contexts / 14 Gates / 19 Deliverables / 5 Overrides / 0 errors / 0 warnings / 12 of 12 engine tests PASS.

Report: `docs/project-definition/runtime/R0_ENGINE_V0_3_TEST_REPORT_20260913.md`.

---

# Runtime status — R4 PASS / R5 CURRENT PRIORITY

Runtime authority/index: `docs/project-definition/runtime/README.md`.

Core contracts:
- `RUNTIME_EXECUTION_MAPPING_V0_1.md`
- `PERSISTENCE_MODEL_V0_1.md`
- `DETERMINISTIC_ENGINE_CONTRACT_V0_1.md`
- `MUTATION_RPC_BOUNDARIES_V0_1.md`
- `RUNTIME_EXECUTION_MAPPING_RED_TEAM_20260913.md`

## R1 — PASS_PERSISTENCE_BASELINE

Docs:
- `R1_PERSISTENCE_IMPLEMENTATION_PLAN_V0_1.md`
- `R1_PERSISTENCE_VALIDATION_REPORT_20260913.md`

Migrations:
- `20260913031001_idea_engine_r1_persistence_core`
- `20260913031053_idea_engine_r1_fk_indexes`

Persistent core: Blueprint/engine metadata on `ideas`, sources, atomic information, Requirement-state cache, Action Runs, snapshots, Project Definitions, artifacts and ledger. RLS/no-generic-client-write baseline validated.

## R2 — PASS_INGESTION_BASELINE

Docs:
- `R2_INGESTION_IMPLEMENTATION_PLAN_V0_1.md`
- `R2_INGESTION_VALIDATION_REPORT_20260913.md`

Migration: `20260913031644_idea_engine_r2_ingestion_rpcs`.

Boundaries:
- `initialize_idea_engine_v1`
- `register_idea_source_v1`
- `commit_source_ingestion_v1`
- `supersede_source_v1`
- `apply_human_information_v1`

RAW-first, idempotency, revision/source stale guards, explicit supersession and authorization were transactionally validated.

## R3 — PASS_ACTION_LIFECYCLE_BASELINE

Docs:
- `R3_ACTIONS_IMPLEMENTATION_PLAN_V0_1.md`
- `R3_ACTIONS_VALIDATION_REPORT_20260913.md`

Migration: `20260913032224_idea_engine_r3_action_lifecycle`.

Server-only boundaries:
- `create_action_run_v1`
- `start_action_run_v1`
- `complete_action_run_v1`
- `fail_action_run_v1`
- `mark_action_run_stale_v1`
- `materialize_requirement_states_v1`
- `promote_action_result_v1`

Validated: service-role-only execution, lifecycle/idempotency, stale before/during/promotion, permission-scope allowlist, machine-provenance allowlist, atomic promotion with action lineage and revision-guarded Requirement-cache materialization. Providers/LLMs still never write canonical state directly.

## R4 — PASS_PREFIGURATION_ARTIFACT_BASELINE

Docs:
- `R4_PREFIGURATION_ARTIFACTS_IMPLEMENTATION_PLAN_V0_1.md`
- `R4_PREFIGURATION_ARTIFACTS_VALIDATION_REPORT_20260913.md`

Migration: `20260913034602_idea_engine_r4_prefiguration_artifacts`.

Server-only boundaries:
- `create_prefiguration_artifact_v1`
- `promote_prefiguration_artifact_v1`
- `mark_prefiguration_artifact_stale_v1`
- `freeze_prefiguration_artifact_v1`
- `assess_prefiguration_artifact_freshness_v1`

Validated: immutable artifact versions, lineage/versioning, one current version per artifact key, idempotency, exact freshness fingerprints, controlled current/frozen/stale transitions, `FOR_DECISION / CONCEPT_NOT_FINAL_SPEC` separation and explicit protection that HIFI concepts are not real-user evidence. R4 does not resolve Gates by artifact existence and does not create an execution Project.

## R5 — current priority

R5 owns Decision Package / immutable Decision Snapshot / package freshness / review feedback and neutral approval outcomes.

It must consume only explicitly versioned/fresh artifacts, preserve traceability, refuse stale package inputs, and keep approval separate from Project Definition creation until the outcome is genuinely promotable.

Implementation sequence:
`R0 ✅ → R1 ✅ → R2 ✅ → R3 ✅ → R4 ✅ → R5 decision package → R6 project definition → R7 build ready`.

---

## Workspace UX — PAUSED

Historical candidates only:
- `docs/idea-engine/ux/WORKSPACE_PROJECTION_CONTRACT_V0_2.md`
- `docs/idea-engine/ux/WORKSPACE_PROJECTION_CONTRACT_V0_3.md`
- `docs/idea-engine/ux/WORKSPACE_WIREFRAMES_V0_1.md`

R0–R4 are validated, but the professional runtime is not complete. Do not promote a new post-capture workspace UX until the runtime semantics required by that surface are explicitly validated.

---

## Key invariants

- RAW/provenance survives AI interpretation ;
- exhaustive internal coverage never becomes a giant visible form ;
- human questions are last-mile ;
- AI inference is not human truth ;
- stale results cannot overwrite newer state ;
- accepted unknown can be valid ;
- GO is not privileged over revise/pause/stop ;
- Idea ≠ Project ;
- approval of a prefigured Idea ≠ Ready for Development ;
- Project inherits valid Idea artifacts instead of restarting ;
- synthetic personas are not user evidence ;
- high-fidelity concept artifacts are not real-user evidence ;
- generic Requirement resolution never substitutes for stricter Gate-specific minimum ;
- canonical writes require provenance, authorization, idempotency and stale-safety ;
- LLM/providers never own canonical state ;
- Remote Desktop availability is never a normal project dependency.

---

## Knowledge maintenance rule

When a structural invariant is discovered: update the owning document after validation, preserve history/superseded material, update this map when authority/path/version/status changes, and avoid duplicating full specifications here.

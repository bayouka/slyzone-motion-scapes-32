# KNOWLEDGE.md — 4b4c knowledge map

## Purpose

This file tells humans and AI agents where the reliable knowledge for 4b4c lives. It is an index, not a second specification.

---

## Global authority

### Repository / production / release

Primary source: `README.md`.

Use it for canonical repository identity, canonical Supabase backend, transport-mirror status, runtime ownership, deployment/release chain and current production baseline.

Current **certified** transport production baseline remains **v4.5.12-workspace-engine-adapter-p1 / build 540** until build 542 receives independent runtime certification.

Current active release candidate: **v4.5.12-workspace-g0-actions-p2 / build 542**, adapter `0.1.1`, runtime secret provisioned, G0 interactive assets included.

Supporting operational sources include notably:
- `docs/RECOVERY_BASELINE_20260911.md`
- `docs/RUNTIME_OWNERSHIP_20260911.md`
- `docs/TECHNICAL_AUDIT_20260909.md`
- `docs/PRODUCT_AUDIT_20260911.md`
- `docs/UX_PRODUCT_DA_GATE_20260911.md`
- `docs/E2E_TEST_MATRIX_20260911.md`

### Tooling workflow

`docs/REMOTE_DESKTOP_POLICY.md`

Canonical work proceeds through GitHub and the relevant remote services/connectors. Remote Desktop Commander is local-only/last-resort and its absence must never block normal project progress.

---

## Idea Engine — canonical product target

Canonical sources:
1. `docs/idea-engine/canonical/IDEA_ENGINE_MASTER_BLUEPRINT_V1.md`
2. `docs/idea-engine/canonical/WORKFLOW_V7_1_CONSOLIDATED.md`
3. `docs/idea-engine/canonical/INFORMATION_MATRIX_V5_OUTPUT_DRIVEN.md`
4. `docs/idea-engine/canonical/CAPTURE_INGESTION_MEMORY_CONTRACT_V1_2.md`
5. `docs/idea-engine/ux/CAPTURE_UX_V5_VALIDATED.md`

Validated reference Blueprint: `Site vitrine`.

Matrix V5 remains canonical for the current Idea-level dossier model, but is not the future master referential through `READY_FOR_DEVELOPMENT`.

---

## Professional lifecycle / referential

Current architecture candidate: `docs/project-definition/PROJECT_DEFINITION_REFERENCE_ARCHITECTURE_V0_4.md`.

Lifecycle:
`Capture → Foundation → Evidence/Market → Strategy/Options → Prefiguration/Concept Alpha → conditional Concept Validation → Decision Package/Presentation/Review → Approved Idea → Project Baseline → Project Definition → Build Ready`.

Domain/requirement sources:
- `docs/project-definition/03_REQUIREMENT_REGISTRY_IDEA_V0_2.md`
- `docs/project-definition/04_PREFIGURATION_DECISION_PACKAGE_REGISTRY_V0_1.md`
- `docs/project-definition/04A_REQUIREMENT_REGISTRY_PROJECT_PRODUCT_V0_1.md`
- `docs/project-definition/04B_REQUIREMENT_REGISTRY_PROJECT_TECH_BUILDREADY_V0_1.md`
- `docs/project-definition/detail/05_MASTER_DETAIL_INDEX_V0_1.md`

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

Fresh canonical result: 77 Requirements / 21 Contexts / 14 Gates / 19 Deliverables / 5 Overrides / 0 errors / 0 warnings / 12 of 12 engine tests PASS.

---

# Runtime status — R7 PASS / WORKSPACE CUTOVER ACTIVE

Runtime authority/index: `docs/project-definition/runtime/README.md`.

Core contracts:
- `RUNTIME_EXECUTION_MAPPING_V0_1.md`
- `PERSISTENCE_MODEL_V0_1.md`
- `DETERMINISTIC_ENGINE_CONTRACT_V0_1.md`
- `MUTATION_RPC_BOUNDARIES_V0_1.md`
- `RUNTIME_EXECUTION_MAPPING_RED_TEAM_20260913.md`

## R1 — PASS_PERSISTENCE_BASELINE

Migrations: `20260913031001_idea_engine_r1_persistence_core`, `20260913031053_idea_engine_r1_fk_indexes`.

Persistent core, RLS/no-generic-client-write baseline validated.

## R2 — PASS_INGESTION_BASELINE

Migration: `20260913031644_idea_engine_r2_ingestion_rpcs`.

RAW-first, idempotency, revision/source stale guards, explicit supersession and authorization validated.

## R3 — PASS_ACTION_LIFECYCLE_BASELINE

Migration: `20260913032224_idea_engine_r3_action_lifecycle`.

Server-only lifecycle, stale-safety, permission scope, machine provenance, atomic promotion and Requirement-cache materialization validated.

## R4 — PASS_PREFIGURATION_ARTIFACT_BASELINE

Migration: `20260913034602_idea_engine_r4_prefiguration_artifacts`.

Immutable artifact versions, lineage, one current version, exact freshness, `FOR_DECISION / CONCEPT_NOT_FINAL_SPEC` and HIFI ≠ real-user evidence validated.

## R5 — PASS_DECISION_PACKAGE_BASELINE

Docs: `R5_DECISION_PACKAGE_IMPLEMENTATION_PLAN_V0_1.md`, `R5_DECISION_PACKAGE_VALIDATION_REPORT_20260913.md`.

Migrations:
- `20260913035101_idea_engine_r5_decision_package`
- `20260913035423_idea_engine_r5_decision_audit_fix`
- `20260913035644_idea_engine_r5_feedback_resolution`

Persistent objects: `idea_decision_packages`, `idea_decision_feedback`, `idea_decision_records_v2`.

Validated: exact decision lineage, package freshness, cosmetic vs material feedback, explicit feedback closure, neutral outcomes, false-GO rejection and `promotable` without Project Definition side-effect.

## R6 — PASS_PROJECT_DEFINITION_BASELINE

Docs:
- `R6_PROJECT_DEFINITION_BASELINE_IMPLEMENTATION_PLAN_V0_1.md`
- `R6_PROJECT_DEFINITION_BASELINE_VALIDATION_REPORT_20260913.md`

Migration: `20260913035836_idea_engine_r6_project_definition_baseline`.

Validated:
- latest promotable Decision Record only ;
- exact engine/package/snapshot freshness ;
- no open review feedback ;
- condition classes and blocking semantics ;
- immutable `APPROVED_IDEA_SNAPSHOT` ;
- immutable Project Definition baseline ;
- explicit artifact promotion classification ;
- inherited artifacts become new `FOR_PROJECT / PROJECT_DEFINITION` versions ;
- execution-planning keys blocked ;
- no `projects`, milestones or tasks created ;
- nominal and red-team transactional tests PASS with clean rollback.

## R7 — PASS_BUILD_READY_RUNTIME_BASELINE

Docs:
- `docs/project-definition/runtime/R7_BUILD_READY_IMPLEMENTATION_PLAN_V0_1.md`
- `docs/project-definition/runtime/R7_BUILD_READY_VALIDATION_REPORT_20260913.md`

Migrations:
- `20260913040538_idea_engine_r7_build_ready_runtime`
- `20260913040724_idea_engine_r7_gate_semantics_hardening`
- `20260913040751_idea_engine_r7_human_decision_authority`
- `20260913040802_idea_engine_r7_r6_artifact_linkage`
- `20260913040853_idea_engine_r7_artifact_rpc_fix`

Validated runtime semantics:
- 28 Project Requirement states matérialisés depuis la baseline R6 ;
- context/applicability et `definition_revision` contrôlés ;
- `ACCEPTED_UNKNOWN` n'est pas une fausse résolution structurelle ;
- G8 Product, G9 Experience, G10 Tech/NFR, G11 Traceability/Acceptance et G12 Ready sont évalués explicitement ;
- décisions D16 delivery approach, D18 accessibility target, D20 implementation discretion et Ready approval nécessitent autorité humaine ;
- expert signoff conditionnel ne peut pas être simulé par SYSTEM ;
- artefacts A19→A24 sont `FOR_PROJECT / PROJECT_DEFINITION` ; A25 seul est `FOR_BUILD / BUILD_SPEC` ;
- fingerprints exacts empêchent la réutilisation silencieuse d'un artefact stale ;
- `BUILD_READY_SNAPSHOT` immuable seulement après ambiguity audit PASS, human READY approval et Gates satisfaites ;
- finalisation ne crée aucun Project d'exécution.

Validation :
- `R7_HAPPY_PATH_PASS` ;
- bug réel dans l'Artifact RPC détecté et corrigé par migration additive ;
- `R7_REDTEAM_PASS` 5/5 ;
- RPCs R7 critiques service-role only ;
- fixtures transactionnelles rollbackées proprement.

Implementation sequence complete:
`R0 ✅ → R1 ✅ → R2 ✅ → R3 ✅ → R4 ✅ → R5 ✅ → R6 ✅ → R7 ✅`.

---

## Workspace integration / cutover — ACTIVE

Active UX/integration authority:
- `docs/idea-engine/ux/WORKSPACE_PROJECTION_CONTRACT_V1.md` — **projection active 1.2** ;
- `docs/idea-engine/ux/WORKSPACE_INTEGRATION_CUTOVER_PLAN_V1.md` ;
- `docs/idea-engine/ux/WORKSPACE_PRIVILEGED_ADAPTER_CONTRACT_V0_1.md`.

Validation evidence:
- `docs/idea-engine/validation/WORKSPACE_PRIVILEGED_ADAPTER_V0_1_VALIDATION_20260913.md`.

### Slice 1 — Canonical read projection — VALIDATED

`get_idea_workspace_projection_v1(idea_id)` is the canonical read model for the new workspace.

It aggregates R0→R7 into lifecycle/signals/Requirements/system micro-status/sources/artifacts/decision/Project Definition without exposing raw LLM/action payloads and without `phase`, `step`, global `progress` or completion percentage.

ACL transversal and projection-shape red-team tests passed.

### Slice 2 — G0 Blueprint Fit — VALIDATED

Persistent objects:
- `idea_blueprint_fit_assessments` ;
- `idea_blueprint_fit_decisions`.

Rules validated:
- Site vitrine is never forced by default ;
- assessment IA/system ≠ human truth ;
- auto-apply only for HIGH, non-ambiguous, explicitly auto-applicable assessment ;
- otherwise targeted human confirmation ;
- mismatch preserves RAW/history ;
- stale assessment cannot be applied ;
- material Idea change triggers `BLUEPRINT_MIGRATION_REQUIRED` and G0 reclassification before Blueprint reuse.

Change-intelligence compatibility validated:
- obsolete unpromoted Action Runs become stale ;
- affected Requirements preserve historical resolution but move to `REVIEW_REQUIRED` ;
- draft/current Decision Packages become stale ;
- unresolved Blueprint assessment is superseded ;
- post-Project Definition structural editing through the legacy pre-GO editor is blocked pending controlled change workflow.

Canonical integration migration sequence is aligned with Supabase migration history:
- `20260913043039_idea_workspace_projection_v1`
- `20260913043203_idea_workspace_projection_v1_boolean_fix`
- `20260913043603_idea_blueprint_fit_g0_v1`
- `20260913043734_idea_workspace_projection_g0_v1`
- `20260913043819_idea_blueprint_fit_g0_fk_index`
- `20260913044946_idea_blueprint_fit_reclassification_v1`
- `20260913045028_idea_content_change_runtime_compat_v1`

### Slice 3 — Parallel workspace V3 — VALIDATED PREVIEW

Frontend:
- `site/assets/ideas-workspace-v3-preview.js`
- `site/assets/ideas-workspace-v3-preview.css`
- additive wiring in `site/index.html`.

Route: `#/ideas/<idea_id>/workspace-v3`.
Feature preview: `?workspacev3=1` or localStorage `2b2c.idea.workspace.v3=1`.

Production build **539** was certified directly on 2026-09-13: `/health` OK, shell references Workspace V3, JS marker present, CSS marker present.

### Slice 4 — Privileged adapter — 0.1.1 / SECRET PROVISIONED / BUILD 542 CERTIFICATION PENDING

Implementation:
- `src/idea-engine-adapter.js`
- Worker route `POST /api/ideas/engine`
- command allowlist: only `blueprint_fit.assess`.

Security behavior:
- JWT required ;
- strict payload allowlist ;
- user-scoped projection/access check before elevation ;
- write capability required ;
- server-derived idempotency ;
- stale errors preserved ;
- no generic RPC/table/SQL selector ;
- no client-chosen authority identity ;
- secret never returned ;
- human/expert authority excluded from the generic adapter.

Historical build **540** remains the current certified baseline: adapter 0.1.0 was deployed fail-closed and unauthenticated calls were rejected with `401`.

Runtime secret `SUPABASE_SERVICE_ROLE_KEY` is now provisioned in Cloudflare Worker runtime bindings as a `Secret`, outside GitHub.

Critical compatibility correction: modern Supabase `sb_secret_...` keys are not JWTs. Adapter 0.1.1 sends the secret **only as `apikey`**, never as `Authorization: Bearer`. User JWTs remain Bearer tokens with the publishable key in `apikey`.

Build 541 was withdrawn after this issue was detected and is not a certified baseline.

Build **542** is the active release candidate:
- runtime `v4.5.12-workspace-g0-actions-p2` ;
- adapter `0.1.1` ;
- source runtime SHA `abf11adf85586aa47f4de3f9f65f74d6e3b20a44` ;
- Cloudflare release gate requires `configured=true`, `service_role_browser_exposed=false`, `apikey-only` secret semantics, 401 without JWT, and G0 action assets served.

Cloudflare does not currently publish a usable GitHub status and no Cloudflare connector is installed; therefore build 542 must not be called certified until an independent runtime result is available.

### Slice 5 — Idea workspace interactions — STARTED

Canonical G0 interaction assets:
- `site/assets/ideas-workspace-v3-actions.js`
- `site/assets/ideas-workspace-v3-actions.css`
- additive wiring in `site/index.html`.

G0 behavior:
- no assessment → `Analyser le type de projet` calls Worker `blueprint_fit.assess` ;
- HIGH auto-applicable → system resolution allowed ;
- ambiguous/medium → inline human confirmation ;
- human confirmation uses authenticated `confirm_idea_blueprint_fit_v1` with current `engine_revision` ;
- no service secret in browser assets.

Next Slice 5 work after runtime certification / controlled E2E:
- human information via `apply_human_information_v1` ;
- sources via `register_idea_source_v1` ;
- last-mile responses ;
- system actions ;
- prefiguration artifacts ;
- review/feedback ;
- Decision Package / decision.

Legacy workspace/orchestrator remains compatibility only until parallel workspace equivalence, desktop/mobile tests, authenticated E2E and rollback are validated.

---

## Key invariants

- RAW/provenance survives AI interpretation ;
- exhaustive internal coverage never becomes a giant visible form ;
- human questions are last-mile ;
- AI inference is not human truth ;
- stale results cannot overwrite newer state ;
- accepted unknown can be valid, but cannot satisfy a required structural spec by itself ;
- GO is not privileged over revise/pause/stop ;
- Idea ≠ Project ;
- approval of a prefigured Idea ≠ Ready for Development ;
- Project inherits valid Idea artifacts instead of restarting ;
- synthetic personas are not user evidence ;
- high-fidelity concept artifacts are not real-user evidence ;
- Decision Package freshness is bound to an exact snapshot/revision ;
- an approval is promotable only if required decision authority and Gate conditions are satisfied ;
- `FOR_DECISION` ≠ `FOR_PROJECT` ≠ `FOR_BUILD` ;
- Project Definition baseline never contains execution roadmap/tasks by default ;
- Build Ready requires G8→G12, exact current artifacts, ambiguity audit and formal human approval ;
- generic Requirement resolution never substitutes for stricter Gate-specific minimum ;
- material Idea change never silently continues under a potentially invalid Blueprint ;
- post-Project Definition structural change requires controlled change management ;
- canonical writes require provenance, authorization, idempotency and stale-safety ;
- service-role secrets and service-role-only engine RPCs never belong in browser code ;
- Supabase `sb_secret_...` server keys are `apikey` headers, never Bearer tokens ;
- generic server adapters never accept client-chosen privileged RPC/function/authority identifiers ;
- LLM/providers never own canonical state ;
- Remote Desktop availability is never a normal project dependency.

---

## Knowledge maintenance rule

When a structural invariant is discovered: update the owning document after validation, preserve history/superseded material, update this map when authority/path/version/status changes, keep GitHub migration versions aligned with canonical Supabase history, and avoid duplicating full specifications here.

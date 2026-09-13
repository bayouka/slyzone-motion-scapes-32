# KNOWLEDGE.md — 4b4c knowledge map

## Purpose

This file tells humans and AI agents where the reliable knowledge for 4b4c lives. It is an index, not a second specification.

---

## Global authority

### Repository / production / release

Primary source: `README.md`.

Use it for canonical repository identity, canonical Supabase backend, transport-mirror status, runtime ownership, deployment/release chain and current production baseline.

Current **certified** transport production baseline remains **v4.5.12-workspace-engine-adapter-p1 / build 540** until a newer release receives independent runtime certification.

Current active release candidate: **v4.5.12-workspace-foundation-g1-p1 / build 544**, Workspace actions `0.3.0`, deterministic G1 Foundation, adapter functional surface `workspace-engine-adapter-0.2.0`, runtime secret provisioned, G0 + source URL + G1 interaction included.

Runtime source commit for build 544: `b0754db9f3d6b42fb970514a8c2ad00e6e7b798d`.
Transport commit: `6e3720a0444b9b1b427c0c26a62485a304592133`.

Build 544 remains **release candidate** because GitHub exposes no usable Cloudflare status and no independent runtime smoke result is currently observable through the connected tools.

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

Validated: exact decision lineage, package freshness, feedback closure, neutral outcomes, false-GO rejection and promotability without Project Definition side-effect.

## R6 — PASS_PROJECT_DEFINITION_BASELINE

Doc authority:
- `R6_PROJECT_DEFINITION_BASELINE_IMPLEMENTATION_PLAN_V0_1.md`
- `R6_PROJECT_DEFINITION_BASELINE_VALIDATION_REPORT_20260913.md`

Migration: `20260913035836_idea_engine_r6_project_definition_baseline`.

Validated: latest promotable Decision Record only, exact freshness, immutable `APPROVED_IDEA_SNAPSHOT`, immutable Project Definition baseline, controlled artifact promotion, no execution tasks/milestones created.

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

Validated: G8→G12 explicit, authority humaine/expert preserved, artifact freshness/fingerprints enforced, immutable `BUILD_READY_SNAPSHOT` only after ambiguity audit + human Ready approval, no execution Project created.

Implementation sequence complete:
`R0 ✅ → R1 ✅ → R2 ✅ → R3 ✅ → R4 ✅ → R5 ✅ → R6 ✅ → R7 ✅`.

---

## Workspace integration / cutover — ACTIVE

Active UX/integration authority:
- `docs/idea-engine/ux/WORKSPACE_PROJECTION_CONTRACT_V1.md` — projection active **1.2** ;
- `docs/idea-engine/ux/WORKSPACE_INTEGRATION_CUTOVER_PLAN_V1.md` ;
- `docs/idea-engine/ux/WORKSPACE_PRIVILEGED_ADAPTER_CONTRACT_V0_1.md`.

Validation evidence:
- `docs/idea-engine/validation/WORKSPACE_PRIVILEGED_ADAPTER_V0_1_VALIDATION_20260913.md` ;
- `docs/idea-engine/validation/WORKSPACE_SLICE5_INTERACTIONS_VALIDATION_20260913.md`.

### Slice 1 — Canonical read projection — VALIDATED

`get_idea_workspace_projection_v1(idea_id)` is the canonical read model for the new workspace. It aggregates R0→R7 without raw LLM/action payloads and without `phase`, `step`, global `progress` or completion percentage.

### Slice 2 — G0 Blueprint Fit — VALIDATED

Rules validated: no forced Site vitrine; assessment AI/system ≠ human truth; auto-apply only HIGH/non-ambiguous/explicitly auto-applicable; targeted human confirmation otherwise; mismatch preserves RAW/history; material change triggers `BLUEPRINT_MIGRATION_REQUIRED`; affected state invalidation is targeted.

### Slice 3 — Parallel Workspace V3 — VALIDATED PREVIEW

Frontend:
- `site/assets/ideas-workspace-v3-preview.js`
- `site/assets/ideas-workspace-v3-preview.css`
- route `#/ideas/<idea_id>/workspace-v3`.

Production build **539** was the first directly certified Workspace V3 preview.

### Slice 4 — Privileged adapter — SECURITY BASELINE ACTIVE

Worker route: `POST /api/ideas/engine`.

Security invariants:
- JWT user required ;
- strict command/body allowlist ;
- user-scoped access projection before elevation ;
- `can_write` required ;
- server-derived idempotency and stale-safety ;
- no generic RPC/table/SQL selector ;
- no client-chosen privileged authority ;
- service secret Worker-only ;
- modern `sb_secret_...` key sent only in `apikey` ;
- human/expert authority excluded from generic adapter.

Build 540 remains certified baseline. `/health` still exposes a compatibility marker `idea_engine_adapter_v0_1.code=0.1.1`; current functional G1 adapter surface is separately identified by the real allowlist/tool version.

### Slice 5A — G0 interaction — VALIDATED

Backend/browser contract includes targeted human G0 confirmation with stale-safety.

### Slice 5B — URL source interaction — VALIDATED BACKEND

`register_idea_source_v1`, sensitivity selection, deterministic idempotency and stale guard are active.

### Slice 5C — Deterministic G1 Foundation — IMPLEMENTED / RELEASE CANDIDATE

Current migrations present in canonical backend:
- `20260913063230_idea_engine_acquisition_traceability_v1`
- `20260913063548_idea_engine_target_fingerprints_v1`
- `20260913063741_idea_engine_requirement_resolution_refs_v1`
- `20260913064148_idea_engine_g1_foundation_planner_v1`
- `20260913064618_idea_engine_foundation_raw_input_v1`
- `20260913065006_idea_engine_action_retry_v1`
- `20260913070345_idea_engine_foundation_unknown_rescue_v1`

Current frontend actions: `site/assets/ideas-workspace-v3-actions.js` **0.3.0**.

Current adapter allowlist:
- `blueprint_fit.assess`
- `foundation.advance`

G1 behavior:
- deterministic `plan_idea_foundation_v1` ;
- RAW automatic acquisition attempted before a human question when eligible ;
- traceable/stale-safe Action Runs ;
- Requirement-level target fingerprints ;
- extracted `support_text` must exist in persisted RAW before promotion ;
- targeted human question only from planner `dominant_user_action` ;
- targeted `apply_human_information_v1` ;
- `Je ne sais pas / plus tard` via `accept_idea_requirement_unknown_v1` ;
- no generic unresolved-counter question heuristic.

Red-team harness: `scripts/test_workspace_privileged_adapter_v0_2.mjs`, included in `npm run check`.

### Release candidate 544

Transport runtime: `v4.5.12-workspace-foundation-g1-p1 / build 544`.

Gate validates source SHA, actions/shell 0.3.0, G1 allowlist/tool markers, apikey-only server secret semantics, browser secret absence, unauthenticated G0/G1 rejection, and post-deploy asset smoke.

GitHub exposes no Cloudflare commit status; build 544 remains uncertified until an independent runtime result is observable.

### Next architectural requirement

Before widening to **G2 Evidence / Market**:
1. observe/certify build 544 runtime ;
2. run authenticated G1 E2E ;
3. validate mobile/desktop G1 states ;
4. prove no human question appears while an admissible automatic acquisition path remains ;
5. preserve rollback.

Then extend the same pattern to Evidence/Market: Requirements → admissible acquisition paths → traceable Action Runs → provenance/freshness → human last-mile only.

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
- unresolved Requirement state alone never justifies a human question ;
- LLM/providers never own canonical state ;
- Remote Desktop availability is never a normal project dependency.

---

## Knowledge maintenance rule

When a structural invariant is discovered: update the owning document after validation, preserve history/superseded material, update this map when authority/path/version/status changes, keep GitHub migration versions aligned with canonical Supabase history, and avoid duplicating full specifications here.

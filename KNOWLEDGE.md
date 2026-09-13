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

V0.4 currently defines:
- 22 professional Domains D01→D22 ;
- INFO / ANALYSIS / DECISION / SPEC / VERIFY ;
- G0→G12 dependency Gates ;
- Prefiguration Budget ;
- provisional journeys/sitemap/capabilities/content/visual concepts before Project ;
- conditional real-user concept validation ;
- business case/projection rules ;
- professional Decision Package including editable PPTX/PDF target ;
- review feedback + targeted Change Impact ;
- progressive lock/freeze ;
- Idea artifact promotion rather than Project restart ;
- traceability and `READY_FOR_DEVELOPMENT` contract.

---

## Domain / requirement registries

### Consolidated Idea registry

`docs/project-definition/03_REQUIREMENT_REGISTRY_IDEA_V0_2.md`

D01→D07 through strategic direction/macro scope.

### Prefiguration / Decision Package registry

`docs/project-definition/04_PREFIGURATION_DECISION_PACKAGE_REGISTRY_V0_1.md`

Decision-time PREVIEW subsets D08→D19 plus D21/D22.

### Project product / experience registry

`docs/project-definition/04A_REQUIREMENT_REGISTRY_PROJECT_PRODUCT_V0_1.md`

D08→D15.

### Project technical / Build Ready registry

`docs/project-definition/04B_REQUIREMENT_REGISTRY_PROJECT_TECH_BUILDREADY_V0_1.md`

D16→D20.

---

## Detailed subdomain/question catalogs — CURRENT COVERAGE WORK

Master detail index:

`docs/project-definition/detail/05_MASTER_DETAIL_INDEX_V0_1.md`

### Volume A — Idea

`docs/project-definition/detail/05A_IDEA_DETAIL_CATALOG_V0_1.md`

D01→D07 decomposed into subdomains, internal questions, resolution path, human intervention, dependencies, outputs and lock targets.

### Volume B — Prefiguration / Decision

`docs/project-definition/detail/05B_PREFIGURATION_DECISION_DETAIL_CATALOG_V0_1.md`

Z4/Z4b/Z5, PREVIEW D08→D19 + D21/D22, including decision-usefulness/fidelity, concept validation, business case, deck/review/approval.

### Volume C — Project product / experience

`docs/project-definition/detail/05C_PROJECT_PRODUCT_DETAIL_CATALOG_V0_1.md`

D08→D15 in Project depth: journeys, IA/routes, content, SEO, functional/business rules/states, data/CMS/roles, integrations and UX/UI/design system.

### Volume D — Project tech / Build Ready

`docs/project-definition/detail/05D_PROJECT_TECH_BUILDREADY_DETAIL_CATALOG_V0_1.md`

D16→D20 in Project/Build Ready depth: architecture, security/privacy/legal, accessibility/performance/reliability, measurement/observability, QA/acceptance/handoff.

These detailed catalogs are **not visible questionnaires**. Their internal questions are requirements to resolve, not necessarily things to ask a user.

---

## Cross-cutting candidate mechanisms

### Context applicability

`docs/project-definition/06_CONTEXT_OVERLAY_CATALOG_V0_1.md`

Candidate overlays include redesign, local business, multilingual, CMS, personal/sensitive data, auth/roles, critical integration, SEO/domain migration, team decision, presentation, business case, concept validation, regulated, brand transition, budget/time constrained, media/motion, high traffic/business critical and external-vendor handoff.

### Approved Idea → Project promotion

`docs/project-definition/07_APPROVED_IDEA_TO_PROJECT_PROMOTION_CONTRACT_V0_1.md`

Defines Z6, approval-condition classes, artifact promotion, promotion diff and Project Baseline creation.

### Human intervention minimization

`docs/project-definition/08_HUMAN_INTERVENTION_MAP_V0_1.md`

Key target:

> **aucune question évitable, aucune décision humaine escamotée.**

### Cross-cutting ledgers

`docs/project-definition/09_CROSS_CUTTING_LEDGER_MODEL_V0_1.md`

Defines Evidence/Source, Assumption, Decision, Risk/Unknown, Conflict, Change, Artifact, Requirement Traceability and Snapshot ledgers.

### Progressive lock / freeze / promotion

`docs/project-definition/PROGRESSIVE_LOCK_PROMOTION_MODEL_V0_1.md`

Candidate states:
`WORKING → AI_PROPOSED → VALIDATED_CURRENT → LOCKED_FOR_DEPENDENTS → FROZEN_IN_DECISION_SNAPSHOT → APPROVED_FOR_PROJECT → FROZEN_FOR_BUILD`, plus review/stale/superseded/rejected states.

### AI vs Human resolution

`docs/project-definition/AI_HUMAN_RESOLUTION_POLICY_V0_1.md`

Invariant:
`Requirement exists ≠ question user`.

---

## Validation support

Current validation material includes:
- `docs/project-definition/PROJECT_DEFINITION_REFERENCE_ARCHITECTURE_RED_TEAM_20260913.md`
- `docs/project-definition/PREFIGURATION_DECISION_PACKAGE_RED_TEAM_20260913.md`
- `docs/project-definition/validation/IDEA_REQUIREMENT_REGISTRY_RED_TEAM_20260913.md`
- `docs/project-definition/validation/MATRIX_V5_TO_REFERENCE_ARCHITECTURE_COVERAGE_AUDIT_20260913.md`
- `docs/project-definition/validation/DETAILED_REFERENTIAL_RED_TEAM_20260913.md`
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

No new workspace prototype should be promoted or implemented until the professional lifecycle/master referential is explicitly validated.

---

## Production implementation vs design candidates

Do not conflate:
- current production implementation ;
- current canonical Idea Engine ;
- non-canonical Project Definition architecture/registries.

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
- developers retain implementation discretion when it does not alter product behavior/constraints.

---

## Knowledge maintenance rule

When a structural invariant is discovered:
- do not leave it only in chat ;
- update the owning document after validation ;
- preserve superseded/history material ;
- update this map when authority/path/version/status changes ;
- avoid duplicating full specifications here.

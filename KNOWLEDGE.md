# KNOWLEDGE.md — 4b4c knowledge map

## Purpose

This file tells humans and AI agents **where the reliable knowledge for 4b4c lives**.

It is an index, not a second specification. Read the linked canonical source rather than reconstructing rules from memory or old UI behavior.

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

## Idea Engine — canonical target

Scope currently canonical in Master Blueprint V1.1:

> Idea → understanding/enrichment → candidate proposition → decision → optional Project Draft

Reference Blueprint currently validated:

> creation or redesign of a showcase/marketing website (`site vitrine`).

Do not claim universal information coverage for every future project type yet.

### 1. Master orchestration architecture

**Primary canonical source:**

`docs/idea-engine/canonical/IDEA_ENGINE_MASTER_BLUEPRINT_V1.md`

Read this first for any substantial Idea Engine work.

It defines the current canonical Idea Engine, including IDD, Outputs, Requirements, Acquisition Engine, Readiness, System Actions/User NBA, Change Intelligence and GO/REVISE/PAUSE/STOP.

**Important current design review:** the professional lifecycle and depth boundary between Idea, Project Definition and Build Ready are under controlled re-audit. Do not mutate the canonical Master Blueprint until that architecture is explicitly validated.

### 2. Detailed workflow mechanisms

**Canonical companion:**

`docs/idea-engine/canonical/WORKFLOW_V7_1_CONSOLIDATED.md`

Use it for Project Memory, provenance, Answer Resolver, Evidence, Recommendation Contract, Candidate formation, Change Intelligence, Decision Requirements, collaboration, Decision Brief and handoff mechanisms.

Its historical state chain is not a mandatory wizard.

### 3. Information registry — Site vitrine Blueprint

**Current canonical:**

`docs/idea-engine/canonical/INFORMATION_MATRIX_V5_OUTPUT_DRIVEN.md`

V5 remains a valuable Idea information registry, not a visible questionnaire.

**Current audit note:** V5 is no longer assumed to be the future master referential through `READY_FOR_DEVELOPMENT`. It must be coverage-mapped and migrated into the candidate Project Definition Reference Architecture after validation. This does not invalidate its current canonical Idea-level rules.

### 4. Capture, ingestion and structured memory

**Current canonical:**

`docs/idea-engine/canonical/CAPTURE_INGESTION_MEMORY_CONTRACT_V1_2.md`

Use it for RAW FIRST, autosave, guided capture, source ingestion, provenance/versioning/stale safety and `Commencer avec 2b2c` behavior.

### 5. Initial Capture UX validated snapshot

**Validated capture surface:**

`docs/idea-engine/ux/CAPTURE_UX_V5_VALIDATED.md`

The capture surface remains validated functionally. No regression to a giant questionnaire is authorized.

---

## Professional Idea → Project → Build Ready architecture — CURRENT PRIORITY

Workspace UX work is **paused** until the professional referential architecture is validated.

### Current architecture candidate

`docs/project-definition/PROJECT_DEFINITION_REFERENCE_ARCHITECTURE_V0_2.md`

Status: **NON CANONIQUE / CANDIDATE À VALIDER**.

It supersedes V0.1 as the current architecture candidate and proposes:

- three lifecycle zones: `IDEA_DECISION / PROJECT_DEFINITION / BUILD_READY` ;
- five atom types: `INFO / ANALYSIS / DECISION / SPEC / VERIFY` ;
- Domains separate from Gates and Deliverables ;
- Core + Blueprint Overlays + Context Overlays + Delivery Profile Overlays + Standard Profiles ;
- 20 professional Domains ;
- G0→G9 dependency Gates ;
- exploratory vs provisional/current/frozen artifacts ;
- traceability `Requirement → Spec → Verify` ;
- decision authority / owner / criticality by Gate ;
- Change Impact ;
- explicit `READY_FOR_DEVELOPMENT` contract ;
- `IMPLEMENTATION_DISCRETION` so developers are not over-specified while product ambiguity is removed.

### Red-team support

`docs/project-definition/PROJECT_DEFINITION_REFERENCE_ARCHITECTURE_RED_TEAM_20260913.md`

The red-team tested simple brochure sites, SEO-heavy redesigns, regulated contexts, multilingual sites, CMS, personal-data forms, no-direct-competitor cases, tech constraints, early design requests, incomplete final content, third-party failures and late changes after readiness.

### Earlier lifecycle audit

`docs/idea-engine/validation/IDEA_TO_PROJECT_PROFESSIONAL_LIFECYCLE_AUDIT_20260913.md`

Still useful as supporting reasoning, but the V0.2 architecture above is the current candidate structure.

### Preliminary requirements matrix — DO NOT EXPAND YET

`docs/idea-engine/validation/PROFESSIONAL_REQUIREMENTS_MASTER_MATRIX_V0_1.md`

This is an exploratory inventory created before the architecture was stabilized. Do **not** treat it as the final schema and do not expand it atom-by-atom until `PROJECT_DEFINITION_REFERENCE_ARCHITECTURE_V0_2.md` has been explicitly validated.

---

## Workspace UX — PAUSED / historical candidates

The following are retained only as historical validation material:

- `docs/idea-engine/ux/WORKSPACE_PROJECTION_CONTRACT_V0_2.md`
- `docs/idea-engine/ux/WORKSPACE_PROJECTION_CONTRACT_V0_3.md`
- `docs/idea-engine/ux/WORKSPACE_WIREFRAMES_V0_1.md`
- `docs/idea-engine/validation/WORKSPACE_PROJECTION_V0_2_RED_TEAM_20260913.md`
- `docs/idea-engine/validation/WORKSPACE_INTERACTIVE_PROTOTYPE_V0_1_TEST_20260913.md`
- `docs/idea-engine/validation/QUESTION_ENRICHMENT_COMPETITIVE_AUDIT_20260913.md`

`WORKSPACE_PROJECTION_CONTRACT_V0_3.md` is explicitly rejected as the active UX direction because it still attempted to project the workspace before the professional lifecycle had been fully formalized.

No new workspace prototype should be promoted or implemented until the lifecycle/master referential architecture is validated and sufficient requirement coverage exists.

---

## Production implementation vs design candidates

Do not conflate:

- **Current production implementation** = what the repository serves today and root runtime docs describe.
- **Canonical Idea Engine target** = current canonical documents.
- **Project Definition architecture candidate** = V0.2 above; may later change canonical boundaries only after explicit validation.

Before changing production Ideas code:

1. read Master Blueprint V1.1 ;
2. read Matrix V5 ;
3. read Capture Contract V1.2 ;
4. read this file for current architecture status ;
5. do not implement rejected workspace candidates ;
6. do not change production while the Project Definition architecture remains under design unless explicitly authorized.

---

## Key established invariants

Unless explicitly reopened through the architecture audit:

- raw input/provenance survives AI interpretation ;
- exhaustive internal coverage must never become a giant visible form ;
- human questions are last-mile when source/research/calculation/inference can legitimately resolve an item ;
- AI inference is not human truth ;
- stale results cannot overwrite newer state ;
- accepted unknown is valid when non-blocking ;
- research and challenge serve actual decisions ;
- GO is not privileged over revise/pause/stop ;
- the system should do more work than the novice user ;
- Idea is not Project ;
- GO to Project is not Ready for Development ;
- development execution is not Project Definition ;
- requirements/standards must be proportional to applicability and risk.

---

## Supporting validation material

Reference profiles:

- Nathalie — novice, solo decision ;
- Vincent — experienced/pressured, many existing sources ;
- Maya — multi-decision-maker context with disagreements.

These are tests, not separate product modes.

---

## Current operational/collaboration domains

For production collaboration behavior, consult root `README.md` first. Relevant dated docs include notably the Call Engine audits/gates and `PRE_COLLAB_AUDIT.md`.

---

## Knowledge maintenance rule

When a future session discovers a structural invariant:

- do not leave it only in chat ;
- update the owning canonical document after validation ;
- preserve superseded/history material ;
- update this map when authority/path/version/status changes ;
- do not duplicate complete specifications here.

When ownership is unclear, determine precedence before implementation rather than creating competing truths.
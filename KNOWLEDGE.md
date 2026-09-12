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

Read this **first** for any substantial Idea Engine work.

It defines:

- what 4b4c currently considers before GO ;
- Idea Decision Dossier vs Project Draft ;
- six-layer engine architecture ;
- Output Contracts ;
- Requirement Model ;
- independent Output Readiness ;
- Acquisition Engine ;
- separate system actions vs user next action ;
- Next Best Action selection ;
- challenge/research as capabilities, not fixed steps ;
- capture→workspace orchestration ;
- UX projection principles.

**Important current design review:** the exact professional lifecycle and depth boundary between Idea and Project are now under controlled re-audit. Do not mutate the canonical Master Blueprint until that audit is validated.

### 2. Detailed workflow mechanisms

**Canonical companion:**

`docs/idea-engine/canonical/WORKFLOW_V7_1_CONSOLIDATED.md`

Use it for detailed mechanisms such as:

- Project Memory ;
- provenance/information states ;
- Answer Resolver ;
- Research Planner / Evidence Model ;
- Recommendation Contract ;
- Candidate formation ;
- Change Intelligence ;
- Decision Requirements ;
- collaboration/workshop ;
- Candidate snapshots ;
- Decision Brief ;
- GO / REVISE / PAUSE / STOP ;
- Project Draft handoff.

Its historical state chain is not a mandatory wizard.

### 3. Information registry — Site vitrine Blueprint

**Current canonical:**

`docs/idea-engine/canonical/INFORMATION_MATRIX_V5_OUTPUT_DRIVEN.md`

**Supersedes:** `INFORMATION_MATRIX_V4_1.md`, preserved as history.

V5 remains a valuable internal information registry, not a visible questionnaire.

Use it for:

- information keys/domains ;
- Output Contract dependencies O1→O9 ;
- Activation Contexts ;
- acquisition paths ;
- human-only vs extractable/researchable/inferable information ;
- output-relative Requirement rules ;
- readiness conditions ;
- accepted unknown ;
- research/question triggers ;
- Site vitrine coverage tests.

**Current audit note:** V5 must now be coverage-mapped against the professional `Idea → Project → Ready for Development` lifecycle before further workspace UX is designed. This does not invalidate V5 as a data registry.

### 4. Capture, ingestion and structured memory

**Current canonical:**

`docs/idea-engine/canonical/CAPTURE_INGESTION_MEMORY_CONTRACT_V1_2.md`

Use V1.2 for:

- RAW FIRST and autosave ;
- optional guided assistance ;
- AI enrichment of visible description without source loss ;
- Links / Images / Documents ;
- provenance/versioning/stale-safety ;
- opportunistic pre-analysis after persistence ;
- exact role of `Commencer avec 2b2c` ;
- no mandatory analysis-only page ;
- no immediate repetition of a brief 2b2c just helped write.

### 5. Initial Capture UX validated snapshot

**Validated capture surface:**

`docs/idea-engine/ux/CAPTURE_UX_V5_VALIDATED.md`

The capture surface remains validated functionally. Its post-click behavior may need later reconciliation with the professional lifecycle audit, but no regression to a large questionnaire is authorized.

### 6. Professional lifecycle audit — CURRENT PRIORITY

Workspace UX work is **paused** until the lifecycle from a raw idea to a project ready for development is formally covered.

Primary current working audit:

`docs/idea-engine/validation/IDEA_TO_PROJECT_PROFESSIONAL_LIFECYCLE_AUDIT_20260913.md`

Detailed working requirements registry:

`docs/idea-engine/validation/PROFESSIONAL_REQUIREMENTS_MASTER_MATRIX_V0_1.md`

These are **non-canonical working candidates**. They propose three distinct zones:

1. **IDEA** — understand, research, compare, challenge, improve, test feasibility and select the direction ;
2. **PROJECT / PRE-DEVELOPMENT** — transform the selected Idea into complete requirements, UX, content, design, technical architecture, non-functional requirements, QA criteria and delivery handoff ;
3. **DEVELOPMENT / PRODUCTION** — implement, test, preproduce, release and operate.

Core working hypothesis:

> target/problem must be sufficiently understood before selecting meaningful competitors ; competitive/evidence work must be able to modify the original Idea ; the improved Idea is selected/frozen before detailed Project definition ; detailed Project work then continues until `READY_FOR_DEVELOPMENT`.

Do not implement this hypothesis as canonical behavior until coverage/red-team validation is complete.

### 7. Workspace UX — PAUSED / historical candidates

The following are retained only as historical validation material:

- `docs/idea-engine/ux/WORKSPACE_PROJECTION_CONTRACT_V0_2.md`
- `docs/idea-engine/ux/WORKSPACE_PROJECTION_CONTRACT_V0_3.md`
- `docs/idea-engine/ux/WORKSPACE_WIREFRAMES_V0_1.md`
- `docs/idea-engine/validation/WORKSPACE_PROJECTION_V0_2_RED_TEAM_20260913.md`
- `docs/idea-engine/validation/WORKSPACE_INTERACTIVE_PROTOTYPE_V0_1_TEST_20260913.md`
- `docs/idea-engine/validation/QUESTION_ENRICHMENT_COMPETITIVE_AUDIT_20260913.md`

`WORKSPACE_PROJECTION_CONTRACT_V0_3.md` is explicitly **rejected as the active UX direction** because it still attempted to project the workspace before the professional lifecycle had been fully formalized.

No new workspace prototype should be promoted or implemented until the lifecycle/master requirements audit is validated.

---

## Production implementation vs target Idea Engine

Do not conflate:

- **Current production implementation** = what the repository serves today and root runtime docs describe.
- **Canonical Idea Engine target** = current canonical documents.
- **Lifecycle audit candidates** = current design work that may later modify canonical boundaries after explicit validation.

Before changing production Ideas code:

1. read Master Blueprint V1.1 ;
2. read Matrix V5 ;
3. read Capture Contract V1.2 ;
4. read the current lifecycle audit status in this file ;
5. inspect current implementation ;
6. do not implement rejected workspace candidates ;
7. do not change production while lifecycle architecture remains under design unless explicitly authorized.

---

## Key established invariants

Unless explicitly reopened through the lifecycle audit:

- raw input/provenance must survive AI interpretation ;
- Matrix/full information coverage must never become a giant visible form ;
- human questions are last-mile when AI/source/research/calculation can resolve information ;
- AI inference is not human truth ;
- stale results cannot overwrite newer state ;
- accepted unknown is valid when non-blocking ;
- research and challenge must serve a real output/decision ;
- GO is not privileged over revise/pause/stop ;
- the system should do more work than the novice user ;
- project execution machinery must not be invented before the corresponding Project exists.

---

## Supporting validation material

Reference profiles:

- Nathalie — novice, solo decision ;
- Vincent — experienced/pressured, many existing sources ;
- Maya — multi-decision-maker context with disagreements.

These are tests, not separate product modes.

---

## Current operational/collaboration domains

For production collaboration behavior, consult root `README.md` first. Relevant dated docs include:

- `docs/CALL_SYSTEM_AUDIT_AND_V3_ARCHITECTURE_20260912.md`
- `docs/CALL_ENGINE_V3_DIRECT_DECISION_20260912.md`
- `docs/CALL_ENGINE_V3_IMPLEMENTATION_GATE_20260912.md`
- `docs/CALL_ENGINE_V3_SFU_API_NOTES_20260912.md`
- `docs/CALL_ENGINE_V2_RELEASE_GATE_20260912.md`
- `docs/PRE_COLLAB_AUDIT.md`

---

## Knowledge maintenance rule

When a future session discovers a structural invariant:

- do not leave it only in chat ;
- update the owning canonical document after validation ;
- preserve superseded/history material ;
- update this map when authority/path/version/status changes ;
- do not duplicate complete specifications here.

When ownership is unclear, determine precedence before implementation rather than creating competing truths.
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

Scope:

> Idea → understanding/enrichment → candidate proposition → decision → optional Project Draft

Reference Blueprint currently validated:

> creation or redesign of a showcase/marketing website (`site vitrine`).

Do not claim universal information coverage for every future project type yet.

### 1. Master orchestration architecture

**Primary canonical source:**

`docs/idea-engine/canonical/IDEA_ENGINE_MASTER_BLUEPRINT_V1.md`

Read this **first** for any substantial Idea Engine work.

It defines:

- what 4b4c actually is before GO ;
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
- UX projection principles ;
- precedence over any linear reading of older workflow states/B-levels.

**Important precedence:** where `WORKFLOW_V7_1_CONSOLIDATED.md` or the historical `B0→B4` matrix language appears sequential, the Master Blueprint V1 governs orchestration and readiness.

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

Its historical state chain is **not** a mandatory linear state machine anymore. Read it through Master Blueprint V1.

### 3. Information registry — Site vitrine Blueprint

**Current canonical:**

`docs/idea-engine/canonical/INFORMATION_MATRIX_V5_OUTPUT_DRIVEN.md`

**Supersedes:** `INFORMATION_MATRIX_V4_1.md`, preserved as history.

V5 is the internal **complete Idea information dossier / “full form”** for the Site vitrine Blueprint, but it is never shown as a full questionnaire.

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

The historical `B0/B1/B2/B3/B4` model is no longer the current information contract. The migration anticipated in Master Blueprint V1 §27 is now completed by Matrix V5.

### 4. Capture, ingestion and structured memory

**Current canonical:**

`docs/idea-engine/canonical/CAPTURE_INGESTION_MEMORY_CONTRACT_V1_2.md`

**Supersedes:** V1.1 and V1.0 while preserving their history.

Use V1.2 for:

- RAW FIRST and autosave ;
- optional guided assistance ;
- AI enrichment of visible description without source loss ;
- Links / Images / Documents ;
- provenance/versioning/stale-safety ;
- opportunistic pre-analysis after persistence ;
- exact role of `Commencer avec 2b2c` ;
- direct entry into the first useful workspace state ;
- no mandatory `2b2c analyse…` intermediate page ;
- no immediate repetition of a brief 2b2c just helped write.

### 5. Initial Capture UX validated snapshot

**Validated capture surface:**

`docs/idea-engine/ux/CAPTURE_UX_V5_VALIDATED.md`

Use it for the validated low-fidelity capture surface and microcopy:

- `Parlez-nous de votre idée ?` ;
- short placeholder/contextual help ;
- optional `M’aider à préciser mon idée` ;
- automatic visible-description enrichment ;
- `+ Ajouter des éléments` → Links / Images / Documents ;
- source context/notes ;
- `Commencer avec 2b2c`.

The capture **surface** remains validated. Its older sections describing post-click analysis/first-return behavior are refined/superseded by Capture Contract V1.2 and Master Blueprint V1. Do not reintroduce an intermediate analysis page from the old snapshot wording.

### 6. Post-capture Idea workspace — current UX candidate, not yet validated

**Candidate behavior contract:**

`docs/idea-engine/ux/WORKSPACE_PROJECTION_CONTRACT_V0_2.md`

**Candidate low-fidelity wireframes:**

`docs/idea-engine/ux/WORKSPACE_WIREFRAMES_V0_1.md`

**Supporting red-team:**

`docs/idea-engine/validation/WORKSPACE_PROJECTION_V0_2_RED_TEAM_20260913.md`

Status: **candidate / not functionally validated yet**. These files do not override the Master Blueprint, Matrix V5, Capture Contract V1.2 or validated Capture UX.

They define/test the current proposed novice-oriented projection model:

- permanent `ORIENTATION_NOW` ;
- consequence-based `PROGRESS_SIGNAL` ;
- conditional `ATTENTION_NOW` ;
- zero-or-one dominant `USER_NEXT_ACTION` ;
- prudent `NEXT_VALUE_HINT` ;
- explicit Rescue Path (`Je ne sais pas`, proposal, hypothesis, later, accepted unknown) ;
- long-running autonomous work without fake steps/spinners ;
- stable workspace surface with adaptive dominant content ;
- progress by consequences rather than global percentage/stage.

Do **not** implement these candidates as a frozen production contract until explicit functional validation. Use them as the current basis for low-fidelity prototype/testing.

---

## Production implementation vs target Idea Engine

Do not conflate:

- **Current production implementation** = what the repository serves today and root runtime docs describe.
- **Target Idea Engine** = Master Blueprint + Matrix V5 + canonical domain contracts + validated UX snapshots.

Historical production Ideas behavior is not evidence that the target model should regress to a wizard.

Before changing production Ideas code:

1. read Master Blueprint V1 ;
2. read Matrix V5 ;
3. read the specific canonical contract(s) ;
4. read validated UX snapshot(s) relevant to the surface ;
5. audit the existing implementation/tables/RPCs ;
6. identify the minimal safe change ;
7. preserve data/contracts unless an explicit migration is designed ;
8. verify public runtime according to `README.md`.

---

## Key Idea Engine invariants — index only

- Idea ≠ Project.
- The canonical pre-GO object is a living structured **Idea Decision Dossier**, not a completed questionnaire.
- Matrix V5 can be exhaustive internally while the user sees only the information currently useful.
- The engine is driven by **Output Contracts + Requirements + Readiness + Next Best Action**, not screen order.
- 2b2c does more work than the user.
- System actions and the user next action are distinct; autonomous work may run in parallel.
- A human question is a last-mile acquisition path, not the default.
- Research/challenge/improvement are capabilities, not mandatory stages.
- Readiness is per output/decision, never a global arbitrary percentage.
- Raw data is persisted before AI analysis.
- Opportunistic pre-analysis is allowed only after persistence and with version/stale safety.
- `Commencer avec 2b2c` is not `Sauvegarder` and does not require an intermediate analysis screen.
- Original wording/provenance survive AI structuring/synthesis.
- Prefill ≠ freeze; visibility ≠ existence.
- `Je ne sais pas` / accepted unknown are valid.
- Recommendations may conclude insufficient information or recommend stop/pause/simplification.
- Changes reopen only affected dependencies.
- Presentation/projection/workshop may be `NOT_RELEVANT`.
- Project Draft exists only after explicit GO.

Read exact canonical sources before implementing.

---

## Supporting validation material

Prototypes, walkthroughs, red-team docs and synthetic profiles explain **why** the current model exists but are not independent truth unless promoted explicitly.

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
- update the owning canonical document ;
- preserve superseded/history material ;
- update this map when authority/path/version/status changes ;
- do not duplicate complete specifications here.

When ownership is unclear, determine precedence before implementation rather than creating competing truths.

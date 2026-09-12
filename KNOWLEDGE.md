# KNOWLEDGE.md — 4b4c knowledge map

## Purpose

This file tells humans and AI agents **where the reliable knowledge for 4b4c lives**.

It is an index, not a second specification. If a detailed rule is needed, read the linked source rather than inferring it from this summary.

## Global authority

### Repository / production / release

**Primary source:** `README.md`

Use it for:

- canonical repository identity;
- canonical Supabase backend identity;
- transport-mirror status;
- effective runtime ownership;
- deployment/release chain;
- current production baseline;
- high-level product and collaboration contract.

Supporting operational sources currently include:

- `docs/RECOVERY_BASELINE_20260911.md`
- `docs/RUNTIME_OWNERSHIP_20260911.md`
- `docs/TECHNICAL_AUDIT_20260909.md`
- `docs/PRODUCT_AUDIT_20260911.md`
- `docs/UX_PRODUCT_DA_GATE_20260911.md`
- `docs/E2E_TEST_MATRIX_20260911.md`

These dated documents are important recovery/audit evidence, but they do not automatically override a newer explicit canonical contract.

## Idea Engine — canonical target

Scope:

> Idea → understanding/enrichment → candidate proposal → decision → optional Project Draft

Reference Blueprint currently used to design and validate the engine:

> creation or redesign of a showcase/marketing website (`site vitrine`).

Do not claim universal validation for every future project type yet.

### 1. Workflow and orchestration

**Canonical:** `docs/idea-engine/canonical/WORKFLOW_V7_1_CONSOLIDATED.md`

Use it for:

- overall Idea lifecycle;
- adaptive vs fixed behavior;
- Project Memory;
- provenance and information states;
- Next Best Action;
- research/evidence/recommendations;
- proposal formation;
- Change Intelligence;
- Decision Requirements;
- solo/team decision flows;
- presentation/workshop rules;
- Candidate snapshots;
- Idea → Project Draft handoff;
- role of deterministic rules vs LLM reasoning.

### 2. Information contract and dependencies

**Canonical:** `docs/idea-engine/canonical/INFORMATION_MATRIX_V4_1.md`

Use it for:

- which information matters for the Site vitrine Blueprint;
- how it may be acquired;
- whether AI may extract/infer/propose it;
- which information requires human validation/decision;
- dependencies between information and outputs;
- blocking levels;
- presentation/decision readiness dependencies.

Important: the matrix is an internal contract. It must never become a giant visible questionnaire.

### 3. Capture, ingestion and structured memory

**Canonical:** `docs/idea-engine/canonical/CAPTURE_INGESTION_MEMORY_CONTRACT_V1_1.md`

**Supersedes:** `docs/idea-engine/canonical/CAPTURE_INGESTION_MEMORY_CONTRACT_V1.md`

Use V1.1 for:

- autosave and RAW FIRST;
- exact role of `Commencer avec 2b2c`;
- upload persistence before navigation;
- raw input + structured memory;
- optional guided assistance `M’aider à préciser mon idée`;
- AI enrichment of the visible description without overwriting human sources;
- rollback to the prior description;
- atomic multi-domain extraction;
- negation/modality/temporal interpretation;
- prefill without freezing;
- links/images/documents and optional context/notes;
- supported-format strategy and deferred quota sizing;
- Answer Resolver rules;
- capture-versioning and stale-safety;
- targeted supersession;
- Idea-document-as-view rather than single source-of-truth blob;
- mandatory QA cases for Capture V5.

For capture/ingestion-specific ambiguity, this contract is the most specific source and should be read alongside Workflow V7.1 and Matrix V4.1.

### 4. Capture UX validated snapshot

**Validated functional UX:** `docs/idea-engine/ux/CAPTURE_UX_V5_VALIDATED.md`

Use it for the validated low-fidelity shape and microcopy of the initial Idea capture:

- `Parlez-nous de votre idée ?`;
- short placeholder + contextual help;
- optional adaptive guided help;
- automatic enrichment of the visible description;
- `+ Ajouter des éléments` with Links / Images / Documents;
- context/notes per source;
- `Commencer avec 2b2c`;
- first post-analysis acknowledgment and Next Best Action.

This file is **functionally validated**, not a final high-fidelity visual design contract.

## Production implementation vs target Idea Engine

Do not conflate these two layers:

- **Current production implementation** = what the repository currently serves and what root `README.md`/runtime docs describe.
- **Target Idea Engine** = the newer conceptual/UX/information contract in `docs/idea-engine/canonical/` plus explicitly validated UX snapshots in `docs/idea-engine/ux/`.

The production Ideas module may still contain historical rigid behavior such as fixed progression and older IA buttons. That historical implementation is not evidence that the target conceptual model should regress to a wizard.

Before changing production Ideas code:

1. read the target Idea Engine canonical docs;
2. read any validated UX snapshot for the surface being changed;
3. audit the existing implementation/tables/RPCs;
4. identify the minimal safe change;
5. preserve existing data/contracts unless an explicit migration is designed and validated;
6. verify public runtime after release according to `README.md`.

## Key Idea Engine invariants — index only

These are pointers, not substitutes for the canonical documents:

- Idea ≠ Project.
- 2b2c exploits existing information before asking.
- Workspace is adaptive; internal states are not a forced visible wizard.
- Raw user/source data is persisted before LLM analysis.
- `Commencer avec 2b2c` starts analysis/workspace entry; it is not the first save.
- The initial description can be empty, minimal or rich.
- Guided help is optional and adaptive, never a mandatory form.
- Guided human answers remain distinct from AI-generated synthesis.
- AI may enrich the visible description, but never silently erase the original.
- One rich brief can populate many domains.
- Original wording and provenance survive AI structuring.
- Prefill ≠ freeze.
- Known information may remain hidden until relevant.
- Questions exist only for information still necessary now.
- `Je ne sais pas` is a valid state/path.
- Recommendations are explainable and may conclude insufficient evidence.
- Decision readiness depends on actual Decision Requirements.
- Changes re-open only affected dependencies.
- Presentation/workshop are optional.
- Launch/deepen/pause/stop are all valid outcomes.
- Project Draft exists only after launch.

Read the exact canonical source before implementing any of these.

## Supporting validation material

Cognitive walkthroughs, synthetic profiles, prototypes and red-team documents are useful for explaining **why** the current model exists, but they are not independent sources of truth unless explicitly promoted to canonical/validated status.

Typical reference profiles used during Idea Engine validation:

- Nathalie — novice, solo decision;
- Vincent — experienced/pressured Fast Path user with existing documents;
- Maya — multi-decision-maker context with real disagreements.

These are test profiles, not users or mandatory product modes. 4b4c must implement one adaptive workspace, not three separate journeys.

## Current operational/collaboration domains

For production collaboration behavior, consult root `README.md` first. Relevant dated docs in `docs/` include communication/call/recovery/audit material such as:

- `docs/CALL_SYSTEM_AUDIT_AND_V3_ARCHITECTURE_20260912.md`
- `docs/CALL_ENGINE_V3_DIRECT_DECISION_20260912.md`
- `docs/CALL_ENGINE_V3_IMPLEMENTATION_GATE_20260912.md`
- `docs/CALL_ENGINE_V3_SFU_API_NOTES_20260912.md`
- `docs/CALL_ENGINE_V2_RELEASE_GATE_20260912.md`
- `docs/PRE_COLLAB_AUDIT.md`

Treat these according to their explicit status and date. Root `README.md` remains the entry point for current production authority.

## Knowledge maintenance rule

When a future session discovers a structural invariant:

- do not leave it only in chat;
- update the canonical document that owns the rule;
- preserve historical/superseded material when needed;
- update this map if the source path/version/status changes;
- do not duplicate full specifications here.

When uncertainty exists about which document owns a new rule, stop before implementation and determine ownership/precedence explicitly rather than creating another competing source of truth.

# KNOWLEDGE.md — 4b4c knowledge map

## Purpose

This file tells humans and AI agents where reliable 4b4c knowledge lives. It is an index, not a second specification.

Dynamic production state is deliberately **not duplicated here**. Read `README.md` for the current certified runtime/build, backend identity, active executor surface and release chain.

---

## 1. Global authority

### Repository / production / release

Primary source: `README.md`.

Use it for:
- canonical repository identity ;
- canonical Supabase backend ;
- transport-mirror status ;
- effective runtime ownership ;
- current certified production build/release ;
- active/dormant Idea Engine executor surface ;
- Cloudflare release and recovery chain ;
- known runtime technical debt.

Do not copy a build number from this file into another status document and treat it as current. `README.md` is the dynamic production authority.

Supporting operational sources include notably:
- `docs/RECOVERY_BASELINE_20260911.md`
- `docs/RUNTIME_OWNERSHIP_20260911.md`
- `docs/TECHNICAL_AUDIT_20260909.md`
- `docs/PRODUCT_AUDIT_20260911.md`
- `docs/UX_PRODUCT_DA_GATE_20260911.md`
- `docs/E2E_TEST_MATRIX_20260911.md`
- `docs/audit/STABILIZATION_AUDIT_20260916.md`

The stabilization audit is the current authority for verified cleanup/debt classification performed after the canonical G0→G5 runtime became available. It does not replace `README.md` for live build/runtime identity.

### Tooling workflow

Authority: `docs/REMOTE_DESKTOP_POLICY.md`.

Canonical work proceeds through GitHub and the relevant remote services/connectors. Remote Desktop Commander is local-only/last-resort and its absence must never block normal project progress.

---

## 2. Project Master Blueprint — canonical cross-lifecycle referential

Primary authority:

`docs/project-definition/canonical/PROJECT_MASTER_BLUEPRINT_V1.md`

Machine projection:

`docs/project-definition/machine/MASTER_BLUEPRINT_V1.json`

Executable invariant check:

`scripts/master-blueprint-v1-check.mjs`

`npm run check` includes this contract check.

This is the canonical target architecture for:

`Idea → decision → approved GO → Project Baseline → Project Definition → READY_FOR_DEVELOPMENT`.

### Canonical architecture

Three layers:

`Core Ontology → Blueprint Pack → Project Instance`.

Canonical Domain Registry:

- D01 Intent & Context
- D02 Business & Success
- D03 Users & Needs
- D04 Market & Evidence
- D05 Offer & Positioning
- D06 Governance & Decisions
- D07 Scope & Priorities
- D08 Content & Assets
- D09 SEO & Discoverability
- D10 Information Architecture & UX
- D11 Brand, UI & Interaction
- D12 Functional Behaviour
- D13 Data & Integrations
- D14 Architecture & Operations
- D15 Quality, Risk & Compliance
- D16 Delivery & Handoff

Canonical Formal Gates:

- `G0_BLUEPRINT_FIT`
- `G1_IDEA_DECISION_READY`
- `G2_GO_PROJECT`
- `G3_PROJECT_BASELINE`
- `G4_RFD_LOT`
- `G5_RFD_PROJECT`

Readiness diagnostics remain `ReadinessPredicate`; they are not additional Formal Gates.

Key cross-lifecycle invariants include:
- Core Ontology ≠ Blueprint Pack ≠ Project Instance ;
- Claim ≠ Evidence ≠ Assumption ≠ Recommendation ≠ Decision ;
- Requirement ≠ Test ≠ execution Evidence ;
- Applicability ≠ fulfilment/readiness ;
- HARD dependency graph is acyclic ;
- stale propagation/recompute is targeted ;
- GO requires explicit human authority ;
- `READY_FOR_DEVELOPMENT` is derived, never manually toggled ;
- Critical TBD count is zero for the scope of an RFD Delivery Lot ;
- post-freeze structural change uses `ChangeRequest` and a new baseline.

---

## 3. Idea Engine — canonical pre-GO orchestration

Primary sources:

1. `docs/idea-engine/canonical/IDEA_ENGINE_MASTER_BLUEPRINT_V1.md`
2. `docs/idea-engine/canonical/WORKFLOW_V7_1_CONSOLIDATED.md`
3. `docs/idea-engine/canonical/INFORMATION_MATRIX_V5_OUTPUT_DRIVEN.md`
4. `docs/idea-engine/canonical/CAPTURE_INGESTION_MEMORY_CONTRACT_V1_2.md`
5. `docs/idea-engine/ux/CAPTURE_UX_V5_VALIDATED.md`

Validated reference Blueprint: `Site vitrine`.

Matrix V5 remains authoritative for the current Site-vitrine Idea dossier/information registry and current pre-GO runtime contracts. It is **not** the cross-lifecycle master ontology through `READY_FOR_DEVELOPMENT`; that role belongs to Project Master Blueprint V1.

Core Idea Engine invariants:
- Idea ≠ Project ;
- the pre-GO object is the Idea Decision Dossier ;
- Requirements/readiness drive work, not screen order ;
- exhaustive internal coverage never becomes a giant visible questionnaire ;
- RAW/provenance survives AI interpretation ;
- AI inference is not human truth ;
- human questions are last-mile ;
- accepted unknown is a valid path when allowed ;
- GO is not privileged over revise/deepen/pause/stop ;
- blueprint fit is re-evaluated after material Idea change.

---

## 4. Current runtime contracts and compatibility boundary

Runtime authority/index:

`docs/project-definition/runtime/README.md`

Core validated runtime contracts include:
- `RUNTIME_EXECUTION_MAPPING_V0_1.md`
- `PERSISTENCE_MODEL_V0_1.md`
- `DETERMINISTIC_ENGINE_CONTRACT_V0_1.md`
- `MUTATION_RPC_BOUNDARIES_V0_1.md`
- `RUNTIME_EXECUTION_MAPPING_RED_TEAM_20260913.md`

R1→R7 historical validation packages remain the compatibility baseline for persistence, ingestion, action lifecycle, prefiguration artifacts, Decision Package, Project Definition baseline and Build Ready runtime semantics.

Important: Project Master Blueprint V1 is the **target canonical referential**, but it does not silently rewrite already-persisted runtime IDs, old Gate IDs or validated Site-vitrine machine contracts. Runtime migration must be explicit, mapped, tested and stale-safe.

For the current operational G2 state, executor surface and activation status, use the current file referenced by `README.md`, notably `docs/project-definition/runtime/G2_PRODUCTION_ACTIVATION_STATUS_20260916.md` when applicable.

For canonical G0→G3 and G4/G5 production status, follow the dated runtime files referenced by `README.md` rather than older cutover snapshots.

---

## 5. Site-vitrine machine contracts — compatibility/migration

Existing files remain required while current runtime paths depend on them:

- `docs/project-definition/machine/site-vitrine/BLUEPRINT_SITE_VITRINE_V0_4.yaml`
- `docs/project-definition/machine/site-vitrine/BLUEPRINT_SITE_VITRINE_V0_5_CANDIDATE.yaml`
- `docs/project-definition/machine/REQUIREMENT_ATOM_SCHEMA_V0_2.md`
- existing Site-vitrine requirement/context/gate/deliverable/override files
- existing R0 engines/tests/validators

These artifacts use the previous D01→D22 / G0→G12 structure. They are **compatibility contracts, not the target domain architecture**.

Do not:
- rename persisted old domain/gate IDs in place ;
- infer that Project Master Blueprint V1 automatically activates a new runtime Blueprint ;
- widen production executor capabilities because the documentation model changed ;
- delete old contracts before a migration equivalence/red-team proof exists.

Historical architecture sources retained for migration/reasoning:
- `docs/project-definition/PROJECT_DEFINITION_REFERENCE_ARCHITECTURE_V0_4.md`
- `docs/project-definition/01_DOMAIN_REGISTRY_V0_1.md`
- `docs/project-definition/03_REQUIREMENT_REGISTRY_IDEA_V0_2.md`
- `docs/project-definition/04_PREFIGURATION_DECISION_PACKAGE_REGISTRY_V0_1.md`
- `docs/project-definition/04A_REQUIREMENT_REGISTRY_PROJECT_PRODUCT_V0_1.md`
- `docs/project-definition/04B_REQUIREMENT_REGISTRY_PROJECT_TECH_BUILDREADY_V0_1.md`
- `docs/project-definition/detail/05_MASTER_DETAIL_INDEX_V0_1.md`
- `docs/project-definition/06_CONTEXT_OVERLAY_CATALOG_V0_1.md`
- `docs/project-definition/07_APPROVED_IDEA_TO_PROJECT_PROMOTION_CONTRACT_V0_1.md`
- `docs/project-definition/08_HUMAN_INTERVENTION_MAP_V0_1.md`
- `docs/project-definition/09_CROSS_CUTTING_LEDGER_MODEL_V0_1.md`
- `docs/project-definition/PROGRESSIVE_LOCK_PROMOTION_MODEL_V0_1.md`
- `docs/project-definition/AI_HUMAN_RESOLUTION_POLICY_V0_1.md`

---

## 6. Workspace integration / cutover

Active UX/integration authority:
- `docs/idea-engine/ux/WORKSPACE_PROJECTION_CONTRACT_V1.md`
- `docs/idea-engine/ux/WORKSPACE_INTEGRATION_CUTOVER_PLAN_V1.md`
- `docs/idea-engine/ux/WORKSPACE_PRIVILEGED_ADAPTER_CONTRACT_V0_1.md`

The cutover plan was consolidated on 2026-09-16. Its current status is:
- canonical G0→G5 runtime active ;
- Workspace V3 is the canonical transition surface ;
- legacy direct decision/conversion browser path is disabled ;
- G8→G12 remain compatibility-only ;
- final legacy retirement is blocked by the missing authenticated full-Idea G0→G5 E2E proof.

Validation evidence includes:
- `docs/idea-engine/validation/WORKSPACE_PRIVILEGED_ADAPTER_V0_1_VALIDATION_20260913.md`
- `docs/idea-engine/validation/WORKSPACE_SLICE5_INTERACTIONS_VALIDATION_20260913.md`

Security/runtime invariants:
- JWT user required for privileged Idea Engine commands ;
- strict command/body allowlist ;
- user-scoped authorization before elevation ;
- server-derived idempotency/stale-safety ;
- no client-chosen privileged RPC/function/authority ;
- service secret Worker-only ;
- modern Supabase `sb_secret_...` server keys are `apikey` headers, not Bearer tokens ;
- human/expert authority is not delegated to a generic server adapter.

The canonical workspace read model remains `get_idea_workspace_projection_v1(idea_id)` until explicitly superseded by a validated migration.

Legacy status:
- `ideas-final-decision-v1.js` is no longer bootstrapped ;
- `decide_idea_v1` and `convert_idea_to_project_v1` are not browser-callable ;
- legacy decide/convert UI actions are bridged to Workspace V3 ;
- `ideas-orchestrator-v2.js`, five-step progression and maturity markers remain compatibility UI only until authenticated cutover proof allows physical deletion.

---

## 7. Capture UX

Validated capture authority:

`docs/idea-engine/ux/CAPTURE_UX_V5_VALIDATED.md`

Capture ingestion/memory authority:

`docs/idea-engine/canonical/CAPTURE_INGESTION_MEMORY_CONTRACT_V1_2.md`

Do not regress below:
- raw-first persistence ;
- optional guided help ;
- `Je ne sais pas / plus tard` ;
- visible AI-enriched description remains reversible ;
- original wording/answers remain separately attributable ;
- multi-item Links / Images / Documents ;
- sources survive navigation ;
- no LLM call on every keystroke ;
- no mandatory intermediate “2b2c analyse…” page ;
- CTA enters the first useful workspace state.

---

## 8. Stabilization / current correction boundary

Primary evidence:

`docs/audit/STABILIZATION_AUDIT_20260916.md`

Use it before changing the existing Idea/Project Definition cutover. It records what was actually verified versus what remains open.

Current open blockers before declaring the cutover complete:
- one controlled authenticated Idea must traverse the real canonical lifecycle ;
- stale-state rejection and idempotent retry must be observed on browser-callable canonical boundaries ;
- Workspace V3 desktop/mobile states must be exercised ;
- remaining privileged RPCs must continue to be audited by domain ;
- public invite preview should be considered for e-mail minimization through a coordinated frontend/backend change ;
- physical removal of remaining legacy Ideas orchestration waits for equivalence proof.

During this stabilization phase, prefer correction, consolidation, security, E2E and retirement of contradiction over new product scope.

---

## 9. Release / validation discipline

Before production, use the release chain defined by `README.md` and run:

```bash
npm ci
npm run check
```

`npm run check` must describe the effective source/runtime contracts and now also enforces Project Master Blueprint V1 invariants.

A passing deterministic/unit harness is not proof of an authenticated browser journey. Keep separate:
- source/contract validation ;
- migration validation ;
- endpoint exposure ;
- `/health`/runtime smoke ;
- authenticated E2E ;
- mobile/desktop UX proof.

Do not reintroduce GitHub Actions as the production release mechanism unless explicitly changed and validated.

---

## 10. Knowledge maintenance rule

When a structural invariant changes:

1. update the owning canonical document after validation ;
2. update its machine projection/check when applicable ;
3. preserve superseded sources as history/migration evidence ;
4. update this map only for authority/path/status relationships ;
5. keep dynamic runtime/build status in `README.md`, not duplicated here ;
6. keep GitHub migration filenames/versions aligned with canonical Supabase migration history ;
7. never silently erase reasoning/history or rewrite persisted identities during supersession.

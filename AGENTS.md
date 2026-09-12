# AGENTS.md — 4b4c repository instructions

## Scope

These instructions apply to the entire repository `bayouka/slyzone-motion-scapes-32` unless a more specific `AGENTS.md` exists in a subdirectory.

This repository is the canonical product/runtime source for **4b4c**. The user-facing intelligence/product brand is **2b2c**. Do not confuse 4b4c with the separate project named `myprojects`.

## Read before working

Before any substantial change:

1. Read the root `README.md` for runtime, deployment, backend and production authority.
2. Read `KNOWLEDGE.md` to locate the current source of truth for the domain you are changing.
3. Read the exact canonical document(s) for that domain before modifying behavior.
4. Read any explicitly validated UX snapshot for the surface you are changing.
5. Inspect the current implementation before changing it. Existing production code may contain historical behavior that is no longer the conceptual target.

For any work on **Idea → understanding/enrichment → candidate proposal → decision → optional Project Draft**, read at minimum:

- `docs/idea-engine/canonical/WORKFLOW_V7_1_CONSOLIDATED.md`
- `docs/idea-engine/canonical/INFORMATION_MATRIX_V4_1.md`
- `docs/idea-engine/canonical/CAPTURE_INGESTION_MEMORY_CONTRACT_V1_1.md`

For the initial Idea capture UX, also read:

- `docs/idea-engine/ux/CAPTURE_UX_V5_VALIDATED.md`

The documents above are normative for the target Idea Engine. Do not reconstruct their logic from memory or from old UI behavior.

## Authority and precedence

- Root `README.md` is authoritative for the current production repository, runtime ownership, backend identity and release path.
- `docs/idea-engine/canonical/*` is authoritative for the target Idea Engine product/UX/information model.
- `docs/idea-engine/ux/*_VALIDATED.md` records functionally validated UX surfaces and must be respected unless explicitly reopened.
- Dated audits, prototypes, test reports and walkthroughs are supporting evidence unless explicitly marked canonical/validated.
- Current code describes what production does today; it does **not** automatically override a newer canonical product contract.
- If code and canonical documentation differ, first determine whether the code is historical/technical debt or whether an explicit product decision changed the contract. Do not silently rewrite documentation to match code.

## Core product invariants

1. **An Idea is not yet a Project.** Do not create operational tasks, final technical architecture, execution owners, artificial dates or a delivery roadmap before a real launch decision requires them.
2. **2b2c should do more work than the user.** Before asking a question, check memory, raw brief/description, attached sources, existing answers, researchability and reasonable inference.
3. **The Idea workspace is adaptive, not a fixed wizard.** Internal states may exist, but do not expose a forced `Step 1 → Step 2 → ...` journey.
4. **RAW FIRST.** Persist the Idea, raw description, links and file/source references before depending on any LLM call.
5. **`Commencer avec 2b2c` is not `Sauvegarder`.** Autosave happens before it. The CTA flushes pending writes/uploads, snapshots the capture version, starts analysis and allows navigation to the workspace.
6. **Store first, analyze second.** A local-only upload must not be lost by navigation. Content analysis may finish after navigation.
7. **Keep original input and structured memory.** Never replace the user's original wording with an AI interpretation.
8. **Guided help is optional and adaptive.** Never convert the validated capture into a mandatory form or `quick vs advanced` fork.
9. **AI may enrich the visible description, but must preserve the original and guided human answers separately.** The enriched text is editable and reversible.
10. **Extraction is atomic and multi-domain.** One sentence may populate audience, constraints, features, visual preferences, decision requirements, etc.
11. **Understand intent, negation, modality and time.** `I hate red`, `my old site was red`, `red could work`, and `I want red` are different facts/states.
12. **Prefill does not freeze.** Early information can prepopulate a later domain without becoming a final decision.
13. **Visibility is not existence.** Information may exist in memory long before the corresponding UX surface becomes relevant.
14. **Provenance is mandatory.** Human-declared facts, guided answers, source-extracted observations, web research, system calculations, AI inference and AI recommendations must remain distinguishable.
15. **AI inference never silently becomes human truth.** Ambiguity remains ambiguity until legitimately resolved.
16. **Recommendations must be explainable.** A valid outcome is `insufficient information`; never fabricate confidence or force a recommendation.
17. **Readiness is relative to the decision.** Decision Requirements define what this person/team needs before deciding; do not use arbitrary completion percentages.
18. **Change Intelligence is targeted.** Re-evaluate only affected dependencies after cosmetic/contextual/substantive/critical changes; do not restart the whole journey.
19. **Presentation and workshop are optional.** Solo and team decisions are branches of the same engine.
20. **GO is not privileged.** Deepen, pause and stop are valid successful outcomes.
21. **Project Draft is created only after an explicit launch decision.** Transfer active useful context selectively; rejected/superseded material remains historical.
22. **The LLM is not the sole state engine.** Permissions, persistence, provenance, deterministic dependencies, important mutations and stale-safety require deterministic application/database rules.

## Capture-specific validated rules

Do not regress the initial capture below these V5 requirements:

- user-facing field `Parlez-nous de votre idée` with short placeholder and contextual help;
- optional `M’aider à préciser mon idée` conversation, never a mandatory questionnaire;
- the guided assistant asks only unresolved useful questions;
- `Je ne sais pas / plus tard` is valid;
- 2b2c may synthesize/enrich the visible description from guided answers;
- original text, guided answers and AI synthesis remain separately attributable;
- the user may edit or revert the enriched description;
- attachment families are **Links / Images / Documents**, plural and multi-item;
- source role/context/note is optional and correctable;
- there is no vague `Other file` promise;
- supported formats are allowlisted; exact quotas remain a technical decision until validated;
- after source upload, explain how it may help;
- first post-analysis UX acknowledges what 2b2c already understood before asking anything else.

## Stale-safety and analysis runs

Every AI analysis must target an identifiable source/capture version. If a newer version exists before an older run completes, the older result must never silently overwrite newer active information. Important mutations must be idempotent and stale-safe.

If AI analysis fails, raw data and sources remain intact, the user can keep working, and analysis can be retried. Product continuity must not depend on LLM availability.

## Production and code safety

- Do not perform destructive rewrites of the current runtime without a precise audit and executable validation.
- Preserve the canonical backend and deployment identities stated in root `README.md`.
- Do not develop from the transport mirror as if it were canonical source.
- Do not reintroduce GitHub Actions as the production release mechanism unless the production contract is explicitly changed and validated.
- Before production changes, follow the validation/release chain in `README.md` and the relevant recovery/runtime documents indexed by `KNOWLEDGE.md`.

## Documentation governance

A structural product, UX, AI, data or architecture invariant must not live only in a chat transcript.

When a session discovers or changes such an invariant:

1. identify the canonical document that owns it;
2. update that canonical source rather than duplicating the full rule across files;
3. update `KNOWLEDGE.md` if the knowledge map/version/path/status changes;
4. update this `AGENTS.md` only if agent working rules or authority/precedence change;
5. preserve version/history when the change is material;
6. never silently erase the reasoning source or historical state when supersession is required.

`AGENTS.md` and `KNOWLEDGE.md` are navigation/governance files. They must remain concise and must not become competing copies of the canonical specifications.

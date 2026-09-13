# AGENTS.md — 4b4c repository instructions

## Scope

These instructions apply to the entire repository `bayouka/slyzone-motion-scapes-32` unless a more specific `AGENTS.md` exists in a subdirectory.

This repository is the canonical product/runtime source for **4b4c**. The user-facing intelligence/product brand is **2b2c**. Do not confuse 4b4c with the separate project `myprojects`.

## Read before working

Before any substantial change:

1. read root `README.md` for runtime/deployment/backend authority ;
2. read `KNOWLEDGE.md` ;
3. read `docs/REMOTE_DESKTOP_POLICY.md` for tooling/workflow authority ;
4. for Idea Engine work, read `docs/idea-engine/canonical/IDEA_ENGINE_MASTER_BLUEPRINT_V1.md` **first** ;
5. read the specific canonical contract(s) for the domain ;
6. read validated UX snapshot(s) for the surface ;
7. inspect current implementation before changing it.

For **Idea → understanding/enrichment → candidate proposition → decision → optional Project Draft**, read at minimum:

- `docs/idea-engine/canonical/IDEA_ENGINE_MASTER_BLUEPRINT_V1.md`
- `docs/idea-engine/canonical/INFORMATION_MATRIX_V5_OUTPUT_DRIVEN.md`
- `docs/idea-engine/canonical/WORKFLOW_V7_1_CONSOLIDATED.md`
- `docs/idea-engine/canonical/CAPTURE_INGESTION_MEMORY_CONTRACT_V1_2.md`

For initial capture UX also read:

- `docs/idea-engine/ux/CAPTURE_UX_V5_VALIDATED.md`

Do not reconstruct product logic from memory or old production UI.

## Authority and precedence

- root `README.md` = current production repository/runtime/backend/release authority ;
- `docs/REMOTE_DESKTOP_POLICY.md` = tooling-path authority ;
- `IDEA_ENGINE_MASTER_BLUEPRINT_V1.md` = primary authority for Idea Engine orchestration, Output Contracts, Requirements, Readiness and Next Best Action ;
- `INFORMATION_MATRIX_V5_OUTPUT_DRIVEN.md` = current Site vitrine information registry and internal complete Idea dossier schema ;
- `INFORMATION_MATRIX_V4_1.md` = historical/superseded matrix only ;
- other `docs/idea-engine/canonical/*` = authoritative domain contracts according to their status ;
- `docs/idea-engine/ux/*_VALIDATED.md` = functionally validated UX surfaces unless explicitly reopened ;
- dated audits/prototypes/walkthroughs = supporting evidence unless promoted ;
- current code describes production today but does not automatically override newer canonical product contracts.

If Workflow V7.1 or historical Matrix V4.1 appears to imply a rigid sequence, **Master Blueprint V1 + Matrix V5 prevail**. The historical state chain and B0→B4 levels must not be implemented as a mandatory wizard.

## Core product invariants

1. **Idea ≠ Project.** No operational project machinery before explicit GO unless a decision-specific estimate is required.
2. **The pre-GO canonical object is an Idea Decision Dossier, not a completed questionnaire.**
3. **The engine is driven by Output Contracts + Requirements + independent Readiness + Next Best Action, not screen order.**
4. **2b2c should do more work than the user.** Human questions are a last-mile acquisition path.
5. **System actions and user actions are distinct.** 2b2c may extract, research, calculate, compare or generate autonomously; expose one dominant user action only when the human is actually needed.
6. **Autonomous actions may run in parallel.** Do not serialize internal work to mimic a wizard.
7. **Research, challenge, improvement, comparison and visualization are capabilities, not mandatory stages.**
8. **Readiness is per output/decision.** Never invent one global completion percentage.
9. **RAW FIRST.** Persist raw description, answers and source references before analysis.
10. **Opportunistic pre-analysis is allowed only after persistence.** Never call the LLM on every keystroke.
11. **`Commencer avec 2b2c` is not `Sauvegarder`.** Flush writes/uploads, snapshot the capture, reuse valid pre-analysis, analyze deltas if needed, then enter directly into the first useful workspace state.
12. **Do not create a mandatory `2b2c analyse…` page.** Technical progress may be shown briefly on capture when needed.
13. **If 2b2c just helped write the description, do not immediately repeat it back as an obligatory step.** Detailed understanding stays consultable/correctable.
14. **Keep original input and structured memory.** Never replace human wording with AI interpretation.
15. **Guided help is optional/adaptive.** Never turn validated capture into a mandatory form or quick/advanced fork.
16. **AI may enrich the visible description, but original and guided human answers remain separately attributable and reversible.**
17. **Extraction is atomic/multi-domain.** One sentence may populate many information keys.
18. **Interpret intent, negation, modality, temporal context and subject.**
19. **Prefill ≠ freeze; visibility ≠ existence.**
20. **Provenance is mandatory.** Human, source, web, calculation, inference and recommendation remain distinguishable.
21. **AI inference never silently becomes human truth.**
22. **Requirements are relative to outputs/decisions.** An information item is not globally mandatory.
23. **The information registry is exhaustive internally but selective externally.** Never expose Matrix V5 as a giant questionnaire.
24. **`Je ne sais pas` / accepted unknown are valid paths.**
25. **Recommendations are explainable and may conclude insufficient information, simplify, pause or stop.**
26. **Change Intelligence is targeted.** Recalculate only affected dependencies.
27. **Presentation, workshop and concept projection may be NOT_RELEVANT.**
28. **GO is not privileged.** Deepen, revise, pause and stop are valid successful outcomes.
29. **Project Draft exists only after explicit launch.** Transfer active useful context selectively; rejected/superseded material stays historical.
30. **The LLM is not the sole state engine.** Persistence, provenance, dependency/readiness rules, permissions, stale-safety and important mutations require deterministic system/application/database behavior.

## Capture-specific validated rules

Do not regress below Capture V5 + Contract V1.2:

- `Parlez-nous de votre idée` + short placeholder + contextual `?` ;
- optional `M’aider à préciser mon idée` conversation ;
- only unresolved useful questions ;
- `Je ne sais pas / plus tard` allowed ;
- visible description may be enriched by 2b2c ;
- original text, guided answers and AI synthesis remain separate ;
- edit/revert enriched description ;
- attachment families = **Links / Images / Documents**, plural/multi-item ;
- optional source role/context/note ;
- no vague `Other file` promise ;
- allowlisted supported formats ; exact quotas remain technical until validated ;
- source uploads survive navigation ;
- pre-analysis may begin only after persisted stable input ;
- CTA enters the first useful workspace state without a mandatory analysis screen.

## Stale-safety and analysis runs

Every analysis targets identifiable input/source versions. If a newer version exists before an old run completes, the old result cannot silently overwrite active newer state.

Important mutations are idempotent and stale-safe.

AI failure never destroys raw data or blocks continuity; analysis can retry.

## Production and code safety

- no destructive rewrite without precise audit and executable validation ;
- preserve canonical backend/deployment identities from root `README.md` ;
- canonical working order is GitHub → relevant remote services/connectors → deployment → runtime verification ;
- Remote Desktop Commander is last-resort/local-only tooling, not a dependency; its failure or disconnection must never block normal progress ;
- never use Remote Desktop merely to read/modify canonical GitHub, administer Supabase, trigger the normal Cloudflare release path or work around an available connector ;
- transport mirror is not canonical development source ;
- do not reintroduce GitHub Actions as production release mechanism unless explicitly changed/validated ;
- follow root release/recovery chain before production changes.

## Documentation governance

Structural product/UX/AI/data/architecture invariants must not live only in chat.

When a structural rule changes:

1. identify the owning canonical document ;
2. version/update that source rather than duplicating full rules everywhere ;
3. update `KNOWLEDGE.md` when authority/path/version/status changes ;
4. update `AGENTS.md` only when agent working rules or precedence change ;
5. preserve history/superseded states ;
6. never silently erase reasoning/history when supersession is required.

`AGENTS.md` and `KNOWLEDGE.md` are navigation/governance files, not competing specifications.

# 4b4c / 2b2c — G2 Evidence Adapter Contract V0.1

Date: 2026-09-14
Status: **CANDIDATE — NON ACTIVE**

## 1. Purpose

Define the privileged Worker-side contract for future `evidence.advance` without modifying the active G1 adapter. The adapter is orchestration only: PostgreSQL remains the authority for Requirement state, basis fingerprints, readiness, idempotency and promotion.

## 2. Command boundary

Future command: `evidence.advance`.

Preconditions:

- authenticated user;
- writable Idea;
- active `SITE_VITRINE@0.5` only;
- service-role secret remains Worker-side only;
- planner RPC is `plan_idea_evidence_context_candidate_v9` until candidates are renamed/promoted;
- no G2 command may run against Blueprint 0.4.

The active commands `blueprint_fit.assess` and `foundation.advance` remain unchanged.

## 3. Canonical routing

Planner `acquisition_path` determines the execution boundary.

### Research paths

`WEB`, `AUDIT`, `CONN`:

1. create via `create_action_run_v4`;
2. start via `start_g2_action_run_candidate_v1`;
3. execute provider work without canonical writes;
4. complete via `complete_g2_action_run_candidate_v1` with proposed mutations only;
5. promote via `promote_research_action_result_v3`.

### Non-research system paths

`MEM`, `RAW`, `SRC`, `CALC`, `AI_H`, `AI_R`:

1. create via `create_g2_system_action_run_candidate_v1`;
2. start via `start_g2_action_run_candidate_v1`;
3. execute deterministic/AI work;
4. complete via `complete_g2_action_run_candidate_v1`;
5. promote via `promote_g2_system_action_result_candidate_v1`.

### Human paths

Direct correction/answer:

- `apply_human_g2_information_candidate_v2` only.

Deliberate unknown acceptance:

- `accept_idea_g2_requirement_unknown_candidate_v1` only.

There is no generic G2 human fallback. Human interaction may occur only when the structural `CREATION_OR_REDESIGN` prerequisite is genuinely ambiguous/conflicted or when a future Requirement-specific contract explicitly authorizes it.

## 4. Provider reuse policy

`src/idea-research.js` is **not** a G2 workflow dependency. Only provider-level capabilities may be reused/reimplemented:

- `safeUrl`-equivalent URL validation;
- HTTP source fetch with size/time/content-type limits;
- Tavily search when `TAVILY_API_KEY` is configured;
- Workers AI structured extraction/synthesis.

Forbidden reuse:

- legacy `snapshot()`;
- `idea_items`, `idea_question_answers`, `idea_reviews`, `idea_decisions` as G2 authority;
- direct writes to legacy evidence tables;
- direct Source creation before final promotion.

## 5. WEB execution contract

For a `RESEARCH_WEB` Action Run:

1. derive search objective only from current planner target(s) and persisted current Requirement context;
2. query provider (Tavily when configured);
3. validate/normalize candidate URLs;
4. fetch only safe HTTPS textual sources;
5. extract observations with structured output;
6. build `proposed_mutations` containing run-local Source aliases plus source-backed Information Items;
7. do **not** call `register_idea_source_v1` or `commit_source_ingestion_v1`;
8. call complete; then atomic research promotion creates/reuses Sources and observations in one transaction.

A WEB Information Item must use:

- provenance `WEB_RESEARCH`;
- `SOURCE_BACKED` and/or `OBSERVED` only;
- run-local `source_key`, never a client-provided canonical `source_id`.

## 6. AUDIT / CONN contracts

AUDIT:

- evidence source kinds limited to `url`, `document`, `image`, `system_observation` as accepted by backend;
- provenance `SOURCE_EXTRACTED`;
- source proposal remains staged until promotion.

CONN:

- connector-derived Source must use the canonical connector source kind accepted by promotion;
- provenance `CONNECTOR_EXTRACTED`;
- connector content must be normalized into bounded structured evidence before promotion.

## 7. CALC / AI_H / AI_R semantics

CALC:

- deterministic calculation only;
- provenance `SYSTEM_CALCULATED`;
- resolution level `CALCULATED`.

AI_H:

- hypothesis/inference only;
- provenance `AI_INFERRED`;
- resolution level `WORKING_ASSUMPTION`;
- must never satisfy a Requirement whose accepted levels require source-backed/observed/calculated authority.

AI_R:

- recommendation/synthesis only;
- provenance `AI_RECOMMENDED`;
- resolution level `AI_RECOMMENDATION`.

The backend policy remains authoritative; the adapter must not upgrade levels.

## 8. Stale and idempotency behavior

Every run is bound to:

- Idea revision at creation;
- Action input fingerprint;
- exact target Requirement basis fingerprints;
- planner projection fingerprint.

If create/start/retry/complete/promotion reports stale, the adapter must:

- stop current work immediately;
- reload projection;
- re-plan;
- never reuse proposed mutations from the stale run.

Network retry with the same idempotency key must return/reuse the existing run rather than create duplicate work.

## 9. Cost / loop limits

Initial candidate limits:

- maximum 2 automatic G2 actions per `evidence.advance` request;
- maximum 1 WEB/AUDIT/CONN research action per request;
- Tavily maximum 3 queries per research action;
- maximum 3 results per query before deduplication;
- maximum 8 candidate URLs before ranking/filtering;
- maximum 3 fetched sources promoted per Action Run unless a later contract changes this;
- source fetch timeout <= 9 seconds per URL;
- raw fetched body hard cap before extraction;
- no automatic research loop after `RESEARCH_SUFFICIENCY` becomes satisfied.

These limits are safety/cost guards, not Gate semantics.

## 10. Research stop rule

The adapter never decides research sufficiency itself. It executes one planner action, reloads/recomputes, then obeys the next plan. `SV.D05.RESEARCH_SUFFICIENCY` is the canonical stop authority.

## 11. Security

- service-role key is never sent to browser;
- URL fetch rejects localhost, private/internal hosts and non-HTTPS targets;
- response content types and sizes are bounded;
- proposed mutations are treated as untrusted until backend validation/promotion;
- direct canonical Source UUID injection from WEB proposal is forbidden;
- no cross-Idea Source/Requirement references;
- sensitivity is never downgraded relative to canonical Source sensitivity.

## 12. Error mapping candidate

409-class:

- stale engine/basis/projection;
- Blueprint changed;
- target Requirement no longer active/current.

422-class:

- unsafe/unsupported source URL/content;
- provider result structurally unusable after bounded retries.

429-class:

- AI/provider quota/capacity.

503-class:

- required privileged binding/provider unavailable.

502-class:

- unexpected provider/backend contract failure.

## 13. Activation gate

This contract does not authorize implementation in the active adapter. Activation requires, at minimum:

1. consolidated G2 migration candidate generated and single-transaction rollback PASS;
2. zero-residue verification;
3. real two-session same-Source concurrency proof;
4. Blueprint 0.5 promotion authority;
5. G1 release authority/blockers resolved as required;
6. candidate adapter red-team/QA PASS.

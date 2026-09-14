# 4b4c / 2b2c — G2 Evidence Adapter Contract V0.2

Date: 2026-09-15
Status: **CANDIDATE — NON ACTIVE**

Supersedes `G2_EVIDENCE_ADAPTER_CONTRACT_V0_1.md` for future implementation work.

## 1. Purpose

Define the privileged Worker-side contract for future `evidence.advance` after validation of the resolution-safe G2 planner V0.10.

PostgreSQL remains authoritative for:

- Requirement applicability/state;
- basis fingerprints;
- accepted resolution levels;
- resolving vs supportive path policy;
- dependency readiness;
- idempotency/stale guards;
- promotion;
- Gate readiness and research stop.

The adapter orchestrates only.

## 2. Command boundary

Future command: `evidence.advance`.

Preconditions:

- authenticated user;
- writable Idea;
- active `SITE_VITRINE@0.5` only;
- service-role secret Worker-side only;
- planner RPC: `plan_idea_evidence_context_candidate_v10` while candidate naming remains active;
- no G2 command may run against Blueprint 0.4.

Active G1 commands remain unchanged.

## 3. Planner output authority

Only entries in `eligible_system_actions` may be executed automatically.

Each executable action must carry:

- `path_role=GATE_SATISFYING`;
- `requirement_id`;
- `target_fingerprint`;
- `acquisition_path`;
- `action_type`;
- expected produced resolution levels.

`supportive_capabilities` are **never standalone actions**. They may be consumed internally by the selected resolving executor, but the adapter MUST NOT create an Action Run targeting the final Requirement solely because a supportive capability exists.

Examples:

- `MARKET_CONTEXT`: WEB may collect supporting inputs, but only CALC may resolve the final Requirement;
- `PATTERN_GAP_SYNTHESIS`: AUDIT/AI_H may support, but only AI_R may resolve;
- `RESEARCH_SUFFICIENCY`: AI_H may explain, but only CALC decides sufficiency;
- `EVIDENCE_QUALITY`: AI_H may explain caveats, but only CALC resolves;
- `COMPETITOR_SET`: AI_H cannot create SOURCE_BACKED evidence.

The adapter must additionally reject an executable action if `path_role` is not exactly `GATE_SATISFYING`.

## 4. Loop prevention

A path already promoted on the same Requirement + current basis without resolving the Requirement is exhausted by planner V0.10.

The adapter MUST:

- never override `exhausted_resolution_paths`;
- never retry an exhausted path by generating a new idempotency key;
- never reinterpret `capability_blocked_requirements` as permission to ask a generic human question;
- reload/replan only after a material state/basis change or an explicitly authorized human correction.

## 5. Available-path derivation

`p_available_paths` is server-derived, never browser-controlled.

Initial candidate mapping:

- `CALC`: always available because executor is deterministic/server-local;
- `AI_H`, `AI_R`: available only when Workers AI binding is configured;
- `WEB`: available only when Workers AI and a web-search provider are configured;
- `AUDIT`: available only when Workers AI is configured and backend input checks find an auditable Source;
- `RAW`, `SRC`: available only when Workers AI is configured; backend `idea_g2_path_has_input_v1` remains final authority on input existence;
- `MEM`: available only after a deterministic reuse executor is implemented;
- `CONN`: unavailable until an explicit connector provider contract is implemented.

The adapter may advertise fewer paths than backend supports; it may never advertise a path it cannot execute safely.

## 6. Action input fingerprint

Planner V0.10 exposes target basis + projection fingerprint, not an arbitrary mutable client fingerprint.

The adapter derives the Action Run input fingerprint deterministically from:

- Idea ID;
- current engine revision;
- planner projection fingerprint;
- action type/path;
- target Requirement ID;
- exact target basis fingerprint.

The same data must produce the same input fingerprint on retry. Browser input never participates.

## 7. Canonical routing

### Research resolving paths

`WEB`, `AUDIT`, `CONN`:

1. `create_action_run_v4`;
2. `start_g2_action_run_candidate_v1`;
3. provider work with zero canonical mutations;
4. `complete_g2_action_run_candidate_v1`;
5. `promote_research_action_result_v3`.

### Non-research resolving paths

`RAW`, `SRC`, `CALC`, `AI_H`, `AI_R`, and later `MEM`:

1. `create_g2_system_action_run_candidate_v1`;
2. `start_g2_action_run_candidate_v1`;
3. executor work;
4. `complete_g2_action_run_candidate_v1`;
5. `promote_g2_system_action_result_candidate_v1`.

### Human paths

- direct correction: `apply_human_g2_information_candidate_v2`;
- deliberate unknown: `accept_idea_g2_requirement_unknown_candidate_v1`.

No generic G2 human fallback.

## 8. Resolution semantics

The adapter MUST NOT upgrade or translate evidence into a stronger resolution class.

| Path | Provenance | Produced levels |
|---|---|---|
| RAW | SOURCE_EXTRACTED | RAW_HUMAN / ACCEPTED_AS_CURRENT only when directly supported |
| SRC | SOURCE_EXTRACTED | SOURCE_BACKED / OBSERVED |
| AUDIT | SOURCE_EXTRACTED | OBSERVED / SOURCE_BACKED |
| CONN | CONNECTOR_EXTRACTED | SOURCE_BACKED / OBSERVED |
| WEB | WEB_RESEARCH | SOURCE_BACKED / OBSERVED |
| CALC | SYSTEM_CALCULATED | CALCULATED |
| AI_H | AI_INFERRED | WORKING_ASSUMPTION |
| AI_R | AI_RECOMMENDED | AI_RECOMMENDATION |

Backend policy V3 is final authority on whether these levels satisfy the Requirement.

## 9. WEB execution

For a `RESEARCH_WEB` run:

- derive search objective only from persisted current Requirement context;
- at most 3 provider queries;
- at most 3 results/query;
- at most 8 deduplicated candidate URLs;
- HTTPS only;
- safe-host validation before fetch and again after redirects;
- bounded textual content only;
- at most 3 promoted Sources per run;
- Source proposals stay run-local until atomic promotion;
- Information Items use run-local `source_key`, never arbitrary canonical Source UUID;
- provenance must remain `WEB_RESEARCH`.

Legacy `idea-research.js` tables/workflow are forbidden as G2 authority. Only provider-level techniques may be reused.

## 10. CALC executor

CALC must be deterministic and must not call an LLM to decide the resulting value.

Initial G2 calculations:

- `SV.D04.EVIDENCE_QUALITY`: compute evidence-quality state from canonical source/ref freshness, provenance and conflict signals;
- `SV.D05.MARKET_CONTEXT`: derive the calculated market-context state from already persisted audience/offer/research inputs; supportive WEB/AI_H inputs may feed the calculation but do not themselves close it;
- `SV.D05.RESEARCH_SUFFICIENCY`: compute stop/readiness state from current Requirement states, unresolved critical conflicts and marginal-research policy.

If deterministic inputs are insufficient, CALC must return a non-resolving technical result or no mutation; it must never fabricate a CALCULATED conclusion.

## 11. AI_H / AI_R executors

AI_H:

- bounded hypothesis only;
- never claims observation/source/calculation authority;
- output provenance `AI_INFERRED`;
- resolution level exactly `WORKING_ASSUMPTION`.

AI_R:

- synthesis/recommendation over persisted current inputs;
- output provenance `AI_RECOMMENDED`;
- resolution level exactly `AI_RECOMMENDATION`;
- all source/reference claims must trace to canonical persisted evidence.

## 12. Stale/idempotency behavior

Every run is bound to:

- creation engine revision;
- deterministic Action input fingerprint;
- exact target Requirement basis fingerprint;
- planner projection fingerprint.

On stale at create/start/retry/complete/promotion:

1. stop provider work immediately;
2. discard run-local proposed mutations for execution purposes;
3. reload user-scoped projection;
4. re-plan;
5. never force promotion and never substitute a new target fingerprint.

## 13. Request budget

Initial candidate budget per `evidence.advance` request:

- maximum 2 executable planner actions;
- maximum 1 research action (`WEB/AUDIT/CONN`);
- stop immediately when planner returns no executable action;
- stop immediately when Gate becomes ready;
- stop when remaining blockers are dependency/capability/human-authority blockers;
- never loop on the same Requirement+path+basis.

## 14. Safe response to browser

Browser response may expose:

- Gate status;
- missing Requirement IDs/status/criticality;
- action counts/path labels;
- capability/dependency blockers;
- targeted human action when explicitly authorized;
- fresh workspace projection.

Never expose:

- service-role key;
- raw provider prompts/responses;
- full fetched source bodies;
- internal Source aliases beyond diagnostic-safe labels;
- unrestricted Action Run payloads;
- backend SQL/error details.

## 15. Activation gate

This contract does not authorize active Worker integration.

Activation still requires:

1. G2 V0.4 exact package validation PASS;
2. zero-residue PASS;
3. candidate adapter implementation + red-team/QA PASS;
4. real two-session same-Source concurrency proof;
5. Blueprint 0.5 promotion authority;
6. explicit G2 migration/runtime activation decision.

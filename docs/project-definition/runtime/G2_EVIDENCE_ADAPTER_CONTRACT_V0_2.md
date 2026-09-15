# 4b4c / 2b2c — G2 Evidence Adapter Contract V0.2

Date: 2026-09-15
Status: **CANDIDATE — NON ACTIVE**

Supersedes V0.1 for candidate implementation. Active production adapter remains unchanged.

## Purpose

Define Worker-side orchestration for future `evidence.advance` against validated candidate backend package V0.7. PostgreSQL remains authoritative for Requirement state, applicability, basis fingerprints, resolving/supportive path policy, recovery, idempotency, stale guards, promotion and Gate readiness.

## Command boundary

Future command: `evidence.advance`.

Preconditions: authenticated user; writable Idea; active `SITE_VITRINE@0.5`; service-role secret Worker-only. No G2 command may run against Blueprint 0.4. Active G1 commands remain unchanged.

Planner authority: `plan_idea_evidence_context_candidate_v11`.

## Planner authority

Only `eligible_system_actions` are executable resolving work. `supportive_capabilities` are informative/supporting only and MUST NOT be launched as standalone attempts to resolve the final Requirement. Executable actions must have `path_role=GATE_SATISFYING`.

The adapter never upgrades a supportive path into a resolving path and never overrides exhausted paths or capability blockers.

## Available paths

`p_available_paths` is server-derived, never browser-controlled. Initial candidate mapping:
- CALC: server-local deterministic executor;
- AI_H / AI_R: only with Workers AI binding;
- WEB: only with Workers AI plus configured web-search provider;
- AUDIT: only with executable audit provider/input support;
- RAW / SRC: only with safe executor support; backend input checks remain final authority;
- MEM disabled until a canonical reuse-link mutation exists;
- CONN disabled until an explicit connector provider contract exists.

The adapter may advertise fewer paths than the backend supports; never more.

## Recovery-first rule

Before creating new work, process planner `recoverable_action`:
- `START`: start the existing queued run;
- `RECOVER_EXPIRED`: recover with exact expected attempt and continue only with the returned new attempt;
- `PROMOTE`: promote/finalize the existing succeeded run without repeating executor/provider work.

A recent `running` run is inflight and must not be duplicated. Only after recoverable work is handled may a new Action Run be created.

## Attempt fencing and bounded input

Every executor read and completion uses the exact current Action Run attempt. Inputs come only from `get_g2_action_input_candidate_v2(run_id,input_fingerprint,attempt)`. An old attempt may never read or complete a newer attempt. Browser data never supplies canonical executor context.

## Routing

Research paths `WEB`, `AUDIT`, `CONN` use the research create/promotion boundaries. Non-research resolving paths `RAW`, `SRC`, `CALC`, `AI_H`, `AI_R` use the G2 system create/promotion boundaries. Provider/executor work performs no canonical writes before promotion.

## Resolution semantics

The adapter must not upgrade evidence authority:

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

Backend policy remains final authority on satisfaction.

## Honest NO_RESOLUTION

A correctly executed path may conclude that current inputs cannot support a valid resolving mutation. In that case the executor returns exactly:
- `terminal_outcome=NO_RESOLUTION`;
- zero proposed mutations;
- an allowlisted terminal reason.

After successful completion, call `finalize_g2_action_no_resolution_candidate_v1`; never fabricate an Information Item or Ledger entry. Finalization must not increment Idea revision. The finalized path is exhausted on the same basis; another resolving path may then be selected, or capability exhaustion surfaced.

## CALC

CALC is deterministic and must not use an LLM to decide the resulting value. If deterministic inputs are insufficient, return NO_RESOLUTION rather than fabricate a CALCULATED conclusion.

Initial targets include evidence quality, calculated market-context state and research sufficiency, always from persisted current inputs.

## AI_H / AI_R

AI_H is bounded hypothesis only: `AI_INFERRED` / `WORKING_ASSUMPTION`. AI_R is synthesis/recommendation over persisted current inputs: `AI_RECOMMENDED` / `AI_RECOMMENDATION`. Neither may claim stronger source/calculation authority.

## WEB safety

WEB uses bounded provider queries/results, HTTPS-only safe-host validation before fetch and after redirects, bounded textual content, staged run-local Source aliases and atomic research promotion. Never inject arbitrary canonical Source UUIDs from provider output. Legacy research tables are not G2 authority.

## Stale/idempotency

Every run binds creation revision, deterministic input fingerprint, exact target basis and planner projection. On stale: stop work, discard run-local output for execution purposes, reload/re-plan, never force promotion.

## Request budget

Per `evidence.advance` request: maximum 2 executable actions and maximum 1 research action. Recovery does not bypass cost limits. Stop on Gate-ready, targeted human authority, inflight work, capability/dependency blocker, or budget exhaustion. Never loop on the same Requirement+path+basis.

## Safe browser response

May expose Gate status, Requirement IDs/status/criticality, safe action labels/counts, blockers, targeted authorized human action and refreshed workspace projection. Never expose service secrets, raw provider prompts/responses, full fetched bodies, unrestricted Action Run payloads or SQL/backend internals.

## Activation gate

V0.2 authorizes candidate code only. Backend V0.7 exact package validation is PASS, but production activation still requires candidate adapter/executor QA, authenticated G2 E2E, remaining two-session Source concurrency proof or explicit disposition, and explicit Blueprint 0.5/migration/runtime activation authority.

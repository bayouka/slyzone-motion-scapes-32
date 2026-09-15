# 4b4c / 2b2c — G2 AI_H Executor Contract V0.1

Date: 2026-09-15

Status: **IMPLEMENTATION CANDIDATE — NON ACTIVE**

## 1. Purpose

Define the next bounded non-CALC G2 executor after the production-certified `CALC + RAW` build 549.

`AI_H` exists to form an explicit working hypothesis when a G2 Requirement permits `WORKING_ASSUMPTION` and the persisted dossier contains enough current context, without pretending that the hypothesis is human truth or external evidence.

## 2. Initial scope

The first implementation MUST target only:

- `SV.D03.PRIMARY_NEED`

`SV.D03.OBJECTIONS_TRUST` is policy-compatible with `AI_H` but remains outside V0.1 to keep activation narrow and auditable.

No other Requirement may be promoted by this executor in V0.1.

## 3. Preconditions

The planner may expose `AI_H` only when:

- Idea Blueprint is active `SITE_VITRINE@0.5`;
- G2 policy reports `AI_H` as a gate-satisfying path for the target Requirement;
- target Requirement basis/fingerprint is current;
- the production endpoint explicitly advertises the `AI_H` capability;
- Workers AI binding is available;
- current bounded action input contains enough resolved context to support a useful hypothesis.

Minimum context for `SV.D03.PRIMARY_NEED` should include a current `SV.D03.PRIMARY_AUDIENCE` plus at least one of:

- `SV.D02.DECLARED_PROBLEM`;
- `SV.D02.PRIMARY_OBJECTIVE`;
- `SV.D02.USER_OUTCOME`;
- `SV.D04.OFFER_BASELINE`.

If the basis is insufficient, the executor must terminate with explicit `NO_RESOLUTION / INPUTS_INSUFFICIENT`.

## 4. Input boundary

Input MUST come only from `get_g2_action_input_candidate_v2` for the exact Action Run attempt.

The model may receive only bounded persisted context relevant to the hypothesis:

- Idea id/title/current description only if already present in the bounded RPC output;
- current Requirement states;
- current information items referenced by those states;
- provenance/confidence metadata needed to distinguish fact from assumption;
- no hidden browser state;
- no arbitrary database reads;
- no web fetch;
- no connector fetch;
- no user private data outside the action input boundary.

## 5. Model role

Workers AI is a hypothesis generator, not an authority.

The prompt must require:

- one concise hypothesis only;
- no invented observation, competitor, statistic, source, quote or user statement;
- explicit uncertainty;
- use only the supplied persisted context;
- `null` / no hypothesis when the basis is materially insufficient or contradictory;
- output only through a strict JSON schema.

## 6. Canonical mutation

A successful `SV.D03.PRIMARY_NEED` hypothesis promotes exactly one `INFORMATION_ITEM` with:

- `semantic_key = 'primary_need'`;
- `item_type = 'ASSUMPTION'`;
- `provenance_type = 'AI_INFERRED'`;
- `confidence_class = 'MEDIUM'` by default, or `LOW` if the executor contract later permits it explicitly;
- `sensitivity = 'internal'` unless inherited policy requires a higher class;
- `target_requirement_id = 'SV.D03.PRIMARY_NEED'`;
- `resolution_levels = ['WORKING_ASSUMPTION']`.

The value payload should contain:

- `hypothesis`;
- a short `rationale` grounded in the bounded context;
- `basis_requirement_ids` limited to actually supplied/current Requirements.

It MUST NOT claim `SOURCE_BACKED`, `OBSERVED`, `RAW_HUMAN`, `ACCEPTED_AS_CURRENT`, `CALCULATED` or `AI_RECOMMENDATION`.

## 7. Action Run contract

Use the existing non-research G2 boundary:

- `create_g2_system_action_run_candidate_v1` with `action_type='INFER_HYPOTHESIS'`, `acquisition_path='AI_H'`;
- `start_g2_action_run_candidate_v2`;
- `get_g2_action_input_candidate_v2` with exact attempt fencing;
- `complete_g2_action_run_candidate_v2`;
- `promote_g2_system_action_result_candidate_v1` on a valid mutation;
- `finalize_g2_action_no_resolution_candidate_v1` when the model returns no defensible hypothesis.

All current revision, Requirement fingerprint, stale, retry, recovery and promotion-disposition guards remain mandatory.

## 8. Endpoint capability authority

The internal adapter may contain dormant scaffolding, but production capability authority remains `src/idea-evidence-endpoint.js`.

V0.1 may be activated only by explicitly passing `G2_AI_H: true` from that endpoint and exposing `AI_H` in `/health`.

No ambient environment variable or dormant adapter flag may silently widen production capabilities.

## 9. User-facing semantics

The user surface must never present an `AI_H` result as verified evidence.

Appropriate language is equivalent to:

- working hypothesis;
- inferred from current dossier;
- to verify / refine if material.

The UI must not show internal path code `AI_H` as the primary user label.

## 10. Red-team requirements

The executable harness must reject or terminate without promotion when:

1. target Requirement is not `SV.D03.PRIMARY_NEED`;
2. current audience/context basis is insufficient;
3. model output invents a statistic, quote, competitor or external source;
4. mutation attempts `SOURCE_BACKED`, `OBSERVED`, `CALCULATED`, `RAW_HUMAN`, `ACCEPTED_AS_CURRENT` or `AI_RECOMMENDATION`;
5. mutation provenance is not `AI_INFERRED`;
6. target Requirement fingerprint becomes stale;
7. Action Run attempt becomes stale;
8. model output is invalid or materially contradictory to supplied context;
9. endpoint does not explicitly advertise `AI_H`;
10. browser/service-role separation is weakened.

A positive fixture must prove that a defensible hypothesis promotes only `AI_INFERRED / WORKING_ASSUMPTION` and increments the Idea revision through the normal promotion boundary.

## 11. Activation gate

`AI_H` becomes production-active only after all of the following pass:

- deterministic unit/red-team harness;
- canonical/transport byte alignment for runtime files;
- transport release manifest lists `CALC,RAW,AI_H` exactly;
- `/health` independently reports the same executor scope;
- unauthenticated endpoint remains HTTP 401;
- authenticated fresh-Idea smoke proves the path does not bypass human authority or stale safety.

Until then, production remains **CALC + RAW only**.

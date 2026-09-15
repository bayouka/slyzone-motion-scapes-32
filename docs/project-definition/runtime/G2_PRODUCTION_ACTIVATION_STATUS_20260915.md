# 4b4c / 2b2c — G2 production activation status — 2026-09-15

Status: **BACKEND ACTIVE / BUILD 550 RUNTIME-CERTIFIED / CALC+RAW+AI_H ACTIVE**

## Production backend

Supabase production has G2 backend package V0.7 active for `SITE_VITRINE@0.5` plus the V0.8 promotion-disposition hardening migration.

Verified active functions include:
- `plan_idea_evidence_context_candidate_v11`
- `get_g2_action_input_candidate_v2`
- `finalize_g2_action_no_resolution_candidate_v1`
- `classify_g2_action_promotion_candidate_v1`

The Blueprint resolver assigns `SITE_VITRINE@0.5` to new compatible Site-vitrine Ideas. Existing Ideas are not silently rewritten.

The V0.8 classifier is service-role only. It distinguishes normal promotion, honest `NO_RESOLUTION` finalization, already-finalized work and invalid/non-promotable recovery states without exposing raw Action Run payloads to the browser.

## Build 550 — runtime-certified production baseline

Production runtime: `v4.5.13-workspace-evidence-g2-p4`.
Transport build: **550**.
Adapter: **0.3.2**.
Executor tool: **evidence-adapter-0.3.0**.

Independent production observations on 2026-09-15 confirmed:
- `/health` HTTP 200 ;
- runtime `v4.5.13-workspace-evidence-g2-p4` ;
- Cloudflare version id `8d8b8b78-dee6-4eb5-be06-2be215317fd6` after the byte-aligned transport resync ;
- adapter `0.3.2`, configured, browser service-role exposure false ;
- commands `blueprint_fit.assess`, `foundation.advance`, `evidence.advance` ;
- `SITE_VITRINE@0.5`, G2 backend `v0.7`, promotion disposition `v0.8` ;
- explicit executor scope `g2_executor_paths=['CALC','RAW','AI_H']` ;
- `g2_hypothesis_targets=['SV.D03.PRIMARY_NEED','SV.D03.OBJECTIONS_TRUST']` ;
- `g2_hypothesis_resolution='WORKING_ASSUMPTION'` ;
- product surface `g2_user_surface='evidence-market'` ;
- root shell contains `ideas-workspace-g2-live.js?v=1.1.0` and `boot.js?build=550` ;
- unauthenticated `evidence.advance` returns HTTP 401 with `UNAUTHORIZED`.

This proves Worker/shell/API deployment and the declared executor surface. It does **not** replace the still-required authenticated fresh-Idea G0 → G1 → G2 end-to-end proof.

## RAW executor scope

RAW remains a strict extraction path, not an inference path:
- Workers AI parses persisted human RAW input ;
- supported RAW targets are `SV.D03.PRIMARY_NEED` and `SV.D04.EXISTING_SITE` ;
- promoted provenance is `SOURCE_EXTRACTED` ;
- resolution levels are `RAW_HUMAN` + `ACCEPTED_AS_CURRENT` ;
- every accepted finding requires a support quote actually present in persisted RAW ;
- unsupported or inferred findings end in explicit `NO_RESOLUTION` rather than fabricated evidence.

## AI_H executor scope

AI_H is now operational as a deliberately bounded **working-hypothesis** path.

Its production invariants are:
- resolving targets are limited to `SV.D03.PRIMARY_NEED` and `SV.D03.OBJECTIONS_TRUST` ;
- AI_H consumes only current structured Information Items referenced by current Requirement states ;
- `personal` and `sensitive` Information Items are excluded from the model basis ;
- recursive AI speculation is excluded from the basis: only human/source/connector/web/calculated provenance classes are accepted as hypothesis inputs ;
- the model output must cite one or more Requirement IDs that were actually present in the supplied basis ;
- confidence is capped at `MEDIUM` ;
- promoted provenance is always `AI_INFERRED` ;
- promoted resolution is always `WORKING_ASSUMPTION` ;
- no source-backed, observed, calculated, human-validated or human-decision claim can be produced by AI_H ;
- insufficient or invalid basis terminates as explicit `NO_RESOLUTION`.

Deterministic red-team coverage verifies a positive AI_H promotion, rejection of an invented basis Requirement ID, exclusion of a sensitive Information Item from the model prompt, preservation of RAW provenance rules, and absence of undeclared SRC/AI_R/WEB capability exposure at the endpoint.

## Capability authority

The production endpoint is the authority for executor availability. Build 550 passes only `{ AI, G2_RAW, G2_AI_H }` to the orchestration adapter when Workers AI is bound.

`SRC`, `AI_R`, `WEB`, `AUDIT`, `CONN` and `MEM` remain unavailable through the production endpoint. Dormant internal feature flags or scaffolding are not operational capability and must not be advertised as such.

## Transport integrity

After the initial Build 550 deployment, the transport copy of `idea-evidence-adapter-candidate.js` was re-synced byte-for-byte with canonical GitHub. The canonical and transport blobs now match for the G2 adapter, endpoint, Worker entry, G2 red-team test and shell index used by this release.

## Remaining hardening

Before calling G2 broadly operational:
1. run authenticated G0 → G1 → G2 smoke on a fresh `SITE_VITRINE@0.5` Idea ;
2. exercise real RAW and AI_H actions with an authenticated production Idea and inspect Action Run, provenance and Requirement lineage ;
3. verify desktop/mobile Evidence & Market states including ready, blocked, stale and recoverable outcomes ;
4. implement and test SRC before any source-backed path is advertised ;
5. implement WEB/research through persisted Sources plus atomic research promotion, not direct model claims ;
6. implement AI_R separately from AI_H and preserve `AI_RECOMMENDATION` semantics ;
7. keep stale/fingerprint/attempt-fencing and transport byte-alignment release gates intact.

## Authority note

This status document records the actual activation state reached on 2026-09-15. Older documents describing G2 as non-active, CALC-only, CALC+RAW-only, or Build 547–549 as current production are historical and must not be used to infer the present runtime state.

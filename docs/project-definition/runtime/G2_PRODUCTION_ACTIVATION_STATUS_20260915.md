# 4b4c / 2b2c — G2 production activation status — 2026-09-15

Status: **BACKEND ACTIVE / BUILD 551 RUNTIME-CERTIFIED / CALC+RAW ACTIVE / AI_H CANDIDATE INACTIVE**

## Production backend

Supabase production has G2 backend package V0.7 active for `SITE_VITRINE@0.5` plus the V0.8 promotion-disposition hardening migration.

Verified active functions include:
- `plan_idea_evidence_context_candidate_v11`
- `get_g2_action_input_candidate_v2`
- `finalize_g2_action_no_resolution_candidate_v1`
- `classify_g2_action_promotion_candidate_v1`

The Blueprint resolver assigns `SITE_VITRINE@0.5` to new compatible Site-vitrine Ideas. Existing Ideas are not silently rewritten.

The V0.8 classifier is service-role only. It distinguishes normal promotion, honest `NO_RESOLUTION` finalization, already-finalized work and invalid/non-promotable recovery states without exposing raw Action Run payloads to the browser.

## Build 551 — runtime-certified production baseline

Production runtime: `v4.5.13-workspace-evidence-g2-p5`.
Transport build: **551**.
Adapter: **0.3.3**.
Executor tool: **evidence-adapter-0.3.1**.

Independent production observations on 2026-09-15 confirmed:
- `/health` HTTP 200 ;
- runtime `v4.5.13-workspace-evidence-g2-p5` ;
- Cloudflare version id `4cacaaa5-628d-46e5-b2e4-e4f14a84b695` ;
- adapter `0.3.3`, configured, browser service-role exposure false ;
- commands `blueprint_fit.assess`, `foundation.advance`, `evidence.advance` ;
- `SITE_VITRINE@0.5`, G2 backend `v0.7`, promotion disposition `v0.8` ;
- explicit active executor scope `g2_executor_paths=['CALC','RAW']` ;
- `g2_ai_h_candidate='v0.1'` and `g2_ai_h_active=false` ;
- AI_H candidate target limited to `SV.D03.PRIMARY_NEED` with candidate resolution `WORKING_ASSUMPTION` ;
- product surface `g2_user_surface='evidence-market'` ;
- root shell contains `ideas-workspace-g2-live.js?v=1.1.0` and `boot.js?build=551` ;
- Evidence/Market asset HTTP 200 with **Preuves & marché** copy and asset version `1.1.0` ;
- unauthenticated `evidence.advance` returns HTTP 401 with `UNAUTHORIZED`.

This certifies Worker, shell, asset and unauthenticated API boundaries. It does **not** replace the still-required authenticated fresh-Idea G0 → G1 → G2 end-to-end proof.

## RAW executor scope

RAW remains the only active AI-assisted G2 executor and is a strict extraction path, not an inference path:
- Workers AI parses persisted human RAW input ;
- supported RAW targets are `SV.D03.PRIMARY_NEED` and `SV.D04.EXISTING_SITE` ;
- promoted provenance is `SOURCE_EXTRACTED` ;
- resolution levels are `RAW_HUMAN` + `ACCEPTED_AS_CURRENT` ;
- every accepted finding requires a support quote actually present in persisted RAW ;
- unsupported or inferred findings end in explicit `NO_RESOLUTION` rather than fabricated evidence.

## AI_H candidate scope — intentionally non-active

`G2_AI_H_EXECUTOR_CONTRACT_V0_1.md` is authoritative for the first hypothesis executor candidate.

Its candidate implementation is deliberately narrower than general policy compatibility:
- only `SV.D03.PRIMARY_NEED` is in V0.1 scope ;
- candidate provenance is `AI_INFERRED` ;
- candidate resolution is `WORKING_ASSUMPTION` ;
- current audience plus at least one material supporting context item is required ;
- `personal` and `sensitive` Information Items are excluded from the model basis ;
- recursive AI speculation is excluded from the basis ;
- no source-backed, observed, calculated, human-validated or human-decision claim may be produced by AI_H ;
- insufficient or invalid basis must terminate as explicit `NO_RESOLUTION`.

The implementation candidate remains present behind deterministic/red-team tests, but the production endpoint does **not** pass `G2_AI_H` to the adapter and `/health` explicitly reports `g2_ai_h_active=false`.

Activation remains blocked until the contract's authenticated fresh-Idea E2E gate is proven.

## Build 550 correction

Build 550 was runtime-observed with `CALC + RAW + AI_H`, but subsequent contract audit found that this exceeded `G2_AI_H_EXECUTOR_CONTRACT_V0_1.md`: it exposed two hypothesis targets and activated AI_H before the required authenticated fresh-Idea proof.

Build 551 corrects that mismatch rather than treating deployed code as higher authority than the frozen contract. The endpoint is again the explicit capability authority and exposes only `CALC + RAW` in production.

The first Build 551 transport attempts also exposed two release-gate defects before deployment:
- the transport adapter was initially not byte-aligned with the corrected canonical adapter ;
- the release script still asserted the pre-correction AI_H semantic key.

Both were fixed before the successful p5 deployment. This is exactly the intended fail-closed behavior of the release gate.

## Capability authority

The production endpoint is authoritative for executor availability.

Active through `evidence.advance`:
- `CALC` ;
- `RAW` when Workers AI is bound.

Not active:
- `AI_H` — implementation candidate only ;
- `SRC` ;
- `AI_R` ;
- `WEB` ;
- `AUDIT` ;
- `CONN` ;
- `MEM`.

Dormant internal feature flags or implementation scaffolding are not operational capability and must not be advertised as such.

## Source-backed execution gap

The next executor cannot honestly be called `SOURCE_BACKED` yet.

The current `idea_sources` production table persists source identity, kind, locator, title/note, content hash, version, fetched/freshness timestamps, status and sensitivity, but it does not provide a general persisted source-body contract for arbitrary SRC extraction.

`ideas.original_text` is a special RAW exception; it is not a general source-content store.

Before activating SRC, the architecture must add a bounded, versioned source-content/snapshot persistence contract tied to `idea_sources.id + source_version + content_hash`, with sensitivity, freshness, stale invalidation and service-role-only extraction boundaries. A URL or hash alone must never be treated as source-backed evidence.

## Remaining hardening

Before calling G2 broadly operational:
1. run authenticated G0 → G1 → G2 smoke on a fresh `SITE_VITRINE@0.5` Idea ;
2. exercise a real RAW action with an authenticated production Idea and inspect Action Run, Source, Information Item and Requirement lineage ;
3. verify desktop/mobile Evidence & Market states including ready, blocked, stale and recoverable outcomes ;
4. prove the authenticated AI_H V0.1 candidate end-to-end before any production activation ;
5. design and implement the persisted source-content boundary before advertising SRC ;
6. implement WEB/research only through persisted Sources plus atomic research promotion, not direct model claims ;
7. implement AI_R separately from AI_H and preserve `AI_RECOMMENDATION` semantics ;
8. keep stale/fingerprint/attempt-fencing and transport byte-alignment release gates intact.

## Authority note

This status document records the actual activation state reached on 2026-09-15. Build 551 supersedes Build 550 as the production baseline. Older documents describing G2 as non-active, CALC-only, CALC+RAW-only, or CALC+RAW+AI_H active are historical and must not be used to infer the current runtime state without checking their date/status.

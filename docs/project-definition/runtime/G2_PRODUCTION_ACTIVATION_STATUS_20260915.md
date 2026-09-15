# 4b4c / 2b2c — G2 production activation status — 2026-09-15

Status: **BACKEND ACTIVE / BUILD 549 RUNTIME-CERTIFIED / CALC+RAW ACTIVE**

## Production backend

Supabase production has G2 backend package V0.7 active for `SITE_VITRINE@0.5` plus the V0.8 promotion-disposition hardening migration.

Verified active functions include:
- `plan_idea_evidence_context_candidate_v11`
- `get_g2_action_input_candidate_v2`
- `finalize_g2_action_no_resolution_candidate_v1`
- `classify_g2_action_promotion_candidate_v1`

The Blueprint resolver assigns `SITE_VITRINE@0.5` to new compatible Site-vitrine Ideas. Existing Ideas are not silently rewritten.

The V0.8 classifier is service-role only. It distinguishes normal promotion, honest `NO_RESOLUTION` finalization, already-finalized work and invalid/non-promotable recovery states without exposing raw Action Run payloads to the browser.

## Build 549 — runtime-certified production baseline

Production runtime: `v4.5.13-workspace-evidence-g2-p3`.
Transport build: **549**.
Adapter: **0.3.1**.
Executor tool: **evidence-adapter-0.2.0**.

Independent production observations on 2026-09-15 confirmed:
- `/health` HTTP 200 ;
- runtime version `v4.5.13-workspace-evidence-g2-p3` ;
- Cloudflare version id `b07ed58d-a27a-4f17-b878-70b711245975` ;
- adapter `0.3.1`, configured, browser service-role exposure false ;
- commands `blueprint_fit.assess`, `foundation.advance`, `evidence.advance` ;
- `SITE_VITRINE@0.5`, G2 backend `v0.7`, promotion disposition `v0.8` ;
- explicit executor scope `g2_executor_paths=['CALC','RAW']` ;
- product surface `g2_user_surface='evidence-market'` ;
- root shell contains `ideas-workspace-g2-live.js?v=1.1.0` and `boot.js?build=549` ;
- Evidence/Market asset HTTP 200 with **Preuves & marché** / **Approfondir les preuves** copy ;
- unauthenticated `evidence.advance` returns HTTP 401 with `UNAUTHORIZED`.

This proves Worker/shell/API deployment and the declared executor surface. It does **not** replace the still-required authenticated fresh-Idea G0 → G1 → G2 end-to-end proof.

## RAW executor scope

RAW is now the first non-CALC executor exposed by `evidence.advance`.

Its production contract is intentionally narrow:
- Workers AI acts only as a strict parser of persisted human RAW input ;
- current supported G2 RAW targets are `SV.D03.PRIMARY_NEED` and `SV.D04.EXISTING_SITE` ;
- promoted provenance is `SOURCE_EXTRACTED` ;
- resolution levels are `RAW_HUMAN` + `ACCEPTED_AS_CURRENT` ;
- every accepted finding requires a support quote that is actually present in the persisted RAW text ;
- unsupported, inferred or unsupported-by-quote findings end in explicit `NO_RESOLUTION` rather than fabricated evidence.

The executor adapter contains dormant scaffolding for later paths, but the production endpoint advertises and passes only the explicit capabilities `CALC` and `RAW`. `SRC`, `AI_H`, `AI_R`, `WEB`, `AUDIT`, `CONN` and `MEM` are not operational through the production endpoint.

## Build 549 gate incident and correction

The first Build 549 attempt did not deploy because the deterministic test harness contained an assertion inconsistent with the chosen architecture: it expected dormant adapter feature flags (`G2_SRC`, `G2_AI_H`, `G2_AI_R`, `G2_WEB`) to be ignored even when passed directly to the internal module, while production capability authority actually lives at the endpoint boundary.

The gate was corrected without widening production authority:
- the endpoint remains the capability authority ;
- the endpoint constructs only `{ AI, G2_RAW }` for the adapter ;
- endpoint tests explicitly reject any `G2_SRC`, `G2_AI_H`, `G2_AI_R` or `G2_WEB` exposure ;
- CALC-only behavior still holds when RAW is unavailable ;
- CALC+RAW behavior is tested when Workers AI is available ;
- RAW provenance and verbatim-support rejection are covered by deterministic tests.

The corrected build then deployed and passed independent production smoke.

## Remaining hardening

Before calling G2 broadly operational:
1. run authenticated G0 → G1 → G2 smoke on a fresh `SITE_VITRINE@0.5` Idea ;
2. verify desktop/mobile Evidence & Market states including ready, blocked, stale and recoverable outcomes ;
3. exercise the real RAW executor with an authenticated production Idea and inspect resulting Action Run / provenance lineage ;
4. implement and test SRC/AI/WEB/AUDIT/CONN executors individually before advertising any of them ;
5. preserve atomic research promotion and stale/fingerprint guards ;
6. keep the transport mirror byte-aligned with the canonical runtime used by the certified release.

## Authority note

This status document records the actual activation state reached on 2026-09-15. Older documents describing G2 as wholly non-active, CALC-only, or Build 547/548 as the current baseline are historical and must not be used to infer the present production state.

# 4b4c / 2b2c — G2 production activation status — 2026-09-15

Status: **BACKEND ACTIVE / BUILD 547 RUNTIME-CERTIFIED / BUILD 548 POLISH CANDIDATE**

## Production backend

Supabase production has G2 backend package V0.7 active for `SITE_VITRINE@0.5` plus the V0.8 promotion-disposition hardening migration.

Verified active functions include:
- `plan_idea_evidence_context_candidate_v11`
- `get_g2_action_input_candidate_v2`
- `finalize_g2_action_no_resolution_candidate_v1`
- `classify_g2_action_promotion_candidate_v1`

The Blueprint resolver assigns `SITE_VITRINE@0.5` to new compatible Site-vitrine Ideas. Existing Ideas are not silently rewritten.

The V0.8 classifier is service-role only. It distinguishes normal promotion, honest `NO_RESOLUTION` finalization, already-finalized work and invalid/non-promotable recovery states without exposing raw Action Run payloads to the browser.

## Build 547 — runtime-certified production baseline

Production runtime: `v4.5.13-workspace-evidence-g2-p1`.
Transport build: **547**.

Independent production observations on 2026-09-15 confirmed:
- `/health` HTTP 200 ;
- runtime version `v4.5.13-workspace-evidence-g2-p1` ;
- Cloudflare version id `0686ab22-f8e1-4b4f-b171-6a1032e13dff` ;
- adapter `0.3.0`, configured, browser service-role exposure false ;
- commands `blueprint_fit.assess`, `foundation.advance`, `evidence.advance` ;
- `SITE_VITRINE@0.5`, G2 backend `v0.7`, promotion disposition `v0.8` ;
- root shell contains `ideas-workspace-g2-live.js?v=1.0.0` and `boot.js?build=547` ;
- Evidence/Market asset HTTP 200 ;
- unauthenticated `evidence.advance` returns HTTP 401 with `UNAUTHORIZED`.

This proves Worker/shell/API deployment. It does **not** replace the still-required authenticated fresh-Idea G0 → G1 → G2 E2E.

## Build 548 — production-polish candidate

Prepared runtime: `v4.5.13-workspace-evidence-g2-p2`.
Prepared transport build: **548**.
Workspace asset: `site/assets/ideas-workspace-g2-live.js` version **1.1.0**.

Build 548 removes internal implementation/test language such as `G2 actif` from the user-facing surface. The product-facing section is now **Preuves & marché**, with CTA **Approfondir les preuves**, explicit non-fabrication wording, accessible busy state and user-oriented error messages.

Its `/health` contract additionally exposes:
- `g2_executor_paths: ['CALC']` ;
- `g2_user_surface: 'evidence-market'`.

Build 548 becomes certified only after production independently reports the p2 runtime, build-548 shell, 1.1.0 asset and the same API security boundary.

## Executor boundary

Only deterministic `CALC` acquisition is currently advertised through the active endpoint orchestration.

RAW/SRC/AI_H/AI_R/WEB/AUDIT/CONN are not advertised until their executor contracts and tests are complete. Provider/research scaffolding in the candidate module is not evidence of an operational executor.

This fail-closed restriction prevents the planner from selecting a provider path that would currently terminate as `PROVIDER_RESULT_NOT_USABLE` or create unsupported evidence.

## Remaining hardening

Before calling G2 fully operational:
1. runtime-certify build 548 and promote it over the certified 547 baseline ;
2. run authenticated G0 → G1 → G2 smoke on a fresh `SITE_VITRINE@0.5` Idea ;
3. verify desktop/mobile Evidence & Market states including ready, blocked, stale and recoverable outcomes ;
4. implement and test real non-CALC executors before advertising them ;
5. preserve atomic research promotion and stale/fingerprint guards ;
6. keep transport mirror byte-aligned with canonical runtime files used by the certified build.

## Authority note

This status document records the actual activation state reached on 2026-09-15. Older documents describing G2 as wholly non-active are historically accurate for their earlier state but must not be used to infer the current production backend/runtime status.

# 4b4c / 2b2c — G2 production activation status — 2026-09-15

Status: **BACKEND ACTIVE / BUILD 547 WORKER+UI RELEASE PENDING RUNTIME CERTIFICATION**

## Production backend

Supabase production has G2 backend package V0.7 active for `SITE_VITRINE@0.5` plus the V0.8 promotion-disposition hardening migration.

Verified active functions include:
- `plan_idea_evidence_context_candidate_v11`
- `get_g2_action_input_candidate_v2`
- `finalize_g2_action_no_resolution_candidate_v1`
- `classify_g2_action_promotion_candidate_v1`

The Blueprint resolver assigns `SITE_VITRINE@0.5` to new compatible Site-vitrine Ideas. Existing Ideas are not silently rewritten.

The V0.8 classifier is service-role only. It distinguishes normal promotion, honest `NO_RESOLUTION` finalization, already-finalized work and invalid/non-promotable recovery states without exposing raw Action Run payloads to the browser.

## Worker / UI release candidate

Prepared runtime version: `v4.5.13-workspace-evidence-g2-p1`.
Prepared transport build: **547**.

Prepared adapter surface:
- `blueprint_fit.assess`
- `foundation.advance`
- `evidence.advance`

Prepared Workspace asset: `site/assets/ideas-workspace-g2-live.js`.

The G2 endpoint now settles one bounded recoverable `PROMOTE` run through the V0.8 classifier before resuming normal planning. User-scoped `can_write` is checked before any service-role mutation boundary is used.

The runtime/UI release is not considered production-certified until `/health`, the shell, the endpoint boundary and an authenticated G2 smoke are observed on the deployed Worker.

## Executor boundary

Only deterministic `CALC` acquisition is currently allowed through the active endpoint orchestration.

RAW/SRC/AI_H/AI_R/WEB/AUDIT/CONN are not advertised by the endpoint until their executor contracts and tests are complete. The candidate module still contains provider/research scaffolding, but this scaffolding is not proof of an operational executor.

This fail-closed restriction prevents the planner from selecting a provider path that would currently terminate as `PROVIDER_RESULT_NOT_USABLE`.

## Remaining hardening

Before calling G2 fully operational:
1. deploy and runtime-certify build 547;
2. run authenticated G0 → G1 → G2 smoke on a fresh `SITE_VITRINE@0.5` Idea;
3. implement and test real non-CALC executors before advertising them;
4. preserve atomic research promotion and stale/fingerprint guards;
5. verify transport mirror remains byte-aligned with canonical runtime files used by build 547.

## Authority note

This status document records the actual activation state reached on 2026-09-15. Older documents describing G2 as wholly non-active are historically accurate for their earlier state but must not be used to infer the current production backend status.

# 4b4c / 2b2c — G2 production activation status — 2026-09-15

Status: **BACKEND ACTIVE / WORKER+UI RELEASE PENDING RUNTIME CERTIFICATION**

## Production backend

Supabase production has G2 backend package V0.7 active for `SITE_VITRINE@0.5`.

Verified active functions include:
- `plan_idea_evidence_context_candidate_v11`
- `get_g2_action_input_candidate_v2`
- `finalize_g2_action_no_resolution_candidate_v1`

The Blueprint resolver assigns `SITE_VITRINE@0.5` to new compatible Site-vitrine Ideas. Existing Ideas are not silently rewritten.

## Worker / UI release candidate

Prepared runtime version: `v4.5.13-workspace-evidence-g2`.

Prepared adapter surface:
- `blueprint_fit.assess`
- `foundation.advance`
- `evidence.advance`

Prepared Workspace asset: `site/assets/ideas-workspace-g2-live.js`.

The runtime/UI release is not considered production-certified until `/health`, the shell, the endpoint boundary and an authenticated G2 smoke are observed on the deployed Worker.

## Executor boundary

Only deterministic `CALC` acquisition is currently allowed through the active endpoint orchestration.

RAW/SRC/AI_H/AI_R/WEB/AUDIT/CONN are not advertised by the endpoint until their executor contracts and tests are complete. The candidate module still contains provider/research scaffolding, but this scaffolding is not proof of an operational executor.

This fail-closed restriction prevents the planner from selecting a provider path that would currently terminate as `PROVIDER_RESULT_NOT_USABLE`.

## Remaining hardening

Before calling G2 fully operational:
1. deploy and runtime-certify the Worker/UI release;
2. run authenticated G0 → G1 → G2 smoke on a fresh `SITE_VITRINE@0.5` Idea;
3. add bounded classification for recoverable `PROMOTE` runs;
4. implement and test real non-CALC executors before advertising them;
5. preserve atomic research promotion and stale/fingerprint guards;
6. reconcile transport mirror with canonical source before certification.

## Authority note

This status document records the actual activation state reached on 2026-09-15. Older documents describing G2 as wholly non-active are historically accurate for their earlier state but must not be used to infer the current production backend status.

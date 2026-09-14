# 4b4c / 2b2c — G1 Build 545 Production Smoke — 2026-09-14

Status: **PRODUCTION SMOKE PASS / OBSERVABILITY PASS**

This report supersedes the previous inability to observe build 544. It does **not** claim an authenticated business E2E for `foundation.advance`.

## Release identity

- canonical source repo: `bayouka/slyzone-motion-scapes-32`;
- source SHA declared by release: `f41d42e2827d7faed9a5da024630056c9db3d5c5`;
- Cloudflare transport repo: `bayouka/2b2c`;
- transport final commit: `1044aa6dd4caeb402e24e31f3515da2aeb27246b`;
- build: **545**;
- runtime: `v4.5.12-workspace-foundation-g1-p2`;
- Worker: `4b4c`;
- production URL: `https://4b4c.bayoukadesbois.workers.dev/`.

## Observability correction

The legacy `src/worker.js` health payload still carried the historical adapter `0.1.1` marker even though the imported `idea-engine-adapter.js` had already advanced to `0.2.0` with `foundation.advance`.

Build 545 introduces a thin `worker-entry.js` wrapper rather than rewriting the large legacy Worker. It delegates every non-health request unchanged and enriches `/health` with the current G1 adapter contract.

Wrangler now uses Cloudflare `version_metadata` binding and `worker-entry.js` as the main entrypoint.

## Production evidence

Independent HTTP checks from the canonical Supabase environment returned:

- `/health` HTTP 200: PASS;
- runtime marker `v4.5.12-workspace-foundation-g1-p2`: PASS;
- `idea_engine_adapter_v0_2`: PASS;
- adapter code `0.2.0`: PASS;
- commands include `blueprint_fit.assess` and `foundation.advance`: PASS;
- adapter `configured=true`: PASS;
- `service_role_browser_exposed=false`: PASS;
- Cloudflare version metadata ID present: PASS;
- Cloudflare Worker version ID: `5adfdcf3-317f-475b-ac4c-ff9c4d5bf030`;
- Cloudflare version timestamp: `2026-09-14T11:03:35.630598Z`;
- legacy 0.1.1 health object retained only as `compatibility_marker=true`.

Static/runtime shell checks:

- shell serves Workspace V3 actions `0.3.0`: PASS;
- public JS contains `VERSION='0.3.0'`: PASS;
- public JS contains `foundation.advance`: PASS;
- Foundation form/human-panel CSS markers present: PASS.

All seven independent runtime-marker assertions in the final certification query returned `true`.

## Source / transport parity

The transport `4b4c/src/idea-engine-adapter.js` blob is the same G1 adapter generation as canonical source and declares:

- `COMMANDS = ['blueprint_fit.assess','foundation.advance']`;
- `FOUNDATION_TOOL_VERSION = 'workspace-engine-adapter-0.2.0'`.

The build 545 deploy gate checks those markers before Wrangler deploy and now also checks:

- `worker-entry.js` runtime/adaptor markers;
- Wrangler main entrypoint;
- Cloudflare version metadata binding;
- G1 health contract 0.2.0.

## What is certified

Build 545 is now certified for:

- transport/source release markers;
- Worker deployment visibility;
- correct production health capabilities;
- Cloudflare version identity;
- Workspace Foundation G1 static asset availability;
- frontend/backend contract observability.

## What is not yet certified

A true authenticated E2E still requires a real authorized session and a controlled Idea lifecycle demonstrating, through the public Worker route:

`foundation.advance → plan → Action Run → completion → promotion/reprojection`.

An unauthenticated `401` proves route protection, not business execution. Until that authenticated scenario is run, describe build 545 as **production-smoke certified**, not full Foundation business-E2E certified.

## Conclusion

The former build-544 observability blocker is closed. Build 545 is the current observable G1 production release. Full authenticated Foundation E2E remains a separate release-quality proof.

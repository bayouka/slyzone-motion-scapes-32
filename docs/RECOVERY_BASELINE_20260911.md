# 4b4c — Recovery baseline — 2026-09-11

This document records the verified recovery baseline before further structural product work. It is not a deployment runbook.

## Identity and authority

- Technical product: `4b4c`
- User-facing brand: `2b2c`
- Canonical product/runtime source: `bayouka/slyzone-motion-scapes-32` (`main`)
- Transport mirror only: `bayouka/2b2c/4b4c/`
- Production backend: Supabase `wexfzhegiewhldkugtow` (`4b4c`, eu-west-3)
- Production Worker identity: `4b4c`
- Historical/non-authoritative tracks: `4b4c-pilot` and the root React/Vite/V6 tree in `bayouka/2b2c`

Current certified production runtime: **v4.5.12-delivery-p2 / build 517**.

## Recovery and repository baseline

- Supabase project is `ACTIVE_HEALTHY`.
- `package.json` remains `4.5.12`; runtime patches use explicit release markers rather than lockfile churn.
- The 22 production migrations missing during the 2026-09-09 recovery were restored in version control through `20260909093700_revoke_public_call_heartbeat.sql` without replaying them on production.
- `scripts/migration-history-check.mjs` guards that recovered history.
- Canonical and transport Wrangler configurations target Worker `4b4c`.
- Historical `4b4c-pilot`, root V6 and stale deploy artifacts are not authoritative.

## RLS/access probes

Reversible production-database probes confirmed:

- an authenticated identity outside the workspace sees no 4b4c workspace/project/conversation/message/deliverable data;
- an ordinary Member sees Team projects but not private/direct conversations outside its audience;
- Team projects automatically include eligible internal members;
- Restricted projects exclude unselected members and include explicitly selected ones;
- an ordinary Member may create a Restricted project and becomes its lead;
- probe fixtures were rolled back and left no persistent rows.

## No-GitHub-Actions production path — VERIFIED

GitHub Actions are not part of the 4b4c production chain.

Verified flow:

1. develop and validate in `bayouka/slyzone-motion-scapes-32`;
2. mirror the validated runtime into `bayouka/2b2c/4b4c/`;
3. record runtime/build/source SHA/Worker in `4b4c/TRANSPORT_RELEASE.txt`;
4. Cloudflare Workers Builds attached to `bayouka/2b2c` runs `scripts/deploy-4b4c-direct.sh`;
5. the script removes `WRANGLER_CI_OVERRIDE_NAME` / `WRANGLER_CI_MATCH_TAG` and explicitly runs Wrangler with `wrangler.4b4c.jsonc --name 4b4c`;
6. syntax, manifest, deploy and production smoke failures return non-zero and therefore fail the Cloudflare build.

The historical false-green path caused by unconditional `exit 0` has been removed.

### Latest certified deployment

- Canonical runtime source recorded in transport manifest: `3186c3df8082e28cd63b06f6300d4317aa077e16`.
- Transport deployment commit: `18511d1712f8bb94f5c13ced610d0d35ac099737`.
- Cloudflare build: `3b27b7bc-d7de-461c-bf69-06d16d7b5d10` — **SUCCESS**.
- Cloudflare attached-service Version ID: `76532c72-5ed2-4e4f-ba09-3fdc66b4e407`.

The direct 4b4c script only exits successfully after verifying production contains:

- `/health` → `v4.5.12-delivery-p2`;
- shell → `assets/boot.js?build=517`;
- access-aware project creation module;
- project→Communication V3 route module;
- Communication V3 renderer;
- Resources V2 renderer with first-version creation, immutable version registration and approval RPCs;
- approval route module connecting legacy/global validation entry points to the Resources V2 decision action;
- Delivery workflow with closure preview, `complete_project_v3` and reopen.

## Product P1 effective owners deployed

### Project creation/access

`project-access-v1.js` is mandatory and owns project-creation access semantics:

- Team is recommended/default and includes eligible current/future internal members;
- Restricted exposes explicit participant selection;
- creation calls `create_project_with_access_setup_v1` directly;
- Guests do not receive impossible create/archive management actions.

### Messages

`project-messages-route-v1.js` and mandatory `communication-workspace-v1.js` establish one intended effective renderer:

- project Messages resolves to the project's `kind=project` general conversation;
- global/project Messages both render through Communication V3;
- project deep links preserve context while auth/workspace state loads;
- all three active production projects were verified to have exactly one active general project conversation.

The historical Messages implementation remains physically present in `live.js` pending browser-covered cleanup.

### Resources, deliverables, versions and approvals

`resources-workspace-v2.js` is mandatory and is the intended effective renderer/owner for:

- work resources;
- deliverable creation with first immutable version via `create_deliverable_with_first_version_v1`;
- subsequent immutable versions via `register_deliverable_version_v3`;
- approval requests via `request_deliverable_approval_v1`;
- approval decisions via `decide_deliverable_approval_v1`.

`approval-route-v1.js` intercepts validation entry points from Home, My Work, project overview/external view and any historical approval action, resolves the RLS-visible approval, routes to project Resources and opens the Resources V2 decision action. It is bounded/event-driven and does not use MutationObserver.

`delivery-workflow-v1.js` remains the effective owner for project closure preview, completion, delivery history and reopen.

Historical resource/approval code remains physically present in `live.js` and `workflow-backend-safe-v1.js`; it is now compatibility/safety debt rather than the intended product path. Remove it only after authenticated browser coverage exists.

## Quality-gate correction

The repository quality gate itself contained stale assumptions during recovery:

- `stability-check.mjs` still expected build 512 / `v4.5.12-roadmap-p2`;
- `contract-check.mjs` explicitly required legacy Messages V2 and legacy deliverable/version code to remain present.

These checks were corrected to describe the effective runtime instead. `repo-hygiene-check.mjs`, `stability-check.mjs` and `contract-check.mjs` now guard mandatory Access, Communication, Resources and approval-routing owners rather than preserving obsolete implementations.

## Security classification

Supabase advisors still require follow-up for authenticated `SECURITY DEFINER` API exposure and leaked-password protection. The anonymous `workspace_invite_public_preview(uuid)` endpoint was inspected and currently exposes masked/minimal data to anonymous callers; private details require the intended authenticated identity or a workspace manager.

## Remaining structural debt

- `live.js` remains a large multi-domain monolith.
- dormant legacy Messages/Resources/approval implementations still physically exist behind the new effective owners;
- `workflow-backend-safe-v1.js` still intercepts action, milestone, meeting and historical delivery forms;
- authenticated browser E2E remains incomplete, particularly two-session messaging/invitations/calls and mobile camera behavior;
- CSS still contains historical specificity/`!important` debt;
- remaining `SECURITY DEFINER` functions/grants require least-privilege classification.

## Gate status

Completed:

- [x] recover and guard missing production migration history;
- [x] make source/runtime/transport authority explicit;
- [x] verify baseline RLS isolation and Team/Restricted semantics;
- [x] remove obsolete pilot deployment artifacts;
- [x] repair and certify the direct no-GitHub-Actions Cloudflare path;
- [x] correct project-creation access semantics and Guest CTAs;
- [x] consolidate the intended Messages renderer on Communication V3;
- [x] make Resources V2 the mandatory intended resources/delivery renderer;
- [x] route all active approval-attention entry points into Resources V2;
- [x] align repository quality gates with effective runtime owners;
- [x] certify production `v4.5.12-delivery-p2 / build 517` with public runtime smoke checks.

Still required before destructive cleanup / large UX-DA restructuring:

- [ ] implement executable authenticated browser E2E coverage for access, navigation, actions/roadmap, messaging, delivery and calls;
- [ ] verify critical workflows with two real browser sessions;
- [ ] consolidate action/milestone/meeting event ownership;
- [ ] remove dormant legacy Messages/Resources/approval code only behind corresponding E2E coverage;
- [ ] continue extracting domains from `live.js` incrementally;
- [ ] classify remaining `SECURITY DEFINER` RPCs and obsolete grants/functions;
- [ ] then perform the large IA/UX/DA redesign.

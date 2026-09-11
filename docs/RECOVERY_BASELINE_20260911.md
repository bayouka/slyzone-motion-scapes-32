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

Current certified production runtime: **v4.5.12-work-p1 / build 519**.

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

Additional backend audit for Work confirmed:

- `create_action_v1`, `update_action_v1`, `set_action_status_v1`, `create_milestone_v1` and `update_milestone_v1` are executable by authenticated clients and enforce authorization/validation server-side;
- direct action deletion is protected by `actions_delete` → `app_private.can_manage_action_v1(id)`;
- milestone deletion is protected by `milestones_delete` → `app_private.can_delete_milestone_v1(id)`.

## No-GitHub-Actions production path — VERIFIED

GitHub Actions are not part of the 4b4c production chain.

Verified flow:

1. develop and validate in `bayouka/slyzone-motion-scapes-32`;
2. mirror validated runtime into `bayouka/2b2c/4b4c/`;
3. record runtime/build/source SHA/Worker in `4b4c/TRANSPORT_RELEASE.txt`;
4. Cloudflare Workers Builds attached to `bayouka/2b2c` runs `scripts/deploy-4b4c-direct.sh`;
5. the script removes `WRANGLER_CI_OVERRIDE_NAME` / `WRANGLER_CI_MATCH_TAG` and explicitly deploys with `wrangler.4b4c.jsonc --name 4b4c`;
6. syntax, manifest, boot-order, deployment and production-smoke failures return non-zero and fail the Cloudflare build.

The historical false-green path caused by unconditional `exit 0` has been removed.

### Latest certified deployment

- Canonical runtime source recorded in transport manifest: `56874e2db113ad52be560b5250a8619fe2c12e6f`.
- Transport deployment commit: `68b54f7787696e74c2e24a9411b3a221b3da7b6c`.
- Cloudflare build: `cc71aa2f-55f3-46db-b048-0c1ffb6e2cf7` — **SUCCESS**.
- Cloudflare attached-service Version ID: `f5f2383b-79a5-4deb-815f-8aecdba1c4da`.

The direct script only exits successfully after verifying production contains:

- `/health` → `v4.5.12-work-p1`;
- shell → `assets/boot.js?build=519`;
- access-aware project creation;
- project→Communication V3 routing;
- Communication V3;
- Resources V2;
- approval routing into Resources V2;
- Delivery closure/reopen;
- Meeting V2 owner using `create_meeting_with_attendees_v2`, `update_meeting_v2`, `set_meeting_response_v2`;
- Work owner using action/milestone RPCs, quick status flow and RLS-protected action deletion;
- Meeting and Work owners loaded before the compatibility safe bridge.

## Product P1 effective owners deployed

### Project creation/access

`project-access-v1.js` is mandatory and owns project-creation access semantics:

- Team is recommended/default and includes eligible current/future internal members;
- Restricted exposes explicit participant selection;
- creation calls `create_project_with_access_setup_v1` directly;
- Guests do not receive impossible create/archive management actions.

### Messages

`project-messages-route-v1.js` and mandatory `communication-workspace-v1.js` establish one intended effective renderer for global and project Messages.

The historical Messages implementation remains physically present in `live.js` pending browser-covered cleanup.

### Resources, deliverables, versions and approvals

`resources-workspace-v2.js` is mandatory and owns work resources, deliverable creation, immutable versions, approval requests and approval decisions. `approval-route-v1.js` sends external approval entry points into the same Resources V2 decision flow. `delivery-workflow-v1.js` owns closure preview, completion, delivery history and reopen.

### Meetings

`meeting-workflow-v1.js` is mandatory and is the effective owner for:

- meeting creation via `create_meeting_with_attendees_v2`;
- meeting detail/status updates via `update_meeting_v2`;
- RSVP via `set_meeting_response_v2`.

The server controls manager permissions, attendee eligibility, guest/shared constraints and finalized-state rules. The module contains no direct meeting/attendee writes.

### Actions and Roadmap

`work-workflow-v1.js` is mandatory and is the effective owner for:

- action creation via `create_action_v1`;
- action detail/assignment updates via `update_action_v1`;
- status/block changes via `set_action_status_v1`;
- quick status controls via the same status RPC;
- action deletion through RLS-protected REST delete;
- milestone creation/edit via `create_milestone_v1` / `update_milestone_v1`.

The current `live.js` forms remain the visual UI; the Work owner capture-intercepts their events before historical handlers. `workflow-backend-safe-v1.js` remains compatibility debt, not the intended owner.

## Quality-gate correction

The repository quality gate had stale assumptions during recovery. `stability-check.mjs`, `contract-check.mjs` and `repo-hygiene-check.mjs` now validate the effective Access, Communication, Resources, Approval, Meeting and Work owners instead of requiring superseded implementations to remain active.

## Security classification

Supabase advisors still require follow-up for authenticated `SECURITY DEFINER` API exposure and leaked-password protection. The anonymous `workspace_invite_public_preview(uuid)` endpoint exposes masked/minimal data to anonymous callers; private details require the intended authenticated identity or a workspace manager.

## Remaining structural debt

- `live.js` remains a large multi-domain monolith;
- dormant legacy Messages/Resources/approval/Meeting/Work implementations remain physically present behind effective owners;
- `workflow-backend-safe-v1.js` still contains superseded compatibility handlers and historical delivery/project paths;
- action source linkage is still a post-create RLS-protected update rather than an atomic create-RPC field;
- authenticated browser E2E remains incomplete, particularly two-session invitations/messaging/calls and mobile camera behavior;
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
- [x] make Resources V2 the mandatory resources/delivery renderer;
- [x] route active approval-attention entry points into Resources V2;
- [x] establish Meeting V2 effective ownership for create/edit/RSVP;
- [x] establish Work effective ownership for Actions/Roadmap create/edit/status/delete;
- [x] align repository quality gates with effective runtime owners;
- [x] certify production `v4.5.12-work-p1 / build 519` with public runtime smoke checks.

Still required before destructive cleanup / large UX-DA restructuring:

- [ ] implement executable authenticated browser E2E coverage for access, navigation, actions/roadmap, meetings, messaging, delivery and calls;
- [ ] verify critical workflows with two real browser sessions;
- [ ] consolidate Team/invitation/access frontend ownership;
- [ ] remove dormant legacy code only behind corresponding E2E coverage;
- [ ] continue extracting domains from `live.js` incrementally;
- [ ] classify remaining `SECURITY DEFINER` RPCs and obsolete grants/functions;
- [ ] then perform the large IA/UX/DA redesign.

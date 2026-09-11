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

Current production runtime: **v4.5.12-communication-p2 / build 515**.

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
3. Cloudflare Workers Builds attached to `bayouka/2b2c` runs `scripts/deploy-4b4c-direct.sh`;
4. the script removes `WRANGLER_CI_OVERRIDE_NAME` / `WRANGLER_CI_MATCH_TAG` and explicitly runs Wrangler with `wrangler.4b4c.jsonc --name 4b4c`;
5. the script fails if syntax, release manifest, Worker target, deployment or runtime smoke checks fail.

A durable `4b4c/TRANSPORT_RELEASE.txt` manifest now records runtime, build, canonical source SHA and Worker target. The deploy script verifies the manifest before publishing.

The former script could report success even when direct deployment was skipped because it ended with unconditional `exit 0`; this false-green path has been removed.

### Latest certified deployment

Transport HEAD used for certification: `4b6807d7644e2ec6a275f8ca404ea3ec1652511a`.

Cloudflare build: `a9eee5b5-e4b3-450b-ab4e-da0c68f0f6e3` — **SUCCESS**.

Cloudflare attached-service Version ID: `7cd20358-e9d3-43c7-915a-044244486e8d`.

The direct 4b4c script only exits successfully after verifying all of the following on `https://4b4c.bayoukadesbois.workers.dev`:

- `/health` contains `v4.5.12-communication-p2`;
- `/` contains `assets/boot.js?build=515`;
- `project-access-v1.js` is served and contains the access-aware project workflow;
- `project-messages-route-v1.js` is served and contains project-conversation routing plus auth/workspace readiness handling;
- `communication-workspace-v1.js` is served and contains Communication V3 message handling.

## Product P1 corrections deployed

### Project creation/access

`project-access-v1.js` is mandatory and owns new-project access semantics.

- **Projet d’équipe** is recommended/default and grants current/future internal members access automatically.
- **Projet restreint** exposes explicit internal-member selection.
- It calls `create_project_with_access_setup_v1` directly.
- Guests cannot create projects and project create/archive CTAs are hidden/defensively blocked.

### Project Messages → Communication V3

`project-messages-route-v1.js` is mandatory and converts the historical project Messages route into the project's actual `kind=project` conversation inside the global Communication workspace.

- All three current active projects were checked and each has exactly one active general project conversation.
- Direct project-message links preserve their project context while authentication/workspace state is still loading, then resolve after the session is ready.
- `communication-workspace-v1.js` is now mandatory; the boot chain no longer silently falls back to the native global Messages renderer.
- The old project Messages implementation still physically exists in `live.js`, but it is no longer the intended effective route. Removing that dormant code remains cleanup work behind browser regression coverage.

## Security classification

Supabase advisors still require follow-up for authenticated `SECURITY DEFINER` API exposure and leaked-password protection. The anonymous `workspace_invite_public_preview(uuid)` endpoint was inspected and currently exposes masked/minimal data to anonymous callers; private details require the intended authenticated identity or a workspace manager.

## Remaining structural debt

- `live.js` remains a large multi-domain monolith.
- Some legacy workflow implementations remain physically present behind newer mandatory/effective owners.
- Deliverable/version/approval behavior still partly depends on capture-phase interception in `workflow-backend-safe-v1.js`.
- Browser-level authenticated E2E coverage remains incomplete, especially two-user messaging, invitations, native calls and mobile camera behavior.
- Historical V6 PRs in `bayouka/2b2c` remain backlog/reference only.

## Gate status

Completed:

- [x] recover and guard missing migration history;
- [x] make source/runtime/transport authority explicit;
- [x] verify baseline RLS isolation and Team/Restricted semantics;
- [x] remove obsolete pilot deployment artifacts;
- [x] repair and certify the no-GitHub-Actions direct Cloudflare path;
- [x] fix Team/Restricted project creation semantics;
- [x] remove impossible Guest project management CTAs;
- [x] route project Messages through Communication V3;
- [x] make Communication V3 mandatory;
- [x] certify production runtime `v4.5.12-communication-p2 / build 515` with public runtime smoke checks.

Still required before large UX/DA restructuring:

- [ ] implement executable authenticated browser E2E coverage for access, navigation, roadmap/actions, messaging and native calls;
- [ ] verify critical workflows with two real browser sessions;
- [ ] remove dormant/duplicate project-message implementation from `live.js` once covered;
- [ ] consolidate deliverable/version/approval ownership;
- [ ] continue extracting domain ownership from `live.js` incrementally;
- [ ] classify remaining `SECURITY DEFINER` RPCs and obsolete grants/functions;
- [ ] then perform the large IA/UX/DA redesign.

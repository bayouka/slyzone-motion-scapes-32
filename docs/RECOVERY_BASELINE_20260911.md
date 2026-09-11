# 4b4c — Recovery baseline — 2026-09-11

This document records the verified recovery baseline before further product work. It is not a deployment runbook.

## Identity and authority

- Technical product: `4b4c`
- User-facing brand: `2b2c`
- Canonical product/runtime source: `bayouka/slyzone-motion-scapes-32` (`main`)
- Transport mirror only: `bayouka/2b2c/4b4c/`
- Production backend: Supabase `wexfzhegiewhldkugtow` (`4b4c`, eu-west-3)
- Production Worker identity: `4b4c`
- Historical/non-authoritative tracks: `4b4c-pilot` and the root React/Vite/V6 tree in `bayouka/2b2c`

Current production runtime: **v4.5.12-access-p1 / build 513**.

## Recovery checks performed on 2026-09-11

- Supabase project is `ACTIVE_HEALTHY`.
- `package.json` remains `4.5.12`; runtime patching uses an explicit release marker rather than lockfile churn.
- SPA shell references `boot.js?build=513`.
- Worker `/health` reports `v4.5.12-access-p1`.
- Canonical and transport Wrangler configurations target Worker `4b4c`.
- Repository hygiene checks guard the active boot module list and release markers.
- README/source authority was clarified so historical `4b4c-pilot` and root `2b2c` tracks cannot be mistaken for the product source.

## Backend migration history — recovered

The migration gap identified during the 2026-09-09 recovery audit is closed in the canonical source.

The **22 production migrations after `20260908221655`** were restored as version-controlled SQL files through `20260909093700_revoke_public_call_heartbeat.sql`. Production Supabase migration history was treated as the authority; no migration was replayed or applied to production as part of repository recovery.

`scripts/migration-history-check.mjs` guards the recovered production tail and is part of `npm run check`.

## RLS and access probes — verified without persistent test data

Read-only/RLS impersonation probes were executed against production using explicit test identities.

- An authenticated identity with no workspace membership saw **0 workspaces, 0 projects, 0 conversations, 0 messages and 0 deliverables** from 4b4c.
- The existing ordinary internal Member saw all **3 Team projects** but not the Owner's private/direct conversation.
- `create_project_with_access_setup_v1` was tested inside rolled-back transactions: Team auto-shares to an internal Member; Restricted excludes unless explicitly selected; an ordinary Member can create a Restricted project and becomes its lead.
- All project fixtures were rolled back and no probe rows remained.

## No-GitHub-Actions production path — verified

GitHub Actions are not part of the 4b4c production chain.

The verified path is:

1. develop and validate in `bayouka/slyzone-motion-scapes-32`;
2. mirror only the validated runtime into `bayouka/2b2c/4b4c/`;
3. Cloudflare Workers Builds attached to `bayouka/2b2c` runs `scripts/deploy-4b4c-direct.sh`;
4. that script removes `WRANGLER_CI_OVERRIDE_NAME` / `WRANGLER_CI_MATCH_TAG` from the deployment environment and explicitly runs Wrangler with `wrangler.4b4c.jsonc --name 4b4c`;
5. the script verifies `https://4b4c.bayoukadesbois.workers.dev/health` and fails the Cloudflare build if the expected release marker is absent.

The previous transport script could return success even when deployment was skipped because it ended with unconditional `exit 0`. This was corrected on 2026-09-11. Build `29a7328c-619a-4fb4-a61f-de73effa6815` for transport commit `06a0858ab80c15e7c9d1f7889439cb62aa32e208` completed successfully only after the direct Worker deploy and `/health` verification succeeded.

`4b4c-pilot` must not be used as development source or production target.

## Product P1 access correction — deployed

`project-access-v1.js` is now a mandatory boot module and owns new-project creation semantics.

- **Projet d’équipe** is the recommended/default choice and grants current/future internal members access automatically.
- **Projet restreint** exposes explicit internal-member selection.
- The workflow calls `create_project_with_access_setup_v1` directly.
- Guest users cannot create projects and project-level management CTAs for creation/archive are hidden/defensively blocked.
- The module is mandatory rather than an optional fallback; failure to load cannot silently reactivate the old Team-only creation form.

## Security classification

Supabase advisors currently report one anonymous `SECURITY DEFINER` endpoint (`workspace_invite_public_preview(uuid)`), authenticated `SECURITY DEFINER` RPC warnings, and leaked-password protection disabled.

The anonymous invite preview was inspected: anonymous callers receive masked/minimal information, while private details require the intended authenticated identity or a workspace manager. It is intentional but remains under review.

## Product/runtime debt confirmed

- `live.js` remains a large multi-domain monolith.
- Some legacy workflow implementations remain while newer bridge modules own safer runtime paths.
- Global Messages and project Messages are two active frontend experiences; the backend routes legacy calls through Communication V3, so this is primarily an ownership/UX debt rather than an identified authorization bypass.
- Deliverable/version/approval safety still partly depends on capture-phase interception; simplify only behind tests.
- Historical V6 PRs in `bayouka/2b2c` are research/backlog material only.

## Remaining gate before structural product changes

Completed:

- [x] recover the 22 missing production migration files;
- [x] guard recovered migration history;
- [x] make source/runtime/transport authority explicit;
- [x] correct stale CSS QA assertion;
- [x] verify baseline RLS isolation and Team/Restricted project semantics;
- [x] define runtime ownership consolidation plan;
- [x] define browser E2E regression matrix;
- [x] reconcile transport Worker identity to `4b4c` and remove obsolete pilot deployment artifacts;
- [x] correct project-creation UI so Team/Restricted semantics match the backend;
- [x] remove Guest-only project create/archive CTAs;
- [x] verify the no-GitHub-Actions direct deployment path and production `/health` for `v4.5.12-access-p1`.

Still required:

- [ ] implement executable browser E2E coverage for navigation, invitation/access, roadmap/actions, messaging and native calls;
- [ ] verify critical authenticated flows with at least two browser sessions;
- [ ] unify project/global messaging under one Communication owner;
- [ ] enforce one runtime owner per remaining workflow domain and remove duplicate ownership incrementally;
- [ ] classify remaining SECURITY DEFININER RPCs and remove obsolete grants/functions where appropriate;
- [ ] only then begin large UX/DA restructuring.

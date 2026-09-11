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

Current source release target: **v4.5.12-roadmap-p2 / build 512**.

## Recovery checks performed on 2026-09-11

- Supabase project is `ACTIVE_HEALTHY`.
- `package.json` version is `4.5.12`.
- SPA shell references `boot.js?build=512` and the `v4.5.12-roadmap-p2` legacy CSS release marker.
- Worker `/health` source reports `v4.5.12-roadmap-p2`.
- `wrangler.jsonc` in the canonical source names Worker `4b4c`.
- Repository hygiene check had one stale `4.5.10-project-cards-p1` CSS assertion; corrected to `4.5.12-roadmap-p2`.
- README release/authority information was updated so old `4b4c-pilot` and root `2b2c` tracks cannot be mistaken for current product source.
- Direct production HTTP probing is unavailable from the current execution environment, so live Worker verification still requires a reachable browser/network path before production certification.

## Backend migration history — recovered

The migration gap identified during the 2026-09-09 recovery audit is now closed in the canonical source.

The **22 production migrations after `20260908221655`** have been restored as version-controlled SQL files, through the final production ACL hardening migration `20260909093700_revoke_public_call_heartbeat.sql`. Production Supabase migration history was treated as the authority; no migration was replayed or applied to production as part of this repository recovery.

The recovered tail covers agenda/meeting workflows, native calls/WebRTC, prejoin hardening, multi-party invitations, capacity/RLS fixes, heartbeat, stale-room reuse, unanswered-invite expiry and final heartbeat ACL hardening.

`scripts/migration-history-check.mjs` guards the recovered production tail and is part of `npm run check`.

## RLS and access probes — verified without persistent test data

Read-only/RLS impersonation probes were executed against the production database using explicit test identities.

- An authenticated identity with no workspace membership saw **0 workspaces, 0 projects, 0 conversations, 0 messages and 0 deliverables** from 4b4c.
- The existing ordinary internal Member saw all **3 Team projects** but not the Owner's private/direct conversation.
- `create_project_with_access_setup_v1` was tested inside rolled-back transactions: Team auto-shares to an internal Member; Restricted excludes unless explicitly selected; an ordinary Member can create a Restricted project and becomes its lead.
- All project fixtures were rolled back and no probe rows remained.

## No-GitHub-Actions production path — corrected

GitHub Actions are not part of the 4b4c production chain.

The proven path is:

1. develop and validate in `bayouka/slyzone-motion-scapes-32`;
2. mirror only the validated runtime into `bayouka/2b2c/4b4c/`;
3. use the authenticated Cloudflare Workers Builds environment connected to `bayouka/2b2c` to execute Wrangler explicitly against Worker `4b4c`;
4. verify production `/health` before declaring success.

On 2026-09-11 the transport mirror's stale `wrangler.jsonc` target was corrected from `4b4c-pilot` to `4b4c`. The obsolete `4b4c/deploy-prod.ps1`, which still required the historical pilot branch, and two obsolete direct-deploy trigger artifacts were removed. `4b4c-pilot` must not be used as development source or production target.

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
- [x] reconcile the transport Worker identity to `4b4c` and remove obsolete pilot deployment artifacts.

Still required:

- [ ] correct project-creation UI so Team/Restricted semantics match the backend;
- [ ] remove Guest-only project management CTAs that cannot succeed;
- [ ] implement executable browser E2E coverage for invitation/access, navigation, roadmap/actions, messaging and native calls;
- [ ] enforce one runtime owner per workflow domain and remove duplicate ownership incrementally;
- [ ] verify real production `/health` and critical authenticated flows with at least two accounts;
- [ ] classify remaining SECURITY DEFININER RPCs and remove obsolete grants/functions where appropriate;
- [ ] only then begin large UX/DA restructuring.

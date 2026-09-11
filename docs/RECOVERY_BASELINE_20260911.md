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

The recovered tail covers:

- agenda and meeting workflows;
- native call sessions and WebRTC signalling;
- prejoin hardening;
- workspace and direct calls;
- multi-party call invitations;
- call capacity and RLS fixes;
- invitation lifecycle cleanup;
- presence heartbeat and stale-room reuse;
- unanswered invite expiry;
- final anonymous/public heartbeat privilege revocation.

`scripts/migration-history-check.mjs` now guards the complete 22-file production tail and the final heartbeat ACL. It is part of `npm run check`, preventing the recovered history from silently disappearing again.

## Security classification

Supabase advisors currently report:

- one anonymous `SECURITY DEFINER` endpoint: `workspace_invite_public_preview(uuid)`;
- authenticated `SECURITY DEFINER` RPC warnings for the application API surface;
- leaked-password protection disabled.

The anonymous invite preview was inspected. Its public output intentionally supports the pre-login invitation screen. For anonymous callers it masks the invited email and does not expose project names; full private details are only returned to the intended authenticated email or a workspace manager. Keep it under review, but it is not classified as an accidental public-data leak at this baseline.

Authenticated `SECURITY DEFINER` RPCs must be reviewed by API intent rather than blindly converted to invoker functions, because many are deliberately guarded transaction/workflow endpoints.

## Product/runtime debt confirmed

- `live.js` remains a large multi-domain monolith.
- Some legacy workflow implementations still exist inside `live.js` while newer loaded bridge modules own the safer runtime path.
- Global Messages and project Messages currently use two different active presentation/runtime paths. Legacy message RPCs are server-routed through Communication V3, so this is primarily a product/maintenance ownership problem rather than an identified authorization bypass.
- Deliverable/version/approval safety still partly depends on capture-phase interception by `workflow-backend-safe-v1.js`; this must be simplified behind tests rather than removed abruptly.
- Historical V6 PRs in `bayouka/2b2c` are research/backlog material only; they must not be merged into the current runtime without explicit reconciliation.

## Remaining gate before structural product changes

Completed:

- [x] recover the 22 missing production migration files into the canonical repository;
- [x] add a repository guard for the recovered production migration tail;
- [x] make source/runtime/transport authority explicit;
- [x] correct the stale v4.5.10 CSS QA assertion.

Still required:

- [ ] define and enforce one runtime owner per workflow domain, then remove duplicate ownership incrementally behind contract tests;
- [ ] add browser E2E coverage for invitation/access, navigation, roadmap/actions, messaging and native calls;
- [ ] verify the real production Worker `/health` and critical authenticated flows with at least two user accounts;
- [ ] classify remaining SECURITY DEFINER RPCs by intended API exposure and remove obsolete grants/functions where appropriate;
- [ ] only then begin large UX/DA restructuring.

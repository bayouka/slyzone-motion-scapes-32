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

## Backend history gap

The live Supabase migration history is authoritative while recovery is incomplete.

The canonical source currently has no `20260909*` migration files. Production contains **22 migrations after `20260908221655`** that still need to be recovered into version control without re-applying them to production:

1. `20260908224237_agenda_meeting_workflows_v1`
2. `20260908224452_agenda_meeting_manager_scope_v1`
3. `20260909010327_communication_live_calls_v1`
4. `20260909010513_call_signalling_v1`
5. `20260909011410_call_prejoin_hardening_v1`
6. `20260909012029_temporary_enable_http_for_communication_preview_check`
7. `20260909012709_temporary_disable_http_after_communication_preview_check`
8. `20260909032519_global_quick_calls_v1`
9. `20260909033553_private_direct_calls_v1`
10. `20260909042226_temporary_enable_http_for_cf_probe`
11. `20260909042243_temporary_disable_http_after_cf_probe`
12. `20260909050314_multi_party_call_invites_v1`
13. `20260909053817_add_missing_fk_indexes_4b4c`
14. `20260909053900_align_call_invites_with_room_capacity`
15. `20260909053925_fix_call_invites_rls_scope_and_initplan`
16. `20260909054358_enable_http_for_asset_audit`
17. `20260909054556_clean_call_invite_lifecycle`
18. `20260909055328_align_call_capacity_errors_with_prod_ui`
19. `20260909071845_call_presence_heartbeat_and_room_reuse`
20. `20260909073012_expire_unanswered_call_invites`
21. `20260909092310_revoke_anon_call_heartbeat`
22. `20260909093700_revoke_public_call_heartbeat`

The original SQL is recoverable from `supabase_migrations.schema_migrations.statements`; do not reconstruct these migrations from memory and do not run them again against production merely to repair Git history.

## Security classification

Supabase advisors currently report:

- one anonymous `SECURITY DEFINER` endpoint: `workspace_invite_public_preview(uuid)`;
- authenticated `SECURITY DEFINER` RPC warnings for the application API surface;
- leaked-password protection disabled.

The anonymous invite preview was inspected. Its public output intentionally supports the pre-login invitation screen. For anonymous callers it masks the invited email and does not expose project names; full private details are only returned to the intended authenticated email or a workspace manager. Keep it under review, but it is not classified as an accidental public-data leak at this baseline.

Authenticated `SECURITY DEFINER` RPCs must be reviewed by API intent rather than blindly converted to invoker functions, because many are deliberately guarded transaction/workflow endpoints.

## Product/runtime debt confirmed

- `live.js` remains a large multi-domain monolith.
- Some legacy workflow implementations still exist inside `live.js` while newer loaded bridge modules own the safe runtime path.
- Message, deliverable/version and approval code therefore still has duplicate historical ownership that could regress if event/import order changes.
- Historical V6 PRs in `bayouka/2b2c` are research/backlog material only; they must not be merged into the current runtime without explicit reconciliation.

## Gate before structural product changes

Before large UX/feature work:

1. recover the 22 missing production migration files into the canonical repository;
2. add a repository check that compares the expected production migration tail with version-controlled history;
3. remove duplicate runtime ownership domain by domain behind contract tests;
4. add browser E2E coverage for invitation/access, navigation, roadmap/actions, messaging and native calls;
5. verify the real production Worker `/health` and critical authenticated flows with at least two user accounts;
6. only then begin larger product/DA restructuring.

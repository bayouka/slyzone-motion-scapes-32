# 2b2c — Communication V4 — C1 validation report — 2026-09-16

## Status

**C1 DORMANT BACKEND FOUNDATION — TRANSACTIONALLY VALIDATED, NOT USER-ACTIVE.**

Production Supabase migrations installed:

- `20260916004321 communication_v4_c1_dormant_foundation_v03`
- `20260916005011 communication_v4_c1_exact_read_cursor_v04`

No Communication V4 mutation RPC is executable by `authenticated`, `anon` or `service_role` at this stage. C1 therefore adds server invariants and dormant structure without widening the user-facing capability surface.

## What is installed

- `conversations.parent_conversation_id`
- `conversations.source_message_id`
- unique source-message lineage
- V4 parent/source shape guard
- `conversation_focus_members` with RLS; focus never grants access
- strict Discussion management authority
- dormant Discussion create/focus/follow/resolve/reopen RPCs
- resolved-Discussion guard on legacy `send_message_v3`
- exact `conversation_members.last_read_message_id` cursor
- cursor write guard
- exact `mark_conversation_read_v4` tuple semantics
- author auto-follow only from `mentions -> all`, never from `muted`

## Exact-read finding and correction

The first V0.3 rollback test falsified timestamp-only read semantics: PostgreSQL `now()` is transaction-stable, so two messages may have the same `created_at`. V0.4 therefore defines the V4 total order as:

`created_at ASC, id ASC`

and stores `last_read_message_id` beside legacy `last_read_at`.

V0.4 no longer delegates exact read to V3. Mentions and notification rows are acknowledged only through the exact seen-message tuple.

## Rollback-only transaction proof

The final V0.4 transaction returned:

`COMMUNICATION_V4_C1_V04_TRANSACTIONAL_TESTS_PASS`

The transaction covered:

1. Team Discussion creation under real Team General;
2. two messages with equal transaction timestamps;
3. deterministic UUID tie-break ordering;
4. creator/focus/passive notification-level defaults;
5. initial unread state not pre-consumed by membership creation;
6. direct cursor mutation rejection;
7. exact first-message cursor leaving one later tuple unread;
8. one future mention remaining unread;
9. one future notification remaining unread;
10. cursor advancement and regression rejection;
11. explicit `muted` preserved through focus management;
12. resolved Discussion rejecting legacy `send_message_v3`;
13. reopen restoring send eligibility;
14. non-reader unable to use Follow as an access grant;
15. source-message Discussion lineage and duplicate-source rejection;
16. lineage immutable outside the transaction-local C2 migration flag;
17. C2 migration escape hatch accepted while still shape-validated;
18. hard-delete fixture causing FK cursor cleanup to null without blocking the delete;
19. full rollback.

Post-test verification showed zero persisted V4 lineage fixtures, zero focus fixtures and zero test-named conversations.

## Privilege proof

After V0.4:

- `authenticated` cannot execute `create_discussion_v1`;
- `authenticated` cannot execute `mark_conversation_read_v4`;
- `service_role` cannot execute either RPC;
- `authenticated` may SELECT focus rows only when current Conversation access permits;
- `authenticated` cannot INSERT focus rows directly;
- focus RLS is enabled.

## Boundaries / not yet certified

C1 validation does **not** mean Communication V4 is active.

Still pending:

- C2 legacy backfill + exact cursor seeding;
- C2 V4 read model / `À suivre` semantics;
- future-member notification defaults in Team/Project Discussions;
- browser preview renderer;
- inline mentions/reply attention deduplication;
- Realtime/drafts;
- attachment opening workflow for new Discussions;
- authenticated browser E2E;
- Guest Internal/Shared gate;
- Cloudflare deployment of C0 safety layer.

## Decision

C1 can be treated as the **validated dormant backend baseline** for C2 design. No end-user RPC grant should be added before C2/C3/C4 gates prove the read model, migration and browser workflow.
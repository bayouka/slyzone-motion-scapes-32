# 2b2c — Communication V4 — C1 backend red-team V0.3

## Statut

**POST-MIGRATION TRANSACTIONAL FINDING — read cursor V0.3 insufficient.**

C1 V0.3 compiled and was installed dormant in production. The first rollback-only transaction test found a correctness defect before any V4 user activation.

## Finding — timestamp-only read boundary is not exact

`mark_conversation_read_v4(p_conversation_id,p_seen_message_id)` resolved the seen message to `created_at` and delegated to V3 `last_read_at` semantics.

During the transactional test, two messages created in the same SQL transaction shared the same `created_at` because PostgreSQL `now()` is transaction-stable. A timestamp alone cannot distinguish their order.

This means the V0.3 statement « borné par un message réellement vu » was stronger than the actual persistence model.

## Additional finding — V3 notification cleanup is not cursor-bounded

`mark_conversation_read_v3` bounds mentions by `m.created_at <= v_seen`, but its notification update marks every mention/announcement route for the Conversation, without checking that the notification's message is at or before the seen cursor.

Therefore V4 must not delegate its exact-read semantics to V3.

## Decision — explicit message cursor

C1 hardening must add to `conversation_members`:

`last_read_message_id uuid null`

with server-controlled mutation only.

V4 ordering is explicitly deterministic:

`ORDER BY created_at, id`

The UUID is a tie-breaker, not a claim about physical insertion order. The V4 renderer/read model must use the same total order.

`mark_conversation_read_v4` must:

1. verify the seen message belongs to the Conversation;
2. compare `(created_at,id)` with the existing V4 cursor when one exists;
3. never regress the cursor;
4. persist both `last_read_at` and `last_read_message_id`;
5. mark mentions only through that tuple;
6. mark notifications only when their exact message route belongs to a message at/before that tuple;
7. not call `mark_conversation_read_v3`.

## Direct-write protection

Current `conversation_members` self-update RLS is broad. Adding a cursor column without a guard would allow a browser to write an arbitrary message ID.

C1 hardening therefore needs a trigger that rejects any non-null cursor insert/change unless a transaction-local workflow flag is set by the V4 RPC. The trigger must also verify that the cursor message belongs to the same Conversation.

## Status impact

- C1 schema/other RPCs remain dormant and usable for continued validation.
- `mark_conversation_read_v4` V0.3 is not accepted.
- No frontend uses it and `EXECUTE` remains revoked from all API roles.
- A V0.4 hardening migration is required before C1 can be certified.
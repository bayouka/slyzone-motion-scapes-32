# 4b4c / 2b2c — Communication v2 (DRAFT ONLY)

Base: exact V4.2.2 commit `247f0af0b6e5331259741ab8758abd65283f0453`.

These files are deliberately stored under `supabase/migrations_draft/` and **must not be applied automatically**. They are a review bundle for the new communication architecture before any database change.

## Migration order

1. `001_conversation_model.sql` — conversation shape, project link vs project audience, general topics, read preferences.
2. `002_conversation_security_and_rpcs.sql` — audience security, Direct/Team/Project creation RPCs, membership synchronization.
3. `003_message_formats_and_integrity.sql` — chat vs structured message, announcement flag, soft delete, reply integrity.
4. `004_request_inheritance.sql` — response expected, request response modes, private-source visibility inheritance.
5. `005_context_comments_mentions_attachments.sql` — contextual comments, normalized mentions, lightweight attachments.
6. `006_notification_cutover.sql` — unread != notification, announcement/mention notifications, unread aggregation.

## Product invariants

- `project_id` on a conversation means **project audience**.
- `linked_project_id` means **context only** and never expands a Direct audience.
- `conversation_members` is the canonical readable audience of a conversation.
- Project/Team topics are synchronized with their eligible audience; Directs are never synchronized from a project.
- A message has the audience of its conversation. There is no separate per-message recipient list.
- A Request created from a message inherits the source conversation's confidentiality.
- Public work derived from a private message never exposes the private source to unauthorized users.
- Contextual comments remain on their object and do not create hidden conversations.
- Unread state is based on `last_read_at`; normal messages do not create bell notifications.

## Review gates before applying anything

- Run all SQL files against a disposable clone of the V4.2.2 database.
- Run the RLS/security tests in `supabase/tests_draft/communication_v2/`.
- Review all policies with at least four identities: owner, member Fred, member Marc, member Julie/outsider.
- Confirm old V4.2.2 project creation and existing project conversations still work.
- Confirm no deployed preview is pointed at the disposable database.
- Only after approval, renumber/copy these files into the canonical `supabase/migrations/` directory.

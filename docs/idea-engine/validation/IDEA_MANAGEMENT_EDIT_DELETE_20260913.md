# 4b4c / 2b2c — Idea management: edit & delete

Date: 2026-09-13
Status: **VALIDATED IMPLEMENTATION POLICY**

## Purpose

Ensure an Idea can be corrected or removed without breaking RAW-first provenance, deterministic stale-safety, formal decision history or Idea → Project boundaries.

## Edit contract

- `ideas.original_text` is immutable product provenance: editing an Idea must not overwrite the wording initially supplied by the human.
- `ideas.current_description` is the editable current description and is initialized from `original_text` for new Ideas.
- editable core fields are title, current description, summary, problem/opportunity, audience and current proposal.
- every edit uses optimistic concurrency through `ideas.version`; a stale client receives `STALE_IDEA`.
- a substantive edit to an engine-initialized Idea increments `engine_revision`.
- persisted Requirement-state projections older than the new engine revision become `STALE`.
- queued/running System Actions targeting an older engine revision become stale and may not silently promote their result.
- substantive changes to an Idea already in review/approved state reopen it to `needs_work` rather than silently preserving an obsolete approval.

## Delete contract

Hard deletion is intentionally narrower than editing.

Allowed only when:
- caller is the Idea creator or a workspace owner/admin;
- the exact expected Idea version is current;
- the Idea has not been converted to a Project;
- no Project Definition exists for it;
- no immutable formal snapshot exists for it.

Deletion writes an audit event before the Idea row is removed.

An Idea with protected formal history must not be hard-deleted from normal product UX. The appropriate lifecycle action is **archive/retain history**, to be exposed separately rather than weakening the deletion guard.

## UI contract

- Ideas for which the current user has edit/delete capability expose an action menu from the Ideas list.
- Idea detail exposes `Modifier` and, only when authorized, `Supprimer`.
- editors may edit; hard delete remains creator/workspace-admin authority.
- converted Ideas do not expose destructive management controls.
- deletion always requires explicit confirmation.
- user-facing errors distinguish stale state, forbidden access, converted Idea and protected-history cases.

## Implementation

Backend migrations:
- `supabase/migrations/20260913033026_idea_management_edit_delete_v1.sql`
- `supabase/migrations/20260913033155_idea_current_description_default_v1.sql`

Runtime:
- `site/assets/ideas-management-v1.js`
- `site/assets/ideas-management-v1.css`

RPCs:
- `update_idea_content_v2`
- `delete_idea_v2`

Security:
- no `anon` execute permission;
- authenticated RPCs enforce server-side authority and stale guards;
- direct client table writes remain governed by existing RLS/grants.

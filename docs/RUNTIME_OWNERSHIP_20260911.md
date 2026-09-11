# 4b4c — Runtime ownership map — 2026-09-11

Purpose: remove duplicate frontend ownership without changing product behavior blindly. Every user action must eventually have one clear frontend owner and one authoritative backend workflow.

## Current loaded runtime

Load order in `site/assets/boot.js`:

1. `live.js`
2. `project-access-v1.js`
3. `delivery-workflow-v1.js`
4. `workflow-backend-safe-v1.js`
5. `communication-workspace-v1.js`
6. `resources-workspace-v2.js`
7. `library-workspace-v1.js`

`project-access-v1.js` is mandatory. It owns new-project access semantics and cannot silently fall back to the legacy Team-only form. `live.js` remains the shell/router/state owner but also contains older domain implementations. Several later modules override or intercept those behaviors.

## Ownership matrix

| Domain | Current effective owner | Duplicate/legacy path | Target owner | Refactor condition |
| --- | --- | --- | --- | --- |
| App shell, auth, navigation, shared state | `live.js` | historical UI layers | shell module | route/navigation E2E first |
| Home/personal attention | `live.js` | historical CSS/UI layers | home domain module | preserve personal-attention contract |
| Projects + overview | `live.js` | older project lifecycle helpers | project domain module | project lifecycle contract tests |
| Project creation/access | `project-access-v1.js` | Team-only project form still present but intercepted | project/access domain module | **current owner established** |
| Roadmap/actions | `live.js` + safe capture bridge | native submit handlers in `live.js` | work/roadmap domain module | action/milestone E2E first |
| Global Messages | `communication-workspace-v1.js` | `live.js` global fallback | communication module | global messaging E2E first |
| Project Messages | `live.js` | separate UI from global Communication | communication module in project context | preserve project context and V3 RPC semantics |
| Meetings/agenda | `live.js` + safe bridge | older meeting submit path | meetings domain module | RSVP/manage/call E2E first |
| Native calls | call logic in `live.js` | historical call JS files not loaded | calls domain module | 2-user + multi-party browser tests first |
| Resources | `resources-workspace-v2.js` | native resource view in `live.js` | resources module | upload/link/read E2E first |
| Deliverable versions/approvals | `workflow-backend-safe-v1.js` + resources/delivery modules | direct native handlers in `live.js` | delivery/resources domain modules | immutable-version/approval tests first |
| Project closure/reopen | `delivery-workflow-v1.js` | native lifecycle paths | delivery module | completion/reopen E2E first |
| Global library | `library-workspace-v1.js` | native library fallback | library module | file visibility E2E first |
| Team/invitations/access | `live.js` + server RPCs | historical enhancement files not loaded | team/access domain module | owner/member/guest matrix first |

## Rules for consolidation

1. Do not remove a legacy path until a browser test proves the replacement path in the same context.
2. Do not rely on listener registration order as a long-term authorization or workflow guarantee.
3. Frontend modules may shape UX, but authorization and atomic workflow invariants remain server-side RPC/RLS responsibilities.
4. Legacy RPC wrappers may remain temporarily when they delegate to current RPCs, but new frontend code must call the current API directly.
5. A module load failure must never silently downgrade to a path with weaker workflow semantics.
6. Historical V6 PRs are design/backlog references only, not runtime owners.

## P1 consolidation sequence

### P1.0 — Project creation/access — DONE

`project-access-v1.js` owns project creation and calls `create_project_with_access_setup_v1` directly. Team/Restricted semantics match backend RLS. Guest create/archive CTAs are removed from the effective UI.

### P1.1 — Messages — NEXT

Unify global and project messaging around Communication V3. The project tab should become a contextual projection of the same communication model rather than a separate native chat implementation. Preserve project-scoped routing and audience semantics.

### P1.2 — Deliverables and approvals

Move remaining native upload/version/approval handlers out of `live.js`. Make `resources-workspace-v2.js`, `workflow-backend-safe-v1.js` and `delivery-workflow-v1.js` converge toward explicit single ownership, then remove interception that is no longer needed.

### P1.3 — Meetings and calls

Extract meeting and WebRTC call lifecycle from the monolith only after browser coverage exists for prejoin, incoming invite, accept/decline, join/leave, camera switch, screen share, add participant, reconnect/heartbeat and end-call permissions.

### P1.4 — Team/access

Extract invitation and membership UI while preserving the current contract:

- admin: workspace-wide access;
- member: automatic current/future Team projects + explicit restricted projects;
- guest: explicit shared projects only, no automatic future access;
- workspace role, project visibility and project responsibility stay separate.

## Required browser scenarios before destructive refactor

1. Owner signs in and reaches Home with one H1 and correct navigation.
2. Member signs in and sees only permitted projects/data.
3. Owner changes a member's project access; member visibility updates correctly.
4. Invitation preview/signup/join honors the invited email and assigned projects.
5. Project creation creates project + initial roadmap + intended Team/Restricted participant access atomically.
6. Action create/edit/status/block flow works from List and Roadmap.
7. Project and global messages both send/read through Communication V3 semantics.
8. File upload creates immutable versions and approval targets the exact version.
9. Meeting RSVP/manage permissions match creator/admin/project-lead rules.
10. Two-user native call: prejoin → ring → accept → media → leave/end.
11. Multi-party call: select several people, add participant during call, enforce six-person capacity.
12. Mobile call: front camera default, camera switch, responsive controls, screen-share handling when supported.
13. Route changes reset scroll position and mobile drawer remains keyboard/focus safe.
14. Project completion handles open commitments and exact reference versions; reopen remains coherent.

No destructive structural refactor should be merged until the corresponding scenario is executable and passing.

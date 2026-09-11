# 4b4c — Runtime ownership map — 2026-09-11

Purpose: remove duplicate frontend ownership without changing product behavior blindly. Every user action must eventually have one clear frontend owner and one authoritative backend workflow.

## Current loaded runtime — build 519

Load order in `site/assets/boot.js`:

1. `live.js`
2. `project-access-v1.js`
3. `project-messages-route-v1.js`
4. `delivery-workflow-v1.js`
5. `meeting-workflow-v1.js`
6. `work-workflow-v1.js`
7. `workflow-backend-safe-v1.js`
8. `communication-workspace-v1.js`
9. `resources-workspace-v2.js`
10. `approval-route-v1.js`
11. `library-workspace-v1.js`

Mandatory effective owners now include project access, project-message routing, Delivery, Meetings, Work/Roadmap, Communication V3, Resources V2 and approval routing. `live.js` remains the shell/router/shared-state and UI-rendering owner for several domains, while historical handlers physically remain until authenticated browser coverage permits deletion.

## Ownership matrix

| Domain | Current effective owner | Duplicate/legacy path | Target state | Refactor condition |
| --- | --- | --- | --- | --- |
| App shell, auth, navigation, shared state | `live.js` | historical UI layers | dedicated shell ownership later | route/navigation E2E first |
| Home/personal attention | `live.js` | historical CSS/UI layers | preserve contract, extract later | Home regression coverage |
| Projects + overview | `live.js` | older lifecycle helpers | project domain module | lifecycle coverage |
| Project creation/access | `project-access-v1.js` | Team-only form remains physically in `live.js` | single access owner | effective owner established |
| Actions / Roadmap | `work-workflow-v1.js` over `live.js` forms | old submit/delete/status handlers in `live.js` and safe bridge | Work owner only | effective owner established; physical cleanup after E2E |
| Global Messages | `communication-workspace-v1.js` | native renderer remains physically in `live.js` | Communication V3 only | effective owner established |
| Project Messages | `project-messages-route-v1.js` → `communication-workspace-v1.js` | historical project renderer in `live.js` | same Communication V3 renderer | effective owner established |
| Meetings/agenda | `meeting-workflow-v1.js` over `live.js` forms | historical create/edit/RSVP handlers in `live.js` and safe bridge | Meeting V2 owner only | effective owner established; physical cleanup after E2E |
| Native calls | call logic in `live.js` | historical call JS not loaded | calls domain module | multi-session browser tests first |
| Work resources | `resources-workspace-v2.js` | native resource renderer in `live.js` | Resources V2 only | effective owner established |
| Deliverable creation + versions | `resources-workspace-v2.js` | old forms in `live.js` + compatibility safe bridge | Resources V2 only | effective owner established; physical cleanup later |
| Approval request/decision | `resources-workspace-v2.js` + `approval-route-v1.js` | old modal/actions in `live.js` + safe bridge | Resources V2 only | effective owner established; physical cleanup later |
| Project closure/reopen | `delivery-workflow-v1.js` | older lifecycle paths | Delivery workflow only | effective owner established; cleanup after E2E |
| Global library | `library-workspace-v1.js` | native library fallback | library module | file visibility E2E first |
| Team/invitations/access | `live.js` + server RPCs | historical enhancement files not loaded | team/access domain module | current next consolidation target |

## Ownership rules

1. Do not remove a legacy path until a browser test proves the replacement path in the same context.
2. Listener order may establish temporary compatibility ownership, but authorization never depends on listener order; it remains server-side RPC/RLS.
3. Mandatory domain-module load failures must fail visibly rather than silently downgrade to weaker semantics.
4. Frontend modules shape UX; authorization and atomic workflow invariants remain server responsibilities.
5. Compatibility bridges may remain physically present when superseded, but quality checks must validate the effective owner rather than require the bridge to stay active.
6. Quality checks protect effective ownership/invariants, not obsolete implementation details.
7. Historical V6 PRs are design/backlog references only, not runtime owners.

## P1 consolidation status

### P1.0 — Project creation/access — DONE EFFECTIVELY

`project-access-v1.js` owns project creation and calls `create_project_with_access_setup_v1`. Team/Restricted semantics match backend RLS. Guest create/archive CTAs are removed from the effective UI.

### P1.1 — Messages — DONE EFFECTIVELY

`project-messages-route-v1.js` routes project Messages to the project's `kind=project` conversation; `communication-workspace-v1.js` is mandatory and renders global/project communication consistently.

### P1.2 — Resources / deliverables / versions / approvals — DONE EFFECTIVELY

`resources-workspace-v2.js` owns work resources, deliverable creation, immutable versions and approval request/decision. `approval-route-v1.js` routes outside validation entry points into that same flow. `delivery-workflow-v1.js` owns closure/reopen.

### P1.3 — Meetings — DONE EFFECTIVELY

`meeting-workflow-v1.js` registers before the compatibility bridge and capture-owns:

- `meeting` creation form → `create_meeting_with_attendees_v2`;
- `meeting-detail` form → `update_meeting_v2`;
- `meeting-response` action → `set_meeting_response_v2`.

The server controls meeting manager permissions, attendee/project access, guest/shared constraints and final status transitions. Direct meeting/attendee writes are absent from the effective owner.

### P1.4 — Actions and milestones — DONE EFFECTIVELY

`work-workflow-v1.js` registers before the compatibility bridge and capture-owns:

- action create → `create_action_v1`;
- action details/assignment → `update_action_v1`;
- action status/block and quick status → `set_action_status_v1`;
- action deletion → REST delete protected by `actions_delete` / `can_manage_action_v1` RLS;
- milestone create/edit → `create_milestone_v1` / `update_milestone_v1`.

The visual forms remain in `live.js`. Legacy handlers in `live.js` and `workflow-backend-safe-v1.js` are dormant compatibility debt on the effective path.

### P1.5 — Team/access UI extraction — NEXT

Backend semantics were re-audited and are coherent:

- `create_workspace_invite_v2` requires workspace management permission, validates role/project combinations and requires explicit projects for Guests;
- `accept_workspace_invite` binds acceptance to the authenticated account email, creates/updates workspace membership and synchronizes project/conversation access;
- `set_workspace_member_access_v1` protects Owner immutability, validates Guest/Member/Admin transitions and resynchronizes project conversations;
- Team members receive current/future Team projects through synchronization; Members only need explicit selection for Restricted projects; Guests only receive explicit projects.

The current frontend still asks the manager to reason about role and project selection in one legacy modal and returns a shareable invitation link after creation. Next work should extract this into a dedicated Team/Access owner and make future-project consequences explicit without changing backend semantics.

### P1.6 — Native calls — DEFER DESTRUCTIVE EXTRACTION

Call behavior remains in `live.js`. Do not extract/destructively rewrite until two-session browser coverage exists for prejoin, incoming invite, accept/decline, join/leave, camera switch, screen share, add participant, reconnect/heartbeat and end-call permissions.

## Required browser scenarios before destructive refactor

1. Owner signs in and reaches Home with one H1 and correct navigation.
2. Member signs in and sees only permitted projects/data.
3. Owner changes member project access; member visibility updates correctly.
4. Invitation preview/signup/join honors invited email and assigned access.
5. Project creation atomically creates intended Team/Restricted access and initial roadmap.
6. Action create/edit/status/block/assign/delete flow works from List and Roadmap.
7. Global/project messages send/read through Communication V3 semantics.
8. Resource upload creates immutable versions; approval targets and decides the exact version through Resources V2.
9. Home/My Work/project approval attention opens the same Resources V2 approval flow.
10. Meeting create/edit/RSVP permissions match creator/admin/project-lead rules.
11. Two-user native call: prejoin → ring → accept → media → leave/end.
12. Multi-party call: select several people, add participant during call, enforce capacity.
13. Mobile call: front camera default, camera switch, responsive controls, screen-share handling when supported.
14. Route changes reset scroll position and mobile drawer remains keyboard/focus safe.
15. Project completion handles open commitments and exact reference versions; reopen remains coherent.

No destructive structural refactor should be merged until the corresponding scenario is executable and passing.

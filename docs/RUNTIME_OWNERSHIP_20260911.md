# 4b4c — Runtime ownership map — 2026-09-11

Purpose: remove duplicate frontend ownership without changing product behavior blindly. Every user action must eventually have one clear frontend owner and one authoritative backend workflow.

## Current loaded runtime — build 517

Load order in `site/assets/boot.js`:

1. `live.js`
2. `project-access-v1.js`
3. `project-messages-route-v1.js`
4. `delivery-workflow-v1.js`
5. `workflow-backend-safe-v1.js`
6. `communication-workspace-v1.js`
7. `resources-workspace-v2.js`
8. `approval-route-v1.js`
9. `library-workspace-v1.js`

Mandatory owners currently include project access, project-message routing, Communication V3, Resources V2 and approval routing. `live.js` remains the shell/router/shared-state owner and contains dormant or still-active historical domain implementations.

## Ownership matrix

| Domain | Current effective owner | Duplicate/legacy path | Target state | Refactor condition |
| --- | --- | --- | --- | --- |
| App shell, auth, navigation, shared state | `live.js` | historical UI layers | dedicated shell ownership later | route/navigation E2E first |
| Home/personal attention | `live.js` | historical CSS/UI layers | preserve contract, extract later | Home regression coverage |
| Projects + overview | `live.js` | older lifecycle helpers | project domain module | lifecycle coverage |
| Project creation/access | `project-access-v1.js` | Team-only form remains physically in `live.js` | single access owner | effective owner established |
| Roadmap/actions | `live.js` UI + `workflow-backend-safe-v1.js` form interception | native submit/quick-action code in `live.js` | explicit work/roadmap owner | action/milestone coverage first |
| Global Messages | `communication-workspace-v1.js` | native renderer remains physically in `live.js` | Communication V3 only | effective owner established |
| Project Messages | `project-messages-route-v1.js` → `communication-workspace-v1.js` | historical project renderer in `live.js` | same Communication V3 renderer | effective owner established |
| Meetings/agenda | `live.js` UI + safe bridge for creation | older submit/manage paths | explicit meetings owner | RSVP/manage/call coverage first |
| Native calls | call logic in `live.js` | historical call JS not loaded | calls domain module | multi-session browser tests first |
| Work resources | `resources-workspace-v2.js` | native resource renderer in `live.js` | Resources V2 only | effective owner established |
| Deliverable creation + versions | `resources-workspace-v2.js` | old forms in `live.js` + compatibility safe bridge | Resources V2 only | effective owner established; physical cleanup later |
| Approval request/decision | `resources-workspace-v2.js` + `approval-route-v1.js` | old modal/actions in `live.js` + safe bridge | Resources V2 only | effective owner established; physical cleanup later |
| Project closure/reopen | `delivery-workflow-v1.js` | older lifecycle paths | Delivery workflow only | effective owner established; cleanup after E2E |
| Global library | `library-workspace-v1.js` | native library fallback | library module | file visibility E2E first |
| Team/invitations/access | `live.js` + server RPCs | historical enhancement files not loaded | team/access domain module | owner/member/guest matrix first |

## Ownership rules

1. Do not remove a legacy path until a browser test proves the replacement path in the same context.
2. Do not rely on listener registration order as a long-term authorization guarantee.
3. Frontend modules shape UX; authorization and atomic workflow invariants remain server-side RPC/RLS responsibilities.
4. Compatibility bridges may remain temporarily when they delegate to current RPCs, but they are not considered target owners.
5. Mandatory domain-module load failures must fail visibly rather than silently downgrade to weaker semantics.
6. Quality checks protect effective ownership/invariants, not the continued physical presence of legacy implementations.
7. Historical V6 PRs are design/backlog references only, not runtime owners.

## P1 consolidation status

### P1.0 — Project creation/access — DONE EFFECTIVELY

`project-access-v1.js` owns project creation and calls `create_project_with_access_setup_v1`. Team/Restricted semantics match backend RLS. Guest create/archive CTAs are removed from the effective UI.

### P1.1 — Messages — DONE EFFECTIVELY

`project-messages-route-v1.js` routes project Messages to the project's `kind=project` conversation; `communication-workspace-v1.js` is mandatory and renders global/project communication consistently.

Historical render functions remain in `live.js` only until browser-covered deletion.

### P1.2 — Resources / deliverables / versions / approvals — DONE EFFECTIVELY

`resources-workspace-v2.js` is mandatory and owns:

- work-resource links/files;
- deliverable creation with first version;
- immutable later versions;
- approval requests;
- approval decisions.

`approval-route-v1.js` captures validation entry points elsewhere in the product and opens the matching Resources V2 decision flow. `delivery-workflow-v1.js` owns closure/reopen.

`workflow-backend-safe-v1.js` still contains historical delivery-form safety handlers but is no longer the intended owner of the Resources UI.

### P1.3 — Actions and milestones — NEXT

Current creation/edit forms are rendered by `live.js` while `workflow-backend-safe-v1.js` intercepts several form submissions and calls `create_action_v1`, `update_action_v1`, `set_action_status_v1`, `create_milestone_v1` and `update_milestone_v1`.

Required next work:

- inventory every create/edit/status/block/assign/reorder operation;
- identify whether each effective operation is safe bridge or direct `live.js` code;
- remove ambiguous double ownership without changing current UI;
- preserve conflict/version safeguards and server authorization;
- defer destructive handler removal until executable browser scenarios exist.

### P1.4 — Meetings and calls — AFTER ACTIONS

Meeting creation is partly intercepted by the safe bridge while RSVP/manage/call behavior remains in `live.js`. Extract only after the ownership matrix is explicit and browser coverage exists for attendee permissions, prejoin, invite, accept/decline, camera switching, screen share, add participant, reconnect and end-call permissions.

### P1.5 — Team/access UI extraction — LATER

Preserve:

- admin workspace-wide access;
- member current/future Team access plus explicit Restricted projects;
- guest explicit shared-project access only;
- workspace role, project visibility and project responsibility as separate concepts.

## Required browser scenarios before destructive refactor

1. Owner signs in and reaches Home with one H1 and correct navigation.
2. Member signs in and sees only permitted projects/data.
3. Owner changes member project access; member visibility updates correctly.
4. Invitation preview/signup/join honors invited email and assigned access.
5. Project creation atomically creates intended Team/Restricted access and initial roadmap.
6. Action create/edit/status/block/assign flow works from List and Roadmap.
7. Global/project messages send/read through Communication V3 semantics.
8. Resource upload creates immutable versions; approval targets and decides the exact version through Resources V2.
9. Home/My Work/project approval attention opens the same Resources V2 approval flow.
10. Meeting RSVP/manage permissions match creator/admin/project-lead rules.
11. Two-user native call: prejoin → ring → accept → media → leave/end.
12. Multi-party call: select several people, add participant during call, enforce capacity.
13. Mobile call: front camera default, camera switch, responsive controls, screen-share handling when supported.
14. Route changes reset scroll position and mobile drawer remains keyboard/focus safe.
15. Project completion handles open commitments and exact reference versions; reopen remains coherent.

No destructive structural refactor should be merged until the corresponding scenario is executable and passing.

# 4b4c / 2b2c — Product coherence audit — 2026-09-11

Purpose: audit the current product as it actually exists before adding features or applying a large visual redesign.

## Executive assessment

2b2c already has a substantial collaboration model: personal attention Home, projects, actions/roadmap, requests, decisions, meetings, messaging, resources/livrables, approvals, team access and native calls. The main product risk is **not lack of features**. It is overlapping mental models and duplicate frontend ownership.

The strongest concepts should be preserved: Home answers “what needs me now?”, workspace role/project visibility/project responsibility remain separate, messages have explicit audiences, requests are distinct from messages, deliverables are versioned and approvable, meetings follow Before → Live → After, project closure records actual results, and native calls stay contextual.

Current certified production runtime: **v4.5.12-work-p1 / build 519**.

## P1 findings

### P1.1 — Project creation access model — RESOLVED

Mandatory `project-access-v1.js` exposes the actual access decision:

- **Projet d’équipe** — recommended/default, current and future eligible internal members get access automatically;
- **Projet restreint** — explicit internal-member selection while workspace administration retains the required administrative access.

Creation calls `create_project_with_access_setup_v1` directly. Transactional RLS probes validated the intended backend semantics before deployment.

### P1.2 — Global Messages and Project Messages — EFFECTIVE RUNTIME RESOLVED

Mandatory `project-messages-route-v1.js` resolves the historical project Messages route into the project's `kind=project` general conversation inside mandatory Communication V3.

Global and project messaging therefore use one intended effective renderer. Deep links preserve project context through auth/workspace initialization. The old renderer still physically exists in `live.js`, but it is cleanup debt rather than the intended UX path.

### P1.3 — Resources, deliverables and approvals — EFFECTIVE RUNTIME RESOLVED

`resources-workspace-v2.js` is mandatory and is the intended effective owner for work resources, deliverable creation, immutable version registration, approval requests and approval decisions.

All active validation entry points outside Resources are routed by `approval-route-v1.js` into the same Resources V2 decision flow. `delivery-workflow-v1.js` remains the effective owner for closure preview, `complete_project_v3`, delivery history and reopen.

Historical handlers remain physically present for compatibility/safety until browser coverage allows their deletion.

### P1.4 — Authenticated browser regression gate — PARTIAL

The direct Cloudflare deployment performs executable public runtime smoke checks for Worker release, SPA shell build and all mandatory effective-owner assets. This materially improves release verification but does not replace authenticated multi-user browser E2E.

The connected tooling still does not expose a safe Auth-admin identity lifecycle suitable for production E2E fixtures, so production users are not fabricated through SQL or borrowed from personal credentials.

### P1.5 — Guest project management actions — RESOLVED

External Guests no longer get effective project create/archive management actions. Server authorization remains the final boundary.

### P1.6 — Meetings — EFFECTIVE RUNTIME RESOLVED

`meeting-workflow-v1.js` is mandatory and registers before the compatibility bridge. The existing UI remains in `live.js`, but create/edit/RSVP events are now owned by this dedicated workflow module.

It uses the server APIs:

- `create_meeting_with_attendees_v2` — atomic meeting + attendee creation including agenda;
- `update_meeting_v2` — creator/Admin/project-lead management, attendee validation, status rules and conversation-member sync;
- `set_meeting_response_v2` — controlled RSVP.

The frontend no longer performs direct meeting or meeting-attendee writes on the effective path.

### P1.7 — Actions and Roadmap — EFFECTIVE RUNTIME RESOLVED

`work-workflow-v1.js` is mandatory and registers before `workflow-backend-safe-v1.js`. It owns the current action/roadmap events while preserving the existing forms and layouts in `live.js`.

Effective operations are now:

- action create → `create_action_v1`;
- action details/assignment → `update_action_v1`;
- action status/block → `set_action_status_v1`;
- quick status controls → `set_action_status_v1`;
- action delete → direct REST delete protected by `actions_delete` / `can_manage_action_v1` RLS;
- milestone create/edit → `create_milestone_v1` / `update_milestone_v1`.

The backend audit confirmed authenticated execution rights and server-side validation for these workflows. No schema migration was required.

One residual detail remains: source linkage for an action created from a meeting/legacy context is attached in a second RLS-protected update after `create_action_v1`; this could later become atomic in a future RPC revision but is not a blocker for current ownership.

## P2 findings

### P2.1 — “Calendrier” currently means meetings at workspace level

Global Calendar is effectively shared meeting time, while action deadlines live under My Work and project Work/Calendar.

**Direction:** evolve toward an Agenda model with optional layers for meetings, personal due dates and project milestones/targets without creating a duplicate task manager.

### P2.2 — Project management does not expose access scope

Lifecycle management handles pause/completion/reopen/archive/delete but not Team/Restricted access.

**Direction:** add a separate Access & participants entry with explicit impact preview before any scope change.

### P2.3 — Team / invitation mental model needs product clarification

Backend semantics are already coherent:

- Admin = workspace-wide;
- Member = current/future Team projects + explicitly selected Restricted projects;
- Guest = only explicitly selected projects;
- invitations are email-bound and acceptance rejects an account whose email does not match;
- invitation acceptance creates workspace membership and synchronizes project/conversation membership.

The current UI, however, still requires the owner to understand role + project scope at once and generates a shareable invite link after creating the invitation. This is functionally valid but should be redesigned so the user understands what happens now and for future projects before sending the invite.

### P2.4 — Controlled vocabulary

- `Membre` = internal workspace member;
- `Invité externe` = explicit project/shared-content access;
- `Participant projet` = explicit participant in a restricted project/project-team context;
- `Responsable` = accountable person for action/jalon/project lead role;
- `Ressource de travail` ≠ `Livrable`;
- `Message` ≠ `Demande` ≠ `Décision`;
- `Réunion` = synchronous event; `Appel` = communication session.

Avoid using “participant” as a synonym for “can access”.

## Quality-system status

Repository checks now describe effective runtime owners rather than preserving obsolete implementation details. `stability-check.mjs`, `contract-check.mjs` and `repo-hygiene-check.mjs` guard Access, Communication, Resources, Approval routing, Meeting and Work ownership and their boot order.

## Current strengths to preserve

### Home

Prioritizes personal attention, changes since last visit, upcoming time commitments and the project to resume.

### Team/access

Owner/Admin have workspace-wide access; Member gets current/future Team projects plus explicit Restricted projects; Guest gets explicit projects only, never automatic future project access.

### Work / Roadmap

Actions retain explicit responsibility, phase, priority, deadline, visibility and blocked reason; roadmap phases remain outcome-oriented rather than a second task list.

### Resources/delivery

Working resources are separated from official deliverables; deliverable versions are immutable, approvals target exact versions and closure history preserves what was delivered.

### Meetings

Before → Live → After remains a strong mental model linking agenda, live notes, summary, actions and decisions.

### Calls

Current call model covers prejoin, explicit invitees, multi-party capacity, screen sharing, front-camera preference/mobile switching, reconnect/heartbeat, add-person-during-call and project/meeting context.

## Recommended execution order

1. Consolidate Team/invitation/access frontend ownership and clarify its product model.
2. Prepare authenticated browser regression coverage without weakening Auth or using personal credentials.
3. Remove dormant legacy handlers only after their corresponding E2E scenarios are executable.
4. Extract remaining domains from `live.js` incrementally, without big-bang rewrite.
5. Classify remaining Supabase `SECURITY DEFINER` functions/grants by intended API contract and least privilege.
6. Review information architecture and DA.
7. Only after that add genuinely differentiating capabilities.

## Decision gate

Access creation, Messages, Resources/Delivery/Approval, Meetings and Work/Roadmap now have coherent effective runtime ownership in production. The next structural priority is Team/invitation/access UX and ownership, followed by authenticated multi-user browser regression. Large visual redesign should still wait until those access flows and test gates are sufficiently stable.

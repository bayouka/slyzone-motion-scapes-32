# 4b4c / 2b2c — Product coherence audit — 2026-09-11

Purpose: audit the current product as it actually exists before adding features or applying a large visual redesign.

## Executive assessment

2b2c already has a substantial collaboration model: personal attention Home, projects, actions/roadmap, requests, decisions, meetings, messaging, resources/livrables, approvals, team access and native calls. The main product risk is **not lack of features**. It is overlapping mental models and duplicate frontend ownership.

The strongest concepts should be preserved: Home answers “what needs me now?”, workspace role/project visibility/project responsibility remain separate, messages have explicit audiences, requests are distinct from messages, deliverables are versioned and approvable, meetings follow Before → Live → After, project closure records actual results, and native calls stay contextual.

Current certified production runtime: **v4.5.12-delivery-p2 / build 517**.

## P1 findings

### P1.1 — Project creation access model — RESOLVED

Mandatory `project-access-v1.js` exposes the actual access decision:

- **Projet d’équipe** — recommended/default, current and future eligible internal members get access automatically;
- **Projet restreint** — explicit internal-member selection while workspace administration retains the required administrative access.

Creation calls `create_project_with_access_setup_v1` directly. Transactional RLS probes validated the intended backend semantics before deployment.

### P1.2 — Global Messages and Project Messages — EFFECTIVE RUNTIME RESOLVED

Mandatory `project-messages-route-v1.js` resolves the historical project Messages route into the project's `kind=project` general conversation inside mandatory Communication V3.

Global and project messaging therefore use one intended effective renderer. Deep links preserve project context through auth/workspace initialization. The old renderer still physically exists in `live.js`, but it is cleanup debt rather than the intended UX path.

### P1.3 — Resources, deliverables and approvals had competing owners — EFFECTIVE RUNTIME RESOLVED

The previous runtime contained three overlapping layers:

- historical resource/deliverable UI and handlers in `live.js`;
- capture-phase compatibility handling in `workflow-backend-safe-v1.js`;
- the newer `resources-workspace-v2.js` renderer.

Production now makes `resources-workspace-v2.js` mandatory. It is the intended effective owner for work resources, deliverable creation, immutable version registration, approval requests and approval decisions.

All active validation entry points outside Resources — Home attention, My Work, project overview/external view and historical approval actions — are intercepted by mandatory `approval-route-v1.js`, resolved under the current user's RLS visibility and opened in the Resources V2 approval decision flow.

`delivery-workflow-v1.js` remains the effective owner for closure preview, `complete_project_v3`, delivery history and reopen.

Historical handlers remain physically present for compatibility/safety until browser coverage allows their deletion. This is now structural debt, not intended duplicate UX ownership.

### P1.4 — Authenticated browser regression gate — PARTIAL

The direct Cloudflare deployment now performs executable public runtime smoke checks for:

- Worker release/version;
- SPA shell build;
- project access module;
- project Messages route;
- Communication V3;
- Resources V2;
- approval routing;
- Delivery closure/reopen module.

This materially improves release verification but does not replace authenticated multi-user browser E2E.

The connected Supabase tooling does not expose an Auth-admin lifecycle suitable for safely creating/deleting temporary E2E identities. Production identities will not be fabricated through SQL or borrowed from user credentials.

### P1.5 — Guest project management actions — RESOLVED

External Guests no longer get effective project create/archive management actions. Server authorization remains the final boundary.

### P1.6 — Action / milestone / meeting ownership — OPEN

`live.js` still renders these workflows while `workflow-backend-safe-v1.js` captures several of their forms and calls the safer RPC workflows. Some quick actions still execute directly from `live.js`.

**Target:** establish explicit effective ownership per operation, preserve current UX and server-side authorization, then remove duplicate event ownership only when the corresponding scenario is covered.

## P2 findings

### P2.1 — “Calendrier” currently means meetings at workspace level

Global Calendar is effectively shared meeting time, while action deadlines live under My Work and project Work/Calendar.

**Direction:** evolve toward an Agenda model with optional layers for meetings, personal due dates and project milestones/targets without creating a duplicate task manager.

### P2.2 — Project management does not expose access scope

Lifecycle management handles pause/completion/reopen/archive/delete but not Team/Restricted access.

**Direction:** add a separate Access & participants entry with explicit impact preview before any scope change.

### P2.3 — Controlled vocabulary

- `Membre` = internal workspace member;
- `Invité externe` = explicit project/shared-content access;
- `Participant projet` = explicit participant in a restricted project/project-team context;
- `Responsable` = accountable person for action/jalon/project lead role;
- `Ressource de travail` ≠ `Livrable`;
- `Message` ≠ `Demande` ≠ `Décision`;
- `Réunion` = synchronous event; `Appel` = communication session.

Avoid using “participant” as a synonym for “can access”.

## Quality-system correction

The audit found that repository checks themselves had become stale:

- `stability-check.mjs` still expected build 512 / `v4.5.12-roadmap-p2`;
- `contract-check.mjs` required legacy Messages V2 and legacy deliverable/version code to remain present.

Those assertions were replaced by checks against effective runtime owners. Quality gates must protect product invariants, not preserve obsolete implementation details.

## Current strengths to preserve

### Home

Prioritizes personal attention, changes since last visit, upcoming time commitments and the project to resume.

### Team/access

Owner/Admin have workspace-wide access; Member gets current/future Team projects plus explicit Restricted projects; Guest gets explicit projects only, never automatic future project access.

### Resources/delivery

Working resources are separated from official deliverables; deliverable versions are immutable, approvals target exact versions and closure history preserves what was delivered.

### Meetings

Before → Live → After remains a strong mental model linking agenda, live notes, summary, actions and decisions.

### Calls

Current call model covers prejoin, explicit invitees, multi-party capacity, screen sharing, front-camera preference/mobile switching, reconnect/heartbeat, add-person-during-call and project/meeting context.

## Recommended execution order

1. Map and consolidate action/milestone/meeting event ownership without deleting the covered fallback paths yet.
2. Prepare authenticated browser regression coverage without weakening Auth or using personal credentials.
3. Remove dormant legacy Messages/Resources/approval handlers only after their corresponding E2E scenarios are executable.
4. Extract remaining domains from `live.js` incrementally, without big-bang rewrite.
5. Classify remaining Supabase `SECURITY DEFINER` functions/grants by intended API contract and least privilege.
6. Review information architecture and DA.
7. Only after that add genuinely differentiating capabilities.

## Decision gate

Access, Messages and the effective Resources/Delivery/Approval path are now coherent in production. A large visual redesign should still wait until action/milestone/meeting ownership and the authenticated regression gap are reduced, otherwise the new visual system would be built around runtime coupling that is still scheduled for removal.

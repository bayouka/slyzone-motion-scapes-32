# 4b4c / 2b2c — Product coherence audit — 2026-09-11

Purpose: audit the current product as it actually exists before adding features or applying a large visual redesign.

## Executive assessment

2b2c already has a substantial collaboration model: personal attention Home, projects, actions/roadmap, requests, decisions, meetings, messaging, resources/livrables, approvals, team access and native calls. The main product risk is **not lack of features**. It is overlapping mental models and duplicate frontend ownership.

The strongest concepts should be preserved: Home answers “what needs me now?”, workspace role/project visibility/project responsibility remain separate, messages have explicit audiences, requests are distinct from messages, deliverables are versioned and approvable, meetings follow Before → Live → After, project closure records actual results, and native calls stay contextual.

## P1 findings

### P1.1 — Project creation access model — RESOLVED

Production uses mandatory `project-access-v1.js` and exposes the real access decision:

- **Projet d’équipe** — recommended/default, current and future internal members get access automatically;
- **Projet restreint** — explicit internal-member selection, while owner/admin retain administrative access.

The frontend calls `create_project_with_access_setup_v1` directly. Transactional RLS probes validated the backend semantics before deployment.

### P1.2 — Global Messages and Project Messages — EFFECTIVE RUNTIME RESOLVED

The former project Messages tab had a separate renderer from global Communication.

Production `v4.5.12-communication-p2 / build 515` now loads mandatory `project-messages-route-v1.js`: the historical project Messages route resolves the project's actual `kind=project` general conversation and opens it in the same Communication V3 workspace used by global Messages.

Direct/deep project-message routes preserve the project context while authentication/workspace state is loading. `communication-workspace-v1.js` is now mandatory; the boot chain no longer silently falls back to the old global renderer if Communication V3 fails to load.

All three active production projects were checked and each has exactly one active general project conversation, so the route is deterministic on current data.

The old project renderer still physically exists in `live.js`; removing dormant code remains structural cleanup behind browser regression coverage. The UX now has one intended effective Messages renderer, but source cleanup is not yet complete.

### P1.3 — Critical workflows still depend on competing event listeners — OPEN

`live.js` still contains handlers for actions, milestones, meetings, versions, approvals and completion while later modules intercept some of the same actions/forms.

**Target:** one frontend owner per workflow after regression coverage proves the replacement path.

### P1.4 — Authenticated browser regression gate — PARTIAL

The Cloudflare production deploy now performs executable public runtime smoke checks for the Worker release, shell build and mandatory modules. This materially improves deployment verification but does not replace authenticated browser E2E.

Two-session browser tests remain required for invitation/access, project workflows, messaging and native calls. The current Supabase connector does not expose Auth-admin operations to create/delete safe temporary E2E identities, so production identities will not be fabricated through SQL or borrowed from user credentials.

### P1.5 — Guest project page management actions — RESOLVED

External Guests no longer get effective project create/archive management actions. Authorization remains server-side as the final boundary.

## P2 findings

### P2.1 — “Calendrier” currently means meetings at workspace level

Global Calendar is effectively shared meeting time, while action deadlines live under My Work and project Work/Calendar.

**Direction:** evolve toward an Agenda model with optional layers for meetings, personal due dates and project milestones/targets without creating a duplicate task manager.

### P2.2 — Project management does not expose access scope

Lifecycle management handles pause/completion/reopen/archive/delete but not Team/Restricted access.

**Direction:** add a separate Access & participants entry with an explicit impact preview before any scope change.

### P2.3 — Controlled vocabulary

- `Membre` = internal workspace member;
- `Invité externe` = explicit project/shared-content access;
- `Participant projet` = explicit participant in a restricted project/project team context;
- `Responsable` = accountable person for action/jalon/project lead role;
- `Ressource de travail` ≠ `Livrable`;
- `Message` ≠ `Demande` ≠ `Décision`;
- `Réunion` = synchronous event; `Appel` = communication session.

Avoid using “participant” as a synonym for “can access”.

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

## Recommended execution order — updated after communication-p2

1. Prepare/implement authenticated browser regression coverage without weakening Auth or using personal credentials.
2. Consolidate deliverable/version/approval ownership behind the existing server-safe workflows.
3. Consolidate remaining action/milestone/meeting event ownership.
4. Remove dormant legacy renderer/handlers from `live.js` only when their replacement scenario is covered.
5. Continue extracting domains from `live.js` incrementally, without big-bang rewrite.
6. Review information architecture and DA.
7. Only after that add genuinely differentiating capabilities.

## Decision gate

Project access and the effective Messages renderer are now coherent in production. A large visual redesign should still wait until the remaining double-ownership workflows and authenticated regression gap are reduced; otherwise the new visual system would be built on runtime paths that are still unnecessarily coupled.

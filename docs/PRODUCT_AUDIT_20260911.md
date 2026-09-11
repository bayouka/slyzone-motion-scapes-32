# 4b4c / 2b2c — Product coherence audit — 2026-09-11

Purpose: audit the current product as it actually exists before adding features or applying a large visual redesign.

## Executive assessment

2b2c already has a substantial collaboration model: personal attention Home, projects, actions/roadmap, requests, decisions, meetings, messaging, resources/livrables, approvals, team access and native calls. The main product risk is **not lack of features**. It is overlapping mental models and duplicate frontend ownership.

The strongest current concepts should be preserved: Home answers “what needs me now?”, workspace role/project visibility/project responsibility remain separate, messages have explicit audiences, requests are distinct from messages, deliverables are versioned and approvable, meetings follow Before → Live → After, project closure records actual results, and native calls stay contextual.

## P1 findings

### P1.1 — Project creation access model — RESOLVED in v4.5.12-access-p1

The former “Nouveau projet” form asked for “Participants dès le départ” while calling a Team-only workflow. This was misleading because Team projects automatically synchronize internal members.

Production now loads mandatory `project-access-v1.js`, which presents the actual access decision first:

- **Projet d’équipe** — recommended/default, current and future internal members get access automatically;
- **Projet restreint** — explicit internal-member selection, while workspace owner/admin retain administrative access.

The frontend calls `create_project_with_access_setup_v1` directly. Transactional RLS probes had already validated the backend semantics before deployment.

### P1.2 — Global Messages and Project Messages are two active experiences — OPEN

Global `#/messages` uses the newer Communication workspace while the project `Messages` tab is still rendered separately. Backend hardening prevents this from being an identified authorization bypass, but it creates inconsistent capabilities and duplicated maintenance.

**Target:** one communication renderer/service; project Messages becomes the same workspace pre-filtered to the project.

### P1.3 — Critical workflows still depend on competing event listeners — OPEN

`live.js` still contains handlers for versions, approvals, completion and other workflows while later modules intercept some of the same actions/forms.

**Target:** one frontend owner per workflow after browser tests prove the replacement path.

### P1.4 — No real browser regression gate — OPEN

Current checks are primarily syntax/static/contract checks. Browser E2E coverage is required for invitation/access, navigation, project workflows, two-account messaging, native calls, camera switching and responsive behavior.

### P1.5 — Guest project page exposes impossible management actions — RESOLVED in v4.5.12-access-p1

External Guests legitimately have `Projets` in primary navigation, but the former Projects page exposed `Archives` and `Nouveau projet` unconditionally.

The access module now resolves the authenticated workspace role, hides those Guest-only impossible CTAs and defensively blocks the legacy actions. Authorization remains enforced server-side as the final boundary.

## P2 findings

### P2.1 — “Calendrier” currently means meetings at workspace level

Global Calendar is effectively shared meeting time, while action deadlines live under My Work and project Work/Calendar. This is internally coherent but the label can imply all dated commitments.

**Direction:** evolve toward an Agenda model with optional layers for meetings, personal due dates and project milestones/targets without turning it into a duplicate task manager.

### P2.2 — Project management does not expose access scope

Lifecycle management handles pause/completion/reopen/archive/delete but not Team/Restricted access.

**Direction:** add a separate Access & participants entry, with explicit impact preview before any scope change.

### P2.3 — Freeze controlled vocabulary

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

## Recommended execution order — updated after access-p1

1. Implement executable browser regression coverage for the stabilized access-p1 baseline.
2. Verify critical two-session authenticated behavior.
3. Unify project and global messaging under Communication V3.
4. Remove duplicate event ownership for deliverables/approvals/project completion.
5. Extract domains from `live.js` incrementally, without big-bang rewrite.
6. Review information architecture and DA.
7. Only after that add genuinely differentiating capabilities.

## Decision gate

The access-model P1 defects are now corrected in production, but the UI should still not receive a large visual redesign until browser coverage and the duplicate communication/workflow ownership are addressed. Otherwise the redesign would harden inconsistent runtime paths into the new visual system.

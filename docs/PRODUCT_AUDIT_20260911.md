# 4b4c / 2b2c — Product coherence audit — 2026-09-11

Purpose: audit the current product as it actually exists before adding features or applying a large visual redesign.

## Executive assessment

2b2c already has a substantial collaboration model: personal attention Home, projects, actions/roadmap, requests, decisions, meetings, messaging, resources/livrables, approvals, team access and native calls. The main product risk is **not lack of features**. It is overlapping mental models and duplicate frontend ownership.

The strongest current concepts should be preserved: Home answers “what needs me now?”, workspace role/project visibility/project responsibility remain separate, messages have explicit audiences, requests are distinct from messages, deliverables are versioned and approvable, meetings follow Before → Live → After, project closure records actual results, and native calls stay contextual.

## P1 findings

### P1.1 — Project creation access model is misleading

The current “Nouveau projet” form asks for name, objective/result, target date, “Participants dès le départ” and initial roadmap phases, but does **not** ask whether the project is `team` or `restricted`.

The form currently calls `create_project_with_setup`, which creates a Team project and synchronizes eligible internal members. The participant checkboxes therefore do not mean what the UI suggests.

The production backend already exposes `create_project_with_access_setup_v1`, supporting `team` and `restricted` plus an explicit internal participant set for restricted projects. Transactional RLS probes confirmed the intended behavior.

**Target:** first ask for access scope. `Projet d’équipe` is the recommended/default option and grants all internal members current/future access. `Projet restreint` grants only owner/admin plus selected internal participants. Participant selection is shown only when meaningful.

### P1.2 — Global Messages and Project Messages are two active experiences

Global `#/messages` uses the newer Communication workspace while the project `Messages` tab is still rendered separately. Backend hardening prevents this from being an identified authorization bypass, but it creates inconsistent capabilities and duplicated maintenance.

**Target:** one communication renderer/service; project Messages becomes the same workspace pre-filtered to the project.

### P1.3 — Critical workflows still depend on competing event listeners

`live.js` still contains handlers for versions, approvals, completion and other workflows while later modules intercept some of the same actions/forms.

**Target:** one frontend owner per workflow after browser tests prove the replacement path.

### P1.4 — No real browser regression gate

Current checks are primarily syntax/static/contract checks. Browser E2E coverage is required for invitation/access, navigation, project workflows, two-account messaging, native calls, camera switching and responsive behavior.

### P1.5 — Guest project page exposes impossible management actions

An external Guest legitimately has `Projets` in primary navigation, but the current Projects page renders `Archives` and `Nouveau projet` unconditionally. Those actions do not belong in the Guest experience and should be hidden rather than failing later at authorization boundaries.

**Target:** Guest sees only projects explicitly shared with them and no workspace-level create/archive management CTA.

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

## Recommended execution order

1. Add/prepare browser regression coverage for current behavior.
2. Fix project creation scope/participant semantics with the existing access-aware backend workflow.
3. Remove Guest-only project-management CTAs.
4. Unify project and global messaging under Communication V3.
5. Remove duplicate event ownership for deliverables/approvals/project completion.
6. Extract domains from `live.js` incrementally, without big-bang rewrite.
7. Then review information architecture and DA.
8. Only after that add genuinely differentiating capabilities.

## Decision gate

Do not treat the current UI as ready for a large visual redesign yet. A DA overhaul before P1.1–P1.5 would make duplicated or misleading workflows more attractive without making them more coherent.

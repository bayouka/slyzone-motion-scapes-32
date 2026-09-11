# 4b4c / 2b2c — Product coherence audit — 2026-09-11

Purpose: audit the current product as it actually exists before adding features or applying a large visual redesign. Findings distinguish observed behavior from recommended product changes.

## Executive assessment

2b2c already has a substantial collaboration model: personal attention Home, projects, actions/roadmap, requests, decisions, meetings, messaging, resources/livrables, approvals, team access and native calls. The main product risk is **not lack of features**. It is that some domains are exposed through multiple overlapping mental models or frontend implementations.

The strongest current product concepts should be preserved:

- Home answers “what needs me now?” rather than acting as a generic widget dashboard;
- workspace role, project visibility and project responsibility are separate;
- messages have explicit audiences;
- requests are distinct from ordinary messages because they expect a response;
- deliverables are distinct from working resources because official outputs are versioned and can be approved;
- meetings follow Before → Live → After and can generate actions/decisions;
- project closure records the result and exact delivery references;
- native calls support project/meeting/message contexts rather than being a separate bolted-on tool.

## P1 findings

### P1.1 — Project creation access model is misleading

**Observed**

The current “Nouveau projet” form asks for:

- name;
- objective/result;
- target date;
- “Participants dès le départ”;
- initial roadmap phases.

It does **not** ask whether the project is `team` or `restricted`.

The form submits through `create_project_with_setup`, whose backend implementation always creates the project with `visibility='team'` and calls `sync_team_project_members_v1`. Therefore all eligible internal members receive access to a Team project regardless of the participant checkboxes shown in the form.

The production backend already exposes `create_project_with_access_setup_v1`, which supports both `team` and `restricted` visibility and an explicit participant set for restricted projects.

**Impact**

The interface suggests that the creator controls project participation at creation time, while the actual access model says “all internal members” for a Team project. This creates avoidable confusion precisely where users form their mental model of permissions.

**Recommended target**

The creation flow should first ask for the project's access scope:

- **Projet d’équipe — recommended/default:** every internal member can access it now and in the future. Do not present participant checkboxes as access control.
- **Projet restreint:** only selected internal participants plus workspace admins/owner get project access. Participant selection becomes mandatory/meaningful here.

External guests remain invited/shared explicitly through Team/access management; they should not be silently included by a generic internal-participant field.

Use the current access-aware backend workflow rather than creating a second access mechanism.

### P1.2 — Global Messages and Project Messages are two active experiences

**Observed**

Global `#/messages` is enhanced by `communication-workspace-v1.js` and uses Communication V3 workflows. The project `Messages` tab is still rendered by `live.js` and submits through legacy-named message functions.

The backend hardens those legacy functions by routing them into the V3 message workflows, so this is not currently identified as an authorization bypass. It is nevertheless two active frontend ownership paths for the same user concept.

**Impact**

- inconsistent capabilities and presentation depending on where the conversation is opened;
- duplicated maintenance and regression surface;
- future features can land in one messaging surface and not the other;
- users must learn whether “Messages” means project chat or the global communication workspace.

**Recommended target**

One communication model and one renderer/service. The project Messages tab becomes the same Communication workspace pre-filtered to that project, with project context visually persistent. Global Messages shows all permitted audiences.

### P1.3 — Critical workflows still depend on competing event listeners

**Observed**

`live.js` still contains native handlers for versions, approvals, completion and other workflows. Later loaded modules intercept some of the same actions/forms in capture phase and call `stopImmediatePropagation()` to ensure the safer backend workflow wins.

**Impact**

Correct behavior partly depends on module/listener ordering. A future import-order change can reactivate an older implementation without a compile error.

**Recommended target**

One frontend owner per workflow. Keep server-side RPC/RLS invariants, but remove competing DOM listeners once browser tests prove the replacement path.

### P1.4 — No real browser regression gate

**Observed**

Current repository checks are primarily syntax/static/contract checks. No Playwright/Cypress E2E suite is present in the canonical source.

**Impact**

The product can pass `npm run check` while still failing on:

- mobile drawer/focus/scroll;
- project navigation;
- modal behavior;
- invitation flows;
- two-account messaging;
- WebRTC prejoin/incoming-call lifecycle;
- camera switching and responsive call controls.

**Recommended target**

Introduce a small, deterministic browser suite before structural frontend cleanup. Cover business-critical paths first, visual regression second.

## P2 findings

### P2.1 — “Calendrier” currently means meetings at workspace level

**Observed**

The global Calendar explicitly lists meetings and describes itself as “temps partagé”, while action deadlines live under My Work and project Work/Calendar.

**Product question**

This separation is coherent internally, but the label “Calendrier” conventionally suggests all dated commitments. A user may reasonably expect project deadlines/actions there.

**Recommended direction**

Do not simply dump every task into the calendar. Consider an Agenda model with filters/layers:

- meetings;
- personal due dates;
- project milestones/targets;
- optional assigned actions.

Preserve My Work as the action/attention surface. Calendar/Agenda should answer “when?”, not become a second task manager.

### P2.2 — Project management entry point does not expose access scope

**Observed**

The Project “Manage” modal handles pause, completion, reopen, archive and delete. It does not expose the project's Team/Restricted scope or participant access.

**Recommended direction**

Add a dedicated **Access & participants** entry rather than mixing permissions into lifecycle controls. Changing Team ↔ Restricted is a consequential operation and should explain exactly who gains/loses access before confirmation.

### P2.3 — Terminology needs one controlled vocabulary

Current concepts are mostly good, but terminology should be frozen across surfaces:

- `Membre` = internal workspace member;
- `Invité externe` = explicit project/shared-content access;
- `Participant projet` = person explicitly involved in a restricted project or shown as project team context;
- `Responsable` = person accountable for an action/jalon/project lead role;
- `Ressource de travail` ≠ `Livrable`;
- `Message` ≠ `Demande` ≠ `Décision`;
- `Réunion` = synchronous event; `Appel` = communication session that may or may not belong to a meeting.

Avoid reusing “participant” as a synonym for “can access”.

## Current strengths verified in product logic

### Home

The Home prioritizes personal attention, changes since last visit, upcoming time commitments and the project to resume. This is differentiated and should remain the product's primary entry point.

### Team/access

Current member management clearly states:

- Owner/Admin: workspace-wide access;
- Member: automatic access to current/future Team projects, plus explicit Restricted projects;
- Guest: explicit projects only, no automatic future project access.

This model is materially better than a generic “admin/member/guest” dropdown with no project semantics.

### Resources/delivery

The enhanced Resources workspace correctly separates working resources from official deliverables. Deliverable versions are immutable, approvals target an exact version and closure history preserves what was actually delivered.

### Meetings

Before → Live → After is a strong mental model. Agenda, live notes, summary, actions, decisions and native call entry belong together.

### Calls

The current call model already covers the hard collaboration cases: prejoin, explicit invitees, multi-party capacity, screen sharing, front-camera preference/mobile switching, reconnect/heartbeat, add-person-during-call and project/meeting context. Product work should focus on interaction quality and reliability rather than adding another calling concept.

## Recommended execution order from this audit

1. **Add browser regression coverage for current behavior.**
2. **Fix project creation scope/participant semantics** using the already-existing access-aware backend workflow.
3. **Unify project and global messaging** under Communication V3.
4. **Remove duplicate event ownership** for deliverables/approvals/project completion.
5. **Extract domains from `live.js` incrementally**, without a big-bang rewrite.
6. **Then review information architecture and DA**, using the stabilized workflows as the substrate.
7. **Only after that add genuinely differentiating product capabilities.**

## Decision gate

Do not treat the current UI as ready for a large visual redesign yet. A DA overhaul before P1.1–P1.4 would make duplicated or misleading workflows more attractive without making them more coherent.

# 4b4c / 2b2c — Browser E2E regression matrix — 2026-09-11

Purpose: define the minimum browser-level safety net required before removing duplicate runtime paths or restructuring `live.js`. This matrix is product-contract driven; it must remain valid regardless of the eventual E2E runner.

## Test identities

Use two existing internal test identities when credentials are available to the runner:

- **Owner/Admin actor** — full workspace administration.
- **Member actor** — internal member with Team-project access but no workspace administration.

Add a temporary invited Guest only inside a controlled test environment or through a fully reversible production-safe fixture. Never hard-code real credentials in the repository.

## Global rules

- Desktop viewport: 1440 × 900.
- Mobile viewport: representative 390 × 844.
- Every route must render exactly one visible `h1` in the main content.
- No uncaught page error or console error attributable to 2b2c.
- A failed optional enhancement must not downgrade authorization or workflow semantics.
- Every mutation test must clean up its own fixture or run against a disposable environment.
- Cross-user assertions must be checked from the second user's session, not inferred from the creator's UI.

## P0 — Access and isolation

### E2E-001 — Owner sign-in and Home

**Given** an owner account with workspace membership  
**When** the user signs in  
**Then** Home opens successfully, identifies the active workspace, renders one `h1`, and exposes Projects, My work, Messages, Calendar, Files and Team.

### E2E-002 — Member cannot administer workspace

**Given** the member account  
**When** Team and Settings are opened  
**Then** owner/admin-only mutation controls are absent or rejected server-side, while normal member collaboration remains available.

### E2E-003 — Unrelated authenticated account isolation

**Given** an authenticated identity with no workspace membership  
**Then** it cannot read workspace, project, conversation, message, deliverable, meeting or call data belonging to 4b4c.

### E2E-004 — Team vs Restricted project visibility

Create transaction-safe fixtures or disposable projects:

1. Team project;
2. Restricted project excluding Member;
3. Restricted project including Member.

**Expected for Member:** Team visible; excluded Restricted invisible; included Restricted visible.

### E2E-005 — Invitation identity binding

An invitation created for email A must not be consumable by authenticated email B. The pre-login preview must not disclose full private invite details to an unrelated anonymous visitor.

## P0 — Project creation contract

### E2E-010 — Create Team project

**Owner opens New project.**

Expected UI:

- access scope explicitly defaults to **Team**;
- copy explains that current and future internal members receive access automatically;
- participant checkboxes are not presented as access control for Team projects.

Submit with name, objective and 3–7 phases.

Expected backend/product result:

- `visibility='team'`;
- creator is project lead;
- all active internal members can access it;
- initial roadmap is created atomically;
- first phase active, following phases todo;
- project opens on Overview.

### E2E-011 — Create Restricted project

Expected UI:

- selecting **Restricted** reveals a meaningful internal participant selector;
- copy states that owner/admin remain able to administer the workspace;
- external Guests are not silently added from this selector.

Expected result:

- `visibility='restricted'`;
- only selected internal participants plus the creator/admin rules gain access;
- an unselected ordinary Member cannot read the project;
- roadmap creation remains atomic.

## P0 — Messaging

### E2E-020 — Global project conversation

Open a project conversation from global Messages, send a message, verify it appears for another permitted user, unread state increments, opening the conversation clears the correct unread state, and the message remains project-contextual.

### E2E-021 — Project-tab conversation parity

Open the same project through `Project > Messages`.

Expected:

- same conversation identity and message history;
- same audience;
- same Communication V3 semantics;
- no feature downgrade compared with global Messages;
- no duplicate message caused by competing submit handlers.

This test must pass before consolidating the two current renderers.

### E2E-022 — Direct-message isolation

A direct conversation is visible only to its explicit members. Linking it to a project must add context without adding readers.

## P0 — Work / roadmap

### E2E-030 — Action create and assignment

Create an action in a project, assign Member, set due date and phase. Verify the Member sees it in My work and the same object appears in project List/Roadmap/Board/Calendar views.

### E2E-031 — Blocked action requires reason

Set an action to Blocked without reason: reject. Set with reason: persist and surface the blocker on project/Home attention where relevant.

### E2E-032 — Roadmap phase lifecycle

Create/edit a milestone, assign an owner, move to active/done and verify project progress and next-phase presentation update coherently.

## P0 — Files, versions, approvals

### E2E-040 — First deliverable version

Upload a deliverable. Verify one official version is registered server-side and version number is not allocated by the browser.

### E2E-041 — Immutable new version

Upload a second version. Verify v1 remains immutable/readable and v2 receives the next server-assigned number.

### E2E-042 — Approval targets exact version

Request approval for v2. Approve or request changes as validator. Verify the decision remains attached to v2 and cannot silently migrate to another version.

### E2E-043 — New version after requested changes

After changes are requested, trying to re-use the rejected/revision-requested version as if it were new must be rejected; a new immutable version is required.

## P0 — Meetings

### E2E-050 — Meeting creation and RSVP

Create a meeting with Member. Member receives/accesses it, accepts or declines, and only permitted actors can manage the meeting.

### E2E-051 — Before → Live → After

Persist agenda, live notes and summary across the lifecycle. Creating an action/decision from meeting context preserves project/source context.

## P0 — Native calls

### E2E-060 — Two-user call

Owner selects Member → prejoin → verifies mic/camera → calls → Member sees incoming call → accepts → both join → leave/end.

Expected:

- initiator is not considered joined before prejoin confirmation;
- call session remains scoped to intended invitees/context;
- ended call is not resumable as live.

### E2E-061 — Mobile front camera and switch

On a device/browser exposing front and rear cameras:

- front camera is preferred by default;
- prejoin switch works;
- in-call switch works;
- UI remains usable at 390 × 844.

### E2E-062 — Add participant during call

During an active call, invite an additional eligible internal member without terminating the existing peers.

### E2E-063 — Six-person capacity

Capacity is exactly six people total. Active participants and pending/accepted invitations reserve seats. Attempts beyond capacity must fail with the same user-facing `CALL_FULL` semantics.

### E2E-064 — Heartbeat and reconnect

Verify active presence heartbeat, resumable session after a short interruption, stale participant cleanup, stale empty-room reuse/closure and unanswered invite expiry.

### E2E-065 — Screen sharing

When `getDisplayMedia` is supported, start and stop screen share without losing the camera track permanently; remote UI prioritizes the shared screen.

## P1 — Navigation and responsive shell

### E2E-070 — Scroll reset

Navigate from a scrolled long page to another route. New route starts at top and the main `h1` receives non-scrolling focus as designed.

### E2E-071 — Mobile drawer accessibility

Open drawer, verify focus remains trapped inside with Tab/Shift+Tab, Escape closes it and returns focus to hamburger, header stays visible, Profile/Sign out remain reachable.

### E2E-072 — Mobile primary dock

Internal user dock contains only Home, Projects, My work and Messages. Secondary destinations remain in hamburger drawer.

## P1 — Project closure

### E2E-080 — Clean completion

Project with no open commitments can be completed with a result and exact reference versions; closure history remains readable.

### E2E-081 — Completion with open commitments

Open actions/requests/approvals are explicitly surfaced and confirmation is required before completion.

### E2E-082 — Reopen

Reopen a completed project. Verify lifecycle, visibility, conversations and historical delivery records remain coherent.

## P1 — Error/fallback behavior

### E2E-090 — Communication enhancement failure

Simulate failure of an optional communication enhancement. The app may show a controlled degraded state, but it must not silently switch to weaker authorization/workflow semantics.

### E2E-091 — Sync interruption

Simulate workspace sync failure. UI exposes the interruption and Retry; existing state remains usable without fabricating success.

## Gate definition

Before removing any duplicate runtime implementation:

- the relevant P0 scenario exists as an executable browser test;
- the replacement path passes for both Owner and Member where applicable;
- server-side RLS/RPC invariants remain independently tested;
- no production deployment is declared successful solely because static checks pass.

# 4b4c Technical Audit — 2026-09-09

## Scope

Audit of the current production repository after V4.5.2, focused on regression risk, frontend architecture, deployment safety, repository hygiene, Supabase security/performance and mobile/runtime consistency.

## Executive summary

The product is operational and production RLS is enabled on all public tables. The main risks are not missing features; they are accumulated historical layers and duplicated runtime ownership.

### Immediate risks found and corrected

1. **Obsolete migration workflows could still deploy old V4.4.6/V4.4.7 code**
   - Three historical migration workflows still had push triggers on `main`.
   - They are now archived, manual-only and job-disabled with `if: false`.

2. **CI contract was stale**
   - `.github/workflows/ci.yml` still expected modules that are no longer loaded by `boot.js`.
   - CI now validates the actual V4.5 runtime and repository safety constraints.

3. **SPA shell had no explicit cache policy**
   - A stale `index.html` can point at an older build even after a successful deployment.
   - Worker now serves navigation/HTML with `Cache-Control: no-store`.

4. **Missing basic response hardening**
   - Worker now adds `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` and a restrictive media-focused `Permissions-Policy`.

5. **Anonymous call heartbeat permission**
   - `heartbeat_call_v1` was executable by `anon` despite requiring `auth.uid()`.
   - `EXECUTE` was revoked from `anon`; authenticated access remains.

6. **Documentation drift**
   - README described V4.3.2 and claimed native video did not exist.
   - README now reflects V4.5 architecture, navigation and native calls.

7. **Temporary deployment hygiene**
   - New `scripts/repo-hygiene-check.mjs` guards against stale boot imports, automatic historical migrations, forgotten one-shot deploy markers, wrong CSS ordering and missing shell/security headers.
   - It is part of `npm run check`.

## High-priority technical debt

### A. CSS cascade debt — HIGH

Current production loads 13 CSS files totaling approximately **384 KB**.

Observed:
- approximately **1,659 `!important` declarations**;
- `live.css` alone contains roughly 792;
- `design-v5.css` contains roughly 493;
- many core selectors are defined in 3–5 different files;
- `v435-final.css` is currently loaded before the older `v434-polish.css`, allowing an older layer to override a newer historical layer before V5.

Examples of selectors defined across several generations:
- `.modal`
- `.card`
- `.btn`
- `.mobile-drawer`
- `.notification-panel`
- `.conversation-item`
- `.calendar-shell`
- `.roadmap-index`

**Risk:** responsive and contrast bugs depend on source order rather than component ownership.

**Recommended remediation:** incremental CSS consolidation, not a one-shot rewrite:
1. freeze V5 tokens/components;
2. identify selectors fully covered by V5;
3. remove equivalent legacy blocks one domain at a time;
4. run visual checks after each removal;
5. target fewer than 5 active CSS layers and sharply reduce `!important`.

### B. Core JS monolith — HIGH

`site/assets/live.js`:
- ~263 KB;
- ~2,125 lines;
- ~102 UI action names;
- ~41 direct `api.select` call sites;
- ~44 direct `api.rpc` call sites.

**Risk:** unrelated changes can affect routing, calls, projects, meetings and navigation.

**Recommended module boundaries:**
- `shell/navigation`
- `projects/roadmap`
- `work/actions`
- `meetings/calendar`
- `calls/webrtc`
- `team/access`
- `shared/modal-and-feedback`

Decompose only behind contract tests; do not rewrite all at once.

### C. Duplicate event ownership — HIGH

Some actions are intentionally/accidentally handled by more than one loaded module.

Observed:
- `start-complete-project` — handled by `live.js`, `delivery-workflow-v1.js`, `workflow-backend-safe-v1.js`;
- `approval-decision` — `live.js` + workflow bridge;
- `request-approval` — `live.js` + workflow bridge;
- `new-version` — `live.js` + workflow bridge.

Current safety relies partly on capture listeners and `stopImmediatePropagation()`.

**Risk:** changing import/listener order can silently change which implementation wins.

**Recommended remediation:** designate one owner per action and make other modules expose functions/services rather than competing DOM listeners.

### D. Historical runtime files — MEDIUM

There are **32 JS assets**, but only 8 are part of the active runtime/bootstrap surface. 24 are currently inactive historical layers.

Inactive examples include:
- `call-native-v1.js`
- `home-polish.js`
- `workflow-backend-v2.js`
- `project-progress-v2.js`
- team/invite safety patch modules
- earlier resource/workflow layers

**Risk:** accidental re-import by future maintenance work.

**Recommended remediation:** move historical sources to `archive/` or remove them after a rollback tag is retained. Keep repo-hygiene checks forbidding their production import.

### E. Browser-level testing gap — HIGH

Current checks are strong static/contract/smoke checks but are not a real browser test suite.

Missing automated scenarios:
- route navigation starts at top;
- hamburger/drawer scroll behavior;
- mobile contrast and layout;
- modal focus/escape;
- call prejoin;
- two-party call lifecycle;
- screen sharing state;
- responsive tablet breakpoints.

**Recommended remediation:** add Playwright smoke/E2E tests for the critical navigation and collaboration flows. Visual regression snapshots should cover Home/mobile drawer/project/call surfaces.

### F. Full-page reload / native dialogs in bridges — MEDIUM

Loaded bridge modules still contain:
- several `location.reload()` calls;
- `window.alert()`;
- one `window.prompt()`;
- multiple silent fallback catches.

**Risk:** abrupt UX, lost transient state and harder debugging.

**Recommended remediation:** replace reloads with targeted state refresh, replace alert/prompt with application dialogs/toasts and log unexpected fallback errors.

## Backend audit

### Positive
- RLS is enabled on all public tables.
- Current call presence cleanup uses authenticated heartbeat.
- Production uses publishable client credentials rather than service-role credentials.

### Security advisors
- `heartbeat_call_v1` anonymous execution: corrected.
- `workspace_invite_public_preview` remains intentionally anonymous because invite preview must work before login.
- Supabase reports many authenticated `SECURITY DEFINER` RPCs. Most are intentional API endpoints, but their grants should be periodically reviewed for least privilege.
- leaked-password protection is reported disabled; enable if the current plan/settings permit it.

### Performance advisors
- 11 RLS policies re-evaluate `auth.*` per row and can be optimized using `(select auth.uid())` / equivalent init-plan patterns.
- 41 indexes are currently reported unused. Given the very small pilot dataset, this is not evidence they should be dropped; wait for representative usage before removing indexes.

## Production/repository alignment

Production must be considered aligned only when:
1. `/health` reports the intended release;
2. root HTML references the intended boot/CSS versions;
3. production smoke tests pass;
4. no temporary `.github/deploy-once-*` marker remains;
5. `main` carries the same functional release markers.

## Priority order

### P0 — done in this audit
- disable obsolete deployment/migration automation;
- fix stale CI;
- revoke anonymous heartbeat execution;
- prevent stale SPA shell;
- add basic response hardening;
- update repository documentation;
- add repository hygiene guardrails.

### P1 — next technical-cleanup gate
- CSS consolidation;
- single ownership for workflow actions;
- introduce browser E2E/visual tests;
- split `live.js` by domain without changing UX.

### P2
- remove/archive inactive JS assets;
- replace reload/alert/prompt bridges;
- optimize RLS init-plan warnings after measuring;
- review authenticated SECURITY DEFINER grants by API intent.

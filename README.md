# 4b4c

Canonical source of the 4b4c collaborative workspace. The product is branded **2b2c** in the user interface.

## Current production architecture

- `site/index.html` — SPA shell.
- `site/assets/boot.js` — production bootstrap and explicit module loading.
- `site/assets/live.js` — canonical application shell, routing, workspace state and core screens.
- `site/assets/design-v5.css` — current global V5 **Soft Spatial Workspace** design layer, loaded last.
- `site/assets/call-native-v1.css` + call logic in `live.js` — native WebRTC video-call UI.
- `site/assets/communication-workspace-v1.js` — collaboration/messaging workspace enhancement.
- `site/assets/resources-workspace-v2.js` — resource/deliverable workspace enhancement.
- `site/assets/library-workspace-v1.js` — global file library enhancement.
- `site/assets/delivery-workflow-v1.js` + `workflow-backend-safe-v1.js` — delivery/approval safety bridges.
- `src/worker.js` — Cloudflare Worker / SPA fallback / response hardening.
- `wrangler.jsonc` — stable Cloudflare Worker configuration named `4b4c`.
- Supabase production backend — project `wexfzhegiewhldkugtow`.

Production version: **v4.5.7-nav-cleanup / build 502**.

## Product contract

2b2c is a simple, complete collaborative workspace: projects, personal work, messages, meetings, roadmap, files, approvals and native video calls in one product.

The Home is a personal situation summary, not a generic widget dashboard. In under 10 seconds it should answer:

1. What is expected from me?
2. Who is waiting for me?
3. What changed since my last visit?
4. What is coming soon?
5. Which project should I resume, and why?

Do not add decorative dashboard gadgets that do not improve collaboration or decision-making.

## Collaboration rules

- workspace role, project visibility and project responsibility are separate concepts;
- a selected member must not see data from unselected projects;
- a guest/client only sees explicitly selected projects/shared content and cannot write internal project content;
- invitations are bound to the invited email and explicit project mappings;
- Home time signals are personal;
- file versions are allocated and registered server-side;
- validation always targets an exact immutable version;
- Team / Project / Direct message audiences and unread/mention semantics remain distinct;
- native calls support prejoin, multiple participants, screen sharing, mobile camera switching, reconnect/resume and project/meeting context.

## Navigation contract

Desktop:
- left sidebar is the persistent primary navigation;
- topbar contains search, calls, notifications, create and profile actions.

Mobile:
- fixed topbar contains the hamburger and contextual global actions;
- bottom dock contains only the four frequent destinations: Home, Projects, My work and Messages;
- hamburger drawer contains secondary tools, recent projects, Calendar, Files, Team, Settings, Profile and Sign out;
- every route navigation starts at the top of the new view;
- drawer header stays visible while its content scrolls; Profile and Sign out stay at the end of drawer content.

## Quality policy

Run before production:

```bash
npm ci
npm run check
```

The dedicated deploy workflow also runs stability checks and production smoke probes before it is considered successful.

Historical one-off migration workflows are archived and intentionally non-executable. They must not be re-enabled without reviewing them against the current runtime.

## Known technical debt

The current runtime is stable, but the repository still contains accumulated historical frontend layers. In particular:

- CSS is split across many legacy files and contains extensive `!important` overrides;
- `live.js` is a large monolith and should be decomposed by domain;
- some workflow actions are still bridged by more than one runtime module;
- historical JS/CSS files remain in the repository although they are not loaded in production.

These items should be reduced incrementally behind stability checks rather than by a large destructive rewrite.

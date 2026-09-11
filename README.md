# 4b4c

Canonical product source for the 4b4c collaborative workspace. The product is branded **2b2c** in the user interface.

## Authority and current production

Use this hierarchy when recovering, auditing or releasing 4b4c:

1. `bayouka/slyzone-motion-scapes-32` `main` — canonical product/runtime source.
2. Supabase project `wexfzhegiewhldkugtow` — authoritative production backend.
3. `bayouka/2b2c/4b4c/` — transport mirror only; never develop from it.
4. `4b4c-pilot` and the root React/Vite/V6 track in `bayouka/2b2c` — historical/non-authoritative tracks.

Current certified production runtime: **v4.5.12-delivery-p2 / build 517**.

A release is production-verified only when the transport manifest matches the intended runtime, the direct Wrangler deployment targets Worker `4b4c`, and the production runtime smoke checks pass.

## Production architecture

- `site/index.html` — SPA shell.
- `site/assets/boot.js` — production bootstrap and mandatory module chain.
- `site/assets/live.js` — application shell, auth, routing, shared state and legacy/core screens.
- `site/assets/project-access-v1.js` — effective project-creation/access owner.
- `site/assets/project-messages-route-v1.js` — routes project Messages into Communication V3.
- `site/assets/communication-workspace-v1.js` — effective messaging/communication renderer; mandatory.
- `site/assets/resources-workspace-v2.js` — effective resources, deliverables, immutable versions and approval workflow renderer; mandatory.
- `site/assets/approval-route-v1.js` — routes validation entry points from Home/My Work/project views into Resources V2.
- `site/assets/delivery-workflow-v1.js` — project closure, delivery history and reopen workflow.
- `site/assets/workflow-backend-safe-v1.js` — compatibility/safety bridge for remaining legacy form paths; not the target long-term owner.
- `site/assets/library-workspace-v1.js` — global file library enhancement.
- `site/assets/design-v5.css` — current global V5 Soft Spatial Workspace design layer, loaded last.
- native WebRTC call logic remains in `live.js`; `site/assets/call-native-v1.css` owns its presentation.
- `src/worker.js` — Cloudflare Worker, health endpoint, SPA fallback and response hardening.
- `wrangler.jsonc` — canonical Worker configuration named `4b4c`.

## Backend baseline

The production migration history recovered during the 2026-09-11 audit is represented in the canonical repository through `20260909093700_revoke_public_call_heartbeat.sql` and guarded by `scripts/migration-history-check.mjs`.

Do not reconstruct, reorder or replay production migrations from memory. New schema changes must start from the verified live/canonical baseline and preserve RLS/least-privilege invariants.

## Product contract

2b2c is a simple, complete collaborative workspace: projects, personal work, messages, meetings, roadmap, resources/files, approvals and native calls in one product.

The Home is a personal situation summary, not a generic widget dashboard. In under 10 seconds it should answer:

1. What is expected from me?
2. Who is waiting for me?
3. What changed since my last visit?
4. What is coming soon?
5. Which project should I resume, and why?

Do not add decorative dashboard gadgets that do not improve collaboration or decision-making.

## Collaboration rules

- workspace role, project visibility and project responsibility are separate concepts;
- Team projects automatically include eligible internal members, including future eligible members;
- Restricted projects expose only explicitly selected participants plus administrative access required by the workspace model;
- a guest/client sees only explicitly shared projects/content and cannot write internal project content;
- invitations remain bound to the invited email and explicit access model;
- file versions are allocated and registered server-side and remain immutable;
- validation targets an exact version, not an abstract file;
- Team / Project / Direct message audiences and unread/mention semantics remain distinct;
- project Messages use the same Communication V3 renderer as global Messages;
- native calls support prejoin, multiple participants, screen sharing, front-camera preference/mobile switching, reconnect/resume and project/meeting context.

## Navigation contract

Desktop:
- left sidebar is the persistent primary navigation;
- topbar contains search, calls, notifications, create and profile actions.

Mobile:
- fixed topbar contains the hamburger and contextual global actions;
- bottom dock contains only Home, Projects, My work and Messages;
- hamburger drawer contains secondary tools, recent projects, Calendar, Files, Team, Settings, Profile and Sign out;
- every route navigation starts at the top of the new view;
- drawer header stays visible while its content scrolls; Profile and Sign out stay at the end of drawer content.

## Quality policy

Run before production:

```bash
npm ci
npm run check
```

`npm run check` must describe the effective runtime, not require legacy implementations merely because they still physically exist.

GitHub Actions are not used for production. The verified release chain is:

1. validate canonical source;
2. mirror only validated runtime files to `bayouka/2b2c/4b4c/`;
3. update `4b4c/TRANSPORT_RELEASE.txt`;
4. let Cloudflare Workers Builds run `scripts/deploy-4b4c-direct.sh`;
5. that script removes Cloudflare CI Worker-name overrides, explicitly deploys `--name 4b4c`, then verifies `/health`, the shell build and mandatory production assets;
6. any failed syntax/manifest/deployment/runtime-smoke assertion must fail the Cloudflare build.

Historical one-off GitHub workflows remain archived/non-executable and must not be used for production.

## Known technical debt

- `live.js` remains a large multi-domain monolith;
- dormant legacy Messages and Resources/approval paths still physically exist in `live.js`, although mandatory route/renderer owners now supersede them in the effective runtime;
- `workflow-backend-safe-v1.js` still intercepts action, milestone, meeting and some historical delivery forms and should be reduced only after corresponding browser coverage exists;
- CSS is consolidated for loading but still originates from historical layers and contains extensive specificity/`!important` debt;
- authenticated multi-user browser E2E coverage remains incomplete because a safe dedicated E2E Auth identity lifecycle is not yet available through the connected tooling;
- remaining `SECURITY DEFINER` exposure should continue to be classified by intended API contract and least privilege.

Reduce these items incrementally behind executable checks. Do not perform a destructive rewrite of the runtime.

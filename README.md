# 4b4c

Canonical product source for the 4b4c collaborative workspace. The product is branded **2b2c** in the user interface.

## Authority and current production

Use this hierarchy when recovering, auditing or releasing 4b4c:

1. `bayouka/slyzone-motion-scapes-32` `main` — canonical product/runtime source.
2. Supabase project `wexfzhegiewhldkugtow` — authoritative production backend.
3. `bayouka/2b2c/4b4c/` — transport mirror only; never develop from it.
4. `4b4c-pilot` and the root React/Vite/V6 track in `bayouka/2b2c` — historical/non-authoritative tracks.

Current **certified** production transport release: **v4.5.12-workspace-engine-adapter-p1 / build 540**.

Current active release candidate: **v4.5.12-workspace-foundation-g1-p1 / build 544**.

Build 544 contains:
- Workspace V3 actions `0.3.0` ;
- G0 assessment + targeted human confirmation ;
- authenticated URL source registration through `register_idea_source_v1` ;
- deterministic G1 Foundation planning ;
- privileged `foundation.advance` execution with RAW-first automatic acquisition ;
- Requirement-level fingerprints, Action Run traceability and stale-safety ;
- targeted human last-mile answer through `apply_human_information_v1` only when the deterministic planner returns a dominant human action ;
- explicit `Je ne sais pas / plus tard` through `accept_idea_requirement_unknown_v1` ;
- deterministic browser idempotency keys tied to revision/content ;
- renderer marker preventing redundant MutationObserver rerenders ;
- functional Idea Engine adapter surface `workspace-engine-adapter-0.2.0` with allowlisted commands `blueprint_fit.assess` and `foundation.advance` ;
- runtime `SUPABASE_SERVICE_ROLE_KEY` provisioned as a Cloudflare Worker Secret ;
- modern Supabase secret-key handling: `sb_secret_...` is sent only in the `apikey` header, never as a Bearer token ;
- shell cache-busting aligned to Workspace actions `0.3.0` ;
- Cloudflare gate checking syntax, manifest/source SHA, G1 markers, unauthenticated rejection and deployed shell/assets.

The `/health` compatibility object still exposes the historical `idea_engine_adapter_v0_1.code=0.1.1` marker. It is temporarily preserved for compatibility and must not be used as the sole proof of the current G1 adapter surface; release gates also inspect the real adapter allowlist/tool version and runtime assets.

Build 541 was withdrawn after detecting that adapter 0.1.0 would have sent a modern `sb_secret_...` key as a Bearer token. Build 542 was superseded by 543. Build 543 was itself superseded by the G1 release candidate 544 before becoming the certified baseline.

Build 544 must not be called production-certified until the Cloudflare release/runtime smoke result is independently observable. GitHub currently receives no usable Cloudflare commit status through the available integration.

A release is production-verified only when the transport manifest matches the intended runtime, the direct Wrangler deployment targets Worker `4b4c`, and the production runtime smoke checks pass.

## Production architecture

- `site/index.html` — SPA shell.
- `site/assets/boot.js` — production bootstrap and mandatory module chain.
- `site/assets/live.js` — application shell, auth, routing, shared state and legacy/core screens.
- `site/assets/project-access-v1.js` — effective project-creation/access owner.
- `site/assets/project-messages-route-v1.js` — routes project Messages into Communication V3.
- `site/assets/delivery-workflow-v1.js` — project closure, delivery history and reopen workflow.
- `site/assets/meeting-workflow-v1.js` — effective meeting create/edit/RSVP owner using server RPC V2 workflows.
- `site/assets/work-workflow-v1.js` — effective Actions/Roadmap owner for action create/edit/status/delete and milestone create/edit.
- `site/assets/workflow-backend-safe-v1.js` — compatibility/safety bridge for remaining historical paths; not a target long-term owner.
- `site/assets/communication-workspace-v1.js` — effective messaging/communication renderer; mandatory.
- `site/assets/resources-workspace-v2.js` — effective resources, deliverables, immutable versions and approval workflow renderer; mandatory.
- `site/assets/approval-route-v1.js` — routes validation entry points from Home/My Work/project views into Resources V2.
- `site/assets/library-workspace-v1.js` — global file library enhancement.
- `site/assets/design-v5.css` — current global V5 Soft Spatial Workspace design layer, loaded last.
- `site/assets/ideas-workspace-v3-preview.js` + `.css` — parallel, feature-flagged post-capture workspace projection using the canonical R0→R7 read model; not yet default.
- `site/assets/ideas-workspace-v3-actions.js` + `.css` — additive interaction layer; version `0.3.0` supports G0, URL-source registration and deterministic G1 Foundation without service-role exposure in the browser.
- native WebRTC call logic remains in `live.js`; `site/assets/call-native-v1.css` owns its presentation.
- `src/worker.js` — Cloudflare Worker, API routes, health endpoint, SPA fallback and response hardening.
- `src/idea-engine-adapter.js` — command-allowlisted server boundary for selected `service_role only` Idea Engine capabilities; current functional surface accepts only `blueprint_fit.assess` and `foundation.advance`.
- `wrangler.jsonc` — canonical Worker configuration named `4b4c`.

Mandatory domain owners register before `workflow-backend-safe-v1.js`. Their capture-phase handlers stop the historical handlers from executing, while the old code remains physically present until authenticated browser coverage permits safe deletion.

## Backend baseline

The production migration history recovered during the 2026-09-11 audit is represented in the canonical repository through `20260909093700_revoke_public_call_heartbeat.sql` and guarded by `scripts/migration-history-check.mjs`.

The additive Idea Engine / Project Definition runtime R1→R7 and workspace-integration migrations applied on 2026-09-13 are represented canonically in `supabase/migrations/`.

Current G1 integration history is aligned through:
- `20260913063230_idea_engine_acquisition_traceability_v1` ;
- `20260913063548_idea_engine_target_fingerprints_v1` ;
- `20260913063741_idea_engine_requirement_resolution_refs_v1` ;
- `20260913064148_idea_engine_g1_foundation_planner_v1` ;
- `20260913064618_idea_engine_foundation_raw_input_v1` ;
- `20260913065006_idea_engine_action_retry_v1` ;
- `20260913070345_idea_engine_foundation_unknown_rescue_v1`.

Do not reconstruct, reorder or replay production migrations from memory. GitHub migration filenames/versions must match `supabase_migrations.schema_migrations`. New schema changes must start from the verified live/canonical baseline and preserve RLS/least-privilege invariants.

## Product contract

2b2c is a simple, complete collaborative workspace: projects, personal work, messages, meetings, roadmap, resources/files, approvals and native calls in one product. The Idea Engine adds a distinct pre-project decision layer: an Idea is matured, evidenced, challenged, prefigured and explicitly decided before any Project Definition or execution project is created.

The Home is a personal situation summary, not a generic widget dashboard. In under 10 seconds it should answer:

1. What is expected from me?
2. Who is waiting for me?
3. What changed since my last visit?
4. What is coming soon?
5. Which project should I resume, and why?

Do not add decorative dashboard gadgets that do not improve collaboration or decision-making.

For Idea Engine product authority and workspace cutover, follow `KNOWLEDGE.md`, `AGENTS.md`, `docs/idea-engine/ux/WORKSPACE_PROJECTION_CONTRACT_V1.md` and `docs/idea-engine/ux/WORKSPACE_INTEGRATION_CUTOVER_PLAN_V1.md` rather than inferring product logic from the legacy Ideas UI.

## Collaboration rules

- workspace role, project visibility and project responsibility are separate concepts;
- Team projects automatically include eligible internal members, including future eligible members;
- Restricted projects expose only explicitly selected participants plus administrative access required by the workspace model;
- a guest/client sees only explicitly shared projects/content and cannot write internal project content;
- invitations remain bound to the invited email and explicit access model;
- Actions and Roadmap writes use the server workflow APIs; action deletion remains a direct REST delete protected by `actions_delete` RLS / `can_manage_action_v1`;
- Meeting creation/edit/RSVP use `create_meeting_with_attendees_v2`, `update_meeting_v2` and `set_meeting_response_v2`;
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

Idea Engine/workspace integration changes additionally require the domain-specific deterministic/red-team harnesses documented by the owning runtime/UX contracts. The G1 adapter harness `scripts/test_workspace_privileged_adapter_v0_2.mjs` is part of the canonical check command.

GitHub Actions are not used for production. The verified release chain is:

1. validate canonical source;
2. mirror only validated runtime files to `bayouka/2b2c/4b4c/`;
3. update `4b4c/TRANSPORT_RELEASE.txt`;
4. let Cloudflare Workers Builds run `scripts/deploy-4b4c-direct.sh`;
5. that script removes Cloudflare CI Worker-name overrides, explicitly deploys `--name 4b4c`, then verifies `/health`, the shell build and mandatory production assets/API markers;
6. any failed syntax/manifest/deployment/runtime-smoke assertion must fail the Cloudflare build.

Historical one-off GitHub workflows remain archived/non-executable and must not be used for production.

## Known technical debt

- `live.js` remains a large multi-domain monolith;
- dormant legacy Messages, Resources/approval, Meeting, Work and sequential Ideas handlers still physically exist although newer owners/contracts supersede their target behavior;
- `workflow-backend-safe-v1.js` still contains compatibility implementations for several superseded forms and historical delivery/project paths;
- `ideas-orchestrator-v2.js` still renders the historical `Clarifier → Renforcer → Étayer → Partager → Décider` progression and remains compatibility-only during Workspace V3 cutover;
- action source linkage (`source_type` / `source_id`) is still applied after `create_action_v1` by an RLS-protected update rather than atomically in the create RPC;
- CSS is consolidated for loading but still originates from historical layers and contains extensive specificity/`!important` debt;
- authenticated multi-user browser E2E coverage remains incomplete because a safe dedicated E2E Auth identity lifecycle is not yet available through the connected tooling;
- build 544 runtime certification and authenticated production G1 E2E remain pending observable evidence;
- the `/health` Idea Engine adapter version marker is a compatibility marker and lags the functional G1 adapter surface ;
- G2 Evidence/Market acquisition has not yet been wired through the deterministic acquisition/action-run pattern ;
- remaining `SECURITY DEFINER` exposure should continue to be classified by intended API contract and least privilege.

Reduce these items incrementally behind executable checks. Do not perform a destructive rewrite of the runtime.

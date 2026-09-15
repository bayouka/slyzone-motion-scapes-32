# 4b4c

Canonical product source for the 4b4c collaborative workspace. The product is branded **2b2c** in the user interface.

## Authority and current production

Use this hierarchy when recovering, auditing or releasing 4b4c:

1. `bayouka/slyzone-motion-scapes-32` `main` — canonical product/runtime source.
2. Supabase project `wexfzhegiewhldkugtow` — authoritative production backend.
3. `bayouka/2b2c/4b4c/` — transport mirror only; never develop from it.
4. `4b4c-pilot` and the root React/Vite/V6 track in `bayouka/2b2c` — historical/non-authoritative tracks.

Current **runtime-certified production transport release**: **v4.5.13-workspace-evidence-g2-p5 / build 551**.

Build 551 was independently observed in production on 2026-09-15 with:
- `/health` HTTP 200 and runtime `v4.5.13-workspace-evidence-g2-p5` ;
- Cloudflare version id `4cacaaa5-628d-46e5-b2e4-e4f14a84b695` ;
- adapter `0.3.3` configured with `blueprint_fit.assess`, `foundation.advance`, `evidence.advance` ;
- `SITE_VITRINE@0.5`, G2 backend `v0.7`, promotion disposition `v0.8` ;
- explicit active health scope `g2_executor_paths=['CALC','RAW']` and `g2_user_surface='evidence-market'` ;
- `g2_ai_h_candidate='v0.1'`, `g2_ai_h_active=false`, target `SV.D03.PRIMARY_NEED`, resolution `WORKING_ASSUMPTION` ;
- shell `ideas-workspace-g2-live.js?v=1.1.0` and `boot.js?build=551` ;
- Evidence/Market surface served as **Preuves & marché** / **Approfondir les preuves** ;
- unauthenticated `evidence.advance` rejected with HTTP 401 / `UNAUTHORIZED`.

Build 549 introduced the first strict non-CALC executor (`RAW`). Build 550 temporarily exposed `AI_H`, but a subsequent contract audit found that activation exceeded the frozen V0.1 executor contract. Build 551 supersedes it by restoring the production capability boundary to `CALC + RAW` while keeping the narrower AI_H V0.1 implementation only as a tested, non-active candidate.

The active G2 execution boundary remains intentionally narrow:
- `CALC` produces deterministic `SYSTEM_CALCULATED / CALCULATED` results only where policy permits ;
- `RAW` extracts only directly supported human input with persisted-source lineage ;
- `AI_H` is **not active**; its V0.1 candidate is limited to `SV.D03.PRIMARY_NEED` and may only produce `AI_INFERRED / WORKING_ASSUMPTION` after the required authenticated activation gate is proven ;
- `SRC`, `AI_R`, `WEB`, `AUDIT`, `CONN` and `MEM` remain unavailable through the production endpoint until their executor contracts and tests exist.

The runtime must prefer an honest capability limit over fabricated evidence. An AI hypothesis is not evidence, a source locator is not source-backed proof, and a model-generated competitor is not an active competitor set without persisted evidence.

The `/health` compatibility object still exposes the historical `idea_engine_adapter_v0_1.code=0.1.1` marker. It is preserved for compatibility and must never be used as sole proof of the current adapter surface.

Build 541 was withdrawn after detecting that adapter 0.1.0 would have sent a modern `sb_secret_...` key as a Bearer token. Builds 542–550 are superseded historical cutover/release baselines.

A release is production-verified only when the transport manifest matches the intended runtime, the Cloudflare build deploys Worker `4b4c`, and production smoke checks prove `/health`, shell/assets and unauthenticated API boundaries. Authenticated user-flow claims require a real authenticated session; runtime smoke alone is not an authenticated E2E proof.

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
- `site/assets/ideas-workspace-v3-preview.js` + `.css` — parallel post-capture workspace projection using the canonical R0→R7 read model.
- `site/assets/ideas-workspace-v3-actions.js` + `.css` — interaction layer `0.3.0` for G0, URL-source registration and deterministic G1 Foundation without browser service-role exposure.
- `site/assets/ideas-workspace-g2-live.js` — additive Evidence/Market interaction surface; active version `1.1.0` hides internal G2/test jargon and exposes only user-relevant evidence work.
- native WebRTC call logic remains in `live.js`; `site/assets/call-native-v1.css` owns its presentation.
- `src/worker.js` — Cloudflare Worker, API routes, health endpoint, SPA fallback and response hardening.
- `src/idea-engine-adapter.js` — command-allowlisted server boundary for G0/G1 privileged capabilities.
- `src/idea-evidence-endpoint.js` — authenticated server boundary for `evidence.advance`; verifies user-scoped projection/write authority before service-role execution and is the authority for operational G2 executor capabilities.
- `src/idea-evidence-adapter-candidate.js` — G2 planner/action orchestration implementation; despite its historical filename, it is imported by the current Worker entry. Only endpoint-advertised capabilities are operational.
- `src/worker-entry.js` — observable runtime wrapper and `/health` contract for the active adapter surface.
- `wrangler.jsonc` — canonical Worker configuration named `4b4c`.

Mandatory domain owners register before `workflow-backend-safe-v1.js`. Their capture-phase handlers stop the historical handlers from executing, while old code remains physically present until authenticated browser coverage permits safe deletion.

## Backend baseline

The production migration history recovered during the 2026-09-11 audit is represented canonically and guarded by `scripts/migration-history-check.mjs`.

The additive Idea Engine / Project Definition runtime R1→R7 and workspace-integration migrations applied on 2026-09-13 remain the canonical baseline.

G1 integration history includes:
- `20260913063230_idea_engine_acquisition_traceability_v1` ;
- `20260913063548_idea_engine_target_fingerprints_v1` ;
- `20260913063741_idea_engine_requirement_resolution_refs_v1` ;
- `20260913064148_idea_engine_g1_foundation_planner_v1` ;
- `20260913064618_idea_engine_foundation_raw_input_v1` ;
- `20260913065006_idea_engine_action_retry_v1` ;
- `20260913070345_idea_engine_foundation_unknown_rescue_v1`.

Current production G2 activation/hardening includes:
- `20260915100519_activate_g2_backend_v07_blueprint_05` — activates the frozen G2 backend package and assigns new compatible Site-vitrine Ideas to Blueprint 0.5 without silently rewriting existing Ideas ;
- `20260915124420_g2_promotion_disposition_v08` — bounded classification of recoverable succeeded/unpromoted G2 runs before normal promotion vs explicit `NO_RESOLUTION` finalization.

Build 551 adds no new database migration. Its active RAW execution remains constrained by the existing G2 provenance/resolution enforcement in production Postgres and by the endpoint capability boundary. The AI_H implementation candidate is intentionally not passed by the production endpoint.

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

Idea Engine/workspace integration changes additionally require domain-specific deterministic/red-team harnesses. Current G2 checks include `scripts/test_g2_evidence_adapter_v0_1.mjs`, which covers CALC-only fallback, the active CALC+RAW endpoint boundary, write-authority and recovery wiring, strict RAW support-quote provenance, and the dormant AI_H V0.1 candidate including context-basis requirements, sensitive-context exclusion and `AI_INFERRED / WORKING_ASSUMPTION` limits. The test harness must never be interpreted as proof that a candidate path is production-active; endpoint exposure and `/health` are the operational authority.

GitHub Actions are not used for production. The verified release chain is:

1. validate canonical source;
2. mirror only validated runtime files to `bayouka/2b2c/4b4c/`;
3. byte-align effective canonical and transport runtime files used by the release;
4. update `4b4c/TRANSPORT_RELEASE.txt`;
5. let Cloudflare Workers Builds run `scripts/deploy-4b4c-direct.sh`;
6. that script removes Cloudflare CI Worker-name overrides, explicitly deploys `--name 4b4c`, then verifies `/health`, the shell build and mandatory production assets/API markers;
7. any failed syntax/manifest/deployment/runtime-smoke assertion must fail the Cloudflare build.

Historical one-off GitHub workflows remain archived/non-executable and must not be used for production.

## Known technical debt

- `live.js` remains a large multi-domain monolith;
- dormant legacy Messages, Resources/approval, Meeting, Work and sequential Ideas handlers still physically exist although newer owners/contracts supersede their target behavior;
- `workflow-backend-safe-v1.js` still contains compatibility implementations for several superseded forms and historical delivery/project paths;
- `ideas-orchestrator-v2.js` still renders the historical `Clarifier → Renforcer → Étayer → Partager → Décider` progression and remains compatibility-only during Workspace V3 cutover;
- action source linkage (`source_type` / `source_id`) is still applied after `create_action_v1` by an RLS-protected update rather than atomically in the create RPC;
- CSS is consolidated for loading but still originates from historical layers and contains extensive specificity/`!important` debt;
- authenticated multi-user browser E2E coverage remains incomplete; build 551 has runtime/API/shell/asset smoke proof but not a full authenticated G0→G1→G2 user journey proof;
- real authenticated production execution of the RAW G2 path still needs lineage inspection on a fresh `SITE_VITRINE@0.5` Idea;
- AI_H V0.1 is deliberately inactive until its authenticated fresh-Idea activation gate is proven; do not infer production capability from dormant adapter code or unit fixtures;
- `SRC`, `WEB`, `AI_R`, `AUDIT` and `CONN` executors are deliberately not operational yet; source-backed evidence must not be advertised until actual persisted source content, source lineage and atomic promotion are implemented and tested;
- the current `idea_sources` baseline persists source identity/status/hash/version/freshness metadata but does not itself provide a general persisted source-body contract for SRC extraction; this must be solved explicitly rather than extracting claims from a URL/hash alone;
- Supabase security/performance advisors still report broader historical debt (intentional SECURITY DEFINER API surfaces, leaked-password protection disabled, several RLS/index optimization notices); classify and remediate deliberately rather than mass-changing access semantics ;
- remaining `SECURITY DEFINER` exposure should continue to be classified by intended API contract and least privilege.

Reduce these items incrementally behind executable checks. Do not perform a destructive rewrite of the runtime.

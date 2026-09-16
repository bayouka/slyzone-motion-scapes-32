# 4b4c

Canonical product source for the 4b4c collaborative workspace. The product is branded **2b2c** in the user interface.

## Authority and current production

Use this hierarchy when recovering, auditing or releasing 4b4c:

1. `bayouka/slyzone-motion-scapes-32` `main` — canonical product/runtime source.
2. Supabase project `wexfzhegiewhldkugtow` — authoritative production backend.
3. `bayouka/2b2c/4b4c/` — transport mirror only; never develop from it.
4. `4b4c-pilot` and the root React/Vite/V6 track in `bayouka/2b2c` — historical/non-authoritative tracks.

Current **independently certified live Worker runtime**: **`v4.5.16-project-definition-preproject-p3` / build 556**.

Build 556 was observed live with Cloudflare version `302a9905-def9-4e0c-86ed-bd3bc3db619c` and preserves the complete Project Definition RFD p2 surface while adding the canonical pre-project bridge:
- canonical Idea adapter `0.1.0` on `/api/ideas/canonical` ;
- `G0_BLUEPRINT_FIT` ;
- `G1_IDEA_DECISION_READY` ;
- `G2_GO_PROJECT` ;
- `G3_PROJECT_BASELINE` service-side authority ;
- derived pre-project predicates `FOUNDATION_READY / EVIDENCE_READY / STRATEGY_READY / PREFIGURATION_READY / DECISION_PACKAGE_READY` ;
- decision actor injected from JWT ;
- G3 promotion deliberately not browser-exposed ;
- active Idea Blueprint `SITE_VITRINE@0.5` with legacy `SITE_VITRINE@0.4` compatibility ;
- Project Definition adapter `0.1.1` remains configured ;
- 11 Master Blueprint RFD predicates ;
- 9 pre-baseline predicates ;
- legacy project-readiness bridge `G8→G11` ;
- canonical `G4_RFD_LOT` and `G5_RFD_PROJECT` ;
- authenticated user-RLS precheck ;
- approval actor injected from JWT ;
- `service_role_browser_exposed=false` ;
- legacy `G12_READY_FOR_DEVELOPMENT` not mutated/relabelled.

The Cloudflare build 556 release gate also proved the unauthenticated boundaries fail closed:
- canonical Idea `canonical.read` → `401 / UNAUTHORIZED` without JWT ;
- canonical Idea `decision.record` → `401 / UNAUTHORIZED` without JWT ;
- Project Definition `canonical.read` → `401 / UNAUTHORIZED` without JWT.

Build history relevant to the current baseline:
- Build 549 introduced the first strict non-CALC executor (`RAW`).
- Build 550 temporarily exposed `AI_H`, then failed contract review.
- Build 551 restored the production capability boundary to `CALC + RAW`.
- Build 552 added dormant, tested SRC V0.2 infrastructure without activating SRC.
- Build 553 added the isolated strictly-public source-fetch service boundary while keeping SRC inactive.
- Build 554 introduced the authenticated Project Definition canonical RFD adapter and initial live G4/G5 runtime surface.
- Build 555 completed the RFD predicate surface exposed by adapter `0.1.1`: 11 RFD predicates, 9 pre-baseline predicates and G8→G11 readiness bridge.
- Build 556 activated the canonical pre-project Worker bridge G0→G3 while preserving the certified G4/G5 surface.

The active G2 execution boundary remains intentionally narrow:
- `CALC` produces deterministic `SYSTEM_CALCULATED / CALCULATED` results only where policy permits ;
- `RAW` extracts only directly supported human input with persisted-source lineage ;
- `AI_H` is **not active**; its V0.1 candidate is limited to `SV.D03.PRIMARY_NEED` and may only produce `AI_INFERRED / WORKING_ASSUMPTION` after the required authenticated activation gate is proven ;
- `SRC` has dormant snapshot/pinning infrastructure plus an isolated source-fetch service/candidate path, but remains **not active** at the endpoint/planner capability boundary ;
- `AI_R`, `WEB`, `AUDIT`, `CONN` and `MEM` remain unavailable through the production endpoint until their executor contracts and tests exist.

Blueprint runtime authority must be read precisely:
- live Blueprint Fit resolution for a new accepted `SITE_VITRINE` Idea currently assigns **`SITE_VITRINE@0.5`** ;
- legitimate existing/legacy `SITE_VITRINE@0.4` Ideas remain compatibility-supported ;
- the canonical G0 bridge requires the persisted Blueprint Fit decision version to exactly match the current Idea version ;
- do not infer that a filename containing `CANDIDATE` means the live fit resolver still assigns 0.4.

The runtime must prefer an honest capability limit over fabricated evidence. An AI hypothesis is not evidence, a source locator is not source-backed proof, and a model-generated competitor is not an active competitor set without persisted evidence.

The `/health` compatibility object still exposes historical Idea Engine markers. Compatibility markers must never be used as sole proof of the current adapter/capability surface.

A release is production-verified only when the transport manifest matches the intended runtime, the Cloudflare build deploys Worker `4b4c`, and production smoke checks prove the required runtime/API boundaries. Authenticated user-flow claims require a real authenticated session; runtime health observation alone is not authenticated E2E proof.

For detailed status use:
- `docs/project-definition/runtime/G2_PRODUCTION_ACTIVATION_STATUS_20260916.md` for G2 ;
- `docs/project-definition/runtime/PROJECT_DEFINITION_RFD_PRODUCTION_STATUS_20260916.md` for canonical Delivery Lots, RFD predicates and G4/G5 ;
- `docs/project-definition/runtime/PROJECT_DEFINITION_PREPROJECT_BRIDGE_STATUS_20260916.md` for the production-certified canonical G0→G3 bridge and its remaining authenticated-E2E limitations.

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
- `site/assets/ideas-workspace-v3-actions.js` + `.css` — interaction layer for G0, URL-source registration and deterministic G1 Foundation without browser service-role exposure.
- `site/assets/ideas-workspace-g2-live.js` — additive Evidence/Market interaction surface; exposes only user-relevant evidence work.
- native WebRTC call logic remains in `live.js`; `site/assets/call-native-v1.css` owns its presentation.
- `src/worker.js` — base Cloudflare Worker, API routes, SPA fallback and response hardening.
- `src/idea-engine-adapter.js` — command-allowlisted server boundary for G0/G1 privileged capabilities.
- `src/idea-evidence-endpoint.js` — authenticated server boundary for `evidence.advance`; verifies user-scoped projection/write authority before service-role execution and is the authority for operational G2 executor capabilities.
- `src/idea-evidence-adapter-candidate.js` — G2 planner/action orchestration implementation; despite its historical filename, endpoint-advertised capabilities — not the filename — define operational scope.
- `src/idea-source-fetch-candidate.js` — dormant SRC V0.2 HTTPS fetch/canonical-text candidate with redirect, DNS/public-address, time and body-size guards.
- `src/idea-source-ingestion-candidate.js` — dormant SRC ingestion orchestrator separating URL acquisition/snapshot persistence from evidence extraction.
- `src/idea-canonical-adapter.js` — production authenticated boundary for canonical pre-project `canonical.read` and `decision.record`; G3 promotion remains deliberately not browser-exposed.
- `src/project-definition-adapter.js` — authenticated, command-allowlisted boundary for canonical Project Definition reads, Delivery Lot preparation and G4/G5 authorization; user-RLS precheck, management authority and JWT actor injection are enforced before service-role RPC execution.
- `src/worker-entry.js` — observable runtime wrapper and `/health` contract for Idea/G2/canonical pre-project/Project Definition surfaces.
- `wrangler.jsonc` — canonical main Worker configuration named `4b4c`.

Mandatory domain owners register before `workflow-backend-safe-v1.js`. Their capture-phase handlers stop historical handlers from executing, while old code remains physically present until authenticated browser coverage permits safe deletion.

## Backend baseline

The production migration history recovered during the 2026-09-11 audit is represented canonically and guarded by `scripts/migration-history-check.mjs`.

The additive Idea Engine / Project Definition runtime R1→R7 and workspace-integration migrations applied from 2026-09-13 onward remain part of the canonical baseline.

G1 integration history includes:
- `20260913063230_idea_engine_acquisition_traceability_v1` ;
- `20260913063548_idea_engine_target_fingerprints_v1` ;
- `20260913063741_idea_engine_requirement_resolution_refs_v1` ;
- `20260913064148_idea_engine_g1_foundation_planner_v1` ;
- `20260913064618_idea_engine_foundation_raw_input_v1` ;
- `20260913065006_idea_engine_action_retry_v1` ;
- `20260913070345_idea_engine_foundation_unknown_rescue_v1`.

Current production G2 backend activation/hardening includes:
- `20260915100519_activate_g2_backend_v07_blueprint_05` — activates the frozen G2 backend package and assigns new compatible Site-vitrine Ideas to Blueprint 0.5 without silently rewriting existing Ideas ;
- `20260915124420_g2_promotion_disposition_v08` — bounded classification of recoverable succeeded/unpromoted G2 runs before normal promotion vs explicit `NO_RESOLUTION` finalization ;
- `20260915164534_g2_src_snapshot_infrastructure_v02` — installs dormant, service-role-only immutable source snapshots, exact SRC Action Run source pinning, bounded input and dedicated SRC promotion guards.

Current canonical Project Definition / Master Blueprint V1 runtime includes:
- `20260916153749_project_master_blueprint_v1_core_graph_runtime` ;
- `20260916154153_project_master_blueprint_v1_delivery_lot_dependency_closure` ;
- `20260916154611_project_master_blueprint_v1_dependency_closure_predicates` ;
- `20260916155201_project_master_blueprint_v1_quality_testability_predicates` ;
- `20260916155544_project_master_blueprint_v1_baseline_handoff_predicates` ;
- `20260916155824_project_master_blueprint_v1_g4_rfd_lot` ;
- `20260916155938_project_master_blueprint_v1_g5_rfd_project` ;
- `20260916162910_project_master_blueprint_v1_g4_g5_idempotent_approval` ;
- `20260916165026_project_master_blueprint_v1_complete_rfd_predicate_set`.

Service-side canonical pre-project bridge migrations now also include:
- `20260916174121_project_master_blueprint_v1_g0_g3_preproject_bridge_p3` ;
- `20260916174307_project_master_blueprint_v1_g0_g3_preproject_bridge_p3_g0_column_fix` ;
- `20260916174852_project_master_blueprint_v1_g3_promotion_actor_hardening_p4` ;
- `20260916182111_project_master_blueprint_v1_g0_blueprint_05_compat_fix_p5`.

The canonical runtime model now covers all six Formal Gates `G0→G5`. The production Worker exposes the canonical G0→G3 read/decision surface through `/api/ideas/canonical` and the G4/G5 Project Definition surface through `/api/project-definition/engine`. Canonical G3 promotion remains server-only and deliberately absent from the browser adapter until its baseline manifest is assembled/derived server-side.

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

Idea Engine/workspace integration changes additionally require domain-specific deterministic/red-team harnesses. Current G2 checks include `scripts/test_g2_evidence_adapter_v0_1.mjs`, `scripts/test_g2_src_candidate_v0_2.mjs` and the isolated source-fetch service harness. Canonical Project Definition checks include `scripts/master-blueprint-v1-check.mjs`, `scripts/canonical-runtime-bridge-v1-check.mjs`, `scripts/project-definition-adapter-v1-check.mjs`, `scripts/idea-canonical-adapter-v1-check.mjs` and the production migration-history guard.

The certified p3 transport gate retains the prior G2/SRC/source-fetch and Project Definition checks, byte-aligns the effective Worker runtime files, exposes the canonical pre-project health contract and checks unauthenticated fail-closed boundaries. Live runtime health is **not** a substitute for a real authenticated Project Definition or Idea E2E.

GitHub Actions are not used for production. The verified release chain is:

1. validate canonical source;
2. mirror only validated runtime files to `bayouka/2b2c/4b4c/`;
3. byte-align effective canonical and transport runtime files used by the release;
4. update `4b4c/TRANSPORT_RELEASE.txt`;
5. let Cloudflare Workers Builds run `scripts/deploy-4b4c-direct.sh`;
6. that script removes Cloudflare CI Worker-name overrides, explicitly deploys `--name 4b4c`, then verifies `/health`, the shell build and mandatory production assets/API markers;
7. any failed syntax/manifest/deployment/runtime-smoke assertion must fail the Cloudflare build.

Historical/manual GitHub workflows are not the production authority and must not be substituted for this release chain.

## Known technical debt

- `live.js` remains a large multi-domain monolith;
- dormant legacy Messages, Resources/approval, Meeting, Work and sequential Ideas handlers still physically exist although newer owners/contracts supersede their target behavior;
- `workflow-backend-safe-v1.js` still contains compatibility implementations for several superseded forms and historical delivery/project paths;
- `ideas-orchestrator-v2.js` still renders the historical `Clarifier → Renforcer → Étayer → Partager → Décider` progression and remains compatibility-only during Workspace V3 cutover;
- action source linkage (`source_type` / `source_id`) is still applied after `create_action_v1` by an RLS-protected update rather than atomically in the create RPC;
- CSS is consolidated for loading but still originates from historical layers and contains extensive specificity/`!important` debt;
- authenticated multi-user browser E2E coverage remains incomplete; live p3 health proves runtime boundaries but not a full authenticated G0→G5 journey;
- production currently contains no real Idea row suitable for canonical G0→G3 E2E certification ;
- real authenticated production execution of the RAW G2 path still needs lineage inspection on a fresh `SITE_VITRINE@0.5` Idea;
- Project Definition authenticated E2E remains unproven until a real Project Definition is exercised through `/api/project-definition/engine`, including Delivery Lot creation, prepare/approve G4, idempotent/stale retry checks, project prepare/approve G5, audit inspection and confirmation that legacy Project status remains unchanged;
- canonical pre-project authenticated E2E remains unproven until a real Idea exercises `canonical.read`, G1 fingerprint binding, `decision.record`, controlled server-side G3 promotion and continuity into G4/G5 ;
- AI_H V0.1 is deliberately inactive until its authenticated fresh-Idea activation gate is proven; do not infer production capability from dormant adapter code or unit fixtures;
- SRC V0.2 has immutable source-body snapshots, exact pinning, URL acquisition/extraction candidates and an isolated source-fetch boundary, but **remains inactive** at the advertised executor boundary;
- `WEB`, `AI_R`, `AUDIT` and `CONN` executors are deliberately not operational yet and must not be advertised until their own provenance/persistence contracts pass;
- Supabase security/performance advisors still report broader historical debt; classify and remediate deliberately rather than mass-changing access semantics ;
- remaining `SECURITY DEFINER` exposure should continue to be classified by intended API contract and least privilege.

Reduce these items incrementally behind executable checks. Do not perform a destructive rewrite of the runtime.
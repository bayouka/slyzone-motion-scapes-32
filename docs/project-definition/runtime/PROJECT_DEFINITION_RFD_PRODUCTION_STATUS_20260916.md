# Project Definition canonical RFD — production status — 2026-09-16

## Status

Production backend + Worker surface are active for the canonical Project Definition RFD slice covering Delivery Lots, the seven RFD predicates, `G4_RFD_LOT` and `G5_RFD_PROJECT`.

This document records only what has been verified. It does **not** claim a complete authenticated end-to-end Project Definition journey yet.

## Live runtime observation

Live `/health` was independently observed on 2026-09-16 with:

- runtime: `v4.5.14-project-definition-rfd-p1`;
- Cloudflare version id: `b7df1aea-6565-433b-9099-e39cab19f2b4`;
- `ui_shell.project_definition_adapter_v1.code = 0.1.0`;
- route: `/api/project-definition/engine`;
- `configured = true`;
- canonical gates: `G4_RFD_LOT`, `G5_RFD_PROJECT`;
- `user_rls_precheck = true`;
- `approval_actor_from_jwt = true`;
- `service_role_browser_exposed = false`;
- `legacy_g12_mutated = false`.

The existing G2 runtime boundary remains unchanged by this release: active executor paths stay `CALC + RAW`; dormant AI_H/SRC capabilities are not activated by the Project Definition work.

## Canonical runtime coverage

Implemented service-side runtime:

- canonical Master Blueprint graph for `SITE_VITRINE@1.0-bridge-r7`;
- 28 canonical nodes;
- 33 dependency edges;
- hard-cycle rejection;
- Delivery Lots + lot-node membership;
- Dependency Closure;
- Critical TBD Closure;
- Ownership Closure;
- Quality Requirements Defined;
- Testability Ready;
- Baseline Ready;
- Handoff Integrity;
- G4 lot-level RFD authorization;
- G5 project-level RFD authorization;
- canonical gate state persistence;
- project RFD manifest persistence;
- audit events for G4/G5 approvals;
- stale-safe, idempotent approval retries.

Not implemented in this canonical runtime slice:

- `G0_BLUEPRINT_FIT`;
- `G1_IDEA_DECISION_READY`;
- `G2_GO_PROJECT`;
- `G3_PROJECT_BASELINE`.

These pre-G4 canonical gates must not be inferred from the existence of legacy Idea Engine gates.

## Security and authority boundary

The browser never receives Supabase `service_role` credentials.

For `/api/project-definition/engine`:

1. the Worker authenticates the Supabase JWT;
2. the requested Project Definition must be readable through the authenticated user's RLS-scoped `project_definitions` read path;
3. write/approval commands additionally require the actor to be either the Idea creator or an active workspace `owner`/`admin`;
4. privileged canonical RPCs are then called server-side with `service_role`;
5. G4/G5 `p_authorized_by` is always injected from `auth.user.id`; it is never accepted from the client payload.

Live ACL verification after migration `20260916162910` confirms:

- `anon`: no EXECUTE on G4/G5 approval RPCs;
- `authenticated`: no EXECUTE on G4/G5 approval RPCs;
- `service_role`: EXECUTE allowed.

## Approval idempotency and stale-safety

Migration `20260916162910_project_master_blueprint_v1_g4_g5_idempotent_approval` hardened network/UI retries.

For both G4 and G5:

- same current definition revision + same evaluation fingerprint + already approved gate -> return existing approval with `idempotent=true` and perform no second mutation;
- different definition revision -> stale rejection;
- different evaluation fingerprint -> stale readiness rejection;
- first successful approval returns `idempotent=false`.

This prevents double-click/retry failures after the baseline, handoff or project RFD manifest has already been frozen.

## Worker command surface

The authenticated command allowlist is:

- `canonical.read`;
- `delivery_lot.create`;
- `delivery_lot.readiness`;
- `delivery_lot.prepare_rfd`;
- `delivery_lot.approve_rfd`;
- `project_rfd.readiness`;
- `project_rfd.prepare`;
- `project_rfd.approve`.

The transport release gate contains unauthenticated `401 / UNAUTHORIZED` smoke assertions for these commands. During this independent verification session, the browser automation available could read `/health` but could not itself issue arbitrary custom POST requests, so do not treat that independent observation as a second execution of those eight POST smokes.

## Production migrations in this slice

- `20260916153749_project_master_blueprint_v1_core_graph_runtime`;
- `20260916154153_project_master_blueprint_v1_delivery_lot_dependency_closure`;
- `20260916154611_project_master_blueprint_v1_dependency_closure_predicates`;
- `20260916155201_project_master_blueprint_v1_quality_testability_predicates`;
- `20260916155544_project_master_blueprint_v1_baseline_handoff_predicates`;
- `20260916155824_project_master_blueprint_v1_g4_rfd_lot`;
- `20260916155938_project_master_blueprint_v1_g5_rfd_project`;
- `20260916162910_project_master_blueprint_v1_g4_g5_idempotent_approval`.

All eight versions are present in the authoritative Supabase migration history and canonically represented in GitHub.

## What is still unproven

A real authenticated production Project Definition E2E has not yet been executed because no suitable real Project Definition instance was available in the current production data during this cutover.

Therefore the following must remain explicitly **unproven**, not assumed:

- authenticated `canonical.read` against a real Project Definition;
- authenticated Delivery Lot creation through the Worker;
- end-to-end preparation of baseline + handoff through `delivery_lot.prepare_rfd`;
- real G4 approval through the Worker;
- same-fingerprint G4 retry through the Worker;
- stale G4 retry rejection through the Worker;
- project RFD manifest preparation through the Worker;
- real G5 approval through the Worker;
- same-fingerprint G5 retry through the Worker;
- confirmation from a real flow that legacy Project status remains unchanged;
- browser-level inspection of resulting audit events and frozen artifacts.

## Next certification sequence

When a fresh valid Project Definition exists, execute the following in order without bypassing the Worker:

1. authenticate as the Idea creator or workspace owner/admin;
2. `canonical.read`;
3. create one required Delivery Lot with a bounded canonical node set;
4. inspect `delivery_lot.readiness` and confirm blockers are real, not coerced;
5. resolve required canonical/R7-backed states through the normal product flow;
6. `delivery_lot.prepare_rfd`;
7. re-read readiness and capture the current evaluation fingerprint;
8. `delivery_lot.approve_rfd`;
9. repeat the exact G4 approval and confirm `idempotent=true`;
10. retry with a stale fingerprint and confirm rejection;
11. `project_rfd.prepare`;
12. re-read project readiness and capture its fingerprint;
13. `project_rfd.approve`;
14. repeat the exact G5 approval and confirm `idempotent=true`;
15. verify G4/G5 gate states, frozen baseline/handoff/RFD manifest, audit events and unchanged legacy Project status;
16. only then mark authenticated Project Definition E2E as certified.

## Authority

For this runtime slice, use together:

- `docs/project-definition/machine/MASTER_BLUEPRINT_V1.json`;
- `docs/project-definition/machine/CANONICAL_RUNTIME_BRIDGE_V1.json`;
- `scripts/canonical-runtime-bridge-v1-check.mjs`;
- `src/project-definition-adapter.js`;
- the migration files listed above;
- this production-status document.

Legacy `G12_READY_FOR_DEVELOPMENT` remains compatibility evidence only and must never be relabeled as canonical G4 or G5.

# 4b4c / 2b2c — CURRENT WORK STATE — 2026-09-16

Status: **CANONICAL RESTART POINT — STABILIZATION / EXISTING PRODUCT CORRECTION**

Purpose: provide one unambiguous restart point for humans and AI agents who must continue improving the existing 4b4c/2b2c product without reopening already-settled architecture or adding new product scope prematurely.

This file does not replace `README.md` for the current certified runtime/build. It defines the current work boundary and sequencing.

## Current release boundary

Verified production at the end of this pass is still:

- runtime `v4.5.17-project-definition-g3-derived-p4` ;
- build 557 authority remains current until a newer runtime is independently observed ;
- G2 executor surface remains `CALC + RAW` ;
- `SRC=false` and `AI_H=false` ;
- Project Definition canonical gates remain `G4_RFD_LOT / G5_RFD_PROJECT` ;
- legacy G12 remains non-authoritative/non-mutated.

A stabilization release is **prepared but not yet production-certified**:

- target runtime `v4.5.18-stabilization-legacy-cutover-p1` ;
- target transport build 558 ;
- target source SHA `4b4d88e8fcdc88a67a752bcdadcc3d7e5c492945` ;
- shell removes the bootstrap of `ideas-final-decision-v1.js` ;
- shell loads `ideas-canonical-bridge-v1.js@1.0.0` ;
- release gate explicitly prevents G2/G3/G4/G5 capability widening and smoke-checks the deployed shell/runtime.

Do not update `README.md` to build 558 or claim build 558 active until `/health` and the deployed root shell independently prove the target runtime and markers.

## 1. What is closed and must not be reopened without explicit evidence

### Product / lifecycle architecture

- Canonical cross-lifecycle model is `D01→D16`.
- Canonical Formal Gates are exactly `G0→G5`.
- `READY_FOR_DEVELOPMENT` is derived through canonical G4/G5; it is never manually toggled.
- Legacy G8→G12 remain compatibility/migration evidence only.
- `Idea ≠ Project` and Project Definition exists only after explicit GO.
- Core Ontology, Blueprint Pack and Project Instance remain distinct.
- Requirement, Test and Evidence remain distinct.
- Applicability and fulfilment/readiness remain distinct.

Authority: `docs/project-definition/canonical/PROJECT_MASTER_BLUEPRINT_V1.md`.

### Runtime authority

- Canonical source repository: `bayouka/slyzone-motion-scapes-32/main`.
- Production backend: Supabase `wexfzhegiewhldkugtow`.
- Transport repository/mirror is not the development source.
- Dynamic production build/runtime identity is read from root `README.md` only.
- Cloudflare remains the normal release path.
- Remote Desktop Commander is not a normal dependency.

### Canonical Idea / Project Definition path

The target/runtime model is now:

`Capture → G0 Blueprint Fit → G1 Idea Decision Ready → G2 explicit GO → G3 Project Baseline → Project Definition → Delivery Lots → G4 RFD Lot → G5 RFD Project`.

Canonical runtime surfaces already exist for G0→G5. Do not rebuild another parallel lifecycle.

## 2. Existing corrections already completed

The following work is considered closed unless a regression is demonstrated:

- Project Master Blueprint V1 canonical documentation + machine projection + invariant checks.
- D22→D16 migration mapping.
- legacy Requirement→canonical-domain mapping.
- canonical runtime bridge/read model.
- Core graph / Delivery Lot / Dependency Closure runtime foundations.
- D15 quality/testability and D16 baseline/handoff predicates.
- canonical G4/G5 derivation and authorization.
- canonical G0→G3 bridge and server-derived G3 promotion.
- Workspace V3 displays G4/G5 as readiness authority.
- legacy G12 is not relabelled or reused as canonical G4/G5.
- legacy browser RPC decision/conversion path is disabled.
- canonical source no longer bootstraps `ideas-final-decision-v1.js`.
- canonical source legacy decide/convert actions redirect to Workspace V3.
- build 558 transport candidate mirrors these two frontend corrections and pins them in its release gate; production activation remains to be independently certified.
- Master Blueprint canonical FK indexes added.
- Ideas-domain missing FK indexes added.
- legacy Ideas `FOR ALL` write policies split into explicit INSERT/UPDATE/DELETE policies.
- unnecessary `TRUNCATE/TRIGGER/REFERENCES` grants removed from targeted legacy Ideas tables.
- Ideas RLS `auth.uid()` init-plan warnings corrected for the targeted domain.
- service-only RLS tables without user policies verified as intentional fail-closed state.

Detailed evidence: `docs/audit/STABILIZATION_AUDIT_20260916.md`.

## 3. What is still open

These are the current problems to work on. They are not a request to invent new functionality.

### P0 — Certify build 558 or diagnose its release result

Before treating the frontend cutover correction as production-complete:

1. observe `/health` returning `v4.5.18-stabilization-legacy-cutover-p1` ;
2. verify the deployed root shell contains `ideas-canonical-bridge-v1.js?v=1.0.0` ;
3. verify the deployed root shell no longer contains `ideas-final-decision-v1.js` ;
4. verify G2 remains `CALC + RAW`, `SRC=false`, `AI_H=false` ;
5. verify canonical G4/G5 and non-mutated legacy G12 remain unchanged ;
6. only then promote build 558 into `README.md` runtime authority.

If build 558 fails, diagnose the release gate/deployment error; do not revert to an unguarded deploy path.

### P0 — Prove the real canonical journey

Production currently lacks a controlled authenticated Idea that proves the entire browser/runtime lifecycle.

Required proof:

1. create/capture one controlled Idea ;
2. exercise G0 ;
3. exercise G1 ;
4. exercise the currently active G2 capability surface ;
5. record the explicit human GO decision ;
6. promote through G3 ;
7. create/prepare the required Delivery Lot state ;
8. satisfy and authorize G4 ;
9. satisfy and authorize G5 ;
10. confirm the resulting Workspace V3 state.

This is the primary blocker before declaring the Idea→Project Definition cutover complete.

### P0 — Verify stale/idempotency behavior on real browser-callable boundaries

For the controlled Idea above, prove at least:

- stale revision rejection ;
- duplicate/retry idempotency ;
- no client-selected privileged actor ;
- no client-selected G3 baseline/diff/artifact-promotion payload ;
- no transition to canonical READY state when a required predicate is false.

### P0 — Verify Workspace V3 UX

Check the controlled canonical Idea/Project Definition on:

- desktop ;
- mobile ;
- loading/pending ;
- user-action-required ;
- failure/retry ;
- stale ;
- decision-ready ;
- post-GO Project Definition ;
- G4/G5 not-ready and ready states.

Fix existing UX inconsistencies found during this pass before new scope.

### P1 — Complete legacy Ideas retirement after equivalence proof

Still compatibility-only and not product authority:

- `ideas-orchestrator-v2.js` ;
- five-step band `Clarifier / Renforcer / Étayer / Partager / Décider` ;
- maturity `x/5` ;
- legacy `approved` / `convert` semantics where still surfaced ;
- historical Idea page ownership where Workspace V3 should replace it.

Do not delete these blindly. Remove each owner only after the controlled canonical journey proves its replacement.

### P1 — Continue privileged RPC audit by domain

The presence of `SECURITY DEFINER` is not itself a vulnerability. Classify remaining authenticated functions by domain:

1. intended user API with internal authorization ;
2. intended Worker/service-only API whose grants should be reduced ;
3. legacy/dead API candidate for retirement ;
4. actual authorization defect.

Do not mass-revoke or mass-convert functions without call-site and permission analysis.

### P1 — Public invite privacy minimization

The anonymous invitation preview currently exposes the invited e-mail address because the legacy frontend performs a client-side mismatch check and displays the target address.

Server acceptance already validates the authenticated account e-mail authoritatively.

Recommended coordinated correction:
- public preview returns only a masked/minimized e-mail hint or no full e-mail ;
- exact account/e-mail acceptance check remains server-side ;
- mismatch UX remains understandable without exposing unnecessary personal data.

Do not change only one side of this contract.

### P2 — Remaining database performance debt outside the current Ideas/Master Blueprint pass

Current Supabase Advisor residuals include a small set of unindexed FKs and RLS init-plan warnings in calls, conversations, messages, approvals, requests and meetings.

Treat them domain-by-domain. Do not remove newly-added canonical/Ideas indexes simply because they initially appear as `unused` before representative traffic exists.

## 4. Required order of work from this point

Unless a production regression demands otherwise, use this sequence:

1. **Certify/repair build 558 release** — close the source→transport→production loop for the current stabilization patch.
2. **Authenticated controlled canonical E2E** — G0→G5.
3. **Fix defects found by that E2E** — backend, adapter, projection, UX, mobile/desktop.
4. **Certify replacement ownership** — prove Workspace V3 covers the user need previously owned by legacy Ideas UI.
5. **Retire legacy owner incrementally** — one module/path at a time with rollback and checks.
6. **Finish security/privacy cleanup** — privileged RPC classification + invite privacy minimization.
7. **Finish remaining database performance cleanup by domain**.
8. **Run full existing-product regression** across Home, Projects, My Work, Messages, Meetings, Files/Resources, Approvals, Calls and Ideas/Project Definition.
9. Only then consider new product functionality.

## 5. Definition of “existing product stabilized enough to advance”

Do not call this phase complete until all of the following are true:

- current stabilization release is production-certified ;
- one authenticated Idea has traversed the real canonical G0→G5 path ;
- stale/idempotency guards were observed, not merely read in code ;
- Workspace V3 is usable on desktop and mobile for that path ;
- no user-visible decision/conversion action depends on disabled legacy RPCs ;
- no legacy UI is presented as canonical lifecycle authority ;
- migration history in GitHub matches production Supabase ;
- current canonical checks pass ;
- current release is runtime-verified through the normal Cloudflare path ;
- critical security findings are either corrected or explicitly classified with rationale ;
- no known P0 defect remains in the existing product path.

## 6. Rules for the next AI/developer

- Do not reopen D01→D16, G0→G5 or the Master Blueprint merely because legacy code uses older identifiers.
- Do not add a seventh gate or another global readiness score.
- Do not reactivate direct legacy decision/conversion RPCs in the browser.
- Do not expose service-role secrets or service-only RPCs to client code.
- Do not develop in the transport mirror except for deliberate release/transport synchronization from canonical source.
- Do not make Remote Desktop Commander a prerequisite.
- Do not add new scope while P0 stabilization work remains.
- Prefer deleting/retiring contradictory ownership after proof rather than adding another bridge.
- Every migration applied to production must be committed under the exact Supabase migration version.
- Every claim of E2E completion must distinguish deterministic tests, runtime smoke and authenticated browser proof.

## 7. Restart instruction

When taking over the project, read in this order:

1. `README.md`
2. `KNOWLEDGE.md`
3. `docs/CURRENT_WORK_STATE_20260916.md`
4. `docs/audit/STABILIZATION_AUDIT_20260916.md`
5. `docs/idea-engine/ux/WORKSPACE_INTEGRATION_CUTOVER_PLAN_V1.md`
6. domain-specific canonical contract(s)
7. current implementation

Then continue from **P0 build 558 certification, then authenticated canonical E2E and correction of defects found**, not from conceptual redesign.

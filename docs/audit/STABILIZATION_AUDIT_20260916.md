# 4b4c / 2b2c — Stabilization audit — 2026-09-16

Status: **ACTIVE STABILIZATION — NO FEATURE EXPANSION**

Purpose: audit and improve the product/runtime that already exists before adding new product scope.

## Authority verified during this pass

- Canonical repository: `bayouka/slyzone-motion-scapes-32/main`.
- Canonical production backend: Supabase `wexfzhegiewhldkugtow` (`4b4c`).
- Current README authority reports live Worker runtime `v4.5.17-project-definition-g3-derived-p4 / build 557`.
- Canonical Idea path is G0→G3 through `/api/ideas/canonical` and Project Definition path is G4→G5 through `/api/project-definition/engine`.
- Authenticated fresh-Idea G0→G5 E2E is still not proven by the currently cited runtime certification documents.

## Verified corrections applied

### 1. Legacy final-decision bootstrap removed

`site/index.html` no longer imports `site/assets/ideas-final-decision-v1.js`.

Reason:
- that module exposed the obsolete product flow `decide_idea_v1` → `convert_idea_to_project_v1`;
- both RPCs are currently service-role/admin only and therefore cannot succeed from the browser;
- keeping the module bootstrapped produced a misleading/dead user path and a second conceptual authority beside the canonical G0→G3 model.

The file remains in Git history / repository for rollback and forensic reference; it is not runtime authority.

### 2. Legacy decision/conversion UI bridged to the canonical workspace

Added `site/assets/ideas-canonical-bridge-v1.js` and loaded it from the shell.

The bridge replaces legacy `data-idea-action="decide"` and `data-idea-action="convert"` actions with a link to:

`#/ideas/<idea_id>/workspace-v3`

This prevents the legacy UI from offering actions that are no longer browser-callable and makes the canonical workspace the destination for continued decision work.

This bridge is intentionally a stabilization layer, not a new decision implementation.

## Security findings — verified, not inferred

### Legacy decision/promotion RPCs

`decide_idea_v1(uuid,text,text)` and `convert_idea_to_project_v1(uuid,date,text[])` are `SECURITY DEFINER`, but effective EXECUTE privileges are currently limited to:

- `postgres`
- `service_role`

They are **not** executable by `authenticated` or `anon`.

This corrects an earlier high-level Advisor interpretation that appeared to include them in the authenticated surface.

### SECURITY DEFINER surface

Direct privilege measurement on production found:

- total public-schema `SECURITY DEFINER` functions: **185**
- executable by `authenticated`: **112**
- executable by `anon`: **1**

This is a large privileged surface and remains a major audit area, but it is not equivalent to 112 confirmed vulnerabilities. Functions must be evaluated by effective authorization checks and intended API role.

### Idea RPC spot checks

The following apparently risky functions were inspected and contain effective internal authorization boundaries:

- `update_idea_core_v1` → `app_private.can_write_idea(p_idea_id)`
- `set_idea_item_state_v1` → `app_private.can_write_idea(v_idea)`
- `get_idea_workspace_projection_v1` → delegates to `app_private.workspace_projection_core_v1`
- `workspace_projection_core_v1` requires `auth.uid()` and `app_private.can_access_idea(p_idea_id)` before returning the projection

No access-control defect was established in those functions during this pass.

## Product / UX inconsistencies still open

### A. Legacy Ideas UI still expresses the old five-step model

`ideas-v1.js` and `ideas-orchestrator-v2.js` still expose concepts such as:

- Clarifier / Renforcer / Étayer / Partager / Décider
- maturity `x/5`
- legacy status `approved`
- phase `convert`

These are not the canonical Master Blueprint lifecycle and must not become product authority again.

The existing cutover plan already classifies their retirement under Slice 7. Do not delete the orchestrator wholesale until canonical UX equivalence and authenticated E2E are proven.

### B. Workspace V3 readiness authority is already corrected

Current Workspace V3 Project Definition UI displays canonical:

- G4 — required Delivery Lots
- G5 — project handoff / RFD authorization

and explicitly states that legacy G8→G12 are compatibility-only and do not determine “Prêt à développer”.

Therefore the earlier concern that Workspace V3 itself still treats G8→G12 as readiness authority is **resolved in current code**. Do not regress this.

### C. Workspace V3 remains a transition surface

Direct route works at `#/ideas/<id>/workspace-v3`, but the normal legacy-to-V3 preview link is still gated by `?workspacev3=1` or localStorage `2b2c.idea.workspace.v3=1`.

Do not perform a complete cutover until the authenticated canonical flow is exercised end-to-end.

## Documentation drift

`docs/idea-engine/ux/WORKSPACE_INTEGRATION_CUTOVER_PLAN_V1.md` is stale in several status statements:

- it still labels G2 as `DESIGN PREPARED / NON ACTIVE`;
- it still centers build 544 as the release candidate;
- later production documents certify G2 backend activation at build 552 with active `CALC + RAW`;
- README authority reports current runtime build 557 with canonical G0→G5 surfaces.

Treat the Cutover Plan as historical implementation sequencing where it conflicts with newer production-status documents. Current runtime status must be taken from the dated production-status documents and README authority block.

## Data state observed during this pass

Production currently contains:

- `ideas`: **0 rows**
- approved Ideas: **0**
- converted Ideas: **0**

Therefore runtime/build certification currently does not constitute an authenticated real-Idea end-to-end proof.

## Remaining blockers before feature expansion

1. Run one controlled authenticated Idea through the canonical lifecycle, at minimum:
   - capture
   - G0 Blueprint Fit
   - G1 Foundation
   - G2 evidence path available under current capabilities
   - canonical decision record
   - G3 Project Definition promotion
   - Delivery Lot preparation
   - G4 lot authorization
   - G5 project authorization
2. Prove stale-state rejection and idempotent retry on the canonical browser-callable boundaries.
3. Verify desktop and mobile Workspace V3 states for the controlled Idea.
4. Continue privileged-RPC audit by domain; classify each authenticated `SECURITY DEFINER` as intended user API, internal/service-only candidate, or legacy retirement candidate.
5. Only after E2E equivalence, retire legacy Ideas orchestration authority (`ideas-orchestrator-v2`, five-step band, maturity 5/5, legacy decision guards) according to Slice 7.

## Rule for the next implementation pass

Until the above blockers are cleared, changes should be limited to:

- bug fixes;
- contradictory/dead path removal;
- authorization hardening;
- documentation correction;
- E2E/testability work;
- performance/indexing fixes that are justified by the canonical runtime.

Do not add new product functionality during this stabilization phase.

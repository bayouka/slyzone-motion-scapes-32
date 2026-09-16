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

### 3. Canonical Master Blueprint FK indexes hardened

Production migration:

`20260916200421_project_master_blueprint_v1_fk_index_hardening`

Covering indexes were added only for missing foreign-key access paths in the canonical G3/G4/G5 runtime (`project_baseline_freezes_v1`, canonical gate states, conflicts, Delivery Lots/nodes, dependency target edges, handoff manifests, ownership assignments and RFD manifests).

Supabase Advisor result:

- unindexed FK findings before this stabilization pass: **27**
- after canonical Master Blueprint indexing: **12**
- no remaining unindexed-FK finding on the new `app_private` Master Blueprint tables.

### 4. Legacy Ideas RLS ambiguity removed

Production migration:

`20260916200618_ideas_legacy_rls_policy_split_v1`

The legacy `*_write` policies on:

- `idea_decisions`
- `idea_item_votes`
- `idea_items`
- `idea_members`
- `idea_reviews`

were `FOR ALL`, so they unintentionally participated in SELECT evaluation alongside dedicated SELECT policies. They were replaced with explicit INSERT / UPDATE / DELETE policies preserving the same authorization predicates.

Result: the Advisor `multiple_permissive_policies` findings for these tables disappeared without widening access.

### 5. Unnecessary legacy Ideas table privileges removed

Production migration:

`20260916200626_ideas_legacy_table_grants_hardening_v1`

Removed `TRUNCATE`, `TRIGGER` and `REFERENCES` from `anon` and `authenticated` on the five legacy Ideas tables above. Required SELECT/INSERT/UPDATE/DELETE grants were left unchanged.

### 6. Ideas FK indexes hardened

Production migration:

`20260916201046_ideas_fk_index_hardening_v1`

Added covering indexes for the remaining relevant Idea-engine foreign keys on AI runs, information requirement refs, question answers, source snapshots, team feedback and Idea→conversation.

Supabase Advisor result:

- unindexed FK findings: **12 → 4**
- remaining four findings are outside the Idea/Master Blueprint stabilization domain: two Call Media tables and two `conversation_focus_members` references.

### 7. Ideas RLS auth initplans optimized

Production migration:

`20260916201151_ideas_rls_initplan_optimization_v1`

For the remaining Idea-domain policies on `ideas`, `idea_question_answers` and `idea_team_feedback`, `auth.uid()` was changed to `(select auth.uid())` without changing the authorization conditions.

Advisor result across the database:

- `auth_rls_initplan`: **21 initially → 19 after the first Ideas policy split → 11 after Idea-domain optimization**
- no remaining `auth_rls_initplan` warning on the Idea tables treated in this pass.
- the remaining 11 warnings belong to collaboration/messages/requests/comments/approvals/meetings and should be audited separately rather than mixed into the Idea stabilization change set.

## Security findings — verified, not inferred

### Legacy decision/promotion RPCs

`decide_idea_v1(uuid,text,text)` and `convert_idea_to_project_v1(uuid,date,text[])` are `SECURITY DEFINER`, but effective EXECUTE privileges are currently limited to:

- `postgres`
- `service_role`

They are **not** executable by `authenticated` or `anon`.

This is consistent with production migration `20260916193059_disable_legacy_idea_decision_conversion_v1` and corrects an earlier high-level Advisor interpretation that appeared to include them in the authenticated surface.

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

### RLS-enabled tables without policies

The four Advisor findings:

- `call_media_telemetry_v3`
- `call_media_tracks_v3`
- `idea_source_snapshots`
- `project_definition_mutation_receipts`

were checked directly. They expose table privileges only to `postgres` / `service_role`, not `anon` or `authenticated`.

Therefore RLS-with-no-policy is currently an intentional fail-closed/service-only boundary. Do **not** add user policies merely to silence the Advisor.

### Anonymous public invitation preview

`workspace_invite_public_preview(uuid)` is the only public-schema `SECURITY DEFINER` function found executable by `anon`.

Verified properties:
- invitation token defaults to `gen_random_uuid()`;
- preview lookup is token-scoped;
- expiration status is normalized;
- actual acceptance requires authentication;
- `rpc_accept_workspace_invite` re-checks that the signed-in user's email exactly matches the invitation email before membership is created.

No invitation-acceptance authorization bypass was established.

Privacy improvement still open: the anonymous preview currently returns the full invited email and the frontend uses it for a pre-check / mismatch message. The server already performs the authoritative exact-email check, so a future coordinated frontend/backend hardening should consider exposing only a masked email hint publicly and relying on the server for exact comparison. Do not change only one side of that contract.

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

## Current Advisor state after this pass

Relevant performance findings:

- unindexed foreign keys: **4**, all outside the Idea/Master Blueprint focus of this pass;
- RLS auth initplan warnings: **11**, all outside the Idea-domain policies treated here;
- legacy Ideas multiple-permissive-policy findings addressed in this pass;
- newly created indexes naturally appear as unused immediately because production has no Idea traffic yet. Do not remove them based on zero-use statistics at this stage.

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
5. Complete the coordinated privacy review of the anonymous invite preview (full email versus masked hint).
6. Only after E2E equivalence, retire legacy Ideas orchestration authority (`ideas-orchestrator-v2`, five-step band, maturity 5/5, legacy decision guards) according to Slice 7.

## Rule for the next implementation pass

Until the above blockers are cleared, changes should be limited to:

- bug fixes;
- contradictory/dead path removal;
- authorization hardening;
- documentation correction;
- E2E/testability work;
- performance/indexing fixes that are justified by the canonical runtime.

Do not add new product functionality during this stabilization phase.

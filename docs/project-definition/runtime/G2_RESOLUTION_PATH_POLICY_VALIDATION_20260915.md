# 4b4c / 2b2c — G2 Resolution Path Policy Validation — 2026-09-15

Status: **TARGETED ROLLBACK PASS — NON ACTIVE**

## Purpose

Close the acquisition-loop defect found before implementing `evidence.advance`.

The previous planner could select the first available preferred acquisition path without proving that the path could produce a resolution level accepted by the target Requirement. This could create loops such as:

`AI_H → WORKING_ASSUMPTION → EVIDENCE_QUALITY still requires CALCULATED → AI_H again`.

## Candidates validated

- `sql-candidates/G2_RESOLUTION_PATH_POLICY_V0_1.sql`
- `sql-candidates/G2_EVIDENCE_PLANNER_V0_10_RESOLUTION_SAFE.sql`

They remain candidate-only and were not migrated.

## Resolution-path policy

The policy now distinguishes:

- `resolving_paths`: may enter `eligible_system_actions` because they can directly produce a level accepted by the Requirement;
- `supportive_paths`: may provide context/input to a resolver, but are never standalone completion attempts.

A defense-in-depth helper also verifies:

`path produced levels ∩ Requirement accepted levels != ∅`.

## Path compatibility rollback test

The complete G2 package V0.3 was loaded transactionally, followed by the new policy and planner overlay.

14 assertions passed:

- `EVIDENCE_QUALITY`: `AI_H` rejected, `CALC` accepted;
- `MARKET_CONTEXT`: `WEB` rejected as resolver, `CALC` accepted;
- `PATTERN_GAP_SYNTHESIS`: `AUDIT` and `AI_H` rejected as resolvers, `AI_R` accepted;
- `RESEARCH_SUFFICIENCY`: `AI_H` rejected, `CALC` accepted;
- `COMPETITOR_SET`: `AI_H` rejected, `WEB` accepted;
- `PRIMARY_NEED`: `WEB`, `AI_H` and `RAW` remain legitimate resolving paths.

Result: **14/14 PASS**.

## Planner behavioural rollback test

A synthetic `SITE_VITRINE@0.5` Idea was created only inside the transaction. Resolver and recompute were replaced by deterministic test stubs so this campaign isolated planner path-selection semantics; resolver/recompute integration had already been validated separately.

### A — supportive path only

Target: `SV.D04.EVIDENCE_QUALITY` unresolved on basis `fp-quality`.
Available path: `AI_H` only.

Result:

- Gate: `NOT_READY`;
- `eligible_system_actions`: **0**;
- `AI_H` appears only in `supportive_capabilities`.

**PASS.**

### B — resolving path available

Available paths: `AI_H`, `CALC`.

Result:

- Gate: `NOT_READY`;
- exactly one eligible action for the target Requirement;
- selected path: `CALC`;
- `path_role=GATE_SATISFYING`;
- `AI_H` is not scheduled.

**PASS.**

### C — resolving path already promoted without resolution

A synthetic `CALC` Action Run was inserted as `succeeded + promoted_at != null` on the same Requirement and current basis, while the Requirement remained unresolved.

Result:

- no new action is scheduled for that Requirement;
- `CALC` is listed in `exhausted_resolution_paths` with `PROMOTED_WITHOUT_RESOLUTION`;
- Requirement is listed in `capability_blocked_requirements` with `RESOLUTION_PATHS_EXHAUSTED_ON_CURRENT_BASIS`.

**PASS.**

This prevents an infinite automatic rerun on an unchanged basis.

## Rollback verification

After rollback:

- `plan_idea_evidence_context_candidate_v10`: absent;
- `idea_g2_policy_v3`: absent;
- `idea_g2_path_can_resolve_v1`: absent;
- synthetic Idea fixture: absent.

No production G2 function or fixture persisted.

## Result

**G2 RESOLUTION PATH POLICY / PLANNER V0.10: TARGETED PASS.**

This validation removes the acquisition→insufficient-resolution loop blocker for the future `evidence.advance` adapter. It does not activate G2, Blueprint 0.5, or any production migration.

The remaining pre-activation hard blocker is still the real two-session concurrency proof for same Source identity/advisory locking, plus the normal release/E2E authority checks for any eventual G2 activation.

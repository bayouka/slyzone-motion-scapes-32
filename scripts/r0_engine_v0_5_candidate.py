from __future__ import annotations

import copy

import r0_engine_v0_4_candidate as prior

AUTO_PATHS = prior.AUTO_PATHS
FORMAL_HUMAN = prior.FORMAL_HUMAN
READY = prior.READY
PATH_ACTION = prior.PATH_ACTION

load_site_vitrine_blueprint = prior.load_site_vitrine_blueprint
dependency_status = prior.dependency_status
evaluate_gates = prior.evaluate_gates
plan_actions = prior.plan_actions


def compute_competitive_evidence_material(state: dict) -> bool:
    """Deterministic G2 materiality without own-output -> own-applicability loops.

    COMPETITOR_SET's existing result is deliberately NOT consulted here. Existing
    evidence remains historical/current evidence, but does not decide whether the
    Requirement is materially required for the current decision basis.
    """
    facts = state.get("facts", {}) or {}
    if prior.base._get(facts, "decision.market_comparison_required", False) is True:
        return True

    redesign = (
        prior.base._get(facts, "idea.creation_or_redesign") == "redesign"
        or prior.base._get(facts, "existing.site_url") is not None
    )
    audit_levels = prior._supplied_levels(state, "SV.D04.EXISTING_AUDIT")
    quality_levels = prior._supplied_levels(state, "SV.D04.EVIDENCE_QUALITY")
    material_market_conflict = bool(
        prior.base._get(facts, "research.material_market_conflict", False)
    )

    if material_market_conflict:
        return True

    sufficient_existing_baseline = (
        redesign
        and "OBSERVED" in audit_levels
        and "CALCULATED" in quality_levels
    )
    return not sufficient_existing_baseline


def prepare_candidate_state(state: dict) -> dict:
    prepared = copy.deepcopy(state)
    facts = prepared.setdefault("facts", {})
    research = facts.setdefault("research", {})
    # Caller/LLM-provided value is overwritten by deterministic policy.
    research["competitive_evidence_material"] = compute_competitive_evidence_material(
        prepared
    )
    return prepared


def project(blueprint: dict, state: dict) -> dict:
    prepared = prepare_candidate_state(state)
    contexts = prior.base.derive_contexts(blueprint, prepared)
    blueprint_version = blueprint["manifest"].get("blueprint_version")

    if "BLUEPRINT_MISMATCH" in contexts:
        return {
            "blueprint_mismatch": True,
            "active_contexts": sorted(contexts),
            "requirement_states": {},
            "gate_states": {},
            "eligible_system_actions": [],
            "dominant_user_action": {"type": "BLUEPRINT_REMAP"},
            "promotion_capabilities": [],
            "blueprint_version": blueprint_version,
            "projection_fingerprint": prior.base._hash(
                {"mismatch": sorted(contexts), "version": blueprint_version}
            ),
        }

    requirement_states = prior.base.resolve_requirements(
        blueprint, prepared, contexts
    )
    gate_states = prior.evaluate_gates(
        blueprint, prepared, requirement_states, contexts
    )
    actions, human = prior.plan_actions(
        blueprint, prepared, requirement_states, gate_states, contexts
    )

    promotion = []
    order = blueprint.get("gate_order", [])
    if "G7_IDEA_APPROVAL_READY" in order:
        before_approval = order[: order.index("G7_IDEA_APPROVAL_READY") + 1]
        if (
            all(
                gate_states[gate]["status"]
                in READY | {"NOT_APPLICABLE"}
                for gate in before_approval
            )
            and prepared.get("decision_path", "LAUNCH") == "LAUNCH"
        ):
            promotion.append("CREATE_PROJECT_DEFINITION_BASELINE")
    if gate_states.get("G12_READY_FOR_DEVELOPMENT", {}).get("status") == "READY":
        promotion.append("READY_FOR_DEVELOPMENT")

    projection = {
        "blueprint_mismatch": False,
        "active_contexts": sorted(contexts),
        "requirement_states": requirement_states,
        "gate_states": gate_states,
        "eligible_system_actions": actions,
        "dominant_user_action": human,
        "promotion_capabilities": promotion,
        "blueprint_version": blueprint_version,
    }
    projection["projection_fingerprint"] = prior.base._hash(
        {
            "contexts": projection["active_contexts"],
            "requirements": {
                key: value["fingerprint"]
                for key, value in requirement_states.items()
            },
            "gates": {
                key: value["status"] for key, value in gate_states.items()
            },
            "version": blueprint_version,
        }
    )
    return projection

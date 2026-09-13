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
    """Deterministic G2 materiality without own-output -> own-applicability loops."""
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


def resolve_requirements(blueprint: dict, state: dict, contexts: set[str]) -> dict:
    """Resolve state while exposing an input-basis fingerprint, not own-output hash.

    R0 fixtures may optionally provide `basis_fingerprint` / `input_fingerprint` /
    `input_refs` for root external inputs. Dependency resolution signatures propagate
    parent changes transitively to children. A Requirement's own state/levels/refs are
    intentionally excluded from its basis fingerprint.
    """
    supplied = state.get("requirements", state.get("resolutions", {}))
    result: dict[str, dict] = {}

    for requirement_id, requirement in blueprint["requirements"].items():
        applicable = prior.base.is_applicable(requirement, contexts)
        record = supplied.get(requirement_id, {}) or {}
        levels = set(record.get("levels", []))
        if not applicable:
            status = "NOT_RELEVANT"
        elif record.get("stale") or record.get("fresh") is False:
            status = "STALE"
        elif record.get("conflicted"):
            status = "CONFLICTED"
        elif record.get("accepted_unknown") or record.get("state") == "ACCEPTED_UNKNOWN":
            status = "ACCEPTED_UNKNOWN"
        elif levels:
            status = "RESOLVED"
        else:
            status = "UNRESOLVED"

        role = prior.base._authority_role(requirement)
        authority_ok = True
        if role and any(level in levels for level in {"HUMAN_DECISION", "EXPERT_SIGNOFF"}):
            authority_ok = record.get("authority_role") in {
                role,
                "USER" if role == "DECISION_OWNER" else role,
            }

        result[requirement_id] = {
            "id": requirement_id,
            "applicable": applicable,
            "status": status,
            "levels": sorted(levels),
            "authority_ok": authority_ok,
            "refs": record.get("refs", []),
            "explicit_basis": (
                record.get("basis_fingerprint")
                or record.get("input_fingerprint")
            ),
            "input_refs": record.get("input_refs", []),
        }

    basis_visiting: set[str] = set()
    signature_visiting: set[str] = set()

    def resolution_signature(requirement_id: str) -> str:
        row = result[requirement_id]
        if "resolution_signature" in row:
            return row["resolution_signature"]
        if requirement_id in signature_visiting:
            raise ValueError(f"dependency resolution cycle at {requirement_id}")
        signature_visiting.add(requirement_id)
        value = prior.base._hash(
            {
                "id": requirement_id,
                "basis": basis(requirement_id),
                "applicable": row["applicable"],
                "status": row["status"],
                "levels": row["levels"],
                "refs": row["refs"],
                "authority_ok": row["authority_ok"],
            }
        )
        row["resolution_signature"] = value
        signature_visiting.remove(requirement_id)
        return value

    def basis(requirement_id: str) -> str:
        row = result[requirement_id]
        if "fingerprint" in row:
            return row["fingerprint"]
        if requirement_id in basis_visiting:
            raise ValueError(f"dependency cycle at {requirement_id}")
        basis_visiting.add(requirement_id)
        requirement = blueprint["requirements"][requirement_id]
        dependencies = requirement.get("dependencies") or {}
        dependency_ids = [
            item
            for item in (dependencies.get("requires_all") or [])
            + (dependencies.get("requires_any") or [])
            if item in result
        ]
        payload = {
            "id": requirement_id,
            "applicable": row["applicable"],
            "explicit_basis": row["explicit_basis"],
            "input_refs": row["input_refs"],
            "dependencies": {
                item: resolution_signature(item) for item in sorted(dependency_ids)
            },
            "blueprint": blueprint["manifest"].get("blueprint_version"),
        }
        row["fingerprint"] = prior.base._hash(payload)
        basis_visiting.remove(requirement_id)
        return row["fingerprint"]

    for requirement_id in result:
        basis(requirement_id)
    for requirement_id in result:
        resolution_signature(requirement_id)

    return result


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

    requirement_states = resolve_requirements(blueprint, prepared, contexts)
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
                gate_states[gate]["status"] in READY | {"NOT_APPLICABLE"}
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
            "requirement_basis": {
                key: value["fingerprint"] for key, value in requirement_states.items()
            },
            "requirement_resolution": {
                key: value["resolution_signature"]
                for key, value in requirement_states.items()
            },
            "gates": {
                key: value["status"] for key, value in gate_states.items()
            },
            "version": blueprint_version,
        }
    )
    return projection

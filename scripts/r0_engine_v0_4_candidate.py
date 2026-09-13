from __future__ import annotations

import copy
from pathlib import Path

import r0_engine_v0_3 as base

AUTO_PATHS = base.AUTO_PATHS
FORMAL_HUMAN = base.FORMAL_HUMAN
READY = base.READY
PATH_ACTION = base.PATH_ACTION


def load_site_vitrine_blueprint(repo_root: str | Path) -> dict:
    directory = Path(repo_root) / "docs" / "project-definition" / "machine" / "site-vitrine"
    manifest = base._load(directory / "BLUEPRINT_SITE_VITRINE_V0_5_CANDIDATE.yaml")
    loaded = {name: base._load(directory / name) for name in manifest.get("load_order", [])}
    requirements = {}
    for name in (
        "REQUIREMENTS_IDEA_V0_1.yaml",
        "REQUIREMENTS_PREFIGURATION_DECISION_V0_1.yaml",
        "REQUIREMENTS_PROJECT_BUILD_V0_1.yaml",
    ):
        for requirement in loaded[name].get("requirements", []):
            requirements[requirement["id"]] = copy.deepcopy(requirement)
    override_file = next(name for name in manifest.get("load_order", []) if name.startswith("OVERRIDES_"))
    for override in loaded[override_file].get("overrides", []):
        if override.get("target") in requirements:
            base._merge(requirements[override["target"]], override.get("patch") or {})
    gates = loaded["GATES_V0_1.yaml"].get("gates", [])
    context_file = next(name for name in loaded if name.startswith("CONTEXT_OVERLAYS_"))
    return {
        "manifest": manifest,
        "contexts": loaded[context_file].get("contexts", []),
        "requirements": requirements,
        "gates": gates,
        "gate_order": [gate["id"] for gate in gates],
        "bindings": loaded["GATE_BINDINGS_V0_1.yaml"].get("bindings", {}),
        "deliverables": {
            item["id"]: item for item in loaded["DELIVERABLE_CONTRACTS_V0_1.yaml"].get("deliverables", [])
        },
    }


def _dependency_usable(row: dict | None) -> bool:
    return bool(
        row
        and row.get("applicable")
        and row.get("status") == "RESOLVED"
        and row.get("authority_ok", True)
    )


def dependency_status(requirement: dict, requirement_states: dict) -> dict:
    dependencies = requirement.get("dependencies") or {}
    requires_all = [item for item in dependencies.get("requires_all", []) if item in requirement_states]
    requires_any = [item for item in dependencies.get("requires_any", []) if item in requirement_states]
    missing = []

    for dependency_id in requires_all:
        row = requirement_states[dependency_id]
        if not row.get("applicable") or row.get("status") == "NOT_RELEVANT":
            continue
        if not _dependency_usable(row):
            missing.append(dependency_id)

    if requires_any:
        applicable = [
            dependency_id
            for dependency_id in requires_any
            if requirement_states[dependency_id].get("applicable")
            and requirement_states[dependency_id].get("status") != "NOT_RELEVANT"
        ]
        if not any(_dependency_usable(requirement_states[item]) for item in applicable):
            # If every alternative is NOT_RELEVANT, the dependent Requirement is orphaned and
            # cannot be treated as evidence-ready merely because its own payload exists.
            missing.extend(applicable or requires_any)

    return {"ready": not missing, "missing": list(dict.fromkeys(missing))}


def evaluate_gates(blueprint: dict, state: dict, requirement_states: dict, contexts: set[str]) -> dict:
    result = base.evaluate_gates(blueprint, state, requirement_states, contexts)
    decision_path = state.get("decision_path", "LAUNCH")
    allow_unknown = bool(state.get("accepted_unknown_allowed", True))
    forbidden_unknowns = set(state.get("accepted_unknown_forbidden", []))

    for gate_id, gate_state in result.items():
        if gate_state["status"] in {"NOT_APPLICABLE", "STALE"}:
            continue
        for requirement_id in base._target_ids(blueprint, gate_id, decision_path):
            requirement = blueprint["requirements"].get(requirement_id)
            row = requirement_states.get(requirement_id)
            if not requirement or not row or not row.get("applicable"):
                continue
            satisfied, _ = base._requirement_satisfies(
                requirement, row, gate_id, allow_unknown, forbidden_unknowns
            )
            if not satisfied:
                continue
            deps = dependency_status(requirement, requirement_states)
            if deps["ready"]:
                continue
            marker = f"dependency:{requirement_id}"
            if marker not in gate_state["missing"]:
                gate_state["missing"].append(marker)
            if gate_state["status"] in READY:
                gate_state["status"] = "NOT_READY"

    return result


def plan_actions(
    blueprint: dict,
    state: dict,
    requirement_states: dict,
    gate_states: dict,
    contexts: set[str],
):
    gate_id = base.current_gate(blueprint, gate_states)
    actions, human = [], []
    available = set(state.get("available_paths", AUTO_PATHS | {"HUM", "EXPERT"}))
    decision_path = state.get("decision_path", "LAUNCH")
    supplied = state.get("requirements", state.get("resolutions", {}))

    for requirement_id in base._target_ids(blueprint, gate_id, decision_path):
        requirement = blueprint["requirements"].get(requirement_id)
        requirement_state = requirement_states.get(requirement_id)
        if not requirement or not requirement_state or not requirement_state["applicable"]:
            continue
        if requirement_state["status"] in {"NOT_RELEVANT", "ACCEPTED_UNKNOWN"}:
            continue
        if not dependency_status(requirement, requirement_states)["ready"]:
            continue

        satisfied, _ = base._requirement_satisfies(
            requirement,
            requirement_state,
            gate_id,
            bool(state.get("accepted_unknown_allowed", True)),
            set(state.get("accepted_unknown_forbidden", [])),
        )
        if satisfied:
            continue

        resolution = requirement.get("resolution") or {}
        paths = resolution.get("preferred_paths") or []
        mode = resolution.get("default_human_interaction", "NONE")
        human_now = bool((supplied.get(requirement_id, {}) or {}).get("human_required"))
        auto_path = next(
            (
                path
                for path in paths
                if path in AUTO_PATHS
                and path in available
                and not base._fresh_run_exists(
                    state, requirement_id, requirement_state["fingerprint"], path
                )
            ),
            None,
        )
        if auto_path and not human_now:
            actions.append(
                {
                    "type": PATH_ACTION[auto_path],
                    "requirement_id": requirement_id,
                    "path": auto_path,
                    "gate": gate_id,
                    "target_fingerprint": requirement_state["fingerprint"],
                }
            )
            continue
        if mode == "EXPERT_SIGNOFF" and "EXPERT" in available:
            human.append(
                {
                    "type": "EXPERT",
                    "requirement_id": requirement_id,
                    "interaction": mode,
                    "why_now": gate_id,
                }
            )
            continue
        if mode in FORMAL_HUMAN or "HUM" in paths or resolution.get("human_only_reason"):
            human.append(
                {
                    "type": "HUMAN",
                    "requirement_id": requirement_id,
                    "interaction": mode if mode != "NONE" else "HUMAN_INTENT",
                    "why_now": gate_id,
                    "what_it_unlocks": (requirement.get("dependencies") or {}).get(
                        "unlocks", []
                    ),
                }
            )

    return actions, (human[0] if human else None)


def project(blueprint: dict, state: dict) -> dict:
    contexts = base.derive_contexts(blueprint, state)
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
            "projection_fingerprint": base._hash(
                {"mismatch": sorted(contexts), "version": blueprint_version}
            ),
        }

    requirement_states = base.resolve_requirements(blueprint, state, contexts)
    gate_states = evaluate_gates(blueprint, state, requirement_states, contexts)
    actions, human = plan_actions(
        blueprint, state, requirement_states, gate_states, contexts
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
            and state.get("decision_path", "LAUNCH") == "LAUNCH"
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
    projection["projection_fingerprint"] = base._hash(
        {
            "contexts": projection["active_contexts"],
            "requirements": {
                key: value["fingerprint"] for key, value in requirement_states.items()
            },
            "gates": {key: value["status"] for key, value in gate_states.items()},
            "version": blueprint_version,
        }
    )
    return projection

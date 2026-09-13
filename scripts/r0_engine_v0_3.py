from __future__ import annotations

import copy
import hashlib
import json
from pathlib import Path
from typing import Any

try:
    import yaml
except ImportError as exc:
    raise RuntimeError("PyYAML required for R0 Blueprint tooling") from exc

AUTO_PATHS = {"MEM", "RAW", "SRC", "AUDIT", "CONN", "WEB", "CALC", "AI_H", "AI_R"}
FORMAL_HUMAN = {"EXPLICIT_CHOICE", "FORMAL_APPROVAL", "EXPERT_SIGNOFF"}
READY = {"READY", "READY_WITH_ACCEPTED_UNKNOWNS"}
PATH_ACTION = {
    "MEM": "REUSE_MEMORY", "RAW": "EXTRACT_RAW", "SRC": "EXTRACT_SOURCE",
    "AUDIT": "AUDIT", "CONN": "FETCH_CONNECTED", "WEB": "RESEARCH_WEB",
    "CALC": "CALCULATE", "AI_H": "INFER_HYPOTHESIS", "AI_R": "GENERATE_RECOMMENDATION",
}


def _hash(value: Any) -> str:
    raw = json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(",", ":"), default=str)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:24]


def _merge(base: dict, patch: dict) -> dict:
    for key, value in patch.items():
        if isinstance(value, dict) and isinstance(base.get(key), dict):
            _merge(base[key], value)
        else:
            base[key] = copy.deepcopy(value)
    return base


def _get(data: dict, path: str, default=None):
    current = data
    for part in path.split("."):
        if not isinstance(current, dict) or part not in current:
            return default
        current = current[part]
    return current


def _load(path: Path) -> dict:
    return yaml.safe_load(path.read_text(encoding="utf-8")) or {}


def load_site_vitrine_blueprint(repo_root: str | Path, manifest_name="BLUEPRINT_SITE_VITRINE_V0_4.yaml") -> dict:
    directory = Path(repo_root) / "docs" / "project-definition" / "machine" / "site-vitrine"
    manifest = _load(directory / manifest_name)
    loaded = {name: _load(directory / name) for name in manifest.get("load_order", [])}
    requirements = {}
    for name in (
        "REQUIREMENTS_IDEA_V0_1.yaml",
        "REQUIREMENTS_PREFIGURATION_DECISION_V0_1.yaml",
        "REQUIREMENTS_PROJECT_BUILD_V0_1.yaml",
    ):
        for requirement in loaded[name].get("requirements", []):
            requirements[requirement["id"]] = copy.deepcopy(requirement)
    for override in loaded["OVERRIDES_V0_1.yaml"].get("overrides", []):
        if override.get("target") in requirements:
            _merge(requirements[override["target"]], override.get("patch") or {})
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


def eval_predicate(predicate: Any, facts: dict) -> bool:
    if isinstance(predicate, bool):
        return predicate
    if not isinstance(predicate, dict):
        raise ValueError(f"invalid predicate: {predicate!r}")
    if "all" in predicate:
        return all(eval_predicate(value, facts) for value in predicate["all"])
    if "any" in predicate:
        return any(eval_predicate(value, facts) for value in predicate["any"])
    if "not" in predicate:
        return not eval_predicate(predicate["not"], facts)
    path = predicate.get("fact")
    if not path:
        raise ValueError(f"predicate missing fact: {predicate}")
    marker = object()
    value = _get(facts, path, marker)
    if "exists" in predicate:
        return (value is not marker) == bool(predicate["exists"])
    if value is marker:
        return False
    if "eq" in predicate:
        return value == predicate["eq"]
    if "neq" in predicate:
        return value != predicate["neq"]
    if "in" in predicate:
        return value in predicate["in"]
    if "contains" in predicate:
        try:
            return predicate["contains"] in value
        except TypeError:
            return False
    comparators = {
        "gt": lambda a, b: a > b, "gte": lambda a, b: a >= b,
        "lt": lambda a, b: a < b, "lte": lambda a, b: a <= b,
    }
    for operator, function in comparators.items():
        if operator in predicate:
            try:
                return function(value, predicate[operator])
            except TypeError:
                return False
    raise ValueError(f"unknown predicate operator: {predicate}")


def validate_context_rules(contexts: list[dict]) -> list[str]:
    errors = []

    def walk(predicate, where):
        if isinstance(predicate, bool):
            return
        if not isinstance(predicate, dict):
            errors.append(f"{where}: non-object predicate")
            return
        structural = [key for key in ("all", "any", "not") if key in predicate]
        if structural:
            if len(structural) > 1:
                errors.append(f"{where}: multiple boolean operators")
            key = structural[0]
            values = predicate[key] if key != "not" else [predicate[key]]
            if not isinstance(values, list):
                errors.append(f"{where}.{key}: must be list")
                return
            for index, value in enumerate(values):
                walk(value, f"{where}.{key}[{index}]")
            return
        if "fact" not in predicate:
            errors.append(f"{where}: missing fact")
            return
        operators = [key for key in ("exists", "eq", "neq", "in", "contains", "gt", "gte", "lt", "lte") if key in predicate]
        if len(operators) != 1:
            errors.append(f"{where}: exactly one comparator required")

    for context in contexts:
        if "rule" not in context:
            errors.append(f"{context.get('id', '?')}: missing structured rule")
        else:
            walk(context["rule"], context.get("id", "?"))
    return errors


def derive_contexts(blueprint: dict, state: dict) -> set[str]:
    active = set(state.get("explicit_contexts", []))
    base_facts = copy.deepcopy(state.get("facts", {}))
    changed = True
    while changed:
        changed = False
        facts = copy.deepcopy(base_facts)
        facts.setdefault("contexts", {})
        for context_id in active:
            facts["contexts"][context_id] = True
        for context in blueprint["contexts"]:
            context_id = context["id"]
            if context_id not in active and eval_predicate(context.get("rule", False), facts):
                active.add(context_id)
                changed = True
    return active


def is_applicable(requirement: dict, contexts: set[str]) -> bool:
    applicability = requirement.get("applicability") or {"default": "ACTIVE"}
    all_of = set(applicability.get("all_of_contexts") or [])
    any_of = set(applicability.get("any_of_contexts") or [])
    none_of = set(applicability.get("none_of_contexts") or [])
    active = applicability.get("default", "ACTIVE") == "ACTIVE"
    if applicability.get("default") == "INACTIVE":
        active = (bool(all_of) and all_of <= contexts) or (bool(any_of) and bool(any_of & contexts))
    if all_of and not all_of <= contexts:
        active = False
    if any_of and not any_of & contexts:
        active = False
    if none_of and none_of & contexts:
        active = False
    return active


def _authority_role(requirement: dict):
    value = (requirement.get("authority") or {}).get("decision_authority")
    if isinstance(value, dict):
        return value.get("role_ref") or value.get("fallback")
    return value


def _minimum(requirement: dict, gate_id: str):
    return (requirement.get("minimum_resolution_by_gate") or {}).get(gate_id)


def _level_ok(levels: set[str], minimum) -> bool:
    if minimum is None:
        return bool(levels)
    if isinstance(minimum, dict):
        if "any_of" in minimum:
            return bool(levels & set(minimum["any_of"]))
        if "at_least" in minimum:
            minimum = minimum["at_least"]
    if minimum in levels:
        return True
    implied_by = {
        "WORKING_ASSUMPTION": {"AI_RECOMMENDATION", "ACCEPTED_AS_CURRENT", "HUMAN_VALIDATED", "HUMAN_DECISION", "EXPERT_SIGNOFF", "APPROVED_FOR_PROJECT", "FROZEN_IN_DECISION_SNAPSHOT", "FROZEN_FOR_BUILD"},
        "AI_RECOMMENDATION": {"ACCEPTED_AS_CURRENT", "HUMAN_VALIDATED", "HUMAN_DECISION", "EXPERT_SIGNOFF", "APPROVED_FOR_PROJECT", "FROZEN_IN_DECISION_SNAPSHOT", "FROZEN_FOR_BUILD"},
        "ACCEPTED_AS_CURRENT": {"HUMAN_VALIDATED", "HUMAN_DECISION", "EXPERT_SIGNOFF", "APPROVED_FOR_PROJECT", "FROZEN_IN_DECISION_SNAPSHOT", "FROZEN_FOR_BUILD"},
        "HUMAN_VALIDATED": {"HUMAN_DECISION", "EXPERT_SIGNOFF", "APPROVED_FOR_PROJECT", "FROZEN_IN_DECISION_SNAPSHOT", "FROZEN_FOR_BUILD"},
        "HUMAN_DECISION": {"APPROVED_FOR_PROJECT", "FROZEN_IN_DECISION_SNAPSHOT", "FROZEN_FOR_BUILD"},
        "APPROVED_FOR_PROJECT": {"FROZEN_FOR_BUILD"},
    }
    return bool(levels & implied_by.get(str(minimum), set()))


def resolve_requirements(blueprint: dict, state: dict, contexts: set[str]) -> dict:
    supplied = state.get("requirements", state.get("resolutions", {}))
    result = {}
    for requirement_id, requirement in blueprint["requirements"].items():
        applicable = is_applicable(requirement, contexts)
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
        role = _authority_role(requirement)
        authority_ok = True
        if role and any(level in levels for level in {"HUMAN_DECISION", "EXPERT_SIGNOFF"}):
            authority_ok = record.get("authority_role") in {role, "USER" if role == "DECISION_OWNER" else role}
        result[requirement_id] = {
            "id": requirement_id, "applicable": applicable, "status": status,
            "levels": sorted(levels), "authority_ok": authority_ok, "refs": record.get("refs", []),
        }

    visiting = set()

    def fingerprint(requirement_id: str) -> str:
        row = result[requirement_id]
        if "fingerprint" in row:
            return row["fingerprint"]
        if requirement_id in visiting:
            raise ValueError(f"dependency cycle at {requirement_id}")
        visiting.add(requirement_id)
        requirement = blueprint["requirements"][requirement_id]
        dependencies = requirement.get("dependencies") or {}
        dependency_ids = [
            item for item in (dependencies.get("requires_all") or []) + (dependencies.get("requires_any") or [])
            if item in result
        ]
        payload = {
            "id": requirement_id, "status": row["status"], "levels": row["levels"], "refs": row["refs"],
            "contexts": sorted(contexts),
            "dependencies": {item: fingerprint(item) for item in sorted(dependency_ids)},
            "blueprint": blueprint["manifest"].get("blueprint_version"),
        }
        row["fingerprint"] = _hash(payload)
        visiting.remove(requirement_id)
        return row["fingerprint"]

    for requirement_id in result:
        fingerprint(requirement_id)
    return result


def _requirement_satisfies(requirement: dict, requirement_state: dict, gate_id: str, allow_unknown: bool, forbidden_unknowns: set[str]):
    if not requirement_state["applicable"] or requirement_state["status"] == "NOT_RELEVANT":
        return True, False
    if requirement_state["status"] == "ACCEPTED_UNKNOWN":
        allowed = (
            allow_unknown
            and requirement["id"] not in forbidden_unknowns
            and (requirement.get("criticality_by_gate") or {}).get(gate_id) != "BLOCKING"
        )
        return allowed, allowed
    if requirement_state["status"] != "RESOLVED" or not requirement_state["authority_ok"]:
        return False, False
    return _level_ok(set(requirement_state["levels"]), _minimum(requirement, gate_id)), False


def evaluate_gates(blueprint: dict, state: dict, requirement_states: dict, contexts: set[str]) -> dict:
    result = {}
    allow_unknown = bool(state.get("accepted_unknown_allowed", True))
    forbidden_unknowns = set(state.get("accepted_unknown_forbidden", []))
    system_conditions = set(state.get("system_conditions", []))
    ledger_conditions = set(state.get("ledger_conditions", []))
    blockers = set(state.get("blockers", []))
    deliverables = state.get("deliverables", state.get("artifacts", {}))
    decision_path = state.get("decision_path", "LAUNCH")

    for gate_id in blueprint["gate_order"]:
        binding = blueprint["bindings"].get(gate_id, {})
        applies = set(binding.get("applies_when_context") or [])
        if applies and not applies & contexts:
            result[gate_id] = {"status": "NOT_APPLICABLE", "missing": [], "stale": []}
            continue
        missing, stale, used_unknown = [], [], False
        for condition in binding.get("system_conditions") or []:
            if condition not in system_conditions:
                missing.append(f"system:{condition}")
        for condition in binding.get("ledger_conditions") or []:
            if condition not in ledger_conditions:
                missing.append(f"ledger:{condition}")
        for blocker in binding.get("blockers") or []:
            if blocker in blockers:
                missing.append(f"blocker:{blocker}")
        for required_gate in binding.get("required_gates") or []:
            if result.get(required_gate, {}).get("status") not in READY:
                missing.append(f"gate:{required_gate}")

        atom_ids = list(binding.get("required_atoms") or [])
        if binding.get("required_atoms_for_launch_path"):
            if decision_path in {"STOP", "PAUSE", "INSUFFICIENT"}:
                for condition in (binding.get("alternative_stop_path") or {}).get("ledger_conditions") or []:
                    if condition not in ledger_conditions:
                        missing.append(f"ledger:{condition}")
            else:
                atom_ids += list(binding.get("required_atoms_for_launch_path") or [])
        atom_ids += [
            requirement_id for requirement_id in (binding.get("conditional_atoms") or [])
            if requirement_id in requirement_states and requirement_states[requirement_id]["applicable"]
        ]

        for requirement_id in dict.fromkeys(atom_ids):
            requirement = blueprint["requirements"].get(requirement_id)
            requirement_state = requirement_states.get(requirement_id)
            if not requirement or not requirement_state or not requirement_state["applicable"]:
                continue
            if requirement_state["status"] == "STALE":
                stale.append(requirement_id)
                continue
            ok, unknown = _requirement_satisfies(
                requirement, requirement_state, gate_id, allow_unknown, forbidden_unknowns
            )
            used_unknown |= unknown
            if not ok:
                missing.append(f"atom:{requirement_id}")

        for deliverable_id in binding.get("required_deliverables") or []:
            deliverable = deliverables.get(deliverable_id, {}) or {}
            ready = deliverable.get("ready") is True or deliverable.get("state") == "READY"
            fresh = not deliverable.get("stale") and deliverable.get("fresh", True)
            if not ready or not fresh:
                missing.append(f"deliverable:{deliverable_id}")

        status = "STALE" if stale else (
            "NOT_READY" if missing else ("READY_WITH_ACCEPTED_UNKNOWNS" if used_unknown else "READY")
        )
        result[gate_id] = {"status": status, "missing": missing, "stale": stale}
    return result


def current_gate(blueprint: dict, gate_states: dict):
    for gate_id in blueprint["gate_order"]:
        if gate_states[gate_id]["status"] not in READY | {"NOT_APPLICABLE"}:
            return gate_id
    return blueprint["gate_order"][-1] if blueprint["gate_order"] else None


def _target_ids(blueprint: dict, gate_id: str, decision_path="LAUNCH") -> list[str]:
    binding = blueprint["bindings"].get(gate_id, {})
    ids = list(binding.get("required_atoms") or []) + list(binding.get("conditional_atoms") or [])
    if binding.get("required_atoms_for_launch_path") and decision_path not in {"STOP", "PAUSE", "INSUFFICIENT"}:
        ids += list(binding.get("required_atoms_for_launch_path") or [])
    return list(dict.fromkeys(ids))


def _fresh_run_exists(state: dict, requirement_id: str, fingerprint: str, path: str) -> bool:
    for run in state.get("action_runs", []):
        if (
            run.get("requirement_id") == requirement_id and run.get("path") == path
            and run.get("status") in {"SUCCEEDED", "COMPLETED"}
            and run.get("target_fingerprint") == fingerprint
        ):
            return True
    return False


def plan_actions(blueprint: dict, state: dict, requirement_states: dict, gate_states: dict, contexts: set[str]):
    gate_id = current_gate(blueprint, gate_states)
    actions, human = [], []
    available = set(state.get("available_paths", AUTO_PATHS | {"HUM", "EXPERT"}))
    decision_path = state.get("decision_path", "LAUNCH")
    supplied = state.get("requirements", state.get("resolutions", {}))

    for requirement_id in _target_ids(blueprint, gate_id, decision_path):
        requirement = blueprint["requirements"].get(requirement_id)
        requirement_state = requirement_states.get(requirement_id)
        if not requirement or not requirement_state or not requirement_state["applicable"]:
            continue
        if requirement_state["status"] in {"NOT_RELEVANT", "ACCEPTED_UNKNOWN"}:
            continue
        satisfied, _ = _requirement_satisfies(
            requirement, requirement_state, gate_id,
            bool(state.get("accepted_unknown_allowed", True)), set(state.get("accepted_unknown_forbidden", [])),
        )
        if satisfied:
            continue
        resolution = requirement.get("resolution") or {}
        paths = resolution.get("preferred_paths") or []
        mode = resolution.get("default_human_interaction", "NONE")
        human_now = bool((supplied.get(requirement_id, {}) or {}).get("human_required"))
        auto_path = next(
            (
                path for path in paths
                if path in AUTO_PATHS and path in available
                and not _fresh_run_exists(state, requirement_id, requirement_state["fingerprint"], path)
            ),
            None,
        )
        if auto_path and not human_now:
            actions.append({
                "type": PATH_ACTION[auto_path], "requirement_id": requirement_id,
                "path": auto_path, "gate": gate_id,
                "target_fingerprint": requirement_state["fingerprint"],
            })
            continue
        if mode == "EXPERT_SIGNOFF" and "EXPERT" in available:
            human.append({"type": "EXPERT", "requirement_id": requirement_id, "interaction": mode, "why_now": gate_id})
            continue
        if mode in FORMAL_HUMAN or "HUM" in paths or resolution.get("human_only_reason"):
            human.append({
                "type": "HUMAN", "requirement_id": requirement_id,
                "interaction": mode if mode != "NONE" else "HUMAN_INTENT",
                "why_now": gate_id,
                "what_it_unlocks": (requirement.get("dependencies") or {}).get("unlocks", []),
            })
    return actions, (human[0] if human else None)


def change_impact(blueprint: dict, changed_ids: list[str]) -> dict:
    invalidated, review, stale_artifacts = set(), set(), set()
    reverse = {requirement_id: set() for requirement_id in blueprint["requirements"]}
    for requirement_id, requirement in blueprint["requirements"].items():
        dependencies = requirement.get("dependencies") or {}
        for dependency in (dependencies.get("requires_all") or []) + (dependencies.get("requires_any") or []):
            if dependency in reverse:
                reverse[dependency].add(requirement_id)
    for requirement_id in changed_ids:
        impact = (blueprint["requirements"].get(requirement_id, {}).get("change_impact") or {})
        invalidated.update(item for item in impact.get("invalidates_atoms") or [] if item in blueprint["requirements"])
        review.update(item for item in impact.get("review_atoms") or [] if item in blueprint["requirements"])
        stale_artifacts.update(impact.get("stale_artifacts") or [])
    queue, seen = list(invalidated | review), set(invalidated | review)
    while queue:
        requirement_id = queue.pop(0)
        for child in reverse.get(requirement_id, set()):
            if child not in seen:
                review.add(child)
                seen.add(child)
                queue.append(child)
    return {
        "changed": changed_ids, "invalidated": sorted(invalidated),
        "review": sorted(review - invalidated), "stale_artifacts": sorted(stale_artifacts),
    }


def can_promote_action(run: dict, projection: dict) -> bool:
    if run.get("status") not in {"SUCCEEDED", "COMPLETED"}:
        return False
    if run.get("blueprint_version") != projection.get("blueprint_version"):
        return False
    current = projection.get("requirement_states", {})
    targets = run.get("target_fingerprints") or (
        {run["requirement_id"]: run.get("target_fingerprint")} if run.get("requirement_id") else {}
    )
    return bool(targets) and all(
        requirement_id in current and current[requirement_id]["fingerprint"] == fingerprint
        for requirement_id, fingerprint in targets.items()
    )


def snapshot_is_fresh(snapshot: dict, projection: dict) -> bool:
    return (
        snapshot.get("projection_fingerprint") == projection.get("projection_fingerprint")
        and snapshot.get("blueprint_version") == projection.get("blueprint_version")
    )


def formal_approval_allowed(snapshot: dict, projection: dict, authority_present: bool) -> bool:
    return bool(authority_present) and snapshot_is_fresh(snapshot, projection)


def build_project_baseline(snapshot: dict, artifacts: list[dict], blueprint_id: str, blueprint_version: str) -> dict:
    baseline = {
        "kind": "PROJECT_DEFINITION_BASELINE",
        "source_snapshot_id": snapshot.get("id"), "source_snapshot_hash": snapshot.get("hash"),
        "blueprint_id": blueprint_id, "blueprint_version": blueprint_version,
        "promoted_artifacts": [
            {"artifact_id": artifact.get("id"), "version": artifact.get("version"), "fingerprint": artifact.get("fingerprint")}
            for artifact in artifacts if artifact.get("fresh", True)
        ],
    }
    baseline["baseline_hash"] = _hash(baseline)
    return baseline


def project(blueprint: dict, state: dict) -> dict:
    contexts = derive_contexts(blueprint, state)
    blueprint_version = blueprint["manifest"].get("blueprint_version")
    if "BLUEPRINT_MISMATCH" in contexts:
        return {
            "blueprint_mismatch": True, "active_contexts": sorted(contexts),
            "requirement_states": {}, "gate_states": {}, "eligible_system_actions": [],
            "dominant_user_action": {"type": "BLUEPRINT_REMAP"}, "promotion_capabilities": [],
            "blueprint_version": blueprint_version,
            "projection_fingerprint": _hash({"mismatch": sorted(contexts), "version": blueprint_version}),
        }
    requirement_states = resolve_requirements(blueprint, state, contexts)
    gate_states = evaluate_gates(blueprint, state, requirement_states, contexts)
    actions, human = plan_actions(blueprint, state, requirement_states, gate_states, contexts)
    promotion = []
    order = blueprint.get("gate_order", [])
    if "G7_IDEA_APPROVAL_READY" in order:
        before_approval = order[: order.index("G7_IDEA_APPROVAL_READY") + 1]
        if (
            all(gate_states[gate]["status"] in READY | {"NOT_APPLICABLE"} for gate in before_approval)
            and state.get("decision_path", "LAUNCH") == "LAUNCH"
        ):
            promotion.append("CREATE_PROJECT_DEFINITION_BASELINE")
    if gate_states.get("G12_READY_FOR_DEVELOPMENT", {}).get("status") == "READY":
        promotion.append("READY_FOR_DEVELOPMENT")
    projection = {
        "blueprint_mismatch": False, "active_contexts": sorted(contexts),
        "requirement_states": requirement_states, "gate_states": gate_states,
        "eligible_system_actions": actions, "dominant_user_action": human,
        "promotion_capabilities": promotion, "blueprint_version": blueprint_version,
    }
    projection["projection_fingerprint"] = _hash({
        "contexts": projection["active_contexts"],
        "requirements": {key: value["fingerprint"] for key, value in requirement_states.items()},
        "gates": {key: value["status"] for key, value in gate_states.items()},
        "version": blueprint_version,
    })
    return projection

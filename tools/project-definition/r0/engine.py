from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

try:
    import yaml
except ImportError as exc:  # pragma: no cover
    raise SystemExit("PyYAML is required for R0 tooling: pip install pyyaml") from exc

READY_GATE_STATES = {"READY", "READY_WITH_ACCEPTED_UNKNOWNS"}
HUMAN_MODES = {"EXPLICIT_CHOICE", "FORMAL_APPROVAL", "EXPERT_SIGNOFF"}


def canonical_hash(value: Any) -> str:
    raw = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, default=str)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def deep_get(obj: dict, path: str, default=None):
    cur = obj
    for part in path.split("."):
        if not isinstance(cur, dict) or part not in cur:
            return default
        cur = cur[part]
    return cur


def deep_merge(base: dict, patch: dict) -> dict:
    for key, value in patch.items():
        if isinstance(value, dict) and isinstance(base.get(key), dict):
            deep_merge(base[key], value)
        else:
            base[key] = value
    return base


def eval_predicate(pred: Any, facts: dict) -> bool:
    if pred is None:
        return False
    if isinstance(pred, bool):
        return pred
    if not isinstance(pred, dict):
        raise ValueError(f"Invalid predicate: {pred!r}")
    if "all" in pred:
        return all(eval_predicate(x, facts) for x in pred["all"])
    if "any" in pred:
        return any(eval_predicate(x, facts) for x in pred["any"])
    if "not" in pred:
        return not eval_predicate(pred["not"], facts)

    path = pred.get("fact")
    if not path:
        raise ValueError(f"Predicate missing fact: {pred}")
    marker = object()
    value = deep_get(facts, path, marker)
    if "exists" in pred:
        return (value is not marker) == bool(pred["exists"])
    if value is marker:
        return False
    if "eq" in pred:
        return value == pred["eq"]
    if "neq" in pred:
        return value != pred["neq"]
    if "in" in pred:
        return value in pred["in"]
    if "contains" in pred:
        try:
            return pred["contains"] in value
        except TypeError:
            return False
    comparators = {
        "gt": lambda a, b: a > b,
        "gte": lambda a, b: a >= b,
        "lt": lambda a, b: a < b,
        "lte": lambda a, b: a <= b,
    }
    for op, fn in comparators.items():
        if op in pred:
            try:
                return fn(value, pred[op])
            except TypeError:
                return False
    raise ValueError(f"Unknown predicate operator: {pred}")


def derive_contexts(context_defs: list[dict], facts: dict) -> set[str]:
    active: set[str] = set()
    changed = True
    while changed:
        changed = False
        merged = json.loads(json.dumps(facts))
        merged.setdefault("contexts", {})
        for context_id in active:
            merged["contexts"][context_id] = True
        for context in context_defs:
            context_id = context["id"]
            if context_id not in active and eval_predicate(context.get("rule", False), merged):
                active.add(context_id)
                changed = True
    return active


def requirement_applicable(requirement: dict, contexts: set[str]) -> bool:
    applicability = requirement.get("applicability") or {"default": "ACTIVE"}
    default_active = applicability.get("default", "ACTIVE") == "ACTIVE"
    all_contexts = applicability.get("all_of_contexts") or []
    any_contexts = applicability.get("any_of_contexts") or []
    none_contexts = applicability.get("none_of_contexts") or []
    if all_contexts and not all(x in contexts for x in all_contexts):
        return False
    if any_contexts and not any(x in contexts for x in any_contexts):
        return False
    if none_contexts and any(x in contexts for x in none_contexts):
        return False
    if all_contexts or any_contexts or none_contexts:
        return True
    return default_active


def resolution_satisfies(actual: dict | None, expected: Any, allow_unknown: bool = False) -> bool:
    actual = actual or {}
    if actual.get("fresh") is False or actual.get("state") in {"STALE", "CONFLICTED", "UNRESOLVED"}:
        return False
    levels = set(actual.get("levels") or [])
    if actual.get("state") == "ACCEPTED_UNKNOWN":
        return bool(allow_unknown)
    if isinstance(expected, dict):
        if "any_of" in expected:
            return bool(levels.intersection(expected["any_of"]))
        if "at_least" in expected:
            expected = expected["at_least"]
    if not expected:
        return actual.get("state") in {"RESOLVED", "PARTIAL"} or bool(levels)
    if expected in levels:
        return True

    # Partial implication only. Source/calculated/observed dimensions are deliberately
    # not treated as interchangeable. Prefer Blueprint any_of when equivalence is intended.
    implied_by = {
        "WORKING_ASSUMPTION": {
            "AI_RECOMMENDATION", "ACCEPTED_AS_CURRENT", "HUMAN_VALIDATED",
            "HUMAN_DECISION", "EXPERT_SIGNOFF", "APPROVED_FOR_PROJECT",
            "FROZEN_IN_DECISION_SNAPSHOT", "FROZEN_FOR_BUILD",
        },
        "AI_RECOMMENDATION": {
            "ACCEPTED_AS_CURRENT", "HUMAN_VALIDATED", "HUMAN_DECISION",
            "EXPERT_SIGNOFF", "APPROVED_FOR_PROJECT", "FROZEN_IN_DECISION_SNAPSHOT",
            "FROZEN_FOR_BUILD",
        },
        "ACCEPTED_AS_CURRENT": {
            "HUMAN_VALIDATED", "HUMAN_DECISION", "EXPERT_SIGNOFF",
            "APPROVED_FOR_PROJECT", "FROZEN_IN_DECISION_SNAPSHOT", "FROZEN_FOR_BUILD",
        },
        "HUMAN_VALIDATED": {
            "HUMAN_DECISION", "EXPERT_SIGNOFF", "APPROVED_FOR_PROJECT",
            "FROZEN_IN_DECISION_SNAPSHOT", "FROZEN_FOR_BUILD",
        },
        "HUMAN_DECISION": {"APPROVED_FOR_PROJECT", "FROZEN_IN_DECISION_SNAPSHOT", "FROZEN_FOR_BUILD"},
        "APPROVED_FOR_PROJECT": {"FROZEN_FOR_BUILD"},
    }
    return bool(levels.intersection(implied_by.get(str(expected), set())))


def compute_requirement_states(requirements: dict[str, dict], contexts: set[str], resolutions: dict) -> dict:
    result = {}
    for requirement_id, requirement in requirements.items():
        if not requirement_applicable(requirement, contexts):
            result[requirement_id] = {"applicability": "NOT_RELEVANT", "resolution": "NOT_RELEVANT"}
            continue
        actual = resolutions.get(requirement_id) or {}
        result[requirement_id] = {
            "applicability": "ACTIVE",
            "resolution": actual.get("state", "UNRESOLVED"),
            "levels": actual.get("levels", []),
            "fresh": actual.get("fresh", True),
        }
    return result


def _minimum_for_gate(requirement: dict, gate_id: str):
    return (requirement.get("minimum_resolution_by_gate") or {}).get(gate_id)


def _gate_allows_unknown(requirement: dict, gate_id: str) -> bool:
    criticality = (requirement.get("criticality_by_gate") or {}).get(gate_id)
    return criticality != "BLOCKING"


def evaluate_gates(
    gates: list[dict], bindings: dict, requirements: dict[str, dict], contexts: set[str],
    resolutions: dict, system_conditions: set[str], ledger_conditions: set[str],
    deliverables: dict, blockers: set[str],
) -> dict:
    result = {}
    mismatch = "BLUEPRINT_MISMATCH" in contexts

    for gate in gates:
        gate_id = gate["id"]
        binding = bindings.get(gate_id, {})
        applies = binding.get("applies_when_context") or []
        if applies and not all(context in contexts for context in applies):
            result[gate_id] = {"state": "NOT_APPLICABLE", "blockers": []}
            continue
        if mismatch and gate_id != "G0_BLUEPRINT_FIT_SUFFICIENT":
            result[gate_id] = {"state": "NOT_APPLICABLE", "blockers": ["BLUEPRINT_MISMATCH"]}
            continue

        issues: list[str] = []
        accepted_unknown = False
        for condition in binding.get("system_conditions") or []:
            if condition not in system_conditions:
                issues.append(f"system:{condition}")
        for condition in binding.get("ledger_conditions") or []:
            if condition not in ledger_conditions:
                issues.append(f"ledger:{condition}")
        for blocker in binding.get("blockers") or []:
            if blocker in blockers:
                issues.append(f"blocker:{blocker}")
        for dependency_gate in binding.get("required_gates") or []:
            if result.get(dependency_gate, {}).get("state") not in READY_GATE_STATES:
                issues.append(f"gate:{dependency_gate}")

        atom_ids = list(binding.get("required_atoms") or [])
        atom_ids += list(binding.get("required_atoms_for_launch_path") or [])
        atom_ids += [
            rid for rid in (binding.get("conditional_atoms") or [])
            if rid in requirements and requirement_applicable(requirements[rid], contexts)
        ]

        for requirement_id in atom_ids:
            requirement = requirements.get(requirement_id)
            if requirement is None:
                issues.append(f"unknown_atom:{requirement_id}")
                continue
            if not requirement_applicable(requirement, contexts):
                continue
            actual = resolutions.get(requirement_id)
            expected = _minimum_for_gate(requirement, gate_id)
            allow_unknown = _gate_allows_unknown(requirement, gate_id)
            if actual and actual.get("state") == "ACCEPTED_UNKNOWN" and allow_unknown:
                accepted_unknown = True
            if not resolution_satisfies(actual, expected, allow_unknown):
                issues.append(f"atom:{requirement_id}")

        for deliverable_id in binding.get("required_deliverables") or []:
            deliverable = deliverables.get(deliverable_id) or {}
            if deliverable.get("state") != "READY" or deliverable.get("fresh", True) is False:
                issues.append(f"deliverable:{deliverable_id}")

        state = "NOT_READY" if issues else ("READY_WITH_ACCEPTED_UNKNOWNS" if accepted_unknown else "READY")
        result[gate_id] = {"state": state, "blockers": issues}
    return result


def reverse_dependency_graph(requirements: dict[str, dict]) -> dict[str, set[str]]:
    reverse = {requirement_id: set() for requirement_id in requirements}
    for requirement_id, requirement in requirements.items():
        dependencies = requirement.get("dependencies") or {}
        for dependency in (dependencies.get("requires_all") or []) + (dependencies.get("requires_any") or []):
            if dependency in reverse:
                reverse[dependency].add(requirement_id)
    return reverse


def compute_change_impact(requirements: dict[str, dict], changed_requirement_ids: list[str]) -> dict:
    invalidate: set[str] = set()
    review: set[str] = set()
    stale_artifacts: set[str] = set()
    for requirement_id in changed_requirement_ids:
        impact = (requirements.get(requirement_id, {}).get("change_impact") or {})
        invalidate.update(impact.get("invalidates_atoms") or [])
        review.update(impact.get("review_atoms") or [])
        stale_artifacts.update(impact.get("stale_artifacts") or [])

    reverse = reverse_dependency_graph(requirements)
    queue = list(invalidate | review)
    seen = set(queue)
    while queue:
        current = queue.pop(0)
        for child in reverse.get(current, ()):
            if child not in seen:
                review.add(child)
                seen.add(child)
                queue.append(child)

    return {
        "invalidate": sorted(invalidate),
        "review": sorted(review - invalidate),
        "stale_artifacts": sorted(stale_artifacts),
    }


def action_result_fresh(action: dict, current_fingerprints: dict[str, str]) -> bool:
    if action.get("status") != "COMPLETED":
        return False
    targets = action.get("target_fingerprints") or {}
    return all(current_fingerprints.get(key) == value for key, value in targets.items())


def dominant_user_action(requirements: dict, contexts: set[str], gate_states: dict, acquisition_availability: dict) -> dict | None:
    blocked_atoms: list[str] = []
    for gate in gate_states.values():
        if gate["state"] == "NOT_READY":
            blocked_atoms += [x.split(":", 1)[1] for x in gate["blockers"] if x.startswith("atom:")]

    for requirement_id in dict.fromkeys(blocked_atoms):
        requirement = requirements.get(requirement_id, {})
        if not requirement_applicable(requirement, contexts):
            continue
        resolution = requirement.get("resolution") or {}
        mode = resolution.get("default_human_interaction", "NONE")
        if mode == "NONE":
            continue
        paths = resolution.get("preferred_paths") or []
        non_human_paths = [p for p in paths if p not in {"HUM", "EXPERT"}]
        if any(acquisition_availability.get(path, True) for path in non_human_paths):
            continue
        if mode == "EXPERT_SIGNOFF" and acquisition_availability.get("EXPERT", False):
            return {"type": "EXPERT", "requirement_id": requirement_id, "interaction": mode}
        if mode in HUMAN_MODES or "HUM" in paths:
            return {"type": "HUMAN", "requirement_id": requirement_id, "interaction": mode}
    return None


def load_yaml(path: Path) -> dict:
    return yaml.safe_load(path.read_text(encoding="utf-8")) or {}


def load_site_vitrine_blueprint(repo_root: str | Path, manifest_name: str = "BLUEPRINT_SITE_VITRINE_V0_4.yaml") -> dict:
    root = Path(repo_root)
    directory = root / "docs" / "project-definition" / "machine" / "site-vitrine"
    manifest = load_yaml(directory / manifest_name)
    loaded = {name: load_yaml(directory / name) for name in manifest.get("load_order", [])}

    context_doc = next(doc for name, doc in loaded.items() if name.startswith("CONTEXT_OVERLAYS_"))
    gate_doc = loaded["GATES_V0_1.yaml"]
    binding_doc = loaded["GATE_BINDINGS_V0_1.yaml"]
    requirement_docs = [
        loaded["REQUIREMENTS_IDEA_V0_1.yaml"],
        loaded["REQUIREMENTS_PREFIGURATION_DECISION_V0_1.yaml"],
        loaded["REQUIREMENTS_PROJECT_BUILD_V0_1.yaml"],
    ]
    requirements = {
        requirement["id"]: requirement
        for document in requirement_docs
        for requirement in (document.get("requirements") or [])
    }
    overrides = loaded["OVERRIDES_V0_1.yaml"].get("overrides") or []
    for override in overrides:
        target = override.get("target")
        if target in requirements:
            deep_merge(requirements[target], override.get("patch") or {})

    return {
        "manifest": manifest,
        "contexts": context_doc.get("contexts") or [],
        "requirements": requirements,
        "gates": gate_doc.get("gates") or [],
        "bindings": binding_doc.get("bindings") or {},
        "deliverable_contracts": loaded["DELIVERABLE_CONTRACTS_V0_1.yaml"].get("deliverables") or [],
    }


def project(blueprint: dict, state: dict) -> dict:
    contexts = derive_contexts(blueprint["contexts"], state.get("facts", {}))
    requirements = blueprint["requirements"]
    requirement_states = compute_requirement_states(requirements, contexts, state.get("resolutions", {}))
    gate_states = evaluate_gates(
        blueprint["gates"], blueprint["bindings"], requirements, contexts,
        state.get("resolutions", {}), set(state.get("system_conditions", [])),
        set(state.get("ledger_conditions", [])), state.get("deliverables", {}),
        set(state.get("blockers", [])),
    )
    dominant = dominant_user_action(
        requirements, contexts, gate_states, state.get("acquisition_availability", {})
    )
    fingerprint = canonical_hash({
        "contexts": sorted(contexts), "requirements": requirement_states, "gates": gate_states,
    })
    return {
        "active_contexts": sorted(contexts),
        "requirement_states": requirement_states,
        "gate_states": gate_states,
        "dominant_user_action": dominant,
        "projection_fingerprint": fingerprint,
    }

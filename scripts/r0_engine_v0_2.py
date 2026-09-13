from __future__ import annotations

import copy
import hashlib
import json
from pathlib import Path
from typing import Any

try:
    import yaml
except ImportError as exc:
    raise RuntimeError("PyYAML required for Blueprint loading") from exc

AUTO_PATHS = {"MEM", "RAW", "SRC", "AUDIT", "CONN", "WEB", "CALC", "AI_H", "AI_R"}
FORMAL_HUMAN = {"EXPLICIT_CHOICE", "FORMAL_APPROVAL", "EXPERT_SIGNOFF"}


def _hash(payload: Any) -> str:
    raw = json.dumps(payload, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(raw.encode()).hexdigest()[:20]


def _merge(base: dict, patch: dict) -> dict:
    for key, value in patch.items():
        if isinstance(value, dict) and isinstance(base.get(key), dict):
            _merge(base[key], value)
        else:
            base[key] = copy.deepcopy(value)
    return base


def _get(data: dict, path: str, default=None):
    cur = data
    for part in path.split("."):
        if not isinstance(cur, dict) or part not in cur:
            return default
        cur = cur[part]
    return cur


def load_site_vitrine_blueprint(repo_root: str | Path) -> dict:
    repo_root = Path(repo_root)
    bp = repo_root / "docs" / "project-definition" / "machine" / "site-vitrine"

    def load(name: str) -> dict:
        return yaml.safe_load((bp / name).read_text(encoding="utf-8")) or {}

    manifest = load("BLUEPRINT_SITE_VITRINE_V0_3.yaml")
    requirements = {}
    for name in (
        "REQUIREMENTS_IDEA_V0_1.yaml",
        "REQUIREMENTS_PREFIGURATION_DECISION_V0_1.yaml",
        "REQUIREMENTS_PROJECT_BUILD_V0_1.yaml",
    ):
        for req in load(name).get("requirements", []):
            requirements[req["id"]] = req

    for override in load("OVERRIDES_V0_1.yaml").get("overrides", []):
        if override.get("target") in requirements:
            _merge(requirements[override["target"]], override.get("patch") or {})

    gates_list = load("GATES_V0_1.yaml").get("gates", [])
    return {
        "manifest": manifest,
        "requirements": requirements,
        "contexts": {x["id"]: x for x in load("CONTEXT_OVERLAYS_V0_1.yaml").get("contexts", [])},
        "gates": {x["id"]: x for x in gates_list},
        "gate_order": [x["id"] for x in gates_list],
        "bindings": load("GATE_BINDINGS_V0_1.yaml").get("bindings", {}),
        "deliverables": {x["id"]: x for x in load("DELIVERABLE_CONTRACTS_V0_1.yaml").get("deliverables", [])},
    }


def derive_contexts(state: dict) -> set[str]:
    facts = state.get("facts", {})
    active = set(state.get("explicit_contexts", []))
    if _get(facts, "idea.creation_or_redesign") == "redesign" or _get(facts, "existing.site_url"):
        active |= {"IS_REDESIGN", "HAS_EXISTING_SITE"}
    if _get(facts, "audience.geo_scope") == "local" or _get(facts, "offer.delivery_scope") == "local":
        active.add("IS_LOCAL_BUSINESS")
    if int(_get(facts, "required_locales.count", 1) or 1) > 1:
        active.add("IS_MULTILINGUAL")
    if _get(facts, "governance.mode") in {"team", "committee", "client"} or int(_get(facts, "governance.decision_owner_count", 1) or 1) > 1:
        active |= {"HAS_TEAM_DECISION", "NEEDS_PRESENTATION"}
    if _get(facts, "explicit.presentation_requested"):
        active.add("NEEDS_PRESENTATION")
    if any(_get(facts, path) for path in ("decision.requires_tangible_concept", "visual_change_is_material", "stakeholders_need_visual_comparison")):
        active.add("NEEDS_VISUAL_PREFIGURATION")
    if any(_get(facts, path) for path in ("new_segment", "value_prop_uncertain", "novel_critical_journey", "high_cost_irreversible_decision", "stakeholder_evidence_conflict")):
        active.add("NEEDS_CONCEPT_VALIDATION")
    if any(_get(facts, path) for path in ("committee_requires_financial_case", "budget_decision_depends_on_return")):
        active.add("NEEDS_FINANCIAL_CASE")
    if _get(facts, "explicit.cms_required") or _get(facts, "content_update_frequency") == "recurring":
        active.add("HAS_CMS")
    if any(_get(facts, path) for path in ("authentication_required", "protected_content", "multiple_user_roles")):
        active.add("HAS_AUTH_OR_ROLES")
    if int(_get(facts, "collected_personal_data.count", 0) or 0) > 0:
        active.add("HAS_PERSONAL_DATA")
    if _get(facts, "sensitive_personal_data"):
        active.add("HAS_SENSITIVE_DATA")
    if _get(facts, "integration.failure_materially_breaks_primary_journey"):
        active.add("HAS_CRITICAL_INTEGRATION")
    if "IS_REDESIGN" in active and _get(facts, "existing.organic_visibility_material"):
        active.add("SEO_MIGRATION_RISK")
    if _get(facts, "domain_change_planned"):
        active.add("DOMAIN_MIGRATION")
    if _get(facts, "has_regulatory_constraint"):
        active.add("HAS_REGULATORY_CONSTRAINT")
    if _get(facts, "brand_in_transition"):
        active.add("BRAND_IN_TRANSITION")
    if _get(facts, "budget_or_time_constrained"):
        active.add("BUDGET_OR_TIME_CONSTRAINED")
    if _get(facts, "high_trust_decision"):
        active.add("HIGH_TRUST_DECISION")
    if _get(facts, "blueprint_mismatch") or _get(facts, "project_type") in {"SAAS", "MARKETPLACE", "MOBILE_APP", "GAME"}:
        active.add("BLUEPRINT_MISMATCH")
    return active


def is_applicable(req: dict, contexts: set[str]) -> bool:
    app = req.get("applicability") or {"default": "ACTIVE"}
    all_of = set(app.get("all_of_contexts") or [])
    any_of = set(app.get("any_of_contexts") or [])
    none_of = set(app.get("none_of_contexts") or [])
    active = app.get("default", "ACTIVE") == "ACTIVE"
    if app.get("default") == "INACTIVE":
        active = (bool(all_of) and all_of.issubset(contexts)) or (bool(any_of) and bool(any_of & contexts))
    if all_of and not all_of.issubset(contexts):
        active = False
    if any_of and not (any_of & contexts):
        active = False
    if none_of and (none_of & contexts):
        active = False
    return active


def _authority_role(req: dict):
    value = (req.get("authority") or {}).get("decision_authority")
    if isinstance(value, dict):
        return value.get("role_ref") or value.get("fallback")
    return value


def _minimum(req: dict, gate_id: str):
    return (req.get("minimum_resolution_by_gate") or {}).get(gate_id)


def _level_ok(levels: set[str], minimum) -> bool:
    if minimum is None:
        return bool(levels)
    if isinstance(minimum, str):
        return minimum in levels
    if isinstance(minimum, dict):
        if "any_of" in minimum:
            return bool(levels & set(minimum["any_of"]))
        if "at_least" in minimum:
            order = ["WORKING_ASSUMPTION", "AI_RECOMMENDATION", "ACCEPTED_AS_CURRENT", "HUMAN_VALIDATED", "HUMAN_DECISION", "EXPERT_SIGNOFF"]
            target = minimum["at_least"]
            if target not in order:
                return target in levels
            return any(level in order and order.index(level) >= order.index(target) for level in levels)
    return False


def resolve_requirements(bp: dict, state: dict, contexts: set[str]) -> dict:
    supplied = state.get("requirements", {})
    out = {}
    for rid, req in bp["requirements"].items():
        applicable = is_applicable(req, contexts)
        record = supplied.get(rid, {})
        levels = set(record.get("levels", []))
        if not applicable:
            status = "NOT_RELEVANT"
        elif record.get("stale"):
            status = "STALE"
        elif record.get("conflicted"):
            status = "CONFLICTED"
        elif record.get("accepted_unknown"):
            status = "ACCEPTED_UNKNOWN"
        elif levels:
            status = "RESOLVED"
        else:
            status = "UNRESOLVED"

        role = _authority_role(req)
        authority_ok = True
        if role and any(level in levels for level in {"HUMAN_DECISION", "EXPERT_SIGNOFF"}):
            authority_ok = record.get("authority_role") == role

        fingerprint = _hash({
            "rid": rid,
            "levels": sorted(levels),
            "status": status,
            "refs": record.get("refs", []),
            "contexts": sorted(contexts),
            "blueprint": bp["manifest"].get("blueprint_version"),
        })
        out[rid] = {
            "id": rid,
            "applicable": applicable,
            "status": status,
            "levels": sorted(levels),
            "authority_ok": authority_ok,
            "fingerprint": fingerprint,
        }
    return out


def _req_satisfies(req: dict, requirement_state: dict, gate_id: str, allow_unknown: bool, forbidden_unknowns: set[str]) -> tuple[bool, bool]:
    if not requirement_state["applicable"] or requirement_state["status"] == "NOT_RELEVANT":
        return True, False
    if requirement_state["status"] == "ACCEPTED_UNKNOWN":
        allowed = allow_unknown and req.get("id") not in forbidden_unknowns
        return allowed, allowed
    if requirement_state["status"] != "RESOLVED" or not requirement_state["authority_ok"]:
        return False, False
    return _level_ok(set(requirement_state["levels"]), _minimum(req, gate_id)), False


def evaluate_gates(bp: dict, state: dict, requirement_states: dict, contexts: set[str]) -> dict:
    out = {}
    allow_unknown = bool(state.get("accepted_unknown_allowed", True))
    forbidden_unknowns = set(state.get("accepted_unknown_forbidden", []))
    system = set(state.get("system_conditions", []))
    ledgers = set(state.get("ledger_conditions", []))
    blockers = set(state.get("blockers", []))
    deliverables = state.get("deliverables", state.get("artifacts", {}))
    decision_path = state.get("decision_path", "LAUNCH")

    for gate_id in bp["gate_order"]:
        binding = bp["bindings"].get(gate_id, {})
        applies = set(binding.get("applies_when_context") or [])
        if applies and not (applies & contexts):
            out[gate_id] = {"status": "NOT_APPLICABLE", "missing": [], "stale": []}
            continue

        missing = []
        stale = []
        used_unknown = False

        for condition in binding.get("system_conditions", []) or []:
            if condition not in system:
                missing.append(f"system:{condition}")
        for condition in binding.get("ledger_conditions", []) or []:
            if condition not in ledgers:
                missing.append(f"ledger:{condition}")
        for blocker in binding.get("blockers", []) or []:
            if blocker in blockers:
                missing.append(f"blocker:{blocker}")
        for required_gate in binding.get("required_gates", []) or []:
            if out.get(required_gate, {}).get("status") not in {"READY", "READY_WITH_ACCEPTED_UNKNOWNS", "NOT_APPLICABLE"}:
                missing.append(f"gate:{required_gate}")

        atom_ids = list(binding.get("required_atoms", []) or [])
        if binding.get("required_atoms_for_launch_path"):
            if decision_path in {"STOP", "PAUSE", "INSUFFICIENT"}:
                alternative = binding.get("alternative_stop_path") or {}
                for condition in alternative.get("ledger_conditions", []) or []:
                    if condition not in ledgers:
                        missing.append(f"ledger:{condition}")
            else:
                atom_ids += list(binding.get("required_atoms_for_launch_path") or [])
        atom_ids += list(binding.get("conditional_atoms", []) or [])

        for rid in atom_ids:
            req = bp["requirements"].get(rid)
            requirement_state = requirement_states.get(rid)
            if not req or not requirement_state or not requirement_state["applicable"]:
                continue
            if requirement_state["status"] == "STALE":
                stale.append(rid)
                continue
            ok, unknown = _req_satisfies(req, requirement_state, gate_id, allow_unknown, forbidden_unknowns)
            used_unknown |= unknown
            if not ok:
                missing.append(rid)

        for deliverable_id in binding.get("required_deliverables", []) or []:
            deliverable = deliverables.get(deliverable_id, {})
            if not deliverable.get("ready") or deliverable.get("stale"):
                missing.append(f"deliverable:{deliverable_id}")

        if stale:
            status = "STALE"
        elif missing:
            status = "NOT_READY"
        elif used_unknown:
            status = "READY_WITH_ACCEPTED_UNKNOWNS"
        else:
            status = "READY"
        out[gate_id] = {"status": status, "missing": missing, "stale": stale}
    return out


def current_gate(bp: dict, gate_states: dict):
    for gate_id in bp["gate_order"]:
        if gate_states[gate_id]["status"] not in {"READY", "READY_WITH_ACCEPTED_UNKNOWNS", "NOT_APPLICABLE"}:
            return gate_id
    return bp["gate_order"][-1] if bp["gate_order"] else None


def _target_ids(bp: dict, gate_id: str) -> list[str]:
    binding = bp["bindings"].get(gate_id, {})
    ids = (binding.get("required_atoms", []) or []) + (binding.get("conditional_atoms", []) or [])
    if binding.get("required_atoms_for_launch_path"):
        ids += binding.get("required_atoms_for_launch_path") or []
    return list(dict.fromkeys(ids))


def plan_actions(bp: dict, state: dict, requirement_states: dict, gate_states: dict) -> tuple[list[dict], dict | None]:
    gate_id = current_gate(bp, gate_states)
    actions = []
    human = []
    available = set(state.get("available_paths", AUTO_PATHS))
    for rid in _target_ids(bp, gate_id):
        req = bp["requirements"].get(rid)
        requirement_state = requirement_states.get(rid)
        if not req or not requirement_state or not requirement_state["applicable"] or requirement_state["status"] in {"RESOLVED", "NOT_RELEVANT"}:
            continue
        resolution = req.get("resolution") or {}
        mode = resolution.get("default_human_interaction", "NONE")
        paths = resolution.get("preferred_paths") or []
        human_only = bool(resolution.get("human_only_reason"))
        if mode in FORMAL_HUMAN or human_only:
            human.append({
                "requirement_id": rid,
                "interaction": mode if mode != "NONE" else "HUMAN_INTENT",
                "why_now": gate_id,
                "what_it_unlocks": (req.get("dependencies") or {}).get("unlocks", []),
            })
            continue
        auto = next((path for path in paths if path in AUTO_PATHS and path in available), None)
        if auto:
            actions.append({"requirement_id": rid, "path": auto, "gate": gate_id, "fingerprint": requirement_state["fingerprint"]})
        elif "HUM" in paths or "EXPERT" in paths:
            human.append({
                "requirement_id": rid,
                "interaction": "EXPERT" if "EXPERT" in paths else "HUMAN",
                "why_now": gate_id,
                "what_it_unlocks": (req.get("dependencies") or {}).get("unlocks", []),
            })
    return actions, (human[0] if human else None)


def change_impact(bp: dict, changed_ids: list[str]) -> dict:
    invalidated = set()
    review = set()
    stale_artifacts = set()
    reverse = {rid: set() for rid in bp["requirements"]}
    for rid, req in bp["requirements"].items():
        deps = req.get("dependencies") or {}
        for dep in (deps.get("requires_all", []) or []) + (deps.get("requires_any", []) or []):
            if dep in reverse:
                reverse[dep].add(rid)

    queue = list(changed_ids)
    seen = set(queue)
    while queue:
        rid = queue.pop(0)
        req = bp["requirements"].get(rid, {})
        impact = req.get("change_impact") or {}
        for target in impact.get("invalidates_atoms", []) or []:
            if target in bp["requirements"]:
                invalidated.add(target)
        review.update(target for target in (impact.get("review_atoms", []) or []) if target in bp["requirements"])
        stale_artifacts.update(impact.get("stale_artifacts", []) or [])
        for child in reverse.get(rid, set()):
            review.add(child)
            if child not in seen:
                seen.add(child)
                queue.append(child)

    return {
        "changed": changed_ids,
        "invalidated": sorted(invalidated),
        "review": sorted(review),
        "stale_artifacts": sorted(stale_artifacts),
    }


def can_promote_action(run: dict, projection: dict) -> bool:
    if run.get("status") != "SUCCEEDED":
        return False
    if run.get("blueprint_version") != projection.get("blueprint_version"):
        return False
    current = projection.get("requirement_states", {})
    for rid, fingerprint in (run.get("target_fingerprints") or {}).items():
        if rid not in current or current[rid]["fingerprint"] != fingerprint:
            return False
    return True


def snapshot_is_fresh(snapshot: dict, projection: dict) -> bool:
    return snapshot.get("projection_fingerprint") == projection.get("projection_fingerprint") and snapshot.get("blueprint_version") == projection.get("blueprint_version")


def project(bp: dict, state: dict) -> dict:
    contexts = derive_contexts(state)
    blueprint_version = bp["manifest"].get("blueprint_version")
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
            "projection_fingerprint": _hash({"mismatch": sorted(contexts)}),
        }

    requirement_states = resolve_requirements(bp, state, contexts)
    gate_states = evaluate_gates(bp, state, requirement_states, contexts)
    actions, human = plan_actions(bp, state, requirement_states, gate_states)
    promotion = []
    gate_order = bp.get("gate_order", [])
    if "G7_IDEA_APPROVAL_READY" in gate_order:
        upto = gate_order[: gate_order.index("G7_IDEA_APPROVAL_READY") + 1]
        approval_chain_ok = all(gate_states.get(gate, {}).get("status") in {"READY", "READY_WITH_ACCEPTED_UNKNOWNS", "NOT_APPLICABLE"} for gate in upto)
        if approval_chain_ok and state.get("decision_path", "LAUNCH") == "LAUNCH":
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
    projection["projection_fingerprint"] = _hash({
        "contexts": projection["active_contexts"],
        "requirements": {key: value["fingerprint"] for key, value in requirement_states.items()},
        "gates": {key: value["status"] for key, value in gate_states.items()},
    })
    return projection

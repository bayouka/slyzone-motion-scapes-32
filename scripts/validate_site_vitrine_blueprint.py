from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path

try:
    import yaml
except ImportError as exc:
    raise SystemExit("PyYAML is required: pip install pyyaml") from exc

ROOT = Path(__file__).resolve().parents[1]
BP = ROOT / "docs" / "project-definition" / "machine" / "site-vitrine"
MANIFEST = "BLUEPRINT_SITE_VITRINE_V0_4.yaml"
errors: list[dict[str, str]] = []
warnings: list[dict[str, str]] = []


def err(code: str, message: str) -> None:
    errors.append({"code": code, "message": message})


def warn(code: str, message: str) -> None:
    warnings.append({"code": code, "message": message})


def load(name: str) -> dict:
    path = BP / name
    if not path.exists():
        err("FILE_MISSING", f"{name} is missing")
        return {}
    try:
        return yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    except Exception as exc:
        err("YAML_PARSE", f"{name}: {exc}")
        return {}


def index(items: list[dict], label: str) -> dict[str, dict]:
    ids = [item.get("id") for item in items]
    for _ in [i for i in ids if not i]:
        err("ID_MISSING", f"{label} without id")
    for item_id, count in Counter(i for i in ids if i).items():
        if count > 1:
            err("ID_DUPLICATE", f"{label} duplicate id: {item_id}")
    return {item["id"]: item for item in items if item.get("id")}


def arr(value):
    return value if isinstance(value, list) else []


def dependency_refs(req: dict):
    deps = req.get("dependencies") or {}
    for key in ("requires_all", "requires_any", "benefits_from", "conditional_on", "conflicts_with", "unlocks"):
        for ref in arr(deps.get(key)):
            yield key, ref


def context_refs(req: dict):
    app = req.get("applicability") or {}
    for key in ("all_of_contexts", "any_of_contexts", "none_of_contexts"):
        for ref in arr(app.get(key)):
            yield key, ref


def validate_predicate(predicate, where: str) -> None:
    if isinstance(predicate, bool):
        return
    if not isinstance(predicate, dict):
        err("CONTEXT_RULE_INVALID", f"{where}: predicate must be an object")
        return
    structural = [key for key in ("all", "any", "not") if key in predicate]
    if structural:
        if len(structural) != 1:
            err("CONTEXT_RULE_INVALID", f"{where}: exactly one boolean operator required")
            return
        key = structural[0]
        values = predicate[key] if key != "not" else [predicate[key]]
        if not isinstance(values, list):
            err("CONTEXT_RULE_INVALID", f"{where}.{key}: must be a list")
            return
        for idx, value in enumerate(values):
            validate_predicate(value, f"{where}.{key}[{idx}]")
        return
    if not predicate.get("fact"):
        err("CONTEXT_RULE_INVALID", f"{where}: missing fact")
        return
    operators = [key for key in ("exists", "eq", "neq", "in", "contains", "gt", "gte", "lt", "lte") if key in predicate]
    if len(operators) != 1:
        err("CONTEXT_RULE_INVALID", f"{where}: exactly one comparator required")


def cycle(graph: dict[str, list[str]]):
    visiting, visited, stack = set(), set(), []

    def visit(node):
        if node in visiting:
            return stack[stack.index(node):] + [node]
        if node in visited:
            return None
        visiting.add(node)
        stack.append(node)
        for nxt in graph.get(node, []):
            found = visit(nxt)
            if found:
                return found
        stack.pop()
        visiting.remove(node)
        visited.add(node)
        return None

    for node in graph:
        found = visit(node)
        if found:
            return found
    return None


manifest = load(MANIFEST)
load_order = arr(manifest.get("load_order"))
loaded = {name: load(name) for name in load_order}
for name in load_order:
    if not (BP / name).exists():
        err("LOAD_ORDER_MISSING", f"{name} referenced by manifest is missing")

context_name = next((name for name in load_order if name.startswith("CONTEXT_OVERLAYS_")), None)
contexts_doc = loaded.get(context_name or "", {})
gates_doc = loaded.get("GATES_V0_1.yaml", {})
bindings_doc = loaded.get("GATE_BINDINGS_V0_1.yaml", {})
deliverables_doc = loaded.get("DELIVERABLE_CONTRACTS_V0_1.yaml", {})
overrides_doc = loaded.get("OVERRIDES_V0_1.yaml", {})
req_docs = [loaded.get(name, {}) for name in (
    "REQUIREMENTS_IDEA_V0_1.yaml",
    "REQUIREMENTS_PREFIGURATION_DECISION_V0_1.yaml",
    "REQUIREMENTS_PROJECT_BUILD_V0_1.yaml",
)]
requirements = [r for doc in req_docs for r in arr(doc.get("requirements"))]
reqs = index(requirements, "requirement")
contexts = index(arr(contexts_doc.get("contexts")), "context")
gates = index(arr(gates_doc.get("gates")), "gate")
deliverables = index(arr(deliverables_doc.get("deliverables")), "deliverable")

if manifest.get("blueprint_id") != "SITE_VITRINE":
    err("MANIFEST_BLUEPRINT", f"Expected SITE_VITRINE, got {manifest.get('blueprint_id')}")
if manifest.get("blueprint_version") != "0.4":
    err("MANIFEST_VERSION", f"Expected active version 0.4, got {manifest.get('blueprint_version')}")
if not reqs:
    err("REQUIREMENTS_EMPTY", "No requirements loaded")
if not gates:
    err("GATES_EMPTY", "No gates loaded")

for context in contexts.values():
    if "rule" not in context:
        err("CONTEXT_RULE_MISSING", f"{context['id']}: missing structured rule")
    else:
        validate_predicate(context["rule"], context["id"])

for req in requirements:
    rid = req.get("id", "<unknown>")
    for field in ("type", "domain_id", "lifecycle_zone"):
        if not req.get(field):
            err(f"REQ_{field.upper()}_MISSING", f"{rid}: {field} missing")
    resolution = req.get("resolution") or {}
    if not arr(resolution.get("allowed_classes")):
        err("REQ_NO_RESOLUTION_CLASS", f"{rid}: no allowed resolution class")
    if not arr(resolution.get("preferred_paths")):
        err("REQ_NO_RESOLUTION_PATH", f"{rid}: no preferred resolution path")
    for key, ref in dependency_refs(req):
        if isinstance(ref, str) and ref.startswith("SV.") and ref not in reqs:
            err("ATOM_REF_MISSING", f"{rid}.{key} -> {ref}")
    for key, ref in context_refs(req):
        if ref not in contexts:
            err("CONTEXT_REF_MISSING", f"{rid}.{key} -> {ref}")
    for gate_id in set((req.get("criticality_by_gate") or {})) | set((req.get("minimum_resolution_by_gate") or {})):
        if gate_id not in gates:
            err("GATE_REF_MISSING", f"{rid} -> {gate_id}")
    human_mode = resolution.get("default_human_interaction")
    if human_mode in {"EXPLICIT_CHOICE", "FORMAL_APPROVAL", "EXPERT_SIGNOFF"}:
        if not (req.get("authority") or {}).get("decision_authority"):
            err("AUTHORITY_MISSING", f"{rid}: {human_mode} without decision_authority")

for gate_id, binding in (bindings_doc.get("bindings") or {}).items():
    if gate_id not in gates:
        err("BINDING_GATE_MISSING", f"Binding references unknown gate {gate_id}")
    atom_refs = arr(binding.get("required_atoms")) + arr(binding.get("conditional_atoms")) + arr(binding.get("required_atoms_for_launch_path"))
    for ref in atom_refs:
        if ref not in reqs:
            err("BINDING_ATOM_MISSING", f"{gate_id} -> {ref}")
    for ref in arr(binding.get("applies_when_context")):
        if ref not in contexts:
            err("BINDING_CONTEXT_MISSING", f"{gate_id} -> {ref}")
    for ref in arr(binding.get("required_gates")):
        if ref not in gates:
            err("BINDING_REQUIRED_GATE_MISSING", f"{gate_id} -> {ref}")
    for ref in arr(binding.get("required_deliverables")):
        if ref not in deliverables:
            err("BINDING_DELIVERABLE_MISSING", f"{gate_id} -> {ref}")

for override in arr(overrides_doc.get("overrides")):
    target = override.get("target")
    if not target:
        err("OVERRIDE_TARGET_MISSING", "Override without target")
    elif target not in reqs:
        err("OVERRIDE_TARGET_UNKNOWN", f"Override target {target} does not exist")
    if not isinstance(override.get("patch"), dict):
        err("OVERRIDE_PATCH_MISSING", f"{target}: patch missing")

for deliverable in arr(deliverables_doc.get("deliverables")):
    for ref in arr(deliverable.get("sources")):
        if isinstance(ref, str) and ref.startswith("SV.") and ref not in reqs:
            err("DELIVERABLE_SOURCE_MISSING", f"{deliverable.get('id')} -> {ref}")

graph = {}
for req in requirements:
    deps = req.get("dependencies") or {}
    refs = [ref for ref in arr(deps.get("requires_all")) + arr(deps.get("requires_any")) if isinstance(ref, str) and ref.startswith("SV.")]
    graph[req["id"]] = refs
found_cycle = cycle(graph)
if found_cycle:
    err("REQUIRES_CYCLE", " -> ".join(found_cycle))

bound = set((bindings_doc.get("bindings") or {}).keys())
for gate_id in gates:
    if gate_id not in bound:
        warn("GATE_WITHOUT_BINDING", f"{gate_id} has no explicit atom binding")

result = {
    "manifest": MANIFEST,
    "counts": {
        "requirements": len(reqs),
        "contexts": len(contexts),
        "gates": len(gates),
        "deliverables": len(deliverables),
        "overrides": len(arr(overrides_doc.get("overrides"))),
    },
    "errors": errors,
    "warnings": warnings,
}
print(json.dumps(result, indent=2, ensure_ascii=False))
sys.exit(1 if errors else 0)

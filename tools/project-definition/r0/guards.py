from __future__ import annotations

from .engine import canonical_hash


def snapshot_fresh(snapshot: dict, current_projection_fingerprint: str) -> bool:
    return (
        snapshot.get("state") == "CURRENT"
        and bool(snapshot.get("projection_fingerprint"))
        and snapshot.get("projection_fingerprint") == current_projection_fingerprint
    )


def formal_approval_allowed(snapshot: dict, current_projection_fingerprint: str, authority_present: bool) -> bool:
    return authority_present and snapshot_fresh(snapshot, current_projection_fingerprint)


def build_project_baseline(decision_snapshot: dict, promoted_artifacts: list[dict], blueprint_id: str, blueprint_version: str) -> dict:
    """Create only the Project Definition baseline contract.

    R0 deliberately does not invent milestones, tasks, owners or delivery dates.
    """
    baseline = {
        "kind": "PROJECT_DEFINITION_BASELINE",
        "source_snapshot_id": decision_snapshot.get("id"),
        "source_snapshot_hash": decision_snapshot.get("hash"),
        "blueprint_id": blueprint_id,
        "blueprint_version": blueprint_version,
        "promoted_artifacts": [
            {
                "artifact_id": artifact.get("id"),
                "version": artifact.get("version"),
                "fingerprint": artifact.get("fingerprint"),
            }
            for artifact in promoted_artifacts
            if artifact.get("fresh", True)
        ],
    }
    baseline["baseline_hash"] = canonical_hash(baseline)
    return baseline

from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import r0_engine_v0_3 as engine


class R0EngineV03Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.bp = engine.load_site_vitrine_blueprint(ROOT)

    def level(self, value, **extra):
        return {"levels": [value], **extra}

    def g0_g1_base(self):
        return {
            "facts": {
                "idea": {"creation_or_redesign": "redesign"},
                "existing": {"site_url": "https://example.test"},
                "audience": {"geo_is_local": True},
            },
            "system_conditions": [
                "RAW_IDEA_PERSISTED",
                "PROVENANCE_PERSISTED",
                "BLUEPRINT_CLASSIFICATION_AVAILABLE",
            ],
            "ledger_conditions": ["no_unresolved_critical_conflict_affecting_foundation"],
            "requirements": {
                "SV.D04.CREATION_OR_REDESIGN": self.level("ACCEPTED_AS_CURRENT"),
                "SV.D02.ORG_CONTEXT": self.level("SOURCE_BACKED"),
                "SV.D02.DECLARED_PROBLEM": self.level("RAW_HUMAN"),
                "SV.D02.USER_OUTCOME": self.level("WORKING_ASSUMPTION"),
                "SV.D03.PRIMARY_AUDIENCE": self.level("WORKING_ASSUMPTION"),
                "SV.D04.OFFER_BASELINE": self.level("SOURCE_BACKED"),
                "SV.D02.HARD_CONSTRAINTS": self.level("ACCEPTED_AS_CURRENT"),
            },
        }

    def test_01_blueprint_loads_real_contract(self):
        self.assertEqual(self.bp["manifest"]["blueprint_version"], "0.4")
        self.assertEqual(len(self.bp["requirements"]), 77)
        self.assertEqual(len(self.bp["contexts"]), 21)
        self.assertEqual(len(self.bp["gates"]), 14)

    def test_02_context_dsl_is_structured_and_valid(self):
        self.assertEqual(engine.validate_context_rules(self.bp["contexts"]), [])
        contexts = engine.derive_contexts(
            self.bp,
            {"facts": {"existing": {"site_url": "https://example.test", "organic_visibility_material": True}}},
        )
        self.assertIn("IS_REDESIGN", contexts)
        self.assertIn("HAS_EXISTING_SITE", contexts)
        self.assertIn("SEO_MIGRATION_RISK", contexts)

    def test_03_nathalie_asks_only_when_auto_paths_exhausted(self):
        state = self.g0_g1_base()
        state["available_paths"] = ["RAW", "SRC", "AI_H", "HUM"]
        projection = engine.project(self.bp, state)
        self.assertEqual(projection["gate_states"]["G0_BLUEPRINT_FIT_SUFFICIENT"]["status"], "READY")
        self.assertEqual(projection["gate_states"]["G1_FOUNDATION_LOCKABLE"]["status"], "NOT_READY")
        self.assertTrue(any(a["requirement_id"] == "SV.D02.PRIMARY_OBJECTIVE" for a in projection["eligible_system_actions"]))
        self.assertIsNone(projection["dominant_user_action"])

        state["available_paths"] = ["HUM"]
        projection = engine.project(self.bp, state)
        self.assertEqual(projection["dominant_user_action"]["requirement_id"], "SV.D02.PRIMARY_OBJECTIVE")

    def test_04_vincent_does_not_repeat_documented_foundation(self):
        state = self.g0_g1_base()
        state["requirements"]["SV.D02.PRIMARY_OBJECTIVE"] = self.level("ACCEPTED_AS_CURRENT")
        projection = engine.project(self.bp, state)
        self.assertEqual(projection["gate_states"]["G1_FOUNDATION_LOCKABLE"]["status"], "READY")
        actions = {item["requirement_id"] for item in projection["eligible_system_actions"]}
        self.assertNotIn("SV.D02.PRIMARY_OBJECTIVE", actions)
        self.assertNotIn("SV.D03.PRIMARY_AUDIENCE", actions)

    def test_05_b2c_to_b2b_change_is_targeted(self):
        impact = engine.change_impact(self.bp, ["SV.D03.PRIMARY_AUDIENCE"])
        self.assertIn("SV.D05.COMPETITOR_SET", impact["invalidated"])
        self.assertIn("SV.D06.POSITIONING_OPTIONS", impact["invalidated"])
        self.assertIn("SV.D07.MACRO_SCOPE", impact["review"])
        self.assertNotIn("SV.D02.DECLARED_PROBLEM", impact["invalidated"])

    def test_06_stale_async_result_cannot_promote(self):
        state = self.g0_g1_base()
        state["requirements"]["SV.D02.PRIMARY_OBJECTIVE"] = self.level("ACCEPTED_AS_CURRENT")
        projection = engine.project(self.bp, state)
        current = projection["requirement_states"]["SV.D03.PRIMARY_AUDIENCE"]["fingerprint"]
        run = {
            "status": "SUCCEEDED",
            "blueprint_version": "0.4",
            "requirement_id": "SV.D03.PRIMARY_AUDIENCE",
            "target_fingerprint": current,
        }
        self.assertTrue(engine.can_promote_action(run, projection))
        run["target_fingerprint"] = "obsolete"
        self.assertFalse(engine.can_promote_action(run, projection))

    def test_07_accepted_unknown_non_blocking_vs_blocking(self):
        non_blocking = {
            "id": "N",
            "criticality_by_gate": {"G": "REQUIRED"},
            "minimum_resolution_by_gate": {"G": "SOURCE_BACKED"},
        }
        blocking = {
            "id": "B",
            "criticality_by_gate": {"G": "BLOCKING"},
            "minimum_resolution_by_gate": {"G": "EXPERT_SIGNOFF"},
        }
        state = {"applicable": True, "status": "ACCEPTED_UNKNOWN", "levels": [], "authority_ok": True}
        self.assertEqual(engine._requirement_satisfies(non_blocking, state, "G", True, set()), (True, True))
        self.assertEqual(engine._requirement_satisfies(blocking, state, "G", True, set()), (False, False))

    def test_08_expert_signoff_is_last_mile(self):
        req = {
            "id": "EX",
            "applicability": {"default": "ACTIVE"},
            "resolution": {
                "preferred_paths": ["WEB", "EXPERT"],
                "default_human_interaction": "EXPERT_SIGNOFF",
            },
            "authority": {"decision_authority": "EXPERT_ROLE"},
            "minimum_resolution_by_gate": {"GX": "EXPERT_SIGNOFF"},
            "criticality_by_gate": {"GX": "BLOCKING"},
        }
        mini = {
            "manifest": {"blueprint_version": "x"},
            "contexts": [], "requirements": {"EX": req},
            "gates": [{"id": "GX"}], "gate_order": ["GX"],
            "bindings": {"GX": {"required_atoms": ["EX"]}}, "deliverables": {},
        }
        projection = engine.project(mini, {"available_paths": ["WEB", "EXPERT"]})
        self.assertEqual(projection["eligible_system_actions"][0]["path"], "WEB")
        self.assertIsNone(projection["dominant_user_action"])

        projection = engine.project(
            mini,
            {
                "available_paths": ["WEB", "EXPERT"],
                "requirements": {"EX": {"levels": ["AI_RECOMMENDATION"], "human_required": True}},
            },
        )
        self.assertEqual(projection["dominant_user_action"]["type"], "EXPERT")

    def test_09_blueprint_mismatch_stops_false_site_coverage(self):
        projection = engine.project(self.bp, {"facts": {"project_type": "saas"}})
        self.assertTrue(projection["blueprint_mismatch"])
        self.assertEqual(projection["dominant_user_action"]["type"], "BLUEPRINT_REMAP")
        self.assertEqual(projection["gate_states"], {})

    def test_10_stale_snapshot_blocks_formal_approval(self):
        state = self.g0_g1_base()
        state["requirements"]["SV.D02.PRIMARY_OBJECTIVE"] = self.level("ACCEPTED_AS_CURRENT")
        projection = engine.project(self.bp, state)
        snapshot = {
            "projection_fingerprint": projection["projection_fingerprint"],
            "blueprint_version": "0.4",
        }
        self.assertTrue(engine.formal_approval_allowed(snapshot, projection, True))
        snapshot["projection_fingerprint"] = "stale"
        self.assertFalse(engine.formal_approval_allowed(snapshot, projection, True))

    def test_11_project_baseline_does_not_invent_delivery_plan(self):
        baseline = engine.build_project_baseline(
            {"id": "snapshot-1", "hash": "abc"},
            [{"id": "artifact-1", "version": 2, "fingerprint": "f", "fresh": True}],
            "SITE_VITRINE",
            "0.4",
        )
        self.assertEqual(baseline["kind"], "PROJECT_DEFINITION_BASELINE")
        self.assertNotIn("milestones", baseline)
        self.assertNotIn("tasks", baseline)
        self.assertNotIn("owners", baseline)

    def test_12_local_visual_change_can_remain_local(self):
        mini = {
            "requirements": {
                "D15.COLOR": {"id": "D15.COLOR", "change_impact": {"review_atoms": ["D15.SYSTEM"]}},
                "D15.SYSTEM": {"id": "D15.SYSTEM", "dependencies": {"requires_all": ["D15.COLOR"]}},
                "D16.ARCH": {"id": "D16.ARCH"},
            }
        }
        impact = engine.change_impact(mini, ["D15.COLOR"])
        self.assertEqual(impact["invalidated"], [])
        self.assertIn("D15.SYSTEM", impact["review"])
        self.assertNotIn("D16.ARCH", impact["review"])


if __name__ == "__main__":
    unittest.main(verbosity=2)

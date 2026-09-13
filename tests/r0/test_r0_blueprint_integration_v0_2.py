import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))

import r0_engine_v0_2 as e


class R0V02RealBlueprintSmokeTests(unittest.TestCase):
    def test_loads_current_site_vitrine_blueprint(self):
        bp = e.load_site_vitrine_blueprint(ROOT)
        self.assertEqual(bp["manifest"].get("blueprint_id"), "SITE_VITRINE")
        self.assertEqual(bp["manifest"].get("blueprint_version"), "0.3")
        self.assertEqual(len(bp["requirements"]), 77)
        self.assertEqual(len(bp["gates"]), 14)
        self.assertEqual(len(bp["contexts"]), 21)
        self.assertEqual(len(bp["deliverables"]), 19)

    def test_gate_bindings_support_current_advanced_contracts(self):
        bp = e.load_site_vitrine_blueprint(ROOT)
        bindings = bp["bindings"]
        self.assertIn("required_atoms_for_launch_path", bindings["G3_STRATEGIC_OPTIONS_READY"])
        self.assertIn("alternative_stop_path", bindings["G3_STRATEGIC_OPTIONS_READY"])
        self.assertIn("applies_when_context", bindings["G5B_CONCEPT_VALIDATION_SUFFICIENT"])
        self.assertIn("required_deliverables", bindings["G6_DECISION_PACKAGE_READY"])
        self.assertIn("required_gates", bindings["G12_READY_FOR_DEVELOPMENT"])

    def test_blueprint_mismatch_projection_is_safe(self):
        bp = e.load_site_vitrine_blueprint(ROOT)
        projection = e.project(bp, {"facts": {"project_type": "SAAS"}, "requirements": {}, "system_conditions": []})
        self.assertTrue(projection["blueprint_mismatch"])
        self.assertEqual(projection["dominant_user_action"]["type"], "BLUEPRINT_REMAP")
        self.assertEqual(projection["eligible_system_actions"], [])


if __name__ == "__main__":
    unittest.main()

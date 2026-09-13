import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))

import r0_engine as e


class R0RealBlueprintSmokeTests(unittest.TestCase):
    def test_loads_current_site_vitrine_blueprint(self):
        bp = e.load_site_vitrine_blueprint(ROOT)
        self.assertEqual(bp["manifest"].get("blueprint_id"), "SITE_VITRINE")
        self.assertEqual(bp["manifest"].get("blueprint_version"), "0.3")
        self.assertEqual(len(bp["requirements"]), 77)
        self.assertEqual(len(bp["gates"]), 14)
        self.assertEqual(len(bp["contexts"]), 21)
        self.assertEqual(len(bp["deliverables"]), 19)

    def test_blueprint_mismatch_projection_is_safe(self):
        bp = e.load_site_vitrine_blueprint(ROOT)
        projection = e.project(bp, {
            "facts": {"project_type": "SAAS"},
            "requirements": {},
            "system_conditions": [],
        })
        self.assertTrue(projection["blueprint_mismatch"])
        self.assertEqual(projection["dominant_user_action"]["type"], "BLUEPRINT_REMAP")
        self.assertEqual(projection["eligible_system_actions"], [])


if __name__ == "__main__":
    unittest.main()

from __future__ import annotations

import copy
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import r0_engine_v0_3 as active
import r0_engine_v0_4_candidate as candidate


class R0EngineV04CandidateTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.active = active.load_site_vitrine_blueprint(ROOT)
        cls.bp = candidate.load_site_vitrine_blueprint(ROOT)

    def level(self, value, **extra):
        return {"levels": [value], **extra}

    def g2_state(
        self,
        *,
        redesign=False,
        competitor_resolved=False,
        market_comparison_required=False,
        audit_stale=False,
    ):
        facts = {
            "idea": {"creation_or_redesign": "redesign" if redesign else "creation"},
            # A caller-provided value is intentionally present; the candidate engine must
            # overwrite it with its deterministic policy result.
            "research": {"competitive_evidence_material": False},
        }
        if market_comparison_required:
            facts["decision"] = {"market_comparison_required": True}
        if redesign:
            facts["existing"] = {"site_url": "https://example.test"}

        requirements = {
            "SV.D04.CREATION_OR_REDESIGN": self.level("ACCEPTED_AS_CURRENT"),
            "SV.D02.ORG_CONTEXT": self.level("RAW_HUMAN"),
            "SV.D02.DECLARED_PROBLEM": self.level("RAW_HUMAN"),
            "SV.D02.PRIMARY_OBJECTIVE": self.level("ACCEPTED_AS_CURRENT"),
            "SV.D02.USER_OUTCOME": self.level("WORKING_ASSUMPTION"),
            "SV.D03.PRIMARY_AUDIENCE": self.level("WORKING_ASSUMPTION"),
            "SV.D04.OFFER_BASELINE": self.level("RAW_HUMAN"),
            "SV.D02.HARD_CONSTRAINTS": self.level("ACCEPTED_AS_CURRENT"),
            "SV.D03.PRIMARY_NEED": self.level("WORKING_ASSUMPTION"),
            "SV.D04.EVIDENCE_QUALITY": self.level("CALCULATED"),
            "SV.D05.MARKET_CONTEXT": self.level("CALCULATED"),
            "SV.D05.PATTERN_GAP_SYNTHESIS": self.level("AI_RECOMMENDATION"),
            "SV.D05.RESEARCH_SUFFICIENCY": self.level("CALCULATED"),
        }
        if redesign:
            requirements["SV.D04.EXISTING_SITE"] = self.level("SOURCE_BACKED")
            requirements["SV.D04.EXISTING_AUDIT"] = self.level(
                "OBSERVED", stale=audit_stale
            )
        if competitor_resolved:
            requirements["SV.D05.COMPETITOR_SET"] = self.level("SOURCE_BACKED")

        return {
            "facts": facts,
            "system_conditions": [
                "RAW_IDEA_PERSISTED",
                "PROVENANCE_PERSISTED",
                "BLUEPRINT_CLASSIFICATION_AVAILABLE",
            ],
            "ledger_conditions": [
                "no_unresolved_critical_conflict_affecting_foundation",
                "strategic_claims_have_provenance_or_hypothesis_label",
                "no_unresolved_critical_evidence_conflict",
            ],
            "available_paths": [
                "RAW",
                "SRC",
                "AUDIT",
                "WEB",
                "CALC",
                "AI_H",
                "AI_R",
                "HUM",
            ],
            "requirements": requirements,
        }

    def test_01_active_blueprint_remains_0_4_and_candidate_is_0_5(self):
        self.assertEqual(self.active["manifest"]["blueprint_version"], "0.4")
        self.assertEqual(self.bp["manifest"]["blueprint_version"], "0.5")
        self.assertEqual(
            self.active["manifest"]["status"], "R0_EXECUTABLE_CANDIDATE_NON_CANONICAL"
        )
        self.assertEqual(
            self.bp["manifest"]["status"], "R0_EXECUTABLE_CANDIDATE_NON_ACTIVE"
        )

    def test_02_greenfield_cannot_force_competitor_requirement_off(self):
        projection = candidate.project(self.bp, self.g2_state())
        self.assertIn("NEEDS_COMPETITIVE_EVIDENCE", projection["active_contexts"])
        self.assertTrue(
            projection["requirement_states"]["SV.D05.COMPETITOR_SET"]["applicable"]
        )

    def test_03_sufficient_existing_audit_can_disable_redundant_competitor_requirement(self):
        projection = candidate.project(self.bp, self.g2_state(redesign=True))
        self.assertNotIn("NEEDS_COMPETITIVE_EVIDENCE", projection["active_contexts"])
        self.assertFalse(
            projection["requirement_states"]["SV.D05.COMPETITOR_SET"]["applicable"]
        )
        self.assertEqual(
            projection["gate_states"]["G2_EVIDENCE_CONTEXT_SUFFICIENT"]["status"],
            "READY",
        )

    def test_04_explicit_market_comparison_reactivates_competitor_requirement(self):
        projection = candidate.project(
            self.bp,
            self.g2_state(redesign=True, market_comparison_required=True),
        )
        self.assertIn("NEEDS_COMPETITIVE_EVIDENCE", projection["active_contexts"])
        self.assertTrue(
            projection["requirement_states"]["SV.D05.COMPETITOR_SET"]["applicable"]
        )
        self.assertEqual(
            projection["gate_states"]["G2_EVIDENCE_CONTEXT_SUFFICIENT"]["status"],
            "NOT_READY",
        )

    def test_05_material_competitor_gap_schedules_web_before_human(self):
        projection = candidate.project(self.bp, self.g2_state())
        actions = {
            (item["requirement_id"], item["path"])
            for item in projection["eligible_system_actions"]
        }
        self.assertIn(("SV.D05.COMPETITOR_SET", "WEB"), actions)
        self.assertIsNone(projection["dominant_user_action"])

    def test_06_source_backed_competitor_unlocks_transitive_g2_chain(self):
        projection = candidate.project(
            self.bp,
            self.g2_state(competitor_resolved=True),
        )
        self.assertEqual(
            projection["gate_states"]["G2_EVIDENCE_CONTEXT_SUFFICIENT"]["status"],
            "READY",
        )
        self.assertNotIn(
            "dependency:SV.D05.PATTERN_GAP_SYNTHESIS",
            projection["gate_states"]["G2_EVIDENCE_CONTEXT_SUFFICIENT"]["missing"],
        )

    def test_07_stale_existing_audit_cannot_disable_competitor_requirement(self):
        projection = candidate.project(
            self.bp,
            self.g2_state(redesign=True, audit_stale=True),
        )
        self.assertIn("NEEDS_COMPETITIVE_EVIDENCE", projection["active_contexts"])
        self.assertTrue(
            projection["requirement_states"]["SV.D05.COMPETITOR_SET"]["applicable"]
        )

    def test_08_transitive_dependency_blocks_orphaned_research_sufficiency(self):
        projection = candidate.project(self.bp, self.g2_state(redesign=True))
        states = copy.deepcopy(projection["requirement_states"])
        for requirement_id in ("SV.D05.COMPETITOR_SET", "SV.D04.EXISTING_AUDIT"):
            states[requirement_id]["applicable"] = False
            states[requirement_id]["status"] = "NOT_RELEVANT"
            states[requirement_id]["levels"] = []
        dependency = candidate.dependency_status(
            self.bp["requirements"]["SV.D05.RESEARCH_SUFFICIENCY"],
            states,
            self.bp,
        )
        self.assertFalse(dependency["ready"])
        self.assertIn("SV.D05.PATTERN_GAP_SYNTHESIS", dependency["missing"])


if __name__ == "__main__":
    unittest.main(verbosity=2)

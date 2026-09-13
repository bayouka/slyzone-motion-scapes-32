import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))
import r0_engine_v0_2 as e


def req(rid, *, default="ACTIVE", anyctx=None, paths=None, minimum=None, human=None, human_only=None, deps=None, impact=None, authority=None):
    item = {
        "id": rid,
        "type": "INFO",
        "domain_id": "D00",
        "lifecycle_zone": "Z",
        "applicability": {"default": default},
        "resolution": {"allowed_classes": ["R1"], "preferred_paths": paths or ["AI_R"], "default_human_interaction": human or "NONE"},
    }
    if anyctx:
        item["applicability"]["any_of_contexts"] = anyctx
    if minimum:
        item["minimum_resolution_by_gate"] = minimum
    if human_only:
        item["resolution"]["human_only_reason"] = human_only
    if deps:
        item["dependencies"] = deps
    if impact:
        item["change_impact"] = impact
    if authority:
        item["authority"] = {"decision_authority": authority}
    return item


def blueprint():
    requirements = {}

    def add(item):
        requirements[item["id"]] = item

    add(req("SV.D04.CREATION_OR_REDESIGN", minimum={"G0_BLUEPRINT_FIT_SUFFICIENT": "ACCEPTED_AS_CURRENT"}))
    add(req("SV.D02.ORG_CONTEXT", minimum={"G1_FOUNDATION_LOCKABLE": {"any_of": ["RAW_HUMAN", "SOURCE_BACKED", "ACCEPTED_AS_CURRENT"]}}))
    add(req("SV.D02.DECLARED_PROBLEM", minimum={"G1_FOUNDATION_LOCKABLE": "RAW_HUMAN"}))
    add(req("SV.D02.PRIMARY_OBJECTIVE", paths=["RAW", "AI_H", "HUM"], minimum={"G1_FOUNDATION_LOCKABLE": "WORKING_ASSUMPTION"}, human_only="future_intent"))
    add(req("SV.D02.USER_OUTCOME", minimum={"G1_FOUNDATION_LOCKABLE": "WORKING_ASSUMPTION"}))
    add(req("SV.D03.PRIMARY_AUDIENCE", minimum={"G1_FOUNDATION_LOCKABLE": "WORKING_ASSUMPTION"}, impact={
        "invalidates_atoms": ["SV.D05.COMPETITOR_SET", "SV.D06.POSITIONING_OPTIONS"],
        "review_atoms": ["SV.D07.MACRO_SCOPE"],
        "stale_artifacts": ["A05_MARKET", "A16_DECISION"],
    }))
    add(req("SV.D04.OFFER_BASELINE", minimum={"G1_FOUNDATION_LOCKABLE": {"any_of": ["RAW_HUMAN", "SOURCE_BACKED", "ACCEPTED_AS_CURRENT"]}}))
    add(req("SV.D03.PRIMARY_NEED", minimum={"G2_EVIDENCE_CONTEXT_SUFFICIENT": "WORKING_ASSUMPTION"}, deps={"requires_all": ["SV.D03.PRIMARY_AUDIENCE"]}))
    add(req("SV.D05.MARKET_CONTEXT", minimum={"G2_EVIDENCE_CONTEXT_SUFFICIENT": "CALCULATED"}, deps={"requires_all": ["SV.D03.PRIMARY_AUDIENCE"]}))
    add(req("SV.D05.COMPETITOR_SET", minimum={"G2_EVIDENCE_CONTEXT_SUFFICIENT": "SOURCE_BACKED"}, deps={"requires_all": ["SV.D05.MARKET_CONTEXT"]}))
    add(req("SV.D05.PATTERN_GAP_SYNTHESIS", minimum={"G2_EVIDENCE_CONTEXT_SUFFICIENT": "AI_RECOMMENDATION"}, deps={"requires_all": ["SV.D05.COMPETITOR_SET"]}))
    add(req("SV.D05.RESEARCH_SUFFICIENCY", minimum={"G2_EVIDENCE_CONTEXT_SUFFICIENT": "CALCULATED"}, deps={"requires_all": ["SV.D05.PATTERN_GAP_SYNTHESIS"]}))
    add(req("SV.D06.POSITIONING_OPTIONS", deps={"requires_all": ["SV.D05.PATTERN_GAP_SYNTHESIS"]}))
    add(req("SV.D07.MACRO_SCOPE", deps={"requires_all": ["SV.D06.POSITIONING_OPTIONS"]}))
    add(req("SV.PF.VISUAL_TERRITORIES", default="INACTIVE", anyctx=["NEEDS_VISUAL_PREFIGURATION"], human="EXPLICIT_CHOICE", authority="IDEA_DECISION_OWNER"))
    add(req("SV.PF.RISK_PROBE", default="INACTIVE", anyctx=["HAS_REGULATORY_CONSTRAINT"], human="EXPERT_SIGNOFF", authority="EXPERT_ROLE", minimum={"G10_PROJECT_TECH_NFR_STABLE": "EXPERT_SIGNOFF"}))
    add(req("SV.D17.EXPERT_SIGNOFF", default="INACTIVE", anyctx=["HAS_REGULATORY_CONSTRAINT"], human="EXPERT_SIGNOFF", authority="EXPERT_ROLE", minimum={"G10_PROJECT_TECH_NFR_STABLE": "EXPERT_SIGNOFF"}))
    add(req("SV.D15.DESIGN_DEFINITION", impact={"review_atoms": ["SV.D15.RESPONSIVE_BEHAVIOR"]}))
    add(req("SV.D15.RESPONSIVE_BEHAVIOR", deps={"requires_all": ["SV.D15.DESIGN_DEFINITION"]}))
    add(req("SV.D22.APPROVAL_OUTCOME", human="FORMAL_APPROVAL", authority="IDEA_DECISION_OWNER", minimum={"G7_IDEA_APPROVAL_READY": "HUMAN_DECISION"}))
    add(req("SV.PRJ.APPROVED_BASELINE", minimum={"G8_PROJECT_PRODUCT_DEFINITION_STABLE": "APPROVED_FOR_PROJECT"}, deps={"requires_all": ["SV.D22.APPROVAL_OUTCOME"]}))
    add(req("SV.D20.READY_APPROVAL", human="FORMAL_APPROVAL", authority="BUILD_READY_OWNER", minimum={"G12_READY_FOR_DEVELOPMENT": "HUMAN_DECISION"}))

    gates = [
        "G0_BLUEPRINT_FIT_SUFFICIENT", "G1_FOUNDATION_LOCKABLE", "G2_EVIDENCE_CONTEXT_SUFFICIENT",
        "G7_IDEA_APPROVAL_READY", "G8_PROJECT_PRODUCT_DEFINITION_STABLE", "G10_PROJECT_TECH_NFR_STABLE",
        "G12_READY_FOR_DEVELOPMENT",
    ]
    bindings = {
        "G0_BLUEPRINT_FIT_SUFFICIENT": {"system_conditions": ["RAW_IDEA_PERSISTED", "PROVENANCE_PERSISTED", "BLUEPRINT_CLASSIFICATION_AVAILABLE"], "required_atoms": ["SV.D04.CREATION_OR_REDESIGN"]},
        "G1_FOUNDATION_LOCKABLE": {"required_atoms": ["SV.D02.ORG_CONTEXT", "SV.D02.DECLARED_PROBLEM", "SV.D02.PRIMARY_OBJECTIVE", "SV.D02.USER_OUTCOME", "SV.D03.PRIMARY_AUDIENCE", "SV.D04.OFFER_BASELINE"]},
        "G2_EVIDENCE_CONTEXT_SUFFICIENT": {"required_atoms": ["SV.D03.PRIMARY_NEED", "SV.D05.MARKET_CONTEXT", "SV.D05.COMPETITOR_SET", "SV.D05.PATTERN_GAP_SYNTHESIS", "SV.D05.RESEARCH_SUFFICIENCY"]},
        "G7_IDEA_APPROVAL_READY": {"required_atoms": ["SV.D22.APPROVAL_OUTCOME"]},
        "G8_PROJECT_PRODUCT_DEFINITION_STABLE": {"required_atoms": ["SV.PRJ.APPROVED_BASELINE"]},
        "G10_PROJECT_TECH_NFR_STABLE": {"conditional_atoms": ["SV.PF.RISK_PROBE", "SV.D17.EXPERT_SIGNOFF"]},
        "G12_READY_FOR_DEVELOPMENT": {"required_atoms": ["SV.D20.READY_APPROVAL"]},
    }
    return {"manifest": {"blueprint_version": "0.3"}, "requirements": requirements, "contexts": {}, "gates": {gate: {"id": gate} for gate in gates}, "gate_order": gates, "bindings": bindings, "deliverables": {}}


def evidence(level, **kwargs):
    item = {"levels": [level]}
    item.update(kwargs)
    return item


class R0V02Tests(unittest.TestCase):
    def setUp(self):
        self.bp = blueprint()

    def base(self):
        return {"facts": {"project_type": "SITE_VITRINE", "idea": {"creation_or_redesign": "creation"}}, "system_conditions": ["RAW_IDEA_PERSISTED", "PROVENANCE_PERSISTED", "BLUEPRINT_CLASSIFICATION_AVAILABLE"], "requirements": {"SV.D04.CREATION_OR_REDESIGN": evidence("ACCEPTED_AS_CURRENT")}}

    def fill_g1(self, state):
        state["requirements"].update({
            "SV.D02.ORG_CONTEXT": evidence("RAW_HUMAN"), "SV.D02.DECLARED_PROBLEM": evidence("RAW_HUMAN"),
            "SV.D02.PRIMARY_OBJECTIVE": evidence("WORKING_ASSUMPTION"), "SV.D02.USER_OUTCOME": evidence("WORKING_ASSUMPTION"),
            "SV.D03.PRIMARY_AUDIENCE": evidence("WORKING_ASSUMPTION"), "SV.D04.OFFER_BASELINE": evidence("RAW_HUMAN"),
        })

    def fill_g2(self, state):
        state["requirements"].update({
            "SV.D03.PRIMARY_NEED": evidence("WORKING_ASSUMPTION"), "SV.D05.MARKET_CONTEXT": evidence("CALCULATED"),
            "SV.D05.COMPETITOR_SET": evidence("SOURCE_BACKED"), "SV.D05.PATTERN_GAP_SYNTHESIS": evidence("AI_RECOMMENDATION"),
            "SV.D05.RESEARCH_SUFFICIENCY": evidence("CALCULATED"),
        })

    def test_nathalie_human_intent_only_when_needed(self):
        state = self.base()
        state["requirements"].update({"SV.D02.ORG_CONTEXT": evidence("RAW_HUMAN"), "SV.D02.DECLARED_PROBLEM": evidence("RAW_HUMAN")})
        projection = e.project(self.bp, state)
        self.assertEqual(projection["dominant_user_action"]["requirement_id"], "SV.D02.PRIMARY_OBJECTIVE")
        self.assertEqual(projection["gate_states"]["G1_FOUNDATION_LOCKABLE"]["status"], "NOT_READY")

    def test_vincent_rich_no_repeated_human_question(self):
        state = self.base(); self.fill_g1(state); self.fill_g2(state)
        projection = e.project(self.bp, state)
        self.assertEqual(projection["gate_states"]["G2_EVIDENCE_CONTEXT_SUFFICIENT"]["status"], "READY")
        self.assertNotEqual((projection["dominant_user_action"] or {}).get("requirement_id"), "SV.D02.PRIMARY_OBJECTIVE")

    def test_b2c_to_b2b_targeted_change(self):
        impact = e.change_impact(self.bp, ["SV.D03.PRIMARY_AUDIENCE"])
        self.assertIn("SV.D05.COMPETITOR_SET", impact["invalidated"])
        self.assertIn("SV.D06.POSITIONING_OPTIONS", impact["invalidated"])
        self.assertIn("SV.D07.MACRO_SCOPE", impact["review"])

    def test_competitor_change_propagates_descendants(self):
        impact = e.change_impact(self.bp, ["SV.D05.COMPETITOR_SET"])
        self.assertIn("SV.D05.PATTERN_GAP_SYNTHESIS", impact["review"])
        self.assertIn("SV.D06.POSITIONING_OPTIONS", impact["review"])

    def test_visual_change_is_local(self):
        impact = e.change_impact(self.bp, ["SV.D15.DESIGN_DEFINITION"])
        self.assertIn("SV.D15.RESPONSIVE_BEHAVIOR", impact["review"])
        self.assertNotIn("SV.D03.PRIMARY_AUDIENCE", impact["review"])

    def test_expert_signoff_blocks_gate(self):
        state = self.base(); self.fill_g1(state); self.fill_g2(state); state["facts"]["has_regulatory_constraint"] = True
        projection = e.project(self.bp, state)
        self.assertEqual(projection["gate_states"]["G10_PROJECT_TECH_NFR_STABLE"]["status"], "NOT_READY")
        self.assertTrue(projection["requirement_states"]["SV.D17.EXPERT_SIGNOFF"]["applicable"])

    def test_accepted_unknown_can_make_gate_ready_with_unknown(self):
        state = self.base(); self.fill_g1(state); self.fill_g2(state)
        state["requirements"]["SV.D05.COMPETITOR_SET"] = {"accepted_unknown": True}
        projection = e.project(self.bp, state)
        self.assertEqual(projection["gate_states"]["G2_EVIDENCE_CONTEXT_SUFFICIENT"]["status"], "READY_WITH_ACCEPTED_UNKNOWNS")

    def test_accepted_unknown_can_be_forbidden(self):
        state = self.base(); self.fill_g1(state); self.fill_g2(state); state["accepted_unknown_allowed"] = False
        state["requirements"]["SV.D05.COMPETITOR_SET"] = {"accepted_unknown": True}
        projection = e.project(self.bp, state)
        self.assertEqual(projection["gate_states"]["G2_EVIDENCE_CONTEXT_SUFFICIENT"]["status"], "NOT_READY")

    def test_stale_async_result_rejected(self):
        state = self.base(); self.fill_g1(state)
        projection = e.project(self.bp, state)
        run = {"status": "SUCCEEDED", "blueprint_version": "0.3", "target_fingerprints": {"SV.D03.PRIMARY_AUDIENCE": "old"}}
        self.assertFalse(e.can_promote_action(run, projection))

    def test_blueprint_mismatch_stops_site_vitrine(self):
        state = self.base(); state["facts"]["project_type"] = "SAAS"
        projection = e.project(self.bp, state)
        self.assertTrue(projection["blueprint_mismatch"])
        self.assertEqual(projection["dominant_user_action"]["type"], "BLUEPRINT_REMAP")

    def test_stale_snapshot_blocks_approval(self):
        state = self.base(); self.fill_g1(state)
        projection = e.project(self.bp, state)
        self.assertFalse(e.snapshot_is_fresh({"blueprint_version": "0.3", "projection_fingerprint": "older"}, projection))

    def test_project_promotion_does_not_create_milestones(self):
        state = self.base(); self.fill_g1(state); self.fill_g2(state)
        state["requirements"]["SV.D22.APPROVAL_OUTCOME"] = evidence("HUMAN_DECISION", authority_role="IDEA_DECISION_OWNER")
        projection = e.project(self.bp, state)
        self.assertIn("CREATE_PROJECT_DEFINITION_BASELINE", projection["promotion_capabilities"])
        self.assertNotIn("milestones", projection)

    def test_contextual_gate_is_not_applicable_without_context(self):
        self.bp["gate_order"].insert(3, "G5B_CONCEPT_VALIDATION_SUFFICIENT")
        self.bp["gates"]["G5B_CONCEPT_VALIDATION_SUFFICIENT"] = {"id": "G5B_CONCEPT_VALIDATION_SUFFICIENT"}
        self.bp["bindings"]["G5B_CONCEPT_VALIDATION_SUFFICIENT"] = {"applies_when_context": ["NEEDS_CONCEPT_VALIDATION"], "required_atoms": ["SV.D03.PRIMARY_NEED"]}
        state = self.base(); self.fill_g1(state); self.fill_g2(state)
        projection = e.project(self.bp, state)
        self.assertEqual(projection["gate_states"]["G5B_CONCEPT_VALIDATION_SUFFICIENT"]["status"], "NOT_APPLICABLE")

    def test_required_deliverable_blocks_gate(self):
        self.bp["bindings"]["G7_IDEA_APPROVAL_READY"]["required_deliverables"] = ["A17_IDEA_DECISION_RECORD"]
        state = self.base(); self.fill_g1(state); self.fill_g2(state)
        state["requirements"]["SV.D22.APPROVAL_OUTCOME"] = evidence("HUMAN_DECISION", authority_role="IDEA_DECISION_OWNER")
        projection = e.project(self.bp, state)
        self.assertIn("deliverable:A17_IDEA_DECISION_RECORD", projection["gate_states"]["G7_IDEA_APPROVAL_READY"]["missing"])

    def test_required_gate_blocks_ready_for_development(self):
        self.bp["bindings"]["G12_READY_FOR_DEVELOPMENT"]["required_gates"] = ["G10_PROJECT_TECH_NFR_STABLE"]
        state = self.base(); self.fill_g1(state); self.fill_g2(state); state["facts"]["has_regulatory_constraint"] = True
        state["requirements"]["SV.D20.READY_APPROVAL"] = evidence("HUMAN_DECISION", authority_role="BUILD_READY_OWNER")
        projection = e.project(self.bp, state)
        self.assertIn("gate:G10_PROJECT_TECH_NFR_STABLE", projection["gate_states"]["G12_READY_FOR_DEVELOPMENT"]["missing"])

    def test_formal_authority_must_be_on_decision_record(self):
        state = self.base(); self.fill_g1(state); self.fill_g2(state)
        state["authority_roles"] = ["IDEA_DECISION_OWNER"]
        state["requirements"]["SV.D22.APPROVAL_OUTCOME"] = evidence("HUMAN_DECISION")
        projection = e.project(self.bp, state)
        self.assertFalse(projection["requirement_states"]["SV.D22.APPROVAL_OUTCOME"]["authority_ok"])
        self.assertEqual(projection["gate_states"]["G7_IDEA_APPROVAL_READY"]["status"], "NOT_READY")

    def test_unavailable_auto_path_is_not_scheduled(self):
        state = self.base(); state["available_paths"] = ["WEB"]
        state["requirements"].update({
            "SV.D02.ORG_CONTEXT": evidence("RAW_HUMAN"),
            "SV.D02.DECLARED_PROBLEM": evidence("RAW_HUMAN"),
            "SV.D02.PRIMARY_OBJECTIVE": evidence("WORKING_ASSUMPTION"),
        })
        projection = e.project(self.bp, state)
        ids = {item["requirement_id"] for item in projection["eligible_system_actions"]}
        self.assertNotIn("SV.D02.USER_OUTCOME", ids)

    def test_stop_path_can_bypass_launch_atoms_when_evidence_backed(self):
        self.bp["gate_order"].insert(3, "G3_STRATEGIC_OPTIONS_READY")
        self.bp["gates"]["G3_STRATEGIC_OPTIONS_READY"] = {"id": "G3_STRATEGIC_OPTIONS_READY"}
        self.bp["bindings"]["G3_STRATEGIC_OPTIONS_READY"] = {
            "required_atoms_for_launch_path": ["SV.D06.POSITIONING_OPTIONS", "SV.D07.MACRO_SCOPE"],
            "alternative_stop_path": {"ledger_conditions": ["stop_pause_or_insufficient_conclusion_is_evidence_backed"]},
        }
        state = self.base(); self.fill_g1(state); self.fill_g2(state)
        state["decision_path"] = "STOP"
        state["ledger_conditions"] = ["stop_pause_or_insufficient_conclusion_is_evidence_backed"]
        projection = e.project(self.bp, state)
        self.assertEqual(projection["gate_states"]["G3_STRATEGIC_OPTIONS_READY"]["status"], "READY")


if __name__ == "__main__":
    unittest.main()

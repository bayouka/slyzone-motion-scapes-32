import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const machineDir = path.join(root, 'docs', 'project-definition', 'machine');

const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(machineDir, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const fail = (message) => {
  console.error(`[canonical-runtime-bridge-v1] FAIL: ${message}`);
  process.exitCode = 1;
};
const assert = (condition, message) => {
  if (!condition) fail(message);
};
const unique = (values) => new Set(values).size === values.length;
const requireMarkers = (text, label, markers) => {
  for (const marker of markers) assert(text.includes(marker), `${label} marker missing: ${marker}`);
};

let master;
let bridge;
let requirementMap;
let preprojectMigration;
let preprojectFixMigration;
let g3ActorHardeningMigration;
let coreGraphMigration;
let deliveryClosureMigration;
let closurePredicatesMigration;
let qualityTestabilityMigration;
let baselineHandoffMigration;
let g4Migration;
let g5Migration;
let gateIdempotencyMigration;
let completeRfdPredicateMigration;
let canonicalIdeaAdapter;
let workerEntry;
try {
  master = readJson('MASTER_BLUEPRINT_V1.json');
  bridge = readJson('CANONICAL_RUNTIME_BRIDGE_V1.json');
  requirementMap = readJson(path.join('site-vitrine', 'SITE_VITRINE_LEGACY_REQUIREMENT_TO_CANONICAL_V1.json'));
  preprojectMigration = readText('supabase/migrations/20260916174121_project_master_blueprint_v1_g0_g3_preproject_bridge_p3.sql');
  preprojectFixMigration = readText('supabase/migrations/20260916174307_project_master_blueprint_v1_g0_g3_preproject_bridge_p3_g0_column_fix.sql');
  g3ActorHardeningMigration = readText('supabase/migrations/20260916174852_project_master_blueprint_v1_g3_promotion_actor_hardening_p4.sql');
  coreGraphMigration = readText('supabase/migrations/20260916153749_project_master_blueprint_v1_core_graph_runtime.sql');
  deliveryClosureMigration = readText('supabase/migrations/20260916154153_project_master_blueprint_v1_delivery_lot_dependency_closure.sql');
  closurePredicatesMigration = readText('supabase/migrations/20260916154611_project_master_blueprint_v1_dependency_closure_predicates.sql');
  qualityTestabilityMigration = readText('supabase/migrations/20260916155201_project_master_blueprint_v1_quality_testability_predicates.sql');
  baselineHandoffMigration = readText('supabase/migrations/20260916155544_project_master_blueprint_v1_baseline_handoff_predicates.sql');
  g4Migration = readText('supabase/migrations/20260916155824_project_master_blueprint_v1_g4_rfd_lot.sql');
  g5Migration = readText('supabase/migrations/20260916155938_project_master_blueprint_v1_g5_rfd_project.sql');
  gateIdempotencyMigration = readText('supabase/migrations/20260916162910_project_master_blueprint_v1_g4_g5_idempotent_approval.sql');
  completeRfdPredicateMigration = readText('supabase/migrations/20260916165026_project_master_blueprint_v1_complete_rfd_predicate_set.sql');
  canonicalIdeaAdapter = readText('src/idea-canonical-adapter.js');
  workerEntry = readText('src/worker-entry.js');
} catch (error) {
  fail(`cannot parse runtime bridge source: ${error.message}`);
  process.exit(1);
}

assert(bridge.schema_version === '1.0', 'bridge schema_version must be 1.0');
assert(bridge.contract_id === 'PROJECT_DEFINITION_CANONICAL_RUNTIME_BRIDGE', 'unexpected bridge contract_id');
assert(bridge.contract_version === '1.4', 'bridge contract_version must be 1.4');
assert(bridge.status === 'CANONICAL_MIGRATION_CONTRACT', 'bridge must be a canonical migration contract');
assert(bridge.source_runtime === 'R5_R6_R7_COMPATIBILITY_RUNTIME', 'bridge source runtime must include R5/R6/R7 compatibility runtime');
assert(bridge.target_contract === '4B4C_PROJECT_MASTER_BLUEPRINT_V1', 'bridge target contract mismatch');

assert(bridge.coverage?.requirement_domain_classification === 'FULL_FOR_R7_REQUIREMENT_SET', 'R7 requirement classification must remain complete');
assert(bridge.coverage?.legacy_readiness_projection === 'PARTIAL_WITH_CANONICAL_PREPROJECT_BRIDGE', 'legacy readiness projection must expose canonical preproject bridge');
assert(bridge.coverage?.core_graph === 'IMPLEMENTED_SERVICE_ONLY', 'core graph must be service-only implemented');
assert(bridge.coverage?.canonical_node_state_projection === 'IMPLEMENTED_R7_BRIDGE', 'canonical node state projection must remain an R7 bridge');
assert(bridge.coverage?.delivery_lots === 'IMPLEMENTED_SERVICE_ONLY', 'DeliveryLot runtime must be service-only implemented');
assert(bridge.coverage?.dependency_closure === 'IMPLEMENTED_SERVICE_ONLY', 'DependencyClosure runtime must be service-only implemented');
assert(bridge.coverage?.rfd_predicates === 'ALL_ELEVEN_MASTER_RFD_LOT_PREDICATES_IMPLEMENTED_SERVICE_ONLY', 'all Master Blueprint RFD lot predicates must be implemented service-only');
assert(bridge.coverage?.legacy_project_readiness_bridge === 'G8_G11_TO_FOUR_CANONICAL_PROJECT_PREDICATES', 'legacy G8-G11 project-readiness bridge must be explicit');
assert(bridge.coverage?.baseline_handoff === 'IMPLEMENTED_SERVICE_ONLY', 'baseline/handoff runtime must be service-only implemented');
assert(bridge.coverage?.canonical_formal_gates === 'G0_G5_IMPLEMENTED_SERVICE_SIDE', 'canonical G0-G5 service-side coverage must be explicit');
assert(bridge.coverage?.canonical_pre_g4_gates === 'G0_G3_IMPLEMENTED_AS_DERIVED_COMPATIBILITY_BRIDGE', 'G0-G3 derived bridge status must be explicit');
assert(bridge.coverage?.canonical_preproject_worker_adapter === 'IMPLEMENTED_IN_REPOSITORY_PENDING_PRODUCTION_CUTOVER_CERTIFICATION', 'preproject adapter cutover must remain uncertified until production verification');
assert(bridge.coverage?.canonical_g3_browser_promotion === 'INTENTIONALLY_NOT_EXPOSED', 'G3 browser promotion must remain intentionally unexposed');
assert(bridge.coverage?.real_idea_end_to_end === 'UNPROVEN_NO_PRODUCTION_IDEA', 'real Idea E2E limitation must remain explicit');

const expectedRuntimeObjects = {
  idea_blueprint_fit_source: 'public.idea_blueprint_fit_decisions',
  idea_requirement_state_source: 'public.idea_requirement_states',
  idea_artifact_source: 'public.idea_artifacts',
  idea_decision_package_source: 'public.idea_decision_packages',
  idea_decision_record_source: 'public.idea_decision_records_v2',
  project_definition_source: 'public.project_definitions',
  canonical_preproject_readiness: 'public.get_canonical_idea_preproject_readiness_v1(uuid)',
  canonical_decision_record: 'public.record_canonical_idea_decision_v1(uuid,uuid,text,text,jsonb,boolean,text,text)',
  canonical_project_baseline_promotion: 'public.promote_canonical_approved_idea_to_project_definition_v2(uuid,uuid,bigint,jsonb,jsonb,jsonb,text)',
  blueprint_pack: 'app_private.project_blueprint_packs_v1',
  node_definitions: 'app_private.project_node_definitions_v1',
  dependency_edges: 'app_private.project_dependency_edges_v1',
  delivery_lots: 'app_private.project_delivery_lots_v1',
  delivery_lot_nodes: 'app_private.project_delivery_lot_nodes_v1',
  ownership_assignments: 'app_private.project_ownership_assignments_v1',
  conflict_records: 'app_private.project_conflict_records_v1',
  testability_policy: 'app_private.project_readiness_node_policy_v1',
  baseline_freezes: 'app_private.project_baseline_freezes_v1',
  handoff_manifests: 'app_private.project_handoff_manifests_v1',
  canonical_gate_states: 'app_private.project_canonical_gate_states_v1',
  project_rfd_manifests: 'app_private.project_rfd_manifests_v1',
  canonical_graph_read: 'public.get_project_definition_canonical_graph_v1(uuid)',
  blueprint_dependency_closure: 'app_private.get_blueprint_dependency_closure_v1(text,text,text[])',
  delivery_lot_dependency_closure: 'public.get_project_delivery_lot_dependency_closure_v1(uuid)',
  project_readiness_bridge: 'app_private.get_project_readiness_predicates_v1(uuid)',
  quality_testability: 'public.get_project_delivery_lot_quality_testability_v1(uuid)',
  baseline_handoff_readiness: 'public.get_project_delivery_lot_baseline_handoff_readiness_v1(uuid)',
  g4_readiness: 'public.get_project_delivery_lot_rfd_readiness_v1(uuid)',
  g4_approval: 'public.approve_project_delivery_lot_rfd_v1(uuid,bigint,text,uuid)',
  g5_manifest_candidate: 'public.create_project_rfd_manifest_candidate_v1(uuid,bigint)',
  g5_readiness: 'public.get_project_rfd_readiness_v1(uuid)',
  g5_approval: 'public.approve_project_rfd_v1(uuid,bigint,text,uuid)'
};
for (const [key, value] of Object.entries(expectedRuntimeObjects)) {
  assert(bridge.runtime_objects?.[key] === value, `runtime object ${key} mismatch`);
}

assert(bridge.graph_contract?.idea_active_blueprint_id === 'SITE_VITRINE', 'active Idea Blueprint id mismatch');
assert(bridge.graph_contract?.idea_active_blueprint_version === '0.4', 'active Idea Blueprint must remain 0.4');
assert(bridge.graph_contract?.idea_candidate_blueprint_version === '0.5', 'candidate Idea Blueprint must remain 0.5');
assert(bridge.graph_contract?.idea_candidate_activation_changed_by_bridge === false, 'bridge must not activate Idea Blueprint 0.5');
assert(bridge.graph_contract?.blueprint_id === 'SITE_VITRINE', 'graph bridge blueprint id mismatch');
assert(bridge.graph_contract?.blueprint_version === '1.0-bridge-r7', 'graph bridge blueprint version mismatch');
assert(bridge.graph_contract?.canonical_node_count === 28, 'graph bridge must define exactly 28 canonical nodes');
assert(bridge.graph_contract?.dependency_edge_count === 33, 'graph bridge must define exactly 33 dependency edges');
assert(bridge.graph_contract?.hard_edge_count === 31, 'graph bridge must define exactly 31 HARD edges');
assert(bridge.graph_contract?.soft_edge_count === 2, 'graph bridge must define exactly 2 SOFT edges');
assert(bridge.graph_contract?.hard_dependency_cycles_allowed === false, 'HARD dependency cycles must remain forbidden');
assert(bridge.graph_contract?.legacy_requirement_state_source_retained === true, 'R7 requirement state source must remain retained');

const expectedPreprojectPredicates = ['FOUNDATION_READY','EVIDENCE_READY','STRATEGY_READY','PREFIGURATION_READY','DECISION_PACKAGE_READY'];
assert(JSON.stringify(bridge.canonical_preproject_readiness_predicates) === JSON.stringify(expectedPreprojectPredicates), 'canonical preproject predicate set mismatch');
for (const predicate of expectedPreprojectPredicates) assert(master.readiness_predicates?.includes(predicate), `${predicate} missing from Master Blueprint V1`);
assert(bridge.canonical_preproject_policy?.predicate_persistence === 'DERIVED_NOT_STORED', 'preproject predicates must remain derived-not-stored');
for (const key of [
  'requirement_state_freshness_checked_against_engine_revision',
  'authority_ok_required',
  'stale_conflicted_unresolved_states_block',
  'prefiguration_uses_current_or_frozen_fresh_for_decision_artifacts',
  'conditional_prefiguration_unmaterialized_state_is_reported_as_coverage_warning',
  'decision_package_requires_current_engine_revision',
  'decision_package_requires_matching_immutable_snapshot',
  'decision_package_requires_fresh_snapshot_bound_outputs',
  'material_open_review_feedback_blocks_decision_package_readiness',
  'launch_and_early_non_go_paths_are_distinct'
]) assert(bridge.canonical_preproject_policy?.[key] === true, `preproject policy ${key} must be true`);
assert(bridge.canonical_preproject_policy?.unknown_readiness_coerced_to_ready === false, 'preproject unknown readiness must never be coerced to ready');

assert(bridge.canonical_preproject_gate_policy?.G0_BLUEPRINT_FIT?.site_vitrine_runtime_version === '0.4', 'G0 must retain active SITE_VITRINE@0.4');
assert(bridge.canonical_preproject_gate_policy?.G1_IDEA_DECISION_READY?.evaluation_fingerprint_required_for_canonical_decision === true, 'G1 fingerprint binding required');
assert(bridge.canonical_preproject_gate_policy?.G2_GO_PROJECT?.immutable_human_decision_required === true, 'G2 immutable human decision required');
assert(bridge.canonical_preproject_gate_policy?.G2_GO_PROJECT?.decision_actor_injected_from_authenticated_server_adapter === true, 'G2 actor must come from authenticated server adapter');
assert(bridge.canonical_preproject_gate_policy?.G2_GO_PROJECT?.legacy_caller_supplied_gate_boolean_is_not_canonical_evidence === true, 'legacy gate boolean must not be canonical evidence');
assert(bridge.canonical_preproject_gate_policy?.G3_PROJECT_BASELINE?.authorized_actor_must_be_idea_creator_or_workspace_owner_admin === true, 'G3 promotion authority mismatch');
assert(bridge.canonical_preproject_gate_policy?.G3_PROJECT_BASELINE?.actor_revalidated_in_database === true, 'G3 actor must be revalidated in database');
assert(bridge.canonical_preproject_gate_policy?.G3_PROJECT_BASELINE?.browser_promotion_exposed === false, 'G3 browser promotion must remain false');

const expectedLegacyGateMappings = [
  ['G8_PROJECT_PRODUCT_DEFINITION_STABLE', 'PROJECT_PRODUCT_READY'],
  ['G9_PROJECT_EXPERIENCE_DEFINITION_STABLE', 'PROJECT_EXPERIENCE_READY'],
  ['G10_PROJECT_TECH_NFR_STABLE', 'PROJECT_TECH_READY'],
  ['G11_TRACEABILITY_AND_ACCEPTANCE_READY', 'TRACEABILITY_READY']
];
const gateMappings = bridge.legacy_gate_to_readiness_predicate ?? [];
assert(gateMappings.length === expectedLegacyGateMappings.length, 'legacy gate mapping count mismatch');
assert(unique(gateMappings.map((item) => item.legacy_gate_id)), 'legacy bridge gate ids must be unique');
for (let index = 0; index < expectedLegacyGateMappings.length; index += 1) {
  const [legacyGateId, canonicalPredicateId] = expectedLegacyGateMappings[index];
  const actual = gateMappings[index];
  assert(actual?.legacy_gate_id === legacyGateId, `${legacyGateId} mapping missing`);
  assert(actual?.canonical_predicate_id === canonicalPredicateId, `${legacyGateId} canonical predicate mismatch`);
  assert(master.readiness_predicates?.includes(canonicalPredicateId), `${canonicalPredicateId} missing from Master Blueprint V1`);
  assert(bridge.project_readiness_bridge_basis?.[canonicalPredicateId] === legacyGateId, `${canonicalPredicateId} bridge basis mismatch`);
}
assert(bridge.project_readiness_bridge_basis?.evaluation === 'CURRENT_R7_REQUIREMENT_STATE_VIA_APP_PRIVATE_PROJECT_GATE_READY_V1', 'project readiness bridge must derive from current R7 requirement state');
assert(bridge.project_readiness_bridge_basis?.persisted_legacy_gate_state_required === false, 'persisted legacy gate state must not be required for current readiness');

const g12Passthrough = bridge.legacy_gate_passthrough_only ?? [];
assert(g12Passthrough.length === 1, 'exactly one legacy passthrough gate is expected');
assert(g12Passthrough[0]?.legacy_gate_id === 'G12_READY_FOR_DEVELOPMENT', 'legacy G12 must remain passthrough-only');
assert((g12Passthrough[0]?.reason ?? '').includes('must never be relabeled'), 'legacy G12 separation rationale required');

const expectedRfdPredicates = master.rfd_lot_required_predicates ?? [];
assert(expectedRfdPredicates.length === 11, `Master Blueprint must define exactly 11 RFD lot predicates, got ${expectedRfdPredicates.length}`);
const implementedPredicates = bridge.canonical_rfd_predicates_implemented ?? [];
assert(JSON.stringify(implementedPredicates) === JSON.stringify(expectedRfdPredicates), 'canonical implemented RFD predicate set must exactly match Master Blueprint V1');
for (const predicate of expectedRfdPredicates) assert(master.readiness_predicates?.includes(predicate), `${predicate} must exist in Master Blueprint V1`);

assert(bridge.dependency_closure_bridge_basis?.structural_graph === 'CANONICAL_D01_D16_HARD_REQUIRES', 'DependencyClosure structural basis mismatch');
assert(bridge.dependency_closure_bridge_basis?.accepted_unknown_satisfies_structural_requirement === false, 'ACCEPTED_UNKNOWN must not satisfy structural requirements');
assert(bridge.dependency_closure_bridge_basis?.manual_ready_flag === false, 'DependencyClosure must not use manual Ready');

const expectedFormalGates = (master.formal_gates ?? []).map((gate) => gate.id);
const implementedGates = bridge.canonical_formal_gates_implemented ?? [];
assert(JSON.stringify(implementedGates) === JSON.stringify(expectedFormalGates), 'implemented canonical Formal Gates must exactly match Master Blueprint V1 G0-G5');
for (const gateId of implementedGates) assert(master.formal_gates?.some((gate) => gate.id === gateId), `${gateId} missing from Master Blueprint V1`);

for (const key of [
  'derived_readiness_required',
  'all_master_blueprint_rfd_lot_predicates_must_pass',
  'expected_definition_revision_required',
  'expected_evaluation_fingerprint_required',
  'human_authority_required',
  'authorized_actor_must_be_idea_creator_or_workspace_owner_admin',
  'freezes_lot_baseline_and_handoff_atomically',
  'same_revision_same_fingerprint_retry_is_idempotent',
  'different_revision_or_fingerprint_retry_is_rejected'
]) assert(bridge.g4_policy?.[key] === true, `G4 policy ${key} must be true`);
assert(bridge.g4_policy?.required_predicate_count === 11, 'G4 must require exactly 11 Master Blueprint predicates');

for (const key of [
  'at_least_one_required_delivery_lot',
  'all_required_lots_require_current_g4_approval',
  'all_required_lots_must_match_current_definition_revision',
  'project_rfd_manifest_integrity_required',
  'expected_evaluation_fingerprint_required',
  'human_authority_required',
  'authorized_actor_must_be_idea_creator_or_workspace_owner_admin',
  'legacy_project_status_is_not_mutated',
  'same_revision_same_fingerprint_retry_is_idempotent',
  'different_revision_or_fingerprint_retry_is_rejected'
]) assert(bridge.g5_policy?.[key] === true, `G5 policy ${key} must be true`);

assert(bridge.adapter_contract?.repository_route === '/api/ideas/canonical', 'canonical Idea adapter route mismatch');
assert(bridge.adapter_contract?.repository_runtime_version === 'v4.5.16-project-definition-preproject-p3', 'canonical Idea repository runtime version mismatch');
assert(JSON.stringify(bridge.adapter_contract?.commands) === JSON.stringify(['canonical.read','decision.record']), 'canonical Idea adapter command set mismatch');
assert(bridge.adapter_contract?.user_rls_precheck === true, 'canonical Idea adapter RLS precheck required');
assert(bridge.adapter_contract?.decision_actor_from_jwt === true, 'canonical Idea adapter decision actor must come from JWT');
assert(bridge.adapter_contract?.g3_promotion_browser_exposed === false, 'canonical Idea adapter must not expose G3 promotion');
assert(bridge.adapter_contract?.service_role_browser_exposed === false, 'service role must not be browser exposed');
assert(bridge.adapter_contract?.production_cutover_certified === false, 'production cutover must remain false before independent live verification');

assert(bridge.rules?.legacy_gate_ids_are_immutable_during_bridge === true, 'legacy Gate IDs must remain immutable');
assert(bridge.rules?.legacy_g12_is_not_canonical_rfd === true, 'legacy G12 must not become canonical RFD');
assert(bridge.rules?.master_rfd_lot_predicate_set_is_authoritative === true, 'Master Blueprint RFD lot predicate set must be authoritative');
assert(bridge.rules?.unknown_canonical_readiness_must_not_be_coerced_to_ready === true, 'unknown readiness must never be coerced to Ready');
assert(bridge.rules?.manual_ready_flag_forbidden === true, 'manual Ready flag must remain forbidden');
assert(bridge.rules?.direct_browser_access_to_canonical_runtime_forbidden === true, 'direct browser access must remain forbidden');
assert(bridge.rules?.service_side_mutations_enabled === true, 'canonical mutations must be service-side');
assert(bridge.rules?.human_actor_identity_must_come_from_authenticated_server_adapter === true, 'human actor identity must come from authenticated adapter');
assert(bridge.rules?.formal_gate_approval_retries_must_be_idempotent_and_stale_safe === true, 'formal gate approval retries must be idempotent and stale-safe');
assert(bridge.rules?.runtime_activation_requires_explicit_adapter_cutover === true, 'adapter cutover must remain explicit');

const r7Requirements = requirementMap.requirements ?? [];
assert(r7Requirements.length === 28, `expected 28 R7 requirement mappings, got ${r7Requirements.length}`);
assert(unique(r7Requirements.map((item) => item.requirement_id)), 'R7 requirement mapping must remain unique');

requireMarkers(preprojectMigration, 'preproject bridge P3 migration', [
  'idea_canonical_requirement_check_v1',
  'idea_canonical_artifact_check_v1',
  'get_canonical_idea_preproject_readiness_v1',
  "'G0_BLUEPRINT_FIT'",
  "'G1_IDEA_DECISION_READY'",
  "'G2_GO_PROJECT'",
  "'G3_PROJECT_BASELINE'",
  "'FOUNDATION_READY'",
  "'EVIDENCE_READY'",
  "'STRATEGY_READY'",
  "'PREFIGURATION_READY'",
  "'DECISION_PACKAGE_READY'",
  'record_canonical_idea_decision_v1',
  'promote_canonical_approved_idea_to_project_definition_v1',
  'grant execute on function public.get_canonical_idea_preproject_readiness_v1(uuid) to service_role'
]);
requireMarkers(preprojectFixMigration, 'preproject bridge P3 forward-only fix', [
  'order by created_at desc',
  "'decision_actor_type',v_fit.decided_by_actor",
  'grant execute on function public.get_canonical_idea_preproject_readiness_v1(uuid) to service_role'
]);
requireMarkers(g3ActorHardeningMigration, 'G3 actor hardening P4 migration', [
  'promote_canonical_approved_idea_to_project_definition_v2',
  'p_actor_id uuid',
  "wm.role in ('owner','admin')",
  "raise exception 'PROJECT_PROMOTION_ACTOR_NOT_AUTHORIZED'",
  "raise exception 'CANONICAL_G2_NOT_READY'",
  "'authorized_by',p_actor_id",
  'grant execute on function public.promote_canonical_approved_idea_to_project_definition_v2(uuid,uuid,bigint,jsonb,jsonb,jsonb,text) to service_role'
]);
requireMarkers(canonicalIdeaAdapter, 'canonical Idea adapter', [
  "const COMMANDS=new Set(['canonical.read','decision.record'])",
  '/auth/v1/user',
  'get_idea_workspace_projection_v1',
  "p_decided_by:auth.user.id",
  'get_canonical_idea_preproject_readiness_v1',
  'record_canonical_idea_decision_v1'
]);
assert(!canonicalIdeaAdapter.includes('promote_canonical_approved_idea_to_project_definition_v2'), 'G3 promotion must not be exposed by browser adapter v1');
requireMarkers(workerEntry, 'Worker entry preproject cutover candidate', [
  "RUNTIME_VERSION='v4.5.16-project-definition-preproject-p3'",
  "url.pathname==='/api/ideas/canonical'",
  'idea_canonical_adapter_v1',
  'g3_promotion_browser_exposed:false'
]);

requireMarkers(coreGraphMigration, 'core graph migration', [
  'create table if not exists app_private.project_blueprint_packs_v1',
  'create table if not exists app_private.project_node_definitions_v1',
  'create table if not exists app_private.project_dependency_edges_v1',
  "'SITE_VITRINE','1.0-bridge-r7'",
  'project_blueprint_has_hard_cycle_v1',
  'get_project_definition_canonical_graph_v1'
]);
requireMarkers(deliveryClosureMigration, 'DeliveryLot/DependencyClosure migration', [
  'create table if not exists app_private.project_delivery_lots_v1',
  'create table if not exists app_private.project_delivery_lot_nodes_v1',
  'get_blueprint_dependency_closure_v1',
  'get_project_delivery_lot_dependency_closure_v1'
]);
requireMarkers(closurePredicatesMigration, 'closure predicate migration', [
  'create table if not exists app_private.project_ownership_assignments_v1',
  'create table if not exists app_private.project_conflict_records_v1',
  "resolution_level in ('UNRESOLVED','WORKING_ASSUMPTION','AI_PROPOSED','ACCEPTED_UNKNOWN')",
  "'dependency_closure_predicate'",
  "'critical_tbd_closure_predicate'",
  "'ownership_closure_predicate'"
]);
requireMarkers(qualityTestabilityMigration, 'quality/testability migration', [
  'create table if not exists app_private.project_readiness_node_policy_v1',
  "'QUALITY_REQUIREMENTS_DEFINED'",
  "'TESTABILITY_READY'",
  "acceptance_rule <> '{}'::jsonb",
  "testability_mode='EXPERT_SIGNOFF'"
]);
requireMarkers(baselineHandoffMigration, 'baseline/handoff migration', [
  'create table if not exists app_private.project_baseline_freezes_v1',
  'create table if not exists app_private.project_handoff_manifests_v1',
  'create_project_delivery_lot_baseline_candidate_v1',
  'create_project_delivery_lot_handoff_manifest_v1',
  "'BASELINE_READY'",
  "'HANDOFF_INTEGRITY'"
]);
requireMarkers(g4Migration, 'G4 migration', [
  'create table if not exists app_private.project_canonical_gate_states_v1',
  "where gate_id='G4_RFD_LOT'",
  'get_project_delivery_lot_rfd_readiness_v1',
  'approve_project_delivery_lot_rfd_v1',
  'G4_HUMAN_AUTHORITY_REQUIRED',
  'STALE_G4_READINESS',
  "status='FROZEN',frozen_at=now(),frozen_by=p_authorized_by",
  'grant execute on function public.approve_project_delivery_lot_rfd_v1(uuid,bigint,text,uuid) to service_role'
]);
requireMarkers(g5Migration, 'G5 migration', [
  'create table if not exists app_private.project_rfd_manifests_v1',
  "where gate_id='G5_RFD_PROJECT'",
  'get_project_rfd_pre_manifest_readiness_v1',
  'create_project_rfd_manifest_candidate_v1',
  'get_project_rfd_readiness_v1',
  'approve_project_rfd_v1',
  'G5_HUMAN_AUTHORITY_REQUIRED',
  'STALE_G5_READINESS',
  "'legacy_project_status_unchanged',true",
  'grant execute on function public.approve_project_rfd_v1(uuid,bigint,text,uuid) to service_role'
]);
requireMarkers(gateIdempotencyMigration, 'G4/G5 idempotency migration', [
  "v_existing.status='APPROVED'",
  "raise exception 'STALE_G4_APPROVAL'",
  "raise exception 'STALE_G5_APPROVAL'",
  "'idempotent',true",
  "'idempotent',false",
  'grant execute on function public.approve_project_delivery_lot_rfd_v1(uuid,bigint,text,uuid) to service_role',
  'grant execute on function public.approve_project_rfd_v1(uuid,bigint,text,uuid) to service_role'
]);
requireMarkers(completeRfdPredicateMigration, 'complete RFD predicate-set migration', [
  'get_project_readiness_predicates_v1',
  "'PROJECT_PRODUCT_READY'",
  "'PROJECT_EXPERIENCE_READY'",
  "'PROJECT_TECH_READY'",
  "'TRACEABILITY_READY'",
  "'source','R7_PROJECT_GATE_BRIDGE'",
  "'schema_version','1.1'",
  "(pre.payload->'predicates') || jsonb_build_object(",
  "pre.payload->>'status'='PASS'",
  "'BASELINE_READY'",
  "'HANDOFF_INTEGRITY'",
  'grant execute on function public.get_project_delivery_lot_rfd_readiness_v1(uuid) to service_role'
]);

if (!process.exitCode) {
  console.log('[canonical-runtime-bridge-v1] PASS');
  console.log(JSON.stringify({
    r7_requirement_mappings: r7Requirements.length,
    canonical_nodes: bridge.graph_contract.canonical_node_count,
    dependency_edges: bridge.graph_contract.dependency_edge_count,
    canonical_preproject_predicates: expectedPreprojectPredicates,
    canonical_rfd_predicates: implementedPredicates,
    canonical_rfd_predicate_count: implementedPredicates.length,
    canonical_formal_gates_implemented: implementedGates,
    production_cutover_certified: bridge.adapter_contract.production_cutover_certified,
    g3_browser_exposed: bridge.adapter_contract.g3_promotion_browser_exposed,
    browser_direct_access: false
  }));
}

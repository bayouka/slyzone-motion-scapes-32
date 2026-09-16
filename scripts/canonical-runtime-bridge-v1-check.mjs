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
let coreGraphMigration;
let deliveryClosureMigration;
let closurePredicatesMigration;
let qualityTestabilityMigration;
let baselineHandoffMigration;
let g4Migration;
let g5Migration;
let gateIdempotencyMigration;
try {
  master = readJson('MASTER_BLUEPRINT_V1.json');
  bridge = readJson('CANONICAL_RUNTIME_BRIDGE_V1.json');
  requirementMap = readJson(path.join('site-vitrine', 'SITE_VITRINE_LEGACY_REQUIREMENT_TO_CANONICAL_V1.json'));
  coreGraphMigration = readText('supabase/migrations/20260916153749_project_master_blueprint_v1_core_graph_runtime.sql');
  deliveryClosureMigration = readText('supabase/migrations/20260916154153_project_master_blueprint_v1_delivery_lot_dependency_closure.sql');
  closurePredicatesMigration = readText('supabase/migrations/20260916154611_project_master_blueprint_v1_dependency_closure_predicates.sql');
  qualityTestabilityMigration = readText('supabase/migrations/20260916155201_project_master_blueprint_v1_quality_testability_predicates.sql');
  baselineHandoffMigration = readText('supabase/migrations/20260916155544_project_master_blueprint_v1_baseline_handoff_predicates.sql');
  g4Migration = readText('supabase/migrations/20260916155824_project_master_blueprint_v1_g4_rfd_lot.sql');
  g5Migration = readText('supabase/migrations/20260916155938_project_master_blueprint_v1_g5_rfd_project.sql');
  gateIdempotencyMigration = readText('supabase/migrations/20260916162910_project_master_blueprint_v1_g4_g5_idempotent_approval.sql');
} catch (error) {
  fail(`cannot parse runtime bridge source: ${error.message}`);
  process.exit(1);
}

assert(bridge.schema_version === '1.0', 'bridge schema_version must be 1.0');
assert(bridge.contract_id === 'PROJECT_DEFINITION_CANONICAL_RUNTIME_BRIDGE', 'unexpected bridge contract_id');
assert(bridge.contract_version === '1.2', 'bridge contract_version must be 1.2');
assert(bridge.status === 'CANONICAL_MIGRATION_CONTRACT', 'bridge must be a canonical migration contract');
assert(bridge.source_runtime === 'R7_BUILD_READY_RUNTIME', 'bridge source runtime must stay R7');
assert(bridge.target_contract === '4B4C_PROJECT_MASTER_BLUEPRINT_V1', 'bridge target contract mismatch');

assert(bridge.coverage?.requirement_domain_classification === 'FULL_FOR_R7_REQUIREMENT_SET', 'R7 requirement classification must remain complete');
assert(bridge.coverage?.legacy_readiness_projection === 'PARTIAL', 'legacy readiness projection must remain explicitly partial');
assert(bridge.coverage?.core_graph === 'IMPLEMENTED_SERVICE_ONLY', 'core graph must be service-only implemented');
assert(bridge.coverage?.canonical_node_state_projection === 'IMPLEMENTED_R7_BRIDGE', 'canonical node state projection must remain an R7 bridge');
assert(bridge.coverage?.delivery_lots === 'IMPLEMENTED_SERVICE_ONLY', 'DeliveryLot runtime must be service-only implemented');
assert(bridge.coverage?.dependency_closure === 'IMPLEMENTED_SERVICE_ONLY', 'DependencyClosure runtime must be service-only implemented');
assert(bridge.coverage?.rfd_predicates === 'SEVEN_IMPLEMENTED_SERVICE_ONLY', 'all seven RFD predicates must be implemented service-only');
assert(bridge.coverage?.baseline_handoff === 'IMPLEMENTED_SERVICE_ONLY', 'baseline/handoff runtime must be service-only implemented');
assert(bridge.coverage?.canonical_formal_gates === 'G4_G5_IMPLEMENTED_SERVICE_ONLY', 'only canonical G4/G5 must be implemented in this slice');
assert(bridge.coverage?.canonical_gate_retry_idempotency === 'G4_G5_IMPLEMENTED', 'G4/G5 retry idempotency must be implemented');
assert(bridge.coverage?.canonical_pre_g4_gates === 'G0_G3_NOT_IMPLEMENTED_IN_THIS_RUNTIME_SLICE', 'G0-G3 status must remain explicit');

const expectedRuntimeObjects = {
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

assert(bridge.graph_contract?.blueprint_id === 'SITE_VITRINE', 'graph bridge blueprint id mismatch');
assert(bridge.graph_contract?.blueprint_version === '1.0-bridge-r7', 'graph bridge blueprint version mismatch');
assert(bridge.graph_contract?.canonical_node_count === 28, 'graph bridge must define exactly 28 canonical nodes');
assert(bridge.graph_contract?.dependency_edge_count === 33, 'graph bridge must define exactly 33 dependency edges');
assert(bridge.graph_contract?.hard_edge_count === 31, 'graph bridge must define exactly 31 HARD edges');
assert(bridge.graph_contract?.soft_edge_count === 2, 'graph bridge must define exactly 2 SOFT edges');
assert(bridge.graph_contract?.hard_dependency_cycles_allowed === false, 'HARD dependency cycles must remain forbidden');
assert(bridge.graph_contract?.legacy_requirement_state_source_retained === true, 'R7 requirement state source must remain retained');

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
}

const g12Passthrough = bridge.legacy_gate_passthrough_only ?? [];
assert(g12Passthrough.length === 1, 'exactly one legacy passthrough gate is expected');
assert(g12Passthrough[0]?.legacy_gate_id === 'G12_READY_FOR_DEVELOPMENT', 'legacy G12 must remain passthrough-only');
assert((g12Passthrough[0]?.reason ?? '').includes('must never be relabeled'), 'legacy G12 separation rationale required');

const expectedRfdPredicates = [
  'DEPENDENCY_CLOSURE',
  'CRITICAL_TBD_CLOSURE',
  'OWNERSHIP_CLOSURE',
  'QUALITY_REQUIREMENTS_DEFINED',
  'TESTABILITY_READY',
  'BASELINE_READY',
  'HANDOFF_INTEGRITY'
];
const implementedPredicates = bridge.canonical_rfd_predicates_implemented ?? [];
assert(JSON.stringify(implementedPredicates) === JSON.stringify(expectedRfdPredicates), 'canonical RFD predicate list mismatch');
for (const predicate of expectedRfdPredicates) {
  assert(master.readiness_predicates?.includes(predicate), `${predicate} must exist in Master Blueprint V1`);
}

assert(bridge.dependency_closure_bridge_basis?.structural_graph === 'CANONICAL_D01_D16_HARD_REQUIRES', 'DependencyClosure structural basis mismatch');
assert(bridge.dependency_closure_bridge_basis?.accepted_unknown_satisfies_structural_requirement === false, 'ACCEPTED_UNKNOWN must not satisfy structural requirements');
assert(bridge.dependency_closure_bridge_basis?.manual_ready_flag === false, 'DependencyClosure must not use manual Ready');

const implementedGates = bridge.canonical_formal_gates_implemented ?? [];
assert(JSON.stringify(implementedGates) === JSON.stringify(['G4_RFD_LOT','G5_RFD_PROJECT']), 'implemented canonical Formal Gates mismatch');
for (const gateId of implementedGates) {
  assert(master.formal_gates?.some((gate) => gate.id === gateId), `${gateId} missing from Master Blueprint V1`);
}
const notImplementedGates = bridge.canonical_formal_gates_not_implemented_in_this_slice ?? [];
assert(JSON.stringify(notImplementedGates) === JSON.stringify(['G0_BLUEPRINT_FIT','G1_IDEA_DECISION_READY','G2_GO_PROJECT','G3_PROJECT_BASELINE']), 'G0-G3 non-implementation boundary mismatch');

for (const key of [
  'derived_readiness_required',
  'all_seven_rfd_predicates_must_pass',
  'expected_definition_revision_required',
  'expected_evaluation_fingerprint_required',
  'human_authority_required',
  'authorized_actor_must_be_idea_creator_or_workspace_owner_admin',
  'freezes_lot_baseline_and_handoff_atomically',
  'same_revision_same_fingerprint_retry_is_idempotent',
  'different_revision_or_fingerprint_retry_is_rejected'
]) assert(bridge.g4_policy?.[key] === true, `G4 policy ${key} must be true`);

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

assert(bridge.rules?.legacy_gate_ids_are_immutable_during_bridge === true, 'legacy Gate IDs must remain immutable');
assert(bridge.rules?.legacy_g12_is_not_canonical_rfd === true, 'legacy G12 must not become canonical RFD');
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

if (!process.exitCode) {
  console.log('[canonical-runtime-bridge-v1] PASS');
  console.log(JSON.stringify({
    r7_requirement_mappings: r7Requirements.length,
    canonical_nodes: bridge.graph_contract.canonical_node_count,
    dependency_edges: bridge.graph_contract.dependency_edge_count,
    canonical_rfd_predicates: implementedPredicates,
    canonical_formal_gates_implemented: implementedGates,
    canonical_formal_gates_pending: notImplementedGates,
    canonical_gate_retry_idempotency: bridge.coverage.canonical_gate_retry_idempotency,
    browser_direct_access: false
  }));
}

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

let master;
let bridge;
let requirementMap;
let coreGraphMigration;
let deliveryClosureMigration;
try {
  master = readJson('MASTER_BLUEPRINT_V1.json');
  bridge = readJson('CANONICAL_RUNTIME_BRIDGE_V1.json');
  requirementMap = readJson(path.join('site-vitrine', 'SITE_VITRINE_LEGACY_REQUIREMENT_TO_CANONICAL_V1.json'));
  coreGraphMigration = readText('supabase/migrations/20260916153749_project_master_blueprint_v1_core_graph_runtime.sql');
  deliveryClosureMigration = readText('supabase/migrations/20260916154153_project_master_blueprint_v1_delivery_lot_dependency_closure.sql');
} catch (error) {
  fail(`cannot parse runtime bridge source: ${error.message}`);
  process.exit(1);
}

assert(bridge.schema_version === '1.0', 'bridge schema_version must be 1.0');
assert(bridge.contract_id === 'PROJECT_DEFINITION_CANONICAL_RUNTIME_BRIDGE', 'unexpected bridge contract_id');
assert(bridge.status === 'CANONICAL_MIGRATION_CONTRACT', 'bridge must be a canonical migration contract');
assert(bridge.source_runtime === 'R7_BUILD_READY_RUNTIME', 'bridge source runtime must stay R7');
assert(bridge.target_contract === '4B4C_PROJECT_MASTER_BLUEPRINT_V1', 'bridge target contract mismatch');

assert(bridge.coverage?.requirement_domain_classification === 'FULL_FOR_R7_REQUIREMENT_SET', 'R7 requirement classification must remain complete');
assert(bridge.coverage?.legacy_readiness_projection === 'PARTIAL', 'legacy readiness projection must remain explicitly partial');
assert(bridge.coverage?.core_graph === 'IMPLEMENTED_SERVICE_ONLY', 'core graph runtime must be marked service-only implemented');
assert(bridge.coverage?.canonical_node_state_projection === 'IMPLEMENTED_R7_BRIDGE', 'canonical node state projection must remain an R7 bridge');
assert(bridge.coverage?.delivery_lots === 'SCHEMA_IMPLEMENTED_SERVICE_ONLY', 'DeliveryLot runtime must remain service-only until an explicit activation');
assert(bridge.coverage?.dependency_closure === 'STRUCTURAL_IMPLEMENTED_STATE_DIAGNOSTICS_PARTIAL', 'DependencyClosure must remain explicitly partial');
assert(bridge.coverage?.canonical_formal_gates === 'NOT_RUNTIME_COMPLETE', 'canonical Formal Gates must not be declared runtime-complete');

const expectedRuntimeObjects = {
  blueprint_pack: 'app_private.project_blueprint_packs_v1',
  node_definitions: 'app_private.project_node_definitions_v1',
  dependency_edges: 'app_private.project_dependency_edges_v1',
  delivery_lots: 'app_private.project_delivery_lots_v1',
  delivery_lot_nodes: 'app_private.project_delivery_lot_nodes_v1',
  canonical_graph_read: 'public.get_project_definition_canonical_graph_v1(uuid)',
  blueprint_dependency_closure: 'app_private.get_blueprint_dependency_closure_v1(text,text,text[])',
  delivery_lot_dependency_closure: 'public.get_project_delivery_lot_dependency_closure_v1(uuid)'
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
assert(bridge.graph_contract?.legacy_requirement_state_source_retained === true, 'R7 requirement state source must remain retained during bridge');

const expectedLegacyGateMappings = [
  ['G8_PROJECT_PRODUCT_DEFINITION_STABLE', 'PROJECT_PRODUCT_READY'],
  ['G9_PROJECT_EXPERIENCE_DEFINITION_STABLE', 'PROJECT_EXPERIENCE_READY'],
  ['G10_PROJECT_TECH_NFR_STABLE', 'PROJECT_TECH_READY'],
  ['G11_TRACEABILITY_AND_ACCEPTANCE_READY', 'TRACEABILITY_READY']
];
const gateMappings = Array.isArray(bridge.legacy_gate_to_readiness_predicate)
  ? bridge.legacy_gate_to_readiness_predicate
  : [];
assert(gateMappings.length === expectedLegacyGateMappings.length, `expected ${expectedLegacyGateMappings.length} legacy gate mappings`);
assert(unique(gateMappings.map((item) => item.legacy_gate_id)), 'legacy bridge gate ids must be unique');
assert(unique(gateMappings.map((item) => item.canonical_predicate_id)), 'canonical bridge predicates must be unique');
for (let index = 0; index < expectedLegacyGateMappings.length; index += 1) {
  const [legacyGateId, canonicalPredicateId] = expectedLegacyGateMappings[index];
  const actual = gateMappings[index];
  assert(actual?.legacy_gate_id === legacyGateId, `legacy gate mapping ${index} must remain ${legacyGateId}`);
  assert(actual?.canonical_predicate_id === canonicalPredicateId, `${legacyGateId} must map to ${canonicalPredicateId}`);
  assert(master.readiness_predicates?.includes(canonicalPredicateId), `${canonicalPredicateId} must exist in Master Blueprint V1`);
}

const g12Passthrough = Array.isArray(bridge.legacy_gate_passthrough_only)
  ? bridge.legacy_gate_passthrough_only
  : [];
assert(g12Passthrough.length === 1, 'exactly one legacy passthrough gate is expected');
assert(g12Passthrough[0]?.legacy_gate_id === 'G12_READY_FOR_DEVELOPMENT', 'G12 must remain the only legacy passthrough gate');
assert(typeof g12Passthrough[0]?.reason === 'string' && g12Passthrough[0].reason.trim(), 'G12 passthrough requires an explicit rationale');

const notYetDerivable = bridge.canonical_predicates_not_yet_derivable_from_r7 ?? [];
for (const predicate of [
  'QUALITY_REQUIREMENTS_DEFINED',
  'TESTABILITY_READY',
  'DEPENDENCY_CLOSURE',
  'CRITICAL_TBD_CLOSURE',
  'OWNERSHIP_CLOSURE',
  'BASELINE_READY',
  'HANDOFF_INTEGRITY'
]) {
  assert(master.readiness_predicates?.includes(predicate), `${predicate} must exist in Master Blueprint V1`);
  assert(notYetDerivable.includes(predicate), `${predicate} must remain explicitly not derivable from legacy R7`);
}

const expectedPartialBoundaries = ['CRITICAL_TBD','OWNERSHIP_CLOSURE','CONFLICTS','CANONICAL_FULFILMENT'];
assert(JSON.stringify(bridge.dependency_closure_partial_boundaries) === JSON.stringify(expectedPartialBoundaries), 'partial DependencyClosure boundaries mismatch');

const canonicalFormalGateIds = (master.formal_gates ?? []).map((gate) => gate.id);
const notEmitted = bridge.canonical_formal_gates_not_emitted_by_bridge ?? [];
assert(JSON.stringify(notEmitted) === JSON.stringify(canonicalFormalGateIds), 'bridge must emit none of the canonical Formal Gates during compatibility phase');

assert(bridge.rules?.legacy_gate_ids_are_immutable_during_bridge === true, 'legacy Gate IDs must remain immutable during bridge');
assert(bridge.rules?.legacy_g12_is_not_canonical_rfd === true, 'legacy G12 must not be relabeled as canonical RFD');
assert(bridge.rules?.unknown_canonical_readiness_must_not_be_coerced_to_ready === true, 'unknown canonical readiness must never be coerced to READY');
assert(bridge.rules?.manual_ready_flag_forbidden === true, 'manual Ready flag must remain forbidden');
assert(bridge.rules?.bridge_is_read_only === true, 'runtime bridge must remain read-only');
assert(bridge.rules?.runtime_activation_requires_explicit_followup_migration === true, 'runtime activation must require an explicit migration');

const r7Requirements = requirementMap.requirements ?? [];
assert(r7Requirements.length === 28, `expected 28 R7 requirement mappings, got ${r7Requirements.length}`);
assert(unique(r7Requirements.map((item) => item.requirement_id)), 'R7 requirement mapping must remain unique');

for (const marker of [
  'create table if not exists app_private.project_blueprint_packs_v1',
  'create table if not exists app_private.project_node_definitions_v1',
  'create table if not exists app_private.project_dependency_edges_v1',
  "'SITE_VITRINE','1.0-bridge-r7'",
  'project_blueprint_has_hard_cycle_v1',
  'get_project_definition_canonical_graph_v1'
]) {
  assert(coreGraphMigration.includes(marker), `core graph migration marker missing: ${marker}`);
}

for (const marker of [
  'create table if not exists app_private.project_delivery_lots_v1',
  'create table if not exists app_private.project_delivery_lot_nodes_v1',
  'get_blueprint_dependency_closure_v1',
  'get_project_delivery_lot_dependency_closure_v1',
  "'canonical_dependency_closure_predicate','PARTIAL_NOT_EVALUABLE'",
  "jsonb_build_array('CRITICAL_TBD','OWNERSHIP_CLOSURE','CONFLICTS','CANONICAL_FULFILMENT')"
]) {
  assert(deliveryClosureMigration.includes(marker), `DeliveryLot/DependencyClosure migration marker missing: ${marker}`);
}

if (!process.exitCode) {
  console.log('[canonical-runtime-bridge-v1] PASS');
  console.log(JSON.stringify({
    r7_requirement_mappings: r7Requirements.length,
    canonical_nodes: bridge.graph_contract.canonical_node_count,
    dependency_edges: bridge.graph_contract.dependency_edge_count,
    legacy_gate_predicate_mappings: gateMappings.length,
    canonical_formal_gates_emitted: 0,
    delivery_lots_runtime: bridge.coverage.delivery_lots,
    dependency_closure_runtime: bridge.coverage.dependency_closure
  }));
}

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const contractPath = path.join(root, 'docs', 'project-definition', 'machine', 'MASTER_BLUEPRINT_V1.json');

const fail = (message) => {
  console.error(`[master-blueprint-v1] FAIL: ${message}`);
  process.exitCode = 1;
};

const assert = (condition, message) => {
  if (!condition) fail(message);
};

const unique = (values) => new Set(values).size === values.length;

let contract;
try {
  contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
} catch (error) {
  fail(`cannot parse ${path.relative(root, contractPath)}: ${error.message}`);
  process.exit(1);
}

assert(contract.schema_version === '1.0', 'schema_version must be 1.0');
assert(contract.contract_id === '4B4C_PROJECT_MASTER_BLUEPRINT', 'unexpected contract_id');
assert(contract.status === 'CANONICAL', 'contract must be CANONICAL');
assert(contract.authority === 'docs/project-definition/canonical/PROJECT_MASTER_BLUEPRINT_V1.md', 'authority path mismatch');

const expectedLayers = ['CORE_ONTOLOGY', 'BLUEPRINT_PACK', 'PROJECT_INSTANCE'];
assert(JSON.stringify(contract.layers) === JSON.stringify(expectedLayers), 'canonical three-layer architecture mismatch');

const domains = Array.isArray(contract.domains) ? contract.domains : [];
assert(domains.length === 16, `expected 16 domains, got ${domains.length}`);
const domainIds = domains.map((item) => item.id);
const expectedDomainIds = Array.from({ length: 16 }, (_, index) => `D${String(index + 1).padStart(2, '0')}`);
assert(JSON.stringify(domainIds) === JSON.stringify(expectedDomainIds), `domain ids must be contiguous D01..D16, got ${domainIds.join(', ')}`);
assert(unique(domainIds), 'domain ids must be unique');
assert(domains.every((item) => typeof item.name === 'string' && item.name.trim()), 'every domain must have a name');

const requiredCoreObjects = [
  'BlueprintDefinition',
  'ProjectInstance',
  'NodeDefinition',
  'ProjectNodeState',
  'ClaimRecord',
  'EvidenceRecord',
  'AssumptionRecord',
  'RecommendationRecord',
  'DecisionRecord',
  'DependencyEdge',
  'ApplicabilityAssessment',
  'ScopeCommitment',
  'ExceptionRecord',
  'ActorRole',
  'ResponsibilityAssignment',
  'QualityRequirement',
  'RiskRecord',
  'TestCaseDefinition',
  'DeliveryLot',
  'DependencyClosure',
  'HandoffManifest',
  'BaselineFreeze',
  'ChangeRequest'
];
const coreObjects = Array.isArray(contract.core_objects) ? contract.core_objects : [];
assert(unique(coreObjects), 'core_objects must be unique');
for (const objectName of requiredCoreObjects) {
  assert(coreObjects.includes(objectName), `missing canonical core object ${objectName}`);
}

const expectedRelationTypes = [
  'REQUIRES',
  'INFORMS',
  'DERIVED_FROM',
  'SUPPORTS',
  'CHALLENGES',
  'CONTRADICTS',
  'SATISFIES',
  'INVALIDATES',
  'REFERENCES',
  'PRODUCES'
];
assert(unique(contract.relation_types ?? []), 'relation_types must be unique');
for (const relation of expectedRelationTypes) {
  assert(contract.relation_types?.includes(relation), `missing relation type ${relation}`);
}
assert(contract.dependency_policy?.hard_subgraph_must_be_acyclic === true, 'HARD dependency subgraph must be acyclic');
assert(contract.dependency_policy?.soft_cycles_allowed === true, 'SOFT dependency cycles must stay allowed');
assert(contract.dependency_policy?.targeted_stale_propagation === true, 'targeted stale propagation must be enabled');
assert(contract.dependency_policy?.targeted_recompute_only === true, 'targeted recompute must be enabled');

const applicability = contract.applicability_states ?? [];
for (const state of ['APPLICABLE', 'NOT_APPLICABLE', 'CONDITIONAL', 'UNRESOLVED']) {
  assert(applicability.includes(state), `missing applicability state ${state}`);
}

const fulfilmentStages = contract.fulfilment_stages ?? [];
assert(JSON.stringify(fulfilmentStages) === JSON.stringify(['DEFINITION', 'RFD', 'IMPLEMENTATION', 'PRE_RELEASE', 'POST_RELEASE']), 'FulfilmentStage sequence mismatch');

const gates = Array.isArray(contract.formal_gates) ? contract.formal_gates : [];
const expectedGates = [
  'G0_BLUEPRINT_FIT',
  'G1_IDEA_DECISION_READY',
  'G2_GO_PROJECT',
  'G3_PROJECT_BASELINE',
  'G4_RFD_LOT',
  'G5_RFD_PROJECT'
];
assert(gates.length === expectedGates.length, `expected 6 Formal Gates, got ${gates.length}`);
assert(JSON.stringify(gates.map((gate) => gate.id)) === JSON.stringify(expectedGates), 'Formal Gate ids/order mismatch');
assert(gates.every((gate) => gate.phase_transition === true), 'every Formal Gate must represent a phase transition');
for (const humanGateId of ['G2_GO_PROJECT', 'G4_RFD_LOT', 'G5_RFD_PROJECT']) {
  const gate = gates.find((item) => item.id === humanGateId);
  assert(gate?.human_authority_required === true, `${humanGateId} must require human authority`);
}

const predicates = contract.readiness_predicates ?? [];
assert(unique(predicates), 'readiness_predicates must be unique');
const rfdPredicates = contract.rfd_lot_required_predicates ?? [];
for (const predicate of [
  'QUALITY_REQUIREMENTS_DEFINED',
  'TESTABILITY_READY',
  'DEPENDENCY_CLOSURE',
  'CRITICAL_TBD_CLOSURE',
  'OWNERSHIP_CLOSURE',
  'BASELINE_READY',
  'HANDOFF_INTEGRITY'
]) {
  assert(predicates.includes(predicate), `missing readiness predicate ${predicate}`);
  assert(rfdPredicates.includes(predicate), `RFD lot must require ${predicate}`);
}

assert(contract.authority_policy?.ai_may_approve_human_gate === false, 'AI must never approve a human authority gate');
assert(contract.authority_policy?.go_requires_explicit_human_authority === true, 'GO must require explicit human authority');
assert(contract.rfd_policy?.manual_ready_flag_forbidden === true, 'manual RFD flag must be forbidden');
assert(contract.rfd_policy?.critical_tbd_must_equal_zero === true, 'Critical TBD must equal zero for RFD');
assert(contract.rfd_policy?.versioned_baseline_required === true, 'RFD must require a versioned baseline');
assert(contract.rfd_policy?.handoff_manifest_required === true, 'RFD must require a HandoffManifest');

const separations = contract.truth_separation_invariants ?? [];
for (const invariant of [
  'CLAIM_NE_EVIDENCE',
  'EVIDENCE_NE_ASSUMPTION',
  'ASSUMPTION_NE_RECOMMENDATION',
  'RECOMMENDATION_NE_DECISION',
  'REQUIREMENT_NE_TEST',
  'TEST_NE_EXECUTION_EVIDENCE',
  'AI_INFERENCE_NE_HUMAN_TRUTH',
  'FORMAL_GATE_NE_READINESS_PREDICATE',
  'APPLICABILITY_NE_FULFILMENT'
]) {
  assert(separations.includes(invariant), `missing truth-separation invariant ${invariant}`);
}

assert(contract.compatibility?.legacy_runtime_must_remain_operational_until_explicit_migration === true, 'legacy runtime compatibility guard missing');
assert(contract.compatibility?.silent_persisted_id_rewrite_forbidden === true, 'silent persisted id rewrite must be forbidden');

if (!process.exitCode) {
  console.log('[master-blueprint-v1] PASS');
  console.log(JSON.stringify({
    domains: domains.length,
    formal_gates: gates.length,
    readiness_predicates: predicates.length,
    core_objects: coreObjects.length,
    legacy_machine_blueprints: contract.compatibility?.legacy_machine_blueprints ?? []
  }));
}

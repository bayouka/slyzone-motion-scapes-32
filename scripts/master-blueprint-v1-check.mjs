import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const machineDir = path.join(root, 'docs', 'project-definition', 'machine');
const contractPath = path.join(machineDir, 'MASTER_BLUEPRINT_V1.json');
const migrationPath = path.join(machineDir, 'LEGACY_D22_TO_D16_MAPPING_V1.json');
const siteVitrineRequirementMappingPath = path.join(
  machineDir,
  'site-vitrine',
  'SITE_VITRINE_LEGACY_REQUIREMENT_TO_CANONICAL_V1.json'
);

const fail = (message) => {
  console.error(`[master-blueprint-v1] FAIL: ${message}`);
  process.exitCode = 1;
};

const assert = (condition, message) => {
  if (!condition) fail(message);
};

const unique = (values) => new Set(values).size === values.length;

const readJson = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(`cannot parse ${path.relative(root, filePath)}: ${error.message}`);
    return null;
  }
};

const contract = readJson(contractPath);
const migration = readJson(migrationPath);
const siteVitrineRequirementMapping = readJson(siteVitrineRequirementMappingPath);
if (!contract || !migration || !siteVitrineRequirementMapping) process.exit(1);

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

// Explicit D01..D22 -> D01..D16 migration contract.
assert(migration.schema_version === '1.0', 'legacy mapping schema_version must be 1.0');
assert(migration.mapping_id === 'PROJECT_DEFINITION_D22_TO_D16', 'unexpected legacy mapping_id');
assert(migration.status === 'CANONICAL_MIGRATION_CONTRACT', 'legacy mapping must be canonical');
assert(migration.migration_policy?.rewrite_persisted_ids_in_place === false, 'legacy persisted ids must not be rewritten in place');
assert(migration.migration_policy?.preserve_source_identity === true, 'legacy source identity must be preserved');
assert(migration.migration_policy?.store_target_classification_separately === true, 'target classification must be stored separately');
assert(migration.migration_policy?.require_explicit_mapping_for_every_legacy_domain === true, 'every legacy domain must have explicit mapping');
assert(migration.migration_policy?.runtime_activation_implicit === false, 'mapping must not activate runtime implicitly');

const mappings = Array.isArray(migration.mappings) ? migration.mappings : [];
const expectedLegacyDomainIds = Array.from({ length: 22 }, (_, index) => `D${String(index + 1).padStart(2, '0')}`);
const mappedLegacyIds = mappings.map((item) => item.legacy_id);
assert(mappings.length === 22, `expected 22 legacy mappings, got ${mappings.length}`);
assert(unique(mappedLegacyIds), 'legacy mapping ids must be unique');
assert(JSON.stringify(mappedLegacyIds) === JSON.stringify(expectedLegacyDomainIds), `legacy mappings must cover D01..D22 in order, got ${mappedLegacyIds.join(', ')}`);

const allowedMappingStrategies = new Set(['DIRECT', 'SPLIT', 'TRANSVERSAL']);
for (const mapping of mappings) {
  const targets = Array.isArray(mapping.targets) ? mapping.targets : [];
  assert(typeof mapping.legacy_name === 'string' && mapping.legacy_name.trim(), `${mapping.legacy_id}: legacy_name required`);
  assert(allowedMappingStrategies.has(mapping.strategy), `${mapping.legacy_id}: invalid strategy ${mapping.strategy}`);
  assert(targets.length > 0, `${mapping.legacy_id}: at least one target required`);
  assert(unique(targets), `${mapping.legacy_id}: target list must be unique`);
  assert(targets.every((target) => domainIds.includes(target)), `${mapping.legacy_id}: all targets must exist in canonical D01..D16`);
  assert(targets.includes(mapping.primary_target), `${mapping.legacy_id}: primary_target must be included in targets`);
  assert(typeof mapping.note === 'string' && mapping.note.trim(), `${mapping.legacy_id}: explanatory note required`);
  if (mapping.strategy === 'DIRECT') {
    assert(targets.length === 1, `${mapping.legacy_id}: DIRECT mapping must have exactly one target`);
  }
  if (mapping.strategy === 'SPLIT' || mapping.strategy === 'TRANSVERSAL') {
    assert(targets.length >= 2, `${mapping.legacy_id}: ${mapping.strategy} mapping must have at least two targets`);
  }
}

// Current R7 Site-vitrine persisted Requirement IDs -> canonical D01..D16 classification.
assert(siteVitrineRequirementMapping.schema_version === '1.0', 'Site-vitrine requirement mapping schema_version must be 1.0');
assert(siteVitrineRequirementMapping.mapping_id === 'SITE_VITRINE_R7_REQUIREMENT_TO_CANONICAL_DOMAIN', 'unexpected Site-vitrine requirement mapping_id');
assert(siteVitrineRequirementMapping.status === 'CANONICAL_MIGRATION_CONTRACT', 'Site-vitrine requirement mapping must be canonical');
assert(siteVitrineRequirementMapping.migration_policy?.rewrite_requirement_id === false, 'persisted R7 requirement ids must not be rewritten');
assert(siteVitrineRequirementMapping.migration_policy?.rewrite_legacy_gate_id === false, 'legacy R7 gate ids must not be rewritten');
assert(siteVitrineRequirementMapping.migration_policy?.preserve_legacy_runtime_semantics === true, 'legacy R7 runtime semantics must be preserved');
assert(siteVitrineRequirementMapping.migration_policy?.canonical_classification_is_parallel === true, 'canonical classification must be parallel during migration');
assert(siteVitrineRequirementMapping.migration_policy?.runtime_activation_implicit === false, 'requirement mapping must not activate runtime implicitly');

const expectedR7RequirementIds = [
  'SV.PRJ.APPROVED_BASELINE',
  'SV.D08.JOURNEY_SPEC',
  'SV.D09.PAGE_MANIFEST',
  'SV.D10.CONTENT_REQUIREMENTS',
  'SV.D11.SEO_PAGE_MAP',
  'SV.D11.REDIRECT_MAP',
  'SV.D12.FUNCTIONAL_REQUIREMENTS',
  'SV.D12.UI_STATES',
  'SV.D12.BUSINESS_RULES',
  'SV.D13.CONTENT_DATA_MODEL',
  'SV.D13.ROLE_PERMISSION_MATRIX',
  'SV.D14.INTEGRATION_CONTRACTS',
  'SV.D15.WIREFRAME_BASELINE',
  'SV.D15.DESIGN_DEFINITION',
  'SV.D15.RESPONSIVE_BEHAVIOR',
  'SV.D16.DELIVERY_APPROACH',
  'SV.D16.ARCHITECTURE',
  'SV.D16.ENV_HOSTING_OPS',
  'SV.D17.PRIVACY_SECURITY',
  'SV.D17.EXPERT_SIGNOFF',
  'SV.D18.ACCESSIBILITY_TARGET',
  'SV.D18.PERFORMANCE_RELIABILITY',
  'SV.D19.MEASUREMENT_PLAN',
  'SV.D20.ACCEPTANCE_CRITERIA',
  'SV.D20.SOURCE_OF_TRUTH_MANIFEST',
  'SV.D20.IMPLEMENTATION_DISCRETION',
  'SV.D20.DEVELOPER_AMBIGUITY_AUDIT',
  'SV.D20.READY_APPROVAL'
];
const requirementMappings = Array.isArray(siteVitrineRequirementMapping.requirements)
  ? siteVitrineRequirementMapping.requirements
  : [];
const mappedRequirementIds = requirementMappings.map((item) => item.requirement_id);
assert(requirementMappings.length === expectedR7RequirementIds.length, `expected ${expectedR7RequirementIds.length} Site-vitrine R7 requirement mappings, got ${requirementMappings.length}`);
assert(unique(mappedRequirementIds), 'Site-vitrine R7 requirement mapping ids must be unique');
assert(JSON.stringify(mappedRequirementIds) === JSON.stringify(expectedR7RequirementIds), 'Site-vitrine R7 requirement mapping must cover the exact persisted R7 requirement set in stable order');

for (const mapping of requirementMappings) {
  const canonicalDomainIds = Array.isArray(mapping.canonical_domain_ids) ? mapping.canonical_domain_ids : [];
  assert(typeof mapping.legacy_domain_id === 'string' && mapping.legacy_domain_id.trim(), `${mapping.requirement_id}: legacy_domain_id required`);
  assert(canonicalDomainIds.length > 0, `${mapping.requirement_id}: at least one canonical domain required`);
  assert(unique(canonicalDomainIds), `${mapping.requirement_id}: canonical domain ids must be unique`);
  assert(canonicalDomainIds.every((domainId) => domainIds.includes(domainId)), `${mapping.requirement_id}: canonical domains must exist in D01..D16`);
  assert(canonicalDomainIds.includes(mapping.canonical_primary_domain_id), `${mapping.requirement_id}: canonical_primary_domain_id must be included in canonical_domain_ids`);
  assert(typeof mapping.rationale === 'string' && mapping.rationale.trim(), `${mapping.requirement_id}: rationale required`);
  if (mapping.legacy_domain_id !== 'PRJ') {
    assert(expectedLegacyDomainIds.includes(mapping.legacy_domain_id), `${mapping.requirement_id}: invalid legacy domain id ${mapping.legacy_domain_id}`);
  }
}

if (!process.exitCode) {
  console.log('[master-blueprint-v1] PASS');
  console.log(JSON.stringify({
    domains: domains.length,
    formal_gates: gates.length,
    readiness_predicates: predicates.length,
    core_objects: coreObjects.length,
    legacy_domain_mappings: mappings.length,
    site_vitrine_r7_requirement_mappings: requirementMappings.length,
    legacy_machine_blueprints: contract.compatibility?.legacy_machine_blueprints ?? []
  }));
}

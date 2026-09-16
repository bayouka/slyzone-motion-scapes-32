import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const machineDir=path.join(root,'docs','project-definition','machine');
const readJson=(relative)=>JSON.parse(fs.readFileSync(path.join(machineDir,relative),'utf8'));
const readText=(relative)=>fs.readFileSync(path.join(root,relative),'utf8');
const fail=(message)=>{console.error(`[canonical-runtime-bridge-v1] FAIL: ${message}`);process.exitCode=1;};
const assert=(condition,message)=>{if(!condition)fail(message);};
const unique=(values)=>new Set(values).size===values.length;
const markers=(text,label,values)=>{for(const value of values)assert(text.includes(value),`${label} marker missing: ${value}`);};

let master,bridge,requirementMap,p3,p3fix,p4,p5,g4,g5,g45Retry,rfdComplete,canonicalIdeaAdapter,workerEntry;
try{
  master=readJson('MASTER_BLUEPRINT_V1.json');
  bridge=readJson('CANONICAL_RUNTIME_BRIDGE_V1.json');
  requirementMap=readJson(path.join('site-vitrine','SITE_VITRINE_LEGACY_REQUIREMENT_TO_CANONICAL_V1.json'));
  p3=readText('supabase/migrations/20260916174121_project_master_blueprint_v1_g0_g3_preproject_bridge_p3.sql');
  p3fix=readText('supabase/migrations/20260916174307_project_master_blueprint_v1_g0_g3_preproject_bridge_p3_g0_column_fix.sql');
  p4=readText('supabase/migrations/20260916174852_project_master_blueprint_v1_g3_promotion_actor_hardening_p4.sql');
  p5=readText('supabase/migrations/20260916182111_project_master_blueprint_v1_g0_blueprint_05_compat_fix_p5.sql');
  g4=readText('supabase/migrations/20260916155824_project_master_blueprint_v1_g4_rfd_lot.sql');
  g5=readText('supabase/migrations/20260916155938_project_master_blueprint_v1_g5_rfd_project.sql');
  g45Retry=readText('supabase/migrations/20260916162910_project_master_blueprint_v1_g4_g5_idempotent_approval.sql');
  rfdComplete=readText('supabase/migrations/20260916165026_project_master_blueprint_v1_complete_rfd_predicate_set.sql');
  canonicalIdeaAdapter=readText('src/idea-canonical-adapter.js');
  workerEntry=readText('src/worker-entry.js');
}catch(error){
  fail(`cannot read canonical bridge sources: ${error.message}`);
  process.exit(1);
}

assert(bridge.schema_version==='1.0','bridge schema_version must be 1.0');
assert(bridge.contract_id==='PROJECT_DEFINITION_CANONICAL_RUNTIME_BRIDGE','unexpected bridge contract_id');
assert(bridge.contract_version==='1.5','bridge contract_version must be 1.5');
assert(bridge.status==='CANONICAL_MIGRATION_CONTRACT','bridge status mismatch');
assert(bridge.source_runtime==='R5_R6_R7_COMPATIBILITY_RUNTIME','bridge source runtime mismatch');
assert(bridge.target_contract==='4B4C_PROJECT_MASTER_BLUEPRINT_V1','bridge target mismatch');

assert(bridge.coverage?.canonical_formal_gates==='G0_G5_IMPLEMENTED_SERVICE_SIDE','G0-G5 service-side coverage missing');
assert(bridge.coverage?.canonical_pre_g4_gates==='G0_G3_IMPLEMENTED_AS_DERIVED_COMPATIBILITY_BRIDGE','G0-G3 derived bridge coverage missing');
assert(bridge.coverage?.canonical_preproject_worker_adapter==='IMPLEMENTED_IN_REPOSITORY_PENDING_PRODUCTION_CUTOVER_CERTIFICATION','preproject adapter cutover status must remain explicit');
assert(bridge.coverage?.canonical_g3_browser_promotion==='INTENTIONALLY_NOT_EXPOSED','G3 browser exposure boundary mismatch');
assert(bridge.coverage?.real_idea_end_to_end==='UNPROVEN_NO_PRODUCTION_IDEA','real Idea E2E limitation must stay explicit');
assert(bridge.coverage?.rfd_predicates==='ALL_ELEVEN_MASTER_RFD_LOT_PREDICATES_IMPLEMENTED_SERVICE_ONLY','RFD predicate coverage mismatch');

const runtimeObjects={
  idea_blueprint_fit_source:'public.idea_blueprint_fit_decisions',
  idea_requirement_state_source:'public.idea_requirement_states',
  idea_artifact_source:'public.idea_artifacts',
  idea_decision_package_source:'public.idea_decision_packages',
  idea_decision_record_source:'public.idea_decision_records_v2',
  project_definition_source:'public.project_definitions',
  canonical_preproject_readiness:'public.get_canonical_idea_preproject_readiness_v1(uuid)',
  canonical_decision_record:'public.record_canonical_idea_decision_v1(uuid,uuid,text,text,jsonb,boolean,text,text)',
  canonical_project_baseline_promotion:'public.promote_canonical_approved_idea_to_project_definition_v2(uuid,uuid,bigint,jsonb,jsonb,jsonb,text)',
  g4_readiness:'public.get_project_delivery_lot_rfd_readiness_v1(uuid)',
  g4_approval:'public.approve_project_delivery_lot_rfd_v1(uuid,bigint,text,uuid)',
  g5_readiness:'public.get_project_rfd_readiness_v1(uuid)',
  g5_approval:'public.approve_project_rfd_v1(uuid,bigint,text,uuid)'
};
for(const[key,value]of Object.entries(runtimeObjects))assert(bridge.runtime_objects?.[key]===value,`runtime object ${key} mismatch`);

assert(bridge.graph_contract?.idea_active_blueprint_id==='SITE_VITRINE','active Idea Blueprint id mismatch');
assert(bridge.graph_contract?.idea_active_blueprint_version==='0.5','live Blueprint Fit assignment must be 0.5');
assert(bridge.graph_contract?.idea_legacy_blueprint_supported==='0.4','legacy 0.4 compatibility must remain explicit');
assert(bridge.graph_contract?.idea_blueprint_activation_changed_by_bridge===false,'canonical bridge must not claim it activated 0.5');
assert(bridge.graph_contract?.blueprint_version==='1.0-bridge-r7','Project Definition graph bridge version mismatch');
assert(bridge.graph_contract?.canonical_node_count===28,'canonical node count mismatch');
assert(bridge.graph_contract?.dependency_edge_count===33,'dependency edge count mismatch');
assert(bridge.graph_contract?.hard_dependency_cycles_allowed===false,'HARD cycles must remain forbidden');

const preprojectPredicates=['FOUNDATION_READY','EVIDENCE_READY','STRATEGY_READY','PREFIGURATION_READY','DECISION_PACKAGE_READY'];
assert(JSON.stringify(bridge.canonical_preproject_readiness_predicates)===JSON.stringify(preprojectPredicates),'preproject predicate set mismatch');
for(const predicate of preprojectPredicates)assert(master.readiness_predicates?.includes(predicate),`${predicate} missing from Master Blueprint`);
assert(bridge.canonical_preproject_policy?.predicate_persistence==='DERIVED_NOT_STORED','preproject predicates must be derived-not-stored');
assert(bridge.canonical_preproject_policy?.unknown_readiness_coerced_to_ready===false,'unknown readiness must never be coerced to Ready');
for(const key of [
  'requirement_state_freshness_checked_against_engine_revision',
  'authority_ok_required',
  'stale_conflicted_unresolved_states_block',
  'prefiguration_uses_current_or_frozen_fresh_for_decision_artifacts',
  'decision_package_requires_current_engine_revision',
  'decision_package_requires_matching_immutable_snapshot',
  'decision_package_requires_fresh_snapshot_bound_outputs',
  'material_open_review_feedback_blocks_decision_package_readiness',
  'launch_and_early_non_go_paths_are_distinct'
])assert(bridge.canonical_preproject_policy?.[key]===true,`preproject policy ${key} must be true`);

const g0=bridge.canonical_preproject_gate_policy?.G0_BLUEPRINT_FIT;
assert(g0?.site_vitrine_active_runtime_version==='0.5','G0 active SITE_VITRINE version must be 0.5');
assert(g0?.legacy_version_supported==='0.4','G0 legacy 0.4 compatibility missing');
assert(g0?.fit_decision_version_must_match_idea_version===true,'G0 fit-decision version must match Idea version');
assert(g0?.blueprint_mismatch_is_explicit_outcome===true,'G0 mismatch must remain explicit');

const g1=bridge.canonical_preproject_gate_policy?.G1_IDEA_DECISION_READY;
assert(JSON.stringify(g1?.derived_from_predicates)===JSON.stringify(preprojectPredicates),'G1 predicate basis mismatch');
assert(g1?.launch_path_requires_all_five_predicates===true,'G1 launch closure mismatch');
assert(g1?.early_non_go_path===true,'G1 early non-GO path missing');
assert(g1?.evaluation_fingerprint_required_for_canonical_decision===true,'G1 fingerprint binding required');

const g2=bridge.canonical_preproject_gate_policy?.G2_GO_PROJECT;
for(const key of ['immutable_human_decision_required','decision_must_reference_current_decision_package','decision_must_match_current_g1_evaluation_fingerprint','approve_outcome_requires_launch_path','decision_actor_injected_from_authenticated_server_adapter','legacy_caller_supplied_gate_boolean_is_not_canonical_evidence'])assert(g2?.[key]===true,`G2 policy ${key} must be true`);

const g3=bridge.canonical_preproject_gate_policy?.G3_PROJECT_BASELINE;
for(const key of ['canonical_g2_required','versioned_project_definition_baseline_required','baseline_manifest_completeness_required','authorized_actor_must_be_idea_creator_or_workspace_owner_admin','actor_revalidated_in_database'])assert(g3?.[key]===true,`G3 policy ${key} must be true`);
assert(g3?.browser_promotion_exposed===false,'G3 browser promotion must stay disabled');
assert(g3?.promotion_server_rpc==='promote_canonical_approved_idea_to_project_definition_v2','G3 promotion RPC mismatch');

const masterFormalGates=(master.formal_gates??[]).map((gate)=>gate.id);
const implementedGates=bridge.canonical_formal_gates_implemented??[];
assert(JSON.stringify(implementedGates)===JSON.stringify(masterFormalGates),'implemented Formal Gates must exactly match Master Blueprint G0-G5');
assert(unique(implementedGates),'canonical Formal Gate ids must be unique');

const rfdPredicates=master.rfd_lot_required_predicates??[];
assert(rfdPredicates.length===11,'Master Blueprint must contain exactly 11 RFD lot predicates');
assert(JSON.stringify(bridge.canonical_rfd_predicates_implemented)===JSON.stringify(rfdPredicates),'implemented RFD predicate set mismatch');

const legacyMap=bridge.legacy_gate_to_readiness_predicate??[];
assert(JSON.stringify(legacyMap.map((item)=>item.legacy_gate_id))===JSON.stringify(['G8_PROJECT_PRODUCT_DEFINITION_STABLE','G9_PROJECT_EXPERIENCE_DEFINITION_STABLE','G10_PROJECT_TECH_NFR_STABLE','G11_TRACEABILITY_AND_ACCEPTANCE_READY']),'legacy G8-G11 bridge mismatch');
assert(bridge.legacy_gate_passthrough_only?.[0]?.legacy_gate_id==='G12_READY_FOR_DEVELOPMENT','legacy G12 must remain passthrough-only');
assert((bridge.legacy_gate_passthrough_only?.[0]?.reason??'').includes('must never be relabeled'),'legacy G12 separation rationale required');

assert(bridge.adapter_contract?.repository_route==='/api/ideas/canonical','canonical Idea route mismatch');
assert(bridge.adapter_contract?.repository_runtime_version==='v4.5.16-project-definition-preproject-p3','repository runtime version mismatch');
assert(JSON.stringify(bridge.adapter_contract?.commands)===JSON.stringify(['canonical.read','decision.record']),'canonical Idea command set mismatch');
assert(bridge.adapter_contract?.active_idea_blueprint==='SITE_VITRINE@0.5','adapter active Blueprint metadata mismatch');
assert(bridge.adapter_contract?.legacy_idea_blueprint_supported==='SITE_VITRINE@0.4','adapter legacy Blueprint metadata mismatch');
assert(bridge.adapter_contract?.blueprint_activation_changed_by_bridge===false,'adapter must not claim 0.5 activation');
assert(bridge.adapter_contract?.user_rls_precheck===true,'adapter RLS precheck required');
assert(bridge.adapter_contract?.decision_actor_from_jwt===true,'decision actor JWT binding required');
assert(bridge.adapter_contract?.g3_promotion_browser_exposed===false,'G3 browser exposure must stay false');
assert(bridge.adapter_contract?.service_role_browser_exposed===false,'service role must not be browser exposed');
assert(bridge.adapter_contract?.production_cutover_certified===false,'production cutover must stay uncertified before live proof');

for(const key of ['legacy_gate_ids_are_immutable_during_bridge','legacy_g12_is_not_canonical_rfd','master_rfd_lot_predicate_set_is_authoritative','unknown_canonical_readiness_must_not_be_coerced_to_ready','manual_ready_flag_forbidden','direct_browser_access_to_canonical_runtime_forbidden','service_side_mutations_enabled','human_actor_identity_must_come_from_authenticated_server_adapter','formal_gate_approval_retries_must_be_idempotent_and_stale_safe','runtime_activation_requires_explicit_adapter_cutover'])assert(bridge.rules?.[key]===true,`bridge rule ${key} must be true`);

const r7Requirements=requirementMap.requirements??[];
assert(r7Requirements.length===28,`expected 28 R7 requirement mappings, got ${r7Requirements.length}`);
assert(unique(r7Requirements.map((item)=>item.requirement_id)),'R7 requirement mappings must remain unique');

markers(p3,'P3 preproject bridge',[
  'idea_canonical_requirement_check_v1','idea_canonical_artifact_check_v1','get_canonical_idea_preproject_readiness_v1',
  "'G0_BLUEPRINT_FIT'","'G1_IDEA_DECISION_READY'","'G2_GO_PROJECT'","'G3_PROJECT_BASELINE'",
  'record_canonical_idea_decision_v1','promote_canonical_approved_idea_to_project_definition_v1'
]);
markers(p3fix,'P3 forward-only G0 column fix',['order by created_at desc',"'decision_actor_type',v_fit.decided_by_actor"]);
markers(p4,'P4 G3 actor hardening',['promote_canonical_approved_idea_to_project_definition_v2','p_actor_id uuid',"wm.role in ('owner','admin')","PROJECT_PROMOTION_ACTOR_NOT_AUTHORIZED","CANONICAL_G2_NOT_READY"]);
markers(p5,'P5 Blueprint 0.5 compatibility',["v_idea.blueprint_version in ('0.4','0.5')",'v_fit.blueprint_version=v_idea.blueprint_version',"'active_idea_blueprint','SITE_VITRINE@0.5'","'legacy_idea_blueprint_supported','SITE_VITRINE@0.4'"]);
markers(g4,'G4 RFD lot',['get_project_delivery_lot_rfd_readiness_v1','approve_project_delivery_lot_rfd_v1','STALE_G4_READINESS']);
markers(g5,'G5 RFD project',['create_project_rfd_manifest_candidate_v1','get_project_rfd_readiness_v1','approve_project_rfd_v1','STALE_G5_READINESS']);
markers(g45Retry,'G4/G5 retry hardening',["raise exception 'STALE_G4_APPROVAL'","raise exception 'STALE_G5_APPROVAL'","'idempotent',true"]);
markers(rfdComplete,'complete RFD predicates',["'PROJECT_PRODUCT_READY'","'PROJECT_EXPERIENCE_READY'","'PROJECT_TECH_READY'","'TRACEABILITY_READY'","'BASELINE_READY'","'HANDOFF_INTEGRITY'"]);
markers(canonicalIdeaAdapter,'canonical Idea adapter',["const COMMANDS=new Set(['canonical.read','decision.record'])",'/auth/v1/user','get_idea_workspace_projection_v1','p_decided_by:auth.user.id','get_canonical_idea_preproject_readiness_v1','record_canonical_idea_decision_v1']);
assert(!canonicalIdeaAdapter.includes('promote_canonical_approved_idea_to_project_definition_v2'),'G3 promotion must not be browser-exposed');
markers(workerEntry,'Worker entry',["RUNTIME_VERSION='v4.5.16-project-definition-preproject-p3'","active_idea_blueprint:'SITE_VITRINE@0.5'","legacy_idea_blueprint_supported:'SITE_VITRINE@0.4'","url.pathname==='/api/ideas/canonical'",'g3_promotion_browser_exposed:false']);

if(!process.exitCode){
  console.log('[canonical-runtime-bridge-v1] PASS');
  console.log(JSON.stringify({contract_version:bridge.contract_version,active_idea_blueprint:bridge.adapter_contract.active_idea_blueprint,legacy_idea_blueprint_supported:bridge.adapter_contract.legacy_idea_blueprint_supported,canonical_preproject_predicates:preprojectPredicates,canonical_rfd_predicate_count:rfdPredicates.length,canonical_formal_gates_implemented:implementedGates,production_cutover_certified:false,g3_browser_exposed:false}));
}

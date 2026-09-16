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

let master,bridge,requirementMap,preproject,g0fix,g3actor,g0compat,g3derived,g4,g5,g45retry,rfdComplete,canonicalIdeaAdapter,workerEntry;
try{
  master=readJson('MASTER_BLUEPRINT_V1.json');
  bridge=readJson('CANONICAL_RUNTIME_BRIDGE_V1.json');
  requirementMap=readJson(path.join('site-vitrine','SITE_VITRINE_LEGACY_REQUIREMENT_TO_CANONICAL_V1.json'));
  preproject=readText('supabase/migrations/20260916174121_project_master_blueprint_v1_g0_g3_preproject_bridge_p3.sql');
  g0fix=readText('supabase/migrations/20260916174307_project_master_blueprint_v1_g0_g3_preproject_bridge_p3_g0_column_fix.sql');
  g3actor=readText('supabase/migrations/20260916174852_project_master_blueprint_v1_g3_promotion_actor_hardening_p4.sql');
  g0compat=readText('supabase/migrations/20260916182111_project_master_blueprint_v1_g0_blueprint_05_compat_fix_p5.sql');
  g3derived=readText('supabase/migrations/20260916185631_project_master_blueprint_v1_g3_server_derived_promotion_v1.sql');
  g4=readText('supabase/migrations/20260916155824_project_master_blueprint_v1_g4_rfd_lot.sql');
  g5=readText('supabase/migrations/20260916155938_project_master_blueprint_v1_g5_rfd_project.sql');
  g45retry=readText('supabase/migrations/20260916162910_project_master_blueprint_v1_g4_g5_idempotent_approval.sql');
  rfdComplete=readText('supabase/migrations/20260916165026_project_master_blueprint_v1_complete_rfd_predicate_set.sql');
  canonicalIdeaAdapter=readText('src/idea-canonical-adapter.js');
  workerEntry=readText('src/worker-entry.js');
}catch(error){
  fail(`cannot read canonical bridge sources: ${error.message}`);
  process.exit(1);
}

assert(bridge.schema_version==='1.0','bridge schema version mismatch');
assert(bridge.contract_id==='PROJECT_DEFINITION_CANONICAL_RUNTIME_BRIDGE','bridge id mismatch');
assert(bridge.contract_version==='1.7','bridge contract_version must be 1.7');
assert(bridge.status==='CANONICAL_MIGRATION_CONTRACT','bridge status mismatch');
assert(bridge.target_contract==='4B4C_PROJECT_MASTER_BLUEPRINT_V1','bridge target mismatch');
assert(bridge.coverage?.canonical_preproject_worker_adapter==='P4_PRODUCTION_CERTIFIED_BUILD_557','p4 production certification coverage mismatch');
assert(bridge.coverage?.canonical_g3_browser_promotion==='SAFE_SERVER_DERIVED_V3_PRODUCTION_CERTIFIED','G3 production coverage mismatch');

const masterFormalGates=(master.formal_gates??[]).map(gate=>gate.id);
const expectedFormalGates=['G0_BLUEPRINT_FIT','G1_IDEA_DECISION_READY','G2_GO_PROJECT','G3_PROJECT_BASELINE','G4_RFD_LOT','G5_RFD_PROJECT'];
assert(JSON.stringify(masterFormalGates)===JSON.stringify(expectedFormalGates),'Master Blueprint Formal Gates mismatch');
assert(JSON.stringify(bridge.canonical_formal_gates_implemented)===JSON.stringify(expectedFormalGates),'implemented G0-G5 mismatch');
assert(unique(bridge.canonical_formal_gates_implemented??[]),'Formal Gate ids must remain unique');

const preprojectPredicates=['FOUNDATION_READY','EVIDENCE_READY','STRATEGY_READY','PREFIGURATION_READY','DECISION_PACKAGE_READY'];
assert(JSON.stringify(bridge.canonical_preproject_readiness_predicates)===JSON.stringify(preprojectPredicates),'preproject predicate set mismatch');
for(const predicate of preprojectPredicates)assert(master.readiness_predicates?.includes(predicate),`${predicate} missing from Master Blueprint`);
assert(bridge.canonical_preproject_policy?.predicate_persistence==='DERIVED_NOT_STORED','preproject predicates must remain derived');
assert(bridge.canonical_preproject_policy?.unknown_readiness_coerced_to_ready===false,'unknown readiness must not coerce to Ready');

const masterRfd=master.rfd_lot_required_predicates??[];
assert(masterRfd.length===11,'Master Blueprint RFD lot predicate count must be 11');
assert(JSON.stringify(bridge.canonical_rfd_predicates_implemented)===JSON.stringify(masterRfd),'canonical RFD predicate set mismatch');

assert(bridge.graph_contract?.idea_active_blueprint_version==='0.5','active Idea Blueprint must be 0.5');
assert(bridge.graph_contract?.idea_legacy_blueprint_supported==='0.4','legacy Idea Blueprint 0.4 must remain supported');
assert(bridge.graph_contract?.canonical_node_count===28,'canonical node count mismatch');
assert(bridge.graph_contract?.dependency_edge_count===33,'dependency edge count mismatch');
assert(bridge.graph_contract?.hard_edge_count===31,'HARD edge count mismatch');
assert(bridge.graph_contract?.soft_edge_count===2,'SOFT edge count mismatch');
assert(bridge.graph_contract?.hard_dependency_cycles_allowed===false,'HARD cycles must remain forbidden');

const g0=bridge.canonical_preproject_gate_policy?.G0_BLUEPRINT_FIT;
assert(g0?.site_vitrine_active_runtime_version==='0.5','G0 active version mismatch');
assert(g0?.legacy_version_supported==='0.4','G0 legacy support mismatch');
assert(g0?.fit_decision_version_must_match_idea_version===true,'G0 decision/Idea version match required');

const g1=bridge.canonical_preproject_gate_policy?.G1_IDEA_DECISION_READY;
assert(JSON.stringify(g1?.derived_from_predicates)===JSON.stringify(preprojectPredicates),'G1 predicate basis mismatch');
assert(g1?.launch_path_requires_all_five_predicates===true,'G1 launch closure must require all five predicates');
assert(g1?.early_non_go_path===true,'G1 early non-GO path required');
assert(g1?.evaluation_fingerprint_required_for_canonical_decision===true,'G1 fingerprint binding required');

const g2=bridge.canonical_preproject_gate_policy?.G2_GO_PROJECT;
for(const key of ['immutable_human_decision_required','decision_must_reference_current_decision_package','decision_must_match_current_g1_evaluation_fingerprint','approve_outcome_requires_launch_path','decision_actor_injected_from_authenticated_server_adapter'])assert(g2?.[key]===true,`G2 policy ${key} must be true`);

const g3=bridge.canonical_preproject_gate_policy?.G3_PROJECT_BASELINE;
for(const key of ['canonical_g2_required','versioned_project_definition_baseline_required','baseline_manifest_completeness_required','authorized_actor_must_be_idea_creator_or_workspace_owner_admin','actor_revalidated_in_database','browser_promotion_exposed','promotion_actor_injected_from_authenticated_server_adapter','baseline_manifest_server_derived','promotion_diff_server_derived','artifact_promotions_server_derived','client_manifest_control_forbidden','client_promotion_diff_control_forbidden','client_artifact_promotion_control_forbidden','unmapped_project_promotable_artifact_blocks'])assert(g3?.[key]===true,`G3 policy ${key} must be true`);
assert(g3?.promotion_server_rpc==='promote_canonical_approved_idea_to_project_definition_v3','G3 RPC must be v3');
assert(g3?.baseline_derivation==='SERVER_DERIVED_FROM_FROZEN_IDEA_DECISION','G3 baseline derivation mismatch');
assert(g3?.concept_artifact_policy==='PROMOTE_AND_DEEPEN_CONCEPT_NOT_FINAL_SPEC','G3 concept promotion policy mismatch');
assert(g3?.server_derived_migration==='20260916185631_project_master_blueprint_v1_g3_server_derived_promotion_v1','G3 migration marker mismatch');
assert(g3?.production_certified_build===557,'G3 production-certified build mismatch');

assert(bridge.runtime_objects?.canonical_project_baseline_builder==='app_private.build_canonical_project_baseline_payload_v1(uuid,uuid,bigint)','G3 builder runtime object mismatch');
assert(bridge.runtime_objects?.canonical_project_baseline_promotion==='public.promote_canonical_approved_idea_to_project_definition_v3(uuid,uuid,uuid,bigint,text)','G3 promotion runtime object mismatch');

const production=bridge.production_contract;
assert(production?.certified_runtime_version==='v4.5.17-project-definition-g3-derived-p4','certified production runtime must be p4');
assert(production?.certified_transport_build===557,'certified production build must be 557');
assert(production?.certified_idea_adapter_code==='0.2.0','certified adapter code mismatch');
assert(JSON.stringify(production?.certified_idea_commands)===JSON.stringify(['canonical.read','decision.record','project.promote']),'certified p4 command set mismatch');
assert(production?.certified_g3_browser_promotion_exposed===true,'certified p4 G3 browser promotion must be enabled');
assert(production?.certified_g3_baseline_derivation==='SERVER_DERIVED_FROM_FROZEN_IDEA_DECISION','certified G3 derivation mismatch');
assert(production?.certified_g3_manifest_client_controlled===false,'certified client manifest control forbidden');
assert(production?.certified_g3_promotion_diff_client_controlled===false,'certified client promotion-diff control forbidden');
assert(production?.certified_g3_artifact_promotions_client_controlled===false,'certified client artifact-promotion control forbidden');

const adapter=bridge.adapter_contract;
assert(adapter?.repository_runtime_version==='v4.5.17-project-definition-g3-derived-p4','p4 repository runtime mismatch');
assert(adapter?.repository_adapter_code==='0.2.0','p4 adapter code mismatch');
assert(JSON.stringify(adapter?.commands)===JSON.stringify(['canonical.read','decision.record','project.promote']),'p4 command set mismatch');
assert(adapter?.g3_promotion_browser_exposed===true,'safe p4 G3 command must be browser exposed');
assert(adapter?.g3_promotion_actor_from_jwt===true,'G3 actor must come from JWT');
assert(adapter?.g3_baseline_derivation==='SERVER_DERIVED_FROM_FROZEN_IDEA_DECISION','adapter G3 derivation mismatch');
assert(adapter?.g3_manifest_client_controlled===false,'client manifest control forbidden');
assert(adapter?.g3_promotion_diff_client_controlled===false,'client promotion diff control forbidden');
assert(adapter?.g3_artifact_promotions_client_controlled===false,'client artifact promotions control forbidden');
assert(adapter?.service_role_browser_exposed===false,'service role must never be browser exposed');
assert(adapter?.production_cutover_certified===true,'p4 production cutover must be certified');

assert(bridge.legacy_gate_passthrough_only?.[0]?.legacy_gate_id==='G12_READY_FOR_DEVELOPMENT','legacy G12 must remain passthrough-only');
assert((bridge.legacy_gate_passthrough_only?.[0]?.reason??'').includes('must never be relabeled'),'legacy G12 separation rationale required');
assert(bridge.rules?.manual_ready_flag_forbidden===true,'manual Ready flag forbidden');
assert(bridge.rules?.direct_browser_access_to_privileged_canonical_rpcs_forbidden===true,'direct privileged RPC browser access forbidden');
assert(bridge.rules?.human_actor_identity_must_come_from_authenticated_server_adapter===true,'human actor identity must come from authenticated adapter');

const r7Requirements=requirementMap.requirements??[];
assert(r7Requirements.length===28,`expected 28 R7 requirement mappings, got ${r7Requirements.length}`);
assert(unique(r7Requirements.map(item=>item.requirement_id)),'R7 requirement mappings must remain unique');

markers(preproject,'preproject bridge',['get_canonical_idea_preproject_readiness_v1','record_canonical_idea_decision_v1',"'G0_BLUEPRINT_FIT'", "'G3_PROJECT_BASELINE'"]);
markers(g0fix,'G0 forward fix',['order by created_at desc',"'decision_actor_type',v_fit.decided_by_actor"]);
markers(g3actor,'G3 actor hardening',['promote_canonical_approved_idea_to_project_definition_v2',"wm.role in ('owner','admin')",'PROJECT_PROMOTION_ACTOR_NOT_AUTHORIZED']);
markers(g0compat,'G0 0.5 compatibility',["blueprint_version in ('0.4','0.5')",'blueprint_version=v_idea.blueprint_version',"'SITE_VITRINE@0.5'"]);
markers(g3derived,'G3 server-derived promotion',['build_canonical_project_baseline_payload_v1','promote_canonical_approved_idea_to_project_definition_v3','SERVER_DERIVED_FROM_FROZEN_IDEA_DECISION','PROMOTE_AND_DEEPEN','client_manifest_accepted','UNMAPPED_PROJECT_PROMOTABLE_ARTIFACT']);
markers(g4,'G4',['get_project_delivery_lot_rfd_readiness_v1','approve_project_delivery_lot_rfd_v1']);
markers(g5,'G5',['get_project_rfd_readiness_v1','approve_project_rfd_v1']);
markers(g45retry,'G4/G5 retries',["STALE_G4_APPROVAL","STALE_G5_APPROVAL","'idempotent',true"]);
markers(rfdComplete,'RFD predicate bridge',["'PROJECT_PRODUCT_READY'","'PROJECT_EXPERIENCE_READY'","'PROJECT_TECH_READY'","'TRACEABILITY_READY'","'BASELINE_READY'","'HANDOFF_INTEGRITY'"]);

markers(canonicalIdeaAdapter,'canonical Idea adapter',["const COMMANDS=new Set(['canonical.read','decision.record','project.promote'])",'/auth/v1/user','get_idea_workspace_projection_v1','p_decided_by:auth.user.id','p_actor_id:auth.user.id','promote_canonical_approved_idea_to_project_definition_v3']);
assert(!canonicalIdeaAdapter.includes('body.baseline_manifest'),'adapter must not read client baseline_manifest');
assert(!canonicalIdeaAdapter.includes('body.promotion_diff'),'adapter must not read client promotion_diff');
assert(!canonicalIdeaAdapter.includes('body.artifact_promotions'),'adapter must not read client artifact_promotions');
assert(!canonicalIdeaAdapter.includes("serviceRpc(env,'promote_canonical_approved_idea_to_project_definition_v2'"),'adapter must never call raw G3 v2 RPC');

markers(workerEntry,'Worker entry',["RUNTIME_VERSION='v4.5.17-project-definition-g3-derived-p4'","code:'0.2.0'","commands:['canonical.read','decision.record','project.promote']","g3_promotion_rpc:'promote_canonical_approved_idea_to_project_definition_v3'",'g3_promotion_browser_exposed:true','g3_manifest_client_controlled:false','g3_promotion_diff_client_controlled:false','g3_artifact_promotions_client_controlled:false']);

if(!process.exitCode){
  console.log('[canonical-runtime-bridge-v1] PASS');
  console.log(JSON.stringify({
    contract_version:bridge.contract_version,
    certified_production:bridge.production_contract.certified_runtime_version,
    certified_build:bridge.production_contract.certified_transport_build,
    canonical_formal_gates:expectedFormalGates.length,
    preproject_predicates:preprojectPredicates.length,
    rfd_predicates:masterRfd.length,
    g3_server_derived:true,
    g3_client_manifest_controlled:false,
    p4_cutover_certified:true
  }));
}

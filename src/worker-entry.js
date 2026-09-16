import worker from './worker.js';
import { handleEvidenceAdvance } from './idea-evidence-endpoint.js';
import { handleCanonicalIdeaCommand } from './idea-canonical-adapter.js';
import { handleProjectDefinitionCommand } from './project-definition-adapter.js';

const RUNTIME_VERSION='v4.5.18-stabilization-legacy-cutover-p1';
const ADAPTER=Object.freeze({
  code:'0.3.5',
  commands:['blueprint_fit.assess','foundation.advance','evidence.advance'],
  blueprint:'SITE_VITRINE@0.5',
  g2_backend:'v0.7',
  g2_promotion_disposition:'v0.8',
  g2_executor_tool:'evidence-adapter-0.3.1',
  g2_user_surface:'evidence-market',
  g2_ai_h_candidate:'v0.1',
  g2_ai_h_active:false,
  g2_ai_h_candidate_target:'SV.D03.PRIMARY_NEED',
  g2_ai_h_candidate_resolution:'WORKING_ASSUMPTION',
  g2_src_candidate:'v0.2',
  g2_src_active:false,
  g2_src_snapshot_backend:'v0.2',
  g2_src_candidate_target:'SV.D03.PRIMARY_NEED',
  g2_src_candidate_resolution:'SOURCE_BACKED',
  g2_source_fetch_service_candidate:'v0.1',
  g2_source_fetch_service_active:false,
  service_role_browser_exposed:false
});
const CANONICAL_IDEA_ADAPTER=Object.freeze({
  code:'0.2.0',
  route:'/api/ideas/canonical',
  commands:['canonical.read','decision.record','project.promote'],
  master_blueprint:'1.0',
  active_idea_blueprint:'SITE_VITRINE@0.5',
  legacy_idea_blueprint_supported:'SITE_VITRINE@0.4',
  blueprint_activation_changed_by_bridge:false,
  formal_gates:['G0_BLUEPRINT_FIT','G1_IDEA_DECISION_READY','G2_GO_PROJECT','G3_PROJECT_BASELINE'],
  readiness_predicates:['FOUNDATION_READY','EVIDENCE_READY','STRATEGY_READY','PREFIGURATION_READY','DECISION_PACKAGE_READY'],
  predicate_persistence:'derived_not_stored',
  user_rls_precheck:true,
  decision_actor_from_jwt:true,
  g3_promotion_rpc:'promote_canonical_approved_idea_to_project_definition_v3',
  g3_promotion_browser_exposed:true,
  g3_promotion_actor_from_jwt:true,
  g3_baseline_derivation:'SERVER_DERIVED_FROM_FROZEN_IDEA_DECISION',
  g3_manifest_client_controlled:false,
  g3_promotion_diff_client_controlled:false,
  g3_artifact_promotions_client_controlled:false,
  g3_server_derived_migration:'20260916185631_project_master_blueprint_v1_g3_server_derived_promotion_v1',
  legacy_direct_decision_browser_exposed:false,
  legacy_final_decision_bootstrapped:false,
  canonical_workspace_bridge:'1.0.0',
  service_role_browser_exposed:false
});
const PROJECT_DEFINITION_ADAPTER=Object.freeze({
  code:'0.1.1',
  route:'/api/project-definition/engine',
  commands:[
    'canonical.read',
    'delivery_lot.create',
    'delivery_lot.readiness',
    'delivery_lot.prepare_rfd',
    'delivery_lot.approve_rfd',
    'project_rfd.readiness',
    'project_rfd.prepare',
    'project_rfd.approve'
  ],
  master_blueprint:'1.0',
  blueprint:'SITE_VITRINE@1.0-bridge-r7',
  rfd_predicate_count:11,
  prebaseline_predicate_count:9,
  project_readiness_bridge:'G8-G11',
  canonical_gates:['G4_RFD_LOT','G5_RFD_PROJECT'],
  authenticated:true,
  user_rls_precheck:true,
  approval_actor_from_jwt:true,
  service_role_browser_exposed:false,
  legacy_g12_mutated:false
});
const SECURITY_HEADERS=Object.freeze({
  'x-content-type-options':'nosniff',
  'referrer-policy':'strict-origin-when-cross-origin',
  'x-frame-options':'DENY',
  'permissions-policy':'camera=(self), microphone=(self), display-capture=(self), fullscreen=(self), picture-in-picture=(self)'
});

function withSecurityHeaders(response){
  const headers=new Headers(response.headers);
  for(const[key,value]of Object.entries(SECURITY_HEADERS))headers.set(key,value);
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
function versionMetadata(env){
  const meta=env?.CF_VERSION_METADATA;
  if(!meta||typeof meta!=='object')return null;
  return {id:meta.id||null,tag:meta.tag||null,timestamp:meta.timestamp||null};
}
function executorPaths(env){return env?.AI?['CALC','RAW']:['CALC'];}

async function sourceFetchServiceHealth(env){
  if(!env?.SOURCE_FETCH)return {candidate:'v0.1',configured:false,reachable:false,active:false};
  try{
    const result=await env.SOURCE_FETCH.serviceHealth();
    const reachable=result?.ok===true&&result?.service==='4b4c-source-fetch'&&result?.contract==='g2-source-fetch-service-v0.1'&&result?.public_network_only===true&&result?.browser_access===false;
    return {candidate:'v0.1',configured:true,reachable,active:false,contract:result?.contract||null,public_network_only:result?.public_network_only===true,browser_access:result?.browser_access===true};
  }catch{
    return {candidate:'v0.1',configured:true,reachable:false,active:false};
  }
}

async function health(request,env,ctx){
  const base=await worker.fetch(request,env,ctx);
  let payload;
  try{payload=await base.clone().json()}catch{payload={ok:base.ok,app:'4b4c',backend:'supabase'}}
  payload.version=RUNTIME_VERSION;
  payload.cloudflare_version=versionMetadata(env);
  payload.ui_shell=payload.ui_shell&&typeof payload.ui_shell==='object'?payload.ui_shell:{};
  if(payload.ui_shell.idea_engine_adapter_v0_1){payload.ui_shell.idea_engine_adapter_v0_1={...payload.ui_shell.idea_engine_adapter_v0_1,compatibility_marker:true};}
  payload.ui_shell.idea_engine_adapter_v0_3={...ADAPTER,g2_executor_paths:executorPaths(env),g2_source_fetch_service:await sourceFetchServiceHealth(env),configured:Boolean(env?.SUPABASE_SERVICE_ROLE_KEY)};
  payload.ui_shell.idea_canonical_adapter_v1={...CANONICAL_IDEA_ADAPTER,configured:Boolean(env?.SUPABASE_SERVICE_ROLE_KEY)};
  payload.ui_shell.project_definition_adapter_v1={...PROJECT_DEFINITION_ADAPTER,configured:Boolean(env?.SUPABASE_SERVICE_ROLE_KEY)};
  const headers=new Headers(base.headers);headers.set('content-type','application/json; charset=utf-8');headers.set('cache-control','no-store');
  return withSecurityHeaders(new Response(JSON.stringify(payload),{status:base.status,statusText:base.statusText,headers}));
}

export default {
  async fetch(request,env,ctx){
    const url=new URL(request.url);
    if(url.pathname==='/health'&&(request.method==='GET'||request.method==='HEAD'))return health(request,env,ctx);
    if(url.pathname==='/api/ideas/canonical')return withSecurityHeaders(await handleCanonicalIdeaCommand(request,env));
    if(url.pathname==='/api/project-definition/engine')return withSecurityHeaders(await handleProjectDefinitionCommand(request,env));
    if(url.pathname==='/api/ideas/engine'&&request.method==='POST'){
      const clone=request.clone();
      let body=null;try{body=await clone.json()}catch{}
      if(body?.command==='evidence.advance')return withSecurityHeaders(await handleEvidenceAdvance(request,env,body));
    }
    return worker.fetch(request,env,ctx);
  }
};

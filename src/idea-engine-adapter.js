const UUID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const AI_MODEL='@cf/google/gemma-4-26b-a4b-it';
const COMMANDS=new Set(['blueprint_fit.assess','foundation.advance']);
const LIFECYCLE_ELIGIBLE=new Set(['CAPTURED_UNCLASSIFIED','BLUEPRINT_MIGRATION_REQUIRED']);
const FOUNDATION_TOOL_VERSION='workspace-engine-adapter-0.2.0';
const FOUNDATION_PROMPT_VERSION='foundation-raw-v1';
const FOUNDATION_SCHEMA_VERSION='foundation-raw-v1';
const FOUNDATION_MAX_ACTIONS_PER_REQUEST=2;

const FOUNDATION_TARGETS=Object.freeze({
  'SV.D02.ORG_CONTEXT':{semantic_key:'org_context',item_type:'FACT',label:'organisation et activité'},
  'SV.D02.DECLARED_PROBLEM':{semantic_key:'declared_problem',item_type:'FACT',label:'problème ou opportunité déclarée'},
  'SV.D02.PRIMARY_OBJECTIVE':{semantic_key:'primary_objective',item_type:'DECISION_INPUT',label:'objectif principal'},
  'SV.D03.PRIMARY_AUDIENCE':{semantic_key:'primary_audience',item_type:'DECISION_INPUT',label:'audience principale'},
  'SV.D02.USER_OUTCOME':{semantic_key:'user_outcome',item_type:'FACT',label:'résultat attendu côté visiteur'},
  'SV.D04.OFFER_BASELINE':{semantic_key:'offer_baseline',item_type:'FACT',label:'offre actuelle'},
  'SV.D02.HARD_CONSTRAINTS':{semantic_key:'hard_constraints',item_type:'CONSTRAINT',label:'contraintes dures'}
});

const FOUNDATION_HUMAN_PROMPTS=Object.freeze({
  'SV.D02.ORG_CONTEXT':'Dans quelle activité ou organisation s’inscrit cette idée ?',
  'SV.D02.DECLARED_PROBLEM':'Quel problème ou quelle opportunité vous pousse à créer ce site ?',
  'SV.D02.PRIMARY_OBJECTIVE':'Quel résultat principal voulez-vous obtenir grâce à ce site ?',
  'SV.D03.PRIMARY_AUDIENCE':'À qui ce site doit-il s’adresser en priorité ?',
  'SV.D02.USER_OUTCOME':'Que doit pouvoir accomplir le visiteur principal grâce au site ?',
  'SV.D04.OFFER_BASELINE':'Quelle offre ou quels services le site doit-il présenter aujourd’hui ?',
  'SV.D02.HARD_CONSTRAINTS':'Y a-t-il une contrainte réelle qui peut changer la solution (budget, délai, plateforme, obligation ou ressource) ?'
});

class EngineHttpError extends Error{
  constructor(status,code,internal=''){super(code);this.status=status;this.code=code;this.internal=internal;}
}

function json(data,status=200){return Response.json(data,{status,headers:{'cache-control':'no-store'}})}
function cleanText(value,max=500){return String(value??'').trim().replace(/\s+/g,' ').slice(0,max)}
function hasOnlyKeys(obj,allowed){return Object.keys(obj||{}).every(key=>allowed.has(key))}
function safeArray(value){return Array.isArray(value)?value:[]}

async function parseResponse(response){
  const text=await response.text();
  if(!text)return null;
  try{return JSON.parse(text)}catch{return text}
}

async function supabaseRequest(env,path,{token,service=false,method='POST',body}={}){
  const key=service?env.SUPABASE_SERVICE_ROLE_KEY:env.SUPABASE_PUBLISHABLE_KEY;
  if(!key)throw new EngineHttpError(503,service?'SERVER_PRIVILEGE_UNAVAILABLE':'BACKEND_CONFIG_UNAVAILABLE');
  const headers=service
    ? {apikey:key,'content-type':'application/json'}
    : {apikey:key,Authorization:`Bearer ${token}`,'content-type':'application/json'};
  const response=await fetch(`${env.SUPABASE_URL}${path}`,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
  const payload=await parseResponse(response);
  if(!response.ok){
    const raw=cleanText(payload?.message||payload?.error||payload?.hint||payload||`SUPABASE_${response.status}`,220);
    throw new EngineHttpError(response.status,'SUPABASE_REJECTED',raw);
  }
  return payload;
}

async function serviceRpc(env,name,body={}){
  return supabaseRequest(env,`/rest/v1/rpc/${encodeURIComponent(name)}`,{service:true,body});
}

async function authenticate(env,request){
  const header=request.headers.get('authorization')||'';
  if(!header.startsWith('Bearer '))return null;
  const token=header.slice(7).trim();
  if(!token)return null;
  const response=await fetch(`${env.SUPABASE_URL}/auth/v1/user`,{headers:{apikey:env.SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${token}`}});
  if(!response.ok)return null;
  const user=await response.json().catch(()=>null);
  return user?.id?{user,token}:null;
}

async function loadProjection(env,ideaId,token){
  try{
    const result=await supabaseRequest(env,'/rest/v1/rpc/get_idea_workspace_projection_v1',{token,body:{p_idea_id:ideaId}});
    if(!result||typeof result!=='object'||Array.isArray(result))throw new EngineHttpError(502,'ENGINE_PROJECTION_INVALID');
    return result;
  }catch(error){
    if(error instanceof EngineHttpError&&error.status===403)throw new EngineHttpError(403,'IDEA_ACCESS_DENIED');
    if(error instanceof EngineHttpError&&/FORBIDDEN|IDEA_NOT_FOUND/i.test(error.internal))throw new EngineHttpError(403,'IDEA_ACCESS_DENIED');
    throw error;
  }
}

async function sha256(text){
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(text)));
  return [...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,'0')).join('');
}

function classifierSchema(){
  return {
    type:'object',additionalProperties:false,
    properties:{
      classification:{type:'string',enum:['SITE_VITRINE','BLUEPRINT_MISMATCH','AMBIGUOUS']},
      candidate_type:{type:'string',maxLength:80},
      confidence:{type:'string',enum:['HIGH','MEDIUM','LOW']},
      rationale:{type:'string',maxLength:500},
      evidence:{type:'array',maxItems:6,items:{type:'string',maxLength:180}},
      auto_applicable:{type:'boolean'}
    },
    required:['classification','candidate_type','confidence','rationale','evidence','auto_applicable']
  };
}

function classifierSystemPrompt(){
  return `Tu es le classifieur de Blueprint G0 de 2b2c. Ta seule mission est de décider si l'idée persistée est suffisamment couverte par le Blueprint SITE_VITRINE 0.4.\n\nSITE_VITRINE = site principalement destiné à présenter une activité, offre, organisation, personne, portfolio, contenu institutionnel ou marketing, avec navigation/pages/contenu/formulaires simples comme fonctions secondaires.\nBLUEPRINT_MISMATCH = le coeur du produit exige une application métier, SaaS, espace applicatif central, marketplace, e-commerce transactionnel complexe, réseau social, workflow logiciel, plateforme multi-sided ou autre architecture qui dépasse structurellement un site vitrine.\nAMBIGUOUS = les informations actuelles ne permettent pas de trancher sans risquer un faux cadrage.\n\nRègles absolues : n'invente aucune fonctionnalité ni preuve; base-toi uniquement sur l'entrée persistée; préfère AMBIGUOUS/MEDIUM en cas de doute matériel; auto_applicable ne peut être vrai que si confidence=HIGH et classification n'est pas AMBIGUOUS; candidate_type doit être court et vide si inutile. Réponds uniquement selon le schéma JSON demandé.`;
}

function normalizeClassifier(raw){
  let value=raw?.response??raw;
  if(typeof value==='string'){
    try{value=JSON.parse(value)}catch{throw new EngineHttpError(502,'AI_OUTPUT_INVALID')}
  }
  if(!value||typeof value!=='object'||Array.isArray(value))throw new EngineHttpError(502,'AI_OUTPUT_INVALID');
  const classification=String(value.classification||'');
  const confidence=String(value.confidence||'');
  if(!['SITE_VITRINE','BLUEPRINT_MISMATCH','AMBIGUOUS'].includes(classification))throw new EngineHttpError(502,'AI_OUTPUT_INVALID');
  if(!['HIGH','MEDIUM','LOW'].includes(confidence))throw new EngineHttpError(502,'AI_OUTPUT_INVALID');
  const evidence=(Array.isArray(value.evidence)?value.evidence:[]).slice(0,6).map(item=>cleanText(item,180)).filter(Boolean);
  const autoApplicable=Boolean(value.auto_applicable)&&confidence==='HIGH'&&classification!=='AMBIGUOUS';
  return {classification,candidate_type:cleanText(value.candidate_type,80),confidence,rationale:cleanText(value.rationale,500),evidence,auto_applicable:autoApplicable};
}

function mapEngineError(error){
  if(error instanceof EngineHttpError){
    const internal=error.internal||'';
    if(/STALE_ENGINE|STALE_BLUEPRINT_ASSESSMENT|IDEMPOTENCY_KEY_REUSE|STALE_REQUIREMENT/i.test(internal))return new EngineHttpError(409,'STALE_STATE');
    if(/BLUEPRINT_FIT_ALREADY_RESOLVED|BLUEPRINT_ALREADY_ASSIGNED/i.test(internal))return new EngineHttpError(409,'BLUEPRINT_FIT_ALREADY_RESOLVED');
    if(/FOUNDATION_BLUEPRINT_NOT_ACTIVE/i.test(internal))return new EngineHttpError(409,'FOUNDATION_NOT_AVAILABLE');
    if(/FORBIDDEN|IDEA_NOT_FOUND/i.test(internal))return new EngineHttpError(403,'IDEA_ACCESS_DENIED');
    return error;
  }
  return new EngineHttpError(502,'ENGINE_ERROR');
}

async function applyExistingAssessmentIfEligible(env,projection){
  const assessment=projection.blueprint_fit?.assessment;
  if(!assessment||assessment.state!=='current')return {applied:false,reused:false};
  if(!(assessment.confidence==='HIGH'&&assessment.auto_applicable&&assessment.classification!=='AMBIGUOUS'))return {applied:false,reused:true};
  await serviceRpc(env,'apply_assessed_blueprint_fit_v1',{p_assessment_id:assessment.id,p_idempotency_key:`workspace-g0-apply:${assessment.id}`});
  return {applied:true,reused:true};
}

async function assessBlueprintFit(env,auth,projection){
  if(!env.SUPABASE_SERVICE_ROLE_KEY)throw new EngineHttpError(503,'SERVER_PRIVILEGE_UNAVAILABLE');
  if(!env.AI)throw new EngineHttpError(503,'AI_BINDING_UNAVAILABLE');
  if(!projection.capabilities?.can_write)throw new EngineHttpError(403,'IDEA_WRITE_REQUIRED');
  const mode=String(projection.lifecycle?.mode||'');
  if(!LIFECYCLE_ELIGIBLE.has(mode))throw new EngineHttpError(409,'BLUEPRINT_FIT_ALREADY_RESOLVED');

  const existing=projection.blueprint_fit?.assessment;
  if(existing?.state==='current'){
    const reused=await applyExistingAssessmentIfEligible(env,projection);
    const refreshed=await loadProjection(env,projection.idea.id,auth.token);
    return {projection:refreshed,reused:true,auto_applied:reused.applied,assessment:refreshed.blueprint_fit?.assessment||existing};
  }

  const persistedInput={
    idea_id:projection.idea.id,
    engine_revision:projection.idea.engine_revision,
    title:cleanText(projection.idea.title,240),
    current_description:cleanText(projection.idea.current_description,12000),
    previous_blueprint_id:cleanText(projection.idea.blueprint_id,80),
    blueprint_status:cleanText(projection.idea.blueprint_status,80),
    lifecycle_mode:mode
  };
  const inputHash=await sha256(JSON.stringify(persistedInput));
  const idempotencyKey=`workspace-g0-assess:${projection.idea.id}:r${projection.idea.engine_revision}:${inputHash.slice(0,20)}`;

  let aiResult;
  try{
    aiResult=await env.AI.run(AI_MODEL,{
      messages:[{role:'system',content:classifierSystemPrompt()},{role:'user',content:`Entrée persistée de l'Idea :\n${JSON.stringify(persistedInput)}`}],
      response_format:{type:'json_schema',json_schema:classifierSchema()},temperature:0,max_completion_tokens:700,chat_template_kwargs:{enable_thinking:false}
    });
  }catch(error){
    const message=String(error?.message||error||'');
    if(/3040|quota|limit|capacity|neuron/i.test(message))throw new EngineHttpError(429,'AI_CAPACITY');
    throw new EngineHttpError(502,'AI_ERROR');
  }

  const classified=normalizeClassifier(aiResult);
  let assessment;
  try{
    assessment=await serviceRpc(env,'record_idea_blueprint_fit_assessment_v1',{
      p_idea_id:projection.idea.id,p_expected_engine_revision:projection.idea.engine_revision,p_classification:classified.classification,
      p_candidate_type:classified.candidate_type||null,p_confidence:classified.confidence,p_rationale:classified.rationale,p_evidence:classified.evidence,
      p_auto_applicable:classified.auto_applicable,p_assessor_actor:'AI',p_method:'workspace_worker_g0_v1',p_model_ref:AI_MODEL,p_idempotency_key:idempotencyKey
    });
    let autoApplied=false;
    if(classified.auto_applicable){
      await serviceRpc(env,'apply_assessed_blueprint_fit_v1',{p_assessment_id:assessment.assessment_id,p_idempotency_key:`workspace-g0-apply:${assessment.assessment_id}`});
      autoApplied=true;
    }
    const refreshed=await loadProjection(env,projection.idea.id,auth.token);
    return {projection:refreshed,reused:Boolean(assessment?.idempotent),auto_applied:autoApplied,assessment:refreshed.blueprint_fit?.assessment||classified};
  }catch(error){throw mapEngineError(error)}
}

function foundationAvailablePaths(env){return env.AI?['RAW']:[]}

function safeFoundationPlan(plan){
  const human=plan?.dominant_user_action&&typeof plan.dominant_user_action==='object'
    ? {type:'HUMAN',requirement_id:cleanText(plan.dominant_user_action.requirement_id,120),title:cleanText(plan.dominant_user_action.title,180),purpose:cleanText(plan.dominant_user_action.purpose,360),interaction:cleanText(plan.dominant_user_action.interaction,80),why_now:cleanText(plan.dominant_user_action.why_now,120),what_it_unlocks:safeArray(plan.dominant_user_action.what_it_unlocks).slice(0,8).map(item=>cleanText(item,120)),prompt:FOUNDATION_HUMAN_PROMPTS[String(plan.dominant_user_action.requirement_id||'')]||'Pouvez-vous préciser ce point ?'}
    : null;
  return {
    gate_id:cleanText(plan?.gate_id,120),gate_status:cleanText(plan?.gate_status,80),
    missing_requirements:safeArray(plan?.missing_requirements).slice(0,20).map(item=>({requirement_id:cleanText(item?.requirement_id,120),status:cleanText(item?.status,80),criticality:cleanText(item?.criticality,80)})),
    eligible_system_action_count:safeArray(plan?.eligible_system_actions).length,dominant_user_action:human,foundation_conflict:Boolean(plan?.foundation_conflict)
  };
}

async function planFoundation(env,projection){
  try{
    const plan=await serviceRpc(env,'plan_idea_foundation_v1',{p_idea_id:projection.idea.id,p_expected_engine_revision:projection.idea.engine_revision,p_available_paths:foundationAvailablePaths(env)});
    if(!plan||typeof plan!=='object'||Array.isArray(plan))throw new EngineHttpError(502,'FOUNDATION_PLAN_INVALID');
    return plan;
  }catch(error){throw mapEngineError(error)}
}

function foundationRawSchema(requirementIds){
  return {type:'object',additionalProperties:false,properties:{findings:{type:'array',maxItems:requirementIds.length,items:{type:'object',additionalProperties:false,properties:{requirement_id:{type:'string',enum:requirementIds},value:{type:'string',maxLength:1200},support_text:{type:'string',maxLength:240},direct:{type:'boolean'}},required:['requirement_id','value','support_text','direct']}}},required:['findings']};
}

function foundationRawPrompt(requirementIds){
  const rows=requirementIds.map(id=>`- ${id}: ${FOUNDATION_TARGETS[id]?.label||id}`).join('\n');
  return `Tu extrais uniquement des informations explicitement déclarées dans le texte humain brut d'une Idea 2b2c.\n\nRequirements ciblés :\n${rows}\n\nRègles absolues :\n- N'invente rien et ne complète rien par vraisemblance.\n- Un finding n'est autorisé que si le texte affirme directement l'information.\n- direct=true uniquement pour une information explicite et non ambiguë.\n- support_text doit recopier VERBATIM un court passage réellement présent dans le texte source.\n- Si l'information demande une interprétation, une hypothèse ou une déduction, ne la retourne pas.\n- Ne déduis jamais une absence de contrainte du simple fait qu'aucune contrainte n'est mentionnée.\n- Une même Requirement apparaît au maximum une fois.\n- N'utilise que les requirement_id fournis.\n- Réponds uniquement selon le schéma JSON demandé.`;
}

function normalizeFoundationRaw(raw,action,rawInput){
  let value=raw?.response??raw;
  if(typeof value==='string'){
    try{value=JSON.parse(value)}catch{throw new EngineHttpError(502,'AI_OUTPUT_INVALID')}
  }
  if(!value||typeof value!=='object'||Array.isArray(value)||!Array.isArray(value.findings))throw new EngineHttpError(502,'AI_OUTPUT_INVALID');
  const targetIds=safeArray(action?.requirement_ids).map(String);
  const targetSet=new Set(targetIds);
  const sourceText=cleanText(rawInput?.original_text,22000);
  const sourceNorm=sourceText.toLocaleLowerCase('fr-FR');
  const sourceId=String(rawInput?.raw_source_id||'');
  if(!UUID_RE.test(sourceId))throw new EngineHttpError(502,'RAW_INPUT_INVALID');
  const seen=new Set(),mutations=[],accepted=[];
  for(const finding of value.findings.slice(0,targetIds.length)){
    const requirementId=String(finding?.requirement_id||'');
    if(!targetSet.has(requirementId)||seen.has(requirementId)||finding?.direct!==true)continue;
    const spec=FOUNDATION_TARGETS[requirementId];
    if(!spec)continue;
    const support=cleanText(finding?.support_text,240),supportNorm=support.toLocaleLowerCase('fr-FR');
    if(supportNorm.length<3||!sourceNorm.includes(supportNorm))continue;
    const extracted=cleanText(finding?.value,1200);
    if(!extracted)continue;
    seen.add(requirementId);accepted.push(requirementId);
    mutations.push({kind:'INFORMATION_ITEM',semantic_key:spec.semantic_key,item_type:spec.item_type,value:{value:extracted},provenance_type:'SOURCE_EXTRACTED',source_id:sourceId,confidence_class:'DIRECT',sensitivity:'internal',target_requirement_id:requirementId,resolution_levels:['RAW_HUMAN','ACCEPTED_AS_CURRENT']});
  }
  return {mutations,accepted};
}

async function executeFoundationRaw(env,projection,plan,action){
  if(!env.AI)throw new EngineHttpError(503,'AI_BINDING_UNAVAILABLE');
  const requirementIds=safeArray(action?.requirement_ids).map(String).filter(id=>FOUNDATION_TARGETS[id]);
  if(!requirementIds.length)throw new EngineHttpError(502,'FOUNDATION_ACTION_INVALID');
  const rawInput=await serviceRpc(env,'get_idea_foundation_raw_input_v1',{p_idea_id:projection.idea.id,p_expected_engine_revision:projection.idea.engine_revision});
  if(!rawInput||typeof rawInput!=='object'||Array.isArray(rawInput))throw new EngineHttpError(502,'RAW_INPUT_INVALID');

  let run=await serviceRpc(env,'create_action_run_v3',{
    p_idea_id:projection.idea.id,p_expected_engine_revision:projection.idea.engine_revision,p_action_type:'EXTRACT_RAW',p_acquisition_path:'RAW',
    p_target_requirement_ids:requirementIds,p_target_requirement_fingerprints:action.target_requirement_fingerprints||{},p_target_artifact_keys:[],
    p_input_fingerprint:String(action.input_fingerprint||''),p_projection_fingerprint:String(plan.projection_fingerprint||''),
    p_permission_scope:{allowed_mutation_kinds:['INFORMATION_ITEM']},p_provider:'cloudflare-workers-ai',p_model:AI_MODEL,
    p_prompt_version:FOUNDATION_PROMPT_VERSION,p_schema_version:FOUNDATION_SCHEMA_VERSION,p_tool_version:FOUNDATION_TOOL_VERSION,
    p_idempotency_key:`workspace-g1:${projection.idea.id}:RAW:${String(action.input_fingerprint||'')}`
  });
  const runId=String(run?.action_run_id||'');
  if(!UUID_RE.test(runId))throw new EngineHttpError(502,'ACTION_RUN_INVALID');
  if(run?.idempotent&&run?.status==='failed'){
    run=await serviceRpc(env,'retry_action_run_v1',{p_action_run_id:runId,p_current_input_fingerprint:String(action.input_fingerprint||'')});
    if(run?.status==='stale')return {stale:true,reused:false,promoted:false,accepted:[]};
  }else if(run?.idempotent){
    return {reused:true,promoted:false,accepted:[]};
  }

  const started=await serviceRpc(env,'start_action_run_v1',{p_action_run_id:runId,p_current_input_fingerprint:String(action.input_fingerprint||'')});
  if(started?.status==='stale')return {stale:true,reused:false,promoted:false,accepted:[]};
  if(started?.idempotent)return {reused:true,promoted:false,accepted:[]};

  const startMs=Date.now();
  let aiResult;
  try{
    const rawText=cleanText(rawInput.original_text,22000);
    aiResult=await env.AI.run(AI_MODEL,{messages:[{role:'system',content:foundationRawPrompt(requirementIds)},{role:'user',content:`Texte humain brut :\n${rawText}`}],response_format:{type:'json_schema',json_schema:foundationRawSchema(requirementIds)},temperature:0,max_completion_tokens:1100,chat_template_kwargs:{enable_thinking:false}});
  }catch(error){
    const message=String(error?.message||error||''),code=/3040|quota|limit|capacity|neuron/i.test(message)?'AI_CAPACITY':'AI_ERROR';
    try{await serviceRpc(env,'fail_action_run_v1',{p_action_run_id:runId,p_error_code:code})}catch{}
    throw new EngineHttpError(code==='AI_CAPACITY'?429:502,code);
  }

  let normalized;
  try{normalized=normalizeFoundationRaw(aiResult,action,rawInput)}catch(error){
    try{await serviceRpc(env,'fail_action_run_v1',{p_action_run_id:runId,p_error_code:'AI_OUTPUT_INVALID'})}catch{}
    throw error;
  }

  let completion;
  try{
    completion=await serviceRpc(env,'complete_action_run_v1',{
      p_action_run_id:runId,p_current_input_fingerprint:String(action.input_fingerprint||''),
      p_result:{path:'RAW',accepted_requirement_ids:normalized.accepted,finding_count:normalized.mutations.length},p_proposed_mutations:normalized.mutations,
      p_latency_ms:Math.max(0,Date.now()-startMs),p_cost_metadata:{provider:'cloudflare-workers-ai',model:AI_MODEL}
    });
  }catch(error){
    try{await serviceRpc(env,'fail_action_run_v1',{p_action_run_id:runId,p_error_code:'COMPLETE_REJECTED'})}catch{}
    throw mapEngineError(error);
  }
  if(completion?.status==='stale')return {stale:true,reused:false,promoted:false,accepted:normalized.accepted};

  let promoted=false;
  if(normalized.mutations.length&&completion?.promotable){
    try{
      const promotion=await serviceRpc(env,'promote_action_result_v1',{p_action_run_id:runId,p_expected_engine_revision:projection.idea.engine_revision,p_current_input_fingerprint:String(action.input_fingerprint||'')});
      promoted=Boolean(promotion?.promoted);
      if(promotion?.status==='stale')return {stale:true,reused:false,promoted:false,accepted:normalized.accepted};
    }catch(error){
      const mapped=mapEngineError(error);
      if(mapped.code==='STALE_STATE')throw mapped;
      try{await serviceRpc(env,'mark_action_run_stale_v1',{p_action_run_id:runId,p_reason:'PROMOTION_REJECTED'})}catch{}
      throw mapped;
    }
  }
  return {reused:false,promoted,accepted:normalized.accepted};
}

async function advanceFoundation(env,auth,projection){
  if(!env.SUPABASE_SERVICE_ROLE_KEY)throw new EngineHttpError(503,'SERVER_PRIVILEGE_UNAVAILABLE');
  if(!projection.capabilities?.can_write)throw new EngineHttpError(403,'IDEA_WRITE_REQUIRED');
  if(String(projection.lifecycle?.mode||'')!=='IDEA_ENGINE')throw new EngineHttpError(409,'FOUNDATION_NOT_AVAILABLE');

  let currentProjection=projection,plan=await planFoundation(env,projection),executed=0,promoted=0,accepted=[];
  currentProjection=await loadProjection(env,currentProjection.idea.id,auth.token);
  for(let i=0;i<FOUNDATION_MAX_ACTIONS_PER_REQUEST;i++){
    const rawAction=safeArray(plan.eligible_system_actions).find(item=>item?.acquisition_path==='RAW'&&item?.action_type==='EXTRACT_RAW');
    if(!rawAction)break;
    const outcome=await executeFoundationRaw(env,currentProjection,plan,rawAction);
    if(outcome.stale)throw new EngineHttpError(409,'STALE_STATE');
    if(outcome.reused)break;
    executed+=1;if(outcome.promoted)promoted+=1;accepted=accepted.concat(outcome.accepted||[]);
    currentProjection=await loadProjection(env,currentProjection.idea.id,auth.token);
    plan=await planFoundation(env,currentProjection);
    currentProjection=await loadProjection(env,currentProjection.idea.id,auth.token);
  }

  const safePlan=safeFoundationPlan(plan);
  const status=safePlan.gate_status==='READY'||safePlan.gate_status==='READY_WITH_ACCEPTED_UNKNOWNS'?'FOUNDATION_READY':safePlan.dominant_user_action?'HUMAN_INPUT_REQUIRED':safePlan.eligible_system_action_count>0?'SYSTEM_WORK_CONTINUES':'FOUNDATION_BLOCKED';
  return {projection:currentProjection,plan:safePlan,status,execution:{actions_executed:executed,promotions:promoted,accepted_requirement_ids:[...new Set(accepted)]}};
}

export async function handleIdeaEngineCommand(request,env){
  if(request.method!=='POST')return json({ok:false,error:'METHOD_NOT_ALLOWED'},405);
  if(Number(request.headers.get('content-length')||0)>4096)return json({ok:false,error:'INVALID_REQUEST'},400);
  const auth=await authenticate(env,request);
  if(!auth)return json({ok:false,error:'UNAUTHORIZED'},401);
  let body;
  try{body=await request.json()}catch{return json({ok:false,error:'INVALID_REQUEST'},400)}
  if(!body||typeof body!=='object'||Array.isArray(body)||!hasOnlyKeys(body,new Set(['command','idea_id'])))return json({ok:false,error:'INVALID_REQUEST'},400);
  const command=String(body.command||''),ideaId=String(body.idea_id||'');
  if(!COMMANDS.has(command)||!UUID_RE.test(ideaId))return json({ok:false,error:'INVALID_REQUEST'},400);

  let projection;
  try{projection=await loadProjection(env,ideaId,auth.token)}catch(error){const mapped=mapEngineError(error);return json({ok:false,error:mapped.code},mapped.status===404?403:mapped.status)}

  try{
    if(command==='blueprint_fit.assess'){
      const result=await assessBlueprintFit(env,auth,projection);
      return json({ok:true,command,status:result.projection.signals?.blueprint_fit_requires_human?'HUMAN_CONFIRMATION_REQUIRED':'READY',reused:result.reused,auto_applied:result.auto_applied,projection:result.projection});
    }
    if(command==='foundation.advance'){
      const result=await advanceFoundation(env,auth,projection);
      return json({ok:true,command,...result});
    }
    return json({ok:false,error:'INVALID_REQUEST'},400);
  }catch(error){const mapped=mapEngineError(error);return json({ok:false,error:mapped.code},mapped.status)}
}

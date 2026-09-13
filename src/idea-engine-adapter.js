const UUID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const AI_MODEL='@cf/google/gemma-4-26b-a4b-it';
const COMMANDS=new Set(['blueprint_fit.assess']);
const LIFECYCLE_ELIGIBLE=new Set(['CAPTURED_UNCLASSIFIED','BLUEPRINT_MIGRATION_REQUIRED']);

class EngineHttpError extends Error{
  constructor(status,code,internal=''){super(code);this.status=status;this.code=code;this.internal=internal;}
}

function json(data,status=200){return Response.json(data,{status,headers:{'cache-control':'no-store'}})}
function cleanText(value,max=500){return String(value??'').trim().replace(/\s+/g,' ').slice(0,max)}
function hasOnlyKeys(obj,allowed){return Object.keys(obj||{}).every(key=>allowed.has(key))}

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
  const response=await fetch(`${env.SUPABASE_URL}${path}`,{
    method,
    headers,
    body:body===undefined?undefined:JSON.stringify(body)
  });
  const payload=await parseResponse(response);
  if(!response.ok){
    const raw=cleanText(payload?.message||payload?.error||payload?.hint||payload||`SUPABASE_${response.status}`,220);
    throw new EngineHttpError(response.status,'SUPABASE_REJECTED',raw);
  }
  return payload;
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
  return {
    classification,
    candidate_type:cleanText(value.candidate_type,80),
    confidence,
    rationale:cleanText(value.rationale,500),
    evidence,
    auto_applicable:autoApplicable
  };
}

function mapEngineError(error){
  if(error instanceof EngineHttpError){
    const internal=error.internal||'';
    if(/STALE_ENGINE|STALE_BLUEPRINT_ASSESSMENT|IDEMPOTENCY_KEY_REUSE/i.test(internal))return new EngineHttpError(409,'STALE_STATE');
    if(/BLUEPRINT_FIT_ALREADY_RESOLVED|BLUEPRINT_ALREADY_ASSIGNED/i.test(internal))return new EngineHttpError(409,'BLUEPRINT_FIT_ALREADY_RESOLVED');
    if(/FORBIDDEN|IDEA_NOT_FOUND/i.test(internal))return new EngineHttpError(403,'IDEA_ACCESS_DENIED');
    return error;
  }
  return new EngineHttpError(502,'ENGINE_ERROR');
}

async function applyExistingAssessmentIfEligible(env,projection){
  const assessment=projection.blueprint_fit?.assessment;
  if(!assessment||assessment.state!=='current')return {applied:false,reused:false};
  if(!(assessment.confidence==='HIGH'&&assessment.auto_applicable&&assessment.classification!=='AMBIGUOUS'))return {applied:false,reused:true};
  await supabaseRequest(env,'/rest/v1/rpc/apply_assessed_blueprint_fit_v1',{
    service:true,
    body:{p_assessment_id:assessment.id,p_idempotency_key:`workspace-g0-apply:${assessment.id}`}
  });
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
      messages:[
        {role:'system',content:classifierSystemPrompt()},
        {role:'user',content:`Entrée persistée de l'Idea :\n${JSON.stringify(persistedInput)}`}
      ],
      response_format:{type:'json_schema',json_schema:classifierSchema()},
      temperature:0,
      max_completion_tokens:700,
      chat_template_kwargs:{enable_thinking:false}
    });
  }catch(error){
    const message=String(error?.message||error||'');
    if(/3040|quota|limit|capacity|neuron/i.test(message))throw new EngineHttpError(429,'AI_CAPACITY');
    throw new EngineHttpError(502,'AI_ERROR');
  }

  const classified=normalizeClassifier(aiResult);
  let assessment;
  try{
    assessment=await supabaseRequest(env,'/rest/v1/rpc/record_idea_blueprint_fit_assessment_v1',{
      service:true,
      body:{
        p_idea_id:projection.idea.id,
        p_expected_engine_revision:projection.idea.engine_revision,
        p_classification:classified.classification,
        p_candidate_type:classified.candidate_type||null,
        p_confidence:classified.confidence,
        p_rationale:classified.rationale,
        p_evidence:classified.evidence,
        p_auto_applicable:classified.auto_applicable,
        p_assessor_actor:'AI',
        p_method:'workspace_worker_g0_v1',
        p_model_ref:AI_MODEL,
        p_idempotency_key:idempotencyKey
      }
    });

    let autoApplied=false;
    if(classified.auto_applicable){
      await supabaseRequest(env,'/rest/v1/rpc/apply_assessed_blueprint_fit_v1',{
        service:true,
        body:{p_assessment_id:assessment.assessment_id,p_idempotency_key:`workspace-g0-apply:${assessment.assessment_id}`}
      });
      autoApplied=true;
    }
    const refreshed=await loadProjection(env,projection.idea.id,auth.token);
    return {projection:refreshed,reused:Boolean(assessment?.idempotent),auto_applied:autoApplied,assessment:refreshed.blueprint_fit?.assessment||classified};
  }catch(error){throw mapEngineError(error)}
}

export async function handleIdeaEngineCommand(request,env){
  if(request.method!=='POST')return json({ok:false,error:'METHOD_NOT_ALLOWED'},405);
  if(Number(request.headers.get('content-length')||0)>4096)return json({ok:false,error:'INVALID_REQUEST'},400);

  const auth=await authenticate(env,request);
  if(!auth)return json({ok:false,error:'UNAUTHORIZED'},401);

  let body;
  try{body=await request.json()}catch{return json({ok:false,error:'INVALID_REQUEST'},400)}
  if(!body||typeof body!=='object'||Array.isArray(body)||!hasOnlyKeys(body,new Set(['command','idea_id'])))return json({ok:false,error:'INVALID_REQUEST'},400);

  const command=String(body.command||'');
  const ideaId=String(body.idea_id||'');
  if(!COMMANDS.has(command)||!UUID_RE.test(ideaId))return json({ok:false,error:'INVALID_REQUEST'},400);

  let projection;
  try{projection=await loadProjection(env,ideaId,auth.token)}
  catch(error){
    const mapped=mapEngineError(error);
    return json({ok:false,error:mapped.code},mapped.status===404?403:mapped.status);
  }

  try{
    if(command==='blueprint_fit.assess'){
      const result=await assessBlueprintFit(env,auth,projection);
      return json({
        ok:true,
        command,
        status:result.projection.signals?.blueprint_fit_requires_human?'HUMAN_CONFIRMATION_REQUIRED':'READY',
        reused:result.reused,
        auto_applied:result.auto_applied,
        projection:result.projection
      });
    }
    return json({ok:false,error:'INVALID_REQUEST'},400);
  }catch(error){
    const mapped=mapEngineError(error);
    return json({ok:false,error:mapped.code},mapped.status);
  }
}

const UUID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MD5_RE=/^[0-9a-f]{32}$/i;
const LOT_KEY_RE=/^[A-Z0-9][A-Z0-9._-]{0,127}$/;
const NODE_ID_RE=/^SV\.D(?:0[1-9]|1[0-6])\.[A-Z0-9_]+$/;
const MAX_BODY_BYTES=16384;
const MAX_NODES_PER_LOT=28;
const COMMANDS=new Set([
  'canonical.read',
  'delivery_lot.create',
  'delivery_lot.readiness',
  'delivery_lot.prepare_rfd',
  'delivery_lot.approve_rfd',
  'project_rfd.readiness',
  'project_rfd.prepare',
  'project_rfd.approve'
]);

const REQUEST_KEYS=Object.freeze({
  'canonical.read':new Set(['command','project_definition_id']),
  'delivery_lot.create':new Set(['command','project_definition_id','expected_definition_revision','lot_key','title','purpose','node_ids','required_for_project_rfd']),
  'delivery_lot.readiness':new Set(['command','lot_id']),
  'delivery_lot.prepare_rfd':new Set(['command','lot_id','expected_definition_revision']),
  'delivery_lot.approve_rfd':new Set(['command','lot_id','expected_definition_revision','expected_evaluation_fingerprint']),
  'project_rfd.readiness':new Set(['command','project_definition_id']),
  'project_rfd.prepare':new Set(['command','project_definition_id','expected_definition_revision']),
  'project_rfd.approve':new Set(['command','project_definition_id','expected_definition_revision','expected_evaluation_fingerprint'])
});

const PREBASELINE_PREDICATES=Object.freeze([
  'DEPENDENCY_CLOSURE',
  'CRITICAL_TBD_CLOSURE',
  'OWNERSHIP_CLOSURE',
  'QUALITY_REQUIREMENTS_DEFINED',
  'TESTABILITY_READY'
]);

class AdapterHttpError extends Error{
  constructor(status,code,internal=''){super(code);this.status=status;this.code=code;this.internal=internal;}
}

function json(data,status=200){return Response.json(data,{status,headers:{'cache-control':'no-store'}})}
function cleanText(value,max=500){return String(value??'').trim().replace(/\s+/g,' ').slice(0,max)}
function hasOnlyKeys(obj,allowed){return Object.keys(obj||{}).every(key=>allowed.has(key))}
function isRevision(value){return Number.isSafeInteger(value)&&value>=0}
function uniqueStrings(value){return [...new Set(Array.isArray(value)?value.map(String):[])];}

async function parseResponse(response){
  const text=await response.text();
  if(!text)return null;
  try{return JSON.parse(text)}catch{return text}
}

async function supabaseRequest(env,path,{token,service=false,method='GET',body}={}){
  const key=service?env.SUPABASE_SERVICE_ROLE_KEY:env.SUPABASE_PUBLISHABLE_KEY;
  if(!key)throw new AdapterHttpError(503,service?'SERVER_PRIVILEGE_UNAVAILABLE':'BACKEND_CONFIG_UNAVAILABLE');
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
    const raw=cleanText(payload?.message||payload?.error||payload?.hint||payload||`SUPABASE_${response.status}`,260);
    throw new AdapterHttpError(response.status,'SUPABASE_REJECTED',raw);
  }
  return payload;
}

async function serviceRpc(env,name,body={}){
  return supabaseRequest(env,`/rest/v1/rpc/${encodeURIComponent(name)}`,{service:true,method:'POST',body});
}

async function authenticate(env,request){
  const header=request.headers.get('authorization')||'';
  if(!header.startsWith('Bearer '))return null;
  const token=header.slice(7).trim();
  if(!token)return null;
  const response=await fetch(`${env.SUPABASE_URL}/auth/v1/user`,{
    headers:{apikey:env.SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${token}`}
  });
  if(!response.ok)return null;
  const user=await response.json().catch(()=>null);
  return user?.id&&UUID_RE.test(user.id)?{user,token}:null;
}

async function loadAccessibleProjectDefinition(env,projectDefinitionId,token){
  const id=encodeURIComponent(projectDefinitionId);
  const rows=await supabaseRequest(
    env,
    `/rest/v1/project_definitions?select=id,idea_id,workspace_id,definition_revision,status,baseline_hash&id=eq.${id}&limit=1`,
    {token,method:'GET'}
  );
  const project=Array.isArray(rows)?rows[0]:null;
  if(!project?.id)throw new AdapterHttpError(403,'PROJECT_DEFINITION_ACCESS_DENIED');
  return project;
}

async function loadManagementAuthority(env,project,auth){
  const ideaRows=await supabaseRequest(
    env,
    `/rest/v1/ideas?select=id,workspace_id,created_by&id=eq.${encodeURIComponent(project.idea_id)}&limit=1`,
    {service:true,method:'GET'}
  );
  const idea=Array.isArray(ideaRows)?ideaRows[0]:null;
  if(!idea?.id)throw new AdapterHttpError(403,'PROJECT_DEFINITION_ACCESS_DENIED');
  if(idea.created_by===auth.user.id)return {can_manage:true,reason:'IDEA_CREATOR'};

  const memberRows=await supabaseRequest(
    env,
    `/rest/v1/workspace_members?select=role,status&workspace_id=eq.${encodeURIComponent(idea.workspace_id)}&user_id=eq.${encodeURIComponent(auth.user.id)}&status=eq.active&limit=1`,
    {service:true,method:'GET'}
  );
  const member=Array.isArray(memberRows)?memberRows[0]:null;
  const canManage=Boolean(member&&['owner','admin'].includes(String(member.role||'')));
  return {can_manage:canManage,reason:canManage?`WORKSPACE_${String(member.role).toUpperCase()}`:'INSUFFICIENT_ROLE'};
}

async function requireManagementAuthority(env,project,auth){
  const authority=await loadManagementAuthority(env,project,auth);
  if(!authority.can_manage)throw new AdapterHttpError(403,'PROJECT_DEFINITION_WRITE_REQUIRED');
  return authority;
}

async function resolveAccessibleLot(env,lotId,auth){
  let closure;
  try{closure=await serviceRpc(env,'get_project_delivery_lot_dependency_closure_v1',{p_lot_id:lotId});}
  catch(error){throw mapAdapterError(error)}
  const projectDefinitionId=String(closure?.lot?.project_definition_id||'');
  if(!UUID_RE.test(projectDefinitionId))throw new AdapterHttpError(403,'PROJECT_DEFINITION_ACCESS_DENIED');
  const project=await loadAccessibleProjectDefinition(env,projectDefinitionId,auth.token);
  return {project,closure};
}

function mapAdapterError(error){
  if(error instanceof AdapterHttpError){
    const internal=String(error.internal||'');
    if(/STALE_|STALE PROJECT|STALE_G4|STALE_G5/i.test(internal))return new AdapterHttpError(409,'STALE_STATE');
    if(/RFD_.*NOT_READY|NOT_READY|REQUIRED_LOTS_NOT_READY|BASELINE_NOT_READY|RFD_PREBASELINE_NOT_READY|HANDOFF_READY_REQUIRED|BASELINE_CANDIDATE_REQUIRED/i.test(internal))return new AdapterHttpError(409,'RFD_NOT_READY');
    if(/AUTHORITY_REQUIRED|NOT_AUTHORIZED|BUILD_READY_OWNER_NOT_AUTHORIZED|PROJECT_RFD_OWNER_NOT_AUTHORIZED/i.test(internal))return new AdapterHttpError(403,'RFD_AUTHORITY_REQUIRED');
    if(/DELIVERY_LOT_KEY_REUSE/i.test(internal))return new AdapterHttpError(409,'DELIVERY_LOT_CONFLICT');
    if(/INVALID_DELIVERY_LOT_KEY|DELIVERY_LOT_TITLE_REQUIRED|DELIVERY_LOT_NODES_REQUIRED|DELIVERY_LOT_UNKNOWN_NODE|INVALID_REQUIREMENT_METADATA/i.test(internal))return new AdapterHttpError(400,'INVALID_REQUEST');
    if(/PROJECT_DEFINITION_NOT_ACTIVE|PROJECT_DEFINITION_NOT_FOUND|DELIVERY_LOT_NOT_FOUND/i.test(internal))return new AdapterHttpError(403,'PROJECT_DEFINITION_ACCESS_DENIED');
    return error;
  }
  return new AdapterHttpError(502,'PROJECT_DEFINITION_ENGINE_ERROR');
}

function validateCommandBody(body){
  if(!body||typeof body!=='object'||Array.isArray(body))throw new AdapterHttpError(400,'INVALID_REQUEST');
  const command=String(body.command||'');
  if(!COMMANDS.has(command))throw new AdapterHttpError(400,'INVALID_REQUEST');
  const allowed=REQUEST_KEYS[command];
  if(!allowed||!hasOnlyKeys(body,allowed))throw new AdapterHttpError(400,'INVALID_REQUEST');

  if('project_definition_id'in body&&!UUID_RE.test(String(body.project_definition_id||'')))throw new AdapterHttpError(400,'INVALID_REQUEST');
  if('lot_id'in body&&!UUID_RE.test(String(body.lot_id||'')))throw new AdapterHttpError(400,'INVALID_REQUEST');
  if('expected_definition_revision'in body&&!isRevision(body.expected_definition_revision))throw new AdapterHttpError(400,'INVALID_REQUEST');
  if('expected_evaluation_fingerprint'in body&&!MD5_RE.test(String(body.expected_evaluation_fingerprint||'')))throw new AdapterHttpError(400,'INVALID_REQUEST');

  if(command==='delivery_lot.create'){
    if(!LOT_KEY_RE.test(String(body.lot_key||'')))throw new AdapterHttpError(400,'INVALID_REQUEST');
    const title=cleanText(body.title,240),purpose=cleanText(body.purpose,1200);
    if(!title)throw new AdapterHttpError(400,'INVALID_REQUEST');
    const nodeIds=uniqueStrings(body.node_ids);
    if(nodeIds.length<1||nodeIds.length>MAX_NODES_PER_LOT||nodeIds.some(id=>!NODE_ID_RE.test(id)))throw new AdapterHttpError(400,'INVALID_REQUEST');
    if(body.required_for_project_rfd!==undefined&&typeof body.required_for_project_rfd!=='boolean')throw new AdapterHttpError(400,'INVALID_REQUEST');
    return {...body,command,title,purpose,node_ids:nodeIds,required_for_project_rfd:body.required_for_project_rfd!==false};
  }
  return {...body,command};
}

function firstFivePredicatesPass(readiness){
  const predicates=readiness?.predicates||{};
  return PREBASELINE_PREDICATES.every(key=>predicates[key]==='PASS');
}

async function canonicalRead(env,auth,body){
  const project=await loadAccessibleProjectDefinition(env,body.project_definition_id,auth.token);
  const graph=await serviceRpc(env,'get_project_definition_canonical_graph_v1',{p_project_definition_id:project.id});
  return {project_definition:project,canonical_graph:graph};
}

async function createDeliveryLot(env,auth,body){
  const project=await loadAccessibleProjectDefinition(env,body.project_definition_id,auth.token);
  await requireManagementAuthority(env,project,auth);
  const result=await serviceRpc(env,'create_project_delivery_lot_v1',{
    p_project_definition_id:project.id,
    p_expected_definition_revision:body.expected_definition_revision,
    p_lot_key:body.lot_key,
    p_title:body.title,
    p_purpose:body.purpose,
    p_node_ids:body.node_ids,
    p_required_for_project_rfd:body.required_for_project_rfd
  });
  return {result};
}

async function deliveryLotReadiness(env,auth,body){
  const {project}=await resolveAccessibleLot(env,body.lot_id,auth);
  const readiness=await serviceRpc(env,'get_project_delivery_lot_rfd_readiness_v1',{p_lot_id:body.lot_id});
  return {project_definition_id:project.id,readiness};
}

async function prepareDeliveryLotRfd(env,auth,body){
  const {project}=await resolveAccessibleLot(env,body.lot_id,auth);
  await requireManagementAuthority(env,project,auth);
  if(project.definition_revision!==body.expected_definition_revision)throw new AdapterHttpError(409,'STALE_STATE');

  let readiness=await serviceRpc(env,'get_project_delivery_lot_rfd_readiness_v1',{p_lot_id:body.lot_id});
  if(readiness?.ready_for_authorization===true)return {status:'READY_FOR_AUTHORIZATION',prepared:true,reused:true,readiness};
  if(!firstFivePredicatesPass(readiness))throw new AdapterHttpError(409,'RFD_NOT_READY',JSON.stringify(readiness?.predicates||{}));

  let baselineHandoff=readiness?.diagnostics?.baseline_handoff||{};
  if(baselineHandoff.BASELINE_READY!=='PASS'){
    await serviceRpc(env,'create_project_delivery_lot_baseline_candidate_v1',{
      p_lot_id:body.lot_id,
      p_expected_definition_revision:body.expected_definition_revision
    });
    baselineHandoff=await serviceRpc(env,'get_project_delivery_lot_baseline_handoff_readiness_v1',{p_lot_id:body.lot_id});
  }
  if(baselineHandoff.HANDOFF_INTEGRITY!=='PASS'){
    await serviceRpc(env,'create_project_delivery_lot_handoff_manifest_v1',{
      p_lot_id:body.lot_id,
      p_expected_definition_revision:body.expected_definition_revision
    });
  }
  readiness=await serviceRpc(env,'get_project_delivery_lot_rfd_readiness_v1',{p_lot_id:body.lot_id});
  return {status:readiness?.ready_for_authorization?'READY_FOR_AUTHORIZATION':'RFD_NOT_READY',prepared:true,reused:false,readiness};
}

async function approveDeliveryLotRfd(env,auth,body){
  const {project}=await resolveAccessibleLot(env,body.lot_id,auth);
  await requireManagementAuthority(env,project,auth);
  const result=await serviceRpc(env,'approve_project_delivery_lot_rfd_v1',{
    p_lot_id:body.lot_id,
    p_expected_definition_revision:body.expected_definition_revision,
    p_expected_evaluation_fingerprint:body.expected_evaluation_fingerprint,
    p_authorized_by:auth.user.id
  });
  return {result};
}

async function projectRfdReadiness(env,auth,body){
  const project=await loadAccessibleProjectDefinition(env,body.project_definition_id,auth.token);
  const readiness=await serviceRpc(env,'get_project_rfd_readiness_v1',{p_project_definition_id:project.id});
  return {project_definition:project,readiness};
}

async function prepareProjectRfd(env,auth,body){
  const project=await loadAccessibleProjectDefinition(env,body.project_definition_id,auth.token);
  await requireManagementAuthority(env,project,auth);
  if(project.definition_revision!==body.expected_definition_revision)throw new AdapterHttpError(409,'STALE_STATE');

  let readiness=await serviceRpc(env,'get_project_rfd_readiness_v1',{p_project_definition_id:project.id});
  if(readiness?.ready_for_authorization===true)return {status:'READY_FOR_AUTHORIZATION',prepared:true,reused:true,readiness};
  if(readiness?.required_lot_readiness?.status!=='PASS')throw new AdapterHttpError(409,'RFD_NOT_READY',JSON.stringify(readiness?.required_lot_readiness||{}));

  await serviceRpc(env,'create_project_rfd_manifest_candidate_v1',{
    p_project_definition_id:project.id,
    p_expected_definition_revision:body.expected_definition_revision
  });
  readiness=await serviceRpc(env,'get_project_rfd_readiness_v1',{p_project_definition_id:project.id});
  return {status:readiness?.ready_for_authorization?'READY_FOR_AUTHORIZATION':'RFD_NOT_READY',prepared:true,reused:false,readiness};
}

async function approveProjectRfd(env,auth,body){
  const project=await loadAccessibleProjectDefinition(env,body.project_definition_id,auth.token);
  await requireManagementAuthority(env,project,auth);
  const result=await serviceRpc(env,'approve_project_rfd_v1',{
    p_project_definition_id:project.id,
    p_expected_definition_revision:body.expected_definition_revision,
    p_expected_evaluation_fingerprint:body.expected_evaluation_fingerprint,
    p_authorized_by:auth.user.id
  });
  return {result};
}

export async function handleProjectDefinitionCommand(request,env){
  if(request.method!=='POST')return json({ok:false,error:'METHOD_NOT_ALLOWED'},405);
  if(Number(request.headers.get('content-length')||0)>MAX_BODY_BYTES)return json({ok:false,error:'INVALID_REQUEST'},400);
  if(!env.SUPABASE_SERVICE_ROLE_KEY)return json({ok:false,error:'SERVER_PRIVILEGE_UNAVAILABLE'},503);

  const auth=await authenticate(env,request);
  if(!auth)return json({ok:false,error:'UNAUTHORIZED'},401);

  let rawBody;
  try{rawBody=await request.json()}catch{return json({ok:false,error:'INVALID_REQUEST'},400)}

  let body;
  try{body=validateCommandBody(rawBody)}catch(error){const mapped=mapAdapterError(error);return json({ok:false,error:mapped.code},mapped.status)}

  try{
    let payload;
    if(body.command==='canonical.read')payload=await canonicalRead(env,auth,body);
    else if(body.command==='delivery_lot.create')payload=await createDeliveryLot(env,auth,body);
    else if(body.command==='delivery_lot.readiness')payload=await deliveryLotReadiness(env,auth,body);
    else if(body.command==='delivery_lot.prepare_rfd')payload=await prepareDeliveryLotRfd(env,auth,body);
    else if(body.command==='delivery_lot.approve_rfd')payload=await approveDeliveryLotRfd(env,auth,body);
    else if(body.command==='project_rfd.readiness')payload=await projectRfdReadiness(env,auth,body);
    else if(body.command==='project_rfd.prepare')payload=await prepareProjectRfd(env,auth,body);
    else if(body.command==='project_rfd.approve')payload=await approveProjectRfd(env,auth,body);
    else throw new AdapterHttpError(400,'INVALID_REQUEST');
    return json({ok:true,command:body.command,...payload});
  }catch(error){
    const mapped=mapAdapterError(error);
    const response={ok:false,error:mapped.code};
    if(mapped.code==='RFD_NOT_READY'&&mapped.internal){
      try{response.readiness=JSON.parse(mapped.internal)}catch{}
    }
    return json(response,mapped.status);
  }
}

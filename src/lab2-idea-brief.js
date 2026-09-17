const CONTRACT_VERSION='lab2-definition-v1';
const UNDERSTANDING_CONTRACT='lab2-understanding-v4';
const IMPROVEMENTS_CONTRACT='lab2-improvements-v3';
const MAX_BODY_BYTES=36000;
const MAX_PROPOSALS=6;
const MAX_REFERENCES=3;

class Lab2DefinitionError extends Error{constructor(status,code){super(code);this.status=status;this.code=code}}
function json(data,status=200){return Response.json(data,{status,headers:{'cache-control':'no-store','content-type':'application/json; charset=utf-8'}})}
function enabled(value){return value===true||['1','true','on','yes'].includes(String(value||'').toLowerCase())}
function safeArray(value){return Array.isArray(value)?value:[]}
function cleanText(value,max=1000){return String(value??'').trim().replace(/\s+/g,' ').slice(0,max)}
function cleanMultiline(value,max=6000){return String(value??'').trim().replace(/\r\n/g,'\n').slice(0,max)}
function allowedUserIds(env){const raw=String(env?.LAB2_ALLOWED_USER_IDS||'').trim();if(!raw)return null;const ids=new Set(raw.split(',').map(v=>v.trim().toLowerCase()).filter(Boolean));return ids.size?ids:null}
async function authenticate(env,request){const header=request.headers.get('authorization')||'';if(!header.startsWith('Bearer '))return null;const token=header.slice(7).trim();if(!token||!env.SUPABASE_URL||!env.SUPABASE_PUBLISHABLE_KEY)return null;const response=await fetch(`${env.SUPABASE_URL}/auth/v1/user`,{headers:{apikey:env.SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${token}`}});if(!response.ok)return null;const user=await response.json().catch(()=>null);return user?.id?{id:String(user.id)}:null}
function normalizeProposal(value,index){return {id:cleanText(value?.id,40)||`p${index+1}`,title:cleanText(value?.title,140),type:cleanText(value?.type,40),proposal:cleanText(value?.proposal,600),why:cleanText(value?.why,420)}}
function acceptedImprovements(proposals,decisions){const out=[];for(const proposal of proposals){const decision=decisions?.[proposal.id],status=cleanText(decision?.status,20).toUpperCase();if(status==='ACCEPTED')out.push({...proposal,text:proposal.proposal,decision:'ACCEPTED'});else if(status==='MODIFIED'){const modified=cleanText(decision?.value,700);if(!modified)throw new Lab2DefinitionError(400,'MODIFIED_VALUE_REQUIRED');out.push({...proposal,text:modified,decision:'MODIFIED'})}}return out}
function assertDecisions(proposals,decisions){const valid=new Set(['ACCEPTED','MODIFIED','REJECTED']);if(proposals.length<3)throw new Lab2DefinitionError(400,'IMPROVEMENTS_REQUIRED');for(const p of proposals){if(!valid.has(cleanText(decisions?.[p.id]?.status,20).toUpperCase()))throw new Lab2DefinitionError(409,'IMPROVEMENT_DECISIONS_INCOMPLETE')}}
function normalizeInput(body){
  if(!body||typeof body!=='object'||Array.isArray(body))throw new Lab2DefinitionError(400,'INVALID_REQUEST');
  const name=cleanText(body.name,100),original_description=cleanMultiline(body.original_description,6000),u=body.understanding;
  if(!name||!original_description||u?.contract_version!==UNDERSTANDING_CONTRACT)throw new Lab2DefinitionError(400,'IDEA_CONTEXT_REQUIRED');
  const understanding={
    contract_version:u.contract_version,one_liner:cleanText(u.one_liner,320),problem:cleanText(u.problem,900),project_profile:u.project_profile&&typeof u.project_profile==='object'?u.project_profile:{},
    target_users:safeArray(u.target_users).slice(0,4).map(x=>cleanText(x?.label||x,180)).filter(Boolean),main_flow:safeArray(u.main_flow).slice(0,8).map(x=>cleanText(x?.step||x,260)).filter(Boolean),
    explicit_points:safeArray(u.explicit_points).slice(0,8).map(x=>cleanText(x,260)).filter(Boolean),open_decisions:safeArray(u.open_decisions).slice(0,10).map(x=>({question:cleanText(x?.question,320),scope:cleanText(x?.scope,30),blocking:x?.blocking===true,reason:cleanText(x?.reason,320)})).filter(x=>x.question)
  };
  if(!understanding.one_liner||!understanding.problem||!understanding.target_users.length||understanding.main_flow.length<2)throw new Lab2DefinitionError(400,'IDEA_CONTEXT_REQUIRED');
  const improvements=body.improvements&&typeof body.improvements==='object'?body.improvements:null;
  if(!improvements||cleanText(improvements.contract_version,60)!==IMPROVEMENTS_CONTRACT)throw new Lab2DefinitionError(400,'IMPROVEMENTS_INCOMPATIBLE');
  const proposals=safeArray(improvements.proposals).slice(0,MAX_PROPOSALS).map(normalizeProposal).filter(x=>x.id&&x.proposal),decisions=improvements.decisions&&typeof improvements.decisions==='object'?improvements.decisions:{};
  assertDecisions(proposals,decisions);
  const references=safeArray(body.references).slice(0,MAX_REFERENCES).map(x=>({url:cleanText(x?.url,500),reason:cleanText(x?.reason,120),note:cleanText(x?.note,500)})).filter(x=>x.url||x.note);
  return {name,original_description,understanding,references,proposals,decisions,retained:acceptedImprovements(proposals,decisions)};
}
function unique(values,max=10){return [...new Set(values.map(v=>cleanText(v,700)).filter(Boolean))].slice(0,max)}
function buildDefinition(input){
  const retained=input.retained;
  const featureTypes=new Set(['FUNCTIONALITY','CONTENT','CONVERSION','TRUST']);
  const flowTypes=new Set(['WORKFLOW','NAVIGATION','SIMPLIFICATION']);
  const coreFeatures=unique(retained.filter(x=>featureTypes.has(x.type)).map(x=>x.text),10);
  const extraFlow=retained.filter(x=>flowTypes.has(x.type)).map(x=>x.text);
  const differentiators=unique(retained.filter(x=>x.type==='DIFFERENTIATION').map(x=>x.text),6);
  const feasibilityNotes=unique(retained.filter(x=>x.type==='FEASIBILITY').map(x=>x.text),6);
  const openQuestions=input.understanding.open_decisions.map(item=>({question:item.question,scope:item.scope,blocking:item.blocking,reason:item.reason}));
  const brief={
    one_liner:input.understanding.one_liner,
    problem:input.understanding.problem,
    target_users:[...input.understanding.target_users],
    solution:input.understanding.one_liner,
    core_features:coreFeatures,
    main_flow:unique([...input.understanding.main_flow,...extraFlow],8),
    differentiators,
    open_questions:openQuestions.map(x=>x.question),
    short_pitch:`${input.understanding.one_liner} ${input.understanding.problem}`.slice(0,700)
  };
  return {
    project_name:input.name,project_profile:input.understanding.project_profile,original_description:input.original_description,
    brief,explicit_points:[...input.understanding.explicit_points],open_decisions:openQuestions,feasibility_notes:feasibilityNotes,
    retained_improvements:retained.map(x=>({id:x.id,title:x.title,type:x.type,text:x.text,decision:x.decision})),
    rejected_improvement_ids:input.proposals.filter(p=>cleanText(input.decisions?.[p.id]?.status,20).toUpperCase()==='REJECTED').map(p=>p.id),
    references:input.references
  };
}

export async function handleLab2IdeaBrief(request,env){
  if(!enabled(env?.LAB2_IDEA_STUDIO_ENABLED)||!enabled(env?.LAB2_BRIEF_ENABLED))return json({ok:false,error:'LAB_BRIEF_DISABLED'},404);
  if(request.method!=='POST')return json({ok:false,error:'METHOD_NOT_ALLOWED'},405);
  if(Number(request.headers.get('content-length')||0)>MAX_BODY_BYTES)return json({ok:false,error:'INVALID_REQUEST'},400);
  const allowlist=allowedUserIds(env);if(!allowlist)return json({ok:false,error:'LAB_ACCESS_UNCONFIGURED'},503);
  const auth=await authenticate(env,request);if(!auth)return json({ok:false,error:'UNAUTHORIZED'},401);if(!allowlist.has(auth.id.toLowerCase()))return json({ok:false,error:'LAB_ACCESS_DENIED'},403);
  let body;try{body=await request.json()}catch{return json({ok:false,error:'INVALID_REQUEST'},400)}
  let input;try{input=normalizeInput(body)}catch(error){return json({ok:false,error:error.code||'INVALID_REQUEST'},error.status||400)}
  const definition=buildDefinition(input);
  return json({
    ok:true,contract_version:CONTRACT_VERSION,user_id:auth.id,version:1,definition,brief:definition.brief,
    retained_improvements:definition.retained_improvements,references:definition.references,usage:null,
    quality:{canonical:true,deterministic:true,ai_calls:0},
    guarantees:{zero_ai_calls:true,only_confirmed_human_decisions_applied:true,rejected_proposals_excluded:true,no_new_features_generated:true,open_decisions_preserved:true,project_profile_preserved:true}
  });
}

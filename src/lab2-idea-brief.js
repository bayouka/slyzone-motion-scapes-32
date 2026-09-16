const LAB2_MODEL='@cf/google/gemma-4-26b-a4b-it';
const CONTRACT_VERSION='lab2-brief-v1';
const MAX_BODY_BYTES=32000;
const MAX_PROPOSALS=6;
const MAX_REFERENCES=3;

class Lab2BriefError extends Error{constructor(status,code){super(code);this.status=status;this.code=code}}
function json(data,status=200){return Response.json(data,{status,headers:{'cache-control':'no-store','content-type':'application/json; charset=utf-8'}})}
function enabled(value){return value===true||['1','true','on','yes'].includes(String(value||'').toLowerCase())}
function safeArray(value){return Array.isArray(value)?value:[]}
function cleanText(value,max=1000){return String(value??'').trim().replace(/\s+/g,' ').slice(0,max)}
function cleanMultiline(value,max=6000){return String(value??'').trim().replace(/\r\n/g,'\n').slice(0,max)}
function allowedUserIds(env){const raw=String(env?.LAB2_ALLOWED_USER_IDS||'').trim();if(!raw)return null;const ids=new Set(raw.split(',').map(v=>v.trim().toLowerCase()).filter(Boolean));return ids.size?ids:null}
async function authenticate(env,request){
  const header=request.headers.get('authorization')||'';if(!header.startsWith('Bearer '))return null;
  const token=header.slice(7).trim();if(!token||!env.SUPABASE_URL||!env.SUPABASE_PUBLISHABLE_KEY)return null;
  const response=await fetch(`${env.SUPABASE_URL}/auth/v1/user`,{headers:{apikey:env.SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${token}`}});
  if(!response.ok)return null;const user=await response.json().catch(()=>null);return user?.id?{id:String(user.id)}:null;
}

function normalizeUnderstanding(value){
  if(!value||typeof value!=='object')return null;
  return {
    one_liner:cleanText(value.one_liner,320),
    problem:cleanText(value.problem,900),
    target_users:safeArray(value.target_users).slice(0,4).map(x=>cleanText(x?.label||x,180)).filter(Boolean),
    main_flow:safeArray(value.main_flow).slice(0,7).map(x=>cleanText(x?.step||x,240)).filter(Boolean),
    explicit_points:safeArray(value.explicit_points).slice(0,7).map(x=>cleanText(x,260)).filter(Boolean),
    uncertainties:safeArray(value.uncertainties).slice(0,6).map(x=>cleanText(x,280)).filter(Boolean)
  };
}

function normalizeProposal(value,index){
  return {
    id:cleanText(value?.id,40)||`p${index+1}`,
    title:cleanText(value?.title,140),
    type:cleanText(value?.type,40),
    proposal:cleanText(value?.proposal,420),
    why:cleanText(value?.why,420)
  };
}

function acceptedImprovements(proposals,decisions){
  const applied=[];
  for(const proposal of proposals){
    const decision=decisions&&typeof decisions==='object'?decisions[proposal.id]:null;
    const status=cleanText(decision?.status,20).toUpperCase();
    if(status==='ACCEPTED'){
      applied.push({id:proposal.id,title:proposal.title,type:proposal.type,text:proposal.proposal,decision:'ACCEPTED'});
    }else if(status==='MODIFIED'){
      const modified=cleanText(decision?.value,600);
      if(!modified)throw new Lab2BriefError(400,'MODIFIED_VALUE_REQUIRED');
      applied.push({id:proposal.id,title:proposal.title,type:proposal.type,text:modified,decision:'MODIFIED'});
    }
  }
  return applied;
}

function assertDecisionCompleteness(proposals,decisions){
  if(!proposals.length)return;
  const valid=new Set(['ACCEPTED','MODIFIED','REJECTED']);
  for(const proposal of proposals){
    const status=cleanText(decisions?.[proposal.id]?.status,20).toUpperCase();
    if(!valid.has(status))throw new Lab2BriefError(409,'IMPROVEMENT_DECISIONS_INCOMPLETE');
  }
}

function normalizeInput(body){
  if(!body||typeof body!=='object'||Array.isArray(body))throw new Lab2BriefError(400,'INVALID_REQUEST');
  const name=cleanText(body.name,100);
  const original_description=cleanMultiline(body.original_description,6000);
  const understanding=normalizeUnderstanding(body.understanding);
  if(!name||!original_description||!understanding?.one_liner||!understanding?.problem)throw new Lab2BriefError(400,'IDEA_CONTEXT_REQUIRED');
  const references=safeArray(body.references).slice(0,MAX_REFERENCES).map(x=>({url:cleanText(x?.url,500),reason:cleanText(x?.reason,40),note:cleanText(x?.note,500)})).filter(x=>x.url||x.note);
  const proposals=safeArray(body.proposals).slice(0,MAX_PROPOSALS).map(normalizeProposal).filter(x=>x.id&&x.proposal);
  const decisions=body.decisions&&typeof body.decisions==='object'&&!Array.isArray(body.decisions)?body.decisions:{};
  assertDecisionCompleteness(proposals,decisions);
  return {name,original_description,understanding,references,applied:acceptedImprovements(proposals,decisions),proposal_count:proposals.length};
}

function schema(){return {type:'object',additionalProperties:false,properties:{
  one_liner:{type:'string',maxLength:320},
  problem:{type:'string',maxLength:900},
  target_users:{type:'array',maxItems:4,items:{type:'string',maxLength:180}},
  solution:{type:'string',maxLength:1200},
  core_features:{type:'array',maxItems:10,items:{type:'string',maxLength:260}},
  main_flow:{type:'array',maxItems:8,items:{type:'string',maxLength:260}},
  differentiators:{type:'array',maxItems:6,items:{type:'string',maxLength:280}},
  open_questions:{type:'array',maxItems:8,items:{type:'string',maxLength:300}},
  short_pitch:{type:'string',maxLength:700}
},required:['one_liner','problem','target_users','solution','core_features','main_flow','differentiators','open_questions','short_pitch']}}
function parseAi(raw){let payload=raw?.response??raw;if(typeof payload==='string'){try{payload=JSON.parse(payload)}catch{throw new Lab2BriefError(502,'AI_OUTPUT_INVALID')}}if(!payload||typeof payload!=='object'||Array.isArray(payload))throw new Lab2BriefError(502,'AI_OUTPUT_INVALID');return payload}
function readUsage(raw){const u=raw?.usage||raw?.meta?.usage||raw?.result?.usage||null;const input=Number(u?.prompt_tokens??u?.input_tokens??0),output=Number(u?.completion_tokens??u?.output_tokens??0);if(!Number.isFinite(input)||!Number.isFinite(output)||(!input&&!output))return null;return {prompt_tokens:Math.round(input),completion_tokens:Math.round(output),total_tokens:Math.round(input+output)}}
function normalizeBrief(payload){return {
  one_liner:cleanText(payload?.one_liner,320),problem:cleanText(payload?.problem,900),
  target_users:safeArray(payload?.target_users).slice(0,4).map(x=>cleanText(x,180)).filter(Boolean),
  solution:cleanText(payload?.solution,1200),core_features:safeArray(payload?.core_features).slice(0,10).map(x=>cleanText(x,260)).filter(Boolean),
  main_flow:safeArray(payload?.main_flow).slice(0,8).map(x=>cleanText(x,260)).filter(Boolean),
  differentiators:safeArray(payload?.differentiators).slice(0,6).map(x=>cleanText(x,280)).filter(Boolean),
  open_questions:safeArray(payload?.open_questions).slice(0,8).map(x=>cleanText(x,300)).filter(Boolean),short_pitch:cleanText(payload?.short_pitch,700)
}}

export async function handleLab2IdeaBrief(request,env){
  if(!enabled(env?.LAB2_IDEA_STUDIO_ENABLED)||!enabled(env?.LAB2_BRIEF_ENABLED))return json({ok:false,error:'LAB_BRIEF_DISABLED'},404);
  if(request.method!=='POST')return json({ok:false,error:'METHOD_NOT_ALLOWED'},405);
  if(Number(request.headers.get('content-length')||0)>MAX_BODY_BYTES)return json({ok:false,error:'INVALID_REQUEST'},400);
  if(!env?.AI)return json({ok:false,error:'AI_UNAVAILABLE'},503);
  const allowlist=allowedUserIds(env);if(!allowlist)return json({ok:false,error:'LAB_ACCESS_UNCONFIGURED'},503);
  const auth=await authenticate(env,request);if(!auth)return json({ok:false,error:'UNAUTHORIZED'},401);
  if(!allowlist.has(auth.id.toLowerCase()))return json({ok:false,error:'LAB_ACCESS_DENIED'},403);
  let body;try{body=await request.json()}catch{return json({ok:false,error:'INVALID_REQUEST'},400)}
  let input;try{input=normalizeInput(body)}catch(error){return json({ok:false,error:error.code||'INVALID_REQUEST'},error.status||400)}

  const appliedText=input.applied.length?input.applied.map((x,i)=>`${i+1}. [${x.decision}] ${x.title||x.type}: ${x.text}`).join('\n'):'Aucune amélioration ajoutée.';
  let raw;
  try{
    raw=await env.AI.run(LAB2_MODEL,{messages:[
      {role:'system',content:'Tu rédiges la version claire et fidèle d’une idée de site/web-app pour des utilisateurs novices. Tu ne dois introduire AUCUNE nouvelle fonctionnalité, cible, promesse ou différenciation qui ne soit déjà contenue dans l’idée comprise ou dans les améliorations explicitement acceptées/modifiées. Les propositions refusées ont déjà été supprimées en amont et ne doivent jamais être reconstituées. Les incertitudes doivent rester des questions ouvertes, pas être résolues par invention. Rédige en français simple, concret, présentable à un ami. core_features doit contenir uniquement des capacités réellement présentes dans le contexte. differentiators doit rester vide si aucune différence claire n’est établie. Réponds strictement selon le schéma JSON.'},
      {role:'user',content:`Nom provisoire: ${input.name}\n\nExplication originale:\n${input.original_description}\n\nCompréhension validée:\n- Résumé: ${input.understanding.one_liner}\n- Problème: ${input.understanding.problem}\n- Utilisateurs: ${input.understanding.target_users.join(', ')||'non précisés'}\n- Workflow: ${input.understanding.main_flow.join(' > ')||'non précisé'}\n- Points explicites: ${input.understanding.explicit_points.join(' | ')||'aucun'}\n- Incertitudes: ${input.understanding.uncertainties.join(' | ')||'aucune'}\n\nAméliorations explicitement retenues par l’utilisateur:\n${appliedText}`}
    ],response_format:{type:'json_schema',json_schema:schema()},temperature:0,max_completion_tokens:1800,chat_template_kwargs:{enable_thinking:false}});
  }catch(error){const msg=String(error?.message||error||'');return json({ok:false,error:/quota|limit|capacity|neuron|rate/i.test(msg)?'AI_CAPACITY':'AI_ERROR'},/quota|limit|capacity|neuron|rate/i.test(msg)?429:502)}
  let payload;try{payload=parseAi(raw)}catch(error){return json({ok:false,error:error.code||'AI_OUTPUT_INVALID'},error.status||502)}
  const brief=normalizeBrief(payload);
  if(!brief.one_liner||!brief.problem||!brief.solution||!brief.short_pitch)return json({ok:false,error:'AI_OUTPUT_INVALID'},502);
  return json({ok:true,contract_version:CONTRACT_VERSION,model:LAB2_MODEL,user_id:auth.id,version:1,brief,retained_improvements:input.applied,references:input.references,usage:readUsage(raw),guarantees:{rejected_proposals_excluded_from_model_prompt:true,no_new_features_allowed:true,versioned_source_for_next_slices:true,automatic_project_mutation:false}});
}

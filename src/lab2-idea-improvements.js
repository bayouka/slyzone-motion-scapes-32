const LAB2_MODEL='@cf/google/gemma-4-26b-a4b-it';
const CONTRACT_VERSION='lab2-improvements-v3';
const UNDERSTANDING_CONTRACT='lab2-understanding-v4';
const RESEARCH_CONTRACT='lab2-research-v3';
const MAX_BODY_BYTES=32000;
const MIN_PROPOSALS=3;
const MAX_PROPOSALS=6;
const TYPES=['FUNCTIONALITY','WORKFLOW','NAVIGATION','TRUST','SIMPLIFICATION','DIFFERENTIATION','CONTENT','CONVERSION','FEASIBILITY'];

class Lab2ImproveError extends Error{constructor(status,code){super(code);this.status=status;this.code=code}}
function json(data,status=200){return Response.json(data,{status,headers:{'cache-control':'no-store','content-type':'application/json; charset=utf-8'}})}
function enabled(value){return value===true||['1','true','on','yes'].includes(String(value||'').toLowerCase())}
function safeArray(value){return Array.isArray(value)?value:[]}
function cleanText(value,max=1000){return String(value??'').trim().replace(/\s+/g,' ').slice(0,max)}
function allowedUserIds(env){const raw=String(env?.LAB2_ALLOWED_USER_IDS||'').trim();if(!raw)return null;const ids=new Set(raw.split(',').map(v=>v.trim().toLowerCase()).filter(Boolean));return ids.size?ids:null}
async function authenticate(env,request){const header=request.headers.get('authorization')||'';if(!header.startsWith('Bearer '))return null;const token=header.slice(7).trim();if(!token||!env.SUPABASE_URL||!env.SUPABASE_PUBLISHABLE_KEY)return null;const response=await fetch(`${env.SUPABASE_URL}/auth/v1/user`,{headers:{apikey:env.SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${token}`}});if(!response.ok)return null;const user=await response.json().catch(()=>null);return user?.id?{id:String(user.id)}:null}
function normalizeProfile(value){const p=value&&typeof value==='object'?value:{};return {surface:cleanText(p.surface,30),model:cleanText(p.model,30),interaction:cleanText(p.interaction,40),account:cleanText(p.account,30),transaction:cleanText(p.transaction,30),multi_actor:p.multi_actor===true,confidence:cleanText(p.confidence,20)}}
function normalizeInput(body){
  if(!body||typeof body!=='object'||Array.isArray(body))throw new Lab2ImproveError(400,'INVALID_REQUEST');
  const name=cleanText(body.name,100),original_description=cleanText(body.original_description,6000),raw=body.understanding;
  const understanding=raw&&typeof raw==='object'?{
    contract_version:cleanText(raw.contract_version,60),one_liner:cleanText(raw.one_liner,320),problem:cleanText(raw.problem,900),project_profile:normalizeProfile(raw.project_profile),
    target_users:safeArray(raw.target_users).slice(0,4).map(x=>cleanText(x?.label||x,180)).filter(Boolean),
    main_flow:safeArray(raw.main_flow).slice(0,7).map(x=>cleanText(x?.step||x,240)).filter(Boolean),explicit_points:safeArray(raw.explicit_points).slice(0,8).map(x=>cleanText(x,260)).filter(Boolean),
    open_decisions:safeArray(raw.open_decisions).slice(0,10).map(x=>({question:cleanText(x?.question,320),scope:cleanText(x?.scope,30),blocking:x?.blocking===true,reason:cleanText(x?.reason,320)})).filter(x=>x.question)
  }:null;
  if(!name||understanding?.contract_version!==UNDERSTANDING_CONTRACT||!understanding.one_liner||!understanding.problem||!understanding.target_users.length||understanding.main_flow.length<2)throw new Lab2ImproveError(400,'UNDERSTANDING_REQUIRED');
  const r=body.research&&typeof body.research==='object'?body.research:{};
  const research={
    contract_version:cleanText(r.contract_version,60),quality:r.quality&&typeof r.quality==='object'?r.quality:{},research_plan:r.research_plan&&typeof r.research_plan==='object'?r.research_plan:{},
    references:safeArray(r.references).slice(0,3),solutions:safeArray(r.solutions?.length?r.solutions:r.competitors).slice(0,3),cross_patterns:safeArray(r.cross_patterns).slice(0,6),limitations:safeArray(r.limitations).slice(0,8)
  };
  if(research.contract_version&&research.contract_version!==RESEARCH_CONTRACT)throw new Lab2ImproveError(400,'RESEARCH_INCOMPATIBLE');
  return {name,original_description,understanding,research};
}
function schema(){return {type:'object',additionalProperties:false,properties:{proposals:{type:'array',minItems:MIN_PROPOSALS,maxItems:MAX_PROPOSALS,items:{type:'object',additionalProperties:false,properties:{title:{type:'string',minLength:6,maxLength:140},type:{type:'string',enum:TYPES},proposal:{type:'string',minLength:24,maxLength:420},why:{type:'string',minLength:24,maxLength:420},priority:{type:'string',enum:['CORE','USEFUL','OPTIONAL']},source_basis:{type:'string',enum:['USER_IDEA','OBSERVED_PATTERN','PRODUCT_REASONING']},evidence_note:{anyOf:[{type:'null'},{type:'string',maxLength:320}]},changes_original_idea:{type:'boolean'}},required:['title','type','proposal','why','priority','source_basis','evidence_note','changes_original_idea']}}},required:['proposals']}}
function parseAi(raw){let payload=raw?.response??raw;if(typeof payload==='string'){try{payload=JSON.parse(payload)}catch{throw new Lab2ImproveError(502,'AI_OUTPUT_INVALID')}}if(!payload||typeof payload!=='object'||Array.isArray(payload))throw new Lab2ImproveError(502,'AI_OUTPUT_INVALID');return payload}
function readUsage(raw){const u=raw?.usage||raw?.meta?.usage||raw?.result?.usage||null;const input=Number(u?.prompt_tokens??u?.input_tokens??0),output=Number(u?.completion_tokens??u?.output_tokens??0);if(!Number.isFinite(input)||!Number.isFinite(output)||(!input&&!output))return null;return {prompt_tokens:Math.round(input),completion_tokens:Math.round(output),total_tokens:Math.round(input+output)}}
function observedSources(research){return [...research.references,...research.solutions].filter(source=>source?.fetch_status==='OBSERVED_PUBLIC'&&safeArray(source?.findings).length)}
function hasObservedEvidence(research){return observedSources(research).some(source=>safeArray(source.findings).some(f=>cleanText(f?.statement,20)))}
function researchText(research){const items=[];for(const source of observedSources(research)){for(const finding of safeArray(source.findings))items.push(`- ${cleanText(finding?.statement,320)} [${cleanText(finding?.category,40)}]`)}const patterns=research.cross_patterns.map(p=>`- ${cleanText(p?.statement||p,340)}`);return `Qualité: ${cleanText(research.quality?.level,30)||'UNAVAILABLE'}\nPlan: ${cleanText(research.research_plan?.objective,500)||'non disponible'}\nFaits publics validés:\n${items.join('\n')||'Aucun'}\nSynthèses:\n${patterns.join('\n')||'Aucune'}\nLimites:\n${research.limitations.map(x=>`- ${cleanText(x,320)}`).join('\n')||'Aucune'}`}
function openDecisionText(understanding){return understanding.open_decisions.map(item=>`- [${item.scope}${item.blocking?' / bloquant':''}] ${item.question}`).join('\n')||'Aucune'}

export async function handleLab2IdeaImprovements(request,env){
  if(!enabled(env?.LAB2_IDEA_STUDIO_ENABLED)||!enabled(env?.LAB2_IMPROVEMENTS_ENABLED))return json({ok:false,error:'LAB_IMPROVEMENTS_DISABLED'},404);
  if(request.method!=='POST')return json({ok:false,error:'METHOD_NOT_ALLOWED'},405);
  if(Number(request.headers.get('content-length')||0)>MAX_BODY_BYTES)return json({ok:false,error:'INVALID_REQUEST'},400);
  if(!env?.AI)return json({ok:false,error:'AI_UNAVAILABLE'},503);
  const allowlist=allowedUserIds(env);if(!allowlist)return json({ok:false,error:'LAB_ACCESS_UNCONFIGURED'},503);
  const auth=await authenticate(env,request);if(!auth)return json({ok:false,error:'UNAUTHORIZED'},401);if(!allowlist.has(auth.id.toLowerCase()))return json({ok:false,error:'LAB_ACCESS_DENIED'},403);
  let body;try{body=await request.json()}catch{return json({ok:false,error:'INVALID_REQUEST'},400)}
  let input;try{input=normalizeInput(body)}catch(error){return json({ok:false,error:error.code||'INVALID_REQUEST'},error.status||400)}
  const observedEvidence=hasObservedEvidence(input.research);
  let raw;
  try{raw=await env.AI.run(LAB2_MODEL,{messages:[
    {role:'system',content:`Tu es un facilitateur produit pour un utilisateur novice. L'idée est comprise et éventuellement recherchée. Propose ENTRE ${MIN_PROPOSALS} ET ${MAX_PROPOSALS} améliorations indépendantes réellement utiles.\n- Rien n'est ajouté automatiquement : l'humain acceptera, modifiera ou refusera chaque proposition.\n- Adapte le raisonnement au project_profile : un site de service, un SaaS, une marketplace ou un outil interne n'ont pas les mêmes attentes.\n- Privilégie clarté du besoin, parcours, confiance, simplification, conversion et capacités réellement utiles. N'empile pas des fonctionnalités.\n- Respecte les décisions ouvertes : une question de STRUCTURE/FEASIBILITY/DESIGN ne doit pas être résolue silencieusement par une proposition présentée comme acquise. Tu peux proposer une option, mais changes_original_idea=true si elle ajoute une capacité significative.\n- USER_IDEA = formalisation directe de ce qui est déjà exprimé. PRODUCT_REASONING = recommandation issue du raisonnement produit. OBSERVED_PATTERN uniquement si un fait public vérifié fourni ci-dessous l'étaye.\n- Si la recherche est absente/partielle, continue avec USER_IDEA et PRODUCT_REASONING sans inventer de pratiques concurrentes.\n- Ne copie aucun texte, design ou implémentation d'une source.\n- Évite les formulations vagues. Chaque proposition explique quoi changer et pourquoi cela aide précisément CE projet.\n- Réponds strictement selon le schéma JSON.`},
    {role:'user',content:`Projet: ${input.name}\nExplication originale: ${input.original_description||'non fournie'}\nProfil: ${JSON.stringify(input.understanding.project_profile)}\nIdée comprise: ${input.understanding.one_liner}\nBesoin: ${input.understanding.problem}\nUtilisateurs: ${input.understanding.target_users.join(', ')}\nParcours: ${input.understanding.main_flow.join(' > ')}\nPoints explicites: ${input.understanding.explicit_points.join(' | ')||'aucun'}\nDécisions ouvertes:\n${openDecisionText(input.understanding)}\n\n${researchText(input.research)}`}
  ],response_format:{type:'json_schema',json_schema:schema()},temperature:0.25,max_completion_tokens:2100,chat_template_kwargs:{enable_thinking:false}})}catch(error){const msg=String(error?.message||error||'');return json({ok:false,error:/quota|limit|capacity|neuron|rate/i.test(msg)?'AI_CAPACITY':'AI_ERROR'},/quota|limit|capacity|neuron|rate/i.test(msg)?429:502)}
  let payload;try{payload=parseAi(raw)}catch(error){return json({ok:false,error:error.code||'AI_OUTPUT_INVALID'},error.status||502)}
  const proposals=safeArray(payload.proposals).slice(0,MAX_PROPOSALS).map((p,index)=>{let sourceBasis=['USER_IDEA','OBSERVED_PATTERN','PRODUCT_REASONING'].includes(p?.source_basis)?p.source_basis:'PRODUCT_REASONING',evidenceNote=p?.evidence_note?cleanText(p.evidence_note,320):null;if(sourceBasis==='OBSERVED_PATTERN'&&!observedEvidence){sourceBasis='PRODUCT_REASONING';evidenceNote=null}return {id:`p${index+1}`,title:cleanText(p?.title,140),type:TYPES.includes(p?.type)?p.type:'FUNCTIONALITY',proposal:cleanText(p?.proposal,420),why:cleanText(p?.why,420),priority:['CORE','USEFUL','OPTIONAL'].includes(p?.priority)?p.priority:'USEFUL',source_basis:sourceBasis,evidence_note:evidenceNote,changes_original_idea:p?.changes_original_idea===true}}).filter(p=>p.title.length>=6&&p.proposal.length>=24&&p.why.length>=24);
  if(proposals.length<MIN_PROPOSALS)return json({ok:false,error:'AI_OUTPUT_INCOMPLETE',received_proposals:proposals.length,required_proposals:MIN_PROPOSALS},502);
  return json({ok:true,contract_version:CONTRACT_VERSION,model:LAB2_MODEL,user_id:auth.id,proposals,usage:readUsage(raw),quality:{usable:true,proposal_count:proposals.length,minimum_required:MIN_PROPOSALS,observed_evidence_available:observedEvidence,adaptive_profile_used:true},guarantees:{min_proposals:MIN_PROPOSALS,max_proposals:MAX_PROPOSALS,human_decision_required:true,automatic_idea_mutation:false,observed_basis_requires_public_evidence:true,empty_output_is_not_success:true,open_decisions_not_silently_resolved:true}});
}

const LAB2_MODEL='@cf/google/gemma-4-26b-a4b-it';
const CONTRACT_VERSION='lab2-structure-v2';
const DEFINITION_CONTRACT='lab2-definition-v1';
const MAX_BODY_BYTES=26000;
const MAX_WORKFLOWS=4;
const MAX_PAGES=20;
const PAGE_KINDS=['PUBLIC','AUTH','APP','SETTINGS','ADMIN','UTILITY'];

class Lab2StructureError extends Error{constructor(status,code){super(code);this.status=status;this.code=code}}
function json(data,status=200){return Response.json(data,{status,headers:{'cache-control':'no-store','content-type':'application/json; charset=utf-8'}})}
function enabled(v){return v===true||['1','true','on','yes'].includes(String(v||'').toLowerCase())}
function safeArray(v){return Array.isArray(v)?v:[]}
function cleanText(v,max=1000){return String(v??'').trim().replace(/\s+/g,' ').slice(0,max)}
function allowedUserIds(env){const raw=String(env?.LAB2_ALLOWED_USER_IDS||'').trim();if(!raw)return null;const ids=new Set(raw.split(',').map(v=>v.trim().toLowerCase()).filter(Boolean));return ids.size?ids:null}
async function authenticate(env,request){const h=request.headers.get('authorization')||'';if(!h.startsWith('Bearer '))return null;const token=h.slice(7).trim();if(!token||!env.SUPABASE_URL||!env.SUPABASE_PUBLISHABLE_KEY)return null;const r=await fetch(`${env.SUPABASE_URL}/auth/v1/user`,{headers:{apikey:env.SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${token}`}});if(!r.ok)return null;const u=await r.json().catch(()=>null);return u?.id?{id:String(u.id)}:null}
function normalizeDefinition(v){
  if(!v||typeof v!=='object')return null;
  const brief=v.brief&&typeof v.brief==='object'?v.brief:{};
  return {
    project_name:cleanText(v.project_name,100),project_profile:v.project_profile&&typeof v.project_profile==='object'?v.project_profile:{},
    brief:{one_liner:cleanText(brief.one_liner,320),problem:cleanText(brief.problem,900),target_users:safeArray(brief.target_users).slice(0,4).map(x=>cleanText(x,180)).filter(Boolean),solution:cleanText(brief.solution,1200),core_features:safeArray(brief.core_features).slice(0,10).map(x=>cleanText(x,260)).filter(Boolean),main_flow:safeArray(brief.main_flow).slice(0,8).map(x=>cleanText(x,260)).filter(Boolean),differentiators:safeArray(brief.differentiators).slice(0,6).map(x=>cleanText(x,280)).filter(Boolean)},
    open_decisions:safeArray(v.open_decisions).slice(0,10).map(x=>({question:cleanText(x?.question,320),scope:cleanText(x?.scope,30),blocking:x?.blocking===true,reason:cleanText(x?.reason,320)})).filter(x=>x.question)
  };
}
function normalizeInput(body){if(!body||typeof body!=='object'||Array.isArray(body))throw new Lab2StructureError(400,'INVALID_REQUEST');if(cleanText(body.definition_contract,60)!==DEFINITION_CONTRACT)throw new Lab2StructureError(400,'DEFINITION_INCOMPATIBLE');const definition=normalizeDefinition(body.definition);if(!definition?.project_name||!definition?.brief?.one_liner||!definition?.brief?.problem||!definition?.brief?.solution)throw new Lab2StructureError(400,'DEFINITION_REQUIRED');return {definition}}
function schema(){return {type:'object',additionalProperties:false,properties:{workflows:{type:'array',maxItems:MAX_WORKFLOWS,items:{type:'object',additionalProperties:false,properties:{name:{type:'string',maxLength:120},actor:{type:'string',maxLength:140},goal:{type:'string',maxLength:260},steps:{type:'array',maxItems:8,items:{type:'string',maxLength:240}}},required:['name','actor','goal','steps']}},sitemap:{type:'array',maxItems:MAX_PAGES,items:{type:'object',additionalProperties:false,properties:{path:{type:'string',maxLength:120},label:{type:'string',maxLength:100},kind:{type:'string',enum:PAGE_KINDS},purpose:{type:'string',maxLength:300},primary_action:{anyOf:[{type:'null'},{type:'string',maxLength:160}]},workflow_indices:{type:'array',maxItems:MAX_WORKFLOWS,items:{type:'integer',minimum:0,maximum:MAX_WORKFLOWS-1}}},required:['path','label','kind','purpose','primary_action','workflow_indices']}},public_navigation:{type:'array',maxItems:7,items:{type:'string',maxLength:100}},app_navigation:{type:'array',maxItems:8,items:{type:'string',maxLength:100}},structural_questions:{type:'array',maxItems:8,items:{type:'string',maxLength:300}}},required:['workflows','sitemap','public_navigation','app_navigation','structural_questions']}}
function parseAi(raw){let p=raw?.response??raw;if(typeof p==='string'){try{p=JSON.parse(p)}catch{throw new Lab2StructureError(502,'AI_OUTPUT_INVALID')}}if(!p||typeof p!=='object'||Array.isArray(p))throw new Lab2StructureError(502,'AI_OUTPUT_INVALID');return p}
function normalizePath(v){let p=cleanText(v,120);if(!p)return '';if(!p.startsWith('/'))p=`/${p}`;return p.replace(/\s+/g,'-').replace(/\/+/g,'/')}
function normalizeOutput(payload){
  const workflows=safeArray(payload.workflows).slice(0,MAX_WORKFLOWS).map(x=>({name:cleanText(x?.name,120),actor:cleanText(x?.actor,140),goal:cleanText(x?.goal,260),steps:safeArray(x?.steps).slice(0,8).map(s=>cleanText(s,240)).filter(Boolean)})).filter(x=>x.name&&x.goal&&x.steps.length);
  const sitemap=[],seen=new Set();
  for(const x of safeArray(payload.sitemap).slice(0,MAX_PAGES)){const path=normalizePath(x?.path);if(!path||seen.has(path))continue;seen.add(path);sitemap.push({id:`page_${sitemap.length+1}`,path,label:cleanText(x?.label,100)||path,kind:PAGE_KINDS.includes(x?.kind)?x.kind:'PUBLIC',purpose:cleanText(x?.purpose,300),primary_action:x?.primary_action?cleanText(x.primary_action,160):null,workflow_indices:[...new Set(safeArray(x?.workflow_indices).map(Number).filter(i=>Number.isInteger(i)&&i>=0&&i<workflows.length))]})}
  return {workflows,sitemap,public_navigation:safeArray(payload.public_navigation).slice(0,7).map(x=>cleanText(x,100)).filter(Boolean),app_navigation:safeArray(payload.app_navigation).slice(0,8).map(x=>cleanText(x,100)).filter(Boolean),structural_questions:safeArray(payload.structural_questions).slice(0,8).map(x=>cleanText(x,300)).filter(Boolean)};
}
function usage(raw){const u=raw?.usage||raw?.meta?.usage||raw?.result?.usage||null;const i=Number(u?.prompt_tokens??u?.input_tokens??0),o=Number(u?.completion_tokens??u?.output_tokens??0);if(!Number.isFinite(i)||!Number.isFinite(o)||(!i&&!o))return null;return {prompt_tokens:Math.round(i),completion_tokens:Math.round(o),total_tokens:Math.round(i+o)}}

export async function handleLab2IdeaStructure(request,env){
  if(!enabled(env?.LAB2_IDEA_STUDIO_ENABLED)||!enabled(env?.LAB2_STRUCTURE_ENABLED))return json({ok:false,error:'LAB_STRUCTURE_DISABLED'},404);
  if(request.method!=='POST')return json({ok:false,error:'METHOD_NOT_ALLOWED'},405);
  if(Number(request.headers.get('content-length')||0)>MAX_BODY_BYTES)return json({ok:false,error:'INVALID_REQUEST'},400);
  if(!env?.AI)return json({ok:false,error:'AI_UNAVAILABLE'},503);
  const allowlist=allowedUserIds(env);if(!allowlist)return json({ok:false,error:'LAB_ACCESS_UNCONFIGURED'},503);
  const auth=await authenticate(env,request);if(!auth)return json({ok:false,error:'UNAUTHORIZED'},401);if(!allowlist.has(auth.id.toLowerCase()))return json({ok:false,error:'LAB_ACCESS_DENIED'},403);
  let body;try{body=await request.json()}catch{return json({ok:false,error:'INVALID_REQUEST'},400)}let input;try{input=normalizeInput(body)}catch(e){return json({ok:false,error:e.code||'INVALID_REQUEST'},e.status||400)}
  const d=input.definition,b=d.brief,structural=d.open_decisions.filter(x=>x.scope==='STRUCTURE');
  let raw;try{raw=await env.AI.run(LAB2_MODEL,{messages:[
    {role:'system',content:'Tu transformes une définition canonique déjà validée en EXPERIENCE ARCHITECTURE provisoire. Tu n’inventes aucune nouvelle capacité métier. Tu adaptes l’architecture au project_profile : un site de service peut n’avoir que PUBLIC/UTILITY ; un SaaS peut avoir AUTH/APP/SETTINGS ; une marketplace peut avoir plusieurs parcours acteurs ; ADMIN uniquement si le contexte l’exige réellement. Une page ou écran n’existe que s’il a un rôle distinct. Le nombre minimal cohérent est préférable. Les décisions STRUCTURE non résolues sont fournies : ne les tranche pas silencieusement ; place-les dans structural_questions si elles conditionnent encore l’architecture. Les workflows utilisent des verbes simples et décrivent les parcours humains essentiels. Réponds strictement selon le schéma JSON.'},
    {role:'user',content:`Projet: ${d.project_name}\nProfil: ${JSON.stringify(d.project_profile)}\nConcept: ${b.one_liner}\nProblème: ${b.problem}\nPublics: ${b.target_users.join(', ')||'non précisés'}\nSolution: ${b.solution}\nCapacités validées: ${b.core_features.join(' | ')||'aucune capacité supplémentaire'}\nParcours validé: ${b.main_flow.join(' > ')}\nDifférenciation validée: ${b.differentiators.join(' | ')||'aucune'}\nDécisions STRUCTURE ouvertes: ${structural.map(x=>x.question).join(' | ')||'aucune'}`}
  ],response_format:{type:'json_schema',json_schema:schema()},temperature:0.1,max_completion_tokens:2400,chat_template_kwargs:{enable_thinking:false}})}catch(e){const m=String(e?.message||e||'');return json({ok:false,error:/quota|limit|capacity|neuron|rate/i.test(m)?'AI_CAPACITY':'AI_ERROR'},/quota|limit|capacity|neuron|rate/i.test(m)?429:502)}
  let payload;try{payload=parseAi(raw)}catch(e){return json({ok:false,error:e.code||'AI_OUTPUT_INVALID'},e.status||502)}const structure=normalizeOutput(payload);if(!structure.workflows.length||!structure.sitemap.length)return json({ok:false,error:'AI_OUTPUT_INVALID'},502);
  return json({ok:true,contract_version:CONTRACT_VERSION,model:LAB2_MODEL,user_id:auth.id,structure,usage:usage(raw),quality:{adaptive_profile_used:true,page_kind_count:PAGE_KINDS.length},guarantees:{single_ai_call:true,experience_architecture:true,provisional_sitemap:true,no_new_features_allowed:true,human_page_review_required:true,structural_decisions_not_silently_resolved:true,max_pages:MAX_PAGES}});
}

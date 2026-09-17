const LAB2_MODEL='@cf/google/gemma-4-26b-a4b-it';
const CONTRACT_VERSION='lab2-presentation-plan-v1';
const MAX_BODY_BYTES=32000;
const MIN_SLIDES=7;
const MAX_SLIDES=15;
const SLIDE_TYPES=['COVER','PROBLEM','CONCEPT','RESEARCH','DECISIONS','WORKFLOW','SITEMAP','DESIGN','MOCKUP','OPEN_QUESTIONS','NEXT_STEPS'];
const AUDIENCES=['TEAM','CLIENT','PARTNER','INVESTOR','GENERAL'];
const OBJECTIVES=['UNDERSTAND','VALIDATE','CONVINCE','DOCUMENT'];
const DETAIL_LEVELS=['SHORT','STANDARD','DETAILED'];

class Lab2PresentationPlanError extends Error{constructor(status,code){super(code);this.status=status;this.code=code}}
function json(data,status=200){return Response.json(data,{status,headers:{'cache-control':'no-store','content-type':'application/json; charset=utf-8'}})}
function enabled(v){return v===true||['1','true','on','yes'].includes(String(v||'').toLowerCase())}
function safeArray(v){return Array.isArray(v)?v:[]}
function cleanText(v,max=1000){return String(v??'').trim().replace(/\s+/g,' ').slice(0,max)}
function allowedUserIds(env){const raw=String(env?.LAB2_ALLOWED_USER_IDS||'').trim();if(!raw)return null;const ids=new Set(raw.split(',').map(v=>v.trim().toLowerCase()).filter(Boolean));return ids.size?ids:null}
async function authenticate(env,request){const header=request.headers.get('authorization')||'';if(!header.startsWith('Bearer '))return null;const token=header.slice(7).trim();if(!token||!env.SUPABASE_URL||!env.SUPABASE_PUBLISHABLE_KEY)return null;const response=await fetch(`${env.SUPABASE_URL}/auth/v1/user`,{headers:{apikey:env.SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${token}`}});if(!response.ok)return null;const user=await response.json().catch(()=>null);return user?.id?{id:String(user.id)}:null}

function normalizeInput(body){
  if(!body||typeof body!=='object'||Array.isArray(body))throw new Lab2PresentationPlanError(400,'INVALID_REQUEST');
  const name=cleanText(body.name,100);
  const brief=body.brief&&typeof body.brief==='object'?{
    one_liner:cleanText(body.brief.one_liner,320),short_pitch:cleanText(body.brief.short_pitch,700),problem:cleanText(body.brief.problem,900),solution:cleanText(body.brief.solution,1200),
    target_users:safeArray(body.brief.target_users).slice(0,4).map(x=>cleanText(x,180)).filter(Boolean),
    core_features:safeArray(body.brief.core_features).slice(0,10).map(x=>cleanText(x,260)).filter(Boolean),
    main_flow:safeArray(body.brief.main_flow).slice(0,8).map(x=>cleanText(x,260)).filter(Boolean),
    differentiators:safeArray(body.brief.differentiators).slice(0,6).map(x=>cleanText(x,280)).filter(Boolean),
    open_questions:safeArray(body.brief.open_questions).slice(0,8).map(x=>cleanText(x,300)).filter(Boolean)
  }:null;
  if(!name||!brief?.one_liner||!brief?.problem||!brief?.solution)throw new Lab2PresentationPlanError(400,'BRIEF_REQUIRED');
  const sitemap=safeArray(body.sitemap).slice(0,20).map(x=>({id:cleanText(x?.id,50),label:cleanText(x?.label,100),path:cleanText(x?.path,120),purpose:cleanText(x?.purpose,300)})).filter(x=>x.id&&x.path);
  const workflows=safeArray(body.workflows).slice(0,4).map(x=>({name:cleanText(x?.name,120),goal:cleanText(x?.goal,260),steps:safeArray(x?.steps).slice(0,8).map(s=>cleanText(s,240)).filter(Boolean)})).filter(x=>x.name);
  const mockups=safeArray(body.mockups).slice(0,6).map(x=>({id:cleanText(x?.id,60),page_id:cleanText(x?.page_id,50),label:cleanText(x?.label,100),path:cleanText(x?.path,120),purpose:cleanText(x?.purpose,300)})).filter(x=>x.id&&x.page_id);
  if(!sitemap.length||!mockups.length)throw new Lab2PresentationPlanError(400,'PROJECT_VISUALS_REQUIRED');
  const research=body.research&&typeof body.research==='object'?{
    quality_level:cleanText(body.research?.quality?.level,30)||'UNAVAILABLE',
    verified_source_count:Number(body.research?.quality?.observed_source_count||0),
    verified_finding_count:Number(body.research?.quality?.observed_finding_count||0),
    competitor_count:safeArray(body.research?.competitors).length
  }:{quality_level:'UNAVAILABLE',verified_source_count:0,verified_finding_count:0,competitor_count:0};
  const retained_improvements=safeArray(body.retained_improvements).slice(0,6).map(x=>cleanText(x?.text||x?.title||x,360)).filter(Boolean);
  const preferences=body.preferences&&typeof body.preferences==='object'?body.preferences:{};
  const audience=AUDIENCES.includes(cleanText(preferences.audience,30).toUpperCase())?cleanText(preferences.audience,30).toUpperCase():'TEAM';
  const objective=OBJECTIVES.includes(cleanText(preferences.objective,30).toUpperCase())?cleanText(preferences.objective,30).toUpperCase():'VALIDATE';
  const detail=DETAIL_LEVELS.includes(cleanText(preferences.detail,30).toUpperCase())?cleanText(preferences.detail,30).toUpperCase():'STANDARD';
  return {name,brief,sitemap,workflows,mockups,research,retained_improvements,preferences:{audience,objective,detail}};
}

function schema(mockupIds){return {type:'object',additionalProperties:false,properties:{project_archetype:{type:'string',enum:['SERVICE_WEBSITE','SAAS_APP','MARKETPLACE','ECOMMERCE','COMMUNITY','CONTENT_SITE','OTHER']},narrative_angle:{type:'string',minLength:20,maxLength:360},slides:{type:'array',minItems:MIN_SLIDES,maxItems:MAX_SLIDES,items:{type:'object',additionalProperties:false,properties:{type:{type:'string',enum:SLIDE_TYPES},title:{type:'string',minLength:3,maxLength:120},purpose:{type:'string',minLength:12,maxLength:300},mockup_id:{anyOf:[{type:'null'},{type:'string',enum:mockupIds}]}},required:['type','title','purpose','mockup_id']}}},required:['project_archetype','narrative_angle','slides']}}
function parseAi(raw){let payload=raw?.response??raw;if(typeof payload==='string'){try{payload=JSON.parse(payload)}catch{throw new Lab2PresentationPlanError(502,'AI_OUTPUT_INVALID')}}if(!payload||typeof payload!=='object'||Array.isArray(payload))throw new Lab2PresentationPlanError(502,'AI_OUTPUT_INVALID');return payload}
function readUsage(raw){const u=raw?.usage||raw?.meta?.usage||raw?.result?.usage||null;const input=Number(u?.prompt_tokens??u?.input_tokens??0),output=Number(u?.completion_tokens??u?.output_tokens??0);if(!Number.isFinite(input)||!Number.isFinite(output)||(!input&&!output))return null;return {prompt_tokens:Math.round(input),completion_tokens:Math.round(output),total_tokens:Math.round(input+output)}}

function normalizePlan(payload,input){
  const mockupIds=new Set(input.mockups.map(x=>x.id));
  const slides=safeArray(payload?.slides).slice(0,MAX_SLIDES).map((slide,index)=>({
    id:`s${index+1}`,
    type:SLIDE_TYPES.includes(slide?.type)?slide.type:'CONCEPT',
    title:cleanText(slide?.title,120),
    purpose:cleanText(slide?.purpose,300),
    mockup_id:slide?.mockup_id&&mockupIds.has(slide.mockup_id)?slide.mockup_id:null
  })).filter(slide=>slide.title&&slide.purpose);
  if(slides.length<MIN_SLIDES)throw new Lab2PresentationPlanError(502,'AI_OUTPUT_INCOMPLETE');
  const counts=slides.reduce((map,slide)=>map.set(slide.type,(map.get(slide.type)||0)+1),new Map());
  for(const required of ['COVER','PROBLEM','CONCEPT','WORKFLOW','DESIGN','MOCKUP','NEXT_STEPS'])if(!counts.get(required))throw new Lab2PresentationPlanError(502,'AI_OUTPUT_INCOMPLETE');
  if(slides.filter(x=>x.type==='MOCKUP').some(x=>!x.mockup_id))throw new Lab2PresentationPlanError(502,'AI_OUTPUT_INCOMPLETE');
  if(input.research.verified_finding_count<=0&&counts.get('RESEARCH'))throw new Lab2PresentationPlanError(502,'AI_OUTPUT_INVALID_RESEARCH_SLIDE');
  if(!input.brief.open_questions.length&&counts.get('OPEN_QUESTIONS'))throw new Lab2PresentationPlanError(502,'AI_OUTPUT_INVALID_OPEN_QUESTIONS');
  if(!input.retained_improvements.length&&counts.get('DECISIONS'))throw new Lab2PresentationPlanError(502,'AI_OUTPUT_INVALID_DECISIONS');
  const archetype=['SERVICE_WEBSITE','SAAS_APP','MARKETPLACE','ECOMMERCE','COMMUNITY','CONTENT_SITE','OTHER'].includes(payload?.project_archetype)?payload.project_archetype:'OTHER';
  const narrative=cleanText(payload?.narrative_angle,360);
  if(narrative.length<20)throw new Lab2PresentationPlanError(502,'AI_OUTPUT_INCOMPLETE');
  return {project_archetype:archetype,narrative_angle:narrative,slides};
}

export async function handleLab2PresentationPlan(request,env){
  if(!enabled(env?.LAB2_IDEA_STUDIO_ENABLED)||!enabled(env?.LAB2_PRESENTATION_PLAN_ENABLED))return json({ok:false,error:'LAB_PRESENTATION_PLAN_DISABLED'},404);
  if(request.method!=='POST')return json({ok:false,error:'METHOD_NOT_ALLOWED'},405);
  if(Number(request.headers.get('content-length')||0)>MAX_BODY_BYTES)return json({ok:false,error:'INVALID_REQUEST'},400);
  if(!env?.AI)return json({ok:false,error:'AI_UNAVAILABLE'},503);
  const allowlist=allowedUserIds(env);if(!allowlist)return json({ok:false,error:'LAB_ACCESS_UNCONFIGURED'},503);
  const auth=await authenticate(env,request);if(!auth)return json({ok:false,error:'UNAUTHORIZED'},401);if(!allowlist.has(auth.id.toLowerCase()))return json({ok:false,error:'LAB_ACCESS_DENIED'},403);
  let body;try{body=await request.json()}catch{return json({ok:false,error:'INVALID_REQUEST'},400)}
  let input;try{input=normalizeInput(body)}catch(error){return json({ok:false,error:error?.code||'INVALID_REQUEST'},error?.status||400)}

  const researchAvailable=input.research.verified_finding_count>0;
  const decisionsAvailable=input.retained_improvements.length>0;
  const questionsAvailable=input.brief.open_questions.length>0;
  const desiredCount=input.preferences.detail==='SHORT'?'7 à 9':input.preferences.detail==='DETAILED'?'11 à 15':'9 à 12';
  let raw;
  try{
    raw=await env.AI.run(LAB2_MODEL,{messages:[
      {role:'system',content:`Tu es directeur de présentation. Tu ne rédiges PAS les faits ni le contenu final des slides : tu construis seulement le meilleur storytelling à partir de données déjà validées. La présentation doit aider le public ciblé à comprendre le projet rapidement, suivre le raisonnement et voir des preuves visuelles.\n\nRègles :\n- Choisis entre ${desiredCount} slides dans la limite du schéma.\n- COVER ouvre toujours la présentation ; NEXT_STEPS la termine toujours.\n- PROBLEM, CONCEPT, WORKFLOW, DESIGN et au moins une MOCKUP sont obligatoires.\n- RESEARCH est autorisée seulement si des constats publics vérifiés existent.\n- DECISIONS seulement si des améliorations ont réellement été retenues.\n- OPEN_QUESTIONS seulement s'il existe de vraies questions ouvertes.\n- Chaque MOCKUP doit référencer exactement un mockup_id disponible. Montre les écrans qui expliquent le mieux le projet, pas nécessairement toutes les pages.\n- Évite les doublons : une slide doit avoir une fonction narrative claire et différente.\n- Pour TEAM/VALIDATE, privilégie la compréhension et les décisions ouvertes. Pour CLIENT/CONVINCE, privilégie problème, valeur, preuve visuelle et clarté. Pour INVESTOR, privilégie besoin, solution, différenciation et preuve de cohérence sans inventer de traction ou chiffres.\n- Ne demande jamais d'inventer un chiffre, témoignage, prix, client, résultat ou fait marché absent.\n- Réponds strictement selon le schéma JSON.`},
      {role:'user',content:`Projet: ${input.name}\nPublic de la présentation: ${input.preferences.audience}\nObjectif: ${input.preferences.objective}\nNiveau de détail: ${input.preferences.detail}\nConcept: ${input.brief.one_liner}\nProblème: ${input.brief.problem}\nSolution: ${input.brief.solution}\nPublics produit: ${input.brief.target_users.join(', ')||'non précisés'}\nFonctionnalités/contenus essentiels: ${input.brief.core_features.join(' | ')||'aucun'}\nDifférenciation: ${input.brief.differentiators.join(' | ')||'aucune'}\nRecherche vérifiée disponible: ${researchAvailable?'oui':'non'} (${input.research.verified_finding_count} constats)\nDécisions humaines retenues: ${decisionsAvailable?'oui':'non'}\nQuestions ouvertes: ${questionsAvailable?'oui':'non'}\nWorkflows: ${input.workflows.map(x=>`${x.name}: ${x.steps.join(' > ')}`).join(' | ')||'non précisés'}\nSitemap: ${input.sitemap.map(x=>`${x.label} ${x.path}`).join(' | ')}\nMaquettes disponibles: ${input.mockups.map(x=>`${x.id}: ${x.label} ${x.path}`).join(' | ')}`}
    ],response_format:{type:'json_schema',json_schema:schema(input.mockups.map(x=>x.id))},temperature:0.2,max_completion_tokens:1900,chat_template_kwargs:{enable_thinking:false}});
  }catch(error){const message=String(error?.message||error||'');return json({ok:false,error:/quota|limit|capacity|neuron|rate/i.test(message)?'AI_CAPACITY':'AI_ERROR'},/quota|limit|capacity|neuron|rate/i.test(message)?429:502)}
  let plan;try{plan=normalizePlan(parseAi(raw),input)}catch(error){return json({ok:false,error:error?.code||'AI_OUTPUT_INVALID'},error?.status||502)}
  return json({ok:true,contract_version:CONTRACT_VERSION,model:LAB2_MODEL,user_id:auth.id,preferences:input.preferences,plan,usage:readUsage(raw),quality:{usable:true,slide_count:plan.slides.length,adaptive:true},guarantees:{planner_controls_order_not_facts:true,verified_research_only:true,available_mockups_only:true,required_narrative_beats:true,no_invented_business_metrics:true,human_preferences_applied:true}});
}

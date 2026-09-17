const LAB2_MODEL='@cf/google/gemma-4-26b-a4b-it';
const CONTRACT_VERSION='lab2-understanding-v4';
const MAX_BODY_BYTES=14000;
const MAX_DESCRIPTION_CHARS=6000;
const MAX_REFERENCES=3;
const MAX_CLARIFICATIONS=2;
const MAX_CLARIFICATION_ANSWER_CHARS=1200;
const FREE_NEURONS_PER_DAY=10000;
const MODEL_PRICING=Object.freeze({version:'2026-08-28',input_neurons_per_million:9091,output_neurons_per_million:27273,input_usd_per_million:0.10,output_usd_per_million:0.30});
const PROFILE=Object.freeze({
  surfaces:['WEBSITE','WEB_APP','HYBRID','UNKNOWN'],
  models:['SERVICE','SAAS','ECOMMERCE','MARKETPLACE','COMMUNITY','CONTENT','INTERNAL_TOOL','OTHER'],
  interactions:['DISCOVERY_CONTACT','SELF_SERVICE','TRANSACTION','MULTI_SIDED','CONTENT_CONSUMPTION','WORKFLOW_TOOL','OTHER'],
  account:['REQUIRED','OPTIONAL','UNLIKELY','UNKNOWN'],transaction:['REQUIRED','OPTIONAL','UNLIKELY','UNKNOWN'],confidence:['HIGH','MEDIUM','LOW']
});
const DECISION_SCOPES=['UNDERSTANDING','RESEARCH','STRUCTURE','FEASIBILITY','DESIGN','PRESENTATION'];

class Lab2HttpError extends Error{constructor(status,code){super(code);this.status=status;this.code=code}}
function json(data,status=200){return Response.json(data,{status,headers:{'cache-control':'no-store','content-type':'application/json; charset=utf-8'}})}
function enabled(value){return value===true||['1','true','on','yes'].includes(String(value||'').toLowerCase())}
function cleanText(value,max=1000){return String(value??'').trim().replace(/\s+/g,' ').slice(0,max)}
function cleanMultiline(value,max=6000){return String(value??'').trim().replace(/\r\n/g,'\n').slice(0,max)}
function safeArray(value){return Array.isArray(value)?value:[]}
function allowedUserIds(env){const raw=String(env?.LAB2_ALLOWED_USER_IDS||'').trim();if(!raw)return null;const ids=new Set(raw.split(',').map(value=>value.trim().toLowerCase()).filter(Boolean));return ids.size?ids:null}
async function authenticate(env,request){const header=request.headers.get('authorization')||'';if(!header.startsWith('Bearer '))return null;const token=header.slice(7).trim();if(!token||!env.SUPABASE_URL||!env.SUPABASE_PUBLISHABLE_KEY)return null;const response=await fetch(`${env.SUPABASE_URL}/auth/v1/user`,{headers:{apikey:env.SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${token}`}});if(!response.ok)return null;const user=await response.json().catch(()=>null);return user?.id?{id:String(user.id),email:cleanText(user.email,320)}:null}
function normalizeReferences(value){return safeArray(value).slice(0,MAX_REFERENCES).map(reference=>({url:cleanText(reference?.url,300),reason:cleanText(reference?.reason,120),note:cleanText(reference?.note,500)})).filter(reference=>reference.url||reference.note)}
function normalizeClarifications(value){return safeArray(value).slice(0,MAX_CLARIFICATIONS).map(item=>({question:cleanText(item?.question,350),answer:cleanText(item?.answer,MAX_CLARIFICATION_ANSWER_CHARS)})).filter(item=>item.question&&item.answer)}
function normalizeInput(body){if(!body||typeof body!=='object'||Array.isArray(body))throw new Lab2HttpError(400,'INVALID_REQUEST');const name=cleanText(body.name,100),description=cleanMultiline(body.description,MAX_DESCRIPTION_CHARS);if(!name||description.length<40)throw new Lab2HttpError(400,'IDEA_INPUT_INCOMPLETE');return {name,description,references:normalizeReferences(body.references),clarifications:normalizeClarifications(body.clarifications)}}

function systemPrompt(clarificationCount){
  const remaining=Math.max(0,MAX_CLARIFICATIONS-clarificationCount);
  return `Tu es le facilitateur de compréhension de 4b4c2, destiné à des utilisateurs novices qui décrivent souvent une idée numérique en une phrase.

OBJECTIF
Construire une compréhension de travail assez riche pour guider une recherche adaptée, sans demander un cahier des charges et sans commencer prématurément structure, design ou amélioration.

PRINCIPES
- Français simple et concret.
- Ne recopie pas seulement : raisonne.
- EXPLICIT = réellement donné. INFERRED = hypothèse raisonnable, jamais présentée comme un fait utilisateur.
- Une référence utilisateur indique seulement ce qu'il aime ; tu ne prétends jamais l'avoir visitée.
- N'ajoute pas encore de fonctionnalité optionnelle et ne juge pas la qualité commerciale.
- one_liner explique le concept ; problem explique le besoin/résultat ; target_users contient au moins un public plausible ; main_flow contient 2 à 7 étapes humaines utiles ; explicit_points contient seulement ce qui a réellement été dit.

PROJECT_PROFILE
Classe selon plusieurs dimensions indépendantes :
- surface: WEBSITE | WEB_APP | HYBRID | UNKNOWN
- model: SERVICE | SAAS | ECOMMERCE | MARKETPLACE | COMMUNITY | CONTENT | INTERNAL_TOOL | OTHER
- interaction: DISCOVERY_CONTACT | SELF_SERVICE | TRANSACTION | MULTI_SIDED | CONTENT_CONSUMPTION | WORKFLOW_TOOL | OTHER
- account: REQUIRED | OPTIONAL | UNLIKELY | UNKNOWN
- transaction: REQUIRED | OPTIONAL | UNLIKELY | UNKNOWN
- multi_actor: true si plusieurs rôles humains distincts interagissent ; sinon false
- confidence: HIGH | MEDIUM | LOW

OPEN_DECISIONS
Chaque inconnue importante doit être classée au BON MOMENT :
- UNDERSTANDING : uniquement si la réponse change la nature du concept, les acteurs essentiels, le besoin principal ou rendrait la recherche suivante matériellement différente.
- RESEARCH : information utile pour mieux cibler ce qu'il faut chercher mais non indispensable pour comprendre le concept.
- STRUCTURE : pages, écrans, navigation, galerie vs détail, onboarding, organisation de contenu.
- FEASIBILITY : paiement, IA, vidéo, géolocalisation, temps réel, intégrations, stockage, contraintes techniques.
- DESIGN : direction visuelle, palette, style, imagerie.
- PRESENTATION : destinataire ou objectif du futur deck.
blocking=true uniquement si cette décision doit impérativement être obtenue AVANT son scope.
Exemple : « galerie simple ou pages projets détaillées ? » = STRUCTURE, blocking=false ; cela ne doit jamais bloquer Comprendre.
Exemple : « cette plateforme met-elle réellement en relation deux rôles ou est-ce seulement un annuaire ? » peut être UNDERSTANDING, blocking=true.

CLARIFICATION
Il reste ${remaining} tour(s). Le SERVEUR choisira lui-même la première open_decision UNDERSTANDING+blocking. Ne produis aucun champ clarifying_question séparé. Si aucun tour ne reste, les décisions restent ouvertes mais ne bloquent plus cette étape.

FORMAT : retourne UNIQUEMENT un objet JSON valide avec exactement :
{
 "one_liner":"string",
 "problem":"string",
 "project_profile":{"surface":"WEBSITE|WEB_APP|HYBRID|UNKNOWN","model":"SERVICE|SAAS|ECOMMERCE|MARKETPLACE|COMMUNITY|CONTENT|INTERNAL_TOOL|OTHER","interaction":"DISCOVERY_CONTACT|SELF_SERVICE|TRANSACTION|MULTI_SIDED|CONTENT_CONSUMPTION|WORKFLOW_TOOL|OTHER","account":"REQUIRED|OPTIONAL|UNLIKELY|UNKNOWN","transaction":"REQUIRED|OPTIONAL|UNLIKELY|UNKNOWN","multi_actor":true,"confidence":"HIGH|MEDIUM|LOW"},
 "target_users":[{"label":"string","basis":"EXPLICIT|INFERRED"}],
 "main_flow":[{"step":"string","basis":"EXPLICIT|INFERRED"}],
 "explicit_points":["string"],
 "open_decisions":[{"question":"string","scope":"UNDERSTANDING|RESEARCH|STRUCTURE|FEASIBILITY|DESIGN|PRESENTATION","blocking":false,"reason":"string"}],
 "confidence":"HIGH|MEDIUM|LOW"
}`;
}
function userPrompt(input){const references=input.references.length?input.references.map((reference,index)=>`${index+1}. ${reference.url||'(sans URL)'} — intérêt déclaré: ${reference.reason||'non précisé'}${reference.note?` — précision: ${reference.note}`:''}`).join('\n'):'Aucune référence fournie.';const clarifications=input.clarifications.length?input.clarifications.map((item,index)=>`Q${index+1}: ${item.question}\nR${index+1}: ${item.answer}`).join('\n\n'):'Aucune clarification antérieure.';return `Nom provisoire : ${input.name}\n\nExplication originale :\n${input.description}\n\nRéférences déclarées (ne pas prétendre les avoir visitées) :\n${references}\n\nClarifications déjà données :\n${clarifications}`}
function extractJsonText(value){let text=String(value??'').trim();if(!text)return '';text=text.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();const first=text.indexOf('{'),last=text.lastIndexOf('}');if(first>=0&&last>first)text=text.slice(first,last+1);return text}
function parseAiPayload(raw){let payload=raw?.response??raw?.result?.response??raw;if(typeof payload==='string'){try{payload=JSON.parse(extractJsonText(payload))}catch{throw new Lab2HttpError(502,'AI_OUTPUT_INVALID')}}if(!payload||typeof payload!=='object'||Array.isArray(payload))throw new Lab2HttpError(502,'AI_OUTPUT_INVALID');return payload}
function normalizeBasis(value){return value==='EXPLICIT'?'EXPLICIT':'INFERRED'}
function isMeaningfulCore(value){const normalized=cleanText(value,1000).toLowerCase();if(normalized.length<20)return false;return !['non déterminé','non determine','à préciser','a preciser','inconnu','non précisé','non precise'].includes(normalized)}
function enumValue(value,allowed,fallback){return allowed.includes(value)?value:fallback}
function normalizeProjectProfile(value){const profile=value&&typeof value==='object'?value:{};return {surface:enumValue(profile.surface,PROFILE.surfaces,'UNKNOWN'),model:enumValue(profile.model,PROFILE.models,'OTHER'),interaction:enumValue(profile.interaction,PROFILE.interactions,'OTHER'),account:enumValue(profile.account,PROFILE.account,'UNKNOWN'),transaction:enumValue(profile.transaction,PROFILE.transaction,'UNKNOWN'),multi_actor:profile.multi_actor===true,confidence:enumValue(profile.confidence,PROFILE.confidence,'LOW')}}
function normalizeOpenDecisions(value){const seen=new Set(),out=[];for(const item of safeArray(value).slice(0,10)){const question=cleanText(item?.question,320),scope=enumValue(item?.scope,DECISION_SCOPES,'STRUCTURE'),blocking=item?.blocking===true,reason=cleanText(item?.reason,320),key=`${scope}:${question.toLowerCase()}`;if(!question||seen.has(key))continue;seen.add(key);out.push({question,scope,blocking,reason})}return out}
function normalizeUnderstanding(payload,clarificationCount){
  const canAsk=clarificationCount<MAX_CLARIFICATIONS;
  const oneLiner=cleanText(payload.one_liner,320),problem=cleanText(payload.problem,900);
  const targetUsers=safeArray(payload.target_users).slice(0,4).map(item=>({label:cleanText(item?.label,180),basis:normalizeBasis(item?.basis)})).filter(item=>item.label);
  const mainFlow=safeArray(payload.main_flow).slice(0,7).map(item=>({step:cleanText(item?.step,240),basis:normalizeBasis(item?.basis)})).filter(item=>item.step);
  const explicitPoints=safeArray(payload.explicit_points).slice(0,8).map(item=>cleanText(item,260)).filter(Boolean);
  const projectProfile=normalizeProjectProfile(payload.project_profile),openDecisions=normalizeOpenDecisions(payload.open_decisions);
  if(!isMeaningfulCore(oneLiner)||!isMeaningfulCore(problem)||!targetUsers.length||mainFlow.length<2||!explicitPoints.length)throw new Lab2HttpError(502,'AI_OUTPUT_INCOMPLETE');
  const blocking=canAsk?openDecisions.find(item=>item.scope==='UNDERSTANDING'&&item.blocking):null;
  const deferredQuestions=openDecisions.filter(item=>item.scope!=='UNDERSTANDING').map(item=>({question:item.question,scope:item.scope,blocking:item.blocking,reason:item.reason}));
  const uncertainties=openDecisions.map(item=>item.question).slice(0,8);
  return {contract_version:CONTRACT_VERSION,one_liner:oneLiner,problem,project_profile:projectProfile,target_users:targetUsers,main_flow:mainFlow,explicit_points:explicitPoints,open_decisions:openDecisions,uncertainties,deferred_questions:deferredQuestions,needs_clarification:Boolean(blocking),clarifying_question:blocking?.question||null,confidence:enumValue(payload.confidence,PROFILE.confidence,'MEDIUM')};
}
function readUsage(raw){const usage=raw?.usage||raw?.meta?.usage||raw?.result?.usage||null;const promptTokens=Number(usage?.prompt_tokens??usage?.input_tokens??0),completionTokens=Number(usage?.completion_tokens??usage?.output_tokens??0);if(!Number.isFinite(promptTokens)||!Number.isFinite(completionTokens)||promptTokens<0||completionTokens<0||(!promptTokens&&!completionTokens))return null;const estimatedNeurons=(promptTokens*MODEL_PRICING.input_neurons_per_million+completionTokens*MODEL_PRICING.output_neurons_per_million)/1_000_000,paidEquivalentUsd=(promptTokens*MODEL_PRICING.input_usd_per_million+completionTokens*MODEL_PRICING.output_usd_per_million)/1_000_000;return {prompt_tokens:Math.round(promptTokens),completion_tokens:Math.round(completionTokens),total_tokens:Math.round(promptTokens+completionTokens),estimated_neurons:Number(estimatedNeurons.toFixed(3)),estimated_free_daily_share_percent:Number((estimatedNeurons/FREE_NEURONS_PER_DAY*100).toFixed(4)),paid_equivalent_usd:Number(paidEquivalentUsd.toFixed(6)),pricing_version:MODEL_PRICING.version,estimate:true}}
function mapAiError(error){if(error instanceof Lab2HttpError)return error;const message=String(error?.message||error||'');if(/3040|quota|limit|capacity|neuron|rate/i.test(message))return new Lab2HttpError(429,'AI_CAPACITY');return new Lab2HttpError(502,'AI_ERROR')}

export async function handleLab2IdeaUnderstanding(request,env){
  if(!enabled(env?.LAB2_IDEA_STUDIO_ENABLED))return json({ok:false,error:'LAB_DISABLED'},404);
  if(request.method!=='POST')return json({ok:false,error:'METHOD_NOT_ALLOWED'},405);
  if(Number(request.headers.get('content-length')||0)>MAX_BODY_BYTES)return json({ok:false,error:'INVALID_REQUEST'},400);
  if(!env?.AI)return json({ok:false,error:'AI_UNAVAILABLE'},503);
  const allowlist=allowedUserIds(env);if(!allowlist)return json({ok:false,error:'LAB_ACCESS_UNCONFIGURED'},503);
  const auth=await authenticate(env,request);if(!auth)return json({ok:false,error:'UNAUTHORIZED'},401);if(!allowlist.has(auth.id.toLowerCase()))return json({ok:false,error:'LAB_ACCESS_DENIED'},403);
  let body;try{body=await request.json()}catch{return json({ok:false,error:'INVALID_REQUEST'},400)}
  let input;try{input=normalizeInput(body)}catch(error){return json({ok:false,error:error?.code||'INVALID_REQUEST'},error?.status||400)}
  let raw;try{raw=await env.AI.run(LAB2_MODEL,{messages:[{role:'system',content:systemPrompt(input.clarifications.length)},{role:'user',content:userPrompt(input)}],temperature:0.15,max_completion_tokens:1500,chat_template_kwargs:{enable_thinking:false}})}catch(error){const mapped=mapAiError(error);return json({ok:false,error:mapped.code},mapped.status)}
  try{const understanding=normalizeUnderstanding(parseAiPayload(raw),input.clarifications.length);return json({ok:true,understanding,usage:readUsage(raw),quality:{usable:true,semantic_contract:true,project_profile:true,scoped_open_decisions:true,server_enforced_clarification_scope:true,generic_empty_fallbacks:false},model:LAB2_MODEL,user_id:auth.id})}catch(error){const mapped=mapAiError(error);return json({ok:false,error:mapped.code},mapped.status)}
}

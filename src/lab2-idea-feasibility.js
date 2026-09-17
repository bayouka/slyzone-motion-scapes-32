const CONTRACT_VERSION='lab2-feasibility-v1';
const DEFINITION_CONTRACT='lab2-definition-v1';
const MAX_BODY_BYTES=30000;

class Lab2FeasibilityError extends Error{constructor(status,code){super(code);this.status=status;this.code=code}}
function json(data,status=200){return Response.json(data,{status,headers:{'cache-control':'no-store','content-type':'application/json; charset=utf-8'}})}
function enabled(value){return value===true||['1','true','on','yes'].includes(String(value||'').toLowerCase())}
function clean(value,max=1000){return String(value??'').trim().replace(/\s+/g,' ').slice(0,max)}
function safeArray(value){return Array.isArray(value)?value:[]}
function allowedUserIds(env){const raw=String(env?.LAB2_ALLOWED_USER_IDS||'').trim();if(!raw)return null;const ids=new Set(raw.split(',').map(v=>v.trim().toLowerCase()).filter(Boolean));return ids.size?ids:null}
async function authenticate(env,request){const h=request.headers.get('authorization')||'';if(!h.startsWith('Bearer '))return null;const token=h.slice(7).trim();if(!token||!env.SUPABASE_URL||!env.SUPABASE_PUBLISHABLE_KEY)return null;const r=await fetch(`${env.SUPABASE_URL}/auth/v1/user`,{headers:{apikey:env.SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${token}`}});if(!r.ok)return null;const u=await r.json().catch(()=>null);return u?.id?{id:String(u.id)}:null}

const RULES=Object.freeze([
  {id:'AUTH',rx:/\b(compte|connexion|inscription|login|register|authentification|membre|profil utilisateur)\b/i,profile:p=>p.account==='REQUIRED',complexity:'MEDIUM',external:false,label:'Comptes et authentification'},
  {id:'PAYMENTS',rx:/\b(paiement|payer|checkout|abonnement|subscription|facturation|commande)\b/i,profile:p=>p.transaction==='REQUIRED',complexity:'HIGH',external:true,label:'Paiement en ligne'},
  {id:'FILE_STORAGE',rx:/\b(upload|télévers|fichier|document|photo|image|vidéo|pièce jointe|stockage)\b/i,complexity:'MEDIUM',external:true,label:'Fichiers et stockage'},
  {id:'REALTIME',rx:/\b(temps réel|realtime|chat|messagerie|message instantané|présence|live)\b/i,complexity:'HIGH',external:true,label:'Temps réel / messagerie'},
  {id:'VIDEO',rx:/\b(visio|visioconférence|appel vidéo|appel audio|partage d'écran|webcam)\b/i,complexity:'HIGH',external:true,label:'Audio / vidéo / partage d’écran'},
  {id:'AI',rx:/\b(\bia\b|intelligence artificielle|assistant ai|assistant intelligent|llm|générative)\b/i,complexity:'HIGH',external:true,label:'Intelligence artificielle'},
  {id:'MAPS',rx:/\b(gps|géolocal|carte|maps|itinéraire|position)\b/i,complexity:'MEDIUM',external:true,label:'Cartes / géolocalisation'},
  {id:'SEARCH',rx:/\b(recherche|moteur de recherche|search|filtre|résultats)\b/i,complexity:'MEDIUM',external:false,label:'Recherche et filtrage'},
  {id:'BOOKING',rx:/\b(rendez-vous|réservation|booking|créneau|agenda)\b/i,complexity:'MEDIUM',external:true,label:'Réservation / rendez-vous'},
  {id:'NOTIFICATIONS',rx:/\b(notification|rappel|push|alerte|email automatique)\b/i,complexity:'MEDIUM',external:true,label:'Notifications / rappels'},
  {id:'EXTERNAL_INTEGRATION',rx:/\b(api|intégration|connecteur|stripe|google|slack|github|crm|webhook)\b/i,complexity:'MEDIUM',external:true,label:'Intégrations externes'},
  {id:'MULTI_SIDED',rx:/\b(marketplace|mise en relation|vendeur|acheteur|prestataire|client|deux côtés|multi-acteur)\b/i,profile:p=>p.multi_actor===true||p.interaction==='MULTI_SIDED',complexity:'HIGH',external:false,label:'Logique multi-acteurs'}
]);

function normalizeDefinition(value){
  if(!value||typeof value!=='object')return null;
  const brief=value.brief&&typeof value.brief==='object'?value.brief:{};
  return {
    project_name:clean(value.project_name,100),project_profile:value.project_profile&&typeof value.project_profile==='object'?value.project_profile:{},
    brief:{one_liner:clean(brief.one_liner,320),problem:clean(brief.problem,900),solution:clean(brief.solution,1200),core_features:safeArray(brief.core_features).map(x=>clean(x,700)).filter(Boolean),main_flow:safeArray(brief.main_flow).map(x=>clean(x,700)).filter(Boolean)},
    retained_improvements:safeArray(value.retained_improvements),open_decisions:safeArray(value.open_decisions),feasibility_notes:safeArray(value.feasibility_notes).map(x=>clean(x,700)).filter(Boolean)
  };
}
function normalizeInput(body){if(!body||typeof body!=='object'||Array.isArray(body))throw new Lab2FeasibilityError(400,'INVALID_REQUEST');if(clean(body.definition_contract,60)!==DEFINITION_CONTRACT)throw new Lab2FeasibilityError(400,'DEFINITION_INCOMPATIBLE');const definition=normalizeDefinition(body.definition);if(!definition?.project_name||!definition.brief.one_liner)throw new Lab2FeasibilityError(400,'DEFINITION_REQUIRED');return definition}
function combinedText(definition){return [definition.brief.one_liner,definition.brief.problem,definition.brief.solution,...definition.brief.core_features,...definition.brief.main_flow,...definition.retained_improvements.map(x=>clean(x?.text,700)),...definition.feasibility_notes].join(' ')}
function rationale(rule){return ({AUTH:'Des comptes impliquent gestion de session, sécurité et récupération d’accès.',PAYMENTS:'Le paiement ajoute un fournisseur externe, des webhooks et des contraintes de sécurité.',FILE_STORAGE:'Les fichiers impliquent stockage, quotas, permissions et suppression.',REALTIME:'Le temps réel implique connexions persistantes, présence et gestion des états concurrents.',VIDEO:'Audio/vidéo et partage d’écran nécessitent une infrastructure WebRTC ou un fournisseur dédié.',AI:'Une fonction IA implique modèle, quotas, coûts, garde-fous et gestion des erreurs.',MAPS:'La géolocalisation et les cartes dépendent généralement d’un fournisseur externe et de permissions.',SEARCH:'Une recherche utile nécessite indexation, filtres et stratégie de pertinence.',BOOKING:'Les créneaux exigent disponibilité, concurrence de réservation et notifications.',NOTIFICATIONS:'Les notifications impliquent canaux, consentement et délivrabilité.',EXTERNAL_INTEGRATION:'Les intégrations externes nécessitent authentification, quotas et gestion des pannes.',MULTI_SIDED:'Plusieurs rôles impliquent permissions, workflows distincts et règles de confiance.'}[rule.id]||'Cette capacité doit être cadrée techniquement avant l’implémentation.')}
function build(definition){
  const text=combinedText(definition),profile=definition.project_profile||{},capabilities=[];
  for(const rule of RULES){const matched=Boolean(rule.rx?.test(text)||rule.profile?.(profile));if(!matched)continue;capabilities.push({id:rule.id,label:rule.label,complexity:rule.complexity,external_dependency:rule.external,mvp:'CONDITIONAL',rationale:rationale(rule)})}
  const feasibilityDecisions=definition.open_decisions.filter(x=>clean(x?.scope,30)==='FEASIBILITY').map(x=>({question:clean(x?.question,320),blocking:x?.blocking===true,reason:clean(x?.reason,320)})).filter(x=>x.question);
  const high=capabilities.filter(x=>x.complexity==='HIGH').length;
  const level=high>=3?'HIGH':high>=1||capabilities.length>=4?'MEDIUM':'LOW';
  const simple=capabilities.length===0&&feasibilityDecisions.length===0;
  return {level,simple,capabilities,open_decisions:feasibilityDecisions,summary:simple?'Aucune dépendance technique complexe n’est nécessaire pour structurer ce projet à ce stade.':`${capabilities.length} capacité(s) technique(s) à prendre en compte avant ou pendant la conception.`,requires_human_input:feasibilityDecisions.some(x=>x.blocking)};
}

export async function handleLab2IdeaFeasibility(request,env){
  if(!enabled(env?.LAB2_IDEA_STUDIO_ENABLED))return json({ok:false,error:'LAB_DISABLED'},404);
  if(request.method!=='POST')return json({ok:false,error:'METHOD_NOT_ALLOWED'},405);
  if(Number(request.headers.get('content-length')||0)>MAX_BODY_BYTES)return json({ok:false,error:'INVALID_REQUEST'},400);
  const allowlist=allowedUserIds(env);if(!allowlist)return json({ok:false,error:'LAB_ACCESS_UNCONFIGURED'},503);
  const auth=await authenticate(env,request);if(!auth)return json({ok:false,error:'UNAUTHORIZED'},401);if(!allowlist.has(auth.id.toLowerCase()))return json({ok:false,error:'LAB_ACCESS_DENIED'},403);
  let body;try{body=await request.json()}catch{return json({ok:false,error:'INVALID_REQUEST'},400)}
  let definition;try{definition=normalizeInput(body)}catch(error){return json({ok:false,error:error.code||'INVALID_REQUEST'},error.status||400)}
  const feasibility=build(definition);
  return json({ok:true,contract_version:CONTRACT_VERSION,user_id:auth.id,feasibility,usage:null,guarantees:{deterministic:true,ai_calls:0,adaptive:true,no_external_service_calls:true,blocking_questions_preserved:true}});
}

const {handleLab2IdeaImprovements}=await import(new URL('../src/lab2-idea-improvements.js',import.meta.url).href+`?t=${Date.now()}`);
const originalFetch=globalThis.fetch;
globalThis.fetch=async(url,options={})=>{
  if(String(url).includes('/auth/v1/user')){
    const auth=options.headers?.Authorization||options.headers?.authorization||'';
    if(auth==='Bearer good-token')return Response.json({id:'11111111-1111-4111-8111-111111111111'});
    if(auth==='Bearer other-token')return Response.json({id:'22222222-2222-4222-8222-222222222222'});
    return new Response('{}',{status:401});
  }
  throw new Error('unexpected fetch');
};
let aiCalls=0,emptyMode=false,capturedPrompt='';
const aiPayload=()=>({response:{proposals:emptyMode?[]:[
  {title:'Rapport structuré',type:'FUNCTIONALITY',proposal:'Prévoir un rapport simple et standardisé après chaque vérification réalisée.',why:'Les faits publics observés montrent qu’un retour structuré aide à rendre le service compréhensible.',priority:'CORE',source_basis:'OBSERVED_PATTERN',evidence_note:'Une source publique mentionne un rapport ou compte rendu.',changes_original_idea:false},
  {title:'Clarifier le résultat utilisateur',type:'WORKFLOW',proposal:'Faire du retour de vérification le résultat principal du parcours acheteur.',why:'Le profil marketplace nécessite que les deux rôles comprennent précisément le résultat attendu sans ajouter un parcours secondaire.',priority:'CORE',source_basis:'PRODUCT_REASONING',evidence_note:null,changes_original_idea:false},
  {title:'Limiter le premier périmètre',type:'SIMPLIFICATION',proposal:'Commencer avec un seul scénario de vérification avant d’ajouter des variantes.',why:'Cette limitation teste le besoin central sans résoudre prématurément les questions de paiement ou de structure encore ouvertes.',priority:'CORE',source_basis:'PRODUCT_REASONING',evidence_note:null,changes_original_idea:false}
]},usage:{prompt_tokens:900,completion_tokens:420}});
const env={LAB2_IDEA_STUDIO_ENABLED:'true',LAB2_IMPROVEMENTS_ENABLED:'true',LAB2_ALLOWED_USER_IDS:'11111111-1111-4111-8111-111111111111',SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'pub',AI:{run:async(_model,options)=>{aiCalls+=1;capturedPrompt=String(options?.messages?.[1]?.content||'');return aiPayload()}}};
const understanding={
  contract_version:'lab2-understanding-v4',one_liner:'Une marketplace pour faire vérifier une voiture éloignée avant de se déplacer.',problem:'Éviter un déplacement inutile grâce à une vérification locale.',
  project_profile:{surface:'WEB_APP',model:'MARKETPLACE',interaction:'MULTI_SIDED',account:'REQUIRED',transaction:'UNKNOWN',multi_actor:true,confidence:'HIGH'},
  target_users:[{label:'Acheteurs à distance'}],main_flow:[{step:'Demander une vérification'},{step:'Recevoir un compte rendu'}],explicit_points:['Vérification avant déplacement'],
  open_decisions:[{question:'La vérification est-elle rémunérée ?',scope:'FEASIBILITY',blocking:false,reason:'Impact technique et modèle.'}]
};
const observedResearch={contract_version:'lab2-research-v3',quality:{level:'FULL'},research_plan:{objective:'Comparer plateformes multi-acteurs.'},references:[{fetch_status:'OBSERVED_PUBLIC',findings:[{statement:'Un rapport est fourni.',category:'WORKFLOW'}]}],solutions:[],cross_patterns:[{statement:'Les services observés structurent le retour.'}],limitations:[]};
const body={name:'TierceVue',original_description:'Faire vérifier une voiture éloignée avant de se déplacer.',understanding,research:observedResearch};
function request(payload=body,token='good-token'){return new Request('https://app.example/api/lab2/improvements',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify(payload)})}

const response=await handleLab2IdeaImprovements(request(),env),result=await response.json();
if(response.status!==200||!result.ok)throw new Error('LAB2_IMPROVEMENTS_SUCCESS_EXPECTED');
if(result.contract_version!=='lab2-improvements-v3')throw new Error('LAB2_IMPROVEMENTS_V3_REQUIRED');
if(result.proposals?.length!==3)throw new Error('LAB2_IMPROVEMENTS_PROPOSALS_MISMATCH');
if(result.proposals?.[0]?.source_basis!=='OBSERVED_PATTERN')throw new Error('LAB2_OBSERVED_EVIDENCE_LOST');
if(!capturedPrompt.includes('"model":"MARKETPLACE"')||!capturedPrompt.includes('[FEASIBILITY]'))throw new Error('LAB2_ADAPTIVE_CONTEXT_MISSING');
if(result.quality?.adaptive_profile_used!==true||result.guarantees?.open_decisions_not_silently_resolved!==true)throw new Error('LAB2_IMPROVEMENTS_GUARDS_MISSING');

const limited={...body,research:{contract_version:'lab2-research-v3',quality:{level:'UNAVAILABLE'},references:[{fetch_status:'FETCH_FAILED',findings:[]}],solutions:[],cross_patterns:[],limitations:['Pas de fait observé.']}};
const limitedResponse=await handleLab2IdeaImprovements(request(limited),env),limitedResult=await limitedResponse.json();
if(limitedResponse.status!==200||!limitedResult.ok)throw new Error('LAB2_LIMITED_RESEARCH_MUST_STILL_WORK');
if(limitedResult.proposals?.[0]?.source_basis!=='PRODUCT_REASONING'||limitedResult.proposals?.[0]?.evidence_note!==null)throw new Error('LAB2_FALSE_OBSERVED_BASIS_NOT_DOWNGRADED');

emptyMode=true;const emptyResponse=await handleLab2IdeaImprovements(request(limited),env),empty=await emptyResponse.json();
if(emptyResponse.status!==502||empty.error!=='AI_OUTPUT_INCOMPLETE')throw new Error('LAB2_EMPTY_IMPROVEMENTS_MUST_FAIL');
emptyMode=false;
const incompatible=await handleLab2IdeaImprovements(request({...body,research:{...observedResearch,contract_version:'lab2-research-v2'}}),env);if(incompatible.status!==400)throw new Error('LAB2_STALE_RESEARCH_MUST_FAIL');
const forbidden=await handleLab2IdeaImprovements(request(body,'other-token'),env);if(forbidden.status!==403)throw new Error('LAB2_ALLOWLIST_GUARD_FAILED');
if(aiCalls!==3)throw new Error('LAB2_AI_CALL_COUNT_MISMATCH');
globalThis.fetch=originalFetch;
console.log(`lab2-improvements-v3: ok (${aiCalls} mocked AI calls; adaptive profile + open-decision guards)`);

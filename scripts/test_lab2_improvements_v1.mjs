import fs from 'node:fs/promises';
const source=await fs.readFile(new URL('../src/lab2-idea-improvements.js',import.meta.url),'utf8');
const moduleUrl=`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const {handleLab2IdeaImprovements}=await import(moduleUrl);
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

let aiCalls=0;
let emptyMode=false;
const aiPayload=()=>({response:{proposals:emptyMode?[]:[
  {title:'Rapport structuré',type:'FUNCTIONALITY',proposal:'Prévoir un rapport simple et standardisé après chaque vérification réalisée.',why:'Les faits publics observés montrent qu’un retour structuré aide à rendre le service compréhensible.',priority:'CORE',source_basis:'OBSERVED_PATTERN',evidence_note:'Une source publique mentionne un rapport ou compte rendu.',changes_original_idea:false},
  {title:'Clarifier l’action principale',type:'CONVERSION',proposal:'Définir clairement l’action principale attendue à la fin du parcours utilisateur.',why:'Un objectif principal explicite évite de construire plusieurs parcours concurrents dès le premier MVP.',priority:'CORE',source_basis:'PRODUCT_REASONING',evidence_note:null,changes_original_idea:false},
  {title:'Limiter le premier MVP',type:'SIMPLIFICATION',proposal:'Commencer par un seul type de vérification avant d’ajouter des options secondaires.',why:'Cette limitation permet de tester le besoin réel sans augmenter inutilement la complexité du premier produit.',priority:'CORE',source_basis:'PRODUCT_REASONING',evidence_note:null,changes_original_idea:false}
]},usage:{prompt_tokens:900,completion_tokens:420}});

const env={
  LAB2_IDEA_STUDIO_ENABLED:'true',LAB2_IMPROVEMENTS_ENABLED:'true',LAB2_ALLOWED_USER_IDS:'11111111-1111-4111-8111-111111111111',
  SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'pub',
  AI:{run:async()=>{aiCalls+=1;return aiPayload()}}
};
const understanding={
  contract_version:'lab2-understanding-v2',one_liner:'Un site pour faire vérifier une voiture éloignée avant de se déplacer.',
  problem:'Éviter un déplacement inutile pour une voiture qui ne correspond pas aux attentes.',
  target_users:[{label:'Acheteurs à distance'}],main_flow:[{step:'Repérer un véhicule'},{step:'Demander une vérification'}],
  explicit_points:['Vérification avant déplacement'],uncertainties:[]
};
const observedResearch={contract_version:'lab2-research-v2',quality:{level:'FULL'},references:[{fetch_status:'OBSERVED_PUBLIC',findings:[{statement:'Un rapport est fourni.',category:'WORKFLOW'}]}],competitors:[],cross_patterns:[{statement:'Les services observés structurent le retour.'}],limitations:[]};
const body={name:'TierceVue',original_description:'Faire vérifier une voiture éloignée avant de se déplacer.',understanding,research:observedResearch};
function request(payload=body,token='good-token'){return new Request('https://app.example/api/lab2/improvements',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify(payload)})}

const response=await handleLab2IdeaImprovements(request(),env);const result=await response.json();
if(response.status!==200||result.ok!==true)throw new Error('LAB2_IMPROVEMENTS_SUCCESS_EXPECTED');
if(result.contract_version!=='lab2-improvements-v2')throw new Error('LAB2_IMPROVEMENTS_CONTRACT_MISMATCH');
if(result.proposals?.length!==3)throw new Error('LAB2_IMPROVEMENTS_PROPOSALS_MISMATCH');
if(result.proposals?.[0]?.source_basis!=='OBSERVED_PATTERN')throw new Error('LAB2_IMPROVEMENTS_OBSERVED_EVIDENCE_LOST');
if(result.quality?.usable!==true||result.guarantees?.empty_output_is_not_success!==true)throw new Error('LAB2_IMPROVEMENTS_QUALITY_GUARD_MISSING');

const limitedBody={...body,research:{contract_version:'lab2-research-v2',quality:{level:'UNAVAILABLE'},references:[{fetch_status:'UNVERIFIED',findings:[]}],competitors:[],cross_patterns:[],limitations:['Recherche Web non configurée.']}};
const limitedResponse=await handleLab2IdeaImprovements(request(limitedBody),env);const limited=await limitedResponse.json();
if(limitedResponse.status!==200||limited.ok!==true)throw new Error('LAB2_IMPROVEMENTS_LIMITED_SUCCESS_EXPECTED');
if(limited.proposals?.[0]?.source_basis!=='PRODUCT_REASONING')throw new Error('LAB2_IMPROVEMENTS_FALSE_OBSERVED_BASIS_NOT_DOWNGRADED');
if(limited.proposals?.[0]?.evidence_note!==null)throw new Error('LAB2_IMPROVEMENTS_FALSE_EVIDENCE_NOTE_NOT_CLEARED');

emptyMode=true;
const emptyResponse=await handleLab2IdeaImprovements(request(limitedBody),env);const empty=await emptyResponse.json();
if(emptyResponse.status!==502||empty.error!=='AI_OUTPUT_INCOMPLETE')throw new Error('LAB2_IMPROVEMENTS_EMPTY_OUTPUT_MUST_FAIL');
emptyMode=false;

const disabled=await handleLab2IdeaImprovements(request(),{...env,LAB2_IMPROVEMENTS_ENABLED:'false'});if(disabled.status!==404)throw new Error('LAB2_IMPROVEMENTS_FLAG_GUARD_FAILED');
const forbidden=await handleLab2IdeaImprovements(request(body,'other-token'),env);if(forbidden.status!==403)throw new Error('LAB2_IMPROVEMENTS_ALLOWLIST_GUARD_FAILED');
if(aiCalls!==3)throw new Error('LAB2_IMPROVEMENTS_MOCK_CALL_COUNT_MISMATCH');
globalThis.fetch=originalFetch;
console.log(`lab2-improvements-v2: ok (${aiCalls} mocked AI calls)`);

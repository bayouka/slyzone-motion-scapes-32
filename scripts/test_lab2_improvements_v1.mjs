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
const aiPayload=()=>({response:{proposals:[
  {title:'Rapport structuré',type:'FUNCTIONALITY',proposal:'Prévoir un rapport simple et standardisé après la vérification.',why:'Les sources publiques observées mettent en avant un retour structuré.',priority:'CORE',source_basis:'OBSERVED_PATTERN',evidence_note:'Plusieurs sources mentionnent un rapport ou compte rendu.',changes_original_idea:false},
  {title:'Limiter le premier MVP',type:'SIMPLIFICATION',proposal:'Commencer par un seul type de vérification avant d’ajouter des options.',why:'Cela réduit la complexité pour tester le besoin.',priority:'CORE',source_basis:'PRODUCT_REASONING',evidence_note:null,changes_original_idea:false}
]},usage:{prompt_tokens:900,completion_tokens:310}});
const env={
  LAB2_IDEA_STUDIO_ENABLED:'true',LAB2_IMPROVEMENTS_ENABLED:'true',LAB2_ALLOWED_USER_IDS:'11111111-1111-4111-8111-111111111111',
  SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'pub',
  AI:{run:async()=>{aiCalls+=1;return aiPayload()}}
};
const understanding={one_liner:'Un site pour faire vérifier une voiture éloignée avant de se déplacer.',problem:'Éviter un déplacement inutile.',target_users:[{label:'Acheteurs à distance'}],main_flow:[{step:'Repérer un véhicule'},{step:'Demander une vérification'}],explicit_points:['Vérification avant déplacement'],uncertainties:[]};
const observedResearch={references:[{fetch_status:'OBSERVED_PUBLIC',findings:[{statement:'Un rapport est fourni.',category:'WORKFLOW'}]}],competitors:[],cross_patterns:[{statement:'Les services observés structurent le retour.'}],limitations:[]};
const body={name:'TierceVue',understanding,research:observedResearch};
function request(payload=body,token='good-token'){return new Request('https://app.example/api/lab2/improvements',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify(payload)})}
const response=await handleLab2IdeaImprovements(request(),env);const result=await response.json();
if(response.status!==200||result.ok!==true)throw new Error('LAB2_IMPROVEMENTS_SUCCESS_EXPECTED');
if(result.contract_version!=='lab2-improvements-v1')throw new Error('LAB2_IMPROVEMENTS_CONTRACT_MISMATCH');
if(result.proposals?.length!==2)throw new Error('LAB2_IMPROVEMENTS_PROPOSALS_MISMATCH');
if(result.proposals?.[0]?.source_basis!=='OBSERVED_PATTERN')throw new Error('LAB2_IMPROVEMENTS_OBSERVED_EVIDENCE_LOST');
if(result.guarantees?.automatic_idea_mutation!==false)throw new Error('LAB2_IMPROVEMENTS_HUMAN_CONTROL_MISSING');
if(result.guarantees?.observed_basis_requires_public_evidence!==true)throw new Error('LAB2_IMPROVEMENTS_PROVENANCE_GUARD_MISSING');
if(aiCalls!==1)throw new Error('LAB2_IMPROVEMENTS_AI_CALL_BUDGET_MISMATCH');

const limitedBody={name:'TierceVue',understanding,research:{references:[{fetch_status:'UNVERIFIED',findings:[]}],competitors:[],cross_patterns:[],limitations:['Recherche Web non configurée.']}};
const limitedResponse=await handleLab2IdeaImprovements(request(limitedBody),env);const limited=await limitedResponse.json();
if(limitedResponse.status!==200||limited.ok!==true)throw new Error('LAB2_IMPROVEMENTS_LIMITED_SUCCESS_EXPECTED');
if(limited.proposals?.[0]?.source_basis!=='PRODUCT_REASONING')throw new Error('LAB2_IMPROVEMENTS_FALSE_OBSERVED_BASIS_NOT_DOWNGRADED');
if(limited.proposals?.[0]?.evidence_note!==null)throw new Error('LAB2_IMPROVEMENTS_FALSE_EVIDENCE_NOTE_NOT_CLEARED');

const disabled=await handleLab2IdeaImprovements(request(),{...env,LAB2_IMPROVEMENTS_ENABLED:'false'});if(disabled.status!==404)throw new Error('LAB2_IMPROVEMENTS_FLAG_GUARD_FAILED');
const forbidden=await handleLab2IdeaImprovements(request(body,'other-token'),env);if(forbidden.status!==403)throw new Error('LAB2_IMPROVEMENTS_ALLOWLIST_GUARD_FAILED');
if(aiCalls!==2)throw new Error('LAB2_IMPROVEMENTS_MOCK_CALL_COUNT_MISMATCH');
globalThis.fetch=originalFetch;
console.log(`lab2-improvements-v1: ok (${aiCalls} mocked AI calls)`);

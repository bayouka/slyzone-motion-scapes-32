const {handleLab2IdeaResearch}=await import(new URL('../src/lab2-idea-research.js',import.meta.url).href+`?t=${Date.now()}`);

const originalFetch=globalThis.fetch;
let braveCalls=0;
let tavilyCalls=0;
globalThis.fetch=async(url,options={})=>{
  const target=String(url);
  if(target.includes('/auth/v1/user')){
    const auth=options.headers?.Authorization||options.headers?.authorization||'';
    if(auth==='Bearer good-token')return Response.json({id:'11111111-1111-4111-8111-111111111111'});
    if(auth==='Bearer other-token')return Response.json({id:'22222222-2222-4222-8222-222222222222'});
    return new Response('{}',{status:401});
  }
  if(target.startsWith('https://api.search.brave.com/res/v1/web/search')){
    braveCalls+=1;
    return Response.json({web:{results:[
      {title:'AutoCheck Local',url:'https://autocheck.example/',description:'Service permettant de faire inspecter un véhicule à distance avant déplacement.'},
      {title:'CarProxy',url:'https://carproxy.example/',description:'Un tiers vérifie une voiture et transmet un compte rendu à l’acheteur.'},
      {title:'Article automobile',url:'https://www.youtube.com/watch?v=fake',description:'Vidéo générale sur les voitures.'}
    ]}});
  }
  if(target==='https://api.tavily.com/search'){
    tavilyCalls+=1;
    return Response.json({results:[{title:'Fallback competitor',url:'https://fallback.example/',content:'Solution proche du besoin.'}]});
  }
  if(target==='https://api.tavily.com/extract')return Response.json({results:[]});
  throw new Error(`unexpected fetch ${target}`);
};

let aiCalls=0;
const ai={run:async()=>{
  aiCalls+=1;
  if(aiCalls===1)return {
    response:{selected:[
      {candidate_index:0,relation:'DIRECT',reason:'Le service semble répondre au même besoin de vérification à distance.',confidence:'HIGH'},
      {candidate_index:1,relation:'NEAR',reason:'Le workflow de tiers et compte rendu paraît proche.',confidence:'MEDIUM'}
    ]},usage:{prompt_tokens:500,completion_tokens:120}
  };
  return {
    response:{
      sources:[
        {source_index:0,findings:[
          {category:'WORKFLOW',statement:'La référence permet de créer une demande puis de recevoir un rapport.',support_text:'crée une demande et reçoit un rapport'},
          {category:'FUNCTIONALITY',statement:'Ce constat doit être supprimé car il n’est pas sourcé.',support_text:'texte absent de la source'}
        ]},
        {source_index:1,findings:[{category:'POSITIONING',statement:'Le concurrent se présente comme une inspection avant déplacement.',support_text:'inspecter un véhicule à distance avant déplacement'}]},
        {source_index:2,findings:[{category:'WORKFLOW',statement:'Le tiers transmet un compte rendu.',support_text:'transmet un compte rendu à l’acheteur'}]}
      ],
      cross_patterns:[{statement:'Les solutions observées mettent en avant une vérification à distance suivie d’un retour structuré.',source_indices:[0,1,2]}],
      limitations:['Les pages publiques ne permettent pas de confirmer les étapes après connexion.']
    },usage:{prompt_tokens:1600,completion_tokens:430}
  };
}};

const sourceTexts=new Map([
  ['https://ref.example/','Le service met en relation les utilisateurs. L’utilisateur crée une demande et reçoit un rapport détaillé.'],
  ['https://autocheck.example/','AutoCheck aide à inspecter un véhicule à distance avant déplacement et fournit des informations publiques.'],
  ['https://carproxy.example/','CarProxy fait intervenir un tiers qui vérifie la voiture puis transmet un compte rendu à l’acheteur.']
]);
const sourceFetch={fetchEvidenceSource:async(locator)=>({final_url:locator,extracted_text:sourceTexts.get(locator)||'',content_hash:'a'.repeat(64),fetched_at:new Date().toISOString(),redirect_count:0})};

const env={
  LAB2_IDEA_STUDIO_ENABLED:'true',LAB2_RESEARCH_ENABLED:'true',LAB2_ALLOWED_USER_IDS:'11111111-1111-4111-8111-111111111111',
  LAB2_BRAVE_SEARCH_API_KEY:'test-key',SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'pub',AI:ai,SOURCE_FETCH:sourceFetch
};
const body={
  name:'TierceVue',
  understanding:{contract_version:'lab2-understanding-v2',one_liner:'Un site pour faire vérifier une voiture éloignée avant de se déplacer.',problem:'Éviter un déplacement inutile quand un véhicule est loin.',target_users:[{label:'Acheteurs de véhicules à distance'}],main_flow:[{step:'Repérer une voiture'},{step:'Demander une vérification'}],uncertainties:[]},
  references:[{url:'ref.example',reason:'fonctionnement',note:'J’aime la logique de demande et rapport.'}],discover_competitors:true
};
function request(payload=body,token='good-token'){return new Request('https://app.example/api/lab2/research',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify(payload)})}

const response=await handleLab2IdeaResearch(request(),env);const result=await response.json();
if(response.status!==200||result.ok!==true)throw new Error('LAB2_RESEARCH_SUCCESS_EXPECTED');
if(result.contract_version!=='lab2-research-v2')throw new Error('LAB2_RESEARCH_CONTRACT_MISMATCH');
if(result.discovery?.search_requests!==2||braveCalls!==2)throw new Error('LAB2_SEARCH_BUDGET_MISMATCH');
if(result.discovery?.providers?.[0]!=='BRAVE')throw new Error('LAB2_PRIMARY_SEARCH_PROVIDER_MISMATCH');
if(result.competitors?.length!==2)throw new Error('LAB2_COMPETITOR_SELECTION_MISMATCH');
if(result.references?.[0]?.findings?.length!==1)throw new Error('LAB2_OBSERVED_SUPPORT_VALIDATION_FAILED');
if(result.cross_patterns?.length!==1)throw new Error('LAB2_CROSS_PATTERN_EXPECTED');
if(result.source_fetch_count!==3||result.source_fetch_attempt_count!==3)throw new Error('LAB2_SOURCE_READ_METRIC_MISMATCH');
if(result.quality?.level!=='FULL'||result.quality?.observed_finding_count!==3)throw new Error('LAB2_RESEARCH_QUALITY_MISMATCH');
if(aiCalls!==2)throw new Error('LAB2_AI_CALL_BUDGET_MISMATCH');
if(tavilyCalls!==0)throw new Error('LAB2_TAVILY_SHOULD_NOT_RUN_WHEN_BRAVE_SUCCEEDS');

const disabled=await handleLab2IdeaResearch(request(),{...env,LAB2_RESEARCH_ENABLED:'false'});if(disabled.status!==404)throw new Error('LAB2_RESEARCH_FLAG_GUARD_FAILED');
const forbidden=await handleLab2IdeaResearch(request(body,'other-token'),env);if(forbidden.status!==403)throw new Error('LAB2_RESEARCH_ALLOWLIST_GUARD_FAILED');
const unconfigured=await handleLab2IdeaResearch(request(),{...env,LAB2_ALLOWED_USER_IDS:''});if(unconfigured.status!==503)throw new Error('LAB2_RESEARCH_ALLOWLIST_CONFIG_GUARD_FAILED');

globalThis.fetch=originalFetch;
console.log(`lab2-research-v2: ok (${braveCalls} bounded searches, ${aiCalls} mocked AI calls)`);

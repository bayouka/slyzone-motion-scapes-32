import fs from 'node:fs/promises';

const source=await fs.readFile(new URL('../src/lab2-idea-design.js',import.meta.url),'utf8');
const moduleUrl=`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const {handleLab2IdeaDesign}=await import(moduleUrl);

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
const env={
  LAB2_IDEA_STUDIO_ENABLED:'true',LAB2_DESIGN_ENABLED:'true',LAB2_ALLOWED_USER_IDS:'11111111-1111-4111-8111-111111111111',
  SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'pub',
  AI:{run:async()=>{aiCalls+=1;return {response:{directions:[
    {name:'Clair et rassurant',palette_id:'CYAN_MINT',typography_id:'INTER',shape_id:'SOFT',density_id:'AIRY',imagery:'PHOTO_HUMAN',motion:'CALM',perception:['rassurant','moderne'],rationale:'Une direction claire pour instaurer la confiance.',dos:['Hiérarchie simple'],donts:['Éviter la surcharge']},
    {name:'Premium sobre',palette_id:'GRAPHITE',typography_id:'MANROPE',shape_id:'CRISP',density_id:'BALANCED',imagery:'UI_FIRST',motion:'STANDARD',perception:['premium','professionnel'],rationale:'Une option plus sobre et structurée.',dos:['Utiliser des surfaces calmes'],donts:['Éviter les effets décoratifs']},
    {name:'Chaleureux',palette_id:'SAGE',typography_id:'SOURCE_SANS',shape_id:'ROUND',density_id:'AIRY',imagery:'ILLUSTRATION_LIGHT',motion:'CALM',perception:['chaleureux','accessible'],rationale:'Une option plus humaine et douce.',dos:['Conserver beaucoup d’espace'],donts:['Éviter les contrastes criards']}
  ]},usage:{prompt_tokens:800,completion_tokens:420}}}}
};

const body={name:'TierceVue',brief:{one_liner:'Faire vérifier un véhicule éloigné.',problem:'Éviter un déplacement inutile.',target_users:['Acheteurs éloignés'],solution:'Créer une demande confiée à un tiers puis recevoir un compte rendu.',core_features:['Créer une demande','Recevoir un compte rendu'],differentiators:[]},structure:{sitemap:[{id:'page_1',path:'/',label:'Accueil',kind:'PUBLIC'},{id:'page_2',path:'/app/demandes',label:'Mes demandes',kind:'AUTH'}]},preferences:{moods:['MODERN','REASSURING'],color:'CYAN',avoid_colors:'rouge',reference_note:'J’aime les interfaces simples et aérées.'}};
function request(payload=body,token='good-token'){return new Request('https://app.example/api/lab2/design',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify(payload)})}

const response=await handleLab2IdeaDesign(request(),env);const result=await response.json();
if(response.status!==200||result.ok!==true)throw new Error('LAB2_DESIGN_SUCCESS_EXPECTED');
if(result.contract_version!=='lab2-design-v1')throw new Error('LAB2_DESIGN_CONTRACT_MISMATCH');
if(result.directions.length!==3)throw new Error('LAB2_DESIGN_DIRECTION_COUNT_MISMATCH');
if(result.directions[0].resolved?.palette?.tokens?.primary!=='187 82% 38%')throw new Error('LAB2_DESIGN_DETERMINISTIC_TOKEN_RESOLUTION_FAILED');
if(aiCalls!==1||result.guarantees?.single_ai_call!==true)throw new Error('LAB2_DESIGN_AI_CALL_BUDGET_FAILED');
if(result.guarantees?.catalog_only_tokens!==true||result.guarantees?.human_direction_selection_required!==true)throw new Error('LAB2_DESIGN_GUARANTEE_MISSING');
const forbidden=await handleLab2IdeaDesign(request(body,'other-token'),env);if(forbidden.status!==403)throw new Error('LAB2_DESIGN_ALLOWLIST_GUARD_FAILED');
const disabled=await handleLab2IdeaDesign(request(),{...env,LAB2_DESIGN_ENABLED:'false'});if(disabled.status!==404)throw new Error('LAB2_DESIGN_FLAG_GUARD_FAILED');
globalThis.fetch=originalFetch;
console.log('lab2-design-v1: ok (1 AI call, deterministic catalog tokens)');

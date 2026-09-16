import fs from 'node:fs/promises';

const source=await fs.readFile(new URL('../src/lab2-idea-structure.js',import.meta.url),'utf8');
const moduleUrl=`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const {handleLab2IdeaStructure}=await import(moduleUrl);

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
const env={LAB2_IDEA_STUDIO_ENABLED:'true',LAB2_STRUCTURE_ENABLED:'true',LAB2_ALLOWED_USER_IDS:'11111111-1111-4111-8111-111111111111',SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'pub',AI:{run:async()=>{aiCalls+=1;return {response:{workflows:[{name:'Demander une vérification',actor:'Acheteur',goal:'Faire vérifier un véhicule éloigné avant déplacement',steps:['Transmettre l’annonce','Créer la demande','Attendre la vérification','Consulter le compte rendu']}],sitemap:[{path:'/',label:'Accueil',kind:'PUBLIC',purpose:'Expliquer le service et permettre de commencer.',primary_action:'Créer une demande',workflow_indices:[0]},{path:'/app/demandes',label:'Mes demandes',kind:'AUTH',purpose:'Créer et suivre les demandes de vérification.',primary_action:'Nouvelle demande',workflow_indices:[0]},{path:'/app/demandes/:id',label:'Détail demande',kind:'AUTH',purpose:'Voir le statut et le compte rendu.',primary_action:null,workflow_indices:[0]}],public_navigation:['Accueil'],app_navigation:['Mes demandes'],structural_questions:['Le paiement fait-il partie du premier MVP ?']},usage:{prompt_tokens:700,completion_tokens:300}}}}};
const body={name:'TierceVue',brief:{one_liner:'Faire vérifier un véhicule éloigné.',problem:'Éviter un déplacement inutile.',target_users:['Acheteurs éloignés'],solution:'Créer une demande confiée à un tiers puis recevoir un compte rendu.',core_features:['Créer une demande','Recevoir un compte rendu'],main_flow:['Transmettre une annonce','Créer une demande','Recevoir le compte rendu'],differentiators:[],open_questions:['Paiement non défini.']}};
function request(payload=body,token='good-token'){return new Request('https://app.example/api/lab2/structure',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify(payload)})}
const response=await handleLab2IdeaStructure(request(),env);const result=await response.json();
if(response.status!==200||result.ok!==true)throw new Error('LAB2_STRUCTURE_SUCCESS_EXPECTED');
if(result.contract_version!=='lab2-structure-v1')throw new Error('LAB2_STRUCTURE_CONTRACT_MISMATCH');
if(result.structure.workflows.length!==1||result.structure.sitemap.length!==3)throw new Error('LAB2_STRUCTURE_NORMALIZATION_MISMATCH');
if(aiCalls!==1||result.guarantees?.single_ai_call!==true)throw new Error('LAB2_STRUCTURE_AI_CALL_BUDGET_FAILED');
if(result.guarantees?.human_page_review_required!==true)throw new Error('LAB2_STRUCTURE_HUMAN_REVIEW_GUARANTEE_MISSING');
const forbidden=await handleLab2IdeaStructure(request(body,'other-token'),env);if(forbidden.status!==403)throw new Error('LAB2_STRUCTURE_ALLOWLIST_GUARD_FAILED');
const disabled=await handleLab2IdeaStructure(request(),{...env,LAB2_STRUCTURE_ENABLED:'false'});if(disabled.status!==404)throw new Error('LAB2_STRUCTURE_FLAG_GUARD_FAILED');
globalThis.fetch=originalFetch;
console.log('lab2-structure-v1: ok (1 AI call, provisional sitemap)');

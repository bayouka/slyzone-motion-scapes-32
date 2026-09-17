const {handleLab2IdeaStructure}=await import(new URL('../src/lab2-idea-structure.js',import.meta.url).href+`?t=${Date.now()}`);
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
let aiCalls=0,captured='';
const env={LAB2_IDEA_STUDIO_ENABLED:'true',LAB2_STRUCTURE_ENABLED:'true',LAB2_ALLOWED_USER_IDS:'11111111-1111-4111-8111-111111111111',SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'pub',AI:{run:async(_model,options)=>{aiCalls+=1;captured=options.messages.map(x=>x.content).join('\n');return {response:{workflows:[{name:'Demander une vérification',actor:'Acheteur',goal:'Faire vérifier un véhicule éloigné avant déplacement',steps:['Transmettre l’annonce','Créer la demande','Consulter le compte rendu']}],sitemap:[{path:'/',label:'Accueil',kind:'PUBLIC',purpose:'Expliquer le service et permettre de commencer.',primary_action:'Créer une demande',workflow_indices:[0]},{path:'/auth/login',label:'Connexion',kind:'AUTH',purpose:'Accéder à son espace.',primary_action:'Se connecter',workflow_indices:[0]},{path:'/app/demandes',label:'Mes demandes',kind:'APP',purpose:'Créer et suivre les demandes.',primary_action:'Nouvelle demande',workflow_indices:[0]},{path:'/app/settings',label:'Paramètres',kind:'SETTINGS',purpose:'Gérer le compte.',primary_action:null,workflow_indices:[]}],public_navigation:['Accueil'],app_navigation:['Mes demandes','Paramètres'],structural_questions:['Quel niveau de détail doit contenir le rapport ?']},usage:{prompt_tokens:700,completion_tokens:300}}}}};
const definition={project_name:'TierceVue',project_profile:{surface:'WEB_APP',model:'MARKETPLACE',interaction:'MULTI_SIDED',account:'REQUIRED',transaction:'UNKNOWN',multi_actor:true,confidence:'HIGH'},brief:{one_liner:'Une plateforme pour faire vérifier un véhicule éloigné.',problem:'Éviter un déplacement inutile.',target_users:['Acheteurs éloignés'],solution:'Une plateforme pour faire vérifier un véhicule éloigné.',core_features:['Compte rendu structuré'],main_flow:['Transmettre une annonce','Recevoir le compte rendu'],differentiators:[]},open_decisions:[{question:'Quel niveau de détail doit contenir le rapport ?',scope:'STRUCTURE',blocking:false,reason:'Organisation des écrans.'},{question:'Le paiement fait-il partie du MVP ?',scope:'FEASIBILITY',blocking:false,reason:'Technique.'}]};
const body={definition_contract:'lab2-definition-v1',definition};
function request(payload=body,token='good-token'){return new Request('https://app.example/api/lab2/structure',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify(payload)})}
const response=await handleLab2IdeaStructure(request(),env),result=await response.json();
if(response.status!==200||!result.ok)throw new Error('LAB2_STRUCTURE_SUCCESS_EXPECTED');
if(result.contract_version!=='lab2-structure-v2')throw new Error('LAB2_STRUCTURE_V2_REQUIRED');
if(result.structure.workflows.length!==1||result.structure.sitemap.length!==4)throw new Error('LAB2_STRUCTURE_NORMALIZATION_MISMATCH');
if(!result.structure.sitemap.some(p=>p.kind==='APP')||!result.structure.sitemap.some(p=>p.kind==='SETTINGS'))throw new Error('LAB2_EXPERIENCE_KINDS_MISSING');
if(aiCalls!==1||result.guarantees?.single_ai_call!==true||result.guarantees?.experience_architecture!==true)throw new Error('LAB2_STRUCTURE_AI_BUDGET_OR_MODE_FAILED');
if(!captured.includes('"model":"MARKETPLACE"'))throw new Error('LAB2_STRUCTURE_PROFILE_NOT_USED');
if(!captured.includes('Quel niveau de détail doit contenir le rapport')||captured.includes('Le paiement fait-il partie du MVP'))throw new Error('LAB2_STRUCTURE_SCOPE_FILTER_FAILED');
if(result.guarantees?.structural_decisions_not_silently_resolved!==true)throw new Error('LAB2_STRUCTURE_DECISION_GUARD_MISSING');
if((await handleLab2IdeaStructure(request(body,'other-token'),env)).status!==403)throw new Error('LAB2_STRUCTURE_ALLOWLIST_GUARD_FAILED');
if((await handleLab2IdeaStructure(request(),{...env,LAB2_STRUCTURE_ENABLED:'false'})).status!==404)throw new Error('LAB2_STRUCTURE_FLAG_GUARD_FAILED');
globalThis.fetch=originalFetch;
console.log('lab2-structure-v2: ok (adaptive experience architecture + scoped structural decisions)');

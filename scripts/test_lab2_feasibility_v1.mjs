const {handleLab2IdeaFeasibility}=await import(new URL('../src/lab2-idea-feasibility.js',import.meta.url).href+`?t=${Date.now()}`);
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
const env={LAB2_IDEA_STUDIO_ENABLED:'true',LAB2_ALLOWED_USER_IDS:'11111111-1111-4111-8111-111111111111',SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'pub'};
const definition={project_name:'TierceVue',project_profile:{surface:'WEB_APP',model:'MARKETPLACE',interaction:'MULTI_SIDED',account:'REQUIRED',transaction:'REQUIRED',multi_actor:true,confidence:'HIGH'},brief:{one_liner:'Une plateforme pour faire vérifier un véhicule éloigné.',problem:'Éviter un déplacement inutile.',solution:'Mettre en relation un acheteur et un vérificateur avec paiement.',core_features:['Compte utilisateur','Paiement de la mission','Compte rendu structuré'],main_flow:['Créer une demande','Payer la mission','Recevoir le compte rendu']},retained_improvements:[],feasibility_notes:[],open_decisions:[{question:'Le paiement est-il encaissé avant la mission ?',scope:'FEASIBILITY',blocking:true,reason:'Le workflow de transaction dépend de cette décision.'},{question:'Quel niveau de détail doit contenir le rapport ?',scope:'STRUCTURE',blocking:false,reason:'Organisation des écrans.'}]};
function request(payload={definition_contract:'lab2-definition-v1',definition},token='good-token'){return new Request('https://app.example/api/lab2/feasibility',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify(payload)})}
const response=await handleLab2IdeaFeasibility(request(),env),result=await response.json();
if(response.status!==200||!result.ok)throw new Error('LAB2_FEASIBILITY_SUCCESS_EXPECTED');
if(result.contract_version!=='lab2-feasibility-v1')throw new Error('LAB2_FEASIBILITY_V1_REQUIRED');
const ids=new Set(result.feasibility.capabilities.map(x=>x.id));
for(const id of ['AUTH','PAYMENTS','MULTI_SIDED'])if(!ids.has(id))throw new Error(`LAB2_FEASIBILITY_CAPABILITY_MISSING_${id}`);
if(result.feasibility.simple!==false||result.feasibility.level!=='MEDIUM')throw new Error('LAB2_FEASIBILITY_COMPLEXITY_MISMATCH');
if(result.feasibility.open_decisions.length!==1||result.feasibility.open_decisions[0].question!=='Le paiement est-il encaissé avant la mission ?'||result.feasibility.requires_human_input!==true)throw new Error('LAB2_FEASIBILITY_DECISION_SCOPE_FAILED');
if(result.usage!==null||result.guarantees?.deterministic!==true||result.guarantees?.ai_calls!==0||result.guarantees?.no_external_service_calls!==true)throw new Error('LAB2_FEASIBILITY_ZERO_CREDIT_GUARANTEE_FAILED');
const simpleDefinition={project_name:'Atelier Martin',project_profile:{surface:'PUBLIC_SITE',model:'SERVICE',interaction:'ONE_SIDED',account:'NONE',transaction:'NONE',multi_actor:false,confidence:'HIGH'},brief:{one_liner:'Un site vitrine pour présenter un atelier local.',problem:'Présenter clairement les services.',solution:'Un site public simple.',core_features:['Présentation des services'],main_flow:['Découvrir les services','Contacter l’atelier']},retained_improvements:[],feasibility_notes:[],open_decisions:[]};
const simpleResponse=await handleLab2IdeaFeasibility(request({definition_contract:'lab2-definition-v1',definition:simpleDefinition}),env),simpleResult=await simpleResponse.json();
if(simpleResponse.status!==200||!simpleResult.feasibility.simple||simpleResult.feasibility.level!=='LOW'||simpleResult.feasibility.capabilities.length!==0)throw new Error('LAB2_FEASIBILITY_SIMPLE_PROJECT_FAILED');
if((await handleLab2IdeaFeasibility(request({definition_contract:'wrong',definition}),env)).status!==400)throw new Error('LAB2_FEASIBILITY_DEFINITION_CONTRACT_GUARD_FAILED');
if((await handleLab2IdeaFeasibility(request(undefined,'other-token'),env)).status!==403)throw new Error('LAB2_FEASIBILITY_ALLOWLIST_GUARD_FAILED');
if((await handleLab2IdeaFeasibility(request(),{...env,LAB2_IDEA_STUDIO_ENABLED:'false'})).status!==404)throw new Error('LAB2_FEASIBILITY_FLAG_GUARD_FAILED');
globalThis.fetch=originalFetch;
console.log('lab2-feasibility-v1: ok (deterministic capability analysis + scoped human decisions)');
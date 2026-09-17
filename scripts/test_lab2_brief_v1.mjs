const {handleLab2IdeaBrief}=await import(new URL('../src/lab2-idea-brief.js',import.meta.url).href+`?t=${Date.now()}`);

const originalFetch=globalThis.fetch;
globalThis.fetch=async(url,options={})=>{
  if(String(url).includes('/auth/v1/user')){
    const auth=options.headers?.Authorization||options.headers?.authorization||'';
    if(auth==='Bearer good-token')return Response.json({id:'11111111-1111-4111-8111-111111111111'});
    if(auth==='Bearer other-token')return Response.json({id:'22222222-2222-4222-8222-222222222222'});
    return new Response('{}',{status:401});
  }
  throw new Error(`unexpected fetch ${url}`);
};
let aiCalls=0;
const env={LAB2_IDEA_STUDIO_ENABLED:'true',LAB2_BRIEF_ENABLED:'true',LAB2_ALLOWED_USER_IDS:'11111111-1111-4111-8111-111111111111',SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'pub',AI:{run:async()=>{aiCalls+=1;throw new Error('Definition must not call AI')}}};
const proposals=[
  {id:'p1',title:'Rapport structuré',type:'FUNCTIONALITY',proposal:'Prévoir un compte rendu structuré.',why:'Clarifier le retour.'},
  {id:'p2',title:'Fonction refusée',type:'FUNCTIONALITY',proposal:'AJOUT_REFUSE_SECRET',why:'Doit être exclu.'},
  {id:'p3',title:'Historique',type:'FUNCTIONALITY',proposal:'Ajouter un historique complet.',why:'Retrouver les demandes.'}
];
const body={
  name:'TierceVue',original_description:'Je veux un site pour qu’une personne proche d’une voiture éloignée puisse la regarder avant que l’acheteur se déplace.',references:[{url:'https://example.com',reason:'parcours'}],
  understanding:{contract_version:'lab2-understanding-v4',one_liner:'Une plateforme pour faire vérifier un véhicule éloigné avant déplacement.',problem:'Éviter un déplacement inutile en obtenant une vérification locale.',project_profile:{surface:'WEB_APP',model:'MARKETPLACE',interaction:'MULTI_SIDED',account:'REQUIRED',transaction:'UNKNOWN',multi_actor:true,confidence:'HIGH'},target_users:[{label:'Acheteurs éloignés'}],main_flow:[{step:'Créer une demande'},{step:'Recevoir un retour'}],explicit_points:['Le véhicule est loin.'],open_decisions:[{question:'La vérification est-elle rémunérée ?',scope:'FEASIBILITY',blocking:false,reason:'Modèle et paiement.'}]},
  improvements:{contract_version:'lab2-improvements-v3',proposals,decisions:{p1:{status:'ACCEPTED'},p2:{status:'REJECTED'},p3:{status:'MODIFIED',value:'Conserver un historique simple des demandes.'}}}
};
function request(payload=body,token='good-token'){return new Request('https://app.example/api/lab2/brief',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify(payload)})}
const response=await handleLab2IdeaBrief(request(),env),result=await response.json();
if(response.status!==200||!result.ok)throw new Error('LAB2_DEFINITION_SUCCESS_EXPECTED');
if(result.contract_version!=='lab2-definition-v1'||result.version!==1)throw new Error('LAB2_DEFINITION_CONTRACT_MISMATCH');
if(result.quality?.deterministic!==true||result.quality?.ai_calls!==0||aiCalls!==0)throw new Error('LAB2_DEFINITION_MUST_BE_ZERO_AI');
if(result.retained_improvements.length!==2)throw new Error('LAB2_RETAINED_IMPROVEMENT_MISMATCH');
const serialized=JSON.stringify(result);
if(serialized.includes('AJOUT_REFUSE_SECRET')||result.definition?.rejected_improvement_ids?.includes('p2')!==true)throw new Error('LAB2_REJECTED_PROPOSAL_HANDLING_FAILED');
if(!serialized.includes('Conserver un historique simple des demandes.'))throw new Error('LAB2_MODIFIED_DECISION_NOT_USED');
if(result.definition?.project_profile?.model!=='MARKETPLACE')throw new Error('LAB2_PROFILE_NOT_PRESERVED');
if(result.definition?.open_decisions?.[0]?.scope!=='FEASIBILITY')throw new Error('LAB2_OPEN_DECISION_NOT_PRESERVED');
if(result.guarantees?.only_confirmed_human_decisions_applied!==true||result.guarantees?.no_new_features_generated!==true)throw new Error('LAB2_DEFINITION_GUARANTEES_MISSING');

const incomplete={...body,improvements:{...body.improvements,decisions:{p1:{status:'ACCEPTED'},p2:{status:'REJECTED'}}}};
if((await handleLab2IdeaBrief(request(incomplete),env)).status!==409)throw new Error('LAB2_DEFINITION_DECISION_COMPLETENESS_FAILED');
if((await handleLab2IdeaBrief(request(body,'other-token'),env)).status!==403)throw new Error('LAB2_DEFINITION_ALLOWLIST_GUARD_FAILED');
if((await handleLab2IdeaBrief(request(),{...env,LAB2_BRIEF_ENABLED:'false'})).status!==404)throw new Error('LAB2_DEFINITION_FLAG_GUARD_FAILED');
globalThis.fetch=originalFetch;
console.log('lab2-definition-v1: ok (deterministic, zero AI, human decisions only)');

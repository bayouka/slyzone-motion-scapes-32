import fs from 'node:fs/promises';

const source=await fs.readFile(new URL('../src/lab2-idea-brief.js',import.meta.url),'utf8');
const moduleUrl=`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const {handleLab2IdeaBrief}=await import(moduleUrl);

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

let lastPrompt='';
const env={
  LAB2_IDEA_STUDIO_ENABLED:'true',LAB2_BRIEF_ENABLED:'true',LAB2_ALLOWED_USER_IDS:'11111111-1111-4111-8111-111111111111',
  SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'pub',
  AI:{run:async(_model,options)=>{
    lastPrompt=options.messages.map(x=>x.content).join('\n');
    return {response:{
      one_liner:'Un site qui permet à un acheteur de faire vérifier un véhicule éloigné avant de se déplacer.',
      problem:'Éviter des déplacements inutiles pour des véhicules qui ne correspondent pas aux attentes.',
      target_users:['Acheteurs de véhicules à distance'],
      solution:'L’acheteur transmet une annonce et demande à un tiers proche du véhicule de réaliser une vérification structurée puis de lui transmettre un compte rendu.',
      core_features:['Créer une demande de vérification','Recevoir un compte rendu structuré','Conserver un historique des demandes'],
      main_flow:['Transmettre une annonce','Créer une demande','Faire réaliser la vérification','Recevoir le compte rendu'],
      differentiators:[],
      open_questions:['Le niveau exact de vérification reste à définir.'],
      short_pitch:'TierceVue aide les acheteurs éloignés à faire vérifier un véhicule avant de se déplacer grâce à un tiers de proximité et un compte rendu structuré.'
    },usage:{prompt_tokens:900,completion_tokens:350}};
  }}
};

const body={
  name:'TierceVue',original_description:'Je veux un site pour qu’une personne proche d’une voiture éloignée puisse la regarder avant que l’acheteur se déplace.',
  references:[{url:'https://example.com',reason:'fonctionnement'}],
  understanding:{one_liner:'Faire vérifier une voiture éloignée.',problem:'Éviter un déplacement inutile.',target_users:[{label:'Acheteurs éloignés'}],main_flow:[{step:'Créer une demande'}],explicit_points:['Le véhicule est loin.'],uncertainties:['Niveau de vérification.']},
  proposals:[
    {id:'p1',title:'Rapport structuré',type:'FUNCTIONALITY',proposal:'Prévoir un compte rendu structuré.',why:'Clarifier le retour.'},
    {id:'p2',title:'Fonction refusée',type:'FUNCTIONALITY',proposal:'AJOUT_REFUSE_SECRET',why:'Doit être exclu.'},
    {id:'p3',title:'Historique',type:'FUNCTIONALITY',proposal:'Ajouter un historique complet.',why:'Retrouver les demandes.'}
  ],
  decisions:{p1:{status:'ACCEPTED'},p2:{status:'REJECTED'},p3:{status:'MODIFIED',value:'Conserver un historique simple des demandes.'}}
};
function request(payload=body,token='good-token'){return new Request('https://app.example/api/lab2/brief',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify(payload)})}

const response=await handleLab2IdeaBrief(request(),env);const result=await response.json();
if(response.status!==200||result.ok!==true)throw new Error('LAB2_BRIEF_SUCCESS_EXPECTED');
if(result.contract_version!=='lab2-brief-v1'||result.version!==1)throw new Error('LAB2_BRIEF_CONTRACT_MISMATCH');
if(result.retained_improvements.length!==2)throw new Error('LAB2_BRIEF_RETAINED_IMPROVEMENT_MISMATCH');
if(lastPrompt.includes('AJOUT_REFUSE_SECRET')||lastPrompt.includes('Fonction refusée'))throw new Error('LAB2_REJECTED_PROPOSAL_LEAKED_TO_MODEL');
if(!lastPrompt.includes('Conserver un historique simple des demandes.'))throw new Error('LAB2_MODIFIED_DECISION_NOT_USED');
if(result.guarantees?.rejected_proposals_excluded_from_model_prompt!==true)throw new Error('LAB2_BRIEF_REJECTION_GUARANTEE_MISSING');

const incompleteBody={...body,decisions:{p1:{status:'ACCEPTED'},p2:{status:'REJECTED'}}};
const incomplete=await handleLab2IdeaBrief(request(incompleteBody),env);if(incomplete.status!==409)throw new Error('LAB2_BRIEF_DECISION_COMPLETENESS_GUARD_FAILED');
const forbidden=await handleLab2IdeaBrief(request(body,'other-token'),env);if(forbidden.status!==403)throw new Error('LAB2_BRIEF_ALLOWLIST_GUARD_FAILED');
const disabled=await handleLab2IdeaBrief(request(),{...env,LAB2_BRIEF_ENABLED:'false'});if(disabled.status!==404)throw new Error('LAB2_BRIEF_FLAG_GUARD_FAILED');

globalThis.fetch=originalFetch;
console.log('lab2-brief-v1: ok (rejected proposal excluded from model prompt)');

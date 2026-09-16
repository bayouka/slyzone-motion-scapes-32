import fs from 'node:fs/promises';

const source=await fs.readFile(new URL('../src/lab2-idea-understanding.js',import.meta.url),'utf8');
const moduleUrl=`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const {handleLab2IdeaUnderstanding}=await import(moduleUrl);

const originalFetch=globalThis.fetch;
globalThis.fetch=async(url,options={})=>{
  if(String(url).includes('/auth/v1/user')){
    const auth=options.headers?.Authorization||options.headers?.authorization||'';
    if(auth==='Bearer good-token')return Response.json({id:'11111111-1111-4111-8111-111111111111',email:'lab@example.com'});
    return new Response('{}',{status:401});
  }
  throw new Error('unexpected fetch');
};

const aiPayload={
  response:{
    one_liner:'Un site qui aide un acheteur à faire vérifier un véhicule éloigné avant de se déplacer.',
    problem:'Éviter un déplacement inutile pour un véhicule qui ne correspond pas aux attentes.',
    target_users:[{label:'Acheteurs de véhicules à distance',basis:'EXPLICIT'}],
    main_flow:[
      {step:'L’acheteur repère un véhicule éloigné.',basis:'EXPLICIT'},
      {step:'Il demande à une personne de proximité de le vérifier.',basis:'EXPLICIT'}
    ],
    explicit_points:['Le véhicule peut être loin de l’acheteur.'],
    uncertainties:['Le niveau exact de vérification attendu n’est pas précisé.'],
    needs_clarification:true,
    clarifying_question:'La personne doit-elle seulement prendre des photos ou aussi évaluer l’état du véhicule ?',
    confidence:'MEDIUM'
  },
  usage:{prompt_tokens:1200,completion_tokens:320,total_tokens:1520}
};

const env={
  LAB2_IDEA_STUDIO_ENABLED:'true',
  SUPABASE_URL:'https://example.supabase.co',
  SUPABASE_PUBLISHABLE_KEY:'pub',
  AI:{run:async()=>aiPayload}
};

function request(body,token='good-token'){
  return new Request('https://app.example/api/lab2/understand',{
    method:'POST',
    headers:{'content-type':'application/json',authorization:`Bearer ${token}`},
    body:JSON.stringify(body)
  });
}

const body={
  name:'TierceVue',
  description:'Je veux un site pour demander à quelqu’un proche d’une voiture éloignée de la regarder avant que l’acheteur se déplace.',
  references:[{url:'example.com',reason:'fonctionnement',note:'logique de mise en relation'}],
  clarifications:[]
};

const okResponse=await handleLab2IdeaUnderstanding(request(body),env);
const ok=await okResponse.json();
if(okResponse.status!==200||ok.ok!==true)throw new Error('LAB2_UNDERSTANDING_SUCCESS_EXPECTED');
if(ok.understanding?.contract_version!=='lab2-understanding-v1')throw new Error('LAB2_CONTRACT_MISMATCH');
if(!(ok.usage?.estimated_neurons>0))throw new Error('LAB2_USAGE_MEASUREMENT_MISSING');
if(ok.understanding?.needs_clarification!==true)throw new Error('LAB2_CLARIFICATION_EXPECTED');

const unauthorized=await handleLab2IdeaUnderstanding(request(body,'bad-token'),env);
if(unauthorized.status!==401)throw new Error('LAB2_AUTH_GUARD_FAILED');

const disabled=await handleLab2IdeaUnderstanding(request(body),{...env,LAB2_IDEA_STUDIO_ENABLED:'false'});
if(disabled.status!==404)throw new Error('LAB2_FEATURE_FLAG_GUARD_FAILED');

const capped=await handleLab2IdeaUnderstanding(request({...body,clarifications:[
  {question:'Q1 ?',answer:'A1'},
  {question:'Q2 ?',answer:'A2'}
]}),env);
const cappedPayload=await capped.json();
if(cappedPayload.understanding?.needs_clarification!==false)throw new Error('LAB2_CLARIFICATION_CAP_FAILED');

globalThis.fetch=originalFetch;
console.log(`lab2-understanding-v1: ok (${ok.usage.estimated_neurons} estimated neurons for fixture)`);

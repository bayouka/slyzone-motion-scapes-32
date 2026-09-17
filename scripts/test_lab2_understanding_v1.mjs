import fs from 'node:fs/promises';

const source=await fs.readFile(new URL('../src/lab2-idea-understanding-compat.js',import.meta.url),'utf8');
const baseSource=await fs.readFile(new URL('../src/lab2-idea-understanding.js',import.meta.url),'utf8');
const baseUrl=`data:text/javascript;base64,${Buffer.from(baseSource).toString('base64')}`;
const rewritten=source.replace("'./lab2-idea-understanding.js'",JSON.stringify(baseUrl));
const moduleUrl=`data:text/javascript;base64,${Buffer.from(rewritten).toString('base64')}`;
const {handleLab2IdeaUnderstanding,normalizeLab2AiResponse}=await import(moduleUrl);

const originalFetch=globalThis.fetch;
globalThis.fetch=async(url,options={})=>{
  if(String(url).includes('/auth/v1/user')){
    const auth=options.headers?.Authorization||options.headers?.authorization||'';
    if(auth==='Bearer good-token')return Response.json({id:'11111111-1111-4111-8111-111111111111',email:'lab@example.com'});
    if(auth==='Bearer other-token')return Response.json({id:'22222222-2222-4222-8222-222222222222',email:'other@example.com'});
    return new Response('{}',{status:401});
  }
  throw new Error('unexpected fetch');
};

const structuredUnderstanding={
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
};

const aiPayload={
  id:'chatcmpl-lab2-fixture',
  object:'chat.completion',
  model:'@cf/google/gemma-4-26b-a4b-it',
  choices:[{
    index:0,
    message:{role:'assistant',content:JSON.stringify(structuredUnderstanding),refusal:null},
    finish_reason:'stop'
  }],
  usage:{prompt_tokens:1200,completion_tokens:320,total_tokens:1520}
};

const normalizedFixture=normalizeLab2AiResponse(aiPayload);
if(normalizedFixture?.response?.one_liner!==structuredUnderstanding.one_liner)throw new Error('LAB2_CHAT_COMPLETIONS_ADAPTER_FAILED');
const legacyFixture=normalizeLab2AiResponse({response:structuredUnderstanding,usage:{prompt_tokens:1,completion_tokens:1}});
if(legacyFixture?.response!==structuredUnderstanding)throw new Error('LAB2_LEGACY_RESPONSE_COMPAT_FAILED');

const env={
  LAB2_IDEA_STUDIO_ENABLED:'true',
  LAB2_ALLOWED_USER_IDS:'11111111-1111-4111-8111-111111111111',
  SUPABASE_URL:'https://example.supabase.co',
  SUPABASE_PUBLISHABLE_KEY:'pub',
  AI:{run:async()=>aiPayload}
};

function request(body,token='good-token'){
  return new Request('https://app.example/api/lab2/understand',{
    method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify(body)
  });
}

const body={
  name:'TierceVue',
  description:'Je veux un site pour demander à quelqu’un proche d’une voiture éloignée de la regarder avant que l’acheteur se déplace.',
  references:[{url:'example.com',reason:'fonctionnement',note:'logique de mise en relation'}],clarifications:[]
};

const okResponse=await handleLab2IdeaUnderstanding(request(body),env);
const ok=await okResponse.json();
if(okResponse.status!==200||ok.ok!==true)throw new Error('LAB2_UNDERSTANDING_SUCCESS_EXPECTED');
if(ok.understanding?.contract_version!=='lab2-understanding-v2')throw new Error('LAB2_CONTRACT_MISMATCH');
if(!(ok.usage?.estimated_neurons>0))throw new Error('LAB2_USAGE_MEASUREMENT_MISSING');
if(ok.understanding?.needs_clarification!==true)throw new Error('LAB2_CLARIFICATION_EXPECTED');
if(ok.understanding?.target_users?.length<1||ok.understanding?.main_flow?.length<2)throw new Error('LAB2_SEMANTIC_QUALITY_GUARD_FAILED');
if(ok.quality?.usable!==true||ok.quality?.generic_empty_fallbacks!==false)throw new Error('LAB2_QUALITY_METADATA_MISSING');

const unauthorized=await handleLab2IdeaUnderstanding(request(body,'bad-token'),env);
if(unauthorized.status!==401)throw new Error('LAB2_AUTH_GUARD_FAILED');
const forbidden=await handleLab2IdeaUnderstanding(request(body,'other-token'),env);
if(forbidden.status!==403)throw new Error('LAB2_ALLOWLIST_GUARD_FAILED');
const accessUnconfigured=await handleLab2IdeaUnderstanding(request(body),{...env,LAB2_ALLOWED_USER_IDS:''});
if(accessUnconfigured.status!==503)throw new Error('LAB2_ALLOWLIST_CONFIGURATION_GUARD_FAILED');
const disabled=await handleLab2IdeaUnderstanding(request(body),{...env,LAB2_IDEA_STUDIO_ENABLED:'false'});
if(disabled.status!==404)throw new Error('LAB2_FEATURE_FLAG_GUARD_FAILED');

const capped=await handleLab2IdeaUnderstanding(request({...body,clarifications:[{question:'Q1 ?',answer:'A1'},{question:'Q2 ?',answer:'A2'}]}),env);
const cappedPayload=await capped.json();
if(cappedPayload.understanding?.needs_clarification!==false)throw new Error('LAB2_CLARIFICATION_CAP_FAILED');

globalThis.fetch=originalFetch;
console.log(`lab2-understanding-v2: ok (${ok.usage.estimated_neurons} estimated neurons for fixture; chat-completions adapter verified)`);

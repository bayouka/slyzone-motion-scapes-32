const {handleLab2IdeaUnderstanding}=await import(new URL('../src/lab2-idea-understanding.js',import.meta.url).href+`?t=${Date.now()}`);

const originalFetch=globalThis.fetch;
globalThis.fetch=async(url,options={})=>{
  if(String(url).includes('/auth/v1/user')){
    const auth=options.headers?.Authorization||options.headers?.authorization||'';
    if(auth==='Bearer good-token')return Response.json({id:'11111111-1111-4111-8111-111111111111',email:'lab@example.com'});
    if(auth==='Bearer other-token')return Response.json({id:'22222222-2222-4222-8222-222222222222'});
    return new Response('{}',{status:401});
  }
  throw new Error('unexpected fetch');
};

const structuredUnderstanding={
  one_liner:'Une plateforme qui permet à un acheteur de faire vérifier un véhicule éloigné avant de se déplacer.',
  problem:'Éviter un déplacement inutile en obtenant une vérification locale du véhicule avant le trajet.',
  project_profile:{surface:'WEB_APP',model:'MARKETPLACE',interaction:'MULTI_SIDED',account:'REQUIRED',transaction:'UNKNOWN',multi_actor:true,confidence:'HIGH'},
  target_users:[{label:'Acheteurs de véhicules à distance',basis:'EXPLICIT'},{label:'Personnes disponibles près du véhicule',basis:'INFERRED'}],
  main_flow:[{step:'L’acheteur indique le véhicule à vérifier.',basis:'EXPLICIT'},{step:'Une personne proche effectue la vérification.',basis:'INFERRED'},{step:'L’acheteur reçoit le retour avant de décider de se déplacer.',basis:'INFERRED'}],
  explicit_points:['Le véhicule peut être loin de l’acheteur.'],
  uncertainties:['Le niveau exact de vérification attendu reste à définir.'],
  deferred_questions:[{question:'La vérification doit-elle être rémunérée ?',scope:'FEASIBILITY'},{question:'Quel niveau de détail doit contenir le rapport ?',scope:'STRUCTURE'}],
  needs_clarification:false,
  clarifying_question:null,
  confidence:'HIGH'
};
let capturedOptions=null;
const env={
  LAB2_IDEA_STUDIO_ENABLED:'true',LAB2_ALLOWED_USER_IDS:'11111111-1111-4111-8111-111111111111',
  SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'pub',
  AI:{run:async(_model,options)=>{capturedOptions=options;return {response:structuredUnderstanding,usage:{prompt_tokens:1200,completion_tokens:420,total_tokens:1620}}}}
};
function request(body,token='good-token'){return new Request('https://app.example/api/lab2/understand',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify(body)})}
const body={name:'TierceVue',description:'Je veux un site pour demander à quelqu’un proche d’une voiture éloignée de la regarder avant que l’acheteur se déplace.',references:[{url:'example.com',reason:'parcours',note:'logique de mise en relation'}],clarifications:[]};

const response=await handleLab2IdeaUnderstanding(request(body),env);const result=await response.json();
if(response.status!==200||result.ok!==true)throw new Error('LAB2_UNDERSTANDING_SUCCESS_EXPECTED');
if(result.understanding?.contract_version!=='lab2-understanding-v4')throw new Error('LAB2_UNDERSTANDING_V4_REQUIRED');
if(result.understanding?.project_profile?.model!=='MARKETPLACE'||result.understanding?.project_profile?.surface!=='WEB_APP')throw new Error('LAB2_PROJECT_PROFILE_REQUIRED');
if(result.understanding?.deferred_questions?.some(item=>item.scope==='UNDERSTANDING'))throw new Error('LAB2_DEFERRED_SCOPE_INVALID');
if(result.understanding?.needs_clarification!==false)throw new Error('LAB2_NON_BLOCKING_DECISIONS_MUST_NOT_BLOCK');
if(result.understanding?.target_users?.length<1||result.understanding?.main_flow?.length<2)throw new Error('LAB2_SEMANTIC_QUALITY_GUARD_FAILED');
if(!(result.usage?.estimated_neurons>0))throw new Error('LAB2_USAGE_MEASUREMENT_MISSING');
if(!String(capturedOptions?.messages?.[0]?.content||'').includes('PROJECT_PROFILE'))throw new Error('LAB2_ADAPTIVE_PROFILE_PROMPT_MISSING');
if(!String(capturedOptions?.messages?.[0]?.content||'').includes('galerie simple ou pages projets détaillées'))throw new Error('LAB2_SCOPE_EXAMPLE_MISSING');

const unauthorized=await handleLab2IdeaUnderstanding(request(body,'bad-token'),env);if(unauthorized.status!==401)throw new Error('LAB2_AUTH_GUARD_FAILED');
const forbidden=await handleLab2IdeaUnderstanding(request(body,'other-token'),env);if(forbidden.status!==403)throw new Error('LAB2_ALLOWLIST_GUARD_FAILED');
const unconfigured=await handleLab2IdeaUnderstanding(request(body),{...env,LAB2_ALLOWED_USER_IDS:''});if(unconfigured.status!==503)throw new Error('LAB2_ALLOWLIST_CONFIGURATION_GUARD_FAILED');
const disabled=await handleLab2IdeaUnderstanding(request(body),{...env,LAB2_IDEA_STUDIO_ENABLED:'false'});if(disabled.status!==404)throw new Error('LAB2_FEATURE_FLAG_GUARD_FAILED');

globalThis.fetch=originalFetch;
console.log(`lab2-understanding-v4: ok (${result.usage.estimated_neurons} estimated neurons; adaptive profile + deferred scopes)`);

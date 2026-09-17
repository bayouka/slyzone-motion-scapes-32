const {handleLab2IdeaResearch}=await import(new URL('../src/lab2-idea-research.js',import.meta.url).href+`?t=${Date.now()}`);
const originalFetch=globalThis.fetch;
globalThis.fetch=async(url,options={})=>{
  if(String(url).includes('/auth/v1/user'))return Response.json({id:'11111111-1111-4111-8111-111111111111'});
  throw new Error(`unexpected fetch ${url}`);
};
const env={LAB2_IDEA_STUDIO_ENABLED:'true',LAB2_RESEARCH_ENABLED:'true',LAB2_ALLOWED_USER_IDS:'11111111-1111-4111-8111-111111111111',SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'pub',AI:{run:async()=>{throw new Error('AI should not run when discovery is disabled and there are no sources')}}};
const profile=(model,surface,interaction)=>({surface,model,interaction,account:'UNKNOWN',transaction:'UNKNOWN',multi_actor:model==='MARKETPLACE',confidence:'HIGH'});
const makeBody=(name,model,surface,interaction)=>({name,understanding:{contract_version:'lab2-understanding-v4',one_liner:`Projet ${name} conçu pour répondre à un besoin utilisateur concret.`,problem:`Permettre aux utilisateurs de ${name} d'obtenir un résultat clair sans parcours inutile.`,project_profile:profile(model,surface,interaction),target_users:[{label:'Utilisateurs cibles'}],main_flow:[{step:'Découvrir le service'},{step:'Obtenir le résultat'}],deferred_questions:[]},references:[],discover_solutions:false});
async function run(body){const request=new Request('https://app.example/api/lab2/research',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer good-token'},body:JSON.stringify(body)});const response=await handleLab2IdeaResearch(request,env);const payload=await response.json();if(response.status!==200||!payload.ok)throw new Error(`PROFILE_RESEARCH_FAILED_${body.name}`);return payload.research_plan}
const service=await run(makeBody('StudioLocal','SERVICE','WEBSITE','DISCOVERY_CONTACT'));
if(!service.candidate_types.includes('DIRECT')||service.candidate_types.includes('SUBSTITUTE'))throw new Error('SERVICE_RESEARCH_PLAN_BAD');
const saas=await run(makeBody('SaaSFlow','SAAS','WEB_APP','SELF_SERVICE'));
if(!saas.candidate_types.includes('SUBSTITUTE')||!saas.objective.includes('logiciels'))throw new Error('SAAS_RESEARCH_PLAN_BAD');
const marketplace=await run(makeBody('MarketLink','MARKETPLACE','WEB_APP','MULTI_SIDED'));
if(!marketplace.candidate_types.includes('SUBSTITUTE')||!marketplace.objective.includes('multi-acteurs'))throw new Error('MARKETPLACE_RESEARCH_PLAN_BAD');
const internal=await run(makeBody('OpsTool','INTERNAL_TOOL','WEB_APP','WORKFLOW_TOOL'));
if(internal.candidate_types.includes('DIRECT')||!internal.objective.includes('workflows'))throw new Error('INTERNAL_TOOL_RESEARCH_PLAN_BAD');
globalThis.fetch=originalFetch;
console.log('lab2-research-profiles-v1: ok (service, SaaS, marketplace, internal tool plans differ)');

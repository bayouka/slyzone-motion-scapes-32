const {handleLab2PresentationPlan}=await import(new URL('../src/lab2-presentation-plan.js',import.meta.url).href+`?t=${Date.now()}`);

const originalFetch=globalThis.fetch;
globalThis.fetch=async(url,options={})=>{
  if(String(url).includes('/auth/v1/user')){
    const auth=options.headers?.Authorization||options.headers?.authorization||'';
    if(auth==='Bearer good-token')return Response.json({id:'11111111-1111-4111-8111-111111111111'});
    return new Response('{}',{status:401});
  }
  throw new Error(`unexpected fetch ${url}`);
};

let invalidResearch=false;
const ai={run:async()=>({
  response:{
    project_archetype:'SERVICE_WEBSITE',
    narrative_angle:'Faire comprendre rapidement le besoin, la solution, le parcours et la proposition visuelle avant validation par l’équipe.',
    slides:invalidResearch?[
      {type:'COVER',title:'HFconcept',purpose:'Ouvrir la présentation et donner le contexte.',mockup_id:null},
      {type:'PROBLEM',title:'Pourquoi ce site',purpose:'Expliquer le besoin auquel le projet doit répondre.',mockup_id:null},
      {type:'CONCEPT',title:'Le concept',purpose:'Présenter la solution retenue.',mockup_id:null},
      {type:'RESEARCH',title:'Recherche',purpose:'Présenter des observations concurrentielles.',mockup_id:null},
      {type:'WORKFLOW',title:'Parcours',purpose:'Montrer le parcours principal.',mockup_id:null},
      {type:'DESIGN',title:'Direction',purpose:'Présenter la direction visuelle choisie.',mockup_id:null},
      {type:'MOCKUP',title:'Accueil',purpose:'Visualiser l’écran principal.',mockup_id:'mock_1'},
      {type:'NEXT_STEPS',title:'Suite',purpose:'Présenter les prochaines étapes.',mockup_id:null}
    ]:[
      {type:'COVER',title:'HFconcept',purpose:'Ouvrir la présentation et donner le contexte.',mockup_id:null},
      {type:'PROBLEM',title:'Pourquoi ce site',purpose:'Expliquer le besoin auquel le projet doit répondre.',mockup_id:null},
      {type:'CONCEPT',title:'Le concept',purpose:'Présenter la solution retenue.',mockup_id:null},
      {type:'WORKFLOW',title:'Parcours',purpose:'Montrer le parcours principal.',mockup_id:null},
      {type:'SITEMAP',title:'Architecture',purpose:'Montrer la structure proposée.',mockup_id:null},
      {type:'DESIGN',title:'Direction',purpose:'Présenter la direction visuelle choisie.',mockup_id:null},
      {type:'MOCKUP',title:'Accueil',purpose:'Visualiser l’écran principal.',mockup_id:'mock_1'},
      {type:'NEXT_STEPS',title:'Suite',purpose:'Présenter les prochaines étapes.',mockup_id:null}
    ]
  },usage:{prompt_tokens:700,completion_tokens:320}
})};

const env={LAB2_IDEA_STUDIO_ENABLED:'true',LAB2_PRESENTATION_PLAN_ENABLED:'true',LAB2_ALLOWED_USER_IDS:'11111111-1111-4111-8111-111111111111',SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'pub',AI:ai};
const body={
  name:'HFconcept',
  brief:{one_liner:'Un site vitrine pour présenter un studio d’architecture intérieure et donner envie de prendre contact.',short_pitch:'Présenter le savoir-faire de HFconcept et transformer la découverte en prise de contact.',problem:'Les prospects doivent comprendre rapidement le style, les prestations et la manière de travailler du studio.',solution:'Un site visuel centré sur les réalisations, les services, la confiance et la prise de contact.',target_users:['Particuliers avec un projet intérieur'],core_features:['Réalisations','Services','Contact'],main_flow:['Découvrir','Voir les réalisations','Comprendre les services','Contacter'],differentiators:['Approche claire et visuelle'],open_questions:[]},
  sitemap:[{id:'home',label:'Accueil',path:'/',purpose:'Présenter HFconcept'},{id:'work',label:'Réalisations',path:'/realisations',purpose:'Montrer les projets'}],
  workflows:[{name:'Découverte vers contact',goal:'Obtenir une prise de contact qualifiée',steps:['Découvrir','Explorer','Comprendre','Contacter']}],
  mockups:[{id:'mock_1',page_id:'home',label:'Accueil',path:'/',purpose:'Présenter HFconcept'}],
  research:{quality:{level:'UNAVAILABLE',observed_source_count:0,observed_finding_count:0},competitors:[]},
  retained_improvements:[],
  preferences:{audience:'TEAM',objective:'VALIDATE',detail:'STANDARD'}
};
function request(payload=body){return new Request('https://app.example/api/lab2/presentation-plan',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer good-token'},body:JSON.stringify(payload)})}

const response=await handleLab2PresentationPlan(request(),env);const result=await response.json();
if(response.status!==200||result.ok!==true)throw new Error('LAB2_PRESENTATION_PLAN_SUCCESS_EXPECTED');
if(result.contract_version!=='lab2-presentation-plan-v1')throw new Error('LAB2_PRESENTATION_PLAN_CONTRACT_MISMATCH');
if(result.plan?.project_archetype!=='SERVICE_WEBSITE')throw new Error('LAB2_PRESENTATION_ARCHETYPE_EXPECTED');
if(result.plan?.slides?.length<7)throw new Error('LAB2_PRESENTATION_MIN_SLIDES_FAILED');
if(result.plan.slides.some(x=>x.type==='RESEARCH'))throw new Error('LAB2_PRESENTATION_FALSE_RESEARCH_SLIDE');
if(!result.plan.slides.some(x=>x.type==='MOCKUP'&&x.mockup_id==='mock_1'))throw new Error('LAB2_PRESENTATION_MOCKUP_REQUIRED');
if(result.quality?.adaptive!==true)throw new Error('LAB2_PRESENTATION_ADAPTIVE_FLAG_MISSING');

invalidResearch=true;
const invalid=await handleLab2PresentationPlan(request(),env);const invalidPayload=await invalid.json();
if(invalid.status!==502||invalidPayload.error!=='AI_OUTPUT_INVALID_RESEARCH_SLIDE')throw new Error('LAB2_PRESENTATION_UNVERIFIED_RESEARCH_MUST_FAIL');

globalThis.fetch=originalFetch;
console.log('lab2-presentation-plan-v1: ok (adaptive narrative + provenance guard)');

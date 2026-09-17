const {handleLab2IdeaUnderstanding}=await import(new URL('../src/lab2-idea-understanding.js',import.meta.url).href+`?t=${Date.now()}-u`);
const {handleLab2IdeaStructure}=await import(new URL('../src/lab2-idea-structure.js',import.meta.url).href+`?t=${Date.now()}-s`);

const originalFetch=globalThis.fetch;
globalThis.fetch=async(url,options={})=>{
  if(String(url).includes('/auth/v1/user')){
    const auth=options.headers?.Authorization||options.headers?.authorization||'';
    if(auth==='Bearer good-token')return Response.json({id:'11111111-1111-4111-8111-111111111111',email:'lab@example.com'});
    return new Response('{}',{status:401});
  }
  throw new Error(`unexpected fetch: ${url}`);
};

const scenarios=[
  {
    id:'service-site',
    input:{name:'Atelier Local',description:'Je veux un site simple pour présenter les réalisations de mon entreprise artisanale et permettre aux visiteurs intéressés de me contacter facilement.',references:[],clarifications:[]},
    understanding:{
      one_liner:'Un site vitrine pour présenter les réalisations d’un artisan et générer des prises de contact.',
      problem:'Permettre à des prospects de comprendre rapidement le savoir-faire de l’entreprise avant de la contacter.',
      project_profile:{surface:'WEBSITE',model:'SERVICE',interaction:'DISCOVERY_CONTACT',account:'UNLIKELY',transaction:'UNLIKELY',multi_actor:false,confidence:'HIGH'},
      target_users:[{label:'Prospects recherchant un artisan',basis:'INFERRED'}],
      main_flow:[{step:'Le visiteur découvre le savoir-faire et les réalisations.',basis:'INFERRED'},{step:'Le visiteur contacte l’entreprise.',basis:'EXPLICIT'}],
      explicit_points:['Le site doit présenter les réalisations et faciliter le contact.'],
      open_decisions:[{question:'Faut-il une page détaillée par réalisation ?',scope:'STRUCTURE',blocking:false,reason:'Cela influence la profondeur de navigation sans changer le concept.'}],
      confidence:'HIGH'
    },
    feasibility:{level:'LOW',simple:true,summary:'Site de contenu et de contact sans capacité technique complexe.',capabilities:[],open_decisions:[],resolved_decisions:{}},
    structure:{workflows:[{name:'Découvrir puis contacter',actor:'Visiteur',goal:'Évaluer l’entreprise avant de prendre contact',steps:['Découvrir les réalisations','Comprendre les services','Contacter l’entreprise']}],sitemap:[{path:'/',label:'Accueil',kind:'PUBLIC',purpose:'Présenter la proposition de valeur.',primary_action:'Voir les réalisations',workflow_indices:[0]},{path:'/realisations',label:'Réalisations',kind:'PUBLIC',purpose:'Montrer des exemples de travaux.',primary_action:'Demander un devis',workflow_indices:[0]},{path:'/contact',label:'Contact',kind:'UTILITY',purpose:'Permettre une prise de contact simple.',primary_action:'Envoyer la demande',workflow_indices:[0]}],public_navigation:['Accueil','Réalisations','Contact'],app_navigation:[],structural_questions:['Faut-il une page détaillée par réalisation ?']},
    assert(result){if(result.structure.sitemap.some(p=>['AUTH','APP','SETTINGS','ADMIN'].includes(p.kind)))throw new Error('SERVICE_SITE_MUST_NOT_BE_FORCED_INTO_APP_ARCHITECTURE');}
  },
  {
    id:'saas',
    input:{name:'BriefPilot',description:'Je veux un outil en ligne où une petite équipe peut déposer un brief client, suivre son avancement et retrouver les décisions prises au même endroit.',references:[],clarifications:[]},
    understanding:{
      one_liner:'Un SaaS de suivi de briefs et de décisions pour petites équipes.',
      problem:'Éviter que les briefs, décisions et états d’avancement soient dispersés entre plusieurs outils.',
      project_profile:{surface:'WEB_APP',model:'SAAS',interaction:'WORKFLOW_TOOL',account:'REQUIRED',transaction:'OPTIONAL',multi_actor:false,confidence:'HIGH'},
      target_users:[{label:'Petites équipes de prestation',basis:'INFERRED'}],
      main_flow:[{step:'Un membre crée ou importe un brief.',basis:'EXPLICIT'},{step:'L’équipe suit les décisions et l’avancement.',basis:'EXPLICIT'}],
      explicit_points:['Le produit centralise brief, avancement et décisions.'],
      open_decisions:[{question:'L’équipe doit-elle inviter des clients dans le même espace ?',scope:'STRUCTURE',blocking:false,reason:'Cela change les permissions et certains écrans.'}],
      confidence:'HIGH'
    },
    feasibility:{level:'MEDIUM',simple:false,summary:'Authentification et données persistées sont nécessaires.',capabilities:[{id:'AUTH',label:'Comptes et authentification',complexity:'MEDIUM',external_dependency:false,rationale:'Les espaces de travail sont privés.'},{id:'DATA',label:'Persistance des briefs et décisions',complexity:'MEDIUM',external_dependency:false,rationale:'Le suivi doit être durable.'}],open_decisions:[],resolved_decisions:{}},
    structure:{workflows:[{name:'Créer et suivre un brief',actor:'Membre',goal:'Piloter un brief jusqu’à sa conclusion',steps:['Se connecter','Créer le brief','Mettre à jour son état','Consulter les décisions']}],sitemap:[{path:'/',label:'Accueil',kind:'PUBLIC',purpose:'Expliquer le produit.',primary_action:'Essayer',workflow_indices:[0]},{path:'/auth/login',label:'Connexion',kind:'AUTH',purpose:'Accéder à son espace.',primary_action:'Se connecter',workflow_indices:[0]},{path:'/app/briefs',label:'Briefs',kind:'APP',purpose:'Créer et suivre les briefs.',primary_action:'Nouveau brief',workflow_indices:[0]},{path:'/app/settings',label:'Paramètres',kind:'SETTINGS',purpose:'Gérer le compte.',primary_action:null,workflow_indices:[]}],public_navigation:['Accueil'],app_navigation:['Briefs','Paramètres'],structural_questions:['L’équipe doit-elle inviter des clients dans le même espace ?']},
    assert(result){for(const kind of ['AUTH','APP','SETTINGS'])if(!result.structure.sitemap.some(p=>p.kind===kind))throw new Error(`SAAS_${kind}_EXPECTED`);}
  },
  {
    id:'marketplace',
    input:{name:'TierceVue',description:'Je veux un site où quelqu’un qui habite loin d’une voiture peut demander à une personne proche du véhicule d’aller la voir et de lui faire un compte rendu.',references:[],clarifications:[]},
    understanding:{
      one_liner:'Une plateforme qui met en relation un acheteur éloigné et une personne proche d’un véhicule pour effectuer une vérification locale.',
      problem:'Réduire le risque et le coût d’un déplacement inutile avant l’achat potentiel d’un véhicule.',
      project_profile:{surface:'WEB_APP',model:'MARKETPLACE',interaction:'MULTI_SIDED',account:'REQUIRED',transaction:'UNKNOWN',multi_actor:true,confidence:'HIGH'},
      target_users:[{label:'Acheteurs de véhicules éloignés',basis:'EXPLICIT'},{label:'Personnes proches du véhicule',basis:'EXPLICIT'}],
      main_flow:[{step:'L’acheteur crée une demande de vérification.',basis:'INFERRED'},{step:'Une personne proche réalise la vérification.',basis:'EXPLICIT'},{step:'L’acheteur consulte le compte rendu.',basis:'EXPLICIT'}],
      explicit_points:['Deux personnes situées dans des zones différentes interviennent autour du même véhicule.'],
      open_decisions:[{question:'La mission est-elle rémunérée ?',scope:'FEASIBILITY',blocking:true,reason:'Cela conditionne le paiement et la transaction.'}],
      confidence:'HIGH'
    },
    feasibility:{level:'HIGH',simple:false,summary:'Produit multi-acteurs avec authentification et transaction potentielle.',capabilities:[{id:'AUTH',label:'Comptes et authentification',complexity:'MEDIUM',external_dependency:false,rationale:'Les demandes et comptes rendus sont privés.'},{id:'MULTI_SIDED',label:'Logique multi-acteurs',complexity:'HIGH',external_dependency:false,rationale:'Acheteur et vérificateur ont des rôles distincts.'},{id:'PAYMENTS',label:'Paiement en ligne',complexity:'HIGH',external_dependency:true,rationale:'La mission peut être rémunérée.'}],open_decisions:[{question:'La mission est-elle rémunérée ?',blocking:true,reason:'Le workflow transactionnel dépend de ce choix.'}],resolved_decisions:{'La mission est-elle rémunérée ?':'Oui, la mission est rémunérée et payée avant son exécution.'}},
    structure:{workflows:[{name:'Demander une vérification',actor:'Acheteur',goal:'Obtenir un compte rendu avant déplacement',steps:['Créer la demande','Payer la mission','Recevoir le compte rendu']},{name:'Réaliser une vérification',actor:'Vérificateur',goal:'Effectuer la mission et transmettre le résultat',steps:['Consulter la mission','Effectuer la vérification','Envoyer le compte rendu']}],sitemap:[{path:'/',label:'Accueil',kind:'PUBLIC',purpose:'Présenter le service.',primary_action:'Créer une demande',workflow_indices:[0]},{path:'/auth/login',label:'Connexion',kind:'AUTH',purpose:'Accéder à son espace.',primary_action:'Se connecter',workflow_indices:[0,1]},{path:'/app/demandes',label:'Demandes',kind:'APP',purpose:'Créer et suivre les demandes.',primary_action:'Nouvelle demande',workflow_indices:[0]},{path:'/app/missions',label:'Missions',kind:'APP',purpose:'Consulter et réaliser les missions.',primary_action:'Voir les missions',workflow_indices:[1]},{path:'/app/settings',label:'Paramètres',kind:'SETTINGS',purpose:'Gérer le compte.',primary_action:null,workflow_indices:[]}],public_navigation:['Accueil'],app_navigation:['Demandes','Missions','Paramètres'],structural_questions:[]},
    assert(result){if(result.structure.workflows.length<2)throw new Error('MARKETPLACE_MULTI_ACTOR_WORKFLOWS_EXPECTED');for(const kind of ['AUTH','APP','SETTINGS'])if(!result.structure.sitemap.some(p=>p.kind===kind))throw new Error(`MARKETPLACE_${kind}_EXPECTED`);}
  }
];

function post(url,payload){return new Request(url,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer good-token'},body:JSON.stringify(payload)});}

for(const scenario of scenarios){
  let capturedUnderstanding='';
  const understandingEnv={LAB2_IDEA_STUDIO_ENABLED:'true',LAB2_ALLOWED_USER_IDS:'11111111-1111-4111-8111-111111111111',SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'pub',AI:{run:async(_model,options)=>{capturedUnderstanding=options.messages.map(x=>x.content).join('\n');return {response:scenario.understanding,usage:{prompt_tokens:500,completion_tokens:250}};}}};
  const uResponse=await handleLab2IdeaUnderstanding(post('https://app.example/api/lab2/understand',scenario.input),understandingEnv),u=await uResponse.json();
  if(uResponse.status!==200||!u.ok)throw new Error(`${scenario.id}: UNDERSTANDING_FAILED`);
  if(u.understanding.project_profile.model!==scenario.understanding.project_profile.model)throw new Error(`${scenario.id}: PROJECT_PROFILE_MODEL_MISMATCH`);
  if(u.understanding.project_profile.surface!==scenario.understanding.project_profile.surface)throw new Error(`${scenario.id}: PROJECT_PROFILE_SURFACE_MISMATCH`);
  if(!capturedUnderstanding.includes(scenario.input.description))throw new Error(`${scenario.id}: SPARSE_INPUT_NOT_PASSED_TO_UNDERSTANDING`);

  const definition={project_name:scenario.input.name,project_profile:u.understanding.project_profile,brief:{one_liner:u.understanding.one_liner,problem:u.understanding.problem,target_users:u.understanding.target_users.map(x=>x.label),solution:u.understanding.one_liner,core_features:[],main_flow:u.understanding.main_flow.map(x=>x.step),differentiators:[]},open_decisions:u.understanding.open_decisions};
  let capturedStructure='';
  const structureEnv={LAB2_IDEA_STUDIO_ENABLED:'true',LAB2_STRUCTURE_ENABLED:'true',LAB2_ALLOWED_USER_IDS:'11111111-1111-4111-8111-111111111111',SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'pub',AI:{run:async(_model,options)=>{capturedStructure=options.messages.map(x=>x.content).join('\n');return {response:scenario.structure,usage:{prompt_tokens:500,completion_tokens:250}};}}};
  const sPayload={definition_contract:'lab2-definition-v1',definition,feasibility_contract:'lab2-feasibility-v1',feasibility:scenario.feasibility};
  const sResponse=await handleLab2IdeaStructure(post('https://app.example/api/lab2/structure',sPayload),structureEnv),s=await sResponse.json();
  if(sResponse.status!==200||!s.ok||s.contract_version!=='lab2-structure-v3')throw new Error(`${scenario.id}: STRUCTURE_FAILED`);
  if(!capturedStructure.includes(`\"model\":\"${scenario.understanding.project_profile.model}\"`))throw new Error(`${scenario.id}: PROFILE_NOT_USED_BY_STRUCTURE`);
  if(!capturedStructure.includes('FAISABILITÉ CONFIRMÉE'))throw new Error(`${scenario.id}: FEASIBILITY_NOT_USED_BY_STRUCTURE`);
  scenario.assert(s);
}

globalThis.fetch=originalFetch;
console.log('lab2 sparse cross-archetype pipeline: ok (service website + SaaS + marketplace stay adaptive from sparse idea to experience architecture)');

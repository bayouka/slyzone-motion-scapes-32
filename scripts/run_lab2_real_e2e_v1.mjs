import fs from 'node:fs/promises';

const baseUrl=String(process.env.LAB2_PREVIEW_URL||'').replace(/\/$/,'');
const token=String(process.env.LAB2_E2E_BEARER_TOKEN||'').trim();
if(!baseUrl)throw new Error('LAB2_E2E_PREVIEW_URL_REQUIRED');
if(!token)throw new Error('LAB2_E2E_TOKEN_REQUIRED');

const scenario={
  id:'service_sparse_v1',
  name:'Atelier Martin',
  description:'Je veux un site simple pour présenter mon atelier de menuiserie, montrer quelques réalisations et permettre aux personnes intéressées de me contacter facilement.',
  references:[]
};

const summary={scenario:scenario.id,started_at:new Date().toISOString(),steps:[],contracts:{},counts:{},quality:{},usage:{}};

async function post(path,body){
  const started=Date.now();
  const response=await fetch(`${baseUrl}${path}`,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify(body)});
  const text=await response.text();
  let payload;try{payload=JSON.parse(text)}catch{throw new Error(`${path}: NON_JSON_${response.status}`)}
  summary.steps.push({path,status:response.status,duration_ms:Date.now()-started,ok:payload?.ok===true,error:payload?.error||null});
  if(!response.ok||payload?.ok!==true)throw new Error(`${path}: ${response.status} ${payload?.error||'REQUEST_FAILED'}`);
  return payload;
}

const understandingResult=await post('/api/lab2/understand',{name:scenario.name,description:scenario.description,references:scenario.references,clarifications:[]});
const understanding=understandingResult.understanding;
summary.contracts.understanding=understanding?.contract_version||null;
summary.quality.understanding_confidence=understanding?.confidence||null;
summary.quality.project_profile=understanding?.project_profile||null;
summary.usage.understanding=understandingResult.usage||null;
if(understanding?.needs_clarification)throw new Error(`UNEXPECTED_UNDERSTANDING_BLOCKER: ${understanding.clarifying_question||'unknown'}`);

const researchResult=await post('/api/lab2/research',{name:scenario.name,understanding,references:scenario.references,discover_solutions:true});
summary.contracts.research=researchResult.contract_version||null;
summary.quality.research_level=researchResult.quality?.level||null;
summary.counts.solutions=Array.isArray(researchResult.solutions)?researchResult.solutions.length:0;
summary.counts.observed_findings=Number(researchResult.quality?.observed_finding_count||0);
summary.usage.research=researchResult.usage||null;

const improvementsResult=await post('/api/lab2/improvements',{name:scenario.name,original_description:scenario.description,understanding,research:researchResult});
summary.contracts.improvements=improvementsResult.contract_version||null;
const proposals=Array.isArray(improvementsResult.proposals)?improvementsResult.proposals:[];
if(proposals.length<3)throw new Error(`TOO_FEW_IMPROVEMENTS:${proposals.length}`);
summary.counts.improvements=proposals.length;
summary.usage.improvements=improvementsResult.usage||null;
const decisions=Object.fromEntries(proposals.map(p=>[p.id,{status:'ACCEPTED'}]));

const briefResult=await post('/api/lab2/brief',{name:scenario.name,original_description:scenario.description,references:scenario.references,understanding,improvements:{contract_version:improvementsResult.contract_version,proposals,decisions}});
summary.contracts.definition=briefResult.contract_version||null;
const definition=briefResult.definition;
summary.counts.retained_improvements=Array.isArray(briefResult.retained_improvements)?briefResult.retained_improvements.length:0;
if(definition?.project_profile?.model!==understanding?.project_profile?.model)throw new Error('PROJECT_PROFILE_DRIFT_AFTER_DEFINITION');

const feasibilityResult=await post('/api/lab2/feasibility',{definition_contract:briefResult.contract_version,definition});
summary.contracts.feasibility=feasibilityResult.contract_version||null;
const feasibility={...feasibilityResult.feasibility,resolved_decisions:{...(feasibilityResult.feasibility?.resolved_decisions||{})}};
summary.quality.feasibility_level=feasibility.level||null;
summary.quality.feasibility_simple=feasibility.simple===true;
summary.counts.capabilities=Array.isArray(feasibility.capabilities)?feasibility.capabilities.length:0;
const blockingFeasibility=(feasibility.open_decisions||[]).filter(x=>x?.blocking);
if(blockingFeasibility.length)throw new Error(`UNEXPECTED_FEASIBILITY_BLOCKER:${blockingFeasibility.map(x=>x.question).join(' | ')}`);

const structureResult=await post('/api/lab2/structure',{definition_contract:briefResult.contract_version,definition,feasibility_contract:feasibilityResult.contract_version,feasibility});
summary.contracts.structure=structureResult.contract_version||null;
const structure=structureResult.structure;
summary.counts.workflows=Array.isArray(structure?.workflows)?structure.workflows.length:0;
summary.counts.pages=Array.isArray(structure?.sitemap)?structure.sitemap.length:0;
const forbiddenKinds=new Set(['AUTH','APP','SETTINGS','ADMIN']);
const forbiddenPages=(structure?.sitemap||[]).filter(p=>forbiddenKinds.has(p?.kind));
if(forbiddenPages.length)throw new Error(`SERVICE_OVERCOMPLEXIFIED:${forbiddenPages.map(p=>`${p.kind}:${p.path}`).join(',')}`);
summary.usage.structure=structureResult.usage||null;

const designResult=await post('/api/lab2/design',{name:scenario.name,brief:definition.brief,structure,preferences:{moods:['MODERN','REASSURING'],color:'CYAN',avoid_colors:'',reference_note:'Simple, lisible, professionnel et chaleureux.'}});
summary.contracts.design=designResult.contract_version||null;
summary.counts.design_directions=Array.isArray(designResult.directions)?designResult.directions.length:0;
if(summary.counts.design_directions!==3)throw new Error(`DESIGN_DIRECTION_COUNT:${summary.counts.design_directions}`);
const selectedDesign=designResult.directions[0];
summary.usage.design=designResult.usage||null;

const mockupsResult=await post('/api/lab2/mockups',{name:scenario.name,brief:definition.brief,structure,design:selectedDesign});
summary.contracts.mockups=mockupsResult.contract_version||null;
summary.counts.mockups=Array.isArray(mockupsResult.mockups)?mockupsResult.mockups.length:0;
if(!summary.counts.mockups)throw new Error('NO_MOCKUPS_GENERATED');
summary.usage.mockups=mockupsResult.usage||null;

const presentationResult=await post('/api/lab2/presentation-plan',{name:scenario.name,brief:definition.brief,sitemap:structure.sitemap,workflows:structure.workflows,mockups:mockupsResult.mockups,research:researchResult,retained_improvements:briefResult.retained_improvements||[],preferences:{audience:'TEAM',objective:'VALIDATE',detail:'STANDARD'}});
summary.contracts.presentation_plan=presentationResult.contract_version||null;
summary.counts.slides=Array.isArray(presentationResult.plan?.slides)?presentationResult.plan.slides.length:0;
summary.quality.presentation_archetype=presentationResult.plan?.project_archetype||null;
summary.usage.presentation_plan=presentationResult.usage||null;
if(summary.counts.slides<7)throw new Error(`TOO_FEW_PRESENTATION_SLIDES:${summary.counts.slides}`);

summary.finished_at=new Date().toISOString();
summary.ok=true;
const out=process.env.LAB2_E2E_SUMMARY_PATH||'lab2-real-e2e-summary.json';
await fs.writeFile(out,JSON.stringify(summary,null,2)+'\n','utf8');
console.log('LAB2_REAL_E2E_OK',JSON.stringify({scenario:summary.scenario,contracts:summary.contracts,counts:summary.counts,quality:summary.quality,steps:summary.steps.map(({path,status,duration_ms,ok,error})=>({path,status,duration_ms,ok,error}))}));

import fs from 'node:fs';

const read=(path)=>fs.readFileSync(path,'utf8');
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

const loginHtml=read('site/lab2/login.html');
const loginJs=read('site/lab2/login.js');
assert(loginHtml.includes('copyE2eTokenButton'),'Login must expose the explicit temporary E2E token helper');
assert(loginHtml.includes('LAB2_E2E_BEARER_TOKEN'),'Login must name the private GitHub E2E secret destination');
assert(loginHtml.includes('Le refresh token n’est jamais copié.'),'Login must warn that the refresh token stays private');
assert(loginJs.includes('window.Lab2Auth?.refreshSession?.()'),'E2E helper must refresh the session before copying a token');
assert(loginJs.includes("const token=String(refreshed?.access_token||window.Lab2Auth?.getAccessToken?.()||'').trim();"),'E2E helper must select only the short-lived access token');
assert(loginJs.includes('navigator.clipboard.writeText(token)'),'E2E helper must copy only the selected access-token variable');
assert(!/clipboard\.writeText\([^)]*refresh_token/i.test(loginJs),'E2E helper must never copy a refresh token');

const authenticatedPages=[
  ['site/lab2/idea-research.html','idea-research.js'],
  ['site/lab2/idea-improvements.html','idea-improvements.js'],
  ['site/lab2/idea-brief.html','idea-brief.js'],
  ['site/lab2/idea-feasibility.html','idea-feasibility.js'],
  ['site/lab2/idea-structure.html','idea-structure.js'],
  ['site/lab2/idea-design.html','idea-design.js'],
  ['site/lab2/idea-mockups.html','idea-mockups.js'],
  ['site/lab2/idea-presentation.html','idea-presentation.js']
];

for(const [path,pageScript] of authenticatedPages){
  const html=read(path);
  const configAt=html.indexOf('./runtime-config.js');
  const authAt=html.indexOf('./lab2-auth.js');
  const pageAt=html.indexOf(`./${pageScript}`);
  assert(configAt>=0&&authAt>=0&&pageAt>=0,`${path}: missing runtime/auth/page scripts`);
  assert(configAt<authAt&&authAt<pageAt,`${path}: runtime config and auth must load before ${pageScript}`);
}

const studio=read('site/lab2/idea-studio.html');
for(const script of ['./runtime-config.js','./lab2-auth.js','./project-state.js','./idea-studio-state-bridge.js','./idea-studio.js','./idea-studio-ux-v4.js'])assert(studio.includes(script),`Idea Studio missing ${script}`);
assert(studio.indexOf('./runtime-config.js')<studio.indexOf('./lab2-auth.js'),'Idea Studio runtime config must load before auth');
assert(studio.indexOf('./lab2-auth.js')<studio.indexOf('./project-state.js'),'Idea Studio auth must load before project state');
assert(studio.indexOf('./project-state.js')<studio.indexOf('./idea-studio-state-bridge.js'),'Idea Studio project state must load before its bridge');

const stateBridge=read('site/lab2/idea-studio-state-bridge.js');
assert(stateBridge.includes("EXPECTED_CONTRACT='lab2-understanding-v4'"),'Understanding confirmation must require lab2-understanding-v4');
assert(stateBridge.includes("window.location.assign(`./idea-research.html?idea="),'Confirmed understanding must transition directly to research');
assert(stateBridge.includes("setArtifact('understanding'"),'Confirmed understanding must enter canonical ProjectState');

const research=read('site/lab2/idea-research.html');
assert(research.includes('./idea-improvements.html'),'Research must provide a route to improvements');
assert(research.includes('./idea-research-polish.js'),'Research transparency polish must be loaded');
const polish=read('site/lab2/idea-research-polish.js');
assert(polish.includes("level==='PARTIAL'"),'Research must distinguish partial from complete research');
assert(polish.includes('Recherche Web non configurée'),'Research must expose unconfigured Web research');
assert(polish.includes('Continuer sans recherche concurrentielle'),'Unavailable research must not be disguised as completed analysis');

const improvements=read('site/lab2/idea-improvements.js');
assert(improvements.includes("EXPECTED_UNDERSTANDING='lab2-understanding-v4'"),'Improvements must consume understanding v4');
assert(improvements.includes("EXPECTED_RESEARCH='lab2-research-v3'"),'Improvements must consume research v3');
assert(improvements.includes("EXPECTED_IMPROVEMENTS='lab2-improvements-v3'"),'Improvements must reject stale improvement outputs');
assert(improvements.includes('MIN_PROPOSALS=3'),'Improvements must require a minimum useful proposal set');
assert(read('site/lab2/idea-improvements.html').includes('./idea-brief.html'),'Completed improvement review must lead to canonical definition');

const briefHtml=read('site/lab2/idea-brief.html');
assert(briefHtml.includes('./idea-feasibility.html'),'Canonical definition must lead to feasibility before structure');

const feasibilityHtml=read('site/lab2/idea-feasibility.html');
assert(feasibilityHtml.includes('./idea-brief.html'),'Feasibility must link back to canonical definition');
assert(feasibilityHtml.includes('./idea-structure.html'),'Confirmed feasibility must lead to structure');
const feasibilityJs=read('site/lab2/idea-feasibility.js');
assert(feasibilityJs.includes("EXPECTED_FEASIBILITY='lab2-feasibility-v1'"),'Feasibility UI must require lab2-feasibility-v1');
assert(feasibilityJs.includes("setArtifact('feasibility'"),'Feasibility must persist in canonical ProjectState');

const structureHtml=read('site/lab2/idea-structure.html');
assert(structureHtml.includes('./idea-feasibility.html'),'Structure must link back to feasibility');
assert(structureHtml.includes('./idea-design.html'),'Structure must lead to visual direction');
const structureJs=read('site/lab2/idea-structure.js');
assert(structureJs.includes("EXPECTED_FEASIBILITY='lab2-feasibility-v1'"),'Structure must consume feasibility v1');
assert(structureJs.includes("EXPECTED_STRUCTURE='lab2-structure-v3'"),'Structure UI must require lab2-structure-v3');
assert(structureJs.includes('feasibility_contract:EXPECTED_FEASIBILITY'),'Structure request must send the feasibility contract');
assert(structureJs.includes('feasibility:feas.outputFingerprint'),'Structure fingerprint must depend on confirmed feasibility');

const designHtml=read('site/lab2/idea-design.html');
assert(designHtml.includes('./idea-structure.html')&&designHtml.includes('./idea-mockups.html'),'Visual direction must sit between structure and mockups');
const mockupsHtml=read('site/lab2/idea-mockups.html');
assert(mockupsHtml.includes('./idea-design.html')&&mockupsHtml.includes('./idea-presentation.html'),'Mockups must sit between visual direction and presentation');
const presentationHtml=read('site/lab2/idea-presentation.html');
assert(presentationHtml.includes('./idea-mockups.html'),'Presentation must link back to mockups');
assert(presentationHtml.includes('./idea-presentation-planner.js')&&presentationHtml.includes('./idea-pptx.js'),'Presentation must include adaptive planner and PPTX export');

const projectState=read('site/lab2/project-state.js');
assert(projectState.includes("'definition','feasibility','structure','design','mockups','presentation'"),'ProjectState must preserve definition → feasibility → structure → design → mockups → presentation ordering');
assert(projectState.includes("feasibility:['structure','design','mockups','presentation']"),'Feasibility changes must invalidate every downstream experience artifact');

console.log('lab2 flow shell checks: OK (auth helper + canonical V4 → research V3 → improvements V3 → definition → feasibility V1 → structure V3 → design → mockups → presentation)');

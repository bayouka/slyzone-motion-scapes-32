import fs from 'node:fs/promises';

const read=(path)=>fs.readFile(new URL(`../${path}`,import.meta.url),'utf8');

const [understanding,research,workerEntry,studioJs,studioHtml,researchJs,researchHtml]=await Promise.all([
  read('src/lab2-idea-understanding.js'),
  read('src/lab2-idea-research.js'),
  read('src/worker-entry.js'),
  read('site/lab2/idea-studio.js'),
  read('site/lab2/idea-studio.html'),
  read('site/lab2/idea-research.js'),
  read('site/lab2/idea-research.html')
]);

function requireMatch(source,pattern,code){if(!pattern.test(source))throw new Error(code)}
function forbid(source,pattern,code){if(pattern.test(source))throw new Error(code)}

for(const [name,endpoint] of [['UNDERSTANDING',understanding],['RESEARCH',research]]){
  requireMatch(endpoint,/LAB2_IDEA_STUDIO_ENABLED/,`LAB2_${name}_FEATURE_FLAG_REQUIRED`);
  requireMatch(endpoint,/LAB2_ALLOWED_USER_IDS/,`LAB2_${name}_ALLOWLIST_REQUIRED`);
  requireMatch(endpoint,/\/auth\/v1\/user/,`LAB2_${name}_AUTH_PRECHECK_REQUIRED`);
  forbid(endpoint,/SUPABASE_SERVICE_ROLE_KEY/,`LAB2_${name}_SERVICE_ROLE_FORBIDDEN`);
  forbid(endpoint,/\/rest\/v1\//,`LAB2_${name}_DATABASE_REST_SURFACE_FORBIDDEN`);
  forbid(endpoint,/\/rpc\//,`LAB2_${name}_RPC_SURFACE_FORBIDDEN`);
  forbid(endpoint,/idea_decisions|project_definitions|promote_canonical|record_canonical/i,`LAB2_${name}_CANONICAL_BUSINESS_COUPLING_FORBIDDEN`);
}

requireMatch(research,/LAB2_RESEARCH_ENABLED/,'LAB2_RESEARCH_FLAG_REQUIRED');
requireMatch(research,/LAB2_BRAVE_SEARCH_API_KEY/,'LAB2_RESEARCH_SERVER_SEARCH_KEY_REQUIRED');
requireMatch(research,/SOURCE_FETCH/,'LAB2_RESEARCH_PUBLIC_FETCH_SERVICE_REQUIRED');
requireMatch(research,/api\.search\.brave\.com\/res\/v1\/web\/search/,'LAB2_RESEARCH_FIXED_SEARCH_ORIGIN_REQUIRED');
forbid(research,/TAVILY_API_KEY|G2_WEB|G2_SRC|G2_AI_/,'LAB2_RESEARCH_CANONICAL_EXECUTOR_COUPLING_FORBIDDEN');

requireMatch(workerEntry,/\/api\/lab2\/understand/,'LAB2_UNDERSTANDING_ROUTE_MISSING');
requireMatch(workerEntry,/handleLab2IdeaUnderstanding/,'LAB2_UNDERSTANDING_HANDLER_WIRING_MISSING');
requireMatch(workerEntry,/\/api\/lab2\/research/,'LAB2_RESEARCH_ROUTE_MISSING');
requireMatch(workerEntry,/handleLab2IdeaResearch/,'LAB2_RESEARCH_HANDLER_WIRING_MISSING');

const browserSource=`${studioJs}\n${studioHtml}\n${researchJs}\n${researchHtml}`;
forbid(browserSource,/SUPABASE_SERVICE_ROLE_KEY/,'LAB2_BROWSER_SERVICE_ROLE_FORBIDDEN');
forbid(browserSource,/LAB2_BRAVE_SEARCH_API_KEY|api\.search\.brave\.com/,'LAB2_BROWSER_DIRECT_SEARCH_FORBIDDEN');
forbid(browserSource,/SOURCE_FETCH/,'LAB2_BROWSER_SOURCE_FETCH_BINDING_FORBIDDEN');
forbid(browserSource,/\/api\/ideas\/|\/api\/project-definition\//,'LAB2_BROWSER_CANONICAL_API_COUPLING_FORBIDDEN');
forbid(browserSource,/\/rest\/v1\//,'LAB2_BROWSER_DIRECT_DATABASE_ACCESS_FORBIDDEN');
requireMatch(studioJs,/\/api\/lab2\/understand/,'LAB2_BROWSER_UNDERSTANDING_ROUTE_MISSING');
requireMatch(researchJs,/\/api\/lab2\/research/,'LAB2_BROWSER_RESEARCH_ROUTE_MISSING');
requireMatch(studioJs,/localStorage/,'LAB2_LOCAL_ONLY_DRAFT_EXPECTED');
requireMatch(researchJs,/localStorage/,'LAB2_LOCAL_ONLY_RESEARCH_CACHE_EXPECTED');

console.log('lab2-isolation-check: ok');

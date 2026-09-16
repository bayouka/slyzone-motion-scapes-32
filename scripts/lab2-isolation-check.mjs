import fs from 'node:fs/promises';

const read=(path)=>fs.readFile(new URL(`../${path}`,import.meta.url),'utf8');

const [endpoint,workerEntry,frontendJs,frontendHtml]=await Promise.all([
  read('src/lab2-idea-understanding.js'),
  read('src/worker-entry.js'),
  read('site/lab2/idea-studio.js'),
  read('site/lab2/idea-studio.html')
]);

function requireMatch(source,pattern,code){
  if(!pattern.test(source))throw new Error(code);
}
function forbid(source,pattern,code){
  if(pattern.test(source))throw new Error(code);
}

requireMatch(endpoint,/LAB2_IDEA_STUDIO_ENABLED/,'LAB2_FEATURE_FLAG_REQUIRED');
requireMatch(endpoint,/LAB2_ALLOWED_USER_IDS/,'LAB2_ALLOWLIST_REQUIRED');
requireMatch(endpoint,/\/auth\/v1\/user/,'LAB2_AUTH_PRECHECK_REQUIRED');
requireMatch(workerEntry,/\/api\/lab2\/understand/,'LAB2_ROUTE_MISSING');
requireMatch(workerEntry,/handleLab2IdeaUnderstanding/,'LAB2_HANDLER_WIRING_MISSING');

forbid(endpoint,/SUPABASE_SERVICE_ROLE_KEY/,'LAB2_SERVICE_ROLE_FORBIDDEN');
forbid(endpoint,/\/rest\/v1\//,'LAB2_DATABASE_REST_WRITE_SURFACE_FORBIDDEN');
forbid(endpoint,/\/rpc\//,'LAB2_RPC_SURFACE_FORBIDDEN');
forbid(endpoint,/idea_decisions|project_definitions|promote_canonical|record_canonical/i,'LAB2_CANONICAL_BUSINESS_COUPLING_FORBIDDEN');

const browserSource=`${frontendJs}\n${frontendHtml}`;
forbid(browserSource,/SUPABASE_SERVICE_ROLE_KEY/,'LAB2_BROWSER_SERVICE_ROLE_FORBIDDEN');
forbid(browserSource,/\/api\/ideas\/|\/api\/project-definition\//,'LAB2_BROWSER_CANONICAL_API_COUPLING_FORBIDDEN');
forbid(browserSource,/\/rest\/v1\//,'LAB2_BROWSER_DIRECT_DATABASE_ACCESS_FORBIDDEN');
requireMatch(frontendJs,/\/api\/lab2\/understand/,'LAB2_BROWSER_ROUTE_MISSING');
requireMatch(frontendJs,/localStorage/,'LAB2_LOCAL_ONLY_DRAFT_EXPECTED');

console.log('lab2-isolation-check: ok');

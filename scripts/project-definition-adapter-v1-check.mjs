import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const adapterPath=path.join(root,'src','project-definition-adapter.js');
const entryPath=path.join(root,'src','worker-entry.js');
const packagePath=path.join(root,'package.json');

const fail=(message)=>{console.error(`[project-definition-adapter-v1] FAIL: ${message}`);process.exitCode=1;};
const assert=(condition,message)=>{if(!condition)fail(message);};
const read=(file)=>fs.readFileSync(file,'utf8');

let adapter,entry,pkg;
try{
  adapter=read(adapterPath);
  entry=read(entryPath);
  pkg=JSON.parse(read(packagePath));
}catch(error){
  fail(`cannot read adapter contract sources: ${error.message}`);
  process.exit(1);
}

const expectedCommands=[
  'canonical.read',
  'delivery_lot.create',
  'delivery_lot.readiness',
  'delivery_lot.prepare_rfd',
  'delivery_lot.approve_rfd',
  'project_rfd.readiness',
  'project_rfd.prepare',
  'project_rfd.approve'
];
for(const command of expectedCommands)assert(adapter.includes(`'${command}'`),`missing command ${command}`);

const commandBlock=adapter.match(/const COMMANDS=new Set\(\[([\s\S]*?)\]\);/);
assert(Boolean(commandBlock),'COMMANDS allowlist block missing');
if(commandBlock){
  const actual=[...commandBlock[1].matchAll(/'([^']+)'/g)].map(match=>match[1]);
  assert(JSON.stringify(actual)===JSON.stringify(expectedCommands),`command allowlist mismatch: ${actual.join(', ')}`);
}

const requestKeysBlock=adapter.match(/const REQUEST_KEYS=Object\.freeze\(\{([\s\S]*?)\}\);/);
assert(Boolean(requestKeysBlock),'REQUEST_KEYS block missing');
assert(!requestKeysBlock?.[1]?.includes("'authorized_by'"),'client request must never accept authorized_by');
assert(!adapter.includes('body.authorized_by'),'client-controlled authorized_by usage forbidden');
assert((adapter.match(/p_authorized_by:auth\.user\.id/g)||[]).length===2,'G4 and G5 approvals must inject JWT auth.user.id');

assert(adapter.includes('/auth/v1/user'),'JWT user verification missing');
assert(adapter.includes('/rest/v1/project_definitions?select=id,idea_id,workspace_id,definition_revision,status,baseline_hash'),'user-scoped Project Definition RLS proof missing');
assert(adapter.includes("throw new AdapterHttpError(403,'PROJECT_DEFINITION_ACCESS_DENIED')"),'access-denied non-disclosure behavior missing');
assert(adapter.includes("['owner','admin'].includes"),'owner/admin mutation authority check missing');
assert(adapter.includes("idea.created_by===auth.user.id"),'Idea creator mutation authority check missing');
assert(adapter.includes("throw new AdapterHttpError(403,'PROJECT_DEFINITION_WRITE_REQUIRED')"),'write-authority rejection missing');

assert(adapter.includes("const LOT_KEY_RE=/^[A-Z0-9][A-Z0-9._-]{0,127}$/"),'DeliveryLot key validation must mirror database constraint');
assert(adapter.includes('const MAX_NODES_PER_LOT=28'),'DeliveryLot node cap mismatch');
assert(adapter.includes('Number.isSafeInteger(value)&&value>=0'),'definition revision validation missing');
assert(adapter.includes("const MD5_RE=/^[0-9a-f]{32}$/i"),'evaluation fingerprint validation missing');

const allowedRpcs=[
  'get_project_delivery_lot_dependency_closure_v1',
  'get_project_definition_canonical_graph_v1',
  'create_project_delivery_lot_v1',
  'get_project_delivery_lot_rfd_readiness_v1',
  'create_project_delivery_lot_baseline_candidate_v1',
  'get_project_delivery_lot_baseline_handoff_readiness_v1',
  'create_project_delivery_lot_handoff_manifest_v1',
  'approve_project_delivery_lot_rfd_v1',
  'get_project_rfd_readiness_v1',
  'create_project_rfd_manifest_candidate_v1',
  'approve_project_rfd_v1'
];
const calledRpcs=[...new Set([...adapter.matchAll(/serviceRpc\(env,'([^']+)'/g)].map(match=>match[1]))].sort();
assert(JSON.stringify(calledRpcs)===JSON.stringify([...allowedRpcs].sort()),`service RPC allowlist mismatch: ${calledRpcs.join(', ')}`);
assert(!/serviceRpc\(env\s*,\s*(?:body|rawBody|command)/.test(adapter),'client-selected RPC name forbidden');

assert(adapter.includes("PREBASELINE_PREDICATES.every(key=>predicates[key]==='PASS')"),'prepare_rfd must require five prebaseline predicates before baseline creation');
assert(adapter.includes("baselineHandoff.BASELINE_READY!=='PASS'"),'baseline preparation guard missing');
assert(adapter.includes("baselineHandoff.HANDOFF_INTEGRITY!=='PASS'"),'handoff preparation guard missing');
assert(adapter.includes("readiness?.required_lot_readiness?.status!=='PASS'"),'project RFD manifest must require all required lots ready');

assert(entry.includes("import { handleProjectDefinitionCommand } from './project-definition-adapter.js';"),'Worker entry must import Project Definition adapter');
assert(entry.includes("url.pathname==='/api/project-definition/engine'"),'Project Definition route missing');
assert(entry.includes('project_definition_adapter_v1'),'health metadata for Project Definition adapter missing');
assert(entry.includes('service_role_browser_exposed:false'),'health metadata must state service role is not browser-exposed');

const checkScript=String(pkg.scripts?.check||'');
assert(checkScript.includes('node --check src/project-definition-adapter.js'),'npm run check must syntax-check Project Definition adapter');
assert(checkScript.includes('node scripts/project-definition-adapter-v1-check.mjs'),'npm run check must enforce Project Definition adapter contract');

if(!process.exitCode){
  console.log('[project-definition-adapter-v1] PASS');
  console.log(JSON.stringify({commands:expectedCommands.length,service_rpcs:allowedRpcs.length,client_authorized_by:false,authenticated_rls_precheck:true}));
}

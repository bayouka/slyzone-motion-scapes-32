import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const adapterPath=path.join(root,'src','idea-canonical-adapter.js');
const entryPath=path.join(root,'src','worker-entry.js');
const packagePath=path.join(root,'package.json');

const fail=(message)=>{console.error(`[idea-canonical-adapter-v1] FAIL: ${message}`);process.exitCode=1;};
const assert=(condition,message)=>{if(!condition)fail(message);};
const read=(file)=>fs.readFileSync(file,'utf8');

let adapter,entry,pkg;
try{
  adapter=read(adapterPath);
  entry=read(entryPath);
  pkg=JSON.parse(read(packagePath));
}catch(error){
  fail(`cannot read canonical Idea adapter contract sources: ${error.message}`);
  process.exit(1);
}

const expectedCommands=['canonical.read','decision.record'];
for(const command of expectedCommands)assert(adapter.includes(`'${command}'`),`missing command ${command}`);
const commandBlock=adapter.match(/const COMMANDS=new Set\(\[([\s\S]*?)\]\);/);
assert(Boolean(commandBlock),'COMMANDS allowlist block missing');
if(commandBlock){
  const actual=[...commandBlock[1].matchAll(/'([^']+)'/g)].map(match=>match[1]);
  assert(JSON.stringify(actual)===JSON.stringify(expectedCommands),`command allowlist mismatch: ${actual.join(', ')}`);
}

assert(adapter.includes('/auth/v1/user'),'JWT verification missing');
assert(adapter.includes('/rest/v1/rpc/get_idea_workspace_projection_v1'),'user-scoped Idea RLS precheck missing');
assert(adapter.includes('p_decided_by:auth.user.id'),'decision actor must be injected from JWT');
assert(!adapter.includes('body.decided_by'),'client-controlled decided_by forbidden');
assert(!adapter.includes('body.authorized_by'),'client-controlled authorized_by forbidden');
assert(!adapter.includes('promote_canonical_approved_idea_to_project_definition_v2'),'G3 promotion must not be browser-exposed in adapter v1');
assert(!adapter.includes('SUPABASE_SERVICE_ROLE_KEY:')&&!adapter.includes('service_role:'),'service role value must never be serialized');

const allowedRpcs=[
  'get_canonical_idea_preproject_readiness_v1',
  'record_canonical_idea_decision_v1'
];
const calledRpcs=[...new Set([...adapter.matchAll(/serviceRpc\(env,'([^']+)'/g)].map(match=>match[1]))].sort();
assert(JSON.stringify(calledRpcs)===JSON.stringify([...allowedRpcs].sort()),`service RPC allowlist mismatch: ${calledRpcs.join(', ')}`);
assert(!/serviceRpc\(env\s*,\s*(?:body|command)/.test(adapter),'client-selected RPC name forbidden');

const expectedGates=['G0_BLUEPRINT_FIT','G1_IDEA_DECISION_READY','G2_GO_PROJECT','G3_PROJECT_BASELINE'];
const expectedPredicates=['FOUNDATION_READY','EVIDENCE_READY','STRATEGY_READY','PREFIGURATION_READY','DECISION_PACKAGE_READY'];
for(const gate of expectedGates)assert(entry.includes(`'${gate}'`),`health metadata missing ${gate}`);
for(const predicate of expectedPredicates)assert(entry.includes(`'${predicate}'`),`health metadata missing ${predicate}`);

assert(entry.includes("RUNTIME_VERSION='v4.5.16-project-definition-preproject-p3'"),'Worker runtime version must expose canonical preproject p3');
assert(entry.includes("import { handleCanonicalIdeaCommand } from './idea-canonical-adapter.js';"),'Worker entry must import canonical Idea adapter');
assert(entry.includes("url.pathname==='/api/ideas/canonical'"),'canonical Idea route missing');
assert(entry.includes('idea_canonical_adapter_v1'),'health metadata for canonical Idea adapter missing');
assert(entry.includes("code:'0.1.0'"),'canonical Idea adapter health code must be 0.1.0');
assert(entry.includes("active_idea_blueprint:'SITE_VITRINE@0.5'"),'active Idea Blueprint metadata must reflect live fit assignment 0.5');
assert(entry.includes("legacy_idea_blueprint_supported:'SITE_VITRINE@0.4'"),'legacy Idea Blueprint 0.4 compatibility metadata missing');
assert(entry.includes('blueprint_activation_changed_by_bridge:false'),'canonical bridge must not claim it activated Blueprint 0.5');
assert(entry.includes("predicate_persistence:'derived_not_stored'"),'derived predicate invariant missing');
assert(entry.includes('decision_actor_from_jwt:true'),'JWT decision actor health invariant missing');
assert(entry.includes('g3_promotion_browser_exposed:false'),'G3 browser exposure must remain false');
assert(entry.includes('service_role_browser_exposed:false'),'service role exposure invariant missing');

const checkScript=String(pkg.scripts?.check||'');
assert(checkScript.includes('node --check src/idea-canonical-adapter.js'),'npm run check must syntax-check canonical Idea adapter');
assert(checkScript.includes('node scripts/idea-canonical-adapter-v1-check.mjs'),'npm run check must enforce canonical Idea adapter contract');

if(!process.exitCode){
  console.log('[idea-canonical-adapter-v1] PASS');
  console.log(JSON.stringify({commands:expectedCommands.length,service_rpcs:allowedRpcs.length,formal_gates:expectedGates.length,readiness_predicates:expectedPredicates.length,active_idea_blueprint:'SITE_VITRINE@0.5',legacy_idea_blueprint_supported:'SITE_VITRINE@0.4',g3_browser_exposed:false,decision_actor_from_jwt:true}));
}

import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const boot = read('site/assets/boot.js');
const worker = read('src/worker.js');
const index = read('site/index.html');
const live = read('site/assets/live.js');
const safeBridge = read('site/assets/workflow-backend-safe-v1.js');
const runtime = read('site/runtime-config.js');

function assert(condition, message) {
  if (!condition) {
    console.error(`STABILITY CHECK FAILED: ${message}`);
    process.exit(1);
  }
}

assert(worker.includes('v4.4.7-native-progress'), 'worker health version is not v4.4.7-native-progress');
assert(index.includes('boot.js?v=4.4.7-native-progress'), 'index does not cache-bust the native-access boot');
assert(boot.includes("const VERSION = 'v4.4.7-native-progress'"), 'boot native-access version missing');
assert(boot.includes('pollIntervalMs: Math.max(60000'), 'polling floor is not 60 seconds');
assert(boot.includes('workflow-backend-safe-v1.js'), 'observer-free workflow bridge missing');
assert(boot.includes('live.js'), 'core live app missing');
assert(!boot.includes('invite-prelive-v2.js'), 'legacy pre-live invitation controller is still loaded');

for (const forbidden of [
  'auth-recovery-v1.js',
  'home-polish.js',
  'team-access-v1.js',
  'team-access-safety-v2.js',
  'team-access-submit-safety-v3.js',
  'invite-lifecycle-v1.js',
  'approval-flow-safety-v1.js',
  'product-coherence-v1.js',
  'daily-work-v1.js',
  'planning-clarity-v1.js',
  'project-lifecycle-safety-v1.js',
  'project-flow-v1.js',
  'communication-memory-v1.js',
  'meeting-agenda-v1.js',
  'resource-model-v1.js',
  'workflow-backend-v2.js',
  'project-progress-v2.js',
  'ui-quality-v1.js',
  'dialog-focus-safety-v2.js',
]) {
  assert(!boot.includes(forbidden), `forbidden enhancer still loaded: ${forbidden}`);
}

assert(live.includes('create_workspace_invite_v2'), 'native secure invitation RPC missing');
assert(live.includes('set_workspace_member_access_v1'), 'native secure member-access RPC missing');
assert(live.includes('get_project_summaries_v1'), 'server project summaries RPC missing');
assert(live.includes('set_project_pause_v1'), 'native project pause workflow missing');
assert(live.includes('complete_project_v1'), 'native project completion workflow missing');
assert(live.includes('reopen_project_v1'), 'native project reopen workflow missing');
assert(live.includes('projectServerSummaryCard'), 'native project summary card missing');
assert(live.includes('data-invite-role'), 'native invitation role UI missing');
assert(live.includes('data-member-role'), 'native member role UI missing');
assert(!live.includes('Responsabilité / écriture'), 'legacy responsibility selector remains in native access UI');
assert(!live.includes('Visibilité portefeuille'), 'legacy portfolio visibility selector remains in native access UI');
assert(!safeBridge.includes('new MutationObserver'), 'safe workflow bridge instantiates a MutationObserver');
assert(runtime.includes('https://wexfzhegiewhldkugtow.supabase.co'), 'wrong Supabase backend');

console.log('stability/native-progress production contract: ok');

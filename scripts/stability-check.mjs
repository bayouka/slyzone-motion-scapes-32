import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const boot = read('site/assets/boot.js');
const worker = read('src/worker.js');
const index = read('site/index.html');
const live = read('site/assets/live.js');
const safeBridge = read('site/assets/workflow-backend-safe-v1.js');
const resources = read('site/assets/resources-workspace-v1.js');
const resourcesCss = read('site/assets/resources-workspace-v1.css');
const runtime = read('site/runtime-config.js');

function assert(condition, message) {
  if (!condition) {
    console.error(`STABILITY CHECK FAILED: ${message}`);
    process.exit(1);
  }
}

assert(worker.includes('v4.4.10-resources-model'), 'worker health version is not v4.4.10-resources-model');
assert(index.includes('assets/boot.js?build=450'), 'index resources-model cache-bust missing');
assert(index.includes('assets/resources-workspace-v1.css'), 'resources workspace stylesheet missing');
assert(boot.includes("const VERSION = 'v4.4.10-resources-model'"), 'boot resources-model version missing');
assert(boot.includes('syncProbeIntervalMs: Math.max(15000'), 'smart sync probe floor missing');
assert(boot.includes('fullRefreshFallbackMs: Math.max(300000'), 'full refresh safety fallback missing');
assert(boot.includes('workflow-backend-safe-v1.js'), 'observer-free workflow bridge missing');
assert(boot.includes('resources-workspace-v1.js'), 'route-driven resources workspace missing');
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
assert(live.includes('get_workspace_sync_digest_v1'), 'workspace sync digest RPC missing');
assert(live.includes('smartSync'), 'smart sync controller missing');
assert(live.includes('workspaceRefreshPromise'), 'full refresh single-flight guard missing');
assert(!live.includes('Number(config.pollIntervalMs || 15000)'), 'legacy full-workspace polling remains');
assert(!live.includes('new MutationObserver'), 'core app instantiates a MutationObserver');
assert(live.includes('set_project_pause_v1'), 'native project pause workflow missing');
assert(live.includes('complete_project_v1'), 'legacy project completion fallback missing');
assert(live.includes('reopen_project_v1'), 'native project reopen workflow missing');
assert(live.includes('projectServerSummaryCard'), 'native project summary card missing');
assert(live.includes('data-invite-role'), 'native invitation role UI missing');
assert(live.includes('data-member-role'), 'native member role UI missing');
assert(!live.includes('Responsabilité / écriture'), 'legacy responsibility selector remains in native access UI');
assert(!live.includes('Visibilité portefeuille'), 'legacy portfolio visibility selector remains in native access UI');

for (const required of [
  'register_deliverable_version_v3',
  'request_deliverable_approval_v1',
  'decide_deliverable_approval_v1',
  'get_project_closure_preview_v2',
  'complete_project_v2',
  'referenceVersionIds',
  'DELIVERABLE_VERSION_IMMUTABLE',
]) {
  assert(safeBridge.includes(required), `deliverable integrity workflow missing: ${required}`);
}
assert(!safeBridge.includes("api.insert('approvals'"), 'safe bridge must not insert approvals directly');
assert(!safeBridge.includes("api.update('approvals'"), 'safe bridge must not update approvals directly');
assert(!safeBridge.includes('new MutationObserver'), 'safe workflow bridge instantiates a MutationObserver');

for (const required of [
  'create_project_resource_link_v1',
  'register_project_resource_file_v1',
  'update_project_resource_v1',
  'create_deliverable_with_first_version_v1',
  'register_deliverable_version_v3',
  'request_deliverable_approval_v1',
  'decide_deliverable_approval_v1',
]) {
  assert(resources.includes(required), `resources model workflow missing: ${required}`);
}
assert(resources.includes("routeProjectId"), 'resources workspace must be route-driven');
assert(resources.includes("window.addEventListener('hashchange'"), 'resources route activation missing');
assert(!resources.includes('new MutationObserver'), 'resources workspace instantiates a MutationObserver');
assert(!resources.includes("api.insert('approvals'"), 'resources workspace must not insert approvals directly');
assert(!resources.includes("api.update('approvals'"), 'resources workspace must not update approvals directly');
assert(resourcesCss.includes('.resources-workspace-v1'), 'resources workspace CSS root missing');
assert(resourcesCss.includes('@media(max-width:767px)'), 'resources mobile CSS contract missing');
assert(runtime.includes('https://wexfzhegiewhldkugtow.supabase.co'), 'wrong Supabase backend');

console.log('stability/resources-model production contract: ok');
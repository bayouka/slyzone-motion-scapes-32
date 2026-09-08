import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const boot = read('site/assets/boot.js');
const worker = read('src/worker.js');
const index = read('site/index.html');
const live = read('site/assets/live.js');
const safeBridge = read('site/assets/workflow-backend-safe-v1.js');
const resources = read('site/assets/resources-workspace-v2.js');
const resourcesCss = read('site/assets/resources-workspace-v1.css');
const resourcesCssV2 = read('site/assets/resources-workspace-v2.css');
const delivery = read('site/assets/delivery-workflow-v1.js');
const deliveryCss = read('site/assets/delivery-workflow-v1.css');
const library = read('site/assets/library-workspace-v1.js');
const libraryCss = read('site/assets/library-workspace-v1.css');
const communication = read('site/assets/communication-workspace-v1.js');
const communicationCss = read('site/assets/communication-workspace-v1.css');
const runtime = read('site/runtime-config.js');
const deliveryDb = read('supabase/migrations/20260908204538_delivery_approval_closure_v1.sql');
const closurePreferenceDb = read('supabase/migrations/20260908205909_delivery_closure_current_version_preference_v1.sql');
const approvalRetryDb = read('supabase/migrations/20260908210237_approval_requires_new_version_after_changes_v1.sql');
const communicationDb = read('supabase/migrations/20260908213711_communication_v3_secure_contextual_workflows.sql');
const meetingOwnerDb = read('supabase/migrations/20260908214017_communication_v3_meeting_thread_owner_fix.sql');
const communicationLegacyDb = read('supabase/migrations/20260908220327_communication_v3_legacy_rpc_hardening.sql');

function assert(condition, message) {
  if (!condition) {
    console.error(`STABILITY CHECK FAILED: ${message}`);
    process.exit(1);
  }
}

assert(worker.includes('v4.4.13-communication-v3'), 'worker health version is not v4.4.13-communication-v3');
assert(index.includes('assets/boot.js?build=453'), 'index communication cache-bust missing');
assert(index.includes('assets/resources-workspace-v1.css'), 'base resources stylesheet missing');
assert(index.includes('assets/resources-workspace-v2.css'), 'resources v2 stylesheet missing');
assert(index.includes('assets/delivery-workflow-v1.css'), 'delivery stylesheet missing');
assert(index.includes('assets/library-workspace-v1.css'), 'library stylesheet missing');
assert(index.includes('assets/communication-workspace-v1.css'), 'communication stylesheet missing');
assert(boot.includes("const VERSION = 'v4.4.13-communication-v3'"), 'boot communication version missing');
assert(boot.includes('syncProbeIntervalMs: Math.max(15000'), 'smart sync probe floor missing');
assert(boot.includes('fullRefreshFallbackMs: Math.max(300000'), 'full refresh safety fallback missing');
assert(boot.includes('delivery-workflow-v1.js'), 'exact delivery workflow missing');
assert(boot.includes('workflow-backend-safe-v1.js'), 'observer-free workflow bridge missing');
assert(boot.includes('communication-workspace-v1.js'), 'communication workspace missing');
assert(boot.includes('resources-workspace-v2.js'), 'resources v2 route workspace missing');
assert(boot.includes('library-workspace-v1.js'), 'global library missing');
assert(boot.indexOf('delivery-workflow-v1.js') < boot.indexOf('workflow-backend-safe-v1.js'), 'delivery workflow must register before legacy-safe bridge');
assert(!boot.includes('resources-workspace-v1.js?'), 'resources v1 runtime must not be loaded');
assert(!boot.includes('resources-workspace-form-guard-v1.js'), 'legacy resources focus guard must not be loaded');
assert(!boot.includes('invite-prelive-v2.js'), 'legacy invitation controller is still loaded');

for (const forbidden of [
  'auth-recovery-v1.js','home-polish.js','team-access-v1.js','team-access-safety-v2.js','team-access-submit-safety-v3.js',
  'invite-lifecycle-v1.js','approval-flow-safety-v1.js','product-coherence-v1.js','daily-work-v1.js','planning-clarity-v1.js',
  'project-lifecycle-safety-v1.js','project-flow-v1.js','communication-memory-v1.js','meeting-agenda-v1.js','resource-model-v1.js',
  'workflow-backend-v2.js','project-progress-v2.js','ui-quality-v1.js','dialog-focus-safety-v2.js',
]) assert(!boot.includes(forbidden), `forbidden enhancer still loaded: ${forbidden}`);

assert(live.includes('create_workspace_invite_v2'), 'native secure invitation RPC missing');
assert(live.includes('set_workspace_member_access_v1'), 'native member-access RPC missing');
assert(live.includes('get_project_summaries_v1'), 'server project summaries missing');
assert(live.includes('get_workspace_sync_digest_v1'), 'workspace sync digest missing');
assert(live.includes('smartSync'), 'smart sync controller missing');
assert(live.includes('workspaceRefreshPromise'), 'refresh single-flight guard missing');
assert(!live.includes('Number(config.pollIntervalMs || 15000)'), 'legacy full-workspace polling remains');
assert(!live.includes('new MutationObserver'), 'core app instantiates a MutationObserver');

for (const required of ['register_deliverable_version_v3','request_deliverable_approval_v1','decide_deliverable_approval_v1','DELIVERABLE_VERSION_IMMUTABLE']) {
  assert(safeBridge.includes(required), `safe bridge deliverable contract missing: ${required}`);
}
assert(!safeBridge.includes("api.insert('approvals'"), 'safe bridge must not insert approvals directly');
assert(!safeBridge.includes("api.update('approvals'"), 'safe bridge must not update approvals directly');
assert(!safeBridge.includes('new MutationObserver'), 'safe bridge instantiates a MutationObserver');

for (const required of [
  'create_project_resource_link_v1','register_project_resource_file_v1','update_project_resource_v1','create_deliverable_with_first_version_v1',
  'register_deliverable_version_v3','request_deliverable_approval_v1','decide_deliverable_approval_v1','get_project_delivery_history_v1',
  'request_note','decision_note','created_by','sharedVersion','routeProjectId'
]) assert(resources.includes(required), `resources v2 contract missing: ${required}`);
assert(resources.includes("window.addEventListener('hashchange'"), 'resources v2 route activation missing');
assert(!resources.includes('new MutationObserver'), 'resources v2 instantiates a MutationObserver');
assert(!resources.includes("api.insert('approvals'"), 'resources v2 must not insert approvals directly');
assert(!resources.includes("api.update('approvals'"), 'resources v2 must not update approvals directly');
assert(resourcesCss.includes('.resources-workspace-v1'), 'base resources CSS root missing');
assert(resourcesCssV2.includes('.resources-workspace-v2'), 'resources v2 CSS root missing');

for (const required of [
  'get_project_closure_preview_v3','complete_project_v3','get_project_delivery_history_v1','reopen_project_v1',
  'reference_version_ids','sequence_no','approval_status','start-complete-project','completed delivery page'
]) assert(delivery.includes(required), `delivery lifecycle contract missing: ${required}`);
assert(delivery.includes("document.addEventListener('click'"), 'delivery click capture missing');
assert(delivery.includes('stopImmediatePropagation'), 'delivery must own closure click before legacy handlers');
assert(!delivery.includes('new MutationObserver'), 'delivery module instantiates a MutationObserver');
assert(deliveryCss.includes('.dw-backdrop'), 'delivery modal CSS missing');
assert(deliveryCss.includes('.delivery-completed-page-v1'), 'completed project CSS missing');

for (const required of ["api.select('project_resources'","api.select('deliverables'","api.select('deliverable_versions'","api.select('approvals'","api.select('deliverable_version_shares'",'safeExternalUrl','signedUrl','Ressource de travail','Livrable']) {
  assert(library.includes(required), `global library contract missing: ${required}`);
}
assert(library.includes("location.hash || ''"), 'library must not activate on an empty auth hash');
assert(!library.includes('new MutationObserver'), 'global library instantiates a MutationObserver');
assert(libraryCss.includes('.library-workspace-v1'), 'library CSS root missing');

for (const required of [
  'send_message_v3','edit_message_v3','delete_message_v3','mark_conversation_read_v3','search_messages_v1',
  'get_conversation_capabilities_v1','get_or_create_direct_v2','create_group_direct_v2','create_team_topic_v2','create_project_topic_v2',
  'get_or_create_meeting_conversation_v1','link_direct_to_project_v3','set_conversation_notifications_v2','set_conversation_status_v2',
  'create_action_from_message_v2','create_request_from_message_v2','create_decision_from_message_v2','get_workspace_sync_digest_v1'
]) assert(communication.includes(required), `communication v3 workflow missing: ${required}`);
assert(communication.includes("window.addEventListener('hashchange'"), 'communication route activation missing');
assert(communication.includes("'/messages/'"), 'communication exact message routing missing');
assert(communication.includes('MAX_FILES=10'), 'communication attachment count limit missing');
assert(communication.includes('MAX_FILE_SIZE=25*1024*1024'), 'communication attachment size limit missing');
assert(communication.includes('composerHasDraft'), 'communication draft protection missing');
assert(!communication.includes('new MutationObserver'), 'communication workspace instantiates MutationObserver');
assert(!communication.includes("api.insert('messages'"), 'communication workspace must use message RPCs');
assert(!communication.includes("api.insert('mentions'"), 'communication workspace must use mention-aware RPCs');
assert(!communication.includes("api.insert('attachments'"), 'communication workspace must use atomic message RPC for attachments');
assert(communicationCss.includes('.communication-workspace-v1'), 'communication CSS root missing');
assert(communicationCss.includes('@media(max-width:767px)'), 'communication mobile CSS contract missing');

for (const required of ['create table if not exists public.project_closures','complete_project_v3','get_project_delivery_history_v1','approval_requested','approval_approved','approval_changes_requested','approval_replaced','APPROVAL_VERSION_SUPERSEDED']) {
  assert(deliveryDb.includes(required), `delivery database contract missing: ${required}`);
}
assert(closurePreferenceDb.includes('alter column closure_id set not null'), 'closure snapshots must belong to a structured closure');
assert(closurePreferenceDb.includes('dv.version_number=(select max'), 'closure recommendation must prefer current version');
assert(approvalRetryDb.includes('APPROVAL_NEW_VERSION_REQUIRED'), 'changes-requested version must require a new immutable version');

for (const required of ['send_message_v3','search_messages_v1','get_or_create_meeting_conversation_v1','link_direct_to_project_v3','mark_conversation_read_v3','can_announce_conversation_v1','MESSAGE_ATTACHMENT_LIMIT']) {
  assert(communicationDb.includes(required), `communication database contract missing: ${required}`);
}
assert(meetingOwnerDb.includes('v_meeting.created_by'), 'meeting thread must remain owned by meeting creator');
for (const required of ['send_message_with_mentions_v2','public.send_message_v3','public.edit_message_v3','public.delete_message_v3','public.mark_conversation_read_v3','public.link_direct_to_project_v3','ATTACHMENT_MESSAGE_AUTHOR_REQUIRED']) {
  assert(communicationLegacyDb.includes(required), `legacy communication hardening missing: ${required}`);
}
assert(runtime.includes('https://wexfzhegiewhldkugtow.supabase.co'), 'wrong Supabase backend');

console.log('stability/communication-v3 production contract: ok');

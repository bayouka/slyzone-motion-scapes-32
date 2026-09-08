import fs from 'node:fs';

const read=(path)=>fs.readFileSync(path,'utf8');
const boot=read('site/assets/boot.js');
const worker=read('src/worker.js');
const index=read('site/index.html');
const live=read('site/assets/live.js');
const safeBridge=read('site/assets/workflow-backend-safe-v1.js');
const resources=read('site/assets/resources-workspace-v2.js');
const delivery=read('site/assets/delivery-workflow-v1.js');
const library=read('site/assets/library-workspace-v1.js');
const communication=read('site/assets/communication-workspace-v1.js');
const communicationCss=read('site/assets/communication-workspace-v1.css');
const runtime=read('site/runtime-config.js');

function assert(condition,message){if(!condition){console.error(`STABILITY CHECK FAILED: ${message}`);process.exit(1);}}

assert(worker.includes('v4.4.13-communication-v3'),'worker health version is not v4.4.13-communication-v3');
assert(index.includes('assets/boot.js?build=453'),'index communication cache-bust missing');
assert(index.includes('assets/communication-workspace-v1.css'),'communication stylesheet missing');
assert(boot.includes("const VERSION = 'v4.4.13-communication-v3'"),'boot communication version missing');
assert(boot.includes('syncProbeIntervalMs: Math.max(15000'),'smart sync probe floor missing');
assert(boot.includes('fullRefreshFallbackMs: Math.max(300000'),'full refresh safety fallback missing');
for(const required of ['live.js','delivery-workflow-v1.js','workflow-backend-safe-v1.js','communication-workspace-v1.js','resources-workspace-v2.js','library-workspace-v1.js']) assert(boot.includes(required),`runtime module missing: ${required}`);
assert(boot.includes('native messages view kept'),'communication fallback contract missing');

for(const forbidden of ['invite-prelive-v2.js','auth-recovery-v1.js','home-polish.js','team-access-v1.js','team-access-safety-v2.js','team-access-submit-safety-v3.js','invite-lifecycle-v1.js','approval-flow-safety-v1.js','product-coherence-v1.js','daily-work-v1.js','planning-clarity-v1.js','project-lifecycle-safety-v1.js','project-flow-v1.js','communication-memory-v1.js','meeting-agenda-v1.js','resource-model-v1.js','workflow-backend-v2.js','project-progress-v2.js','ui-quality-v1.js','dialog-focus-safety-v2.js']) assert(!boot.includes(forbidden),`forbidden enhancer still loaded: ${forbidden}`);

assert(live.includes('create_workspace_invite_v2'),'native invitation workflow missing');
assert(live.includes('set_workspace_member_access_v1'),'native access workflow missing');
assert(live.includes('get_project_summaries_v1'),'server project summaries missing');
assert(live.includes('get_workspace_sync_digest_v1'),'workspace sync digest missing');
assert(live.includes('workspaceRefreshPromise'),'refresh single-flight guard missing');
assert(!live.includes('new MutationObserver'),'core app instantiates MutationObserver');

for(const required of ['register_deliverable_version_v3','request_deliverable_approval_v1','decide_deliverable_approval_v1']) assert(safeBridge.includes(required),`deliverable safe bridge missing: ${required}`);
assert(!safeBridge.includes('new MutationObserver'),'safe bridge instantiates MutationObserver');
assert(!resources.includes('new MutationObserver'),'resources workspace instantiates MutationObserver');
assert(!delivery.includes('new MutationObserver'),'delivery workspace instantiates MutationObserver');
assert(!library.includes('new MutationObserver'),'library workspace instantiates MutationObserver');

for(const required of [
  'send_message_v3','edit_message_v2','delete_message_v3','mark_conversation_read_v3','search_messages_v1',
  'get_conversation_capabilities_v1','get_or_create_direct_v2','create_group_direct_v2','create_team_topic_v2','create_project_topic_v2',
  'get_or_create_meeting_conversation_v1','link_direct_to_project_v3','set_conversation_notifications_v2','set_conversation_status_v2',
  'create_action_from_message_v2','create_request_from_message_v2','create_decision_from_message_v2','get_workspace_sync_digest_v1'
]) assert(communication.includes(required),`communication v3 workflow missing: ${required}`);
assert(communication.includes("window.addEventListener('hashchange'"),'communication route activation missing');
assert(communication.includes("'/messages/'"),'communication exact message routing missing');
assert(communication.includes('MAX_FILES=10'),'communication attachment count limit missing');
assert(communication.includes('MAX_FILE_SIZE=25*1024*1024'),'communication attachment size limit missing');
assert(communication.includes('composerHasDraft'),'communication draft protection missing');
assert(communication.includes('native')===false,'communication module should not patch native implementation by DOM mutation');
assert(!communication.includes('new MutationObserver'),'communication workspace instantiates MutationObserver');
assert(!communication.includes("api.insert('messages'"),'communication workspace must use message RPCs');
assert(!communication.includes("api.insert('mentions'"),'communication workspace must use mention-aware RPCs');
assert(!communication.includes("api.insert('attachments'"),'communication workspace must use atomic message RPC for attachments');
assert(communicationCss.includes('.communication-workspace-v1'),'communication CSS root missing');
assert(communicationCss.includes('@media(max-width:767px)'),'communication mobile CSS contract missing');

assert(runtime.includes('https://wexfzhegiewhldkugtow.supabase.co'),'wrong Supabase backend');
console.log('stability/communication-v3 production contract: ok');
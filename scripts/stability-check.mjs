import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const boot=read('site/assets/boot.js');
const worker=read('src/worker.js');
const index=read('site/index.html');
const live=read('site/assets/live.js');
const safeBridge=read('site/assets/workflow-backend-safe-v1.js');
const resources=read('site/assets/resources-workspace-v2.js');
const resourcesCss=read('site/assets/resources-workspace-v1.css');
const resourcesCssV2=read('site/assets/resources-workspace-v2.css');
const delivery=read('site/assets/delivery-workflow-v1.js');
const deliveryCss=read('site/assets/delivery-workflow-v1.css');
const library=read('site/assets/library-workspace-v1.js');
const libraryCss=read('site/assets/library-workspace-v1.css');
const communication=read('site/assets/communication-workspace-v1.js');
const communicationCss=read('site/assets/communication-workspace-v1.css');
const runtime=read('site/runtime-config.js');
const deliveryDb=read('supabase/migrations/20260908204538_delivery_approval_closure_v1.sql');
const closurePreferenceDb=read('supabase/migrations/20260908205909_delivery_closure_current_version_preference_v1.sql');
const approvalRetryDb=read('supabase/migrations/20260908210237_approval_requires_new_version_after_changes_v1.sql');
const communicationDb=read('supabase/migrations/20260908213711_communication_v3_secure_contextual_workflows.sql');
const meetingOwnerDb=read('supabase/migrations/20260908214017_communication_v3_meeting_thread_owner_fix.sql');
const communicationLegacyDb=read('supabase/migrations/20260908220327_communication_v3_legacy_rpc_hardening.sql');
const communicationStorageDb=read('supabase/migrations/20260908220806_communication_v3_message_storage_paths.sql');
const communicationDeleteDb=read('supabase/migrations/20260908221034_communication_v3_deleted_message_privacy.sql');

function assert(ok,msg){if(!ok){console.error(`STABILITY CHECK FAILED: ${msg}`);process.exit(1);}}
function all(text,items,label){for(const item of items)assert(text.includes(item),`${label}: ${item}`);}

assert(worker.includes('v4.4.13-communication-v3'),'worker health version');
assert(index.includes('assets/boot.js?build=453'),'cache bust 453');
all(index,['assets/resources-workspace-v1.css','assets/resources-workspace-v2.css','assets/delivery-workflow-v1.css','assets/library-workspace-v1.css','assets/communication-workspace-v1.css'],'stylesheet missing');
all(boot,["const VERSION = 'v4.4.13-communication-v3'",'syncProbeIntervalMs: Math.max(15000','fullRefreshFallbackMs: Math.max(300000','delivery-workflow-v1.js','workflow-backend-safe-v1.js','communication-workspace-v1.js','resources-workspace-v2.js','library-workspace-v1.js'],'boot contract missing');
assert(boot.indexOf('delivery-workflow-v1.js')<boot.indexOf('workflow-backend-safe-v1.js'),'delivery must register before safe bridge');
for(const forbidden of ['resources-workspace-v1.js?','resources-workspace-form-guard-v1.js','invite-prelive-v2.js','auth-recovery-v1.js','home-polish.js','team-access-v1.js','team-access-safety-v2.js','team-access-submit-safety-v3.js','invite-lifecycle-v1.js','approval-flow-safety-v1.js','product-coherence-v1.js','daily-work-v1.js','planning-clarity-v1.js','project-lifecycle-safety-v1.js','project-flow-v1.js','communication-memory-v1.js','meeting-agenda-v1.js','resource-model-v1.js','workflow-backend-v2.js','project-progress-v2.js','ui-quality-v1.js','dialog-focus-safety-v2.js']) assert(!boot.includes(forbidden),`forbidden enhancer loaded: ${forbidden}`);

all(live,['create_workspace_invite_v2','set_workspace_member_access_v1','get_project_summaries_v1','get_workspace_sync_digest_v1','smartSync','workspaceRefreshPromise'],'core native contract missing');
assert(!live.includes('Number(config.pollIntervalMs || 15000)'),'legacy full polling remains');
assert(!live.includes('new MutationObserver'),'core MutationObserver');

all(safeBridge,['register_deliverable_version_v3','request_deliverable_approval_v1','decide_deliverable_approval_v1','DELIVERABLE_VERSION_IMMUTABLE'],'deliverable bridge missing');
assert(!safeBridge.includes("api.insert('approvals'"),'direct approval insert');
assert(!safeBridge.includes("api.update('approvals'"),'direct approval update');
assert(!safeBridge.includes('new MutationObserver'),'safe bridge MutationObserver');

all(resources,['create_project_resource_link_v1','register_project_resource_file_v1','update_project_resource_v1','create_deliverable_with_first_version_v1','register_deliverable_version_v3','request_deliverable_approval_v1','decide_deliverable_approval_v1','get_project_delivery_history_v1','request_note','decision_note','created_by','sharedVersion','routeProjectId',"window.addEventListener('hashchange'"],'resources contract missing');
assert(!resources.includes('new MutationObserver'),'resources MutationObserver');
assert(!resources.includes("api.insert('approvals'"),'resources direct approval insert');
assert(!resources.includes("api.update('approvals'"),'resources direct approval update');
assert(resourcesCss.includes('.resources-workspace-v1'),'resources css v1');
assert(resourcesCssV2.includes('.resources-workspace-v2'),'resources css v2');

all(delivery,['get_project_closure_preview_v3','complete_project_v3','get_project_delivery_history_v1','reopen_project_v1','reference_version_ids','sequence_no','approval_status','start-complete-project','completed delivery page',"document.addEventListener('click'",'stopImmediatePropagation'],'delivery contract missing');
assert(!delivery.includes('new MutationObserver'),'delivery MutationObserver');
assert(deliveryCss.includes('.dw-backdrop')&&deliveryCss.includes('.delivery-completed-page-v1'),'delivery css');

all(library,["api.select('project_resources'","api.select('deliverables'","api.select('deliverable_versions'","api.select('approvals'","api.select('deliverable_version_shares'",'safeExternalUrl','signedUrl','Ressource de travail','Livrable',"location.hash || ''"],'library contract missing');
assert(!library.includes('new MutationObserver'),'library MutationObserver');
assert(libraryCss.includes('.library-workspace-v1'),'library css');

all(communication,['send_message_v3','edit_message_v2','delete_message_v3','mark_conversation_read_v3','search_messages_v1','get_conversation_capabilities_v1','get_or_create_direct_v2','create_group_direct_v2','create_team_topic_v2','create_project_topic_v2','get_or_create_meeting_conversation_v1','link_direct_to_project_v3','set_conversation_notifications_v2','set_conversation_status_v2','create_action_from_message_v2','create_request_from_message_v2','create_decision_from_message_v2','get_workspace_sync_digest_v1',"window.addEventListener('hashchange'",'#/messages/','MAX_FILES=10','MAX_FILE_SIZE=25*1024*1024','composerHasDraft',"api.upload('workspace-files'"],'communication contract missing');
assert(!communication.includes('new MutationObserver'),'communication MutationObserver');
assert(!communication.includes("api.insert('messages'"),'direct message insert');
assert(!communication.includes("api.insert('mentions'"),'direct mention insert');
assert(!communication.includes("api.insert('attachments'"),'direct attachment insert');
assert(communicationCss.includes('.communication-workspace-v1')&&communicationCss.includes('@media(max-width:767px)'),'communication responsive css');

all(deliveryDb,['create table if not exists public.project_closures','complete_project_v3','get_project_delivery_history_v1','approval_requested','approval_approved','approval_changes_requested','approval_replaced','APPROVAL_VERSION_SUPERSEDED'],'delivery db missing');
assert(closurePreferenceDb.includes('alter column closure_id set not null'),'closure id required');
assert(closurePreferenceDb.includes('dv.version_number=(select max'),'closure current version preference');
assert(approvalRetryDb.includes('APPROVAL_NEW_VERSION_REQUIRED'),'approval retry guard');

all(communicationDb,['send_message_v3','search_messages_v1','get_or_create_meeting_conversation_v1','link_direct_to_project_v3','mark_conversation_read_v3','can_announce_conversation_v1','MESSAGE_ATTACHMENT_LIMIT'],'communication db missing');
assert(meetingOwnerDb.includes('v_meeting.created_by'),'meeting owner fix');
all(communicationLegacyDb,['send_message_with_mentions_v2','public.send_message_v3','public.edit_message_v3','public.delete_message_v3','public.mark_conversation_read_v3','public.link_direct_to_project_v3','ATTACHMENT_MESSAGE_AUTHOR_REQUIRED'],'legacy hardening missing');
all(communicationStorageDb,["split_part(p_name,'/',2)='messages'",'conversation_id','public.attachments','not exists(select 1 from public.attachments'],'message storage missing');
assert(communicationDeleteDb.includes("body='Message supprimé'"),'deleted body scrub');
assert(communicationDeleteDb.includes('m.deleted_at is null'),'deleted attachment privacy');
assert(runtime.includes('https://wexfzhegiewhldkugtow.supabase.co'),'wrong Supabase backend');

console.log('stability/communication-v3 production contract: ok');

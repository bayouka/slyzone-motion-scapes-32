import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const RELEASE='v4.5.12-v6-core-p1';
const BUILD='520';
const boot=read('site/assets/boot.js');
const worker=read('src/worker.js');
const index=read('site/index.html');
const live=read('site/assets/live.js');
const homeV6=read('site/assets/home-v6.js');
const projectsV6=read('site/assets/projects-v6.js');
const workV6=read('site/assets/work-v6.js');
const designV6=read('site/assets/design-v6.css');
const homeV6Css=read('site/assets/home-v6.css');
const projectsV6Css=read('site/assets/projects-v6.css');
const workV6Css=read('site/assets/work-v6.css');
const safeBridge=read('site/assets/workflow-backend-safe-v1.js');
const projectAccess=read('site/assets/project-access-v1.js');
const projectMessagesRoute=read('site/assets/project-messages-route-v1.js');
const approvalRoute=read('site/assets/approval-route-v1.js');
const meeting=read('site/assets/meeting-workflow-v1.js');
const work=read('site/assets/work-workflow-v1.js');
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

assert(worker.includes(RELEASE),'worker health version');
assert(index.includes(`assets/boot.js?build=${BUILD}`),`cache bust ${BUILD}`);
assert(index.includes('assets/design-v5.css?v=5.0.5-roadmap-p1'),'V5 design baseline retained');
all(index,['assets/design-v6.css?v=6.0.0-shell-p1','assets/home-v6.css?v=6.0.0-home-p1','assets/projects-v6.css?v=6.0.0-project-p1','assets/work-v6.css?v=6.0.0-work-p1'],'V6 stylesheet missing');
all(index,['assets/call-native-v1.css','assets/resources-workspace-v1.css','assets/resources-workspace-v2.css','assets/delivery-workflow-v1.css','assets/library-workspace-v1.css','assets/communication-workspace-v1.css'],'stylesheet missing');
all(boot,[`const VERSION = '${RELEASE}'`,'syncProbeIntervalMs: Math.max(15000','fullRefreshFallbackMs: Math.max(300000','home-v6.js','projects-v6.js','work-v6.js','project-access-v1.js','project-messages-route-v1.js','delivery-workflow-v1.js','meeting-workflow-v1.js','work-workflow-v1.js','workflow-backend-safe-v1.js','communication-workspace-v1.js','resources-workspace-v2.js','approval-route-v1.js','library-workspace-v1.js'],'boot contract missing');
assert(boot.indexOf('live.js')<boot.indexOf('home-v6.js'),'Home V6 must load after live');
assert(boot.indexOf('home-v6.js')<boot.indexOf('projects-v6.js'),'Projects V6 must load after Home V6');
assert(boot.indexOf('projects-v6.js')<boot.indexOf('work-v6.js'),'Work V6 must load after Projects V6');
assert(boot.indexOf('work-v6.js')<boot.indexOf('project-access-v1.js'),'V6 presentation owners must load before domain owners');
assert(boot.indexOf('delivery-workflow-v1.js')<boot.indexOf('workflow-backend-safe-v1.js'),'delivery must register before safe bridge');
assert(boot.indexOf('meeting-workflow-v1.js')<boot.indexOf('workflow-backend-safe-v1.js'),'Meeting V2 must register before safe bridge');
assert(boot.indexOf('work-workflow-v1.js')<boot.indexOf('workflow-backend-safe-v1.js'),'Work owner must register before safe bridge');
assert(boot.indexOf('resources-workspace-v2.js')<boot.indexOf('approval-route-v1.js'),'Resources V2 must load before approval routing');
assert(!boot.includes('communication workspace unavailable; native messages view kept'),'Communication V3 fallback reintroduced');
assert(!boot.includes('resources v2 unavailable; native resources view kept'),'Resources V2 fallback reintroduced');
for(const forbidden of ['resources-workspace-v1.js?','resources-workspace-form-guard-v1.js','invite-prelive-v2.js','auth-recovery-v1.js','home-polish.js','team-access-v1.js','team-access-safety-v2.js','team-access-submit-safety-v3.js','invite-lifecycle-v1.js','approval-flow-safety-v1.js','product-coherence-v1.js','daily-work-v1.js','planning-clarity-v1.js','project-lifecycle-safety-v1.js','project-flow-v1.js','communication-memory-v1.js','meeting-agenda-v1.js','resource-model-v1.js','workflow-backend-v2.js','project-progress-v2.js','ui-quality-v1.js','dialog-focus-safety-v2.js']) assert(!boot.includes(forbidden),`forbidden enhancer loaded: ${forbidden}`);

for(const [name,code] of [['Home V6',homeV6],['Projects V6',projectsV6],['Work V6',workV6]]){
  assert(!code.includes('MutationObserver'),`${name} MutationObserver`);
  assert(!code.includes('SupabaseBrowserClient'),`${name} must remain presentation-only`);
  for(const forbidden of ['api.rpc','api.insert','api.update','api.remove']) assert(!code.includes(forbidden),`${name} backend mutation/reference reintroduced: ${forbidden}`);
}
all(homeV6,['__4B4C_HOME_V6_OWNER__','Mets-moi à jour','trapDialogFocus'],'Home V6 contract missing');
all(projectsV6,['__4B4C_PROJECTS_V6_OWNER__','Maintenant','Pourquoi','Ensuite','projectCardRank'],'Projects V6 contract missing');
all(workV6,['__4B4C_WORK_V6_PRESENTATION_OWNER__','work-v6-primary-view','work-v6-secondary-view','Cause du blocage','roadmap-v6-focus-strip'],'Work V6 presentation contract missing');
all(designV6,['--v6-bg:','--v6-surface:',':focus-visible','prefers-reduced-motion:reduce'],'Design V6 contract missing');
assert(homeV6Css.includes('.home-v6-focus-strip')&&homeV6Css.includes('@media(max-width:767px)'),'Home V6 responsive css');
assert(projectsV6Css.includes('.project-v6-focus-strip')&&projectsV6Css.includes('@media(max-width:767px)'),'Projects V6 responsive css');
assert(workV6Css.includes('.work-v6-focus-strip')&&workV6Css.includes('.roadmap-v6-focus-strip')&&workV6Css.includes('@media(max-width:767px)'),'Work V6 responsive css');

all(projectAccess,['create_project_with_access_setup_v1','Projet d’équipe','Projet restreint'],'project access owner missing');
all(projectMessagesRoute,['kind=eq.project','routingContextReady','#/messages/'],'project message route owner missing');
all(approvalRoute,['[data-action="open-approval"],[data-action="approval-decision"]','/resources?approval=','data-rw-action="decide-approval"','focusAttempts >= 40'],'approval route owner missing');
assert(!approvalRoute.includes('MutationObserver'),'approval route MutationObserver');

all(meeting,['create_meeting_with_attendees_v2','update_meeting_v2','set_meeting_response_v2',"['meeting', 'meeting-detail']",'[data-action="meeting-response"]','MEETING_FINALIZED_STATUS_IMMUTABLE','GUEST_MEETING_REQUIRES_SHARED_PROJECT','WORKSPACE_MEETING_INTERNAL_ONLY'],'Meeting V2 owner missing');
assert(!meeting.includes("api.insert('meetings'"),'Meeting direct insert reintroduced');
assert(!meeting.includes("api.update('meetings'"),'Meeting direct update reintroduced');
assert(!meeting.includes("api.update('meeting_attendees'"),'Meeting RSVP direct update reintroduced');
assert(!meeting.includes('MutationObserver'),'Meeting owner MutationObserver');

all(work,['__4B4C_WORK_WORKFLOW_OWNER__','create_action_v1','update_action_v1','set_action_status_v1','create_milestone_v1','update_milestone_v1',"['action', 'action-edit', 'milestone', 'milestone-edit']",'[data-action="delete-action"]','[data-status-action]','stopImmediatePropagation'],'Work owner missing');
assert(work.includes("api.remove('actions'"),'Work owner action delete missing');
assert(!work.includes("api.insert('actions'"),'Work owner direct action insert reintroduced');
assert(!work.includes("api.insert('milestones'"),'Work owner direct milestone insert reintroduced');
assert(!work.includes("api.update('milestones'"),'Work owner direct milestone update reintroduced');
assert(!work.includes('MutationObserver'),'Work owner MutationObserver');

all(live,['open-call-picker-v1','start_private_call_v2','invite_to_call_v1','respond_call_invite_v1','send_call_signal_v1','call-stage-focus-v2','call-pip-v2','call-minimize-v1','2b2c:start-call','call-stage-speaker-v3','getDisplayMedia','RTCPeerConnection','call-switch-camera-v1','facingMode:{ideal:\'user\'}','call-prejoin-confirm-v1','open-project-call-v1','open-meeting-call-v1','callPickerCapacityV1','call-screen-priority-v1','heartbeat_call_v1','call-shell-pro-v4','requestEndActiveCallV1','call-fullscreen-v1','call-presence-chip-v5','call-prejoin-context-v5','resumableCallV1','formatCallDurationV1','create_workspace_invite_v2','set_workspace_member_access_v1','get_project_summaries_v1','get_workspace_sync_digest_v1','smartSync','workspaceRefreshPromise'],'core native contract missing');
assert(!live.includes('Number(config.pollIntervalMs || 15000)'),'legacy full polling remains');
assert(!live.includes('new MutationObserver'),'core MutationObserver');

all(safeBridge,['register_deliverable_version_v3','request_deliverable_approval_v1','decide_deliverable_approval_v1','DELIVERABLE_VERSION_IMMUTABLE'],'legacy-safe bridge contract missing');
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

all(communication,['send_message_v3','edit_message_v2','delete_message_v3','mark_conversation_read_v3','search_messages_v1','get_conversation_capabilities_v1','get_or_create_direct_v2','create_group_direct_v2','create_team_topic_v2','create_project_topic_v2','get_or_create_meeting_conversation_v1','link_direct_to_project_v3','set_conversation_notifications_v2','set_conversation_status_v2','create_action_from_message_v2','create_request_from_message_v2','create_decision_from_message_v2','get_workspace_sync_digest_v1',"window.addEventListener('hashchange'",'#/messages/','MAX_FILES=10','data-cw-action="call-conversation"','2b2c:start-call','MAX_FILE_SIZE=25*1024*1024','composerHasDraft',"api.upload('workspace-files'"],'communication contract missing');
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

console.log(`stability/${RELEASE} build ${BUILD} production contract: ok`);

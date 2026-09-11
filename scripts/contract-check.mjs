import fs from 'node:fs';

const live=fs.readFileSync('site/assets/live.js','utf8');
const css=fs.readFileSync('site/assets/live.css','utf8');
const boot=fs.readFileSync('site/assets/boot.js','utf8');
const runtime=fs.readFileSync('site/runtime-config.js','utf8');
const projectAccess=fs.readFileSync('site/assets/project-access-v1.js','utf8');
const projectMessagesRoute=fs.readFileSync('site/assets/project-messages-route-v1.js','utf8');
const approvalRoute=fs.readFileSync('site/assets/approval-route-v1.js','utf8');
const meeting=fs.readFileSync('site/assets/meeting-workflow-v1.js','utf8');
const work=fs.readFileSync('site/assets/work-workflow-v1.js','utf8');
const communication=fs.readFileSync('site/assets/communication-workspace-v1.js','utf8');
const resources=fs.readFileSync('site/assets/resources-workspace-v2.js','utf8');
const delivery=fs.readFileSync('site/assets/delivery-workflow-v1.js','utf8');

const checks=[
  ['meeting RSVP UI still present', live.includes('meeting-rsvp-v432') && live.includes('data-action="meeting-response"')],
  ['Meeting V2 owns creation', meeting.includes('create_meeting_with_attendees_v2') && !meeting.includes("api.insert('meetings'")],
  ['Meeting V2 owns detail updates', meeting.includes('update_meeting_v2') && !meeting.includes("api.update('meetings'")],
  ['Meeting V2 owns RSVP', meeting.includes('set_meeting_response_v2') && !meeting.includes("api.update('meeting_attendees'")],
  ['Meeting owner loads before compatibility bridge', boot.indexOf('meeting-workflow-v1.js') < boot.indexOf('workflow-backend-safe-v1.js')],
  ['Work owner owns action create/edit', work.includes('create_action_v1') && work.includes('update_action_v1')],
  ['Work owner owns action status and block flow', work.includes('set_action_status_v1') && work.includes('[data-status-action]') && work.includes('ACTION_BLOCK_REASON_REQUIRED')],
  ['Work owner owns action deletion under RLS', work.includes('[data-action="delete-action"]') && work.includes("api.remove('actions'" )],
  ['Work owner owns roadmap create/edit', work.includes('create_milestone_v1') && work.includes('update_milestone_v1')],
  ['Work owner captures historical forms', work.includes("['action', 'action-edit', 'milestone', 'milestone-edit']") && work.includes('stopImmediatePropagation')],
  ['Work owner loads before compatibility bridge', boot.indexOf('work-workflow-v1.js') < boot.indexOf('workflow-backend-safe-v1.js')],
  ['message refresh guard exists', live.includes('messageLoads: new Set()') && live.includes('state.unreadConversations.get(conversation.id)')],
  ['project cache rebuilt on sync', live.includes('state.projectCache = new Map(projects.map(project=>')],
  ['sync failures surfaced', live.includes('sync-alert-v432') && live.includes("action==='retry-sync'")],
  ['workspace-scoped access reset', live.includes('project_id=in.(') && !live.includes("await api.remove('project_members',\`user_id=eq.\${member.user_id}\`);")],
  ['project access owner is access-aware', projectAccess.includes('create_project_with_access_setup_v1') && projectAccess.includes('Projet restreint')],
  ['project messages route into Communication V3', projectMessagesRoute.includes('kind=eq.project') && projectMessagesRoute.includes('#/messages/') && projectMessagesRoute.includes('routingContextReady')],
  ['Communication V3 owns effective messaging', communication.includes('send_message_v3') && communication.includes('mark_conversation_read_v3') && communication.includes("window.addEventListener('hashchange'")],
  ['Resources V2 owns deliverable creation', resources.includes('create_deliverable_with_first_version_v1')],
  ['Resources V2 owns immutable version allocation', resources.includes('register_deliverable_version_v3')],
  ['Resources V2 owns approval request and decision', resources.includes('request_deliverable_approval_v1') && resources.includes('decide_deliverable_approval_v1')],
  ['approval attention routes into Resources V2', approvalRoute.includes('[data-action="open-approval"],[data-action="approval-decision"]') && approvalRoute.includes('/resources?approval=') && approvalRoute.includes('data-rw-action="decide-approval"')],
  ['approval routing is bounded and event-driven', approvalRoute.includes('focusAttempts >= 40') && !approvalRoute.includes('MutationObserver')],
  ['Delivery workflow owns closure and reopen', delivery.includes('get_project_closure_preview_v3') && delivery.includes('complete_project_v3') && delivery.includes('reopen_project_v1')],
  ['state reset clears collaboration caches', live.includes('conversationMembers:[]') && live.includes('deliverableVersions:[]') && live.includes('messageLoads:new Set()')],
  ['Home V4.3 contract still present', live.includes('v43-home-grid') && css.includes('4b4c V4.3')],
  ['Supabase backend is correct', runtime.includes('wexfzhegiewhldkugtow.supabase.co')],
  ['boot fallback stays canonical', boot.includes('Configuration 2b2c indisponible') && !boot.includes('assets/app.js')],
  ['Communication V3 is mandatory', boot.includes('communication-workspace-v1.js') && !boot.includes('communication workspace unavailable; native messages view kept')],
  ['Resources V2 is mandatory', boot.includes('resources-workspace-v2.js') && !boot.includes('resources v2 unavailable; native resources view kept')],
  ['approval routing loads after Resources V2', boot.indexOf('resources-workspace-v2.js') < boot.indexOf('approval-route-v1.js')],
];

const failed=checks.filter(([,ok])=>!ok);
for(const [name,ok] of checks) console.log((ok?'✓':'✗')+' '+name);
if(failed.length){
  console.error('\n'+failed.length+' collaboration contract check(s) failed.');
  process.exit(1);
}
console.log('\n'+checks.length+' collaboration contracts verified.');

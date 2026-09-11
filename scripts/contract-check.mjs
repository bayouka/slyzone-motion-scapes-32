import fs from 'node:fs';

const live=fs.readFileSync('site/assets/live.js','utf8');
const css=fs.readFileSync('site/assets/live.css','utf8');
const boot=fs.readFileSync('site/assets/boot.js','utf8');
const runtime=fs.readFileSync('site/runtime-config.js','utf8');
const projectAccess=fs.readFileSync('site/assets/project-access-v1.js','utf8');
const projectMessagesRoute=fs.readFileSync('site/assets/project-messages-route-v1.js','utf8');
const communication=fs.readFileSync('site/assets/communication-workspace-v1.js','utf8');
const resources=fs.readFileSync('site/assets/resources-workspace-v2.js','utf8');
const delivery=fs.readFileSync('site/assets/delivery-workflow-v1.js','utf8');

const checks=[
  ['RSVP action exists', live.includes("action==='meeting-response'") && live.includes('async function setMeetingResponse')],
  ['RSVP UI exists', live.includes('meeting-rsvp-v432')],
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
  ['Delivery workflow owns closure and reopen', delivery.includes('get_project_closure_preview_v3') && delivery.includes('complete_project_v3') && delivery.includes('reopen_project_v1')],
  ['guest meeting auto-sharing', live.includes('const includesGuest=attendeeIds.some') && live.includes("visibility=includesGuest?'shared'")],
  ['state reset clears collaboration caches', live.includes('conversationMembers:[]') && live.includes('deliverableVersions:[]') && live.includes('messageLoads:new Set()')],
  ['Home V4.3 contract still present', live.includes('v43-home-grid') && css.includes('4b4c V4.3')],
  ['Supabase backend is correct', runtime.includes('wexfzhegiewhldkugtow.supabase.co')],
  ['boot fallback stays canonical', boot.includes('Configuration 2b2c indisponible') && !boot.includes('assets/app.js')],
  ['Communication V3 is mandatory', boot.includes('communication-workspace-v1.js') && !boot.includes('communication workspace unavailable; native messages view kept')],
  ['Resources V2 is mandatory', boot.includes('resources-workspace-v2.js') && !boot.includes('resources v2 unavailable; native resources view kept')],
];

const failed=checks.filter(([,ok])=>!ok);
for(const [name,ok] of checks) console.log((ok?'✓':'✗')+' '+name);
if(failed.length){
  console.error('\n'+failed.length+' collaboration contract check(s) failed.');
  process.exit(1);
}
console.log('\n'+checks.length+' collaboration contracts verified.');

import fs from 'node:fs';

const live=fs.readFileSync('site/assets/live.js','utf8');
const css=fs.readFileSync('site/assets/live.css','utf8');
const boot=fs.readFileSync('site/assets/boot.js','utf8');
const runtime=fs.readFileSync('site/runtime-config.js','utf8');

const checks=[
  ['RSVP action exists', live.includes("action==='meeting-response'") && live.includes('async function setMeetingResponse')],
  ['RSVP UI exists', live.includes('meeting-rsvp-v432')],
  ['message refresh guard exists', live.includes('messageLoads: new Set()') && live.includes('state.unreadConversations.get(conversation.id)')],
  ['project cache rebuilt on sync', live.includes('state.projectCache = new Map(projects.map(project=>')],
  ['sync failures surfaced', live.includes('sync-alert-v432') && live.includes("action==='retry-sync'")],
  ['workspace-scoped access reset', live.includes('project_id=in.(') && !live.includes("await api.remove('project_members',\`user_id=eq.\${member.user_id}\`);")],
  ['server-side file version allocation', live.includes('register_deliverable_version_v2')],
  ['approval decision workflow present', live.includes('approval-decision') && live.includes('decideApproval')],
  ['guest meeting auto-sharing', live.includes('const includesGuest=attendeeIds.some') && live.includes("visibility=includesGuest?'shared'")],
  ['state reset clears collaboration caches', live.includes('conversationMembers:[]') && live.includes('deliverableVersions:[]') && live.includes('messageLoads:new Set()')],
  ['Home V4.3 contract still present', live.includes('v43-home-grid') && css.includes('4b4c V4.3')],
  ['Messages V2 still present', live.includes('communication-v2-hub')],
  ['Supabase backend is correct', runtime.includes('wexfzhegiewhldkugtow.supabase.co')],
  ['boot fallback stays canonical', boot.includes('Configuration 2b2c indisponible') && !boot.includes('assets/app.js')],
];

const failed=checks.filter(([,ok])=>!ok);
for(const [name,ok] of checks) console.log((ok?'✓':'✗')+' '+name);
if(failed.length){
  console.error('\\n'+failed.length+' collaboration contract check(s) failed.');
  process.exit(1);
}
console.log('\\n'+checks.length+' collaboration contracts verified.');

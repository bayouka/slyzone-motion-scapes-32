import fs from 'node:fs';

const livePath='site/assets/live.js';
const cssPath='site/assets/live.css';
let source=fs.readFileSync(livePath,'utf8');
let css=fs.readFileSync(cssPath,'utf8');

function replaceOnce(label,before,after){
  const count=source.split(before).length-1;
  if(count!==1) throw new Error(`${label}: expected exactly one match, found ${count}`);
  source=source.replace(before,after);
}

// 1. Reset every account/workspace-specific state field and add async/sync guards.
replaceOnce(
  'state guards',
  "  unreadMessages: 0, unreadMentions: 0, unreadConversations: new Map(), replyTo: null,\n  modal: null, toast: [], notificationOpen: false, userMenuOpen: false, mobileMenuOpen: false, invitePreview: null, welcome: null, searchQuery: '', libraryQuery: '', libraryProject: 'all', loading: true, busy: false, lastSync: null, previousSeenAt: null, seenMarkedAt: null\n};",
  "  unreadMessages: 0, unreadMentions: 0, unreadConversations: new Map(), replyTo: null, messageLoads: new Set(),\n  modal: null, toast: [], notificationOpen: false, userMenuOpen: false, mobileMenuOpen: false, invitePreview: null, welcome: null, searchQuery: '', libraryQuery: '', libraryProject: 'all', loading: true, busy: false, lastSync: null, syncError: null, previousSeenAt: null, seenMarkedAt: null\n};"
);

replaceOnce(
  'complete reset state',
  "function resetState(){Object.assign(state,{authMode:'signin',user:null,profile:null,memberships:[],workspace:null,workspaceRole:null,projects:[],archivedProjects:[],members:[],profiles:[],notifications:[],requests:[],approvals:[],meetings:[],meetingAttendees:[],milestones:[],actions:[],assignees:[],conversations:[],projectMembers:[],projectCache:new Map(),messages:new Map(),modal:null,notificationOpen:false,userMenuOpen:false,mobileMenuOpen:false,previousSeenAt:null,seenMarkedAt:null,loading:false})}",
  "function resetState(){Object.assign(state,{authMode:'signin',user:null,profile:null,memberships:[],workspace:null,workspaceRole:null,projects:[],archivedProjects:[],members:[],profiles:[],notifications:[],requests:[],approvals:[],meetings:[],meetingAttendees:[],milestones:[],actions:[],assignees:[],decisions:[],deliverables:[],deliverableVersions:[],conversations:[],conversationMembers:[],projectMembers:[],projectCache:new Map(),messages:new Map(),unreadMessages:0,unreadMentions:0,unreadConversations:new Map(),replyTo:null,messageLoads:new Set(),modal:null,toast:[],notificationOpen:false,userMenuOpen:false,mobileMenuOpen:false,invitePreview:null,welcome:null,searchQuery:'',libraryQuery:'',libraryProject:'all',busy:false,lastSync:null,syncError:null,previousSeenAt:null,seenMarkedAt:null,loading:false})}"
);

// 2. Rebuild project caches from every successful workspace poll so multi-user changes become visible.
replaceOnce(
  'workspace cache sync',
  "    state.milestones = projects.length\n      ? await api.select('milestones', `select=*&project_id=in.(${projects.map(p=>p.id).join(',')})&order=position.asc`)\n      : [];\n    state.lastSync = new Date();",
  "    state.milestones = projects.length\n      ? await api.select('milestones', `select=*&project_id=in.(${projects.map(p=>p.id).join(',')})&order=position.asc`)\n      : [];\n    state.projectCache = new Map(projects.map(project=>{\n      const projectDeliverables=deliverables.filter(d=>d.project_id===project.id);\n      const deliverableIds=new Set(projectDeliverables.map(d=>d.id));\n      return [project.id,{\n        milestones:state.milestones.filter(m=>m.project_id===project.id),\n        decisions:decisions.filter(d=>d.project_id===project.id),\n        deliverables:projectDeliverables,\n        versions:deliverableVersions.filter(v=>deliverableIds.has(v.deliverable_id))\n      }];\n    }));\n    state.lastSync = new Date();\n    state.syncError = null;"
);

replaceOnce(
  'quiet sync error state',
  "  } catch (error) {\n    if (!quiet) showToast(humanError(error), true);\n  } finally {",
  "  } catch (error) {\n    state.syncError=humanError(error);\n    if (!quiet) showToast(state.syncError, true);\n  } finally {"
);

// 3. Refresh the body of an open/unread conversation instead of treating any cache entry as final.
replaceOnce(
  'message loader',
  "async function loadMessages(conversationId, force=false) {\n  if(!force && state.messages.has(conversationId)) return;\n  try {\n    state.messages.set(conversationId,await api.select('messages',`select=*&conversation_id=eq.${conversationId}&order=created_at.asc&limit=300`));\n    await api.rpc('mark_conversation_read_v2',{p_conversation_id:conversationId,p_seen_at:new Date().toISOString()});\n    state.unreadConversations.delete(conversationId);await refreshMessageBadges();render();\n  } catch(error){showToast(humanError(error),true);}\n}",
  "async function loadMessages(conversationId, force=false) {\n  if(state.messageLoads.has(conversationId))return;\n  const unread=Number(state.unreadConversations.get(conversationId)||0);\n  if(!force&&state.messages.has(conversationId)&&!unread)return;\n  state.messageLoads.add(conversationId);\n  try {\n    state.messages.set(conversationId,await api.select('messages',`select=*&conversation_id=eq.${conversationId}&order=created_at.asc&limit=300`));\n    await api.rpc('mark_conversation_read_v2',{p_conversation_id:conversationId,p_seen_at:new Date().toISOString()});\n    state.unreadConversations.delete(conversationId);await refreshMessageBadges();render();\n  } catch(error){showToast(humanError(error),true);}\n  finally{state.messageLoads.delete(conversationId);}\n}"
);

replaceOnce(
  'project message live refresh',
  "  if (!state.messages.has(conversation.id)) loadMessages(conversation.id);",
  "  if (!state.messages.has(conversation.id)||state.unreadConversations.get(conversation.id)) loadMessages(conversation.id,true);"
);
replaceOnce(
  'hub message live refresh',
  "  if(conversation&&!state.messages.has(conversation.id))loadMessages(conversation.id);",
  "  if(conversation&&(!state.messages.has(conversation.id)||state.unreadConversations.get(conversation.id)))loadMessages(conversation.id,true);"
);

// 4. Meetings: a real invite needs a real RSVP. Guests force shared visibility.
replaceOnce(
  'meeting attendee RSVP UI',
  "function meetingAttendeeHtml(meetingId){const rows=state.meetingAttendees.filter(a=>a.meeting_id===meetingId);return rows.length?`<div class=\"meeting-attendees-v4\"><span class=\"eyebrow\">Participants</span><div>${rows.map(a=>`<span class=\"attendee-chip\">${avatarHtml(a.user_id)}<b>${esc(displayName(a.user_id))}</b><small>${a.response==='accepted'?'Présent / accepté':a.response==='declined'?'Décliné':'En attente'}</small></span>`).join('')}</div></div>`:''}",
  "function meetingAttendeeHtml(meetingId){const rows=state.meetingAttendees.filter(a=>a.meeting_id===meetingId);const meeting=state.meetings.find(m=>m.id===meetingId);const mine=rows.find(a=>a.user_id===state.user.id);const canRespond=Boolean(mine&&meeting?.created_by!==state.user.id&&meeting?.status==='planned');return rows.length?`<div class=\"meeting-attendees-v4\"><span class=\"eyebrow\">Participants</span><div>${rows.map(a=>`<span class=\"attendee-chip\">${avatarHtml(a.user_id)}<b>${esc(displayName(a.user_id))}</b><small>${a.response==='accepted'?'Accepté':a.response==='declined'?'Décliné':'En attente'}</small></span>`).join('')}</div>${canRespond?`<div class=\"meeting-rsvp-v432\"><span>Votre réponse</span><button type=\"button\" class=\"btn small ${mine.response==='accepted'?'primary':''}\" data-action=\"meeting-response\" data-meeting=\"${meetingId}\" data-response=\"accepted\">✓ Je participe</button><button type=\"button\" class=\"btn small ${mine.response==='declined'?'danger':''}\" data-action=\"meeting-response\" data-meeting=\"${meetingId}\" data-response=\"declined\">Je décline</button></div>`:''}</div>`:''}"
);

replaceOnce(
  'meeting creation visibility',
  "  const rows=await api.insert('meetings',[{workspace_id:state.workspace.id,project_id:data.projectId||null,title:String(data.title).trim(),status:'planned',starts_at:starts,ends_at:ends,video_room:String(data.videoRoom||'').trim()||null,agenda:String(data.agenda||'').trim(),visibility:data.visibility||'internal',created_by:state.user.id}]);\n  const attendeeIds=[...new Set([state.user.id,...(data.attendeeIds||[])])];\n  await api.insert('meeting_attendees',attendeeIds.map(user_id=>({meeting_id:rows[0].id,user_id,response:user_id===state.user.id?'accepted':'pending'})),{returnRepresentation:false});\n  state.modal={type:'meeting-detail',id:rows[0].id}; await refreshWorkspace({quiet:true}); showToast('Réunion planifiée · agenda prêt');",
  "  const attendeeIds=[...new Set([state.user.id,...(data.attendeeIds||[])])];\n  const includesGuest=attendeeIds.some(id=>state.members.some(m=>m.user_id===id&&m.role==='guest'));\n  const visibility=includesGuest?'shared':(data.visibility||'internal');\n  const rows=await api.insert('meetings',[{workspace_id:state.workspace.id,project_id:data.projectId||null,title:String(data.title).trim(),status:'planned',starts_at:starts,ends_at:ends,video_room:String(data.videoRoom||'').trim()||null,agenda:String(data.agenda||'').trim(),visibility,created_by:state.user.id}]);\n  await api.insert('meeting_attendees',attendeeIds.map(user_id=>({meeting_id:rows[0].id,user_id,response:user_id===state.user.id?'accepted':'pending'})),{returnRepresentation:false});\n  state.modal={type:'meeting-detail',id:rows[0].id}; await refreshWorkspace({quiet:true}); showToast(includesGuest?'Réunion planifiée · partagée avec les invités':'Réunion planifiée · agenda prêt');"
);

replaceOnce(
  'meeting response action',
  "    else if (action==='open-meeting') openModal({type:'meeting-detail',id:target.dataset.meeting});\n    else if (action==='meeting-to-action') openModal({type:'action',projectId:target.dataset.project,sourceType:'meeting',sourceId:target.dataset.meeting});",
  "    else if (action==='open-meeting') openModal({type:'meeting-detail',id:target.dataset.meeting});\n    else if (action==='meeting-response') await setMeetingResponse(target.dataset.meeting,target.dataset.response);\n    else if (action==='meeting-to-action') openModal({type:'action',projectId:target.dataset.project,sourceType:'meeting',sourceId:target.dataset.meeting});"
);

replaceOnce(
  'meeting response function anchor',
  "async function openFile(path) { const url=await api.signedUrl('workspace-files',path,900); window.open(url,'_blank','noopener,noreferrer'); }",
  "async function setMeetingResponse(meetingId,response){\n  if(!['accepted','declined'].includes(response))throw new Error('Réponse de réunion invalide.');\n  const attendee=state.meetingAttendees.find(a=>a.meeting_id===meetingId&&a.user_id===state.user.id);\n  if(!attendee)throw new Error('Vous ne faites pas partie de cette réunion.');\n  await api.update('meeting_attendees',`meeting_id=eq.${meetingId}&user_id=eq.${state.user.id}`,{response},{returnRepresentation:false});\n  attendee.response=response;\n  await refreshWorkspace({quiet:true});\n  showToast(response==='accepted'?'Participation confirmée':'Réunion déclinée');\n}\n\nasync function openFile(path) { const url=await api.signedUrl('workspace-files',path,900); window.open(url,'_blank','noopener,noreferrer'); }"
);

// 5. Changing one workspace must never erase memberships in another workspace.
replaceOnce(
  'workspace scoped project membership reset',
  "  await api.remove('project_members',`user_id=eq.${member.user_id}`);",
  "  const workspaceProjectIds=[...state.projects,...state.archivedProjects].map(p=>p.id);\n  if(workspaceProjectIds.length)await api.remove('project_members',`user_id=eq.${member.user_id}&project_id=in.(${workspaceProjectIds.join(',')})`);"
);

// 6. Surface a sustained sync failure without flooding the user with polling toasts.
replaceOnce(
  'sync indicator',
  "        <button class=\"compact-search\" data-action=\"open-search\"><span>${ICONS.search}</span><strong>Rechercher</strong><kbd>Ctrl K</kbd></button>\n        <div class=\"live-actions\">",
  "        <button class=\"compact-search\" data-action=\"open-search\"><span>${ICONS.search}</span><strong>Rechercher</strong><kbd>Ctrl K</kbd></button>\n        ${state.syncError?`<button class=\"sync-alert-v432\" data-action=\"retry-sync\" title=\"${escAttr(state.syncError)}\">Synchronisation interrompue · Réessayer</button>`:''}\n        <div class=\"live-actions\">"
);
replaceOnce(
  'retry sync action',
  "    else if (action==='read-all-notifications') await markAllNotificationsRead();",
  "    else if (action==='read-all-notifications') await markAllNotificationsRead();\n    else if (action==='retry-sync') await refreshWorkspace({quiet:false});"
);

// 7. Translate invariant failures into collaborator-facing language.
replaceOnce(
  'human errors',
  "function humanError(error){if(error instanceof ApiError&&error.status===409)return 'Cet élément existe déjà.';const msg=String(error?.message||error||'Erreur inconnue');if(/Invalid login credentials/i.test(msg))return 'Email ou mot de passe incorrect.';if(/Email not confirmed/i.test(msg))return 'L’adresse email doit être confirmée avant connexion.';if(/duplicate key.*workspace_invites/i.test(msg))return 'Une invitation en attente existe déjà pour cet email.';if(/row-level security/i.test(msg))return 'Vous n’avez pas les droits nécessaires pour cette action.';return msg.replace(/^\\w+\\s*:\\s*/,'')}",
  "function humanError(error){if(error instanceof ApiError&&error.status===409)return 'Cet élément existe déjà.';const msg=String(error?.message||error||'Erreur inconnue');if(/Invalid login credentials/i.test(msg))return 'Email ou mot de passe incorrect.';if(/Email not confirmed/i.test(msg))return 'L’adresse email doit être confirmée avant connexion.';if(/duplicate key.*workspace_invites/i.test(msg))return 'Une invitation en attente existe déjà pour cet email.';if(/approvals_one_pending_per_validator_version/i.test(msg))return 'Une validation est déjà en attente auprès de cette personne pour cette version.';if(/APPROVAL_ONLY_VALIDATOR_CAN_DECIDE/i.test(msg))return 'Seul le validateur désigné peut prendre cette décision.';if(/APPROVAL_ALREADY_FINAL|APPROVAL_FINAL_DECISION_IMMUTABLE/i.test(msg))return 'Cette validation a déjà été traitée.';if(/MEETING_ATTENDEE_IDENTITY_IMMUTABLE/i.test(msg))return 'Cette invitation de réunion ne peut pas être déplacée vers une autre personne.';if(/row-level security/i.test(msg))return 'Vous n’avez pas les droits nécessaires pour cette action.';return msg.replace(/^\\w+\\s*:\\s*/,'')}"
);

fs.writeFileSync(livePath,source);

const cssMarker='/* 4b4c V4.3.2 — collaboration reliability */';
if(!css.includes(cssMarker)){
  css += `\n\n${cssMarker}\n.meeting-rsvp-v432{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:12px;padding-top:12px;border-top:1px solid var(--live-line)}\n.meeting-rsvp-v432>span{font-size:12px;font-weight:700;color:var(--live-muted);margin-right:2px}\n.sync-alert-v432{border:1px solid #f3c78c;background:#fff8eb;color:#8a4b10;border-radius:10px;padding:7px 10px;font-size:12px;font-weight:700;cursor:pointer}\n@media(max-width:900px){.sync-alert-v432{max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}}\n@media(max-width:767px){.sync-alert-v432{position:fixed;left:14px;right:14px;bottom:82px;max-width:none;z-index:45;box-shadow:0 8px 24px rgba(23,32,51,.12)}.meeting-rsvp-v432{align-items:stretch}.meeting-rsvp-v432>span{width:100%}}\n`;
}
fs.writeFileSync(cssPath,css);

console.log('V4.3.2 collaboration audit fixes applied');

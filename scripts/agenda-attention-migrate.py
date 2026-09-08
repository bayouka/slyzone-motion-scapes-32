from pathlib import Path
import re

live_path=Path('site/assets/live.js')
safe_path=Path('site/assets/workflow-backend-safe-v1.js')
live=live_path.read_text(encoding='utf-8')
safe=safe_path.read_text(encoding='utf-8')

# 1) Product naming: global calendar becomes Agenda, project-local calendar view remains Calendar.
needle="['calendar','Calendrier',ICONS.calendar,'#/calendar']"
count=live.count(needle)
if count < 3:
    raise SystemExit(f'expected >=3 global calendar nav labels, found {count}')
live=live.replace(needle,"['calendar','Agenda',ICONS.calendar,'#/calendar']")
if "calendar:'Calendrier'" not in live:
    raise SystemExit('route title Calendar marker missing')
live=live.replace("calendar:'Calendrier'","calendar:'Agenda'")
live=live.replace('href="#/calendar">Calendrier →</a>','href="#/calendar">Agenda →</a>')
live=live.replace('Le calendrier reste disponible si vous voulez planifier la suite.','L’agenda reste disponible si vous voulez planifier la suite.')
live=live.replace('<span class="eyebrow">Temps partagé</span><h1>Calendrier</h1><p>Les réunions de vos projets visibles, sans mélanger les tâches avec le temps synchrone.</p>','<span class="eyebrow">Temps partagé</span><h1>Agenda</h1><p>Réunions et échéances importantes réunies dans une vue temporelle cohérente.</p>')

# 2) Bell badge: attention has priority; unread notifications still keep the bell visible.
old="function shell(content, route) {\n  const unread = state.notifications.filter(n => !n.read_at).length;"
new="function shell(content, route) {\n  const unreadNotifications = state.notifications.filter(n => !n.read_at).length;\n  const unread = Math.max(attentionCount(), unreadNotifications);"
if old not in live:
    raise SystemExit('shell unread marker missing')
live=live.replace(old,new,1)

# 3) Pending meeting RSVP belongs to personal attention.
marker="function personalAttentionItems(){\n  const items=[];\n"
if marker not in live:
    raise SystemExit('personalAttentionItems marker missing')
insert="""function personalAttentionItems(){
  const items=[];
  state.meetingAttendees.filter(a=>a.user_id===state.user.id&&a.response==='pending').forEach(a=>{
    const meeting=state.meetings.find(m=>m.id===a.meeting_id);
    if(!meeting||meeting.status!=='planned'||!meeting.starts_at||new Date(meeting.starts_at)<new Date())return;
    items.push({key:`meeting:${meeting.id}`,entityType:'meeting',entityId:meeting.id,kind:'Réunion',title:`Confirmer votre présence · ${meeting.title}`,projectId:meeting.project_id,tone:'blue',rank:1,byLabel:meeting.created_by&&meeting.created_by!==state.user.id?`invité par ${displayName(meeting.created_by)}`:'votre réponse est attendue',byUserId:meeting.created_by||null,dueAt:meeting.starts_at,preview:meeting.agenda||''});
  });
"""
live=live.replace(marker,insert,1)

# 4) Notification panel becomes a real attention center, while keeping notification history separate.
pattern=r"function renderNotificationPanel\(\) \{.*?\n\}\n\nfunction actionEditModal"
replacement="""function renderNotificationPanel() {
  const attention=personalAttentionItems().slice(0,6);
  const items=state.notifications.slice(0,8);
  return `<div class="notification-panel attention-center-v1"><div class="card-head"><div><span class="eyebrow">Priorités personnelles</span><h3>Centre d’attention</h3></div>${state.notifications.some(n=>!n.read_at)?`<button class="btn small" data-action="read-all-notifications">Marquer les nouveautés lues</button>`:''}</div>
    <div class="notification-section-v1"><div class="notification-section-head-v1"><strong>À traiter</strong><span>${attention.length}</span></div>${attention.length?`<div class="stack">${attention.map(x=>`<div class="list-row clickable attention-center-row-v1 ${x.tone||''}" ${attentionOpenAttrs(x)}><span class="attention-type-icon ${x.tone||''}">${attentionIcon(x.kind)}</span><div class="list-main"><strong>${esc(x.title)}</strong><small>${esc(projectName(x.projectId)||'Espace')}${x.dueAt?` · ${esc(attentionDueLabel(x.dueAt))}`:''}</small></div><span class="row-chevron">›</span></div>`).join('')}</div>`:`<div class="v43-up-to-date">Rien ne demande votre intervention.</div>`}</div>
    <div class="notification-section-v1 secondary"><div class="notification-section-head-v1"><strong>Nouveautés</strong><span>${items.filter(n=>!n.read_at).length}</span></div>${items.length?`<div class="stack">${items.map(n=>`<div class="list-row clickable" data-action="open-notification" data-id="${n.id}" data-route="${escAttr(n.route||'#/dashboard')}"><span class="dot" style="color:${n.read_at?'#c8ced8':'#3867f4'}"></span><div class="list-main"><strong>${esc(n.title)}</strong><small>${notificationKind(n.kind)} · ${relativeDate(new Date(n.created_at))}</small></div></div>`).join('')}</div>`:empty('Aucune nouveauté','Les événements importants apparaîtront ici.')}</div>
  </div>`;
}

function actionEditModal"""
live2,n=re.subn(pattern,replacement,live,count=1,flags=re.S)
if n!=1:
    raise SystemExit(f'notification panel replacement count={n}')
live=live2

# 5) RSVP uses the secure V2 RPC.
pattern=r"async function setMeetingResponse\(meetingId,response\)\{.*?\n\}\n\nasync function openFile"
replacement="""async function setMeetingResponse(meetingId,response){
  if(!['accepted','declined'].includes(response))throw new Error('Réponse de réunion invalide.');
  await api.rpc('set_meeting_response_v2',{p_meeting_id:meetingId,p_response:response});
  await refreshWorkspace({quiet:true});
  showToast(response==='accepted'?'Participation confirmée':'Réunion déclinée');
}

async function openFile"""
live2,n=re.subn(pattern,replacement,live,count=1,flags=re.S)
if n!=1:
    raise SystemExit(f'RSVP replacement count={n}')
live=live2

# 6) Native meeting create/update uses server workflows. This also keeps a safe fallback if the Agenda module fails.
pattern=r"async function submitMeeting\(data\) \{.*?\n\}\n\nasync function submitMeetingDetail\(data\)\{.*?\n\}\n"
replacement="""async function submitMeeting(data) {
  if(data.projectId&&!canWriteProject(data.projectId))throw new Error('Vous ne pouvez pas planifier une réunion dans ce projet.');
  const starts=localDateTimeToIso(data.startsAt); const ends=localDateTimeToIso(data.endsAt);
  if(!starts)throw new Error('Indiquez le début de la réunion.');
  const meetingId=await api.rpc('create_meeting_with_attendees_v2',{
    p_workspace_id:state.workspace.id,
    p_title:String(data.title||'').trim(),
    p_starts_at:starts,
    p_ends_at:ends,
    p_project_id:data.projectId||null,
    p_video_room:String(data.videoRoom||'').trim()||null,
    p_visibility:data.visibility||'internal',
    p_attendee_ids:data.attendeeIds||[],
    p_agenda:String(data.agenda||'').trim(),
  });
  state.modal=null; await refreshWorkspace({quiet:true}); location.hash=`#/calendar/meeting/${Array.isArray(meetingId)?meetingId[0]:meetingId}`; showToast('Réunion planifiée · agenda prêt');
}

async function submitMeetingDetail(data){
  const m=state.meetings.find(x=>x.id===data.meetingId);if(!m)throw new Error('Réunion introuvable');
  await api.rpc('update_meeting_v2',{
    p_meeting_id:m.id,
    p_title:m.title,
    p_starts_at:m.starts_at,
    p_ends_at:m.ends_at,
    p_video_room:m.video_room||null,
    p_visibility:data.visibility||m.visibility||'internal',
    p_agenda:String(data.agenda||'').trim(),
    p_live_notes:String(data.liveNotes||'').trim(),
    p_summary:String(data.summary||'').trim(),
    p_status:data.status||m.status,
    p_attendee_ids:null,
  });
  state.modal=null;await refreshWorkspace({quiet:true});showToast(data.status==='completed'?'Réunion clôturée · synthèse conservée':'Réunion mise à jour');
}
"""
live2,n=re.subn(pattern,replacement,live,count=1,flags=re.S)
if n!=1:
    raise SystemExit(f'meeting workflow replacement count={n}')
live=live2

# 7) Add useful human errors for server workflow guards.
err_marker="if(/MEETING_ATTENDEE_IDENTITY_IMMUTABLE/i.test(msg))return 'Cette invitation de réunion ne peut pas être déplacée vers une autre personne.';"
if err_marker not in live:
    raise SystemExit('humanError meeting marker missing')
err_extra=err_marker+"if(/MEETING_RSVP_CLOSED/i.test(msg))return 'Les réponses de présence sont closes pour cette réunion.';if(/MEETING_FINALIZED_STATUS_IMMUTABLE|MEETING_STATUS_BACKWARD_DENIED/i.test(msg))return 'Une réunion terminée ne peut pas revenir à une étape précédente.';if(/GUEST_MEETING_REQUIRES_SHARED_PROJECT/i.test(msg))return 'Une réunion avec un invité doit être partagée et liée à un projet commun.';if(/MEETING_ATTENDEE_NO_PROJECT_ACCESS/i.test(msg))return 'Un participant sélectionné n’a pas accès à ce projet.';"
live=live.replace(err_marker,err_extra,1)

# 8) The safe bridge must no longer submit meetings in parallel with native live.js.
old="const handledForms = new Set(['action','action-edit','milestone','milestone-edit','meeting','project-edit','upload','version','approval-request','project-complete','project-complete-v2']);"
new="const handledForms = new Set(['action','action-edit','milestone','milestone-edit','project-edit','upload','version','approval-request','project-complete','project-complete-v2']);"
if old not in safe:
    raise SystemExit('safe bridge handledForms marker missing')
safe=safe.replace(old,new,1)

live_path.write_text(live,encoding='utf-8')
safe_path.write_text(safe,encoding='utf-8')
print('agenda/attention core migration applied')

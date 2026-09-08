import { SupabaseBrowserClient } from './supabase-client.js';

const VERSION='2b2c agenda workspace v1.0.0';
const config=window.__4B4C_CONFIG__||{};
const api=new SupabaseBrowserClient({url:config.supabaseUrl,publishableKey:config.supabasePublishableKey});
const workspaceKey=config.workspaceStorageKey||'4b4c.live.workspace.v1';
const SYNC_MS=Math.max(20000,Number(config.syncProbeIntervalMs||20000));

const root=document.createElement('section');
root.id='agenda-workspace-v1';
root.className='agenda-workspace-v1';
root.hidden=true;
root.setAttribute('aria-label','Agenda');
document.body.appendChild(root);

let state=null;
let modal=null;
let busy=false;
let loadToken=0;
let syncTimer=null;
let syncDigest='';
let selectedMeeting=null;
let meetingCapabilities=null;

const esc=(v)=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const escAttr=esc;
const one=(v)=>Array.isArray(v)?(v[0]??null):v;
const toDate=(v)=>v?new Date(v):null;
const validDate=(v)=>v&&!Number.isNaN(new Date(v).getTime());
const formatDate=(v)=>validDate(v)?new Intl.DateTimeFormat('fr-FR',{weekday:'short',day:'numeric',month:'short'}).format(new Date(v)):'—';
const formatDateTime=(v)=>validDate(v)?new Intl.DateTimeFormat('fr-FR',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(v)):'—';
const formatTime=(v)=>validDate(v)?new Intl.DateTimeFormat('fr-FR',{hour:'2-digit',minute:'2-digit'}).format(new Date(v)):'—';
const initials=(name)=>String(name||'?').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'?';
const localInput=(v)=>{if(!v)return'';const d=new Date(v);if(Number.isNaN(d.getTime()))return'';const p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;};
const localIso=(v)=>{if(!v)return null;const d=new Date(v);return Number.isNaN(d.getTime())?null:d.toISOString();};

function route(){const h=location.hash||'';const m=h.match(/^#\/calendar(?:\/meeting\/([^/?]+))?/);return m?{active:true,meetingId:m[1]||''}:{active:false,meetingId:''};}
function isActive(){return route().active;}
function workspaceId(){return localStorage.getItem(workspaceKey)||'';}
function profile(id){return state?.profiles?.find(p=>p.id===id)||null;}
function member(id){return state?.members?.find(m=>m.user_id===id)||null;}
function displayName(id){return profile(id)?.display_name||member(id)?.email||'Membre';}
function avatar(id){return `<span class="ag-avatar">${esc(initials(displayName(id)))}</span>`;}
function project(id){return state?.projects?.find(p=>p.id===id)||null;}
function projectName(id){return project(id)?.name||'Espace';}
function role(){return state?.membership?.role||'';}
function canCreateMeeting(){return role()!=='guest';}
function isFinalStatus(item){return ['done','cancelled','completed','satisfied','closed'].includes(item?.status);}

function positionRoot(){if(root.hidden)return;const host=document.querySelector('.live-content');if(!host)return;const r=host.getBoundingClientRect();root.style.left=`${Math.max(0,r.left)}px`;root.style.top=`${Math.max(0,r.top)}px`;root.style.width=`${Math.max(320,r.width)}px`;root.style.height=`${Math.max(320,innerHeight-Math.max(0,r.top))}px`;}
async function waitForHost(){for(let i=0;i<20;i++){const host=document.querySelector('.live-content');if(host)return host;await new Promise(r=>setTimeout(r,60));}return null;}
function hide(){state=null;modal=null;selectedMeeting=null;meetingCapabilities=null;root.hidden=true;root.innerHTML='';document.body.classList.remove('agenda-workspace-open-v1');stopSync();}

async function activate({force=false}={}){
  const r=route();if(!r.active){hide();return;}
  root.hidden=false;document.body.classList.add('agenda-workspace-open-v1');await waitForHost();positionRoot();
  if(!state||force||state.workspaceId!==workspaceId())await loadWorkspace(r);
  else if(r.meetingId!==state.route.meetingId){state.route=r;await loadMeetingRoute(r.meetingId);render();}
  else render();
  startSync();
}

async function loadWorkspace(r=route()){
  const token=++loadToken;root.innerHTML='<div class="ag-loading"><span></span><strong>Préparation de votre agenda…</strong></div>';
  try{
    const wid=workspaceId();if(!wid)throw new Error('Aucun espace de travail sélectionné.');
    const user=await api.getUser();if(!user?.id)throw new Error('Votre session a expiré.');
    const membership=one(await api.select('workspace_members',`select=*&workspace_id=eq.${wid}&user_id=eq.${user.id}&status=eq.active&limit=1`));
    if(!membership)throw new Error('Vous n’avez plus accès à cet espace.');
    const from=new Date(Date.now()-90*86400000).toISOString();
    const to=new Date(Date.now()+180*86400000).toISOString();
    const [items,projects,members,profiles,projectMembers,meetingAttendees,meetings,digestRows]=await Promise.all([
      api.rpc('get_agenda_items_v1',{p_workspace_id:wid,p_from:from,p_to:to}),
      api.select('projects',`select=id,name,status,visibility,lead_user_id,target_date&workspace_id=eq.${wid}&status=neq.archived&order=name.asc`),
      api.select('workspace_members',`select=*&workspace_id=eq.${wid}&status=eq.active&order=joined_at.asc`),
      api.select('profiles','select=id,display_name,avatar_url&order=display_name.asc'),
      api.select('project_members','select=project_id,user_id').catch(()=>[]),
      api.select('meeting_attendees','select=meeting_id,user_id,response').catch(()=>[]),
      api.select('meetings',`select=*&workspace_id=eq.${wid}&order=starts_at.asc.nullslast&limit=200`).catch(()=>[]),
      api.rpc('get_workspace_sync_digest_v1',{p_workspace_id:wid}).catch(()=>[]),
    ]);
    if(token!==loadToken)return;
    state={workspaceId:wid,user,membership,items:Array.isArray(items)?items:[],projects,members,profiles,projectMembers,meetingAttendees,meetings,route:r,view:state?.view||'upcoming',scope:state?.scope||'mine',projectFilter:state?.projectFilter||'all'};
    syncDigest=String(one(digestRows)?.digest||digestRows?.digest||'');
    await loadMeetingRoute(r.meetingId);
    render();
  }catch(error){if(token!==loadToken)return;root.innerHTML=`<div class="ag-error"><strong>Agenda indisponible</strong><p>${esc(error?.message||error)}</p><button class="btn" data-ag-action="reload">Réessayer</button></div>`;}
}

async function loadMeetingRoute(meetingId){
  selectedMeeting=null;meetingCapabilities=null;if(!meetingId||!state)return;
  selectedMeeting=state.meetings.find(m=>m.id===meetingId)||one(await api.select('meetings',`select=*&id=eq.${meetingId}&limit=1`).catch(()=>[]));
  if(!selectedMeeting)return;
  meetingCapabilities=one(await api.rpc('get_meeting_capabilities_v1',{p_meeting_id:meetingId}).catch(()=>[]))||{can_manage:false,can_rsvp:false,response:null};
}

function itemDate(item){return toDate(item.event_at);}
function itemTypeLabel(item){return ({meeting:'Réunion',action:'Action',milestone:'Phase',request:'Demande',project_target:'Date cible'})[item.item_type]||'Échéance';}
function itemIcon(item){return ({meeting:'▣',action:'✓',milestone:'◇',request:'?',project_target:'◎'})[item.item_type]||'•';}
function statusLabel(item){const map={planned:'Planifiée',live:'En cours',completed:'Terminée',cancelled:'Annulée',todo:'À faire',in_progress:'En cours',blocked:'Bloquée',done:'Terminée',open:'Ouverte',answered:'Répondue',satisfied:'Close',active:'En cours'};return map[item.status]||item.status||'';}
function urgency(item){const d=itemDate(item);if(item.needs_attention)return'attention';if(!isFinalStatus(item)&&d&&d<Date.now())return'overdue';if(item.item_type==='meeting')return'meeting';return'';}
function isUpcoming(item){const d=itemDate(item);if(!d)return false;if(isFinalStatus(item))return false;return d>=new Date()||item.needs_attention||urgency(item)==='overdue'||item.status==='live';}
function filteredItems(){
  if(!state)return[];let rows=[...state.items];
  if(state.scope==='mine')rows=rows.filter(x=>x.is_mine||x.needs_attention);
  if(state.projectFilter!=='all')rows=rows.filter(x=>String(x.project_id||'workspace')===state.projectFilter);
  if(state.view==='upcoming')rows=rows.filter(isUpcoming);
  else if(state.view==='meetings')rows=rows.filter(x=>x.item_type==='meeting'&&!isFinalStatus(x));
  else if(state.view==='deadlines')rows=rows.filter(x=>x.item_type!=='meeting'&&!isFinalStatus(x));
  else if(state.view==='history')rows=rows.filter(x=>isFinalStatus(x)||itemDate(x)<new Date()).sort((a,b)=>itemDate(b)-itemDate(a));
  if(state.view!=='history')rows.sort((a,b)=>{const ua=urgency(a)==='overdue'?-2:a.needs_attention?-1:itemDate(a)?.getTime()||0;const ub=urgency(b)==='overdue'?-2:b.needs_attention?-1:itemDate(b)?.getTime()||0;return ua-ub;});
  return rows;
}

function dayKey(v){const d=new Date(v);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function dayTitle(v){const d=new Date(v),now=new Date(),tom=new Date(Date.now()+86400000);if(dayKey(d)===dayKey(now))return'Aujourd’hui';if(dayKey(d)===dayKey(tom))return'Demain';return new Intl.DateTimeFormat('fr-FR',{weekday:'long',day:'numeric',month:'long'}).format(d);}
function grouped(rows){const groups=[];for(const item of rows){const key=urgency(item)==='overdue'&&!isFinalStatus(item)?'overdue':dayKey(item.event_at);let g=groups.find(x=>x.key===key);if(!g){g={key,label:key==='overdue'?'En retard':dayTitle(item.event_at),items:[]};groups.push(g);}g.items.push(item);}return groups;}

function agendaRow(item){
  const time=item.date_only?'Journée':formatTime(item.event_at);const projectLabel=projectName(item.project_id);const att=urgency(item);
  const href=item.route||'#/calendar';
  const body=`<span class="ag-type-icon ${att}">${itemIcon(item)}</span><span class="ag-time">${esc(time)}</span><div class="ag-item-copy"><div><strong>${esc(item.title)}</strong>${item.is_mine?'<span class="ag-mine">Pour vous</span>':''}</div><small>${esc(projectLabel)} · ${esc(itemTypeLabel(item))}${item.priority?` · ${esc(item.priority)}`:''}</small></div><span class="ag-status ${att}">${esc(att==='overdue'?'En retard':item.needs_attention?'À traiter':statusLabel(item))}</span><span class="ag-chevron">›</span>`;
  return item.item_type==='meeting'?`<a class="ag-item ${att}" href="#/calendar/meeting/${item.item_id}">${body}</a>`:`<a class="ag-item ${att}" href="${escAttr(href)}">${body}</a>`;
}

function stats(){const now=Date.now(),week=now+7*86400000;const mine=state.items.filter(x=>x.is_mine);const attention=state.items.filter(x=>x.needs_attention&&!isFinalStatus(x)).length;const due=mine.filter(x=>!isFinalStatus(x)&&itemDate(x)&&itemDate(x).getTime()>=now&&itemDate(x).getTime()<=week).length;const next=mine.filter(x=>x.item_type==='meeting'&&!isFinalStatus(x)&&itemDate(x)>=new Date()).sort((a,b)=>itemDate(a)-itemDate(b))[0];return{attention,due,next};}
function viewButton(key,label){return `<button class="ag-view ${state.view===key?'active':''}" data-ag-action="view" data-view="${key}">${esc(label)}</button>`;}
function projectOptions(){return `<option value="all">Tous les projets</option><option value="workspace">Espace entier</option>${state.projects.map(p=>`<option value="${p.id}" ${state.projectFilter===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}`;}

function renderAgenda(){
  const rows=filteredItems(),groups=grouped(rows),s=stats();
  return `<div class="ag-page"><header class="ag-page-head"><div><span class="ag-eyebrow">Temps, échéances et rendez-vous</span><h1>Agenda</h1><p>Une seule vue pour savoir ce qui arrive, ce qui est en retard et quand l’équipe doit se synchroniser.</p></div>${canCreateMeeting()?'<button class="btn primary" data-ag-action="new-meeting">＋ Réunion</button>':''}</header>
    <section class="ag-stats"><div><span>À traiter</span><strong>${s.attention}</strong><small>réponse ou échéance proche</small></div><div><span>7 prochains jours</span><strong>${s.due}</strong><small>éléments pour vous</small></div><div><span>Prochaine réunion</span><strong class="text">${s.next?esc(formatDateTime(s.next.event_at)):'Libre'}</strong><small>${s.next?esc(s.next.title):'aucun point planifié'}</small></div></section>
    <div class="ag-controls"><div class="ag-views">${viewButton('upcoming','À venir')}${viewButton('meetings','Réunions')}${viewButton('deadlines','Échéances')}${viewButton('history','Historique')}</div><div class="ag-filters"><div class="ag-scope"><button class="${state.scope==='mine'?'active':''}" data-ag-action="scope" data-scope="mine">Pour moi</button><button class="${state.scope==='all'?'active':''}" data-ag-action="scope" data-scope="all">Tous mes projets</button></div><select data-ag-input="project-filter">${projectOptions()}</select></div></div>
    <div class="ag-timeline">${groups.length?groups.map(g=>`<section class="ag-day ${g.key==='overdue'?'overdue':''}"><header><strong>${esc(g.label)}</strong><span>${g.items.length}</span></header><div>${g.items.map(agendaRow).join('')}</div></section>`).join(''):`<div class="ag-empty"><strong>Rien dans cette vue</strong><span>Changez de filtre ou profitez de ce créneau.</span></div>`}</div>
  </div>${modalHtml()}`;
}

function attendeeRows(meetingId){return state.meetingAttendees.filter(a=>a.meeting_id===meetingId);}
function attendeeHtml(meetingId){const rows=attendeeRows(meetingId);return rows.length?`<div class="ag-attendees">${rows.map(a=>`<span>${avatar(a.user_id)}<b>${esc(displayName(a.user_id))}</b><small>${a.response==='accepted'?'Participe':a.response==='declined'?'Décline':'En attente'}</small></span>`).join('')}</div>`:'<p class="ag-muted">Aucun participant.</p>';}
function safeHttpUrl(value){try{const u=new URL(String(value||''));return ['http:','https:'].includes(u.protocol)?u.href:'';}catch{return'';}}
function meetingStatusLabel(v){return({planned:'Planifiée',live:'En cours',completed:'Terminée',cancelled:'Annulée'})[v]||v;}
function participantIdsForProject(projectId){const ids=new Set();if(!projectId){state.members.filter(m=>m.role!=='guest').forEach(m=>ids.add(m.user_id));}else{state.projectMembers.filter(pm=>pm.project_id===projectId).forEach(pm=>ids.add(pm.user_id));state.members.filter(m=>['owner','admin'].includes(m.role)||(m.role==='member'&&m.access_mode==='all')).forEach(m=>ids.add(m.user_id));}ids.delete(state.user.id);return [...ids];}
function participantChecks(projectId,selected=[]){const set=new Set(selected);return participantIdsForProject(projectId).map(id=>`<label><input type="checkbox" name="attendeeIds" value="${id}" ${set.has(id)?'checked':''}>${avatar(id)}<span>${esc(displayName(id))}${member(id)?.role==='guest'?' · invité':''}</span></label>`).join('')||'<small>Aucun autre participant disponible.</small>';}
function writableProjects(){return state.projects.filter(p=>p.status==='active').map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');}
function defaultMeetingDraft(){const d=new Date(Date.now()+3600000);d.setMinutes(d.getMinutes()<30?30:0,0,0);if(d.getMinutes()===0&&d.getTime()<Date.now()+1800000)d.setHours(d.getHours()+1);const end=new Date(d.getTime()+3600000);return{title:'',projectId:'',visibility:'internal',startsAt:localInput(d),endsAt:localInput(end),agenda:'',videoRoom:'',attendeeIds:[]};}
function captureMeetingDraft(form){if(!form)return;const fd=new FormData(form);modal.draft={title:String(fd.get('title')||''),projectId:String(fd.get('projectId')||''),visibility:String(fd.get('visibility')||'internal'),startsAt:String(fd.get('startsAt')||''),endsAt:String(fd.get('endsAt')||''),agenda:String(fd.get('agenda')||''),videoRoom:String(fd.get('videoRoom')||''),attendeeIds:fd.getAll('attendeeIds').map(String)};}

function newMeetingModal(){const d=modal.draft||defaultMeetingDraft();return `<div class="ag-modal-backdrop" data-ag-action="backdrop"><section class="ag-modal" role="dialog" aria-modal="true"><header><div><span class="ag-eyebrow">Planifier</span><h2>Nouvelle réunion</h2><p>Un rendez-vous uniquement quand un échange synchrone apporte de la valeur.</p></div><button data-ag-action="close-modal">×</button></header><form data-ag-form="meeting-create"><div class="ag-form-grid"><label class="span-2">Titre<input name="title" required maxlength="160" value="${escAttr(d.title)}"></label><label>Projet<select name="projectId" data-ag-input="meeting-project"><option value="">Espace entier</option>${state.projects.filter(p=>p.status==='active').map(p=>`<option value="${p.id}" ${d.projectId===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label><label>Visibilité<select name="visibility"><option value="internal" ${d.visibility!=='shared'?'selected':''}>Interne</option><option value="shared" ${d.visibility==='shared'?'selected':''}>Partagée aux invités</option></select></label><label>Début<input type="datetime-local" name="startsAt" required value="${escAttr(d.startsAt)}"></label><label>Fin<input type="datetime-local" name="endsAt" value="${escAttr(d.endsAt)}"></label><div class="span-2"><span class="ag-label">Participants</span><div class="ag-participant-grid">${participantChecks(d.projectId,d.attendeeIds)}</div></div><label class="span-2">Objectif / agenda<textarea name="agenda" rows="4" placeholder="Pourquoi ce point est-il nécessaire ?">${esc(d.agenda)}</textarea></label><label class="span-2">Lien visio <input name="videoRoom" placeholder="https://…" value="${escAttr(d.videoRoom)}"></label></div><div class="ag-modal-actions"><button type="button" class="btn" data-ag-action="close-modal">Annuler</button><button class="btn primary">Planifier</button></div></form></section></div>`;}
function modalHtml(){return modal?.type==='meeting-create'?newMeetingModal():'';}

function renderMeetingDetail(){
  const m=selectedMeeting;if(!m)return `<div class="ag-page"><a class="ag-back" href="#/calendar">← Agenda</a><div class="ag-empty"><strong>Réunion introuvable</strong><span>Elle a peut-être été supprimée ou votre accès a changé.</span></div></div>`;
  const canManage=Boolean(meetingCapabilities?.can_manage),canRsvp=Boolean(meetingCapabilities?.can_rsvp),video=safeHttpUrl(m.video_room),rows=attendeeRows(m.id);
  const editableAttendees=canManage&&!['completed','cancelled'].includes(m.status);
  return `<div class="ag-page ag-meeting-detail"><a class="ag-back" href="#/calendar">← Agenda</a><header class="ag-page-head meeting"><div><span class="ag-eyebrow">${esc(projectName(m.project_id))} · ${esc(meetingStatusLabel(m.status))}</span><h1>${esc(m.title)}</h1><p>${m.starts_at?esc(formatDateTime(m.starts_at)):'Date à définir'}${m.ends_at?` → ${esc(formatTime(m.ends_at))}`:''}</p></div><div class="ag-head-actions">${video?`<a class="btn" href="${escAttr(video)}" target="_blank" rel="noopener noreferrer">Rejoindre la visio</a>`:''}<button class="btn" data-ag-action="meeting-chat" data-id="${m.id}">Discussion</button></div></header>
    ${canRsvp?`<section class="ag-rsvp"><div><strong>Votre réponse</strong><span>Confirmez votre présence pour que l’équipe sache sur qui compter.</span></div><div><button class="btn ${meetingCapabilities.response==='accepted'?'primary':''}" data-ag-action="rsvp" data-response="accepted">✓ Je participe</button><button class="btn ${meetingCapabilities.response==='declined'?'danger':''}" data-ag-action="rsvp" data-response="declined">Je décline</button></div></section>`:''}
    <section class="ag-meeting-people"><div class="ag-section-head"><div><span class="ag-eyebrow">Participants</span><h2>${rows.length} personne${rows.length>1?'s':''}</h2></div></div>${attendeeHtml(m.id)}</section>
    <form class="ag-meeting-form" data-ag-form="meeting-update"><input type="hidden" name="meetingId" value="${m.id}"><div class="ag-meeting-stage"><span class="${m.status==='planned'?'active':''}">1 · Avant</span><span class="${m.status==='live'?'active':''}">2 · Live</span><span class="${m.status==='completed'?'active':''}">3 · Après</span></div>
      <section><div><span class="ag-eyebrow">Cadre</span><h2>Planification</h2></div><div class="ag-form-grid"><label class="span-2">Titre<input name="title" required value="${escAttr(m.title)}" ${canManage?'':'readonly'}></label><label>Début<input name="startsAt" type="datetime-local" required value="${escAttr(localInput(m.starts_at))}" ${canManage?'':'disabled'}></label><label>Fin<input name="endsAt" type="datetime-local" value="${escAttr(localInput(m.ends_at))}" ${canManage?'':'disabled'}></label><label>État<select name="status" ${canManage?'':'disabled'}>${['planned','live','completed','cancelled'].map(v=>`<option value="${v}" ${m.status===v?'selected':''}>${esc(meetingStatusLabel(v))}</option>`).join('')}</select></label><label>Visibilité<select name="visibility" ${canManage?'':'disabled'}><option value="internal" ${m.visibility!=='shared'?'selected':''}>Interne</option><option value="shared" ${m.visibility==='shared'?'selected':''}>Partagée</option></select></label><label class="span-2">Lien visio<input name="videoRoom" value="${escAttr(m.video_room||'')}" ${canManage?'':'readonly'}></label>${editableAttendees?`<div class="span-2"><span class="ag-label">Participants</span><div class="ag-participant-grid">${participantChecks(m.project_id,rows.map(x=>x.user_id).filter(id=>id!==m.created_by))}</div></div>`:''}</div></section>
      <section><div><span class="ag-eyebrow">Avant</span><h2>Objectif & agenda</h2></div><textarea name="agenda" rows="5" ${canManage?'':'readonly'}>${esc(m.agenda||'')}</textarea></section>
      <section><div><span class="ag-eyebrow">Live</span><h2>Notes factuelles</h2></div><textarea name="liveNotes" rows="7" ${canManage?'':'readonly'}>${esc(m.live_notes||'')}</textarea></section>
      <section><div><span class="ag-eyebrow">Après</span><h2>Synthèse & prochaines étapes</h2></div><textarea name="summary" rows="6" ${canManage?'':'readonly'}>${esc(m.summary||'')}</textarea></section>
      ${canManage?'<div class="ag-savebar"><span>Les décisions et actions restent des objets séparés et traçables.</span><button class="btn primary">Enregistrer la réunion</button></div>':''}
    </form></div>`;
}

function render(){if(!state)return;positionRoot();root.innerHTML=state.route.meetingId?renderMeetingDetail():renderAgenda();}
function toast(msg,error=false){const n=document.createElement('div');n.className=`ag-toast ${error?'error':''}`;n.textContent=msg;root.appendChild(n);setTimeout(()=>n.remove(),3000);}
function setBusy(form,on){form?.querySelectorAll('button,input,textarea,select').forEach(el=>el.disabled=on);}
function showError(error,form=null){const msg=String(error?.message||error||'Erreur inconnue').replace(/^Action [^:]+\s*:\s*/,'');if(form){let n=form.querySelector('.ag-form-error');if(!n){n=document.createElement('div');n.className='ag-form-error';form.prepend(n);}n.textContent=msg;}else toast(msg,true);}

root.addEventListener('click',async(event)=>{
  const t=event.target.closest('[data-ag-action]');if(!t)return;const a=t.dataset.agAction;
  try{
    if(a==='backdrop'&&event.target!==t)return;
    if(a==='reload')return activate({force:true});
    if(a==='view'){state.view=t.dataset.view||'upcoming';render();return;}
    if(a==='scope'){state.scope=t.dataset.scope||'mine';render();return;}
    if(a==='new-meeting'){modal={type:'meeting-create',draft:defaultMeetingDraft()};render();return;}
    if(a==='close-modal'||a==='backdrop'){modal=null;render();return;}
    if(a==='rsvp'){await api.rpc('set_meeting_response_v2',{p_meeting_id:selectedMeeting.id,p_response:t.dataset.response});await loadWorkspace(route());toast('Réponse enregistrée');return;}
    if(a==='meeting-chat'){const id=one(await api.rpc('get_or_create_meeting_conversation_v1',{p_meeting_id:t.dataset.id}));if(id)location.hash=`#/messages/${id}`;return;}
  }catch(error){showError(error);}
});

root.addEventListener('change',(event)=>{
  const el=event.target;
  if(el.dataset.agInput==='project-filter'){state.projectFilter=el.value||'all';render();return;}
  if(el.dataset.agInput==='meeting-project'&&modal?.type==='meeting-create'){const form=el.closest('form');captureMeetingDraft(form);if(!modal.draft.projectId)modal.draft.visibility='internal';render();}
});

root.addEventListener('submit',async(event)=>{
  const form=event.target.closest('form[data-ag-form]');if(!form)return;event.preventDefault();if(busy)return;busy=true;setBusy(form,true);
  try{
    const fd=new FormData(form),type=form.dataset.agForm;
    if(type==='meeting-create'){
      const attendees=fd.getAll('attendeeIds').map(String),projectId=String(fd.get('projectId')||''),visibility=String(fd.get('visibility')||'internal');
      if(!projectId&&visibility==='shared')throw new Error('Une réunion d’espace entier reste interne.');
      const id=one(await api.rpc('create_meeting_with_attendees_v2',{p_workspace_id:state.workspaceId,p_title:String(fd.get('title')||'').trim(),p_starts_at:localIso(fd.get('startsAt')),p_ends_at:localIso(fd.get('endsAt')),p_project_id:projectId||null,p_video_room:String(fd.get('videoRoom')||'').trim()||null,p_visibility:visibility,p_attendee_ids:attendees,p_agenda:String(fd.get('agenda')||'').trim()}));
      modal=null;await loadWorkspace({active:true,meetingId:String(id||'')});location.hash=`#/calendar/meeting/${id}`;toast('Réunion planifiée');
    }else if(type==='meeting-update'){
      const attendees=fd.getAll('attendeeIds').map(String);await api.rpc('update_meeting_v2',{p_meeting_id:selectedMeeting.id,p_title:String(fd.get('title')||selectedMeeting.title).trim(),p_starts_at:localIso(fd.get('startsAt'))||selectedMeeting.starts_at,p_ends_at:localIso(fd.get('endsAt')),p_video_room:String(fd.get('videoRoom')||'').trim()||null,p_visibility:String(fd.get('visibility')||selectedMeeting.visibility),p_agenda:String(fd.get('agenda')||'').trim(),p_live_notes:String(fd.get('liveNotes')||'').trim(),p_summary:String(fd.get('summary')||'').trim(),p_status:String(fd.get('status')||selectedMeeting.status),p_attendee_ids:attendees});await loadWorkspace(route());toast('Réunion mise à jour');
    }
  }catch(error){showError(error,form);}finally{busy=false;setBusy(form,false);}
});

function hasDraft(){return Boolean(modal||busy||root.querySelector('form[data-ag-form] :focus'));}
async function probeSync(){if(!state||!isActive()||document.hidden||hasDraft())return;try{const rows=await api.rpc('get_workspace_sync_digest_v1',{p_workspace_id:state.workspaceId});const next=String(one(rows)?.digest||rows?.digest||'');if(next&&syncDigest&&next!==syncDigest)await loadWorkspace(route());else if(next)syncDigest=next;}catch{}}
function startSync(){if(syncTimer)return;syncTimer=setInterval(probeSync,SYNC_MS);}
function stopSync(){if(syncTimer){clearInterval(syncTimer);syncTimer=null;}}

window.addEventListener('hashchange',()=>{modal=null;activate();});
window.addEventListener('resize',positionRoot);
window.addEventListener('focus',()=>{if(isActive())probeSync();});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&isActive())probeSync();});

activate();
console.info(`[2b2c] ${VERSION}`);

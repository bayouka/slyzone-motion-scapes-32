import { SupabaseBrowserClient } from './supabase-client.js';

const VERSION='2b2c communication workspace v1.0.0';
const config=window.__4B4C_CONFIG__||{};
const api=new SupabaseBrowserClient({url:config.supabaseUrl,publishableKey:config.supabasePublishableKey});
const workspaceKey=config.workspaceStorageKey||'4b4c.live.workspace.v1';
const POLL_MS=8000;
const MAX_FILES=10;
const MAX_FILE_SIZE=25*1024*1024;

const root=document.createElement('section');
root.id='communication-workspace-v1';
root.className='communication-workspace-v1';
root.hidden=true;
root.setAttribute('aria-label','Échanges et communication');
document.body.appendChild(root);

let state=null;
let modal=null;
let busy=false;
let loadToken=0;
let selectedFiles=[];
let syncDigest='';
let syncTimer=null;
let searchResults=[];
let searchBusy=false;

const esc=(v)=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const escAttr=esc;
const one=(v)=>Array.isArray(v)?(v[0]??null):v;
const safeName=(name)=>String(name||'fichier').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/^-+|-+$/g,'')||'fichier';
const dateTime=(v)=>v?new Intl.DateTimeFormat('fr-FR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v)):'—';
const timeOnly=(v)=>v?new Intl.DateTimeFormat('fr-FR',{hour:'2-digit',minute:'2-digit'}).format(new Date(v)):'—';
const dayKey=(v)=>v?new Date(v).toLocaleDateString('fr-CA'):'—';
const dayLabel=(v)=>v?new Intl.DateTimeFormat('fr-FR',{weekday:'long',day:'numeric',month:'long'}).format(new Date(v)):'—';
const bytes=(n)=>{n=Number(n||0);if(n<1024)return `${n} o`;if(n<1048576)return `${(n/1024).toFixed(1)} Ko`;return `${(n/1048576).toFixed(1)} Mo`;};
const initials=(name)=>String(name||'?').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'?';

function route(){
  const h=location.hash||'';
  const m=h.match(/^#\/messages(?:\/([^/?]+))?(?:\/message\/([^/?]+))?/);
  return m?{active:true,conversationId:m[1]||'',messageId:m[2]||''}:{active:false,conversationId:'',messageId:''};
}
function isActive(){return route().active;}
function workspaceId(){return localStorage.getItem(workspaceKey)||'';}
function profile(id){return state?.profiles?.find(p=>p.id===id)||null;}
function member(id){return state?.members?.find(m=>m.user_id===id)||null;}
function displayName(id){return profile(id)?.display_name||member(id)?.email||'Membre';}
function avatar(id,size='md'){const name=displayName(id);return `<span class="cw-avatar ${size}">${esc(initials(name))}</span>`;}
function projectName(id){return state?.projects?.find(p=>p.id===id)?.name||'';}
function meetingById(id){return state?.meetings?.find(m=>m.id===id)||null;}
function conversationById(id){return state?.conversations?.find(c=>c.id===id)||null;}
function conversationMembers(id){return state?.conversationMembers?.filter(cm=>cm.conversation_id===id)||[];}
function isOneToOne(c){return c?.kind==='direct'&&Boolean(c.direct_pair_key);}
function conversationTitle(c){
  if(!c)return'';
  if(isOneToOne(c)){
    const other=conversationMembers(c.id).find(cm=>cm.user_id!==state.user.id);
    return other?displayName(other.user_id):'Message direct';
  }
  return c.title||'Conversation';
}
function conversationKind(c){
  if(!c)return'';
  if(c.kind==='team')return 'Équipe';
  if(c.kind==='project')return 'Projet';
  if(c.kind==='context'&&c.context_type==='meeting')return 'Réunion';
  if(c.kind==='direct')return isOneToOne(c)?'Privé':'Groupe privé';
  return 'Conversation';
}
function contextLabel(c){
  if(!c)return'';
  if(c.kind==='project')return projectName(c.project_id)||'Projet';
  if(c.kind==='context'&&c.context_type==='meeting'){
    const m=meetingById(c.context_id);return m?`${m.title}${m.starts_at?` · ${dateTime(m.starts_at)}`:''}`:'Réunion';
  }
  if(c.kind==='direct'&&c.linked_project_id)return `Contexte : ${projectName(c.linked_project_id)}`;
  if(c.kind==='team')return 'Espace interne';
  const count=conversationMembers(c.id).length;return `${count} participant${count>1?'s':''}`;
}
function unreadCount(id){return Number(state?.unread?.find(x=>x.conversation_id===id)?.unread_count||0);}
function lastMessage(c){return state?.recentMessages?.find(m=>m.conversation_id===c.id&&!m.deleted_at)||null;}
function sortConversations(rows){return [...rows].sort((a,b)=>new Date(b.last_message_at||b.updated_at||b.created_at)-new Date(a.last_message_at||a.updated_at||a.created_at));}
function positionRoot(){
  if(root.hidden)return;
  const host=document.querySelector('.live-content');
  if(!host)return;
  const r=host.getBoundingClientRect();
  root.style.left=`${Math.max(0,r.left)}px`;
  root.style.top=`${Math.max(0,r.top)}px`;
  root.style.width=`${Math.max(320,r.width)}px`;
  root.style.height=`${Math.max(320,innerHeight-Math.max(0,r.top))}px`;
}
async function waitForHost(){for(let i=0;i<20;i++){const h=document.querySelector('.live-content');if(h)return h;await new Promise(r=>setTimeout(r,70));}return null;}

function hide(){
  state=null;modal=null;selectedFiles=[];searchResults=[];root.hidden=true;root.innerHTML='';
  document.body.classList.remove('communication-workspace-open-v1');
  stopSync();
}
async function activate({force=false}={}){
  const r=route();
  if(!r.active){hide();return;}
  root.hidden=false;document.body.classList.add('communication-workspace-open-v1');
  await waitForHost();positionRoot();
  if(!state||force||state.workspaceId!==workspaceId())await loadWorkspace(r);
  else{
    state.route=r;
    if(r.conversationId&&(!state.current||state.current.id!==r.conversationId))await loadConversation(r.conversationId,r.messageId);
    render();
  }
  startSync();
}

async function loadWorkspace(r=route()){
  const token=++loadToken;
  root.innerHTML='<div class="cw-loading"><span></span><strong>Chargement des échanges…</strong></div>';
  try{
    const wid=workspaceId();if(!wid)throw new Error('Aucun espace de travail sélectionné.');
    const user=await api.getUser();if(!user?.id)throw new Error('Votre session a expiré.');
    const membership=one(await api.select('workspace_members',`select=*&workspace_id=eq.${wid}&user_id=eq.${user.id}&status=eq.active&limit=1`));
    if(!membership)throw new Error('Vous n’avez plus accès à cet espace.');
    const [conversations,projects,members,profiles,meetings,meetingAttendees,notifications,unread,badges,recentMessages,digestRows]=await Promise.all([
      api.select('conversations',`select=*&workspace_id=eq.${wid}&status=neq.archived&order=last_message_at.desc.nullslast,updated_at.desc`),
      api.select('projects',`select=id,name,status,visibility,lead_user_id&workspace_id=eq.${wid}&status=neq.archived&order=name.asc`),
      api.select('workspace_members',`select=*&workspace_id=eq.${wid}&status=eq.active&order=joined_at.asc`),
      api.select('profiles','select=id,display_name,avatar_url&order=display_name.asc'),
      api.select('meetings',`select=*&workspace_id=eq.${wid}&order=starts_at.desc.nullslast&limit=100`).catch(()=>[]),
      api.select('meeting_attendees','select=*').catch(()=>[]),
      api.select('notifications',`select=*&workspace_id=eq.${wid}&user_id=eq.${user.id}&kind=eq.mention&read_at=is.null&order=created_at.desc&limit=100`).catch(()=>[]),
      api.rpc('get_unread_conversations_v2',{p_workspace_id:wid}).catch(()=>[]),
      api.rpc('get_message_badges_v2',{p_workspace_id:wid}).catch(()=>[]),
      api.select('messages',`select=*&workspace_id=eq.${wid}&order=created_at.desc&limit=300`).catch(()=>[]),
      api.rpc('get_workspace_sync_digest_v1',{p_workspace_id:wid}).catch(()=>[]),
    ]);
    let conversationMembers=[];
    if(conversations.length)conversationMembers=await api.select('conversation_members',`select=*&conversation_id=in.(${conversations.map(c=>c.id).join(',')})`).catch(()=>[]);
    if(token!==loadToken)return;
    state={workspaceId:wid,user,membership,conversations,projects,members,profiles,meetings,meetingAttendees,notifications:Array.isArray(notifications)?notifications:[],conversationMembers,unread:Array.isArray(unread)?unread:[],badges:one(badges)||{},recentMessages:Array.isArray(recentMessages)?recentMessages:[],route:r,current:null,messages:[],attachments:[],capabilities:null,filter:state?.filter||'all',conversationQuery:state?.conversationQuery||'',searchQuery:'',searchOpen:false};
    syncDigest=String(one(digestRows)?.digest||digestRows?.digest||'');
    if(r.conversationId)await loadConversation(r.conversationId,r.messageId,{renderAfter:false});
    render();
  }catch(error){if(token!==loadToken)return;root.innerHTML=`<div class="cw-error"><strong>Échanges indisponibles</strong><p>${esc(error?.message||error)}</p><button class="btn" data-cw-action="reload">Réessayer</button></div>`;}
}

async function loadConversation(id,messageId='',{renderAfter=true}={}){
  const c=conversationById(id);if(!c){location.hash='#/messages';return;}
  const [messages,capabilities]=await Promise.all([
    api.select('messages',`select=*&conversation_id=eq.${id}&order=created_at.asc&limit=300`),
    api.rpc('get_conversation_capabilities_v1',{p_conversation_id:id}).catch(()=>[]),
  ]);
  let attachments=[];
  const ids=(messages||[]).map(m=>m.id);
  if(ids.length)attachments=await api.select('attachments',`select=*&message_id=in.(${ids.join(',')})&order=created_at.asc`).catch(()=>[]);
  state.current=c;state.messages=messages||[];state.attachments=attachments||[];state.capabilities=one(capabilities)||{can_manage:false,can_announce:false,can_link_project:false};
  try{await api.rpc('mark_conversation_read_v3',{p_conversation_id:id,p_seen_at:new Date().toISOString()});await refreshBadges();}catch{}
  if(renderAfter)render();
  if(messageId)setTimeout(()=>document.getElementById(`cw-message-${CSS.escape(messageId)}`)?.scrollIntoView({block:'center'}),50);
  else setTimeout(()=>{const log=root.querySelector('.cw-message-log');if(log)log.scrollTop=log.scrollHeight;},30);
}

async function refreshBadges(){
  if(!state)return;
  const [notifications,unread,badges]=await Promise.all([
    api.select('notifications',`select=*&workspace_id=eq.${state.workspaceId}&user_id=eq.${state.user.id}&kind=eq.mention&read_at=is.null&order=created_at.desc&limit=100`).catch(()=>[]),
    api.rpc('get_unread_conversations_v2',{p_workspace_id:state.workspaceId}).catch(()=>[]),
    api.rpc('get_message_badges_v2',{p_workspace_id:state.workspaceId}).catch(()=>[]),
  ]);
  state.notifications=Array.isArray(notifications)?notifications:[];state.unread=Array.isArray(unread)?unread:[];state.badges=one(badges)||{};
}

function filteredConversations(){
  if(!state)return[];
  let rows=state.conversations.filter(c=>c.status!=='archived');
  const q=String(state.conversationQuery||'').trim().toLowerCase();
  if(q)rows=rows.filter(c=>`${conversationTitle(c)} ${contextLabel(c)}`.toLowerCase().includes(q));
  if(state.filter==='unread')rows=rows.filter(c=>unreadCount(c.id)>0);
  else if(state.filter==='mentions'){
    const routes=new Set((state.notifications||[]).filter(n=>n.kind==='mention'&&!n.read_at).map(n=>String(n.route||'').split('/')[2]));
    rows=rows.filter(c=>routes.has(c.id));
  }
  else if(state.filter==='project')rows=rows.filter(c=>c.kind==='project');
  else if(state.filter==='private')rows=rows.filter(c=>c.kind==='direct');
  else if(state.filter==='meeting')rows=rows.filter(c=>c.kind==='context'&&c.context_type==='meeting');
  return sortConversations(rows);
}

function conversationRow(c){
  const unread=unreadCount(c.id);const last=lastMessage(c);const active=state.current?.id===c.id;
  return `<a class="cw-conversation-row ${active?'active':''}" href="#/messages/${c.id}">
    <div class="cw-row-icon ${c.kind}">${c.kind==='direct'?avatar(conversationMembers(c.id).find(x=>x.user_id!==state.user.id)?.user_id||state.user.id,'sm'):`<span>${c.kind==='project'?'P':c.kind==='team'?'É':'R'}</span>`}</div>
    <div class="cw-row-copy"><div><strong>${esc(conversationTitle(c))}</strong><time>${last?timeOnly(last.created_at):''}</time></div><small>${esc(contextLabel(c))}</small><p>${last?`${last.author_id===state.user.id?'Vous : ':''}${esc(last.deleted_at?'Message supprimé':last.body).slice(0,90)}`:'Aucun message'}</p></div>
    ${unread?`<span class="cw-unread">${unread>99?'99+':unread}</span>`:''}
  </a>`;
}

function filterButton(value,label,count=''){return `<button class="cw-filter ${state.filter===value?'active':''}" data-cw-action="filter" data-filter="${value}">${esc(label)}${count!==''?` <span>${count}</span>`:''}</button>`;}
function renderSidebar(){
  const rows=filteredConversations();
  return `<aside class="cw-sidebar">
    <div class="cw-sidebar-head"><div><span class="cw-eyebrow">Communication</span><h1>Messages</h1></div><button class="cw-icon-btn primary" data-cw-action="new-menu" aria-label="Nouvelle conversation">＋</button></div>
    <label class="cw-search"><span>⌕</span><input data-cw-input="conversation-search" value="${escAttr(state.conversationQuery||'')}" placeholder="Rechercher un fil"></label>
    <div class="cw-filters">${filterButton('all','Tous')}${filterButton('unread','Non lus',Number(state.badges?.unread_messages||0))}${filterButton('mentions','Mentions',Number(state.badges?.unread_mentions||0))}${filterButton('project','Projets')}${filterButton('private','Privés')}${filterButton('meeting','Réunions')}</div>
    <div class="cw-sidebar-actions"><button class="btn small" data-cw-action="search-messages">⌕ Rechercher dans les messages</button></div>
    <div class="cw-conversation-list">${rows.length?rows.map(conversationRow).join(''):`<div class="cw-empty"><strong>Aucun fil ici</strong><span>Changez de filtre ou créez une conversation.</span></div>`}</div>
  </aside>`;
}

function renderFilePreview(){const host=root.querySelector('.cw-file-preview');if(host)host.innerHTML=selectedFiles.map((f,i)=>`<span>📎 ${esc(f.name)} <button type="button" data-cw-action="remove-file" data-index="${i}">×</button></span>`).join('');}
function messageAttachments(m){
  const rows=state.attachments.filter(a=>a.message_id===m.id);if(!rows.length)return'';
  return `<div class="cw-attachments">${rows.map(a=>`<button class="cw-attachment" data-cw-action="open-attachment" data-id="${a.id}"><span>📎</span><div><strong>${esc(a.file_name)}</strong><small>${bytes(a.size_bytes)}</small></div></button>`).join('')}</div>`;
}
function replyPreview(m){
  if(!m.reply_to_id)return'';const p=state.messages.find(x=>x.id===m.reply_to_id);if(!p)return'';
  return `<button class="cw-reply-preview" data-cw-action="jump-message" data-message="${p.id}"><strong>${esc(displayName(p.author_id))}</strong><span>${esc(p.deleted_at?'Message supprimé':p.body).slice(0,140)}</span></button>`;
}
function projectContextForConversation(c){return c?.project_id||c?.linked_project_id||null;}
function messageCard(m){
  const mine=m.author_id===state.user.id;const canTransform=!m.deleted_at;const projectId=projectContextForConversation(state.current);
  return `<article class="cw-message ${mine?'mine':''} ${m.is_announcement?'announcement':''}" id="cw-message-${m.id}">
    ${avatar(m.author_id,'sm')}
    <div class="cw-message-body"><header><strong>${esc(displayName(m.author_id))}</strong><time>${timeOnly(m.created_at)}${m.edited_at?' · modifié':''}</time>${m.is_announcement?'<span class="cw-tag attention">Annonce</span>':''}</header>
      ${m.subject?`<h4>${esc(m.subject)}</h4>`:''}${replyPreview(m)}
      <div class="cw-message-text">${m.deleted_at?'<em>Message supprimé</em>':esc(m.body).replace(/\n/g,'<br>')}</div>
      ${!m.deleted_at?messageAttachments(m):''}
      ${!m.deleted_at?`<footer><button data-cw-action="reply" data-message="${m.id}">Répondre</button>${mine?`<button data-cw-action="edit-message" data-message="${m.id}">Modifier</button><button class="danger" data-cw-action="delete-message" data-message="${m.id}">Supprimer</button>`:''}${canTransform?`<button data-cw-action="transform" data-message="${m.id}" data-kind="action" data-project="${projectId||''}">→ Action</button><button data-cw-action="transform" data-message="${m.id}" data-kind="request" data-project="${projectId||''}">→ Demande</button><button data-cw-action="transform" data-message="${m.id}" data-kind="decision" data-project="${projectId||''}">→ Décision</button>`:''}</footer>`:''}
    </div>
  </article>`;
}
function messageLog(){
  if(!state.messages.length)return '<div class="cw-empty chat"><strong>Aucun message</strong><span>Commencez la conversation.</span></div>';
  let html='';let currentDay='';
  for(const m of state.messages){const d=dayKey(m.created_at);if(d!==currentDay){currentDay=d;html+=`<div class="cw-day"><span>${esc(dayLabel(m.created_at))}</span></div>`;}html+=messageCard(m);}return html;
}
function participantSummary(c){
  const ids=conversationMembers(c.id).map(x=>x.user_id);if(c.kind==='project')return `${ids.length} personne${ids.length>1?'s':''} ayant accès au projet`;
  return ids.slice(0,4).map(displayName).join(', ')+(ids.length>4?` +${ids.length-4}`:'');
}
function renderConversation(){
  const c=state.current;if(!c)return `<main class="cw-main cw-no-selection"><div class="cw-empty hero"><strong>Sélectionnez une conversation</strong><span>Les messages restent séparés de la cloche : seuls mentions, annonces et obligations demandent votre attention.</span><button class="btn primary" data-cw-action="new-menu">Nouvelle conversation</button></div></main>`;
  const reply=state.replyTo?state.messages.find(m=>m.id===state.replyTo):null;
  return `<main class="cw-main">
    <header class="cw-conversation-head"><div class="cw-head-left"><a class="cw-mobile-back" href="#/messages">‹</a><div><span class="cw-eyebrow">${esc(conversationKind(c))}</span><h2>${esc(conversationTitle(c))}</h2><p>${esc(contextLabel(c))} · ${esc(participantSummary(c))}</p></div></div><div class="cw-head-actions"><button class="btn small cw-call-action-v2" data-cw-action="call-conversation">▣ Appeler</button>${c.kind==='direct'?'<button class="btn small" data-cw-action="link-project">Lier au projet</button>':''}${c.kind==='context'&&c.context_type==='meeting'?`<a class="btn small" href="#/calendar/meeting/${c.context_id}">Voir la réunion</a>`:''}<button class="btn small" data-cw-action="settings">Réglages</button></div></header>
    <section class="cw-message-log">${messageLog()}</section>
    ${reply?`<div class="cw-reply-banner"><span>Réponse à <strong>${esc(displayName(reply.author_id))}</strong> · ${esc(reply.body).slice(0,120)}</span><button data-cw-action="cancel-reply">×</button></div>`:''}
    <form class="cw-composer" data-cw-form="send"><input type="hidden" name="conversationId" value="${c.id}">
      <textarea name="body" maxlength="20000" placeholder="Écrire à ${escAttr(conversationTitle(c))}…"></textarea>
      <div class="cw-file-preview">${selectedFiles.map((f,i)=>`<span>📎 ${esc(f.name)} <button type="button" data-cw-action="remove-file" data-index="${i}">×</button></span>`).join('')}</div>
      <div class="cw-composer-tools"><div><label class="cw-tool">📎<input type="file" data-cw-input="files" multiple hidden></label><details class="cw-mentions"><summary>@</summary><div>${conversationMembers(c.id).filter(cm=>cm.user_id!==state.user.id).map(cm=>`<label><input type="checkbox" name="mentionIds" value="${cm.user_id}">${avatar(cm.user_id,'xs')}<span>${esc(displayName(cm.user_id))}</span></label>`).join('')||'<small>Aucun autre participant</small>'}</div></details>${state.capabilities?.can_announce?`<label class="cw-announce-toggle"><input type="checkbox" name="isAnnouncement" value="1" data-cw-input="announcement"> Annonce</label>`:''}</div><div class="cw-subject-wrap"><input name="subject" maxlength="240" placeholder="Titre de l’annonce" hidden></div><button class="btn primary" type="submit">Envoyer</button></div>
    </form>
  </main>`;
}

function render(){
  if(!state)return;positionRoot();
  root.innerHTML=`<div class="cw-shell">${renderSidebar()}${renderConversation()}</div>${modalHtml()}${state.searchOpen?searchPanelHtml():''}`;
}

function modalFrame(title,subtitle,body){return `<div class="cw-modal-backdrop" data-cw-action="backdrop"><section class="cw-modal" role="dialog" aria-modal="true"><header><div><span class="cw-eyebrow">Échanges</span><h2>${esc(title)}</h2>${subtitle?`<p>${esc(subtitle)}</p>`:''}</div><button class="cw-close" data-cw-action="close-modal">×</button></header>${body}</section></div>`;}
function memberOptions(){return state.members.filter(m=>m.user_id!==state.user.id&&m.status==='active').map(m=>`<option value="${m.user_id}">${esc(displayName(m.user_id))}${m.role==='guest'?' · invité':''}</option>`).join('');}
function projectOptions(selected=''){return state.projects.filter(p=>p.status==='active').map(p=>`<option value="${p.id}" ${p.id===selected?'selected':''}>${esc(p.name)}</option>`).join('');}
function attendeeMeetings(){return state.meetings.filter(m=>m.created_by===state.user.id||state.meetingAttendees.some(a=>a.meeting_id===m.id&&a.user_id===state.user.id));}
function modalHtml(){
  if(!modal)return'';
  if(modal.type==='new-menu')return modalFrame('Nouvelle conversation','Choisissez le bon niveau de confidentialité.',`<div class="cw-choice-grid"><button data-cw-action="modal-direct"><strong>Message privé</strong><span>1 à 1, audience fixe.</span></button><button data-cw-action="modal-group"><strong>Groupe privé</strong><span>Seulement les personnes choisies.</span></button><button data-cw-action="modal-topic"><strong>Sujet</strong><span>Équipe interne ou projet.</span></button><button data-cw-action="modal-meeting"><strong>Réunion</strong><span>Fil réservé aux participants.</span></button></div>`);
  if(modal.type==='direct')return modalFrame('Nouveau message privé','Un invité n’est disponible que si vous partagez au moins un projet.',`<form data-cw-form="direct"><label class="cw-field">Destinataire<select name="otherUserId" required><option value="">Choisir…</option>${memberOptions()}</select></label><div class="cw-modal-actions"><button type="button" class="btn" data-cw-action="close-modal">Annuler</button><button class="btn primary">Ouvrir</button></div></form>`);
  if(modal.type==='group')return modalFrame('Groupe privé','L’audience est figée aux personnes sélectionnées.',`<form data-cw-form="group"><label class="cw-field">Nom du groupe<input name="title" maxlength="120" placeholder="Ex. Produit + Design"></label><div class="cw-member-grid">${state.members.filter(m=>m.user_id!==state.user.id&&m.status==='active').map(m=>`<label><input type="checkbox" name="memberIds" value="${m.user_id}">${avatar(m.user_id,'xs')}<span>${esc(displayName(m.user_id))}${m.role==='guest'?' · invité':''}</span></label>`).join('')}</div><div class="cw-modal-actions"><button type="button" class="btn" data-cw-action="close-modal">Annuler</button><button class="btn primary">Créer</button></div></form>`);
  if(modal.type==='topic')return modalFrame('Nouveau sujet','Un sujet Équipe reste interne. Un sujet Projet suit exactement les accès du projet.',`<form data-cw-form="topic"><label class="cw-field">Portée<select name="scope"><option value="project">Projet</option>${state.membership.role!=='guest'?'<option value="team">Équipe interne</option>':''}</select></label><label class="cw-field">Projet<select name="projectId"><option value="">Choisir…</option>${projectOptions()}</select></label><label class="cw-field">Nom du sujet<input name="title" required maxlength="120" placeholder="Ex. UX mobile"></label><div class="cw-modal-actions"><button type="button" class="btn" data-cw-action="close-modal">Annuler</button><button class="btn primary">Créer</button></div></form>`);
  if(modal.type==='meeting')return modalFrame('Discussion de réunion','Le fil est accessible uniquement au créateur et aux participants de la réunion.',`<form data-cw-form="meeting"><label class="cw-field">Réunion<select name="meetingId" required><option value="">Choisir…</option>${attendeeMeetings().map(m=>`<option value="${m.id}">${esc(m.title)}${m.starts_at?` · ${esc(dateTime(m.starts_at))}`:''}</option>`).join('')}</select></label><div class="cw-modal-actions"><button type="button" class="btn" data-cw-action="close-modal">Annuler</button><button class="btn primary">Ouvrir le fil</button></div></form>`);
  if(modal.type==='settings'){
    const cm=conversationMembers(state.current.id).find(x=>x.user_id===state.user.id);return modalFrame('Réglages du fil','Les messages non lus restent dans Messages. La cloche ne remonte que les événements importants.',`<form data-cw-form="settings"><label class="cw-field">Notifications<select name="level"><option value="all" ${cm?.notification_level==='all'?'selected':''}>Annonces + mentions</option><option value="mentions" ${cm?.notification_level==='mentions'?'selected':''}>Mentions uniquement</option><option value="muted" ${cm?.notification_level==='muted'?'selected':''}>Silencieux</option></select></label>${state.capabilities?.can_manage&&state.current.kind!=='direct'?`<label class="cw-field">État du sujet<select name="status"><option value="active" ${state.current.status==='active'?'selected':''}>Actif</option><option value="resolved" ${state.current.status==='resolved'?'selected':''}>Résolu</option></select></label>`:''}<div class="cw-modal-actions"><button type="button" class="btn" data-cw-action="close-modal">Annuler</button><button class="btn primary">Enregistrer</button></div></form>`);
  }
  if(modal.type==='link-project')return modalFrame('Lier au projet','Tous les participants du direct doivent déjà avoir accès au projet. Le lien n’élargit jamais l’audience.',`<form data-cw-form="link-project"><label class="cw-field">Projet<select name="projectId" required><option value="">Choisir…</option>${projectOptions(state.current.linked_project_id||'')}</select></label><div class="cw-modal-actions"><button type="button" class="btn" data-cw-action="close-modal">Annuler</button><button class="btn primary">Lier</button></div></form>`);
  if(modal.type==='edit'){
    const m=state.messages.find(x=>x.id===modal.messageId);return modalFrame('Modifier le message','La mention existante est conservée ; la modification reste signalée dans le fil.',`<form data-cw-form="edit"><input type="hidden" name="messageId" value="${m?.id||''}">${m?.is_announcement?`<label class="cw-field">Titre<input name="subject" required maxlength="240" value="${escAttr(m.subject||'')}"></label>`:''}<label class="cw-field">Message<textarea name="body" required maxlength="20000">${esc(m?.body||'')}</textarea></label><div class="cw-modal-actions"><button type="button" class="btn" data-cw-action="close-modal">Annuler</button><button class="btn primary">Enregistrer</button></div></form>`);
  }
  if(modal.type==='transform')return transformModal();
  return'';
}
function transformModal(){
  const m=state.messages.find(x=>x.id===modal.messageId);const defaultProject=modal.projectId||projectContextForConversation(state.current)||'';
  if(modal.kind==='request')return modalFrame('Créer une demande','Le destinataire doit pouvoir lire le message source.',`<form data-cw-form="transform-request"><input type="hidden" name="messageId" value="${m.id}"><label class="cw-field">Destinataire<select name="recipientId" required><option value="">Choisir…</option>${conversationMembers(state.current.id).filter(x=>x.user_id!==state.user.id).map(x=>`<option value="${x.user_id}">${esc(displayName(x.user_id))}</option>`).join('')}</select></label><label class="cw-field">Titre<input name="title" required value="${escAttr(m.body.slice(0,100))}"></label><label class="cw-field">Détail<textarea name="body">${esc(m.body)}</textarea></label><label class="cw-field">Réponse attendue<select name="responseMode"><option value="free">Réponse libre</option><option value="approval">Approuver / refuser</option></select></label><label class="cw-field">Échéance<input type="datetime-local" name="dueAt"></label><div class="cw-modal-actions"><button type="button" class="btn" data-cw-action="close-modal">Annuler</button><button class="btn primary">Créer la demande</button></div></form>`);
  const isAction=modal.kind==='action';
  return modalFrame(isAction?'Créer une action':'Enregistrer une décision','Le message reste la source traçable. Si la destination élargit l’audience, une confirmation explicite est exigée.',`<form data-cw-form="${isAction?'transform-action':'transform-decision'}"><input type="hidden" name="messageId" value="${m.id}"><label class="cw-field">Projet<select name="projectId" ${isAction?'required':''}><option value="">${isAction?'Choisir…':'Sans projet'}</option>${projectOptions(defaultProject)}</select></label><label class="cw-field">Titre<input name="title" required value="${escAttr(m.body.slice(0,100))}"></label><label class="cw-field">${isAction?'Description':'Raison / contexte'}<textarea name="detail">${esc(m.body)}</textarea></label>${isAction?`<label class="cw-field">Priorité<select name="priority"><option value="normal">Normale</option><option value="high">Haute</option><option value="urgent">Urgente</option></select></label><label class="cw-field">Échéance<input type="datetime-local" name="dueAt"></label>`:''}<label class="cw-field">Visibilité<select name="visibility"><option value="internal">Interne</option><option value="shared">Partagée au projet, invités compris</option></select></label><label class="cw-check"><input type="checkbox" name="confirmExpansion" value="1"> Je confirme si cette transformation rend le contenu visible à plus de personnes que le message source.</label><div class="cw-modal-actions"><button type="button" class="btn" data-cw-action="close-modal">Annuler</button><button class="btn primary">${isAction?'Créer l’action':'Enregistrer la décision'}</button></div></form>`);
}

function searchPanelHtml(){return `<div class="cw-search-panel"><header><div><span class="cw-eyebrow">Recherche globale</span><h2>Rechercher dans vos messages</h2></div><button data-cw-action="close-search">×</button></header><form data-cw-form="search"><input name="query" value="${escAttr(state.searchQuery||'')}" minlength="2" required placeholder="Mot, décision, sujet…"><select name="kind"><option value="">Tous les fils</option><option value="project">Projets</option><option value="direct">Privés</option><option value="team">Équipe</option><option value="context">Réunions</option></select><button class="btn primary">Rechercher</button></form><div class="cw-search-results">${searchBusy?'<div class="cw-loading small"><span></span>Recherche…</div>':searchResults.length?searchResults.map(r=>`<a href="#/messages/${r.conversation_id}/message/${r.message_id}" class="cw-search-result"><div><span class="cw-tag">${esc(conversationKind({kind:r.conversation_kind,context_type:r.context_type,direct_pair_key:null}))}</span><strong>${esc(r.subject||r.conversation_title)}</strong></div><p>${esc(r.body).slice(0,220)}</p><small>${esc(displayName(r.author_id))} · ${dateTime(r.created_at)}${r.project_id||r.linked_project_id?` · ${esc(projectName(r.project_id||r.linked_project_id))}`:''}</small></a>`).join(''):(state.searchQuery?'<div class="cw-empty"><strong>Aucun résultat</strong><span>Essayez un autre terme.</span></div>':'<div class="cw-empty"><strong>Recherche sécurisée</strong><span>Seuls les messages auxquels vous avez réellement accès peuvent apparaître.</span></div>')}</div></div>`;}

async function openAttachment(id){const a=state.attachments.find(x=>x.id===id);if(!a)return;const url=await api.signedUrl('workspace-files',a.storage_path,900);window.open(url,'_blank','noopener,noreferrer');}
async function submitSend(form){
  const c=state.current;if(!c)return;
  let body=String(form.elements.body.value||'').trim();
  const files=[...selectedFiles];
  if(!body&&files.length)body='Pièce jointe';
  if(!body)return;
  const isAnnouncement=Boolean(form.elements.isAnnouncement?.checked);
  const subject=isAnnouncement?String(form.elements.subject?.value||'').trim():null;
  if(isAnnouncement&&!subject)throw new Error('Ajoutez un titre à l’annonce.');
  const mentionIds=[...form.querySelectorAll('input[name="mentionIds"]:checked')].map(x=>x.value);
  const uploaded=[];
  try{
    for(const file of files){
      if(file.size>MAX_FILE_SIZE)throw new Error(`${file.name} dépasse 25 Mo.`);
      const path=`${state.workspaceId}/messages/${c.id}/${crypto.randomUUID()}-${safeName(file.name)}`;
      await api.upload('workspace-files',path,file);uploaded.push({storage_path:path,file_name:file.name,mime_type:file.type||null,size_bytes:file.size});
    }
    await api.rpc('send_message_v3',{p_conversation_id:c.id,p_body:body,p_format:isAnnouncement?'structured':'chat',p_subject:subject,p_is_announcement:isAnnouncement,p_reply_to_id:state.replyTo||null,p_mentioned_user_ids:mentionIds,p_attachments:uploaded});
  }catch(error){for(const u of uploaded){try{await api.removeObject('workspace-files',u.storage_path);}catch{}}throw error;}
  selectedFiles=[];state.replyTo=null;form.reset();await reloadCurrent('Message envoyé');
}
async function reloadCurrent(toastMsg=''){await loadWorkspace(route());render();if(toastMsg)toast(toastMsg);}
function toast(msg){const n=document.createElement('div');n.className='cw-toast';n.textContent=msg;root.appendChild(n);setTimeout(()=>n.remove(),2800);}
function setBusy(form,on){form?.querySelectorAll('button,input,textarea,select').forEach(x=>x.disabled=on);}
function showError(error,form=null){const msg=String(error?.message||error||'Erreur inconnue').replace(/^Action [^:]+\s*:\s*/,'');if(form){let n=form.querySelector('.cw-form-error');if(!n){n=document.createElement('div');n.className='cw-form-error';form.prepend(n);}n.textContent=msg;}else window.alert(msg);}

root.addEventListener('click',async(event)=>{
  const t=event.target.closest('[data-cw-action]');if(!t)return;const a=t.dataset.cwAction;
  try{
    if(a==='backdrop'&&event.target!==t)return;
    if(a==='reload')return activate({force:true});
    if(a==='call-conversation'){
      const ids=conversationMembers(state.current.id).map(x=>x.user_id).filter(id=>id!==state.user.id);
      if(!ids.length)throw new Error('Aucun autre participant à appeler.');
      window.dispatchEvent(new CustomEvent('2b2c:start-call',{detail:{userIds:ids,projectId:projectContextForConversation(state.current)}}));
      return;
    }
    if(a==='new-menu'){modal={type:'new-menu'};return render();}
    if(a==='modal-direct'){modal={type:'direct'};return render();}
    if(a==='modal-group'){modal={type:'group'};return render();}
    if(a==='modal-topic'){modal={type:'topic'};return render();}
    if(a==='modal-meeting'){modal={type:'meeting'};return render();}
    if(a==='close-modal'||a==='backdrop'){modal=null;return render();}
    if(a==='filter'){state.filter=t.dataset.filter||'all';return render();}
    if(a==='settings'){modal={type:'settings'};return render();}
    if(a==='link-project'){modal={type:'link-project'};return render();}
    if(a==='reply'){state.replyTo=t.dataset.message;return render();}
    if(a==='cancel-reply'){state.replyTo=null;return render();}
    if(a==='jump-message'){document.getElementById(`cw-message-${CSS.escape(t.dataset.message)}`)?.scrollIntoView({behavior:'smooth',block:'center'});return;}
    if(a==='edit-message'){modal={type:'edit',messageId:t.dataset.message};return render();}
    if(a==='delete-message'){if(!confirm('Supprimer ce message ?'))return;await api.rpc('delete_message_v3',{p_message_id:t.dataset.message});return reloadCurrent('Message supprimé');}
    if(a==='open-attachment')return openAttachment(t.dataset.id);
    if(a==='remove-file'){selectedFiles.splice(Number(t.dataset.index),1);renderFilePreview();return;}
    if(a==='transform'){modal={type:'transform',messageId:t.dataset.message,kind:t.dataset.kind,projectId:t.dataset.project||''};return render();}
    if(a==='search-messages'){state.searchOpen=true;state.searchQuery='';searchResults=[];return render();}
    if(a==='close-search'){state.searchOpen=false;searchResults=[];return render();}
  }catch(error){showError(error);}
});

root.addEventListener('input',(event)=>{
  const el=event.target;
  if(el.dataset.cwInput==='conversation-search'){state.conversationQuery=el.value;render();setTimeout(()=>root.querySelector('[data-cw-input="conversation-search"]')?.focus(),0);}
});
root.addEventListener('change',(event)=>{
  const el=event.target;
  if(el.dataset.cwInput==='files'){
    const incoming=[...el.files];
    if(selectedFiles.length+incoming.length>MAX_FILES){showError(new Error(`Maximum ${MAX_FILES} pièces jointes par message.`));el.value='';return;}
    if(incoming.some(f=>f.size>MAX_FILE_SIZE)){showError(new Error('Chaque pièce jointe doit faire 25 Mo maximum.'));el.value='';return;}
    selectedFiles.push(...incoming);el.value='';renderFilePreview();
  }
  if(el.dataset.cwInput==='announcement'){
    const subject=root.querySelector('.cw-composer input[name="subject"]');if(subject){subject.hidden=!el.checked;if(el.checked)subject.focus();}
  }
});

root.addEventListener('submit',async(event)=>{
  const form=event.target.closest('form[data-cw-form]');if(!form)return;event.preventDefault();if(busy)return;busy=true;setBusy(form,true);
  try{
    const type=form.dataset.cwForm;
    if(type==='send')await submitSend(form);
    else if(type==='direct'){
      const id=await api.rpc('get_or_create_direct_v2',{p_workspace_id:state.workspaceId,p_other_user_id:form.elements.otherUserId.value});modal=null;location.hash=`#/messages/${one(id)||id}`;
    }else if(type==='group'){
      const ids=[...form.querySelectorAll('input[name="memberIds"]:checked')].map(x=>x.value);if(!ids.length)throw new Error('Choisissez au moins une autre personne.');
      const id=await api.rpc('create_group_direct_v2',{p_workspace_id:state.workspaceId,p_user_ids:ids,p_title:String(form.elements.title.value||'').trim()||null});modal=null;location.hash=`#/messages/${one(id)||id}`;
    }else if(type==='topic'){
      const scope=form.elements.scope.value;const title=String(form.elements.title.value||'').trim();let id;
      if(scope==='team')id=await api.rpc('create_team_topic_v2',{p_workspace_id:state.workspaceId,p_title:title});
      else{const pid=form.elements.projectId.value;if(!pid)throw new Error('Choisissez un projet.');id=await api.rpc('create_project_topic_v2',{p_project_id:pid,p_title:title});}
      modal=null;location.hash=`#/messages/${one(id)||id}`;
    }else if(type==='meeting'){
      const id=await api.rpc('get_or_create_meeting_conversation_v1',{p_meeting_id:form.elements.meetingId.value});modal=null;location.hash=`#/messages/${one(id)||id}`;
    }else if(type==='settings'){
      await api.rpc('set_conversation_notifications_v2',{p_conversation_id:state.current.id,p_level:form.elements.level.value});
      if(form.elements.status&&form.elements.status.value!==state.current.status)await api.rpc('set_conversation_status_v2',{p_conversation_id:state.current.id,p_status:form.elements.status.value});
      modal=null;await reloadCurrent('Réglages enregistrés');
    }else if(type==='link-project'){
      await api.rpc('link_direct_to_project_v3',{p_conversation_id:state.current.id,p_project_id:form.elements.projectId.value});modal=null;await reloadCurrent('Conversation liée au projet');
    }else if(type==='edit'){
      await api.rpc('edit_message_v2',{p_message_id:form.elements.messageId.value,p_body:String(form.elements.body.value||'').trim(),p_subject:form.elements.subject?String(form.elements.subject.value||'').trim():null});modal=null;await reloadCurrent('Message modifié');
    }else if(type==='transform-request'){
      await api.rpc('create_request_from_message_v2',{p_message_id:form.elements.messageId.value,p_recipient_id:form.elements.recipientId.value,p_title:String(form.elements.title.value||'').trim(),p_body:String(form.elements.body.value||'').trim(),p_due_at:form.elements.dueAt.value?new Date(form.elements.dueAt.value).toISOString():null,p_response_mode:form.elements.responseMode.value});modal=null;toast('Demande créée');
    }else if(type==='transform-action'){
      await api.rpc('create_action_from_message_v2',{p_message_id:form.elements.messageId.value,p_project_id:form.elements.projectId.value,p_title:String(form.elements.title.value||'').trim(),p_description:String(form.elements.detail.value||'').trim(),p_priority:form.elements.priority.value,p_due_at:form.elements.dueAt.value?new Date(form.elements.dueAt.value).toISOString():null,p_visibility:form.elements.visibility.value,p_confirm_audience_expansion:Boolean(form.elements.confirmExpansion.checked)});modal=null;toast('Action créée');
    }else if(type==='transform-decision'){
      await api.rpc('create_decision_from_message_v2',{p_message_id:form.elements.messageId.value,p_project_id:form.elements.projectId.value||null,p_title:String(form.elements.title.value||'').trim(),p_rationale:String(form.elements.detail.value||'').trim(),p_visibility:form.elements.visibility.value,p_confirm_audience_expansion:Boolean(form.elements.confirmExpansion.checked)});modal=null;toast('Décision enregistrée');
    }else if(type==='search'){
      const q=String(form.elements.query.value||'').trim();state.searchQuery=q;searchBusy=true;render();
      try{searchResults=await api.rpc('search_messages_v1',{p_workspace_id:state.workspaceId,p_query:q,p_project_id:null,p_kind:form.elements.kind.value||null,p_limit:50});}finally{searchBusy=false;render();}
    }
  }catch(error){showError(error,form);}finally{busy=false;setBusy(form,false);}
});

function composerHasDraft(){const f=root.querySelector('form[data-cw-form="send"]');return Boolean(selectedFiles.length||String(f?.elements?.body?.value||'').trim()||(f&&f.contains(document.activeElement)));}
async function probeSync(){
  if(!state||!isActive()||document.hidden||modal||busy||composerHasDraft())return;
  try{
    const rows=await api.rpc('get_workspace_sync_digest_v1',{p_workspace_id:state.workspaceId});const next=String(one(rows)?.digest||rows?.digest||'');
    if(next&&syncDigest&&next!==syncDigest){const r=route();await loadWorkspace(r);}
    else if(next)syncDigest=next;
  }catch{}
}
function startSync(){if(syncTimer)return;syncTimer=setInterval(probeSync,POLL_MS);}
function stopSync(){if(syncTimer){clearInterval(syncTimer);syncTimer=null;}}

window.addEventListener('hashchange',()=>{if(state){state.searchOpen=false;searchResults=[];state.replyTo=null;}selectedFiles=[];activate();});
window.addEventListener('resize',positionRoot);
window.addEventListener('focus',()=>{if(isActive()&&!modal)probeSync();});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&isActive()&&!modal)probeSync();});
document.addEventListener('keydown',(e)=>{if(e.key==='Escape'){if(modal){modal=null;render();}else if(state?.searchOpen){state.searchOpen=false;render();}}});

activate();
console.info(`[2b2c] ${VERSION}`);

import { SupabaseBrowserClient } from './supabase-client.js';

const VERSION = '4b4c communication memory v1.0.0';
const config = window.__4B4C_CONFIG__ || {};
const app = document.getElementById('app');
const workspaceKey = config.workspaceStorageKey || '4b4c.live.workspace.v1';

if (!app || !config.supabaseUrl || !config.supabasePublishableKey) {
  console.warn(`${VERSION}: configuration unavailable`);
} else {
  const api = new SupabaseBrowserClient({ url:config.supabaseUrl, publishableKey:config.supabasePublishableKey });
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const wid = () => localStorage.getItem(workspaceKey) || '';
  let cache = { wid:'', at:0, data:null };
  let scheduled = false;

  async function snapshot(force=false) {
    const workspaceId = wid();
    if (!workspaceId || !api.getSession()) return null;
    if (!force && cache.data && cache.wid === workspaceId && Date.now()-cache.at < 2500) return cache.data;
    const user = await api.getUser();
    const [projects, decisions, profiles, requests, approvals, actions, assignees] = await Promise.all([
      api.select('projects', `select=id,name,status,visibility&workspace_id=eq.${workspaceId}&status=neq.archived&order=updated_at.desc`),
      api.select('decisions', `select=*&workspace_id=eq.${workspaceId}&order=decided_at.desc.nullslast,created_at.desc&limit=400`).catch(()=>[]),
      api.select('profiles','select=id,display_name,avatar_url').catch(()=>[]),
      api.select('requests',`select=*&workspace_id=eq.${workspaceId}&limit=300`).catch(()=>[]),
      api.select('approvals',`select=*&workspace_id=eq.${workspaceId}&limit=300`).catch(()=>[]),
      api.select('actions',`select=*&workspace_id=eq.${workspaceId}&limit=500`).catch(()=>[]),
      api.select('action_assignees','select=*').catch(()=>[])
    ]);
    const data={workspaceId,user,projects,decisions,profiles,requests,approvals,actions,assignees};
    cache={wid:workspaceId,at:Date.now(),data};
    return data;
  }
  const profileName=(data,id)=>data.profiles.find(p=>p.id===id)?.display_name||'Membre';
  function fmt(value){if(!value)return'';const d=new Date(value);return Number.isNaN(d.getTime())?'':new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'short',year:'numeric'}).format(d)}
  function statusLabel(s){return({decided:'Décidée',proposed:'Proposée',superseded:'Remplacée',cancelled:'Annulée'})[s]||s}
  function statusTone(s){return s==='decided'?'good':s==='superseded'?'':'blue'}
  function scalarRpc(value){return Array.isArray(value)?(value[0]?.id||value[0]?.create_group_direct_v2||value[0]):value}

  function ensureStyles(){
    if(document.getElementById('communication-memory-v1-styles'))return;
    const style=document.createElement('style');style.id='communication-memory-v1-styles';style.textContent=`
      .communication-v2-head .communication-create-actions{gap:7px}.communication-intent-note{margin-top:6px;color:#667085;font-size:12px}.communication-composer .announcement-subject{display:none}.communication-composer.is-announcement .announcement-subject{display:block}.communication-composer .composer-tools{align-items:center}.communication-audience-note{font-size:11px;color:#667085;margin-right:auto}
      .decision-register-v1{display:grid;gap:14px}.decision-register-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px}.decision-register-list{display:grid}.decision-register-row{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:start;padding:14px 4px;border-bottom:1px solid var(--live-line,#e6eaf0);text-decoration:none;color:inherit}.decision-register-row:last-child{border-bottom:0}.decision-register-row:hover{background:rgba(56,103,244,.035)}.decision-register-row:focus-visible{outline:3px solid rgba(56,103,244,.22);outline-offset:2px;border-radius:10px}.decision-register-copy{display:grid;gap:4px;min-width:0}.decision-register-copy strong{font-size:14px}.decision-register-copy p{margin:0;color:#475467;font-size:13px;line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.decision-register-copy small{color:#667085}.decision-register-empty{padding:18px 4px;color:#667085}.decision-tab-badge{display:inline-flex;margin-left:4px;min-width:18px;height:18px;padding:0 5px;border-radius:999px;align-items:center;justify-content:center;background:#eef2f7;font-size:10px}
      .notification-work-note{margin:10px 12px 4px;padding:10px 11px;border:1px solid #dfe7f7;background:#f6f8fd;border-radius:11px;color:#475467;font-size:12px;line-height:1.45}.notification-work-note strong{color:#253858}.notification-work-note a{font-weight:800;color:#3159cb;text-decoration:none}.notification-panel .notification-read-label{font-size:11px;color:#667085;margin-left:auto}.group-project-context{margin-top:12px;padding:10px 12px;border:1px solid #dfe7f7;background:#f7f9fd;border-radius:12px;color:#475467;font-size:12px;line-height:1.45}
      @media(max-width:700px){.decision-register-row{grid-template-columns:1fr auto}.decision-register-row>.pill{grid-column:1/-1;width:max-content}.decision-register-toolbar{align-items:flex-start;flex-direction:column}.communication-v2-head .communication-create-actions{width:100%;overflow:auto;flex-wrap:nowrap}.communication-v2-head .communication-create-actions .btn{flex:0 0 auto}}
    `;document.head.appendChild(style);
  }

  function patchMessagesHeader(){
    if(!location.hash.startsWith('#/messages'))return;
    const head=app.querySelector('.communication-v2-head');
    if(!head||head.dataset.communicationIntent==='1')return;
    head.dataset.communicationIntent='1';
    const paragraph=head.querySelector('p');if(paragraph)paragraph.textContent='Choisissez d’abord avec qui et dans quel contexte vous voulez échanger. Les actions, demandes et décisions se formalisent ensuite depuis les messages.';
    const actions=head.querySelector('.communication-create-actions');if(actions){
      const direct=actions.querySelector('[data-action="new-direct"]');const group=actions.querySelector('[data-action="new-group-direct"]');const topic=actions.querySelector('[data-action="new-topic"]');
      if(direct)direct.textContent='＋ Écrire à quelqu’un';
      if(group)group.textContent='＋ Petit groupe';
      if(topic)topic.textContent='＋ Discussion d’équipe / projet';
    }
    const groups=app.querySelectorAll('.conversation-group-title span');groups.forEach(span=>{if(span.textContent.trim()==='Équipe')span.textContent='Discussions d’équipe';if(span.textContent.trim()==='Projets')span.textContent='Discussions de projet';if(span.textContent.trim()==='Privés')span.textContent='Conversations privées';});
  }

  function patchComposer(){
    const form=app.querySelector('.communication-composer');if(!form||form.dataset.communicationIntent==='1')return;
    form.dataset.communicationIntent='1';
    const toggle=form.querySelector('.announcement-toggle input');const subject=form.querySelector('.announcement-subject');
    if(subject)subject.setAttribute('aria-label','Titre de l’annonce');
    const update=()=>form.classList.toggle('is-announcement',Boolean(toggle?.checked));toggle?.addEventListener('change',update);update();
    const tools=form.querySelector('.composer-tools');if(tools){const note=document.createElement('span');note.className='communication-audience-note';const header=app.querySelector('.conversation-header p')?.textContent?.trim()||'';note.textContent=header?`Audience : ${header}`:'Vérifiez l’audience avant l’envoi.';tools.prepend(note);}
  }

  async function patchTopicModal(dialog,data){
    if(dialog.dataset.communicationTopic==='1')return;
    const h=dialog.querySelector('h2');if(!h||h.textContent.trim()!=='Nouveau sujet')return;
    const form=dialog.querySelector('form[data-form="new-topic"]');if(!form)return;
    dialog.dataset.communicationTopic='1';h.textContent='Nouvelle discussion';
    const subtitle=h.parentElement?.querySelector('p');if(subtitle)subtitle.textContent='Créez une discussion pour toute l’équipe ou rattachez-la à un projet.';
    const scope=form.elements.topicScope;if(scope){scope.options[0].textContent='Discussion d’équipe';scope.options[1].textContent='Discussion de projet';}
    const titleField=form.elements.title?.closest('.field');const titleLabel=titleField?.querySelector('label');if(titleLabel)titleLabel.textContent='Nom de la discussion';
    const projectLabel=form.elements.projectId?.closest('.field')?.querySelector('label');if(projectLabel)projectLabel.textContent='Projet concerné';
  }

  async function patchGroupModal(dialog,data){
    if(dialog.dataset.communicationGroup==='1')return;
    const h=dialog.querySelector('h2');if(!h||h.textContent.trim()!=='Groupe privé')return;
    const form=dialog.querySelector('form[data-form="new-group-direct"]');if(!form)return;
    dialog.dataset.communicationGroup='1';h.textContent='Petit groupe privé';
    const subtitle=h.parentElement?.querySelector('p');if(subtitle)subtitle.textContent='Choisissez les personnes, puis rattachez éventuellement cette conversation à un projet sans élargir son audience.';
    const field=document.createElement('div');field.className='field';field.innerHTML=`<label for="group-linked-project">Contexte projet (facultatif)</label><select id="group-linked-project" name="linkedProjectId"><option value="">Sans projet</option>${data.projects.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}</select><small>Lier un projet ajoute du contexte uniquement. Seules les personnes choisies pourront lire ce groupe.</small>`;
    const firstField=form.querySelector('.field');firstField?.insertAdjacentElement('afterend',field);
    form.addEventListener('submit',async event=>{
      event.preventDefault();event.stopImmediatePropagation();
      const fd=new FormData(form);const memberIds=fd.getAll('directMemberIds').map(String);if(!memberIds.length)return;
      const submit=form.querySelector('button[type="submit"]');submit.disabled=true;
      try{
        const id=scalarRpc(await api.rpc('create_group_direct_v2',{p_workspace_id:data.workspaceId,p_user_ids:memberIds,p_title:String(fd.get('title')||'').trim()||null}));
        const projectId=String(fd.get('linkedProjectId')||'');if(projectId)await api.rpc('link_direct_to_project_v2',{p_conversation_id:id,p_project_id:projectId});
        location.hash=`#/messages/${id}`;location.reload();
      }catch(error){submit.disabled=false;const note=document.createElement('div');note.className='notice danger';note.textContent=error?.message||String(error);form.prepend(note);}
    },true);
  }

  function patchProjectDecisionTab(data){
    const match=(location.hash||'').match(/^#\/projects\/([^/]+)(?:\/([^/]+))?/);if(!match)return;
    const projectId=match[1];const tab=match[2]||'overview';const project=data.projects.find(p=>p.id===projectId);if(!project)return;
    const tabs=app.querySelector('.project-tabs');if(!tabs)return;
    let link=tabs.querySelector('[data-decision-tab-v1]');if(!link){link=document.createElement('a');link.dataset.decisionTabV1='1';link.href=`#/projects/${projectId}/decisions`;const resource=[...tabs.querySelectorAll('a')].find(a=>/Ressources|Livrables/.test(a.textContent));tabs.insertBefore(link,resource||null);}
    const count=data.decisions.filter(d=>d.project_id===projectId).length;link.innerHTML=`Décisions${count?` <span class="decision-tab-badge">${count}</span>`:''}`;link.classList.toggle('active',tab==='decisions');
    if(tab!=='decisions')return;
    const head=app.querySelector('.project-head-v3');if(!head)return;
    [...head.parentElement.children].forEach(node=>{if(node!==head&&node!==head.nextElementSibling&&node.classList?.contains('decision-register-v1')===false){} });
    let panel=app.querySelector('.decision-register-v1');
    const nativeContent=head.nextElementSibling;if(nativeContent&&!nativeContent.classList.contains('decision-register-v1'))nativeContent.style.display='none';
    if(!panel){panel=document.createElement('section');panel.className='decision-register-v1';head.insertAdjacentElement('afterend',panel);}
    const rows=data.decisions.filter(d=>d.project_id===projectId);
    panel.innerHTML=`<div class="section-head page-head-v3"><div><span class="eyebrow">Mémoire du projet</span><h2>Décisions</h2><p>Retrouvez les choix actés, leur justification et leur historique, même lorsqu’une décision a été remplacée.</p></div><button class="btn primary" data-action="new-decision" data-project="${esc(projectId)}">＋ Consigner une décision</button></div><div class="card"><div class="decision-register-toolbar"><div><strong>${rows.length} décision${rows.length>1?'s':''}</strong><div class="metric-label">La plus récente apparaît en premier.</div></div></div>${rows.length?`<div class="decision-register-list">${rows.map(d=>`<a class="decision-register-row" href="#/projects/${projectId}/overview/decision/${d.id}"><span class="pill ${statusTone(d.status)}">${esc(statusLabel(d.status))}</span><span class="decision-register-copy"><strong>${esc(d.title)}</strong><p>${esc(d.rationale||'Sans justification renseignée.')}</p><small>${esc(profileName(data,d.decided_by||d.created_by))} · ${esc(fmt(d.decided_at||d.created_at))}</small></span><span>›</span></a>`).join('')}</div>`:'<div class="decision-register-empty">Aucune décision enregistrée pour ce projet.</div>'}</div>`;
  }

  function pendingInterventions(data){
    const assignedIds=new Set(data.assignees.filter(x=>x.user_id===data.user.id).map(x=>x.action_id));
    const actions=data.actions.filter(a=>assignedIds.has(a.id)&&!['done','cancelled'].includes(a.status)&&(a.status==='blocked'||a.priority==='urgent'||(a.due_at&&new Date(a.due_at).getTime()<Date.now()+48*3600000))).length;
    const requests=data.requests.filter(r=>r.recipient_id===data.user.id&&r.status==='open').length;
    const approvals=data.approvals.filter(a=>a.validator_id===data.user.id&&a.status==='pending').length;
    return actions+requests+approvals;
  }
  function patchNotifications(data){
    const panel=app.querySelector('.notification-panel');if(!panel||panel.dataset.notificationClarity==='1')return;
    panel.dataset.notificationClarity='1';
    const readAll=panel.querySelector('[data-action="read-all-notifications"]');if(readAll)readAll.textContent='Tout marquer comme lu';
    const count=pendingInterventions(data);const note=document.createElement('div');note.className='notification-work-note';note.innerHTML=`<strong>${count?`${count} intervention${count>1?'s':''} encore à traiter`:'Aucune intervention urgente'}</strong><br>Lire une notification ne termine jamais une action, une demande ou une validation. <a href="#/work">Ouvrir Mon travail →</a>`;
    const head=panel.querySelector('.card-head');head?.insertAdjacentElement('afterend',note);
  }

  async function scan(){ensureStyles();const data=await snapshot().catch(()=>null);if(!data)return;patchMessagesHeader();patchComposer();patchProjectDecisionTab(data);patchNotifications(data);document.querySelectorAll('[role="dialog"],.modal').forEach(dialog=>{patchTopicModal(dialog,data);patchGroupModal(dialog,data);});}
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;scan().catch(console.warn);});}
  const observer=new MutationObserver(schedule);observer.observe(app,{childList:true,subtree:true});window.addEventListener('hashchange',schedule);schedule();
}

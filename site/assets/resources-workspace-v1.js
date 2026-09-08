import { SupabaseBrowserClient } from './supabase-client.js';

const VERSION = '2b2c resources workspace v1.0.0';
const config = window.__4B4C_CONFIG__ || {};
const api = new SupabaseBrowserClient({ url: config.supabaseUrl, publishableKey: config.supabasePublishableKey });

const root = document.createElement('section');
root.id = 'resources-workspace-v1';
root.className = 'resources-workspace-v1';
root.hidden = true;
root.setAttribute('aria-label','Ressources et livrables du projet');
document.body.appendChild(root);

let currentProjectId = '';
let viewState = null;
let modal = null;
let loadToken = 0;
let busy = false;

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const one = (value) => Array.isArray(value) ? (value[0] ?? null) : value;
const bytes = (n) => { n=Number(n||0); if(n<1024)return `${n} o`; if(n<1048576)return `${(n/1024).toFixed(1)} Ko`; return `${(n/1048576).toFixed(1)} Mo`; };
const dateLabel = (v) => v ? new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'short',year:'numeric'}).format(new Date(v)) : '—';
const safeName = (name) => String(name||'fichier').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/^-+|-+$/g,'') || 'fichier';
const roleLabel = (role) => ({owner:'Propriétaire',admin:'Administrateur',member:'Membre',guest:'Invité externe'})[role] || role || 'Membre';
const approvalLabel = (status) => ({pending:'En attente',approved:'Approuvée',changes_requested:'Modifications demandées',cancelled:'Remplacée / annulée'})[status] || status || 'Sans validation';
const approvalTone = (status) => status==='approved'?'good':status==='pending'?'blue':status==='changes_requested'?'danger':'';
const versionKey = (id) => String(id||'');

function routeProjectId(){
  const match=(location.hash||'').match(/^#\/?projects\/([^/]+)\/resources(?:\/|$)/);
  return match?.[1] || '';
}
function isActive(){ return Boolean(routeProjectId()); }
function filePath(workspaceId,projectId,file){ return `${workspaceId}/${projectId}/${crypto.randomUUID()}-${safeName(file.name)}`; }
function displayName(id){ return viewState?.profiles?.find(p=>p.id===id)?.display_name || viewState?.members?.find(m=>m.user_id===id)?.email || 'Membre'; }

function positionRoot(){
  if(root.hidden)return;
  const host=document.querySelector('.live-content');
  if(!host)return;
  const rect=host.getBoundingClientRect();
  root.style.left=`${Math.max(0,rect.left)}px`;
  root.style.top=`${Math.max(0,rect.top)}px`;
  root.style.width=`${Math.max(0,rect.width)}px`;
  root.style.height=`${Math.max(0,window.innerHeight-Math.max(0,rect.top))}px`;
}

async function waitForHost(){
  for(let i=0;i<18;i++){
    const host=document.querySelector('.live-content');
    if(host)return host;
    await new Promise(r=>setTimeout(r,80));
  }
  return null;
}

async function activate({force=false}={}){
  const projectId=routeProjectId();
  if(!projectId){
    currentProjectId=''; viewState=null; modal=null; root.hidden=true; root.innerHTML='';
    document.body.classList.remove('resources-workspace-open-v1');
    return;
  }
  currentProjectId=projectId;
  root.hidden=false;
  document.body.classList.add('resources-workspace-open-v1');
  await waitForHost();
  positionRoot();
  if(!viewState || viewState.project?.id!==projectId || force) await load(projectId);
  else render();
}

async function load(projectId){
  const token=++loadToken;
  root.innerHTML=`<div class="rw-loading"><span></span><strong>Chargement des ressources…</strong></div>`;
  try{
    const user=await api.getUser();
    if(!user?.id) throw new Error('Votre session a expiré.');
    const project=one(await api.select('projects',`select=*&id=eq.${projectId}&limit=1`));
    if(!project) throw new Error('Projet inaccessible.');
    const membership=one(await api.select('workspace_members',`select=*&workspace_id=eq.${project.workspace_id}&user_id=eq.${user.id}&status=eq.active&limit=1`));
    if(!membership) throw new Error('Vous n’avez plus accès à cet espace.');

    const [resources,deliverables,approvals,shares,projectMembers,members,profiles]=await Promise.all([
      api.select('project_resources',`select=*&project_id=eq.${projectId}&order=updated_at.desc`),
      api.select('deliverables',`select=*&project_id=eq.${projectId}&status=neq.archived&order=updated_at.desc`),
      api.select('approvals',`select=*&project_id=eq.${projectId}&order=created_at.desc&limit=200`).catch(()=>[]),
      api.select('deliverable_version_shares',`select=*&project_id=eq.${projectId}&order=created_at.desc`).catch(()=>[]),
      api.select('project_members',`select=*&project_id=eq.${projectId}`).catch(()=>[]),
      api.select('workspace_members',`select=*&workspace_id=eq.${project.workspace_id}&status=eq.active&order=joined_at.asc`).catch(()=>[]),
      api.select('profiles','select=id,display_name,avatar_url&order=display_name.asc').catch(()=>[]),
    ]);
    let versions=[];
    if(deliverables.length){
      versions=await api.select('deliverable_versions',`select=*&deliverable_id=in.(${deliverables.map(d=>d.id).join(',')})&order=version_number.desc`);
    }
    if(token!==loadToken)return;
    const ownPm=projectMembers.find(pm=>pm.user_id===user.id);
    const canWrite=project.status==='active' && (['owner','admin'].includes(membership.role) || (membership.role==='member' && ownPm && ['lead','member'].includes(ownPm.role)));
    viewState={user,project,membership,resources,deliverables,versions,approvals,shares,projectMembers,members,profiles,canWrite,external:membership.role==='guest'};
    render();
  }catch(error){
    if(token!==loadToken)return;
    root.innerHTML=`<div class="rw-error"><strong>Ressources indisponibles</strong><p>${esc(error?.message||error)}</p><button class="btn" data-rw-action="reload">Réessayer</button></div>`;
  }
}

function validatorOptions(){
  if(!viewState)return '';
  const ids=new Set();
  for(const pm of viewState.projectMembers) ids.add(pm.user_id);
  for(const m of viewState.members){
    if(['owner','admin'].includes(m.role) || (m.role==='member'&&m.access_mode==='all')) ids.add(m.user_id);
  }
  ids.delete(viewState.user.id);
  return [...ids].filter(id=>viewState.members.some(m=>m.user_id===id&&m.status==='active')).map(id=>{
    const wm=viewState.members.find(m=>m.user_id===id);
    return `<option value="${id}">${esc(displayName(id))}${wm?.role==='guest'?' · invité externe':''}</option>`;
  }).join('');
}

function versionApprovals(versionId){ return viewState.approvals.filter(a=>versionKey(a.deliverable_version_id)===versionKey(versionId)); }
function latestApproval(versionId){ return versionApprovals(versionId).slice().sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))[0] || null; }
function sharedVersion(versionId){ return viewState.shares.some(s=>versionKey(s.deliverable_version_id)===versionKey(versionId)); }

function workResourceCard(r){
  const icon=r.kind==='link'?'↗':'DOC';
  const detail=r.kind==='link' ? r.url : `${r.file_name||'Fichier'}${r.size_bytes!=null?` · ${bytes(r.size_bytes)}`:''}`;
  return `<article class="rw-card rw-work-card">
    <div class="rw-file-icon ${r.kind}">${icon}</div>
    <div class="rw-card-copy"><div class="rw-title-line"><strong>${esc(r.title)}</strong><span class="rw-pill neutral">Ressource de travail</span><span class="rw-pill ${r.visibility==='shared'?'blue':''}">${r.visibility==='shared'?'Partagée':'Interne'}</span></div>${r.description?`<p>${esc(r.description)}</p>`:''}<small>${esc(detail)} · mis à jour ${dateLabel(r.updated_at||r.created_at)}</small></div>
    <div class="rw-card-actions"><button class="btn small" data-rw-action="open-resource" data-id="${r.id}">Ouvrir</button>${viewState.canWrite?`<button class="btn small" data-rw-action="edit-resource" data-id="${r.id}">Modifier</button>`:''}</div>
  </article>`;
}

function deliverableCard(d){
  const versions=viewState.versions.filter(v=>v.deliverable_id===d.id).sort((a,b)=>b.version_number-a.version_number);
  const latest=versions[0];
  const approval=latest?latestApproval(latest.id):null;
  const status=approval?.status || (d.status==='approved'?'approved':d.status==='review'?'pending':'');
  const history=versions.map(v=>{
    const a=latestApproval(v.id); const shared=sharedVersion(v.id);
    return `<div class="rw-version-row"><div><strong>v${v.version_number}</strong><span>${esc(v.file_name)}</span></div><small>${dateLabel(v.created_at)} · ${bytes(v.size_bytes)}${shared?' · partagée aux invités':''}</small><div><span class="rw-pill ${approvalTone(a?.status)}">${a?approvalLabel(a.status):'Sans validation'}</span><button class="rw-link-button" data-rw-action="open-version" data-version="${v.id}">Ouvrir</button>${a?.validator_id===viewState.user.id&&a.status==='pending'?`<button class="rw-link-button strong" data-rw-action="decide-approval" data-approval="${a.id}">Valider</button>`:''}</div></div>`;
  }).join('');
  return `<article class="rw-card rw-deliverable-card">
    <div class="rw-file-icon deliverable">✓</div>
    <div class="rw-card-copy"><div class="rw-title-line"><strong>${esc(d.title)}</strong><span class="rw-pill purple">Livrable</span>${latest?`<span class="rw-pill">v${latest.version_number}</span>`:''}<span class="rw-pill ${approvalTone(status)}">${status?approvalLabel(status):'Brouillon'}</span></div>${d.description?`<p>${esc(d.description)}</p>`:''}<small>${latest?`${esc(latest.file_name)} · ${bytes(latest.size_bytes)} · ${versions.length} version${versions.length>1?'s':''}`:'Aucune version'}</small></div>
    <div class="rw-card-actions">${latest?`<button class="btn small" data-rw-action="open-version" data-version="${latest.id}">Ouvrir v${latest.version_number}</button>`:''}${viewState.canWrite?`<button class="btn small" data-rw-action="new-version" data-deliverable="${d.id}">Nouvelle version</button>${latest&&!viewState.approvals.some(a=>a.deliverable_version_id===latest.id&&a.status==='pending')?`<button class="btn small primary" data-rw-action="request-approval" data-version="${latest.id}" data-deliverable="${d.id}">Demander validation</button>`:''}`:''}${approval?.validator_id===viewState.user.id&&approval.status==='pending'?`<button class="btn small primary" data-rw-action="decide-approval" data-approval="${approval.id}">Examiner</button>`:''}</div>
    ${versions.length?`<details class="rw-history"><summary>Historique des versions (${versions.length})</summary><div>${history}</div></details>`:''}
  </article>`;
}

function render(){
  if(!viewState || viewState.project.id!==currentProjectId)return;
  positionRoot();
  const {project,resources,deliverables,canWrite,external,membership}=viewState;
  root.innerHTML=`<div class="rw-page">
    <header class="rw-head"><div><a href="#/projects/${project.id}/overview" class="rw-back">← ${esc(project.name)}</a><span class="rw-eyebrow">Organisation des fichiers</span><h1>Ressources & livrables</h1><p>${external?'Vous voyez uniquement ce que l’équipe a explicitement partagé avec vous.':'Séparez les documents qui aident à travailler des résultats officiels qui doivent être versionnés, remis ou validés.'}</p></div><div class="rw-head-badge">${esc(roleLabel(membership.role))}</div></header>

    ${!external?`<div class="rw-guide"><div><span class="rw-guide-icon work">↗</span><div><strong>Ressource de travail</strong><p>Référence, document ou fichier utile pendant le projet. Pas de version ni de validation formelle.</p></div></div><span class="rw-guide-separator">≠</span><div><span class="rw-guide-icon deliverable">✓</span><div><strong>Livrable</strong><p>Résultat officiel à remettre ou faire valider. Chaque version est figée et traçable.</p></div></div></div>`:''}

    <section class="rw-section"><div class="rw-section-head"><div><span class="rw-eyebrow">Travail courant</span><h2>Ressources de travail</h2><p>${external?'Fichiers et liens de référence partagés avec vous.':'Maquettes, notes, benchmark, documents source, liens utiles… Ils servent au travail mais ne sont pas des livrables.'}</p></div>${canWrite?`<div class="rw-actions"><button class="btn" data-rw-action="add-work-link">＋ Lien</button><button class="btn" data-rw-action="add-work-file">↑ Fichier de travail</button></div>`:''}</div>
      ${resources.length?`<div class="rw-list">${resources.map(workResourceCard).join('')}</div>`:`<div class="rw-empty"><strong>Aucune ressource de travail</strong><span>${external?'Aucune ressource n’a été partagée avec vous.':'Ajoutez uniquement les éléments utiles à la réalisation du projet.'}</span></div>`}
    </section>

    <section class="rw-section rw-deliverables"><div class="rw-section-head"><div><span class="rw-eyebrow">Sorties officielles</span><h2>Livrables</h2><p>${external?'Versions officielles que l’équipe a décidé de partager ou de vous soumettre.':'Chaque nouvelle version est immuable. Une validation concerne toujours une version précise et la clôture du projet conserve cette version exacte.'}</p></div>${canWrite?`<button class="btn primary" data-rw-action="add-deliverable">＋ Nouveau livrable</button>`:''}</div>
      ${deliverables.length?`<div class="rw-list">${deliverables.map(deliverableCard).join('')}</div>`:`<div class="rw-empty"><strong>Aucun livrable</strong><span>${external?'Aucun livrable ne vous a encore été partagé.':'Créez un livrable lorsque le fichier représente un résultat à remettre, valider ou conserver comme sortie officielle.'}</span></div>`}
    </section>
  </div>${modalHtml()}`;
}

function modalHtml(){
  if(!modal)return '';
  const commonVis=`<div class="rw-field"><label>Visibilité</label><select name="visibility"><option value="internal" ${modal.visibility!=='shared'?'selected':''}>Interne</option><option value="shared" ${modal.visibility==='shared'?'selected':''}>Partagée aux invités du projet</option></select></div>`;
  let body='';
  if(modal.type==='work-link') body=`<form data-rw-form="work-link"><div class="rw-field"><label>Titre</label><input name="title" required maxlength="240" value="${esc(modal.resource?.title||'')}"></div><div class="rw-field"><label>URL</label><input name="url" type="url" required placeholder="https://…" value="${esc(modal.resource?.url||'')}"></div><div class="rw-field"><label>Description</label><textarea name="description" placeholder="Pourquoi cette ressource est utile ?">${esc(modal.resource?.description||'')}</textarea></div>${commonVis}<div class="rw-modal-actions"><button class="btn" type="button" data-rw-action="close-modal">Annuler</button><button class="btn primary" type="submit">${modal.resource?'Enregistrer':'Ajouter le lien'}</button></div></form>`;
  else if(modal.type==='work-file') body=`<form data-rw-form="work-file"><div class="rw-field"><label>Titre</label><input name="title" required maxlength="240"></div><div class="rw-field"><label>Description</label><textarea name="description" placeholder="À quoi sert ce fichier ?"></textarea></div><div class="rw-field"><label>Fichier</label><input type="file" name="file" required></div>${commonVis}<div class="rw-modal-actions"><button class="btn" type="button" data-rw-action="close-modal">Annuler</button><button class="btn primary" type="submit">Ajouter la ressource</button></div></form>`;
  else if(modal.type==='work-edit') {const r=modal.resource; body=`<form data-rw-form="work-edit"><input type="hidden" name="resourceId" value="${r.id}"><div class="rw-field"><label>Titre</label><input name="title" required maxlength="240" value="${esc(r.title)}"></div>${r.kind==='link'?`<div class="rw-field"><label>URL</label><input name="url" type="url" required value="${esc(r.url||'')}"></div>`:''}<div class="rw-field"><label>Description</label><textarea name="description">${esc(r.description||'')}</textarea></div>${commonVis}<div class="rw-notice">Le fichier lui-même n’est pas versionné : pour remplacer une ressource de travail, ajoutez un nouveau fichier. Utilisez un Livrable si vous avez besoin d’un historique v1/v2/v3.</div><div class="rw-modal-actions"><button class="btn" type="button" data-rw-action="close-modal">Annuler</button><button class="btn primary" type="submit">Enregistrer</button></div></form>`;}
  else if(modal.type==='deliverable') body=`<form data-rw-form="deliverable"><div class="rw-field"><label>Nom du livrable</label><input name="title" required maxlength="240" placeholder="Ex. Prototype final"></div><div class="rw-field"><label>Description</label><textarea name="description" placeholder="Résultat attendu ou contenu du livrable"></textarea></div><div class="rw-field"><label>Fichier · version 1</label><input type="file" name="file" required></div>${commonVis}<div class="rw-notice"><strong>Version figée :</strong> après création, cette v1 ne pourra ni être modifiée ni remplacée. Toute évolution créera une v2.</div><div class="rw-modal-actions"><button class="btn" type="button" data-rw-action="close-modal">Annuler</button><button class="btn primary" type="submit">Créer le livrable et sa v1</button></div></form>`;
  else if(modal.type==='version') {const d=viewState.deliverables.find(x=>x.id===modal.deliverableId); body=`<form data-rw-form="version"><input type="hidden" name="deliverableId" value="${d?.id||''}"><div class="rw-field"><label>Nouvelle version de ${esc(d?.title||'ce livrable')}</label><input type="file" name="file" required></div><label class="rw-checkbox"><input type="checkbox" name="shareExternal" value="1"> Partager explicitement cette nouvelle version aux invités du projet</label><div class="rw-notice">Les validations encore en attente sur une ancienne version seront automatiquement annulées comme « remplacées ».</div><div class="rw-modal-actions"><button class="btn" type="button" data-rw-action="close-modal">Annuler</button><button class="btn primary" type="submit">Créer la nouvelle version</button></div></form>`;}
  else if(modal.type==='approval') {const version=viewState.versions.find(v=>v.id===modal.versionId);const d=viewState.deliverables.find(x=>x.id===modal.deliverableId); body=`<form data-rw-form="approval"><input type="hidden" name="deliverableId" value="${d?.id||''}"><input type="hidden" name="versionId" value="${version?.id||''}"><div class="rw-notice"><strong>${esc(d?.title||'Livrable')} · v${version?.version_number||'?'}</strong><br>La décision sera attachée à cette version exacte.</div><div class="rw-field"><label>Validateur</label><select name="validatorId" required><option value="">Choisir…</option>${validatorOptions()}</select></div><div class="rw-field"><label>Critères / message</label><textarea name="note" placeholder="Ce qui doit être vérifié"></textarea></div><div class="rw-notice">Si le validateur est un invité externe, seule cette version précise lui sera partagée.</div><div class="rw-modal-actions"><button class="btn" type="button" data-rw-action="close-modal">Annuler</button><button class="btn primary" type="submit">Envoyer pour validation</button></div></form>`;}
  else if(modal.type==='decision') {const a=viewState.approvals.find(x=>x.id===modal.approvalId);const v=viewState.versions.find(x=>x.id===a?.deliverable_version_id);const d=viewState.deliverables.find(x=>x.id===v?.deliverable_id);body=`<form data-rw-form="decision"><input type="hidden" name="approvalId" value="${a?.id||''}"><div class="rw-notice"><strong>${esc(d?.title||'Livrable')} · v${v?.version_number||'?'}</strong><br>Vous validez uniquement cette version.</div><button class="btn" type="button" data-rw-action="open-version" data-version="${v?.id||''}">Ouvrir le fichier à examiner</button><div class="rw-field"><label>Commentaire</label><textarea name="note" placeholder="Précisez ce qui est validé ou ce qui doit changer"></textarea></div><div class="rw-modal-actions split"><button class="btn danger" type="submit" name="decision" value="changes_requested">Demander des modifications</button><div><button class="btn" type="button" data-rw-action="close-modal">Plus tard</button><button class="btn primary" type="submit" name="decision" value="approved">Approuver cette version</button></div></div></form>`;}
  return `<div class="rw-modal-backdrop" data-rw-action="backdrop"><div class="rw-modal" role="dialog" aria-modal="true"><header><div><span class="rw-eyebrow">${modal.type.startsWith('work')?'Ressource de travail':'Livrable'}</span><h2>${esc(modal.title||'')}</h2></div><button class="rw-close" type="button" data-rw-action="close-modal">×</button></header>${body}</div></div>`;
}

async function openResource(id){
  const r=viewState.resources.find(x=>x.id===id); if(!r)return;
  if(r.kind==='link'){ window.open(r.url,'_blank','noopener,noreferrer'); return; }
  const url=await api.signedUrl('workspace-files',r.storage_path,900); window.open(url,'_blank','noopener,noreferrer');
}
async function openVersion(id){
  const v=viewState.versions.find(x=>x.id===id); if(!v)return;
  const url=await api.signedUrl('workspace-files',v.storage_path,900); window.open(url,'_blank','noopener,noreferrer');
}

root.addEventListener('click',async(event)=>{
  const target=event.target.closest('[data-rw-action]'); if(!target)return;
  const action=target.dataset.rwAction;
  try{
    if(action==='backdrop'&&event.target!==target)return;
    if(action==='reload')return activate({force:true});
    if(action==='close-modal'||action==='backdrop'){modal=null;return render();}
    if(action==='add-work-link'){modal={type:'work-link',title:'Ajouter un lien de travail',visibility:'internal'};return render();}
    if(action==='add-work-file'){modal={type:'work-file',title:'Ajouter un fichier de travail',visibility:'internal'};return render();}
    if(action==='add-deliverable'){modal={type:'deliverable',title:'Nouveau livrable',visibility:'internal'};return render();}
    if(action==='edit-resource'){const resource=viewState.resources.find(x=>x.id===target.dataset.id);if(resource){modal={type:'work-edit',title:'Modifier la ressource',resource,visibility:resource.visibility};render();}return;}
    if(action==='new-version'){modal={type:'version',title:'Nouvelle version',deliverableId:target.dataset.deliverable};return render();}
    if(action==='request-approval'){modal={type:'approval',title:'Demander une validation',deliverableId:target.dataset.deliverable,versionId:target.dataset.version};return render();}
    if(action==='decide-approval'){modal={type:'decision',title:'Examiner la version',approvalId:target.dataset.approval};return render();}
    if(action==='open-resource')return openResource(target.dataset.id);
    if(action==='open-version')return openVersion(target.dataset.version);
  }catch(error){showError(error);}
});

root.addEventListener('submit',async(event)=>{
  const form=event.target.closest('form[data-rw-form]'); if(!form)return;
  event.preventDefault(); if(busy)return; busy=true; setFormBusy(form,true);
  const fd=new FormData(form); const kind=form.dataset.rwForm;
  try{
    if(kind==='work-link') await submitWorkLink(fd);
    else if(kind==='work-file') await submitWorkFile(form,fd);
    else if(kind==='work-edit') await submitWorkEdit(fd);
    else if(kind==='deliverable') await submitDeliverable(form,fd);
    else if(kind==='version') await submitVersion(form,fd);
    else if(kind==='approval') await submitApproval(fd);
    else if(kind==='decision') await submitDecision(event,fd);
  }catch(error){showError(error,form);}
  finally{busy=false;setFormBusy(form,false);}
});

function setFormBusy(form,on){form?.querySelectorAll('button,input,select,textarea').forEach(el=>el.disabled=on);}
function showError(error,form=null){
  const msg=String(error?.message||error||'Erreur inconnue').replace(/^\w+\s*:\s*/,'');
  if(form){let n=form.querySelector('.rw-form-error');if(!n){n=document.createElement('div');n.className='rw-form-error';form.prepend(n);}n.textContent=msg;}
  else window.alert(msg);
}
async function afterMutation(message){modal=null;await load(currentProjectId);toast(message);}
function toast(message){let t=document.createElement('div');t.className='rw-toast';t.textContent=message;root.appendChild(t);setTimeout(()=>t.remove(),3200);}

async function submitWorkLink(fd){
  await api.rpc('create_project_resource_link_v1',{
    p_project_id:currentProjectId,p_title:String(fd.get('title')||'').trim(),p_url:String(fd.get('url')||'').trim(),
    p_description:String(fd.get('description')||'').trim(),p_visibility:String(fd.get('visibility')||'internal')
  });
  await afterMutation('Lien de travail ajouté');
}
async function submitWorkFile(form,fd){
  const file=form.querySelector('input[type=file]')?.files?.[0];if(!file)throw new Error('Fichier requis');if(file.size>50*1024*1024)throw new Error('Le fichier dépasse 50 Mo');
  const path=filePath(viewState.project.workspace_id,currentProjectId,file);let uploaded=false;
  try{
    await api.upload('workspace-files',path,file);uploaded=true;
    await api.rpc('register_project_resource_file_v1',{
      p_project_id:currentProjectId,p_title:String(fd.get('title')||'').trim(),p_storage_path:path,p_file_name:file.name,
      p_mime_type:file.type||null,p_size_bytes:file.size,p_description:String(fd.get('description')||'').trim(),p_visibility:String(fd.get('visibility')||'internal')
    });
  }catch(error){if(uploaded){try{await api.removeObject('workspace-files',path)}catch{}}throw error;}
  await afterMutation('Fichier de travail ajouté');
}
async function submitWorkEdit(fd){
  const r=viewState.resources.find(x=>x.id===String(fd.get('resourceId')||''));if(!r)throw new Error('Ressource introuvable');
  await api.rpc('update_project_resource_v1',{
    p_resource_id:r.id,p_title:String(fd.get('title')||'').trim(),p_description:String(fd.get('description')||'').trim(),
    p_visibility:String(fd.get('visibility')||'internal'),p_url:r.kind==='link'?String(fd.get('url')||'').trim():null
  });
  await afterMutation('Ressource mise à jour');
}
async function submitDeliverable(form,fd){
  const file=form.querySelector('input[type=file]')?.files?.[0];if(!file)throw new Error('Fichier requis');if(file.size>50*1024*1024)throw new Error('Le fichier dépasse 50 Mo');
  const path=filePath(viewState.project.workspace_id,currentProjectId,file);let uploaded=false;
  try{
    await api.upload('workspace-files',path,file);uploaded=true;
    await api.rpc('create_deliverable_with_first_version_v1',{
      p_project_id:currentProjectId,p_title:String(fd.get('title')||'').trim(),p_storage_path:path,p_file_name:file.name,
      p_mime_type:file.type||null,p_size_bytes:file.size,p_description:String(fd.get('description')||'').trim(),p_visibility:String(fd.get('visibility')||'internal')
    });
  }catch(error){if(uploaded){try{await api.removeObject('workspace-files',path)}catch{}}throw error;}
  await afterMutation('Livrable créé · version 1 figée');
}
async function submitVersion(form,fd){
  const d=viewState.deliverables.find(x=>x.id===String(fd.get('deliverableId')||''));if(!d)throw new Error('Livrable introuvable');
  const file=form.querySelector('input[type=file]')?.files?.[0];if(!file)throw new Error('Fichier requis');if(file.size>50*1024*1024)throw new Error('Le fichier dépasse 50 Mo');
  const path=filePath(viewState.project.workspace_id,currentProjectId,file);let uploaded=false;
  try{
    await api.upload('workspace-files',path,file);uploaded=true;
    const r=one(await api.rpc('register_deliverable_version_v3',{
      p_deliverable_id:d.id,p_storage_path:path,p_file_name:file.name,p_mime_type:file.type||null,p_size_bytes:file.size,
      p_share_external:fd.get('shareExternal')==='1'
    }))||{};
    await afterMutation(`Version ${r.version_number||''} créée et figée`);
  }catch(error){if(uploaded){try{await api.removeObject('workspace-files',path)}catch{}}throw error;}
}
async function submitApproval(fd){
  const result=one(await api.rpc('request_deliverable_approval_v1',{
    p_deliverable_id:String(fd.get('deliverableId')||''),p_version_id:String(fd.get('versionId')||''),
    p_validator_id:String(fd.get('validatorId')||''),p_request_note:String(fd.get('note')||'').trim()
  }))||{};
  await afterMutation(result.shared_external?'Validation demandée · version exacte partagée avec l’invité':'Validation demandée sur cette version précise');
}
async function submitDecision(event,fd){
  const submitter=event.submitter;const decision=submitter?.value||'';const note=String(fd.get('note')||'').trim();
  if(decision==='changes_requested'&&!note)throw new Error('Expliquez les modifications attendues.');
  await api.rpc('decide_deliverable_approval_v1',{p_approval_id:String(fd.get('approvalId')||''),p_status:decision,p_decision_note:note});
  await afterMutation(decision==='approved'?'Version approuvée':'Modifications demandées');
}

window.addEventListener('hashchange',()=>activate({force:true}));
window.addEventListener('resize',positionRoot);
window.addEventListener('focus',()=>{if(isActive())activate({force:true});});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&isActive())activate({force:true});});
setTimeout(()=>activate({force:true}),0);
setTimeout(()=>{if(isActive())activate({force:true});},400);

console.info(`[2b2c] ${VERSION} active — route driven, no MutationObserver`);

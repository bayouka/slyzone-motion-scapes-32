import { SupabaseBrowserClient } from './supabase-client.js';

const VERSION = '2b2c library workspace v1.0.1';
const config = window.__4B4C_CONFIG__ || {};
const api = new SupabaseBrowserClient({ url: config.supabaseUrl, publishableKey: config.supabasePublishableKey });
const workspaceKey = config.workspaceStorageKey || '4b4c.live.workspace.v1';

const root = document.createElement('section');
root.id = 'library-workspace-v1';
root.className = 'library-workspace-v1';
root.hidden = true;
root.setAttribute('aria-label','Bibliothèque des fichiers');
document.body.appendChild(root);

let viewState = null;
let loadToken = 0;
let chooserOpen = false;
const filters = { query:'', type:'all', project:'all', status:'all' };

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const one = (value) => Array.isArray(value) ? (value[0] ?? null) : value;
const bytes = (n) => { n=Number(n||0); if(n<1024)return `${n} o`; if(n<1048576)return `${(n/1024).toFixed(1)} Ko`; return `${(n/1048576).toFixed(1)} Mo`; };
const dateLabel = (v) => v ? new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'short',year:'numeric'}).format(new Date(v)) : '—';
const approvalLabel = (status) => ({pending:'Validation en attente',approved:'Approuvé',changes_requested:'Modifications demandées',cancelled:'Remplacé / annulé'})[status] || 'Brouillon';
const approvalTone = (status) => status==='approved'?'good':status==='pending'?'blue':status==='changes_requested'?'danger':'';

function safeExternalUrl(value){
  const url=new URL(String(value||''));
  if(!['http:','https:'].includes(url.protocol)) throw new Error('Ce lien utilise un protocole non autorisé.');
  return url.toString();
}
function isActive(){ return /^#\/?library(?:\/|$)/.test(location.hash || ''); }
function workspaceId(){ return localStorage.getItem(workspaceKey) || ''; }
function projectName(id){ return viewState?.projects?.find(p=>p.id===id)?.name || 'Projet'; }
function latestVersion(deliverableId){ return viewState?.versions?.filter(v=>v.deliverable_id===deliverableId).sort((a,b)=>b.version_number-a.version_number)[0] || null; }
function latestApproval(versionId){ return viewState?.approvals?.filter(a=>a.deliverable_version_id===versionId).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))[0] || null; }
function versionShared(versionId){ return Boolean(viewState?.shares?.some(s=>s.deliverable_version_id===versionId)); }

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
  if(!isActive()){
    viewState=null; chooserOpen=false; root.hidden=true; root.innerHTML='';
    document.body.classList.remove('library-workspace-open-v1');
    return;
  }
  root.hidden=false;
  document.body.classList.add('library-workspace-open-v1');
  await waitForHost();
  positionRoot();
  if(!viewState || force) await load();
  else render();
}

async function load(){
  const token=++loadToken;
  root.innerHTML='<div class="lw-loading"><span></span><strong>Chargement des fichiers…</strong></div>';
  try{
    const wid=workspaceId();
    if(!wid) throw new Error('Aucun espace actif.');
    const user=await api.getUser();
    if(!user?.id) throw new Error('Votre session a expiré.');
    const membership=one(await api.select('workspace_members',`select=*&workspace_id=eq.${wid}&user_id=eq.${user.id}&status=eq.active&limit=1`));
    if(!membership) throw new Error('Vous n’avez plus accès à cet espace.');

    const [projects,resources,deliverables,versions,approvals,shares]=await Promise.all([
      api.select('projects',`select=id,name,status,visibility,updated_at&workspace_id=eq.${wid}&status=neq.archived&order=updated_at.desc`),
      api.select('project_resources',`select=*&workspace_id=eq.${wid}&order=updated_at.desc`).catch(()=>[]),
      api.select('deliverables',`select=*&workspace_id=eq.${wid}&status=neq.archived&order=updated_at.desc`).catch(()=>[]),
      api.select('deliverable_versions',`select=*&workspace_id=eq.${wid}&order=created_at.desc`).catch(()=>[]),
      api.select('approvals',`select=*&workspace_id=eq.${wid}&order=created_at.desc&limit=400`).catch(()=>[]),
      api.select('deliverable_version_shares',`select=*&workspace_id=eq.${wid}&order=created_at.desc`).catch(()=>[]),
    ]);
    if(token!==loadToken)return;
    viewState={user,membership,projects,resources,deliverables,versions,approvals,shares,external:membership.role==='guest'};
    if(filters.project!=='all'&&!projects.some(p=>p.id===filters.project))filters.project='all';
    render();
  }catch(error){
    if(token!==loadToken)return;
    root.innerHTML=`<div class="lw-error"><strong>Bibliothèque indisponible</strong><p>${esc(error?.message||error)}</p><button class="btn" data-lw-action="reload">Réessayer</button></div>`;
  }
}

function allItems(){
  if(!viewState)return [];
  const resourceItems=viewState.resources.map(r=>({
    id:`resource:${r.id}`,kind:'resource',projectId:r.project_id,title:r.title,description:r.description||'',updatedAt:r.updated_at||r.created_at,
    visibility:r.visibility||'internal',subtype:r.kind||'file',raw:r,status:'work',search:`${r.title} ${r.description||''} ${r.file_name||''} ${r.url||''} ${projectName(r.project_id)}`.toLowerCase()
  }));
  const deliverableItems=viewState.deliverables.map(d=>{
    const version=latestVersion(d.id); const approval=version?latestApproval(version.id):null;
    const pendingMine=Boolean(approval&&approval.status==='pending'&&approval.validator_id===viewState.user.id);
    let status='draft';
    if(pendingMine)status='to_validate';
    else if(approval?.status==='pending')status='pending';
    else if(approval?.status==='approved'||d.status==='approved')status='approved';
    else if(approval?.status==='changes_requested')status='changes_requested';
    return {
      id:`deliverable:${d.id}`,kind:'deliverable',projectId:d.project_id,title:d.title,description:d.description||'',updatedAt:d.updated_at||d.created_at,
      visibility:d.visibility||'internal',raw:d,version,approval,pendingMine,status,
      search:`${d.title} ${d.description||''} ${version?.file_name||''} ${projectName(d.project_id)}`.toLowerCase()
    };
  });
  return [...resourceItems,...deliverableItems].sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt));
}

function filteredItems(){
  const q=filters.query.trim().toLowerCase();
  return allItems().filter(item=>{
    if(filters.type==='resource'&&item.kind!=='resource')return false;
    if(filters.type==='deliverable'&&item.kind!=='deliverable')return false;
    if(filters.type==='to_validate'&&!(item.kind==='deliverable'&&item.pendingMine))return false;
    if(filters.project!=='all'&&item.projectId!==filters.project)return false;
    if(filters.status!=='all'){
      if(item.kind!=='deliverable'||item.status!==filters.status)return false;
    }
    if(q&&!item.search.includes(q))return false;
    return true;
  });
}

function stats(){
  const items=allItems();
  const resources=items.filter(x=>x.kind==='resource').length;
  const deliverables=items.filter(x=>x.kind==='deliverable').length;
  const toValidate=items.filter(x=>x.kind==='deliverable'&&x.pendingMine).length;
  return {total:items.length,resources,deliverables,toValidate};
}

function resourceCard(item){
  const r=item.raw; const icon=r.kind==='link'?'↗':'DOC';
  const detail=r.kind==='link'?(r.url||'Lien'):`${r.file_name||'Fichier'}${r.size_bytes!=null?` · ${bytes(r.size_bytes)}`:''}`;
  return `<article class="lw-item lw-resource-item">
    <div class="lw-icon ${r.kind==='link'?'link':'file'}">${icon}</div>
    <div class="lw-copy"><div class="lw-title-line"><strong>${esc(item.title)}</strong><span class="lw-pill neutral">Ressource de travail</span><span class="lw-pill ${item.visibility==='shared'?'blue':''}">${item.visibility==='shared'?'Partagée':'Interne'}</span></div><p>${item.description?esc(item.description):esc(detail)}</p><small>${esc(projectName(item.projectId))} · ${dateLabel(item.updatedAt)}</small></div>
    <div class="lw-item-actions"><button class="btn small" data-lw-action="open-resource" data-id="${r.id}">Ouvrir</button><a class="btn small ghost" href="#/projects/${item.projectId}/resources">Dans le projet</a></div>
  </article>`;
}

function deliverableCard(item){
  const d=item.raw, v=item.version, a=item.approval;
  const shared=v?versionShared(v.id):false;
  const statusLabel=item.pendingMine?'À valider par vous':a?approvalLabel(a.status):d.status==='approved'?'Approuvé':d.status==='review'?'Validation en attente':'Brouillon';
  const tone=item.pendingMine?'warn':approvalTone(a?.status|| (d.status==='approved'?'approved':''));
  return `<article class="lw-item lw-deliverable-item ${item.pendingMine?'attention':''}">
    <div class="lw-icon deliverable">✓</div>
    <div class="lw-copy"><div class="lw-title-line"><strong>${esc(item.title)}</strong><span class="lw-pill purple">Livrable</span>${v?`<span class="lw-pill">v${v.version_number}</span>`:''}<span class="lw-pill ${tone}">${esc(statusLabel)}</span>${shared?'<span class="lw-pill blue">Version partagée</span>':''}</div>${item.description?`<p>${esc(item.description)}</p>`:''}<small>${esc(projectName(item.projectId))}${v?` · ${esc(v.file_name)} · ${bytes(v.size_bytes)}`:' · aucune version'} · ${dateLabel(item.updatedAt)}</small></div>
    <div class="lw-item-actions">${v?`<button class="btn small" data-lw-action="open-version" data-version="${v.id}">Ouvrir v${v.version_number}</button>`:''}<a class="btn small ${item.pendingMine?'primary':'ghost'}" href="#/projects/${item.projectId}/resources">${item.pendingMine?'Examiner':'Dans le projet'}</a></div>
  </article>`;
}

function projectChooser(){
  if(!chooserOpen||!viewState)return '';
  const projects=viewState.projects.filter(p=>p.status==='active');
  return `<div class="lw-modal-backdrop" data-lw-action="close-chooser"><div class="lw-modal" role="dialog" aria-modal="true" aria-label="Choisir un projet"><header><div><span class="lw-eyebrow">Ajouter un élément</span><h2>Choisissez le projet</h2><p>La création reste dans le contexte du projet pour éviter les fichiers sans propriétaire ni destination.</p></div><button class="lw-close" data-lw-action="close-chooser" aria-label="Fermer">×</button></header><div class="lw-project-choice">${projects.length?projects.map(p=>`<a href="#/projects/${p.id}/resources"><strong>${esc(p.name)}</strong><span>Ouvrir Ressources & livrables →</span></a>`).join(''):'<div class="lw-empty"><strong>Aucun projet actif</strong><span>Créez ou reprenez un projet avant d’ajouter un fichier.</span></div>'}</div></div></div>`;
}

function render(){
  if(!viewState)return;
  positionRoot();
  const items=filteredItems(), s=stats(), external=viewState.external;
  const typeButtons=[['all','Tous'],['resource','Ressources de travail'],['deliverable','Livrables'],['to_validate',`À valider${s.toValidate?` (${s.toValidate})`:''}`]];
  root.innerHTML=`<div class="lw-page">
    <header class="lw-head"><div><span class="lw-eyebrow">Bibliothèque</span><h1>Fichiers</h1><p>${external?'Retrouvez les fichiers et livrables explicitement partagés avec vous.':'Une vue transversale de tous les fichiers : références de travail d’un côté, livrables versionnés et validables de l’autre.'}</p></div>${external?'':`<button class="btn primary" data-lw-action="add-in-project">＋ Ajouter dans un projet</button>`}</header>

    <div class="lw-stats"><div><strong>${s.total}</strong><span>élément${s.total>1?'s':''}</span></div><div><strong>${s.resources}</strong><span>ressource${s.resources>1?'s':''} de travail</span></div><div><strong>${s.deliverables}</strong><span>livrable${s.deliverables>1?'s':''}</span></div><div class="${s.toValidate?'attention':''}"><strong>${s.toValidate}</strong><span>à valider par vous</span></div></div>

    <section class="lw-toolbar"><label class="lw-search"><span>⌕</span><input id="lw-search" type="search" autocomplete="off" placeholder="Rechercher un fichier, un livrable ou un projet…" value="${esc(filters.query)}"></label><select id="lw-project-filter" aria-label="Filtrer par projet"><option value="all">Tous les projets</option>${viewState.projects.map(p=>`<option value="${p.id}" ${filters.project===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select><select id="lw-status-filter" aria-label="Filtrer par statut"><option value="all">Tous les statuts</option><option value="draft" ${filters.status==='draft'?'selected':''}>Brouillon</option><option value="pending" ${filters.status==='pending'?'selected':''}>Validation en attente</option><option value="approved" ${filters.status==='approved'?'selected':''}>Approuvé</option><option value="changes_requested" ${filters.status==='changes_requested'?'selected':''}>Modifications demandées</option><option value="to_validate" ${filters.status==='to_validate'?'selected':''}>À valider par vous</option></select></section>

    <nav class="lw-type-tabs" aria-label="Type de fichier">${typeButtons.map(([key,label])=>`<button class="${filters.type===key?'active':''}" data-lw-action="type-filter" data-type="${key}">${esc(label)}</button>`).join('')}</nav>

    <section class="lw-results"><div class="lw-results-head"><div><span class="lw-eyebrow">${filters.type==='resource'?'Travail courant':filters.type==='deliverable'?'Sorties officielles':filters.type==='to_validate'?'Votre attention':'Tous les fichiers'}</span><h2>${items.length} résultat${items.length>1?'s':''}</h2></div>${filters.query||filters.type!=='all'||filters.project!=='all'||filters.status!=='all'?'<button class="lw-reset" data-lw-action="reset-filters">Réinitialiser les filtres</button>':''}</div>${items.length?`<div class="lw-list">${items.map(item=>item.kind==='resource'?resourceCard(item):deliverableCard(item)).join('')}</div>`:`<div class="lw-empty"><strong>Aucun fichier correspondant</strong><span>${filters.query?'Essayez un autre terme ou retirez un filtre.':'Les éléments accessibles apparaîtront ici automatiquement.'}</span></div>`}</section>
  </div>${projectChooser()}`;
}

async function openResource(id){
  const r=viewState?.resources?.find(x=>x.id===id); if(!r)return;
  if(r.kind==='link'){ window.open(safeExternalUrl(r.url),'_blank','noopener,noreferrer'); return; }
  const url=await api.signedUrl('workspace-files',r.storage_path,900); window.open(url,'_blank','noopener,noreferrer');
}
async function openVersion(id){
  const v=viewState?.versions?.find(x=>x.id===id); if(!v)return;
  const url=await api.signedUrl('workspace-files',v.storage_path,900); window.open(url,'_blank','noopener,noreferrer');
}

root.addEventListener('click',async(event)=>{
  const target=event.target.closest('[data-lw-action]'); if(!target)return;
  const action=target.dataset.lwAction;
  try{
    if(action==='reload')return activate({force:true});
    if(action==='add-in-project'){chooserOpen=true;return render();}
    if(action==='close-chooser'){
      if(target.classList.contains('lw-modal-backdrop')&&event.target!==target)return;
      chooserOpen=false;return render();
    }
    if(action==='type-filter'){filters.type=target.dataset.type||'all';if(filters.type==='to_validate')filters.status='all';return render();}
    if(action==='reset-filters'){filters.query='';filters.type='all';filters.project='all';filters.status='all';return render();}
    if(action==='open-resource')return openResource(target.dataset.id);
    if(action==='open-version')return openVersion(target.dataset.version);
  }catch(error){window.alert(String(error?.message||error||'Erreur inconnue').replace(/^\w+\s*:\s*/,''));}
});

root.addEventListener('input',(event)=>{
  if(event.target?.id!=='lw-search')return;
  filters.query=event.target.value;
  const pos=event.target.selectionStart;
  render();
  const input=document.getElementById('lw-search');
  if(input){input.focus();try{input.setSelectionRange(pos,pos)}catch{}}
});
root.addEventListener('change',(event)=>{
  if(event.target?.id==='lw-project-filter'){filters.project=event.target.value||'all';render();}
  if(event.target?.id==='lw-status-filter'){filters.status=event.target.value||'all';render();}
});

window.addEventListener('hashchange',()=>activate({force:true}));
window.addEventListener('resize',positionRoot);
window.addEventListener('focus',()=>{if(isActive()&&!chooserOpen)activate({force:true});});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&isActive()&&!chooserOpen)activate({force:true});});
setTimeout(()=>activate({force:true}),0);
setTimeout(()=>{if(isActive())activate({force:true});},400);

console.info(`[2b2c] ${VERSION} active — global file library, no MutationObserver`);

import { SupabaseBrowserClient } from './supabase-client.js';

const VERSION='2b2c delivery workflow v1.0.0';
const config=window.__4B4C_CONFIG__||{};
const api=new SupabaseBrowserClient({url:config.supabaseUrl,publishableKey:config.supabasePublishableKey});
const workspaceKey=config.workspaceStorageKey||'4b4c.live.workspace.v1';

const modalRoot=document.createElement('div');
modalRoot.id='delivery-modal-root-v1';
document.body.appendChild(modalRoot);
const pageRoot=document.createElement('section');
pageRoot.id='delivery-completed-page-v1';
pageRoot.className='delivery-completed-page-v1';
pageRoot.hidden=true;
pageRoot.setAttribute('aria-label','Projet terminé et historique des livraisons');
document.body.appendChild(pageRoot);

let modal=null;
let pageState=null;
let loadToken=0;
let busy=false;

const esc=(v)=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const one=(v)=>Array.isArray(v)?(v[0]??null):v;
const bytes=(n)=>{n=Number(n||0);if(n<1024)return `${n} o`;if(n<1048576)return `${(n/1024).toFixed(1)} Ko`;return `${(n/1048576).toFixed(1)} Mo`;};
const dateLabel=(v)=>v?new Intl.DateTimeFormat('fr-FR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v)):'—';
const statusLabel=(s)=>({approved:'Approuvée',pending:'Validation en attente',changes_requested:'Modifications demandées',not_requested:'Non validée'})[s]||s||'Non validée';
const statusTone=(s)=>s==='approved'?'good':s==='pending'?'blue':s==='changes_requested'?'danger':'neutral';
function currentWorkspaceId(){return localStorage.getItem(workspaceKey)||'';}
function overviewProjectId(){return (location.hash||'').match(/^#\/?projects\/([^/]+)\/overview(?:\/|$|\?)/)?.[1]||'';}
function positionPage(){if(pageRoot.hidden)return;const host=document.querySelector('.live-content');if(!host)return;const r=host.getBoundingClientRect();pageRoot.style.left=`${Math.max(0,r.left)}px`;pageRoot.style.top=`${Math.max(0,r.top)}px`;pageRoot.style.width=`${Math.max(0,r.width)}px`;pageRoot.style.height=`${Math.max(0,innerHeight-Math.max(0,r.top))}px`;}
async function waitForHost(){for(let i=0;i<18;i++){const h=document.querySelector('.live-content');if(h)return h;await new Promise(r=>setTimeout(r,80));}return null;}
function profileName(id){return pageState?.profiles?.find(p=>p.id===id)?.display_name||'Membre';}
function canManage(project,membership,user){return Boolean(project&&membership&&user&&(['owner','admin'].includes(membership.role)||project.lead_user_id===user.id));}

function groupCandidates(rows=[]){
  const map=new Map();
  for(const row of rows){
    if(!map.has(row.deliverable_id))map.set(row.deliverable_id,{id:row.deliverable_id,title:row.deliverable_title,versions:[]});
    map.get(row.deliverable_id).versions.push(row);
  }
  for(const g of map.values())g.versions.sort((a,b)=>Number(b.version_number)-Number(a.version_number));
  return [...map.values()];
}

async function openClosure(projectId){
  if(!projectId)return;
  const [project,preview]=await Promise.all([
    api.select('projects',`select=id,name,status,workspace_id&id=eq.${projectId}&limit=1`).then(one),
    api.rpc('get_project_closure_preview_v3',{p_project_id:projectId}).then(one),
  ]);
  if(!project)throw new Error('Projet introuvable.');
  modal={project,preview:preview||{},groups:groupCandidates(preview?.reference_candidates||[])};
  renderModal();
}

function candidateHtml(group){
  const usable=group.versions.filter(v=>!['changes_requested','pending'].includes(v.approval_status));
  const defaultId=(usable.find(v=>v.recommended)||usable.find(v=>v.is_latest)||usable[0])?.version_id||'';
  return `<fieldset class="dw-deliverable-group"><legend>${esc(group.title)}</legend>
    ${group.versions.map(v=>{
      const blocked=['changes_requested','pending'].includes(v.approval_status);
      const checked=String(v.version_id)===String(defaultId)&&!blocked;
      return `<label class="dw-version-choice ${blocked?'blocked':''}"><input type="radio" name="ref-${group.id}" value="${v.version_id}" ${checked?'checked':''} ${blocked?'disabled':''}><span><strong>v${v.version_number} · ${esc(v.file_name)}</strong><small>${dateLabel(v.created_at)}${v.is_latest?' · version actuelle':''}${v.shared_external?' · partagée aux invités':''}</small></span><span class="dw-pill ${statusTone(v.approval_status)}">${esc(statusLabel(v.approval_status))}</span></label>`;
    }).join('')}
    <label class="dw-version-choice none"><input type="radio" name="ref-${group.id}" value=""><span><strong>Ne pas inclure ce livrable</strong><small>Il ne fera pas partie de cette livraison finale.</small></span></label>
  </fieldset>`;
}

function renderModal(){
  if(!modal){modalRoot.innerHTML='';return;}
  const p=modal.project,preview=modal.preview||{};
  const pending=Number(preview.pending_approvals||0),openOps=Number(preview.open_actions||0)+Number(preview.open_milestones||0)+Number(preview.open_requests||0);
  modalRoot.innerHTML=`<div class="dw-backdrop" data-dw-action="close-modal"><section class="dw-modal" role="dialog" aria-modal="true" aria-labelledby="dw-close-title"><header><div><span class="dw-eyebrow">Livraison finale</span><h2 id="dw-close-title">Terminer ${esc(p.name)}</h2><p>La clôture enregistre un épisode de livraison immuable : résultat, versions exactes et engagements transmis.</p></div><button class="dw-close" data-dw-action="close-modal" aria-label="Fermer">×</button></header>
    <form data-dw-form="complete"><input type="hidden" name="projectId" value="${p.id}"><div class="dw-stack">
      ${pending?`<div class="dw-alert danger"><strong>${pending} validation${pending>1?'s':''} encore en attente</strong><span>Traitez-les avant de clôturer le projet. La clôture est bloquée tant qu’une décision manque.</span></div>`:''}
      <div class="dw-field"><label>Résultat obtenu</label><textarea name="result" required placeholder="Décrivez ce qui a réellement été livré, validé ou obtenu."></textarea><small>Cette formulation restera dans l’historique du projet.</small></div>
      ${modal.groups.length?`<section><div class="dw-section-title"><div><span class="dw-eyebrow">Versions finales</span><h3>Choisissez les versions exactes livrées</h3></div><span>${modal.groups.length} livrable${modal.groups.length>1?'s':''}</span></div>${modal.groups.map(candidateHtml).join('')}<div class="dw-alert"><strong>Une seule version par livrable.</strong><span>Une version approuvée est recommandée. Une version non validée reste possible mais sera enregistrée comme telle. Une version avec modifications demandées est interdite.</span></div></section>`:`<div class="dw-alert"><strong>Aucun livrable versionné.</strong><span>La clôture enregistrera uniquement le résultat et les engagements éventuels.</span></div>`}
      ${openOps?`<div class="dw-alert danger"><strong>${openOps} engagement${openOps>1?'s':''} opérationnel${openOps>1?'s':''} encore ouvert${openOps>1?'s':''}</strong><span>${Number(preview.open_actions||0)} action(s) · ${Number(preview.open_milestones||0)} phase(s) · ${Number(preview.open_requests||0)} demande(s).</span></div><div class="dw-field"><label>Ce qu’il reste à transmettre ou traiter</label><textarea name="remaining" required placeholder="Indiquez clairement qui reprend quoi après la clôture."></textarea></div><label class="dw-confirm"><input type="checkbox" name="confirmOpen" value="1" required> Je confirme que ces engagements ont été transmis ou explicitement acceptés hors projet.</label>`:`<div class="dw-alert good"><strong>Aucun engagement opérationnel ouvert.</strong><span>Le projet peut être clôturé proprement.</span></div>`}
    </div><div class="dw-actions"><button class="btn" type="button" data-dw-action="close-modal">Annuler</button><button class="btn primary" type="submit" ${pending?'disabled':''}>Enregistrer la livraison et terminer</button></div><div class="dw-form-error" role="alert"></div></form>
  </section></div>`;
}

function selectedVersionIds(form){
  return [...form.querySelectorAll('input[type=radio][name^="ref-"]:checked')].map(x=>x.value).filter(Boolean);
}
async function submitClosure(form){
  const projectId=form.elements.projectId.value;
  const versionIds=selectedVersionIds(form);
  if(modal?.groups?.length&&versionIds.length===0)throw new Error('Sélectionnez au moins une version finale.');
  const result=await api.rpc('complete_project_v3',{
    p_project_id:projectId,
    p_result:String(form.elements.result.value||'').trim(),
    p_reference_version_ids:versionIds,
    p_remaining:String(form.elements.remaining?.value||'').trim(),
    p_confirm_open:Boolean(form.elements.confirmOpen?.checked),
  }).then(one);
  modal=null;renderModal();
  location.hash=`#/projects/${projectId}/overview`;
  setTimeout(()=>location.reload(),100);
  return result;
}

modalRoot.addEventListener('click',(event)=>{
  const a=event.target.closest('[data-dw-action]');if(!a)return;
  if(a.dataset.dwAction==='close-modal'){
    if(event.target.matches('.dw-backdrop')||event.target.closest('.dw-close')||event.target.closest('button')){modal=null;renderModal();}
  }
});
modalRoot.addEventListener('submit',async(event)=>{
  const form=event.target.closest('form[data-dw-form="complete"]');if(!form)return;
  event.preventDefault();event.stopImmediatePropagation();if(busy)return;busy=true;
  form.querySelectorAll('button,input,textarea,select').forEach(x=>x.disabled=true);
  const err=form.querySelector('.dw-form-error');if(err)err.textContent='';
  try{await submitClosure(form);}catch(error){if(err)err.textContent=String(error?.message||error);form.querySelectorAll('button,input,textarea,select').forEach(x=>x.disabled=false);}finally{busy=false;}
},true);

document.addEventListener('click',async(event)=>{
  const target=event.target.closest('[data-action="start-complete-project"]');
  if(!target)return;
  event.preventDefault();event.stopImmediatePropagation();
  try{await openClosure(target.dataset.project||'');}catch(error){window.alert(String(error?.message||error));}
},true);

document.addEventListener('keydown',(event)=>{if(event.key==='Escape'&&modal){modal=null;renderModal();}});

async function activateCompletedPage({force=false}={}){
  const projectId=overviewProjectId();
  if(!projectId){hideCompletedPage();return;}
  const token=++loadToken;
  try{
    const user=await api.getUser();
    if(!user?.id){hideCompletedPage();return;}
    const project=one(await api.select('projects',`select=*&id=eq.${projectId}&limit=1`));
    if(!project||project.status!=='completed'){hideCompletedPage();return;}
    const wid=project.workspace_id||currentWorkspaceId();
    const [membership,history,profiles]=await Promise.all([
      api.select('workspace_members',`select=*&workspace_id=eq.${wid}&user_id=eq.${user.id}&status=eq.active&limit=1`).then(one),
      api.rpc('get_project_delivery_history_v1',{p_project_id:projectId}),
      api.select('profiles','select=id,display_name,avatar_url').catch(()=>[]),
    ]);
    if(token!==loadToken)return;
    const historyRows=Array.isArray(history)?history:[];
    const versionIds=historyRows.flatMap(c=>(c.versions||[]).map(v=>v.version_id)).filter(Boolean);
    const versions=versionIds.length?await api.select('deliverable_versions',`select=id,storage_path,file_name,version_number&id=in.(${versionIds.join(',')})`).catch(()=>[]):[];
    pageState={user,project,membership,history:historyRows,profiles,versions};
    await waitForHost();
    renderCompletedPage();
  }catch(error){console.error('[2b2c] completed delivery page unavailable',error);hideCompletedPage();}
}
function hideCompletedPage(){pageState=null;pageRoot.hidden=true;pageRoot.innerHTML='';document.body.classList.remove('delivery-completed-open-v1');}
function historyVersionRow(v){return `<div class="dw-final-file"><div><strong>${esc(v.title)} · v${v.version_number}</strong><small>${esc(v.file_name)}${v.size_bytes!=null?` · ${bytes(v.size_bytes)}`:''}</small></div><div><span class="dw-pill ${statusTone(v.approval_status)}">${esc(statusLabel(v.approval_status))}</span><button class="btn small" data-dw-page-action="open-final-version" data-version="${v.version_id}">Ouvrir</button></div></div>`;}
function closureCard(c,index){
  const latest=index===0;
  return `<article class="dw-closure-card ${latest?'latest':''}"><header><div><span class="dw-eyebrow">Livraison #${c.sequence_no}</span><h3>${latest?'Dernière clôture':'Clôture précédente'}</h3></div><div><span>${dateLabel(c.closed_at)}</span>${c.reopened_at?`<span class="dw-pill neutral">Réouvert le ${dateLabel(c.reopened_at)}</span>`:''}</div></header><div class="dw-result"><strong>Résultat</strong><p>${esc(c.result)}</p></div>${(c.versions||[]).length?`<div class="dw-final-files">${c.versions.map(historyVersionRow).join('')}</div>`:''}${c.remaining?`<div class="dw-handoff"><strong>Engagements transmis / restants</strong><p>${esc(c.remaining)}</p></div>`:''}<footer>Clôturé par ${esc(profileName(c.closed_by))}</footer></article>`;
}
function renderCompletedPage(){
  if(!pageState)return;
  positionPage();pageRoot.hidden=false;document.body.classList.add('delivery-completed-open-v1');
  const {project,membership,user,history}=pageState;const latest=history[0];
  pageRoot.innerHTML=`<div class="dw-completed-page"><header class="dw-completed-head"><div><a href="#/projects" class="dw-back">← Projets</a><span class="dw-eyebrow">Projet terminé</span><h1>${esc(project.name)}</h1><p>${latest?esc(latest.result):'Projet clôturé.'}</p></div><div class="dw-head-actions"><a class="btn" href="#/projects/${project.id}/resources">Ressources & livrables</a>${canManage(project,membership,user)?`<button class="btn primary" data-dw-page-action="reopen" data-project="${project.id}">Réouvrir le projet</button>`:''}</div></header>${latest?`<section class="dw-delivery-summary"><div><strong>Livraison #${latest.sequence_no}</strong><span>${dateLabel(latest.closed_at)}</span></div><div><strong>${(latest.versions||[]).length}</strong><span>version${(latest.versions||[]).length>1?'s':''} finale${(latest.versions||[]).length>1?'s':''}</span></div><div><strong>${(latest.versions||[]).filter(v=>v.approval_status==='approved').length}</strong><span>approuvée${(latest.versions||[]).filter(v=>v.approval_status==='approved').length>1?'s':''}</span></div></section>`:''}<section class="dw-history"><div class="dw-section-title"><div><span class="dw-eyebrow">Historique immuable</span><h2>Livraisons du projet</h2></div><span>${history.length} clôture${history.length>1?'s':''}</span></div>${history.length?history.map(closureCard).join(''):'<div class="dw-alert">Aucune clôture structurée n’est encore enregistrée pour ce projet.</div>'}</section></div>`;
}
pageRoot.addEventListener('click',async(event)=>{
  const a=event.target.closest('[data-dw-page-action]');if(!a||!pageState)return;
  try{
    if(a.dataset.dwPageAction==='reopen'){
      a.disabled=true;await api.rpc('reopen_project_v1',{p_project_id:a.dataset.project});location.reload();return;
    }
    if(a.dataset.dwPageAction==='open-final-version'){
      const row=pageState.versions.find(v=>String(v.id)===String(a.dataset.version));
      if(!row)throw new Error('Cette version n’est plus accessible avec vos droits actuels.');
      const url=await api.signedUrl('workspace-files',row.storage_path,900);window.open(url,'_blank','noopener,noreferrer');
    }
  }catch(error){window.alert(String(error?.message||error));if(a)a.disabled=false;}
});

window.addEventListener('hashchange',()=>activateCompletedPage({force:true}));
window.addEventListener('resize',positionPage);
window.addEventListener('focus',()=>{if(!modal)activateCompletedPage({force:true});});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!modal)activateCompletedPage({force:true});});
setTimeout(()=>activateCompletedPage({force:true}),0);

console.info(`[2b2c] ${VERSION} active — exact closure versions, immutable delivery history, no MutationObserver`);

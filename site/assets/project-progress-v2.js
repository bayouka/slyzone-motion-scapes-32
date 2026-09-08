import { SupabaseBrowserClient } from './supabase-client.js';

const VERSION = '2b2c derived project progress v2.0.0';
const config = window.__4B4C_CONFIG__ || {};
const app = document.getElementById('app');
const workspaceKey = config.workspaceStorageKey || '4b4c.live.workspace.v1';
const api = new SupabaseBrowserClient({ url: config.supabaseUrl, publishableKey: config.supabasePublishableKey });
const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const workspaceId = () => localStorage.getItem(workspaceKey) || '';
let cache = { wid:'', at:0, rows:[], projects:[], members:[], projectMembers:[], user:null };
let scheduled = false;

function label(code) {
  return ({on_track:'En bonne voie',at_risk:'À surveiller',off_track:'En difficulté',on_hold:'En pause',completed:'Terminé'})[code] || 'À structurer';
}
function tone(code) {
  return code==='on_track'||code==='completed' ? 'good' : code==='at_risk'||code==='on_hold' ? 'warn' : code==='off_track' ? 'danger' : '';
}
function statusLabel(status){return({active:'Actif',on_hold:'En pause',completed:'Terminé',archived:'Archivé'})[status]||status;}

async function snapshot(force=false) {
  const wid = workspaceId();
  if (!wid || !api.getSession()) return null;
  if (!force && cache.wid===wid && Date.now()-cache.at<3000) return cache;
  const user = await api.getUser();
  const [rows,projects,members,projectMembers] = await Promise.all([
    api.rpc('get_project_summaries_v1',{p_workspace_id:wid}),
    api.select('projects',`select=id,name,status,target_date,visibility,lead_user_id,created_by&workspace_id=eq.${wid}&status=neq.archived`),
    api.select('workspace_members',`select=user_id,role,status&workspace_id=eq.${wid}&status=eq.active`),
    api.select('project_members','select=project_id,user_id,role').catch(()=>[]),
  ]);
  cache={wid,at:Date.now(),rows:Array.isArray(rows)?rows:[],projects,members,projectMembers,user};
  return cache;
}
function summary(data,id){return data.rows.find(r=>r.project_id===id)||null;}
function project(data,id){return data.projects.find(p=>p.id===id)||null;}
function canManage(data,p){
  const role=data.members.find(m=>m.user_id===data.user.id)?.role;
  return ['owner','admin'].includes(role)||p?.lead_user_id===data.user.id||data.projectMembers.some(pm=>pm.project_id===p?.id&&pm.user_id===data.user.id&&pm.role==='lead');
}
function projectIdFromHash(){return (location.hash||'').match(/^#\/projects\/([^/]+)/)?.[1]||'';}

function ensureStyles(){
  if(document.getElementById('project-progress-v2-styles'))return;
  const s=document.createElement('style');s.id='project-progress-v2-styles';s.textContent=`
    .derived-project-state-v2{margin:14px 0 18px;padding:14px 15px;border:1px solid #e4e9f0;border-radius:16px;background:linear-gradient(135deg,#fff 0%,#f8fafc 100%);display:grid;grid-template-columns:minmax(0,1.4fr) minmax(180px,.8fr);gap:16px;align-items:center}.derived-project-state-v2 h3{margin:3px 0 5px;font-size:16px}.derived-project-state-v2 p{margin:0;color:#667085;font-size:12.5px;line-height:1.45}.derived-project-state-v2 .derived-state-head{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.derived-progress-box{display:grid;gap:7px}.derived-progress-line{display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#667085}.derived-progress-line strong{font-size:18px;color:#172033}.derived-progress-track{height:9px;background:#e9edf3;border-radius:999px;overflow:hidden}.derived-progress-track span{display:block;height:100%;background:#3867f4;border-radius:inherit}.derived-progress-meta{display:flex;gap:8px;flex-wrap:wrap;font-size:11px;color:#667085}.derived-readonly-v2{margin:0 0 14px;padding:10px 12px;border:1px solid #dfe6ef;background:#f7f9fc;border-radius:12px;color:#475467;font-size:12.5px}.derived-pause-btn-v2{white-space:nowrap}.derived-state-pill-v2{display:inline-flex}.project-resume-card-v43 [data-derived-card-state-v2]{margin-left:auto}.project-resume-card-v43 .project-resume-meta [data-derived-progress-v2]{font-weight:750;color:#344054}
    @media(max-width:700px){.derived-project-state-v2{grid-template-columns:1fr;padding:12px}.derived-progress-box{padding-top:2px}.derived-project-state-v2 h3{font-size:15px}}
  `;document.head.appendChild(s);
}

function replaceLegacyHealth(container,row){
  if(!container||!row)return;
  const known=/^(En bonne voie|À surveiller|En difficulté|Hors piste|Bloqué|À structurer)$/i;
  [...container.querySelectorAll('.pill')].forEach(p=>{if(known.test(p.textContent.trim())&&!p.dataset.derivedStateV2)p.remove();});
  if(!container.querySelector('[data-derived-state-v2]')){
    const pill=document.createElement('span');pill.className=`pill ${tone(row.state_code)}`;pill.dataset.derivedStateV2='1';pill.textContent=label(row.state_code);pill.title=row.state_reason||'';container.appendChild(pill);
  }
}

function patchCards(data){
  data.rows.forEach(row=>{
    const anchors=document.querySelectorAll(`a[href="#/projects/${CSS.escape(row.project_id)}/overview"]`);
    anchors.forEach(a=>{
      if(a.classList.contains('project-resume-card-v43')){
        const top=a.querySelector('.project-resume-top');replaceLegacyHealth(top,row);
        const meta=a.querySelector('.project-resume-meta');if(meta){let n=meta.querySelector('[data-derived-progress-v2]');if(!n){n=meta.querySelector('span')||document.createElement('span');n.dataset.derivedProgressV2='1';if(!n.parentNode)meta.prepend(n);}n.textContent=`${row.progress_pct}% · ${row.progress_basis==='roadmap'?'roadmap':'actions'}`;}
      }
      if(a.classList.contains('project-card-v3')||a.closest('.project-grid-v3')){
        const target=a.querySelector('.project-card-head,.project-card-title,.card-head')||a;replaceLegacyHealth(target,row);
        let meta=a.querySelector('[data-derived-card-meta-v2]');if(!meta){meta=document.createElement('small');meta.dataset.derivedCardMetaV2='1';meta.style.cssText='display:block;margin-top:7px;color:#667085';a.appendChild(meta);}meta.textContent=`${row.progress_pct}% · ${row.state_reason}`;
      }
    });
    document.querySelectorAll(`.sidebar-projects a[href="#/projects/${CSS.escape(row.project_id)}/overview"] .project-dot,.mobile-drawer-projects a[href="#/projects/${CSS.escape(row.project_id)}/overview"] .project-dot`).forEach(dot=>{dot.classList.remove('good','warn','danger','blue','neutral');dot.classList.add(tone(row.state_code)||'neutral');});
  });
}

function patchProject(data){
  const id=projectIdFromHash();if(!id)return;
  const p=project(data,id),row=summary(data,id);if(!p||!row)return;
  const head=document.querySelector('.project-head-v3');if(!head)return;
  replaceLegacyHealth(head.querySelector('.project-title-line'),row);
  const oldStatus=[...head.querySelectorAll('.project-title-line .pill')].find(x=>/^(Actif|En pause|Terminé)$/i.test(x.textContent.trim())&&!x.dataset.derivedStateV2);if(oldStatus)oldStatus.textContent=statusLabel(p.status);

  let box=document.querySelector('[data-derived-project-state-v2]');
  if(!box){box=document.createElement('section');box.className='derived-project-state-v2';box.dataset.derivedProjectStateV2='1';head.insertAdjacentElement('afterend',box);}
  box.innerHTML=`<div><div class="derived-state-head"><span class="eyebrow">Situation calculée</span><span class="pill ${tone(row.state_code)}">${esc(label(row.state_code))}</span></div><h3>${esc(row.state_reason||'Aucun signal critique détecté')}</h3><p>État déduit de la roadmap, des actions bloquées ou en retard et de la date cible. Il n’est plus saisi manuellement.</p><div class="derived-progress-meta"><span>${row.milestone_open} jalon(s) ouvert(s)</span><span>${row.action_open} action(s) ouverte(s)</span>${row.action_blocked?`<span>${row.action_blocked} bloquée(s)</span>`:''}${row.action_overdue?`<span>${row.action_overdue} en retard</span>`:''}</div></div><div class="derived-progress-box"><div class="derived-progress-line"><span>Avancement ${row.progress_basis==='roadmap'?'roadmap':'actions'}</span><strong>${row.progress_pct}%</strong></div><div class="derived-progress-track" aria-label="Avancement ${row.progress_pct}%"><span style="width:${Math.max(0,Math.min(100,row.progress_pct))}%"></span></div></div>`;

  const actions=head.querySelector('.project-head-actions');
  if(actions&&canManage(data,p)&&['active','on_hold'].includes(p.status)&&!actions.querySelector('[data-project-pause-v2]')){
    const b=document.createElement('button');b.className='btn derived-pause-btn-v2';b.type='button';b.dataset.projectPauseV2=p.id;b.dataset.paused=String(p.status==='on_hold');b.textContent=p.status==='on_hold'?'Reprendre':'Mettre en pause';actions.prepend(b);
  }

  const inactive=['on_hold','completed'].includes(p.status);
  let note=document.querySelector('[data-derived-readonly-v2]');
  if(inactive){
    if(!note){note=document.createElement('div');note.className='derived-readonly-v2';note.dataset.derivedReadonlyV2='1';box.insertAdjacentElement('afterend',note);}note.innerHTML=`<strong>${p.status==='completed'?'Projet terminé':'Projet en pause'}.</strong> Le contenu reste consultable et les conversations restent ouvertes, mais les écritures opérationnelles sont gelées jusqu’à ${p.status==='completed'?'réouverture':'reprise'}.`;
    const blockedActions=['new-action','new-milestone','upload-file','new-meeting','new-decision','new-version','request-approval'];
    blockedActions.forEach(action=>document.querySelectorAll(`button[data-action="${action}"]`).forEach(btn=>{btn.disabled=true;btn.title='Projet en lecture seule';}));
  } else if(note) note.remove();
}

async function scan(force=false){
  ensureStyles();
  const data=await snapshot(force).catch(()=>null);if(!data)return;
  patchCards(data);patchProject(data);
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;scan(false).catch(console.warn);});}

document.addEventListener('click',async event=>{
  const btn=event.target?.closest?.('[data-project-pause-v2]');if(!btn)return;
  event.preventDefault();event.stopImmediatePropagation();btn.disabled=true;
  try{await api.rpc('set_project_pause_v1',{p_project_id:btn.dataset.projectPauseV2,p_paused:btn.dataset.paused!=='true'});cache.at=0;setTimeout(()=>location.reload(),100);}catch(error){btn.disabled=false;window.alert(error?.message||String(error));}
},true);

const observer=new MutationObserver(schedule);if(app)observer.observe(app,{childList:true,subtree:true});
window.addEventListener('hashchange',()=>{cache.at=0;schedule();});
setInterval(()=>scan(true).catch(()=>{}),15000);
schedule();
console.info(`[2b2c] ${VERSION} active`);

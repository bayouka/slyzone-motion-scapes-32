from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
live_path = ROOT / 'site/assets/live.js'
boot_path = ROOT / 'site/assets/boot.js'
index_path = ROOT / 'site/index.html'
worker_path = ROOT / 'src/worker.js'
stability_path = ROOT / 'scripts/stability-check.mjs'
deploy_path = ROOT / '.github/workflows/deploy.yml'

live = live_path.read_text(encoding='utf-8')
boot = boot_path.read_text(encoding='utf-8')
index = index_path.read_text(encoding='utf-8')
worker = worker_path.read_text(encoding='utf-8')
stability = stability_path.read_text(encoding='utf-8')
deploy = deploy_path.read_text(encoding='utf-8')

OLD = 'v4.4.6-native-access'
NEW = 'v4.4.7-native-progress'


def replace_once(text, old, new, label):
    if text.count(old) != 1:
        raise SystemExit(f'{label}: expected exactly one occurrence, got {text.count(old)}')
    return text.replace(old, new, 1)


def sub_once(text, pattern, replacement, label, flags=0):
    out, count = re.subn(pattern, replacement, text, count=1, flags=flags)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one replacement, got {count}')
    return out

# ---- state + refresh: server summaries are a first-class data source ----
live = replace_once(
    live,
    'conversations: [], conversationMembers: [], projectMembers: [], projectCache: new Map(), messages: new Map(),',
    'conversations: [], conversationMembers: [], projectMembers: [], projectSummaries: new Map(), projectCache: new Map(), messages: new Map(),',
    'state projectSummaries',
)
live = replace_once(
    live,
    'state.projectCache.clear(); state.messages.clear();',
    'state.projectCache.clear(); state.projectSummaries.clear(); state.messages.clear();',
    'workspace summary reset',
)
live = replace_once(
    live,
    'conversations, conversationMembers, projectMembers, unreadRows, badgeRows] = await Promise.all([',
    'conversations, conversationMembers, projectMembers, summaryRows, unreadRows, badgeRows] = await Promise.all([',
    'refresh destructuring',
)
live = replace_once(
    live,
    "api.select('project_members', 'select=*'),\n      api.rpc('get_unread_conversations_v2', { p_workspace_id: wid }).catch(()=>[]),",
    "api.select('project_members', 'select=*'),\n      api.rpc('get_project_summaries_v1', { p_workspace_id: wid }).catch(()=>[]),\n      api.rpc('get_unread_conversations_v2', { p_workspace_id: wid }).catch(()=>[]),",
    'summary RPC load',
)
live = replace_once(
    live,
    'Object.assign(state, { projects, archivedProjects, members, profiles, notifications, requests, approvals, meetings, meetingAttendees, actions, assignees, decisions, deliverables, deliverableVersions, conversations, conversationMembers, projectMembers });',
    "Object.assign(state, { projects, archivedProjects, members, profiles, notifications, requests, approvals, meetings, meetingAttendees, actions, assignees, decisions, deliverables, deliverableVersions, conversations, conversationMembers, projectMembers });\n    state.projectSummaries = new Map((Array.isArray(summaryRows)?summaryRows:[]).map(row=>[row.project_id,row]));",
    'summary map assignment',
)

# ---- writing is disabled by the UI when project lifecycle is not active ----
live = sub_once(
    live,
    r"function canWriteProject\(projectId\)\{.*?\}",
    "function canWriteProject(projectId){const project=state.projects.find(p=>p.id===projectId)||state.archivedProjects.find(p=>p.id===projectId);if(project&&project.status!=='active')return false;if(['owner','admin'].includes(state.workspaceRole))return true;if(state.workspaceRole!=='member')return false;const pm=projectMembership(projectId);return !!pm&&['lead','member'].includes(pm.role)}",
    'canWriteProject lifecycle',
)

# ---- server-derived progress/state helpers ----
server_helpers = r'''function projectSummary(projectId){return state.projectSummaries.get(projectId)||null}
function projectStateReasonText(summary){
  if(!summary)return '';
  const blocked=Number(summary.action_blocked||0), overdue=Number(summary.action_overdue||0), milestoneOverdue=Number(summary.milestone_overdue||0);
  if(summary.state_code==='completed')return 'Projet terminé';
  if(summary.state_code==='on_hold')return 'Projet en pause';
  if(milestoneOverdue)return `${milestoneOverdue} phase${milestoneOverdue>1?'s':''} en retard`;
  if(blocked&&overdue)return `${blocked} action${blocked>1?'s':''} bloquée${blocked>1?'s':''} · ${overdue} en retard`;
  if(blocked)return `${blocked} action${blocked>1?'s':''} bloquée${blocked>1?'s':''}`;
  if(overdue)return `${overdue} action${overdue>1?'s':''} en retard`;
  if(summary.state_code==='off_track')return 'Date cible dépassée';
  return 'Aucun signal critique détecté';
}
function projectProgressInfo(project){
  const summary=projectSummary(project.id);
  if(summary){
    const progress=Math.max(0,Math.min(100,Number(summary.progress_pct||0)));
    const basis=summary.progress_basis;
    const label=basis==='roadmap'
      ? `${Number(summary.milestone_done||0)}/${Number(summary.milestone_count||0)} phase${Number(summary.milestone_count||0)>1?'s':''} terminée${Number(summary.milestone_done||0)>1?'s':''}`
      : basis==='actions'
        ? `${Number(summary.action_done||0)}/${Number(summary.action_count||0)} action${Number(summary.action_count||0)>1?'s':''} terminée${Number(summary.action_done||0)>1?'s':''}`
        : 'Projet à structurer';
    return {progress,label,source:basis||'server',summary};
  }
  const phases=projectMilestones(project.id);
  if(phases.length){const done=phases.filter(m=>m.status==='done').length;return{progress:Math.round(done/phases.length*100),label:`${done}/${phases.length} phase${phases.length>1?'s':''} terminée${done>1?'s':''}`,source:'phases'}};
  const actions=state.actions.filter(a=>a.project_id===project.id&&!['cancelled'].includes(a.status));
  if(actions.length){const done=actions.filter(a=>a.status==='done').length;return{progress:Math.round(done/actions.length*100),label:`${done}/${actions.length} action${actions.length>1?'s':''} terminée${done>1?'s':''}`,source:'actions'}};
  return {progress:null,label:'Progression non calculable',source:'none'};
}
function projectHealthInfo(project){
  const summary=projectSummary(project.id);
  if(summary){
    const reason=projectStateReasonText(summary);
    if(summary.state_code==='completed')return{tone:'good',label:'Terminé',reason};
    if(summary.state_code==='on_hold')return{tone:'blue',label:'En pause',reason};
    if(summary.state_code==='off_track')return{tone:'danger',label:'En difficulté',reason};
    if(summary.state_code==='at_risk')return{tone:'warn',label:'À surveiller',reason};
    return{tone:'good',label:'En bonne voie',reason};
  }
  const open=state.actions.filter(a=>a.project_id===project.id&&!['done','cancelled'].includes(a.status));
  const progress=projectProgressInfo(project).progress;
  const now=Date.now();
  const overdue=open.filter(a=>a.due_at&&new Date(a.due_at).getTime()<now);
  const blocked=open.filter(a=>a.status==='blocked');
  if(blocked.length)return{tone:'danger',label:'En difficulté',reason:`${blocked.length} blocage${blocked.length>1?'s':''} empêche${blocked.length>1?'nt':''} la progression`};
  const targetLate=project.target_date&&new Date(`${project.target_date}T23:59:59`).getTime()<now&&(progress??0)<100;
  if(targetLate||overdue.length||['at_risk','off_track'].includes(project.health))return{tone:'warn',label:'À surveiller',reason:overdue.length?`${overdue.length} échéance${overdue.length>1?'s':''} dépassée${overdue.length>1?'s':''}`:targetLate?'Date cible dépassée':'Risque signalé, progression encore possible'};
  if(projectMilestones(project.id).length||open.length||project.health==='on_track')return{tone:'good',label:'En bonne voie',reason:'Aucun problème significatif'};
  return{tone:'neutral',label:'À structurer',reason:'Pas encore assez de données'};
}
function attentionDueLabel'''
live = sub_once(
    live,
    r"function projectProgressInfo\(project\)\{[\s\S]*?\nfunction attentionDueLabel",
    server_helpers,
    'server progress/health helpers',
)

# Home prioritisation now follows derived server state.
live = replace_once(
    live,
    "const blocked=state.projects.find(p=>projectHealthInfo(p).label==='Bloqué');if(blocked)parts.push(`${blocked.name} est bloqué`);",
    "const difficult=state.projects.find(p=>projectHealthInfo(p).tone==='danger');if(difficult)parts.push(`${difficult.name} est en difficulté`);",
    'home summary state',
)
live = replace_once(
    live,
    "if(projectHealthInfo(p).label==='Bloqué')return 4;",
    "if(projectHealthInfo(p).tone==='danger')return 4;",
    'resume score state',
)

# Home project cards expose real percentage, not milestone-count shorthand.
new_resume_card = r'''function projectResumeCardV43(p){
  const health=projectHealthInfo(p),phases=projectMilestones(p.id),current=phases.find(m=>m.status==='active')||phases.find(m=>m.status==='todo'),next=projectNextForUser(p),people=projectPeople(p.id).slice(0,4),progressInfo=projectProgressInfo(p);
  const progress=progressInfo.progress===null?'Progression à structurer':`${progressInfo.progress}% · ${progressInfo.label}`;
  return `<a class="project-resume-card-v43" href="#/projects/${p.id}/overview"><div class="project-resume-top"><div><span class="project-symbol">${esc(p.name.slice(0,1).toUpperCase())}</span><div><h3>${esc(p.name)}</h3><small>${current?esc(current.title):phases.length?'Projet terminé':'À structurer'}</small></div></div><span class="pill ${health.tone}" title="${escAttr(health.reason)}">${health.label}</span></div><div class="project-resume-next ${next.tone}"><span>${esc(next.label)}</span><strong>${esc(next.title)}</strong>${next.when?`<small>${esc(next.when)}</small>`:''}</div>${people.length?`<div class="v435-project-people"><span>Équipe</span><span class="v435-avatar-stack">${people.map(pm=>avatarHtml(pm.user_id)).join('')}</span></div>`:''}<div class="project-resume-meta"><span>${esc(progress)}</span><span>${p.target_date?`cible ${formatDate(p.target_date)}`:'sans date cible'}</span></div></a>`;
}

function renderDashboard'''
live = sub_once(
    live,
    r"function projectResumeCardV43\(p\)\{[\s\S]*?\n\}\n\nfunction renderDashboard",
    new_resume_card,
    'home project resume card',
)

# Project detail header uses derived state and derived progress.
live = replace_once(
    live,
    "const progress = actions.length ? Math.round(done/actions.length*100) : 0;",
    "const progress = projectProgressInfo(project).progress ?? 0;",
    'project detail progress',
)
live = replace_once(
    live,
    'const canManageProject = canWriteProject(id);',
    'const canManageProject = canWriteProject(id);\n  const derivedHealth = projectHealthInfo(project);',
    'project detail derived health',
)
live = replace_once(
    live,
    '<span class="pill good">${projectStatusLabel(project.status)}</span><span class="pill ${healthTone(project.health)}">${healthLabel(project.health)}</span>',
    '<span class="pill ${derivedHealth.tone}" title="${escAttr(derivedHealth.reason)}">${derivedHealth.label}</span>',
    'project header pills',
)

summary_card_helper = r'''function projectServerSummaryCard(project){
  const summary=projectSummary(project.id);if(!summary)return '';
  const progress=projectProgressInfo(project),health=projectHealthInfo(project);
  const openActions=Number(summary.action_open||0),openMilestones=Number(summary.milestone_open||0),blocked=Number(summary.action_blocked||0),overdue=Number(summary.action_overdue||0)+Number(summary.milestone_overdue||0);
  const signals=[];if(blocked)signals.push(`${blocked} bloquée${blocked>1?'s':''}`);if(overdue)signals.push(`${overdue} en retard`);if(!signals.length)signals.push('aucun signal critique');
  return `<div class="card situation-card"><div class="section-head compact"><div><span class="eyebrow">État calculé</span><h2>${health.label}</h2></div><strong>${progress.progress??0}%</strong></div><p class="situation-copy">${esc(health.reason)}</p><div class="project-progress-row"><span>${esc(progress.label)}</span><span>${openActions} action${openActions>1?'s':''} ouverte${openActions>1?'s':''} · ${openMilestones} phase${openMilestones>1?'s':''} ouverte${openMilestones>1?'s':''}</span></div><div class="progress"><span style="width:${progress.progress??0}%"></span></div><div class="metric-label" style="margin-top:10px">${esc(signals.join(' · '))}</div></div>`;
}

function projectOverview'''
live = sub_once(
    live,
    r"function projectOverview\(project, actions, milestones, progress\)",
    summary_card_helper + '(project, actions, milestones, progress)',
    'project summary helper insertion',
)
live = replace_once(
    live,
    'return `<div class="project-room-layout"><section class="stack">\n      <div class="card situation-card">',
    'return `<div class="project-room-layout"><section class="stack">${projectServerSummaryCard(project)}\n      <div class="card situation-card">',
    'project summary card render',
)

# Remove manual state/health selectors from edit modal; lifecycle is explicit.
new_project_edit = r'''  if (modal.type==='project-edit') { const p=state.projects.find(x=>x.id===modal.projectId); if(!p)return ''; return modalFrame('Modifier le projet','Modifiez le cadrage. L’état et la santé sont gérés automatiquement par le workflow.',`<form data-form="project-edit"><input type="hidden" name="projectId" value="${p.id}"><div class="form-grid"><div class="field span-2"><label>Nom</label><input name="name" required maxlength="160" value="${escAttr(p.name)}"></div><div class="field span-2"><label>Objectif</label><textarea name="objective">${esc(p.objective||'')}</textarea></div><div class="field"><label>Date cible</label><input name="targetDate" type="date" value="${escAttr(p.target_date||'')}"></div></div><div class="notice">L’état En bonne voie / À surveiller / En difficulté est calculé depuis les jalons, actions, blocages et échéances.</div><div class="modal-actions"><button class="btn" type="button" data-action="close-modal">Annuler</button><button class="btn primary" type="submit">Enregistrer</button></div></form>`); }'''
live = sub_once(live, r"^  if \(modal\.type==='project-edit'\).*?$", new_project_edit, 'project edit modal', flags=re.M)

new_manage = r'''  if (modal.type==='project-manage') { const p=state.projects.find(x=>x.id===modal.projectId); if(!p)return ''; const lifecycle=p.status==='active'?`<button class="btn" data-action="pause-project" data-project="${p.id}">Mettre en pause</button><button class="btn primary" data-action="start-complete-project" data-project="${p.id}">Terminer le projet</button>`:p.status==='on_hold'?`<button class="btn" data-action="resume-project" data-project="${p.id}">Reprendre</button><button class="btn primary" data-action="start-complete-project" data-project="${p.id}">Terminer le projet</button>`:p.status==='completed'?`<button class="btn primary" data-action="reopen-project" data-project="${p.id}">Réouvrir le projet</button>`:''; return modalFrame('Gérer le projet',`${projectStatusLabel(p.status)} · ${projectHealthInfo(p).label}`,`<div class="notice"><strong>${esc(p.name)}</strong><br>${esc(projectHealthInfo(p).reason)}</div><div class="modal-actions"><button class="btn" data-action="close-modal">Fermer</button>${lifecycle}<button class="btn" data-action="archive-project" data-project="${p.id}">Archiver</button><button class="btn danger" data-action="delete-project" data-project="${p.id}">Supprimer définitivement</button></div>`); }
  if (modal.type==='project-complete') { const p=state.projects.find(x=>x.id===modal.projectId); if(!p)return ''; const preview=modal.preview||{}; const open=Number(preview.open_commitments||0); const refs=state.deliverables.filter(d=>d.project_id===p.id&&d.status!=='archived'); return modalFrame('Terminer le projet','Conservez une trace claire du résultat obtenu avant de clôturer.',`<form data-form="project-complete"><input type="hidden" name="projectId" value="${p.id}"><div class="stack"><div class="field"><label>Résultat obtenu</label><textarea name="result" required placeholder="Qu’est-ce qui a réellement été livré ou validé ?"></textarea></div>${refs.length?`<div class="field"><label>Livrables de référence (facultatif)</label><div class="project-checks">${refs.map(d=>`<label><input type="checkbox" name="referenceDeliverableIds" value="${d.id}"> ${esc(d.title)}</label>`).join('')}</div></div>`:''}${open?`<div class="notice danger"><strong>${open} engagement${open>1?'s':''} encore ouvert${open>1?'s':''}</strong><br>${Number(preview.open_actions||0)} action(s) · ${Number(preview.open_milestones||0)} phase(s) · ${Number(preview.open_requests||0)} demande(s) · ${Number(preview.pending_approvals||0)} validation(s).</div><div class="field"><label>Ce qu’il reste à transmettre ou traiter</label><textarea name="remaining" required></textarea></div><label><input type="checkbox" name="confirmOpen" value="1" required> Je confirme la clôture malgré ces engagements ouverts.</label>`:'<div class="notice"><strong>Aucun engagement ouvert.</strong> Le projet peut être clôturé proprement.</div>'}</div><div class="modal-actions"><button class="btn" type="button" data-action="close-modal">Annuler</button><button class="btn primary" type="submit">Confirmer la clôture</button></div></form>`); }'''
live = sub_once(live, r"^  if \(modal\.type==='project-manage'\).*?$", new_manage, 'project manage/complete modals', flags=re.M)

# Lifecycle click actions.
live = replace_once(
    live,
    "else if (action==='manage-project') openModal({type:'project-manage',projectId:target.dataset.project});\n    else if (action==='archive-project') await archiveProject(target.dataset.project);",
    "else if (action==='manage-project') openModal({type:'project-manage',projectId:target.dataset.project});\n    else if (action==='pause-project') await setProjectPause(target.dataset.project,true);\n    else if (action==='resume-project') await setProjectPause(target.dataset.project,false);\n    else if (action==='start-complete-project') await openProjectCompletion(target.dataset.project);\n    else if (action==='reopen-project') await reopenProject(target.dataset.project);\n    else if (action==='archive-project') await archiveProject(target.dataset.project);",
    'lifecycle click actions',
)

# Completion form arrays + dispatch.
live = replace_once(
    live,
    "data.projectIds=fd.getAll('projectIds'); data.responsibilityIds=fd.getAll('responsibilityIds'); data.participantIds=fd.getAll('participantIds'); data.attendeeIds=fd.getAll('attendeeIds'); data.mentionIds=fd.getAll('mentionIds'); data.directMemberIds=fd.getAll('directMemberIds');",
    "data.projectIds=fd.getAll('projectIds'); data.responsibilityIds=fd.getAll('responsibilityIds'); data.participantIds=fd.getAll('participantIds'); data.attendeeIds=fd.getAll('attendeeIds'); data.mentionIds=fd.getAll('mentionIds'); data.directMemberIds=fd.getAll('directMemberIds'); data.referenceDeliverableIds=fd.getAll('referenceDeliverableIds');",
    'completion reference ids',
)
live = replace_once(
    live,
    "else if (form.dataset.form==='project-edit') await submitProjectEdit(data);",
    "else if (form.dataset.form==='project-edit') await submitProjectEdit(data);\n    else if (form.dataset.form==='project-complete') await submitProjectCompletion(data);",
    'completion submit dispatch',
)

# Legacy project edit fallback is aligned with the safe bridge.
live = sub_once(
    live,
    r"async function submitProjectEdit\(data\) \{[\s\S]*?\n\}",
    "async function submitProjectEdit(data) {\n  const patch={name:String(data.name).trim(),objective:String(data.objective||'').trim(),target_date:data.targetDate||null};\n  await api.update('projects',`id=eq.${data.projectId}`,patch,{returnRepresentation:false});\n  state.modal=null; await refreshWorkspace({quiet:true}); location.hash=`#/projects/${data.projectId}/overview`; showToast('Projet modifié');\n}",
    'submitProjectEdit fallback',
)

lifecycle_functions = r'''async function setProjectPause(projectId,paused){
  await api.rpc('set_project_pause_v1',{p_project_id:projectId,p_paused:!!paused});
  state.modal=null;await refreshWorkspace({quiet:true});location.hash=`#/projects/${projectId}/overview`;showToast(paused?'Projet mis en pause':'Projet repris');
}
async function openProjectCompletion(projectId){
  const preview=await api.rpc('get_project_closure_preview_v1',{p_project_id:projectId});
  state.modal={type:'project-complete',projectId,preview:Array.isArray(preview)?preview[0]:preview};render();
}
async function submitProjectCompletion(data){
  const projectId=data.projectId;const result=String(data.result||'').trim();if(!result)throw new Error('Indiquez le résultat obtenu.');
  await api.rpc('complete_project_v1',{p_project_id:projectId,p_result:result,p_reference_deliverable_ids:data.referenceDeliverableIds||[],p_remaining:String(data.remaining||'').trim(),p_confirm_open:data.confirmOpen==='1'});
  state.modal=null;await refreshWorkspace({quiet:true});location.hash=`#/projects/${projectId}/overview`;showToast('Projet terminé et clôture enregistrée');
}
async function reopenProject(projectId){
  await api.rpc('reopen_project_v1',{p_project_id:projectId});
  state.modal=null;await refreshWorkspace({quiet:true});location.hash=`#/projects/${projectId}/overview`;showToast('Projet réouvert');
}

async function archiveProject'''
live = sub_once(live, r"async function archiveProject", lifecycle_functions, 'lifecycle functions insertion')

# Version/cache bust + deployment guards.
for path_name, text in [('boot',boot),('index',index),('worker',worker),('stability',stability),('deploy',deploy)]:
    if OLD not in text:
        raise SystemExit(f'{path_name}: old version marker missing')

boot = boot.replace(OLD, NEW)
index = index.replace(OLD, NEW)
worker = worker.replace(OLD, NEW)
stability = stability.replace(OLD, NEW)
deploy = deploy.replace(OLD, NEW)

# Stability contract: server progress + native lifecycle must stay present.
stability = replace_once(
    stability,
    "assert(live.includes('set_workspace_member_access_v1'), 'native secure member-access RPC missing');",
    "assert(live.includes('set_workspace_member_access_v1'), 'native secure member-access RPC missing');\nassert(live.includes('get_project_summaries_v1'), 'server project summaries RPC missing');\nassert(live.includes('set_project_pause_v1'), 'native project pause workflow missing');\nassert(live.includes('complete_project_v1'), 'native project completion workflow missing');\nassert(live.includes('reopen_project_v1'), 'native project reopen workflow missing');\nassert(live.includes('projectServerSummaryCard'), 'native project summary card missing');",
    'stability progress assertions',
)
stability = stability.replace("console.log('stability/native-access production contract: ok');", "console.log('stability/native-progress production contract: ok');")

# Deployment smoke tests now verify the server-derived integration.
deploy = replace_once(
    deploy,
    "probe /assets/live.js 'data-invite-role'\n          probe / '2b2c — Projets qui avancent ensemble'",
    "probe /assets/live.js 'data-invite-role'\n          probe /assets/live.js 'get_project_summaries_v1'\n          probe /assets/live.js 'complete_project_v1'\n          probe / '2b2c — Projets qui avancent ensemble'",
    'deploy progress smoke tests',
)

# Final source-level safety checks before writing.
for needle in ['get_project_summaries_v1','projectSummaries: new Map()','projectServerSummaryCard','set_project_pause_v1','complete_project_v1','reopen_project_v1']:
    if needle not in live:
        raise SystemExit(f'final live.js missing {needle}')
if 'new MutationObserver' in boot:
    raise SystemExit('boot unexpectedly contains MutationObserver')
if OLD in boot or OLD in index or OLD in worker:
    raise SystemExit('old version marker remains in runtime files')

live_path.write_text(live, encoding='utf-8')
boot_path.write_text(boot, encoding='utf-8')
index_path.write_text(index, encoding='utf-8')
worker_path.write_text(worker, encoding='utf-8')
stability_path.write_text(stability, encoding='utf-8')
deploy_path.write_text(deploy, encoding='utf-8')
print('native project progress/lifecycle migration applied')

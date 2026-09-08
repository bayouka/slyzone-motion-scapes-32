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


def replace_once(old, new, text, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one match, got {count}')
    return text.replace(old, new, 1)


def sub_once(pattern, replacement, text, label, flags=0):
    out, count = re.subn(pattern, replacement, text, count=1, flags=flags)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one replacement, got {count}')
    return out

# 1) State: cache authoritative project summaries returned by the server.
live = replace_once(
    'projectMembers: [], projectCache: new Map(), messages: new Map(),',
    'projectMembers: [], projectSummaries: new Map(), projectCache: new Map(), messages: new Map(),',
    live,
    'state projectSummaries',
)

# 2) Workspace refresh: fetch summaries in the same controlled refresh cycle.
live = replace_once(
    'const [projects, archivedProjects, members, profiles, notifications, requests, approvals, meetings, meetingAttendees, actions, assignees, decisions, deliverables, deliverableVersions, conversations, conversationMembers, projectMembers, unreadRows, badgeRows] = await Promise.all([',
    'const [projects, archivedProjects, members, profiles, notifications, requests, approvals, meetings, meetingAttendees, actions, assignees, decisions, deliverables, deliverableVersions, conversations, conversationMembers, projectMembers, unreadRows, badgeRows, projectSummaryRows] = await Promise.all([',
    live,
    'refresh destructuring',
)
live = replace_once(
    "api.rpc('get_message_badges_v2', { p_workspace_id: wid }).catch(()=>[])\n    ]);",
    "api.rpc('get_message_badges_v2', { p_workspace_id: wid }).catch(()=>[]),\n      api.rpc('get_project_summaries_v1', { p_workspace_id: wid }).catch(()=>[])\n    ]);",
    live,
    'summary rpc',
)
live = replace_once(
    'Object.assign(state, { projects, archivedProjects, members, profiles, notifications, requests, approvals, meetings, meetingAttendees, actions, assignees, decisions, deliverables, deliverableVersions, conversations, conversationMembers, projectMembers });',
    "Object.assign(state, { projects, archivedProjects, members, profiles, notifications, requests, approvals, meetings, meetingAttendees, actions, assignees, decisions, deliverables, deliverableVersions, conversations, conversationMembers, projectMembers });\n    state.projectSummaries = new Map((Array.isArray(projectSummaryRows)?projectSummaryRows:[]).map(row=>[row.project_id,row]));",
    live,
    'summary map assignment',
)

# 3) Replace local progress/health heuristics with server-first helpers and a safe local fallback.
server_helpers = r'''function projectSummary(projectOrId){
  const id=typeof projectOrId==='string'?projectOrId:projectOrId?.id;
  return id?state.projectSummaries.get(id)||null:null;
}
function projectProgressInfo(project){
  const summary=projectSummary(project);
  if(summary){
    const progress=Math.max(0,Math.min(100,Number(summary.progress_pct)||0));
    let label='Progression calculée';
    if(summary.progress_basis==='roadmap') label=`${Number(summary.milestone_done)||0}/${Number(summary.milestone_count)||0} phase${Number(summary.milestone_count)===1?'':'s'} terminée${Number(summary.milestone_done)===1?'':'s'}`;
    else if(summary.progress_basis==='actions') label=`${Number(summary.action_done)||0}/${Number(summary.action_count)||0} action${Number(summary.action_count)===1?'':'s'} terminée${Number(summary.action_done)===1?'':'s'}`;
    else label='Projet à structurer';
    return {progress,label,source:summary.progress_basis||'server',summary};
  }
  const phases=projectMilestones(project.id);
  if(phases.length){
    const done=phases.filter(m=>m.status==='done').length;
    return {progress:Math.round(done/phases.length*100),label:`${done}/${phases.length} phase${phases.length>1?'s':''} terminée${done>1?'s':''}`,source:'fallback-phases'};
  }
  const actions=state.actions.filter(a=>a.project_id===project.id&&!['cancelled'].includes(a.status));
  if(actions.length){const done=actions.filter(a=>a.status==='done').length;return{progress:Math.round(done/actions.length*100),label:`${done}/${actions.length} action${actions.length>1?'s':''} terminée${done>1?'s':''}`,source:'fallback-actions'}};
  return {progress:0,label:'Projet à structurer',source:'fallback-empty'};
}
function projectHealthInfo(project){
  const summary=projectSummary(project);
  if(summary){
    const map={
      on_track:{tone:'good',label:'En bonne voie'},
      at_risk:{tone:'warn',label:'À surveiller'},
      off_track:{tone:'danger',label:'En difficulté'},
      on_hold:{tone:'blue',label:'En pause'},
      completed:{tone:'good',label:'Terminé'},
    };
    const base=map[summary.state_code]||{tone:'neutral',label:'À structurer'};
    return {...base,reason:summary.state_reason||'État calculé par 2b2c',code:summary.state_code,summary};
  }
  const open=state.actions.filter(a=>a.project_id===project.id&&!['done','cancelled'].includes(a.status));
  const now=Date.now();
  const overdue=open.filter(a=>a.due_at&&new Date(a.due_at).getTime()<now);
  const blocked=open.filter(a=>a.status==='blocked');
  if(project.status==='completed')return{tone:'good',label:'Terminé',reason:'Projet terminé',code:'completed'};
  if(project.status==='on_hold')return{tone:'blue',label:'En pause',reason:'Projet en pause',code:'on_hold'};
  if(blocked.length||overdue.length)return{tone:'warn',label:'À surveiller',reason:blocked.length?`${blocked.length} action${blocked.length>1?'s':''} bloquée${blocked.length>1?'s':''}`:`${overdue.length} action${overdue.length>1?'s':''} en retard`,code:'at_risk'};
  return{tone:'good',label:'En bonne voie',reason:'Aucun signal critique détecté',code:'on_track'};
}
function projectSituationFromSummary(project,fallback){
  const s=projectSummary(project); if(!s)return fallback;
  const health=projectHealthInfo(project);
  const progress=Number(s.progress_pct)||0;
  const openActions=Number(s.action_open)||0;
  const openMilestones=Number(s.milestone_open)||0;
  const blocked=Number(s.action_blocked)||0;
  const overdue=Number(s.action_overdue)||0;
  const details=[];
  details.push(`${progress}% d’avancement`);
  if(openMilestones)details.push(`${openMilestones} phase${openMilestones>1?'s':''} ouverte${openMilestones>1?'s':''}`);
  if(openActions)details.push(`${openActions} action${openActions>1?'s':''} ouverte${openActions>1?'s':''}`);
  if(blocked)details.push(`${blocked} bloquée${blocked>1?'s':''}`);
  if(overdue)details.push(`${overdue} en retard`);
  return {title:health.label,body:`${s.state_reason||health.reason}. ${details.join(' · ')}.`};
}
'''
live = sub_once(
    r"function projectProgressInfo\(project\)\{[\s\S]*?\n\}\nfunction projectHealthInfo\(project\)\{[\s\S]*?\n\}\n(?=function attentionDueLabel)",
    lambda _: server_helpers,
    live,
    'server project helpers',
)

# 4) Make operational write affordances unavailable while paused/completed.
live = replace_once(
    "function canWriteProject(projectId){if(['owner','admin'].includes(state.workspaceRole))return true;if(state.workspaceRole!=='member')return false;const pm=projectMembership(projectId);return !!pm&&['lead','member'].includes(pm.role)}",
    "function canWriteProject(projectId){const project=state.projects.find(p=>p.id===projectId);if(project&&project.status!=='active')return false;if(['owner','admin'].includes(state.workspaceRole))return true;if(state.workspaceRole!=='member')return false;const pm=projectMembership(projectId);return !!pm&&['lead','member'].includes(pm.role)}",
    live,
    'inactive project write guard',
)

# 5) Project page uses authoritative progress/state rather than raw projects.health.
live = replace_once(
    "  const done = actions.filter(a=>a.status==='done').length;\n  const progress = actions.length ? Math.round(done/actions.length*100) : 0;",
    "  const progress = projectProgressInfo(project).progress;",
    live,
    'project page progress',
)
live = replace_once(
    "  const canManageProject = canWriteProject(id);\n  const head = `",
    "  const canManageProject = canWriteProject(id);\n  const derivedState=projectHealthInfo(project);\n  const derivedProgress=projectProgressInfo(project);\n  const head = `",
    live,
    'project header helpers',
)
live = replace_once(
    '<span class="pill good">${projectStatusLabel(project.status)}</span><span class="pill ${healthTone(project.health)}">${healthLabel(project.health)}</span>',
    '<span class="pill ${derivedState.tone}" title="${escAttr(derivedState.reason)}">${derivedState.label}</span><span class="pill blue">${derivedProgress.progress}%</span>',
    live,
    'project header pills',
)
live = replace_once(
    '  const situation=projectSituationText(project,current,open,blocking,pendingApproval,pendingRequest);',
    '  const situation=projectSituationFromSummary(project,projectSituationText(project,current,open,blocking,pendingApproval,pendingRequest));',
    live,
    'project situation summary',
)

# 6) Home uses the same authoritative summary for blocked/risk prioritization and progress display.
live = replace_once(
    "  const blocked=state.projects.find(p=>projectHealthInfo(p).label==='Bloqué');if(blocked)parts.push(`${blocked.name} est bloqué`);",
    "  const blocked=state.projects.find(p=>(Number(projectSummary(p)?.action_blocked)||0)>0);if(blocked)parts.push(`${blocked.name} a un blocage`);",
    live,
    'home summary blocked',
)
live = replace_once(
    "  if(projectHealthInfo(p).label==='Bloqué')return 4;",
    "  if((Number(projectSummary(p)?.action_blocked)||0)>0)return 4;",
    live,
    'resume score blocked',
)
new_resume_card = r'''function projectResumeCardV43(p){
  const health=projectHealthInfo(p),progressInfo=projectProgressInfo(p),phases=projectMilestones(p.id),current=phases.find(m=>m.status==='active')||phases.find(m=>m.status==='todo'),next=projectNextForUser(p),people=projectPeople(p.id).slice(0,4);
  return `<a class="project-resume-card-v43" href="#/projects/${p.id}/overview"><div class="project-resume-top"><div><span class="project-symbol">${esc(p.name.slice(0,1).toUpperCase())}</span><div><h3>${esc(p.name)}</h3><small>${current?esc(current.title):phases.length?'Roadmap sans phase active':'À structurer'}</small></div></div><span class="pill ${health.tone}" title="${escAttr(health.reason)}">${health.label}</span></div><div class="project-resume-next ${next.tone}"><span>${esc(next.label)}</span><strong>${esc(next.title)}</strong>${next.when?`<small>${esc(next.when)}</small>`:''}</div>${people.length?`<div class="v435-project-people"><span>Équipe</span><span class="v435-avatar-stack">${people.map(pm=>avatarHtml(pm.user_id)).join('')}</span></div>`:''}<div class="project-progress-row"><span>${esc(progressInfo.label)}</span><strong>${progressInfo.progress}%</strong></div><div class="progress"><span style="width:${progressInfo.progress}%"></span></div><div class="project-resume-meta"><span>${esc(health.reason)}</span><span>${p.target_date?`cible ${formatDate(p.target_date)}`:'sans date cible'}</span></div></a>`;
}
'''
live = sub_once(
    r"function projectResumeCardV43\(p\)\{[\s\S]*?\n\}\n\nfunction renderDashboard",
    lambda _: new_resume_card + '\nfunction renderDashboard',
    live,
    'home project resume card',
)

# 7) Project edit no longer exposes raw lifecycle/health controls.
new_project_edit = r'''  if (modal.type==='project-edit') { const p=state.projects.find(x=>x.id===modal.projectId); if(!p)return ''; const derived=projectHealthInfo(p); return modalFrame('Modifier le projet','Modifiez les informations du projet. Son état et sa santé sont gérés automatiquement par les workflows 2b2c.',`<form data-form="project-edit"><input type="hidden" name="projectId" value="${p.id}"><div class="form-grid"><div class="field span-2"><label>Nom</label><input name="name" required maxlength="160" value="${escAttr(p.name)}"></div><div class="field span-2"><label>Objectif</label><textarea name="objective">${esc(p.objective||'')}</textarea></div><div class="field"><label>Date cible</label><input name="targetDate" type="date" value="${escAttr(p.target_date||'')}"></div><div class="field"><label>Situation calculée</label><div class="notice"><strong>${derived.label}</strong><br>${esc(derived.reason)}</div></div></div><div class="modal-actions"><button class="btn" type="button" data-action="close-modal">Annuler</button><button class="btn primary" type="submit">Enregistrer</button></div></form>`); }'''
live = sub_once(
    r"^  if \(modal\.type==='project-edit'\).*?$",
    lambda _: new_project_edit,
    live,
    'project edit modal',
    flags=re.M,
)

# 8) Native lifecycle manager + close modal.
new_manage = r'''  if (modal.type==='project-manage') { const p=state.projects.find(x=>x.id===modal.projectId); if(!p)return ''; const derived=projectHealthInfo(p); const lifecycle=p.status==='active'?`<button class="btn" data-action="pause-project" data-project="${p.id}">Mettre en pause</button><button class="btn primary" data-action="close-project" data-project="${p.id}">Terminer le projet</button>`:p.status==='on_hold'?`<button class="btn primary" data-action="resume-project" data-project="${p.id}">Reprendre le projet</button>`:p.status==='completed'?`<button class="btn primary" data-action="reopen-project" data-project="${p.id}">Réouvrir le projet</button>`:''; return modalFrame('Gérer le projet',`${derived.label} · ${derived.reason}`,`<div class="notice"><strong>${esc(p.name)}</strong><br>Pause, reprise, clôture et réouverture passent par les workflows sécurisés de 2b2c. L’archive conserve la mémoire du projet.</div><div class="modal-actions"><button class="btn" data-action="close-modal">Fermer</button>${lifecycle}<button class="btn" data-action="archive-project" data-project="${p.id}">Archiver</button><button class="btn danger" data-action="delete-project" data-project="${p.id}">Supprimer définitivement</button></div>`); }
  if (modal.type==='project-close') { const p=state.projects.find(x=>x.id===modal.projectId); if(!p)return ''; const preview=modal.preview||{}; const open=Number(preview.open_commitments)||0; const refs=state.deliverables.filter(d=>d.project_id===p.id); return modalFrame('Terminer le projet','Enregistrez le résultat obtenu et l’état des engagements encore ouverts.',`<form data-form="project-close"><input type="hidden" name="projectId" value="${p.id}"><div class="stack"><div class="notice ${open?'danger':''}"><strong>${open?`${open} engagement${open>1?'s':''} encore ouvert${open>1?'s':''}`:'Aucun engagement ouvert'}</strong><br>${Number(preview.open_actions)||0} action(s) · ${Number(preview.open_milestones)||0} phase(s) · ${Number(preview.open_requests)||0} demande(s) · ${Number(preview.pending_approvals)||0} validation(s).</div><div class="field"><label>Résultat concret obtenu</label><textarea name="result" required placeholder="Qu’est-ce qui a réellement été livré ou obtenu ?"></textarea></div>${refs.length?`<div class="field"><label>Livrables de référence</label><div class="project-checks">${refs.map(d=>`<label><input type="checkbox" name="referenceDeliverableIds" value="${d.id}"> ${esc(d.title)}</label>`).join('')}</div></div>`:''}${open?`<div class="field"><label>Ce qui reste à transmettre ou traiter</label><textarea name="remaining" required placeholder="Expliquez ce qui reste ouvert et comment cela sera repris."></textarea></div><label class="notice"><input type="checkbox" name="confirmOpen" value="1" required> Je confirme terminer le projet malgré ces engagements encore ouverts.</label>`:''}</div><div class="modal-actions"><button class="btn" type="button" data-action="close-modal">Annuler</button><button class="btn primary" type="submit">Terminer le projet</button></div></form>`); }'''
live = sub_once(
    r"^  if \(modal\.type==='project-manage'\).*?$",
    lambda _: new_manage,
    live,
    'project manage lifecycle modal',
    flags=re.M,
)

# 9) Metadata edit is metadata-only.
live = sub_once(
    r"async function submitProjectEdit\(data\) \{[\s\S]*?\n\}",
    lambda _: r'''async function submitProjectEdit(data) {
  const patch={name:String(data.name).trim(),objective:String(data.objective||'').trim(),target_date:data.targetDate||null};
  await api.update('projects',`id=eq.${data.projectId}`,patch,{returnRepresentation:false});
  state.modal=null; await refreshWorkspace({quiet:true}); location.hash=`#/projects/${data.projectId}/overview`; showToast('Projet modifié');
}''',
    live,
    'submitProjectEdit metadata-only',
)

# 10) Native lifecycle actions.
lifecycle_functions = r'''
async function setProjectPause(projectId,paused){
  await api.rpc('set_project_pause_v1',{p_project_id:projectId,p_paused:!!paused});
  state.modal=null;await refreshWorkspace({quiet:true});location.hash=`#/projects/${projectId}/overview`;showToast(paused?'Projet mis en pause':'Projet repris');
}
async function openProjectClose(projectId){
  const raw=await api.rpc('get_project_closure_preview_v1',{p_project_id:projectId});
  const preview=Array.isArray(raw)?(raw[0]||{}):(raw||{});
  state.modal={type:'project-close',projectId,preview};render();
}
async function completeProject(data){
  const projectId=String(data.projectId||'');
  const result=String(data.result||'').trim();
  const remaining=String(data.remaining||'').trim();
  const confirmOpen=String(data.confirmOpen||'')==='1';
  if(!result)throw new Error('Indiquez le résultat concret obtenu.');
  await api.rpc('complete_project_v1',{p_project_id:projectId,p_result:result,p_reference_deliverable_ids:data.referenceDeliverableIds||[],p_remaining:remaining,p_confirm_open:confirmOpen});
  state.modal=null;await refreshWorkspace({quiet:true});location.hash=`#/projects/${projectId}/overview`;showToast('Projet terminé · bilan enregistré');
}
async function reopenProject(projectId){
  await api.rpc('reopen_project_v1',{p_project_id:projectId});
  state.modal=null;await refreshWorkspace({quiet:true});location.hash=`#/projects/${projectId}/overview`;showToast('Projet réouvert');
}
'''
live = replace_once(
    '\nasync function archiveProject(projectId) {',
    lifecycle_functions + '\nasync function archiveProject(projectId) {',
    live,
    'lifecycle functions insertion',
)

# 11) Hook lifecycle actions into the native click dispatcher.
live = replace_once(
    "    else if (action==='manage-project') openModal({type:'project-manage',projectId:target.dataset.project});\n    else if (action==='archive-project') await archiveProject(target.dataset.project);",
    "    else if (action==='manage-project') openModal({type:'project-manage',projectId:target.dataset.project});\n    else if (action==='pause-project') await setProjectPause(target.dataset.project,true);\n    else if (action==='resume-project') await setProjectPause(target.dataset.project,false);\n    else if (action==='close-project') await openProjectClose(target.dataset.project);\n    else if (action==='reopen-project') await reopenProject(target.dataset.project);\n    else if (action==='archive-project') await archiveProject(target.dataset.project);",
    live,
    'lifecycle click actions',
)

# 12) Submit dispatcher supports exact closure fields.
live = replace_once(
    "data.projectIds=fd.getAll('projectIds'); data.responsibilityIds=fd.getAll('responsibilityIds'); data.participantIds=fd.getAll('participantIds'); data.attendeeIds=fd.getAll('attendeeIds'); data.mentionIds=fd.getAll('mentionIds'); data.directMemberIds=fd.getAll('directMemberIds');",
    "data.projectIds=fd.getAll('projectIds'); data.responsibilityIds=fd.getAll('responsibilityIds'); data.participantIds=fd.getAll('participantIds'); data.attendeeIds=fd.getAll('attendeeIds'); data.mentionIds=fd.getAll('mentionIds'); data.directMemberIds=fd.getAll('directMemberIds'); data.referenceDeliverableIds=fd.getAll('referenceDeliverableIds');",
    live,
    'closure arrays',
)
live = replace_once(
    "    else if (form.dataset.form==='project-edit') await submitProjectEdit(data);",
    "    else if (form.dataset.form==='project-edit') await submitProjectEdit(data);\n    else if (form.dataset.form==='project-close') await completeProject(data);",
    live,
    'closure submit dispatch',
)

# 13) Version/cache-bust.
for old, new in [
    ('v4.4.6-native-access','v4.4.7-native-project-state'),
]:
    boot = boot.replace(old,new)
    index = index.replace(old,new)
    worker = worker.replace(old,new)
    stability = stability.replace(old,new)
    deploy = deploy.replace(old,new)

# 14) Stability contract now requires native server-derived state/lifecycle and forbids raw manual health/status editing.
stability = replace_once(
    "assert(live.includes('set_workspace_member_access_v1'), 'native secure member-access RPC missing');",
    "assert(live.includes('set_workspace_member_access_v1'), 'native secure member-access RPC missing');\nassert(live.includes('get_project_summaries_v1'), 'native project summary RPC missing');\nassert(live.includes('set_project_pause_v1'), 'native pause/resume RPC missing');\nassert(live.includes('get_project_closure_preview_v1'), 'native closure preview RPC missing');\nassert(live.includes('complete_project_v1'), 'native project completion RPC missing');\nassert(live.includes('reopen_project_v1'), 'native project reopen RPC missing');\nassert(live.includes('state.projectSummaries = new Map'), 'server project summaries are not cached');",
    stability,
    'stability project state assertions',
)
stability = replace_once(
    "assert(!live.includes('Visibilité portefeuille'), 'legacy portfolio visibility selector remains in native access UI');",
    "assert(!live.includes('Visibilité portefeuille'), 'legacy portfolio visibility selector remains in native access UI');\nassert(!live.includes('<label>Santé</label><select name=\\\"health\\\">'), 'manual project health selector remains');\nassert(!live.includes(\"status:data.status||'active',health:data.health||'on_track'\"), 'metadata edit still writes lifecycle/health directly');",
    stability,
    'stability raw state guard',
)

# Update deploy smoke markers to prove server-derived state is in the actual production asset.
deploy = replace_once(
    "          probe /assets/live.js 'data-invite-role'\n          probe / '2b2c — Projets qui avancent ensemble'",
    "          probe /assets/live.js 'data-invite-role'\n          probe /assets/live.js 'get_project_summaries_v1'\n          probe /assets/live.js 'complete_project_v1'\n          probe / '2b2c — Projets qui avancent ensemble'",
    deploy,
    'deploy project state smoke',
)

# Keep wording current.
stability = stability.replace('stability/native-access production contract: ok','stability/native-project-state production contract: ok')

# Final deterministic guards before writing.
required = [
    'get_project_summaries_v1', 'projectSummaries: new Map()', 'projectSituationFromSummary',
    'set_project_pause_v1', 'get_project_closure_preview_v1', 'complete_project_v1', 'reopen_project_v1',
    "const VERSION = 'v4.4.7-native-project-state'",
]
for token in required:
    haystack = live if token != "const VERSION = 'v4.4.7-native-project-state'" else boot
    if token not in haystack:
        raise SystemExit(f'missing required token after migration: {token}')
if 'project-progress-v2.js' in boot:
    raise SystemExit('forbidden DOM progress enhancer was reintroduced')
if 'new MutationObserver' in boot:
    raise SystemExit('boot unexpectedly contains a MutationObserver')

live_path.write_text(live,encoding='utf-8')
boot_path.write_text(boot,encoding='utf-8')
index_path.write_text(index,encoding='utf-8')
worker_path.write_text(worker,encoding='utf-8')
stability_path.write_text(stability,encoding='utf-8')
deploy_path.write_text(deploy,encoding='utf-8')
print('native project state migration prepared')

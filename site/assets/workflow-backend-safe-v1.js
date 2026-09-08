import { SupabaseBrowserClient } from './supabase-client.js';

const VERSION = '2b2c workflow backend safe v1.0.0';
const config = window.__4B4C_CONFIG__ || {};
const workspaceKey = config.workspaceStorageKey || '4b4c.live.workspace.v1';
const api = new SupabaseBrowserClient({ url: config.supabaseUrl, publishableKey: config.supabasePublishableKey });

const workspaceId = () => localStorage.getItem(workspaceKey) || '';
const val = (fd, key, fallback = '') => String(fd.get(key) ?? fallback).trim();
const vals = (fd, key) => fd.getAll(key).map(String).filter(Boolean);

function localIso(value) {
  if (!value) return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
function scalar(value) {
  if (Array.isArray(value)) return scalar(value[0]);
  if (value && typeof value === 'object') return value.id || value.project_id || Object.values(value)[0];
  return value;
}
function stop(event) {
  event.preventDefault();
  event.stopImmediatePropagation();
}
function setBusy(form, busy) {
  form.querySelectorAll('button,input,select,textarea').forEach((el) => { el.disabled = busy; });
}
function notice(form, message, error = false) {
  let node = form.querySelector('[data-workflow-safe-feedback]');
  if (!node) {
    node = document.createElement('div');
    node.dataset.workflowSafeFeedback = '1';
    const actions = form.querySelector('.modal-actions,.project-close-actions,.meeting-edit-actions');
    (actions || form).insertAdjacentElement(actions ? 'beforebegin' : 'afterbegin', node);
  }
  node.className = `notice${error ? ' danger' : ''}`;
  node.setAttribute('role', error ? 'alert' : 'status');
  node.textContent = message;
}
function failText(error) {
  const msg = String(error?.message || error || 'Erreur inconnue');
  const map = [
    ['ACTION_MANAGE_DENIED','Seul le responsable autorisé peut modifier les détails ou le responsable de cette action.'],
    ['ACTION_STATUS_DENIED','Vous ne pouvez pas changer le statut de cette action.'],
    ['ACTION_BLOCK_REASON_REQUIRED','Indiquez la cause du blocage.'],
    ['ACTION_ASSIGNEE_DENIED','Cette personne ne peut pas être responsable de cette action.'],
    ['ACTION_MILESTONE_CONTEXT_MISMATCH','Le jalon choisi appartient à un autre projet.'],
    ['MILESTONE_MANAGE_DENIED','Vous ne pouvez pas modifier ce jalon.'],
    ['MILESTONE_HAS_OPEN_ACTIONS','Ce jalon contient encore des actions ouvertes.'],
    ['MILESTONE_OWNER_DENIED','Cette personne ne peut pas être responsable de ce jalon.'],
    ['MEETING_ATTENDEE_NO_PROJECT_ACCESS','Un participant sélectionné n’a pas accès à ce projet.'],
    ['GUEST_MEETING_REQUIRES_SHARED_PROJECT','Un invité externe nécessite une réunion partagée liée à un projet commun.'],
    ['PROJECT_STATUS_USE_WORKFLOW','Utilisez Pause, Reprise, Terminer ou Réouvrir pour changer l’état du projet.'],
    ['PROJECT_WRITE_DENIED','Ce projet est en lecture seule ou vous n’avez pas les droits nécessaires.'],
    ['FORBIDDEN','Vous n’avez pas le droit d’effectuer cette modification.'],
  ];
  return map.find(([code]) => msg.includes(code))?.[1] || msg;
}
async function done(form, message, hash = '') {
  notice(form, message);
  if (hash) location.hash = hash;
  setTimeout(() => location.reload(), 120);
}

async function submitAction(form, fd) {
  const projectId = val(fd,'projectId');
  const id = scalar(await api.rpc('create_action_v1', {
    p_project_id: projectId,
    p_title: val(fd,'title'),
    p_description: val(fd,'description'),
    p_priority: val(fd,'priority','normal') || 'normal',
    p_due_at: localIso(val(fd,'dueAt')),
    p_milestone_id: val(fd,'milestoneId') || null,
    p_assignee_id: val(fd,'assignee') || null,
    p_visibility: val(fd,'visibility','internal') || 'internal',
  }));
  const sourceType = val(fd,'sourceType');
  const sourceId = val(fd,'sourceId');
  if (id && (sourceType || sourceId)) {
    await api.update('actions', `id=eq.${id}`, { source_type: sourceType || null, source_id: sourceId || null }, { returnRepresentation:false }).catch(()=>{});
  }
  await done(form,'Action créée.', projectId ? `#/projects/${projectId}/work/list` : '#/work');
}
async function submitActionEdit(form, fd) {
  const actionId = val(fd,'actionId');
  const projectId = val(fd,'projectId');
  const status = val(fd,'status','todo') || 'todo';
  await api.rpc('update_action_v1', {
    p_action_id: actionId,
    p_title: val(fd,'title'),
    p_description: val(fd,'description'),
    p_priority: val(fd,'priority','normal') || 'normal',
    p_due_at: localIso(val(fd,'dueAt')),
    p_milestone_id: val(fd,'milestoneId') || null,
    p_assignee_id: val(fd,'assignee') || null,
    p_visibility: val(fd,'visibility','internal') || 'internal',
  });
  await api.rpc('set_action_status_v1', {
    p_action_id: actionId,
    p_status: status,
    p_blocked_reason: status === 'blocked' ? (val(fd,'blockedReason') || null) : null,
  });
  await done(form,'Action mise à jour.', projectId ? `#/projects/${projectId}/work/list` : '#/work');
}
async function submitMilestone(form, fd, editing = false) {
  const projectId = val(fd,'projectId');
  if (editing) {
    await api.rpc('update_milestone_v1', {
      p_milestone_id: val(fd,'milestoneId'),
      p_title: val(fd,'title'),
      p_description: val(fd,'description'),
      p_status: val(fd,'status','todo') || 'todo',
      p_start_date: val(fd,'startDate') || null,
      p_due_date: val(fd,'dueDate') || null,
      p_owner_id: val(fd,'ownerId') || null,
      p_visibility: val(fd,'visibility','internal') || 'internal',
    });
  } else {
    await api.rpc('create_milestone_v1', {
      p_project_id: projectId,
      p_title: val(fd,'title'),
      p_description: val(fd,'description'),
      p_start_date: val(fd,'startDate') || null,
      p_due_date: val(fd,'dueDate') || null,
      p_owner_id: val(fd,'ownerId') || null,
      p_visibility: val(fd,'visibility','internal') || 'internal',
    });
  }
  await done(form, editing ? 'Jalon mis à jour.' : 'Jalon ajouté.', `#/projects/${projectId}/work/roadmap`);
}
async function submitMeeting(form, fd) {
  const meetingId = scalar(await api.rpc('create_meeting_with_attendees_v1', {
    p_workspace_id: workspaceId(),
    p_title: val(fd,'title'),
    p_starts_at: localIso(val(fd,'startsAt')),
    p_ends_at: localIso(val(fd,'endsAt')),
    p_project_id: val(fd,'projectId') || null,
    p_video_room: val(fd,'videoRoom') || null,
    p_visibility: val(fd,'visibility','internal') || 'internal',
    p_attendee_ids: vals(fd,'attendeeIds'),
  }));
  const agenda = val(fd,'agenda');
  if (meetingId && agenda) await api.update('meetings', `id=eq.${meetingId}`, { agenda }, { returnRepresentation:false });
  await done(form,'Réunion planifiée.', meetingId ? `#/calendar/meeting/${meetingId}` : '#/calendar');
}
async function submitMemberManage(form, fd) {
  const role = val(fd,'role','member') || 'member';
  let projectIds = vals(fd,'projectIds');
  if (role === 'admin') projectIds = [];
  if (role === 'member') {
    const projects = await api.select('projects', `select=id,visibility&workspace_id=eq.${workspaceId()}&status=neq.archived`);
    const restricted = new Set(projects.filter((p) => p.visibility === 'restricted').map((p) => p.id));
    projectIds = projectIds.filter((id) => restricted.has(id));
  }
  await api.rpc('set_workspace_member_access_v1', {
    p_workspace_id: workspaceId(),
    p_user_id: val(fd,'userId'),
    p_role: role,
    p_project_ids: projectIds,
  });
  await done(form,'Accès du membre mis à jour.','#/team');
}
async function submitProjectEdit(form, fd) {
  const projectId = val(fd,'projectId');
  await api.update('projects', `id=eq.${projectId}`, {
    name: val(fd,'name'), objective: val(fd,'objective'), target_date: val(fd,'targetDate') || null,
  }, { returnRepresentation:false });
  await done(form,'Projet mis à jour.',`#/projects/${projectId}/overview`);
}

const handledForms = new Set(['action','action-edit','milestone','milestone-edit','meeting','project-edit']);
document.addEventListener('submit', async (event) => {
  const form = event.target?.closest?.('form[data-form]');
  const kind = form?.dataset?.form;
  if (!form || !handledForms.has(kind)) return;
  stop(event);
  if (form.dataset.workflowSafeBusy === '1') return;
  form.dataset.workflowSafeBusy = '1';
  setBusy(form,true);
  const fd = new FormData(form);
  try {
    if (!api.getSession()) throw new Error('Votre session a expiré. Reconnectez-vous.');
    if (kind === 'action') await submitAction(form,fd);
    else if (kind === 'action-edit') await submitActionEdit(form,fd);
    else if (kind === 'milestone') await submitMilestone(form,fd,false);
    else if (kind === 'milestone-edit') await submitMilestone(form,fd,true);
    else if (kind === 'meeting') await submitMeeting(form,fd);
    else if (kind === 'project-edit') await submitProjectEdit(form,fd);
  } catch (error) {
    notice(form,failText(error),true);
    setBusy(form,false);
    form.dataset.workflowSafeBusy = '0';
  }
}, true);

document.addEventListener('change', async (event) => {
  const select = event.target?.closest?.('[data-status-action]');
  if (!select) return;
  stop(event);
  const status = select.value;
  let blockedReason = null;
  if (status === 'blocked') {
    blockedReason = window.prompt('Pourquoi cette action est-elle bloquée ?')?.trim() || '';
    if (!blockedReason) { location.reload(); return; }
  }
  select.disabled = true;
  try {
    await api.rpc('set_action_status_v1', {
      p_action_id: select.dataset.statusAction,
      p_status: status,
      p_blocked_reason: blockedReason,
    });
    setTimeout(() => location.reload(), 80);
  } catch (error) {
    window.alert(failText(error));
    location.reload();
  }
}, true);

console.info(`[2b2c] ${VERSION} active — no MutationObserver`);

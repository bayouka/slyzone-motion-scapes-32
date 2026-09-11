import { SupabaseBrowserClient } from './supabase-client.js';

const config = window.__4B4C_CONFIG__ || {};
const api = new SupabaseBrowserClient({ url: config.supabaseUrl, publishableKey: config.supabasePublishableKey });
let busy = false;

const value = (fd, key, fallback = '') => String(fd.get(key) ?? fallback).trim();
const one = (result) => Array.isArray(result) ? (result[0] ?? null) : result;

function localIso(raw) {
  if (!raw) return null;
  const parsed = new Date(String(raw));
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function setBusy(form, state) {
  form?.querySelectorAll('button,input,select,textarea').forEach((element) => {
    element.disabled = state;
  });
}

function message(error) {
  const text = String(error?.message || error || 'Erreur inconnue');
  const mapping = [
    ['ACTION_TITLE_REQUIRED', 'Indiquez un titre pour l’action.'],
    ['ACTION_PRIORITY_INVALID', 'La priorité choisie est invalide.'],
    ['ACTION_VISIBILITY_INVALID', 'La visibilité choisie est invalide.'],
    ['ACTION_ASSIGNEE_DENIED', 'Cette personne ne peut pas être responsable de cette action.'],
    ['ACTION_MILESTONE_CONTEXT_MISMATCH', 'La phase choisie appartient à un autre projet.'],
    ['ACTION_MANAGE_DENIED', 'Vous ne pouvez pas modifier cette action.'],
    ['ACTION_STATUS_DENIED', 'Vous ne pouvez pas changer le statut de cette action.'],
    ['ACTION_BLOCK_REASON_REQUIRED', 'Indiquez la cause du blocage.'],
    ['ACTION_NOT_FOUND', 'Cette action n’existe plus ou n’est plus accessible.'],
    ['MILESTONE_TITLE_REQUIRED', 'Indiquez un titre pour la phase.'],
    ['MILESTONE_VISIBILITY_INVALID', 'La visibilité choisie est invalide.'],
    ['MILESTONE_DATES_INVALID', 'La date cible doit être postérieure ou égale à la date de début.'],
    ['MILESTONE_OWNER_DENIED', 'Cette personne ne peut pas être responsable de cette phase.'],
    ['MILESTONE_MANAGE_DENIED', 'Vous ne pouvez pas modifier cette phase.'],
    ['MILESTONE_HAS_OPEN_ACTIONS', 'Cette phase contient encore des actions ouvertes.'],
    ['MILESTONE_NOT_FOUND', 'Cette phase n’existe plus ou n’est plus accessible.'],
    ['PROJECT_WRITE_DENIED', 'Vous ne pouvez pas modifier le travail de ce projet.'],
    ['PROJECT_NOT_FOUND', 'Ce projet n’existe plus ou n’est plus accessible.'],
    ['AUTH_REQUIRED', 'Votre session a expiré. Reconnectez-vous.'],
  ];
  return mapping.find(([code]) => text.includes(code))?.[1] || text;
}

function feedback(form, text, error = false) {
  if (!form) {
    window.alert(text);
    return;
  }
  let node = form.querySelector('[data-work-workflow-feedback]');
  if (!node) {
    node = document.createElement('div');
    node.dataset.workWorkflowFeedback = '1';
    const actions = form.querySelector('.modal-actions');
    (actions || form).insertAdjacentElement(actions ? 'beforebegin' : 'afterbegin', node);
  }
  node.className = `notice${error ? ' danger' : ''}`;
  node.setAttribute('role', error ? 'alert' : 'status');
  node.textContent = text;
}

async function finish(form, text, hash) {
  feedback(form, text);
  if (hash) location.hash = hash;
  setTimeout(() => location.reload(), 100);
}

async function createAction(form) {
  const fd = new FormData(form);
  const projectId = value(fd, 'projectId');
  const actionId = one(await api.rpc('create_action_v1', {
    p_project_id: projectId,
    p_title: value(fd, 'title'),
    p_description: value(fd, 'description'),
    p_priority: value(fd, 'priority', 'normal') || 'normal',
    p_due_at: localIso(value(fd, 'dueAt')),
    p_milestone_id: value(fd, 'milestoneId') || null,
    p_assignee_id: value(fd, 'assignee') || null,
    p_visibility: value(fd, 'visibility', 'internal') || 'internal',
  }));

  // Preserve historical source linkage for actions created from a meeting/legacy context.
  // Authorization remains protected by the actions UPDATE RLS policy.
  const sourceType = value(fd, 'sourceType');
  const sourceId = value(fd, 'sourceId');
  if (actionId && (sourceType || sourceId)) {
    await api.update('actions', `id=eq.${actionId}`, {
      source_type: sourceType || null,
      source_id: sourceId || null,
    }, { returnRepresentation: false });
  }

  await finish(form, 'Action créée.', projectId ? `#/projects/${projectId}/work/list` : '#/work');
}

async function updateAction(form) {
  const fd = new FormData(form);
  const actionId = value(fd, 'actionId');
  const projectId = value(fd, 'projectId');
  const status = value(fd, 'status', 'todo') || 'todo';

  await api.rpc('update_action_v1', {
    p_action_id: actionId,
    p_title: value(fd, 'title'),
    p_description: value(fd, 'description'),
    p_priority: value(fd, 'priority', 'normal') || 'normal',
    p_due_at: localIso(value(fd, 'dueAt')),
    p_milestone_id: value(fd, 'milestoneId') || null,
    p_assignee_id: value(fd, 'assignee') || null,
    p_visibility: value(fd, 'visibility', 'internal') || 'internal',
  });

  await api.rpc('set_action_status_v1', {
    p_action_id: actionId,
    p_status: status,
    p_blocked_reason: status === 'blocked' ? (value(fd, 'blockedReason') || null) : null,
  });

  await finish(form, status === 'blocked' ? 'Action bloquée · cause enregistrée.' : 'Action mise à jour.', projectId ? `#/projects/${projectId}/work/list` : '#/work');
}

async function createMilestone(form) {
  const fd = new FormData(form);
  const projectId = value(fd, 'projectId');
  await api.rpc('create_milestone_v1', {
    p_project_id: projectId,
    p_title: value(fd, 'title'),
    p_description: value(fd, 'description'),
    p_start_date: value(fd, 'startDate') || null,
    p_due_date: value(fd, 'dueDate') || null,
    p_owner_id: value(fd, 'ownerId') || null,
    p_visibility: value(fd, 'visibility', 'internal') || 'internal',
  });
  await finish(form, 'Phase ajoutée à la roadmap.', `#/projects/${projectId}/work/roadmap`);
}

async function updateMilestone(form) {
  const fd = new FormData(form);
  const projectId = value(fd, 'projectId');
  await api.rpc('update_milestone_v1', {
    p_milestone_id: value(fd, 'milestoneId'),
    p_title: value(fd, 'title'),
    p_description: value(fd, 'description'),
    p_status: value(fd, 'status', 'todo') || 'todo',
    p_start_date: value(fd, 'startDate') || null,
    p_due_date: value(fd, 'dueDate') || null,
    p_owner_id: value(fd, 'ownerId') || null,
    p_visibility: value(fd, 'visibility', 'internal') || 'internal',
  });
  await finish(form, 'Roadmap mise à jour.', `#/projects/${projectId}/work/roadmap`);
}

async function deleteAction(target) {
  const actionId = target.dataset.id || '';
  const projectId = target.dataset.project || '';
  if (!actionId) return;
  if (!window.confirm('Supprimer définitivement cette action ?')) return;
  await api.remove('actions', `id=eq.${actionId}`);
  location.hash = projectId ? `#/projects/${projectId}/work/list` : '#/work';
  setTimeout(() => location.reload(), 100);
}

function isOwnedForm(form) {
  return ['action', 'action-edit', 'milestone', 'milestone-edit'].includes(form?.dataset?.form || '');
}

document.addEventListener('submit', async (event) => {
  const form = event.target?.closest?.('form[data-form]');
  if (!isOwnedForm(form)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  if (busy || form.dataset.workWorkflowBusy === '1') return;
  busy = true;
  form.dataset.workWorkflowBusy = '1';
  setBusy(form, true);
  try {
    if (!api.getSession()) throw new Error('AUTH_REQUIRED');
    if (form.dataset.form === 'action') await createAction(form);
    else if (form.dataset.form === 'action-edit') await updateAction(form);
    else if (form.dataset.form === 'milestone') await createMilestone(form);
    else await updateMilestone(form);
  } catch (error) {
    console.error('[2b2c] work workflow failed', error);
    feedback(form, message(error), true);
  } finally {
    busy = false;
    delete form.dataset.workWorkflowBusy;
    setBusy(form, false);
  }
}, true);

document.addEventListener('click', async (event) => {
  const target = event.target.closest?.('[data-action="delete-action"]');
  if (!target) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  if (busy) return;
  busy = true;
  target.disabled = true;
  try {
    if (!api.getSession()) throw new Error('AUTH_REQUIRED');
    await deleteAction(target);
  } catch (error) {
    console.error('[2b2c] delete action failed', error);
    window.alert(message(error));
  } finally {
    busy = false;
    target.disabled = false;
  }
}, true);

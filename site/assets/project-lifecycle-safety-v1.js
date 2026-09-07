import { SupabaseBrowserClient } from './supabase-client.js';

const VERSION = '4b4c project lifecycle safety v1.0.0';
const config = window.__4B4C_CONFIG__ || {};
let closingProjectId = '';

function apiClient() {
  return new SupabaseBrowserClient({
    url: config.supabaseUrl,
    publishableKey: config.supabasePublishableKey,
  });
}

function projectIdFromHash() {
  return (location.hash || '').match(/^#\/projects\/([^/]+)/)?.[1] || '';
}

function setBusy(root, busy) {
  root.querySelectorAll('button,input,select,textarea').forEach((el) => { el.disabled = busy; });
}

function feedback(form, message, error = false) {
  let node = form.querySelector('[data-project-close-feedback]');
  if (!node) {
    node = document.createElement('div');
    node.dataset.projectCloseFeedback = '1';
    form.appendChild(node);
  }
  node.className = `project-close-feedback${error ? ' error' : ''}`;
  node.setAttribute('role', error ? 'alert' : 'status');
  node.textContent = message;
}

function showManageError(button, error) {
  const modal = button.closest('[role="dialog"],.modal');
  if (!modal) return;
  let node = modal.querySelector('[data-project-lifecycle-error]');
  if (!node) {
    node = document.createElement('div');
    node.className = 'notice danger';
    node.dataset.projectLifecycleError = '1';
    modal.querySelector('.modal-actions')?.insertAdjacentElement('beforebegin', node);
  }
  node.setAttribute('role','alert');
  node.textContent = error?.message || String(error);
}

document.addEventListener('click', async (event) => {
  const close = event.target?.closest?.('[data-project-flow-close]');
  if (close) {
    closingProjectId = close.dataset.projectFlowClose || '';
    return;
  }

  const reopen = event.target?.closest?.('[data-project-flow-reopen]');
  if (!reopen) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  const projectId = reopen.dataset.projectFlowReopen || '';
  if (!projectId) return;

  reopen.disabled = true;
  const original = reopen.textContent;
  reopen.textContent = 'Réouverture…';
  try {
    const api = apiClient();
    if (!api.getSession()) throw new Error('Votre session a expiré. Reconnectez-vous puis réessayez.');
    await api.rpc('reopen_project_v1', { p_project_id: projectId });
    reopen.textContent = 'Projet réouvert';
    setTimeout(() => {
      location.hash = `#/projects/${projectId}/overview`;
      location.reload();
    }, 250);
  } catch (error) {
    reopen.disabled = false;
    reopen.textContent = original;
    showManageError(reopen, error);
  }
}, true);

document.addEventListener('submit', async (event) => {
  const form = event.target?.closest?.('[data-project-close-form]');
  if (!form) return;

  event.preventDefault();
  event.stopImmediatePropagation();

  const fd = new FormData(form);
  const projectId = closingProjectId || projectIdFromHash();
  const result = String(fd.get('result') || '').trim();
  const remaining = String(fd.get('remaining') || '').trim();
  const referenceIds = fd.getAll('referenceDeliverableIds').map(String);
  const confirmOpen = fd.get('confirmOpen') === '1';

  if (!projectId) {
    feedback(form, 'Projet introuvable. Fermez cette fenêtre puis réessayez.', true);
    return;
  }
  if (!result) {
    feedback(form, 'Indiquez le résultat concret obtenu avant de terminer le projet.', true);
    return;
  }

  setBusy(form, true);
  feedback(form, 'Clôture en cours…');
  try {
    const api = apiClient();
    if (!api.getSession()) throw new Error('Votre session a expiré. Reconnectez-vous puis réessayez.');
    await api.rpc('complete_project_v1', {
      p_project_id: projectId,
      p_result: result,
      p_reference_deliverable_ids: referenceIds,
      p_remaining: remaining,
      p_confirm_open: confirmOpen,
    });
    feedback(form, 'Projet terminé · bilan et état enregistrés ensemble.');
    setTimeout(() => {
      location.hash = `#/projects/${projectId}/overview`;
      location.reload();
    }, 320);
  } catch (error) {
    setBusy(form, false);
    feedback(form, error?.message || String(error), true);
  }
}, true);

console.info(`[2b2c] ${VERSION} active`);

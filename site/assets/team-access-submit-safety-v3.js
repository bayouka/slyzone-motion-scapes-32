import { SupabaseBrowserClient } from './supabase-client.js';

const VERSION = '4b4c team access submit safety v3.0.0';
const config = window.__4B4C_CONFIG__ || {};
const workspaceKey = config.workspaceStorageKey || '4b4c.live.workspace.v1';

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));

function apiClient() {
  return new SupabaseBrowserClient({
    url: config.supabaseUrl,
    publishableKey: config.supabasePublishableKey,
  });
}

function workspaceId() { return localStorage.getItem(workspaceKey) || ''; }

function setBusy(form, busy) {
  form.querySelectorAll('button,input,select,textarea').forEach((el) => {
    if (el.dataset.keepEnabled === '1') return;
    el.disabled = busy;
  });
}

function showError(form, error) {
  let box = form.querySelector('[data-team-submit-error]');
  if (!box) {
    box = document.createElement('div');
    box.className = 'notice danger';
    box.dataset.teamSubmitError = '1';
    box.setAttribute('role','alert');
    form.prepend(box);
  }
  box.innerHTML = `<strong>Impossible de terminer l’action.</strong><br>${esc(error?.message || error)}`;
}

async function submitInvite(form, fd) {
  const wid = workspaceId();
  if (!wid) throw new Error('Espace de travail introuvable. Rechargez la page.');
  const api = apiClient();
  if (!api.getSession()) throw new Error('Votre session a expiré. Reconnectez-vous puis réessayez.');
  const user = await api.getUser();

  const role = String(fd.get('role') || 'member');
  const email = String(fd.get('email') || '').trim().toLowerCase();
  const selected = fd.getAll('teamProjectIds').map(String);
  if (!email) throw new Error('Adresse email requise.');
  if (role === 'guest' && selected.length === 0) throw new Error('Choisissez au moins un projet pour un invité externe.');

  const rows = await api.insert('workspace_invites', [{
    workspace_id: wid,
    email,
    role,
    status: 'pending',
    access_mode: role === 'guest' ? 'selected' : 'all',
    invited_by: user.id,
  }]);
  const invite = rows?.[0];
  if (!invite?.id || !invite?.token) throw new Error('Invitation créée sans lien exploitable.');

  try {
    if (selected.length && role !== 'admin') {
      await api.insert('workspace_invite_projects', selected.map((projectId) => ({
        invite_id: invite.id,
        project_id: projectId,
        project_role: role === 'guest' ? 'viewer' : 'member',
      })), { returnRepresentation:false });
    }
  } catch (error) {
    try { await api.remove('workspace_invites', `id=eq.${invite.id}`); } catch {}
    throw error;
  }

  const url = new URL(location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('invite', invite.token);
  form.innerHTML = `
    <div class="stack">
      <div class="notice"><strong>Invitation prête.</strong><br>Le lien est personnel et lié à ${esc(email)}. Aucun mot de passe n’est créé par l’administrateur.</div>
      <div class="field"><label>Lien personnel d’invitation</label><input data-safe-invite-link readonly value="${esc(url.toString())}" onfocus="this.select()"></div>
    </div>
    <div class="modal-actions"><button class="btn" type="button" data-safe-copy-invite data-keep-enabled="1">Copier le lien</button><button class="btn primary" type="button" data-action="close-modal" data-keep-enabled="1">Terminer</button></div>`;

  form.querySelector('[data-safe-copy-invite]')?.addEventListener('click', async () => {
    const input = form.querySelector('[data-safe-invite-link]');
    try {
      await navigator.clipboard.writeText(input.value);
      form.querySelector('[data-safe-copy-invite]').textContent = 'Copié';
    } catch {
      input.focus();
      input.select();
    }
  });
}

async function submitProject(form, fd) {
  const wid = workspaceId();
  if (!wid) throw new Error('Espace de travail introuvable. Rechargez la page.');
  const api = apiClient();
  if (!api.getSession()) throw new Error('Votre session a expiré. Reconnectez-vous puis réessayez.');

  const visibility = String(fd.get('visibility') || 'team');
  const name = String(fd.get('name') || '').trim();
  const objective = String(fd.get('objective') || '').trim();
  const participantIds = visibility === 'restricted' ? fd.getAll('restrictedParticipantIds').map(String) : [];
  const phases = String(fd.get('phaseTitles') || '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean).slice(0,7);
  if (!name) throw new Error('Nom du projet requis.');

  const result = await api.rpc('create_project_with_access_setup_v1', {
    p_workspace_id: wid,
    p_name: name,
    p_objective: objective,
    p_target_date: fd.get('targetDate') || null,
    p_visibility: visibility,
    p_participant_ids: participantIds,
    p_phase_titles: phases,
  });
  const projectId = result?.project_id || result?.[0]?.project_id;
  if (!projectId) throw new Error('Projet créé sans identifiant exploitable.');
  location.hash = `#/projects/${projectId}/overview`;
  setTimeout(() => location.reload(), 40);
}

document.addEventListener('submit', async (event) => {
  const form = event.target?.closest?.('form[data-form="team-access-invite-v1"],form[data-form="team-access-project-v1"]');
  if (!form) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  const fd = new FormData(form);
  setBusy(form, true);

  try {
    if (form.dataset.form === 'team-access-invite-v1') await submitInvite(form, fd);
    else await submitProject(form, fd);
  } catch (error) {
    showError(form, error);
    setBusy(form, false);
  }
}, true);

console.info(`[2b2c] ${VERSION} active`);

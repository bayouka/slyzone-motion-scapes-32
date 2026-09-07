import { SupabaseBrowserClient } from './supabase-client.js';

const VERSION = '4b4c team access safety v2.1.0';
const config = window.__4B4C_CONFIG__ || {};
const workspaceKey = config.workspaceStorageKey || '4b4c.live.workspace.v1';
const api = new SupabaseBrowserClient({ url: config.supabaseUrl, publishableKey: config.supabasePublishableKey });

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));
const wid = () => localStorage.getItem(workspaceKey) || '';
let scheduled = false;

function roleLabel(role) {
  if (role === 'admin') return 'Administrateur';
  if (role === 'guest') return 'Invité externe';
  return 'Membre';
}
function roleHelp(role) {
  if (role === 'admin') return 'Accès de gestion à tout l’espace et à tous les projets, y compris les projets restreints.';
  if (role === 'guest') return 'Accès uniquement aux projets choisis et aux contenus explicitement partagés avec les externes.';
  return 'Accès automatique aux projets Équipe actuels et futurs ; les projets restreints sont attribués explicitement.';
}
function setBusy(form, busy) {
  form.querySelectorAll('button,input,select,textarea').forEach((el) => { el.disabled = busy; });
}
function showError(form, error) {
  let node = form.querySelector('[data-member-access-error]');
  if (!node) {
    node = document.createElement('div');
    node.className = 'notice danger';
    node.dataset.memberAccessError = '1';
    node.setAttribute('role', 'alert');
    form.prepend(node);
  }
  node.innerHTML = `<strong>Modification impossible.</strong><br>${esc(error?.message || error)}`;
}

async function snapshot(userId) {
  const workspaceId = wid();
  if (!workspaceId || !userId || !api.getSession()) return null;
  const [targetRows, projects, projectMembers, profiles, actor] = await Promise.all([
    api.select('workspace_members', `select=workspace_id,user_id,role,status,access_mode&workspace_id=eq.${workspaceId}&user_id=eq.${userId}&status=eq.active&limit=1`),
    api.select('projects', `select=id,name,visibility,status,created_by&workspace_id=eq.${workspaceId}&status=neq.archived&order=updated_at.desc`),
    api.select('project_members', `select=project_id,user_id,role&user_id=eq.${userId}`),
    api.select('profiles', `select=id,display_name&id=eq.${userId}&limit=1`),
    api.getUser(),
  ]);
  const target = targetRows?.[0];
  if (!target || target.role === 'owner') return null;
  const pm = new Map(projectMembers.map((row) => [row.project_id, row.role]));
  const leadProjects = projects.filter((project) => project.created_by === userId || pm.get(project.id) === 'lead');
  return {
    workspaceId,
    actor,
    target,
    projects,
    pm,
    leadProjects,
    name: profiles?.[0]?.display_name || 'ce membre',
  };
}

function projectCheckbox(project, checked, { locked = false, note = '' } = {}) {
  const id = `member-project-${project.id}`;
  return `<label class="list-row" for="${esc(id)}" style="cursor:${locked ? 'default' : 'pointer'};align-items:center">
    <input id="${esc(id)}" class="member-project-access-v2" type="checkbox" value="${esc(project.id)}" ${checked ? 'checked' : ''} ${locked ? 'disabled' : ''} style="width:18px;height:18px;accent-color:#5f63eb">
    <div class="list-main"><strong>${esc(project.name)}</strong><small>${esc(note || (project.visibility === 'restricted' ? 'Projet restreint' : 'Projet Équipe'))}</small></div>
  </label>`;
}

function renderProjectArea(form, data) {
  const role = form.elements.role.value;
  const area = form.querySelector('[data-member-project-area]');
  const help = form.querySelector('[data-member-role-help]');
  help.textContent = roleHelp(role);

  if (role === 'admin') {
    area.innerHTML = `<div class="notice"><strong>Accès automatique.</strong><br>Un administrateur accède à tous les projets. Aucun projet n’est à sélectionner ici.</div>`;
    return;
  }

  if (role === 'member') {
    const restricted = data.projects.filter((p) => p.visibility === 'restricted');
    area.innerHTML = `<div class="section-head compact"><div><h3>Projets restreints</h3><div class="metric-label">Les projets Équipe sont automatiques. Cochez seulement les projets restreints auxquels ce membre doit participer.</div></div></div>
      <div class="stack">${restricted.length ? restricted.map((project) => {
        const lead = data.leadProjects.some((p) => p.id === project.id);
        return projectCheckbox(project, data.pm.has(project.id) || lead, {
          locked: lead,
          note: lead ? 'Responsable du projet · accès conservé' : 'Accès explicite',
        });
      }).join('') : '<div class="notice">Aucun projet restreint actif.</div>'}</div>`;
    return;
  }

  const blocker = data.leadProjects.length
    ? `<div class="notice warn"><strong>Responsabilité à transférer avant passage en invité externe.</strong><br>${esc(data.leadProjects.map((p) => p.name).join(' · '))}</div>`
    : '';
  area.innerHTML = `${blocker}<div class="section-head compact"><div><h3>Projets partagés</h3><div class="metric-label">Un invité externe ne reçoit jamais de projet automatiquement. Au moins un projet doit être choisi.</div></div></div>
    <div class="stack">${data.projects.length ? data.projects.map((project) => projectCheckbox(project, data.pm.has(project.id), {
      locked: data.leadProjects.some((p) => p.id === project.id),
      note: data.leadProjects.some((p) => p.id === project.id) ? 'Responsable du projet · transfert requis' : 'Partage explicite',
    })).join('') : '<div class="notice">Aucun projet actif.</div>'}</div>`;
}

async function patchMemberModal(dialog) {
  if (dialog.dataset.teamAccessSafetyV2 === '1') return;
  const form = dialog.querySelector('form[data-form="member-manage"]');
  if (!form) return;
  const userId = form.elements.userId?.value || form.querySelector('input[name="userId"]')?.value || '';
  const data = await snapshot(userId);
  if (!data) return;

  dialog.dataset.teamAccessSafetyV2 = '1';
  form.dataset.form = 'team-access-safety-v2';
  const title = dialog.querySelector('h1,h2,h3');
  if (title) title.textContent = `Gérer ${data.name}`;
  const subtitle = title?.parentElement?.querySelector('p');
  if (subtitle) subtitle.textContent = 'Le rôle définit les droits dans l’espace. L’accès aux projets reste séparé des responsabilités opérationnelles.';

  const currentRole = ['admin','member','guest'].includes(data.target.role) ? data.target.role : 'member';
  const guestBlocked = data.leadProjects.length > 0;
  const canRemove = data.actor?.id && data.actor.id !== userId;
  form.innerHTML = `
    <input type="hidden" name="userId" value="${esc(userId)}">
    <div class="stack">
      <div class="field">
        <label for="member-role-v2">Rôle dans l’espace</label>
        <select id="member-role-v2" name="role">
          <option value="admin" ${currentRole === 'admin' ? 'selected' : ''}>Administrateur</option>
          <option value="member" ${currentRole === 'member' ? 'selected' : ''}>Membre</option>
          <option value="guest" ${currentRole === 'guest' ? 'selected' : ''} ${guestBlocked && currentRole !== 'guest' ? 'disabled' : ''}>Invité externe${guestBlocked && currentRole !== 'guest' ? ' — transférer d’abord ses responsabilités' : ''}</option>
        </select>
      </div>
      <div class="notice" data-member-role-help>${esc(roleHelp(currentRole))}</div>
      <section data-member-project-area></section>
      <div class="notice"><strong>À retenir :</strong> être responsable d’une action ou d’une étape ne donne pas un droit d’accès supplémentaire. Les responsabilités se gèrent dans le projet.</div>
      ${canRemove ? `<section style="padding-top:4px"><div class="section-head compact"><div><h3>Retirer l’accès</h3><div class="metric-label">Le retrait coupe immédiatement l’accès à l’espace, aux projets et aux ressources, même si une session est encore ouverte.</div></div></div><div data-remove-confirm-zone><button class="btn danger" type="button" data-remove-member-v2>Retirer de l’espace</button></div></section>` : ''}
    </div>
    <div class="modal-actions">
      <button class="btn" type="button" data-action="close-modal">Annuler</button>
      <button class="btn primary" type="submit">Enregistrer</button>
    </div>`;

  renderProjectArea(form, data);
  form.elements.role.addEventListener('change', () => renderProjectArea(form, data));

  form.querySelector('[data-remove-member-v2]')?.addEventListener('click', async (event) => {
    event.preventDefault();
    const button = event.currentTarget;
    const zone = form.querySelector('[data-remove-confirm-zone]');
    if (button.dataset.confirm !== '1') {
      button.dataset.confirm = '1';
      button.textContent = 'Confirmer le retrait';
      zone.insertAdjacentHTML('afterbegin', `<div class="notice warn" role="alert" style="margin-bottom:8px"><strong>Confirmer le retrait de ${esc(data.name)} ?</strong><br>Les responsabilités déjà consignées restent dans l’historique, mais cette personne perd immédiatement ses accès.</div>`);
      return;
    }
    setBusy(form, true);
    try {
      await api.rpc('remove_workspace_member_v1', {
        p_workspace_id: data.workspaceId,
        p_user_id: userId,
      });
      button.textContent = 'Accès retiré';
      setTimeout(() => location.reload(), 180);
    } catch (error) {
      showError(form, error);
      setBusy(form, false);
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const role = form.elements.role.value;
    if (role === 'guest' && data.leadProjects.length) {
      showError(form, new Error('Transférez d’abord la responsabilité des projets concernés avant de convertir ce membre en invité externe.'));
      return;
    }
    const selected = [...form.querySelectorAll('.member-project-access-v2:checked')].map((input) => input.value);
    if (role === 'guest' && selected.length === 0) {
      showError(form, new Error('Choisissez au moins un projet pour un invité externe.'));
      return;
    }

    setBusy(form, true);
    try {
      await api.rpc('set_workspace_member_access_v1', {
        p_workspace_id: data.workspaceId,
        p_user_id: userId,
        p_role: role,
        p_project_ids: role === 'admin' ? [] : selected,
      });
      const submit = form.querySelector('button[type="submit"]');
      if (submit) submit.textContent = `${roleLabel(role)} enregistré`;
      setTimeout(() => location.reload(), 180);
    } catch (error) {
      showError(form, error);
      setBusy(form, false);
    }
  }, true);
}

function scan() {
  document.querySelectorAll('[role="dialog"],.modal').forEach((dialog) => {
    patchMemberModal(dialog).catch((error) => console.warn(`${VERSION}: member modal`, error));
  });
}
function schedule() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => { scheduled = false; scan(); });
}

const observer = new MutationObserver(schedule);
observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener('hashchange', schedule);
scan();
console.info(`[2b2c] ${VERSION} active`);

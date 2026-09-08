import { SupabaseBrowserClient } from './supabase-client.js';

const VERSION = '2b2c invite prelive v2.0.0';
const config = window.__4B4C_CONFIG__ || {};
const workspaceKey = config.workspaceStorageKey || '4b4c.live.workspace.v1';
const api = new SupabaseBrowserClient({ url: config.supabaseUrl, publishableKey: config.supabasePublishableKey });

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const wid = () => localStorage.getItem(workspaceKey) || '';
let modal = null;
let projectCache = null;

function closeModal() {
  modal?.remove();
  modal = null;
  document.documentElement.classList.remove('invite-prelive-open-v2');
  document.body.classList.remove('invite-prelive-open-v2');
}

function friendlyError(error) {
  const message = String(error?.message || error || 'Erreur inconnue');
  if (message.includes('PENDING_INVITE_ALREADY_EXISTS')) return 'Une invitation en attente existe déjà pour cette adresse. Utilisez la liste des invitations pour copier, renouveler ou révoquer son lien.';
  if (message.includes('GUEST_PROJECT_REQUIRED')) return 'Choisissez au moins un projet pour un invité externe.';
  if (message.includes('PROJECT_ACCESS_INVALID')) return 'Un projet sélectionné n’est pas accessible avec ce rôle. Rechargez la page puis réessayez.';
  if (message.includes('FORBIDDEN')) return 'Vous n’avez pas le droit de gérer les invitations de cet espace.';
  if (message.includes('AUTH_REQUIRED')) return 'Votre session a expiré. Reconnectez-vous puis réessayez.';
  return message;
}

async function projects() {
  const workspaceId = wid();
  if (!workspaceId) throw new Error('Espace de travail introuvable.');
  if (projectCache?.wid === workspaceId && Date.now() - projectCache.at < 5000) return projectCache.rows;
  const rows = await api.select('projects', `select=id,name,visibility,status&workspace_id=eq.${workspaceId}&status=neq.archived&order=updated_at.desc`);
  projectCache = { wid: workspaceId, at: Date.now(), rows };
  return rows;
}

function roleHelp(role) {
  if (role === 'admin') return 'Administrateur : accès à tout l’espace et à tous les projets. Aucun projet à sélectionner.';
  if (role === 'guest') return 'Invité externe : accès uniquement aux projets explicitement partagés. Au moins un projet est requis.';
  return 'Membre : accès automatique à tous les projets Équipe actuels et futurs. Sélectionnez seulement les projets restreints à partager immédiatement.';
}

function checks(rows, selected, role) {
  const visible = role === 'member' ? rows.filter(p => p.visibility === 'restricted') : role === 'guest' ? rows : [];
  if (role === 'admin') return '<div class="notice"><strong>Accès global.</strong><br>Cet administrateur aura accès à tout l’espace et à tous les projets.</div>';
  if (!visible.length) return role === 'member'
    ? '<div class="notice">Aucun projet restreint actif. Les projets Équipe sont automatiques.</div>'
    : '<div class="notice">Aucun projet actif à partager pour le moment.</div>';
  return `<div class="project-checks">${visible.map(p => `<label><input type="checkbox" name="projectIds" value="${esc(p.id)}" ${selected.has(p.id) ? 'checked' : ''}> ${esc(p.name)}${p.visibility === 'restricted' ? ' <small>· Restreint</small>' : ''}</label>`).join('')}</div>`;
}

function renderRoleArea(form, rows, selected) {
  const role = form.elements.role.value || 'member';
  form.querySelector('[data-prelive-role-help]').textContent = roleHelp(role);
  const area = form.querySelector('[data-prelive-projects]');
  const title = role === 'member' ? 'Projets restreints à partager' : role === 'guest' ? 'Projets à partager' : 'Accès aux projets';
  area.innerHTML = `<span class="eyebrow">${esc(title)}</span>${checks(rows, selected, role)}`;
}

async function openInvite(trigger) {
  if (modal) closeModal();
  const rows = await projects();
  const selected = new Set();
  const projectId = trigger?.dataset?.project || '';
  const currentProject = rows.find(p => p.id === projectId);
  if (currentProject?.visibility === 'restricted') selected.add(projectId);

  modal = document.createElement('div');
  modal.className = 'modal-backdrop invite-prelive-backdrop-v2';
  modal.dataset.teamAccessInvite = '1';
  modal.innerHTML = `<div class="modal invite-prelive-modal-v2" role="dialog" aria-modal="true" aria-labelledby="invite-prelive-title-v2" tabindex="-1">
    <div class="card-head"><div><h2 id="invite-prelive-title-v2">Inviter une personne</h2><p>Choisissez son rôle. Les responsabilités d’actions et de jalons se gèrent ensuite directement dans les projets.</p></div><button class="icon-button" type="button" data-prelive-close aria-label="Fermer">✕</button></div>
    <form data-prelive-invite-form>
      <div class="stack">
        <div class="field"><label>Email</label><input type="email" name="email" required autofocus autocomplete="email" placeholder="prenom@exemple.fr"></div>
        <div class="field"><label>Rôle dans l’équipe</label><select name="role"><option value="member">Membre</option><option value="admin">Administrateur</option><option value="guest">Invité externe</option></select></div>
        <div class="notice" data-prelive-role-help>${esc(roleHelp('member'))}</div>
        <section data-prelive-projects></section>
        <div class="notice"><strong>Connexion :</strong> 2b2c crée un lien personnel lié à cette adresse. La personne se connecte ou crée son propre compte et choisit elle-même son mot de passe.</div>
        <div data-prelive-error></div>
      </div>
      <div class="modal-actions"><button class="btn" type="button" data-prelive-close>Annuler</button><button class="btn primary" type="submit">Créer l’invitation</button></div>
    </form>
  </div>`;
  document.body.appendChild(modal);
  document.documentElement.classList.add('invite-prelive-open-v2');
  document.body.classList.add('invite-prelive-open-v2');

  const form = modal.querySelector('[data-prelive-invite-form]');
  renderRoleArea(form, rows, selected);
  form.elements.role.addEventListener('change', () => renderRoleArea(form, rows, selected));
  modal.querySelectorAll('[data-prelive-close]').forEach(btn => btn.addEventListener('click', closeModal));
  modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const fd = new FormData(form);
    const role = String(fd.get('role') || 'member');
    const email = String(fd.get('email') || '').trim().toLowerCase();
    const projectIds = fd.getAll('projectIds').map(String);
    const errorBox = form.querySelector('[data-prelive-error]');
    errorBox.innerHTML = '';
    if (!email) return;
    if (role === 'guest' && projectIds.length === 0) {
      errorBox.innerHTML = '<div class="notice danger">Choisissez au moins un projet pour un invité externe.</div>';
      return;
    }
    form.querySelectorAll('button,input,select').forEach(el => { el.disabled = true; });
    try {
      if (!api.getSession()) throw new Error('AUTH_REQUIRED');
      const result = await api.rpc('create_workspace_invite_v2', {
        p_workspace_id: wid(),
        p_email: email,
        p_role: role,
        p_project_ids: role === 'admin' ? [] : projectIds,
      });
      const invite = Array.isArray(result) ? result[0] : result;
      if (!invite?.token) throw new Error('Invitation créée sans lien exploitable.');
      const url = new URL(location.origin + location.pathname);
      url.searchParams.set('invite', invite.token);
      form.innerHTML = `<div class="stack"><div class="notice"><strong>Invitation prête.</strong><br>Le lien est personnel et lié à ${esc(email)}. Aucun mot de passe n’est créé par l’administrateur.</div><div class="field"><label>Lien personnel d’invitation</label><input data-prelive-link readonly value="${esc(url.toString())}" onfocus="this.select()"></div></div><div class="modal-actions"><button class="btn" type="button" data-prelive-copy>Copier le lien</button><button class="btn primary" type="button" data-prelive-close>Terminer</button></div>`;
      form.querySelector('[data-prelive-copy]').addEventListener('click', async event => {
        const input = form.querySelector('[data-prelive-link]');
        try { await navigator.clipboard.writeText(input.value); event.currentTarget.textContent = 'Copié'; }
        catch { input.focus(); input.select(); }
      });
      form.querySelector('[data-prelive-close]').addEventListener('click', closeModal);
      projectCache = null;
    } catch (error) {
      errorBox.innerHTML = `<div class="notice danger"><strong>Impossible de créer l’invitation.</strong><br>${esc(friendlyError(error))}</div>`;
      form.querySelectorAll('button,input,select').forEach(el => { el.disabled = false; });
    }
  }, true);

  requestAnimationFrame(() => modal?.querySelector('[autofocus]')?.focus({ preventScroll: true }));
}

document.addEventListener('click', event => {
  const trigger = event.target?.closest?.('[data-action="invite-member"]');
  if (!trigger) return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  openInvite(trigger).catch(error => {
    console.error(`${VERSION}: unable to open invitation`, error);
    window.alert(friendlyError(error));
  });
}, true);

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && modal) {
    event.preventDefault();
    event.stopImmediatePropagation();
    closeModal();
  }
}, true);

console.info(`[2b2c] ${VERSION} active before live.js`);

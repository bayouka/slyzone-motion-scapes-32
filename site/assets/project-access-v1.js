import { SupabaseBrowserClient } from './supabase-client.js';

const config = window.__4B4C_CONFIG__ || {};
const api = new SupabaseBrowserClient({ url: config.supabaseUrl, publishableKey: config.supabasePublishableKey });
const WORKSPACE_KEY = config.workspaceStorageKey || '4b4c.live.workspace.v1';
const ROLE_ATTR = 'data-2b2c-workspace-role';
let contextCache = null;
let contextPromise = null;

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const escAttr = esc;

function injectAccessStyles() {
  if (document.getElementById('project-access-v1-style')) return;
  const style = document.createElement('style');
  style.id = 'project-access-v1-style';
  style.textContent = `
    html[${ROLE_ATTR}="guest"] .page-head-actions-v43 a[href="#/archives"],
    html[${ROLE_ATTR}="guest"] .page-head-actions-v43 button[data-action="new-project"] { display:none !important; }
    .project-access-scope-v1 { display:grid; gap:10px; grid-template-columns:repeat(2,minmax(0,1fr)); }
    .project-access-scope-v1 label { display:flex; align-items:flex-start; gap:10px; padding:14px; border:1px solid var(--live-border,#dfe5ee); border-radius:14px; cursor:pointer; background:var(--live-card,#fff); }
    .project-access-scope-v1 label:has(input:checked) { border-color:#3867f4; box-shadow:0 0 0 2px rgba(56,103,244,.10); }
    .project-access-scope-v1 input { margin-top:3px; }
    .project-access-scope-v1 span { display:grid; gap:3px; }
    .project-access-scope-v1 small { color:var(--live-muted,#667085); line-height:1.35; }
    .project-access-error-v1 { margin-top:12px; color:#b42318; font-size:13px; }
    @media (max-width:640px) { .project-access-scope-v1 { grid-template-columns:1fr; } }
  `;
  document.head.appendChild(style);
}

async function resolveContext({ force = false } = {}) {
  const workspaceId = localStorage.getItem(WORKSPACE_KEY);
  const session = api.getSession();
  if (!workspaceId || !session?.access_token) return null;
  if (!force && contextCache?.workspaceId === workspaceId && contextCache?.userId === session.user?.id) return contextCache;
  if (!force && contextPromise) return contextPromise;
  contextPromise = (async () => {
    const user = session.user?.id ? session.user : await api.getUser();
    const rows = await api.select('workspace_members', `select=workspace_id,user_id,role,status&workspace_id=eq.${workspaceId}&user_id=eq.${user.id}&status=eq.active&limit=1`);
    const membership = rows[0] || null;
    if (!membership) return null;
    contextCache = { workspaceId, userId: user.id, role: membership.role };
    document.documentElement.setAttribute(ROLE_ATTR, membership.role || '');
    return contextCache;
  })();
  try { return await contextPromise; }
  finally { contextPromise = null; }
}

async function loadInternalMembers(ctx) {
  const [members, profiles] = await Promise.all([
    api.select('workspace_members', `select=user_id,role,status&workspace_id=eq.${ctx.workspaceId}&status=eq.active&order=joined_at.asc`),
    api.select('profiles', 'select=id,display_name&order=display_name.asc'),
  ]);
  const names = new Map(profiles.map((p) => [p.id, p.display_name || 'Membre']));
  const selectable = members.filter((m) => m.user_id !== ctx.userId && m.role === 'member');
  const managers = members.filter((m) => m.user_id !== ctx.userId && ['owner','admin'].includes(m.role));
  return { selectable, managers, names };
}

function closeProjectAccessModal() {
  document.getElementById('project-access-v1')?.remove();
}

function syncRestrictedArea(root) {
  const visibility = root.querySelector('input[name="visibility"]:checked')?.value || 'team';
  const restricted = root.querySelector('[data-project-access-restricted-v1]');
  const help = root.querySelector('[data-project-access-help-v1]');
  if (restricted) restricted.hidden = visibility !== 'restricted';
  if (help) {
    help.innerHTML = visibility === 'team'
      ? '<strong>Projet d’équipe :</strong> tous les membres internes actuels et futurs y accèdent automatiquement. Les invités externes restent partagés explicitement.'
      : '<strong>Projet restreint :</strong> seuls vous, les administrateurs/propriétaire de l’espace et les membres sélectionnés y accèdent.';
  }
}

async function openProjectAccessModal() {
  const ctx = await resolveContext({ force: true });
  if (!ctx) throw new Error('Espace de travail indisponible.');
  if (ctx.role === 'guest') return;

  const { selectable, managers, names } = await loadInternalMembers(ctx);
  closeProjectAccessModal();
  const root = document.createElement('div');
  root.id = 'project-access-v1';
  root.innerHTML = `<div class="modal-backdrop" data-project-access-backdrop-v1>
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="project-access-title-v1">
      <div class="card-head"><div><h2 id="project-access-title-v1">Nouveau projet</h2><p style="margin:4px 0 0;color:var(--live-muted)">Définissez d’abord qui doit pouvoir accéder au projet, puis son cadrage initial.</p></div><button class="icon-button" type="button" data-action="project-access-close-v1" aria-label="Fermer">✕</button></div>
      <form data-form="project-access-v1">
        <div class="form-grid">
          <div class="field span-2"><label>Nom</label><input name="name" required maxlength="160" autofocus></div>
          <div class="field span-2"><label>Objectif / résultat attendu</label><textarea name="objective" required placeholder="Ex. Valider une version testable avec 6 utilisateurs."></textarea></div>
          <div class="field"><label>Date cible</label><input name="targetDate" type="date"></div>
          <div class="field span-2"><label>Accès au projet</label><div class="project-access-scope-v1">
            <label><input type="radio" name="visibility" value="team" checked><span><strong>Projet d’équipe</strong><small>Recommandé · tous les membres internes actuels et futurs.</small></span></label>
            <label><input type="radio" name="visibility" value="restricted"><span><strong>Projet restreint</strong><small>Seulement les personnes nécessaires à ce projet.</small></span></label>
          </div></div>
          <div class="span-2 notice" data-project-access-help-v1></div>
          <div class="field span-2" data-project-access-restricted-v1 hidden><label>Membres à inclure</label><div class="project-checks">${selectable.length ? selectable.map((m) => `<label><input type="checkbox" name="participantIds" value="${escAttr(m.user_id)}"> ${esc(names.get(m.user_id) || 'Membre')}</label>`).join('') : '<small>Aucun autre membre interne à sélectionner.</small>'}</div>${managers.length ? `<small>Accès administration automatique : ${esc(managers.map((m) => names.get(m.user_id) || (m.role === 'owner' ? 'Propriétaire' : 'Administrateur')).join(', '))}.</small>` : ''}</div>
          <div class="field span-2"><label>Roadmap initiale · une phase par ligne</label><textarea name="phaseTitles" rows="5">Cadrage\nRéalisation\nValidation\nLivraison</textarea><small>Gardez 3 à 7 phases. Elles restent entièrement modifiables.</small></div>
        </div>
        <div class="project-access-error-v1" data-project-access-error-v1 hidden></div>
        <div class="modal-actions"><button class="btn" type="button" data-action="project-access-close-v1">Annuler</button><button class="btn primary" type="submit">Créer et ouvrir le projet</button></div>
      </form>
    </div>
  </div>`;
  document.body.appendChild(root);
  syncRestrictedArea(root);
  requestAnimationFrame(() => root.querySelector('input[name="name"]')?.focus());
}

async function submitProjectAccess(form) {
  const ctx = await resolveContext({ force: true });
  if (!ctx || ctx.role === 'guest') throw new Error('Vous ne pouvez pas créer de projet dans cet espace.');
  const fd = new FormData(form);
  const name = String(fd.get('name') || '').trim();
  const objective = String(fd.get('objective') || '').trim();
  const targetDate = String(fd.get('targetDate') || '').trim() || null;
  const visibility = fd.get('visibility') === 'restricted' ? 'restricted' : 'team';
  const participantIds = visibility === 'restricted' ? [...new Set(fd.getAll('participantIds').map(String))] : [];
  const phases = String(fd.get('phaseTitles') || '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean).slice(0, 7);
  if (!name) throw new Error('Nom du projet requis.');
  if (!objective) throw new Error('Objectif ou résultat attendu requis.');
  if (phases.length < 1) throw new Error('Ajoutez au moins une phase de roadmap.');

  const submit = form.querySelector('button[type="submit"]');
  if (submit) { submit.disabled = true; submit.textContent = 'Création…'; }
  const result = await api.rpc('create_project_with_access_setup_v1', {
    p_workspace_id: ctx.workspaceId,
    p_name: name,
    p_objective: objective,
    p_target_date: targetDate,
    p_visibility: visibility,
    p_participant_ids: participantIds,
    p_phase_titles: phases,
  });
  const payload = Array.isArray(result) ? result[0] : result;
  const projectId = payload?.project_id || payload?.id;
  if (!projectId) throw new Error('Le projet a été créé sans identifiant exploitable.');
  closeProjectAccessModal();
  location.hash = `#/projects/${projectId}/overview`;
  location.reload();
}

injectAccessStyles();
void resolveContext().catch((error) => console.warn('[2b2c] project access role sync failed', error));
setTimeout(() => void resolveContext({ force: true }).catch(() => {}), 800);

window.addEventListener('hashchange', () => void resolveContext({ force: true }).catch(() => {}));

document.addEventListener('change', (event) => {
  const input = event.target.closest?.('#project-access-v1 input[name="visibility"]');
  if (input) syncRestrictedArea(document.getElementById('project-access-v1'));
}, true);

document.addEventListener('click', async (event) => {
  const newProject = event.target.closest?.('[data-action="new-project"]');
  if (newProject) {
    event.preventDefault();
    event.stopImmediatePropagation();
    try { await openProjectAccessModal(); }
    catch (error) { console.error('[2b2c] project creation modal failed', error); }
    return;
  }

  const close = event.target.closest?.('[data-action="project-access-close-v1"]');
  if (close) {
    event.preventDefault();
    event.stopImmediatePropagation();
    closeProjectAccessModal();
    return;
  }

  const backdrop = event.target.closest?.('[data-project-access-backdrop-v1]');
  if (backdrop && event.target === backdrop) {
    event.preventDefault();
    event.stopImmediatePropagation();
    closeProjectAccessModal();
    return;
  }

  const archives = event.target.closest?.('a[href="#/archives"]');
  if (archives) {
    const ctx = await resolveContext();
    if (ctx?.role === 'guest') {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }
}, true);

document.addEventListener('submit', async (event) => {
  const form = event.target.closest?.('form[data-form="project-access-v1"]');
  if (!form) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const errorBox = form.querySelector('[data-project-access-error-v1]');
  try {
    if (errorBox) { errorBox.hidden = true; errorBox.textContent = ''; }
    await submitProjectAccess(form);
  } catch (error) {
    const message = String(error?.message || error || 'Impossible de créer le projet.').replace(/^\w+\s*:\s*/, '');
    if (errorBox) { errorBox.textContent = message; errorBox.hidden = false; }
    const submit = form.querySelector('button[type="submit"]');
    if (submit) { submit.disabled = false; submit.textContent = 'Créer et ouvrir le projet'; }
  }
}, true);

import { SupabaseBrowserClient } from './supabase-client.js';

const VERSION = '2b2c communication v4 c0 safety v0.1.1';
const config = window.__4B4C_CONFIG__ || {};
const api = new SupabaseBrowserClient({ url: config.supabaseUrl, publishableKey: config.supabasePublishableKey });
const ROOT_ID = 'communication-workspace-v1';
const PENDING_CREATE_KEY = '2b2c.communication.c0.pending-create';
const CREATE_TTL_MS = 15000;
const MAX_CALL_INVITEES = 5;
const metaCache = new Map();
let reconcileTimer = null;

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (m) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m]));
const one = (value) => Array.isArray(value) ? (value[0] ?? null) : value;

function route() {
  const hash = location.hash || '';
  const match = hash.match(/^#\/messages(?:\/([^/?]+))?(?:\/message\/([^/?]+))?/);
  return match ? { active:true, conversationId:match[1] || '', messageId:match[2] || '' } : { active:false, conversationId:'', messageId:'' };
}

function root() { return document.getElementById(ROOT_ID); }
function isCreateForm(type) { return ['direct','group','topic','meeting'].includes(type); }

async function conversationMeta(id) {
  if (!id) return null;
  if (metaCache.has(id)) return metaCache.get(id);
  const row = one(await api.select('conversations', `select=id,kind,is_general,project_id,linked_project_id&id=eq.${id}&limit=1`));
  if (row) metaCache.set(id, row);
  return row || null;
}

function normalizeMessagesHome() {
  const r = route();
  const host = root();
  if (!r.active || r.conversationId || !host) return;
  host.querySelectorAll('.cw-conversation-row.active').forEach((node) => node.classList.remove('active'));
  const main = host.querySelector('.cw-main');
  if (!main) return;
  main.className = 'cw-main cw-no-selection';
  main.innerHTML = '<div class="cw-empty hero"><strong>Choisissez une conversation</strong><span>Retrouvez un échange ou démarrez une nouvelle conversation.</span><button class="btn primary" data-cw-action="new-menu">Nouvelle conversation</button></div>';
}

function rewriteTransformMenus() {
  const host = root();
  if (!host || !route().active) return;
  host.querySelectorAll('.cw-message-body footer').forEach((footer) => {
    if (footer.querySelector('.cw-c0-transform-menu')) return;
    const buttons = [...footer.querySelectorAll('button[data-cw-action="transform"]')];
    if (!buttons.length) return;
    const details = document.createElement('details');
    details.className = 'cw-c0-transform-menu';
    const summary = document.createElement('summary');
    summary.textContent = 'Transformer en…';
    const menu = document.createElement('div');
    menu.className = 'cw-c0-transform-options';
    buttons.forEach((button) => {
      button.textContent = button.textContent.replace(/^\s*→\s*/, '');
      menu.appendChild(button);
    });
    details.append(summary, menu);
    footer.appendChild(details);
  });
}

async function normalizeGeneralSettings() {
  const host = root();
  const r = route();
  const form = host?.querySelector('form[data-cw-form="settings"]');
  if (!form || !r.conversationId) return;
  try {
    const meta = await conversationMeta(r.conversationId);
    if (!meta?.is_general) return;
    const status = form.elements.status;
    status?.closest('.cw-field')?.remove();
  } catch (error) {
    console.warn('[2b2c] C0 could not normalize General settings', error);
  }
}

function collectiveContextFromUi() {
  const label = root()?.querySelector('.cw-conversation-head .cw-eyebrow')?.textContent?.trim() || '';
  return label === 'Équipe' || label === 'Projet';
}

async function openCollectiveCallSelector() {
  const host = root();
  const r = route();
  if (!host || !r.conversationId) return;
  const existing = host.querySelector('[data-c0-call-modal]');
  if (existing) existing.remove();

  const [user, members, meta] = await Promise.all([
    api.getUser(),
    api.select('conversation_members', `select=user_id&conversation_id=eq.${r.conversationId}`),
    conversationMeta(r.conversationId),
  ]);
  const ids = (members || []).map((row) => row.user_id).filter((id) => id && id !== user?.id);
  if (!ids.length) throw new Error('Aucune autre personne à appeler.');
  const profiles = await api.select('profiles', `select=id,display_name&id=in.(${ids.join(',')})`).catch(() => []);
  const names = new Map((profiles || []).map((profile) => [profile.id, profile.display_name || 'Membre']));

  const modal = document.createElement('div');
  modal.className = 'cw-modal-backdrop cw-c0-call-backdrop';
  modal.dataset.c0CallModal = '1';
  modal.innerHTML = `<section class="cw-modal" role="dialog" aria-modal="true" aria-label="Choisir les personnes à appeler">
    <header><div><span class="cw-eyebrow">Appel</span><h2>Qui voulez-vous appeler ?</h2><p>Choisissez explicitement les personnes. Aucun appel collectif n'est lancé automatiquement.</p></div><button class="cw-close" type="button" data-c0-call-close aria-label="Fermer">×</button></header>
    <form data-c0-call-form data-project-id="${esc(meta?.project_id || meta?.linked_project_id || '')}">
      <div class="cw-member-grid">${ids.map((id) => `<label><input type="checkbox" name="userIds" value="${esc(id)}"><span>${esc(names.get(id) || 'Membre')}</span></label>`).join('')}</div>
      <p class="cw-c0-call-help">Jusqu'à ${MAX_CALL_INVITEES} personnes peuvent être invitées en plus de vous.</p>
      <div class="cw-modal-actions"><button type="button" class="btn" data-c0-call-close>Annuler</button><button class="btn primary" type="submit">Lancer l'appel</button></div>
    </form>
  </section>`;
  host.appendChild(modal);
}

function injectStyles() {
  if (document.getElementById('communication-v4-c0-safety-style')) return;
  const style = document.createElement('style');
  style.id = 'communication-v4-c0-safety-style';
  style.textContent = `
    .cw-c0-transform-menu{position:relative;display:inline-block}
    .cw-c0-transform-menu>summary{list-style:none;cursor:pointer;color:#667085;font:600 11px Inter,system-ui}
    .cw-c0-transform-menu>summary::-webkit-details-marker{display:none}
    .cw-c0-transform-menu[open]>summary{color:#315efb}
    .cw-c0-transform-options{position:absolute;z-index:95;left:0;bottom:22px;min-width:165px;display:grid;gap:2px;padding:6px;background:#fff;border:1px solid #dfe5ef;border-radius:10px;box-shadow:0 14px 34px rgba(15,23,42,.16)}
    .cw-message-body footer .cw-c0-transform-options button{display:block;width:100%;padding:7px 8px;text-align:left;border-radius:7px}
    .cw-message-body footer .cw-c0-transform-options button:hover{background:#f4f7fb}
    .cw-c0-call-help{margin:10px 2px 0;color:#667085;font-size:11px}
    @media(max-width:767px){.cw-c0-transform-options{left:auto;right:0}.cw-c0-call-backdrop{padding:12px}}
  `;
  document.head.appendChild(style);
}

function reconcile() {
  if (!route().active) return;
  normalizeMessagesHome();
  rewriteTransformMenus();
  void normalizeGeneralSettings();
}

function scheduleReconcile() {
  queueMicrotask(reconcile);
  setTimeout(reconcile, 0);
  setTimeout(reconcile, 120);
}

// C0.1 — remember that a legacy creation form is about to navigate to an object
// that is not yet present in Communication V3 local state. The next successful
// conversation hash is reloaded once so V3 starts with fresh canonical data.
document.addEventListener('submit', (event) => {
  const form = event.target.closest(`#${ROOT_ID} form[data-cw-form]`);
  if (!form || !isCreateForm(form.dataset.cwForm)) return;
  sessionStorage.setItem(PENDING_CREATE_KEY, String(Date.now()));
}, true);

// C0.4 — collective contexts must never mass-call their full readable audience.
document.addEventListener('click', (event) => {
  const action = event.target.closest(`#${ROOT_ID} [data-cw-action="call-conversation"]`);
  if (!action || !collectiveContextFromUi()) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  openCollectiveCallSelector().catch((error) => window.alert(error?.message || String(error)));
}, true);

document.addEventListener('click', (event) => {
  const close = event.target.closest('[data-c0-call-close]');
  if (close) {
    event.preventDefault();
    root()?.querySelector('[data-c0-call-modal]')?.remove();
    return;
  }
  if (event.target.matches?.('[data-c0-call-modal]')) event.target.remove();
  scheduleReconcile();
}, true);

document.addEventListener('submit', (event) => {
  const form = event.target.closest('[data-c0-call-form]');
  if (!form) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const ids = [...form.querySelectorAll('input[name="userIds"]:checked')].map((input) => input.value);
  if (!ids.length) { window.alert('Choisissez au moins une personne à appeler.'); return; }
  if (ids.length > MAX_CALL_INVITEES) { window.alert(`Choisissez au maximum ${MAX_CALL_INVITEES} personnes.`); return; }
  window.dispatchEvent(new CustomEvent('2b2c:start-call', { detail:{ userIds:ids, projectId:form.dataset.projectId || null } }));
  root()?.querySelector('[data-c0-call-modal]')?.remove();
}, true);

window.addEventListener('hashchange', (event) => {
  const r = route();
  const pendingAt = Number(sessionStorage.getItem(PENDING_CREATE_KEY) || 0);
  if (r.active && r.conversationId && pendingAt && Date.now() - pendingAt <= CREATE_TTL_MS) {
    event.stopImmediatePropagation();
    sessionStorage.removeItem(PENDING_CREATE_KEY);
    location.reload();
    return;
  }
  if (pendingAt && Date.now() - pendingAt > CREATE_TTL_MS) sessionStorage.removeItem(PENDING_CREATE_KEY);
  scheduleReconcile();
}, true);

window.addEventListener('focus', scheduleReconcile);
document.addEventListener('visibilitychange', () => { if (!document.hidden) scheduleReconcile(); });

injectStyles();
scheduleReconcile();
reconcileTimer = setInterval(() => { if (route().active) reconcile(); }, 1500);
window.addEventListener('beforeunload', () => { if (reconcileTimer) clearInterval(reconcileTimer); }, { once:true });

console.info(`[2b2c] ${VERSION}`);

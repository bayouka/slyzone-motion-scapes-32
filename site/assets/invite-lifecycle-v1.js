import { SupabaseBrowserClient } from './supabase-client.js';

const VERSION = '4b4c invite lifecycle v1.0.0';
const config = window.__4B4C_CONFIG__ || {};
const workspaceKey = config.workspaceStorageKey || '4b4c.live.workspace.v1';
const api = new SupabaseBrowserClient({ url: config.supabaseUrl, publishableKey: config.supabasePublishableKey });
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const wid = () => localStorage.getItem(workspaceKey) || '';
let scheduled = false;

function roleLabel(role) {
  return role === 'admin' ? 'Administrateur' : role === 'guest' ? 'Invité externe' : 'Membre';
}
function effectiveStatus(invite) {
  if (invite.status === 'pending' && invite.expires_at && new Date(invite.expires_at).getTime() <= Date.now()) return 'expired';
  return invite.status;
}
function statusLabel(status) {
  return ({pending:'En attente',accepted:'Acceptée',revoked:'Révoquée',expired:'Expirée'})[status] || status;
}
function statusTone(status) {
  return status === 'accepted' ? 'good' : status === 'pending' ? 'blue' : status === 'expired' ? 'warn' : '';
}
function fmt(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'short',year:'numeric'}).format(d);
}
function inviteUrl(token) {
  const url = new URL(location.origin + location.pathname);
  url.searchParams.set('invite', token);
  return url.toString();
}
function toast(message, error = false) {
  document.querySelector('[data-invite-toast-v1]')?.remove();
  const node = document.createElement('div');
  node.dataset.inviteToastV1 = '1';
  node.className = `toast${error ? ' error' : ''}`;
  node.style.position = 'fixed';
  node.style.right = '20px';
  node.style.bottom = '20px';
  node.style.zIndex = '12000';
  node.textContent = message;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 3200);
}

async function copyText(text, button) {
  try {
    await navigator.clipboard.writeText(text);
    const previous = button.textContent;
    button.textContent = 'Copié';
    setTimeout(() => { if (button.isConnected) button.textContent = previous; }, 1400);
  } catch {
    const input = document.createElement('textarea');
    input.value = text;
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    try { document.execCommand('copy'); toast('Lien copié'); }
    catch { toast('Copie automatique impossible. Réessayez depuis un navigateur autorisant le presse-papiers.', true); }
    input.remove();
  }
}

function rowHtml(invite) {
  const status = effectiveStatus(invite);
  const expires = invite.expires_at ? ` · expire le ${fmt(invite.expires_at)}` : '';
  const pendingActions = status === 'pending'
    ? `<button class="btn small" type="button" data-invite-copy-v1="${esc(invite.token)}">Copier le lien</button><button class="btn small" type="button" data-invite-renew-v1="${esc(invite.id)}">Renouveler</button><button class="btn small danger" type="button" data-invite-revoke-v1="${esc(invite.id)}">Révoquer</button>`
    : status === 'expired' || status === 'revoked'
      ? `<button class="btn small" type="button" data-invite-renew-v1="${esc(invite.id)}">Créer un nouveau lien</button>`
      : '';
  return `<div class="list-row" data-invite-row-v1="${esc(invite.id)}" style="align-items:flex-start">
    <div class="list-main"><strong>${esc(invite.email)}</strong><small>${esc(roleLabel(invite.role))} · ${statusLabel(status)}${esc(expires)}</small>${status === 'pending' ? '<small>Le lien est prêt à être partagé. Aucun email automatique n’est envoyé par 2b2c à ce stade.</small>' : ''}</div>
    <span class="pill ${statusTone(status)}">${esc(statusLabel(status))}</span>
    ${pendingActions ? `<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">${pendingActions}</div>` : ''}
  </div>`;
}

async function load(card) {
  const workspaceId = wid();
  const list = card.querySelector('[data-invite-list-v1]');
  if (!workspaceId || !list || !api.getSession()) return;
  list.innerHTML = '<div class="metric-label">Chargement…</div>';
  try {
    const invites = await api.select('workspace_invites', `select=id,email,role,status,token,expires_at,created_at,accepted_at&workspace_id=eq.${workspaceId}&order=created_at.desc&limit=50`);
    list.innerHTML = invites.length ? `<div class="stack">${invites.map(rowHtml).join('')}</div>` : '<div class="empty" style="padding:18px"><strong>Aucune invitation</strong><span>Utilisez « Inviter une personne » pour créer un accès.</span></div>';
    bindActions(card);
  } catch (error) {
    list.innerHTML = `<div class="notice danger" role="alert">${esc(error?.message || error)}</div>`;
  }
}

function bindActions(card) {
  card.querySelectorAll('[data-invite-copy-v1]').forEach((button) => button.addEventListener('click', () => copyText(inviteUrl(button.dataset.inviteCopyV1), button)));
  card.querySelectorAll('[data-invite-renew-v1]').forEach((button) => button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      const result = await api.rpc('renew_workspace_invite_v1', { p_invite_id: button.dataset.inviteRenewV1 });
      const row = Array.isArray(result) ? result[0] : result;
      if (row?.token) await copyText(inviteUrl(row.token), button);
      toast('Nouveau lien créé. Le délai d’invitation repart pour 14 jours.');
      await load(card);
    } catch (error) {
      toast(error?.message || String(error), true);
      button.disabled = false;
    }
  }));
  card.querySelectorAll('[data-invite-revoke-v1]').forEach((button) => button.addEventListener('click', async () => {
    if (button.dataset.confirm !== '1') {
      button.dataset.confirm = '1';
      button.textContent = 'Confirmer la révocation';
      return;
    }
    button.disabled = true;
    try {
      await api.rpc('revoke_workspace_invite_v1', { p_invite_id: button.dataset.inviteRevokeV1 });
      toast('Invitation révoquée. Son lien ne peut plus être accepté.');
      await load(card);
    } catch (error) {
      toast(error?.message || String(error), true);
      button.disabled = false;
    }
  }));
}

function patch() {
  const h1 = [...document.querySelectorAll('h1')].find((node) => node.textContent.trim() === 'Équipe');
  if (!h1) return;
  const oldList = document.getElementById('invite-list');
  const card = oldList?.closest('.card');
  if (!card || card.dataset.inviteLifecycleV1 === '1') return;
  card.dataset.inviteLifecycleV1 = '1';
  card.innerHTML = `<div class="section-head compact"><div><h2>Invitations</h2><div class="metric-label">Créez, copiez, renouvelez ou révoquez les liens d’accès. Une invitation acceptée devient ensuite un membre de l’espace.</div></div><button class="section-link" type="button" data-invite-refresh-v1>Actualiser</button></div><div data-invite-list-v1><div class="metric-label">Chargement…</div></div>`;
  card.querySelector('[data-invite-refresh-v1]').addEventListener('click', () => load(card));
  load(card);
}
function schedule() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => { scheduled = false; patch(); });
}

const observer = new MutationObserver(schedule);
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('hashchange',schedule);
patch();
console.info(`[2b2c] ${VERSION} active`);

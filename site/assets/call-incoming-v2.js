import { SupabaseBrowserClient } from './supabase-client.js';

if (!window.__4B4C_INCOMING_CALL_V2_OWNER__) {
  window.__4B4C_INCOMING_CALL_V2_OWNER__ = true;

  const config = window.__4B4C_CONFIG__ || {};
  const api = new SupabaseBrowserClient({ url: config.supabaseUrl, publishableKey: config.supabasePublishableKey });
  const POLL_MS = 1400;
  let timer = null;
  let activeCallId = '';
  let suppressUntil = 0;
  let originalTitle = document.title;

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  function ensureStylesheet() {
    if (document.querySelector('link[data-call-incoming-v2]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './assets/call-incoming-v2.css';
    link.dataset.callIncomingV2 = 'true';
    document.head.appendChild(link);
  }

  function root() {
    let node = document.getElementById('incoming-call-v2');
    if (!node) {
      node = document.createElement('div');
      node.id = 'incoming-call-v2';
      node.hidden = true;
      node.setAttribute('aria-live', 'assertive');
      document.body.appendChild(node);
    }
    return node;
  }

  function clearIncoming() {
    const node = document.getElementById('incoming-call-v2');
    if (node) {
      node.hidden = true;
      node.innerHTML = '';
    }
    activeCallId = '';
    if (document.title.startsWith('📞 ')) document.title = originalTitle;
  }

  function renderIncoming(row) {
    if (!row?.call_id) { clearIncoming(); return; }
    const node = root();
    const context = row.project_name || row.workspace_name || 'Appel 2b2c';
    node.innerHTML = `
      <section class="incoming-call-card-v2" role="dialog" aria-modal="false" aria-labelledby="incoming-call-v2-title">
        <div class="incoming-call-icon-v2" aria-hidden="true">▣</div>
        <div class="incoming-call-copy-v2">
          <small>Appel entrant</small>
          <strong id="incoming-call-v2-title">${esc(row.started_by_name || 'Un membre')}</strong>
          <span>${esc(context)}</span>
        </div>
        <div class="incoming-call-actions-v2">
          <button class="btn danger" type="button" data-action="call-decline-v1" data-call="${esc(row.call_id)}">Refuser</button>
          <button class="btn primary" type="button" data-action="call-accept-v1" data-call="${esc(row.call_id)}">Accepter</button>
        </div>
      </section>`;
    node.hidden = false;
    if (activeCallId !== row.call_id) {
      activeCallId = row.call_id;
      originalTitle = document.title.replace(/^📞\s*/, '');
      document.title = `📞 Appel de ${row.started_by_name || '2b2c'} · ${originalTitle}`;
      try { navigator.vibrate?.([180, 100, 180]); } catch {}
    }
  }

  async function pollIncoming() {
    if (Date.now() < suppressUntil) return;
    if (!api.getSession()?.access_token) { clearIncoming(); return; }
    try {
      const rows = await api.rpc('get_pending_call_invite_v2');
      const row = Array.isArray(rows) ? rows[0] || null : rows || null;
      if (row?.call_id) renderIncoming(row);
      else clearIncoming();
    } catch (error) {
      if (/session|jwt|auth|401/i.test(String(error?.message || error))) clearIncoming();
      else console.warn('[2b2c] incoming call probe failed', error);
    }
  }

  function schedule() {
    if (timer) clearInterval(timer);
    timer = setInterval(() => void pollIncoming(), POLL_MS);
  }

  ensureStylesheet();
  root();
  schedule();
  void pollIncoming();

  window.addEventListener('pageshow', () => void pollIncoming());
  window.addEventListener('focus', () => void pollIncoming());
  document.addEventListener('visibilitychange', () => { if (!document.hidden) void pollIncoming(); });

  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('#incoming-call-v2 [data-action="call-accept-v1"], #incoming-call-v2 [data-action="call-decline-v1"]');
    if (!button) return;
    const callId = button.dataset.call || '';
    if (callId && callId === activeCallId) {
      suppressUntil = Date.now() + 2500;
      const node = document.getElementById('incoming-call-v2');
      if (node) node.hidden = true;
      document.getElementById('incoming-call-v1')?.remove();
      if (document.title.startsWith('📞 ')) document.title = originalTitle;
      setTimeout(() => void pollIncoming(), 2600);
    }
  });
}

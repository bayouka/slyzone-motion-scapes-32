import { SupabaseBrowserClient } from './supabase-client.js';

(() => {
  if (window.__4B4C_IDEAS_GOVERNANCE_V1__) return;
  const config = window.__4B4C_CONFIG__ || {};
  const api = new SupabaseBrowserClient({ url: config.supabaseUrl, publishableKey: config.supabasePublishableKey });
  const workspaceKey = config.workspaceStorageKey || '4b4c.live.workspace.v1';
  let seq = 0;

  const ideaIdFromRoute = () => {
    const match = (location.hash || '').match(/^#\/ideas\/([0-9a-f-]{36})(?:\/|$)/i);
    return match?.[1] || null;
  };

  function apply(canManage) {
    document.documentElement.dataset.ideaManager = canManage ? 'true' : 'false';
    const selectors = [
      '[data-idea-action="share"]',
      '[data-idea-action="decide"]',
      '[data-idea-action="convert"]',
      '[data-idea-action="confirm-convert"]'
    ];
    for (const node of document.querySelectorAll(selectors.join(','))) {
      node.hidden = !canManage;
      node.setAttribute('aria-hidden', canManage ? 'false' : 'true');
    }
  }

  async function sync() {
    const token = ++seq;
    const ideaId = ideaIdFromRoute();
    if (!ideaId || !api.getSession()?.access_token) {
      delete document.documentElement.dataset.ideaManager;
      return;
    }
    try {
      const user = await api.getUser();
      const idea = (await api.select('ideas', `select=id,workspace_id,created_by&id=eq.${ideaId}&limit=1`))?.[0];
      if (!idea || token !== seq) return;
      let canManage = idea.created_by === user?.id;
      if (!canManage) {
        const workspaceId = localStorage.getItem(workspaceKey) || idea.workspace_id;
        const membership = (await api.select('workspace_members', `select=role,status&workspace_id=eq.${workspaceId}&user_id=eq.${user.id}&status=eq.active&limit=1`))?.[0];
        canManage = ['owner','admin'].includes(membership?.role);
      }
      if (token !== seq) return;
      apply(Boolean(canManage));
    } catch (error) {
      console.warn('[2b2c ideas] governance UI unavailable', error);
      apply(false);
    }
  }

  document.addEventListener('click', (event) => {
    const action = event.target.closest?.('[data-idea-action]')?.dataset.ideaAction;
    if (!['share','decide','convert','confirm-convert'].includes(action)) return;
    if (document.documentElement.dataset.ideaManager === 'false') {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  new MutationObserver(() => {
    if (ideaIdFromRoute() && document.documentElement.dataset.ideaManager) {
      apply(document.documentElement.dataset.ideaManager === 'true');
    }
  }).observe(document.documentElement, { childList:true, subtree:true });

  window.addEventListener('hashchange', () => setTimeout(() => void sync(), 20));
  setTimeout(() => void sync(), 700);
  window.__4B4C_IDEAS_GOVERNANCE_V1__ = Object.freeze({ version:'1.0.0', refresh:sync });
})();

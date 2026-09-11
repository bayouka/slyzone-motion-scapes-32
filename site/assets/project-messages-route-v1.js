import { SupabaseBrowserClient } from './supabase-client.js';

const config = window.__4B4C_CONFIG__ || {};
const api = new SupabaseBrowserClient({ url: config.supabaseUrl, publishableKey: config.supabasePublishableKey });
const WORKSPACE_KEY = config.workspaceStorageKey || '4b4c.live.workspace.v1';
let redirecting = false;
let pendingTimer = null;

function projectMessagesRoute(hash = location.hash || '') {
  const match = hash.match(/^#\/projects\/([^/?]+)\/messages(?:[/?].*)?$/);
  return match ? { projectId: match[1] } : null;
}

function routingContextReady() {
  return Boolean(localStorage.getItem(WORKSPACE_KEY) && api.getSession()?.access_token);
}

function stopPendingResolution() {
  if (pendingTimer) clearInterval(pendingTimer);
  pendingTimer = null;
}

async function projectConversationId(projectId) {
  const workspaceId = localStorage.getItem(WORKSPACE_KEY);
  if (!workspaceId || !projectId) return '';
  const rows = await api.select(
    'conversations',
    `select=id,project_id,kind,is_general,status,created_at&workspace_id=eq.${workspaceId}&project_id=eq.${projectId}&kind=eq.project&status=neq.archived&order=created_at.asc`,
  );
  const general = rows.find((row) => row.is_general) || rows[0];
  return general?.id || '';
}

async function openProjectMessages(projectId, { replace = false } = {}) {
  if (redirecting || !routingContextReady()) return false;
  redirecting = true;
  try {
    const conversationId = await projectConversationId(projectId);
    const target = conversationId ? `#/messages/${conversationId}` : '#/messages';
    stopPendingResolution();
    if (replace) location.replace(target);
    else location.hash = target.slice(1);
    return true;
  } catch (error) {
    console.error('[2b2c] project messages routing failed', error);
    stopPendingResolution();
    const target = '#/messages';
    if (replace) location.replace(target);
    else location.hash = target.slice(1);
    return false;
  } finally {
    redirecting = false;
  }
}

function resolveCurrentProjectMessagesRoute() {
  const current = projectMessagesRoute();
  if (!current) {
    stopPendingResolution();
    return;
  }
  if (routingContextReady()) {
    stopPendingResolution();
    void openProjectMessages(current.projectId, { replace: true });
    return;
  }
  if (pendingTimer) return;
  pendingTimer = setInterval(() => {
    const pending = projectMessagesRoute();
    if (!pending) {
      stopPendingResolution();
      return;
    }
    if (routingContextReady()) {
      stopPendingResolution();
      void openProjectMessages(pending.projectId, { replace: true });
    }
  }, 250);
}

function interceptProjectMessagesClick(event) {
  const anchor = event.target.closest?.('a[href^="#/projects/"]');
  if (!anchor) return;
  const route = projectMessagesRoute(anchor.getAttribute('href') || '');
  if (!route) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  if (routingContextReady()) void openProjectMessages(route.projectId);
  else resolveCurrentProjectMessagesRoute();
}

document.addEventListener('click', interceptProjectMessagesClick, true);
window.addEventListener('hashchange', resolveCurrentProjectMessagesRoute);
window.addEventListener('pageshow', resolveCurrentProjectMessagesRoute);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) resolveCurrentProjectMessagesRoute();
});

resolveCurrentProjectMessagesRoute();

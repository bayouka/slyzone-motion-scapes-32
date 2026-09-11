import { SupabaseBrowserClient } from './supabase-client.js';

const config = window.__4B4C_CONFIG__ || {};
const api = new SupabaseBrowserClient({ url: config.supabaseUrl, publishableKey: config.supabasePublishableKey });
const WORKSPACE_KEY = config.workspaceStorageKey || '4b4c.live.workspace.v1';
let redirecting = false;

function projectMessagesRoute(hash = location.hash || '') {
  const match = hash.match(/^#\/projects\/([^/?]+)\/messages(?:[/?].*)?$/);
  return match ? { projectId: match[1] } : null;
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
  if (redirecting) return;
  redirecting = true;
  try {
    const conversationId = await projectConversationId(projectId);
    const target = conversationId ? `#/messages/${conversationId}` : '#/messages';
    if (replace) location.replace(target);
    else location.hash = target.slice(1);
  } catch (error) {
    console.error('[2b2c] project messages routing failed', error);
    const target = '#/messages';
    if (replace) location.replace(target);
    else location.hash = target.slice(1);
  } finally {
    redirecting = false;
  }
}

function interceptProjectMessagesClick(event) {
  const anchor = event.target.closest?.('a[href^="#/projects/"]');
  if (!anchor) return;
  const route = projectMessagesRoute(anchor.getAttribute('href') || '');
  if (!route) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  void openProjectMessages(route.projectId);
}

document.addEventListener('click', interceptProjectMessagesClick, true);

window.addEventListener('hashchange', () => {
  const route = projectMessagesRoute();
  if (route) void openProjectMessages(route.projectId, { replace: true });
});

const initial = projectMessagesRoute();
if (initial) void openProjectMessages(initial.projectId, { replace: true });

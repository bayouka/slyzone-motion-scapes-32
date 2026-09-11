import { SupabaseBrowserClient } from './supabase-client.js';

const config = window.__4B4C_CONFIG__ || {};
const api = new SupabaseBrowserClient({ url: config.supabaseUrl, publishableKey: config.supabasePublishableKey });
let focusTimer = null;
let focusAttempts = 0;

const validId = (value) => /^[0-9a-f-]{20,}$/i.test(String(value || ''));

function approvalTargetFromHash(hash = location.hash || '') {
  const match = hash.match(/^#\/projects\/([^/?]+)\/resources(?:\?([^#]*))?$/);
  if (!match) return null;
  const params = new URLSearchParams(match[2] || '');
  const approvalId = params.get('approval') || '';
  return approvalId ? { projectId: match[1], approvalId } : null;
}

function cleanApprovalHash(projectId) {
  history.replaceState({}, '', `${location.pathname}${location.search}#/projects/${projectId}/resources`);
}

function stopFocusTimer() {
  if (focusTimer) clearInterval(focusTimer);
  focusTimer = null;
  focusAttempts = 0;
}

function focusApprovalWhenReady() {
  const target = approvalTargetFromHash();
  if (!target || !validId(target.approvalId)) {
    stopFocusTimer();
    return;
  }
  const tryFocus = () => {
    focusAttempts += 1;
    const button = document.querySelector(`#resources-workspace-v2 [data-rw-action="decide-approval"][data-approval="${target.approvalId}"]`);
    if (button) {
      stopFocusTimer();
      cleanApprovalHash(target.projectId);
      button.click();
      return;
    }
    if (focusAttempts >= 40) {
      stopFocusTimer();
      cleanApprovalHash(target.projectId);
    }
  };
  tryFocus();
  if (!focusTimer && focusAttempts) focusTimer = setInterval(tryFocus, 100);
}

async function routeApproval(approvalId) {
  if (!validId(approvalId)) return;
  try {
    const rows = await api.select('approvals', `select=id,project_id,status,validator_id&id=eq.${approvalId}&limit=1`);
    const approval = Array.isArray(rows) ? rows[0] : null;
    if (!approval?.project_id) throw new Error('Validation inaccessible.');
    location.hash = `#/projects/${approval.project_id}/resources?approval=${approval.id}`;
    setTimeout(focusApprovalWhenReady, 0);
  } catch (error) {
    console.error('[2b2c] approval routing failed', error);
    window.alert('Cette validation n’est plus disponible ou vous n’y avez plus accès.');
  }
}

function interceptLegacyApprovalEntry(event) {
  const target = event.target.closest?.('[data-action="open-approval"],[data-action="approval-decision"]');
  if (!target) return;
  const approvalId = target.dataset.approval || '';
  if (!validId(approvalId)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  void routeApproval(approvalId);
}

document.addEventListener('click', interceptLegacyApprovalEntry, true);
window.addEventListener('hashchange', () => setTimeout(focusApprovalWhenReady, 0));
window.addEventListener('pageshow', () => setTimeout(focusApprovalWhenReady, 0));

setTimeout(focusApprovalWhenReady, 0);

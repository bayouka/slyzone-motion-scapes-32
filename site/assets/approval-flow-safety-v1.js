import { SupabaseBrowserClient } from './supabase-client.js';

const VERSION = '4b4c approval flow safety v1.0.0';
const config = window.__4B4C_CONFIG__ || {};

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));

function setBusy(form, busy) {
  form.querySelectorAll('button,input,select,textarea').forEach((el) => {
    el.disabled = busy;
  });
}

function showError(form, error) {
  let box = form.querySelector('[data-approval-flow-error]');
  if (!box) {
    box = document.createElement('div');
    box.className = 'notice danger';
    box.dataset.approvalFlowError = '1';
    box.setAttribute('role', 'alert');
    form.prepend(box);
  }
  box.innerHTML = `<strong>Validation non envoyée.</strong><br>${esc(error?.message || error)}`;
}

function showSuccess(form) {
  form.innerHTML = `
    <div class="notice" role="status">
      <strong>Validation demandée.</strong><br>
      La demande porte sur cette version précise. Le livrable est maintenant en validation.
    </div>`;
}

document.addEventListener('submit', async (event) => {
  const form = event.target?.closest?.('form[data-form="approval-request"]');
  if (!form) return;

  event.preventDefault();
  event.stopImmediatePropagation();

  const fd = new FormData(form);
  const deliverableId = String(fd.get('deliverableId') || '');
  const versionId = String(fd.get('versionId') || '');
  const validatorId = String(fd.get('validatorId') || '');
  const requestNote = String(fd.get('comment') || '').trim();

  if (!deliverableId || !versionId || !validatorId) {
    showError(form, new Error('Choisissez un validateur pour cette version.'));
    return;
  }

  setBusy(form, true);
  try {
    const api = new SupabaseBrowserClient({
      url: config.supabaseUrl,
      publishableKey: config.supabasePublishableKey,
    });
    if (!api.getSession()) throw new Error('Votre session a expiré. Reconnectez-vous puis réessayez.');

    await api.rpc('request_deliverable_approval_v1', {
      p_deliverable_id: deliverableId,
      p_version_id: versionId,
      p_validator_id: validatorId,
      p_request_note: requestNote,
    });

    showSuccess(form);
    setTimeout(() => location.reload(), 260);
  } catch (error) {
    showError(form, error);
    setBusy(form, false);
  }
}, true);

console.info(`[2b2c] ${VERSION} active`);

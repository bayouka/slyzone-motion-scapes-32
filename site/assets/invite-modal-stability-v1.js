import { SupabaseBrowserClient } from './supabase-client.js';

const VERSION = '2b2c invite modal stability v1.0.0';
const config = window.__4B4C_CONFIG__ || {};
const api = new SupabaseBrowserClient({ url: config.supabaseUrl, publishableKey: config.supabasePublishableKey });
let scheduled = false;

function roleHelp(role) {
  if (role === 'admin') return 'Administrateur : accès à tout l’espace et à tous les projets. Aucun projet n’est à sélectionner.';
  if (role === 'guest') return 'Invité externe : il ne voit que les projets explicitement cochés. Au moins un projet est requis.';
  return 'Membre : les projets Équipe actuels et futurs sont automatiques. Les cases servent surtout à donner immédiatement accès à des projets restreints.';
}

function ensureStyles() {
  if (document.getElementById('invite-modal-stability-v1-styles')) return;
  const style = document.createElement('style');
  style.id = 'invite-modal-stability-v1-styles';
  style.textContent = `
    .invite-stable-help-v1{margin:10px 0 2px}
    .invite-stable-projects-v1{margin-top:4px}
    .invite-stable-projects-v1[hidden]{display:none!important}
    .invite-stable-projects-v1 .eyebrow{display:block;margin-bottom:7px}
    .invite-stable-connection-v1{margin-top:12px}
  `;
  document.head.appendChild(style);
}

function patchInviteDialog(dialog) {
  if (!dialog || dialog.dataset.inviteStableV1 === '1') return;
  const title = (dialog.querySelector('h1,h2,h3')?.textContent || '').trim().toLowerCase();
  if (title !== 'inviter une personne') return;
  const form = dialog.querySelector('form');
  if (!form) return;

  // Critical: mark the dialog before team-access-v1's MutationObserver runs.
  // That older module otherwise rebuilds the same modal asynchronously, which
  // causes a visible second modal state and can confuse browser focus/inert logic.
  dialog.dataset.inviteStableV1 = '1';
  dialog.dataset.teamAccessInvite = '1';
  form.dataset.form = 'team-access-invite-v1';

  const heading = dialog.querySelector('h1,h2,h3');
  if (heading) heading.textContent = 'Inviter une personne';
  const subtitle = heading?.parentElement?.querySelector('p');
  if (subtitle) subtitle.textContent = 'Choisissez son rôle puis les projets à partager explicitement. La personne crée son propre mot de passe.';

  const role = form.elements.role;
  if (!role) return;
  const roleField = role.closest('.field');
  const roleLabel = roleField?.querySelector('label');
  if (roleLabel) roleLabel.textContent = 'Rôle dans l’équipe';
  [...role.options].forEach(option => {
    if (option.value === 'member') option.textContent = 'Membre';
    if (option.value === 'admin') option.textContent = 'Administrateur';
    if (option.value === 'guest') option.textContent = 'Invité externe';
  });

  const accessMode = form.elements.accessMode?.closest('.field');
  if (accessMode) accessMode.hidden = true;

  const grid = form.querySelector('.member-project-grid');
  let projectSection = null;
  if (grid) {
    const columns = [...grid.children];
    projectSection = columns[0] || null;
    const responsibility = columns[1] || null;
    if (responsibility) responsibility.remove();
    if (projectSection) {
      projectSection.classList.add('invite-stable-projects-v1');
      const label = projectSection.querySelector('.eyebrow');
      if (label) label.textContent = 'Projets à partager explicitement';
      projectSection.querySelectorAll('input[name="projectIds"]').forEach(input => {
        input.name = 'teamProjectIds';
      });
    }
  }

  let help = form.querySelector('[data-invite-stable-help-v1]');
  if (!help) {
    help = document.createElement('div');
    help.className = 'notice invite-stable-help-v1';
    help.dataset.inviteStableHelpV1 = '1';
    roleField?.insertAdjacentElement('afterend', help);
  }

  const legacyNotice = [...form.querySelectorAll('.notice')].find(node =>
    node !== help && /Administrateur|Membre|Invité\/client|responsabilit/i.test(node.textContent || '')
  );
  if (legacyNotice) {
    legacyNotice.className = 'notice invite-stable-connection-v1';
    legacyNotice.innerHTML = '<strong>Connexion :</strong> 2b2c crée un lien personnel lié à l’adresse email. Le collaborateur se connecte ou crée son compte et choisit lui-même son mot de passe.';
  }

  const updateRole = () => {
    const value = role.value || 'member';
    help.textContent = roleHelp(value);
    if (projectSection) projectSection.hidden = value === 'admin';
  };
  role.addEventListener('change', updateRole);
  updateRole();
}

function scan() {
  ensureStyles();
  document.querySelectorAll('[role="dialog"],.modal').forEach(patchInviteDialog);
}
function schedule() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => { scheduled = false; scan(); });
}

// Capture the invitation click and perform one synchronous scan immediately
// after the native render. The MutationObserver remains the fallback for other
// entry points (project header, team page, keyboard navigation, etc.).
document.addEventListener('click', (event) => {
  if (!event.target?.closest?.('[data-action="invite-member"]')) return;
  queueMicrotask(scan);
}, true);

const observer = new MutationObserver(schedule);
observer.observe(document.documentElement, { childList:true, subtree:true });
scan();
console.info(`[2b2c] ${VERSION} active`);

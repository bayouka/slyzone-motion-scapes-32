const VERSION = '4b4c ui quality v1.0.0';

let idSequence = 0;
let scheduled = false;
let activeDialog = null;
let restoreFocusTarget = null;
let lastExternalInteraction = null;

function ensureStyles() {
  if (document.getElementById('ui-quality-v1-styles')) return;
  const style = document.createElement('style');
  style.id = 'ui-quality-v1-styles';
  style.textContent = `
    :root{
      --live-muted:#5b6576;
      --live-radius:16px;
      --uiq-gap-1:8px;
      --uiq-gap-2:12px;
      --uiq-gap-3:16px;
      --uiq-gap-4:24px;
    }

    .live-app{font-size:15px}
    .live-content{padding:24px 28px 42px}
    .card{border-radius:16px;padding:16px;box-shadow:none}
    .card.hero,.situation-card,.auth-card,.onboarding-card{box-shadow:0 10px 28px rgba(27,39,65,.06)}
    .card .card{border-radius:13px;box-shadow:none;background:#fcfdff}
    .grid{gap:14px}
    .section-head{margin-bottom:12px}
    .section-head h2{font-size:21px}
    .eyebrow{font-size:12px;line-height:1.25;letter-spacing:.065em}
    .metric-label,.field small,.list-main small,.live-title span{font-size:13px}
    .empty{padding:18px;border-radius:13px}
    .list-row{padding:11px 12px;border-radius:12px;box-shadow:none}
    .list-row.clickable:hover{box-shadow:0 3px 10px rgba(27,39,65,.035)}
    .pill{font-size:12px}
    .btn{border-radius:10px}
    .btn.small{border-radius:9px}
    .field{gap:7px}
    .field label{font-size:13px}
    .field input,.field textarea,.field select{border-radius:10px}
    .modal{border-radius:18px}
    .project-title-line,.project-resume-top>div,.project-meta,.resource-model-head{min-width:0}
    .project-title-line{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    .project-title-line h1,.project-resume-card-v43 h3,.resource-copy-v1,.list-main{min-width:0}
    .project-title-line h1,.project-resume-card-v43 h3,.resource-copy-v1 strong,.resource-copy-v1 small{overflow-wrap:anywhere}
    .sidebar-scroll-area{min-height:0;overflow-y:auto;overscroll-behavior:contain;padding-right:3px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.18) transparent}
    .live-sidebar{overflow:hidden}
    .live-sidebar-foot{flex:none}
    .sidebar-projects a,.mobile-drawer-projects a{min-width:0}
    .sidebar-projects a span:last-child,.mobile-drawer-projects a{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .live-sidebar .sidebar-section-label{font-size:11px;letter-spacing:.075em}
    .live-sidebar a:focus-visible,.mobile-drawer a:focus-visible,.v43-mobile-tabbar a:focus-visible,
    .live-app button:focus-visible,.live-app input:focus-visible,.live-app textarea:focus-visible,.live-app select:focus-visible{
      outline:3px solid rgba(56,103,244,.34);
      outline-offset:2px;
    }
    .modal[role="dialog"]{outline:none}
    .uiq-visually-hidden{
      position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;
      overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important;
    }
    .uiq-field-error{color:#9f2d25;font-size:12px}
    .toast-wrap[aria-live]{pointer-events:none}
    .toast-wrap[aria-live] .toast{pointer-events:auto}

    @media(max-width:1100px){
      .live-content{padding-left:22px;padding-right:22px}
    }

    @media(max-width:767px){
      html,body,.live-app,.live-main,.live-content{max-width:100%;overflow-x:hidden}
      .live-content{padding:16px 13px 88px}
      .section-head{gap:10px;margin-bottom:10px}
      .section-head h2{font-size:19px}
      .card{padding:14px;border-radius:14px}
      .card .card{padding:12px;border-radius:12px}
      .grid,.stack{gap:12px}
      .empty{padding:14px}
      .project-title-row,.project-title-main,.project-head-actions,.page-head-actions-v43,.resource-model-head{min-width:0;max-width:100%}
      .project-title-line{align-items:flex-start}
      .project-title-line h1{font-size:clamp(23px,8vw,31px)}
      .project-head-actions,.page-head-actions-v43,.resource-model-actions{display:flex;flex-wrap:wrap;gap:8px}
      .project-head-actions .btn,.page-head-actions-v43 .btn,.resource-model-actions .btn{flex:1 1 auto}
      .btn,.icon-button,.mobile-drawer a,.mobile-drawer button,.v43-mobile-tabbar a,.v43-mobile-tabbar button,.tabs a,
      .notification-button,.sidebar-user-more{min-height:44px}
      .btn.small{min-height:40px;padding:8px 10px}
      .field input,.field select{min-height:44px}
      .field textarea{min-height:96px}
      .tabs{overscroll-behavior-x:contain;scrollbar-width:none}
      .tabs::-webkit-scrollbar{display:none}
      .mobile-drawer{max-height:100dvh}
      .mobile-drawer-scroll{min-height:0;overflow-y:auto;overscroll-behavior:contain}
      .modal-backdrop{padding:8px;place-items:end center}
      .modal{width:100%;max-height:calc(100dvh - 16px);border-radius:18px 18px 12px 12px;padding:18px;overscroll-behavior:contain}
      .modal-actions{
        position:sticky;bottom:-18px;z-index:2;margin:18px -18px -18px;padding:12px 18px 16px;
        background:linear-gradient(180deg,rgba(255,255,255,.88),#fff 25%);border-top:1px solid rgba(230,234,240,.8);
        display:flex;flex-wrap:wrap
      }
      .modal-actions .btn{flex:1 1 140px;min-height:44px}
      .notification-panel{max-height:calc(100dvh - 78px)}
      .chat{min-height:calc(100dvh - 180px)}
      .message-body{max-width:calc(100vw - 76px);overflow-wrap:anywhere}
      .chat-form{position:sticky;bottom:0;background:var(--live-panel,#fff);padding-bottom:max(8px,env(safe-area-inset-bottom))}
      .chat-form textarea{min-width:0}
      .resource-row-v1,.resource-library-item{max-width:100%}
      .resource-copy-v1 strong,.resource-copy-v1 small{white-space:normal}
      .live-app table{display:block;max-width:100%;overflow-x:auto}
    }

    @media(max-width:390px){
      .live-content{padding-left:10px;padding-right:10px}
      .modal{padding:16px}
      .modal-actions{margin-left:-16px;margin-right:-16px;margin-bottom:-16px;padding-left:16px;padding-right:16px}
      .v43-mobile-tabbar small{font-size:10px}
    }
  `;
  document.head.appendChild(style);
}

function ensureId(element, prefix = 'uiq') {
  if (element.id) return element.id;
  idSequence += 1;
  const id = `${prefix}-${idSequence}`;
  element.id = id;
  return id;
}

function appendDescribedBy(control, id) {
  if (!id) return;
  const ids = new Set(String(control.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
  ids.add(id);
  const next = [...ids].join(' ');
  if (control.getAttribute('aria-describedby') !== next) control.setAttribute('aria-describedby', next);
}

function wireFormFields() {
  document.querySelectorAll('.field').forEach((field) => {
    const controls = [...field.querySelectorAll('input,select,textarea')].filter((control) => control.type !== 'hidden');
    if (!controls.length) return;

    const directLabels = [...field.querySelectorAll('label')];
    controls.forEach((control, index) => {
      const wrapped = control.closest('label');
      let label = wrapped || directLabels[index] || directLabels[0] || null;
      if (label && !wrapped) {
        const id = ensureId(control, '2b2c-field');
        if (label.htmlFor !== id) label.htmlFor = id;
      }

      const hasName = Boolean(
        control.getAttribute('aria-label') ||
        control.getAttribute('aria-labelledby') ||
        wrapped ||
        (control.id && document.querySelector(`label[for="${CSS.escape(control.id)}"]`))
      );
      if (!hasName) {
        const fallback = control.getAttribute('placeholder') || control.getAttribute('name') || control.type;
        if (fallback && control.getAttribute('aria-label') !== fallback) control.setAttribute('aria-label', fallback);
      }

      const help = field.querySelector('small,.field-help,.help-text');
      if (help) appendDescribedBy(control, ensureId(help, '2b2c-help'));

      const error = field.querySelector('.error,.field-error,[data-field-error]');
      if (error) {
        const errorId = ensureId(error, '2b2c-error');
        appendDescribedBy(control, errorId);
        if (control.getAttribute('aria-invalid') !== 'true') control.setAttribute('aria-invalid', 'true');
      } else if (control.getAttribute('aria-invalid') === 'true') {
        control.removeAttribute('aria-invalid');
      }
    });
  });
}

function actionLabel(button) {
  const action = button.dataset?.action || button.dataset?.resourceAction || '';
  const labels = {
    'close-modal':'Fermer la fenêtre',
    'toggle-mobile-menu': document.querySelector('.mobile-drawer') ? 'Fermer le menu' : 'Ouvrir le menu',
    'toggle-user-menu':'Ouvrir le menu du compte',
    'open-search':'Ouvrir la recherche',
    'open-notifications':'Ouvrir les notifications',
    'toggle-notifications':'Ouvrir les notifications',
    'manage-project':'Gérer le projet',
    'edit-project':'Modifier le projet',
    'archive-project':'Archiver le projet',
    'delete-project':'Supprimer le projet',
    'remove-avatar':'Supprimer la photo de profil',
    'signout':'Se déconnecter',
    'delete':'Supprimer la ressource',
    'open':'Ouvrir la ressource',
    'toggle':'Modifier le partage de la ressource'
  };
  return labels[action] || '';
}

function wireButtons() {
  document.querySelectorAll('button').forEach((button) => {
    const text = String(button.textContent || '').replace(/\s+/g, ' ').trim();
    const hasAccessibleName = Boolean(button.getAttribute('aria-label') || button.getAttribute('aria-labelledby') || text);
    if (!hasAccessibleName || /^[×✕•••⋯…]+$/.test(text)) {
      const inferred = actionLabel(button) || button.getAttribute('title') || (
        /^[×✕]+$/.test(text) ? 'Fermer' :
        /^(•••|⋯|…)$/.test(text) ? 'Plus d’options' : ''
      );
      if (inferred && button.getAttribute('aria-label') !== inferred) button.setAttribute('aria-label', inferred);
    }
  });

  document.querySelectorAll('[data-action="toggle-mobile-menu"]').forEach((button) => {
    const expanded = Boolean(document.querySelector('.mobile-drawer'));
    const value = expanded ? 'true' : 'false';
    if (button.getAttribute('aria-expanded') !== value) button.setAttribute('aria-expanded', value);
    if (!button.getAttribute('aria-controls')) button.setAttribute('aria-controls', 'mobile-navigation');
  });

  document.querySelectorAll('nav a.active,.tabs a.active,.v43-mobile-tabbar a.active').forEach((link) => {
    if (link.getAttribute('aria-current') !== 'page') link.setAttribute('aria-current', 'page');
  });
  document.querySelectorAll('nav a:not(.active),.tabs a:not(.active),.v43-mobile-tabbar a:not(.active)').forEach((link) => {
    if (link.hasAttribute('aria-current')) link.removeAttribute('aria-current');
  });
}

function consistentNavigation() {
  const renameHref = (href, from, to) => {
    document.querySelectorAll(`a[href="${href}"]`).forEach((link) => {
      const candidates = [
        link.querySelector('.nav-label'),
        link.querySelector('.mobile-nav-label'),
        link.querySelector('small')
      ].filter(Boolean);
      candidates.forEach((node) => {
        if (node.textContent.trim() === from) node.textContent = to;
      });
      if (!candidates.length && link.children.length === 0 && link.textContent.trim() === from) link.textContent = to;
    });
  };

  renameHref('#/calendar', 'Calendrier', 'Agenda');
  renameHref('#/library', 'Fichiers', 'Bibliothèque');

  document.querySelectorAll('h1,h2').forEach((heading) => {
    const text = heading.textContent.trim();
    if (text === 'Calendrier') heading.textContent = 'Agenda';
    if (text === 'Fichiers') heading.textContent = 'Bibliothèque';
  });

  document.querySelectorAll('.sidebar-section-label').forEach((label) => {
    if (label.textContent.trim() === 'PROJETS ACTIFS') label.textContent = 'PROJETS RÉCENTS';
  });

  document.querySelectorAll('option,.pill,.eyebrow,.member-role-label').forEach((node) => {
    if (node.children.length) return;
    if (node.textContent.trim() === 'Invité / client') node.textContent = 'Invité externe';
  });
}

function normalizeGeneratedCopy() {
  const candidates = document.querySelectorAll(
    '.metric-label,.project-resume-meta span,.progress-copy,.progress-label,.project-meta span,.section-context'
  );
  candidates.forEach((node) => {
    if (node.children.length) return;
    const text = node.textContent.trim();
    let match = text.match(/^(\d+)\/(\d+)\s+phases?\s+terminées?$/i);
    if (match) {
      const done = Number(match[1]);
      const total = Number(match[2]);
      node.textContent = `${done} phase${done > 1 ? 's' : ''} sur ${total} terminée${done > 1 ? 's' : ''}`;
      return;
    }
    match = text.match(/^(\d+)\/(\d+)\s+actions?\s+terminées?$/i);
    if (match) {
      const done = Number(match[1]);
      const total = Number(match[2]);
      node.textContent = `${done} action${done > 1 ? 's' : ''} sur ${total} terminée${done > 1 ? 's' : ''}`;
      return;
    }
    if (/(janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc)\.\.$/i.test(text)) {
      node.textContent = text.replace(/\.\.$/, '.');
    }
  });
}

function wireRegions() {
  const main = document.querySelector('.live-main');
  if (main && !main.id) main.id = 'contenu-principal';

  const toastWrap = document.querySelector('.toast-wrap');
  if (toastWrap) {
    if (toastWrap.getAttribute('role') !== 'status') toastWrap.setAttribute('role', 'status');
    if (toastWrap.getAttribute('aria-live') !== 'polite') toastWrap.setAttribute('aria-live', 'polite');
    if (toastWrap.getAttribute('aria-atomic') !== 'false') toastWrap.setAttribute('aria-atomic', 'false');
  }

  const sidebarFoot = document.querySelector('.live-sidebar-foot');
  if (sidebarFoot && !sidebarFoot.getAttribute('aria-label')) sidebarFoot.setAttribute('aria-label', 'Profil et compte');

  document.querySelectorAll('.mobile-drawer,.notification-panel').forEach((panel) => {
    if (!panel.hasAttribute('tabindex')) panel.setAttribute('tabindex', '-1');
  });
}

function makeDialogAccessible(dialog) {
  if (dialog.getAttribute('role') !== 'dialog') dialog.setAttribute('role', 'dialog');
  if (dialog.getAttribute('aria-modal') !== 'true') dialog.setAttribute('aria-modal', 'true');
  if (!dialog.hasAttribute('tabindex')) dialog.setAttribute('tabindex', '-1');

  const heading = dialog.querySelector('h1,h2,h3');
  if (heading) {
    const headingId = ensureId(heading, '2b2c-dialog-title');
    if (dialog.getAttribute('aria-labelledby') !== headingId) dialog.setAttribute('aria-labelledby', headingId);
  } else if (!dialog.getAttribute('aria-label')) {
    dialog.setAttribute('aria-label', 'Fenêtre');
  }
}

function focusableElements(container) {
  return [...container.querySelectorAll(
    'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
  )].filter((el) => !el.hidden && el.getAttribute('aria-hidden') !== 'true' && el.offsetParent !== null);
}

function handleDialogLifecycle() {
  const dialog = document.querySelector('.modal-backdrop .modal,.resource-modal-v1 .modal,.modal[role="dialog"]');
  if (dialog) makeDialogAccessible(dialog);

  if (!activeDialog && dialog) {
    activeDialog = dialog;
    restoreFocusTarget = lastExternalInteraction && lastExternalInteraction.isConnected
      ? lastExternalInteraction
      : (document.activeElement && document.activeElement !== document.body ? document.activeElement : null);
    queueMicrotask(() => {
      if (!dialog.isConnected) return;
      const target = dialog.querySelector('[autofocus]') || focusableElements(dialog)[0] || dialog;
      if (!dialog.contains(document.activeElement)) target.focus({ preventScroll: true });
    });
    return;
  }

  if (activeDialog && dialog && activeDialog !== dialog) {
    activeDialog = dialog;
    queueMicrotask(() => {
      if (!dialog.isConnected || dialog.contains(document.activeElement)) return;
      const target = dialog.querySelector('[autofocus]') || focusableElements(dialog)[0] || dialog;
      target.focus({ preventScroll: true });
    });
    return;
  }

  if (activeDialog && !dialog) {
    activeDialog = null;
    const target = restoreFocusTarget;
    restoreFocusTarget = null;
    queueMicrotask(() => {
      if (target?.isConnected && typeof target.focus === 'function') target.focus({ preventScroll: true });
    });
  }
}

function polish() {
  scheduled = false;
  ensureStyles();
  document.documentElement.classList.add('ui-quality-v1');
  consistentNavigation();
  normalizeGeneratedCopy();
  wireFormFields();
  wireButtons();
  wireRegions();
  handleDialogLifecycle();
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(polish);
}

document.addEventListener('pointerdown', (event) => {
  if (!document.querySelector('.modal-backdrop .modal,.resource-modal-v1 .modal,.modal[role="dialog"]')) {
    const target = event.target.closest?.('button,a[href],input,select,textarea,[tabindex]');
    if (target) lastExternalInteraction = target;
  }
}, true);

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Tab') return;
  const dialog = document.querySelector('.modal-backdrop .modal,.resource-modal-v1 .modal,.modal[role="dialog"]');
  if (!dialog) return;
  const items = focusableElements(dialog);
  if (!items.length) {
    event.preventDefault();
    dialog.focus();
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}, true);

const observer = new MutationObserver(schedule);
observer.observe(document.documentElement, { childList: true, subtree: true });

window.addEventListener('hashchange', schedule);
window.addEventListener('resize', schedule, { passive: true });

ensureStyles();
schedule();
console.info(VERSION);

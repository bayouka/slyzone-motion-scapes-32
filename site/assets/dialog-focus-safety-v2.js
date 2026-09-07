const VERSION = '4b4c dialog focus safety v2.0.0';
const legacySelector = '.modal-backdrop .modal,.resource-modal-v1 .modal,.modal[role="dialog"]';
let activeDialog = null;
let restoreTarget = null;
let inerted = [];
let lastExternalInteraction = null;
let scheduled = false;

function customDialog() {
  const dialogs = [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')]
    .filter((dialog) => !dialog.matches(legacySelector) && dialog.isConnected);
  return dialogs.at(-1) || null;
}

function focusables(container) {
  return [...container.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
    .filter((el) => !el.hidden && el.getAttribute('aria-hidden') !== 'true' && el.offsetParent !== null);
}

function clearInert() {
  for (const element of inerted) {
    if (element?.isConnected) element.inert = false;
  }
  inerted = [];
}

function inertBackground(dialog) {
  clearInert();
  const shell = dialog.closest('.live-app');
  const container = shell && dialog.parentElement === shell ? shell : document.body;
  const branch = container === document.body ? dialog.closest(':scope > *') : dialog;
  for (const child of [...container.children]) {
    if (child === branch || child.contains(dialog) || child.classList?.contains('mobile-menu-backdrop')) continue;
    if (!child.inert) {
      child.inert = true;
      inerted.push(child);
    }
  }
}

function activate(dialog) {
  if (activeDialog === dialog) return;
  activeDialog = dialog;
  restoreTarget = lastExternalInteraction?.isConnected
    ? lastExternalInteraction
    : (document.activeElement && document.activeElement !== document.body ? document.activeElement : null);
  inertBackground(dialog);
  if (!dialog.hasAttribute('tabindex')) dialog.setAttribute('tabindex','-1');
  queueMicrotask(() => {
    if (!dialog.isConnected) return;
    const target = dialog.querySelector('[autofocus]') || focusables(dialog)[0] || dialog;
    if (!dialog.contains(document.activeElement)) target.focus({ preventScroll:true });
  });
}

function deactivate() {
  if (!activeDialog) return;
  activeDialog = null;
  clearInert();
  const target = restoreTarget;
  restoreTarget = null;
  queueMicrotask(() => {
    if (target?.isConnected && typeof target.focus === 'function') target.focus({ preventScroll:true });
  });
}

function scan() {
  const dialog = customDialog();
  if (dialog) activate(dialog);
  else deactivate();
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => { scheduled = false; scan(); });
}

document.addEventListener('pointerdown', (event) => {
  if (event.target.closest?.('[role="dialog"][aria-modal="true"]')) return;
  lastExternalInteraction = event.target.closest?.('button,a[href],input,select,textarea,[tabindex]') || event.target;
}, true);

document.addEventListener('keydown', (event) => {
  const dialog = activeDialog;
  if (!dialog || event.key !== 'Tab') return;
  const items = focusables(dialog);
  if (!items.length) {
    event.preventDefault();
    dialog.focus({ preventScroll:true });
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  const current = document.activeElement;
  if (event.shiftKey && (!dialog.contains(current) || current === first)) {
    event.preventDefault();
    last.focus({ preventScroll:true });
  } else if (!event.shiftKey && (!dialog.contains(current) || current === last)) {
    event.preventDefault();
    first.focus({ preventScroll:true });
  }
}, true);

const observer = new MutationObserver(schedule);
observer.observe(document.documentElement, { childList:true, subtree:true });
window.addEventListener('hashchange', schedule);
schedule();
console.info(`[2b2c] ${VERSION} active`);

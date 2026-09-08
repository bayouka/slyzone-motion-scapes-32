const root = () => document.getElementById('resources-workspace-v1');
const editing = () => {
  const node = root();
  return Boolean(node && !node.hidden && node.querySelector('.rw-modal-backdrop'));
};

// File pickers and OS dialogs can emit focus/visibility events before the form's
// change event. Prevent route refresh listeners from rebuilding an open form and
// losing the selected File object. This guard is event-driven and observer-free.
window.addEventListener('focus', (event) => {
  if (editing()) event.stopImmediatePropagation();
}, true);

document.addEventListener('visibilitychange', (event) => {
  if (editing()) event.stopImmediatePropagation();
}, true);

console.info('[2b2c] resources form focus guard v1 active — no MutationObserver');

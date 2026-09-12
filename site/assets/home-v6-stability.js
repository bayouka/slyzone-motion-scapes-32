(() => {
  if (window.__4B4C_HOME_V6_STABILITY__) return;
  window.__4B4C_HOME_V6_STABILITY__ = true;

  const HOME_ROUTES = new Set(['', '#', '#/', '#/dashboard']);
  const isHome = () => HOME_ROUTES.has(location.hash || '');
  let fallbackTimer = null;

  function arm() {
    if (!isHome()) {
      document.documentElement.dataset.homeV6Booting = 'false';
      if (fallbackTimer) clearTimeout(fallbackTimer);
      fallbackTimer = null;
      return;
    }
    document.documentElement.dataset.homeV6Booting = 'true';
    if (fallbackTimer) clearTimeout(fallbackTimer);
    fallbackTimer = setTimeout(() => {
      /* Fail visible rather than leave the dashboard hidden if enhancement ever fails. */
      document.documentElement.dataset.homeV6Booting = 'false';
    }, 2400);
  }

  function settleIfReady() {
    if (!isHome()) return;
    if (!document.querySelector('.v43-home-head.home-v6-ready')) return;
    document.documentElement.dataset.homeV6Booting = 'false';
    if (fallbackTimer) clearTimeout(fallbackTimer);
    fallbackTimer = null;
  }

  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      settleIfReady();
    });
  }

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

  window.addEventListener('hashchange', () => { arm(); schedule(); });
  window.addEventListener('pageshow', () => { arm(); schedule(); });
  arm();
  schedule();
})();

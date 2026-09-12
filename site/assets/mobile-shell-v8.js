(() => {
  if (window.__4B4C_MOBILE_SHELL_V8__) return;
  window.__4B4C_MOBILE_SHELL_V8__ = true;

  const mq = window.matchMedia('(max-width: 767px)');

  function enhanceClose() {
    document.querySelectorAll('.mobile-drawer-close').forEach((button) => {
      button.setAttribute('aria-label', 'Fermer le menu');
      button.setAttribute('title', 'Fermer');
      if (!button.dataset.mobileV8Ready) {
        button.dataset.mobileV8Ready = 'true';
        button.textContent = '';
      }
    });
  }

  function enhanceBrand() {
    document.querySelectorAll('.brand-logo-icon img').forEach((img) => {
      img.setAttribute('src', './assets/brand-symbol.svg');
      img.alt = '';
      img.removeAttribute('width');
      img.removeAttribute('height');
    });
  }

  function enhance() {
    enhanceBrand();
    if (!mq.matches) return;
    enhanceClose();
    document.documentElement.classList.add('mobile-shell-v8-ready');
  }

  let raf = 0;
  const schedule = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; enhance(); });
  };

  new MutationObserver(schedule).observe(document.documentElement, { childList:true, subtree:true });
  window.addEventListener('hashchange', schedule);
  window.addEventListener('pageshow', schedule);
  mq.addEventListener?.('change', schedule);
  schedule();
})();

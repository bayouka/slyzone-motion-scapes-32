(() => {
  if (window.__4B4C_MOBILE_SHELL_V7__) return;
  window.__4B4C_MOBILE_SHELL_V7__ = true;

  const mq = window.matchMedia('(max-width: 767px)');

  function routeKey(href = '') {
    const value = String(href);
    if (value.includes('/dashboard')) return 'dashboard';
    if (value.includes('/projects')) return 'projects';
    if (value.includes('/work')) return 'work';
    if (value.includes('/messages')) return 'messages';
    if (value.includes('/calendar')) return 'calendar';
    if (value.includes('/library')) return 'library';
    return value;
  }

  function primarySourceLinks() {
    return [...document.querySelectorAll('.v52-mobile-primary a[href]')];
  }

  function buildPrimaryBlock(drawer) {
    if (!drawer || drawer.querySelector('.mobile-v7-primary')) return;
    const links = primarySourceLinks();
    if (!links.length) return;

    const block = document.createElement('section');
    block.className = 'mobile-v7-primary';
    block.setAttribute('aria-label', 'Navigation principale');
    block.innerHTML = '<span class="mobile-v7-primary-title">NAVIGATION</span><nav class="mobile-v7-primary-nav"></nav>';
    const nav = block.querySelector('nav');

    for (const source of links) {
      const clone = source.cloneNode(true);
      clone.classList.remove('active');
      const sourceLabel = clone.querySelector('small');
      if (sourceLabel) {
        const span = document.createElement('span');
        span.className = 'mobile-nav-label';
        span.textContent = sourceLabel.textContent || '';
        sourceLabel.replaceWith(span);
      }
      const href = clone.getAttribute('href') || '';
      clone.dataset.nav = href;
      clone.dataset.mobileV7Key = routeKey(href);
      nav.appendChild(clone);
    }

    const workspace = drawer.querySelector('.mobile-drawer-workspace');
    const search = drawer.querySelector('.mobile-drawer-search');
    const anchor = search?.nextSibling || workspace?.nextSibling || drawer.querySelector('.mobile-drawer-scroll')?.firstChild;
    const scroll = drawer.querySelector('.mobile-drawer-scroll');
    if (!scroll) return;
    if (anchor) scroll.insertBefore(block, anchor);
    else scroll.appendChild(block);
  }

  function syncPrimaryState(drawer) {
    if (!drawer) return;
    const hash = location.hash || '#/dashboard';
    drawer.querySelectorAll('.mobile-v7-primary-nav a').forEach((link) => {
      const href = link.getAttribute('href') || '';
      const active = href === '#/dashboard'
        ? ['', '#', '#/', '#/dashboard'].includes(hash)
        : hash === href || hash.startsWith(`${href}/`) || hash.startsWith(`${href}?`);
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  function restoreBrand() {
    document.querySelectorAll('.brand-logo-icon img').forEach((img) => {
      if (!/brand-icon\.svg(?:\?|$)/.test(img.getAttribute('src') || '')) img.setAttribute('src', './assets/brand-icon.svg');
      img.removeAttribute('width');
      img.removeAttribute('height');
    });
  }

  function enhance() {
    restoreBrand();
    if (!mq.matches) return;
    const drawer = document.querySelector('.mobile-drawer');
    if (drawer) {
      buildPrimaryBlock(drawer);
      syncPrimaryState(drawer);
      drawer.dataset.mobileV7 = 'true';
    }
    document.documentElement.classList.add('mobile-shell-v7-ready');
  }

  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      enhance();
    });
  }

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('hashchange', schedule);
  window.addEventListener('resize', schedule);
  window.addEventListener('pageshow', schedule);
  mq.addEventListener?.('change', schedule);
  schedule();
})();

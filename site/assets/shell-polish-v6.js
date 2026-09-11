(() => {
  if (window.__4B4C_SHELL_POLISH_V6_OWNER__) return;
  window.__4B4C_SHELL_POLISH_V6_OWNER__ = true;

  const text = (node) => String(node?.textContent || '').replace(/\s+/g, ' ').trim();
  const agendaActive = () => /^#\/calendar(?:\?.*)?$/.test(location.hash || '');

  function setLabel(node, value) {
    if (!node || text(node) === value) return;
    node.textContent = value;
  }

  function rewriteAgendaLabels() {
    document.querySelectorAll('a[href="#/calendar"]').forEach((link) => {
      const navLabel = link.querySelector('.nav-label, .mobile-nav-label, small');
      if (navLabel && /Calendrier/i.test(text(navLabel))) {
        setLabel(navLabel, text(navLabel).replace(/Calendrier/gi, 'Agenda'));
        return;
      }
      if (/^Calendrier\s*→?$/i.test(text(link))) setLabel(link, 'Agenda →');
    });

    if (agendaActive()) {
      const heading = document.querySelector('.live-content .page-head-v3 h1');
      if (heading && /^Calendrier$/i.test(text(heading))) setLabel(heading, 'Agenda');
      document.querySelectorAll('.live-content .empty').forEach((empty) => {
        const span = empty.querySelector('span');
        if (span && /calendrier/i.test(text(span))) span.textContent = text(span).replace(/calendrier/gi, 'agenda');
      });
    }

    document.querySelectorAll('.v43-upcoming-empty span').forEach((span) => {
      if (/calendrier/i.test(text(span))) span.textContent = text(span).replace(/Le calendrier/gi, 'L’agenda').replace(/le calendrier/gi, 'l’agenda');
    });
  }

  function syncDesktopMessageBadge() {
    const mobile = document.querySelector('.v52-mobile-primary a[href="#/messages"] b');
    const desktop = document.querySelector('.live-sidebar .primary-nav a[href="#/messages"]');
    if (!desktop) return;

    const count = text(mobile);
    let badge = desktop.querySelector('.shell-v6-message-count');
    if (!count) {
      badge?.remove();
      return;
    }
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'nav-count shell-v6-message-count';
      desktop.appendChild(badge);
    }
    badge.textContent = count;
    badge.setAttribute('aria-label', `${count} message${count === '1' ? '' : 's'} non lu${count === '1' ? '' : 's'}`);
  }

  function enhance() {
    rewriteAgendaLabels();
    syncDesktopMessageBadge();
    document.documentElement.classList.add('shell-polish-v6-ready');
  }

  function schedule(attempt = 0) {
    requestAnimationFrame(() => {
      enhance();
      if (!document.querySelector('.live-shell') && attempt < 20) setTimeout(() => schedule(attempt + 1), 100);
    });
  }

  window.addEventListener('hashchange', () => schedule());
  window.addEventListener('pageshow', () => schedule());
  window.addEventListener('focus', () => schedule());
  document.addEventListener('visibilitychange', () => { if (!document.hidden) schedule(); });
  setInterval(() => schedule(), 2500);
  schedule();
})();

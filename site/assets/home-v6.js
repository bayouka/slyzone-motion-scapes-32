(() => {
  if (window.__4B4C_HOME_V6_OWNER__) return;
  window.__4B4C_HOME_V6_OWNER__ = true;

  const HOME_ROUTES = new Set(['', '#', '#/', '#/dashboard']);
  let dialog = null;
  let lastFocus = null;

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
  const text = (node) => String(node?.textContent || '').replace(/\s+/g, ' ').trim();
  const homeActive = () => HOME_ROUTES.has(location.hash || '');

  function attentionSnapshot() {
    const row = document.querySelector('.v43-attention-row.primary-row, .v43-attention-row');
    if (!row) return null;
    const meta = text(row.querySelector('small'));
    return {
      title: text(row.querySelector('strong')) || 'Intervention à traiter',
      kind: text(row.querySelector('.attention-kind')) || 'Action',
      meta,
      projectName: meta.split('·')[0]?.trim() || '',
      danger: Boolean(row.querySelector('.danger')),
    };
  }

  function projectSnapshot(projectName = '') {
    const cards = [...document.querySelectorAll('.project-resume-card-v43')];
    const card = cards.find((item) => text(item.querySelector('h3')) === projectName) || cards[0];
    if (!card) return null;
    const pill = card.querySelector('.pill');
    return {
      name: text(card.querySelector('h3')) || projectName || 'Projet',
      href: card.getAttribute('href') || '#/projects',
      health: text(pill),
      reason: String(pill?.getAttribute('title') || '').trim(),
      nextLabel: text(card.querySelector('.project-resume-next > span')),
      nextTitle: text(card.querySelector('.project-resume-next strong')),
      nextWhen: text(card.querySelector('.project-resume-next small')),
    };
  }

  function upcomingSnapshot() {
    const row = document.querySelector('.v43-upcoming-row');
    if (!row) return null;
    return {
      title: text(row.querySelector('strong')),
      when: text(row.querySelector('.v43-time')),
      meta: text(row.querySelector('small')),
    };
  }

  function recentSnapshots() {
    return [...document.querySelectorAll('.v43-catchup-card .catchup-event-v41')].slice(0, 3).map((row) => ({
      label: text(row.querySelector('.change-tag')),
      title: text(row.querySelector('strong')),
      meta: text(row.querySelector('small')),
      href: row.getAttribute('href') || '#/dashboard',
    }));
  }

  function whyText(attention, project) {
    if (!attention) return 'Aucune intervention personnelle n’est actuellement en attente.';
    let base = 'Cet élément est le premier de votre file d’interventions ouvertes.';
    const kind = attention.kind.toLowerCase();
    if (kind.includes('validation')) base = 'Une validation vous est attribuée et reste en attente.';
    else if (kind.includes('demande')) base = 'Une réponse est attendue de votre part.';
    else if (kind.includes('décision') || kind.includes('decision')) base = 'Une décision de votre part est attendue.';
    else if (attention.danger) base = 'Une action qui vous concerne est actuellement bloquée.';
    if (project?.reason) return `${base} ${project.reason}`;
    return base;
  }

  function nextSnapshot(project, upcoming) {
    if (project?.nextTitle) {
      return {
        title: project.nextTitle,
        meta: [project.nextLabel, project.nextWhen].filter(Boolean).join(' · '),
      };
    }
    if (upcoming?.title) return { title: upcoming.title, meta: [upcoming.when, upcoming.meta].filter(Boolean).join(' · ') };
    return { title: 'Aucune prochaine étape urgente identifiée', meta: 'Le projet peut être repris depuis votre portefeuille.' };
  }

  function ensureHeroActions(hero) {
    if (hero.querySelector('.home-v6-hero-actions')) return;
    const actions = document.createElement('div');
    actions.className = 'home-v6-hero-actions';
    actions.innerHTML = `
      <button class="btn primary" type="button" data-home-v6-action="catchup">Mets-moi à jour</button>
      <a class="btn" href="#/projects">Voir mes projets</a>`;
    hero.append(actions);
  }

  function ensureFocusStrip(hero, grid) {
    let strip = document.querySelector('.home-v6-focus-strip');
    if (!strip) {
      strip = document.createElement('section');
      strip.className = 'home-v6-focus-strip';
      strip.setAttribute('aria-label', 'Maintenant, pourquoi, ensuite');
      grid.parentNode.insertBefore(strip, grid);
    }
    const attention = attentionSnapshot();
    const project = projectSnapshot(attention?.projectName);
    const upcoming = upcomingSnapshot();
    const next = nextSnapshot(project, upcoming);
    strip.innerHTML = `
      <article class="home-v6-focus-card is-now">
        <span>Maintenant</span>
        <strong>${esc(attention?.title || 'Vous êtes à jour')}</strong>
        <small>${esc(attention?.meta || 'Rien ne demande votre intervention immédiate.')}</small>
      </article>
      <article class="home-v6-focus-card is-why">
        <span>Pourquoi</span>
        <strong>${esc(attention ? attention.kind : 'Situation calme')}</strong>
        <small>${esc(whyText(attention, project))}</small>
      </article>
      <article class="home-v6-focus-card is-next">
        <span>Ensuite</span>
        <strong>${esc(next.title)}</strong>
        <small>${esc(next.meta)}</small>
      </article>`;
    hero.classList.add('home-v6-ready');
  }

  function closeDialog({ restoreFocus = true } = {}) {
    if (!dialog) return;
    dialog.remove();
    dialog = null;
    document.documentElement.classList.remove('home-v6-dialog-open');
    if (restoreFocus && lastFocus instanceof HTMLElement) lastFocus.focus({ preventScroll: true });
  }

  function dialogRecentMarkup(rows) {
    if (!rows.length) return '<div class="home-v6-empty">Aucun changement important depuis votre dernière visite.</div>';
    return rows.map((row) => `
      <a class="home-v6-change" href="${esc(row.href)}" data-home-v6-action="close-before-route">
        <span>${esc(row.label || 'À savoir')}</span>
        <div><strong>${esc(row.title)}</strong><small>${esc(row.meta)}</small></div>
        <b aria-hidden="true">›</b>
      </a>`).join('');
  }

  function openCatchupDialog(trigger) {
    closeDialog({ restoreFocus: false });
    lastFocus = trigger instanceof HTMLElement ? trigger : document.activeElement;
    const attention = attentionSnapshot();
    const project = projectSnapshot(attention?.projectName);
    const upcoming = upcomingSnapshot();
    const next = nextSnapshot(project, upcoming);
    const recent = recentSnapshots();
    const consequence = project?.reason || (attention
      ? 'Cette intervention est actuellement classée en tête de vos éléments à traiter.'
      : 'Aucun blocage personnel n’est visible sur votre Home.');

    dialog = document.createElement('div');
    dialog.className = 'home-v6-dialog-backdrop';
    dialog.innerHTML = `
      <section class="home-v6-dialog" role="dialog" aria-modal="true" aria-labelledby="home-v6-dialog-title">
        <header>
          <div><span class="eyebrow">Continuité du projet</span><h2 id="home-v6-dialog-title">Mets-moi à jour</h2><p>Résumé construit uniquement à partir des éléments déjà présents dans votre espace.</p></div>
          <button class="home-v6-dialog-close" type="button" data-home-v6-action="close" aria-label="Fermer">×</button>
        </header>
        <div class="home-v6-dialog-body">
          <section class="home-v6-causal-step is-change">
            <span>1 · Ce qui a changé</span>
            <div class="home-v6-change-list">${dialogRecentMarkup(recent)}</div>
          </section>
          <section class="home-v6-causal-step is-decision">
            <span>2 · Ce qui attend votre intervention</span>
            <strong>${esc(attention?.title || 'Aucune intervention en attente')}</strong>
            <small>${esc(attention?.meta || 'Vous êtes à jour sur les éléments personnels visibles.')}</small>
          </section>
          <section class="home-v6-causal-step is-consequence">
            <span>3 · Conséquence</span>
            <strong>${esc(project ? `${project.name} · ${project.health || 'Projet actif'}` : 'Situation de l’espace')}</strong>
            <small>${esc(consequence)}</small>
          </section>
          <section class="home-v6-causal-step is-next">
            <span>4 · Prochaine étape</span>
            <strong>${esc(next.title)}</strong>
            <small>${esc(next.meta)}</small>
          </section>
        </div>
        <footer>
          <button class="btn" type="button" data-home-v6-action="close">Fermer</button>
          ${project ? `<a class="btn" href="${esc(project.href)}" data-home-v6-action="close-before-route">Ouvrir ${esc(project.name)}</a>` : ''}
          ${attention ? '<button class="btn primary" type="button" data-home-v6-action="open-primary">Traiter maintenant</button>' : '<a class="btn primary" href="#/projects" data-home-v6-action="close-before-route">Voir mes projets</a>'}
        </footer>
      </section>`;
    document.body.append(dialog);
    document.documentElement.classList.add('home-v6-dialog-open');
    requestAnimationFrame(() => dialog?.querySelector('.home-v6-dialog-close')?.focus());
  }

  function enhanceHome() {
    if (!homeActive()) return;
    const hero = document.querySelector('.v43-home-head');
    const grid = document.querySelector('.v43-home-grid');
    if (!hero || !grid) return;
    ensureHeroActions(hero);
    ensureFocusStrip(hero, grid);
  }

  function scheduleEnhance(attempt = 0) {
    if (!homeActive()) return;
    requestAnimationFrame(() => {
      enhanceHome();
      if (!document.querySelector('.v43-home-head.home-v6-ready') && attempt < 20) {
        setTimeout(() => scheduleEnhance(attempt + 1), 100);
      }
    });
  }

  function trapDialogFocus(event) {
    if (!dialog || event.key !== 'Tab') return;
    const focusable = [...dialog.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  document.addEventListener('click', (event) => {
    const target = event.target.closest?.('[data-home-v6-action]');
    if (!target) return;
    const action = target.dataset.homeV6Action;
    if (action === 'catchup') {
      event.preventDefault();
      event.stopImmediatePropagation();
      openCatchupDialog(target);
    } else if (action === 'close') {
      event.preventDefault();
      closeDialog();
    } else if (action === 'close-before-route') {
      closeDialog({ restoreFocus: false });
    } else if (action === 'open-primary') {
      event.preventDefault();
      closeDialog({ restoreFocus: false });
      const primary = document.querySelector('.v43-attention-row.primary-row, .v43-attention-row');
      if (primary instanceof HTMLElement) primary.click();
    }
  }, true);

  document.addEventListener('keydown', (event) => {
    if (!dialog) return;
    if (event.key === 'Escape') { event.preventDefault(); closeDialog(); return; }
    trapDialogFocus(event);
  });

  window.addEventListener('hashchange', () => { closeDialog({ restoreFocus: false }); scheduleEnhance(); });
  window.addEventListener('pageshow', () => scheduleEnhance());
  window.addEventListener('focus', () => scheduleEnhance());
  document.addEventListener('visibilitychange', () => { if (!document.hidden) scheduleEnhance(); });

  // Lightweight reconciliation for Home re-renders caused by smart sync. No DOM observer is used.
  setInterval(() => {
    if (homeActive() && !document.querySelector('.v43-home-head.home-v6-ready')) scheduleEnhance();
  }, 2500);

  scheduleEnhance();
})();
(() => {
  if (window.__4B4C_PROJECTS_V6_OWNER__) return;
  window.__4B4C_PROJECTS_V6_OWNER__ = true;

  const text = (node) => String(node?.textContent || '').replace(/\s+/g, ' ').trim();
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  const projectsActive = () => /^#\/projects\/?(?:\?.*)?$/.test(location.hash || '');
  const overviewActive = () => /^#\/projects\/[^/]+\/overview(?:\?.*)?$/.test(location.hash || '');

  function cardSnapshot(card) {
    const pill = card.querySelector('.pill');
    const phase = text(card.querySelector('.project-phase-v42 strong'));
    const personal = card.querySelector('.project-personal');
    const personalLabel = text(personal?.querySelector('span'));
    const personalTitle = text(personal?.querySelector('strong'));
    const target = text(card.querySelector('.project-meta span:last-child'));
    const personalBlocked = Boolean(personal?.classList.contains('blocked'));
    const blockedCount = Number((text(card.querySelector('.blocked-mini')).match(/\d+/) || [0])[0]);
    const hasPersonal = personalTitle && !/aucun élément attendu/i.test(personalTitle);
    return {
      name: text(card.querySelector('h3')) || 'Projet',
      health: text(pill) || 'Projet actif',
      reason: String(pill?.getAttribute('title') || '').trim(),
      phase,
      personalLabel,
      personalTitle,
      target,
      personalBlocked,
      blockedCount,
      blocked: personalBlocked || blockedCount > 0,
      hasPersonal,
    };
  }

  function nextForCard(snapshot) {
    if (snapshot.blocked) {
      return {
        title: snapshot.phase && !/terminé|roadmap à structurer/i.test(snapshot.phase) ? `Reprendre ${snapshot.phase}` : 'Reprendre la trajectoire',
        meta: `Après résolution du blocage${snapshot.target ? ` · ${snapshot.target}` : ''}`,
      };
    }
    if (snapshot.hasPersonal) {
      return {
        title: snapshot.phase && !/terminé|roadmap à structurer/i.test(snapshot.phase) ? `Poursuivre ${snapshot.phase}` : 'Poursuivre le projet',
        meta: `Après votre intervention${snapshot.target ? ` · ${snapshot.target}` : ''}`,
      };
    }
    if (snapshot.phase && !/terminé|roadmap à structurer/i.test(snapshot.phase)) {
      return {
        title: `Faire avancer ${snapshot.phase}`,
        meta: snapshot.target || 'Aucune intervention personnelle prioritaire n’est visible.',
      };
    }
    if (/roadmap à structurer/i.test(snapshot.phase)) {
      return {
        title: 'Structurer la roadmap',
        meta: 'Définir les premières phases rendra la trajectoire exploitable.',
      };
    }
    return {
      title: 'Ouvrir le projet pour confirmer la suite',
      meta: snapshot.target || 'Aucune prochaine intervention personnelle n’est visible sur cette carte.',
    };
  }

  function whyForCard(snapshot) {
    if (snapshot.personalBlocked) return 'L’intervention qui vous est attribuée est explicitement marquée comme bloquée.';
    if (snapshot.blockedCount > 0) return `${snapshot.blockedCount} action${snapshot.blockedCount > 1 ? 's sont' : ' est'} bloquée${snapshot.blockedCount > 1 ? 's' : ''} dans ce projet.`;
    if (snapshot.reason) return snapshot.reason;
    if (snapshot.hasPersonal) return `${snapshot.personalLabel || 'Une intervention'} vous concerne directement.`;
    return 'Aucun blocage ni intervention personnelle prioritaire n’est visible sur cette carte.';
  }

  function enhanceProjectCard(card) {
    if (card.classList.contains('project-v6-card-ready')) return;
    const snapshot = cardSnapshot(card);
    const next = nextForCard(snapshot);
    const flow = document.createElement('div');
    flow.className = 'project-v6-card-flow';
    flow.setAttribute('aria-label', 'Maintenant, pourquoi, ensuite');
    flow.innerHTML = `
      <div class="project-v6-card-step is-now">
        <span>Maintenant</span>
        <strong>${esc(snapshot.hasPersonal ? snapshot.personalTitle : snapshot.phase || 'Situation à préciser')}</strong>
        <small>${esc(snapshot.hasPersonal ? snapshot.personalLabel || 'Pour vous' : 'Phase actuelle')}</small>
      </div>
      <div class="project-v6-card-step is-why">
        <span>Pourquoi</span>
        <strong>${esc(snapshot.personalBlocked ? 'Blocage personnel' : snapshot.blockedCount ? `${snapshot.blockedCount} blocage${snapshot.blockedCount > 1 ? 's' : ''}` : snapshot.health)}</strong>
        <small>${esc(whyForCard(snapshot))}</small>
      </div>
      <div class="project-v6-card-step is-next">
        <span>Ensuite</span>
        <strong>${esc(next.title)}</strong>
        <small>${esc(next.meta)}</small>
      </div>`;

    const personal = card.querySelector('.project-personal');
    const phase = card.querySelector('.project-phase-v42');
    (personal || phase || card.querySelector('.project-title-line'))?.insertAdjacentElement('afterend', flow);
    card.classList.add('project-v6-card-ready');
  }

  function projectCardRank(card) {
    const pill = card.querySelector('.pill');
    if (card.querySelector('.project-personal.blocked')) return 0;
    if (card.querySelector('.blocked-mini')) return 1;
    if (pill?.classList.contains('danger')) return 2;
    const personal = text(card.querySelector('.project-personal strong'));
    if (personal && !/aucun élément attendu/i.test(personal)) return 3;
    if (pill?.classList.contains('warn')) return 4;
    return 5;
  }

  function enhanceProjects() {
    if (!projectsActive()) return;
    const grid = document.querySelector('.project-grid-v3');
    const head = document.querySelector('.page-head-v3');
    if (!grid || !head) return;

    head.classList.add('projects-v6-head-ready');
    const cards = [...grid.querySelectorAll('.project-card-v3')];
    cards.forEach(enhanceProjectCard);
    cards
      .map((card, index) => ({ card, index, rank: projectCardRank(card) }))
      .sort((a, b) => a.rank - b.rank || a.index - b.index)
      .forEach(({ card }) => grid.append(card));
    grid.classList.add('projects-v6-ready');
  }

  function overviewSnapshot() {
    const room = document.querySelector('.project-room-layout');
    const head = document.querySelector('.project-head-v3');
    const now = room?.querySelector('.now-card');
    const next = room?.querySelector('.next-card');
    const situation = room?.querySelector('.situation-card');
    if (!room || !head || !now || !next || !situation) return null;

    const healthPill = head.querySelector('.project-title-line .pill');
    const whyTitle = text(situation.querySelector('h2')) || text(healthPill) || 'Situation du projet';
    const whyBody = text(situation.querySelector('.situation-copy')) || String(healthPill?.getAttribute('title') || '').trim();
    const healthReason = String(healthPill?.getAttribute('title') || '').trim();
    const nowActions = now.querySelector('.context-actions');

    return {
      room,
      head,
      now,
      next,
      situation,
      nowTitle: text(now.querySelector('.context-title')) || 'Aucune action prioritaire',
      nowMeta: text(now.querySelector('.context-sub')) || 'Le projet ne nécessite rien de vous pour le moment.',
      nowStatus: text(now.querySelector('.pill')) || 'À jour',
      nowActions: nowActions?.innerHTML || '',
      whyTitle,
      whyBody: [healthReason, whyBody].filter(Boolean).filter((value, index, list) => list.indexOf(value) === index).join(' '),
      nextTitle: text(next.querySelector('.context-title')) || 'Définir la prochaine étape',
      nextMeta: text(next.querySelector('.context-sub')) || 'La roadmap déterminera la suite.',
    };
  }

  function enhanceOverview() {
    if (!overviewActive()) return;
    const snapshot = overviewSnapshot();
    if (!snapshot || snapshot.room.classList.contains('project-v6-overview-ready')) return;

    const focus = document.createElement('section');
    focus.className = 'project-v6-focus-strip';
    focus.setAttribute('aria-label', 'Lecture prioritaire du projet');
    focus.innerHTML = `
      <article class="project-v6-focus-card is-now">
        <span>Maintenant</span>
        <div class="project-v6-focus-title"><strong>${esc(snapshot.nowTitle)}</strong><small>${esc(snapshot.nowStatus)}</small></div>
        <p>${esc(snapshot.nowMeta)}</p>
        ${snapshot.nowActions ? `<div class="project-v6-focus-actions">${snapshot.nowActions}</div>` : ''}
      </article>
      <article class="project-v6-focus-card is-why">
        <span>Pourquoi</span>
        <strong>${esc(snapshot.whyTitle)}</strong>
        <p>${esc(snapshot.whyBody || 'La situation est fondée sur les jalons, actions, blocages et validations visibles.')}</p>
      </article>
      <article class="project-v6-focus-card is-next">
        <span>Ensuite</span>
        <strong>${esc(snapshot.nextTitle)}</strong>
        <p>${esc(snapshot.nextMeta)}</p>
      </article>`;

    snapshot.room.parentNode.insertBefore(focus, snapshot.room);
    snapshot.room.classList.add('project-v6-overview-ready');
    snapshot.head.classList.add('project-v6-head-ready');
    snapshot.situation.classList.add('project-v6-trajectory-card');
    const eyebrow = snapshot.situation.querySelector('.eyebrow');
    if (eyebrow) eyebrow.textContent = 'Trajectoire';
  }

  function enhanceCurrentRoute() {
    if (projectsActive()) enhanceProjects();
    else if (overviewActive()) enhanceOverview();
  }

  function readyForRoute() {
    if (projectsActive()) return Boolean(document.querySelector('.project-grid-v3.projects-v6-ready, .empty'));
    if (overviewActive()) return Boolean(document.querySelector('.project-room-layout.project-v6-overview-ready'));
    return true;
  }

  function scheduleEnhance(attempt = 0) {
    if (!projectsActive() && !overviewActive()) return;
    requestAnimationFrame(() => {
      enhanceCurrentRoute();
      if (!readyForRoute() && attempt < 20) setTimeout(() => scheduleEnhance(attempt + 1), 100);
    });
  }

  window.addEventListener('hashchange', () => scheduleEnhance());
  window.addEventListener('pageshow', () => scheduleEnhance());
  window.addEventListener('focus', () => scheduleEnhance());
  document.addEventListener('visibilitychange', () => { if (!document.hidden) scheduleEnhance(); });

  setInterval(() => {
    if ((projectsActive() || overviewActive()) && !readyForRoute()) scheduleEnhance();
  }, 2500);

  scheduleEnhance();
})();
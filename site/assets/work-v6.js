(() => {
  if (window.__4B4C_WORK_V6_PRESENTATION_OWNER__) return;
  window.__4B4C_WORK_V6_PRESENTATION_OWNER__ = true;

  const text = (node) => String(node?.textContent || '').replace(/\s+/g, ' ').trim();
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[char]));
  const route = () => {
    const match = (location.hash || '').match(/^#\/projects\/([^/]+)\/work\/(list|roadmap|board|calendar)(?:\?.*)?$/);
    return match ? { projectId: match[1], view: match[2] } : null;
  };

  function decorateTabs() {
    const tabs = document.querySelector('.work-view-tabs');
    if (!tabs || tabs.classList.contains('work-v6-tabs-ready')) return;
    const links = [...tabs.querySelectorAll('a')];
    links.forEach((link) => {
      const href = link.getAttribute('href') || '';
      if (/\/work\/(list|roadmap)$/.test(href)) link.classList.add('work-v6-primary-view');
      else link.classList.add('work-v6-secondary-view');
    });
    const label = document.createElement('span');
    label.className = 'work-v6-secondary-label';
    label.textContent = 'Vues secondaires';
    const firstSecondary = links.find((link) => link.classList.contains('work-v6-secondary-view'));
    if (firstSecondary) tabs.insertBefore(label, firstSecondary);
    tabs.classList.add('work-v6-tabs-ready');
  }

  function blockedReason(row) {
    const meta = text(row?.querySelector('.list-main small'));
    const match = meta.match(/Blocage\s*:\s*(.+)$/i);
    return match ? match[1].trim() : '';
  }

  function actionSnapshot(row) {
    if (!row) return null;
    return {
      title: text(row.querySelector('.list-main strong')) || 'Action',
      status: text(row.querySelector('.pill')) || 'À faire',
      meta: text(row.querySelector('.list-main small')),
      priority: text(row.querySelector('.priority-mark')),
      blocked: row.classList.contains('blocked') || Boolean(blockedReason(row)),
      blockedReason: blockedReason(row),
    };
  }

  function firstAction() {
    const rows = [...document.querySelectorAll('.action-row-v4')];
    const blocked = rows.find((row) => row.classList.contains('blocked') || blockedReason(row));
    return blocked || rows.find((row) => !/terminé|annulé/i.test(text(row.querySelector('.pill')))) || rows[0] || null;
  }

  function nextAction(current) {
    const rows = [...document.querySelectorAll('.action-row-v4')];
    const index = rows.indexOf(current);
    return rows.slice(index + 1).find((row) => !/terminé|annulé/i.test(text(row.querySelector('.pill')))) || null;
  }

  function workWhy(snapshot) {
    if (!snapshot) return 'Aucune action ouverte n’est visible dans cette vue.';
    if (snapshot.blockedReason) return `Cause réelle du blocage : ${snapshot.blockedReason}`;
    if (snapshot.blocked) return 'Cette action est marquée comme bloquée dans le workflow actuel.';
    return [snapshot.status, snapshot.priority ? `priorité ${snapshot.priority.toLowerCase()}` : ''].filter(Boolean).join(' · ') || 'Cette action est la première intervention visible dans la vue active.';
  }

  function enhanceActionRows() {
    document.querySelectorAll('.action-row-v4').forEach((row) => {
      if (row.classList.contains('work-v6-action-ready')) return;
      const reason = blockedReason(row);
      if (reason) {
        const note = document.createElement('span');
        note.className = 'work-v6-block-reason';
        note.innerHTML = `<b>Cause du blocage</b><span>${esc(reason)}</span>`;
        row.append(note);
      }
      row.classList.add('work-v6-action-ready');
    });
  }

  function ensureWorkFocus() {
    const currentRoute = route();
    if (!currentRoute || currentRoute.view === 'roadmap') return;
    const toolbar = document.querySelector('.work-toolbar');
    if (!toolbar || document.querySelector('.work-v6-focus-strip')) return;
    const row = firstAction();
    const now = actionSnapshot(row);
    const next = actionSnapshot(nextAction(row));
    const strip = document.createElement('section');
    strip.className = 'work-v6-focus-strip';
    strip.setAttribute('aria-label', 'Priorité du travail');
    strip.innerHTML = `
      <article class="work-v6-focus-card is-now"><span>Maintenant</span><strong>${esc(now?.title || 'Aucune action prioritaire')}</strong><small>${esc(now?.meta || 'Le projet ne présente pas de travail ouvert dans cette vue.')}</small></article>
      <article class="work-v6-focus-card is-why"><span>Pourquoi</span><strong>${esc(now?.blocked ? 'La progression est empêchée' : now?.status || 'Situation du travail')}</strong><small>${esc(workWhy(now))}</small></article>
      <article class="work-v6-focus-card is-next"><span>Ensuite</span><strong>${esc(next?.title || 'Revenir à la trajectoire')}</strong><small>${esc(next?.meta || 'La Roadmap indique la prochaine étape du projet.')}</small></article>`;
    toolbar.insertAdjacentElement('afterend', strip);
  }

  function roadmapPhaseSnapshot(phase) {
    if (!phase) return null;
    const title = text(phase.querySelector('.roadmap-title-line h3')) || 'Phase';
    const status = text(phase.querySelector('.roadmap-title-line .pill')) || 'À faire';
    const meta = text(phase.querySelector('.roadmap-meta'));
    const blockedRow = [...phase.querySelectorAll('.action-row-v4')].find((row) => row.classList.contains('blocked') || blockedReason(row));
    const blocked = actionSnapshot(blockedRow);
    return { title, status, meta, blocked };
  }

  function ensureRoadmapFocus() {
    const currentRoute = route();
    if (!currentRoute || currentRoute.view !== 'roadmap') return;
    const toolbar = document.querySelector('.roadmap-toolbar');
    const roadmap = document.querySelector('.roadmap');
    if (!toolbar || !roadmap || document.querySelector('.roadmap-v6-focus-strip')) return;
    const phases = [...roadmap.querySelectorAll('.roadmap-phase')];
    const active = phases.find((phase) => /en cours|active/i.test(text(phase.querySelector('.roadmap-title-line .pill')))) || phases.find((phase) => !/terminé/i.test(text(phase.querySelector('.roadmap-title-line .pill')))) || phases[0];
    const activeIndex = phases.indexOf(active);
    const nextPhase = phases.slice(activeIndex + 1).find((phase) => !/terminé/i.test(text(phase.querySelector('.roadmap-title-line .pill'))));
    const now = roadmapPhaseSnapshot(active);
    const next = roadmapPhaseSnapshot(nextPhase);
    const why = now?.blocked?.blockedReason
      ? `Cause réelle : ${now.blocked.blockedReason}`
      : now?.blocked
        ? `Une action de « ${now.title} » est bloquée.`
        : `Cette phase est la première étape non terminée de la trajectoire visible.`;

    const strip = document.createElement('section');
    strip.className = 'roadmap-v6-focus-strip';
    strip.setAttribute('aria-label', 'Trajectoire du projet');
    strip.innerHTML = `
      <article class="roadmap-v6-focus-card is-now"><span>Maintenant</span><strong>${esc(now?.title || 'Roadmap à structurer')}</strong><small>${esc(now?.meta || 'Définissez la phase active et son résultat attendu.')}</small></article>
      <article class="roadmap-v6-focus-card is-why"><span>Pourquoi</span><strong>${esc(now?.blocked ? 'Un blocage conditionne la suite' : now?.status || 'Phase actuelle')}</strong><small>${esc(why)}</small></article>
      <article class="roadmap-v6-focus-card is-next"><span>Ensuite</span><strong>${esc(next?.title || 'Clôturer ou définir la prochaine phase')}</strong><small>${esc(next?.meta || 'Aucune phase suivante non terminée n’est visible.')}</small></article>`;
    toolbar.insertAdjacentElement('afterend', strip);
    roadmap.classList.add('roadmap-v6-trajectory');
  }

  function addSecondaryViewNotice() {
    const currentRoute = route();
    if (!currentRoute || !['board','calendar'].includes(currentRoute.view)) return;
    if (document.querySelector('.work-v6-secondary-notice')) return;
    const tabs = document.querySelector('.work-view-tabs');
    if (!tabs) return;
    const notice = document.createElement('div');
    notice.className = 'work-v6-secondary-notice';
    notice.innerHTML = `<div><span class="eyebrow">Vue secondaire</span><strong>${currentRoute.view === 'board' ? 'Tableau' : 'Calendrier'} conserve les mêmes actions.</strong><p>Utilisez <b>Liste</b> pour exécuter et <b>Roadmap</b> pour comprendre la trajectoire.</p></div><div><a class="btn" href="#/projects/${esc(currentRoute.projectId)}/work/list">Liste</a><a class="btn" href="#/projects/${esc(currentRoute.projectId)}/work/roadmap">Roadmap</a></div>`;
    tabs.insertAdjacentElement('afterend', notice);
  }

  function enhance() {
    if (!route()) return;
    const toolbar = document.querySelector('.work-toolbar');
    if (!toolbar) return;
    toolbar.classList.add('work-v6-toolbar-ready');
    const copy = toolbar.querySelector('p');
    const currentRoute = route();
    if (copy) copy.textContent = currentRoute.view === 'roadmap'
      ? 'Comprendre le chemin : phases, résultat attendu, responsables, dates et blocages.'
      : 'Exécuter : voyez d’abord ce qui doit avancer, pourquoi, puis ce qui vient ensuite.';
    decorateTabs();
    enhanceActionRows();
    ensureWorkFocus();
    ensureRoadmapFocus();
    addSecondaryViewNotice();
  }

  function ready() {
    const currentRoute = route();
    if (!currentRoute) return true;
    if (currentRoute.view === 'roadmap') return Boolean(document.querySelector('.roadmap-v6-focus-strip')) || Boolean(document.querySelector('.roadmap .empty'));
    return Boolean(document.querySelector('.work-v6-focus-strip')) || Boolean(document.querySelector('.work-v6-secondary-notice')) || Boolean(document.querySelector('.empty'));
  }

  function schedule(attempt = 0) {
    if (!route()) return;
    requestAnimationFrame(() => {
      enhance();
      if (!ready() && attempt < 20) setTimeout(() => schedule(attempt + 1), 100);
    });
  }

  window.addEventListener('hashchange', () => schedule());
  window.addEventListener('pageshow', () => schedule());
  window.addEventListener('focus', () => schedule());
  document.addEventListener('visibilitychange', () => { if (!document.hidden) schedule(); });
  setInterval(() => { if (route() && !ready()) schedule(); }, 2500);
  schedule();
})();
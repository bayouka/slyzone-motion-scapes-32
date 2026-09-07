// 4b4c V4.3.1 — Home UX contract polish
(() => {
  const app = document.getElementById('app');
  if (!app) return;

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      enhanceHome();
    });
  };

  const initials = (name) => String(name || '?')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase() || '?';

  const isDuePart = (text) => /^(aujourd|demain|lun\.|mar\.|mer\.|jeu\.|ven\.|sam\.|dim\.|\d{1,2}[\s/.-])/i.test(text);

  function personChip(label) {
    const match = String(label || '').match(/^(demandé par|créé par|assigné par)\s+(.+)$/i);
    if (!match) return null;
    const chip = document.createElement('span');
    chip.className = 'home-person-chip';
    chip.dataset.personName = match[2].trim();
    const avatar = document.createElement('span');
    avatar.className = 'home-person-avatar';
    avatar.textContent = initials(match[2]);
    avatar.setAttribute('aria-hidden', 'true');
    const text = document.createElement('span');
    text.textContent = `${match[1]} ${match[2]}`;
    chip.append(avatar, text);
    return chip;
  }

  function refineAttentionHead(grid) {
    const card = grid.querySelector('.v43-attention-card');
    if (!card) return;
    const eyebrow = card.querySelector('.section-head .eyebrow');
    const heading = card.querySelector('.section-head h2');
    if (!eyebrow || !heading || heading.dataset.homeRefined === '1') return;
    const summary = heading.textContent.trim();
    eyebrow.textContent = 'Priorité personnelle';
    heading.textContent = 'À traiter maintenant';
    heading.dataset.homeRefined = '1';
    const badge = document.createElement('span');
    badge.className = 'home-attention-summary';
    badge.textContent = summary;
    heading.insertAdjacentElement('afterend', badge);
  }

  function refineAttentionRows(grid) {
    grid.querySelectorAll('.v43-attention-row').forEach(row => {
      if (row.dataset.homeRefined === '1') return;
      const meta = row.querySelector('small');
      if (!meta) return;
      const parts = meta.textContent.split(' · ').map(part => part.trim()).filter(Boolean);
      const project = parts.shift() || 'Espace';
      const due = parts.find(isDuePart) || '';
      const personLabel = parts.find(part => /^(demandé par|créé par|assigné par)\s+/i.test(part)) || '';
      const context = parts.filter(part => part !== due && part !== personLabel && part.toLowerCase() !== 'à faire par vous');

      meta.textContent = '';
      meta.classList.add('home-attention-meta');

      const projectNode = document.createElement('span');
      projectNode.className = 'home-meta-project';
      projectNode.textContent = project;
      meta.append(projectNode);

      const chip = personChip(personLabel);
      if (chip) meta.append(chip);

      context.forEach(text => {
        const node = document.createElement('span');
        node.className = 'home-meta-context';
        node.textContent = text;
        meta.append(node);
      });

      if (due) {
        const dueNode = document.createElement('span');
        dueNode.className = 'home-meta-due';
        dueNode.textContent = due;
        meta.append(dueNode);
      }
      row.dataset.homeRefined = '1';
    });
  }

  function refineCatchup(grid) {
    const card = grid.querySelector('.v43-catchup-card');
    if (!card) return;
    const eyebrow = card.querySelector('.section-head .eyebrow');
    const heading = card.querySelector('.section-head h2');
    if (eyebrow && heading && heading.dataset.homeRefined !== '1') {
      const status = heading.textContent.trim();
      eyebrow.textContent = 'Contexte utile';
      heading.textContent = 'Depuis votre dernière visite';
      heading.dataset.homeRefined = '1';
      const statusNode = document.createElement('span');
      statusNode.className = 'home-catchup-summary';
      statusNode.textContent = status;
      heading.insertAdjacentElement('afterend', statusNode);
    }
    if (card.querySelector('.v43-catchup-list') && !card.querySelector('[data-action="open-activity"]')) {
      const head = card.querySelector('.section-head');
      if (head) {
        const button = document.createElement('button');
        button.className = 'section-link as-button home-activity-link';
        button.dataset.action = 'open-activity';
        button.textContent = 'Voir toute l’activité →';
        head.append(button);
      }
    }
  }

  function refineNextMeeting(grid) {
    const row = grid.querySelector('.v43-upcoming-row.meeting.next');
    if (!row || row.closest('.home-next-meeting-wrap')) return;
    const meetingId = row.dataset.meeting;
    if (!meetingId) return;
    const wrap = document.createElement('div');
    wrap.className = 'home-next-meeting-wrap';
    row.parentNode.insertBefore(wrap, row);
    wrap.append(row);
    const action = document.createElement('button');
    action.className = 'home-meeting-prepare';
    action.dataset.action = 'open-meeting';
    action.dataset.meeting = meetingId;
    action.type = 'button';
    action.textContent = 'Préparer';
    action.setAttribute('aria-label', `Préparer ${row.querySelector('strong')?.textContent?.trim() || 'la prochaine réunion'}`);
    wrap.append(action);
  }

  function collectProjectPeople(grid) {
    const map = new Map();
    const ensure = (project) => {
      if (!map.has(project)) map.set(project, []);
      return map.get(project);
    };

    grid.querySelectorAll('.v43-upcoming-row.meeting').forEach(row => {
      const project = (row.querySelector('small')?.textContent || '').split(' · ')[0].trim();
      if (!project) return;
      row.querySelectorAll('.v43-attendees .avatar').forEach((avatar, index) => {
        const clone = avatar.cloneNode(true);
        clone.classList.add('home-project-avatar');
        clone.setAttribute('aria-hidden', 'true');
        ensure(project).push({ key: `meeting-${index}-${clone.textContent}-${clone.innerHTML}`, node: clone });
      });
    });

    grid.querySelectorAll('.v43-attention-row').forEach(row => {
      const project = row.querySelector('.home-meta-project')?.textContent?.trim();
      const chip = row.querySelector('.home-person-chip');
      const name = chip?.dataset.personName?.trim();
      if (!project || !name) return;
      const node = document.createElement('span');
      node.className = 'home-project-avatar home-project-avatar-initial';
      node.textContent = initials(name);
      node.title = name;
      node.setAttribute('aria-label', name);
      ensure(project).push({ key: `person-${name.toLowerCase()}`, node });
    });
    return map;
  }

  function refineProjectCards(grid) {
    const people = collectProjectPeople(grid);
    grid.querySelectorAll('.project-resume-card-v43').forEach(card => {
      if (card.dataset.homeRefined === '1') return;
      const name = card.querySelector('h3')?.textContent?.trim();
      const entries = people.get(name) || [];
      const unique = [];
      const seen = new Set();
      for (const entry of entries) {
        if (seen.has(entry.key)) continue;
        seen.add(entry.key);
        unique.push(entry.node);
        if (unique.length === 4) break;
      }
      if (card.querySelector('.v435-project-people')) {
        card.dataset.homeRefined = '1';
        return;
      }
      if (unique.length) {
        const row = document.createElement('div');
        row.className = 'home-project-people';
        const label = document.createElement('span');
        label.className = 'home-project-people-label';
        label.textContent = 'Personnes concernées';
        const stack = document.createElement('span');
        stack.className = 'home-project-avatar-stack';
        unique.forEach(node => stack.append(node));
        row.append(label, stack);
        const meta = card.querySelector('.project-resume-meta');
        if (meta) card.insertBefore(row, meta);
        else card.append(row);
      }
      card.dataset.homeRefined = '1';
    });
  }

  function enhanceHome() {
    const grid = app.querySelector('.v43-home-grid');
    if (!grid || grid.dataset.homeUxContract === 'v43.1') return;
    grid.dataset.homeUxContract = 'v43.1';
    const content = grid.closest('.live-content');
    if (content) content.classList.add('home-ux-contract-v431');
    const head = grid.previousElementSibling;
    if (head?.classList?.contains('v43-home-head')) head.classList.add('home-ux-contract-head-v431');

    refineAttentionHead(grid);
    refineAttentionRows(grid);
    refineCatchup(grid);
    refineNextMeeting(grid);
    refineProjectCards(grid);
  }

  const observer = new MutationObserver(schedule);
  observer.observe(app, { childList: true, subtree: true });
  schedule();
})();

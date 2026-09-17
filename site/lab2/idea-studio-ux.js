(() => {
  'use strict';

  const MAX_INTERESTS = 4;
  const INTEREST_LABELS = Object.freeze({
    parcours: 'Parcours / fonctionnement',
    fonctions: 'Fonctionnalités / outils',
    simple: 'Simplicité / clarté',
    design: 'Design / ambiance',
    nav: 'Navigation / organisation',
    contenu: 'Contenu / ton',
    cta: 'Conversion / appels à l’action',
    autre: 'Autre'
  });
  const LEGACY_MAP = Object.freeze({
    fonctionnement: 'parcours',
    fonctionnalites: 'fonctions',
    simplicite: 'simple',
    organisation: 'nav',
    design: 'design',
    autre: 'autre'
  });

  const referencesList = document.getElementById('referencesList');
  const referenceEmptyState = document.getElementById('referenceEmptyState');
  const understandingError = document.getElementById('understandingError');
  const understandingLoading = document.getElementById('understandingLoading');
  const aiState = document.getElementById('aiState');
  const resetDraftButton = document.getElementById('resetDraft');
  const noReferenceButton = document.getElementById('noReference');

  const parseInterests = (value) => {
    const raw = String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
    const mapped = raw.map((item) => LEGACY_MAP[item] || item).filter((item) => INTEREST_LABELS[item]);
    return [...new Set(mapped)].slice(0, MAX_INTERESTS);
  };

  const updateEmptyState = () => {
    if (!referenceEmptyState || !referencesList) return;
    referenceEmptyState.hidden = referencesList.querySelector('.reference-card') !== null;
  };

  const syncInterestButtons = (row) => {
    if (!row || row.dataset.multiInterestReady === 'true') return;
    const hidden = row.querySelector('.reference-reason');
    const buttons = [...row.querySelectorAll('.reference-interest')];
    if (!hidden || !buttons.length) return;

    // The legacy script used "fonctionnement" as a default for every empty row.
    // An untouched empty reference must start with no implicit choice.
    const url = row.querySelector('.reference-url');
    const note = row.querySelector('.reference-note');
    if (!String(url?.value || '').trim() && !String(note?.value || '').trim() && hidden.value === 'fonctionnement') {
      hidden.value = '';
    }

    let selected = new Set(parseInterests(hidden.value));
    const paint = () => {
      buttons.forEach((button) => {
        const active = selected.has(button.dataset.interest);
        button.classList.toggle('is-selected', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      hidden.value = [...selected].join(',');
    };

    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const code = button.dataset.interest;
        if (!code) return;
        if (selected.has(code)) {
          selected.delete(code);
        } else if (selected.size < MAX_INTERESTS) {
          selected.add(code);
        } else {
          row.querySelector('.reference-interest-help')?.classList.add('is-warning');
          window.setTimeout(() => row.querySelector('.reference-interest-help')?.classList.remove('is-warning'), 1200);
          return;
        }
        paint();
        hidden.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });

    row.dataset.multiInterestReady = 'true';
    paint();
  };

  const cleanImplicitEmptyReference = () => {
    if (!referencesList) return;
    const rows = [...referencesList.querySelectorAll('.reference-card')];
    if (rows.length !== 1) return;
    const row = rows[0];
    const url = String(row.querySelector('.reference-url')?.value || '').trim();
    const note = String(row.querySelector('.reference-note')?.value || '').trim();
    if (!url && !note) row.remove();
    updateEmptyState();
  };

  if (referencesList) {
    [...referencesList.querySelectorAll('.reference-card')].forEach(syncInterestButtons);
    cleanImplicitEmptyReference();
    new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1 && node.matches?.('.reference-card')) syncInterestButtons(node);
          node.querySelectorAll?.('.reference-card').forEach(syncInterestButtons);
        }
      }
      updateEmptyState();
    }).observe(referencesList, { childList: true, subtree: true });
  }

  noReferenceButton?.addEventListener('click', () => window.setTimeout(updateEmptyState, 0));
  resetDraftButton?.addEventListener('click', () => window.setTimeout(cleanImplicitEmptyReference, 0));

  // Capture the Lab error code without changing the validated Slice 2 engine.
  const nativeFetch = window.fetch.bind(window);
  let lastUnderstandingError = '';
  window.fetch = async (...args) => {
    const response = await nativeFetch(...args);
    try {
      const target = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
      if (String(target).includes('/api/lab2/understand') && !response.ok) {
        const payload = await response.clone().json().catch(() => ({}));
        lastUnderstandingError = String(payload?.error || '');
      }
    } catch {}
    return response;
  };

  const friendlyError = (code) => ({
    LAB_ACCESS_UNCONFIGURED: "L’IA est prête, mais aucun compte de test n’est encore autorisé. Depuis l’écran d’accès, copie ton identifiant technique puis ajoute-le au secret GitHub LAB2_ALLOWED_USER_IDS.",
    LAB_ACCESS_DENIED: "Ton compte est bien connecté, mais il n’est pas encore autorisé pour les appels IA du Lab. Copie ton identifiant technique depuis l’écran d’accès et ajoute-le à LAB2_ALLOWED_USER_IDS.",
    UNAUTHORIZED: "Ta session de test a expiré. Reconnecte-toi depuis l’écran d’accès au Lab, puis réessaie.",
    AI_UNAVAILABLE: "Le moteur IA n’est pas disponible sur cette preview pour le moment.",
    AI_CAPACITY: "Le quota ou la capacité IA du moment est atteint. Aucun nouvel appel automatique ne sera tenté.",
    AI_OUTPUT_INVALID: "L’IA a répondu dans un format inattendu. Ton idée n’a pas été modifiée."
  }[code] || '');

  const normalizeErrorState = () => {
    if (!understandingError || understandingError.hidden) return;
    if (understandingLoading) understandingLoading.hidden = true;
    const message = friendlyError(lastUnderstandingError);
    if (message) understandingError.textContent = message;
    if (aiState) {
      aiState.textContent = ['LAB_ACCESS_UNCONFIGURED', 'LAB_ACCESS_DENIED'].includes(lastUnderstandingError)
        ? 'Accès à configurer'
        : 'À réessayer';
      aiState.dataset.state = 'error';
    }
  };

  if (understandingError) {
    new MutationObserver(normalizeErrorState).observe(understandingError, {
      attributes: true,
      attributeFilter: ['hidden'],
      childList: true,
      characterData: true,
      subtree: true
    });
  }

  updateEmptyState();
})();

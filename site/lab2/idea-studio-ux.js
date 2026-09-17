(() => {
  'use strict';

  const MAX_INTERESTS = 4;
  const UNDERSTANDING_TIMEOUT_MS = 30000;
  const AI_CACHE_KEY = '4b4c2.lab2.idea-understanding.slice2.v1';
  const CONFIRMATION_KEY = '4b4c2.lab2.idea-understanding-confirmed.slice2.v1';
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
  const referenceSummary = document.getElementById('referenceSummary');
  const referenceEmptyState = document.getElementById('referenceEmptyState');
  const understandingError = document.getElementById('understandingError');
  const understandingLoading = document.getElementById('understandingLoading');
  const aiState = document.getElementById('aiState');
  const resetDraftButton = document.getElementById('resetDraft');
  const noReferenceButton = document.getElementById('noReference');
  const confirmUnderstanding = document.getElementById('confirmUnderstanding');

  const parseJson = (value) => {
    try { return JSON.parse(value); }
    catch { return null; }
  };

  const meaningfulCore = (value) => {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized.length < 8) return false;
    return !['non déterminé', 'non determine', 'à préciser', 'a preciser', 'inconnu', 'non précisé', 'non precise'].includes(normalized);
  };

  // An older cached response could contain empty core fields while still being marked successful.
  // Never reuse such a response: the backend now forces a clarification instead.
  const cachedUnderstanding = parseJson(localStorage.getItem(AI_CACHE_KEY));
  const cachedCore = cachedUnderstanding?.response?.understanding;
  if (cachedCore && (!meaningfulCore(cachedCore.one_liner) || !meaningfulCore(cachedCore.problem))) {
    localStorage.removeItem(AI_CACHE_KEY);
    localStorage.removeItem(CONFIRMATION_KEY);
  }

  const parseInterests = (value) => {
    const raw = String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
    const mapped = raw.map((item) => LEGACY_MAP[item] || item).filter((item) => INTEREST_LABELS[item]);
    return [...new Set(mapped)].slice(0, MAX_INTERESTS);
  };

  const updateEmptyState = () => {
    if (!referenceEmptyState || !referencesList) return;
    referenceEmptyState.hidden = referencesList.querySelector('.reference-card') !== null;
  };

  const repaintReferenceSummary = () => {
    if (!referenceSummary || !referencesList) return;
    const rows = [...referencesList.querySelectorAll('.reference-card')];
    const items = [...referenceSummary.querySelectorAll('.reference-summary-item')];
    items.forEach((item, index) => {
      const row = rows[index];
      if (!row) return;
      const detail = item.querySelector('span');
      if (!detail) return;
      const interests = parseInterests(row.querySelector('.reference-reason')?.value).map((code) => INTEREST_LABELS[code]);
      const note = String(row.querySelector('.reference-note')?.value || '').trim();
      const parts = [];
      if (interests.length) parts.push(interests.join(' · '));
      if (note) parts.push(note);
      const nextText = parts.join(' — ') || 'Référence ajoutée sans précision particulière';
      if (detail.textContent !== nextText) detail.textContent = nextText;
    });
  };

  const syncInterestButtons = (row) => {
    if (!row || row.dataset.multiInterestReady === 'true') return;
    const hidden = row.querySelector('.reference-reason');
    const buttons = [...row.querySelectorAll('.reference-interest')];
    if (!hidden || !buttons.length) return;

    const url = row.querySelector('.reference-url');
    const note = row.querySelector('.reference-note');
    if (!String(url?.value || '').trim() && !String(note?.value || '').trim() && hidden.value === 'fonctionnement') {
      hidden.value = '';
    }

    const selected = new Set(parseInterests(hidden.value));
    const paint = () => {
      buttons.forEach((button) => {
        const active = selected.has(button.dataset.interest);
        button.classList.toggle('is-selected', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      hidden.value = [...selected].join(',');
      repaintReferenceSummary();
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

  if (referenceSummary) {
    new MutationObserver(repaintReferenceSummary).observe(referenceSummary, { childList: true, subtree: true });
  }

  noReferenceButton?.addEventListener('click', () => window.setTimeout(updateEmptyState, 0));
  resetDraftButton?.addEventListener('click', () => {
    localStorage.removeItem(CONFIRMATION_KEY);
    window.setTimeout(cleanImplicitEmptyReference, 0);
  });

  confirmUnderstanding?.addEventListener('click', () => {
    const cache = parseJson(localStorage.getItem(AI_CACHE_KEY));
    const understanding = cache?.response?.understanding;
    const coreReady = meaningfulCore(understanding?.one_liner) && meaningfulCore(understanding?.problem);
    if (!cache?.baseFingerprint || !coreReady || understanding?.needs_clarification) {
      localStorage.removeItem(CONFIRMATION_KEY);
      return;
    }
    localStorage.setItem(CONFIRMATION_KEY, JSON.stringify({
      version: 1,
      confirmed: true,
      baseFingerprint: cache.baseFingerprint,
      confirmedAt: new Date().toISOString()
    }));
  });

  const friendlyError = (code) => ({
    LAB_ACCESS_UNCONFIGURED: "L’IA est prête, mais aucun compte de test n’est encore autorisé. Reviens à l’écran d’accès, copie ton identifiant technique puis ajoute-le à l’autorisation privée du Lab.",
    LAB_ACCESS_DENIED: "Ton compte est bien connecté, mais il n’est pas encore autorisé pour les appels IA du Lab. Reviens à l’écran d’accès pour copier ton identifiant technique.",
    UNAUTHORIZED: "Ta session de test a expiré. Reconnecte-toi depuis l’écran d’accès au Lab, puis réessaie.",
    AI_UNAVAILABLE: "Le moteur IA n’est pas disponible sur cette preview pour le moment.",
    AI_CAPACITY: "Le quota ou la capacité IA du moment est atteint. Aucun nouvel appel automatique ne sera tenté.",
    AI_OUTPUT_INVALID: "L’IA a répondu dans un format inattendu. Ton idée n’a pas été modifiée.",
    AI_TIMEOUT: "L’analyse IA a pris trop de temps et a été arrêtée proprement. Ton brouillon est intact ; tu peux réessayer."
  }[code] || '');

  const applyFriendlyError = (code) => {
    if (!code || !understandingError) return;
    const message = friendlyError(code);
    if (!message) return;
    if (understandingLoading) understandingLoading.hidden = true;
    if (understandingError.textContent !== message) understandingError.textContent = message;
    understandingError.hidden = false;
    if (aiState) {
      const nextLabel = ['LAB_ACCESS_UNCONFIGURED', 'LAB_ACCESS_DENIED'].includes(code)
        ? 'Compte à autoriser'
        : 'À réessayer';
      if (aiState.textContent !== nextLabel) aiState.textContent = nextLabel;
      aiState.dataset.state = 'error';
    }
  };

  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const target = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
    const isUnderstanding = String(target).includes('/api/lab2/understand');
    if (!isUnderstanding) return nativeFetch(...args);

    const controller = new AbortController();
    const existingInit = args[1] || {};
    const timer = window.setTimeout(() => controller.abort('LAB2_UNDERSTANDING_TIMEOUT'), UNDERSTANDING_TIMEOUT_MS);

    try {
      const response = await nativeFetch(args[0], { ...existingInit, signal: controller.signal });
      if (!response.ok) {
        const payload = await response.clone().json().catch(() => ({}));
        const code = String(payload?.error || '');
        if (code) window.setTimeout(() => applyFriendlyError(code), 0);
      }
      return response;
    } catch (error) {
      if (controller.signal.aborted || error?.name === 'AbortError') {
        window.setTimeout(() => applyFriendlyError('AI_TIMEOUT'), 0);
      }
      throw error;
    } finally {
      window.clearTimeout(timer);
    }
  };

  updateEmptyState();
})();
(() => {
  'use strict';

  const STORAGE_KEY = '4b4c2.lab2.idea-studio.slice1.v1';
  const AI_CACHE_KEY = '4b4c2.lab2.idea-understanding.slice2.v1';
  const AUTH_SESSION_KEY = '4b4c.supabase.session.v2';
  const MAX_REFERENCES = 3;
  const MIN_DESCRIPTION_LENGTH = 40;
  const MAX_CLARIFICATIONS = 2;

  const shell = document.querySelector('.studio-shell');
  const form = document.getElementById('ideaForm');
  const capturePanel = document.getElementById('capturePanel');
  const understandingPanel = document.getElementById('understandingPanel');
  const ideaName = document.getElementById('ideaName');
  const ideaDescription = document.getElementById('ideaDescription');
  const descriptionCount = document.getElementById('descriptionCount');
  const referencesList = document.getElementById('referencesList');
  const referenceTemplate = document.getElementById('referenceTemplate');
  const addReferenceButton = document.getElementById('addReference');
  const noReferenceButton = document.getElementById('noReference');
  const resetDraftButton = document.getElementById('resetDraft');
  const validationMessage = document.getElementById('validationMessage');
  const saveState = document.getElementById('saveState');
  const summaryName = document.getElementById('summaryName');
  const summaryDescription = document.getElementById('summaryDescription');
  const referenceSummary = document.getElementById('referenceSummary');
  const referenceSummaryCard = document.getElementById('referenceSummaryCard');
  const backToCapture = document.getElementById('backToCapture');
  const confirmUnderstanding = document.getElementById('confirmUnderstanding');
  const futurePreview = document.getElementById('futurePreview');
  const understandingProgressButton = document.querySelector('[data-go="understanding"]');
  const understandingLoading = document.getElementById('understandingLoading');
  const understandingError = document.getElementById('understandingError');
  const aiUnderstandingResult = document.getElementById('aiUnderstandingResult');
  const aiState = document.getElementById('aiState');
  const aiOneLiner = document.getElementById('aiOneLiner');
  const aiProblem = document.getElementById('aiProblem');
  const aiTargetUsers = document.getElementById('aiTargetUsers');
  const aiMainFlow = document.getElementById('aiMainFlow');
  const aiExplicitPoints = document.getElementById('aiExplicitPoints');
  const aiUncertainties = document.getElementById('aiUncertainties');
  const confidenceBadge = document.getElementById('confidenceBadge');
  const usageMetrics = document.getElementById('usageMetrics');
  const usageHelp = document.getElementById('usageHelp');
  const clarificationBox = document.getElementById('clarificationBox');
  const clarificationQuestion = document.getElementById('clarificationQuestion');
  const clarificationAnswer = document.getElementById('clarificationAnswer');
  const submitClarification = document.getElementById('submitClarification');
  const skipClarification = document.getElementById('skipClarification');

  let saveTimer = null;
  let currentBaseFingerprint = '';
  let clarificationHistory = [];
  let usageLog = [];
  let lastResponse = null;

  const safeJsonParse = (value) => {
    try { return JSON.parse(value); }
    catch { return null; }
  };

  const normalizeText = (value) => String(value || '').trim();
  const getReferenceRows = () => [...referencesList.querySelectorAll('.reference-card')];

  const readReferences = () => getReferenceRows()
    .map((row) => ({
      url: normalizeText(row.querySelector('.reference-url')?.value),
      reason: normalizeText(row.querySelector('.reference-reason')?.value),
      note: normalizeText(row.querySelector('.reference-note')?.value)
    }))
    .filter((reference) => reference.url || reference.note);

  const readDraft = () => ({
    version: 1,
    name: normalizeText(ideaName.value),
    description: normalizeText(ideaDescription.value),
    references: readReferences(),
    updatedAt: new Date().toISOString()
  });

  const stableDraftPayload = (draft) => ({
    name: draft.name,
    description: draft.description,
    references: draft.references.map((reference) => ({
      url: reference.url,
      reason: reference.reason,
      note: reference.note
    }))
  });

  const fingerprint = async (value) => {
    const bytes = new TextEncoder().encode(JSON.stringify(value));
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  };

  const getAccessToken = () => {
    const session = safeJsonParse(localStorage.getItem(AUTH_SESSION_KEY));
    return normalizeText(session?.access_token);
  };

  const updateDescriptionCount = () => {
    const count = ideaDescription.value.length;
    descriptionCount.textContent = `${count} caractère${count > 1 ? 's' : ''}`;
  };

  const updateReferenceNumbers = () => {
    const rows = getReferenceRows();
    rows.forEach((row, index) => {
      const number = row.querySelector('.reference-number');
      if (number) number.textContent = String(index + 1);
    });
    addReferenceButton.disabled = rows.length >= MAX_REFERENCES;
    addReferenceButton.textContent = rows.length >= MAX_REFERENCES ? '3 références maximum' : '+ Ajouter une référence';
  };

  const createReferenceRow = (reference = {}) => {
    if (getReferenceRows().length >= MAX_REFERENCES) return;
    const fragment = referenceTemplate.content.cloneNode(true);
    const row = fragment.querySelector('.reference-card');
    const url = row.querySelector('.reference-url');
    const reason = row.querySelector('.reference-reason');
    const note = row.querySelector('.reference-note');
    const remove = row.querySelector('.remove-reference');

    url.value = reference.url || '';
    reason.value = reference.reason || 'fonctionnement';
    note.value = reference.note || '';

    row.addEventListener('input', scheduleSave);
    row.addEventListener('change', scheduleSave);
    remove.addEventListener('click', () => {
      row.remove();
      updateReferenceNumbers();
      scheduleSave();
    });

    referencesList.appendChild(fragment);
    updateReferenceNumbers();
  };

  const setSaveLabel = (label) => { saveState.textContent = label; };

  const saveDraft = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(readDraft()));
      setSaveLabel('Brouillon enregistré localement');
    } catch {
      setSaveLabel('Sauvegarde locale indisponible');
    }
  };

  function scheduleSave() {
    setSaveLabel('Enregistrement…');
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(saveDraft, 300);
  }

  const restoreDraft = () => {
    const saved = safeJsonParse(localStorage.getItem(STORAGE_KEY));
    if (!saved || saved.version !== 1) {
      createReferenceRow();
      return;
    }
    ideaName.value = saved.name || '';
    ideaDescription.value = saved.description || '';
    const references = Array.isArray(saved.references) ? saved.references.slice(0, MAX_REFERENCES) : [];
    if (references.length) references.forEach(createReferenceRow);
    else createReferenceRow();
    updateDescriptionCount();
    setSaveLabel('Brouillon local restauré');
  };

  const reasonLabel = (reason) => ({
    fonctionnement: 'Fonctionnement',
    fonctionnalites: 'Fonctionnalités',
    simplicite: 'Simplicité',
    design: 'Design',
    organisation: 'Organisation',
    autre: 'Autre'
  }[reason] || 'Référence');

  const renderReferenceSummary = (references) => {
    referenceSummary.innerHTML = '';
    if (!references.length) {
      referenceSummaryCard.hidden = true;
      return;
    }
    referenceSummaryCard.hidden = false;
    references.forEach((reference) => {
      const item = document.createElement('div');
      item.className = 'reference-summary-item';
      const title = document.createElement('strong');
      const detail = document.createElement('span');
      title.textContent = reference.url || 'Référence sans URL';
      detail.textContent = reference.note ? `${reasonLabel(reference.reason)} · ${reference.note}` : reasonLabel(reference.reason);
      item.append(title, detail);
      referenceSummary.appendChild(item);
    });
  };

  const goToStep = (step) => {
    const isUnderstanding = step === 'understanding';
    capturePanel.hidden = isUnderstanding;
    understandingPanel.hidden = !isUnderstanding;
    shell.dataset.step = step;
    document.querySelectorAll('.progress-step').forEach((node) => node.classList.remove('is-active'));
    const target = document.querySelector(`[data-go="${step}"]`);
    if (target) target.classList.add('is-active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const validateDraft = (draft) => {
    if (!draft.name) return 'Donne au moins un nom provisoire à ton idée.';
    if (draft.description.length < MIN_DESCRIPTION_LENGTH) return `Explique un peu plus ton idée (${MIN_DESCRIPTION_LENGTH} caractères minimum pour ce prototype).`;
    return '';
  };

  const setAiState = (label, state = '') => {
    aiState.textContent = label;
    aiState.dataset.state = state;
  };

  const renderBasisItem = (container, label, basis) => {
    const item = document.createElement('div');
    item.className = 'evidence-item';
    const text = document.createElement('span');
    const badge = document.createElement('em');
    text.textContent = label;
    badge.textContent = basis === 'EXPLICIT' ? 'Dit par toi' : 'Déduit · à confirmer';
    badge.className = basis === 'EXPLICIT' ? 'basis-badge explicit' : 'basis-badge inferred';
    item.append(text, badge);
    container.appendChild(item);
  };

  const renderList = (container, items, emptyLabel) => {
    container.innerHTML = '';
    const values = Array.isArray(items) ? items.filter(Boolean) : [];
    if (!values.length) {
      const item = document.createElement('li');
      item.className = 'empty-list-item';
      item.textContent = emptyLabel;
      container.appendChild(item);
      return;
    }
    values.forEach((value) => {
      const item = document.createElement('li');
      item.textContent = value;
      container.appendChild(item);
    });
  };

  const confidenceLabel = (confidence) => ({
    HIGH: 'Compréhension bonne',
    MEDIUM: 'Compréhension partielle',
    LOW: 'À préciser'
  }[confidence] || 'À vérifier');

  const renderUsage = () => {
    usageMetrics.innerHTML = '';
    const measured = usageLog.filter(Boolean);
    if (!measured.length) {
      usageMetrics.textContent = 'Détail de consommation non renvoyé par le fournisseur pour cet appel.';
      usageHelp.textContent = 'Aucune estimation n’est inventée côté navigateur.';
      return;
    }
    const totals = measured.reduce((acc, usage) => ({
      prompt: acc.prompt + Number(usage.prompt_tokens || 0),
      completion: acc.completion + Number(usage.completion_tokens || 0),
      neurons: acc.neurons + Number(usage.estimated_neurons || 0),
      share: acc.share + Number(usage.estimated_free_daily_share_percent || 0),
      usd: acc.usd + Number(usage.paid_equivalent_usd || 0)
    }), { prompt: 0, completion: 0, neurons: 0, share: 0, usd: 0 });

    const metrics = [
      ['Entrée', `${Math.round(totals.prompt)} tokens`],
      ['Sortie', `${Math.round(totals.completion)} tokens`],
      ['Crédit estimé', `${totals.neurons.toFixed(2)} neurons`],
      ['Part du gratuit/jour', `${totals.share.toFixed(3)} %`]
    ];
    metrics.forEach(([label, value]) => {
      const item = document.createElement('div');
      const strong = document.createElement('strong');
      const span = document.createElement('span');
      strong.textContent = value;
      span.textContent = label;
      item.append(strong, span);
      usageMetrics.appendChild(item);
    });
    usageHelp.textContent = `Équivalent tarifaire indicatif si la gratuité était dépassée : $${totals.usd.toFixed(5)}. Le quota gratuit Cloudflare est journalier, pas mensuel.`;
  };

  const saveAiCache = () => {
    if (!currentBaseFingerprint || !lastResponse) return;
    try {
      localStorage.setItem(AI_CACHE_KEY, JSON.stringify({
        version: 1,
        baseFingerprint: currentBaseFingerprint,
        clarifications: clarificationHistory,
        response: lastResponse,
        usageLog,
        savedAt: new Date().toISOString()
      }));
    } catch {}
  };

  const loadAiCache = (baseFingerprint) => {
    const cached = safeJsonParse(localStorage.getItem(AI_CACHE_KEY));
    if (!cached || cached.version !== 1 || cached.baseFingerprint !== baseFingerprint || !cached.response?.understanding) return false;
    clarificationHistory = Array.isArray(cached.clarifications) ? cached.clarifications.slice(0, MAX_CLARIFICATIONS) : [];
    usageLog = Array.isArray(cached.usageLog) ? cached.usageLog : [];
    lastResponse = cached.response;
    return true;
  };

  const renderUnderstanding = (response) => {
    const understanding = response?.understanding;
    if (!understanding) return;
    aiOneLiner.textContent = understanding.one_liner || 'Non déterminé';
    aiProblem.textContent = understanding.problem || 'Non déterminé';
    confidenceBadge.textContent = confidenceLabel(understanding.confidence);
    confidenceBadge.dataset.confidence = understanding.confidence || 'LOW';

    aiTargetUsers.innerHTML = '';
    const users = Array.isArray(understanding.target_users) ? understanding.target_users : [];
    if (!users.length) renderBasisItem(aiTargetUsers, 'Public non encore identifié', 'INFERRED');
    else users.forEach((item) => renderBasisItem(aiTargetUsers, item.label, item.basis));

    aiMainFlow.innerHTML = '';
    const flow = Array.isArray(understanding.main_flow) ? understanding.main_flow : [];
    if (!flow.length) {
      const item = document.createElement('li');
      item.textContent = 'Le fonctionnement reste à préciser.';
      aiMainFlow.appendChild(item);
    } else {
      flow.forEach((entry) => {
        const item = document.createElement('li');
        const text = document.createElement('span');
        const badge = document.createElement('em');
        text.textContent = entry.step;
        badge.textContent = entry.basis === 'EXPLICIT' ? 'Dit par toi' : 'Déduit';
        badge.className = entry.basis === 'EXPLICIT' ? 'basis-badge explicit' : 'basis-badge inferred';
        item.append(text, badge);
        aiMainFlow.appendChild(item);
      });
    }

    renderList(aiExplicitPoints, understanding.explicit_points, 'Aucun point suffisamment explicite supplémentaire.');
    renderList(aiUncertainties, understanding.uncertainties, 'Aucune incertitude importante détectée.');
    renderUsage();

    clarificationBox.hidden = !understanding.needs_clarification;
    if (understanding.needs_clarification) {
      clarificationQuestion.textContent = understanding.clarifying_question || '';
      clarificationAnswer.value = '';
      confirmUnderstanding.disabled = true;
    } else {
      clarificationQuestion.textContent = '';
      confirmUnderstanding.disabled = false;
    }

    aiUnderstandingResult.hidden = false;
    understandingError.hidden = true;
    setAiState('Compréhension prête', 'ready');
  };

  const errorMessage = (code, status) => {
    if (code === 'LAB_DISABLED') return "L'IA du laboratoire est volontairement désactivée sur cet environnement. Aucun crédit n'a été consommé.";
    if (code === 'UNAUTHORIZED') return "Ta session 4b4c n'est pas disponible ou a expiré. Connecte-toi d'abord à 4b4c dans ce navigateur, puis réessaie.";
    if (code === 'AI_UNAVAILABLE') return "Le binding Workers AI n'est pas disponible sur cet environnement.";
    if (code === 'AI_CAPACITY') return "Workers AI a atteint une limite de capacité ou de quota. Aucun nouvel appel automatique ne sera tenté.";
    if (code === 'AI_OUTPUT_INVALID') return "Le modèle n'a pas respecté le format attendu. L'idée n'a pas été modifiée.";
    if (status >= 500) return "L'analyse IA a rencontré une erreur technique. Ton brouillon local est intact.";
    return "Impossible d'analyser l'idée pour le moment. Ton brouillon local est intact.";
  };

  const callUnderstandingApi = async (draft) => {
    const token = getAccessToken();
    if (!token) throw Object.assign(new Error('UNAUTHORIZED'), { code: 'UNAUTHORIZED', status: 401 });
    const response = await fetch('/api/lab2/understand', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name: draft.name,
        description: draft.description,
        references: draft.references,
        clarifications: clarificationHistory
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.ok) throw Object.assign(new Error(payload?.error || `HTTP_${response.status}`), { code: payload?.error || 'AI_ERROR', status: response.status });
    return payload;
  };

  const analyzeCurrentDraft = async (draft, { force = false } = {}) => {
    understandingLoading.hidden = false;
    understandingError.hidden = true;
    aiUnderstandingResult.hidden = true;
    setAiState('Analyse…', 'loading');

    if (!force && loadAiCache(currentBaseFingerprint)) {
      understandingLoading.hidden = true;
      renderUnderstanding(lastResponse);
      setAiState('Résultat local réutilisé', 'cached');
      return;
    }

    try {
      const response = await callUnderstandingApi(draft);
      lastResponse = response;
      if (response.usage) usageLog.push(response.usage);
      saveAiCache();
      understandingLoading.hidden = true;
      renderUnderstanding(response);
    } catch (error) {
      understandingLoading.hidden = true;
      aiUnderstandingResult.hidden = true;
      understandingError.hidden = false;
      understandingError.textContent = errorMessage(error?.code, Number(error?.status || 0));
      setAiState('Non disponible', 'error');
    }
  };

  const prepareUnderstanding = async () => {
    const draft = readDraft();
    const error = validateDraft(draft);
    validationMessage.textContent = error;
    if (error) return false;

    saveDraft();
    summaryName.textContent = draft.name;
    summaryDescription.textContent = draft.description;
    renderReferenceSummary(draft.references);
    understandingProgressButton.disabled = false;
    futurePreview.hidden = true;
    confirmUnderstanding.disabled = true;
    goToStep('understanding');

    const nextFingerprint = await fingerprint(stableDraftPayload(draft));
    if (nextFingerprint !== currentBaseFingerprint) {
      currentBaseFingerprint = nextFingerprint;
      clarificationHistory = [];
      usageLog = [];
      lastResponse = null;
    }
    await analyzeCurrentDraft(draft);
    return true;
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void prepareUnderstanding();
  });

  ideaName.addEventListener('input', scheduleSave);
  ideaDescription.addEventListener('input', () => {
    updateDescriptionCount();
    scheduleSave();
  });

  addReferenceButton.addEventListener('click', () => {
    createReferenceRow();
    const rows = getReferenceRows();
    rows.at(-1)?.querySelector('.reference-url')?.focus();
    scheduleSave();
  });

  noReferenceButton.addEventListener('click', () => {
    referencesList.innerHTML = '';
    updateReferenceNumbers();
    scheduleSave();
  });

  backToCapture.addEventListener('click', () => goToStep('capture'));

  understandingProgressButton.addEventListener('click', () => {
    if (!understandingProgressButton.disabled) void prepareUnderstanding();
  });

  submitClarification.addEventListener('click', async () => {
    const answer = normalizeText(clarificationAnswer.value);
    const question = normalizeText(lastResponse?.understanding?.clarifying_question);
    if (!answer || !question) return;
    if (clarificationHistory.length >= MAX_CLARIFICATIONS) return;
    clarificationHistory.push({ question, answer });
    const draft = readDraft();
    await analyzeCurrentDraft(draft, { force: true });
  });

  skipClarification.addEventListener('click', () => {
    const understanding = lastResponse?.understanding;
    const question = normalizeText(understanding?.clarifying_question);
    if (!understanding || !question) return;
    understanding.needs_clarification = false;
    understanding.clarifying_question = null;
    const uncertainties = Array.isArray(understanding.uncertainties) ? understanding.uncertainties : [];
    understanding.uncertainties = [...uncertainties, `Question laissée ouverte : ${question}`].slice(0, 6);
    saveAiCache();
    renderUnderstanding(lastResponse);
    setAiState('Compréhension avec point ouvert', 'ready');
  });

  confirmUnderstanding.addEventListener('click', () => {
    if (confirmUnderstanding.disabled || !lastResponse?.understanding) return;
    futurePreview.hidden = false;
    futurePreview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  resetDraftButton.addEventListener('click', () => {
    const shouldReset = window.confirm('Effacer ce brouillon local, son analyse IA locale et repartir de zéro ?');
    if (!shouldReset) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(AI_CACHE_KEY);
    form.reset();
    referencesList.innerHTML = '';
    createReferenceRow();
    updateDescriptionCount();
    validationMessage.textContent = '';
    futurePreview.hidden = true;
    understandingProgressButton.disabled = true;
    aiUnderstandingResult.hidden = true;
    understandingError.hidden = true;
    clarificationBox.hidden = true;
    currentBaseFingerprint = '';
    clarificationHistory = [];
    usageLog = [];
    lastResponse = null;
    setSaveLabel('Brouillon local');
    setAiState('Prêt');
    goToStep('capture');
  });

  restoreDraft();
  updateDescriptionCount();
})();

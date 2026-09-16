(() => {
  'use strict';

  const STORAGE_KEY = '4b4c2.lab2.idea-studio.slice1.v1';
  const MAX_REFERENCES = 3;
  const MIN_DESCRIPTION_LENGTH = 40;

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

  let saveTimer = null;

  const safeJsonParse = (value) => {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
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
    addReferenceButton.textContent = rows.length >= MAX_REFERENCES
      ? '3 références maximum'
      : '+ Ajouter une référence';
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

  const setSaveLabel = (label) => {
    saveState.textContent = label;
  };

  const saveDraft = () => {
    const draft = readDraft();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
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
    if (references.length) {
      references.forEach(createReferenceRow);
    } else {
      createReferenceRow();
    }
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
      detail.textContent = reference.note
        ? `${reasonLabel(reference.reason)} · ${reference.note}`
        : reasonLabel(reference.reason);
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
    if (draft.description.length < MIN_DESCRIPTION_LENGTH) {
      return `Explique un peu plus ton idée (${MIN_DESCRIPTION_LENGTH} caractères minimum pour ce prototype).`;
    }
    return '';
  };

  const prepareUnderstanding = () => {
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
    goToStep('understanding');
    return true;
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    prepareUnderstanding();
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
    if (!understandingProgressButton.disabled) prepareUnderstanding();
  });

  confirmUnderstanding.addEventListener('click', () => {
    futurePreview.hidden = false;
    futurePreview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  resetDraftButton.addEventListener('click', () => {
    const shouldReset = window.confirm('Effacer ce brouillon local et repartir de zéro ?');
    if (!shouldReset) return;
    localStorage.removeItem(STORAGE_KEY);
    form.reset();
    referencesList.innerHTML = '';
    createReferenceRow();
    updateDescriptionCount();
    validationMessage.textContent = '';
    futurePreview.hidden = true;
    understandingProgressButton.disabled = true;
    setSaveLabel('Brouillon local');
    goToStep('capture');
  });

  restoreDraft();
  updateDescriptionCount();
})();

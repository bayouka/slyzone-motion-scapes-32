(() => {
  'use strict';

  const DRAFT_KEY = '4b4c2.lab2.idea-studio.slice1.v1';
  const UNDERSTANDING_KEY = '4b4c2.lab2.idea-understanding.slice2.v1';
  const CONFIRMATION_KEY = '4b4c2.lab2.idea-understanding-confirmed.slice2.v1';
  const RESEARCH_KEY = '4b4c2.lab2.idea-research.slice3.v1';
  const AUTH_SESSION_KEY = '4b4c.supabase.session.v2';
  const EXPECTED_UNDERSTANDING_CONTRACT = 'lab2-understanding-v2';
  const EXPECTED_RESEARCH_CONTRACT = 'lab2-research-v2';

  const ideaName = document.getElementById('ideaName');
  const ideaOneLiner = document.getElementById('ideaOneLiner');
  const ideaProblem = document.getElementById('ideaProblem');
  const referenceCount = document.getElementById('referenceCount');
  const researchState = document.getElementById('researchState');
  const actionPanel = document.getElementById('actionPanel');
  const blockedPanel = document.getElementById('blockedPanel');
  const startResearch = document.getElementById('startResearch');
  const loadingBox = document.getElementById('loadingBox');
  const errorBox = document.getElementById('errorBox');
  const results = document.getElementById('results');
  const referencesGrid = document.getElementById('referencesGrid');
  const competitorsGrid = document.getElementById('competitorsGrid');
  const discoveryMeta = document.getElementById('discoveryMeta');
  const patternsList = document.getElementById('patternsList');
  const limitationsList = document.getElementById('limitationsList');
  const metricsGrid = document.getElementById('metricsGrid');

  let draft = null;
  let understanding = null;
  let fingerprintValue = '';

  const parse = (value) => {
    try { return JSON.parse(value); }
    catch { return null; }
  };
  const text = (value) => String(value || '').trim();
  const meaningfulCore = (value) => text(value).length >= 20;
  const fingerprint = async (value) => {
    const data = new TextEncoder().encode(JSON.stringify(value));
    const digest = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  };
  const accessToken = () => text(window.Lab2Auth?.getAccessToken?.() || parse(localStorage.getItem(AUTH_SESSION_KEY))?.access_token);

  const setInitialVisualState = () => {
    loadingBox.hidden = true;
    errorBox.hidden = true;
    results.hidden = true;
    actionPanel.hidden = true;
    blockedPanel.hidden = true;
  };

  const loadContext = async () => {
    setInitialVisualState();
    draft = parse(localStorage.getItem(DRAFT_KEY));
    const understandingCache = parse(localStorage.getItem(UNDERSTANDING_KEY));
    const confirmation = parse(localStorage.getItem(CONFIRMATION_KEY));
    understanding = understandingCache?.response?.understanding || null;

    if (draft?.name) ideaName.textContent = draft.name;
    if (meaningfulCore(understanding?.one_liner)) ideaOneLiner.textContent = understanding.one_liner;
    if (meaningfulCore(understanding?.problem)) ideaProblem.textContent = understanding.problem;
    const refs = Array.isArray(draft?.references) ? draft.references.filter((item) => text(item?.url)) : [];
    referenceCount.textContent = refs.length ? `${refs.length} référence${refs.length > 1 ? 's' : ''}` : 'Aucune référence fournie';

    const confirmationMatches = Boolean(
      confirmation?.version === 1 && confirmation?.confirmed === true &&
      confirmation?.understandingContract === EXPECTED_UNDERSTANDING_CONTRACT &&
      confirmation?.baseFingerprint && confirmation.baseFingerprint === understandingCache?.baseFingerprint
    );
    const ready = Boolean(
      draft?.name && understanding?.contract_version === EXPECTED_UNDERSTANDING_CONTRACT &&
      meaningfulCore(understanding?.one_liner) && meaningfulCore(understanding?.problem) &&
      Array.isArray(understanding?.target_users) && understanding.target_users.length >= 1 &&
      Array.isArray(understanding?.main_flow) && understanding.main_flow.length >= 2 &&
      understanding?.needs_clarification !== true && confirmationMatches
    );

    blockedPanel.hidden = ready;
    actionPanel.hidden = !ready;
    if (!ready) {
      researchState.textContent = 'Compréhension à refaire';
      researchState.dataset.state = 'error';
      return false;
    }

    researchState.textContent = 'Prêt à rechercher';
    researchState.dataset.state = 'ready';
    fingerprintValue = await fingerprint({
      name: draft.name,
      references: refs.map(({ url, reason, note }) => ({ url, reason, note })),
      understanding,
      confirmed_base_fingerprint: confirmation.baseFingerprint
    });

    const cached = parse(localStorage.getItem(RESEARCH_KEY));
    if (cached?.version === 1 && cached?.fingerprint === fingerprintValue && cached?.response?.ok && cached.response.contract_version === EXPECTED_RESEARCH_CONTRACT) {
      render(cached.response);
    } else if (cached) {
      localStorage.removeItem(RESEARCH_KEY);
    }
    return true;
  };

  const errorLabel = (code, status) => {
    if (code === 'LAB_RESEARCH_DISABLED') return 'La recherche du Lab est volontairement désactivée sur cet environnement. Aucun crédit n’a été consommé.';
    if (code === 'LAB_ACCESS_UNCONFIGURED') return 'Le groupe autorisé à tester 4b4c2 n’est pas encore configuré.';
    if (code === 'LAB_ACCESS_DENIED') return 'Ce compte n’est pas autorisé à tester 4b4c2.';
    if (code === 'UNAUTHORIZED') return 'Ta session a expiré. Reconnecte-toi depuis l’accès au Lab puis réessaie.';
    if (code === 'UNDERSTANDING_REQUIRED') return 'La compréhension actuelle n’est pas assez structurée pour lancer une recherche fiable. Reviens à l’étape précédente.';
    if (code === 'AI_CAPACITY') return 'Le quota ou la capacité IA est momentanément atteint. Aucune relance automatique n’est effectuée.';
    if (status >= 500) return 'La recherche a rencontré un problème technique. Ton idée et les résultats précédents restent intacts.';
    return 'La recherche n’a pas pu être effectuée.';
  };

  const clearNode = (node) => { while (node.firstChild) node.firstChild.remove(); };
  const sourceTitle = (source, index) => {
    try { return new URL(source.url).hostname.replace(/^www\./, ''); }
    catch { return `Source ${index + 1}`; }
  };
  const categoryLabel = (category) => ({
    POSITIONING: 'Positionnement', FUNCTIONALITY: 'Fonctionnalité', WORKFLOW: 'Workflow',
    NAVIGATION: 'Navigation', TRUST: 'Confiance', PRICING: 'Tarification', OTHER: 'Autre'
  }[category] || 'Observation');

  const createSourceCard = (source, index) => {
    const card = document.createElement('article');
    card.className = 'source-card';
    const top = document.createElement('div');
    top.className = 'source-card-top';
    const heading = document.createElement('div');
    const title = document.createElement('h3');
    title.textContent = sourceTitle(source, index);
    const url = document.createElement('a');
    url.href = source.url; url.target = '_blank'; url.rel = 'noopener noreferrer'; url.textContent = source.url;
    heading.append(title, url); top.appendChild(heading);
    const status = document.createElement('span');
    status.className = 'source-status';
    status.textContent = source.fetch_status === 'OBSERVED_PUBLIC' ? 'Page publique vérifiée' : 'Non vérifiée';
    top.appendChild(status); card.appendChild(top);

    if (source.selection_reason) {
      const reason = document.createElement('p'); reason.className = 'selection-reason'; reason.textContent = source.selection_reason; card.appendChild(reason);
    }
    const findings = Array.isArray(source.findings) ? source.findings : [];
    if (!findings.length) {
      const empty = document.createElement('p'); empty.className = 'empty-copy';
      empty.textContent = source.fetch_status === 'OBSERVED_PUBLIC'
        ? 'La page a été lue, mais aucun constat suffisamment solide n’a été retenu.'
        : 'Cette source n’a pas pu être vérifiée à partir de contenu public exploitable.';
      card.appendChild(empty); return card;
    }
    const list = document.createElement('div'); list.className = 'findings-list';
    findings.forEach((finding) => {
      const item = document.createElement('div'); item.className = 'finding';
      const label = document.createElement('span'); label.className = 'finding-label'; label.textContent = categoryLabel(finding.category);
      const statement = document.createElement('p'); statement.textContent = finding.statement;
      const evidence = document.createElement('blockquote'); evidence.textContent = `Preuve publique : « ${finding.support_text} »`;
      item.append(label, statement, evidence); list.appendChild(item);
    });
    card.appendChild(list); return card;
  };

  const renderList = (node, values, emptyText) => {
    clearNode(node);
    const items = Array.isArray(values) ? values.filter(Boolean) : [];
    if (!items.length) { const li = document.createElement('li'); li.textContent = emptyText; node.appendChild(li); return; }
    items.forEach((value) => { const li = document.createElement('li'); li.textContent = typeof value === 'string' ? value : value.statement; node.appendChild(li); });
  };
  const addMetric = (label, value) => {
    const item = document.createElement('div'); const strong = document.createElement('strong'); const span = document.createElement('span');
    strong.textContent = value; span.textContent = label; item.append(strong, span); metricsGrid.appendChild(item);
  };

  const paintQuality = (payload) => {
    const level = payload?.quality?.level || 'UNAVAILABLE';
    if (level === 'FULL') {
      researchState.textContent = 'Recherche exploitable'; researchState.dataset.state = 'ready';
      return;
    }
    if (level === 'PARTIAL') {
      researchState.textContent = 'Analyse partielle'; researchState.dataset.state = 'limited';
      return;
    }
    researchState.textContent = payload?.discovery?.status === 'UNCONFIGURED' ? 'Recherche Web non configurée' : 'Aucun fait vérifié';
    researchState.dataset.state = 'limited';
  };

  const render = (payload) => {
    clearNode(referencesGrid); clearNode(competitorsGrid); clearNode(metricsGrid);
    const refs = Array.isArray(payload.references) ? payload.references : [];
    const competitors = Array.isArray(payload.competitors) ? payload.competitors : [];
    refs.forEach((source, index) => referencesGrid.appendChild(createSourceCard(source, index)));
    competitors.forEach((source, index) => competitorsGrid.appendChild(createSourceCard(source, index)));

    if (!refs.length) referencesGrid.textContent = 'Aucune référence fournie.';
    if (!competitors.length) competitorsGrid.textContent = payload.discovery?.configured
      ? 'Aucun concurrent suffisamment pertinent et vérifiable n’a été retenu.'
      : 'Aucune recherche Web de concurrents n’a été effectuée : le fournisseur de recherche n’est pas configuré sur cette preview.';

    discoveryMeta.textContent = payload.discovery?.configured
      ? `${Number(payload.discovery?.search_requests || 0)} recherche(s) réellement tentée(s) · ${Number(payload.discovery?.search_succeeded || 0)} aboutie(s) · ${competitors.length} concurrent(s) retenu(s)`
      : '0 recherche Web · fournisseur non configuré';
    renderList(patternsList, payload.cross_patterns, 'Pas assez de faits vérifiés pour dégager un point commun fiable.');
    renderList(limitationsList, payload.limitations, 'Aucune limite supplémentaire signalée.');

    const selectionUsage = payload.usage?.selection || {};
    const analysisUsage = payload.usage?.analysis || {};
    const totalTokens = Number(selectionUsage.total_tokens || 0) + Number(analysisUsage.total_tokens || 0);
    addMetric('Recherches Web réellement tentées', String(Number(payload.discovery?.search_requests || 0)));
    addMetric('Tentatives d’ouverture de pages', String(Number(payload.source_fetch_attempt_count || 0)));
    addMetric('Pages publiques réellement lues', String(Number(payload.source_fetch_count || 0)));
    addMetric('Constats publics vérifiés', String(Number(payload.quality?.observed_finding_count || 0)));
    addMetric('Tokens IA mesurés', totalTokens ? String(totalTokens) : 'non fournis');

    results.hidden = false; errorBox.hidden = true; loadingBox.hidden = true; paintQuality(payload);
  };

  const saveResult = (payload) => {
    try { localStorage.setItem(RESEARCH_KEY, JSON.stringify({ version: 1, fingerprint: fingerprintValue, response: payload, savedAt: new Date().toISOString() })); }
    catch {}
  };

  const callResearch = async () => {
    const token = accessToken();
    if (!token) { window.Lab2Auth?.goToLogin?.(); throw Object.assign(new Error('UNAUTHORIZED'), { code: 'UNAUTHORIZED', status: 401 }); }
    const response = await fetch('/api/lab2/research', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: draft.name, references: Array.isArray(draft.references) ? draft.references : [], understanding, discover_competitors: true })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.ok) throw Object.assign(new Error(payload?.error || `HTTP_${response.status}`), { code: payload?.error || 'RESEARCH_ERROR', status: response.status });
    return payload;
  };

  startResearch.addEventListener('click', async () => {
    if (actionPanel.hidden) return;
    startResearch.disabled = true; loadingBox.hidden = false; errorBox.hidden = true;
    researchState.textContent = 'Recherche…'; researchState.dataset.state = 'loading';
    try { const payload = await callResearch(); saveResult(payload); render(payload); }
    catch (error) {
      loadingBox.hidden = true; errorBox.hidden = false; errorBox.textContent = errorLabel(error?.code, Number(error?.status || 0));
      researchState.textContent = 'Non disponible'; researchState.dataset.state = 'error';
    } finally { startResearch.disabled = false; }
  });

  void loadContext();
})();
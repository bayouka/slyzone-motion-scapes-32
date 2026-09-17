(() => {
  'use strict';

  const RESEARCH_KEY = '4b4c2.lab2.idea-research.slice3.v1';
  const results = document.getElementById('results');
  const continuePanel = document.getElementById('continuePanel');
  const continueTitle = document.getElementById('continueTitle');
  const continueCopy = document.getElementById('continueCopy');
  const continueLink = document.getElementById('continueResearch');

  if (!results) return;

  const parse = (value) => {
    try { return JSON.parse(value); }
    catch { return null; }
  };

  let sticky = document.getElementById('researchStickyContinue');
  if (!sticky) {
    sticky = document.createElement('div');
    sticky.id = 'researchStickyContinue';
    sticky.className = 'research-sticky-continue';
    sticky.hidden = true;

    const copy = document.createElement('div');
    const strong = document.createElement('strong');
    strong.textContent = 'Analyse terminée';
    const span = document.createElement('span');
    span.textContent = 'Tu peux passer aux propositions d’amélioration.';
    copy.append(strong, span);

    const link = document.createElement('a');
    link.className = 'primary-link';
    link.href = './idea-improvements.html';
    link.textContent = 'Continuer →';

    sticky.append(copy, link);
    document.body.appendChild(sticky);
  }

  const apply = () => {
    if (results.hidden) {
      sticky.hidden = true;
      return;
    }

    const payload = parse(localStorage.getItem(RESEARCH_KEY))?.response;
    if (!payload?.ok) {
      sticky.hidden = true;
      return;
    }

    const sources = [
      ...(Array.isArray(payload.references) ? payload.references : []),
      ...(Array.isArray(payload.competitors) ? payload.competitors : [])
    ];
    const observed = sources.filter((source) => source?.fetch_status === 'OBSERVED_PUBLIC').length;
    const searchConfigured = payload.discovery?.configured === true;
    const limited = !searchConfigured || observed === 0;

    if (continuePanel) continuePanel.hidden = false;
    if (continueLink) continueLink.href = './idea-improvements.html';

    if (limited) {
      if (continueTitle) continueTitle.textContent = 'Continuer avec une analyse limitée';
      if (continueCopy) {
        continueCopy.textContent = 'La recherche Web est incomplète ou aucune page n’a pu être vérifiée. Tu peux continuer : les prochaines propositions devront distinguer clairement ton idée, les faits observés et le raisonnement produit.';
      }
      sticky.querySelector('strong').textContent = 'Analyse limitée mais exploitable';
      sticky.querySelector('span').textContent = 'Aucun fait manquant ne sera inventé. Tu peux continuer.';
      sticky.querySelector('a').textContent = 'Continuer vers les améliorations →';
    } else {
      if (continueTitle) continueTitle.textContent = 'Passer aux propositions d’amélioration';
      if (continueCopy) {
        continueCopy.textContent = 'Les propositions distingueront ce qui vient de ton idée, ce qui est réellement observé et ce qui relève du raisonnement produit.';
      }
      sticky.querySelector('strong').textContent = 'Analyse terminée';
      sticky.querySelector('span').textContent = 'Tu peux passer aux propositions d’amélioration.';
      sticky.querySelector('a').textContent = 'Continuer →';
    }

    sticky.hidden = false;
  };

  new MutationObserver((mutations) => {
    if (mutations.some((item) => item.type === 'attributes' && item.attributeName === 'hidden')) apply();
  }).observe(results, { attributes: true, attributeFilter: ['hidden'] });

  window.addEventListener('pageshow', apply);
  apply();
})();

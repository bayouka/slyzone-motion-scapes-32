(() => {
  'use strict';
  const RESEARCH_KEY='4b4c2.lab2.idea-research.slice3.v1';
  const EXPECTED='lab2-research-v3';
  const results=document.getElementById('results');
  const state=document.getElementById('researchState');
  const title=document.getElementById('continueTitle');
  const copy=document.getElementById('continueCopy');
  const discoveryMeta=document.getElementById('discoveryMeta');
  const limitationsList=document.getElementById('limitationsList');
  if(!results||!state)return;

  const parse=(value)=>{try{return JSON.parse(value)}catch{return null}};
  const providersOf=(payload)=>Array.isArray(payload?.discovery?.providers)?payload.discovery.providers:[];
  const automaticSearchUnconfigured=(payload)=>{
    const providers=providersOf(payload);
    return Number(payload?.discovery?.search_succeeded||0)===0&&(providers.includes('NONE')||payload?.discovery?.status==='UNCONFIGURED');
  };
  const humanizeLimitation=(value)=>{
    const text=String(value||'');
    if(text.includes('SEARCH_UNCONFIGURED'))return 'La recherche automatique de solutions similaires n’est pas configurée sur cette preview.';
    if(text.includes('SEARCH_QUOTA'))return 'La recherche automatique a atteint sa limite d’utilisation.';
    if(text.includes('SEARCH_NETWORK_ERROR'))return 'La recherche automatique n’a pas pu joindre son fournisseur.';
    if(text.includes('SEARCH_ERROR'))return 'La recherche automatique a rencontré une erreur technique.';
    return text;
  };
  const polishLimitations=()=>{
    if(!limitationsList)return;
    for(const item of limitationsList.querySelectorAll('li'))item.textContent=humanizeLimitation(item.textContent);
  };

  const apply=()=>{
    if(results.hidden)return;
    const payload=parse(localStorage.getItem(RESEARCH_KEY))?.response;
    if(!payload?.ok||payload?.contract_version!==EXPECTED)return;
    const level=payload?.quality?.level||'UNAVAILABLE';
    const unconfigured=automaticSearchUnconfigured(payload);

    if(discoveryMeta&&unconfigured){
      const solutions=Array.isArray(payload?.solutions)?payload.solutions.length:0;
      discoveryMeta.textContent=`Recherche automatique non configurée · ${solutions} solution(s) découverte(s) automatiquement`;
    }
    polishLimitations();

    if(level==='FULL'){
      state.textContent='Recherche exploitable';
      state.dataset.state='ready';
      if(title)title.textContent='Continuer avec les faits observés';
      if(copy)copy.textContent='Des sources publiques vérifiées sont disponibles. Les améliorations pourront les utiliser en indiquant clairement leur provenance.';
      return;
    }
    if(level==='PARTIAL'){
      state.textContent='Analyse partielle';
      state.dataset.state='limited';
      if(title)title.textContent='Continuer avec les faits réellement observés';
      if(copy)copy.textContent=unconfigured
        ? 'Ta référence a pu être analysée, mais la découverte automatique de solutions similaires n’est pas configurée. Les propositions distingueront les faits observés du raisonnement produit.'
        : 'Quelques faits ont été vérifiés, mais la couverture reste limitée. Les propositions distingueront les faits observés du raisonnement produit.';
      return;
    }
    state.textContent=unconfigured?'Recherche Web non configurée':'Aucun fait public vérifié';
    state.dataset.state='limited';
    if(title)title.textContent=unconfigured?'Continuer sans recherche concurrentielle':'Continuer sans faits concurrentiels';
    if(copy)copy.textContent=unconfigured
      ? 'Aucun moteur de découverte concurrentielle n’est configuré sur cette preview. Les références que tu fournis restent analysables séparément ; tu peux continuer sans que l’IA invente des concurrents.'
      : 'Aucun fait public suffisamment solide n’a été vérifié. Tu peux continuer sans que l’IA invente des pratiques concurrentes.';
  };

  new MutationObserver((mutations)=>{
    if(mutations.some(item=>item.type==='attributes'&&item.attributeName==='hidden'))apply();
  }).observe(results,{attributes:true,attributeFilter:['hidden']});
  apply();
})();
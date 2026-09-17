(() => {
  'use strict';
  const RESEARCH_KEY='4b4c2.lab2.idea-research.slice3.v1';
  const results=document.getElementById('results');
  const state=document.getElementById('researchState');
  const title=document.getElementById('continueTitle');
  const copy=document.getElementById('continueCopy');
  if(!results||!state)return;

  const parse=(value)=>{try{return JSON.parse(value)}catch{return null}};
  const apply=()=>{
    if(results.hidden)return;
    const payload=parse(localStorage.getItem(RESEARCH_KEY))?.response;
    if(!payload?.ok||payload?.contract_version!=='lab2-research-v2')return;
    const level=payload?.quality?.level||'UNAVAILABLE';
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
      if(title)title.textContent='Continuer avec une analyse partielle';
      if(copy)copy.textContent='Quelques faits ont été vérifiés, mais la couverture reste limitée. Les propositions distingueront les faits observés du raisonnement produit.';
      return;
    }
    state.textContent=payload?.discovery?.status==='UNCONFIGURED'?'Recherche Web non configurée':'Aucun fait vérifié';
    state.dataset.state='limited';
    if(title)title.textContent='Continuer sans recherche concurrentielle';
    if(copy)copy.textContent=payload?.discovery?.status==='UNCONFIGURED'
      ? 'Aucune recherche Web de concurrents n’a réellement été effectuée sur cette preview. Tu peux continuer, mais les propositions devront reposer uniquement sur ton idée et sur du raisonnement produit.'
      : 'Aucun fait public suffisamment solide n’a été vérifié. Tu peux continuer sans que l’IA invente des pratiques concurrentes.';
  };

  new MutationObserver((mutations)=>{
    if(mutations.some(item=>item.type==='attributes'&&item.attributeName==='hidden'))apply();
  }).observe(results,{attributes:true,attributeFilter:['hidden']});
  apply();
})();
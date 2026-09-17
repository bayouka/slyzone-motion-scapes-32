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
    if(!payload?.ok)return;
    const sources=[...(Array.isArray(payload.references)?payload.references:[]),...(Array.isArray(payload.competitors)?payload.competitors:[])];
    const observed=sources.filter(source=>source?.fetch_status==='OBSERVED_PUBLIC').length;
    const searchConfigured=payload.discovery?.configured===true;
    const limited=!searchConfigured||observed===0;
    if(limited){
      state.textContent='Analyse limitée';
      state.dataset.state='limited';
      if(title)title.textContent='Continuer sans inventer ce qui manque';
      if(copy)copy.textContent='La recherche est incomplète. Tu peux néanmoins continuer : les prochaines propositions devront clairement distinguer ton idée, les faits réellement observés et le raisonnement produit.';
    }else{
      state.textContent='Analyse prête';
      state.dataset.state='ready';
    }
  };

  new MutationObserver((mutations)=>{
    if(mutations.some(item=>item.type==='attributes'&&item.attributeName==='hidden'))apply();
  }).observe(results,{attributes:true,attributeFilter:['hidden']});
  apply();
})();

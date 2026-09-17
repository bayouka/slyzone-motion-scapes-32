(() => {
  'use strict';

  const DRAFT_KEY='4b4c2.lab2.idea-studio.slice1.v1';
  const AI_CACHE_KEY='4b4c2.lab2.idea-understanding.slice2.v1';
  const LEGACY_CONFIRMATION_KEY='4b4c2.lab2.idea-understanding-confirmed.slice2.v1';
  const EXPECTED_CONTRACT='lab2-understanding-v4';
  const parse=(value)=>{try{return JSON.parse(value)}catch{return null}};
  const text=(value)=>String(value||'').trim();

  const readDraftFromDom=()=>({
    version:1,
    name:text(document.getElementById('ideaName')?.value),
    description:text(document.getElementById('ideaDescription')?.value),
    references:[...document.querySelectorAll('#referencesList .reference-card')].map((row)=>({
      url:text(row.querySelector('.reference-url')?.value),
      reason:text(row.querySelector('.reference-reason')?.value),
      note:text(row.querySelector('.reference-note')?.value)
    })).filter((item)=>item.url||item.note),
    updatedAt:new Date().toISOString()
  });

  const persistRawIdea=async()=>{
    const draft=readDraftFromDom();
    if(!draft.name||draft.description.length<40||!window.Lab2ProjectState)return null;
    await window.Lab2ProjectState.setRawIdea(draft);
    return draft;
  };

  const persistAndConfirmUnderstanding=async()=>{
    const state=window.Lab2ProjectState;
    if(!state)throw new Error('LAB2_PROJECT_STATE_UNAVAILABLE');
    const cache=parse(localStorage.getItem(AI_CACHE_KEY));
    const understanding=cache?.response?.understanding;
    if(!cache?.baseFingerprint||understanding?.contract_version!==EXPECTED_CONTRACT)throw new Error('LAB2_UNDERSTANDING_CONTRACT_MISMATCH');
    // Only an ACTIVE clarification blocks confirmation. Decisions intentionally deferred
    // to structure/feasibility/design/presentation remain open without blocking progress.
    if(understanding.needs_clarification===true)throw new Error('LAB2_UNDERSTANDING_NEEDS_INPUT');

    await persistRawIdea();
    const provenance=[];
    for(const item of Array.isArray(understanding.explicit_points)?understanding.explicit_points:[])provenance.push({type:'USER_FACT',value:item});
    for(const item of Array.isArray(understanding.target_users)?understanding.target_users:[])provenance.push({type:item?.basis==='EXPLICIT'?'USER_FACT':'INFERRED',value:item?.label||''});
    for(const item of Array.isArray(understanding.open_decisions)?understanding.open_decisions:[])provenance.push({type:'OPEN_DECISION',scope:item?.scope||'UNKNOWN',blocking:item?.blocking===true,value:item?.question||''});

    const artifact=await state.setArtifact('understanding',{
      status:'READY',
      contractVersion:understanding.contract_version,
      inputFingerprint:cache.baseFingerprint,
      data:{understanding,clarifications:Array.isArray(cache.clarifications)?cache.clarifications:[],usageLog:Array.isArray(cache.usageLog)?cache.usageLog:[]},
      provenance
    });
    state.confirmArtifact('understanding',{expectedInputFingerprint:cache.baseFingerprint,expectedOutputFingerprint:artifact.outputFingerprint});

    // Transitional mirror for older Lab pages while they are migrated to ProjectState.
    localStorage.setItem(LEGACY_CONFIRMATION_KEY,JSON.stringify({
      version:2,confirmed:true,understandingContract:understanding.contract_version,
      baseFingerprint:cache.baseFingerprint,outputFingerprint:artifact.outputFingerprint,confirmedAt:new Date().toISOString()
    }));
    return cache.baseFingerprint;
  };

  const form=document.getElementById('ideaForm');
  form?.addEventListener('submit',()=>{void persistRawIdea()},true);
  form?.addEventListener('reset',()=>window.Lab2ProjectState?.clear());

  const confirm=document.getElementById('confirmUnderstanding');
  confirm?.addEventListener('click',(event)=>{
    if(confirm.disabled)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    confirm.disabled=true;
    void persistAndConfirmUnderstanding().then((fingerprint)=>{
      window.location.assign(`./idea-research.html?idea=${encodeURIComponent(fingerprint)}`);
    }).catch((error)=>{
      console.error(error);
      confirm.disabled=false;
      const box=document.getElementById('understandingError');
      if(box){box.hidden=false;box.textContent=error?.message==='LAB2_UNDERSTANDING_NEEDS_INPUT'?'Une précision réellement bloquante reste à confirmer avant de continuer.':'La compréhension n’a pas pu être confirmée proprement. Relance l’analyse ou réponds à la précision demandée.';}
    });
  },true);
})();
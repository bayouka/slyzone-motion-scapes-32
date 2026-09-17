(() => {
  'use strict';

  const DRAFT_KEY='4b4c2.lab2.idea-studio.slice1.v1';
  const UNDERSTANDING_KEY='4b4c2.lab2.idea-understanding.slice2.v1';
  const CONFIRMATION_KEY='4b4c2.lab2.idea-understanding-confirmed.slice2.v1';
  const EXPECTED_CONTRACT='lab2-understanding-v4';
  const parse=value=>{try{return JSON.parse(value)}catch{return null}};

  async function migrate(){
    const state=window.Lab2ProjectState;
    if(!state)return;
    const existing=state.getArtifact('understanding');
    if(existing?.status==='CONFIRMED'&&existing?.confirmed===true&&existing?.contractVersion===EXPECTED_CONTRACT)return;

    const draft=parse(localStorage.getItem(DRAFT_KEY));
    const cache=parse(localStorage.getItem(UNDERSTANDING_KEY));
    const confirmation=parse(localStorage.getItem(CONFIRMATION_KEY));
    const understanding=cache?.response?.understanding;
    const valid=Boolean(
      draft?.name&&draft?.description&&cache?.baseFingerprint&&
      confirmation?.confirmed===true&&confirmation?.understandingContract===EXPECTED_CONTRACT&&
      confirmation?.baseFingerprint===cache.baseFingerprint&&
      understanding?.contract_version===EXPECTED_CONTRACT&&understanding?.needs_clarification!==true
    );
    if(!valid)return;

    await state.setRawIdea({
      version:1,name:draft.name,description:draft.description,
      references:Array.isArray(draft.references)?draft.references:[],updatedAt:draft.updatedAt||new Date().toISOString()
    });
    const provenance=[];
    for(const point of Array.isArray(understanding.explicit_points)?understanding.explicit_points:[])provenance.push({type:'USER_FACT',value:point});
    for(const user of Array.isArray(understanding.target_users)?understanding.target_users:[])provenance.push({type:user?.basis==='EXPLICIT'?'USER_FACT':'INFERRED',value:user?.label||''});
    const artifact=await state.setArtifact('understanding',{
      status:'READY',contractVersion:EXPECTED_CONTRACT,inputFingerprint:cache.baseFingerprint,
      data:{understanding,clarifications:Array.isArray(cache.clarifications)?cache.clarifications:[],usageLog:Array.isArray(cache.usageLog)?cache.usageLog:[]},
      provenance:[...provenance,{type:'LEGACY_STATE_MIGRATION',at:new Date().toISOString()}]
    });
    state.confirmArtifact('understanding',{expectedInputFingerprint:cache.baseFingerprint,expectedOutputFingerprint:artifact.outputFingerprint});
  }

  window.Lab2ResearchStateBridge=Object.freeze({migrate});
  window.Lab2ResearchStateReady=Promise.resolve().then(migrate).catch(error=>{console.error('LAB2_RESEARCH_STATE_MIGRATION_FAILED',error);});
})();

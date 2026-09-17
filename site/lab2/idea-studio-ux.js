(() => {
  'use strict';

  const MAX_INTERESTS=4;
  const UNDERSTANDING_TIMEOUT_MS=30000;
  const EXPECTED_CONTRACT='lab2-understanding-v4';
  const DRAFT_KEY='4b4c2.lab2.idea-studio.slice1.v1';
  const AI_CACHE_KEY='4b4c2.lab2.idea-understanding.slice2.v1';
  const CONFIRMATION_KEY='4b4c2.lab2.idea-understanding-confirmed.slice2.v1';
  const INTEREST_LABELS=Object.freeze({
    parcours:'Parcours / fonctionnement',fonctions:'Fonctionnalités / outils',simple:'Simplicité / clarté',design:'Design / ambiance',nav:'Navigation / organisation',contenu:'Contenu / ton',cta:'Conversion / appels à l’action',autre:'Autre'
  });
  const LEGACY_MAP=Object.freeze({fonctionnement:'parcours',fonctionnalites:'fonctions',simplicite:'simple',organisation:'nav',design:'design',autre:'autre'});

  const referencesList=document.getElementById('referencesList');
  const referenceSummary=document.getElementById('referenceSummary');
  const referenceEmptyState=document.getElementById('referenceEmptyState');
  const understandingError=document.getElementById('understandingError');
  const understandingLoading=document.getElementById('understandingLoading');
  const aiState=document.getElementById('aiState');
  const resetDraftButton=document.getElementById('resetDraft');
  const noReferenceButton=document.getElementById('noReference');
  const confirmUnderstanding=document.getElementById('confirmUnderstanding');

  const parseJson=(value)=>{try{return JSON.parse(value)}catch{return null}};
  const meaningfulCore=(value)=>{
    const normalized=String(value||'').trim().toLowerCase();
    return normalized.length>=20&&!['non déterminé','non determine','à préciser','a preciser','inconnu','non précisé','non precise'].includes(normalized);
  };
  const coreReady=(understanding)=>Boolean(
    understanding?.contract_version===EXPECTED_CONTRACT&&meaningfulCore(understanding?.one_liner)&&meaningfulCore(understanding?.problem)&&
    understanding?.project_profile&&Array.isArray(understanding?.target_users)&&understanding.target_users.length>=1&&
    Array.isArray(understanding?.main_flow)&&understanding.main_flow.length>=2
  );

  const cachedUnderstanding=parseJson(localStorage.getItem(AI_CACHE_KEY));
  const cachedCore=cachedUnderstanding?.response?.understanding;
  if(cachedCore&&!coreReady(cachedCore)){
    localStorage.removeItem(AI_CACHE_KEY);
    localStorage.removeItem(CONFIRMATION_KEY);
  }

  const parseInterests=(value)=>{
    const raw=String(value||'').split(',').map(item=>item.trim()).filter(Boolean);
    const mapped=raw.map(item=>LEGACY_MAP[item]||item).filter(item=>INTEREST_LABELS[item]);
    return [...new Set(mapped)].slice(0,MAX_INTERESTS);
  };
  const updateEmptyState=()=>{
    if(!referenceEmptyState||!referencesList)return;
    referenceEmptyState.hidden=referencesList.querySelector('.reference-card')!==null;
  };
  const repaintReferenceSummary=()=>{
    if(!referenceSummary||!referencesList)return;
    const rows=[...referencesList.querySelectorAll('.reference-card')];
    const items=[...referenceSummary.querySelectorAll('.reference-summary-item')];
    items.forEach((item,index)=>{
      const row=rows[index],detail=item.querySelector('span');if(!row||!detail)return;
      const interests=parseInterests(row.querySelector('.reference-reason')?.value).map(code=>INTEREST_LABELS[code]);
      const note=String(row.querySelector('.reference-note')?.value||'').trim();
      const next=[interests.length?interests.join(' · '):'',note].filter(Boolean).join(' — ')||'Référence ajoutée sans précision particulière';
      if(detail.textContent!==next)detail.textContent=next;
    });
  };
  const syncInterestButtons=(row)=>{
    if(!row||row.dataset.multiInterestReady==='true')return;
    const hidden=row.querySelector('.reference-reason'),buttons=[...row.querySelectorAll('.reference-interest')];
    if(!hidden||!buttons.length)return;
    const url=row.querySelector('.reference-url'),note=row.querySelector('.reference-note');
    if(!String(url?.value||'').trim()&&!String(note?.value||'').trim()&&hidden.value==='fonctionnement')hidden.value='';
    const selected=new Set(parseInterests(hidden.value));
    const paint=()=>{
      buttons.forEach(button=>{const active=selected.has(button.dataset.interest);button.classList.toggle('is-selected',active);button.setAttribute('aria-pressed',active?'true':'false')});
      hidden.value=[...selected].join(',');repaintReferenceSummary();
    };
    buttons.forEach(button=>button.addEventListener('click',()=>{
      const code=button.dataset.interest;if(!code)return;
      if(selected.has(code))selected.delete(code);
      else if(selected.size<MAX_INTERESTS)selected.add(code);
      else{
        row.querySelector('.reference-interest-help')?.classList.add('is-warning');
        window.setTimeout(()=>row.querySelector('.reference-interest-help')?.classList.remove('is-warning'),1200);return;
      }
      paint();hidden.dispatchEvent(new Event('change',{bubbles:true}));
    }));
    row.dataset.multiInterestReady='true';paint();
  };
  const cleanImplicitEmptyReference=()=>{
    if(!referencesList)return;
    const rows=[...referencesList.querySelectorAll('.reference-card')];if(rows.length!==1)return;
    const row=rows[0],url=String(row.querySelector('.reference-url')?.value||'').trim(),note=String(row.querySelector('.reference-note')?.value||'').trim();
    if(!url&&!note)row.remove();updateEmptyState();
  };

  if(referencesList){
    [...referencesList.querySelectorAll('.reference-card')].forEach(syncInterestButtons);cleanImplicitEmptyReference();
    new MutationObserver(mutations=>{for(const mutation of mutations){for(const node of mutation.addedNodes){if(node.nodeType===1&&node.matches?.('.reference-card'))syncInterestButtons(node);node.querySelectorAll?.('.reference-card').forEach(syncInterestButtons)}}updateEmptyState()}).observe(referencesList,{childList:true,subtree:true});
  }
  if(referenceSummary)new MutationObserver(repaintReferenceSummary).observe(referenceSummary,{childList:true,subtree:true});
  noReferenceButton?.addEventListener('click',()=>window.setTimeout(updateEmptyState,0));

  const confirmCurrentUnderstanding=async()=>{
    const cache=parseJson(localStorage.getItem(AI_CACHE_KEY));
    const draft=parseJson(localStorage.getItem(DRAFT_KEY));
    const understanding=cache?.response?.understanding;
    if(!cache?.baseFingerprint||!draft||!coreReady(understanding)||understanding?.needs_clarification===true){
      localStorage.removeItem(CONFIRMATION_KEY);return false;
    }
    const projectState=window.Lab2ProjectState;
    if(projectState){
      await projectState.setRawIdea({name:draft.name,description:draft.description,references:Array.isArray(draft.references)?draft.references:[]},cache.baseFingerprint);
      const artifact=await projectState.setArtifact('understanding',{
        status:'READY',contractVersion:EXPECTED_CONTRACT,inputFingerprint:cache.baseFingerprint,data:understanding,
        provenance:[{type:'AI_REASONING',model:cache?.response?.model||null,at:new Date().toISOString()}]
      });
      projectState.confirmArtifact('understanding',{expectedInputFingerprint:cache.baseFingerprint,expectedOutputFingerprint:artifact.outputFingerprint});
    }
    localStorage.setItem(CONFIRMATION_KEY,JSON.stringify({
      version:2,confirmed:true,understandingContract:EXPECTED_CONTRACT,baseFingerprint:cache.baseFingerprint,
      outputFingerprint:projectState?.getArtifact('understanding')?.outputFingerprint||null,confirmedAt:new Date().toISOString()
    }));
    window.location.assign(`./idea-research.html?idea=${encodeURIComponent(cache.baseFingerprint)}`);
    return true;
  };

  confirmUnderstanding?.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();void confirmCurrentUnderstanding()});
  resetDraftButton?.addEventListener('click',()=>{
    localStorage.removeItem(CONFIRMATION_KEY);window.Lab2ProjectState?.clear?.();window.setTimeout(cleanImplicitEmptyReference,0);
  });

  const friendlyError=(code)=>({
    LAB_ACCESS_UNCONFIGURED:"L’IA est prête, mais aucun compte de test n’est encore autorisé. Reviens à l’écran d’accès, copie ton identifiant technique puis ajoute-le à l’autorisation privée du Lab.",
    LAB_ACCESS_DENIED:"Ton compte est bien connecté, mais il n’est pas encore autorisé pour les appels IA du Lab. Reviens à l’écran d’accès pour copier ton identifiant technique.",
    UNAUTHORIZED:"Ta session de test a expiré. Reconnecte-toi depuis l’écran d’accès au Lab, puis réessaie.",
    AI_UNAVAILABLE:"Le moteur IA n’est pas disponible sur cette preview pour le moment.",
    AI_CAPACITY:"Le quota ou la capacité IA du moment est atteint. Aucun nouvel appel automatique ne sera tenté.",
    AI_OUTPUT_INVALID:"L’IA a répondu dans un format inattendu. Ton idée n’a pas été modifiée.",
    AI_OUTPUT_INCOMPLETE:"La réponse IA n’était pas assez utile pour continuer. Elle n’est pas considérée comme validée ; tu peux réessayer sans perdre ton brouillon.",
    AI_TIMEOUT:"L’analyse IA a pris trop de temps et a été arrêtée proprement. Ton brouillon est intact ; tu peux réessayer."
  }[code]||'');
  const applyFriendlyError=(code)=>{
    if(!code||!understandingError)return;const message=friendlyError(code);if(!message)return;
    if(understandingLoading)understandingLoading.hidden=true;if(understandingError.textContent!==message)understandingError.textContent=message;understandingError.hidden=false;
    if(aiState){const label=['LAB_ACCESS_UNCONFIGURED','LAB_ACCESS_DENIED'].includes(code)?'Compte à autoriser':'À réessayer';if(aiState.textContent!==label)aiState.textContent=label;aiState.dataset.state='error'}
  };
  const nativeFetch=window.fetch.bind(window);
  window.fetch=async(...args)=>{
    const target=typeof args[0]==='string'?args[0]:args[0]?.url||'';
    if(!String(target).includes('/api/lab2/understand'))return nativeFetch(...args);
    const controller=new AbortController(),existingInit=args[1]||{};
    const timer=window.setTimeout(()=>controller.abort('LAB2_UNDERSTANDING_TIMEOUT'),UNDERSTANDING_TIMEOUT_MS);
    try{
      const response=await nativeFetch(args[0],{...existingInit,signal:controller.signal});
      if(!response.ok){const payload=await response.clone().json().catch(()=>({}));const code=String(payload?.error||'');if(code)window.setTimeout(()=>applyFriendlyError(code),0)}
      return response;
    }catch(error){if(controller.signal.aborted||error?.name==='AbortError')window.setTimeout(()=>applyFriendlyError('AI_TIMEOUT'),0);throw error}
    finally{window.clearTimeout(timer)}
  };
  updateEmptyState();
})();
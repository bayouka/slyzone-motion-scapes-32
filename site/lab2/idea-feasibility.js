(() => {
  'use strict';
  const AUTH_SESSION_KEY='4b4c.supabase.session.v2';
  const EXPECTED_DEFINITION='lab2-definition-v1';
  const EXPECTED_FEASIBILITY='lab2-feasibility-v1';
  const q=id=>document.getElementById(id);
  const blockedPanel=q('blockedPanel'),actionPanel=q('actionPanel'),ideaName=q('ideaName'),ideaSummary=q('ideaSummary'),analyzeButton=q('analyzeButton'),loadingBox=q('loadingBox'),errorBox=q('errorBox'),results=q('results'),levelBadge=q('levelBadge'),summaryTitle=q('summaryTitle'),summaryCopy=q('summaryCopy'),capabilities=q('capabilities'),questions=q('questions'),questionsPanel=q('questionsPanel'),continueLink=q('continueLink');
  const parse=v=>{try{return JSON.parse(v)}catch{return null}};
  const text=v=>String(v||'').trim();
  const state=()=>window.Lab2ProjectState;
  const token=()=>text(window.Lab2Auth?.getAccessToken?.()||parse(localStorage.getItem(AUTH_SESSION_KEY))?.access_token);
  let definitionArtifact=null,inputFingerprint='';

  function clear(node){while(node.firstChild)node.firstChild.remove()}
  function render(payload){
    const data=payload?.feasibility||{};results.hidden=false;loadingBox.hidden=true;errorBox.hidden=true;
    levelBadge.textContent=`Complexité ${String(data.level||'LOW').toLowerCase()}`;levelBadge.className=`state-pill ${String(data.level||'LOW').toLowerCase()}`;
    summaryTitle.textContent=data.simple?'Projet techniquement simple à ce stade':'Points techniques à anticiper';summaryCopy.textContent=data.summary||'';
    clear(capabilities);const caps=Array.isArray(data.capabilities)?data.capabilities:[];
    if(!caps.length){const p=document.createElement('p');p.textContent='Aucune capacité technique complexe détectée dans la Version 1.';capabilities.appendChild(p)}
    caps.forEach(cap=>{const card=document.createElement('article');card.className='capability';const h=document.createElement('h3');h.textContent=cap.label;const p=document.createElement('p');p.textContent=cap.rationale;const meta=document.createElement('div');meta.className='meta';for(const value of [`Complexité ${cap.complexity}`,cap.external_dependency?'Dépendance externe':'Interne au produit']){const span=document.createElement('span');span.className='tag';span.textContent=value;meta.appendChild(span)}card.append(h,p,meta);capabilities.appendChild(card)});
    clear(questions);const open=Array.isArray(data.open_decisions)?data.open_decisions:[];questionsPanel.hidden=!open.length;
    open.forEach(item=>{const li=document.createElement('li');li.textContent=`${item.question}${item.blocking?' — à décider avant la structure':''}`;questions.appendChild(li)});
    continueLink.classList.toggle('is-disabled',data.requires_human_input===true);continueLink.setAttribute('aria-disabled',data.requires_human_input===true?'true':'false');
  }
  async function save(payload){await state().setArtifact('feasibility',{status:payload.feasibility?.requires_human_input?'NEEDS_INPUT':'CONFIRMED',contractVersion:payload.contract_version,inputFingerprint,data:payload.feasibility,provenance:[{type:'DETERMINISTIC_ANALYSIS',at:new Date().toISOString()}]})}
  async function callApi(){const access=token();if(!access){window.Lab2Auth?.goToLogin?.();throw Object.assign(new Error('UNAUTHORIZED'),{code:'UNAUTHORIZED'})}const response=await fetch('/api/lab2/feasibility',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${access}`},body:JSON.stringify({definition_contract:definitionArtifact.contractVersion,definition:definitionArtifact.data})});const payload=await response.json().catch(()=>({}));if(!response.ok||!payload?.ok)throw Object.assign(new Error(payload?.error||'FEASIBILITY_ERROR'),{code:payload?.error||'FEASIBILITY_ERROR'});if(payload.contract_version!==EXPECTED_FEASIBILITY)throw Object.assign(new Error('FEASIBILITY_INCOMPATIBLE'),{code:'FEASIBILITY_INCOMPATIBLE'});return payload}
  async function load(){const api=state();definitionArtifact=api?.getArtifact('definition');const ready=Boolean(definitionArtifact?.status==='CONFIRMED'&&definitionArtifact?.confirmed&&definitionArtifact?.contractVersion===EXPECTED_DEFINITION&&definitionArtifact?.data);blockedPanel.hidden=ready;actionPanel.hidden=!ready;if(!ready)return;ideaName.textContent=definitionArtifact.data.project_name||'Projet';ideaSummary.textContent=definitionArtifact.data.brief?.one_liner||'';inputFingerprint=await api.hash({definition:definitionArtifact.outputFingerprint});const artifact=api.getArtifact('feasibility');if(artifact?.status!=='STALE'&&artifact?.inputFingerprint===inputFingerprint&&artifact?.contractVersion===EXPECTED_FEASIBILITY&&artifact?.data)render({feasibility:artifact.data})}
  analyzeButton.addEventListener('click',async()=>{analyzeButton.disabled=true;loadingBox.hidden=false;errorBox.hidden=true;state()?.markStatus('feasibility','RUNNING');try{const payload=await callApi();await save(payload);render(payload)}catch(error){state()?.markStatus('feasibility','ERROR',{reason:error?.code||'FEASIBILITY_ERROR'});loadingBox.hidden=true;errorBox.hidden=false;errorBox.textContent='Impossible de vérifier la faisabilité pour le moment. La Version 1 reste intacte.'}finally{analyzeButton.disabled=false}});
  void load();
})();
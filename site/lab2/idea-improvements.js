(() => {
  'use strict';

  const LEGACY_KEY='4b4c2.lab2.idea-improvements.slice4.v1';
  const AUTH_SESSION_KEY='4b4c.supabase.session.v2';
  const EXPECTED_UNDERSTANDING='lab2-understanding-v4';
  const EXPECTED_RESEARCH='lab2-research-v3';
  const EXPECTED_IMPROVEMENTS='lab2-improvements-v3';
  const MIN_PROPOSALS=3;

  const q=id=>document.getElementById(id);
  const ideaName=q('ideaName'),ideaSummary=q('ideaSummary'),blockedPanel=q('blockedPanel'),actionPanel=q('actionPanel');
  const generateButton=q('generateButton'),loadingBox=q('loadingBox'),errorBox=q('errorBox'),reviewSection=q('reviewSection');
  const progressTitle=q('progressTitle'),decisionCount=q('decisionCount'),proposalType=q('proposalType'),proposalPriority=q('proposalPriority');
  const proposalTitle=q('proposalTitle'),proposalText=q('proposalText'),proposalWhy=q('proposalWhy'),proposalBasis=q('proposalBasis'),changeWarning=q('changeWarning');
  const rejectButton=q('rejectButton'),modifyButton=q('modifyButton'),acceptButton=q('acceptButton'),modifyBox=q('modifyBox'),modifyText=q('modifyText'),cancelModify=q('cancelModify'),saveModify=q('saveModify');
  const summaryPanel=q('summaryPanel'),acceptedCount=q('acceptedCount'),modifiedCount=q('modifiedCount'),rejectedCount=q('rejectedCount'),researchNotice=q('researchNotice');

  let draft=null,understanding=null,research=null,proposals=[],decisions={},index=0,inputFingerprint='',contractVersion='';
  const parse=v=>{try{return JSON.parse(v)}catch{return null}};
  const text=v=>String(v||'').trim();
  const state=()=>window.Lab2ProjectState;
  const token=()=>text(window.Lab2Auth?.getAccessToken?.()||parse(localStorage.getItem(AUTH_SESSION_KEY))?.access_token);
  const allDecided=()=>proposals.length>=MIN_PROPOSALS&&proposals.every(p=>['ACCEPTED','MODIFIED','REJECTED'].includes(decisions?.[p.id]?.status));

  function showError(message){errorBox.textContent=message;errorBox.hidden=false;loadingBox.hidden=true;reviewSection.hidden=true}
  function errorLabel(code){
    if(code==='LAB_ACCESS_UNCONFIGURED')return 'Le groupe autorisé à tester 4b4c2 n’est pas configuré.';
    if(code==='LAB_ACCESS_DENIED')return 'Ce compte n’est pas autorisé à tester 4b4c2.';
    if(code==='UNAUTHORIZED')return 'Ta session doit être renouvelée.';
    if(code==='UNDERSTANDING_REQUIRED')return 'La compréhension confirmée n’est pas compatible avec cette étape.';
    if(code==='RESEARCH_INCOMPATIBLE')return 'La recherche enregistrée est devenue obsolète. Reviens à Explorer.';
    if(code==='AI_CAPACITY')return 'La capacité IA est momentanément atteinte. Aucune relance automatique ne sera faite.';
    if(code==='AI_OUTPUT_INCOMPLETE')return 'L’IA n’a pas produit au moins trois propositions concrètes. Cette réponse est rejetée ; elle ne signifie pas que l’idée n’a rien à améliorer.';
    if(code==='LAB_IMPROVEMENTS_DISABLED')return 'Cette étape du Lab est désactivée.';
    return 'Impossible de produire des propositions exploitables pour le moment. Les décisions déjà enregistrées restent intactes.';
  }

  async function loadContext(){
    const api=state(),raw=api?.getArtifact('rawIdea'),u=api?.getArtifact('understanding'),r=api?.getArtifact('research');
    draft=raw?.data||null;understanding=u?.data?.understanding||null;research=r?.data||null;
    const ready=Boolean(
      draft?.name&&u?.status==='CONFIRMED'&&u?.confirmed&&understanding?.contract_version===EXPECTED_UNDERSTANDING&&
      (!research||r?.status!=='STALE')&&(!research||research?.contract_version===EXPECTED_RESEARCH)
    );
    blockedPanel.hidden=ready;actionPanel.hidden=!ready;if(!ready)return;
    ideaName.textContent=draft.name;ideaSummary.textContent=understanding.one_liner;
    const level=research?.quality?.level||'UNAVAILABLE';
    if(researchNotice){
      researchNotice.hidden=false;researchNotice.dataset.state=level==='FULL'?'observed':'limited';
      researchNotice.textContent=level==='FULL'?'Des faits publics vérifiés pourront étayer certaines propositions.':level==='PARTIAL'?'La recherche est partielle : les faits observés seront distingués du raisonnement produit.':'Aucun fait concurrentiel exploitable n’est requis pour continuer : les propositions utiliseront ton idée et du raisonnement produit sans inventer de concurrence.';
    }
    inputFingerprint=await api.hash({rawIdea:raw.outputFingerprint,understanding:u.outputFingerprint,research:r?.outputFingerprint||null});
    const artifact=api.getArtifact('improvements');
    if(artifact?.status!=='STALE'&&artifact?.inputFingerprint===inputFingerprint&&artifact?.contractVersion===EXPECTED_IMPROVEMENTS&&artifact?.data?.proposals?.length>=MIN_PROPOSALS){
      proposals=artifact.data.proposals;decisions=artifact.data.decisions||{};contractVersion=artifact.contractVersion;index=firstUndecidedIndex();reviewSection.hidden=false;renderCurrent();
    }
  }

  function firstUndecidedIndex(){const found=proposals.findIndex(p=>!['ACCEPTED','MODIFIED','REJECTED'].includes(decisions?.[p.id]?.status));return found<0?proposals.length:found}
  async function persist(statusOverride=null){
    const api=state();if(!api)return;
    const complete=allDecided(),status=statusOverride||(complete?'CONFIRMED':'NEEDS_INPUT');
    const artifact=await api.setArtifact('improvements',{
      status,contractVersion:contractVersion||EXPECTED_IMPROVEMENTS,inputFingerprint,
      data:{proposals,decisions,complete},
      provenance:Object.entries(decisions).map(([id,d])=>({type:'HUMAN_DECISION',proposal_id:id,status:d.status,value:d.value||null,at:d.decidedAt}))
    });
    if(complete&&artifact.status!=='CONFIRMED')api.confirmArtifact('improvements',{expectedOutputFingerprint:artifact.outputFingerprint});
    try{localStorage.setItem(LEGACY_KEY,JSON.stringify({version:2,contractVersion,fingerprint:inputFingerprint,proposals,decisions,savedAt:new Date().toISOString()}))}catch{}
  }
  function basisLabel(v){return ({USER_IDEA:'À partir de ton idée',OBSERVED_PATTERN:'À partir de faits observés',PRODUCT_REASONING:'Raisonnement produit'}[v]||'Raisonnement produit')}
  function typeLabel(v){return ({FUNCTIONALITY:'Fonctionnalité',WORKFLOW:'Parcours',NAVIGATION:'Navigation',TRUST:'Confiance',SIMPLIFICATION:'Simplification',DIFFERENTIATION:'Différenciation',CONTENT:'Contenu',CONVERSION:'Conversion',FEASIBILITY:'Faisabilité'}[v]||'Proposition')}
  function priorityLabel(v){return ({CORE:'Essentiel',USEFUL:'Utile',OPTIONAL:'Optionnel'}[v]||'Utile')}

  function renderCurrent(){
    if(proposals.length<MIN_PROPOSALS){reviewSection.hidden=true;return}
    if(index>=proposals.length){renderSummary();return}
    summaryPanel.hidden=true;const p=proposals[index];
    progressTitle.textContent=`Proposition ${index+1} sur ${proposals.length}`;decisionCount.textContent=`${Object.keys(decisions).length}/${proposals.length} décidée(s)`;
    proposalType.textContent=typeLabel(p.type);proposalPriority.textContent=priorityLabel(p.priority);proposalTitle.textContent=p.title;proposalText.textContent=p.proposal;proposalWhy.textContent=p.why;proposalBasis.textContent=p.evidence_note?`${basisLabel(p.source_basis)} · ${p.evidence_note}`:basisLabel(p.source_basis);changeWarning.hidden=!p.changes_original_idea;modifyBox.hidden=true;modifyText.value=p.proposal;
  }
  function renderSummary(){
    const values=Object.values(decisions);acceptedCount.textContent=String(values.filter(x=>x.status==='ACCEPTED').length);modifiedCount.textContent=String(values.filter(x=>x.status==='MODIFIED').length);rejectedCount.textContent=String(values.filter(x=>x.status==='REJECTED').length);summaryPanel.hidden=false;decisionCount.textContent=`${values.length}/${proposals.length} décidée(s)`;
  }
  async function decide(status,value=null){
    const p=proposals[index];if(!p)return;decisions[p.id]={status,value,decidedAt:new Date().toISOString()};await persist();index=firstUndecidedIndex();renderCurrent();
  }
  async function callApi(){
    const access=token();if(!access){window.Lab2Auth?.goToLogin?.();throw Object.assign(new Error('UNAUTHORIZED'),{code:'UNAUTHORIZED'})}
    const response=await fetch('/api/lab2/improvements',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${access}`},body:JSON.stringify({name:draft.name,original_description:draft.description||'',understanding,research})});
    const payload=await response.json().catch(()=>({}));if(!response.ok||!payload?.ok)throw Object.assign(new Error(payload?.error||'AI_ERROR'),{code:payload?.error||'AI_ERROR'});
    if(payload.contract_version!==EXPECTED_IMPROVEMENTS||!Array.isArray(payload.proposals)||payload.proposals.length<MIN_PROPOSALS)throw Object.assign(new Error('AI_OUTPUT_INCOMPLETE'),{code:'AI_OUTPUT_INCOMPLETE'});
    return payload;
  }

  generateButton.addEventListener('click',async()=>{
    generateButton.disabled=true;loadingBox.hidden=false;errorBox.hidden=true;state()?.markStatus('improvements','RUNNING');
    try{const payload=await callApi();proposals=payload.proposals;contractVersion=payload.contract_version;decisions={};index=0;await persist('NEEDS_INPUT');reviewSection.hidden=false;renderCurrent()}
    catch(error){state()?.markStatus('improvements','ERROR',{reason:error?.code||'AI_ERROR'});showError(errorLabel(error?.code))}
    finally{loadingBox.hidden=true;generateButton.disabled=false}
  });
  rejectButton.addEventListener('click',()=>void decide('REJECTED'));
  acceptButton.addEventListener('click',()=>void decide('ACCEPTED'));
  modifyButton.addEventListener('click',()=>{modifyBox.hidden=false;modifyText.focus()});cancelModify.addEventListener('click',()=>{modifyBox.hidden=true});
  saveModify.addEventListener('click',()=>{const value=text(modifyText.value);if(value)void decide('MODIFIED',value)});
  void loadContext();
})();
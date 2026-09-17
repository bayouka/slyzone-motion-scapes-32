(() => {
  'use strict';

  const DRAFT_KEY='4b4c2.lab2.idea-studio.slice1.v1';
  const UNDERSTANDING_KEY='4b4c2.lab2.idea-understanding.slice2.v1';
  const CONFIRMATION_KEY='4b4c2.lab2.idea-understanding-confirmed.slice2.v1';
  const RESEARCH_KEY='4b4c2.lab2.idea-research.slice3.v1';
  const IMPROVEMENTS_KEY='4b4c2.lab2.idea-improvements.slice4.v1';
  const AUTH_SESSION_KEY='4b4c.supabase.session.v2';

  const q=(id)=>document.getElementById(id);
  const ideaName=q('ideaName'),ideaSummary=q('ideaSummary'),blockedPanel=q('blockedPanel'),actionPanel=q('actionPanel');
  const generateButton=q('generateButton'),loadingBox=q('loadingBox'),errorBox=q('errorBox'),reviewSection=q('reviewSection');
  const progressTitle=q('progressTitle'),decisionCount=q('decisionCount'),proposalType=q('proposalType'),proposalPriority=q('proposalPriority');
  const proposalTitle=q('proposalTitle'),proposalText=q('proposalText'),proposalWhy=q('proposalWhy'),proposalBasis=q('proposalBasis'),changeWarning=q('changeWarning');
  const rejectButton=q('rejectButton'),modifyButton=q('modifyButton'),acceptButton=q('acceptButton'),modifyBox=q('modifyBox'),modifyText=q('modifyText'),cancelModify=q('cancelModify'),saveModify=q('saveModify');
  const summaryPanel=q('summaryPanel'),acceptedCount=q('acceptedCount'),modifiedCount=q('modifiedCount'),rejectedCount=q('rejectedCount');
  const researchNotice=q('researchNotice');

  let draft=null,understanding=null,research=null,proposals=[],index=0,decisions={},contextFingerprint='';
  const parse=(v)=>{try{return JSON.parse(v)}catch{return null}};
  const text=(v)=>String(v||'').trim();
  const meaningful=(v)=>{const n=text(v).toLowerCase();return n.length>=8&&!['non déterminé','non determine','à préciser','a preciser','inconnu','non précisé','non precise'].includes(n)};
  const token=()=>text(window.Lab2Auth?.getAccessToken?.()||parse(localStorage.getItem(AUTH_SESSION_KEY))?.access_token);
  const fingerprint=async(value)=>{const data=new TextEncoder().encode(JSON.stringify(value));const digest=await crypto.subtle.digest('SHA-256',data);return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('')};

  function showError(message){errorBox.textContent=message;errorBox.hidden=false;loadingBox.hidden=true}
  function errorLabel(code){
    if(code==='LAB_ACCESS_UNCONFIGURED')return 'Le groupe autorisé à tester 4b4c2 n’est pas configuré.';
    if(code==='LAB_ACCESS_DENIED')return 'Ce compte n’est pas autorisé à tester 4b4c2.';
    if(code==='UNAUTHORIZED')return 'Ta session doit être renouvelée. La page de connexion va s’ouvrir si nécessaire.';
    if(code==='AI_CAPACITY')return 'La capacité IA est momentanément atteinte. Aucune relance automatique n’est effectuée.';
    if(code==='LAB_IMPROVEMENTS_DISABLED')return 'Cette étape du Lab est volontairement désactivée. Aucun crédit n’a été consommé.';
    return 'Impossible de générer les propositions pour le moment. Tes décisions précédentes restent intactes.';
  }

  async function loadContext(){
    draft=parse(localStorage.getItem(DRAFT_KEY));
    const understandingCache=parse(localStorage.getItem(UNDERSTANDING_KEY));
    const confirmation=parse(localStorage.getItem(CONFIRMATION_KEY));
    understanding=understandingCache?.response?.understanding||null;
    research=parse(localStorage.getItem(RESEARCH_KEY))?.response||null;

    const confirmationMatches=Boolean(
      confirmation?.version===1&&confirmation?.confirmed===true&&confirmation?.baseFingerprint&&
      confirmation.baseFingerprint===understandingCache?.baseFingerprint
    );
    const ready=Boolean(draft?.name&&meaningful(understanding?.one_liner)&&meaningful(understanding?.problem)&&confirmationMatches);
    blockedPanel.hidden=ready;actionPanel.hidden=!ready;
    if(!ready)return;

    ideaName.textContent=draft.name;
    ideaSummary.textContent=understanding.one_liner;

    const observed=[...(Array.isArray(research?.references)?research.references:[]),...(Array.isArray(research?.competitors)?research.competitors:[])]
      .some(source=>source?.fetch_status==='OBSERVED_PUBLIC'&&Array.isArray(source?.findings)&&source.findings.length>0);
    const discoveryConfigured=research?.discovery?.configured===true;
    if(researchNotice){
      researchNotice.hidden=false;
      researchNotice.dataset.state=observed?'observed':'limited';
      researchNotice.textContent=observed
        ? 'Des faits publics vérifiés sont disponibles et pourront être utilisés comme source.'
        : discoveryConfigured
          ? 'Aucun fait concurrentiel suffisamment vérifié n’a été retenu. Les propositions reposeront sur ton idée et sur du raisonnement produit.'
          : 'Recherche Web limitée sur cette preview. Les propositions continueront sans inventer de pratiques concurrentes.';
    }

    contextFingerprint=await fingerprint({
      draft:{name:draft.name,description:draft.description||'',references:Array.isArray(draft.references)?draft.references:[]},
      understanding,
      confirmedBaseFingerprint:confirmation.baseFingerprint,
      research:research||null
    });

    const cached=parse(localStorage.getItem(IMPROVEMENTS_KEY));
    if(cached?.version===1&&cached?.fingerprint===contextFingerprint&&Array.isArray(cached.proposals)){
      proposals=cached.proposals;decisions=cached.decisions||{};index=0;reviewSection.hidden=false;renderCurrent();
    }
  }

  function save(){
    try{localStorage.setItem(IMPROVEMENTS_KEY,JSON.stringify({version:1,fingerprint:contextFingerprint,proposals,decisions,savedAt:new Date().toISOString()}))}catch{}
  }

  function basisLabel(v){return ({USER_IDEA:'À partir de ton idée',OBSERVED_PATTERN:'À partir de faits observés',PRODUCT_REASONING:'Raisonnement produit'}[v]||'Raisonnement produit')}
  function typeLabel(v){return ({FUNCTIONALITY:'Fonctionnalité',WORKFLOW:'Workflow',NAVIGATION:'Navigation',TRUST:'Confiance',SIMPLIFICATION:'Simplification',DIFFERENTIATION:'Différenciation'}[v]||'Proposition')}
  function priorityLabel(v){return ({CORE:'Essentiel',USEFUL:'Utile',OPTIONAL:'Optionnel'}[v]||'Utile')}

  function renderCurrent(){
    if(!proposals.length){reviewSection.hidden=true;return}
    if(index>=proposals.length){renderSummary();return}
    summaryPanel.hidden=true;const p=proposals[index];
    progressTitle.textContent=`Proposition ${index+1} sur ${proposals.length}`;
    decisionCount.textContent=`${Object.keys(decisions).length}/${proposals.length} décidée(s)`;
    proposalType.textContent=typeLabel(p.type);proposalPriority.textContent=priorityLabel(p.priority);
    proposalTitle.textContent=p.title;proposalText.textContent=p.proposal;proposalWhy.textContent=p.why;
    proposalBasis.textContent=p.evidence_note?`${basisLabel(p.source_basis)} · ${p.evidence_note}`:basisLabel(p.source_basis);
    changeWarning.hidden=!p.changes_original_idea;modifyBox.hidden=true;modifyText.value=p.proposal;
  }

  function decide(status,value=null){
    const p=proposals[index];if(!p)return;
    decisions[p.id]={status,value,decidedAt:new Date().toISOString()};save();index+=1;renderCurrent();
  }

  function renderSummary(){
    const values=Object.values(decisions);
    acceptedCount.textContent=String(values.filter(x=>x.status==='ACCEPTED').length);
    modifiedCount.textContent=String(values.filter(x=>x.status==='MODIFIED').length);
    rejectedCount.textContent=String(values.filter(x=>x.status==='REJECTED').length);
    summaryPanel.hidden=false;
  }

  async function callApi(){
    const access=token();
    if(!access){window.Lab2Auth?.goToLogin?.();throw Object.assign(new Error('UNAUTHORIZED'),{code:'UNAUTHORIZED'})}
    const response=await fetch('/api/lab2/improvements',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${access}`},body:JSON.stringify({name:draft.name,understanding,research})});
    const payload=await response.json().catch(()=>({}));
    if(!response.ok||!payload?.ok)throw Object.assign(new Error(payload?.error||'AI_ERROR'),{code:payload?.error||'AI_ERROR'});
    return payload;
  }

  generateButton.addEventListener('click',async()=>{
    generateButton.disabled=true;loadingBox.hidden=false;errorBox.hidden=true;
    try{
      const payload=await callApi();
      proposals=Array.isArray(payload.proposals)?payload.proposals:[];decisions={};index=0;save();
      if(!proposals.length){showError('Aucune proposition suffisamment utile n’a été produite. Ton idée reste inchangée.');return}
      reviewSection.hidden=false;renderCurrent();
    }catch(error){showError(errorLabel(error?.code))}
    finally{loadingBox.hidden=true;generateButton.disabled=false}
  });
  rejectButton.addEventListener('click',()=>decide('REJECTED'));
  acceptButton.addEventListener('click',()=>decide('ACCEPTED'));
  modifyButton.addEventListener('click',()=>{modifyBox.hidden=false;modifyText.focus()});
  cancelModify.addEventListener('click',()=>{modifyBox.hidden=true});
  saveModify.addEventListener('click',()=>{const value=text(modifyText.value);if(value)decide('MODIFIED',value)});
  void loadContext();
})();
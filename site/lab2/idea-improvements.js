(() => {
  'use strict';

  const DRAFT_KEY='4b4c2.lab2.idea-studio.slice1.v1';
  const UNDERSTANDING_KEY='4b4c2.lab2.idea-understanding.slice2.v1';
  const CONFIRMATION_KEY='4b4c2.lab2.idea-understanding-confirmed.slice2.v1';
  const RESEARCH_KEY='4b4c2.lab2.idea-research.slice3.v1';
  const IMPROVEMENTS_KEY='4b4c2.lab2.idea-improvements.slice4.v1';
  const AUTH_SESSION_KEY='4b4c.supabase.session.v2';
  const EXPECTED_UNDERSTANDING_CONTRACT='lab2-understanding-v2';
  const EXPECTED_IMPROVEMENTS_CONTRACT='lab2-improvements-v2';
  const MIN_PROPOSALS=3;

  const q=(id)=>document.getElementById(id);
  const ideaName=q('ideaName'),ideaSummary=q('ideaSummary'),blockedPanel=q('blockedPanel'),actionPanel=q('actionPanel');
  const generateButton=q('generateButton'),loadingBox=q('loadingBox'),errorBox=q('errorBox'),reviewSection=q('reviewSection');
  const progressTitle=q('progressTitle'),decisionCount=q('decisionCount'),proposalType=q('proposalType'),proposalPriority=q('proposalPriority');
  const proposalTitle=q('proposalTitle'),proposalText=q('proposalText'),proposalWhy=q('proposalWhy'),proposalBasis=q('proposalBasis'),changeWarning=q('changeWarning');
  const rejectButton=q('rejectButton'),modifyButton=q('modifyButton'),acceptButton=q('acceptButton'),modifyBox=q('modifyBox'),modifyText=q('modifyText'),cancelModify=q('cancelModify'),saveModify=q('saveModify');
  const summaryPanel=q('summaryPanel'),acceptedCount=q('acceptedCount'),modifiedCount=q('modifiedCount'),rejectedCount=q('rejectedCount');
  const researchNotice=q('researchNotice');

  let draft=null,understanding=null,research=null,proposals=[],index=0,decisions={},contextFingerprint='',contractVersion='';
  const parse=(v)=>{try{return JSON.parse(v)}catch{return null}};
  const text=(v)=>String(v||'').trim();
  const meaningful=(v)=>text(v).length>=20;
  const token=()=>text(window.Lab2Auth?.getAccessToken?.()||parse(localStorage.getItem(AUTH_SESSION_KEY))?.access_token);
  const fingerprint=async(value)=>{const data=new TextEncoder().encode(JSON.stringify(value));const digest=await crypto.subtle.digest('SHA-256',data);return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('')};

  function showError(message){errorBox.textContent=message;errorBox.hidden=false;loadingBox.hidden=true;reviewSection.hidden=true}
  function errorLabel(code){
    if(code==='LAB_ACCESS_UNCONFIGURED')return 'Le groupe autorisé à tester 4b4c2 n’est pas configuré.';
    if(code==='LAB_ACCESS_DENIED')return 'Ce compte n’est pas autorisé à tester 4b4c2.';
    if(code==='UNAUTHORIZED')return 'Ta session doit être renouvelée. La page de connexion va s’ouvrir si nécessaire.';
    if(code==='UNDERSTANDING_REQUIRED')return 'La compréhension de l’idée n’est pas assez structurée pour proposer des améliorations fiables. Reviens à l’étape Comprendre.';
    if(code==='AI_CAPACITY')return 'La capacité IA est momentanément atteinte. Aucune relance automatique n’est effectuée.';
    if(code==='AI_OUTPUT_INCOMPLETE')return 'La réponse IA n’a pas produit au moins trois propositions concrètes. Elle est considérée comme invalide, pas comme la preuve que ton idée n’a rien à améliorer. Tu peux relancer manuellement.';
    if(code==='LAB_IMPROVEMENTS_DISABLED')return 'Cette étape du Lab est volontairement désactivée. Aucun crédit n’a été consommé.';
    return 'Impossible de générer des propositions exploitables pour le moment. Ton idée et tes décisions précédentes restent intactes.';
  }

  async function loadContext(){
    draft=parse(localStorage.getItem(DRAFT_KEY));
    const understandingCache=parse(localStorage.getItem(UNDERSTANDING_KEY));
    const confirmation=parse(localStorage.getItem(CONFIRMATION_KEY));
    understanding=understandingCache?.response?.understanding||null;
    research=parse(localStorage.getItem(RESEARCH_KEY))?.response||null;

    const confirmationMatches=Boolean(
      confirmation?.version===1&&confirmation?.confirmed===true&&
      confirmation?.understandingContract===EXPECTED_UNDERSTANDING_CONTRACT&&
      confirmation?.baseFingerprint&&confirmation.baseFingerprint===understandingCache?.baseFingerprint
    );
    const ready=Boolean(
      draft?.name&&meaningful(understanding?.one_liner)&&meaningful(understanding?.problem)&&
      understanding?.contract_version===EXPECTED_UNDERSTANDING_CONTRACT&&
      Array.isArray(understanding?.target_users)&&understanding.target_users.length>=1&&
      Array.isArray(understanding?.main_flow)&&understanding.main_flow.length>=2&&confirmationMatches
    );
    blockedPanel.hidden=ready;actionPanel.hidden=!ready;
    if(!ready)return;

    ideaName.textContent=draft.name;
    ideaSummary.textContent=understanding.one_liner;

    const researchLevel=research?.contract_version==='lab2-research-v2'?research?.quality?.level:'UNAVAILABLE';
    if(researchNotice){
      researchNotice.hidden=false;
      researchNotice.dataset.state=researchLevel==='FULL'?'observed':'limited';
      researchNotice.textContent=researchLevel==='FULL'
        ? 'Des faits publics vérifiés sont disponibles et pourront être utilisés comme source.'
        : researchLevel==='PARTIAL'
          ? 'La recherche n’est que partielle. Les propositions distingueront clairement les faits observés du raisonnement produit.'
          : 'Aucune recherche concurrentielle exploitable n’est disponible. Les propositions reposeront sur ton idée et sur du raisonnement produit, sans inventer de pratiques concurrentes.';
    }

    contextFingerprint=await fingerprint({
      draft:{name:draft.name,description:draft.description||'',references:Array.isArray(draft.references)?draft.references:[]},
      understanding,confirmedBaseFingerprint:confirmation.baseFingerprint,research:research||null
    });

    const cached=parse(localStorage.getItem(IMPROVEMENTS_KEY));
    if(cached?.version===1&&cached?.fingerprint===contextFingerprint&&cached?.contractVersion===EXPECTED_IMPROVEMENTS_CONTRACT&&Array.isArray(cached.proposals)&&cached.proposals.length>=MIN_PROPOSALS){
      proposals=cached.proposals;decisions=cached.decisions||{};contractVersion=cached.contractVersion;index=0;reviewSection.hidden=false;renderCurrent();
    }else if(cached){
      localStorage.removeItem(IMPROVEMENTS_KEY);
    }
  }

  function save(){
    try{localStorage.setItem(IMPROVEMENTS_KEY,JSON.stringify({version:1,contractVersion,fingerprint:contextFingerprint,proposals,decisions,savedAt:new Date().toISOString()}))}catch{}
  }

  function basisLabel(v){return ({USER_IDEA:'À partir de ton idée',OBSERVED_PATTERN:'À partir de faits observés',PRODUCT_REASONING:'Raisonnement produit'}[v]||'Raisonnement produit')}
  function typeLabel(v){return ({FUNCTIONALITY:'Fonctionnalité',WORKFLOW:'Parcours',NAVIGATION:'Navigation',TRUST:'Confiance',SIMPLIFICATION:'Simplification',DIFFERENTIATION:'Différenciation',CONTENT:'Contenu',CONVERSION:'Conversion'}[v]||'Proposition')}
  function priorityLabel(v){return ({CORE:'Essentiel',USEFUL:'Utile',OPTIONAL:'Optionnel'}[v]||'Utile')}

  function renderCurrent(){
    if(proposals.length<MIN_PROPOSALS){reviewSection.hidden=true;return}
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
    const response=await fetch('/api/lab2/improvements',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${access}`},body:JSON.stringify({
      name:draft.name,original_description:draft.description||'',understanding,research
    })});
    const payload=await response.json().catch(()=>({}));
    if(!response.ok||!payload?.ok)throw Object.assign(new Error(payload?.error||'AI_ERROR'),{code:payload?.error||'AI_ERROR'});
    if(payload.contract_version!==EXPECTED_IMPROVEMENTS_CONTRACT||!Array.isArray(payload.proposals)||payload.proposals.length<MIN_PROPOSALS){
      throw Object.assign(new Error('AI_OUTPUT_INCOMPLETE'),{code:'AI_OUTPUT_INCOMPLETE'});
    }
    return payload;
  }

  generateButton.addEventListener('click',async()=>{
    generateButton.disabled=true;loadingBox.hidden=false;errorBox.hidden=true;
    try{
      const payload=await callApi();
      proposals=payload.proposals;contractVersion=payload.contract_version;decisions={};index=0;save();
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
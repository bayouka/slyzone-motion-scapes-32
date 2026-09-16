(() => {
  'use strict';
  const DRAFT_KEY='4b4c2.lab2.idea-studio.slice1.v1';
  const UNDERSTANDING_KEY='4b4c2.lab2.idea-understanding.slice2.v1';
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

  let draft=null,understanding=null,research=null,proposals=[],index=0,decisions={};
  const parse=(v)=>{try{return JSON.parse(v)}catch{return null}};
  const text=(v)=>String(v||'').trim();
  const token=()=>text(parse(localStorage.getItem(AUTH_SESSION_KEY))?.access_token);

  function loadContext(){
    draft=parse(localStorage.getItem(DRAFT_KEY));
    understanding=parse(localStorage.getItem(UNDERSTANDING_KEY))?.response?.understanding||null;
    research=parse(localStorage.getItem(RESEARCH_KEY))?.response||null;
    const ready=Boolean(draft?.name&&understanding?.one_liner&&understanding?.problem);
    blockedPanel.hidden=ready;actionPanel.hidden=!ready;
    if(!ready)return;
    ideaName.textContent=draft.name;ideaSummary.textContent=understanding.one_liner;
    const cached=parse(localStorage.getItem(IMPROVEMENTS_KEY));
    if(cached?.version===1&&Array.isArray(cached.proposals)){
      proposals=cached.proposals;decisions=cached.decisions||{};index=0;reviewSection.hidden=false;renderCurrent();
    }
  }

  function save(){
    try{localStorage.setItem(IMPROVEMENTS_KEY,JSON.stringify({version:1,proposals,decisions,savedAt:new Date().toISOString()}))}catch{}
  }

  function basisLabel(v){return ({USER_IDEA:'À partir de ton idée',OBSERVED_PATTERN:'À partir de pratiques observées',PRODUCT_REASONING:'Raisonnement produit'}[v]||'Raisonnement produit')}
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
    const access=token();if(!access)throw Object.assign(new Error('UNAUTHORIZED'),{code:'UNAUTHORIZED'});
    const response=await fetch('/api/lab2/improvements',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${access}`},body:JSON.stringify({name:draft.name,understanding,research})});
    const payload=await response.json().catch(()=>({}));
    if(!response.ok||!payload?.ok)throw Object.assign(new Error(payload?.error||'AI_ERROR'),{code:payload?.error||'AI_ERROR'});
    return payload;
  }

  generateButton.addEventListener('click',async()=>{
    generateButton.disabled=true;loadingBox.hidden=false;errorBox.hidden=true;
    try{const payload=await callApi();proposals=Array.isArray(payload.proposals)?payload.proposals:[];decisions={};index=0;save();reviewSection.hidden=false;renderCurrent()}
    catch(error){errorBox.hidden=false;errorBox.textContent=error.code==='UNAUTHORIZED'?'Ta session 4b4c a expiré. Reconnecte-toi puis réessaie.':error.code==='LAB_IMPROVEMENTS_DISABLED'?'Cette étape du Lab est volontairement désactivée. Aucun crédit n’a été consommé.':'Impossible de générer les propositions pour le moment.'}
    finally{loadingBox.hidden=true;generateButton.disabled=false}
  });
  rejectButton.addEventListener('click',()=>decide('REJECTED'));
  acceptButton.addEventListener('click',()=>decide('ACCEPTED'));
  modifyButton.addEventListener('click',()=>{modifyBox.hidden=false;modifyText.focus()});
  cancelModify.addEventListener('click',()=>{modifyBox.hidden=true});
  saveModify.addEventListener('click',()=>{const value=text(modifyText.value);if(value)decide('MODIFIED',value)});
  loadContext();
})();
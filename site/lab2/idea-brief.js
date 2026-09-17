(() => {
  'use strict';
  const DRAFT_KEY='4b4c2.lab2.idea-studio.slice1.v1';
  const UNDERSTANDING_KEY='4b4c2.lab2.idea-understanding.slice2.v1';
  const IMPROVEMENTS_KEY='4b4c2.lab2.idea-improvements.slice4.v1';
  const BRIEF_KEY='4b4c2.lab2.idea-brief.slice5.v1';
  const AUTH_SESSION_KEY='4b4c.supabase.session.v2';
  const EXPECTED_UNDERSTANDING_CONTRACT='lab2-understanding-v2';
  const EXPECTED_IMPROVEMENTS_CONTRACT='lab2-improvements-v2';
  const MIN_PROPOSALS=3;

  const q=(id)=>document.getElementById(id);
  const blockedPanel=q('blockedPanel'),actionPanel=q('actionPanel'),ideaName=q('ideaName'),ideaSummary=q('ideaSummary'),decisionSummary=q('decisionSummary');
  const generateButton=q('generateButton'),loadingBox=q('loadingBox'),errorBox=q('errorBox'),briefSection=q('briefSection');
  const briefOneLiner=q('briefOneLiner'),briefPitch=q('briefPitch'),briefProblem=q('briefProblem'),briefSolution=q('briefSolution');
  const briefUsers=q('briefUsers'),briefFeatures=q('briefFeatures'),briefFlow=q('briefFlow'),briefDifferentiators=q('briefDifferentiators'),briefQuestions=q('briefQuestions'),retainedList=q('retainedList');

  let draft=null,understanding=null,improvements=null,fingerprintValue='';
  const parse=(v)=>{try{return JSON.parse(v)}catch{return null}};
  const text=(v)=>String(v||'').trim();
  const token=()=>text(window.Lab2Auth?.getAccessToken?.()||parse(localStorage.getItem(AUTH_SESSION_KEY))?.access_token);
  const fingerprint=async(value)=>{const data=new TextEncoder().encode(JSON.stringify(value));const digest=await crypto.subtle.digest('SHA-256',data);return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('')};

  function decisionStats(){
    const values=Object.values(improvements?.decisions||{});
    return {accepted:values.filter(x=>x?.status==='ACCEPTED').length,modified:values.filter(x=>x?.status==='MODIFIED').length,rejected:values.filter(x=>x?.status==='REJECTED').length,total:values.length};
  }
  function decisionsComplete(){
    const proposals=Array.isArray(improvements?.proposals)?improvements.proposals:[];
    const decisions=improvements?.decisions||{};
    return proposals.length>=MIN_PROPOSALS&&proposals.every(p=>['ACCEPTED','MODIFIED','REJECTED'].includes(decisions?.[p.id]?.status));
  }
  function renderDecisionSummary(){
    decisionSummary.innerHTML='';const stats=decisionStats();
    for(const [value,label] of [[stats.accepted,'acceptée(s)'],[stats.modified,'modifiée(s)'],[stats.rejected,'refusée(s)']]){const item=document.createElement('span');item.textContent=`${value} ${label}`;decisionSummary.appendChild(item)}
  }
  function renderList(node,items,emptyText){
    node.innerHTML='';const values=Array.isArray(items)?items.filter(Boolean):[];
    if(!values.length){const li=document.createElement('li');li.textContent=emptyText;node.appendChild(li);return}
    values.forEach(value=>{const li=document.createElement('li');li.textContent=value;node.appendChild(li)});
  }
  function renderRetained(items){
    retainedList.innerHTML='';const values=Array.isArray(items)?items:[];
    if(!values.length){retainedList.textContent='Aucune amélioration supplémentaire n’a été ajoutée à l’idée.';return}
    values.forEach(item=>{const card=document.createElement('div');card.className='retained-item';const strong=document.createElement('strong');strong.textContent=item.title||'Amélioration retenue';const span=document.createElement('span');span.textContent=item.text||'';card.append(strong,span);retainedList.appendChild(card)});
  }
  function render(payload){
    const brief=payload?.brief||{};
    briefOneLiner.textContent=brief.one_liner||'';briefPitch.textContent=brief.short_pitch||'';briefProblem.textContent=brief.problem||'';briefSolution.textContent=brief.solution||'';
    renderList(briefUsers,brief.target_users,'Public encore à préciser.');
    renderList(briefFeatures,brief.core_features,'Aucune fonctionnalité supplémentaire formalisée.');
    renderList(briefFlow,brief.main_flow,'Workflow encore à préciser.');
    renderList(briefDifferentiators,brief.differentiators,'Aucune différence claire n’est encore établie.');
    renderList(briefQuestions,brief.open_questions,'Aucune question ouverte importante détectée.');
    renderRetained(payload?.retained_improvements);briefSection.hidden=false;errorBox.hidden=true;loadingBox.hidden=true;
  }
  function save(payload){try{localStorage.setItem(BRIEF_KEY,JSON.stringify({version:1,fingerprint:fingerprintValue,response:payload,savedAt:new Date().toISOString()}))}catch{}}

  async function loadContext(){
    draft=parse(localStorage.getItem(DRAFT_KEY));
    understanding=parse(localStorage.getItem(UNDERSTANDING_KEY))?.response?.understanding||null;
    improvements=parse(localStorage.getItem(IMPROVEMENTS_KEY));
    const baseReady=Boolean(
      draft?.name&&draft?.description&&understanding?.contract_version===EXPECTED_UNDERSTANDING_CONTRACT&&understanding?.one_liner&&understanding?.problem&&
      improvements?.version===1&&improvements?.contractVersion===EXPECTED_IMPROVEMENTS_CONTRACT&&Array.isArray(improvements?.proposals)&&improvements.proposals.length>=MIN_PROPOSALS
    );
    const ready=baseReady&&decisionsComplete();blockedPanel.hidden=ready;actionPanel.hidden=!ready;if(!ready)return;
    ideaName.textContent=draft.name;ideaSummary.textContent=understanding.one_liner;renderDecisionSummary();
    fingerprintValue=await fingerprint({name:draft.name,description:draft.description,references:draft.references||[],understanding,contractVersion:improvements.contractVersion,proposals:improvements.proposals,decisions:improvements.decisions||{}});
    const cached=parse(localStorage.getItem(BRIEF_KEY));if(cached?.version===1&&cached?.fingerprint===fingerprintValue&&cached?.response?.ok)render(cached.response);
  }

  async function callApi(){
    const access=token();if(!access){window.Lab2Auth?.goToLogin?.();throw Object.assign(new Error('UNAUTHORIZED'),{code:'UNAUTHORIZED',status:401})}
    const response=await fetch('/api/lab2/brief',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${access}`},body:JSON.stringify({name:draft.name,original_description:draft.description,references:Array.isArray(draft.references)?draft.references:[],understanding,proposals:improvements.proposals,decisions:improvements.decisions||{}})});
    const payload=await response.json().catch(()=>({}));if(!response.ok||!payload?.ok)throw Object.assign(new Error(payload?.error||'BRIEF_ERROR'),{code:payload?.error||'BRIEF_ERROR',status:response.status});return payload;
  }
  function errorLabel(error){
    if(error?.code==='LAB_BRIEF_DISABLED')return 'Cette étape du Lab est volontairement désactivée. Aucun crédit n’a été consommé.';
    if(error?.code==='IMPROVEMENT_DECISIONS_INCOMPLETE')return 'Toutes les propositions doivent d’abord avoir une décision.';
    if(error?.code==='UNAUTHORIZED')return 'Ta session a expiré. Reconnecte-toi depuis l’accès au Lab puis réessaie.';
    if(error?.code==='AI_CAPACITY')return 'Le quota ou la capacité IA est momentanément atteint. Aucune relance automatique n’est effectuée.';
    return 'Impossible de consolider l’idée pour le moment. Les décisions locales sont intactes.';
  }

  generateButton.addEventListener('click',async()=>{generateButton.disabled=true;loadingBox.hidden=false;errorBox.hidden=true;try{const payload=await callApi();save(payload);render(payload)}catch(error){loadingBox.hidden=true;errorBox.hidden=false;errorBox.textContent=errorLabel(error)}finally{generateButton.disabled=false}});
  void loadContext();
})();
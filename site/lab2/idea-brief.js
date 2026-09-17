(() => {
  'use strict';
  const LEGACY_KEY='4b4c2.lab2.idea-brief.slice5.v1';
  const AUTH_SESSION_KEY='4b4c.supabase.session.v2';
  const EXPECTED_UNDERSTANDING='lab2-understanding-v4';
  const EXPECTED_IMPROVEMENTS='lab2-improvements-v3';
  const EXPECTED_DEFINITION='lab2-definition-v1';

  const q=id=>document.getElementById(id);
  const blockedPanel=q('blockedPanel'),actionPanel=q('actionPanel'),ideaName=q('ideaName'),ideaSummary=q('ideaSummary'),decisionSummary=q('decisionSummary');
  const generateButton=q('generateButton'),loadingBox=q('loadingBox'),errorBox=q('errorBox'),briefSection=q('briefSection');
  const briefOneLiner=q('briefOneLiner'),briefPitch=q('briefPitch'),briefProblem=q('briefProblem'),briefSolution=q('briefSolution');
  const briefUsers=q('briefUsers'),briefFeatures=q('briefFeatures'),briefFlow=q('briefFlow'),briefDifferentiators=q('briefDifferentiators'),briefQuestions=q('briefQuestions'),retainedList=q('retainedList');

  let draft=null,understanding=null,improvements=null,inputFingerprint='';
  const parse=v=>{try{return JSON.parse(v)}catch{return null}};
  const text=v=>String(v||'').trim();
  const token=()=>text(window.Lab2Auth?.getAccessToken?.()||parse(localStorage.getItem(AUTH_SESSION_KEY))?.access_token);
  const state=()=>window.Lab2ProjectState;

  function decisionStats(){const values=Object.values(improvements?.decisions||{});return {accepted:values.filter(x=>x?.status==='ACCEPTED').length,modified:values.filter(x=>x?.status==='MODIFIED').length,rejected:values.filter(x=>x?.status==='REJECTED').length}}
  function renderDecisionSummary(){decisionSummary.innerHTML='';const stats=decisionStats();for(const [value,label] of [[stats.accepted,'acceptée(s)'],[stats.modified,'modifiée(s)'],[stats.rejected,'refusée(s)']]){const item=document.createElement('span');item.textContent=`${value} ${label}`;decisionSummary.appendChild(item)}}
  function renderList(node,items,emptyText){node.innerHTML='';const values=Array.isArray(items)?items.filter(Boolean):[];if(!values.length){const li=document.createElement('li');li.textContent=emptyText;node.appendChild(li);return}values.forEach(value=>{const li=document.createElement('li');li.textContent=typeof value==='string'?value:value.question||String(value);node.appendChild(li)})}
  function renderRetained(items){retainedList.innerHTML='';const values=Array.isArray(items)?items:[];if(!values.length){retainedList.textContent='Aucune amélioration supplémentaire n’a été ajoutée à l’idée.';return}values.forEach(item=>{const card=document.createElement('div');card.className='retained-item';const strong=document.createElement('strong');strong.textContent=item.title||'Amélioration retenue';const span=document.createElement('span');span.textContent=item.text||'';card.append(strong,span);retainedList.appendChild(card)})}
  function render(payload){const brief=payload?.brief||payload?.definition?.brief||{};briefOneLiner.textContent=brief.one_liner||'';briefPitch.textContent=brief.short_pitch||'';briefProblem.textContent=brief.problem||'';briefSolution.textContent=brief.solution||'';renderList(briefUsers,brief.target_users,'Public encore à préciser.');renderList(briefFeatures,brief.core_features,'Aucune capacité supplémentaire validée.');renderList(briefFlow,brief.main_flow,'Workflow encore à préciser.');renderList(briefDifferentiators,brief.differentiators,'Aucune différence explicitement validée.');renderList(briefQuestions,payload?.definition?.open_decisions||brief.open_questions,'Aucune question ouverte importante.');renderRetained(payload?.retained_improvements||payload?.definition?.retained_improvements);briefSection.hidden=false;errorBox.hidden=true;loadingBox.hidden=true}
  async function save(payload){
    try{localStorage.setItem(LEGACY_KEY,JSON.stringify({version:2,fingerprint:inputFingerprint,response:payload,savedAt:new Date().toISOString()}))}catch{}
    await state().setArtifact('definition',{status:'CONFIRMED',contractVersion:payload.contract_version,inputFingerprint,data:payload.definition,provenance:[{type:'DETERMINISTIC_CONSOLIDATION',at:new Date().toISOString()},{type:'HUMAN_DECISIONS_ONLY',at:new Date().toISOString()}]});
  }
  async function loadContext(){
    const api=state(),raw=api?.getArtifact('rawIdea'),u=api?.getArtifact('understanding'),imp=api?.getArtifact('improvements');
    draft=raw?.data||null;understanding=u?.data?.understanding||null;improvements=imp?.data||null;
    const ready=Boolean(draft?.name&&u?.status==='CONFIRMED'&&u?.confirmed&&understanding?.contract_version===EXPECTED_UNDERSTANDING&&imp?.status==='CONFIRMED'&&imp?.confirmed&&imp?.contractVersion===EXPECTED_IMPROVEMENTS&&improvements?.complete===true);
    blockedPanel.hidden=ready;actionPanel.hidden=!ready;if(!ready)return;
    ideaName.textContent=draft.name;ideaSummary.textContent=understanding.one_liner;renderDecisionSummary();
    inputFingerprint=await api.hash({rawIdea:raw.outputFingerprint,understanding:u.outputFingerprint,improvements:imp.outputFingerprint});
    const def=api.getArtifact('definition');if(def?.status!=='STALE'&&def?.inputFingerprint===inputFingerprint&&def?.contractVersion===EXPECTED_DEFINITION&&def?.data){render({definition:def.data,brief:def.data.brief,retained_improvements:def.data.retained_improvements});}
  }
  async function callApi(){
    const access=token();if(!access){window.Lab2Auth?.goToLogin?.();throw Object.assign(new Error('UNAUTHORIZED'),{code:'UNAUTHORIZED',status:401})}
    const response=await fetch('/api/lab2/brief',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${access}`},body:JSON.stringify({name:draft.name,original_description:draft.description,references:Array.isArray(draft.references)?draft.references:[],understanding,improvements:{contract_version:EXPECTED_IMPROVEMENTS,proposals:improvements.proposals,decisions:improvements.decisions}})});
    const payload=await response.json().catch(()=>({}));if(!response.ok||!payload?.ok)throw Object.assign(new Error(payload?.error||'DEFINITION_ERROR'),{code:payload?.error||'DEFINITION_ERROR',status:response.status});if(payload.contract_version!==EXPECTED_DEFINITION)throw Object.assign(new Error('DEFINITION_INCOMPATIBLE'),{code:'DEFINITION_INCOMPATIBLE'});return payload;
  }
  function errorLabel(error){if(error?.code==='LAB_BRIEF_DISABLED')return 'La consolidation est désactivée sur cet environnement.';if(error?.code==='IMPROVEMENT_DECISIONS_INCOMPLETE')return 'Toutes les propositions doivent d’abord avoir une décision.';if(error?.code==='IMPROVEMENTS_INCOMPATIBLE')return 'Les décisions d’amélioration sont devenues obsolètes.';if(error?.code==='UNAUTHORIZED')return 'Ta session a expiré. Reconnecte-toi puis réessaie.';return 'Impossible de construire la version canonique pour le moment. Les décisions restent intactes.'}
  generateButton.addEventListener('click',async()=>{generateButton.disabled=true;loadingBox.hidden=false;errorBox.hidden=true;try{const payload=await callApi();await save(payload);render(payload)}catch(error){loadingBox.hidden=true;errorBox.hidden=false;errorBox.textContent=errorLabel(error)}finally{generateButton.disabled=false}});
  void loadContext();
})();
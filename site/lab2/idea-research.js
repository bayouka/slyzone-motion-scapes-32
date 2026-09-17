(() => {
  'use strict';

  const DRAFT_KEY='4b4c2.lab2.idea-studio.slice1.v1';
  const UNDERSTANDING_KEY='4b4c2.lab2.idea-understanding.slice2.v1';
  const RESEARCH_KEY='4b4c2.lab2.idea-research.slice3.v1';
  const AUTH_SESSION_KEY='4b4c.supabase.session.v2';
  const EXPECTED_UNDERSTANDING_CONTRACT='lab2-understanding-v4';
  const EXPECTED_RESEARCH_CONTRACT='lab2-research-v2';

  const q=(id)=>document.getElementById(id);
  const ideaName=q('ideaName'),ideaOneLiner=q('ideaOneLiner'),ideaProblem=q('ideaProblem'),referenceCount=q('referenceCount');
  const researchState=q('researchState'),actionPanel=q('actionPanel'),blockedPanel=q('blockedPanel'),startResearch=q('startResearch');
  const loadingBox=q('loadingBox'),errorBox=q('errorBox'),results=q('results'),referencesGrid=q('referencesGrid'),competitorsGrid=q('competitorsGrid');
  const discoveryMeta=q('discoveryMeta'),patternsList=q('patternsList'),limitationsList=q('limitationsList'),metricsGrid=q('metricsGrid');

  let draft=null,understanding=null,inputFingerprint='';
  const parse=(value)=>{try{return JSON.parse(value)}catch{return null}};
  const text=(value)=>String(value||'').trim();
  const meaningful=(value)=>text(value).length>=20;
  const accessToken=()=>text(window.Lab2Auth?.getAccessToken?.()||parse(localStorage.getItem(AUTH_SESSION_KEY))?.access_token);
  const clear=(node)=>{while(node?.firstChild)node.firstChild.remove()};

  function readCanonicalContext(){
    const state=window.Lab2ProjectState;
    const raw=state?.getArtifact?.('rawIdea');
    const understood=state?.getArtifact?.('understanding');
    if(raw?.data&&understood?.data){
      return {
        draft:raw.data,
        understanding:understood.data?.understanding||understood.data,
        confirmed:understood.status==='CONFIRMED'&&understood.confirmed===true,
        understandingContract:understood.contractVersion,
        understandingOutputFingerprint:understood.outputFingerprint
      };
    }
    const legacyDraft=parse(localStorage.getItem(DRAFT_KEY));
    const legacyCache=parse(localStorage.getItem(UNDERSTANDING_KEY));
    return {
      draft:legacyDraft,
      understanding:legacyCache?.response?.understanding||null,
      confirmed:false,
      understandingContract:legacyCache?.response?.understanding?.contract_version||null,
      understandingOutputFingerprint:null
    };
  }

  function setInitialVisualState(){loadingBox.hidden=true;errorBox.hidden=true;results.hidden=true;actionPanel.hidden=true;blockedPanel.hidden=true;}

  async function loadContext(){
    setInitialVisualState();
    const context=readCanonicalContext();draft=context.draft;understanding=context.understanding;
    if(draft?.name)ideaName.textContent=draft.name;
    if(meaningful(understanding?.one_liner))ideaOneLiner.textContent=understanding.one_liner;
    if(meaningful(understanding?.problem))ideaProblem.textContent=understanding.problem;
    const refs=Array.isArray(draft?.references)?draft.references.filter(item=>text(item?.url)):[];
    referenceCount.textContent=refs.length?`${refs.length} référence${refs.length>1?'s':''}`:'Aucune référence fournie';

    const ready=Boolean(
      draft?.name&&context.confirmed&&context.understandingContract===EXPECTED_UNDERSTANDING_CONTRACT&&
      understanding?.contract_version===EXPECTED_UNDERSTANDING_CONTRACT&&meaningful(understanding?.one_liner)&&meaningful(understanding?.problem)&&
      Array.isArray(understanding?.target_users)&&understanding.target_users.length>=1&&Array.isArray(understanding?.main_flow)&&understanding.main_flow.length>=2&&
      understanding?.needs_clarification!==true
    );
    blockedPanel.hidden=ready;actionPanel.hidden=!ready;
    if(!ready){researchState.textContent='Compréhension à confirmer';researchState.dataset.state='error';return false;}

    researchState.textContent='Prêt à rechercher';researchState.dataset.state='ready';
    inputFingerprint=await window.Lab2ProjectState.hash({
      rawIdeaFingerprint:window.Lab2ProjectState.getArtifact('rawIdea')?.outputFingerprint||null,
      understandingFingerprint:context.understandingOutputFingerprint,
      references:refs.map(({url,reason,note})=>({url,reason,note}))
    });

    const researchArtifact=window.Lab2ProjectState.getArtifact('research');
    if(researchArtifact?.data?.ok&&researchArtifact.contractVersion===EXPECTED_RESEARCH_CONTRACT&&researchArtifact.inputFingerprint===inputFingerprint&&researchArtifact.status!=='STALE'){
      render(researchArtifact.data);return true;
    }
    const legacy=parse(localStorage.getItem(RESEARCH_KEY));
    if(legacy?.response?.ok&&legacy.response.contract_version===EXPECTED_RESEARCH_CONTRACT&&legacy.fingerprint===inputFingerprint)render(legacy.response);
    return true;
  }

  function errorLabel(code,status){
    if(code==='LAB_RESEARCH_DISABLED')return 'La recherche du Lab est désactivée sur cet environnement.';
    if(code==='LAB_ACCESS_UNCONFIGURED')return 'Le groupe autorisé à tester 4b4c2 n’est pas encore configuré.';
    if(code==='LAB_ACCESS_DENIED')return 'Ce compte n’est pas autorisé à tester 4b4c2.';
    if(code==='UNAUTHORIZED')return 'Ta session a expiré. Reconnecte-toi puis réessaie.';
    if(code==='UNDERSTANDING_REQUIRED')return 'La compréhension confirmée n’est pas assez structurée pour lancer une recherche fiable.';
    if(code==='AI_CAPACITY')return 'Le quota ou la capacité IA est momentanément atteint. Aucune relance automatique ne sera effectuée.';
    if(status>=500)return 'La recherche a rencontré un problème technique. Les résultats précédents restent intacts.';
    return 'La recherche n’a pas pu être effectuée.';
  }

  const sourceTitle=(source,index)=>{try{return new URL(source.url).hostname.replace(/^www\./,'')}catch{return `Source ${index+1}`}};
  const categoryLabel=(category)=>({POSITIONING:'Positionnement',FUNCTIONALITY:'Fonctionnalité',WORKFLOW:'Workflow',NAVIGATION:'Navigation',TRUST:'Confiance',PRICING:'Tarification',OTHER:'Autre'}[category]||'Observation');
  function createSourceCard(source,index){
    const card=document.createElement('article');card.className='source-card';
    const top=document.createElement('div');top.className='source-card-top';const heading=document.createElement('div');
    const title=document.createElement('h3');title.textContent=sourceTitle(source,index);const url=document.createElement('a');url.href=source.url;url.target='_blank';url.rel='noopener noreferrer';url.textContent=source.url;heading.append(title,url);top.appendChild(heading);
    const status=document.createElement('span');status.className='source-status';status.textContent=source.fetch_status==='OBSERVED_PUBLIC'?'Page publique vérifiée':'Non vérifiée';top.appendChild(status);card.appendChild(top);
    if(source.selection_reason){const reason=document.createElement('p');reason.className='selection-reason';reason.textContent=source.selection_reason;card.appendChild(reason);}
    const findings=Array.isArray(source.findings)?source.findings:[];
    if(!findings.length){const empty=document.createElement('p');empty.className='empty-copy';empty.textContent=source.fetch_status==='OBSERVED_PUBLIC'?'La page a été lue, mais aucun constat suffisamment solide n’a été retenu.':'Cette source n’a pas pu être vérifiée à partir de contenu public exploitable.';card.appendChild(empty);return card;}
    const list=document.createElement('div');list.className='findings-list';findings.forEach(finding=>{const item=document.createElement('div');item.className='finding';const label=document.createElement('span');label.className='finding-label';label.textContent=categoryLabel(finding.category);const statement=document.createElement('p');statement.textContent=finding.statement;const evidence=document.createElement('blockquote');evidence.textContent=`Preuve publique : « ${finding.support_text} »`;item.append(label,statement,evidence);list.appendChild(item)});card.appendChild(list);return card;
  }
  function renderList(node,values,emptyText){clear(node);const items=Array.isArray(values)?values.filter(Boolean):[];if(!items.length){const li=document.createElement('li');li.textContent=emptyText;node.appendChild(li);return;}items.forEach(value=>{const li=document.createElement('li');li.textContent=typeof value==='string'?value:value.statement;node.appendChild(li)});}
  function addMetric(label,value){const item=document.createElement('div'),strong=document.createElement('strong'),span=document.createElement('span');strong.textContent=value;span.textContent=label;item.append(strong,span);metricsGrid.appendChild(item);}
  function paintQuality(payload){const level=payload?.quality?.level||'UNAVAILABLE';if(level==='FULL'){researchState.textContent='Recherche exploitable';researchState.dataset.state='ready';return;}if(level==='PARTIAL'){researchState.textContent='Analyse partielle';researchState.dataset.state='limited';return;}researchState.textContent=payload?.discovery?.status==='UNCONFIGURED'?'Recherche Web non configurée':'Aucun fait vérifié';researchState.dataset.state='limited';}
  function render(payload){
    clear(referencesGrid);clear(competitorsGrid);clear(metricsGrid);const refs=Array.isArray(payload.references)?payload.references:[],competitors=Array.isArray(payload.competitors)?payload.competitors:[];
    refs.forEach((source,index)=>referencesGrid.appendChild(createSourceCard(source,index)));competitors.forEach((source,index)=>competitorsGrid.appendChild(createSourceCard(source,index)));
    if(!refs.length)referencesGrid.textContent='Aucune référence fournie.';
    if(!competitors.length)competitorsGrid.textContent=payload.discovery?.configured?'Aucune solution suffisamment pertinente et vérifiable n’a été retenue.':'Aucune recherche Web automatique n’a pu être effectuée.';
    discoveryMeta.textContent=`${Number(payload.discovery?.search_requests||0)} recherche(s) tentée(s) · ${Number(payload.discovery?.search_succeeded||0)} aboutie(s) · ${competitors.length} solution(s) retenue(s)`;
    renderList(patternsList,payload.cross_patterns,'Pas assez de faits vérifiés pour dégager un point commun fiable.');renderList(limitationsList,payload.limitations,'Aucune limite supplémentaire signalée.');
    const selectionUsage=payload.usage?.selection||{},analysisUsage=payload.usage?.analysis||{},totalTokens=Number(selectionUsage.total_tokens||0)+Number(analysisUsage.total_tokens||0);
    addMetric('Recherches Web réellement tentées',String(Number(payload.discovery?.search_requests||0)));addMetric('Tentatives d’ouverture de pages',String(Number(payload.source_fetch_attempt_count||0)));addMetric('Pages publiques réellement lues',String(Number(payload.source_fetch_count||0)));addMetric('Constats publics vérifiés',String(Number(payload.quality?.observed_finding_count||0)));addMetric('Tokens IA mesurés',totalTokens?String(totalTokens):'non fournis');
    results.hidden=false;errorBox.hidden=true;loadingBox.hidden=true;paintQuality(payload);
  }

  async function saveResult(payload){
    const provenance=[{type:'OBSERVED_PUBLIC',count:Number(payload?.quality?.observed_finding_count||0),at:new Date().toISOString()},{type:'AI_SYNTHESIS',at:new Date().toISOString()}];
    await window.Lab2ProjectState.setArtifact('research',{status:'READY',contractVersion:EXPECTED_RESEARCH_CONTRACT,inputFingerprint,data:payload,provenance});
    try{localStorage.setItem(RESEARCH_KEY,JSON.stringify({version:2,fingerprint:inputFingerprint,response:payload,savedAt:new Date().toISOString()}));}catch{}
  }
  async function callResearch(){
    const token=accessToken();if(!token){window.Lab2Auth?.goToLogin?.();throw Object.assign(new Error('UNAUTHORIZED'),{code:'UNAUTHORIZED',status:401});}
    const response=await fetch('/api/lab2/research',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify({name:draft.name,references:Array.isArray(draft.references)?draft.references:[],understanding,discover_competitors:true})});
    const payload=await response.json().catch(()=>({}));if(!response.ok||!payload?.ok)throw Object.assign(new Error(payload?.error||`HTTP_${response.status}`),{code:payload?.error||'RESEARCH_ERROR',status:response.status});return payload;
  }
  startResearch.addEventListener('click',async()=>{
    if(actionPanel.hidden)return;startResearch.disabled=true;loadingBox.hidden=false;errorBox.hidden=true;researchState.textContent='Recherche…';researchState.dataset.state='loading';window.Lab2ProjectState?.markStatus?.('research','RUNNING');
    try{const payload=await callResearch();await saveResult(payload);render(payload);}catch(error){loadingBox.hidden=true;errorBox.hidden=false;errorBox.textContent=errorLabel(error?.code,Number(error?.status||0));researchState.textContent='Non disponible';researchState.dataset.state='error';window.Lab2ProjectState?.markStatus?.('research','ERROR',{reason:error?.code||'research_error'});}finally{startResearch.disabled=false;}
  });
  void loadContext();
})();
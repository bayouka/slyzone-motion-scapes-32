(() => {
  'use strict';

  const RESEARCH_KEY='4b4c2.lab2.idea-research.slice3.v1';
  const AUTH_SESSION_KEY='4b4c.supabase.session.v2';
  const EXPECTED_UNDERSTANDING_CONTRACT='lab2-understanding-v4';
  const EXPECTED_RESEARCH_CONTRACT='lab2-research-v3';

  const q=(id)=>document.getElementById(id);
  const ideaName=q('ideaName'),ideaOneLiner=q('ideaOneLiner'),ideaProblem=q('ideaProblem'),referenceCount=q('referenceCount'),researchState=q('researchState');
  const actionPanel=q('actionPanel'),blockedPanel=q('blockedPanel'),startResearch=q('startResearch'),loadingBox=q('loadingBox'),errorBox=q('errorBox'),results=q('results');
  const referencesGrid=q('referencesGrid'),competitorsGrid=q('competitorsGrid'),discoveryMeta=q('discoveryMeta'),patternsList=q('patternsList'),limitationsList=q('limitationsList'),metricsGrid=q('metricsGrid');

  let draft=null,understanding=null,inputFingerprint='';
  const parse=(value)=>{try{return JSON.parse(value)}catch{return null}};
  const text=(value)=>String(value||'').trim();
  const accessToken=()=>text(window.Lab2Auth?.getAccessToken?.()||parse(localStorage.getItem(AUTH_SESSION_KEY))?.access_token);
  const stateApi=()=>window.Lab2ProjectState;
  const clearNode=(node)=>{while(node.firstChild)node.firstChild.remove()};

  const initialState=()=>{loadingBox.hidden=true;errorBox.hidden=true;results.hidden=true;actionPanel.hidden=true;blockedPanel.hidden=true};
  const loadContext=async()=>{
    initialState();
    const state=stateApi();
    const rawArtifact=state?.getArtifact('rawIdea');
    const understandingArtifact=state?.getArtifact('understanding');
    draft=rawArtifact?.data||null;
    understanding=understandingArtifact?.data?.understanding||null;
    const ready=Boolean(
      draft?.name&&understandingArtifact?.status==='CONFIRMED'&&understandingArtifact?.confirmed===true&&
      understanding?.contract_version===EXPECTED_UNDERSTANDING_CONTRACT&&text(understanding?.one_liner).length>=20&&text(understanding?.problem).length>=20&&
      Array.isArray(understanding?.target_users)&&understanding.target_users.length&&Array.isArray(understanding?.main_flow)&&understanding.main_flow.length>=2&&understanding?.needs_clarification!==true
    );
    if(draft?.name)ideaName.textContent=draft.name;
    if(understanding?.one_liner)ideaOneLiner.textContent=understanding.one_liner;
    if(understanding?.problem)ideaProblem.textContent=understanding.problem;
    const refs=Array.isArray(draft?.references)?draft.references.filter(item=>text(item?.url)):[];
    referenceCount.textContent=refs.length?`${refs.length} référence${refs.length>1?'s':''}`:'Aucune référence fournie';
    blockedPanel.hidden=ready;actionPanel.hidden=!ready;
    if(!ready){researchState.textContent='Compréhension à confirmer';researchState.dataset.state='error';return false}

    researchState.textContent='Prêt à explorer';researchState.dataset.state='ready';
    inputFingerprint=await state.hash({rawIdea:rawArtifact.outputFingerprint,understanding:understandingArtifact.outputFingerprint,references:refs.map(({url,reason,note})=>({url,reason,note}))});
    const researchArtifact=state.getArtifact('research');
    if(researchArtifact?.status!=='STALE'&&researchArtifact?.inputFingerprint===inputFingerprint&&researchArtifact?.contractVersion===EXPECTED_RESEARCH_CONTRACT&&researchArtifact?.data?.ok){
      render(researchArtifact.data);return true;
    }
    const legacy=parse(localStorage.getItem(RESEARCH_KEY));
    if(legacy?.fingerprint===inputFingerprint&&legacy?.response?.contract_version===EXPECTED_RESEARCH_CONTRACT&&legacy.response?.ok){
      await saveResult(legacy.response);render(legacy.response);
    }
    return true;
  };

  const errorLabel=(code,status)=>{
    if(code==='LAB_RESEARCH_DISABLED')return 'La recherche du Lab est désactivée sur cet environnement.';
    if(code==='LAB_ACCESS_UNCONFIGURED')return 'Le groupe autorisé à tester 4b4c2 n’est pas configuré.';
    if(code==='LAB_ACCESS_DENIED')return 'Ce compte n’est pas autorisé à tester 4b4c2.';
    if(code==='UNAUTHORIZED')return 'Ta session a expiré. Reconnecte-toi puis réessaie.';
    if(code==='UNDERSTANDING_REQUIRED')return 'La compréhension confirmée n’est plus compatible avec cette étape. Reviens à Comprendre.';
    if(code==='AI_CAPACITY')return 'Le quota ou la capacité IA est momentanément atteint. Aucune relance automatique n’est effectuée.';
    if(status>=500)return 'La recherche a rencontré un problème technique. Les données déjà validées restent intactes.';
    return 'La recherche n’a pas pu être effectuée.';
  };
  const sourceTitle=(source,index)=>{try{return new URL(source.url).hostname.replace(/^www\./,'')}catch{return `Source ${index+1}`}};
  const categoryLabel=(category)=>({POSITIONING:'Positionnement',FUNCTIONALITY:'Fonctionnalité',WORKFLOW:'Workflow',NAVIGATION:'Navigation',TRUST:'Confiance',PRICING:'Tarification',CONTENT:'Contenu',OTHER:'Autre'}[category]||'Observation');
  const relationLabel=(relation)=>({DIRECT:'Concurrent direct',ADJACENT:'Solution proche',SUBSTITUTE:'Alternative',USER_REFERENCE:'Référence utilisateur'}[relation]||'Source');
  const createSourceCard=(source,index)=>{
    const card=document.createElement('article');card.className='source-card';
    const top=document.createElement('div');top.className='source-card-top';
    const heading=document.createElement('div'),title=document.createElement('h3'),url=document.createElement('a');title.textContent=sourceTitle(source,index);url.href=source.url;url.target='_blank';url.rel='noopener noreferrer';url.textContent=source.url;heading.append(title,url);top.appendChild(heading);
    const status=document.createElement('span');status.className='source-status';status.textContent=source.fetch_status==='OBSERVED_PUBLIC'?'Page publique vérifiée':'Non vérifiée';top.appendChild(status);card.appendChild(top);
    if(source.relation){const rel=document.createElement('span');rel.className='finding-label';rel.textContent=relationLabel(source.relation);card.appendChild(rel)}
    if(source.selection_reason){const p=document.createElement('p');p.className='selection-reason';p.textContent=source.selection_reason;card.appendChild(p)}
    const findings=Array.isArray(source.findings)?source.findings:[];
    if(!findings.length){const empty=document.createElement('p');empty.className='empty-copy';empty.textContent=source.fetch_status==='OBSERVED_PUBLIC'?'La page a été lue, mais aucun constat suffisamment solide n’a été retenu.':'Cette source n’a pas pu être vérifiée à partir de contenu public exploitable.';card.appendChild(empty);return card}
    const list=document.createElement('div');list.className='findings-list';findings.forEach(finding=>{const item=document.createElement('div');item.className='finding';const label=document.createElement('span');label.className='finding-label';label.textContent=categoryLabel(finding.category);const statement=document.createElement('p');statement.textContent=finding.statement;const evidence=document.createElement('blockquote');evidence.textContent=`Preuve publique : « ${finding.support_text} »`;item.append(label,statement,evidence);list.appendChild(item)});card.appendChild(list);return card;
  };
  const renderList=(node,values,empty)=>{clearNode(node);const items=Array.isArray(values)?values.filter(Boolean):[];if(!items.length){const li=document.createElement('li');li.textContent=empty;node.appendChild(li);return}items.forEach(value=>{const li=document.createElement('li');li.textContent=typeof value==='string'?value:value.statement;node.appendChild(li)})};
  const addMetric=(label,value)=>{const item=document.createElement('div'),strong=document.createElement('strong'),span=document.createElement('span');strong.textContent=value;span.textContent=label;item.append(strong,span);metricsGrid.appendChild(item)};
  const paintQuality=(payload)=>{const level=payload?.quality?.level||'UNAVAILABLE';if(level==='FULL'){researchState.textContent='Recherche exploitable';researchState.dataset.state='ready'}else if(level==='PARTIAL'){researchState.textContent='Analyse partielle';researchState.dataset.state='limited'}else{researchState.textContent='Aucun fait public vérifié';researchState.dataset.state='limited'}};
  const render=(payload)=>{
    clearNode(referencesGrid);clearNode(competitorsGrid);clearNode(metricsGrid);
    const refs=Array.isArray(payload.references)?payload.references:[],solutions=Array.isArray(payload.solutions)?payload.solutions:(Array.isArray(payload.competitors)?payload.competitors:[]);
    refs.forEach((source,index)=>referencesGrid.appendChild(createSourceCard(source,index)));solutions.forEach((source,index)=>competitorsGrid.appendChild(createSourceCard(source,index)));
    if(!refs.length)referencesGrid.textContent='Aucune référence fournie.';
    if(!solutions.length)competitorsGrid.textContent=payload.discovery?.search_requests?'Aucune solution suffisamment pertinente et vérifiable n’a été retenue.':'Aucune exploration automatique n’a été effectuée.';
    const providers=Array.isArray(payload.discovery?.providers)?payload.discovery.providers.join(' + '):'';
    discoveryMeta.textContent=`${Number(payload.discovery?.search_requests||0)} recherche(s) · ${Number(payload.discovery?.search_succeeded||0)} aboutie(s) · ${solutions.length} solution(s) retenue(s)${providers?` · ${providers}`:''}`;
    renderList(patternsList,payload.cross_patterns,'Pas assez de faits vérifiés pour dégager un point commun fiable.');renderList(limitationsList,payload.limitations,'Aucune limite supplémentaire signalée.');
    const a=payload.usage?.selection||{},b=payload.usage?.analysis||{},tokens=Number(a.total_tokens||0)+Number(b.total_tokens||0);
    addMetric('Recherches Web réellement tentées',String(Number(payload.discovery?.search_requests||0)));addMetric('Tentatives d’ouverture de pages',String(Number(payload.source_fetch_attempt_count||0)));addMetric('Pages publiques réellement lues',String(Number(payload.source_fetch_count||0)));addMetric('Constats publics vérifiés',String(Number(payload.quality?.observed_finding_count||0)));addMetric('Tokens IA mesurés',tokens?String(tokens):'non fournis');
    results.hidden=false;errorBox.hidden=true;loadingBox.hidden=true;paintQuality(payload);
  };
  const saveResult=async(payload)=>{
    localStorage.setItem(RESEARCH_KEY,JSON.stringify({version:2,fingerprint:inputFingerprint,response:payload,savedAt:new Date().toISOString()}));
    const provenance=[];for(const source of [...(payload.references||[]),...(payload.solutions||payload.competitors||[])]){for(const finding of source.findings||[])provenance.push({type:'OBSERVED_PUBLIC',url:source.url,value:finding.statement})}
    await stateApi().setArtifact('research',{status:'READY',contractVersion:payload.contract_version,inputFingerprint,data:payload,provenance});
  };
  const callResearch=async()=>{
    const token=accessToken();if(!token){window.Lab2Auth?.goToLogin?.();throw Object.assign(new Error('UNAUTHORIZED'),{code:'UNAUTHORIZED',status:401})}
    const response=await fetch('/api/lab2/research',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify({name:draft.name,references:Array.isArray(draft.references)?draft.references:[],understanding,discover_solutions:true})});
    const payload=await response.json().catch(()=>({}));if(!response.ok||!payload?.ok)throw Object.assign(new Error(payload?.error||`HTTP_${response.status}`),{code:payload?.error||'RESEARCH_ERROR',status:response.status});return payload;
  };

  startResearch.addEventListener('click',async()=>{
    if(actionPanel.hidden)return;startResearch.disabled=true;loadingBox.hidden=false;errorBox.hidden=true;researchState.textContent='Recherche…';researchState.dataset.state='loading';stateApi()?.markStatus('research','RUNNING');
    try{const payload=await callResearch();await saveResult(payload);render(payload)}catch(error){loadingBox.hidden=true;errorBox.hidden=false;errorBox.textContent=errorLabel(error?.code,Number(error?.status||0));researchState.textContent='Non disponible';researchState.dataset.state='error';stateApi()?.markStatus('research','ERROR',{reason:error?.code||'RESEARCH_ERROR'})}finally{startResearch.disabled=false}
  });
  void loadContext();
})();
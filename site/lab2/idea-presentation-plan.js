(() => {
  'use strict';

  const KEYS={draft:'4b4c2.lab2.idea-studio.slice1.v1',research:'4b4c2.lab2.idea-research.slice3.v1',brief:'4b4c2.lab2.idea-brief.slice5.v1',structure:'4b4c2.lab2.idea-structure.slice6.v1',design:'4b4c2.lab2.idea-design.slice7.v1',mockups:'4b4c2.lab2.idea-mockups.slice8.v1',plan:'4b4c2.lab2.presentation-plan.slice9.v1'};
  const EXPECTED_CONTRACT='lab2-presentation-plan-v1';
  const q=(id)=>document.getElementById(id),parse=(v)=>{try{return JSON.parse(v)}catch{return null}},text=(v)=>String(v||'').trim();
  const blockedPanel=q('blockedPanel'),plannerFlow=q('plannerFlow'),ideaName=q('ideaName'),ideaSummary=q('ideaSummary'),generateButton=q('generateButton'),loadingBox=q('loadingBox'),errorBox=q('errorBox'),results=q('results'),archetype=q('archetype'),narrative=q('narrative'),planMeta=q('planMeta'),planList=q('planList');
  let draft=null,research=null,briefCache=null,structureCache=null,designCache=null,mockupsCache=null,brief=null,structure=null,mockups=[],selectedDesign=null,fingerprintValue='';
  const preferences={audience:'TEAM',objective:'VALIDATE',detail:'STANDARD'};
  const token=()=>text(window.Lab2Auth?.getAccessToken?.());
  const fingerprint=async(value)=>{const data=new TextEncoder().encode(JSON.stringify(value));const digest=await crypto.subtle.digest('SHA-256',data);return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('')};

  function selectedDirection(){const id=designCache?.selected_direction_id;return (designCache?.response?.directions||[]).find(item=>item.id===id)||null}
  function keptPages(){const decisions=structureCache?.page_decisions||{};return (structure?.sitemap||[]).filter(page=>decisions[page.id]!=='REMOVE')}
  function retainedImprovements(){return briefCache?.response?.retained_improvements||[]}
  function readPreferencesFromUi(){
    for(const group of ['audience','objective','detail']){
      const pressed=document.querySelector(`[data-group="${group}"] button[aria-pressed="true"]`);
      if(pressed?.dataset?.value)preferences[group]=pressed.dataset.value;
    }
    return {...preferences};
  }
  function applyPreferences(next){
    for(const group of ['audience','objective','detail']){
      const value=next?.[group]||preferences[group];preferences[group]=value;
      document.querySelectorAll(`[data-group="${group}"] button`).forEach(button=>button.setAttribute('aria-pressed',button.dataset.value===value?'true':'false'));
    }
  }
  document.querySelectorAll('.choices').forEach(group=>group.addEventListener('click',(event)=>{
    const button=event.target.closest('button[data-value]');if(!button)return;
    group.querySelectorAll('button').forEach(item=>item.setAttribute('aria-pressed',item===button?'true':'false'));
    preferences[group.dataset.group]=button.dataset.value;
  }));

  function render(payload){
    const plan=payload?.plan;if(!plan)return;
    archetype.textContent=({SERVICE_WEBSITE:'Site de service / vitrine',SAAS_APP:'Application / SaaS',MARKETPLACE:'Marketplace',ECOMMERCE:'E-commerce',COMMUNITY:'Communauté',CONTENT_SITE:'Site de contenu',OTHER:'Projet numérique'}[plan.project_archetype]||'Projet numérique');
    narrative.textContent=plan.narrative_angle;planMeta.innerHTML='';
    const labels=[`${plan.slides.length} slides`,({TEAM:'Équipe / proches',CLIENT:'Client',PARTNER:'Partenaire',INVESTOR:'Investisseur',GENERAL:'Public général'}[payload.preferences?.audience]||payload.preferences?.audience),({UNDERSTAND:'Comprendre',VALIDATE:'Valider',CONVINCE:'Convaincre',DOCUMENT:'Documenter'}[payload.preferences?.objective]||payload.preferences?.objective)];
    labels.filter(Boolean).forEach(value=>{const chip=document.createElement('span');chip.textContent=value;planMeta.appendChild(chip)});
    planList.innerHTML='';
    plan.slides.forEach((slide,index)=>{
      const article=document.createElement('article');article.className='plan-item';
      const number=document.createElement('div');number.className='plan-index';number.textContent=String(index+1);
      const type=document.createElement('div');type.className='plan-type';type.textContent=slide.type.replace('_',' ');
      const content=document.createElement('div');const h=document.createElement('h3');h.textContent=slide.title;const p=document.createElement('p');p.textContent=slide.purpose;content.append(h,p);
      if(slide.mockup_id){const tag=document.createElement('span');tag.className='mockup-tag';const mock=mockups.find(item=>item.id===slide.mockup_id);tag.textContent=`Maquette : ${mock?.label||slide.mockup_id}`;content.appendChild(tag)}
      article.append(number,type,content);planList.appendChild(article);
    });
    results.hidden=false;loadingBox.hidden=true;errorBox.hidden=true;
  }

  function save(payload){try{localStorage.setItem(KEYS.plan,JSON.stringify({version:1,fingerprint:fingerprintValue,response:payload,savedAt:new Date().toISOString()}))}catch{}}
  async function currentFingerprint(){return fingerprint({name:draft?.name,brief,research:research?.quality||null,sitemap:keptPages(),workflows:structure?.workflows||[],design:selectedDesign?.id,mockups:mockups.map(x=>({id:x.id,page_id:x.page_id,path:x.path})),retained:retainedImprovements(),preferences:readPreferencesFromUi()})}

  function bodyForApi(){return {
    name:draft.name,brief,research,
    sitemap:keptPages(),workflows:structure?.workflows||[],mockups,
    retained_improvements:retainedImprovements(),preferences:readPreferencesFromUi()
  }}
  async function callApi(){
    const access=token();if(!access){window.Lab2Auth?.goToLogin?.();throw Object.assign(new Error('UNAUTHORIZED'),{code:'UNAUTHORIZED'})}
    const response=await fetch('/api/lab2/presentation-plan',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${access}`},body:JSON.stringify(bodyForApi())});
    const payload=await response.json().catch(()=>({}));if(!response.ok||!payload?.ok)throw Object.assign(new Error(payload?.error||'PLAN_ERROR'),{code:payload?.error||'PLAN_ERROR'});
    if(payload.contract_version!==EXPECTED_CONTRACT||!Array.isArray(payload?.plan?.slides)||payload.plan.slides.length<7)throw Object.assign(new Error('AI_OUTPUT_INCOMPLETE'),{code:'AI_OUTPUT_INCOMPLETE'});
    return payload;
  }
  function errorLabel(code){if(code==='LAB_PRESENTATION_PLAN_DISABLED')return 'Le Planner de présentation est désactivé sur cet environnement.';if(code==='UNAUTHORIZED')return 'Ta session doit être renouvelée.';if(code==='AI_CAPACITY')return 'La capacité IA est momentanément atteinte. Aucune relance automatique n’est effectuée.';if(code==='AI_OUTPUT_INVALID_RESEARCH_SLIDE')return 'Le plan a essayé d’utiliser une recherche non vérifiée. Il a été rejeté pour préserver la fiabilité.';if(code==='AI_OUTPUT_INCOMPLETE')return 'Le plan produit n’était pas suffisamment complet pour une présentation professionnelle. Tu peux le régénérer.';return 'Impossible de construire un plan de présentation fiable pour le moment.'}

  async function load(){
    draft=parse(localStorage.getItem(KEYS.draft));research=parse(localStorage.getItem(KEYS.research))?.response||null;briefCache=parse(localStorage.getItem(KEYS.brief));structureCache=parse(localStorage.getItem(KEYS.structure));designCache=parse(localStorage.getItem(KEYS.design));mockupsCache=parse(localStorage.getItem(KEYS.mockups));
    brief=briefCache?.response?.brief||null;structure=structureCache?.response?.structure||null;mockups=mockupsCache?.response?.mockups||[];selectedDesign=selectedDirection();
    const ready=Boolean(draft?.name&&brief?.one_liner&&structure?.sitemap?.length&&selectedDesign?.resolved?.palette?.tokens&&mockups.length);
    blockedPanel.hidden=ready;plannerFlow.hidden=!ready;if(!ready)return;
    ideaName.textContent=draft.name;ideaSummary.textContent=brief.short_pitch||brief.one_liner;
    const cached=parse(localStorage.getItem(KEYS.plan));if(cached?.response?.preferences)applyPreferences(cached.response.preferences);
    fingerprintValue=await currentFingerprint();
    if(cached?.version===1&&cached?.fingerprint===fingerprintValue&&cached?.response?.contract_version===EXPECTED_CONTRACT)render(cached.response);
    else if(cached)localStorage.removeItem(KEYS.plan);
  }

  generateButton.addEventListener('click',async()=>{generateButton.disabled=true;loadingBox.hidden=false;errorBox.hidden=true;results.hidden=true;try{fingerprintValue=await currentFingerprint();const payload=await callApi();save(payload);render(payload)}catch(error){loadingBox.hidden=true;errorBox.hidden=false;errorBox.textContent=errorLabel(error?.code)}finally{generateButton.disabled=false}});
  void load();
})();
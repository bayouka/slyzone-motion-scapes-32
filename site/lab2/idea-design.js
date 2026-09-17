(() => {
  'use strict';
  const DRAFT_KEY='4b4c2.lab2.idea-studio.slice1.v1';
  const BRIEF_KEY='4b4c2.lab2.idea-brief.slice5.v1';
  const STRUCTURE_KEY='4b4c2.lab2.idea-structure.slice6.v1';
  const DESIGN_KEY='4b4c2.lab2.idea-design.slice7.v1';
  const AUTH_SESSION_KEY='4b4c.supabase.session.v2';
  const q=(id)=>document.getElementById(id);
  const blockedPanel=q('blockedPanel'),designFlow=q('designFlow'),moodGrid=q('moodGrid'),moodCount=q('moodCount');
  const colorPreference=q('colorPreference'),avoidColors=q('avoidColors'),referenceNote=q('referenceNote'),generateButton=q('generateButton');
  const loadingBox=q('loadingBox'),errorBox=q('errorBox'),results=q('results'),directionGrid=q('directionGrid');
  const selectionSummary=q('selectionSummary'),selectedName=q('selectedName'),selectedReason=q('selectedReason'),selectedMeta=q('selectedMeta'),nextCard=q('nextCard');
  let draft=null,brief=null,structureCache=null,selectedMoods=new Set(),responsePayload=null,selectedDirectionId=null,fingerprintValue='';
  const parse=(v)=>{try{return JSON.parse(v)}catch{return null}};
  const text=(v)=>String(v||'').trim();
  const token=()=>text(parse(localStorage.getItem(AUTH_SESSION_KEY))?.access_token);
  const fingerprint=async(value)=>{const data=new TextEncoder().encode(JSON.stringify(value));const digest=await crypto.subtle.digest('SHA-256',data);return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('')};

  function preferences(){return {moods:[...selectedMoods],color:colorPreference.value||'AUTO',avoid_colors:text(avoidColors.value),reference_note:text(referenceNote.value)}}
  function keptStructure(){
    const structure=structureCache?.response?.structure||{};const decisions=structureCache?.page_decisions||{};
    return {...structure,sitemap:(structure.sitemap||[]).filter(page=>decisions[page.id]!=='REMOVE')};
  }
  function persist(){
    try{localStorage.setItem(DESIGN_KEY,JSON.stringify({version:1,fingerprint:fingerprintValue,preferences:preferences(),response:responsePayload,selected_direction_id:selectedDirectionId,savedAt:new Date().toISOString()}))}catch{}
  }
  function restorePreferences(saved){
    selectedMoods=new Set((saved?.moods||[]).slice(0,3));
    colorPreference.value=saved?.color||'AUTO';avoidColors.value=saved?.avoid_colors||'';referenceNote.value=saved?.reference_note||'';renderMoodState();
  }
  function renderMoodState(){
    moodGrid.querySelectorAll('[data-mood]').forEach(button=>button.setAttribute('aria-pressed',selectedMoods.has(button.dataset.mood)?'true':'false'));
    moodCount.textContent=`${selectedMoods.size}/3`;
  }
  function handleMood(button){
    const mood=button.dataset.mood;if(selectedMoods.has(mood))selectedMoods.delete(mood);else if(selectedMoods.size<3)selectedMoods.add(mood);renderMoodState();
  }
  moodGrid.addEventListener('click',(event)=>{const button=event.target.closest('[data-mood]');if(button)handleMood(button)});

  const imageryLabel=(value)=>({PHOTO_HUMAN:'Photos humaines',PHOTO_PRODUCT:'Photos produit/service',ILLUSTRATION_LIGHT:'Illustrations légères',UI_FIRST:'Interface au premier plan',MINIMAL:'Très peu d’images'}[value]||value);
  const motionLabel=(value)=>({CALM:'Calme',STANDARD:'Standard',LIVELY:'Vivant'}[value]||value);
  const densityLabel=(value)=>({AIRY:'Aéré',BALANCED:'Équilibré',COMPACT:'Compact'}[value]||value);

  function applyPreviewVars(node,direction){
    const tokens=direction.resolved?.palette?.tokens||{},shape=direction.resolved?.shape||{},density=direction.resolved?.density||{},type=direction.resolved?.typography||{};
    node.style.setProperty('--bg',tokens.background||'210 40% 98%');node.style.setProperty('--surface',tokens.surface||'0 0% 100%');node.style.setProperty('--fg',tokens.foreground||'222 47% 11%');
    node.style.setProperty('--primary',tokens.primary||'211 92% 48%');node.style.setProperty('--muted',tokens.muted||'210 35% 94%');node.style.setProperty('--border',tokens.border||'214 28% 88%');
    node.style.setProperty('--radius',shape.radius||'18px');node.style.setProperty('--shadow',shape.shadow||'none');node.style.setProperty('--card-pad',density.card_padding||'22px');
    node.style.setProperty('--heading-font',type.heading||'Inter, system-ui, sans-serif');node.style.setProperty('--body-font',type.body||'Inter, system-ui, sans-serif');
  }
  function preview(direction){
    const wrap=document.createElement('div');wrap.className='preview';applyPreviewVars(wrap,direction);
    const shell=document.createElement('div');shell.className='preview-shell';
    const top=document.createElement('div');top.className='preview-top';const logo=document.createElement('span');logo.className='preview-logo';logo.textContent=draft?.name||'Mon projet';
    const nav=document.createElement('div');nav.className='preview-nav';nav.append(document.createElement('span'),document.createElement('span'),document.createElement('span'));top.append(logo,nav);
    const h=document.createElement('h3');h.textContent=brief?.one_liner||'Une proposition claire et utile.';const p=document.createElement('p');p.textContent=brief?.short_pitch||brief?.solution||'';
    const actions=document.createElement('div');actions.className='preview-actions';const a=document.createElement('span');a.className='primary-demo';const b=document.createElement('span');b.className='secondary-demo';actions.append(a,b);
    const cards=document.createElement('div');cards.className='preview-grid';cards.append(document.createElement('div'),document.createElement('div'),document.createElement('div'));
    shell.append(top,h,p,actions,cards);wrap.appendChild(shell);return wrap;
  }
  function renderSelection(){
    const selected=(responsePayload?.directions||[]).find(item=>item.id===selectedDirectionId);const has=Boolean(selected);selectionSummary.hidden=!has;nextCard.hidden=!has;if(!has)return;
    selectedName.textContent=selected.name;selectedReason.textContent=selected.rationale;selectedMeta.innerHTML='';
    [selected.resolved?.palette?.label,selected.resolved?.typography?.label,densityLabel(selected.density_id),imageryLabel(selected.imagery),`Motion ${motionLabel(selected.motion).toLowerCase()}`].filter(Boolean).forEach(value=>{const span=document.createElement('span');span.textContent=value;selectedMeta.appendChild(span)});
  }
  function selectDirection(id){selectedDirectionId=id;persist();render(responsePayload)}
  function render(payload){
    responsePayload=payload;directionGrid.innerHTML='';
    (payload?.directions||[]).forEach(direction=>{
      const card=document.createElement('article');card.className='direction-card';card.dataset.selected=direction.id===selectedDirectionId?'true':'false';card.appendChild(preview(direction));
      const content=document.createElement('div');content.className='direction-content';const h=document.createElement('h3');h.textContent=direction.name;
      const perception=document.createElement('div');perception.className='perception';(direction.perception||[]).forEach(value=>{const span=document.createElement('span');span.textContent=value;perception.appendChild(span)});
      const reason=document.createElement('p');reason.textContent=direction.rationale;
      const details=document.createElement('div');details.className='direction-details';
      const palette=document.createElement('div');palette.innerHTML=`<strong>Palette :</strong> ${direction.resolved?.palette?.label||direction.palette_id}`;
      const type=document.createElement('div');type.innerHTML=`<strong>Typo :</strong> ${direction.resolved?.typography?.label||direction.typography_id}`;
      const density=document.createElement('div');density.innerHTML=`<strong>Densité :</strong> ${densityLabel(direction.density_id)} · <strong>Images :</strong> ${imageryLabel(direction.imagery)}`;details.append(palette,type,density);
      const choose=document.createElement('button');choose.className='choose';choose.type='button';choose.textContent=direction.id===selectedDirectionId?'Direction choisie':'Choisir cette direction';choose.addEventListener('click',()=>selectDirection(direction.id));
      content.append(h,perception,reason,details,choose);card.appendChild(content);directionGrid.appendChild(card);
    });
    results.hidden=false;loadingBox.hidden=true;errorBox.hidden=true;renderSelection();persist();
  }
  function errorLabel(code){if(code==='LAB_DESIGN_DISABLED')return 'Cette étape du Lab est volontairement désactivée. Aucun crédit n’a été consommé.';if(code==='UNAUTHORIZED')return 'Ta session 4b4c a expiré. Reconnecte-toi puis réessaie.';if(code==='AI_CAPACITY')return 'Le quota ou la capacité IA est momentanément atteint. Aucune relance automatique n’est effectuée.';return 'Impossible de proposer les directions visuelles pour le moment.'}

  async function currentFingerprint(){return fingerprint({name:draft?.name,brief,structure:keptStructure(),preferences:preferences()})}
  async function callApi(){
    const access=token();if(!access)throw Object.assign(new Error('UNAUTHORIZED'),{code:'UNAUTHORIZED'});
    const response=await fetch('/api/lab2/design',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${access}`},body:JSON.stringify({name:draft.name,brief,structure:keptStructure(),preferences:preferences()})});
    const payload=await response.json().catch(()=>({}));if(!response.ok||!payload?.ok)throw Object.assign(new Error(payload?.error||'DESIGN_ERROR'),{code:payload?.error||'DESIGN_ERROR'});return payload;
  }
  async function loadContext(){
    draft=parse(localStorage.getItem(DRAFT_KEY));brief=parse(localStorage.getItem(BRIEF_KEY))?.response?.brief||null;structureCache=parse(localStorage.getItem(STRUCTURE_KEY));
    const ready=Boolean(draft?.name&&brief?.one_liner&&brief?.solution&&structureCache?.response?.structure?.sitemap);blockedPanel.hidden=ready;designFlow.hidden=!ready;if(!ready)return;
    const cached=parse(localStorage.getItem(DESIGN_KEY));restorePreferences(cached?.preferences||{});fingerprintValue=await currentFingerprint();
    if(cached?.version===1&&cached?.fingerprint===fingerprintValue&&cached?.response?.ok){responsePayload=cached.response;selectedDirectionId=cached.selected_direction_id||null;render(cached.response)}
  }
  generateButton.addEventListener('click',async()=>{
    generateButton.disabled=true;loadingBox.hidden=false;errorBox.hidden=true;results.hidden=true;
    try{fingerprintValue=await currentFingerprint();const payload=await callApi();responsePayload=payload;selectedDirectionId=null;render(payload)}
    catch(e){loadingBox.hidden=true;errorBox.hidden=false;errorBox.textContent=errorLabel(e?.code)}finally{generateButton.disabled=false}
  });
  void loadContext();
})();
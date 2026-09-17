(() => {
  'use strict';
  const KEYS={
    draft:'4b4c2.lab2.idea-studio.slice1.v1',research:'4b4c2.lab2.idea-research.slice3.v1',brief:'4b4c2.lab2.idea-brief.slice5.v1',structure:'4b4c2.lab2.idea-structure.slice6.v1',design:'4b4c2.lab2.idea-design.slice7.v1',mockups:'4b4c2.lab2.idea-mockups.slice8.v1',plan:'4b4c2.lab2.presentation-plan.slice9.v1',auth:'4b4c.supabase.session.v2'
  };
  const q=(id)=>document.getElementById(id),parse=(value)=>{try{return JSON.parse(value)}catch{return null}},text=(value)=>String(value||'').trim();
  const panel=q('plannerPanel'),button=q('plannerButton'),status=q('plannerStatus'),audience=q('audienceSelect'),objective=q('objectiveSelect'),detail=q('detailSelect'),blocked=q('blockedPanel');
  const fingerprint=async(value)=>{const data=new TextEncoder().encode(JSON.stringify(value));const digest=await crypto.subtle.digest('SHA-256',data);return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('')};
  const accessToken=()=>text(window.Lab2Auth?.getAccessToken?.()||parse(localStorage.getItem(KEYS.auth))?.access_token);
  function context(){
    const draft=parse(localStorage.getItem(KEYS.draft));
    const research=parse(localStorage.getItem(KEYS.research))?.response||null;
    const briefCache=parse(localStorage.getItem(KEYS.brief));
    const structureCache=parse(localStorage.getItem(KEYS.structure));
    const designCache=parse(localStorage.getItem(KEYS.design));
    const mockupCache=parse(localStorage.getItem(KEYS.mockups));
    const brief=briefCache?.response?.brief||null;
    const structure=structureCache?.response?.structure||null;
    const mockups=mockupCache?.response?.mockups||[];
    const selectedDesign=(designCache?.response?.directions||[]).find(x=>x.id===designCache?.selected_direction_id)||null;
    if(!draft?.name||!brief?.one_liner||!structure?.sitemap?.length||!selectedDesign||!mockups.length)return null;
    const decisions=structureCache?.page_decisions||{};
    const sitemap=(structure.sitemap||[]).filter(page=>decisions[page.id]!=='REMOVE');
    return {draft,research,briefCache,brief,structureCache,structure:{...structure,sitemap},selectedDesign,mockups,retained_improvements:briefCache?.response?.retained_improvements||[]};
  }
  async function planFingerprint(ctx,prefs){return fingerprint({name:ctx.draft.name,brief:ctx.brief,research:ctx.research?.quality||null,sitemap:ctx.structure.sitemap,workflows:ctx.structure.workflows||[],mockups:ctx.mockups.map(x=>({id:x.id,page_id:x.page_id,label:x.label,path:x.path})),retained:ctx.retained_improvements,prefs})}
  function prefs(){return {audience:audience.value,objective:objective.value,detail:detail.value}}
  function dispatch(record){window.dispatchEvent(new CustomEvent('lab2:presentation-plan-ready',{detail:record}))}
  function restorePrefs(record){const p=record?.response?.preferences||record?.preferences||{};if(p.audience)audience.value=p.audience;if(p.objective)objective.value=p.objective;if(p.detail)detail.value=p.detail}
  async function load(){
    const ctx=context();
    if(!ctx){panel.hidden=true;blocked.hidden=false;return}
    blocked.hidden=true;panel.hidden=false;
    const cached=parse(localStorage.getItem(KEYS.plan));
    if(cached?.version===1&&cached?.response?.ok&&cached?.response?.contract_version==='lab2-presentation-plan-v1'){
      restorePrefs(cached);
      const fp=await planFingerprint(ctx,prefs());
      if(fp===cached.fingerprint){status.textContent=`Plan prêt · ${cached.response.plan.slides.length} slides · ${cached.response.plan.project_archetype}`;button.textContent='Repenser la présentation';dispatch(cached);return}
      localStorage.removeItem(KEYS.plan);
    }
    status.textContent='Choisis le public et l’objectif, puis prépare la narration.';
  }
  async function callPlanner(ctx){
    const token=accessToken();if(!token){window.Lab2Auth?.goToLogin?.();throw Object.assign(new Error('UNAUTHORIZED'),{code:'UNAUTHORIZED'})}
    const response=await fetch('/api/lab2/presentation-plan',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify({
      name:ctx.draft.name,brief:ctx.brief,research:ctx.research,sitemap:ctx.structure.sitemap,workflows:ctx.structure.workflows||[],mockups:ctx.mockups,retained_improvements:ctx.retained_improvements,preferences:prefs()
    })});
    const payload=await response.json().catch(()=>({}));if(!response.ok||!payload?.ok)throw Object.assign(new Error(payload?.error||'PLAN_ERROR'),{code:payload?.error||'PLAN_ERROR',status:response.status});return payload;
  }
  function errorLabel(code){
    if(code==='UNAUTHORIZED')return 'Ta session doit être renouvelée.';
    if(code==='AI_CAPACITY')return 'La capacité IA est momentanément atteinte. Aucune relance automatique n’est effectuée.';
    if(code==='AI_OUTPUT_INCOMPLETE'||code==='AI_OUTPUT_INVALID_RESEARCH_SLIDE'||code==='AI_OUTPUT_INVALID_OPEN_QUESTIONS'||code==='AI_OUTPUT_INVALID_DECISIONS')return 'Le plan proposé n’était pas assez cohérent avec les données du projet. Il n’a pas été accepté.';
    if(code==='LAB_PRESENTATION_PLAN_DISABLED')return 'Le planner de présentation est désactivé sur cette preview.';
    return 'Impossible de préparer une narration exploitable pour le moment.';
  }
  [audience,objective,detail].forEach(node=>node.addEventListener('change',()=>{status.textContent='Les préférences ont changé : prépare un nouveau plan avant export.';document.getElementById('slides').hidden=true;document.getElementById('pptxButton').disabled=true;document.getElementById('printButton').disabled=true}));
  button.addEventListener('click',async()=>{
    const ctx=context();if(!ctx)return;
    button.disabled=true;status.textContent='L’IA organise la narration sans modifier les faits…';
    try{
      const payload=await callPlanner(ctx);const fp=await planFingerprint(ctx,prefs());const record={version:1,fingerprint:fp,response:payload,preferences:prefs(),savedAt:new Date().toISOString()};
      localStorage.setItem(KEYS.plan,JSON.stringify(record));status.textContent=`Plan prêt · ${payload.plan.slides.length} slides · narration adaptée`;button.textContent='Repenser la présentation';dispatch(record);
    }catch(error){status.textContent=errorLabel(error?.code)}finally{button.disabled=false}
  });
  void load();
})();
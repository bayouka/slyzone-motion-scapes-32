import { SupabaseBrowserClient } from './supabase-client.js';

(()=>{
  if(window.__2B2C_IDEAS_ORCHESTRATOR_V2__) return;
  const cfg=window.__4B4C_CONFIG__||{};
  const api=new SupabaseBrowserClient({url:cfg.supabaseUrl,publishableKey:cfg.supabasePublishableKey});
  const workspaceKey=cfg.workspaceStorageKey||'4b4c.live.workspace.v1';
  let timer=null, renderSeq=0;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const route=()=>location.hash||'#/';
  const ideaId=()=>((route().match(/^#\/ideas\/([0-9a-f-]{36})(?:\/|$)/i)||[])[1]||null);
  const workspaceId=()=>localStorage.getItem(workspaceKey)||'';

  function ensureUxStyles(){
    if(document.getElementById('ideas-v2-coherence-styles')) return;
    const style=document.createElement('style');
    style.id='ideas-v2-coherence-styles';
    style.textContent=`
      .ideas-v2-smart-empty{padding:14px!important;border:1px dashed #cfd9eb!important;background:#f8faff!important;border-radius:14px!important;text-align:left!important}
      .ideas-v2-smart-empty strong{display:block;color:#26344d;font-size:14px}
      .ideas-v2-smart-empty p{margin:5px 0 10px!important;color:#65718a!important;line-height:1.45}
      .ideas-v2-smart-empty button{border:0;border-radius:10px;padding:9px 12px;background:#eef3ff;color:#315bd6;font:inherit;font-weight:800;cursor:pointer}
      .ideas-v2-decision-state{margin:12px 0;padding:12px 14px;border-radius:13px;border:1px solid #f0dfb7;background:#fff9eb;color:#72501d;line-height:1.45}
      .ideas-v2-decision-state strong{display:block;margin-bottom:3px;color:#5f4218}
      .ideas-v2-decision-blocked{opacity:.48!important;cursor:not-allowed!important}
      .ideas-v2-final-modal-note{margin:0 0 12px;padding:10px 12px;border-radius:11px;background:#fff9eb;color:#72501d;font-size:13px;line-height:1.4}
      .ideas-v2-projects-hub{margin:12px 0 18px!important;padding:15px!important;box-shadow:0 7px 20px rgba(42,56,92,.045)!important}
      .ideas-v2-projects-head h2{font-size:21px!important;margin:2px 0 3px!important}
      .ideas-v2-projects-head p{font-size:13px!important}
      .ideas-v2-projects-body{margin-top:11px!important;grid-template-columns:240px 1fr!important;gap:11px!important}
      .ideas-v2-stats div{padding:9px 7px!important}
      .ideas-v2-stats strong{font-size:18px!important}
      .ideas-v2-recent>a,.ideas-v2-empty{padding:10px!important}
      .ideas-v2-recent>a small{margin-top:5px!important}
      @media(max-width:980px){.ideas-v2-projects-body{grid-template-columns:1fr!important}}
    `;
    document.head.appendChild(style);
  }

  async function ideaState(id){
    const [rows,items,reviews]=await Promise.all([
      api.select('ideas',`select=id,title,summary,original_text,problem,audience,proposal,status,visibility,readiness,updated_at&id=eq.${id}&limit=1`).catch(()=>[]),
      api.select('idea_items',`select=id,kind,title,state,url&idea_id=eq.${id}&order=created_at.asc`).catch(()=>[]),
      api.select('idea_reviews',`select=id,vote,idea_version&idea_id=eq.${id}&order=updated_at.desc`).catch(()=>[])
    ]);
    const idea=rows?.[0]; if(!idea) return null;
    const activeItems=(items||[]).filter(x=>x.state!=='drop');
    const hasEvidence=activeItems.some(x=>['reference','evidence'].includes(x.kind));
    const hasRisk=activeItems.some(x=>x.kind==='risk');
    const hasPath=activeItems.some(x=>x.kind==='path');
    const missing=[!idea.problem?.trim()?'le problème':null,!idea.audience?.trim()?'les personnes concernées':null,!idea.proposal?.trim()?'la proposition':null].filter(Boolean);
    let phase='clarify';
    if(!missing.length && (!hasPath||!hasRisk)) phase='strengthen';
    if(!missing.length && hasPath && hasRisk && !hasEvidence) phase='prove';
    if(!missing.length && hasPath && hasRisk && hasEvidence && (idea.visibility==='private'||!reviews?.length)) phase='share';
    if(!missing.length && hasPath && hasRisk && hasEvidence && idea.visibility!=='private' && reviews?.length) phase='decide';
    if(['approved','needs_work','parked','rejected','converted'].includes(idea.status)) phase=idea.status==='approved'?'convert':idea.status==='converted'?'done':'decide';
    return {idea,items:activeItems,reviews:reviews||[],missing,hasEvidence,hasRisk,hasPath,phase};
  }

  const phaseMeta={
    clarify:{step:1,label:'Clarifier',title:'Clarifier l’idée',text:'2b2c pose uniquement les questions qui peuvent encore changer la compréhension.',cta:'Répondre aux questions',action:'questions'},
    strengthen:{step:2,label:'Renforcer',title:'Renforcer la proposition',text:'L’idée est comprise. Cherchons maintenant les variantes utiles, les risques et les objections.',cta:'Améliorer avec l’IA',action:'improve'},
    prove:{step:3,label:'Étayer',title:'Vérifier ce qui doit l’être',text:'La proposition est assez claire pour confronter ses hypothèses à des preuves et des sources.',cta:'Chercher des preuves',action:'evidence'},
    share:{step:4,label:'Partager',title:'Obtenir l’avis de l’équipe',text:'Le cadrage est suffisant. Partagez maintenant l’idée pour obtenir des avis attribués.',cta:'Partager à l’équipe',action:'share'},
    decide:{step:5,label:'Décider',title:'Préparer une décision',text:'Les éléments utiles sont réunis. Synthétisez les avis et rendez la décision explicite.',cta:'Aller à la décision',action:'decision'},
    convert:{step:5,label:'Décider',title:'Décision prise',text:'L’idée est approuvée. Elle peut maintenant devenir un projet sans perdre son historique.',cta:'Transformer en projet',action:'convert'},
    done:{step:5,label:'Décidé',title:'Projet créé',text:'Cette idée a été convertie. Son historique reste consultable.',cta:'Voir les projets',action:'projects'}
  };

  function stages(step){return `<div class="ideas-v2-steps">${['Clarifier','Renforcer','Étayer','Partager','Décider'].map((x,i)=>`<span class="${i+1<step?'done':i+1===step?'current':''}"><i>${i+1<step?'✓':i+1}</i>${x}</span>`).join('')}</div>`}
  function actionButton(label,action,primary=false){return `<button type="button" class="${primary?'primary':''}" data-ideas-v2-action="${action}">${esc(label)}</button>`}
  function detailBarHtml(s){const m=phaseMeta[s.phase]||phaseMeta.clarify;const detail=s.phase==='clarify'&&s.missing.length?`Il manque encore ${s.missing.join(', ')}.`:m.text;return `<div class="ideas-v2-copilot-main"><div><span class="ideas-v2-kicker">Étape actuelle · ${esc(m.label)}</span><h2>${esc(m.title)}</h2><p>${esc(detail)}</p></div><div class="ideas-v2-main-actions">${actionButton(m.cta,m.action,true)}<details class="ideas-v2-more"><summary>Actions IA</summary><div>${s.phase!=='clarify'?actionButton('Revoir la compréhension','understand'):''}${actionButton('Poser des questions','questions')}${s.phase!=='clarify'?actionButton('Améliorer','improve'):''}${['strengthen','prove','share','decide','convert'].includes(s.phase)?actionButton('Challenger','challenge'):''}${['prove','share','decide','convert'].includes(s.phase)?actionButton('Preuves & chiffres','evidence'):''}${['share','decide','convert'].includes(s.phase)?actionButton('Synthèse','synthesize'):''}${['share','decide','convert'].includes(s.phase)?actionButton('Présentation pro','presentation'):''}</div></details></div></div>${stages(m.step)}`;}

  function guideMeta(s){
    if(s.phase==='clarify') return {title:'À clarifier maintenant',text:s.missing.length?`Commencez par ${s.missing.slice(0,2).join(' et ')}. Les réponses seront enregistrées directement dans l’idée.`:'Vérifiez les dernières ambiguïtés avant de renforcer la proposition.'};
    if(s.phase==='strengthen'){
      if(!s.hasPath&&!s.hasRisk) return {title:'À renforcer maintenant',text:'Ajoutez une piste utile et identifiez au moins un risque avant de chercher des preuves.'};
      if(!s.hasPath) return {title:'À renforcer maintenant',text:'Il manque encore une piste ou variante suffisamment concrète à comparer.'};
      return {title:'À renforcer maintenant',text:'Identifiez au moins un risque ou une objection importante avant de passer aux preuves.'};
    }
    if(s.phase==='prove') return {title:'À vérifier maintenant',text:'Ajoutez au moins une référence ou preuve retenue qui permet de confronter la proposition au réel.'};
    if(s.phase==='share') return {title:'À partager maintenant',text:'Le cadrage est suffisamment solide. Partagez l’idée pour recueillir un avis attribué de l’équipe.'};
    if(s.phase==='decide') return {title:'À décider maintenant',text:'Relisez les éléments utiles et les avis. La décision finale reste explicitement humaine.'};
    if(s.phase==='convert') return {title:'Décision prise',text:'La validation est acquise. Vous pouvez créer le projet sans inventer de tâches ni de roadmap.'};
    return {title:'Historique conservé',text:'Le projet a été créé et l’idée reste consultable comme origine de la décision.'};
  }

  function findExploreBlock(label){
    return [...document.querySelectorAll('.ideas-v1-explore-block')].find(section=>section.querySelector('h2')?.textContent?.trim()===label)||null;
  }

  function patchExplore(s){
    if(!route().includes('/explore')) return;
    const questions=s.items.filter(x=>x.kind==='question');
    const paths=s.items.filter(x=>x.kind==='path');
    const questionBlock=findExploreBlock('Question');
    const questionEmpty=questionBlock?.querySelector('.ideas-v1-empty.small');
    if(questionEmpty&&questions.length===0){
      const missingText=s.missing.length?`2b2c a déjà identifié ce qu’il faut clarifier : ${s.missing.join(', ')}.`:'Aucune question bloquante n’est détectée. Vous pouvez tout de même challenger la compréhension si nécessaire.';
      questionEmpty.className='ideas-v1-empty small ideas-v2-smart-empty';
      questionEmpty.innerHTML=`<strong>${s.missing.length?'La prochaine question est déjà identifiable':'Aucune zone morte ici'}</strong><p>${esc(missingText)}</p>${actionButton(s.missing.length?'Répondre aux questions':'Poser une question utile','questions')}`;
    }
    const pathBlock=findExploreBlock('Pistes');
    const pathEmpty=pathBlock?.querySelector('.ideas-v1-empty.small');
    if(pathEmpty&&paths.length===0){
      const clarifying=s.phase==='clarify';
      pathEmpty.className='ideas-v1-empty small ideas-v2-smart-empty';
      pathEmpty.innerHTML=`<strong>${clarifying?'Les pistes viennent après la clarification':'Aucune piste retenue pour le moment'}</strong><p>${clarifying?'Clarifions d’abord le problème, les personnes concernées et la proposition pour éviter des variantes hors sujet.':'Demandez à 2b2c de proposer des variantes utiles ; aucune piste ne sera retenue automatiquement.'}</p>${actionButton(clarifying?'Clarifier d’abord':'Proposer des pistes',clarifying?'questions':'improve')}`;
    }
  }

  function decisionIsReady(s){
    if(['approved','converted'].includes(s.idea.status)) return true;
    return !s.missing.length&&s.hasPath&&s.hasRisk&&s.hasEvidence&&s.idea.visibility!=='private'&&s.reviews.length>0;
  }

  function patchDecision(s){
    const onDecision=route().includes('/decision');
    document.documentElement.dataset.ideaDecisionReady=onDecision&&decisionIsReady(s)?'true':'false';
    if(!onDecision) return;
    const ready=decisionIsReady(s), m=phaseMeta[s.phase]||phaseMeta.clarify;
    const summary=document.querySelector('.ideas-v1-decision-summary');
    if(summary){
      const existing=summary.querySelector('.ideas-v2-decision-state');
      if(ready) existing?.remove();
      else {
        const html=`<strong>Validation pour projet non disponible</strong><span>Cette idée est encore à l’étape ${esc(m.label)}. Vous pouvez approfondir, mettre en attente ou écarter l’idée, mais pas la valider comme prête pour un projet.</span>`;
        if(existing){if(existing.innerHTML!==html)existing.innerHTML=html;}
        else {const note=document.createElement('div');note.className='ideas-v2-decision-state';note.innerHTML=html;summary.querySelector('.ideas-v1-decision-facts')?.before(note);}
      }
    }
    const baseApprove=document.querySelector('.ideas-v1-final-actions [data-idea-action="decide"][data-outcome="approved"]');
    if(baseApprove){baseApprove.disabled=!ready;baseApprove.classList.toggle('ideas-v2-decision-blocked',!ready);baseApprove.title=ready?'':'Disponible lorsque l’idée atteint l’étape Décider';}
    const modalApprove=document.querySelector('[data-final-outcome="approved"]');
    if(modalApprove){modalApprove.disabled=!ready;modalApprove.classList.toggle('ideas-v2-decision-blocked',!ready);}
    const modalBody=document.querySelector('.idea-final-v1');
    if(modalBody){
      const existing=modalBody.querySelector('.ideas-v2-final-modal-note');
      if(ready) existing?.remove();
      else {const text=`Validation bloquée à l’étape ${m.label}. Les choix Approfondir, Mettre en attente et Abandonner restent disponibles.`;if(existing){if(existing.textContent!==text)existing.textContent=text;}else{const note=document.createElement('p');note.className='ideas-v2-final-modal-note';note.textContent=text;modalBody.prepend(note);}}
    }
  }

  async function patchDetail(){
    const id=ideaId(); if(!id) return;
    const seq=++renderSeq, s=await ideaState(id); if(!s||seq!==renderSeq||ideaId()!==id) return;
    const bar=document.querySelector('.ideas-ai-v1-bar');
    if(bar){const html=detailBarHtml(s);bar.classList.add('ideas-v2-orchestrated');if(bar.innerHTML!==html)bar.innerHTML=html;}
    const guide=document.querySelector('.ideas-v1-guide');
    if(guide){const g=guideMeta(s),html=`<div class="ideas-v2-guide-icon">✦</div><div><small>2b2c vous guide</small><h2>${esc(g.title)}</h2><p>${esc(g.text)}</p></div>`;guide.classList.add('ideas-v2-guide');if(guide.innerHTML!==html)guide.innerHTML=html;}
    // La colonne de droite reste volontairement la checklist métier d’origine.
    // ideas-explore-audit-v1.js peut ainsi mettre à jour correctement preuves et avis.
    patchExplore(s);
    patchDecision(s);
    patchBranding();
    patchSidebar();
  }

  async function projectsData(){const w=workspaceId();if(!w||!api.getSession()?.access_token)return[];return api.select('ideas',`select=id,title,summary,original_text,status,visibility,problem,audience,proposal,updated_at&workspace_id=eq.${w}&order=updated_at.desc`).catch(()=>[]);}
  function statusText(i){if(i.status==='approved') return 'Approuvée'; if(i.status==='in_review') return 'En discussion'; if(i.status==='ready_for_review') return 'Prête à partager'; if(i.status==='exploring') return 'En exploration'; if(i.status==='needs_work') return 'À approfondir'; return 'À clarifier';}
  function ideaReadiness(i){return [i.problem,i.audience,i.proposal].filter(x=>x?.trim()).length;}

  async function patchProjects(){
    if(route()!=='#/projects') return;
    const seq=++renderSeq, ideas=await projectsData(); if(seq!==renderSeq||route()!=='#/projects')return;
    document.querySelectorAll('.ideas-v1-projects-panel').forEach(n=>n.remove());
    const active=ideas.filter(i=>!['converted','rejected'].includes(i.status));
    const ready=active.filter(i=>['ready_for_review','in_review','approved'].includes(i.status));
    const needs=active.filter(i=>ideaReadiness(i)<3);
    const recent=active.slice(0,3);
    const html=`<div class="ideas-v2-projects-head"><div><span class="ideas-v2-kicker">Avant le projet</span><h2>Idées</h2><p>Les idées restent ici jusqu’à ce qu’une décision justifie un vrai projet.</p></div><div><a href="#/ideas">Voir toutes</a><button type="button" data-idea-action="new">+ Nouvelle idée</button></div></div><div class="ideas-v2-projects-body"><div class="ideas-v2-stats"><div><strong>${active.length}</strong><span>en réflexion</span></div><div><strong>${needs.length}</strong><span>à clarifier</span></div><div><strong>${ready.length}</strong><span>prêtes à partager/décider</span></div></div><div class="ideas-v2-recent">${recent.length?recent.map(i=>`<a href="#/ideas/${esc(i.id)}/overview"><div><strong>${esc(i.title||'Sans titre')}</strong><span>${esc(statusText(i))}</span></div><small>${esc((i.summary||i.original_text||'').slice(0,92))}</small></a>`).join(''):`<button type="button" data-idea-action="new" class="ideas-v2-empty"><strong>Commencer par une idée, pas par un projet</strong><span>Une phrase suffit. 2b2c vous guide ensuite.</span></button>`}</div></div>`;
    let hub=document.querySelector('.ideas-v2-projects-hub');
    if(hub){if(hub.innerHTML!==html)hub.innerHTML=html;}
    else {hub=document.createElement('section');hub.className='ideas-v2-projects-hub';hub.innerHTML=html;const content=document.querySelector('.live-content');const heading=content?.querySelector('h1');const anchor=heading?.closest('header,section,div');if(anchor?.parentNode) anchor.parentNode.insertBefore(hub,anchor.nextSibling); else content?.prepend(hub);}
    patchSidebar();patchBranding();
  }

  function patchSidebar(){if(!ideaId()&&route()!=='#/ideas'&&!route().startsWith('#/ideas/'))return;document.querySelectorAll('a[href="#/"],a[href="#/dashboard"]').forEach(a=>a.classList.remove('active','selected'));document.querySelectorAll('a[href="#/projects"]').forEach(a=>a.classList.add('active'));}
  function patchBranding(){if(!ideaId()&&route()!=='#/projects'&&!route().startsWith('#/ideas'))return;document.querySelectorAll('.ideas-v1-modal input[placeholder],.ideas-ai-v1-panel small,.ideas-v1-guide small').forEach(n=>{if(n.placeholder)n.placeholder=n.placeholder.replace(/4b4c/gi,'2b2c');if(n.textContent)n.textContent=n.textContent.replace(/4b4c/gi,'2b2c')});}
  async function doAction(action){if(['understand','questions','improve','challenge','synthesize'].includes(action)) return window.__4B4C_IDEAS_AI_V1__?.run?.(action);if(action==='evidence') return window.__4B4C_IDEAS_EVIDENCE_V1__?.openResearch?.();if(action==='presentation') return window.__4B4C_IDEAS_EVIDENCE_V1__?.presentation?.();if(action==='share') return document.querySelector('[data-idea-action="share"]')?.click();if(action==='decision'){const id=ideaId();if(id)location.hash=`#/ideas/${id}/decision`;return;}if(action==='convert') return document.querySelector('[data-idea-action="convert"]')?.click();if(action==='projects')location.hash='#/projects';}
  function guardRouteTransition(){const ideas=route()==='#/ideas'||route().startsWith('#/ideas/');document.documentElement.dataset.ideasRouteBooting=ideas?'true':'false';if(ideas)document.querySelector('.live-content')?.classList.remove('ideas-v1-owned');}
  function refresh(){clearTimeout(timer);timer=setTimeout(()=>{if(route()==='#/projects')patchProjects();else if(ideaId())patchDetail();},120)}

  document.addEventListener('click',e=>{
    const blockedApproval=e.target.closest('[data-final-outcome="approved"]');
    if(blockedApproval&&document.documentElement.dataset.ideaDecisionReady==='false'){
      e.preventDefault();e.stopImmediatePropagation();return;
    }
    const b=e.target.closest('[data-ideas-v2-action]');if(!b)return;e.preventDefault();doAction(b.dataset.ideasV2Action);
  },true);
  window.addEventListener('hashchange',()=>{guardRouteTransition();refresh();});
  window.addEventListener('4b4c:ideas-refresh',refresh);
  new MutationObserver(refresh).observe(document.documentElement,{childList:true,subtree:true});
  ensureUxStyles();guardRouteTransition();setTimeout(refresh,600);
  window.__2B2C_IDEAS_ORCHESTRATOR_V2__=Object.freeze({version:'2.0.1-transition-guard',uxRevision:'2.0.2-coherence-p1',refresh});
})();

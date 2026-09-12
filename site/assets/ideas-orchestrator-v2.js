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

  async function patchDetail(){const id=ideaId(); if(!id) return;const seq=++renderSeq, s=await ideaState(id); if(!s||seq!==renderSeq||ideaId()!==id) return;const bar=document.querySelector('.ideas-ai-v1-bar');if(bar){bar.classList.add('ideas-v2-orchestrated');bar.innerHTML=detailBarHtml(s);}const guide=document.querySelector('.ideas-v1-guide');if(guide){const m=phaseMeta[s.phase]||phaseMeta.clarify;guide.classList.add('ideas-v2-guide');guide.innerHTML=`<div class="ideas-v2-guide-icon">✦</div><div><small>2b2c vous guide</small><h2>${esc(m.title)}</h2><p>${esc(s.phase==='clarify'&&s.missing.length?`Commencez par ${s.missing.slice(0,2).join(' et ')}. Les réponses seront enregistrées directement dans l’idée.`:m.text)}</p></div>`;}const maturity=document.querySelector('.ideas-v1-maturity-head');if(maturity){const m=phaseMeta[s.phase]||phaseMeta.clarify;maturity.innerHTML=`<div><small>Progression</small><strong>${esc(m.label)}</strong></div><span class="ideas-v2-stage-badge">${m.step}/5</span>`;}const checks=document.querySelector('.ideas-v1-checks');if(checks) checks.innerHTML=stages((phaseMeta[s.phase]||phaseMeta.clarify).step);document.querySelectorAll('.ideas-v1-hint').forEach(n=>n.remove());patchBranding();patchSidebar();}

  async function projectsData(){const w=workspaceId();if(!w||!api.getSession()?.access_token)return[];return api.select('ideas',`select=id,title,summary,original_text,status,visibility,problem,audience,proposal,updated_at&workspace_id=eq.${w}&order=updated_at.desc`).catch(()=>[]);}
  function statusText(i){if(i.status==='approved') return 'Approuvée'; if(i.status==='in_review') return 'En discussion'; if(i.status==='ready_for_review') return 'Prête à partager'; if(i.status==='exploring') return 'En exploration'; if(i.status==='needs_work') return 'À approfondir'; return 'À clarifier';}
  function ideaReadiness(i){return [i.problem,i.audience,i.proposal].filter(x=>x?.trim()).length;}

  async function patchProjects(){if(route()!=='#/projects') return;const seq=++renderSeq, ideas=await projectsData(); if(seq!==renderSeq||route()!=='#/projects')return;document.querySelectorAll('.ideas-v1-projects-panel,.ideas-v2-projects-hub').forEach(n=>n.remove());const active=ideas.filter(i=>!['converted','rejected'].includes(i.status));const ready=active.filter(i=>['ready_for_review','in_review','approved'].includes(i.status));const needs=active.filter(i=>ideaReadiness(i)<3);const recent=active.slice(0,3);const hub=document.createElement('section');hub.className='ideas-v2-projects-hub';hub.innerHTML=`<div class="ideas-v2-projects-head"><div><span class="ideas-v2-kicker">Avant le projet</span><h2>Idées</h2><p>Capturez, clarifiez et décidez avant de créer du travail dans les projets.</p></div><div><a href="#/ideas">Voir toutes</a><button type="button" data-idea-action="new">+ Nouvelle idée</button></div></div><div class="ideas-v2-projects-body"><div class="ideas-v2-stats"><div><strong>${active.length}</strong><span>en réflexion</span></div><div><strong>${needs.length}</strong><span>à clarifier</span></div><div><strong>${ready.length}</strong><span>prêtes à partager/décider</span></div></div><div class="ideas-v2-recent">${recent.length?recent.map(i=>`<a href="#/ideas/${esc(i.id)}/overview"><div><strong>${esc(i.title||'Sans titre')}</strong><span>${esc(statusText(i))}</span></div><small>${esc((i.summary||i.original_text||'').slice(0,110))}</small></a>`).join(''):`<button type="button" data-idea-action="new" class="ideas-v2-empty"><strong>Commencer par une idée, pas par un projet</strong><span>Une phrase suffit. 2b2c vous guide ensuite.</span></button>`}</div></div>`;const content=document.querySelector('.live-content');const heading=content?.querySelector('h1');const anchor=heading?.closest('header,section,div');if(anchor?.parentNode) anchor.parentNode.insertBefore(hub,anchor.nextSibling); else content?.prepend(hub);patchSidebar();patchBranding();}

  function patchSidebar(){if(!ideaId()&&route()!=='#/ideas'&&!route().startsWith('#/ideas/'))return;document.querySelectorAll('a[href="#/"],a[href="#/dashboard"]').forEach(a=>a.classList.remove('active','selected'));document.querySelectorAll('a[href="#/projects"]').forEach(a=>a.classList.add('active'));}
  function patchBranding(){if(!ideaId()&&route()!=='#/projects'&&!route().startsWith('#/ideas'))return;document.querySelectorAll('.ideas-v1-modal input[placeholder],.ideas-ai-v1-panel small,.ideas-v1-guide small').forEach(n=>{if(n.placeholder)n.placeholder=n.placeholder.replace(/4b4c/gi,'2b2c');if(n.textContent)n.textContent=n.textContent.replace(/4b4c/gi,'2b2c')});}
  async function doAction(action){if(['understand','questions','improve','challenge','synthesize'].includes(action)) return window.__4B4C_IDEAS_AI_V1__?.run?.(action);if(action==='evidence') return window.__4B4C_IDEAS_EVIDENCE_V1__?.openResearch?.();if(action==='presentation') return window.__4B4C_IDEAS_EVIDENCE_V1__?.presentation?.();if(action==='share') return document.querySelector('[data-idea-action="share"]')?.click();if(action==='decision'){const id=ideaId();if(id)location.hash=`#/ideas/${id}/decision`;return;}if(action==='convert') return document.querySelector('[data-idea-action="convert"]')?.click();if(action==='projects')location.hash='#/projects';}
  function guardRouteTransition(){const ideas=route()==='#/ideas'||route().startsWith('#/ideas/');document.documentElement.dataset.ideasRouteBooting=ideas?'true':'false';if(ideas)document.querySelector('.live-content')?.classList.remove('ideas-v1-owned');}
  function refresh(){clearTimeout(timer);timer=setTimeout(()=>{if(route()==='#/projects')patchProjects();else if(ideaId())patchDetail();},120)}
  document.addEventListener('click',e=>{const b=e.target.closest('[data-ideas-v2-action]');if(!b)return;e.preventDefault();doAction(b.dataset.ideasV2Action)});
  window.addEventListener('hashchange',()=>{guardRouteTransition();refresh();});window.addEventListener('4b4c:ideas-refresh',refresh);new MutationObserver(refresh).observe(document.documentElement,{childList:true,subtree:true});guardRouteTransition();setTimeout(refresh,600);window.__2B2C_IDEAS_ORCHESTRATOR_V2__=Object.freeze({version:'2.0.1-transition-guard',refresh});
})();
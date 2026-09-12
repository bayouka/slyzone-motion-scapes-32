import { SupabaseBrowserClient } from './supabase-client.js';

(() => {
  if (window.__4B4C_IDEAS_V1__) return;
  const config = window.__4B4C_CONFIG__ || {};
  const api = new SupabaseBrowserClient({ url: config.supabaseUrl, publishableKey: config.supabasePublishableKey });
  const workspaceKey = config.workspaceStorageKey || '4b4c.live.workspace.v1';
  const state = { busy:false, user:null, ideas:[], bundle:null, members:[], profiles:new Map(), modal:null, renderToken:0 };

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const attr = esc;
  const one = (value) => Array.isArray(value) ? value[0] ?? null : value;
  const wid = () => localStorage.getItem(workspaceKey) || '';
  const route = () => (location.hash || '#/').replace(/^#/, '');
  const isIdeasRoute = () => route().startsWith('/ideas');
  const content = () => document.querySelector('.live-content');
  const profileName = (id) => state.profiles.get(id)?.display_name || (id === state.user?.id ? 'Vous' : 'Membre');
  const fmtDate = (value) => value ? new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(value)) : '';
  const statusLabel = (value) => ({draft:'Brouillon',exploring:'En exploration',ready_for_review:'Prête à partager',in_review:'En discussion',approved:'Approuvée',needs_work:'À approfondir',parked:'En attente',rejected:'Écartée',converted:'Convertie en projet'})[value] || value;
  const visibilityLabel = (value) => ({private:'Privée',shared:'Partagée',team:'Équipe'})[value] || value;
  const kindLabel = (value) => ({question:'Question',reference:'Référence',hypothesis:'Hypothèse',path:'Piste',risk:'Risque',evidence:'Preuve',note:'Note'})[value] || value;
  const stateLabel = (value) => ({open:'Ouvert',keep:'À garder',explore:'À explorer',drop:'Écarté',resolved:'Résolu'})[value] || value;

  function icon(name){
    const paths={
      bulb:'<path d="M9 18h6M10 21h4"/><path d="M8.2 14.5A6 6 0 1 1 15.8 14.5C14.7 15.3 14 16.5 14 18h-4c0-1.5-.7-2.7-1.8-3.5Z"/>',
      plus:'<path d="M12 5v14M5 12h14"/>',
      arrow:'<path d="m9 18 6-6-6-6"/>',
      spark:'<path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3ZM18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14Z"/>',
      share:'<path d="M12 3v12M8 7l4-4 4 4"/><path d="M5 12v7h14v-7"/>',
      chat:'<path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8l-5 3v-3H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/>',
      check:'<path d="m5 12 4 4L19 6"/>',
      presentation:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M12 17v4M8 21h8"/>',
      project:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9h8M8 13h5"/>'
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]||paths.bulb}</svg>`;
  }

  async function ensureUser(){ if(state.user?.id) return state.user; if(!api.getSession()?.access_token) return null; state.user=await api.getUser(); return state.user; }
  async function loadPeople(){
    const workspace=wid(); if(!workspace) return;
    const [members,profiles]=await Promise.all([
      api.select('workspace_members',`select=user_id,role,status&workspace_id=eq.${workspace}&status=eq.active&order=joined_at.asc`).catch(()=>[]),
      api.select('profiles','select=id,display_name,avatar_url').catch(()=>[])
    ]);
    state.members=(members||[]).filter(m=>m.role!=='guest'); state.profiles=new Map((profiles||[]).map(p=>[p.id,p]));
  }
  async function loadIdeas(){
    const workspace=wid(); if(!workspace||!api.getSession()?.access_token) return [];
    state.ideas=await api.select('ideas',`select=id,workspace_id,created_by,title,original_text,summary,problem,audience,proposal,status,visibility,readiness,conversation_id,converted_project_id,version,created_at,updated_at&workspace_id=eq.${workspace}&order=updated_at.desc`).catch(()=>[]);
    return state.ideas;
  }
  async function loadBundle(id){
    await ensureUser(); await loadPeople();
    const [ideaRows,items,votes,reviews,decisions,members]=await Promise.all([
      api.select('ideas',`select=*&id=eq.${id}&limit=1`),
      api.select('idea_items',`select=*&idea_id=eq.${id}&order=created_at.asc`).catch(()=>[]),
      api.select('idea_item_votes',`select=*&idea_item_id=in.(${await ideaItemIds(id)})`).catch(()=>[]),
      api.select('idea_reviews',`select=*&idea_id=eq.${id}&order=updated_at.desc`).catch(()=>[]),
      api.select('idea_decisions',`select=*&idea_id=eq.${id}&order=decided_at.desc`).catch(()=>[]),
      api.select('idea_members',`select=*&idea_id=eq.${id}`).catch(()=>[])
    ]);
    const idea=one(ideaRows); if(!idea) throw new Error('Idée introuvable ou inaccessible.');
    state.bundle={idea,items,votes,reviews,decisions,members}; return state.bundle;
  }
  async function ideaItemIds(id){
    const rows=await api.select('idea_items',`select=id&idea_id=eq.${id}`).catch(()=>[]);
    return rows.length?rows.map(r=>r.id).join(','):'00000000-0000-0000-0000-000000000000';
  }

  function maturity(idea,items=[],reviews=[]){
    const checks=[
      ['Besoin compris',Boolean(idea.problem?.trim())],
      ['Personnes concernées identifiées',Boolean(idea.audience?.trim())],
      ['Proposition suffisamment claire',Boolean(idea.proposal?.trim())],
      ['Au moins une référence ou preuve',items.some(x=>['reference','evidence'].includes(x.kind))],
      ['Avis de l’équipe recueilli',reviews.length>0]
    ];
    const done=checks.filter(x=>x[1]).length;
    const label=idea.status==='converted'?'Convertie en projet':idea.status==='approved'?'Prête à devenir un projet':done>=4?'Prête pour décision':done>=3?'Prête à être discutée':'À clarifier';
    return {checks,done,label};
  }
  function nextAction(idea,items,reviews){
    if(idea.status==='converted') return ['Projet créé','Ouvrir la liste des projets'];
    if(!idea.problem?.trim()) return ['Clarifier le besoin','Quel problème ou opportunité cette idée doit-elle réellement traiter ?'];
    if(!idea.audience?.trim()) return ['Identifier pour qui','Qui bénéficierait principalement de cette idée ?'];
    if(!idea.proposal?.trim()) return ['Formuler la proposition','Décrivez la solution actuelle en quelques phrases, sans chercher à tout figer.'];
    if(!items.some(x=>['reference','evidence'].includes(x.kind))) return ['Explorer les alternatives','Ajoutez au moins une référence, un concurrent, une preuve ou une alternative existante.'];
    if(idea.visibility==='private') return ['Partager avec l’équipe','L’idée est suffisamment claire pour recueillir d’autres points de vue.'];
    if(!reviews.length) return ['Demander un avis','L’équipe peut maintenant approuver, approfondir, mettre en attente ou écarter.'];
    if(idea.status==='approved') return ['Transformer en projet','La décision est prise. Créez le projet sans perdre le travail de réflexion.'];
    return ['Continuer la réflexion','Traitez les questions et risques encore ouverts avant une nouvelle décision.'];
  }
  function canWrite(bundle){
    const {idea,members}=bundle; const mine=members.find(m=>m.user_id===state.user?.id); const wm=state.members.find(m=>m.user_id===state.user?.id);
    return idea.created_by===state.user?.id || mine?.role==='editor' || ['owner','admin'].includes(wm?.role);
  }

  function shell(title,subtitle,body,actions=''){
    return `<div class="ideas-v1-page"><header class="ideas-v1-pagehead"><div><a class="ideas-v1-back" href="#/projects">Projets</a><h1>${esc(title)}</h1>${subtitle?`<p>${esc(subtitle)}</p>`:''}</div>${actions?`<div class="ideas-v1-head-actions">${actions}</div>`:''}</header>${body}</div>`;
  }

  function ideaCard(idea){
    const m=maturity(idea,[],[]);
    return `<a class="ideas-v1-card" href="#/ideas/${attr(idea.id)}/overview"><div class="ideas-v1-card-icon">${icon('bulb')}</div><div class="ideas-v1-card-main"><div class="ideas-v1-card-top"><strong>${esc(idea.title)}</strong><span class="idea-status ${attr(idea.status)}">${esc(statusLabel(idea.status))}</span></div><p>${esc(idea.summary||idea.original_text)}</p><small>${esc(visibilityLabel(idea.visibility))} · ${esc(m.label)} · ${esc(fmtDate(idea.updated_at))}</small></div><span class="ideas-v1-chevron">${icon('arrow')}</span></a>`;
  }

  async function renderList(){
    const token=++state.renderToken; await ensureUser(); const ideas=await loadIdeas(); if(token!==state.renderToken||!isIdeasRoute())return;
    const active=ideas.filter(i=>!['converted','rejected'].includes(i.status));
    const archived=ideas.filter(i=>['converted','rejected'].includes(i.status));
    const body=`<section class="ideas-v1-intro"><div><span class="ideas-v1-kicker">Avant le projet</span><h2>Faire mûrir une idée sans la transformer trop tôt en projet</h2><p>Clarifiez-la, confrontez-la à des références, recueillez l’avis de l’équipe puis décidez si elle mérite un vrai projet.</p></div><button class="ideas-v1-primary" data-idea-action="new">${icon('plus')} Nouvelle idée</button></section><section class="ideas-v1-section"><div class="ideas-v1-sectionhead"><div><h2>En réflexion</h2><p>${active.length} idée${active.length>1?'s':''} à clarifier, explorer ou décider</p></div></div><div class="ideas-v1-list">${active.length?active.map(ideaCard).join(''):`<div class="ideas-v1-empty"><span>${icon('bulb')}</span><strong>Commencez par une idée simple</strong><p>Une phrase suffit. 4b4c vous aidera ensuite à la structurer.</p><button data-idea-action="new">Créer ma première idée</button></div>`}</div></section>${archived.length?`<section class="ideas-v1-section muted"><div class="ideas-v1-sectionhead"><h2>Historique</h2></div><div class="ideas-v1-list">${archived.map(ideaCard).join('')}</div></section>`:''}`;
    ownRoute(shell('Idées','De l’intuition à une décision d’équipe',body,`<button class="ideas-v1-primary compact" data-idea-action="new">${icon('plus')} Nouvelle idée</button>`));
  }

  function overview(bundle){
    const {idea,items,reviews}=bundle; const write=canWrite(bundle); const m=maturity(idea,items,reviews); const next=nextAction(idea,items,reviews);
    const missing=m.checks.filter(x=>!x[1]);
    return `<div class="ideas-v1-layout"><main class="ideas-v1-main"><section class="ideas-v1-hero"><div class="ideas-v1-hero-top"><span class="idea-status ${attr(idea.status)}">${esc(statusLabel(idea.status))}</span><span>${esc(visibilityLabel(idea.visibility))}</span></div><h2>${esc(idea.summary||idea.title)}</h2><blockquote>${esc(idea.original_text)}</blockquote>${write?`<button class="ideas-v1-link" data-idea-action="edit-core">Modifier la synthèse</button>`:''}</section><section class="ideas-v1-core-grid"><article><small>Pourquoi ?</small><strong>${idea.problem?.trim()?esc(idea.problem):'À préciser'}</strong></article><article><small>Pour qui ?</small><strong>${idea.audience?.trim()?esc(idea.audience):'À préciser'}</strong></article><article class="wide"><small>Proposition actuelle</small><strong>${idea.proposal?.trim()?esc(idea.proposal):'À préciser'}</strong></article></section><section class="ideas-v1-next"><div class="ideas-v1-next-icon">${icon('spark')}</div><div><small>Prochaine action recommandée</small><h3>${esc(next[0])}</h3><p>${esc(next[1])}</p></div>${next[0]==='Partager avec l’équipe'?`<button data-idea-action="share">Partager</button>`:next[0]==='Transformer en projet'?`<button data-idea-action="convert">Créer le projet</button>`:`<a href="#/ideas/${attr(idea.id)}/explore">Continuer</a>`}</section></main><aside class="ideas-v1-aside"><section><div class="ideas-v1-maturity-head"><div><small>État de préparation</small><strong>${esc(m.label)}</strong></div><span>${m.done}/5</span></div><div class="ideas-v1-checks">${m.checks.map(([label,ok])=>`<div class="${ok?'done':''}"><i>${ok?'✓':'·'}</i><span>${esc(label)}</span></div>`).join('')}</div>${missing.length?`<p class="ideas-v1-hint">Il manque surtout : ${esc(missing.slice(0,2).map(x=>x[0].toLowerCase()).join(' et '))}.</p>`:''}</section><section><small>Créée par</small><strong>${esc(profileName(idea.created_by))}</strong><p>Dernière mise à jour ${esc(fmtDate(idea.updated_at))}</p></section></aside></div>`;
  }

  function explore(bundle){
    const {idea,items,votes}=bundle; const write=canWrite(bundle); const byKind=['question','reference','hypothesis','path','risk','evidence'];
    const counts=new Map(); for(const v of votes) counts.set(`${v.idea_item_id}:${v.vote}`,(counts.get(`${v.idea_item_id}:${v.vote}`)||0)+1);
    const mine=new Map(votes.filter(v=>v.user_id===state.user?.id).map(v=>[v.idea_item_id,v.vote]));
    const sections=byKind.map(kind=>{
      const rows=items.filter(x=>x.kind===kind&&x.state!=='drop'); if(!rows.length&&kind!=='path'&&kind!=='question')return'';
      return `<section class="ideas-v1-explore-block"><div class="ideas-v1-sectionhead"><div><h2>${esc(kindLabel(kind))}${kind==='path'?'s':''}</h2><p>${kind==='question'?'Ce qu’il reste à comprendre':kind==='reference'?'Concurrents, exemples, documents et sources':kind==='hypothesis'?'Ce que nous pensons vrai sans l’avoir encore démontré':kind==='path'?'Améliorations et variantes proposées':kind==='risk'?'Ce qui pourrait empêcher l’idée de fonctionner':'Éléments qui renforcent la proposition'}</p></div>${write?`<button data-idea-action="add-item" data-kind="${kind}">${icon('plus')} Ajouter</button>`:''}</div><div class="ideas-v1-items">${rows.length?rows.map(item=>`<article class="ideas-v1-item"><div class="ideas-v1-item-main"><div><span class="idea-item-kind">${esc(kindLabel(item.kind))}</span><span class="idea-item-state ${attr(item.state)}">${esc(stateLabel(item.state))}</span></div><h3>${esc(item.title)}</h3>${item.body?`<p>${esc(item.body)}</p>`:''}${item.url?`<a href="${attr(item.url)}" target="_blank" rel="noopener">Ouvrir la référence</a>`:''}</div><div class="ideas-v1-item-actions"><button class="${mine.get(item.id)==='keep'?'active':''}" data-idea-action="vote-item" data-item="${attr(item.id)}" data-vote="keep">👍 <span>${counts.get(`${item.id}:keep`)||0}</span></button><button class="${mine.get(item.id)==='explore'?'active':''}" data-idea-action="vote-item" data-item="${attr(item.id)}" data-vote="explore">🤔 <span>${counts.get(`${item.id}:explore`)||0}</span></button><button class="${mine.get(item.id)==='drop'?'active':''}" data-idea-action="vote-item" data-item="${attr(item.id)}" data-vote="drop">👎 <span>${counts.get(`${item.id}:drop`)||0}</span></button>${write?`<select data-idea-item-state="${attr(item.id)}"><option value="open" ${item.state==='open'?'selected':''}>Ouvert</option><option value="keep" ${item.state==='keep'?'selected':''}>À garder</option><option value="explore" ${item.state==='explore'?'selected':''}>À explorer</option><option value="resolved" ${item.state==='resolved'?'selected':''}>Résolu</option><option value="drop">Écarter</option></select>`:''}</div></article>`).join(''):`<div class="ideas-v1-empty small"><p>Aucun élément pour le moment.</p></div>`}</div></section>`;
    }).join('');
    const suggested=[]; if(!idea.problem?.trim())suggested.push('Quel problème concret voulez-vous résoudre ?'); if(!idea.audience?.trim())suggested.push('Qui rencontre ce problème aujourd’hui ?'); if(!idea.proposal?.trim())suggested.push('Quelle est la version la plus simple de la solution ?'); if(!items.some(x=>x.kind==='reference'))suggested.push('Quelles solutions existent déjà et pourquoi sont-elles insuffisantes ?'); if(!items.some(x=>x.kind==='risk'))suggested.push('Qu’est-ce qui pourrait rendre cette idée inutile, trop complexe ou difficile à adopter ?');
    return `<section class="ideas-v1-guide"><div>${icon('spark')}</div><div><small>4b4c vous guide</small><h2>${suggested.length?'Questions qui changent réellement la compréhension':'L’idée est suffisamment cadrée pour être challengée avec l’équipe'}</h2>${suggested.length?`<ol>${suggested.slice(0,3).map(q=>`<li>${esc(q)}</li>`).join('')}</ol>`:`<p>Utilisez les pistes, risques et références pour améliorer la proposition avant la décision.</p>`}</div></section>${sections}`;
  }

  function discussion(bundle){
    const {idea,members}=bundle; const shared=idea.visibility!=='private';
    return `<section class="ideas-v1-discussion"><div class="ideas-v1-discussion-icon">${icon('chat')}</div><div><span class="ideas-v1-kicker">Échanges</span><h2>${shared?'Une seule conversation, dans le contexte de cette idée':'Cette idée est encore privée'}</h2><p>${shared?'Les messages utilisent la messagerie 4b4c existante : pas de second chat, pas de conversations dupliquées.':'Partagez l’idée lorsque vous êtes prêt à demander un avis. Rien n’est publié automatiquement.'}</p><div class="ideas-v1-members">${members.map(m=>`<span>${esc(profileName(m.user_id))}</span>`).join('')}</div></div>${shared&&idea.conversation_id?`<a class="ideas-v1-primary" href="#/messages/${attr(idea.conversation_id)}">Ouvrir la discussion</a>`:`<button class="ideas-v1-primary" data-idea-action="share">Partager avec l’équipe</button>`}</section>`;
  }

  function decision(bundle){
    const {idea,reviews,decisions,items}=bundle; const write=canWrite(bundle); const m=maturity(idea,items,reviews);
    const counts={approve:0,deepen:0,park:0,reject:0}; reviews.forEach(r=>counts[r.vote]=(counts[r.vote]||0)+1);
    const latest=decisions[0];
    return `<div class="ideas-v1-decision-grid"><main><section class="ideas-v1-decision-summary"><span class="ideas-v1-kicker">Préparer la décision</span><h2>${esc(idea.title)}</h2><p>${esc(idea.summary||idea.original_text)}</p><div class="ideas-v1-decision-facts"><div><small>Problème</small><strong>${esc(idea.problem||'À préciser')}</strong></div><div><small>Pour qui</small><strong>${esc(idea.audience||'À préciser')}</strong></div><div><small>Proposition</small><strong>${esc(idea.proposal||'À préciser')}</strong></div><div><small>Préparation</small><strong>${esc(m.label)}</strong></div></div><button data-idea-action="present">${icon('presentation')} Mode présentation</button></section><section class="ideas-v1-review"><div class="ideas-v1-sectionhead"><div><h2>Avis de l’équipe</h2><p>Un avis éclaire la décision ; il ne la remplace pas.</p></div></div><div class="ideas-v1-review-options"><button data-idea-action="review" data-vote="approve">✓ Favorable <span>${counts.approve}</span></button><button data-idea-action="review" data-vote="deepen">↻ Approfondir <span>${counts.deepen}</span></button><button data-idea-action="review" data-vote="park">⏸ Pas maintenant <span>${counts.park}</span></button><button data-idea-action="review" data-vote="reject">× Défavorable <span>${counts.reject}</span></button></div>${reviews.length?`<div class="ideas-v1-review-list">${reviews.map(r=>`<div><strong>${esc(profileName(r.user_id))}</strong><span>${esc(({approve:'Favorable',deepen:'Approfondir',park:'Pas maintenant',reject:'Défavorable'})[r.vote])}</span>${r.comment?`<p>${esc(r.comment)}</p>`:''}</div>`).join('')}</div>`:''}</section></main><aside><section class="ideas-v1-final-decision"><small>Décision finale</small>${latest?`<strong>${esc(statusLabel(latest.outcome))}</strong><p>${esc(latest.rationale||'Aucun motif ajouté.')}</p><span>${esc(profileName(latest.decided_by))} · ${esc(fmtDate(latest.decided_at))}</span>`:`<strong>Aucune décision prise</strong><p>L’équipe peut donner son avis avant qu’un responsable tranche.</p>`}${write?`<div class="ideas-v1-final-actions"><button data-idea-action="decide" data-outcome="approved">Passer en projet</button><button data-idea-action="decide" data-outcome="needs_work">Approfondir</button><button data-idea-action="decide" data-outcome="parked">Mettre en attente</button><button data-idea-action="decide" data-outcome="rejected">Écarter</button></div>`:''}${idea.status==='approved'&&write?`<button class="ideas-v1-convert" data-idea-action="convert">${icon('project')} Transformer en projet</button>`:''}${idea.converted_project_id?`<a class="ideas-v1-convert done" href="#/projects">Projet créé · Voir les projets</a>`:''}</section></aside></div>`;
  }

  async function renderDetail(id,tab='overview'){
    const token=++state.renderToken; try{const bundle=await loadBundle(id);if(token!==state.renderToken||!isIdeasRoute())return;const idea=bundle.idea;const tabs=['overview','explore','discussion','decision'];const labels={overview:'Vue d’ensemble',explore:'Explorer',discussion:'Échanges',decision:'Décision'};const body=`<nav class="ideas-v1-tabs">${tabs.map(t=>`<a class="${t===tab?'active':''}" href="#/ideas/${attr(id)}/${t}">${labels[t]}</a>`).join('')}</nav><div class="ideas-v1-detail-body">${tab==='explore'?explore(bundle):tab==='discussion'?discussion(bundle):tab==='decision'?decision(bundle):overview(bundle)}</div>`;ownRoute(shell(idea.title,`${statusLabel(idea.status)} · ${visibilityLabel(idea.visibility)}`,body,`<button class="ideas-v1-secondary" data-idea-action="share">${icon('share')} Partager</button>`));}catch(error){ownRoute(shell('Idée inaccessible','',`<div class="ideas-v1-empty"><strong>${esc(error.message)}</strong><a href="#/ideas">Retour aux idées</a></div>`));}
  }

  function ownRoute(html){const node=content();if(!node)return;node.classList.add('ideas-v1-owned');node.innerHTML=html;window.scrollTo(0,0);}
  function releaseRoute(){content()?.classList.remove('ideas-v1-owned');}

  async function injectProjects(){
    releaseRoute(); const node=content(); if(!node||node.querySelector('.ideas-v1-projects-panel')||!api.getSession()?.access_token)return;
    const ideas=await loadIdeas(); if(route()!=='/projects')return;
    const active=ideas.filter(i=>!['converted','rejected'].includes(i.status)).slice(0,3);
    const panel=document.createElement('section');panel.className='ideas-v1-projects-panel';panel.innerHTML=`<div class="ideas-v1-projects-panel-head"><div><span class="ideas-v1-kicker">Avant le projet</span><h2>Idées en réflexion</h2><p>Clarifier et décider avant de créer du travail.</p></div><div><a href="#/ideas">Voir toutes</a><button data-idea-action="new">${icon('plus')} Nouvelle idée</button></div></div>${active.length?`<div class="ideas-v1-projects-mini">${active.map(i=>`<a href="#/ideas/${attr(i.id)}/overview"><span>${icon('bulb')}</span><div><strong>${esc(i.title)}</strong><small>${esc(statusLabel(i.status))} · ${esc(visibilityLabel(i.visibility))}</small></div>${icon('arrow')}</a>`).join('')}</div>`:`<button class="ideas-v1-projects-empty" data-idea-action="new"><span>${icon('bulb')}</span><div><strong>Une idée ne devrait pas devenir un projet trop tôt</strong><small>Capturez-la d’abord en une phrase, puis améliorez-la avec l’équipe.</small></div></button>`}`;
    const anchor=node.querySelector('h1')?.closest('header,section,div'); if(anchor?.parentNode)anchor.parentNode.insertBefore(panel,anchor.nextSibling); else node.prepend(panel);
  }

  function modal(html){
    closeModal(); const node=document.createElement('div');node.className='ideas-v1-modal-backdrop';node.innerHTML=`<section class="ideas-v1-modal" role="dialog" aria-modal="true">${html}</section>`;document.body.appendChild(node);state.modal=node;return node;
  }
  function closeModal(){state.modal?.remove();state.modal=null;}
  function modalHead(title,subtitle=''){return `<header><div><h2>${esc(title)}</h2>${subtitle?`<p>${esc(subtitle)}</p>`:''}</div><button type="button" data-idea-action="close-modal" aria-label="Fermer">×</button></header>`;}

  async function newIdeaModal(){
    modal(`${modalHead('Nouvelle idée','Écrivez-la comme elle vous vient. Aucun formulaire de cadrage à remplir.')}<form data-idea-form="new"><label>Votre idée<textarea name="original" rows="7" required placeholder="Ex. J’aimerais créer un moyen simple pour…"></textarea></label><label class="optional">Titre <span>facultatif</span><input name="title" placeholder="4b4c peut le reprendre de votre texte"></label><footer><button type="button" data-idea-action="close-modal">Annuler</button><button class="primary" type="submit">Créer l’idée</button></footer></form>`);
    setTimeout(()=>state.modal?.querySelector('textarea')?.focus(),50);
  }
  async function editCoreModal(){
    const i=state.bundle.idea;modal(`${modalHead('Clarifier l’idée','Quelques champs utiles, pas un dossier à remplir.')}<form data-idea-form="core"><label>Titre<input name="title" value="${attr(i.title)}" required></label><label>En une phrase<textarea name="summary" rows="2" placeholder="La proposition essentielle">${esc(i.summary)}</textarea></label><label>Quel problème ou opportunité ?<textarea name="problem" rows="3">${esc(i.problem)}</textarea></label><label>Pour qui ?<textarea name="audience" rows="2">${esc(i.audience)}</textarea></label><label>Proposition actuelle<textarea name="proposal" rows="4">${esc(i.proposal)}</textarea></label><footer><button type="button" data-idea-action="close-modal">Annuler</button><button class="primary" type="submit">Enregistrer</button></footer></form>`);
  }
  async function addItemModal(kind){modal(`${modalHead(`Ajouter · ${kindLabel(kind)}`)}<form data-idea-form="item"><input type="hidden" name="kind" value="${attr(kind)}"><label>Titre<input name="title" required></label><label>Détail<textarea name="body" rows="4"></textarea></label>${['reference','evidence'].includes(kind)?'<label>Lien <span class="optional">facultatif</span><input name="url" type="url" placeholder="https://…"></label>':''}<footer><button type="button" data-idea-action="close-modal">Annuler</button><button class="primary" type="submit">Ajouter</button></footer></form>`);}
  async function shareModal(){
    await loadPeople();const b=state.bundle;const selected=new Set(b?.members?.map(m=>m.user_id)||[]);const idea=b?.idea;
    modal(`${modalHead('Partager l’idée','Gardez-la privée tant qu’elle est trop embryonnaire.')}<form data-idea-form="share"><label>Visibilité<select name="visibility"><option value="private" ${idea?.visibility==='private'?'selected':''}>Privée · moi uniquement</option><option value="shared" ${idea?.visibility==='shared'?'selected':''}>Partagée · membres choisis</option><option value="team" ${idea?.visibility==='team'?'selected':''}>Équipe · tout l’espace</option></select></label><div class="ideas-v1-member-picker">${state.members.filter(m=>m.user_id!==state.user?.id).map(m=>`<label><input type="checkbox" name="members" value="${attr(m.user_id)}" ${selected.has(m.user_id)?'checked':''}><span>${esc(profileName(m.user_id))}</span><small>${esc(m.role)}</small></label>`).join('')}</div><footer><button type="button" data-idea-action="close-modal">Annuler</button><button class="primary" type="submit">Appliquer</button></footer></form>`);
  }
  function reviewModal(vote){const label=({approve:'Favorable',deepen:'À approfondir',park:'Pas maintenant',reject:'Défavorable'})[vote];modal(`${modalHead(`Votre avis · ${label}`,'L’avis n’est pas la décision finale.')}<form data-idea-form="review"><input type="hidden" name="vote" value="${vote}"><label>Pourquoi ? <span class="optional">facultatif</span><textarea name="comment" rows="4"></textarea></label><footer><button type="button" data-idea-action="close-modal">Annuler</button><button class="primary" type="submit">Envoyer mon avis</button></footer></form>`);}
  function decisionModal(outcome){const label=statusLabel(outcome);modal(`${modalHead(`Décision · ${label}`,'Conservez la raison du choix pour que l’équipe puisse la comprendre plus tard.')}<form data-idea-form="decision"><input type="hidden" name="outcome" value="${outcome}"><label>Motif de la décision<textarea name="rationale" rows="5" required></textarea></label><footer><button type="button" data-idea-action="close-modal">Annuler</button><button class="primary" type="submit">Confirmer la décision</button></footer></form>`);}
  function convertModal(){modal(`${modalHead('Transformer en projet','Le projet utilisera le cadrage validé. Aucune tâche ni roadmap ne sera inventée automatiquement.')}<div class="ideas-v1-convert-confirm"><div>${icon('project')}</div><h3>${esc(state.bundle.idea.title)}</h3><p>4b4c créera un projet standard avec les membres déjà impliqués. L’idée restera consultable comme origine et mémoire de la décision.</p><footer><button data-idea-action="close-modal">Annuler</button><button class="primary" data-idea-action="confirm-convert">Créer le projet</button></footer></div>`);}
  function presentation(){
    const {idea,items}=state.bundle;const refs=items.filter(x=>['reference','evidence'].includes(x.kind)&&x.state!=='drop').slice(0,3);const risks=items.filter(x=>x.kind==='risk'&&x.state!=='drop').slice(0,3);
    modal(`<div class="ideas-v1-presentation"><header><span>Présentation de l’idée</span><button data-idea-action="close-modal">×</button></header><div class="ideas-v1-slides"><section><small>01 · L’idée</small><h2>${esc(idea.title)}</h2><p>${esc(idea.summary||idea.original_text)}</p></section><section><small>02 · Le problème</small><h2>${esc(idea.problem||'À préciser')}</h2><p>Pour ${esc(idea.audience||'un public encore à préciser')}.</p></section><section><small>03 · La proposition</small><h2>${esc(idea.proposal||'Proposition à préciser')}</h2></section><section><small>04 · Ce que nous avons appris</small><h2>${refs.length?'Références et éléments de preuve':'Encore peu de preuves'}</h2>${refs.map(x=>`<p>• ${esc(x.title)}</p>`).join('')}</section><section><small>05 · Les risques</small><h2>${risks.length?'Points à surveiller':'Aucun risque explicite enregistré'}</h2>${risks.map(x=>`<p>• ${esc(x.title)}</p>`).join('')}</section><section><small>06 · Décision demandée</small><h2>Devons-nous transformer cette idée en projet ?</h2><p>Projet · Approfondir · Pas maintenant · Écarter</p></section></div></div>`);state.modal.classList.add('presentation');
  }

  async function refreshDetail(){const parts=route().split('/').filter(Boolean);const id=parts[1];const tab=parts[2]||'overview';if(id)await renderDetail(id,tab);}
  async function handleSubmit(event){
    const form=event.target.closest?.('[data-idea-form]');if(!form)return;event.preventDefault();if(state.busy)return;state.busy=true;const submit=form.querySelector('[type="submit"]');if(submit)submit.disabled=true;
    try{
      const data=new FormData(form);const type=form.dataset.ideaForm;
      if(type==='new'){
        const result=await api.rpc('create_idea_v1',{p_workspace_id:wid(),p_original_text:String(data.get('original')||''),p_title:String(data.get('title')||'')||null});const id=one(result)?.idea_id||result?.idea_id;if(!id)throw new Error('Création de l’idée incomplète.');closeModal();location.hash=`#/ideas/${id}/overview`;
      } else if(type==='core'){
        const i=state.bundle.idea;await api.rpc('update_idea_core_v1',{p_idea_id:i.id,p_expected_version:i.version,p_title:String(data.get('title')||''),p_summary:String(data.get('summary')||''),p_problem:String(data.get('problem')||''),p_audience:String(data.get('audience')||''),p_proposal:String(data.get('proposal')||''),p_readiness:null});closeModal();await refreshDetail();
      } else if(type==='item'){
        await api.rpc('create_idea_item_v1',{p_idea_id:state.bundle.idea.id,p_kind:String(data.get('kind')),p_title:String(data.get('title')||''),p_body:String(data.get('body')||''),p_url:String(data.get('url')||'')||null});closeModal();await refreshDetail();
      } else if(type==='share'){
        const memberIds=data.getAll('members').map(String);await api.rpc('set_idea_access_v1',{p_idea_id:state.bundle.idea.id,p_visibility:String(data.get('visibility')),p_member_ids:memberIds});closeModal();await refreshDetail();
      } else if(type==='review'){
        await api.rpc('submit_idea_review_v1',{p_idea_id:state.bundle.idea.id,p_vote:String(data.get('vote')),p_comment:String(data.get('comment')||'')});closeModal();await refreshDetail();
      } else if(type==='decision'){
        await api.rpc('decide_idea_v1',{p_idea_id:state.bundle.idea.id,p_outcome:String(data.get('outcome')),p_rationale:String(data.get('rationale')||'')});closeModal();await refreshDetail();
      }
    }catch(error){showError(error);}finally{state.busy=false;if(submit)submit.disabled=false;}
  }
  function showError(error){let box=state.modal?.querySelector('.ideas-v1-form-error');if(!box&&state.modal){box=document.createElement('div');box.className='ideas-v1-form-error';state.modal.querySelector('.ideas-v1-modal')?.appendChild(box);}if(box)box.textContent=String(error?.message||error);else console.error('[2b2c ideas]',error);}

  async function handleClick(event){
    const target=event.target.closest?.('[data-idea-action]');if(!target)return;const action=target.dataset.ideaAction;
    if(['new','close-modal','edit-core','add-item','share','review','decide','convert','present','confirm-convert','vote-item'].includes(action)){event.preventDefault();event.stopPropagation();}
    try{
      if(action==='new')return newIdeaModal(); if(action==='close-modal')return closeModal(); if(action==='edit-core')return editCoreModal(); if(action==='add-item')return addItemModal(target.dataset.kind||'path'); if(action==='share')return shareModal(); if(action==='review')return reviewModal(target.dataset.vote); if(action==='decide')return decisionModal(target.dataset.outcome); if(action==='convert')return convertModal(); if(action==='present')return presentation();
      if(action==='confirm-convert'){
        if(state.busy)return;state.busy=true;target.disabled=true;try{const result=await api.rpc('convert_idea_to_project_v1',{p_idea_id:state.bundle.idea.id,p_target_date:null,p_phase_titles:[]});const data=one(result)||result;closeModal();await refreshDetail();setTimeout(()=>{location.hash='#/projects';},900);console.info('[2b2c ideas] converted',data);}catch(error){showError(error);}finally{state.busy=false;target.disabled=false;}return;
      }
      if(action==='vote-item'){await api.rpc('vote_idea_item_v1',{p_item_id:target.dataset.item,p_vote:target.dataset.vote});await refreshDetail();}
    }catch(error){showError(error);}
  }
  async function handleChange(event){const select=event.target.closest?.('[data-idea-item-state]');if(!select)return;try{await api.rpc('set_idea_item_state_v1',{p_item_id:select.dataset.ideaItemState,p_state:select.value});await refreshDetail();}catch(error){console.error('[2b2c ideas]',error);}}

  async function onRoute(){
    const r=route(); if(r==='/ideas'||r==='/ideas/')return renderList();
    const match=r.match(/^\/ideas\/([0-9a-f-]{36})(?:\/(overview|explore|discussion|decision))?$/i); if(match)return renderDetail(match[1],match[2]||'overview');
    state.renderToken++; if(r==='/projects')setTimeout(()=>void injectProjects(),120); else releaseRoute();
  }

  document.addEventListener('click',handleClick,true);document.addEventListener('submit',handleSubmit,true);document.addEventListener('change',handleChange,true);
  document.addEventListener('keydown',(event)=>{if(event.key==='Escape'&&state.modal)closeModal();});
  window.addEventListener('hashchange',()=>setTimeout(()=>void onRoute(),20));
  new MutationObserver(()=>{const r=route();if(r==='/projects'&&!document.querySelector('.ideas-v1-projects-panel'))setTimeout(()=>void injectProjects(),50);if(isIdeasRoute()&&!content()?.classList.contains('ideas-v1-owned'))setTimeout(()=>void onRoute(),30);}).observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(()=>void onRoute(),650);
  window.__4B4C_IDEAS_V1__=Object.freeze({version:'1.0.0',refresh:onRoute,newIdea:newIdeaModal});
})();

import { SupabaseBrowserClient } from './supabase-client.js';

(()=>{
  if(window.__2B2C_IDEA_WORKSPACE_V3_PREVIEW__) return;

  const cfg=window.__4B4C_CONFIG__||{};
  const api=new SupabaseBrowserClient({url:cfg.supabaseUrl,publishableKey:cfg.supabasePublishableKey});
  const PREVIEW_VERSION='0.1.0';
  const previewEnabled=()=>new URLSearchParams(location.search).get('workspacev3')==='1'||localStorage.getItem('2b2c.idea.workspace.v3')==='1';
  const route=()=>String(location.hash||'#/').replace(/^#/,'');
  const content=()=>document.querySelector('.live-content');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const attr=esc;
  let renderToken=0;

  function workspaceMatch(){return route().match(/^\/ideas\/([0-9a-f-]{36})\/workspace-v3$/i);}
  function legacyIdeaMatch(){return route().match(/^\/ideas\/([0-9a-f-]{36})(?:\/(overview|explore|discussion|decision))?$/i);}

  const modeMeta={
    CAPTURED_UNCLASSIFIED:{label:'Type à confirmer',tone:'neutral',eyebrow:'Idée capturée'},
    BLUEPRINT_MISMATCH:{label:'Type non couvert',tone:'warning',eyebrow:'Cadre à adapter'},
    BLUEPRINT_MIGRATION_REQUIRED:{label:'Cadre à mettre à jour',tone:'warning',eyebrow:'Migration du dossier'},
    IDEA_ENGINE:{label:'Idée en maturation',tone:'active',eyebrow:'Dossier de décision'},
    PROJECT_DEFINITION:{label:'Définition projet',tone:'project',eyebrow:'Après validation de l’idée'},
    BUILD_READY:{label:'Prêt à développer',tone:'ready',eyebrow:'Handoff validé'}
  };

  const gateLabels={
    G8_PROJECT_PRODUCT_DEFINITION_STABLE:'Produit',
    G9_PROJECT_EXPERIENCE_DEFINITION_STABLE:'Expérience',
    G10_PROJECT_TECH_NFR_STABLE:'Tech & qualité',
    G11_TRACEABILITY_AND_ACCEPTANCE_READY:'Acceptation',
    G12_READY_FOR_DEVELOPMENT:'Build Ready'
  };

  function artifactLabel(key=''){
    const known={
      'SV.PF.CONCEPT_JOURNEY':'Parcours conceptuel',
      'SV.PF.CONCEPT_SITEMAP':'Arborescence conceptuelle',
      'SV.PF.MESSAGE_HIERARCHY':'Hiérarchie des messages',
      'SV.PF.CAPABILITY_SET':'Capacités principales',
      'SV.PF.FEASIBILITY_ENVELOPE':'Enveloppe de faisabilité',
      'SV.PF.SUCCESS_MODEL':'Modèle de succès',
      'SV.PF.VISUAL_TERRITORIES':'Territoires visuels',
      'SV.PF.HIFI_CONCEPT':'Concept haute fidélité',
      'A19_EXPERIENCE_INFORMATION_ARCHITECTURE_SPEC':'Expérience & architecture de l’information',
      'A20_CONTENT_DISCOVERABILITY_SPEC':'Contenu & découvrabilité',
      'A21_FUNCTIONAL_DATA_INTEGRATION_SPEC':'Fonctionnel, données & intégrations',
      'A22_DESIGN_DEFINITION':'Définition design',
      'A23_TECHNICAL_NFR_DEFINITION':'Technique & exigences non fonctionnelles',
      'A24_VERIFICATION_ACCEPTANCE_PLAN':'Vérification & acceptation',
      'A25_BUILD_READY_PROJECT_SPECIFICATION':'Spécification Build Ready'
    };
    if(known[key]) return known[key];
    return String(key).replace(/^SV\./,'').replace(/^A\d+_/,'').replaceAll('_',' ').toLowerCase().replace(/^./,m=>m.toUpperCase());
  }

  function safeProjection(result){
    if(result&&typeof result==='object'&&!Array.isArray(result)) return result;
    if(Array.isArray(result)&&result[0]&&typeof result[0]==='object') return result[0];
    throw new Error('Projection workspace indisponible.');
  }

  async function loadProjection(id){
    if(!api.getSession()?.access_token) throw new Error('Votre session a expiré. Reconnectez-vous.');
    return safeProjection(await api.rpc('get_idea_workspace_projection_v1',{p_idea_id:id}));
  }

  function lifecycleHeader(p){
    const meta=modeMeta[p.lifecycle?.mode]||modeMeta.CAPTURED_UNCLASSIFIED;
    return `<header class="iwv3-head">
      <div class="iwv3-head-main">
        <a class="iwv3-back" href="#/ideas">← Idées</a>
        <span class="iwv3-eyebrow">${esc(meta.eyebrow)}</span>
        <div class="iwv3-title-row"><h1>${esc(p.idea?.title||'Idée')}</h1><span class="iwv3-badge ${attr(meta.tone)}">${esc(meta.label)}</span></div>
        <p>${esc(p.idea?.current_description||'')}</p>
      </div>
      <div class="iwv3-head-actions"><a href="#/ideas/${attr(p.idea.id)}/overview" class="iwv3-secondary">Interface actuelle</a></div>
    </header>`;
  }

  function humanInput(p){
    const fit=p.blueprint_fit?.assessment;
    if(p.signals?.blueprint_fit_requires_human&&fit){
      const guess=fit.classification==='SITE_VITRINE'?'un site vitrine':fit.classification==='BLUEPRINT_MISMATCH'?(fit.candidate_type||'un autre type de projet'):'un type encore ambigu';
      return `<section class="iwv3-human" aria-labelledby="iwv3-human-title">
        <div class="iwv3-human-icon">?</div><div class="iwv3-human-copy"><span>Votre avis est utile ici</span><h2 id="iwv3-human-title">Le type de projet mérite une confirmation</h2><p>2b2c pense qu’il s’agit de <strong>${esc(guess)}</strong>, mais la confiance actuelle est ${esc(String(fit.confidence||'').toLowerCase())}. ${esc(fit.rationale||'')}</p><small>Cette preview reste en lecture seule : la confirmation sera branchée dans la slice interactive.</small></div>
      </section>`;
    }
    if(p.lifecycle?.mode==='BLUEPRINT_MISMATCH'){
      const d=p.blueprint_fit?.decision;
      return `<section class="iwv3-human warning"><div class="iwv3-human-icon">!</div><div class="iwv3-human-copy"><span>Cadre actuel insuffisant</span><h2>Cette idée ne doit pas être forcée dans “Site vitrine”</h2><p>${d?.candidate_type?`Le besoin ressemble davantage à <strong>${esc(d.candidate_type)}</strong>. `:''}Le contenu original et les sources sont conservés. Un Blueprint adapté devra être disponible avant de poursuivre le moteur.</p></div></section>`;
    }
    if(p.signals?.has_open_blocker){
      return `<section class="iwv3-human"><div class="iwv3-human-icon">!</div><div class="iwv3-human-copy"><span>Attention requise</span><h2>Un point bloquant reste ouvert</h2><p>Le moteur indique qu’une décision ou information bloquante existe. La future surface interactive exposera uniquement le point précis qui nécessite réellement votre intervention.</p></div></section>`;
    }
    return '';
  }

  function valueNow(p){
    const mode=p.lifecycle?.mode;
    const req=p.requirements?.idea||{};
    const projectReq=p.requirements?.project||{};
    const fit=p.blueprint_fit?.assessment;
    let title='Votre dossier est prêt à être lu autrement';
    let text='2b2c affiche ici les conséquences utiles du dossier, sans vous faire suivre un tunnel d’étapes.';
    if(mode==='CAPTURED_UNCLASSIFIED'){
      title=fit?'Le bon cadre est en cours de confirmation':'2b2c doit d’abord reconnaître le bon type de projet';
      text=fit?`Une assessment existe avec une confiance ${String(fit.confidence||'').toLowerCase()}. Elle n’est pas encore une décision canonique.`:'Aucun Blueprint n’est encore assigné. L’idée reste conservée telle quelle tant que le type de projet n’est pas suffisamment établi.';
    }else if(mode==='IDEA_ENGINE'){
      title='Le dossier de décision est actif';
      text=req.materialized?`${req.resolved_count||0} exigences actives sont actuellement résolues ; ${req.unresolved_count||0} restent à traiter par le système ou, seulement si nécessaire, par vous.`:'Le cadre Site vitrine est validé. Le moteur peut maintenant extraire, rechercher, comparer et produire les éléments utiles sans vous imposer un questionnaire.';
    }else if(mode==='PROJECT_DEFINITION'){
      title='L’idée approuvée est devenue une définition de projet';
      text=projectReq.materialized?`${projectReq.validated_count||0} éléments applicables sont stabilisés ; ${projectReq.open_blocker_count||0} blocage explicite reste ouvert.`:'La baseline approuvée est préservée. La définition produit, expérience, technique et qualité peut être approfondie sans repartir de zéro.';
    }else if(mode==='BUILD_READY'){
      title='Le handoff Build Ready est figé';
      text='Les exigences applicables, les artefacts de build et l’approbation formelle sont liés à un snapshot versionné. Cela ne crée toujours pas automatiquement une roadmap d’exécution.';
    }else if(mode==='BLUEPRINT_MISMATCH'){
      title='Le moteur s’est arrêté au bon endroit';
      text='2b2c a détecté que le Blueprint actuellement disponible ne couvre pas correctement cette idée. Continuer comme si c’était un site vitrine aurait créé un faux cadrage.';
    }
    return `<section class="iwv3-value" id="iwv3-now"><span class="iwv3-section-kicker">Ce qui compte maintenant</span><h2>${esc(title)}</h2><p>${esc(text)}</p></section>`;
  }

  function systemStatus(p){
    const s=p.system_microstatus||{};
    const active=(s.queued_count||0)+(s.running_count||0);
    if(!active&&!s.latest) return `<div class="iwv3-system quiet"><span class="iwv3-dot"></span><div><strong>Aucun traitement en cours</strong><small>Le workspace reste disponible ; 2b2c ne simule pas une page d’attente.</small></div></div>`;
    const latest=s.latest;
    const label=active?`${active} traitement${active>1?'s':''} en cours`:'Dernier traitement terminé';
    return `<div class="iwv3-system ${active?'busy':'quiet'}"><span class="iwv3-dot"></span><div><strong>${esc(label)}</strong>${latest?`<small>${esc(latest.action_type||'Action système')} · ${esc(latest.status||'')}</small>`:''}</div></div>`;
  }

  function dossierCards(p){
    const r=p.requirements?.idea||{};
    const pr=p.requirements?.project||{};
    const sources=p.sources||{};
    const artifacts=p.artifacts||{};
    return `<section class="iwv3-grid" id="iwv3-evidence">
      <article class="iwv3-card"><span>Informations structurées</span><strong>${r.materialized?(r.active_count||0):'—'}</strong><p>${r.materialized?`${r.resolved_count||0} résolues · ${r.accepted_unknown_count||0} inconnues acceptées`:'Le moteur n’a pas encore matérialisé les Requirements de cette Idea.'}</p></article>
      <article class="iwv3-card"><span>Sources conservées</span><strong>${sources.total_count||0}</strong><p>${sources.ingested_count||0} ingérée${(sources.ingested_count||0)>1?'s':''} · ${sources.superseded_count||0} historique${(sources.superseded_count||0)>1?'s':''}</p></article>
      <article class="iwv3-card"><span>Résultats actifs</span><strong>${(artifacts.current_count||0)+(artifacts.frozen_count||0)}</strong><p>${artifacts.stale_count||0} résultat${(artifacts.stale_count||0)>1?'s':''} à revoir après changement.</p></article>
      ${p.project_definition?`<article class="iwv3-card"><span>Définition projet</span><strong>${pr.applicable_count||0}</strong><p>${pr.validated_count||0} stabilisées · ${pr.open_blocker_count||0} blocage ouvert</p></article>`:''}
    </section>`;
  }

  function artifacts(p){
    const items=p.artifacts?.items||[];
    return `<section class="iwv3-section" id="iwv3-results"><div class="iwv3-section-head"><div><span class="iwv3-section-kicker">Résultats</span><h2>Ce que le dossier a déjà produit</h2></div><small>${items.length} version${items.length>1?'s':''} active${items.length>1?'s':''}</small></div>
      ${items.length?`<div class="iwv3-artifacts">${items.map(a=>`<article><div><strong>${esc(artifactLabel(a.artifact_key))}</strong><span>${esc(a.purpose_stage==='FOR_BUILD'?'Pour le build':a.purpose_stage==='FOR_PROJECT'?'Pour la définition projet':'Pour la décision')}</span></div><div class="iwv3-artifact-meta"><span>v${a.version}</span><span class="${a.freshness_status==='stale'?'stale':'fresh'}">${a.freshness_status==='stale'?'À revoir':'À jour'}</span></div></article>`).join('')}</div>`:`<div class="iwv3-empty"><strong>Aucun artefact actif pour le moment</strong><p>Cette zone apparaîtra au fil des analyses, comparaisons, concepts et définitions réellement utiles.</p></div>`}
    </section>`;
  }

  function decision(p){
    const pkg=p.decision?.package,rec=p.decision?.record;
    let body='<strong>Aucune décision formelle enregistrée</strong><p>Le dossier peut produire de la valeur bien avant qu’une décision finale soit nécessaire.</p>';
    if(rec) body=`<strong>${esc(rec.outcome)}</strong><p>Décision enregistrée le ${new Date(rec.decided_at).toLocaleDateString('fr-FR')}. ${rec.promotable?'Elle est promotable vers une définition de projet.':'Elle ne déclenche pas de promotion automatique.'}</p>`;
    else if(pkg) body=`<strong>Package de décision ${esc(pkg.state)}</strong><p>${esc(pkg.decision_sought||'Une décision est en préparation.')} ${pkg.stale_reason?`Le package doit être revu : ${esc(pkg.stale_reason)}.`:''}</p>`;
    return `<section class="iwv3-section" id="iwv3-decision"><div class="iwv3-section-head"><div><span class="iwv3-section-kicker">Décision</span><h2>Décider sans biais vers le “GO”</h2></div></div><div class="iwv3-decision">${body}</div></section>`;
  }

  function projectDefinition(p){
    const pd=p.project_definition;if(!pd)return '';
    const gates=pd.gates||{};
    return `<section class="iwv3-section" id="iwv3-project"><div class="iwv3-section-head"><div><span class="iwv3-section-kicker">Après le GO</span><h2>Définition du projet</h2></div><small>Révision ${pd.definition_revision}</small></div><div class="iwv3-gates">${Object.entries(gateLabels).map(([id,label])=>{const g=gates[id];return `<div class="${g?.status==='READY'?'ready':''}"><span>${esc(label)}</span><strong>${g?.status==='READY'?'Stable':'À approfondir'}</strong></div>`}).join('')}</div><p class="iwv3-note">Ces contrôles sont des garanties internes de dépendance et de qualité, pas une checklist que vous devez remplir dans l’ordre.</p></section>`;
  }

  function semanticNav(p){
    const items=[['iwv3-now','Vue utile'],['iwv3-evidence','Dossier'],['iwv3-results','Résultats'],['iwv3-decision','Décision']];
    if(p.project_definition)items.push(['iwv3-project','Définition projet']);
    return `<nav class="iwv3-nav" aria-label="Navigation du dossier">${items.map(([id,label])=>`<button type="button" data-iwv3-scroll="${id}">${esc(label)}</button>`).join('')}</nav>`;
  }

  function freeInput(p){
    return `<section class="iwv3-free"><div><span class="iwv3-section-kicker">Toujours disponible</span><h2>Ajouter, corriger ou changer l’intention</h2><p>Le dossier doit s’adapter à votre idée, pas l’inverse. La preview conserve pour l’instant l’éditeur existant comme voie de modification.</p></div><a class="iwv3-primary" href="#/ideas/${attr(p.idea.id)}/overview">Modifier l’idée</a></section>`;
  }

  function renderProjection(p){
    return `<div class="iwv3-page" data-projection-version="${attr(p.projection_version||'')}">${lifecycleHeader(p)}${semanticNav(p)}${humanInput(p)}${valueNow(p)}${systemStatus(p)}${dossierCards(p)}${artifacts(p)}${decision(p)}${projectDefinition(p)}${freeInput(p)}<footer class="iwv3-footer">Preview workspace v${PREVIEW_VERSION} · Projection ${esc(p.projection_version||'')}</footer></div>`;
  }

  function own(html){
    const node=content();if(!node)return;
    node.classList.add('ideas-workspace-v3-owned');
    node.innerHTML=html;
    document.documentElement.dataset.ideasWorkspaceV3='true';
    window.scrollTo(0,0);
  }
  function release(){
    content()?.classList.remove('ideas-workspace-v3-owned');
    delete document.documentElement.dataset.ideasWorkspaceV3;
  }

  function loading(){own(`<div class="iwv3-page"><div class="iwv3-loading"><span></span><strong>Ouverture du dossier…</strong><small>Lecture de la projection canonique, sans recalcul artificiel.</small></div></div>`)}
  function errorState(id,error){own(`<div class="iwv3-page"><div class="iwv3-error"><strong>Impossible d’ouvrir ce workspace</strong><p>${esc(error?.message||error||'Erreur inconnue')}</p><a href="#/ideas/${attr(id)}/overview">Revenir à l’interface actuelle</a></div></div>`)}

  async function renderWorkspace(id){
    const token=++renderToken;loading();
    try{const p=await loadProjection(id);if(token!==renderToken||workspaceMatch()?.[1]!==id)return;own(renderProjection(p));}
    catch(error){if(token!==renderToken)return;errorState(id,error);}
  }

  function injectPreviewLink(){
    if(!previewEnabled())return;
    const match=legacyIdeaMatch();if(!match)return;
    const id=match[1],head=document.querySelector('.ideas-v1-pagehead');if(!head||head.querySelector('[data-iwv3-preview-link]'))return;
    let actions=head.querySelector('.ideas-v1-head-actions');
    if(!actions){actions=document.createElement('div');actions.className='ideas-v1-head-actions';head.appendChild(actions);}
    const link=document.createElement('a');link.href=`#/ideas/${id}/workspace-v3`;link.className='iwv3-preview-link';link.dataset.iwv3PreviewLink='true';link.textContent='Nouveau workspace · preview';actions.prepend(link);
  }

  function onRoute(){
    const match=workspaceMatch();
    if(match)return void renderWorkspace(match[1]);
    renderToken++;release();setTimeout(injectPreviewLink,80);
  }

  document.addEventListener('click',event=>{
    const btn=event.target.closest?.('[data-iwv3-scroll]');if(!btn)return;
    document.getElementById(btn.dataset.iwv3Scroll)?.scrollIntoView({behavior:'smooth',block:'start'});
  });
  window.addEventListener('hashchange',()=>setTimeout(onRoute,25));
  new MutationObserver(()=>{if(workspaceMatch())return;if(previewEnabled())setTimeout(injectPreviewLink,50)}).observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(onRoute,720);

  window.__2B2C_IDEA_WORKSPACE_V3_PREVIEW__=Object.freeze({version:PREVIEW_VERSION,refresh:onRoute,enable(){localStorage.setItem('2b2c.idea.workspace.v3','1');onRoute()},disable(){localStorage.removeItem('2b2c.idea.workspace.v3');onRoute()}});
})();

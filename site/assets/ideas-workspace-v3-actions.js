import { SupabaseBrowserClient } from './supabase-client.js';

(()=>{
  if(window.__2B2C_IDEA_WORKSPACE_V3_ACTIONS__) return;
  const cfg=window.__4B4C_CONFIG__||{};
  const api=new SupabaseBrowserClient({url:cfg.supabaseUrl,publishableKey:cfg.supabasePublishableKey});
  const VERSION='0.3.0';
  const route=()=>String(location.hash||'#/').replace(/^#/,'');
  const match=()=>route().match(/^\/ideas\/([0-9a-f-]{36})\/workspace-v3$/i);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const FOUNDATION_FIELDS=Object.freeze({
    'SV.D02.ORG_CONTEXT':{semantic_key:'org_context',item_type:'FACT'},
    'SV.D02.DECLARED_PROBLEM':{semantic_key:'declared_problem',item_type:'FACT'},
    'SV.D02.PRIMARY_OBJECTIVE':{semantic_key:'primary_objective',item_type:'DECISION_INPUT'},
    'SV.D03.PRIMARY_AUDIENCE':{semantic_key:'primary_audience',item_type:'DECISION_INPUT'},
    'SV.D02.USER_OUTCOME':{semantic_key:'user_outcome',item_type:'FACT'},
    'SV.D04.OFFER_BASELINE':{semantic_key:'offer_baseline',item_type:'FACT'},
    'SV.D02.HARD_CONSTRAINTS':{semantic_key:'hard_constraints',item_type:'CONSTRAINT'}
  });
  const foundationState=new Map();
  const foundationInflight=new Map();
  let token=0;

  async function sha256(text){
    const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(text)));
    return [...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,'0')).join('');
  }

  async function stableKey(prefix,parts){
    const hash=await sha256(JSON.stringify(parts));
    return `${prefix}:${hash.slice(0,32)}`;
  }

  function normalizeUrl(raw){
    let url;
    try{url=new URL(String(raw||'').trim())}catch{throw new Error('Saisissez une adresse web valide.');}
    if(!['http:','https:'].includes(url.protocol)) throw new Error('Le lien doit commencer par http:// ou https://.');
    return url.href;
  }

  async function projection(id){
    return api.rpc('get_idea_workspace_projection_v1',{p_idea_id:id});
  }

  async function engineCommand(id,command){
    const session=api.getSession();
    if(!session?.access_token) throw new Error('Votre session a expiré. Reconnectez-vous.');
    const response=await fetch('/api/ideas/engine',{
      method:'POST',
      headers:{'content-type':'application/json',authorization:`Bearer ${session.access_token}`},
      body:JSON.stringify({command,idea_id:id})
    });
    const payload=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(payload?.error||`Erreur ${response.status}`);
    return payload;
  }

  async function confirmFit(p,decision,candidateType,note){
    const assessment=p.blueprint_fit?.assessment;
    if(!assessment?.id) throw new Error('Assessment G0 introuvable.');
    const idempotency=await stableKey('workspace-v3-human-fit',[
      p.idea.id,p.idea.engine_revision,assessment.id,decision,candidateType||'',note||''
    ]);
    return api.rpc('confirm_idea_blueprint_fit_v1',{
      p_idea_id:p.idea.id,
      p_expected_engine_revision:p.idea.engine_revision,
      p_decision:decision,
      p_assessment_id:assessment.id,
      p_candidate_type:candidateType||null,
      p_human_note:note||'',
      p_idempotency_key:idempotency
    });
  }

  async function registerUrlSource(p,{locator,title,note,sensitivity}){
    const url=normalizeUrl(locator);
    const cleanTitle=String(title||'').trim().slice(0,240);
    const cleanNote=String(note||'').trim().slice(0,800);
    const safeSensitivity=['public','internal','personal','sensitive'].includes(sensitivity)?sensitivity:'internal';
    const idempotency=await stableKey('workspace-v3-source',[
      p.idea.id,p.idea.engine_revision,'url',url,cleanTitle,cleanNote,safeSensitivity
    ]);
    return api.rpc('register_idea_source_v1',{
      p_idea_id:p.idea.id,
      p_expected_engine_revision:p.idea.engine_revision,
      p_source_kind:'url',
      p_locator:url,
      p_title:cleanTitle||null,
      p_human_note:cleanNote,
      p_sensitivity:safeSensitivity,
      p_idempotency_key:idempotency
    });
  }

  async function applyFoundationHuman(p,action,value){
    const requirementId=String(action?.requirement_id||'');
    const spec=FOUNDATION_FIELDS[requirementId];
    const answer=String(value||'').trim().slice(0,2400);
    if(!spec||!answer) throw new Error('Réponse invalide.');
    const idempotency=await stableKey('workspace-v3-foundation-human',[
      p.idea.id,p.idea.engine_revision,requirementId,answer
    ]);
    return api.rpc('apply_human_information_v1',{
      p_idea_id:p.idea.id,
      p_expected_engine_revision:p.idea.engine_revision,
      p_semantic_key:spec.semantic_key,
      p_item_type:spec.item_type,
      p_value:{value:answer},
      p_provenance_type:'HUMAN_GUIDED_ANSWER',
      p_sensitivity:'internal',
      p_idempotency_key:idempotency,
      p_source_id:null,
      p_supersedes_id:null,
      p_target_requirement_id:requirementId
    });
  }

  async function acceptFoundationUnknown(p,action){
    const requirementId=String(action?.requirement_id||'');
    if(!FOUNDATION_FIELDS[requirementId]) throw new Error('Point à reporter invalide.');
    const idempotency=await stableKey('workspace-v3-foundation-unknown',[
      p.idea.id,p.idea.engine_revision,requirementId
    ]);
    return api.rpc('accept_idea_requirement_unknown_v1',{
      p_idea_id:p.idea.id,
      p_expected_engine_revision:p.idea.engine_revision,
      p_requirement_id:requirementId,
      p_note:'Reporté depuis Workspace V3',
      p_idempotency_key:idempotency
    });
  }

  function assessmentLabel(a){
    if(a?.classification==='SITE_VITRINE') return 'Site vitrine';
    if(a?.classification==='BLUEPRINT_MISMATCH') return a?.candidate_type||'Autre type de projet';
    return a?.candidate_type||'Type à confirmer';
  }

  function g0PanelHtml(p){
    const mode=p.lifecycle?.mode;
    const a=p.blueprint_fit?.assessment;
    if(!p.capabilities?.can_write||!['CAPTURED_UNCLASSIFIED','BLUEPRINT_MIGRATION_REQUIRED'].includes(mode)) return '';

    if(!a){
      return `<section class="iwv3-action-panel" data-iwv3-g0>
        <div><span class="iwv3-section-kicker">Cadre du dossier</span><h2>Identifier le bon type de projet</h2><p>2b2c peut analyser l’idée enregistrée pour vérifier si le Blueprint <strong>Site vitrine</strong> est réellement adapté. En cas de doute, aucune classification ne sera imposée sans votre confirmation.</p></div>
        <button class="iwv3-action-primary" type="button" data-iwv3-assess>Analyser le type de projet</button>
        <p class="iwv3-action-status" data-iwv3-status aria-live="polite"></p>
      </section>`;
    }

    if(p.signals?.blueprint_fit_requires_human){
      const candidate=assessmentLabel(a);
      const defaultOther=a.classification==='BLUEPRINT_MISMATCH'?(a.candidate_type||''):'';
      return `<section class="iwv3-action-panel" data-iwv3-g0>
        <div><span class="iwv3-section-kicker">Confirmation humaine</span><h2>Confirmer le bon cadre</h2><p>2b2c propose <strong>${esc(candidate)}</strong> avec une confiance ${esc(String(a.confidence||'').toLowerCase())}. ${esc(a.rationale||'')}</p></div>
        <div class="iwv3-action-choice">
          <button class="iwv3-action-primary" type="button" data-iwv3-confirm-site>Oui, c’est un site vitrine</button>
          <button class="iwv3-action-secondary" type="button" data-iwv3-show-other>Non, c’est un autre type</button>
        </div>
        <form class="iwv3-other-form" data-iwv3-other-form hidden>
          <label>Quel type de projet ?<input name="candidate_type" maxlength="80" value="${esc(defaultOther)}" placeholder="Ex. SaaS, marketplace, application métier…" required></label>
          <label>Précision facultative<textarea name="note" maxlength="500" rows="2" placeholder="Ce qui permet de comprendre la différence"></textarea></label>
          <button class="iwv3-action-primary" type="submit">Confirmer cet autre type</button>
        </form>
        <p class="iwv3-action-status" data-iwv3-status aria-live="polite"></p>
      </section>`;
    }
    return '';
  }

  function foundationPanelHtml(p,state){
    if(!p.capabilities?.can_write||p.lifecycle?.mode!=='IDEA_ENGINE') return '';
    if(!state||state.status==='PENDING'){
      return `<section class="iwv3-action-panel iwv3-foundation-panel iwv3-foundation-pending" data-iwv3-foundation>
        <div><span class="iwv3-section-kicker">Compréhension</span><h2>2b2c exploite ce que vous avez déjà donné</h2><p>Les informations explicites de votre idée sont structurées automatiquement. Vous ne serez sollicité que si un point réellement nécessaire ne peut pas être résolu autrement.</p></div>
        <p class="iwv3-action-status" data-iwv3-status aria-live="polite">Analyse utile en cours…</p>
      </section>`;
    }
    if(state.status==='ERROR'){
      return `<section class="iwv3-action-panel iwv3-foundation-panel" data-iwv3-foundation>
        <div><span class="iwv3-section-kicker">Compréhension</span><h2>La préparation automatique n’a pas abouti</h2><p>Votre idée et vos sources sont conservées. Vous pouvez continuer à travailler ; 2b2c pourra réessayer sans perdre vos données.</p></div>
        <button class="iwv3-action-secondary" type="button" data-iwv3-foundation-retry>Réessayer</button>
        <p class="iwv3-action-status" data-iwv3-status aria-live="polite">${esc(state.error||'Erreur temporaire')}</p>
      </section>`;
    }
    if(state.status==='HUMAN_INPUT_REQUIRED'&&state.plan?.dominant_user_action){
      const action=state.plan.dominant_user_action;
      return `<section class="iwv3-action-panel iwv3-foundation-panel iwv3-human-panel" data-iwv3-foundation>
        <div><span class="iwv3-section-kicker">Une précision utile</span><h2>${esc(action.prompt||action.title||'Précisez ce point')}</h2><p>${esc(action.purpose||'Cette information permet à 2b2c de continuer sans inventer.')}</p></div>
        <form class="iwv3-foundation-form" data-iwv3-foundation-form>
          <label>Votre réponse<textarea name="answer" maxlength="2400" rows="3" placeholder="Répondez simplement, avec vos mots" required></textarea></label>
          <div class="iwv3-action-choice">
            <button class="iwv3-action-primary" type="submit">Enregistrer et continuer</button>
            <button class="iwv3-action-secondary" type="button" data-iwv3-foundation-unknown>Je ne sais pas / plus tard</button>
          </div>
        </form>
        <p class="iwv3-action-status" data-iwv3-status aria-live="polite"></p>
      </section>`;
    }
    if(state.status==='FOUNDATION_BLOCKED'){
      return `<section class="iwv3-action-panel iwv3-foundation-panel iwv3-foundation-blocked" data-iwv3-foundation>
        <div><span class="iwv3-section-kicker">Point reporté</span><h2>Une information structurante reste volontairement inconnue</h2><p>2b2c ne vous la redemandera pas automatiquement. Le dossier reste conservé et vous pourrez préciser ce point plus tard lorsqu’il deviendra disponible.</p></div>
      </section>`;
    }
    if(state.status==='FOUNDATION_READY'){
      const acceptedUnknowns=state.plan?.gate_status==='READY_WITH_ACCEPTED_UNKNOWNS';
      return `<section class="iwv3-action-panel iwv3-foundation-panel iwv3-foundation-ready" data-iwv3-foundation>
        <div><span class="iwv3-section-kicker">Compréhension</span><h2>Base suffisamment comprise</h2><p>${acceptedUnknowns?'La base est exploitable avec un ou plusieurs inconnus explicitement acceptés.':'2b2c dispose maintenant d’une base suffisante pour poursuivre le travail sans vous poser de question inutile.'}</p></div>
      </section>`;
    }
    return `<section class="iwv3-action-panel iwv3-foundation-panel" data-iwv3-foundation>
      <div><span class="iwv3-section-kicker">Compréhension</span><h2>2b2c poursuit le travail</h2><p>Des traitements automatiques utiles restent possibles. Ils ne sont pas transformés en étapes à valider manuellement.</p></div>
    </section>`;
  }

  function sourcePanelHtml(p){
    if(!p.capabilities?.can_write||p.lifecycle?.mode!=='IDEA_ENGINE') return '';
    return `<section class="iwv3-action-panel iwv3-source-panel" data-iwv3-source>
      <div><span class="iwv3-section-kicker">Source utile</span><h2>Ajouter un lien au dossier</h2><p>Ajoutez une référence uniquement si elle apporte quelque chose à l’idée. 2b2c conserve le lien et votre contexte ; il ne le transforme pas automatiquement en preuve validée.</p></div>
      <button class="iwv3-action-secondary" type="button" data-iwv3-show-source>+ Ajouter une source URL</button>
      <form class="iwv3-source-form" data-iwv3-source-form hidden>
        <label>Lien<input name="locator" type="url" inputmode="url" autocomplete="url" maxlength="2000" placeholder="https://…" required></label>
        <label>Titre facultatif<input name="title" maxlength="240" placeholder="Ex. Site d’un concurrent"></label>
        <label>Pourquoi ce lien est utile ?<textarea name="note" maxlength="800" rows="2" placeholder="Contexte facultatif"></textarea></label>
        <label>Confidentialité<select name="sensitivity"><option value="internal" selected>Interne</option><option value="public">Publique</option><option value="personal">Personnelle</option><option value="sensitive">Sensible</option></select></label>
        <div class="iwv3-action-choice"><button class="iwv3-action-primary" type="submit">Ajouter au dossier</button><button class="iwv3-action-secondary" type="button" data-iwv3-cancel-source>Annuler</button></div>
      </form>
      <p class="iwv3-action-status" data-iwv3-status aria-live="polite"></p>
    </section>`;
  }

  function setBusy(panel,busy,message=''){
    panel.querySelectorAll('button,input,textarea,select').forEach(el=>el.disabled=busy);
    const status=panel.querySelector('[data-iwv3-status]');
    if(status) status.textContent=message;
  }

  async function refreshAll(){
    try{await window.__2B2C_IDEA_WORKSPACE_V3_PREVIEW__?.refresh?.()}catch{}
    queueMicrotask(()=>onRoute());
  }

  async function runFoundation(p,currentToken){
    const id=p.idea.id;
    if(foundationInflight.has(id)) return foundationInflight.get(id);
    const promise=(async()=>{
      try{
        const out=await engineCommand(id,'foundation.advance');
        const revision=Number(out.projection?.idea?.engine_revision??p.idea.engine_revision);
        const state={revision,status:out.status||'FOUNDATION_BLOCKED',plan:out.plan||null,execution:out.execution||null,error:''};
        foundationState.set(id,state);
        return state;
      }catch(error){
        const state={revision:p.idea.engine_revision,status:'ERROR',plan:null,error:error.message||'Erreur temporaire'};
        foundationState.set(id,state);
        return state;
      }finally{foundationInflight.delete(id)}
    })();
    foundationInflight.set(id,promise);
    const result=await promise;
    if(currentToken===token) await refreshAll();
    return result;
  }

  function bindG0(panel,p){
    panel.querySelector('[data-iwv3-assess]')?.addEventListener('click',async()=>{
      try{
        setBusy(panel,true,'2b2c vérifie le bon cadre…');
        const out=await engineCommand(p.idea.id,'blueprint_fit.assess');
        setBusy(panel,false,out.status==='HUMAN_CONFIRMATION_REQUIRED'?'Votre confirmation est nécessaire.':'Cadre validé.');
        foundationState.delete(p.idea.id);
        await refreshAll();
      }catch(error){setBusy(panel,false,`Impossible de terminer l’analyse : ${error.message}`)}
    });

    panel.querySelector('[data-iwv3-confirm-site]')?.addEventListener('click',async()=>{
      try{
        setBusy(panel,true,'Confirmation en cours…');
        await confirmFit(p,'SITE_VITRINE',null,'Confirmation depuis Workspace V3');
        setBusy(panel,false,'Site vitrine confirmé.');
        foundationState.delete(p.idea.id);
        await refreshAll();
      }catch(error){setBusy(panel,false,`Impossible d’enregistrer : ${error.message}`)}
    });

    panel.querySelector('[data-iwv3-show-other]')?.addEventListener('click',()=>{
      const form=panel.querySelector('[data-iwv3-other-form]');
      if(form){form.hidden=false;form.querySelector('input')?.focus();}
    });

    panel.querySelector('[data-iwv3-other-form]')?.addEventListener('submit',async event=>{
      event.preventDefault();
      const form=event.currentTarget;
      const data=new FormData(form);
      const type=String(data.get('candidate_type')||'').trim();
      const note=String(data.get('note')||'').trim();
      if(!type) return;
      try{
        setBusy(panel,true,'Confirmation en cours…');
        await confirmFit(p,'BLUEPRINT_MISMATCH',type,note||'Confirmation depuis Workspace V3');
        setBusy(panel,false,'Autre type confirmé.');
        foundationState.delete(p.idea.id);
        await refreshAll();
      }catch(error){setBusy(panel,false,`Impossible d’enregistrer : ${error.message}`)}
    });
  }

  function bindFoundation(panel,p,state){
    panel.querySelector('[data-iwv3-foundation-retry]')?.addEventListener('click',async()=>{
      foundationState.delete(p.idea.id);
      setBusy(panel,true,'Nouvel essai…');
      await refreshAll();
    });
    const action=state?.plan?.dominant_user_action;
    const form=panel.querySelector('[data-iwv3-foundation-form]');
    form?.addEventListener('submit',async event=>{
      event.preventDefault();
      const data=new FormData(form);
      const answer=String(data.get('answer')||'').trim();
      if(!answer) return;
      try{
        setBusy(panel,true,'Réponse enregistrée…');
        await applyFoundationHuman(p,action,answer);
        foundationState.delete(p.idea.id);
        await refreshAll();
      }catch(error){setBusy(panel,false,`Impossible d’enregistrer : ${error.message}`)}
    });
    panel.querySelector('[data-iwv3-foundation-unknown]')?.addEventListener('click',async()=>{
      try{
        setBusy(panel,true,'Point reporté…');
        await acceptFoundationUnknown(p,action);
        foundationState.delete(p.idea.id);
        await refreshAll();
      }catch(error){setBusy(panel,false,`Impossible de reporter ce point : ${error.message}`)}
    });
  }

  function bindSource(panel,p){
    const form=panel.querySelector('[data-iwv3-source-form]');
    panel.querySelector('[data-iwv3-show-source]')?.addEventListener('click',()=>{
      if(form){form.hidden=false;panel.querySelector('[data-iwv3-show-source]')?.setAttribute('hidden','');form.querySelector('input')?.focus();}
    });
    panel.querySelector('[data-iwv3-cancel-source]')?.addEventListener('click',()=>{
      if(form){form.hidden=true;form.reset();panel.querySelector('[data-iwv3-show-source]')?.removeAttribute('hidden');}
    });
    form?.addEventListener('submit',async event=>{
      event.preventDefault();
      const data=new FormData(form);
      try{
        setBusy(panel,true,'Ajout de la source…');
        await registerUrlSource(p,{locator:data.get('locator'),title:data.get('title'),note:data.get('note'),sensitivity:String(data.get('sensitivity')||'internal')});
        setBusy(panel,false,'Source ajoutée au dossier.');
        foundationState.delete(p.idea.id);
        await refreshAll();
      }catch(error){setBusy(panel,false,`Impossible d’ajouter la source : ${error.message}`)}
    });
  }

  async function waitFor(selector,currentToken){
    for(let i=0;i<30;i++){
      if(currentToken!==token) return null;
      const el=document.querySelector(selector);
      if(el) return el;
      await new Promise(r=>setTimeout(r,60));
    }
    return null;
  }

  async function onRoute(){
    const m=match();
    const current=++token;
    document.querySelectorAll('[data-iwv3-actions-marker],[data-iwv3-g0],[data-iwv3-foundation],[data-iwv3-source]').forEach(el=>el.remove());
    if(!m) return;
    try{
      const p=await projection(m[1]);
      if(current!==token) return;
      const value=await waitFor('.live-content.ideas-workspace-v3-owned .iwv3-value',current);
      if(!value||current!==token) return;

      let fstate=foundationState.get(p.idea.id)||null;
      let kickFoundation=false;
      if(p.capabilities?.can_write&&p.lifecycle?.mode==='IDEA_ENGINE'&&(!fstate||Number(fstate.revision)!==Number(p.idea.engine_revision))){
        fstate={revision:p.idea.engine_revision,status:'PENDING',plan:null,error:''};
        foundationState.set(p.idea.id,fstate);
        kickFoundation=true;
      }

      value.insertAdjacentHTML('afterend',`<span hidden data-iwv3-actions-marker="${esc(p.idea.id)}"></span>${g0PanelHtml(p)}${foundationPanelHtml(p,fstate)}`);
      const owner=value.parentElement;
      const g0=owner?.querySelector('[data-iwv3-g0]');
      if(g0) bindG0(g0,p);
      const foundation=owner?.querySelector('[data-iwv3-foundation]');
      if(foundation) bindFoundation(foundation,p,fstate);
      if(kickFoundation) void runFoundation(p,current);

      const sourceHtml=sourcePanelHtml(p);
      if(sourceHtml){
        const evidence=await waitFor('.live-content.ideas-workspace-v3-owned #iwv3-evidence',current);
        if(evidence&&current===token){
          evidence.insertAdjacentHTML('afterend',sourceHtml);
          const source=evidence.nextElementSibling;
          if(source?.matches('[data-iwv3-source]')) bindSource(source,p);
        }
      }
    }catch(error){console.warn('[2b2c workspace v3 actions]',error)}
  }

  function needsRender(){
    const m=match();
    if(!m) return false;
    return !document.querySelector(`[data-iwv3-actions-marker="${m[1]}"]`);
  }

  addEventListener('hashchange',()=>setTimeout(onRoute,0));
  addEventListener('popstate',()=>setTimeout(onRoute,0));
  const observer=new MutationObserver(()=>{if(needsRender()) setTimeout(onRoute,0)});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.__2B2C_IDEA_WORKSPACE_V3_ACTIONS__=Object.freeze({version:VERSION,refresh:onRoute});
  onRoute();
})();

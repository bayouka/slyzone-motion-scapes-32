import { SupabaseBrowserClient } from './supabase-client.js';

(()=>{
  if(window.__2B2C_IDEA_WORKSPACE_V3_ACTIONS__) return;
  const cfg=window.__4B4C_CONFIG__||{};
  const api=new SupabaseBrowserClient({url:cfg.supabaseUrl,publishableKey:cfg.supabasePublishableKey});
  const VERSION='0.2.0';
  const route=()=>String(location.hash||'#/').replace(/^#/,'');
  const match=()=>route().match(/^\/ideas\/([0-9a-f-]{36})\/workspace-v3$/i);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
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

  function bindG0(panel,p){
    panel.querySelector('[data-iwv3-assess]')?.addEventListener('click',async()=>{
      try{
        setBusy(panel,true,'2b2c vérifie le bon cadre…');
        const out=await engineCommand(p.idea.id,'blueprint_fit.assess');
        setBusy(panel,false,out.status==='HUMAN_CONFIRMATION_REQUIRED'?'Votre confirmation est nécessaire.':'Cadre validé.');
        await refreshAll();
      }catch(error){setBusy(panel,false,`Impossible de terminer l’analyse : ${error.message}`)}
    });

    panel.querySelector('[data-iwv3-confirm-site]')?.addEventListener('click',async()=>{
      try{
        setBusy(panel,true,'Confirmation en cours…');
        await confirmFit(p,'SITE_VITRINE',null,'Confirmation depuis Workspace V3');
        setBusy(panel,false,'Site vitrine confirmé.');
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
        await refreshAll();
      }catch(error){setBusy(panel,false,`Impossible d’enregistrer : ${error.message}`)}
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
    document.querySelectorAll('[data-iwv3-actions-marker],[data-iwv3-g0],[data-iwv3-source]').forEach(el=>el.remove());
    if(!m) return;
    try{
      const p=await projection(m[1]);
      if(current!==token) return;
      const value=await waitFor('.live-content.ideas-workspace-v3-owned .iwv3-value',current);
      if(!value||current!==token) return;
      value.insertAdjacentHTML('afterend',`<span hidden data-iwv3-actions-marker="${esc(p.idea.id)}"></span>${g0PanelHtml(p)}`);
      const g0=value.parentElement?.querySelector('[data-iwv3-g0]');
      if(g0) bindG0(g0,p);

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

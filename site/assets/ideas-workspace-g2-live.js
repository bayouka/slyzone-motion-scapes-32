import {SupabaseBrowserClient} from './supabase-client.js';

(()=>{
  if(window.__2B2C_G2_LIVE__)return;
  const cfg=window.__4B4C_CONFIG__||{};
  const api=new SupabaseBrowserClient({url:cfg.supabaseUrl,publishableKey:cfg.supabasePublishableKey});
  const VERSION='1.1.0';
  let seq=0;

  const match=()=>String(location.hash||'').match(/^#\/ideas\/([0-9a-f-]{36})\/workspace-v3$/i);

  async function projection(id){return api.rpc('get_idea_workspace_projection_v1',{p_idea_id:id});}

  async function advance(id){
    const session=api.getSession();
    if(!session?.access_token)throw new Error('UNAUTHORIZED');
    const response=await fetch('/api/ideas/engine',{
      method:'POST',
      headers:{'content-type':'application/json',authorization:`Bearer ${session.access_token}`},
      body:JSON.stringify({command:'evidence.advance',idea_id:id})
    });
    const payload=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(payload.error||`HTTP_${response.status}`);
    return payload;
  }

  function errorMessage(code){
    if(code==='UNAUTHORIZED')return 'Votre session a expiré. Reconnectez-vous pour poursuivre.';
    if(code==='IDEA_WRITE_REQUIRED'||code==='IDEA_ACCESS_DENIED')return 'Vous n’avez pas les droits nécessaires pour modifier ce dossier.';
    if(code==='G2_NOT_AVAILABLE')return 'Cette analyse n’est pas disponible pour ce type d’idée.';
    if(code==='STALE_STATE')return 'Le dossier a changé pendant l’analyse. Actualisez puis relancez-la.';
    if(code==='SERVER_PRIVILEGE_UNAVAILABLE'||code==='BACKEND_CONFIG_UNAVAILABLE')return 'Le service d’analyse est temporairement indisponible.';
    return 'L’analyse n’a pas pu aboutir. Vos informations ont été conservées.';
  }

  function resultMessage(out){
    const plan=out?.plan||{};
    if(plan.gate_status==='READY')return 'Les preuves disponibles sont suffisantes pour poursuivre le cadrage.';
    if(Number(out?.executed_actions)>0)return '2b2c a mis à jour le dossier à partir des éléments actuellement vérifiables.';
    if(plan.dominant_user_action)return 'Une précision de votre part est nécessaire avant d’aller plus loin.';
    if(Number(plan.capability_blocked_requirements?.length)>0)return '2b2c a exploité les traitements disponibles. Certaines preuves demandent encore une source ou une information supplémentaire.';
    return 'Aucune analyse automatique supplémentaire n’est nécessaire pour le moment.';
  }

  function panel(p){
    if(!p.capabilities?.can_write||p.idea?.blueprint_id!=='SITE_VITRINE'||p.idea?.blueprint_version!=='0.5'||p.idea?.blueprint_status!=='active')return'';
    return `<section class="iwv3-action-panel" data-iwv3-g2-live aria-labelledby="iwv3-evidence-title"><div><span class="iwv3-section-kicker">Preuves & marché</span><h2 id="iwv3-evidence-title">Vérifier ce qui soutient réellement l’idée</h2><p>2b2c exploite les informations et sources déjà présentes, recalcule ce qui peut l’être et s’arrête lorsqu’un élément n’est pas suffisamment étayé.</p></div><button class="iwv3-action-primary" type="button" data-iwv3-g2-run>Approfondir les preuves</button><p class="iwv3-action-status" data-iwv3-g2-status aria-live="polite">L’analyse peut être poursuivie sans transformer les inconnues en certitudes.</p></section>`;
  }

  async function render(){
    const m=match(),n=++seq;
    document.querySelectorAll('[data-iwv3-g2-live]').forEach(x=>x.remove());
    if(!m)return;
    try{
      const p=await projection(m[1]);
      if(n!==seq)return;
      for(let i=0;i<30&&!document.querySelector('[data-iwv3-foundation]');i++)await new Promise(r=>setTimeout(r,60));
      const anchor=document.querySelector('[data-iwv3-foundation]');
      if(!anchor||n!==seq)return;
      const html=panel(p);
      if(!html)return;
      anchor.insertAdjacentHTML('afterend',html);
      const el=anchor.nextElementSibling;
      const btn=el?.querySelector('[data-iwv3-g2-run]');
      const status=el?.querySelector('[data-iwv3-g2-status]');
      btn?.addEventListener('click',async()=>{
        btn.disabled=true;
        el?.setAttribute('aria-busy','true');
        const initialLabel=btn.textContent;
        btn.textContent='Analyse en cours…';
        if(status)status.textContent='2b2c vérifie les éléments exploitables du dossier…';
        try{
          const out=await advance(p.idea.id);
          if(status)status.textContent=resultMessage(out);
          if(out?.plan?.gate_status==='READY'){
            btn.textContent='Analyse à jour';
            btn.disabled=true;
          }else{
            btn.textContent=initialLabel;
            btn.disabled=false;
          }
          setTimeout(()=>window.__2B2C_IDEA_WORKSPACE_V3_PREVIEW__?.refresh?.(),0);
        }catch(error){
          if(status)status.textContent=errorMessage(error.message);
          btn.textContent=initialLabel;
          btn.disabled=false;
        }finally{
          el?.removeAttribute('aria-busy');
        }
      });
    }catch(error){console.warn('[2b2c evidence market]',error);}
  }

  addEventListener('hashchange',()=>setTimeout(render,0));
  new MutationObserver(()=>{if(match()&&!document.querySelector('[data-iwv3-g2-live]'))setTimeout(render,80);}).observe(document.documentElement,{childList:true,subtree:true});
  window.__2B2C_G2_LIVE__=Object.freeze({version:VERSION,refresh:render});
  render();
})();

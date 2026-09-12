import { SupabaseBrowserClient } from './supabase-client.js';

(() => {
  if (window.__4B4C_IDEAS_AI_V1__) return;
  const config=window.__4B4C_CONFIG__||{};
  const api=new SupabaseBrowserClient({url:config.supabaseUrl,publishableKey:config.supabasePublishableKey});
  const state={busy:false,last:null,ideaId:null};
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ideaId=()=>((location.hash||'').match(/^#\/ideas\/([0-9a-f-]{36})(?:\/|$)/i)||[])[1]||null;

  function ensureBar(){
    const id=ideaId();
    if(!id) return document.querySelector('.ideas-ai-v1-bar')?.remove();
    if(document.querySelector('.ideas-ai-v1-bar')) return;
    const anchor=document.querySelector('.ideas-v1-tabs')||document.querySelector('.ideas-v1-pagehead');
    if(!anchor) return;
    const el=document.createElement('section');
    el.className='ideas-ai-v1-bar';
    el.innerHTML=`<div class="ideas-ai-v1-intro"><span>Assistant IA</span><strong>Mieux comprendre, améliorer et présenter cette idée</strong><small>L'IA propose. L'équipe décide.</small></div><div class="ideas-ai-v1-actions"><button data-idea-ai="understand">Comprendre</button><button data-idea-ai="questions">Questions utiles</button><button data-idea-ai="improve">Améliorer</button><button data-idea-ai="challenge">Challenger</button><button data-idea-ai="synthesize">Synthétiser</button><button data-idea-ai="presentation" class="primary">Préparer la présentation</button></div>`;
    anchor.insertAdjacentElement('afterend',el);
  }

  function loading(action){
    openPanel(`<div class="ideas-ai-v1-loading"><div></div><strong>${esc(({understand:'Compréhension de l’idée',questions:'Recherche des questions essentielles',improve:'Recherche des meilleures améliorations',challenge:'Challenge de l’idée',synthesize:'Création de la synthèse',presentation:'Préparation de la présentation',presenter:'Préparation de l’orateur'})[action]||'Analyse')}</strong><p>Je travaille uniquement à partir des informations réellement enregistrées dans cette idée.</p></div>`,'Assistant IA');
  }

  function openPanel(body,title='Assistant IA'){
    document.querySelector('.ideas-ai-v1-overlay')?.remove();
    const overlay=document.createElement('div'); overlay.className='ideas-ai-v1-overlay';
    overlay.innerHTML=`<section class="ideas-ai-v1-panel" role="dialog" aria-modal="true"><header><div><small>4b4c · IA</small><h2>${esc(title)}</h2></div><button data-idea-ai-close aria-label="Fermer">×</button></header><div class="ideas-ai-v1-body">${body}</div></section>`;
    document.body.appendChild(overlay);
  }

  async function run(action){
    const id=ideaId(); if(!id||state.busy) return;
    const session=api.getSession(); if(!session?.access_token){openPanel('<p>Reconnectez-vous pour utiliser l’assistant IA.</p>');return;}
    state.busy=true; loading(action);
    try{
      const response=await fetch('/api/ideas/ai',{method:'POST',headers:{'content-type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({action,idea_id:id})});
      const payload=await response.json().catch(()=>({}));
      if(!response.ok||!payload.ok) throw new Error(payload.error||`HTTP_${response.status}`);
      state.last={action,result:payload.result}; renderResult(action,payload.result);
    }catch(error){
      const msg=String(error?.message||error);
      const friendly=msg.includes('FREE_AI_LIMIT_OR_CAPACITY')?'Le quota IA gratuit ou la capacité du modèle est temporairement atteint. Rien n’est facturé : réessayez plus tard.':msg.includes('UNAUTHORIZED')?'Votre session a expiré. Reconnectez-vous.':'L’assistant IA n’a pas pu terminer cette analyse. Réessayez sans modifier l’idée.';
      openPanel(`<div class="ideas-ai-v1-error"><strong>Analyse indisponible</strong><p>${esc(friendly)}</p></div>`);
    }finally{state.busy=false;}
  }

  function normalize(result){
    if(typeof result==='string'){try{return JSON.parse(result);}catch{return {text:result};}}
    return result||{};
  }

  function renderResult(action,raw){
    const r=normalize(raw);
    if(action==='understand'){
      openPanel(`<div class="ideas-ai-v1-summary"><span class="eyebrow">Ce que j’ai compris</span><h3>${esc(r.one_liner||r.title)}</h3><p>${esc(r.understanding)}</p><div class="ideas-ai-v1-grid"><article><small>Problème</small><p>${esc(r.problem||'À préciser')}</p></article><article><small>Pour qui</small><p>${esc(r.audience||'À préciser')}</p></article><article class="wide"><small>Proposition</small><p>${esc(r.proposal||'À préciser')}</p></article></div>${list('Ce qui reste incertain',r.uncertainties)}<div class="ideas-ai-v1-footer"><button data-idea-ai="questions">Poser les questions essentielles</button></div></div>`,'Compréhension de l’idée'); return;
    }
    if(action==='questions'){
      openPanel(`<div class="ideas-ai-v1-stack"><p class="lead">Seulement les questions susceptibles de changer la compréhension ou la décision.</p>${(r.questions||[]).map((q,i)=>`<article class="ideas-ai-v1-question"><span>${i+1}</span><div><h3>${esc(q.question)}</h3><p>${esc(q.why_it_matters)}</p><small>${q.priority==='critical'?'Essentielle':'Utile'}</small></div></article>`).join('')}</div>`,'Questions essentielles');return;
    }
    if(action==='improve'){
      openPanel(`<div class="ideas-ai-v1-stack"><p class="lead">Choisissez ce qui mérite d’être retenu. Rien n’est appliqué automatiquement.</p>${(r.suggestions||[]).map(s=>`<article class="ideas-ai-v1-suggestion"><small>${esc(({simplify:'Simplifier',improve:'Améliorer',differentiate:'Différencier',realism:'Rendre réaliste',opportunity:'Opportunité'})[s.type]||s.type)}</small><h3>${esc(s.title)}</h3><p>${esc(s.reason)}</p><blockquote>${esc(s.proposal)}</blockquote></article>`).join('')}</div>`,'Améliorer l’idée');return;
    }
    if(action==='challenge'){
      openPanel(`<div class="ideas-ai-v1-stack"><p class="lead">L’objectif est de trouver les faiblesses avant que l’équipe ne s’engage.</p>${(r.issues||[]).map(x=>`<article class="ideas-ai-v1-risk ${esc(x.severity)}"><small>${esc(({critical:'Critique',verify:'À vérifier',improve:'Amélioration'})[x.severity]||x.severity)}</small><h3>${esc(x.title)}</h3><p>${esc(x.reason)}</p><strong>À faire : ${esc(x.next_step)}</strong></article>`).join('')}</div>`,'Challenge');return;
    }
    if(action==='synthesize'){
      openPanel(`<div class="ideas-ai-v1-summary"><span class="eyebrow">Synthèse proposée</span><h3>${esc(r.one_liner||r.title)}</h3><div class="ideas-ai-v1-grid"><article><small>Pourquoi ?</small><p>${esc(r.problem)}</p></article><article><small>Pour qui ?</small><p>${esc(r.audience)}</p></article><article class="wide"><small>Proposition</small><p>${esc(r.proposal)}</p></article><article><small>Valeur</small><p>${esc(r.value)}</p></article><article><small>Différenciation</small><p>${esc(r.differentiation)}</p></article></div>${list('Preuves / références',r.evidence)}${list('Hypothèses',r.hypotheses)}${list('Risques',r.risks)}<div class="ideas-ai-v1-decision"><small>Décision attendue</small><strong>${esc(r.decision_needed)}</strong></div><p class="ideas-ai-v1-note">Cette synthèse n’écrase pas la fiche existante : elle sert de proposition à relire avant toute modification.</p></div>`,'Synthèse de l’idée');return;
    }
    if(action==='presentation'){
      const slides=r.slides||[];
      openPanel(`<div class="ideas-ai-v1-pitch"><div class="ideas-ai-v1-pitch-head"><div><span>Présentation équipe</span><strong>6 écrans · orientés décision</strong></div><button data-idea-ai="presenter">Préparer l’orateur</button></div><div class="ideas-ai-v1-slides">${slides.map((s,i)=>`<article><div class="num">${esc(s.number||i+1)}</div><small>${esc(s.title)}</small><h3>${esc(s.headline)}</h3>${(s.bullets||[]).length?`<ul>${s.bullets.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}<div class="note"><span>Note orateur</span>${esc(s.speaker_note)}</div></article>`).join('')}</div><div class="ideas-ai-v1-decision"><small>Question finale à l’équipe</small><strong>${esc(r.decision_question)}</strong></div></div>`,'Présentation prête');return;
    }
    openPanel(`<div class="ideas-ai-v1-presenter"><span class="eyebrow">Ouverture</span><h3>${esc(r.opening)}</h3>${list('Notes de présentation',r.slide_notes)}<h3>Objections probables</h3>${(r.objections||[]).map(o=>`<article><strong>${esc(o.question)}</strong><p>${esc(o.answer)}</p>${o.unknown?'<small>À reconnaître comme encore incertain</small>':''}</article>`).join('')}<div class="ideas-ai-v1-decision"><small>Clôture</small><strong>${esc(r.closing)}</strong></div></div>`,'Préparer l’orateur');
  }

  function list(title,items){return Array.isArray(items)&&items.length?`<section class="ideas-ai-v1-list"><h3>${esc(title)}</h3><ul>${items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>`:'';}

  document.addEventListener('click',e=>{
    if(e.target.closest('[data-idea-ai-close]')||e.target.classList?.contains('ideas-ai-v1-overlay')){document.querySelector('.ideas-ai-v1-overlay')?.remove();return;}
    const action=e.target.closest('[data-idea-ai]')?.dataset.ideaAi;
    if(action){e.preventDefault();void run(action);}
  });
  window.addEventListener('hashchange',()=>setTimeout(ensureBar,100));
  new MutationObserver(()=>ensureBar()).observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(ensureBar,900);
  window.__4B4C_IDEAS_AI_V1__=Object.freeze({version:'1.0.0',run});
})();
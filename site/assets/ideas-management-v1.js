import { SupabaseBrowserClient } from './supabase-client.js';

(() => {
  if (window.__2B2C_IDEAS_MANAGEMENT_V1__) return;
  window.__2B2C_IDEAS_MANAGEMENT_V1__ = true;

  const config = window.__4B4C_CONFIG__ || {};
  const api = new SupabaseBrowserClient({ url: config.supabaseUrl, publishableKey: config.supabasePublishableKey });
  let overlay = null;
  let menu = null;
  let busy = false;

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ideaIdFromHref = (href='') => (String(href).match(/#\/ideas\/([0-9a-f-]{36})(?:\/|$)/i) || [])[1] || null;
  const currentIdeaId = () => ideaIdFromHref(location.hash || '');
  const one = (value) => Array.isArray(value) ? value[0] ?? null : value;

  async function fetchIdea(id){
    const rows = await api.select('ideas', `select=id,title,original_text,current_description,summary,problem,audience,proposal,status,version,converted_project_id&id=eq.${id}&limit=1`);
    const idea = one(rows);
    if (!idea) throw new Error('Idée introuvable ou inaccessible.');
    return idea;
  }

  function closeMenu(){ if(menu){ menu.remove(); menu=null; } }
  function closeModal(){ if(overlay){ overlay.remove(); overlay=null; } }

  function errorMessage(error){
    const raw=String(error?.message || error || 'Erreur inconnue');
    if(raw.includes('STALE_IDEA')) return 'Cette idée a été modifiée ailleurs. Rechargez la page avant de réessayer.';
    if(raw.includes('FORBIDDEN')) return 'Vous n’avez pas les droits nécessaires pour cette action.';
    if(raw.includes('IDEA_ALREADY_CONVERTED')) return 'Cette idée a déjà été convertie en projet et ne peut plus être supprimée ici.';
    if(raw.includes('IDEA_HAS_PROJECT_DEFINITION')) return 'Cette idée possède déjà une définition de projet protégée. Elle doit être archivée plutôt que supprimée.';
    if(raw.includes('IDEA_HAS_PROTECTED_HISTORY')) return 'Cette idée possède déjà un historique de décision protégé. Elle doit être archivée plutôt que supprimée.';
    return raw;
  }

  function showError(message){
    const box=overlay?.querySelector('[data-idea-management-error]');
    if(box){ box.textContent=message; box.hidden=false; }
  }

  function modal(content){
    closeModal();
    overlay=document.createElement('div');
    overlay.className='idea-management-overlay';
    overlay.innerHTML=`<div class="idea-management-modal" role="dialog" aria-modal="true">${content}</div>`;
    overlay.addEventListener('click',(event)=>{ if(event.target===overlay) closeModal(); });
    document.body.appendChild(overlay);
    return overlay;
  }

  async function openEdit(id){
    closeMenu();
    const idea=await fetchIdea(id);
    if(idea.converted_project_id || idea.status==='converted') throw new Error('IDEA_ALREADY_CONVERTED');
    const current=idea.current_description?.trim() || idea.original_text || '';
    modal(`
      <div class="idea-management-head"><div><small>Gestion de l’idée</small><h2>Modifier l’idée</h2></div><button type="button" data-im-close aria-label="Fermer">×</button></div>
      <form data-im-form="edit" data-id="${esc(idea.id)}" data-version="${Number(idea.version)||0}">
        <label>Titre<input name="title" required value="${esc(idea.title)}"></label>
        <label>Description actuelle<textarea name="description" rows="5" required>${esc(current)}</textarea><small>Le texte saisi lors de la création reste conservé séparément dans l’historique.</small></label>
        <label>Synthèse<textarea name="summary" rows="2">${esc(idea.summary)}</textarea></label>
        <div class="idea-management-grid"><label>Problème / opportunité<textarea name="problem" rows="3">${esc(idea.problem)}</textarea></label><label>Pour qui ?<textarea name="audience" rows="3">${esc(idea.audience)}</textarea></label></div>
        <label>Proposition actuelle<textarea name="proposal" rows="4">${esc(idea.proposal)}</textarea></label>
        <div class="idea-management-error" data-idea-management-error hidden></div>
        <footer><button type="button" data-im-close>Annuler</button><button class="primary" type="submit">Enregistrer</button></footer>
      </form>`);
    overlay.querySelector('[name="title"]')?.focus();
  }

  async function openDelete(id){
    closeMenu();
    const idea=await fetchIdea(id);
    modal(`
      <div class="idea-management-head"><div><small>Action irréversible</small><h2>Supprimer l’idée ?</h2></div><button type="button" data-im-close aria-label="Fermer">×</button></div>
      <div class="idea-management-delete-copy"><p>L’idée <strong>${esc(idea.title)}</strong> et ses éléments associés seront supprimés.</p><p>Une idée déjà convertie en projet ou possédant un historique de décision protégé ne peut pas être supprimée de cette façon.</p></div>
      <div class="idea-management-error" data-idea-management-error hidden></div>
      <footer><button type="button" data-im-close>Annuler</button><button class="danger" type="button" data-im-confirm-delete data-id="${esc(idea.id)}" data-version="${Number(idea.version)||0}">Supprimer définitivement</button></footer>`);
  }

  function openMenu(button,id){
    closeMenu();
    const rect=button.getBoundingClientRect();
    menu=document.createElement('div');
    menu.className='idea-management-menu';
    menu.innerHTML=`<button type="button" data-im-edit data-id="${esc(id)}">Modifier</button><button class="danger" type="button" data-im-delete data-id="${esc(id)}">Supprimer</button>`;
    document.body.appendChild(menu);
    const top=Math.min(window.innerHeight-menu.offsetHeight-12,rect.bottom+6);
    const left=Math.max(12,Math.min(window.innerWidth-menu.offsetWidth-12,rect.right-menu.offsetWidth));
    menu.style.top=`${Math.max(12,top)}px`;
    menu.style.left=`${left}px`;
  }

  function enhanceCards(){
    document.querySelectorAll('.ideas-v1-card[href^="#/ideas/"]').forEach(card=>{
      if(card.querySelector('[data-im-card-menu]')) return;
      const id=ideaIdFromHref(card.getAttribute('href'));
      if(!id) return;
      const button=document.createElement('button');
      button.type='button';
      button.className='idea-management-card-menu';
      button.dataset.imCardMenu='1';
      button.dataset.id=id;
      button.setAttribute('aria-label','Actions sur cette idée');
      button.textContent='•••';
      const chevron=card.querySelector('.ideas-v1-chevron');
      if(chevron) card.insertBefore(button,chevron); else card.appendChild(button);
    });
  }

  async function enhanceDetail(){
    const id=currentIdeaId();
    if(!id) return;
    const page=document.querySelector('.ideas-v1-page');
    const actions=page?.querySelector('.ideas-v1-head-actions') || page?.querySelector('.ideas-v1-pagehead');
    if(actions && !page.querySelector('[data-im-detail-actions]')){
      const wrap=document.createElement('div');
      wrap.className='idea-management-detail-actions';
      wrap.dataset.imDetailActions='1';
      wrap.innerHTML=`<button type="button" data-im-edit data-id="${esc(id)}">Modifier</button><button type="button" class="danger-ghost" data-im-delete data-id="${esc(id)}">Supprimer</button>`;
      actions.appendChild(wrap);
    }
    try{
      const idea=await fetchIdea(id);
      const current=idea.current_description?.trim();
      const quote=page?.querySelector('.ideas-v1-hero blockquote');
      if(current && quote && quote.textContent!==current) quote.textContent=current;
    }catch(_){ }
  }

  function enhance(){ enhanceCards(); enhanceDetail(); }

  document.addEventListener('click',async(event)=>{
    const menuButton=event.target.closest?.('[data-im-card-menu]');
    if(menuButton){ event.preventDefault(); event.stopPropagation(); return openMenu(menuButton,menuButton.dataset.id); }
    const edit=event.target.closest?.('[data-im-edit]');
    if(edit){ event.preventDefault(); event.stopPropagation(); try{ await openEdit(edit.dataset.id); }catch(error){ alert(errorMessage(error)); } return; }
    const del=event.target.closest?.('[data-im-delete]');
    if(del){ event.preventDefault(); event.stopPropagation(); try{ await openDelete(del.dataset.id); }catch(error){ alert(errorMessage(error)); } return; }
    if(event.target.closest?.('[data-im-close]')){ event.preventDefault(); return closeModal(); }
    if(!event.target.closest?.('.idea-management-menu')) closeMenu();

    const confirmDelete=event.target.closest?.('[data-im-confirm-delete]');
    if(confirmDelete){
      event.preventDefault();
      if(busy)return; busy=true; confirmDelete.disabled=true;
      try{
        await api.rpc('delete_idea_v2',{p_idea_id:confirmDelete.dataset.id,p_expected_version:Number(confirmDelete.dataset.version)});
        closeModal();
        location.hash='#/ideas';
        setTimeout(()=>location.reload(),40);
      }catch(error){ showError(errorMessage(error)); confirmDelete.disabled=false; }
      finally{ busy=false; }
    }
  },true);

  document.addEventListener('submit',async(event)=>{
    const form=event.target.closest?.('[data-im-form="edit"]');
    if(!form)return;
    event.preventDefault();
    if(busy)return; busy=true;
    const submit=form.querySelector('button[type="submit"]'); if(submit)submit.disabled=true;
    const data=new FormData(form);
    try{
      await api.rpc('update_idea_content_v2',{
        p_idea_id:form.dataset.id,
        p_expected_version:Number(form.dataset.version),
        p_title:String(data.get('title')||''),
        p_current_description:String(data.get('description')||''),
        p_summary:String(data.get('summary')||''),
        p_problem:String(data.get('problem')||''),
        p_audience:String(data.get('audience')||''),
        p_proposal:String(data.get('proposal')||'')
      });
      closeModal();
      location.reload();
    }catch(error){ showError(errorMessage(error)); if(submit)submit.disabled=false; }
    finally{ busy=false; }
  },true);

  const observer=new MutationObserver(()=>queueMicrotask(enhance));
  observer.observe(document.documentElement,{subtree:true,childList:true});
  window.addEventListener('hashchange',()=>setTimeout(enhance,0));
  document.addEventListener('DOMContentLoaded',enhance,{once:true});
  setTimeout(enhance,0);
})();

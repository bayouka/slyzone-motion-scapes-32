import { SupabaseBrowserClient } from './supabase-client.js';

(() => {
  if (window.__2B2C_IDEAS_MANAGEMENT_V1__) return;
  window.__2B2C_IDEAS_MANAGEMENT_V1__ = true;

  const config = window.__4B4C_CONFIG__ || {};
  const api = new SupabaseBrowserClient({ url: config.supabaseUrl, publishableKey: config.supabasePublishableKey });
  const workspaceKey = config.workspaceStorageKey || '4b4c.live.workspace.v1';
  let overlay = null;
  let menu = null;
  let busy = false;
  let capabilityPromise = null;
  let capabilities = new Map();

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ideaIdFromHref = (href='') => (String(href).match(/#\/ideas\/([0-9a-f-]{36})(?:\/|$)/i) || [])[1] || null;
  const currentIdeaId = () => ideaIdFromHref(location.hash || '');
  const one = (value) => Array.isArray(value) ? value[0] ?? null : value;
  const workspaceId = () => localStorage.getItem(workspaceKey) || '';

  async function fetchIdea(id){
    const rows = await api.select('ideas', `select=id,workspace_id,created_by,title,original_text,current_description,summary,problem,audience,proposal,status,version,converted_project_id&id=eq.${id}&limit=1`);
    const idea = one(rows);
    if (!idea) throw new Error('Idée introuvable ou inaccessible.');
    return idea;
  }

  async function loadCapabilities(force=false){
    if(capabilityPromise && !force) return capabilityPromise;
    capabilityPromise=(async()=>{
      const session=api.getSession();
      if(!session?.access_token){ capabilities=new Map(); return capabilities; }
      const user=await api.getUser();
      const workspace=workspaceId();
      if(!user?.id || !workspace){ capabilities=new Map(); return capabilities; }
      const [ideas,members,workspaceRows]=await Promise.all([
        api.select('ideas',`select=id,created_by,status,converted_project_id&workspace_id=eq.${workspace}`).catch(()=>[]),
        api.select('idea_members',`select=idea_id,user_id,role&user_id=eq.${user.id}`).catch(()=>[]),
        api.select('workspace_members',`select=role,status&workspace_id=eq.${workspace}&user_id=eq.${user.id}&status=eq.active&limit=1`).catch(()=>[])
      ]);
      const ideaRoles=new Map((members||[]).map(row=>[row.idea_id,row.role]));
      const workspaceRole=one(workspaceRows)?.role || null;
      const canManage=['owner','admin'].includes(workspaceRole);
      capabilities=new Map((ideas||[]).map(idea=>{
        const converted=Boolean(idea.converted_project_id)||idea.status==='converted';
        const creator=idea.created_by===user.id;
        const editor=ideaRoles.get(idea.id)==='editor';
        return [idea.id,{canEdit:!converted&&(creator||editor||canManage),canDelete:!converted&&(creator||canManage)}];
      }));
      return capabilities;
    })().finally(()=>{ capabilityPromise=null; });
    return capabilityPromise;
  }

  async function capabilityFor(id){
    if(!capabilities.has(id)) await loadCapabilities(true);
    return capabilities.get(id)||{canEdit:false,canDelete:false};
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
    const permission=await capabilityFor(id);
    if(!permission.canEdit) throw new Error('FORBIDDEN');
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
    const permission=await capabilityFor(id);
    if(!permission.canDelete) throw new Error('FORBIDDEN');
    const idea=await fetchIdea(id);
    modal(`
      <div class="idea-management-head"><div><small>Action irréversible</small><h2>Supprimer l’idée ?</h2></div><button type="button" data-im-close aria-label="Fermer">×</button></div>
      <div class="idea-management-delete-copy"><p>L’idée <strong>${esc(idea.title)}</strong> et ses éléments associés seront supprimés.</p><p>Une idée déjà convertie en projet ou possédant un historique de décision protégé ne peut pas être supprimée de cette façon.</p></div>
      <div class="idea-management-error" data-idea-management-error hidden></div>
      <footer><button type="button" data-im-close>Annuler</button><button class="danger" type="button" data-im-confirm-delete data-id="${esc(idea.id)}" data-version="${Number(idea.version)||0}">Supprimer définitivement</button></footer>`);
  }

  function openMenu(button,id){
    closeMenu();
    const canEdit=button.dataset.canEdit==='1';
    const canDelete=button.dataset.canDelete==='1';
    if(!canEdit&&!canDelete) return;
    const rect=button.getBoundingClientRect();
    menu=document.createElement('div');
    menu.className='idea-management-menu';
    menu.innerHTML=`${canEdit?`<button type="button" data-im-edit data-id="${esc(id)}">Modifier</button>`:''}${canDelete?`<button class="danger" type="button" data-im-delete data-id="${esc(id)}">Supprimer</button>`:''}`;
    document.body.appendChild(menu);
    const top=Math.min(window.innerHeight-menu.offsetHeight-12,rect.bottom+6);
    const left=Math.max(12,Math.min(window.innerWidth-menu.offsetWidth-12,rect.right-menu.offsetWidth));
    menu.style.top=`${Math.max(12,top)}px`;
    menu.style.left=`${left}px`;
  }

  async function enhanceCards(){
    const map=await loadCapabilities();
    document.querySelectorAll('.ideas-v1-card[href^="#/ideas/"]').forEach(card=>{
      const id=ideaIdFromHref(card.getAttribute('href'));
      if(!id) return;
      const permission=map.get(id)||{canEdit:false,canDelete:false};
      let button=card.querySelector('[data-im-card-menu]');
      if(!permission.canEdit&&!permission.canDelete){ button?.remove(); return; }
      if(!button){
        button=document.createElement('button');
        button.type='button';
        button.className='idea-management-card-menu';
        button.dataset.imCardMenu='1';
        button.dataset.id=id;
        button.setAttribute('aria-label','Actions sur cette idée');
        button.textContent='•••';
        const chevron=card.querySelector('.ideas-v1-chevron');
        if(chevron) card.insertBefore(button,chevron); else card.appendChild(button);
      }
      button.dataset.canEdit=permission.canEdit?'1':'0';
      button.dataset.canDelete=permission.canDelete?'1':'0';
    });
  }

  async function enhanceDetail(){
    const id=currentIdeaId();
    if(!id) return;
    const page=document.querySelector('.ideas-v1-page');
    if(!page) return;
    const [idea,permission]=await Promise.all([fetchIdea(id).catch(()=>null),capabilityFor(id)]);
    if(!idea) return;
    const actions=page.querySelector('.ideas-v1-head-actions') || page.querySelector('.ideas-v1-pagehead');
    let wrap=page.querySelector('[data-im-detail-actions]');
    if(permission.canEdit||permission.canDelete){
      if(!wrap){ wrap=document.createElement('div');wrap.className='idea-management-detail-actions';wrap.dataset.imDetailActions='1';actions?.appendChild(wrap); }
      if(wrap) wrap.innerHTML=`${permission.canEdit?`<button type="button" data-im-edit data-id="${esc(id)}">Modifier</button>`:''}${permission.canDelete?`<button type="button" class="danger-ghost" data-im-delete data-id="${esc(id)}">Supprimer</button>`:''}`;
    }else wrap?.remove();
    const current=idea.current_description?.trim();
    const quote=page.querySelector('.ideas-v1-hero blockquote');
    if(current && quote && quote.textContent!==current) quote.textContent=current;
  }

  function enhance(){ enhanceCards().catch(()=>{}); enhanceDetail().catch(()=>{}); }

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
        capabilities.delete(confirmDelete.dataset.id);
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
  window.addEventListener('hashchange',()=>{ capabilities=new Map(); setTimeout(enhance,0); });
  document.addEventListener('DOMContentLoaded',enhance,{once:true});
  setTimeout(enhance,0);
})();

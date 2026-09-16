(()=>{
  if(window.__2B2C_IDEAS_CANONICAL_BRIDGE_V1__) return;
  const VERSION='1.0.0';
  const ideaId=()=>((location.hash||'').match(/^#\/ideas\/([0-9a-f-]{36})(?:\/|$)/i)||[])[1]||null;

  function workspaceHref(id){return `#/ideas/${id}/workspace-v3`;}

  function patch(){
    const id=ideaId();
    if(!id) return;

    document.querySelectorAll('.ideas-v1-final-actions').forEach(actions=>{
      if(actions.dataset.canonicalBridge==='true') return;
      actions.dataset.canonicalBridge='true';
      actions.innerHTML=`<a class="ideas-v1-primary compact" data-canonical-workspace href="${workspaceHref(id)}">Ouvrir le workspace canonique</a><p class="ideas-canonical-bridge-note">Les anciennes décisions directes sont désactivées. La décision et la promotion projet doivent passer par le dossier canonique.</p>`;
    });

    document.querySelectorAll('[data-idea-action="convert"]').forEach(node=>{
      const link=document.createElement('a');
      link.href=workspaceHref(id);
      link.className=node.className||'ideas-v1-primary';
      link.dataset.canonicalWorkspace='true';
      link.textContent='Ouvrir le workspace canonique';
      node.replaceWith(link);
    });

    document.querySelectorAll('[data-idea-action="decide"]').forEach(node=>{
      const link=document.createElement('a');
      link.href=workspaceHref(id);
      link.className=node.className||'ideas-v1-primary';
      link.dataset.canonicalWorkspace='true';
      link.textContent='Ouvrir le workspace canonique';
      node.replaceWith(link);
    });
  }

  const style=document.createElement('style');
  style.textContent='.ideas-canonical-bridge-note{grid-column:1/-1;margin:4px 0 0;font-size:12px;line-height:1.45;color:#68758b}.ideas-v1-final-actions>a[data-canonical-workspace]{display:inline-flex;align-items:center;justify-content:center;text-decoration:none}';
  document.head.appendChild(style);

  addEventListener('hashchange',()=>setTimeout(patch,0));
  new MutationObserver(()=>patch()).observe(document.documentElement,{childList:true,subtree:true});
  window.__2B2C_IDEAS_CANONICAL_BRIDGE_V1__=Object.freeze({version:VERSION,refresh:patch});
  patch();
})();

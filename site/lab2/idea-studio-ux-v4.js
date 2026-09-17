(() => {
  'use strict';

  const MAX_INTERESTS=4;
  const INTEREST_LABELS=Object.freeze({
    parcours:'Parcours / fonctionnement',fonctions:'Fonctionnalités / outils',simple:'Simplicité / clarté',design:'Design / ambiance',nav:'Navigation / organisation',contenu:'Contenu / ton',cta:'Conversion / CTA',autre:'Autre'
  });
  const LEGACY_MAP=Object.freeze({fonctionnement:'parcours',fonctionnalites:'fonctions',simplicite:'simple',organisation:'nav',design:'design',autre:'autre'});
  const referencesList=document.getElementById('referencesList');
  const referenceEmptyState=document.getElementById('referenceEmptyState');
  const mirror=document.getElementById('referenceSummaryMirrorBody');

  const parseInterests=(value)=>{
    const raw=String(value||'').split(',').map(item=>item.trim()).filter(Boolean);
    return [...new Set(raw.map(item=>LEGACY_MAP[item]||item).filter(item=>INTEREST_LABELS[item]))].slice(0,MAX_INTERESTS);
  };
  const updateEmptyState=()=>{if(referenceEmptyState&&referencesList)referenceEmptyState.hidden=Boolean(referencesList.querySelector('.reference-card'))};
  const repaintMirror=()=>{
    if(!mirror||!referencesList)return;
    mirror.innerHTML='';
    const rows=[...referencesList.querySelectorAll('.reference-card')];
    if(!rows.length){mirror.textContent='Aucune référence fournie.';return}
    rows.forEach(row=>{
      const url=String(row.querySelector('.reference-url')?.value||'').trim();
      const note=String(row.querySelector('.reference-note')?.value||'').trim();
      const interests=parseInterests(row.querySelector('.reference-reason')?.value).map(code=>INTEREST_LABELS[code]);
      if(!url&&!note)return;
      const item=document.createElement('div');item.className='reference-summary-item';
      const strong=document.createElement('strong');strong.textContent=url||'Référence sans URL';
      const span=document.createElement('span');span.textContent=[interests.join(' · '),note].filter(Boolean).join(' — ')||'Référence ajoutée';
      item.append(strong,span);mirror.appendChild(item);
    });
    if(!mirror.childElementCount&&!mirror.textContent)mirror.textContent='Aucune référence fournie.';
  };
  const syncRow=(row)=>{
    if(!row||row.dataset.multiInterestReady==='true')return;
    const hidden=row.querySelector('.reference-reason'),buttons=[...row.querySelectorAll('.reference-interest')];
    if(!hidden||!buttons.length)return;
    const selected=new Set(parseInterests(hidden.value));
    const paint=()=>{
      hidden.value=[...selected].join(',');
      buttons.forEach(button=>{const active=selected.has(button.dataset.interest);button.classList.toggle('is-selected',active);button.setAttribute('aria-pressed',active?'true':'false')});
      repaintMirror();
    };
    buttons.forEach(button=>button.addEventListener('click',()=>{
      const code=button.dataset.interest;if(!code)return;
      if(selected.has(code))selected.delete(code);
      else if(selected.size<MAX_INTERESTS)selected.add(code);
      else return;
      paint();hidden.dispatchEvent(new Event('change',{bubbles:true}));
    }));
    row.querySelector('.reference-url')?.addEventListener('input',repaintMirror);
    row.querySelector('.reference-note')?.addEventListener('input',repaintMirror);
    row.dataset.multiInterestReady='true';paint();
  };

  if(referencesList){
    [...referencesList.querySelectorAll('.reference-card')].forEach(syncRow);
    new MutationObserver(()=>{
      [...referencesList.querySelectorAll('.reference-card')].forEach(syncRow);
      updateEmptyState();repaintMirror();
    }).observe(referencesList,{childList:true,subtree:true});
    referencesList.addEventListener('input',repaintMirror);
  }
  document.getElementById('noReference')?.addEventListener('click',()=>setTimeout(()=>{updateEmptyState();repaintMirror()},0));
  document.getElementById('resetDraft')?.addEventListener('click',()=>setTimeout(()=>{updateEmptyState();repaintMirror()},0));
  updateEmptyState();repaintMirror();
})();
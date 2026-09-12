(() => {
  if (window.__4B4C_CALL_MOBILE_V8__) return;
  window.__4B4C_CALL_MOBILE_V8__ = true;

  const mq = window.matchMedia('(max-width: 767px)');
  const tileMap = new Map();
  let raf = 0;
  let unsubscribeBridge = null;

  const icon = (name) => ({
    mic:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M8.5 21h7"/></svg>',
    camera:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="13" height="12" rx="2.5"/><path d="m16 10 5-3v10l-5-3"/></svg>',
    switch:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10l-2.5-2.5M17 17H7l2.5 2.5"/><path d="M18.5 8.5A7 7 0 0 1 19 11M5.5 15.5A7 7 0 0 1 5 13"/></svg>',
    leave:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.8 9.6c4.1-2.2 8.3-2.2 12.4 0l1.8 1.1-2.4 4-3-1.5v-2.1a10 10 0 0 0-5.2 0v2.1l-3 1.5-2.4-4 1.8-1.1Z"/></svg>',
    users:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3.5 19c.4-3.8 2.2-5.7 5.5-5.7s5.1 1.9 5.5 5.7M16 5.5a2.5 2.5 0 0 1 0 5M16 13c2.7.2 4.2 1.8 4.5 5"/></svg>',
    settings:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19 13.5a7.5 7.5 0 0 0 0-3l2-1.5-2-3.4-2.4 1a8 8 0 0 0-2.5-1.4L13.8 3h-3.6l-.3 2.2a8 8 0 0 0-2.5 1.4l-2.4-1-2 3.4 2 1.5a7.5 7.5 0 0 0 0 3L3 15l2 3.4 2.4-1a8 8 0 0 0 2.5 1.4l.3 2.2h3.6l.3-2.2a8 8 0 0 0 2.5-1.4l2.4 1 2-3.4-2-1.5Z"/></svg>',
    share:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4M9 10l3-3 3 3M12 7v7"/></svg>',
    minimize:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>',
    fullscreen:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/></svg>',
    end:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.8 9.6c4.1-2.2 8.3-2.2 12.4 0l1.8 1.1-2.4 4-3-1.5v-2.1a10 10 0 0 0-5.2 0v2.1l-3 1.5-2.4-4 1.8-1.1Z"/></svg>',
  })[name] || '';

  function syncViewport(){
    const h=Math.round(window.visualViewport?.height||window.innerHeight||document.documentElement.clientHeight||0);
    if(h>0)document.documentElement.style.setProperty('--ce3-mobile-vh',`${h}px`);
  }

  function actionButton(action,label,iconName,extra=''){
    return `<button type="button" data-mobile-call-action="${action}" class="${extra}"><b>${icon(iconName)}</b><span>${label}</span></button>`;
  }

  function ensureCommandbar(){
    if(!mq.matches)return;
    const head=document.querySelector('#call-engine-v3-active .ce3-head');
    if(!head||head.querySelector('.ce3-mobile-commandbar'))return;
    const bar=document.createElement('div');
    bar.className='ce3-mobile-commandbar';
    bar.innerHTML=`<div class="ce3-mobile-meta"><span class="ce3-mobile-live">En direct</span><strong class="ce3-mobile-title">Visio</strong><small class="ce3-mobile-sub"></small></div><button type="button" class="ce3-mobile-more" data-mobile-call-more aria-label="Plus d’options"><span aria-hidden="true">•••</span></button><div class="ce3-mobile-actions">${actionButton('mic','Micro','mic')}${actionButton('camera','Caméra','camera')}${actionButton('switch-camera','Retourner','switch')}${actionButton('leave','Quitter','leave','ce3-mobile-hangup')}</div>`;
    head.appendChild(bar);
  }

  function clickEngine(action){
    const source=document.querySelector(`#call-engine-v3-active [data-ce3-action="${action}"]`);
    if(source && !source.disabled) source.click();
  }

  function sheetButton(action,label,iconName,extra=''){
    return `<button type="button" data-mobile-call-action="${action}" class="${extra}"><span class="ce3-mobile-sheet-icon">${icon(iconName)}</span><span>${label}</span></button>`;
  }

  function ensureSheet(){
    let overlay=document.querySelector('.ce3-mobile-sheet-backdrop');
    if(overlay)return overlay;
    overlay=document.createElement('div');
    overlay.className='ce3-mobile-sheet-backdrop';
    overlay.innerHTML=`<section class="ce3-mobile-sheet" role="dialog" aria-modal="true" aria-label="Options de la visio"><div class="ce3-mobile-sheet-head"><div><strong>Options</strong><small>Actions moins fréquentes</small></div><button class="ce3-mobile-sheet-close" data-mobile-call-close aria-label="Fermer">×</button></div><div class="ce3-mobile-sheet-actions">${sheetButton('add','Participants','users')}${sheetButton('devices','Périphériques','settings')}${sheetButton('screen','Partager l’écran','share')}${sheetButton('minimize','Réduire','minimize')}${sheetButton('fullscreen','Plein écran','fullscreen')}${sheetButton('end','Terminer pour tous','end','danger')}</div></section>`;
    document.body.appendChild(overlay);
    return overlay;
  }

  function syncCommandbar(){
    const root=document.querySelector('#call-engine-v3-active');
    if(!root)return;
    ensureCommandbar();
    const title=root.querySelector('[data-ce3-title]')?.textContent?.trim()||'Visio 2b2c';
    const count=root.querySelector('[data-ce3-count]')?.textContent?.trim()||'';
    const health=root.querySelector('[data-ce3-health]')?.textContent?.trim()||'';
    const bar=root.querySelector('.ce3-mobile-commandbar');
    if(!bar)return;
    const titleNode=bar.querySelector('.ce3-mobile-title');if(titleNode&&titleNode.textContent!==title)titleNode.textContent=title;
    const sub=bar.querySelector('.ce3-mobile-sub');const subText=[count,health].filter(Boolean).join(' · ');if(sub&&sub.textContent!==subText)sub.textContent=subText;
    for(const action of ['mic','camera']){
      const source=root.querySelector(`[data-ce3-action="${action}"]`);const target=bar.querySelector(`[data-mobile-call-action="${action}"]`);
      if(target&&source){target.classList.toggle('off',source.classList.contains('off'));target.disabled=source.disabled;}
    }
    const switchTarget=bar.querySelector('[data-mobile-call-action="switch-camera"]');const switchSource=root.querySelector('[data-ce3-action="switch-camera"]');if(switchTarget&&switchSource)switchTarget.disabled=switchSource.disabled;
  }

  function ensureStableStage(){
    const stage=document.querySelector('#call-engine-v3-active .ce3-stage');
    if(!stage)return null;
    let stable=stage.querySelector('.ce3-mobile-stable-stage');
    if(!stable){stable=document.createElement('div');stable.className='ce3-mobile-stable-stage';stage.appendChild(stable);}
    return stable;
  }

  function bridgeSnapshot(){
    const bridge=window.__4B4C_CALL_MEDIA_BRIDGE_V1__;
    const rows=bridge?.snapshot?.()||[];
    return rows.filter((row)=>row.role==='camera'||row.role==='screen');
  }

  function stableTileFrom(media){
    const key=media.key;
    let entry=tileMap.get(key);
    if(!entry){
      const node=document.createElement('article');node.className='ce3-mobile-stable-tile';node.dataset.stableKey=key;
      const avatar=document.createElement('span');avatar.className='ce3-mobile-stable-avatar';
      const video=document.createElement('video');video.autoplay=true;video.playsInline=true;video.muted=Boolean(media.self);
      const label=document.createElement('span');label.className='ce3-mobile-stable-label';
      node.append(avatar,video,label);entry={node,video,avatar,label,stream:null};tileMap.set(key,entry);
    }
    entry.node.classList.toggle('self',Boolean(media.self));entry.node.classList.toggle('screen',media.role==='screen');
    entry.avatar.textContent=media.avatar||'?';entry.label.textContent=media.label||(media.self?'Vous':media.role==='screen'?'Écran partagé':'Participant');
    const stream=media.stream||null;
    if(entry.stream!==stream){entry.stream=stream;entry.video.srcObject=stream;if(stream)void entry.video.play().catch(()=>{});}
    const liveTrack=stream?.getVideoTracks?.().find((track)=>track.readyState==='live');
    const hasVideo=Boolean(liveTrack&&liveTrack.enabled!==false&&media.visible!==false);
    entry.node.classList.toggle('has-video',hasVideo);entry.video.hidden=!hasVideo;
    return entry;
  }

  function reconcileStableStage(){
    if(!mq.matches)return;
    const stable=ensureStableStage();if(!stable)return;
    const rows=bridgeSnapshot();const activeKeys=new Set();const entries=[];
    for(const media of rows){activeKeys.add(media.key);entries.push(stableTileFrom(media));}
    for(const [key,entry] of [...tileMap]){if(!activeKeys.has(key)){entry.video.srcObject=null;entry.node.remove();tileMap.delete(key);}}
    const screens=entries.filter((entry)=>entry.node.classList.contains('screen'));
    const cameras=entries.filter((entry)=>!entry.node.classList.contains('screen'));
    const ordered=screens.length?[...screens,...cameras]:cameras;
    stable.classList.toggle('has-screen',screens.length>0);stable.classList.toggle('multi',!screens.length&&ordered.length>2);stable.classList.toggle('empty',ordered.length===0);
    for(const entry of ordered){if(entry.node.parentNode!==stable||stable.lastElementChild!==entry.node)stable.appendChild(entry.node);}
    let empty=stable.querySelector('.ce3-mobile-stage-empty');
    if(!ordered.length){if(!empty){empty=document.createElement('div');empty.className='ce3-mobile-stage-empty';empty.innerHTML='<span></span><strong>Préparation de la vidéo…</strong><small>La caméra va apparaître ici.</small>';stable.appendChild(empty);}}
    else empty?.remove();
  }

  function enhancePrejoin(){
    if(!mq.matches)return;
    const dialog=document.querySelector('#call-engine-v3-prejoin .ce3-dialog');if(!dialog)return;
    dialog.classList.add('ce3-prejoin-mobile-v8');
    const footer=dialog.querySelector('footer');if(footer)footer.classList.add('ce3-prejoin-sticky-actions');
  }

  function sync(){if(!mq.matches)return;syncViewport();syncCommandbar();reconcileStableStage();enhancePrejoin();}
  function schedule(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;sync();});}

  document.addEventListener('click',(event)=>{
    const more=event.target.closest?.('[data-mobile-call-more]');if(more){event.preventDefault();ensureSheet();return;}
    const close=event.target.closest?.('[data-mobile-call-close]');if(close){event.preventDefault();document.querySelector('.ce3-mobile-sheet-backdrop')?.remove();return;}
    const action=event.target.closest?.('[data-mobile-call-action]');if(action){event.preventDefault();const name=action.dataset.mobileCallAction;document.querySelector('.ce3-mobile-sheet-backdrop')?.remove();clickEngine(name);}
    if(event.target.classList?.contains('ce3-mobile-sheet-backdrop'))event.target.remove();
  },true);

  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','style']});
  window.visualViewport?.addEventListener('resize',schedule,{passive:true});window.visualViewport?.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
  const bridge=window.__4B4C_CALL_MEDIA_BRIDGE_V1__;if(bridge?.subscribe)unsubscribeBridge=bridge.subscribe(schedule);
  setInterval(()=>{if(document.getElementById('call-engine-v3-active')||document.getElementById('call-engine-v3-prejoin'))schedule();},800);
  schedule();
  window.__4B4C_CALL_MOBILE_V8__=Object.freeze({version:'8.1.0',stableStage:true,topCommands:true,mediaBridge:'1.0.0',destroy(){unsubscribeBridge?.();}});
})();

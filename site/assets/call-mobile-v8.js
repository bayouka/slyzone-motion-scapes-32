(() => {
  if (window.__4B4C_CALL_MOBILE_V8__) return;
  window.__4B4C_CALL_MOBILE_V8__ = true;
  const mq = window.matchMedia('(max-width: 767px)');
  const tileMap = new Map();
  let raf = 0;

  function syncViewport(){
    const h=Math.round(window.visualViewport?.height||window.innerHeight||document.documentElement.clientHeight||0);
    if(h>0)document.documentElement.style.setProperty('--ce3-mobile-vh',`${h}px`);
  }

  function actionButton(action,label,icon,extra=''){
    return `<button type="button" data-mobile-call-action="${action}" class="${extra}"><b aria-hidden="true">${icon}</b><span>${label}</span></button>`;
  }

  function ensureCommandbar(){
    if(!mq.matches)return;
    const shell=document.querySelector('#call-engine-v3-active .ce3-shell');
    const head=shell?.querySelector('.ce3-head');
    if(!head||head.querySelector('.ce3-mobile-commandbar'))return;
    const bar=document.createElement('div');
    bar.className='ce3-mobile-commandbar';
    bar.innerHTML=`<div class="ce3-mobile-meta"><span class="ce3-mobile-live">En direct</span><strong class="ce3-mobile-title">Visio</strong><small class="ce3-mobile-sub"></small></div><button type="button" class="ce3-mobile-more" data-mobile-call-more aria-label="Plus d’options">•••</button><div class="ce3-mobile-actions">${actionButton('mic','Micro','🎙')}${actionButton('camera','Caméra','▣')}${actionButton('switch-camera','Retourner','↻')}${actionButton('leave','Quitter','☎','ce3-mobile-hangup')}</div>`;
    head.appendChild(bar);
  }

  function clickEngine(action){
    const source=document.querySelector(`#call-engine-v3-active [data-ce3-action="${action}"]`);
    if(source && !source.disabled) source.click();
  }

  function ensureSheet(){
    let overlay=document.querySelector('.ce3-mobile-sheet-backdrop');
    if(overlay)return overlay;
    overlay=document.createElement('div');
    overlay.className='ce3-mobile-sheet-backdrop';
    overlay.innerHTML=`<section class="ce3-mobile-sheet" role="dialog" aria-modal="true" aria-label="Options de la visio"><div class="ce3-mobile-sheet-head"><strong>Options de la visio</strong><button class="ce3-mobile-sheet-close" data-mobile-call-close aria-label="Fermer">×</button></div><div class="ce3-mobile-sheet-actions"><button data-mobile-call-action="add">Ajouter un participant</button><button data-mobile-call-action="devices">Périphériques</button><button data-mobile-call-action="screen">Partager l’écran</button><button data-mobile-call-action="minimize">Réduire</button><button data-mobile-call-action="fullscreen">Plein écran</button><button data-mobile-call-action="end" class="danger">Terminer pour tous</button></div></section>`;
    document.body.appendChild(overlay);
    return overlay;
  }

  function syncCommandbar(){
    const root=document.querySelector('#call-engine-v3-active');
    if(!root)return;
    ensureCommandbar();
    const title=root.querySelector('[data-ce3-title]')?.textContent?.trim()||'Visio';
    const count=root.querySelector('[data-ce3-count]')?.textContent?.trim()||'';
    const health=root.querySelector('[data-ce3-health]')?.textContent?.trim()||'';
    const bar=root.querySelector('.ce3-mobile-commandbar');
    if(!bar)return;
    const titleNode=bar.querySelector('.ce3-mobile-title');if(titleNode&&titleNode.textContent!==title)titleNode.textContent=title;
    const sub=bar.querySelector('.ce3-mobile-sub');const subText=[count,health].filter(Boolean).join(' · ');if(sub&&sub.textContent!==subText)sub.textContent=subText;
    for(const action of ['mic','camera']){
      const source=root.querySelector(`[data-ce3-action="${action}"]`);const target=bar.querySelector(`[data-mobile-call-action="${action}"]`);if(target&&source){target.classList.toggle('off',source.classList.contains('off'));target.disabled=source.disabled;}
    }
    const switchTarget=bar.querySelector('[data-mobile-call-action="switch-camera"]');const switchSource=root.querySelector('[data-ce3-action="switch-camera"]');if(switchTarget&&switchSource)switchTarget.disabled=switchSource.disabled;
  }

  function sourceTiles(){
    const root=document.querySelector('#call-engine-v3-active');
    if(!root)return [];
    const nodes=[...root.querySelectorAll('.ce3-main [data-ce3-tile],.ce3-grid [data-ce3-tile],.ce3-filmstrip [data-ce3-tile]')];
    const seen=new Set();
    return nodes.filter((node)=>{const key=node.dataset.ce3Tile||'';if(!key||seen.has(key))return false;seen.add(key);return true;});
  }

  function ensureStableStage(){
    const stage=document.querySelector('#call-engine-v3-active .ce3-stage');
    if(!stage)return null;
    let stable=stage.querySelector('.ce3-mobile-stable-stage');
    if(!stable){stable=document.createElement('div');stable.className='ce3-mobile-stable-stage';stage.appendChild(stable);}
    return stable;
  }

  function stableTileFrom(source){
    const key=source.dataset.ce3Tile;
    let entry=tileMap.get(key);
    if(!entry){
      const node=document.createElement('article');node.className='ce3-mobile-stable-tile';node.dataset.stableKey=key;
      const avatar=document.createElement('span');avatar.className='ce3-mobile-stable-avatar';avatar.textContent=(source.querySelector('.ce3-avatar')?.textContent||'?').trim();
      const video=document.createElement('video');video.autoplay=true;video.playsInline=true;video.muted=Boolean(source.classList.contains('self'));
      const label=document.createElement('span');label.className='ce3-mobile-stable-label';
      node.append(avatar,video,label);entry={node,video,avatar,label,stream:null};tileMap.set(key,entry);
    }
    entry.node.classList.toggle('self',source.classList.contains('self'));entry.node.classList.toggle('screen',source.classList.contains('screen'));
    const sourceVideo=source.querySelector('video');const stream=sourceVideo?.srcObject||null;
    if(entry.stream!==stream){entry.stream=stream;entry.video.srcObject=stream;if(stream)void entry.video.play().catch(()=>{});}
    const hasVideo=Boolean(stream&&stream.getVideoTracks?.().some((track)=>track.readyState==='live'&&!track.muted)&&!sourceVideo?.hidden);
    entry.node.classList.toggle('has-video',hasVideo);
    entry.video.hidden=!hasVideo;
    entry.label.textContent=(source.querySelector('.ce3-label')?.textContent||'').trim();
    return entry;
  }

  function reconcileStableStage(){
    if(!mq.matches)return;
    const stable=ensureStableStage();if(!stable)return;
    const sources=sourceTiles();
    const activeKeys=new Set();
    const entries=sources.map((source)=>{activeKeys.add(source.dataset.ce3Tile);return stableTileFrom(source);});
    for(const [key,entry] of [...tileMap]){if(!activeKeys.has(key)){entry.video.srcObject=null;entry.node.remove();tileMap.delete(key);}}
    const screens=entries.filter((entry)=>entry.node.classList.contains('screen'));
    const cameras=entries.filter((entry)=>!entry.node.classList.contains('screen'));
    const ordered=screens.length?[...screens,...cameras]:cameras;
    stable.classList.toggle('has-screen',screens.length>0);stable.classList.toggle('multi',!screens.length&&ordered.length>2);
    for(const entry of ordered)if(entry.node.parentNode!==stable||stable.lastElementChild!==entry.node)stable.appendChild(entry.node);
  }

  function sync(){
    if(!mq.matches)return;
    syncViewport();syncCommandbar();reconcileStableStage();
  }
  function schedule(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;sync();});}

  document.addEventListener('click',(event)=>{
    const more=event.target.closest?.('[data-mobile-call-more]');if(more){event.preventDefault();ensureSheet();return;}
    const close=event.target.closest?.('[data-mobile-call-close]');if(close){event.preventDefault();document.querySelector('.ce3-mobile-sheet-backdrop')?.remove();return;}
    const action=event.target.closest?.('[data-mobile-call-action]');if(action){event.preventDefault();const name=action.dataset.mobileCallAction;document.querySelector('.ce3-mobile-sheet-backdrop')?.remove();clickEngine(name);}
    if(event.target.classList?.contains('ce3-mobile-sheet-backdrop'))event.target.remove();
  },true);

  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','style']});
  window.visualViewport?.addEventListener('resize',schedule,{passive:true});
  window.visualViewport?.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
  setInterval(()=>{if(document.getElementById('call-engine-v3-active'))schedule();},600);
  schedule();
  window.__4B4C_CALL_MOBILE_V8__=Object.freeze({version:'8.0.0',stableStage:true,topCommands:true});
})();

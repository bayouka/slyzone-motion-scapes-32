(() => {
  'use strict';
  const KEYS={draft:'4b4c2.lab2.idea-studio.slice1.v1',research:'4b4c2.lab2.idea-research.slice3.v1',brief:'4b4c2.lab2.idea-brief.slice5.v1',structure:'4b4c2.lab2.idea-structure.slice6.v1',design:'4b4c2.lab2.idea-design.slice7.v1',mockups:'4b4c2.lab2.idea-mockups.slice8.v1',plan:'4b4c2.lab2.presentation-plan.slice9.v1'};
  const parse=(v)=>{try{return JSON.parse(v)}catch{return null}},clean=(v)=>String(v||'').trim();
  const button=document.getElementById('pptxButton'),captureFrame=document.getElementById('mockupCaptureFrame');

  function hslTripletToHex(value){const parts=clean(value).split(/\s+/);if(parts.length<3)return 'FFFFFF';const h=((Number(parts[0])%360)+360)%360,s=Math.max(0,Math.min(100,Number(parts[1].replace('%',''))))/100,l=Math.max(0,Math.min(100,Number(parts[2].replace('%',''))))/100;const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;let r=0,g=0,b=0;if(h<60){r=c;g=x}else if(h<120){r=x;g=c}else if(h<180){g=c;b=x}else if(h<240){g=x;b=c}else if(h<300){r=x;b=c}else{r=c;b=x}return [r,g,b].map(n=>Math.round((n+m)*255).toString(16).padStart(2,'0')).join('').toUpperCase()}
  function safeName(value){return (clean(value)||'idee').replace(/[\\/:*?"<>|]+/g,'-').replace(/\s+/g,'-').slice(0,60)}
  function readContext(){
    const draft=parse(localStorage.getItem(KEYS.draft)),research=parse(localStorage.getItem(KEYS.research))?.response||null,briefCache=parse(localStorage.getItem(KEYS.brief)),structureCache=parse(localStorage.getItem(KEYS.structure)),designCache=parse(localStorage.getItem(KEYS.design)),mockupsCache=parse(localStorage.getItem(KEYS.mockups)),planCache=parse(localStorage.getItem(KEYS.plan));
    const brief=briefCache?.response?.brief||null,structure=structureCache?.response?.structure||{},selected=(designCache?.response?.directions||[]).find(x=>x.id===designCache?.selected_direction_id)||null,mockups=mockupsCache?.response?.mockups||[],plan=planCache?.response?.plan||null;
    if(!draft?.name||!brief?.one_liner||!selected?.resolved?.palette?.tokens||!mockups.length||!plan?.slides?.length)return null;
    return {draft,research,briefCache,brief,structureCache,structure,selected,mockups,plan};
  }
  function colors(ctx){const t=ctx.selected.resolved.palette.tokens;return {bg:hslTripletToHex(t.background),surface:hslTripletToHex(t.surface),fg:hslTripletToHex(t.foreground),primary:hslTripletToHex(t.primary),accent:hslTripletToHex(t.accent),muted:hslTripletToHex(t.muted),border:hslTripletToHex(t.border),white:'FFFFFF'}}
  function font(ctx){return ctx.selected?.resolved?.typography?.label||'Aptos'}
  function keptStructure(ctx){const decisions=ctx.structureCache?.page_decisions||{};return {...ctx.structure,sitemap:(ctx.structure.sitemap||[]).filter(page=>decisions[page.id]!=='REMOVE')}}
  function hostOf(source){try{return new URL(source?.url).hostname.replace(/^www\./,'')}catch{return 'Source'}}
  function addHeader(slide,ctx,kicker,title){const c=colors(ctx),f=font(ctx);slide.background={color:c.bg};slide.addText(kicker||'',{x:.65,y:.38,w:6.8,h:.28,fontFace:f,fontSize:10,bold:true,color:c.primary,charSpacing:1.2});slide.addText(title||'',{x:.65,y:.72,w:11.8,h:.72,fontFace:f,fontSize:26,bold:true,color:c.fg,margin:0});slide.addText(ctx.draft.name,{x:.65,y:7.06,w:3,h:.2,fontFace:f,fontSize:9,color:c.fg,transparency:30,margin:0})}
  function addBulletList(slide,ctx,items,y=1.7){const c=colors(ctx),f=font(ctx);(items||[]).slice(0,8).forEach((item,index)=>{slide.addText('•',{x:.85,y:y+index*.52,w:.25,h:.28,fontFace:f,fontSize:15,bold:true,color:c.primary,margin:0});slide.addText(clean(item),{x:1.15,y:y+index*.52,w:10.8,h:.36,fontFace:f,fontSize:15,color:c.fg,margin:0,breakLine:false})})}
  function addTwoCards(slide,ctx,leftTitle,leftBody,rightTitle,rightBody){const c=colors(ctx),f=font(ctx);[[.75,leftTitle,leftBody],[6.8,rightTitle,rightBody]].forEach(([x,title,body])=>{slide.addText(title,{x,y:2,w:5.55,h:.35,fontFace:f,fontSize:15,bold:true,color:c.fg,margin:0});slide.addText(body,{x,y:2.52,w:5.55,h:2,fontFace:f,fontSize:15,color:c.fg,fill:{color:c.surface},line:{color:c.border,width:1},margin:.18,breakLine:false})})}
  function fitRect(width,height,x,y,w,h){const ratio=width/height,target=w/h;if(ratio>target){const hh=w/ratio;return {x,y:y+(h-hh)/2,w,h:hh}}const ww=h*ratio;return {x:x+(w-ww)/2,y,w:ww,h}}

  async function setupCaptureFrame(){
    if(typeof window.html2canvas!=='function')throw new Error('HTML2CANVAS_UNAVAILABLE');
    const base=new URL('./',window.location.href).href;
    const src=`<!doctype html><html><head><meta charset="utf-8"><base href="${base}"><link rel="stylesheet" href="idea-mockups.css"><style>html,body{margin:0;background:#fff;width:1360px;min-height:900px}#captureRoot{width:1320px;padding:20px}.mockup-card{width:1280px;margin:0}</style></head><body><div id="captureRoot"></div><script src="lab2-mockup-renderer.js"><\/script></body></html>`;
    await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('CAPTURE_FRAME_TIMEOUT')),12000);captureFrame.onload=()=>{clearTimeout(timer);resolve()};captureFrame.srcdoc=src});
    const win=captureFrame.contentWindow,doc=captureFrame.contentDocument;if(!win?.Lab2MockupRenderer)throw new Error('MOCKUP_RENDERER_UNAVAILABLE');
    try{await doc.fonts?.ready}catch{}
    return {win,doc,root:doc.getElementById('captureRoot')};
  }
  async function captureMockupImages(ctx,ids){
    const needed=[...new Set(ids.filter(Boolean))],out=new Map();if(!needed.length)return out;
    const frame=await setupCaptureFrame();const structure=keptStructure(ctx);
    for(const id of needed){const mockup=ctx.mockups.find(item=>item.id===id);if(!mockup)continue;frame.root.innerHTML='';frame.root.appendChild(frame.win.Lab2MockupRenderer.renderMockup({mockup,draftName:ctx.draft.name,briefOneLiner:ctx.brief.one_liner,structure,selectedDesign:ctx.selected,device:'desktop'}));await new Promise(resolve=>frame.win.requestAnimationFrame(()=>frame.win.requestAnimationFrame(resolve)));const node=frame.root.querySelector('.browser-frame');if(!node)continue;const canvas=await window.html2canvas(node,{scale:1.8,backgroundColor:'#ffffff',useCORS:true,logging:false});out.set(id,{data:canvas.toDataURL('image/png'),width:canvas.width,height:canvas.height})}
    return out;
  }

  function addCover(pptx,ctx,spec){const slide=pptx.addSlide(),c=colors(ctx),f=font(ctx);slide.background={color:c.bg};slide.addText(clean(spec?.title)||'Présentation de l’idée',{x:.75,y:.75,w:4.8,h:.3,fontFace:f,fontSize:11,bold:true,color:c.primary,charSpacing:1.4,margin:0});slide.addText(ctx.draft.name,{x:.75,y:1.35,w:7.1,h:1.05,fontFace:f,fontSize:32,bold:true,color:c.fg,margin:0});slide.addText(ctx.brief.short_pitch||ctx.brief.one_liner,{x:.75,y:2.6,w:7.1,h:1.1,fontFace:f,fontSize:19,color:c.fg,margin:0});slide.addShape(pptx.ShapeType.roundRect,{x:8.6,y:1.35,w:3.7,h:3.7,fill:{color:c.surface},line:{color:c.border,width:1.2}});[1.85,2.55,2.95,3.35].forEach((y,index)=>slide.addShape(pptx.ShapeType.rect,{x:9.05,y,w:index===1?2.2:index===3?1.9:2.8,h:index===0?.28:.16,fill:{color:index===0?c.primary:c.muted},line:{color:index===0?c.primary:c.muted}}))}
  function addProblem(pptx,ctx,spec){const s=pptx.addSlide();addHeader(s,ctx,'POURQUOI CE PROJET ?',spec.title||'Le problème à résoudre');addTwoCards(s,ctx,'Le problème',ctx.brief.problem,'Pour qui',(ctx.brief.target_users||[]).join(', ')||'Public à préciser')}
  function addConcept(pptx,ctx,spec){const s=pptx.addSlide();addHeader(s,ctx,'CONCEPT',spec.title||'Ce que le projet doit permettre');addBulletList(s,ctx,ctx.brief.core_features||[])}
  function addResearch(pptx,ctx,spec){const data=ctx.research;if(!data?.ok)return;const all=[...(data.references||[]),...(data.competitors||[])],verified=all.filter(source=>source?.fetch_status==='OBSERVED_PUBLIC'&&Array.isArray(source?.findings)&&source.findings.length>0).slice(0,4);if(!verified.length)return;const s=pptx.addSlide();addHeader(s,ctx,'RECHERCHE VÉRIFIÉE',spec.title||'Ce que nous avons observé');addBulletList(s,ctx,verified.map(source=>`${hostOf(source)} — ${source.findings[0].statement}`),1.6)}
  function addDecisions(pptx,ctx,spec){const items=ctx.briefCache?.response?.retained_improvements||[];if(!items.length)return;const s=pptx.addSlide();addHeader(s,ctx,'DÉCISIONS HUMAINES',spec.title||'Ce qui a été retenu');addBulletList(s,ctx,items.map(x=>x.text||x.title))}
  function addWorkflow(pptx,ctx,spec){const flow=ctx.structure.workflows?.[0];if(!flow)return;const s=pptx.addSlide();addHeader(s,ctx,'PARCOURS PRINCIPAL',spec.title||flow.name||'Comment cela fonctionne');addBulletList(s,ctx,flow.steps||[])}
  function addSitemap(pptx,ctx,spec){const pages=keptStructure(ctx).sitemap||[];if(!pages.length)return;const s=pptx.addSlide();addHeader(s,ctx,'ARCHITECTURE',spec.title||'Sitemap retenu');const c=colors(ctx),f=font(ctx);pages.slice(0,12).forEach((p,i)=>{const col=i%3,row=Math.floor(i/3);s.addText(p.label,{x:.75+col*4.08,y:1.65+row*1.05,w:3.6,h:.35,fontFace:f,fontSize:14,bold:true,color:c.fg,margin:0});s.addText(p.path,{x:.75+col*4.08,y:2.02+row*1.05,w:3.6,h:.24,fontFace:f,fontSize:9,color:c.primary,margin:0})})}
  function addDesign(pptx,ctx,spec){const s=pptx.addSlide();addHeader(s,ctx,'DIRECTION ARTISTIQUE',spec.title||ctx.selected.name);const c=colors(ctx),f=font(ctx);[c.primary,c.accent,c.bg,c.fg].forEach((value,i)=>s.addShape(pptx.ShapeType.roundRect,{x:.85+i*1.35,y:1.72,w:1.05,h:1.05,fill:{color:value},line:{color:c.border,width:.8}}));s.addText((ctx.selected.perception||[]).join(' · '),{x:.85,y:3.15,w:5.3,h:.4,fontFace:f,fontSize:17,bold:true,color:c.fg,margin:0});s.addText(ctx.selected.rationale||'',{x:.85,y:3.75,w:10.8,h:1.2,fontFace:f,fontSize:15,color:c.fg,margin:0})}
  function addMockup(pptx,ctx,spec,captures){const mockup=ctx.mockups.find(item=>item.id===spec.mockup_id);if(!mockup)return;const s=pptx.addSlide();addHeader(s,ctx,'MAQUETTE',spec.title||`${mockup.label} · ${mockup.path}`);const c=colors(ctx),capture=captures.get(mockup.id);s.addShape(pptx.ShapeType.roundRect,{x:.72,y:1.5,w:11.9,h:5.35,fill:{color:c.surface},line:{color:c.border,width:1}});if(capture){const fit=fitRect(capture.width,capture.height,.82,1.6,11.7,5.15);s.addImage({data:capture.data,...fit})}else{s.addText('Capture HTML indisponible — la maquette reste consultable dans 4b4c2.',{x:1.1,y:3.7,w:11.1,h:.6,fontFace:font(ctx),fontSize:16,color:c.fg,align:'center',margin:0})}}
  function addQuestions(pptx,ctx,spec){if(!ctx.brief.open_questions?.length)return;const s=pptx.addSlide();addHeader(s,ctx,'À DÉCIDER',spec.title||'Questions encore ouvertes');addBulletList(s,ctx,ctx.brief.open_questions)}
  function addNextSteps(pptx,ctx,spec){const s=pptx.addSlide();addHeader(s,ctx,'ÉTAT ACTUEL',spec.title||'Une idée désormais compréhensible et visualisable');addTwoCards(s,ctx,'Ce qui est prêt','Concept, décisions, workflows, sitemap, direction visuelle et maquettes principales.','Prochaine étape','Partager cette version avec les autres membres puis décider ensemble si le projet doit être lancé.')}

  async function exportPptx(){
    const ctx=readContext();if(!ctx){alert('Prépare d’abord le plan de présentation.');return}if(typeof window.PptxGenJS!=='function'){alert('Le moteur PowerPoint n’a pas pu être chargé.');return}
    button.disabled=true;const original=button.textContent;button.textContent='Capture des maquettes…';
    try{
      const mockupIds=ctx.plan.slides.filter(x=>x.type==='MOCKUP').map(x=>x.mockup_id);let captures=new Map();
      try{captures=await captureMockupImages(ctx,mockupIds)}catch(error){console.warn('mockup capture fallback',error)}
      button.textContent='Création du PowerPoint…';
      const pptx=new window.PptxGenJS();pptx.layout='LAYOUT_WIDE';pptx.author='4b4c2 Idea Lab';pptx.subject=`Présentation de l’idée ${ctx.draft.name}`;pptx.title=ctx.draft.name;pptx.company='4b4c2';pptx.lang='fr-FR';pptx.theme={headFontFace:font(ctx),bodyFontFace:font(ctx),lang:'fr-FR'};
      for(const spec of ctx.plan.slides){if(spec.type==='COVER')addCover(pptx,ctx,spec);else if(spec.type==='PROBLEM')addProblem(pptx,ctx,spec);else if(spec.type==='CONCEPT')addConcept(pptx,ctx,spec);else if(spec.type==='RESEARCH')addResearch(pptx,ctx,spec);else if(spec.type==='DECISIONS')addDecisions(pptx,ctx,spec);else if(spec.type==='WORKFLOW')addWorkflow(pptx,ctx,spec);else if(spec.type==='SITEMAP')addSitemap(pptx,ctx,spec);else if(spec.type==='DESIGN')addDesign(pptx,ctx,spec);else if(spec.type==='MOCKUP')addMockup(pptx,ctx,spec,captures);else if(spec.type==='OPEN_QUESTIONS')addQuestions(pptx,ctx,spec);else if(spec.type==='NEXT_STEPS')addNextSteps(pptx,ctx,spec)}
      await pptx.writeFile({fileName:`${safeName(ctx.draft.name)}-presentation.pptx`,compression:true});
    }catch(error){console.error(error);alert('Impossible de générer le PowerPoint dans ce navigateur.');}
    finally{button.disabled=false;button.textContent=original;}
  }
  button?.addEventListener('click',()=>void exportPptx());
})();
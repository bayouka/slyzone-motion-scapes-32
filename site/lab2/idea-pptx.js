(() => {
  'use strict';

  const KEYS={draft:'4b4c2.lab2.idea-studio.slice1.v1',research:'4b4c2.lab2.idea-research.slice3.v1',brief:'4b4c2.lab2.idea-brief.slice5.v1',structure:'4b4c2.lab2.idea-structure.slice6.v1',design:'4b4c2.lab2.idea-design.slice7.v1',mockups:'4b4c2.lab2.idea-mockups.slice8.v1'};
  const parse=(v)=>{try{return JSON.parse(v)}catch{return null}};
  const clean=(v)=>String(v||'').trim();
  const button=document.getElementById('pptxButton');

  function hslTripletToHex(value){
    const parts=clean(value).split(/\s+/);if(parts.length<3)return 'FFFFFF';
    const h=((Number(parts[0])%360)+360)%360,s=Math.max(0,Math.min(100,Number(parts[1].replace('%',''))))/100,l=Math.max(0,Math.min(100,Number(parts[2].replace('%',''))))/100;
    const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;let r=0,g=0,b=0;
    if(h<60){r=c;g=x}else if(h<120){r=x;g=c}else if(h<180){g=c;b=x}else if(h<240){g=x;b=c}else if(h<300){r=x;b=c}else{r=c;b=x}
    return [r,g,b].map(n=>Math.round((n+m)*255).toString(16).padStart(2,'0')).join('').toUpperCase();
  }
  function safeName(value){return (clean(value)||'idee').replace(/[\\/:*?"<>|]+/g,'-').replace(/\s+/g,'-').slice(0,60)}
  function readContext(){
    const draft=parse(localStorage.getItem(KEYS.draft));
    const research=parse(localStorage.getItem(KEYS.research))?.response||null;
    const briefCache=parse(localStorage.getItem(KEYS.brief));
    const structureCache=parse(localStorage.getItem(KEYS.structure));
    const designCache=parse(localStorage.getItem(KEYS.design));
    const mockupsCache=parse(localStorage.getItem(KEYS.mockups));
    const brief=briefCache?.response?.brief||null,structure=structureCache?.response?.structure||{};
    const selected=(designCache?.response?.directions||[]).find(x=>x.id===designCache?.selected_direction_id)||null;
    const mockups=mockupsCache?.response?.mockups||[];
    if(!draft?.name||!brief?.one_liner||!selected?.resolved?.palette?.tokens||!mockups.length)return null;
    return {draft,research,briefCache,brief,structureCache,structure,selected,mockups};
  }
  function colors(ctx){const t=ctx.selected.resolved.palette.tokens;return {bg:hslTripletToHex(t.background),surface:hslTripletToHex(t.surface),fg:hslTripletToHex(t.foreground),primary:hslTripletToHex(t.primary),accent:hslTripletToHex(t.accent),muted:hslTripletToHex(t.muted),border:hslTripletToHex(t.border),white:'FFFFFF'}}
  function font(ctx){return ctx.selected?.resolved?.typography?.label||'Aptos'}
  function addHeader(slide,ctx,kicker,title){const c=colors(ctx),f=font(ctx);slide.background={color:c.bg};slide.addText(kicker||'',{x:.65,y:.38,w:6.8,h:.28,fontFace:f,fontSize:10,bold:true,color:c.primary,charSpacing:1.2});slide.addText(title||'',{x:.65,y:.72,w:11.8,h:.72,fontFace:f,fontSize:26,bold:true,color:c.fg,margin:0});slide.addText(ctx.draft.name,{x:.65,y:7.06,w:3,h:.2,fontFace:f,fontSize:9,color:c.fg,transparency:30,margin:0})}
  function addBulletList(slide,ctx,items,y=1.7){const c=colors(ctx),f=font(ctx);(items||[]).slice(0,8).forEach((item,index)=>{slide.addText('•',{x:.85,y:y+index*.52,w:.25,h:.28,fontFace:f,fontSize:15,bold:true,color:c.primary,margin:0});slide.addText(clean(item),{x:1.15,y:y+index*.52,w:10.8,h:.36,fontFace:f,fontSize:15,color:c.fg,margin:0,breakLine:false})})}
  function addTwoCards(slide,ctx,leftTitle,leftBody,rightTitle,rightBody){const c=colors(ctx),f=font(ctx);[[.75,leftTitle,leftBody],[6.8,rightTitle,rightBody]].forEach(([x,title,body])=>{slide.addText(title,{x,y:2,w:5.55,h:.35,fontFace:f,fontSize:15,bold:true,color:c.fg,margin:0});slide.addText(body,{x,y:2.52,w:5.55,h:2,fontFace:f,fontSize:15,color:c.fg,fill:{color:c.surface},line:{color:c.border,width:1},margin:.18,breakLine:false})})}
  function keptPages(ctx){const decisions=ctx.structureCache?.page_decisions||{};return (ctx.structure.sitemap||[]).filter(p=>decisions[p.id]!=='REMOVE')}
  function hostOf(source){try{return new URL(source?.url).hostname.replace(/^www\./,'')}catch{return 'Source'}}

  function cover(pptx,ctx){const slide=pptx.addSlide();const c=colors(ctx),f=font(ctx);slide.background={color:c.bg};slide.addText('PRÉSENTATION DE L’IDÉE',{x:.75,y:.75,w:4,h:.3,fontFace:f,fontSize:11,bold:true,color:c.primary,charSpacing:1.4,margin:0});slide.addText(ctx.draft.name,{x:.75,y:1.35,w:7.1,h:1.05,fontFace:f,fontSize:32,bold:true,color:c.fg,margin:0});slide.addText(ctx.brief.short_pitch||ctx.brief.one_liner,{x:.75,y:2.6,w:7.1,h:1.1,fontFace:f,fontSize:19,color:c.fg,margin:0});slide.addShape(pptx.ShapeType.roundRect,{x:8.6,y:1.35,w:3.7,h:3.7,rectRadius:.1,fill:{color:c.surface},line:{color:c.border,width:1.2}});slide.addShape(pptx.ShapeType.rect,{x:9.05,y:1.85,w:2.8,h:.28,fill:{color:c.primary},line:{color:c.primary}});slide.addShape(pptx.ShapeType.rect,{x:9.05,y:2.55,w:2.2,h:.16,fill:{color:c.muted},line:{color:c.muted}});slide.addShape(pptx.ShapeType.rect,{x:9.05,y:2.95,w:2.55,h:.16,fill:{color:c.muted},line:{color:c.muted}});slide.addShape(pptx.ShapeType.rect,{x:9.05,y:3.35,w:1.9,h:.16,fill:{color:c.muted},line:{color:c.muted}})}
  function addResearchSlide(pptx,ctx){
    const data=ctx.research;if(!data?.ok)return;
    const refs=Array.isArray(data.references)?data.references:[];
    const competitors=Array.isArray(data.competitors)?data.competitors:[];
    const all=[...refs,...competitors];
    const verified=all.filter(source=>source?.fetch_status==='OBSERVED_PUBLIC'&&Array.isArray(source?.findings)&&source.findings.length>0).slice(0,3);
    const declaredOnly=refs.filter(source=>!verified.includes(source)).slice(0,2);
    const limitations=(data.limitations||[]).filter(Boolean);
    if(!verified.length&&!declaredOnly.length&&!limitations.length)return;
    const s=pptx.addSlide();addHeader(s,ctx,'RÉFÉRENCES ET CONCURRENCE',verified.length?'Ce que nous avons pu vérifier':'Ce que la recherche permet d’affirmer');
    const lines=[];
    verified.forEach(source=>lines.push(`${hostOf(source)} — ${source.findings[0].statement} [fait public vérifié]`));
    declaredOnly.forEach(source=>lines.push(`${hostOf(source)} — référence fournie par l’utilisateur, non vérifiée automatiquement.`));
    if(!verified.length&&limitations[0])lines.push(`Limite : ${limitations[0]}`);
    if(verified.length&&data.cross_patterns?.length)lines.push(...data.cross_patterns.slice(0,2).map(x=>`Synthèse : ${x.statement||x}`));
    addBulletList(s,ctx,lines,1.65);
  }
  function standardSlides(pptx,ctx){
    let s=pptx.addSlide();addHeader(s,ctx,'POURQUOI CE PROJET ?','Le problème à résoudre');addTwoCards(s,ctx,'Le problème',ctx.brief.problem,'Pour qui',(ctx.brief.target_users||[]).join(', ')||'Public à préciser');
    s=pptx.addSlide();addHeader(s,ctx,'SOLUTION RETENUE','Ce que le site doit permettre');addBulletList(s,ctx,ctx.brief.core_features||[]);
    addResearchSlide(pptx,ctx);
    const retained=ctx.briefCache?.response?.retained_improvements||[];if(retained.length){s=pptx.addSlide();addHeader(s,ctx,'DÉCISIONS HUMAINES','Améliorations retenues');addBulletList(s,ctx,retained.map(x=>x.text||x.title));}
    const flow=ctx.structure.workflows?.[0];if(flow){s=pptx.addSlide();addHeader(s,ctx,'PARCOURS PRINCIPAL',flow.name||'Comment cela fonctionne');addBulletList(s,ctx,flow.steps||[]);}
    const pages=keptPages(ctx);if(pages.length){s=pptx.addSlide();addHeader(s,ctx,'ARCHITECTURE PROVISOIRE','Sitemap retenu');const c=colors(ctx),f=font(ctx);pages.slice(0,12).forEach((p,i)=>{const col=i%3,row=Math.floor(i/3);s.addText(p.label,{x:.75+col*4.08,y:1.65+row*1.05,w:3.6,h:.35,fontFace:f,fontSize:14,bold:true,color:c.fg,margin:0});s.addText(p.path,{x:.75+col*4.08,y:2.02+row*1.05,w:3.6,h:.24,fontFace:f,fontSize:9,color:c.primary,margin:0})});}
    s=pptx.addSlide();addHeader(s,ctx,'DIRECTION ARTISTIQUE',ctx.selected.name);const c=colors(ctx),f=font(ctx);[c.primary,c.accent,c.bg,c.fg].forEach((value,i)=>s.addShape(pptx.ShapeType.roundRect,{x:.85+i*1.35,y:1.72,w:1.05,h:1.05,fill:{color:value},line:{color:c.border,width:.8}}));s.addText((ctx.selected.perception||[]).join(' · '),{x:.85,y:3.15,w:5.3,h:.4,fontFace:f,fontSize:17,bold:true,color:c.fg,margin:0});s.addText(ctx.selected.rationale||'',{x:.85,y:3.75,w:10.8,h:1.2,fontFace:f,fontSize:15,color:c.fg,margin:0});
  }
  function mockupSlides(pptx,ctx){const c=colors(ctx),f=font(ctx);ctx.mockups.slice(0,6).forEach(mock=>{const s=pptx.addSlide();addHeader(s,ctx,'MAQUETTE',`${mock.label} · ${mock.path}`);s.addShape(pptx.ShapeType.roundRect,{x:.75,y:1.55,w:11.85,h:4.95,fill:{color:c.surface},line:{color:c.border,width:1.2}});s.addText(ctx.draft.name,{x:1.08,y:1.82,w:2.5,h:.28,fontFace:f,fontSize:12,bold:true,color:c.fg,margin:0});let y=2.35;(mock.blocks||[]).slice(0,5).forEach((block,index)=>{const h=index===0?1.0:.62;s.addShape(pptx.ShapeType.roundRect,{x:1.05,y,w:11.1,h,fill:{color:index===0?c.muted:c.bg},line:{color:c.border,width:.6}});if(block.title)s.addText(block.title,{x:1.28,y:y+.12,w:6.9,h:.26,fontFace:f,fontSize:index===0?16:12,bold:true,color:c.fg,margin:0});if(block.body)s.addText(block.body,{x:1.28,y:y+.42,w:8.9,h:.3,fontFace:f,fontSize:9,color:c.fg,margin:0});y+=h+.18;});});}
  function endSlides(pptx,ctx){if(ctx.brief.open_questions?.length){const s=pptx.addSlide();addHeader(s,ctx,'À DÉCIDER','Questions encore ouvertes');addBulletList(s,ctx,ctx.brief.open_questions);}const s=pptx.addSlide();addHeader(s,ctx,'ÉTAT ACTUEL','Une idée désormais compréhensible et visualisable');addTwoCards(s,ctx,'Ce qui est prêt','Concept, décisions, workflows, sitemap, direction visuelle et maquettes principales.','Prochaine étape','Partager cette version avec les autres membres puis décider ensemble si le projet doit être lancé.');}

  async function exportPptx(){
    const ctx=readContext();if(!ctx){alert('La présentation n’est pas encore complète.');return}
    if(typeof window.PptxGenJS!=='function'){alert('Le moteur PowerPoint n’a pas pu être chargé.');return}
    button.disabled=true;const original=button.textContent;button.textContent='Création du PowerPoint…';
    try{const pptx=new window.PptxGenJS();pptx.layout='LAYOUT_WIDE';pptx.author='4b4c2 Idea Lab';pptx.subject=`Présentation de l’idée ${ctx.draft.name}`;pptx.title=ctx.draft.name;pptx.company='4b4c2';pptx.lang='fr-FR';pptx.theme={headFontFace:font(ctx),bodyFontFace:font(ctx),lang:'fr-FR'};cover(pptx,ctx);standardSlides(pptx,ctx);mockupSlides(pptx,ctx);endSlides(pptx,ctx);await pptx.writeFile({fileName:`${safeName(ctx.draft.name)}-presentation.pptx`,compression:true});}
    catch(error){console.error(error);alert('Impossible de générer le PowerPoint dans ce navigateur.');}
    finally{button.disabled=false;button.textContent=original;}
  }

  button?.addEventListener('click',()=>void exportPptx());
})();
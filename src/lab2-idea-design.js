const LAB2_MODEL='@cf/google/gemma-4-26b-a4b-it';
const CONTRACT_VERSION='lab2-design-v1';
const MAX_BODY_BYTES=24000;
const MAX_DIRECTIONS=3;

const MOODS=['MODERN','WARM','PREMIUM','MINIMAL','PLAYFUL','PROFESSIONAL','TECH','REASSURING'];
const COLOR_PREFERENCES=['AUTO','BLUE','CYAN','GREEN','PURPLE','WARM','NEUTRAL'];
const PALETTES=Object.freeze({
  OCEAN:{label:'Océan clair',tokens:{background:'210 40% 98%',surface:'0 0% 100%',foreground:'222 47% 11%',primary:'211 92% 48%',primary_foreground:'0 0% 100%',accent:'188 86% 42%',muted:'210 35% 94%',border:'214 28% 88%'}},
  CYAN_MINT:{label:'Cyan menthe',tokens:{background:'180 30% 98%',surface:'0 0% 100%',foreground:'184 42% 12%',primary:'187 82% 38%',primary_foreground:'0 0% 100%',accent:'158 62% 45%',muted:'176 28% 93%',border:'180 22% 86%'}},
  SAGE:{label:'Sauge rassurante',tokens:{background:'45 35% 97%',surface:'48 50% 99%',foreground:'145 24% 14%',primary:'151 36% 34%',primary_foreground:'0 0% 100%',accent:'83 35% 52%',muted:'70 24% 92%',border:'75 18% 84%'}},
  VIOLET:{label:'Violet moderne',tokens:{background:'245 38% 98%',surface:'0 0% 100%',foreground:'248 35% 13%',primary:'252 72% 56%',primary_foreground:'0 0% 100%',accent:'281 66% 58%',muted:'248 28% 94%',border:'247 20% 87%'}},
  TERRACOTTA:{label:'Terracotta chaleureuse',tokens:{background:'34 55% 97%',surface:'35 60% 99%',foreground:'20 30% 15%',primary:'18 67% 48%',primary_foreground:'0 0% 100%',accent:'38 82% 55%',muted:'32 35% 92%',border:'28 25% 84%'}},
  GRAPHITE:{label:'Graphite premium',tokens:{background:'210 20% 98%',surface:'0 0% 100%',foreground:'222 22% 10%',primary:'222 24% 16%',primary_foreground:'0 0% 100%',accent:'217 88% 55%',muted:'215 20% 94%',border:'216 16% 86%'}}
});
const TYPOGRAPHY=Object.freeze({
  INTER:{label:'Inter',heading:'Inter, system-ui, sans-serif',body:'Inter, system-ui, sans-serif'},
  MANROPE:{label:'Manrope',heading:'Manrope, system-ui, sans-serif',body:'Inter, system-ui, sans-serif'},
  DM_SANS:{label:'DM Sans',heading:'DM Sans, system-ui, sans-serif',body:'DM Sans, system-ui, sans-serif'},
  SOURCE_SANS:{label:'Source Sans 3',heading:'Source Sans 3, system-ui, sans-serif',body:'Source Sans 3, system-ui, sans-serif'}
});
const SHAPES=Object.freeze({SOFT:{radius:'18px',shadow:'0 14px 36px hsl(220 25% 20% / .08)'},CRISP:{radius:'10px',shadow:'0 8px 24px hsl(220 25% 20% / .07)'},ROUND:{radius:'26px',shadow:'0 16px 42px hsl(220 25% 20% / .09)'}});
const DENSITIES=Object.freeze({AIRY:{section_gap:'72px',card_padding:'28px'},BALANCED:{section_gap:'52px',card_padding:'22px'},COMPACT:{section_gap:'36px',card_padding:'18px'}});
const IMAGERY=['PHOTO_HUMAN','PHOTO_PRODUCT','ILLUSTRATION_LIGHT','UI_FIRST','MINIMAL'];
const MOTION=['CALM','STANDARD','LIVELY'];

class Lab2DesignError extends Error{constructor(status,code){super(code);this.status=status;this.code=code}}
function json(data,status=200){return Response.json(data,{status,headers:{'cache-control':'no-store','content-type':'application/json; charset=utf-8'}})}
function enabled(v){return v===true||['1','true','on','yes'].includes(String(v||'').toLowerCase())}
function safeArray(v){return Array.isArray(v)?v:[]}
function cleanText(v,max=1000){return String(v??'').trim().replace(/\s+/g,' ').slice(0,max)}
function allowedUserIds(env){const raw=String(env?.LAB2_ALLOWED_USER_IDS||'').trim();if(!raw)return null;const ids=new Set(raw.split(',').map(v=>v.trim().toLowerCase()).filter(Boolean));return ids.size?ids:null}
async function authenticate(env,request){const h=request.headers.get('authorization')||'';if(!h.startsWith('Bearer '))return null;const token=h.slice(7).trim();if(!token||!env.SUPABASE_URL||!env.SUPABASE_PUBLISHABLE_KEY)return null;const r=await fetch(`${env.SUPABASE_URL}/auth/v1/user`,{headers:{apikey:env.SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${token}`}});if(!r.ok)return null;const u=await r.json().catch(()=>null);return u?.id?{id:String(u.id)}:null}
function normalizeBrief(v){if(!v||typeof v!=='object')return null;return {one_liner:cleanText(v.one_liner,320),problem:cleanText(v.problem,900),target_users:safeArray(v.target_users).slice(0,4).map(x=>cleanText(x,180)).filter(Boolean),solution:cleanText(v.solution,1200),core_features:safeArray(v.core_features).slice(0,10).map(x=>cleanText(x,260)).filter(Boolean),differentiators:safeArray(v.differentiators).slice(0,6).map(x=>cleanText(x,280)).filter(Boolean)}}
function normalizeStructure(v){if(!v||typeof v!=='object')return {pages:[]};const pages=safeArray(v.sitemap).slice(0,20).map(x=>({id:cleanText(x?.id,50),path:cleanText(x?.path,120),label:cleanText(x?.label,100),kind:cleanText(x?.kind,20)})).filter(x=>x.path);return {pages}}
function normalizeInput(body){
  if(!body||typeof body!=='object'||Array.isArray(body))throw new Lab2DesignError(400,'INVALID_REQUEST');
  const name=cleanText(body.name,100),brief=normalizeBrief(body.brief),structure=normalizeStructure(body.structure);
  if(!name||!brief?.one_liner||!brief?.solution)throw new Lab2DesignError(400,'BRIEF_REQUIRED');
  const preferences=body.preferences&&typeof body.preferences==='object'?body.preferences:{};
  const moods=[...new Set(safeArray(preferences.moods).map(x=>cleanText(x,30).toUpperCase()).filter(x=>MOODS.includes(x)))].slice(0,3);
  const color=COLOR_PREFERENCES.includes(cleanText(preferences.color,20).toUpperCase())?cleanText(preferences.color,20).toUpperCase():'AUTO';
  const avoid_colors=cleanText(preferences.avoid_colors,120);
  const reference_note=cleanText(preferences.reference_note,360);
  return {name,brief,structure,preferences:{moods,color,avoid_colors,reference_note}};
}
function schema(){return {type:'object',additionalProperties:false,properties:{directions:{type:'array',minItems:MAX_DIRECTIONS,maxItems:MAX_DIRECTIONS,items:{type:'object',additionalProperties:false,properties:{name:{type:'string',maxLength:80},palette_id:{type:'string',enum:Object.keys(PALETTES)},typography_id:{type:'string',enum:Object.keys(TYPOGRAPHY)},shape_id:{type:'string',enum:Object.keys(SHAPES)},density_id:{type:'string',enum:Object.keys(DENSITIES)},imagery:{type:'string',enum:IMAGERY},motion:{type:'string',enum:MOTION},perception:{type:'array',maxItems:3,items:{type:'string',maxLength:50}},rationale:{type:'string',maxLength:420},dos:{type:'array',maxItems:4,items:{type:'string',maxLength:180}},donts:{type:'array',maxItems:4,items:{type:'string',maxLength:180}}},required:['name','palette_id','typography_id','shape_id','density_id','imagery','motion','perception','rationale','dos','donts']}}},required:['directions']}}
function parseAi(raw){let p=raw?.response??raw;if(typeof p==='string'){try{p=JSON.parse(p)}catch{throw new Lab2DesignError(502,'AI_OUTPUT_INVALID')}}if(!p||typeof p!=='object'||Array.isArray(p))throw new Lab2DesignError(502,'AI_OUTPUT_INVALID');return p}
function usage(raw){const u=raw?.usage||raw?.meta?.usage||raw?.result?.usage||null;const i=Number(u?.prompt_tokens??u?.input_tokens??0),o=Number(u?.completion_tokens??u?.output_tokens??0);if(!Number.isFinite(i)||!Number.isFinite(o)||(!i&&!o))return null;return {prompt_tokens:Math.round(i),completion_tokens:Math.round(o),total_tokens:Math.round(i+o)}}
function resolveDirection(value,index){const palette=PALETTES[value?.palette_id],typography=TYPOGRAPHY[value?.typography_id],shape=SHAPES[value?.shape_id],density=DENSITIES[value?.density_id];if(!palette||!typography||!shape||!density)return null;return {id:`d${index+1}`,name:cleanText(value?.name,80)||`Direction ${index+1}`,palette_id:value.palette_id,typography_id:value.typography_id,shape_id:value.shape_id,density_id:value.density_id,imagery:IMAGERY.includes(value?.imagery)?value.imagery:'MINIMAL',motion:MOTION.includes(value?.motion)?value.motion:'STANDARD',perception:safeArray(value?.perception).slice(0,3).map(x=>cleanText(x,50)).filter(Boolean),rationale:cleanText(value?.rationale,420),dos:safeArray(value?.dos).slice(0,4).map(x=>cleanText(x,180)).filter(Boolean),donts:safeArray(value?.donts).slice(0,4).map(x=>cleanText(x,180)).filter(Boolean),resolved:{palette,typography,shape,density}}}

export async function handleLab2IdeaDesign(request,env){
  if(!enabled(env?.LAB2_IDEA_STUDIO_ENABLED)||!enabled(env?.LAB2_DESIGN_ENABLED))return json({ok:false,error:'LAB_DESIGN_DISABLED'},404);
  if(request.method!=='POST')return json({ok:false,error:'METHOD_NOT_ALLOWED'},405);
  if(Number(request.headers.get('content-length')||0)>MAX_BODY_BYTES)return json({ok:false,error:'INVALID_REQUEST'},400);
  if(!env?.AI)return json({ok:false,error:'AI_UNAVAILABLE'},503);
  const allowlist=allowedUserIds(env);if(!allowlist)return json({ok:false,error:'LAB_ACCESS_UNCONFIGURED'},503);
  const auth=await authenticate(env,request);if(!auth)return json({ok:false,error:'UNAUTHORIZED'},401);if(!allowlist.has(auth.id.toLowerCase()))return json({ok:false,error:'LAB_ACCESS_DENIED'},403);
  let body;try{body=await request.json()}catch{return json({ok:false,error:'INVALID_REQUEST'},400)}let input;try{input=normalizeInput(body)}catch(e){return json({ok:false,error:e.code||'INVALID_REQUEST'},e.status||400)}
  const catalog=`Palettes: ${Object.keys(PALETTES).join(', ')}. Typographies: ${Object.keys(TYPOGRAPHY).join(', ')}. Formes: ${Object.keys(SHAPES).join(', ')}. Densités: ${Object.keys(DENSITIES).join(', ')}. Imagerie: ${IMAGERY.join(', ')}. Motion: ${MOTION.join(', ')}.`;
  let raw;try{raw=await env.AI.run(LAB2_MODEL,{messages:[{role:'system',content:'Tu proposes exactement 3 directions visuelles distinctes et cohérentes pour un site/web-app destiné à un utilisateur novice. Tu dois choisir UNIQUEMENT des identifiants présents dans le catalogue fourni ; les couleurs, typographies, rayons et espacements seront résolus ensuite par le serveur. Tu ne copies jamais l’identité visuelle d’une marque ou d’un site de référence. Un éventuel commentaire de référence exprime seulement une préférence humaine. Tu respectes les couleurs à éviter. Tu privilégies lisibilité, cohérence, accessibilité et faisabilité dans un moteur de composants déterministe. Les 3 options doivent être suffisamment différentes pour qu’un novice puisse choisir. Réponds strictement selon le schéma JSON.'},{role:'user',content:`Projet: ${input.name}\nConcept: ${input.brief.one_liner}\nUtilisateurs: ${input.brief.target_users.join(', ')||'non précisés'}\nSolution: ${input.brief.solution}\nFonctionnalités: ${input.brief.core_features.join(' | ')||'aucune'}\nDifférenciation: ${input.brief.differentiators.join(' | ')||'aucune'}\nPages gardées/proposées: ${input.structure.pages.map(x=>`${x.label} (${x.path})`).join(' | ')||'non précisées'}\nAmbiances souhaitées: ${input.preferences.moods.join(', ')||'aucune préférence'}\nCouleur souhaitée: ${input.preferences.color}\nCouleurs à éviter: ${input.preferences.avoid_colors||'aucune'}\nCommentaire de référence visuelle: ${input.preferences.reference_note||'aucun'}\n\nCATALOGUE AUTORISÉ:\n${catalog}`}],response_format:{type:'json_schema',json_schema:schema()},temperature:0.35,max_completion_tokens:1900,chat_template_kwargs:{enable_thinking:false}})}catch(e){const m=String(e?.message||e||'');return json({ok:false,error:/quota|limit|capacity|neuron|rate/i.test(m)?'AI_CAPACITY':'AI_ERROR'},/quota|limit|capacity|neuron|rate/i.test(m)?429:502)}
  let payload;try{payload=parseAi(raw)}catch(e){return json({ok:false,error:e.code||'AI_OUTPUT_INVALID'},e.status||502)}
  const directions=safeArray(payload.directions).slice(0,MAX_DIRECTIONS).map(resolveDirection).filter(Boolean);if(directions.length!==MAX_DIRECTIONS)return json({ok:false,error:'AI_OUTPUT_INCOMPLETE'},502);
  return json({ok:true,contract_version:CONTRACT_VERSION,model:LAB2_MODEL,user_id:auth.id,directions,usage:usage(raw),catalog_version:'lab2-design-catalog-v1',quality:{usable:true,direction_count:directions.length},guarantees:{single_ai_call:true,catalog_only_tokens:true,no_competitor_style_copy:true,human_direction_selection_required:true,deterministic_tokens_for_mockups:true,exactly_three_directions:true,max_directions:MAX_DIRECTIONS}});
}
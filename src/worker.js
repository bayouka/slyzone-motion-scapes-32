const SECURITY_HEADERS = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-frame-options': 'DENY',
  'permissions-policy': 'camera=(self), microphone=(self), display-capture=(self), fullscreen=(self), picture-in-picture=(self)',
};

const AI_MODEL = '@cf/google/gemma-4-26b-a4b-it';
const IDEA_AI_ACTIONS = new Set(['understand','questions','improve','challenge','synthesize','presentation','presenter']);

function withHeaders(response, extra = {}) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) headers.set(key, value);
  for (const [key, value] of Object.entries(extra)) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function json(data,status=200){
  return withHeaders(Response.json(data,{status}),{'cache-control':'no-store'});
}

async function supabaseGet(env,path,token){
  const response=await fetch(`${env.SUPABASE_URL}${path}`,{headers:{apikey:env.SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${token}`}});
  if(!response.ok) throw new Error(`SUPABASE_${response.status}`);
  return response.json();
}

async function authenticate(env,request){
  const auth=request.headers.get('authorization')||'';
  if(!auth.startsWith('Bearer ')) return null;
  const token=auth.slice(7);
  const response=await fetch(`${env.SUPABASE_URL}/auth/v1/user`,{headers:{apikey:env.SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${token}`}});
  if(!response.ok) return null;
  const user=await response.json();
  return user?.id?{user,token}:null;
}

function schemas(action){
  const base={type:'object',additionalProperties:false};
  if(action==='understand') return {...base,properties:{title:{type:'string'},one_liner:{type:'string'},understanding:{type:'string'},problem:{type:'string'},audience:{type:'string'},proposal:{type:'string'},uncertainties:{type:'array',items:{type:'string'},maxItems:4}},required:['title','one_liner','understanding','problem','audience','proposal','uncertainties']};
  if(action==='questions') return {...base,properties:{questions:{type:'array',minItems:1,maxItems:3,items:{type:'object',additionalProperties:false,properties:{question:{type:'string'},why_it_matters:{type:'string'},priority:{type:'string',enum:['critical','useful']}},required:['question','why_it_matters','priority']}}},required:['questions']};
  if(action==='improve') return {...base,properties:{suggestions:{type:'array',minItems:1,maxItems:5,items:{type:'object',additionalProperties:false,properties:{type:{type:'string',enum:['simplify','improve','differentiate','realism','opportunity']},title:{type:'string'},reason:{type:'string'},proposal:{type:'string'}},required:['type','title','reason','proposal']}}},required:['suggestions']};
  if(action==='challenge') return {...base,properties:{issues:{type:'array',minItems:1,maxItems:5,items:{type:'object',additionalProperties:false,properties:{severity:{type:'string',enum:['critical','verify','improve']},title:{type:'string'},reason:{type:'string'},next_step:{type:'string'}},required:['severity','title','reason','next_step']}}},required:['issues']};
  if(action==='synthesize') return {...base,properties:{title:{type:'string'},one_liner:{type:'string'},problem:{type:'string'},audience:{type:'string'},proposal:{type:'string'},value:{type:'string'},differentiation:{type:'string'},evidence:{type:'array',items:{type:'string'},maxItems:3},hypotheses:{type:'array',items:{type:'string'},maxItems:3},risks:{type:'array',items:{type:'string'},maxItems:3},decision_needed:{type:'string'}},required:['title','one_liner','problem','audience','proposal','value','differentiation','evidence','hypotheses','risks','decision_needed']};
  if(action==='presentation') return {...base,properties:{slides:{type:'array',minItems:6,maxItems:6,items:{type:'object',additionalProperties:false,properties:{number:{type:'integer'},title:{type:'string'},headline:{type:'string'},bullets:{type:'array',items:{type:'string'},maxItems:4},speaker_note:{type:'string'}},required:['number','title','headline','bullets','speaker_note']}},decision_question:{type:'string'}},required:['slides','decision_question']};
  return {...base,properties:{opening:{type:'string'},slide_notes:{type:'array',maxItems:6,items:{type:'string'}},objections:{type:'array',minItems:1,maxItems:3,items:{type:'object',additionalProperties:false,properties:{question:{type:'string'},answer:{type:'string'},unknown:{type:'boolean'}},required:['question','answer','unknown']}},closing:{type:'string'}},required:['opening','slide_notes','objections','closing']};
}

function systemPrompt(action){
  const common='Tu es le facilitateur senior de maturation d idées de 4b4c. Réponds en français, concret, sobre, utile. N invente pas de preuves. Distingue faits, hypothèses et inconnues. Ne transforme jamais une idée en plan de projet prématurément. Priorise la clarté, la valeur utilisateur, la simplicité, la faisabilité et la qualité de décision de l équipe.';
  const task={
    understand:'Comprends l idée brute sans la déformer. Reformule-la clairement et signale ce qui reste incertain.',
    questions:'Pose uniquement les 1 à 3 questions dont la réponse peut réellement changer la compréhension ou la décision. Pas de questionnaire générique.',
    improve:'Propose au maximum cinq améliorations à forte valeur couvrant seulement les angles réellement utiles.',
    challenge:'Cherche activement les faiblesses, contradictions, hypothèses dangereuses, alternatives plus simples et risques disproportionnés.',
    synthesize:'Produis une fiche canonique lisible en moins de deux minutes. Ne masque pas les inconnues.',
    presentation:'Prépare exactement six slides décisionnelles: idée, problème, proposition, intérêt/preuves, inconnues/risques, décision attendue. Une idée forte par slide.',
    presenter:'Prépare l auteur à présenter sans lui écrire un discours artificiel: ouverture courte, notes brèves par slide, trois objections probables maximum, clôture orientée décision.'
  }[action];
  return `${common}\n\nMission: ${task}`;
}

async function ideaSnapshot(env,ideaId,token){
  const [ideas,items,reviews,decisions]=await Promise.all([
    supabaseGet(env,`/rest/v1/ideas?select=id,workspace_id,created_by,title,original_text,summary,problem,audience,proposal,status,visibility,readiness,updated_at&id=eq.${encodeURIComponent(ideaId)}&limit=1`,token),
    supabaseGet(env,`/rest/v1/idea_items?select=kind,title,body,state,created_at&idea_id=eq.${encodeURIComponent(ideaId)}&order=created_at.asc&limit=30`,token),
    supabaseGet(env,`/rest/v1/idea_reviews?select=stance,note,updated_at&idea_id=eq.${encodeURIComponent(ideaId)}&order=updated_at.desc&limit=12`,token),
    supabaseGet(env,`/rest/v1/idea_decisions?select=outcome,rationale,decided_at&idea_id=eq.${encodeURIComponent(ideaId)}&order=decided_at.desc&limit=5`,token),
  ]);
  if(!ideas?.[0]) throw new Error('IDEA_NOT_FOUND');
  return {idea:ideas[0],items:items||[],reviews:reviews||[],decisions:decisions||[]};
}

async function handleIdeaAI(request,env){
  if(!env.AI) return json({ok:false,error:'AI_BINDING_UNAVAILABLE'},503);
  const auth=await authenticate(env,request);
  if(!auth) return json({ok:false,error:'UNAUTHORIZED'},401);
  let body;
  try{body=await request.json();}catch{return json({ok:false,error:'INVALID_JSON'},400);}
  const action=String(body?.action||'');
  const ideaId=String(body?.idea_id||'');
  if(!IDEA_AI_ACTIONS.has(action)||!/^[0-9a-f-]{36}$/i.test(ideaId)) return json({ok:false,error:'INVALID_REQUEST'},400);
  let snapshot;
  try{snapshot=await ideaSnapshot(env,ideaId,auth.token);}catch(error){return json({ok:false,error:error.message==='IDEA_NOT_FOUND'?'IDEA_NOT_FOUND':'IDEA_ACCESS_DENIED'},403);}
  const compact=JSON.stringify(snapshot).slice(0,22000);
  try{
    const result=await env.AI.run(AI_MODEL,{
      messages:[{role:'system',content:systemPrompt(action)},{role:'user',content:`Voici l état réel et persistant de l idée. Base-toi uniquement dessus.\n${compact}`}],
      response_format:{type:'json_schema',json_schema:schemas(action)},
      temperature:0.25,
      max_completion_tokens:action==='presentation'?1800:1200,
      chat_template_kwargs:{enable_thinking:false},
    });
    const payload=result?.response??result;
    return json({ok:true,action,model:AI_MODEL,result:payload});
  }catch(error){
    const message=String(error?.message||error||'AI_ERROR');
    const freeLimit=/3040|quota|limit|capacity|neuron/i.test(message);
    return json({ok:false,error:freeLimit?'FREE_AI_LIMIT_OR_CAPACITY':'AI_ERROR'},freeLimit?429:502);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/ideas/ai') {
      if(request.method!=='POST') return withHeaders(new Response('Method Not Allowed',{status:405}),{allow:'POST'});
      return handleIdeaAI(request,env);
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return withHeaders(new Response('Method Not Allowed', { status: 405 }), { allow: 'GET, HEAD' });
    }

    if (url.pathname === '/health') {
      return withHeaders(
        Response.json({
          ok: true,
          app: '4b4c',
          backend: 'supabase',
          version: 'v4.5.12-v6-polish-p2',
          ui_shell: {
            code: 'mobile-v8.1',
            dashboard_stability: '1.1.0',
            dashboard_presence: '2.1.0',
            presence_heartbeat: '1.0.0',
            brand_asset: 'brand-symbol.svg',
            ideas_v1: {
              code: '1.1.0-ai',
              additive: true,
              project_schema_mutated: false,
              guarded_conversion: true,
              ai_copilot: true,
              ai_model: AI_MODEL,
              ai_direct_browser_access: false,
            },
          },
          call_engine: '2.0.0',
          call_engine_v3: {
            code: '3.1.4-direct-pilot',
            transport: 'p2p-stun',
            signal_isolation: '1.1.0',
            certification: '1.0.0',
            mobile_call_ui: '8.1.0',
            media_bridge: '1.0.0',
            stable_mobile_stage: true,
            pilot_default: true,
            global_default: false,
            configured: true,
            external_account_required: false,
            billing_required: false,
          },
        }),
        { 'cache-control': 'no-store' },
      );
    }

    const isRoot = url.pathname === '/';
    const assetPath = isRoot ? '/index.html' : url.pathname;
    const assetRequest = new Request(new URL(assetPath, url.origin), request);
    let response = await env.ASSETS.fetch(assetRequest);

    const isNavigation = request.headers.get('sec-fetch-mode') === 'navigate';
    if (response.status === 404 && isNavigation) {
      response = await env.ASSETS.fetch(new Request(new URL('/index.html', url.origin), request));
    }

    const servesHtml = isRoot || isNavigation || assetPath === '/index.html';
    return withHeaders(response, servesHtml ? { 'cache-control': 'no-store' } : {});
  },
};
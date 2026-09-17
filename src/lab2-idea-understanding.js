const LAB2_MODEL='@cf/google/gemma-4-26b-a4b-it';
const CONTRACT_VERSION='lab2-understanding-v2';
const MAX_BODY_BYTES=14000;
const MAX_DESCRIPTION_CHARS=6000;
const MAX_REFERENCES=3;
const MAX_CLARIFICATIONS=2;
const MAX_CLARIFICATION_ANSWER_CHARS=1200;
const FREE_NEURONS_PER_DAY=10000;
const MODEL_PRICING=Object.freeze({
  version:'2026-08-28',
  input_neurons_per_million:9091,
  output_neurons_per_million:27273,
  input_usd_per_million:0.10,
  output_usd_per_million:0.30
});

class Lab2HttpError extends Error{
  constructor(status,code){super(code);this.status=status;this.code=code;}
}

function json(data,status=200){
  return Response.json(data,{status,headers:{'cache-control':'no-store','content-type':'application/json; charset=utf-8'}});
}

function enabled(value){
  return value===true||['1','true','on','yes'].includes(String(value||'').toLowerCase());
}

function cleanText(value,max=1000){
  return String(value??'').trim().replace(/\s+/g,' ').slice(0,max);
}

function cleanMultiline(value,max=6000){
  return String(value??'').trim().replace(/\r\n/g,'\n').slice(0,max);
}

function safeArray(value){return Array.isArray(value)?value:[];}

function allowedUserIds(env){
  const raw=String(env?.LAB2_ALLOWED_USER_IDS||'').trim();
  if(!raw)return null;
  const ids=new Set(raw.split(',').map((value)=>value.trim().toLowerCase()).filter(Boolean));
  return ids.size?ids:null;
}

async function authenticate(env,request){
  const header=request.headers.get('authorization')||'';
  if(!header.startsWith('Bearer '))return null;
  const token=header.slice(7).trim();
  if(!token||!env.SUPABASE_URL||!env.SUPABASE_PUBLISHABLE_KEY)return null;
  const response=await fetch(`${env.SUPABASE_URL}/auth/v1/user`,{
    headers:{apikey:env.SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${token}`}
  });
  if(!response.ok)return null;
  const user=await response.json().catch(()=>null);
  return user?.id?{id:String(user.id),email:cleanText(user.email,320)}:null;
}

function normalizeReferences(value){
  return safeArray(value).slice(0,MAX_REFERENCES).map((reference)=>({
    url:cleanText(reference?.url,300),
    reason:cleanText(reference?.reason,120),
    note:cleanText(reference?.note,500)
  })).filter((reference)=>reference.url||reference.note);
}

function normalizeClarifications(value){
  return safeArray(value).slice(0,MAX_CLARIFICATIONS).map((item)=>({
    question:cleanText(item?.question,350),
    answer:cleanText(item?.answer,MAX_CLARIFICATION_ANSWER_CHARS)
  })).filter((item)=>item.question&&item.answer);
}

function normalizeInput(body){
  if(!body||typeof body!=='object'||Array.isArray(body))throw new Lab2HttpError(400,'INVALID_REQUEST');
  const name=cleanText(body.name,100);
  const description=cleanMultiline(body.description,MAX_DESCRIPTION_CHARS);
  if(!name||description.length<40)throw new Lab2HttpError(400,'IDEA_INPUT_INCOMPLETE');
  return {
    name,
    description,
    references:normalizeReferences(body.references),
    clarifications:normalizeClarifications(body.clarifications)
  };
}

function understandingSchema(clarificationCount){
  const canAsk=clarificationCount<MAX_CLARIFICATIONS;
  return {
    type:'object',
    additionalProperties:false,
    properties:{
      one_liner:{type:'string',minLength:24,maxLength:320},
      problem:{type:'string',minLength:24,maxLength:900},
      target_users:{
        type:'array',minItems:1,maxItems:4,
        items:{
          type:'object',additionalProperties:false,
          properties:{label:{type:'string',minLength:3,maxLength:180},basis:{type:'string',enum:['EXPLICIT','INFERRED']}},
          required:['label','basis']
        }
      },
      main_flow:{
        type:'array',minItems:2,maxItems:7,
        items:{
          type:'object',additionalProperties:false,
          properties:{step:{type:'string',minLength:8,maxLength:240},basis:{type:'string',enum:['EXPLICIT','INFERRED']}},
          required:['step','basis']
        }
      },
      explicit_points:{type:'array',minItems:1,maxItems:7,items:{type:'string',minLength:3,maxLength:260}},
      uncertainties:{type:'array',maxItems:6,items:{type:'string',minLength:3,maxLength:280}},
      needs_clarification:{type:'boolean',enum:canAsk?[true,false]:[false]},
      clarifying_question:{anyOf:[{type:'null'},{type:'string',minLength:8,maxLength:320}]},
      confidence:{type:'string',enum:['HIGH','MEDIUM','LOW']}
    },
    required:['one_liner','problem','target_users','main_flow','explicit_points','uncertainties','needs_clarification','clarifying_question','confidence']
  };
}

function systemPrompt(clarificationCount){
  const remaining=Math.max(0,MAX_CLARIFICATIONS-clarificationCount);
  return `Tu es le facilitateur de compréhension de 4b4c2, un atelier destiné à des utilisateurs novices qui décrivent souvent une idée de site ou de web-app en une seule phrase.\n\nOBJECTIF : construire une compréhension pratique et fidèle qui permette ensuite de faire une vraie recherche, sans obliger l'utilisateur à rédiger lui-même un cahier des charges. Tu ne dois pas seulement recopier sa phrase.\n\nRÈGLES :\n- Réponds en français simple et concret.\n- N'ajoute pas encore de fonctionnalité optionnelle et ne juge pas la qualité commerciale du projet.\n- Tu PEUX et tu DOIS faire des déductions raisonnables à partir du type de projet exprimé, à condition de les marquer INFERRED. Éviter l'hallucination ne signifie pas refuser de raisonner.\n- EXPLICIT = information réellement donnée par l'utilisateur. INFERRED = hypothèse de travail raisonnable à confirmer plus tard.\n- Pour une idée très courte, identifie malgré tout le type de projet, le besoin vraisemblable, les publics plausibles et un parcours utilisateur minimal. Ne remplis pas les cadres par « inconnu », « reste à préciser » ou une paraphrase vide si une hypothèse utile peut être formulée.\n- one_liner doit expliquer le concept, pas recopier mot pour mot l'explication originale.\n- problem décrit le besoin auquel le projet doit répondre. Pour un site vitrine, cela peut être par exemple rendre une activité compréhensible, crédible, visible et faciliter l'action attendue ; ne prétends pas que cela a été explicitement dit si c'est déduit.\n- target_users contient au moins un public plausible. Si l'utilisateur ne l'a pas nommé, marque-le INFERRED.\n- main_flow contient au moins deux étapes qui décrivent ce que ferait réellement un visiteur/utilisateur. Les étapes déduites sont autorisées et marquées INFERRED.\n- explicit_points contient uniquement des faits réellement présents dans l'explication ou les références déclarées (nom, type de projet, métier, contraintes, etc.).\n- uncertainties contient seulement les décisions qui pourraient réellement changer la suite, pas des banalités génériques.\n- Les références indiquent ce que l'utilisateur aime mais tu ne prétends jamais les avoir visitées à cette étape.\n- Pose UNE question seulement si sa réponse changerait matériellement la recherche ou la structure à venir. Préfère une question concrète avec quelques choix compréhensibles à « quel est votre objectif ? ». Exemple pour un site vitrine : « Quelle action veux-tu surtout obtenir : prise de contact, demande de devis, rendez-vous, autre ? ».\n- Il reste ${remaining} tour(s) de clarification autorisé(s). Si aucun tour ne reste, needs_clarification=false et la décision non résolue reste dans uncertainties.\n- Si needs_clarification=false, clarifying_question=null. Si needs_clarification=true, une seule question courte.\n- confidence mesure ta confiance dans cette compréhension de travail, pas la valeur du projet. Une compréhension comportant des hypothèses utiles peut être MEDIUM sans être LOW.\n- Respecte strictement le schéma JSON demandé.`;
}

function userPrompt(input){
  const references=input.references.length
    ? input.references.map((reference,index)=>`${index+1}. ${reference.url||'(sans URL)'} — ce que l'utilisateur dit apprécier: ${reference.reason||'non précisé'}${reference.note?` — précision: ${reference.note}`:''}`).join('\n')
    : 'Aucune référence fournie.';
  const clarifications=input.clarifications.length
    ? input.clarifications.map((item,index)=>`Q${index+1}: ${item.question}\nR${index+1}: ${item.answer}`).join('\n\n')
    : 'Aucune clarification antérieure.';
  return `Nom provisoire : ${input.name}\n\nExplication originale :\n${input.description}\n\nRéférences déclarées (ne pas prétendre les avoir visitées) :\n${references}\n\nClarifications déjà données :\n${clarifications}`;
}

function parseAiPayload(raw){
  let payload=raw?.response??raw;
  if(typeof payload==='string'){
    try{payload=JSON.parse(payload);}catch{throw new Lab2HttpError(502,'AI_OUTPUT_INVALID');}
  }
  if(!payload||typeof payload!=='object'||Array.isArray(payload))throw new Lab2HttpError(502,'AI_OUTPUT_INVALID');
  return payload;
}

function normalizeBasis(value){return value==='EXPLICIT'?'EXPLICIT':'INFERRED';}

function isMeaningfulCore(value){
  const normalized=cleanText(value,1000).toLowerCase();
  if(normalized.length<20)return false;
  return !['non déterminé','non determine','à préciser','a preciser','inconnu','non précisé','non precise'].includes(normalized);
}

function normalizeUnderstanding(payload,clarificationCount){
  const canAsk=clarificationCount<MAX_CLARIFICATIONS;
  const oneLiner=cleanText(payload.one_liner,320);
  const problem=cleanText(payload.problem,900);
  const targetUsers=safeArray(payload.target_users).slice(0,4).map((item)=>({label:cleanText(item?.label,180),basis:normalizeBasis(item?.basis)})).filter((item)=>item.label);
  const mainFlow=safeArray(payload.main_flow).slice(0,7).map((item)=>({step:cleanText(item?.step,240),basis:normalizeBasis(item?.basis)})).filter((item)=>item.step);
  const explicitPoints=safeArray(payload.explicit_points).slice(0,7).map((item)=>cleanText(item,260)).filter(Boolean);
  const uncertainties=safeArray(payload.uncertainties).slice(0,6).map((item)=>cleanText(item,280)).filter(Boolean);

  if(!isMeaningfulCore(oneLiner)||!isMeaningfulCore(problem)||!targetUsers.length||mainFlow.length<2||!explicitPoints.length){
    throw new Lab2HttpError(502,'AI_OUTPUT_INCOMPLETE');
  }

  let needsClarification=canAsk&&payload.needs_clarification===true;
  let question=needsClarification?cleanText(payload.clarifying_question,320):'';
  if(needsClarification&&!question)throw new Lab2HttpError(502,'AI_OUTPUT_INCOMPLETE');
  if(!canAsk){needsClarification=false;question='';}

  const confidence=['HIGH','MEDIUM','LOW'].includes(payload.confidence)?payload.confidence:'MEDIUM';
  return {
    contract_version:CONTRACT_VERSION,
    one_liner:oneLiner,
    problem,
    target_users:targetUsers,
    main_flow:mainFlow,
    explicit_points:explicitPoints,
    uncertainties,
    needs_clarification:Boolean(needsClarification&&question),
    clarifying_question:needsClarification&&question?question:null,
    confidence
  };
}

function readUsage(raw){
  const usage=raw?.usage||raw?.meta?.usage||raw?.result?.usage||null;
  const promptTokens=Number(usage?.prompt_tokens??usage?.input_tokens??0);
  const completionTokens=Number(usage?.completion_tokens??usage?.output_tokens??0);
  if(!Number.isFinite(promptTokens)||!Number.isFinite(completionTokens)||promptTokens<0||completionTokens<0)return null;
  if(promptTokens===0&&completionTokens===0)return null;
  const estimatedNeurons=(promptTokens*MODEL_PRICING.input_neurons_per_million+completionTokens*MODEL_PRICING.output_neurons_per_million)/1_000_000;
  const paidEquivalentUsd=(promptTokens*MODEL_PRICING.input_usd_per_million+completionTokens*MODEL_PRICING.output_usd_per_million)/1_000_000;
  return {
    prompt_tokens:Math.round(promptTokens),
    completion_tokens:Math.round(completionTokens),
    total_tokens:Math.round(promptTokens+completionTokens),
    estimated_neurons:Number(estimatedNeurons.toFixed(3)),
    estimated_free_daily_share_percent:Number((estimatedNeurons/FREE_NEURONS_PER_DAY*100).toFixed(4)),
    paid_equivalent_usd:Number(paidEquivalentUsd.toFixed(6)),
    pricing_version:MODEL_PRICING.version,
    estimate:true
  };
}

function mapAiError(error){
  if(error instanceof Lab2HttpError)return error;
  const message=String(error?.message||error||'');
  if(/3040|quota|limit|capacity|neuron|rate/i.test(message))return new Lab2HttpError(429,'AI_CAPACITY');
  return new Lab2HttpError(502,'AI_ERROR');
}

export async function handleLab2IdeaUnderstanding(request,env){
  if(!enabled(env?.LAB2_IDEA_STUDIO_ENABLED))return json({ok:false,error:'LAB_DISABLED'},404);
  if(request.method!=='POST')return json({ok:false,error:'METHOD_NOT_ALLOWED'},405);
  if(Number(request.headers.get('content-length')||0)>MAX_BODY_BYTES)return json({ok:false,error:'INVALID_REQUEST'},400);
  if(!env?.AI)return json({ok:false,error:'AI_UNAVAILABLE'},503);

  const allowlist=allowedUserIds(env);
  if(!allowlist)return json({ok:false,error:'LAB_ACCESS_UNCONFIGURED'},503);

  const auth=await authenticate(env,request);
  if(!auth)return json({ok:false,error:'UNAUTHORIZED'},401);
  if(!allowlist.has(auth.id.toLowerCase()))return json({ok:false,error:'LAB_ACCESS_DENIED'},403);

  let body;
  try{body=await request.json();}catch{return json({ok:false,error:'INVALID_REQUEST'},400);}

  let input;
  try{input=normalizeInput(body);}catch(error){return json({ok:false,error:error?.code||'INVALID_REQUEST'},error?.status||400);}

  let raw;
  try{
    raw=await env.AI.run(LAB2_MODEL,{
      messages:[
        {role:'system',content:systemPrompt(input.clarifications.length)},
        {role:'user',content:userPrompt(input)}
      ],
      response_format:{type:'json_schema',json_schema:understandingSchema(input.clarifications.length)},
      temperature:0.15,
      max_completion_tokens:1100,
      chat_template_kwargs:{enable_thinking:false}
    });
  }catch(error){
    const mapped=mapAiError(error);
    return json({ok:false,error:mapped.code},mapped.status);
  }

  try{
    const understanding=normalizeUnderstanding(parseAiPayload(raw),input.clarifications.length);
    return json({
      ok:true,
      model:LAB2_MODEL,
      user_id:auth.id,
      understanding,
      usage:readUsage(raw),
      quality:{usable:true,min_target_users:1,min_flow_steps:2,generic_empty_fallbacks:false},
      limits:{max_clarifications:MAX_CLARIFICATIONS,remaining_clarifications:Math.max(0,MAX_CLARIFICATIONS-input.clarifications.length)}
    });
  }catch(error){
    const mapped=mapAiError(error);
    return json({ok:false,error:mapped.code},mapped.status);
  }
}
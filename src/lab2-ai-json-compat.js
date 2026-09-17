const DEFAULT_JSON_SUFFIX='\n\nRéponds UNIQUEMENT avec un objet JSON valide. Aucun markdown, aucun bloc de code, aucun texte avant ou après le JSON.';

function extractJsonText(value){
  let text=String(value??'').trim();
  if(!text)return '';
  text=text.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();
  const first=text.indexOf('{');
  const last=text.lastIndexOf('}');
  if(first>=0&&last>first)text=text.slice(first,last+1);
  return text;
}

function parseJsonContent(value){
  if(value&&typeof value==='object'&&!Array.isArray(value))return value;
  if(typeof value!=='string')return value;
  const text=extractJsonText(value);
  if(!text)return value;
  try{return JSON.parse(text)}catch{return value}
}

export function normalizeLab2AiResponse(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return raw;
  if(Object.prototype.hasOwnProperty.call(raw,'response')){
    return {...raw,response:parseJsonContent(raw.response)};
  }
  const message=raw?.choices?.[0]?.message;
  const candidate=message?.parsed??message?.content??raw?.result?.response;
  if(candidate===undefined||candidate===null)return raw;
  return {...raw,response:parseJsonContent(candidate)};
}

function schemaInstruction(responseFormat){
  const schema=responseFormat?.json_schema;
  if(!schema)return DEFAULT_JSON_SUFFIX;
  let encoded='';
  try{encoded=JSON.stringify(schema)}catch{}
  return `${DEFAULT_JSON_SUFFIX}\nRespecte exactement ce contrat JSON : ${encoded}`;
}

function normalizeRunOptions(options){
  if(!options||typeof options!=='object'||Array.isArray(options))return options;
  const next={...options};
  const responseFormat=next.response_format;
  if(responseFormat?.type==='json_schema'){
    delete next.response_format;
    const suffix=schemaInstruction(responseFormat);
    const messages=Array.isArray(next.messages)?next.messages.map((message)=>({...message})):[];
    const systemIndex=messages.findIndex((message)=>message?.role==='system');
    if(systemIndex>=0)messages[systemIndex]={...messages[systemIndex],content:`${String(messages[systemIndex].content||'')}${suffix}`};
    else messages.unshift({role:'system',content:suffix.trim()});
    next.messages=messages;
  }
  return next;
}

export function createLab2AiCompatibleEnv(env){
  const originalAi=env?.AI;
  if(!originalAi?.run)return env;
  const compatEnv=Object.create(env||null);
  compatEnv.AI={
    run:async(model,options,...rest)=>normalizeLab2AiResponse(await originalAi.run(model,normalizeRunOptions(options),...rest))
  };
  return compatEnv;
}

export const lab2AiJsonCompatInternals=Object.freeze({extractJsonText,parseJsonContent,normalizeRunOptions});

const MAX_SCHEMA_PROMPT_CHARS=12000;

function extractJsonText(value){
  let text=String(value??'').trim();
  if(!text)return '';
  const fenced=text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if(fenced)text=fenced[1].trim();
  const firstObject=text.indexOf('{'),lastObject=text.lastIndexOf('}');
  if(firstObject>=0&&lastObject>firstObject)return text.slice(firstObject,lastObject+1);
  const firstArray=text.indexOf('['),lastArray=text.lastIndexOf(']');
  if(firstArray>=0&&lastArray>firstArray)return text.slice(firstArray,lastArray+1);
  return text;
}

function parseJsonContent(value){
  if(typeof value!=='string')return value;
  const text=extractJsonText(value);
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
  if(!schema||typeof schema!=='object')return '';
  const serialized=JSON.stringify(schema).slice(0,MAX_SCHEMA_PROMPT_CHARS);
  return `\n\nCONTRAT JSON SERVEUR OBLIGATOIRE\nLe fournisseur ne valide pas le schéma pour toi. Retourne uniquement du JSON valide, sans markdown ni commentaire, respectant exactement ce schéma :\n${serialized}`;
}

function injectSchemaInstruction(messages,responseFormat){
  const instruction=schemaInstruction(responseFormat);
  if(!instruction)return Array.isArray(messages)?messages:[];
  const next=(Array.isArray(messages)?messages:[]).map(message=>({...message}));
  const systemIndex=next.findIndex(message=>message?.role==='system');
  if(systemIndex>=0){
    next[systemIndex]={...next[systemIndex],content:`${String(next[systemIndex].content||'')}${instruction}`};
  }else{
    next.unshift({role:'system',content:instruction.trim()});
  }
  return next;
}

export function createLab2AiEnv(env){
  const originalAi=env?.AI;
  if(!originalAi?.run)return env;
  const wrappedAi={
    run:async(model,options={})=>{
      const responseFormat=options?.response_format;
      const safeOptions={...options,messages:injectSchemaInstruction(options?.messages,responseFormat)};
      delete safeOptions.response_format;
      const raw=await originalAi.run(model,safeOptions);
      return normalizeLab2AiResponse(raw);
    }
  };
  const next=Object.create(env||null);
  next.AI=wrappedAi;
  return next;
}

export const LAB2_AI_JSON_ADAPTER_VERSION='lab2-ai-json-v1';

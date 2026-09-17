function extractJsonText(value){
  let text=String(value??'').trim();
  if(!text)return '';
  const fenced=text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if(fenced)text=fenced[1].trim();
  const first=text.indexOf('{'),last=text.lastIndexOf('}');
  if(first>=0&&last>first)text=text.slice(first,last+1);
  return text;
}

function parseJsonContent(value){
  if(typeof value!=='string')return value;
  try{return JSON.parse(extractJsonText(value))}catch{return value}
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
  return `\n\nFORMAT JSON OBLIGATOIRE POUR CET APPEL :\nRetourne UNIQUEMENT un objet JSON valide, sans markdown ni commentaire. Le résultat doit respecter ce schéma contractuel :\n${JSON.stringify(schema)}`;
}

function normalizeOptions(options){
  if(!options||typeof options!=='object'||Array.isArray(options))return options;
  const next={...options};
  const instruction=schemaInstruction(next.response_format);
  delete next.response_format;
  if(instruction){
    const messages=Array.isArray(next.messages)?next.messages.map(message=>({...message})):[];
    const systemIndex=messages.findIndex(message=>message?.role==='system');
    if(systemIndex>=0)messages[systemIndex].content=`${String(messages[systemIndex].content||'')}${instruction}`;
    else messages.unshift({role:'system',content:instruction.trim()});
    next.messages=messages;
  }
  return next;
}

export function withLab2AiCompatEnv(env){
  const originalAi=env?.AI;
  if(!originalAi?.run)return env;
  const compatAi=Object.create(originalAi);
  compatAi.run=async(model,options,...rest)=>normalizeLab2AiResponse(await originalAi.run(model,normalizeOptions(options),...rest));
  const compatEnv=Object.create(env||null);
  compatEnv.AI=compatAi;
  return compatEnv;
}

export const __lab2AiCompatTest={extractJsonText,parseJsonContent,normalizeOptions};

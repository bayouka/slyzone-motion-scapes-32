import { handleLab2IdeaUnderstanding as handleLab2IdeaUnderstandingBase } from './lab2-idea-understanding.js';

function parseJsonContent(value){
  if(typeof value!=='string')return value;
  let text=value.trim();
  const fenced=text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if(fenced)text=fenced[1].trim();
  try{return JSON.parse(text)}catch{return value}
}

export function normalizeLab2AiResponse(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return raw;
  if(Object.prototype.hasOwnProperty.call(raw,'response'))return raw;

  const message=raw?.choices?.[0]?.message;
  const candidate=message?.parsed??message?.content;
  if(candidate===undefined||candidate===null)return raw;

  return {
    ...raw,
    response:parseJsonContent(candidate)
  };
}

export async function handleLab2IdeaUnderstanding(request,env){
  const originalAi=env?.AI;
  if(!originalAi?.run)return handleLab2IdeaUnderstandingBase(request,env);

  const compatAi={
    run:async(...args)=>normalizeLab2AiResponse(await originalAi.run(...args))
  };
  const compatEnv=Object.create(env||null);
  compatEnv.AI=compatAi;
  return handleLab2IdeaUnderstandingBase(request,compatEnv);
}

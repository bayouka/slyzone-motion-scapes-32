const {withLab2AiCompatEnv,__lab2AiCompatTest}=await import(new URL('../src/lab2-ai-compat.js',import.meta.url).href+`?t=${Date.now()}`);

let captured=null;
const env={AI:{run:async(model,options)=>{
  captured={model,options};
  return {choices:[{message:{content:'```json\n{"answer":"ok","items":["a"]}\n```'}}],usage:{prompt_tokens:10,completion_tokens:5}};
}}};
const compat=withLab2AiCompatEnv(env);
const result=await compat.AI.run('@cf/test',{messages:[{role:'system',content:'Réponds.'},{role:'user',content:'test'}],response_format:{type:'json_schema',json_schema:{type:'object',properties:{answer:{type:'string'},items:{type:'array',items:{type:'string'}}},required:['answer','items']}},temperature:0});
if(captured?.model!=='@cf/test')throw new Error('LAB2_AI_COMPAT_MODEL_CHANGED');
if(Object.prototype.hasOwnProperty.call(captured?.options||{},'response_format'))throw new Error('LAB2_AI_COMPAT_RESPONSE_FORMAT_NOT_STRIPPED');
const system=String(captured?.options?.messages?.[0]?.content||'');
if(!system.includes('FORMAT JSON OBLIGATOIRE')||!system.includes('"answer"'))throw new Error('LAB2_AI_COMPAT_SCHEMA_NOT_PROMPTED');
if(result?.response?.answer!=='ok'||result?.response?.items?.[0]!=='a')throw new Error('LAB2_AI_COMPAT_RESPONSE_NOT_NORMALIZED');
if(__lab2AiCompatTest.extractJsonText('```json\n{"x":1}\n```')!=='{"x":1}')throw new Error('LAB2_AI_COMPAT_FENCE_PARSER_FAILED');
console.log('lab2-ai-compat-v1: ok (schema translated to prompt; provider response normalized)');

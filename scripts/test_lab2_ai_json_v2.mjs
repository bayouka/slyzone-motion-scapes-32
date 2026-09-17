const {createLab2AiEnv,__lab2AiJsonTest,LAB2_AI_JSON_ADAPTER_VERSION}=await import(new URL('../src/lab2-ai-json.js',import.meta.url).href+`?t=${Date.now()}`);

const schema={type:'object',additionalProperties:false,properties:{answer:{type:'string'}},required:['answer']};
let calls=[];
const base={AI:{run:async(model,options)=>{calls.push({model,options});return {response:{answer:'ok'},usage:{prompt_tokens:10,completion_tokens:4}}}}};
const env=createLab2AiEnv(base);

const native='@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const nativeResult=await env.AI.run(native,{messages:[{role:'system',content:'Réponds.'},{role:'user',content:'test'}],response_format:{type:'json_schema',json_schema:schema},max_completion_tokens:321,chat_template_kwargs:{enable_thinking:false}});
if(nativeResult?.response?.answer!=='ok')throw new Error('LAB2_AI_JSON_NATIVE_RESPONSE_NORMALIZATION_FAILED');
const nativeCall=calls[0];
if(nativeCall.model!==native)throw new Error('LAB2_AI_JSON_NATIVE_MODEL_CHANGED');
if(nativeCall.options?.response_format?.type!=='json_schema')throw new Error('LAB2_AI_JSON_NATIVE_RESPONSE_FORMAT_MUST_BE_PRESERVED');
if(nativeCall.options?.max_tokens!==321||Object.prototype.hasOwnProperty.call(nativeCall.options,'max_completion_tokens'))throw new Error('LAB2_AI_JSON_NATIVE_TOKEN_PARAMETER_NOT_NORMALIZED');
if(Object.prototype.hasOwnProperty.call(nativeCall.options,'chat_template_kwargs'))throw new Error('LAB2_AI_JSON_NATIVE_UNSUPPORTED_TEMPLATE_OPTIONS_NOT_REMOVED');

const compat='@cf/google/gemma-4-26b-a4b-it';
await env.AI.run(compat,{messages:[{role:'system',content:'Réponds.'},{role:'user',content:'test'}],response_format:{type:'json_schema',json_schema:schema},max_completion_tokens:222});
const compatCall=calls[1];
if(Object.prototype.hasOwnProperty.call(compatCall.options||{},'response_format'))throw new Error('LAB2_AI_JSON_COMPAT_RESPONSE_FORMAT_NOT_STRIPPED');
if(!String(compatCall.options?.messages?.[0]?.content||'').includes('CONTRAT JSON SERVEUR OBLIGATOIRE'))throw new Error('LAB2_AI_JSON_COMPAT_SCHEMA_NOT_INJECTED');
if(!__lab2AiJsonTest.NATIVE_JSON_MODELS.has(native))throw new Error('LAB2_AI_JSON_NATIVE_MODEL_REGISTRY_MISSING');
if(LAB2_AI_JSON_ADAPTER_VERSION!=='lab2-ai-json-v2')throw new Error('LAB2_AI_JSON_ADAPTER_VERSION_MISMATCH');

console.log('lab2-ai-json-v2: ok (native JSON schema preserved for supported model; compat prompt fallback retained)');

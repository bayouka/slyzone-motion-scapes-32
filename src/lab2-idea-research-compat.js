import { handleLab2IdeaResearch as handleBaseResearch } from './lab2-idea-research.js';

export async function handleLab2IdeaResearch(request,env){
  if(request.method!=='POST')return handleBaseResearch(request,env);
  let body;
  try{body=await request.clone().json()}catch{return handleBaseResearch(request,env)}
  const understanding=body?.understanding;
  if(understanding?.contract_version!=='lab2-understanding-v4')return handleBaseResearch(request,env);
  const bridged={...body,understanding:{...understanding,contract_version:'lab2-understanding-v2'}};
  const headers=new Headers(request.headers);headers.set('content-type','application/json');
  const bridgedRequest=new Request(request.url,{method:'POST',headers,body:JSON.stringify(bridged)});
  const response=await handleBaseResearch(bridgedRequest,env);
  if(!response.ok)return response;
  const payload=await response.clone().json().catch(()=>null);
  if(!payload?.ok)return response;
  return Response.json({...payload,input_understanding_contract:'lab2-understanding-v4',compatibility_bridge:'research-v2-from-understanding-v4'},{status:response.status,headers:response.headers});
}

import worker from './worker.js';
import { handleEvidenceAdvance } from './idea-evidence-endpoint.js';

const RUNTIME_VERSION='v4.5.13-workspace-evidence-g2';
const ADAPTER=Object.freeze({
  code:'0.3.0',
  commands:['blueprint_fit.assess','foundation.advance','evidence.advance'],
  blueprint:'SITE_VITRINE@0.5',
  g2_backend:'v0.7',
  service_role_browser_exposed:false
});

function versionMetadata(env){
  const meta=env?.CF_VERSION_METADATA;
  if(!meta||typeof meta!=='object')return null;
  return {id:meta.id||null,tag:meta.tag||null,timestamp:meta.timestamp||null};
}

async function health(request,env,ctx){
  const base=await worker.fetch(request,env,ctx);
  let payload;
  try{payload=await base.clone().json()}catch{payload={ok:base.ok,app:'4b4c',backend:'supabase'}}
  payload.version=RUNTIME_VERSION;
  payload.cloudflare_version=versionMetadata(env);
  payload.ui_shell=payload.ui_shell&&typeof payload.ui_shell==='object'?payload.ui_shell:{};
  if(payload.ui_shell.idea_engine_adapter_v0_1){payload.ui_shell.idea_engine_adapter_v0_1={...payload.ui_shell.idea_engine_adapter_v0_1,compatibility_marker:true};}
  payload.ui_shell.idea_engine_adapter_v0_3={...ADAPTER,configured:Boolean(env?.SUPABASE_SERVICE_ROLE_KEY)};
  const headers=new Headers(base.headers);headers.set('content-type','application/json; charset=utf-8');headers.set('cache-control','no-store');
  return new Response(JSON.stringify(payload),{status:base.status,statusText:base.statusText,headers});
}

export default {
  async fetch(request,env,ctx){
    const url=new URL(request.url);
    if(url.pathname==='/health'&&(request.method==='GET'||request.method==='HEAD'))return health(request,env,ctx);
    if(url.pathname==='/api/ideas/engine'&&request.method==='POST'){
      const clone=request.clone();
      let body=null;try{body=await clone.json()}catch{}
      if(body?.command==='evidence.advance')return handleEvidenceAdvance(request,env,body);
    }
    return worker.fetch(request,env,ctx);
  }
};

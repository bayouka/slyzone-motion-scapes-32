import worker from './worker.js';

const RUNTIME_VERSION='v4.5.12-workspace-foundation-g1-p2';
const ADAPTER=Object.freeze({
  code:'0.2.0',
  commands:['blueprint_fit.assess','foundation.advance'],
  service_role_browser_exposed:false
});

function versionMetadata(env){
  const meta=env?.CF_VERSION_METADATA;
  if(!meta||typeof meta!=='object')return null;
  return {
    id:meta.id||null,
    tag:meta.tag||null,
    timestamp:meta.timestamp||null
  };
}

async function health(request,env,ctx){
  const base=await worker.fetch(request,env,ctx);
  let payload;
  try{payload=await base.clone().json()}catch{payload={ok:base.ok,app:'4b4c',backend:'supabase'}}

  payload.version=RUNTIME_VERSION;
  payload.cloudflare_version=versionMetadata(env);
  payload.ui_shell=payload.ui_shell&&typeof payload.ui_shell==='object'?payload.ui_shell:{};

  // Preserve the historical marker because external gates may still inspect it.
  if(payload.ui_shell.idea_engine_adapter_v0_1){
    payload.ui_shell.idea_engine_adapter_v0_1={
      ...payload.ui_shell.idea_engine_adapter_v0_1,
      compatibility_marker:true
    };
  }

  payload.ui_shell.idea_engine_adapter_v0_2={
    ...ADAPTER,
    configured:Boolean(env?.SUPABASE_SERVICE_ROLE_KEY)
  };

  const headers=new Headers(base.headers);
  headers.set('content-type','application/json; charset=utf-8');
  headers.set('cache-control','no-store');
  return new Response(JSON.stringify(payload),{status:base.status,statusText:base.statusText,headers});
}

export default {
  async fetch(request,env,ctx){
    const url=new URL(request.url);
    if(url.pathname==='/health'&&(request.method==='GET'||request.method==='HEAD')){
      return health(request,env,ctx);
    }
    return worker.fetch(request,env,ctx);
  }
};

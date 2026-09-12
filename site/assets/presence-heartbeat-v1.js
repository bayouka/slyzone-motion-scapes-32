import { SupabaseBrowserClient } from './supabase-client.js';

(() => {
  if (window.__4B4C_PRESENCE_HEARTBEAT_V1__) return;
  window.__4B4C_PRESENCE_HEARTBEAT_V1__ = true;
  const config = window.__4B4C_CONFIG__ || {};
  const api = new SupabaseBrowserClient({ url: config.supabaseUrl, publishableKey: config.supabasePublishableKey });
  const key = config.workspaceStorageKey || '4b4c.live.workspace.v1';
  let busy = false;

  async function beat(){
    if(busy||document.hidden||!api.getSession()?.access_token)return;
    const wid=localStorage.getItem(key)||'';if(!wid)return;
    busy=true;
    try{await api.rpc('mark_workspace_seen',{p_workspace_id:wid});window.dispatchEvent(new CustomEvent('2b2c:presence-heartbeat',{detail:{workspaceId:wid,at:Date.now()}}));}
    catch(error){console.warn('[2b2c] presence heartbeat unavailable',error);}
    finally{busy=false;}
  }
  window.addEventListener('focus',()=>void beat());
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)void beat();});
  window.addEventListener('storage',(event)=>{if(event.key===key)void beat();});
  setInterval(()=>void beat(),45000);
  setTimeout(()=>void beat(),1200);
  window.__4B4C_PRESENCE_HEARTBEAT_V1__=Object.freeze({version:'1.0.0',beat});
})();

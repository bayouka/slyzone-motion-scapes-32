import { handleLab2IdeaUnderstanding } from './lab2-idea-understanding.js';
import { handleLab2IdeaResearch } from './lab2-idea-research.js';
import { handleLab2IdeaImprovements } from './lab2-idea-improvements.js';
import { handleLab2IdeaBrief } from './lab2-idea-brief.js';
import { handleLab2IdeaFeasibility } from './lab2-idea-feasibility.js';
import { handleLab2IdeaStructure } from './lab2-idea-structure.js';
import { handleLab2IdeaDesign } from './lab2-idea-design.js';
import { handleLab2IdeaMockups } from './lab2-idea-mockups.js';
import { handleLab2PresentationPlan } from './lab2-presentation-plan.js';
import { createLab2AiEnv, LAB2_AI_JSON_ADAPTER_VERSION } from './lab2-ai-json.js';

const SECURITY_HEADERS=Object.freeze({
  'x-content-type-options':'nosniff',
  'referrer-policy':'no-referrer',
  'x-frame-options':'DENY',
  'permissions-policy':'camera=(), microphone=(), display-capture=(), geolocation=()'
});

function withSecurityHeaders(response){const headers=new Headers(response.headers);for(const [key,value] of Object.entries(SECURITY_HEADERS))headers.set(key,value);return new Response(response.body,{status:response.status,statusText:response.statusText,headers})}
function json(data,status=200){return withSecurityHeaders(Response.json(data,{status,headers:{'cache-control':'no-store'}}))}
function accessConfigured(env){return Boolean(String(env?.LAB2_ALLOWED_USER_IDS||'').trim())}
function searchCapabilities(env){
  const brave=Boolean(String(env?.LAB2_BRAVE_SEARCH_API_KEY||'').trim());
  const tavily=Boolean(String(env?.LAB2_TAVILY_API_KEY||env?.TAVILY_API_KEY||'').trim());
  return {brave,tavily,configured:brave||tavily,strategy:brave&&tavily?'BRAVE_THEN_TAVILY':brave?'BRAVE':tavily?'TAVILY':'NONE'};
}

const LAB_ROUTES=new Map([
  ['/api/lab2/understand',handleLab2IdeaUnderstanding],
  ['/api/lab2/research',handleLab2IdeaResearch],
  ['/api/lab2/improvements',handleLab2IdeaImprovements],
  ['/api/lab2/brief',handleLab2IdeaBrief],
  ['/api/lab2/feasibility',handleLab2IdeaFeasibility],
  ['/api/lab2/structure',handleLab2IdeaStructure],
  ['/api/lab2/design',handleLab2IdeaDesign],
  ['/api/lab2/mockups',handleLab2IdeaMockups],
  ['/api/lab2/presentation-plan',handleLab2PresentationPlan]
]);

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.pathname==='/health'&&(request.method==='GET'||request.method==='HEAD')){
      const search=searchCapabilities(env);
      return json({
        ok:true,
        app:'4b4c2-idea-lab-preview',
        isolated:true,
        production_business_api_exposed:false,
        database_write_surface:false,
        auth_provider:'supabase-auth-only',
        ai_configured:Boolean(env?.AI),
        ai_json_adapter:LAB2_AI_JSON_ADAPTER_VERSION,
        source_fetch_configured:Boolean(env?.SOURCE_FETCH),
        browser_render_configured:Boolean(env?.BROWSER?.quickAction),
        competitor_search_configured:search.configured,
        competitor_search_strategy:search.strategy,
        brave_key_configured:search.brave,
        tavily_key_configured:search.tavily,
        adaptive_feasibility_enabled:true,
        presentation_planner_enabled:String(env?.LAB2_PRESENTATION_PLAN_ENABLED||'').toLowerCase()==='true',
        access_allowlist_configured:accessConfigured(env)
      });
    }
    const handler=LAB_ROUTES.get(url.pathname);
    if(handler){const labEnv=createLab2AiEnv(env);return withSecurityHeaders(await handler(request,labEnv));}
    if(request.method!=='GET'&&request.method!=='HEAD')return json({ok:false,error:'NOT_FOUND'},404);
    if(url.pathname==='/'||url.pathname==='/lab2')return Response.redirect(new URL('/lab2/login.html',url.origin),302);
    if(!url.pathname.startsWith('/lab2/'))return json({ok:false,error:'NOT_FOUND'},404);
    if(!env?.ASSETS)return json({ok:false,error:'ASSETS_UNAVAILABLE'},503);
    const response=await env.ASSETS.fetch(request);
    return withSecurityHeaders(response);
  }
};
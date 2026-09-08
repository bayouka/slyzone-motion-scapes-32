from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
live_path = ROOT / 'site/assets/live.js'
boot_path = ROOT / 'site/assets/boot.js'
index_path = ROOT / 'site/index.html'
worker_path = ROOT / 'src/worker.js'
stability_path = ROOT / 'scripts/stability-check.mjs'

live = live_path.read_text(encoding='utf-8')
boot = boot_path.read_text(encoding='utf-8')
index = index_path.read_text(encoding='utf-8')
worker = worker_path.read_text(encoding='utf-8')
stability = stability_path.read_text(encoding='utf-8')


def replace_once(old, new, text, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one match, got {count}')
    return text.replace(old, new, 1)

# State and sync locks.
live = replace_once(
    "modal: null, toast: [], notificationOpen: false, userMenuOpen: false, mobileMenuOpen: false, invitePreview: null, welcome: null, searchQuery: '', libraryQuery: '', libraryProject: 'all', loading: true, busy: false, lastSync: null, syncError: null, previousSeenAt: null, seenMarkedAt: null",
    "modal: null, toast: [], notificationOpen: false, userMenuOpen: false, mobileMenuOpen: false, invitePreview: null, welcome: null, searchQuery: '', libraryQuery: '', libraryProject: 'all', loading: true, busy: false, lastSync: null, syncError: null, syncDigest: null, syncProbeAt: 0, previousSeenAt: null, seenMarkedAt: null",
    live,
    'sync state',
)
live = replace_once(
    "};\n\nconst BRAND_NAME = '2b2c';",
    "};\n\nlet workspaceRefreshPromise = null;\nlet smartSyncPromise = null;\nlet lastFullRefreshAt = 0;\n\nconst BRAND_NAME = '2b2c';",
    live,
    'sync locks',
)

# Returning to the tab performs a cheap digest check, not a full workspace reload.
live = replace_once(
    "  document.addEventListener('visibilitychange', () => { if (!document.hidden && state.user && !state.modal) refreshWorkspace({ quiet: true }); });",
    "  document.addEventListener('visibilitychange', () => { if (!document.hidden && state.user && !state.modal) smartSync({ force: true }); });\n  window.addEventListener('focus', () => { if (state.user && state.workspace && !state.modal && !document.hidden) smartSync(); });",
    live,
    'visibility sync',
)

legacy_interval = """  setInterval(() => {
    if (state.user && state.workspace && !state.modal && !document.hidden) refreshWorkspace({ quiet: true });
  }, Math.max(10000, Number(config.pollIntervalMs || 15000)));"""
smart_interval = """  setInterval(() => {
    if (state.user && state.workspace && !state.modal && !document.hidden) smartSync();
  }, Math.max(15000, Number(config.syncProbeIntervalMs || 20000)));"""
live = replace_once(legacy_interval, smart_interval, live, 'legacy full polling')

# Reset digest when switching workspace.
live = replace_once(
    "  state.projectCache.clear(); state.projectSummaries.clear(); state.messages.clear();",
    "  state.projectCache.clear(); state.projectSummaries.clear(); state.messages.clear(); state.syncDigest=null; state.syncProbeAt=0; lastFullRefreshAt=0;",
    live,
    'workspace sync reset',
)

# Wrap the existing full refresh in single-flight and add digest-driven smart sync.
refresh_marker = "async function refreshWorkspace({ quiet = false } = {}) {"
sync_helpers = r'''function syncDigestFromRows(rows){
  if(Array.isArray(rows)) return String(rows[0]?.digest||'');
  if(rows&&typeof rows==='object') return String(rows.digest||'');
  return typeof rows==='string'?rows:'';
}

async function smartSync({force=false}={}){
  if(!state.user||!state.workspace||state.modal||document.hidden)return;
  const now=Date.now();
  const minGap=Math.max(8000,Math.floor(Number(config.syncProbeIntervalMs||20000)/2));
  if(!force&&state.syncProbeAt&&now-state.syncProbeAt<minGap)return;
  if(smartSyncPromise)return smartSyncPromise;
  smartSyncPromise=(async()=>{
    state.syncProbeAt=Date.now();
    try{
      const rows=await api.rpc('get_workspace_sync_digest_v1',{p_workspace_id:state.workspace.id});
      const nextDigest=syncDigestFromRows(rows);
      if(!nextDigest)return;
      const changed=!state.syncDigest||nextDigest!==state.syncDigest;
      const fallbackMs=Math.max(300000,Number(config.fullRefreshFallbackMs||300000));
      const fallbackDue=!lastFullRefreshAt||Date.now()-lastFullRefreshAt>=fallbackMs;
      if(changed||fallbackDue){
        await refreshWorkspace({quiet:true});
      }else if(state.syncError){
        state.syncError=null;
        render();
      }
    }catch(error){
      const message=humanError(error);
      if(state.syncError!==message){state.syncError=message;render();}
    }
  })();
  try{return await smartSyncPromise;}finally{smartSyncPromise=null;}
}

async function refreshWorkspace(options={}){
  if(workspaceRefreshPromise)return workspaceRefreshPromise;
  workspaceRefreshPromise=refreshWorkspaceImpl(options);
  try{return await workspaceRefreshPromise;}finally{workspaceRefreshPromise=null;}
}

async function refreshWorkspaceImpl({ quiet = false } = {}) {'''
live = replace_once(refresh_marker, sync_helpers, live, 'refresh wrapper')

# Include digest in the full refresh so the next probe has a correct baseline.
live = replace_once(
    "const [projects, archivedProjects, members, profiles, notifications, requests, approvals, meetings, meetingAttendees, actions, assignees, decisions, deliverables, deliverableVersions, conversations, conversationMembers, projectMembers, summaryRows, unreadRows, badgeRows] = await Promise.all([",
    "const [projects, archivedProjects, members, profiles, notifications, requests, approvals, meetings, meetingAttendees, actions, assignees, decisions, deliverables, deliverableVersions, conversations, conversationMembers, projectMembers, summaryRows, unreadRows, badgeRows, digestRows] = await Promise.all([",
    live,
    'refresh digest destructuring',
)
live = replace_once(
    "      api.rpc('get_message_badges_v2', { p_workspace_id: wid }).catch(()=>[])\n    ]);",
    "      api.rpc('get_message_badges_v2', { p_workspace_id: wid }).catch(()=>[]),\n      api.rpc('get_workspace_sync_digest_v1', { p_workspace_id: wid }).catch(()=>[])\n    ]);",
    live,
    'refresh digest rpc',
)
live = replace_once(
    "    state.projectSummaries = new Map((Array.isArray(summaryRows)?summaryRows:[]).map(row=>[row.project_id,row]));\n    state.unreadConversations",
    "    state.projectSummaries = new Map((Array.isArray(summaryRows)?summaryRows:[]).map(row=>[row.project_id,row]));\n    state.syncDigest = syncDigestFromRows(digestRows) || state.syncDigest;\n    state.unreadConversations",
    live,
    'refresh digest baseline',
)
live = replace_once(
    "    state.lastSync = new Date();\n    state.syncError = null;",
    "    state.lastSync = new Date();\n    lastFullRefreshAt = Date.now();\n    state.syncError = null;",
    live,
    'full refresh timestamp',
)

# Boot config and cache bust.
boot = replace_once("const VERSION = 'v4.4.7-native-progress';", "const VERSION = 'v4.4.8-smart-sync';", boot, 'boot version')
boot = replace_once(
    "  // Slow the core full-workspace polling from ~15 s to at least 60 s while the\n  // rendering architecture is consolidated.\n  window.__4B4C_CONFIG__ = Object.freeze({ ...config, pollIntervalMs: Math.max(60000, Number(config.pollIntervalMs || 0)) });",
    "  // Stability mode keeps the observer-free core. A lightweight server digest is\n  // probed frequently; the expensive full workspace refresh runs only on change.\n  window.__4B4C_CONFIG__ = Object.freeze({ ...config, syncProbeIntervalMs: Math.max(15000, Number(config.syncProbeIntervalMs || 20000)), fullRefreshFallbackMs: Math.max(300000, Number(config.fullRefreshFallbackMs || 300000)) });",
    boot,
    'boot sync config',
)
index = replace_once('boot.js?v=4.4.7-native-progress', 'boot.js?v=4.4.8-smart-sync', index, 'index cache bust')
worker = replace_once("version: 'v4.4.7-native-progress'", "version: 'v4.4.8-smart-sync'", worker, 'worker version')

# Persistent stability contract.
stability = stability.replace('v4.4.7-native-progress', 'v4.4.8-smart-sync')
stability = replace_once(
    "assert(boot.includes('pollIntervalMs: Math.max(60000'), 'polling floor is not 60 seconds');",
    "assert(boot.includes('syncProbeIntervalMs: Math.max(15000'), 'smart sync probe floor missing');\nassert(boot.includes('fullRefreshFallbackMs: Math.max(300000'), 'full refresh safety fallback missing');",
    stability,
    'stability polling assertion',
)
stability = replace_once(
    "assert(live.includes('get_project_summaries_v1'), 'server project summaries RPC missing');",
    "assert(live.includes('get_project_summaries_v1'), 'server project summaries RPC missing');\nassert(live.includes('get_workspace_sync_digest_v1'), 'workspace sync digest RPC missing');\nassert(live.includes('smartSync'), 'smart sync controller missing');\nassert(live.includes('workspaceRefreshPromise'), 'full refresh single-flight guard missing');\nassert(!live.includes('Number(config.pollIntervalMs || 15000)'), 'legacy full-workspace polling remains');\nassert(!live.includes('new MutationObserver'), 'core app instantiates a MutationObserver');",
    stability,
    'stability smart sync assertions',
)
stability = stability.replace("console.log('stability/native-progress production contract: ok');", "console.log('stability/smart-sync production contract: ok');")

live_path.write_text(live, encoding='utf-8')
boot_path.write_text(boot, encoding='utf-8')
index_path.write_text(index, encoding='utf-8')
worker_path.write_text(worker, encoding='utf-8')
stability_path.write_text(stability, encoding='utf-8')

print('smart sync migration applied')

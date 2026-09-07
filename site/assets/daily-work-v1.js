import { SupabaseBrowserClient } from './supabase-client.js';

const VERSION = '4b4c daily work v1.0.0';
const config = window.__4B4C_CONFIG__ || {};
const app = document.getElementById('app');
const workspaceKey = config.workspaceStorageKey || '4b4c.live.workspace.v1';

if (!app || !config.supabaseUrl || !config.supabasePublishableKey) {
  console.warn(`${VERSION}: configuration unavailable`);
} else {
  const api = new SupabaseBrowserClient({ url: config.supabaseUrl, publishableKey: config.supabasePublishableKey });
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
  const workspaceId = () => localStorage.getItem(workspaceKey) || '';
  const day = 86400000;
  let cache = { at:0, wid:'', data:null };
  let scheduled = false;
  let workState = { filter:'todo', project:'all', horizon:'all' };

  function fmtDateTime(value) {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('fr-FR', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }).format(d);
  }
  function fmtDate(value) {
    if (!value) return '';
    const d = new Date(String(value).length === 10 ? `${value}T12:00:00` : value);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('fr-FR', { day:'numeric', month:'short' }).format(d);
  }
  function sameDay(a, b = new Date()) {
    const d = new Date(a);
    return !Number.isNaN(d.getTime()) && d.getFullYear() === b.getFullYear() && d.getMonth() === b.getMonth() && d.getDate() === b.getDate();
  }
  function relativeDue(value) {
    if (!value) return 'Sans échéance';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return 'Sans échéance';
    const now = new Date();
    if (sameDay(d, now)) return `Aujourd’hui · ${new Intl.DateTimeFormat('fr-FR',{hour:'2-digit',minute:'2-digit'}).format(d)}`;
    const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
    if (sameDay(d, tomorrow)) return `Demain · ${new Intl.DateTimeFormat('fr-FR',{hour:'2-digit',minute:'2-digit'}).format(d)}`;
    return fmtDateTime(value);
  }
  function profileName(data, id) { return data.profiles.find(p => p.id === id)?.display_name || 'Membre'; }
  function projectName(data, id) { return data.projects.find(p => p.id === id)?.name || 'Espace'; }
  function actionRoute(a) { return `#/projects/${a.project_id}/work/list/action/${a.id}`; }
  function requestRoute(r) { return `#/work/request/${r.id}`; }
  function approvalRoute(a) { return `#/work/approval/${a.id}`; }

  async function snapshot(force = false) {
    const wid = workspaceId();
    if (!wid || !api.getSession()) return null;
    if (!force && cache.data && cache.wid === wid && Date.now() - cache.at < 3000) return cache.data;
    const user = await api.getUser();
    const [projects, actions, assignees, requests, approvals, meetings, attendees, milestones, profiles, deliverables, versions] = await Promise.all([
      api.select('projects', `select=id,name,status,target_date,health,visibility,updated_at&workspace_id=eq.${wid}&status=neq.archived&order=updated_at.desc`),
      api.select('actions', `select=*&workspace_id=eq.${wid}&order=created_at.desc&limit=500`),
      api.select('action_assignees', 'select=*'),
      api.select('requests', `select=*&workspace_id=eq.${wid}&order=created_at.desc&limit=300`).catch(() => []),
      api.select('approvals', `select=*&workspace_id=eq.${wid}&order=created_at.desc&limit=300`).catch(() => []),
      api.select('meetings', `select=*&workspace_id=eq.${wid}&order=starts_at.asc.nullslast&limit=200`).catch(() => []),
      api.select('meeting_attendees', 'select=*').catch(() => []),
      api.select('milestones', `select=*&workspace_id=eq.${wid}&order=position.asc`).catch(() => []),
      api.select('profiles', 'select=id,display_name,avatar_url').catch(() => []),
      api.select('deliverables', `select=id,project_id,title&workspace_id=eq.${wid}&limit=250`).catch(() => []),
      api.select('deliverable_versions', `select=id,deliverable_id,version_number,file_name&workspace_id=eq.${wid}&limit=400`).catch(() => [])
    ]);
    const data = { wid, user, projects, actions, assignees, requests, approvals, meetings, attendees, milestones, profiles, deliverables, versions };
    cache = { at:Date.now(), wid, data };
    return data;
  }

  function mineIds(data) {
    return new Set(data.assignees.filter(x => x.user_id === data.user.id).map(x => x.action_id));
  }
  function assignedActions(data, { includeDone = false } = {}) {
    const ids = mineIds(data);
    return data.actions.filter(a => ids.has(a.id) && (includeDone || !['done','cancelled'].includes(a.status)));
  }
  function approvalTitle(data, approval) {
    const version = data.versions.find(v => v.id === approval.deliverable_version_id);
    const deliverable = version ? data.deliverables.find(d => d.id === version.deliverable_id) : null;
    if (!deliverable) return 'Validation d’un résultat';
    return `${deliverable.title}${version ? ` · v${version.version_number}` : ''}`;
  }
  function immediateItems(data) {
    const now = Date.now();
    const cutoff = now + 48 * 3600000;
    const rows = [];
    assignedActions(data).forEach(a => {
      const due = a.due_at ? new Date(a.due_at).getTime() : Infinity;
      const blocked = a.status === 'blocked';
      const overdue = Number.isFinite(due) && due < now;
      const urgent = a.priority === 'urgent';
      const dueSoon = Number.isFinite(due) && due <= cutoff;
      if (!(blocked || overdue || urgent || dueSoon)) return;
      let reason = 'À traiter';
      let rank = 6;
      if (blocked) { reason = a.blocked_reason ? `Blocage · ${a.blocked_reason}` : 'Blocage à résoudre'; rank = 0; }
      else if (overdue) { reason = `En retard · ${relativeDue(a.due_at)}`; rank = 3; }
      else if (urgent) { reason = 'Priorité urgente'; rank = 4; }
      else if (dueSoon) { reason = relativeDue(a.due_at); rank = 5; }
      rows.push({ type:blocked ? 'Blocage' : 'Action', tone:blocked ? 'danger' : overdue ? 'warn' : urgent ? 'blue' : '', rank, title:a.title, projectId:a.project_id, dueAt:a.due_at, reason, route:actionRoute(a), id:a.id });
    });
    data.approvals.filter(a => a.validator_id === data.user.id && a.status === 'pending').forEach(a => rows.push({ type:'Validation', tone:'blue', rank:1, title:approvalTitle(data,a), projectId:a.project_id, reason:a.requested_by && a.requested_by !== data.user.id ? `Demandée par ${profileName(data,a.requested_by)}` : 'Votre décision est attendue', route:approvalRoute(a), id:a.id }));
    data.requests.filter(r => r.recipient_id === data.user.id && r.status === 'open').forEach(r => rows.push({ type:'Demande', tone:'warn', rank:2, title:r.title, projectId:r.project_id, dueAt:r.due_at, reason:r.requester_id && r.requester_id !== data.user.id ? `Réponse attendue par ${profileName(data,r.requester_id)}` : 'Réponse attendue', route:requestRoute(r), id:r.id }));
    return rows.sort((a,b) => a.rank - b.rank || new Date(a.dueAt || '2999') - new Date(b.dueAt || '2999'));
  }
  function prepareItems(data, immediate) {
    const immediateActionIds = new Set(immediate.filter(x => x.type === 'Action' || x.type === 'Blocage').map(x => x.id));
    const now = Date.now();
    const horizon = now + 14 * day;
    const rows = [];
    assignedActions(data).filter(a => !immediateActionIds.has(a.id) && a.due_at).forEach(a => {
      const ts = new Date(a.due_at).getTime();
      if (ts >= now && ts <= horizon) rows.push({ kind:'Action', title:a.title, projectId:a.project_id, when:relativeDue(a.due_at), ts, route:actionRoute(a) });
    });
    data.meetings.filter(m => m.starts_at && !['cancelled','completed'].includes(m.status)).forEach(m => {
      const ts = new Date(m.starts_at).getTime();
      const invited = m.created_by === data.user.id || data.attendees.some(a => a.meeting_id === m.id && a.user_id === data.user.id && a.response !== 'declined');
      if (invited && ts >= now && ts <= horizon) rows.push({ kind:'Réunion', title:m.title, projectId:m.project_id, when:relativeDue(m.starts_at), ts, meetingId:m.id });
    });
    data.milestones.filter(m => m.due_date && !['done','cancelled'].includes(m.status)).forEach(m => {
      const ts = new Date(`${m.due_date}T12:00:00`).getTime();
      if (ts >= now && ts <= horizon) rows.push({ kind:'Étape', title:m.title, projectId:m.project_id, when:fmtDate(m.due_date), ts, route:`#/projects/${m.project_id}/work/roadmap` });
    });
    const seen = new Set();
    return rows.sort((a,b) => a.ts - b.ts).filter(row => {
      const key = `${row.kind}|${row.projectId}|${row.title}|${row.ts}`;
      if (seen.has(key)) return false;
      seen.add(key); return true;
    }).slice(0,7);
  }

  function ensureStyles() {
    if (document.getElementById('daily-work-v1-styles')) return;
    const style = document.createElement('style');
    style.id = 'daily-work-v1-styles';
    style.textContent = `
      .daily-attention-card.is-quiet{padding-bottom:15px}.daily-attention-list{display:grid;gap:4px}.daily-attention-row{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:11px;width:100%;padding:12px 4px;border:0;border-bottom:1px solid var(--live-line,#e7ebf1);background:transparent;color:inherit;text-align:left;text-decoration:none}.daily-attention-row:last-child{border-bottom:0}.daily-attention-row:hover{background:rgba(56,103,244,.035)}.daily-attention-row:focus-visible{outline:3px solid rgba(56,103,244,.22);outline-offset:2px;border-radius:10px}.daily-attention-kind{min-width:74px;font-size:11px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#667085}.daily-attention-kind.danger{color:#b42318}.daily-attention-kind.warn{color:#b54708}.daily-attention-kind.blue{color:#3159cb}.daily-attention-copy{min-width:0;display:grid;gap:3px}.daily-attention-copy strong{font-size:14px}.daily-attention-copy small{color:var(--live-muted,#667085);white-space:normal}.daily-attention-chevron{font-size:20px;color:#98a2b3}
      .daily-prepare-list{display:grid}.daily-prepare-row{display:grid;grid-template-columns:66px minmax(0,1fr) auto;gap:10px;align-items:center;padding:11px 0;border-bottom:1px solid var(--live-line,#e7ebf1);color:inherit;text-decoration:none;background:transparent;border-left:0;border-right:0;border-top:0;width:100%;text-align:left;font:inherit;cursor:pointer}.daily-prepare-row:last-child{border-bottom:0}.daily-prepare-kind{font-size:11px;font-weight:800;color:#667085;text-transform:uppercase}.daily-prepare-copy{display:grid;gap:2px;min-width:0}.daily-prepare-copy strong{font-size:13px}.daily-prepare-copy small{font-size:12px;color:var(--live-muted,#667085)}.daily-quiet{display:flex;align-items:center;gap:9px;padding:8px 0;color:#667085;font-size:13px}.daily-quiet-dot{width:8px;height:8px;border-radius:50%;background:#39a16c}
      .daily-work-panel{display:grid;gap:14px}.daily-work-tabs{display:flex;gap:7px;flex-wrap:wrap}.daily-work-tab{border:1px solid var(--live-line,#e1e7ef);background:#fff;border-radius:999px;min-height:40px;padding:7px 12px;font:inherit;font-size:13px;font-weight:700;cursor:pointer;color:#475467}.daily-work-tab.active{background:#172033;color:#fff;border-color:#172033}.daily-work-tab b{display:inline-flex;align-items:center;justify-content:center;margin-left:5px;min-width:20px;height:20px;padding:0 5px;border-radius:999px;background:rgba(255,255,255,.16);font-size:11px}.daily-work-tab:not(.active) b{background:#eef2f7;color:#475467}
      .daily-work-controls{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.daily-work-controls label{font-size:12px;font-weight:700;color:#667085}.daily-work-controls select{min-height:40px;border:1px solid var(--live-line,#dfe5ec);border-radius:10px;background:#fff;padding:7px 30px 7px 10px;font:inherit;font-size:13px}.daily-work-list{display:grid}.daily-work-row{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:11px;align-items:center;padding:13px 4px;border-bottom:1px solid var(--live-line,#e7ebf1);text-decoration:none;color:inherit}.daily-work-row:last-child{border-bottom:0}.daily-work-row:hover{background:rgba(56,103,244,.035)}.daily-work-row:focus-visible{outline:3px solid rgba(56,103,244,.22);outline-offset:2px;border-radius:10px}.daily-work-status{font-size:11px;font-weight:800;min-width:82px;color:#667085;text-transform:uppercase}.daily-work-status.danger{color:#b42318}.daily-work-status.warn{color:#b54708}.daily-work-status.blue{color:#3159cb}.daily-work-copy{min-width:0;display:grid;gap:3px}.daily-work-copy strong{font-size:14px}.daily-work-copy small{color:var(--live-muted,#667085);white-space:normal}.daily-work-empty{padding:20px 4px;color:#667085;display:grid;gap:5px}.daily-work-empty strong{color:#344054}.daily-work-summary{font-size:13px;color:#667085;margin-left:auto}
      @media(max-width:700px){.daily-attention-row,.daily-work-row{grid-template-columns:1fr auto}.daily-attention-kind,.daily-work-status{grid-column:1/-1;min-width:0;margin-bottom:-5px}.daily-prepare-row{grid-template-columns:1fr auto}.daily-prepare-kind{grid-column:1/-1}.daily-work-controls{display:grid;grid-template-columns:1fr 1fr}.daily-work-controls label{display:grid;gap:4px}.daily-work-controls select{width:100%}.daily-work-summary{margin-left:0}.daily-work-tabs{flex-wrap:nowrap;overflow:auto;padding-bottom:2px}.daily-work-tab{flex:0 0 auto}}
    `;
    document.head.appendChild(style);
  }

  function patchDashboard(data) {
    if (!location.hash.startsWith('#/dashboard') && location.hash) return;
    const root = app.querySelector('.v43-home-grid');
    if (!root || root.dataset.dailyWorkVersion === VERSION) return;
    const immediate = immediateItems(data);
    const prepare = prepareItems(data, immediate);
    const attentionCard = root.querySelector('.v43-attention-card');
    if (attentionCard) {
      attentionCard.classList.add('daily-attention-card');
      attentionCard.classList.toggle('is-quiet', immediate.length === 0);
      attentionCard.innerHTML = `<div class="section-head compact"><div><span class="eyebrow">Priorité personnelle</span><h2>Votre intervention attendue</h2><small class="section-context">${immediate.length ? `${immediate.length} élément${immediate.length > 1 ? 's' : ''} nécessite${immediate.length > 1 ? 'nt' : ''} votre action maintenant` : 'Rien ne nécessite votre intervention immédiate'}</small></div><a class="section-link" href="#/work">Mon travail →</a></div>${immediate.length ? `<div class="daily-attention-list">${immediate.slice(0,5).map(item => `<a class="daily-attention-row" href="${esc(item.route)}"><span class="daily-attention-kind ${item.tone}">${esc(item.type)}</span><span class="daily-attention-copy"><strong>${esc(item.title)}</strong><small>${esc(projectName(data,item.projectId))} · ${esc(item.reason)}</small></span><span class="daily-attention-chevron">›</span></a>`).join('')}</div>${immediate.length > 5 ? `<a class="v43-list-more" href="#/work">Voir ${immediate.length - 5} autre${immediate.length - 5 > 1 ? 's' : ''} →</a>` : ''}` : '<div class="daily-quiet"><span class="daily-quiet-dot" aria-hidden="true"></span><span>Vous pouvez reprendre un projet sans urgence particulière.</span></div>'}`;
    }
    const upcoming = root.querySelector('.v43-upcoming-card');
    if (upcoming) {
      upcoming.innerHTML = `<div class="rail-card-head"><div><span class="eyebrow">Horizon</span><h2>À préparer</h2></div><a class="section-link" href="#/calendar">Agenda →</a></div>${prepare.length ? `<div class="daily-prepare-list">${prepare.slice(0,5).map(item => item.meetingId ? `<button class="daily-prepare-row" data-action="open-meeting" data-meeting="${esc(item.meetingId)}"><span class="daily-prepare-kind">${esc(item.kind)}</span><span class="daily-prepare-copy"><strong>${esc(item.title)}</strong><small>${esc(projectName(data,item.projectId))} · ${esc(item.when)}</small></span><span>›</span></button>` : `<a class="daily-prepare-row" href="${esc(item.route)}"><span class="daily-prepare-kind">${esc(item.kind)}</span><span class="daily-prepare-copy"><strong>${esc(item.title)}</strong><small>${esc(projectName(data,item.projectId))} · ${esc(item.when)}</small></span><span>›</span></a>`).join('')}</div>` : '<div class="daily-quiet"><span class="daily-quiet-dot" aria-hidden="true"></span><span>Aucune préparation particulière dans les 14 prochains jours.</span></div>'}`;
    }
    const head = root.previousElementSibling;
    const intro = head?.querySelector('p');
    if (intro) {
      const parts = [];
      if (immediate.length) parts.push(`${immediate.length} intervention${immediate.length > 1 ? 's' : ''} attendue${immediate.length > 1 ? 's' : ''}`);
      else parts.push('Aucune urgence personnelle');
      if (prepare.length) parts.push(`${prepare.length} élément${prepare.length > 1 ? 's' : ''} à préparer`);
      intro.textContent = parts.join(' · ');
    }
    root.dataset.dailyWorkVersion = VERSION;
  }

  function workCounts(data) {
    const openActions = assignedActions(data);
    const respond = data.approvals.filter(a => a.validator_id === data.user.id && a.status === 'pending').length + data.requests.filter(r => r.recipient_id === data.user.id && r.status === 'open').length;
    const waiting = data.requests.filter(r => r.requester_id === data.user.id && r.recipient_id !== data.user.id && r.status === 'open').length + data.approvals.filter(a => a.requested_by === data.user.id && a.validator_id !== data.user.id && a.status === 'pending').length;
    const doneIds = mineIds(data);
    const done = data.actions.filter(a => doneIds.has(a.id) && a.status === 'done').length;
    return { todo:openActions.length, respond, waiting, done };
  }
  function horizonPass(value, horizon, status) {
    if (horizon === 'all') return true;
    if (!value) return false;
    const ts = new Date(value).getTime();
    if (Number.isNaN(ts)) return false;
    const now = new Date();
    if (horizon === 'overdue') return status !== 'done' && ts < Date.now();
    if (horizon === 'today') return sameDay(ts, now);
    if (horizon === 'week') return ts >= Date.now() - day && ts <= Date.now() + 7 * day;
    return true;
  }
  function filteredRows(data) {
    let rows = [];
    const ids = mineIds(data);
    if (workState.filter === 'todo') {
      rows = data.actions.filter(a => ids.has(a.id) && !['done','cancelled'].includes(a.status)).map(a => {
        const dueTs = a.due_at ? new Date(a.due_at).getTime() : Infinity;
        const overdue = Number.isFinite(dueTs) && dueTs < Date.now();
        const label = a.status === 'blocked' ? 'Blocage' : overdue ? 'En retard' : a.priority === 'urgent' ? 'Urgent' : a.status === 'in_progress' ? 'En cours' : 'À faire';
        const tone = a.status === 'blocked' ? 'danger' : overdue ? 'warn' : a.priority === 'urgent' ? 'blue' : '';
        return { projectId:a.project_id, due:a.due_at, status:a.status, title:a.title, label, tone, sub:`${projectName(data,a.project_id)}${a.due_at ? ` · ${relativeDue(a.due_at)}` : ' · sans échéance'}${a.blocked_reason ? ` · ${a.blocked_reason}` : ''}`, route:actionRoute(a), sort:dueTs };
      });
    } else if (workState.filter === 'respond') {
      data.approvals.filter(a => a.validator_id === data.user.id && a.status === 'pending').forEach(a => rows.push({ projectId:a.project_id, title:approvalTitle(data,a), label:'Validation', tone:'blue', sub:`${projectName(data,a.project_id)} · votre décision est attendue`, route:approvalRoute(a), sort:0 }));
      data.requests.filter(r => r.recipient_id === data.user.id && r.status === 'open').forEach(r => rows.push({ projectId:r.project_id, due:r.due_at, status:r.status, title:r.title, label:'Demande', tone:'warn', sub:`${projectName(data,r.project_id)} · ${r.requester_id ? `demandée par ${profileName(data,r.requester_id)}` : 'réponse attendue'}${r.due_at ? ` · ${relativeDue(r.due_at)}` : ''}`, route:requestRoute(r), sort:r.due_at ? new Date(r.due_at).getTime() : Infinity }));
    } else if (workState.filter === 'waiting') {
      data.requests.filter(r => r.requester_id === data.user.id && r.recipient_id !== data.user.id && r.status === 'open').forEach(r => rows.push({ projectId:r.project_id, due:r.due_at, status:r.status, title:r.title, label:'En attente', tone:'', sub:`${projectName(data,r.project_id)} · réponse attendue de ${profileName(data,r.recipient_id)}`, route:requestRoute(r), sort:r.due_at ? new Date(r.due_at).getTime() : Infinity }));
      data.approvals.filter(a => a.requested_by === data.user.id && a.validator_id !== data.user.id && a.status === 'pending').forEach(a => rows.push({ projectId:a.project_id, title:approvalTitle(data,a), label:'En attente', tone:'', sub:`${projectName(data,a.project_id)} · validation attendue de ${profileName(data,a.validator_id)}`, route:approvalRoute(a), sort:Infinity }));
    } else {
      data.actions.filter(a => ids.has(a.id) && a.status === 'done').forEach(a => rows.push({ projectId:a.project_id, due:a.completed_at || a.updated_at, status:'done', title:a.title, label:'Terminée', tone:'', sub:`${projectName(data,a.project_id)}${a.completed_at ? ` · terminée ${fmtDateTime(a.completed_at)}` : ''}`, route:actionRoute(a), sort:-(new Date(a.completed_at || a.updated_at || a.created_at).getTime()) }));
      data.requests.filter(r => (r.recipient_id === data.user.id || r.requester_id === data.user.id) && ['answered','satisfied'].includes(r.status)).forEach(r => rows.push({ projectId:r.project_id, due:r.answered_at, status:'done', title:r.title, label:'Réponse', tone:'', sub:`${projectName(data,r.project_id)} · ${r.status === 'satisfied' ? 'clôturée' : 'répondue'}`, route:requestRoute(r), sort:-(new Date(r.answered_at || r.created_at).getTime()) }));
      data.approvals.filter(a => a.validator_id === data.user.id && ['approved','changes_requested'].includes(a.status)).forEach(a => rows.push({ projectId:a.project_id, due:a.decided_at, status:'done', title:approvalTitle(data,a), label:a.status === 'approved' ? 'Validée' : 'Modifications demandées', tone:'', sub:`${projectName(data,a.project_id)} · traité`, route:approvalRoute(a), sort:-(new Date(a.decided_at || a.created_at).getTime()) }));
    }
    if (workState.project !== 'all') rows = rows.filter(r => r.projectId === workState.project);
    if (workState.horizon !== 'all') rows = rows.filter(r => horizonPass(r.due, workState.horizon, r.status));
    return rows.sort((a,b) => (a.sort ?? Infinity) - (b.sort ?? Infinity)).slice(0,100);
  }

  function patchMyWork(data) {
    if (!location.hash.startsWith('#/work')) return;
    const content = app.querySelector('.live-content');
    if (!content) return;
    const pageHead = content.querySelector('.page-head-v3');
    const nativeTriage = content.querySelector('.triage-bar');
    const nativeGrid = content.querySelector('.triage-grid');
    if (!pageHead || (!nativeTriage && !content.querySelector('[data-daily-work-panel]'))) return;
    nativeTriage?.remove();
    nativeGrid?.remove();
    content.querySelector('[data-daily-work-panel]')?.remove();
    const counts = workCounts(data);
    const rows = filteredRows(data);
    const panel = document.createElement('section');
    panel.className = 'card daily-work-panel';
    panel.dataset.dailyWorkPanel = '1';
    panel.innerHTML = `<div class="section-head compact"><div><span class="eyebrow">Vue personnelle</span><h2>Ce qui vous concerne</h2></div><span class="daily-work-summary">${rows.length} élément${rows.length > 1 ? 's' : ''}</span></div><div class="daily-work-tabs" role="tablist" aria-label="Filtrer Mon travail">${[['todo','À faire'],['respond','À valider / répondre'],['waiting','En attente'],['done','Terminées']].map(([key,label]) => `<button class="daily-work-tab ${workState.filter === key ? 'active' : ''}" type="button" data-daily-work-filter="${key}" aria-selected="${workState.filter === key ? 'true' : 'false'}">${label}<b>${counts[key]}</b></button>`).join('')}</div><div class="daily-work-controls"><label>Projet<select data-daily-work-project><option value="all">Tous les projets</option>${data.projects.map(p => `<option value="${p.id}" ${workState.project === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></label><label>Horizon<select data-daily-work-horizon><option value="all" ${workState.horizon === 'all' ? 'selected' : ''}>Toutes les échéances</option><option value="overdue" ${workState.horizon === 'overdue' ? 'selected' : ''}>En retard</option><option value="today" ${workState.horizon === 'today' ? 'selected' : ''}>Aujourd’hui</option><option value="week" ${workState.horizon === 'week' ? 'selected' : ''}>7 prochains jours</option></select></label></div>${rows.length ? `<div class="daily-work-list">${rows.map(row => `<a class="daily-work-row" href="${esc(row.route)}"><span class="daily-work-status ${row.tone || ''}">${esc(row.label)}</span><span class="daily-work-copy"><strong>${esc(row.title)}</strong><small>${esc(row.sub)}</small></span><span>›</span></a>`).join('')}</div>` : `<div class="daily-work-empty"><strong>${workState.filter === 'todo' ? 'Aucune action à faire dans ce filtre.' : workState.filter === 'respond' ? 'Aucune réponse ou validation en attente.' : workState.filter === 'waiting' ? 'Vous n’attendez rien de l’équipe dans ce filtre.' : 'Aucun élément terminé dans ce filtre.'}</strong><span>Changez de filtre ou reprenez un projet depuis l’accueil.</span></div>`}`;
    pageHead.insertAdjacentElement('afterend', panel);
    const intro = pageHead.querySelector('p');
    if (intro) intro.textContent = 'Actions, réponses, validations et attentes réunies dans une seule liste filtrable.';
  }

  async function scan() {
    ensureStyles();
    const data = await snapshot().catch(() => null);
    if (!data) return;
    patchDashboard(data);
    patchMyWork(data);
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; scan().catch(console.warn); });
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-daily-work-filter]');
    if (!button) return;
    workState.filter = button.dataset.dailyWorkFilter || 'todo';
    schedule();
  });
  document.addEventListener('change', (event) => {
    if (event.target.matches('[data-daily-work-project]')) { workState.project = event.target.value || 'all'; schedule(); }
    if (event.target.matches('[data-daily-work-horizon]')) { workState.horizon = event.target.value || 'all'; schedule(); }
  });
  window.addEventListener('hashchange', schedule);
  const observer = new MutationObserver(schedule);
  observer.observe(app, { childList:true, subtree:true });
  schedule();
}

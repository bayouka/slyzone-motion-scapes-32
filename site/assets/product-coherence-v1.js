import { SupabaseBrowserClient } from './supabase-client.js';

const VERSION = '4b4c product coherence v1.0.0';
const config = window.__4B4C_CONFIG__ || {};
const app = document.getElementById('app');
if (!app || !config.supabaseUrl || !config.supabasePublishableKey) {
  console.warn(`${VERSION}: configuration unavailable`);
} else {
  const api = new SupabaseBrowserClient({ url: config.supabaseUrl, publishableKey: config.supabasePublishableKey });
  const workspaceKey = config.workspaceStorageKey || '4b4c.live.workspace.v1';
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
  const statusLabel = (value) => ({ todo:'À faire', in_progress:'En cours', blocked:'Bloqué', done:'Terminé', cancelled:'Annulé' }[value] || value || 'À faire');
  const priorityLabel = (value) => ({ low:'Basse', normal:'Normale', high:'Haute', urgent:'Urgente' }[value] || value || 'Normale');
  const fmtDateTime = (value) => {
    if (!value) return 'Aucune';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Aucune';
    return new Intl.DateTimeFormat('fr-FR', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }).format(date);
  };
  const fmtDate = (value) => {
    if (!value) return 'Aucune';
    const date = new Date(String(value).length === 10 ? `${value}T12:00:00` : value);
    if (Number.isNaN(date.getTime())) return 'Aucune';
    return new Intl.DateTimeFormat('fr-FR', { day:'numeric', month:'short' }).format(date);
  };
  const setText = (node, value) => {
    if (node && node.textContent !== value) node.textContent = value;
  };

  let cache = { workspaceId:'', at:0, data:null };
  let scheduled = false;
  let customModal = null;
  let nativeDeepLinkOpened = '';

  const workspaceId = () => localStorage.getItem(workspaceKey) || '';
  const projectIdFromHref = (href = '') => href.match(/#\/projects\/([^/]+)/)?.[1] || '';
  const currentHash = () => location.hash || '#/dashboard';
  const projectName = (data, id) => data.projects.find((p) => p.id === id)?.name || 'Projet';
  const profileName = (data, id) => data.profiles.find((p) => p.id === id)?.display_name || 'Membre';

  async function snapshot(force = false) {
    const wid = workspaceId();
    if (!wid || !api.getSession()) return null;
    if (!force && cache.data && cache.workspaceId === wid && Date.now() - cache.at < 2500) return cache.data;

    const user = await api.getUser();
    const [projects, actions, assignees, approvals, requests, decisions, profiles, membership, projectMembers, deliverables, versions] = await Promise.all([
      api.select('projects', `select=id,name,status,target_date,health,visibility,created_by&workspace_id=eq.${wid}&status=neq.archived&order=updated_at.desc`),
      api.select('actions', `select=*&workspace_id=eq.${wid}&order=created_at.desc&limit=500`),
      api.select('action_assignees', 'select=*'),
      api.select('approvals', `select=*&workspace_id=eq.${wid}&order=created_at.desc&limit=200`).catch(() => []),
      api.select('requests', `select=*&workspace_id=eq.${wid}&order=created_at.desc&limit=200`).catch(() => []),
      api.select('decisions', `select=*&workspace_id=eq.${wid}&order=created_at.desc&limit=200`).catch(() => []),
      api.select('profiles', 'select=id,display_name,avatar_url').catch(() => []),
      api.select('workspace_members', `select=workspace_id,user_id,role,status,access_mode&workspace_id=eq.${wid}&user_id=eq.${user.id}&status=eq.active`),
      api.select('project_members', `select=project_id,user_id,role&user_id=eq.${user.id}`).catch(() => []),
      api.select('deliverables', `select=id,project_id,title,status,visibility&workspace_id=eq.${wid}&limit=200`).catch(() => []),
      api.select('deliverable_versions', `select=id,deliverable_id,version_number,file_name,created_at&workspace_id=eq.${wid}&limit=300`).catch(() => [])
    ]);
    const milestones = projects.length
      ? await api.select('milestones', `select=*&project_id=in.(${projects.map((p) => p.id).join(',')})&order=position.asc`).catch(() => [])
      : [];
    const data = { wid, user, projects, actions, assignees, approvals, requests, decisions, profiles, membership:membership[0] || null, projectMembers, milestones, deliverables, versions };
    cache = { workspaceId:wid, at:Date.now(), data };
    return data;
  }

  function projectMetrics(data, projectId) {
    const phases = data.milestones.filter((m) => m.project_id === projectId && m.status !== 'cancelled');
    const donePhases = phases.filter((m) => m.status === 'done').length;
    const actions = data.actions.filter((a) => a.project_id === projectId && a.status !== 'cancelled');
    const openActions = actions.filter((a) => a.status !== 'done');
    const doneActions = actions.filter((a) => a.status === 'done').length;
    const ratio = phases.length ? donePhases / phases.length : actions.length ? doneActions / actions.length : 0;
    const progress = Math.max(0, Math.min(100, Math.round(ratio * 100)));
    const stepText = phases.length
      ? `${donePhases} étape${donePhases > 1 ? 's' : ''} sur ${phases.length} terminée${donePhases > 1 ? 's' : ''}`
      : actions.length
        ? `${doneActions} action${doneActions > 1 ? 's' : ''} sur ${actions.length} terminée${doneActions > 1 ? 's' : ''}`
        : 'Avancement à structurer';
    const actionText = openActions.length
      ? `${openActions.length} action${openActions.length > 1 ? 's' : ''} restante${openActions.length > 1 ? 's' : ''}`
      : 'Aucune action restante';
    return { phases, donePhases, actions, openActions, progress, stepText, actionText };
  }

  function canWriteProject(data, projectId) {
    const role = data.membership?.role;
    if (role === 'owner' || role === 'admin') return true;
    if (role !== 'member') return false;
    const project = data.projects.find((p) => p.id === projectId);
    if (project?.visibility === 'team') return true;
    const pm = data.projectMembers.find((row) => row.project_id === projectId && row.user_id === data.user.id);
    return Boolean(pm && ['lead','member'].includes(pm.role));
  }

  function actionDeepRoute(action) {
    return `#/projects/${action.project_id}/work/list/action/${action.id}`;
  }
  function decisionDeepRoute(decision) {
    return decision.project_id ? `#/projects/${decision.project_id}/overview/decision/${decision.id}` : '#/dashboard';
  }
  function requestDeepRoute(request) {
    return `#/work/request/${request.id}`;
  }
  function approvalDeepRoute(approval) {
    return `#/work/approval/${approval.id}`;
  }
  function baseRouteFromDeepLink(hash = currentHash()) {
    return hash
      .replace(/\/action\/[^/]+.*$/, '')
      .replace(/\/decision\/[^/]+.*$/, '')
      .replace(/\/request\/[^/]+.*$/, '')
      .replace(/\/approval\/[^/]+.*$/, '');
  }

  function ensureStyles() {
    if (document.getElementById('product-coherence-v1-styles')) return;
    const style = document.createElement('style');
    style.id = 'product-coherence-v1-styles';
    style.textContent = `
      .coherence-clickable{cursor:pointer}.coherence-clickable:focus-visible{outline:3px solid rgba(56,103,244,.35);outline-offset:4px;border-radius:12px}
      .coherence-action-detail,.coherence-decision-detail{display:grid;gap:18px}.coherence-detail-title{display:grid;gap:6px}.coherence-detail-title h3{margin:0;font-size:1.25rem}.coherence-detail-title p{margin:0;color:var(--live-muted);line-height:1.6}
      .coherence-detail-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.coherence-detail-cell{padding:12px 14px;border:1px solid var(--live-line,#e5e7eb);border-radius:14px;background:rgba(248,250,252,.75)}.coherence-detail-cell small{display:block;color:var(--live-muted);margin-bottom:4px}.coherence-detail-cell strong{display:block;overflow-wrap:anywhere}
      .coherence-block{padding:14px;border-radius:14px;background:rgba(220,38,38,.06);border:1px solid rgba(220,38,38,.18)}.coherence-block strong{display:block;margin-bottom:5px}.coherence-actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end}.coherence-actions .btn:first-child{margin-right:auto}
      .coherence-block-form{display:none;gap:10px;padding:14px;border:1px solid var(--live-line,#e5e7eb);border-radius:14px}.coherence-block-form.is-open{display:grid}.coherence-block-form textarea{min-height:88px}
      .coherence-filter-note{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 14px;padding:10px 12px;border:1px solid rgba(56,103,244,.16);background:rgba(56,103,244,.05);border-radius:12px;font-size:13px}.coherence-filter-note a{font-weight:700}
      .project-summary-card[data-coherence-metrics='1']>div:first-child strong{font-size:1.05rem;line-height:1.25}.project-card-v3[data-coherence-metrics='1'] .project-meta strong{font-size:.82rem}
      @media(max-width:640px){.coherence-detail-grid{grid-template-columns:1fr}.coherence-actions{justify-content:stretch}.coherence-actions .btn{flex:1 1 auto}.coherence-actions .btn:first-child{margin-right:0}}
    `;
    document.head.appendChild(style);
  }

  function patchProjectMetrics(data) {
    document.querySelectorAll('.project-card-v3').forEach((card) => {
      const pid = projectIdFromHref(card.getAttribute('href'));
      if (!pid) return;
      const metrics = projectMetrics(data, pid);
      const progressText = card.querySelector('.project-progress-row span:first-child');
      const metaStrong = card.querySelector('.project-meta strong');
      const bar = card.querySelector('.progress > span');
      setText(progressText, metrics.stepText);
      setText(metaStrong, metrics.actionText);
      if (bar) bar.style.width = `${metrics.progress}%`;
      const progress = card.querySelector('.progress');
      if (progress) progress.setAttribute('aria-label', `Avancement des étapes : ${metrics.stepText}`);
      card.dataset.coherenceMetrics = '1';
    });

    const match = currentHash().match(/^#\/projects\/([^/]+)\/overview/);
    if (match) {
      const pid = match[1];
      const metrics = projectMetrics(data, pid);
      const summary = document.querySelector('.project-summary-card');
      if (summary) {
        const label = summary.querySelector(':scope > div:first-child > span');
        const value = summary.querySelector(':scope > div:first-child > strong');
        const bar = summary.querySelector('.progress > span');
        const firstMeta = summary.querySelector('.project-summary-meta span:first-child');
        setText(label, metrics.phases.length ? 'Avancement des étapes' : 'Avancement');
        setText(value, metrics.stepText);
        if (bar) bar.style.width = `${metrics.progress}%`;
        setText(firstMeta, metrics.actionText);
        summary.dataset.coherenceMetrics = '1';
      }
      const externalMetric = document.querySelector('.external-summary > .card:first-child .metric');
      setText(externalMetric, metrics.stepText);
      const externalBar = document.querySelector('.external-summary > .card:first-child .progress > span');
      if (externalBar) externalBar.style.width = `${metrics.progress}%`;
    }
  }

  function patchHomeActionTypes(data) {
    document.querySelectorAll('.v43-attention-row[data-action="edit-action"][data-id]').forEach((row) => {
      const action = data.actions.find((item) => String(item.id) === String(row.dataset.id));
      if (!action) return;
      const kind = action.status === 'blocked' ? 'Blocage' : 'Action';
      const kindNode = row.querySelector('.attention-kind');
      const iconNode = row.querySelector('.attention-type-icon');
      setText(kindNode, kind);
      setText(iconNode, action.status === 'blocked' ? '!' : '○');
      row.dataset.coherenceEntity = 'action';
      row.dataset.coherenceProject = action.project_id;
      row.setAttribute('aria-label', `${kind} : ${action.title}`);
    });
  }

  function patchProjectAttentionLinks(data) {
    const match = currentHash().match(/^#\/projects\/([^/]+)\/overview/);
    if (!match) return;
    const pid = match[1];
    const mineIds = new Set(data.assignees.filter((row) => row.user_id === data.user.id).map((row) => row.action_id));
    const mine = data.actions.filter((a) => a.project_id === pid && mineIds.has(a.id) && !['done','cancelled'].includes(a.status));
    const approval = data.approvals.find((a) => a.project_id === pid && a.validator_id === data.user.id && a.status === 'pending');
    const request = data.requests.find((r) => r.project_id === pid && r.recipient_id === data.user.id && r.status === 'open');
    const attention = document.querySelector('.project-kpi-grid .mini-status-card:first-child');
    if (attention) {
      if (approval) attention.setAttribute('href', approvalDeepRoute(approval));
      else if (request) attention.setAttribute('href', requestDeepRoute(request));
      else if (mine.length) attention.setAttribute('href', `#/projects/${pid}/work/list/mine`);
    }
    const nowTitle = document.querySelector('.now-card .context-title')?.textContent?.trim();
    const nowLink = document.querySelector('.now-card .context-actions a[href]');
    if (nowTitle && nowLink && !approval && !request) {
      const action = mine.find((a) => a.title.trim() === nowTitle) || data.actions.find((a) => a.project_id === pid && a.title.trim() === nowTitle);
      if (action) nowLink.setAttribute('href', actionDeepRoute(action));
    }
    const memory = document.querySelector('.memory-row');
    const decisionTitle = memory?.querySelector('strong')?.textContent?.trim();
    if (memory && decisionTitle) {
      const decision = data.decisions.find((d) => d.project_id === pid && d.title.trim() === decisionTitle);
      if (decision) {
        memory.classList.add('coherence-clickable');
        memory.tabIndex = 0;
        memory.setAttribute('role', 'button');
        memory.dataset.coherenceDecision = decision.id;
        memory.setAttribute('aria-label', `Ouvrir la décision ${decision.title}`);
      }
    }
  }

  function matchByTitleAndProject(items, title, projectLabel, data) {
    const normalizedTitle = String(title || '').trim();
    const normalizedProject = String(projectLabel || '').trim();
    return items.find((item) => item.title?.trim() === normalizedTitle && (!normalizedProject || projectName(data, item.project_id) === normalizedProject))
      || items.find((item) => item.title?.trim() === normalizedTitle)
      || null;
  }

  function patchSearchResults(data) {
    document.querySelectorAll('.search-result').forEach((link) => {
      const type = link.querySelector('.pill')?.textContent?.trim();
      const title = link.querySelector('strong')?.textContent?.trim();
      const project = link.querySelector('small')?.textContent?.trim();
      if (!type || !title) return;
      if (type === 'Action') {
        const action = matchByTitleAndProject(data.actions, title, project, data);
        if (action) link.setAttribute('href', actionDeepRoute(action));
      } else if (type === 'Décision') {
        const decision = matchByTitleAndProject(data.decisions, title, project, data);
        if (decision) link.setAttribute('href', decisionDeepRoute(decision));
      } else if (type === 'Demande') {
        const request = matchByTitleAndProject(data.requests, title, project, data);
        if (request) link.setAttribute('href', requestDeepRoute(request));
      }
    });
  }

  function patchCatchupAndNotifications(data) {
    document.querySelectorAll('.catchup-event-v41').forEach((link) => {
      const label = link.querySelector('.change-tag')?.textContent?.trim();
      const title = link.querySelector('strong')?.textContent?.trim();
      const sub = link.querySelector('small')?.textContent?.split(' · ')[0]?.trim();
      if (!title) return;
      if (label === 'Décision') {
        const decision = matchByTitleAndProject(data.decisions, title, sub, data);
        if (decision) link.setAttribute('href', decisionDeepRoute(decision));
      } else if (['Résolu','Pour vous','À savoir'].includes(label)) {
        const action = matchByTitleAndProject(data.actions, title, sub, data);
        if (action) link.setAttribute('href', actionDeepRoute(action));
      }
    });

    document.querySelectorAll('.notification-panel [data-action="open-notification"]').forEach((row) => {
      const title = row.querySelector('strong')?.textContent?.trim();
      const kind = row.querySelector('small')?.textContent?.split(' · ')[0]?.trim();
      if (!title || !kind) return;
      if (kind === 'Affectation') {
        const action = data.actions.find((a) => a.title?.trim() === title);
        if (action) row.dataset.route = actionDeepRoute(action);
      } else if (kind === 'Demande') {
        const request = data.requests.find((r) => r.title?.trim() === title);
        if (request) row.dataset.route = requestDeepRoute(request);
      }
    });
  }

  function patchMineFilter(data) {
    const match = currentHash().match(/^#\/projects\/([^/]+)\/work\/list\/mine/);
    if (!match) return;
    const pid = match[1];
    const assigned = new Set(data.assignees.filter((row) => row.user_id === data.user.id).map((row) => String(row.action_id)));
    document.querySelectorAll('.action-row-v4').forEach((row) => {
      const id = row.dataset.id;
      if (id) row.hidden = !assigned.has(String(id));
      else {
        const title = row.querySelector('strong')?.textContent?.trim();
        const action = data.actions.find((a) => a.project_id === pid && a.title?.trim() === title);
        row.hidden = !action || !assigned.has(String(action.id));
      }
    });
    const toolbar = document.querySelector('.work-toolbar');
    if (toolbar && !document.querySelector('.coherence-filter-note')) {
      const note = document.createElement('div');
      note.className = 'coherence-filter-note';
      note.innerHTML = `<span>Affichage : <strong>vos actions dans ${esc(projectName(data, pid))}</strong></span><a href="#/projects/${pid}/work/list">Voir toutes les actions</a>`;
      toolbar.insertAdjacentElement('afterend', note);
    }
  }

  function closeCustomModal({ restoreRoute = false } = {}) {
    if (customModal) customModal.remove();
    customModal = null;
    if (restoreRoute) {
      const base = baseRouteFromDeepLink();
      if (base && base !== currentHash()) location.hash = base.replace(/^#/, '');
    }
  }

  function modalShell(title, subtitle, body, kind, id) {
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop context-drawer-backdrop-v43 coherence-owned-modal';
    wrap.dataset.coherenceModal = `${kind}:${id}`;
    wrap.innerHTML = `<div class="modal context-drawer-v43" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="card-head"><div><h2>${esc(title)}</h2><p style="margin:4px 0 0;color:var(--live-muted)">${esc(subtitle || '')}</p></div><button class="icon-button" type="button" data-coherence-action="close" aria-label="Fermer">✕</button></div>${body}</div>`;
    wrap.addEventListener('click', (event) => {
      if (event.target === wrap) closeCustomModal({ restoreRoute:true });
    });
    return wrap;
  }

  async function openActionDetail(actionId) {
    const data = await snapshot(true);
    if (!data) return;
    const action = data.actions.find((item) => String(item.id) === String(actionId));
    if (!action) return;
    if (customModal?.dataset.coherenceModal === `action:${action.id}`) return;
    closeCustomModal();
    const milestone = data.milestones.find((m) => m.id === action.milestone_id);
    const assigneeIds = data.assignees.filter((row) => row.action_id === action.id).map((row) => row.user_id);
    const assignees = assigneeIds.length ? assigneeIds.map((id) => profileName(data, id)).join(', ') : 'Non assignée';
    const writable = canWriteProject(data, action.project_id);
    const source = action.source_type ? ({ message:'Message', meeting:'Réunion', note:'Note' }[action.source_type] || 'Élément lié') : 'Aucun lien source';
    const primary = action.status === 'todo' ? 'start' : action.status === 'in_progress' ? 'done' : action.status === 'blocked' ? 'resume' : action.status === 'done' ? 'reopen' : '';
    const primaryLabel = { start:'Commencer', done:'Terminer', resume:'Reprendre', reopen:'Réouvrir' }[primary] || '';
    const body = `<div class="coherence-action-detail"><div class="coherence-detail-title"><h3>${esc(action.title)}</h3><p>${esc(action.description || 'Aucune description. Ajoutez un résultat attendu dans les détails si nécessaire.')}</p></div><div class="coherence-detail-grid"><div class="coherence-detail-cell"><small>Projet</small><strong>${esc(projectName(data, action.project_id))}</strong></div><div class="coherence-detail-cell"><small>Phase</small><strong>${esc(milestone?.title || 'Hors roadmap')}</strong></div><div class="coherence-detail-cell"><small>Responsable</small><strong>${esc(assignees)}</strong></div><div class="coherence-detail-cell"><small>État</small><strong>${esc(statusLabel(action.status))}</strong></div><div class="coherence-detail-cell"><small>Échéance</small><strong>${esc(fmtDateTime(action.due_at))}</strong></div><div class="coherence-detail-cell"><small>Priorité</small><strong>${esc(priorityLabel(action.priority))}</strong></div><div class="coherence-detail-cell"><small>Contexte source</small><strong>${esc(source)}</strong></div><div class="coherence-detail-cell"><small>Visibilité</small><strong>${action.visibility === 'shared' ? 'Partagée' : 'Interne'}</strong></div></div>${action.status === 'blocked' ? `<div class="coherence-block"><strong>Blocage actuel</strong><span>${esc(action.blocked_reason || 'Cause non renseignée')}</span></div>` : ''}${writable && !['done','cancelled','blocked'].includes(action.status) ? `<form class="coherence-block-form" data-coherence-form="block" data-action-id="${esc(action.id)}"><label for="coherence-block-reason-${esc(action.id)}"><strong>Pourquoi cette action est-elle bloquée ?</strong></label><textarea id="coherence-block-reason-${esc(action.id)}" name="reason" required placeholder="Le prérequis manquant et ce qui permettra de reprendre."></textarea><div class="coherence-actions"><button class="btn" type="button" data-coherence-action="cancel-block">Annuler</button><button class="btn danger" type="submit">Enregistrer le blocage</button></div></form>` : ''}<div class="coherence-actions"><a class="btn" href="#/projects/${action.project_id}/work/list">Voir le travail du projet</a>${writable ? `<button class="btn" type="button" data-action="edit-action" data-id="${esc(action.id)}" data-coherence-native-edit="1">Modifier les détails</button>` : ''}${writable && !['done','cancelled','blocked'].includes(action.status) ? `<button class="btn" type="button" data-coherence-action="show-block">Signaler un blocage</button>` : ''}${writable && primary ? `<button class="btn primary" type="button" data-coherence-action="status" data-status-command="${primary}" data-action-id="${esc(action.id)}">${primaryLabel}</button>` : ''}</div></div>`;
    customModal = modalShell(action.title, `${projectName(data, action.project_id)} · Action`, body, 'action', action.id);
    document.body.appendChild(customModal);
    requestAnimationFrame(() => customModal.querySelector('[data-coherence-action="close"]')?.focus());
  }

  async function openDecisionDetail(decisionId) {
    const data = await snapshot(true);
    if (!data) return;
    const decision = data.decisions.find((item) => String(item.id) === String(decisionId));
    if (!decision) return;
    if (customModal?.dataset.coherenceModal === `decision:${decision.id}`) return;
    closeCustomModal();
    const body = `<div class="coherence-decision-detail"><div class="coherence-detail-title"><h3>${esc(decision.title)}</h3><p>${esc(decision.rationale || 'Aucune justification renseignée.')}</p></div><div class="coherence-detail-grid"><div class="coherence-detail-cell"><small>Projet</small><strong>${esc(projectName(data, decision.project_id))}</strong></div><div class="coherence-detail-cell"><small>État</small><strong>${decision.status === 'superseded' ? 'Remplacée' : decision.status === 'cancelled' ? 'Annulée' : 'Décidée'}</strong></div><div class="coherence-detail-cell"><small>Décideur</small><strong>${esc(profileName(data, decision.decided_by || decision.created_by))}</strong></div><div class="coherence-detail-cell"><small>Date</small><strong>${esc(fmtDate(decision.decided_at || decision.created_at))}</strong></div></div><div class="coherence-actions"><a class="btn primary" href="#/projects/${decision.project_id}/overview">Ouvrir le projet</a></div></div>`;
    customModal = modalShell(decision.title, `${projectName(data, decision.project_id)} · Décision`, body, 'decision', decision.id);
    document.body.appendChild(customModal);
    requestAnimationFrame(() => customModal.querySelector('[data-coherence-action="close"]')?.focus());
  }

  async function updateActionStatus(actionId, command) {
    const data = await snapshot(true);
    const action = data?.actions.find((item) => String(item.id) === String(actionId));
    if (!action || !canWriteProject(data, action.project_id)) return;
    const patch = command === 'start'
      ? { status:'in_progress', blocked_reason:null, completed_at:null }
      : command === 'done'
        ? { status:'done', blocked_reason:null, completed_at:new Date().toISOString() }
        : command === 'resume'
          ? { status:'in_progress', blocked_reason:null, completed_at:null }
          : command === 'reopen'
            ? { status:'todo', blocked_reason:null, completed_at:null }
            : null;
    if (!patch) return;
    await api.update('actions', `id=eq.${action.id}`, patch, { returnRepresentation:false });
    cache.at = 0;
    await openActionDetail(action.id);
  }

  async function blockAction(actionId, reason) {
    const data = await snapshot(true);
    const action = data?.actions.find((item) => String(item.id) === String(actionId));
    if (!action || !canWriteProject(data, action.project_id)) return;
    await api.update('actions', `id=eq.${action.id}`, { status:'blocked', blocked_reason:String(reason || '').trim(), completed_at:null }, { returnRepresentation:false });
    cache.at = 0;
    await openActionDetail(action.id);
  }

  function invokeNativeDetail(action, id) {
    const button = document.createElement('button');
    button.hidden = true;
    button.dataset.action = action;
    if (action === 'open-request') button.dataset.request = id;
    if (action === 'open-approval') button.dataset.approval = id;
    app.appendChild(button);
    button.click();
    button.remove();
  }

  async function applyDeepLink() {
    const hash = currentHash();
    const actionId = hash.match(/\/action\/([^/]+)/)?.[1];
    if (actionId) {
      await openActionDetail(actionId);
      return;
    }
    const decisionId = hash.match(/\/decision\/([^/]+)/)?.[1];
    if (decisionId) {
      await openDecisionDetail(decisionId);
      return;
    }
    const requestId = hash.match(/\/request\/([^/]+)/)?.[1];
    if (requestId && nativeDeepLinkOpened !== hash) {
      nativeDeepLinkOpened = hash;
      invokeNativeDetail('open-request', requestId);
      return;
    }
    const approvalId = hash.match(/\/approval\/([^/]+)/)?.[1];
    if (approvalId && nativeDeepLinkOpened !== hash) {
      nativeDeepLinkOpened = hash;
      invokeNativeDetail('open-approval', approvalId);
    }
  }

  async function enhance() {
    ensureStyles();
    const data = await snapshot();
    if (!data) return;
    patchProjectMetrics(data);
    patchHomeActionTypes(data);
    patchProjectAttentionLinks(data);
    patchSearchResults(data);
    patchCatchupAndNotifications(data);
    patchMineFilter(data);
    await applyDeepLink();
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(async () => {
      scheduled = false;
      try { await enhance(); } catch (error) { console.warn(`${VERSION}: enhancement failed`, error); }
    });
  }

  document.addEventListener('click', (event) => {
    const nativeEdit = event.target.closest('[data-action="edit-action"][data-coherence-native-edit="1"]');
    if (nativeEdit) {
      closeCustomModal();
      return;
    }
    const actionTarget = event.target.closest('[data-action="edit-action"][data-id]');
    if (actionTarget) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const actionId = actionTarget.dataset.id;
      snapshot().then((data) => {
        const action = data?.actions.find((item) => String(item.id) === String(actionId));
        if (action) location.hash = actionDeepRoute(action).replace(/^#/, '');
      });
      return;
    }
    const decisionTarget = event.target.closest('[data-coherence-decision]');
    if (decisionTarget) {
      event.preventDefault();
      event.stopImmediatePropagation();
      snapshot().then((data) => {
        const decision = data?.decisions.find((item) => String(item.id) === String(decisionTarget.dataset.coherenceDecision));
        if (decision) location.hash = decisionDeepRoute(decision).replace(/^#/, '');
      });
      return;
    }
    const custom = event.target.closest('[data-coherence-action]');
    if (!custom) return;
    const action = custom.dataset.coherenceAction;
    if (action === 'close') {
      event.preventDefault();
      closeCustomModal({ restoreRoute:true });
    } else if (action === 'show-block') {
      event.preventDefault();
      customModal?.querySelector('.coherence-block-form')?.classList.add('is-open');
      customModal?.querySelector('.coherence-block-form textarea')?.focus();
    } else if (action === 'cancel-block') {
      event.preventDefault();
      custom.closest('.coherence-block-form')?.classList.remove('is-open');
    } else if (action === 'status') {
      event.preventDefault();
      updateActionStatus(custom.dataset.actionId, custom.dataset.statusCommand).catch((error) => console.warn(`${VERSION}: status update failed`, error));
    }
  }, true);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && customModal) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeCustomModal({ restoreRoute:true });
      return;
    }
    const target = event.target.closest?.('[data-coherence-decision]');
    if (target && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      target.click();
    }
  }, true);

  document.addEventListener('submit', (event) => {
    const form = event.target.closest('[data-coherence-form="block"]');
    if (!form) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const reason = new FormData(form).get('reason');
    if (!String(reason || '').trim()) return;
    blockAction(form.dataset.actionId, reason).catch((error) => console.warn(`${VERSION}: block update failed`, error));
  }, true);

  window.addEventListener('hashchange', () => {
    nativeDeepLinkOpened = '';
    if (!/\/(?:action|decision)\//.test(currentHash())) closeCustomModal();
    cache.at = 0;
    schedule();
  });

  const observer = new MutationObserver(schedule);
  observer.observe(app, { childList:true, subtree:true });
  schedule();
}

import { SupabaseBrowserClient } from './supabase-client.js';

const VERSION = '2b2c workflow backend safe v1.1.0';
const config = window.__4B4C_CONFIG__ || {};
const workspaceKey = config.workspaceStorageKey || '4b4c.live.workspace.v1';
const api = new SupabaseBrowserClient({ url: config.supabaseUrl, publishableKey: config.supabasePublishableKey });

const workspaceId = () => localStorage.getItem(workspaceKey) || '';
const val = (fd, key, fallback = '') => String(fd.get(key) ?? fallback).trim();
const vals = (fd, key) => fd.getAll(key).map(String).filter(Boolean);
const one = (value) => Array.isArray(value) ? (value[0] ?? null) : value;
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

function localIso(value) {
  if (!value) return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
function scalar(value) {
  if (Array.isArray(value)) return scalar(value[0]);
  if (value && typeof value === 'object') return value.id || value.project_id || Object.values(value)[0];
  return value;
}
function stop(event) {
  event.preventDefault();
  event.stopImmediatePropagation();
}
function setBusy(form, busy) {
  form.querySelectorAll('button,input,select,textarea').forEach((el) => { el.disabled = busy; });
}
function notice(form, message, error = false) {
  let node = form.querySelector('[data-workflow-safe-feedback]');
  if (!node) {
    node = document.createElement('div');
    node.dataset.workflowSafeFeedback = '1';
    const actions = form.querySelector('.modal-actions,.project-close-actions,.meeting-edit-actions');
    (actions || form).insertAdjacentElement(actions ? 'beforebegin' : 'afterbegin', node);
  }
  node.className = `notice${error ? ' danger' : ''}`;
  node.setAttribute('role', error ? 'alert' : 'status');
  node.textContent = message;
}
function failText(error) {
  const msg = String(error?.message || error || 'Erreur inconnue');
  const map = [
    ['ACTION_MANAGE_DENIED','Seul le responsable autorisé peut modifier les détails ou le responsable de cette action.'],
    ['ACTION_STATUS_DENIED','Vous ne pouvez pas changer le statut de cette action.'],
    ['ACTION_BLOCK_REASON_REQUIRED','Indiquez la cause du blocage.'],
    ['ACTION_ASSIGNEE_DENIED','Cette personne ne peut pas être responsable de cette action.'],
    ['ACTION_MILESTONE_CONTEXT_MISMATCH','Le jalon choisi appartient à un autre projet.'],
    ['MILESTONE_MANAGE_DENIED','Vous ne pouvez pas modifier ce jalon.'],
    ['MILESTONE_HAS_OPEN_ACTIONS','Ce jalon contient encore des actions ouvertes.'],
    ['MILESTONE_OWNER_DENIED','Cette personne ne peut pas être responsable de ce jalon.'],
    ['MEETING_ATTENDEE_NO_PROJECT_ACCESS','Un participant sélectionné n’a pas accès à ce projet.'],
    ['GUEST_MEETING_REQUIRES_SHARED_PROJECT','Un invité externe nécessite une réunion partagée liée à un projet commun.'],
    ['PROJECT_STATUS_USE_WORKFLOW','Utilisez Pause, Reprise, Terminer ou Réouvrir pour changer l’état du projet.'],
    ['PROJECT_WRITE_DENIED','Ce projet est en lecture seule ou vous n’avez pas les droits nécessaires.'],
    ['DELIVERABLE_VERSION_IMMUTABLE','Cette version est figée. Ajoutez une nouvelle version au lieu de modifier l’ancienne.'],
    ['APPROVAL_CHANGE_NOTE_REQUIRED','Expliquez les modifications attendues.'],
    ['APPROVAL_ALREADY_FINAL','Cette validation a déjà été traitée ou remplacée par une version plus récente.'],
    ['APPROVAL_ONLY_VALIDATOR_CAN_DECIDE','Seul le validateur désigné peut prendre cette décision.'],
    ['PROJECT_APPROVAL_CLOSED','Ce projet est clôturé ; cette validation ne peut plus être modifiée.'],
    ['PROJECT_PENDING_APPROVALS','Une validation est encore en attente. Traitez-la ou annulez-la avant de terminer le projet.'],
    ['PROJECT_REFERENCE_VERSION_REQUIRED','Sélectionnez au moins une version finale de référence avant de terminer le projet.'],
    ['REFERENCE_VERSION_CHANGES_REQUESTED','Une version sélectionnée a reçu une demande de modifications et ne peut pas être utilisée comme référence finale.'],
    ['REFERENCE_VERSION_MISMATCH','Une version de référence ne correspond pas à ce projet.'],
    ['OPEN_COMMITMENTS_CONFIRMATION_REQUIRED','Des engagements restent ouverts. Confirmez explicitement leur transmission avant de clôturer.'],
    ['PROJECT_REMAINING_REQUIRED','Précisez ce qu’il reste à transmettre ou à traiter.'],
    ['FORBIDDEN','Vous n’avez pas le droit d’effectuer cette modification.'],
  ];
  return map.find(([code]) => msg.includes(code))?.[1] || msg;
}
async function done(form, message, hash = '') {
  notice(form, message);
  if (hash) location.hash = hash;
  setTimeout(() => location.reload(), 120);
}
async function currentUserId() {
  const user = await api.getUser();
  return user?.id || user?.user?.id || '';
}
function safeFileName(name) {
  return String(name || 'fichier').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/^-+|-+$/g,'') || 'fichier';
}
function filePath(projectId, file) {
  return `${workspaceId()}/${projectId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
}

async function submitAction(form, fd) {
  const projectId = val(fd,'projectId');
  const id = scalar(await api.rpc('create_action_v1', {
    p_project_id: projectId,
    p_title: val(fd,'title'),
    p_description: val(fd,'description'),
    p_priority: val(fd,'priority','normal') || 'normal',
    p_due_at: localIso(val(fd,'dueAt')),
    p_milestone_id: val(fd,'milestoneId') || null,
    p_assignee_id: val(fd,'assignee') || null,
    p_visibility: val(fd,'visibility','internal') || 'internal',
  }));
  const sourceType = val(fd,'sourceType');
  const sourceId = val(fd,'sourceId');
  if (id && (sourceType || sourceId)) {
    await api.update('actions', `id=eq.${id}`, { source_type: sourceType || null, source_id: sourceId || null }, { returnRepresentation:false }).catch(()=>{});
  }
  await done(form,'Action créée.', projectId ? `#/projects/${projectId}/work/list` : '#/work');
}
async function submitActionEdit(form, fd) {
  const actionId = val(fd,'actionId');
  const projectId = val(fd,'projectId');
  const status = val(fd,'status','todo') || 'todo';
  await api.rpc('update_action_v1', {
    p_action_id: actionId,
    p_title: val(fd,'title'),
    p_description: val(fd,'description'),
    p_priority: val(fd,'priority','normal') || 'normal',
    p_due_at: localIso(val(fd,'dueAt')),
    p_milestone_id: val(fd,'milestoneId') || null,
    p_assignee_id: val(fd,'assignee') || null,
    p_visibility: val(fd,'visibility','internal') || 'internal',
  });
  await api.rpc('set_action_status_v1', {
    p_action_id: actionId,
    p_status: status,
    p_blocked_reason: status === 'blocked' ? (val(fd,'blockedReason') || null) : null,
  });
  await done(form,'Action mise à jour.', projectId ? `#/projects/${projectId}/work/list` : '#/work');
}
async function submitMilestone(form, fd, editing = false) {
  const projectId = val(fd,'projectId');
  if (editing) {
    await api.rpc('update_milestone_v1', {
      p_milestone_id: val(fd,'milestoneId'),
      p_title: val(fd,'title'),
      p_description: val(fd,'description'),
      p_status: val(fd,'status','todo') || 'todo',
      p_start_date: val(fd,'startDate') || null,
      p_due_date: val(fd,'dueDate') || null,
      p_owner_id: val(fd,'ownerId') || null,
      p_visibility: val(fd,'visibility','internal') || 'internal',
    });
  } else {
    await api.rpc('create_milestone_v1', {
      p_project_id: projectId,
      p_title: val(fd,'title'),
      p_description: val(fd,'description'),
      p_start_date: val(fd,'startDate') || null,
      p_due_date: val(fd,'dueDate') || null,
      p_owner_id: val(fd,'ownerId') || null,
      p_visibility: val(fd,'visibility','internal') || 'internal',
    });
  }
  await done(form, editing ? 'Jalon mis à jour.' : 'Jalon ajouté.', `#/projects/${projectId}/work/roadmap`);
}
async function submitMeeting(form, fd) {
  const meetingId = scalar(await api.rpc('create_meeting_with_attendees_v1', {
    p_workspace_id: workspaceId(),
    p_title: val(fd,'title'),
    p_starts_at: localIso(val(fd,'startsAt')),
    p_ends_at: localIso(val(fd,'endsAt')),
    p_project_id: val(fd,'projectId') || null,
    p_video_room: val(fd,'videoRoom') || null,
    p_visibility: val(fd,'visibility','internal') || 'internal',
    p_attendee_ids: vals(fd,'attendeeIds'),
  }));
  const agenda = val(fd,'agenda');
  if (meetingId && agenda) await api.update('meetings', `id=eq.${meetingId}`, { agenda }, { returnRepresentation:false });
  await done(form,'Réunion planifiée.', meetingId ? `#/calendar/meeting/${meetingId}` : '#/calendar');
}
async function submitMemberManage(form, fd) {
  const role = val(fd,'role','member') || 'member';
  let projectIds = vals(fd,'projectIds');
  if (role === 'admin') projectIds = [];
  if (role === 'member') {
    const projects = await api.select('projects', `select=id,visibility&workspace_id=eq.${workspaceId()}&status=neq.archived`);
    const restricted = new Set(projects.filter((p) => p.visibility === 'restricted').map((p) => p.id));
    projectIds = projectIds.filter((id) => restricted.has(id));
  }
  await api.rpc('set_workspace_member_access_v1', {
    p_workspace_id: workspaceId(),
    p_user_id: val(fd,'userId'),
    p_role: role,
    p_project_ids: projectIds,
  });
  await done(form,'Accès du membre mis à jour.','#/team');
}
async function submitProjectEdit(form, fd) {
  const projectId = val(fd,'projectId');
  await api.update('projects', `id=eq.${projectId}`, {
    name: val(fd,'name'), objective: val(fd,'objective'), target_date: val(fd,'targetDate') || null,
  }, { returnRepresentation:false });
  await done(form,'Projet mis à jour.',`#/projects/${projectId}/overview`);
}

async function submitDeliverableUpload(form, fd) {
  const projectId = val(fd,'projectId');
  const file = form.querySelector('input[type=file]')?.files?.[0];
  if (!file) throw new Error('Fichier requis');
  if (file.size > 50 * 1024 * 1024) throw new Error('Le fichier dépasse 50 Mo');
  const uid = await currentUserId();
  if (!uid) throw new Error('Votre session a expiré. Reconnectez-vous.');
  const visibility = val(fd,'visibility','internal') || 'internal';
  const path = filePath(projectId,file);
  const created = await api.insert('deliverables',[{
    workspace_id: workspaceId(), project_id: projectId, title: val(fd,'title'), description:'',
    visibility, status:'draft', created_by:uid,
  }]);
  const deliverable = one(created);
  if (!deliverable?.id) throw new Error('Le livrable n’a pas pu être créé.');
  let uploaded = false;
  try {
    await api.upload('workspace-files',path,file);
    uploaded = true;
    const registered = one(await api.rpc('register_deliverable_version_v3',{
      p_deliverable_id:deliverable.id,
      p_storage_path:path,
      p_file_name:file.name,
      p_mime_type:file.type || null,
      p_size_bytes:file.size,
      p_share_external:visibility === 'shared',
    })) || {};
    const number = Number(registered.version_number || registered.register_deliverable_version_v3?.version_number || 1);
    await done(form,`Livrable ajouté · version ${number} figée.`,`#/projects/${projectId}/resources`);
  } catch (error) {
    if (uploaded) { try { await api.removeObject('workspace-files',path); } catch {} }
    try { await api.remove('deliverables',`id=eq.${deliverable.id}`); } catch {}
    throw error;
  }
}
async function submitDeliverableVersion(form, fd) {
  const deliverableId = val(fd,'deliverableId');
  const projectId = val(fd,'projectId');
  const file = form.querySelector('input[type=file]')?.files?.[0];
  if (!file) throw new Error('Fichier requis');
  if (file.size > 50 * 1024 * 1024) throw new Error('Le fichier dépasse 50 Mo');
  const path = filePath(projectId,file);
  let uploaded = false;
  try {
    await api.upload('workspace-files',path,file);
    uploaded = true;
    const registered = one(await api.rpc('register_deliverable_version_v3',{
      p_deliverable_id:deliverableId,
      p_storage_path:path,
      p_file_name:file.name,
      p_mime_type:file.type || null,
      p_size_bytes:file.size,
      p_share_external:false,
    })) || {};
    const number = Number(registered.version_number || 0);
    await done(form,number ? `Version ${number} ajoutée et figée.` : 'Nouvelle version ajoutée et figée.',`#/projects/${projectId}/resources`);
  } catch (error) {
    if (uploaded) { try { await api.removeObject('workspace-files',path); } catch {} }
    throw error;
  }
}
async function submitApprovalRequest(form, fd) {
  const projectId = val(fd,'projectId');
  const result = one(await api.rpc('request_deliverable_approval_v1',{
    p_deliverable_id:val(fd,'deliverableId'),
    p_version_id:val(fd,'versionId'),
    p_validator_id:val(fd,'validatorId'),
    p_request_note:val(fd,'comment'),
  })) || {};
  const shared = Boolean(result.shared_external);
  await done(form,shared ? 'Validation demandée · cette version précise est partagée avec l’invité.' : 'Validation demandée sur cette version précise.',`#/projects/${projectId}/resources`);
}
async function submitProjectCompletionV2(form, fd, legacy = false) {
  const projectId = val(fd,'projectId');
  let versionIds = vals(fd,'referenceVersionIds');
  if (legacy) {
    const deliverableIds = new Set(vals(fd,'referenceDeliverableIds'));
    const preview = one(await api.rpc('get_project_closure_preview_v2',{p_project_id:projectId})) || {};
    const candidates = Array.isArray(preview.reference_candidates) ? preview.reference_candidates : [];
    versionIds = candidates.filter((c) => deliverableIds.has(String(c.deliverable_id))).map((c) => String(c.version_id));
  }
  await api.rpc('complete_project_v2',{
    p_project_id:projectId,
    p_result:val(fd,'result'),
    p_reference_version_ids:versionIds,
    p_remaining:val(fd,'remaining'),
    p_confirm_open:val(fd,'confirmOpen') === '1',
  });
  await done(form,'Projet clôturé · les versions finales de référence sont figées.',`#/projects/${projectId}/overview`);
}

function approvalLabel(status) {
  return ({approved:'Approuvée',pending:'En attente',changes_requested:'Modifications demandées',not_requested:'Sans validation'})[status] || status || 'Sans validation';
}
function closeSafeModal() {
  document.querySelector('[data-safe-project-complete]')?.remove();
}
function renderProjectCompletionModal(projectId, preview) {
  closeSafeModal();
  const pending = Number(preview.pending_approvals || 0);
  const otherOpen = Number(preview.open_actions || 0) + Number(preview.open_milestones || 0) + Number(preview.open_requests || 0);
  const candidates = Array.isArray(preview.reference_candidates) ? preview.reference_candidates : [];
  const referenceHtml = candidates.length
    ? `<div class="field"><label>Versions finales de référence</label><div class="project-checks">${candidates.map((c) => `<label><input type="checkbox" name="referenceVersionIds" value="${esc(c.version_id)}"> <strong>${esc(c.deliverable_title)}</strong> · v${esc(c.version_number)} · ${esc(approvalLabel(c.approval_status))}</label>`).join('')}</div><small>La clôture mémorise exactement les versions cochées. Une future v3 ou v4 ne remplacera jamais cette trace.</small></div>`
    : Number(preview.deliverables || 0) > 0
      ? '<div class="notice danger">Un livrable du projet ne possède encore aucune version exploitable. Ajoutez sa version finale avant de terminer le projet.</div>'
      : '<div class="notice">Aucun livrable n’est enregistré sur ce projet. La clôture conservera uniquement le résultat et la décision.</div>';
  const pendingHtml = pending
    ? `<div class="notice danger"><strong>${pending} validation${pending > 1 ? 's' : ''} encore en attente.</strong><br>Une validation en attente est un verrou de clôture : elle doit être approuvée, refusée ou annulée avant de terminer le projet.</div>`
    : '';
  const openHtml = otherOpen
    ? `<div class="notice danger"><strong>${otherOpen} engagement${otherOpen > 1 ? 's' : ''} opérationnel${otherOpen > 1 ? 's' : ''} encore ouvert${otherOpen > 1 ? 's' : ''}.</strong><br>${Number(preview.open_actions || 0)} action(s) · ${Number(preview.open_milestones || 0)} phase(s) · ${Number(preview.open_requests || 0)} demande(s).</div><div class="field"><label>Ce qu’il reste à transmettre ou traiter</label><textarea name="remaining" required></textarea></div><label><input type="checkbox" name="confirmOpen" value="1" required> Je confirme la clôture malgré ces engagements et j’ai décrit leur transmission.</label>`
    : '<div class="notice"><strong>Aucun engagement opérationnel ouvert.</strong> Le projet peut être clôturé proprement.</div>';
  const disabled = pending > 0 || (Number(preview.deliverables || 0) > 0 && !candidates.length);
  const node = document.createElement('div');
  node.className = 'modal-backdrop';
  node.dataset.safeProjectComplete = '1';
  node.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><div class="card-head"><div><h2>Terminer le projet</h2><p style="margin:4px 0 0;color:var(--live-muted)">Figez le résultat et les versions réellement livrées.</p></div><button class="icon-button" type="button" data-safe-close>✕</button></div><form data-form="project-complete-v2"><input type="hidden" name="projectId" value="${esc(projectId)}"><div class="stack"><div class="field"><label>Résultat obtenu</label><textarea name="result" required placeholder="Qu’est-ce qui a réellement été livré, décidé ou obtenu ?"></textarea></div>${referenceHtml}${pendingHtml}${openHtml}<div class="notice"><strong>Traçabilité :</strong> les fichiers de référence sélectionnés sont des versions immuables. Une réouverture du projet ne modifiera pas cette clôture.</div></div><div class="modal-actions"><button class="btn" type="button" data-safe-close>Annuler</button><button class="btn primary" type="submit" ${disabled ? 'disabled' : ''}>Confirmer la clôture</button></div></form></div>`;
  (document.getElementById('app') || document.body).appendChild(node);
}
async function openProjectCompletionV2(projectId) {
  const preview = one(await api.rpc('get_project_closure_preview_v2',{p_project_id:projectId})) || {};
  renderProjectCompletionModal(projectId,preview);
}
async function decideApproval(target) {
  const id = target.dataset.approval || '';
  const status = target.dataset.status || '';
  const note = String(document.getElementById('approval-comment')?.value || '').trim();
  if (status === 'changes_requested' && !note) throw new Error('APPROVAL_CHANGE_NOTE_REQUIRED');
  target.disabled = true;
  await api.rpc('decide_deliverable_approval_v1',{
    p_approval_id:id,
    p_status:status,
    p_decision_note:note,
  });
  location.reload();
}

const handledForms = new Set(['action','action-edit','milestone','milestone-edit','project-edit','upload','version','approval-request','project-complete','project-complete-v2']);
document.addEventListener('submit', async (event) => {
  const form = event.target?.closest?.('form[data-form]');
  const kind = form?.dataset?.form;
  if (!form || !handledForms.has(kind)) return;
  stop(event);
  if (form.dataset.workflowSafeBusy === '1') return;
  form.dataset.workflowSafeBusy = '1';
  setBusy(form,true);
  const fd = new FormData(form);
  try {
    if (!api.getSession()) throw new Error('Votre session a expiré. Reconnectez-vous.');
    if (kind === 'action') await submitAction(form,fd);
    else if (kind === 'action-edit') await submitActionEdit(form,fd);
    else if (kind === 'milestone') await submitMilestone(form,fd,false);
    else if (kind === 'milestone-edit') await submitMilestone(form,fd,true);
    else if (kind === 'meeting') await submitMeeting(form,fd);
    else if (kind === 'project-edit') await submitProjectEdit(form,fd);
    else if (kind === 'upload') await submitDeliverableUpload(form,fd);
    else if (kind === 'version') await submitDeliverableVersion(form,fd);
    else if (kind === 'approval-request') await submitApprovalRequest(form,fd);
    else if (kind === 'project-complete') await submitProjectCompletionV2(form,fd,true);
    else if (kind === 'project-complete-v2') await submitProjectCompletionV2(form,fd,false);
  } catch (error) {
    notice(form,failText(error),true);
    setBusy(form,false);
    form.dataset.workflowSafeBusy = '0';
  }
}, true);

document.addEventListener('click', async (event) => {
  const close = event.target?.closest?.('[data-safe-close]');
  if (close || (event.target?.matches?.('[data-safe-project-complete]'))) {
    stop(event);
    closeSafeModal();
    return;
  }
  const target = event.target?.closest?.('[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  if (action === 'start-complete-project') {
    stop(event);
    try { await openProjectCompletionV2(target.dataset.project || ''); }
    catch (error) { window.alert(failText(error)); }
    return;
  }
  if (action === 'approval-decision') {
    stop(event);
    try { await decideApproval(target); }
    catch (error) { target.disabled = false; window.alert(failText(error)); }
    return;
  }
  if (action === 'request-approval') {
    setTimeout(() => {
      const form = document.querySelector('form[data-form="approval-request"]');
      const info = form?.querySelector('.notice');
      if (info) info.textContent = 'La validation porte uniquement sur cette version. Si le validateur est un invité/client, seule cette version précise lui sera partagée.';
    },0);
  }
  if (action === 'new-version') {
    setTimeout(() => {
      const form = document.querySelector('form[data-form="version"]');
      if (form && !form.querySelector('[data-version-safety-note]')) {
        const note = document.createElement('div');
        note.className = 'notice';
        note.dataset.versionSafetyNote = '1';
        note.textContent = 'Cette nouvelle version sera figée et restera interne tant qu’elle n’est pas explicitement partagée ou envoyée en validation à un invité.';
        form.querySelector('.modal-actions')?.insertAdjacentElement('beforebegin',note);
      }
    },0);
  }
}, true);

document.addEventListener('change', async (event) => {
  const select = event.target?.closest?.('[data-status-action]');
  if (!select) return;
  stop(event);
  const status = select.value;
  let blockedReason = null;
  if (status === 'blocked') {
    blockedReason = window.prompt('Pourquoi cette action est-elle bloquée ?')?.trim() || '';
    if (!blockedReason) { location.reload(); return; }
  }
  select.disabled = true;
  try {
    await api.rpc('set_action_status_v1', {
      p_action_id: select.dataset.statusAction,
      p_status: status,
      p_blocked_reason: blockedReason,
    });
    setTimeout(() => location.reload(), 80);
  } catch (error) {
    window.alert(failText(error));
    location.reload();
  }
}, true);

console.info(`[2b2c] ${VERSION} active — immutable deliverable versions, exact guest sharing, exact closure refs, no MutationObserver`);

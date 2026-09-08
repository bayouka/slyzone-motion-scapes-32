from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
live_path = ROOT / 'site/assets/live.js'
boot_path = ROOT / 'site/assets/boot.js'
index_path = ROOT / 'site/index.html'
worker_path = ROOT / 'src/worker.js'
safe_path = ROOT / 'site/assets/workflow-backend-safe-v1.js'

live = live_path.read_text(encoding='utf-8')
boot = boot_path.read_text(encoding='utf-8')
index = index_path.read_text(encoding='utf-8')
worker = worker_path.read_text(encoding='utf-8')
safe = safe_path.read_text(encoding='utf-8')


def sub_once(pattern, replacement, text, label, flags=0):
    out, count = re.subn(pattern, replacement, text, count=1, flags=flags)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one replacement, got {count}')
    return out

new_render_team = r'''function renderTeam() {
  const canManage = ['owner','admin'].includes(state.workspaceRole);
  const external = isExternalUser();
  const memberRows = state.members.map(m => {
    const explicitIds = new Set(state.projectMembers.filter(pm => pm.user_id === m.user_id).map(pm => pm.project_id));
    const restrictedCount = state.projects.filter(p => p.visibility === 'restricted' && explicitIds.has(p.id)).length;
    const sharedCount = state.projects.filter(p => explicitIds.has(p.id)).length;
    let accessText = 'Accès selon les projets partagés';
    if (m.role === 'owner') accessText = 'Accès complet · propriétaire de l’espace';
    else if (m.role === 'admin') accessText = 'Accès complet · administration de l’espace';
    else if (m.role === 'member') accessText = `Projets Équipe automatiques${restrictedCount ? ` · ${restrictedCount} projet${restrictedCount > 1 ? 's' : ''} restreint${restrictedCount > 1 ? 's' : ''}` : ''}`;
    else if (m.role === 'guest') accessText = `${sharedCount} projet${sharedCount > 1 ? 's' : ''} explicitement partagé${sharedCount > 1 ? 's' : ''}`;
    return `<div class="list-row team-row">${avatarHtml(m.user_id)}<div class="list-main"><strong>${esc(displayName(m.user_id))}${m.user_id===state.user.id?' (vous)':''}</strong><small>${workspaceRoleLabel(m.role)} · ${accessText}</small></div><span class="pill ${m.role==='owner'?'blue':''}">${workspaceRoleLabel(m.role)}</span>${canManage&&m.role!=='owner'?`<button class="btn small" data-action="manage-member" data-user="${m.user_id}">Gérer</button>`:''}</div>`;
  }).join('');
  return `<div class="section-head page-head-v3"><div><span class="eyebrow">Personnes & accès</span><h1>${external?'Équipe du projet':'Équipe'}</h1><p>${external?'Seulement les personnes qui partagent vos projets.':'Le rôle définit les droits dans l’espace. La visibilité du projet définit qui peut y participer. Les responsabilités se gèrent ensuite dans la roadmap.'}</p></div>${canManage?`<button class="btn primary" data-action="invite-member">＋ Inviter</button>`:''}</div><div class="card"><div class="stack">${memberRows}</div></div>${canManage?`<div class="card" style="margin-top:16px"><div class="section-head compact"><div><h2>Invitations</h2><div class="metric-label">Membre : projets Équipe automatiques. Administrateur : accès global. Invité externe : partage explicite uniquement.</div></div><button class="section-link" data-action="load-invites">Actualiser</button></div><div id="invite-list"><span class="metric-label">Aucune donnée chargée.</span></div></div>`:''}`;
}

function renderProfile(){'''

live = sub_once(
    r"function renderTeam\(\) \{[\s\S]*?\n\}\n\nfunction renderProfile\(\)\{",
    lambda _: new_render_team,
    live,
    'renderTeam',
)

new_member_manage = r'''function memberManageModal(modal){
  const m = state.members.find(x => x.user_id === modal.userId); if(!m)return '';
  const assigned = new Set(state.projectMembers.filter(pm => pm.user_id === m.user_id).map(pm => pm.project_id));
  const role = modal.role || m.role || 'member';
  const defaultSelected = role === 'member'
    ? state.projects.filter(p => p.visibility === 'restricted' && assigned.has(p.id)).map(p => p.id)
    : role === 'guest' ? state.projects.filter(p => assigned.has(p.id)).map(p => p.id) : [];
  const selected = new Set(Array.isArray(modal.projectIds) ? modal.projectIds : defaultSelected);
  const candidates = role === 'member' ? state.projects.filter(p => p.visibility === 'restricted') : role === 'guest' ? state.projects : [];
  const roleHelp = role === 'admin'
    ? '<div class="notice"><strong>Administrateur :</strong> accès à tout l’espace et à tous les projets. Aucun projet à sélectionner ici.</div>'
    : role === 'guest'
      ? '<div class="notice"><strong>Invité externe :</strong> accès uniquement aux projets explicitement sélectionnés. Aucun futur projet ne sera ajouté automatiquement.</div>'
      : '<div class="notice"><strong>Membre :</strong> accès automatique aux projets Équipe actuels et futurs. Sélectionnez seulement les projets restreints à partager.</div>';
  const projectArea = role === 'admin' ? '' : `<div class="field span-2"><label>${role==='guest'?'Projets à partager':'Projets restreints à partager'}</label><div class="project-checks">${candidates.length?candidates.map(p=>`<label><input type="checkbox" name="projectIds" value="${p.id}" ${selected.has(p.id)?'checked':''}> ${esc(p.name)}${p.visibility==='restricted'?' <small>· Restreint</small>':''}</label>`).join(''):'<span class="metric-label">Aucun projet concerné.</span>'}</div></div>`;
  return modalFrame(`Gérer ${displayName(m.user_id)}`,'Modifiez son rôle et son accès aux projets. Les responsabilités d’actions et de jalons se gèrent dans les projets.',`<form data-form="member-manage"><input type="hidden" name="userId" value="${m.user_id}"><div class="form-grid"><div class="field span-2"><label>Rôle dans l’espace</label><select name="role" data-member-role><option value="admin" ${role==='admin'?'selected':''}>Administrateur</option><option value="member" ${role==='member'?'selected':''}>Membre</option><option value="guest" ${role==='guest'?'selected':''}>Invité externe</option></select></div><div class="span-2">${roleHelp}</div>${projectArea}</div><div class="modal-actions"><button class="btn" type="button" data-action="close-modal">Annuler</button><button class="btn primary" type="submit">Enregistrer les accès</button></div></form>`);
}
function renderModal(modal) {'''

live = sub_once(
    r"function memberManageModal\(modal\)\{[\s\S]*?\n\}\nfunction renderModal\(modal\) \{",
    lambda _: new_member_manage,
    live,
    'memberManageModal',
)

new_invite_modal = r'''  if (modal.type==='invite') {
    const role = modal.role || 'member';
    const selected = new Set(Array.isArray(modal.projectIds) ? modal.projectIds : (modal.projectId ? [modal.projectId] : []));
    const candidates = role === 'member' ? state.projects.filter(p => p.visibility === 'restricted') : role === 'guest' ? state.projects : [];
    const roleHelp = role === 'admin'
      ? '<div class="notice"><strong>Administrateur :</strong> accès à tout l’espace et à tous les projets. Aucun projet à sélectionner.</div>'
      : role === 'guest'
        ? '<div class="notice"><strong>Invité externe :</strong> accès uniquement aux projets choisis ci-dessous. Il ne recevra jamais automatiquement les futurs projets.</div>'
        : '<div class="notice"><strong>Membre :</strong> accès automatique à tous les projets Équipe actuels et futurs. Sélectionnez seulement les projets restreints à partager immédiatement.</div>';
    const projectArea = role === 'admin' ? '' : `<div class="field span-2"><label>${role==='guest'?'Projets à partager':'Projets restreints à partager'}</label><div class="project-checks">${candidates.length?candidates.map(p=>`<label><input type="checkbox" name="projectIds" value="${p.id}" ${selected.has(p.id)?'checked':''}> ${esc(p.name)}${p.visibility==='restricted'?' <small>· Restreint</small>':''}</label>`).join(''):'<span class="metric-label">Aucun projet concerné.</span>'}</div></div>`;
    return modalFrame('Inviter une personne','Choisissez son rôle et son accès. Les responsabilités se définissent ensuite directement dans les projets.',`<form data-form="invite"><div class="form-grid"><div class="field span-2"><label>Email</label><input type="email" name="email" required autofocus autocomplete="email" value="${escAttr(modal.email||'')}"></div><div class="field span-2"><label>Rôle dans l’espace</label><select name="role" data-invite-role><option value="member" ${role==='member'?'selected':''}>Membre</option><option value="admin" ${role==='admin'?'selected':''}>Administrateur</option><option value="guest" ${role==='guest'?'selected':''}>Invité externe</option></select></div><div class="span-2">${roleHelp}</div>${projectArea}</div><div class="notice"><strong>Connexion :</strong> 2b2c crée un lien personnel lié à cette adresse. La personne se connecte ou crée son propre compte et choisit elle-même son mot de passe.</div><div class="modal-actions"><button class="btn" type="button" data-action="close-modal">Annuler</button><button class="btn primary" type="submit">Créer l’invitation</button></div></form>`);
  }'''

live = sub_once(
    r"^  if \(modal\.type==='invite'\).*?$",
    lambda _: new_invite_modal,
    live,
    'invite modal',
    flags=re.M,
)

new_submit_invite = r'''async function submitInvite(data) {
  if(!['owner','admin'].includes(state.workspaceRole)) throw new Error('Vous ne pouvez pas inviter de membre.');
  const role = data.role || 'member';
  const email = String(data.email || '').trim().toLowerCase();
  if(!email) throw new Error('Adresse email requise.');
  let projectIds = [...new Set(data.projectIds || [])];
  if(role === 'admin') projectIds = [];
  if(role === 'member') {
    const restricted = new Set(state.projects.filter(p => p.visibility === 'restricted').map(p => p.id));
    projectIds = projectIds.filter(id => restricted.has(id));
  }
  if(role === 'guest' && !projectIds.length) throw new Error('Choisissez au moins un projet pour un invité externe.');
  const result = await api.rpc('create_workspace_invite_v2', {
    p_workspace_id: state.workspace.id,
    p_email: email,
    p_role: role,
    p_project_ids: projectIds,
  });
  const invite = Array.isArray(result) ? result[0] : result;
  if(!invite?.token) throw new Error('Invitation créée sans lien exploitable.');
  const url = new URL(location.origin + location.pathname);
  url.searchParams.set('invite', invite.token);
  state.modal = {type:'invite-link',url:url.toString(),email};
  render();
}

async function seedPilot'''

live = sub_once(
    r"async function submitInvite\(data\) \{[\s\S]*?\n\}\n\nasync function seedPilot",
    lambda _: new_submit_invite,
    live,
    'submitInvite',
)

new_submit_member = r'''async function submitMemberManage(data){
  if(!['owner','admin'].includes(state.workspaceRole))throw new Error('Vous ne pouvez pas modifier les accès.');
  const member=state.members.find(m=>m.user_id===data.userId);if(!member||member.role==='owner')throw new Error('Ce membre ne peut pas être modifié ici.');
  const role=data.role||'member';
  let projectIds=[...new Set(data.projectIds||[])];
  if(role==='admin') projectIds=[];
  if(role==='member') {
    const restricted=new Set(state.projects.filter(p=>p.visibility==='restricted').map(p=>p.id));
    projectIds=projectIds.filter(id=>restricted.has(id));
  }
  if(role==='guest'&&!projectIds.length)throw new Error('Un invité externe doit avoir au moins un projet partagé.');
  await api.rpc('set_workspace_member_access_v1', {
    p_workspace_id: state.workspace.id,
    p_user_id: member.user_id,
    p_role: role,
    p_project_ids: projectIds,
  });
  state.modal=null;await refreshWorkspace({quiet:true});showToast('Accès du membre mis à jour');
}
async function submitMessage'''

live = sub_once(
    r"async function submitMemberManage\(data\)\{[\s\S]*?\n\}\nasync function submitMessage",
    lambda _: new_submit_member,
    live,
    'submitMemberManage',
)

handle_change_marker = "async function handleChange(event) {\n  const el = event.target;"
handle_change_new = r'''async function handleChange(event) {
  const el = event.target;
  if (el.matches('[data-invite-role]') && state.modal?.type === 'invite') {
    const form = el.closest('form');
    const fd = form ? new FormData(form) : null;
    state.modal = { ...state.modal, role: el.value, email: String(fd?.get('email') || ''), projectIds: fd ? fd.getAll('projectIds') : [] };
    render();
    return;
  }
  if (el.matches('[data-member-role]') && state.modal?.type === 'member-manage') {
    const form = el.closest('form');
    const fd = form ? new FormData(form) : null;
    state.modal = { ...state.modal, role: el.value, projectIds: fd ? fd.getAll('projectIds') : [] };
    render();
    return;
  }'''
if live.count(handle_change_marker) != 1:
    raise SystemExit('handleChange marker missing or duplicated')
live = live.replace(handle_change_marker, handle_change_new, 1)

new_load_invites = r'''async function loadInvites(button) {
  const rows=await api.select('workspace_invites',`select=*&workspace_id=eq.${state.workspace.id}&order=created_at.desc&limit=30`);
  const parent=button.closest('#invite-list')||document.getElementById('invite-list'); if(!parent)return;
  const accessLabel=(invite)=>invite.role==='admin'?'Accès global':invite.role==='guest'?'Projets explicitement partagés':'Projets Équipe automatiques';
  parent.innerHTML=rows.length?`<div class="stack">${rows.map(i=>`<div class="list-row"><div class="list-main"><strong>${esc(i.email)}</strong><small>${workspaceRoleLabel(i.role)} · ${accessLabel(i)} · ${inviteStatus(i.status)} · expire ${formatDate(i.expires_at)}</small></div><span class="pill ${i.status==='pending'?'blue':i.status==='accepted'?'good':''}">${inviteStatus(i.status)}</span></div>`).join('')}</div>`:empty('Aucune invitation','Utilisez Inviter pour créer un accès ciblé.');
}'''
live = sub_once(
    r"async function loadInvites\(button\) \{[\s\S]*?\n\}",
    lambda _: new_load_invites,
    live,
    'loadInvites',
)

# The safe bridge remains for actions/milestones/meetings/project edits, but member
# access is now native and must not be intercepted before live.js.
safe = safe.replace(
    "const handledForms = new Set(['action','action-edit','milestone','milestone-edit','meeting','member-manage','project-edit']);",
    "const handledForms = new Set(['action','action-edit','milestone','milestone-edit','meeting','project-edit']);",
)
safe = safe.replace("    else if (kind === 'member-manage') await submitMemberManage(form,fd);\n", "")

# Stability boot: native invitation is now in live.js. No pre-live invitation controller.
boot = boot.replace("const VERSION = 'v4.4.5-stability-safe';", "const VERSION = 'v4.4.6-native-access';")
old_chain = "  import(`./invite-prelive-v2.js?${VERSION}`)\n    .then(() => import(`./live.js?${VERSION}`))\n    .then(() => import(`./workflow-backend-safe-v1.js?${VERSION}`))"
new_chain = "  import(`./live.js?${VERSION}`)\n    .then(() => import(`./workflow-backend-safe-v1.js?${VERSION}`))"
if old_chain not in boot:
    raise SystemExit('boot import chain not found')
boot = boot.replace(old_chain, new_chain, 1)
index = index.replace('assets/boot.js?v=4.4.5-stability-safe', 'assets/boot.js?v=4.4.6-native-access')
worker = worker.replace("version: 'v4.4.5-stability-safe'", "version: 'v4.4.6-native-access'")

checks = {
    'native invite role selector': "data-invite-role" in live,
    'native member role selector': "data-member-role" in live,
    'secure invite RPC': "create_workspace_invite_v2" in live,
    'secure member RPC': "set_workspace_member_access_v1" in live,
    'legacy responsibility removed from native access UI': "Responsabilité / écriture" not in live,
    'legacy portfolio visibility removed': "Visibilité portefeuille" not in live,
    'prelive controller removed from boot': "invite-prelive-v2.js" not in boot,
    'stability polling preserved': "pollIntervalMs: Math.max(60000" in boot,
    'no observer in safe bridge': "new MutationObserver" not in safe,
}
failed = [name for name, ok in checks.items() if not ok]
if failed:
    raise SystemExit('contract failed: ' + ', '.join(failed))

live_path.write_text(live, encoding='utf-8')
boot_path.write_text(boot, encoding='utf-8')
index_path.write_text(index, encoding='utf-8')
worker_path.write_text(worker, encoding='utf-8')
safe_path.write_text(safe, encoding='utf-8')
print('native team/access migration: ok')

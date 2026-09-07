import fs from 'node:fs';

const livePath = 'site/assets/live.js';
let source = fs.readFileSync(livePath, 'utf8');

function replaceOnce(label, before, after) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly one match, found ${count}`);
  source = source.replace(before, after);
}

// A meeting is a Home time signal only when the current user is actually involved.
replaceOnce(
  'personal upcoming meetings',
  "state.meetings.filter(m=>m.starts_at&&m.status!=='cancelled'&&new Date(m.starts_at)>new Date()).forEach(m=>rows.push({type:'meeting',id:m.id,title:m.title,projectId:m.project_id,ts:new Date(m.starts_at).getTime(),when:attentionDueLabel(m.starts_at),route:null}));",
  "state.meetings.filter(m=>m.starts_at&&m.status!=='cancelled'&&new Date(m.starts_at)>new Date()&&(m.created_by===state.user.id||state.meetingAttendees.some(a=>a.meeting_id===m.id&&a.user_id===state.user.id&&a.response!=='declined'))).forEach(m=>rows.push({type:'meeting',id:m.id,title:m.title,projectId:m.project_id,ts:new Date(m.starts_at).getTime(),when:attentionDueLabel(m.starts_at),route:null}));"
);

// Until meeting preparation becomes a real assigned object, do not inflate Attention / Mon travail with a synthetic 4-hour rule.
const meetingAttention = "  const soon=Date.now()+4*60*60*1000;\n  state.meetings.filter(m=>m.status==='planned'&&m.starts_at&&new Date(m.starts_at).getTime()>Date.now()&&new Date(m.starts_at).getTime()<=soon&&state.meetingAttendees.some(a=>a.meeting_id===m.id&&a.user_id===state.user.id&&a.response!=='declined')).forEach(m=>items.push({key:`meeting:${m.id}`,entityType:'meeting',entityId:m.id,kind:'Préparation',title:m.title,projectId:m.project_id,tone:'',rank:5,byLabel:'réunion imminente',dueAt:m.starts_at,preview:m.agenda||''}));\n";
if (!source.includes(meetingAttention)) throw new Error('meeting attention block not found');
source = source.replace(meetingAttention, '');

// People who can read a project can be selected for read-level collaboration; write-level contexts still require project responsibility.
replaceOnce(
  'project participant options',
  "function projectParticipantOptions(projectId,selected='',includeGuests=true,exclude=''){const pms=state.projectMembers.filter(pm=>pm.project_id===projectId);const ids=new Set(pms.filter(pm=>includeGuests||['lead','member'].includes(pm.role)).map(pm=>pm.user_id));state.members.filter(m=>['owner','admin'].includes(m.role)).forEach(m=>ids.add(m.user_id));return [...ids].filter(id=>id!==exclude).map(id=>{const wm=state.members.find(m=>m.user_id===id);if(!includeGuests&&wm?.role==='guest')return '';return `<option value=\"${id}\" ${id===selected?'selected':''}>${esc(displayName(id))}${wm?.role==='guest'?' · invité':''}</option>`}).join('')}",
  "function projectParticipantOptions(projectId,selected='',includeGuests=true,exclude=''){const pms=state.projectMembers.filter(pm=>pm.project_id===projectId);const ids=new Set(pms.filter(pm=>includeGuests||['lead','member'].includes(pm.role)).map(pm=>pm.user_id));state.members.filter(m=>['owner','admin'].includes(m.role)||(includeGuests&&m.role==='member'&&m.access_mode==='all')).forEach(m=>ids.add(m.user_id));return [...ids].filter(id=>id!==exclude).map(id=>{const wm=state.members.find(m=>m.user_id===id);if(!includeGuests&&wm?.role==='guest')return '';return `<option value=\"${id}\" ${id===selected?'selected':''}>${esc(displayName(id))}${wm?.role==='guest'?' · invité':''}</option>`}).join('')}"
);

replaceOnce(
  'meeting participant checks',
  "function meetingParticipantChecks(projectId=''){const ids=projectId?new Set(state.projectMembers.filter(pm=>pm.project_id===projectId).map(pm=>pm.user_id)):new Set(state.members.map(m=>m.user_id));ids.delete(state.user.id);return [...ids].map(id=>`<label><input type=\"checkbox\" name=\"attendeeIds\" value=\"${id}\"> ${esc(displayName(id))}</label>`).join('')||'<small>Aucun autre participant disponible.</small>'}",
  "function meetingParticipantChecks(projectId=''){const ids=projectId?new Set(state.projectMembers.filter(pm=>pm.project_id===projectId).map(pm=>pm.user_id)):new Set(state.members.map(m=>m.user_id));if(projectId)state.members.filter(m=>['owner','admin'].includes(m.role)||(m.role==='member'&&m.access_mode==='all')).forEach(m=>ids.add(m.user_id));ids.delete(state.user.id);return [...ids].map(id=>`<label><input type=\"checkbox\" name=\"attendeeIds\" value=\"${id}\"> ${esc(displayName(id))}</label>`).join('')||'<small>Aucun autre participant disponible.</small>'}"
);

// The current data is ordered by project activity, not by personal viewing history. Use a truthful label.
source = source.replaceAll('PROJETS RÉCENTS', 'PROJETS ACTIFS');

// File registration is server-numbered and failed registrations clean the uploaded object.
const uploadStart = source.indexOf('async function submitUpload(form,data) {');
const inviteStart = source.indexOf('\nasync function submitInvite(data)', uploadStart);
if (uploadStart < 0 || inviteStart < 0) throw new Error('upload/version function range not found');
const oldUploadBlock = source.slice(uploadStart, inviteStart);
const newUploadBlock = `async function registerUploadedVersion(deliverableId,path,file){
  const result=await api.rpc('register_deliverable_version_v2',{p_deliverable_id:deliverableId,p_storage_path:path,p_file_name:file.name,p_mime_type:file.type||null,p_size_bytes:file.size});
  const value=Array.isArray(result)?result[0]:result;
  return Number(value?.register_deliverable_version_v2??value)||0;
}

async function submitUpload(form,data) {
  const file=form.querySelector('input[type=file]')?.files?.[0]; if(!file) throw new Error('Fichier requis');
  if(!canWriteProject(data.projectId))throw new Error('Vous ne pouvez pas ajouter de ressource dans ce projet.');
  if(file.size>50*1024*1024) throw new Error('Le fichier dépasse 50 Mo');
  const safeName=file.name.replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/^-+|-+$/g,'')||'fichier';
  const path=\`${'${state.workspace.id}'}/${'${data.projectId}'}/${'${crypto.randomUUID()}'}-${'${safeName}'}\`;
  const deliverables=await api.insert('deliverables',[{workspace_id:state.workspace.id,project_id:data.projectId,title:String(data.title).trim(),description:'',visibility:data.visibility||'internal',status:'draft',created_by:state.user.id}]);
  let uploaded=false;
  try {
    await api.upload('workspace-files',path,file); uploaded=true;
    await registerUploadedVersion(deliverables[0].id,path,file);
  } catch(error) {
    if(uploaded){try{await api.removeObject('workspace-files',path)}catch{}}
    try{await api.remove('deliverables',\`id=eq.${'${deliverables[0].id}'}\`)}catch{}
    throw error;
  }
  state.modal=null; await loadProject(data.projectId,true); showToast('Livrable ajouté · version 1');
}

async function submitVersion(form,data){
  const d=findDeliverable(data.deliverableId);if(!d)throw new Error('Livrable introuvable');if(!canWriteProject(d.project_id))throw new Error('Vous ne pouvez pas ajouter de version.');
  const file=form.querySelector('input[type=file]')?.files?.[0];if(!file)throw new Error('Fichier requis');if(file.size>50*1024*1024)throw new Error('Le fichier dépasse 50 Mo');
  const safe=file.name.replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/^-+|-+$/g,'')||'fichier';const path=\`${'${state.workspace.id}'}/${'${d.project_id}'}/${'${crypto.randomUUID()}'}-${'${safe}'}\`;
  let uploaded=false;
  try{
    await api.upload('workspace-files',path,file);uploaded=true;
    const number=await registerUploadedVersion(d.id,path,file);
    state.modal=null;await loadProject(d.project_id,true);showToast(number?\`Version ${'${number}'} ajoutée\`:'Nouvelle version ajoutée');
  }catch(error){if(uploaded){try{await api.removeObject('workspace-files',path)}catch{}}throw error;}
}

async function submitApprovalRequest(data){
  const d=findDeliverable(data.deliverableId);if(!d)throw new Error('Livrable introuvable');if(!canWriteProject(d.project_id))throw new Error('Vous ne pouvez pas demander cette validation.');
  const validator=state.members.find(m=>m.user_id===data.validatorId);if(!validator)throw new Error('Validateur introuvable');
  const mapped=state.projectMembers.some(pm=>pm.project_id===d.project_id&&pm.user_id===data.validatorId);
  const broadAccess=['owner','admin'].includes(validator.role)||(validator.role==='member'&&validator.access_mode==='all');
  if(!mapped&&!broadAccess)throw new Error('Ce validateur n’a pas accès à ce projet.');
  if(validator.role==='guest'&&d.visibility!=='shared')await api.update('deliverables',\`id=eq.${'${d.id}'}\`,{visibility:'shared',status:'review',updated_at:new Date().toISOString()},{returnRepresentation:false});else await api.update('deliverables',\`id=eq.${'${d.id}'}\`,{status:'review',updated_at:new Date().toISOString()},{returnRepresentation:false});
  await api.insert('approvals',[{workspace_id:state.workspace.id,project_id:d.project_id,deliverable_version_id:data.versionId,requested_by:state.user.id,validator_id:data.validatorId,status:'pending',request_note:String(data.comment||'').trim(),comment:''}]);
  state.modal=null;await refreshWorkspace({quiet:true});await loadProject(d.project_id,true);showToast('Validation demandée');
}
`;
source = source.slice(0, uploadStart) + newUploadBlock + source.slice(inviteStart);

fs.writeFileSync(livePath, source);
console.log('Pre-collaborator fixes applied to live.js');

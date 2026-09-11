import { SupabaseBrowserClient } from './supabase-client.js';

const config = window.__4B4C_CONFIG__ || {};
const api = new SupabaseBrowserClient({ url: config.supabaseUrl, publishableKey: config.supabasePublishableKey });
const WORKSPACE_KEY = config.workspaceStorageKey || '4b4c.live.workspace.v1';
let busy = false;

const one = (value) => Array.isArray(value) ? (value[0] ?? null) : value;
const value = (fd, key, fallback = '') => String(fd.get(key) ?? fallback).trim();
const values = (fd, key) => fd.getAll(key).map(String).filter(Boolean);

function workspaceId() {
  return localStorage.getItem(WORKSPACE_KEY) || '';
}

function localIso(raw) {
  if (!raw) return null;
  const parsed = new Date(String(raw));
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function setBusy(form, state) {
  form?.querySelectorAll('button,input,select,textarea').forEach((element) => {
    element.disabled = state;
  });
}

function message(error) {
  const text = String(error?.message || error || 'Erreur inconnue');
  const mapping = [
    ['MEETING_TITLE_REQUIRED', 'Indiquez un titre pour la réunion.'],
    ['MEETING_START_REQUIRED', 'Indiquez la date et l’heure de début.'],
    ['MEETING_END_BEFORE_START', 'La fin doit être postérieure au début.'],
    ['MEETING_ATTENDEE_NOT_ACTIVE', 'Un participant sélectionné n’est plus membre actif de cet espace.'],
    ['MEETING_ATTENDEE_NO_PROJECT_ACCESS', 'Un participant sélectionné n’a pas accès à ce projet.'],
    ['GUEST_MEETING_REQUIRES_SHARED_PROJECT', 'Une réunion avec un invité externe doit être liée à un projet partagé.'],
    ['WORKSPACE_MEETING_INTERNAL_ONLY', 'Une réunion de tout l’espace doit rester interne. Pour inviter un externe, liez-la à un projet partagé.'],
    ['MEETING_MANAGE_DENIED', 'Vous ne pouvez pas modifier cette réunion.'],
    ['MEETING_ACCESS_DENIED', 'Cette réunion n’est plus accessible.'],
    ['MEETING_FINALIZED_STATUS_IMMUTABLE', 'Une réunion terminée ou annulée ne peut plus être réouverte par cette action.'],
    ['MEETING_STATUS_BACKWARD_DENIED', 'Une réunion déjà démarrée ne peut pas revenir à l’état planifié.'],
    ['MEETING_RSVP_CLOSED', 'Les réponses ne sont plus modifiables pour cette réunion.'],
    ['MEETING_CREATOR_CANNOT_DECLINE', 'Le créateur de la réunion ne peut pas la refuser.'],
    ['MEETING_ATTENDEE_REQUIRED', 'Vous ne faites pas partie des participants de cette réunion.'],
    ['WORKSPACE_WRITE_DENIED', 'Vous ne pouvez pas planifier une réunion pour cet espace.'],
    ['PROJECT_WRITE_DENIED', 'Vous ne pouvez pas planifier une réunion dans ce projet.'],
  ];
  return mapping.find(([code]) => text.includes(code))?.[1] || text;
}

function feedback(form, text, error = false) {
  if (!form) {
    window.alert(text);
    return;
  }
  let node = form.querySelector('[data-meeting-workflow-feedback]');
  if (!node) {
    node = document.createElement('div');
    node.dataset.meetingWorkflowFeedback = '1';
    const actions = form.querySelector('.modal-actions');
    (actions || form).insertAdjacentElement(actions ? 'beforebegin' : 'afterbegin', node);
  }
  node.className = `notice${error ? ' danger' : ''}`;
  node.setAttribute('role', error ? 'alert' : 'status');
  node.textContent = text;
}

async function effectiveVisibility(requested, attendeeIds) {
  if (!attendeeIds.length) return requested || 'internal';
  const wid = workspaceId();
  if (!wid) return requested || 'internal';
  const members = await api.select('workspace_members', `select=user_id,role,status&workspace_id=eq.${wid}&status=eq.active`);
  const roles = new Map(members.map((member) => [member.user_id, member.role]));
  return attendeeIds.some((id) => roles.get(id) === 'guest') ? 'shared' : (requested || 'internal');
}

async function createMeeting(form) {
  const fd = new FormData(form);
  const wid = workspaceId();
  if (!wid) throw new Error('Aucun espace de travail sélectionné.');
  const attendeeIds = [...new Set(values(fd, 'attendeeIds'))];
  const visibility = await effectiveVisibility(value(fd, 'visibility', 'internal') || 'internal', attendeeIds);
  const meetingId = one(await api.rpc('create_meeting_with_attendees_v2', {
    p_workspace_id: wid,
    p_title: value(fd, 'title'),
    p_starts_at: localIso(value(fd, 'startsAt')),
    p_ends_at: localIso(value(fd, 'endsAt')),
    p_project_id: value(fd, 'projectId') || null,
    p_video_room: value(fd, 'videoRoom') || null,
    p_visibility: visibility,
    p_attendee_ids: attendeeIds,
    p_agenda: value(fd, 'agenda'),
  }));
  if (!meetingId) throw new Error('La réunion n’a pas pu être créée.');
  feedback(form, visibility === 'shared' ? 'Réunion planifiée et partagée avec les invités.' : 'Réunion planifiée.');
  location.hash = `#/calendar/meeting/${meetingId}`;
  setTimeout(() => location.reload(), 100);
}

async function updateMeeting(form) {
  const fd = new FormData(form);
  const meetingId = value(fd, 'meetingId');
  if (!meetingId) throw new Error('Réunion introuvable.');
  const meeting = one(await api.select('meetings', `select=id,title,starts_at,ends_at,video_room,status,visibility&id=eq.${meetingId}&limit=1`));
  if (!meeting) throw new Error('Réunion introuvable ou inaccessible.');
  const attendees = await api.select('meeting_attendees', `select=user_id&meeting_id=eq.${meetingId}`);
  const attendeeIds = [...new Set(attendees.map((row) => row.user_id).filter(Boolean))];
  const visibility = await effectiveVisibility(value(fd, 'visibility', meeting.visibility || 'internal') || 'internal', attendeeIds);
  await api.rpc('update_meeting_v2', {
    p_meeting_id: meetingId,
    p_title: meeting.title,
    p_starts_at: meeting.starts_at,
    p_ends_at: meeting.ends_at,
    p_video_room: meeting.video_room,
    p_visibility: visibility,
    p_agenda: value(fd, 'agenda'),
    p_live_notes: value(fd, 'liveNotes'),
    p_summary: value(fd, 'summary'),
    p_status: value(fd, 'status', meeting.status) || meeting.status,
    p_attendee_ids: attendeeIds,
  });
  feedback(form, 'Réunion mise à jour.');
  setTimeout(() => location.reload(), 100);
}

async function respondMeeting(meetingId, response) {
  await api.rpc('set_meeting_response_v2', {
    p_meeting_id: meetingId,
    p_response: response,
  });
  location.reload();
}

function isMeetingForm(form) {
  return ['meeting', 'meeting-detail'].includes(form?.dataset?.form || '');
}

document.addEventListener('submit', async (event) => {
  const form = event.target?.closest?.('form[data-form]');
  if (!isMeetingForm(form)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  if (busy || form.dataset.meetingWorkflowBusy === '1') return;
  busy = true;
  form.dataset.meetingWorkflowBusy = '1';
  setBusy(form, true);
  try {
    if (!api.getSession()) throw new Error('Votre session a expiré. Reconnectez-vous.');
    if (form.dataset.form === 'meeting') await createMeeting(form);
    else await updateMeeting(form);
  } catch (error) {
    console.error('[2b2c] meeting workflow failed', error);
    feedback(form, message(error), true);
  } finally {
    busy = false;
    delete form.dataset.meetingWorkflowBusy;
    setBusy(form, false);
  }
}, true);

document.addEventListener('click', async (event) => {
  const target = event.target.closest?.('[data-action="meeting-response"]');
  if (!target) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  if (busy) return;
  const meetingId = target.dataset.meeting || '';
  const response = target.dataset.response || '';
  if (!meetingId || !['accepted', 'declined'].includes(response)) return;
  busy = true;
  target.disabled = true;
  try {
    if (!api.getSession()) throw new Error('Votre session a expiré. Reconnectez-vous.');
    await respondMeeting(meetingId, response);
  } catch (error) {
    console.error('[2b2c] meeting RSVP failed', error);
    window.alert(message(error));
  } finally {
    busy = false;
    target.disabled = false;
  }
}, true);

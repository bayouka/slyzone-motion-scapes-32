import { SupabaseBrowserClient } from './supabase-client.js';

if (!window.__4B4C_CALL_ENGINE_V2__) {
  const config = window.__4B4C_CONFIG__ || {};
  const api = new SupabaseBrowserClient({ url: config.supabaseUrl, publishableKey: config.supabasePublishableKey });
  const workspaceKey = config.workspaceStorageKey || '4b4c.live.workspace.v1';
  const MAX_PARTICIPANTS = 6;
  const SYNC_MS = 650;
  const HEARTBEAT_MS = 8000;
  const STATS_MS = 4000;
  const IDLE_PROBE_MS = 4500;
  const ICE_FALLBACK = [{ urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.cloudflare.com:53'] }];

  let active = null;
  let prejoin = null;
  let picker = null;
  let currentUser = null;
  let roster = new Map();
  let idleTimer = null;
  let resumeCall = null;
  let busy = false;

  const one = (value) => Array.isArray(value) ? (value[0] ?? null) : value;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
  const escAttr = esc;
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const uid = () => currentUser?.id || api.getSession()?.user?.id || '';
  const workspaceId = () => localStorage.getItem(workspaceKey) || '';
  const nowIso = () => new Date().toISOString();

  function ensureStylesheet() {
    if (document.querySelector('link[data-call-engine-v2]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './assets/call-engine-v2.css?v=2.0.0';
    link.dataset.callEngineV2 = 'true';
    document.head.appendChild(link);
  }

  function root(id) {
    let node = document.getElementById(id);
    if (!node) {
      node = document.createElement('div');
      node.id = id;
      document.body.appendChild(node);
    }
    return node;
  }

  function removeNode(id) { document.getElementById(id)?.remove(); }
  function displayName(userId) { return roster.get(userId)?.display_name || 'Membre'; }
  function initials(userId) {
    return displayName(userId).split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase() || '?';
  }

  async function getUser() {
    if (currentUser?.id) return currentUser;
    if (!api.getSession()?.access_token) return null;
    currentUser = await api.getUser();
    return currentUser;
  }

  async function loadRoster(wid = workspaceId()) {
    const user = await getUser();
    if (!user?.id || !wid) return [];
    const [members, profiles] = await Promise.all([
      api.select('workspace_members', `select=user_id,role,status&workspace_id=eq.${wid}&status=eq.active&order=joined_at.asc`),
      api.select('profiles', 'select=id,display_name,avatar_url&order=display_name.asc').catch(() => []),
    ]);
    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
    roster = new Map((members || []).map((m) => [m.user_id, { ...m, ...(profileMap.get(m.user_id) || {}) }]));
    return (members || []).filter((m) => m.user_id !== user.id && m.role !== 'guest');
  }

  async function loadIceConfig() {
    const session = api.getSession();
    if (!session?.access_token) return { mode: 'stun', iceServers: ICE_FALLBACK, warning: 'Session TURN indisponible' };
    try {
      const response = await fetch(`${config.supabaseUrl}/functions/v1/call-ice-v1`, {
        method: 'POST',
        headers: {
          apikey: config.supabasePublishableKey,
          authorization: `Bearer ${session.access_token}`,
          'content-type': 'application/json',
        },
        body: '{}',
      });
      if (!response.ok) throw new Error(`ICE ${response.status}`);
      const payload = await response.json();
      const servers = Array.isArray(payload?.iceServers) && payload.iceServers.length ? payload.iceServers : ICE_FALLBACK;
      const urls = servers.flatMap((entry) => Array.isArray(entry.urls) ? entry.urls : [entry.urls]).filter(Boolean);
      const hasTurn = urls.some((url) => /^turns?:/i.test(String(url)));
      return { mode: hasTurn ? 'turn' : 'stun', iceServers: servers, warning: hasTurn ? '' : 'Relais TURN non disponible : certains réseaux mobiles ou d’entreprise peuvent bloquer la visio.' };
    } catch (error) {
      console.warn('[2b2c call v2] ICE configuration fallback', error);
      return { mode: 'stun', iceServers: ICE_FALLBACK, warning: 'Relais TURN indisponible : connexion directe uniquement.' };
    }
  }

  async function acquireLocalMedia({ cameraDeviceId = '', micDeviceId = '', facingMode = 'user' } = {}) {
    const audio = micDeviceId
      ? { deviceId: { exact: micDeviceId }, echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      : { echoCancellation: true, noiseSuppression: true, autoGainControl: true };
    const video = cameraDeviceId
      ? { deviceId: { exact: cameraDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
      : { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } };
    try {
      return await navigator.mediaDevices.getUserMedia({ audio, video });
    } catch (firstError) {
      console.warn('[2b2c call v2] camera+mic unavailable', firstError);
      try { return await navigator.mediaDevices.getUserMedia({ audio, video: false }); }
      catch (secondError) {
        console.warn('[2b2c call v2] audio unavailable', secondError);
        return new MediaStream();
      }
    }
  }

  async function enumerateMediaDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return {
        cameras: devices.filter((d) => d.kind === 'videoinput'),
        mics: devices.filter((d) => d.kind === 'audioinput'),
        speakers: devices.filter((d) => d.kind === 'audiooutput'),
      };
    } catch { return { cameras: [], mics: [], speakers: [] }; }
  }

  function pickerRoot() { return root('call-engine-v2-picker'); }
  function prejoinRoot() { return root('call-engine-v2-prejoin'); }
  function activeRoot() { return root('call-engine-v2-active'); }
  function resumeRoot() { return root('call-engine-v2-resume'); }

  async function projectPreset(projectId) {
    if (!projectId) return [];
    const rows = await api.select('project_members', `select=user_id&project_id=eq.${projectId}`).catch(() => []);
    return (rows || []).map((row) => row.user_id);
  }

  async function meetingPreset(meetingId) {
    if (!meetingId) return [];
    const rows = await api.select('meeting_attendees', `select=user_id,response&meeting_id=eq.${meetingId}`).catch(() => []);
    return (rows || []).filter((row) => row.response !== 'declined').map((row) => row.user_id);
  }

  async function openPicker({ mode = 'start', presetIds = [], projectId = null, meetingId = null, title = 'Nouvelle visio' } = {}) {
    if (busy) return;
    const user = await getUser();
    const wid = workspaceId();
    if (!user?.id || !wid) return;
    const members = await loadRoster(wid);
    let suggested = [...presetIds];
    if (!suggested.length && meetingId) suggested = await meetingPreset(meetingId);
    if (!suggested.length && projectId) suggested = await projectPreset(projectId);
    const unavailable = new Set([user.id]);
    if (mode === 'add' && active) {
      for (const participant of active.participants || []) unavailable.add(participant.user_id);
      for (const invite of active.invites || []) if (!['declined', 'cancelled'].includes(invite.status)) unavailable.add(invite.invited_user_id);
    }
    const options = members.filter((member) => !unavailable.has(member.user_id));
    const capacity = mode === 'add'
      ? Math.max(0, MAX_PARTICIPANTS - new Set([user.id, ...(active?.participants || []).map((p) => p.user_id), ...(active?.invites || []).filter((i) => !['declined', 'cancelled'].includes(i.status)).map((i) => i.invited_user_id)]).size)
      : MAX_PARTICIPANTS - 1;
    const allowed = new Set(options.map((m) => m.user_id));
    const selected = new Set(suggested.filter((id) => allowed.has(id)).slice(0, capacity));
    picker = { mode, selected, options, capacity, projectId, meetingId, title };
    renderPicker();
  }

  function renderPicker() {
    if (!picker) { removeNode('call-engine-v2-picker'); return; }
    const node = pickerRoot();
    const selectedCount = picker.selected.size;
    node.innerHTML = `<div class="ce-v2-backdrop" data-ce-action="picker-close">
      <section class="ce-v2-dialog ce-v2-picker" role="dialog" aria-modal="true" aria-labelledby="ce-v2-picker-title">
        <header><div><small>Communication</small><h2 id="ce-v2-picker-title">${esc(picker.mode === 'add' ? 'Ajouter des participants' : picker.title)}</h2><p>${picker.mode === 'add' ? 'Invitez d’autres membres dans la visio en cours.' : 'Choisissez jusqu’à 5 personnes. Vous pourrez en ajouter ensuite.'}</p></div><button type="button" class="ce-v2-icon" data-ce-action="picker-close" aria-label="Fermer">×</button></header>
        <div class="ce-v2-people">
          ${picker.options.length ? picker.options.map((member) => {
            const selected = picker.selected.has(member.user_id);
            return `<button type="button" class="ce-v2-person ${selected ? 'selected' : ''}" data-ce-action="picker-toggle" data-user="${escAttr(member.user_id)}" aria-pressed="${selected}">
              <span class="ce-v2-avatar">${esc(initials(member.user_id))}</span><span><strong>${esc(displayName(member.user_id))}</strong><small>${member.role === 'owner' ? 'Propriétaire' : member.role === 'admin' ? 'Administrateur' : 'Membre'}</small></span><i>${selected ? '✓' : '+'}</i>
            </button>`;
          }).join('') : '<div class="ce-v2-empty"><strong>Aucun membre disponible</strong><span>Les participants déjà invités ou présents ne sont pas proposés ici.</span></div>'}
        </div>
        <footer><span>${selectedCount}/${picker.capacity} sélectionné${selectedCount > 1 ? 's' : ''}</span><div><button type="button" class="btn" data-ce-action="picker-close">Annuler</button><button type="button" class="btn primary" data-ce-action="picker-confirm" ${selectedCount ? '' : 'disabled'}>${picker.mode === 'add' ? 'Inviter' : 'Continuer'}</button></div></footer>
      </section></div>`;
  }

  async function confirmPicker() {
    if (!picker?.selected.size) return;
    const data = picker;
    if (data.mode === 'add') {
      if (!active) return;
      const ids = [...data.selected];
      picker = null; renderPicker();
      await api.rpc('invite_to_call_v1', { p_call_id: active.call.id, p_target_user_ids: ids });
      active.statusMessage = `${ids.length} invitation${ids.length > 1 ? 's' : ''} envoyée${ids.length > 1 ? 's' : ''}`;
      await syncCall(active, { immediate: true });
      return;
    }
    picker = null; renderPicker();
    await preparePrejoin({ targetIds: [...data.selected], projectId: data.projectId, meetingId: data.meetingId });
  }

  async function preparePrejoin({ targetIds, projectId = null, meetingId = null }) {
    if (prejoin?.stream) prejoin.stream.getTracks().forEach((track) => track.stop());
    const stream = await acquireLocalMedia({ facingMode: 'user' });
    const devices = await enumerateMediaDevices();
    const cam = stream.getVideoTracks()[0] || null;
    const mic = stream.getAudioTracks()[0] || null;
    prejoin = {
      targetIds,
      projectId,
      meetingId,
      stream,
      cameraTrack: cam,
      micTrack: mic,
      facingMode: cam?.getSettings?.().facingMode || 'user',
      devices,
      cameraDeviceId: cam?.getSettings?.().deviceId || '',
      micDeviceId: mic?.getSettings?.().deviceId || '',
      speakerDeviceId: '',
    };
    renderPrejoin();
  }

  function mediaSelect(kind, devices, selected) {
    if (!devices.length) return '';
    const label = kind === 'camera' ? 'Caméra' : kind === 'mic' ? 'Micro' : 'Haut-parleur';
    return `<label><span>${label}</span><select data-ce-device="${kind}">${devices.map((device, index) => `<option value="${escAttr(device.deviceId)}" ${device.deviceId === selected ? 'selected' : ''}>${esc(device.label || `${label} ${index + 1}`)}</option>`).join('')}</select></label>`;
  }

  function renderPrejoin() {
    if (!prejoin) { removeNode('call-engine-v2-prejoin'); return; }
    const node = prejoinRoot();
    node.innerHTML = `<div class="ce-v2-backdrop">
      <section class="ce-v2-dialog ce-v2-prejoin" role="dialog" aria-modal="true" aria-labelledby="ce-v2-prejoin-title">
        <header><div><small>Avant de rejoindre</small><h2 id="ce-v2-prejoin-title">Vérifiez votre caméra et votre micro</h2><p>${prejoin.targetIds.length} participant${prejoin.targetIds.length > 1 ? 's' : ''} à appeler.</p></div><button type="button" class="ce-v2-icon" data-ce-action="prejoin-cancel" aria-label="Fermer">×</button></header>
        <div class="ce-v2-preview ${prejoin.cameraTrack?.enabled ? '' : 'camera-off'}"><video id="ce-v2-prejoin-video" autoplay playsinline muted></video><div class="ce-v2-avatar-fallback">${esc(initials(uid()))}</div></div>
        <div class="ce-v2-prejoin-controls">
          <button type="button" class="ce-v2-round ${prejoin.micTrack?.enabled ? '' : 'off'}" data-ce-action="prejoin-mic">🎙 <span>${prejoin.micTrack?.enabled ? 'Micro actif' : 'Micro coupé'}</span></button>
          <button type="button" class="ce-v2-round ${prejoin.cameraTrack?.enabled ? '' : 'off'}" data-ce-action="prejoin-camera" ${prejoin.cameraTrack ? '' : 'disabled'}>▣ <span>${prejoin.cameraTrack?.enabled ? 'Caméra active' : 'Caméra coupée'}</span></button>
          ${prejoin.devices.cameras.length > 1 ? '<button type="button" class="ce-v2-round" data-ce-action="prejoin-switch">↻ <span>Changer caméra</span></button>' : ''}
        </div>
        <div class="ce-v2-device-grid">${mediaSelect('camera', prejoin.devices.cameras, prejoin.cameraDeviceId)}${mediaSelect('mic', prejoin.devices.mics, prejoin.micDeviceId)}${typeof HTMLMediaElement !== 'undefined' && 'setSinkId' in HTMLMediaElement.prototype ? mediaSelect('speaker', prejoin.devices.speakers, prejoin.speakerDeviceId) : ''}</div>
        <footer><button type="button" class="btn" data-ce-action="prejoin-cancel">Annuler</button><button type="button" class="btn primary" data-ce-action="prejoin-start">Appeler</button></footer>
      </section></div>`;
    const video = document.getElementById('ce-v2-prejoin-video');
    if (video) { video.srcObject = prejoin.stream; void video.play().catch(() => {}); }
  }

  async function replacePrejoinTrack(kind, deviceId = '') {
    if (!prejoin) return;
    if (kind === 'speaker') { prejoin.speakerDeviceId = deviceId; renderPrejoin(); return; }
    const old = kind === 'camera' ? prejoin.cameraTrack : prejoin.micTrack;
    const enabled = old?.enabled !== false;
    const constraints = kind === 'camera'
      ? { video: deviceId ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } } : { facingMode: { ideal: prejoin.facingMode || 'user' } }, audio: false }
      : { audio: deviceId ? { deviceId: { exact: deviceId }, echoCancellation: true, noiseSuppression: true, autoGainControl: true } : true, video: false };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    const next = kind === 'camera' ? stream.getVideoTracks()[0] : stream.getAudioTracks()[0];
    if (!next) return;
    next.enabled = enabled;
    if (old) { prejoin.stream.removeTrack(old); old.stop(); }
    prejoin.stream.addTrack(next);
    if (kind === 'camera') {
      prejoin.cameraTrack = next;
      prejoin.cameraDeviceId = next.getSettings?.().deviceId || deviceId;
      prejoin.facingMode = next.getSettings?.().facingMode || prejoin.facingMode;
    } else {
      prejoin.micTrack = next;
      prejoin.micDeviceId = next.getSettings?.().deviceId || deviceId;
    }
    prejoin.devices = await enumerateMediaDevices();
    renderPrejoin();
  }

  async function switchPrejoinCamera() {
    if (!prejoin?.cameraTrack) return;
    const nextFacing = prejoin.facingMode === 'environment' ? 'user' : 'environment';
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: nextFacing }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    const enabled = prejoin.cameraTrack.enabled;
    prejoin.stream.removeTrack(prejoin.cameraTrack); prejoin.cameraTrack.stop();
    track.enabled = enabled; prejoin.stream.addTrack(track); prejoin.cameraTrack = track;
    prejoin.facingMode = track.getSettings?.().facingMode || nextFacing;
    prejoin.cameraDeviceId = track.getSettings?.().deviceId || '';
    prejoin.devices = await enumerateMediaDevices();
    renderPrejoin();
  }

  function cancelPrejoin() {
    prejoin?.stream?.getTracks().forEach((track) => track.stop());
    prejoin = null; renderPrejoin();
  }

  async function startPreparedCall() {
    if (!prejoin || busy) return;
    busy = true;
    try {
      const prepared = prejoin;
      prejoin = null; renderPrejoin();
      let call;
      if (prepared.meetingId && prepared.projectId) {
        call = one(await api.rpc('start_call_v1', { p_project_id: prepared.projectId, p_conversation_id: null, p_meeting_id: prepared.meetingId }));
        if (prepared.targetIds.length) await api.rpc('invite_to_call_v1', { p_call_id: call.id, p_target_user_ids: prepared.targetIds });
      } else {
        call = one(await api.rpc('start_private_call_v2', { p_workspace_id: workspaceId(), p_target_user_ids: prepared.targetIds, p_project_id: prepared.projectId || null }));
      }
      await connectCall(call, prepared.stream, { resume: false, speakerDeviceId: prepared.speakerDeviceId });
    } catch (error) {
      console.error('[2b2c call v2] start failed', error);
      showEngineError('Impossible de démarrer la visio', error);
    } finally { busy = false; }
  }

  async function acceptIncoming(callIdValue) {
    if (!callIdValue || active || busy) return;
    busy = true;
    try {
      const call = one(await api.rpc('respond_call_invite_v1', { p_call_id: callIdValue, p_accept: true }));
      removeNode('incoming-call-v2'); removeNode('incoming-call-v1');
      const stream = await acquireLocalMedia({ facingMode: 'user' });
      await connectCall(call, stream, { resume: false });
    } catch (error) {
      console.error('[2b2c call v2] accept failed', error);
      showEngineError('Impossible de rejoindre la visio', error);
    } finally { busy = false; }
  }

  async function declineIncoming(callIdValue) {
    if (!callIdValue) return;
    try { await api.rpc('respond_call_invite_v1', { p_call_id: callIdValue, p_accept: false }); }
    catch (error) { console.warn('[2b2c call v2] decline failed', error); }
    removeNode('incoming-call-v2'); removeNode('incoming-call-v1');
  }

  async function connectCall(call, stream, { resume = false, speakerDeviceId = '' } = {}) {
    const user = await getUser();
    if (!user?.id || !call?.id) throw new Error('Session d’appel invalide.');
    await api.rpc('join_call_v1', { p_call_id: call.id });
    const ice = await loadIceConfig();
    await loadRoster(call.workspace_id || workspaceId());
    const cameraTrack = stream.getVideoTracks()[0] || null;
    const micTrack = stream.getAudioTracks()[0] || null;
    active = {
      call,
      localStream: stream,
      micTrack,
      cameraTrack,
      screenTrack: null,
      facingMode: cameraTrack?.getSettings?.().facingMode || 'user',
      iceServers: ice.iceServers,
      iceMode: ice.mode,
      iceWarning: ice.warning,
      peers: new Map(),
      participants: [],
      invites: [],
      lastSignalId: 0,
      syncFailures: 0,
      syncTimer: null,
      heartbeatTimer: null,
      statsTimer: null,
      renderTimer: null,
      networkLabel: 'Connexion…',
      networkDetail: 'Établissement de la connexion',
      minimized: false,
      endConfirmUntil: 0,
      statusMessage: '',
      speakerDeviceId,
      resume,
      stopped: false,
    };
    document.documentElement.classList.add('call-engine-v2-active');
    removeNode('call-engine-v2-resume'); resumeCall = null;
    if (resume) {
      try {
        const snapshot = one(await api.rpc('get_call_sync_v2', { p_call_id: call.id, p_after_signal_id: 0 }));
        active.lastSignalId = Number(snapshot?.latest_signal_id || 0);
        active.participants = Array.isArray(snapshot?.participants) ? snapshot.participants : [];
        active.invites = Array.isArray(snapshot?.invites) ? snapshot.invites : [];
      } catch (error) { console.warn('[2b2c call v2] resume baseline failed', error); }
    }
    await syncMediaState(active);
    renderActive();
    active.heartbeatTimer = setInterval(() => void heartbeat(active), HEARTBEAT_MS);
    active.statsTimer = setInterval(() => void updateStats(active), STATS_MS);
    void heartbeat(active);
    void syncCall(active, { immediate: true });
  }

  async function heartbeat(ctx) {
    if (!ctx || ctx.stopped || active !== ctx) return;
    try { await api.rpc('heartbeat_call_v1', { p_call_id: ctx.call.id }); }
    catch (error) { console.warn('[2b2c call v2] heartbeat failed', error); }
  }

  async function syncMediaState(ctx) {
    if (!ctx || ctx.stopped) return;
    try {
      await api.rpc('set_call_media_state_v1', {
        p_call_id: ctx.call.id,
        p_mic: Boolean(ctx.micTrack?.enabled),
        p_camera: Boolean(ctx.cameraTrack?.enabled),
        p_screen: Boolean(ctx.screenTrack),
      });
    } catch (error) { console.warn('[2b2c call v2] media state failed', error); }
  }

  async function syncCall(ctx, { immediate = false } = {}) {
    if (!ctx || ctx.stopped || active !== ctx || ctx.syncing) return;
    if (ctx.syncTimer) { clearTimeout(ctx.syncTimer); ctx.syncTimer = null; }
    ctx.syncing = true;
    try {
      const snapshot = one(await api.rpc('get_call_sync_v2', { p_call_id: ctx.call.id, p_after_signal_id: ctx.lastSignalId }));
      if (!snapshot?.call || snapshot.call.ended_at || snapshot.call.status === 'ended') {
        cleanupCall(ctx, { stopTracks: true }); active = null; renderActive(); return;
      }
      ctx.call = snapshot.call;
      ctx.participants = Array.isArray(snapshot.participants) ? snapshot.participants : [];
      ctx.invites = Array.isArray(snapshot.invites) ? snapshot.invites : [];
      ctx.syncFailures = 0;

      const remoteIds = new Set(ctx.participants.map((p) => p.user_id).filter((id) => id && id !== uid()));
      for (const remoteId of remoteIds) await ensurePeer(ctx, remoteId);
      for (const [remoteId, peer] of [...ctx.peers]) {
        if (!remoteIds.has(remoteId)) closePeer(ctx, peer, { remove: true });
      }

      const signals = Array.isArray(snapshot.signals) ? snapshot.signals : [];
      for (const signal of signals) {
        try {
          await processSignal(ctx, signal);
          ctx.lastSignalId = Math.max(ctx.lastSignalId, Number(signal.id || 0));
        } catch (error) {
          console.warn('[2b2c call v2] signal processing paused', signal?.signal_type, error);
          break;
        }
      }
      renderActive();
    } catch (error) {
      ctx.syncFailures += 1;
      ctx.networkLabel = 'Reconnexion…';
      ctx.networkDetail = error?.message || 'Synchronisation momentanément indisponible';
      console.warn('[2b2c call v2] sync failed', error);
      renderActive();
    } finally {
      ctx.syncing = false;
      if (!ctx.stopped && active === ctx) {
        const delay = immediate ? 100 : Math.min(2500, SYNC_MS + ctx.syncFailures * 250);
        ctx.syncTimer = setTimeout(() => void syncCall(ctx), delay);
      }
    }
  }

  async function ensurePeer(ctx, remoteUserId) {
    if (ctx.peers.has(remoteUserId)) return ctx.peers.get(remoteUserId);
    const pc = new RTCPeerConnection({ iceServers: ctx.iceServers, bundlePolicy: 'max-bundle', iceCandidatePoolSize: 4 });
    const peer = {
      remoteUserId,
      pc,
      polite: String(uid()) > String(remoteUserId),
      makingOffer: false,
      ignoreOffer: false,
      isSettingRemoteAnswerPending: false,
      pendingIce: [],
      restartAttempts: 0,
      restartInFlight: false,
      disconnectTimer: null,
      audioStream: new MediaStream(),
      cameraStream: new MediaStream(),
      screenStream: new MediaStream(),
      stats: null,
      state: 'connecting',
    };
    peer.audioTx = pc.addTransceiver('audio', { direction: 'sendrecv' });
    peer.cameraTx = pc.addTransceiver('video', { direction: 'sendrecv' });
    peer.screenTx = pc.addTransceiver('video', { direction: 'sendrecv' });
    ctx.peers.set(remoteUserId, peer);

    if (ctx.micTrack) await peer.audioTx.sender.replaceTrack(ctx.micTrack);
    if (ctx.cameraTrack) await peer.cameraTx.sender.replaceTrack(ctx.cameraTrack);
    if (ctx.screenTrack) await peer.screenTx.sender.replaceTrack(ctx.screenTrack);

    pc.onicecandidate = (event) => {
      if (event.candidate && active === ctx && !ctx.stopped) {
        void sendSignal(ctx, remoteUserId, 'ice', event.candidate.toJSON()).catch((error) => console.warn('[2b2c call v2] ICE send failed', error));
      }
    };
    pc.onicecandidateerror = (event) => {
      console.warn('[2b2c call v2] ICE candidate error', event?.errorCode, event?.errorText);
    };
    pc.onnegotiationneeded = () => void makeOffer(ctx, peer, false);
    pc.ontrack = (event) => handleRemoteTrack(ctx, peer, event);
    pc.onconnectionstatechange = () => handleConnectionState(ctx, peer);
    pc.oniceconnectionstatechange = () => handleIceState(ctx, peer);
    return peer;
  }

  async function sendSignal(ctx, remoteUserId, type, payload) {
    if (!ctx || ctx.stopped || active !== ctx) return;
    await api.rpc('send_call_signal_v1', {
      p_call_id: ctx.call.id,
      p_to_user: remoteUserId,
      p_signal_type: type,
      p_payload: payload,
    });
  }

  async function makeOffer(ctx, peer, iceRestart = false) {
    const { pc } = peer;
    if (!ctx || ctx.stopped || pc.signalingState === 'closed' || peer.makingOffer) return;
    if (pc.signalingState !== 'stable') return;
    try {
      peer.makingOffer = true;
      const offer = await pc.createOffer(iceRestart ? { iceRestart: true } : undefined);
      if (pc.signalingState !== 'stable') return;
      await pc.setLocalDescription(offer);
      await sendSignal(ctx, peer.remoteUserId, 'offer', { type: pc.localDescription.type, sdp: pc.localDescription.sdp, engine: 'v2', created_at: nowIso() });
    } catch (error) {
      console.warn('[2b2c call v2] offer failed', error);
    } finally { peer.makingOffer = false; }
  }

  async function processSignal(ctx, signal) {
    const remoteUserId = signal.from_user;
    if (!remoteUserId || remoteUserId === uid()) return;
    const peer = await ensurePeer(ctx, remoteUserId);
    const pc = peer.pc;
    if (signal.signal_type === 'ice') {
      if (!pc.remoteDescription) { peer.pendingIce.push(signal.payload); return; }
      try { await pc.addIceCandidate(signal.payload); }
      catch (error) { if (!peer.ignoreOffer) throw error; }
      return;
    }
    if (!['offer', 'answer'].includes(signal.signal_type)) return;
    const description = { type: signal.signal_type, sdp: signal.payload?.sdp || '' };
    if (!description.sdp) return;
    const readyForOffer = !peer.makingOffer && (pc.signalingState === 'stable' || peer.isSettingRemoteAnswerPending);
    const offerCollision = description.type === 'offer' && !readyForOffer;
    peer.ignoreOffer = !peer.polite && offerCollision;
    if (peer.ignoreOffer) return;
    peer.isSettingRemoteAnswerPending = description.type === 'answer';
    await pc.setRemoteDescription(description);
    peer.isSettingRemoteAnswerPending = false;
    if (description.type === 'offer') {
      await pc.setLocalDescription(await pc.createAnswer());
      await sendSignal(ctx, remoteUserId, 'answer', { type: pc.localDescription.type, sdp: pc.localDescription.sdp, engine: 'v2', created_at: nowIso() });
    }
    if (pc.remoteDescription && peer.pendingIce.length) {
      const pending = peer.pendingIce.splice(0);
      for (const candidate of pending) {
        try { await pc.addIceCandidate(candidate); }
        catch (error) { if (!peer.ignoreOffer) console.warn('[2b2c call v2] queued ICE failed', error); }
      }
    }
  }

  function handleRemoteTrack(ctx, peer, event) {
    const track = event.track;
    let stream;
    if (event.transceiver === peer.audioTx || track.kind === 'audio') stream = peer.audioStream;
    else if (event.transceiver === peer.screenTx) stream = peer.screenStream;
    else stream = peer.cameraStream;
    for (const existing of stream.getTracks()) if (existing.kind === track.kind && existing.id !== track.id) stream.removeTrack(existing);
    if (!stream.getTracks().some((item) => item.id === track.id)) stream.addTrack(track);
    track.onunmute = () => renderActive();
    track.onmute = () => renderActive();
    track.onended = () => { try { stream.removeTrack(track); } catch {} renderActive(); };
    renderActive();
  }

  function handleConnectionState(ctx, peer) {
    const state = peer.pc.connectionState;
    peer.state = state;
    if (state === 'connected') {
      peer.restartAttempts = 0;
      if (peer.disconnectTimer) { clearTimeout(peer.disconnectTimer); peer.disconnectTimer = null; }
    } else if (state === 'failed') {
      void restartPeer(ctx, peer, 'connection-failed');
    } else if (state === 'disconnected') {
      if (!peer.disconnectTimer) peer.disconnectTimer = setTimeout(() => {
        peer.disconnectTimer = null;
        if (['disconnected', 'failed'].includes(peer.pc.connectionState)) void restartPeer(ctx, peer, 'connection-disconnected');
      }, 3500);
    }
    renderActive();
  }

  function handleIceState(ctx, peer) {
    if (peer.pc.iceConnectionState === 'failed') void restartPeer(ctx, peer, 'ice-failed');
    renderActive();
  }

  async function restartPeer(ctx, peer, reason) {
    if (!ctx || ctx.stopped || active !== ctx || peer.restartInFlight || peer.pc.signalingState === 'closed') return;
    peer.restartInFlight = true;
    peer.restartAttempts += 1;
    peer.state = 'reconnecting';
    ctx.networkLabel = 'Reconnexion…';
    ctx.networkDetail = `Reprise de la connexion (${reason})`;
    renderActive();
    try {
      if (peer.restartAttempts <= 3) {
        peer.pc.restartIce?.();
        await makeOffer(ctx, peer, true);
      } else {
        const id = peer.remoteUserId;
        closePeer(ctx, peer, { remove: true });
        await sleep(250);
        await ensurePeer(ctx, id);
      }
    } finally { peer.restartInFlight = false; }
  }

  function closePeer(ctx, peer, { remove = false } = {}) {
    if (peer.disconnectTimer) clearTimeout(peer.disconnectTimer);
    try { peer.pc.ontrack = null; peer.pc.onicecandidate = null; peer.pc.onnegotiationneeded = null; peer.pc.close(); } catch {}
    if (remove) ctx.peers.delete(peer.remoteUserId);
  }

  async function updateStats(ctx) {
    if (!ctx || ctx.stopped || active !== ctx) return;
    let connected = 0;
    let reconnecting = 0;
    let relay = false;
    let maxRtt = 0;
    for (const peer of ctx.peers.values()) {
      try {
        const reports = await peer.pc.getStats();
        let selectedPair = null;
        const candidates = new Map();
        reports.forEach((report) => {
          if (report.type === 'local-candidate' || report.type === 'remote-candidate') candidates.set(report.id, report);
          if (report.type === 'candidate-pair' && report.state === 'succeeded' && (report.nominated || report.selected)) selectedPair = report;
        });
        if (selectedPair) {
          const local = candidates.get(selectedPair.localCandidateId);
          const remote = candidates.get(selectedPair.remoteCandidateId);
          const rtt = Number(selectedPair.currentRoundTripTime || 0);
          maxRtt = Math.max(maxRtt, rtt);
          relay ||= local?.candidateType === 'relay' || remote?.candidateType === 'relay';
          peer.stats = { rtt, localType: local?.candidateType || '', remoteType: remote?.candidateType || '' };
        }
      } catch {}
      if (peer.pc.connectionState === 'connected') connected += 1;
      if (['failed', 'disconnected'].includes(peer.pc.connectionState) || peer.state === 'reconnecting') reconnecting += 1;
    }
    if (!ctx.peers.size) {
      ctx.networkLabel = 'En attente';
      ctx.networkDetail = ctx.iceMode === 'turn' ? 'Relais TURN prêt' : (ctx.iceWarning || 'En attente d’un participant');
    } else if (reconnecting) {
      ctx.networkLabel = 'Reconnexion…';
      ctx.networkDetail = `${reconnecting} connexion${reconnecting > 1 ? 's' : ''} à rétablir`;
    } else if (connected === ctx.peers.size) {
      ctx.networkLabel = relay ? 'Connecté · TURN' : 'Connecté';
      ctx.networkDetail = `${relay ? 'Relais TURN' : 'Connexion directe'}${maxRtt ? ` · ${Math.round(maxRtt * 1000)} ms` : ''}`;
    } else {
      ctx.networkLabel = 'Connexion…';
      ctx.networkDetail = `${connected}/${ctx.peers.size} liaison${ctx.peers.size > 1 ? 's' : ''} établie${ctx.peers.size > 1 ? 's' : ''}`;
    }
    renderActive();
  }

  function activeParticipant(userId) { return active?.participants?.find((p) => p.user_id === userId) || null; }
  function activeRemoteScreenIds() {
    if (!active) return [];
    return active.participants.filter((p) => p.user_id !== uid() && p.screen_enabled && active.peers.get(p.user_id)?.screenStream?.getVideoTracks().length).map((p) => p.user_id);
  }

  function remoteCameraTile(userId, compact = false) {
    const peer = active?.peers.get(userId);
    const participant = activeParticipant(userId);
    const hasVideo = Boolean(peer?.cameraStream?.getVideoTracks().length && participant?.camera_enabled !== false);
    return `<div class="ce-v2-tile ${compact ? 'compact' : ''} ${hasVideo ? '' : 'video-off'}" data-user="${escAttr(userId)}">
      ${hasVideo ? `<video id="ce-v2-cam-${escAttr(userId)}" autoplay playsinline muted></video>` : `<div class="ce-v2-avatar large">${esc(initials(userId))}</div>`}
      <span>${esc(displayName(userId))}${participant?.mic_enabled === false ? ' · muet' : ''}</span>
    </div>`;
  }

  function localCameraTile(compact = false) {
    const hasVideo = Boolean(active?.cameraTrack?.enabled);
    return `<div class="ce-v2-tile local ${compact ? 'compact' : ''} ${hasVideo ? '' : 'video-off'}">
      ${hasVideo ? '<video id="ce-v2-local-camera" autoplay playsinline muted></video>' : `<div class="ce-v2-avatar large">${esc(initials(uid()))}</div>`}
      <span>Vous${active?.micTrack?.enabled === false ? ' · muet' : ''}</span>
    </div>`;
  }

  function renderActive() {
    if (!active) { removeNode('call-engine-v2-active'); document.documentElement.classList.remove('call-engine-v2-active'); return; }
    const ctx = active;
    const node = activeRoot();
    document.documentElement.classList.add('call-engine-v2-active');
    const remotes = ctx.participants.filter((p) => p.user_id !== uid());
    const screenIds = activeRemoteScreenIds();
    const primaryRemoteScreen = screenIds[0] || '';
    const sharingLocal = Boolean(ctx.screenTrack);
    const participantsCount = Math.max(1, ctx.participants.length || 1);
    const title = ctx.call.project_id ? 'Visio projet' : 'Visio 2b2c';
    const elapsed = ctx.call.started_at ? Math.max(0, Math.floor((Date.now() - new Date(ctx.call.started_at).getTime()) / 1000)) : 0;
    const duration = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
    const inviteStatus = (ctx.invites || []).filter((i) => i.status === 'pending').length;
    const stage = primaryRemoteScreen
      ? `<div class="ce-v2-screen-stage"><video id="ce-v2-screen-${escAttr(primaryRemoteScreen)}" autoplay playsinline muted></video><div class="ce-v2-screen-label">Écran de ${esc(displayName(primaryRemoteScreen))}</div></div>
         <div class="ce-v2-filmstrip">${localCameraTile(true)}${remotes.map((p) => remoteCameraTile(p.user_id, true)).join('')}</div>`
      : sharingLocal
        ? `<div class="ce-v2-screen-stage local-screen"><video id="ce-v2-local-screen" autoplay playsinline muted></video><div class="ce-v2-screen-label">Votre écran partagé</div></div>
           <div class="ce-v2-filmstrip">${localCameraTile(true)}${remotes.map((p) => remoteCameraTile(p.user_id, true)).join('')}</div>`
        : `<div class="ce-v2-grid count-${Math.min(MAX_PARTICIPANTS, participantsCount)}">${localCameraTile(false)}${remotes.map((p) => remoteCameraTile(p.user_id, false)).join('')}</div>`;
    const pendingRows = inviteStatus ? `<div class="ce-v2-pending">${ctx.invites.filter((i) => i.status === 'pending').map((i) => `<span>${esc(displayName(i.invited_user_id))} · sonne…</span>`).join('')}</div>` : '';
    const turnWarning = ctx.iceWarning ? `<div class="ce-v2-warning">${esc(ctx.iceWarning)}</div>` : '';
    const screenSupported = Boolean(navigator.mediaDevices?.getDisplayMedia);
    const renderKey = JSON.stringify({
      minimized: ctx.minimized,
      participants: ctx.participants.map((p) => [p.user_id, p.mic_enabled, p.camera_enabled, p.screen_enabled]),
      invites: ctx.invites.map((i) => [i.invited_user_id, i.status]),
      local: [Boolean(ctx.micTrack?.enabled), Boolean(ctx.cameraTrack?.enabled), ctx.screenTrack?.id || ''],
      remote: [...ctx.peers].map(([id, peer]) => [id, peer.pc.connectionState, peer.cameraStream.getVideoTracks().map((t) => `${t.id}:${t.muted}`).join(','), peer.screenStream.getVideoTracks().map((t) => `${t.id}:${t.muted}`).join(',')]),
      network: [ctx.networkLabel, ctx.networkDetail, ctx.iceWarning],
      statusMessage: ctx.statusMessage,
      endConfirm: ctx.endConfirmUntil > Date.now(),
    });
    if (ctx.lastRenderKey === renderKey && node.childElementCount) {
      const durationNode = node.querySelector('[data-ce-duration]');
      if (durationNode) durationNode.textContent = duration;
      attachStreams();
      return;
    }
    ctx.lastRenderKey = renderKey;
    node.innerHTML = ctx.minimized
      ? `<aside class="ce-v2-dock"><span class="ce-v2-live-dot"></span><div><strong>${esc(title)}</strong><small>${participantsCount} participant${participantsCount > 1 ? 's' : ''} · ${esc(ctx.networkLabel)}</small></div><button data-ce-action="restore" type="button">Ouvrir</button><button data-ce-action="leave" type="button" class="danger">Quitter</button></aside>`
      : `<section class="ce-v2-call-shell" role="dialog" aria-modal="false" aria-label="Visio en cours">
          <header class="ce-v2-call-head"><div><span class="ce-v2-live"><i></i> En direct</span><strong>${esc(title)}</strong><small>${participantsCount} participant${participantsCount > 1 ? 's' : ''} · <span data-ce-duration>${duration}</span></small></div><div class="ce-v2-head-actions"><span class="ce-v2-network ${ctx.networkLabel.includes('Reconnexion') ? 'weak' : ctx.networkLabel.startsWith('Connecté') ? 'good' : ''}" title="${escAttr(ctx.networkDetail)}">${esc(ctx.networkLabel)}</span><button type="button" data-ce-action="minimize" aria-label="Réduire">—</button><button type="button" data-ce-action="fullscreen" aria-label="Plein écran">⛶</button>${ctx.call.started_by === uid() ? `<button type="button" class="danger-soft" data-ce-action="end">${ctx.endConfirmUntil > Date.now() ? 'Confirmer' : 'Terminer pour tous'}</button>` : ''}</div></header>
          ${turnWarning}${ctx.statusMessage ? `<div class="ce-v2-status">${esc(ctx.statusMessage)}</div>` : ''}
          <div class="ce-v2-stage">${stage}${pendingRows}</div>
          <footer class="ce-v2-controls">
            <button type="button" class="${ctx.micTrack?.enabled ? '' : 'off'}" data-ce-action="mic">🎙<small>${ctx.micTrack?.enabled ? 'Micro' : 'Muet'}</small></button>
            <button type="button" class="${ctx.cameraTrack?.enabled ? '' : 'off'}" data-ce-action="camera" ${ctx.cameraTrack ? '' : 'disabled'}>▣<small>${ctx.cameraTrack?.enabled ? 'Caméra' : 'Caméra off'}</small></button>
            ${ctx.cameraTrack ? '<button type="button" data-ce-action="switch-camera">↻<small>Changer</small></button>' : ''}
            ${screenSupported ? `<button type="button" class="${ctx.screenTrack ? 'sharing' : ''}" data-ce-action="screen">▤<small>${ctx.screenTrack ? 'Arrêter' : 'Partager'}</small></button>` : ''}
            <button type="button" data-ce-action="devices">⚙<small>Périphériques</small></button>
            <button type="button" data-ce-action="add">＋<small>Participants</small></button>
            <button type="button" class="danger" data-ce-action="leave">☎<small>Quitter</small></button>
          </footer>
        </section>`;
    attachStreams();
  }

  function attachStreams() {
    if (!active) return;
    const localCam = document.getElementById('ce-v2-local-camera');
    if (localCam) { localCam.srcObject = new MediaStream(active.cameraTrack ? [active.cameraTrack] : []); localCam.muted = true; void localCam.play().catch(() => {}); }
    const localScreen = document.getElementById('ce-v2-local-screen');
    if (localScreen && active.screenTrack) { localScreen.srcObject = new MediaStream([active.screenTrack]); localScreen.muted = true; void localScreen.play().catch(() => {}); }
    for (const [userId, peer] of active.peers) {
      const video = document.getElementById(`ce-v2-cam-${userId}`);
      if (video) { video.srcObject = peer.cameraStream; video.muted = true; void video.play().catch(() => {}); }
      const screen = document.getElementById(`ce-v2-screen-${userId}`);
      if (screen) { screen.srcObject = peer.screenStream; screen.muted = true; void screen.play().catch(() => {}); }
      let audio = document.getElementById(`ce-v2-audio-${userId}`);
      if (!audio) {
        audio = document.createElement('audio'); audio.id = `ce-v2-audio-${userId}`; audio.autoplay = true; audio.playsInline = true; audio.hidden = true;
        activeRoot().appendChild(audio);
      }
      audio.srcObject = peer.audioStream;
      if (active.speakerDeviceId && typeof audio.setSinkId === 'function') void audio.setSinkId(active.speakerDeviceId).catch(() => {});
      void audio.play().catch(() => {});
    }
  }

  async function toggleMic() {
    if (!active?.micTrack) return;
    active.micTrack.enabled = !active.micTrack.enabled;
    await syncMediaState(active); renderActive();
  }
  async function toggleCamera() {
    if (!active?.cameraTrack) return;
    active.cameraTrack.enabled = !active.cameraTrack.enabled;
    await syncMediaState(active); renderActive();
  }

  async function switchCamera() {
    if (!active?.cameraTrack) return;
    const nextFacing = active.facingMode === 'environment' ? 'user' : 'environment';
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: nextFacing }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      const track = stream.getVideoTracks()[0]; if (!track) return;
      track.enabled = active.cameraTrack.enabled;
      const old = active.cameraTrack; active.localStream.removeTrack(old); old.stop(); active.localStream.addTrack(track); active.cameraTrack = track;
      active.facingMode = track.getSettings?.().facingMode || nextFacing;
      for (const peer of active.peers.values()) await peer.cameraTx.sender.replaceTrack(track);
      await syncMediaState(active); renderActive();
    } catch (error) { showEngineError('Impossible de changer de caméra', error); }
  }

  async function toggleScreen() {
    if (!active) return;
    if (active.screenTrack) {
      const old = active.screenTrack; active.screenTrack = null; old.onended = null; old.stop();
      for (const peer of active.peers.values()) { await peer.screenTx.sender.replaceTrack(null); void makeOffer(active, peer, false); }
      await syncMediaState(active); renderActive(); return;
    }
    if (!navigator.mediaDevices?.getDisplayMedia) return;
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: { ideal: 15, max: 30 } }, audio: false });
      const track = stream.getVideoTracks()[0]; if (!track) return;
      active.screenTrack = track;
      for (const peer of active.peers.values()) { await peer.screenTx.sender.replaceTrack(track); void makeOffer(active, peer, false); }
      track.onended = () => { if (active?.screenTrack?.id === track.id) void toggleScreen(); };
      await syncMediaState(active); renderActive();
    } catch (error) {
      if (error?.name !== 'NotAllowedError') showEngineError('Partage d’écran indisponible', error);
    }
  }

  async function showDevices() {
    if (!active) return;
    const devices = await enumerateMediaDevices();
    const node = root('call-engine-v2-devices');
    const camId = active.cameraTrack?.getSettings?.().deviceId || '';
    const micId = active.micTrack?.getSettings?.().deviceId || '';
    node.innerHTML = `<div class="ce-v2-backdrop" data-ce-action="devices-close"><section class="ce-v2-dialog ce-v2-devices" role="dialog" aria-modal="true"><header><div><small>Visio</small><h2>Périphériques</h2><p>Choisissez la caméra, le micro et, si votre navigateur le permet, le haut-parleur.</p></div><button class="ce-v2-icon" type="button" data-ce-action="devices-close">×</button></header><div class="ce-v2-device-grid">${mediaSelect('camera', devices.cameras, camId)}${mediaSelect('mic', devices.mics, micId)}${typeof HTMLMediaElement !== 'undefined' && 'setSinkId' in HTMLMediaElement.prototype ? mediaSelect('speaker', devices.speakers, active.speakerDeviceId) : ''}</div><footer><button class="btn primary" type="button" data-ce-action="devices-close">Terminé</button></footer></section></div>`;
  }

  async function replaceActiveDevice(kind, deviceId) {
    if (!active) return;
    if (kind === 'speaker') {
      active.speakerDeviceId = deviceId; attachStreams(); return;
    }
    const old = kind === 'camera' ? active.cameraTrack : active.micTrack;
    const enabled = old?.enabled !== false;
    const stream = await navigator.mediaDevices.getUserMedia(kind === 'camera'
      ? { video: { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false }
      : { audio: { deviceId: { exact: deviceId }, echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false });
    const next = kind === 'camera' ? stream.getVideoTracks()[0] : stream.getAudioTracks()[0];
    if (!next) return;
    next.enabled = enabled;
    if (old) { active.localStream.removeTrack(old); old.stop(); }
    active.localStream.addTrack(next);
    if (kind === 'camera') {
      active.cameraTrack = next; active.facingMode = next.getSettings?.().facingMode || active.facingMode;
      for (const peer of active.peers.values()) { await peer.cameraTx.sender.replaceTrack(next); if (!old) void makeOffer(active, peer, false); }
    } else {
      active.micTrack = next;
      for (const peer of active.peers.values()) { await peer.audioTx.sender.replaceTrack(next); if (!old) void makeOffer(active, peer, false); }
    }
    await syncMediaState(active); renderActive();
  }

  async function leaveCall() {
    if (!active) return;
    const ctx = active;
    cleanupCall(ctx, { stopTracks: true }); active = null; renderActive();
    try { await api.rpc('leave_call_v1', { p_call_id: ctx.call.id }); }
    catch (error) { console.warn('[2b2c call v2] leave failed', error); }
  }

  async function endCall() {
    if (!active) return;
    if (!active.endConfirmUntil || active.endConfirmUntil < Date.now()) {
      active.endConfirmUntil = Date.now() + 5000; renderActive();
      setTimeout(() => { if (active?.endConfirmUntil && active.endConfirmUntil < Date.now()) { active.lastRenderKey = ''; renderActive(); } }, 5200);
      return;
    }
    const ctx = active;
    try { await api.rpc('end_call_v1', { p_call_id: ctx.call.id, p_expected_version: ctx.call.version }); }
    catch (error) { showEngineError('Impossible de terminer la visio', error); return; }
    cleanupCall(ctx, { stopTracks: true }); active = null; renderActive();
  }

  function cleanupCall(ctx, { stopTracks = false } = {}) {
    if (!ctx || ctx.stopped) return;
    ctx.stopped = true;
    if (ctx.syncTimer) clearTimeout(ctx.syncTimer);
    if (ctx.heartbeatTimer) clearInterval(ctx.heartbeatTimer);
    if (ctx.statsTimer) clearInterval(ctx.statsTimer);
    for (const peer of ctx.peers.values()) closePeer(ctx, peer);
    ctx.peers.clear();
    if (ctx.screenTrack) { ctx.screenTrack.onended = null; ctx.screenTrack.stop(); }
    if (stopTracks) ctx.localStream?.getTracks().forEach((track) => track.stop());
    removeNode('call-engine-v2-devices');
    document.documentElement.classList.remove('call-engine-v2-active');
  }

  async function retryConnections() {
    if (!active) return;
    active.syncFailures = 0;
    for (const peer of active.peers.values()) void restartPeer(active, peer, 'manual-retry');
    void syncCall(active, { immediate: true });
  }

  async function toggleFullscreen() {
    const shell = document.querySelector('#call-engine-v2-active .ce-v2-call-shell');
    if (!shell) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await shell.requestFullscreen?.();
    } catch {}
  }

  function showEngineError(title, error) {
    const node = root('call-engine-v2-error');
    node.innerHTML = `<div class="ce-v2-error"><strong>${esc(title)}</strong><span>${esc(error?.message || String(error || 'Erreur inconnue'))}</span><button type="button" data-ce-action="error-close">×</button></div>`;
    setTimeout(() => node.remove(), 9000);
  }

  async function probeResume() {
    if (active || prejoin || picker || busy || !api.getSession()?.access_token) { scheduleIdleProbe(); return; }
    try {
      const user = await getUser();
      if (!user?.id) { scheduleIdleProbe(); return; }
      const participants = await api.select('call_participants', `select=call_session_id,last_seen_at,joined_at&user_id=eq.${user.id}&left_at=is.null&order=joined_at.desc&limit=1`);
      const participant = participants?.[0];
      if (!participant) { resumeCall = null; renderResume(); scheduleIdleProbe(); return; }
      const calls = await api.select('call_sessions', `select=*&id=eq.${participant.call_session_id}&ended_at=is.null&limit=1`);
      resumeCall = calls?.[0] || null;
      renderResume();
    } catch (error) {
      console.warn('[2b2c call v2] resume probe failed', error);
    }
    scheduleIdleProbe();
  }

  function scheduleIdleProbe() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => void probeResume(), IDLE_PROBE_MS);
  }

  function renderResume() {
    if (!resumeCall || active) { removeNode('call-engine-v2-resume'); return; }
    const node = resumeRoot();
    node.innerHTML = `<section class="ce-v2-resume"><span class="ce-v2-live-dot"></span><div><small>Visio en cours</small><strong>Reprendre votre appel</strong><span>Votre session est toujours active.</span></div><button type="button" class="btn" data-ce-action="resume-leave" data-call="${escAttr(resumeCall.id)}">Quitter</button><button type="button" class="btn primary" data-ce-action="resume" data-call="${escAttr(resumeCall.id)}">Reprendre</button></section>`;
  }

  async function resumeExisting(callIdValue) {
    if (!callIdValue || active || busy) return;
    busy = true;
    try {
      const calls = await api.select('call_sessions', `select=*&id=eq.${callIdValue}&ended_at=is.null&limit=1`);
      const call = calls?.[0]; if (!call) throw new Error('Cette visio est terminée.');
      const stream = await acquireLocalMedia({ facingMode: 'user' });
      await connectCall(call, stream, { resume: true });
    } catch (error) { showEngineError('Impossible de reprendre la visio', error); }
    finally { busy = false; }
  }

  async function leaveResumable(callIdValue) {
    if (!callIdValue) return;
    try { await api.rpc('leave_call_v1', { p_call_id: callIdValue }); }
    catch (error) { console.warn('[2b2c call v2] leave resumable failed', error); }
    resumeCall = null; renderResume();
  }

  async function handleOpenProject(projectId) {
    await openPicker({ projectId, title: 'Visio du projet' });
  }

  async function handleOpenMeeting(meetingId, projectId) {
    await openPicker({ projectId, meetingId, title: 'Visio de la réunion' });
  }

  function intercept(event) {
    const target = event.target?.closest?.('[data-ce-action],[data-action],[data-cw-action]');
    if (!target) return false;
    const ce = target.dataset.ceAction;
    const legacy = target.dataset.action;
    const cw = target.dataset.cwAction;
    const ownedLegacy = new Set(['open-call-picker-v1','open-project-call-v1','open-meeting-call-v1','call-accept-v1','call-decline-v1','call-resume-v1','call-resume-leave-v1']);
    if (!ce && !ownedLegacy.has(legacy) && cw !== 'call-conversation') return false;
    event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
    void handleAction({ ce, legacy, cw, target });
    return true;
  }

  async function handleAction({ ce, legacy, cw, target }) {
    try {
      if (legacy === 'open-call-picker-v1') return openPicker();
      if (legacy === 'open-project-call-v1') return handleOpenProject(target.dataset.project || null);
      if (legacy === 'open-meeting-call-v1') return handleOpenMeeting(target.dataset.meeting || null, target.dataset.project || null);
      if (legacy === 'call-accept-v1') return acceptIncoming(target.dataset.call || '');
      if (legacy === 'call-decline-v1') return declineIncoming(target.dataset.call || '');
      if (legacy === 'call-resume-v1') return resumeExisting(target.dataset.call || '');
      if (legacy === 'call-resume-leave-v1') return leaveResumable(target.dataset.call || '');
      if (cw === 'call-conversation') {
        const match = (location.hash || '').match(/^#\/messages\/([^/?]+)/);
        const conversationId = match?.[1] || '';
        if (!conversationId) return openPicker();
        const user = await getUser();
        const [members, conversations] = await Promise.all([
          api.select('conversation_members', `select=user_id&conversation_id=eq.${conversationId}`),
          api.select('conversations', `select=id,project_id,linked_project_id&id=eq.${conversationId}`).catch(() => []),
        ]);
        const ids = (members || []).map((m) => m.user_id).filter((id) => id !== user?.id);
        const conversation = conversations?.[0] || null;
        return openPicker({ presetIds: ids, projectId: conversation?.project_id || conversation?.linked_project_id || null, title: 'Appeler la conversation' });
      }
      if (ce === 'picker-close') { picker = null; renderPicker(); return; }
      if (ce === 'picker-toggle') {
        const id = target.dataset.user; if (!picker || !id) return;
        if (picker.selected.has(id)) picker.selected.delete(id);
        else if (picker.selected.size < picker.capacity) picker.selected.add(id);
        renderPicker(); return;
      }
      if (ce === 'picker-confirm') return confirmPicker();
      if (ce === 'prejoin-cancel') return cancelPrejoin();
      if (ce === 'prejoin-mic') { if (prejoin?.micTrack) prejoin.micTrack.enabled = !prejoin.micTrack.enabled; renderPrejoin(); return; }
      if (ce === 'prejoin-camera') { if (prejoin?.cameraTrack) prejoin.cameraTrack.enabled = !prejoin.cameraTrack.enabled; renderPrejoin(); return; }
      if (ce === 'prejoin-switch') return switchPrejoinCamera();
      if (ce === 'prejoin-start') return startPreparedCall();
      if (ce === 'mic') return toggleMic();
      if (ce === 'camera') return toggleCamera();
      if (ce === 'switch-camera') return switchCamera();
      if (ce === 'screen') return toggleScreen();
      if (ce === 'devices') return showDevices();
      if (ce === 'devices-close') { removeNode('call-engine-v2-devices'); return; }
      if (ce === 'add') return openPicker({ mode: 'add', projectId: active?.call?.project_id || null, title: 'Ajouter des participants' });
      if (ce === 'leave') return leaveCall();
      if (ce === 'end') return endCall();
      if (ce === 'minimize') { if (active) { active.minimized = true; active.lastRenderKey = ''; renderActive(); } return; }
      if (ce === 'restore') { if (active) { active.minimized = false; active.lastRenderKey = ''; renderActive(); } return; }
      if (ce === 'fullscreen') return toggleFullscreen();
      if (ce === 'retry') return retryConnections();
      if (ce === 'resume') return resumeExisting(target.dataset.call || '');
      if (ce === 'resume-leave') return leaveResumable(target.dataset.call || '');
      if (ce === 'error-close') { removeNode('call-engine-v2-error'); return; }
    } catch (error) {
      console.error('[2b2c call v2] action failed', ce || legacy || cw, error);
      showEngineError('Action visio impossible', error);
    }
  }

  async function onDeviceChange(event) {
    const select = event.target?.closest?.('[data-ce-device]');
    if (!select) return;
    event.stopPropagation();
    const kind = select.dataset.ceDevice;
    try {
      if (prejoin) await replacePrejoinTrack(kind, select.value);
      else if (active) await replaceActiveDevice(kind, select.value);
    } catch (error) { showEngineError('Périphérique indisponible', error); }
  }

  function onExternalStart(event) {
    if (active) return;
    event.stopImmediatePropagation();
    const ids = Array.isArray(event.detail?.userIds) ? event.detail.userIds.filter(Boolean) : [];
    void openPicker({ presetIds: ids, projectId: event.detail?.projectId || null, title: 'Appeler' });
  }

  function onOnline() {
    if (!active) return;
    active.statusMessage = 'Réseau rétabli, reconnexion en cours…';
    active.lastRenderKey = '';
    void retryConnections();
  }

  function suppressLegacyCallUi() {
    document.getElementById('incoming-call-v1')?.remove();
    if (active || resumeCall) document.getElementById('resume-call-v1')?.remove();
  }

  ensureStylesheet();
  window.addEventListener('click', intercept, true);
  window.addEventListener('change', onDeviceChange, true);
  window.addEventListener('2b2c:start-call', onExternalStart);
  window.addEventListener('online', onOnline);
  window.addEventListener('pageshow', () => { suppressLegacyCallUi(); if (!active) void probeResume(); });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && active) { void heartbeat(active); void syncCall(active, { immediate: true }); }
  });
  setInterval(suppressLegacyCallUi, 1200);
  setTimeout(() => void probeResume(), 1200);

  window.__4B4C_CALL_ENGINE_V2__ = Object.freeze({
    version: '2.0.0',
    openPicker,
    acceptIncoming,
    declineIncoming,
    resumeExisting,
    get state() { return active ? 'active' : prejoin ? 'prejoin' : picker ? 'picker' : 'idle'; },
  });
}

/* 2b2c — native WebRTC calls v1 (4b4c runtime) */
(() => {
  const originalMeetingRow = meetingRow;
  let callUi = null;

  function callError(error) {
    const msg = String(error?.message || error || 'Erreur visio');
    const map = [
      ['CALL_FULL', 'Cet appel a atteint la limite de participants.'],
      ['CALL_NOT_LIVE', 'Cet appel est terminé.'],
      ['CALL_ACCESS_DENIED', 'Vous n’avez pas accès à cet appel.'],
      ['CALL_NOT_JOINED', 'Vous n’êtes plus dans cet appel.'],
      ['CALL_STALE', 'L’appel vient d’être modifié ailleurs.'],
      ['CALL_START_DENIED', 'Vous ne pouvez pas démarrer cet appel.'],
      ['CALL_MEETING_INVALID', 'Cette réunion ne peut pas ouvrir de visio.'],
      ['CALL_TARGET_UNAVAILABLE', 'Cette personne n’est pas disponible dans cet espace.'],
      ['CALL_SELF_DENIED', 'Vous ne pouvez pas vous appeler vous-même.'],
      ['CALL_DECLINE_DENIED', 'Cet appel n’est plus disponible.'],
      ['PROJECT_NOT_ACTIVE', 'Ce projet doit être actif pour lancer un appel.']
    ];
    for (const [token, label] of map) if (msg.includes(token)) return label;
    if (/NotAllowedError|Permission denied/i.test(msg)) return 'Autorisez le microphone (et la caméra si souhaitée) dans votre navigateur.';
    if (/NotFoundError/i.test(msg)) return 'Aucun microphone ou aucune caméra utilisable n’a été détecté.';
    return msg.replace(/^\w+\s*:\s*/, '');
  }

  meetingRow = function meetingRowWithNativeCall(m) {
    const base = originalMeetingRow(m);
    if (!m?.project_id || !['planned','live'].includes(m.status)) return base;
    return base.replace(
      '</div>',
      `<button class="btn small call-launch-v1" data-call-meeting="${escAttr(m.id)}" data-call-project="${escAttr(m.project_id)}">▣ Visio</button></div>`
    );
  };

  async function iceServers() {
    const session = api.getSession();
    if (!session?.access_token) throw new Error('Session expirée');
    try {
      const response = await fetch(`${window.__4B4C_CONFIG__.supabaseUrl}/functions/v1/call-ice-v1`, {
        method: 'POST',
        headers: {
          apikey: window.__4B4C_CONFIG__.supabasePublishableKey,
          authorization: `Bearer ${session.access_token}`,
          'content-type': 'application/json'
        },
        body: '{}'
      });
      if (!response.ok) throw new Error('ICE indisponible');
      const payload = await response.json();
      if (Array.isArray(payload?.iceServers) && payload.iceServers.length) return payload.iceServers;
    } catch (error) {
      console.warn('TURN indisponible, fallback STUN', error);
    }
    return [{ urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.cloudflare.com:53'] }];
  }

  async function localMedia() {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Audio/vidéo non disponible sur ce navigateur.');
    const audio = { echoCancellation: true, noiseSuppression: true, autoGainControl: true };
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio,
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 24, max: 30 } }
      });
    } catch (cameraError) {
      try {
        return await navigator.mediaDevices.getUserMedia({ audio, video: false });
      } catch {
        throw cameraError;
      }
    }
  }

  function attachVideo(element, stream, muted=false) {
    if (!element) return;
    element.srcObject = stream;
    element.muted = muted;
    void element.play().catch(() => undefined);
  }

  function renderOverlay(ctx) {
    let root = document.getElementById('call-overlay-v1');
    if (!root) {
      root = document.createElement('div');
      root.id = 'call-overlay-v1';
      document.body.appendChild(root);
    }
    const people = [...ctx.remoteStreams.keys()];
    root.innerHTML = `
      <div class="call-shell-v1">
        <header class="call-head-v1">
          <div><strong>Visio 2b2c</strong><small>${esc(projectName(ctx.projectId) || 'Appel d’équipe')} · ${1 + people.length} participant${people.length ? 's' : ''}</small></div>
          <button class="icon-button" data-call-ui="minimize" aria-label="Réduire">−</button>
        </header>
        <div class="call-grid-v1">
          <div class="call-tile-v1">
            <video id="call-local-video-v1" autoplay playsinline muted></video>
            <div class="call-fallback-v1">${initials(displayName(state.user.id))}</div>
            <span>Vous${ctx.screenTrack ? ' · écran partagé' : ''}</span>
          </div>
          ${people.map(userId => `<div class="call-tile-v1"><video id="call-remote-${escAttr(userId)}" autoplay playsinline></video><div class="call-fallback-v1">${initials(displayName(userId))}</div><span>${esc(displayName(userId))}</span></div>`).join('')}
          ${people.length ? '' : '<div class="call-wait-v1"><strong>En attente d’un participant</strong><small>La visio se connectera automatiquement dès qu’une autre personne la rejoint.</small></div>'}
        </div>
        <footer class="call-controls-v1">
          <button class="btn ${ctx.micEnabled ? '' : 'danger'}" data-call-ui="mic">${ctx.micEnabled ? '🎙 Micro' : '🔇 Micro coupé'}</button>
          <button class="btn ${ctx.cameraEnabled ? '' : 'danger'}" data-call-ui="camera" ${ctx.cameraTrack ? '' : 'disabled'}>${ctx.cameraEnabled ? '📹 Caméra' : '🚫 Caméra coupée'}</button>
          <button class="btn" data-call-ui="screen">${ctx.screenTrack ? '▣ Arrêter partage' : '▣ Partager écran'}</button>
          <button class="btn danger" data-call-ui="leave">☎ Quitter</button>
          ${ctx.call?.started_by === state.user.id ? '<button class="btn danger strong" data-call-ui="end">Terminer pour tous</button>' : ''}
        </footer>
        <div id="call-status-v1" class="call-status-v1">${esc(ctx.status || 'Connexion sécurisée WebRTC')}</div>
      </div>`;
    attachVideo(document.getElementById('call-local-video-v1'), ctx.localPreviewStream, true);
    for (const [userId, stream] of ctx.remoteStreams) attachVideo(document.getElementById(`call-remote-${userId}`), stream, false);
  }

  function minimizedDock(ctx) {
    let root = document.getElementById('call-overlay-v1');
    if (!root) { root = document.createElement('div'); root.id='call-overlay-v1'; document.body.appendChild(root); }
    root.innerHTML = `<button class="call-dock-v1" data-call-ui="restore"><strong>Visio en cours</strong><small>${esc(projectName(ctx.projectId) || 'Appel d’équipe')} · revenir à l’appel</small></button>`;
  }

  function setStatus(ctx, status, error=false) {
    ctx.status = status;
    const el = document.getElementById('call-status-v1');
    if (el) {
      el.textContent = status;
      el.classList.toggle('error', error);
    }
  }

  async function sendSignal(ctx, toUser, signalType, payload) {
    await api.rpc('send_call_signal_v1', {
      p_call_id: ctx.call.id,
      p_to_user: toUser,
      p_signal_type: signalType,
      p_payload: payload
    });
  }

  async function ensurePeer(ctx, remoteUserId) {
    if (ctx.peers.has(remoteUserId)) return ctx.peers.get(remoteUserId);
    const pc = new RTCPeerConnection({ iceServers: ctx.iceServers, bundlePolicy: 'max-bundle' });
    pc.__pendingIceV1 = [];
    ctx.peers.set(remoteUserId, pc);
    for (const track of ctx.localStream.getTracks()) pc.addTrack(track, ctx.localStream);
    pc.onicecandidate = event => {
      if (event.candidate) void sendSignal(ctx, remoteUserId, 'ice', event.candidate.toJSON()).catch(console.warn);
    };
    pc.ontrack = event => {
      const stream = event.streams?.[0] || new MediaStream([event.track]);
      ctx.remoteStreams.set(remoteUserId, stream);
      renderOverlay(ctx);
    };
    pc.onconnectionstatechange = () => {
      if (['failed','closed'].includes(pc.connectionState)) {
        ctx.remoteStreams.delete(remoteUserId);
        ctx.peers.delete(remoteUserId);
        try { pc.close(); } catch {}
        renderOverlay(ctx);
      }
    };
    return pc;
  }

  async function maybeOffer(ctx, remoteUserId) {
    if (String(state.user.id) >= String(remoteUserId)) return;
    const pc = await ensurePeer(ctx, remoteUserId);
    if (pc.signalingState !== 'stable' || ctx.offered.has(remoteUserId)) return;
    ctx.offered.add(remoteUserId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await sendSignal(ctx, remoteUserId, 'offer', { type: offer.type, sdp: offer.sdp });
  }

  async function processSignal(ctx, signal) {
    if (!signal || ctx.signalIds.has(String(signal.id))) return;
    ctx.signalIds.add(String(signal.id));
    if (signal.from_user === state.user.id) return;
    const pc = await ensurePeer(ctx, signal.from_user);
    if (signal.signal_type === 'offer') {
      await pc.setRemoteDescription(signal.payload);
      for (const candidate of pc.__pendingIceV1.splice(0)) { try { await pc.addIceCandidate(candidate); } catch {} }
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await sendSignal(ctx, signal.from_user, 'answer', { type: answer.type, sdp: answer.sdp });
    } else if (signal.signal_type === 'answer') {
      if (pc.signalingState === 'have-local-offer') {
        await pc.setRemoteDescription(signal.payload);
        for (const candidate of pc.__pendingIceV1.splice(0)) { try { await pc.addIceCandidate(candidate); } catch {} }
      }
    } else if (signal.signal_type === 'ice') {
      if (!pc.remoteDescription) pc.__pendingIceV1.push(signal.payload);
      else try { await pc.addIceCandidate(signal.payload); } catch (error) { console.warn('ICE candidate ignored', error); }
    }
  }

  async function poll(ctx) {
    if (ctx.closed) return;
    try {
      const participants = await api.select('call_participants', `select=*&call_session_id=eq.${ctx.call.id}&left_at=is.null&order=joined_at.asc`);
      const activeIds = new Set(participants.map(p => p.user_id));
      for (const p of participants) if (p.user_id !== state.user.id) await maybeOffer(ctx, p.user_id);
      for (const [userId, pc] of [...ctx.peers]) {
        if (!activeIds.has(userId)) {
          try { pc.close(); } catch {}
          ctx.peers.delete(userId); ctx.remoteStreams.delete(userId); ctx.offered.delete(userId);
        }
      }
      const signals = await api.select('call_signals', `select=*&call_session_id=eq.${ctx.call.id}&to_user=eq.${state.user.id}&order=id.asc&limit=200`);
      for (const signal of signals) await processSignal(ctx, signal);
      const calls = await api.select('call_sessions', `select=*&id=eq.${ctx.call.id}&limit=1`);
      if (!calls[0] || calls[0].ended_at) {
        await closeCall(ctx, false);
        showToast('L’appel a été terminé');
        return;
      }
      ctx.call = calls[0];
      renderOverlay(ctx);
    } catch (error) {
      setStatus(ctx, callError(error), true);
    }
    ctx.timer = setTimeout(() => void poll(ctx), 900);
  }

  async function setMediaState(ctx) {
    try {
      await api.rpc('set_call_media_state_v1', {
        p_call_id: ctx.call.id,
        p_mic: ctx.micEnabled,
        p_camera: ctx.cameraEnabled,
        p_screen: Boolean(ctx.screenTrack)
      });
    } catch (error) { console.warn('Media state sync failed', error); }
  }

  async function toggleScreen(ctx) {
    if (ctx.screenTrack) {
      const old = ctx.screenTrack;
      ctx.screenTrack = null;
      old.onended = null;
      old.stop();
      if (ctx.cameraTrack) {
        for (const pc of ctx.peers.values()) {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) await sender.replaceTrack(ctx.cameraTrack);
        }
      }
      ctx.localPreviewStream = ctx.localStream;
      await setMediaState(ctx); renderOverlay(ctx); return;
    }
    if (!navigator.mediaDevices?.getDisplayMedia) throw new Error('Le partage d’écran n’est pas disponible sur ce navigateur.');
    const screen = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
    const track = screen.getVideoTracks()[0];
    if (!track) throw new Error('Aucun écran n’a été fourni.');
    ctx.screenTrack = track;
    for (const pc of ctx.peers.values()) {
      const sender = pc.getSenders().find(s => s.track?.kind === 'video');
      if (sender) await sender.replaceTrack(track);
    }
    ctx.localPreviewStream = new MediaStream([track, ...ctx.localStream.getAudioTracks()]);
    track.onended = () => { if (ctx.screenTrack?.id === track.id) void toggleScreen(ctx).catch(console.warn); };
    await setMediaState(ctx); renderOverlay(ctx);
  }

  async function closeCall(ctx, notifyServer=true) {
    if (!ctx || ctx.closed) return;
    ctx.closed = true;
    clearTimeout(ctx.timer);
    for (const pc of ctx.peers.values()) try { pc.close(); } catch {}
    ctx.peers.clear();
    ctx.screenTrack?.stop();
    ctx.localStream?.getTracks().forEach(t => t.stop());
    if (notifyServer) {
      try { await api.rpc('leave_call_v1', { p_call_id: ctx.call.id }); } catch {}
    }
    document.getElementById('call-overlay-v1')?.remove();
    callUi = null;
  }

  async function endForAll(ctx) {
    await api.rpc('end_call_v1', { p_call_id: ctx.call.id, p_expected_version: ctx.call.version });
    await closeCall(ctx, false);
  }

  async function connectToCall(call, meetingId=null, projectId=null) {
    if (callUi) { renderOverlay(callUi); return; }
    const localStream = await localMedia();
    const cameraTrack = localStream.getVideoTracks()[0] || null;
    const micTrack = localStream.getAudioTracks()[0] || null;
    const servers = await iceServers();
    await api.rpc('join_call_v1', { p_call_id: call.id });
    const ctx = {
      call, meetingId, projectId, localStream, localPreviewStream: localStream,
      cameraTrack, micTrack, screenTrack:null, iceServers:servers,
      peers:new Map(), remoteStreams:new Map(), offered:new Set(), signalIds:new Set(),
      micEnabled:Boolean(micTrack?.enabled), cameraEnabled:Boolean(cameraTrack?.enabled),
      closed:false, timer:null, status:'Connexion sécurisée WebRTC'
    };
    callUi = ctx;
    await setMediaState(ctx);
    renderOverlay(ctx);
    void poll(ctx);
  }

  async function openCall(meetingId=null, projectId=null) {
    if (callUi) { renderOverlay(callUi); return; }
    let call;
    if (projectId) {
      call = await api.rpc('start_call_v1', {
        p_project_id: projectId,
        p_conversation_id: null,
        p_meeting_id: meetingId || null
      });
    } else {
      call = await api.rpc('start_workspace_call_v1', { p_workspace_id: state.workspace.id });
    }
    call = first(call);
    await connectToCall(call, meetingId, projectId);
  }

  async function startDirectCall(targetUserId, projectId=null) {
    if (callUi) { renderOverlay(callUi); return; }
    let call = await api.rpc('start_direct_call_v1', {
      p_workspace_id: state.workspace.id,
      p_target_user_id: targetUserId,
      p_project_id: projectId || null
    });
    call = first(call);
    await connectToCall(call, null, projectId || null);
    setStatus(callUi, `Appel de ${displayName(targetUserId)}…`);
  }

  async function declineIncoming(callId) {
    await api.rpc('decline_direct_call_v1', { p_call_id: callId });
    document.getElementById('incoming-call-v1')?.remove();
  }

  function showIncoming(call) {
    if (callUi || document.getElementById('incoming-call-v1')) return;
    const caller = displayName(call.started_by);
    const context = projectName(call.project_id) || 'Sans projet';
    const root = document.createElement('div');
    root.id = 'incoming-call-v1';
    root.innerHTML = `<div class="incoming-call-card-v1">
      <div class="incoming-pulse-v1">▣</div>
      <div class="incoming-copy-v1"><span>Appel entrant</span><strong>${esc(caller)}</strong><small>${esc(context)}</small></div>
      <div class="incoming-actions-v1">
        <button class="btn danger" data-call-incoming="decline" data-call-id="${escAttr(call.id)}">Refuser</button>
        <button class="btn primary" data-call-incoming="accept" data-call-id="${escAttr(call.id)}">Accepter</button>
      </div>
    </div>`;
    document.body.appendChild(root);
  }

  async function pollIncomingCalls() {
    if (!state?.user || !state?.workspace || callUi) return;
    try {
      const since = new Date(Date.now()-90000).toISOString();
      const rows = await api.select('call_sessions', `select=*&workspace_id=eq.${state.workspace.id}&direct_user_id=eq.${state.user.id}&ended_at=is.null&started_at=gte.${encodeURIComponent(since)}&order=started_at.desc&limit=1`);
      if (rows[0]) showIncoming(rows[0]);
      else document.getElementById('incoming-call-v1')?.remove();
    } catch (error) {
      console.warn('Incoming call polling unavailable', error);
    }
  }

  async function joinExistingCall(callId) {
    const rows = await api.select('call_sessions', `select=*&id=eq.${callId}&ended_at=is.null&limit=1`);
    const call = rows[0];
    if (!call) throw new Error('Cet appel n’est plus disponible.');
    await connectToCall(call, call.meeting_id || null, call.project_id || null);
  }

  async function openGlobalCallPanel() {
    const active = await api.select('call_sessions', `select=*&workspace_id=eq.${state.workspace.id}&ended_at=is.null&direct_user_id=is.null&order=started_at.desc&limit=10`);
    const teammates = state.members.filter(m => m.user_id !== state.user.id && m.status !== 'suspended');
    let root = document.getElementById('call-picker-v1');
    if (!root) { root=document.createElement('div'); root.id='call-picker-v1'; document.body.appendChild(root); }
    root.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal call-picker-card-v1" role="dialog" aria-modal="true">
          <div class="card-head">
            <div><span class="eyebrow">Communication</span><h2>Appeler</h2><p>Commencez une visio maintenant. Le projet est facultatif.</p></div>
            <button class="icon-button" data-call-picker="close" aria-label="Fermer">✕</button>
          </div>
          ${active.length ? `<div class="call-picker-section-v1"><strong>Appels en cours</strong><div class="stack">${active.map(call => `<button class="list-row clickable call-existing-v1" data-call-existing="${escAttr(call.id)}"><div class="list-main"><strong>${esc(projectName(call.project_id) || 'Appel d’équipe')}</strong><small>En cours · rejoindre maintenant</small></div><span class="pill good">Rejoindre</span></button>`).join('')}</div></div>` : ''}
          <div class="call-picker-section-v1">
            <strong>Appeler une personne</strong>
            <div class="call-people-v1">
              ${teammates.length ? teammates.map(m => `<button class="call-person-v1" data-call-user="${escAttr(m.user_id)}"><span class="avatar">${initials(displayName(m.user_id))}</span><span><strong>${esc(displayName(m.user_id))}</strong><small>${workspaceRoleLabel(m.role)}</small></span><b>Appeler</b></button>`).join('') : '<div class="notice">Aucun autre membre actif dans cet espace.</div>'}
            </div>
            <label class="field" style="margin-top:14px"><span>Contexte facultatif</span>
              <select id="call-project-v1">
                <option value="">Sans projet</option>
                ${state.projects.filter(p=>p.status==='active').map(p=>`<option value="${escAttr(p.id)}">${esc(p.name)}</option>`).join('')}
              </select>
            </label>
          </div>
          <div class="call-picker-section-v1 call-team-option-v1">
            <div><strong>Appel d’équipe</strong><small>Ouvre une salle que les membres de l’espace peuvent rejoindre.</small></div>
            <button class="btn" data-call-picker="start-team">▣ Ouvrir</button>
          </div>
          <div class="modal-actions"><button class="btn" data-call-picker="close">Fermer</button></div>
        </div>
      </div>`;
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-call-meeting],[data-call-ui],[data-call-global],[data-call-picker],[data-call-existing],[data-call-user],[data-call-incoming]');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    void (async () => {
      try {
        if (button.dataset.callGlobal) return await openGlobalCallPanel();
        if (button.dataset.callIncoming === 'accept') { const id=button.dataset.callId; document.getElementById('incoming-call-v1')?.remove(); return await joinExistingCall(id); }
        if (button.dataset.callIncoming === 'decline') return await declineIncoming(button.dataset.callId);
        if (button.dataset.callUser) { const projectId=document.getElementById('call-project-v1')?.value||null; document.getElementById('call-picker-v1')?.remove(); return await startDirectCall(button.dataset.callUser, projectId); }
        if (button.dataset.callExisting) { document.getElementById('call-picker-v1')?.remove(); return await joinExistingCall(button.dataset.callExisting); }
        if (button.dataset.callPicker === 'close') { document.getElementById('call-picker-v1')?.remove(); return; }
        if (button.dataset.callPicker === 'start-team') { document.getElementById('call-picker-v1')?.remove(); return await openCall(null,null); }
        if (button.dataset.callMeeting) return await openCall(button.dataset.callMeeting, button.dataset.callProject);
        const ctx = callUi;
        if (!ctx) return;
        const action = button.dataset.callUi;
        if (action === 'minimize') return minimizedDock(ctx);
        if (action === 'restore') return renderOverlay(ctx);
        if (action === 'mic') {
          if (ctx.micTrack) { ctx.micTrack.enabled = !ctx.micTrack.enabled; ctx.micEnabled=ctx.micTrack.enabled; await setMediaState(ctx); renderOverlay(ctx); }
        } else if (action === 'camera') {
          if (ctx.cameraTrack) { ctx.cameraTrack.enabled = !ctx.cameraTrack.enabled; ctx.cameraEnabled=ctx.cameraTrack.enabled; await setMediaState(ctx); renderOverlay(ctx); }
        } else if (action === 'screen') await toggleScreen(ctx);
        else if (action === 'leave') await closeCall(ctx, true);
        else if (action === 'end') await endForAll(ctx);
      } catch (error) {
        if (callUi) setStatus(callUi, callError(error), true);
        else showToast(callError(error), true);
      }
    })();
  }, true);

  setInterval(() => void pollIncomingCalls(), 1800);
  setTimeout(() => void pollIncomingCalls(), 900);

  window.addEventListener('beforeunload', () => {
    const ctx = callUi;
    if (!ctx) return;
    ctx.localStream?.getTracks().forEach(t => t.stop());
    ctx.screenTrack?.stop();
  });
})();

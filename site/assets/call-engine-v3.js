import { SupabaseBrowserClient } from './supabase-client.js';

if (!window.__4B4C_CALL_ENGINE_V3__) {
  const config = window.__4B4C_CONFIG__ || {};
  const api = new SupabaseBrowserClient({ url: config.supabaseUrl, publishableKey: config.supabasePublishableKey });
  const workspaceKey = config.workspaceStorageKey || '4b4c.live.workspace.v1';
  const MAX_PARTICIPANTS = 6;
  const SYNC_MS = 900;
  const HEARTBEAT_MS = 8000;
  const STATS_MS = 3000;
  const STUN = [{ urls: 'stun:stun.cloudflare.com:3478' }];

  let currentUser = null;
  let roster = new Map();
  let picker = null;
  let prejoin = null;
  let active = null;
  let resumeCall = null;
  let idleTimer = null;
  let busy = false;

  const one = (value) => Array.isArray(value) ? (value[0] ?? null) : value;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[char]));
  const escAttr = esc;
  const uid = () => currentUser?.id || api.getSession()?.user?.id || '';
  const workspaceId = () => localStorage.getItem(workspaceKey) || '';
  const locatorKey = (sessionId, trackName) => `${sessionId}\n${trackName}`;

  function root(id) {
    let node = document.getElementById(id);
    if (!node) { node = document.createElement('div'); node.id = id; document.body.appendChild(node); }
    return node;
  }
  function removeNode(id) { document.getElementById(id)?.remove(); }
  function displayName(userId) { return roster.get(userId)?.display_name || (userId === uid() ? 'Vous' : 'Membre'); }
  function initials(userId) { return displayName(userId).split(/\s+/).slice(0,2).map((part) => part[0] || '').join('').toUpperCase() || '?'; }
  function titleFor(call) { return call?.project_id ? 'Visio projet' : 'Visio 2b2c'; }

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
    const profileMap = new Map((profiles || []).map((p) => [p.id,p]));
    roster = new Map((members || []).map((m) => [m.user_id,{...m,...(profileMap.get(m.user_id) || {})}]));
    return (members || []).filter((m) => m.user_id !== user.id && m.role !== 'guest');
  }

  async function workerApi(path, method = 'POST', body = null) {
    const session = api.getSession();
    if (!session?.access_token) throw new Error('Session utilisateur expirée.');
    const response = await fetch(path, {
      method,
      headers: {
        authorization: `Bearer ${session.access_token}`,
        'content-type': 'application/json',
      },
      body: body === null ? undefined : JSON.stringify(body),
    });
    let payload = null;
    try { payload = await response.json(); } catch { payload = null; }
    if (!response.ok || payload?.ok === false) {
      const error = new Error(payload?.error || `Visio SFU indisponible (${response.status})`);
      error.code = payload?.error || `HTTP_${response.status}`;
      error.details = payload;
      throw error;
    }
    return payload || {};
  }

  async function acquireLocalMedia({ cameraDeviceId = '', micDeviceId = '', facingMode = 'user' } = {}) {
    const audio = micDeviceId ? { deviceId:{ exact:micDeviceId }, echoCancellation:true, noiseSuppression:true, autoGainControl:true } : { echoCancellation:true, noiseSuppression:true, autoGainControl:true };
    const video = cameraDeviceId ? { deviceId:{ exact:cameraDeviceId }, width:{ ideal:1280 }, height:{ ideal:720 } } : { facingMode:{ ideal:facingMode }, width:{ ideal:1280 }, height:{ ideal:720 } };
    try { return await navigator.mediaDevices.getUserMedia({ audio, video }); }
    catch (firstError) {
      console.warn('[2b2c call v3] camera+mic unavailable', firstError);
      try { return await navigator.mediaDevices.getUserMedia({ audio, video:false }); }
      catch (secondError) { console.warn('[2b2c call v3] audio unavailable', secondError); return new MediaStream(); }
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
    } catch { return { cameras:[],mics:[],speakers:[] }; }
  }

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

  async function openPicker({ mode='start', presetIds=[], projectId=null, meetingId=null, title='Nouvelle visio' } = {}) {
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
      for (const invite of active.invites || []) if (!['declined','cancelled'].includes(invite.status)) unavailable.add(invite.invited_user_id);
    }
    const options = members.filter((member) => !unavailable.has(member.user_id));
    const occupied = active ? new Set([user.id,...active.participants.map((p)=>p.user_id),...active.invites.filter((i)=>!['declined','cancelled'].includes(i.status)).map((i)=>i.invited_user_id)]).size : 1;
    const capacity = mode === 'add' ? Math.max(0,MAX_PARTICIPANTS-occupied) : MAX_PARTICIPANTS-1;
    const allowed = new Set(options.map((m)=>m.user_id));
    const selected = new Set(suggested.filter((id)=>allowed.has(id)).slice(0,capacity));
    picker = { mode,selected,options,capacity,projectId,meetingId,title };
    renderPicker();
  }

  function renderPicker() {
    if (!picker) { removeNode('call-engine-v3-picker'); return; }
    const node = root('call-engine-v3-picker');
    node.innerHTML = `<div class="ce3-backdrop"><section class="ce3-dialog" role="dialog" aria-modal="true"><header><div><h2>${esc(picker.mode==='add'?'Ajouter des participants':picker.title)}</h2><p>${picker.mode==='add'?'Invitez des membres dans la visio en cours.':'Choisissez jusqu’à 5 personnes. Vous pourrez en ajouter ensuite.'}</p></div><button class="ce3-icon" data-ce3-action="picker-close" aria-label="Fermer">×</button></header><div class="ce3-people">${picker.options.length ? picker.options.map((member)=>{ const selected=picker.selected.has(member.user_id); return `<button type="button" class="ce3-person ${selected?'selected':''}" data-ce3-action="picker-toggle" data-user="${escAttr(member.user_id)}" aria-pressed="${selected}"><span class="ce3-avatar">${esc(initials(member.user_id))}</span><span><strong>${esc(displayName(member.user_id))}</strong><small>${member.role==='owner'?'Propriétaire':member.role==='admin'?'Administrateur':'Membre'}</small></span><i class="ce3-check">${selected?'✓':'+'}</i></button>`; }).join('') : '<div style="padding:24px;text-align:center;color:#68758a">Aucun membre disponible.</div>'}</div><footer><span>${picker.selected.size}/${picker.capacity}</span><div><button class="ce3-btn" data-ce3-action="picker-close">Annuler</button> <button class="ce3-btn primary" data-ce3-action="picker-confirm" ${picker.selected.size?'':'disabled'}>${picker.mode==='add'?'Inviter':'Continuer'}</button></div></footer></section></div>`;
  }

  async function confirmPicker() {
    if (!picker?.selected.size) return;
    const data = picker;
    picker = null; renderPicker();
    if (data.mode === 'add') {
      await api.rpc('invite_to_call_v1', { p_call_id:active.call.id, p_target_user_ids:[...data.selected] });
      active.statusMessage = `${data.selected.size} invitation${data.selected.size>1?'s':''} envoyée${data.selected.size>1?'s':''}`;
      await syncCall(active,true); return;
    }
    const stream = await acquireLocalMedia({ facingMode:'user' });
    const devices = await enumerateMediaDevices();
    const cameraTrack = stream.getVideoTracks()[0] || null;
    const micTrack = stream.getAudioTracks()[0] || null;
    prejoin = { targetIds:[...data.selected], projectId:data.projectId, meetingId:data.meetingId, stream, cameraTrack, micTrack, devices, cameraDeviceId:cameraTrack?.getSettings?.().deviceId||'', micDeviceId:micTrack?.getSettings?.().deviceId||'', facingMode:cameraTrack?.getSettings?.().facingMode||'user', speakerDeviceId:'' };
    renderPrejoin();
  }

  function mediaSelect(kind, devices, selected) {
    if (!devices.length) return '';
    const label = kind==='camera'?'Caméra':kind==='mic'?'Micro':'Haut-parleur';
    return `<label><span>${label}</span><select data-ce3-device="${kind}">${devices.map((device,index)=>`<option value="${escAttr(device.deviceId)}" ${device.deviceId===selected?'selected':''}>${esc(device.label||`${label} ${index+1}`)}</option>`).join('')}</select></label>`;
  }

  function renderPrejoin() {
    if (!prejoin) { removeNode('call-engine-v3-prejoin'); return; }
    const node = root('call-engine-v3-prejoin');
    node.innerHTML = `<div class="ce3-backdrop"><section class="ce3-dialog" role="dialog" aria-modal="true"><header><div><h2>Vérifiez votre caméra et votre micro</h2><p>${prejoin.targetIds.length} participant${prejoin.targetIds.length>1?'s':''} à appeler.</p></div><button class="ce3-icon" data-ce3-action="prejoin-cancel">×</button></header><div class="ce3-preview ${prejoin.cameraTrack?.enabled?'':'camera-off'}"><video id="ce3-prejoin-video" autoplay playsinline muted></video><span class="ce3-avatar">${esc(initials(uid()))}</span></div><div class="ce3-prejoin-controls"><button class="ce3-round ${prejoin.micTrack?.enabled?'':'off'}" data-ce3-action="prejoin-mic">🎙 ${prejoin.micTrack?.enabled?'Micro actif':'Micro coupé'}</button><button class="ce3-round ${prejoin.cameraTrack?.enabled?'':'off'}" data-ce3-action="prejoin-camera" ${prejoin.cameraTrack?'':'disabled'}>▣ ${prejoin.cameraTrack?.enabled?'Caméra active':'Caméra coupée'}</button>${prejoin.devices.cameras.length>1?'<button class="ce3-round" data-ce3-action="prejoin-switch">↻ Changer caméra</button>':''}</div><div class="ce3-device-grid">${mediaSelect('camera',prejoin.devices.cameras,prejoin.cameraDeviceId)}${mediaSelect('mic',prejoin.devices.mics,prejoin.micDeviceId)}${typeof HTMLMediaElement!=='undefined'&&'setSinkId' in HTMLMediaElement.prototype?mediaSelect('speaker',prejoin.devices.speakers,prejoin.speakerDeviceId):''}</div><footer><button class="ce3-btn" data-ce3-action="prejoin-cancel">Annuler</button><button class="ce3-btn primary" data-ce3-action="prejoin-start">Appeler</button></footer></section></div>`;
    const video = document.getElementById('ce3-prejoin-video');
    if (video && video.srcObject !== prejoin.stream) { video.srcObject = prejoin.stream; void video.play().catch(()=>{}); }
  }

  async function replacePrejoinTrack(kind, deviceId='') {
    if (!prejoin) return;
    if (kind === 'speaker') { prejoin.speakerDeviceId=deviceId; renderPrejoin(); return; }
    const old = kind==='camera'?prejoin.cameraTrack:prejoin.micTrack;
    const enabled = old?.enabled !== false;
    const constraints = kind==='camera' ? { video:{ deviceId:{exact:deviceId},width:{ideal:1280},height:{ideal:720} },audio:false } : { audio:{ deviceId:{exact:deviceId},echoCancellation:true,noiseSuppression:true,autoGainControl:true },video:false };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    const next = kind==='camera'?stream.getVideoTracks()[0]:stream.getAudioTracks()[0];
    if (!next) return; next.enabled=enabled;
    if (old) { prejoin.stream.removeTrack(old); old.stop(); }
    prejoin.stream.addTrack(next);
    if (kind==='camera') { prejoin.cameraTrack=next; prejoin.cameraDeviceId=next.getSettings?.().deviceId||deviceId; prejoin.facingMode=next.getSettings?.().facingMode||prejoin.facingMode; }
    else { prejoin.micTrack=next; prejoin.micDeviceId=next.getSettings?.().deviceId||deviceId; }
    prejoin.devices=await enumerateMediaDevices(); renderPrejoin();
  }

  async function switchPrejoinCamera() {
    if (!prejoin?.cameraTrack) return;
    const nextFacing=prejoin.facingMode==='environment'?'user':'environment';
    const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:nextFacing},width:{ideal:1280},height:{ideal:720}},audio:false});
    const next=stream.getVideoTracks()[0]; if(!next)return;
    next.enabled=prejoin.cameraTrack.enabled; prejoin.stream.removeTrack(prejoin.cameraTrack); prejoin.cameraTrack.stop(); prejoin.stream.addTrack(next); prejoin.cameraTrack=next; prejoin.facingMode=next.getSettings?.().facingMode||nextFacing; prejoin.cameraDeviceId=next.getSettings?.().deviceId||''; prejoin.devices=await enumerateMediaDevices(); renderPrejoin();
  }

  function cancelPrejoin(){ prejoin?.stream?.getTracks().forEach((track)=>track.stop()); prejoin=null; renderPrejoin(); }

  async function startPreparedCall() {
    if (!prejoin || busy) return;
    busy=true;
    try {
      const prepared=prejoin; prejoin=null; renderPrejoin();
      let call;
      if (prepared.meetingId && prepared.projectId) {
        call=one(await api.rpc('start_call_v1',{p_project_id:prepared.projectId,p_conversation_id:null,p_meeting_id:prepared.meetingId}));
        if(prepared.targetIds.length) await api.rpc('invite_to_call_v1',{p_call_id:call.id,p_target_user_ids:prepared.targetIds});
      } else {
        call=one(await api.rpc('start_private_call_v2',{p_workspace_id:workspaceId(),p_target_user_ids:prepared.targetIds,p_project_id:prepared.projectId||null}));
      }
      await connectCall(call,prepared.stream,{speakerDeviceId:prepared.speakerDeviceId});
    } catch(error){ showError('Impossible de démarrer la visio V3',error); }
    finally{busy=false;}
  }

  async function acceptIncoming(callId) {
    if(!callId||active||busy)return; busy=true;
    try{
      const call=one(await api.rpc('respond_call_invite_v1',{p_call_id:callId,p_accept:true}));
      removeNode('incoming-call-v2'); removeNode('incoming-call-v1');
      const stream=await acquireLocalMedia({facingMode:'user'});
      await connectCall(call,stream,{});
    }catch(error){showError('Impossible de rejoindre la visio V3',error);}finally{busy=false;}
  }
  async function declineIncoming(callId){ if(!callId)return; try{await api.rpc('respond_call_invite_v1',{p_call_id:callId,p_accept:false});}catch{} removeNode('incoming-call-v2');removeNode('incoming-call-v1'); }

  function createPeer(ctx) {
    const pc=new RTCPeerConnection({iceServers:STUN,bundlePolicy:'max-bundle'});
    ctx.pc=pc;
    pc.ontrack=(event)=>handleRemoteTrack(ctx,event);
    pc.onconnectionstatechange=()=>{ void updateHealth(ctx); };
    pc.oniceconnectionstatechange=()=>{ void updateHealth(ctx); };
    return pc;
  }

  async function connectCall(call, stream, {speakerDeviceId=''}={}) {
    const user=await getUser(); if(!user?.id||!call?.id)throw new Error('Session d’appel invalide.');
    await api.rpc('join_call_v1',{p_call_id:call.id});
    await loadRoster(call.workspace_id||workspaceId());
    const cameraTrack=stream.getVideoTracks()[0]||null;
    const micTrack=stream.getAudioTracks()[0]||null;
    const ctx={ call,localStream:stream,cameraTrack,micTrack,screenTrack:null,cameraTx:null,micTx:null,screenTx:null,providerSessionId:'',published:new Map(),subscriptions:new Map(),pendingMid:new Map(),remoteMedia:new Map(),audioEls:new Map(),tiles:new Map(),participants:[],invites:[],catalog:[],speakerDeviceId,facingMode:cameraTrack?.getSettings?.().facingMode||'user',syncTimer:null,heartbeatTimer:null,statsTimer:null,negotiation:Promise.resolve(),health:'connecting',healthDetail:'Connexion au relais média…',connectedAt:0,lastInboundBytes:0,lastMediaProgressAt:0,lastTelemetryState:'',statusMessage:'',minimized:false,endConfirmUntil:0,stopped:false };
    active=ctx; document.documentElement.classList.add('call-engine-v3-active'); mountActiveShell(ctx); createPeer(ctx);
    try {
      const created=await workerApi('/api/call-v3/session','POST',{callId:call.id});
      if(!created.sessionId)throw new Error('Cloudflare Realtime n’a pas créé de session.');
      ctx.providerSessionId=created.sessionId;
      await api.rpc('register_call_provider_session_v3',{p_call_id:call.id,p_provider_session_id:ctx.providerSessionId});
      await api.rpc('end_all_call_media_tracks_v3',{p_call_id:call.id});
      await publishInitialTracks(ctx);
      await syncMediaState(ctx);
      await syncCall(ctx,true);
      ctx.heartbeatTimer=setInterval(()=>void heartbeat(ctx),HEARTBEAT_MS);
      ctx.statsTimer=setInterval(()=>void updateHealth(ctx),STATS_MS);
      void heartbeat(ctx); void updateHealth(ctx);
    } catch(error) {
      cleanupCall(ctx,{stopTracks:true}); active=null; renderActiveVisibility(); throw error;
    }
  }

  function enqueue(ctx, job) {
    ctx.negotiation=ctx.negotiation.then(()=>job()).catch((error)=>{ console.error('[2b2c call v3] negotiation failed',error); void recordTelemetry(ctx,'error',null,{code:error?.code||error?.message||'NEGOTIATION_FAILED'}); throw error; });
    return ctx.negotiation;
  }

  async function publishInitialTracks(ctx) {
    const entries=[];
    if(ctx.micTrack){ ctx.micTx=ctx.pc.addTransceiver(ctx.micTrack,{direction:'sendonly'}); entries.push({role:'audio',tx:ctx.micTx,track:ctx.micTrack}); }
    if(ctx.cameraTrack){ ctx.cameraTx=ctx.pc.addTransceiver(ctx.cameraTrack,{direction:'sendonly'}); entries.push({role:'camera',tx:ctx.cameraTx,track:ctx.cameraTrack}); }
    if(!entries.length)return;
    await publishEntries(ctx,entries);
  }

  async function publishEntries(ctx, entries) {
    return enqueue(ctx,async()=>{
      const offer=await ctx.pc.createOffer(); await ctx.pc.setLocalDescription(offer);
      const requestTracks=entries.map(({role,tx,track})=>({role,mid:String(tx.mid),trackName:`${uid()}-${role}-${track.id}`}));
      const result=await workerApi('/api/call-v3/tracks/publish','POST',{callId:ctx.call.id,providerSessionId:ctx.providerSessionId,sessionDescription:{type:'offer',sdp:ctx.pc.localDescription.sdp},tracks:requestTracks.map(({mid,trackName})=>({mid,trackName}))});
      if(result.sessionDescription) await ctx.pc.setRemoteDescription(result.sessionDescription);
      const responseTracks=Array.isArray(result.tracks)?result.tracks:[];
      for(const request of requestTracks){
        const response=responseTracks.find((row)=>row.trackName===request.trackName)||{};
        const providerTrackId=response.trackName||request.trackName;
        const mid=String(response.mid??request.mid);
        ctx.published.set(request.role,{role:request.role,providerTrackId,mid,tx:entries.find((e)=>e.role===request.role)?.tx||null});
        await api.rpc('upsert_call_media_track_v3',{p_call_id:ctx.call.id,p_provider_session_id:ctx.providerSessionId,p_provider_track_id:providerTrackId,p_role:request.role,p_mid:mid});
      }
    });
  }

  async function heartbeat(ctx){ if(!ctx||ctx.stopped||active!==ctx)return; try{await api.rpc('heartbeat_call_v1',{p_call_id:ctx.call.id});}catch(error){console.warn('[2b2c call v3] heartbeat',error);} }
  async function syncMediaState(ctx){ if(!ctx||ctx.stopped)return; try{await api.rpc('set_call_media_state_v1',{p_call_id:ctx.call.id,p_mic:Boolean(ctx.micTrack?.enabled),p_camera:Boolean(ctx.cameraTrack?.enabled),p_screen:Boolean(ctx.screenTrack)});}catch(error){console.warn('[2b2c call v3] media state',error);} }

  async function syncCall(ctx, immediate=false) {
    if(!ctx||ctx.stopped||active!==ctx||ctx.syncing)return;
    if(ctx.syncTimer){clearTimeout(ctx.syncTimer);ctx.syncTimer=null;} ctx.syncing=true;
    try{
      const [snapshotRaw,catalogRaw]=await Promise.all([
        api.rpc('get_call_sync_v2',{p_call_id:ctx.call.id,p_after_signal_id:0}),
        api.rpc('get_call_media_catalog_v3',{p_call_id:ctx.call.id}),
      ]);
      const snapshot=one(snapshotRaw); const catalog=one(catalogRaw) || catalogRaw || [];
      if(!snapshot?.call||snapshot.call.ended_at||snapshot.call.status==='ended'){cleanupCall(ctx,{stopTracks:true});active=null;renderActiveVisibility();return;}
      ctx.call=snapshot.call; ctx.participants=Array.isArray(snapshot.participants)?snapshot.participants:[]; ctx.invites=Array.isArray(snapshot.invites)?snapshot.invites:[]; ctx.catalog=Array.isArray(catalog)?catalog:[];
      await subscribeMissing(ctx);
      pruneRemoteMedia(ctx);
      updateActiveUi(ctx);
    }catch(error){ctx.health='reconnecting';ctx.healthDetail=error?.message||'Synchronisation indisponible';updateActiveUi(ctx);}
    finally{ctx.syncing=false;if(!ctx.stopped&&active===ctx)ctx.syncTimer=setTimeout(()=>void syncCall(ctx),immediate?150:SYNC_MS);}
  }

  async function subscribeMissing(ctx) {
    const wanted=ctx.catalog.filter((row)=>row.user_id!==uid()&&row.state==='live');
    const missing=wanted.filter((row)=>!ctx.subscriptions.has(locatorKey(row.provider_session_id,row.provider_track_id)));
    if(!missing.length)return;
    await enqueue(ctx,async()=>{
      const stillMissing=missing.filter((row)=>!ctx.subscriptions.has(locatorKey(row.provider_session_id,row.provider_track_id)));
      if(!stillMissing.length)return;
      const result=await workerApi('/api/call-v3/tracks/subscribe','POST',{callId:ctx.call.id,providerSessionId:ctx.providerSessionId,tracks:stillMissing.map((row)=>({sessionId:row.provider_session_id,trackName:row.provider_track_id}))});
      const returned=Array.isArray(result.tracks)?result.tracks:[];
      for(const row of returned){
        const source=stillMissing.find((candidate)=>candidate.provider_track_id===row.trackName&&(row.sessionId?candidate.provider_session_id===row.sessionId:true));
        if(!source)continue;
        const mid=String(row.mid??'');
        if(mid)ctx.pendingMid.set(mid,{userId:source.user_id,role:source.role,key:locatorKey(source.provider_session_id,source.provider_track_id),providerSessionId:source.provider_session_id,providerTrackId:source.provider_track_id});
        ctx.subscriptions.set(locatorKey(source.provider_session_id,source.provider_track_id),{userId:source.user_id,role:source.role,mid,providerSessionId:source.provider_session_id,providerTrackId:source.provider_track_id});
      }
      if(result.requiresImmediateRenegotiation&&result.sessionDescription){
        await ctx.pc.setRemoteDescription(result.sessionDescription);
        const answer=await ctx.pc.createAnswer(); await ctx.pc.setLocalDescription(answer);
        await workerApi('/api/call-v3/renegotiate','PUT',{callId:ctx.call.id,providerSessionId:ctx.providerSessionId,sessionDescription:{type:'answer',sdp:ctx.pc.localDescription.sdp}});
      }
    });
  }

  function handleRemoteTrack(ctx,event){
    const mid=String(event.transceiver?.mid??''); const meta=ctx.pendingMid.get(mid);
    if(!meta){ console.warn('[2b2c call v3] unmapped remote mid',mid,event.track?.kind); return; }
    const stream=new MediaStream([event.track]);
    ctx.remoteMedia.set(`${meta.userId}:${meta.role}`,{...meta,track:event.track,stream});
    event.track.onended=()=>{ctx.remoteMedia.delete(`${meta.userId}:${meta.role}`);updateActiveUi(ctx);};
    event.track.onunmute=()=>updateActiveUi(ctx); event.track.onmute=()=>updateActiveUi(ctx);
    void recordTelemetry(ctx,'track_live',meta.role,{userId:meta.userId,mid});
    updateActiveUi(ctx);
  }

  function pruneRemoteMedia(ctx){
    const allowed=new Set(ctx.catalog.filter((row)=>row.user_id!==uid()&&row.state==='live').map((row)=>`${row.user_id}:${row.role}`));
    for(const [key,media] of [...ctx.remoteMedia]) if(!allowed.has(key)){media.track?.stop?.();ctx.remoteMedia.delete(key);}
  }

  function mountActiveShell(ctx){
    const node=root('call-engine-v3-active');
    node.innerHTML=`<section class="ce3-shell" role="dialog" aria-label="Visio V3 en cours"><header class="ce3-head"><div class="ce3-head-left"><span class="ce3-live">En direct</span><strong data-ce3-title>${esc(titleFor(ctx.call))}</strong><small><span data-ce3-count>1 participant</span> · <span data-ce3-duration>00:00</span></small></div><div class="ce3-head-actions"><span class="ce3-health" data-ce3-health title="Connexion média">Connexion…</span><button data-ce3-action="minimize">—</button><button data-ce3-action="fullscreen">⛶</button><button class="danger-soft" data-ce3-action="end" data-ce3-end hidden>Terminer pour tous</button></div></header><div class="ce3-status" data-ce3-status hidden></div><div class="ce3-stage"><div class="ce3-main" data-ce3-main></div><div class="ce3-grid" data-ce3-grid></div><div class="ce3-filmstrip" data-ce3-filmstrip></div><div class="ce3-share-local" data-ce3-local-share><strong>Vous partagez votre écran</strong><video data-ce3-local-screen autoplay playsinline muted></video><button class="ce3-btn" data-ce3-action="screen">Arrêter le partage</button></div><div class="ce3-pending" data-ce3-pending></div></div><footer class="ce3-controls"><button data-ce3-action="mic">🎙<small>Micro</small></button><button data-ce3-action="camera">▣<small>Caméra</small></button><button data-ce3-action="switch-camera">↻<small>Changer</small></button><button data-ce3-action="screen">▤<small>Partager</small></button><button data-ce3-action="devices">⚙<small>Périphériques</small></button><button data-ce3-action="add">＋<small>Participants</small></button><button class="danger" data-ce3-action="leave">☎<small>Quitter</small></button></footer></section>`;
    updateActiveUi(ctx);
  }

  function tileKey(userId,role){return `${userId}:${role}`;}
  function ensureTile(ctx,userId,role,{local=false}={}){
    const key=tileKey(userId,role); let tile=ctx.tiles.get(key); if(tile)return tile;
    const node=document.createElement('div'); node.className=`ce3-tile ${role==='screen'?'screen':''} ${local?'self':''}`; node.dataset.ce3Tile=key;
    const avatar=document.createElement('span');avatar.className='ce3-avatar';avatar.textContent=initials(userId);
    const video=document.createElement('video');video.autoplay=true;video.playsInline=true;video.muted=true;
    const label=document.createElement('span');label.className='ce3-label';label.textContent=role==='screen'?`Écran de ${displayName(userId)}`:(local?'Vous':displayName(userId));
    node.append(avatar,video,label); tile={key,node,video,avatar,label,stream:null};ctx.tiles.set(key,tile);return tile;
  }
  function assignStream(tile,stream,visible=true){
    if(tile.stream!==stream){tile.stream=stream;tile.video.srcObject=stream||null;if(stream)void tile.video.play().catch(()=>{});}
    tile.node.classList.toggle('has-video',Boolean(stream&&visible&&stream.getVideoTracks().some((t)=>t.readyState==='live'&&!t.muted)));
    tile.video.hidden=!visible;
  }
  function localCameraStream(ctx){ if(!ctx.localCameraStream)ctx.localCameraStream=new MediaStream(); const current=ctx.localCameraStream.getVideoTracks()[0]||null; if(current!==ctx.cameraTrack){if(current)ctx.localCameraStream.removeTrack(current);if(ctx.cameraTrack)ctx.localCameraStream.addTrack(ctx.cameraTrack);} return ctx.localCameraStream; }

  function updateActiveUi(ctx){
    if(!ctx||ctx.stopped||active!==ctx)return; const rootNode=document.getElementById('call-engine-v3-active');if(!rootNode)return;
    if(ctx.minimized){renderDock(ctx);return;} if(rootNode.querySelector('.ce3-dock'))mountActiveShell(ctx);
    const count=Math.max(1,ctx.participants.length||1); const duration=Math.max(0,Math.floor((Date.now()-new Date(ctx.call.started_at||Date.now()).getTime())/1000));
    const durationNode=rootNode.querySelector('[data-ce3-duration]');if(durationNode)durationNode.textContent=`${String(Math.floor(duration/60)).padStart(2,'0')}:${String(duration%60).padStart(2,'0')}`;
    const countNode=rootNode.querySelector('[data-ce3-count]');if(countNode)countNode.textContent=`${count} participant${count>1?'s':''}`;
    const healthNode=rootNode.querySelector('[data-ce3-health]');if(healthNode){healthNode.textContent=healthLabel(ctx.health);healthNode.className=`ce3-health ${ctx.health}`;healthNode.title=ctx.healthDetail||'';}
    const statusNode=rootNode.querySelector('[data-ce3-status]');if(statusNode){statusNode.hidden=!ctx.statusMessage;statusNode.textContent=ctx.statusMessage||'';}
    const endNode=rootNode.querySelector('[data-ce3-end]');if(endNode){endNode.hidden=ctx.call.started_by!==uid();endNode.textContent=ctx.endConfirmUntil>Date.now()?'Confirmer':'Terminer pour tous';}
    const micBtn=rootNode.querySelector('[data-ce3-action="mic"]');if(micBtn)micBtn.classList.toggle('off',!ctx.micTrack?.enabled);
    const camBtn=rootNode.querySelector('[data-ce3-action="camera"]');if(camBtn){camBtn.classList.toggle('off',!ctx.cameraTrack?.enabled);camBtn.disabled=!ctx.cameraTrack;}
    const switchBtn=rootNode.querySelector('[data-ce3-action="switch-camera"]');if(switchBtn)switchBtn.disabled=!ctx.cameraTrack;
    const screenBtn=rootNode.querySelector('.ce3-controls [data-ce3-action="screen"]');if(screenBtn){screenBtn.classList.toggle('sharing',Boolean(ctx.screenTrack));screenBtn.disabled=!navigator.mediaDevices?.getDisplayMedia;}

    const localTile=ensureTile(ctx,uid(),'camera',{local:true});assignStream(localTile,localCameraStream(ctx),Boolean(ctx.cameraTrack?.enabled));
    for(const participant of ctx.participants.filter((p)=>p.user_id&&p.user_id!==uid())){
      const tile=ensureTile(ctx,participant.user_id,'camera'); const media=ctx.remoteMedia.get(tileKey(participant.user_id,'camera')); assignStream(tile,media?.stream||null,Boolean(participant.camera_enabled));
      const audioMedia=ctx.remoteMedia.get(tileKey(participant.user_id,'audio')); reconcileAudio(ctx,participant.user_id,audioMedia?.stream||null);
    }
    const remoteScreen=[...ctx.remoteMedia.values()].find((media)=>media.role==='screen'&&media.track?.readyState==='live');
    const main=rootNode.querySelector('[data-ce3-main]');const grid=rootNode.querySelector('[data-ce3-grid]');const film=rootNode.querySelector('[data-ce3-filmstrip]');
    main.innerHTML='';grid.innerHTML='';film.innerHTML=''; main.style.display='none';grid.style.display='none';film.style.display='none';
    const remoteParticipants=ctx.participants.filter((p)=>p.user_id&&p.user_id!==uid());
    if(remoteScreen){
      const screenTile=ensureTile(ctx,remoteScreen.userId,'screen');assignStream(screenTile,remoteScreen.stream,true);main.style.display='grid';main.appendChild(screenTile.node);film.style.display='flex';for(const participant of remoteParticipants)film.appendChild(ensureTile(ctx,participant.user_id,'camera').node);film.appendChild(localTile.node);
    }else if(remoteParticipants.length===1){
      const remoteTile=ensureTile(ctx,remoteParticipants[0].user_id,'camera');main.style.display='grid';main.appendChild(remoteTile.node);film.style.display='flex';film.appendChild(localTile.node);
    }else{
      grid.style.display='grid';const tiles=[...remoteParticipants.map((p)=>ensureTile(ctx,p.user_id,'camera')),localTile];grid.className=`ce3-grid count-${Math.min(MAX_PARTICIPANTS,tiles.length)}`;for(const tile of tiles)grid.appendChild(tile.node);
    }
    const localShare=rootNode.querySelector('[data-ce3-local-share]');if(localShare){localShare.classList.toggle('active',Boolean(ctx.screenTrack));const preview=localShare.querySelector('[data-ce3-local-screen]');if(preview&&ctx.screenTrack){if(ctx.localScreenPreviewTrack!==ctx.screenTrack){ctx.localScreenPreviewTrack=ctx.screenTrack;preview.srcObject=new MediaStream([ctx.screenTrack]);void preview.play().catch(()=>{});}}}
    const pending=rootNode.querySelector('[data-ce3-pending]');if(pending)pending.innerHTML=ctx.invites.filter((i)=>i.status==='pending').map((i)=>`<span>${esc(displayName(i.invited_user_id))} · sonne…</span>`).join('');
  }

  function reconcileAudio(ctx,userId,stream){
    let audio=ctx.audioEls.get(userId);if(!audio){audio=document.createElement('audio');audio.autoplay=true;audio.playsInline=true;audio.hidden=true;root('call-engine-v3-active').appendChild(audio);ctx.audioEls.set(userId,audio);}if(audio.srcObject!==stream)audio.srcObject=stream;if(ctx.speakerDeviceId&&typeof audio.setSinkId==='function')void audio.setSinkId(ctx.speakerDeviceId).catch(()=>{});if(stream)void audio.play().catch(()=>{});
  }

  function healthLabel(state){return ({connecting:'Connexion…','media-waiting':'Média en attente',connected:'Connecté',degraded:'Connexion dégradée',reconnecting:'Reconnexion…',interrupted:'Média interrompu'})[state]||'Connexion…';}
  async function updateHealth(ctx){
    if(!ctx||ctx.stopped||active!==ctx||!ctx.pc)return;
    let next='connecting',detail=`Transport ${ctx.pc.connectionState}`; const transportConnected=ctx.pc.connectionState==='connected';
    let inboundBytes=0,framesDecoded=0,packetsLost=0,packetsReceived=0,rtt=0;
    try{
      const stats=await ctx.pc.getStats();
      stats.forEach((report)=>{
        if(report.type==='inbound-rtp'&&!report.isRemote){inboundBytes+=Number(report.bytesReceived||0);framesDecoded+=Number(report.framesDecoded||0);packetsLost+=Math.max(0,Number(report.packetsLost||0));packetsReceived+=Math.max(0,Number(report.packetsReceived||0));}
        if(report.type==='candidate-pair'&&report.state==='succeeded'&&report.nominated)rtt=Math.max(rtt,Number(report.currentRoundTripTime||0));
      });
    }catch{}
    const now=Date.now();if(inboundBytes>ctx.lastInboundBytes){ctx.lastMediaProgressAt=now;ctx.lastInboundBytes=inboundBytes;}
    const expectedRemote=ctx.catalog.some((row)=>row.user_id!==uid()&&row.state==='live');
    if(ctx.pc.connectionState==='failed'||ctx.pc.iceConnectionState==='failed')next='interrupted';
    else if(['disconnected'].includes(ctx.pc.connectionState)||['disconnected'].includes(ctx.pc.iceConnectionState))next='reconnecting';
    else if(transportConnected){
      if(!ctx.connectedAt)ctx.connectedAt=now;
      if(expectedRemote&&inboundBytes===0&&now-ctx.connectedAt>5000)next='media-waiting';
      else if(expectedRemote&&ctx.lastMediaProgressAt&&now-ctx.lastMediaProgressAt>8000)next='interrupted';
      else{const loss=packetsReceived+packetsLost?packetsLost/(packetsReceived+packetsLost):0;next=(loss>.08||rtt>.45)?'degraded':'connected';detail=`RTT ${Math.round(rtt*1000)} ms · pertes ${Math.round(loss*100)}% · frames ${framesDecoded}`;}
    }
    ctx.health=next;ctx.healthDetail=detail; if(ctx.lastTelemetryState!==next){ctx.lastTelemetryState=next;void recordTelemetry(ctx,next==='media-waiting'?'media_waiting':next,null,{connectionState:ctx.pc.connectionState,iceState:ctx.pc.iceConnectionState,rttMs:Math.round(rtt*1000),packetsLost,packetsReceived,framesDecoded,inboundBytes});}
    updateActiveUi(ctx);
  }

  async function recordTelemetry(ctx,event,role,metrics){try{await api.rpc('record_call_media_telemetry_v3',{p_call_id:ctx.call.id,p_event:event,p_role:role||null,p_metrics:metrics||{}});}catch{} }

  async function toggleMic(){if(!active?.micTrack)return;active.micTrack.enabled=!active.micTrack.enabled;await syncMediaState(active);updateActiveUi(active);}
  async function toggleCamera(){if(!active?.cameraTrack)return;active.cameraTrack.enabled=!active.cameraTrack.enabled;await syncMediaState(active);updateActiveUi(active);}
  async function switchCamera(){
    if(!active?.cameraTrack)return;const ctx=active;const nextFacing=ctx.facingMode==='environment'?'user':'environment';
    try{const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:nextFacing},width:{ideal:1280},height:{ideal:720}},audio:false});const next=stream.getVideoTracks()[0];if(!next)return;next.enabled=ctx.cameraTrack.enabled;const old=ctx.cameraTrack;ctx.localStream.removeTrack(old);old.stop();ctx.localStream.addTrack(next);ctx.cameraTrack=next;ctx.facingMode=next.getSettings?.().facingMode||nextFacing;await ctx.cameraTx?.sender.replaceTrack(next);ctx.localCameraStream=null;updateActiveUi(ctx);}catch(error){showError('Impossible de changer de caméra',error);}
  }

  async function toggleScreen(){
    if(!active)return;const ctx=active;
    if(ctx.screenTrack){const track=ctx.screenTrack;ctx.screenTrack=null;track.onended=null;await ctx.screenTx?.sender.replaceTrack(null);track.stop();await api.rpc('end_call_media_track_v3',{p_call_id:ctx.call.id,p_role:'screen'}).catch(()=>{});await syncMediaState(ctx);updateActiveUi(ctx);return;}
    if(!navigator.mediaDevices?.getDisplayMedia)return;
    try{
      const stream=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:{ideal:15,max:30}},audio:false});const track=stream.getVideoTracks()[0];if(!track)return;ctx.screenTrack=track;
      if(ctx.screenTx&&ctx.published.get('screen')){await ctx.screenTx.sender.replaceTrack(track);const published=ctx.published.get('screen');await api.rpc('upsert_call_media_track_v3',{p_call_id:ctx.call.id,p_provider_session_id:ctx.providerSessionId,p_provider_track_id:published.providerTrackId,p_role:'screen',p_mid:published.mid});}
      else{ctx.screenTx=ctx.pc.addTransceiver(track,{direction:'sendonly'});await publishEntries(ctx,[{role:'screen',tx:ctx.screenTx,track}]);}
      track.onended=()=>{if(active===ctx&&ctx.screenTrack?.id===track.id)void toggleScreen();};await syncMediaState(ctx);updateActiveUi(ctx);
    }catch(error){if(error?.name!=='NotAllowedError')showError('Partage d’écran indisponible',error);}
  }

  async function replaceActiveDevice(kind,deviceId){
    if(!active)return;const ctx=active;if(kind==='speaker'){ctx.speakerDeviceId=deviceId;for(const [id,media] of ctx.remoteMedia)if(media.role==='audio')reconcileAudio(ctx,media.userId,media.stream);return;}
    const old=kind==='camera'?ctx.cameraTrack:ctx.micTrack;const enabled=old?.enabled!==false;const stream=await navigator.mediaDevices.getUserMedia(kind==='camera'?{video:{deviceId:{exact:deviceId},width:{ideal:1280},height:{ideal:720}},audio:false}:{audio:{deviceId:{exact:deviceId},echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});const next=kind==='camera'?stream.getVideoTracks()[0]:stream.getAudioTracks()[0];if(!next)return;next.enabled=enabled;if(old){ctx.localStream.removeTrack(old);old.stop();}ctx.localStream.addTrack(next);if(kind==='camera'){ctx.cameraTrack=next;ctx.facingMode=next.getSettings?.().facingMode||ctx.facingMode;await ctx.cameraTx?.sender.replaceTrack(next);ctx.localCameraStream=null;}else{ctx.micTrack=next;await ctx.micTx?.sender.replaceTrack(next);}await syncMediaState(ctx);updateActiveUi(ctx);
  }

  async function showDevices(){if(!active)return;const devices=await enumerateMediaDevices();const node=root('call-engine-v3-devices');const cam=active.cameraTrack?.getSettings?.().deviceId||'';const mic=active.micTrack?.getSettings?.().deviceId||'';node.innerHTML=`<div class="ce3-backdrop"><section class="ce3-dialog"><header><div><h2>Périphériques</h2><p>Caméra, micro et sortie audio disponibles sur ce navigateur.</p></div><button class="ce3-icon" data-ce3-action="devices-close">×</button></header><div class="ce3-device-grid" style="padding-top:18px">${mediaSelect('camera',devices.cameras,cam)}${mediaSelect('mic',devices.mics,mic)}${typeof HTMLMediaElement!=='undefined'&&'setSinkId' in HTMLMediaElement.prototype?mediaSelect('speaker',devices.speakers,active.speakerDeviceId):''}</div><footer><span></span><button class="ce3-btn primary" data-ce3-action="devices-close">Terminé</button></footer></section></div>`;}

  async function leaveCall(){if(!active)return;const ctx=active;cleanupCall(ctx,{stopTracks:true});active=null;renderActiveVisibility();try{await api.rpc('end_all_call_media_tracks_v3',{p_call_id:ctx.call.id});await api.rpc('leave_call_v1',{p_call_id:ctx.call.id});}catch(error){console.warn('[2b2c call v3] leave',error);}}
  async function endCall(){if(!active)return;const ctx=active;if(!ctx.endConfirmUntil||ctx.endConfirmUntil<Date.now()){ctx.endConfirmUntil=Date.now()+5000;updateActiveUi(ctx);setTimeout(()=>{if(active===ctx&&ctx.endConfirmUntil<Date.now())updateActiveUi(ctx);},5200);return;}try{await api.rpc('end_call_v1',{p_call_id:ctx.call.id,p_expected_version:ctx.call.version});}catch(error){showError('Impossible de terminer la visio',error);return;}cleanupCall(ctx,{stopTracks:true});active=null;renderActiveVisibility();}
  function cleanupCall(ctx,{stopTracks=false}={}){if(!ctx||ctx.stopped)return;ctx.stopped=true;if(ctx.syncTimer)clearTimeout(ctx.syncTimer);if(ctx.heartbeatTimer)clearInterval(ctx.heartbeatTimer);if(ctx.statsTimer)clearInterval(ctx.statsTimer);try{ctx.pc?.close();}catch{}for(const media of ctx.remoteMedia.values())media.track?.stop?.();for(const audio of ctx.audioEls.values())audio.remove();if(ctx.screenTrack){ctx.screenTrack.onended=null;ctx.screenTrack.stop();}if(stopTracks)ctx.localStream?.getTracks().forEach((track)=>track.stop());removeNode('call-engine-v3-devices');document.documentElement.classList.remove('call-engine-v3-active');}
  function renderActiveVisibility(){if(!active)removeNode('call-engine-v3-active');}
  function renderDock(ctx){const node=root('call-engine-v3-active');node.innerHTML=`<aside class="ce3-dock"><span class="ce3-live"></span><div><strong>${esc(titleFor(ctx.call))}</strong><small>${ctx.participants.length||1} participant${(ctx.participants.length||1)>1?'s':''} · ${esc(healthLabel(ctx.health))}</small></div><button class="ce3-btn" data-ce3-action="restore">Ouvrir</button><button class="ce3-btn" data-ce3-action="leave">Quitter</button></aside>`;}
  async function toggleFullscreen(){const shell=document.querySelector('#call-engine-v3-active .ce3-shell');if(!shell)return;try{if(document.fullscreenElement)await document.exitFullscreen();else await shell.requestFullscreen?.();}catch{}}

  async function probeResume(){
    if(active||busy||!api.getSession()?.access_token){scheduleIdleProbe();return;}try{const user=await getUser();if(!user?.id){scheduleIdleProbe();return;}const rows=await api.select('call_participants',`select=call_session_id,last_seen_at&user_id=eq.${user.id}&left_at=is.null&order=last_seen_at.desc&limit=3`).catch(()=>[]);let found=null;for(const row of rows||[]){const calls=await api.select('call_sessions',`select=*&id=eq.${row.call_session_id}&ended_at=is.null&status=eq.active&limit=1`).catch(()=>[]);if(calls?.[0]){found=calls[0];break;}}resumeCall=found;renderResume();}catch(error){console.warn('[2b2c call v3] resume probe',error);}scheduleIdleProbe();
  }
  function scheduleIdleProbe(){if(idleTimer)clearTimeout(idleTimer);idleTimer=setTimeout(()=>void probeResume(),4500);}
  function renderResume(){if(!resumeCall||active){removeNode('call-engine-v3-resume');return;}const node=root('call-engine-v3-resume');node.innerHTML=`<section class="ce3-resume"><span class="ce3-live"></span><div><strong>Visio en cours</strong><small>Votre session 2b2c est toujours active.</small></div><button class="ce3-btn" data-ce3-action="resume-leave" data-call="${escAttr(resumeCall.id)}">Quitter</button><button class="ce3-btn primary" data-ce3-action="resume" data-call="${escAttr(resumeCall.id)}">Reprendre</button></section>`;}
  async function resumeExisting(callId){if(!callId||active||busy)return;busy=true;try{const calls=await api.select('call_sessions',`select=*&id=eq.${callId}&ended_at=is.null&status=eq.active&limit=1`);const call=calls?.[0];if(!call)throw new Error('Cette visio est terminée.');const stream=await acquireLocalMedia({facingMode:'user'});resumeCall=null;renderResume();await connectCall(call,stream,{});}catch(error){showError('Impossible de reprendre la visio V3',error);}finally{busy=false;}}
  async function leaveResumable(callId){if(!callId)return;try{await api.rpc('end_all_call_media_tracks_v3',{p_call_id:callId}).catch(()=>{});await api.rpc('leave_call_v1',{p_call_id:callId});}catch{}resumeCall=null;renderResume();}

  function showError(title,error){const node=root('call-engine-v3-error');node.innerHTML=`<div class="ce3-error"><strong>${esc(title)}</strong><div>${esc(error?.message||String(error||'Erreur inconnue'))}</div><button data-ce3-action="error-close">×</button></div>`;setTimeout(()=>node.remove(),10000);}

  async function handleOpenProject(projectId){await openPicker({projectId,title:'Visio du projet'});} async function handleOpenMeeting(meetingId,projectId){await openPicker({projectId,meetingId,title:'Visio de la réunion'});}
  function intercept(event){const target=event.target?.closest?.('[data-ce3-action],[data-action],[data-cw-action]');if(!target)return false;const action=target.dataset.ce3Action;const legacy=target.dataset.action;const cw=target.dataset.cwAction;const owned=new Set(['open-call-picker-v1','open-project-call-v1','open-meeting-call-v1','call-accept-v1','call-decline-v1','call-resume-v1','call-resume-leave-v1']);if(!action&&!owned.has(legacy)&&cw!=='call-conversation')return false;event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();void handleAction({action,legacy,cw,target});return true;}
  async function handleAction({action,legacy,cw,target}){
    try{
      if(legacy==='open-call-picker-v1')return openPicker();if(legacy==='open-project-call-v1')return handleOpenProject(target.dataset.project||null);if(legacy==='open-meeting-call-v1')return handleOpenMeeting(target.dataset.meeting||null,target.dataset.project||null);if(legacy==='call-accept-v1')return acceptIncoming(target.dataset.call||'');if(legacy==='call-decline-v1')return declineIncoming(target.dataset.call||'');if(legacy==='call-resume-v1')return resumeExisting(target.dataset.call||'');if(legacy==='call-resume-leave-v1')return leaveResumable(target.dataset.call||'');
      if(cw==='call-conversation'){const match=(location.hash||'').match(/^#\/messages\/([^/?]+)/);const conversationId=match?.[1]||'';if(!conversationId)return openPicker();const user=await getUser();const [members,conversations]=await Promise.all([api.select('conversation_members',`select=user_id&conversation_id=eq.${conversationId}`),api.select('conversations',`select=id,project_id,linked_project_id&id=eq.${conversationId}`).catch(()=>[])]);const ids=(members||[]).map((m)=>m.user_id).filter((id)=>id!==user?.id);const conversation=conversations?.[0]||null;return openPicker({presetIds:ids,projectId:conversation?.project_id||conversation?.linked_project_id||null,title:'Appeler la conversation'});}
      if(action==='picker-close'){picker=null;renderPicker();return;}if(action==='picker-toggle'){const id=target.dataset.user;if(!picker||!id)return;if(picker.selected.has(id))picker.selected.delete(id);else if(picker.selected.size<picker.capacity)picker.selected.add(id);renderPicker();return;}if(action==='picker-confirm')return confirmPicker();if(action==='prejoin-cancel')return cancelPrejoin();if(action==='prejoin-mic'){if(prejoin?.micTrack)prejoin.micTrack.enabled=!prejoin.micTrack.enabled;renderPrejoin();return;}if(action==='prejoin-camera'){if(prejoin?.cameraTrack)prejoin.cameraTrack.enabled=!prejoin.cameraTrack.enabled;renderPrejoin();return;}if(action==='prejoin-switch')return switchPrejoinCamera();if(action==='prejoin-start')return startPreparedCall();if(action==='mic')return toggleMic();if(action==='camera')return toggleCamera();if(action==='switch-camera')return switchCamera();if(action==='screen')return toggleScreen();if(action==='devices')return showDevices();if(action==='devices-close'){removeNode('call-engine-v3-devices');return;}if(action==='add')return openPicker({mode:'add',projectId:active?.call?.project_id||null,title:'Ajouter des participants'});if(action==='leave')return leaveCall();if(action==='end')return endCall();if(action==='minimize'){if(active){active.minimized=true;renderDock(active);}return;}if(action==='restore'){if(active){active.minimized=false;mountActiveShell(active);}return;}if(action==='fullscreen')return toggleFullscreen();if(action==='resume')return resumeExisting(target.dataset.call||'');if(action==='resume-leave')return leaveResumable(target.dataset.call||'');if(action==='error-close'){removeNode('call-engine-v3-error');return;}
    }catch(error){console.error('[2b2c call v3] action',action||legacy||cw,error);showError('Action visio impossible',error);}
  }
  async function onDeviceChange(event){const select=event.target?.closest?.('[data-ce3-device]');if(!select)return;event.stopPropagation();try{if(prejoin)await replacePrejoinTrack(select.dataset.ce3Device,select.value);else if(active)await replaceActiveDevice(select.dataset.ce3Device,select.value);}catch(error){showError('Périphérique indisponible',error);}}
  function onExternalStart(event){if(active)return;event.stopImmediatePropagation();const ids=Array.isArray(event.detail?.userIds)?event.detail.userIds.filter(Boolean):[];void openPicker({presetIds:ids,projectId:event.detail?.projectId||null,title:'Appeler'});}

  window.addEventListener('click',intercept,true);window.addEventListener('change',onDeviceChange,true);window.addEventListener('2b2c:start-call',onExternalStart);window.addEventListener('online',()=>{if(active){active.health='reconnecting';active.healthDetail='Réseau rétabli';void syncCall(active,true);void updateHealth(active);}});document.addEventListener('visibilitychange',()=>{if(!document.hidden&&active){void heartbeat(active);void syncCall(active,true);void updateHealth(active);}});setTimeout(()=>void probeResume(),1200);

  window.__4B4C_CALL_ENGINE_V3__=Object.freeze({version:'3.0.0-sfu-preview',openPicker,acceptIncoming,declineIncoming,resumeExisting,get state(){return active?'active':prejoin?'prejoin':picker?'picker':'idle';},get providerSessionId(){return active?.providerSessionId||'';}});
}

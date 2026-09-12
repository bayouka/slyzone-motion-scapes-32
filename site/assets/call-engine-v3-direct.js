import { SupabaseBrowserClient } from './supabase-client.js';

if (!window.__4B4C_CALL_ENGINE_V3__) {
  const config = window.__4B4C_CONFIG__ || {};
  const api = new SupabaseBrowserClient({ url: config.supabaseUrl, publishableKey: config.supabasePublishableKey });
  const workspaceKey = config.workspaceStorageKey || '4b4c.live.workspace.v1';
  const MAX_PARTICIPANTS = 6;
  const SYNC_MS = 700;
  const HEARTBEAT_MS = 8000;
  const STATS_MS = 3000;
  const DISCONNECT_GRACE_MS = 4500;
  const ICE_SERVERS = [{ urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.cloudflare.com:53'] }];
  const ROLE_ORDER = ['audio', 'camera', 'screen'];

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
  const peerKey = (userId, role) => `${userId}:${role}`;
  const isInitiatorFor = (remoteUserId) => String(uid()).localeCompare(String(remoteUserId)) < 0;

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

  async function acquireLocalMedia({ cameraDeviceId = '', micDeviceId = '', facingMode = 'user' } = {}) {
    const audio = micDeviceId
      ? { deviceId:{ exact:micDeviceId }, echoCancellation:true, noiseSuppression:true, autoGainControl:true }
      : { echoCancellation:true, noiseSuppression:true, autoGainControl:true };
    const video = cameraDeviceId
      ? { deviceId:{ exact:cameraDeviceId }, width:{ ideal:1280 }, height:{ ideal:720 } }
      : { facingMode:{ ideal:facingMode }, width:{ ideal:1280 }, height:{ ideal:720 } };
    try { return await navigator.mediaDevices.getUserMedia({ audio, video }); }
    catch (firstError) {
      console.warn('[4b4c call v3-direct] camera+mic unavailable', firstError);
      try { return await navigator.mediaDevices.getUserMedia({ audio, video:false }); }
      catch (secondError) { console.warn('[4b4c call v3-direct] audio unavailable', secondError); return new MediaStream(); }
    }
  }

  async function enumerateMediaDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return {
        cameras:devices.filter((d)=>d.kind==='videoinput'),
        mics:devices.filter((d)=>d.kind==='audioinput'),
        speakers:devices.filter((d)=>d.kind==='audiooutput'),
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
    const user = await getUser(); const wid = workspaceId(); if (!user?.id || !wid) return;
    const members = await loadRoster(wid); let suggested=[...presetIds];
    if(!suggested.length&&meetingId)suggested=await meetingPreset(meetingId);
    if(!suggested.length&&projectId)suggested=await projectPreset(projectId);
    const unavailable=new Set([user.id]);
    if(mode==='add'&&active){
      for(const participant of active.participants||[])unavailable.add(participant.user_id);
      for(const invite of active.invites||[])if(!['declined','cancelled'].includes(invite.status))unavailable.add(invite.invited_user_id);
    }
    const options=members.filter((member)=>!unavailable.has(member.user_id));
    const occupied=active?new Set([user.id,...active.participants.map((p)=>p.user_id),...active.invites.filter((i)=>!['declined','cancelled'].includes(i.status)).map((i)=>i.invited_user_id)]).size:1;
    const capacity=mode==='add'?Math.max(0,MAX_PARTICIPANTS-occupied):MAX_PARTICIPANTS-1;
    const allowed=new Set(options.map((m)=>m.user_id));
    const selected=new Set(suggested.filter((id)=>allowed.has(id)).slice(0,capacity));
    picker={mode,selected,options,capacity,projectId,meetingId,title}; renderPicker();
  }

  function renderPicker() {
    if(!picker){removeNode('call-engine-v3-picker');return;}
    const node=root('call-engine-v3-picker');
    node.innerHTML=`<div class="ce3-backdrop"><section class="ce3-dialog" role="dialog" aria-modal="true"><header><div><h2>${esc(picker.mode==='add'?'Ajouter des participants':picker.title)}</h2><p>${picker.mode==='add'?'Invitez des membres dans la visio en cours.':'Choisissez jusqu’à 5 personnes. Vous pourrez en ajouter ensuite.'}</p></div><button class="ce3-icon" data-ce3-action="picker-close" aria-label="Fermer">×</button></header><div class="ce3-people">${picker.options.length?picker.options.map((member)=>{const selected=picker.selected.has(member.user_id);return `<button type="button" class="ce3-person ${selected?'selected':''}" data-ce3-action="picker-toggle" data-user="${escAttr(member.user_id)}" aria-pressed="${selected}"><span class="ce3-avatar">${esc(initials(member.user_id))}</span><span><strong>${esc(displayName(member.user_id))}</strong><small>${member.role==='owner'?'Propriétaire':member.role==='admin'?'Administrateur':'Membre'}</small></span><i class="ce3-check">${selected?'✓':'+'}</i></button>`;}).join(''):'<div style="padding:24px;text-align:center;color:#68758a">Aucun membre disponible.</div>'}</div><footer><span>${picker.selected.size}/${picker.capacity}</span><div><button class="ce3-btn" data-ce3-action="picker-close">Annuler</button> <button class="ce3-btn primary" data-ce3-action="picker-confirm" ${picker.selected.size?'':'disabled'}>${picker.mode==='add'?'Inviter':'Continuer'}</button></div></footer></section></div>`;
  }

  async function confirmPicker() {
    if(!picker?.selected.size)return;
    const data=picker; picker=null; renderPicker();
    if(data.mode==='add'){
      await api.rpc('invite_to_call_v1',{p_call_id:active.call.id,p_target_user_ids:[...data.selected]});
      active.statusMessage=`${data.selected.size} invitation${data.selected.size>1?'s':''} envoyée${data.selected.size>1?'s':''}`;
      await syncCall(active,true); return;
    }
    const stream=await acquireLocalMedia({facingMode:'user'});
    const devices=await enumerateMediaDevices();
    const cameraTrack=stream.getVideoTracks()[0]||null;
    const micTrack=stream.getAudioTracks()[0]||null;
    prejoin={targetIds:[...data.selected],projectId:data.projectId,meetingId:data.meetingId,stream,cameraTrack,micTrack,devices,cameraDeviceId:cameraTrack?.getSettings?.().deviceId||'',micDeviceId:micTrack?.getSettings?.().deviceId||'',facingMode:cameraTrack?.getSettings?.().facingMode||'user',speakerDeviceId:''};
    renderPrejoin();
  }

  function mediaSelect(kind,devices,selected){
    if(!devices.length)return'';
    const label=kind==='camera'?'Caméra':kind==='mic'?'Micro':'Haut-parleur';
    return `<label><span>${label}</span><select data-ce3-device="${kind}">${devices.map((device,index)=>`<option value="${escAttr(device.deviceId)}" ${device.deviceId===selected?'selected':''}>${esc(device.label||`${label} ${index+1}`)}</option>`).join('')}</select></label>`;
  }

  function renderPrejoin(){
    if(!prejoin){removeNode('call-engine-v3-prejoin');return;}
    const node=root('call-engine-v3-prejoin');
    node.innerHTML=`<div class="ce3-backdrop"><section class="ce3-dialog" role="dialog" aria-modal="true"><header><div><h2>Vérifiez votre caméra et votre micro</h2><p>${prejoin.targetIds.length} participant${prejoin.targetIds.length>1?'s':''} à appeler.</p></div><button class="ce3-icon" data-ce3-action="prejoin-cancel">×</button></header><div class="ce3-preview ${prejoin.cameraTrack?.enabled?'':'camera-off'}"><video id="ce3-prejoin-video" autoplay playsinline muted></video><span class="ce3-avatar">${esc(initials(uid()))}</span></div><div class="ce3-prejoin-controls"><button class="ce3-round ${prejoin.micTrack?.enabled?'':'off'}" data-ce3-action="prejoin-mic">🎙 ${prejoin.micTrack?.enabled?'Micro actif':'Micro coupé'}</button><button class="ce3-round ${prejoin.cameraTrack?.enabled?'':'off'}" data-ce3-action="prejoin-camera" ${prejoin.cameraTrack?'':'disabled'}>▣ ${prejoin.cameraTrack?.enabled?'Caméra active':'Caméra coupée'}</button>${prejoin.devices.cameras.length>1?'<button class="ce3-round" data-ce3-action="prejoin-switch">↻ Changer caméra</button>':''}</div><div class="ce3-device-grid">${mediaSelect('camera',prejoin.devices.cameras,prejoin.cameraDeviceId)}${mediaSelect('mic',prejoin.devices.mics,prejoin.micDeviceId)}${typeof HTMLMediaElement!=='undefined'&&'setSinkId' in HTMLMediaElement.prototype?mediaSelect('speaker',prejoin.devices.speakers,prejoin.speakerDeviceId):''}</div><footer><button class="ce3-btn" data-ce3-action="prejoin-cancel">Annuler</button><button class="ce3-btn primary" data-ce3-action="prejoin-start">Appeler</button></footer></section></div>`;
    const video=document.getElementById('ce3-prejoin-video');
    if(video&&video.srcObject!==prejoin.stream){video.srcObject=prejoin.stream;void video.play().catch(()=>{});}
  }

  async function replacePrejoinTrack(kind,deviceId=''){
    if(!prejoin)return;
    if(kind==='speaker'){prejoin.speakerDeviceId=deviceId;renderPrejoin();return;}
    const old=kind==='camera'?prejoin.cameraTrack:prejoin.micTrack;
    const enabled=old?.enabled!==false;
    const constraints=kind==='camera'?{video:{deviceId:{exact:deviceId},width:{ideal:1280},height:{ideal:720}},audio:false}:{audio:{deviceId:{exact:deviceId},echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false};
    const stream=await navigator.mediaDevices.getUserMedia(constraints);
    const next=kind==='camera'?stream.getVideoTracks()[0]:stream.getAudioTracks()[0]; if(!next)return;
    next.enabled=enabled;
    if(old){prejoin.stream.removeTrack(old);old.stop();}
    prejoin.stream.addTrack(next);
    if(kind==='camera'){prejoin.cameraTrack=next;prejoin.cameraDeviceId=next.getSettings?.().deviceId||deviceId;prejoin.facingMode=next.getSettings?.().facingMode||prejoin.facingMode;}
    else{prejoin.micTrack=next;prejoin.micDeviceId=next.getSettings?.().deviceId||deviceId;}
    prejoin.devices=await enumerateMediaDevices(); renderPrejoin();
  }
  async function switchPrejoinCamera(){
    if(!prejoin?.cameraTrack)return;
    const nextFacing=prejoin.facingMode==='environment'?'user':'environment';
    const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:nextFacing},width:{ideal:1280},height:{ideal:720}},audio:false});
    const next=stream.getVideoTracks()[0];if(!next)return;
    next.enabled=prejoin.cameraTrack.enabled;
    prejoin.stream.removeTrack(prejoin.cameraTrack);prejoin.cameraTrack.stop();prejoin.stream.addTrack(next);
    prejoin.cameraTrack=next;prejoin.facingMode=next.getSettings?.().facingMode||nextFacing;prejoin.cameraDeviceId=next.getSettings?.().deviceId||'';
    prejoin.devices=await enumerateMediaDevices();renderPrejoin();
  }
  function cancelPrejoin(){prejoin?.stream?.getTracks().forEach((track)=>track.stop());prejoin=null;renderPrejoin();}

  async function startPreparedCall(){
    if(!prejoin||busy)return;busy=true;
    try{
      const prepared=prejoin;prejoin=null;renderPrejoin();let call;
      if(prepared.meetingId&&prepared.projectId){
        call=one(await api.rpc('start_call_v1',{p_project_id:prepared.projectId,p_conversation_id:null,p_meeting_id:prepared.meetingId}));
        if(prepared.targetIds.length)await api.rpc('invite_to_call_v1',{p_call_id:call.id,p_target_user_ids:prepared.targetIds});
      } else {
        call=one(await api.rpc('start_private_call_v2',{p_workspace_id:workspaceId(),p_target_user_ids:prepared.targetIds,p_project_id:prepared.projectId||null}));
      }
      await connectCall(call,prepared.stream,{speakerDeviceId:prepared.speakerDeviceId});
    }catch(error){showError('Impossible de démarrer la visio',error);}finally{busy=false;}
  }
  async function acceptIncoming(callId){
    if(!callId||active||busy)return;busy=true;
    try{
      const call=one(await api.rpc('respond_call_invite_v1',{p_call_id:callId,p_accept:true}));
      removeNode('incoming-call-v2');removeNode('incoming-call-v1');
      const stream=await acquireLocalMedia({facingMode:'user'});await connectCall(call,stream,{});
    }catch(error){showError('Impossible de rejoindre la visio',error);}finally{busy=false;}
  }
  async function declineIncoming(callId){if(!callId)return;try{await api.rpc('respond_call_invite_v1',{p_call_id:callId,p_accept:false});}catch{}removeNode('incoming-call-v2');removeNode('incoming-call-v1');}

  function roleTracks(ctx){return { audio:ctx.micTrack||null,camera:ctx.cameraTrack||null,screen:ctx.screenTrack||null };}
  function expectedEpoch(peer){return peer.initiator?peer.epoch:peer.remoteEpoch;}

  async function sendSignal(ctx,remoteUserId,type,payload){
    if(!ctx||ctx.stopped||active!==ctx)return;
    await api.rpc('send_call_signal_v1',{p_call_id:ctx.call.id,p_to_user:remoteUserId,p_signal_type:type,p_payload:{...payload,engine:'v3-direct'}});
  }

  function tuneSender(sender,role,participantCount){
    if(!sender?.getParameters||!sender?.setParameters)return;
    const params=sender.getParameters();
    if(!params.encodings?.length)params.encodings=[{}];
    const enc=params.encodings[0];
    if(role==='audio')enc.maxBitrate=64000;
    if(role==='camera'){
      enc.maxBitrate=participantCount<=2?1200000:participantCount<=4?650000:350000;
      if(participantCount>=5)enc.scaleResolutionDownBy=2;
      else if(participantCount>=3)enc.scaleResolutionDownBy=1.5;
      else delete enc.scaleResolutionDownBy;
    }
    if(role==='screen')enc.maxBitrate=participantCount<=3?1600000:900000;
    void sender.setParameters(params).catch(()=>{});
  }

  function bindRoleMap(peer,roles={}){
    peer.rolesByMid.clear();
    for(const role of ROLE_ORDER){const mid=roles?.[role];if(mid!==undefined&&mid!==null&&String(mid)!=='')peer.rolesByMid.set(String(mid),role);}
  }

  async function attachLocalTracks(ctx,peer){
    const local=roleTracks(ctx);
    const transceivers=peer.pc.getTransceivers();
    for(const [mid,role] of peer.rolesByMid){
      const tx=transceivers.find((candidate)=>String(candidate.mid)===String(mid));
      if(!tx)continue;
      peer.transceivers.set(role,tx);
      try{tx.direction='sendrecv';}catch{}
      await tx.sender.replaceTrack(local[role]||null);
      tuneSender(tx.sender,role,Math.max(1,ctx.participants.length));
    }
  }

  function createInitiatorTransceivers(ctx,peer){
    if(peer.transceivers.size)return;
    const local=roleTracks(ctx);
    const audioTx=local.audio?peer.pc.addTransceiver(local.audio,{direction:'sendrecv'}):peer.pc.addTransceiver('audio',{direction:'sendrecv'});
    const cameraTx=local.camera?peer.pc.addTransceiver(local.camera,{direction:'sendrecv'}):peer.pc.addTransceiver('video',{direction:'sendrecv'});
    const screenTx=local.screen?peer.pc.addTransceiver(local.screen,{direction:'sendrecv'}):peer.pc.addTransceiver('video',{direction:'sendrecv'});
    peer.transceivers.set('audio',audioTx);peer.transceivers.set('camera',cameraTx);peer.transceivers.set('screen',screenTx);
  }

  async function makeOffer(ctx,peer,{iceRestart=false}={}){
    if(!peer.initiator||peer.negotiating||ctx.stopped)return;
    peer.negotiating=true;
    try{
      createInitiatorTransceivers(ctx,peer);
      if(iceRestart)peer.epoch+=1;
      else if(peer.epoch<1)peer.epoch=1;
      await peer.pc.setLocalDescription(await peer.pc.createOffer({iceRestart}));
      const roles={};
      for(const role of ROLE_ORDER){const tx=peer.transceivers.get(role);if(tx?.mid!==null&&tx?.mid!==undefined)roles[role]=String(tx.mid);}
      bindRoleMap(peer,roles);
      await sendSignal(ctx,peer.remoteUserId,'offer',{sdp:peer.pc.localDescription.sdp,roles,epoch:peer.epoch,iceRestart:Boolean(iceRestart)});
      peer.offered=true;
    } finally {peer.negotiating=false;}
  }

  async function flushPendingIce(peer){
    if(!peer.pc.remoteDescription)return;
    const epoch=expectedEpoch(peer);
    const keep=[];
    for(const item of peer.pendingIce){
      if(item.epoch&&epoch&&item.epoch<epoch)continue;if(item.epoch&&epoch&&item.epoch>epoch){keep.push(item);continue;}
      try{await peer.pc.addIceCandidate(item.candidate);}catch(error){console.warn('[4b4c call v3-direct] ICE candidate rejected',error);}
    }
    peer.pendingIce=keep;
  }

  function scheduleRestart(ctx,peer){
    if(!peer.initiator||peer.restartTimer||ctx.stopped)return;
    peer.restartTimer=setTimeout(()=>{
      peer.restartTimer=null;
      if(!ctx.stopped&&active===ctx&&['failed','disconnected'].includes(peer.pc.iceConnectionState))void makeOffer(ctx,peer,{iceRestart:true}).catch((error)=>console.warn('[4b4c call v3-direct] ICE restart failed',error));
    },DISCONNECT_GRACE_MS);
  }

  function handleRemoteTrack(ctx,peer,event){
    const mid=String(event.transceiver?.mid??'');
    const role=peer.rolesByMid.get(mid) || (event.track.kind==='audio'?'audio':null);
    if(!role){console.warn('[4b4c call v3-direct] unmapped remote video mid',mid);return;}
    const stream=new MediaStream([event.track]);
    const key=peerKey(peer.remoteUserId,role);
    ctx.remoteMedia.set(key,{userId:peer.remoteUserId,role,track:event.track,stream,mid});
    event.track.onended=()=>{ctx.remoteMedia.delete(key);updateActiveUi(ctx);};
    event.track.onmute=()=>updateActiveUi(ctx);
    event.track.onunmute=()=>updateActiveUi(ctx);
    updateActiveUi(ctx);
  }

  function ensurePeer(ctx,remoteUserId){
    if(ctx.peers.has(remoteUserId))return ctx.peers.get(remoteUserId);
    const pc=new RTCPeerConnection({iceServers:ICE_SERVERS,bundlePolicy:'max-bundle',iceCandidatePoolSize:4});
    const peer={remoteUserId,pc,initiator:isInitiatorFor(remoteUserId),epoch:0,remoteEpoch:0,offered:false,negotiating:false,pendingIce:[],rolesByMid:new Map(),transceivers:new Map(),restartTimer:null,connectedAt:0,lastInboundBytes:0,lastMediaProgressAt:0};
    ctx.peers.set(remoteUserId,peer);
    pc.onicecandidate=(event)=>{
      if(!event.candidate)return;
      const epoch=expectedEpoch(peer)||1;
      void sendSignal(ctx,remoteUserId,'ice',{candidate:event.candidate.toJSON?event.candidate.toJSON():event.candidate,epoch}).catch((error)=>console.warn('[4b4c call v3-direct] ICE send failed',error));
    };
    pc.ontrack=(event)=>handleRemoteTrack(ctx,peer,event);
    pc.onconnectionstatechange=()=>{if(pc.connectionState==='connected')peer.connectedAt=Date.now();if(['failed','disconnected'].includes(pc.connectionState))scheduleRestart(ctx,peer);void updateHealth(ctx);};
    pc.oniceconnectionstatechange=()=>{if(['failed','disconnected'].includes(pc.iceConnectionState))scheduleRestart(ctx,peer);void updateHealth(ctx);};
    if(peer.initiator)createInitiatorTransceivers(ctx,peer);
    return peer;
  }

  async function processSignal(ctx,signal){
    const remoteUserId=signal.from_user;
    if(!remoteUserId||remoteUserId===uid())return;
    const peer=ensurePeer(ctx,remoteUserId);
    const payload=signal.payload||{};
    if(signal.signal_type==='ice'){
      const item={candidate:payload.candidate||payload,epoch:Number(payload.epoch||0)};
      const expected=expectedEpoch(peer);
      if(!peer.pc.remoteDescription||!expected||(item.epoch&&item.epoch!==expected)){peer.pendingIce.push(item);return;}
      await peer.pc.addIceCandidate(item.candidate).catch((error)=>console.warn('[4b4c call v3-direct] ICE add failed',error));
      return;
    }
    if(signal.signal_type==='offer'){
      if(peer.initiator){console.warn('[4b4c call v3-direct] rejected non-deterministic offer from',remoteUserId);return;}
      const epoch=Number(payload.epoch||1);
      if(epoch<peer.remoteEpoch)return;
      peer.remoteEpoch=epoch;
      bindRoleMap(peer,payload.roles||{});
      await peer.pc.setRemoteDescription({type:'offer',sdp:payload.sdp||''});
      await attachLocalTracks(ctx,peer);
      await flushPendingIce(peer);
      await peer.pc.setLocalDescription(await peer.pc.createAnswer());
      await sendSignal(ctx,remoteUserId,'answer',{sdp:peer.pc.localDescription.sdp,roles:payload.roles||{},epoch});
      return;
    }
    if(signal.signal_type==='answer'){
      if(!peer.initiator)return;
      const epoch=Number(payload.epoch||0);
      if(epoch!==peer.epoch||!payload.sdp)return;
      if(payload.roles)bindRoleMap(peer,payload.roles);
      await peer.pc.setRemoteDescription({type:'answer',sdp:payload.sdp});
      await flushPendingIce(peer);
    }
  }

  async function syncMediaState(ctx){
    if(!ctx||ctx.stopped)return;
    try{await api.rpc('set_call_media_state_v1',{p_call_id:ctx.call.id,p_mic:Boolean(ctx.micTrack?.enabled),p_camera:Boolean(ctx.cameraTrack?.enabled),p_screen:Boolean(ctx.screenTrack)});}catch(error){console.warn('[4b4c call v3-direct] media state',error);}
  }
  async function heartbeat(ctx){if(!ctx||ctx.stopped||active!==ctx)return;try{await api.rpc('heartbeat_call_v1',{p_call_id:ctx.call.id});}catch(error){console.warn('[4b4c call v3-direct] heartbeat',error);}}

  async function syncCall(ctx,immediate=false){
    if(!ctx||ctx.stopped||active!==ctx||ctx.syncing)return;
    if(ctx.syncTimer){clearTimeout(ctx.syncTimer);ctx.syncTimer=null;}
    ctx.syncing=true;
    try{
      const snapshot=one(await api.rpc('get_call_sync_v2',{p_call_id:ctx.call.id,p_after_signal_id:ctx.lastSignalId}));
      if(!snapshot?.call||snapshot.call.ended_at||snapshot.call.status==='ended'){
        cleanupCall(ctx,{stopTracks:true});active=null;renderActiveVisibility();return;
      }
      ctx.call=snapshot.call;
      ctx.participants=Array.isArray(snapshot.participants)?snapshot.participants:[];
      ctx.invites=Array.isArray(snapshot.invites)?snapshot.invites:[];
      const remoteIds=ctx.participants.map((p)=>p.user_id).filter((id)=>id&&id!==uid());
      for(const remoteId of remoteIds){const peer=ensurePeer(ctx,remoteId);if(peer.initiator&&!peer.offered&&peer.pc.signalingState==='stable')await makeOffer(ctx,peer);}
      for(const [remoteId,peer] of ctx.peers){if(!remoteIds.includes(remoteId)){try{peer.pc.close();}catch{}if(peer.restartTimer)clearTimeout(peer.restartTimer);ctx.peers.delete(remoteId);for(const role of ROLE_ORDER)ctx.remoteMedia.delete(peerKey(remoteId,role));}}
      const signals=Array.isArray(snapshot.signals)?snapshot.signals:[];
      for(const signal of signals){
        try{await processSignal(ctx,signal);ctx.lastSignalId=Math.max(ctx.lastSignalId,Number(signal.id||0));}
        catch(error){console.warn('[4b4c call v3-direct] signal processing paused',signal?.signal_type,error);break;}
      }
      for(const peer of ctx.peers.values())for(const [role,tx] of peer.transceivers)tuneSender(tx.sender,role,Math.max(1,ctx.participants.length));
      updateActiveUi(ctx);
    }catch(error){ctx.health='reconnecting';ctx.healthDetail=error?.message||'Synchronisation indisponible';updateActiveUi(ctx);}
    finally{ctx.syncing=false;if(!ctx.stopped&&active===ctx)ctx.syncTimer=setTimeout(()=>void syncCall(ctx),immediate?120:SYNC_MS);}
  }

  async function connectCall(call,stream,{speakerDeviceId=''}={}){
    const user=await getUser();if(!user?.id||!call?.id)throw new Error('Session d’appel invalide.');
    await api.rpc('join_call_v1',{p_call_id:call.id});await loadRoster(call.workspace_id||workspaceId());
    const cameraTrack=stream.getVideoTracks()[0]||null;const micTrack=stream.getAudioTracks()[0]||null;
    const ctx={call,localStream:stream,cameraTrack,micTrack,screenTrack:null,peers:new Map(),remoteMedia:new Map(),audioEls:new Map(),tiles:new Map(),participants:[],invites:[],speakerDeviceId,facingMode:cameraTrack?.getSettings?.().facingMode||'user',syncTimer:null,heartbeatTimer:null,statsTimer:null,lastSignalId:0,syncing:false,health:'connecting',healthDetail:'Connexion directe sécurisée…',statusMessage:'',minimized:false,endConfirmUntil:0,stopped:false};
    active=ctx;document.documentElement.classList.add('call-engine-v3-active');mountActiveShell(ctx);
    await syncMediaState(ctx);await syncCall(ctx,true);
    ctx.heartbeatTimer=setInterval(()=>void heartbeat(ctx),HEARTBEAT_MS);
    ctx.statsTimer=setInterval(()=>void updateHealth(ctx),STATS_MS);
    void heartbeat(ctx);void updateHealth(ctx);
  }

  function mountActiveShell(ctx){
    const node=root('call-engine-v3-active');
    node.innerHTML=`<section class="ce3-shell" role="dialog" aria-label="Visio en cours"><header class="ce3-head"><div class="ce3-head-left"><span class="ce3-live">En direct</span><strong data-ce3-title>${esc(titleFor(ctx.call))}</strong><small><span data-ce3-count>1 participant</span> · <span data-ce3-duration>00:00</span></small></div><div class="ce3-head-actions"><span class="ce3-health" data-ce3-health title="Connexion média">Connexion…</span><button data-ce3-action="minimize">—</button><button data-ce3-action="fullscreen">⛶</button><button class="danger-soft" data-ce3-action="end" data-ce3-end hidden>Terminer pour tous</button></div></header><div class="ce3-status" data-ce3-status hidden></div><div class="ce3-stage"><div class="ce3-main" data-ce3-main></div><div class="ce3-grid" data-ce3-grid></div><div class="ce3-filmstrip" data-ce3-filmstrip></div><div class="ce3-share-local" data-ce3-local-share><strong>Vous partagez votre écran</strong><video data-ce3-local-screen autoplay playsinline muted></video><button class="ce3-btn" data-ce3-action="screen">Arrêter le partage</button></div><div class="ce3-pending" data-ce3-pending></div></div><footer class="ce3-controls"><button data-ce3-action="mic">🎙<small>Micro</small></button><button data-ce3-action="camera">▣<small>Caméra</small></button><button data-ce3-action="switch-camera">↻<small>Changer</small></button><button data-ce3-action="screen">▤<small>Partager</small></button><button data-ce3-action="devices">⚙<small>Périphériques</small></button><button data-ce3-action="add">＋<small>Participants</small></button><button class="danger" data-ce3-action="leave">☎<small>Quitter</small></button></footer></section>`;
    updateActiveUi(ctx);
  }

  function ensureTile(ctx,userId,role,{local=false}={}){
    const key=peerKey(userId,role);let tile=ctx.tiles.get(key);if(tile)return tile;
    const node=document.createElement('div');node.className=`ce3-tile ${role==='screen'?'screen':''} ${local?'self':''}`;node.dataset.ce3Tile=key;
    const avatar=document.createElement('span');avatar.className='ce3-avatar';avatar.textContent=initials(userId);
    const video=document.createElement('video');video.autoplay=true;video.playsInline=true;video.muted=true;
    const label=document.createElement('span');label.className='ce3-label';label.textContent=role==='screen'?`Écran de ${displayName(userId)}`:(local?'Vous':displayName(userId));
    node.append(avatar,video,label);tile={key,node,video,avatar,label,stream:null};ctx.tiles.set(key,tile);return tile;
  }
  function assignStream(tile,stream,visible=true){
    if(tile.stream!==stream){tile.stream=stream;tile.video.srcObject=stream||null;if(stream)void tile.video.play().catch(()=>{});}
    tile.node.classList.toggle('has-video',Boolean(stream&&visible&&stream.getVideoTracks().some((track)=>track.readyState==='live'&&!track.muted)));tile.video.hidden=!visible;
  }
  function localCameraStream(ctx){
    if(!ctx.localCameraStream)ctx.localCameraStream=new MediaStream();const current=ctx.localCameraStream.getVideoTracks()[0]||null;
    if(current!==ctx.cameraTrack){if(current)ctx.localCameraStream.removeTrack(current);if(ctx.cameraTrack)ctx.localCameraStream.addTrack(ctx.cameraTrack);}return ctx.localCameraStream;
  }
  function reconcileAudio(ctx,userId,stream){
    let audio=ctx.audioEls.get(userId);if(!audio){audio=document.createElement('audio');audio.autoplay=true;audio.playsInline=true;audio.hidden=true;root('call-engine-v3-active').appendChild(audio);ctx.audioEls.set(userId,audio);}
    if(audio.srcObject!==stream)audio.srcObject=stream;if(ctx.speakerDeviceId&&typeof audio.setSinkId==='function')void audio.setSinkId(ctx.speakerDeviceId).catch(()=>{});if(stream)void audio.play().catch(()=>{});
  }

  function updateActiveUi(ctx){
    if(!ctx||ctx.stopped||active!==ctx)return;
    const rootNode=document.getElementById('call-engine-v3-active');if(!rootNode)return;
    if(ctx.minimized){renderDock(ctx);return;}if(rootNode.querySelector('.ce3-dock'))mountActiveShell(ctx);
    const count=Math.max(1,ctx.participants.length||1);const duration=Math.max(0,Math.floor((Date.now()-new Date(ctx.call.started_at||Date.now()).getTime())/1000));
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
    const remotes=ctx.participants.filter((p)=>p.user_id&&p.user_id!==uid());
    for(const participant of remotes){
      const tile=ensureTile(ctx,participant.user_id,'camera');const media=ctx.remoteMedia.get(peerKey(participant.user_id,'camera'));assignStream(tile,media?.stream||null,Boolean(participant.camera_enabled));
      const audioMedia=ctx.remoteMedia.get(peerKey(participant.user_id,'audio'));reconcileAudio(ctx,participant.user_id,audioMedia?.stream||null);
    }
    const remoteScreen=[...ctx.remoteMedia.values()].find((media)=>media.role==='screen'&&media.track?.readyState==='live'&&!media.track.muted);
    const main=rootNode.querySelector('[data-ce3-main]');const grid=rootNode.querySelector('[data-ce3-grid]');const film=rootNode.querySelector('[data-ce3-filmstrip]');
    main.innerHTML='';grid.innerHTML='';film.innerHTML='';main.style.display='none';grid.style.display='none';film.style.display='none';
    if(remoteScreen){
      const screenTile=ensureTile(ctx,remoteScreen.userId,'screen');assignStream(screenTile,remoteScreen.stream,true);main.style.display='grid';main.appendChild(screenTile.node);film.style.display='flex';for(const participant of remotes)film.appendChild(ensureTile(ctx,participant.user_id,'camera').node);film.appendChild(localTile.node);
    } else if(remotes.length===1){
      main.style.display='grid';main.appendChild(ensureTile(ctx,remotes[0].user_id,'camera').node);film.style.display='flex';film.appendChild(localTile.node);
    } else {
      grid.style.display='grid';const tiles=[...remotes.map((p)=>ensureTile(ctx,p.user_id,'camera')),localTile];grid.className=`ce3-grid count-${Math.min(MAX_PARTICIPANTS,tiles.length)}`;for(const tile of tiles)grid.appendChild(tile.node);
    }
    const localShare=rootNode.querySelector('[data-ce3-local-share]');if(localShare){localShare.classList.toggle('active',Boolean(ctx.screenTrack));const preview=localShare.querySelector('[data-ce3-local-screen]');if(preview&&ctx.screenTrack&&preview.srcObject?.getVideoTracks?.()[0]!==ctx.screenTrack){preview.srcObject=new MediaStream([ctx.screenTrack]);void preview.play().catch(()=>{});}}
    const pending=rootNode.querySelector('[data-ce3-pending]');if(pending)pending.innerHTML=ctx.invites.filter((invite)=>invite.status==='pending').map((invite)=>`<span>${esc(displayName(invite.invited_user_id))} · sonne…</span>`).join('');
  }

  function healthLabel(state){return({connecting:'Connexion…','media-waiting':'Média en attente',connected:'Connecté',degraded:'Connexion dégradée',reconnecting:'Reconnexion…',interrupted:'Média interrompu'})[state]||'Connexion…';}

  async function updateHealth(ctx){
    if(!ctx||ctx.stopped||active!==ctx)return;
    const peers=[...ctx.peers.values()];
    if(!peers.length){ctx.health='connecting';ctx.healthDetail='En attente d’un participant…';updateActiveUi(ctx);return;}
    let connected=0,failed=0,totalInbound=0,totalLost=0,totalReceived=0,worstRtt=0,expectedRemote=0;
    for(const peer of peers){
      if(peer.pc.connectionState==='connected')connected+=1;if(['failed','closed'].includes(peer.pc.connectionState))failed+=1;
      try{
        const stats=await peer.pc.getStats();let inbound=0;
        stats.forEach((report)=>{
          if(report.type==='inbound-rtp'&&!report.isRemote){inbound+=Number(report.bytesReceived||0);totalLost+=Math.max(0,Number(report.packetsLost||0));totalReceived+=Math.max(0,Number(report.packetsReceived||0));}
          if(report.type==='candidate-pair'&&report.state==='succeeded'&&report.nominated)worstRtt=Math.max(worstRtt,Number(report.currentRoundTripTime||0));
        });
        totalInbound+=inbound;if(inbound>peer.lastInboundBytes){peer.lastInboundBytes=inbound;peer.lastMediaProgressAt=Date.now();}
      }catch{}
      const participant=ctx.participants.find((p)=>p.user_id===peer.remoteUserId);if(participant&&(participant.camera_enabled||participant.mic_enabled||participant.screen_enabled))expectedRemote+=1;
    }
    const loss=totalReceived+totalLost?totalLost/(totalReceived+totalLost):0;
    if(failed>0){ctx.health='interrupted';ctx.healthDetail='Une liaison média a échoué';}
    else if(connected<peers.length){ctx.health='reconnecting';ctx.healthDetail=`${connected}/${peers.length} liaisons établies`;}
    else if(expectedRemote>0&&totalInbound===0&&peers.some((p)=>p.connectedAt&&Date.now()-p.connectedAt>6000)){ctx.health='media-waiting';ctx.healthDetail='Transport connecté, média distant en attente';}
    else if(loss>.08||worstRtt>.45){ctx.health='degraded';ctx.healthDetail=`RTT ${Math.round(worstRtt*1000)} ms · pertes ${Math.round(loss*100)}%`;}
    else{ctx.health='connected';ctx.healthDetail=`Direct WebRTC · ${peers.length} liaison${peers.length>1?'s':''} · RTT ${Math.round(worstRtt*1000)} ms`;}
    updateActiveUi(ctx);
  }

  async function replaceRoleTrack(ctx,role,track){
    for(const peer of ctx.peers.values()){
      const tx=peer.transceivers.get(role);if(tx)await tx.sender.replaceTrack(track||null).catch((error)=>console.warn('[4b4c call v3-direct] replaceTrack',role,error));
    }
  }
  async function toggleMic(){if(!active?.micTrack)return;active.micTrack.enabled=!active.micTrack.enabled;await syncMediaState(active);updateActiveUi(active);}
  async function toggleCamera(){if(!active?.cameraTrack)return;active.cameraTrack.enabled=!active.cameraTrack.enabled;await syncMediaState(active);updateActiveUi(active);}
  async function switchCamera(){
    if(!active?.cameraTrack)return;const ctx=active;const nextFacing=ctx.facingMode==='environment'?'user':'environment';
    try{
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:nextFacing},width:{ideal:1280},height:{ideal:720}},audio:false});const next=stream.getVideoTracks()[0];if(!next)return;
      next.enabled=ctx.cameraTrack.enabled;const old=ctx.cameraTrack;ctx.localStream.removeTrack(old);old.stop();ctx.localStream.addTrack(next);ctx.cameraTrack=next;ctx.facingMode=next.getSettings?.().facingMode||nextFacing;ctx.localCameraStream=null;await replaceRoleTrack(ctx,'camera',next);updateActiveUi(ctx);
    }catch(error){showError('Impossible de changer de caméra',error);}
  }
  async function toggleScreen(){
    if(!active)return;const ctx=active;
    if(ctx.screenTrack){const track=ctx.screenTrack;ctx.screenTrack=null;track.onended=null;await replaceRoleTrack(ctx,'screen',null);track.stop();await syncMediaState(ctx);updateActiveUi(ctx);return;}
    if(!navigator.mediaDevices?.getDisplayMedia)return;
    try{
      const stream=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:{ideal:15,max:30}},audio:false});const track=stream.getVideoTracks()[0];if(!track)return;
      ctx.screenTrack=track;track.onended=()=>{if(active===ctx&&ctx.screenTrack?.id===track.id)void toggleScreen();};await replaceRoleTrack(ctx,'screen',track);await syncMediaState(ctx);updateActiveUi(ctx);
    }catch(error){if(error?.name!=='NotAllowedError')showError('Partage d’écran indisponible',error);}
  }

  async function replaceActiveDevice(kind,deviceId){
    if(!active)return;const ctx=active;
    if(kind==='speaker'){ctx.speakerDeviceId=deviceId;for(const media of ctx.remoteMedia.values())if(media.role==='audio')reconcileAudio(ctx,media.userId,media.stream);return;}
    const old=kind==='camera'?ctx.cameraTrack:ctx.micTrack;const enabled=old?.enabled!==false;
    const stream=await navigator.mediaDevices.getUserMedia(kind==='camera'?{video:{deviceId:{exact:deviceId},width:{ideal:1280},height:{ideal:720}},audio:false}:{audio:{deviceId:{exact:deviceId},echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
    const next=kind==='camera'?stream.getVideoTracks()[0]:stream.getAudioTracks()[0];if(!next)return;next.enabled=enabled;
    if(old){ctx.localStream.removeTrack(old);old.stop();}ctx.localStream.addTrack(next);
    if(kind==='camera'){ctx.cameraTrack=next;ctx.facingMode=next.getSettings?.().facingMode||ctx.facingMode;ctx.localCameraStream=null;await replaceRoleTrack(ctx,'camera',next);}else{ctx.micTrack=next;await replaceRoleTrack(ctx,'audio',next);}
    await syncMediaState(ctx);updateActiveUi(ctx);
  }
  async function showDevices(){
    if(!active)return;const devices=await enumerateMediaDevices();const node=root('call-engine-v3-devices');const cam=active.cameraTrack?.getSettings?.().deviceId||'';const mic=active.micTrack?.getSettings?.().deviceId||'';
    node.innerHTML=`<div class="ce3-backdrop"><section class="ce3-dialog"><header><div><h2>Périphériques</h2><p>Caméra, micro et sortie audio disponibles sur ce navigateur.</p></div><button class="ce3-icon" data-ce3-action="devices-close">×</button></header><div class="ce3-device-grid" style="padding-top:18px">${mediaSelect('camera',devices.cameras,cam)}${mediaSelect('mic',devices.mics,mic)}${typeof HTMLMediaElement!=='undefined'&&'setSinkId' in HTMLMediaElement.prototype?mediaSelect('speaker',devices.speakers,active.speakerDeviceId):''}</div><footer><span></span><button class="ce3-btn primary" data-ce3-action="devices-close">Terminé</button></footer></section></div>`;
  }

  async function leaveCall(){
    if(!active)return;const ctx=active;cleanupCall(ctx,{stopTracks:true});active=null;renderActiveVisibility();try{await api.rpc('leave_call_v1',{p_call_id:ctx.call.id});}catch(error){console.warn('[4b4c call v3-direct] leave',error);}
  }
  async function endCall(){
    if(!active)return;const ctx=active;
    if(!ctx.endConfirmUntil||ctx.endConfirmUntil<Date.now()){ctx.endConfirmUntil=Date.now()+5000;updateActiveUi(ctx);setTimeout(()=>{if(active===ctx&&ctx.endConfirmUntil<Date.now())updateActiveUi(ctx);},5200);return;}
    try{await api.rpc('end_call_v1',{p_call_id:ctx.call.id,p_expected_version:ctx.call.version});}catch(error){showError('Impossible de terminer la visio',error);return;}
    cleanupCall(ctx,{stopTracks:true});active=null;renderActiveVisibility();
  }
  function cleanupCall(ctx,{stopTracks=false}={}){
    if(!ctx||ctx.stopped)return;ctx.stopped=true;if(ctx.syncTimer)clearTimeout(ctx.syncTimer);if(ctx.heartbeatTimer)clearInterval(ctx.heartbeatTimer);if(ctx.statsTimer)clearInterval(ctx.statsTimer);
    for(const peer of ctx.peers.values()){if(peer.restartTimer)clearTimeout(peer.restartTimer);try{peer.pc.close();}catch{}}
    for(const media of ctx.remoteMedia.values())media.track?.stop?.();for(const audio of ctx.audioEls.values())audio.remove();if(ctx.screenTrack){ctx.screenTrack.onended=null;ctx.screenTrack.stop();}if(stopTracks)ctx.localStream?.getTracks().forEach((track)=>track.stop());
    removeNode('call-engine-v3-devices');document.documentElement.classList.remove('call-engine-v3-active');
  }
  function renderActiveVisibility(){if(!active)removeNode('call-engine-v3-active');}
  function renderDock(ctx){const node=root('call-engine-v3-active');node.innerHTML=`<aside class="ce3-dock"><span class="ce3-live"></span><div><strong>${esc(titleFor(ctx.call))}</strong><small>${ctx.participants.length||1} participant${(ctx.participants.length||1)>1?'s':''} · ${esc(healthLabel(ctx.health))}</small></div><button class="ce3-btn" data-ce3-action="restore">Ouvrir</button><button class="ce3-btn" data-ce3-action="leave">Quitter</button></aside>`;}
  async function toggleFullscreen(){const shell=document.querySelector('#call-engine-v3-active .ce3-shell');if(!shell)return;try{if(document.fullscreenElement)await document.exitFullscreen();else await shell.requestFullscreen?.();}catch{}}

  async function probeResume(){
    if(active||busy||!api.getSession()?.access_token){scheduleIdleProbe();return;}
    try{
      const user=await getUser();if(!user?.id){scheduleIdleProbe();return;}
      const rows=await api.select('call_participants',`select=call_session_id,last_seen_at&user_id=eq.${user.id}&left_at=is.null&order=last_seen_at.desc&limit=3`).catch(()=>[]);let found=null;
      for(const row of rows||[]){const calls=await api.select('call_sessions',`select=*&id=eq.${row.call_session_id}&ended_at=is.null&status=eq.live&limit=1`).catch(()=>[]);if(calls?.[0]){found=calls[0];break;}}
      resumeCall=found;renderResume();
    }catch(error){console.warn('[4b4c call v3-direct] resume probe',error);}scheduleIdleProbe();
  }
  function scheduleIdleProbe(){if(idleTimer)clearTimeout(idleTimer);idleTimer=setTimeout(()=>void probeResume(),4500);}
  function renderResume(){if(!resumeCall||active){removeNode('call-engine-v3-resume');return;}const node=root('call-engine-v3-resume');node.innerHTML=`<section class="ce3-resume"><span class="ce3-live"></span><div><strong>Visio en cours</strong><small>Votre session 4b4c est toujours active.</small></div><button class="ce3-btn" data-ce3-action="resume-leave" data-call="${escAttr(resumeCall.id)}">Quitter</button><button class="ce3-btn primary" data-ce3-action="resume" data-call="${escAttr(resumeCall.id)}">Reprendre</button></section>`;}
  async function resumeExisting(callId){if(!callId||active||busy)return;busy=true;try{const calls=await api.select('call_sessions',`select=*&id=eq.${callId}&ended_at=is.null&status=eq.live&limit=1`);const call=calls?.[0];if(!call)throw new Error('Cette visio est terminée.');const stream=await acquireLocalMedia({facingMode:'user'});resumeCall=null;renderResume();await connectCall(call,stream,{});}catch(error){showError('Impossible de reprendre la visio',error);}finally{busy=false;}}
  async function leaveResumable(callId){if(!callId)return;try{await api.rpc('leave_call_v1',{p_call_id:callId});}catch{}resumeCall=null;renderResume();}
  function showError(title,error){const node=root('call-engine-v3-error');node.innerHTML=`<div class="ce3-error"><strong>${esc(title)}</strong><div>${esc(error?.message||String(error||'Erreur inconnue'))}</div><button data-ce3-action="error-close">×</button></div>`;setTimeout(()=>node.remove(),10000);}
  async function handleOpenProject(projectId){await openPicker({projectId,title:'Visio du projet'});}async function handleOpenMeeting(meetingId,projectId){await openPicker({projectId,meetingId,title:'Visio de la réunion'});}

  function intercept(event){
    const target=event.target?.closest?.('[data-ce3-action],[data-action],[data-cw-action]');if(!target)return false;
    const action=target.dataset.ce3Action;const legacy=target.dataset.action;const cw=target.dataset.cwAction;
    const owned=new Set(['open-call-picker-v1','open-project-call-v1','open-meeting-call-v1','call-accept-v1','call-decline-v1','call-resume-v1','call-resume-leave-v1']);
    if(!action&&!owned.has(legacy)&&cw!=='call-conversation')return false;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();void handleAction({action,legacy,cw,target});return true;
  }
  async function handleAction({action,legacy,cw,target}){
    try{
      if(legacy==='open-call-picker-v1')return openPicker();if(legacy==='open-project-call-v1')return handleOpenProject(target.dataset.project||null);if(legacy==='open-meeting-call-v1')return handleOpenMeeting(target.dataset.meeting||null,target.dataset.project||null);if(legacy==='call-accept-v1')return acceptIncoming(target.dataset.call||'');if(legacy==='call-decline-v1')return declineIncoming(target.dataset.call||'');if(legacy==='call-resume-v1')return resumeExisting(target.dataset.call||'');if(legacy==='call-resume-leave-v1')return leaveResumable(target.dataset.call||'');
      if(cw==='call-conversation'){
        const match=(location.hash||'').match(/^#\/messages\/([^/?]+)/);const conversationId=match?.[1]||'';if(!conversationId)return openPicker();
        const user=await getUser();const [members,conversations]=await Promise.all([api.select('conversation_members',`select=user_id&conversation_id=eq.${conversationId}`),api.select('conversations',`select=id,project_id,linked_project_id&id=eq.${conversationId}`).catch(()=>[])]);
        const ids=(members||[]).map((member)=>member.user_id).filter((id)=>id!==user?.id);const conversation=conversations?.[0]||null;return openPicker({presetIds:ids,projectId:conversation?.project_id||conversation?.linked_project_id||null,title:'Appeler la conversation'});
      }
      if(action==='picker-close'){picker=null;renderPicker();return;}if(action==='picker-toggle'){const id=target.dataset.user;if(!picker||!id)return;if(picker.selected.has(id))picker.selected.delete(id);else if(picker.selected.size<picker.capacity)picker.selected.add(id);renderPicker();return;}if(action==='picker-confirm')return confirmPicker();
      if(action==='prejoin-cancel')return cancelPrejoin();if(action==='prejoin-mic'){if(prejoin?.micTrack)prejoin.micTrack.enabled=!prejoin.micTrack.enabled;renderPrejoin();return;}if(action==='prejoin-camera'){if(prejoin?.cameraTrack)prejoin.cameraTrack.enabled=!prejoin.cameraTrack.enabled;renderPrejoin();return;}if(action==='prejoin-switch')return switchPrejoinCamera();if(action==='prejoin-start')return startPreparedCall();
      if(action==='mic')return toggleMic();if(action==='camera')return toggleCamera();if(action==='switch-camera')return switchCamera();if(action==='screen')return toggleScreen();if(action==='devices')return showDevices();if(action==='devices-close'){removeNode('call-engine-v3-devices');return;}if(action==='add')return openPicker({mode:'add',projectId:active?.call?.project_id||null,title:'Ajouter des participants'});if(action==='leave')return leaveCall();if(action==='end')return endCall();if(action==='minimize'){if(active){active.minimized=true;renderDock(active);}return;}if(action==='restore'){if(active){active.minimized=false;mountActiveShell(active);}return;}if(action==='fullscreen')return toggleFullscreen();if(action==='resume')return resumeExisting(target.dataset.call||'');if(action==='resume-leave')return leaveResumable(target.dataset.call||'');if(action==='error-close'){removeNode('call-engine-v3-error');return;}
    }catch(error){console.error('[4b4c call v3-direct] action',action||legacy||cw,error);showError('Action visio impossible',error);}
  }
  async function onDeviceChange(event){const select=event.target?.closest?.('[data-ce3-device]');if(!select)return;event.stopPropagation();try{if(prejoin)await replacePrejoinTrack(select.dataset.ce3Device,select.value);else if(active)await replaceActiveDevice(select.dataset.ce3Device,select.value);}catch(error){showError('Périphérique indisponible',error);}}
  function onExternalStart(event){if(active)return;event.stopImmediatePropagation();const ids=Array.isArray(event.detail?.userIds)?event.detail.userIds.filter(Boolean):[];void openPicker({presetIds:ids,projectId:event.detail?.projectId||null,title:'Appeler'});}

  window.addEventListener('click',intercept,true);window.addEventListener('change',onDeviceChange,true);window.addEventListener('2b2c:start-call',onExternalStart);
  window.addEventListener('online',()=>{if(active){active.health='reconnecting';active.healthDetail='Réseau rétabli';void syncCall(active,true);for(const peer of active.peers.values())if(peer.initiator)void makeOffer(active,peer,{iceRestart:true});}});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&active){void heartbeat(active);void syncCall(active,true);void updateHealth(active);}});
  setTimeout(()=>void probeResume(),1200);
  window.__4B4C_CALL_ENGINE_V3__=Object.freeze({version:'3.1.0-direct-preview',transport:'p2p-stun',openPicker,acceptIncoming,declineIncoming,resumeExisting,get state(){return active?'active':prejoin?'prejoin':picker?'picker':'idle';},get peerCount(){return active?.peers?.size||0;}});
}

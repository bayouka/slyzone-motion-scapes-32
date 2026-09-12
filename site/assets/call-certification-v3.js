import { SupabaseBrowserClient } from './supabase-client.js';

if (!window.__4B4C_CALL_CERTIFICATION_V3__) {
  const config = window.__4B4C_CONFIG__ || {};
  const enabled = document.documentElement.dataset.callEngine === 'v3';
  const NativePeerConnection = window.RTCPeerConnection;
  const originalRpc = SupabaseBrowserClient.prototype.rpc;
  const telemetryApi = enabled && config.supabaseUrl && config.supabasePublishableKey
    ? new SupabaseBrowserClient({ url: config.supabaseUrl, publishableKey: config.supabasePublishableKey })
    : null;
  const peers = new Set();
  let activeCallId = null;
  let lastEvent = null;

  const allowedEvents = new Set(['connecting','connected','media_waiting','degraded','reconnecting','interrupted','track_live','track_ended','error']);

  function safeMetrics(metrics = {}) {
    const out = {};
    for (const [key, value] of Object.entries(metrics || {})) {
      if (value === undefined || typeof value === 'function') continue;
      out[key] = value;
    }
    return out;
  }

  async function record(event, role = null, metrics = {}) {
    if (!enabled || !telemetryApi || !activeCallId || !allowedEvents.has(event)) return;
    try {
      await originalRpc.call(telemetryApi, 'record_call_media_telemetry_v3', {
        p_call_id: activeCallId,
        p_event: event,
        p_role: role,
        p_metrics: safeMetrics({ engine: 'v3-direct', certification: '1.0.0', ...metrics }),
      });
      lastEvent = { event, role, at: new Date().toISOString() };
    } catch (error) {
      console.warn('[4b4c call cert v3] telemetry unavailable', error?.message || error);
    }
  }

  function eventForConnectionState(state) {
    if (state === 'connecting' || state === 'new') return 'connecting';
    if (state === 'connected') return 'connected';
    if (state === 'disconnected') return 'reconnecting';
    if (state === 'failed' || state === 'closed') return 'interrupted';
    return null;
  }

  async function samplePeer(pc) {
    if (!enabled || !activeCallId || !pc || pc.connectionState === 'closed') return;
    try {
      const stats = await pc.getStats();
      let inboundBytes = 0;
      let packetsLost = 0;
      let packetsReceived = 0;
      let framesDecoded = 0;
      let currentRtt = 0;
      let candidateType = null;
      stats.forEach((report) => {
        if (report.type === 'inbound-rtp' && !report.isRemote) {
          inboundBytes += Number(report.bytesReceived || 0);
          packetsLost += Math.max(0, Number(report.packetsLost || 0));
          packetsReceived += Math.max(0, Number(report.packetsReceived || 0));
          framesDecoded += Math.max(0, Number(report.framesDecoded || 0));
        }
        if (report.type === 'candidate-pair' && report.state === 'succeeded' && report.nominated) {
          currentRtt = Math.max(currentRtt, Number(report.currentRoundTripTime || 0));
          const remote = report.remoteCandidateId ? stats.get(report.remoteCandidateId) : null;
          candidateType = remote?.candidateType || candidateType;
        }
      });
      const denominator = packetsReceived + packetsLost;
      const loss = denominator > 0 ? packetsLost / denominator : 0;
      const metrics = {
        connection_state: pc.connectionState,
        ice_state: pc.iceConnectionState,
        signaling_state: pc.signalingState,
        inbound_bytes: inboundBytes,
        packets_received: packetsReceived,
        packets_lost: packetsLost,
        frames_decoded: framesDecoded,
        rtt_ms: Math.round(currentRtt * 1000),
        loss_percent: Math.round(loss * 1000) / 10,
        remote_candidate_type: candidateType,
        transceiver_count: pc.getTransceivers().length,
      };
      if (pc.connectionState === 'connected' && (loss > 0.08 || currentRtt > 0.45)) {
        await record('degraded', null, metrics);
      }
    } catch (error) {
      await record('error', null, { stage: 'getStats', message: String(error?.message || error).slice(0, 500) });
    }
  }

  if (enabled && NativePeerConnection) {
    class CertifiedPeerConnection extends NativePeerConnection {
      constructor(configuration) {
        super(configuration);
        peers.add(this);
        const reportState = () => {
          const event = eventForConnectionState(this.connectionState);
          if (event) void record(event, null, {
            connection_state: this.connectionState,
            ice_state: this.iceConnectionState,
            signaling_state: this.signalingState,
            transceiver_count: this.getTransceivers().length,
          });
        };
        this.addEventListener('connectionstatechange', reportState);
        this.addEventListener('iceconnectionstatechange', () => {
          if (this.iceConnectionState === 'checking') void record('connecting', null, { ice_state: 'checking' });
          if (this.iceConnectionState === 'disconnected') void record('reconnecting', null, { ice_state: 'disconnected' });
          if (this.iceConnectionState === 'failed') void record('interrupted', null, { ice_state: 'failed' });
        });
        this.addEventListener('track', (event) => {
          const track = event.track;
          const metrics = { kind: track?.kind || null, mid: event.transceiver?.mid ?? null, track_id: track?.id || null };
          void record('track_live', null, metrics);
          if (track) track.addEventListener('ended', () => void record('track_ended', null, metrics), { once: true });
        });
      }
    }
    if (typeof NativePeerConnection.generateCertificate === 'function') {
      CertifiedPeerConnection.generateCertificate = NativePeerConnection.generateCertificate.bind(NativePeerConnection);
    }
    window.RTCPeerConnection = CertifiedPeerConnection;
  }

  SupabaseBrowserClient.prototype.rpc = async function certifiedCallRpc(name, args = {}) {
    const result = await originalRpc.call(this, name, args);
    if (enabled && args?.p_call_id && name !== 'record_call_media_telemetry_v3') {
      activeCallId = args.p_call_id;
    }
    if (enabled && name === 'join_call_v1' && args?.p_call_id) {
      activeCallId = args.p_call_id;
      void record('connecting', null, { stage: 'join_call_v1' });
    }
    if (enabled && (name === 'leave_call_v1' || name === 'end_call_v1') && args?.p_call_id === activeCallId) {
      setTimeout(() => { if (activeCallId === args.p_call_id) activeCallId = null; }, 1000);
    }
    return result;
  };

  const sampleTimer = enabled ? setInterval(() => {
    for (const pc of peers) {
      if (pc.connectionState === 'closed') peers.delete(pc);
      else void samplePeer(pc);
    }
  }, 5000) : null;

  window.addEventListener('pagehide', () => {
    if (sampleTimer) clearInterval(sampleTimer);
  }, { once: true });

  window.__4B4C_CALL_CERTIFICATION_V3__ = Object.freeze({
    version: '1.0.0',
    enabled,
    telemetry: 'call_media_telemetry_v3',
    get activeCallId() { return activeCallId; },
    get peerCount() { return peers.size; },
    get lastEvent() { return lastEvent; },
  });
}

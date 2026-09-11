const SUPABASE_URL = 'https://wexfzhegiewhldkugtow.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_2XSXM2rNYsPQqJ0TzsOSgg_YDkNZwcM';
const REALTIME_ORIGIN = 'https://rtc.live.cloudflare.com/v1';
const MAX_BODY_BYTES = 512 * 1024;
const MAX_TRACKS_PER_REQUEST = 18;

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
};

function json(status, payload) {
  return new Response(JSON.stringify(payload), { status, headers: JSON_HEADERS });
}

function cleanId(value, max = 256) {
  if (typeof value !== 'string') return '';
  const result = value.trim();
  if (!result || result.length > max) return '';
  return result;
}

function cleanSdp(value) {
  if (!value || typeof value !== 'object') return null;
  const type = value.type === 'offer' || value.type === 'answer' ? value.type : '';
  const sdp = typeof value.sdp === 'string' ? value.sdp : '';
  if (!type || !sdp || sdp.length > 450_000) return null;
  return { type, sdp };
}

async function readBody(request) {
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw new Error('BODY_TOO_LARGE');
  if (!text) return {};
  try { return JSON.parse(text); } catch { throw new Error('INVALID_JSON'); }
}

function authHeaders(request) {
  const authorization = request.headers.get('authorization') || '';
  if (!authorization.toLowerCase().startsWith('bearer ')) return null;
  return {
    authorization,
    apikey: SUPABASE_PUBLISHABLE_KEY,
    'content-type': 'application/json',
  };
}

async function supabaseRpc(request, name, body) {
  const headers = authHeaders(request);
  if (!headers) return { ok: false, status: 401, error: 'AUTH_REQUIRED' };
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  let payload = null;
  try { payload = await response.json(); } catch { payload = null; }
  if (!response.ok) {
    return { ok: false, status: response.status === 401 ? 401 : 403, error: payload?.message || 'CALL_ACCESS_DENIED' };
  }
  return { ok: true, payload };
}

async function actorFromToken(request) {
  const headers = authHeaders(request);
  if (!headers) return { ok: false, status: 401, error: 'AUTH_REQUIRED' };
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers });
  let payload = null;
  try { payload = await response.json(); } catch { payload = null; }
  if (!response.ok || !payload?.id) return { ok: false, status: 401, error: 'AUTH_REQUIRED' };
  return { ok: true, actorId: payload.id };
}

async function authorizeCall(request, callId) {
  if (!callId) return { ok: false, status: 400, error: 'CALL_ID_REQUIRED' };
  const [actor, sync] = await Promise.all([
    actorFromToken(request),
    supabaseRpc(request, 'get_call_sync_v2', { p_call_id: callId, p_after_signal_id: 0 }),
  ]);
  if (!actor.ok) return actor;
  if (!sync.ok) return sync;
  const call = sync.payload?.call;
  const participants = Array.isArray(sync.payload?.participants) ? sync.payload.participants : [];
  const participant = participants.find((row) => row?.user_id === actor.actorId && !row?.left_at);
  if (!call || !participant) return { ok: false, status: 403, error: 'CALL_PARTICIPANT_REQUIRED' };
  if (call.status !== 'active') return { ok: false, status: 409, error: 'CALL_NOT_ACTIVE' };
  return { ok: true, actorId: actor.actorId, call, participant, participants };
}

function realtimeConfig(env) {
  const appId = cleanId(env.CF_REALTIME_APP_ID, 128);
  const secret = cleanId(env.CF_REALTIME_APP_SECRET, 512);
  return appId && secret ? { appId, secret } : null;
}

async function realtimeFetch(env, path, method = 'POST', body) {
  const config = realtimeConfig(env);
  if (!config) return { ok: false, status: 503, error: 'SFU_NOT_CONFIGURED' };
  const response = await fetch(`${REALTIME_ORIGIN}/apps/${encodeURIComponent(config.appId)}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${config.secret}`,
      'content-type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let payload = null;
  try { payload = await response.json(); } catch { payload = null; }
  if (!response.ok || payload?.errorCode) {
    return {
      ok: false,
      status: 502,
      error: 'SFU_UPSTREAM_ERROR',
      upstreamStatus: response.status,
      upstreamCode: payload?.errorCode || null,
      upstreamDescription: typeof payload?.errorDescription === 'string' ? payload.errorDescription.slice(0, 300) : null,
    };
  }
  return { ok: true, payload };
}

function ownProviderSession(authz, providerSessionId) {
  return !!providerSessionId && authz.participant?.provider_session_id === providerSessionId;
}

function normalizeLocalTracks(tracks) {
  if (!Array.isArray(tracks) || tracks.length < 1 || tracks.length > MAX_TRACKS_PER_REQUEST) return null;
  const normalized = [];
  for (const track of tracks) {
    const trackName = cleanId(track?.trackName, 256);
    const mid = cleanId(String(track?.mid ?? ''), 64);
    if (!trackName || !mid) return null;
    normalized.push({ location: 'local', mid, trackName });
  }
  return normalized;
}

async function normalizeRemoteTracks(request, callId, tracks) {
  if (!Array.isArray(tracks) || tracks.length < 1 || tracks.length > MAX_TRACKS_PER_REQUEST) return null;
  const catalogResult = await supabaseRpc(request, 'get_call_media_catalog_v3', { p_call_id: callId });
  if (!catalogResult.ok) return null;
  const catalog = Array.isArray(catalogResult.payload) ? catalogResult.payload : [];
  const allowed = new Set(catalog.map((row) => `${row.provider_session_id}\n${row.provider_track_id}`));
  const normalized = [];
  for (const track of tracks) {
    const sessionId = cleanId(track?.sessionId, 256);
    const trackName = cleanId(track?.trackName, 256);
    if (!sessionId || !trackName || !allowed.has(`${sessionId}\n${trackName}`)) return null;
    normalized.push({ location: 'remote', sessionId, trackName });
  }
  return normalized;
}

async function createSession(request, env, body) {
  const callId = cleanId(body.callId, 64);
  const authz = await authorizeCall(request, callId);
  if (!authz.ok) return json(authz.status, { ok: false, error: authz.error });
  const result = await realtimeFetch(env, '/sessions/new', 'POST');
  if (!result.ok) return json(result.status, result);
  return json(200, { ok: true, sessionId: result.payload?.sessionId || null, sessionDescription: result.payload?.sessionDescription || null });
}

async function publishTracks(request, env, body) {
  const callId = cleanId(body.callId, 64);
  const providerSessionId = cleanId(body.providerSessionId, 256);
  const authz = await authorizeCall(request, callId);
  if (!authz.ok) return json(authz.status, { ok: false, error: authz.error });
  if (!ownProviderSession(authz, providerSessionId)) return json(403, { ok: false, error: 'PROVIDER_SESSION_MISMATCH' });
  const sessionDescription = cleanSdp(body.sessionDescription);
  const tracks = normalizeLocalTracks(body.tracks);
  if (!sessionDescription || sessionDescription.type !== 'offer' || !tracks) return json(400, { ok: false, error: 'INVALID_PUBLISH_REQUEST' });
  const result = await realtimeFetch(env, `/sessions/${encodeURIComponent(providerSessionId)}/tracks/new`, 'POST', { sessionDescription, tracks });
  if (!result.ok) return json(result.status, result);
  return json(200, { ok: true, ...result.payload });
}

async function subscribeTracks(request, env, body) {
  const callId = cleanId(body.callId, 64);
  const providerSessionId = cleanId(body.providerSessionId, 256);
  const authz = await authorizeCall(request, callId);
  if (!authz.ok) return json(authz.status, { ok: false, error: authz.error });
  if (!ownProviderSession(authz, providerSessionId)) return json(403, { ok: false, error: 'PROVIDER_SESSION_MISMATCH' });
  const tracks = await normalizeRemoteTracks(request, callId, body.tracks);
  if (!tracks) return json(400, { ok: false, error: 'INVALID_SUBSCRIBE_REQUEST' });
  const result = await realtimeFetch(env, `/sessions/${encodeURIComponent(providerSessionId)}/tracks/new`, 'POST', { tracks });
  if (!result.ok) return json(result.status, result);
  return json(200, { ok: true, ...result.payload });
}

async function renegotiate(request, env, body) {
  const callId = cleanId(body.callId, 64);
  const providerSessionId = cleanId(body.providerSessionId, 256);
  const authz = await authorizeCall(request, callId);
  if (!authz.ok) return json(authz.status, { ok: false, error: authz.error });
  if (!ownProviderSession(authz, providerSessionId)) return json(403, { ok: false, error: 'PROVIDER_SESSION_MISMATCH' });
  const sessionDescription = cleanSdp(body.sessionDescription);
  if (!sessionDescription || sessionDescription.type !== 'answer') return json(400, { ok: false, error: 'INVALID_RENEGOTIATION' });
  const result = await realtimeFetch(env, `/sessions/${encodeURIComponent(providerSessionId)}/renegotiate`, 'PUT', { sessionDescription });
  if (!result.ok) return json(result.status, result);
  return json(200, { ok: true, ...result.payload });
}

async function closeTracks(request, env, body) {
  const callId = cleanId(body.callId, 64);
  const providerSessionId = cleanId(body.providerSessionId, 256);
  const authz = await authorizeCall(request, callId);
  if (!authz.ok) return json(authz.status, { ok: false, error: authz.error });
  if (!ownProviderSession(authz, providerSessionId)) return json(403, { ok: false, error: 'PROVIDER_SESSION_MISMATCH' });
  if (!Array.isArray(body.tracks) || body.tracks.length < 1 || body.tracks.length > MAX_TRACKS_PER_REQUEST) {
    return json(400, { ok: false, error: 'INVALID_CLOSE_REQUEST' });
  }
  const tracks = body.tracks.map((track) => ({
    mid: cleanId(String(track?.mid ?? ''), 64),
  }));
  if (tracks.some((track) => !track.mid)) return json(400, { ok: false, error: 'INVALID_CLOSE_REQUEST' });
  const payload = { tracks, force: body.force === true };
  const sessionDescription = cleanSdp(body.sessionDescription);
  if (sessionDescription) payload.sessionDescription = sessionDescription;
  const result = await realtimeFetch(env, `/sessions/${encodeURIComponent(providerSessionId)}/tracks/close`, 'PUT', payload);
  if (!result.ok) return json(result.status, result);
  return json(200, { ok: true, ...result.payload });
}

async function sessionInfo(request, env, url) {
  const callId = cleanId(url.searchParams.get('callId'), 64);
  const prefix = '/api/call-v3/session/';
  const providerSessionId = cleanId(decodeURIComponent(url.pathname.slice(prefix.length)), 256);
  const authz = await authorizeCall(request, callId);
  if (!authz.ok) return json(authz.status, { ok: false, error: authz.error });
  if (!ownProviderSession(authz, providerSessionId)) return json(403, { ok: false, error: 'PROVIDER_SESSION_MISMATCH' });
  const result = await realtimeFetch(env, `/sessions/${encodeURIComponent(providerSessionId)}`, 'GET');
  if (!result.ok) return json(result.status, result);
  return json(200, { ok: true, session: result.payload });
}

export async function handleCallSfuV3(request, env, url = new URL(request.url)) {
  if (!url.pathname.startsWith('/api/call-v3/')) return null;
  try {
    if (request.method === 'POST' && url.pathname === '/api/call-v3/session') {
      return createSession(request, env, await readBody(request));
    }
    if (request.method === 'POST' && url.pathname === '/api/call-v3/tracks/publish') {
      return publishTracks(request, env, await readBody(request));
    }
    if (request.method === 'POST' && url.pathname === '/api/call-v3/tracks/subscribe') {
      return subscribeTracks(request, env, await readBody(request));
    }
    if (request.method === 'PUT' && url.pathname === '/api/call-v3/renegotiate') {
      return renegotiate(request, env, await readBody(request));
    }
    if (request.method === 'PUT' && url.pathname === '/api/call-v3/tracks/close') {
      return closeTracks(request, env, await readBody(request));
    }
    if (request.method === 'GET' && url.pathname.startsWith('/api/call-v3/session/')) {
      return sessionInfo(request, env, url);
    }
    return json(404, { ok: false, error: 'CALL_V3_ROUTE_NOT_FOUND' });
  } catch (error) {
    const code = error?.message === 'BODY_TOO_LARGE' ? 413 : 400;
    const safe = ['BODY_TOO_LARGE','INVALID_JSON'].includes(error?.message) ? error.message : 'CALL_V3_BAD_REQUEST';
    return json(code, { ok: false, error: safe });
  }
}

const SECURITY_HEADERS = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-frame-options': 'DENY',
  'permissions-policy': 'camera=(self), microphone=(self), display-capture=(self), fullscreen=(self), picture-in-picture=(self)',
};

function withHeaders(response, extra = {}) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) headers.set(key, value);
  for (const [key, value] of Object.entries(extra)) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return withHeaders(new Response('Method Not Allowed', { status: 405 }), { allow: 'GET, HEAD' });
    }

    if (url.pathname === '/health') {
      return withHeaders(
        Response.json({
          ok: true,
          app: '4b4c',
          backend: 'supabase',
          version: 'v4.5.12-v6-polish-p2',
          ui_shell: {
            code: 'mobile-v8.1',
            dashboard_stability: '1.1.0',
            dashboard_presence: '2.1.0',
            presence_heartbeat: '1.0.0',
            brand_asset: 'brand-symbol.svg',
          },
          call_engine: '2.0.0',
          call_engine_v3: {
            code: '3.1.4-direct-pilot',
            transport: 'p2p-stun',
            signal_isolation: '1.1.0',
            certification: '1.0.0',
            mobile_call_ui: '8.1.0',
            media_bridge: '1.0.0',
            stable_mobile_stage: true,
            pilot_default: true,
            global_default: false,
            configured: true,
            external_account_required: false,
            billing_required: false,
          },
        }),
        { 'cache-control': 'no-store' },
      );
    }

    const isRoot = url.pathname === '/';
    const assetPath = isRoot ? '/index.html' : url.pathname;
    const assetRequest = new Request(new URL(assetPath, url.origin), request);
    let response = await env.ASSETS.fetch(assetRequest);

    const isNavigation = request.headers.get('sec-fetch-mode') === 'navigate';
    if (response.status === 404 && isNavigation) {
      response = await env.ASSETS.fetch(new Request(new URL('/index.html', url.origin), request));
    }

    const servesHtml = isRoot || isNavigation || assetPath === '/index.html';
    return withHeaders(response, servesHtml ? { 'cache-control': 'no-store' } : {});
  },
};
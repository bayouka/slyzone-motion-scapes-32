# 2b2c — Call Engine V3 implementation gate

Date: 2026-09-12
Status: IN PROGRESS — feature flag only, V2 remains default

## Goal
Replace the fragile client-to-client P2P media mesh with Cloudflare Realtime SFU while preserving the existing 2b2c call lifecycle, permissions and invitations in Supabase.

## Source of truth
- Supabase: call identity, authorization, invites, participants and published-track registry.
- 4b4c Worker: authenticated proxy to Cloudflare Realtime; Cloudflare App Secret never reaches the browser.
- Cloudflare Realtime SFU: one WebRTC session / PeerConnection per browser, publish once, subscribe by track locator.
- Call Engine V3: device capture, SFU negotiation, media health, stable rendering and user controls.

## Feature flag
V3 must not replace V2 until certification. Internal activation only:
- URL query `callv3=1`, or
- localStorage key `2b2c.call.engine.v3=1`.

When V3 is disabled, the existing V2 owner remains untouched.

## Backend API contract
All `/api/call-v3/*` endpoints require the user's Supabase bearer token and a `callId`. The Worker re-authorizes call access against Supabase before forwarding any request to Cloudflare Realtime.

Routes:
- `POST /api/call-v3/session` → create SFU session.
- `POST /api/call-v3/tracks/publish` → publish local audio/camera/screen from client SDP offer.
- `POST /api/call-v3/tracks/subscribe` → pull remote track locators, returning SFU offer when renegotiation is needed.
- `PUT /api/call-v3/renegotiate` → forward client SDP answer.
- `PUT /api/call-v3/tracks/close` → close local/remote SFU tracks.
- `GET /api/call-v3/session/:providerSessionId?callId=...` → diagnostic session state.

The Worker requires runtime secrets/bindings:
- `CF_REALTIME_APP_ID`
- `CF_REALTIME_APP_SECRET`

No secret is committed to GitHub or exposed to the client.

## Track identity
Every published track has an explicit role:
- `audio`
- `camera`
- `screen`

Supabase registry key = `(call_session_id, user_id, role)`.
The registry stores provider session/track IDs and lifecycle state, not SDP or media content.

## Media rules
- one PeerConnection per browser to Cloudflare Realtime;
- camera and screen are distinct tracks;
- starting screen share never replaces camera sender;
- remote media is mapped from provider `mid` to explicit registry role;
- `<video>` elements are keyed by `userId + role` and remain mounted while the track is unchanged;
- no global monkey patch of `HTMLMediaElement.srcObject`;
- V3 does not write client-to-client SDP/ICE into `call_signals`.

## Health rules
`Connected` is not allowed from `connectionState` alone.
Expected remote media is healthy only after RTP bytes/frames advance. States:
- connecting
- media-waiting
- connected
- degraded
- reconnecting
- interrupted

Collect only technical telemetry: state transitions, RTT, jitter, loss, bitrate, frames sent/decoded/dropped, role and error code. Never store media content or complete SDP.

## Certification gate
V3 cannot become default until real PASS of:
- Firefox desktop ↔ Chrome/Edge desktop;
- desktop ↔ Android Chrome;
- desktop ↔ iOS Safari when available;
- Wi-Fi ↔ mobile data;
- bidirectional mic/camera;
- camera off/on and device switching;
- screen visible remotely while camera remains published;
- stop/restart share without restarting call;
- 3 participants, add during call, leave/rejoin;
- short network loss + reconnect;
- stable full-screen and mobile rendering;
- no duplicated transceivers / no client-client SDP;
- media-health diagnostics distinguish transport-connected from media-receiving.

## Deployment rule
V3 may be shipped to production only behind the internal flag before certification. V2 remains the public default and rollback path. No GitHub Actions are used.

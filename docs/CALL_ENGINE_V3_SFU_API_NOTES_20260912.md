# Call Engine V3 — Cloudflare Realtime SFU API notes

Verified against Cloudflare Realtime documentation on 2026-09-12.

- SFU session ↔ one browser PeerConnection.
- Backend owns App ID/App Secret and authorizes publish/subscribe.
- `POST /apps/{appId}/sessions/new` creates a provider session.
- `POST /apps/{appId}/sessions/{sessionId}/tracks/new` publishes local tracks when sent with the client's SDP offer, or pulls remote tracks when sent with `location: remote` locators.
- Pulling tracks can return `requiresImmediateRenegotiation=true`; client sets the SFU offer as remote description, creates an answer, then backend forwards it with `PUT .../renegotiate`.
- `PUT .../tracks/update` reuses existing transceivers for track changes.
- `PUT .../tracks/close` closes tracks.
- Cloudflare STUN: `stun:stun.cloudflare.com:3478`.

Security: browser never receives Cloudflare Realtime App Secret. All SFU API calls go through authenticated 4b4c Worker endpoints.

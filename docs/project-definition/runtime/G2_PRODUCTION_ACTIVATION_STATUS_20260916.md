# 4b4c / 2b2c — G2 production activation status — 2026-09-16

Status: **BACKEND ACTIVE / BUILD 552 RUNTIME-CERTIFIED / CALC+RAW ACTIVE / SRC V0.2 + AI_H V0.1 CANDIDATES INACTIVE**

## Production runtime

Certified production runtime: `v4.5.13-workspace-evidence-g2-p6`.
Transport build: **552**.
Adapter health contract: **0.3.4**.
Executor tool: **evidence-adapter-0.3.1**.

Independent production checks on 2026-09-16 confirmed:
- `/health` HTTP 200 ;
- runtime `v4.5.13-workspace-evidence-g2-p6` ;
- Cloudflare version id `aa0e44e4-7185-4e06-b09f-29a6845e9c24` ;
- adapter `0.3.4`, configured, browser service-role exposure false ;
- commands `blueprint_fit.assess`, `foundation.advance`, `evidence.advance` ;
- Blueprint `SITE_VITRINE@0.5` ;
- G2 backend `v0.7`, promotion disposition `v0.8` ;
- active executor paths exactly `['CALC','RAW']` ;
- product surface `g2_user_surface='evidence-market'` ;
- `g2_ai_h_candidate='v0.1'`, `g2_ai_h_active=false` ;
- `g2_src_candidate='v0.2'`, `g2_src_active=false` ;
- `g2_src_snapshot_backend='v0.2'` ;
- SRC candidate target `SV.D03.PRIMARY_NEED` and candidate resolution `SOURCE_BACKED` ;
- root shell contains `ideas-workspace-g2-live.js?v=1.1.0` and `boot.js?build=552` ;
- unauthenticated `evidence.advance` returns HTTP 401 / `UNAUTHORIZED`.

This certifies the Worker, health contract, shell marker and unauthenticated API boundary. It does **not** replace authenticated fresh-Idea E2E proof.

## Backend state

Production Supabase includes:
- `20260915100519_activate_g2_backend_v07_blueprint_05` ;
- `20260915124420_g2_promotion_disposition_v08` ;
- `20260915164534_g2_src_snapshot_infrastructure_v02`.

The SRC migration installs dormant service-role-only infrastructure:
- immutable versioned source snapshots ;
- exact `source_id + source_version + content_hash` coherence ;
- SHA-256 body integrity ;
- bounded snapshot-body access ;
- exact SRC Action Run snapshot pinning ;
- dedicated SRC promotion guard ;
- privilege boundary excluding `anon` and `authenticated` from arbitrary snapshot bodies.

It deliberately does **not** alter the active planner predicate and does **not** expose SRC through the production endpoint.

## Build 552 purpose

Build 552 certifies that the production runtime can carry the dormant SRC implementation candidate without widening user-visible capabilities.

The transport release gate validates:
- active CALC+RAW boundary remains unchanged ;
- AI_H remains candidate-only ;
- SRC remains candidate-only ;
- canonical/transport byte alignment for the effective G2/SRC files ;
- SRC deterministic harness ;
- URL-policy, redirect, DNS/public-address, size and timeout guards ;
- ingestion separated from extraction ;
- pinned snapshot extraction and dedicated SRC promotion ;
- fake/absent support quote ends in `NO_RESOLUTION` ;
- shell remains on the existing Evidence/Market surface.

## SRC V0.2 candidate scope

SRC V0.2 is intentionally narrow:
- source kind: URL only ;
- target: `SV.D03.PRIMARY_NEED` only ;
- success provenance: `SOURCE_EXTRACTED` ;
- success resolution: `SOURCE_BACKED` only ;
- confidence: `DIRECT` only ;
- source/snapshot sensitivity: `public` or `internal` only ;
- maximum 3 pinned snapshots per Action Run ;
- model acts as a strict extractor from persisted snapshot text, never as an external knowledge source.

The runtime candidate additionally requires a short verbatim support quote that is actually present in the selected pinned snapshot.

## URL fetch hardening status

The dormant URL acquisition candidate currently enforces:
- HTTPS only ;
- no URL credentials ;
- port 443 only ;
- localhost/private/special IPv4 and IPv6 literals rejected ;
- DNS A/AAAA results checked for public addresses ;
- manual redirects with full revalidation ;
- maximum 3 redirects ;
- 10 s fetch timeout ;
- 5 s DNS lookup timeout ;
- 1 MiB response-body bound ;
- 256 KiB canonical-text bound ;
- HTML script/style/template/noscript/svg removal before canonical text hashing.

Important activation note: DNS preflight and origin `fetch()` are separate network operations. Before SRC activation, public-only egress must be enforced at the Cloudflare runtime boundary as well, preferably with a dedicated source-fetch Worker configured for strictly-public global fetch semantics rather than changing the main application Worker globally. This closes DNS-rebinding/private-origin ambiguity without risking unrelated production subrequests.

## Capability authority

The production endpoint and `/health` are authoritative.

Active:
- `CALC` ;
- `RAW` when Workers AI is bound.

Not active:
- `AI_H` V0.1 ;
- `SRC` V0.2 ;
- `AI_R` ;
- `WEB` ;
- `AUDIT` ;
- `CONN` ;
- `MEM`.

Dormant code, migrations or test harnesses do not constitute production capability.

## Remaining activation gates

Before enabling SRC:
1. enforce strictly-public outbound fetch at runtime without changing unrelated application egress semantics ;
2. complete the dedicated source-fetch Worker/service boundary and its deployment tests ;
3. run true concurrent source-refresh vs Action Run stale-race proof ;
4. keep planner `SRC` eligibility snapshot-backed only ;
5. wire ingestion/re-plan/SRC execution behind explicit endpoint capability gating ;
6. keep dedicated SRC promotion mandatory for normal and recovery promotion ;
7. run authenticated fresh-Idea flow: URL registration → ingestion → snapshot → re-plan → pinned extraction → promotion → projection lineage ;
8. verify mobile/desktop Evidence & Market UX for loading, blocked, stale, failed-fetch, no-resolution and successful source-backed states ;
9. only then advertise `/health.g2_executor_paths=['CALC','RAW','SRC']`.

Until those gates pass, Build 552 remains **CALC + RAW only**.

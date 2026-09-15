# 4b4c / 2b2c — G2 Source Fetch Service Contract V0.1

Date: 2026-09-16

Status: **IMPLEMENTATION CANDIDATE / INTERNAL SERVICE — SRC STILL INACTIVE**

## 1. Purpose

Isolate URL acquisition for future G2 `SRC` evidence from the main 4b4c Worker so public-network routing guarantees can be tightened without changing unrelated production fetch semantics.

This contract does **not** activate SRC. The production Evidence/Market executor boundary remains `CALC + RAW` until the authenticated activation gates pass.

## 2. Components

Canonical files:
- `src/source-fetch-service-candidate.js` — input/result contract around the existing bounded URL fetcher ;
- `src/source-fetch-worker-candidate.js` — Cloudflare `WorkerEntrypoint` RPC boundary ;
- `wrangler.source-fetch.jsonc` — isolated Worker deployment configuration ;
- `scripts/test_g2_source_fetch_service_v0_1.mjs` — deterministic contract/red-team checks ;
- `src/idea-source-fetch-candidate.js` — HTTPS/DNS/redirect/body/canonical-text implementation used by the service.

Service name: `4b4c-source-fetch`.
Main-Worker binding name: `SOURCE_FETCH`.
RPC method: `fetchEvidenceSource(locator)`.
Health RPC method: `serviceHealth()`.

## 3. Network isolation

The source-fetch Worker configuration MUST:
- set `workers_dev=false` ;
- set `preview_urls=false` ;
- expose no route/custom domain ;
- enable `global_fetch_strictly_public` ;
- contain no Supabase service-role secret, publishable key, Tavily key or unrelated application credential.

The main `4b4c` Worker MUST NOT inherit `global_fetch_strictly_public` merely to support source acquisition. Its existing fetch semantics remain unchanged.

The source-fetch Worker is called through a Cloudflare Service Binding. The service binding is an internal transport boundary; it is not user authentication and must never replace the main endpoint's authenticated `can_write` check.

## 4. Request contract

`fetchEvidenceSource(locator)` accepts exactly one URL locator string.

Preconditions:
- value is a string ;
- trim result is non-empty ;
- maximum locator length is 4096 characters.

URL/network/content policy is delegated to `fetchCanonicalPublicSource` and remains mandatory:
- HTTPS only ;
- credentials forbidden ;
- non-443 explicit ports forbidden ;
- local/private/special literals rejected ;
- DNS A/AAAA answers must be public ;
- every redirect is manually revalidated ;
- bounded redirects, DNS timeout, request timeout and response body ;
- bounded canonical extracted text ;
- supported textual content types only ;
- SHA-256 over exact canonical extracted text.

## 5. Result contract

A successful RPC returns a plain structured object containing only:
- contract id `g2-source-fetch-service-v0.1` ;
- final URL ;
- content type ;
- canonical extracted text ;
- SHA-256 content hash ;
- fetched timestamp ;
- redirect count.

No source is persisted and no evidence is promoted by this Worker. Persistence remains the responsibility of the main server-side ingestion orchestration through `commit_idea_source_snapshot_candidate_v2`.

Fetching and evidence extraction therefore remain separate operations.

## 6. Public surface

The Worker `fetch(Request)` handler returns HTTP 404. This is defense in depth only; the deployment configuration must also keep `workers.dev` and preview URLs disabled.

No browser code may receive a binding to this Worker.

## 7. Main Worker integration

A dormant `SOURCE_FETCH` Service Binding may be configured before SRC activation to prove deployment/reachability.

The main `/health` surface may report:
- binding configured ;
- service reachable ;
- service contract version ;
- `public_network_only=true` ;
- `browser_access=false` ;
- `active=false`.

Health reachability is **not** permission to execute SRC from user traffic. `idea-evidence-endpoint.js` remains the capability authority and MUST NOT pass `G2_SRC` until activation.

## 8. Failure model

The service fails closed on:
- invalid/oversized locator ;
- private/local URL or DNS result ;
- redirect policy violation ;
- timeout ;
- unsupported content type ;
- oversized body/text ;
- invalid fetch result/hash.

Error details returned across the RPC boundary must remain bounded and must not expose credentials or internal application state.

## 9. Activation gates

Before SRC can become active:
1. dedicated Worker deployment and internal RPC health must be proven in production ;
2. no public route/preview exposure must remain configured ;
3. main Worker must retain its existing global-fetch semantics ;
4. true source-refresh vs Action Run stale-race behavior must be proven ;
5. planner SRC eligibility must require current immutable snapshots, not merely registered locators ;
6. endpoint must invoke source ingestion only after authenticated Idea write authority ;
7. ingestion must persist exact snapshots before re-planning ;
8. extraction must use exact pinned snapshots ;
9. normal and recovery promotions must use the dedicated SRC promotion guard ;
10. authenticated fresh-Idea production E2E must prove registration → fetch → snapshot → re-plan → extraction → promotion → projection lineage ;
11. only then may `/health.g2_executor_paths` include `SRC`.

Until all gates pass, the service may be deployed and reachable internally while `g2_source_fetch_service_active=false` and `g2_src_active=false`.

# 4b4c / 2b2c — G2 production activation status — 2026-09-15

Status: **BUILD 551 RUNTIME-CERTIFIED / CALC+RAW ACTIVE / AI_H INACTIVE / SRC V0.2 BACKEND DORMANT**

## Production runtime

Current production runtime remains:

- runtime `v4.5.13-workspace-evidence-g2-p5` ;
- transport build **551** ;
- adapter `0.3.3` ;
- executor tool `evidence-adapter-0.3.1` ;
- Blueprint `SITE_VITRINE@0.5` ;
- G2 backend `v0.7` ;
- promotion disposition `v0.8` ;
- active executor paths exactly `['CALC','RAW']` ;
- product surface `evidence-market` ;
- `g2_ai_h_candidate='v0.1'`, `g2_ai_h_active=false` ;
- service-role secret not exposed to browser ;
- unauthenticated `evidence.advance` remains `401 UNAUTHORIZED`.

Latest independent `/health` observation after installation of the dormant SRC backend infrastructure still reported Build 551 and exactly `CALC + RAW`, proving that the backend preparation did not silently widen the Worker capability surface.

## Active G2 semantics

`CALC` remains deterministic only.

`RAW` remains the only active AI-assisted G2 path. It is a strict parser of persisted human RAW text:

- supported targets: `SV.D03.PRIMARY_NEED`, `SV.D04.EXISTING_SITE` ;
- provenance: `SOURCE_EXTRACTED` ;
- resolution: `RAW_HUMAN + ACCEPTED_AS_CURRENT` ;
- accepted finding requires a support quote actually present in persisted RAW ;
- inference or unsupported text ends in explicit `NO_RESOLUTION`.

## AI_H V0.1 — implementation candidate, not active

`G2_AI_H_EXECUTOR_CONTRACT_V0_1.md` remains authoritative.

The implementation candidate is limited to `SV.D03.PRIMARY_NEED` and can only produce `AI_INFERRED / WORKING_ASSUMPTION`. It requires current audience plus material supporting context, excludes personal/sensitive basis, and cannot produce source-backed or human-authority claims.

Production endpoint does not pass `G2_AI_H`; `/health` reports `g2_ai_h_active=false`.

Build 550's temporary wider exposure is historical and superseded by Build 551.

## SRC V0.2 — dormant backend infrastructure now installed

A source-backed executor must never turn a URL, title or hash into evidence without preserving the exact source body used for the claim.

The V0.2 architecture is fixed by:

- `G2_SRC_EXECUTOR_CONTRACT_V0_2.md` ;
- `G2_SOURCE_SNAPSHOT_PERSISTENCE_CANDIDATE_V0_2.sql` ;
- candidate Git blob SHA-1 `c1fa9f9043d5075415339c4c0e64f6bd2c5897c6`.

Rollback validation passed before installation. The exact candidate blob was fetched from canonical GitHub, its Git blob SHA-1 was recomputed inside PostgreSQL, the SQL compiled and was exercised against transaction-only fixtures, then rolled back.

Production migration history now includes:

`20260915164534_g2_src_snapshot_infrastructure_v02`

This migration installs **dormant service-role-only infrastructure**:

- immutable `idea_source_snapshots` bodies keyed by exact Source/version/hash ;
- SHA-256 verification over canonical extracted text ;
- 256 KiB UTF-8 source-text persistence bound ;
- no anon/authenticated snapshot-body SELECT ;
- no anon/authenticated execution of privileged snapshot/SRC promotion RPCs ;
- exact current snapshot candidate listing ;
- exact Action Run source pinning through `input_refs` ;
- bounded SRC action input revalidation ;
- dedicated SRC promotion enforcing `SOURCE_EXTRACTED / SOURCE_BACKED`, pinned Source lineage, direct confidence and monotonic sensitivity.

It intentionally does **not** modify the active G2 planner predicate and does **not** expose SRC at the Worker endpoint.

Post-install transaction-only negative red-team fixtures also passed:

- foreign-Idea snapshot pinning rejected ;
- Source sensitivity downgrade rejected ;
- wrong resolution class rejected ;
- same-Idea but unpinned Source rejected ;
- Source refresh after Action Run creation makes the old run unusable/stale.

No fixture data was retained.

## SRC Worker candidate — prepared, not transport-certified yet

Canonical GitHub now contains dormant code candidates:

- `src/idea-source-fetch-candidate.js` — HTTPS-only URL acquisition, explicit manual redirects, DNS/public-address validation, bounded streaming, content-type filter, canonical text extraction and SHA-256 ;
- `src/idea-source-ingestion-candidate.js` — separates URL acquisition/snapshot persistence from evidence extraction ;
- `src/idea-evidence-adapter-candidate.js` — dormant pinned-source SRC extraction path limited to `SV.D03.PRIMARY_NEED` ;
- `src/idea-evidence-endpoint.js` — future SRC recovery promotion is routed through the dedicated SRC promotion guard, while active capabilities remain `CALC + RAW` ;
- `scripts/test_g2_src_candidate_v0_2.mjs` — deterministic candidate harness for URL policy, ingestion, exact pinned extraction and no-fabrication behavior.

The canonical repository is therefore ahead of the currently certified Build 551 transport code. These SRC Worker changes are **not live capability** until the next release candidate passes its transport/release gate.

## SRC V0.2 first-runtime scope

The first SRC executor remains deliberately narrow:

- Source kind: URL only ;
- Requirement: `SV.D03.PRIMARY_NEED` only ;
- AI role: strict extraction from persisted snapshot text only ;
- finding must select one exact pinned snapshot ;
- support quote must occur verbatim in that snapshot ;
- mutation: `DECISION_INPUT`, `SOURCE_EXTRACTED`, `DIRECT`, exact Source lineage, resolution exactly `SOURCE_BACKED` ;
- unsupported/inferred output must become `NO_RESOLUTION`, never evidence.

## Remaining activation gates

SRC must remain non-active until all of the following are proven:

1. new JS candidate harness executes successfully in the normal Cloudflare release gate ;
2. canonical/transport runtime files are byte-aligned ;
3. Worker release remains healthy with SRC candidate explicitly inactive ;
4. URL/redirect/DNS/SSRF policy survives release/red-team tests ;
5. active planner SRC predicate is deliberately switched from metadata-only to exact-current-snapshot semantics ;
6. endpoint performs authenticated ingestion, refreshes projection/revision, then deliberately passes `G2_SRC` ;
7. `/health` then reports exactly `CALC,RAW,SRC` only after activation ;
8. true concurrent Source-refresh race is tested ;
9. fresh authenticated production Idea proves registration → ingestion → re-plan → exact pinned extraction → dedicated promotion → visible lineage ;
10. browser remains unable to read arbitrary snapshot bodies or service credentials.

A real authenticated G0 → G1 → G2 proof is still outstanding. At the latest backend check there were no Ideas in production, so this proof must be created through a real authenticated user flow rather than fabricated with service-role-only fixtures.

## Authority note

Current operational truth is determined by the current README plus live `/health` and endpoint smoke. Build 551 remains the runtime baseline. The SRC V0.2 database infrastructure is installed but dormant; canonical SRC Worker code is prepared but not yet transport-certified or endpoint-active.

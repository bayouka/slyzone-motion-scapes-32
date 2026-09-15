# 4b4c / 2b2c — G2 SRC Executor Contract V0.1

Date: 2026-09-15

Status: **DESIGN / IMPLEMENTATION CANDIDATE — NON ACTIVE**

## 1. Purpose

Define the first honest `SRC` executor for G2 Evidence & Market.

`SRC` extracts directly supported information from a source explicitly attached to the Idea. It is not web research, not an AI hypothesis path and not a substitute for missing source content.

The production endpoint MUST continue to advertise only `CALC + RAW` until this contract, its persistence boundary and its authenticated activation gate are proven.

## 2. Authority and non-negotiable semantics

This contract is subordinate to:
- `IDEA_ENGINE_MASTER_BLUEPRINT_V1.md`;
- `G2_EVIDENCE_MARKET_ACQUISITION_MATRIX_V0_1.md`;
- the active G2 policy and provenance enforcement in production Postgres.

For `SRC`:
- action type = `EXTRACT_SOURCE`;
- provenance = `SOURCE_EXTRACTED`;
- allowed resolving levels = `SOURCE_BACKED` and/or `OBSERVED` only where the target Requirement accepts them;
- every promoted claim MUST point to a persisted `idea_sources.id`;
- a locator, URL, title, note or `content_hash` alone is never source-backed evidence;
- AI may act only as a bounded extractor over persisted source content. It may not add external facts, hypotheses or recommendations.

## 3. V0.1 scope

V0.1 is intentionally narrower than policy compatibility.

Supported source kind:
- `url` only.

Supported target Requirement:
- `SV.D03.PRIMARY_NEED` only.

A later version may add `SV.D03.OBJECTIONS_TRUST`, `SV.D04.EXISTING_SITE`, documents, images or other source kinds only after separate executable coverage.

This narrow scope prevents an implementation candidate from silently becoming a general-purpose research engine.

## 4. Missing production primitive discovered during audit

The current `idea_sources` table stores source identity and lifecycle metadata:
- source kind / locator;
- title and human note;
- content hash;
- source version;
- fetched/freshness timestamps;
- status and sensitivity.

It does **not** store a general canonical source body.

`ideas.original_text` is a special RAW exception and MUST NOT be reused as a generic source-content store.

Therefore `SRC` MUST remain non-active until a versioned immutable source snapshot/content boundary exists.

## 5. Source snapshot contract

The canonical persisted content unit is an immutable source snapshot tied to exactly:

`source_id + source_version + content_hash`

The snapshot MUST contain at least:
- source id;
- source version;
- exact content hash;
- bounded canonical extracted text;
- content/media type when known;
- optional storage/content reference for the original representation;
- fetch timestamp;
- optional freshness timestamp;
- sensitivity inherited from or stricter than the parent Source;
- bounded extraction/parser metadata;
- creation actor/action-run metadata;
- immutable creation timestamp.

The database MUST enforce uniqueness of `(source_id, source_version)`.

Snapshot rows are append-only. A changed body creates a new Source version and a new snapshot; it never rewrites an old snapshot.

## 6. Content bounds

V0.1 stores canonical extracted text, not arbitrary binary bodies.

Initial hard limit:
- maximum UTF-8 extracted text size: 256 KiB per snapshot.

For documents/images in later versions:
- original binary remains in the file/storage layer;
- the snapshot stores only the bounded extracted representation and a storage/content reference.

An empty body or hash/body mismatch MUST fail ingestion.

## 7. Security boundary

Source snapshot content may contain internal or sensitive material.

Therefore:
- RLS is enabled on the snapshot table;
- no broad browser INSERT/UPDATE/DELETE is permitted;
- no generic browser SELECT of snapshot bodies is required for V0.1;
- ingestion/read RPCs used by the executor are service-role only;
- user authority is checked before any privileged orchestration at the existing authenticated endpoint boundary;
- snapshot sensitivity can never be lower than its parent Source sensitivity;
- V0.1 model extraction accepts only `public` or `internal` source snapshots. `personal` and `sensitive` snapshots remain capability-blocked until a separate privacy contract is approved.

## 8. Ingestion V0.1

For an explicitly registered URL source, the server may perform one bounded ingestion operation:
1. resolve and validate the current Source row;
2. fetch only the registered URL using the server runtime;
3. enforce URL/network safety policy before fetch;
4. accept bounded textual HTTP content only in V0.1;
5. canonicalize extracted text deterministically;
6. compute the content hash over that canonical text;
7. atomically persist the immutable snapshot and update `idea_sources` status/hash/version/freshness;
8. stale prior Information Items when the Source content changed;
9. increment Idea engine revision through the existing source-ingestion semantics;
10. re-plan before any extraction Action Run is created.

Ingestion and evidence extraction are distinct operations. A fetch is not itself evidence promotion.

## 9. Planner input rule

Once the snapshot boundary exists, `SRC` MUST be considered to have usable input only when at least one current eligible source has:
- `status='ingested'`;
- a non-empty `content_hash`;
- an immutable snapshot for the exact current `source_version`;
- snapshot hash equal to the current Source hash;
- source/snapshot sensitivity allowed by the executor;
- supported source kind for the active executor version.

A merely `registered` Source MUST NOT make `SRC` executable.

This requires hardening `app_private.idea_g2_path_has_input_v1` (or a versioned replacement) before SRC activation.

## 10. Exact snapshot pinning

An SRC Action Run MUST pin the exact source snapshot basis in `idea_action_runs.input_refs` before execution.

Each pinned ref contains at minimum:
- `source_id`;
- `source_version`;
- `content_hash`;
- snapshot id.

The action input fingerprint MUST include those refs.

The executor input RPC MUST reject the run if, before execution:
- the Source was superseded/staled;
- Source version changed;
- content hash changed;
- snapshot no longer matches Source current state;
- Source belongs to another Idea;
- target Requirement fingerprint changed;
- Idea engine revision changed;
- Action Run attempt is stale.

No executor may silently switch from the pinned snapshot to a newer one.

## 11. Source selection V0.1

V0.1 may consider at most 3 eligible current URL snapshots per Action Run.

Selection order MUST be deterministic and persisted in `input_refs`.

The model may choose a supported finding from one of those snapshots only if the returned `support_text` occurs verbatim in that exact snapshot text.

The selected finding MUST return the corresponding snapshot/source identity. The server validates that identity against the pinned refs; the model is not trusted to invent it.

## 12. Extraction model role

Workers AI is only a strict source parser.

Prompt rules:
- use only the supplied snapshot text;
- extract only an explicitly supported audience need/job;
- return `null` if no direct support exists;
- no external fact, statistic, competitor, market claim, quote or inference;
- `support_text` must be a short verbatim passage from the selected snapshot;
- output only through strict JSON schema.

Temperature should remain effectively deterministic.

## 13. Canonical V0.1 mutation

A successful SRC finding promotes exactly one `INFORMATION_ITEM`:
- `semantic_key = 'primary_need_source'`;
- `item_type = 'DECISION_INPUT'`;
- `provenance_type = 'SOURCE_EXTRACTED'`;
- `source_id = <validated current Source>`;
- `confidence_class = 'DIRECT'` when the statement is explicit;
- sensitivity = max(`internal`, Source sensitivity), never lower than Source;
- `target_requirement_id = 'SV.D03.PRIMARY_NEED'`;
- `resolution_levels = ['SOURCE_BACKED']`.

The value may contain:
- extracted value;
- support quote;
- source version/hash reference for presentation/debug lineage.

It MUST NOT produce:
- `RAW_HUMAN`;
- `ACCEPTED_AS_CURRENT` merely because content was extracted;
- `CALCULATED`;
- `WORKING_ASSUMPTION`;
- `AI_RECOMMENDATION`;
- any human/expert authority level.

## 14. Promotion path

`SRC` is a system-source extraction path, not WEB research.

Use the existing G2 system Action Run lifecycle:
- create exact SRC Action Run with pinned source refs;
- `start_g2_action_run_candidate_v2`;
- bounded SRC action-input RPC;
- `complete_g2_action_run_candidate_v2`;
- `promote_g2_system_action_result_candidate_v1` for a valid finding;
- `finalize_g2_action_no_resolution_candidate_v1` for an honest no-resolution result.

All existing stale, attempt-fencing, idempotency and Blueprint guards remain mandatory.

`promote_research_action_result_v3` remains reserved for `WEB/AUDIT/CONN` and MUST NOT be reused for SRC.

## 15. Required red-team invariants

Before SRC activation, executable tests MUST prove all of the following:
1. registered URL without persisted snapshot cannot schedule/execute SRC;
2. empty source body is rejected;
3. content hash mismatch is rejected;
4. source version drift after Action Run creation makes the run stale/fail-closed;
5. target Requirement fingerprint drift fails closed;
6. stale Action Run attempt cannot complete;
7. Source from another Idea is rejected;
8. superseded/stale Source is rejected;
9. direct URL/hash without snapshot can never produce `SOURCE_BACKED`;
10. model quote absent from the pinned snapshot produces `NO_RESOLUTION`;
11. model-selected source/snapshot not in `input_refs` is rejected;
12. AI inference cannot be promoted as `SOURCE_EXTRACTED`;
13. mutation cannot claim `OBSERVED` in V0.1 unless a later contract explicitly enables it;
14. snapshot/source sensitivity cannot be downgraded;
15. personal/sensitive snapshots are excluded in V0.1;
16. exact snapshot refs are persisted in `ActionRun.input_refs`;
17. retry/recovery reuses the same pinned snapshot basis;
18. source content change stales prior source-derived Information Items;
19. browser cannot read/write arbitrary snapshot bodies;
20. endpoint still reports SRC inactive until every activation condition passes.

## 16. Activation gate

SRC becomes production-active only after:
- source snapshot migration is applied and validated;
- ingestion V0.1 has transaction/rollback tests;
- planner input rule requires a current matching snapshot;
- SRC Action Runs pin exact snapshot refs;
- deterministic/red-team harness passes;
- canonical/transport runtime files are byte-aligned;
- endpoint explicitly advertises `SRC`;
- `/health` independently reports `CALC,RAW,SRC` exactly;
- unauthenticated endpoint remains HTTP 401;
- authenticated fresh-Idea production smoke proves URL registration → snapshot ingestion → SRC extraction → promotion lineage without stale/authority bypass.

Until all conditions pass, production remains **CALC + RAW only**.

# 4b4c / 2b2c — G2 SRC Executor Contract V0.2

Date: 2026-09-15

Status: **DESIGN / IMPLEMENTATION CANDIDATE — NON ACTIVE**

Supersedes `G2_SRC_EXECUTOR_CONTRACT_V0_1.md` as the current SRC candidate contract.

## 1. Purpose

Define the first honest source-backed G2 executor without allowing a URL, hash or model output to masquerade as evidence.

Production remains **CALC + RAW only** until every activation gate in this document is proven.

## 2. V0.2 scope

V0.2 remains intentionally narrow:
- acquisition path: `SRC`;
- action type: `EXTRACT_SOURCE`;
- supported source kind: `url` only;
- supported Requirement: `SV.D03.PRIMARY_NEED` only;
- model role: strict extraction from persisted source text only;
- successful provenance: `SOURCE_EXTRACTED`;
- successful resolution level: `SOURCE_BACKED` only.

Policy compatibility with additional targets does not activate them.

## 3. Why a new persistence primitive is mandatory

The current `idea_sources` table stores source identity/lifecycle metadata but no general immutable source body. `ideas.original_text` is a RAW-specific exception, not a general source store.

A source is therefore usable by SRC only when an immutable persisted snapshot exists for the exact current tuple:

`source_id + source_version + content_hash`.

A locator, title, note, URL or hash without that body is not evidence.

## 4. Canonical source snapshot

The current candidate persistence implementation is `G2_SOURCE_SNAPSHOT_PERSISTENCE_CANDIDATE_V0_2.sql`.

A snapshot is append-only and contains:
- `source_id`;
- `source_version`;
- SHA-256 `content_hash` over the exact canonical extracted text;
- bounded canonical `extracted_text`;
- content type;
- optional storage/original-content reference;
- fetched/freshness timestamps;
- sensitivity;
- bounded extraction metadata;
- actor/action lineage;
- immutable creation timestamp.

Database uniqueness: `(source_id, source_version)`.

Storage limit for canonical extracted text: **256 KiB UTF-8**. The execution RPC may return a smaller bounded slice.

Changed source content creates a new Source version and a new immutable snapshot. Old snapshots are never rewritten.

## 5. Deletion semantics

Snapshot immutability means UPDATE is forbidden.

Direct browser DELETE is forbidden by privileges/RLS, but snapshot deletion caused by canonical parent deletion may cascade. The immutability guard MUST NOT block deletion of an Idea/Source and create undeletable user data.

This corrects the over-broad UPDATE+DELETE trigger design from persistence candidate V0.1.

## 6. Security / privacy

- snapshot table RLS enabled;
- no arbitrary browser snapshot-body read/write;
- privileged snapshot RPCs service-role only;
- existing endpoint authenticates the user and proves `can_write` before privilege elevation;
- no service-role secret in browser assets;
- snapshot sensitivity cannot be lower than Source sensitivity;
- V0.2 executor accepts only `public` or `internal` Sources/snapshots;
- `personal` and `sensitive` source bodies are not sent to the model in V0.2.

## 7. Ingestion and extraction are separate

For a user-attached URL source:
1. register source through the existing human RPC;
2. server validates URL/network policy and fetches the registered locator;
3. server derives bounded canonical text;
4. server computes SHA-256 over that exact text;
5. snapshot ingestion atomically persists the body and updates Source metadata/version/staleness;
6. Idea revision changes;
7. system refreshes/re-plans;
8. only then may an SRC extraction Action Run be created.

Fetching a page is not evidence promotion.

## 8. Planner eligibility

SRC input is usable only when a Source is:
- current `status='ingested'`;
- V0.2-supported kind `url`;
- current Source version/hash exactly matched by a persisted snapshot;
- allowed sensitivity;
- same Idea.

A `registered` source without a snapshot MUST NOT satisfy the SRC input predicate.

The candidate persistence package includes a versioned predicate for validation. The active `idea_g2_path_has_input_v1` must not be switched to snapshot semantics until the migration and executor are activation-ready.

## 9. Exact Action Run pinning

Before execution, the SRC Action Run pins at most 3 exact immutable source refs in `idea_action_runs.input_refs`:
- snapshot id;
- source id;
- source version;
- content hash.

The server computes the action input fingerprint from the exact pinned refs plus Idea revision, Requirement fingerprint and projection fingerprint.

The executor can never silently swap a pinned snapshot for a newer version.

## 10. Bounded executor input

The SRC input RPC first invokes the generic G2 Action Run validation, then revalidates every pinned snapshot:
- same Idea;
- source still ingested;
- same current version;
- same current hash;
- exact persisted snapshot;
- allowed sensitivity;
- current run attempt;
- current Idea revision;
- current target Requirement fingerprint.

Any drift fails closed as stale/invalid input.

## 11. AI parser contract

Workers AI is an extractor, not a reasoner for SRC.

The model receives only bounded pinned snapshot text and source-local metadata required for disambiguation.

It must return either `null` or one finding containing:
- target Requirement id;
- selected pinned snapshot id;
- extracted value;
- short verbatim `support_text`;
- directness marker.

Server validation requires:
- selected snapshot is pinned;
- quote occurs verbatim in that exact snapshot body;
- target is exactly `SV.D03.PRIMARY_NEED`;
- finding is direct, not inferred.

No statistic, competitor, external fact, market claim or extra source may be invented.

## 12. V0.2 mutation

A valid finding proposes exactly one mutation:
- kind `INFORMATION_ITEM`;
- semantic key `primary_need_source`;
- item type `DECISION_INPUT`;
- provenance `SOURCE_EXTRACTED`;
- exact validated `source_id`;
- confidence `DIRECT`;
- sensitivity at least the Source sensitivity;
- target `SV.D03.PRIMARY_NEED`;
- resolution levels exactly `['SOURCE_BACKED']`.

It cannot claim `OBSERVED`, `RAW_HUMAN`, `ACCEPTED_AS_CURRENT`, `CALCULATED`, `WORKING_ASSUMPTION`, `AI_RECOMMENDATION`, human validation, decision authority or expert signoff.

## 13. Dedicated SRC promotion guard

V0.2 MUST NOT rely solely on generic system promotion.

Before delegating to the existing G2 system promotion boundary, a dedicated service-only SRC promotion wrapper must verify the completed mutation against the pinned source refs:
- path/action exactly `SRC / EXTRACT_SOURCE`;
- target exactly `SV.D03.PRIMARY_NEED`;
- exactly one Information Item mutation;
- provenance exactly `SOURCE_EXTRACTED`;
- item type exactly `DECISION_INPUT`;
- confidence exactly `DIRECT`;
- resolution levels exactly `['SOURCE_BACKED']`;
- `source_id` belongs to one pinned ref;
- pinned Source/snapshot are still current and hash/version coherent;
- mutation sensitivity rank is not lower than Source sensitivity rank.

Only after these checks may it call `promote_g2_system_action_result_candidate_v1`.

This closes a defense-in-depth gap in the generic promoter, which was not designed to enforce SRC V0.2's exact source/sensitivity contract by itself.

## 14. Retry / recovery

Retry and recovery preserve the original `input_refs` and input fingerprint.

If source version/hash changes after Action Run creation:
- old run cannot execute/promote on the new body;
- old run becomes stale/fails closed;
- re-planning creates a new run with new refs/fingerprint.

Attempt fencing remains mandatory.

## 15. Required red-team proof

Activation requires executable proof that:
- no snapshot → no SRC execution;
- wrong body/hash rejected;
- foreign Idea source rejected;
- superseded/stale/current-version drift rejected;
- unpinned model-selected snapshot rejected;
- absent verbatim quote → `NO_RESOLUTION`;
- AI inference cannot be source evidence;
- exact source sensitivity cannot be downgraded;
- direct generic promotion cannot bypass the dedicated SRC contract in the runtime orchestration;
- duplicate snapshot ids cannot alter the fingerprint basis;
- retry/recovery preserve exact refs;
- concurrent source refresh makes old runs stale;
- browser cannot access arbitrary snapshot bodies.

See `G2_SRC_REDTEAM_PLAN_V0_1.md`; a V0.2 executable harness must incorporate the dedicated-promotion and cascade-deletion corrections above.

## 16. Activation gate

SRC can be advertised only after:
- V0.2 source snapshot migration passes isolated/rollback validation;
- schema/privilege/advisor review passes;
- ingestion tests pass;
- true concurrent source-version race is tested;
- exact Action Run pinning tests pass;
- strict extraction tests pass;
- dedicated promotion tests pass;
- canonical/transport runtime byte alignment passes;
- endpoint explicitly enables `G2_SRC`;
- `/health` reports exactly `['CALC','RAW','SRC']`;
- unauthenticated endpoint remains 401;
- fresh authenticated production E2E proves registration → ingestion → re-plan → pinned SRC extraction → dedicated promotion → projection lineage.

Until then, production remains **CALC + RAW** and SRC is candidate-only.

# 4b4c / 2b2c — G2 SRC Red-Team Plan V0.1

Date: 2026-09-15

Status: **VALIDATION PLAN — SRC NON ACTIVE**

Companion files:
- `G2_SRC_EXECUTOR_CONTRACT_V0_1.md`
- `G2_SOURCE_SNAPSHOT_PERSISTENCE_CANDIDATE_V0_1.sql`

## 1. Goal

Prove that a source-backed claim can only be produced from an immutable, current, exact source snapshot pinned to the Action Run, and that no URL/hash/LLM output can masquerade as evidence.

Production must remain `CALC + RAW` throughout candidate validation.

## 2. Schema / privilege tests

The candidate migration must prove in a rollbacked or isolated validation environment:

- `idea_source_snapshots` exists only after migration candidate application;
- `(source_id,source_version)` is unique;
- body is non-empty and bounded to 256 KiB UTF-8;
- hash is canonical lowercase SHA-256;
- UPDATE and DELETE of a snapshot fail with `SOURCE_SNAPSHOT_IMMUTABLE`;
- authenticated/anon roles cannot SELECT/INSERT/UPDATE/DELETE arbitrary snapshot rows;
- service role can use only the intended RPC boundary;
- RPCs are not executable by anon/authenticated;
- sensitivity accepts only canonical values.

## 3. Ingestion positive fixture

Fixture:
- active `SITE_VITRINE@0.5` Idea;
- registered URL Source, version 1, internal sensitivity;
- canonical extracted text under size limit;
- SHA-256 computed over the exact persisted text.

Expected:
- snapshot `(source_id,1)` inserted;
- Source becomes `ingested`;
- Source hash equals snapshot hash;
- Source version remains 1 on first body;
- Idea revision increments once;
- audit event records snapshot commit;
- repeated identical commit returns idempotently without a second snapshot or revision bump.

## 4. Ingestion negative fixtures

Must reject:
- wrong hash;
- empty body;
- body over 256 KiB;
- unsupported source kind in V0.1;
- superseded Source;
- stale expected source version;
- invalid extraction metadata;
- sensitivity downgrade;
- non-0.5/inactive Blueprint.

## 5. Source update fixture

Given an ingested Source version N with active source-derived Information Items:
- commit a different canonical body/hash.

Expected:
- new immutable snapshot version N+1;
- Source version becomes N+1;
- Source hash changes atomically;
- prior active Information Items linked to Source become `STALE`;
- old snapshot remains byte-identical and queryable only through privileged validation;
- Idea revision increments exactly once.

## 6. Legacy metadata-only backfill fixture

Given an existing `idea_sources` row with:
- status `ingested`;
- current content hash;
- no snapshot row;

and a newly fetched canonical body whose SHA-256 matches that current hash:

Expected:
- snapshot is inserted at the existing Source version;
- Source version does not increment;
- Idea revision increments because executable source content became newly available;
- subsequent identical commit is idempotent.

A body whose hash differs follows the normal changed-content version path.

## 7. Planner input predicate tests

Candidate predicate must return false for:
- merely registered URL;
- ingested Source with no snapshot;
- Source/snapshot version mismatch;
- Source/snapshot hash mismatch;
- stale/superseded Source;
- unsupported source kind;
- personal/sensitive snapshot in V0.1.

It returns true only for a current ingested URL whose exact current version/hash has a matching public/internal immutable snapshot.

The active production `idea_g2_path_has_input_v1` MUST NOT be replaced until the migration is approved and SRC activation work starts.

## 8. Candidate selection tests

`list_g2_src_snapshot_candidates_candidate_v1` must:
- require exact Idea engine revision;
- reject unsupported Requirement;
- return no more than 3 candidates;
- return only same-Idea current URL snapshots;
- exclude personal/sensitive content;
- expose metadata refs only, not source body.

## 9. Action Run pinning tests

`create_g2_src_action_run_candidate_v1` must:
- reject zero or >3 snapshots;
- reject foreign-Idea snapshot;
- reject non-current snapshot;
- reject Source/snapshot hash mismatch;
- reject Source/snapshot version mismatch;
- reject unsupported target;
- pin exact refs in `idea_action_runs.input_refs`;
- include snapshot refs in the computed Action input fingerprint;
- create only `EXTRACT_SOURCE / SRC`;
- allow only `INFORMATION_ITEM` mutation kind;
- preserve generic G2 target fingerprint and engine-revision guards;
- reject idempotency reuse with different pinned refs.

## 10. Action input tests

`get_g2_src_action_input_candidate_v1` must first pass all generic G2 Action Run validation and then revalidate every pinned snapshot.

Must reject after run creation if:
- Idea revision changed;
- target fingerprint changed;
- attempt changed;
- Source version changed;
- Source hash changed;
- Source status is no longer `ingested`;
- Source became superseded/stale;
- Source/snapshot sensitivity leaves the allowed V0.1 class;
- snapshot ref was altered or points to another Idea.

It must never silently switch to a newer snapshot.

## 11. Executor parser tests

Positive fixture:
- one pinned snapshot contains an explicit audience need;
- model returns the exact snapshot id/source id plus an exact support quote contained in that snapshot.

Expected mutation:
- one `INFORMATION_ITEM`;
- semantic key `primary_need_source`;
- `DECISION_INPUT`;
- `SOURCE_EXTRACTED`;
- exact validated `source_id`;
- `DIRECT`;
- `SOURCE_BACKED` only;
- target `SV.D03.PRIMARY_NEED`.

Negative fixtures must produce `NO_RESOLUTION`, never promotion, when:
- quote is absent;
- model selects an unpinned snapshot;
- model invents a statistic/competitor/source;
- model returns an inference rather than direct extraction;
- no supported finding exists in any pinned text;
- output schema is invalid.

## 12. Promotion guards

Database must reject attempts to promote SRC as:
- `AI_INFERRED`;
- `AI_RECOMMENDED`;
- `WEB_RESEARCH`;
- `SYSTEM_CALCULATED`;
- `RAW_HUMAN`;
- `ACCEPTED_AS_CURRENT`;
- `CALCULATED`;
- `WORKING_ASSUMPTION`;
- `AI_RECOMMENDATION`;
- any human/expert authority.

V0.1 target mutation uses only `SOURCE_EXTRACTED / SOURCE_BACKED`.

## 13. Concurrency / stale race tests

At minimum test:
- two ingestion attempts from Source version N with different bodies: at most one may advance the current version; the other must fail stale;
- Action Run created on snapshot N, followed by ingestion of N+1 before execution: SRC input must fail stale;
- Action Run running attempt 1, recovered to attempt 2, late attempt-1 completion must fail attempt fencing;
- two identical snapshot commits cannot create duplicate `(source_id,source_version)` rows.

A true two-session race test remains required before activation; sequential simulation alone is insufficient proof.

## 14. Endpoint / release tests

Before activation:
- `/health` stays `g2_executor_paths=['CALC','RAW']`;
- endpoint capability object does not pass `G2_SRC`;
- unit fixtures for dormant SRC code are not presented as runtime activation.

Activation build must then prove all of:
- endpoint explicitly passes `G2_SRC`;
- `/health` exactly reports `['CALC','RAW','SRC']`;
- unauthenticated request remains 401;
- source-body RPC remains service-role only;
- no service role secret appears in browser assets;
- shell/product UI does not expose internal path names.

## 15. Authenticated production E2E gate

The final activation proof uses a fresh real user session and fresh `SITE_VITRINE@0.5` Idea:

`capture → G0 → G1 → register explicit URL source → server fetch/ingest snapshot → re-plan → SRC Action Run with pinned refs → strict extraction → promotion → projection refresh`

Inspect directly in backend:
- Source row;
- immutable snapshot row;
- Action Run `input_refs`;
- Action input fingerprint;
- Information Item provenance/source id;
- Requirement ref/resolution level;
- Idea revision transitions;
- audit events.

Only after this trace is coherent may SRC be marked production-active.

## 16. Pass criterion

SRC V0.1 is ready for activation review only when every positive/negative test above passes and no test depends on fabricated browser state, direct service-role exposure or mutable source bodies.

# 4b4c / 2b2c — G2 SRC Snapshot V0.2 rollback validation — 2026-09-15

Status: **ROLLBACK VALIDATION PASS / NON-ACTIVE**

## Scope

Validated canonical candidate blob:

- `docs/project-definition/runtime/G2_SOURCE_SNAPSHOT_PERSISTENCE_CANDIDATE_V0_2.sql`
- Git blob SHA-1: `c1fa9f9043d5075415339c4c0e64f6bd2c5897c6`

The SQL was fetched from canonical GitHub inside a PostgreSQL transaction, its exact Git blob SHA-1 was recomputed before execution, the candidate package was executed and exercised against transaction-only fixtures, then the transaction was rolled back.

No candidate SRC object remained in production after rollback.

## Compile / privilege proof

PASS:

- `public.idea_source_snapshots` creates successfully;
- commit/list/create/input/promotion candidate RPCs compile;
- snapshot UPDATE immutability trigger exists;
- `anon` cannot execute snapshot commit or SRC promotion;
- `authenticated` cannot execute snapshot commit or SRC promotion;
- `service_role` can execute the privileged RPCs;
- `anon` / `authenticated` cannot SELECT snapshot bodies;
- `service_role` can SELECT snapshot bodies.

## Transaction fixture proof

A temporary `SITE_VITRINE@0.5` Idea and URL Source were created inside the rollback transaction only.

PASS:

1. a registered URL Source without a snapshot did **not** satisfy the candidate SRC snapshot predicate;
2. snapshot commit recomputed and verified SHA-256 over the exact canonical extracted text;
3. snapshot commit created the immutable body and bumped the Idea revision;
4. current snapshot predicate became true only after successful ingestion;
5. direct UPDATE of snapshot body was rejected with `SOURCE_SNAPSHOT_IMMUTABLE`;
6. Source sensitivity downgrade was rejected with `SOURCE_SENSITIVITY_DOWNGRADE_FORBIDDEN`;
7. snapshot candidate listing returned the exact current Source version;
8. SRC Action Run creation pinned exact `snapshot_id + source_id + source_version + content_hash` into `input_refs`;
9. duplicate snapshot IDs were rejected with `DUPLICATE_SRC_SNAPSHOT_ID`;
10. bounded SRC action input returned the pinned immutable body;
11. a valid completed SRC Action Run promoted only through `promote_g2_src_action_result_candidate_v1`;
12. promoted Information Item retained `SOURCE_EXTRACTED` lineage to the exact Source;
13. parent Source deletion cascaded to its snapshot, proving the V0.2 immutability trigger does not make user data undeletable.

## Rollback proof

After transaction rollback:

- `public.idea_source_snapshots` was absent;
- `public.commit_idea_source_snapshot_candidate_v2(...)` was absent;
- production remained on the pre-SRC active schema/runtime.

## Security / architecture findings

The V0.2 architecture is materially safer than the existing metadata-only SRC possibility because it prevents URL/hash-only evidence and pins exact immutable source bodies to Action Runs.

The following activation gates remain open and therefore **SRC MUST NOT be advertised yet**:

- true concurrent source-refresh race proof with independent sessions;
- server-side URL fetch/redirect/SSRF policy and bounded canonical HTML/text extraction;
- executable model extraction harness with exact verbatim-quote validation against the pinned snapshot;
- negative dedicated-promotion fixtures for wrong provenance/level/source/sensitivity;
- authenticated fresh-Idea production E2E;
- endpoint capability activation and production health proof;
- canonical/transport byte alignment for the eventual runtime change.

## Decision

The snapshot persistence and pinned SRC Action Run design is **approved to advance from design candidate to dormant backend infrastructure preparation**, but not to active SRC capability.

Production user-facing capability remains **CALC + RAW** until the remaining activation gates pass.

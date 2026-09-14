# 4b4c / 2b2c — G2 Consolidated Package Validation — 2026-09-14

Status: **PASS FOR SINGLE-TRANSACTION COMPILE / ROLLBACK — NON ACTIVE**

Authority: `G2_MIGRATION_PACKAGE_MANIFEST_V0_3.md`.

## Scope

Validate the exact 13-file G2 candidate package against the live canonical 4b4c PostgreSQL schema without persisting any G2 DDL or fixture.

The validation ran entirely remotely. Remote Desktop Commander was not used.

## Method

PostgreSQL `http` fetched the exact raw GitHub `main` source for all 13 manifest files. For every file, the validation recomputed the Git blob SHA as:

`SHA1("blob <byte_length>\0" || file_bytes)`

A hard failure was configured for HTTP failure or SHA mismatch.

After SHA verification, the sources were concatenated in manifest V0.3 order and executed dynamically inside one explicit transaction. Before load, definition hashes for the seven active G1 RPCs were captured. The transaction then validated candidate schema/functions and finally executed `ROLLBACK`.

## Result

- package sources: **13**;
- Git blob SHA verified: **13/13**;
- concatenated source bytes: **136,755**;
- concatenated source-content MD5: `599b725bb73df48fa79f532fb012b16d`;
- active G1 RPCs captured/preserved during package load: **7/7**;
- required candidate G2 function set present during transaction: **16/16**;
- final `create_action_run_v4` verified as Blueprint 0.5 + current-target-basis guarded implementation;
- Source Action Run lineage column present during transaction;
- direct-human Requirement basis lineage column present during transaction;
- Blueprint criticality parity constraint accepted `ENHANCER` / `NOT_RELEVANT` during transaction.

## Zero-residue verification after rollback

Independent post-rollback inspection returned:

- G2 candidate function residue: **0**;
- `idea_sources.created_by_action_run_id`: **absent**;
- `idea_information_requirement_refs.target_basis_fingerprint`: **absent**;
- `idea_sources_action_run_idx`: **absent**;
- `idea_information_requirement_refs_basis_idx`: **absent**;
- `idea_requirement_states_criticality_current_check`: restored to the original active G1 vocabulary only (`BLOCKING`, `REQUIRED`, `CONDITIONAL`, `INFORMATIONAL`);
- active G1 RPC count: **7**.

Therefore the package compiled as one unit and the rollback returned the canonical backend to its pre-test state.

## Defect found before PASS

The first V0.2 clean-package attempt correctly failed before commit. `G2_RESEARCH_PROMOTION_CORE_V0_1_FINAL.sql` had lost one `end if;` during manual extraction.

A normalized comparison against the previously rollback-tested `G2_ATOMIC_RESEARCH_PROMOTION_V0_2_HARDENING.sql` proved this was the only semantic divergence after comments/whitespace were removed.

Rather than relying on another large manual copy, manifest V0.3 deliberately uses the exact previously tested V0.2 hardening source followed immediately by the final `G2_RESEARCH_ACTION_V0_4_BLUEPRINT_GUARD.sql`. Catalog validation proves the final database definition is the guarded V0.4 function. The defective standalone extracted core is superseded and excluded.

## Remaining blockers before real migration / G2 activation

1. **Real two-session concurrency proof** for same Idea/source identity advisory locking. Supabase connector SQL calls are serialized; sequential calls are not accepted as concurrency evidence.
2. Generate/commit the literal consolidated SQL artifact with the deterministic assembler if/when a normal authenticated checkout runner is available. The exact source package itself has already been assembled and executed server-side in one transaction, so this is now an artifact-generation/reproducibility task rather than an SQL compatibility unknown.
3. Resolve release authority blockers outside the G2 SQL package, including G1 build 544 runtime/E2E certification as applicable.
4. Blueprint `SITE_VITRINE@0.5`, `evidence.advance`, frontend G2 and production migration remain non-active until activation authority is granted.

## Conclusion

**The exact V0.3 G2 SQL package is PostgreSQL-compatible as a single unit and rollback-clean against the canonical backend.** This does not authorize production migration or Blueprint 0.5 activation.

# 4b4c — Project Definition Runtime Architecture

Date de mise à jour : 2026-09-13

Statut global : **R0 PASS_REFERENCE / R1→R7 VALIDATED BASELINES / WORKSPACE CUTOVER ACTIVE / G1 FOUNDATION RELEASE CANDIDATE / G2 EVIDENCE-MARKET CANDIDATE VALIDATED BY ROLLBACK + R0 DELTA-EQUIVALENCE — NON ACTIVE**.

Ce dossier indexe l'architecture runtime professionnelle de 4b4c. Les spécifications détaillées restent dans leurs documents propriétaires ; ce README ne les remplace pas.

## État réel actuel

- Blueprint runtime actif : `SITE_VITRINE@0.4`.
- Moteur R0 actif : `scripts/r0_engine_v0_3.py` — référence validée 12/12.
- Baselines backend R1→R7 : validées.
- Workspace V3 / cutover : actif en parallèle du legacy.
- G0 Blueprint Fit : validé ; un gap de matérialisation `CREATION_OR_REDESIGN` a été identifié pour G2 et possède un resolver candidat rollback-validé.
- G1 Foundation déterministe : implémenté ; build 544 reste **release candidate** tant qu'une preuve Cloudflare/runtime indépendante + E2E authentifié ne sont pas disponibles.
- Dernière baseline transport explicitement certifiée : build 540.
- G2 Evidence / Market : architecture, Blueprint 0.5 candidat, planner/recompute à basis fingerprint et SQL de promotion research préparés/red-teamés, mais **aucune migration, commande Worker ou UI G2 n'est active**.

Invariant permanent : `Requirement exists ≠ question user`.

---

## Ordre de lecture — runtime canonique

1. `RUNTIME_EXECUTION_MAPPING_V0_1.md`
2. `PERSISTENCE_MODEL_V0_1.md`
3. `DETERMINISTIC_ENGINE_CONTRACT_V0_1.md`
4. `MUTATION_RPC_BOUNDARIES_V0_1.md`
5. `RUNTIME_EXECUTION_MAPPING_RED_TEAM_20260913.md`
6. `R0_ENGINE_V0_3_TEST_REPORT_20260913.md`
7. R1→R7 implementation plans + validation reports
8. `../../idea-engine/ux/WORKSPACE_INTEGRATION_CUTOVER_PLAN_V1.md`

Pour G2 candidat seulement :
- `G2_EVIDENCE_MARKET_RUNTIME_DESIGN_V0_1.md`
- `G2_EVIDENCE_MARKET_BACKEND_GAP_AUDIT_20260913.md`
- `G2_EVIDENCE_MARKET_ACQUISITION_MATRIX_V0_1.md`
- `G2_BLUEPRINT_V0_5_CANDIDATE_VALIDATION_20260913.md`
- `G2_RESEARCH_ACTION_ATOMIC_PROMOTION_CONTRACT_V0_1.md`
- `G2_ATOMIC_RESEARCH_PROMOTION_REDTEAM_PLAN_V0_1.md`
- `G2_ATOMIC_RESEARCH_PROMOTION_VALIDATION_REPORT_20260913.md`
- `G2_REQUIREMENT_BASIS_FINGERPRINT_CONTRACT_V0_1.md`
- `G2_BASIS_FINGERPRINT_VALIDATION_20260913.md`
- `G0_CREATION_REDESIGN_RUNTIME_GAP_AUDIT_20260913.md`
- `G0_CREATION_REDESIGN_RESOLVER_VALIDATION_20260913.md`
- `G2_EVIDENCE_RECOMPUTE_VALIDATION_20260913.md`
- `G2_EVIDENCE_PLANNER_INTEGRATED_VALIDATION_20260913.md`
- `R0_BLUEPRINT_0_5_DELTA_EQUIVALENCE_VALIDATION_20260913.md`
- `sql-candidates/G2_ATOMIC_RESEARCH_PROMOTION_V0_2_HARDENING.sql`
- `sql-candidates/G2_RESEARCH_ACTION_V0_3_TARGET_GUARD.sql`
- `sql-candidates/G2_EVIDENCE_RECOMPUTE_V0_2_BASIS_FINGERPRINT.sql`
- `sql-candidates/G2_EVIDENCE_PLANNER_V0_5_BASIS_INFLIGHT.sql`
- `sql-candidates/G2_REQUIREMENT_CRITICALITY_PARITY_V0_1.sql`

---

# R0 — PASS_REFERENCE

Blueprint actif : `../machine/site-vitrine/BLUEPRINT_SITE_VITRINE_V0_4.yaml`.

Moteur : `scripts/r0_engine_v0_3.py`.

Référence validée : **77 Requirements / 21 Contexts / 14 Gates / 19 Deliverables / 5 Overrides / 0 erreur / 0 warning / 12 tests sur 12 PASS**.

Le candidat `SITE_VITRINE@0.5` est isolé et **non actif**. Il prépare G2 avec :
- `COMPETITOR_SET` matériel plutôt que mécaniquement obligatoire ;
- recherche concurrentielle requise par défaut en greenfield ;
- audit frais pouvant remplacer un benchmark redondant en refonte lorsque la décision n'en dépend plus ;
- existing competitor output qui ne peut plus forcer sa propre applicabilité ;
- dépendances `requires_all/requires_any` comme préconditions transitives ;
- basis fingerprints séparés des signatures de résolution ;
- stale machine result qui ne peut satisfaire le basis courant ;
- calcul de matérialité déterministe, non contrôlable librement par un LLM/caller.

Statut 0.5 : **R0 DELTA-EQUIVALENCE PASS — NON ACTIVE**.

Preuves :
- baseline 0.4 inchangée ;
- corpus partagé Requirements/Deliverables/Gates/Bindings identique entre manifests 0.4 et 0.5 ;
- delta Context/Override explicitement red-teamé ;
- replay algorithmique : **22/22 PASS** (12 invariants actifs + 10 invariants candidat) ;
- byte-for-byte checkout replay non exécuté dans le runtime cloud courant et explicitement distingué de la preuve d'équivalence.

---

# R1 — PASS_PERSISTENCE_BASELINE

Migrations :
- `20260913031001_idea_engine_r1_persistence_core`
- `20260913031053_idea_engine_r1_fk_indexes`.

Persistance moteur, RLS, protection des colonnes système et snapshots immuables validés.

# R2 — PASS_INGESTION_BASELINE

Migration : `20260913031644_idea_engine_r2_ingestion_rpcs`.

RAW-first, Sources, mutations humaines, idempotence, stale guards et supersession explicite validés.

# R3 — PASS_ACTION_LIFECYCLE_BASELINE

Migration : `20260913032224_idea_engine_r3_action_lifecycle`.

Lifecycle server-only des System Actions, fingerprints, stale-safety, permission scopes, provenance machine et promotion contrôlée validés.

# R4 — PASS_PREFIGURATION_ARTIFACT_BASELINE

Migration : `20260913034602_idea_engine_r4_prefiguration_artifacts`.

Artefacts versionnés/immutables, freshness exacte, `FOR_DECISION / CONCEPT_NOT_FINAL_SPEC` et HIFI ≠ preuve utilisateur validés.

# R5 — PASS_DECISION_PACKAGE_BASELINE

Migrations :
- `20260913035101_idea_engine_r5_decision_package`
- `20260913035423_idea_engine_r5_decision_audit_fix`
- `20260913035644_idea_engine_r5_feedback_resolution`.

Decision lineage, package freshness, review/feedback, outcomes neutres et faux GO bloqué validés.

# R6 — PASS_PROJECT_DEFINITION_BASELINE

Migration : `20260913035836_idea_engine_r6_project_definition_baseline`.

Promotion contrôlée Idea approuvée → Project Definition baseline, lineage exact et aucun Project d'exécution créé automatiquement.

# R7 — PASS_BUILD_READY_RUNTIME_BASELINE

Migrations :
- `20260913040538_idea_engine_r7_build_ready_runtime`
- `20260913040724_idea_engine_r7_gate_semantics_hardening`
- `20260913040751_idea_engine_r7_human_decision_authority`
- `20260913040802_idea_engine_r7_r6_artifact_linkage`
- `20260913040853_idea_engine_r7_artifact_rpc_fix`.

G8→G12, autorités humaines/expertes, fingerprints exacts, ambiguity audit, approbation Ready et `BUILD_READY_SNAPSHOT` immuable validés.

Séquence runtime de référence :

`R0 ✅ → R1 ✅ → R2 ✅ → R3 ✅ → R4 ✅ → R5 ✅ → R6 ✅ → R7 ✅`.

---

# Workspace integration / cutover — ACTIVE

Autorité opérationnelle : `../../idea-engine/ux/WORKSPACE_INTEGRATION_CUTOVER_PLAN_V1.md`.

État :
- projection canonique Workspace : validée ;
- G0 Blueprint Fit : validé ;
- Workspace V3 parallèle : validé preview ;
- privileged adapter : security baseline active ;
- URL source : backend validé ;
- G1 Foundation : implémenté / release candidate.

G1 actuel :
- planner déterministe `plan_idea_foundation_v1` ;
- `RAW` avant question humaine quand admissible ;
- target Requirement fingerprints ;
- stale-safe/idempotent Action Runs ;
- `foundation.advance` ;
- `Je ne sais pas / plus tard` explicite ;
- frontend actions `0.3.0`.

Build 544 : **release candidate seulement**. GitHub n'expose toujours aucun statut Cloudflare utilisable ; aucune certification n'est inventée.

---

# G2 Evidence / Market — VALIDATED CANDIDATE DESIGN, NON ACTIVE

## Architecture retenue

G2 réutilise R1→R3. Aucun second moteur de jobs n'est créé.

Acquisition paths :

`RAW / SRC / AUDIT / CONN / WEB / CALC / AI_H / AI_R`.

L'utilisateur n'est pas transformé en chercheur ou benchmarkeur lorsqu'une voie système fiable existe.

Chaîne backend candidate désormais validée en rollback ciblé :

`creation/redesign resolver → recompute basis-aware → deterministic planner → Action Run → executor → atomic research promotion`.

Le resolver demande à l'humain uniquement après une vraie ambiguïté RAW ; il ne transforme pas un échec automatique temporaire en question utilisateur.

## Basis Fingerprint / stale-safety

Pour G2, `idea_requirement_states.input_fingerprint` représente les **inputs** : contexte, applicabilité, parent resolution signatures et source/evidence inputs explicitement pertinents.

Il exclut le résultat propre de la Requirement.

La résolution reste distincte via `resolution_state`, `resolution_levels`, `resolution_refs`, `lock_state`, `authority_ok`.

Validations rollbackées :
- own output change → own basis stable ;
- parent resolution change → child basis change ;
- Source inventory change → `EVIDENCE_QUALITY` basis change ;
- ancien résultat machine → historique conservé mais non current sur nouveau basis ;
- `ACCEPTED_UNKNOWN` G2 → scoped à l'exact basis accepté ;
- unrelated Foundation fingerprint reste inchangé ;
- inflight deduplication = Requirement + current basis, non path-only.

## Promotion research atomique

Le flow rejeté :

`Action Run → écrire/ingérer Source canonique → promouvoir plus tard`.

Raison : l'ingestion Source incrémente `engine_revision` et peut auto-rendre stale le run qui vient de découvrir la Source.

Flow candidat validé :

`plan → Action Run → travail externe non canonique → complete(proposals) → atomic promotion → une engine_revision`.

La transaction promeut ensemble les Sources, observations, Requirement refs et Ledger entries autorisées après revalidation des fingerprints.

## SQL rollback red-team

`G2_ATOMIC_RESEARCH_PROMOTION_VALIDATION_REPORT_20260913.md` documente :
- compilation contre le vrai schéma Supabase ;
- RT-01→RT-24 couverts ;
- G1 RAW non-régression PASS ;
- sensibilité monotone ;
- stale count multi-source correct ;
- Source aliases server-resolved ;
- direct/cross-Idea Source UUID refusés ;
- target fingerprints vérifiés à la création et à la promotion ;
- Source identity dupliquée intra-run refusée ;
- zéro fixture/DDL candidat persistant après rollback.

Hardening courant :
- promotion V0.2 : promotion atomique sécurisée ;
- research Action V0.3 : target Requirement guard avant recherche ;
- recompute V0.2 : basis fingerprint causal ;
- planner V0.5 : basis-aware inflight guard ;
- criticality parity : candidat permettant `ENHANCER / NOT_RELEVANT` sans modifier encore la contrainte production.

**Aucun de ces fichiers n'est une migration active.**

### Limite encore non prouvée

L'advisory transaction lock protège la même identité `(Idea + source_kind + normalized_locator)`, mais une vraie course **multi-session** n'a pas encore été exécutée. Elle reste requise avant migration.

---

# Verrous avant activation G2

1. build 544 : preuve runtime indépendante ;
2. G1 : E2E authentifié desktop/mobile + human-last-mile vérifié ;
3. promotion research : test concurrence multi-session réel ;
4. consolider lineage + criticality parity + resolver/recompute/planner + research promotion dans un package migration propre, en conservant les frontières G1 ;
5. rejouer rollback SQL du candidat consolidé ;
6. seulement ensuite envisager migration Supabase G2 ;
7. puis executors → adapter `evidence.advance` → A03/A04/A05 → UI → E2E → release certification.

Réserve R0 non bloquante pour la préparation : un checkout privé byte-for-byte pourra rejouer les suites 0.5 dès qu'un runtime distant GitHub authentifié sera disponible ; la preuve delta-equivalence est celle utilisée aujourd'hui et reste explicitement tracée.

---

## Décisions structurantes permanentes

- GitHub est la source canonique code/docs ; Supabase est la source canonique state/security/transactions ; Cloudflare reste le chemin normal de build/runtime.
- Remote Desktop Commander est local-only/dernier recours et son indisponibilité ne bloque jamais le projet.
- l'IA propose/recherche/calcule mais ne possède jamais directement l'état canonique ;
- stale data ne satisfait jamais une Gate current ;
- une question humaine n'est créée que lorsqu'elle est matériellement nécessaire et qu'aucune voie système admissible ne suffit ;
- décision humaine/expert signoff ne peuvent pas être escamotés ;
- Idea ≠ Project ;
- `FOR_DECISION` ≠ `FOR_PROJECT` ≠ `FOR_BUILD` ;
- aucune baseline professionnelle ne crée automatiquement backlog/tasks/milestones/delivery Project.

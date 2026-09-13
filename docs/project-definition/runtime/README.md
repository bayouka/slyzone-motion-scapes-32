# 4b4c — Project Definition Runtime Architecture

Statut global : **R0 PASS_REFERENCE / R1 PASS_PERSISTENCE_BASELINE / R2 PASS_INGESTION_BASELINE / R3 PASS_ACTION_LIFECYCLE_BASELINE / R4 PASS_PREFIGURATION_ARTIFACT_BASELINE / R5 PASS_DECISION_PACKAGE_BASELINE / R6 PASS_PROJECT_DEFINITION_BASELINE / R7 PASS_BUILD_READY_RUNTIME_BASELINE**.

Le runtime professionnel de référence `R0 → R7` est désormais validé pour le Blueprint `Site vitrine`. R1 a ajouté la persistance Supabase additive, R2 les frontières RAW-first/source/human mutations, R3 le lifecycle des System Actions + promotion déterministe, R4 le versioning/freshness des artefacts de préfiguration `FOR_DECISION`, R5 le Decision Snapshot / Decision Package / review / décision humaine neutre, R6 la promotion contrôlée d'une Idea approuvée vers une Project Definition baseline, et R7 la définition Project D08→D20 jusqu'au `BUILD_READY_SNAPSHOT`.

**Aucun basculement frontend/Worker vers le nouveau moteur n'a encore eu lieu.** La prochaine phase est une phase d'intégration / UX projection / cutover, pas un nouveau Gate runtime arbitraire.

## Ordre de lecture

1. `RUNTIME_EXECUTION_MAPPING_V0_1.md`
2. `PERSISTENCE_MODEL_V0_1.md`
3. `R1_PERSISTENCE_IMPLEMENTATION_PLAN_V0_1.md`
4. `R1_PERSISTENCE_VALIDATION_REPORT_20260913.md`
5. `R2_INGESTION_IMPLEMENTATION_PLAN_V0_1.md`
6. `R2_INGESTION_VALIDATION_REPORT_20260913.md`
7. `R3_ACTIONS_IMPLEMENTATION_PLAN_V0_1.md`
8. `R3_ACTIONS_VALIDATION_REPORT_20260913.md`
9. `R4_PREFIGURATION_ARTIFACTS_IMPLEMENTATION_PLAN_V0_1.md`
10. `R4_PREFIGURATION_ARTIFACTS_VALIDATION_REPORT_20260913.md`
11. `R5_DECISION_PACKAGE_IMPLEMENTATION_PLAN_V0_1.md`
12. `R5_DECISION_PACKAGE_VALIDATION_REPORT_20260913.md`
13. `R6_PROJECT_DEFINITION_BASELINE_IMPLEMENTATION_PLAN_V0_1.md`
14. `R6_PROJECT_DEFINITION_BASELINE_VALIDATION_REPORT_20260913.md`
15. `R7_BUILD_READY_IMPLEMENTATION_PLAN_V0_1.md`
16. `R7_BUILD_READY_VALIDATION_REPORT_20260913.md`
17. `DETERMINISTIC_ENGINE_CONTRACT_V0_1.md`
18. `MUTATION_RPC_BOUNDARIES_V0_1.md`
19. `RUNTIME_EXECUTION_MAPPING_RED_TEAM_20260913.md`
20. `R0_ENGINE_V0_3_TEST_REPORT_20260913.md`

## Décisions structurantes actives

- Supabase est la source canonique de state/security/transactions du nouveau moteur.
- Le Blueprint YAML reste la définition versionnée des Requirements/Gates ; les Requirements ne sont pas dupliqués comme catalogue métier canonique en base.
- Le moteur déterministe possède applicability, Gate readiness, stale-safety, authority, fingerprints et Change Impact.
- L'IA propose des objets structurés mais ne possède jamais directement l'état canonique.
- évolution additive du backend existant ; pas de rewrite destructif ;
- `ideas.status/readiness`, `idea_items` et l'orchestrateur séquentiel restent compatibility/projection, pas vérité du nouveau moteur ;
- les mutations système/humaines passent par RPCs étroits, versionnés, idempotents et stale-safe ;
- un artefact de préfiguration reste `FOR_DECISION / CONCEPT_NOT_FINAL_SPEC` tant qu'il n'est pas explicitement promu ;
- un Decision Package n'est valable que sur son snapshot exact et devient stale après changement matériel ;
- une décision GO n'est promotable que si l'autorité/Gate requis sont réellement satisfaits ;
- la promotion R6 crée une Project Definition baseline, jamais automatiquement un Project d'exécution ;
- `FOR_PROJECT / PROJECT_DEFINITION` reste distinct de `FOR_BUILD / BUILD_SPEC` ;
- `ACCEPTED_UNKNOWN` peut être valide comme inconnue suivie mais ne satisfait pas une spec structurelle obligatoire ;
- décisions humaines et expert signoff ne peuvent pas être escamotés par SYSTEM/LLM ;
- `READY_FOR_DEVELOPMENT` dépend de G8→G12, de fingerprints exacts, d'un ambiguity audit PASS, d'une approbation humaine et d'un `BUILD_READY_SNAPSHOT` immuable ;
- Build Ready ne crée pas automatiquement de backlog, tasks, milestones ni Project de delivery ;
- Durable async n'est pas encore figé : Cloudflare Workflows reste candidat ; queue seulement si besoin réel.

# R0 — PASS_REFERENCE

Blueprint : `../machine/site-vitrine/BLUEPRINT_SITE_VITRINE_V0_4.yaml`.
Moteur : `scripts/r0_engine_v0_3.py`.
Validation : **12/12 PASS**, 77 Requirements / 21 Contexts / 14 Gates / 19 Deliverables / 5 Overrides / 0 erreur / 0 warning.

# R1 — PASS_PERSISTENCE_BASELINE

Migrations : `20260913031001_idea_engine_r1_persistence_core`, `20260913031053_idea_engine_r1_fk_indexes`.

Persistance moteur, RLS, protections de colonnes système et snapshots immuables validés.

# R2 — PASS_INGESTION_BASELINE

Migration : `20260913031644_idea_engine_r2_ingestion_rpcs`.

RAW-first, source/human mutations, idempotence, stale guards et supersession explicite validés.

# R3 — PASS_ACTION_LIFECYCLE_BASELINE

Migration : `20260913032224_idea_engine_r3_action_lifecycle`.

Lifecycle server-only des System Actions, fingerprints, stale-safety, permissions de mutation, provenance machine et promotion atomique validés.

# R4 — PASS_PREFIGURATION_ARTIFACT_BASELINE

Migration : `20260913034602_idea_engine_r4_prefiguration_artifacts`.

Versions immuables, lignée/versioning, freshness exacte, `FOR_DECISION / CONCEPT_NOT_FINAL_SPEC`, protection HIFI ≠ preuve utilisateur et RPCs service-role-only validés.

# R5 — PASS_DECISION_PACKAGE_BASELINE

Migrations :
- `20260913035101_idea_engine_r5_decision_package`
- `20260913035423_idea_engine_r5_decision_audit_fix`
- `20260913035644_idea_engine_r5_feedback_resolution`

Objets : `idea_decision_packages`, `idea_decision_feedback`, `idea_decision_records_v2`.

Garanties : snapshot/package exacts, package freshness, feedback cosmétique vs matériel, clôture explicite des retours, outcomes neutres, faux GO bloqué, Decision Record immuable et aucune Project Definition créée automatiquement par R5.

# R6 — PASS_PROJECT_DEFINITION_BASELINE

Migration : `20260913035836_idea_engine_r6_project_definition_baseline`.

RPC server-only : `promote_approved_idea_to_project_definition_v1`.

Garanties :
- `APPROVED_IDEA_SNAPSHOT` immuable ;
- lineage complet Idea → Decision → Project Definition ;
- baseline manifest complète et immuable ;
- classifications de promotion explicites ;
- artefacts hérités comme nouvelles versions `FOR_PROJECT / PROJECT_DEFINITION` ;
- feedback ouvert et structural blockers bloquent la promotion ;
- `tasks`, `milestones`, `actions`, `roadmap`, `execution_owners` interdits dans la baseline ;
- aucun `public.projects` d'exécution créé.

Validation : `R6_TRANSACTIONAL_TEST_PASS` + `R6_REDTEAM_PASS`, rollbacks propres.

# R7 — PASS_BUILD_READY_RUNTIME_BASELINE

Docs :
- `R7_BUILD_READY_IMPLEMENTATION_PLAN_V0_1.md`
- `R7_BUILD_READY_VALIDATION_REPORT_20260913.md`

Migrations :
- `20260913040538_idea_engine_r7_build_ready_runtime`
- `20260913040724_idea_engine_r7_gate_semantics_hardening`
- `20260913040751_idea_engine_r7_human_decision_authority`
- `20260913040802_idea_engine_r7_r6_artifact_linkage`
- `20260913040853_idea_engine_r7_artifact_rpc_fix`

Nouveaux contrats runtime :
- Requirement states Project D08→D20 ;
- context/applicability versionnés ;
- `definition_revision` et idempotency receipts ;
- autorité humaine/experte explicite ;
- Gate evaluation G8/G9/G10/G11/G12 ;
- artefacts A19→A24 `FOR_PROJECT / PROJECT_DEFINITION` ;
- A25 `FOR_BUILD / BUILD_SPEC` ;
- freshness descendante par fingerprint exact ;
- `BUILD_READY_SNAPSHOT` immuable ;
- freeze `FROZEN_FOR_BUILD` seulement à la finalisation légitime.

Server-only RPCs :
- `initialize_project_definition_runtime_v1`
- `set_project_requirement_applicability_v1`
- `commit_project_requirement_state_v1`
- `evaluate_project_definition_gates_v1`
- `create_project_definition_artifact_v1`
- `promote_project_definition_artifact_v1`
- `finalize_build_ready_v1`

Validation :
- `R7_HAPPY_PATH_PASS` avec rollback propre ;
- bug réel d'ambiguïté PL/pgSQL détecté puis corrigé par migration additive ;
- `R7_REDTEAM_PASS` 5/5 : premature Build Ready, human authority bypass, expert signoff bypass, ACCEPTED_UNKNOWN comme fausse spec, stale artifact reuse ;
- ACL : fonctions R7 critiques service-role only ;
- aucun nouveau Project d'exécution créé ;
- aucune fixture R7 conservée.

## Séquence validée

`R0 ✅ → R1 ✅ → R2 ✅ → R3 ✅ → R4 ✅ → R5 ✅ → R6 ✅ → R7 ✅`

# NEXT — Integration / UX Projection / Cutover

La prochaine phase doit connecter le runtime validé à l'expérience utilisateur sans réintroduire un wizard séquentiel ni contourner les contrats R0→R7.

Ordre recommandé :

1. établir la projection runtime → surfaces UX / API / Worker ;
2. reprendre le workspace post-capture sur les états réels du moteur ;
3. produire une nouvelle UX candidate et la red-teamer avec Nathalie/Vincent/Maya et les scénarios stale/mismatch/stop ;
4. définir les endpoints/adapters nécessaires sans exposer les RPCs service-role au navigateur ;
5. ajouter les tests E2E authentifiés et multi-utilisateurs nécessaires ;
6. préparer un cutover incrémental, réversible et observable ;
7. seulement ensuite remplacer les surfaces legacy concernées.

Les prototypes workspace historiques restent des explorations ; aucun ne devient automatiquement la nouvelle UX officielle.

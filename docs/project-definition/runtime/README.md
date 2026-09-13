# 4b4c — Project Definition Runtime Architecture

Statut global : **R0 PASS_REFERENCE / R1 PASS_PERSISTENCE_BASELINE / R2 PASS_INGESTION_BASELINE / R3 PASS_ACTION_LIFECYCLE_BASELINE / R4 PASS_PREFIGURATION_ARTIFACT_BASELINE / R5 PASS_DECISION_PACKAGE_BASELINE / R6 PASS_PROJECT_DEFINITION_BASELINE / R7 NEXT**.

Le runtime professionnel complet reste en construction progressive. R1 a ajouté la persistance Supabase additive, R2 les frontières RAW-first/source/human mutations, R3 le lifecycle des System Actions + promotion déterministe, R4 le versioning/freshness des artefacts de préfiguration `FOR_DECISION`, R5 le Decision Snapshot / Decision Package / review / décision humaine neutre, et R6 la promotion contrôlée d'une Idea approuvée vers une Project Definition baseline. Aucun basculement frontend/Worker vers le nouveau moteur n'a encore eu lieu.

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
15. `DETERMINISTIC_ENGINE_CONTRACT_V0_1.md`
16. `MUTATION_RPC_BOUNDARIES_V0_1.md`
17. `RUNTIME_EXECUTION_MAPPING_RED_TEAM_20260913.md`
18. `R0_ENGINE_V0_3_TEST_REPORT_20260913.md`

## Décisions structurantes actives

- Supabase est la source canonique de state/security/transactions du futur moteur.
- Le Blueprint YAML reste la définition versionnée des Requirements/Gates ; les 77 Requirements ne sont pas dupliqués comme catalogue canonique en base.
- Le moteur déterministe possède applicability, Gate readiness, stale-safety, authority, fingerprints et Change Impact.
- L'IA propose des objets structurés mais ne possède jamais directement l'état canonique.
- évolution additive du backend existant ; pas de rewrite ;
- `ideas.status/readiness`, `idea_items` et l'orchestrateur séquentiel restent compatibility/projection, pas vérité du nouveau moteur ;
- les mutations système/humaines passent par RPCs étroits, versionnés, idempotents et stale-safe ;
- un artefact de préfiguration reste `FOR_DECISION / CONCEPT_NOT_FINAL_SPEC` tant qu'il n'est pas explicitement promu ;
- un Decision Package n'est valable que sur son snapshot exact et devient stale après changement matériel ;
- une décision GO n'est promotable que si l'autorité/Gate requis sont réellement satisfaits ;
- la promotion R6 crée une Project Definition baseline, jamais automatiquement un Project d'exécution ;
- `FOR_PROJECT / PROJECT_DEFINITION` reste distinct de `FOR_BUILD / BUILD_SPEC` ;
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

RPCs server-only :
- `create_decision_snapshot_v1`
- `create_decision_package_v1`
- `assess_decision_package_freshness_v1`
- `promote_decision_package_v1`
- `mark_decision_package_stale_v1`
- `record_decision_feedback_v1`
- `resolve_decision_feedback_v1`
- `record_idea_decision_v2`

Garanties : snapshot/package exacts, package freshness, feedback cosmétique vs matériel, clôture explicite des retours, outcomes neutres, faux GO bloqué, Decision Record immuable et aucune Project Definition créée automatiquement par R5.

# R6 — PASS_PROJECT_DEFINITION_BASELINE

Migration : `20260913035836_idea_engine_r6_project_definition_baseline`.

RPC server-only : `promote_approved_idea_to_project_definition_v1`.

Nouveaux contrats :
- `APPROVED_IDEA_SNAPSHOT` immuable ;
- lineage `Idea → Decision Snapshot → Decision Package → Decision Record → Approved Idea Snapshot → Project Definition` ;
- baseline manifest complète et immuable ;
- table `project_definition_artifact_promotions` ;
- classifications `PROMOTE_DIRECTLY / PROMOTE_AND_DEEPEN / REWORK_TARGETED / DO_NOT_PROMOTE / SUPERSEDE` ;
- artefacts hérités créés comme nouvelles versions `FOR_PROJECT / PROJECT_DEFINITION` ;
- source obligatoirement présente dans le Decision Snapshot, fraîche et gelée pour toute vraie promotion ;
- feedback ouvert bloque la promotion ;
- conditions structurelles bloquantes interdites si non résolues ;
- `tasks`, `milestones`, `actions`, `roadmap`, `execution_owners` explicitement interdits dans la baseline ;
- aucun `public.projects` d'exécution n'est créé.

Validation : `R6_TRANSACTIONAL_TEST_PASS` + `R6_REDTEAM_PASS`, rollbacks propres.

# R7 — NEXT: Project Definition completion → Build Ready

R7 doit maintenant approfondir les Requirements Project D08→D20 et contrôler G8→G12 jusqu'à `READY_FOR_DEVELOPMENT`.

R7 devra au minimum :
- matérialiser les Requirements Project product/experience/tech depuis le Blueprint ;
- préserver les Requirements héritées R6 et leurs promotion classes ;
- gérer les niveaux de lock `APPROVED_FOR_PROJECT → FROZEN_FOR_BUILD` ;
- produire des artefacts `FOR_PROJECT` puis seulement les outputs `FOR_BUILD` légitimes ;
- vérifier G8 Product Definition, G9 Experience, G10 Tech/NFR, G11 Traceability/Acceptance et G12 Ready for Development ;
- produire un `BUILD_READY_SNAPSHOT` immuable seulement lorsque les Gate minima sont réellement satisfaits ;
- ne jamais déduire Build Ready d'un simple pourcentage ou de l'existence d'un document ;
- ne créer aucun Project d'exécution avant que le handoff/delivery lifecycle soit explicitement décidé.

## Séquence

`R0 ✅ → R1 ✅ → R2 ✅ → R3 ✅ → R4 ✅ → R5 ✅ → R6 ✅ → R7 build ready`.

# 4b4c — Project Definition Runtime Architecture

Statut global : **R0 PASS_REFERENCE / R1 PASS_PERSISTENCE_BASELINE / R2 PASS_INGESTION_BASELINE / R3 PASS_ACTION_LIFECYCLE_BASELINE / R4 PASS_PREFIGURATION_ARTIFACT_BASELINE / R5 PASS_DECISION_PACKAGE_BASELINE / R6 NEXT**.

Le runtime professionnel complet reste en construction progressive. R1 a ajouté la persistance Supabase additive, R2 les frontières RAW-first/source/human mutations, R3 le lifecycle des System Actions + promotion déterministe, R4 le versioning/freshness des artefacts de préfiguration `FOR_DECISION`, et R5 le Decision Snapshot, le Decision Package, la review et la décision humaine neutre. Aucun basculement frontend/Worker vers le nouveau moteur n'a encore eu lieu.

## Ordre de lecture

1. `RUNTIME_EXECUTION_MAPPING_V0_1.md` — architecture de référence (historique de conception)
2. `PERSISTENCE_MODEL_V0_1.md` — modèle candidat ayant servi à R1
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
13. `DETERMINISTIC_ENGINE_CONTRACT_V0_1.md`
14. `MUTATION_RPC_BOUNDARIES_V0_1.md`
15. `RUNTIME_EXECUTION_MAPPING_RED_TEAM_20260913.md`
16. `R0_ENGINE_V0_3_TEST_REPORT_20260913.md`

## Décisions structurantes actives

- Supabase est la source canonique de state/security/transactions du futur moteur.
- Le Blueprint YAML reste la définition versionnée des Requirements/Gates ; les 77 Requirements ne sont pas dupliqués comme catalogue canonique en base.
- Le moteur déterministe possède applicability, Gate readiness, stale-safety, authority, fingerprints et Change Impact.
- L'IA propose des objets structurés mais ne possède jamais directement l'état canonique.
- évolution additive du backend existant ; pas de rewrite ;
- `ideas.status/readiness`, `idea_items` et l'orchestrateur séquentiel restent compatibility/projection, pas vérité du nouveau moteur ;
- le nouveau GO crée une Project Definition baseline, pas automatiquement un Project d'exécution avec milestones ;
- les mutations système/humaines passent par RPCs étroits, versionnés, idempotents et stale-safe ;
- un artefact de préfiguration reste `FOR_DECISION / CONCEPT_NOT_FINAL_SPEC` tant qu'il n'est pas explicitement promu dans une phase Project ultérieure ;
- un package de décision n'est valable que sur son `DECISION_SNAPSHOT` exact et devient stale après changement matériel ;
- une décision GO n'est promotable que si l'autorité/Gate requis sont réellement satisfaits ;
- Durable async n'est pas encore figé : Cloudflare Workflows reste candidat ; queue seulement si besoin réel.

# R0 — PASS_REFERENCE

Blueprint : `../machine/site-vitrine/BLUEPRINT_SITE_VITRINE_V0_4.yaml`

Moteur : `scripts/r0_engine_v0_3.py`

Validation : replay frais **12/12 PASS** ; validateur V0.4 **77 Requirements / 21 Contexts / 14 Gates / 19 Deliverables / 5 Overrides / 0 erreur / 0 warning**.

# R1 — PASS_PERSISTENCE_BASELINE

Migrations :
- `20260913031001_idea_engine_r1_persistence_core`
- `20260913031053_idea_engine_r1_fk_indexes`

Persistance : metadata Blueprint/engine sur `ideas`, sources, information atomique, Requirement-state cache, Action Runs, snapshots, Project Definitions, artifacts et ledger.

Sécurité : RLS partout, aucun write générique client, tables moteur internes non exposées par grants, colonnes engine protégées, snapshots immuables.

# R2 — PASS_INGESTION_BASELINE

Migration : `20260913031644_idea_engine_r2_ingestion_rpcs`.

Frontières : `initialize_idea_engine_v1`, `register_idea_source_v1`, `commit_source_ingestion_v1`, `supersede_source_v1`, `apply_human_information_v1`.

Garanties : RAW-first, revision/source stale guards, idempotence, explicit supersession/history, source-change invalidation, no generic client write.

# R3 — PASS_ACTION_LIFECYCLE_BASELINE

Migration : `20260913032224_idea_engine_r3_action_lifecycle`.

Server-only RPCs :
- `create_action_run_v1` ;
- `start_action_run_v1` ;
- `complete_action_run_v1` ;
- `fail_action_run_v1` ;
- `mark_action_run_stale_v1` ;
- `materialize_requirement_states_v1` ;
- `promote_action_result_v1`.

Garanties : service-role-only action lifecycle, fingerprints, stale-safety, idempotency, mutation permission scope, machine provenance allowlist, atomic promotion et Requirement-state materialization versionnée.

# R4 — PASS_PREFIGURATION_ARTIFACT_BASELINE

Migration : `20260913034602_idea_engine_r4_prefiguration_artifacts`.

Server-only RPCs :
- `create_prefiguration_artifact_v1` ;
- `promote_prefiguration_artifact_v1` ;
- `mark_prefiguration_artifact_stale_v1` ;
- `freeze_prefiguration_artifact_v1` ;
- `assess_prefiguration_artifact_freshness_v1`.

Garanties : versions immuables, lignée/versioning, une seule version courante, `FOR_DECISION / CONCEPT_NOT_FINAL_SPEC`, freshness exacte, current/frozen/stale contrôlés, idempotence, action lineage et protection HIFI ≠ preuve utilisateur.

# R5 — PASS_DECISION_PACKAGE_BASELINE

Migrations :
- `20260913035101_idea_engine_r5_decision_package` ;
- `20260913035423_idea_engine_r5_decision_audit_fix`.

Tables :
- `idea_decision_packages` ;
- `idea_decision_feedback` ;
- `idea_decision_records_v2`.

Server-only RPCs :
- `create_decision_snapshot_v1` ;
- `create_decision_package_v1` ;
- `assess_decision_package_freshness_v1` ;
- `promote_decision_package_v1` ;
- `mark_decision_package_stale_v1` ;
- `record_decision_feedback_v1` ;
- `record_idea_decision_v2`.

Garanties :
- Decision Snapshot immuable sur révision et versions d'artefacts exactes ;
- memo/deck/PDF/appendix/notes versionnés comme sorties `FOR_DECISION` ;
- package freshness liée au snapshot exact ;
- feedback cosmétique non structurel vs feedback matériel invalidant la projection ;
- outcomes neutres, incluant STOP/PAUSE/REVISE ;
- faux GO bloqué lorsque G7/conditions ne rendent pas l'approbation promotable ;
- Decision Record immuable ;
- aucune Project Definition créée en R5.

Les fixtures R5 ont été exécutées transactionnellement puis rollbackées : `R5_TRANSACTIONAL_TEST_PASS`, données de test absentes.

# R6 — NEXT: Approved Idea → Project Definition baseline

R6 peut maintenant convertir uniquement une décision **promotable** en baseline de Project Definition.

R6 doit au minimum :
- créer un `APPROVED_IDEA_SNAPSHOT` immuable depuis le Decision Record promotable ;
- créer une seule Project Definition active à partir de cette baseline ;
- préserver la traçabilité Idea → Decision Snapshot → Decision Package → Decision Record → Approved Idea Snapshot → Project Definition ;
- classer les artefacts hérités selon `PROMOTE_DIRECTLY / PROMOTE_AND_DEEPEN / REWORK_TARGETED / REJECT_SUPERSEDE` ;
- ne jamais promouvoir un artefact stale ;
- passer les artefacts hérités dans une sémantique `FOR_PROJECT` sans les présenter comme `FOR_BUILD` ;
- ne créer automatiquement aucun milestone, task, owner d'exécution ou vrai Project de delivery ;
- rester idempotent et stale-safe.

## Séquence

`R0 ✅ → R1 ✅ → R2 ✅ → R3 ✅ → R4 ✅ → R5 ✅ → R6 project definition → R7 build ready`.

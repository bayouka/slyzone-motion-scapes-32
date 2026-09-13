# 4b4c — Project Definition Runtime Architecture

Statut global : **R0 PASS_REFERENCE / R1 PASS_PERSISTENCE_BASELINE / R2 PASS_INGESTION_BASELINE / R3 PASS_ACTION_LIFECYCLE_BASELINE / R4 NEXT**.

Le runtime professionnel complet reste en construction progressive. R1 a ajouté la persistance Supabase additive, R2 les frontières RAW-first/source/human mutations et R3 le lifecycle des System Actions + promotion déterministe. Aucun basculement frontend/Worker vers le nouveau moteur n'a encore eu lieu.

## Ordre de lecture

1. `RUNTIME_EXECUTION_MAPPING_V0_1.md` — architecture de référence (historique de conception)
2. `PERSISTENCE_MODEL_V0_1.md` — modèle candidat ayant servi à R1
3. `R1_PERSISTENCE_IMPLEMENTATION_PLAN_V0_1.md`
4. `R1_PERSISTENCE_VALIDATION_REPORT_20260913.md`
5. `R2_INGESTION_IMPLEMENTATION_PLAN_V0_1.md`
6. `R2_INGESTION_VALIDATION_REPORT_20260913.md`
7. `R3_ACTIONS_IMPLEMENTATION_PLAN_V0_1.md`
8. `R3_ACTIONS_VALIDATION_REPORT_20260913.md`
9. `DETERMINISTIC_ENGINE_CONTRACT_V0_1.md`
10. `MUTATION_RPC_BOUNDARIES_V0_1.md`
11. `RUNTIME_EXECUTION_MAPPING_RED_TEAM_20260913.md`
12. `R0_ENGINE_V0_3_TEST_REPORT_20260913.md`

## Décisions structurantes actives

- Supabase est la source canonique de state/security/transactions du futur moteur.
- Le Blueprint YAML reste la définition versionnée des Requirements/Gates ; les 77 Requirements ne sont pas dupliqués comme catalogue canonique en base.
- Le moteur déterministe possède applicability, Gate readiness, stale-safety, authority, fingerprints et Change Impact.
- L'IA propose des objets structurés mais ne possède jamais directement l'état canonique.
- évolution additive du backend existant ; pas de rewrite ;
- `ideas.status/readiness`, `idea_items` et l'orchestrateur séquentiel restent compatibility/projection, pas vérité du nouveau moteur ;
- le nouveau GO crée une Project Definition baseline, pas automatiquement un Project d'exécution avec milestones ;
- les mutations système/humaines passent par RPCs étroits, versionnés, idempotents et stale-safe ;
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

Guarantees :
- service-role-only action lifecycle ;
- request/input/result/projection fingerprints ;
- stale before start / during run / before promotion ;
- idempotent create/complete/fail/stale/promotion where applicable ;
- mutation permission scope ;
- machine provenance allowlist excludes human/formal authority ;
- atomic canonical promotion with action-run lineage ;
- Requirement-state materialization guarded by exact Idea revision/Blueprint ;
- no provider/LLM can mutate canonical state directly.

All live-schema validation fixtures were transactionally rolled back; production data remains untouched.

# R4 — NEXT: prefiguration / artifacts

R4 may now implement artifact-version and snapshot freshness boundaries for decision-time prefiguration, notably concept journey/sitemap/message/capabilities/visual/feasibility outputs when applicable.

R4 must preserve these safeguards:
- prefiguration artifacts are `FOR_DECISION`, not final build specs ;
- high-fidelity concepts remain labelled/not-final and cannot substitute for user evidence ;
- artifact versions are immutable historical records with controlled current/frozen/stale transitions ;
- artifact freshness derives from exact input fingerprints/snapshots ;
- creating/promoting an artifact cannot bypass Requirement/Gate authority ;
- R4 still does not create a real execution Project/backlog.

## Séquence

`R0 ✅ → R1 ✅ → R2 ✅ → R3 ✅ → R4 prefiguration/artifacts → R5 decision package → R6 project definition → R7 build ready`.

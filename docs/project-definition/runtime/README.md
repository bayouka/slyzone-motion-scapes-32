# 4b4c — Project Definition Runtime Architecture

Statut global : **R0 PASS_REFERENCE / R1 PASS_PERSISTENCE_BASELINE / R2 PASS_INGESTION_BASELINE / R3 NEXT**.

Le runtime professionnel complet reste en construction progressive. R1 a ajouté la persistance Supabase additive et R2 les frontières RAW-first/source/human mutations ; aucun basculement frontend/Worker vers le nouveau moteur n'a encore eu lieu.

## Ordre de lecture

1. `RUNTIME_EXECUTION_MAPPING_V0_1.md` — architecture de référence (historique de conception)
2. `PERSISTENCE_MODEL_V0_1.md` — modèle candidat ayant servi à R1
3. `R1_PERSISTENCE_IMPLEMENTATION_PLAN_V0_1.md`
4. `R1_PERSISTENCE_VALIDATION_REPORT_20260913.md`
5. `R2_INGESTION_IMPLEMENTATION_PLAN_V0_1.md`
6. `R2_INGESTION_VALIDATION_REPORT_20260913.md`
7. `DETERMINISTIC_ENGINE_CONTRACT_V0_1.md`
8. `MUTATION_RPC_BOUNDARIES_V0_1.md`
9. `RUNTIME_EXECUTION_MAPPING_RED_TEAM_20260913.md`
10. `R0_ENGINE_V0_3_TEST_REPORT_20260913.md`

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

Context DSL : `../machine/site-vitrine/CONTEXT_OVERLAYS_V0_2.yaml`

Moteur actif : `scripts/r0_engine_v0_3.py`

Suite active : `scripts/test_r0_engine_v0_3.py`

Validation :
- replay frais `main` + Blueprint V0.4 : **12/12 PASS** ;
- validateur V0.4 : **77 Requirements / 21 Contexts / 14 Gates / 19 Deliverables / 5 Overrides / 0 erreur / 0 warning**.

# R1 — PASS_PERSISTENCE_BASELINE

Migrations Supabase :
- `20260913031001_idea_engine_r1_persistence_core`
- `20260913031053_idea_engine_r1_fk_indexes`

Persistance ajoutée : metadata Blueprint/engine sur `ideas`, `idea_sources`, `idea_information_items`, `idea_requirement_states`, `idea_action_runs`, `idea_snapshots`, `project_definitions`, `idea_artifacts`, `idea_ledger_entries`.

Sécurité : RLS partout, aucun write générique client, tables moteur internes non exposées par grants, colonnes engine protégées, snapshots immuables.

# R2 — PASS_INGESTION_BASELINE

Migration Supabase :
- `20260913031644_idea_engine_r2_ingestion_rpcs`

Frontières actives :
- `initialize_idea_engine_v1` ;
- `register_idea_source_v1` ;
- `commit_source_ingestion_v1` (service-role only) ;
- `supersede_source_v1` ;
- `apply_human_information_v1`.

Garanties validées :
- RAW/source persisted before analysis ;
- optimistic stale guard via `engine_revision` ;
- idempotency keys + request fingerprints ;
- source-version stale guard ;
- explicit human supersession/history ;
- source content changes stale directly derived information ;
- direct authenticated table writes remain forbidden ;
- unauthorized Idea writers rejected ;
- audit/change payloads do not duplicate human/source content.

Transactional tests on the live schema were always rolled back; production data remained unchanged.

# R3 — NEXT: autonomous System Actions

R3 may now implement the lifecycle around `idea_action_runs`:
- `create_action_run_v1` ;
- `start_action_run_v1` ;
- `complete_action_run_v1` ;
- `fail_action_run_v1` ;
- `mark_action_run_stale_v1` ;
- deterministic `promote_action_result_v1` ;
- `materialize_requirement_states_v1` as a server-controlled cache boundary ;
- eligibility/fingerprint/permission-scope checks between R0 projection and persisted runs.

R3 must not allow any LLM/provider/workflow to write canonical Information Items, Requirement states, decisions or artifacts directly. AI outputs remain proposed mutations until deterministic promotion.

## Séquence

`R0 deterministic engine ✅ → R1 persistence ✅ → R2 ingestion ✅ → R3 autonomous actions → R4 prefiguration/artifacts → R5 decision package → R6 project definition → R7 build ready`.

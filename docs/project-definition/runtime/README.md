# 4b4c — Project Definition Runtime Architecture

Statut global : **R0 PASS_REFERENCE / R1 PASS_PERSISTENCE_BASELINE / R2 NEXT**.

Le runtime professionnel complet reste en construction progressive. R1 a ajouté uniquement la persistance Supabase additive ; aucun basculement frontend/Worker vers le nouveau moteur n'a encore eu lieu.

## Ordre de lecture

1. `RUNTIME_EXECUTION_MAPPING_V0_1.md` — architecture de référence (historique de conception)
2. `PERSISTENCE_MODEL_V0_1.md` — modèle candidat ayant servi à R1
3. `R1_PERSISTENCE_IMPLEMENTATION_PLAN_V0_1.md` — contrat d'implémentation R1
4. `R1_PERSISTENCE_VALIDATION_REPORT_20260913.md` — preuve/état R1
5. `DETERMINISTIC_ENGINE_CONTRACT_V0_1.md`
6. `MUTATION_RPC_BOUNDARIES_V0_1.md`
7. `RUNTIME_EXECUTION_MAPPING_RED_TEAM_20260913.md`
8. `R0_ENGINE_V0_3_TEST_REPORT_20260913.md`

## Décisions structurantes actives

- Supabase est la source canonique de state/security/transactions du futur moteur.
- Le Blueprint YAML reste la définition versionnée des Requirements/Gates ; les 77 Requirements ne sont pas dupliqués comme catalogue canonique en base.
- Le moteur déterministe possède applicability, Gate readiness, stale-safety, authority, fingerprints et Change Impact.
- L'IA propose des objets structurés mais ne possède jamais directement l'état canonique.
- évolution additive du backend existant ; pas de rewrite ;
- `ideas.status/readiness`, `idea_items` et l'orchestrateur séquentiel restent compatibility/projection, pas vérité du nouveau moteur ;
- le nouveau GO crée une Project Definition baseline, pas automatiquement un Project d'exécution avec milestones ;
- les mutations système/humaines du nouveau moteur passent par RPCs étroits, versionnés, idempotents et stale-safe ;
- Durable async n'est pas encore figé : Cloudflare Workflows reste candidat ; queue seulement si besoin réel.

# R0 — PASS_REFERENCE

Blueprint : `../machine/site-vitrine/BLUEPRINT_SITE_VITRINE_V0_4.yaml`

Context DSL : `../machine/site-vitrine/CONTEXT_OVERLAYS_V0_2.yaml`

Moteur actif : `scripts/r0_engine_v0_3.py`

Suite active : `scripts/test_r0_engine_v0_3.py`

Validation :
- Context DSL déterministe : PASS ;
- contexts/applicability/Requirement fingerprints/Gates/Change Impact/stale guards : PASS_REFERENCE ;
- replay frais `main` + Blueprint V0.4 : **12/12 PASS** ;
- validateur V0.4 : **77 Requirements / 21 Contexts / 14 Gates / 19 Deliverables / 5 Overrides / 0 erreur / 0 warning**.

# R1 — PASS_PERSISTENCE_BASELINE

Migrations Supabase :
- `20260913031001_idea_engine_r1_persistence_core`
- `20260913031053_idea_engine_r1_fk_indexes`

Persistance ajoutée :
- metadata Blueprint/engine sur `ideas` ;
- `idea_sources` ;
- `idea_information_items` ;
- `idea_requirement_states` ;
- `idea_action_runs` ;
- `idea_snapshots` ;
- `project_definitions` ;
- `idea_artifacts` ;
- `idea_ledger_entries`.

Sécurité R1 :
- RLS sur toutes les nouvelles tables ;
- aucun write générique `anon/authenticated` ;
- tables moteur internes non exposées par grants client ;
- colonnes engine de `ideas` protégées ;
- snapshots immuables ;
- couverture FK R1 corrigée après advisor.

R1 n'a pas backfillé les Ideas historiques et n'a modifié ni Worker ni frontend.

# R2 — NEXT: ingestion / RAW first

R2 doit implémenter les voies de mutation nécessaires à la Capture/ingestion sans ouvrir d'écriture générique :
- initialisation/assignation Blueprint d'une Idea ;
- `register_idea_source_v1` ;
- ingestion/version/supersession de source ;
- `apply_human_information_v1` ;
- incrément déterministe de `engine_revision` ;
- Change/audit minimal et stale impact ciblé ;
- tests de permissions, idempotence et stale-safety.

R2 ne doit pas encore implémenter l'orchestration IA autonome de R3.

## Séquence

`R0 deterministic engine ✅ → R1 persistence ✅ → R2 ingestion → R3 autonomous actions → R4 prefiguration/artifacts → R5 decision package → R6 project definition → R7 build ready`.

# 4b4c — Project Definition Runtime Architecture

Statut global : **CANDIDATE / NON CANONIQUE / RUNTIME NON IMPLEMENTE**.

R0 possède désormais un moteur déterministe de référence local et des tests unitaires, mais aucune migration Supabase, modification Worker ou refonte frontend n'est autorisée/implémentée par cette étape.

Ordre de lecture :

1. `RUNTIME_EXECUTION_MAPPING_V0_1.md`
2. `PERSISTENCE_MODEL_V0_1.md`
3. `DETERMINISTIC_ENGINE_CONTRACT_V0_1.md`
4. `MUTATION_RPC_BOUNDARIES_V0_1.md`
5. `RUNTIME_EXECUTION_MAPPING_RED_TEAM_20260913.md`
6. `../validation/R0_DETERMINISTIC_ENGINE_TEST_REPORT_20260913.md`

Décisions candidates principales :

- Supabase reste source canonique de state/security/transactions.
- Le Blueprint YAML reste la définition versionnée des Requirements/Gates ; ne pas dupliquer les 77 Requirements comme catalogue canonique en base.
- Le moteur déterministe possède applicability, Gate readiness, stale-safety, authority, fingerprints et Change Impact.
- L'IA propose des objets structurés mais ne possède jamais directement l'état canonique.
- Evolution additive du backend existant ; pas de rewrite.
- `ideas.status/readiness`, `idea_items` et l'orchestrateur séquentiel deviennent legacy/projection, pas vérité du nouveau moteur.
- Le nouveau GO crée une Project Definition baseline, pas automatiquement un Project d'exécution avec milestones.
- Les nouvelles mutations système passent par RPCs étroits, versionnés, idempotents et stale-safe.
- Durable async n'est pas encore figé : Cloudflare Workflows est candidat ; queue seulement si besoin réel.

## R0 — état actuel

Référence locale : `scripts/r0_engine.py`.

Tests :
- `tests/r0/test_r0_engine.py` — **12/12 tests de logique PASS** ;
- `tests/r0/test_r0_blueprint_integration.py` — smoke tests sur le Blueprint réel ajoutés, replay sur clone frais encore requis.

R0 ne lit ni n'écrit Supabase, n'appelle aucun LLM et ne déploie rien.

Statut R0 actuel : **IMPLEMENTED_REFERENCE / UNIT_LOGIC_PASS / REAL_BLUEPRINT_SMOKE_PENDING_REPLAY**.

Ordre d'implémentation futur recommandé :

`R0 deterministic engine → R1 persistence → R2 ingestion → R3 autonomous actions → R4 prefiguration/artifacts → R5 decision package → R6 project definition → R7 build ready`.

Avant tout SQL : R0 doit obtenir `PASS_REFERENCE` après replay des tests sur un clone frais de `main`, smoke réel Blueprint, et red-team final des résultats contre les 77 Requirements.

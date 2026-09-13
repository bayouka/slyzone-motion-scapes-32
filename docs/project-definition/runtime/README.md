# 4b4c — Project Definition Runtime Architecture

Statut global : **CANDIDATE / NON CANONIQUE / RUNTIME NON IMPLEMENTE**.

Aucune migration Supabase, modification Worker ou refonte frontend n'est autorisée/implémentée par cette étape.

## Ordre de lecture

1. `RUNTIME_EXECUTION_MAPPING_V0_1.md`
2. `PERSISTENCE_MODEL_V0_1.md`
3. `DETERMINISTIC_ENGINE_CONTRACT_V0_1.md`
4. `MUTATION_RPC_BOUNDARIES_V0_1.md`
5. `RUNTIME_EXECUTION_MAPPING_RED_TEAM_20260913.md`
6. `R0_ENGINE_V0_3_TEST_REPORT_20260913.md`

## Décisions candidates principales

- Supabase reste source canonique future de state/security/transactions.
- Le Blueprint YAML reste la définition versionnée des Requirements/Gates ; ne pas dupliquer les 77 Requirements comme catalogue canonique en base.
- Le moteur déterministe possède applicability, Gate readiness, stale-safety, authority, fingerprints et Change Impact.
- L'IA propose des objets structurés mais ne possède jamais directement l'état canonique.
- Evolution additive du backend existant ; pas de rewrite.
- `ideas.status/readiness`, `idea_items` et l'orchestrateur séquentiel deviennent progressivement legacy/projection, pas vérité du nouveau moteur.
- Le nouveau GO crée une Project Definition baseline, pas automatiquement un Project d'exécution avec milestones.
- Les futures mutations système passent par RPCs étroits, versionnés, idempotents et stale-safe.
- Durable async n'est pas encore figé : Cloudflare Workflows reste candidat ; queue seulement si besoin réel.

# R0 — candidat actif

Blueprint exécutable :
`../machine/site-vitrine/BLUEPRINT_SITE_VITRINE_V0_4.yaml`

Context DSL :
`../machine/site-vitrine/CONTEXT_OVERLAYS_V0_2.yaml`

Moteur déterministe actif :
`scripts/r0_engine_v0_3.py`

Suite de tests active :
`scripts/test_r0_engine_v0_3.py`

Les fichiers `scripts/r0_engine.py`, `scripts/r0_engine_v0_2.py` et les anciens tests `tests/r0/*` sont conservés comme historique/régression. Ils ne doivent pas être utilisés comme contrat actif d'une nouvelle implémentation.

## Etat de validation R0

- Context rules converties en DSL déterministe fermé : **FAIT** ;
- aucune interprétation/eval de règles textuelles : **FAIT** ;
- core contexts / Requirements / Gates / fingerprints / Change Impact / stale guards : **IMPLEMENTE EN REFERENCE LOCALE** ;
- suite algorithmique isolée : **12/12 PASS** ;
- bug `generic RESOLVED != Gate minimum satisfied` détecté et corrigé dans V0.3 ;
- replay de `scripts/test_r0_engine_v0_3.py` contre un clone frais de `main` + Blueprint V0.4 : **PENDING**, environnement distant actuellement indisponible ;
- statut final : **NOT_YET_PASS_REFERENCE**.

R0 ne lit ni n'écrit Supabase, n'appelle aucun LLM et ne déploie rien.

## Séquence future

`R0 deterministic engine → R1 persistence → R2 ingestion → R3 autonomous actions → R4 prefiguration/artifacts → R5 decision package → R6 project definition → R7 build ready`.

**R1 SQL/Supabase reste bloqué tant que R0 n'a pas obtenu `PASS_REFERENCE` après replay frais et red-team final.**

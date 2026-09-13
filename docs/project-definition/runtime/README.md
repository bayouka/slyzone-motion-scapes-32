# 4b4c — Project Definition Runtime Architecture

Statut global : **CANDIDATE / NON CANONIQUE / NON IMPLEMENTE**.

Ce dossier décrit comment le contrat professionnel/machine Site vitrine pourrait être exécuté par le runtime actuel sans autoriser encore de migration Supabase, de modification Worker ou de refonte frontend.

Ordre de lecture :

1. `RUNTIME_EXECUTION_MAPPING_V0_1.md`
2. `PERSISTENCE_MODEL_V0_1.md`
3. `DETERMINISTIC_ENGINE_CONTRACT_V0_1.md`
4. `MUTATION_RPC_BOUNDARIES_V0_1.md`
5. `RUNTIME_EXECUTION_MAPPING_RED_TEAM_20260913.md`

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

Ordre d'implémentation futur recommandé :

`R0 deterministic engine → R1 persistence → R2 ingestion → R3 autonomous actions → R4 prefiguration/artifacts → R5 decision package → R6 project definition → R7 build ready`.

Avant tout SQL : R0 doit être testable localement sans réseau ni LLM et passer les fixtures/scénarios définis dans `DETERMINISTIC_ENGINE_CONTRACT_V0_1.md`.

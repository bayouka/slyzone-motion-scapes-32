# 4b4c — R0 DETERMINISTIC ENGINE V0.3 — TEST REPORT — 2026-09-13

Statut : **VALIDATION SUPPORT — NON CANONIQUE**

## Scope actif

Contrat testé :
- `docs/project-definition/machine/site-vitrine/BLUEPRINT_SITE_VITRINE_V0_4.yaml`
- `docs/project-definition/machine/site-vitrine/CONTEXT_OVERLAYS_V0_2.yaml`
- `scripts/r0_engine_v0_3.py`
- `scripts/test_r0_engine_v0_3.py`

R0 reste un moteur local déterministe : aucun accès Supabase, aucun LLM, aucun réseau nécessaire au calcul métier.

## Corrections structurelles introduites

Le premier prototype d'exécution a révélé que `CONTEXT_OVERLAYS_V0_1.yaml` contenait des règles semi-textuelles telles que `existing.site_url exists`. Une telle syntaxe ne peut pas être une source d'autorité exécutable sans interprétation implicite.

V0.2 des Context Overlays introduit donc un DSL fermé et déterministe :
`all`, `any`, `not`, puis `fact` avec `exists`, `eq`, `neq`, `in`, `contains`, `gt`, `gte`, `lt`, `lte`.

Aucun `eval`, aucune interprétation LLM, aucune exécution de texte libre n'est autorisée.

## Bug découvert pendant les tests

R0 V0.2 pouvait considérer un Requirement comme génériquement `RESOLVED` alors que son niveau de résolution restait insuffisant pour la Gate courante.

Exemple :
- Requirement = résolu par `AI_RECOMMENDATION` ;
- Gate = exige `EXPERT_SIGNOFF` ;
- l'ancien planificateur pouvait ne plus proposer l'intervention experte.

V0.3 corrige cela : l'éligibilité d'une action est évaluée par rapport au **minimum requis par la Gate courante**, pas seulement au statut générique du Requirement.

Autre correction : si une voie automatique légitime reste disponible, elle est préférée avant `HUM`/`EXPERT`, sauf `human_required`/autorité formelle réellement matérialisée.

## Suite algorithmique isolée

Une suite de 12 tests a été exécutée dans un environnement Python isolé avec le cœur V0.3 reconstruit. Résultat : **12/12 PASS** après correction du bug ci-dessus.

Scénarios couverts :
1. chargement logique du contrat ;
2. Context DSL structuré et contexte dérivé dépendant ;
3. Nathalie : acquisition automatique avant question humaine ;
4. Vincent : aucune répétition d'informations déjà établies ;
5. B2C→B2B : Change Impact ciblé ;
6. résultat async stale rejeté ;
7. `ACCEPTED_UNKNOWN` non bloquant vs bloquant ;
8. expert signoff réellement last-mile ;
9. Blueprint mismatch ;
10. snapshot stale bloque l'approbation ;
11. Project Definition baseline sans milestones/tasks/owners ;
12. changement visuel local sans réouverture technique globale.

## Limite de validation actuelle

Le device distant autorisé est devenu indisponible avant le replay final. Le container de travail n'a pas d'accès réseau GitHub.

Par conséquent :
- **PASS algorithmique isolé : oui** ;
- **fichiers V0.3 + tests présents sur GitHub : oui** ;
- **replay de `python scripts/test_r0_engine_v0_3.py` sur clone frais de `main` : pas encore exécuté** ;
- `PASS_REFERENCE` : **NON** tant que ce replay n'a pas passé.

Il est interdit de transformer ce résultat en autorisation implicite de commencer R1 SQL/Supabase.

## Critères du replay final R0

Dès qu'un environnement d'exécution frais est disponible :
1. cloner `main` ;
2. installer PyYAML uniquement dans l'environnement de validation si nécessaire ;
3. exécuter `python scripts/test_r0_engine_v0_3.py` ;
4. exécuter le validateur Blueprint adapté à V0.4 ;
5. vérifier 77 Requirements / 21 Contexts / 14 Gates et aucune référence invalide ;
6. red-team les projections produites pour Nathalie/Vincent et les cas stale/mismatch/expert ;
7. seulement alors promouvoir R0 à `PASS_REFERENCE`.

## Gouvernance des versions

Candidat actif : `scripts/r0_engine_v0_3.py`.

`scripts/r0_engine.py`, `scripts/r0_engine_v0_2.py` et leurs tests associés restent des artefacts historiques/régression. Ils ne définissent plus la vérité active et ne doivent pas être importés par une nouvelle implémentation.

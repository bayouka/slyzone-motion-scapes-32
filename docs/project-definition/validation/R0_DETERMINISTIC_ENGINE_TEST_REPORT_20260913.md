# 4b4c — R0 DETERMINISTIC ENGINE — TEST REPORT — 2026-09-13

Statut : **REFERENCE ENGINE IMPLEMENTED / UNIT LOGIC PASS / REAL-BLUEPRINT SMOKE PENDING REPLAY**

Ce rapport concerne uniquement le moteur de référence local `scripts/r0_engine.py`.
Il n'autorise aucune migration Supabase, modification Worker, UI ou déploiement production.

## 1. But

Prouver la logique déterministe avant toute persistance/runtime :

- Context derivation ;
- Requirement applicability/resolution ;
- Gate evaluation ;
- accepted unknown ;
- authority ;
- autonomous vs human action planning ;
- Change Impact ciblé ;
- stale async rejection ;
- snapshot freshness ;
- Blueprint mismatch ;
- Idea → Project Definition promotion sans milestones opérationnels.

## 2. Fichiers

- `scripts/r0_engine.py`
- `tests/r0/test_r0_engine.py`
- `tests/r0/test_r0_blueprint_integration.py`

Le moteur est volontairement Python pour la phase de preuve R0. Ce choix ne décide pas de la stack runtime future ; un port TypeScript pourra être fait après stabilisation des règles.

## 3. Tests de logique réellement exécutés

Commande équivalente :

`python tests/r0/test_r0_engine.py`

Résultat : **12 tests / 12 PASS**.

Scénarios couverts :

1. Nathalie / idée pauvre : intention humaine demandée seulement lorsqu'elle est réellement privée ;
2. Vincent / dossier riche : pas de répétition d'informations déjà résolues ;
3. changement B2C → B2B : invalidation ciblée concurrence/positionnement/scope ;
4. changement du competitor set : propagation aux descendants ;
5. changement visuel : impact local D15 ;
6. contexte réglementaire : signoff expert activé et Gate non prête ;
7. accepted unknown autorisé : `READY_WITH_ACCEPTED_UNKNOWNS` ;
8. accepted unknown interdit : Gate reste `NOT_READY` ;
9. résultat async stale : promotion refusée ;
10. Blueprint mismatch : arrêt de la fausse couverture Site vitrine ;
11. snapshot stale : approbation refusée ;
12. Idea approuvée : capacité `CREATE_PROJECT_DEFINITION_BASELINE`, sans milestones opérationnels.

## 4. Smoke tests sur le Blueprint réel

`tests/r0/test_r0_blueprint_integration.py` vérifie sur un clone réel :

- Blueprint id/version ;
- 77 Requirements ;
- 14 Gates ;
- 21 Contexts ;
- 19 Deliverables ;
- chargement des overrides ;
- projection sûre d'un Blueprint mismatch.

Ces smoke tests ont été ajoutés au repo mais **n'ont pas été rejoués après commit dans un clone frais durant cette passe**, le terminal distant ayant été déconnecté.

Ils doivent être exécutés avant de promouvoir R0 en PASS intégral :

`python -m unittest discover -s tests/r0 -p 'test_*.py'`

## 5. Ce que R0 ne fait pas

R0 ne :

- lit ni écrit Supabase ;
- n'appelle aucun LLM ;
- ne fait aucune recherche web ;
- ne génère aucun artifact final ;
- ne crée aucun Project ;
- ne déploie rien ;
- ne remplace pas encore le runtime Idea actuel.

Il calcule uniquement une projection déterministe à partir du Blueprint + état fourni.

## 6. Limites candidates à approfondir

Le moteur de référence reste volontairement minimal sur :

- DSL générique des règles de contextes ;
- hiérarchie complète des formes de résolution (`at_least` n'est pas une échelle universelle) ;
- conditions systèmes/ledgers avancées ;
- scoring de priorité des System Actions ;
- artifact readiness détaillé ;
- propagation Change Impact selon materiality ;
- temporal freshness policies ;
- permission/cost policy fine.

Ces points doivent être durcis par fixtures supplémentaires avant R1 persistence.

## 7. Gate de sortie R0

R0 pourra être considéré `PASS_REFERENCE` uniquement après :

1. replay des tests sur un clone frais de `main` ;
2. smoke réel Blueprint = PASS ;
3. red-team de résultats contre les 77 Requirements ;
4. aucune dépendance réseau/LLM/DB ;
5. aucune divergence avec le validator machine-contract ;
6. documentation des limitations restantes comme non-bloquantes pour R1.

Jusqu'à cette validation, le statut reste : **IMPLEMENTED_REFERENCE / UNIT_LOGIC_PASS / INTEGRATION_PENDING**.

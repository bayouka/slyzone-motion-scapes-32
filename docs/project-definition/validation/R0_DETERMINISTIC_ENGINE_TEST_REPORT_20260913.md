# 4b4c — R0 DETERMINISTIC ENGINE — TEST REPORT — 2026-09-13

Statut : **V0.2 REFERENCE ENGINE IMPLEMENTED / UNIT LOGIC PASS / REAL-BLUEPRINT SMOKE PENDING REPLAY**

Ce rapport concerne le moteur de référence local R0. Il n'autorise aucune migration Supabase, modification Worker, UI ou déploiement production.

## 1. Référence active

Moteur courant candidat :

`scripts/r0_engine_v0_2.py`

La première version `scripts/r0_engine.py` est conservée comme historique de la première passe de preuve.

Tests courants :

- `tests/r0/test_r0_engine_v0_2.py`
- `tests/r0/test_r0_blueprint_integration_v0_2.py`

Le moteur est volontairement Python pour la phase de preuve R0. Ce choix ne décide pas de la stack runtime future ; un port TypeScript pourra être fait après stabilisation des règles.

## 2. But

Prouver la logique déterministe avant toute persistance/runtime :

- Context derivation ;
- Requirement applicability/resolution ;
- Gate evaluation ;
- Gate conditionnelle / `NOT_APPLICABLE` ;
- required Gates / required Deliverables ;
- voie LAUNCH vs STOP/PAUSE/INSUFFICIENT ;
- accepted unknown ;
- authority ;
- autonomous vs human action planning ;
- Change Impact ciblé ;
- stale async rejection ;
- snapshot freshness ;
- Blueprint mismatch ;
- Idea → Project Definition promotion sans milestones opérationnels.

## 3. Tests de logique réellement exécutés

La V0.2 a été exécutée localement sans réseau, DB ni LLM.

Résultat : **18 tests / 18 PASS**.

Les 12 scénarios initiaux restent couverts :

1. Nathalie / idée pauvre ;
2. Vincent / dossier riche ;
3. changement B2C → B2B ;
4. changement du competitor set ;
5. changement visuel local ;
6. contexte réglementaire / expert ;
7. accepted unknown autorisé ;
8. accepted unknown interdit ;
9. résultat async stale ;
10. Blueprint mismatch ;
11. snapshot stale ;
12. promotion Idea → Project Definition sans milestones.

Le red-team a ajouté 6 contrôles qui ont révélé des lacunes de la V0.1 et sont maintenant couverts :

13. une Gate contextuelle absente du contexte devient `NOT_APPLICABLE` ;
14. un Deliverable requis bloque réellement sa Gate ;
15. une Gate requise bloque réellement `READY_FOR_DEVELOPMENT` ;
16. l'autorité formelle doit être portée par le record de décision, pas seulement par le rôle courant d'un utilisateur ;
17. une voie d'acquisition automatique indisponible n'est pas planifiée ;
18. la voie STOP/PAUSE/INSUFFICIENT de G3 peut bypasser les atoms de lancement uniquement si sa preuve/ledger condition est satisfaite.

## 4. Corrections structurantes V0.2

La V0.2 traite désormais explicitement les champs du vrai `GATE_BINDINGS_V0_1.yaml` qui manquaient dans la première passe :

- `required_atoms_for_launch_path` ;
- `alternative_stop_path` ;
- `applies_when_context` ;
- `required_deliverables` ;
- `required_gates`.

Elle durcit également :

- la vérification de l'autorité formelle ;
- la promotion Idea → Project Definition, qui exige une chaîne de Gates antérieures cohérente ;
- la disponibilité réelle des acquisition paths ;
- l'accepted unknown par Requirement quand explicitement interdit.

## 5. Smoke tests sur le Blueprint réel

`tests/r0/test_r0_blueprint_integration_v0_2.py` vérifie sur un clone réel :

- Blueprint id/version ;
- 77 Requirements ;
- 14 Gates ;
- 21 Contexts ;
- 19 Deliverables ;
- chargement des overrides ;
- présence des bindings avancés G3/G5B/G6/G12 ;
- projection sûre d'un Blueprint mismatch.

Ces smoke tests ont été ajoutés au repo mais **n'ont pas été rejoués après commit dans un clone frais durant cette passe**, le terminal distant ayant été déconnecté.

Commande à rejouer dès qu'un environnement clone est disponible :

`python -m unittest discover -s tests/r0 -p 'test_*v0_2.py'`

## 6. Ce que R0 ne fait pas

R0 ne :

- lit ni écrit Supabase ;
- n'appelle aucun LLM ;
- ne fait aucune recherche web ;
- ne génère aucun artifact final ;
- ne crée aucun Project d'exécution ;
- ne déploie rien ;
- ne remplace pas encore le runtime Idea actuel.

Il calcule uniquement une projection déterministe à partir du Blueprint + état fourni.

## 7. Limites candidates à approfondir avant R1

Le moteur de référence reste volontairement minimal sur :

- DSL générique des règles de contextes ;
- hiérarchie complète des formes de résolution (`at_least` n'est pas une échelle universelle) ;
- scoring de priorité des System Actions ;
- artifact readiness détaillé ;
- propagation Change Impact selon materiality ;
- temporal freshness policies ;
- permission/cost policy fine ;
- interprétation complète des conditions textuelles encore présentes dans certains contracts.

## 8. Gate de sortie R0

R0 pourra être considéré `PASS_REFERENCE` uniquement après :

1. replay des tests V0.2 sur un clone frais de `main` ;
2. smoke réel Blueprint = PASS ;
3. red-team final des projections contre les 77 Requirements ;
4. aucune dépendance réseau/LLM/DB ;
5. aucune divergence avec le validator machine-contract ;
6. limitations restantes classées non-bloquantes pour R1.

Jusqu'à cette validation, le statut reste : **V0.2 IMPLEMENTED_REFERENCE / 18 UNIT TESTS PASS / INTEGRATION_PENDING**.

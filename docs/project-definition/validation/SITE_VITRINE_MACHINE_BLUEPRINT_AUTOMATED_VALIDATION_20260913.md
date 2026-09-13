# 4b4c — SITE VITRINE MACHINE BLUEPRINT — AUTOMATED VALIDATION — 2026-09-13

Statut : **VALIDATION SUPPORT — NON CANONIQUE**

Blueprint testé : `docs/project-definition/machine/site-vitrine/BLUEPRINT_SITE_VITRINE_V0_3.yaml`.

Validateur : `scripts/validate_site_vitrine_blueprint.py`.

Commande : `python scripts/validate_site_vitrine_blueprint.py`.

Le script nécessite PyYAML (`pip install pyyaml`) dans l'environnement de validation ; il n'est pas une dépendance du runtime 4b4c.

## Contrôles exécutés

- parsing YAML des fichiers chargés par le Blueprint ;
- unicité des IDs Requirement / Context / Gate / Deliverable ;
- existence des références atomiques ;
- existence des références de contextes ;
- existence des références de Gates ;
- validité des Gate bindings ;
- validité des override targets ;
- validité des sources atomiques des livrables ;
- existence d'une voie de résolution pour chaque Requirement ;
- autorité explicite pour EXPLICIT_CHOICE / FORMAL_APPROVAL / EXPERT_SIGNOFF ;
- détection de cycles bloquants `requires_all/requires_any` ;
- présence d'un binding explicite pour chaque Gate.

## Résultat final

- Requirements : **77**
- Contexts : **21**
- Gates : **14**
- Deliverables : **19**
- Overrides : **5**
- Errors : **0**
- Warnings : **0**

## Corrections déclenchées par le validateur

Le premier run a trouvé trois erreurs d'autorité :

1. `SV.PF.VISUAL_TERRITORIES` utilisait `EXPLICIT_CHOICE` sans autorité explicite ;
2. `SV.PF.RISK_PROBE` exigeait `EXPERT_SIGNOFF` sans autorité experte explicite ;
3. `SV.D17.EXPERT_SIGNOFF` exigeait `EXPERT_SIGNOFF` sans autorité experte explicite.

Corrections appliquées :

- territoire visuel → `IDEA_DECISION_OWNER` ;
- probes/signoff à haute conséquence → `EXPERT_ROLE` ;
- l'IA reste interdite d'approbation sur ces décisions.

Après correction : **0 error / 0 warning**.

## Limite

Ce PASS valide la cohérence structurelle du contrat machine actuel. Il ne valide pas encore l'implémentation backend/runtime, ni la qualité métier de chaque recommandation IA en situation réelle.

# 4b4c / 2b2c — Creation / Redesign Context Resolver Plan V0.1

Date : 2026-09-13

Statut : **CANDIDATE — NON ACTIVE**

## Objet

Résoudre le gap runtime de `SV.D04.CREATION_OR_REDESIGN` sans rouvrir le Blueprint Fit et sans ajouter une question systématique.

## Principe

Réutiliser les primitives existantes :

`RAW Source → Action Run RAW → extraction structurée → promotion contrôlée → Requirement state`.

Aucun nouveau job engine.

## Niveau attendu

Requirement : `SV.D04.CREATION_OR_REDESIGN`.

Valeurs métier allowlistées :
- `creation` ;
- `redesign`.

Minimum G0 : `ACCEPTED_AS_CURRENT`.

Une extraction directe depuis `human_raw` peut produire :
- provenance `SOURCE_EXTRACTED` ;
- confidence `DIRECT` ;
- resolution levels `[RAW_HUMAN, ACCEPTED_AS_CURRENT]` ;
- semantic key `creation_or_redesign` ;
- source_id RAW canonique ;
- support text exact conservé dans le résultat/action audit.

## Planner candidat

`plan_idea_creation_redesign_v1(idea_id, expected_engine_revision, raw_available)`

Sorties :
- `RESOLVED` si Requirement current au niveau accepté ;
- action RAW si une Source RAW existe et aucune extraction fresh équivalente n'existe ;
- human last-mile seulement après tentative automatique non concluante / explicitement ambiguë ;
- jamais déduire `redesign` depuis une URL générique.

## Validation de l'extraction

Le Worker devra refuser une promotion si :
- valeur hors allowlist ;
- `support_text` vide ;
- support text absent du RAW persistant ;
- source_id ≠ Source RAW de l'Idea ;
- target fingerprint stale ;
- modèle répond par une hypothèse au lieu d'une extraction directe.

## Relation G2

G2 consomme uniquement l'Information Item/Requirement state canonique.

- `creation` → `EXISTING_SITE/EXISTING_AUDIT` non applicables sauf preuve current contradictoire à résoudre ;
- `redesign` → `EXISTING_SITE` devient matériel ;
- unknown/ambigu → G2 peut résoudre automatiquement si possible, sinon demander une clarification ciblée au moment où l'audit devient nécessaire.

## Compatibilité

- Blueprint actif reste 0.4 ;
- G1 planner actuel inchangé ;
- `create_action_run_v3`, lifecycle R3 et `promote_action_result_v1` réutilisés ;
- aucun nouveau secret navigateur ;
- aucune activation G2.

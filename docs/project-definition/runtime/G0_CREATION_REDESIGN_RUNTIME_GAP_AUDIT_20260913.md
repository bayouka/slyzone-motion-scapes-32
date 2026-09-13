# 4b4c / 2b2c — G0 Creation / Redesign Runtime Gap Audit

Date : 2026-09-13

Statut : **CONFIRMED GAP — NON BLOCKING POUR G1 ACTUEL — BLOCKING AVANT ACTIVATION G2**

## 1. Constat

Le Blueprint machine `SITE_VITRINE@0.4` déclare dans `GATE_BINDINGS_V0_1.yaml` :

`G0_BLUEPRINT_FIT_SUFFICIENT.required_atoms = [SV.D04.CREATION_OR_REDESIGN]`.

Le Requirement `SV.D04.CREATION_OR_REDESIGN` est donc une donnée de contexte structurante : elle active notamment l'audit de l'existant et les règles de migration.

## 2. Runtime live observé

Le runtime G0 actuel :
- classe le type de Blueprint ;
- persiste/applique la décision `SITE_VITRINE` ou mismatch ;
- crée la Source RAW initiale ;
- fixe `ideas.blueprint_id/version/status` ;
- incrémente `engine_revision`.

`resolve_idea_blueprint_fit_v1` fixe actuellement `SITE_VITRINE@0.4` mais ne matérialise pas `SV.D04.CREATION_OR_REDESIGN` dans `idea_requirement_states` ni dans un Information Item dédié.

La projection Workspace bascule en mode `IDEA_ENGINE` dès que `blueprint_status='active'` ; elle ne vérifie pas que l'atom `CREATION_OR_REDESIGN` est résolu.

## 3. Pourquoi cela compte maintenant

G1 Foundation peut fonctionner sans cette donnée, donc ce gap n'invalide pas les comportements G1 déjà testés.

G2 en dépend en revanche pour :
- distinguer création/refonte ;
- rendre `EXISTING_SITE` applicable ;
- rendre `EXISTING_AUDIT` applicable ;
- décider si un audit existant peut remplacer une recherche concurrentielle redondante ;
- éviter de traiter toute URL générique comme site actuel.

Sans correction, G2 devrait soit deviner la refonte, soit recréer une deuxième vérité locale — deux options refusées.

## 4. Décision

Avant activation G2, `SV.D04.CREATION_OR_REDESIGN` doit devenir une donnée canonique traçable.

Cible :
- semantic key `creation_or_redesign` ;
- valeurs allowlistées `creation | redesign` ;
- Requirement ref `SV.D04.CREATION_OR_REDESIGN` ;
- provenance `SOURCE_EXTRACTED`, `SYSTEM_CALCULATED` ou humaine selon le cas ;
- RAW/source support conservé ;
- ambiguity explicite au lieu d'une valeur inventée ;
- stale/fingerprint semantics identiques au moteur.

## 5. Correction candidate recommandée

Ne pas surcharger l'UI avec une nouvelle question systématique.

Ordre :
1. extraire depuis RAW si explicite ;
2. utiliser une Source/current-site déjà qualifiée si disponible ;
3. calcul/inférence seulement si le niveau accepté le permet ;
4. demander une clarification humaine uniquement si creation vs redesign reste ambigu ET devient matériel maintenant.

La correction peut être implémentée comme un petit resolver G0 contextuel ou comme une extension ciblée du travail automatique post-Blueprint Fit, mais elle doit produire le même Information Item/Requirement state canonique.

## 6. Garde-fou de compatibilité

La correction ne doit pas :
- rouvrir le Blueprint Fit déjà résolu ;
- modifier le contrat G1 Foundation existant ;
- rendre une question creation/refonte obligatoire si RAW suffit ;
- interpréter une URL générique comme `existing_site` ;
- activer Blueprint 0.5 avant promotion explicite.

## 7. Relation avec G2

Le futur `recompute_idea_evidence_context_candidate_v1` doit consommer cette donnée canonique.

Tant qu'elle est absente :
- G2 ne doit pas supposer `redesign` ;
- `EXISTING_SITE/EXISTING_AUDIT` ne doivent pas être activés par une simple URL générique ;
- si RAW contient probablement une information de refonte, une action système de résolution du contexte doit précéder l'audit.

## Conclusion

> **Blueprint/runtime parity gap confirmé.**

Ce gap n'impose aucune modification immédiate du build 544, mais devient un prérequis de correction avant toute activation G2 Evidence / Market.

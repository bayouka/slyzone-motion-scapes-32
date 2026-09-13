# 4b4c / 2b2c — G2 Evidence Recompute — Validation Report

Date : 2026-09-13

Statut : **TARGETED ROLLBACK PASS — NON ACTIVE**

## 1. Candidats concernés

- `sql-candidates/G2_EVIDENCE_RECOMPUTE_V0_1.sql` ;
- `sql-candidates/G2_REQUIREMENT_CRITICALITY_PARITY_V0_1.sql` ;
- `G2_CRITICALITY_PARITY_GAP_20260913.md` ;
- Creation/Redesign resolver candidat déjà validé.

Aucune migration G2 n'a été appliquée.

## 2. Défaut découvert pendant le premier replay

Le premier test du recompute a échoué sur la contrainte live :

`idea_requirement_states_criticality_current_check`.

Le Blueprint utilise `ENHANCER` pour `SV.D03.OBJECTIONS_TRUST`, alors que la table live n'acceptait que :

`BLOCKING / REQUIRED / CONDITIONAL / INFORMATIONAL`.

Décision : ne pas convertir silencieusement `ENHANCER` en `INFORMATIONAL`.

Candidat de parité testé en transaction :

`BLOCKING / REQUIRED / CONDITIONAL / INFORMATIONAL / ENHANCER / NOT_RELEVANT`.

Le test suivant a alors pu matérialiser fidèlement G2.

## 3. Scénario A — Greenfield

Fixture : création d'un nouveau site, Foundation minimale résolue, evidence G2 structurée, competitor set source-backed.

Résultat :
- `is_redesign=false` ;
- `competitive_evidence_material=true` ;
- `EXISTING_SITE=NOT_RELEVANT` ;
- `EXISTING_AUDIT=NOT_RELEVANT` ;
- `COMPETITOR_SET=RESOLVED` ;
- états G2 matérialisés : **9** ;
- fingerprints nuls : **0**.

**PASS.**

## 4. Scénario B — Refonte auditée

Fixture : contexte `redesign`, `EXISTING_SITE=SOURCE_BACKED`, `EXISTING_AUDIT=OBSERVED`, `EVIDENCE_QUALITY=CALCULATED`, synthèse + research sufficiency présentes.

Résultat :
- `is_redesign=true` ;
- `competitive_evidence_material=false` ;
- `EXISTING_SITE=RESOLVED` ;
- `EXISTING_AUDIT=RESOLVED` ;
- `COMPETITOR_SET=NOT_RELEVANT` ;
- états G2 matérialisés : **9** ;
- fingerprints nuls : **0**.

**PASS.**

## 5. Fingerprint model vérifié structurellement

Le recompute candidate inclut :
- supporting Information Item refs ;
- Source hash/status/version lorsque la Requirement est source-backed ;
- fingerprints des dépendances ;
- fingerprint de l'inventaire Sources pour `EVIDENCE_QUALITY` et `RESEARCH_SUFFICIENCY` ;
- contexte creation/redesign ;
- matérialité concurrentielle dans les branches marché concernées.

Un test dédié de mutation de Source → delta de fingerprint reste à ajouter avant promotion du candidat en migration.

## 6. Rollback vérifié

Après la campagne :
- Ideas fixtures : **0** ;
- fonctions candidates persistées : **0** ;
- contrainte live `criticality_current` restaurée automatiquement à son vocabulaire original.

Aucune donnée utilisateur existante n'a été modifiée.

## 7. Ce qui est maintenant prouvé

- recompute SQL exécutable sur le vrai schema ;
- context resolver requis avant G2 ;
- applicabilité création/refonte correcte ;
- benchmark adaptatif correct ;
- neuf Requirement states G2 matérialisables ;
- fingerprints non vides ;
- `ENHANCER` nécessite une correction de parité DB avant activation ;
- rollback propre.

## 8. Reste à prouver

- delta de fingerprint après changement Source ;
- intégration `recompute → planner V0.3` sur fixture exhaustive ;
- full R0 replay Blueprint 0.5 ;
- promotion research multi-session concurrente ;
- build 544 runtime/E2E G1 ;
- migration consolidée finale ;
- aucun adapter/Worker G2 actif à ce stade.

## Conclusion

> **G2 recompute : TARGETED ROLLBACK PASS.**

La matérialisation n'est plus théorique : elle a été exécutée sur le backend canonique puis intégralement rollbackée. Aucune activation G2 n'est autorisée pour autant.

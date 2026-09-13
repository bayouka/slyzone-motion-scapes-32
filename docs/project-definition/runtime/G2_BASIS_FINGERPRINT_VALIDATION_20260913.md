# 4b4c / 2b2c — G2 Basis Fingerprint & Inflight Validation

Date : 2026-09-13

Statut : **TARGETED ROLLBACK PASS — NON ACTIVE — AUCUNE MIGRATION G2 APPLIQUÉE**

## Portée

Cette validation couvre la correction de stale-safety introduite après le premier recompute G2 candidat.

Fichiers candidats concernés :
- `G2_REQUIREMENT_BASIS_FINGERPRINT_CONTRACT_V0_1.md` ;
- `sql-candidates/G2_EVIDENCE_RECOMPUTE_V0_2_BASIS_FINGERPRINT.sql` ;
- `sql-candidates/G2_EVIDENCE_PLANNER_V0_5_BASIS_INFLIGHT.sql`.

Aucun de ces fichiers n'est une migration active.

## Décision structurante

`idea_requirement_states.input_fingerprint` représente pour G2 le **basis fingerprint** :

`hash(context + applicability + parent resolution signatures + source/evidence inputs explicitement pertinents)`.

Il n'inclut jamais le résultat propre de la Requirement.

La résolution reste portée séparément par :
- `resolution_state` ;
- `resolution_levels` ;
- `resolution_refs` ;
- `lock_state` ;
- `authority_ok`.

## Compilation réelle

`G2_EVIDENCE_RECOMPUTE_V0_2_BASIS_FINGERPRINT.sql` a été compilé contre le vrai schéma Supabase dans une transaction explicitement rollbackée.

Résultat : `G2_RECOMPUTE_V0_2_BASIS_COMPILED`.

`G2_EVIDENCE_PLANNER_V0_5_BASIS_INFLIGHT.sql` a également été compilé contre le vrai schéma avec ses dépendances candidates mockées dans la même transaction.

Résultat : `G2_PLANNER_V0_5_COMPILED`.

## Tests causaux

### 1. Own output ne change pas own basis

Fixture synthétique : `MARKET_CONTEXT` dépend de `ORG_CONTEXT + PRIMARY_AUDIENCE + OFFER_BASELINE`.

Étapes :
1. calcul du basis B ;
2. Action Run `CALC` ciblant B ;
3. promotion d'un Information Item `SYSTEM_CALCULATED` ;
4. recalcul du basis.

Résultat : **basis avant = basis après promotion**.

Conclusion : le résultat propre ne modifie pas la clé qui a autorisé son calcul.

### 2. Changement parent invalide le descendant

Après la promotion précédente, la résolution de `PRIMARY_AUDIENCE` est modifiée sans toucher au résultat `MARKET_CONTEXT`.

Résultats :
- resolution signature parent change ;
- basis `MARKET_CONTEXT` change ;
- ancien Action Run cible toujours l'ancien basis ;
- ancien Information Item reste historique mais n'est plus current pour le nouveau basis.

**PASS.**

### 3. Source inventory invalide Evidence Quality

Un calcul `EVIDENCE_QUALITY` est produit sur un inventaire Sources S1.

Ajout d'une Source S2 :
- source inventory fingerprint change ;
- basis `EVIDENCE_QUALITY` change ;
- ancien calcul n'est plus fresh pour le nouveau basis ;
- un Requirement Foundation sans dépendance à cet inventaire conserve son fingerprint.

**PASS.**

### 4. ACCEPTED_UNKNOWN scoped au basis

Une entrée `ACCEPTED_UNKNOWN` candidate contient :

`{ requirement_id, basis_fingerprint }`.

Résultats :
- acceptation valide sur le basis explicitement accepté ;
- après changement du basis, cette acceptation ne satisfait plus la Requirement current.

**PASS.**

G1 actif conserve sa sémantique existante. Cette règle est spécifique au futur runtime G2.

## Matérialité concurrentielle V3

La matérialité candidate ne consulte plus `COMPETITOR_SET` pour décider si `COMPETITOR_SET` est requis.

Ordre :
1. comparaison marché explicitement demandée → matériel ;
2. conflit marché matériel → matériel ;
3. refonte + audit OBSERVED + evidence quality CALCULATED → benchmark potentiellement non matériel ;
4. sinon baseline externe requise par défaut.

Cela supprime la boucle `own output → own applicability`.

## Inflight guard V0.5

Le planner a été testé sur quatre cas :

| Cas | Résultat |
|---|---|
| `queued` + basis courant | bloque nouveau travail — PASS |
| `succeeded + promoted` + basis courant | ne bloque pas — PASS |
| `failed` | ne bloque pas — PASS |
| `queued` mais ancien basis | ne bloque pas — PASS |

Le guard est maintenant **Requirement + basis scoped**, et non plus path scoped.

Un run `WEB` current-basis peut donc empêcher le lancement simultané d'un `RAW` ou autre path concurrent pour le même travail.

## Rollback / résidus

Toutes les fixtures et fonctions de test ont été créées sous transaction puis rollbackées.

Contrôles :
- fixtures synthétiques restantes : **0** ;
- fonctions de test persistées : **0** ;
- aucun changement durable de contrainte ;
- aucune migration G2 appliquée ;
- aucun Worker G2 activé.

## Statut

Validé :
- causal basis fingerprint ;
- dependency propagation ;
- source-inventory propagation ;
- machine-result freshness ;
- basis-scoped unknown ;
- current-basis inflight deduplication ;
- promoted historical run does not suppress future work.

Toujours requis avant activation G2 :
1. full R0 replay + red-team Blueprint 0.5 ;
2. concurrence multi-session réelle de la promotion research ;
3. consolidation des SQL candidats en une migration propre ;
4. prérequis G1 build 544 / runtime / E2E ;
5. aucun `evidence.advance` avant satisfaction de ces preuves.

> **BASIS / STALE-SAFETY TARGETED PASS — NON ACTIVE.**

# 4b4c / 2b2c — R0 Blueprint SITE_VITRINE@0.5 — Delta Equivalence Validation

Date : 2026-09-13

Statut : **DELTA-EQUIVALENCE PASS + ALGORITHMIC REPLAY 22/22 — CANDIDATE NON ACTIVE**

## 1. Objet

Valider le candidat `SITE_VITRINE@0.5` sans confondre trois niveaux de preuve :

1. la baseline active `SITE_VITRINE@0.4`, déjà `R0 PASS_REFERENCE` ;
2. le delta machine réel 0.4 → 0.5 ;
3. l'exécution directe d'un clone privé complet de `main`.

Le troisième niveau n'a pas été simulé artificiellement : l'environnement cloud courant ne dispose pas d'un checkout GitHub authentifié ni d'un transfert connector→filesystem automatique. La validation ci-dessous utilise donc une **preuve par équivalence de delta + replay algorithmique ciblé**, plus défendable qu'une reconstruction prétendument exacte.

## 2. Baseline héritée

`SITE_VITRINE@0.4` reste inchangé et conserve sa référence :

- 77 Requirements ;
- 21 Contexts ;
- 14 Gates ;
- 19 Deliverables ;
- 5 Overrides ;
- moteur `scripts/r0_engine_v0_3.py` ;
- suite active 12/12 PASS déjà enregistrée dans le projet.

Aucun fichier actif 0.4 n'est remplacé par le candidat 0.5.

## 3. Delta machine réel 0.4 → 0.5

Le manifeste 0.5 charge exactement les mêmes fichiers partagés que 0.4 pour :

- `REQUIREMENTS_IDEA_V0_1.yaml` ;
- `REQUIREMENTS_PREFIGURATION_DECISION_V0_1.yaml` ;
- `REQUIREMENTS_PROJECT_BUILD_V0_1.yaml` ;
- `DELIVERABLE_CONTRACTS_V0_1.yaml` ;
- `GATES_V0_1.yaml` ;
- `GATE_BINDINGS_V0_1.yaml`.

Le delta contractuel est limité à :

### Context DSL

`CONTEXT_OVERLAYS_V0_2.yaml` → `CONTEXT_OVERLAYS_V0_3.yaml`

Ajout candidat :

`NEEDS_COMPETITIVE_EVIDENCE := research.competitive_evidence_material == true`

La règle utilise le DSL déterministe existant ; aucun `eval`, texte libre ou LLM ne décide directement de ce contexte.

### Overrides

`OVERRIDES_V0_1.yaml` → `OVERRIDES_V0_2_G2_CANDIDATE.yaml`

Les 5 overrides historiques restent présents. Un sixième override cible :

`SV.D05.COMPETITOR_SET`

avec :

- `default: INACTIVE` ;
- `any_of_contexts: [NEEDS_COMPETITIVE_EVIDENCE]`.

Aucune dépendance métier du Requirement n'est supprimée : `MARKET_CONTEXT` reste son prérequis.

## 4. Correction Materiality V3 avant replay

Un ancien candidat R0 conservait encore une boucle causale :

`COMPETITOR_SET déjà SOURCE_BACKED → COMPETITOR_SET matériel`.

Cette règle a été retirée avant validation.

Règle candidate actuelle :

1. comparaison marché explicitement requise → matériel ;
2. conflit marché matériel → matériel ;
3. refonte + `EXISTING_AUDIT=OBSERVED` + `EVIDENCE_QUALITY=CALCULATED` → benchmark redondant potentiellement non matériel ;
4. sinon external baseline requise par défaut.

Le résultat propre de `COMPETITOR_SET` n'influence plus sa propre applicabilité.

## 5. Basis Fingerprint aligné dans le moteur R0 candidat

Le manifeste 0.5 annonçait la sémantique `basis_not_own_output`, mais le premier moteur candidat réutilisait encore les fingerprints résultat du moteur 0.4.

Cela a été corrigé avant PASS.

Dans `r0_engine_v0_5_candidate.py` :

- `fingerprint` = basis/input fingerprint ;
- propre `status / levels / refs` exclus du basis ;
- parent Resolution Signature incluse dans le basis enfant ;
- `resolution_signature` séparée du basis ;
- un fixture R0 peut fournir `basis_fingerprint`, `input_fingerprint` ou `input_refs` pour représenter les inputs externes.

Invariants testés :

- own output change ⇒ own basis stable ;
- own output change ⇒ own resolution signature change ;
- parent resolution change ⇒ child basis change.

## 6. Replay algorithmique

Un corpus temporaire a été reconstruit pour exécuter les invariants moteurs avec les mêmes cardinalités R0 et les contrats réellement touchés par le delta :

- 77 Requirements ;
- 21 Contexts actifs / 22 Contexts candidat ;
- 14 Gates ;
- G0/G1/G2 bindings réels pour les chemins testés ;
- dependencies et overrides impactés par le candidat.

Ce corpus temporaire n'est pas présenté comme un clone byte-for-byte du repo privé ; il sert à exécuter les invariants algorithmiques tandis que l'équivalence statique couvre le corpus inchangé.

### Suite active 0.4

12/12 PASS :

1. cardinalités R0 ;
2. Context DSL structuré ;
3. humain après auto paths ;
4. aucune question Foundation répétée ;
5. Change Impact ciblé ;
6. stale async result rejeté ;
7. Accepted Unknown blocking/non-blocking ;
8. Expert signoff last-mile ;
9. Blueprint mismatch ;
10. snapshot stale bloque approval ;
11. Project baseline n'invente pas de delivery plan ;
12. changement visuel local reste local.

### Suite candidat 0.5

10/10 PASS :

1. séparation active 0.4 / candidat 0.5 ;
2. greenfield → competitive evidence matériel ;
3. refonte auditée suffisante → benchmark redondant non matériel ;
4. existing competitor output ne force pas own applicability ;
5. comparaison marché explicite réactive le benchmark ;
6. conflit marché matériel réactive le benchmark ;
7. WEB avant humain pour benchmark matériel ;
8. audit stale ne désactive pas benchmark ;
9. dépendances transitives bloquent `RESEARCH_SUFFICIENCY` orpheline ;
10. basis exclut own output et suit parent resolution.

Résultat cumulé : **22/22 PASS**.

## 7. Preuve d'équivalence du corpus partagé

Comme les six registres partagés Requirements/Deliverables/Gates/Bindings sont les **mêmes fichiers** dans les manifests 0.4 et 0.5 :

- les IDs existants ne changent pas ;
- les références de Gate existantes ne changent pas ;
- les références de Deliverable existantes ne changent pas ;
- le graphe de dépendances partagé ne change pas ;
- les autorités historiques ne changent pas, sauf overrides déjà présents dans 0.4 ;
- la seule nouvelle référence de contexte introduite par l'override 0.5 est `NEEDS_COMPETITIVE_EVIDENCE`, définie dans V0.3.

Ainsi, les validations structurelles acquises sur le corpus partagé 0.4 se transfèrent au candidat, sous réserve du delta explicitement red-teamé ci-dessus.

## 8. Ce que cette validation ne prétend pas

Elle ne prétend pas :

- qu'un checkout privé byte-for-byte de `main` a été exécuté dans le conteneur courant ;
- que le Blueprint 0.5 est actif ;
- que Supabase G2 est migré ;
- que `evidence.advance` existe en production ;
- que build 544 est runtime-certified ;
- que la concurrence multi-session research est prouvée.

## 9. Statut de décision R0 candidat

La combinaison :

- baseline 0.4 `PASS_REFERENCE` inchangée ;
- delta machine restreint et vérifié ;
- Materiality V3 sans boucle own-output ;
- dependency semantics transitive ;
- basis semantics causale ;
- 22/22 replay algorithmique ;

permet de classer le candidat comme :

> **R0 0.5 DELTA-EQUIVALENCE PASS — NON ACTIVE**

Pour supprimer la dernière réserve d'exécution, un replay byte-for-byte du checkout privé pourra être effectué dès qu'un checkout GitHub authentifié est disponible dans un runtime distant approprié. Cette réserve n'est pas un blocage du développement préparatoire G2 et ne justifie pas l'usage de Remote Desktop Commander.

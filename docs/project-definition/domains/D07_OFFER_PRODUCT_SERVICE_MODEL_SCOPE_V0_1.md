# D07 — Offer, Product/Service Model & Scope — V0.1

Statut : **WORKING CANDIDATE — NON CANONIQUE**

Mission : transformer la direction stratégique retenue en une définition claire de ce qui est proposé, priorisé, inclus, exclu, reporté ou rejeté — d’abord au niveau macro dans IDEA, puis au niveau exécutable dans PROJECT.

---

## Atoms

| ID | Type | Atom | Pourquoi | Acquisition | Résolution / Gate | Débloque | Change impact |
|---|---|---|---|---|---|---|---|
| D07.INFO.001 | INFO | Offre future principale | Savoir ce que le futur site/produit doit réellement mettre au centre | D04/D06/HUM | G4 REQUIRED | scope/project baseline | STRATEGIC |
| D07.INFO.010 | INFO | Offres secondaires | Gérer hiérarchie sans diluer la proposition | D04/D06/HUM | G5 CONDITIONAL | D09/D10 | MULTI_DOMAIN |
| D07.INFO.020 | INFO | Offre à développer | Capturer intention stratégique future | HUM | G4 CONDITIONAL | value/scope | STRATEGIC |
| D07.INFO.030 | INFO | Offre à réduire / arrêter | Éviter de reconstruire l’existant obsolète | HUM | G4 CONDITIONAL | scope/content | STRATEGIC |
| D07.INFO.040 | INFO | Modèle de service / délivrance | Comprendre ce que l’utilisateur obtient réellement et comment | RAW/SRC/HUM/AI-H | G4 REQUIRED commercial | journeys/functions | STRATEGIC |
| D07.INFO.050 | INFO | Packaging / regroupement des offres | Déterminer si structure actuelle aide ou nuit à la compréhension | RAW/SRC/AI-R/HUM | G5 CONDITIONAL | IA/content | MULTI_DOMAIN |
| D07.INFO.060 | INFO | Prix / logique tarifaire à afficher | Décider transparence utile, pas inventer des prix | RAW/SRC/HUM | G5 CONDITIONAL | content/conversion | MULTI_DOMAIN |
| D07.INFO.070 | INFO | Must-have capabilities | Identifier besoins fonctionnels sans encore détailler leur implémentation | D06/HUM/AI-R | G4 CONDITIONAL | D12 | MULTI_DOMAIN |
| D07.INFO.080 | INFO | Nice-to-have / later | Éviter que toute idée devienne V1 | HUM/AI-R | G5 REQUIRED si nombreuses demandes | backlog scope | DOMAIN |
| D07.INFO.090 | INFO | Explicit non-goals | Protéger contre scope creep | D02/HUM | G5 REQUIRED | D12-D16 | STRATEGIC |
| D07.INFO.100 | INFO | Dépendances de l’offre | Paiement, réservation, contact humain, données, stock, localisation… | RAW/SRC/HUM/AI-H | G4 CONDITIONAL | D12-D14 | MULTI_DOMAIN |
| D07.INFO.110 | INFO | Fréquence / volumétrie métier pertinente | Éviter architecture disproportionnée | HUM/CONN/SRC | G7 CONDITIONAL | D13/D16 | MULTI_DOMAIN |
| D07.INFO.120 | INFO | Règles commerciales critiques | Minimums, zones, disponibilité, éligibilité, exclusions | HUM/SRC | G5 CONDITIONAL | D12 | MULTI_DOMAIN |
| D07.ANALYSIS.200 | ANALYSIS | Offer hierarchy analysis | Relier valeur, priorité business et compréhension utilisateur | D02-D06 + AI-R | G4 REQUIRED | IA/content | STRATEGIC |
| D07.ANALYSIS.210 | ANALYSIS | Scope-value analysis | Comparer valeur, complexité, dépendances et risques des éléments de scope | AI-R/CALC | G5 REQUIRED | V1/Later/Reject | STRATEGIC |
| D07.ANALYSIS.220 | ANALYSIS | Simpler-alternative analysis | Chercher solution plus légère à chaque fonction coûteuse | AI-R | G5 REQUIRED pour complexité élevée | scope discipline | MULTI_DOMAIN |
| D07.ANALYSIS.230 | ANALYSIS | Scope dependency analysis | Détecter qu’un élément en entraîne d’autres : data, legal, ops, UX | CALC/AI-H | G5 REQUIRED | D12-D18 | MULTI_DOMAIN |
| D07.ANALYSIS.240 | ANALYSIS | Scope feasibility probe | Identifier les points qui nécessitent estimation/validation technique avant freeze | AI-H/AI-R | G5 CONDITIONAL | D16 probe | MULTI_DOMAIN |
| D07.DECISION.300 | DECISION | Offre principale retenue | Fixer ce que le futur projet met en avant | HUM/AI-R | G4 REQUIRED | Project Definition | STRATEGIC |
| D07.DECISION.310 | DECISION | Scope bucket decision | Classer éléments `V1`, `LATER`, `NOT_RECOMMENDED_NOW` | HUM/AI-R | G5 REQUIRED | project scope | STRATEGIC |
| D07.DECISION.320 | DECISION | Packaging / offer hierarchy accepted | Fixer structure d’offre pour IA/content | HUM/AI-R | G5 CONDITIONAL | D09/D10 | MULTI_DOMAIN |
| D07.DECISION.330 | DECISION | Scope trade-offs accepted | Assumer ce qui est sacrifié pour coût, délai, simplicité ou focus | HUM/owner | G5 REQUIRED si arbitrage | project baseline | STRATEGIC |
| D07.SPEC.400 | SPEC | Functional Scope Baseline | Lister inclusions, exclusions, later, dépendances et raisons | dérivé | G5 BLOCKING | D12-D16 | STRATEGIC |
| D07.SPEC.410 | SPEC | Offer Model Specification | Définir offre, hiérarchie, labels, contraintes commerciales utiles | dérivé | G5 REQUIRED commercial | D09/D10/D12 | MULTI_DOMAIN |
| D07.SPEC.420 | SPEC | Non-goals specification | Prévenir dérive au build | dérivé | G5 REQUIRED | handoff | STRATEGIC |
| D07.VERIFY.500 | VERIFY | Scope traceability check | Chaque élément V1 doit avoir objectif/bénéficiaire/justification | TRACEABILITY_CHECK | G8 REQUIRED | Build Ready | MULTI_DOMAIN |
| D07.VERIFY.510 | VERIFY | Scope orphan check | Aucun élément ne doit exister sans dépendances/owner/raison | TRACEABILITY_CHECK | G8 REQUIRED | Build Ready | DOMAIN |
| D07.VERIFY.520 | VERIFY | Over-scope check | Vérifier qu’aucun élément Later/Rejected n’est réintroduit implicitement ailleurs | TRACEABILITY_CHECK | G8 REQUIRED | Build Ready | MULTI_DOMAIN |

---

## Human-only réel

L’humain garde l’autorité sur :

- offres que l’organisation veut réellement pousser/retirer ;
- règles commerciales internes ;
- prix non publics ;
- trade-offs de scope engageant budget/délai/stratégie.

2b2c peut recommander structure, simplification et buckets.

---

## Exit criteria

### G4

La direction retenue a une offre centrale et un macro-scope suffisamment clair pour créer le Project Draft.

### G5 — Product Definition Stable

- V1/Later/Not Recommended explicites ;
- aucune fonction majeure sans valeur/objectif ;
- dépendances structurantes identifiées ;
- non-goals connus ;
- arbitrages structurants acceptés.

---

## Deliverables affectés

A07, A08, A09, A11, A15.

---

## Red-team questions

- une fonctionnalité demandée n’est pas automatiquement V1 ;
- « les concurrents l’ont » n’est pas une justification ;
- une fonctionnalité simple en UI peut créer une lourde dépendance data/legal/ops ;
- offre actuelle ≠ offre future ;
- le scope doit pouvoir réduire l’ambition initiale si cela augmente les chances de réussite.

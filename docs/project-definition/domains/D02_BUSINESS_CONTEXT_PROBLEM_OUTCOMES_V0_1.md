# D02 — Business Context, Problem & Outcomes — V0.1

Statut : **WORKING CANDIDATE — NON CANONIQUE**

Mission : établir pourquoi le projet existe, quel problème/opportunité il traite, quels résultats business et utilisateur sont recherchés et comment juger si une direction est pertinente.

---

## Atoms

| ID | Type | Atom | Pourquoi | Acquisition | Résolution / Gate | Débloque | Change impact |
|---|---|---|---|---|---|---|---|
| D02.INFO.001 | INFO | Identité / nature de l’organisation | Situer le projet dans son contexte réel | RAW/SRC | G1 REQUIRED | business context | DOMAIN |
| D02.INFO.010 | INFO | Secteur / activité | Cibler analyses, audience, concurrence, contraintes | RAW/SRC/WEB/AI-H | G1 REQUIRED | D03/D05 | MULTI_DOMAIN |
| D02.INFO.020 | INFO | Lifecycle de l’organisation | Distinguer création, activité établie, repositionnement | RAW/SRC/AI-H | G1 CONDITIONAL | profondeur de cadrage | DOMAIN |
| D02.INFO.030 | INFO | Déclencheur | Comprendre ce qui motive la démarche | RAW/HUM/AI-H | G1 ENHANCER | contexte/challenge | DOMAIN |
| D02.INFO.040 | INFO | Pourquoi maintenant | Détecter urgence, opportunité ou contrainte temporelle | RAW/HUM | G4 CONDITIONAL | priorisation/décision | DOMAIN |
| D02.INFO.050 | INFO | Problème déclaré | Capturer la perception de l’utilisateur sans la confondre avec un diagnostic | RAW/HUM | G1 REQUIRED | diagnostic | STRATEGIC |
| D02.INFO.060 | INFO | Symptômes observables | Distinguer problème réel, cause et préférence | SRC/AUDIT/CONN/RAW | G2 REQUIRED si existant | evidence | MULTI_DOMAIN |
| D02.INFO.070 | INFO | Cause déclarée | Préserver l’explication humaine sans l’ériger en vérité | RAW/HUM | G1 ENHANCER | challenge | DOMAIN |
| D02.INFO.080 | INFO | Objectif business principal | Donner une fonction mesurable ou décisionnelle au projet | RAW/HUM | G1 BLOCKING | D06/D07/D19 | STRATEGIC |
| D02.INFO.090 | INFO | Objectifs secondaires | Gérer les compromis sans diluer l’objectif principal | RAW/HUM/AI-H | G3 CONDITIONAL | options/trade-offs | MULTI_DOMAIN |
| D02.INFO.100 | INFO | Résultat utilisateur recherché | Relier valeur business et valeur visiteur/utilisateur | RAW/HUM/AI-R | G1 REQUIRED | journeys/value proposition | STRATEGIC |
| D02.INFO.110 | INFO | Comportement / conversion souhaitée | Définir l’action qui matérialise le résultat | CALC/AI-R/HUM | G3 REQUIRED | D08/D09 | MULTI_DOMAIN |
| D02.INFO.120 | INFO | Critères qualitatifs de succès | Savoir comment juger une direction même sans KPI | HUM/AI-R | G4 REQUIRED | compare options | STRATEGIC |
| D02.INFO.130 | INFO | KPI réels disponibles | Éviter pseudo-mesure et exploiter l’existant | CONN/SRC | G2 ENHANCER, G4 CONDITIONAL | baseline/measurement | DOMAIN |
| D02.INFO.140 | INFO | Baseline réelle | Permettre comparaison avant/après | CONN/SRC | G4 CONDITIONAL | D19 | DOMAIN |
| D02.INFO.150 | INFO | Cible chiffrée réelle | Éviter d’inventer des objectifs | HUM/CALC | G4 CONDITIONAL | business case | DOMAIN |
| D02.INFO.160 | INFO | Budget plafond / ordre de grandeur | Écarter une direction irréaliste si la décision dépend du coût | HUM | G4 CONDITIONAL | feasibility/scope | STRATEGIC |
| D02.INFO.170 | INFO | Deadline impérative | Distinguer préférence et contrainte dure | HUM | G4 CONDITIONAL | feasibility/delivery | MULTI_DOMAIN |
| D02.INFO.180 | INFO | Ressources internes disponibles | Évaluer maintenance/contenu/ops réalistes | HUM/SRC | G4 CONDITIONAL | D10/D16 | MULTI_DOMAIN |
| D02.INFO.190 | INFO | Non-objectifs / exclusions stratégiques | Éviter scope creep et faux compromis | HUM/RAW | G3 ENHANCER, G5 REQUIRED si connu | D07 | MULTI_DOMAIN |
| D02.ANALYSIS.200 | ANALYSIS | Problem framing | Séparer problème, symptômes, causes et opportunité | RAW/SRC/AUDIT/AI-H | G1 REQUIRED | G1 | STRATEGIC |
| D02.ANALYSIS.210 | ANALYSIS | Outcome hierarchy | Hiérarchiser objectif principal, secondaires et résultats utilisateur | CALC/AI-R | G3 REQUIRED | D06/D07/D19 | STRATEGIC |
| D02.ANALYSIS.220 | ANALYSIS | Problem-evidence consistency | Vérifier si les données soutiennent ou contredisent le problème déclaré | CROSS_SOURCE_CHECK/AI-H | G2 REQUIRED si evidence disponible | challenge | STRATEGIC |
| D02.ANALYSIS.230 | ANALYSIS | Constraint severity assessment | Distinguer contraintes vraies, souhaits et inconnues | CALC/AI-H | G4 CONDITIONAL | feasibility | MULTI_DOMAIN |
| D02.DECISION.300 | DECISION | Problem / opportunity frame accepté | Fixer le problème utile à résoudre pour l’itération courante | HUM/AI-R | G3 REQUIRED | strategic options | STRATEGIC |
| D02.DECISION.310 | DECISION | Outcome priority | Fixer l’objectif dominant en cas de conflit | HUM | G3/G4 BLOCKING | option selection | STRATEGIC |
| D02.DECISION.320 | DECISION | Contraintes dures retenues | Créer une source de vérité pour feasibility/scope | HUM | G4 CONDITIONAL | D07/D16 | MULTI_DOMAIN |
| D02.SPEC.400 | SPEC | Project outcome contract | Après GO, consigner objectif, user outcome, conversion et success criteria | dérivé des décisions | G5 REQUIRED | project baseline | STRATEGIC |
| D02.VERIFY.500 | VERIFY | Outcome traceability check | Vérifier que scope/UX/contenu servent bien l’objectif retenu | TRACEABILITY_CHECK | G8 REQUIRED | Build Ready | MULTI_DOMAIN |
| D02.VERIFY.510 | VERIFY | Constraint consistency check | Vérifier qu’aucune spec critique ne contredit budget/deadline/contrainte dure | TRACEABILITY_CHECK | G8 CONDITIONAL | Build Ready | MULTI_DOMAIN |

---

## Human-only réel

Normalement humain :

- intention business réelle ;
- priorité entre objectifs ;
- budget autorisé ;
- deadline réellement impérative ;
- ressources internes non observables ;
- non-objectifs politiques/stratégiques.

L’IA peut recommander une formulation du problème ou des critères de succès, mais ne doit pas inventer l’intention interne.

---

## Exit criteria

### G1 — Discovery Foundation

- activité comprise ;
- problème/opportunité suffisamment formulé ;
- objectif business principal exploitable ;
- résultat utilisateur plausible ;
- aucune contradiction critique cachée.

### G3 — Strategic Options

- objectif dominant utilisable comme critère de comparaison ;
- contraintes critiques connues ou explicitement inconnues ;
- options peuvent être jugées sur autre chose que l’esthétique.

### G4 — Idea Decision

- décision possible sur une direction par rapport à l’objectif ;
- budget/délai seulement s’ils sont nécessaires à cette décision ;
- aucun KPI inventé.

---

## Deliverables affectés

A02, A06, A07, A08, A15.

---

## Red-team questions

- « Je veux un site moderne » ne résout ni le problème ni l’objectif ;
- un mauvais taux de conversion observé ne prouve pas sa cause ;
- une urgence déclarée n’est pas automatiquement une deadline dure ;
- absence de KPI ne doit pas bloquer un petit site si des critères qualitatifs suffisent ;
- une forte contrainte budget peut rendre une option non viable avant tout design détaillé.

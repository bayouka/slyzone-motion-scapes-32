# D08 — User Journeys, Conversion & Service Flow — V0.1

Statut : **WORKING CANDIDATE — NON CANONIQUE**

Mission : définir comment les publics arrivent, comprennent, évaluent, se rassurent, agissent et ce qui se passe ensuite — y compris les relais hors site, les fallbacks et les objections critiques.

---

## Atoms

| ID | Type | Atom | Pourquoi | Acquisition | Résolution / Gate | Débloque | Change impact |
|---|---|---|---|---|---|---|---|
| D08.INFO.001 | INFO | Entrées principales dans le parcours | Comprendre où commence réellement l’expérience | D03/D11/D19 | G5 REQUIRED | flow design | MULTI_DOMAIN |
| D08.INFO.010 | INFO | Action principale attendue | Relier parcours et outcome | D02/D07 | G5 REQUIRED | CTA/IA | STRATEGIC |
| D08.INFO.020 | INFO | Actions secondaires | Prévoir alternatives sans diluer CTA principal | D02/D07 | G5 CONDITIONAL | flow design | DOMAIN |
| D08.INFO.030 | INFO | Étapes de décision utilisateur | Structurer progression compréhension → preuve → action | D03/AI-H/AI-R | G5 REQUIRED | D09/D10 | MULTI_DOMAIN |
| D08.INFO.040 | INFO | Objections critiques | Savoir quelles frictions doivent être levées avant action | D03 | G5 REQUIRED | proof/content placement | MULTI_DOMAIN |
| D08.INFO.050 | INFO | Points de preuve nécessaires | Relier objections et réassurance | D03/D04/D10 | G5 REQUIRED | D10/D09 | MULTI_DOMAIN |
| D08.INFO.060 | INFO | Contexte mobile / urgence / local | Ajuster séquence et effort de conversion | D03 | G5 CONDITIONAL | D15/D18 | MULTI_DOMAIN |
| D08.INFO.070 | INFO | Forme de conversion | appel, formulaire, réservation, devis, téléchargement, visite… | D02/D07 | G5 REQUIRED | D12-D14 | STRATEGIC |
| D08.INFO.080 | INFO | Données minimales nécessaires à la conversion | Prévenir sur-collecte et définir le flow | D12/D13/D17 | G7 CONDITIONAL | form spec | MULTI_DOMAIN |
| D08.INFO.090 | INFO | Handoff humain après conversion | Comprendre suite opérationnelle | HUM/SRC | G5 CONDITIONAL | notifications/SLA | MULTI_DOMAIN |
| D08.INFO.100 | INFO | Délai/réponse attendue après conversion | Éviter promesse incohérente | HUM/SRC | G5 CONDITIONAL | content/notifications | DOMAIN |
| D08.INFO.110 | INFO | Fallback de conversion | Prévoir alternative si canal principal échoue | AI-R/HUM | G6 CONDITIONAL | D12/D14 | DOMAIN |
| D08.INFO.120 | INFO | Parcours secondaires légitimes | Servir audiences/offres secondaires sans brouiller principal | D03/D07 | G5 CONDITIONAL | D09 | MULTI_DOMAIN |
| D08.INFO.130 | INFO | Sorties / abandons acceptables | Éviter de forcer un parcours inadapté | AI-R/HUM | G6 ENHANCER | UX | DOMAIN |
| D08.INFO.140 | INFO | Cas de retour / reprise | Prévoir retour après interruption si pertinent | AI-H/AI-R | G6 CONDITIONAL | D12/D15 | DOMAIN |
| D08.ANALYSIS.200 | ANALYSIS | Primary journey map | Ordonner objectifs, besoins, preuve et conversion | AI-R | G5 REQUIRED | IA/content | STRATEGIC |
| D08.ANALYSIS.210 | ANALYSIS | Friction analysis | Identifier effort, confusion, manque de confiance ou rupture | AI-H/AUDIT | G5 REQUIRED redesign | journey improvements | MULTI_DOMAIN |
| D08.ANALYSIS.220 | ANALYSIS | Objection-to-proof mapping | Vérifier que chaque objection critique trouve une réponse crédible | CALC/AI-R | G5 REQUIRED | D10 | MULTI_DOMAIN |
| D08.ANALYSIS.230 | ANALYSIS | CTA hierarchy analysis | Éviter trop de CTA de même poids | AI-R | G5 REQUIRED | D09/D15 | DOMAIN |
| D08.ANALYSIS.240 | ANALYSIS | Service-flow alignment | Vérifier que le site promet ce que l’organisation peut réellement délivrer | D02/D07/HUM + AI-H | G5 REQUIRED si handoff humain | D10/D14 | STRATEGIC |
| D08.ANALYSIS.250 | ANALYSIS | Conversion fallback analysis | Identifier canal alternatif réaliste | AI-R | G6 CONDITIONAL | resilient UX | DOMAIN |
| D08.DECISION.300 | DECISION | Parcours principal retenu | Fixer la séquence de décision dominante | HUM/AI-R | G5 REQUIRED | D09-D12 | STRATEGIC |
| D08.DECISION.310 | DECISION | CTA principal retenu | Créer source de vérité de conversion | HUM/AI-R | G5 REQUIRED | page specs | STRATEGIC |
| D08.DECISION.320 | DECISION | Parcours secondaires retenus | Éviter la multiplication implicite | HUM/AI-R | G5 CONDITIONAL | D09 | MULTI_DOMAIN |
| D08.SPEC.400 | SPEC | Primary User Journey Specification | Définir entrée, étapes, informations, preuve, CTA, résultat | dérivé | G5 REQUIRED | A09 | STRATEGIC |
| D08.SPEC.410 | SPEC | Secondary Flow Specifications | Définir seulement les parcours secondaires utiles | dérivé | G6 CONDITIONAL | A09 | DOMAIN |
| D08.SPEC.420 | SPEC | Conversion & handoff contract | Définir action, données, success, error/fallback et suite opérationnelle | D12-D14 + dérivé | G7 CONDITIONAL | functional spec | MULTI_DOMAIN |
| D08.VERIFY.500 | VERIFY | Journey continuity check | Vérifier qu’aucune étape critique n’est sans suite compréhensible | TRACEABILITY_CHECK | G8 REQUIRED | Build Ready | MULTI_DOMAIN |
| D08.VERIFY.510 | VERIFY | Objection coverage check | Vérifier que les objections critiques sont traitées avant engagement | TRACEABILITY_CHECK | G8 REQUIRED commercial | Build Ready | DOMAIN |
| D08.VERIFY.520 | VERIFY | Conversion fallback check | Vérifier qu’un échec du canal principal n’enferme pas l’utilisateur lorsque fallback requis | TEST/INSPECTION | G8 CONDITIONAL | Build Ready | DOMAIN |

---

## Human-only réel

L’humain est souvent nécessaire pour :

- révéler la suite opérationnelle après un lead ;
- confirmer délais/règles de traitement ;
- arbitrer une hiérarchie d’actions lorsqu’elle reflète une priorité métier.

Le système peut proposer parcours, placement de preuves et simplifications.

---

## Exit criteria

### G5

- parcours principal défini ;
- CTA principal cohérent avec D02 ;
- objections/preuves suffisamment reliées ;
- parcours secondaires seulement si nécessaires ;
- handoff réel compris lorsqu’il existe.

### G6

Le parcours est suffisamment détaillé pour wireframes/page specs sans que le designer invente la logique de conversion.

---

## Deliverables affectés

A09, A10, A11, A12, A15.

---

## Red-team questions

- CTA visible ≠ parcours cohérent ;
- formulaire court n’est pas toujours meilleur si qualification indispensable ;
- un numéro de téléphone peut être le meilleur fallback d’un artisan local ;
- une promesse de réponse « sous 24 h » doit être vraie ;
- plusieurs audiences ne doivent pas nécessairement partager la même entrée ou le même CTA ;
- aucune interaction ne doit devenir obligatoire uniquement parce qu’elle est élégante en design.

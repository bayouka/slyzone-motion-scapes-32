# D06 — Opportunity, Strategy, Value Proposition & Positioning — V0.1

Statut : **WORKING CANDIDATE — NON CANONIQUE**

Mission : transformer compréhension + evidence + marché en **meilleures directions possibles**, challenger l’idée initiale, proposer des alternatives et sélectionner une stratégie défendable avant de détailler le Project.

C’est ici que 2b2c doit réellement pouvoir améliorer l’idée de départ.

---

## Atoms

| ID | Type | Atom | Pourquoi | Acquisition | Résolution / Gate | Débloque | Change impact |
|---|---|---|---|---|---|---|---|
| D06.INFO.001 | INFO | Différenciation déclarée | Conserver ce que l’organisation pense la rendre différente sans le confondre avec evidence | RAW/HUM | G2 ENHANCER | challenge | STRATEGIC |
| D06.INFO.010 | INFO | Opportunités observables | Rassembler gaps, besoins mal servis, forces sous-exploitées | D03/D04/D05 | G3 REQUIRED | option generation | STRATEGIC |
| D06.INFO.020 | INFO | Contraintes stratégiques | Encadrer les options réellement admissibles | D01/D02/D04 | G3 REQUIRED | option generation | STRATEGIC |
| D06.INFO.030 | INFO | Éléments non négociables | Protéger marque/offre/règle réellement imposée | HUM/SRC | G3 CONDITIONAL | option filter | MULTI_DOMAIN |
| D06.INFO.040 | INFO | Risques stratégiques | Éviter options séduisantes mais incohérentes/fragiles | D02/D04/D05/D17 probe | G3 REQUIRED | trade-offs | STRATEGIC |
| D06.INFO.050 | INFO | Hypothèses critiques de stratégie | Rendre explicite ce que l’on suppose sans preuve suffisante | AI-H/CALC | G3 REQUIRED | testing/decision | STRATEGIC |
| D06.ANALYSIS.100 | ANALYSIS | Evidence synthesis | Transformer facts/observations en implications stratégiques | D02-D05 + AI-H | G2 REQUIRED | opportunity map | STRATEGIC |
| D06.ANALYSIS.110 | ANALYSIS | Idea challenge | Tester si la solution initiale répond réellement au problème et à la cible | AI-H/AI-R | G3 REQUIRED | simplification/options | STRATEGIC |
| D06.ANALYSIS.120 | ANALYSIS | Simplification analysis | Chercher une solution plus simple, moins coûteuse ou plus claire | AI-R/CALC | G3 REQUIRED si complexité | option set | STRATEGIC |
| D06.ANALYSIS.130 | ANALYSIS | Expansion / enrichment analysis | Identifier les ajouts qui augmentent réellement la valeur | AI-R | G3 ENHANCER | option set | MULTI_DOMAIN |
| D06.ANALYSIS.140 | ANALYSIS | Alternative-strategy generation | Générer 1..n directions réellement distinctes, y compris différente de l’idée initiale | AI-R | G3 REQUIRED | candidate directions | STRATEGIC |
| D06.ANALYSIS.150 | ANALYSIS | Value proposition candidate synthesis | Relier cible + besoin + offre + preuve + différenciation | AI-R | G3 REQUIRED | positioning/options | STRATEGIC |
| D06.ANALYSIS.160 | ANALYSIS | Positioning candidate analysis | Définir place perçue visée par rapport aux alternatives | AI-R + D05 | G3 REQUIRED commercial | candidate directions | STRATEGIC |
| D06.ANALYSIS.170 | ANALYSIS | Differentiation defensibility | Vérifier que la différence proposée est crédible, utile et soutenable | AI-H + evidence | G3 REQUIRED | recommendation | STRATEGIC |
| D06.ANALYSIS.180 | ANALYSIS | Strategic-fit analysis | Vérifier compatibilité avec objectifs, business model, ressources, marque | CALC/AI-H | G3 REQUIRED | option comparison | STRATEGIC |
| D06.ANALYSIS.190 | ANALYSIS | Option trade-off analysis | Comparer valeur, risque, effort, différenciation, evidence et contraintes | CALC/AI-R | G3 REQUIRED | decision | STRATEGIC |
| D06.ANALYSIS.200 | ANALYSIS | Feasibility-probe request | Identifier les inconnues techniques/légales/coût qui doivent être testées avant décision | CALC/AI-H | G3 CONDITIONAL | D16/D17 probe | MULTI_DOMAIN |
| D06.ANALYSIS.210 | ANALYSIS | Stop / pause rationale analysis | Permettre de conclure honnêtement qu’aucune direction ne mérite encore GO | AI-R | G4 REQUIRED si evidence faible/négative | decision | STRATEGIC |
| D06.ANALYSIS.220 | ANALYSIS | Recommendation Contract | Produire recommandation avec objective, evidence, assumptions, alternatives, trade-offs, risks, confidence et what-could-change-this | AI-R structuré | G4 REQUIRED | A07 | STRATEGIC |
| D06.DECISION.300 | DECISION | Candidate direction retenue pour décision | Identifier option active sans effacer alternatives | HUM/AI-R | G4 REQUIRED | Idea Decision | STRATEGIC |
| D06.DECISION.310 | DECISION | Value proposition accepted current | Créer source de vérité stratégique provisoire/acceptée | HUM/AI-R | G4 REQUIRED commercial | D07-D10 | STRATEGIC |
| D06.DECISION.320 | DECISION | Positioning direction accepted current | Fixer l’orientation stratégique utilisable par Project Definition | HUM/AI-R | G4 REQUIRED si positionnement pertinent | D07/D10/D15 | STRATEGIC |
| D06.DECISION.330 | DECISION | Strategic differentiator accepted | Fixer ce que le projet cherchera réellement à mieux faire | HUM/AI-R | G4 CONDITIONAL | D07-D10 | STRATEGIC |
| D06.DECISION.340 | DECISION | GO / REVISE / DEEPEN / PAUSE / STOP | Décider honnêtement si et quoi poursuivre | Decision Owner | G4 BLOCKING | Project creation ou boucle | BLUEPRINT_LEVEL |
| D06.SPEC.400 | SPEC | Strategic Direction Snapshot | Figer la direction retenue, evidence, assumptions, trade-offs et exclusions au moment du GO | dérivé | G4→G5 REQUIRED | A08 | STRATEGIC |
| D06.VERIFY.500 | VERIFY | Evidence-to-recommendation traceability | Vérifier que chaque recommandation critique remonte à evidence/assumption visible | TRACEABILITY_CHECK | G4 REQUIRED | Idea Decision | STRATEGIC |
| D06.VERIFY.510 | VERIFY | Alternative distinctness check | Vérifier que les « options » ne sont pas de simples variations cosmétiques | INSPECTION | G3 REQUIRED si >1 option | decision quality | DOMAIN |
| D06.VERIFY.520 | VERIFY | No-premature-solution check | Vérifier qu’une structure/design/fonction n’est pas figée avant la stratégie sans justification | TRACEABILITY_CHECK | G4 REQUIRED | clean handoff | MULTI_DOMAIN |
| D06.VERIFY.530 | VERIFY | Recommendation completeness | Vérifier présence alternatives, trade-offs, risks, confidence, what-could-change-this | TRACEABILITY_CHECK | G4 REQUIRED | A07 | DOMAIN |

---

## Human-only réel

L’IA peut générer, challenger, comparer et recommander.

L’humain / Decision Owner doit garder l’autorité sur :

- priorités organisationnelles non observables ;
- éléments réellement non négociables ;
- acceptation des trade-offs structurants ;
- décision finale GO / REVISE / PAUSE / STOP.

Une recommandation IA n’est jamais une décision humaine implicite.

---

## Exit criteria

### G2 — Evidence Context Sufficient

Evidence interne/externe suffisante pour que le challenge ne soit pas une opinion générique.

### G3 — Strategic Options Ready

- idée initiale challengée ;
- au moins une direction défendable, ou conclusion `INSUFFICIENT/STOP` ;
- alternatives importantes considérées ;
- trade-offs explicites ;
- hypothèses critiques visibles ;
- feasibility probes déclenchées si nécessaire.

### G4 — Idea Decision Ready

- Recommendation Contract complet ;
- Decision criteria D01 disponibles ;
- direction sélectionnable ;
- risques/inconnues suffisamment compris ;
- aucune fausse certitude issue de l’IA.

---

## Deliverables affectés

A06, A07, A08, A15.

---

## Red-team questions

- l’idée initiale doit pouvoir être rejetée ou profondément transformée ;
- trois options artificiellement similaires n’apportent rien ;
- « premium » n’est pas un positionnement sans preuve, cible et conséquence ;
- la différenciation ne doit pas être seulement visuelle si le problème est business ;
- une bonne idée théorique peut être STOP si contrainte critique ;
- une direction simple peut être meilleure qu’une idée technologiquement spectaculaire ;
- la recherche n’a de valeur que si elle modifie ou renforce une décision.

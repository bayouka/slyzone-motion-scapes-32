# D05 — Market, Competition, Alternatives & References — V0.1

Statut : **WORKING CANDIDATE — NON CANONIQUE**

Mission : comprendre l’environnement réel dans lequel la proposition devra exister, sans réduire l’analyse à une simple liste de concurrents ni copier des patterns sans justification.

Le domaine doit pouvoir conclure : `RESEARCH_NOT_RELEVANT`, `SUFFICIENT`, `INSUFFICIENT`, ou `NEEDS_DEEPER_PROBE`.

---

## Atoms

| ID | Type | Atom | Pourquoi | Acquisition | Résolution / Gate | Débloque | Change impact |
|---|---|---|---|---|---|---|---|
| D05.INFO.001 | INFO | Marché / terrain de comparaison | Définir ce qui est réellement comparable | D02/D03/D04 + CALC | G2 REQUIRED | recherche fiable | STRATEGIC |
| D05.INFO.010 | INFO | Zone géographique de recherche | Éviter des concurrents hors marché pertinent | D03/RAW/WEB | G2 CONDITIONAL | competitor set | DOMAIN |
| D05.INFO.020 | INFO | Catégorie d’offre comparable | Éviter de comparer des offres différentes | D04/D07 provisoire | G2 REQUIRED | competitor set | STRATEGIC |
| D05.INFO.030 | INFO | Concurrents directs | Comprendre les acteurs visant même cible/besoin | WEB/RAW/SRC | G2 CONDITIONAL selon marché | benchmark | STRATEGIC |
| D05.INFO.040 | INFO | Alternatives indirectes | Comprendre comment le besoin est résolu autrement | WEB/RAW/AI-H | G2 REQUIRED si substitution réelle | opportunity | STRATEGIC |
| D05.INFO.050 | INFO | Non-consommation / statu quo | Identifier le vrai concurrent parfois principal | WEB/AI-H/RAW | G3 ENHANCER | challenge | DOMAIN |
| D05.INFO.060 | INFO | Références exemplaires | Chercher de bons modèles même hors concurrence directe | WEB/RAW | G3 ENHANCER | D06/D15 | DOMAIN |
| D05.INFO.070 | INFO | Cible observée par concurrent | Vérifier à qui chaque acteur parle réellement | WEB/AUDIT/AI-H | G2 REQUIRED | comparison | DOMAIN |
| D05.INFO.080 | INFO | Positionnement observé | Comprendre promesse/différenciation déclarée | WEB/AUDIT/AI-H | G2 REQUIRED | D06 | STRATEGIC |
| D05.INFO.090 | INFO | Offres / services concurrents | Identifier structure d’offre et priorités visibles | WEB/AUDIT | G2 REQUIRED | D06/D07 | MULTI_DOMAIN |
| D05.INFO.100 | INFO | Prix / modèle tarifaire visible | Comparer seulement si public et décisionnel | WEB | G3 CONDITIONAL | feasibility/positioning | DOMAIN |
| D05.INFO.110 | INFO | Architecture / navigation concurrente | Observer patterns d’information | AUDIT/WEB | G3 ENHANCER | D09 | DOMAIN |
| D05.INFO.120 | INFO | CTA / conversion concurrents | Observer comment l’engagement est demandé | AUDIT/WEB | G3 ENHANCER | D08 | DOMAIN |
| D05.INFO.130 | INFO | Preuves / réassurance concurrentes | Comprendre les standards de confiance | AUDIT/WEB | G3 REQUIRED si confiance structurante | D10 | MULTI_DOMAIN |
| D05.INFO.140 | INFO | Fonctionnalités visibles | Identifier besoins couverts, sans assimiler fréquence et nécessité | AUDIT/WEB | G3 ENHANCER | D07/D12 | DOMAIN |
| D05.INFO.150 | INFO | Patterns de contenu | Identifier formats récurrents et manques | AUDIT/WEB/AI-H | G3 ENHANCER | D10 | DOMAIN |
| D05.INFO.160 | INFO | Search intent / présence organique | Comprendre acquisition SEO si pertinente | WEB/tooling | G3 CONDITIONAL | D11 | MULTI_DOMAIN |
| D05.INFO.170 | INFO | Réputation / avis publics | Identifier objections et attentes observables avec prudence | WEB | G3 ENHANCER | D03/D06 | DOMAIN |
| D05.INFO.180 | INFO | Signaux de maturité marché | Distinguer marché homogène, fragmenté, émergent | WEB/AI-H | G3 ENHANCER | strategy | DOMAIN |
| D05.INFO.190 | INFO | Tendances pertinentes | Détecter changement réel seulement s’il peut modifier la décision | WEB | G3 CONDITIONAL | D06 | DOMAIN |
| D05.INFO.200 | INFO | Contraintes/règles sectorielles observables | Repérer signaux qui exigent D17/expert | WEB/SRC | G2 RISK_TRIGGERED | D17 | MULTI_DOMAIN |
| D05.INFO.210 | INFO | Taille/potentiel marché | N’activer que si business case/decision l’exige | WEB/CONN/CALC | G4 DECISIONAL | decision | DOMAIN |
| D05.INFO.220 | INFO | Fraîcheur/date des observations | Empêcher benchmark obsolète | WEB metadata | G2 REQUIRED | confidence | DOMAIN |
| D05.ANALYSIS.300 | ANALYSIS | Competitor relevance scoring | Sélectionner 3–6 acteurs utiles plutôt qu’une liste arbitraire | CALC/AI-H | G2 REQUIRED | research set | DOMAIN |
| D05.ANALYSIS.310 | ANALYSIS | Competitive pattern analysis | Identifier patterns réellement communs | AI-H + evidence | G2 REQUIRED | opportunity map | STRATEGIC |
| D05.ANALYSIS.320 | ANALYSIS | Transferability analysis | Distinguer bonne pratique transférable et imitation inadaptée | AI-H/AI-R | G3 REQUIRED | D06 | STRATEGIC |
| D05.ANALYSIS.330 | ANALYSIS | Competitor strength/weakness analysis | Séparer observation, interprétation et jugement | AI-H + sources | G2 REQUIRED | D06 | STRATEGIC |
| D05.ANALYSIS.340 | ANALYSIS | Gap / opportunity analysis | Identifier besoins/patterns mal couverts | AI-H/AI-R | G3 REQUIRED | D06 | STRATEGIC |
| D05.ANALYSIS.350 | ANALYSIS | Alternative-solution analysis | Comprendre pourquoi un utilisateur peut choisir autre chose qu’un concurrent direct | WEB/AI-H | G3 CONDITIONAL | challenge/value prop | STRATEGIC |
| D05.ANALYSIS.360 | ANALYSIS | Research sufficiency assessment | Arrêter la recherche quand le gain marginal devient faible | CALC/AI-H | G2/G3 REQUIRED | readiness | DOMAIN |
| D05.DECISION.400 | DECISION | Competitive set accepté comme pertinent | Fixer le terrain de comparaison pour cette décision | AI-R/HUM si critique | G2 REQUIRED | A05 | DOMAIN |
| D05.DECISION.410 | DECISION | Patterns retenus à reprendre/éviter | Ne pas copier mécaniquement | AI-R/HUM selon impact | G3 REQUIRED | D06/D07/D09 | MULTI_DOMAIN |
| D05.DECISION.420 | DECISION | Research stop / deepen | Contrôler temps/coût sans sacrifier un blocker | règle/AI-R/HUM si enjeu | G2/G3 REQUIRED | next action | DOMAIN |
| D05.SPEC.500 | SPEC | Market & competitive evidence pack structure | Organiser sources, observations, dates et conséquences | dérivé | G3 REQUIRED | A05/A06 | DOMAIN |
| D05.VERIFY.600 | VERIFY | Source traceability check | Chaque conclusion critique doit remonter à une source/observation | TRACEABILITY_CHECK | G3 REQUIRED | confidence | DOMAIN |
| D05.VERIFY.610 | VERIFY | No-copy fallacy check | Vérifier qu’aucune spec n’est justifiée seulement par « les concurrents le font » | TRACEABILITY_CHECK | G8 REQUIRED | Build Ready | MULTI_DOMAIN |
| D05.VERIFY.620 | VERIFY | Research freshness check | Vérifier que les evidence sensibles au temps ne sont pas stale | INSPECTION | G4/G8 CONDITIONAL | decision/build | DOMAIN |

---

## Règles de recherche

### Quand lancer

La recherche concurrentielle devient pertinente lorsque :

- problème/objectifs assez compris ;
- cible/segment suffisamment ciblé ;
- offre/catégorie comparable identifiée ;
- zone/marché connue si elle change la concurrence.

Elle peut démarrer avec hypothèses réversibles mais ne doit pas figer une conclusion stratégique si le terrain de comparaison reste ambigu.

### Profondeur par défaut

Pour un site vitrine commercial classique :

- 3 à 6 concurrents directs pertinents ;
- alternatives indirectes si elles changent réellement le choix utilisateur ;
- 2 à 3 références exemplaires si elles apportent un pattern transférable.

Ce sont des heuristiques de recherche, jamais un quota de conformité.

### Stop condition

Arrêter lorsque :

- les principaux patterns sont stables ;
- les nouvelles sources n’apportent plus de conséquence significative ;
- les questions stratégiques actives sont suffisamment éclairées ;
- approfondir ne changerait probablement ni Candidate ni décision.

---

## Human-only réel

Peu d’éléments sont intrinsèquement human-only.

L’humain est utile pour :

- signaler des concurrents qu’il connaît et que le web révèle mal ;
- préciser un marché/segment interne non évident ;
- expliquer pourquoi un concurrent apparent n’est en réalité pas comparable ;
- arbitrer si une direction stratégique issue du benchmark est acceptable pour l’organisation.

2b2c doit trouver lui-même les concurrents publics lorsque possible.

---

## Exit criteria

### G2 — Evidence Context Sufficient

- terrain de comparaison défendable ;
- sources et dates traçables ;
- concurrents/alternatives pertinents ou justification `NOT_RELEVANT` ;
- aucune conclusion critique fondée sur une seule observation fragile lorsque d’autres sources sont accessibles.

### G3 — Strategic Options Ready

Le benchmark a été transformé en conséquences :

- patterns utiles ;
- erreurs/faiblesses ;
- gaps/opportunités ;
- éléments non transférables ;
- implications pour positionnement, offre, parcours ou scope.

### G4 — Idea Decision

La décision ne dépend pas d’un « rapport concurrentiel complet », mais de l’evidence suffisante pour distinguer les options.

---

## Deliverables affectés

A05, A06, A07, A10, A15.

---

## Red-team questions

- aucun concurrent direct identifiable ≠ aucune alternative ;
- marché local : les grands acteurs nationaux peuvent être des références mais pas des concurrents de conversion ;
- site concurrent visuellement impressionnant ≠ modèle performant ;
- fréquence d’une fonctionnalité ≠ preuve qu’elle est utile ;
- avis publics sont des signaux biaisés, pas une étude représentative ;
- tendances sans conséquence décisionnelle = bruit ;
- benchmark obsolète doit pouvoir devenir `STALE` ;
- research doit pouvoir conclure que la meilleure différenciation est de **ne pas** copier le marché.

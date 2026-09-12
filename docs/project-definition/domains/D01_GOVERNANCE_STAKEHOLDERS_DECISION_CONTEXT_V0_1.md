# D01 — Governance, Stakeholders & Decision Context — V0.1

Statut : **WORKING CANDIDATE — NON CANONIQUE**

Mission : savoir qui porte l’Idea/Project, qui peut décider, quels critères de décision comptent, quelles sources font autorité et comment les changements/conflits seront arbitrés.

Ce domaine ne doit pas imposer de gouvernance lourde à un utilisateur solo.

---

## Atoms

| ID | Type | Atom | Pourquoi | Acquisition | Résolution / Gate | Débloque | Change impact |
|---|---|---|---|---|---|---|---|
| D01.INFO.001 | INFO | Porteur / organisation responsable | Identifier le sujet auquel l’Idea appartient | RAW/SRC | G1 REQUIRED | attribution du dossier, contexte business | DOMAIN |
| D01.INFO.010 | INFO | Mode de décision solo / équipe / client | Savoir si une décision peut être prise seul | RAW/AI-H/HUM | G4 CONDITIONAL | gouvernance adaptée, validation | MULTI_DOMAIN |
| D01.INFO.020 | INFO | Decision owner | Savoir qui a autorité finale | HUM/SRC | G4 BLOCKING si équipe | Idea Decision Record | STRATEGIC |
| D01.INFO.030 | INFO | Contributeurs / reviewers | Savoir qui apporte expertise ou avis sans décider | RAW/HUM | G4 ENHANCER, G8 CONDITIONAL | collecte ciblée, review | DOMAIN |
| D01.INFO.040 | INFO | Parties impactées | Éviter de définir un projet sans acteur clé | RAW/SRC/AI-H | G5 CONDITIONAL | exigences/risques spécifiques | MULTI_DOMAIN |
| D01.INFO.050 | INFO | Date réelle de décision | Identifier urgence décisionnelle sans inventer de deadline | HUM | G4 CONDITIONAL | profondeur/ordre des analyses | DOMAIN |
| D01.INFO.060 | INFO | Contraintes de validation externe | Client, direction, comité, régulateur, juridique… | RAW/SRC/HUM | G4/G8 CONDITIONAL | review/expert escalation | MULTI_DOMAIN |
| D01.INFO.070 | INFO | Sources de vérité disponibles | Savoir quels docs/données/contrats font foi | SRC/HUM | G1 REQUIRED si sources multiples | provenance/conflict resolution | MULTI_DOMAIN |
| D01.INFO.080 | INFO | Hiérarchie d’autorité entre sources | Résoudre les contradictions sans improviser | HUM/règle déterministe | G2 CONDITIONAL | evidence fiable | STRATEGIC |
| D01.INFO.090 | INFO | Historique de décisions existantes | Ne pas réouvrir inconsciemment des arbitrages déjà actés | SRC/MEM | G1 ENHANCER, G5 REQUIRED si project existant | baseline fiable | MULTI_DOMAIN |
| D01.INFO.100 | INFO | Restrictions de confidentialité / partage | Empêcher une recherche ou collaboration inappropriée | HUM/SRC | G1 CONDITIONAL | politique d’accès/recherche | MULTI_DOMAIN |
| D01.INFO.110 | INFO | Tolérance aux inconnues | Savoir qui peut accepter un unknown et à quel niveau | HUM | G4/G8 CONDITIONAL | accepted unknown | DOMAIN |
| D01.INFO.120 | INFO | Pouvoir de dépense / budget approval | Distinguer budget indicatif et enveloppe autorisée | HUM/SRC | G4 CONDITIONAL si budget décisionnel | faisabilité/scoping | MULTI_DOMAIN |
| D01.INFO.130 | INFO | Méthode d’arbitrage en cas de désaccord | Éviter les blocages d’équipe | HUM | G4 CONDITIONAL | conflict resolution | DOMAIN |
| D01.ANALYSIS.200 | ANALYSIS | Stakeholder map | Distinguer décideur, contributeur, impacté, expert | CALC/AI-H | G4 CONDITIONAL | plan de décision | DOMAIN |
| D01.ANALYSIS.210 | ANALYSIS | Decision-context assessment | Déterminer quelles preuves/outputs sont nécessaires pour la décision réelle | CALC/AI-R | G1→G4 REQUIRED | Decision Requirements | STRATEGIC |
| D01.ANALYSIS.220 | ANALYSIS | Source-authority conflict analysis | Détecter documents/règles contradictoires | CALC/AI-H | G2 CONDITIONAL | arbitrage explicite | MULTI_DOMAIN |
| D01.DECISION.300 | DECISION | Decision Question active | Fixer la question exacte à laquelle le dossier doit permettre de répondre | HUM/AI-R | G4 BLOCKING | readiness décisionnelle | STRATEGIC |
| D01.DECISION.310 | DECISION | Decision owner confirmé | Autoriser l’acte de GO/REVISE/PAUSE/STOP | HUM | G4 BLOCKING si équipe | Idea decision | STRATEGIC |
| D01.DECISION.320 | DECISION | Source precedence rule active | Définir quelle source prévaut en conflit | HUM/règle | G2 CONDITIONAL | evidence fiable | MULTI_DOMAIN |
| D01.DECISION.330 | DECISION | Unknown accepté | Consigner qu’une incertitude peut rester ouverte sans bloquer | HUM/owner | G4/G8 CONDITIONAL | passage Gate | LOCAL→MULTI |
| D01.SPEC.400 | SPEC | Project source-of-truth policy | Définir où vivent décisions/specs actives après GO | AI-R/HUM | G5 REQUIRED | change control/handoff | MULTI_DOMAIN |
| D01.SPEC.410 | SPEC | Change approval policy | Définir qui peut modifier une décision figée et comment | AI-R/HUM | G8 CONDITIONAL | versioning/handoff | MULTI_DOMAIN |
| D01.VERIFY.500 | VERIFY | Decision authority check | Vérifier qu’aucun GO/Freeze n’a été pris sans autorité | TRACEABILITY_CHECK | G4 BLOCKING | Idea freeze | STRATEGIC |
| D01.VERIFY.510 | VERIFY | Source-of-truth consistency check | Vérifier qu’aucune source active contradictoire n’est silencieusement conservée | TRACEABILITY_CHECK | G8 REQUIRED | Build Ready | MULTI_DOMAIN |

---

## Human-only réel

L’humain est normalement requis pour :

- désigner qui tranche lorsque cela n’est pas évident ;
- arbitrer une contradiction d’autorité ;
- accepter une inconnue importante ;
- confirmer une contrainte politique/interne non observable ;
- décider GO / REVISE / PAUSE / STOP.

2b2c peut inférer une gouvernance probable, mais ne doit jamais inventer un pouvoir de décision.

---

## Exit criteria

### G1 — Discovery foundation

Le dossier connaît au minimum le porteur et sait si le contexte de décision est solo ou potentiellement collectif.

### G4 — Idea Decision Ready

- Decision Question explicite ;
- Decision owner connu si nécessaire ;
- conflits d’autorité critiques résolus ;
- inconnues importantes acceptées par une autorité légitime ou encore blocking.

### G8/G9 — Build Ready

- sources de vérité projet identifiées ;
- changements structurants versionnés ;
- aucun conflit actif critique entre specs/documents ;
- authority/approval des décisions structurantes traçable.

---

## Deliverables affectés

A01, A07, A08, A14, A15.

---

## Red-team questions

- utilisateur solo : le domaine doit rester presque invisible ;
- agence travaillant pour un client : distinguer utilisateur de 4b4c et décideur réel ;
- deux associés en désaccord : ne pas fusionner leurs positions ;
- décision déjà prise avant 4b4c : l’enregistrer comme source actuelle, mais la challenger seulement si son statut l’autorise ;
- document contractuel vs note ancienne : ne jamais laisser l’IA choisir silencieusement.

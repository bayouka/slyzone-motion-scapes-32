# 4b4c — REQUIREMENT ATOM SCHEMA — V0.1

Date : 2026-09-13

Statut : **WORKING CANDIDATE — NON CANONIQUE**

Ce schéma normalise le remplissage du référentiel `Idea → Project Definition → Ready for Development`.

Il implémente l’architecture candidate `PROJECT_DEFINITION_REFERENCE_ARCHITECTURE_V0_2.md`.

---

## 1. But

Le référentiel ne doit pas devenir une liste de questions. Chaque entrée représente un objet professionnel nécessaire pour comprendre, analyser, décider, spécifier ou vérifier.

Types autorisés :

- `INFO` — fait, déclaration, préférence, contrainte ou donnée ;
- `ANALYSIS` — interprétation/diagnostic produit à partir d’inputs ;
- `DECISION` — arbitrage créant une source de vérité active ;
- `SPEC` — définition de ce qui doit être construit/respecté ;
- `VERIFY` — condition/test permettant de prouver qu’une exigence est satisfaite.

Invariant : une exigence structurante doit pouvoir être tracée au minimum vers sa justification et, lorsqu’elle devient une exigence de build, vers sa spécification et sa vérification.

---

## 2. Identifiant

Format :

`Dxx.<TYPE>.<NNN>`

Exemples :

- `D03.INFO.010` — audience primaire ;
- `D05.ANALYSIS.040` — analyse de patterns concurrents ;
- `D07.DECISION.030` — scope macro retenu ;
- `D12.SPEC.120` — comportement d’un formulaire ;
- `D18.VERIFY.060` — contrôle clavier.

L’ID est stable. Un libellé peut évoluer sans changer l’identité de l’atom.

---

## 3. Champs obligatoires

Chaque atom doit documenter :

- `id`
- `type`
- `domain_id`
- `lifecycle_zone`: `IDEA_DECISION` / `PROJECT_DEFINITION` / `BUILD_READY` / `CROSS`
- `title`
- `statement_or_question`
- `purpose`
- `risk_if_missing`
- `applicability`
- `dependencies`
- `acquisition_paths`
- `human_only_reason` si applicable
- `decision_authority` si applicable
- `evidence_required`
- `minimum_resolution_by_gate`
- `unlocks`
- `deliverables_affected`
- `defer_policy`
- `accepted_unknown_policy`
- `freshness_policy`
- `conflict_policy`
- `change_impact`
- `validation_method`

Champs optionnels selon nature :

- `owner`
- `expert_escalation_rule`
- `sensitivity_class`
- `implementation_discretion`
- `examples`
- `notes`

---

## 4. Acquisition paths

Valeurs standard :

- `MEM` — mémoire active ;
- `RAW` — texte/réponse utilisateur ;
- `SRC` — document/image/lien/source fournie ;
- `AUDIT` — inspection automatique d’un site/système ;
- `WEB` — recherche publique ;
- `CONN` — donnée privée connectée ;
- `CALC` — calcul/dérivation déterministe ;
- `AI-H` — hypothèse IA réversible ;
- `AI-R` — recommandation IA ;
- `HUM` — humain seul sait/arbitre ;
- `EXPERT` — expertise externe requise ;
- `ACCEPTED_UNKNOWN` — inconnue explicitement acceptée.

Règle : la présence d’un chemin `HUM` ne signifie pas que l’utilisateur doit être interrogé immédiatement. La question humaine est le dernier recours lorsque le niveau de résolution nécessaire ne peut pas être atteint autrement.

---

## 5. Niveaux de résolution

Valeurs de base :

- `UNKNOWN`
- `RAW_DECLARED`
- `SOURCE_BACKED`
- `AUDIT_BACKED`
- `WORKING_ASSUMPTION`
- `AI_RECOMMENDED`
- `ACCEPTED_CURRENT`
- `HUMAN_VALIDATED`
- `HUMAN_DECIDED`
- `EXPERT_VALIDATED`
- `ACCEPTED_UNKNOWN`
- `CONFLICTED`
- `STALE`
- `NOT_RELEVANT`

Le niveau requis dépend de la Gate et du contexte.

Exemple : une audience peut être `WORKING_ASSUMPTION` pour lancer une recherche exploratoire, mais exiger `HUMAN_DECIDED` avant de figer un positionnement structurant.

---

## 6. Criticité par Gate

Valeurs :

- `BLOCKING`
- `REQUIRED`
- `CONDITIONAL`
- `ENHANCER`
- `NOT_RELEVANT`

La criticité n’est jamais globale.

Chaque atom doit indiquer uniquement les Gates où il joue un rôle significatif : `G0…G9` selon `PROJECT_DEFINITION_REFERENCE_ARCHITECTURE_V0_2.md`.

---

## 7. Applicability

Chaque atom appartient à l’une de ces classes :

- `CORE` — applicable presque toujours au Blueprint ;
- `CONTEXTUAL` — activé par un contexte (`IS_REDESIGN`, `HAS_CMS`, `IS_MULTILINGUAL`, etc.) ;
- `DECISIONAL` — activé parce qu’une décision donnée l’exige ;
- `RISK_TRIGGERED` — activé par un risque ;
- `DELIVERY_PROFILE` — dépend du mode d’exécution et doit rester hors du cœur universel.

---

## 8. Relation et dépendances

Relations standard :

- `REQUIRES`
- `BENEFITS_FROM`
- `CONDITIONAL_ON`
- `DERIVED_FROM`
- `EVIDENCES`
- `CONFLICTS_WITH`
- `SATISFIED_BY`
- `SPECIFIED_BY`
- `VERIFIED_BY`
- `INVALIDATES`
- `SUPERSEDES`

Une dépendance doit décrire le **niveau minimum** nécessaire, pas seulement l’ID.

Exemple :

`D05.ANALYSIS.040 REQUIRES D03.INFO.010 >= ACCEPTED_CURRENT`.

---

## 9. Change Impact

Chaque atom doit préciser ce qui devient potentiellement invalide s’il change.

Catégories :

- `LOCAL`
- `DOMAIN`
- `MULTI_DOMAIN`
- `STRATEGIC`
- `BLUEPRINT_LEVEL`

Le changement ne déclenche jamais automatiquement une réanalyse totale.

Exemple : modifier une couleur préférée est généralement `LOCAL`; passer de B2C à B2B est `STRATEGIC` et peut invalider audience, marché, positionnement, parcours, contenu, scope et certaines décisions techniques.

---

## 10. Validation Method

Valeurs possibles :

- `SOURCE_CHECK`
- `CROSS_SOURCE_CHECK`
- `AUDIT`
- `CALCULATION`
- `HUMAN_CONFIRMATION`
- `HUMAN_DECISION`
- `EXPERT_REVIEW`
- `TEST`
- `INSPECTION`
- `TRACEABILITY_CHECK`
- `NO_VALIDATION_NEEDED`

---

## 11. Règle d’écriture

Chaque atom doit être compréhensible indépendamment d’un écran ou d’un parcours UX.

Interdit :

- `Demander à l’utilisateur si…` comme définition de l’atom ;
- `Étape suivante` ;
- une question sans objectif ni dépendance ;
- une donnée présentée comme obligatoire sans contexte ;
- une sortie IA promue en vérité sans niveau de confiance ;
- une exigence de build sans validation/test possible lorsqu’elle est critique.

---

## 12. Template compact

```yaml
id: Dxx.TYPE.NNN
type: INFO | ANALYSIS | DECISION | SPEC | VERIFY
domain_id: Dxx
lifecycle_zone: IDEA_DECISION | PROJECT_DEFINITION | BUILD_READY | CROSS
title: ...
statement_or_question: ...
purpose: ...
risk_if_missing: ...
applicability: CORE | CONTEXTUAL | DECISIONAL | RISK_TRIGGERED
dependencies: ...
acquisition_paths: ...
human_only_reason: ...
decision_authority: ...
evidence_required: ...
minimum_resolution_by_gate: ...
unlocks: ...
deliverables_affected: ...
defer_policy: ...
accepted_unknown_policy: ...
freshness_policy: ...
conflict_policy: ...
change_impact: ...
validation_method: ...
```

---

## 13. Quality Gate du registre

Un Domain n’est pas considéré rempli tant que :

1. ses INFO critiques sont recensées ;
2. ses analyses professionnelles nécessaires sont explicites ;
3. les décisions humaines/IA sont séparées ;
4. les SPEC aval sont identifiées ;
5. les VERIFY nécessaires sont identifiés ;
6. chaque atom indique ses dépendances et son impact de changement ;
7. les conditions d’applicabilité évitent le sur-cadrage ;
8. un test novice confirme que le registre n’implique pas autant de questions visibles que d’atoms internes.

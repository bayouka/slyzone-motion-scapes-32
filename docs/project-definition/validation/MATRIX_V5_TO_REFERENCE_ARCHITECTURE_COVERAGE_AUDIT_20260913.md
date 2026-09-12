# 4b4c — COVERAGE AUDIT — MATRIX V5 → PROJECT DEFINITION REFERENCE

Date : 2026-09-13

Statut : **VALIDATION SUPPORT**

But : vérifier que le passage de Matrix V5 à un référentiel `Idea → Project Definition → Ready for Development` ne supprime pas de besoins valides et identifier ce qui doit être déplacé, approfondi ou ajouté.

---

# 1. Verdict global

Matrix V5 reste une excellente source de besoins `IDEA` et de règles d'acquisition, mais elle ne couvre pas suffisamment le `PROJECT_DEFINITION / BUILD_READY` détaillé.

Aucun grand domaine Idea essentiel de V5 n'est perdu dans D01→D07.

En revanche, plusieurs éléments de V5 doivent être :

- **préservés comme atoms** ;
- **déplacés vers Project Definition** lorsqu'ils étaient trop tôt dans l'Idea ;
- **approfondis** pour devenir des specs vérifiables ;
- **reliés à des décisions et à des VERIFY**, ce que V5 ne faisait pas systématiquement.

---

# 2. Mapping des domaines V5

| Matrix V5 | Nouveau domaine | Statut |
|---|---|---|
| Contexte | D02 + D04 + overlays | PRESERVED |
| Problème / opportunité | D02 | PRESERVED + strengthened |
| Objectifs / résultats | D02 + D19 | PRESERVED + split outcome/instrumentation |
| Audience | D03 | PRESERVED + strengthened multi-actor |
| Offre / valeur | D04 + D06 + D07 | PRESERVED + separated current vs recommended |
| Existant / assets | D04 | PRESERVED |
| Concurrence / références | D05 | STRENGTHENED |
| Diagnostic / evidence | D04 + D05 + D06 | PRESERVED as ANALYSIS |
| Positionnement | D06 | STRENGTHENED |
| Parcours / conversion | D02 macro + D08 Project | SPLIT by lifecycle |
| Structure / contenu | D09 + D10 Project | MOVED mainly to Project |
| Fonctionnalités / scope | D07 macro + D12 Project | SPLIT macro/detail |
| Design / marque | D04 constraint + D15 Project | SPLIT constraint/design definition |
| Faisabilité / contraintes | D02 + D06 probe + D16/D17 Project | SPLIT by decision depth |
| Économie / impact | D02/D19 conditional | PRESERVED conditional |
| Risques / inconnues | all domains + risk atoms | STRENGTHENED cross-cutting |
| Gouvernance / décision | D01 + D06 | STRENGTHENED |
| Présentation / atelier | projection/deliverable behavior, not core domain | RECLASSIFIED |

---

# 3. Matrix V5 atoms à préserver explicitement dans IDEA

## Context / organisation
- raw description + original wording/provenance ;
- organisation identity ;
- sector/activity ;
- creation vs redesign ;
- existing site URL ;
- organisation lifecycle ;
- primary geography ;
- why now / trigger.

### Note
`geo.country` doit survivre au moins comme context/jurisdiction signal conditionnel. Il peut alimenter D05 et D17.

`language.required` n'est pas forcément nécessaire à G4, mais doit être conservé comme context signal pour Project Definition lorsque connu.

## Problem / outcomes
Tous les besoins V5 sont couverts dans D02 : objective, secondary objectives, problem, opportunity, user outcome, conversion, qualitative criteria, KPI/baseline/target conditionnels.

### Ajout nouveau
`decision.question` manque à V5 comme atom central explicite et doit être ajouté.

## Audience
V5 est préservée et enrichie :
- primary/secondary ;
- model ;
- segment ;
- geography ;
- needs ;
- objections ;
- knowledge ;
- usage context ;
- behavior data.

### Ajout nouveau
- buyer / decision-maker ;
- beneficiary/user ;
- influencer/gatekeeper conditionnel.

Ces distinctions sont importantes pour B2B et services à plusieurs acteurs.

## Offer / value
V5 est préservée mais séparée :
- `offer.catalog/current_validity/proofs` → D04 current state ;
- `offer.priority/to_grow/to_reduce` → D07 strategic intent ;
- declared difference → D04/D06 ;
- observable difference → D05/D06 ;
- candidate positioning/value proposition → D06.

Cette séparation réduit le risque de présenter une déclaration interne comme une différence marché prouvée.

## Existing / assets
Tous les besoins significatifs sont conservés dans D04.

### Déplacement
Le détail `content available/missing`, asset placement, final owner, etc. est principalement D10 après GO.

## Market / competition
Matrix V5 est renforcée :
- terrain de comparaison explicite ;
- concurrents directs ;
- indirect alternatives ;
- non-consumption/DIY si pertinent ;
- exemplars ;
- positioning/offers/messages ;
- CTA/proof/content/features ;
- opportunities/weaknesses ;
- research sufficiency / stopping rule ;
- selection relevance ;
- invalidation si cible/zone/offre change.

### Correction de criticité
La concurrence ne doit ni être toujours obligatoire ni rester simple enhancer par défaut. Un Requirement `MARKET_CONTEXT_SUFFICIENT_FOR_STRATEGY` doit être satisfait d'une manière adaptée au contexte.

## Diagnostic / evidence
V5 possède déjà le bon principe `SOURCE → OBSERVATION → INTERPRETATION → CONSEQUENCE`.

Le nouveau référentiel le conserve mais transforme les diagnostics en `ANALYSIS atoms` traçables et ajoute :
- conflict groups ;
- evidence sufficiency ;
- source freshness ;
- research stopping rule ;
- invalidation edges.

## Positioning / directions
V5 est conservée et approfondie dans D06 :
- value proposition candidate ;
- main message candidate ;
- offer hierarchy ;
- differentiation candidate ;
- alternatives ;
- trade-offs ;
- recommendation ;
- decision.

### Ajout nouveau
- original idea challenge explicite ;
- simplification analysis ;
- risky assumption analysis ;
- option comparison ;
- non-goals ;
- early STOP/PAUSE path.

---

# 4. Éléments V5 à déplacer principalement en PROJECT_DEFINITION

Les éléments suivants sont valides, mais ne doivent pas tous être exigés avant GO :

- detailed user journey ;
- sitemap/page model ;
- detailed page roles ;
- content requirements ;
- provisional/final copy ;
- detailed feature specs ;
- design direction finalisée ;
- wireframes suffisamment complets ;
- budget/timeline de delivery si non nécessaires à la décision Idea ;
- detailed technical constraints ;
- CMS/data model ;
- legal/privacy implementation ;
- presentation deck details ;
- full handoff.

Ils appartiennent désormais aux D08→D20 avec possibilité de `probe` en Idea seulement s'ils peuvent renverser la décision.

---

# 5. Besoins importants absents ou trop faibles dans V5

Pour `READY_FOR_DEVELOPMENT`, il faut ajouter explicitement :

1. functional requirements atomiques ;
2. business rules ;
3. preconditions/triggers ;
4. loading/empty/error/success states ;
5. edge cases/fallbacks ;
6. data entities/relationships/lifecycle ;
7. roles/permissions ;
8. content model/CMS governance ;
9. integration contracts/API/webhooks ;
10. notifications/email behavior ;
11. security/privacy implementation requirements ;
12. accessibility target and testability ;
13. performance/reliability/compatibility requirements ;
14. technical architecture decision ;
15. environments/configuration/operational ownership ;
16. acceptance criteria ;
17. requirement→spec→verify traceability ;
18. test strategy ;
19. implementation discretion ;
20. handoff manifest/source-of-truth map ;
21. decision authority/status ;
22. explicit non-goals ;
23. content readiness model instead of requiring all final content ;
24. delivery profile overlays distinct from universal product requirements.

---

# 6. Éléments de Matrix V5 qu'il faut conserver comme principes globaux

Les règles suivantes sont considérées comme solides et doivent être réutilisées dans le nouveau système :

- full internal registry ≠ visible questionnaire ;
- acquisition humain en dernier recours ;
- prefill ≠ freeze ;
- AI inference ≠ human truth ;
- accepted unknown possible ;
- provenance/freshness ;
- conflict preservation ;
- readiness relative à l'output/décision ;
- research only when it can change an output/decision ;
- no fake global completion percentage ;
- no GO bias ;
- stale-safe change handling.

---

# 7. Corrections nécessaires au Requirement Registry IDEA V0.1

Avant V0.2, ajouter :

- `decision.question` ;
- `decision.status/validation evidence` ;
- `audience.influencer_gatekeeper` conditionnel ;
- `context.jurisdiction/country` conditionnel ;
- `context.language_signal` si connu ;
- `market.research_sufficiency` ;
- explicit conflict group support ;
- regulatory critical risk probe ;
- explicit non-goals ;
- research invalidation edges ;
- early STOP/PAUSE/INSUFFICIENT readiness path.

---

# 8. Verdict

**Matrix V5 ne doit pas être supprimée.** Elle devient une source canonique historique/actuelle à migrer progressivement vers le nouveau système après validation.

La nouvelle architecture est plus complète pour le cycle jusqu'à `READY_FOR_DEVELOPMENT` et ne perd pas les besoins significatifs de V5 dans la zone Idea.

Recommandation : produire Requirement Registry IDEA V0.2 avec les corrections listées, puis commencer D08→D20 en s'appuyant sur le PDF utilisateur comme coverage source, mais sans reprendre son ordre de production comme vérité universelle.

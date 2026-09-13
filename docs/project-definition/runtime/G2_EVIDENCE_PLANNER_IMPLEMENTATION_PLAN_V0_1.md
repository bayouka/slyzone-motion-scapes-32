# 4b4c / 2b2c — G2 Evidence / Market Planner — Implementation Plan V0.1

Date : 2026-09-13

Statut : **CANDIDATE DESIGN — NON ACTIVE — AUCUNE MIGRATION / COMMANDE WORKER G2**

## 1. Objet

Définir le futur planner déterministe de `G2_EVIDENCE_CONTEXT_SUFFICIENT` en réutilisant le runtime R1→R3, le candidat Blueprint `SITE_VITRINE@0.5`, les Action Runs research atomiques et la policy AI/Human existante.

Ce document ne remplace pas le Blueprint et n'active pas G2.

Invariant :

> `Requirement unresolved ≠ question utilisateur` et `evidence missing ≠ user must research it`.

Le planner doit produire la prochaine action utile à partir de l'état canonique. Il ne doit pas dérouler une checklist G2 séquentielle.

---

## 2. Requirements G2 pilotés

Noyau Gate :
- `SV.D03.PRIMARY_NEED` — minimum `WORKING_ASSUMPTION` ;
- `SV.D04.EVIDENCE_QUALITY` — minimum `CALCULATED` ;
- `SV.D05.MARKET_CONTEXT` — minimum `CALCULATED` ;
- `SV.D05.PATTERN_GAP_SYNTHESIS` — minimum `AI_RECOMMENDATION` ;
- `SV.D05.RESEARCH_SUFFICIENCY` — minimum `CALCULATED`, BLOCKING.

Conditionnels / contexte :
- `SV.D04.EXISTING_SITE` ;
- `SV.D04.EXISTING_AUDIT` — `OBSERVED` lorsqu'une refonte/site existant est applicable ;
- `SV.D05.COMPETITOR_SET` — `SOURCE_BACKED` seulement lorsque la preuve concurrentielle est matériellement utile ;
- `SV.D03.OBJECTIONS_TRUST` — enhancer, jamais bloquant par lui-même.

---

## 3. Graphe de dépendances runtime obligatoire

Le planner doit appliquer les dépendances comme préconditions, pas seulement dans les fingerprints :

- `PRIMARY_NEED <- PRIMARY_AUDIENCE` ;
- `EXISTING_AUDIT <- EXISTING_SITE` ;
- `MARKET_CONTEXT <- ORG_CONTEXT + PRIMARY_AUDIENCE + OFFER_BASELINE` ;
- `COMPETITOR_SET <- MARKET_CONTEXT` ;
- `PATTERN_GAP_SYNTHESIS <- COMPETITOR_SET OR EXISTING_AUDIT` ;
- `RESEARCH_SUFFICIENCY <- PATTERN_GAP_SYNTHESIS OR EXISTING_AUDIT`.

Une action dépendante est inéligible tant que son socle n'est pas utilisable. Une valeur déjà présente ne contourne pas une dépendance devenue stale/conflicted.

---

## 4. Calcul déterministe de `competitive_evidence_material`

Le caller et le LLM ne peuvent pas définir librement ce booléen.

### TRUE par défaut

La preuve concurrentielle est matérielle si :
- création/greenfield ;
- pas d'audit existant current `OBSERVED` ;
- evidence quality absente/stale/conflicted ;
- un besoin explicite de comparaison marché current est présent ;
- un `COMPETITOR_SET` source-backed current existe déjà et doit rester dans le graphe ;
- une contradiction/gap de marché ne peut pas être résolu sans comparaison externe.

### FALSE admissible

Seulement si toutes les conditions suivantes sont vraies :
- refonte/site existant ;
- `EXISTING_AUDIT = RESOLVED` avec niveau `OBSERVED` ;
- `EVIDENCE_QUALITY = RESOLVED` avec niveau `CALCULATED` ;
- aucune obligation explicite current de comparaison marché ;
- aucune contradiction critique nécessitant une triangulation externe ;
- `PATTERN_GAP_SYNTHESIS` peut rester défendable à partir de l'audit current.

Une indisponibilité WEB n'est jamais une raison pour rendre la recherche non matérielle.

---

## 5. Materiality fact — provenance

Le futur moteur peut matérialiser un fait calculé interne :

`research.competitive_evidence_material`

Il doit être dérivé uniquement de l'état canonique et de règles versionnées. S'il est persisté, provenance `SYSTEM_CALCULATED`, avec fingerprint des inputs.

Un signal explicite `research.market_comparison_required=true` peut provenir d'un Information Item current, mais l'origine doit être traçable (human/source/system). Une sortie libre d'un modèle n'est pas une autorité suffisante pour forcer ou supprimer la recherche.

---

## 6. Policy d'acquisition G2

Ordre logique, sans imposer un pipeline :

`MEM → RAW → SRC/AUDIT → CONN/WEB → CALC → AI_H → AI_R → HUM → ACCEPTED_UNKNOWN`.

Chaque Requirement possède ses paths propres :

| Requirement | Paths préférés |
|---|---|
| PRIMARY_NEED | RAW → SRC → WEB → CONN → AI_H |
| OBJECTIONS_TRUST | SRC → WEB → CONN → AI_H |
| EXISTING_AUDIT | AUDIT → SRC → CONN → AI_H |
| EVIDENCE_QUALITY | CALC → AI_H |
| MARKET_CONTEXT | CALC → WEB → AI_H |
| COMPETITOR_SET | WEB → SRC → AUDIT → AI_H |
| PATTERN_GAP_SYNTHESIS | AUDIT → AI_H → AI_R |
| RESEARCH_SUFFICIENCY | CALC → AI_H |

AI_H ne satisfait jamais silencieusement un minimum `SOURCE_BACKED` ou `OBSERVED`.

---

## 7. Séparation des Action Runs

Les Action Runs research atomiques `WEB/AUDIT/CONN` sont evidence-only :
- WEB → `WEB_RESEARCH` ;
- AUDIT → `SOURCE_EXTRACTED` ;
- CONN → `CONNECTOR_EXTRACTED`.

Les analyses dérivées restent des runs distincts :
- `CALC` → `SYSTEM_CALCULATED` ;
- `AI_H` → `AI_INFERRED / WORKING_ASSUMPTION` ;
- `AI_R` → `AI_RECOMMENDED / AI_RECOMMENDATION`.

Une recherche ne doit pas promouvoir en même temps une recommandation IA présentée comme preuve.

---

## 8. Sortie contractuelle du planner

Future primitive candidate :

`plan_idea_evidence_context_v1(idea_id, expected_engine_revision, available_paths)`

Réponse minimale :
- `gate_id` ;
- `gate_status` ;
- `projection_fingerprint` ;
- `competitive_evidence_material` ;
- `research_sufficiency_state` ;
- `missing_requirements[]` ;
- `dependency_blocked_requirements[]` ;
- `eligible_system_actions[]` ;
- `dominant_user_action|null` ;
- `open_evidence_conflicts[]` résumé sans donnée sensible ;
- `deliverable_readiness` pour A03/A04/A05 ;
- `stopping_rationale[]` lorsqu'un arrêt de recherche est calculé.

---

## 9. Groupement des actions

Comme G1, plusieurs Requirements compatibles peuvent être groupés dans un même Action Run si :
- même acquisition path ;
- mêmes permissions/sensitivity constraints ;
- même projection revision ;
- fingerprints de chaque cible enregistrés ;
- résultat peut être validé atomiquement sans mélanger provenance ou autorité.

Exemple : une seule recherche WEB peut cibler `PRIMARY_NEED` + `OBJECTIONS_TRUST` si les requêtes et sources sont réellement communes. `COMPETITOR_SET` peut être séparé si son scope marché est différent.

Le groupement vise l'efficacité, jamais la dilution des Requirements.

---

## 10. Research Sufficiency

`RESEARCH_SUFFICIENCY=CALCULATED` ne signifie pas « assez de liens ».

Le predicate doit vérifier :
1. Requirements G2 obligatoires au niveau minimal ;
2. dépendances runtime utilisables ;
3. provenance/fraîcheur suffisantes pour les claims structurants ;
4. aucun conflit critique non explicité ;
5. aucune Action système admissible restante avec valeur décisionnelle matérielle attendue ;
6. recherche supplémentaire principalement redondante/améliorative.

`stopping_rationale` allowlist :
- `COVERAGE_SUFFICIENT` ;
- `MARGINAL_VALUE_LOW` ;
- `CONFLICTS_EXPLICIT` ;
- `NO_HIGH_VALUE_PATH_REMAINS` ;
- `EXTERNAL_CAPABILITY_UNAVAILABLE_WITH_ACCEPTABLE_RESIDUAL_UNCERTAINTY` uniquement si l'incertitude résiduelle est explicitement classifiée et non bloquante.

Jamais : `WEB_UNAVAILABLE => SATISFIED`.

---

## 11. Human last-mile

Le planner ne doit pas demander :
- « Qui sont vos concurrents ? » ;
- « Quels sont les besoins de vos clients ? » ;
- « Faites votre benchmark ».

Une `dominant_user_action` G2 est admissible seulement pour :
- intention privée/material now inaccessible autrement ;
- correction d'une hypothèse/source que l'utilisateur connaît fausse ;
- source privée volontaire ;
- autorisation liée à une donnée sensible ;
- choix explicite d'accepter une inconnue non bloquante.

Si une voie automatique admissible subsiste pour le Requirement concerné, `dominant_user_action` doit rester `null`.

---

## 12. API / adapter futur

Commande candidate après activation backend :

`evidence.advance`

Le navigateur n'envoie jamais :
- nom de RPC ;
- provider secret ;
- service-role key ;
- source UUID arbitraire ;
- permission scope libre ;
- `competitive_evidence_material` libre ;
- authority role.

L'adapter dérive côté serveur : revision, projection, available capabilities, idempotency, fingerprints, permissions et tool versions.

---

## 13. Ordre d'implémentation après levée des verrous

1. full R0 replay du Blueprint 0.5 ;
2. candidat migration research consolidé + test concurrence multi-session ;
3. policy/recompute G2 ;
4. planner G2 déterministe ;
5. harness planner (greenfield/refonte/stale/conflict/provider unavailable/human-last-mile) ;
6. executors WEB/AUDIT/CONN ;
7. CALC/AI_H/AI_R séparés ;
8. adapter `evidence.advance` ;
9. A03/A04/A05 ;
10. Workspace UI ;
11. E2E desktop/mobile ;
12. release Cloudflare + certification.

## 14. Verrous actuels

Toujours non levés :
- build 544 runtime/E2E G1 indépendant ;
- full R0 replay Blueprint 0.5 ;
- concurrence research multi-session réelle ;
- consolidation finale du SQL candidat en une migration unique propre.

Jusqu'à leur levée : **aucune migration G2, aucune commande Worker G2, aucun asset production G2.**

# 4b4c / 2b2c — G2 EVIDENCE & MARKET RUNTIME DESIGN — V0.1

Date : 2026-09-13

Statut : **DESIGN CANDIDATE — DOCUMENTATION ONLY — AUCUNE IMPLÉMENTATION G2 AUTORISÉE AVANT VALIDATION G1 RUNTIME/E2E**

## 1. Objet

Définir la future extension runtime de `G2_EVIDENCE_CONTEXT_SUFFICIENT` pour le Blueprint `SITE_VITRINE@0.4` en réutilisant les primitives R1→R3 déjà présentes : Sources, Information Items, Requirement refs, Action Runs, fingerprints, provenance, stale-safety et promotion contrôlée.

Ce document ne modifie ni le Blueprint canonique, ni Supabase, ni l'adapter Worker. Il prépare une implémentation ultérieure seulement après certification/runtime E2E de G1.

Sources d'autorité à respecter :
- `docs/project-definition/machine/site-vitrine/REQUIREMENTS_IDEA_V0_1.yaml` ;
- `docs/project-definition/machine/site-vitrine/GATES_V0_1.yaml` ;
- `docs/project-definition/machine/site-vitrine/GATE_BINDINGS_V0_1.yaml` ;
- `docs/project-definition/machine/site-vitrine/DELIVERABLE_CONTRACTS_V0_1.yaml` ;
- `docs/project-definition/runtime/DETERMINISTIC_ENGINE_CONTRACT_V0_1.md` ;
- `docs/project-definition/runtime/MUTATION_RPC_BOUNDARIES_V0_1.md` ;
- runtime R1→R3 et G1 déjà appliqué.

Invariant :

> **Evidence work is system-first. Unresolved evidence never automatically becomes a user question.**

---

## 2. Gate G2 à satisfaire

`G2_EVIDENCE_CONTEXT_SUFFICIENT` est READY seulement si :
- faits, claims et hypothèses restent séparés ;
- l'audit de l'existant est suffisant pour la décision active ou `NOT_RELEVANT` ;
- les besoins de l'audience sont suffisamment étayés pour la décision ;
- le contexte marché est suffisant pour préparer la stratégie ;
- la règle d'arrêt de recherche est satisfaite ;
- les conflits critiques sont résolus ou explicitement visibles ;
- provenance et fraîcheur sont suffisantes.

Outcomes :
- `CONTINUE_STRATEGY` ;
- `DEEPEN_RESEARCH` ;
- `EARLY_STOP_OR_PAUSE_READY`.

G2 ne doit pas décider à la place de l'humain de lancer ou arrêter le projet. Il peut produire une conclusion argumentée susceptible de soutenir un futur STOP/PAUSE/INSUFFICIENT_INFORMATION.

---

## 3. Requirements G2

| Requirement | Rôle | Minimum G2 | Acquisition préférée | Interaction humaine |
|---|---|---|---|---|
| `SV.D03.PRIMARY_NEED` | besoin/job principal | `WORKING_ASSUMPTION` | RAW → SRC → WEB → CONN → AI_H | correction facultative seulement |
| `SV.D03.OBJECTIONS_TRUST` | objections/confiance | enhancer | SRC → WEB → CONN → AI_H | correction facultative |
| `SV.D04.EXISTING_SITE` | baseline refonte | conditionnel | RAW → SRC | correction facultative |
| `SV.D04.EXISTING_AUDIT` | audit observable | `OBSERVED` si applicable | AUDIT → SRC → CONN → AI_H | aucune question par défaut |
| `SV.D04.EVIDENCE_QUALITY` | qualité/fraîcheur | `CALCULATED` | CALC → AI_H | aucune |
| `SV.D05.MARKET_CONTEXT` | terrain marché | `CALCULATED` | CALC → WEB → AI_H | aucune |
| `SV.D05.COMPETITOR_SET` | concurrents/alternatives/références | `SOURCE_BACKED` si activé | WEB → SRC → AUDIT → AI_H | correction facultative, jamais collecte obligatoire |
| `SV.D05.PATTERN_GAP_SYNTHESIS` | patterns/faiblesses/opportunités | `AI_RECOMMENDATION` | AUDIT → AI_H → AI_R | aucune |
| `SV.D05.RESEARCH_SUFFICIENCY` | arrêt de recherche | `CALCULATED` | CALC → AI_H | aucune |

Le Gate binding G2 exige comme atoms principaux : `PRIMARY_NEED`, `EVIDENCE_QUALITY`, `MARKET_CONTEXT`, `PATTERN_GAP_SYNTHESIS`, `RESEARCH_SUFFICIENCY`. `EXISTING_AUDIT` et `COMPETITOR_SET` sont conditionnels.

---

## 4. Livrables G2

### A03 — Audience Need Model

Sources : `PRIMARY_AUDIENCE`, `PRIMARY_NEED`, `OBJECTIONS_TRUST`.

Doit distinguer :
- ce que l'utilisateur a déclaré ;
- ce que des sources externes permettent d'observer ;
- ce que 2b2c infère comme hypothèse ;
- ce qui reste inconnu.

### A04 — Current State Evidence Pack

Pour une refonte :
- site existant ;
- observations auditables ;
- offre actuelle ;
- qualité/fraîcheur des preuves.

Les observations sont des observations, pas des causes inventées.

### A05 — Market & Competitive Landscape

Doit contenir :
- marché pertinent pour CETTE Idea ;
- concurrents, alternatives et références réellement pertinents ;
- patterns observés ;
- gaps/opportunités candidats ;
- limites de l'échantillon ;
- état de suffisance de recherche.

Aucun livrable ne doit présenter une synthèse IA comme une observation source-backed.

---

## 5. Modèle de preuve obligatoire

Toute preuve externe suit la chaîne :

`SOURCE → OBSERVATION → INTERPRETATION/HYPOTHESIS → POSSIBLE CONSEQUENCE`

### SOURCE

Objet `idea_sources` avec au minimum :
- type/source_kind ;
- locator si applicable ;
- content hash/version ;
- fetched/freshness metadata ;
- sensitivity ;
- état d'ingestion.

### OBSERVATION

Information Item :
- `item_type=EVIDENCE` ou `FACT` selon le cas ;
- provenance `SOURCE_EXTRACTED`, `CONNECTOR_EXTRACTED` ou `WEB_RESEARCH` ;
- `source_id` obligatoire pour une observation externe promue ;
- support exact/locator conservé ;
- Requirement refs explicites.

### INTERPRETATION / HYPOTHESIS

Information Item distinct :
- provenance `AI_INFERRED` ;
- jamais élevé silencieusement à `SOURCE_BACKED` ;
- refs vers les observations qui l'étayent dans le résultat/action audit trail.

### POSSIBLE CONSEQUENCE / RECOMMENDATION

Information Item ou Ledger recommendation :
- provenance `AI_RECOMMENDED` ;
- formulation conditionnelle lorsque les preuves sont incomplètes ;
- alternatives/risques visibles lorsqu'ils sont matériels.

---

## 6. Planner G2 cible

Future primitive candidate :

`plan_idea_evidence_context_v1(idea_id, expected_engine_revision, available_paths)`

Elle doit être déterministe et retourner au minimum :
- `gate_id=G2_EVIDENCE_CONTEXT_SUFFICIENT` ;
- `gate_status` ;
- `projection_fingerprint` ;
- `missing_requirements[]` ;
- `eligible_system_actions[]` ;
- `dominant_user_action|null` ;
- `open_evidence_conflicts[]` résumé sans données sensibles ;
- `research_sufficiency_state` ;
- `deliverable_readiness` pour A03/A04/A05.

### Ordre logique

Pour chaque Requirement insuffisant :

`MEM → RAW → SRC/AUDIT → CONN/WEB → CALC → AI_H → AI_R → HUM → ACCEPTED_UNKNOWN`

Ce n'est pas un pipeline obligatoire. Une voie est candidate seulement si :
- elle est autorisée pour ce Requirement ;
- ses prérequis sont disponibles ;
- elle peut encore améliorer matériellement G2 ou un livrable ;
- une action fresh équivalente n'existe pas déjà pour le même fingerprint ;
- la sensitivity permet ce traitement ;
- elle ne duplique pas une preuve déjà suffisante.

### Question humaine

`dominant_user_action` reste `null` tant qu'une voie système admissible et matériellement utile existe pour le besoin concerné.

Une intervention humaine G2 n'est légitime que pour :
- corriger une hypothèse/source que l'utilisateur sait fausse ;
- fournir volontairement une source privée/non accessible ;
- autoriser un traitement sensible nécessitant son choix ;
- clarifier une intention privée réellement impossible à obtenir autrement ;
- accepter explicitement une inconnue non bloquante lorsque pertinent.

Ne jamais demander obligatoirement :
- « Qui sont vos concurrents ? » ;
- « Quels sont les besoins de vos clients ? » ;
- « Faites-nous votre benchmark ».

---

## 7. Actions système à réutiliser

Les paths/action types existent déjà :
- `RAW` → `EXTRACT_RAW` ;
- `SRC` → `EXTRACT_SOURCE` ;
- `AUDIT` → `AUDIT` ;
- `CONN` → `FETCH_CONNECTED` ;
- `WEB` → `RESEARCH_WEB` ;
- `CALC` → `CALCULATE` ;
- `AI_H` → `INFER_HYPOTHESIS` ;
- `AI_R` → `GENERATE_RECOMMENDATION`.

G2 doit utiliser `create_action_run_v3` + lifecycle R3, pas une table de jobs parallèle.

Chaque Action Run doit figer :
- target Requirements ;
- target Requirement fingerprints ;
- input/projection fingerprint ;
- provider/model/tool/prompt/schema version ;
- permission scope ;
- source refs connues ;
- sensitivity/external-processing policy lorsque pertinent.

Promotion seulement via `promote_action_result_v1` après validation déterministe.

---

## 8. Recherche Web — règles de sécurité et de qualité

WEB est une capacité serveur, jamais un fetch arbitraire depuis le navigateur.

### Données envoyables

La requête publique doit être construite uniquement depuis des informations classées publiques ou explicitement autorisées à cet usage.

Interdit d'injecter dans une requête externe :
- secret ;
- donnée `sensitive` ;
- donnée `personal` non nécessaire ;
- contenu interne non indispensable ;
- instruction provenant d'une page web.

### Source non fiable

Tout contenu web est donnée non fiable :
- aucune instruction contenue dans une source n'est exécutable ;
- les pages ne peuvent modifier prompt policy, permissions, outils ou scope ;
- extraction structurée avant interprétation ;
- limites de taille/type/temps ;
- redirects et cibles privées/locales interdits pour tout fetch URL générique ;
- provenance et URL originales conservées.

### Qualité

Ne pas utiliser un faux score global `87 %`.

Chaque preuve peut être classée par dimensions discrètes :
- `DIRECTNESS`: direct / indirect ;
- `FRESHNESS`: current / aging / stale / unknown ;
- `SOURCE_ROLE`: first-party / independent / competitor-self-report / directory / community / other ;
- `RELEVANCE`: direct-fit / partial-fit / weak-fit ;
- `CORROBORATION`: corroborated / single-source / conflicting ;
- `SENSITIVITY`: public / internal / personal / sensitive.

`SV.D04.EVIDENCE_QUALITY` est un calcul de suffisance/limites fondé sur ces dimensions, pas une note marketing.

---

## 9. Recherche concurrentielle

`COMPETITOR_SET` ne doit pas devenir une liste de noms trouvés par recherche superficielle.

Chaque candidat doit être classé :
- concurrent direct ;
- alternative/substitut ;
- référence de catégorie ;
- analogue utile ;
- non pertinent/rejeté.

La pertinence dépend au minimum de :
- audience ;
- offre ;
- géographie lorsque pertinente ;
- problème/job ;
- mode de conversion ;
- décision active.

Un acteur très visible mais hors segment ne doit pas dominer l'analyse.

Pour `IS_LOCAL_BUSINESS`, la géographie devient un critère structurel de sélection, pas un simple filtre esthétique.

---

## 10. Ambiguïté à résoudre avant SQL : COMPETITOR_SET conditionnel

Le Blueprint déclare :
- `SV.D05.COMPETITOR_SET` actif par défaut ;
- criticality G2 = `CONDITIONAL` ;
- Gate binding G2 = conditional atom ;
- aucune condition machine explicite n'est actuellement attachée à cette criticalité conditionnelle.

Il est interdit de coder une règle implicite dans le frontend ou le Worker.

### Règle candidate à valider

`COMPETITOR_SET` ne bloque G2 que si son absence empêche `PATTERN_GAP_SYNTHESIS` et `RESEARCH_SUFFICIENCY` d'atteindre leurs minimums de manière défendable.

Autrement dit :
- pour une création sans autre evidence externe pertinente, une recherche de concurrents/alternatives sera généralement nécessaire ;
- pour une refonte disposant déjà d'un audit externe suffisamment informatif, ou un cas où la comparaison de marché ne peut plus modifier la décision active, le Requirement peut rester non bloquant ;
- `RESEARCH_SUFFICIENCY=SATISFIED` doit contenir la justification machine-readable expliquant pourquoi aucune recherche concurrentielle supplémentaire n'a de valeur matérielle attendue.

Avant implémentation, cette règle doit être formalisée dans le Blueprint/Gate binding ou dans une policy G2 versionnée explicitement.

---

## 11. Règle d'arrêt de recherche

`SV.D05.RESEARCH_SUFFICIENCY` est BLOCKING et doit être `CALCULATED`.

Il ne faut ni :
- imposer arbitrairement « 10 concurrents » ;
- continuer jusqu'à épuiser Internet ;
- s'arrêter après une seule source faible ;
- utiliser le nombre de sources comme proxy unique.

### Predicate cible

`SATISFIED` seulement si :
1. les Requirements G2 obligatoires ont atteint leur niveau minimal ou sont explicitement non applicables ;
2. aucune contradiction critique non explicitée ne subsiste ;
3. provenance/fraîcheur des claims structurants sont suffisantes ;
4. aucun System Action admissible restant n'a une valeur matérielle attendue pour changer :
   - la compréhension de l'audience ;
   - le contexte de marché ;
   - les principaux patterns/gaps ;
   - une option stratégique future ;
   - une conclusion stop/pause ;
5. les actions supplémentaires probables sont redondantes, de faible pertinence ou seulement amélioratives.

Le moteur doit conserver un `stopping_rationale` structuré :
- `COVERAGE_SUFFICIENT` ;
- `MARGINAL_VALUE_LOW` ;
- `CONFLICTS_EXPLICIT` ;
- `NO_HIGH_VALUE_PATH_REMAINS` ;
- éventuellement `EXTERNAL_CAPABILITY_UNAVAILABLE` seulement si l'incertitude résiduelle est classifiée et acceptable. Une indisponibilité technique ne doit jamais être présentée comme preuve de suffisance.

---

## 12. Research capability unavailable

Si WEB/AUDIT/CONN est indisponible :
- le planner recalcule avec les paths réellement disponibles ;
- AI_H peut produire une hypothèse lorsque le Blueprint l'autorise, avec provenance correcte ;
- AI_H ne peut pas satisfaire un minimum `SOURCE_BACKED` ou `OBSERVED` ;
- le système ne fabrique pas de concurrent ou de preuve ;
- l'utilisateur n'est pas automatiquement transformé en chercheur ;
- G2 peut rester `NOT_READY`, proposer une source facultative, accepter une inconnue si non bloquante, ou conclure `INSUFFICIENT_INFORMATION / PAUSE` selon la décision active.

---

## 13. Existing-site audit

`EXISTING_AUDIT` est activé uniquement lorsque les contexts `IS_REDESIGN` / `HAS_EXISTING_SITE` le rendent applicable.

Audit candidat :
- structure/pages observables ;
- proposition/offer visible ;
- CTA/parcours observables ;
- contenu/trust signals ;
- technique observable seulement lorsqu'utile ;
- SEO observable seulement lorsqu'utile ;
- erreurs/limitations réellement observées.

Interdit :
- déduire une performance business à partir de la seule apparence ;
- affirmer des causes de conversion sans données ;
- traiter absence d'information publique comme absence réelle.

---

## 14. Artefacts A03/A04/A05

Les artefacts G2 doivent utiliser la mécanique versionnée R4 existante.

Proposition :
- `A03_AUDIENCE_NEED_MODEL` — `FOR_DECISION` ;
- `A04_CURRENT_STATE_EVIDENCE_PACK` — `FOR_DECISION` ;
- `A05_MARKET_COMPETITIVE_LANDSCAPE` — `FOR_DECISION`.

Chaque version doit être liée aux fingerprints exacts de ses Requirements sources.

Un changement matériel de `PRIMARY_AUDIENCE`, `OFFER_BASELINE`, `EXISTING_SITE` ou `MARKET_CONTEXT` doit stale seulement les artefacts G2 réellement dépendants, pas tout le dossier.

---

## 15. Source persistence — gap technique à traiter

Pour une recherche WEB système, une observation promue doit idéalement référencer un `idea_sources.id` afin de préserver provenance/fraîcheur.

Le runtime actuel possède les Sources et l'ingestion, mais l'implémentation G2 devra vérifier s'il existe déjà un RPC service-only suffisamment étroit pour enregistrer/ingérer une source découverte par une Action Run.

Si aucun RPC adapté n'existe, ajouter une primitive étroite, par exemple :

`record_system_research_source_v1(...)`

Contraintes :
- service-role only ;
- liée à `action_run_id` + `idea_id` ;
- source_kind allowlisté (`url` / `system_observation`) ;
- locator normalisé ;
- content hash/version ;
- fetched/freshness ;
- sensitivity jamais abaissée ;
- idempotency par idea + normalized locator + content hash ;
- aucune interprétation métier stockée dans la Source elle-même.

Ne pas réutiliser un RPC humain en simulant `auth.uid()`.

---

## 16. UI Workspace G2

L'utilisateur ne voit pas un pipeline « Audit → Concurrents → Marché → Synthèse » obligatoire.

Surface cible :
- microstatus compact : « 2b2c vérifie les éléments utiles… » ;
- résumé `Ce que nous avons observé` ;
- `Ce qui reste hypothèse` ;
- `Ce que cela pourrait changer` ;
- sources inspectables à la demande ;
- conflits visibles lorsqu'ils affectent une décision ;
- une seule action utilisateur dominante seulement si nécessaire.

Exemples d'actions humaines légitimes :
- « Ce site est-il bien le vôtre ? » si plusieurs sites homonymes rendent l'audit ambigu ;
- « Cette contrainte est-elle toujours vraie ? » si une source interne et une déclaration humaine se contredisent ;
- « Ajouter une source privée » comme option, jamais comme étape obligatoire.

---

## 17. Séquence d'implémentation future

Aucune étape ci-dessous ne doit démarrer avant le feu vert G1 runtime/E2E.

### G2.0 — Contract + fixtures
- valider ce document ;
- formaliser la condition `COMPETITOR_SET` ;
- fixtures création / refonte / local / provider unavailable / conflict.

### G2.1 — Deterministic planner
- policy G2 versionnée ;
- recompute ciblé des Requirements G2 ;
- `plan_idea_evidence_context_v1` ;
- tests SQL rollbackés.

### G2.2 — Source/evidence persistence
- confirmer ou ajouter le RPC system-research-source ;
- validation des provenance/source refs ;
- evidence-quality calculator.

### G2.3 — Executors
- SRC/AUDIT ;
- CALC ;
- WEB provider-neutral ;
- AI_H / AI_R strictement après evidence structurée.

### G2.4 — Adapter
- commande candidate unique `evidence.advance` plutôt qu'une commande par sous-étape ;
- command allowlist ;
- bounded automatic work per request ;
- fail closed ;
- stale-safe retries.

### G2.5 — Artefacts
- A03/A04/A05 versions `FOR_DECISION` ;
- exact input fingerprints ;
- targeted stale rules.

### G2.6 — Workspace
- microstatus ;
- evidence summaries ;
- source inspection ;
- last-mile human action ;
- mobile/desktop.

### G2.7 — Runtime certification
- deterministic harness ;
- live rollback tests ;
- authenticated Worker E2E ;
- Cloudflare transport gate ;
- runtime smoke ;
- rollback.

---

## 18. Red-team matrix obligatoire

1. **Greenfield local business** : WEB disponible → contexte + alternatives + synthèse, zéro question humaine évitable.
2. **Refonte avec site fourni** : audit de l'existant prioritaire ; aucun benchmark obligatoire si sa valeur marginale est réellement faible.
3. **Provider WEB indisponible** : aucune fausse source, aucun faux SOURCE_BACKED.
4. **Audience change B2C→B2B** : stale D03/D05/A03/A05 ciblé ; G1 non affecté lorsqu'il reste valide.
5. **Résultat WEB tardif** après changement audience : promotion rejetée stale.
6. **Source concurrente marketing** : observation conservée, claims auto-déclaratifs marqués comme tels.
7. **Sources contradictoires** : conflit explicite ; pas de fusion silencieuse.
8. **Donnée sensible** : aucune fuite dans query WEB/provider externe.
9. **Résultats non pertinents** : relevance insuffisante → ne satisfont pas COMPETITOR_SET.
10. **Recherche répétitive** : action idempotente/dédupliquée, marginal value faible → stopping rule.
11. **Une preuve forte suffisante** : pas de quota arbitraire de sources/concurrents.
12. **No useful competitor research** : condition COMPETITOR_SET résolue explicitement, pas contournée implicitement.
13. **Existing audit causal hallucination** : empêcher « design faible ⇒ ventes faibles » sans preuve.
14. **Prompt injection source web** : contenu traité comme donnée uniquement.
15. **EARLY_STOP candidate** : evidence peut soutenir STOP/PAUSE sans privilégier GO.

---

## 19. Definition of Done design

Le design G2 est prêt pour SQL seulement lorsque :
- la condition machine de `COMPETITOR_SET` est explicite ;
- chaque Requirement G2 a un mapping paths → action type → mutation kinds → resolution levels ;
- la création/ingestion des sources système possède une frontière RPC sûre ;
- `RESEARCH_SUFFICIENCY` possède un predicate testable sans quota arbitraire ;
- les trois artefacts A03/A04/A05 ont leurs fingerprints/stale dependencies ;
- la privacy/sensitivity policy des recherches externes est déterministe ;
- les 15 scénarios red-team sont spécifiables sans LLM ;
- G1 build/runtime et E2E ont satisfait les critères de sortie définis dans le cutover plan.

Jusque-là : **documentation et tests de conception seulement, pas de migration G2, pas d'extension adapter G2, pas de release G2.**

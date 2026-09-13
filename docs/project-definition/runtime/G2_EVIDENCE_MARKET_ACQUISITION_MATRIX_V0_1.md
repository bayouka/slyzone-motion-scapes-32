# 4b4c / 2b2c — G2 EVIDENCE & MARKET — ACQUISITION MATRIX V0.1

Date : 2026-09-13

Statut : **DESIGN CANDIDATE — NON RUNTIME**

Objet : fixer, avant implémentation, quelles acquisition paths peuvent produire quel type de provenance/résolution pour chaque Requirement G2 et lesquelles peuvent réellement satisfaire le minimum du Gate.

## 1. Règle fondamentale

Les resolution levels ne sont pas interchangeables.

Une voie peut être utile sans être suffisante pour le Gate.

Exemples :
- une `AI_INFERRED / WORKING_ASSUMPTION` peut aider à explorer un besoin utilisateur ;
- elle ne peut pas remplacer une `SOURCE_BACKED` lorsqu'une preuve source est exigée ;
- une synthèse `AI_H` ne remplace pas `SYSTEM_CALCULATED` pour un Requirement dont le minimum est `CALCULATED` ;
- un audit observable ne remplace pas une `AI_RECOMMENDATION` lorsque le Requirement demande explicitement une recommandation/synthèse stratégique.

Le planner doit distinguer :
- `SUPPORTIVE_PATH` ;
- `GATE_SATISFYING_PATH` ;
- `CURRENTLY_UNAVAILABLE_PATH` ;
- `DISALLOWED_PATH`.

---

## 2. Mapping canonique des paths

| Path | Action type | Provenance machine | Resolution levels normalement autorisés |
|---|---|---|---|
| RAW | `EXTRACT_RAW` | `SOURCE_EXTRACTED` depuis `human_raw` | `RAW_HUMAN`, éventuellement `ACCEPTED_AS_CURRENT` si direct selon contrat |
| SRC | `EXTRACT_SOURCE` | `SOURCE_EXTRACTED` | `SOURCE_BACKED`, `OBSERVED` |
| AUDIT | `AUDIT` | `SOURCE_EXTRACTED` sur source auditée / observations persistées | `OBSERVED`, éventuellement `SOURCE_BACKED` |
| CONN | `FETCH_CONNECTED` | `CONNECTOR_EXTRACTED` | `SOURCE_BACKED`, `OBSERVED` |
| WEB | `RESEARCH_WEB` | `WEB_RESEARCH` | `SOURCE_BACKED`, `OBSERVED` |
| CALC | `CALCULATE` | `SYSTEM_CALCULATED` | `CALCULATED` |
| AI_H | `INFER_HYPOTHESIS` | `AI_INFERRED` | `WORKING_ASSUMPTION` |
| AI_R | `GENERATE_RECOMMENDATION` | `AI_RECOMMENDED` | `AI_RECOMMENDATION` |
| HUM | human RPC | `HUMAN_DECLARED/HUMAN_GUIDED_ANSWER` | selon autorité/contrat humain, pas une preuve externe automatique |

Toute mutation ciblée doit conserver `target_requirement_id`, `resolution_levels`, provenance et source/ref appropriée.

---

## 3. `SV.D03.PRIMARY_NEED`

Minimum G2 : `WORKING_ASSUMPTION`.

Paths : `RAW, SRC, WEB, CONN, AI_H`.

### GATE_SATISFYING
- RAW direct : peut fournir le besoin déclaré ;
- SRC/WEB/CONN : peuvent fournir des besoins observés/sourcés ;
- AI_H : peut fournir `WORKING_ASSUMPTION` si l'incertitude est acceptable pour la décision courante.

### Règle

Ne pas demander « Quels sont les besoins de vos clients ? » si RAW/SRC/WEB/CONN/AI_H peut produire une base de travail défendable.

Une hypothèse AI_H doit rester visible comme hypothèse et peut être stale si l'audience change.

---

## 4. `SV.D03.OBJECTIONS_TRUST`

Criticité G2 : `ENHANCER`.

Paths : `SRC, WEB, CONN, AI_H`.

### SUPPORTIVE
Tous les paths autorisés sont utiles.

### Gate

Ce Requirement ne doit pas bloquer G2 par défaut. Une absence d'objections documentées ne doit pas déclencher une question utilisateur.

Les objections issues d'AI_H restent des hypothèses ; des avis/reviews publics ou sources connectées peuvent fournir du SOURCE_BACKED/OBSERVED.

---

## 5. `SV.D04.EXISTING_SITE`

Applicable seulement selon contexts de refonte/site existant.

Paths : `RAW, SRC`.

### GATE_SATISFYING si activé
- RAW : URL/site explicitement déclaré ;
- SRC : source URL enregistrée et correctement reliée à l'Idea.

### Human last-mile

Seulement en cas d'ambiguïté réelle impossible à lever automatiquement, par exemple plusieurs sites homonymes et aucune preuve permettant d'identifier le bon.

Question ciblée acceptable :

> « Lequel de ces deux sites est bien le vôtre ? »

Pas :

> « Donnez-nous toutes les informations sur votre site actuel. »

---

## 6. `SV.D04.EXISTING_AUDIT`

Minimum G2 : `OBSERVED` si applicable.

Paths : `AUDIT, SRC, CONN, AI_H`.

### GATE_SATISFYING
- AUDIT → `OBSERVED` ;
- SRC/CONN peuvent fournir des observations source-backed si suffisamment directes.

### SUPPORTIVE_ONLY
- AI_H → `WORKING_ASSUMPTION` uniquement ; ne satisfait pas `OBSERVED`.

### Règle

Une inférence « le site semble ancien donc convertit mal » est interdite comme observation. Seuls les faits effectivement observables satisfont le Requirement.

---

## 7. `SV.D04.EVIDENCE_QUALITY`

Minimum G2 : `CALCULATED`.

Paths : `CALC, AI_H`.

### GATE_SATISFYING
- CALC uniquement → `SYSTEM_CALCULATED / CALCULATED`.

### SUPPORTIVE_ONLY
- AI_H peut expliquer les limites, mais ne peut pas satisfaire le Requirement.

### Calcul candidat

Agrège sans score décoratif :
- freshness class ;
- source role ;
- directness ;
- relevance ;
- corroboration/conflict ;
- source status ;
- coverage des claims structurants.

Sortie structurée :
- `SUFFICIENT` ;
- `SUFFICIENT_WITH_LIMITS` ;
- `INSUFFICIENT` ;
- `CONFLICTED`.

---

## 8. `SV.D05.MARKET_CONTEXT`

Minimum G2 : `CALCULATED`.

Dépend de : `ORG_CONTEXT + PRIMARY_AUDIENCE + OFFER_BASELINE`.

Paths : `CALC, WEB, AI_H`.

### GATE_SATISFYING
- CALC → `SYSTEM_CALCULATED / CALCULATED`.

### SUPPORTIVE_INPUTS
- WEB → observations permettant d'affiner la réalité du marché ;
- AI_H → hypothèse de segmentation/contexte.

### Règle

WEB ou AI_H ne satisfont pas directement le minimum `CALCULATED`. Ils alimentent éventuellement le calcul déterministe qui fixe le terrain pertinent : secteur, zone, segment et familles d'alternatives à comparer.

---

## 9. `SV.D05.COMPETITOR_SET`

Minimum G2 : `SOURCE_BACKED` **si la condition G2 est activée**.

Paths : `WEB, SRC, AUDIT, AI_H`.

### GATE_SATISFYING
- WEB avec Source persistée → `WEB_RESEARCH / SOURCE_BACKED` ;
- SRC avec source réelle → `SOURCE_EXTRACTED / SOURCE_BACKED` ;
- AUDIT avec source réelle → `OBSERVED/SOURCE_BACKED` selon résultat.

### SUPPORTIVE_ONLY
- AI_H peut proposer des candidats à rechercher ou classifier, mais **ne peut pas inventer un competitor set SOURCE_BACKED**.

### Règle

Un nom généré par l'IA sans source persistée n'entre pas dans le set actif.

Le set doit distinguer : direct / alternative / analogue / référence / rejeté.

---

## 10. `SV.D05.PATTERN_GAP_SYNTHESIS`

Minimum G2 : `AI_RECOMMENDATION`.

Paths : `AUDIT, AI_H, AI_R`.

### SUPPORTIVE_INPUTS
- AUDIT → observations ;
- AI_H → hypothèses intermédiaires.

### GATE_SATISFYING
- AI_R → `AI_RECOMMENDED / AI_RECOMMENDATION` seulement lorsque les observations sources requises sont suffisamment présentes.

### Règle

La synthèse doit produire :
- patterns observés ;
- gaps candidats ;
- opportunités possibles ;
- limites et contradictions ;
- source refs exactes pour les claims sous-jacents.

Elle ne transforme pas automatiquement une différence concurrentielle en besoin utilisateur.

---

## 11. `SV.D05.RESEARCH_SUFFICIENCY`

Minimum G2 : `CALCULATED` — BLOCKING.

Paths : `CALC, AI_H`.

### GATE_SATISFYING
- CALC uniquement.

### SUPPORTIVE_ONLY
- AI_H peut estimer/expliquer le gain marginal, mais ne décide pas seul que la recherche est suffisante.

### Predicate

Le calcul final prend en entrée :
- minimums G2 atteints ;
- Evidence Quality ;
- open conflicts ;
- candidate System Actions encore éligibles ;
- expected materiality de ces actions ;
- current decision question ;
- source/freshness coverage.

Sorties :
- `SATISFIED` ;
- `DEEPEN_REQUIRED` ;
- `BLOCKED_CAPABILITY` ;
- `CONFLICT_REVIEW_REQUIRED`.

`BLOCKED_CAPABILITY` n'est jamais équivalent à `SATISFIED`.

---

## 12. Human action policy G2

Les Requirements G2 de base ne contiennent pas une autorité R8/HUMAN_DECISION à satisfaire.

Par conséquent, la majorité des dossiers G2 doivent pouvoir avancer avec :

`dominant_user_action = null`.

Actions humaines admissibles :
- corriger une information fausse ;
- choisir entre deux sources identitaires ambiguës ;
- accorder l'accès à une source privée/connector ;
- fournir volontairement un document interne ;
- accepter une inconnue lorsque le Blueprint l'autorise.

Actions humaines inadmissibles comme workflow normal :
- chercher les concurrents ;
- écrire l'analyse marché ;
- deviner les besoins utilisateurs ;
- juger la qualité des preuves à la place du système ;
- décider si « assez de recherche » a été faite.

---

## 13. Grouping des System Actions

Le planner peut grouper plusieurs Requirements dans un même Action Run seulement lorsqu'ils partagent réellement :
- acquisition path ;
- input/source set ;
- permission/sensitivity policy ;
- query/audit intent ;
- freshness/fingerprint basis.

Exemples légitimes :
- une même source client peut alimenter `PRIMARY_NEED` + `OBJECTIONS_TRUST` ;
- un audit du site existant peut alimenter `EXISTING_AUDIT` + observations pour `EVIDENCE_QUALITY` ;
- une même recherche marché peut trouver des candidats utiles à `COMPETITOR_SET` et des indices pour `PRIMARY_NEED` si les claims sont séparés et sourcés.

Exemple interdit : une seule Action Run vague « research everything » ciblant tout G2 avec un prompt générique.

---

## 14. Promotion guards G2

Avant promotion d'une mutation G2 :
- target Requirement déclaré dans l'Action Run ;
- Requirement fingerprint encore courant ;
- provenance compatible avec resolution level ;
- Source obligatoire pour `WEB_RESEARCH` et observation externe ;
- source active, même Idea, non superseded, freshness disponible selon type de claim ;
- aucun niveau humain/expert fabriqué ;
- aucune mutation vers un Requirement hors permission scope ;
- sensibilité non abaissée ;
- `source_locator` seul ne remplace pas la Source persistée pour un claim source-backed G2.

---

## 15. Red-team invariants

Le futur harness doit refuser :
1. `AI_INFERRED` → `SOURCE_BACKED` ;
2. `WEB_RESEARCH` sans Source persistée ;
3. `AI_H` → `CALCULATED` ;
4. `WEB_RESEARCH` → `CALCULATED` pour MARKET_CONTEXT ;
5. `AUDIT` halluciné sans source auditée → `OBSERVED` ;
6. `AI_H` → `AI_RECOMMENDATION` ;
7. competitor inventé par LLM → active competitor set ;
8. research sufficiency décidée par LLM seul ;
9. stale action result après changement audience ;
10. user question alors qu'un path système GATE_SATISFYING admissible reste disponible.

---

## 16. Definition of Done

Cette matrice est prête à devenir exécutable lorsque :
- la condition `COMPETITOR_SET` est formalisée ;
- chaque path possède un executor/validator clairement identifié ;
- la Source système G2 possède sa frontière RPC ;
- `promote_action_result_v1` exige la Source pour WEB ;
- le planner encode la distinction SUPPORTIVE vs GATE_SATISFYING ;
- les tests ci-dessus passent sur fixtures transactionnelles rollbackées.

Avant cela : **aucune migration G2**.

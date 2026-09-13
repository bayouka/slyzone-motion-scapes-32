# 4b4c — DETERMINISTIC ENGINE CONTRACT — V0.1

Date : 2026-09-13

Statut : **R0 ARCHITECTURE CANDIDATE — NON CANONIQUE / PAS D'IMPLEMENTATION AUTORISEE**

Objet : définir exactement les responsabilités du moteur non-LLM qui transforme Blueprint + état concret d'une Idea en contexts, Requirement states, Gates, actions éligibles et Change Impact.

---

# 1. Entrées

Le moteur reçoit un `EngineInput` composé de :

- `idea_id`
- `engine_revision`
- `blueprint_id`
- `blueprint_version`
- Blueprint manifest + Requirements + Contexts + Gates + bindings + overrides
- active Information Items
- active Sources metadata
- formal Decisions
- active Ledger entries
- current Artifacts metadata
- current Snapshots metadata
- active Action Runs
- permissions/authority context
- current time/freshness reference

Aucun texte généré par un LLM n'est traité comme autorité par simple présence.

---

# 2. Sorties

Le moteur produit une `EngineProjection` :

- `active_contexts[]`
- `requirement_states[]`
- `gate_states[]`
- `blocking_requirements[]`
- `review_required[]`
- `stale_artifacts[]`
- `eligible_system_actions[]`
- `dominant_user_action?`
- `decision_capabilities[]`
- `promotion_capabilities[]`
- `projection_version/fingerprint`

Il ne produit aucun pourcentage global de complétion.

---

# 3. Ordre de calcul

1. Validate Blueprint version/schema.
2. Resolve Blueprint mismatch.
3. Derive Context Overlays from deterministic evidence/state.
4. Compute Requirement applicability.
5. Resolve each active Requirement from current evidence/items/decisions.
6. Apply conflict/freshness policies.
7. Apply minimum resolution requirements per Gate.
8. Compute lock/review/stale state.
9. Evaluate Gate bindings + ledger/system conditions.
10. Traverse Change Impact edges from current revision changes.
11. Determine unresolved material Requirements.
12. Generate eligible acquisition paths.
13. Generate candidate System Actions.
14. Prioritize actions.
15. Generate one dominant User Action only if necessary.
16. Emit projection.

---

# 4. Requirement resolution

Pour chaque Requirement actif :

```text
Definition from Blueprint
+ active resolution refs
+ evidence freshness
+ conflict state
+ authority state
+ current Gate demand
→ RequirementState
```

`RequirementState` minimum :

- applicability: ACTIVE / NOT_RELEVANT
- resolution: UNRESOLVED / PARTIAL / RESOLVED / ACCEPTED_UNKNOWN / CONFLICTED / STALE
- resolution_level(s)
- refs
- current_criticality
- lock_state
- blockers
- freshness
- fingerprint

Le moteur peut considérer plusieurs formes de preuve équivalentes via `any_of` du schema V0.2.

---

# 5. Gate evaluation

Une Gate est `READY` seulement si :

- toutes ses conditions système sont vraies ;
- tous les required atoms applicables satisfont la résolution minimale ;
- les conditional atoms activés satisfont leurs conditions ;
- aucun blocker actif ne s'applique ;
- aucun conflit critique non accepté n'affecte la Gate ;
- les artifacts obligatoires sont READY et fresh ;
- l'autorité requise est satisfaite lorsqu'il s'agit d'une Gate formelle.

Etats Gate :

- `NOT_APPLICABLE`
- `NOT_READY`
- `READY_WITH_ACCEPTED_UNKNOWNS`
- `READY`
- `STALE`

---

# 6. Context engine

Un Context est dérivé depuis des conditions déterministes ou explicitement humaines.

Exemples :
- `IS_REDESIGN` depuis création/refonte + site existant ;
- `SEO_MIGRATION_RISK` depuis redesign + URLs indexées/traffic significatif ;
- `HAS_PERSONAL_DATA` depuis fields/process identifiés ;
- `HAS_TEAM_DECISION` depuis governance ;
- `NEEDS_PRESENTATION` depuis décision collective/explicit request.

Un LLM peut proposer `context_candidate`, mais le deterministic engine doit valider sa règle d'activation.

---

# 7. Fingerprints

## Idea/global revision

Sert à optimistic concurrency et audit macro.

## Requirement fingerprint

Hash de :
- Blueprint/version ;
- relevant source/item versions ;
- relevant formal decisions ;
- relevant contexts ;
- dependencies states.

## Action fingerprint

Hash de :
- action type ;
- target Requirements/artifacts ;
- target Requirement fingerprints ;
- tool/prompt/schema version si résultat dépendant.

## Artifact fingerprint

Hash de :
- artifact contract/version ;
- source Requirement fingerprints ;
- decision snapshot if applicable.

---

# 8. Change Impact

Le moteur reçoit un Change Event : old/new refs + materiality candidate.

Il :

1. identifie les Requirements directement touchés ;
2. suit `invalidates/review/stale` edges ;
3. recalcule applicability/contexts si nécessaire ;
4. marque seulement les descendants concernés ;
5. conserve les artifacts non affectés ;
6. génère les actions de réévaluation nécessaires.

Un changement B2C→B2B peut réouvrir D03/D05/D06/D07/Z4/D21/D22 sans invalider automatiquement le problème business de D02.

---

# 9. Acquisition resolver

Pour un Requirement insuffisant, calculer les voies autorisées dans cet ordre logique :

`MEM → RAW → SRC/AUDIT → CONN/WEB → CALC → AI_H → AI_R → HUM → EXPERT → ACCEPTED_UNKNOWN`

Mais l'ordre n'est pas mécanique :
- sensitivity peut interdire WEB/external AI ;
- coût/latence peut favoriser CALC ;
- décision humaine ne peut pas être remplacée par AI_R ;
- expert signoff ne peut pas être remplacé par HUMAN generic.

---

# 10. System Action eligibility

Une action est éligible si :

- elle cible au moins un Requirement/artifact actif ;
- elle dispose de ses prerequisites ;
- sa permission est accordée ;
- aucune action identique fresh n'existe déjà pour le même fingerprint ;
- son expected value est matériel pour une Gate/Decision/Artifact ;
- elle ne duplique pas une source déjà suffisante.

---

# 11. Prioritization

Score interne déterministe/heuristique candidat, sans l'exposer comme faux pourcentage de vérité :

1. blocker severity ;
2. decision impact ;
3. information gain ;
4. dependency unlock count ;
5. reversibility ;
6. user burden avoided ;
7. external cost ;
8. latency ;
9. confidence expected.

Le score sert seulement à ordonner les actions.

---

# 12. Human Question Gate

Créer `dominant_user_action` seulement si :

- Requirement actif et matériel maintenant ;
- non résolu ;
- source/audit/research/calcul ne peuvent pas raisonnablement le résoudre ;
- hypothèse/recommandation ne suffit pas à la Gate actuelle ;
- l'humain possède l'information ou l'autorité ;
- différer/accepted unknown n'est pas approprié.

Le moteur doit pouvoir expliquer :

`why_now`, `what_it_unlocks`, `default/recommended option`, `unknown rescue`.

---

# 13. Formal authority

Le moteur vérifie les `role_ref` actifs :

- IDEA_DECISION_OWNER ;
- BUILD_READY_OWNER ;
- CONTENT_OWNER ;
- TECH_OWNER ;
- PRIVACY_OWNER ;
- EXPERT_ROLE.

Une action AI peut préparer une décision ; seule l'autorité correspondante peut la satisfaire lorsque le Requirement/Gate l'exige.

---

# 14. Snapshots

Avant Decision Package / Idea approval / Project baseline / Build Ready :

- calculer current state ;
- vérifier freshness ;
- créer immutable manifest ;
- hash ;
- référencer exact Blueprint/version ;
- référencer artifacts/decisions actifs.

Une Gate formelle ne peut pas approuver un dossier dont le snapshot est déjà stale.

---

# 15. Deterministic validators

R0 doit inclure au minimum :

- Blueprint structural validator (déjà existant) ;
- applicability evaluator ;
- dependency DAG validator/runtime traversal ;
- Gate evaluator ;
- fingerprint builder ;
- stale detector ;
- Change Impact traversal ;
- authority validator ;
- question legitimacy validator ;
- artifact freshness validator.

---

# 16. Tests R0 obligatoires

1. Nathalie simple : peu de questions, G1/G2 progression correcte.
2. Vincent riche : aucune répétition des infos sourcées.
3. B2C→B2B : stale ciblé.
4. source concurrente mise à jour : D05 descendants seulement.
5. couleur modifiée : D15 local.
6. expert signoff activé : Gate bloquée correctement.
7. accepted unknown non-bloquant : READY_WITH_ACCEPTED_UNKNOWNS.
8. accepted unknown interdit : Gate reste NOT_READY.
9. stale async result : rejet promotion.
10. Blueprint mismatch : aucune fausse couverture Site vitrine.
11. approval snapshot stale : formal approval impossible.
12. Project baseline : promotion sans milestones opérationnels.

---

# 17. Definition of Done R0

R0 est validé lorsque le moteur peut, sur fixtures locales sans réseau ni LLM :

- charger le Blueprint ;
- calculer contexts/applicability ;
- résoudre les Requirements à partir d'un état fixture ;
- calculer G0→G12 ;
- produire actions éligibles ;
- générer Change Impact ciblé ;
- refuser stale/authority violations ;
- passer les scénarios ci-dessus.

Seulement après ce PASS, R1 persistence doit être implémenté.
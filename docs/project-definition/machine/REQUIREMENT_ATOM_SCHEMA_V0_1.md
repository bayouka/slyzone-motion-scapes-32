# 4b4c — REQUIREMENT ATOM SCHEMA — V0.1

Date : 2026-09-13

Statut : **MACHINE-CONTRACT CANDIDATE — NON CANONIQUE**

Parent : `PROJECT_DEFINITION_REFERENCE_ARCHITECTURE_V0_4.md`.

But : fournir une représentation structurée et testable des exigences professionnelles sans transformer le référentiel en questionnaire utilisateur.

---

## 1. Invariant

Un `Requirement Atom` est une unité de connaissance, analyse, décision, spécification ou vérification.

Il décrit **ce que le moteur doit résoudre**, pas ce que l'utilisateur doit remplir.

`Requirement exists != user question`.

---

## 2. Types

- `INFO` — fait, donnée, préférence déclarée, contrainte ou source.
- `ANALYSIS` — transformation d'inputs en observation/interprétation.
- `DECISION` — arbitrage créant une baseline active.
- `SPEC` — définition de ce qui doit être construit/respecté.
- `VERIFY` — condition observable/testable.

---

## 3. Schéma logique obligatoire

Chaque atom machine doit pouvoir porter :

- `id` — identifiant stable ;
- `schema_version` ;
- `type` ;
- `domain_id` ;
- `lifecycle_zone` ;
- `blueprint_scope` ;
- `title` ;
- `purpose` ;
- `risk_if_missing` ;
- `applicability` ;
- `resolution` ;
- `evidence` ;
- `authority` ;
- `dependencies` ;
- `criticality_by_gate` ;
- `minimum_resolution_by_gate` ;
- `state_policy` ;
- `deliverables` ;
- `validation` ;
- `change_impact` ;
- `sensitivity` ;
- `examples` ;
- `notes`.

---

## 4. Applicability

```yaml
applicability:
  default: ACTIVE | INACTIVE
  all_of_contexts: []
  any_of_contexts: []
  none_of_contexts: []
  rule: optional deterministic expression
```

Un atom inapplicable devient `NOT_RELEVANT`, jamais `MISSING`.

Exemple : les redirects détaillés sont actifs si `IS_REDESIGN && SEO_MIGRATION_RISK`.

---

## 5. Resolution

```yaml
resolution:
  allowed_classes: [R1, R2, R3, R4, R5, R6, R7, R8, R9]
  preferred_paths: [MEM, RAW, SRC, AUDIT, CONN, WEB, CALC, AI_H, AI_R, HUM, EXPERT]
  default_human_interaction: NONE | OPTIONAL_CORRECTION | LIGHT_REVIEW | EXPLICIT_CHOICE | FORMAL_APPROVAL | EXPERT_SIGNOFF
  human_only_reason: null
  rescue_policy: DEFAULT | CUSTOM_ID
```

Classes R1→R9 sont définies dans `AI_HUMAN_RESOLUTION_POLICY_V0_1.md`.

Le moteur ne crée une question humaine que si :

`HUMAN_ONLY_OR_AUTHORITY_REQUIRED && MATERIAL_NOW`.

---

## 6. Evidence / provenance

```yaml
evidence:
  accepted_levels: [RAW_HUMAN, SOURCE_BACKED, OBSERVED, CALCULATED, WORKING_ASSUMPTION, AI_RECOMMENDATION, ACCEPTED_AS_CURRENT, HUMAN_VALIDATED, HUMAN_DECISION, EXPERT_SIGNOFF, ACCEPTED_UNKNOWN]
  provenance_required: true
  freshness_policy: IMMUTABLE | EVENT_DRIVEN | DAYS_30 | DAYS_90 | PROJECT_LIFETIME | CUSTOM
  conflict_policy: PRESERVE_AND_RESOLVE | AUTHORITY_WINS | FRESHEST_SOURCE_WINS | HUMAN_ARBITRATION | EXPERT_ARBITRATION
```

Une confidence textuelle peut être exposée :
- `Bien étayé`
- `Raisonnable mais à confirmer`
- `Hypothèse de travail`
- `Informations insuffisantes`

Aucun pourcentage de confiance décoratif.

---

## 7. Authority

```yaml
authority:
  ai_may_extract: true
  ai_may_hypothesize: true
  ai_may_recommend: true
  ai_may_decide: false
  decision_authority: USER | DECISION_OWNER | TEAM_RULE | EXPERT | DETERMINISTIC_RULE | NOT_APPLICABLE
```

Le fait qu'une IA sache proposer une réponse ne lui donne jamais l'autorité d'approuver une intention, un risque engageant ou un passage de Gate formelle.

---

## 8. Dependencies

```yaml
dependencies:
  requires_all: []
  requires_any: []
  benefits_from: []
  conditional_on: []
  conflicts_with: []
  unlocks: []
```

Les références peuvent viser :
- atom IDs ;
- context IDs ;
- gate IDs ;
- deliverable IDs.

`requires_*` est bloquant pour la résolution/finalisation de l'atom, pas nécessairement pour son exploration.

---

## 9. Criticality by Gate

Valeurs :

- `BLOCKING`
- `REQUIRED`
- `CONDITIONAL`
- `ENHANCER`
- `NOT_RELEVANT`

Exemple : une cible primaire peut être `REQUIRED` à G1 sous hypothèse de travail puis exiger `HUMAN_DECISION` à G7 seulement si l'équipe doit approuver un repositionnement stratégique.

---

## 10. Minimum resolution by Gate

```yaml
minimum_resolution_by_gate:
  G1: WORKING_ASSUMPTION
  G2: SOURCE_BACKED_OR_ACCEPTED
  G5: ACCEPTED_AS_CURRENT
  G7: HUMAN_DECISION
```

Valeurs candidates :

- `RAW_HUMAN`
- `SOURCE_BACKED`
- `OBSERVED`
- `CALCULATED`
- `WORKING_ASSUMPTION`
- `AI_RECOMMENDATION`
- `ACCEPTED_AS_CURRENT`
- `HUMAN_VALIDATED`
- `HUMAN_DECISION`
- `EXPERT_SIGNOFF`
- `ACCEPTED_UNKNOWN`

`minimum_resolution_by_gate` est la clé pour éviter de demander trop tôt une validation définitive.

---

## 11. State / lock policy

États actifs :

`WORKING → AI_PROPOSED → VALIDATED_CURRENT → LOCKED_FOR_DEPENDENTS → FROZEN_IN_DECISION_SNAPSHOT → APPROVED_FOR_PROJECT → FROZEN_FOR_BUILD`.

États de dérive :

`REVIEW_REQUIRED / STALE / SUPERSEDED / REJECTED / NOT_RELEVANT`.

```yaml
state_policy:
  first_lock_gate: G1 | G2 | ... | null
  decision_snapshot: true | false
  project_promotable: true | false
  build_freezable: true | false
```

---

## 12. Deliverables

```yaml
deliverables:
  contributes_to: []
  required_for: []
```

Un atom peut contribuer à plusieurs artifacts. Les domaines ne correspondent pas 1:1 à des documents.

---

## 13. Validation

```yaml
validation:
  method: deterministic rule or named validator
  pass_condition: machine expression or prose contract
  evidence_expected: []
```

Toute exigence structurante qui atteint `FROZEN_FOR_BUILD` doit être reliée à un `VERIFY` ou à une règle de validation explicite.

---

## 14. Change impact

```yaml
change_impact:
  invalidates_atoms: []
  review_atoms: []
  stale_artifacts: []
  preserves_atoms: []
  materiality_default: LOCAL | SUBSTANTIVE | CRITICAL
```

Le moteur doit recalculer les descendants impactés, jamais le dossier entier par défaut.

---

## 15. Sensitivity

```yaml
sensitivity:
  class: PUBLIC | INTERNAL | CONFIDENTIAL | PERSONAL_DATA | SENSITIVE_PERSONAL_DATA | SECRET
  may_use_for_web_search: true | false
  may_send_to_external_ai: true | false | POLICY_DEPENDENT
```

Une donnée privée ne doit jamais être injectée silencieusement dans une requête web publique.

---

## 16. Exemple compact

```yaml
- id: SV.D03.PRIMARY_AUDIENCE
  schema_version: 0.1
  type: DECISION
  domain_id: D03
  lifecycle_zone: IDEA_DISCOVERY
  blueprint_scope: [SITE_VITRINE]
  title: Audience principale active
  purpose: Permettre research, positionnement et parcours ciblés.
  risk_if_missing: Benchmark et solution risquent de viser le mauvais public.
  applicability:
    default: ACTIVE
  resolution:
    allowed_classes: [R1, R4, R6, R8]
    preferred_paths: [RAW, SRC, CONN, AI_H, HUM]
    default_human_interaction: OPTIONAL_CORRECTION
  evidence:
    accepted_levels: [SOURCE_BACKED, WORKING_ASSUMPTION, ACCEPTED_AS_CURRENT, HUMAN_DECISION]
    provenance_required: true
    freshness_policy: EVENT_DRIVEN
    conflict_policy: PRESERVE_AND_RESOLVE
  authority:
    ai_may_extract: true
    ai_may_hypothesize: true
    ai_may_recommend: true
    ai_may_decide: false
    decision_authority: DECISION_OWNER
  dependencies:
    requires_any: [SV.D02.ORG_CONTEXT, SV.D02.BUSINESS_OBJECTIVE]
    unlocks: [SV.D05.MARKET_CONTEXT, SV.D06.POSITIONING_OPTIONS]
  criticality_by_gate:
    G1: REQUIRED
    G7: REQUIRED
  minimum_resolution_by_gate:
    G1: WORKING_ASSUMPTION
    G7: ACCEPTED_AS_CURRENT
  state_policy:
    first_lock_gate: G1
    decision_snapshot: true
    project_promotable: true
    build_freezable: true
  deliverables:
    contributes_to: [A03_AUDIENCE_NEED_MODEL, A06_OPPORTUNITY_OPTIONS, A16_DECISION_PACKAGE]
  validation:
    method: audience_targetability_check
    pass_condition: Audience is specific enough to target market/evidence work without material guessing.
  change_impact:
    invalidates_atoms: [SV.D05.COMPETITOR_SET, SV.D06.POSITIONING_OPTIONS]
    stale_artifacts: [MARKET_COMPETITIVE_LANDSCAPE, CONCEPT_SITEMAP, DECISION_DECK]
    materiality_default: CRITICAL
  sensitivity:
    class: INTERNAL
    may_use_for_web_search: true
    may_send_to_external_ai: POLICY_DEPENDENT
```

---

## 17. Schema validation rules

Un Blueprint n'est valide que si :

1. chaque `id` est unique ;
2. toutes les références `requires/unlocks/invalidates` existent ;
3. aucune Gate ne dépend d'un atom impossible à activer dans son contexte ;
4. tout atom `BLOCKING` a au moins un chemin de résolution ;
5. tout `HUMAN_DECISION` indique une autorité ;
6. tout `EXPERT_SIGNOFF` indique son trigger ;
7. tout atom sensible interdit les chemins incompatibles ;
8. tout atom build-critical possède validation/VERIFY ;
9. les cycles `REQUIRES` bloquants sont interdits ;
10. les cycles de révision non bloquants doivent être explicitement marqués.

---

## 18. Status

V0.1 stabilise la grammaire de machine-contract.

Étape suivante : instancier cette grammaire dans le Blueprint `SITE_VITRINE`, puis exécuter des simulations de résolution/gates avant toute implémentation backend.
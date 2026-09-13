# 4b4c — REQUIREMENT ATOM SCHEMA — V0.2

Date : 2026-09-13

Statut : **CURRENT MACHINE-CONTRACT CANDIDATE — NON CANONIQUE**

Supersède comme candidat : `REQUIREMENT_ATOM_SCHEMA_V0_1.md`.

Corrections issues de la simulation :

1. une Gate peut accepter plusieurs formes de résolution équivalentes (`any_of`) ;
2. l'autorité est référencée par rôle explicite et peut différer entre Idea Approval et Build Ready ;
3. la validation d'un atom peut être déterministe, humaine ou experte sans confondre source et autorité.

---

## 1. Atom minimal

```yaml
id: stable.unique.id
schema_version: '0.2'
type: INFO | ANALYSIS | DECISION | SPEC | VERIFY
domain_id: D01..D22
lifecycle_zone: Z0..Z8
blueprint_scope: [SITE_VITRINE]
title: string
purpose: string
risk_if_missing: string
```

---

## 2. Applicability

```yaml
applicability:
  default: ACTIVE | INACTIVE
  all_of_contexts: []
  any_of_contexts: []
  none_of_contexts: []
  rule: optional deterministic expression
```

Un atom inapplicable devient `NOT_RELEVANT`.

---

## 3. Resolution

```yaml
resolution:
  allowed_classes: [R1, R2, R3, R4, R5, R6, R7, R8, R9]
  preferred_paths: [MEM, RAW, SRC, AUDIT, CONN, WEB, CALC, AI_H, AI_R, HUM, EXPERT]
  default_human_interaction: NONE | OPTIONAL_CORRECTION | LIGHT_REVIEW | EXPLICIT_CHOICE | FORMAL_APPROVAL | EXPERT_SIGNOFF
  human_only_reason: null
  rescue_policy: DEFAULT
```

`Requirement exists != user question`.

Question autorisée seulement si :

`HUMAN_ONLY_OR_AUTHORITY_REQUIRED && MATERIAL_NOW`.

---

## 4. Resolution state accepted by Gate

Une Gate peut utiliser :

### Forme simple

```yaml
minimum_resolution_by_gate:
  G2: SOURCE_BACKED
```

### Alternatives équivalentes

```yaml
minimum_resolution_by_gate:
  G1:
    any_of: [RAW_HUMAN, SOURCE_BACKED, ACCEPTED_AS_CURRENT]
```

### Niveau minimum ordonné

```yaml
minimum_resolution_by_gate:
  G7:
    at_least: ACCEPTED_AS_CURRENT
```

Valeurs :

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

Ces valeurs ne forment pas toutes une échelle universelle : `SOURCE_BACKED`, `CALCULATED` et `HUMAN_DECISION` expriment des dimensions différentes. Le moteur doit donc préférer `any_of` lorsque plusieurs types de preuve sont légitimes.

---

## 5. Evidence

```yaml
evidence:
  accepted_levels: []
  provenance_required: true
  freshness_policy: IMMUTABLE | EVENT_DRIVEN | DAYS_30 | DAYS_90 | PROJECT_LIFETIME | CUSTOM
  conflict_policy: PRESERVE_AND_RESOLVE | AUTHORITY_WINS | FRESHEST_SOURCE_WINS | HUMAN_ARBITRATION | EXPERT_ARBITRATION
```

Confidence labels :
- Bien étayé
- Raisonnable mais à confirmer
- Hypothèse de travail
- Informations insuffisantes

---

## 6. Authority V0.2

```yaml
authority:
  ai_may_extract: true
  ai_may_hypothesize: true
  ai_may_recommend: true
  ai_may_decide: false
  decision_authority:
    role_ref: IDEA_DECISION_OWNER | BUILD_READY_OWNER | CONTENT_OWNER | TECH_OWNER | PRIVACY_OWNER | EXPERT_ROLE | USER
    fallback: USER | TEAM_RULE | DETERMINISTIC_RULE | NOT_APPLICABLE
```

Règles :

- `IDEA_DECISION_OWNER` décide du passage Idea → Project ;
- `BUILD_READY_OWNER` approuve le handoff développement ;
- ces rôles peuvent être identiques ou différents ;
- l'IA peut recommander mais ne s'auto-attribue jamais ces rôles.

---

## 7. Dependencies

```yaml
dependencies:
  requires_all: []
  requires_any: []
  benefits_from: []
  conditional_on: []
  conflicts_with: []
  unlocks: []
```

Références autorisées : atom IDs, context IDs, gate IDs, deliverable IDs.

Les cycles de `requires_*` bloquants sont invalides.

---

## 8. Criticality

```yaml
criticality_by_gate:
  G1: REQUIRED
  G7: BLOCKING
```

Valeurs : `BLOCKING / REQUIRED / CONDITIONAL / ENHANCER / NOT_RELEVANT`.

La criticité appartient au couple **Requirement × Gate × Context**, pas à un champ global.

---

## 9. Lock / state

États :

`WORKING → AI_PROPOSED → VALIDATED_CURRENT → LOCKED_FOR_DEPENDENTS → FROZEN_IN_DECISION_SNAPSHOT → APPROVED_FOR_PROJECT → FROZEN_FOR_BUILD`.

Dérive : `REVIEW_REQUIRED / STALE / SUPERSEDED / REJECTED / NOT_RELEVANT`.

```yaml
state_policy:
  first_lock_gate: Gx | null
  decision_snapshot: true | false
  project_promotable: true | false
  build_freezable: true | false
```

---

## 10. Validation

```yaml
validation:
  method: validator_id
  pass_condition: string
  evidence_expected: []
  authority_required: null | role_ref
```

Une exigence critique `FROZEN_FOR_BUILD` doit avoir une validation/VERIFY.

---

## 11. Change impact

```yaml
change_impact:
  invalidates_atoms: []
  review_atoms: []
  stale_artifacts: []
  preserves_atoms: []
  materiality_default: COSMETIC | LOCAL | SUBSTANTIVE | CRITICAL
```

Recompute ciblé uniquement.

---

## 12. Sensitivity

```yaml
sensitivity:
  class: PUBLIC | INTERNAL | CONFIDENTIAL | PERSONAL_DATA | SENSITIVE_PERSONAL_DATA | SECRET
  may_use_for_web_search: true | false
  may_send_to_external_ai: true | false | POLICY_DEPENDENT
```

Aucune donnée privée n'est injectée silencieusement dans une recherche publique.

---

## 13. Deliverables

```yaml
deliverables:
  contributes_to: []
  required_for: []
```

---

## 14. Validation du Blueprint

Un Blueprint machine est valide si :

1. IDs uniques ;
2. toutes références résolues ;
3. pas de cycles bloquants ;
4. tout `BLOCKING` a un chemin de résolution ;
5. tout `R8` a une autorité ;
6. tout `R9` a un trigger expert ;
7. règles de sensibilité compatibles avec acquisition ;
8. toute exigence build-critical est vérifiable ;
9. contexte `NOT_RELEVANT` ne bloque aucune Gate ;
10. les overrides ne créent pas de contradiction non détectée ;
11. Idea approval et Build Ready peuvent référencer des owners différents ;
12. stale data ne peut jamais satisfaire une Gate current.

---

## 15. Override contract

Pour éviter de réécrire un registry complet lors d'une correction locale :

```yaml
overrides:
  - target: SV.D02.ORG_CONTEXT
    patch:
      minimum_resolution_by_gate:
        G1_FOUNDATION_LOCKABLE:
          any_of: [RAW_HUMAN, SOURCE_BACKED, ACCEPTED_AS_CURRENT]
```

Les overrides sont appliqués après le registry de base et sont versionnés/audités.

---

## 16. Status

V0.2 devient le schema candidat actif pour les fichiers machine Site vitrine.
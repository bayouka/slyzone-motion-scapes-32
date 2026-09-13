# 4b4c — CROSS-CUTTING LEDGER MODEL — V0.1

Date : 2026-09-13

Statut : **WORKING CANDIDATE — NON CANONIQUE**

But : préserver traçabilité, provenance, hypothèses, décisions, risques et conflits à travers D01→D22 sans dupliquer ces informations dans chaque Domain.

---

# 1. Evidence / Source Ledger

Chaque source conserve :
- `source_id`
- type/origin ;
- URI/reference ;
- owner/access ;
- date/freshness ;
- authority ;
- extracted observations ;
- sensitivity ;
- version ;
- status current/stale/superseded.

Une source n’est pas une conclusion.

Relation : `SOURCE → OBSERVATION → INTERPRETATION → CONSEQUENCE`.

---

# 2. Assumption Ledger

Chaque hypothèse :
- `assumption_id`
- statement ;
- origin ;
- evidence for/against ;
- confidence class ;
- affected atoms/artifacts ;
- risk if wrong ;
- test/probe ;
- owner ;
- status open/accepted/tested/rejected/superseded.

Une hypothèse peut être `ACCEPTED_CURRENT` sans devenir un fait.

---

# 3. Decision Ledger

Chaque décision :
- `decision_id`
- Decision Question ;
- options considered ;
- selected outcome ;
- rationale ;
- evidence references ;
- assumptions ;
- trade-offs ;
- risks ;
- authority/owner ;
- timestamp/version ;
- conditions ;
- what-could-change-this ;
- supersession link.

La décision ne réécrit jamais rétroactivement les options rejetées.

---

# 4. Risk / Unknown Ledger

Chaque item :
- type `RISK / UNKNOWN / DEPENDENCY / CONDITION` ;
- statement ;
- likelihood/impact qualitatif si pertinent ;
- blocking_for ;
- owner ;
- mitigation/probe ;
- due point/gate ;
- accepted_unknown policy ;
- status.

Pas de score numérique décoratif obligatoire.

---

# 5. Conflict Group Ledger

Chaque contradiction significative :
- `conflict_group_id`
- claims/sources concernés ;
- freshness/authority ;
- affected decisions/artifacts ;
- resolution attempts ;
- owner if human arbitration ;
- status open/resolved/accepted coexistence.

Interdiction : fusion silencieuse de claims incompatibles.

---

# 6. Change Ledger

Chaque changement matériel :
- source ;
- old/new ;
- author ;
- timestamp ;
- materiality ;
- direct atom ;
- descendants impactés ;
- stale artifacts ;
- recomputation ;
- decisions reopened ;
- unaffected artifacts ;
- resulting version/snapshot.

---

# 7. Artifact Registry

Chaque artifact :
- `artifact_id`
- type ;
- purpose ;
- lifecycle zone ;
- status ;
- source snapshot ;
- input atoms/decisions ;
- owner ;
- generated/validated timestamps ;
- current version ;
- stale reason ;
- promotion status ;
- replaces/supersedes.

Applicable notamment aux audits, sitemap, journeys, mockups, deck, specs, handoff.

---

# 8. Requirement Traceability Ledger

Pour requirement critique :

`WHY / SOURCE / DECISION → REQUIREMENT → SPEC → VERIFY → EVIDENCE OF VERIFICATION`

Avant Build Ready, aucun requirement critique ne doit avoir un maillon structurel manquant sans accepted unknown explicite.

---

# 9. Snapshot Registry

Snapshots minimaux :
- `DECISION_SNAPSHOT_ID`
- `APPROVED_IDEA_SNAPSHOT_ID`
- `PROJECT_BASELINE_SNAPSHOT_ID`
- `BUILD_READY_SNAPSHOT_ID`

Chaque snapshot est immuable et référence les versions exactes des artifacts/decisions/requirements actifs à cet instant.

---

# 10. UX implication future

Ces ledgers restent principalement invisibles.

Ils servent à répondre simplement lorsque nécessaire :
- « D’où vient cette conclusion ? »
- « Pourquoi avez-vous recommandé cela ? »
- « Qu’est-ce qui a changé ? »
- « Qu’est-ce qui doit être revu ? »
- « Quelle version a été approuvée ? »

Ils ne deviennent jamais un dashboard technique obligatoire pour le novice.

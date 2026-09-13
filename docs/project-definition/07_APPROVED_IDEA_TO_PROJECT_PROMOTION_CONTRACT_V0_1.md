# 4b4c — APPROVED IDEA → PROJECT PROMOTION CONTRACT — V0.1

Date : 2026-09-13

Statut : **WORKING CANDIDATE — NON CANONIQUE**

But : définir Z6 précisément. Une Idea approuvée ne doit ni repartir de zéro en Project, ni importer aveuglément des artifacts exploratoires.

---

# 1. Entrée

Entrée minimale :
- `APPROVED_IDEA_SNAPSHOT_ID` ;
- Decision Record ;
- Review feedback résolu ;
- change set appliqué ;
- conditions d’approbation classées ;
- artifacts courants/non-stale ;
- accepted risks/unknowns.

---

# 2. Approval outcomes

## `APPROVE_TO_PROJECT`

Création immédiate du Project Definition Baseline.

## `APPROVE_WITH_CONDITIONS`

Chaque condition reçoit une classe :

### `STRUCTURAL_BLOCKING`
Ex. cible non décidée, integration critique non faisable, budget incompatible, contrainte légale pouvant invalider le concept.

→ pas de Project baseline tant que non résolue ou décision explicitement transformée.

### `PROJECT_RESOLVABLE`
Ex. préciser workflow CMS, sélectionner fournisseur, approfondir responsive, finaliser content ownership.

→ Project peut être créé ; condition devient Requirement prioritaire avec owner.

### `NON_BLOCKING_ACCEPTED_UNKNOWN`
Ex. photo finale pas encore disponible, texte d’un cas client à venir, valeur exacte secondaire.

→ Project créé ; inconnue suivie explicitement.

---

# 3. Promotion classification par artifact

Chaque artifact Z4/Z5 reçoit :

## `PROMOTE_DIRECTLY`
Déjà assez précis, cohérent, current et approuvé.

## `PROMOTE_AND_DEEPEN`
Baseline valide mais doit être enrichie en Project.

## `REWORK_TARGETED`
Feedback/condition impose correction limitée.

## `DO_NOT_PROMOTE`
Exploration abandonnée, stale ou uniquement comparative.

## `SUPERSEDE`
Conserver historique sans l’utiliser comme baseline.

---

# 4. Promotion typique

| Artifact Idea/Prefiguration | Promotion Project |
|---|---|
| Business objective | `APPROVED_FOR_PROJECT`, devient requirement stratégique |
| Primary audience | baseline D03 Project, revalidation seulement si change |
| Market study | evidence historique/current ; pas à refaire sans staleness |
| Positioning | baseline message/content/design |
| Macro scope | baseline D12 ; approfondir rules/states/data |
| Concept journey | D08 promote+deepen |
| Concept sitemap | D09 promote+deepen |
| Message blocks | D10 promote+deepen |
| SEO concept | D11 promote+deepen |
| Concept features | D12 promote+deepen |
| Visual territory | D15 baseline |
| Hi-fi mockup | référence visuelle ; jamais substitut au design system/spec |
| Feasibility envelope | input D16 ; architecture détaillée reste Project |
| Business case | decision evidence ; pas forcément build requirement |
| Decision Deck | historical decision artifact, pas spec de build |

---

# 5. Project Baseline creation

Le Project Definition Baseline doit contenir :

- vision/decision rationale ;
- business outcomes ;
- approved target/segments ;
- positioning/value proposition ;
- approved macro offer/scope/non-goals ;
- critical constraints ;
- promoted artifacts ;
- risks/unknowns ;
- conditions ;
- source/evidence references ;
- owners/decision authority ;
- `APPROVED_IDEA_SNAPSHOT_ID`.

Il ne copie pas tout le dossier de recherche dans chaque spec ; il référence les evidence sources.

---

# 6. Review-change integrity

Avant promotion :
1. prendre le Decision Snapshot présenté ;
2. appliquer Review feedback accepté ;
3. recalculer descendants impactés ;
4. vérifier qu’aucun artifact promu n’est stale ;
5. produire un `PROMOTION_DIFF` : présenté → approuvé ;
6. demander approval final si change set substantiel n’a pas encore été approuvé.

---

# 7. Reopening after Project creation

Une baseline Project n’empêche pas les changements.

Si une modification Project remet en cause un élément stratégique :
- classifier materiality ;
- identifier ancestor Idea decision ;
- mettre cet élément `REVIEW_REQUIRED` ;
- réouvrir uniquement branche nécessaire ;
- produire nouveau snapshot/version ;
- ne jamais réécrire silencieusement l’Idea approval historique.

---

# 8. Conditions de Z6 complete

Z6 est complète lorsque :
- approval authority correcte ;
- structural blockers résolus ;
- change set intégré ;
- artifacts promus current ;
- Project Baseline versionnée ;
- conditions Project-resolvable ont owner/requirement ;
- accepted unknowns sont explicites ;
- provenance vers Idea Snapshot est conservée.

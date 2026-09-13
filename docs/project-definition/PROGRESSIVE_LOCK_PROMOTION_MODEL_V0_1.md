# 4b4c — PROGRESSIVE LOCK / FREEZE / PROMOTION MODEL — V0.1

Date : 2026-09-13

Statut : **CANDIDATE — NON CANONIQUE**

Objet : répondre précisément à « quand une information ou une partie du projet est-elle validée, verrouillée, figée, réouverte ou promue ? ».

---

# 1. Principe

Le dossier actif n’est presque jamais « figé pour toujours ».

La bonne mécanique est :

`comprendre → valider → verrouiller pour dépendants → créer snapshot → recevoir nouvelle evidence/feedback → réouvrir si matériel → versionner`.

Le freeze dur concerne des **snapshots**, pas la réalité future.

---

# 2. États

## WORKING
Exploration en cours.

## AI_PROPOSED
Proposition générée par 2b2c, non acceptée comme baseline.

## VALIDATED_CURRENT
Utilisateur/owner accepte comme état courant.

## LOCKED_FOR_DEPENDENTS
Suffisamment stable pour autoriser les travaux aval. Modification possible, mais contrôlée par Change Impact.

## FROZEN_IN_DECISION_SNAPSHOT
Version immuable utilisée dans une présentation/décision donnée.

## APPROVED_FOR_PROJECT
Approuvé après Review ; devient baseline Project.

## FROZEN_FOR_BUILD
Inclus dans le snapshot READY_FOR_DEVELOPMENT.

## REVIEW_REQUIRED
Nouvelle evidence/feedback peut remettre en cause l’élément.

## STALE
Descendant calculé depuis une version obsolète.

## SUPERSEDED / REJECTED
Historique conservé mais non actif.

---

# 3. Recommandation par domaine

| Domaine | Premier lock possible | Freeze décision | Freeze build |
|---|---|---|---|
| D02 Business/problem/outcomes | G1 si intention claire | G6 snapshot | G12 seulement si repris comme requirement |
| D03 Target/users | G1 si suffisamment fiable | G6 | G12 pour requirements cible actifs |
| D04 Existing/evidence | éléments factuels source-backed peuvent être lockés tôt | G6 evidence snapshot | n/a sauf migration/spec |
| D05 Market/competition | après research sufficiency | G6 | n/a ; evidence peut vieillir |
| D06 Strategy/positioning | G4 pour prefiguration | G6 puis approval G7 | décliné en specs Project |
| D07 Macro scope | G4/G5 | G6 puis approval G7 | scope détaillé G8/G12 |
| D08 Journey concept | G5 FOR_DECISION | G6 | détail G8/G12 |
| D09 Sitemap concept | G5 FOR_DECISION | G6 | route/page spec G8/G12 |
| D10 Content/message concept | G5 FOR_DECISION | G6 | content requirements G8/G12 |
| D11 SEO concept | G5 si pertinent | G6 | SEO spec G8/G12 |
| D12 Macro capabilities | G5 | G6 | functional spec G8/G12 |
| D15 Visual concept | G5 | G6 | design definition G9/G12 |
| D16 Feasibility envelope | G5 | G6 | architecture G10/G12 |
| D17–D18 critical probes | dès risque identifié | G6 si décisionnel | NFR G10/G12 |
| D19 success model | G5 | G6 | measurement spec G10/G12 |
| D21 business case | quand inputs suffisants | G6 | non nécessaire au build sauf requirements dérivés |
| D22 presentation/review | G6 package snapshot | G7 decision record | n/a |

---

# 4. Business/problem/target peuvent-ils être « figés » avant audit ?

Oui, au sens `LOCKED_FOR_DEPENDENTS` si :

- l’intention business est explicitement connue ;
- la cible est suffisamment précise ;
- aucun conflit critique connu n’existe ;
- l’utilisateur/owner accepte cette baseline.

Cela permet de lancer audit/research sans attendre.

Non, au sens « ne changera jamais ».

Exemple :
- owner déclare cible B2C ;
- analytics et ventes montrent majorité B2B ;
- ce constat ne remplace pas automatiquement l’intention B2C ;
- il crée `REVIEW_REQUIRED` : « souhaitez-vous vraiment changer le mix, ou le site doit-il refléter le business actuel ? ».

Ainsi le système respecte l’intention tout en utilisant l’evidence.

---

# 5. Promotion des artifacts de préfiguration

## Promote directly

Conditions :
- toujours cohérent avec la baseline approuvée ;
- assez précis ;
- aucune dépendance stale ;
- aucune correction de Review non intégrée.

Ex. sitemap conceptuel très solide importé comme baseline Project.

## Promote and deepen

Cas le plus fréquent.

Ex. feature « réservation » approuvée → Project doit encore définir rules, data, integration, loading/error, privacy, acceptance.

## Rework targeted

Artifact impacté par feedback ou changement.

## Reject / supersede

Direction abandonnée ; historique conservé.

---

# 6. Change Impact

Une modification n’entraîne jamais « recommencer depuis le début » par défaut.

Chaque change produit :

- source du changement ;
- old/new value ;
- materiality ;
- affected atoms ;
- affected artifacts ;
- required re-analysis ;
- required human decisions ;
- artifacts still valid.

Exemples :

### Couleur préférée change
D15 local seulement.

### Offre prioritaire change
D06/D07, sitemap, messages, features, projections, deck peuvent être impactés.

### Target B2C → B2B
D03 + D05 + D06 + D07 + prefiguration + business case + deck probablement stale.

### Budget diminue de 30 %
D07 scope + D16 feasibility + D21 business case ; target/problem restent valides.

---

# 7. Snapshot semantics

Le Decision Deck doit toujours référencer un `DECISION_SNAPSHOT_ID`.

Le Project créé après approbation doit référencer :

- `APPROVED_IDEA_SNAPSHOT_ID`
- Review Decision Record
- accepted change set
- artifacts promoted.

Le Build Ready package doit référencer un autre snapshot :

- `BUILD_READY_SNAPSHOT_ID`.

Aucun deck, Project ou handoff ne doit pointer silencieusement vers des artifacts stale.

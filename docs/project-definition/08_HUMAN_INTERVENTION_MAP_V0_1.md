# 4b4c — HUMAN INTERVENTION MAP — V0.1

Date : 2026-09-13

Statut : **WORKING CANDIDATE — NON CANONIQUE**

But : distinguer le référentiel exhaustif des vraies sollicitations utilisateur. Le moteur doit résoudre le maximum sans transformer le dossier en formulaire.

---

# 1. Principe

Une intervention humaine n’est justifiée que si :

`HUMAN_ONLY_OR_AUTHORITY_REQUIRED = true`

ET

`MATERIAL_NOW = true`.

Sinon 2b2c doit : extraire, auditer, rechercher, calculer, hypothétiser, recommander, différer ou accepter unknown selon risque.

---

# 2. Human-only typique par zone

## Z1 — Foundation

Questions potentiellement légitimes :
- objectif futur réellement prioritaire ;
- cible future volontairement différente de l’actuelle ;
- offre à pousser/réduire ;
- hard budget ;
- hard deadline ;
- contrainte politique/contractuelle non documentée ;
- décision owner/method si équipe.

Ne pas demander par défaut : secteur, pages actuelles, site URL si fourni, offres affichées, zone observable, audience actuelle observable.

## Z2 — Evidence / market

Questions humaines rares :
- accès privé à analytics/CRM/Search Console si souhaité ;
- arbitrage d’un conflit de sources réellement matériel ;
- contexte métier interne que le marché ne peut révéler.

Ne pas demander : liste de concurrents, bonnes pratiques, weaknesses, patterns, alternatives, benchmark.

## Z3 — Strategy / options

Interventions :
- choix entre objectifs incompatibles ;
- sélection d’une direction quand trade-offs irréductibles ;
- acceptation d’un risque/unknown ;
- priorité d’offre interne.

Ne pas demander : “quelle amélioration proposez-vous ?”, “quel positionnement devrions-nous avoir ?”, “quelles fonctionnalités ?” — 2b2c doit proposer.

## Z4 — Prefiguration

Interventions :
- préférence visuelle si utile ;
- correction d’un parcours métier caché ;
- arbitrage conceptuel si plusieurs directions valides ;
- factual claim non sourcé.

Ne pas demander : sitemap, journey, features, wireframe, messages, SEO concept, maquette — 2b2c doit produire.

## Z4b — Concept validation

Interventions :
- recrutement/accès à de vrais utilisateurs si nécessaire ;
- participation/autorisation pour test réel ;
- interprétation finale de trade-offs si evidence ambiguë.

Ne pas substituer persona IA à evidence réelle.

## Z5 — Decision package / review

Interventions :
- décision finale ;
- feedback/commentaires ;
- arbitrage de feedback contradictoire ;
- acceptation de conditions/risques ;
- données privées nécessaires au business case.

## Z6 — Promotion

Interventions :
- approval du change set substantiel si différent du deck présenté ;
- classification/acceptation d’une condition structurante si owner requis.

## Z7 — Project definition

Interventions typiques :
- règle métier interne non documentée ;
- owner de contenu/process ;
- choix de scope coût/valeur ;
- vendor/platform imposé ;
- préférence visuelle finale si non résolue ;
- droits/claims/contents non vérifiables ;
- accès privés nécessaires.

Ne pas demander : détails d’états UI, structure de données candidate, fallback standard, critères QA de base — 2b2c/experts doivent proposer.

## Z8 — Build Ready

Interventions :
- accepted unknown/risk ;
- expert signoff ;
- Ready-for-Development approval.

---

# 3. Question batching

Ne jamais faire valider atom par atom.

Bundles candidats :

## `FOUNDATION_REVIEW`
- objectif ;
- cible ;
- offre prioritaire ;
- contraintes hard.

## `STRATEGY_REVIEW`
- direction recommandée ;
- trade-offs ;
- macro scope/non-goals ;
- risky assumptions.

## `CONCEPT_REVIEW`
- journey/sitemap/capabilities ;
- visual territory si utile.

## `DECISION_REVIEW`
- approve/revise/deepen/pause/stop ;
- conditions/risks.

## `PROJECT_SCOPE_REVIEW`
- in/out/later ;
- business rules réellement engageantes.

## `BUILD_READY_APPROVAL`
- blockers ;
- accepted unknowns ;
- handoff current ;
- approval.

Un bundle n’est affiché que si une vraie intervention est nécessaire.

---

# 4. Question scoring

Une User Question candidate reçoit :

- `materiality_to_current_gate`
- `human_exclusivity`
- `answerability_from_sources`
- `reversible_assumption_possible`
- `cost_of_delay`
- `cost_of_wrong_assumption`
- `user_effort`

Prioriser une question si :
- human exclusivity élevée ;
- erreur coûteuse ;
- bloque plusieurs descendants ;
- réponse courte/accessible.

Déprioriser si :
- recherche/IA peut résoudre ;
- assumption réversible suffit ;
- aucun artifact actuel n’en dépend ;
- effort utilisateur disproportionné.

---

# 5. Rescue patterns

Si l’utilisateur ne sait pas :
- proposer options concrètes ;
- montrer conséquence ;
- recommander si possible ;
- prendre working assumption ;
- différer ;
- accepted unknown ;
- expert si risque élevé.

Exemple :

Au lieu de « Quel positionnement voulez-vous ? »
→ 2b2c présente deux positionnements argumentés et demande seulement si un arbitrage est nécessaire.

Au lieu de « Qui sont vos concurrents ? »
→ 2b2c les recherche et permet correction.

Au lieu de « Quelles pages voulez-vous ? »
→ 2b2c propose le sitemap issu de target/journey/benchmark/SEO.

---

# 6. Target UX metric

Le succès n’est pas “le moins de questions possible” à tout prix.

Le succès est :

> **aucune question évitable, aucune décision humaine escamotée.**

Un dossier riche peut être produit avec très peu de sollicitations si sources/evidence sont suffisantes ; une idée ambiguë peut nécessiter plusieurs arbitrages, mais jamais sous forme de questionnaire exhaustif.

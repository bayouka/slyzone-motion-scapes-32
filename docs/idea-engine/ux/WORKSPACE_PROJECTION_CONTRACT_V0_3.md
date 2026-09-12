# 4b4c — IDEA WORKSPACE PROJECTION CONTRACT — V0.3

Date : 2026-09-13

Statut : **CANDIDATE UX CONTRACT — NON VALIDÉ FONCTIONNELLEMENT**

Supersède comme candidat UX : `WORKSPACE_PROJECTION_CONTRACT_V0_2.md`.

Ce document ne remplace pas le Master Blueprint V1.1, Matrix V5 ou Capture Contract V1.2.

---

## 1. Correction principale

Le workspace ne doit pas expliquer longuement l'état interne du moteur.

Il doit produire en priorité :

1. une éventuelle intervention humaine minimale ;
2. une nouvelle valeur concrète ;
3. un accès léger à ce que 2b2c fait / a utilisé ;
4. un accès permanent pour corriger ou demander autre chose.

**Compréhension connue ≠ contenu principal.**

Si une information a déjà été donnée par l'utilisateur, elle ne mérite pas d'être relue en grand sauf si une contradiction ou une décision en dépend.

---

## 2. Nouvelle hiérarchie de projection

### A — `HUMAN_INPUT_INLINE`

Optionnel.

Une seule décision cognitive dominante lorsque l'humain est réellement nécessaire.

Format compact :

- question ;
- une phrase maximum pour expliquer son impact si nécessaire ;
- choix ou réponse simple ;
- `Je ne sais pas / plus tard` si légitime.

Ce bloc n'est jamais une page ni une phase.

Après réponse il se réduit ou disparaît immédiatement.

### B — `VALUE_NOW`

Surface principale.

Montre la meilleure nouvelle valeur disponible :

- amélioration ;
- observation importante ;
- comparaison ;
- challenge ;
- Candidate ;
- recommandation ;
- conflit à arbitrer ;
- décision prête.

Lorsque possible, afficher d'abord **ce que 2b2c recommande de changer ou considérer**, puis permettre d'ouvrir la justification.

### C — `SYSTEM_MICROSTATUS`

Optionnel et compact.

Exemples :

- `Analyse du site en cours` ;
- `3 concurrents pertinents trouvés` ;
- `2 documents encore en analyse`.

Ce statut ne devient jamais une grande carte de lecture ni une page d'attente.

### D — `EVIDENCE_DEPTH`

Secondaire / progressive disclosure.

Permet d'ouvrir : sources, concurrents, observations, hypothèses, conflits, provenance, détails d'audit.

Le novice n'est pas obligé de lire cette profondeur pour avancer.

### E — `FREE_INPUT`

Toujours accessible.

Permet de corriger, ajouter, demander, changer l'objectif ou appeler une capacité.

Sur mobile, cet accès peut être compact lorsqu'une User NBA occupe l'attention.

---

## 3. Suppressions explicites depuis V0.2

Ne plus considérer comme surfaces permanentes :

- `ORIENTATION_NOW` sous forme de paragraphe explicatif systématique ;
- `PROGRESS_SIGNAL` comme carte dédiée systématique ;
- `NEXT_VALUE_HINT` comme bloc de lecture systématique ;
- `Travail utile courant` ;
- `Compréhension actuelle` ;
- `Acquis pour l'instant` affiché comme mini-formulaire latéral permanent.

Ces informations peuvent exister sous forme compacte ou en profondeur si elles aident réellement.

La règle générale devient : **moins de narration, plus de conséquence.**

---

## 4. Transition après une question

Interdit :

`Question → réponse → nouvelle page passive → relecture → nouvelle question`.

Cible :

`Question inline → réponse → question repliée → recalcul ciblé → System Actions → VALUE_NOW`.

Si une autre question devient immédiatement nécessaire, elle apparaît dans la même surface sans navigation, mais seulement après avoir vérifié qu'aucune action autonome ne peut produire davantage de valeur avant de solliciter de nouveau l'utilisateur.

---

## 5. MINIMUM_WORKABLE_CONTEXT

Le système n'attend pas une compréhension exhaustive.

Dès que la nature de l'Idea, l'activité/offre, l'objectif/problème, l'audience et les éventuels conflits critiques sont suffisamment exploitables — y compris avec hypothèses réversibles — il peut lancer l'enrichissement autonome.

Ce seuil ne crée aucune phase visible.

---

## 6. Enrichissement autonome par défaut

Pour un site vitrine commercial, lorsque le contexte permet de cibler correctement le marché, 2b2c doit généralement lancer un enrichissement parallèle comprenant selon pertinence :

- audit site / sources ;
- concurrence directe ;
- alternatives ;
- références exemplaires ;
- positionnements ;
- offres ;
- CTA / conversion ;
- patterns contenu ;
- preuves / rassurance ;
- opportunités ;
- SEO/local ;
- challenge / simplification ;
- faisabilité des fonctions structurantes.

Ce travail n'attend pas que l'utilisateur réponde à toutes les futures questions possibles.

---

## 7. Contrat de première valeur

La première sortie visible après Capture ou après un arbitrage doit idéalement être l'une des suivantes :

- `3 améliorations que je ferais en priorité` ;
- `ce que votre site actuel freine aujourd'hui` ;
- `ce que vos concurrents font mieux / moins bien` ;
- `une direction plus simple que celle imaginée` ;
- `deux options réellement différentes à comparer` ;
- `un conflit qui change la stratégie` ;
- `une Candidate concrète`.

Ne pas utiliser comme première valeur :

- résumé du brief ;
- confirmation que 2b2c a compris ;
- liste de champs déjà connus ;
- checklist technique de traitements.

---

## 8. Contrat du benchmark concurrentiel

Le benchmark ne doit pas devenir un rapport à lire avant de continuer.

Projection principale :

### `À reprendre`

Patterns observés qui servent réellement l'objectif.

### `À éviter`

Faiblesses/frictions observées ou patterns banalisés.

### `Notre opportunité`

Ce que la Candidate peut faire de plus clair, plus simple ou plus différenciant.

En profondeur :

- concurrents/références ;
- sources ;
- observations ;
- date/fraîcheur ;
- interprétation ;
- impact sur la Candidate.

Aucune fonction n'est recommandée uniquement parce que plusieurs concurrents l'utilisent.

---

## 9. Contrat de question novice

Avant toute question humaine, vérifier :

1. est-elle réellement stratégique ou human-only ?
2. existe-t-elle déjà dans RAW/MEM/SRC ?
3. la recherche peut-elle la résoudre ?
4. une hypothèse réversible suffit-elle pour continuer ?
5. doit-elle être résolue maintenant ?
6. la réponse changera-t-elle réellement ce que 2b2c produit ?

Si une seule réponse est `non`, la question n'est pas prioritaire.

Une question doit idéalement tenir en une phrase courte.

---

## 10. État sans action humaine

Quand aucune action humaine n'est nécessaire :

- ne pas remplir l'écran avec une explication ;
- afficher les résultats disponibles ;
- si aucun résultat n'est encore disponible, afficher seulement un microstatus discret et laisser l'utilisateur naviguer / parler à 2b2c ;
- injecter automatiquement le prochain résultat substantiel dans la surface lorsqu'il arrive.

Un état `rien à faire` ne doit jamais devenir une page morte.

---

## 11. Dossier et provenance

Le dossier reste indispensable, mais il devient une profondeur secondaire.

Accès possible à :

- informations connues ;
- sources ;
- concurrents ;
- hypothèses ;
- conflits ;
- décisions ;
- versions.

Il ne doit pas occuper l'espace principal tant que l'utilisateur ne demande pas à auditer/corriger ces éléments.

---

## 12. Gate avant validation

V0.3 devra être prototypé et testé sur :

1. Nathalie : réponse à une question → premières améliorations sans écran passif ;
2. Nathalie : trois inconnues successives sans fatigue ;
3. Vincent : aucune question, research + Candidate directement ;
4. refonte avec site existant : audit + concurrents en parallèle ;
5. conflit B2B/B2C : arbitrage inline + recalcul ciblé ;
6. solution disproportionnée : challenge visible avant approfondissement ;
7. utilisateur ajoute une information pendant le research ;
8. recherche longue / partielle / échec ;
9. mobile : aucune concurrence entre question et composer ;
10. benchmark détaillé accessible sans imposer sa lecture.

Aucune validation fonctionnelle avant ces tests.

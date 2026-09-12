# 4b4c — IDEA WORKSPACE PROJECTION CONTRACT — V0.3

Date : 2026-09-13

Statut : **REJETÉ COMME DIRECTION UX ACTIVE — HISTORIQUE / SUPPORT D’AUDIT**

Ce document ne doit pas être implémenté ni poursuivi comme cible UX actuelle.

Motif : l’audit du 2026-09-13 a montré que 4b4c a commencé à concevoir la projection du workspace avant d’avoir formalisé correctement le lifecycle professionnel complet `Idea → Project pré-développement → Ready for Development`. Une Idea ne doit pas être mise en forme prématurément avant que cible, evidence, concurrence, alternatives, amélioration/challenge et faisabilité décisionnelle aient eu la possibilité de modifier la direction initiale.

Nouvelle source de travail prioritaire :

`docs/idea-engine/validation/IDEA_TO_PROJECT_PROFESSIONAL_LIFECYCLE_AUDIT_20260913.md`

Les principes utiles ci-dessous restent conservés comme historique, mais aucun ne prévaut sur le prochain lifecycle validé.

---

## 1. Correction principale identifiée à l’époque

Le workspace ne devait pas expliquer longuement l'état interne du moteur.

Il devait produire en priorité :

1. une éventuelle intervention humaine minimale ;
2. une nouvelle valeur concrète ;
3. un accès léger à ce que 2b2c fait / a utilisé ;
4. un accès permanent pour corriger ou demander autre chose.

**Compréhension connue ≠ contenu principal.**

Si une information a déjà été donnée par l'utilisateur, elle ne mérite pas d'être relue en grand sauf si une contradiction ou une décision en dépend.

---

## 2. Hiérarchie de projection candidate historique

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

## 3. Suppressions identifiées depuis V0.2

Ne plus considérer comme surfaces permanentes :

- `ORIENTATION_NOW` sous forme de paragraphe explicatif systématique ;
- `PROGRESS_SIGNAL` comme carte dédiée systématique ;
- `NEXT_VALUE_HINT` comme bloc de lecture systématique ;
- `Travail utile courant` ;
- `Compréhension actuelle` ;
- `Acquis pour l'instant` affiché comme mini-formulaire latéral permanent.

Ces informations pouvaient exister sous forme compacte ou en profondeur si elles aidaient réellement.

Règle historique utile : **moins de narration, plus de conséquence.**

---

## 4. Transition après une question — règle historique conservée

Interdit :

`Question → réponse → nouvelle page passive → relecture → nouvelle question`.

Candidate précédente :

`Question inline → réponse → question repliée → recalcul ciblé → System Actions → VALUE_NOW`.

Cette règle reste probablement pertinente, mais sa projection finale devra être redéfinie après validation du lifecycle professionnel.

---

## 5. Pourquoi cette V0.3 est maintenant rejetée

Elle cherchait encore à décider trop tôt ce que le workspace devait montrer alors que la profondeur professionnelle de la phase Idea n'était pas assez formalisée.

La nouvelle priorité est de définir :

- les sections réelles de Discovery ;
- les données nécessaires pour cibler correctement ;
- le moment où la recherche concurrentielle devient pertinente ;
- la façon dont cette recherche peut modifier l'Idée initiale ;
- le challenge et les alternatives avant sélection ;
- la frontière exacte Idea / Project ;
- les sections Project nécessaires jusqu'à `READY_FOR_DEVELOPMENT` ;
- les exit criteria de chaque section ;
- les responsabilités humain / IA / sources / web / calcul.

Aucune nouvelle itération workspace ne doit être produite avant cette architecture.
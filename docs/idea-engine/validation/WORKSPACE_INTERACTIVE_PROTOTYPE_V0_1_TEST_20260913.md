# 4b4c — WORKSPACE INTERACTIVE PROTOTYPE V0.1 — TEST REPORT

Date : 2026-09-13

Statut : **VALIDATION SUPPORT — NON CANONIQUE / NON PRODUCTION**

Objet : vérifier par un prototype fonctionnel isolé que le même workspace Idea peut projeter plusieurs états moteur et évoluer après une action sans recréer un parcours séquentiel.

Ce document complète :

- `docs/idea-engine/ux/WORKSPACE_PROJECTION_CONTRACT_V0_2.md` ;
- `docs/idea-engine/ux/WORKSPACE_WIREFRAMES_V0_1.md` ;
- `docs/idea-engine/validation/WORKSPACE_PROJECTION_V0_2_RED_TEAM_20260913.md`.

Il ne remplace pas le Master Blueprint et n'autorise aucune modification du runtime ou du backend.

---

## 1. Prototype construit

Prototype HTML/CSS/JS autonome, sans backend, sans dépendance externe et sans branchement au runtime 4b4c.

La structure utilisateur reste identique dans tous les scénarios :

- zone dominante `2b2c maintenant` ;
- éventuel conflit / challenge / User Next Action ;
- `Pourquoi maintenant` ;
- `Ensuite` ;
- `Ce qui vient d'avancer` seulement lorsqu'un delta utile existe ;
- `Acquis pour l'instant` ;
- sources seulement lorsqu'elles apportent de la confiance ou expliquent un conflit ;
- surface de travail courante ;
- accès naturel à 2b2c sans retour vers une ancienne étape.

Le sélecteur de scénarios du prototype est un outil de test et ne fait pas partie de l'UX produit.

---

## 2. Scénarios jouables

### Nathalie — idée vague

Une seule question à fort gain est mise en avant.

Transitions testées :

- `Plus de rendez-vous` → objectif intégré, question disparaît, analyse autonome ciblée ;
- `Mieux présenter mon activité` → même shell, nouvel horizon d'analyse ;
- `Je ne sais pas` → Rescue Path : hypothèse réversible, aucune répétition de la même question.

### Vincent — brief riche

Aucune User NBA.

Le workspace explique que 2b2c possède assez de matière pour travailler seul, montre des progrès utiles et laisse le composer disponible.

### Conflit B2B / B2C

Les deux sources sont conservées.

Un arbitrage humain unique devient dominant. Après choix, seule la partie affectée du dossier est annoncée comme recalculée.

### Solution disproportionnée

Le challenge peut précéder la Candidate détaillée.

Une comparaison avec une alternative simple peut être activée sans créer une étape `Challenge`.

### Retour après deux semaines

Le workspace projette le delta depuis la dernière visite et l'unique changement réellement décisionnel, pas un résumé intégral du dossier.

### Blueprint mismatch

Le produit signale honnêtement que l'Idea dépasse la couverture `SITE_VITRINE` et permet reclassification, retour de périmètre ou pause sans perdre l'historique.

---

## 3. Tests automatisés exécutés

Le prototype a été chargé dans Chromium headless via `page.set_content`, sans navigation réseau.

Tests réalisés :

1. syntaxe JavaScript valide ;
2. Nathalie affiche trois options puis supprime la User NBA après réponse ;
3. Vincent affiche zéro User NBA et conserve le composer direct ;
4. conflit : première décision modifie bien le focus ;
5. challenge : première décision matérialise l'alternative simple ;
6. retour : première décision déclenche une réévaluation ciblée ;
7. Blueprint mismatch : reclassification modifie bien l'orientation ;
8. le composer ajoute une nouvelle information sous forme de delta dans le même workspace ;
9. largeur mobile 390 px : aucun overflow horizontal pour les six scénarios.

Résultat : **PASS** sur ces contrôles fonctionnels.

---

## 4. Défaut détecté pendant le contrôle mobile

La première version du prototype gardait le composer complet collé en bas de l'écran mobile alors qu'une User NBA dominante était présente.

Conséquence observée :

- le composer concurrençait visuellement la vraie action humaine ;
- sur petit écran, il pouvait masquer une partie des choix ;
- il créait deux invitations concurrentes : répondre au point important ou parler librement à 2b2c.

Cette configuration est rejetée.

---

## 5. Correction candidate — accessibilité permanente ≠ composer toujours déployé

Nouvelle règle issue du prototype :

> **La capacité de parler librement à 2b2c doit toujours rester accessible, mais le champ complet n'a pas besoin de rester déployé en permanence sur une surface mobile contrainte lorsqu'une User NBA dominante est affichée.**

Comportement testé :

- desktop : composer complet peut rester visible ;
- mobile sans User NBA : composer direct disponible ;
- mobile avec User NBA dominante : accès compact `2b2c` dans la barre supérieure ;
- un tap ouvre le composer ;
- l'action humaine prioritaire reste visuellement dominante ;
- l'utilisateur n'est jamais enfermé dans la question : la conversation libre reste à un geste.

Cette règle doit être intégrée au prochain raffinement du Workspace Projection Contract / wireframe si la direction UX est validée.

---

## 6. Ce que le prototype démontre

Le prototype apporte des preuves en faveur des hypothèses suivantes :

- un seul workspace adaptatif suffit pour des états très différents ;
- `ORIENTATION_NOW` peut maintenir le sentiment de guidage sans inventer d'étape ;
- une User NBA peut apparaître puis disparaître sans navigation vers un écran suivant ;
- `PROGRESS_SIGNAL` rend l'avancement perceptible par conséquence plutôt que par pourcentage ;
- `Pourquoi maintenant / Ensuite` fonctionne comme explication locale et non comme pipeline global ;
- `Je ne sais pas` peut produire une vraie continuation sans boucle de questions ;
- l'absence de User NBA n'entraîne pas une interface vide ;
- Change Intelligence peut être expliquée comme un recalcul ciblé ;
- conflit, challenge, pause, STOP ou mismatch peuvent être des états normaux du même workspace.

---

## 7. Ce que le prototype ne prouve PAS encore

Il ne valide pas :

- microcopy finale ;
- direction artistique ;
- densité finale mobile/desktop ;
- comportement réel avec données longues ;
- vraie latence de traitements IA ;
- uploads / parsing ;
- backend Requirements/Outputs ;
- collaboration multi-utilisateur ;
- accessibilité clavier/lecteur d'écran complète ;
- performance ;
- compréhension réelle par des utilisateurs novices externes.

Il s'agit d'un test de logique de projection et de transition, pas d'une validation produit finale.

---

## 8. Gate proposée avant validation fonctionnelle du workspace

Avant de promouvoir V0.2 en UX validée :

1. revoir visuellement les six états et leurs transitions ;
2. vérifier que `Acquis pour l'instant` ne devient pas un mini-formulaire passif ;
3. vérifier que `Ce qui vient d'avancer` reste agrégé et causal ;
4. tester le cas `aucune User NBA` avec une vraie attente de plusieurs minutes ;
5. tester deux ou trois boucles successives Nathalie sans fatigue ;
6. tester l'ajout libre via composer au milieu d'une User NBA ;
7. tester une Candidate plus riche sans transformer le workspace en dashboard ;
8. seulement ensuite décider si le contrat peut devenir `VALIDÉ FONCTIONNELLEMENT`.

---

## 9. Décision à ce stade

**Le prototype V0.1 passe la Gate de cohérence fonctionnelle interne mais le workspace n'est pas encore déclaré validé fonctionnellement.**

La prochaine conception doit approfondir les états réels du même shell plutôt que créer de nouveaux écrans séquentiels.
# 2b2c — Gate UX / Architecture produit / DA — 2026-09-11

## Statut

Baseline technique gelée pour cette gate : **v4.5.12-work-p1 / build 519**.

Cette gate ne demande pas de nouveau backend, de nouvelle fonctionnalité ni de refonte destructive du runtime. Son objectif est de décider ce que l'utilisateur doit voir, comprendre et faire avant toute nouvelle évolution importante.

## Décision principale

2b2c a désormais assez de fonctionnalités. Le risque principal n'est plus le manque d'outils mais la dilution de la simplicité, la multiplication des choix de représentation et une identité visuelle encore trop générique SaaS.

Pendant cette gate :

- geler les nouvelles fonctionnalités ;
- ne pas poursuivre l'extraction technique module par module sans bénéfice utilisateur direct ;
- ne pas supprimer les anciens handlers sans E2E authentifiés ;
- ne pas lancer une refonte globale écran par écran ;
- concentrer le travail sur les parcours, l'architecture d'information et quatre écrans de référence V6.

## Promesse produit à protéger

2b2c doit permettre à une petite équipe de comprendre et faire avancer un projet sans devoir apprendre un logiciel complexe ni combiner plusieurs outils.

En moins de 10 secondes, un utilisateur doit pouvoir répondre à :

1. Qu'est-ce qui attend réellement mon intervention ?
2. Où en est le projet que je dois reprendre ?
3. Qu'est-ce qui bloque la suite ?
4. Quelle est la prochaine étape utile ?
5. Où retrouver les échanges, fichiers, décisions et livrables liés ?

## Ce que l'on garde

### Home

Conserver le modèle actuel :

- À traiter maintenant ;
- changements importants depuis la dernière visite ;
- échéances réellement utiles ;
- projet à reprendre et raison de le reprendre.

La Home reste un moteur de reprise du travail, jamais un dashboard décoratif.

### Vue d'ensemble projet

Conserver :

- situation actuelle calculée ;
- progression compréhensible ;
- blocages ;
- attention utilisateur ;
- prochain jalon ;
- dernière décision ;
- prochaine réunion ;
- livrables récents.

Cette page doit devenir le cockpit du projet, pas un tableau de KPI.

### Ressources / Livrables

Conserver strictement la distinction :

- Ressource de travail = document, lien, source, fichier utile au travail ;
- Livrable = sortie officielle, versionnée, traçable et éventuellement validée.

Conserver versions immuables, validation sur version exacte et historique de clôture.

### Communication

Conserver un renderer unique pour global + projet et les audiences distinctes : équipe, projet, privé, réunion.

## Ce que l'on simplifie

### Travail

Problème actuel : quatre vues de même niveau — Liste / Roadmap / Tableau / Calendrier — demandent à l'utilisateur de choisir son mode de représentation.

Décision cible V6 :

- **Travail** devient la vue opérationnelle par défaut ;
- **Roadmap** devient la vue de structure/progression ;
- Tableau et Calendrier ne sont plus des onglets principaux permanents ;
- un changement de présentation secondaire peut rester disponible si utile, mais il ne doit pas définir l'architecture du produit.

Le produit choisit un chemin par défaut au lieu de renvoyer la décision de méthode à l'utilisateur.

### Calendrier global

Le nom Calendrier est actuellement trompeur car il représente essentiellement les réunions.

Décision cible : **Agenda**.

Agenda rassemble les objets datés pertinents pour la personne :

- réunions ;
- actions avec échéance ;
- jalons / dates cibles ;
- validations demandées avec échéance quand disponible.

Filtres possibles, mais un seul flux temporel par défaut.

## Architecture d'information cible

### Navigation globale primaire

1. Home
2. Projets
3. Mon travail
4. Messages
5. Agenda
6. Fichiers

Secondaire :

- Équipe
- Archives
- Paramètres
- Profil

Mobile : dock limité à Home / Projets / Mon travail / Messages. Agenda, Fichiers, Équipe et paramètres restent dans le drawer.

### Navigation projet

1. Vue d'ensemble
2. Travail
3. Messages
4. Ressources
5. Réunions

Ne pas ajouter Atelier, Idées, IA, Inbox ou autres modules avant validation de cette architecture sur les parcours principaux.

## Six parcours à auditer avant toute V6 finale

### 1. Rejoindre une équipe

Invitation → connexion/création compte → compréhension du rôle → projets accessibles → première action évidente.

Succès : l'utilisateur comprend pourquoi il voit ces projets et pas d'autres sans connaître RLS, workspace ou access_mode.

### 2. Créer un projet

Nom + résultat attendu + portée Team/Restreint + participants si nécessaire + roadmap initiale.

Succès : le projet créé est immédiatement exploitable, sans écran de configuration supplémentaire obligatoire.

### 3. Reprendre un projet

Home → projet recommandé → vue d'ensemble → prochaine action.

Succès : aucun détour par des statistiques ou une liste complète de tâches pour savoir quoi faire.

### 4. Travailler et collaborer

Action → responsable → échéance → blocage éventuel → message/réunion/décision si nécessaire.

Succès : on ne duplique pas l'information entre Travail, Messages et Réunions.

### 5. Livrer et faire valider

Ressource → livrable → version → validation → modifications éventuelles → nouvelle version.

Succès : l'utilisateur comprend toujours quelle version est actuelle, laquelle a été validée et ce qui est partagé à un invité.

### 6. Terminer le projet

Engagements ouverts → versions finales → résultat obtenu → clôture → historique → réouverture éventuelle.

Succès : la clôture représente un résultat réel et traçable, pas uniquement un statut "Done".

## Direction DA V6

### À conserver

- contraste sidebar sombre / espace principal clair ;
- atmosphère spatiale douce ;
- palette bleu / violet / cyan ;
- micro-mouvements courts ;
- composants tactiles sur les actions importantes.

### À réduire

- glassmorphism appliqué à presque chaque conteneur ;
- cartes imbriquées dans des cartes ;
- rayons excessifs uniformes ;
- gradients décoratifs sans fonction ;
- multiplication des pills et mini-KPI ;
- effets "premium SaaS" génériques.

### Signature visuelle 2b2c

La DA doit matérialiser **le mouvement d'un projet vers son résultat**.

Langage visuel proposé :

- chemin / trajectoire ;
- nœuds représentant les jalons ;
- liens visibles entre blocage, action, décision et livrable ;
- accent visuel fort sur "maintenant" et "ensuite" ;
- progression spatiale légère plutôt qu'accumulation de cartes.

Le "wahou" doit venir de la clarté : voir immédiatement comment le projet avance.

## Quatre écrans V6 de référence

Aucun redesign des autres pages avant validation de ces quatre écrans en desktop et mobile.

### A. Home V6

Doit montrer, dans cet ordre :

1. ce qui attend l'utilisateur ;
2. le projet à reprendre ;
3. ce qui a changé ;
4. ce qui arrive bientôt.

Pas de grille de KPI générique.

### B. Projets V6

Chaque projet doit montrer en un regard :

- résultat attendu ;
- santé ;
- étape actuelle ;
- prochain mouvement ;
- personne(s) clé(s) ;
- échéance utile.

Éviter les cartes de projet remplies de métadonnées.

### C. Vue d'ensemble projet V6

Écran central :

- situation ;
- chemin de progression ;
- maintenant ;
- ensuite ;
- blocages ;
- dernière décision ;
- prochain rendez-vous ;
- sortie/livrable en cours.

### D. Travail / Roadmap V6

Une architecture unique doit relier :

- phases ;
- actions ;
- responsables ;
- dépendances ;
- blocages ;
- dates.

La Roadmap montre le chemin. Travail montre ce qu'il faut exécuter. Les deux doivent partager le même modèle mental et la même hiérarchie visuelle.

## Critères de validation de la gate

La gate est validable seulement si les quatre maquettes V6 permettent à une personne ne connaissant pas 2b2c de :

- identifier la prochaine action en moins de 10 secondes ;
- comprendre la différence entre projet, phase et action ;
- comprendre où se trouvent échanges, réunions et fichiers ;
- comprendre la différence Ressource / Livrable ;
- identifier un blocage et son impact ;
- savoir où reprendre après plusieurs jours d'absence ;
- naviguer sans avoir à choisir entre plusieurs vues équivalentes ;
- reconnaître visuellement 2b2c sans logo grâce à sa structure et à sa DA.

## Ordre d'exécution décidé

1. Figurer Home V6 desktop/mobile.
2. Figurer Projets V6 desktop/mobile.
3. Figurer Vue d'ensemble projet V6 desktop/mobile.
4. Figurer Travail/Roadmap V6 desktop/mobile.
5. Tester ces quatre écrans sur les six parcours.
6. Corriger l'architecture et la DA jusqu'à validation.
7. Seulement ensuite décliner Messages, Ressources, Agenda, Équipe et autres pages.
8. Reprendre les extractions techniques uniquement lorsqu'elles deviennent nécessaires à l'implémentation validée.

## Interdictions pendant la gate

- pas de nouvelle fonctionnalité majeure ;
- pas de nouvelle vue de tâches ;
- pas de duplication Calendrier/Agenda ;
- pas de grand refactor `live.js` pour "faire propre" ;
- pas de suppression de fallback sans E2E ;
- pas de nouvelle DA appliquée globalement avant validation des quatre écrans de référence ;
- pas d'IA visible ajoutée comme gadget.

Cette gate vise à faire de 2b2c un produit plus simple et plus évident, pas un outil plus chargé.
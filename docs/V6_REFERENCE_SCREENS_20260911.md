# 2b2c — Écrans de référence V6 — 2026-09-11

Ce document traduit la Gate UX / Architecture produit / DA en quatre écrans de référence. Il ne décrit pas encore l'implémentation technique.

## Principes communs

### Hiérarchie

Chaque écran doit répondre dans cet ordre :

1. Où suis-je ?
2. Qu'est-ce qui compte maintenant ?
3. Qu'est-ce qui vient ensuite ?
4. Où aller pour agir ou approfondir ?

### Surfaces

Maximum trois niveaux :

- canvas ;
- surface principale ;
- item/action.

Éviter les cartes imbriquées en cascade.

### Signature visuelle

La progression est matérialisée par une trajectoire discrète : ligne, nœuds, étapes et accent sur le nœud actif. Les objets importants se rattachent visuellement à ce chemin plutôt que d'apparaître comme des widgets indépendants.

### Couleur

- sidebar : bleu nuit profond ;
- canvas : clair, légèrement bleuté ;
- action principale : bleu électrique contrôlé ;
- étape active / progression : violet-bleu ;
- blocage : rouge atténué ;
- validation / succès : vert ;
- cyan uniquement comme accent secondaire.

### Mouvement

- entrée d'écran : 160–220 ms ;
- changement d'état : 120–180 ms ;
- progression : animation courte d'un nœud au suivant ;
- jamais de parallaxe décorative permanente ;
- `prefers-reduced-motion` respecté.

---

# 1. Home V6

## Objectif

Permettre de reprendre le travail en quelques secondes après une absence courte ou longue.

## Desktop

### Zone 1 — En-tête minimal

Gauche :

- Bonjour Prénom ;
- phrase synthétique calculée : `2 éléments attendent votre décision · Orbit mérite votre attention aujourd'hui`.

Droite :

- recherche ;
- communication ;
- notifications ;
- créer.

Pas de hero décoratif volumineux.

### Zone 2 — Maintenant

Surface principale dominante, environ 60 % de la largeur utile.

Titre : **Maintenant**.

Contenu trié par impact, pas par type :

- blocage ;
- validation ;
- demande ;
- action urgente ;
- préparation de réunion imminente.

Chaque ligne contient seulement :

- nature ;
- titre ;
- projet/personne ;
- urgence ;
- CTA implicite en cliquant la ligne.

Le premier item reçoit l'accent visuel principal.

### Zone 3 — Reprendre

Colonne secondaire.

Une seule recommandation forte :

`Reprendre Orbit`

Avec :

- étape active ;
- pourquoi maintenant ;
- prochaine action ;
- mini trajectoire de progression.

En dessous : maximum deux autres projets en version compacte.

### Zone 4 — Depuis votre dernière visite

Timeline compacte chronologique des changements qui modifient le contexte :

- décision ;
- blocage ;
- nouvelle version ;
- validation ;
- changement de jalon ;
- réunion terminée avec synthèse.

Ne pas afficher l'activité banale.

### Zone 5 — Bientôt

Une ligne temporelle courte : aujourd'hui / demain / cette semaine.

Inclure réunions et vraies échéances personnelles.

## Mobile

Ordre vertical strict :

1. Maintenant ;
2. Reprendre ;
3. Bientôt ;
4. Depuis votre dernière visite.

Le premier item de Maintenant peut être légèrement plus grand, mais aucune carte ne doit monopoliser tout l'écran.

## À supprimer par rapport au réflexe dashboard

- KPI génériques ;
- compteurs sans action ;
- graphiques de progression globale sans conséquence ;
- plusieurs projets recommandés avec le même poids.

---

# 2. Projets V6

## Objectif

Choisir le bon projet à ouvrir sans devoir parcourir une collection de cartes équivalentes.

## Desktop

### En-tête

- `Projets`
- filtre simple : Actifs / En pause / Terminés ;
- recherche ;
- Nouveau projet.

### Projet prioritaire

Le projet qui mérite le plus d'attention peut occuper une ligne plus riche :

- nom ;
- résultat attendu ;
- santé ;
- étape active ;
- prochain mouvement ;
- date cible ;
- équipe utile ;
- trajectoire 4–7 nœuds.

### Liste des autres projets

Préférer une **liste structurée premium** à une grille de grosses cartes.

Colonnes visuelles, non tableur :

- Projet ;
- Maintenant ;
- Ensuite ;
- Santé ;
- Cible.

Chaque ligne reste entièrement cliquable.

### Groupement

Par défaut :

1. nécessite attention ;
2. en cours normal ;
3. à structurer.

L'utilisateur n'a pas à trier manuellement pour détecter le risque.

## Mobile

Chaque projet devient une bande verticale :

- nom + santé ;
- étape active ;
- prochain mouvement ;
- cible ;
- mini trajectoire horizontale.

Pas plus de 2–3 lignes de métadonnées visibles avant interaction.

---

# 3. Vue d'ensemble projet V6

## Objectif

Comprendre l'état réel du projet avant de naviguer vers le détail.

## En-tête projet

- breadcrumb discret ;
- nom ;
- résultat attendu ;
- santé ;
- personnes clés ;
- actions contextuelles : Communication / Partager / Gérer.

Éviter plusieurs boutons de poids visuel égal.

## Bloc principal — Le chemin

Élément signature de 2b2c.

Trajectoire de 3 à 7 jalons :

`Cadrage — Prototype — Test — Ajustement — Livraison`

Pour chaque nœud :

- état ;
- responsable si utile ;
- cible ;
- nombre d'actions ouvertes.

Le nœud actif est visuellement dominant.

Sous le nœud actif :

### Maintenant

- action prioritaire ;
- blocage éventuel ;
- validation/demande éventuelle.

### Ensuite

- prochain jalon ou condition de passage.

Cette relation Maintenant → Ensuite est le cœur de la page.

## Mémoire utile

Sous la trajectoire, trois zones seulement :

1. dernière décision ;
2. prochain rendez-vous ;
3. livrable actuel.

Pas de grille de cinq ou six KPI.

## Navigation projet

Vue d'ensemble / Travail / Messages / Ressources / Réunions.

La navigation doit rester visuellement secondaire par rapport au contexte du projet.

## Mobile

- header condensé ;
- trajectoire horizontale scrollable ou verticale courte ;
- Maintenant ;
- Ensuite ;
- blocage ;
- mémoire utile en accordéons légers si nécessaire.

Le CTA principal est `Continuer` ou l'action concrète recommandée, pas `Voir plus`.

---

# 4. Travail / Roadmap V6

## Objectif

Relier structure et exécution sans faire choisir à l'utilisateur quatre paradigmes de gestion de tâches.

## Décision d'architecture

Deux modes seulement :

- **Travail** = exécuter ;
- **Roadmap** = comprendre le chemin.

Ils utilisent les mêmes actions, jalons, responsables et dates.

Board et Calendar deviennent des présentations secondaires éventuelles, accessibles via `Affichage`, pas des destinations principales.

## Travail — Desktop

### Barre supérieure

- titre Travail ;
- contexte du jalon actif ;
- bouton Nouvelle action ;
- menu Affichage secondaire.

### Section 1 — À faire maintenant

Actions triées :

1. bloquantes / débloquantes ;
2. urgentes ;
3. assignées à moi ;
4. autres.

### Section 2 — Par étape

Les actions restent regroupées par jalon mais sans multiplier les grosses cartes.

Une ligne Action contient :

- état ;
- titre ;
- responsable ;
- échéance ;
- dépendance/blocage si présent.

### Interaction

L'édition complète se fait dans un panneau latéral ou modal cohérent. Le changement d'état simple reste inline.

## Roadmap — Desktop

Trajectoire horizontale ou verticale selon largeur :

- jalon ;
- résultat attendu ;
- responsable ;
- cible ;
- progression réelle ;
- dépendance vers jalon suivant.

Déplier un jalon révèle les actions importantes, pas nécessairement toutes par défaut.

### Dépendances

Ne dessiner une connexion que si elle aide réellement à comprendre un blocage ou un passage de phase.

Pas de spaghetti de lignes.

## Mobile

### Travail

- Maintenant en premier ;
- puis étapes repliables ;
- statut modifiable d'un geste ;
- responsable/date en une seule ligne secondaire.

### Roadmap

Trajectoire verticale :

- nœud ;
- titre ;
- résultat attendu ;
- cible ;
- résumé des actions ;
- prochain nœud.

C'est la représentation la plus naturelle sur petit écran.

---

# Règles de cohérence entre les 4 écrans

## Même objet, même représentation

- santé projet : même vocabulaire et mêmes tons partout ;
- jalon : même nœud / code visuel partout ;
- action bloquée : même signal partout ;
- validation : même pictogramme et même état partout ;
- personne : même avatar et rôle ;
- échéance : même formulation relative/absolue.

## Même logique de priorité

Home, Projets, Vue projet et Travail doivent tous être basés sur le même ordre de priorité métier. Une action ne doit pas être « prioritaire » sur Home mais apparaître banale dans Travail.

## Même notion de progression

La progression ne doit jamais être un pourcentage arbitraire déconnecté des jalons et du travail réel.

---

# Critères de passage aux maquettes finales

Avant de décliner le reste du produit :

- Home doit permettre de choisir l'action à faire sans visiter Mon travail ;
- Projets doit permettre de choisir le projet à reprendre sans ouvrir chaque projet ;
- Vue projet doit expliquer Maintenant et Ensuite ;
- Travail doit être exploitable sans comprendre la différence technique entre list/board/calendar ;
- Roadmap doit raconter le projet sans devenir un Gantt complexe ;
- mobile doit conserver la même logique et non être une réduction du desktop ;
- la signature trajectoire/nœuds doit être reconnaissable mais non décorative.

Ce document devient la référence de conception V6 jusqu'à décision explicite de réouverture.
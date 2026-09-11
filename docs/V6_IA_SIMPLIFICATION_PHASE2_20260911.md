# 2b2c — Gate UX V6 — Phase 2 — Architecture d’information & simplification — 2026-09-11

## Statut

Baseline technique gelée pendant cette phase : **v4.5.12-work-p1 / build 519**.

Cette phase complète `UX_PRODUCT_DA_GATE_20260911.md` et `V6_REFERENCE_SCREENS_20260911.md`. Elle ne demande aucune modification de production. Elle fixe l’architecture d’information, le rôle de chaque destination, les actions principales et les simplifications avant maquettes V6 finales.

## Décision produit

2b2c ne cherche pas à battre les leaders en nombre de vues. Asana et ClickUp assument une grande variété de représentations ; Linear montre qu’une interface plus calme, cohérente et facile à scanner améliore l’orientation. La décision 2b2c est donc volontairement opinionated : **un chemin par défaut clair, des vues secondaires uniquement quand elles apportent une information différente**.

Le produit doit guider l’utilisateur vers :

1. ce qui réclame son attention ;
2. le projet qu’il doit reprendre ;
3. l’étape actuelle ;
4. la prochaine action ou décision utile ;
5. la mémoire nécessaire pour agir sans rechercher partout.

---

# 1. Modèle mental global

## Les six destinations primaires

### Home

Question à laquelle la page répond : **« Qu’est-ce qui compte pour moi maintenant ? »**

Contient :

- interventions réellement attendues ;
- projet recommandé à reprendre ;
- changements importants depuis la dernière visite ;
- échéances proches.

Action principale : ouvrir l’élément qui débloque le plus la suite.

Ne contient pas : reporting général, widgets décoratifs, métriques sans action.

### Projets

Question : **« Quel projet mérite mon attention et où en sont les autres ? »**

Contient :

- projets actifs ;
- santé ;
- étape actuelle ;
- prochain mouvement ;
- date cible utile ;
- équipe minimale ;
- projets en pause/terminés via filtre.

Action principale : ouvrir/reprendre un projet.

Ne contient pas : plusieurs layouts de portefeuille concurrents par défaut.

### Mon travail

Question : **« Qu’est-ce qui dépend directement de moi ? »**

Contient :

- validations à décider ;
- demandes auxquelles répondre ;
- actions assignées ;
- blocages dont je suis responsable ;
- échéances personnelles.

Action principale : traiter le premier engagement prioritaire.

Ne contient pas : tout le travail de tous les projets.

### Messages

Question : **« Avec qui dois-je échanger et dans quel contexte ? »**

Contient les audiences déjà existantes :

- équipe ;
- projet ;
- privé ;
- groupe privé ;
- réunion.

Action principale : poursuivre une conversation ou en démarrer une avec une audience explicite.

Ne contient pas : duplication des demandes, décisions ou actions comme simples messages. Ces objets peuvent naître d’un message mais deviennent ensuite des objets métier.

### Agenda

Question : **« Qu’est-ce qui arrive quand ? »**

Agenda remplace le concept global de Calendrier centré réunions.

Contient dans une seule couche temporelle :

- réunions ;
- actions avec échéance ;
- jalons/dates cibles ;
- validations datées si disponibles ;
- événements personnels pertinents issus de projets visibles.

Action principale : préparer ou ouvrir le prochain élément temporel utile.

Vue par défaut : **7 jours / semaine utile**, pas un mois vide.

Vues secondaires : Jour et Mois seulement si elles répondent à un besoin réel après test.

Filtres : Réunions / Travail / Jalons / Validations / Projet.

Ne contient pas : une seconde base de tâches.

### Fichiers

Question : **« Où est le document ou livrable que je cherche ? »**

Rôle : bibliothèque transversale de recherche et d’accès.

Contient :

- ressources de travail accessibles ;
- livrables accessibles ;
- recherche ;
- filtres projet/type/partage ;
- éléments récents.

Action principale : retrouver et ouvrir.

Gestion/versioning/validation restent dans **Projet > Ressources**. Fichiers global ne devient pas un second gestionnaire de livrables.

---

# 2. Destinations secondaires

## Équipe

Question : **« Qui a accès à quoi ? »**

Contient :

- membres actifs ;
- rôle espace ;
- portée d’accès lisible ;
- invitations ;
- gestion du rôle et des projets explicitement partagés quand nécessaire.

Les responsabilités opérationnelles ne sont pas administrées ici : responsable projet, jalon et action restent dans leur contexte projet.

Action principale Owner/Admin : **Inviter**.

Action secondaire : gérer l’accès d’une personne.

## Archives

Question : **« Où retrouver ce qui n’est plus actif ? »**

Contient projets archivés et restauration si autorisée. Les projets terminés restent consultables dans Projets via filtre tant qu’ils constituent une mémoire utile ; archive représente le retrait du flux courant.

## Paramètres

Question : **« Comment configurer mon espace/compte ? »**

Séparer clairement :

- Mon profil ;
- Préférences personnelles ;
- Espace de travail ;
- Notifications ;
- Sécurité/compte lorsque disponible ;
- Facturation/limites uniquement lorsqu’elles existent réellement.

Ne pas afficher de rubriques futures vides pour donner une impression de produit plus complet.

---

# 3. Navigation desktop V6

## Sidebar primaire

Ordre fixe :

1. Home
2. Projets
3. Mon travail
4. Messages
5. Agenda
6. Fichiers

Puis séparation visuelle :

- Équipe
- Archives si utile
- Paramètres

La sidebar doit être calme : pas de compteur sur chaque destination. Badges seulement quand une information demande une action : messages non lus, mentions, attention critique.

## Topbar

Conserver uniquement des actions globales :

- recherche ;
- communication/appel ;
- notifications ;
- créer ;
- profil.

### Règle du bouton Créer

Le bouton global ne doit pas proposer une liste de quinze objets.

Hors projet :

- Projet ;
- Action personnelle/contextualisable ;
- Réunion ;
- Conversation.

Dans un projet, le contexte doit primer :

- Action ;
- Réunion ;
- Décision ;
- Demande ;
- Ressource/Livrable via Ressources.

L’utilisateur ne doit pas devoir sélectionner le projet une seconde fois lorsqu’il crée depuis un projet.

---

# 4. Navigation mobile V6

## Dock fixe

Uniquement :

1. Home
2. Projets
3. Mon travail
4. Messages

C’est suffisant pour les destinations quotidiennes.

## Drawer

Contient :

- Agenda ;
- Fichiers ;
- Équipe ;
- Archives ;
- Paramètres ;
- Profil ;
- Déconnexion.

Le drawer peut également afficher 2–3 projets récents mais ne doit pas devenir une seconde sidebar complète.

## Règle mobile

Aucune page mobile ne doit être une réduction mécanique du desktop. Priorité stricte : Maintenant → Ensuite → détail.

---

# 5. Architecture d’un projet

## Navigation projet finale

1. Vue d’ensemble
2. Travail
3. Messages
4. Ressources
5. Réunions

### Vue d’ensemble

Question : **« Où en est ce projet et que doit-il se passer ensuite ? »**

Contient :

- résultat attendu ;
- santé et cause ;
- trajectoire de jalons ;
- étape active ;
- Maintenant ;
- Ensuite ;
- blocage/validation/demande conditionnante ;
- dernière décision ;
- prochaine réunion ;
- livrable actuel.

Action principale dynamique : action recommandée/`Continuer`.

Supprimer comme structure dominante : grilles de KPI équivalents, statistiques sans décision associée.

### Travail

Question : **« Que faut-il exécuter pour faire avancer ce projet ? »**

Deux modes conceptuels seulement :

- **Travail** : exécution ;
- **Roadmap** : structure/progression.

Ils partagent exactement les mêmes actions, jalons, responsables, états et dates.

#### Travail — ordre par défaut

1. blocage à résoudre ;
2. travail qui débloque quelqu’un ;
3. en retard/urgent ;
4. mes actions ;
5. reste du travail de l’étape actuelle ;
6. étapes futures repliées.

Une action affiche : état, titre, responsable, échéance, jalon, signal de blocage/dépendance si utile.

#### Roadmap

Montre le chemin vers le résultat :

- 3–7 jalons recommandés ;
- résultat attendu par jalon ;
- responsable ;
- date cible ;
- progression ;
- dépendance structurante.

Les actions sont visibles en expansion, pas toutes affichées en permanence.

#### Tableau et calendrier projet

Ils ne disparaissent pas forcément du code au premier passage V6, mais sortent de la navigation principale.

S’ils sont conservés : menu **Affichage** secondaire.

- Tableau : utile uniquement pour déplacer rapidement des actions par état.
- Calendrier projet : utile uniquement comme filtre temporel local ; l’Agenda global reste la référence personnelle/transverse.

Ne jamais laisser quatre onglets de poids égal `Liste / Roadmap / Tableau / Calendrier`.

### Messages projet

Ce n’est pas une nouvelle messagerie. Route vers le même fil général du projet dans Communication V3 avec contexte projet explicite.

Action principale : envoyer un message.

Actions dérivées utiles : transformer un message en Action / Demande / Décision sans dupliquer l’audience ou le contenu métier.

### Ressources

Conserver le modèle actuel, qui est une force produit.

Deux catégories seulement :

- **Ressource de travail** : référence utile, modifiable/remplaçable, sans validation formelle ;
- **Livrable** : résultat officiel, versions immuables, validation possible.

Action principale dépend du besoin : Ajouter ressource ou Nouveau livrable, mais la hiérarchie doit favoriser le livrable lorsqu’un résultat doit être remis.

La version actuelle doit toujours être identifiable en une seconde.

### Réunions

Question : **« Qu’avons-nous préparé, échangé et décidé ensemble ? »**

Conserver le modèle :

- Avant : objectif + agenda ;
- Live : notes + décisions/actions ;
- Après : synthèse + suivi.

Liste projet séparée : à venir/en cours puis historique.

Action principale : Nouvelle réunion quand elle est nécessaire, pas une incitation systématique à organiser des réunions.

Visio reste un moyen de communication contextualisé, pas un module produit séparé.

---

# 6. Les objets métier et leur lieu naturel

## Projet

Lieu principal : Projets / Vue d’ensemble.

## Jalon

Lieu principal : Roadmap. Résumé sur Home, Projets, Vue d’ensemble, Agenda.

## Action

Lieu principal : Travail. Agrégée dans Mon travail et Agenda si datée.

## Blocage

Ce n’est pas un objet parallèle : c’est un état/action avec cause et impact. Il remonte dans Home, Vue projet et Travail.

## Message

Lieu principal : Messages.

## Demande

Engagement explicite nécessitant une réponse. Elle peut naître d’un message, mais vit comme objet de suivi et remonte dans Home/Mon travail.

## Décision

Mémoire structurée du choix et de sa justification. Elle appartient au projet et peut naître d’un message ou d’une réunion.

## Réunion

Lieu principal : Agenda + Projet/Réunions selon contexte.

## Ressource

Lieu principal : Projet/Ressources. Recherchable globalement dans Fichiers.

## Livrable/version/validation

Lieu principal : Projet/Ressources. Une validation demandée remonte dans Home et Mon travail du validateur.

Cette règle évite que le même objet soit administré depuis trois modules différents.

---

# 7. Vocabulaire V6 à figer

Utiliser partout :

- Projet
- Jalon / Étape (choisir un terme produit final après test ; interface actuelle peut afficher `Étape` et conserver milestone en technique)
- Action
- Responsable
- Blocage
- Demande
- Décision
- Réunion
- Ressource de travail
- Livrable
- Version
- Validation
- Membre
- Administrateur
- Invité externe

Éviter dans l’UI utilisateur : workspace, access mode, RPC, RLS, entity, scope, milestone si `Jalon/Étape` est retenu en français.

Ne pas utiliser `participant` comme synonyme de `a accès`. Participant décrit une implication contextuelle ; accès décrit une permission.

---

# 8. Une action principale par page

| Page | Action principale |
| --- | --- |
| Home | Traiter l’élément prioritaire |
| Projets | Reprendre / ouvrir un projet |
| Mon travail | Traiter mon prochain engagement |
| Messages | Continuer une conversation |
| Agenda | Préparer / ouvrir le prochain événement |
| Fichiers | Retrouver / ouvrir |
| Équipe | Inviter (admin) / comprendre l’équipe |
| Vue projet | Continuer le projet |
| Travail | Nouvelle action / exécuter |
| Roadmap | Structurer l’étape suivante |
| Ressources | Ajouter le bon type de contenu |
| Réunions | Préparer / planifier un point utile |

Les autres actions existent mais ne doivent jamais avoir le même poids visuel sans raison.

---

# 9. Simplifications décidées par rapport au build 519

## À retirer de la hiérarchie principale V6

- `Calendrier` global comme synonyme de Réunions → devient **Agenda** transverse ;
- quatre vues Travail de poids égal ;
- grilles de KPI lorsque l’information ne déclenche aucune action ;
- cartes imbriquées utilisées uniquement pour créer une impression premium ;
- duplication de gestion des livrables dans Fichiers global ;
- création générique demandant du contexte déjà connu ;
- boutons `Voir plus` lorsque l’action réelle peut être nommée.

## À conserver

- Home orientée attention/reprise ;
- Team vs Restricted ;
- Guest explicite ;
- Communication V3 unique ;
- Before/Live/After pour Réunions ;
- distinction Ressource/Livrable ;
- versions immuables + validation exacte ;
- clôture avec résultat et références finales ;
- navigation mobile à quatre destinations principales ;
- recherche globale ;
- appels natifs contextualisés.

---

# 10. Principes concurrentiels retenus

## Ce que l’on prend

- changement de représentation sans dupliquer les données ;
- séparation niveau portefeuille / projet / action ;
- filtres et affichages secondaires quand le besoin l’exige ;
- cohérence stricte des headers/navigation/contrôles ;
- projet défini par un résultat, pas comme dossier infini ;
- vues personnelles pour le travail assigné.

## Ce que l’on ne copie pas

- multiplication des vues comme argument principal ;
- dizaines d’options visibles avant qu’elles soient nécessaires ;
- arborescence Space/Folder/List complexe ;
- dashboards nécessitant configuration avant d’être utiles ;
- personnalisation poussée qui oblige chaque équipe à concevoir son propre produit.

Différenciation 2b2c : **le logiciel fait une partie du travail d’organisation à la place de l’utilisateur**.

---

# 11. Intelligence produit — sans chatbot visible

La future intelligence de 2b2c doit exploiter les objets déjà structurés pour produire trois sorties :

### Maintenant

`La validation de la maquette V2 bloque le démarrage de Tests.`

### Ensuite

`Après validation, l’action suivante est Préparer le test utilisateur, assignée à Julie.`

### Pourquoi

`Le jalon Intégration ne peut pas être terminé tant que cette validation reste ouverte.`

Cette intelligence apparaît comme explication contextuelle dans Home/Vue projet/Travail. Elle ne nécessite pas un chat permanent et ne doit jamais inventer un état absent des données.

---

# 12. Critères de validation Phase 2

La Phase 2 est validable si :

- chaque destination globale répond à une question distincte ;
- aucun objet métier n’a deux lieux concurrents de gestion ;
- Travail/Roadmap n’exige plus de choisir entre quatre paradigmes équivalents ;
- Agenda couvre réellement le temps personnel/transverse ;
- Fichiers global recherche, Projet/Ressources gère ;
- Home, Projets, Vue projet et Travail utilisent le même moteur de priorité ;
- le mobile conserve la même logique de priorité sans reproduire le desktop ;
- chaque page a une action principale identifiable ;
- le vocabulaire utilisateur est stable ;
- aucune nouvelle fonctionnalité majeure n’est nécessaire pour maqueter la V6.

---

# 13. Prochaine phase obligatoire

**Phase 3 — Wireflows V6 des six parcours critiques**, avant toute implémentation :

1. rejoindre une équipe ;
2. créer un projet exploitable ;
3. reprendre un projet après absence ;
4. travailler/collaborer jusqu’à résolution d’un blocage ;
5. livrer → valider → réviser ;
6. clôturer puis retrouver la mémoire du projet.

Pour chaque wireflow : desktop + mobile, écran d’entrée, action principale, états vides/erreurs, branche Guest/Member/Admin lorsque pertinente, et sortie attendue.

Après validation des wireflows seulement : maquettes V6 haute fidélité définitives, tests utilisateurs, puis implémentation progressive sur le backend actuel.

# 2b2c — Communication V4 — Wireframe Logic V0.2

## Statut

**WIREFRAME LOGIC CONSOLIDÉ — remplace V0.1 comme cible UX, non implémenté.**

Autorité produit : `COMMUNICATION_V4_PRODUCT_WORKFLOW_CONTRACT_V0_3.md`.

Objectif : décrire précisément ce que l'utilisateur voit, comprend et fait avant tout travail de DA haute fidélité.

---

# 1. Règle d'interface

Chaque écran Communication doit répondre sans jargon à :

1. **Où suis-je ?** Général / Projet / Privé / Réunion.
2. **Qui peut lire ?** audience actuelle réelle.
3. **Qu'est-ce qui me concerne ?** uniquement si attention personnelle ou personnes concernées.

Ne jamais exposer : `kind`, `conversation_members`, `is_general`, RLS, notification_level brut.

---

# 2. Messages Home — `#/messages`

## Desktop

### Colonne contexte

Ordre fixe :

- Recherche ;
- **À suivre** avec badge personnel ;
- **Général** ;
- **Projets** ;
- **Privés** ;
- `Résolues` secondaire.

Sous Projets : afficher au maximum les projets récents/actifs utiles. Un projet déplié montre :

- Général ;
- Discussions suivies ;
- Discussions récentes ;
- Voir toutes.

Aucune liste plate de toutes les conversations.

### Panneau principal par défaut

Titre : `À suivre`.

Une ligne par conversation :

- raison prioritaire : Annonce / Mention / Réponse / Privé / Discussion suivie ;
- contexte ;
- titre ;
- auteur + extrait dernier message pertinent ;
- compteur pertinent ;
- heure.

Les non-lus passifs de Général/Projet en mode `Mentions et réponses` n'apparaissent pas ici.

### CTA

- `Nouvelle discussion`
- `Nouveau privé`

Depuis Home, Nouvelle discussion demande uniquement le contexte :

- Général ;
- un Projet accessible.

Pas de Réunion dans ce menu.

## Mobile

Premier écran :

- header `Messages` ;
- recherche ;
- bloc À suivre ;
- Général ;
- Projets ;
- Privés ;
- Résolues dans menu secondaire.

Tap ouvre un fil plein écran.

---

# 3. Général équipe

## Header

- breadcrumb `Messages / Général` ;
- titre `Général` ;
- sous-ligne `Visible par toute l'équipe` ;
- CTA `Nouvelle discussion` ;
- menu `…` : Suivre / Mentions et réponses / Silencieux, Appeler…, annonce si autorisée.

Pas de Résoudre.

Par défaut l'utilisateur est en `Mentions et réponses` sauf choix/migration contraire.

## Fil

Chronologie simple.

Message ayant une Discussion liée :

- badge/carte compacte sous le message ;
- titre Discussion ;
- dernière activité ;
- CTA `Ouvrir la discussion`.

L'action Répondre de ce message devient prioritairement `Continuer dans la discussion`.

## Composer

- textarea ;
- `@` autocomplete inline ;
- joindre ;
- envoyer.

Pour owner/admin : `Publier comme annonce` reste secondaire, pas un toggle permanent.

---

# 4. Discussion Team

## Header compact

Ligne 1 : breadcrumb `Général / [Titre]`.

Ligne 2 :

- titre ;
- `Visible par toute l'équipe` ;
- avatars `Concernés : Fred, Cédric` si présents.

Actions :

- `Suivi` / `Suivre` ;
- `Appeler…` ;
- `Résoudre` si autorisé ;
- `…`.

Ne pas afficher une liste complète des followers.

## Source

Si Discussion issue d'un message : bloc `Point de départ` avant le premier message Discussion :

- auteur ;
- date ;
- contenu source ;
- `Voir dans Général`.

Ce bloc est une référence, pas une copie éditable.

## Messages

Chaque message :

- avatar/auteur ;
- heure ;
- texte ;
- attachments ;
- preview de réponse si reply_to.

Actions au hover/tap :

- Répondre ;
- `…`.

`…` : copier lien, transformer en…, modifier/supprimer si auteur.

Pas de réactions, sous-thread, priorité ou tags en V4 core.

---

# 5. Discussion Projet

Même structure que Team Discussion, avec différences :

- breadcrumb `Projet X / Messages / [Titre]` ;
- audience `Visible par les membres de Projet X` ;
- si Guest présent : `dont 1 invité externe` visible sans devoir ouvrir les réglages ;
- transformations prioritaires Action / Demande / Décision ;
- `Créer une idée` secondaire et libellé `Créer une nouvelle idée distincte` si affiché.

Ajouter Concerné n'affiche que les personnes ayant déjà accès au Projet.

---

# 6. Projet > Messages — landing

Route : `#/projects/:projectId/messages` ou équivalent V4.

Ne redirige jamais automatiquement vers Général.

## Header

- `Messages` ;
- nom Projet ;
- `Nouvelle discussion`.

## Sections

### Général du projet

Toujours présent, avec :

- extrait ;
- dernière activité ;
- non-lu discret ;
- état suivi personnel.

### Discussions actives

Ordre :

1. suivies avec non-lu ;
2. concernées ;
3. récentes.

Chaque ligne :

- titre ;
- concernés ;
- suivi ;
- dernier auteur/extrait ;
- heure ;
- non-lu pertinent.

### Réunions récentes

Seulement si elles apportent un accès utile à un fil Meeting.

### Résolues

Lien secondaire avec nombre.

---

# 7. Nouvelle Discussion — depuis contexte

Panneau/modal compact.

Header : `Nouvelle discussion`.

Contexte affiché non éditable :

- `Dans Général` ; ou
- `Dans Projet X`.

Champs :

1. Titre ;
2. Message de départ ;
3. Personnes concernées — optionnel ;
4. Pièces jointes — optionnel.

CTA : `Créer la discussion`.

Après succès :

- fermer modal ;
- injecter/recharger état ;
- ouvrir immédiatement Discussion ;
- aucun flash de liste / rebond.

---

# 8. Nouvelle Discussion — depuis un message

Action recommandée : `Continuer dans une discussion`.

Panneau :

- preview du message source ;
- titre ;
- note d'ouverture optionnelle ;
- Personnes concernées ;
- CTA `Créer la discussion`.

Si une Discussion existe déjà pour ce message, ne pas ouvrir ce formulaire : ouvrir la Discussion existante.

---

# 9. Concernés / suivi

## Concernés

Affichés dans le header Discussion par avatars + texte.

Edition dans menu/panneau géré seulement pour acteurs autorisés.

UX d'ajout :

- recherche personnes ;
- uniquement lecteurs actuels ;
- si personne non autorisée à lire : ne pas la proposer comme ajout silencieux ; afficher `Cette personne n'a pas accès à ce projet` si recherche explicite.

## Suivi personnel

Bouton simple :

- `Suivre` ;
- `Suivi`.

Menu secondaire permet `Mentions et réponses` / `Silencieux`.

Pas de tableau de notification complexe.

---

# 10. Privé

## Création

`Nouveau privé` → multi-sélecteur personnes.

- 1 personne : direct ;
- plusieurs : groupe ;
- nom groupe optionnel.

## Direct header

- personne ;
- `Privé` ;
- projet lié éventuel ;
- `Appeler` ;
- menu.

## Groupe header

- nom ;
- participants explicites ;
- `Appeler le groupe` ;
- menu.

Pas de Résoudre.

Pas d'ajout de membre à un groupe existant en V4 core.

---

# 11. Réunion

Header :

- `Réunion` ;
- titre ;
- date/statut ;
- projet éventuel ;
- participants ;
- `Voir la réunion` ;
- `Rejoindre l'appel` si Live.

Pas de création Réunion dans Messages.

---

# 12. Résolue

Discussion résolue :

- badge `Résolue` ;
- auteur/date de résolution si utile ;
- historique lisible ;
- composer remplacé par `Cette discussion est résolue.` ;
- CTA `Rouvrir` uniquement si autorisé.

Depuis message source :

- `Voir la discussion résolue` ;
- si autorisé, option `Rouvrir` dans Discussion.

---

# 13. Non-lus / lecture

## Conversation ouverte au dernier message

Lorsque l'utilisateur atteint réellement les nouveaux messages, marquer la borne vue.

## Deep-link ancien message

- positionner au message ;
- ne pas marquer les plus récents ;
- bouton flottant/compact `5 nouveaux messages ↓` ;
- clic conduit au premier nouveau puis au bas.

## Utilisateur scrolle vers le haut pendant qu'un message arrive

Ne pas déplacer le viewport.

Afficher `1 nouveau message ↓`.

---

# 14. Brouillon

Composer conserve le texte indépendamment du refresh messages.

Affichage discret si restauration : `Brouillon restauré` une seule fois.

Navigation mobile retour liste puis retour fil restaure le texte.

Pièce jointe sélectionnée mais non envoyée n'est pas garantie après navigation/reload : V4 core persiste le texte uniquement ; l'UI doit éviter de prétendre le contraire.

---

# 15. `Transformer en…`

Un seul menu secondaire contextuel.

## Général

- Continuer dans une discussion ;
- Créer une idée ;
- Créer une demande ;
- Décision workspace si droit.

## Discussion Team

- Créer une idée ;
- Créer une demande ;
- Décision workspace si droit.

## Projet

- Action ;
- Demande ;
- Décision.

## Réunion

- Action ;
- Décision.

Ne pas afficher les cibles impossibles.

---

# 16. Créer une Idée depuis Discussion

Panneau dédié.

- titre prérempli éditable ;
- description de départ ;
- liste messages sources avec cases ;
- pièces jointes sources avec cases ;
- rappel : `Cette idée sera étudiée avant toute création de projet.` ;
- CTA `Créer l'idée et l'ouvrir`.

Ne rien sélectionner automatiquement au-delà du point de départ / choix évident sans possibilité de correction.

Après création : lien discret dans Discussion : `Idée liée · [titre]`.

Projet lié uniquement après GO.

---

# 17. Fichiers / attachments

Message attachment card :

- nom ;
- type/taille ;
- ouvrir.

Menu :

- télécharger/ouvrir ;
- si Projet et autorisé : `Ajouter aux ressources du projet`.

Fichiers global : filtre `Pièces jointes` avec :

- fichier ;
- contexte ;
- auteur ;
- date ;
- `Voir le message`.

Ne jamais afficher badge `Ressource` sans promotion explicite.

---

# 18. Recherche

Champ unique + filtres secondaires :

- Tous ;
- Général ;
- Projets ;
- Privés ;
- Résolues.

Résultat :

- contexte ;
- Discussion/conversation ;
- extrait ;
- auteur ;
- date ;
- pièce jointe hit éventuel.

Clic ouvre le message exact, le surligne brièvement et respecte les non-lus plus récents.

---

# 19. Appeler…

Général/Projet/Discussion → panneau de sélection.

- concernés précochés si présents ;
- utilisateur courant exclu ;
- autres lecteurs accessibles recherchables ;
- récapitulatif final ;
- CTA `Appeler X personne(s)`.

Si aucun concerné : rien de précoché.

---

# 20. États vides

## À suivre

`Rien ne demande votre attention dans Messages.`

CTA secondaire : Général / Nouvelle discussion.

## Projet sans Discussion

Général existe toujours.

`Aucune discussion active. Créez-en une lorsqu'un sujet mérite son propre espace.`

## Résolues vide

`Aucune discussion résolue.`

## Privé vide

`Aucun échange privé.` + Nouveau privé.

---

# 21. Mobile

Conversation plein écran :

- header compact sticky ;
- retour contextuel ;
- audience accessible sans prendre deux lignes permanentes ;
- menu `…` ;
- fil scrollable ;
- nouveau-message indicator au-dessus du composer ;
- composer sticky compatible clavier ;
- modal/panel plein écran pour nouvelle Discussion, Concernés, Appeler, Transformer.

Le dock global ne doit pas recouvrir le composer ; lorsqu'un fil Messages est ouvert, le composer est prioritaire.

---

# 22. Gate wireframe

Avant DA high-fidelity, faire passer au moins :

1. Fred/Cédric General ordinaire ;
2. @Fred ;
3. continuer dans Discussion ;
4. concerné vs lecteur ;
5. Projet avec non-lu passif ;
6. Projet avec Guest visible ;
7. private direct ;
8. call selector ;
9. deep-link ancien message ;
10. message entrant avec draft ;
11. resolve/reopen ;
12. Discussion → Idea ;
13. attachment → Resource ;
14. mobile keyboard/navigation.

**Si un utilisateur doit connaître le modèle technique pour réussir un de ces scénarios, le wireframe est à revoir.**
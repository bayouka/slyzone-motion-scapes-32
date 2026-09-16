# 2b2c — Communication V4 — Wireframe logic V0.1

## Statut

**WIREFRAME LOGIC CANDIDATE — dérivé de `COMMUNICATION_V4_PRODUCT_WORKFLOW_CONTRACT_V0_2.md`, non implémenté.**

Objectif : fixer la hiérarchie, les actions et les états avant tout travail visuel haute fidélité.

---

# 1. Règle d'interface

L'utilisateur ne doit jamais avoir à comprendre `kind`, `conversation_members`, `is_general`, projet lié ou audience technique.

Chaque écran doit répondre visuellement à trois questions :

1. **Où suis-je ?** Général / Projet / Privé / Réunion.
2. **Qui peut lire ?** libellé explicite mais non technique.
3. **Qui est concerné ?** seulement si une Discussion possède des personnes concernées.

---

# 2. Messages home — route `#/messages`

## Desktop

### Colonne gauche

- recherche ;
- `À suivre` avec badge attention ;
- `Général` ;
- bloc `Projets` repliable ;
- bloc `Privés` ;
- lien secondaire `Résolues`.

Sous un Projet déplié :

- Général ;
- 3–5 Discussions suivies/récentes max ;
- `Voir toutes`.

Ne pas afficher une liste plate de toutes les conversations.

### Zone principale si aucune conversation choisie

Titre : `À suivre`.

Liste de conversations nécessitant attention avec :

- raison : `Mention`, `Réponse`, `Privé`, `Discussion suivie`, `Annonce` ;
- contexte : Général / Projet X / Privé ;
- auteur + extrait ;
- heure ;
- état non-lu.

CTA en haut :

- `Nouvelle discussion`
- `Nouveau privé`

`Nouvelle discussion` depuis la home demande seulement le contexte : Général ou un Projet accessible. Ensuite formulaire normal.

Aucune option Réunion dans ce menu.

## Mobile

Écran liste unique :

- header Messages ;
- recherche ;
- À suivre ;
- Général ;
- Projets ;
- Privés ;
- Résolues dans menu secondaire.

Tap → conversation plein écran.

---

# 3. Général équipe

## Header

- breadcrumb `Messages / Général` ;
- titre `Général` ;
- sous-ligne `Visible par toute l'équipe` ;
- CTA `Nouvelle discussion` ;
- menu `…` pour réglages de notification.

Pas de Résoudre.

Pas de bouton Appeler direct. Si appel disponible : `Appeler…` avec sélecteur.

## Corps

Fil chronologique simple.

Si un message a généré une Discussion, afficher sous ce message une carte compacte :

`Discussion créée → [Titre] · X messages · dernière activité …`

Ne pas recopier les messages de la Discussion dans Général.

## Composer

- zone texte ;
- autocomplete `@Nom` inline ;
- joindre ;
- Envoyer.

Annonce n'est pas un toggle permanent. Pour owner/admin : option secondaire `Publier comme annonce` avant envoi ou dans menu contextualisé.

---

# 4. Discussion

## Header

- breadcrumb `Général / [Discussion]` ou `Projet X / Messages / [Discussion]` ;
- titre ;
- badge `Active` uniquement si utile ;
- libellé de visibilité : `Visible par toute l'équipe` ou `Visible par les personnes ayant accès à Projet X` ;
- avatars `Personnes concernées` ;
- bouton personnel `Suivre / Suivi` ;
- `Appeler…` ;
- `Résoudre` ;
- menu `…`.

Éviter plusieurs lignes de métadonnées permanentes.

## Point de départ

Si créée depuis message : bloc en tête avant les messages :

`Point de départ` + auteur + date + message source + `Voir dans Général`.

Ce bloc n'est pas un message dupliqué.

## Fil

Messages plats avec seulement :

- auteur ;
- heure ;
- texte ;
- attachments ;
- réponse contextuelle éventuelle.

Actions visibles au hover/tap :

- Répondre ;
- `…`.

Menu `…` selon droits/contexte :

- Copier le lien ;
- Transformer en… ;
- Modifier / Supprimer si auteur.

Pas de sous-thread.

## Résolue

Header `Résolue` + date/auteur de résolution.

Composer remplacé par :

`Cette discussion est résolue.` + bouton `Rouvrir la discussion` si autorisé.

---

# 5. Projet > Messages

## Landing projet

Route logique : `Projet X / Messages`.

Header :

- titre `Messages` ;
- contexte Projet X ;
- `Nouvelle discussion`.

Contenu :

### Général du projet

Carte/ligne toujours en premier avec extrait dernière activité et non-lu passif.

### Discussions actives

Liste :

- titre ;
- personnes concernées ;
- dernière activité ;
- suivi personnel ;
- non-lu.

### Réunions récentes

Section secondaire uniquement si utile : fils des réunions récentes du Projet.

### Résolues

Lien secondaire avec nombre.

Sélection d'un élément ouvre le fil dans le même espace de communication, sans retour forcé à la liste globale Messages.

---

# 6. Nouveau sujet de travail — formulaire `Nouvelle discussion`

## Depuis Général/Projet

Modal ou panneau compact :

- `Titre de la discussion` ;
- `Message de départ` ;
- `Personnes concernées` — recherche/autocomplete ;
- pièces jointes ;
- CTA `Créer la discussion`.

Sous le titre du formulaire, afficher le contexte déjà choisi :

`Dans Général` ou `Dans Projet X`.

Ne pas rendre ce contexte éditable si l'action part d'un écran contextuel ; utiliser `Changer` uniquement depuis Messages home.

Après submit :

- transaction réussie ;
- état local rechargé/injecté ;
- ouverture immédiate de la Discussion ;
- aucun rebond vers `#/messages`.

---

# 7. Discussion depuis un message

Action message : `Créer une discussion`.

Formulaire :

- aperçu du message source ;
- titre ;
- note d'ouverture optionnelle ;
- personnes concernées ;
- CTA `Créer`.

Le source message sert de point de départ.

---

# 8. Privé

## Création

CTA `Nouveau privé` → sélecteur de personnes.

1 personne = direct.
Plusieurs = groupe.

Nom de groupe optionnel seulement si plusieurs.

## Header direct

- nom/avatar ;
- `Privé` ;
- projet lié éventuel ;
- `Appeler` ;
- menu.

## Header groupe

- titre ;
- participants explicites ;
- `Appeler le groupe` ;
- pas de Résoudre.

V4 core ne propose pas d'ajouter des membres à un groupe existant : une modification d'audience crée un nouvel objet tant qu'un workflow sûr n'est pas conçu.

---

# 9. Réunion

Dans Messages :

- breadcrumb Réunion + Projet éventuel ;
- titre réunion ;
- date/état ;
- participants ;
- CTA `Voir la réunion` ;
- si Live : `Rejoindre l'appel`.

Pas de création Réunion ici.

---

# 10. `Transformer en…`

## Accès

Sous `…` d'un message, ou action de Discussion quand la transformation porte sur le thème entier.

## Menu dynamique

### Général

- Créer une Discussion ;
- Créer une Idée ;
- Créer une Demande ;
- Enregistrer une Décision — si autorisé.

### Discussion Team

- Créer une Idée ;
- Créer une Demande ;
- Enregistrer une Décision — si autorisé.

### Projet

- Créer une Action ;
- Créer une Demande ;
- Enregistrer une Décision.

### Réunion

- Créer une Action ;
- Enregistrer une Décision.

Ne pas afficher les options non pertinentes.

---

# 11. Idée issue d'une Discussion

Action de Discussion : `Créer une idée`.

Panneau :

- titre prérempli éditable ;
- description préremplie depuis contenu sélectionné ;
- liste de messages/documents sources cochables ;
- rappel `L'idée sera étudiée avant toute création de projet` ;
- CTA `Créer l'idée et l'ouvrir`.

Après création :

Header Discussion affiche un lien discret :

`Idée liée · [titre] · [état]`.

Après GO seulement :

`Projet créé · [nom]`.

---

# 12. Pièces jointes

Dans message : cartes compactes fichier.

Menu fichier :

- Ouvrir ;
- Télécharger via mécanisme existant ;
- Copier le lien si permis ;
- si Projet : `Ajouter aux ressources du projet`.

Fichiers global : filtre `Pièces jointes`, résultat avec :

- nom ;
- conversation ;
- Projet/Général ;
- auteur ;
- date ;
- lien `Voir le message source`.

Ne pas marquer une pièce jointe comme Ressource tant que promotion non faite.

---

# 13. Recherche Messages

Recherche unique avec filtres secondaires :

- Tous ;
- Général ;
- Projets ;
- Privés ;
- Résolues.

Un résultat affiche :

- type/contexte ;
- titre Discussion ou conversation ;
- extrait ;
- auteur ;
- date ;
- attachment hit éventuel.

Tap ouvre le bon message et surligne brièvement le résultat.

---

# 14. Indicateurs de lecture/attention

## Ligne de conversation

- titre normal = lu ;
- titre gras = non lu ;
- pastille `@` = mention ;
- pastille `↩` = réponse personnelle ;
- compteur = direct/followed unread pertinent ;
- aucun compteur global pour simple visibilité passive.

## Dock Messages

Badge = attention personnelle seulement.

---

# 15. Brouillons

Brouillon sauvegardé par `conversation_id` côté client de façon bornée.

Doit survivre :

- réception message ;
- aller-retour liste ;
- resize/mobile clavier ;
- reconnexion courte.

Effacé uniquement après envoi réussi ou action utilisateur explicite.

---

# 16. États vides utiles

## À suivre vide

`Rien à lire pour le moment.`

Sous-CTA : `Voir Général` / `Nouvelle discussion`.

## Projet sans discussion

Général toujours présent.

`Aucune discussion active. Créez-en une quand un sujet mérite son propre espace.`

## Privés vide

`Aucun échange privé.` + `Nouveau privé`.

## Résolues vide

`Aucune discussion résolue.`

---

# 17. Ce qui ne doit pas apparaître en V4 core

- channels ;
- dossiers ;
- hashtags de conversation ;
- réactions emoji comme mécanisme métier ;
- sous-threads ;
- priorité de message ;
- statuts custom ;
- catégories manuelles ;
- bots dans le fil ;
- résumé IA automatique permanent ;
- plusieurs modes de vue pour Messages.

---

# 18. Gate UX avant code

Les wireframes haute fidélité devront prouver sur desktop et mobile :

1. Cédric écrit à Fred dans Général et comprend comment notifier Fred ;
2. Fred transforme le message en Discussion sans perdre la source ;
3. la Discussion reste visible à l'équipe mais montre Fred+Cédric comme concernés ;
4. aucun appel collectif involontaire ;
5. Projet > Messages montre Général + Discussions ;
6. Discussion → Idée ne crée pas directement un Projet ;
7. pièce jointe retrouvable ;
8. Résolue sort de la liste active ;
9. brouillon conservé pendant réception temps réel ;
10. un nouvel utilisateur comprend la logique sans explication technique.

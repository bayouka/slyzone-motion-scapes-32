# 2b2c — V6 — Écrans secondaires — 2026-09-11

## Statut

Spécification de conception. **Non déployée.** Production conservée : `v4.5.12-work-p1 / build 519`.

Ce document complète les écrans structurants déjà définis : Home, Projets, Vue d’ensemble projet, Travail/Roadmap.

## 1. Agenda V6

### Mission

Répondre à : « Qu’est-ce qui arrive quand, pour moi et pour mes projets ? »

### Contenu par défaut

Un flux temporel commun rassemble :

- réunions ;
- actions avec échéance ;
- jalons/date cible ;
- validations attendues avec date ;
- demandes datées.

### Vues

- défaut : Semaine ;
- secondaire : Jour / Mois ;
- liste « À venir » toujours disponible sur mobile.

### Règles

- la due date collective d’une action n’est pas un créneau de travail personnel ;
- ne jamais déplacer silencieusement une échéance métier ;
- couleur = type, pas priorité seule ;
- clic ouvre l’objet source, pas une copie.

### États

Vide : `Rien de prévu dans les 7 prochains jours.`
Erreur : conserver le dernier contexte connu + Réessayer.

## 2. Messages / Échanges V6

### Mission

Centraliser les conversations sans perdre leur contexte projet.

### Architecture

Filtres : Tous / Non lus / Mentions / Projets / Privés / Réunions.

Chaque conversation affiche : audience, projet éventuel, dernière activité, non lus, appel possible si pertinent.

### Détail conversation

- messages ;
- pièces jointes ;
- contexte projet visible mais discret ;
- actions : appeler, ajouter participants selon règles, ouvrir projet/source.

### Transformations

Depuis un message, actions secondaires :

- créer Action ;
- consigner Décision ;
- créer Demande ;
- ajouter à l’agenda/réunion si pertinent.

Toute transformation conserve la provenance.

### IA future

Pas de bouton chatbot global dominant. `@2b2c` ou commande contextuelle possible uniquement quand Project Intelligence sera implémentée.

## 3. Ressources / Livrables V6

### Mission

Gérer les matériaux du projet et les sorties officielles sans confusion.

### Onglets

- Ressources ;
- Livrables.

Les filtres de type restent secondaires.

### Ressource

Affiche : titre, type, projet, auteur/modifié, partage, liens éventuels vers action/décision.

### Livrable

Affiche : version actuelle, état de validation, visibilité/partage, historique des versions, validateur, prochaine action.

### Validation

Le validateur voit toujours :

- livrable ;
- version exacte ;
- demande ;
- commentaire éventuel ;
- Approuver / Demander modifications.

Après modifications demandées : nouvelle version obligatoire.

### Mobile

Livrable en carte compacte ; historique et validation dans sheet plein écran.

## 4. Fichiers global V6

### Mission

Retrouver ce qui existe, pas administrer les workflows de livraison.

Recherche globale + filtres : projet / type / auteur / date / statut utile.

Un fichier lié à un Livrable ouvre d’abord le contexte Livrable si l’utilisateur cherche à valider/versionner.

Pas de duplication avec Ressources projet.

## 5. Réunions V6

### Mission

Faire de la réunion un événement qui modifie le projet, pas un simple appel vidéo.

### Avant

- objectif ;
- agenda ;
- participants ;
- documents ;
- sujets/questions à traiter.

### Pendant

- visio/audio/partage écran ;
- notes ;
- décisions ;
- actions ;
- questions ouvertes.

### Après

- synthèse ;
- décisions ;
- actions créées ;
- questions non résolues ;
- conséquences visibles sur le projet.

### Appel ad hoc

Reste possible hors réunion formelle, avec choix des participants et ajout en cours d’appel.

## 6. Équipe / Accès V6

### Mission

Comprendre qui est dans l’espace et à quoi chacun a accès sans exposer RLS/access_mode.

### Onglets

- Membres ;
- Invitations.

Rôles avancés/groupes seulement si un besoin réel l’exige plus tard.

### Membre

Affiche : nom, rôle, statut, projets visibles en langage clair.

### Modifier accès

- Admin : tous les projets ;
- Membre : projets Équipe automatiquement + projets Restreints sélectionnés ;
- Invité : uniquement projets explicitement partagés.

Owner immuable depuis l’UI courante selon contrat backend.

### Invitation

Email + rôle + sélection de projets uniquement quand nécessaire. Copier le lien seulement après création serveur réussie.

## 7. Paramètres V6

### Mission

Réserver les réglages aux éléments réellement administrables.

Sections :

- Mon profil ;
- Notifications ;
- Apparence ;
- Intégrations futures ;
- Sécurité ;
- Facturation future ;
- Limites d’usage futures ;
- Aide/support.

Ne pas exposer des réglages techniques internes.

## 8. Onboarding invitation V6

### Étapes

1. Aperçu invitation ;
2. Connexion/création compte ;
3. Acceptation automatique si identité exacte ;
4. Bienvenue contextuelle ;
5. Home ou action qui attend déjà l’utilisateur.

Aucun choix de permissions demandé au destinataire.

## 9. Création projet V6

Wizard 3 étapes :

1. Résultat — nom, résultat attendu, date cible facultative ;
2. Accès — Équipe recommandé / Restreint ;
3. Chemin — 3 à 7 étapes simples.

Après création : arrivée directe Vue d’ensemble + CTA Créer première action.

## 10. Clôture / Archive V6

### Pré-vérification

Afficher engagements ouverts, validations, livrables candidats.

### Clôture

- résultat réel obligatoire ;
- versions finales exactes ;
- snapshot de clôture.

### Projet terminé

Devient une mémoire consultable : résultat, chemin, décisions, livrables, sources, synthèses.

### Réouverture

Explicite ; crée une nouvelle période de travail sans modifier l’ancienne livraison.

## 11. Recherche globale V6

Champ accessible topbar.

Résultats groupés : projets / actions / messages / fichiers / décisions / réunions.

Phase ultérieure : recherche de connaissance avec sources internes, sans remplacer la recherche classique.

## 12. Notifications V6

Trois niveaux :

1. À traiter — intervention nécessaire ;
2. À connaître — changement significatif ;
3. Digest — activité informative regroupée.

La cloche ne doit pas reproduire tout l’historique d’activité.

## 13. États transverses obligatoires

Chaque écran secondaire doit prévoir :

- vide ;
- chargement ;
- normal ;
- erreur ;
- permission perdue ;
- objet supprimé/inaccessible ;
- mutation en cours ;
- succès serveur confirmé.

## 14. Cohérence mobile

- header compact ;
- action primaire accessible au pouce ;
- sheets plein écran pour décisions complexes ;
- pas de tableaux miniaturisés ;
- pas de perte des fonctions de capture/réponse/validation/réunion.

## 15. Critères de validation

Les écrans secondaires sont validables si :

- aucun ne duplique une autre destination ;
- le contexte projet reste visible ;
- l’objet source est toujours accessible ;
- les transformations conservent provenance ;
- Guest/Internal ont une expérience compréhensible ;
- aucun module n’exige de connaître la structure technique de 2b2c.

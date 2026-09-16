# 2b2c — Communication V4 — Red-team produit — 2026-09-16

## Statut

Revue contradictoire de `COMMUNICATION_V4_PRODUCT_WORKFLOW_CONTRACT_V0_1.md` avant toute implémentation.

Objectif : chercher les cas où la nouvelle logique resterait trop complexe, créerait du bruit ou introduirait un deuxième modèle de messagerie.

## Conclusion

La direction V4 est meilleure que V3, mais V0.1 nécessite plusieurs clarifications avant validation.

Le risque principal serait de remplacer le mauvais mélange V3 par trop de concepts visibles : Général + Discussion + participant + follower + mention + non-lu + À suivre + réponse + privé + réunion.

La cible doit donc préserver la séparation technique tout en **réduisant le nombre de concepts que l'utilisateur doit manipuler**.

---

## RT1 — Ne pas recréer les threads Slack sous les Discussions

Si 2b2c conserve :

- Général ;
- Discussion enfant ;
- puis thread imbriqué dans une Discussion ;

on recrée trois profondeurs de conversation.

**Décision :** aucune sous-discussion / thread récursif en V4.

`Répondre` reste une citation/réponse contextuelle dans le même fil. Quand un échange général mérite son propre espace, on crée une Discussion.

---

## RT2 — Mention ≠ abonnement permanent

V0.1 proposait qu'une personne mentionnée suive automatiquement toute la Discussion.

Cela crée des abonnements surprises.

**Décision :**

- `@mention` = attention ponctuelle ;
- être ajouté dans `Personnes concernées` = suivre automatiquement ;
- écrire dans une Discussion = suivre automatiquement ;
- répondre dans une Discussion = suivre automatiquement ;
- l'utilisateur peut ensuite `Ne plus suivre` sans perdre l'accès.

---

## RT3 — Général équipe doit rester un point commun

Si Général n'est suivi par personne par défaut, le canal transverse ne joue plus son rôle.

Si chaque message produit une notification forte à tous, il devient du bruit.

**Décision :** tous les membres internes suivent Général équipe par défaut, mais :

- activité = non-lu / À suivre ;
- notification forte uniquement pour mention, réponse personnelle ou annonce.

Ainsi Général reste vivant sans devenir une alerte permanente.

---

## RT4 — Projet Team accessible à tous ≠ tous doivent suivre le Général projet

Dans le modèle 2b2c, un Projet Team donne l'accès à tous les membres internes. Les inscrire automatiquement à toutes les conversations projet ferait exploser le bruit dès que plusieurs projets existent.

**Décision :** Général projet n'est pas automatiquement suivi par tout utilisateur qui peut lire le Projet.

Sont suivis automatiquement :

- lead du projet ;
- auteur lorsqu'il écrit ;
- personnes ajoutées comme concernées dans une Discussion ;
- personnes qui choisissent Suivre.

Une mention reste ponctuelle tant que la personne n'interagit pas.

L'UI peut afficher un non-lu passif dans le Projet sans le transformer en notification personnelle globale.

---

## RT5 — Le badge Messages ne doit pas être le compteur de tout ce qui est lisible

Sinon chaque message dans chaque Projet Team augmente le badge de tous les membres.

**Décision :** badge global Messages = attention personnelle uniquement :

- direct/groupe privé non lu ;
- mention ;
- réponse personnelle ;
- Général équipe non lu ;
- activité non lue d'une Discussion suivie ;
- annonce.

Les non-lus passifs de projets accessibles restent visibles dans leur contexte mais ne polluent pas le badge global.

---

## RT6 — Création depuis message : ne pas forcer un message supplémentaire artificiel

La règle « une Discussion doit toujours avoir un premier message » entre en conflit avec `Créer une discussion à partir de ce message`.

**Décision :** deux modes atomiques :

1. discussion neuve = titre + premier message obligatoires ;
2. discussion depuis message = titre + `source_message_id` obligatoires, note d'ouverture optionnelle.

Le message source affiché comme `Point de départ` tient lieu de contexte initial sans duplication.

---

## RT7 — Participants et followers ne doivent pas devenir deux formulaires

La séparation technique est saine, mais l'utilisateur ne doit pas gérer deux listes en permanence.

**Décision UI :**

- à la création : seul champ `Personnes concernées` ;
- en lecture : avatars concernés + bouton `Suivre / Suivi` personnel ;
- la liste complète des followers n'est pas une information de premier niveau.

Backend peut distinguer `participant` et `follower`.

---

## RT8 — À suivre ne doit pas concurrencer Home

Home reste l'agrégateur personnel cross-domain : action, demande, validation, réunion, message important.

Messages > À suivre est uniquement un filtre de communication.

**Décision :** ne pas copier toute la logique Home dans Messages. `À suivre` répond seulement : « quels échanges dois-je lire/reprendre ? ».

---

## RT9 — Réunion ne doit pas avoir deux propriétaires

Si Messages permet de créer une Réunion et Agenda aussi, on garde deux chemins.

**Décision :** Réunion se crée uniquement depuis Agenda/Meeting workflow. Messages ne fait qu'ouvrir le fil lié.

---

## RT10 — Discussion → Projet direct contournerait l'Idea Engine

Le cas réel Fred/Cédric parle d'idées et projets futurs.

Une action directe `Créer un projet` serait séduisante mais incohérente avec le contrat Idea ≠ Project.

**Décision :** depuis Général / Discussion de pré-projet : `Créer une Idée`.

Le Projet ne peut apparaître qu'après décision/GO selon le workflow Idea Engine.

---

## RT11 — Documents : ne pas transformer Fichiers en poubelle de chat

Indexer toutes les pièces jointes est utile pour la retrouvabilité, mais les présenter au même niveau que des Ressources de travail officielles créerait du bruit.

**Décision :**

- Fichiers peut rechercher les pièces jointes ;
- filtre dédié `Pièces jointes` ;
- Ressources + Livrables restent le cœur de la bibliothèque ;
- une pièce jointe importante peut être promue explicitement en Ressource.

---

## RT12 — External Guest : ne pas résoudre à moitié

Ajouter une simple étiquette `interne/partagé` sans modifier RLS serait dangereux.

**Décision :** la distinction projet Internal/Shared doit avoir son propre gate backend/UX/E2E avant activation.

Tant que ce gate n'existe pas, V4 ne doit pas prétendre offrir des discussions projet internes sûres lorsqu'un Guest a accès au projet.

---

## RT13 — Recherche : les droits actuels doivent gouverner les résultats historiques

Une personne qui perd l'accès à un Projet ne doit pas continuer à retrouver ses anciens messages via la recherche globale.

**Décision :** recherche toujours évaluée avec les droits courants, y compris titres, pièces jointes et Discussions résolues.

---

## RT14 — Résolu ne doit pas devenir une suppression déguisée

Une Discussion résolue doit rester une preuve de travail et de décision.

**Décision :**

- pas supprimée du moteur de recherche ;
- liens vers Action/Décision/Idée/Ressource conservés ;
- écriture bloquée jusqu'à Rouvrir ;
- possibilité de rouvrir par acteur autorisé.

---

## RT15 — Appel : « personnes concernées » n'est qu'un défaut intelligent

Même si deux personnes sont concernées, l'utilisateur doit voir qui sera appelé avant émission.

**Décision :** Général/Projet/Discussion → `Appeler…` affiche toujours confirmation/sélecteur avant envoi. Les personnes concernées ne servent qu'à préremplir.

---

## RT16 — Transformations : trop de possibilités peuvent recréer la surcharge V3

Même derrière `Transformer en…`, cinq cibles peuvent être de trop.

**Décision :** tri contextuel :

- Général / Discussion Team : Discussion, Idée, Demande, Décision workspace selon droits ;
- Discussion Projet : Action, Demande, Décision ; Idée seulement via action secondaire si réellement pertinente ;
- Privé lié à un Projet : Action/Demande/Décision si audience compatible ;
- Réunion : Action/Décision restent prioritaires via workflow Meeting.

Ne jamais montrer une cible impossible uniquement pour la désactiver.

---

## RT17 — La réponse directe doit être simple

Ne pas ajouter réactions, sous-threads, tags, statuts de message, catégories ou priorités de messages dans V4 core.

**Décision :** message = texte + pièces jointes + mention + réponse + menu secondaire.

---

## RT18 — Le modèle doit rester compréhensible à trois personnes comme à trente

À trois, l'utilisateur doit pouvoir ignorer presque toute la structure et simplement écrire dans Général / Privé.

À trente, Discussions, Projet, Suivre et recherche doivent empêcher Général de devenir un historique infini.

**Critère :** les fonctions de structuration doivent être disponibles sans être obligatoires.

---

# Décision de red-team

La cible V4 est **GO POUR ITÉRATION**, pas encore GO implémentation.

Les corrections RT1–RT18 doivent être intégrées dans une V0.2 du contrat avant wireframe ou migration.

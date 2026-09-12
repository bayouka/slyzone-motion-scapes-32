# 4b4c — CAPTURE UX V5 — VALIDÉE FONCTIONNELLEMENT

Date de validation : 2026-09-12

Statut : **VALIDÉE FONCTIONNELLEMENT**

Portée : capture initiale de l’Idée uniquement. Cette validation porte sur logique, accompagnement, interactions et comportement adaptatif. Elle ne fige pas encore la direction artistique haute fidélité.

## 1. Objectif UX

Permettre à un utilisateur novice de commencer sans savoir rédiger un brief professionnel.

Le système doit :

- accepter un champ vide, minimal ou très détaillé ;
- aider sans obliger ;
- exploiter tout ce qui est déjà fourni ;
- éviter les questions redondantes ;
- expliquer clairement à quoi servent les éléments ajoutés ;
- produire un sentiment d’accompagnement réel dès le premier écran.

## 2. Écran principal validé

### Nom

Libellé :

> `Nom de votre idée`

Autosauvegardé.

### Description

Libellé :

> **Parlez-nous de votre idée** `?`

Placeholder :

> `Décrivez simplement ce que vous avez en tête…`

Le `?` ouvre :

> **Que puis-je écrire ici ?**
>
> Ce que vous voulez créer, pour qui, pourquoi, ce que vous imaginez déjà, vos contraintes ou vos inspirations.
>
> Vous n’avez pas besoin de tout savoir : écrivez simplement ce que vous avez en tête.
>
> Plus vous partagez d’informations utiles maintenant, moins 2b2c aura besoin de vous poser de questions ensuite.

## 3. Aide guidée facultative

CTA :

> **Besoin d’un coup de main ?**
>
> `M’aider à préciser mon idée →`

Comportement :

- conversation adaptative ;
- pas de formulaire fixe ;
- aucune question déjà résolue ;
- une poignée de questions utiles au maximum, sans compteur visible ;
- `Je ne sais pas / plus tard` toujours possible ;
- arrêt dès que la compréhension est suffisante.

Exemples de questions possibles selon les manques :

- Qu’aimeriez-vous créer ?
- Qu’aimeriez-vous surtout que cela vous apporte ?
- À qui cela devrait-il surtout servir ?
- Y a-t-il déjà quelque chose que les gens devraient pouvoir faire ?
- Avez-vous déjà certaines envies pour l’apparence ?
- Y a-t-il quelque chose d’important à respecter ou faire valider ?

## 4. Enrichissement automatique de la description

Après l’aide, 2b2c peut compléter lui-même le champ `Parlez-nous de votre idée`.

Message fonctionnel :

> **J’ai complété votre description avec ce que vous venez de m’expliquer.**
>
> Vous pouvez la modifier librement.

Action disponible :

> `↶ Revenir à ma description précédente`

Le texte original, les réponses guidées et la synthèse IA restent séparés en mémoire.

## 5. Ajout de références et documents

Bloc :

> **Vous avez déjà quelque chose qui pourrait nous aider ?**
>
> Un site, des images ou des documents peuvent aider 2b2c à mieux comprendre votre idée.
>
> `+ Ajouter des éléments`

Le modal propose exactement trois familles utilisateur :

### Des liens

Plusieurs liens possibles.

Pour chaque lien :

- URL ;
- rôle facultatif ;
- note facultative.

Exemples de rôle : site actuel, inspiration, concurrent, fonctionnalité intéressante, autre référence.

### Des images

Sélection multiple.

Rôle facultatif : inspiration visuelle, logo, site actuel, maquette/croquis, autre référence.

Note facultative possible.

### Des documents

Sélection multiple.

Rôle facultatif : brief/notes, présentation, étude/recherche, données/tableau, autre document projet.

La catégorie `Autre fichier` est supprimée.

## 6. Feedback après ajout

L’utilisateur ne voit pas uniquement `Upload terminé`.

Le produit explique l’utilité :

- image → compréhension possible des préférences visuelles ;
- site → compréhension de l’existant ou de l’inspiration ;
- document → extraction des informations utiles avant de poser de nouvelles questions.

Le rôle compris/proposé par 2b2c reste corrigeable.

## 7. Formats et limites

Baseline UX prévue :

- Images : JPG/JPEG, PNG, WebP, HEIC/HEIF.
- Documents : PDF, DOCX, TXT, Markdown, PPTX, XLSX, CSV.

Les limites exactes de nombre et de taille ne sont volontairement pas figées dans l’UX avant validation technique.

L’écran principal ne doit pas afficher une liste technique anxiogène ; `Formats et limites` est consultable à la demande.

## 8. CTA principal

Libellé validé :

> **Commencer avec 2b2c**

Ce bouton ne sauvegarde pas pour la première fois.

Au clic :

1. flush des autosaves ;
2. vérification des uploads ;
3. snapshot Capture V1 ;
4. déclenchement de l’analyse ;
5. entrée possible dans le workspace sans attendre la fin de l’IA.

## 9. Premier retour attendu

Après analyse, éviter un simple `Analyse terminée`.

Le système affiche :

> **J’ai une première compréhension de votre idée.**

Puis :

- ce qui a déjà été compris ;
- ce qu’il réutilisera ;
- `Je vais m’appuyer dessus pour la suite : inutile de me le répéter.` ;
- une seule Next Best Action dominante si une intervention humaine est nécessaire.

## 10. Scénarios fonctionnels validés dans le prototype V5

- utilisateur bloqué avec description vide ;
- idée minimale ;
- description déjà riche ;
- aide guidée adaptative ;
- génération/enrichissement automatique du champ principal ;
- retour à la description précédente ;
- liens avec contexte ;
- images multiples ;
- documents multiples ;
- provenance séparée ;
- autosave avant IA ;
- CTA `Commencer avec 2b2c`.

## 11. Ce qui reste à valider plus tard

- direction artistique haute fidélité ;
- accessibilité détaillée du composant final ;
- valeurs exactes des quotas/taille ;
- sécurité/parsing final de chaque format ;
- microcopy finale après tests utilisateurs réels ;
- comportement réel sur réseau lent et uploads lourds.

Ces points ne rouvrent pas la logique fonctionnelle sauf découverte d’un problème réel.

# 2b2c — Communication V4 — Product & Workflow Contract V0.1

## Statut

**CANDIDATE STRUCTUREL — À VALIDER AVANT IMPLÉMENTATION.**

Ce document prolonge `COMMUNICATION_TOPICS_PRODUCT_AUDIT_20260916.md` et définit une cible produit cohérente pour Messages / Général / Discussions / Projets / Privés / Réunions.

Il ne remplace pas encore le contrat de production Communication V3. Aucun runtime ne doit être modifié en prétendant que V4 est validé tant que ce document n'a pas passé la revue produit + UX + sécurité + E2E.

---

# 1. Problème à résoudre

2b2c ne doit pas devenir un clone de Slack, Discord ou Teams.

La promesse est plus simple : une petite équipe doit pouvoir **échanger, structurer ce qui mérite de l'être et transformer les échanges utiles en travail traçable**, sans apprendre une taxonomie complexe.

Le défaut actuel vient du fait que le même objet `conversation` sert simultanément à représenter :

- qui peut lire ;
- qui est concerné ;
- où la conversation se situe ;
- la forme de la conversation ;
- ce qui doit notifier l'utilisateur.

V4 sépare explicitement ces dimensions.

---

# 2. Modèle mental cible

## 2.1 Quatre contextes seulement

L'utilisateur ne doit apprendre que quatre contextes de communication :

1. **Général** — discussion transverse de l'équipe interne ;
2. **Projet** — discussions rattachées à un projet ;
3. **Privé** — échange 1:1 ou groupe explicitement choisi ;
4. **Réunion** — discussion créée depuis une réunion et liée à son cycle Avant → Live → Après.

Une **Discussion** n'est pas un cinquième contexte.

## 2.2 Discussion = unité structurée dans un contexte

Une Discussion est un sujet précis créé :

- sous Général ; ou
- sous un Projet.

Une Discussion possède :

- un titre ;
- un point de départ ;
- un contexte parent ;
- un état actif / résolu ;
- des personnes principalement concernées ;
- une activité et des non-lus ;
- une traçabilité vers les objets de travail éventuellement produits.

## 2.3 Trois concepts humains distincts

### Visibilité

**Qui a le droit de lire ?**

La visibilité est héritée du contexte. Elle est une règle de sécurité, jamais une préférence de notification.

### Suivi / personnes concernées

**Qui doit réellement suivre cette discussion ?**

Une personne peut être autorisée à lire une Discussion sans être considérée comme participante active.

### Mention

**Qui doit être attiré vers ce message précis ?**

Une mention est ponctuelle. Elle ne remplace ni la visibilité ni le suivi.

Invariant : **suivre ou être ajouté comme personne concernée ne doit jamais accorder un droit de lecture qui n'existait pas déjà.**

---

# 3. Vocabulaire utilisateur

Utiliser :

- Messages
- Général
- Discussion
- Projet
- Privé
- Réunion
- Personnes concernées
- Suivre / Ne plus suivre
- Mentionner
- Résoudre / Rouvrir
- Transformer en…

Éviter dans l'UI :

- Canal
- Channel
- Topic comme terme technique
- Dossier de conversation
- Audience comme libellé principal utilisateur
- Subscriber / watcher

Le backend peut conserver des noms historiques (`conversation`, `kind`, etc.) mais l'UI ne doit pas exposer leur modèle technique.

---

# 4. Architecture d'information Messages V4

## 4.1 Entrée globale Messages

La page Messages doit organiser l'information par besoin, pas par table backend.

Ordre cible :

1. **À suivre** — conversations qui demandent réellement l'attention personnelle ;
2. **Général** — fil transverse de l'équipe + Discussions actives ;
3. **Projets** — projets accessibles, chacun avec Général + Discussions actives ;
4. **Privés** — directs et groupes privés ;
5. **Résolues** — accès secondaire aux Discussions terminées ;
6. recherche globale.

Les fils de Réunion ne deviennent pas une catégorie primaire permanente : ils sont accessibles depuis la réunion, le projet associé, la recherche et À suivre s'ils sont actifs.

## 4.2 Navigation desktop

Deux niveaux suffisent :

- colonne gauche : contextes + Discussions récentes/suivies ;
- zone principale : conversation sélectionnée.

Ne pas créer une navigation permanente à trois colonnes qui imposerait une complexité de messagerie d'entreprise.

Un projet peut être replié/déplié. À l'intérieur :

- Général
- Discussions actives pertinentes
- Voir toutes les discussions

## 4.3 Navigation mobile

Messages ouvre d'abord la liste des contextes / À suivre.

Toucher une conversation ouvre un écran plein.

Retour revient à la liste sans perdre le brouillon local.

Le composer reste fixe en bas, clavier mobile compris.

---

# 5. Général — workflow cible

## 5.1 Rôle

Général est le lieu de faible friction pour :

- informations transverses ;
- questions rapides à l'équipe ;
- coordination générale ;
- idées encore trop floues pour justifier une Discussion ;
- annonces rares.

Général est permanent et ne peut pas être résolu.

## 5.2 Actions visibles

Dans Général :

- écrire un message ;
- joindre un fichier ;
- mentionner naturellement via `@Nom` ;
- répondre ;
- créer une Discussion ;
- créer une Discussion à partir d'un message existant ;
- menu `…` sur un message pour les transformations secondaires.

Ne pas afficher sous chaque message Action + Demande + Décision en permanence.

## 5.3 Général n'est pas une conversation privée implicite

Écrire « Fred, … » dans Général reste visible à toute l'équipe.

Si l'utilisateur souhaite un échange privé, il doit utiliser Privé.

Si le message reste utile à l'équipe mais concerne surtout Fred + Cédric, il reste dans Général ou devient une Discussion avec Fred + Cédric comme personnes concernées.

---

# 6. Création d'une Discussion

## 6.1 Depuis Général

CTA : `Nouvelle discussion`.

Champs minimum :

- titre ;
- premier message ;
- personnes concernées — optionnel ;
- pièces jointes — optionnel.

Le contexte `Général` est déjà connu : ne jamais redemander « Équipe ou Projet ? ».

Création atomique : conteneur + premier message + personnes concernées + pièces jointes.

## 6.2 Depuis un Projet

Même formulaire, mais le projet est déjà connu.

Ne jamais demander à l'utilisateur de sélectionner de nouveau le projet depuis `Projet > Messages`.

## 6.3 Depuis un message existant

Action : `Créer une discussion à partir de ce message`.

Le message source reste à sa place.

La nouvelle Discussion conserve un lien traçable vers le message source et affiche un bloc `Point de départ`.

Le message source affiche en retour un lien vers la Discussion créée.

Ne pas déplacer silencieusement le message et ne pas dupliquer son contenu comme s'il avait été réécrit par un autre utilisateur.

## 6.4 Personnes concernées

Par défaut :

- créateur = concerné + suit ;
- personnes explicitement sélectionnées = concernées + suivent ;
- personnes mentionnées dans le premier message = suivent automatiquement ;
- autres lecteurs autorisés = peuvent consulter mais ne sont pas automatiquement considérés comme concernés.

Une personne peut ensuite `Suivre` ou `Ne plus suivre` sans changer ses droits d'accès.

---

# 7. Projet > Messages

## 7.1 Destination correcte

`Projet > Messages` ouvre un **espace de communication du projet**, pas seulement le fil Général.

Il montre :

- Général du projet ;
- Discussions actives ;
- Discussions suivies par l'utilisateur en priorité ;
- Résolues en accès secondaire ;
- fils de Réunion récents rattachés au projet en accès contextuel.

## 7.2 Pas de dossier manuel

Le Projet est déjà le dossier métier.

Ne jamais ajouter une couche « dossier de messages » au-dessus ou en dessous des projets.

## 7.3 Externalisation / invités — extension V4 à traiter explicitement

Un projet pouvant contenir des invités externes, V4 ne doit pas laisser croire qu'un message « Projet » est nécessairement interne.

Règle cible à valider avant mise en production avec Guests :

- aucune visibilité par message individuel ;
- la confidentialité se décide au niveau de la Discussion ;
- si un projet contient des invités, l'UI doit distinguer clairement les Discussions **internes** et celles **partagées** ;
- un changement vers une audience plus large exige une confirmation d'impact ;
- une personne externe ne doit jamais gagner accès via `personne concernée` / `suivre`.

Cette extension doit rester invisible dans les projets sans invité pour ne pas alourdir le cas courant.

---

# 8. Privé

## 8.1 Deux formes seulement

- direct 1:1 ;
- groupe privé.

Dans le CTA global, les regrouper sous `Nouveau message privé`, puis choisir une ou plusieurs personnes.

Ne pas présenter « Message privé » et « Groupe privé » comme deux architectures séparées.

## 8.2 Liaison à un projet

Un privé peut être lié à un projet pour donner du contexte.

Cette liaison ne modifie jamais les lecteurs du privé.

Tous les participants doivent déjà pouvoir lire le projet pour créer ce lien.

---

# 9. Réunions

Une discussion de Réunion ne doit pas être créée depuis `Nouvelle conversation`.

Elle est créée / ouverte depuis l'objet Réunion.

Parcours :

`Agenda / Réunion → discussion associée`.

Le fil apparaît ensuite dans Messages si l'utilisateur y participe, mais Réunion reste le propriétaire du contexte.

Pendant une réunion active, l'appel associé peut être rejoint depuis le fil. Hors contexte de réunion, ne pas traiter la conversation comme un groupe privé générique.

---

# 10. Attention, non-lus et notifications

## 10.1 Ne pas confondre visible et urgent

Un utilisateur peut avoir accès à 20 Discussions sans devoir recevoir 20 notifications.

V4 distingue :

- **visible** — autorisé à consulter ;
- **non lu** — contenu que l'utilisateur n'a pas lu ;
- **suivi** — discussion dont il souhaite suivre l'activité ;
- **attention** — événement qui mérite une notification personnelle.

## 10.2 Ce qui entre dans À suivre

Au minimum :

- messages privés non lus ;
- mentions ;
- réponses directes à un message de l'utilisateur ;
- activité nouvelle dans une Discussion suivie ;
- annonces ;
- demandes/validations issues d'une conversation lorsqu'elles requièrent son action.

Un simple message dans une Discussion accessible mais non suivie ne doit pas polluer À suivre.

## 10.3 Réponse

Répondre à un message doit notifier l'auteur du message source, sauf si l'utilisateur a explicitement coupé ce type de notification.

Le système V3 ne le fait pas aujourd'hui : V4 doit le corriger.

## 10.4 Mention naturelle

Le composer doit reconnaître `@Nom` avec autocomplete.

La sélection de mention ne doit pas dépendre d'une liste de cases cachée derrière un bouton séparé.

Si quelqu'un écrit simplement « Fred, » sans utiliser une mention, l'UI ne doit pas prétendre qu'une notification a été envoyée.

## 10.5 Annonces

Une annonce signifie « information importante pour tout le contexte ».

Cible :

- Général équipe : owner/admin ;
- Général projet : lead/admin selon les droits ;
- pas d'annonce globale dans une Discussion ordinaire ;
- pas d'annonce dans un privé.

---

# 11. Appels

## 11.1 Direct 1:1

`Appeler` peut appeler directement l'autre personne.

## 11.2 Groupe privé

`Appeler le groupe` appelle les membres explicitement choisis.

## 11.3 Général / Projet / Discussion

Ne jamais appeler implicitement tous les lecteurs autorisés.

CTA : `Appeler…` ouvre une sélection des personnes éligibles, préremplie avec les personnes concernées lorsque cela est pertinent.

## 11.4 Réunion

L'appel de Réunion suit les participants de la réunion, pas les lecteurs génériques d'une conversation.

---

# 12. Cycle de vie d'une Discussion

États utiles :

- `active`
- `resolved`

Une Discussion résolue :

- quitte les listes actives ;
- reste retrouvable par recherche et dans Résolues ;
- conserve tout son historique ;
- affiche le résultat / objets créés si disponibles ;
- ne reprend pas silencieusement son activité.

Pour écrire de nouveau dans une Discussion résolue : `Rouvrir la discussion` explicitement.

Général ne peut jamais être résolu.

Direct et Réunion ne suivent pas ce cycle de vie « sujet ».

---

# 13. Transformation des échanges en travail

Le point différenciant de 2b2c n'est pas seulement de chatter : c'est de transformer une conversation utile en objet de travail traçable.

## 13.1 Menu secondaire

Sous un message :

`… → Transformer en…`

Cibles selon contexte et droits :

- Action
- Demande
- Décision
- Idée
- Discussion

Ne montrer que les transformations pertinentes.

## 13.2 Action

Action exige un Projet cible.

Si le message vient déjà d'un Projet, le projet est prérempli.

Si l'audience destination est plus large, confirmation explicite conservée.

## 13.3 Demande

Demande cible une personne qui peut lire la source.

Le message source reste la provenance.

## 13.4 Décision

Une décision doit être rattachée au bon niveau : workspace ou projet selon le cas.

Ne jamais transformer automatiquement une simple opinion en décision : l'utilisateur confirme le titre et le contexte.

## 13.5 Idée — intégration essentielle avec Idea Engine

Une discussion générale peut révéler une idée de futur projet.

Le workflow cible n'est pas :

`Discussion → créer directement un Projet`.

Il est :

`Discussion → Créer une Idée → Idea Engine → décision explicite → GO éventuel → Projet`.

Cela préserve l'invariant **Idea ≠ Project**.

`Créer une idée à partir de cette discussion` :

- ne supprime pas la discussion ;
- propose les messages / documents à utiliser comme RAW/source ;
- préremplit une description sans remplacer la parole humaine ;
- conserve la provenance vers la conversation et les messages sources ;
- ouvre l'Idea Workspace ;
- affiche ensuite dans la Discussion un lien vers l'Idée et son état ;
- après GO, relie le Projet créé sans copier silencieusement un historique vers une audience plus large.

C'est le parcours recommandé pour le cas réel « on discute d'abord de l'approche générale, puis certaines idées deviennent des projets validés ».

---

# 14. Pièces jointes, Documents et Fichiers

## 14.1 Attachement ≠ Ressource ≠ Livrable

- pièce jointe de message = document contextualisé dans une conversation ;
- Ressource = élément de travail volontairement conservé dans un Projet ;
- Livrable = sortie officielle, versionnée et éventuellement validée.

Ne pas convertir automatiquement toute pièce jointe en Ressource.

## 14.2 Retrouvabilité

La page Fichiers doit pouvoir retrouver les pièces jointes de Messages avec leur contexte source.

Le runtime V3 actuel ne charge dans Fichiers que `project_resources` et `deliverables` : V4 doit corriger la promesse « retrouver tous les fichiers ».

Filtres cibles :

- Ressources
- Livrables
- Pièces jointes

## 14.3 Promotion vers Ressource

Depuis une pièce jointe d'une Discussion Projet :

`Ajouter aux ressources du projet`.

Créer une Ressource traçable vers la pièce jointe source ; ne pas déplacer ni casser le message historique.

Depuis Général / Idée : permettre de rattacher le document à l'Idée lorsqu'une Idée est créée.

---

# 15. Recherche et retrouvabilité

La recherche Communication doit trouver :

- texte des messages ;
- titres de Discussions ;
- noms de pièces jointes ;
- projets ;
- personnes ;
- Discussions résolues ;
- objets liés (Action / Demande / Décision / Idée) au minimum via leur relation visible.

Le moteur V3 cherche essentiellement le contenu des messages ; V4 ne doit pas appeler cela une recherche globale complète tant que les titres et pièces jointes sont absents.

Résultats toujours filtrés par droits de lecture actuels.

---

# 16. Temps réel et brouillons

Le brouillon doit survivre :

- réception de nouveaux messages ;
- changement de focus ;
- navigation aller-retour raisonnable ;
- reconnexion courte.

Ne jamais suspendre la réception des nouveaux messages simplement parce que le composer a le focus.

Cible : mise à jour incrémentale / Realtime des messages + état de brouillon indépendant du rendu de la conversation.

Si la synchro temps réel tombe, afficher un état contrôlé + Retry sans perdre le brouillon.

---

# 17. Permissions et invariants de sécurité

1. Ajouter une personne concernée ou un follower n'accorde jamais d'accès.
2. Une Discussion Team hérite de l'accès Team interne.
3. Une Discussion Projet hérite du Projet, avec extension Internal/Shared explicitement conçue avant usage Guest.
4. Un privé garde une audience explicite immuable sauf workflow de changement dédié.
5. Une Réunion suit son créateur/participants autorisés.
6. Une mention cible uniquement quelqu'un pouvant déjà lire la source.
7. Toute transformation vers un objet plus visible exige confirmation d'élargissement.
8. L'auteur/source historique reste traçable.
9. Les pièces jointes respectent la même audience que leur message source tant qu'elles ne sont pas promues ailleurs.
10. Le frontend ne décide jamais seul d'une audience effective ; le serveur/RLS reste autorité.

---

# 18. Migration non destructive depuis V3

Objectif : corriger le modèle sans perdre l'historique.

## 18.1 Général existant

Les conversations `is_general=true` restent les Général canoniques.

## 18.2 Sujets V3 existants

Les conversations `kind=team/project`, `is_general=false` deviennent des Discussions enfants du Général correspondant.

Backfill :

- Team topic → Général Team du workspace ;
- Project topic → Général du même projet.

Aucun message n'est déplacé.

## 18.3 Privés / Réunions

Conservent leur identité et historique.

## 18.4 conversation_members

Conserver comme structure historique de lecture / prefs / accès là où elle est déjà utilisée.

Ne pas lui faire porter la nouvelle sémantique « personne concernée ».

Créer une structure d'attention séparée afin de ne pas mélanger sécurité et suivi utilisateur.

---

# 19. Modèle de données cible minimal — candidate

Sans imposer encore les noms SQL finaux :

### conversations

Ajouter au minimum :

- `parent_conversation_id` pour Discussion sous Général/Projet ;
- `source_message_id` optionnel pour Discussion créée depuis message ;
- métadonnée structurelle permettant de distinguer clairement Général / Discussion / Direct / Réunion sans détourner `kind` de sa fonction historique d'accès.

### conversation_attention_members

Nouvelle relation non autorisante :

- conversation_id
- user_id
- role = `participant | follower`
- added_by
- created_at

Cette table n'accorde aucun droit de lecture.

### provenance / links

Prévoir une relation traçable Discussion ↔ Idea / Project / Action / Decision lorsque ces objets sont créés depuis les échanges.

Éviter une multiplication de colonnes `idea_id`, `action_id`, `decision_id` si une relation générique contrôlée est plus cohérente.

---

# 20. Workflows de référence à tester

## W1 — Test réel Fred / Cédric dans Général

1. Cédric écrit dans Général.
2. Toute l'équipe peut lire.
3. S'il souhaite attirer Fred, il saisit `@Fred` et Fred reçoit une mention.
4. L'échange reste transverse tant qu'il est court.
5. S'il devient un thème durable : `Créer une discussion à partir de ce message`.
6. Fred + Cédric peuvent être personnes concernées, sans rendre le sujet privé.
7. Les autres membres gardent le droit de consulter.

## W2 — Nouvelle discussion générale

1. Général → Nouvelle discussion.
2. titre + premier message + personnes concernées.
3. création atomique.
4. destinataires concernés reçoivent l'attention adaptée.
5. autres membres voient la Discussion sans notification intrusive.

## W3 — Discussion projet

1. Projet → Messages.
2. voir Général + Discussions.
3. Nouvelle discussion.
4. Projet déjà prérempli.
5. résoudre quand terminé.

## W4 — Idée issue d'une discussion

1. Discussion générale mûrit.
2. `Transformer en → Idée`.
3. sélection de contenu/source.
4. Idea Engine reprend RAW + provenance.
5. décision plus tard.
6. Projet uniquement après GO.

## W5 — Document partagé dans une discussion

1. pièce jointe envoyée.
2. visible dans le fil.
3. retrouvable dans Fichiers > Pièces jointes.
4. si projet : peut devenir Ressource.
5. l'original reste dans le fil.

## W6 — Appel depuis discussion

1. Discussion visible à 10 personnes mais 2 concernées.
2. Appeler…
3. sélecteur prérempli avec ces 2 personnes.
4. aucune invitation envoyée aux 8 autres sans action explicite.

## W7 — Résolution

1. objectif de Discussion atteint.
2. Résoudre.
3. disparaît des actives.
4. reste recherchable.
5. écrire de nouveau exige Rouvrir.

## W8 — Réponse

1. Fred répond au message de Cédric.
2. Cédric reçoit une notification de réponse même sans @mention.
3. pas de double notification si réponse + mention génèrent le même événement utile.

## W9 — Projet avec invité externe

1. Projet contient membres internes + Guest.
2. l'UI montre explicitement ce qui est Interne vs Partagé.
3. aucune Discussion interne n'est lisible par le Guest.
4. aucune sélection « personne concernée » ne peut contourner cela.

## W10 — Mobile

1. ouvrir Messages.
2. entrer dans Général.
3. commencer un brouillon.
4. recevoir un message entrant.
5. le voir sans perdre le brouillon.
6. revenir à la liste puis revenir au fil avec brouillon préservé.

---

# 21. Anti-patterns interdits

- liste plate unique de toutes les conversations ;
- dossier manuel de discussions alors que Projet existe déjà ;
- Sujet proposé au même niveau que Privé / Réunion ;
- audience = participants ;
- notification de toute activité à toute personne autorisée ;
- mass-call implicite depuis Général/Projet ;
- projet redemandé alors que l'utilisateur est déjà dans le Projet ;
- Discussion créée sans premier message ;
- per-message privacy au sein d'un même fil partagé ;
- déplacement silencieux d'un message source ;
- copie silencieuse d'une discussion privée vers un Projet ;
- création directe de Projet depuis une discussion qui contourne Idea Engine ;
- trois boutons Action/Demande/Décision sous chaque message ;
- faux temps réel qui se désactive pendant la saisie ;
- recherche dite globale qui ignore titres et pièces jointes ;
- pièces jointes introuvables depuis Fichiers.

---

# 22. Slices d'implémentation recommandées

## Slice C0 — corrections V3 immédiates sans changer le modèle

- navigation correcte après création ;
- route `#/messages` vide réellement la sélection ;
- ne jamais afficher Résoudre sur Général ;
- empêcher mass-call implicite sur Team/Project ;
- réponse → notification ;
- mention UX naturelle préparée.

## Slice C1 — hiérarchie Général/Projet → Discussion

- parent explicite ;
- backfill des sujets existants ;
- navigation projet avec Général + Discussions ;
- création Discussion atomique avec premier message.

## Slice C2 — attention séparée de l'accès

- participants/followers ;
- À suivre ;
- notification rules ;
- unread vs attention distincts.

## Slice C3 — discussion depuis message + résolution propre

- source_message_id / provenance ;
- lien bidirectionnel ;
- actif/résolu ;
- recherche des résolues.

## Slice C4 — transformations cohérentes

- menu Transformer en… ;
- Action / Demande / Décision ;
- Idée → Idea Engine ;
- liens de provenance.

## Slice C5 — fichiers / recherche

- pièces jointes dans Fichiers ;
- promotion en Ressource ;
- recherche titres + pièces jointes + résolues.

## Slice C6 — vrai temps réel

- flux incrémental ;
- brouillons indépendants ;
- reconnexion / fallback ;
- E2E multi-session.

## Slice C7 — Guests / Internal vs Shared

À implémenter seulement après validation UX/sécurité dédiée, mais avant de prétendre que Communication Projet est prête pour collaboration client complète.

---

# 23. Critères de réussite produit

Une personne découvrant 2b2c doit pouvoir, sans explication :

- comprendre la différence Général / Projet / Privé ;
- créer une Discussion sans choisir une taxonomie technique ;
- savoir qui peut lire vs qui est concerné ;
- retrouver les Discussions d'un Projet depuis ce Projet ;
- comprendre pourquoi elle reçoit une notification ;
- ne jamais appeler un groupe entier par erreur ;
- faire émerger une Idée d'une discussion sans créer prématurément un Projet ;
- retrouver un document partagé ;
- transformer un échange en objet de travail sans perdre sa source ;
- reprendre une discussion plusieurs jours plus tard sans parcourir un flux infini.

Le test produit de référence est simple : **Messages doit réduire le travail de classement, pas en créer.**

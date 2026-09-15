# 2b2c — Audit produit Communication / Général / Sujets — 2026-09-16

## Statut

**AUDIT + proposition cible — non figé / non implémenté.**

Cet audit part du test réel effectué dans `Général` avec deux membres internes et confronte le comportement observé à la promesse produit 2b2c, au runtime Communication V3, au backend Supabase et aux gates UX existantes.

Il ne modifie pas encore le contrat de production. Son objectif est d'empêcher une correction locale qui conserverait un mauvais modèle mental.

## Conclusion exécutive

Le problème n'est pas un simple défaut visuel de `Général`.

Le modèle Communication V3 mélange aujourd'hui **quatre axes différents** dans le même objet et dans la même UI :

1. **audience / confidentialité** — équipe, projet, privé ;
2. **contexte de travail** — workspace, projet, réunion ;
3. **forme de conversation** — général, sujet, direct, groupe ;
4. **attention** — qui doit réellement suivre ou répondre.

Le résultat fonctionne techniquement mais n'est pas assez évident pour un usage réel. Le mot **Sujet** est particulièrement trompeur : dans le runtime actuel, un Sujet n'est pas un sujet imbriqué dans `Général` ou dans un projet ; c'est une **nouvelle conversation top-level** de `kind=team` ou `kind=project`.

La correction cible doit donc être structurelle : **Général / Projet / Privé / Réunion sont les contextes ; un Sujet est une discussion structurée à l'intérieur de Général ou d'un Projet.**

## 1. Observation du test réel

Dans la production actuelle, l'échange récent dans `Général` est stocké comme un message `format=chat` ordinaire dans la conversation permanente `Général` de l'équipe.

Aucun objet Sujet distinct n'a été créé pour cet échange.

Ce point est important : le premier usage réel n'a pas naturellement conduit les utilisateurs vers le mécanisme `Sujet`, alors qu'il est censé servir précisément à structurer les échanges. C'est un signal produit, pas une erreur utilisateur.

`Général` lui-même a une sémantique cohérente : il est permanent et accessible à l'ensemble des membres internes actifs. Il doit rester le lieu des échanges réellement transverses à l'équipe.

En revanche, `Général` ne doit pas être interprété comme une discussion privée « avec Cédric ». Si l'échange doit être privé, le bon objet est un direct/groupe privé. Si l'échange doit rester visible à l'équipe mais mobiliser principalement deux personnes, le produit doit distinguer **visibilité** et **participants concernés** — ce qu'il ne sait pas faire aujourd'hui.

## 2. Défauts P1 — modèle mental / logique produit

### P1.1 — `Sujet` est présenté comme un type de conversation alors qu'il est un niveau inférieur

Le menu `Nouvelle conversation` propose actuellement :

- Message privé ;
- Groupe privé ;
- Sujet ;
- Réunion.

Ces choix ne sont pas du même niveau conceptuel :

- Message privé / Groupe privé = audience ;
- Sujet = structure d'une discussion ;
- Réunion = contexte synchronisé avec Agenda.

Le sous-formulaire Sujet redemande ensuite `Projet` ou `Équipe`, ce qui démontre que `Sujet` n'est pas réellement une audience autonome.

**Décision cible :** `Sujet` doit être créé depuis un contexte `Général` ou `Projet`, pas présenté comme un cinquième contexte global.

### P1.2 — un Sujet d'équipe ajoute toute l'équipe, pas les personnes réellement concernées

`create_team_topic_v2` ajoute tous les membres internes actifs à `conversation_members`; les futurs membres internes sont également synchronisés dans tous les fils `kind=team` actifs.

Cette logique est correcte pour la **visibilité**, mais elle est utilisée comme si elle représentait aussi les **participants**.

Conséquences :

- impossible de dire « ce sujet concerne principalement Fred + Cédric » tout en le laissant consultable par l'équipe ;
- l'en-tête affiche l'audience comme si elle était la liste des participants ;
- le bouton Appeler utilise tous les `conversation_members` et peut donc appeler toute l'équipe ;
- aucune distinction entre lecteur autorisé, participant, suiveur et personne mentionnée.

**Décision cible :** conserver l'audience héritée du contexte, mais ajouter une notion séparée de **participants / suiveurs**.

### P1.3 — les Sujets sont plats, pas réellement rattachés à Général / Projet dans l'IA

Un sujet Team et `Général` sont tous deux `kind=team`.
Un sujet Projet et le fil Général du projet sont tous deux `kind=project`.

Le frontend n'affiche aucun parent et la liste globale mélange les fils par activité.

**Décision cible :** un Sujet doit avoir un parent explicite :

- `Général équipe` ; ou
- `Général du projet X`.

### P1.4 — Project > Messages ouvre toujours le Général et perd la structure des sujets

Le routeur projet recherche la conversation `is_general=true` et redirige systématiquement vers elle.

Les sujets projet éventuels ne constituent donc pas une vraie navigation projet. Il faut revenir dans la liste globale Messages pour les retrouver.

**Décision cible :** `Projet > Messages` doit ouvrir le **contexte Messages du projet** avec `Général + sujets actifs`, pas seulement une conversation unique.

### P1.5 — « Résolu » n'a aujourd'hui presque aucune conséquence UX

Les conversations `resolved` sont encore chargées (`status != archived`), restent mélangées aux conversations actives et aucun état résolu n'est rendu dans les lignes de liste.

La résolution n'organise donc pas le travail.

**Décision cible :** un Sujet résolu quitte la liste active, reste retrouvable/recherchable et peut être rouvert.

### P1.6 — les réglages de Général exposent une action interdite par le backend

Le frontend propose `État du sujet = Actif / Résolu` à toute conversation non-directe gérable, y compris `Général`.

Le backend interdit cependant de résoudre un Général avec `GENERAL_TOPIC_IS_PERMANENT`.

**Décision cible :** Général n'est pas un Sujet et ne doit jamais afficher un contrôle de résolution.

### P1.7 — le bouton Appeler est dangereux dans les contextes collectifs

`Appeler` appelle actuellement tous les membres de la conversation.

Pour un Sujet Team, cela correspond à toute l'équipe ; pour un Sujet Projet, potentiellement à toute l'audience projet.

**Décision cible :**

- direct 1:1 : appel direct autorisé ;
- groupe privé : appel du groupe explicite ;
- Général / Sujet / Projet : `Appeler…` ouvre un sélecteur ou utilise seulement les participants explicitement concernés ; jamais de mass-call implicite.

## 3. Défauts P1 — parcours réel / bugs fonctionnels

### P1.8 — après création d'une nouvelle conversation, la navigation peut rebondir

Les formulaires Direct / Groupe / Sujet / Réunion changent immédiatement le hash vers le nouvel ID.

Mais `state.conversations` n'est pas rechargé avant `loadConversation()`. Pour une conversation nouvellement créée, `conversationById(id)` peut donc retourner `null`, ce qui redirige vers `#/messages`.

C'est un défaut de parcours direct et peut rendre la création d'un Sujet incompréhensible.

**Correction minimale obligatoire même avant refonte :** après une création, recharger le workspace ou injecter atomiquement la nouvelle conversation avant navigation.

### P1.9 — la route `#/messages` ne vide pas explicitement la conversation courante

Quand aucun `conversationId` n'est présent, `state.current` peut rester l'ancien fil. Route et rendu peuvent donc diverger, particulièrement sur mobile.

### P1.10 — le « temps réel » se coupe précisément quand l'utilisateur est dans le composer

Communication V3 sonde le digest toutes les 8 s, mais `probeSync()` s'arrête si le formulaire de composition contient le focus ou un brouillon.

Cela protège le texte saisi contre un re-render, mais signifie aussi que deux personnes en train d'écrire peuvent ne pas voir les nouveaux messages tant qu'elles restent dans le composer.

**Décision cible :** utiliser une mise à jour temps réel des messages qui préserve le brouillon, plutôt que suspendre la réception.

## 4. Défauts P2 — usages manquants

### P2.1 — création d'un Sujet sans premier message

Le formulaire crée seulement le conteneur et ouvre ensuite un fil vide.

Un Sujet utile doit être créé avec :

- titre ;
- premier message / contexte ;
- participants concernés ;
- parent Général/Projet ;
- création atomique.

### P2.2 — impossible de créer un Sujet depuis un message existant

Dans un Général qui commence à dériver vers un thème précis, l'action naturelle est :

`Créer un sujet à partir de ce message`.

Aujourd'hui les transformations disponibles sont Action / Demande / Décision, mais pas Sujet.

### P2.3 — impossible de faire évoluer proprement une discussion générale vers un projet

Le cas réel attendu est :

`discussion générale → idée validée → projet créé → discussion projet`.

Aujourd'hui un Sujet Team ne peut pas devenir ou engendrer proprement un Sujet Projet avec traçabilité. Il faut recréer manuellement le contexte.

**Décision cible :** action contrôlée `Créer une discussion projet depuis ce sujet`, avec lien vers le sujet source et prévisualisation de l'impact d'audience. Ne jamais copier automatiquement un historique privé vers une audience plus large.

### P2.4 — les actions Message → Action / Demande / Décision sont trop visibles

Trois boutons de transformation sont affichés sous presque chaque message, y compris les messages conversationnels ordinaires.

Cela surcharge l'usage de base.

**Décision cible :** regrouper ces transformations sous `…` / `Transformer en…` ou les rendre contextuelles.

### P2.5 — aucune vraie distinction abonnement / visibilité / mention

Le produit possède `notification_level`, mentions et non-lus, mais pas de notion claire de « Je suis ce sujet » ou « Ce sujet me concerne ».

**Décision cible :** la visibilité vient du contexte ; le suivi/attention vient des participants/suiveurs ; la mention reste ponctuelle.

## 5. Architecture cible recommandée

### 5.1 Contextes de Communication — seulement quatre

1. **Général équipe** — interne, transverse, permanent ;
2. **Projet** — hérite exactement de l'accès projet ;
3. **Privé** — 1:1 ou groupe explicite ;
4. **Réunion** — dérivé d'une réunion, pas créé manuellement comme un Sujet.

Cette liste correspond au contrat UX existant « audiences distinctes : équipe, projet, privé, réunion ».

### 5.2 Le Sujet devient une discussion enfant

Un Sujet est une discussion structurée sous :

- Général équipe ; ou
- un Projet.

Contrat minimal :

- `parent_conversation_id` explicite ;
- titre ;
- premier message atomique ;
- créateur ;
- état `active / resolved` ;
- participants/suiveurs explicites séparés de l'audience ;
- timestamps / dernière activité / non-lus ;
- lien possible vers un Sujet source lors d'une promotion vers un projet.

Le modèle actuel `conversations` peut être conservé de manière additive : les conversations Team/Project non-générales deviennent des enfants de leur Général respectif.

### 5.3 Audience et attention sont deux objets différents

**Audience** = qui a le droit de lire.

- Sujet Team : tous les membres internes autorisés ;
- Sujet Projet : tous les utilisateurs ayant accès au projet ;
- Privé : membres explicites ;
- Réunion : créateur + participants de la réunion.

**Participants / suiveurs** = qui est principalement concerné et doit recevoir l'attention par défaut.

Créer une table dédiée de type `conversation_participants` / `topic_followers` plutôt que détourner `conversation_members`, déjà utilisé pour l'accès, la lecture et les notifications.

### 5.4 Navigation cible

#### Messages global

- **À lire** : non-lus / mentions / annonces ;
- **Général** ;
- **Projets** regroupés par projet ;
- **Privés** ;
- réunions récentes/contextuelles sans les transformer en faux « sujets ».

Éviter une seule liste plate de toutes les conversations.

#### Général

- Fil Général permanent ;
- bouton `Nouveau sujet` ;
- Sujets actifs ;
- Sujets résolus repliés/consultables.

#### Projet > Messages

- Général du projet ;
- Sujets actifs du projet ;
- Sujets résolus ;
- création `Nouveau sujet` héritant automatiquement du projet courant.

### 5.5 Création contextuelle

Depuis Général :

`Nouveau sujet` → Titre + premier message + personnes concernées.

La visibilité est déjà connue : **Équipe interne**. Ne pas reposer la question.

Depuis un Projet :

`Nouveau sujet` → Titre + premier message + personnes concernées parmi les lecteurs du projet.

La visibilité est déjà connue : **accès du projet**.

Depuis Messages global :

le `+` peut proposer :

- Discussion d'équipe ;
- Discussion projet ;
- Message privé ;
- Groupe privé.

Ne pas proposer `Réunion` ici : un fil de réunion doit provenir de la réunion elle-même.

### 5.6 Appel

- Direct : appeler la personne ;
- Groupe privé : appeler les membres du groupe ;
- Sujet / Général / Projet : ouvrir un sélecteur prérempli avec les participants du sujet ;
- Réunion : appeler les participants selon la logique de réunion/appel.

## 6. Ce qu'il ne faut pas ajouter

Pour rester cohérent avec la promesse de simplicité :

- pas de dossiers manuels dans Messages ; les Projets sont déjà l'organisation métier ;
- pas de système de channels configurable façon Slack ;
- pas de tags arbitraires avant preuve du besoin ;
- pas de forum + chat + canal + thread comme quatre modèles simultanés ;
- pas de reactions/pins/gadgets avant d'avoir validé le modèle Général → Sujet → Projet ;
- pas de duplication de documents dans la conversation : un message peut référencer une Ressource, la Ressource reste l'objet canonique.

## 7. Ordre d'implémentation recommandé

### Slice C1 — sécurité UX immédiate

- corriger navigation après création ;
- ne plus proposer Résolu sur Général ;
- empêcher le mass-call implicite depuis Team/Project ;
- distinguer visuellement Général et Sujet ;
- rendre le statut résolu utile ou le masquer temporairement.

### Slice C2 — hiérarchie Sujet

- migration additive `parent_conversation_id` ;
- RPC de création Sujet atomique avec premier message ;
- migration/compatibilité des éventuels Team/Project non-généraux existants ;
- navigation Général/Projet → Sujets.

### Slice C3 — participants / suivi

- participants/suiveurs séparés de l'audience ;
- notifications adaptées ;
- appel sur participants explicites ;
- `Suivre / Ne plus suivre`.

### Slice C4 — continuité du travail

- `Créer un sujet à partir de ce message` ;
- `Créer une discussion projet depuis ce sujet` avec lineage et garde-fou d'audience ;
- lien Discussion ↔ Ressource / Action / Décision sans dupliquer l'objet canonique.

### Slice C5 — temps réel et historique

- réception temps réel préservant le brouillon ;
- pagination/historique au-delà des 300 messages ;
- indicateur nouveaux messages sans re-render destructif.

## 8. Critères d'acceptation produit

Le modèle corrigé est acceptable si un utilisateur peut répondre sans réfléchir à :

1. **Où suis-je ?** Général, Projet, Privé ou Réunion.
2. **Qui peut lire ?** Visible explicitement sans déduire des rôles techniques.
3. **Qui est concerné ?** Participants/suiveurs distincts des lecteurs.
4. **Comment créer un nouveau sujet ici ?** Une action locale, pas un choix global abstrait.
5. **Comment retrouver un sujet d'un projet ?** Depuis le Projet > Messages.
6. **Comment terminer un sujet ?** Résoudre le retire des actifs sans le perdre.
7. **Comment passer d'une discussion générale à un projet ?** Une continuité guidée et traçable.
8. **Qui vais-je appeler ?** Jamais une audience entière par surprise.
9. **Est-ce privé ?** Privé signifie audience explicite ; Général/Projet ne prétendent jamais l'être.
10. **Que se passe-t-il si je transforme un message en Action/Décision ?** La source reste traçable et l'impact d'audience reste contrôlé.

## Décision proposée

**Ne pas continuer à enrichir Communication V3 sur son modèle de Sujet actuel.**

Conserver les briques techniques déjà solides — RLS, audiences, directs, pièces jointes, mentions, recherche, transformations traçables — mais remplacer la logique de Sujet top-level par une hiérarchie contextuelle et une séparation audience / participants.

Le test réel montre que cette correction doit précéder toute nouvelle fonctionnalité de messagerie.
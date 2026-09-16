# 2b2c — Communication V4 — Product & Workflow Contract V0.3

## Statut

**CANDIDATE STRUCTUREL CONSOLIDÉ — remplace V0.2 comme cible de travail, non implémenté.**

Sources :
- `COMMUNICATION_TOPICS_PRODUCT_AUDIT_20260916.md`
- `COMMUNICATION_V4_RED_TEAM_20260916.md`
- `COMMUNICATION_V4_PRODUCT_WORKFLOW_CONTRACT_V0_2.md`
- `COMMUNICATION_V4_WIREFRAME_LOGIC_V0_1.md`
- `COMMUNICATION_V4_SCENARIO_STRESS_TEST_20260916_V2.md`

V0.3 conserve la structure V0.2 mais simplifie l'attention, réutilise le modèle `conversation_members.notification_level`, précise lecture, autorité, migration et comportement en présence d'invités.

---

# 1. Promesse produit

Messages doit permettre à une petite équipe de :

- parler immédiatement sans devoir classer avant de parler ;
- structurer seulement quand un échange devient durable ;
- savoir où l'échange vit et qui peut le lire ;
- distinguer lecteurs autorisés et personnes réellement concernées ;
- retrouver messages et pièces jointes ;
- transformer un échange en Action, Demande, Décision ou Idée sans perdre sa provenance.

**Messages réduit le travail de classement ; il n'en crée pas.**

2b2c ne doit pas reproduire la complexité de Slack/Discord/Teams.

---

# 2. Modèle mental utilisateur

L'utilisateur ne doit apprendre que quatre contextes et un seul niveau de structuration.

## Contextes

1. **Général** — équipe interne, transverse, permanent.
2. **Projet** — communication rattachée à un projet.
3. **Privé** — une ou plusieurs personnes explicitement choisies.
4. **Réunion** — fil dérivé d'une réunion.

## Structure

**Discussion** = thème précis sous Général ou sous un Projet.

Pas de Discussion dans une Discussion. Pas de threads récursifs.

`Répondre` cite un message dans le même fil.

---

# 3. Les quatre notions qui ne doivent jamais être confondues

## 3.1 Peut lire

Droit de sécurité hérité de l'équipe, du Projet, du privé ou de la Réunion.

## 3.2 Personne concernée

Personne pour laquelle la Discussion est directement pertinente.

- ne donne jamais accès ;
- doit déjà pouvoir lire ;
- suit automatiquement la Discussion à son ajout.

## 3.3 Suivre

Préférence individuelle de communication.

V4 réutilise `conversation_members.notification_level` :

- `all` = Suivre ;
- `mentions` = Mentions et réponses seulement ;
- `muted` = Silencieux.

Aucune table follower séparée.

## 3.4 @Mention

Signal ponctuel d'attention.

Une mention ne modifie jamais l'abonnement permanent.

---

# 4. Politique d'attention

## 4.1 Cloche globale

Réservée aux interruptions explicites :

- @mention ;
- réponse personnelle ;
- annonce ;
- appel ;
- Demande / validation métier exigeant l'utilisateur.

Une nouvelle activité ordinaire d'une Discussion suivie ne crée pas une notification cloche par message.

## 4.2 Badge Messages

Compte les conversations nécessitant attention, pas tous les messages accessibles.

Entre dans le badge :

- privé/groupe privé non lu ;
- @mention ;
- réponse personnelle ;
- annonce ;
- activité non lue d'une conversation `notification_level='all'`.

Un non-lu passif sur une conversation `mentions` reste visible dans son contexte sans polluer le badge.

## 4.3 À suivre

Une ligne par conversation.

Priorité de raison affichée :

1. Annonce ;
2. Mention ;
3. Réponse ;
4. Privé ;
5. Discussion suivie.

Home reste l'agrégateur cross-domain ; Messages > À suivre reste limité à la communication.

---

# 5. Général équipe

Général est le lieu des échanges transverses, questions rapides et idées encore trop floues pour mériter leur propre Discussion.

- permanent ;
- jamais résolu ;
- visible à tous les membres internes actifs ;
- niveau de notification par défaut = `mentions`, pas `all`.

Un message normal peut créer un non-lu discret sur Général mais ne doit pas augmenter le badge Messages de toute l'équipe.

Actions principales :

- écrire ;
- joindre ;
- @mention inline ;
- répondre ;
- Nouvelle discussion ;
- continuer un message dans une Discussion ;
- menu secondaire.

Pas de boutons permanents Action / Demande / Décision sous chaque message.

---

# 6. Discussion

## 6.1 Création neuve

Depuis Général ou Projet :

- titre obligatoire ;
- premier message obligatoire ;
- personnes concernées optionnelles ;
- pièces jointes optionnelles.

Le contexte est déjà connu et n'est pas redemandé.

Création atomique.

## 6.2 Création depuis un message

- titre obligatoire ;
- `source_message_id` obligatoire ;
- note d'ouverture optionnelle ;
- personnes concernées optionnelles.

Le message source reste dans son fil et s'affiche comme `Point de départ` dans la Discussion.

Le même message source ne peut générer qu'une Discussion principale V4. Si elle existe déjà, l'action devient `Ouvrir la discussion`.

## 6.3 Quand une Discussion existe déjà

Sous le message source : carte compacte vers la Discussion.

`Répondre` devient prioritairement `Continuer dans la discussion`; `Répondre ici quand même` reste secondaire.

## 6.4 Suivi automatique

Passent à `notification_level='all'` :

- créateur ;
- personnes concernées ajoutées ;
- utilisateur qui envoie son premier message/réponse dans cette Discussion.

Une @mention seule ne suit pas.

Retirer quelqu'un des concernés ne le désabonne pas automatiquement.

---

# 7. Autorité sur une Discussion

## Team Discussion

Peuvent renommer, gérer les personnes concernées, résoudre/rouvrir :

- créateur ;
- owner/admin workspace.

## Project Discussion

Peuvent gérer :

- créateur ;
- project lead ;
- owner/admin workspace.

Les autres lecteurs peuvent écrire/répondre/suivre selon droits.

Pas de suppression dure d'une Discussion contenant du contenu en V4 core.

---

# 8. Résoudre / rouvrir

Applicable uniquement aux Discussions.

`active → resolved → active`.

Résolue :

- retirée des listes actives ;
- toujours recherchable ;
- historique et provenance conservés ;
- composer désactivé ;
- aucune nouvelle attention tant qu'elle reste résolue.

Général n'affiche jamais Résoudre.

---

# 9. Projet > Messages

`Projet > Messages` est un espace de communication du Projet, pas une redirection vers son Général.

Landing :

- Général du Projet ;
- Discussions actives ;
- suivies en priorité ;
- récentes ensuite ;
- Réunions récentes si utiles ;
- Résolues secondaire.

Niveau de notification par défaut pour les membres héritant de l'accès projet : `mentions`.

Écrire dans Général Projet ne force pas un abonnement permanent à tout le fil. Une réponse personnelle assure la continuité ; l'auto-follow à l'écriture est réservé aux Discussions structurées.

Aucun dossier manuel de Messages : le Projet est déjà le dossier métier.

---

# 10. Projet avec invité externe

V4 core ne prétend pas encore fournir des Discussions `internal/shared` au sein d'un même Projet.

Une Discussion Projet hérite donc exactement de l'audience actuelle du Projet.

Si des Guests ont accès, l'UI doit l'indiquer explicitement :

`Visible par les membres de Projet X, dont N invité(s) externe(s)`.

Ajouter une personne concernée n'accorde jamais l'accès.

La future distinction Internal/Shared reste une gate backend/RLS/UX/E2E séparée.

---

# 11. Privé

Un seul CTA : `Nouveau privé`.

- 1 personne = direct ;
- plusieurs = groupe privé ;
- nom du groupe optionnel si plusieurs.

Les participants ont `notification_level='all'` par défaut et peuvent mettre en sourdine.

Modifier l'audience d'un groupe existant n'est pas supporté en V4 core : créer un nouvel objet est plus sûr que réécrire l'historique d'audience.

Lier au Projet ajoute du contexte uniquement ; jamais de lecteurs supplémentaires.

---

# 12. Réunion

Création uniquement depuis Agenda / Meeting workflow.

Messages ouvre le fil déjà lié.

Le contexte Réunion gouverne :

- participants ;
- appel ;
- Avant / Live / Après.

Pas de création Réunion dans Messages.

---

# 13. Mentions et réponses

## @Mention

Autocomplete inline dans le texte.

`Fred,` n'est pas une mention et ne génère pas de notification.

## Réponse

Répondre à un message crée une attention pour son auteur, sauf `muted`.

Réponse + mention + suivi doivent être dédupliqués en un seul signal d'attention équivalent.

---

# 14. Annonces

Annonce = communication importante destinée à l'ensemble du contexte.

Autorisées :

- Général équipe — owner/admin ;
- Général Projet — project lead / owner/admin selon droits.

Une personne en `mentions` reçoit les annonces. Une personne en `muted` n'est pas interrompue.

Pas d'annonce comme mécanisme global dans une Discussion ordinaire, un Privé ou un fil Réunion générique.

---

# 15. Appels

- direct 1:1 → appel immédiat ;
- groupe privé → appel du groupe explicite ;
- Général / Projet / Discussion → `Appeler…` ouvre toujours un sélecteur ;
- les personnes concernées ne sont qu'un préremplissage ;
- si aucune personne concernée, aucun mass-call déduit de l'audience ;
- Réunion → participants de la Réunion.

L'utilisateur voit la liste finale avant émission d'un appel collectif.

---

# 16. Lecture et non-lus

`conversation chargée` ≠ `conversation lue`.

Le système avance la lecture au dernier message seulement si :

- la conversation est active ;
- la page est visible ;
- l'utilisateur a atteint la zone des nouveaux messages / bas du fil.

Deep-link vers ancien message :

- positionne sur le message ciblé ;
- garde les messages postérieurs non lus ;
- affiche `N nouveaux messages` ;
- `Aller aux nouveaux` conduit au seuil de lecture.

Preview/prefetch ne marque jamais lu.

---

# 17. Brouillons

Brouillon découplé du rendu du fil.

Clé locale : `user_id + workspace_id + conversation_id`.

- texte uniquement ;
- pas de Blob persisté ;
- TTL cible 7 jours ;
- survit à réception message, navigation courte, clavier mobile, reconnexion courte ;
- effacé après envoi réussi ;
- effacé après perte d'accès ;
- jamais visible entre deux comptes.

---

# 18. Temps réel

La réception ne doit jamais être suspendue parce que le composer a le focus.

Cible :

- mise à jour incrémentale de la conversation active ;
- mise à jour légère de l'activité workspace ;
- fallback contrôlé.

Si l'utilisateur est en bas, nouveaux messages peuvent être affichés sans rupture.

S'il lit plus haut : `N nouveaux messages`, sans déplacer le viewport.

---

# 19. Transformer en…

Accessible dans `…`, contextuel.

## Général

- Continuer dans une Discussion ;
- Créer une Idée ;
- Créer une Demande ;
- Enregistrer une Décision workspace si autorisé.

## Discussion Team

- Créer une Idée ;
- Créer une Demande ;
- Décision workspace si autorisée.

## Projet / Discussion Projet

- Action ;
- Demande ;
- Décision.

`Créer une Idée` y reste secondaire et signifie une nouvelle initiative distincte du Projet courant.

## Réunion

Action / Décision via workflow Meeting.

Ne jamais afficher une option impossible juste pour la griser.

---

# 20. Discussion → Idée → Projet

Parcours canonique pré-projet :

`Général → Discussion → Idée → Idea Engine → décision → GO éventuel → Projet`.

`Créer une Idée` ne copie pas toute la Discussion par défaut.

L'utilisateur choisit explicitement :

- titre ;
- description de départ ;
- messages sources ;
- pièces jointes sources.

Le RAW utilisateur de l'Idée reste séparé ; les éléments sélectionnés deviennent provenance/source.

Aucun Projet direct depuis une Discussion pré-projet.

---

# 21. Pièces jointes, Fichiers, Ressources

**Pièce jointe ≠ Ressource ≠ Livrable.**

Une pièce jointe :

- reste attachée au message ;
- hérite de l'accès de la conversation ;
- peut être retrouvée dans Fichiers via un filtre `Pièces jointes` ;
- V4 core recherche nom/métadonnées, pas nécessairement contenu intégral.

Dans un Projet : `Ajouter aux ressources du projet` crée une Ressource distincte avec provenance vers attachment/message source.

---

# 22. Recherche

Recherche sous droits actuels uniquement.

Doit trouver :

- texte message ;
- titre Discussion ;
- Projet ;
- personne ;
- nom de pièce jointe ;
- Discussions résolues ;
- liens visibles vers Action/Demande/Décision/Idée.

Perte d'accès = disparition immédiate des résultats correspondants.

---

# 23. Data model minimal cible

Conserver `conversations.kind` pour compatibilité et autorisation.

## conversations

Ajouter :

- `parent_conversation_id` — uniquement pour Discussion enfant du Général Team/Projet ;
- `source_message_id` — optionnel ; unique pour une Discussion issue d'un message.

Règles déterministes :

- parent doit être `is_general=true` et `kind in ('team','project')` ;
- parent et enfant ont le même workspace ;
- pour Projet : même `project_id` ;
- un enfant ne peut être parent d'un autre enfant ;
- direct/context n'ont jamais de parent ;
- `is_general=true` implique `parent_conversation_id is null`.

## conversation_members

Conserver comme source de lecture + préférence individuelle.

`notification_level` V4 : all / mentions / muted.

## conversation_focus_members

Nouvelle relation minimale :

- conversation_id ;
- user_id ;
- added_by ;
- created_at.

Ne confère jamais accès.

---

# 24. RPC/workflows cibles

Minimum serveur :

- `create_discussion_v1` — création atomique + premier message ou source ;
- `set_discussion_focus_members_v1` — contrôle accès + autorité ;
- `set_conversation_follow_v1` — all/mentions/muted pour soi ;
- `resolve_discussion_v1` ;
- `reopen_discussion_v1` ;
- projection/listing Messages V4 regroupant attention/contextes ;
- recherche V4 incluant titres/pièces jointes sous droits courants.

Le navigateur ne doit pas pouvoir créer un enfant incohérent par writes directs.

---

# 25. Migration V3 → V4

Non destructive.

- Général existant reste Général ;
- Team/Project non-general existant devient Discussion enfant du Général correspondant ;
- messages/directs/réunions inchangés ;
- lecture conservée ;
- nouveaux lecteurs hérités Team/Project obtiennent `mentions` ;
- pour Discussions existantes : créateur et auteurs historiques peuvent être `all`, autres `mentions` ;
- directs restent `all` ;
- Réunions restent gérées par leur workflow.

Les valeurs historiques `all` issues du défaut V3 ne doivent pas être traitées comme preuve certaine d'un choix utilisateur explicite.

---

# 26. Scénario de référence Fred/Cédric

1. Cédric écrit dans Général.
2. Toute l'équipe peut lire ; pas de badge obligatoire pour tous.
3. `Fred,` seul ne notifie pas.
4. `@Fred` crée une attention explicite.
5. L'échange devient durable → `Continuer dans une discussion`.
6. Fred et Cédric peuvent être indiqués comme concernés ; ils suivent la Discussion.
7. Les autres membres peuvent lire sans être bruyamment abonnés.
8. Le message source garde le lien vers la Discussion.
9. Si cette Discussion devient une initiative → `Créer une Idée` avec sélection des sources.
10. Projet uniquement après le workflow Idea Engine et GO.

---

# 27. Gate avant code

V0.3 n'autorise pas encore l'implémentation production tant que ne sont pas produits/validés :

1. Data & Security Contract ;
2. E2E Acceptance Matrix ;
3. Wireframe Logic V0.2 intégrant attention/lecture ;
4. plan de migration SQL avec rollback ;
5. vérification spécifique Guest ;
6. plan de cutover V3 → V4 sans suppression des fallbacks avant E2E authentifiés.

**Décision : GO conception détaillée / NO-GO production code pour l'instant.**
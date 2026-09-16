# 2b2c — Communication V4 — Data & Security Contract V0.1

## Statut

**CANDIDATE TECHNIQUE — non implémenté.**

Autorité produit cible : `COMMUNICATION_V4_PRODUCT_WORKFLOW_CONTRACT_V0_3.md`.

Ce document traduit la logique utilisateur V4 en invariants serveur. Il part du backend production existant : `conversations`, `conversation_members`, `messages`, `mentions`, `notifications`, `attachments`, RLS + RPC Communication V3.

Principe : **aucune simplification UI ne doit affaiblir l'isolation d'audience existante.**

---

# 1. Invariants de sécurité

1. Un utilisateur ne lit jamais une conversation qu'il ne peut pas lire aujourd'hui selon les règles workspace/project/direct/meeting.
2. `Personnes concernées`, `Suivre`, @mention et réponse ne confèrent jamais l'accès.
3. Une Discussion Team/Project hérite exactement de l'audience de son parent/context tant que la future gate Internal/Shared n'est pas active.
4. Une perte d'accès Projet retire immédiatement lecture, recherche et accès aux pièces jointes associées.
5. Aucun write browser générique ne peut fabriquer une Discussion avec parent/source incohérents.
6. Les changements structurants Discussion passent par RPC déterministes ; les préférences personnelles peuvent rester self-service sous RLS.
7. Les transformations Message → Action/Demande/Décision/Idée conservent la provenance et les garde-fous d'expansion d'audience.
8. Les anciens chemins V3 restent compatibles pendant cutover mais ne doivent pas permettre de contourner les invariants V4.

---

# 2. `conversations` — extensions minimales

Ajouter :

```text
parent_conversation_id uuid null
source_message_id uuid null
```

FK proposées :

- `parent_conversation_id → conversations(id) ON DELETE RESTRICT` ;
- `source_message_id → messages(id) ON DELETE SET NULL` ou conservation de référence logique via source tombstone selon politique finale ;
- index partiel unique sur `source_message_id` lorsqu'il n'est pas null pour empêcher les duplications de Discussion issue d'un même message.

## Shape V4

### Général Team

- `kind='team'`
- `is_general=true`
- `parent_conversation_id is null`
- `project_id is null`

### Général Projet

- `kind='project'`
- `is_general=true`
- `parent_conversation_id is null`
- `project_id not null`

### Discussion Team

- `kind='team'`
- `is_general=false`
- `parent_conversation_id` = Général Team
- `project_id is null`

### Discussion Projet

- `kind='project'`
- `is_general=false`
- `parent_conversation_id` = Général du même Projet
- `project_id` identique au parent

### Direct / Réunion

- `parent_conversation_id is null`
- `source_message_id is null` pour V4 core.

## Invariants cross-row

À faire respecter par trigger/RPC, pas uniquement frontend :

- parent doit être `is_general=true` ;
- parent `kind` = enfant `kind` ;
- même `workspace_id` ;
- pour project : même `project_id` ;
- parent ne doit pas lui-même avoir de parent ;
- un Général ne peut pas avoir de parent ;
- un direct/context ne peut pas avoir de parent ;
- source message doit appartenir au parent Général pour V4 core ;
- source message et Discussion doivent appartenir au même workspace ;
- parent/source immuables après création.

Étendre `validate_conversation_update_v2` ou introduire une version V4 qui bloque toute mutation de `parent_conversation_id` / `source_message_id` hors workflow autorisé.

---

# 3. `conversation_members` — conserver, ne pas dupliquer

Cette table reste la relation technique de :

- audience matérialisée lorsque nécessaire ;
- dernier lu ;
- préférence individuelle ;
- hidden/muted legacy.

`notification_level` existe déjà avec :

- `all` ;
- `mentions` ;
- `muted`.

## Sémantique V4

- `all` = Suivre ;
- `mentions` = Mentions/réponses/annonces seulement ;
- `muted` = silencieux.

Ne pas créer de table follower concurrente.

## Defaults V4

- Team General / Project General : `mentions` pour membres hérités ;
- Discussion : lecteurs hérités = `mentions` ; créateur + concernés = `all` ;
- Direct/groupe privé = `all` ;
- Meeting = politique actuelle Meeting, par défaut `all` pour participants actifs.

## Auto-follow dans Discussion

À l'envoi du premier message de l'utilisateur dans une Discussion :

- `mentions → all` ;
- `all` inchangé ;
- `muted` reste `muted` : une action d'écriture ne doit pas annuler un choix explicite de silence.

---

# 4. `conversation_focus_members` — nouvelle relation

Table candidate :

```text
conversation_id uuid not null
user_id uuid not null
added_by uuid not null
created_at timestamptz not null default now()
primary key (conversation_id, user_id)
```

FK cascade sur conversation ; FK profil sur user/added_by.

## Règles

- uniquement pour une Discussion V4 (`parent_conversation_id is not null`) ;
- l'utilisateur ciblé doit déjà pouvoir lire la Discussion ;
- ne confère jamais l'accès ;
- ajout peut promouvoir `mentions → all`, jamais `muted → all` ;
- retrait ne modifie pas `notification_level` ;
- quand un utilisateur perd l'accès au parent, les focus rows correspondantes sont supprimées ou rendues inactives par synchronisation déterministe.

## RLS

SELECT uniquement si `user_can_access_conversation_v2(conversation_id, auth.uid())`.

Pas d'INSERT/UPDATE/DELETE générique navigateur. Mutation via RPC autorisé seulement.

---

# 5. RPC `create_discussion_v1`

Deux modes exclusifs.

## Mode NEW

Entrées :

- parent_general_conversation_id ;
- title ;
- first_body ;
- focus_user_ids[] ;
- mentioned_user_ids[] ;
- attachments metadata.

## Mode FROM_MESSAGE

Entrées :

- parent_general_conversation_id ;
- source_message_id ;
- title ;
- opening_note nullable ;
- focus_user_ids[] ;
- attachments éventuels pour opening_note.

## Validations serveur

- auth obligatoire ;
- parent accessible et writable ;
- parent est Général Team/Project ;
- title non vide/borné ;
- source appartient au parent et n'est pas supprimée au moment de création ;
- aucune autre Discussion ne référence déjà la source ;
- tous les focus users peuvent déjà lire le parent ;
- pièces jointes respectent storage path/audience rules ;
- aucune expansion d'audience implicite.

## Transaction

1. créer conversation enfant ;
2. matérialiser membership héritée avec default `mentions` ;
3. passer créateur/focus à `all` sauf préférence muted préexistante pertinente ;
4. insérer focus rows ;
5. créer first message si NEW ou opening_note si FROM_MESSAGE ;
6. enregistrer mentions/attachments ;
7. retourner projection minimale de la Discussion créée.

Tout ou rien. Aucun conteneur vide si NEW échoue.

---

# 6. RPC focus / suivi

## `set_discussion_focus_members_v1`

Autorité :

### Team
- créateur ;
- owner/admin workspace.

### Project
- créateur ;
- project lead ;
- owner/admin workspace.

Le serveur valide chaque cible contre l'audience courante.

## `set_conversation_follow_v1`

Pour soi uniquement.

Valeurs UX :

- `follow` → `all` ;
- `mentions` → `mentions` ;
- `mute` → `muted`.

Peut être un RPC ou un UPDATE self strictement borné ; préférer RPC pour contrat explicite et audit.

---

# 7. Résolution

Créer des workflows dédiés :

- `resolve_discussion_v1` ;
- `reopen_discussion_v1`.

Ils doivent refuser :

- General ;
- direct ;
- meeting/context ;
- flat legacy conversation sans parent après cutover final.

Même matrice d'autorité que gestion focus.

Une Discussion resolved reste SELECT/recherche autorisée selon audience, mais `send_message` doit refuser tant qu'elle n'est pas rouverte.

---

# 8. Envoi message V4

`send_message_v3` peut rester base, mais V4 doit ajouter/garantir :

- refus d'écrire dans Discussion resolved ;
- auto-follow Discussion sur participation sauf `muted` ;
- mentions inline traduites en IDs côté client mais revalidées serveur ;
- reply attention ;
- déduplication des notifications de même message/utilisateur ;
- attachments atomiques conservés.

Une version `send_message_v4` ou helper partagé peut être préférable à l'empilement de triggers opaques.

---

# 9. Attention et notifications

## Principe

Une même combinaison `user + message` ne doit pas produire trois notifications parce qu'elle est à la fois :

- reply ;
- mention ;
- announcement.

Créer/adapter un helper serveur d'upsert de notification message avec priorité :

`announcement > mention > reply`.

La notification cloche est créée pour `all` ou `mentions`, jamais `muted`.

L'activité ordinaire d'une conversation `all` alimente À suivre / badge Messages mais n'exige pas une ligne `notifications` pour chaque message.

## Réponse

Un message avec `reply_to_id` crée une attention pour l'auteur de la source si :

- ce n'est pas lui-même ;
- il peut toujours lire la conversation ;
- sa préférence n'est pas `muted`.

---

# 10. Projection `Messages > À suivre`

Préférer un RPC/read model dédié plutôt que des agrégations divergentes dans le navigateur.

Une ligne par conversation :

- conversation_id ;
- context kind user-facing ;
- title ;
- project/context label ;
- highest_attention_reason ;
- relevant_unread_count ;
- last_relevant_message ;
- last_activity_at ;
- is_followed ;
- has_external_guest indicator si project context.

Le read model doit respecter l'accès courant à chaque appel.

---

# 11. Lecture V4

Remplacer la logique `p_seen_at=now()` pilotée par simple chargement par une borne serveur liée à un message effectivement vu.

RPC candidate :

`mark_conversation_read_v4(p_conversation_id, p_seen_message_id)`.

Le serveur :

- vérifie accès ;
- vérifie que le message appartient à la conversation et n'est pas futur/supprimé hors règles ;
- résout son `created_at` ;
- avance monotoniquement `last_read_at` jusqu'à cette borne, jamais au-delà.

Le navigateur appelle seulement quand le message seuil est réellement atteint dans une conversation active/visible.

---

# 12. Recherche V4

Read model/RPC sous droits courants.

Minimum V4 core :

- body/subject message ;
- conversation/discussion title ;
- project label ;
- participant/profile display name si autorisé ;
- attachment filename ;
- resolved discussions.

Perte d'accès doit retirer immédiatement les résultats.

Pas d'indexation du contenu binaire des pièces jointes dans V4 core.

---

# 13. Attachments et promotion Ressource

Attachments restent liés aux messages et protégés par accès au message/conversation.

Créer un workflow `promote_attachment_to_project_resource_v1` :

- utilisateur doit lire le message source ;
- doit pouvoir écrire le Projet cible ;
- workspace cohérent ;
- expansion d'audience explicitement contrôlée si nécessaire ;
- crée une Ressource distincte ;
- conserve provenance `source_type='message_attachment'` + source ids selon schéma disponible/candidat.

Ne jamais muter l'attachment en Ressource.

---

# 14. Discussion → Idée

Workflow serveur/adapter distinct, compatible Idea Engine RAW/provenance.

Ne pas injecter toute la conversation comme RAW unique.

Entrées explicites :

- title ;
- human description ;
- selected_message_ids ;
- selected_attachment_ids.

Le serveur vérifie que l'acteur peut lire chaque source au moment de la transformation.

Si destination Idea expose le contenu à une audience plus large que la source, preview + confirmation explicite avant copie/liaison visible.

---

# 15. Realtime

Le temps réel ne modifie jamais les règles d'accès : la subscription doit rester user-scoped / RLS-compatible.

Cible logique :

- conversation active : message INSERT/UPDATE pertinent ;
- activité workspace : signal léger permettant de rafraîchir listes/badges ;
- reconnect/fallback si abonnement indisponible.

Le composer/draft est un état client séparé et ne doit jamais être remplacé par un refresh de projection.

---

# 16. Draft security

Le draft local :

- clé inclut user/workspace/conversation ;
- texte seulement ;
- TTL ;
- effacement à logout/changement de compte ;
- effacement sur `CONVERSATION_ACCESS_DENIED` persistant ;
- pas de synchronisation cross-user par défaut.

---

# 17. Migration V3 → V4

Migration SQL doit être idempotente/rejouable en validation et posséder rollback.

Étapes candidates :

1. ajouter colonnes nullable + index/FK ;
2. backfill parent pour Team/Project non-general existants ;
3. ajouter focus table + RLS ;
4. installer RPC/guards V4 ;
5. modifier sync membership defaults pour Team/Project en `mentions` ;
6. migrer préférence legacy de General/topic avec règle documentée ;
7. garder direct/meeting inchangés ;
8. activer frontend V4 derrière gate ;
9. ne supprimer aucun fallback V3 avant E2E multi-user.

## Règle de préférence legacy

La production observée contient actuellement uniquement `notification_level='all'` dans les memberships Communication. Comme `all` est la valeur par défaut historique, cette donnée ne prouve pas un choix explicite.

Migration candidate :

- General Team/Project hérités → `mentions` ;
- Discussion existante → créateur + auteurs historiques `all`, autres `mentions` ;
- direct → `all` ;
- meeting → conserver.

Valider sur copie/transaction avant production.

---

# 18. Tests sécurité obligatoires

Avant activation :

1. impossible de créer une Discussion sous un direct/meeting ;
2. impossible de créer un enfant d'une Discussion ;
3. impossible de pointer une source d'un autre workspace/contexte ;
4. source message unique ;
5. focus user sans accès rejeté ;
6. focus n'accorde aucun SELECT ;
7. perte d'accès Projet retire Discussion/recherche/attachment ;
8. Guest ne voit jamais plus que l'audience Projet actuelle ;
9. resolved bloque send ;
10. non-manager ne peut resolve/rename/focus-manage ;
11. self follow ne peut changer membership d'un autre ;
12. mark-read ne peut avancer avec message d'une autre conversation ;
13. notification dedup ;
14. muted ne reçoit pas de notification Communication ;
15. transformations conservent les garde-fous d'audience.

---

# 19. Décision

**GO POUR PLAN SQL/RED-TEAM, NO-GO MIGRATION PRODUCTION à ce stade.**

Le prochain livrable requis est l'E2E Acceptance Matrix V4 puis le plan de migration/cutover exécutable.
# 2b2c — Communication V4 — C1 backend red-team V0.1

## Statut

**REVUE CONTRADICTOIRE DU CANDIDAT SQL C1 V0.1 — ne pas appliquer V0.1.**

Source auditée : `docs/communication-v4/sql/COMMUNICATION_V4_C1_FOUNDATION_CANDIDATE_V0_1.sql`.

Objectif : chercher les incohérences de lifecycle, privilèges, RLS, migration et atomicité avant toute DDL production.

## Décision

Le modèle général est viable, mais **V0.1 ne doit pas être appliqué**. Une V0.2 est requise avant test transactionnel.

### RT-C1-01 — FK parent et suppression Projet/Workspace

Le contrat initial proposait `parent_conversation_id ... ON DELETE RESTRICT`.

Problème : les conversations Projet sont elles-mêmes supprimées par cascade depuis `projects`. Un parent Général et ses Discussions peuvent donc être supprimés dans la même opération. `RESTRICT` crée un risque de bloquer le lifecycle parent légitime.

Décision V0.2 : `ON DELETE CASCADE` sur le parent Conversation. La permanence de Général est contrôlée par les workflows, pas par une FK qui casserait la suppression du Projet/Workspace.

### RT-C1-02 — `added_by` et suppression de compte

`profiles.id` est lié à `auth.users(id) ON DELETE CASCADE` en production.

Un `conversation_focus_members.added_by NOT NULL` sans stratégie de suppression pourrait empêcher la suppression d'un profil qui a ajouté d'autres personnes comme concernées.

Décision V0.2 : `added_by` devient nullable avec `ON DELETE SET NULL`. La ligne de focus reste attachée à la personne concernée ; l'auteur historique peut devenir inconnu après suppression de compte.

### RT-C1-03 — C1 doit être réellement dormant

Accorder `EXECUTE` au `service_role` n'est pas utile pour les RPC user-scoped qui dépendent de `auth.uid()`. Un token service-role n'est pas une session utilisateur normale.

Décision V0.2 : révoquer `EXECUTE` à `PUBLIC`, `anon`, `authenticated` **et `service_role`**. Les fonctions existent mais ne sont pas appelables via l'API. Les tests SQL peuvent simuler un JWT utilisateur dans une transaction contrôlée. C4 accordera explicitement `authenticated` après E2E.

### RT-C1-04 — Policy idempotency

`CREATE POLICY` sans `DROP POLICY IF EXISTS` rend le candidat non rejouable dans un environnement de validation.

Décision V0.2 : drop/recreate explicite de la policy SELECT focus.

### RT-C1-05 — Pièces jointes de la première Discussion

Le stockage Message actuel exige un chemin contenant `conversation_id`. Or la Discussion n'existe pas encore lorsque le client doit uploader le fichier.

Il serait faux de prétendre à une création `Discussion + premier message + pièce jointe` atomique sans protocole de préallocation/upload temporaire.

Décision V0.2/C1 : `create_discussion_v1` reste **text-only**. Les pièces jointes d'ouverture sont hors C1 jusqu'au design C4 Storage. Le produit ne doit pas annoncer cette capacité avant résolution.

### RT-C1-06 — Titre réservé `Général`

Le trigger production `default_general_conversation_v2()` transforme automatiquement toute conversation Team/Project intitulée `Général` en `is_general=true`.

Une Discussion enfant portant ce titre serait ensuite rejetée par le shape guard, mais avec une erreur indirecte.

Décision V0.2 : rejet explicite `DISCUSSION_TITLE_RESERVED` avant INSERT.

### RT-C1-07 — Default notifications des futurs membres

Le trigger V3 `sync_new_conversation_members_v1` crée encore les memberships avec le default historique `all`.

Le RPC C1 peut corriger les membres présents à la création vers `mentions`, mais un membre ajouté plus tard recevrait encore `all` tant que C2 n'a pas modifié les synchronisations.

Décision : **aucune activation utilisateur de C1 avant C2**. C1 reste backend dormant ; C2 est responsable du changement déterministe des defaults et du backfill.

### RT-C1-08 — Source message race

Deux créations concurrentes depuis le même message doivent produire au plus une Discussion.

Décision : conserver l'index unique partiel sur `source_message_id`. Le check fonctionnel améliore le message d'erreur, mais l'index reste l'autorité de race.

### RT-C1-09 — Focus ne doit jamais accorder l'accès

La table focus ne doit pas être une ACL parallèle.

Décision : aucun write générique `authenticated`; validation serveur exige que la cible puisse déjà lire la Discussion ; la policy SELECT dépend de l'accès Conversation courant. La suppression de `conversation_members` supprime le focus correspondant.

### RT-C1-10 — Discussion résolue et ancien `send_message_v3`

Installer `resolve_discussion_v1` sans empêcher le vieux send RPC d'écrire dans une Discussion résolue créerait deux vérités contradictoires.

Décision : le guard Message est installé dès C1, mais sa nouvelle règle ne s'applique qu'aux conversations avec `parent_conversation_id IS NOT NULL`. Aucun fil V3 existant n'est affecté.

### RT-C1-11 — Auto-follow et préférence `muted`

Écrire dans une Discussion peut promouvoir `mentions -> all`, mais ne doit jamais annuler un `muted` explicite.

Décision : trigger auto-follow uniquement si le niveau courant est `mentions`.

### RT-C1-12 — Read boundary

`mark_conversation_read_v4` doit borner la lecture par un message appartenant réellement à la Conversation, puis réutiliser les effets de nettoyage mention/notification de V3 avec le timestamp de ce message.

Décision V0.2 : conserver cette délégation bornée ; aucun `now()` produit par simple ouverture.

## Gate avant DDL production

V0.2 doit passer au minimum :

1. revue textuelle des grants/RLS ;
2. compile PostgreSQL réelle ;
3. transaction de fixtures Owner/Member/Guest avec rollback ;
4. tests parent/source cross-workspace ;
5. duplication source concurrente ;
6. focus sans accès rejeté ;
7. resolved bloque `send_message_v3` ;
8. follow ne peut pas accorder l'accès ;
9. suppression profil `added_by` ne bloque pas ;
10. suppression Projet/Workspace ne bloque pas les FK parent.

Aucune preuve statique ne suffit pour promouvoir C1 en production.
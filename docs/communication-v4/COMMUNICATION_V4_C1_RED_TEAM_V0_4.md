# 2b2c — Communication V4 — C1 backend red-team V0.4

## Statut

**REVUE DU CANDIDAT READ-CURSOR V0.4 — GO POUR TEST TRANSACTIONNEL, PAS ENCORE CERTIFIÉ.**

Source : `docs/communication-v4/sql/COMMUNICATION_V4_C1_READ_CURSOR_HARDENING_CANDIDATE_V0_4.sql`.

## 1. Pourquoi le tuple `(created_at,id)`

PostgreSQL `now()` est stable pendant une transaction. Plusieurs messages peuvent donc posséder exactement le même `created_at`.

V4 définit un ordre total unique et reproductible :

`created_at ASC, id ASC`.

L'UUID n'est pas présenté comme l'ordre physique réel ; il sert uniquement de tie-breaker déterministe. Le renderer, le read model et le RPC de lecture devront employer exactement ce même ordre.

## 2. Double curseur assumé pendant le cutover

- `last_read_at` reste conservé pour compatibilité V3 ;
- `last_read_message_id` devient l'autorité d'exactitude V4.

Cette duplication est temporairement acceptable parce que C1 est dormant. C2 devra initialiser un curseur exact avant d'exposer une conversation legacy dans le renderer V4.

## 3. Protection contre write navigateur

Le candidat étend le trigger existant de `conversation_members` :

- identité Conversation/User reste immuable ;
- un curseur non-null ou modifié nécessite le GUC transactionnel V4 ;
- le message du curseur doit appartenir à la même Conversation ;
- un `SET NULL` provoqué par suppression physique du message est toléré uniquement si l'ancien message n'existe déjà plus.

Le RLS self-update existant ne suffit donc pas à fabriquer un curseur V4.

## 4. FK et lifecycle

La FK curseur utilise `ON DELETE SET NULL` et possède un index côté référent.

Gate de test obligatoire : suppression physique d'un message de fixture avec curseur doit réussir et remettre le curseur à null sans permettre le même changement manuel tant que le message existe.

## 5. Notifications exactes

V0.4 ne délègue plus à `mark_conversation_read_v3`.

Les mentions sont acquittées uniquement si leur message est `<= (seen_created_at,seen_id)`.

Les notifications mention/announcement sont acquittées uniquement quand leur route correspond exactement à un message de cette Conversation situé avant ou au curseur. Une notification d'un message ultérieur doit rester non lue.

## 6. Premier message d'une Discussion

Le test V0.3 a révélé un second effet de `now()` transactionnel : le trigger V3 créait les memberships avec `last_read_at=now()` avant le premier message, ce qui pouvait masquer le premier message comme déjà lu.

V0.4 remet donc le read state de la **nouvelle Discussion seulement** à null avant d'insérer le premier message.

Cela ne touche aucun fil V3 existant.

## 7. Cas legacy sans curseur exact

Si un fil possède seulement un `last_read_at` V3 plus tardif que le message vu, V0.4 refuse de régresser le timestamp. Ce n'est pas une solution de migration : C2 devra calculer/figer un `last_read_message_id` avant activation V4 sur les fils existants.

## 8. Points à prouver avant application

1. DDL compile ;
2. write direct du curseur rejeté ;
3. RPC V4 peut avancer le curseur ;
4. RPC ne peut pas régresser `(created_at,id)` ;
5. égalité de timestamp distinguée par UUID ;
6. unread exact respecte le même tuple ;
7. mention future non acquittée ;
8. notification future non acquittée ;
9. hard-delete fixture met cursor null sans bloquer ;
10. nouvelle Discussion expose son premier message comme non-lu aux autres lecteurs ;
11. toute la transaction de test rollbacke sans fixture persistante.

## Décision

Le candidat V0.4 est suffisamment cohérent pour être **testé**, mais ne doit être certifié qu'après ces preuves. Les RPC V4 restent révoqués de tous les rôles API pendant toute la validation.
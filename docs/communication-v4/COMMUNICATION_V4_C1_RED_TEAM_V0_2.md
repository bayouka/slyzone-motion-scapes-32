# 2b2c — Communication V4 — C1 backend red-team V0.2

## Statut

**SECONDE PASSE — V0.2 SQL non applicable ; V0.3 requise.**

Cette passe reprend `COMMUNICATION_V4_C1_FOUNDATION_CANDIDATE_V0_2.sql` après les corrections du premier red-team.

## Nouveau défaut bloquant — C2 backfill impossible

Le guard V0.2 rend `parent_conversation_id` et `source_message_id` totalement immuables dès C1 :

```text
UPDATE parent/source différent → DISCUSSION_LINEAGE_IMMUTABLE
```

Or C2 doit précisément transformer les anciens `Team/Project topic` plats en Discussions enfants du Général correspondant. Installer C1 puis rendre ce backfill impossible forcerait C2 à supprimer le trigger ou à affaiblir temporairement la protection.

### Décision V0.3

Le guard conserve l'immuabilité par défaut, mais autorise une exception **uniquement sous un GUC transactionnel de migration** :

`app.communication_v4_lineage_migration = '1'`.

Ce flag n'est pas exposé par une API utilisateur. C2 pourra faire :

1. `set_config(..., '1', true)` dans sa transaction de migration ;
2. backfill contrôlé ;
3. assertions ;
4. fin de transaction → flag disparu automatiquement.

Le guard V4 continue ensuite à valider le parent, workspace, kind, project et source après la modification.

## Durcissement privilèges table focus

V0.2 révoque `anon` et les writes `authenticated`, puis accorde SELECT à `authenticated`. Pour rendre l'intention indépendante des default privileges Supabase, V0.3 doit d'abord :

`REVOKE ALL ... FROM PUBLIC, anon, authenticated`

puis accorder uniquement SELECT à `authenticated`.

## Duplication source — UX + race

L'index unique reste l'autorité de concurrence. V0.3 ajoute aussi un précheck `DISCUSSION_SOURCE_ALREADY_USED` pour donner une erreur métier stable dans le cas non concurrent. En course réelle, l'index reste la dernière barrière.

## Décision

- V0.1 : rejetée.
- V0.2 : rejetée avant DDL.
- V0.3 : prochaine candidate consolidée.

Aucune migration Communication V4 C1 n'a encore été appliquée en production.
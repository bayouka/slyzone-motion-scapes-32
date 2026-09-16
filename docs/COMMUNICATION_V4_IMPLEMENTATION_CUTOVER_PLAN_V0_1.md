# 2b2c — Communication V4 — Implementation & Cutover Plan V0.1

## Statut

**CANDIDATE D'EXÉCUTION — non appliqué.**

Autorités :
- `COMMUNICATION_V4_PRODUCT_WORKFLOW_CONTRACT_V0_3.md`
- `COMMUNICATION_V4_DATA_SECURITY_CONTRACT_V0_1.md`
- `COMMUNICATION_V4_WIREFRAME_LOGIC_V0_2.md`
- `COMMUNICATION_V4_E2E_ACCEPTANCE_MATRIX_V0_1.md`

Objectif : passer de Communication V3 à V4 sans big-bang, sans perte d'historique et sans affaiblir les audiences.

---

# 1. Principe de cutover

Ne pas réécrire tout Messages d'un coup.

Ordre :

`C0 sécurité UX actuelle → C1 fondation backend dormante → C2 projection/read model V4 → C3 renderer parallèle → C4 workflows structurants → C5 realtime/drafts → C6 intégrations → C7 cutover → C8 nettoyage après E2E`.

Chaque slice doit :

- être rollbackable ;
- préserver V3 tant que V4 n'est pas certifié ;
- avoir tests déterministes ;
- ne pas annoncer une capacité non active.

---

# 2. C0 — Correctifs immédiats V3 sans migration

But : supprimer les erreurs de parcours dangereuses observées sans prétendre avoir livré V4.

## C0.1 Navigation après création

Après création Direct/Groupe/Sujet/Réunion :

- recharger/injecter `state.conversations` avant `loadConversation` ;
- ouvrir l'objet créé ;
- ne jamais rebondir vers `#/messages` parce que l'état local est obsolète.

## C0.2 Route Messages home

Quand route `#/messages` n'a pas d'ID :

- `state.current=null` ;
- aucun ancien fil ne reste visible par accident.

## C0.3 Général permanent

- ne pas afficher contrôle Résoudre/Actif pour `is_general=true` ;
- backend `GENERAL_TOPIC_IS_PERMANENT` reste garde-fou final.

## C0.4 Appels collectifs

Sur `kind=team/project` :

- remplacer appel immédiat de tous les `conversation_members` par un sélecteur/confirmation ;
- direct/groupe privé inchangés ;
- réunion reste workflow participants.

## C0.5 Transformations visuelles

Regrouper Action/Demande/Décision sous `…` / `Transformer en…` si possible sans toucher aux RPC.

### Gate C0

- syntax check ;
- browser smoke desktop/mobile ;
- test réel Owner+Member sur Général ;
- aucun changement backend.

---

# 3. C1 — Fondation backend V4 dormante

Migration additive, non activée par UI.

## Schema

- `conversations.parent_conversation_id` nullable ;
- `conversations.source_message_id` nullable ;
- `conversation_focus_members` ;
- indexes/FK ;
- cross-row guard trigger V4.

## RPC dormants

- `create_discussion_v1` ;
- `set_discussion_focus_members_v1` ;
- `set_conversation_follow_v1` ;
- `resolve_discussion_v1` ;
- `reopen_discussion_v1` ;
- `mark_conversation_read_v4`.

## Validation transactionnelle

- shape ;
- audience ;
- source unique ;
- focus no-access ;
- resolved send rejection ;
- read bound ;
- rollback propre.

C1 ne modifie pas encore le renderer production.

---

# 4. C2 — Migration sémantique et projection V4

## Backfill

- General existants parentless ;
- Team/Project non-general → enfant du General correspondant ;
- direct/context inchangés.

## Notification defaults

- inherited Team/Project → mentions ;
- existing Discussion creator/auteurs → all ;
- direct → all ;
- meeting conservé.

## Read model

Créer projection/listing V4 :

- contexts ;
- discussions ;
- focus ;
- follow level ;
- unread ;
- À suivre groupé ;
- external guest indicator.

### Gate C2

Comparer projection V4 et données V3 sur tous fils existants. Aucune disparition d'historique/audience.

---

# 5. C3 — Renderer parallèle V4

Créer propriétaire frontend séparé plutôt que surcharger `communication-workspace-v1.js`.

Candidate :

- `site/assets/communication-workspace-v4-preview.js`
- `site/assets/communication-workspace-v4-preview.css`

Route preview explicitement non primaire, par exemple :

`#/messages-v4`

ou feature flag owner-only si route dédiée crée trop de dette.

## Surfaces d'abord

1. Messages Home / À suivre ;
2. General ;
3. Project > Messages landing ;
4. Discussion read-only.

Pas de mutation complexe avant équivalence lecture/audience.

---

# 6. C4 — Mutations V4

Activer dans preview :

1. nouvelle Discussion ;
2. Discussion depuis message ;
3. focus members ;
4. Follow / mentions / muted ;
5. resolve/reopen ;
6. inline @mentions + replies ;
7. call selector.

Chaque mutation utilise RPC V4 ou API V3 déjà sûre ; aucun direct write structurel dans le navigateur.

### Gate C4

Exécuter E2E 001–072 applicables Owner+Member.

---

# 7. C5 — Realtime + drafts + lecture réelle

## Draft

Store séparé du fil, clé user/workspace/conversation, TTL.

## Realtime

- active conversation incremental messages ;
- lightweight activity refresh ;
- fallback contrôlé.

## Read

Intersection/scroll condition → `mark_conversation_read_v4` avec message seen.

### Gate C5

E2E 080–083 + 070–072 sur desktop/mobile.

---

# 8. C6 — Intégrations métier

Ordre recommandé :

1. Project > Messages route V4 ;
2. attachment search dans Fichiers ;
3. attachment → Ressource ;
4. Discussion → Idée avec provenance ;
5. liens Action/Demande/Décision existants ;
6. Meeting thread navigation.

Ne pas ajouter Internal/Shared Guest dans C6 ; gate séparée ultérieure.

---

# 9. C7 — Cutover primaire

Conditions :

- E2E P0 complet ;
- multi-user réel ;
- mobile/desktop ;
- rollback V3 testé ;
- aucune audience regression ;
- project messages parity ;
- files/idea transformations prouvées ou explicitement laissées hors scope.

Actions :

- `#/messages` devient V4 ;
- Project > Messages ouvre V4 ;
- boot charge V4 avant compatibility bridge ;
- V3 reste physiquement disponible/fallback pour une fenêtre contrôlée ;
- health expose `communication_v4.active=true` seulement après runtime proof.

---

# 10. C8 — Nettoyage différé

Seulement après période de stabilité + E2E :

- retirer old topic creation UI ;
- retirer project-messages redirect V1 ;
- retirer handlers V3 supplantés ;
- supprimer polling destructif ;
- simplifier CSS legacy.

Ne pas nettoyer pour « faire propre » avant certification.

---

# 11. Plan SQL / rollback

## Migration A — schema additive

Rollback : drop RPC/table/columns uniquement si aucune donnée V4 user n'existe ; avant activation uniquement.

## Migration B — backfill parent/preferences

Avant application :

- snapshot compte/IDs/status/preferences ;
- transaction dry-run avec assertions ;
- rapport de diff.

Rollback logique :

- parent/source nullable ;
- conserver mapping historique ;
- restauration notification_level depuis table temporaire/audit de migration si besoin.

Après vraie utilisation V4, ne pas « rollback data » destructivement ; rollback runtime vers V3 doit ignorer colonnes additives tout en conservant données.

---

# 12. Feature flags / health

Avant cutover :

```text
communication_v4_candidate = v0.x
communication_v4_active = false
communication_v4_backend = dormant
```

Après preuve :

```text
communication_v4_active = true
communication_v4_renderer = ...
communication_v4_read_model = ...
communication_v4_realtime = ...
```

Ne jamais annoncer V4 actif uniquement parce que migration SQL existe.

---

# 13. Risques principaux

1. confusion followers/members — évitée par reuse notification_level ;
2. migration all→mentions mal ciblée — exiger snapshot/diff ;
3. direct write browser contournant parent invariants — guards/RPC ;
4. Realtime duplicate messages — idempotent merge by message_id ;
5. false-read — read by seen_message_id ;
6. Guest overexposure — project audience explicit + separate future gate ;
7. draft leak entre comptes — key + logout cleanup ;
8. source discussion duplication — unique source ;
9. mass call — selector mandatory collective contexts ;
10. Idea shortcut to Project — prohibited by product contract.

---

# 14. Décision d'exécution

**C0 peut être implémenté séparément après revue rapide car il corrige des défauts V3 sans modifier le modèle de données.**

**C1 peut ensuite être préparé en SQL candidate/transaction test, mais ne doit pas être appliqué en production avant red-team SQL et rollback proof.**

C2–C7 restent séquentiels par preuve, pas par calendrier.
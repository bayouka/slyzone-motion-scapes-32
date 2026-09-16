# 2b2c — Communication V4 — E2E Acceptance Matrix V0.1

## Statut

**CANDIDATE QA / PRODUCT ACCEPTANCE — non exécuté.**

Autorités :
- `COMMUNICATION_V4_PRODUCT_WORKFLOW_CONTRACT_V0_3.md`
- `COMMUNICATION_V4_DATA_SECURITY_CONTRACT_V0_1.md`

But : empêcher une activation V4 validée seulement par tests statiques ou SQL. Les scénarios P0 doivent être vérifiés avec deux vraies sessions authentifiées au minimum avant retrait des chemins V3.

---

# 1. Identités de test

Minimum :

- Owner/Admin interne ;
- Member interne ;
- Guest externe uniquement dans fixture contrôlée lorsque les scénarios Guest sont exécutés.

Ne jamais emprunter des identifiants personnels ni fabriquer des users production par SQL hors workflow Auth sûr.

Desktop : 1440×900.
Mobile : 390×844.

---

# 2. P0 — Général / attention

## C4-E2E-001 — message ordinaire Général

Member poste un message ordinaire dans Général.

Attendu pour Owner :

- message visible ;
- Général peut être marqué non lu ;
- aucune notification cloche ;
- aucun badge Messages obligatoire si Owner est en mode `mentions` ;
- texte `Fred,` seul ne devient pas une mention.

## C4-E2E-002 — @mention réelle

Member écrit `@Owner` via autocomplete.

Attendu :

- mention créée ;
- une seule notification cloche ;
- Général apparaît dans À suivre ;
- badge Messages augmente ;
- ouvrir puis atteindre le nouveau message acquitte l'attention.

## C4-E2E-003 — reply

Owner répond à un message Member.

Attendu pour Member :

- réponse visible inline dans le même fil ;
- une seule attention `Réponse` ;
- pas de thread secondaire ;
- si réponse + @mention simultanées, pas de double notification.

## C4-E2E-004 — annonce

Owner publie une annonce dans Général.

Attendu :

- tous lecteurs non-muted reçoivent une attention explicite ;
- `mentions` reçoit l'annonce ;
- `muted` n'est pas interrompu ;
- annonce ne crée pas plusieurs notifications si user aussi mentionné.

---

# 3. P0 — créer une Discussion

## C4-E2E-010 — Discussion neuve depuis Général

Owner clique Nouvelle discussion.

Attendu :

- contexte Général déjà fixé ;
- titre + premier message obligatoires ;
- concernés optionnels ;
- transaction atomique ;
- ouverture immédiate de la nouvelle Discussion ;
- aucun rebond vers Messages home ;
- Discussion visible par les mêmes lecteurs que Général ;
- créateur en follow `all` ; autres lecteurs hérités en `mentions`.

## C4-E2E-011 — Discussion depuis message

Depuis message Member dans Général : `Continuer dans une discussion`.

Attendu :

- aperçu source ;
- création atomique ;
- source non dupliquée ;
- bloc Point de départ dans Discussion ;
- carte Discussion sous le message source ;
- source_message_id exact.

## C4-E2E-012 — source unique

Revenir au message source après C4-E2E-011.

Attendu :

- CTA devient `Ouvrir la discussion` ;
- impossible de créer un second espace identique par le même chemin.

## C4-E2E-013 — réponse après structuration

Sur le message source ayant déjà une Discussion :

Attendu :

- action principale propose `Continuer dans la discussion` ;
- `Répondre ici quand même` reste secondaire ;
- aucune redirection forcée sans choix.

---

# 4. P0 — concernés / follow / accès

## C4-E2E-020 — personne concernée

Owner ajoute Member comme concerné dans Discussion Team.

Attendu :

- Member était déjà lecteur ;
- Member apparaît dans Concernés ;
- niveau devient follow/all sauf si explicitement muted ;
- aucune nouvelle permission workspace/project créée.

## C4-E2E-021 — cible sans accès Projet

Dans Discussion Projet restreint, tenter d'ajouter un workspace Member qui n'a pas accès au Projet.

Attendu :

- rejet serveur ;
- message UX clair ;
- aucune modification project_members/conversation_members implicite.

## C4-E2E-022 — retirer des concernés

Retirer Member de Concernés après qu'il a choisi de Suivre manuellement.

Attendu :

- focus relation supprimée ;
- accès conservé ;
- follow personnel conservé.

## C4-E2E-023 — participation auto-follow

Member en `mentions` poste son premier message dans une Discussion.

Attendu :

- conversation passe à `all` ;
- feedback discret ;
- si Member était `muted`, le mute reste intact.

---

# 5. P0 — Projet > Messages

## C4-E2E-030 — landing Projet Messages

Ouvrir Projet > Messages.

Attendu :

- pas de redirect automatique vers Général ;
- Général visible en premier ;
- Discussions actives listées ;
- suivies prioritaires ;
- Réunions récentes secondaires ;
- Résolues accessibles.

## C4-E2E-031 — deep link Discussion Projet

Ouvrir URL directe d'une Discussion Projet.

Attendu :

- fil correct ;
- contexte Projet conservé ;
- navigation retour vers espace Messages du Projet, pas vers liste globale arbitraire.

## C4-E2E-032 — non-lu passif Projet

Un autre membre poste dans Général Projet alors que l'utilisateur est `mentions`.

Attendu :

- non-lu visible dans Projet ;
- pas de cloche ;
- pas de badge global Messages ;
- mention explicite change ce résultat.

---

# 6. P0 — Privé

## C4-E2E-040 — direct 1:1

Créer Nouveau privé avec une personne.

Attendu :

- direct unique/réutilisé selon contrat existant ;
- audience exacte ;
- badge non-lu pour destinataire ;
- Appeler immédiat autorisé.

## C4-E2E-041 — groupe privé

Créer avec plusieurs personnes.

Attendu :

- seuls sélectionnés lisent ;
- groupe explicite ;
- aucun ajout de membre sans nouveau workflow ;
- Appeler le groupe appelle seulement l'audience explicite.

## C4-E2E-042 — lier au Projet

Lier direct à Projet partagé par tous.

Attendu :

- contexte affiché ;
- audience inchangée ;
- aucun lecteur Projet supplémentaire.

---

# 7. P0 — Appels collectifs

## C4-E2E-050 — Discussion lisible par 10, concernés 2

Cliquer Appeler…

Attendu :

- sélecteur visible ;
- 2 concernés préremplis au maximum ;
- liste finale visible avant émission ;
- aucun appel aux 8 autres sans sélection.

## C4-E2E-051 — Discussion sans concernés

Attendu :

- sélecteur vide ;
- aucun mass-call déduit de l'audience.

---

# 8. P0 — Résolution

## C4-E2E-060 — résoudre Discussion Team

Créateur résout.

Attendu :

- sort des actives ;
- apparaît dans Résolues/recherche ;
- composer désactivé ;
- historique intact.

## C4-E2E-061 — non autorisé

Ordinary Member non-créateur tente de résoudre Team Discussion.

Attendu :

- contrôle absent ou rejet serveur ;
- état inchangé.

## C4-E2E-062 — rouvrir

Acteur autorisé rouvre.

Attendu :

- active ;
- composer revient ;
- historique inchangé.

## C4-E2E-063 — Général permanent

Général n'affiche jamais Résoudre et le serveur refuse toute tentative équivalente.

---

# 9. P0 — lecture réelle

## C4-E2E-070 — ouvrir dernier message

Ouvrir conversation et atteindre la fin.

Attendu : last_read avance jusqu'au dernier message visible.

## C4-E2E-071 — deep-link ancien message

Ouvrir un message ancien alors que 5 plus récents sont non lus.

Attendu :

- scroll sur ancien ;
- 5 restent non lus ;
- bandeau `5 nouveaux messages` ;
- après Aller aux nouveaux/atteinte du bas, lecture avance.

## C4-E2E-072 — preview ne marque pas lu

Afficher À suivre/liste sans ouvrir la conversation.

Attendu : unread inchangé.

---

# 10. P0 — realtime / draft

## C4-E2E-080 — réception pendant saisie

Owner tape un brouillon ; Member envoie un message.

Attendu :

- message entrant visible ;
- brouillon inchangé ;
- focus/caret conservés autant que possible ;
- aucun reload destructif.

## C4-E2E-081 — lecture plus haut

Owner lit 20 messages plus haut ; Member envoie.

Attendu :

- viewport ne saute pas ;
- `1 nouveau message` apparaît ;
- brouillon conservé.

## C4-E2E-082 — navigation mobile

Écrire brouillon, retour liste, rouvrir conversation.

Attendu : texte restauré pour même user/workspace/conversation.

## C4-E2E-083 — changement compte

Sign out puis connexion d'une autre identité sur même navigateur.

Attendu : aucun brouillon du premier compte visible.

---

# 11. P0 — recherche / pièces jointes

## C4-E2E-090 — recherche Discussion résolue

Recherche titre/texte.

Attendu : résultat visible si droit courant ; ouvre Discussion/message exact.

## C4-E2E-091 — attachment filename

Rechercher nom d'une pièce jointe.

Attendu : résultat avec conversation/contexte/auteur/date et lien message source.

## C4-E2E-092 — retrait accès Projet

Après retrait d'accès, rechercher ancien texte/attachment.

Attendu : aucun résultat, aucune ouverture Storage via UI/API autorisée.

## C4-E2E-093 — promotion en Ressource

Depuis attachment Projet, Ajouter aux ressources.

Attendu :

- Ressource distincte ;
- attachment original intact ;
- provenance traçable ;
- droits Projet respectés.

---

# 12. P0 — Discussion → Idée

## C4-E2E-100 — sélection sources

Créer Idée depuis Team Discussion.

Attendu :

- titre/description éditables ;
- messages/documents sélectionnés explicitement ;
- pas d'aspiration automatique de tout l'historique ;
- provenance conservée ;
- Idea créée, aucun Project d'exécution créé.

## C4-E2E-101 — audience expansion

Depuis source plus restreinte vers destination plus large.

Attendu : preview/confirmation obligatoire avant copie/liaison visible ; refus sans confirmation.

---

# 13. P0 — Guest

## C4-E2E-110 — transparence Projet partagé

Projet avec Guest accessible.

Attendu : header Discussion indique présence d'invité(s) externe(s).

## C4-E2E-111 — concerné sans accès

Tenter d'ajouter un utilisateur qui ne lit pas le Projet.

Attendu : rejet ; aucun accès créé.

## C4-E2E-112 — perte accès Guest

Retirer Guest du Projet.

Attendu : plus de Discussion/messages/search/attachment pour ce Guest.

La future sous-audience Internal/Shared a sa propre gate ; ne pas la simuler dans ce test.

---

# 14. P1 — migration V3

## C4-E2E-120 — ancien Général

Après migration, Général Team/Projet conserve ses messages et identité générale.

## C4-E2E-121 — ancien topic

Ancien topic Team/Project apparaît comme Discussion sous le bon Général, historique inchangé.

## C4-E2E-122 — direct/reunion

Directs et fils Réunion restent identiques en audience/historique.

## C4-E2E-123 — preference migration

Général/project inherited reader devient `mentions` selon migration ; direct reste `all` ; auteurs/creator de Discussion existante suivent selon règle.

---

# 15. P1 — responsive / accessibilité

## C4-E2E-130 — mobile list → fil

Navigation fluide plein écran, retour logique, composer accessible au clavier mobile.

## C4-E2E-131 — @ autocomplete clavier

Autocomplete utilisable clavier/screen reader ; sélection n'insère pas de faux nom sans ID résolu.

## C4-E2E-132 — resolved mobile

Composer remplacé par état Résolue ; CTA Rouvrir seulement si autorisé.

## C4-E2E-133 — focus modal

Nouvelle Discussion, call selector et Transform en… respectent focus trap/Escape/retour focus.

---

# 16. Gate d'activation

V4 ne peut devenir propriétaire effectif production que si :

- tests serveur/RLS du Data Contract passent ;
- tous P0 applicables disposent d'une preuve exécutable ;
- au moins Owner + vrai Member sont utilisés pour les scénarios multi-user ;
- mobile + desktop validés ;
- runtime V3 reste rollbackable ;
- aucune différence d'audience non expliquée ;
- aucun mass-call implicite ;
- aucun draft perdu lors d'une réception ;
- aucune conversation marquée lue uniquement par chargement ;
- aucune création directe Project depuis Discussion pré-projet.

**Un build statique vert n'est pas une preuve E2E Communication V4.**
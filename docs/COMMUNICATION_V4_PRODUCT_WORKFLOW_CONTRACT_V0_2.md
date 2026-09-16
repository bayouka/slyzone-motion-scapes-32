# 2b2c — Communication V4 — Product & Workflow Contract V0.2

## Statut

**CANDIDATE STRUCTUREL CONSOLIDÉ — remplace V0.1 comme cible de travail, non implémenté.**

Sources :
- `COMMUNICATION_TOPICS_PRODUCT_AUDIT_20260916.md`
- `COMMUNICATION_V4_PRODUCT_WORKFLOW_CONTRACT_V0_1.md`
- `COMMUNICATION_V4_RED_TEAM_20260916.md`

Cette V0.2 intègre la red-team RT1–RT18. Elle doit encore passer wireframes desktop/mobile + revue sécurité/data + plan E2E avant promotion.

---

# 1. Promesse

Messages doit permettre à une petite équipe de :

- parler immédiatement sans organiser avant de parler ;
- structurer seulement quand un échange le mérite ;
- savoir qui peut lire et qui est réellement concerné ;
- retrouver plus tard discussions et documents ;
- transformer un échange en Action, Demande, Décision ou Idée sans perdre sa source.

**Messages doit réduire le travail de classement, pas en créer.**

2b2c ne doit pas devenir un clone de Slack/Discord/Teams.

---

# 2. Modèle mental final V0.2

L'utilisateur apprend seulement :

## Contextes

1. **Général** — équipe interne, transverse, permanent.
2. **Projet** — communication d'un projet.
3. **Privé** — une ou plusieurs personnes explicitement choisies.
4. **Réunion** — fil dérivé d'une réunion.

## Structure

**Discussion** = sujet précis sous Général ou sous un Projet.

Il n'existe pas de Discussion dans une Discussion. Pas de threads récursifs.

`Répondre` = citation contextuelle dans le même fil, pas nouveau sous-fil.

## Attention

- **Peut lire** = sécurité / visibilité.
- **Personne concernée** = participante principale, suit automatiquement.
- **Suivre** = préférence personnelle.
- **@Mention** = attention ponctuelle, pas abonnement permanent.

Aucune action d'attention ne peut accorder un droit de lecture.

---

# 3. Navigation Messages

## Desktop

Deux zones :

- navigation/contextes à gauche ;
- conversation à droite.

Ordre :

1. **À suivre**
2. **Général**
3. **Projets**
4. **Privés**
5. **Résolues** — secondaire
6. Recherche

Sous Général : Discussions actives pertinentes.

Sous chaque Projet déplié :

- Général
- Discussions suivies/récentes
- Voir toutes

Les fils Réunion apparaissent par contexte/recherche/À suivre, pas comme une catégorie primaire permanente.

## Mobile

- écran 1 : contextes / À suivre ;
- écran 2 : conversation plein écran ;
- retour conserve le brouillon ;
- composer fixe et compatible clavier.

---

# 4. Général

Général sert aux échanges transverses et aux idées encore trop floues pour justifier une Discussion.

Il est permanent et jamais résolu.

Tous les membres internes **suivent Général équipe par défaut**, mais un message normal n'envoie pas une notification forte à tous.

Notification forte dans Général uniquement pour :

- @mention ;
- réponse personnelle ;
- annonce.

Actions principales :

- écrire ;
- joindre ;
- @mention naturelle ;
- répondre ;
- Nouvelle discussion ;
- créer une Discussion depuis un message ;
- menu `…` secondaire.

Ne pas afficher Action / Demande / Décision sous chaque message.

---

# 5. Discussion

## Création neuve

Depuis Général ou Projet :

- titre obligatoire ;
- premier message obligatoire ;
- Personnes concernées optionnel ;
- pièces jointes optionnel.

Contexte déjà connu : ne jamais redemander Équipe/Projet ou le Projet courant.

Création atomique.

## Depuis un message

- titre obligatoire ;
- `source_message_id` obligatoire ;
- note d'ouverture optionnelle ;
- personnes concernées optionnel.

Le message source reste à sa place et devient `Point de départ` de la Discussion.

Lien bidirectionnel source ↔ Discussion.

Pas de duplication silencieuse du message.

## Suivi

Suivent automatiquement :

- créateur ;
- personnes concernées ;
- toute personne qui écrit/répond dans la Discussion.

Une @mention seule ne crée pas d'abonnement permanent.

L'utilisateur peut `Suivre / Ne plus suivre` sans changer ses droits d'accès.

UI : seul champ collectif visible = `Personnes concernées`. La liste de followers n'est pas une donnée principale.

---

# 6. À suivre et badge Messages

## À suivre

Filtre Communication seulement. Home reste l'agrégateur cross-domain.

Entre dans À suivre :

- privé non lu ;
- @mention ;
- réponse personnelle ;
- Général équipe non lu ;
- activité non lue d'une Discussion suivie ;
- annonce ;
- communication liée à une Demande/validation qui exige l'utilisateur.

## Badge global Messages

Compte **l'attention personnelle**, pas tous les messages accessibles.

Un non-lu passif d'un Projet accessible peut être visible dans le Projet sans augmenter le badge global.

---

# 7. Projet > Messages

Ouvre l'espace Messages du Projet, jamais seulement un redirect vers Général.

Montre :

- Général du Projet ;
- Discussions actives ;
- suivies en priorité ;
- Résolues secondaire ;
- réunions récentes liées au Projet.

## Suivi du Général Projet

Accès au Projet ≠ abonnement automatique à tous ses messages.

Suivent automatiquement Général Projet :

- lead ;
- utilisateurs qui écrivent dans ce fil ;
- utilisateurs qui choisissent Suivre.

Les autres peuvent lire sans être bruyamment abonnés.

Le Projet est déjà le dossier métier : aucun dossier manuel de Messages.

---

# 8. Privé

Un seul CTA : `Nouveau message privé`.

Puis choisir :

- une personne → direct ;
- plusieurs → groupe privé.

Lier un privé à un Projet ajoute uniquement du contexte. Aucun lecteur supplémentaire.

Les participants du privé suivent automatiquement.

---

# 9. Réunion

Une conversation Réunion se crée depuis Agenda/Réunion, jamais depuis `Nouvelle conversation`.

Messages est un point d'accès secondaire vers le fil déjà lié.

Le contexte Réunion pilote :

- participants ;
- appel ;
- Avant / Live / Après.

---

# 10. Mentions et réponses

## @Mention

Composer avec autocomplete inline `@Nom`.

Supprimer le modèle V3 où la mention est une liste de cases séparée du texte.

Si l'utilisateur écrit simplement `Fred,` sans @mention, ne pas simuler de notification.

## Réponse

Répondre à un message notifie son auteur, même sans @mention, sauf préférence explicite contraire.

Dédupliquer : réponse + @mention + suivi ne doivent pas produire trois alertes équivalentes.

---

# 11. Annonces

Annonce = information importante destinée à l'ensemble du contexte.

Autoriser :

- Général équipe — owner/admin ;
- Général Projet — lead/admin selon droits.

Ne pas autoriser comme mécanisme global dans :

- Discussion ordinaire ;
- privé ;
- Réunion générique.

---

# 12. Appels

- direct 1:1 → Appeler directement ;
- groupe privé → Appeler le groupe explicite ;
- Général/Projet/Discussion → `Appeler…` avec confirmation/sélecteur ;
- personnes concernées servent uniquement de préremplissage ;
- Réunion → participants Réunion.

Jamais de mass-call implicite des lecteurs autorisés.

---

# 13. Résoudre / Rouvrir

Applicable uniquement aux Discussions.

`active → resolved → active` via Rouvrir explicite.

Résolue :

- retirée des actives ;
- searchable ;
- historique conservé ;
- liens vers objets produits conservés ;
- composer désactivé tant que non rouverte.

Général n'affiche jamais Résoudre.

---

# 14. Transformer en…

Menu contextuel, jamais cinq boutons permanents.

## Général / Discussion Team

Selon droits/contexte :

- Discussion ;
- Idée ;
- Demande ;
- Décision workspace.

## Discussion Projet

Priorité :

- Action ;
- Demande ;
- Décision.

Idée uniquement en action secondaire si pertinente.

## Privé lié Projet

Action / Demande / Décision uniquement si source/destination autorisées.

## Réunion

Action / Décision prioritaires via workflow Meeting.

Ne jamais montrer une transformation impossible simplement désactivée.

---

# 15. Discussion → Idée → Projet

Cas métier central issu du test réel :

`échange général → discussion structurée → idée à étudier → GO éventuel → projet`.

Ne pas créer directement un Projet depuis une discussion de pré-projet.

`Créer une Idée à partir de cette discussion` :

- utilisateur choisit le contenu/source à reprendre ;
- messages et documents restent provenance ;
- description peut être préremplie sans écraser le RAW humain ;
- ouvre Idea Workspace ;
- Discussion montre le lien vers l'Idée ;
- Projet apparaît seulement après décision/GO ;
- aucun historique n'est copié vers une audience plus large sans confirmation.

Respect absolu de `Idea ≠ Project`.

---

# 16. Pièces jointes / Fichiers

Pièce jointe ≠ Ressource ≠ Livrable.

## Pièce jointe

Reste dans la conversation et hérite de son accès.

## Fichiers

La recherche globale Fichiers doit pouvoir retrouver les pièces jointes, mais ne pas les présenter comme des Ressources officielles.

Filtre dédié `Pièces jointes`.

Ressources + Livrables restent le cœur de la bibliothèque.

## Promotion

Depuis Discussion Projet : `Ajouter aux ressources du projet`.

Original conservé ; Ressource créée avec provenance.

Depuis une Discussion pré-projet : document peut être repris comme source de l'Idée.

---

# 17. Recherche

Doit trouver, sous droits courants :

- corps message ;
- titre Discussion ;
- pièce jointe ;
- Projet ;
- personne ;
- Discussion résolue ;
- liens visibles vers Action/Demande/Décision/Idée.

Une personne ayant perdu l'accès ne retrouve plus l'historique via recherche.

Ne pas appeler la recherche « globale » si elle ignore titres/pièces jointes.

---

# 18. Temps réel / brouillons

Brouillon indépendant du rendu.

Recevoir un message ne doit pas effacer ou bloquer le brouillon.

Ne jamais couper la réception parce que le composer a le focus.

Cible : Realtime/incrémental + fallback contrôlé.

Reconnexion courte : brouillon conservé, état sync explicite si problème.

---

# 19. Guests — gate séparée obligatoire

Le modèle actuel `kind=project` ne distingue pas une discussion interne d'une discussion visible à un Guest ayant accès au Projet.

V4 ne doit pas maquiller cela par une simple étiquette frontend.

Avant collaboration client complète : gate dédiée **Project Communication Internal/Shared** avec :

- audience au niveau Discussion, jamais message ;
- RLS/server authority ;
- impact preview avant élargissement ;
- aucune attention/follow ne donne accès ;
- E2E internal vs Guest.

Dans un Projet sans Guest, cette complexité reste invisible.

---

# 20. Data model cible minimal

Conserver `kind` pour compatibilité/autorisation tant qu'une migration complète n'est pas justifiée.

Ajouter :

## conversations

- `parent_conversation_id` — Discussion enfant du Général Team/Projet ;
- `source_message_id` — optionnel pour Discussion issue d'un message ;
- structure user-facing explicite Général / Discussion / Direct / Réunion sans détourner `kind`.

## attention relation séparée

Ex. `conversation_attention_members` :

- conversation_id ;
- user_id ;
- role `participant|follower` ;
- added_by ;
- created_at.

Cette relation ne confère jamais l'accès.

## provenance

Relation contrôlée entre Discussion/message et objets créés : Action, Demande, Décision, Idée, Projet, Ressource.

---

# 21. Migration V3 → V4

Non destructive :

- `is_general=true` reste Général ;
- Team topic existant → enfant du Général Team ;
- Project topic existant → enfant du Général même Projet ;
- messages inchangés ;
- privés inchangés ;
- réunions inchangées ;
- conversation_members conservé pour lecture/prefs/legacy access ;
- attention nouvelle séparée.

Ne pas supprimer les anciens chemins avant E2E authentifiés.

---

# 22. Workflows de certification

## W1 — Fred/Cédric Général

Cédric poste dans Général. Fred voit le message. `Fred,` seul ne notifie pas. `@Fred` notifie. Si échange durable : créer Discussion depuis message ; Fred+Cédric concernés ; équipe peut toujours lire.

## W2 — Discussion neuve

Contexte déjà connu → titre + message + concernés → création atomique → ouvre immédiatement la nouvelle Discussion sans rebond.

## W3 — Projet

Projet > Messages → Général + Discussions ; aucun choix du Projet demandé de nouveau.

## W4 — Réponse

Réponse à Cédric → notification Cédric → aucune triple alerte.

## W5 — Idée

Discussion générale → Créer Idée → RAW/source traçables → Idea Engine → Projet seulement après GO.

## W6 — Document

Pièce jointe → retrouvable via Fichiers/Pièces jointes → promotion explicite en Ressource si besoin.

## W7 — Appel

Discussion lisible par 10, 2 concernés → Appeler… → 2 préremplis mais confirmation visible → aucun mass-call.

## W8 — Résolue

Résoudre → disparaît actives → recherche OK → Rouvrir requis pour écrire.

## W9 — Mobile/realtime

Brouillon en cours + message entrant → message visible sans perte brouillon → navigation retour/retour fil conserve brouillon.

## W10 — Guest

À certifier uniquement dans gate Internal/Shared : Guest ne lit jamais discussion internal ; aucune sélection concerné/follow ne contourne RLS.

---

# 23. Slices d'implémentation

## C0 — V3 safety fixes

- reload après création ;
- `#/messages` vide réellement current ;
- pas de Résoudre sur Général ;
- pas de mass-call collectif implicite ;
- reply notification ;
- préparer @mention inline.

## C1 — structure Discussion

- parent ;
- backfill ;
- projet Messages = Général + Discussions ;
- création atomique.

## C2 — attention

- participants/followers ;
- À suivre ;
- badge attention ;
- non-lu passif séparé.

## C3 — source/résolution

- Discussion depuis message ;
- source link ;
- resolve/reopen ;
- search resolved.

## C4 — transformations

- menu contextuel ;
- Action/Demande/Décision ;
- Idea integration ;
- provenance.

## C5 — fichiers/recherche

- attachments discoverable ;
- promote Resource ;
- titles/attachments search.

## C6 — realtime

- incremental sync ;
- draft persistence ;
- multi-session E2E.

## C7 — Guest Internal/Shared

Gate dédiée avant activation externe complète.

---

# 24. Interdictions

- channels/dossiers manuels ;
- thread dans Discussion ;
- Sujet au même niveau que Privé/Réunion ;
- audience = personnes concernées ;
- mention = abonnement permanent ;
- accès projet = abonnement automatique à toutes discussions ;
- badge Messages = tous les non-lus accessibles ;
- per-message privacy ;
- mass-call implicite ;
- discussion vide créée depuis scratch ;
- déplacement/copie silencieuse du message source ;
- Projet direct depuis discussion pré-projet ;
- transformations permanentes sous chaque message ;
- faux realtime interrompu par focus ;
- pièces jointes introuvables ;
- UI Guest « interne/partagé » sans RLS correspondante.

---

# 25. Gate avant implémentation

V0.2 n'est implémentable qu'après :

1. wireframes desktop + mobile des 6 surfaces : Messages home, Général, Discussion, Projet Messages, Privé, Résolues ;
2. walkthrough W1–W9 avec au moins Owner + Member ;
3. mapping backend non destructif ;
4. permissions + notification matrix ;
5. E2E plan avec deux sessions authentifiées ;
6. validation explicite du périmètre C0→C6 ;
7. Guest/Internal-Shared traité séparément avant C7.

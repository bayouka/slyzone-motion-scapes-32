# 2b2c — Communication V4 — Scenario stress-test V2 — 2026-09-16

## Statut

**REVUE CONTRADICTOIRE APRÈS WIREFRAME LOGIC — avant implémentation.**

Cette revue repart de `COMMUNICATION_V4_PRODUCT_WORKFLOW_CONTRACT_V0_2.md` et `COMMUNICATION_V4_WIREFRAME_LOGIC_V0_1.md`, puis teste le modèle sur des usages réels : petite équipe, plusieurs projets, absence prolongée, discussions qui deviennent des idées, invités externes, appels, documents, lecture mobile et reprise après interruption.

Objectif : détecter les endroits où V0.2 reste encore trop bruyante, redondante ou techniquement plus complexe que nécessaire.

---

# 1. Verdict

La structure `Contexte → Discussion → Message` est saine et doit être conservée.

En revanche, V0.2 contient encore trois défauts structurants :

1. `Général équipe` est encore trop proche d'un canal suivi par défaut : si chaque message non lu remonte dans `À suivre`, le badge Messages devient du bruit dès que l'équipe grandit.
2. la proposition d'une nouvelle relation `participant|follower` duplique une capacité déjà présente dans `conversation_members.notification_level = all|mentions|muted` ;
3. la notion de « lu » doit être plus précise que « la conversation a été chargée », sinon un deep-link ou une ouverture automatique marque des messages comme lus sans qu'ils aient été vus.

La cible doit donc conserver les concepts utilisateur de V0.2 mais simplifier le modèle backend et la politique d'attention.

---

# 2. ST1 — Général équipe ne doit pas devenir une boîte mail obligatoire

## Scénario

Équipe de 12 personnes. 15 messages ordinaires sont postés dans Général pendant qu'un utilisateur travaille sur un Projet.

Si les 15 messages entrent dans `À suivre` et augmentent le badge Messages, l'utilisateur apprend que le badge signifie « activité dans l'entreprise », pas « quelque chose mérite mon attention ».

## Décision

**Général équipe est lisible par tous, mais n'est pas suivi au sens attention forte par défaut.**

Niveau par défaut pour les membres ajoutés automatiquement : `mentions`.

Un message ordinaire dans Général :

- peut afficher un non-lu discret sur Général ;
- n'augmente pas le badge global Messages ;
- n'entre pas dans `À suivre` sauf si l'utilisateur a explicitement choisi `Suivre`.

Entrent toujours dans l'attention :

- @mention ;
- réponse à l'utilisateur ;
- annonce ;
- privé ;
- activité dans une Discussion explicitement suivie.

Cela corrige RT3/RT5 : Général reste le point commun sans devenir une obligation de lecture permanente.

---

# 3. ST2 — Réutiliser le modèle de notification existant au lieu d'ajouter des followers

Production possède déjà `conversation_members.notification_level` avec les valeurs :

- `all` ;
- `mentions` ;
- `muted`.

Créer une table de followers séparée ferait porter deux sources de vérité sur la même préférence.

## Décision

`conversation_members` reste la relation d'audience/lecture + préférence individuelle.

Sémantique V4 :

- `all` = **Suivre** : toute nouvelle activité non lue de cette conversation compte dans Messages > À suivre ;
- `mentions` = **Mentions et réponses** : seuls @mention, réponse personnelle et annonce créent de l'attention ;
- `muted` = **Silencieux** : aucun signal personnel de Communication ; le contenu reste lisible et peut rester non lu dans son contexte.

La cloche globale reste réservée aux interruptions explicites : mention, réponse personnelle, annonce, appel, demande/validation métier. Une Discussion suivie peut augmenter le badge Messages sans créer une notification cloche pour chaque message.

---

# 4. ST3 — « Personnes concernées » reste séparé de « Suivre »

Les personnes concernées ne sont pas une liste de droits d'accès ni une seconde liste de followers.

## Décision

Ajouter uniquement une relation dédiée de **focus métier**, par exemple `conversation_focus_members` :

- `conversation_id` ;
- `user_id` ;
- `added_by` ;
- `created_at`.

Règles :

- être concerné ne donne jamais l'accès ;
- ajouter une personne concernée exige qu'elle puisse déjà lire la Discussion ;
- lors de l'ajout, son `notification_level` passe à `all` ;
- retirer une personne des concernés ne la désabonne pas automatiquement : on ne détruit pas une préférence de suivi qu'elle a peut-être ensuite choisie elle-même ;
- le créateur suit automatiquement la Discussion ;
- toute personne qui envoie un message dans une Discussion passe automatiquement à `all` une première fois, avec feedback discret `Vous suivez cette discussion` ;
- @mention seule ne change pas le niveau de suivi.

---

# 5. ST4 — Un message source ne doit pas créer cinq Discussions parallèles

## Scénario

Cédric poste une idée dans Général. Fred crée une Discussion. Une autre personne clique plus tard sur le même message et crée presque le même espace.

## Décision

Un `source_message_id` ne peut référencer qu'une Discussion V4 active/historique principale.

Si une Discussion existe déjà :

- l'action devient `Ouvrir la discussion` ;
- le message source affiche la carte de cette Discussion ;
- on ne propose pas une création dupliquée.

Si la Discussion est résolue, l'utilisateur peut l'ouvrir puis la rouvrir si nécessaire. V4 core n'autorise pas plusieurs branches issues du même message.

---

# 6. ST5 — Répondre à un message déjà structuré

## Scénario

Une Discussion a été créée depuis un message de Général. Quelqu'un clique ensuite `Répondre` sous le message source.

## Risque

Le thème se fragmente entre Général et la Discussion.

## Décision UX

Si un message possède déjà une Discussion liée, l'action principale devient :

`Continuer dans la discussion`.

`Répondre ici quand même` reste possible dans le menu secondaire pour un message vraiment transverse.

Le produit oriente sans bloquer.

---

# 7. ST6 — Lecture exacte, pas « ouvert = lu »

Le runtime V3 marque la conversation lue lors de son chargement. Cela est insuffisant pour V4.

## Décision

Une conversation n'avance son `last_read_at` jusqu'au dernier message que lorsque :

- elle est l'écran actif ;
- le document est visible ;
- l'utilisateur a atteint la zone des derniers messages.

Deep-link vers un ancien message :

- scroll sur le message ciblé ;
- conserve les messages postérieurs comme non lus ;
- affiche `N nouveaux messages` / `Aller aux nouveaux` ;
- marque les nouveaux comme lus seulement lorsqu'ils deviennent effectivement atteints.

Un préchargement ou une liste de preview ne marque jamais lu.

---

# 8. ST7 — À suivre doit regrouper par conversation

Une conversation peut contenir simultanément une mention, une réponse et quatre nouveaux messages suivis.

## Décision

`À suivre` affiche **une ligne par conversation**, pas une ligne par événement.

La raison la plus forte est affichée :

1. annonce ;
2. mention ;
3. réponse ;
4. privé ;
5. Discussion suivie.

Le compteur représente les messages pertinents non lus de cette conversation.

Cela évite de transformer `À suivre` en centre de notifications bis.

---

# 9. ST8 — Projet > Messages doit être un contexte, pas une redirection

Décision V0.2 confirmée.

La route Projet > Messages ouvre un landing projet :

- Général ;
- Discussions suivies puis récentes ;
- réunions récentes ;
- Résolues.

Elle ne sélectionne pas automatiquement Général si l'utilisateur est arrivé pour voir l'ensemble.

Un deep-link vers une Discussion ouvre directement cette Discussion tout en conservant le contexte Projet.

---

# 10. ST9 — Général Projet ne doit pas auto-abonner tous les membres

Niveau par défaut des membres héritant de l'accès projet : `mentions`.

Pas d'abonnement automatique du lead à tous les messages : être responsable du Projet ne doit pas imposer du bruit conversationnel. Le lead reçoit toujours les mentions/réponses/annonces et peut suivre explicitement.

Écrire dans Général Projet ne force pas un abonnement à tout le futur Général : les réponses directes suffisent à assurer la continuité. L'auto-follow à l'écriture est réservé aux Discussions structurées.

---

# 11. ST10 — Pouvoir lire un Projet avec Guest doit être visible

V4 core ne crée pas encore de sous-audience Internal/Shared.

Tant qu'un Projet contient un invité externe, l'UI d'une Discussion Projet doit dire explicitement :

`Visible par les membres de Projet X, dont 1 invité externe`.

Ajouter un membre dans `Personnes concernées` ne peut jamais lui donner accès au Projet.

Toute transformation depuis Team/Privé vers un Projet avec audience plus large conserve le garde-fou d'expansion d'audience côté serveur.

La future gate Internal/Shared reste distincte.

---

# 12. ST11 — Autorité de gestion d'une Discussion

Pour éviter un fil impossible à clôturer ou au contraire modifié par n'importe qui :

## Team Discussion

Peuvent renommer, gérer les personnes concernées, résoudre/rouvrir :

- créateur ;
- owner/admin workspace.

## Project Discussion

Peuvent gérer :

- créateur ;
- project lead ;
- owner/admin workspace.

Autres lecteurs : écrire, répondre, suivre/ne plus suivre selon leurs droits d'accès.

Pas de suppression dure d'une Discussion ayant du contenu en V4 core. `Résoudre` est le mécanisme normal de fin.

---

# 13. ST12 — Personne retirée du Projet

Si un utilisateur perd l'accès au Projet :

- il disparaît des `conversation_members` projet par la synchronisation d'accès ;
- il ne peut plus rechercher/ouvrir messages ou pièces jointes ;
- s'il était dans `conversation_focus_members`, cette relation doit être nettoyée ou ignorée par contrainte/trigger ;
- son brouillon local doit être supprimé dès qu'un accès refusé est constaté pour éviter de conserver une promesse de reprise impossible.

Historique serveur conservé ; accès révoqué.

---

# 14. ST13 — Brouillons : persistance bornée et privée au compte

Le brouillon texte peut être local, mais il ne doit pas devenir une archive permanente.

## Décision

Clé par : `user_id + workspace_id + conversation_id`.

- texte uniquement ;
- pas de Blob de pièces jointes persisté ;
- TTL cible 7 jours ;
- effacé après envoi réussi ;
- effacé au retrait d'accès ;
- effacé lors d'une action explicite `Supprimer le brouillon` ;
- changement de compte ne doit jamais afficher le brouillon d'un autre compte.

---

# 15. ST14 — Temps réel : réception et composer indépendants

Le mécanisme V3 suspend le refresh avec un brouillon. V4 doit découpler :

- données messages ;
- état du composer.

Cible : abonnement incrémental à la conversation active + mise à jour légère de l'activité workspace, avec fallback contrôlé.

Un message entrant :

- s'insère sans rerender destructif du textarea ;
- si l'utilisateur est en bas, peut rester au bas selon règle de scroll ;
- s'il lit plus haut, affiche `N nouveaux messages` sans déplacer le viewport.

---

# 16. ST15 — Privé : changement d'audience = nouvel objet

Décision V0.2 confirmée.

Un direct/groupe privé ne change pas silencieusement de membres. Ajouter/retirer une personne crée un nouveau groupe tant qu'un contrat sûr d'historique/audience n'existe pas.

Lier au Projet ne change jamais les lecteurs.

---

# 17. ST16 — Idée issue d'une Discussion : sélection, jamais aspiration complète par défaut

Créer une Idée ne doit pas aspirer automatiquement tout l'historique de la Discussion.

## Décision

Le panneau propose :

- titre ;
- description de départ ;
- messages explicitement sélectionnés ;
- pièces jointes explicitement sélectionnées.

Le RAW initial reste une entrée utilisateur distincte ; les messages sélectionnés deviennent sources/provenance.

Depuis une Discussion de Projet, `Créer une idée` doit être secondaire et clairement signifier **nouvelle initiative distincte**, pas modification du Projet courant.

---

# 18. ST17 — Pièce jointe : retrouver sans promouvoir

Décision V0.2 confirmée avec limite :

- Fichiers recherche nom/métadonnées de pièce jointe en V4 core ;
- pas de prétention d'indexer automatiquement le contenu intégral du document ;
- `Ajouter aux ressources du projet` crée une Ressource séparée avec lien de provenance vers l'attachment/message source.

---

# 19. ST18 — Appeler depuis un contexte collectif

Général / Projet / Discussion :

- jamais d'appel immédiat ;
- ouvre un sélecteur ;
- préremplit seulement les personnes concernées disponibles, hors utilisateur courant ;
- montre explicitement la liste finale avant émission.

S'il n'existe aucune personne concernée, le sélecteur est vide : ne pas deviner toute l'audience.

---

# 20. ST19 — Résolue et reprise

Résoudre :

- retire de la navigation active ;
- garde recherche/provenance ;
- bloque le composer ;
- garde les non-lus historiques mais ne crée plus de nouvelle attention.

Si quelqu'un tente de répondre à une source qui renvoie vers une Discussion résolue : proposer `Rouvrir la discussion` si autorisé, sinon `Voir la discussion résolue`.

---

# 21. ST20 — Migration V3 vers V4

La migration doit être non destructive et exploiter l'existant au lieu de le dupliquer.

- `is_general=true` → Général parent ;
- `kind=team/project` non général → Discussion enfant du Général correspondant ;
- direct/context inchangés ;
- messages inchangés ;
- lecture conservée ;
- nouveaux membres hérités Team/Project obtiennent désormais `notification_level='mentions'`, pas `all` ;
- pour une Discussion existante, créateur + auteurs ayant déjà écrit peuvent passer à `all`, autres lecteurs restent `mentions` ;
- directs restent `all` par défaut ;
- réunions peuvent rester `all` pour leurs participants tant que le meeting workflow les gère.

La production actuelle montre uniquement des lignes `notification_level='all'`; cette valeur vient du défaut historique et ne doit pas être interprétée automatiquement comme un choix utilisateur explicite pendant la migration.

---

# 22. Conclusion

**GO POUR CONTRACT V0.3, PAS ENCORE GO CODE.**

V0.3 doit intégrer :

- Général passif par défaut (`mentions`) ;
- réutilisation de `conversation_members.notification_level` pour Follow ;
- relation séparée uniquement pour `Personnes concernées` ;
- attention/bell/badge précisément séparés ;
- lecture réelle ;
- source message unique ;
- autorité de gestion Discussion ;
- politique draft/realtime ;
- transparence Guest ;
- migration attention non destructive.

Ensuite : data/security contract + E2E matrix + wireframe V0.2 avant implémentation.
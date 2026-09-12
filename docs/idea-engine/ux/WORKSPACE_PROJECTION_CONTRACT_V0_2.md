# 4b4c — IDEA WORKSPACE PROJECTION CONTRACT — V0.2

Date : 2026-09-13

Statut : **CANDIDATE UX CONTRACT — NON VALIDÉ FONCTIONNELLEMENT**

Portée : premier workspace utile et projection UX de l’Idea Decision Dossier après la Capture V5.

Ce document complète, sans les remplacer :

- `IDEA_ENGINE_MASTER_BLUEPRINT_V1.md` ;
- `INFORMATION_MATRIX_V5_OUTPUT_DRIVEN.md` ;
- `CAPTURE_INGESTION_MEMORY_CONTRACT_V1_2.md` ;
- `CAPTURE_UX_V5_VALIDATED.md`.

En cas de contradiction sur l’orchestration, les Requirements, la Readiness ou la Next Best Action, le Master Blueprint prévaut.

---

# 1. Pourquoi ce contrat existe

Le moteur Idea peut être correct tout en donnant une mauvaise expérience à un novice.

Une UX purement dérivée de `Outputs → Requirements → Actions` peut devenir trop abstraite : le système sait exactement ce qu’il fait, mais l’utilisateur ne comprend plus où il en est, si quelque chose avance, ni ce qu’on attend réellement de lui.

Ce contrat ajoute donc une couche d’**accompagnement novice** sans recréer de wizard.

Objectif utilisateur permanent :

> **Je comprends ce que 2b2c fait pour mon idée, ce qui vient d’avancer, si j’ai quelque chose à faire maintenant, pourquoi cela compte, et ce que cela devrait permettre ensuite.**

Le produit ne montre jamais la complexité complète du moteur pour prouver qu’il travaille.

---

# 2. Modèle mental utilisateur

Le moteur interne est non linéaire.

L’expérience utilisateur peut néanmoins conserver une narration simple :

> **Je donne ce que je sais → 2b2c travaille avec ce qu’il peut résoudre seul → il ne me demande que ce qui a réellement besoin de moi → mon idée devient progressivement plus claire et concrète → quand assez d’éléments existent, je peux prendre une vraie décision.**

Cette narration :

- n’est pas une machine à états ;
- n’implique aucun ordre obligatoire O1→O9 ;
- ne crée pas de phases visibles ;
- ne crée pas de barre de progression globale ;
- n’empêche pas une mauvaise idée d’aboutir rapidement à `STOP` ;
- n’empêche pas un brief riche de progresser sans question humaine.

---

# 3. Les cinq projections canoniques du workspace

Le workspace ne doit pas afficher les objets internes du moteur tels quels. Il dérive cinq projections compréhensibles.

## P1 — `ORIENTATION_NOW`

**Toujours disponible.**

Répond à :

- où en est utilement l’Idée maintenant ?
- que travaille 2b2c ?
- quel est l’horizon immédiat ?

Ce n’est jamais une étape ou une phase globale.

Bon exemple :

> Votre idée est assez claire pour que je puisse analyser votre site actuel et vos références sans vous solliciter maintenant.

Mauvais exemple :

> Étape 2/5 — Renforcement.

## P2 — `PROGRESS_SIGNAL`

**Conditionnel et événementiel.**

Répond à :

> Qu’est-ce qui vient réellement d’avancer ?

Un signal de progrès doit représenter une conséquence utilisateur, par exemple :

- une inconnue importante résolue ;
- une source utile exploitée ;
- une contradiction détectée ou résolue ;
- une Candidate devenue formulable ;
- un risque important identifié ;
- une recommandation substantiellement modifiée ;
- une information désormais inutile à redemander.

Ne pas utiliser comme progrès :

- `analyse terminée` ;
- `3 tâches système exécutées` ;
- `LLM appelé` ;
- `72 % du dossier complété` ;
- une reformulation cosmétique sans nouvelle conséquence.

Le signal est court et ne devient pas un flux d’activité envahissant.

## P3 — `ATTENTION_NOW`

**Conditionnel. Peut être absent.**

Répond à :

> Y a-t-il quelque chose d’important que je devrais comprendre maintenant ?

Il peut s’agir :

- d’un conflit de sources ;
- d’un risque qui change une recommandation ;
- d’une hypothèse fragile devenue décisionnelle ;
- d’un changement majeur dans l’Idée ;
- d’un Blueprint mismatch ;
- d’un résultat IA devenu périmé ;
- d’une impossibilité réelle d’avancer honnêtement sur un output actif.

`ATTENTION_NOW` ne signifie pas nécessairement que l’utilisateur doit agir.

## P4 — `USER_NEXT_ACTION`

**Zéro ou une seule action humaine dominante.**

Répond à :

> De quoi 2b2c a-t-il réellement besoin de moi maintenant ?

Une action humaine est justifiée uniquement si l’humain est la meilleure voie raisonnable après application de l’Acquisition Engine.

Types principaux :

- répondre à une information que seul l’humain peut connaître ;
- arbitrer entre options ;
- résoudre un conflit important ;
- confirmer une hypothèse devenue engageante ;
- autoriser un accès, une dépense ou une conséquence sensible ;
- rendre une décision explicite.

Le produit ne transforme jamais plusieurs Requirements en une liste de devoirs utilisateur.

## P5 — `NEXT_VALUE_HINT`

**Orientation prospective, non contractuelle.**

Répond à :

> Qu’est-ce que le travail actuel devrait permettre d’obtenir ensuite ?

Exemples :

> Cela devrait me permettre de comparer deux directions de site sur des bases plus solides.

> Après l’analyse des documents, je devrais pouvoir vous proposer une première structure cohérente sans vous redemander ce qu’ils contiennent déjà.

Ce hint :

- ne promet jamais qu’un output sera prêt ;
- n’annonce jamais une “étape suivante” ;
- peut être omis si l’état est trop incertain ;
- utilise une formulation prudente lorsque la suite dépend encore de résultats non connus.

---

# 4. Projection dominante du workspace

Le workspace ne doit pas nécessairement afficher cinq blocs correspondant aux cinq projections.

La composition visuelle est libre tant que l’utilisateur peut répondre rapidement à quatre questions :

1. **Que se passe-t-il pour mon idée ?**
2. **Est-ce que quelque chose vient réellement d’avancer ?**
3. **Est-ce que je dois faire quelque chose ?**
4. **Pourquoi cela compte / qu’est-ce que cela permettra ?**

Baseline basse fidélité à tester :

- zone dominante `2b2c maintenant` ;
- éventuel `Ce qui vient d’avancer` ;
- éventuelle action utilisateur intégrée dans la zone dominante ;
- résumé `Acquis pour l’instant` consultable ;
- `À vérifier / Peut attendre` seulement si utile ;
- sources/provenance accessibles à la demande ;
- composer naturel permanent.

Ne pas multiplier les cartes si deux informations peuvent être expliquées dans la même surface.

---

# 5. Contrat de la zone dominante `2b2c maintenant`

La zone dominante doit pouvoir contenir, selon l’état :

- une phrase d’orientation ;
- le travail autonome actuellement pertinent ;
- un point d’attention ;
- une seule action humaine ;
- un pourquoi / impact ;
- un hint sur la valeur attendue ensuite.

Elle ne doit jamais devenir :

- une console de jobs ;
- une liste complète des Outputs ;
- une checklist Matrix ;
- un résumé encyclopédique du dossier ;
- un tableau de progression artificiel.

### Format mental recommandé

`Maintenant → Pourquoi → Ensuite`

Cette structure peut expliquer une situation locale, mais ne représente jamais les phases globales de l’Idea.

Exemple :

> **Maintenant** — J’ai besoin de savoir si votre priorité est d’obtenir davantage de rendez-vous ou surtout de moderniser votre image.
>
> **Pourquoi** — Ce choix change la structure, les appels à l’action et la manière dont j’évaluerai votre site actuel.
>
> **Ensuite** — Je pourrai analyser l’existant avec le bon objectif.

---

# 6. Contrat du progrès perceptible

Le produit doit donner une sensation d’avancement sans faux score global.

Le progrès est exprimé par **les conséquences**.

Exemples :

> J’ai trouvé dans votre présentation vos trois offres principales. Je ne vous les redemanderai pas.

> Votre objectif est maintenant clair : obtenir plus de rendez-vous, pas seulement moderniser l’image. Je peux évaluer votre site actuel selon cet objectif.

> La contradiction est résolue : le B2B reste votre historique, mais le nouveau site doit prioritairement développer les particuliers. J’adapte la proposition dans ce sens.

### Règles

- un signal doit être compréhensible sans vocabulaire produit ;
- il doit relier une nouvelle information à une nouvelle capacité du système ;
- il peut mentionner ce que l’utilisateur n’aura plus à répéter ;
- il ne doit pas transformer chaque micro-changement en notification ;
- il doit être remplacé/atténué après lecture pour éviter un journal permanent.

---

# 7. Contrat de l’action humaine dominante

Toute `USER_NEXT_ACTION` visible contient si nécessaire :

- la demande en langage courant ;
- une raison courte si elle n’est pas évidente ;
- les conséquences principales d’un choix engageant ;
- des réponses rapides lorsque pertinent ;
- une réponse libre possible ;
- un Rescue Path.

### Exemple

> **Quel public voulez-vous réellement privilégier avec ce nouveau site ?**
>
> Votre ancien deck parle surtout d’entreprises, mais votre description récente parle de particuliers. Cette différence change fortement le contenu et le parcours.
>
> `Particuliers` · `Entreprises` · `Les deux` · `Je ne sais pas encore`

Ne pas afficher en parallèle cinq autres questions non bloquantes.

---

# 8. Rescue Path — aucune impasse novice

Lorsqu’une question humaine est nécessaire, 2b2c prévoit au moins les issues légitimes parmi :

- `Je ne sais pas` ;
- `Proposer pour moi` ;
- `Plus tard` ;
- `Pourquoi cette question ?` ;
- fournir une source ;
- reformuler la question ;
- accepter temporairement une hypothèse ;
- accepter explicitement l’inconnue.

Le Rescue Path dépend du Requirement : toutes les options ne sont pas toujours légitimes.

`Je ne sais pas` ne doit jamais produire un cul-de-sac générique.

2b2c doit tenter :

1. mémoire/source ;
2. proposition guidée ;
3. hypothèse réversible ;
4. unknown accepté ;
5. report explicite si la décision peut attendre.

---

# 9. Hypothèses : avancer sans confirmation fatigue

Une hypothèse réversible et non engageante peut être utilisée sans demander immédiatement une confirmation.

Exemple :

> Pour avancer, je pars pour l’instant de l’hypothèse que votre clientèle est principalement locale autour de Lyon. Vous pourrez me corriger à tout moment.

Le moteur conserve explicitement :

- provenance `AI_INFERRED` ;
- niveau de confiance ;
- outputs qui l’utilisent ;
- seuil de validation exigé par les Requirements concernés.

Une hypothèse doit être remontée à l’utilisateur lorsqu’elle devient :

- décisionnelle ;
- difficilement réversible ;
- contradictoire avec une source forte ;
- sensible ;
- suffisamment incertaine pour changer substantiellement une recommandation.

Ne jamais transformer silencieusement l’hypothèse en fait confirmé.

---

# 10. Travail autonome et traitements longs

Plusieurs `SYSTEM_NEXT_ACTIONS` peuvent continuer sans intervention humaine.

Le workspace ne doit pas bloquer l’utilisateur sur une page d’attente si le traitement n’est pas indispensable à l’action actuelle.

### État non bloquant acceptable

> J’analyse encore vos trois documents. Vous pouvez continuer : j’intégrerai les éléments utiles dès qu’ils seront disponibles.

### État bloquant acceptable

Uniquement si le prochain rendu demandé dépend réellement du résultat :

> J’ai besoin de terminer la vérification de cette source avant de vous recommander une direction. Vous pouvez continuer à discuter avec 2b2c pendant ce traitement.

### Interdits

- faux pourcentage ;
- spinner plein écran prolongé ;
- obligation de rester sur la page ;
- sérialisation artificielle des jobs ;
- masquer un échec derrière un “traitement en cours”.

### Sur fin de traitement

Une fin de traitement ne produit un `PROGRESS_SIGNAL` que si elle change réellement l’IDD, un Requirement, un Output ou la recommandation.

---

# 11. Erreurs et dégradation gracieuse

L’échec d’une capacité IA/recherche/extraction ne doit jamais :

- supprimer les données RAW ;
- faire perdre les réponses ;
- bloquer tout le workspace si d’autres actions restent possibles ;
- simuler un résultat.

Message utilisateur attendu :

> Je n’ai pas pu vérifier cette source pour le moment. Le reste de votre dossier est conservé et je peux continuer avec les éléments déjà fiables.

Le système peut proposer :

- réessayer ;
- fournir une autre source ;
- continuer sans cette information si le Requirement le permet ;
- différer.

---

# 12. `Acquis pour l’instant`

Cette zone montre des **informations utiles**, pas des métadonnées de moteur.

Exemples :

- objectif prioritaire ;
- audience actuellement comprise ;
- contrainte importante ;
- élément de l’existant ;
- préférence forte ;
- décision déjà prise ;
- source importante exploitée.

L’affichage :

- reste compact par défaut ;
- est modifiable/corrigeable ;
- distingue une hypothèse d’un fait lorsque la différence importe ;
- permet l’accès à la provenance à la demande ;
- ne cherche pas à montrer toute Matrix V5.

---

# 13. `À vérifier / Peut attendre`

Cette projection est secondaire.

Elle n’existe que si elle aide l’utilisateur à comprendre pourquoi certaines choses ne sont pas demandées maintenant.

Exemple :

> **Peut attendre** — vos préférences d’animation n’ont pas besoin d’être décidées maintenant pour juger la direction du site.

Ne pas transformer cette zone en backlog caché de questions futures.

---

# 14. Composer naturel permanent

Le workspace conserve une entrée naturelle accessible :

> `Dites à 2b2c ce que vous voulez ajouter, corriger, demander ou explorer…`

L’utilisateur peut à tout moment :

- ajouter une information ;
- corriger une hypothèse ;
- changer d’objectif ;
- fournir une source ;
- demander une explication ;
- demander une Candidate/projection ;
- contester une recommandation ;
- signaler un décideur/associé ;
- dire qu’il ne sait pas.

Toute nouvelle information déclenche la Change Intelligence ; elle ne “ramène” jamais à une ancienne étape.

---

# 15. Retour après absence

Lorsqu’un utilisateur revient après une période significative, l’orientation privilégie :

1. ce qui a changé depuis sa dernière présence ;
2. les traitements qui ont produit une conséquence utile ;
3. les conflits/risques nouveaux ;
4. l’éventuelle action humaine dominante ;
5. la prochaine valeur plausible.

Exemple :

> Depuis votre dernière visite, j’ai analysé vos deux documents et trouvé une contrainte qui change la recommandation : votre offre principale doit rester compatible avec la prise de rendez-vous téléphonique. J’ai ajusté la Candidate. Rien d’autre ne vous est demandé pour le moment.

Ne pas rejouer tout l’historique du dossier.

---

# 16. Collaboration et décideurs

Solo et équipe conservent le même contrat de projection.

Si un associé, client, comité ou décideur est mentionné :

- ne pas ouvrir automatiquement un workflow collaboratif complet ;
- identifier seulement si sa contribution devient un Decision Requirement ;
- exposer un désaccord lorsqu’il change un output ou une décision ;
- séparer avis, evidence et décision formelle ;
- ne jamais présenter la majorité d’avis comme une décision implicite.

---

# 17. Confiance et provenance

La provenance reste accessible mais n’envahit pas le workspace.

Formats utilisateurs possibles :

- `D’après votre document “Présentation commerciale 2025”…` ;
- `Vous m’avez indiqué…` ;
- `J’ai trouvé sur le site officiel…` ;
- `Hypothèse de travail…` ;
- `Calculé à partir de…`.

Une information contradictoire ou sensible doit rendre sa provenance plus visible.

Le détail technique complet reste consultable à la demande.

---

# 18. Cas du premier état utile après `Commencer avec 2b2c`

Le premier workspace dépend de l’état réel.

## Cas A — idée très pauvre

Orientation : 2b2c explique ce qu’il a compris sans répéter tout le texte.

Action : une seule question à fort gain.

Rescue : `Je ne sais pas` / proposition guidée.

## Cas B — capture aidée par 2b2c

Ne pas relire immédiatement la description enrichie.

Le workspace doit apporter une nouvelle valeur : travail autonome, point d’attention, hypothèse explicite ou prochaine question réellement nouvelle.

## Cas C — brief riche + sources

Aucune question humaine si le moteur peut progresser seul.

Orientation : ce que 2b2c va exploiter et pour quoi.

Progress : signaux au fur et à mesure des conséquences utiles.

## Cas D — conflit important détecté

`ATTENTION_NOW` devient dominant.

S’il exige un arbitrage humain, il porte l’unique `USER_NEXT_ACTION`.

## Cas E — aucune action humaine immédiate

Le produit doit explicitement dire que l’utilisateur n’a rien à faire **et montrer que le dossier avance quand même**.

## Cas F — idée déjà manifestement disproportionnée

2b2c peut challenger/simplifier immédiatement.

Ne pas forcer une progression vers une Candidate coûteuse si une alternative plus simple peut déjà changer la décision.

## Cas G — décideur/associé déjà mentionné

La gouvernance est prise en compte sans transformer immédiatement le workspace en outil de réunion.

---

# 19. Règles de charge cognitive

Pour un novice :

- une seule question/action dominante ;
- maximum une raison principale visible avant expansion ;
- formulations courtes ;
- exemples concrets lorsque l’utilisateur peut ne pas comprendre la question ;
- progressive disclosure des sources, unknowns et détails ;
- aucun jargon `Output`, `Requirement`, `Readiness`, `Information Item`, `NBA`, `Blueprint` dans l’interface normale ;
- aucune matrice complète ;
- aucun “tableau de bord de santé” décoratif ;
- pas de listes longues de choses “à faire plus tard”.

Le système doit donner l’impression :

> **2b2c porte le dossier ; l’utilisateur apporte uniquement ce que 2b2c ne peut pas légitimement résoudre seul.**

---

# 20. Contrat de microcopy

La microcopy doit :

- parler en conséquences ;
- distinguer certitude / hypothèse / inconnue ;
- éviter le ton scolaire ;
- ne pas féliciter artificiellement chaque clic ;
- ne pas présenter des traitements internes comme du progrès utilisateur ;
- dire clairement quand aucune action n’est demandée ;
- expliquer pourquoi une question mérite l’effort.

Préférer :

> J’ai trouvé les trois offres dans votre document. Inutile de les saisir de nouveau.

À :

> Extraction réussie : 3 items détectés.

Préférer :

> Je n’ai rien besoin de vous demander pour l’instant.

À :

> Aucun USER_NEXT_ACTION actif.

---

# 21. Anti-patterns interdits

- étapes `Clarifier → Renforcer → Étayer → Partager → Décider` ;
- barre de progression globale ;
- score arbitraire de complétude ;
- page d’analyse obligatoire ;
- liste de toutes les questions futures ;
- validation humaine de chaque petite inférence ;
- répétition du brief pour donner l’impression de valeur ;
- bouton humain pour déclencher toute recherche publique déjà justifiée ;
- confirmation “Oui/Non” de l’évidence ;
- afficher dix System Actions internes ;
- bloquer le workspace pour un traitement non critique ;
- cacher un conflit important pour préserver une narration fluide ;
- promettre une Candidate ou une maquette avant que les Requirements nécessaires ne soient suffisants ;
- présenter GO comme l’issue normale attendue.

---

# 22. États UI minimum à couvrir plus tard

La future surface devra couvrir au minimum :

- orientation seule ;
- orientation + travail autonome ;
- orientation + progress signal ;
- orientation + question humaine ;
- conflit critique ;
- hypothèse à confirmer ;
- accepted unknown ;
- traitement long non bloquant ;
- traitement bloquant ;
- erreur IA/recherche ;
- résultat stale ignoré ;
- retour après absence ;
- Candidate disponible ;
- recommandation de simplification ;
- Decision Brief prêt ;
- décision `LAUNCH / MODIFY / DEEPEN / PAUSE / STOP / INSUFFICIENT_INFO` ;
- Blueprint mismatch.

---

# 23. Critères d’acceptation fonctionnelle

Un prototype du workspace n’est validable que si :

1. un novice peut expliquer ce que 2b2c fait actuellement sans connaître le moteur ;
2. il sait immédiatement si une action lui est demandée ;
3. il ne voit jamais plus d’une action humaine dominante ;
4. une réponse produit une conséquence perceptible lorsque quelque chose change réellement ;
5. `Je ne sais pas` mène à une voie utile ;
6. un brief riche peut progresser sans questions artificielles ;
7. un traitement long n’impose pas une fausse étape ;
8. une hypothèse non critique peut permettre d’avancer sans confirmation immédiate ;
9. une hypothèse critique redevient visible avant une décision engageante ;
10. un conflit important est explicite ;
11. la provenance est accessible lorsque la confiance l’exige ;
12. le workspace reste utilisable après échec IA/recherche ;
13. un ancien résultat ne peut pas écraser visuellement un état plus récent ;
14. le retour après absence résume le delta utile, pas tout l’historique ;
15. l’interface ne matérialise aucune séquence obligatoire ;
16. une recommandation `STOP` ou `PAUSE` est aussi naturelle qu’un `LAUNCH`.

---

# 24. Ce que cette V0.2 ne fige pas encore

Cette version ne fige pas :

- layout haute fidélité ;
- direction artistique ;
- composants exacts ;
- navigation finale de l’espace Idea ;
- animation ;
- quotas/limites techniques ;
- architecture backend d’implémentation ;
- modèle de jobs asynchrones ;
- choix de fournisseur/modèle IA ;
- schéma SQL cible ;
- microcopy finale après tests utilisateurs.

Elle fixe uniquement le **contrat comportemental de projection et d’accompagnement novice** à tester.

---

# 25. Décision de conception candidate

Le workspace post-capture ne doit plus être conçu autour d’un bloc générique `FOCUS_NOW` suffisant à lui seul.

La projection candidate est désormais :

`ORIENTATION_NOW + [PROGRESS_SIGNAL] + [ATTENTION_NOW] + [USER_NEXT_ACTION] + [NEXT_VALUE_HINT]`

Les crochets indiquent des projections conditionnelles.

Ces projections sont dérivées du même moteur canonique :

`IDD → ACTIVE_OUTPUT_TARGETS → Requirements → SYSTEM_NEXT_ACTIONS / USER_NEXT_ACTION → deltas → UX Projection`.

Aucune nouvelle étape métier n’est introduite.

Cette V0.2 reste **candidate** jusqu’à validation fonctionnelle explicite après red-team et wireframes basse fidélité.

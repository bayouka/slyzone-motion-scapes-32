# 4b4c — RED TEAM — WORKSPACE PROJECTION CONTRACT V0.2

Date : 2026-09-13

Statut : **VALIDATION SUPPORT — NE CRÉE PAS D’AUTORITÉ CANONIQUE À LUI SEUL**

Objet : stress-test du contrat `WORKSPACE_PROJECTION_CONTRACT_V0_2.md` avant wireframes basse fidélité et avant toute validation fonctionnelle.

---

# 1. Question de test

Le contrat doit permettre à un utilisateur novice de :

- ne jamais se sentir perdu ;
- comprendre ce que fait 2b2c ;
- savoir immédiatement si quelque chose est attendu de lui ;
- ne pas subir de questionnaire déguisé ;
- percevoir un progrès réel ;
- conserver la confiance lorsque l’IA hésite, échoue ou se contredit ;
- revenir après une absence sans relire tout le dossier ;
- atteindre aussi naturellement `STOP/PAUSE` que `LAUNCH`.

Le test cherche activement à casser ces invariants.

---

# 2. Scénario R1 — Nathalie, idée très vague

## Entrée

> Je voudrais refaire mon site. Il fait vieux et je veux quelque chose de plus moderne.

Aucune source.

## Risque

Le système pourrait poser successivement audience, objectif, pages, style, fonctionnalités, budget, délai et devenir un formulaire conversationnel.

## Projection attendue

`ORIENTATION_NOW` : 2b2c explique qu’il peut déjà commencer à clarifier ce que le site doit réellement apporter.

`USER_NEXT_ACTION` : une seule question à fort gain, par exemple l’objectif prioritaire du site.

Rescue Path : `Je ne sais pas` → 2b2c propose quelques résultats concrets possibles au lieu de bloquer.

`NEXT_VALUE_HINT` : expliquer que cette réponse permettra d’évaluer les choix de structure et de conversion.

## Verdict

**PASS.** Le contrat empêche l’exposition de la Matrix complète et impose une seule action humaine.

---

# 3. Scénario R2 — Nathalie répond « je ne sais pas » trois fois

## Risque

Impasse ou répétition reformulée de la même question.

## Projection attendue

Après le premier `Je ne sais pas`, le Rescue Path change de stratégie : proposition guidée, hypothèse temporaire, ou accepted unknown si légitime.

2b2c peut dire :

> Je vais partir provisoirement de l’idée que le site doit surtout générer des prises de contact, car c’est l’objectif le plus compatible avec ce que vous m’avez décrit. Vous pourrez me corriger.

Cette information reste `AI_INFERRED`, pas `HUMAN_CONFIRMED`.

## Verdict

**PASS**, sous réserve que l’implémentation empêche réellement la boucle de reformulation infinie.

### Garde-fou à conserver

Une même information ne doit pas générer plus d’une sollicitation équivalente sans changement de stratégie d’acquisition.

---

# 4. Scénario R3 — Capture déjà construite avec l’aide de 2b2c

## Entrée

2b2c a posé quatre questions pendant la capture et enrichi la description visible.

## Risque

Le workspace affiche `J’ai compris que…` puis répète les mêmes informations, donnant l’impression de recommencer.

## Projection attendue

Pas de relecture obligatoire.

Le workspace doit montrer une **nouvelle conséquence** :

> Votre objectif principal et votre public sont déjà assez clairs. Je peux maintenant examiner votre site actuel sans vous redemander ces informations.

## Verdict

**PASS.** Explicitement couvert par V0.2.

---

# 5. Scénario R4 — Vincent, brief riche + 12 documents

## Entrée

Brief détaillé, site existant, analytics exportés, présentation commerciale, charte, captures et benchmark.

## Risque

Le système demande quand même “Quel est votre objectif ?” parce que le champ structuré n’est pas encore rempli, ou bloque sur une longue analyse.

## Projection attendue

Aucune question humaine tant que l’extraction/recherche peut résoudre les Requirements.

Orientation :

> Vous m’avez déjà donné assez de matière pour que je travaille seul pour l’instant. Je commence par relier vos objectifs, vos offres et les données de votre site afin d’identifier les points qui peuvent réellement changer la proposition.

Traitements longs non bloquants.

Progress signals seulement lorsque les documents produisent une conséquence utile.

## Verdict

**PASS.** Le contrat protège le principe “2b2c fait plus de travail que l’utilisateur”.

---

# 6. Scénario R5 — Aucune action humaine nécessaire pendant plusieurs minutes

## Risque

Workspace vide, impression que rien ne se passe, ou faux spinner.

## Projection attendue

`ORIENTATION_NOW` reste utile.

> Je n’ai rien besoin de vous demander pour l’instant. J’analyse les éléments que vous avez fournis pour comparer les directions possibles.

`NEXT_VALUE_HINT` prudent.

Le produit reste navigable et le composer disponible.

## Verdict

**PASS.** C’est l’un des apports essentiels de V0.2.

---

# 7. Scénario R6 — Conflit B2B / particuliers

## Entrée

Deck 2024 : 80 % B2B.

Description actuelle : développer les particuliers.

## Risque

2b2c choisit silencieusement la source la plus récente ou demande plusieurs questions connexes.

## Projection attendue

`ATTENTION_NOW` dominant.

Une seule `USER_NEXT_ACTION` : arbitrer la cible prioritaire.

Le conflit est expliqué avec provenance lisible.

Les autres questions sont différées.

## Verdict

**PASS.**

---

# 8. Scénario R7 — Conflit détecté mais non décisionnel

## Entrée

Deux documents divergent sur une préférence de couleur, alors qu’aucune projection visuelle n’est active.

## Risque

Le système interrompt inutilement l’utilisateur.

## Projection attendue

Pas de `ATTENTION_NOW` dominante.

Le conflit peut rester en mémoire comme non bloquant et réapparaître uniquement si O6 ou un output concerné devient actif.

## Verdict

**PASS**, à condition que l’implémentation lie bien le conflit aux Requirements actifs plutôt qu’à la seule existence d’une contradiction.

---

# 9. Scénario R8 — Mauvaise idée / solution disproportionnée

## Entrée

Le besoin réel est simple mais l’utilisateur propose une plateforme complexe coûteuse.

## Risque

Le produit cherche à “compléter le dossier” au lieu de challenger tôt.

## Projection attendue

2b2c peut immédiatement afficher :

> La solution que vous imaginez semble beaucoup plus complexe que le besoin décrit. Avant de l’approfondir, je vous recommande de comparer une version beaucoup plus simple qui pourrait atteindre le même objectif.

`USER_NEXT_ACTION` seulement si un arbitrage humain est réellement nécessaire.

## Verdict

**PASS.** Compatible avec `CHALLENGE / SIMPLIFY` comme capacités non séquentielles.

---

# 10. Scénario R9 — Demande prématurée de maquette

## Entrée

> Fais-moi déjà une maquette.

## Risque

Refus rigide ou projection trompeuse.

## Projection attendue

Le moteur active O6 si possible.

Si les inconnues ne sont pas critiques, il produit une projection clairement présentée comme exploratoire.

Si un blocker critique rendrait la maquette trompeuse, il explique le point minimal nécessaire avant de matérialiser.

## Verdict

**PASS.** Le contrat reste compatible avec `ACTIVE_OUTPUT_TARGETS` sans retour à une ancienne étape.

---

# 11. Scénario R10 — Traitement long de quatre minutes

## Risque

Page bloquée, faux pourcentage ou utilisateur qui pense devoir attendre.

## Projection attendue

Message non bloquant + possibilité de continuer à discuter/naviguer.

Aucun pourcentage inventé.

À la fin, pas de toast “analyse terminée” si rien de substantiel n’a changé.

## Verdict

**PASS.**

---

# 12. Scénario R11 — Échec du moteur de recherche

## Risque

L’utilisateur croit que son dossier a échoué ou reçoit une réponse inventée.

## Projection attendue

> Je n’ai pas pu vérifier cette source pour le moment. Votre dossier est intact et je peux continuer avec les éléments déjà fiables.

Retry ou alternative proposée uniquement si utile.

## Verdict

**PASS.**

---

# 13. Scénario R12 — Ancienne analyse revient après modification utilisateur

## Entrée

Analyse A part sur version 5.

Utilisateur change la cible → version 6.

Analyse A se termine ensuite.

## Risque

Ancien résultat affiché comme progrès et réintroduit l’ancienne cible.

## Projection attendue

Le résultat stale n’est pas promu comme état actif.

Il peut être journalisé techniquement, mais ne produit pas de `PROGRESS_SIGNAL` utilisateur.

## Verdict

**PASS conceptuel**, dépend fortement de la future architecture stale-safe fine.

---

# 14. Scénario R13 — Changement majeur tardif

## Entrée

Particuliers → entreprises après une Candidate déjà produite.

## Risque

Réinitialisation totale ou maintien silencieux d’une Candidate invalide.

## Projection attendue

`PROGRESS_SIGNAL` / `ATTENTION_NOW` :

> Ce changement affecte le positionnement, le parcours et plusieurs contenus. Je conserve vos contraintes de marque et vos éléments techniques, mais je réévalue la proposition commerciale.

Ne pas revenir à une étape “Audience”.

## Verdict

**PASS.**

---

# 15. Scénario R14 — Retour après deux semaines

## Risque

Résumé de tout le dossier ou utilisateur obligé de se souvenir de ce qu’il faisait.

## Projection attendue

Delta depuis la dernière présence :

- résultat des traitements terminés ;
- changements substantiels ;
- éventuelle action actuelle ;
- prochaine valeur.

## Verdict

**PASS.**

---

# 16. Scénario R15 — Hypothèse raisonnable mais non confirmée

## Entrée

Les éléments suggèrent une clientèle locale.

## Risque

Confirmation fatigue ou hypothèse présentée comme fait.

## Projection attendue

2b2c avance avec une hypothèse explicitement réversible.

La confirmation n’est demandée que si un Requirement exige un niveau supérieur de validation.

## Verdict

**PASS.**

---

# 17. Scénario R16 — Hypothèse devient critique

## Entrée

La localisation supposée commence à déterminer une recommandation SEO/local business très engageante.

## Risque

Le système conserve silencieusement l’hypothèse initiale.

## Projection attendue

L’hypothèse remonte en `ATTENTION_NOW` et peut devenir l’unique `USER_NEXT_ACTION` si aucune source fiable ne la confirme.

## Verdict

**PASS.**

---

# 18. Scénario R17 — Maya, associé en désaccord

## Entrée

Un associé est mentionné et n’est pas d’accord sur la cible.

## Risque

Déclenchement automatique d’un workflow équipe lourd ou moyenne des opinions.

## Projection attendue

2b2c identifie le désaccord comme Decision Requirement seulement s’il doit être résolu avant décision.

Les avis restent distincts.

Pas de majorité implicite = décision.

## Verdict

**PASS.**

---

# 19. Scénario R18 — 9 inconnues humaines simultanées

## Risque

Le produit affiche neuf questions ou une checklist.

## Projection attendue

Le moteur classe les gains d’information et blockers.

Une seule `USER_NEXT_ACTION` visible.

Les autres restent invisibles ou dans `Peut attendre` seulement si cela aide réellement à comprendre.

## Verdict

**PASS.**

---

# 20. Scénario R19 — L’utilisateur ajoute une information spontanée hors sujet courant

## Entrée

Pendant une question d’audience :

> Au fait, je déteste les animations automatiques.

## Risque

Perte de l’information ou interruption forcée du focus.

## Projection attendue

L’information est classée immédiatement dans la mémoire avec provenance humaine.

La question dominante reste la même si cette préférence ne change pas le Requirement actif.

Un petit feedback peut confirmer l’enregistrement sans détourner l’utilisateur.

## Verdict

**PASS.**

---

# 21. Scénario R20 — Blueprint mismatch

## Entrée

L’idée de “site vitrine” évolue vers marketplace avec comptes vendeurs, paiement et matching.

## Risque

Le moteur continue à appliquer Matrix V5 et donne une fausse impression de couverture.

## Projection attendue

`ATTENTION_NOW` :

> Votre idée a changé de nature : elle ressemble maintenant davantage à une marketplace qu’à un site vitrine. Le cadre actuel ne couvre pas correctement tous les besoins de ce type de produit.

Le moteur conserve l’historique et n’invente pas de readiness.

## Verdict

**PASS.**

---

# 22. Scénario R21 — Décision STOP très tôt

## Entrée

Une contrainte réglementaire ou économique détruit l’intérêt du projet avant Candidate détaillée.

## Risque

Le système poursuit artificiellement pour “terminer”.

## Projection attendue

O7 peut devenir suffisamment prêt pour une décision `STOP` sans compléter O3/O4/O6.

Le workspace peut recommander l’arrêt avec preuves, hypothèses et incertitudes explicites.

## Verdict

**PASS.**

---

# 23. Scénario R22 — Utilisateur demande “où j’en suis ?”

## Risque

Réponse technique ou score arbitraire.

## Projection attendue

Réponse narrative :

- ce qui est déjà assez clair ;
- ce que 2b2c est en train de résoudre ;
- ce qui empêche éventuellement une décision ;
- si quelque chose est demandé à l’utilisateur.

Pas de `67 % terminé`.

## Verdict

**PASS.**

---

# 24. Scénario R23 — Trop de progress signals

## Entrée

Douze sources terminent presque simultanément.

## Risque

Le workspace devient une timeline technique bruyante.

## Projection attendue

Agrégation par conséquence :

> J’ai terminé l’analyse des documents commerciaux. Ils confirment vos trois offres principales et font apparaître une contrainte de prise de rendez-vous qui change la structure recommandée.

Pas douze notifications.

## Verdict

**PASS après clarification.** Ce comportement doit être explicitement respecté par la future implémentation.

---

# 25. Scénario R24 — `NEXT_VALUE_HINT` devient promesse trompeuse

## Entrée

Le système dit : “Ensuite je vous proposerai une maquette”, mais un conflit futur empêche cette sortie.

## Risque

Sentiment de régression et perte de confiance.

## Projection attendue

Formulation probabiliste :

> Cela devrait me permettre de préparer une première direction visuelle si les éléments analysés ne font pas apparaître de contradiction importante.

Ou omission du hint lorsque l’incertitude est forte.

## Verdict

**PASS**, grâce à la règle V0.2 qui rend le hint non contractuel et omissible.

---

# 26. Défauts résiduels identifiés

Le contrat résiste aux scénarios principaux, mais quatre points devront être prouvés dans les wireframes/prototypes :

1. **Densité de la zone dominante** — `Orientation + Pourquoi + Action + Ensuite` peut devenir trop verbeux sur mobile ; la hiérarchie devra limiter ce qui est visible sans expansion.
2. **Agrégation des Progress Signals** — plusieurs traitements parallèles doivent se condenser par conséquence, pas par job.
3. **Équilibre transparence/simplicité** — la provenance doit être très accessible pour les conflits sans envahir les cas simples.
4. **Absence d’action humaine** — il faudra vérifier visuellement que “vous n’avez rien à faire” paraît rassurant et actif, pas vide/passif.

Ces points ne remettent pas en cause le moteur ; ils sont des sujets de projection basse fidélité.

---

# 27. Verdict Red Team

**PASS AVEC POINTS DE PREUVE UX À TRAITER DANS LES WIREFRAMES.**

Aucune contradiction structurelle nécessitant de rouvrir :

- Master Blueprint V1.1 ;
- Matrix V5 ;
- Capture Contract V1.2 ;
- Capture UX V5.

La V0.2 corrige le défaut principal du contrat précédent : elle ajoute orientation permanente, progrès par conséquences, Rescue Path explicite et gestion claire de l’absence d’action humaine sans réintroduire de workflow séquentiel.

Elle peut maintenant servir de base à des **wireframes basse fidélité adaptatifs**, à condition de rester `CANDIDATE` jusqu’à validation fonctionnelle explicite par l’utilisateur.

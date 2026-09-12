# 4b4c — CONTRAT CANONIQUE CAPTURE → INGESTION → MÉMOIRE — V1.1

## 0. Statut et autorité

Ce document est **canonique et normatif** pour toute conception UX, implémentation frontend/backend et orchestration IA liée à la capture initiale d’une Idée.

Il **supersède V1.0** sans supprimer son historique. Il complète `WORKFLOW_V7_1_CONSOLIDATED.md` et `INFORMATION_MATRIX_V4_1.md`.

La Capture UX basse fidélité V5 a été validée fonctionnellement le 2026-09-12. Son snapshot de référence se trouve dans `docs/idea-engine/ux/CAPTURE_UX_V5_VALIDATED.md`.

Ce contrat fixe la logique. Le snapshot UX fixe la forme fonctionnelle validée. Ni l’un ni l’autre ne fige encore la direction artistique finale.

## 1. Objectif produit

L’utilisateur ne doit jamais avoir à savoir « faire un bon brief » pour utiliser correctement 4b4c.

Il doit pouvoir commencer avec :

- rien ou presque ;
- deux phrases ;
- un texte très détaillé ;
- plusieurs liens ;
- plusieurs images ;
- plusieurs documents ;
- des réponses obtenues avec l’aide guidée de 2b2c.

Plus l’utilisateur apporte d’informations utiles tôt, plus 2b2c doit les exploiter pour réduire les sollicitations suivantes.

Le système doit **accompagner sans transformer la capture en cahier des charges ou questionnaire obligatoire**.

## 2. RAW FIRST — persister avant d’analyser

Dès l’écran de création :

1. créer l’`IDEA` brouillon ;
2. autosauvegarder le nom ;
3. autosauvegarder la description libre et ses versions ;
4. enregistrer chaque lien ajouté ;
5. stocker les fichiers/images et créer leur référence source ;
6. conserver séparément les réponses guidées ;
7. seulement ensuite autoriser une analyse IA sur une version identifiable.

Aucun appel LLM n’est nécessaire pour garantir la sauvegarde.

La persistance des données ne dépend jamais du succès de l’IA.

## 3. UX d’entrée validée — une seule porte d’entrée

L’écran présente une seule capture principale, pas deux modes `Rapide / Approfondi`.

Libellé utilisateur :

> **Parlez-nous de votre idée** `?`

Placeholder court :

> `Décrivez simplement ce que vous avez en tête…`

Le `?` est un vrai contrôle accessible au clic/touch, pas un tooltip uniquement au hover. Il ouvre une aide courte :

> **Que puis-je écrire ici ?**
>
> Ce que vous voulez créer, pour qui, pourquoi, ce que vous imaginez déjà, vos contraintes ou vos inspirations.
>
> Vous n’avez pas besoin de tout savoir : écrivez simplement ce que vous avez en tête.
>
> Plus vous partagez d’informations utiles maintenant, moins 2b2c aura besoin de vous poser de questions ensuite.

Le texte d’aide n’encombre pas en permanence le champ principal.

## 4. Aide guidée facultative — `M’aider à préciser mon idée`

Sous la description libre, une aide facultative est proposée :

> **Besoin d’un coup de main ?**
>
> `M’aider à préciser mon idée`

Cette aide n’est **pas** :

- un formulaire obligatoire ;
- un second parcours ;
- un questionnaire fixe ;
- un moyen de faire compléter toute la Matrice V4.1.

Elle utilise le même moteur adaptatif que le reste de 2b2c.

### 4.1 Avant toute question guidée

2b2c vérifie ce qui est déjà connu dans :

- description libre ;
- réponses déjà fournies ;
- liens/sources ;
- documents/images analysables ;
- mémoire existante.

Une information déjà connue n’est pas redemandée.

### 4.2 Questions guidées

2b2c ne propose que quelques questions susceptibles de rendre l’idée suffisamment compréhensible pour commencer.

Exemples de domaines possibles, selon ce qui manque réellement :

- ce que l’utilisateur veut créer ;
- ce qu’il veut obtenir ;
- à qui cela doit servir ;
- ce que les utilisateurs devraient pouvoir faire ;
- premières envies visuelles ;
- contraintes ou validation importante.

Le nombre n’est pas un quota visible. L’aide s’arrête dès que la compréhension initiale est suffisante.

L’utilisateur peut toujours répondre :

> `Je ne sais pas / plus tard`

Une réponse différée reste en état explicite ; elle n’est pas supprimée.

## 5. L’aide IA peut compléter la description visible

Oui : l’aide guidée peut partir d’une description vide, courte ou partielle et produire une **description enrichie visible**.

Exemple :

- texte initial : `Je veux refaire mon site de sophrologie.`
- réponses guidées : public, objectif, préférences ;
- description enrichie : une reformulation claire et naturelle incorporant ces éléments.

### 5.1 Interdiction d’écrasement silencieux

La description enrichie ne remplace jamais les sources humaines dans la mémoire canonique.

Conserver au minimum :

- `RAW_DESCRIPTION_ORIGINAL` ;
- versions successives de la description éditée ;
- chaque `GUIDED_ANSWER` avec provenance humaine ;
- `AI_SYNTHESIZED_DESCRIPTION` avec provenance IA ;
- `CURRENT_DESCRIPTION` visible ;
- relation entre synthèse et entrées sources.

L’utilisateur voit clairement que 2b2c a complété sa description.

La description enrichie est :

- totalement éditable ;
- autosauvegardée ;
- réversible via une action du type `Revenir à ma description précédente` ;
- réanalysée de manière ciblée si elle change ensuite.

L’IA doit conserver un langage simple et proche de l’utilisateur. Elle ne transforme pas l’idée en jargon de consultant.

## 6. Extraction atomique multi-domaine

Une contribution n’appartient pas à « une étape ».

Un seul texte ou une seule réponse peut renseigner plusieurs domaines :

- WHY ;
- WHO ;
- WHAT ;
- CONSTRAINTS ;
- SCOPE ;
- FEATURES ;
- VISUAL PREFERENCES ;
- CONTENT/ASSETS ;
- REFERENCES ;
- DECISION REQUIREMENTS ;
- GOVERNANCE ;
- RISKS ;
- autres `information_key` de la Matrice.

Le moteur crée plusieurs memory items si nécessaire.

## 7. Comprendre l’intention, la négation, la modalité et le temps

La classification ne repose pas sur des mots-clés seuls.

Exemples :

- `Je déteste le rouge` → préférence négative / couleur à éviter ;
- `Mon ancien site était rouge` → fait historique ;
- `Le rouge pourrait être sympa` → piste / option ;
- `Je veux du rouge et orange` → préférence actuelle déclarée ;
- `J’aime le rouge mais je ne sais pas si ça irait` → piste appréciée mais non décidée.

Une ambiguïté reste ambiguë jusqu’à résolution légitime.

## 8. Préremplir ne signifie jamais figer

Une information donnée à la capture peut remplir un domaine qui ne deviendra visible que beaucoup plus tard.

Exemple : `rouge + orange + claymorphism` peut être enregistré dès la capture comme préférence actuelle.

Lorsque le domaine Design devient pertinent, 2b2c part de ce qui existe déjà :

> `Vous aviez indiqué rouge/orange et claymorphism. Est-ce toujours la direction à explorer ?`

Il ne redemande pas naïvement les mêmes informations.

Les états `CURRENT`, `PROPOSED`, `ACCEPTED_AS_CURRENT`, `CONFIRMED`, `FROZEN_IN_SNAPSHOT`, etc. restent gouvernés par le Workflow ; une extraction précoce ne crée pas automatiquement une décision figée.

## 9. Éléments ajoutés — trois familles utilisateur

Le contrôle utilisateur est :

> `+ Ajouter des éléments`

Le modal ne présente que trois familles :

### 9.1 Des liens

Plusieurs liens sont autorisés.

Pour chaque lien :

- URL ;
- rôle/contexte facultatif ;
- note utilisateur facultative.

Exemples de rôle :

- mon site actuel ;
- inspiration ;
- concurrent ;
- fonctionnalité intéressante ;
- autre référence.

Si le rôle n’est pas fourni, 2b2c peut essayer de l’inférer puis demander une confirmation seulement si nécessaire.

### 9.2 Des images

Ajout multiple autorisé.

Rôle/contexte facultatif, par exemple :

- inspiration visuelle ;
- logo ;
- site actuel ;
- maquette / croquis ;
- autre référence visuelle.

Une note peut préciser :

> `J’aime surtout les formes, pas les couleurs.`

Cette note humaine reste une source distincte et ne peut être écrasée par l’analyse visuelle IA.

### 9.3 Des documents

Ajout multiple autorisé.

Rôle/contexte facultatif, par exemple :

- brief / notes projet ;
- présentation ;
- étude / recherche ;
- données / tableau ;
- autre document projet.

Il n’existe plus de catégorie utilisateur `Autre fichier` séparée. Les formats exploitables appartiennent à Images ou Documents.

## 10. Formats, quantités et tailles

L’UX prévoit une allowlist réelle de formats supportés.

Baseline fonctionnelle envisagée pour validation technique :

- images : JPG/JPEG, PNG, WebP, HEIC/HEIF ;
- documents : PDF, DOCX, TXT, Markdown, PPTX, XLSX, CSV.

Les **limites exactes de nombre, taille par fichier et taille totale ne sont pas figées par ce contrat**. Elles doivent être décidées lors de l’architecture technique selon :

- stockage ;
- sécurité ;
- parser/extracteur disponible ;
- performances ;
- coûts ;
- contraintes réelles des fournisseurs IA.

Ne jamais inventer une promesse de prise en charge universelle.

L’interface ne surcharge pas l’écran principal avec les détails techniques ; elle expose `Formats et limites` à la demande et donne une erreur compréhensible lorsqu’un élément n’est pas accepté.

## 11. Feedback après ajout

Après stockage d’un élément, l’utilisateur doit comprendre pourquoi son ajout est utile.

Exemples :

- image → `2b2c pourra notamment l’utiliser pour comprendre vos préférences visuelles.`
- site actuel → `2b2c pourra examiner ce qui existe déjà.`
- document → `2b2c récupérera les informations utiles avant de vous poser des questions.`

Quand 2b2c identifie un rôle, celui-ci peut être affiché et corrigé par l’utilisateur.

## 12. `Commencer avec 2b2c` n’est pas `Sauvegarder`

Le CTA utilisateur validé est :

> **Commencer avec 2b2c**

La sauvegarde a déjà eu lieu.

Au clic :

1. flush des autosaves ;
2. vérification que les uploads engagés sont persistés ou explicitement en erreur ;
3. création du `capture_version` / snapshot initial ;
4. déclenchement de l’analyse 2b2c sur cette version ;
5. navigation possible vers le workspace ;
6. arrivée progressive des résultats d’analyse.

**Stockage avant navigation ; analyse après si nécessaire.**

## 13. Premier retour après analyse

Le premier retour doit prouver que 2b2c a exploité ce qui existe déjà.

Forme fonctionnelle attendue :

> **J’ai une première compréhension de votre idée.**

Puis :

- ce qui a déjà été compris ;
- ce qui a été retenu des réponses/sources pertinentes ;
- un message clair du type `Je vais m’appuyer dessus pour la suite : inutile de me le répéter.` ;
- une seule Next Best Action dominante si une intervention humaine est réellement nécessaire.

Éviter `Analyse terminée` comme seule réponse.

## 14. Answer Resolver avant toute nouvelle question

Avant de poser une question :

1. vérifier la mémoire ;
2. vérifier la description brute/originale et courante ;
3. vérifier les réponses guidées ;
4. vérifier les sources jointes ;
5. vérifier les extractions ;
6. vérifier les réponses antérieures ;
7. déterminer si l’information est recherchable/inférable ;
8. demander à l’humain seulement si encore nécessaire maintenant.

Une réponse riche peut résoudre plusieurs `information_key`.

## 15. Versions, idempotence et stale safety

Chaque analyse doit référencer la version de capture/source qu’elle traite.

Un résultat ancien arrivé après une version plus récente :

- peut rester historique ;
- peut être réutilisé après vérification si encore valable ;
- ne peut jamais écraser silencieusement l’état actif plus récent.

Les mutations importantes sont idempotentes et stale-safe.

## 16. Changement ultérieur = supersession ciblée

Exemple :

- ancienne préférence : rouge + orange ;
- nouvelle préférence : vert + beige.

L’ancienne information reste historique avec état approprié (`SUPERSEDED` si réellement remplacée). La nouvelle devient active selon les règles métier.

Change Intelligence réévalue uniquement les dépendances affectées.

## 17. Le document visible de l’Idée est une projection

Le « document de l’Idée » n’est pas un gros blob réécrit par le LLM.

La vérité canonique repose sur des objets structurés/versionnés :

- Idea ;
- raw/capture versions ;
- réponses guidées ;
- sources ;
- memory items ;
- provenance ;
- answers ;
- evidence ;
- recommendations ;
- snapshots ;
- decision requirements ;
- analysis runs.

La synthèse visible est une projection lisible de cet état.

## 18. Échec IA

Si l’analyse ou la synthèse échoue :

- l’Idée et les sources restent intactes ;
- les réponses guidées restent intactes ;
- l’utilisateur peut continuer à modifier ;
- l’analyse peut être relancée ;
- aucun résultat incomplet n’est promu silencieusement en vérité active.

## 19. QA obligatoire Capture V5

Tester au minimum :

1. champ initial vide + aide guidée ;
2. description minimale ;
3. description riche qui résout déjà plusieurs domaines ;
4. aide guidée qui ne repose pas les informations déjà présentes ;
5. `Je ne sais pas / plus tard` ;
6. synthèse IA qui enrichit la description visible ;
7. conservation du texte original + réponses + synthèse ;
8. retour à la description précédente ;
9. édition manuelle après enrichissement ;
10. négation et préférence incertaine ;
11. plusieurs liens avec rôles/notes différents ;
12. plusieurs images ;
13. plusieurs documents ;
14. élément sans contexte : 2b2c essaie de le comprendre sans bloquer ;
15. correction du rôle d’un élément ;
16. format non supporté ;
17. upload encore en cours au clic du CTA ;
18. fermeture navigateur avant CTA ;
19. échec IA ;
20. modification pendant analyse ;
21. résultat IA obsolète ;
22. absence de question redondante après analyse.

## 20. Interdictions pour toute implémentation future

Il est interdit de :

- transformer la capture en formulaire obligatoire ;
- imposer un choix `brief rapide / brief approfondi` ;
- utiliser le LLM comme mécanisme de sauvegarde ;
- analyser avant de persister la source brute concernée ;
- perdre les formulations humaines après structuration ;
- écraser silencieusement le texte original avec une synthèse IA ;
- poser à nouveau une question déjà résolue ;
- convertir une préférence en décision figée sans justification ;
- traiter `Autre fichier` comme promesse vague de prise en charge universelle ;
- faire dépendre la navigation de la fin de l’analyse IA ;
- écraser une version récente avec un résultat ancien ;
- traiter la synthèse visible comme l’unique base de vérité.

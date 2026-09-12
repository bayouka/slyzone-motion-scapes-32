# 4b4c — CONTRAT CANONIQUE CAPTURE → INGESTION → MÉMOIRE — V1.2

## 0. Statut et autorité

Ce document est **canonique et normatif** pour la capture initiale d’une Idée, sa persistance, son ingestion et son entrée dans le workspace.

Il **supersède V1.1** sans supprimer son historique.

La Capture UX basse fidélité V5 reste **validée fonctionnellement** et inchangée dans sa forme principale. Son snapshot de référence est :

`docs/idea-engine/ux/CAPTURE_UX_V5_VALIDATED.md`

V1.2 affine surtout l’orchestration derrière et immédiatement après `Commencer avec 2b2c` afin de l’aligner avec `IDEA_ENGINE_MASTER_BLUEPRINT_V1.md`.

Ce contrat fixe la logique ; le snapshot V5 fixe la forme fonctionnelle validée ; aucun des deux ne fige la direction artistique finale.

---

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

Plus il apporte d’informations utiles tôt, plus 2b2c doit les exploiter pour réduire les sollicitations suivantes.

La capture accompagne sans devenir un cahier des charges ou un questionnaire obligatoire.

---

## 2. RAW FIRST — persister avant toute analyse

Dès l’écran de création :

1. créer l’`IDEA` brouillon ;
2. autosauvegarder le nom ;
3. autosauvegarder la description libre et ses versions ;
4. enregistrer chaque lien ;
5. stocker les fichiers/images et créer leur source ;
6. conserver séparément les réponses guidées ;
7. seulement après persistance autoriser une analyse IA sur une version identifiable.

Aucun appel LLM n’est nécessaire pour garantir la sauvegarde.

La persistance ne dépend jamais du succès de l’IA.

---

## 3. UX d’entrée validée — une seule porte d’entrée

Libellé utilisateur :

> **Parlez-nous de votre idée** `?`

Placeholder :

> `Décrivez simplement ce que vous avez en tête…`

Le `?` est accessible au clic/touch et ouvre une aide courte :

> **Que puis-je écrire ici ?**
>
> Ce que vous voulez créer, pour qui, pourquoi, ce que vous imaginez déjà, vos contraintes ou vos inspirations.
>
> Vous n’avez pas besoin de tout savoir : écrivez simplement ce que vous avez en tête.
>
> Plus vous partagez d’informations utiles maintenant, moins 2b2c aura besoin de vous poser de questions ensuite.

Il n’existe pas de bifurcation `Brief rapide / Brief approfondi`.

---

## 4. Aide guidée facultative — `M’aider à préciser mon idée`

Sous la description :

> **Besoin d’un coup de main ?**
>
> `M’aider à préciser mon idée`

Cette aide n’est pas :

- un formulaire obligatoire ;
- un questionnaire fixe ;
- un deuxième parcours ;
- un moyen de faire remplir toute la Matrice.

Avant une question, 2b2c vérifie : description, réponses, sources, extractions et mémoire.

Il ne demande que ce qui peut rendre l’idée suffisamment compréhensible pour commencer.

L’utilisateur peut toujours répondre :

> `Je ne sais pas / plus tard`

Une information différée reste explicite et peut redevenir pertinente seulement si une future sortie ou décision l’exige.

---

## 5. L’aide IA peut compléter la description visible

L’aide guidée peut partir d’un champ vide, court ou partiel et produire une description enrichie naturelle.

Conserver séparément au minimum :

- `RAW_DESCRIPTION_ORIGINAL` ;
- versions de la description éditée ;
- chaque `GUIDED_ANSWER` avec provenance humaine ;
- `AI_SYNTHESIZED_DESCRIPTION` ;
- `CURRENT_DESCRIPTION` ;
- relations entre synthèse et entrées sources.

L’utilisateur voit que 2b2c a complété le texte.

La description enrichie est :

- éditable ;
- autosauvegardée ;
- réversible ;
- réanalysée seulement selon les dépendances réellement affectées.

L’IA conserve un langage simple et proche de celui de l’utilisateur.

---

## 6. Extraction atomique multi-domaine

Une contribution peut renseigner simultanément plusieurs domaines : WHY, WHO, WHAT, contraintes, scope, fonctionnalités, préférences visuelles, contenu/assets, références, gouvernance, risques, Decision Requirements, etc.

Une phrase riche produit plusieurs memory items si nécessaire.

L’utilisateur n’a jamais à répéter l’information parce qu’elle « appartenait à une étape plus tardive ».

---

## 7. Intention, négation, modalité et temporalité

Le moteur distingue notamment :

- `Je déteste le rouge` → préférence négative ;
- `Mon ancien site était rouge` → fait historique ;
- `Le rouge pourrait être sympa` → piste ;
- `Je veux rouge et orange` → préférence actuelle ;
- `J’aime rouge/orange mais je ne sais pas si cela conviendra` → piste appréciée, non décidée.

Une ambiguïté reste une ambiguïté jusqu’à résolution légitime.

---

## 8. Préremplir ≠ figer ; visibilité ≠ existence

Une information donnée dès la capture peut alimenter un domaine visible beaucoup plus tard.

Elle n’est pas redemandée naïvement.

Exemple : une préférence `rouge/orange + claymorphism` peut rester en mémoire puis réapparaître lorsque la direction visuelle devient pertinente.

L’extraction ne crée jamais automatiquement une décision finale.

---

## 9. Éléments ajoutés — trois familles utilisateur

Contrôle :

> `+ Ajouter des éléments`

### Des liens

Ajout multiple.

Par lien : URL + rôle/contexte facultatif + note facultative.

Exemples : site actuel, inspiration, concurrent, fonctionnalité intéressante, autre référence.

### Des images

Ajout multiple.

Rôle/contexte facultatif : inspiration visuelle, logo, site actuel, maquette/croquis, autre référence visuelle.

Une note humaine comme `J’aime les formes mais pas les couleurs` reste distincte de l’analyse visuelle IA.

### Des documents

Ajout multiple.

Rôle/contexte facultatif : brief/notes, présentation, étude/recherche, données/tableau, autre document projet.

Il n’existe pas de catégorie utilisateur séparée `Autre fichier` promettant une prise en charge indéfinie.

---

## 10. Formats, quantités et tailles

Baseline fonctionnelle à valider techniquement :

- images : JPG/JPEG, PNG, WebP, HEIC/HEIF ;
- documents : PDF, DOCX, TXT, Markdown, PPTX, XLSX, CSV.

Les quotas exacts ne sont pas figés tant que stockage, sécurité, extracteurs, performances et coûts réels ne sont pas validés.

L’écran principal ne doit pas être surchargé de détails techniques ; `Formats et limites` reste accessible à la demande.

---

## 11. Feedback après ajout

Après stockage, expliquer brièvement l’utilité potentielle :

- image → compréhension de préférences visuelles ;
- site → analyse de l’existant ;
- document → extraction des informations déjà disponibles.

Le rôle compris par 2b2c peut être affiché et corrigé.

Les sources continuent d’exister après la capture ; leur rôle, analyses, conflits et fraîcheur restent consultables lorsque pertinent.

---

## 12. Pré-analyse opportuniste avant `Commencer`

Après persistance RAW FIRST, 2b2c **peut préparer discrètement la compréhension initiale avant que l’utilisateur clique sur le CTA**.

Déclencheurs possibles :

- pause de saisie suffisamment stable ;
- fin d’une réponse guidée ;
- fin d’un upload ;
- source devenue analysable ;
- autre événement produisant une version exploitable.

Ne jamais lancer un appel LLM à chaque caractère.

Chaque pré-analyse :

- cible une version précise ;
- peut être invalidée par une version plus récente ;
- ne peut jamais écraser un état plus récent ;
- n’est jamais requise pour sauver la donnée.

Cette pré-analyse existe pour réduire l’attente et éviter un écran intermédiaire inutile.

---

## 13. `Commencer avec 2b2c` n’est pas `Sauvegarder`

La sauvegarde a déjà eu lieu.

Au clic :

1. flush des autosaves ;
2. vérification que les uploads engagés sont persistés ou explicitement en erreur ;
3. création du snapshot / `capture_version` courant ;
4. réutilisation de toute pré-analyse encore valide pour cette version ;
5. analyse du delta ou complément manquant si nécessaire ;
6. ouverture du workspace sur **le premier état utile**.

**Stockage avant navigation. Analyse complète avant ou après navigation selon ce qui est déjà prêt.**

---

## 14. Aucun écran obligatoire `2b2c analyse…`

Il ne doit pas exister de page produit dédiée uniquement à afficher :

- description récupérée ;
- sources reliées ;
- analyse en cours ;
- vérification de ce qui manque.

Ces états sont techniques et peuvent apparaître très brièvement sur l’écran de capture si nécessaire.

Si la compréhension minimale n’est pas immédiatement prête au clic :

- rester sur l’écran de capture ;
- afficher un état léger du CTA ou un court message de préparation ;
- ouvrir automatiquement le workspace dès que le premier état utile est disponible.

Les analyses lourdes de documents/sources peuvent continuer ensuite en arrière-plan.

---

## 15. Premier état utile dans le workspace

Après `Commencer`, la première surface doit **apporter une nouvelle valeur**.

Elle peut être, selon le dossier :

- une question réellement humaine ;
- une contradiction à résoudre ;
- une première recommandation ;
- une Candidate déjà possible ;
- une action autonome de 2b2c en cours ;
- une information critique à corriger.

La compréhension détaillée reste consultable et corrigeable, mais n’est pas obligatoirement une étape à franchir.

Si 2b2c vient d’aider à rédiger la description, il ne doit pas relire immédiatement le texte qu’il vient de synthétiser.

Une formulation légère peut suffire :

> `J’ai repris ce que nous avons précisé ensemble.`

puis la Next Best Action réellement utile.

---

## 16. Answer Resolver avant toute question

Avant de demander :

1. mémoire ;
2. description originale et courante ;
3. réponses guidées ;
4. sources ;
5. extractions ;
6. réponses antérieures ;
7. recherche/calcul/inférence possible ;
8. pertinence maintenant.

Une question humaine n’existe que si l’humain est encore nécessaire pour un Requirement actuellement pertinent.

---

## 17. Versions, idempotence et stale-safety

Toute analyse référence la version traitée.

Un résultat ancien :

- peut rester historique ;
- peut être réutilisé après vérification ;
- ne peut jamais écraser silencieusement la version active plus récente.

Les mutations importantes restent idempotentes et stale-safe.

---

## 18. Changement ultérieur = supersession ciblée

Une modification met à jour seulement les dépendances réellement touchées.

Ancienne information remplacée → historique / `SUPERSEDED` si approprié.

Nouvelle information → état actif approprié.

Change Intelligence ne relance pas le dossier entier sans raison.

---

## 19. Le document visible de l’Idée est une projection

La vérité canonique repose sur : Idea, capture versions, réponses, sources, memory items, provenance, evidence, recommendations, snapshots, Decision Requirements et analysis runs.

La synthèse visible est une vue lisible de cet état, pas l’unique blob de vérité.

---

## 20. Échec IA

Si l’IA échoue :

- l’Idée reste intacte ;
- les sources restent intactes ;
- les réponses restent intactes ;
- l’utilisateur peut modifier/reprendre ;
- l’analyse peut être relancée ;
- aucun résultat incomplet n’est promu en vérité active.

---

## 21. QA obligatoire Capture V5 + orchestration V1.2

Tester au minimum :

1. champ vide + aide guidée ;
2. description minimale ;
3. description riche ;
4. aide qui ne repose pas l’existant ;
5. `Je ne sais pas / plus tard` ;
6. enrichissement IA du texte visible ;
7. conservation original + réponses + synthèse ;
8. rollback ;
9. édition après enrichissement ;
10. négation/modalité ;
11. plusieurs liens ;
12. plusieurs images ;
13. plusieurs documents ;
14. élément sans contexte ;
15. correction de rôle ;
16. format non supporté ;
17. upload en cours au CTA ;
18. fermeture avant CTA ;
19. échec IA ;
20. modification pendant analyse ;
21. résultat obsolète ;
22. aucune question redondante ;
23. pré-analyse d’une version puis modification avant CTA ;
24. réutilisation d’une pré-analyse valide ;
25. analyse du delta seulement lorsque possible ;
26. absence d’écran intermédiaire d’analyse ;
27. brief aidé par 2b2c : pas de répétition immédiate ;
28. source lourde encore analysée après entrée workspace ;
29. premier écran workspace = valeur/action utile ;
30. correction post-capture réévalue seulement les dépendances affectées.

---

## 22. Interdictions

Il est interdit de :

- transformer la capture en formulaire obligatoire ;
- imposer `rapide / approfondi` ;
- analyser une source avant persistance ;
- appeler le LLM à chaque frappe ;
- perdre les formulations humaines ;
- écraser silencieusement l’original ;
- reposer une question déjà résolue ;
- convertir une préférence en décision figée ;
- promettre `Autre fichier` universel ;
- forcer une page `analyse en cours` ;
- relire sans valeur le brief que 2b2c vient d’aider à écrire ;
- bloquer l’entrée du workspace sur une analyse lourde non nécessaire au premier état utile ;
- écraser une version récente avec une analyse ancienne ;
- traiter la synthèse visible comme base de vérité unique.

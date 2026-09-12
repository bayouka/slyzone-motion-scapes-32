# 4b4c — RED TEAM MASTER BLUEPRINT V1 — 2026-09-12

Statut : **supporting validation evidence**, pas une spécification concurrente.

Sources canoniques testées :

- `IDEA_ENGINE_MASTER_BLUEPRINT_V1.md` V1.1
- `INFORMATION_MATRIX_V5_OUTPUT_DRIVEN.md`
- `CAPTURE_INGESTION_MEMORY_CONTRACT_V1_2.md`

## Objectif

Vérifier que le moteur fonctionne sans parcours écran caché et que les mêmes règles s’adaptent à des situations très différentes.

---

## Test 1 — Nathalie, novice, idée très vague

Input : `Je suis sophrologue près de Lyon et je veux refaire mon site car il ne me ressemble plus.`

Résolution attendue :

- contexte/secteur/refonte/zone extraits ;
- O1 partiellement prêt ;
- objectif business et audience peuvent être partiellement inférés mais restent hypothèses ;
- 2b2c ne déroule pas la Matrix ;
- une seule intervention humaine à fort gain est proposée si nécessaire ;
- `Je ne sais pas` peut conduire à Rescue Path ou working assumption.

Résultat : **PASS**.

Risque surveillé : question fatigue. Réponse du modèle : le coût humain fait partie du ranking NBA ; une hypothèse de travail est préférable à une série de questions non décisionnelles.

---

## Test 2 — Vincent, brief riche + nombreux documents

Input : brief détaillé, site existant, deck, captures, données.

Résolution attendue :

- RAW/SRC remplissent de nombreux information keys ;
- extraction et analyses peuvent tourner en parallèle ;
- aucune question redondante ;
- O1 peut être READY très tôt ;
- O2/O3 peuvent progresser automatiquement ;
- la première action visible peut être directement une Candidate/recommandation.

Résultat : **PASS**.

---

## Test 3 — Maya, associé/équipe et désaccord découvert tard

Événement tardif : `Je dois faire valider par mon associé et nous ne sommes pas d’accord sur la cible.`

Résolution attendue :

- activation tardive de `HAS_TEAM_DECISION` ;
- décision/gouvernance deviennent pertinentes ;
- conflit cible explicitement conservé ;
- aucun redémarrage de contexte/assets/recherche indépendante ;
- présentation/atelier uniquement si les Decision Requirements le justifient.

Résultat : **PASS**.

---

## Test 4 — Mauvaise idée / solution disproportionnée

Input : besoin simple mais solution très coûteuse et complexe.

Résolution attendue :

- O2 détecte disproportion/risques ;
- action `CHALLENGE` ou `SIMPLIFY` peut passer avant toute Candidate détaillée ;
- 2b2c peut recommander Approfondir/Pause/Stop ;
- aucun biais GO.

Point important : **une décision de ne pas poursuivre ne nécessite pas automatiquement O4/O5 complets**. La readiness O7 dépend de la vraie Decision Question. Un dossier peut être suffisamment prêt pour décider `STOP` avant d’être prêt pour décider `LAUNCH`.

Résultat : **PASS**.

---

## Test 5 — Source contradictoire

Input : utilisateur dit `surtout particuliers`, ancien deck dit `70 % B2B`.

Résolution attendue :

- deux sources conservées ;
- conflict group ;
- Requirement = `CONFLICTED` uniquement si ce conflit impacte un output actif ;
- 2b2c ne choisit pas silencieusement ;
- résolution humaine ou acceptation de l’incertitude selon impact.

Résultat : **PASS**.

---

## Test 6 — L’utilisateur demande une présentation très tôt

Input : `Je dois montrer ça demain à mon associé, fais-moi une présentation.`

Résolution attendue :

- O8 devient ACTIVE_OUTPUT_TARGET ;
- le moteur dérive les Requirements réellement nécessaires ;
- il ne force pas pour autant O1→O7 dans un ordre visuel ;
- les actions autonomes résolvent en parallèle ce qui peut l’être ;
- l’humain n’est sollicité que pour les vrais blockers ;
- si la décision visée est seulement `continuer à explorer ?`, le deck peut être beaucoup plus léger qu’un deck de GO.

Résultat : **PASS**.

---

## Test 7 — Brief écrit avec 2b2c

Input : champ initial vide, aide guidée, synthèse visible écrite par l’IA.

Résolution attendue :

- original + guided answers + synthèse séparés ;
- pré-analyse réutilisable ;
- clic CTA sans écran `analyse en cours` ;
- premier état workspace apporte une valeur nouvelle ;
- aucune relecture obligatoire du texte que 2b2c vient de produire.

Résultat : **PASS**.

---

## Test 8 — Changement radical de type de projet

Événement : site vitrine évolue vers marketplace/application complexe.

Résolution attendue :

- Change Intelligence classe le changement CRITICAL ;
- Blueprint Resolver détecte que Matrix Site vitrine n’offre plus une couverture fiable ;
- état `BLUEPRINT_MISMATCH` / reclassification ;
- historique conservé ;
- interdiction de continuer à simuler une couverture universelle.

Résultat : **PASS**, avec dépendance future : créer d’autres Blueprints avant de prétendre les prendre en charge.

---

## Test 9 — Analyse ancienne termine après nouvelle version

Résolution attendue :

- analyses versionnées ;
- ancienne sortie historisable ;
- aucune mutation active silencieuse si version source obsolète ;
- recalcul delta sur version courante.

Résultat : **PASS**.

---

## Test 10 — Beaucoup d’informations internes, aucune recherche utile

Résolution attendue :

- Research Planner ne recherche pas « pour faire complet » ;
- si aucune décision ne peut être modifiée par le web, `RESEARCH = NOT_RELEVANT` ;
- Candidate peut progresser sans benchmark artificiel.

Résultat : **PASS**.

---

# Risques restant à traiter plus tard — sans rouvrir la logique produit

1. politique précise de coût/quotas pour recherches et modèles ;
2. permission/connexion pour données privées ;
3. sécurité/parsing final des documents ;
4. cache et orchestration technique des analyses parallèles ;
5. exactitude des règles déterministes de dependency graph ;
6. création de Blueprints supplémentaires avant extension à d’autres types de projet ;
7. tests utilisateurs réels de la projection UX.

Ces sujets affectent l’implémentation ou l’extension, pas le principe du moteur.

---

# Conclusion

**La logique de travail est suffisamment cohérente pour être considérée comme figée au niveau conceptuel V1 pour le Blueprint Site vitrine.**

La conception UX peut reprendre, mais désormais selon la méthode :

`état IDD simulé → outputs actifs → requirements → actions système → éventuelle action humaine → projection UX`.

Il ne faut plus concevoir `écran suivant` avant d’avoir simulé cet état moteur.

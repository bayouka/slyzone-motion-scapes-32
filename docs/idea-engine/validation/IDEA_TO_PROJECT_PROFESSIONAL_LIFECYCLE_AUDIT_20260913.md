# 4b4c — AUDIT DU CYCLE PROFESSIONNEL IDÉE → PROJET PRÊT À DÉVELOPPER

Date : 2026-09-13

Statut : **VALIDATION SUPPORT — NON CANONIQUE / REQUIERT ARBITRAGE AVANT MODIFICATION DU MASTER BLUEPRINT**

Objet : établir la structure professionnelle complète qui doit précéder toute nouvelle conception du workspace Idea. Le problème à résoudre n'est pas d'abord l'écran post-capture ; c'est la séparation correcte entre **Idée**, **Projet pré-développement**, puis **Développement / Production**.

---

## 1. Déclencheur de l'audit

Le prototype Workspace V0.1/V0.2 a essayé de projeter très tôt une Idea encore imparfaitement définie.

Défaut : après quelques réponses humaines, l'UX commençait déjà à matérialiser une direction alors que des travaux professionnels encore structurants pouvaient changer cette direction : cible, utilisateurs, marché, concurrence, alternatives, différenciation, contraintes, faisabilité, opportunités et challenge.

Conséquence : risque de produire arborescence, contenu, structure ou recommandations trop tôt, puis de devoir tout reprendre après recherche et amélioration de l'Idée.

Décision de travail : **mettre en pause la conception du workspace et établir d'abord le lifecycle professionnel complet.**

---

## 2. Audit du PDF utilisateur

Source fournie : `Méthode universelle - Site vitrine professionnel - version consolidée Lovable / production-ready`.

Le document est utile et riche. Il couvre notamment :

- objectif, cible, CTA, contraintes ;
- arborescence et rôle des pages ;
- contenus, preuves et médias ;
- parcours, objections et conversion ;
- structure de pages ;
- wireframes ;
- direction artistique ;
- design system / composants ;
- choix techniques et socle J0 ;
- SEO ;
- accessibilité ;
- performance ;
- sécurité / conformité ;
- construction ;
- préproduction ;
- mise en ligne ;
- suivi.

Il contient aussi une checklist `Avant design` puis `Avant construction`, donc il reconnaît déjà des dépendances professionnelles importantes.

### Limite principale

Le document mélange dans un même enchaînement :

1. découverte / cadrage de l'Idée ;
2. définition du Projet ;
3. conception ;
4. développement ;
5. QA ;
6. release ;
7. exploitation.

Il n'est donc pas directement utilisable comme frontière `Idea → Project`.

### Manque important

Le document ne formalise pas explicitement avant la conception :

- étude de concurrence ;
- alternatives réelles ;
- benchmark de références ;
- amélioration / challenge de l'Idée après recherche ;
- plusieurs directions candidates ;
- comparaison des directions ;
- décision explicite sur la direction retenue avant de détailler le Projet.

C'est un manque critique pour 4b4c : la vision initiale de l'utilisateur ne doit pas être considérée comme la solution à mettre en forme avant d'avoir été confrontée au réel.

---

## 3. Vérification externe — invariants professionnels

Il n'existe pas une méthode unique utilisée par toutes les agences. En revanche, plusieurs références convergent sur les mêmes invariants.

### Design Council — Double Diamond

`Discover → Define → Develop → Deliver`.

Le modèle impose d'abord de comprendre le problème par la recherche, puis de redéfinir le problème, ensuite d'explorer plusieurs solutions et enfin d'en sélectionner/tester une.

Source : https://www.designcouncil.org.uk/resources/the-double-diamond/

### GOV.UK Service Manual

Discovery : comprendre utilisateurs, besoin, contraintes et opportunités **avant de s'engager à construire**.

Alpha : tester plusieurs solutions et les hypothèses les plus risquées avant la vraie construction.

Beta : construire réellement la meilleure solution sélectionnée.

Sources :
- https://www.gov.uk/service-manual/agile-delivery/how-the-discovery-phase-works
- https://www.gov.uk/service-manual/agile-delivery/how-the-alpha-phase-works
- https://www.gov.uk/service-manual/agile-delivery/how-the-beta-phase-works

### W3C / Google / OWASP / web.dev

Avant développement, un projet web professionnel doit déjà intégrer des exigences non-fonctionnelles :

- accessibilité : WCAG 2.2 ;
- SEO / crawl / indexabilité / structure : Google Search Central ;
- sécurité : OWASP ASVS fournit des exigences de développement sécurisé ;
- performance réelle : Core Web Vitals.

Ces sujets ne doivent pas être découverts seulement en QA finale ; leur niveau pertinent doit être défini dans le Projet avant développement.

---

# 4. Architecture recommandée du lifecycle

Le lifecycle cible comporte trois zones distinctes.

```text
IDEA
  ↓
Idée comprise, recherchée, challengée, améliorée et choisie
  ↓ GO explicite
PROJECT — PRE-DEVELOPMENT
  ↓
Solution choisie transformée en dossier exécutable et figé
  ↓ READY FOR DEVELOPMENT
DEVELOPMENT / PRODUCTION
```

Une zone peut travailler en parallèle en interne, mais une sortie dépendante ne peut pas être **figée** tant que ses fondations structurantes ne le sont pas.

---

# ZONE A — IDEA

But : déterminer **ce qu'il vaut réellement la peine de construire**.

Aucune architecture technique finale, aucun backlog d'exécution, aucun design final.

## I0 — Capture & contexte brut

### À connaître
- idée formulée librement ;
- organisation / porteur ;
- création ou refonte ;
- documents, liens, site existant, images ;
- raison de la démarche si connue.

### IA
- persistance RAW FIRST ;
- extraction ;
- classification ;
- détection Blueprint ;
- premières hypothèses.

### Gate
Assez de contexte pour démarrer Discovery ou poser une clarification structurante.

---

## I1 — Problème, intention business et objectifs

### Questions professionnelles
- Quel problème cherche-t-on réellement à résoudre ?
- Pourquoi maintenant ?
- Quel résultat business / communication est recherché ?
- Quel comportement utilisateur doit changer ?
- Quels critères permettront de dire que la direction est meilleure ?
- Quelles contraintes critiques sont déjà connues ?

### Sortie
`Problem & Outcome Frame`.

### Gate
L'objectif n'est pas seulement esthétique et peut être utilisé pour juger les futures options.

---

## I2 — Cibles, utilisateurs et besoins

### Questions professionnelles
- Qui est la cible principale ? secondaire ?
- B2B / B2C / mixte ?
- Segment, zone géographique, maturité ?
- Quel besoin / job-to-be-done ?
- Quels freins, objections, critères de confiance ?
- Comment découvrent-ils actuellement l'offre ?
- Quels contextes d'usage influencent l'expérience ?

### Acquisition
RAW / sources / données / recherche / hypothèses IA / humain uniquement si stratégique.

### Sortie
`Target & Need Model`.

### Gate
La cible est assez précise pour sélectionner les bons concurrents, références et signaux marché.

---

## I3 — Existant, evidence et baseline

### À examiner
- site / produit actuel ;
- offres réelles ;
- contenus ;
- analytics si disponibles ;
- SEO existant ;
- assets / marque / preuves ;
- problèmes déclarés vs problèmes observés ;
- contraintes internes ou historiques.

### Sortie
`Current State & Evidence Pack`.

### Gate
2b2c sait distinguer faits, déclarations, observations et hypothèses.

---

## I4 — Marché, concurrence, alternatives et références

Cette section doit précéder l'amélioration détaillée de l'Idée.

### Recherche
- concurrents directs ;
- concurrents indirects / substituts ;
- références exemplaires ;
- positionnements ;
- offres ;
- prix visibles si pertinents ;
- messages ;
- CTA / acquisition / conversion ;
- fonctionnalités ;
- structure / contenus ;
- preuves et rassurance ;
- SEO / intentions de recherche si pertinent ;
- forces observables ;
- faiblesses / frictions ;
- espaces non couverts.

### Important
`présence chez plusieurs concurrents ≠ bonne idée à copier`.

### Sortie
`Competitive & Opportunity Map` :
- ce qui fonctionne ;
- ce qui est banal ;
- ce qui pose problème ;
- ce qui manque ;
- ce qui peut inspirer ;
- ce qu'il faut éviter.

### Gate
Les enseignements sont assez solides pour challenger l'Idée originale.

---

## I5 — Amélioration, challenge et alternatives de l'Idée

Ici seulement, 2b2c doit explicitement demander :

> **L'Idée de départ est-elle encore la meilleure réponse au problème après Discovery ?**

### Travail
- challenger les suppositions ;
- simplifier les solutions disproportionnées ;
- identifier ce qui manque ;
- améliorer cible / offre / proposition de valeur ;
- améliorer différenciation ;
- comparer plusieurs logiques possibles ;
- proposer des fonctionnalités ou mécanismes additionnels uniquement s'ils servent le besoin ;
- supprimer ce qui n'apporte pas de valeur ;
- produire plusieurs directions si un vrai arbitrage existe.

### Sortie
`Improved Idea Candidates`.

Chaque Candidate inclut :
- cible ;
- problème ;
- proposition de valeur ;
- principe de solution ;
- conversion ;
- différenciation ;
- avantages / inconvénients ;
- evidence ;
- hypothèses ;
- risques.

### Gate
Au moins une direction est suffisamment cohérente pour être évaluée.

---

## I6 — Faisabilité décisionnelle, risques et contraintes

Il ne s'agit PAS encore de l'architecture technique finale.

### Vérifier au niveau nécessaire
- faisabilité générale ;
- dépendances critiques ;
- contraintes légales / sécurité / données ;
- ordre de grandeur complexité ;
- budget/délai uniquement si la décision en dépend ;
- risques principaux ;
- ressources ou capacités indispensables.

### Sortie
`Decision Feasibility & Risk View`.

### Gate
Aucun obstacle critique n'est masqué pour choisir honnêtement une direction.

---

## I7 — Sélection / décision / Idea Freeze

Comparer les Candidates avec :
- objectifs ;
- besoins cibles ;
- evidence ;
- différenciation ;
- simplicité ;
- faisabilité ;
- risques ;
- contraintes ;
- éventuels critères financiers.

### Issues valides
- GO ;
- GO avec modifications ;
- approfondir ;
- pause ;
- stop.

### Si GO
Créer une `FROZEN IDEA DEFINITION` :
- problème retenu ;
- cible retenue ;
- objectif ;
- proposition de valeur ;
- direction sélectionnée ;
- principes de solution ;
- contraintes ;
- risques / unknowns ;
- evidence ;
- ce qui est explicitement hors scope de l'Idée.

**C'est ici que l'Idea devient Project.**

---

# ZONE B — PROJECT / PRE-DEVELOPMENT

But : transformer la direction choisie en dossier **prêt à être construit sans improvisation structurante**.

Le Project peut encore évoluer par change control, mais les décisions sont maintenant orientées vers l'exécution de la Candidate retenue.

## P0 — Initialisation & gouvernance du Projet

- Project Owner / décideur ;
- contributeurs ;
- source de vérité ;
- Candidate retenue ;
- versions ;
- contraintes confirmées ;
- processus de décision / changement ;
- niveau de documentation attendu.

Gate : responsabilité et autorité des informations claires.

---

## P1 — Requirements & Scope

### Définir
- besoins fonctionnels ;
- besoins contenus ;
- fonctionnalités ;
- intégrations ;
- CMS / administration ;
- formulaires ;
- données ;
- V1 / Later / Out ;
- critères d'acceptation ;
- dépendances.

Gate : le périmètre V1 est explicite et chaque fonction a une raison.

---

## P2 — Information Architecture

Pour un site vitrine :
- pages ;
- rôle de chaque page ;
- navigation ;
- routes ;
- index/noindex prévu ;
- liens internes ;
- CTA par page ;
- intention SEO éventuelle.

Gate : aucune page sans rôle et aucun besoin essentiel sans destination.

---

## P3 — User Journey, conversion et objections

- parcours principal ;
- parcours secondaires ;
- points de décision ;
- objections ;
- éléments de réassurance ;
- CTA ;
- fallback de conversion ;
- mobile/contextes particuliers.

Gate : le parcours permet d'atteindre l'objectif sans friction structurelle majeure.

---

## P4 — Content, Proof, Media & SEO Strategy

- inventaire contenu ;
- contenu à conserver / créer / supprimer ;
- preuves ;
- médias ;
- droits ;
- message architecture ;
- intents / requêtes ;
- contenu par page ;
- contenus légaux nécessaires ;
- migration SEO si refonte.

Gate : les pages ne dépendent pas de contenu fictif pour être conçues.

---

## P5 — UX Structure & Wireframes

- sections par page ;
- rôle de chaque section ;
- hiérarchie H1/H2/H3 ;
- formulaires ;
- états loading/empty/error/success ;
- responsive ;
- accessibilité interactionnelle ;
- wireframes desktop/mobile des vues structurantes.

Gate : la solution est compréhensible sans direction artistique finale.

---

## P6 — Direction artistique & Design System

Selon niveau du Projet :
- mood / direction ;
- palette ;
- typographie ;
- grille / spacing ;
- traitement image ;
- motion ;
- anti-références ;
- tokens ;
- composants ;
- variantes ;
- états ;
- responsive.

Gate : la DA est systémique et reproductible, pas une suite de maquettes isolées.

---

## P7 — Architecture technique & intégrations

Finaliser maintenant :
- plateforme / stack ;
- routing / rendu ;
- CMS / données ;
- formulaires / emails ;
- auth si applicable ;
- APIs / intégrations ;
- hébergement ;
- domaine ;
- stockage ;
- environnements ;
- variables ;
- sauvegarde ;
- observabilité ;
- maintenance ;
- dépendances.

Gate : aucun choix structurel majeur ne doit être improvisé pendant le développement.

---

## P8 — Non-functional Requirements

Définir les exigences applicables avant code :

### SEO
crawl/index, URLs, canonicals, sitemap, robots, métadonnées, structured data si pertinent.

### Accessibilité
niveau cible WCAG 2.2, clavier, focus, labels, alt, motion, contrastes.

### Performance
budgets et objectifs adaptés : LCP / INP / CLS, images, fonts, JS.

### Sécurité
contrôles adaptés au risque, secrets, headers, validation, permissions, dépendances ; ASVS comme référentiel possible.

### Confidentialité / conformité
RGPD, cookies, données formulaires, conservation, légales.

### Compatibilité / résilience
navigateurs, devices, 404, fallback, erreurs, réseau lent.

Gate : les qualités attendues sont des Requirements, pas des surprises de QA.

---

## P9 — Analytics, mesure et critères de succès

- événements réellement utiles ;
- KPIs / signaux ;
- Search Console ;
- analytics si autorisés ;
- conversions ;
- monitoring ;
- baseline éventuelle ;
- méthode de comparaison après launch.

Gate : le Projet sait comment vérifier qu'il atteint son objectif après livraison.

---

## P10 — QA & Acceptance Plan

- critères d'acceptation fonctionnels ;
- tests routes ;
- responsive ;
- navigateurs ;
- accessibilité ;
- formulaire ;
- SEO ;
- sécurité ;
- performance ;
- contenus ;
- production ;
- edge cases ;
- Definition of Done release.

Gate : chaque exigence critique possède une méthode de validation.

---

## P11 — Delivery Architecture / Handoff

Avant développement :
- découpage en slices / passes ;
- dépendances ;
- ordre d'exécution ;
- composants/sources de vérité ;
- structure repo ;
- environnements ;
- AGENTS / Knowledge / Runbook si IA ;
- fichiers protégés / règles de changement ;
- critères de chaque slice ;
- stratégie de migration si existant.

Gate : le développeur ou agent de développement sait **quoi construire, pourquoi, dans quel ordre, avec quelles limites et comment prouver que c'est correct**.

---

# P12 — READY FOR DEVELOPMENT FREEZE

Le Projet devient `READY_FOR_DEVELOPMENT` lorsque les blockers pertinents sont résolus.

Minimum professionnel :

1. Idea sélectionnée et gelée ;
2. objectifs / cibles / proposition de valeur cohérents ;
3. scope V1 clair ;
4. architecture informationnelle définie ;
5. parcours et conversions définis ;
6. contenus/preuves suffisamment définis pour construire ;
7. UX/wireframes nécessaires validés ;
8. DA/design system au niveau requis ;
9. exigences fonctionnelles et intégrations explicites ;
10. architecture technique décidée ;
11. SEO/accessibilité/performance/sécurité/conformité intégrés ;
12. critères d'acceptation/test définis ;
13. delivery plan et sources de vérité prêts ;
14. unknowns restants explicitement acceptés et non bloquants ;
15. snapshot versionné servant de base au développement.

`READY_FOR_DEVELOPMENT` ne signifie pas que tous les textes finaux, tous les assets ou toutes les décisions post-GO sont parfaits. Il signifie qu'aucun choix structurel bloquant n'est laissé au développeur par accident.

---

# ZONE C — DEVELOPMENT / PRODUCTION

Cette zone n'est pas la priorité de l'audit actuel, mais doit rester distinguée :

- setup / J0 ;
- développement par slices ;
- intégrations ;
- QA continue ;
- préproduction ;
- corrections ;
- release ;
- monitoring / amélioration.

Le PDF fourni couvre très bien une grande partie de cette zone et pourra être réutilisé plus tard.

---

# 5. Dépendances professionnelles — ni wizard rigide, ni anarchie

La correction à apporter à 4b4c n'est pas de revenir à un formulaire linéaire.

Il faut distinguer :

- **sections/gates métier** : dépendances réelles de conception ;
- **orchestration interne** : plusieurs recherches/analyses peuvent avancer en parallèle ;
- **projection UX** : l'utilisateur voit uniquement ce qui est utile.

Exemples :

- I1 + I2 suffisamment établis → I4 peut sélectionner les bons concurrents ;
- I4 terminé → I5 peut améliorer la vraie Idea à partir d'evidence ;
- I5 + I6 → I7 peut décider honnêtement ;
- I7 GO → création du Project ;
- P1 suffisamment stable → P2/P3/P4 peuvent avancer en parallèle ;
- P1/P2/P3 → wireframes P5 ;
- P5 + marque → P6 ;
- P1 + contraintes + UX → P7 final ;
- P8/P10 doivent exister avant Ready for Development ;
- aucune section aval ne doit être figée si une fondation amont susceptible de la changer est encore instable.

---

# 6. Rôle de l'IA vs humain

Chaque section devra ensuite être transformée en registre détaillé avec, pour chaque information :

- `human_only` ;
- `extractable` ;
- `researchable` ;
- `calculable` ;
- `inferable_as_hypothesis` ;
- `AI_recommendable` ;
- `requires_human_decision` ;
- source/provenance ;
- validation minimum ;
- dépendances ;
- section propriétaire ;
- gate(s) affectée(s).

C'est seulement après cette cartographie qu'il sera raisonnable de concevoir l'UX.

---

# 7. Impact sur les documents 4b4c actuels

## Matrix V5

À conserver comme **registre informationnel précieux**, mais elle ne suffit pas comme lifecycle. Il faudra mapper chaque key vers `I0…I7 / P0…P12` et vérifier les trous.

## Master Blueprint V1.1

Il devra probablement être réouvert de manière contrôlée sur :

- frontière Idea / Project ;
- profondeur autorisée des Outputs O4/O5/O6 avant GO ;
- notion de macro-sections/gates professionnelles ;
- rôle du Project Draft comme phase de pré-développement complète jusqu'à `READY_FOR_DEVELOPMENT`.

Ne pas modifier avant validation de cette architecture.

## Workspace Projection V0.3

À considérer comme **rejeté comme direction active** : l'UX ne doit plus être poursuivie avant de savoir quelle section professionnelle elle projette et quelles dépendances sont réelles.

---

# 8. Prochaine étape recommandée

Ne pas créer de nouvel écran.

Construire maintenant la **Professional Requirements Master Matrix V1** :

`Section → sous-section → information/question → raison → Idea/Project → humain/IA/source/web/calcul → niveau de validation → dépendance → livrable → exit criteria`.

Cette matrice doit reprendre :

1. toutes les informations pertinentes de Matrix V5 ;
2. toutes les exigences utiles du PDF utilisateur ;
3. les manques identifiés par les standards professionnels ;
4. les exigences spécifiques au Blueprint Site vitrine ;
5. la frontière explicite avec Development / Production.

Une fois cette matrice red-teamée, seulement alors reprendre la conception du workspace.
# 4b4c — RED TEAM — IDEA REQUIREMENT ATOM REGISTRY

Date : 2026-09-13

Statut : **VALIDATION SUPPORT**

Cible auditée : `03_REQUIREMENT_REGISTRY_IDEA_V0_1.md`.

---

# Objectif

Tester si D01→D07 suffisent réellement à décider honnêtement `quoi / pourquoi / pour qui` avant de créer un Project, sans transformer l'Idea en Project Definition prématuré.

---

# Scénarios

## 1. Artisan local très vague

Entrée : « Je veux refaire le site de ma plomberie. »

### Résultat
PASS partiel.

D02/D03 permettent de clarifier objectif/cible ; D04 audit du site ; D05 concurrence locale ; D06 challenge.

### Défaut découvert
Il manque un atom explicite `DECISION_QUESTION`. Sans lui, le moteur peut améliorer l'idée sans savoir quelle décision exacte il prépare.

---

## 2. Brief riche + site + analytics

### Résultat
PASS.

RAW/SRC/CONN peuvent satisfaire une grande partie de D02-D04 sans question humaine. D05/D06 avancent automatiquement.

### Garde-fou
Ne pas forcer les questions humaines déjà résolues par evidence.

---

## 3. B2B : buyer ≠ user

### Résultat
PASS.

D03.I06/I07 séparent acheteur, décideur et utilisateur.

### Amélioration
Ajouter la notion d'`influencer/gatekeeper` lorsque le cycle d'achat le justifie ; conditionnelle, pas universelle.

---

## 4. Multi-stakeholders / désaccord interne

### Résultat
PASS.

D01 couvre owner, contributors, disagreements, source precedence.

### Défaut découvert
Une décision stratégique doit porter non seulement son owner mais aussi son `decision_status` et la preuve de validation attendue. Le schema général le permet, mais le registre Idea doit l'expliciter pour les décisions structurantes.

---

## 5. Aucun concurrent direct

### Résultat
PASS.

D05 prévoit alternatives/références et NOT_RELEVANT justifié.

### Garde-fou
Le moteur ne doit jamais fabriquer des concurrents pour satisfaire une checklist.

---

## 6. Refonte avec fort enjeu SEO

### Résultat
PASS pour Idea.

D04 identifie SEO data / critical URLs / migration risk probe. Le détail URL→redirect reste Project Definition.

### Conclusion
Bonne frontière Idea/Project.

---

## 7. Idée disproportionnée

### Résultat
PASS.

D06 challenge/simplification + D07 scope proportionality peuvent conduire à une solution plus simple ou STOP.

### Défaut découvert
Il manque un atom explicite `NON_GOALS / WHAT_WE_WILL_NOT_SOLVE` avant GO, afin de préserver la simplification lors du passage en Project.

---

## 8. Secteur réglementé

### Résultat
PASS partiel.

D04 peut détecter contrainte ; D06 lance feasibility/expert probe.

### Défaut découvert
Le niveau Idea doit contenir un `CRITICAL_REGULATORY_RISK_PROBE` conditionnel : vérifier qu'aucune direction candidate n'est manifestement incompatible avant GO, sans réaliser toute la conformité du Project.

---

## 9. Budget / deadline fortement contraints

### Résultat
PASS.

D02 hard constraints + D06 option comparison permettent de rejeter des directions irréalistes.

### Amélioration
Distinguer `hard constraint` d'une préférence ou estimation souple.

---

## 10. Changement de cible après recherche D05

### Résultat
PASS conceptuel.

D03 change impact invalide sélection des concurrents et D06.

### Défaut découvert
Le registre doit expliciter une `RESEARCH_INVALIDATION_EDGE` : changement de segment/zone/offre peut rendre stale tout ou partie de D05, pas seulement D06.

---

## 11. Blueprint mismatch

### Résultat
PASS au niveau architecture, pas dans D01-D07.

Le contrôle appartient à G0/Blueprint classifier et ne doit pas être dupliqué dans chaque Domain.

---

## 12. STOP précoce

Exemple : activité non autorisée, marché manifestement incompatible, solution disproportionnée sans intérêt.

### Résultat
PASS partiel.

D06 peut recommander STOP, mais G3 tel qu'écrit peut sembler exiger des options trop détaillées avant toute décision.

### Correction requise
`EARLY_DECISION_PATH` : si evidence suffisante démontre qu'une direction doit être stoppée/pausée, O7/G4 peut devenir prêt sans matérialiser artificiellement plusieurs options ou un macro scope complet.

---

# Défauts transversaux découverts

## F1 — Decision Question manquante
Ajouter un atom :
`D01/D02.Dxx decision.question`

Exemples :
- « Faut-il refaire ce site maintenant ? »
- « Quelle direction de site sert le mieux la prise de rendez-vous ? »
- « Faut-il remplacer le site vitrine par un autre produit ? »

La readiness dépend de cette question ; elle ne doit pas rester implicite.

## F2 — Non-goals manquants
Ajouter `D07.D03 MACRO_NON_GOALS_ACCEPTED`.

But : préserver ce qui a volontairement été exclu.

## F3 — Evidence sufficiency / stopping rule
Ajouter une analyse :
`D05.A07 RESEARCH_SUFFICIENCY`

Question : le gain marginal d'une recherche supplémentaire peut-il encore modifier la décision ?

Sans cela, le système peut rechercher indéfiniment.

## F4 — Source conflict resolution
Le modèle général le prévoit, mais D02-D05 doivent pouvoir créer un `CONFLICT_GROUP` atomique lorsqu'une source récente contredit une déclaration ou une autre source.

## F5 — Early decision path
La décision STOP/PAUSE/INSUFFICIENT ne doit pas être bloquée par des requirements nécessaires uniquement pour LAUNCH.

## F6 — Regulatory risk probe
Ajouter un probe conditionnel Idea avant GO si activité/solution touche un secteur fortement réglementé.

## F7 — Research invalidation
Les dépendances D03/D04→D05 doivent être explicites dans Change Impact.

## F8 — Validation status of decisions
Chaque DECISION structurante doit être identifiable comme : PROPOSED / ACCEPTED_CURRENT / HUMAN_DECISION / SUPERSEDED.

---

# Verdict

La structure D01→D07 est **bonne**, mais V0.1 n'est pas promotable sans F1→F8.

Aucun défaut ne justifie d'ajouter des phases UX ou de déplacer le détail Project dans Idea.

Recommandation : produire `03_REQUIREMENT_REGISTRY_IDEA_V0_2.md` avec ces corrections puis effectuer une seconde passe de couverture contre Matrix V5 avant d'attaquer D08→D20.

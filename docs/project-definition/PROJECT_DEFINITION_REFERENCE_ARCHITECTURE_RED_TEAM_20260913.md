# 4b4c — RED TEAM — PROJECT DEFINITION REFERENCE ARCHITECTURE V0.1

Date : 2026-09-13

Statut : **VALIDATION SUPPORT — NON CANONIQUE**

Objet : tenter de casser l’architecture candidate avant de remplir le Requirement Registry exhaustif.

---

# R1 — Petit site local de 5 pages

Cas : artisan local, Accueil / Services / Réalisations / À propos / Contact, aucun compte, aucun paiement, pas de CMS obligatoire.

### Risque

Le référentiel devient bureaucratique et exige data model, APIs, observability, rôles/permissions, ASVS complet.

### Attendu

- D13/D14 fortement réduits ou `NOT_RELEVANT` ;
- D17 sécurité/privacy minimalement activé par le formulaire/contact ;
- D18 accessibilité/performance restent applicables à un niveau proportionné ;
- D19 measurement peut rester simple ou non activé si aucune instrumentation n’est requise ;
- Build Ready atteint sans remplir des centaines d’atoms non pertinents.

### Verdict

PASS conceptuel grâce à Blueprint + Context Overlays.

---

# R2 — Refonte SEO avec trafic existant

Cas : nombreuses URLs indexées et trafic organique significatif.

### Attendu

`IS_REDESIGN + SEO_MIGRATION_RISK` active :

- inventory URLs ;
- pages à conserver/fusionner/supprimer ;
- redirect map ;
- canonical/indexation ;
- risques de migration ;
- critères de validation crawl/search.

Ces éléments deviennent blocking pour Build Ready.

### Verdict

PASS, mais confirme que D11 doit posséder un vrai overlay migration et pas seulement “SEO de base”.

---

# R3 — Aucun concurrent direct pertinent

Cas : activité de niche.

### Risque

D05 force une fausse liste de concurrents.

### Attendu

`MARKET_CONTEXT_SUFFICIENT` peut être satisfait via :

- alternatives ;
- acteurs adjacents ;
- références de patterns ;
- evidence utilisateur ;
- justification explicite de non-pertinence des concurrents directs.

### Verdict

PASS sous réserve que le futur registry distingue “market context” de “liste de concurrents”.

---

# R4 — Solution initiale mauvaise mais brief très détaillé

Cas : utilisateur a déjà imaginé sitemap, fonctionnalités et design.

### Risque

Le système traite ces éléments comme Project Definition et saute le challenge.

### Attendu

Ils restent RAW / preferences / proposed solution jusqu’à G4.

D05/D06 peuvent conclure qu’une autre direction est meilleure.

Les artefacts aval de la solution initiale ne sont pas promus comme source de vérité sans décision.

### Verdict

PASS.

---

# R5 — Design demandé avant la décision Idea

### Attendu

Une projection peut être générée comme **exploratory artifact** pour tester une hypothèse, mais ne peut pas satisfaire G6 ni devenir Design Definition frozen avant sélection de direction.

### Verdict

L’architecture V0.1 doit expliciter la différence `EXPLORATORY` vs `FROZEN_SPEC`.

**ACTION : à ajouter en V0.2.**

---

# R6 — Contenu final non disponible avant développement

Cas : photos et textes définitifs seront produits pendant le build.

### Risque

Build Ready devient impossible alors que l’équipe peut commencer avec un content model et des requirements solides.

### Attendu

Ready for Development exige :

- content requirements ;
- structure ;
- contraintes ;
- owner ;
- timing ;
- formats ;
- fallbacks ;

mais pas nécessairement chaque asset final si le développement peut avancer sans ambiguïté.

### Verdict

V0.1 est compatible mais doit le formuler explicitement.

**ACTION : à ajouter en V0.2.**

---

# R7 — WordPress / Webflow / React imposé avant Discovery

### Attendu

La contrainte technique est enregistrée tôt comme fact/constraint.

Elle peut déclencher feasibility probes.

Elle ne doit pas dicter la cible, le parcours ou le scope métier sauf conséquence réelle.

### Verdict

PASS.

---

# R8 — Clinique / secteur réglementé

### Attendu

`REGULATED_DOMAIN` active :

- legal/privacy/security requirements ;
- validation des claims ;
- data sensitivity ;
- expert escalation lorsque l’IA ne peut pas fournir une conclusion fiable.

### Verdict

PASS ; confirme l’utilité de `expert_escalation_rule`.

---

# R9 — Multilingue

### Attendu

`IS_MULTILINGUAL` doit toucher plusieurs domaines simultanément :

- content/localization ;
- IA/navigation ;
- SEO/hreflang si applicable ;
- UI expansion ;
- CMS/content model ;
- legal pages ;
- QA.

### Verdict

PASS grâce aux Context Overlays transversaux.

---

# R10 — CMS avec équipe éditoriale

### Attendu

D13 devient structurant :

- content types ;
- fields ;
- workflow ;
- roles ;
- draft/publish ;
- media handling ;
- ownership ;
- permissions.

D10 définit la stratégie éditoriale ; D13 définit le système de gestion.

### Verdict

PASS ; frontière D10/D13 à conserver.

---

# R11 — Formulaire simple qui collecte des données personnelles

### Attendu

Même sans backend complexe :

- finalité ;
- champs ;
- validation ;
- destination ;
- retention/handling policy appropriée ;
- privacy notice ;
- anti-spam ;
- success/error/fallback ;
- test d’envoi.

### Verdict

PASS si D12/D14/D17/D20 sont reliés.

---

# R12 — Site statique sans formulaire

### Attendu

Ne pas imposer data model, backend ou API.

Security reste minimalement traitée côté hosting/dependencies/headers selon contexte ; privacy peut être très faible si aucun tracking/donnée.

### Verdict

PASS.

---

# R13 — Analytics non souhaité

### Attendu

D19 peut conclure `NOT_RELEVANT / intentionally omitted` avec raison.

Le référentiel ne doit pas imposer tracking.

### Verdict

PASS.

---

# R14 — Changement B2C → B2B après READY_FOR_DEVELOPMENT

### Attendu

Change Impact :

- audience redecide ;
- positioning recompute ;
- journeys/content/IA/SEO review ;
- scope potentiellement review ;
- acceptance criteria affected ;
- readiness révoquée jusqu’à réconciliation.

Les éléments indépendants restent valides.

### Verdict

PASS conceptuel.

---

# R15 — Le développeur veut changer une bibliothèque interne

Cas : aucune conséquence UX, performance, maintenance ou contrat d’intégration.

### Attendu

Cela relève de `IMPLEMENTATION_DISCRETION` et ne nécessite pas de réouverture produit.

### Verdict

PASS ; cette notion est importante pour éviter l’over-specification.

---

# R16 — Le développeur doit deviner ce qui se passe après erreur d’envoi

### Attendu

NO GO Build Ready : comportement error/retry/fallback est une décision produit/fonctionnelle, pas une discrétion interne.

### Verdict

PASS grâce à D12 + A14.

---

# R17 — “Site vitrine” devient espace client avec comptes et données sensibles

### Attendu

G0/Blueprint monitoring détecte que les exigences dépassent le simple overlay Site Vitrine.

Soit un overlay/app Blueprint compatible existe, soit `BLUEPRINT_MISMATCH`.

Ne pas étirer artificiellement le Blueprint Site Vitrine.

### Verdict

PASS.

---

# R18 — Budget inconnu

### Attendu

Budget n’est blocking que si la décision/solution dépend réellement d’une enveloppe.

Une direction peut être décidée sans faux budget si les options sont compatibles avec une plage large ou si la décision budgétaire est explicitement différée.

### Verdict

PASS.

---

# R19 — Deadline impérative

### Attendu

Si réelle, la deadline peut modifier scope, architecture, design fidelity et delivery profile.

Elle devient dependency de plusieurs décisions.

### Verdict

PASS.

---

# R20 — Accessibility

Cas : site public standard.

### Risque

Accessibilité traitée seulement en QA.

### Attendu

Le Project Definition doit fixer le niveau/les exigences appropriées avant build ; Verify atoms traduisent les exigences en tests.

### Verdict

PASS ; cohérent avec WCAG comme critères testables.

---

# R21 — Sécurité disproportionnée

Cas : petit site statique.

### Risque

Copier ASVS intégralement dans tous les projets.

### Attendu

Security requirements proportionnées au threat/data/integration profile.

Les standards servent à dériver un subset applicable, pas à remplir 200 cases universelles.

### Verdict

PASS.

---

# R22 — SEO non stratégique

Cas : microsite accessible uniquement par URL/campagne, noindex assumé.

### Attendu

D11 reste présent comme Domain mais ses atoms acquisition organique deviennent NOT_RELEVANT ; indexation/noindex reste une décision explicite.

### Verdict

PASS.

---

# R23 — Source contradictoire pendant Project Definition

### Attendu

Le conflit n’est pas fusionné silencieusement ; il remonte jusqu’à l’atom/decision impacté. Seuls les Deliverables dépendants passent en review.

### Verdict

PASS.

---

# R24 — Exigence sans preuve de validation

Exemple : “le formulaire doit être simple et accessible”.

### Risque

Spécification vague transmise au dev.

### Attendu

Les exigences critiques doivent être reliées à au moins un VERIFY atom ou critère observable/testable.

### Verdict

V0.1 doit rendre cette traçabilité explicite.

**ACTION : ajouter relations `SATISFIED_BY` / `VERIFIED_BY` et couverture de traçabilité.**

---

# R25 — Atom applicable mais personne n’en possède la décision

### Risque

Le moteur sait qu’une décision manque mais personne ne sait qui doit trancher.

### Attendu

Chaque DECISION critique doit pouvoir porter :

- `decision_authority` ;
- `owner` ;
- policy si aucune autorité résolue.

### Verdict

**ACTION : ajouter au Requirement Atom Schema.**

---

# R26 — Exigences critiques noyées parmi des enhancers

### Attendu

Chaque atom a une `criticality` relative au Gate/Deliverable : blocking / required / conditional / enhancer.

### Verdict

**ACTION : ajouter explicitement `criticality_by_gate`.**

---

# R27 — Site avec contenu produit par une autre équipe après handoff

### Attendu

Content final peut rester externe au code si :

- content model ;
- ownership ;
- format ;
- constraints ;
- deadlines/dependencies ;
- placeholders de développement non publiables ;

sont documentés.

### Verdict

PASS avec correction R6.

---

# R28 — Dépendance third-party indisponible

### Attendu

Pour une intégration critique :

- failure behavior ;
- fallback ;
- error state ;
- ownership ;
- acceptance test ;

sont définis avant Build Ready.

### Verdict

PASS via D14/D12/D20.

---

# R29 — Project Definition extrêmement riche mais absence de décision Idea formelle

### Risque

Un projet devient Build Ready autour d’une direction jamais réellement choisie.

### Attendu

G4 / Idea Decision Record reste prerequisite de Project Definition frozen.

### Verdict

PASS.

---

# R30 — Un changement cosmétique tardif

### Attendu

N’invalide pas scope, business, audience ou architecture sauf dépendance explicite.

### Verdict

PASS via Change Impact ciblé.

---

# Conclusions du Red Team

L’architecture générale tient, mais V0.1 nécessite cinq renforcements avant validation :

1. distinguer `EXPLORATORY_ARTIFACT` et `FROZEN_SPEC` ;
2. expliciter que Build Ready exige la **définition du contenu**, pas forcément tous les assets finaux ;
3. ajouter la traçabilité `REQUIREMENT → SPEC → VERIFY` ;
4. ajouter `decision_authority` / `owner` aux décisions critiques ;
5. ajouter `criticality_by_gate` et une règle de couverture de traçabilité.

Aucun scénario ne force à revenir à un workflow séquentiel ou à fusionner IDEA et PROJECT.

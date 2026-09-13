# 4b4c — PROJECT TECH / NFR / BUILD READY DETAILED CATALOG — V0.1

Date : 2026-09-13

Statut : **WORKING CANDIDATE — NON CANONIQUE**

Périmètre : D16→D20, après Project product/experience definition.

---

# D16 — Technical Architecture, Platform, Environments & Operations

## D16.1 — Delivery approach

**Questions internes**
- custom/no-code/CMS/hybrid ?
- contraintes plateforme/vendor ?
- niveau de contrôle requis ?
- capacité interne de maintenance ?
- Delivery Profile applicable ?

**Résolution** : R1/R5 ; R8 si décision engageante.

## D16.2 — Architecture boundaries

**Questions internes**
- frontend/backend/static/CMS/service boundaries ?
- SPA/SSR/SSG/server-rendered si pertinent ?
- quelles données nécessitent persistance ?
- quels services externes ?
- quelles responsabilités restent dans tiers ?

**Résolution** : R5, architecture proportionnée.

## D16.3 — Environment model

**Questions internes**
- dev/preview/staging/prod nécessaires ?
- domaines/URLs ?
- env variables/secrets classes ?
- données de test ?
- accès/permissions ?

**Résolution** : R5.

## D16.4 — Hosting / deployment / runtime

**Questions internes**
- hébergement cible ?
- DNS/domain ownership ?
- build/deploy mechanism ?
- CDN/cache/fallback ?
- route refresh/deep links ?
- rollback ?

**Résolution** : R1/R5.

## D16.5 — Async / background / scheduled work

**Questions internes**
- jobs longs ?
- email/notifications ?
- queues/retries ?
- cron/schedule ?
- idempotence ?

**Résolution** : R5 si applicable.

## D16.6 — Backup / recovery / maintenance

**Questions internes**
- quelles données nécessitent backup ?
- recovery expectations ?
- qui maintient dépendances/contenu ?
- update policy ?
- maintenance ownership ?

**Résolution** : R5 + R6 pour owner.

## D16.7 — Implementation discretion

**Questions internes**
- quels choix peuvent rester au dev ?
- quels choix changeraient produit/UX/data/NFR et doivent être figés ?

**Résolution** : R5 ; formalisation D20.

---

# D17 — Security, Privacy, Legal & Compliance

## D17.1 — Applicability classification

**Questions internes**
- juridiction ?
- données personnelles ? sensibles ?
- tracking/cookies ?
- secteur réglementé ?
- claims/titres professionnels ?

**Résolution** : R1/R3/R4 ; R9 si complexe.

## D17.2 — Data protection requirements

**Questions internes**
- minimisation ?
- lawful/declared purpose ?
- retention/deletion ?
- processors ?
- export/right requests si applicable ?
- privacy notice ?

**Résolution** : R5 ; expert si conséquence élevée.

## D17.3 — Access / secret / trust boundaries

**Questions internes**
- auth nécessaire ?
- roles/permissions ?
- secrets server-side ?
- admin surfaces ?
- external credentials ?

**Résolution** : R5.

## D17.4 — Input / abuse / form protection

**Questions internes**
- validation inputs ?
- rate limiting/spam/bot protection ?
- upload risk ?
- injection/XSS/CSRF concerns applicable ?
- external links ?

**Résolution** : R5 ; R9 pour high-risk.

## D17.5 — Legal/content compliance

**Questions internes**
- mentions légales/privacy/cookies ?
- consent wording ?
- claims/guarantees/certifications validés ?
- terms/conditions nécessaires ?

**Résolution** : R1/R5/R9.

**Règle** : l’IA ne signe pas une conformité juridique sensible.

---

# D18 — Accessibility, Performance, Reliability & Compatibility

## D18.1 — Accessibility target

**Questions internes**
- quel standard/profile cible ?
- obligations particulières ?
- interactions critiques ?
- media/forms/navigation ?

**Résolution** : R5 ; R9 si contexte réglementaire exige expertise.

## D18.2 — Keyboard / semantics / focus

**Questions internes**
- ordre de focus ?
- éléments natifs/roles ?
- labels/errors ?
- dialogs/menus/overlays ?
- skip/navigation landmarks ?

**Résolution** : R5.

## D18.3 — Visual accessibility

**Questions internes**
- contrastes ?
- taille/line-height ?
- focus visible ?
- information non dépendante de couleur ?
- alt/media captions ?

**Résolution** : R5.

## D18.4 — Motion / interaction accessibility

**Questions internes**
- prefers-reduced-motion ?
- aucune information uniquement hover/animation ?
- timing/auto-play ?

**Résolution** : R5.

## D18.5 — Responsive / device / browser support

**Questions internes**
- viewports ?
- navigateurs ?
- touch/safe areas ?
- orientation ?
- progressive degradation ?

**Résolution** : R1/R5.

## D18.6 — Performance targets

**Questions internes**
- LCP/CLS/INP ou budget spécifique utile ?
- poids images/fonts/scripts ?
- third-party impact ?
- lazy-loading/caching ?

**Résolution** : R5 ; valeurs mesurables, pas “site rapide”.

## D18.7 — Reliability / degraded mode

**Questions internes**
- que faire si API/form/email échoue ?
- retry/fallback ?
- message utilisateur ?
- availability expectation ?

**Résolution** : R5.

---

# D19 — Measurement, Analytics, Experimentation & Observability

## D19.1 — Measurement necessity

**Questions internes**
- quels outcomes doivent être mesurés ?
- analytics réellement nécessaires ?
- Search Console suffit-elle ?
- tracking tiers justifié ?

**Résolution** : R3/R5.

## D19.2 — Event model

**Questions internes**
- primary conversion events ?
- supporting events ?
- propriétés nécessaires ?
- data minimization ?
- consent dependency ?

**Résolution** : R5 + D17.

## D19.3 — SEO / acquisition measurement

**Questions internes**
- Search Console ?
- ranking/traffic/conversion linkage ?
- local signals ?

**Résolution** : R5.

## D19.4 — Operational observability

**Questions internes**
- form failures ?
- uptime/errors ?
- integration failures ?
- logs/alerts nécessaires ?
- owner/cadence ?

**Résolution** : R5.

## D19.5 — Experimentation

**Questions internes**
- A/B testing réellement utile ?
- trafic suffisant ?
- hypothesis + success metric ?
- consent/tech impact ?

**Résolution** : R3/R5.

**Règle** : experimentation n’est jamais ajoutée “par maturité produit” si volume/besoin ne le justifie pas.

---

# D20 — QA, Acceptance, Delivery Constraints & Handoff

## D20.1 — Requirement traceability

**Questions internes**
- chaque requirement critique a-t-il un WHY/source ?
- une SPEC ?
- un VERIFY/acceptance ?
- owner/authority ?
- artifact current/non-stale ?

**Résolution** : R3.

## D20.2 — Acceptance criteria

Pour chaque requirement critique :
- comportement attendu ;
- condition de succès ;
- erreur/failure ;
- evidence attendue ;
- environment/data prerequisite.

**Résolution** : R5.

## D20.3 — Risk-based test strategy

**Questions internes**
- unit/integration/e2e/manual/a11y/perf/security ?
- quels parcours critiques ?
- quelles integrations/data flows ?
- quels régressions sensibles ?

**Résolution** : R5.

## D20.4 — Test prerequisites

**Questions internes**
- environnements ?
- comptes/roles ?
- fixtures/données ?
- mocks/sandboxes ?
- services tiers ?

**Résolution** : R5 ; R6 pour accès privés.

## D20.5 — Ambiguity audit

**Question centrale** : qu’est-ce qu’un développeur compétent devrait encore inventer ?

Catégories : product behavior, business rule, page role, content requirement, data contract, integration contract, permission, NFR, acceptance.

**Résolution** : R3/R5.

Tout élément structurant non décidé crée `BLOCKER` ou `ACCEPTED_UNKNOWN` explicite si réellement admissible.

## D20.6 — Source-of-truth manifest

**Questions internes**
- où vit chaque spec ?
- quelle version fait autorité ?
- quels artifacts sont superseded ?
- quelles dependencies externes ?

**Résolution** : R3.

## D20.7 — Handoff package

Doit assembler selon applicability :
- approved Idea snapshot ;
- Decision Record ;
- scope/non-goals ;
- sitemap/page specs ;
- journeys/wireframes ;
- content/SEO specs ;
- functional/business rules/states ;
- data/CMS/roles ;
- integrations ;
- design definition ;
- technical architecture ;
- NFR ;
- acceptance/test plan ;
- risks/unknowns ;
- delivery profile ;
- source-of-truth manifest.

## D20.8 — Change-after-freeze policy

**Questions internes**
- comment demander un changement ?
- materiality ?
- impact graph ?
- qui approuve ?
- version/snapshot ?
- quels tests réouvrir ?

**Résolution** : R3/R8 pour approval.

## D20.9 — Ready for Development approval

**Checks**
- G8/G9/G10/G11 satisfaites selon applicability ;
- aucun blocker caché ;
- unknowns restants acceptés ;
- current artifacts uniquement ;
- implementation discretion explicite ;
- owner autorisé approuve.

**Résolution** : R3 audit + R8 formal approval.

---

# G10 / G11 / G12

## G10 PROJECT_TECH_NFR_STABLE
Architecture/data/integrations/security/privacy/accessibility/performance/reliability/measurement suffisamment définis et cohérents avec le produit.

## G11 TRACEABILITY_AND_ACCEPTANCE_READY
Requirements critiques reliés aux specs/verify ; test strategy, source-of-truth, risks, unknowns et discretion explicites.

## G12 READY_FOR_DEVELOPMENT
Le dossier permet de commencer le build sans reconstruire la stratégie, le produit, l’UX, la data, les intégrations ou les critères qualité dans la tête du développeur.

---

# Human questions — Tech/Build Ready

Interventions humaines légitimes restantes :
- vendor/hosting/platform imposé ;
- accès/ownership de domaine/services ;
- maintenance responsibility ;
- politique privacy/legal interne ;
- risk acceptance ;
- choix coût/complexité irréductible ;
- expert signoff selon risque ;
- approval Ready for Development.

La plupart des exigences techniques/NFR doivent être proposées automatiquement à partir du scope et des overlays, puis revues plutôt que demandées une par une.

# 4b4c — PROJECT PRODUCT / EXPERIENCE DETAILED CATALOG — V0.1

Date : 2026-09-13

Statut : **WORKING CANDIDATE — NON CANONIQUE**

Périmètre : D08→D15 après `APPROVED_FOR_PROJECT`.

Principe : reprendre les artifacts Z4/Z5 utiles, les promouvoir et les approfondir ; ne jamais recommencer par défaut.

---

# D08 — User Journeys, Conversion & Service Flow

## D08.1 — Journey inventory

**Questions internes**
- quels parcours principaux existent réellement ?
- quel parcours est critique vs secondaire ?
- qui est l’utilisateur de chaque parcours ?
- entry point et goal ?
- online-only ou handoff offline ?

**Résolution** : R1/R3 depuis Idea + sources ; R5 pour complétion.

**Humain** : seulement si processus métier caché.

## D08.2 — Primary journey specification

**Questions internes**
- séquence start→understand→proof→action ?
- quelles décisions intermédiaires ?
- quelles dépendances de contenu/fonction ?
- quels fallbacks ?
- que se passe-t-il après conversion ?

**Résolution** : R5.

**Lock** : `LOCKED_FOR_DEPENDENTS` avant page/spec détaillée.

## D08.3 — Objection / trust placement

**Questions internes**
- quelles objections à quel moment ?
- quelle preuve doit être visible avant CTA ?
- quelle preuve est suffisante ?

**Résolution** : R3/R5 depuis D03/D04/D10.

## D08.4 — Failure / alternate path

**Questions internes**
- que se passe-t-il si formulaire/réservation/API échoue ?
- alternative de contact ?
- user peut reprendre ?
- aucun cul-de-sac ?

**Résolution** : R5.

**Unlocks** : D12 states, D14 integrations, D20 tests.

---

# D09 — Information Architecture, Navigation & Page/Screen Model

## D09.1 — Surface inventory

**Questions internes**
- quelles pages/surfaces sont nécessaires ?
- lesquelles issues du concept sont conservées/fusionnées/supprimées ?
- lesquelles existent pour audience, proof, service, conversion, search ou legal ?

**Résolution** : R3/R5.

## D09.2 — Page/screen role specification

Pour chaque surface :
- rôle principal ;
- audience ;
- user question answered ;
- primary CTA ;
- supporting CTA ;
- evidence/content required ;
- entry/exit relationships.

**Résolution** : R5.

## D09.3 — Navigation model

**Questions internes**
- header/footer/contextual navigation ?
- labels compréhensibles ?
- profondeur ?
- menu mobile ?
- surfaces secondaires/noindex ?

**Résolution** : R5 ; R3 pour orphan/depth checks.

## D09.4 — Route / URL model

**Questions internes**
- path/slug intent ?
- route hierarchy ?
- canonical/index intent ?
- redirects/migration ?
- 404/fallback ?

**Résolution** : R5 + D11.

## D09.5 — IA verification

**Checks**
- aucune surface stratégique orpheline ;
- aucun doublon sans raison ;
- chaque page a rôle/CTA ;
- primary journeys traversent l’IA sans détour artificiel.

**Résolution** : R3.

---

# D10 — Content, Proof, Media & Content Operations

## D10.1 — Content inventory & reuse

**Questions internes**
- quels contenus actuels restent valables ?
- quoi supprimer, réécrire, migrer ?
- quelles preuves/assets existent ?
- droits/provenance ?

**Résolution** : R1/R2/R3.

## D10.2 — Content requirement model

Pour chaque section/surface :
- purpose ;
- message principal ;
- content type ;
- factual claims ;
- evidence/proof ;
- CTA/microcopy intent ;
- media ;
- owner/status.

**Résolution** : R5.

**Humain** : R6 seulement pour faits internes/promesses engageantes non sourcées.

## D10.3 — Messaging system

**Questions internes**
- proposition de valeur stable ?
- message hierarchy ?
- tone constraints ?
- benefit vs feature balance ?
- objection handling ?

**Résolution** : R5 ; R7 si préférence tone/brand structurante.

## D10.4 — Proof architecture

**Questions internes**
- quelles preuves à quel moment ?
- témoignage/cas/chiffre/certification/garantie ?
- source/fraîcheur/permission ?
- absence de preuve compensée comment ?

**Résolution** : R1/R5.

## D10.5 — Media specification

**Questions internes**
- type/rôle/ratio/cadrage ?
- réel vs stock vs illustration ?
- alt intent ?
- responsive variants ?
- owner/source/rights ?

**Résolution** : R5 ; R1 pour rights.

## D10.6 — Content operations

**Questions internes**
- qui rédige/valide/maintient ?
- contenu final disponible quand ?
- CMS nécessaire ?
- cadence de mise à jour ?
- fallback de contenu provisoire non publiable ?

**Résolution** : R6/R5.

**Build-ready rule** : contenu final peut manquer si requirement + owner + format + timing + fallback sont explicites.

---

# D11 — SEO, Discoverability & Migration

## D11.1 — SEO applicability

**Questions internes**
- SEO est-il un canal important ?
- local, service, contenu éditorial, marque ?
- effort SEO proportionné au business ?

**Résolution** : R3/R5.

## D11.2 — Search intent model

**Questions internes**
- requêtes/thèmes principaux ?
- intention informationnelle/commerciale/locale ?
- mapping intention→page ?
- cannibalisation ?

**Résolution** : R1/R3/R5.

## D11.3 — Page SEO specification

Pour chaque route indexable :
- intention ;
- title intent ;
- H1 intent ;
- description intent ;
- internal links ;
- structured data applicability ;
- canonical/index/noindex.

**Résolution** : R5.

## D11.4 — Local discoverability

**Questions internes**
- zones/pages locales nécessaires ?
- NAP/local proof ?
- Google Business/Profile interaction ?
- duplicate/local thin-content risk ?

**Résolution** : R1/R5.

## D11.5 — Migration plan

**Questions internes**
- URLs à préserver ?
- redirects ?
- pages à fusionner/supprimer ?
- canonical/sitemap/robots ?
- changement domaine ?
- search validation post-launch ?

**Résolution** : R2/R3/R5.

**Human** : seulement si business décide d’abandonner une page/URL à forte valeur malgré risque.

---

# D12 — Functional Requirements, Business Rules & UI States

## D12.1 — Feature inventory

**Questions internes**
- quelles capabilities conceptuelles sont promues ?
- quelles nouvelles fonctions sont nécessaires en Project ?
- must-have/later/rejected ?
- owner/business outcome ?

**Résolution** : R3/R5 ; R8 pour scope engageant.

## D12.2 — Functional behavior

Pour chaque feature :
- trigger ;
- inputs ;
- processing ;
- outputs ;
- success ;
- failure ;
- permissions ;
- dependencies ;
- analytics if any.

**Résolution** : R5.

## D12.3 — Business rules

**Questions internes**
- quelles règles métier déterminent comportement ?
- limites/eligibility/order/priorities ?
- horaires/zone/service availability ?
- règles de validation ?
- règles légales/commerciales ?

**Résolution** : R1/R6 pour vérité métier ; R5 pour formalisation.

**Humain** : seulement si règle interne non documentée.

## D12.4 — UI state model

Pour chaque interaction dynamique :
- default ;
- loading ;
- empty ;
- success ;
- error ;
- partial ;
- disabled ;
- offline/degraded si pertinent.

**Résolution** : R5.

## D12.5 — Edge cases

**Questions internes**
- données invalides ?
- double submit ?
- timeout ?
- quota ?
- service tiers unavailable ?
- missing content ?
- unsupported browser/device ?

**Résolution** : R4/R5.

## D12.6 — Acceptance linkage

Chaque requirement critique doit être lié à D20 VERIFY/acceptance.

---

# D13 — Data, Content Model, CMS, Roles & Permissions

## D13.1 — Data inventory

**Questions internes**
- quelles entités/données existent ?
- source of truth ?
- persistent vs ephemeral ?
- personal/sensitive ?
- ownership ?

**Résolution** : R1/R3/R5.

## D13.2 — Content model / CMS

**Questions internes**
- quels types de contenus répétables ?
- champs/relations/status ?
- besoin de preview/draft/publish ?
- qui édite ?
- historique/version ?

**Résolution** : R5.

## D13.3 — Roles & permissions

**Questions internes**
- utilisateurs publics vs admin/editor ?
- qui peut lire/créer/modifier/publier/supprimer ?
- besoin auth ?
- principe least privilege ?

**Résolution** : R5 ; R6/R8 pour responsabilité interne.

## D13.4 — Data lifecycle

**Questions internes**
- collecte → stockage → usage → retention → deletion ?
- export/portability ?
- backup/recovery ?

**Résolution** : R5 + D17.

## D13.5 — Data quality / migration

**Questions internes**
- données existantes à migrer ?
- mapping/transformation ?
- duplicates/missing values ?
- validation/reconciliation ?

**Résolution** : R2/R3/R5.

---

# D14 — Integrations, APIs, Notifications & External Services

## D14.1 — Integration inventory

**Questions internes**
- CRM, booking, maps, payment, email, newsletter, analytics, social, external API ?
- required vs optional ?
- vendor imposed ?

**Résolution** : R1/R5.

## D14.2 — Integration contract

Pour chaque integration :
- purpose ;
- data in/out ;
- auth method ;
- trigger/frequency ;
- success/failure ;
- rate/quota ;
- privacy/security ;
- owner ;
- fallback.

**Résolution** : R1/R5 ; R9 si security/compliance high-risk.

## D14.3 — Form/email/notification flows

**Questions internes**
- qui reçoit quoi ?
- confirmation utilisateur ?
- reply-to/from ?
- template/content ?
- retry/bounce/failure ?
- spam protection ?

**Résolution** : R5 ; R6 pour destination/owner.

## D14.4 — Dependency failure strategy

**Questions internes**
- que se passe-t-il si fournisseur indisponible ?
- bloque-t-il le parcours ?
- queue/retry/manual fallback ?
- messaging utilisateur ?

**Résolution** : R5.

---

# D15 — UX, UI, Brand & Design System Definition

## D15.1 — UX structure promotion

**Questions internes**
- quels wireframes/concepts Z4 sont promoted ?
- lesquels nécessitent rework ?
- quelles interactions doivent être détaillées ?

**Résolution** : R3/R5.

## D15.2 — Wireframe specification

Pour pages/flows stratégiques :
- section order ;
- hierarchy ;
- CTA placement ;
- proof placement ;
- responsive behavior ;
- interaction states.

**Résolution** : R5.

## D15.3 — Visual direction baseline

**Questions internes**
- territoire approuvé ?
- brand constraints ?
- anti-patterns ?
- image treatment ?
- motion philosophy ?

**Résolution** : R1/R7/R8.

## D15.4 — Design tokens

**Questions internes**
- color roles ;
- typography roles ;
- spacing/radii/shadows ;
- grid/max-width ;
- focus/error/success states ;
- motion durations/easing.

**Résolution** : R5 ; validation design owner.

## D15.5 — Component inventory

**Questions internes**
- header/footer/buttons/links/cards/section headings/forms/FAQ/gallery/etc. ?
- variants réellement nécessaires ?
- states normal/hover/focus/disabled/loading/error/success ?

**Résolution** : R5.

## D15.6 — Responsive & interaction behavior

**Questions internes**
- breakpoints/composition changes ?
- mobile nav ?
- touch targets ?
- overlays/drawers ?
- hover alternatives ?
- reduced motion ?

**Résolution** : R5 + D18.

## D15.7 — Design acceptance

**Verify**
- style cohérent avec target/positioning ;
- fidelity suffisante pour dev ;
- pas de décision UX critique laissée implicite ;
- accessibility constraints intégrées.

---

# G8 / G9 — Project product/experience gates

## G8 PROJECT_PRODUCT_DEFINITION_STABLE
- journeys ;
- sitemap/page roles ;
- content requirements ;
- SEO strategy ;
- functions/rules/states ;
- data/integration scope ;
- aucune contradiction majeure.

## G9 PROJECT_EXPERIENCE_DEFINITION_STABLE
- wireframes/interaction patterns ;
- visual baseline ;
- design system/components/responsive ;
- content/design dependencies connues ;
- dev ne doit pas inventer la structure UX.

---

# Human questions — Project Product

Questions humaines restantes typiques :
- règle métier interne non documentée ;
- owner de contenu/process ;
- arbitrage scope coût/valeur ;
- préférence visuelle finale si alternatives valides ;
- validation d’un claim/média/droit non vérifiable ;
- choix de migration ayant impact business.

Le reste doit être proposé/produit par 2b2c puis corrigible, pas demandé champ par champ.

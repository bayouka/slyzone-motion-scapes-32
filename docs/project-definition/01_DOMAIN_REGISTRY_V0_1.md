# 4b4c — PROJECT DEFINITION DOMAIN REGISTRY — V0.1

Date : 2026-09-13

Statut : **CANDIDATE DE TRAVAIL — NON CANONIQUE**

Ce registre détaille les Domaines professionnels du référentiel `Idea → Project Definition → Ready for Development`.

Il ne constitue ni un questionnaire utilisateur ni un workflow UX.

Chaque Domain regroupe des Requirement Atoms de type `INFO`, `ANALYSIS`, `DECISION`, `SPEC`, `VERIFY`.

---

# 0. Règles communes

1. Un Domain est une famille de responsabilités professionnelles, pas une phase visible.
2. Un Domain peut être partiellement actif dans plusieurs zones du lifecycle.
3. Sa profondeur dépend du Blueprint, des Context Overlays et de la Decision Question.
4. Un Domain peut être `NOT_RELEVANT` pour un projet donné.
5. Une sortie aval peut être explorée tôt, mais ne peut être `FROZEN_IN_SNAPSHOT` tant que ses dépendances structurantes ne sont pas assez stables.
6. L'utilisateur n'est interrogé qu'en dernier recours après RAW/MEM/SRC/AUDIT/WEB/CONN/CALC/AI.
7. Une exigence critique doit pouvoir être tracée jusqu'à une `SPEC` et, quand pertinent, une `VERIFY`.

---

# D01 — Governance, Stakeholders & Decision Context

## Mission
Savoir qui porte l'idée, qui peut décider, qui doit contribuer, quelles sources font autorité et quel niveau de décision est réellement recherché.

## Zones
IDEA_DECISION + PROJECT_DEFINITION + BUILD_READY.

## Questions professionnelles couvertes
- Qui est le Decision Owner ?
- Solo, équipe, client, comité ?
- Qui contribue sans décider ?
- Quels désaccords existent déjà ?
- Quel est le mode de décision ?
- Existe-t-il une date ou contrainte décisionnelle réelle ?
- Quelles sources de vérité ont autorité ?
- Quels éléments sont seulement consultatifs ?
- Quelle modification future exige une nouvelle validation ?

## Dépendances majeures
Peut s'activer dès I0 ; devient critique dès qu'un signal d'équipe, conflit, présentation ou validation contractuelle apparaît.

## Débloque
- décisions traçables ;
- résolution de conflits ;
- validation d'une Candidate ;
- Project baseline ;
- change governance ;
- handoff fiable.

## Livrables principaux
A01, A07, A08, A15.

---

# D02 — Business Context, Problem & Outcomes

## Mission
Transformer une envie de solution en problème/opportunité et résultats recherchés suffisamment clairs pour juger les directions possibles.

## Zones
Principalement IDEA_DECISION.

## Questions professionnelles couvertes
- Pourquoi ce projet existe-t-il ?
- Quel problème ou opportunité motive la démarche ?
- Pour qui ce problème existe-t-il ?
- Qu'est-ce qui se passe aujourd'hui ?
- Pourquoi maintenant ?
- Quel résultat business/communication est attendu ?
- Quel changement utilisateur est recherché ?
- Quels critères qualitatifs/chiffrés sont réellement utiles ?
- Quelles contraintes business sont déjà non négociables ?

## Dépendances majeures
Raw idea, organisation, existing signals.

## Débloque
D03, D05, D06, D07 et la pertinence des analyses.

## Livrables principaux
A02, A06, A07.

---

# D03 — Users, Audiences, Segments & Jobs

## Mission
Comprendre les personnes/organisations concernées, leurs besoins, jobs, freins, critères de choix, contexte d'acquisition et d'usage.

## Zones
IDEA_DECISION → PROJECT_DEFINITION.

## Questions professionnelles couvertes
- Cible principale/secondaire ?
- B2B/B2C/interne/mixte ?
- Segments réellement distincts ?
- Qui décide, qui influence, qui utilise ?
- Besoin/job principal ?
- Problèmes, attentes, motivations ?
- Objections et critères de confiance ?
- Contexte d'usage ?
- Acquisition actuelle ?
- Signaux réels disponibles ?

## Dépendances majeures
D02 + offre/existant minimal.

## Débloque
sélection des concurrents, positionnement, conversion, IA, contenus, SEO, UX et tests.

## Livrables principaux
A03, A05, A06, A09, A10.

---

# D04 — Existing State, Assets & Evidence

## Mission
Établir une baseline factuelle de l'organisation et de ce qui existe déjà, sans confondre déclaration, observation, preuve et interprétation.

## Zones
IDEA_DECISION + PROJECT_DEFINITION.

## Couverture
- site/app actuel ;
- sitemap/pages/routes ;
- contenus ;
- offres ;
- CTA/formulaires ;
- analytics/Search Console/CRM si disponibles ;
- SEO et URLs à préserver ;
- marque/charte ;
- assets ;
- preuves ;
- contraintes historiques ;
- performance/frictions ;
- dette ou éléments à conserver/supprimer.

## Dépendances majeures
Sources disponibles + permissions appropriées.

## Débloque
D05, D06, D07, migration, content reuse, risk assessment.

## Livrables principaux
A04, A06, A08, A10.

---

# D05 — Market, Competition, Alternatives & References

## Mission
Confronter l'idée et l'organisation au réel : concurrents directs, alternatives, attentes de marché, références exemplaires, patterns, gaps et opportunités.

## Zones
IDEA_DECISION ; réutilisation ponctuelle en PROJECT_DEFINITION.

## Couverture
- terrain de comparaison ;
- concurrents directs ;
- alternatives indirectes ;
- substituts/non-consommation si pertinent ;
- positionnements ;
- offres/prix visibles ;
- acquisition/SEO visible ;
- messages ;
- CTA/parcours ;
- preuves ;
- fonctions ;
- contenu ;
- références hors concurrence ;
- forces/faiblesses observables ;
- banalités du marché ;
- opportunités ;
- tendances uniquement si décisionnelles.

## Dépendances majeures
D02 + D03 + offre/zone suffisamment identifiables.

## Débloque
D06, différenciation, options, simplification, evidence stratégique.

## Livrables principaux
A05, A06, A07.

---

# D06 — Opportunity, Strategy, Value Proposition & Positioning

## Mission
Transformer Discovery + Evidence en options de meilleure qualité que l'idée brute, puis choisir une direction stratégique défendable.

## Zones
IDEA_DECISION.

## Couverture
- opportunités ;
- hypothèses critiques ;
- challenge ;
- simplification ;
- différenciation ;
- proposition de valeur candidate ;
- hiérarchie de messages ;
- positioning candidates ;
- alternatives ;
- trade-offs ;
- stratégie de conversion macro ;
- probes de faisabilité nécessaires ;
- recommandation ;
- décision GO/REVISE/DEEPEN/PAUSE/STOP.

## Dépendances majeures
D02+D03 et evidence D04/D05 suffisante selon le cas.

## Débloque
frontière Idea→Project et D07 macro.

## Livrables principaux
A06, A07.

---

# D07 — Offer, Product/Service Model & Scope

## Mission
Définir ce que la direction retenue promet concrètement et distinguer l'offre/solution essentielle de ce qui est optionnel, différé ou non recommandé.

## Zones
IDEA macro → PROJECT détaillé.

## Couverture
- catalogue/offres ;
- offre prioritaire ;
- services à développer/réduire ;
- modèle de valeur ;
- promesse ;
- capability candidates ;
- scope macro ;
- must-have vs later vs not recommended ;
- dépendances business ;
- limites explicites.

## Dépendances majeures
D06 pour freeze stratégique ; D12-D14 pour scope fonctionnel détaillé.

## Débloque
D08, D09, D10, D12-D16.

## Livrables principaux
A07, A08, A11, A15.

---

# D08 — User Journeys, Conversion & Service Flow

## Mission
Décrire comment un utilisateur progresse d'une situation initiale vers l'objectif attendu, y compris choix, frictions, réassurance, conversion et fallback.

## Zones
PROJECT_DEFINITION.

## Couverture
- entry points ;
- primary journey ;
- secondary journeys ;
- conversion events ;
- proof moments ;
- objections ;
- fallback ;
- mobile/context constraints ;
- service flow hors interface si nécessaire.

## Dépendances majeures
D03+D07 ; evidence D04/D05 selon cas.

## Débloque
D09, D10, D12, D19.

## Livrables principaux
A09, A10, A11.

---

# D09 — Information Architecture, Navigation & Page/Screen Model

## Mission
Transformer les journeys et le scope en structure navigable et compréhensible.

## Zones
PROJECT_DEFINITION.

## Couverture
- sitemap / screen map ;
- routes ;
- navigation ;
- rôle de chaque page/screen ;
- audience ;
- objectif ;
- CTA ;
- index/noindex si web ;
- états conditionnels ;
- liens internes ;
- taxonomy si nécessaire.

## Dépendances majeures
D07+D08 ; D11 si SEO structurel.

## Débloque
D10, D11, D12, D15.

## Livrables principaux
A09, A10.

---

# D10 — Content, Proof, Media & Content Operations

## Mission
Définir le contenu nécessaire au fonctionnement du produit, ses preuves, médias, provenance, propriétaires et cycle de vie.

## Zones
PROJECT_DEFINITION.

## Couverture
- messages principaux ;
- content requirements par page/screen ;
- preuve/réassurance ;
- médias ;
- FAQ ;
- microcopy ;
- contenu existant à réemployer ;
- contenu manquant ;
- droits/provenance ;
- content owner ;
- update frequency ;
- CMS/content ops si pertinent.

## Dépendances majeures
D07-D09.

## Débloque
D11, D12, D15 et Build Ready selon dépendances.

## Livrables principaux
A10, A12.

---

# D11 — SEO, Discoverability & Migration

## Mission
Définir comment les contenus/pages doivent être découverts, compris et préserver l'acquisition existante quand cela est pertinent.

## Zones
IDEA probe + PROJECT_DEFINITION.

## Couverture
- search intents ;
- keyword/topic clusters ;
- page-intent mapping ;
- local SEO ;
- crawl/indexation ;
- metadata requirements ;
- structured data applicable ;
- internal linking ;
- migration URLs ;
- redirects ;
- content consolidation ;
- legacy SEO risk.

## Dépendances majeures
D03+D07+D09+D10 ; D04 si redesign.

## Débloque
final IA/content/technical migration requirements.

## Livrables principaux
A10, A13, A14.

---

# D12 — Functional Requirements, Business Rules & UI States

## Mission
Définir les comportements attendus avec assez de précision pour éviter que le développeur invente les règles produit.

## Zones
PROJECT_DEFINITION.

## Couverture
- feature requirements ;
- actor/user ;
- trigger ;
- preconditions ;
- happy path ;
- business rules ;
- permissions impact ;
- validation ;
- loading/empty/error/success ;
- edge cases ;
- fallbacks ;
- acceptance intent.

## Dépendances majeures
D07-D09.

## Débloque
D13-D18, A11, acceptance plan.

## Livrables principaux
A11, A14.

---

# D13 — Data, Content Model, CMS, Roles & Permissions

## Mission
Définir les données persistantes ou administrables nécessaires et qui peut les lire/modifier.

## Zones
PROJECT_DEFINITION conditionnel.

## Couverture
- entities ;
- fields ;
- relationships ;
- lifecycle/status ;
- CMS needs ;
- admin responsibilities ;
- roles ;
- permissions ;
- retention ;
- import/export ;
- source of truth ;
- migration.

## Dépendances majeures
D12 ; D10 pour contenu ; D17 pour données sensibles.

## Débloque
D14, D16, D17, tests.

## Livrables principaux
A11, A13.

---

# D14 — Integrations, APIs, Notifications & External Services

## Mission
Spécifier les dépendances externes et leurs contrats fonctionnels.

## Zones
PROJECT_DEFINITION conditionnel.

## Couverture
- service/provider ;
- purpose ;
- data exchanged ;
- auth ;
- API/webhook ;
- rate/quotas ;
- error/fallback ;
- email/SMS/push ;
- deliverability ;
- ownership ;
- outage behavior ;
- legal/security dependency.

## Dépendances majeures
D12+D13.

## Débloque
D16-D18, A13, A14.

## Livrables principaux
A11, A13, A14.

---

# D15 — UX, UI, Brand & Design System Definition

## Mission
Matérialiser l'expérience et les contraintes visuelles avec le niveau de fidélité nécessaire avant développement.

## Zones
PROJECT_DEFINITION.

## Couverture
- UX principles ;
- wireframes ;
- responsive behavior ;
- page/screen hierarchy ;
- brand constraints ;
- visual direction ;
- tokens ;
- typography ;
- components ;
- variants/states ;
- motion ;
- design accessibility constraints ;
- empty/error/loading states when visual.

## Dépendances majeures
D08-D12 ; brand D04.

## Débloque
G6, implementation handoff.

## Livrables principaux
A09, A12.

---

# D16 — Technical Architecture, Platform, Environments & Operations

## Mission
Choisir une architecture proportionnée au produit défini, sans transformer trop tôt des préférences techniques en contraintes produit.

## Zones
IDEA feasibility probe + PROJECT_DEFINITION.

## Couverture
- build/buy/no-code/custom decision ;
- frontend/backend ;
- rendering/deployment ;
- hosting ;
- storage/database ;
- CMS ;
- environment model ;
- secrets/config ;
- background jobs ;
- cache ;
- backups ;
- maintenance ;
- operational ownership ;
- delivery profile selection.

## Dépendances majeures
D07+D12-D14+D17-D18.

## Débloque
G7, delivery profile, acceptance tests.

## Livrables principaux
A13, A15.

---

# D17 — Security, Privacy, Legal & Compliance

## Mission
Identifier et transformer en exigences les risques de sécurité, données personnelles, obligations légales et contraintes sectorielles applicables.

## Zones
IDEA risk probe + PROJECT_DEFINITION.

## Couverture
- personal/sensitive data ;
- legal basis/consent ;
- cookie/tracking ;
- retention/deletion ;
- access control ;
- abuse/spam ;
- auth/session if relevant ;
- secrets ;
- third-party processors ;
- sector claims/disclosures ;
- legal pages ;
- expert escalation.

## Dépendances majeures
D12-D14 + jurisdiction/context.

## Débloque
D16, D18, Build Ready.

## Livrables principaux
A13, A14.

---

# D18 — Accessibility, Performance, Reliability & Compatibility

## Mission
Définir les qualités non-fonctionnelles observables que le produit doit respecter.

## Zones
PROJECT_DEFINITION.

## Couverture
- accessibility target ;
- keyboard/focus ;
- contrast/text/media ;
- responsive/mobile ;
- browser/device matrix ;
- performance budgets/targets if justified ;
- resilience ;
- degraded states ;
- route refresh/fallback ;
- reliability expectations ;
- reduced motion.

## Dépendances majeures
D09+D12+D15+D16.

## Débloque
A13/A14, G7-G9.

## Livrables principaux
A13, A14.

---

# D19 — Measurement, Analytics, Experimentation & Observability

## Mission
Relier les Outcomes initiaux à des signaux mesurables et définir l'instrumentation réellement utile.

## Zones
IDEA success framing → PROJECT_DEFINITION.

## Couverture
- success measures ;
- events/conversions ;
- analytics need ;
- privacy constraints ;
- SEO measurement ;
- operational alerts ;
- experiment needs ;
- dashboards/reports ;
- ownership and review cadence.

## Dépendances majeures
D02+D08+D12+D17.

## Débloque
A14, post-launch learning plan.

## Livrables principaux
A02, A13, A14.

---

# D20 — QA, Acceptance, Delivery Constraints & Handoff

## Mission
Prouver que la définition est assez précise et testable pour être remise au développement sans ambiguïté structurante.

## Zones
BUILD_READY.

## Couverture
- acceptance criteria ;
- requirement→spec→verify traceability ;
- test strategy ;
- critical paths ;
- edge cases ;
- evidence expected ;
- unresolved risks ;
- accepted unknowns ;
- delivery constraints ;
- implementation discretion ;
- source-of-truth manifest ;
- handoff package.

## Dépendances majeures
Tous Domaines applicables.

## Débloque
G8 puis G9 READY_FOR_DEVELOPMENT.

## Livrables principaux
A14, A15.

---

# Résumé des dépendances structurantes

```text
D01 Governance
  └──────────────┐
D02 Problem/Outcome ─┐
D03 Users ───────────┼──> D05 Market/Evidence ─> D06 Strategy/Options ─> IDEA DECISION
D04 Existing ────────┘                                 │
                                                     D07 Scope macro
                                                       │
                 ┌─────────────────────────────────────┼─────────────────────┐
                 v                                     v                     v
              D08 Journeys                          D09 IA                D12 Functions
                 │                                     │                     │
                 └──────────────┬──────────────────────┘                     │
                                v                                            │
                              D10 Content <──────> D11 SEO                   │
                                │                                            │
                                ├───────────────> D15 UX/UI                  │
                                │                                            v
                                └──────────────────────────────> D13 Data / D14 Integrations
                                                                        │
                                                                        v
                                                     D16 Technical <-> D17 Security/Privacy
                                                           │              │
                                                           └──────┬───────┘
                                                                  v
                                                               D18 NFR
                                                                  │
D19 Measurement <─────────────────────────────────────────────────┘
                                                                  │
                                                                  v
                                                         D20 QA/Handoff
                                                                  │
                                                                  v
                                                      READY_FOR_DEVELOPMENT
```

Ce graphe représente des dépendances structurantes, pas une séquence unique.

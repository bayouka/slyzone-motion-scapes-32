# 4b4c — IDEA REQUIREMENT ATOM REGISTRY — V0.1

Date : 2026-09-13

Statut : **WORKING CANDIDATE — NON CANONIQUE / À RED-TEAMER**

Périmètre : atoms principalement nécessaires avant `IDEA_DECISION_READY`, couvrant D01→D07.

Ce registre ne doit jamais être montré tel quel à l'utilisateur.

L'objectif est de permettre à 4b4c de savoir : ce qui est connu, ce qui doit être analysé, ce qui doit être décidé, ce qui peut être proposé par IA, ce qui doit être sourcé, ce qui peut être différé et ce qui bloque réellement une décision.

---

# Légende

Types : `INFO`, `ANALYSIS`, `DECISION`, `SPEC`, `VERIFY`.

Acquisition : `MEM`, `RAW`, `SRC`, `AUDIT`, `WEB`, `CONN`, `CALC`, `AI-H`, `AI-R`, `HUM`, `EXPERT`.

Gates :
- G1 `DISCOVERY_FOUNDATION_SUFFICIENT`
- G2 `EVIDENCE_CONTEXT_SUFFICIENT`
- G3 `STRATEGIC_OPTIONS_READY`
- G4 `IDEA_DECISION_READY`

Criticité : `BLOCKING`, `REQUIRED`, `CONDITIONAL`, `ENHANCER`, `NOT_RELEVANT`.

---

# D01 — Governance, Stakeholders & Decision Context

| ID | Type | Atom | Pourquoi | Acquisition | Gate / règle |
|---|---|---|---|---|---|
| D01.I01 | INFO | Decision mode : solo / équipe / client / comité | Détermine gouvernance et validation | RAW / HUM / signal | G4 CONDITIONAL |
| D01.I02 | INFO | Decision owner | Savoir qui peut engager la décision | HUM / source organisationnelle | G4 BLOCKING si équipe |
| D01.I03 | INFO | Contributors / reviewers | Organiser contributions sans confondre décision | HUM | ENHANCER puis REQUIRED si workflow collectif |
| D01.I04 | INFO | Known disagreements | Éviter consensus fictif | HUM / collaboration | G4 CONDITIONAL |
| D01.I05 | INFO | Decision date / external deadline | Calibrer profondeur et urgence | HUM / calendar/source | CONDITIONAL |
| D01.I06 | INFO | Existing approvals / commitments | Détecter contraintes politiques/contractuelles | SRC / HUM | CONDITIONAL |
| D01.I07 | INFO | Source authority hierarchy | Gérer contradictions entre brief, site, docs, utilisateur | HUM / deterministic rule | REQUIRED si sources multiples |
| D01.A01 | ANALYSIS | Governance complexity assessment | Décider si workflow solo ou collectif suffit | CALC / AI-H | G1 ENHANCER |
| D01.A02 | ANALYSIS | Conflict relevance assessment | Savoir quels désaccords influencent réellement la décision | CALC / AI-H | G4 REQUIRED si conflit |
| D01.D01 | DECISION | Active decision owner | Source de vérité sur qui tranche | HUM | G4 BLOCKING si équipe |
| D01.D02 | DECISION | Decision method | Owner / consensus / majorité / autre | HUM | CONDITIONAL |
| D01.D03 | DECISION | Accepted source precedence | Empêcher arbitrage IA silencieux | HUM / rule | REQUIRED si conflit de sources |
| D01.V01 | VERIFY | Decision authority is unambiguous | Le système peut attribuer une décision à la bonne autorité | CALC | G4 |

## Change impact
Un changement de Decision Owner ou de mode de gouvernance ne rouvre pas automatiquement les analyses métier ; il rouvre les validations/décisions dont l'autorité était liée à l'ancien owner.

---

# D02 — Business Context, Problem & Outcomes

| ID | Type | Atom | Pourquoi | Acquisition | Gate / règle |
|---|---|---|---|---|---|
| D02.I01 | INFO | Organisation / porteur | Situer l'idée | RAW / SRC | G1 REQUIRED |
| D02.I02 | INFO | Secteur / activité | Cadrer marché et research | RAW / SRC / WEB / AI-H | G1 REQUIRED |
| D02.I03 | INFO | Lifecycle organisation : existante / création | Ajuster audit et preuve | RAW / SRC / AI-H | CONDITIONAL |
| D02.I04 | INFO | Trigger / motif de la démarche | Comprendre pourquoi le sujet existe | RAW / HUM / AI-H | ENHANCER |
| D02.I05 | INFO | Why now | Identifier urgence/opportunité | RAW / HUM | CONDITIONAL |
| D02.I06 | INFO | Problem statement déclaré | Capturer perception humaine du problème | RAW / HUM | G1 REQUIRED ou working hypothesis |
| D02.I07 | INFO | Opportunity statement déclaré | Capturer opportunité recherchée | RAW / HUM | ENHANCER |
| D02.I08 | INFO | Primary business/communication objective | Critère majeur de jugement des options | RAW / HUM | G1 BLOCKING si impossible à hypothétiser honnêtement |
| D02.I09 | INFO | Secondary objectives | Gérer arbitrages | RAW / HUM / AI-H | G3 CONDITIONAL |
| D02.I10 | INFO | Desired user outcome | Relier objectif business à comportement utilisateur | RAW / HUM / AI-R | G1 REQUIRED |
| D02.I11 | INFO | Primary conversion/action candidate | Préparer parcours/solution | CALC / AI-R / HUM | G3 REQUIRED, pas forcément HUMAN_DECISION |
| D02.I12 | INFO | Current baseline / KPI | Mesurer si données réelles utiles | CONN / SRC | CONDITIONAL |
| D02.I13 | INFO | Success criteria qualitative | Juger les directions même sans KPI | AI-R / HUM | G3 REQUIRED |
| D02.I14 | INFO | Numeric target | Éviter pseudo-précision | HUM / CALC | uniquement si décision chiffrée |
| D02.I15 | INFO | Budget hard cap | Constraint réelle, pas estimation IA | HUM | G3/G4 CONDITIONAL |
| D02.I16 | INFO | Hard deadline | Constraint réelle | HUM | CONDITIONAL |
| D02.I17 | INFO | Internal resource constraint | Peut rendre une option irréaliste | HUM | CONDITIONAL |
| D02.I18 | INFO | Forced platform/vendor/contract | Peut limiter les options | HUM / SRC | CONDITIONAL |
| D02.A01 | ANALYSIS | Declared problem vs observed problem distinction | Ne pas transformer audit en causalité inventée | AUDIT / AI-H | G2 REQUIRED si redesign |
| D02.A02 | ANALYSIS | Root-cause hypotheses | Challenger la formulation initiale | AI-H / evidence | G2 ENHANCER |
| D02.A03 | ANALYSIS | Outcome hierarchy | Prioriser objectif principal vs secondaires | CALC / AI-H | G3 REQUIRED |
| D02.A04 | ANALYSIS | Constraint impact assessment | Identifier options éliminées par contraintes | CALC / AI-H | G3 CONDITIONAL |
| D02.D01 | DECISION | Primary objective accepted as current | Fixe le critère principal pour comparer les options | HUM ou accepted explicit hypothesis | G3 REQUIRED |
| D02.D02 | DECISION | Critical constraints accepted | Empêche options incompatibles | HUM | G3 CONDITIONAL |
| D02.V01 | VERIFY | Future option can be judged against explicit outcomes | Évite décision par goût | CALC | G3 |

## Rescue path
Si l'utilisateur ne sait pas formuler l'objectif, 2b2c propose des outcomes plausibles à partir de l'activité et du contexte, puis demande seulement un arbitrage si plusieurs directions changent réellement la solution.

---

# D03 — Users, Audiences, Segments & Jobs

| ID | Type | Atom | Pourquoi | Acquisition | Gate / règle |
|---|---|---|---|---|---|
| D03.I01 | INFO | Audience model B2B/B2C/mixte/interne | Structure marché et parcours | RAW / SRC / CALC | G1 REQUIRED |
| D03.I02 | INFO | Primary audience | Permet research/positionnement fiables | RAW / SRC / CONN / AI-H / HUM | G1 REQUIRED, hypothesis allowed |
| D03.I03 | INFO | Secondary audience | Évite architecture centrée sur cas marginal | RAW / SRC / AI-H | CONDITIONAL |
| D03.I04 | INFO | Segment definition | Choisir bons concurrents et besoins | RAW / CONN / AI-H / HUM | G1/G2 REQUIRED selon marché |
| D03.I05 | INFO | Geography / market area | Localise concurrence/SEO/régulation | RAW / SRC / WEB | CONDITIONAL, souvent REQUIRED local |
| D03.I06 | INFO | Buyer / decision-maker | Important B2B/multi-acteurs | RAW / WEB / AI-H | CONDITIONAL |
| D03.I07 | INFO | User / beneficiary distinct from buyer | Évite confusion achat/usage | RAW / WEB / AI-H | CONDITIONAL |
| D03.I08 | INFO | Primary job-to-be-done / need | Base valeur/parcours | RAW / WEB / AI-H | G2 REQUIRED |
| D03.I09 | INFO | Desired benefit/outcome | Clarifie promesse | RAW / WEB / AI-H | G2 REQUIRED |
| D03.I10 | INFO | Selection criteria | Explique comment la cible compare | WEB / SRC / AI-H | G2 ENHANCER→REQUIRED si positionnement compétitif |
| D03.I11 | INFO | Objections / fears | Alimente preuve/conversion | WEB / SRC / AI-H | G2 ENHANCER |
| D03.I12 | INFO | Trust requirements | Critique pour santé, finance, local, high-ticket | WEB / SRC / AI-H | CONDITIONAL |
| D03.I13 | INFO | Knowledge/maturity level | Ajuste message et profondeur | WEB / AI-H | ENHANCER |
| D03.I14 | INFO | Usage context | Mobile, urgence, comparaison, access context | WEB / SRC / AI-H | CONDITIONAL |
| D03.I15 | INFO | Discovery/acquisition channels | Relie marché au parcours | CONN / SRC / WEB / AI-H | ENHANCER |
| D03.I16 | INFO | Real behavior evidence | Analytics, calls, CRM, reviews | CONN / SRC | ENHANCER, peut devenir REQUIRED pour décisions à fort enjeu |
| D03.A01 | ANALYSIS | Segment priority analysis | Détermine cible primaire crédible | CALC / AI-H | G2 REQUIRED si segments multiples |
| D03.A02 | ANALYSIS | Need evidence synthesis | Sépare besoins sourcés et hypothèses | AI-H / evidence | G2 REQUIRED |
| D03.A03 | ANALYSIS | Objection/trust model | Prépare proposition de valeur et preuve | AI-H | G3 ENHANCER |
| D03.D01 | DECISION | Primary audience accepted | Évite de bâtir pour tout le monde | HUM ou accepted working hypothesis | G3 REQUIRED |
| D03.D02 | DECISION | Segment priority | Human-only si choix stratégique interne | HUM | CONDITIONAL |
| D03.V01 | VERIFY | Market research can be targeted without guessing audience | Gate pour D05 | CALC | G1/G2 |

## Change impact
Un changement de cible principale peut invalider D05 market selection, D06 positioning/options, puis en Project D08-D11 et une partie D15.

---

# D04 — Existing State, Assets & Evidence

| ID | Type | Atom | Pourquoi | Acquisition | Gate / règle |
|---|---|---|---|---|---|
| D04.I01 | INFO | Creation vs redesign | Active audit/migration | RAW / SRC / AI-H | G1 REQUIRED |
| D04.I02 | INFO | Existing site/product URL | Source primaire redesign | RAW / SRC | REQUIRED si redesign web |
| D04.I03 | INFO | Existing sitemap/pages/routes | Baseline structure | AUDIT / SRC | G2 CONDITIONAL |
| D04.I04 | INFO | Existing offer/catalog | Comprendre ce qui est réellement vendu | SRC / RAW | G1 REQUIRED site commercial |
| D04.I05 | INFO | Offer freshness/current validity | Évite reprendre offre obsolète | SRC / HUM | G3 REQUIRED si source ancienne |
| D04.I06 | INFO | Existing content inventory | Réemploi/gaps | AUDIT / SRC | G2 CONDITIONAL |
| D04.I07 | INFO | Existing CTA/forms | Baseline conversion | AUDIT | G2 ENHANCER |
| D04.I08 | INFO | Existing analytics | Evidence comportementale | CONN / SRC | CONDITIONAL |
| D04.I09 | INFO | Search Console / SEO data | Evidence acquisition | CONN / SRC | CONDITIONAL |
| D04.I10 | INFO | Critical URLs / rankings | Migration risk | CONN / AUDIT | CONDITIONAL redesign SEO |
| D04.I11 | INFO | Brand identity/guidelines | Constraint visuelle potentielle | SRC / HUM | CONDITIONAL |
| D04.I12 | INFO | Assets photos/videos/logo | Projection/content reuse | SRC | ENHANCER |
| D04.I13 | INFO | Proof assets | Témoignages, cas, certifs, chiffres | SRC | G2 ENHANCER |
| D04.I14 | INFO | Existing must-keep | Constraint humaine | HUM / RAW | G3 CONDITIONAL |
| D04.I15 | INFO | Existing must-remove | Constraint/intention | HUM / AI-R | G3 CONDITIONAL |
| D04.I16 | INFO | Current technical/platform constraints | Feasibility probe | AUDIT / SRC | CONDITIONAL |
| D04.I17 | INFO | Known legal/compliance constraints | Risk probe | SRC / HUM | CONDITIONAL |
| D04.A01 | ANALYSIS | Existing strengths | Ce qui mérite conservation | AUDIT / AI-H | G2 ENHANCER |
| D04.A02 | ANALYSIS | Existing weaknesses/frictions | Ce qui freine objectifs | AUDIT / AI-H | G2 REQUIRED redesign |
| D04.A03 | ANALYSIS | Evidence quality/freshness | Savoir ce qui est fiable | CALC / AI-H | G2 REQUIRED |
| D04.A04 | ANALYSIS | Migration risk probe | SEO/content/data risk | AUDIT / AI-H | G3 CONDITIONAL |
| D04.D01 | DECISION | Existing constraints accepted as current | Évite audit obsolète | HUM si ambigu | G3 CONDITIONAL |
| D04.V01 | VERIFY | Observations are linked to sources, not invented causal claims | Integrity | CALC | G2 |

---

# D05 — Market, Competition, Alternatives & References

| ID | Type | Atom | Pourquoi | Acquisition | Gate / règle |
|---|---|---|---|---|---|
| D05.I01 | INFO | Market/category definition | Évite mauvais benchmark | D02+D03+D04 / CALC | G2 REQUIRED |
| D05.I02 | INFO | Geographic scope | Pertinence des acteurs | D03 / WEB | CONDITIONAL |
| D05.I03 | INFO | Direct competitors | Comparaison même audience/offre | WEB / RAW | G2 CONDITIONAL→REQUIRED commercial |
| D05.I04 | INFO | Indirect alternatives | Comprendre substitutions | WEB / AI-H | G2 CONDITIONAL |
| D05.I05 | INFO | Non-consumption / DIY alternative | Voir vraie concurrence comportementale | WEB / AI-H | ENHANCER |
| D05.I06 | INFO | Reference exemplars | Chercher excellence hors concurrents directs | WEB / RAW | ENHANCER |
| D05.I07 | INFO | Competitor target/positioning | Base différenciation | WEB / AUDIT / AI-H | G2 REQUIRED si competitors active |
| D05.I08 | INFO | Competitor offers/pricing visible | Compare proposition | WEB | ENHANCER |
| D05.I09 | INFO | Competitor messages/value props | Détecte banalités/gaps | WEB / AUDIT | G2 ENHANCER |
| D05.I10 | INFO | Competitor CTA/conversion patterns | Inspiration/friction | AUDIT | ENHANCER |
| D05.I11 | INFO | Competitor proof/trust patterns | Alimente rassurance | AUDIT | ENHANCER |
| D05.I12 | INFO | Competitor content/SEO patterns | Discoverability insight | WEB / AUDIT | CONDITIONAL |
| D05.I13 | INFO | Competitor capabilities/features | Évite copier par mimétisme | AUDIT | ENHANCER |
| D05.I14 | INFO | Market trends | Seulement si change décision | WEB | CONDITIONAL |
| D05.A01 | ANALYSIS | Competitor selection relevance | Vérifier que les acteurs comparés sont pertinents | CALC / AI-H | G2 REQUIRED |
| D05.A02 | ANALYSIS | Pattern synthesis | Ce qui est standard vs distinctif | AI-H | G2/G3 REQUIRED |
| D05.A03 | ANALYSIS | Transferable strengths | Ce qui peut être repris intelligemment | AI-R | G3 ENHANCER |
| D05.A04 | ANALYSIS | Weakness/friction synthesis | Ce qu'il faut éviter | AI-H | G3 ENHANCER |
| D05.A05 | ANALYSIS | Market gap/opportunity hypotheses | Alimente options stratégiques | AI-H | G3 REQUIRED si market evidence disponible |
| D05.A06 | ANALYSIS | Differentiation whitespace | Identifie espaces de positionnement | AI-H | G3 ENHANCER |
| D05.V01 | VERIFY | Each strategic market claim has source/observation or explicit hypothesis | Integrity | CALC | G2/G3 |

## Règle de non-pertinence
Si aucun concurrent direct pertinent n'existe ou si le benchmark ne peut pas changer la décision, D05 peut être satisfait par alternatives/références ou `NOT_RELEVANT` justifié ; il ne faut pas inventer une concurrence.

---

# D06 — Opportunity, Strategy, Value Proposition & Positioning

| ID | Type | Atom | Pourquoi | Acquisition | Gate / règle |
|---|---|---|---|---|---|
| D06.A01 | ANALYSIS | Opportunity synthesis | Transforme evidence en leviers | AI-H / CALC | G3 REQUIRED |
| D06.A02 | ANALYSIS | Original idea challenge | Vérifie si la solution initiale reste pertinente | AI-H / evidence | G3 REQUIRED |
| D06.A03 | ANALYSIS | Simplification opportunities | Cherche solution plus simple à valeur équivalente | AI-R | G3 REQUIRED si scope complexe |
| D06.A04 | ANALYSIS | Risky assumptions | Identifie hypothèses pouvant renverser la direction | AI-H | G3 REQUIRED |
| D06.A05 | ANALYSIS | Strategic constraints synthesis | Filtre options incompatibles | CALC | G3 REQUIRED |
| D06.A06 | ANALYSIS | Feasibility probes required | Décide quelles inconnues techniques doivent être testées avant GO | AI-H / expert/tool | G3 CONDITIONAL |
| D06.I01 | INFO | Candidate value proposition A | Option stratégique | AI-R | G3 REQUIRED |
| D06.I02 | INFO | Candidate value proposition B | Alternative réellement distincte si utile | AI-R | G3 CONDITIONAL |
| D06.I03 | INFO | Candidate value proposition C | Alternative supplémentaire seulement si vrai trade-off | AI-R | ENHANCER |
| D06.I04 | INFO | Positioning candidate(s) | Traduction marché | AI-R | G3 REQUIRED |
| D06.I05 | INFO | Message hierarchy candidate | Rend option concrète | AI-R | G3 ENHANCER |
| D06.I06 | INFO | Macro conversion strategy | Relie valeur à action | AI-R | G3 REQUIRED |
| D06.I07 | INFO | Candidate risks/trade-offs | Empêche recommandation unilatérale | AI-H | G3 REQUIRED |
| D06.I08 | INFO | Candidate assumptions | Rend incertitude visible | AI-H | G3 REQUIRED |
| D06.I09 | INFO | Candidate evidence support | Relie options à D04/D05 | CALC | G3 REQUIRED |
| D06.A07 | ANALYSIS | Option comparison | Compare outcomes, audience fit, evidence, differentiation, feasibility, risk | CALC / AI-H | G4 REQUIRED |
| D06.A08 | ANALYSIS | Recommendation | Proposition argumentée, révisable | AI-R | G4 REQUIRED sauf insufficient info |
| D06.D01 | DECISION | Direction selected / revise / deepen / pause / stop | Frontière Idea | HUM decision owner | G4 BLOCKING |
| D06.D02 | DECISION | Accepted strategic assumptions/unknowns | Permet décision avec incertitude contrôlée | HUM | G4 CONDITIONAL |
| D06.V01 | VERIFY | Selected direction is traceable to outcomes + audience + evidence + trade-offs | Decision quality | CALC | G4 |
| D06.V02 | VERIFY | No critical hidden conflict remains | Decision integrity | CALC | G4 |

## Règle d'options
Ne pas forcer trois options artificielles. Une seule direction peut suffire si evidence forte et absence de vrai trade-off ; plusieurs sont requises quand un arbitrage stratégique réel existe.

---

# D07 — Offer, Product/Service Model & Scope — partie IDEA

| ID | Type | Atom | Pourquoi | Acquisition | Gate / règle |
|---|---|---|---|---|---|
| D07.I01 | INFO | Current offer catalog | Base de solution | D04 / RAW / SRC | G1/G2 REQUIRED commercial |
| D07.I02 | INFO | Offer priority | Savoir ce que le projet doit favoriser | HUM / RAW / AI-R | G3 REQUIRED |
| D07.I03 | INFO | Offer to grow | Intention interne | HUM | CONDITIONAL |
| D07.I04 | INFO | Offer to reduce/stop | Évite renforcer une offre non souhaitée | HUM | CONDITIONAL |
| D07.I05 | INFO | Macro solution capabilities | Rend la direction tangible | AI-R | G3 REQUIRED |
| D07.I06 | INFO | Macro scope must-have | Délimite idée retenue | AI-R / HUM | G4 REQUIRED |
| D07.I07 | INFO | Macro scope later | Empêche sur-scope | AI-R / HUM | G4 ENHANCER |
| D07.I08 | INFO | Explicitly not recommended | Trace challenge | AI-R / HUM | G4 ENHANCER |
| D07.I09 | INFO | Critical dependency/vendor | Feasibility | SRC / HUM / expert | CONDITIONAL |
| D07.I10 | INFO | Public pricing/model if structurally relevant | Positionnement/UX | SRC / HUM | CONDITIONAL |
| D07.A01 | ANALYSIS | Offer hierarchy fit | Cohérence avec objectif + audience | AI-H | G3 REQUIRED |
| D07.A02 | ANALYSIS | Scope/value proportionality | Détecte solution disproportionnée | AI-H | G3 REQUIRED |
| D07.A03 | ANALYSIS | Simpler alternative analysis | Challenge fonctions ambitieuses | AI-R | G3 CONDITIONAL |
| D07.D01 | DECISION | Macro offer hierarchy accepted | Source de vérité Project | HUM / accepted recommendation | G4 REQUIRED |
| D07.D02 | DECISION | Macro scope boundary accepted | Empêche Project de repartir de zéro | HUM | G4 REQUIRED |
| D07.V01 | VERIFY | Macro scope supports selected direction and excludes obvious non-goals | Handoff integrity | CALC | G4 |

---

# Gates IDEA — contrat provisoire

## G1 — DISCOVERY_FOUNDATION_SUFFICIENT
Minimum typique :
- Blueprint identifiable ;
- organisation/activité suffisamment comprise ;
- problème ou objectif exploitable ;
- cible suffisamment identifiable, éventuellement hypothèse ;
- existing matière critique connue ;
- aucun conflit majeur rendant la recherche trompeuse.

G1 débloque les travaux de D04/D05 les plus pertinents.

## G2 — EVIDENCE_CONTEXT_SUFFICIENT
Minimum typique :
- facts vs claims vs hypotheses séparés ;
- existing audit pertinent si existant ;
- audience need model suffisant ;
- market/competitive context suffisant OU non-pertinence justifiée ;
- contradictions critiques visibles ;
- freshness/provenance acceptables.

G2 débloque une amélioration/challenge sérieux de l'idée.

## G3 — STRATEGIC_OPTIONS_READY
Minimum typique :
- outcomes explicites ;
- audience primaire exploitable ;
- evidence assez solide ;
- opportunités/challenge produits ;
- direction(s) candidate(s) ;
- trade-offs/risques/assumptions ;
- feasibility probes critiques résolues ou explicites ;
- macro scope cohérent.

## G4 — IDEA_DECISION_READY
Minimum typique :
- vraie Decision Question ;
- option(s) comparables lorsque nécessaire ;
- recommandation argumentée ;
- risques critiques visibles ;
- conflits critiques résolus ;
- unknowns bloquants résolus ou explicitement acceptés ;
- Decision Owner identifié si nécessaire ;
- décision GO/REVISE/DEEPEN/PAUSE/STOP possible.

`GO at G4` crée un snapshot Idea et un `Project Definition Draft`. Il ne signifie jamais `READY_FOR_DEVELOPMENT`.

---

# Questions qui ne doivent PAS être systématiques avant G4

- palette/couleurs ;
- typographies ;
- détail des pages ;
- architecture technique finale ;
- choix de framework ;
- modèle de données final ;
- backlog ;
- responsables de tâches ;
- calendrier d'exécution détaillé ;
- contenu final mot à mot ;
- liste exhaustive de tests ;
- SEO metadata page par page ;
- composants UI détaillés.

Ces sujets peuvent faire l'objet d'un probe s'ils changent la décision, mais appartiennent principalement à PROJECT_DEFINITION.

---

# Red-team minimum avant promotion

Ce registre doit encore être testé sur :
1. artisan local vague ;
2. brief riche + site + analytics ;
3. B2B avec buyer ≠ user ;
4. organisation multi-stakeholders ;
5. aucun concurrent direct ;
6. refonte SEO forte ;
7. idée disproportionnée ;
8. secteur réglementé ;
9. deadline/budget très contraints ;
10. changement de cible après D05 ;
11. Blueprint mismatch ;
12. décision STOP précoce.

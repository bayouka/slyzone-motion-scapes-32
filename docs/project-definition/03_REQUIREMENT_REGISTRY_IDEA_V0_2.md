# 4b4c — IDEA REQUIREMENT ATOM REGISTRY — V0.2

Date : 2026-09-13

Statut : **CANDIDATE CONSOLIDÉ — NON CANONIQUE / À VALIDER AVANT MIGRATION DU MASTER BLUEPRINT**

Supersède comme candidat : `03_REQUIREMENT_REGISTRY_IDEA_V0_1.md`.

Intègre :
- red-team IDEA Registry du 2026-09-13 ;
- coverage audit Matrix V5 → Reference Architecture ;
- invariants d'acquisition/provenance déjà solides de Matrix V5.

Périmètre : D01→D07 jusqu'à `IDEA_DECISION_READY`.

---

# 0. Principes

1. Ce registre est exhaustif en interne, jamais un questionnaire visible.
2. Les Requirements sont relatifs à la Decision Question et aux Gates.
3. `INFO`, `ANALYSIS`, `DECISION`, `SPEC`, `VERIFY` sont distincts.
4. Une hypothèse IA n'est jamais une décision humaine.
5. Une recherche s'arrête lorsque son gain marginal ne peut plus raisonnablement changer la décision.
6. STOP/PAUSE/INSUFFICIENT peuvent devenir décision-ready avant LAUNCH.
7. Un changement d'un input invalide uniquement ses descendants dépendants.
8. Le détail Project (pages, UI finale, architecture technique finale, règles fonctionnelles détaillées) reste hors Idea sauf probe décisionnel.

Acquisition : `MEM → RAW → SRC/AUDIT → WEB/CONN → CALC → AI-H/AI-R → HUM → EXPERT → ACCEPTED_UNKNOWN` selon nature de l'atom.

États décisionnels : `PROPOSED`, `ACCEPTED_CURRENT`, `HUMAN_DECISION`, `SUPERSEDED`, `REVIEW_REQUIRED`.

---

# D01 — Governance, Stakeholders & Decision Context

| ID | Type | Atom | Utilité | Acquisition | Criticité |
|---|---|---|---|---|---|
| D01.I01 | INFO | Decision mode : solo / équipe / client / comité | Choisir gouvernance adaptée | RAW/HUM/signal | G4 CONDITIONAL |
| D01.I02 | INFO | Decision owner | Identifier l'autorité réelle | HUM/SRC | G4 BLOCKING si équipe |
| D01.I03 | INFO | Contributors / reviewers | Séparer contribution et décision | HUM | CONDITIONAL |
| D01.I04 | INFO | Known disagreements | Préserver conflits réels | HUM/collaboration | CONDITIONAL |
| D01.I05 | INFO | Decision date / external deadline | Calibrer profondeur/urgence | HUM/SRC | CONDITIONAL |
| D01.I06 | INFO | Existing approvals / commitments | Identifier contraintes préexistantes | SRC/HUM | CONDITIONAL |
| D01.I07 | INFO | Source authority hierarchy | Arbitrer contradictions sans choix silencieux IA | HUM/rule | REQUIRED si sources conflictuelles |
| D01.I08 | INFO | Decision validation evidence expected | Savoir ce qui prouve qu'une décision est validée | HUM/rule | CONDITIONAL |
| D01.A01 | ANALYSIS | Governance complexity assessment | Activer collaboration seulement si utile | CALC/AI-H | ENHANCER |
| D01.A02 | ANALYSIS | Conflict relevance assessment | Distinguer conflit critique et bruit | CALC/AI-H | REQUIRED si conflit |
| D01.D01 | DECISION | Active decision owner | Source de vérité autorité | HUM | BLOCKING si équipe |
| D01.D02 | DECISION | Decision method | Owner/consensus/majorité/etc. | HUM | CONDITIONAL |
| D01.D03 | DECISION | Accepted source precedence | Empêcher fusion/arbitrage silencieux | HUM/rule | CONDITIONAL |
| D01.D04 | DECISION | Active Decision Question | Définir la décision exacte préparée | HUM/CALC/AI-R | G4 REQUIRED |
| D01.V01 | VERIFY | Decision authority unambiguous | Vérifier owner/method/status | CALC | G4 |
| D01.V02 | VERIFY | Decision Question is explicit and testable | Empêcher readiness abstraite | CALC | G4 |

### Examples Decision Question
- Faut-il poursuivre cette refonte maintenant ?
- Quelle direction sert le mieux l'objectif de prise de rendez-vous ?
- Faut-il simplifier l'idée initiale avant d'en faire un Project ?

---

# D02 — Business Context, Problem & Outcomes

| ID | Type | Atom | Utilité | Acquisition | Criticité |
|---|---|---|---|---|---|
| D02.I01 | INFO | Organisation / porteur | Situer l'Idea | RAW/SRC | G1 REQUIRED |
| D02.I02 | INFO | Secteur / activité | Cadrer research | RAW/SRC/WEB/AI-H | G1 REQUIRED |
| D02.I03 | INFO | Organisation lifecycle | Adapter baseline | RAW/SRC/AI-H | CONDITIONAL |
| D02.I04 | INFO | Trigger / motif | Comprendre origine | RAW/HUM/AI-H | ENHANCER |
| D02.I05 | INFO | Why now | Identifier urgence/opportunité | RAW/HUM | CONDITIONAL |
| D02.I06 | INFO | Declared problem | Préserver perception humaine | RAW/HUM | G1 REQUIRED ou hypothesis |
| D02.I07 | INFO | Declared opportunity | Préserver intention | RAW/HUM | ENHANCER |
| D02.I08 | INFO | Primary business/communication objective | Critère principal de choix | RAW/HUM | G1 REQUIRED |
| D02.I09 | INFO | Secondary objectives | Arbitrages | RAW/HUM/AI-H | G3 CONDITIONAL |
| D02.I10 | INFO | Desired user outcome | Relier business et utilisateur | RAW/HUM/AI-R | G1 REQUIRED |
| D02.I11 | INFO | Primary conversion/action candidate | Rendre outcome opérationnel | CALC/AI-R/HUM | G3 REQUIRED |
| D02.I12 | INFO | Current baseline/KPI | Evidence si décision chiffrée | CONN/SRC | CONDITIONAL |
| D02.I13 | INFO | Success criteria qualitative | Comparer options sans faux KPI | AI-R/HUM | G3 REQUIRED |
| D02.I14 | INFO | Numeric target | Seulement si utile | HUM/CALC | CONDITIONAL |
| D02.I15 | INFO | Budget hard cap | Constraint réelle | HUM | CONDITIONAL |
| D02.I16 | INFO | Hard deadline | Constraint réelle | HUM | CONDITIONAL |
| D02.I17 | INFO | Internal resource constraint | Éliminer options irréalistes | HUM | CONDITIONAL |
| D02.I18 | INFO | Forced platform/vendor/contract | Constraint imposée | HUM/SRC | CONDITIONAL |
| D02.I19 | INFO | Jurisdiction/country signal | Active risque légal/market | RAW/SRC/WEB | CONDITIONAL |
| D02.I20 | INFO | Language requirement signal | Active multi-language context | RAW/SRC/HUM | CONDITIONAL, souvent Project |
| D02.A01 | ANALYSIS | Declared vs observed problem | Séparer cause humaine et audit | AUDIT/AI-H | REQUIRED redesign |
| D02.A02 | ANALYSIS | Root-cause hypotheses | Challenger formulation | AI-H/evidence | ENHANCER |
| D02.A03 | ANALYSIS | Outcome hierarchy | Prioriser objectifs | CALC/AI-H | G3 REQUIRED |
| D02.A04 | ANALYSIS | Constraint impact | Filtrer options | CALC/AI-H | CONDITIONAL |
| D02.A05 | ANALYSIS | Hard vs soft constraint classification | Ne pas figer une préférence comme obligation | CALC/HUM | CONDITIONAL |
| D02.D01 | DECISION | Primary objective accepted | Source de vérité stratégique | HUM/accepted hypothesis | G3 REQUIRED |
| D02.D02 | DECISION | Critical constraints accepted | Cadre les options | HUM | CONDITIONAL |
| D02.V01 | VERIFY | Options can be judged against explicit outcomes | Évite choix par goût | CALC | G3 |

---

# D03 — Users, Audiences, Segments & Jobs

| ID | Type | Atom | Utilité | Acquisition | Criticité |
|---|---|---|---|---|---|
| D03.I01 | INFO | Audience model B2B/B2C/mixte/interne | Structure marché | RAW/SRC/CALC | G1 REQUIRED |
| D03.I02 | INFO | Primary audience | Cible research/solution | RAW/SRC/CONN/AI-H/HUM | G1 REQUIRED, hypothesis allowed |
| D03.I03 | INFO | Secondary audience | Évite sur-design marginal | RAW/SRC/AI-H | CONDITIONAL |
| D03.I04 | INFO | Segment definition | Pertinence benchmark | RAW/CONN/AI-H/HUM | G1/G2 REQUIRED selon cas |
| D03.I05 | INFO | Audience geography | Market/local context | RAW/SRC/WEB | CONDITIONAL |
| D03.I06 | INFO | Buyer / decision-maker | Important B2B | RAW/WEB/AI-H | CONDITIONAL |
| D03.I07 | INFO | User / beneficiary | Sépare achat/usage | RAW/WEB/AI-H | CONDITIONAL |
| D03.I08 | INFO | Influencer / gatekeeper | Cycle d'achat multi-acteurs | RAW/WEB/AI-H | CONDITIONAL |
| D03.I09 | INFO | Primary job/need | Base valeur | RAW/WEB/AI-H | G2 REQUIRED |
| D03.I10 | INFO | Desired benefit | Base promesse | RAW/WEB/AI-H | G2 REQUIRED |
| D03.I11 | INFO | Selection criteria | Comprendre arbitrage cible | WEB/SRC/AI-H | G2 CONDITIONAL |
| D03.I12 | INFO | Objections / fears | Proof/conversion | WEB/SRC/AI-H | ENHANCER |
| D03.I13 | INFO | Trust requirements | High-trust contexts | WEB/SRC/AI-H | CONDITIONAL |
| D03.I14 | INFO | Knowledge/maturity | Ajuster message | WEB/AI-H | ENHANCER |
| D03.I15 | INFO | Usage context | Mobile/urgence/comparaison/etc. | WEB/SRC/AI-H | CONDITIONAL |
| D03.I16 | INFO | Discovery/acquisition channels | Relie audience au parcours | CONN/SRC/WEB/AI-H | ENHANCER |
| D03.I17 | INFO | Real behavior evidence | Réduit spéculation | CONN/SRC | CONDITIONAL |
| D03.A01 | ANALYSIS | Segment priority | Déterminer primaire | CALC/AI-H | REQUIRED si segments multiples |
| D03.A02 | ANALYSIS | Need evidence synthesis | Séparer evidence/hypothèse | AI-H | G2 REQUIRED |
| D03.A03 | ANALYSIS | Objection/trust model | Prépare stratégie | AI-H | ENHANCER |
| D03.D01 | DECISION | Primary audience accepted | Source active | HUM/accepted hypothesis | G3 REQUIRED |
| D03.D02 | DECISION | Segment priority | Arbitrage interne | HUM | CONDITIONAL |
| D03.V01 | VERIFY | D05 can target market without guessing core audience | Gate research | CALC | G1/G2 |

### Change impact
Changement cible/segment/zone peut rendre `STALE` : D05 sélection/recherche, D06 options/positionnement, D07 scope macro et plus tard D08-D11/D15.

---

# D04 — Existing State, Assets & Evidence

| ID | Type | Atom | Utilité | Acquisition | Criticité |
|---|---|---|---|---|---|
| D04.I01 | INFO | Creation vs redesign | Active existing/migration | RAW/SRC/AI-H | G1 REQUIRED |
| D04.I02 | INFO | Existing site/product URL | Source redesign | RAW/SRC | REQUIRED si existant |
| D04.I03 | INFO | Existing sitemap/pages/routes | Baseline | AUDIT/SRC | CONDITIONAL |
| D04.I04 | INFO | Existing offer/catalog | Réalité commerciale | SRC/RAW | REQUIRED commercial |
| D04.I05 | INFO | Offer current validity | Évite stale offer | SRC/HUM | REQUIRED si ambigu |
| D04.I06 | INFO | Existing content inventory | Reuse/gaps | AUDIT/SRC | CONDITIONAL |
| D04.I07 | INFO | Existing CTA/forms | Baseline conversion | AUDIT | ENHANCER |
| D04.I08 | INFO | Existing analytics | Behavior evidence | CONN/SRC | CONDITIONAL |
| D04.I09 | INFO | Search Console / SEO data | Acquisition evidence | CONN/SRC | CONDITIONAL |
| D04.I10 | INFO | Critical URLs/rankings | Migration risk | CONN/AUDIT | CONDITIONAL |
| D04.I11 | INFO | Brand identity/guidelines | Constraint potentielle | SRC/HUM | CONDITIONAL |
| D04.I12 | INFO | Asset inventory | Projection/reuse | SRC | ENHANCER |
| D04.I13 | INFO | Proof assets | Réassurance | SRC | ENHANCER |
| D04.I14 | INFO | Existing must-keep | Constraint humaine | HUM/RAW | CONDITIONAL |
| D04.I15 | INFO | Existing must-remove | Intention | HUM/AI-R | CONDITIONAL |
| D04.I16 | INFO | Current platform constraints | Probe faisabilité | AUDIT/SRC | CONDITIONAL |
| D04.I17 | INFO | Known regulatory/legal constraints | Risk signal | SRC/HUM | CONDITIONAL |
| D04.A01 | ANALYSIS | Existing strengths | Conserver valeur | AUDIT/AI-H | ENHANCER |
| D04.A02 | ANALYSIS | Existing weaknesses/frictions | Corriger causes observables | AUDIT/AI-H | REQUIRED redesign |
| D04.A03 | ANALYSIS | Evidence quality/freshness | Fiabilité | CALC/AI-H | G2 REQUIRED |
| D04.A04 | ANALYSIS | Migration risk probe | Évite GO aveugle | AUDIT/AI-H | CONDITIONAL |
| D04.A05 | ANALYSIS | Source conflict grouping | Préserve contradictions | CALC/AI-H | REQUIRED si conflit |
| D04.D01 | DECISION | Existing constraints accepted | Current truth | HUM si ambigu | CONDITIONAL |
| D04.V01 | VERIFY | Observations linked to sources/provenance | Integrity | CALC | G2 |

---

# D05 — Market, Competition, Alternatives & References

| ID | Type | Atom | Utilité | Acquisition | Criticité |
|---|---|---|---|---|---|
| D05.I01 | INFO | Market/category definition | Pertinence benchmark | D02+D03+D04/CALC | G2 REQUIRED |
| D05.I02 | INFO | Geographic scope | Pertinence acteurs | D03/WEB | CONDITIONAL |
| D05.I03 | INFO | Direct competitors | Même audience/offre | WEB/RAW | CONDITIONAL→REQUIRED si stratégie dépend du marché |
| D05.I04 | INFO | Indirect alternatives | Substitution | WEB/AI-H | CONDITIONAL |
| D05.I05 | INFO | Non-consumption/DIY alternative | Concurrence comportementale | WEB/AI-H | ENHANCER |
| D05.I06 | INFO | Reference exemplars | Excellence hors concurrence | WEB/RAW | ENHANCER |
| D05.I07 | INFO | Competitor target/positioning | Différenciation | WEB/AUDIT/AI-H | REQUIRED si D05 actif |
| D05.I08 | INFO | Offers/pricing visible | Compare offre | WEB | ENHANCER |
| D05.I09 | INFO | Messages/value propositions | Détecte banalité | WEB/AUDIT | ENHANCER |
| D05.I10 | INFO | CTA/conversion patterns | Learn patterns | AUDIT | ENHANCER |
| D05.I11 | INFO | Proof/trust patterns | Learn reassurance | AUDIT | ENHANCER |
| D05.I12 | INFO | Content/SEO patterns | Discoverability insight | WEB/AUDIT | CONDITIONAL |
| D05.I13 | INFO | Capabilities/features | Comprendre standard sans mimétisme | AUDIT | ENHANCER |
| D05.I14 | INFO | Market trends | Seulement si décisionnel | WEB | CONDITIONAL |
| D05.A01 | ANALYSIS | Competitor selection relevance | Qualité du sample | CALC/AI-H | G2 REQUIRED |
| D05.A02 | ANALYSIS | Pattern synthesis | Standard vs distinctif | AI-H | G2/G3 REQUIRED |
| D05.A03 | ANALYSIS | Transferable strengths | Ce qui peut être repris | AI-R | ENHANCER |
| D05.A04 | ANALYSIS | Weakness/friction synthesis | Ce qu'il faut éviter | AI-H | ENHANCER |
| D05.A05 | ANALYSIS | Gap/opportunity hypotheses | Nouvelles directions | AI-H | G3 REQUIRED si evidence disponible |
| D05.A06 | ANALYSIS | Differentiation whitespace | Positionnement | AI-H | ENHANCER |
| D05.A07 | ANALYSIS | Research sufficiency / stopping rule | Évite recherche infinie | CALC/AI-H | G2 REQUIRED |
| D05.A08 | ANALYSIS | Research invalidation check | Détecte changement cible/zone/offre | CALC | REQUIRED après changement amont |
| D05.V01 | VERIFY | Strategic market claims sourced or explicit hypotheses | Integrity | CALC | G2/G3 |

### Requirement conceptuel
`MARKET_CONTEXT_SUFFICIENT_FOR_STRATEGY` peut être satisfait par concurrence, alternatives, evidence interne solide ou NOT_RELEVANT justifié. Il n'impose pas une liste décorative de concurrents.

---

# D06 — Opportunity, Strategy, Value Proposition & Positioning

| ID | Type | Atom | Utilité | Acquisition | Criticité |
|---|---|---|---|---|---|
| D06.A01 | ANALYSIS | Opportunity synthesis | Evidence→leviers | AI-H/CALC | G3 REQUIRED |
| D06.A02 | ANALYSIS | Original idea challenge | Ne pas mettre en forme trop tôt | AI-H/evidence | G3 REQUIRED |
| D06.A03 | ANALYSIS | Simplification opportunities | Chercher meilleur ratio valeur/complexité | AI-R | REQUIRED si complexe |
| D06.A04 | ANALYSIS | Risky assumptions | Identifier hypothèses renversantes | AI-H | G3 REQUIRED |
| D06.A05 | ANALYSIS | Strategic constraints synthesis | Filtre options | CALC | G3 REQUIRED |
| D06.A06 | ANALYSIS | Feasibility probes required | Tester inconnues critiques | AI-H/EXPERT/tool | CONDITIONAL |
| D06.A07 | ANALYSIS | Critical regulatory risk probe | Éviter direction manifestement incompatible | WEB/EXPERT/AI-H | CONDITIONAL secteur réglementé |
| D06.I01 | INFO | Candidate direction A | Option | AI-R | G3 REQUIRED |
| D06.I02 | INFO | Candidate direction B | Alternative si vrai trade-off | AI-R | CONDITIONAL |
| D06.I03 | INFO | Candidate direction C | Seulement si utile | AI-R | ENHANCER |
| D06.I04 | INFO | Positioning candidate(s) | Place sur marché | AI-R | G3 REQUIRED |
| D06.I05 | INFO | Message hierarchy candidate | Rend stratégie tangible | AI-R | ENHANCER |
| D06.I06 | INFO | Macro conversion strategy | Relie valeur/action | AI-R | G3 REQUIRED |
| D06.I07 | INFO | Candidate risks/trade-offs | Décision honnête | AI-H | G3 REQUIRED |
| D06.I08 | INFO | Candidate assumptions | Incertitude visible | AI-H | G3 REQUIRED |
| D06.I09 | INFO | Candidate evidence support | Traçabilité | CALC | G3 REQUIRED |
| D06.A08 | ANALYSIS | Option comparison | Outcome/audience/evidence/diff/feasibility/risk | CALC/AI-H | G4 REQUIRED si plusieurs options |
| D06.A09 | ANALYSIS | Recommendation | Argumentée et révisable | AI-R | G4 REQUIRED sauf insuffisance |
| D06.D01 | DECISION | Direction decision | GO/REVISE/DEEPEN/PAUSE/STOP/INSUFFICIENT | HUM owner | G4 BLOCKING |
| D06.D02 | DECISION | Accepted strategic unknowns | Décider avec incertitude maîtrisée | HUM | CONDITIONAL |
| D06.V01 | VERIFY | Selected direction traceable to outcomes+audience+evidence+trade-offs | Decision quality | CALC | G4 |
| D06.V02 | VERIFY | No hidden critical conflict | Integrity | CALC | G4 |

### Early decision path
Si evidence suffisante supporte STOP/PAUSE/INSUFFICIENT, G4 peut devenir READY sans forcer plusieurs directions, un benchmark exhaustif ou un macro scope de lancement.

---

# D07 — Offer, Product/Service Model & Macro Scope

| ID | Type | Atom | Utilité | Acquisition | Criticité |
|---|---|---|---|---|---|
| D07.I01 | INFO | Current offer catalog | Baseline | D04/RAW/SRC | REQUIRED commercial |
| D07.I02 | INFO | Offer priority | Ce que le projet doit favoriser | HUM/RAW/AI-R | G3 REQUIRED |
| D07.I03 | INFO | Offer to grow | Intention interne | HUM | CONDITIONAL |
| D07.I04 | INFO | Offer to reduce/stop | Évite renforcer mauvaise offre | HUM | CONDITIONAL |
| D07.I05 | INFO | Macro solution capabilities | Rend direction tangible | AI-R | G3 REQUIRED |
| D07.I06 | INFO | Macro must-have scope | Limite direction | AI-R/HUM | G4 REQUIRED launch path |
| D07.I07 | INFO | Macro later scope | Empêche sur-scope | AI-R/HUM | ENHANCER |
| D07.I08 | INFO | Not recommended now | Trace challenge | AI-R/HUM | ENHANCER |
| D07.I09 | INFO | Critical dependency/vendor | Feasibility | SRC/HUM/EXPERT | CONDITIONAL |
| D07.I10 | INFO | Pricing/model signal | Positionnement si structurant | SRC/HUM | CONDITIONAL |
| D07.A01 | ANALYSIS | Offer hierarchy fit | Objective/audience fit | AI-H | G3 REQUIRED |
| D07.A02 | ANALYSIS | Scope/value proportionality | Évite solution disproportionnée | AI-H | G3 REQUIRED |
| D07.A03 | ANALYSIS | Simpler alternative | Challenge | AI-R | CONDITIONAL |
| D07.D01 | DECISION | Macro offer hierarchy accepted | Project baseline | HUM/accepted recommendation | G4 REQUIRED launch path |
| D07.D02 | DECISION | Macro scope boundary accepted | Empêche Project de repartir de zéro | HUM | G4 REQUIRED launch path |
| D07.D03 | DECISION | Macro non-goals accepted | Préserve ce qui est volontairement exclu | HUM/accepted recommendation | G4 REQUIRED launch path |
| D07.V01 | VERIFY | Scope supports direction and explicit non-goals | Handoff | CALC | G4 |

---

# Conflict Group — objet transverse Idea

Quand deux sources significatives se contredisent :
- conserver les deux observations ;
- créer un `CONFLICT_GROUP` ;
- relier affected atoms/outputs ;
- rechercher freshness/authority/evidence ;
- n'interroger l'humain que si le conflit reste matériel ;
- ne jamais fusionner silencieusement.

---

# Gates consolidées

## G1 — DISCOVERY_FOUNDATION_SUFFICIENT
- Blueprint fit connu ;
- activité/contexte exploitable ;
- problème/objective exploitable ;
- audience exploitable ;
- existing matière critique connue ;
- Decision Question provisoire possible ;
- pas de conflit caché rendant la Discovery trompeuse.

## G2 — EVIDENCE_CONTEXT_SUFFICIENT
- facts/claims/hypotheses séparés ;
- audience/need evidence suffisante ;
- existing audit pertinent ;
- `MARKET_CONTEXT_SUFFICIENT_FOR_STRATEGY` satisfait ou non pertinent justifié ;
- research sufficiency atteinte ;
- source conflicts critiques traités ;
- provenance/freshness suffisantes.

## G3 — STRATEGIC_OPTIONS_READY
Launch/revise path :
- outcomes explicites ;
- audience primaire exploitable ;
- evidence suffisante ;
- challenge/opportunities produits ;
- direction(s) candidate(s) ;
- trade-offs/risques/assumptions ;
- critical probes résolus ;
- macro scope proportionné.

STOP/PAUSE path : seulement ce qui est nécessaire pour justifier honnêtement la décision.

## G4 — IDEA_DECISION_READY
- Decision Question explicite ;
- owner/authority correct si nécessaire ;
- evidence suffisante pour cette Decision Question ;
- recommandation ou insuffisance explicite ;
- risques/conflicts critiques visibles ;
- unknowns bloquants résolus ou acceptés ;
- décision possible : GO / REVISE / DEEPEN / PAUSE / STOP / INSUFFICIENT.

`GO` crée un snapshot Idea + `Project Definition Draft`.

---

# Change Intelligence minimale

- cible/segment/zone change → D05 + descendants potentiellement STALE ;
- objectif change → D06/D07 + descendants ;
- offre prioritaire change → D05/D06/D07 ;
- nouvelle contrainte hard → options/scope/probes ;
- source existante mise à jour → seulement analyses qui la consomment ;
- Decision Owner change → validations, pas automatiquement evidence ;
- changement Blueprint → `BLUEPRINT_MISMATCH` et remapping contrôlé.

Aucun changement local ne doit relancer tout le dossier par défaut.

---

# Frontière IDEA → PROJECT

Le snapshot GO doit contenir au minimum pour un launch path :
- Decision Question ;
- Problem & Outcome Frame ;
- Audience/Need Model ;
- Evidence Pack pertinent ;
- Market Context suffisant ;
- direction choisie ;
- proposition de valeur/positionnement candidat ;
- macro offer/scope ;
- non-goals ;
- contraintes critiques ;
- assumptions/risks/accepted unknowns ;
- provenance ;
- Decision Record.

Il ne doit pas prétendre contenir : detailed sitemap, final copy, final design system, full technical architecture, complete test suite ou delivery backlog.

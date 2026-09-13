# 4b4c — PREFIGURATION / DECISION DETAILED CATALOG — V0.1

Date : 2026-09-13

Statut : **WORKING CANDIDATE — NON CANONIQUE**

Périmètre : Z4, Z4b, Z5 — rendre l’Idea tangible, éventuellement la tester, puis préparer et exécuter la décision.

---

# P0 — Prefiguration Budget

## P0.1 — Decision-usefulness test

**Questions internes**
- quel artifact réduira réellement une incertitude ?
- quelle question de décision doit-il éclairer ?
- quelle fidelity minimale suffit ?
- peut-on éviter un artifact coûteux sans perdre de valeur décisionnelle ?

**Résolution** : R3/R5.

**Règle** : tout artifact non relié à une Decision Question est `NOT_NEEDED_FOR_DECISION`.

## P0.2 — Fidelity parity

**Questions internes**
- plusieurs directions sont-elles comparées ?
- ont-elles une fidelity comparable ?
- une maquette plus belle biaise-t-elle artificiellement le choix ?

**Résolution** : R3/R5.

---

# D08 PREVIEW — Concept Journey

## P.D08.1 — Entry-to-outcome path

**Questions internes**
- d’où arrive l’utilisateur ?
- que doit-il comprendre d’abord ?
- quelle preuve doit précéder l’engagement ?
- quelle action principale ?
- fallback utile ?
- existe-t-il un handoff offline ?

**Résolution** : R5 à partir de D03/D06/D07/D05.

**Humain** : seulement si processus interne caché/inconnu.

**Sortie** : Concept Journey `FOR_DECISION`.

## P.D08.2 — Journey risk probe

**Questions internes**
- étape nouvelle ou inhabituelle ?
- friction critique ?
- besoin de test utilisateur ?

**Résolution** : R4/R5 ; peut activer Z4b.

---

# D09 PREVIEW — Concept Sitemap / Screen Model

## P.D09.1 — Market structure synthesis

**Questions internes**
- quelles pages/surfaces sont standards de catégorie ?
- lesquelles sont réellement utiles vs habitudes ?
- quelles pages supportent preuve, offre, conversion, SEO ?

**Résolution** : R2/R3/R5.

## P.D09.2 — Project-specific concept map

**Questions internes**
- quelles surfaces servent outcomes + target + offer + journey ?
- quelles relations/navigation macro ?
- quelle profondeur minimale ?
- quelles surfaces peuvent être fusionnées/supprimées ?

**Résolution** : R5.

**Humain** : `OPTIONAL_CORRECTION`.

**Lock** : peut atteindre `LOCKED_FOR_DECISION`, jamais `FROZEN_FOR_BUILD`.

---

# D10 PREVIEW — Message / Content Concept

## P.D10.1 — Message hierarchy

**Questions internes**
- promesse principale ?
- bénéfices majeurs ?
- preuves ?
- objections ?
- CTA wording intent ?
- claims factuels à sourcer ?

**Résolution** : R5 ; R1 pour facts.

**Humain** : seulement pour factual claim non sourçable ou promesse que l’organisation doit assumer.

## P.D10.2 — Representative content blocks

**Questions internes**
- quels blocs rendent la direction compréhensible ?
- hero, offre, preuve, FAQ, CTA, cas ?
- faut-il montrer un exemple complet ou seulement structure/message ?

**Résolution** : R5.

---

# D11 PREVIEW — Discoverability / SEO Concept

## P.D11.1 — Search opportunity probe

**Questions internes**
- SEO est-il réellement structurant ?
- grandes intentions de recherche ?
- local/national ?
- architecture probable ?
- migration risk ?

**Résolution** : R1/R2/R4/R5.

**Règle** : aucune recherche SEO exhaustive si cela ne change pas la décision.

---

# D12 PREVIEW — Concept Capabilities

## P.D12.1 — Capability candidates

**Questions internes**
- quelles capacités servent directement outcomes/journey ?
- que font les concurrents ?
- quelles capacités créent une vraie valeur ?
- lesquelles sont disproportionnées ?

**Résolution** : R5.

## P.D12.2 — Value/complexity classification

Classer : `CORE_CONCEPT / OPTIONAL_VALUE / LATER / NOT_RECOMMENDED`.

**Humain** : choix seulement si trade-off business réel.

---

# D13 PREVIEW — Data / CMS / Role signal

## P.D13.1 — Structural data need

**Questions internes**
- contenu répétable justifiant CMS ?
- données persistantes ?
- rôles utilisateurs ?
- contenu administrable ?
- données sensibles ?

**Résolution** : R3/R4/R5.

**Sortie** : seulement un signal de complexité/architecture, pas modèle de données final.

---

# D14 PREVIEW — Integration signal

## P.D14.1 — Critical external dependency

**Questions internes**
- réservation, CRM, paiement, maps, newsletter, auth, email, API ?
- dépendance indispensable au concept ?
- vendor imposé ?
- risque disponibilité/coût/permissions ?

**Résolution** : R1/R4/R5 ; R9 si critique/réglementé.

**Unlocks** : feasibility envelope.

---

# D15 PREVIEW — Visual Intent / Concept Mockups

## P.D15.1 — Brand constraints

**Questions internes**
- identité existante obligatoire ?
- logo/charte à conserver ?
- anti-références ?
- contraintes institutionnelles ?

**Résolution** : R1 ; R6 si intention interne.

## P.D15.2 — Visual territory exploration

**Questions internes**
- quels 2–3 territoires traduisent stratégie/target ?
- niveau d’audace ? tonalité ? densité ?
- typo/palette/image/motion candidates ?
- quelles différences sont réellement stratégiques ?

**Résolution** : R5.

**Humain** : R7 `EXPLICIT_CHOICE` si préférence nécessaire.

## P.D15.3 — High-fidelity concept selection

**Questions internes**
- quelles surfaces sont nécessaires pour décider ?
- desktop + mobile ?
- home/hero + preuve + offre + page stratégique ?
- prototype cliquable utile ?

**Résolution** : R5.

**Safeguards** : label `CONCEPT / NOT FINAL SPEC`, sources/assumptions visibles, pas de design fixation.

---

# D16 PREVIEW — Feasibility Envelope

## P.D16.1 — Feasibility questions

**Questions internes**
- capabilities critiques faisables ?
- stack imposée compatible ?
- CMS/data/auth nécessaires ?
- dépendances externes risquées ?
- complexité macro ?
- coût/délai plausible ?

**Résolution** : R4/R5 ; R9 si expertise nécessaire.

**Sortie** : `FEASIBILITY_ENVELOPE`, jamais architecture finale.

---

# D17 PREVIEW — Security / Privacy / Regulatory Red Flags

## P.D17.1 — Early risk classification

**Questions internes**
- données personnelles/sensibles ?
- secteur réglementé ?
- claims sensibles ?
- consent/tracking ?
- auth/permissions ?

**Résolution** : R1/R4 ; R9 si conséquence élevée.

**Règle** : seulement ce qui peut invalider/changer le concept avant décision.

---

# D18 PREVIEW — Accessibility / Performance Constraints

## P.D18.1 — Concept-shaping NFR

**Questions internes**
- accessibilité impose-t-elle une contrainte majeure ?
- performance critique à cause de vidéo/3D/assets ?
- mobile/local/connexion faible ?
- browser/device particulier ?

**Résolution** : R3/R4/R5.

---

# D19 PREVIEW — Success Model

## P.D19.1 — Outcome-to-measurement chain

**Questions internes**
- quel comportement indique que l’idée fonctionne ?
- conversion candidate ?
- quel indicateur est observé vs seulement souhaité ?
- faut-il instrumentation particulière ?

**Résolution** : R3/R5.

**Sortie** : success model conceptuel, pas tracking plan final.

---

# D21 — Business Case / Economics / Forecasts

## D21.1 — Decision usefulness

**Questions internes**
- la décision exige-t-elle un business case ?
- sans chiffres, la décision reste-t-elle raisonnable ?
- quels chiffres sont réellement capables de changer le choix ?

**Résolution** : R3/R5.

## D21.2 — Baseline economics

**Questions internes**
- trafic/leads/ventes actuels ?
- valeur moyenne d’un lead/vente/rendez-vous ?
- coût actuel du problème ?
- coûts de maintenance/process ?

**Résolution** : R1/R3 ; R6 pour données privées non connectées.

## D21.3 — Cost/timeline envelope

**Questions internes**
- scope conceptuel ?
- dépendances critiques ?
- niveau de complexité ?
- ressources disponibles ?
- range plausible de coût/délai ?

**Résolution** : R4/R5, toujours avec hypothèses/ranges.

## D21.4 — Scenario model

**Questions internes**
- downside/base/upside ?
- variables sensibles ?
- quels inputs dominent la conclusion ?
- break-even/ROI pertinent ?

**Résolution** : R3.

**Règle** : si inputs insuffisants → `INSUFFICIENT_INPUTS_FOR_ROI`.

## D21.5 — Market sizing

**Questions internes**
- réellement utile à la décision ?
- données crédibles disponibles ?
- TAM/SAM/SOM ou local market estimate apporte-t-il quelque chose ?

**Résolution** : R1/R3/R4.

**Règle** : pas de market sizing décoratif.

---

# Z4b — Concept Validation

## CV.1 — Validation need

**Triggers** : nouveau segment, proposition de valeur incertaine, interaction inhabituelle, décision coûteuse/irréversible, contradiction stakeholders/evidence, compréhension risquée.

**Questions internes**
- quelle hypothèse user est la plus risquée ?
- quelle méthode minimale peut la tester ?
- quel signal compterait comme evidence ?

**Résolution** : R3/R5.

## CV.2 — Validation method

Possibilités : test compréhension, interview, concept comparison, prototype task test, message test, smoke/landing test.

**Règle** : persona/simulation IA = préparation, jamais evidence utilisateur.

## CV.3 — Validation outcome

**Questions internes**
- supporte/rejette/nuance l’hypothèse ?
- quel artifact devient stale ?
- faut-il corriger target/message/journey/concept ?

**Résolution** : R3/R4.

---

# D22 — Decision Package / Presentation / Review / Approval

## D22.1 — Decision package mode

**Questions internes**
- solo, équipe, comité/investissement ?
- qui est audience ?
- décision exacte attendue ?
- temps de présentation ?
- objections probables ?

**Résolution** : R1/R3/R6.

**Modes** : SOLO_DECISION_BRIEF / TEAM_DECISION_PACKAGE / COMMITTEE_INVESTMENT_PACKAGE.

## D22.2 — Executive memo

**Questions internes**
- décision demandée visible en première page ?
- problème/outcomes/audience/evidence/options/reco/risks assez synthétiques ?
- lisible sans réunion ?

**Résolution** : R5.

## D22.3 — Decision deck

**Questions internes**
- quelle narration sert le décideur ?
- quelles slides sont nécessaires ?
- quelles preuves/chiffres doivent être visibles ?
- quels détails vont en appendix ?
- mockups correctement étiquetés ?

**Résolution** : R5.

**Formats** : PPTX editable + PDF fallback ; notes si utile.

## D22.4 — Deck freshness / traceability

**Questions internes**
- le deck référence-t-il le bon Decision Snapshot ?
- des artifacts ont-ils changé depuis export ?
- quels chiffres/sources sont stale ?
- quelles slides doivent être régénérées ?

**Résolution** : R3.

## D22.5 — Review capture

**Questions internes**
- chaque retour : correction, idée, changement, risque, préférence, question, décision ?
- materiality cosmetic/local/substantive/critical ?
- quelles dépendances impactées ?
- qui a autorité pour trancher ?

**Résolution** : R3/R4 ; R8 pour arbitrage.

## D22.6 — Approval resolution

**Outcomes** : APPROVE_TO_PROJECT / APPROVE_WITH_CONDITIONS / REVISE / DEEPEN_RESEARCH / PAUSE / STOP / INSUFFICIENT_INFORMATION.

**Questions internes**
- toutes conditions structurantes sont-elles résolues ou explicitement acceptables ?
- le change set de review a-t-il été appliqué ?
- quels artifacts sont promoted/direct/deepen/rework/reject ?

**Résolution** : R3 + R8 `FORMAL_APPROVAL`.

**Output** : Approved Idea Snapshot + Decision Record.

---

# Human questions — Z4/Z5

À ce stade, l’utilisateur ne devrait généralement intervenir que pour :

- choisir/corriger un territoire visuel ;
- arbitrer une vraie préférence de concept ;
- fournir une donnée privée nécessaire au business case ;
- participer à un test utilisateur réel si applicable ;
- trancher un feedback conflictuel si owner ;
- approuver/reviser/pause/stop ;
- accepter explicitement une condition ou un risque.

La génération de journey, sitemap, features, messages, benchmark, maquettes, feasibility envelope, projections à partir d’inputs suffisants reste principalement un travail 2b2c.

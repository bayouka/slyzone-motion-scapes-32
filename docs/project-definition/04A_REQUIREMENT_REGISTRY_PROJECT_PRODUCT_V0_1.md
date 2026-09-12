# 4b4c — PROJECT DEFINITION REQUIREMENT REGISTRY — PRODUCT / EXPERIENCE — V0.1

Date : 2026-09-13

Statut : **WORKING CANDIDATE — NON CANONIQUE / À RED-TEAMER**

Périmètre : D08→D15, après GO Idea et avant Build Ready.

Objectif : transformer la direction stratégique retenue en définition produit/web explicite sans déléguer au développeur des choix structurants de scope, parcours, architecture de l'information, contenu, fonctionnalités ou design.

---

# D08 — User Journeys, Conversion & Service Flow

| ID | Type | Atom | Utilité | Acquisition/production | Criticité |
|---|---|---|---|---|---|
| D08.I01 | INFO | Entry points principaux | Comprendre où commence le parcours | D03/D04/D11/AI-H | REQUIRED |
| D08.I02 | INFO | Primary user goal per journey | Ancrer le parcours | D03/D07 | REQUIRED |
| D08.I03 | INFO | Primary conversion event | Définir succès du parcours | D02/D07 | REQUIRED |
| D08.I04 | INFO | Secondary conversion/fallback | Prévoir alternatives utiles | AI-R/HUM | CONDITIONAL |
| D08.I05 | INFO | Trust/proof moments | Placer rassurance au bon moment | D03/D04/AI-R | REQUIRED high-trust, sinon ENHANCER |
| D08.I06 | INFO | Objections per journey | Éviter parcours naïf | D03 | CONDITIONAL |
| D08.I07 | INFO | Context constraints | Mobile/urgence/local/multi-device | D03 | CONDITIONAL |
| D08.I08 | INFO | Offline/service handoff | Relier interface au vrai service | HUM/SRC/AI-H | CONDITIONAL |
| D08.A01 | ANALYSIS | Primary journey map | Décrire progression utile | AI-R/UX | REQUIRED |
| D08.A02 | ANALYSIS | Journey friction analysis | Détecter étapes inutiles | AI-H/UX | REQUIRED |
| D08.A03 | ANALYSIS | Proof/objection coverage | Vérifier rassurance avant engagement | CALC/AI-H | CONDITIONAL |
| D08.S01 | SPEC | Primary journey specification | Source de vérité UX macro | UX/AI-R | G5 REQUIRED |
| D08.S02 | SPEC | Secondary/fallback journeys | Cas non principal | UX/AI-R | CONDITIONAL |
| D08.S03 | SPEC | Conversion behavior/fallback | Que se passe-t-il si l'action principale échoue | UX/PM | REQUIRED si conversion critique |
| D08.V01 | VERIFY | Every primary journey has start→goal→conversion/fallback | Testable completeness | CALC/QA | G5 |

---

# D09 — Information Architecture, Navigation & Page/Screen Model

| ID | Type | Atom | Utilité | Acquisition/production | Criticité |
|---|---|---|---|---|---|
| D09.I01 | INFO | Required information tasks | Ce que l'utilisateur doit trouver/comprendre | D08/D10 | REQUIRED |
| D09.I02 | INFO | Content/entity taxonomy need | Organiser information répétée | D10/D13 | CONDITIONAL |
| D09.A01 | ANALYSIS | Sitemap/screen-map candidates | Explorer structure | IA/AI-R | REQUIRED |
| D09.A02 | ANALYSIS | Navigation depth/friction | Éviter profondeur inutile | IA/UX | REQUIRED |
| D09.D01 | DECISION | Accepted sitemap/screen model | Fige structure active | HUM owner/PM | G5 REQUIRED |
| D09.S01 | SPEC | Route/page/screen manifest | Liste canonique des surfaces | IA/PM | REQUIRED |
| D09.S02 | SPEC | Page/screen role | Pourquoi elle existe | IA/PM | REQUIRED chaque surface stratégique |
| D09.S03 | SPEC | Target audience per surface | Évite page générique | D03/IA | REQUIRED stratégique |
| D09.S04 | SPEC | Primary CTA/action per surface | Cohérence conversion | D08 | REQUIRED stratégique |
| D09.S05 | SPEC | Navigation placement | Header/footer/contextual/hidden | IA | REQUIRED |
| D09.S06 | SPEC | Internal linking relationships | Cohérence parcours/SEO | IA/D11 | REQUIRED web |
| D09.S07 | SPEC | Index/noindex intent | Évite indexation accidentelle | D11 | CONDITIONAL web |
| D09.S08 | SPEC | Route/path intent | Prépare tech/SEO | IA/D11 | REQUIRED web |
| D09.S09 | SPEC | 404/not-found behavior | Fallback navigation | IA/UX | REQUIRED web public |
| D09.V01 | VERIFY | No orphan strategic surface | Complétude navigation | CALC/QA | G5 |
| D09.V02 | VERIFY | Every surface has explicit role and next action | Évite pages “par habitude” | CALC | G5 |

---

# D10 — Content, Proof, Media & Content Operations

| ID | Type | Atom | Utilité | Acquisition/production | Criticité |
|---|---|---|---|---|---|
| D10.I01 | INFO | Existing reusable content | Réemploi | D04/SRC | CONDITIONAL |
| D10.I02 | INFO | Existing proof inventory | Réassurance | D04/SRC | REQUIRED si preuve structurante |
| D10.I03 | INFO | Media inventory | Planifier assets | SRC | ENHANCER→REQUIRED selon design |
| D10.I04 | INFO | Media rights/provenance | Éviter contenu non exploitable | SRC/HUM | REQUIRED publication |
| D10.A01 | ANALYSIS | Content gap analysis | Identifier ce qui manque | CALC/AI-H | REQUIRED |
| D10.A02 | ANALYSIS | Proof gap analysis | Identifier réassurance insuffisante | CALC/AI-H | CONDITIONAL |
| D10.D01 | DECISION | Content strategy accepted | Source de vérité contenu | PM/content owner | G5 REQUIRED |
| D10.S01 | SPEC | Main message per strategic surface | Alignement valeur | Content/PM | REQUIRED |
| D10.S02 | SPEC | Content requirement per section | Définir purpose/type, pas forcément texte final | Content/UX | REQUIRED |
| D10.S03 | SPEC | Proof requirement and placement | Où et pourquoi prouver | Content/UX | CONDITIONAL |
| D10.S04 | SPEC | CTA/microcopy intent | Comportement attendu | Content/UX | REQUIRED conversion |
| D10.S05 | SPEC | FAQ/objection content requirements | Répondre aux freins | Content | CONDITIONAL |
| D10.S06 | SPEC | Media requirements | Type/ratio/usage/alt intent | Design/content | CONDITIONAL |
| D10.S07 | SPEC | Content owner | Qui fournit/maintient | HUM/PM | REQUIRED si contenu différé |
| D10.S08 | SPEC | Content status | final/provisional/missing/not-needed | CALC/owner | REQUIRED |
| D10.S09 | SPEC | Content update cadence | Maintenance | owner/PM | CONDITIONAL |
| D10.S10 | SPEC | Provisional-content policy | Interdit placeholders publiables | PM | REQUIRED si contenu manquant |
| D10.V01 | VERIFY | Missing final content cannot be mistaken for publishable content | Qualité | QA | G8 |
| D10.V02 | VERIFY | Every critical content requirement has owner/status | Build readiness | CALC | G5/G8 |

---

# D11 — SEO, Discoverability & Migration

| ID | Type | Atom | Utilité | Acquisition/production | Criticité |
|---|---|---|---|---|---|
| D11.I01 | INFO | SEO role in acquisition | Détermine profondeur | D02/D03/D04 | REQUIRED décision de pertinence |
| D11.I02 | INFO | Search intents/topics | Aligne structure et contenu | WEB/tool/SRC | CONDITIONAL→REQUIRED SEO |
| D11.I03 | INFO | Existing indexed URLs | Migration | CONN/AUDIT | CONDITIONAL redesign |
| D11.I04 | INFO | Critical rankings/traffic pages | Priorise préservation | CONN | CONDITIONAL |
| D11.I05 | INFO | Local SEO context | Zone/services/local evidence | D03/WEB | CONDITIONAL |
| D11.A01 | ANALYSIS | Keyword/topic clustering | Évite pages cannibales | SEO/tool/AI-H | CONDITIONAL |
| D11.A02 | ANALYSIS | Page-intent mapping | Relie IA au search intent | SEO | REQUIRED si SEO actif |
| D11.A03 | ANALYSIS | Migration risk analysis | Détecte pertes possibles | SEO/AUDIT | REQUIRED redesign SEO |
| D11.D01 | DECISION | SEO strategy scope accepted | Pas de SEO “par défaut” excessif | PM/SEO owner | REQUIRED si actif |
| D11.S01 | SPEC | SEO intent per strategic route | Base content/meta | SEO | REQUIRED si indexable |
| D11.S02 | SPEC | Title/H1/meta requirements model | Cadre génération | SEO/content | REQUIRED web indexable |
| D11.S03 | SPEC | Canonical/index/noindex rules | Crawl intent | SEO/tech | REQUIRED web |
| D11.S04 | SPEC | Internal linking requirements | Discoverability | SEO/IA | REQUIRED si SEO actif |
| D11.S05 | SPEC | Structured data applicability | Seulement contenu réel | SEO/tech | CONDITIONAL |
| D11.S06 | SPEC | Redirect/migration mapping requirement | Préserver URLs | SEO/tech | CONDITIONAL redesign |
| D11.S07 | SPEC | Sitemap/robots requirements | Crawl controls | SEO/tech | REQUIRED public web |
| D11.V01 | VERIFY | Every indexable strategic page has search intent or justified no-search role | Cohérence | QA/SEO | G8 |
| D11.V02 | VERIFY | No critical legacy URL lacks migration decision | Migration safety | QA/SEO | G8 conditional |

---

# D12 — Functional Requirements, Business Rules & UI States

| ID | Type | Atom | Utilité | Acquisition/production | Criticité |
|---|---|---|---|---|---|
| D12.I01 | INFO | Candidate function/capability | Point de départ | D07 | REQUIRED si fonction |
| D12.A01 | ANALYSIS | Function necessity/value | Évite fonctions par habitude | PM/AI-H | REQUIRED |
| D12.A02 | ANALYSIS | Simpler alternative | Réduit complexité | PM/tech/AI-R | CONDITIONAL |
| D12.D01 | DECISION | Scope bucket V1/LATER/NOT_RECOMMENDED | Fige priorité | PM/owner | REQUIRED |
| D12.S01 | SPEC | Feature purpose | Pourquoi existe-t-elle | PM | REQUIRED |
| D12.S02 | SPEC | Actor/user | Qui agit | D03/PM | REQUIRED |
| D12.S03 | SPEC | Trigger | Quand comportement démarre | PM/UX | REQUIRED |
| D12.S04 | SPEC | Preconditions | Conditions avant action | PM/tech | CONDITIONAL |
| D12.S05 | SPEC | Happy path | Comportement nominal | PM/UX | REQUIRED |
| D12.S06 | SPEC | Business rules | Décisions métier explicites | PM/HUM | REQUIRED si règle |
| D12.S07 | SPEC | Validation rules | Champs/données acceptables | PM/tech | CONDITIONAL |
| D12.S08 | SPEC | Permissions implication | Qui peut quoi | D13 | CONDITIONAL |
| D12.S09 | SPEC | Loading state | Feedback en cours | UX | CONDITIONAL dynamique |
| D12.S10 | SPEC | Empty state | Cas sans donnée | UX/PM | CONDITIONAL |
| D12.S11 | SPEC | Error state | Échec compréhensible/retry/fallback | UX/PM/tech | REQUIRED fonctions critiques |
| D12.S12 | SPEC | Success state | Suite logique | UX/PM | REQUIRED actions engageantes |
| D12.S13 | SPEC | Edge cases | Évite invention dev | PM/QA | REQUIRED selon risque |
| D12.S14 | SPEC | Failure fallback | Continuité service | PM/tech | CONDITIONAL |
| D12.V01 | VERIFY | Every V1 feature has purpose+actor+behavior+critical states | Completeness | CALC/QA | G5/G8 |

---

# D13 — Data, Content Model, CMS, Roles & Permissions

| ID | Type | Atom | Utilité | Acquisition/production | Criticité |
|---|---|---|---|---|---|
| D13.I01 | INFO | Persistent data need | Active domaine | D12/tech | CONDITIONAL |
| D13.I02 | INFO | Editorial/admin content need | Active CMS | D10/D12 | CONDITIONAL |
| D13.A01 | ANALYSIS | Data classification | Public/internal/personal/sensitive | tech/D17 | REQUIRED si data |
| D13.D01 | DECISION | Source of truth per data family | Évite duplication | architect/owner | REQUIRED si data |
| D13.D02 | DECISION | CMS/admin approach | Qui gère contenu | owner/architect | CONDITIONAL |
| D13.S01 | SPEC | Entity/content type | Modèle explicite | architect | REQUIRED si data |
| D13.S02 | SPEC | Fields and requiredness | Structure | architect/PM | REQUIRED |
| D13.S03 | SPEC | Relationships | Cohérence | architect | CONDITIONAL |
| D13.S04 | SPEC | Lifecycle/status | Comportement data | PM/architect | CONDITIONAL |
| D13.S05 | SPEC | Roles | Acteurs système | PM/HUM | CONDITIONAL |
| D13.S06 | SPEC | Permissions | Read/create/update/delete/action | PM/security | CONDITIONAL, BLOCKING si privé |
| D13.S07 | SPEC | Retention/deletion | Privacy/operations | D17 | CONDITIONAL |
| D13.S08 | SPEC | Import/export requirement | Migration/ops | owner/architect | CONDITIONAL |
| D13.S09 | SPEC | Data migration requirement | Redesign/system change | architect | CONDITIONAL |
| D13.S10 | SPEC | Admin/editor workflows | Exploitation contenu | UX/PM | CONDITIONAL CMS |
| D13.V01 | VERIFY | Every private data action has explicit permission rule | Security | QA/security | G8 conditional |
| D13.V02 | VERIFY | No persistent entity exists without owner/source-of-truth rationale | Maintainability | architect | G7 |

---

# D14 — Integrations, APIs, Notifications & External Services

| ID | Type | Atom | Utilité | Acquisition/production | Criticité |
|---|---|---|---|---|---|
| D14.I01 | INFO | External service need | Active integration | D12/HUM | CONDITIONAL |
| D14.I02 | INFO | Provider constraint | Contract/vendor | HUM/SRC | CONDITIONAL |
| D14.A01 | ANALYSIS | Build vs integrate assessment | Évite dépendance inutile | architect/PM | CONDITIONAL |
| D14.A02 | ANALYSIS | Provider risk/criticality | Outage/lock-in/privacy | architect/security | REQUIRED critique |
| D14.D01 | DECISION | Provider/service choice | Source active | owner/architect | CONDITIONAL |
| D14.S01 | SPEC | Integration purpose | Pourquoi | PM | REQUIRED intégration |
| D14.S02 | SPEC | Data exchanged | Security/data | architect | REQUIRED |
| D14.S03 | SPEC | Auth mechanism expectation | Contract technique | architect/security | CONDITIONAL |
| D14.S04 | SPEC | API/webhook/events contract | Interaction | architect | CONDITIONAL |
| D14.S05 | SPEC | Rate/quota assumptions | Fiabilité/coût | architect | CONDITIONAL |
| D14.S06 | SPEC | Timeout/error/retry/fallback | Robustesse | architect/PM | REQUIRED critique |
| D14.S07 | SPEC | Email/SMS/push trigger | Notifications | PM | CONDITIONAL |
| D14.S08 | SPEC | Notification recipient/content intent | Évite mail “inventé” | PM/content | CONDITIONAL |
| D14.S09 | SPEC | Notification failure behavior | Continuité | PM/tech | CONDITIONAL |
| D14.V01 | VERIFY | Critical third-party failure has defined user/system behavior | Resilience | QA | G8 conditional |

---

# D15 — UX, UI, Brand & Design System Definition

| ID | Type | Atom | Utilité | Acquisition/production | Criticité |
|---|---|---|---|---|---|
| D15.I01 | INFO | Brand constraints | Respect identité | D04/SRC/HUM | CONDITIONAL |
| D15.I02 | INFO | Visual preferences | Orienter sans surpondérer goût | HUM/RAW | ENHANCER |
| D15.I03 | INFO | Visual anti-references | Éviter dérives | HUM/AI-H | ENHANCER |
| D15.A01 | ANALYSIS | UX hierarchy validation | Vérifier avant habillage | UX | REQUIRED |
| D15.A02 | ANALYSIS | Visual direction options | Explorer si nécessaire | design/AI-R | CONDITIONAL |
| D15.D01 | DECISION | Accepted UX structure fidelity | Niveau suffisant pour dev | UX/PM | G6 REQUIRED |
| D15.D02 | DECISION | Accepted visual direction | Source active | owner/design | G6 REQUIRED si UI custom |
| D15.S01 | SPEC | Wireframe/layout per strategic surface | Structure | UX | REQUIRED selon complexité |
| D15.S02 | SPEC | Responsive behavior | Mobile/tablet/desktop | UX/design | REQUIRED |
| D15.S03 | SPEC | Design tokens | Cohérence | design | REQUIRED UI custom |
| D15.S04 | SPEC | Typography rules | Lisibilité/système | design | REQUIRED UI custom |
| D15.S05 | SPEC | Color/surface rules | Cohérence/contraste | design | REQUIRED UI custom |
| D15.S06 | SPEC | Component inventory | Blocs réutilisables | design/UX | REQUIRED si design system |
| D15.S07 | SPEC | Component variants/states | Évite invention dev | design/UX | REQUIRED composants critiques |
| D15.S08 | SPEC | Interaction/motion rules | Gouverner animations | design/UX | CONDITIONAL |
| D15.S09 | SPEC | Reduced-motion expectation | Accessibilité | D18 | CONDITIONAL→REQUIRED si motion |
| D15.S10 | SPEC | Image/media treatment | Ratios/crop/usage | design/content | CONDITIONAL |
| D15.S11 | SPEC | Form visual/interaction states | UX formulaire | UX | REQUIRED formulaire |
| D15.V01 | VERIFY | Strategic surfaces are understandable without relying on final polish | UX quality | UX/QA | G6 |
| D15.V02 | VERIFY | No critical behavior exists only in visual implication | Handoff clarity | QA | G8 |

---

# G5 — PRODUCT_DEFINITION_STABLE — candidate

Ready lorsque, pour le scope applicable :
- macro scope issu de D07 est décomposé sans contradiction ;
- primary journeys D08 sont définis ;
- IA/page model D09 est accepté ;
- content requirements D10 sont identifiés ;
- SEO/migration D11 est cadré selon pertinence ;
- V1/LATER/NOT_RECOMMENDED D12 sont explicites ;
- data/integration needs critiques sont détectés ;
- aucun conflit produit critique n'est masqué.

# G6 — EXPERIENCE_DEFINITION_SUFFICIENT — candidate

Ready lorsque :
- structure UX stratégique matérialisée au niveau nécessaire ;
- responsive behavior défini ;
- design/brand constraints actives ;
- composants/états critiques définis ;
- le développeur n'a pas à inventer une interaction ou hiérarchie produit structurante.

G6 n'exige pas nécessairement des maquettes pixel-perfect pour un projet simple.

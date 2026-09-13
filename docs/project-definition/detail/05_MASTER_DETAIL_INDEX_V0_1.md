# 4b4c — MASTER DETAILED REFERENTIAL INDEX — V0.1

Date : 2026-09-13

Statut : **WORKING CANDIDATE — NON CANONIQUE**

Architecture parente : `PROJECT_DEFINITION_REFERENCE_ARCHITECTURE_V0_4.md`.

But : descendre D01→D22 au niveau **sous-domaines + questions internes + résolution AI/HUM + dépendances + locks**, sans transformer le référentiel en questionnaire visible.

---

# 1. Invariant

`QUESTION_INTERNE ≠ QUESTION_UTILISATEUR`.

Une question interne est une information/decision/analyse que le système doit résoudre. Elle peut être satisfaite par source, audit, recherche, calcul, hypothèse IA, recommandation IA, humain ou expert.

La politique d’autorité est définie par `AI_HUMAN_RESOLUTION_POLICY_V0_1.md`.

---

# 2. Fiche standard de sous-domaine

Chaque sous-domaine documente :

- `ID`
- `Mission`
- `Internal questions`
- `Default resolution class`
- `Human interaction level`
- `Prerequisites`
- `Outputs / atoms affected`
- `Unlocks`
- `Lock target`
- `Change impact`
- `Applicability`

### Resolution classes

- `R1 AUTO_SOURCE_FACT`
- `R2 AUTO_AUDIT_OBSERVATION`
- `R3 AUTO_DERIVED`
- `R4 AI_HYPOTHESIS`
- `R5 AI_RECOMMENDATION`
- `R6 HUMAN_INTENT`
- `R7 HUMAN_PREFERENCE`
- `R8 HUMAN_DECISION`
- `R9 EXPERT_REQUIRED`

### Human interaction

- `NONE`
- `OPTIONAL_CORRECTION`
- `LIGHT_REVIEW`
- `EXPLICIT_CHOICE`
- `FORMAL_APPROVAL`
- `EXPERT_SIGNOFF`

### Lock targets

- `WORKING`
- `AI_PROPOSED`
- `VALIDATED_CURRENT`
- `LOCKED_FOR_DEPENDENTS`
- `FROZEN_IN_DECISION_SNAPSHOT`
- `APPROVED_FOR_PROJECT`
- `FROZEN_FOR_BUILD`

---

# 3. Volumes

## Volume A — IDEA foundation / evidence / strategy

`05A_IDEA_DETAIL_CATALOG_V0_1.md`

Couvre D01→D07.

## Volume B — PREFIGURATION / DECISION / PRESENTATION

`05B_PREFIGURATION_DECISION_DETAIL_CATALOG_V0_1.md`

Couvre les subsets PREVIEW D08→D19 + D21/D22 avant Project.

## Volume C — PROJECT product / experience

`05C_PROJECT_PRODUCT_DETAIL_CATALOG_V0_1.md`

Couvre D08→D15 en profondeur Project.

## Volume D — PROJECT tech / NFR / Build Ready

`05D_PROJECT_TECH_BUILDREADY_DETAIL_CATALOG_V0_1.md`

Couvre D16→D20 en profondeur Project/Build Ready.

---

# 4. Règles de couverture

Chaque sous-domaine doit répondre à quatre tests :

1. **Need test** — pourquoi cette connaissance/décision existe-t-elle ?
2. **Resolution test** — peut-elle être résolue sans demander à l’utilisateur ?
3. **Dependency test** — que permet-elle réellement de faire ensuite ?
4. **Missing-risk test** — qu’est-ce qui devient faux, dangereux ou ambigu si elle manque ?

Si aucun test ne justifie l’item, il est supprimé ou classé `ENHANCER`.

---

# 5. Validation attendue après remplissage

Le catalogue détaillé devra être red-teamé sur au moins :

- site vitrine local 5 pages ;
- cabinet B2B ;
- refonte SEO existante ;
- activité réglementée ;
- multilingue ;
- CMS éditorial ;
- formulaires/données personnelles ;
- entreprise sans concurrent direct clair ;
- projet avec stack imposée ;
- idée faible à arrêter ;
- idée changée pendant présentation ;
- approbation conditionnelle ;
- contenu final disponible après démarrage dev ;
- intégration tierce critique ;
- décision solo vs comité.

Le catalogue n’est promouvable qu’après vérification qu’il ne crée ni trous professionnels majeurs ni questions humaines inutiles.

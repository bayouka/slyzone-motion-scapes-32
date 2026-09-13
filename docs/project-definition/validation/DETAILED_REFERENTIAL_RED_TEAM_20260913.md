# 4b4c — DETAILED REFERENTIAL RED TEAM — 2026-09-13

Statut : **VALIDATION SUPPORT — NON CANONIQUE**

Scope : `05A` IDEA, `05B` PREFIGURATION/DECISION, `05C` PROJECT PRODUCT, `05D` PROJECT TECH/BUILD READY.

---

# 1. Résultat global

La structure D01→D22 tient, mais quatre mécanismes transverses doivent être ajoutés avant promotion :

1. **Context Overlay Catalog** plus précis pour activer/désactiver les atoms sans questionner inutilement.
2. **Approved Idea → Project Baseline Promotion Contract** pour gérer proprement Z6 et les approvals conditionnels.
3. **Human Intervention Map** pour rendre explicite le petit nombre de questions réellement human-only.
4. **Cross-cutting Ledgers** : assumptions, decisions, evidence/source, risks/unknowns doivent rester reliés à tous les domaines.

Aucun nouveau Domain D23 n’est nécessaire pour ces besoins : ce sont des mécanismes transverses.

---

# 2. Scénarios

## RT01 — Artisan local, site 5 pages

Attendu : faible charge documentaire, pas de business case complet, pas de CMS/auth si inutile.

Résultat : PASS si overlays/proportionality activent seulement local SEO, contact, trust, mobile, legal/privacy minimale.

Risque : sans overlay, D13/D14/D19 pourraient sembler plus lourds que nécessaire.

Action : Context Overlay Catalog.

## RT02 — Refonte SEO à fort trafic

Attendu : existing URLs, Search Console, redirect map, migration risk, preservation, crawl/index requirements.

Résultat : PASS D04/D11/D16/D20.

Ajout : `SEO_MIGRATION_RISK` doit automatiquement augmenter criticité de migration/redirect/canonical/sitemap/validation.

## RT03 — Cabinet/clinique réglementé

Attendu : claims, données personnelles, secteur réglementé, expert review, accessibility/trust.

Résultat : PASS D17/D18 avec R9.

Protection : l’IA ne peut jamais promouvoir une conclusion juridique/sectorielle sensible en `APPROVED` sans signoff requis.

## RT04 — Site multilingue

Trou détecté : traduction/localisation apparaît mais pas assez structurée.

À couvrir via overlay :
- locales ;
- source language ;
- translation owner/workflow ;
- locale routing ;
- hreflang/canonical ;
- fallback ;
- localized media/claims/legal ;
- CMS locale model ;
- QA locale.

Action : overlay `IS_MULTILINGUAL`.

## RT05 — CMS éditorial

Résultat : PASS D10/D13.

À activer automatiquement : content types, author/editor/publisher roles, draft/review/publish, preview, scheduling si besoin, localization if combined.

## RT06 — Formulaire avec données personnelles

Résultat : PASS D12/D13/D14/D17.

Overlay `HAS_PERSONAL_DATA` doit activer minimization, notice, retention, processors, spam/abuse, secure handling.

## RT07 — Aucun concurrent direct pertinent

Résultat : PASS D05 grâce alternatives/substitutes/non-consumption.

Important : absence de liste de concurrents ne doit pas bloquer G2 si `MARKET_CONTEXT_SUFFICIENT_FOR_STRATEGY` est satisfait autrement.

## RT08 — Stack imposée WordPress/Webflow/Lovable

Résultat : PASS D16 via Delivery Profile.

Protection : la plateforme imposée est une contrainte, pas une justification pour changer silencieusement le produit.

## RT09 — Contenus finaux disponibles après démarrage dev

Résultat : PASS D10.

Condition : owner, format, content model, status, timing, fallback non publiable et dependencies doivent être définis.

## RT10 — Booking/CRM tiers critique

Résultat : PASS D14/D16/D17/D20.

À activer : sandbox/test credentials, failure strategy, quota/rate, privacy, fallback, acceptance integration.

## RT11 — Décision par comité

Résultat : PASS D01/D22.

Activation : owner/method, expected evidence, package mode, review log, formal approval.

## RT12 — Présentation change B2C → B2B

Résultat conceptuel : PASS Change Impact, mais Z6 baseline promotion doit être explicite.

Effet attendu : D03→D05→D06→D07→Z4 artifacts→D21/D22 deviennent REVIEW_REQUIRED/STALE selon dépendances. Business problem peut rester valide.

Action : Promotion Contract.

## RT13 — Belle maquette trop tôt

Résultat : PASS P0/P.D15 safeguards.

Protection : concept label, fidelity parity, rationale/assumptions, aucun G5 sans evidence stratégique suffisante.

## RT14 — APPROVE_WITH_CONDITIONS

Trou partiel : V0.4 définit outcome mais pas assez la mécanique Z6.

Nécessaire : classifier condition `STRUCTURAL / PROJECT_RESOLVABLE / NON_BLOCKING`; seules les deux dernières permettent création Project selon règle explicite.

Action : Promotion Contract.

## RT15 — Rebranding parallèle au site

Trou : D15 sait consommer une brand baseline mais pas gérer clairement une identité en chantier.

Overlay : `BRAND_IN_TRANSITION` avec dependency sur source/owner, temporary visual baseline, condition de promotion.

## RT16 — Domaine/hosting change simultané

Résultat : PASS D11/D16 mais overlay `DOMAIN_MIGRATION` doit augmenter criticité DNS, redirects, email continuity, canonical/analytics/Search Console.

## RT17 — Très forte contrainte budget/délai

Résultat : PASS D02/D07/D21.

Overlay `BUDGET_OR_TIME_CONSTRAINED` doit renforcer simplification, scope tiers, risk/feasibility and delivery profile fit.

## RT18 — User research impossible

Résultat : PASS si accepted unknown possible.

Protection : ne jamais convertir persona synthétique en evidence. Decision Package doit exposer incertitude restante.

## RT19 — Site marketing avec authentification légère

Résultat : PASS D12-D18, mais activation doit basculer vers requirements rôles/permissions/auth/session/abuse.

Overlay `HAS_AUTH_OR_ROLES`.

## RT20 — Projet en réalité SaaS/app

Résultat : PASS via BLUEPRINT_MISMATCH.

Le Site vitrine overlay ne doit pas s’étendre artificiellement jusqu’à couvrir un produit applicatif.

---

# 3. Gaps à corriger

## GAP-A — Context applicability

Créer `06_CONTEXT_OVERLAY_CATALOG_V0_1.md`.

## GAP-B — Z6 Promotion

Créer `07_APPROVED_IDEA_TO_PROJECT_PROMOTION_CONTRACT_V0_1.md`.

## GAP-C — Human question budget

Créer `08_HUMAN_INTERVENTION_MAP_V0_1.md`.

## GAP-D — Cross-cutting ledgers

Formaliser dans le prochain schema/implementation mapping :
- Evidence Ledger ;
- Assumption Ledger ;
- Decision Ledger ;
- Risk/Unknown Ledger ;
- Conflict Groups ;
- Source/Provenance Ledger.

Ces ledgers ne sont pas des écrans ni des domaines métier ; ils assurent intégrité et Change Intelligence.

---

# 4. Verdict

Les quatre Detailed Catalogs sont suffisamment cohérents pour poursuivre la structuration, mais **pas encore promotables comme canon** avant les corrections GAP-A/B/C et une passe de couverture finale Site vitrine.

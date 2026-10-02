# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary user is a **hospital pharmacist verifying an IV mixture**. They arrive
mid-task, at the bench or in a preparation workflow, holding a formulation that
someone has already written down (volumes of base bags, concentrations, target
totals) and needing to know whether the arithmetic behind it is correct before
the preparation is checked and released.

Secondary users, confirmed by the existing bilingual product: pharmacy and
nursing students learning linear systems through real IV cases, and reviewers
evaluating the algorithm and its clinical grounding. They are audiences for the
same surface, not separate products.

## Product Purpose

MedMath Solver solves the linear systems behind hospital IV admixtures using
Gaussian elimination with partial pivoting, and then **verifies** the computed
solution against the expected clinical value carried by each case. It exists
because a mathematically correct solve and a clinically correct preparation are
different claims, and the pharmacist needs both checked.

Success means: the pharmacist can enter or pick a formulation, see the solution
with its error margin against the expected value, trace the solve step by step,
and confirm the numbers match the protocol they were working from.

## Positioning

The mechanism is **verification against a cited clinical reference**, not
equation solving. Every seeded case carries a matrix, an expected solution, a
named published reference source, and clinical notes; the product's output is a
verified-or-not verdict with a visible error margin, not a bare number. A
generic linear-algebra tool could return the same vector and could not
truthfully return the protocol citation or the expected-value comparison.

## Operating Context

- **Where it is used:** hospital pharmacy, during formulation verification of
  IV admixtures — dextrose (D10W), electrolyte balancing for parenteral
  nutrition, potassium repletion, bicarbonate correction, and amino-acid /
  dextrose parenteral nutrition.
- **What it sits beside:** the pharmacy's own protocols and published
  references — the seeded cases cite Vanderbilt PMG electrolyte repletion,
  DailyMed prescribing information, ESPEN guidelines, and SEEN/SENPE guidance.
  The product supports that reading; it does not replace it.
- **Ritual:** a pharmacist documents what each variable represents (ml_D50W,
  ml_KCl_20, mEq), loads an example or types their own matrix, solves, checks
  the verification state, and keeps the run in history for later reference or
  CSV export.
- **Language:** Spanish-first (`lang=es` default) with full English parity; the
  domain vocabulary (mEq, mL, osmolaridad, vía periférica) is Spanish clinical
  usage and must stay exact.
- **Environments:** deployed as a static frontend (Vercel / Netlify) against a
  FastAPI + SQLite API (Render / Railway); also self-hosted whole-stack via
  `docker compose`. The frontend has no build step and loads all libraries from
  a CDN.

## Capabilities and Constraints

Confirmed:

- Gaussian elimination with partial pivoting, pure Python, matrices up to 6×6;
  never mutates caller input.
- Five seeded clinical cases: D10W 500 ml, NPT Na/K/Cl balance 3×3, KCl 20/40
  potassium repletion, NaHCO₃ 8.4%/4.2%, PN amino acids 10% + dextrose 50%.
- Free mode: user-authored system up to 6×6 with per-variable clinical
  documentation (what each variable and unit means).
- Numerical verification of each result against the stored expected solution
  (`EXPECTED_TOLERANCE`, default `1e-6`) with the error margin surfaced.
- Step-by-step replay of the elimination for animation, including pivot column.
- Calculation history with CSV export; full case CRUD through the API.
- Rate limiting at 30 requests/minute per client IP, proxy-aware.
- API JSON returns raw strings; the frontend is responsible for escaping.

Explicitly undecided / known gaps:

- **Real reference sources are pending.** Two seeded cases cite placeholder URLs
  — D10W cites `https://example-hospital.org/protocolos/mezclas-iv` (an
  RFC 2606 reserved domain) and the electrolytes case cites
  `https://seen.es/guias/npt-casos`. Real protocol URLs will be supplied. Until
  they arrive, those citations must not be presented as authoritative sources.
- **The required clinical disclaimer does not exist yet.** No product surface
  currently carries a "not medical advice / verify against your local protocol"
  statement; adding it is a confirmed product requirement, not an open option.
- No accessibility standard or specific user need has been established beyond
  the baseline already present in the frontend (skip link, `aria-live` status
  regions, `prefers-reduced-motion` handling, single `<h1>`, ES/EN language
  parity).

## Brand Commitments

- **Name:** MedMath Solver. MIT licensed.
- **Tagline:** "Eliminación de Gauss · Farmacia Hospitalaria" — the name and
  tagline commit the product to Gaussian elimination and to hospital pharmacy;
  neither may be quietly broadened.
- **Voice:** Spanish clinical register — precise, technical, unit-bearing. The
  product names concentrations and units rather than describing them
  qualitatively.
- **Identity constraint:** the app is presented as a working clinical-support
  tool with cited references, not as a demo or a portfolio piece. Marketing
  surfaces (meta description, Open Graph, structured data) already make
  `HealthApplication` claims and must stay consistent with the safety posture
  above.

## Evidence on Hand

Real, in-repo:

- Five seeded cases with matrices, expected solutions, variables, units, and
  clinical notes — `backend/app/cases.py`.
- Genuine published references for three cases: Vanderbilt University Medical
  Center Electrolyte Repletion Guideline (PMG, PDF), DailyMed / NLM-FDA Sodium
  Bicarbonate Injection USP prescribing information, and ESPEN guidelines on
  parenteral nutrition.
- A Playwright E2E suite of seven tests over the live stack
  (`tests/e2e/`), a compose smoke test (`scripts/smoke_test.sh`), and CI
  running backend, frontend, E2E and smoke jobs (`.github/workflows/ci.yml`).

Absent, and which future work must not fabricate:

- No testimonials, customers, institutional names, usage figures, or case
  studies.
- No real hospital is named anywhere; "Hospital General v2024" in the D10W case
  is illustrative, not an institution.
- No pricing, licensing beyond MIT, compliance certification, or regulatory
  status. No audited claim of clinical validation exists.

## Product Principles

1. **Verify before asserting.** A result is never presented as a bare number;
   it arrives with its expected value and its error margin, and the
   verified/unverified state is part of the output.
2. **The math must be auditable.** A pharmacist has to be able to follow the
   solve. Step replay is a clinical-safety feature, not a flourish.
3. **No claim outruns its citation.** Until real protocol URLs replace the
   placeholders, sources are labeled provisional. Clinical notes stay specific
   and unit-bearing.
4. **Educational, never authorizing.** The product checks arithmetic against a
   published protocol. It does not approve, prescribe, or release a
   preparation, and must say so.
5. **Spanish first, English equal.** ES is the default and the source of the
   domain vocabulary; EN is full parity, not a partial translation.

## Accessibility & Inclusion

No product-specific accessibility requirement has been established beyond the
baseline already in the frontend, which future work must not regress: skip link
to main content, `aria-live` for status and rate-limit messaging, visible focus
states, `prefers-reduced-motion` honored for all animation, a single `<h1>` per
page, and ES/EN parity in labels and announcements.

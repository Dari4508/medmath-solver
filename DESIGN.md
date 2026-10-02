---
name: MedMath Solver
description: Gaussian elimination for hospital pharmacy — clinical IV mixture verification
colors:
  primary: "#22c55e"
  primary-deep: "#16a34a"
  accent-soft: "#4ade80"
  accent-dim: "rgba(34, 197, 94, 0.12)"
  accent-glow: "rgba(34, 197, 94, 0.35)"
  secondary: "#3b82f6"
  secondary-dim: "rgba(59, 130, 246, 0.14)"
  bg-base: "#030712"
  bg-surface: "#0a0f1a"
  bg-elevated: "#111827"
  border-subtle: "#1f2937"
  border-strong: "#374151"
  text-primary: "#f3f4f6"
  text-secondary: "#9ca3af"
  text-muted: "#6b7280"
  focus-ring: "#3b82f6"
  med-500: "#22c55e"
  gauss-500: "#3b82f6"
typography:
  display:
    fontFamily: '"Sora", system-ui, sans-serif'
    fontSize: "clamp(1.05rem, 1.6vw, 1.3rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  headline:
    fontFamily: '"Sora", system-ui, sans-serif'
    fontSize: "clamp(1.25rem, 2.5vw, 1.875rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  title:
    fontFamily: '"Sora", system-ui, sans-serif'
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  body:
    fontFamily: '"Sora", system-ui, sans-serif'
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  label:
    fontFamily: '"Sora", system-ui, sans-serif'
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
  mono:
    fontFamily: '"IBM Plex Mono", "JetBrains Mono", ui-monospace, monospace'
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  sm: "6px"
  md: "10px"
  lg: "14px"
  full: "999px"
motion:
  duration-fast: "150ms"
  duration-med: "250ms"
  ease-out: "cubic-bezier(0.22, 1, 0.36, 1)"
  ease-pop: "cubic-bezier(0.34, 1.56, 0.64, 1)"
components:
  nav-btn:
    backgroundColor: "{colors.bg-elevated}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.sm}"
    padding: "6px 12px"
  ctrl-btn:
    backgroundColor: "{colors.bg-elevated}"
    textColor: "#d1d5db"
    rounded: "{rounded.sm}"
    padding: "8px"
    size: "32px 32px"
  home-cta-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#052e16"
    rounded: "{rounded.md}"
    padding: "0.5rem 1.1rem"
  home-cta-secondary:
    backgroundColor: "rgba(255, 255, 255, 0.04)"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1.1rem"
---

# Design System: MedMath Solver

## Overview

**Creative North Star:** "Clinical verification through traceable arithmetic"

The MedMath Solver design system is built for hospital pharmacy workflows — specifically for pharmacists verifying IV admixtures mid-task at the bench. It prioritizes clarity, auditability, and precision over decorative flair. The system is Spanish-first (with full EN parity in UI) and uses clinical domain vocabulary throughout; the visual language reflects that technical, unit-bearing register.

The aesthetic is a dark, data-dense interface with a soft ambient mesh and subtle micro-interactions. The interface is functional-first: every animation serves to make the Gaussian elimination traceable and auditable (step replay is a safety feature, not a flourish). Typography uses Sora for UI and IBM Plex Mono for numerical/matrix content to ensure alignment and legibility at small sizes.

**Key Characteristics:**
- **Dark-first with ambient light**: Near-black base (#030712) with a subtle green/blue radial mesh background (see `frontend/assets/styles.css:52–69`, `frontend/assets/styles.css:34–48`)
- **High-contrast, low-noise**: Muted grays for secondary text; primary accent is medical-green (#22c55e) for success/verification states
- **Monospaced precision**: IBM Plex Mono is used for matrices, step descriptions, counters, and numeric values (see `frontend/assets/styles.css:164–171`)
- **Information-dense, readable**: Bento grid for cases, two-column layout for free mode (xl:grid-cols-2), responsive with mobile-first considerations
- **Motion-aware by default**: All animations respect `prefers-reduced-motion` and use GPU-friendly transforms (see `frontend/assets/styles.css:689–699`, `frontend/assets/styles.css:136–155`, `356–350`)
- **Accessible baseline**: Skip link, focus-visible outlines, minimum 24px touch targets, ARIA live regions (implemented in HTML/JS; see `frontend/index.html:41`, `frontend/assets/styles.css:178–215`, `218–226`)

## Colors

The palette is anchored in a clinical/technical dark theme with a green accent representing verification/success and a blue accent representing the algorithm (Gauss).

### Primary
All tokens live in the `:root` block at `frontend/assets/styles.css:1–23`. Tailwind mirrors the same two accents at `frontend/js/tailwind-config.js:9–10`.

- **Medical Green** (`#22c55e`, var `--accent`) — `frontend/assets/styles.css:12`, `frontend/js/tailwind-config.js:9`, `frontend/index.html:47`. Used for success states, verification badges, active nav underlines, hero gradients, and primary CTAs. Connotes correctness/verified results.
- **Primary Deep** (`#16a34a`) — `frontend/js/tailwind-config.js:9`. Hover state for primary CTA (`frontend/assets/styles.css:281–286`, `393–396`).
- **Accent Soft** (`#4ade80`, var `--accent-soft`) — `frontend/assets/styles.css:13`. Used for hover states and subtle text accents (`frontend/assets/styles.css:553`, `frontend/assets/styles.css:470`).
- **Accent Dim** (`rgba(34, 197, 94, 0.12)`, var `--accent-dim`) — `frontend/assets/styles.css:14`. Used for focus rings, active nav background, badges, and animated highlights (`frontend/assets/styles.css:244–247`, `324–325`, `469`, `580`, `154`).
- **Accent Glow** (`rgba(34, 197, 94, 0.35)`, var `--accent-glow`) — `frontend/assets/styles.css:15`. Used for card hover shadows and CTA glows (`frontend/assets/styles.css:23`, `282`, `395`).

### Secondary
- **Gauss Blue** (`#3b82f6`, var `--gauss`) — `frontend/assets/styles.css:16`, `frontend/js/tailwind-config.js:10`. Represents the algorithm/visualization; used in ambient mesh and focus ring defaults (`frontend/assets/styles.css:60`, `18`).
- **Gauss Dim** (`rgba(59, 130, 246, 0.14)`, var `--gauss-dim`) — `frontend/assets/styles.css:17`. Used in mesh gradients and card accents (`frontend/assets/styles.css:60`, `512`, `560`).

### Neutral
- **Base Background** (`#030712`, var `--bg-base`) — `frontend/assets/styles.css:4`, applied to body (`frontend/assets/styles.css:33`).
- **Surface Background** (`#0a0f1a`, var `--bg-surface`) — `frontend/assets/styles.css:5`. Used for cards, panels, and bento surfaces (`frontend/assets/styles.css:363`, `419`, `512`, `607`, `667–670`).
- **Elevated Background** (`#111827`, var `--bg-elevated`) — `frontend/assets/styles.css:6`. Used for inputs, controls, buttons, selects (`frontend/assets/styles.css:91`, `252`, `312`, `667–670` context).
- **Border Subtle** (`#1f2937`, var `--border-subtle`) — `frontend/assets/styles.css:7`. Default panel/card borders (`frontend/assets/styles.css:364`, `421`, `514`, `606`, `668`).
- **Border Strong** (`#374151`, var `--border-strong`) — `frontend/assets/styles.css:8`. Input borders, control borders, focus state baselines (`frontend/assets/styles.css:90`, `259`, `314`).
- **Text Primary** (`#f3f4f6`, var `--text-primary`) — `frontend/assets/styles.css:9`. Body text (`frontend/assets/styles.css:32`).
- **Text Secondary** (`#9ca3af`, var `--text-secondary`) — `frontend/assets/styles.css:10`. Supporting text, nav labels, descriptions (`frontend/assets/styles.css:231`, `440`, `460`, `573`, `595`).
- **Text Muted** (`#6b7280`, var `--text-muted`) — `frontend/assets/styles.css:11`. Subtler metadata (`frontend/assets/styles.css:590`, `597`).
- **Focus Ring** (`#3b82f6`, var `--focus-ring`) — `frontend/assets/styles.css:18`. Global focus-visible outlines (`frontend/assets/styles.css:198–215`).

### Named Rules
**The Verification Color Rule.** Green (`#22c55e`) is reserved for verified/success states (badges, icons, success micro-animations). Blue (`#3b82f6`) is reserved for algorithmic/visualization accents. Never use green to denote generic actions except verification-positive states.

## Typography

**Display Font:** Sora (family includes system-ui, sans-serif) — `frontend/index.html:20`, `frontend/assets/styles.css:2`, `frontend/js/tailwind-config.js:5`
**Body Font:** Sora — same family, used globally (`frontend/assets/styles.css:31`)
**Label/Mono Font:** IBM Plex Mono with JetBrains Mono fallback, ui-monospace — `frontend/index.html:20`, `frontend/assets/styles.css:3`, `frontend/js/tailwind-config.js:6`

**Character:** The pairing is technical and precise. Sora is a geometric sans-serif with a slightly modern character that reads clean at interface sizes; IBM Plex Mono provides tabular numerals and clear alignment for matrices and numeric values — essential for clinical arithmetic traceability.

### Hierarchy
- **Display** (700, `clamp(1.05rem, 1.6vw, 1.3rem)`, line-height 1.2, letter-spacing -0.03em) — Applied to `#app-title` (`frontend/assets/styles.css:157–162`). Brand mark in header; single `<h1>` per page as required.
- **Headline** (700, `clamp(1.25rem, 2.5vw, 1.875rem)`, line-height 1.15, letter-spacing -0.03em) — Used for major section headings like `#home-heading` (`frontend/index.html:81`, `frontend/index.html:136`, `142`, `239`, `245`).
- **Title** (600, 1.25rem, line-height 1.3, letter-spacing -0.015em) — Case card titles and section subheadings (`frontend/assets/styles.css:545–549`, `567`).
- **Body** (400, 1rem, line-height 1.55) — Default body text (`frontend/assets/styles.css:31`, `440`).
- **Label** (500, 0.875rem, line-height 1.4) — Navigation, buttons, form labels (`frontend/assets/styles.css:230–238`, `374–388`, `458`).
- **Mono** (400, 0.875rem, line-height 1.5, font-family IBM Plex Mono) — Matrices, step descriptions, counters, numeric outputs (`frontend/assets/styles.css:164–171`, `.matrix-input` styles at `311–332`).

### Named Rules
**The Monospaced Numbers Rule.** All numeric values involved in calculation (matrix coefficients, vectors, solutions, error margins, step counters) are rendered in IBM Plex Mono to preserve alignment and reduce misread digits. (Enforced via `.font-mono`, `#step-desc`, `#free-step-desc`, `.matrix-input` — `frontend/assets/styles.css:164–171`.)

## Layout

The layout is responsive, mobile-first, with a sticky glass header and a centered max-width container (`max-w-7xl mx-auto px-4`). The design uses CSS Grid for bento cases and Tailwind utility classes for responsive behavior.

**Header:** Sticky top-0 with glassmorphism (`frontend/assets/styles.css:72–80`, `frontend/index.html:44–73`). On mobile (≤767px), backdrop-filter is disabled for performance and replaced with solid background (`frontend/assets/styles.css:706–710`); nav collapses to hamburger-driven menu via pure CSS (`frontend/assets/styles.css:724–756`).

**Container:** Main uses `max-w-7xl mx-auto px-4 py-6` (`frontend/index.html:76`). Views are stacked sections with staggered reveal animations (`frontend/assets/styles.css:335–350`).

**Grid Systems:**
- **Cases (bento):** Mobile 1-column; md: 2-column; lg: 4-column with auto-rows; first card spans 2×2 on lg (`frontend/assets/styles.css:486–507`, `557–574`). This creates a bento visual hierarchy.
- **Free mode:** 1-column mobile; xl: 2-column with `items-start` (input left, results/animation right) (`frontend/index.html:163`).
- **Solver:** 1-column mobile; lg: 3-column grid (matrix visualizer spans 2 cols, sidebar 1 col) (`frontend/index.html:251`).
- **Home cards:** 1-column mobile; md: 3-column (`frontend/assets/styles.css:407–416`).

**Spacing Rhythm:** There is no spacing scale in `:root` — spacing is expressed with raw Tailwind utilities (`px-4 py-6`, `p-5`, `p-6`, `gap-3`, `gap-6`) rather than CSS variables. The `:root` block tokenizes only colors, fonts, radii, shadows, and motion (`frontend/assets/styles.css:1–28`); the motion tokens (`--duration-fast`, `--duration-med`, `--ease-out`, `--ease-pop`) sit at `frontend/assets/styles.css:24–27`. Do not introduce a spacing variable scale — match the existing utility-class approach.

**Responsive Behavior:** Hamburger menu is mobile-only (display:none desktop, shown at ≤767px). On resize >767px, menu state is cleared. Transforms are reduced/eliminated on mobile for performance (`frontend/assets/styles.css:711–723`).

## Elevation & Depth

The system uses a hybrid of subtle shadows, glassmorphism, and tonal layering to convey depth without heavy drop shadows.

**Surface Strategy:** Surfaces are predominantly flat at rest (`--shadow-card: 0 1px 2px rgba(0, 0, 0, 0.45)`, `frontend/assets/styles.css:22`). Depth is achieved through:
- **Glass header:** `backdrop-filter: blur(12px) saturate(150%)` with subtle inner border and bottom shadow (`frontend/assets/styles.css:71–80`).
- **Ambient mesh:** Fixed pseudo-element with radial gradients and slow drift animation creates spatial depth behind content (`frontend/assets/styles.css:52–69`). The animation is `prefers-reduced-motion` safe (disabled when reduced motion is set, `frontend/assets/styles.css:689–699`).
- **Elevation on interaction:** Card hover raises with `translateY(-3px)` and a green-tinted glow shadow (`--shadow-card-hover: 0 18px 42px -18px rgba(34, 197, 94, 0.35), 0 6px 16px rgba(0, 0, 0, 0.45)`) (`frontend/assets/styles.css:23`, `530–537`).
- **Tonal layering:** Panels use `bg-gray-900`/surface with subtle border differences; inputs sit slightly recessed (`frontend/assets/styles.css:312`, `667–670`).

**Shadow Vocabulary:**
- **Card (rest):** `0 1px 2px rgba(0, 0, 0, 0.45)` — minimal ambient shadow (`frontend/assets/styles.css:22`).
- **Card (hover):** Dual shadow with accent glow + deeper ambient — indicates interactivity (`frontend/assets/styles.css:23`, `536`).
- **Header:** Inset highlight + soft bottom shadow — separates from content (`frontend/assets/styles.css:77–80`).
- **Focus:** No box-shadow on focus-visible (uses 2px outline offset) to avoid motion/visual clutter; inputs use subtle glow on focus (`frontend/assets/styles.css:324–325`).

### Named Rules
**The Motion-Safe Depth Rule.** All depth cues that animate (mesh drift, transforms, shadows) must be disabled under `prefers-reduced-motion: reduce`. The mesh pseudo-element is removed entirely on mobile for scroll performance (`frontend/assets/styles.css:702–705`).

## Shapes

The shape language is pragmatic and functional: soft rounded corners with consistent radii, minimal borders, and form follows function.

- **Radius scale:** `--radius-sm: 6px` (inputs, small controls), `--radius-md: 10px` (CTAs, chips, cards in some contexts), `--radius-lg: 14px` (cards, panels, hero) — `frontend/assets/styles.css:19–21`. Pill shapes use Tailwind's `rounded-full` rather than a `--radius-full` variable.
- **Border treatment:** Subtly contrasting borders (`border-subtle` #1f2937) for separation without high visual weight; inputs/controls use stronger border on hover/focus states contextually (`frontend/assets/styles.css:90`, `259`, `314`, `324`).
- **Form inputs:** Square-ish with `radius-sm` (6px), compact padding (`6px 8px`), mono font for numeric entry (`frontend/assets/styles.css:311–332`).
- **Buttons/CTAs:** `radius-md` (10px), comfortable min-height (≥24px), with subtle scale transform on press (`frontend/assets/styles.css:273`, `285–286`, `299–300`, `386–388`).
- **Cards/panels:** `radius-lg` (14px), with inner padding (`p-5`, `p-6`, `frontend/index.html` panels).
- **Pills/badges:** `radius-full` (999px) for status badges (`frontend/assets/styles.css:580`, `468`, `628`).
- **Interactive affordance:** Cards lift on hover (translateY) rather than changing border dramatically; focus states are always outline-based for accessibility.

## Components

Components follow a dark glass/technical aesthetic. All interactive elements meet ≥24px target size (`frontend/assets/styles.css:218–226`).

### Navigation (site nav)
- **Style:** Horizontal flex nav with pill-style buttons (`frontend/assets/styles.css:228–247`, `frontend/index.html:60–70`).
- **States:** Default text-secondary; hover shows translucent background; active uses accent background with bottom accent bar (`box-shadow: inset 0 -2px 0 var(--accent)`, `frontend/assets/styles.css:243–247`).
- **Mobile:** Collapses to dropdown under header when menu-open; pure CSS-driven (no JS paint race) with slide/fade animation (`frontend/assets/styles.css:724–761`).
- **Accessibility:** Has skip link to `#main-content` (`frontend/index.html:41`, `frontend/assets/styles.css:178–195`); nav uses semantic `<nav>` with `aria-label="Main"`, menu toggle has `aria-expanded`/`aria-controls`.

### Header/Brand
- **Brand link:** Neutralized anchor styles (no underline/color change) with opacity hover; logo is a gradient G badge (`frontend/index.html:46–54`, `frontend/assets/styles.css:120–134`).
- **H1 constraint:** Single `<h1 id="app-title">MedMath Solver</h1>` in header (`frontend/index.html:51`); all other views use `<h2>` (`frontend/index.html:79`, `136`, `142`, `239`, `245`).
- **Rate limit badge:** Status badge (`#rate-badge`) with color states (ok/warn/crit) and aria-live polite (`frontend/index.html:56`, `frontend/assets/styles.css:684–686`).

### Buttons
- **Primary CTA (home):** Solid green background (#22c55e) on dark text (#052e16), bold weight, with subtle glow on hover; scale down on press (`frontend/assets/styles.css:389–396`).
- **Secondary CTA (home):** Translucent background with subtle border; hover brightens (`frontend/assets/styles.css:397–405`).
- **Control buttons (play/pause/step/reset):** 32×32 icon buttons with elevated bg, subtle border, hover state lifts visually; scale on press (`frontend/assets/styles.css:249–273`).
- **Form action buttons:** Shared transition/press behavior (`frontend/assets/styles.css:275–300`).
- **Accessibility:** Focus-visible outline always present; min-height/min-width ≥24px (`frontend/assets/styles.css:218–226`).

### Cards (Cases grid)
- **Surface:** Gradient-accented dark surface with subtle border; bento-style with featured first card larger/span (`frontend/assets/styles.css:509–575`).
- **States:** Hover lifts (translateY -3px), border turns green-tinted, background brightens slightly, title color shifts to accent-soft; active scales down (`frontend/assets/styles.css:530–542`, `551–554`).
- **Content:** Badge (size×size), variable count, title, description with 2-line clamp, source footer (`frontend/assets/styles.css:577–601`, `.line-clamp-2` at `677–682`).
- **Skeletons:** Shimmering skeleton loaders during fetch (`frontend/assets/styles.css:603–649`, keyframes `shimmer` at `147–150`).

### Inputs (Matrix form)
- **Style:** Dark base bg, strong border, radius-sm, mono font, compact padding; invalid state uses red border/glow (`frontend/assets/styles.css:311–332`).
- **States:** Focus shows green accent border + accent-dim glow; aria-invalid true triggers red treatment.
- **Layout:** Free-mode matrix rows use `overflow-x-auto` + `flex-nowrap` for 6×6 to prevent wrapping (`frontend/index.html` builds rows with these classes; see `buildFreeForm()` logic in `frontend/js/app.js` around form generation — rows wrap in flex-nowrap with min-w-max and horizontal scroll container).
- **Accessibility:** Each cell has descriptive aria-label (includes variable name when context is present); inputs support decimal inputmode.

### Panels (Verification/Solution/Case Info)
- **Surface:** Shared surface language — bg-surface, border-subtle, card shadow (`frontend/assets/styles.css:663–670`).
- **Verification:** Shows success/failure with emoji + text + error margin; success uses pop-in animation (`.anim-pop` at `652–656`, keyframes `pop-in` at `141–145`).
- **Solution:** Lists variables with mono values and units.

### Toasts
- **Style:** Fixed bottom-right, elevated panel with border, slides up with opacity transition (`frontend/index.html:324`).
- **Live region:** `role="status"` with `aria-live="polite"` for non-blocking announcements.

### Animations & Micro-interactions
- **Reveal-up:** Staggered view entrance (opacity + translateY) with slight delays for children (`frontend/assets/styles.css:335–350`).
- **Pop-in:** Used for success emoji/badges (`frontend/assets/styles.css:141–145`, `652–659`).
- **Row-highlight:** Subtly highlights rows during visualization (`frontend/assets/styles.css:152–156`).
- **Mesh-drift:** Slow ambient drift (22s ease-in-out alternate) — GPU-friendly transforms (`frontend/assets/styles.css:66–69`).
- **Press scale:** Consistent 0.97 scale on button press, 0.94/0.99 on controls/cards (`frontend/assets/styles.css:271–273`, `285–286`, `298–300`, `540–542`).
- **Hover lift:** Cards translateY(-3px) on hover (`frontend/assets/styles.css:531`).
- **Reduced motion:** All animations/transitions disabled under `prefers-reduced-motion: reduce`; mesh removed on mobile regardless (`frontend/assets/styles.css:689–723`).
- **Success animation:** `.anim-pop` class applied on verification success/failure emoji (`frontend/js/app.js` renders with `anim-pop` class on verification display).

### i18n Conventions (visual)
- Spanish-first default (`lang="es"` in HTML, `frontend/index.html:2`); language selector in header (`frontend/index.html:65–69`, `frontend/js/app.js` sets document.lang via `setLang()` at `frontend/js/app.js:19–24`). All UI strings use `data-i18n` attributes with ES/EN parity in the `DICT` map (`frontend/js/i18n.js:1–188`), resolved through `t()` at `frontend/js/i18n.js:206–210` and applied by `applyI18n()` at `frontend/js/i18n.js:211–223`.
- Clinical domain terms remain precise in both languages (units like mEq, mL preserved; Spanish clinical register is the source).

## Do's and Don'ts

### Do:
- **Do preserve the single `<h1>`** in `#app-title` with views using `<h2>` (as implemented in `frontend/index.html:51`, `79`, `136`, `142`, `239`, `245`).
- **Do honor `prefers-reduced-motion`** — all new animations must be wrapped/disabled under the reduce media query (existing pattern at `frontend/assets/styles.css:689–699`).
- **Do escape all DB strings** at render time — frontend uses `escHtml()` for any DB/API strings rendered to DOM (`escHtml` is used throughout `frontend/js/app.js` when rendering cases, case info, variables, etc.; API returns raw strings per AGENTS.md).
- **Do maintain ≥24px touch targets** for interactive elements (enforced via min-height/min-width rules at `frontend/assets/styles.css:218–226`).
- **Do use IBM Plex Mono for numeric/calculation content** (matrices, solutions, error margins, step counters) — follow existing class usage (`.font-mono`, `.matrix-input`).
- **Do keep free-mode matrix rows scrollable** with `overflow-x-auto` + `flex-nowrap` for 6×6 layouts (preserves the two-column free-mode layout behavior).
- **Do maintain focus-visible outlines** (never remove outlines; global rules at `frontend/assets/styles.css:198–215`).
- **Do keep animations GPU-friendly** (prefer transform/opacity over layout properties) as seen in existing keyframes.

### Don't:
- **Don't introduce build tooling** — this is a zero-build-step vanilla JS app (CDN-only libs: Tailwind, Chart.js, GSAP per `frontend/index.html:21–23`).
- **Don't change the glass header/mobile menu behavior** in a way that causes first-paint flash — the collapsed state is pure CSS (`frontend/assets/styles.css:724–756`).
- **Don't break the section-comment convention in CSS.** `frontend/assets/styles.css` uses 23 `/* —— Section —— */` comments as deliberate signposts (e.g. `/* Ambient gradient mesh */` at `:51`, `/* Accessibility: reduced motion */` at `:688`). Add a matching section header when you add a new block; don't inline-comment individual properties.
- **Don't over-comment application logic.** `frontend/js/app.js` has ~12 line comments, mostly labelling step boundaries. AGENTS.md forbids adding comments to new code unless asked, so keep new JS comment-free rather than matching a density that isn't there.
- **Don't assume libraries are available** — stick to what’s loaded via CDN as declared (`frontend/index.html:21–23`).
- **Don't broaden the product voice** — Spanish clinical register, unit-bearing, verification-first (aligns with PRODUCT.md positioning).
- **Don't paper over the clinical disclaimer gap** — note it as a gap below rather than adding UI silently. (PRODUCT.md explicitly states required clinical disclaimer does not exist yet.)

## Gaps/Observations (from incumbent system vs PRODUCT.md)

- **Clinical disclaimer surface is missing** (`PRODUCT.md:84–96`, line 90-91): No visible "not medical advice / verify against your local protocol" statement exists in the UI (header, home, cases, solver, free mode). This is a confirmed product requirement that is not reflected in the current design. Record as gap — do not add it now.
- **Placeholder reference URLs in seeded cases** (`PRODUCT.md:84–96`, line 85-89): Cases may cite example domains (e.g. RFC 2606 `example-hospital.org`) as noted in PRODUCT.md. The UI displays `reference_source` as-is (`frontend/js/app.js` renders case source text). Visual treatment is fine, but the content is provisional.
- **Accessibility standard not formally stated** (`PRODUCT.md:152–157`): Baseline exists (skip link, aria-live, focus-visible, prefers-reduced-motion, single h1, ES/EN parity) but no specific WCAG target is documented. The current implementation matches stated baselines.
- **No dark/light theme toggle** — system is dark-only by design (bg-base #030712). No theme switching UI exists; this appears intentional for the clinical/data-dense context.
- **Limited component coverage in tokens**: Frontmatter includes a small set of component token references (nav-btn, ctrl-btn, home-cta-primary/secondary). Many UI patterns (cards, inputs, badges) are implemented via CSS classes rather than tokenized component objects — this matches the incumbent vanilla CSS implementation.

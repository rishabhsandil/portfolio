# Aspire — Design System

**Project:** Aspire Career & Educational Services (rebrand of the former "ACES / Alpine
Career & Education Services", originally alpinestudy.com).
**Aesthetic:** Minimal + **corporate**, with a contemporary edge (reference: oztrekk.com).
Clean two-line headlines with an inline "explore" link, a wide rounded hero image, a
flanking-image trio, a career-field card grid, and a two-track services roadmap.
Geometric display sans + neutral body sans. NOT generic AI-slop.

> **LIVE SCOPE — client directive 2026-07-17 (overrides program/country lists below).**
> The site theme, layout and general aim are unchanged, but the **program list, nav menu and
> landing pages** show ONLY: **Medicine → Caribbean** (Saba/SUSOM, MUA/Nevis, St. Matthew's/SMUSOM);
> **Veterinary Science → Caribbean** (St. Matthew's/SMUSVM); **Law → United Kingdom** (The University
> of Law, England — placeholder pending law brochures). All other fields/countries were removed as
> work-in-progress ("add as we go"). Source of truth = brochures in `assets/pdfs/` (Medicine + Vet
> only; no Law brochure yet). Edit points: `components/header.html` mega-menu, `programs.html`
> `#by-field` grid + filters, `index.html` `#fields` cards, `js/main.js` (`UNI_DATA`, `typePhrases`,
> `countryLabels`), and `lp/{medicine-caribbean,veterinary-science-caribbean,law-uk}.html`.
> The 27 unauthorized `lp/` pages were deleted 2026-07-17 — `lp/` now holds only those three.
>
> **Added 2026-08-07:** 5 Western Community College (Surrey, BC — **Canada**) career programs —
> Health Care Assistant, Medical Laboratory Assistant, Registered Massage Therapy, Community
> Support Worker, Paralegal Studies. Nav group "Health & Community Care" (+ Paralegal under Law),
> `canada` re-added to filters/`countryLabels`/`UNI_DATA`, homepage `#fields`, apply form, and 5 new
> `lp/<slug>-canada.html` pages. LP style = **minimal like Ashford's, but Aspire's own theme/form**
> (per Shiv) — built on the existing Aspire lp template, not Ashford's green/gold.

**Positioning: Canadian-first (2026-07 pivot).** Aspire primarily serves **Canadian students**
choosing between studying **in Canada (domestic track)** or **abroad** (Australia, UK, Ireland,
plus the Caribbean for select fields). Copy should say "Canadian students" explicitly in hero,
meta, and footer messaging — this reverses the earlier "audience-neutral" rule. The **field-led
structure is retained** (start from the field, then find the country/institution) — this is a
repositioning of *audience*, not a reversal of the content model. **Exception:** the homepage H1
("Professional courses, globally.") is a fixed, client-given headline and was intentionally left
unchanged in this pivot — the "globally" framing there predates the Canadian-first rule; audience
context is carried by the eyebrow/sub copy around it instead.

**Content model is field-led, not location-led** (the 2026 pivot). Students start from the
*field* they want — Medicine, Nursing, Engineering, Computer Science & AI, Business, Data &
Analytics, Law, etc. — and the site maps each field to strong courses/universities. Four
abroad destinations (Australia, UK, Ireland) plus a Domestic (Canada) track are covered on the
Programs page (`programs.html`, formerly `study-abroad.html`) — "Best for …" per destination,
led by a "Program by Field" reverse-lookup (previously a secondary "quick guide", now the
page's primary structure, positioned right after the hero).

**"Program by Field" component** (`programs.html` `#by-field`) is a **filterable card grid**
(`.fx-*` classes; filter JS keyed on `#fieldGrid` in main.js) — the primary structure of the
Programs page. Each card = field → country/track name(s) + representative universities. Filter
chips: All fields · Canada · Australia · United Kingdom · Ireland · Caribbean (chip's `data-filter`
value stays `"canada"` internally — only the visible label was shortened from "Domestic (Canada)"
to plain "Canada", 2026-07). (No flag glyphs or country-code badges — emoji flags render as broken
region letters on Windows, and code badges read oddly; plain names only.)
**One card per field, even across multiple countries** — a field strong both in Canada and abroad
(AI & Computer Science, Environmental Science, Agriculture) gets **one card with multiple country
badges and a combined university list**, exactly like Medicine (UK+Caribbean), Veterinary Science
(Australia+Caribbean), Finance and Law (UK+Ireland) already do. An earlier version split these
three fields into duplicate-titled cards (one per country) specifically so the "Canada" filter
chip would never surface a non-Canadian school — that made the grid look buggy (two identical
card titles sitting side by side under "All fields") for a filtering nicety most visitors would
never notice. **Don't re-split multi-country fields into duplicate cards** — if the "shows a
foreign uni under the Canada filter" concern resurfaces, solve it a different way (e.g. re-order
`.fx-unis` so the matched-filter country's schools list first), not by duplicating the card.
**University data status — NEEDS CLIENT REVIEW before launch:**
- *Grounded* (from client references): **Australia** unis from OzTrekk's partner list; **Ireland**
  unis (UCC, Limerick, MTU, ATU) from KOM Consultants.
- *Proposed placeholders* (well-known fits, unverified against Aspire's actual partners):
  **Canada** (Waterloo, Toronto, UBC, Calgary, Guelph) and **UK** (Oxford, Imperial, Edinburgh,
  LSE, Warwick, Manchester). Swap these for real partner institutions when the client provides them.
- *Caribbean, added 2026-07 for Medicine/Veterinary Science pathways* (well-known real institutions
  in this niche, **not confirmed as Aspire partners**): **St. George's University** (Grenada, for
  Medicine) and **Ross University School of Veterinary Medicine** (St. Kitts, for Vet). Added
  *alongside* the existing UK (Medicine) / Australia (Vet) mappings, not replacing them — confirm
  with the client whether this should stay additive or become exclusive.
The on-page note ("Universities shown are representative…") keeps this honest until data is final.

**Programs mega-menu (`components/header.html`, 2026-07)** — the header's "Programs" nav item is
a genuine **Program → Field → Country → Colleges cascade**, not a flat link:
- The panel itself opens on **hover** (desktop, pure CSS `:hover`) or **tap** (mobile, `.mega-open`
  class toggled by `js/main.js`, same breakpoint — 900px — as the rest of the mobile nav).
- Inside the panel, **Fields are click-to-expand accordions** (`.mega-field-btn`), grouped under 4
  category headers (Health & Medicine / Tech & Engineering / Business & Law / Environmental &
  Agriculture) purely for scannability. Clicking a field reveals its Country links inline
  (`.mega-countries`, max-height transition) — this level is **click-driven on every device**,
  never hover, even on desktop, matching the client's literal spec ("you click them and then the
  countries pop up"). Only one field's countries stay open at a time.
- Clicking a Country navigates to `programs.html?field=<slug>&country=<code>` — **not** a
  standalone page per combination (would be 30-40+ pages to maintain); it deep-links into the
  existing Programs page.
- On load, `programs.html` reads those query params and shows a **direct result card**
  (`#fieldResult`, initially `hidden`) above the `#by-field` grid: the field name, the country,
  and — critically — **only the colleges tagged to that specific country**, not the field's full
  mixed-country list. This required tagging individual colleges with `data-country` inside each
  `.fx-card`'s `.fx-unis` (e.g. Medicine's Oxford/Imperial are `data-country="uk"`, St. George's is
  `data-country="caribbean"`) — don't add a college to `.fx-unis` without this attribute or it
  silently won't appear in anyone's direct result. The underlying `#by-field` grid stays as-is
  below the result card, for visitors who land on Programs directly rather than via the menu.
- An earlier version of this menu showed all 18 fields × all countries at once in a 4-column
  "everything visible" flyout — the client explicitly rejected that; the mechanic described above
  (hover opens the panel, click expands a field, click a country navigates) is the deliberate,
  confirmed design. Don't collapse it back into a single flat list.
- Mega-menu field/country data is **hand-duplicated from `#by-field`'s `.fx-card` data** (18
  fields, ~30 field+country pairs) since this is a static site with no templating — if `#by-field`
  gains/loses a field or country, `components/header.html`'s mega-menu needs the matching manual
  update, or the two will drift (same class of bug the shared-component refactor fixed for
  header/footer/notice, but not automatable here since the menu structure and the grid structure
  are genuinely different shapes).

**Brand/logo:** logo upgrade pending — for now a **text wordmark** ("Aspire." with an orange dot
+ "Career & Educational Services" sub-label), styled in `.wordmark` (see style.css). Old
`assets/brand/aces-logo*.png` images are no longer referenced.

**Palette (unchanged from the logo):** petrol **teal `#04758F`** + vivid **orange `#F7931E`**.
Teal = primary/dark (headings, dark sections, footer, active states, accent words); orange =
accent (CTAs, indices, underlines, wordmark dot).

**Contact/email:** placeholder `info@acesglobal.ca` used across pages + submit.php — **replace
with the real client mailbox once confirmed.** Phone/address are the original real data.

**Distinct from the sister brand `../ashford/`** (Ashford Career College, same client) which is
green + gold + Playfair. Aspire = teal + orange, Space Grotesk + Inter, corporate career-led layout.

## Performance / scrolling
- **Native scrolling only.** No smooth-scroll library (Lenis was removed — it fought native
  scroll and felt sluggish). Wheel/trackpad scrolling is the browser's own. Anchor links use
  a lightweight `window.scrollTo({behavior:'smooth'})` with a nav offset.
- The hero is **never gated behind a JS reveal** — its image and text are always rendered and
  only fade in via a CSS load animation, so the hero can't disappear if scripts hiccup.
- Below-the-fold reveals use IntersectionObserver with a fail-safe that shows everything if the
  observer is unavailable or errors. `prefers-reduced-motion` disables all motion.

## Color palette (from the logo)
| Token            | Hex       | Use |
|------------------|-----------|-----|
| `--paper`        | #F6F3EB   | Page background (soft warm off-white) |
| `--paper-2`      | #FCFAF3   | Raised surfaces / alt sections |
| `--paper-3`      | #EAE5D6   | Inactive tabs, subtle fills |
| `--ink`          | #0C2E37   | Headings & strong text (deep petrol) |
| `--ink-2`        | #073640   | Dark sections & footer (brand teal-dark) |
| `--teal`         | #04758F   | **Brand primary** — eyebrows, active tab, icons, links |
| `--orange`       | #F7931E   | **Brand accent** — CTAs, indices, underlines, ◆ |
| `--orange-soft`  | #F8A845   | Accents on dark sections |
| `--teal-light`   | #9CC4CE   | Labels/captions on dark |
| `--muted`        | #5A6669   | Secondary text |
| `--line`         | #E4DECF   | Hairlines |
| `--cream-on-dark`| #EFEADC   | Text on dark sections |

## Typography
- **Display / headings:** Space Grotesk (geometric, corporate-with-flair). Weights 500–700.
  It has **no italic** — accent words (`.it`) are rendered as a **teal colour hit**, not italic
  (e.g. "Study for the <span teal>career</span> you want").
- **Body / UI:** Inter (300–600).
- **Eyebrow:** Inter 12px, uppercase, `letter-spacing:.22em`, teal, leading orange dash.
- The `--serif` CSS token now points at Space Grotesk (kept under the old name so existing
  references resolve); `--display` is an explicit alias.
- Fluid scale via `clamp()`. Body line-height 1.7, line-length ~66ch.

## Layout & components
Deliberately **conventional/corporate** (client feedback: the earlier editorial layout felt
too "design-magazine" for the business). Standard patterns, not offset editorial ones.
- Container 1180px (wide 1300px); section rhythm `clamp(72px,11vw,148px)`; 4px base unit.
- **Hero (`.hero`):** standard full-width background photo (`hero-campus.jpg`) + dark
  left-to-right gradient, left-aligned headline + sub + two CTAs + a field-chip row. Nav sits on
  top with `class="nav on-dark"` (light until `.scrolled`). *(Replaced the old offset split hero.)*
- **About:** standard image-left / text-right `.split` (`advising.jpg`). *(Replaced the flanking trio.)*
- **Services roadmap:** "How We Help" — replaced the old vertical-tab "What we offer" image+text
  selector (2026-07). Two `.track-toggle` pill buttons ("Studying Abroad" / "Studying in Canada")
  swap a `.track-panel` built as `.rm-grid` (two columns): **left** `.rm-labels` — 5 milestones,
  each a solid-filled orange `.rm-ic` icon circle + title + description (client wanted solid
  icons, not outlined); **right** `.rm-road` — the actual Ashford "Journey to Excellence" road
  illustration (`assets/images/roadmap-road.png`, copied from `../ashford/` — same client, shared
  asset, real hand-crafted art per client preference, not a generated SVG substitute), with 5
  solid-teal `.rm-pin` circles positioned by hand-tuned `top`/`left` percentages along its curve
  (`.rm-pin--1` through `--5`, bottom-left → top-right, extending Ashford's original 3-stop
  placement to 5). Collapses to a single column on mobile (`max-width:900px`), road stacked below
  the list at `max-width:340px`. Same underlying `[data-tabs]`/`[data-panel]` JS as the old tabs,
  just generalized (`.o-panel` → `[data-panel]`). The old dark 5-step "PROCESS" section
  (Discover → Shortlist → Apply → Fund & secure → Depart) was removed as redundant once this
  landed — don't re-add both. NB: if the road's curve changes (different crop/asset), the 5 pin
  percentages need re-tuning by eye against the new image — they aren't computed from the art.
- **Fields of study:** icon card grid (`.cards .field-card`) — the career-led entry point.
- **Stats:** oversized Space Grotesk numerals with a top hairline (count up on view).
- **Country cards** (career-framed "Best for"), **steps** (dark process, **no** topo line art now),
  **dark CTA band** (`graduates.jpg`), footer.
- Interior pages keep the two-column `.page-head` header (headline + crumb left, lead right).
- **Mobile sticky action bar (`.mobile-bar`):** shown ≤768px only — intent-based quick actions
  (Call · Explore · Message · **Apply** accent). Fixed to the bottom with iOS safe-area padding;
  hides while the full-screen menu is open (`body:has(.nav-links.open)`). Body gets bottom padding
  so content clears it. NB: verify mobile layout with a real 390px viewport (CDP
  `Emulation.setDeviceMetricsOverride`), not headless `--window-size`, which renders at the wrong
  CSS viewport and can look falsely clipped.
- **`services.html`** was restructured (2026-07) to match the homepage roadmap's two-track model
  instead of a flat 6-service list: a `.track-toggle`/`.track-panel` pair (same `[data-tabs]` JS
  as the homepage) wraps two sets of 5 numbered deep-dive sections (`.split`/`.idx`/`.pill-tags`,
  the original per-service format, kept — just re-organized), one set per track. IDs are prefixed
  `abroad-*` / `domestic-*` (e.g. `#abroad-guidance`, `#domestic-funding`) since both tracks reuse
  the same 3 step names (Career Guidance, School Match(ing), Application) — sitewide footer
  "Services" links only point at the default-visible `abroad-*` anchors, since the `domestic-*`
  panel is `display:none` until toggled and a cross-page anchor can't trigger that toggle. The old
  flat IDs (`#counselling`, `#applications`, `#visa`, `#scholarships`, `#pre-departure`,
  `#accommodation`) no longer exist — Accommodation's content was folded into Pre-Departure
  Services (abroad) / Support Until Day 1 (domestic) rather than kept as a standalone 6th step,
  matching the client's 5-step-per-track spec exactly.
- `programs.html` is **field-first only, single pivot** (2026-07 cleanup): hero → `#by-field`
  grid → compare panel → CTA. It briefly had a country-tile "quick picker" above the grid (Canada
  /Australia/UK/Ireland photo tiles that pre-filtered the grid on click) and, before that, four
  full country deep-dive sections (`#domestic`/`#australia`/`#uk`/`#ireland`, each with its own
  "Best for" pill-tag list) — both were removed. The deep-dive sections duplicated the grid's own
  field→country data in a heavier format; the tile picker, even though it only filtered the same
  grid, still visually put country selection *before* field selection, which fights the site's
  field-led model. **Country now only ever appears as a filter chip inside `#by-field`** — never
  as a first-class entry point above or before it. Don't reintroduce a country-first section here;
  if destinations need more visual presence, it belongs on a future distinct page, not this one.
  (`.country`/`.country-grid` CSS was removed as dead code along with this — if destination tiles
  come back, they'll need rebuilding, not reactivating old rules.)
- Radius: images/cards **10–14px** (tightened from 16–22 for a corporate feel), pills 999px.
- **Imagery:** professional education stock from **Unsplash** (free commercial licence). Alpine
  photos (mountains/summit/peaks/lake/forest) were dropped as off-brand. Key files:
  `hero-campus.jpg`, `advising.jpg`, `graduates.jpg`; country skylines retained.

## Pages
Home · About · Services · Programs (Domestic-Canada/Australia/UK/Ireland/Caribbean) · Apply ·
Contact. `programs.html` was renamed from `study-abroad.html` in 2026-07 — check for any stray
`study-abroad.html` links if content is copied from an old backup/export.
Shared `css/style.css` + `js/main.js`. Static HTML, no build step, no external JS libraries.
Stock imagery in `assets/images/` (Unsplash). References in `temp-files/`.

## Shared components (notice / header / footer)
**2026-07:** the important-notice modal, nav header, and footer+mobile-bar were previously
copy-pasted into all 6 pages — this drifted (stale footer tagline on one page, mismatched colors,
inconsistent aria-labels) and became a maintenance risk. Extracted into `components/notice.html`,
`components/header.html`, `components/footer.html` (raw fragments, no `<html>`/`<body>` wrapper),
matching the same pattern already used on the sister site `../ashford/components/`. Each page now
has three placeholders instead of the inlined markup:
```html
<div data-include="components/notice.html"></div>
<div data-include="components/header.html"></div>
...page content...
<div data-include="components/footer.html"></div>
```
`js/main.js`'s `loadComponents()` fetches each `[data-include]` fragment and swaps it in via
`el.outerHTML`, recursing in case a fragment ever nests another include. **All other init logic
(nav scroll state, mobile menu, notice modal, scroll reveal, tabs, filters, forms, footer year)
now runs inside `loadComponents().then(...)`**, since it depends on the injected header/footer
existing in the DOM — don't move code back outside that `.then()` without checking it doesn't
touch `.nav`, `.nav-links`, `#notice`, `.mobile-bar`, or `[data-year]`.

**Requires a real HTTP server** — `fetch()` can't load local files over `file://` due to CORS, so
opening a page directly by double-clicking it won't render the header/footer. Test with
`python3 -m http.server` (or any static server) from the `aces/` directory, not by opening the
`.html` file directly.

**No more `class="active"` in the header markup** — the shared header is now identical on every
page, so `initActiveNav()` in `main.js` adds `.active` to whichever `.nav-links a` matches
`location.pathname`'s filename at runtime. If a new nav link is added, no per-page edits are
needed — it "just works" as long as the `href` matches the filename.

**Editing header/footer content**: change the one file in `components/`, not each page. The nav
links, footer columns, and mobile-bar are single-sourced now — the drift bugs this replaced
(stale tagline, `--clay-soft` vs `--orange-soft`, `.container` vs `.container wide`, mismatched
`rgba()` address color) can't recur structurally, only by editing the wrong copy of a value that
no longer exists.

## Contact
Phone (604) 316-8015 (real) · info@acesglobal.ca (**placeholder — confirm**) ·
6638 152A St unit 109, Surrey, BC V3X 7J1 (real)

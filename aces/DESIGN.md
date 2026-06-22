# ACES — Design System

**Project:** Alpine Career & Education Services — redesign of alpinestudy.com.
**Aesthetic:** Editorial "altitude." Light, airy, magazine-grade layout that follows the
**Armonia Excursions reference** in `temp-files/` — a big two-line headline with an inline
"explore" link, a wide rounded hero image, a flanking-image trio, and a vertical-tab service
selector. Characterful serif display + clean grotesque body. NOT generic AI-slop.

**Palette is derived from the official ACES logo** (`assets/brand/aces-logo.png`,
pulled from alpinestudy.com): petrol **teal `#04758F`** + vivid **orange `#F7931E`**. Teal is
the primary/dark brand colour (headings, dark sections, footer, active states); orange is the
accent (CTAs, indices, underlines, highlights). The real logo is used in the nav (full colour)
and footer (white variant).

**Distinct from the sister brand `../ashford/`** (Ashford Career College, same client) which is
green + gold + Playfair. ACES = teal + orange logo palette, Fraunces + Hanken Grotesk, Armonia
editorial layout.

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
- **Display / headings:** Fraunces (optical, soft high-contrast serif). Italic used for accent
  words (e.g. "Your *ascent*…", "clarity *& care*").
- **Body / UI:** Hanken Grotesk (300–600).
- **Eyebrow:** Hanken 12px, uppercase, `letter-spacing:.2em`, rust-amber, leading ◆.
- Fluid scale via `clamp()`. Body line-height 1.7, line-length ~66ch.

## Layout & components
- Container 1180px (wide 1300px); section rhythm `clamp(72px,11vw,148px)`; 4px base unit.
- **Hero:** full-bleed alpine image, dark warm gradient, bottom-left headline + CTAs + scroll cue.
- **Trio:** centered intro flanked by two tall rounded images.
- **Vertical tabs:** "What we offer" — stacked tab list (active = ink fill) swaps an image+text panel.
- **Stats:** oversized Fraunces numerals on paper with a top hairline (count up on view).
- **Country cards, index list, steps, testimonial, dark CTA band, footer.**
- Every interior page repeats the Armonia two-column header (`.page-head > .hero-head`):
  big headline + crumb on the left, descriptive lead on the right.
- Services (6) and countries (4) live as in-page anchor sections (`services.html#counselling`,
  `study-abroad.html#canada`, …), not separate pages, mirroring the source site's content.
- Radius: images/cards 16–22px, pills 999px. Soft warm shadows only. SVG icons (no emoji).

## Pages
Home · About · Services · Study Abroad (Canada/Australia/UK/Ireland) · Apply · Contact.
Shared `css/style.css` + `js/main.js`. Static HTML, no build step, no external JS libraries.
Stock imagery in `assets/images/` (Unsplash). References in `temp-files/`.

## Contact (real data from source site)
Phone (604) 316-8015 · info@alpinestudy.com · 6638 152A St unit 109, Surrey, BC V3X 7J1

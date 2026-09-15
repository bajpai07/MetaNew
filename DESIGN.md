# Aiyaashi — Design System

*Aiyaashi* (आयाशी / عیاشی) — indulgence, decadence, opulent pleasure.
The brief: **quiet, expensive indulgence.** Restraint of an Italian house, not a wedding card.

---

## 0. Calibration

Measured against SSENSE, Jacquemus, Bottega Veneta, The Row, Aesop. What those
share, and what this system takes from them:

- UI chrome is **tiny** relative to imagery. Nav type is 11–15px on a 100vh hero.
- Negative space is the loudest element. A single product sits in acres of ground.
- Transitions are **slow** — 600ms–1.2s, never bouncy, never spring.
- Almost no icons. Words do the work. No badges, no pills, no shadows.
- Grids are asymmetric and left-aligned. Nothing is centered "for balance".

What this codebase cannot borrow: all five depend on *tightly art-directed
photography*. Aiyaashi's core feature is a stranger's phone camera. That
constraint drives the single biggest decision in this system (§5).

---

## 1. Colour

Six values. Ink and paper, one indulgent accent.

| Token | Hex | Role |
|---|---|---|
| `--ink` | `#14110F` | Ground. Warm near-black (sumi/walnut), never blue-black. |
| `--ink-raised` | `#1C1815` | Raised surface on ink. Used sparingly — inputs, drawer. |
| `--bone` | `#EDE7DE` | Paper. Primary text on ink; ground on inverted surfaces. |
| `--ash` | `#8F857A` | Secondary text. Warm grey, reads at 4.6:1 on ink. |
| `--oxblood` | `#5E1A22` | The single accent. Deep, muted, inherited from Indian lac/kumkum. |
| `--veil` | `rgba(237,231,222,0.10)` | Hairlines. 1px, never 2px, never a border-radius. |

**Rules that make it Aiyaashi rather than generic:**

1. **Oxblood is never text.** It appears only as a filled surface or a 1px rule.
   Colour-as-text is where "one accent colour" designs go wrong — an accent
   headline or accent label reads as a template. Bone on oxblood = 10.6:1.
2. **No success green, no warning amber.** The old `#4ade80` is deleted app-wide.
   State is carried typographically — a hairline rule, a word, a change of weight.
   Nothing in a luxury interior is lime.
3. **No gradients, no glows, no shadows.** Every `linear-gradient` button,
   `blur-[80px]` glow and `box-shadow` in the codebase is removed. Depth comes
   from hairlines and the mat (§5), never from a drop shadow.
4. **The inversion.** Ink-on-bone (paper) is used for exactly one context:
   the transaction surfaces — checkout, order confirmation, order history,
   admin. *The showroom is dark; the paperwork is on paper.* This is a rule,
   not a decoration, and it gives the utilitarian screens somewhere to live
   instead of looking bolted on.

---

## 2. Typography

**Display — Bodoni Moda** (variable, optical size axis).
A true Didone: extreme thick/thin contrast, vertical stress, unbracketed
hairline serifs. Fashion-magazine by lineage. Explicitly *not* Playfair.

> **Hard rule:** Bodoni never appears below 20px and never below weight 500 on
> the ink ground. Didone hairlines vanish against dark at small sizes — that is
> the single most common way this typeface is misused.

**Body / UI — Instrument Sans.**
A neutral grotesk in the Söhne / Neue Montreal register. Functions as a caption
font: quiet, unremarkable, never competes.
Fallback: `-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`.

### Scale

| Token | Size | Use |
|---|---|---|
| `--t-display` | `clamp(52px, 15vw, 132px)` | Hero headline only. Once per site. |
| `--t-xl` | `clamp(30px, 7vw, 52px)` | Section openers, product name on PDP |
| `--t-l` | `clamp(22px, 5vw, 30px)` | Sub-headings, totals |
| `--t-m` | `17px` | Lead paragraphs |
| `--t-body` | `15px` / 1.65 | Body |
| `--t-s` | `13px` | Secondary, meta |
| `--t-xs` | `11px` / `0.18em` | Nav, labels, buttons — **used sparingly** |

`--t-xs` tracked caps is the one pattern most likely to degrade into the
"tracked-out ALL-CAPS eyebrow above every heading" failure. It is permitted on:
nav items, button labels, and the museum caption in the mat. It is **banned**
above headings. No section on this site has an eyebrow.

### Wordmark

```
A I Y A A S H I
```

Bodoni Moda · 500 · `letter-spacing: 0.34em` · uppercase · `margin-right: -0.34em`
(trailing letterspace trimmed so it optically aligns left/centre).

The doubled `AA` at the heart of the word is the distinguishing feature — wide
tracking exposes it rather than hiding it. Set at 15px in the navbar (chrome
stays tiny), 28px on auth. Never coloured, never on a gradient, never with a
rule under it. The logotype is quiet because the mat (§5) is the loud thing.

---

## 3. Layout

Left-aligned, asymmetric, mobile-first (this ships to Play Store).
Gutter: `20px` mobile / `40px` ≥768 / `64px` ≥1200. Max content width 1440.

### Home — two concepts built and judged

**Concept A — "The Plate."** Full-bleed oversized try-on photograph, ~78vh,
headline set low-left overlapping the image edge, one underlined text link.

```
┌──────────────────────────────────────┐
│ AIYAASHI              Search   Bag   │
├──────────────────────────────────────┤
│                                      │
│         [ enormous photograph ]      │
│                                      │
│  Indulgence,                         │
│  on approval.                        │
│  ─────────────                       │
└──────────────────────────────────────┘
```

**Concept B — "The Ledger."** Type-driven. No hero photograph above the fold.
Headline occupies the top 60% left, enormous void right. A single hairline.
A narrow vertical strip of a try-on photo bleeds down the right edge at 22%
width, cropped to fabric and shoulder — texture, not a face. Below the fold the
collection begins immediately, its first row bleeding off the right edge.

```
┌──────────────────────────────────────┐
│ AIYAASHI              Search   Bag  ▓│
│                                     ▓│
│  Indulgence,                        ▓│  ← 22% photo strip,
│  on approval.                       ▓│    bleeds off edge
│                                     ▓│
│  Upload one photograph. See any     ▓│
│  piece worn on your own body.       ▓│
│                                     ▓│
│  Browse the collection              ▓│
│  ─────────────────────              ▓│
├──────────────────────────────────────┤
│  Twelve pieces                       │
│  ┌────┐ ┌────┐ ┌────┐ ┌───           │
│  │    │ │    │ │    │ │       ← cut  │
└──────────────────────────────────────┘
```

**Verdict: B ships.** A is the more familiar beautiful thing, and that is
exactly its problem — it is what every fashion site does, and it succeeds or
fails entirely on the quality of one photograph. This app has no art direction;
its hero image is stock. A big stock photo under a serif headline *is* the
"nice React template" failure the brief names. B carries on type, needs no
photography, and the tightly-cropped strip reads as texture at any source
quality — it solves the project's actual constraint instead of ignoring it.

### Product page

Full-bleed image (3:4). Info block left-aligned at gutter with a deep right
margin so the measure stays ~34em. Sizes as a row of plain text with a hairline
under the selected one — not filled rounded squares. Details as hairline-ruled
rows. Two actions in the sticky bar, never three.

### The Fitting Room (try-on)

The mat (§5) is the entire screen. Everything else is a caption.

---

## 4. Motion

One orchestrated moment, and nothing else moves.

**The moment: the reveal.** When a try-on result returns, it does not fade in.
It is *wiped* down the aperture — `clip-path: inset()` animating top→bottom over
**1100ms** on `cubic-bezier(0.16, 1, 0.3, 1)`, the way a print comes up in a
tray. It happens once per generation and it is the only thing on the site that
asks to be watched.

| Token | Value | Use |
|---|---|---|
| `--d-micro` | `240ms` | Hover, focus, press |
| `--d-state` | `600ms` | Enter / exit |
| `--d-reveal` | `1100ms` | The wipe. Once. |
| `--ease-drape` | `cubic-bezier(0.16, 1, 0.3, 1)` | Everything |

Deleted: fade-up-on-scroll on every section, hover-lift on every card,
staggered per-card entrance delays, spring physics, the pulsing "IN STOCK" dot,
the rotating dual-ring spinner, the five-stage progress dots.
`prefers-reduced-motion` collapses every duration to `0.01ms` and the wipe to a
cut.

---

## 5. Imagery — the mat *(the one memorable decision)*

**The problem.** Every reference site is carried by art direction. Aiyaashi's
core feature is a customer's own phone photo — backlit, cluttered, grainy, taken
in a bathroom. Put that next to an editorial product grid and the luxury
illusion collapses in one frame. This is the largest risk in the brief.

**The answer: present it, don't fix it.** Every user photograph, everywhere it
appears, is mounted the way a gallery mounts a print.

```
┌─────────────────────────┐
│ ▒▒▒▒▒▒ bone mat ▒▒▒▒▒▒▒ │  20px
│ ▒ ┌───────────────┐ ▒▒▒ │
│ ▒ │               │ ▒▒▒ │
│ ▒ │   aperture    │ ▒▒▒ │  fixed 3:4
│ ▒ │     3 : 4     │ ▒▒▒ │
│ ▒ │               │ ▒▒▒ │
│ ▒ └───────────────┘ ▒▒▒ │
│ ▒   Your photograph  ▒▒ │  34px — deeper bottom
└─────────────────────────┘     margin, gallery convention
```

Three components, applied as one primitive (`<Plate>`), identically in every
state — upload preview, processing, result, saved look, modal:

1. **The grade.** `saturate(.82) contrast(1.06) brightness(.98) sepia(.06)` —
   pulls every source toward one warm, slightly-desaturated tonal family, so a
   fluorescent bathroom and a studio softbox land in the same key.
2. **The vignette.** A radial gradient overlay drawing the corners toward ink.
   Kills cluttered backgrounds and forces the eye to the centre — which is where
   the garment is.
3. **The mat.** Bone board, asymmetric margins (deeper at the bottom), 3:4
   aperture, with a museum caption set in `--t-xs` on the bottom margin.

Why it works: the mat is a **frame of authority**. A mediocre photograph inside
a gallery mat reads as *presented*, not as *bad* — the mounting asserts that
someone chose to show it. And because merchandise photography is already
art-directed, product shots deliberately do **not** get the mat. Your photograph
is framed; the goods are not. That distinction is the identity.

Everything else on the site stays quiet so this can be the loud thing.

---

## 6. Iconography

No icon library. Lucide/Heroicons/Feather shipped as-is is the fastest tell of a
templated build, and luxury interfaces use a fraction of the icons SaaS does.

**Deleted:** the search magnifier, the cart heart, the four filled/outline pairs
in the mobile tab bar, the wishlist ♡/♥, the emoji in delivery and returns rows
(🚚 ⚡ 📦 ↩ ✓ 💳), the trust-badge emoji row, the 🔒 padlock, every ✦ and ✨,
the admin sidebar's 📊 📦 🛒.

**Kept**, redrawn by hand at `stroke-width: 1` to match the body face's stem:
the drawer rule-stack, the back arrow, the close cross. Three marks total.

**Everything else is a word.** The mobile tab bar is four tracked text labels.
Wishlist is the word `Save` / `Saved`. Search is the word `Search`.

---

## 7. Voice

Confident, spare, no exclamation marks, no SaaS phrasing. Vocabulary is locked
end to end: if the button says *Add to bag*, the toast says *Added to bag* —
never "Item added successfully".

| Instead of | Write |
|---|---|
| Welcome back! | Sign in |
| Get Started! / SIGN UP | Create account |
| Login successful! | Signed in |
| Registration successful! Please login. | Account created. Sign in to continue. |
| ✦ GENERATE MY LOOK ✨ | See it on you |
| ✦ TRY ANOTHER LOOK | Try another piece |
| PROCESS ORDER → | Continue to checkout |
| Order Placed Successfully! | Your order is placed |
| Amazing product description here | *(real copy, per product)* |
| No products found | Nothing matches that search |
| No saved looks yet ✨ | You haven't saved a look yet |
| METASHOP AI | AIYAASHI |

"Cart" is never used in copy. It is a **bag**.
The try-on surface is **the Fitting Room**. Its output is a **look**.

---

## 8. Quality bar

- Mobile is primary, not a breakpoint. 375px is the design width.
- Every interactive element has a visible `:focus-visible` ring in bone.
- Body text ≥ 4.5:1: bone/ink 14.9:1, ash/ink 4.6:1, bone/oxblood 10.6:1.
- `prefers-reduced-motion` honoured globally.
- Tap targets ≥ 44px.
- Behaviour is untouched — this is a visual layer. No route, model, API call,
  or business rule changes.

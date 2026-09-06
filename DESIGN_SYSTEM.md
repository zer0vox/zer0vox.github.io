# Design System — greenhueblues

> Hand this file to Claude Code. It is the single source of truth for the site's
> visual language. When building or editing UI, match these tokens and patterns
> exactly. Do **not** introduce new colors, fonts, spacing values, or radii that
> aren't defined here — extend the system on purpose, not by accident.

The canonical token definitions live in [`src/index.css`](src/index.css) under `:root`.
This document explains how to *use* them. If the two ever disagree, `index.css` wins —
update this doc to match.

---

## 1. Design principles

The aesthetic is **dark, minimal, editorial, sacred-geometry**. Keep these in mind:

- **Dark-first.** Near-black background (`#0d0d0d`), white text, one cool accent.
- **Restraint over decoration.** Whitespace, hairline borders, and typography do
  the work. Color is used sparingly and never as a coat of paint.
- **Big type, tight tracking.** Display headings are large with negative
  letter-spacing and short line-height. Body stays calm and readable.
- **Motion is a whisper.** Slow easing, low opacity, `prefers-reduced-motion`
  respected. Nothing "announces itself."
- **Monospace for meta.** Labels, dates, eyebrows, tags → mono, uppercase, wide
  tracking. This is the recurring "system" texture.

---

## 2. Color

Defined as CSS variables in `:root`. **Always reference the variable, never the raw hex.**

| Token | Value | Use for |
|---|---|---|
| `--bg` | `#0d0d0d` | Page background, solid card fills |
| `--fg` | `#ffffff` | Primary text |
| `--fg-mute` | `rgba(255,255,255,0.7)` | Secondary text, body copy in sections |
| `--fg-dim` | `rgba(255,255,255,0.5)` | Tertiary text: captions, meta, categories |
| `--line` | `rgba(255,255,255,0.15)` | Borders, dividers, table rules |
| `--accent` | `#a8c7ff` (periwinkle) | Links on hover, active states, key emphasis, primary buttons |

**Rules**
- The accent is a **cool periwinkle**. Never swap it for a warm/brand-y color.
- For accent tints (hover fills, subtle panels) use `rgba(168,199,255, α)`:
  `0.03`–`0.05` for hover fills, `0.08`–`0.12` for active/selected, `0.5` for input borders.
- Section backgrounds are the same near-black but at varying alpha to let the
  fixed background glow through: `rgba(13,13,13, 0.45 → 0.7)`. Blog/leaders/playground
  use solid `#0d0d0d`.
- Panel/hero decorative gradients (the green/blue/sunset panels) are **art**, not
  UI tokens. Don't reuse them for buttons, cards, or text.

### Tailwind mapping
When writing utility classes, these map to the tokens:
- `bg-black` → `--bg` context · `text-white` → `--fg`
- `text-white/70` → `--fg-mute` · `text-white/50` → `--fg-dim`
- `border-white/15` → `--line`
- accent → use the CSS var directly (`text-[var(--accent)]`) or `text-[#a8c7ff]`.

---

## 3. Typography

Three families, loaded from Google Fonts in `index.css`:

| Var | Family | Role |
|---|---|---|
| `--sans` | **Inter** (400–800) | Everything by default — UI, headings, body |
| `--mono` | **Fragment Mono** | Meta: labels, eyebrows, dates, tags, table headers |
| `--script` | **Caveat** (500/700) | Rare expressive display accents only (panel scripts) |

### Type scale (fluid, defined as vars)

| Var | `clamp(...)` | Use |
|---|---|---|
| `--huge` | `clamp(44px, 7.2vw, 112px)` | CTA / footer word |
| `--display` | `clamp(40px, 5vw, 70px)` | Section `h2` (Work, Index, Blog, Leaders) |
| `--hero-size` | `clamp(22px, 2.8vw, 40px)` | Hero `h1` (deliberately *not* huge) |
| `--body` | `18px` | Base body size |

Other recurring sizes (hardcoded where used, kept consistent): `28px` brand,
`13px` mono labels, `11–12px` uppercase eyebrows/tags.

### Weights & tracking
- Display headings: `font-weight: 500`, `letter-spacing: -0.035em`, `line-height: 1`.
- Hero `h1`: `font-weight: 400`, `letter-spacing: -0.04em`, color `--accent`.
- Huge/CTA: `font-weight: 500–700`, `letter-spacing: -0.045em to -0.05em`.
- Body: `font-weight: 400–500`, `line-height: 1.2` default, `1.5` for reading copy.
- **Mono meta pattern** (reuse verbatim): `font-family: var(--mono); font-size: 11–13px;
  letter-spacing: .12em–.16em; text-transform: uppercase; color: var(--fg-dim);`

Line length for reading copy: cap at `52ch` (blog sub) to `22ch` (hero) via `max-width`.
Use `text-wrap: balance` on large headings.

---

## 4. Spacing & layout

| Var | Value | Meaning |
|---|---|---|
| `--max` | `1600px` | Max content width (see note) |
| `--pad-x` | `16px` | Horizontal page padding |
| `--section-y` | `clamp(80px, 10vw, 160px)` | Vertical rhythm between sections |

- Density modifiers exist: `[data-density="compact"]` and `[data-density="airy"]`
  rescale `--section-y`. Honor them if present on an ancestor.
- **Container:** `.wrap { max-width: var(--max); margin-inline: auto; padding-inline: var(--pad-x); }`
  Use `.wrap` (or replicate it) for every full-width section's inner content.
- **Grid gaps:** standard content gap is `24px`–`32px`. Card grids use `32px`.
- Spacing values in use cluster around a loose scale: `4, 6, 8, 10, 14, 16, 18,
  22, 24, 32, 48, 56`. Prefer these; don't invent `13px` or `27px` gaps.

> **⚠️ Known inconsistency:** JSX components (e.g. `Navbar`, `WorkGrid`) use Tailwind's
> `max-w-7xl` (1280px), while `index.css` uses `--max: 1600px`. **Pick one and stick
> to it per surface.** For new work matching the CSS-driven sections, use `--max`.
> For work matching the Tailwind components, use `max-w-7xl`. When in doubt, ask.

---

## 5. Radii, borders, shadows

- **Radii:** `4px` (inputs, small buttons), `6px` (tags, chips), `8px` (cards/tables),
  `999px` (pills). Decorative thumbs are often **square** (no radius) — that's intentional.
- **Borders:** hairline `1px solid var(--line)`. Dashed `1px dashed rgba(255,255,255,.22)`
  for placeholder/tag chips only.
- **Shadows:** used sparingly. Text over gradient panels: `text-shadow: 0 2px 24px rgba(0,0,0,.55)`.
  Avoid heavy box-shadows on flat UI.
- **Focus:** always visible — `outline: 2px solid var(--accent); outline-offset: 2px;`
  Never remove focus outlines without an equivalent replacement.

---

## 6. Motion

| Var | Value |
|---|---|
| `--ease` | `cubic-bezier(.2, .7, .2, 1)` |

- Default transition: `.25s var(--ease)`. Hover feedback `.2–.35s`. Entrances `.9–1s`.
- Link hover: `opacity: 0.7`. Card hover: image `scale(1.02→1.06)` + `brightness(.85)`,
  reveal pill/label.
- Row hover (tables): `background: rgba(255,255,255,.04)` + slight `padding-left` shift.
- **Always** guard decorative animation with
  `@media (prefers-reduced-motion: reduce)` — provide a calm static fallback, don't
  just hide the element.

---

## 7. Components (reference patterns)

Copy these patterns rather than reinventing. Full source in `src/index.css`.

### Button — primary
```html
<button class="pg-btn">Play</button>
```
```css
background: var(--accent); color: #0d0d0d; border: none;
padding: 11px 28px; border-radius: 4px; font-weight: 600; font-size: 15px;
transition: opacity .2s var(--ease), transform .2s var(--ease);
/* :hover  { opacity:.85; transform: scale(1.04); }
   :active { transform: scale(.97); } */
```

### Button — ghost
```css
background: transparent; color: var(--accent); border: 1px solid var(--accent);
/* :hover { background: rgba(168,199,255,.1); } */
```

### Input
```css
padding: 10px 12px; background: rgba(255,255,255,.08);
border: 1px solid rgba(168,199,255,.5); border-radius: 4px; color: var(--fg);
/* :focus { outline:none; border-color: var(--accent); background: rgba(168,199,255,.12); }
   ::placeholder { color: var(--fg-dim); } */
```

### Pill / chip
```css
border-radius: 999px; border: 1px solid rgba(255,255,255,.15);
padding: 14px 24px; background: #0d0d0d;
```

### Eyebrow / tag / meta label (the "system" texture)
```css
font-family: var(--mono); font-size: 11px; letter-spacing: .15em;
text-transform: uppercase; color: var(--fg-dim);
```

### Card (Work grid)
- Thumb: `aspect-ratio: 4/3`, `border: 1px solid var(--line)`, `background: #15171b`,
  hover scales image + reveals a centered pill.
- Meta row: title `clamp(20px,1.7vw,26px)` weight 500, client/category/year in `--fg-dim`.

### Table / index row
- `border-top`/`border-bottom: 1px solid var(--line)`, grid columns, `22px` vertical
  padding, hover tint + left-pad shift. See `.index-row` and `.leader-row`.

### Nav
- `position: fixed`, transparent bg (or `bg-black/30`), `22px` vertical padding.
- 3-col grid: brand · center links · right action. Links hover to `opacity .7`.
- Collapses below `810px` (hides center `ul`).

### Loader (liquid chrome blob)
`<LiquidLoader show label />` — the one loading state on the site. Full-bleed
`--bg` cover at `z-index: 300`, holding a morphing chrome blob over the nav
wordmark and a mono caption naming what is being waited on.

- **Material:** the same one as the contact band — near-black body, three
  screen-blended specular layers, `contrast(132%) saturate(118%)`. Do not give
  it a palette of its own; retune it with `.cta-chrome` or not at all.
- **Timing:** loop lengths are φ multiples (`3.82s / 6.18s / 10s / 16.18s`) so
  the layers never resynchronise. Keep new ones on that series.
- **Entry:** an interruptible `opacity` **transition** with a `.14s` delay, never
  a keyframed fade — a wait that resolves inside the delay must not paint, and
  one that resolves mid-fade has to reverse from where it got to.
- Used at three points: the pre-React boot (a standalone copy of the CSS lives
  inline in `index.html`, since it paints before any stylesheet), the lazy-route
  `Suspense` fallback in `App.jsx`, and the About hero's four photographic
  layers in `AboutHero.jsx`. Anything else that makes a visitor wait should use
  it too rather than growing a second loading idiom.

### Section shell
```html
<section class="my-section">
  <div class="wrap">
    <h2><!-- --display size --></h2>
    ...
  </div>
</section>
```
```css
.my-section { background: rgba(13,13,13,.5); padding-block: var(--section-y); position: relative; z-index: 1; }
```

---

## 8. Responsive breakpoints

The CSS uses: `900px`, `810px`, `768px`, `600px`, `480px`, `360px`.
Tailwind components use `sm`/`md`/`lg`. **Primary layout break is ~810px** (nav
collapses, grids go single-column). Test at 360, 480, 810, and ≥1280.

---

## 9. Accessibility (non-negotiable)

- Maintain visible focus (`--accent` outline).
- Honor `prefers-reduced-motion`.
- Provide `sr-only`/visually-hidden live regions for dynamic updates (see
  `.playground-announcer` pattern).
- Ensure text meets contrast on its background — `--fg-dim` (50% white) is for
  non-essential meta only, not primary reading copy.
- Interactive targets: keep tap targets ≥ ~40px on touch.

---

## 10. Do / Don't for Claude Code

**Do**
- Reference `--tokens`; reuse the component patterns above.
- Keep the mono-uppercase treatment for all meta/labels.
- Match existing easing, radii, and border weights.
- Ask before introducing a genuinely new pattern.

**Don't**
- Add new fonts, a second accent color, or warm brand colors.
- Use heavy drop-shadows, thick borders, or bright fills on flat UI.
- Hardcode a color that already has a token.
- Remove focus outlines or ignore reduced-motion.
- Mix `max-w-7xl` and `--max` within the same section.

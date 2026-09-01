# greenhueblues® — design spec

Handover spec for Claude Design. Authoritative source: [`src/index.css`](../src/index.css)
`:root` block. If this document and `index.css` disagree, **`index.css` wins** — update
this doc to match.

Verified against the codebase on 2026-09-01.

---

## 1. Principles

Dark, minimal, editorial, sacred-geometry.

- **Dark-first.** Near-black ground (`#0d0d0d`), white text, one cool accent.
- **Restraint over decoration.** Whitespace, hairline borders and typography do the
  work. Color is never a coat of paint.
- **Big type, tight tracking.** Display headings are large with negative letter-spacing
  and short line-height. Body stays calm and readable.
- **Motion is a whisper.** Slow easing, low opacity, `prefers-reduced-motion` honored
  with a calm static fallback — never by hiding the element.
- **Monospace for meta.** Labels, dates, eyebrows, tags → mono, uppercase, wide
  tracking. This recurring "system" texture is the signature of the brand.
- **The artwork carries the scale, not the copy.** The hero headline is deliberately
  small and periwinkle; the geometry and the wordmark are the loud elements.

---

## 2. Tokens

Full copy-pasteable block: [`tokens.css`](tokens.css).

### Color

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0d0d0d` | Page background, solid chip/card fills |
| `--fg` | `#ffffff` | Primary text |
| `--fg-mute` | `rgba(255,255,255,.7)` | Secondary text, body copy in sections |
| `--fg-dim` | `rgba(255,255,255,.5)` | Captions, meta, categories — never primary copy |
| `--line` | `rgba(255,255,255,.15)` | Borders, dividers, rules |
| `--accent` | `#a8c7ff` (periwinkle) | Hero headline, hover/active states, primary buttons |

- Accent tints: `rgba(168,199,255, α)` — `.03–.05` hover fills, `.08–.12` active,
  `.5` input borders at rest.
- Section grounds: the same near-black at varying alpha so the fixed background glows
  through — `.45` CTA, `.5` default shell, `.52` about, `.7` footer.
- The hero stage is solid `#000` (darker than `--bg`) so it reads as a separate surface.
- Panel gradients (jade / midnight / sunset / ultramarine / oxblood) are **art, not
  tokens**. Never reuse them for UI.

### Type

| Var | Family | Role |
|---|---|---|
| `--sans` | Inter 400–800 | Everything by default |
| `--mono` | Fragment Mono | Meta only: labels, eyebrows, dates, tags, column heads |
| `--script` | Caveat 500/700 | Rare decorative panel accents. Never UI |

| Var | Value | Use |
|---|---|---|
| `--huge` | `clamp(44px, 7.2vw, 112px)` | CTA heading, footer wordmark |
| `--display` | `clamp(40px, 5vw, 70px)` | Section `h2` |
| `--hero-size` | `clamp(22px, 2.8vw, 40px)` | Hero `h1` — deliberately *not* huge |
| `--body` | `18px` | Base body size |

Other consistent sizes: `28px` brand · `13px` mono labels · `11–12px` uppercase
eyebrows and tags · `15px` button text.

Weights and tracking:

- Display `h2`: weight 500, tracking `-.035em`, line-height 1.
- Hero `h1`: weight 400, tracking `-.04em`, line-height 1.05, color `--accent`.
- Huge (CTA / wordmark): weight 500–700, tracking `-.045em` to `-.05em`, line-height `.9–.94`.
- Statement copy: weight 500, `clamp(36px, 6vw, 88px)`, tracking `-.03em`, line-height 1.02.
- Body: weight 400–500, line-height 1.2 default / 1.5 for reading copy.
- Mono meta (reuse verbatim): `font-family: var(--mono); font-size: 11–13px;
  letter-spacing: .12em–.16em; text-transform: uppercase; color: var(--fg-dim);`

Measure: `22ch` (hero) to `52ch` (body). `text-wrap: balance` on large headings.

### Layout

| Var | Value | Meaning |
|---|---|---|
| `--max` | `1600px` | Max content width |
| `--pad-x` | `16px` | Horizontal page padding |
| `--section-y` | `clamp(80px, 10vw, 160px)` | Vertical rhythm |

`.wrap { max-width: var(--max); margin-inline: auto; padding-inline: var(--pad-x); }`
— every full-width section wraps its inner content in it.

Density modifiers, honored if present on an ancestor:
`[data-density="compact"]` → `clamp(56px, 7vw, 110px)`;
`[data-density="airy"]` → `clamp(120px, 14vw, 220px)`.

Spacing scale in use: `4, 6, 8, 10, 14, 16, 18, 22, 24, 32, 48, 56`. Grid gaps 24–32px
(card grids 32px). Don't invent a 13px or 27px gap.

### Radii, borders, shadows, focus

- Radii: `4px` controls · `6px` chips/tags · `8px` cards/tables · `999px` pills.
  Media thumbs are deliberately **square**.
- Borders: hairline `1px solid var(--line)`. `1px dashed rgba(255,255,255,.22)` is
  reserved for placeholder chips.
- Shadows: text over artwork only — `text-shadow: 0 2px 24px rgba(0,0,0,.55)`
  (`0 2px 16px` for the smaller panel name). No box-shadows on flat UI.
- Focus: `outline: 2px solid var(--accent); outline-offset: 2px` — never removed.

### Motion

`--ease: cubic-bezier(.2, .7, .2, 1)` is the only UI easing.

- Default transition `.25s`; hover `.2–.35s`; entrances `.6–1s`.
- Entrances: nav .6s `easeOut` delay .1s · hero lines 1s `cubic-bezier(.22,.7,.18,1)`
  staggered .05/.20/.34s · panel reveals .7s `[0.22,0.7,0.18,1]` stagger .08s
  (`once: true`, `amount: .5`) · CTA .85s `power3.out` delay .15s · footer word 1s
  `power3.out` delay .25s.
- Ambient loops: 13s hero flicker · 22s flame rise · 26s / 18s iridescence drift.
  Long and mutually desynced, with uneven keyframe stops.
- Smooth scroll: Lenis, duration 1.15, wheelMultiplier .95, touchMultiplier 1.2.
- Hover: links `opacity .7` · cards image `scale(1.02–1.06)` + `brightness(.85)` and a
  revealed pill · rows `rgba(255,255,255,.04)` tint + 12px `padding-left` shift.

### Breakpoints

`900px`, `810px` (**primary** — nav links drop, hero copy stacks, footer 2-col),
`768px`, `600px` (rows collapse), `480px` (mobile: nav 14px pad, footer 1-col,
CTA `clamp(32px,9vw,48px)`), `360px` (floor). Test at 360, 480, 810 and ≥1280.

---

## 3. What exists in the live page

The site is a single scrolling page (`src/pages/Home.jsx`), hash anchors only, Lenis
smooth scroll, with a fixed Fibonacci/psychedelic canvas background behind everything.

| Surface | Card |
|---|---|
| Fixed nav — 3-col, transparent | [`patterns/nav.html`](patterns/nav.html) |
| Hero — 100vh black stage, layered line-art, iridescence, cursor glare | [`patterns/hero.html`](patterns/hero.html) |
| Work — 4 sticky full-viewport photo panels, numbered + named | [`patterns/project-panels.html`](patterns/project-panels.html) |
| Section shell, statement/about, CTA | [`patterns/sections.html`](patterns/sections.html) |
| Footer — 3 link columns, wordmark, baseline | [`patterns/footer.html`](patterns/footer.html) |
| Meta labels, placeholder chips, pills, parenthetical cues | [`patterns/meta-and-chips.html`](patterns/meta-and-chips.html) |

## 4. What is spec only

[`patterns/controls.html`](patterns/controls.html) — buttons, inputs, work cards and
index rows. **None of these exist in the current build.** They are the agreed direction
carried over from an earlier version of the site (the `.pg-btn`, `.index-row`,
`.leader-row` and work-grid CSS has since been removed). Use them as the starting point
when such a component is first needed, then re-verify against `src/index.css`.

Also gone, so ignore any earlier doc that mentions them: Tailwind (the build runs
`postcss` with autoprefixer only, so **no utility classes and no `max-w-7xl`** — use
`--max` / `.wrap`), the blog / leaders / playground sections, and the audio player,
prayer wheel and PZCEL add-in surfaces.

---

## 5. Accessibility — non-negotiable

- Visible `--accent` focus outline on every interactive element.
- Honor `prefers-reduced-motion` with a calm static fallback, not a hidden element.
- Visually-hidden live region for any dynamic update.
- `--fg-dim` (50% white) is for non-essential meta only, never primary reading copy.
- Tap targets ≥ ~40px on touch.
- Decorative layers (`.hero-pattern`, `.hero-iridescence`, `.hero-glare`, panel
  backgrounds) carry `aria-hidden="true"`.

---

## 6. Do / Don't

**Do**

- Reference the tokens; reuse the pattern cards verbatim.
- Keep the mono-uppercase treatment for every label and piece of meta.
- Match the existing easing, radii and hairline border weights.
- Give a new surface space rather than more color.
- Ask before introducing a genuinely new pattern.

**Don't**

- Add a font, a second accent, or any warm/brand color.
- Reuse the panel art gradients for UI.
- Use heavy drop-shadows, thick borders or bright fills on flat UI.
- Hardcode a color that already has a token.
- Remove a focus outline or ignore reduced motion.
- Reintroduce Tailwind utility widths alongside `--max`.

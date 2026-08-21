# greenhueblues — Higgsfield Image RUNBOOK

*Budget-locked to 6 credits. Copy-paste ready. Workspace: `D:\trialme\golden-ratio-site` (already set, `hf` already authed).*

---

## 1. Strategy

We're buying back cohesion and distribution with almost no spend. The site sells "mindful systems," but its marquee panels are four mismatched stock-ish files and its shared link renders as a bare, broken preview — two cracks a prospect sees before they judge a single pixel of craft. So we do the highest-leverage-per-credit moves first: mint one atmospheric **OG backdrop** (fixes the shared-link problem, seen most, costs least to wire), regenerate the **four panels as one film-stock series** on the cheapest decent model (they sit under a 0.4 scrim + big white type, so mood and dark-safety matter far more than fidelity — z_image is exactly right), and cut a crisp **favicon glyph** for tab and app-icon presence. Everything obeys one locked visual system so the whole property reads as a single shot, reframed. Total DO-NOW spend: **2.60 cr** — leaving 3.40 cr as re-roll buffer and a head start on the deferred round.

---

## 2. Locked art direction (every asset obeys this)

**Palette**

| Role | Hex |
|---|---|
| Ground (near-black, 70%+ of frame) | `#0d0d0d` |
| Ink shadow / vignette | `#000000` |
| Line indigo (sacred-geometry strokes — the "system") | `#2e3154` |
| Accent periwinkle (the one cool glint, sparing) | `#a8c7ff` |
| Faded gold dusk glow (one source, off-center) | `#c9a86a` → bloom `#e8d3a0` |
| Mist (atmospheric midtone) | `#5b6a8c` |

**Ratio law:** ~70% near-black · ~20% indigo/mist structure · ~7% periwinkle glints · ~3% gold glow. Cool dominates; gold is a single accent, never a 50/50 warm-cool split.

**Technique:** abstract atmospheric (never illustrative) · sacred-geometry as *thin* half-dissolved line-art (golden-ratio spirals, phi grids, faint mandala) · fine 35mm film grain over everything · deep matte blacks, low luminance, built to survive a 0.4 black scrim + white text · calm central 60%, interest in the outer thirds · one off-center gold glow on a third · shared low horizon across the 4-panel set.

**AVOID (hard bans):** stock clichés (handshakes, lightbulbs, laptops, offices, cityscapes, people, hands, mountains) · literal DNA helix / eyes / circuit boards / infinity symbols · neon, cyberpunk, electric blue, saturated RGB, laser, lens flare · busy/bright centers, dead-center symmetrical blobs · teal-and-orange, warm-cool 50/50 splits · glossy 3D, chrome, plastic, HDR sheen, blown highlights · text/letters/watermarks (except where a prompt places the wordmark) · fractal soup, clutter.

*Favicon is the ONE exception to "calm center" — it's a centered mark on pure black.*

---

## 3. Prioritized asset table

| Asset | Tier | Model | Cost (cr) | Fits 6-cr budget? |
|---|---|---|---|---|
| OG / social-share backdrop (16:9) | P0 | seedream_v5_lite | 1.00 | **Y** |
| 4-panel series — DNA/Vision/Logic/Limitless (16:9 ×4) | P0/P1 | z_image | 0.60 | **Y** |
| Favicon / app-icon glyph (1:1) | P1 | seedream_v5_lite | 1.00 | **Y** |
| — DO NOW subtotal — | | | **2.60** | **Y** |
| PZCEL sub-page hero (16:9) | P2 | z_image | 0.15 | Y (defer) |
| Hero backdrop plate (16:9) | P2 | z_image / seedream | 0.15–1.00 | Y (defer) |
| About mood image (3:4) | P2 | seedream_v5_lite | 1.00 | Y (defer) |
| Index project thumbnails (4:3 ×4) | P2 | seedream_v5_lite | 4.00 | N in same round |
| PZCEL Office add-in icon (1:1) | P2 | z_image | 0.15 | Y (defer) |

---

## 4. How to run (preamble)

- Workspace is already `D:\trialme\golden-ratio-site` and `hf` is authed — no setup.
- **Price-check before any spend** you're unsure about: `hf generate cost <model> --prompt "..."` — it does not generate, just quotes.
- Each `create ... --wait` blocks until done and **prints an image URL**. Download that URL to the path noted under each step (browser save, or `curl -o <path> "<url>"`).
- If z_image ignores `--no`, the negatives are also folded inline as `no text, no neon, no people…` in these prompts — no action needed.
- Run steps **in order**; the running tally must never exceed 6.

---

## 5. DO NOW (≤6 credits) — total 2.60 cr

### Step 1 — OG / social backdrop · seedream_v5_lite · 16:9 · 1.00 cr → **running: 1.00**

```
hf generate create seedream_v5_lite --aspect-ratio 16:9 --quality high --wait --prompt "Widest and most atmospheric brand backdrop for a mindful design studio's social link preview, vast quiet cinematic space, a single soft off-center faded-gold #c9a86a dusk glow blooming to #e8d3a0 anchored low in the lower-left third like a distant Japanese-dusk horizon, thin indigo #2e3154 sacred-geometry line-art (golden-ratio spiral, faint phi-grid, half-dissolved mandala lattice) drifting in from the right edge and lower corners, sparing periwinkle #a8c7ff light glints catching a few strokes in the margins only, deep matte near-black #0d0d0d ground filling 70% of the frame, volumetric haze and atmospheric perspective, long-exposure light and fine astronomical dust, the central horizontal band kept intentionally dark low-contrast and empty as clean negative space reserved for a white studio wordmark and tagline to be overlaid later. Abstract atmospheric composition, near-black #0d0d0d ground, thin indigo #2e3154 sacred-geometry line-art (golden-ratio spirals, faint phi-grid, half-dissolved mandala), sparing periwinkle #a8c7ff light glints, one soft off-center faded-gold #c9a86a dusk glow, volumetric haze, fine 35mm film grain, matte deep blacks, low luminance, generous negative space, calm uncluttered center reserved for white text overlay, contemplative and mindful mood, cinematic long-exposure light, dark-overlay-safe. --no text, letters, watermark, logo, UI, borders, frame, people, hands, faces, eyes, literal DNA helix, circuit board, infinity symbol, lightbulb, laptop, office, cityscape, mountains, stock photo, neon, cyberpunk, electric blue, saturated RGB, laser, lens flare, glossy 3D, chrome, plastic, HDR sheen, blown highlights, busy center, symmetrical center blob, teal and orange, warm-cool split, fractal soup, clutter, bright, high-key"
```

**Save to:** `D:\trialme\golden-ratio-site\public\og.png`

**Wire it (free, mandatory)** — add inside `<head>` in `D:\trialme\golden-ratio-site\index.html`. Replace `https://greenhueblues.com` with the real deployed origin (OG image URLs must be absolute):

```html
<meta name="description" content="greenhueblues — building mindful systems for a conscious world. An independent design studio in Kathmandu, working globally. Shaping enlightened design with purposeful vision." />

<!-- Open Graph -->
<meta property="og:type" content="website" />
<meta property="og:title" content="greenhueblues — mindful systems for a conscious world" />
<meta property="og:description" content="Independent design studio in Kathmandu, working globally. Shaping enlightened design with purposeful vision." />
<meta property="og:url" content="https://greenhueblues.com/" />
<meta property="og:image" content="https://greenhueblues.com/og.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="greenhueblues — mindful systems for a conscious world" />
<meta name="twitter:description" content="Independent design studio in Kathmandu, working globally. Shaping enlightened design with purposeful vision." />
<meta name="twitter:image" content="https://greenhueblues.com/og.png" />
```

> The OG image lives in `public/` (served at site root `/og.png`), so the tag references `/og.png`, not the `src/assets/` path. Generating the image without these tags captures none of the value.

---

### Step 2 — 4-panel series · z_image · 16:9 · 0.15 cr each → **running: 1.15 / 1.30 / 1.45 / 1.60**

**2a — DNA** (0.15 → running 1.15)
```
hf generate create z_image --aspect-ratio 16:9 --wait --prompt "DNA panel: two intertwining strands of fine luminous light-dust rising through vast dark haze, a phi-spiral double-helix only IMPLIED by the twin coiling paths of particles, never a literal helix; cool and structural, thin indigo #2e3154 golden-ratio strokes threading between the strands, sparing periwinkle #a8c7ff glints catching the coil in the outer thirds, one soft faded-gold #c9a86a dusk glow low and off-center to the lower-left, central band kept calm and low-contrast for a large white number and word overlay. Abstract atmospheric composition, near-black #0d0d0d ground, thin indigo #2e3154 sacred-geometry line-art (golden-ratio spirals, faint phi-grid, half-dissolved mandala), sparing periwinkle #a8c7ff light glints, one soft off-center faded-gold #c9a86a dusk glow, volumetric haze, fine 35mm film grain, matte deep blacks, low luminance, generous negative space, calm uncluttered center reserved for white text overlay, contemplative and mindful mood, cinematic long-exposure light, dark-overlay-safe. --no text, letters, watermark, logo, UI, borders, frame, people, hands, faces, eyes, literal DNA helix, circuit board, infinity symbol, lightbulb, laptop, office, cityscape, mountains, stock photo, neon, cyberpunk, electric blue, saturated RGB, laser, lens flare, glossy 3D, chrome, plastic, HDR sheen, blown highlights, busy center, symmetrical center blob, teal and orange, warm-cool split, fractal soup, clutter, bright, high-key"
```
**Save to:** `D:\trialme\golden-ratio-site\src\assets\dna.png`

**2b — Vision** (0.15 → running 1.30)
```
hf generate create z_image --aspect-ratio 16:9 --wait --prompt "Vision panel: the deepest, warmest dusk glow of the four, a single distant luminous horizon of faded-gold #c9a86a blooming softly to #e8d3a0, low and off-center to the lower-right, an enlightened dawn-over-vast-plain mood built purely from volumetric haze; delicate periwinkle #a8c7ff arcs and phi curves drifting in from the left edge, thin indigo #2e3154 geometry dissolving into the mist, cool atmosphere still dominant so warm and cool never split the frame evenly, central band kept calm and low-contrast for a large white number and word overlay. Abstract atmospheric composition, near-black #0d0d0d ground, thin indigo #2e3154 sacred-geometry line-art (golden-ratio spirals, faint phi-grid, half-dissolved mandala), sparing periwinkle #a8c7ff light glints, one soft off-center faded-gold #c9a86a dusk glow, volumetric haze, fine 35mm film grain, matte deep blacks, low luminance, generous negative space, calm uncluttered center reserved for white text overlay, contemplative and mindful mood, cinematic long-exposure light, dark-overlay-safe. --no text, letters, watermark, logo, UI, borders, frame, people, hands, faces, eyes, literal DNA helix, circuit board, infinity symbol, lightbulb, laptop, office, cityscape, mountains, stock photo, neon, cyberpunk, electric blue, saturated RGB, laser, lens flare, glossy 3D, chrome, plastic, HDR sheen, blown highlights, busy center, symmetrical center blob, teal and orange, warm-cool split, fractal soup, clutter, bright, high-key"
```
**Save to:** `D:\trialme\golden-ratio-site\src\assets\vision.png`

**2c — Logic** (0.15 → running 1.45)
```
hf generate create z_image --aspect-ratio 16:9 --wait --prompt "Logic panel: the most geometric and coolest of the four, a faint phi-grid and half-dissolved Metatron lattice of thin indigo #2e3154 line-art drifting through dark haze as the dominant structural layer, Fibonacci arcs and a quiet mandala scaffold suggested in the outer thirds, deepest indigo mood with only the smallest, most restrained faded-gold #c9a86a glow kept low and off-center to the lower-left, sparing periwinkle #a8c7ff glints marking the grid nodes in the margins, central band kept calm and low-contrast for a large white number and word overlay. Abstract atmospheric composition, near-black #0d0d0d ground, thin indigo #2e3154 sacred-geometry line-art (golden-ratio spirals, faint phi-grid, half-dissolved mandala), sparing periwinkle #a8c7ff light glints, one soft off-center faded-gold #c9a86a dusk glow, volumetric haze, fine 35mm film grain, matte deep blacks, low luminance, generous negative space, calm uncluttered center reserved for white text overlay, contemplative and mindful mood, cinematic long-exposure light, dark-overlay-safe. --no text, letters, watermark, logo, UI, borders, frame, people, hands, faces, eyes, literal DNA helix, circuit board, infinity symbol, lightbulb, laptop, office, cityscape, mountains, stock photo, neon, cyberpunk, electric blue, saturated RGB, laser, lens flare, glossy 3D, chrome, plastic, HDR sheen, blown highlights, busy center, symmetrical center blob, teal and orange, warm-cool split, fractal soup, clutter, bright, high-key"
```
**Save to:** `D:\trialme\golden-ratio-site\src\assets\logic.png` *(lowercase .png — replaces `logic.JPG`)*

**2d — Limitless** (0.15 → running 1.60)
```
hf generate create z_image --aspect-ratio 16:9 --wait --prompt "Limitless panel: the most open and empty of the four, a vast expanse of near-empty dark haze reading as deep quiet space, one single small golden-ratio spiral of fine light-dust vanishing into the far distance, gold #c9a86a glow the smallest and most remote of the series held low and off-center to the lower-right, a lone periwinkle #a8c7ff glint far off, thin indigo #2e3154 geometry barely perceptible at the edges, negative space is the subject, central band kept calm and low-contrast for a large white number and word overlay. Abstract atmospheric composition, near-black #0d0d0d ground, thin indigo #2e3154 sacred-geometry line-art (golden-ratio spirals, faint phi-grid, half-dissolved mandala), sparing periwinkle #a8c7ff light glints, one soft off-center faded-gold #c9a86a dusk glow, volumetric haze, fine 35mm film grain, matte deep blacks, low luminance, generous negative space, calm uncluttered center reserved for white text overlay, contemplative and mindful mood, cinematic long-exposure light, dark-overlay-safe. --no text, letters, watermark, logo, UI, borders, frame, people, hands, faces, eyes, literal DNA helix, circuit board, infinity symbol, lightbulb, laptop, office, cityscape, mountains, stock photo, neon, cyberpunk, electric blue, saturated RGB, laser, lens flare, glossy 3D, chrome, plastic, HDR sheen, blown highlights, busy center, symmetrical center blob, teal and orange, warm-cool split, fractal soup, clutter, bright, high-key"
```
**Save to:** `D:\trialme\golden-ratio-site\src\assets\limitless.png` *(lowercase .png — replaces `limitless.JPG`)*

**Wire it (free)** — in `D:\trialme\golden-ratio-site\src\pages\Home.jsx` (imports around lines 8–11). The two `.JPG` panels are renamed to lowercase `.png`, so update those two import paths (dna/vision were already `.png` — if the new files reuse the exact same names, no import change is needed for those two):
```js
// was: import logic from '../assets/logic.JPG'
import logic from '../assets/logic.png'
// was: import limitless from '../assets/limitless.JPG'
import limitless from '../assets/limitless.png'
```
Delete the old `logic.JPG` and `limitless.JPG` so no stale casing lingers. Panels render at 16:9 under a ~0.4 scrim — the new series is built for exactly that.

---

### Step 3 — Favicon / app-icon glyph · seedream_v5_lite · 1:1 · 1.00 cr → **running: 2.60**

```
hf generate create seedream_v5_lite --aspect-ratio 1:1 --quality high --wait --prompt "App-icon mark on a pure solid near-black #0d0d0d square field. A single centered minimal sacred-geometry glyph: one clean golden-ratio spiral drawn as a thin crisp periwinkle #a8c7ff line, its arc suggesting a half-dissolved phi-based mandala, the stroke bold and confident so it stays legible when scaled down to 16-32px. A faint soft off-center faded-gold #c9a86a halo bloom sits just behind and below the glyph as the one warm accent, low and quiet, never competing with the periwinkle line. Thin indigo #2e3154 sacred-geometry sub-strokes barely visible in the surrounding shadow as a quiet structural undercurrent. Small compact centered emblem, generous even near-black margin all around, symmetrical and centered by design (this mark is the deliberate exception to off-center composition), contemplative and mindful mood, matte deep blacks, low luminance, no film grain mush on the line, crisp clean vector-like stroke, dark-overlay-safe. no text, no letters, no watermark, no logo type, no UI, no borders, no frame, no people, no photographic scene, no heavy grain, no blur, no soft mushy edges on the glyph --no text, letters, watermark, logo, UI, borders, frame, people, hands, faces, eyes, literal DNA helix, circuit board, infinity symbol, neon, cyberpunk, electric blue, saturated RGB, glossy 3D, chrome, plastic, HDR sheen, blown highlights, busy center, teal and orange, warm-cool split, fractal soup, clutter, bright, high-key, grain mush, blur, photographic scene"
```

**Save to:** `D:\trialme\golden-ratio-site\public\favicon-source.png` (master). Then export a 180×180 `apple-touch-icon.png` and 32×32 `favicon.png` from it (any resizer; keep the master for future sizes).

**Wire it (free)** — in `index.html`, replace the lone icon line with:
```html
<link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
```

---

### DO NOW tally

| Step | Asset | Model | Cost | Running |
|---|---|---|---|---|
| 1 | OG backdrop | seedream_v5_lite | 1.00 | 1.00 |
| 2a | DNA panel | z_image | 0.15 | 1.15 |
| 2b | Vision panel | z_image | 0.15 | 1.30 |
| 2c | Logic panel | z_image | 0.15 | 1.45 |
| 2d | Limitless panel | z_image | 0.15 | 1.60 |
| 3 | Favicon glyph | seedream_v5_lite | 1.00 | **2.60** |

**Spent: 2.60 cr · Remaining: 3.40 cr.** Never exceeds 6. Use the buffer to **re-roll only the single weakest panel** (0.15 cr each) if one comes back muddy — regenerate one, not the set.

---

## 6. DEFER (needs top-up)

Do these once credits are topped up. All obey the same locked system (per-asset prompts already written in the art-direction pack).

| Asset | Model | Cost (cr) | Notes |
|---|---|---|---|
| PZCEL sub-page hero (16:9) — cooler, more geometric variant | z_image | 0.15 | Gated behind passkey; low prospect traffic. Save `public/pzcel-hero.png`, wire into `src/pages/Pzcel.jsx` hero. |
| Hero backdrop plate (16:9) | z_image / seedream | 0.15–1.00 | Hero already looks intentional; risk of fighting the SVG line-art. Try z_image first. |
| About mood image (3:4) | seedream_v5_lite | 1.00 | Whitespace is plausibly on-brand — only if the section reads too sparse. |
| Index project thumbnails (4:3 ×4) | seedream_v5_lite | 4.00 | Must depict the *real* projects (E-Sikshya, Blockchain Auth, KaskoIsP, Coffee Vending FSM) to avoid misrepresentation; expensive. Biggest single line. |
| PZCEL Office add-in icon (1:1) | z_image | 0.15 | Replaces external GitHub Excel logo in `manifest.xml`; buried in gated flow. |

**Deferred subtotal ≈ 5.45–6.30 cr** — cleanly scoped as "round two," almost exactly a second top-up. Sequence round two: PZCEL hero + Office icon + About (~1.30 cr) first, thumbnails (4.00 cr) last since they carry misrepresentation risk and cost the most.

---

*Brand law, one line: 70% near-black quiet · thin indigo geometry as the "system" · periwinkle as the single cool glint · one faded-gold dusk glow off-center · film grain over everything · center stays calm for white text. Every asset is the same shot, reframed.*
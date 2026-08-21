# Higgsfield CLI — Regenerate the 4 Project-Panel Images

A ready-to-run plan to regenerate `dna` / `vision` / `logic` / `limitless` panel
backgrounds as one cohesive, site-matched series and drop them straight into the
site. The panels already import these filenames, so **overwriting the files in
`src/assets/` wires them in with no code change.**

> Prereq: you must be logged in first — `hf auth login` (browser OAuth). Verify
> with `hf account`.

---

## Shared art direction (the visual system these prompts encode)

- **Palette:** near-black base (#0d0d0d) with a periwinkle-blue spine (#a8c7ff)
  through every frame; each panel folds in ONE desaturated signature accent
  (DNA emerald-teal, Vision indigo, Logic muted magenta→amber, Limitless royal
  cosmic blue) pulled toward the periwinkle so the four read as one family.
- **Technique:** abstract volumetric light + fine particle fields in soft haze;
  a quiet undercurrent of sacred geometry (golden-ratio spirals, Fibonacci flow
  lines) embedded in the fog, not drawn as hard graphics.
- **Center-safety:** central 60% kept low-contrast and mid-to-dark so white text
  + the 0.38–0.42 black overlay read cleanly; brightest accents pushed to edges.
- **Avoid:** literal DNA helixes/lightbulbs/brains/circuits, bright busy centers,
  stock-tech clichés, neon, lens flare, text/logos, blown highlights.

---

## Step 0 — pick an image model

```
hf model list --image
```

Use an id below as `<MODEL>` (`nano_banana_2` is a reasonable default).
Optional price check before committing:

```
hf generate cost <MODEL> --prompt "..."
```

---

## 1. dna → `dna.png`

```
hf generate create <MODEL> --prompt "Abstract atmospheric photograph of volumetric light and fine drifting particle fields suspended in soft ink-like haze, a near-black #0d0d0d base breathed through with a periwinkle-blue #a8c7ff spine and one desaturated emerald-teal #6dd9a8 current pulled toward the periwinkle, evoking life, origin and quiet growth. A faint golden-ratio spiral of luminous grain unspools from a calm dark center toward glowing edges and corners, subtle Fibonacci flow lines embedded in the fog. Fine grain, gentle gaussian bloom, layered depth of field, matte and contemplative, meditative negative space, landscape 16:9, low-contrast mid-to-dark core safe under a black overlay with centered white text." --aspect-ratio 16:9 --wait
```

## 2. vision → `vision.png`

```
hf generate create <MODEL> --prompt "Abstract atmospheric field of deep indigo #1a2a52 haze threaded with a periwinkle-blue #a8c7ff spine, a single luminous golden signal accent tracing a slow waveform current from edge to edge; fine particle drift and faint concentric ripples suggest foresight and clarity. Volumetric light through ink and mist, gentle gaussian bloom, fine grain, layered depth-of-field, matte and contemplative. Central 60% kept dark and low-contrast, brightest gold pushed to the corners, generous negative space, meditative sacred proportion. Landscape 16:9." --aspect-ratio 16:9 --wait
```

## 3. logic → `logic.png`

```
hf generate create <MODEL> --prompt "Abstract atmospheric field of slow volumetric light drifting through soft ink-like haze, a restrained sunset ember of muted magenta bleeding into dark amber, desaturated and pulled toward a periwinkle-blue spine (#a8c7ff) so it reads calm and moody, never oversaturated. Faint golden-ratio spiral and Fibonacci flow lines suggest ordered reasoning and structure, embedded in fog rather than drawn hard. Warm glow and fine particle grain pushed to edges and corners; central 60 percent low-contrast, mid-to-dark, safe under a black overlay with white text. Landscape 16:9, gentle bloom, layered depth-of-field, matte contemplative, generous negative space, no text or logos." --aspect-ratio 16:9 --wait
```

## 4. limitless → `limitless.png`

```
hf generate create <MODEL> --prompt "Abstract cosmic atmosphere of boundless scale, desaturated royal blue #2a3aa8 dissolving into deep cosmic black, threaded with a periwinkle #a8c7ff spine of volumetric light and fine drifting particle fields through soft ink-like haze. A faint golden-ratio spiral of dim starlight unfurls outward toward the edges, luminance and brightest accents pushed to the corners while the central core stays calm, low-contrast, and dark. Fine grain, gentle bloom, layered depth-of-field, matte and meditative, landscape 16:9, generous negative space, no text, no literal celestial objects." --aspect-ratio 16:9 --wait
```

---

## Saving the results

- `--wait` blocks until the job finishes and prints a **result URL**.
- If a job is slow: `--wait-timeout <seconds>` and/or `--wait-interval <seconds>`.
- Download each image into `src/assets/` under its exact filename —
  `dna.png`, `vision.png`, `logic.png`, `limitless.png` — **overwriting** the
  current files. No code change needed; the panels already import those names.
- Current files are `.png` for dna/vision and `.jpg` for logic/limitless. The
  panels import by exact filename, so keep the extension consistent (save the new
  logic/limitless as `.jpg`, or update the two imports in `src/pages/Home.jsx`).

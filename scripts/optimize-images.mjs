// One-time (idempotent) raster optimisation for the site's source imagery.
//
// The source files are 12 MP phone photos and palette PNGs dropped in at full
// camera resolution — ~15.2 MB of raster for a site whose largest layer is
// painted at 150% of the viewport. This re-encodes each one to WebP at the
// size it is actually displayed, and writes the result next to the original.
//
// The originals stay in the repo on purpose: they are the editable masters,
// and Vite only bundles what is imported, so an unreferenced .jpg costs the
// visitor nothing. Re-run this after replacing a master.
//
// Requires ffmpeg on PATH (already used elsewhere in this toolchain). Run with
//   npm run optimize:images

import { execFileSync } from 'node:child_process'
import { statSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// width:     target pixel width; the source is never upscaled.
// quality:   libwebp 0-100. Layers that sit under a heavy CSS filter or a low
//            opacity can take a lower number without it being visible.
// alpha:     source has a real alpha channel that must survive.
// grayscale: the layer is rendered through `filter: grayscale(1)`, so colour
//            in the file is bytes nobody will ever see.
// denoise:   nlmeans strength. Only for files whose "grain" is Floyd-Steinberg
//            dither speckle from a 256-colour palette quantisation, not real
//            texture. That speckle is per-pixel noise, so it defeats the
//            encoder completely — vision.png would not go below 600 kB with it
//            and lands at 196 kB without. Removing it moves the file back
//            toward the photograph it was before someone saved it as pal8.
//            Do NOT use on images whose fine detail is the content.
const TARGETS = [
  // About hero — four stacked full-bleed layers, painted at `150% auto`.
  { src: 'src/assets/about/mountain-photo.jpg', width: 2560, quality: 76 },
  { src: 'src/assets/about/mountain-ridge.png', width: 1600, quality: 82, alpha: true },
  // A glow layer: smooth by definition, so the speckle in it is all dither.
  { src: 'src/assets/about/mountain-glow.png',  width: 1600, quality: 78, alpha: true, denoise: 8 },
  // A soft luminance mask; banding here shows up as a hard edge in the sky,
  // so it keeps its resolution and a high quality number.
  { src: 'src/assets/about/sky-mask.png',       width: 1600, quality: 92, alpha: true },

  // Philosophy.
  { src: 'src/assets/philosophy/hero-ridgeline.jpg', width: 2560, quality: 74 },
  // Rendered through `filter: grayscale(1)` (Philosophy.css:562).
  { src: 'src/assets/philosophy/mark-band.jpg',      width: 2200, quality: 76, grayscale: true },
  // Despite the .png name this file is already a JPEG. It sits at opacity .34
  // under a saturate/contrast/brightness stack, so it can go much smaller.
  { src: 'src/assets/philosophy/ambient-grain.png',  width: 1000, quality: 66 },
  { src: 'src/assets/philosophy/practice.jpg',       width: 646,  quality: 82 },
  { src: 'src/assets/philosophy/greenhueblues-mark.png', width: 307, quality: 90, alpha: true },

  // Home panel backgrounds — each sits under a ~.4 black scrim.
  // vision/dna were saved as 256-colour dithered PNGs; see `denoise` above.
  { src: 'src/assets/vision.png',    width: 1920, quality: 74, denoise: 14 },
  { src: 'src/assets/dna.png',       width: 1920, quality: 76 },
  // A near-black concrete stairwell: almost all of it is one long smooth
  // falloff, which is where WebP bands. Quality is high for that reason and
  // costs little — the image has hardly any detail to spend bits on. Square,
  // so `cover` has vertical headroom on a portrait phone as well as the
  // horizontal headroom the 16:9 masters give it on a desktop.
  { src: 'src/assets/logic-spiral.jpg', width: 1920, quality: 82 },
  { src: 'src/assets/limitless.JPG', width: 1920, quality: 78 },
]

const kb = (n) => (n / 1024).toFixed(1).padStart(8) + ' kB'
let before = 0
let after = 0

for (const t of TARGETS) {
  const src = join(root, t.src)
  if (!existsSync(src)) {
    console.warn(`  skip (missing): ${t.src}`)
    continue
  }
  const out = src.replace(/\.(jpe?g|png)$/i, '.webp')

  // `scale` never upscales: -2 keeps the dimension even, which libwebp wants.
  const filters = [`scale='min(${t.width},iw)':-2`]
  // nlmeans is a spatial denoiser. hqdn3d is mostly temporal and does almost
  // nothing on a still; smartblur with a negative ls sharpens, which makes the
  // file bigger. Both were tried here first.
  if (t.denoise) filters.push(`nlmeans=s=${t.denoise}:p=7:r=15`)
  if (t.grayscale) filters.push('format=gray')

  const args = [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-i', src,
    '-vf', filters.join(','),
    '-c:v', 'libwebp',
    '-quality', String(t.quality),
    '-compression_level', '6',
    '-preset', 'picture',
    // Lossy WebP needs an explicit alpha-carrying pixel format; without this
    // ffmpeg drops the alpha channel and the overlay turns into a black box.
    '-pix_fmt', t.alpha ? 'yuva420p' : 'yuv420p',
    out,
  ]

  execFileSync('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] })

  const b = statSync(src).size
  const a = statSync(out).size
  before += b
  after += a
  const pct = (100 - (a / b) * 100).toFixed(0)
  console.log(`${kb(b)} -> ${kb(a)}  (-${String(pct).padStart(2)}%)  ${t.src}`)
}

console.log(`\n${kb(before)} -> ${kb(after)}   saved ${kb(before - after)} (${(100 - (after / before) * 100).toFixed(1)}%)`)

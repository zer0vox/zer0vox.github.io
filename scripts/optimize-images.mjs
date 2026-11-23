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
// mono:      a real black-and-white conversion, as opposed to `grayscale`
//            above. The two are not the same job. `grayscale` throws away
//            colour nobody can see because CSS is already filtering it out;
//            `mono` is the edit — the file is meant to BE black and white, and
//            what it looks like matters.
//
//            format=gray on its own uses the Rec.601 luma weights
//            (.299/.587/.114), which is a fine average and a poor photograph:
//            it under-weights red, and red is most of what gives skin its
//            modelling, so faces come out flat and slightly muddy. The mixer
//            below is nearer a panchromatic film response — more red, less
//            blue — which is what black-and-white portrait stock was designed
//            to do. The small contrast lift is for the page rather than the
//            print: this sits on a near-black ground, where a neutral scan
//            reads softer than it does on white.
// Orientation: there is deliberately no rotate option. ffmpeg applies a
//            JPEG's EXIF orientation on decode, so a phone photo that is
//            stored landscape with an orientation tag arrives here already
//            upright and needs nothing. Note that ffprobe reports the CODED
//            dimensions, so a portrait phone photo still shows as landscape
//            there — which makes it very tempting to "fix" with a transpose
//            that then rotates a correct image into a wrong one. If a master
//            ever really is on its side, check by converting it and looking at
//            the result before adding a filter.
// crop:      an ffmpeg crop expression, applied before the scale. For art
//            that has a composition rather than being a full-bleed layer:
//            framing it into the asset means the element displaying it can
//            crop from the centre and still be right, which object-position
//            cannot promise when the box it lands in is sized by its content.
//            Written with iw/ih so it survives the master being replaced at a
//            different resolution.
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
  // Meet the man — the portrait. 840 is 2x the 420px frame it is displayed in.
  // The conversion lives here rather than in CSS so the asset is genuinely
  // black and white: a filter: grayscale(1) still ships every colour byte, and
  // still shows colour anywhere the filter does not apply.
  { src: 'src/assets/about/portrait.jpg',      width: 840,  quality: 84, mono: true },
  // The easter-egg card's art. Narrower than the portrait because it is only
  // ever seen inside the card's art window, and mono for the same reason the
  // portrait is — which leaves the holo as the only colour on the card.
  // Framed for the card's art window: the top fifth is empty night sky and the
  // bottom is the plinth, neither of which is the picture.
  { src: 'src/assets/about/card-art.jpg',      width: 720,  quality: 82, mono: true,
    crop: 'iw:ih*0.74:0:ih*0.18' },

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
  // Ahead of the scale, so `width` means the width of the cropped image.
  if (t.crop) filters.unshift(`crop=${t.crop}`)
  // nlmeans is a spatial denoiser. hqdn3d is mostly temporal and does almost
  // nothing on a still; smartblur with a negative ls sharpens, which makes the
  // file bigger. Both were tried here first.
  if (t.denoise) filters.push(`nlmeans=s=${t.denoise}:p=7:r=15`)
  if (t.grayscale) filters.push('format=gray')
  if (t.mono) {
    // Panchromatic-ish weights; see `mono` above for why not format=gray alone.
    filters.push('colorchannelmixer=.34:.5:.16:0:.34:.5:.16:0:.34:.5:.16:0')
    filters.push('eq=contrast=1.08:gamma=0.98')
    // Downscaling softens; this puts the edge back without haloing.
    filters.push('unsharp=5:5:0.35:5:5:0')
    // The mixer leaves an RGB image with three equal channels. This makes it
    // one channel, so the chroma planes are flat and cost the encoder nothing.
    filters.push('format=gray')
  }

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

// Halftone screening for the printed pictures on the philosophy page.
//
// A picture is printed the way a press would set one colour: a lattice of
// dots turned 45 degrees, each dot's area following the ink the picture wants
// at that point. Nothing here holds the picture itself -- a grey sampling
// source is decoded once into a small luminance grid, and every lattice reads
// from that. So a canvas can be re-screened at any size, at device resolution,
// without moire from scaling a pre-rendered print, and a dot can be grown in
// or out on its own (which is how the prints develop).
//
// Same idiom as ContactPrint's tint ramp: every dot is one arc in a single
// path and a single fill. Kept dependency-free.

// Decodes `src` and keeps its luminance at `width` pixels across. The sources
// are grey already, so this is the red channel; a few pixels per dot is all a
// screen can resolve, so a small grid loses nothing.
export async function loadLuma(src, width) {
  const img = new Image()
  img.decoding = 'async'
  img.src = src
  await img.decode()

  const w = Math.max(1, Math.min(width, img.naturalWidth))
  const h = Math.max(1, Math.round((w * img.naturalHeight) / img.naturalWidth))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, w, h)

  const px = ctx.getImageData(0, 0, w, h).data
  const data = new Float32Array(w * h)
  for (let i = 0; i < data.length; i++) data[i] = px[i * 4] / 255
  return { w, h, data }
}

// The same grid, rasterised from type rather than decoded from a file: ink
// is dark, so the grid holds 1 - alpha. Used for a numeral printed as a
// picture.
export function lumaFromText(text, { width, height, font, x = 0.5, y = 0.56 }) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.font = font
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#000'
  ctx.fillText(text, width * x, height * y)

  const px = ctx.getImageData(0, 0, width, height).data
  const data = new Float32Array(width * height)
  for (let i = 0; i < data.length; i++) data[i] = 1 - px[i * 4 + 3] / 255
  return { w: width, h: height, data }
}

// Bilinear luminance at (u, v) in 0..1. Outside the grid is paper.
export function sampleLuma(luma, u, v) {
  if (u < 0 || v < 0 || u > 1 || v > 1) return 1
  const x = u * (luma.w - 1)
  const y = v * (luma.h - 1)
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const x1 = Math.min(luma.w - 1, x0 + 1)
  const y1 = Math.min(luma.h - 1, y0 + 1)
  const fx = x - x0
  const fy = y - y0
  const d = luma.data
  const top = d[y0 * luma.w + x0] * (1 - fx) + d[y0 * luma.w + x1] * fx
  const bot = d[y1 * luma.w + x0] * (1 - fx) + d[y1 * luma.w + x1] * fx
  return top * (1 - fy) + bot * fy
}

// Dot centres for a w x h box, `pitch` px apart along the screen angle. A
// square lattice turned 45 degrees is every other node of an axis-aligned
// grid at pitch / sqrt(2), alternating by row.
export function screenLattice(w, h, pitch) {
  const step = pitch / Math.SQRT2
  const cols = Math.ceil(w / step) + 1
  const rows = Math.ceil(h / step) + 1
  const xs = []
  const ys = []
  for (let j = 0; j < rows; j++) {
    for (let i = j & 1; i < cols; i += 2) {
      xs.push(i * step)
      ys.push(j * step)
    }
  }
  return { x: Float32Array.from(xs), y: Float32Array.from(ys), n: xs.length }
}

// Tone curve: luminance in, fraction of the cell inked out. Levels first (lo
// prints as solid, hi as bare paper), then a gamma, so the sky can be held to
// a light tint while shadows keep their structure. `max` keeps the darkest
// dots just short of closing up into a flat field.
export function inkCover(l, { lo = 0.06, hi = 0.9, gamma = 1.5, max = 0.84 } = {}) {
  const t = Math.min(1, Math.max(0, (l - lo) / (hi - lo)))
  return Math.pow(1 - t, gamma) * max
}

// Radius of a dot that inks `cover` of a pitch x pitch cell.
export const dotRadius = (cover, pitch) => Math.sqrt((cover * pitch * pitch) / Math.PI)

// Adds every dot of radius > min to the current path. The caller fills, so
// several lattices can share one fill.
export function traceDots(ctx, x, y, r, n, min) {
  for (let i = 0; i < n; i++) {
    const ri = r[i]
    if (ri <= min) continue
    ctx.moveTo(x[i] + ri, y[i])
    ctx.arc(x[i], y[i], ri, 0, Math.PI * 2)
  }
}

// Develop: each dot has an order in 0..1 and grows to full size as a front
// passes it. `p` runs 0 (nothing printed) to 1 (everything printed); `soft`
// is the width of the front, in order units.
export function develop(order, p, soft) {
  return Math.min(1, Math.max(0, (p * (1 + soft) - order) / soft))
}

const TAU = Math.PI * 2

// A screen that is redrawn at every stage of its development -- scrubbed by
// the scroll, or tweened on load. Tracing every dot every frame is what
// costs: rasterising thousands of anti-aliased arcs, frame after frame,
// while only the dots under the developing front are changing.
//
// So the dots are bucketed into square tiles. A tile whose dots have all
// finished growing is drawn from a cache of itself, one blit; a tile none of
// whose dots has started is skipped; only the tiles the front is crossing are
// traced dot by dot. Each tile's cache holds its own dots only, whole, with
// room for those that reach past its edge, and sits on the device-pixel grid
// -- so a blitted tile is pixel for pixel what tracing it would have drawn,
// and no seam shows where tiles meet. Caches are made when first needed and
// can be dropped when the screen is out of sight.
//
// `dots` is { x, y, r0, order, n } in CSS px, with an optional `ink` array of
// indexes into `colors` for a screen printed in more than one ink.
export function createDotLayer(dots, { dpr, colors, tile = 64, min = 0.2 }) {
  const { x, y, r0, order, n, ink } = dots
  const inkOf = (i) => (ink ? ink[i] : 0)

  const buckets = new Map()
  for (let i = 0; i < n; i++) {
    if (r0[i] <= min) continue
    const key = Math.floor(y[i] / tile) * 65536 + Math.floor(x[i] / tile)
    let list = buckets.get(key)
    if (!list) buckets.set(key, (list = []))
    list.push(i)
  }

  const tiles = Array.from(buckets.values(), (list) => {
    const idx = Int32Array.from(list)
    let lo = Infinity
    let hi = -Infinity
    let x0 = Infinity
    let y0 = Infinity
    let x1 = -Infinity
    let y1 = -Infinity
    for (const i of idx) {
      lo = Math.min(lo, order[i])
      hi = Math.max(hi, order[i])
      x0 = Math.min(x0, x[i] - r0[i])
      y0 = Math.min(y0, y[i] - r0[i])
      x1 = Math.max(x1, x[i] + r0[i])
      y1 = Math.max(y1, y[i] + r0[i])
    }
    // A device pixel of slack each side for the anti-aliased edge.
    const bx = Math.floor(x0 * dpr) - 1
    const by = Math.floor(y0 * dpr) - 1
    return {
      idx,
      lo,
      hi,
      bx,
      by,
      bw: Math.ceil(x1 * dpr) + 1 - bx,
      bh: Math.ceil(y1 * dpr) + 1 - by,
      cache: null,
    }
  })

  const cacheOf = (t) => {
    if (t.cache) return t.cache
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, t.bw)
    canvas.height = Math.max(1, t.bh)
    const c = canvas.getContext('2d')
    c.setTransform(dpr, 0, 0, dpr, -t.bx, -t.by)
    colors.forEach((color, k) => {
      c.fillStyle = color
      c.beginPath()
      for (const i of t.idx) {
        if (inkOf(i) !== k) continue
        c.moveTo(x[i] + r0[i], y[i])
        c.arc(x[i], y[i], r0[i], 0, TAU)
      }
      c.fill()
    })
    return (t.cache = canvas)
  }

  return {
    // Draws the screen at development `p` into a context set up by
    // fitCanvas. Does not clear it first.
    draw(ctx, p, soft) {
      if (p <= 0) return
      const full = p * (1 + soft) - soft
      const front = p * (1 + soft)
      const partial = []

      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      for (const t of tiles) {
        if (t.lo >= front) continue
        if (t.hi <= full) ctx.drawImage(cacheOf(t), t.bx, t.by)
        else partial.push(t)
      }
      ctx.restore()

      if (!partial.length) return
      colors.forEach((color, k) => {
        ctx.fillStyle = color
        ctx.beginPath()
        for (const t of partial) {
          for (const i of t.idx) {
            if (inkOf(i) !== k) continue
            const ri = r0[i] * develop(order[i], p, soft)
            if (ri <= min) continue
            ctx.moveTo(x[i] + ri, y[i])
            ctx.arc(x[i], y[i], ri, 0, TAU)
          }
        }
        ctx.fill()
      })
    },

    // Lets the caches go; they are made again if the screen is drawn again.
    release() {
      for (const t of tiles) t.cache = null
    },
  }
}

// Fits a canvas to its CSS box at device resolution (capped at 2x) and hands
// back a context drawing in CSS pixels.
export function fitCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const { width, height } = canvas.getBoundingClientRect()
  canvas.width = Math.max(1, Math.round(width * dpr))
  canvas.height = Math.max(1, Math.round(height * dpr))
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return { ctx, w: width, h: height, dpr }
}

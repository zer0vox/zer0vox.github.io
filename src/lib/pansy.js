// A pansy -- Viola x wittrockiana -- drawn as an engraving whose lines are
// sentences, for the blue plate of the about hero (HuePansy.jsx).
//
// Every line of the drawing is a line of type laid along a curve: the edges
// of the five petals, the rays of the face, the stem and one crenate leaf.
// (A nodding bud was tried and left out: at this size it read as a '?', and
// then as three loose phrases.) Each line swells toward its middle and tapers
// toward its ends
// like an engraver's stroke -- but never below a floor size, because under
// about 7px yellow type on the blue anti-aliases to lavender. The petals are
// stacked back to front, and a back petal's line stops just short of the one
// in front of it, the way an engraver leaves a gap at a T-junction.
//
// Only the page's own words are set: each part of the plant reads a line of
// the about page, and nothing else.
//
// This file is geometry, word-setting and placement, and dependency-free. It
// hands back plain data -- paths, letters and their sizes, all in plate
// pixels -- and HuePansy turns that into SVG and moves it.

export const FAMILY = 'EB Garamond Hue'

// Contours in the italic, which runs along a curve like a pen; the rays of
// the face in the roman, a size down; the eye in roman capitals. Hierarchy is
// size, weight and italic against roman only -- one ink, never an opacity.
export const STYLES = {
  line: ['italic', 500],
  ray: ['normal', 500],
  caps: ['normal', 600],
}

const WORDS = {
  stem: ['green keeps me grounded', 'Nepal', 'engineering', 'building'],
  lower: ['a tech enthusiast who loves to build', 'writing code', 'designing systems', 'turning an idea into something real'],
  upperL: ['art', 'music', 'the stories people carry'],
  upperR: ['I believe in consciousness', 'blue keeps me limitless'],
  latL: ['curious', 'creative', 'conscious'],
  latR: ['trying things', 'making mistakes', 'learning', 'moving on'],
  ray: ['learning', 'building', 'curious', 'art', 'music', 'engineering', 'conscious', 'creative', 'writing code', 'Nepal', 'designing systems'],
  eye: ['GREEN HUE BLUES'],
  leaf: ['trying things', 'making mistakes', 'learning', 'moving on'],
  rib: ['learning', 'building', 'writing code'],
}

/* ------------------------------------------------------------- geometry */

const D2R = Math.PI / 180
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1])
const clamp01 = (v) => Math.max(0, Math.min(1, v))
const add = (a, b) => [a[0] + b[0], a[1] + b[1]]

function polyLen(pts) {
  let s = 0
  for (let i = 1; i < pts.length; i++) s += dist(pts[i - 1], pts[i])
  return s
}

// Evenly spaced points along a polyline.
function resample(pts, step) {
  const out = [pts[0]]
  let carry = 0
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]
    const b = pts[i]
    const d = dist(a, b)
    let t = step - carry
    while (t <= d) {
      out.push([a[0] + ((b[0] - a[0]) * t) / d, a[1] + ((b[1] - a[1]) * t) / d])
      t += step
    }
    carry = d - (t - step)
  }
  const last = pts[pts.length - 1]
  if (dist(out[out.length - 1], last) > step * 0.3) out.push(last)
  return out
}

function inPoly(p, poly) {
  let c = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]
    const b = poly[j]
    if (a[1] > p[1] !== b[1] > p[1] && p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]) c = !c
  }
  return c
}

function distSeg(p, a, b) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const t = clamp01(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1))
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy)
}

function distPoly(p, poly) {
  let m = Infinity
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) m = Math.min(m, distSeg(p, poly[j], poly[i]))
  return m
}

const bez = (P0, C1, C2, P3, t) => {
  const u = 1 - t
  return [
    u * u * u * P0[0] + 3 * u * u * t * C1[0] + 3 * u * t * t * C2[0] + t * t * t * P3[0],
    u * u * u * P0[1] + 3 * u * u * t * C1[1] + 3 * u * t * t * C2[1] + t * t * t * P3[1],
  ]
}
const cubic = (P0, C1, C2, P3, n = 120) => Array.from({ length: n + 1 }, (_, i) => bez(P0, C1, C2, P3, i / n))

// One smooth cubic path through the points (Catmull-Rom), and its length
// from dense samples of it -- so no length is ever asked of the DOM.
function smoothPath(pts) {
  const f = (v) => v.toFixed(2)
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`
  let L = 0
  let prev = pts[0]
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] || p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`
    for (let k = 1; k <= 8; k++) {
      const q = bez(p1, c1, c2, p2, k / 8)
      L += dist(prev, q)
      prev = q
    }
  }
  return { d, L }
}

/* A petal is a polar fan from its own origin near the eye: t in [-1, 1]
   sweeps the fan's half-angle w; p sets how square its shoulders are, q how
   full its rim; a little skew, a ruffle, and on the lower petal a notch. */
function petalR(o, t) {
  let g = Math.pow(Math.max(0, 1 - Math.pow(Math.abs(t), o.p)), 1 / o.q)
  g *= 1 + (o.skew || 0) * t
  g *= 1 + (o.ruffle || 0) * Math.pow(1 - Math.abs(t), 0.8) * Math.sin((o.ruffles || 5) * Math.PI * t + (o.phase || 0))
  if (o.notch) g *= 1 - o.notch * Math.exp(-Math.pow((t - (o.notchAt || 0)) / 0.06, 2))
  return o.R * g
}

function petalPoly(o, N = 420) {
  const pts = []
  for (let i = 0; i <= N; i++) {
    const t = -1 + (2 * i) / N
    const th = (o.axis + t * o.w) * D2R
    const r = petalR(o, t)
    pts.push([o.ox + r * Math.cos(th), o.oy + r * Math.sin(th)])
  }
  return pts
}

/* The face, in its own units with the eye at the origin. Two upper petals at
   the back (the right one over the left), two whiskered side petals, and the
   broad lower petal in front. */
const PETALS = [
  { part: 'upperL', z: 0, ox: -6, oy: -10, axis: -119, w: 60, p: 2.1, q: 1.7, R: 160, skew: 0.1, ruffle: 0.026, ruffles: 5, phase: 0.4 },
  { part: 'upperR', z: 1, ox: 6, oy: -10, axis: -58, w: 60, p: 2.1, q: 1.7, R: 166, skew: -0.09, ruffle: 0.022, ruffles: 5, phase: 1.3 },
  { part: 'latL', z: 2, ox: -5, oy: 5, axis: 186, w: 46, p: 2.3, q: 1.9, R: 128, skew: 0.14, ruffle: 0.026, ruffles: 4, phase: 2.0 },
  { part: 'latR', z: 2, ox: 5, oy: 5, axis: -6, w: 46, p: 2.3, q: 1.9, R: 131, skew: -0.13, ruffle: 0.026, ruffles: 4, phase: 0.6 },
  { part: 'lower', z: 3, ox: 0, oy: 9, axis: 90, w: 66, p: 2.9, q: 1.55, R: 142, skew: 0.02, ruffle: 0.028, ruffles: 7, phase: 0.9, notch: 0.05, notchAt: 0.02, throat: 40 },
].map((p) => ({ ...p, local: petalPoly(p) }))

const EYE = [0, 5]
const THROAT = 30 // petal edges stop short of the eye; only the rays reach in

// The whiskers: fewer and longer than a real face has, so each can carry
// words at a legible size.
const RAYS = [
  { petal: 'lower', offs: [-34, -17, 0, 17, 34], lens: [0.52, 0.68, 0.8, 0.68, 0.52], inner: [34, 30, 28, 30, 34] },
  { petal: 'latL', offs: [-17, 0, 17], lens: [0.5, 0.66, 0.5], inner: [34, 30, 34] },
  { petal: 'latR', offs: [-17, 0, 17], lens: [0.5, 0.66, 0.5], inner: [34, 30, 34] },
]

// The face's box in its own units, for sizing and centring it.
const HEAD = (() => {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  PETALS.forEach((p) =>
    p.local.forEach(([x, y]) => {
      x0 = Math.min(x0, x)
      y0 = Math.min(y0, y)
      x1 = Math.max(x1, x)
      y1 = Math.max(y1, y)
    })
  )
  return { w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 }
})()

/* -------------------------------------------------------------- the plant
   Everything is built straight in plate pixels: the face is placed, scaled
   and turned by the plan, and the stem and leaf hang off it. So type
   sizes are pixels too, and the floors hold exactly. */

function frame(plan) {
  const c = Math.cos(plan.rot * D2R)
  const sn = Math.sin(plan.rot * D2R)
  const vec = (v) => [plan.s * (v[0] * c - v[1] * sn), plan.s * (v[0] * sn + v[1] * c)]
  const toPx = (p) => add([plan.x, plan.y], vec(p))
  return { vec, toPx }
}

const angleOf = (v) => Math.atan2(v[1], v[0]) / D2R

/* The leaf: ovate, widest below the middle, with the pansy's crenate edge --
   a few broad rounded teeth, smaller toward the tip, with a nick between each
   two. Every tooth is its own short line of type, a word or two that swells
   over the tooth, and the pen lifts at each nick -- so even at a glance the
   edge reads scalloped. (One line riding over the teeth crowded its letters
   together in every nick.) */
function leafShape(node, tangent, turn, s) {
  const LEN = 164 * s
  const WID = 86 * s
  const ax = (tangent + turn) * D2R
  const dir = [Math.cos(ax), Math.sin(ax)]
  const nrm = [-dir[1], dir[0]]
  const bend = -0.1 * Math.sign(turn) // the tip droops
  const base = add(node, [dir[0] * 22 * s, dir[1] * 22 * s])
  const centre = (u) => {
    const sway = bend * LEN * u * u
    return [base[0] + dir[0] * u * LEN + nrm[0] * sway, base[1] + dir[1] * u * LEN + nrm[1] * sway]
  }
  const halfW = (u) => (WID / 2) * Math.pow(Math.sin(Math.PI * Math.pow(clamp01(u), 0.72)), 0.85)

  const TEETH = 3
  const notch = Array.from({ length: TEETH + 1 }, (_, j) => 0.07 + 0.93 * Math.pow(j / TEETH, 0.8))
  const toothAt = (u) => {
    let j = 0
    while (j < TEETH - 1 && u > notch[j + 1]) j++
    return clamp01((u - notch[j]) / (notch[j + 1] - notch[j]))
  }
  // Each tooth a rounded bulge, the notch between two of them a sharp nick.
  const edge = (u, sg) => {
    const c = centre(u)
    const f = u < notch[0] ? 1 : 1 - 0.36 * (1 - Math.pow(Math.sin(Math.PI * toothAt(u)), 0.9))
    const h = halfW(u) * f * sg
    return [c[0] + nrm[0] * h, c[1] + nrm[1] * h]
  }

  const teeth = []
  ;[1, -1].forEach((sg) => {
    for (let j = 0; j < TEETH; j++) {
      const pts = Array.from({ length: 61 }, (_, i) => edge(notch[j] + ((notch[j + 1] - notch[j]) * i) / 60, sg))
      teeth.push({ pts, side: sg, j })
    }
  })
  const outline = []
  for (let i = 0; i <= 120; i++) outline.push(edge(i / 120, 1))
  for (let i = 120; i >= 0; i--) outline.push(edge(i / 120, -1))
  // the rib runs on out of the leaf as its stalk, to just short of the stem
  const rib = [add(node, [dir[0] * 9, dir[1] * 9])]
  for (let i = 0; i <= 60; i++) rib.push(centre((0.8 * i) / 60))
  return { base, dir, teeth, rib, outline }
}

/* Where everything is, for a plan: the petals, the eye, the stem, and the
   leaf if the plan keeps one. */
function skeleton(plan) {
  const { toPx } = frame(plan)
  const petals = PETALS.map((p) => ({ ...p, poly: p.local.map(toPx) }))
  const P0 = toPx([0, 12])
  let stem
  if (plan.mode === 'wide') {
    // Rooted out of frame: the stem runs on past the plate's foot.
    const D = plan.H + 40 - P0[1]
    stem = [P0, add(P0, [0.025 * D, 0.23 * D]), add(P0, [0.07 * D, 0.53 * D]), add(P0, [0.17 * D, D])]
  } else {
    // A cut flower: a short stalk that leaves the face's foot and sweeps
    // out to the side, and ends.
    stem = [P0, toPx([10, 124]), toPx([96, 166]), toPx([262, 150])]
  }
  const stemAt = (t) => bez(...stem, t)
  const stemTan = (t) => angleOf([stemAt(t + 0.01)[0] - stemAt(t - 0.01)[0], stemAt(t + 0.01)[1] - stemAt(t - 0.01)[1]])
  const leaf = plan.leaf ? leafShape(stemAt(plan.leaf.t), stemTan(plan.leaf.t), plan.leaf.turn, plan.s) : null
  return { petals, eye: toPx(EYE), stemPts: cubic(...stem, 220), leaf, toPx }
}

/* ------------------------------------------------------------- placement
   The plant is placed from the live boxes of the blue plate's own lockup and
   line: it keeps a gutter of max(60px, 5vw) from both, keeps the nav band
   clear, and shrinks until it fits. */

const distRect = (p, r) =>
  Math.hypot(Math.max(r.left - p[0], 0, p[0] - r.right), Math.max(r.top - p[1], 0, p[1] - r.bottom))

// Points that stand for the drawing when testing a placement, with the
// line's own half-height as padding.
function probe(sk, H) {
  const pts = []
  sk.petals.forEach((p) => {
    for (let i = 0; i < p.poly.length; i += 12) pts.push(p.poly[i])
  })
  if (sk.leaf) for (let i = 0; i < sk.leaf.outline.length; i += 4) pts.push(sk.leaf.outline[i])
  const stem = sk.stemPts.filter((q, i) => i % 4 === 0 && q[1] < H)
  return { pts, stem }
}

// Whether the probe points, moved by (dx, dy), keep clear of everything.
function fits({ pts, stem }, env, pad, wide, dx = 0, dy = 0) {
  const ok = (p, isStem) => {
    const x = p[0] + dx
    const y = p[1] + dy
    if (isStem && y >= env.H) return true
    if (y < env.top + pad) return false
    if (x < env.side + (isStem ? 0 : pad) || x > env.W - (isStem ? 8 : env.side + pad)) return false
    if (!isStem && y > env.bottom - pad) return false
    const q = [x, y]
    if (distRect(q, env.title) < env.gutter + pad) return false
    if (env.tag && distRect(q, env.tag) < env.gutter + pad) return false
    return true
  }
  return pts.every((p) => ok(p, false)) && stem.every((p) => ok(p, wide))
}

const clear = (plan, env) => fits(probe(skeleton(plan), env.H + 200), env, plan.pad, plan.mode === 'wide')

const OFFSETS = (() => {
  const out = []
  for (let dx = -140; dx <= 140; dx += 10) for (let dy = -100; dy <= 100; dy += 10) out.push([dx, dy])
  return out.sort((a, b) => Math.hypot(a[0], a[1] * 1.3) - Math.hypot(b[0], b[1] * 1.3))
})()

/* env: { W, H, title, tag, navBottom } -- the boxes in plate pixels.

   Two arrangements. Beside the lockup: the face in the empty upper right,
   the stem running off the plate's foot, a leaf off the stem. Above it: a cut
   flower in the band between the nav and the lockup -- on phones (<= 760px)
   always, and on a tall, narrow plate wherever it would draw the face much
   larger than beside. Returns null when nothing fits. */
export function placePansy(env0) {
  if (env0.W <= 760) return fit(env0, 'narrow')
  const wide = fit(env0, 'wide')
  // the band above the lockup is only tried where it could hold a face a
  // good deal larger than the one beside it
  const band = env0.title.top - Math.max(60, env0.W * 0.05) - Math.max(90, env0.navBottom)
  if (wide && (band * 0.98) / HEAD.h <= wide.s * 1.3) return wide
  const narrow = fit(env0, 'narrow')
  return narrow && (!wide || narrow.s > wide.s * 1.3) ? narrow : wide
}

function fit({ W, H, title, tag, navBottom }, mode) {
  const wide = mode === 'wide'
  const env = {
    W,
    H,
    title,
    tag,
    top: Math.max(90, navBottom),
    side: W > 760 ? Math.max(36, W * 0.03) : Math.max(16, W * 0.05),
    bottom: H - (wide ? 40 : 24),
    gutter: Math.max(60, W * 0.05),
  }

  let s0
  let anchor
  let options
  if (wide) {
    s0 = Math.min(400, Math.max(180, title.right - title.left) * 0.47) / HEAD.w
    anchor = [title.right + (W - title.right) * 0.4, (env.top + title.top) / 2 + H * 0.01]
    options = [
      { leaf: { t: 0.62, turn: 122 } },
      { leaf: { t: 0.62, turn: -122 } },
      { leaf: null },
    ]
  } else {
    const band = title.top - env.gutter - env.top
    if (band < 80) return null
    s0 = Math.min((band * 0.98) / HEAD.h, (W * 0.5) / HEAD.w, 360 / HEAD.w)
    anchor = [W * 0.37, env.top + band * 0.5]
    // no leaf: at a phone's size it only crowded the face
    options = [{ leaf: null }]
  }

  // Largest first; for each size the drawing is probed once at the anchor
  // and moved about it, nearest first, and only a position that clears is
  // drawn again exactly to confirm it.
  for (let f = 1; f >= 0.5; f -= 0.04) {
    const s = s0 * f
    const pad = (W > 760 ? 6 : 4) + 2 * s
    for (const opt of options) {
      const base = { mode, W, H, s, rot: wide ? -4 : -8, x: anchor[0] - s * HEAD.cx, y: anchor[1] - s * HEAD.cy, pad, ...opt }
      const pre = probe(skeleton(base), H + 200)
      for (const [dx, dy] of OFFSETS) {
        if (!fits(pre, env, pad, wide, dx, dy)) continue
        const plan = { ...base, x: base.x + dx, y: base.y + dy }
        if (clear(plan, env)) return plan
      }
    }
  }
  return null
}

/* --------------------------------------------------------------- setting */

// Advance widths of the face, per pixel of font size, from a canvas.
export function makeMeasure() {
  const ctx = document.createElement('canvas').getContext('2d')
  const cache = new Map()
  return (str, style) => {
    const key = style.join(' ')
    let m = cache.get(key)
    if (!m) cache.set(key, (m = new Map()))
    let w = m.get(str)
    if (w === undefined) {
      ctx.font = `${style[0]} ${style[1]} 100px "${FAMILY}"`
      w = ctx.measureText(str).width / 100
      m.set(str, w)
    }
    return w
  }
}

const SMALL = new Set(['a', 'an', 'the', 'to', 'on', 'in', 'into', 'me', 'who', 'I', 'it', 'one', 'keeps', 'loves', 'people'])

// The words a part reads, in order, with a point between phrases.
function stream(list, startAt = 0) {
  const toks = []
  list.forEach((ph) => {
    ph.split(' ').forEach((w) => toks.push(w))
    toks.push('·')
  })
  let i = startAt % toks.length
  return {
    peek: () => toks[i % toks.length],
    next: () => toks[i++ % toks.length],
    // a long line starts at the head of a phrase, never mid-sentence
    align: () => {
      if (toks.length > 2 && toks[(i - 1 + toks.length) % toks.length] !== '·' && i % toks.length !== 0) {
        while (toks[i % toks.length] !== '·') i++
        i++
      }
    },
    // words that can stand alone at the end of a line, and the last few
    // used that way, so the same one is not reached for every time
    words: [...new Set(toks.filter((t) => t !== '·' && !SMALL.has(t)))],
    recent: [],
    phrases: list,
    recentPhrases: [],
  }
}

// Words to fill a length, at the line's mean size.
function choose(L, st, style, size, measure, align) {
  if (align) st.align()
  const sp = measure(' ', style) * size
  const wd = (t) => measure(t, style) * size
  // A short line takes one whole phrase, where one fills most of it, rather
  // than a fragment of a longer one.
  if (!align) {
    let best = null
    let bw = 0
    st.phrases.forEach((ph) => {
      const w = wd(ph)
      if (w <= L && w > bw && !st.recentPhrases.includes(ph)) {
        best = ph
        bw = w
      }
    })
    if (best && bw >= L * 0.62) {
      st.recentPhrases = [best, ...st.recentPhrases].slice(0, 4)
      return best
    }
  }
  const words = []
  let w = 0
  for (let guard = 0; guard < 400; guard++) {
    const tok = st.peek()
    if (!words.length && tok === '·') {
      st.next()
      continue
    }
    const more = (words.length ? sp : 0) + wd(tok)
    if (w + more > L) break
    words.push(tok)
    if (tok !== '·') st.recent = [tok, ...st.recent].slice(0, 4)
    w += more
    st.next()
  }
  // A line never ends on a little word ("the", "in"): it would read as a
  // sentence broken off rather than one carried on.
  while (words.length > 1 && SMALL.has(words[words.length - 1])) {
    const t = words.pop()
    w -= sp + wd(t)
  }
  // The slack goes to the longest word that fits it, so lines end full -- set
  // off by a point, so it never reads as the end of the phrase before it.
  for (let k = 0; k < 4; k++) {
    const slack = L - w
    if (words.length && slack / Math.max(1, words.join(' ').length) < size * 0.05) break
    const lead = !words.length ? 0 : words[words.length - 1] === '·' ? sp : 2 * sp + wd('·')
    let best = null
    let bw = 0
    for (const fresh of [true, false]) {
      for (const t of st.words) {
        if (fresh && (st.recent.includes(t) || words.includes(t))) continue
        const more = lead + wd(t)
        if (more <= slack && more > bw) {
          best = t
          bw = more
        }
      }
      if (best) break
    }
    if (!best) break
    if (words.length && words[words.length - 1] !== '·') words.push('·')
    words.push(best)
    st.recent = [best, ...st.recent].slice(0, 4)
    w += bw
  }
  if (words[words.length - 1] === '·') words.pop()
  return words.join(' ')
}

// A stroke's swell, 0 at the ends of a line and 1 at its fullest.
const SWELL = {
  contour: (u) => Math.pow(Math.sin(Math.PI * clamp01(u)), 0.5),
  ray: (u) => Math.pow(Math.sin(Math.PI * Math.pow(clamp01(u), 0.7)), 0.7),
  flat: (u) => Math.pow(Math.sin(Math.PI * clamp01(u)), 0.3),
  none: () => 1,
}

// Sizes in quarter pixels, so lines share sizes and runs of equal letters
// can be set as one span.
const quarter = (v) => Math.round(v * 4) / 4

// Per-letter sizes, and one tracking value in em, that run a line the
// contour's exact length.
function setLine(str, style, sizeAt, L, measure) {
  const chars = [...str]
  const adv = chars.map((ch) => measure(ch, style))
  let sizes = adv.map(() => sizeAt(0.5))
  let k = 0.02
  for (let it = 0; it < 6; it++) {
    let s = 0
    const centres = adv.map((a, i) => {
      const w = sizes[i] * (a + k)
      const c = s + w / 2
      s += w
      return c
    })
    sizes = centres.map((c) => sizeAt(c / L))
    let A = 0
    let Z = 0
    sizes.forEach((z, i) => {
      A += z * adv[i]
      Z += z
    })
    k = (L - A) / Z
  }
  return { chars, sizes, k, adv }
}

// Short lines are not stretched to fill: past this much tracking a line is
// set at its own length instead, held to one end of its contour (or centred
// on it).
const MAX_TRACK = 0.08

// Pick the reading direction of a stretch: left to right where it can be,
// downward where it is steep.
function orient(pts, prefer) {
  if (prefer === 'keep') return { pts, flipped: false }
  const a = pts[0]
  const b = pts[pts.length - 1]
  let mx = b[0] - a[0]
  let my = b[1] - a[1]
  if (Math.hypot(mx, my) < 1e-3) {
    mx = 1
    my = 0
  }
  let keep = Math.abs(mx) >= Math.abs(my) * 0.4 ? mx >= 0 : my >= 0
  if (prefer === 'down') keep = my >= 0 || mx > Math.abs(my) * 2
  return keep ? { pts, flipped: false } : { pts: pts.slice().reverse(), flipped: true }
}

// The stretches of a line that nothing in front of it hides.
function visibleRuns(pts, occ, margin, minLen = 14) {
  occ.forEach((o) => {
    if (!o.poly || o.box) return
    o.poly = resample(o.poly, 2.5)
    const xs = o.poly.map((q) => q[0])
    const ys = o.poly.map((q) => q[1])
    o.box = [Math.min(...xs) - margin, Math.min(...ys) - margin, Math.max(...xs) + margin, Math.max(...ys) + margin]
  })
  const hides = (p, o) => {
    if (o.circle) return dist(p, o.circle.c) < o.circle.r
    const b = o.box
    if (p[0] < b[0] || p[1] < b[1] || p[0] > b[2] || p[1] > b[3]) return false
    return inPoly(p, o.poly) || distPoly(p, o.poly) < margin
  }
  const out = []
  let cur = []
  pts.forEach((p) => {
    if (!occ.some((o) => hides(p, o))) cur.push(p)
    else {
      if (cur.length > 1) out.push(cur)
      cur = []
    }
  })
  if (cur.length > 1) out.push(cur)
  return out.filter((r) => polyLen(r) >= minLen)
}

// Break a contour wherever its words would run upside down for a stretch,
// so every piece reads upright; the pieces meet tapered, like a pen lifted
// and set down again.
function splitUpright(pts, minRun, gap = 4) {
  const P = resample(orient(pts).pts, 2)
  const n = P.length
  const flag = P.map((p, i) => {
    const a = P[Math.max(0, i - 2)]
    const b = P[Math.min(n - 1, i + 2)]
    const dx = b[0] - a[0]
    return dx / (Math.hypot(dx, b[1] - a[1]) || 1) < -0.42
  })
  const segs = []
  flag.forEach((f, i) => {
    const last = segs[segs.length - 1]
    if (last && last.f === f) last.b = i
    else segs.push({ f, a: i, b: i })
  })
  let changed = true
  while (changed && segs.length > 1) {
    changed = false
    for (let i = 0; i < segs.length; i++) {
      if ((segs[i].b - segs[i].a) * 2 < minRun) {
        const nb = segs[i - 1] || segs[i + 1]
        nb.a = Math.min(nb.a, segs[i].a)
        nb.b = Math.max(nb.b, segs[i].b)
        segs.splice(i, 1)
        for (let j = 1; j < segs.length; j++) {
          if (segs[j].f === segs[j - 1].f) {
            segs[j - 1].b = segs[j].b
            segs.splice(j, 1)
            j--
          }
        }
        changed = true
        break
      }
    }
  }
  const g = Math.round(gap / 2)
  return segs
    .map((sg, k) => {
      const piece = P.slice(sg.a + (k > 0 ? g : 0), sg.b - (k < segs.length - 1 ? g : 0) + 1)
      return sg.f ? piece.reverse() : piece
    })
    .filter((pc) => pc.length > 4)
}

/* The drawing for a plan: every line of type, in plate pixels.

   Each run is { part, lane, seq, grow, kind, style, d, L, pad, k, base,
   letters: [{ ch, size }], words: [{ a, b, min }], full }. `part`, `lane` and
   `seq` say when it is written (parts in order, lanes at once, a lane's runs
   one after another), `grow` which end the pen starts from, and `words` which
   of its words are set large enough to be written again later. */
export function composePansy(plan, measure) {
  const sk = skeleton(plan)
  const { s } = plan
  // Type follows the face's size, between a floor a phone can still read
  // and a cap past which the lines would turn from engraving into lettering.
  const floor = plan.W > 760 ? 7 : 6.5
  const headPx = HEAD.w * s
  const full = Math.min(12.5, Math.max(7.75, headPx * 0.039, 6.5 + headPx * 0.012))
  const SIZE = {
    line: full,
    stem: Math.max(floor + 0.75, full * 0.9),
    leaf: Math.max(floor + 0.5, full * 0.92),
    ray: Math.max(floor + 0.75, full * 0.8),
  }
  const gap = 0.55 * full + 3 // the T-junction: a back line stops this far short of a front one

  const runs = []
  const seqOf = {}

  function addRun(pts, o) {
    if (o.split) {
      const pieces = splitUpright(pts, 30)
      return pieces.map((pc) => addRun(pc, { ...o, split: false, prefer: 'keep' })).find(Boolean) || null
    }
    const { pts: P, flipped } = orient(pts, o.prefer)
    const { d, L: Ltot } = smoothPath(resample(P, 3))
    let pad = o.pad ?? 1
    let L = Ltot * 0.998 - pad * 2
    let swell = SWELL[o.swell || 'contour']
    if (flipped && o.swellFromStart) {
      const f = swell
      swell = (u) => f(1 - u)
    }
    const top = o.size
    const low = Math.min(top, Math.max(floor, o.low ?? floor))
    const sizeAt = (u) => quarter(low + (top - low) * swell(u))
    let mean = 0
    for (let i = 0; i < 32; i++) mean += sizeAt((i + 0.5) / 32) / 32
    if (L < mean * 2.4) return null
    const str = o.text || choose(L * (o.fill ?? 1), o.stream, o.style, mean, measure, L > 110)
    if (!str) return null
    let { chars, sizes, k, adv } = setLine(str, o.style, sizeAt, L, measure)
    const anchor = typeof o.anchor === 'function' ? o.anchor({ flipped }) : o.anchor
    if (anchor && k > MAX_TRACK) {
      let L2 = L
      for (let it = 0; it < 3; it++) {
        L2 = sizes.reduce((n, z, i) => n + z * (adv[i] + MAX_TRACK), 0)
        ;({ sizes, k } = setLine(str, o.style, sizeAt, L2, measure))
      }
      pad += anchor === 'end' ? L - L2 : anchor === 'middle' ? (L - L2) / 2 : 0
      L = L2
    }

    const words = []
    let a = 0
    chars.forEach((ch, i) => {
      if (ch === ' ' || i === chars.length - 1) {
        const b = ch === ' ' ? i : i + 1
        const w = chars.slice(a, b).join('')
        if (w && w !== '·') words.push({ a, b, min: Math.min(...sizes.slice(a, b)), n: w.length })
        a = i + 1
      }
    })
    const lane = o.lane ?? o.part
    const key = `${o.part}/${lane}`
    seqOf[key] = (seqOf[key] ?? 0) + 1
    const grow = o.grow ? o.grow({ flipped, first: P[0], last: P[P.length - 1] }) : 1
    const run = {
      part: o.part,
      lane,
      seq: o.seq ?? seqOf[key],
      grow,
      kind: o.kind || 'line',
      style: o.style,
      base: o.base ?? 0.2,
      d,
      L,
      pad,
      k,
      letters: chars.map((ch, i) => ({ ch, size: sizes[i] })),
      words,
      full: top,
    }
    runs.push(run)
    return run
  }

  /* the face: each petal's edge wherever nothing in front of it hides it */
  sk.petals.forEach((p, pi) => {
    const occ = sk.petals.filter((q) => q.z > p.z).map((q) => ({ poly: q.poly }))
    occ.push({ circle: { c: sk.eye, r: (p.throat || THROAT) * s } })
    const st = stream(WORDS[p.part], pi * 3)
    visibleRuns(resample(p.poly, 1.2), occ, gap).forEach((pts) =>
      addRun(pts, { part: p.part, style: STYLES.line, size: SIZE.line, stream: st, split: true, anchor: 'middle' })
    )
  })

  /* the rays of the face, fanning from the eye; each is written outward */
  const rst = stream(WORDS.ray)
  let rayN = 0
  RAYS.forEach((v) => {
    const p = sk.petals.find((q) => q.part === v.petal)
    v.offs.forEach((off, i) => {
      const t = off / p.w
      const th = (p.axis + off) * D2R
      const rEdge = petalR(p, t)
      const inner = v.inner[i]
      const r1 = Math.max(inner + 20, rEdge * v.lens[i])
      const bend = Math.sign(off) * 0.06 * (r1 - inner)
      const a = sk.toPx([p.ox + inner * Math.cos(th), p.oy + inner * Math.sin(th)])
      const b = sk.toPx([p.ox + r1 * Math.cos(th), p.oy + r1 * Math.sin(th)])
      const m0 = sk.toPx([
        p.ox + ((inner + r1) / 2) * Math.cos(th) - Math.sin(th) * bend,
        p.oy + ((inner + r1) / 2) * Math.sin(th) + Math.cos(th) * bend,
      ])
      const pts = []
      for (let k = 0; k <= 30; k++) {
        const q = k / 30
        const u = 1 - q
        pts.push([u * u * a[0] + 2 * u * q * m0[0] + q * q * b[0], u * u * a[1] + 2 * u * q * m0[1] + q * q * b[1]])
      }
      addRun(pts, {
        part: 'ray',
        lane: rayN++,
        kind: 'ray',
        style: STYLES.ray,
        size: SIZE.ray,
        stream: rst,
        pad: 0.5,
        swell: 'ray',
        swellFromStart: true,
        prefer: v.petal === 'lower' ? 'down' : null,
        anchor: ({ flipped }) => (flipped ? 'end' : 'start'),
        grow: ({ flipped }) => (flipped ? -1 : 1),
      })
    })
  })

  /* the eye: one legible ring of capitals if it fits the face, else a plain
     small ring */
  let ring = null
  {
    const caps = `${WORDS.eye[0]} · `
    const z = Math.max(floor, full * 0.62)
    const track = 0.14
    const circ = [...caps].reduce((sum, ch) => sum + z * (measure(ch, STYLES.caps) + track), 0)
    const r = circ / (2 * Math.PI)
    if (r <= 19 * s) {
      const pts = []
      for (let k = 0; k <= 160; k++) {
        const ang = (-200 + (360 * k) / 160) * D2R
        pts.push([sk.eye[0] + r * Math.cos(ang), sk.eye[1] + r * Math.sin(ang)])
      }
      addRun(pts, {
        part: 'eye',
        kind: 'caps',
        style: STYLES.caps,
        size: z,
        low: z,
        swell: 'none',
        text: caps.trim(),
        pad: 0.5,
        prefer: 'keep',
        base: 0.33,
      })
    } else {
      ring = { c: sk.eye, r: Math.max(4.5, 7 * s) }
    }
  }

  /* the stem, behind the face; written from the ground up */
  {
    const occ = sk.petals.map((q) => ({ poly: q.poly }))
    const pts = sk.stemPts.filter((q) => q[1] < plan.H + 24)
    const vis = visibleRuns(resample(pts, 1.5), occ, gap * 0.8)
    const st = stream(WORDS.stem)
    vis.forEach((r, i) =>
      addRun(r, {
        part: 'stem',
        seq: vis.length - i,
        style: STYLES.line,
        size: SIZE.stem,
        stream: st,
        prefer: 'down',
        swell: 'flat',
        // a short line keeps to the plate's foot on a rooted stem, and to the
        // face on a cut one, where it simply ends short of the cut
        anchor: plan.mode === 'wide' ? 'end' : 'start',
        grow: ({ flipped }) => (flipped ? 1 : -1),
      })
    )
  }

  /* the leaf: a tooth at a time from its base to its tip, both edges at once */
  if (sk.leaf) {
    const lf = sk.leaf
    const st = stream(WORDS.leaf)
    const along = (q) => (q[0] - lf.base[0]) * lf.dir[0] + (q[1] - lf.base[1]) * lf.dir[1]
    // words go on in reading order, which on an edge that reads from the
    // tip back is the teeth in reverse
    const backward = (sg) => orient(lf.teeth.filter((t) => t.side === sg).flatMap((t) => t.pts)).flipped
    const order = [1, -1].flatMap((sg) => {
      const teeth = lf.teeth.filter((t) => t.side === sg)
      return backward(sg) ? teeth.reverse() : teeth
    })
    order.forEach((tooth) => {
      // the pen lifts at each nick
      const P = resample(tooth.pts, 1)
      const trim = Math.round(1.5 + full * 0.2)
      addRun(P.slice(trim, P.length - trim), {
        part: 'leaf',
        lane: tooth.side,
        seq: tooth.j,
        style: STYLES.line,
        size: SIZE.leaf,
        stream: st,
        pad: 0.5,
        anchor: 'middle',
        grow: ({ first, last }) => (along(last) >= along(first) ? 1 : -1),
      })
    })
    addRun(lf.rib, {
      part: 'leaf',
      lane: 'rib',
      kind: 'ray',
      style: STYLES.ray,
      size: SIZE.ray,
      stream: stream(WORDS.rib),
      swell: 'ray',
      swellFromStart: true,
      anchor: ({ flipped }) => (flipped ? 'end' : 'start'),
      grow: ({ flipped }) => (flipped ? -1 : 1),
    })
  }

  return { runs, ring, words: runs.reduce((n, r) => n + r.words.length, 0) }
}

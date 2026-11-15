import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { getLenis } from '../lib/lenis.js'
import {
  createDotLayer,
  dotRadius,
  fitCanvas,
  inkCover,
  loadLuma,
  lumaFromText,
  sampleLuma,
  screenLattice,
} from '../lib/halftone.js'
import { PLATE_TONE, POLE, SUN, platePitch, plateSrc } from '../lib/plate.js'
import nightSrc from '../assets/philosophy/print/night.webp'
import handsSrc from '../assets/philosophy/print/hands.webp'
// "Bottom view of concrete spiral stair" by Len Cruz, Unsplash License; the
// same photograph as the home page's Logic panel (credited in Home.jsx).
import stairSrc from '../assets/philosophy/print/stair.webp'
import duskSrc from '../assets/philosophy/print/dusk.webp'
import './MethodPress.css'

gsap.registerPlugin(ScrollTrigger)

// The method, run on a press. A tall track with a sheet pinned to the screen
// while it is read, as the work spread is on the home page: the stage's copy
// on the left, a plate in the middle printing what the stage means, and a
// thumb index at the fore-edge, past the band, to jump between stages.
//
// The plate is the hero's print, made again from nothing:
//   01 Notice    -- only the snag, magnified four times in a loupe, with a
//                   leader to where it sits on the plate.
//   02 Gather    -- a contact sheet of things collected without judging:
//                   a stairwell, the night ridge, a number, hands, a dusk,
//                   and the ridge itself among them.
//   03 Stillness -- nothing. The page is left blank.
//   04 Ratio     -- the golden construction is ruled across the empty plate,
//                   and its spiral comes to rest on the snag.
//   05 Make      -- the butter plate goes down, then the halftone develops
//                   square by square from the smallest, at the snag, out;
//                   each rule is taken away once its square is printed.
//   06 Release   -- the last of the construction goes, and the print goes
//                   out unexplained.
//
// Everything is scrubbed, so it all reverses. Each stage holds still for most
// of its stretch of the scroll -- the copy is there to be read -- and moves
// only between stages. Reduced motion gets each stage whole, cut rather than
// dissolved, with the same index to reach it by.

const STAGES = [
  {
    n: '01', label: 'Notice', cue: 'Stage one: the snag',
    body: "Nothing starts as an idea. It starts as a snag: a ratio in a stairwell, a colour on a ridge at five in the morning, a sentence overheard wrong. I write it down before I understand it, because understanding it early is how you lose it."
  },
  {
    n: '02', label: 'Gather', cue: 'Stage two: the archive',
    body: "Then I collect without judging. Photographs, fragments, numbers, other people's work. The archive is allowed to be incoherent for a very long time. Sorting it too soon only preserves the categories I already had."
  },
  {
    n: '03', label: 'Stillness', cue: 'Stage three: refusal',
    body: "And then I leave it alone. The work of this stage is refusal: not touching the thing until it asks to be touched. Weeks, usually. Whatever survives the silence was worth making."
  },
  {
    n: '04', label: 'Ratio', cue: 'Stage four: structure',
    body: "Structure comes before surface. I look for the proportion the idea already wants: where it divides, where it repeats, where it stops. Get the division right and the styling has almost nothing left to decide."
  },
  {
    n: '05', label: 'Make', cue: 'Stage five: material',
    body: "Only now, materials. I build the smallest version that can be wrong, show it to two people, and then keep removing until nothing else can come out without the thing falling over."
  },
  {
    n: '06', label: 'Release', cue: 'Stage six: and around again',
    body: "It goes out unexplained. If it needs a paragraph to stand up, it isn't finished. By the time anyone sees it I've stopped looking at it. I'm already noticing the next one."
  },
]

const LAST = STAGES.length - 1

// Of each stage's stretch of scroll, the part held still either side of it.
const HOLD = 0.3

// Steps of scroll after the last stage arrives, before the sheet unpins, so
// Release is held as long as the others. MethodPress.css sizes the track for
// LAST + TAIL steps.
const TAIL = 0.5

const clamp01 = (v) => Math.min(1, Math.max(0, v))
const smooth = (t) => t * t * (3 - 2 * t)

// Scroll position (0..LAST) to stage position: flat at every stage, eased
// between them.
function staged(x) {
  if (x >= LAST) return LAST
  const k = Math.floor(x)
  return k + smooth(clamp01((x - k - HOLD) / (1 - 2 * HOLD)))
}

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// ── Geometry ──────────────────────────────────────────────────────────────
// Everything on the plate is laid out in its own units: 1000 across, 1618
// down. Canvas positions are the same fractions of the plate's pixel size.
const VB_W = 1000
const VB_H = 1618
const PHI = (1 + Math.sqrt(5)) / 2

// The golden construction: ten squares cut from the rectangle, top, left,
// bottom, right and round again, each carrying a quarter of the spiral. The
// spiral enters each square where it left the last and turns 90 degrees
// anticlockwise about the square's inner corner, so it closes on the pole.
const DEPTH = 10
const SQUARES = (() => {
  let x0 = 0
  let y0 = 0
  let w = VB_W
  let h = VB_H
  let at = [VB_W, 0]
  const out = []
  for (let k = 0; k < DEPTH; k++) {
    const s = Math.min(w, h)
    let x, y, cx, cy
    switch (k % 4) {
      case 0: x = x0; y = y0; cx = x0 + s; cy = y0 + s; y0 += s; h -= s; break
      case 1: x = x0; y = y0; cx = x0 + s; cy = y0; x0 += s; w -= s; break
      case 2: x = x0; y = y0 + h - s; cx = x0; cy = y0 + h - s; h -= s; break
      default: x = x0 + w - s; y = y0; cx = x0 + w - s; cy = y0 + s; w -= s
    }
    const a0 = Math.atan2(at[1] - cy, at[0] - cx)
    const to = [cx + s * Math.cos(a0 - Math.PI / 2), cy + s * Math.sin(a0 - Math.PI / 2)]
    out.push({ x, y, s, cx, cy, a0, from: at, to })
    at = to
  }
  return out
})()

const SPIRAL_D = SQUARES.reduce(
  (d, q) => `${d} A${q.s.toFixed(2)} ${q.s.toFixed(2)} 0 0 0 ${q.to[0].toFixed(2)} ${q.to[1].toFixed(2)}`,
  `M${VB_W} 0`
)

// Make prints the squares from the inside out, the smallest first. Each gets
// a span of the stage in proportion to the square root of its side, so the
// tiny squares round the snag do not go by in a blink and the largest does
// not take half the stage. Index DEPTH is what is left inside the last one.
const MAKE_SPANS = (() => {
  const inner = [DEPTH, ...SQUARES.map((_, k) => DEPTH - 1 - k)]
  const weight = (k) => Math.sqrt(k === DEPTH ? SQUARES[DEPTH - 1].s / PHI : SQUARES[k].s)
  const total = inner.reduce((sum, k) => sum + weight(k), 0)
  const spans = []
  let t = 0
  inner.forEach((k) => {
    spans[k] = [t / total, (t + weight(k)) / total]
    t += weight(k)
  })
  return spans
})()

// Which square a point (in plate units) falls in, and how far along that
// square's arc it lies, from the inner end (0) to the outer (1).
function squareOf(vx, vy) {
  for (let k = 0; k < DEPTH; k++) {
    const q = SQUARES[k]
    if (vx >= q.x && vx < q.x + q.s && vy >= q.y && vy < q.y + q.s) {
      let d = q.a0 - Math.atan2(vy - q.cy, vx - q.cx)
      d = ((d % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
      return { k, along: 1 - clamp01(d / (Math.PI / 2)) }
    }
  }
  return { k: DEPTH, along: 0 }
}

// The loupe: a circle in the sky, showing the snag four times over.
const LOUPE = { x: 0.37, y: 0.29, r: 0.3, mag: 4 }
const RING_R = 34

// The leader runs from the ring on the snag to the loupe's rim.
const LEADER_D = (() => {
  const px = POLE * VB_W
  const py = POLE * VB_H
  const cx = LOUPE.x * VB_W
  const cy = LOUPE.y * VB_H
  const len = Math.hypot(cx - px, cy - py)
  const ux = (cx - px) / len
  const uy = (cy - py) / len
  const r = LOUPE.r * VB_W
  return `M${(px + ux * RING_R).toFixed(1)} ${(py + uy * RING_R).toFixed(1)} L${(cx - ux * r).toFixed(1)} ${(cy - uy * r).toFixed(1)}`
})()

// The contact sheet, in plate widths (so y runs to 1.618).
// The two night frames are pushed a stop, as a printer would for a dark
// original: on the frames' curve they print as near-solid blocks.
const PUSHED = { lo: 0, hi: 0.55, gamma: 0.85, max: 0.8 }

const FRAMES = [
  { src: 'stair', x: 0.07, y: 0.08, w: 0.4, aspect: 1 },
  { src: 'night', x: 0.53, y: 0.13, w: 0.4, aspect: 4 / 3, tone: PUSHED },
  { src: 'number', x: 0.07, y: 0.6, w: 0.36, aspect: 4 / 3 },
  { src: 'hands', x: 0.49, y: 0.56, w: 0.44, aspect: 4 / 3, tone: PUSHED },
  { src: 'dusk', x: 0.07, y: 0.98, w: 0.46, aspect: 16 / 9 },
  // The ridge itself, filed with the rest: a 3:4 cut round the summit and
  // the snag.
  { src: 'plate', x: 0.6, y: 0.98, w: 0.3, aspect: 3 / 4, crop: [0.3, 0.36, 0.5, 0.41], tone: PLATE_TONE },
]
const frameH = (f) => f.w / f.aspect

// ── Printing ──────────────────────────────────────────────────────────────

// Fronts, in order units: how far behind the leading edge a dot reaches
// full size.
const SOFT_LOUPE = 0.25
const SOFT_FRAMES = 0.12
const SOFT_MAKE = 0.05

// The finished plate, ordered for Make: by square from the inside out, and
// along each square's arc.
function mainSet(plate, w, h, pitch) {
  const lat = screenLattice(w, h, pitch)
  const r0 = new Float32Array(lat.n)
  const order = new Float32Array(lat.n)
  for (let i = 0; i < lat.n; i++) {
    const u = lat.x[i] / w
    const v = lat.y[i] / h
    r0[i] = dotRadius(inkCover(sampleLuma(plate, u, v), PLATE_TONE), pitch)
    const { k, along } = squareOf(u * VB_W, v * VB_H)
    const [a, b] = MAKE_SPANS[k]
    order[i] = a + along * (b - a)
  }
  return { x: lat.x, y: lat.y, r0, order, n: lat.n }
}

// The loupe: a finer screen over the circle, each dot reading the plate at
// the snag plus its offset from the loupe's centre over the magnification.
function loupeSet(plate, w, h, pitch) {
  const cx = LOUPE.x * w
  const cy = LOUPE.y * h
  const R = LOUPE.r * w
  const px = POLE * w
  const py = POLE * h
  const fine = Math.max(3.4, pitch * 0.8)
  const lat = screenLattice(2 * R, 2 * R, fine)
  const xs = []
  const ys = []
  const rs = []
  const os = []
  for (let i = 0; i < lat.n; i++) {
    const dx = lat.x[i] - R
    const dy = lat.y[i] - R
    const d = Math.hypot(dx, dy)
    if (d > R - fine * 0.35) continue
    const l = sampleLuma(plate, (px + dx / LOUPE.mag) / w, (py + dy / LOUPE.mag) / h)
    xs.push(cx + dx)
    ys.push(cy + dy)
    rs.push(dotRadius(inkCover(l, PLATE_TONE), fine))
    os.push(d / R)
  }
  return { x: Float32Array.from(xs), y: Float32Array.from(ys), r0: Float32Array.from(rs), order: Float32Array.from(os), n: xs.length }
}

// The contact sheet. Frames come up one after another, each from its head.
// The archive's pictures are darker than the plate, so by default they take
// a gentler curve than it; a frame can carry its own.
const FRAME_TONE = { lo: 0.02, hi: 0.86, gamma: 1.1, max: 0.8 }

function framesSet(sources, w, pitch) {
  const fine = Math.max(3.2, pitch * 0.72)
  const xs = []
  const ys = []
  const rs = []
  const os = []
  FRAMES.forEach((f, fi) => {
    const luma = sources[f.src]
    if (!luma) return
    const fw = f.w * w
    const fh = frameH(f) * w
    const lat = screenLattice(fw, fh, fine)
    const [u0, v0, uw, vh] = f.crop ?? [0, 0, 1, 1]
    for (let i = 0; i < lat.n; i++) {
      const lx = lat.x[i]
      const ly = lat.y[i]
      if (lx > fw || ly > fh) continue
      const l = sampleLuma(luma, u0 + (lx / fw) * uw, v0 + (ly / fh) * vh)
      xs.push(f.x * w + lx)
      ys.push(f.y * w + ly)
      rs.push(dotRadius(inkCover(l, f.tone ?? FRAME_TONE), fine))
      os.push((fi + (ly / fh) * 0.9) / FRAMES.length)
    }
  })
  return { x: Float32Array.from(xs), y: Float32Array.from(ys), r0: Float32Array.from(rs), order: Float32Array.from(os), n: xs.length }
}

// The scroll over which the stages turn: the track's pinned travel, less the
// tail that holds the last of them.
const stageSpan = (track) => ((track.offsetHeight - window.innerHeight) * LAST) / (LAST + TAIL)

export default function MethodPress() {
  const trackRef = useRef(null)

  // Thumb index: to the middle of that stage's hold.
  const goTo = (k) => {
    const track = trackRef.current
    if (!track) return
    const top = track.getBoundingClientRect().top + window.scrollY
    const y = top + (k / LAST) * stageSpan(track)
    const lenis = getLenis()
    if (lenis) lenis.scrollTo(y, { duration: 1.4 })
    else window.scrollTo(0, y)
  }

  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track) return undefined
    const reduced = reducedMotion()

    const q = (s) => track.querySelector(s)
    const qa = (s) => Array.from(track.querySelectorAll(s))
    const canvas = q('.mp-print')
    const items = qa('.mp-item')
    const thumbs = qa('.mp-thumb')
    const count = q('.mp-count-now')
    const squares = qa('.mp-square')
    const frames = qa('.mp-frame')
    const el = {
      ring: q('.mp-ring'),
      loupe: q('.mp-loupe'),
      reticle: q('.mp-reticle'),
      leader: q('.mp-leader'),
      dims: q('.mp-dims'),
      dimLabels: qa('.mp-l-dim'),
      spiral: q('.mp-spiral'),
      forme: q('.mp-forme'),
      sun: q('.mp-sun'),
    }

    const state = { x: 0 }
    const sources = {}
    let surface = null
    let layers = null
    let painted = ''
    let shown = -1
    let cancelled = false

    const build = () => {
      if (!sources.plate) return
      surface = fitCanvas(canvas)
      const { w, h, dpr } = surface
      const pitch = platePitch(w)
      const layer = (set) => createDotLayer(set, { dpr, colors: [getComputedStyle(canvas).color] })
      layers = {
        loupe: layer(loupeSet(sources.plate, w, h, pitch)),
        frames: layer(framesSet(sources, w, pitch)),
        main: layer(mainSet(sources.plate, w, h, pitch)),
      }
      painted = ''
      render()
    }

    // Repainted only when a screen's development has moved: a stage's hold
    // scrolls by without touching the canvas. A screen out of sight lets its
    // caches go.
    const paint = (e0, e1, make) => {
      if (!surface || !layers) return
      const key = `${e0}|${e1}|${make}`
      if (key === painted) return
      painted = key
      const { ctx, w, h } = surface
      ctx.clearRect(0, 0, w, h)
      const runs = [
        [layers.loupe, e0, SOFT_LOUPE],
        [layers.frames, e1, SOFT_FRAMES],
        [layers.main, make, SOFT_MAKE],
      ]
      for (const [layer, p, soft] of runs) {
        if (p > 0) layer.draw(ctx, p, soft)
        else layer.release()
      }
    }

    const show = (node, v) => {
      node.style.opacity = v.toFixed(3)
    }
    const draw = (node, v) => {
      node.style.setProperty('--draw', v.toFixed(4))
    }

    function render() {
      const p = reduced ? Math.round(state.x) : staged(state.x)
      const e0 = clamp01(1 - p)
      const e1 = clamp01(1 - Math.abs(p - 1))
      const ratio = clamp01(p - 2)
      const make = clamp01(p - 3)
      const release = clamp01(p - 4)

      paint(e0, e1, make)

      // Notice: the loupe is drawn round, then the leader runs down to the
      // ring. Ratio brings the ring back as the pole.
      draw(el.loupe, e0)
      draw(el.leader, clamp01((e0 - 0.35) / 0.65))
      show(el.reticle, clamp01((e0 - 0.6) / 0.4))
      const pole = clamp01((ratio - 0.55) / 0.3) * (1 - release)
      draw(el.ring, Math.max(clamp01((e0 - 0.2) / 0.5), pole))

      // Gather: each frame's rule with its print.
      frames.forEach((node, i) => {
        show(node, clamp01(e1 * 1.6 - (i / FRAMES.length) * 0.9))
      })

      // Ratio: the dimensions, then the squares largest first, then the
      // spiral. Make takes each square's rules away once it is printed;
      // Release takes the spiral.
      const dims = clamp01((ratio - 0.05) / 0.35) * (1 - clamp01(make * 4))
      show(el.dims, dims)
      el.dimLabels.forEach((node) => show(node, dims))
      // The largest square's span ends with Make itself, so its rules are
      // the last of the construction to go: with the spiral, on Release.
      squares.forEach((node, k) => {
        draw(node, clamp01((ratio - k * 0.045) / 0.3))
        show(node, (1 - clamp01((make - MAKE_SPANS[k][1]) / 0.06)) * (1 - release))
      })
      draw(el.spiral, clamp01((ratio - 0.45) / 0.5))
      show(el.spiral, 1 - release)

      // The butter plate goes down at the head of Make.
      const sun = clamp01(make / 0.12)
      show(el.sun, sun)
      el.sun.style.transform = `scale(${(0.94 + 0.06 * sun).toFixed(4)})`

      // The forme's edge until the sheet is trimmed.
      show(el.forme, 1 - release)

      // Copy: the stage on the plate is the one in register; its neighbours
      // come apart and fade either side of it.
      items.forEach((node, k) => {
        const d = Math.abs(p - k)
        const v = clamp01(1 - d * 1.8)
        node.style.opacity = v.toFixed(3)
        node.style.visibility = v > 0 ? 'visible' : 'hidden'
        node.style.setProperty('--mis', clamp01(d * 2.4).toFixed(3))
        node.style.setProperty('--rise', ((p - k) * -18).toFixed(2) + 'px')
      })

      const now = Math.round(p)
      if (now !== shown) {
        shown = now
        thumbs.forEach((node, k) => {
          if (k === now) node.setAttribute('aria-current', 'step')
          else node.removeAttribute('aria-current')
        })
        // The folio is reset with the stage, as type is: the new numeral
        // simply stands in the old one's place.
        count.textContent = STAGES[now].n
      }
    }

    // Sources. The plate first -- it is the page -- the archive alongside.
    const load = (key, src, width) =>
      loadLuma(src, width)
        .then((l) => {
          if (cancelled) return
          sources[key] = l
          build()
        })
        .catch(() => {})
    load('plate', plateSrc, 720)
    load('night', nightSrc, 320)
    load('hands', handsSrc, 320)
    load('stair', stairSrc, 320)
    load('dusk', duskSrc, 320)
    // The number is printed from the display face, once it has arrived.
    const fontsReady = document.fonts?.ready ?? Promise.resolve()
    fontsReady.then(() => {
      if (cancelled) return
      const face = getComputedStyle(track).getPropertyValue('--display-font').trim() || 'sans-serif'
      sources.number = lumaFromText('1.618', { width: 320, height: 240, font: `500 104px ${face}` })
      build()
    })

    const resize = new ResizeObserver(build)
    resize.observe(canvas)

    const end = () => `+=${Math.round(stageSpan(track))}`
    const ctx = gsap.context(() => {
      if (reduced) {
        // Read on refresh as well as on scroll, so a page restored part-way
        // down shows the stage it opens on.
        const follow = (self) => {
          state.x = self.progress * LAST
          render()
        }
        ScrollTrigger.create({
          trigger: track,
          start: 'top top',
          end,
          invalidateOnRefresh: true,
          onUpdate: follow,
          onRefresh: follow,
        })
      } else {
        gsap.to(state, {
          x: LAST,
          ease: 'none',
          onUpdate: render,
          scrollTrigger: { trigger: track, start: 'top top', end, scrub: 0.6, invalidateOnRefresh: true },
        })
      }
    }, track)

    render()

    return () => {
      cancelled = true
      resize.disconnect()
      ctx.revert()
    }
  }, [])

  return (
    <section className="mp" id="method" ref={trackRef} aria-labelledby="mp-title">
      {/* Everything on the pinned sheet is drawn for the eye; this is the
          same method in reading order, for a screen reader and for
          selection. */}
      <div className="visually-hidden">
        <h2 id="mp-title">The method, in six stages</h2>
        <ol>
          {STAGES.map((s) => (
            <li key={s.n}>
              <h3>{s.label}</h3>
              <p>{s.cue}.</p>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="mp-stage">
        <div className="mp-copy" aria-hidden="true">
          {/* The stage counter, set as the work carousel's is on the home
              page. */}
          <p className="mp-count">
            (<span className="mp-count-now">01</span>) <span className="mp-count-total">/ 06</span>
          </p>
          {/* Laid out once per stage, all in the same cell: only the one on
              the plate is inked, so the column never jumps between them. */}
          <div className="mp-items">
            {STAGES.map((s) => (
              <div className="mp-item" key={s.n}>
                <p className="mp-word">
                  {s.label}
                  <span className="mp-dot">.</span>
                </p>
                <p className="mp-body">{s.body}</p>
              </div>
            ))}
          </div>
        </div>

        <figure className="mp-plate" aria-hidden="true">
          <span className="mp-sun" style={{ '--sun-x': SUN.x, '--sun-y': SUN.y, '--sun-r': SUN.r }} />
          <canvas className="mp-print" />

          <svg className="mp-lines" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none" focusable="false">
            <rect className="mp-forme" x="0" y="0" width={VB_W} height={VB_H} />
            {FRAMES.map((f) => (
              <rect
                className="mp-frame"
                key={f.src}
                x={f.x * VB_W}
                y={f.y * VB_W}
                width={f.w * VB_W}
                height={frameH(f) * VB_W}
              />
            ))}
            <g className="mp-dims">
              <path d={`M0 -40H${VB_W}M0 -52V-28M${VB_W} -52V-28`} />
              <path d={`M-40 0V${VB_H}M-52 0H-28M-52 ${VB_H}H-28`} />
            </g>
            {SQUARES.map((sq) => (
              <path
                className="mp-square"
                key={`${sq.x}-${sq.y}`}
                d={`M${sq.x.toFixed(2)} ${sq.y.toFixed(2)}h${sq.s.toFixed(2)}v${sq.s.toFixed(2)}h${(-sq.s).toFixed(2)}z`}
                pathLength="1"
              />
            ))}
            <path className="mp-spiral" d={SPIRAL_D} pathLength="1" />
            <circle
              className="mp-loupe"
              cx={LOUPE.x * VB_W}
              cy={LOUPE.y * VB_H}
              r={LOUPE.r * VB_W}
              pathLength="1"
            />
            <g className="mp-reticle">
              {[0, 90, 180, 270].map((a) => (
                <path
                  key={a}
                  d={`M${LOUPE.x * VB_W} ${LOUPE.y * VB_H - LOUPE.r * VB_W - 14}v28`}
                  transform={`rotate(${a} ${LOUPE.x * VB_W} ${LOUPE.y * VB_H})`}
                />
              ))}
            </g>
            <path className="mp-leader" d={LEADER_D} pathLength="1" />
            <circle className="mp-ring" cx={POLE * VB_W} cy={POLE * VB_H} r={RING_R} pathLength="1" />
          </svg>

          <span className="mp-l mp-l-dim mp-l-dim--w">1</span>
          <span className="mp-l mp-l-dim mp-l-dim--h">1.618</span>
          <span className="mp-l mp-l-dim mp-l-dim--phi" style={{ left: `${POLE * 100}%`, top: `${POLE * 100}%` }}>
            φ
          </span>

          <span className="mp-crop">
            <i className="mp-corner mp-corner--tl" />
            <i className="mp-corner mp-corner--tr" />
            <i className="mp-corner mp-corner--bl" />
            <i className="mp-corner mp-corner--br" />
          </span>
        </figure>

        {/* The thumb index, cut into the fore-edge as a dictionary's is: one
            tab per stage, the current one marked. */}
        <div className="mp-thumbs" role="group" aria-label="Stages of the method">
          {STAGES.map((s, i) => (
            <button
              type="button"
              className="mp-thumb"
              key={s.n}
              onClick={() => goTo(i)}
              aria-label={`Stage ${i + 1}, ${s.label}`}
            >
              <span className="mp-thumb-n">{s.n}</span>
              <span className="mp-thumb-label">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* The hero's red band, on the track rather than the pinned stage so it
          is unbroken however the stage sits. */}
      <span className="mp-band" aria-hidden="true" />
    </section>
  )
}

import { useImperativeHandle, useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { FAMILY, composePansy, makeMeasure, placePansy } from '../lib/pansy.js'
import './HuePansy.css'

// A pansy on the blue plate of the about hero, drawn the way an engraver
// would draw it -- except that every line is a sentence. The petal edges, the
// rays of the face, the stem and a crenate leaf are each a line of type
// laid along the curve (src/lib/pansy.js), in the deck's yellow and nothing
// else.
//
// It is drawn from the live boxes of the plate's own lockup and line, so it
// never comes near either, and it is set again when the window changes size.
//
// HueHero drives it, because the plate is wiped in by HueHero's pinned
// scroll: play() once the plate is mostly in, hold() while it is only partly
// in, reset() when the reader is back on the photograph, so it can be written
// again. The intro writes the stem up from the ground, then the leaf off it,
// the petals back to front, the rays of the face, and the eye last. Afterwards the drawing keeps still -- turning it would soften the
// type to grey -- and only, every few seconds, one word somewhere is unset
// and set again, letter by letter.
//
// Reduced motion gets the drawing complete and still.

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// When each part is written, in seconds from the reveal.
const SCORE = {
  stem: [0, 1.6],
  leaf: [0.95, 2.3],
  upperL: [1.9, 3.2],
  upperR: [2.2, 3.5],
  latL: [2.75, 3.95],
  latR: [2.85, 4.05],
  lower: [3.15, 4.5],
  ray: [4.2, 5.25],
  eye: [5.05, 5.7],
}
const END = 5.7

const FACES = [`italic 500 16px "${FAMILY}"`, `500 16px "${FAMILY}"`, `600 16px "${FAMILY}"`]

const SVGNS = 'http://www.w3.org/2000/svg'
const svgEl = (tag, attrs, parent) => {
  const node = document.createElementNS(SVGNS, tag)
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v))
  if (parent) parent.appendChild(node)
  return node
}

const sineInOut = (x) => (1 - Math.cos(Math.PI * Math.max(0, Math.min(1, x)))) / 2

let uid = 0

/* Which of a line's letters are unset: [h0, h1). Letters stay laid out while
   unset, so nothing else on the line moves. A line is set as a few spans --
   one per run of letters of equal size -- and only the span the pen is in is
   split while it writes. */
function unset(run, h0, h1) {
  if (h1 <= h0) h0 = h1 = 0
  if (run.h0 === h0 && run.h1 === h1) return
  run.h0 = h0
  run.h1 = h1
  run.groups.forEach((g) => {
    const lo = Math.max(g.a, h0) - g.a
    const hi = Math.min(g.b, h1) - g.a
    const sig = hi > lo ? `${lo},${hi}` : ''
    if (sig === g.sig) return
    g.sig = sig
    if (!sig) {
      g.el.textContent = g.text
      return
    }
    g.el.textContent = ''
    if (lo > 0) g.el.append(g.text.slice(0, lo))
    const off = svgEl('tspan', { class: 'is-unset' }, g.el)
    off.textContent = g.text.slice(lo, hi)
    if (hi < g.text.length) g.el.append(g.text.slice(hi))
  })
}

/* The tracking that runs a line its contour's exact length, set as a dx
   before every letter but the first (k em of the letter before it). Not
   letter-spacing: on a text path WebKit neither measures it nor places it the
   way Chrome and Firefox do, while dx is placed alike in all three -- and
   none of them counts it in getComputedTextLength, so the natural length
   can be read back and the tracking solved exactly. Nested spans (a letter
   being unset) take their places from the dx of the span around them. */
function setTracking(run) {
  run.groups.forEach((g) => {
    const dx = []
    for (let j = g.a; j < g.b; j++) dx.push(j === 0 ? 0 : (run.k * run.letters[j - 1].size).toFixed(3))
    g.el.setAttribute('dx', dx.join(' '))
  })
}

export default function HuePansy({ ref }) {
  const rootRef = useRef(null)
  const apiRef = useRef(null)

  useImperativeHandle(
    ref,
    () => ({
      play: () => apiRef.current?.play(),
      hold: () => apiRef.current?.hold(),
      reset: () => apiRef.current?.reset(),
    }),
    []
  )

  // A layout effect, so the controller exists before HueHero's own layout
  // effect creates the scroll trigger that calls into it. The drawing itself
  // is made later, in idle time once the face has loaded, while the plate is
  // still clipped away.
  useLayoutEffect(() => {
    const root = rootRef.current
    const plate = root?.closest('.hue-plate')
    if (!root || !plate) return undefined

    const still = reducedMotion()
    const ctx = gsap.context(() => {}, root)
    const measure = makeMeasure()
    let cancelled = false
    let drawing = null
    let phase = still ? 'drawn' : 'blank' // blank -> writing -> drawn
    let revealed = false
    let onScreen = true
    let intro = null
    let idleCall = null
    let retype = null
    let ready = false
    const clock = { t: 0 }

    // The plate's own boxes, in plate pixels. The line's box is its text,
    // not the full-width paragraph it is set in.
    const readEnv = () => {
      const box = plate.getBoundingClientRect()
      const rel = (r) => ({ left: r.left - box.left, top: r.top - box.top, right: r.right - box.left, bottom: r.bottom - box.top })
      const range = document.createRange()
      range.selectNodeContents(plate.querySelector('.hue-tag'))
      const nav = document.querySelector('nav.top')
      return {
        W: plate.clientWidth,
        H: plate.clientHeight,
        title: rel(plate.querySelector('.hue-title').getBoundingClientRect()),
        tag: rel(range.getBoundingClientRect()),
        navBottom: nav ? nav.getBoundingClientRect().height : 0,
      }
    }

    // The order the pen takes: parts at their times, the lanes of a part at
    // once, the lines of a lane one after another, each its share of the time.
    const lanesOf = (runs) => {
      const lanes = new Map()
      runs.forEach((r) => {
        const key = `${r.part}/${r.lane}`
        if (!lanes.has(key)) lanes.set(key, { part: r.part, runs: [] })
        lanes.get(key).runs.push(r)
      })
      lanes.forEach((lane) => {
        lane.runs.sort((a, b) => a.seq - b.seq)
        const total = lane.runs.reduce((n, r) => n + r.L, 0)
        let c = 0
        lane.runs.forEach((r) => {
          r.c0 = c / total
          c += r.L
          r.c1 = c / total
        })
      })
      return [...lanes.values()]
    }

    const paint = (t) => {
      if (!drawing) return
      drawing.lanes.forEach((lane) => {
        const [s, e] = SCORE[lane.part]
        const P = sineInOut((t - s) / (e - s))
        lane.runs.forEach((r) => {
          const n = r.letters.length
          const shown = Math.round(n * Math.max(0, Math.min(1, (P - r.c0) / (r.c1 - r.c0))))
          if (r.grow > 0) unset(r, shown, n)
          else unset(r, 0, n - shown)
        })
      })
      if (drawing.ring) {
        const [s, e] = SCORE.eye
        drawing.ring.setAttribute('stroke-dashoffset', (1 - sineInOut((t - s) / (e - s))).toFixed(3))
      }
    }

    const paintAll = (shown) => {
      if (!drawing) return
      drawing.runs.forEach((r) => (shown ? unset(r, 0, 0) : unset(r, 0, r.letters.length)))
      drawing.ring?.setAttribute('stroke-dashoffset', shown ? '0' : '1')
    }

    const build = () => {
      if (cancelled) return
      stopIdle()
      drawing?.svg.remove()
      drawing = null
      const env = readEnv()
      const plan = placePansy(env)
      if (!plan) return
      const { runs, ring } = composePansy(plan, measure)

      const svg = svgEl('svg', { class: 'hue-pansy-art', viewBox: `0 0 ${env.W} ${env.H}`, focusable: 'false', 'aria-hidden': 'true' })
      const defs = svgEl('defs', {}, svg)
      const id = `hue-pansy-${++uid}`
      const live = runs.map((run, i) => {
        svgEl('path', { id: `${id}-${i}`, d: run.d }, defs)
        const text = svgEl('text', { class: `is-${run.kind}`, 'font-style': run.style[0], 'font-weight': run.style[1] }, svg)
        const path = svgEl('textPath', { href: `#${id}-${i}`, startOffset: run.pad.toFixed(2) }, text)
        const groups = []
        run.letters.forEach(({ ch, size }, j) => {
          const g = groups[groups.length - 1]
          if (g && g.size === size) {
            g.b = j + 1
            g.text += ch
          } else groups.push({ a: j, b: j + 1, size, text: ch, sig: '' })
        })
        // The line straddles its contour: each span's baseline is dropped by
        // its share of the x-height, as dy, which every engine honours on a
        // text path (dominant-baseline there is not reliable outside Chrome).
        let prev = 0
        groups.forEach((g) => {
          g.el = svgEl('tspan', { 'font-size': g.size, dy: (run.base * (g.size - prev)).toFixed(3) }, path)
          g.el.textContent = g.text
          prev = g.size
        })
        return { ...run, text, groups, h0: 0, h1: 0, Z: run.letters.slice(0, -1).reduce((n, l) => n + l.size, 0) }
      })
      const ringEl = ring
        ? svgEl('circle', { class: 'hue-pansy-ring', cx: ring.c[0].toFixed(2), cy: ring.c[1].toFixed(2), r: ring.r.toFixed(2), pathLength: '1', 'stroke-dasharray': '1' }, svg)
        : null
      root.prepend(svg)

      // The canvas only chose the words and sizes; the browser's own natural
      // length of each line (kerning and all) sets its tracking. One read of
      // every line, then one write, so each ends exactly at its contour's end.
      const natural = live.map((r) => r.text.getComputedTextLength())
      live.forEach((r, i) => {
        if (natural[i] > 0 && r.Z > 0) r.k = (r.L - natural[i]) / r.Z
        setTracking(r)
      })

      drawing = { svg, runs: live, lanes: lanesOf(live), ring: ringEl }

      if (phase === 'drawn') paintAll(true)
      else if (phase === 'writing') paint(clock.t)
      else paintAll(false)
      if (!still && phase === 'blank' && revealed) startIntro()
      gate()
    }

    const startIntro = () => {
      if (!drawing || still) return
      phase = 'writing'
      clock.t = 0
      paint(0)
      ctx.add(() => {
        intro = gsap
          .timeline({
            onComplete: () => {
              intro = null
              phase = 'drawn'
              gate()
            },
          })
          .to(clock, { t: END, duration: END, ease: 'none', onUpdate: () => paint(clock.t) }, 0)
      })
    }

    /* The idle life: every five to eight seconds one word, set large enough
       to see it happen, is unset from its end and set again a letter at a
       time. Only while the plate is in, on screen, and the tab is shown.
       These tweens are killed by hand (stopIdle) rather than kept in the
       context, which would hold on to every one of them for as long as the
       page is open. */
    function stopIdle() {
      idleCall?.kill()
      idleCall = null
      if (retype) {
        retype.tl.kill()
        unset(retype.run, 0, 0)
        retype = null
      }
    }

    const retypeOne = () => {
      idleCall = null
      if (!drawing) return
      const pool = []
      drawing.runs.forEach((run) => {
        if (run.kind !== 'line') return
        run.words.forEach((w) => w.n >= 3 && w.min >= run.full * 0.8 && pool.push({ run, w }))
      })
      if (!pool.length) return
      const { run, w } = pool[Math.floor(Math.random() * pool.length)]
      const n = w.b - w.a
      const st = { k: 0 }
      const tl = gsap
        .timeline({
          onComplete: () => {
            retype = null
            unset(run, 0, 0)
            gate()
          },
        })
        .to(st, { k: n, duration: n * 0.05, ease: 'none', onUpdate: () => unset(run, w.b - Math.round(st.k), w.b) })
        .to(st, { k: 0, duration: n * 0.12, ease: 'none', onUpdate: () => unset(run, w.b - Math.round(st.k), w.b) }, '+=0.45')
      retype = { tl, run }
    }

    function gate() {
      const live = !still && phase === 'drawn' && revealed && onScreen && !document.hidden && drawing
      if (!live) stopIdle()
      else if (!idleCall && !retype) idleCall = gsap.delayedCall(gsap.utils.random(5, 8), retypeOne)
    }

    apiRef.current = {
      play() {
        if (still) return
        revealed = true
        if (phase === 'blank') startIntro()
        gate()
      },
      hold() {
        revealed = false
        gate()
      },
      reset() {
        if (still) return
        revealed = false
        intro?.kill()
        intro = null
        stopIdle()
        phase = 'blank'
        clock.t = 0
        paintAll(false)
      },
    }

    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting
      gate()
    })
    io.observe(root)
    document.addEventListener('visibilitychange', gate)

    // Set again when the window changes; a phone's toolbar coming and going
    // (a small change of height alone) is not worth a new drawing.
    let size = [window.innerWidth, window.innerHeight]
    let resizeTimer = 0
    const onResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        const next = [window.innerWidth, window.innerHeight]
        if (next[0] === size[0] && Math.abs(next[1] - size[1]) < 80) return
        size = next
        if (ready) build()
      }, 200)
    }
    window.addEventListener('resize', onResize)

    // Lay out only in the face itself: measuring a fallback would set every
    // line to the wrong length.
    const idle = window.requestIdleCallback ?? ((cb) => setTimeout(cb, 1))
    const cancelIdle = window.cancelIdleCallback ?? clearTimeout
    let idleId = 0
    Promise.all(FACES.map((f) => document.fonts.load(f)))
      .then(() => {
        if (cancelled || !FACES.every((f) => document.fonts.check(f))) return
        ready = true
        idleId = idle(build, { timeout: 800 })
      })
      .catch(() => {})

    return () => {
      cancelled = true
      cancelIdle(idleId)
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', gate)
      io.disconnect()
      stopIdle()
      ctx.revert()
      drawing?.svg.remove()
      drawing = null
      apiRef.current = null
    }
  }, [])

  return <div className="hue-pansy" ref={rootRef} aria-hidden="true" />
}

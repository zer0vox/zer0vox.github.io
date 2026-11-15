import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SplitType from 'split-type'
import { createDotLayer, dotRadius, fitCanvas, loadLuma, sampleLuma, screenLattice } from '../lib/halftone.js'
import nightSrc from '../assets/philosophy/print/night.webp'
import './NightPreface.css'

gsap.registerPlugin(ScrollTrigger)

// The preface: the page's marine spread, as the work spread is on the home
// page. The thesis is set large in paper type and prints in out of register
// as the reader scrolls in -- butter and red plates closing on the key -- with
// the method's short introduction on a rule beside it.
//
// Under it, the ridge above Kathmandu before dawn, printed in reverse: paper
// ink on the marine stock, so the dots are the light -- the city's, and the
// glow along the horizon -- and the figure watching it is simply the sheet
// left bare. The brightest lights take the butter plate. The lights come up
// with the same scroll that registers the type, in no order, the way a city's
// do. Reduced motion gets the printed sheet.

// Where the picture is anchored when it is cropped to the sheet: the figure
// a little left of centre, and more of the picture's foot cropped than its
// head, which holds the horizon low enough for the type to stand in the sky.
const ANCHOR_X = 0.4
const ANCHOR_Y = 0.3

// Light rather than ink: the inverse of the plate's curve. The night sky
// prints nothing; the glow prints as a fine tint; the lights as full dots.
const LIGHT = { lo: 0.13, hi: 0.78, gamma: 1.25, max: 0.72 }
const BUTTER_AT = 0.82
const SOFT = 0.3

const light = (l) => Math.pow(Math.min(1, Math.max(0, (l - LIGHT.lo) / (LIGHT.hi - LIGHT.lo))), LIGHT.gamma) * LIGHT.max

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Screens the night into the canvas, cover-fitted to its box. Returns the
// redraw at development `p` (0..1).
//
// The type is knocked out, as a printer would knock it out of a picture
// rather than print paper type over a busy tint: nothing prints above
// `clearTo` (px down the canvas, the foot of the type), and the night comes
// up below it as a halftone vignette over `feather` px.
function screenNight(canvas, luma, clearTo) {
  const { ctx, w, h, dpr } = fitCanvas(canvas)
  const pitch = Math.max(4.6, Math.min(7.5, w / 200))
  const lat = screenLattice(w, h, pitch)
  const feather = Math.max(120, h * 0.22)

  // Cover: scale the picture to fill the box, crop what overhangs about the
  // anchor.
  const scale = Math.max(w / luma.w, h / luma.h)
  const pw = luma.w * scale
  const ph = luma.h * scale
  const ox = (w - pw) * ANCHOR_X
  const oy = (h - ph) * ANCHOR_Y

  // Only dots that print anything are kept -- most of a night sky does not.
  const keep = { x: [], y: [], r: [], ink: [], order: [] }
  for (let i = 0; i < lat.n; i++) {
    const l = sampleLuma(luma, (lat.x[i] - ox) / pw, (lat.y[i] - oy) / ph)
    const t = Math.min(1, Math.max(0, (lat.y[i] - clearTo) / feather))
    const c = light(l) * t * t * (3 - 2 * t)
    if (c < 0.004) continue
    keep.x.push(lat.x[i])
    keep.y.push(lat.y[i])
    keep.r.push(dotRadius(c, pitch))
    keep.ink.push(l >= BUTTER_AT ? 1 : 0)
    keep.order.push(Math.random())
  }

  const style = getComputedStyle(canvas)
  const layer = createDotLayer(
    {
      x: Float32Array.from(keep.x),
      y: Float32Array.from(keep.y),
      r0: Float32Array.from(keep.r),
      order: Float32Array.from(keep.order),
      ink: Uint8Array.from(keep.ink),
      n: keep.x.length,
    },
    { dpr, colors: [style.color, style.getPropertyValue('--npf-warm').trim() || '#ffd966'] }
  )

  // The scrub reports every scrolled frame; the screen only changes while
  // the lights are coming up.
  let shown = -1
  return (p) => {
    if (p === shown) return
    shown = p
    ctx.clearRect(0, 0, w, h)
    layer.draw(ctx, p, SOFT)
  }
}

export default function NightPreface() {
  const rootRef = useRef(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return undefined

    const canvas = root.querySelector('.npf-print')
    const sheet = root.querySelector('.npf-sheet')
    const type = [root.querySelector('.npf-title'), root.querySelector('.npf-lede-block')]
    const reduced = reducedMotion()
    const state = { p: reduced ? 1 : 0 }
    let luma = null
    let draw = null
    let cancelled = false

    // Re-screened when the canvas resizes and when the type does (the face
    // landing re-sets it), since the knock-out follows the type's foot.
    const refit = () => {
      if (!luma) return
      const top = canvas.getBoundingClientRect().top
      const foot = Math.max(...type.map((el) => el.getBoundingClientRect().bottom)) - top
      draw = screenNight(canvas, luma, foot + 12)
      draw(state.p)
    }
    const resize = new ResizeObserver(refit)
    resize.observe(canvas)
    resize.observe(sheet)
    loadLuma(nightSrc, 800)
      .then((l) => {
        if (cancelled) return
        luma = l
        refit()
      })
      .catch(() => {})

    if (reduced) {
      return () => {
        cancelled = true
        resize.disconnect()
      }
    }

    const title = root.querySelector('.npf-title')
    const split = new SplitType(title, { types: 'words', wordClass: 'npf-w', tagName: 'span' })
    root.classList.add('is-printing')

    const ctx = gsap.context(() => {
      const words = split.words ?? []

      // Out of register -> in register, one word after another, over the
      // scroll that brings the sheet up to the masthead.
      gsap.fromTo(words, { '--mis': 1 }, {
        '--mis': 0,
        ease: 'power2.out',
        stagger: 0.1,
        duration: 0.4,
        scrollTrigger: {
          trigger: root,
          start: 'top 72%',
          end: 'top 8%',
          scrub: 0.5,
        },
      })

      // The lights, over a little more of the same scroll.
      gsap.to(state, {
        p: 1,
        ease: 'none',
        onUpdate: () => draw?.(state.p),
        scrollTrigger: {
          trigger: root,
          start: 'top 85%',
          end: 'top top',
          scrub: 0.8,
        },
      })

      // The lede comes up off its own rule, once. Opacity only, never
      // visibility, so it is read by a screen reader whether or not it has
      // been scrolled to.
      gsap
        .timeline({ scrollTrigger: { trigger: '.npf-lede-block', start: 'top 85%', once: true } })
        .fromTo('.npf-rule', { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: 'power4.inOut' })
        .fromTo('.npf-lede', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 0.45)
    }, root)

    document.fonts?.ready.then(() => !cancelled && ScrollTrigger.refresh())

    return () => {
      cancelled = true
      resize.disconnect()
      ctx.revert()
      split.revert()
      root.classList.remove('is-printing')
    }
  }, [])

  return (
    <section className="npf" ref={rootRef} aria-labelledby="npf-title">
      <canvas className="npf-print" aria-hidden="true" />

      <div className="npf-sheet">
        <h2 className="npf-title" id="npf-title">
          I don&apos;t have ideas. I notice them, then get out of the way
        </h2>

        <div className="npf-lede-block">
          <span className="npf-rule" aria-hidden="true" />
          <p className="npf-lede">
            What follows is the whole method, such as it is. It is not a process diagram and it does
            not run in a straight line. It turns, and the same six stages keep coming back around.
          </p>
        </div>
      </div>

      <span className="npf-band" aria-hidden="true" />
    </section>
  )
}

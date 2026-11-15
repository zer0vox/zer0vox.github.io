import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  createDotLayer,
  dotRadius,
  fitCanvas,
  inkCover,
  loadLuma,
  sampleLuma,
  screenLattice,
} from '../lib/halftone.js'
import { PLATE_TONE, POLE, platePitch, plateSrc } from '../lib/plate.js'
import { useHeroFx } from './HeroFx.js'
import './PhilosophyHero.css'

gsap.registerPlugin(ScrollTrigger)

// The philosophy page's opening sheet, set the way the home hero is: paper
// stock, the title thrown up in ink at the foot of the page, one print
// bleeding up under the masthead, and the red overprint band through it. The
// title and its slogan are the home hero's own markup (#heroTitle, .hero-sub),
// so they are set, thrown up and lifted off by exactly the same code
// (index.css, HeroFx) -- the three opening sheets cannot drift apart.
//
// The print is the thing the page goes on to make: the golden plate
// (lib/plate.js), screened live as a marine halftone over a butter disc, the
// two plates of a two-colour job. The pole of its construction falls on the
// small figure holding up a camera -- the snag. The sheet marks it with a
// ring, and on load the print develops outward from there, because that is
// where it started.
//
// On the way out the print runs a little ahead of the sun. The band does not
// move. Reduced motion gets the printed sheet with nothing moving.

// Width of the developing front, in units of the plate's half-diagonal.
const SOFT = 0.22

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Screens the plate into the canvas. Returns the redraw at development `p`
// (0..1), so a resize or a tween can call it again without rebuilding, and
// the layer, whose caches can go once the print is finished: from then on
// the canvas itself holds it.
function screenPlate(canvas, luma) {
  const { ctx, w, h, dpr } = fitCanvas(canvas)
  const pitch = platePitch(w)
  const lat = screenLattice(w, h, pitch)
  const r0 = new Float32Array(lat.n)
  const order = new Float32Array(lat.n)
  const px = POLE * w
  const py = POLE * h
  const far = Math.hypot(px, py)

  for (let i = 0; i < lat.n; i++) {
    r0[i] = dotRadius(inkCover(sampleLuma(luma, lat.x[i] / w, lat.y[i] / h), PLATE_TONE), pitch)
    order[i] = Math.hypot(lat.x[i] - px, lat.y[i] - py) / far
  }

  const layer = createDotLayer(
    { x: lat.x, y: lat.y, r0, order, n: lat.n },
    { dpr, colors: [getComputedStyle(canvas).color] }
  )
  const draw = (p) => {
    ctx.clearRect(0, 0, w, h)
    layer.draw(ctx, p, SOFT)
  }
  return { draw, layer }
}

export default function PhilosophyHero() {
  const heroRef = useRef(null)
  const canvasRef = useRef(null)

  useHeroFx(heroRef)

  // The title's lines are thrown up from their masks once they are in the
  // document, as on the home page.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      heroRef.current?.querySelectorAll('#heroTitle .line').forEach((line) => line.classList.add('in'))
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  // The print. Screened once the source image has loaded, and again whenever the
  // plate is resized, at whatever development it had reached.
  useEffect(() => {
    const canvas = canvasRef.current
    const hero = heroRef.current
    if (!canvas || !hero) return undefined

    const reduced = reducedMotion()
    const state = { p: reduced ? 1 : 0 }
    let luma = null
    let screen = null
    let cancelled = false
    const ctx = gsap.context(() => {}, hero)

    const refit = () => {
      if (!luma) return
      screen = screenPlate(canvas, luma)
      screen.draw(state.p)
      if (state.p >= 1) screen.layer.release()
    }
    const resize = new ResizeObserver(refit)
    resize.observe(canvas)

    if (!reduced) {
      hero.classList.add('is-printing')
      ctx.add(() => {
        // The snag: its ring is drawn round the figure.
        gsap.fromTo('.phh-ring', { '--draw': 0 }, { '--draw': 1, duration: 0.9, ease: 'power2.inOut', delay: 0.35 })

        // Out, scrubbed over the hero's own height: the print runs ahead of
        // the sun. The band, on the sheet itself, stays put.
        gsap
          .timeline({
            defaults: { ease: 'none', duration: 1 },
            scrollTrigger: {
              trigger: hero,
              start: 'top top',
              end: 'bottom top',
              scrub: 0.6,
              invalidateOnRefresh: true,
            },
          })
          .fromTo('.phh-plate', { y: 0 }, { y: () => -hero.offsetHeight * 0.08 }, 0)
          .fromTo('.phh-sun', { y: 0 }, { y: () => hero.offsetHeight * 0.06 }, 0)
      })
    }

    loadLuma(plateSrc, 480)
      .then((l) => {
        if (cancelled) return
        luma = l
        refit()
        if (state.p >= 1) return
        // The butter plate goes down as the marine one starts to come up.
        ctx.add(() => {
          gsap.to(state, {
            p: 1,
            duration: 2,
            delay: 0.25,
            ease: 'power1.inOut',
            onUpdate: () => screen?.draw(state.p),
            onComplete: () => screen?.layer.release(),
          })
          gsap.fromTo(
            '.phh-sun',
            { opacity: 0, scale: 0.94 },
            { opacity: 1, scale: 1, duration: 1.6, delay: 0.45, ease: 'power2.out' }
          )
        })
      })
      .catch(() => {})

    return () => {
      cancelled = true
      ctx.revert()
      resize.disconnect()
      hero.classList.remove('is-printing')
    }
  }, [])

  return (
    <header className="hero hero--print phh" id="top" ref={heroRef} data-printed>
      <div className="phh-art" aria-hidden="true">
        <span className="phh-sun" />
        <div className="phh-plate">
          <canvas className="phh-print" ref={canvasRef} />
          {/* The snag: a ring on the figure, drawn in the plate's own units
              so it stays on it at any size. */}
          <svg className="phh-marks" viewBox="0 0 1000 1618" preserveAspectRatio="none" focusable="false">
            <circle className="phh-ring" cx="723.6" cy="1170.8" r="34" pathLength="1" />
          </svg>
        </div>
        <span className="phh-band" />
      </div>

      <div className="copy">
        <h1 id="heroTitle">
          <span className="line"><span className="inner">The secret</span></span>
          <span className="line"><span className="inner">behind<span className="dot">.</span></span></span>
        </h1>
        {/* The rule and the slogan are split exactly as on the home hero, so
            HeroFx handles them exactly as it does there. */}
        <p className="hero-sub">
          <span className="hfx-rule" aria-hidden="true"><span className="hfx-rule-ink" /></span>
          <span className="hfx-sub-text">
            How an idea gets from a ridgeline at five in the morning to something you can hold in your hands.
          </span>
        </p>
      </div>
    </header>
  )
}

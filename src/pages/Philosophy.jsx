import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SiteNav, SiteFooter } from '../components/SiteChrome'
import ambientImg from '../assets/philosophy/ambient-grain.png'
import heroImg from '../assets/philosophy/hero-ridgeline.jpg'
import markBandImg from '../assets/philosophy/mark-band.jpg'
import practiceImg from '../assets/philosophy/practice.jpg'
import markLogo from '../assets/philosophy/greenhueblues-mark.png'
import './Philosophy.css'

// The six stages the dial turns through. Devanagari numerals are the design's,
// and they are also what the particle canvas rasterises.
const STAGES = [
  {
    n: '०१', label: 'NOTICE', cue: 'Stage one — the snag',
    body: "Nothing starts as an idea. It starts as a snag: a ratio in a stairwell, a colour on a ridge at five in the morning, a sentence overheard wrong. I write it down before I understand it, because understanding it early is how you lose it."
  },
  {
    n: '०२', label: 'GATHER', cue: 'Stage two — the archive',
    body: "Then I collect without judging. Photographs, fragments, numbers, other people's work. The archive is allowed to be incoherent for a very long time — sorting it too soon only preserves the categories I already had."
  },
  {
    n: '०३', label: 'STILLNESS', cue: 'Stage three — refusal',
    body: "And then I leave it alone. The work of this stage is refusal: not touching the thing until it asks to be touched. Weeks, usually. Whatever survives the silence was worth making."
  },
  {
    n: '०४', label: 'RATIO', cue: 'Stage four — structure',
    body: "Structure comes before surface. I look for the proportion the idea already wants — where it divides, where it repeats, where it stops. Get the division right and the styling has almost nothing left to decide."
  },
  {
    n: '०५', label: 'MAKE', cue: 'Stage five — material',
    body: "Only now, materials. I build the smallest version that can be wrong, show it to two people, and then keep removing until nothing else can come out without the thing falling over."
  },
  {
    n: '०६', label: 'RELEASE', cue: 'Stage six — and around again',
    body: "It goes out unexplained. If it needs a paragraph to stand up, it isn't finished. By the time anyone sees it I've stopped looking at it — I'm already noticing the next one."
  }
]

const SPREAD = 24        // degrees of drum between one stage and the next
const LENS_PITCH = SPREAD * 3  // px the focal scale travels per stage
const INERTIA = 0.13     // fraction of the gap the dial closes per 60fps frame
const DETENTS = true     // let the drum settle onto the nearest stage at rest
const DEV_DIGITS = '०१२३४५६७८९'

const toDevanagari = (n) => String(n).padStart(2, '0').replace(/\d/g, (d) => DEV_DIGITS[+d])

export default function Philosophy() {
  const trackRef = useRef(null)
  const dialRef = useRef(null)
  const copyRef = useRef(null)
  const readRef = useRef(null)
  const degRef = useRef(null)
  const heroRef = useRef(null)
  const bpRef = useRef(null)
  const ringRef = useRef(null)
  const glyphRef = useRef(null)
  const ticksRef = useRef(null)
  const scaleRef = useRef(null)
  const lensIndexRef = useRef(null)

  useEffect(() => {
    const previous = document.title
    document.title = 'Philosophy — greenhueblues®'
    return () => {
      document.title = previous
    }
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      const rise = (target, vars = {}) =>
        gsap.from(target, {
          y: 28,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: target, start: 'top 82%' },
          ...vars
        })

      rise('.ph-statement-lead')
      rise('.ph-statement-body', { y: 20, duration: 0.75 })
      rise('.ph-rule-row', { y: 14, duration: 0.6 })
      rise('.ph-practice-head')
      rise('.ph-practice-body p', { y: 20, stagger: 0.1 })
      rise('.ph-contact h2')
      rise('.ph-contact-link', { y: 16, duration: 0.7 })
    })

    return () => ctx.revert()
  }, [])

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Everything the loop mutates lives here rather than in state: none of it
    // should ever cause a React render.
    const torch = { x: 0, y: 0, tx: 0, ty: 0, r: 0, tr: 0, on: false }
    const ptr = { x: 0, y: 0, in: false }
    let parts = []
    let glyphShown = -1
    let idx = 0
    let target = 0
    let vel = 0
    let lastCopy = -1
    let lastTarget = null
    let rest = 0
    let lastT = 0
    let rafId = 0

    // Frame-rate independent damping: `rate` is the fraction closed per 60fps frame.
    const damp = (rate, dt) => 1 - Math.pow(1 - rate, dt * 60)

    // Where the page sits within the 320vh track, expressed as a stage index.
    // Read every frame rather than on scroll events, so it stays correct no
    // matter how Lenis drives the scroll position.
    const measure = () => {
      const track = trackRef.current
      if (!track) return
      const rect = track.getBoundingClientRect()
      const total = Math.max(1, rect.height - window.innerHeight)
      const p = Math.min(1, Math.max(0, -rect.top / total))
      target = p * (STAGES.length - 1)
    }

    const sizeGlyphCanvas = () => {
      const c = glyphRef.current
      if (!c) return null
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const w = c.clientWidth
      const h = c.clientHeight
      if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
        c.width = Math.round(w * dpr)
        c.height = Math.round(h * dpr)
        glyphShown = -1
      }
      return { c, dpr, w, h }
    }

    // Sample the numeral's pixels and hand each particle a new home; particles
    // that already exist fly there from where they are, so the glyph dissolves
    // and reforms rather than cutting.
    const buildGlyph = (ch, w, h) => {
      const size = Math.min(h * 0.72, w * 0.42)
      const off = document.createElement('canvas')
      const S = 132
      off.width = S
      off.height = S
      const o = off.getContext('2d')
      o.fillStyle = '#fff'
      o.textAlign = 'center'
      o.textBaseline = 'middle'
      o.font = '500 ' + Math.round(S * 0.82) + "px 'Noto Sans Devanagari', serif"
      o.fillText(ch, S / 2, S / 2 + S * 0.02)
      const data = o.getImageData(0, 0, S, S).data

      const pts = []
      for (let y = 0; y < S; y += 1) {
        for (let x = 0; x < S; x += 1) {
          if (data[(y * S + x) * 4 + 3] > 130) {
            pts.push([(x / S - 0.5) * size + w / 2, (y / S - 0.5) * size + h * 0.5])
          }
        }
      }

      const n = pts.length
      for (let i = parts.length; i < n; i++) {
        parts.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: 0,
          vy: 0,
          tx: 0,
          ty: 0,
          s: 0.5 + Math.random() * 1.2,
          k: 0.012 + Math.random() * 0.045,
          a: 0.11 + Math.random() * 0.28,
          live: true
        })
      }
      parts.forEach((p, i) => {
        p.live = i < n
        if (p.live) {
          p.tx = pts[i][0] + (Math.random() - 0.5) * 3
          p.ty = pts[i][1] + (Math.random() - 0.5) * 3
        }
      })
    }

    const paintGlyph = (dt) => {
      const m = sizeGlyphCanvas()
      if (!m) return
      const { c, dpr, w, h } = m
      const ci = Math.max(0, Math.min(STAGES.length - 1, Math.round(idx)))
      if (ci !== glyphShown) {
        glyphShown = ci
        buildGlyph(STAGES[ci].n, w, h)
      }

      const ctx = c.getContext('2d')
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      // Additive, so where the grains crowd along a stroke they accumulate into
      // a glow. A per-particle shadowBlur would look the same and cost far more.
      ctx.globalCompositeOperation = 'lighter'
      // Spin of the dial throws the particles sideways — the glyph smears as it turns.
      const kick = Math.min(60, Math.abs(vel) * 900)
      const f = dt * 60
      const pr = ptr.in ? 120 : 0
      const pr2 = pr * pr

      for (let i = 0; i < parts.length; i++) {
        const p = parts[i]
        if (!p.live) continue
        p.vx += (p.tx - p.x) * p.k * f
        p.vy += (p.ty - p.y) * p.k * f
        if (pr) {
          const dx = p.x - ptr.x
          const dy = p.y - ptr.y
          const d2 = dx * dx + dy * dy
          if (d2 < pr2 && d2 > 0.01) {
            const d = Math.sqrt(d2)
            const push = (1 - d / pr) * 2.6 * f
            p.vx += (dx / d) * push
            p.vy += (dy / d) * push
          }
        }
        p.vx *= Math.pow(0.9, f)
        p.vy *= Math.pow(0.9, f)
        p.x += p.vx * f + (Math.random() - 0.5) * 0.35
        p.y += p.vy * f + (Math.random() - 0.5) * 0.35
        const jx = kick ? (Math.random() - 0.5) * kick : 0
        ctx.globalAlpha = p.a * (kick ? 0.55 : 1)
        ctx.fillStyle = i % 9 === 0 ? '#a8c7ff' : '#ffffff'
        ctx.fillRect(p.x + jx, p.y, p.s, p.s)
      }
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    }

    // The cursor is a torch: it masks in the blueprint reading of the photograph.
    const paintTorch = (dt) => {
      if (!torch.on) return
      const k = damp(0.16, dt)
      torch.x += (torch.tx - torch.x) * k
      torch.y += (torch.ty - torch.y) * k
      torch.r += (torch.tr - torch.r) * damp(0.09, dt)
      const bp = bpRef.current
      const ring = ringRef.current
      if (bp) {
        const m = 'radial-gradient(circle ' + torch.r.toFixed(1) + 'px at ' + torch.x.toFixed(1) + 'px ' + torch.y.toFixed(1) + 'px, #000 0%, rgba(0,0,0,.9) 38%, rgba(0,0,0,.45) 66%, transparent 82%)'
        bp.style.maskImage = m
        bp.style.webkitMaskImage = m
        bp.style.opacity = torch.r > 4 ? '1' : '0'
      }
      if (ring) {
        ring.style.transform = 'translate3d(' + torch.x.toFixed(1) + 'px,' + torch.y.toFixed(1) + 'px,0) scale(' + (torch.r / 150).toFixed(3) + ')'
        ring.style.opacity = torch.r > 4 ? '1' : '0'
      }
    }

    const paint = () => {
      const dial = dialRef.current
      if (!dial) return
      const W = window.innerWidth
      const H = window.innerHeight
      // A drum seen edge-on: the column is straight and vertical, the type
      // rides the cylinder — no arc across the screen.
      const x = Math.max(16, 0.08 * W)
      // Narrow screens put the copy under the drum instead of beside it, so the
      // drum rides higher and tighter to leave that band clear. Keep in step
      // with the 900px breakpoint and .ph-guide-* in Philosophy.css.
      const narrow = W < 900
      const cy = (narrow ? 0.36 : 0.5) * H
      const ry = (narrow ? 0.24 : 0.38) * H
      const fade = SPREAD * 3.4

      dial.querySelectorAll('.ph-dial-item').forEach((el, i) => {
        const a = (i - idx) * SPREAD
        const r = (a * Math.PI) / 180
        const y = cy + ry * Math.sin(r)
        const depth = Math.cos(r)
        const f = Math.max(0, 1 - Math.abs(a) / fade)
        el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) translateY(-50%) perspective(900px) rotateX(' + (-a * 0.9).toFixed(2) + 'deg) scale(' + (0.58 + 0.42 * Math.max(0, depth)).toFixed(3) + ')'
        el.style.opacity = depth <= 0.02 ? '0' : (0.04 + 0.96 * Math.pow(f, 1.7)).toFixed(3)
        el.style.color = f > 0.985 ? '#ffffff' : 'rgba(255,255,255,.72)'
      })

      // Turn the lens. Minor ticks repeat every 9px, so only the remainder of
      // the travel has to move; the stops carry the whole distance.
      if (ticksRef.current) {
        const off = (((idx * LENS_PITCH) % 9) + 9) % 9
        ticksRef.current.style.transform = 'translate3d(0,' + (-off).toFixed(2) + 'px,0)'
      }
      if (scaleRef.current) {
        scaleRef.current.querySelectorAll('.ph-lens-mark').forEach((el, i) => {
          const d = i - idx
          el.style.transform = 'translate3d(0,' + (d * LENS_PITCH).toFixed(2) + 'px,0)'
          el.classList.toggle('is-on', Math.abs(d) < 0.06)
        })
      }

      const ci = Math.max(0, Math.min(STAGES.length - 1, Math.round(idx)))
      if (ci !== lastCopy) {
        lastCopy = ci
        const copies = copyRef.current ? copyRef.current.querySelectorAll('.ph-copy-item') : []
        copies.forEach((el, i) => {
          const on = i === ci
          if (reduced) {
            el.style.opacity = on ? '1' : '0'
            return
          }
          // The outgoing stage leaves faster than the incoming one arrives, so
          // the two never sit at half strength together.
          gsap.to(el, {
            opacity: on ? 1 : 0,
            duration: on ? 0.45 : 0.22,
            ease: on ? 'power2.out' : 'power1.in',
            overwrite: 'auto'
          })
          if (on) {
            gsap.fromTo(
              el.querySelectorAll('.ph-copy-cue, .ph-copy-body'),
              { y: 12, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.55, stagger: 0.07, ease: 'power3.out', overwrite: 'auto' }
            )
          }
        })
        // The index catching a stop: a short flare on the caret, like a lens
        // clicking into a detent.
        if (!reduced && lensIndexRef.current) {
          gsap.fromTo(
            lensIndexRef.current,
            { scaleY: 3, opacity: 1 },
            { scaleY: 1, opacity: 0.85, duration: 0.45, ease: 'power3.out', overwrite: 'auto' }
          )
        }
        if (readRef.current) readRef.current.textContent = toDevanagari(ci + 1)
      }
      if (degRef.current) degRef.current.textContent = (idx * SPREAD).toFixed(0) + '°'
    }

    const loop = (now) => {
      const t = now || performance.now()
      const dt = Math.min(0.05, Math.max(0.001, (t - (lastT || t)) / 1000))
      lastT = t

      measure()

      const rate = reduced ? 1 : INERTIA
      const prev = idx
      let goal = target
      let ease = damp(rate, dt)

      // Detent: once the wheel is at rest, the drum drifts onto the nearest stage.
      if (!reduced && DETENTS) {
        const v = Math.abs(target - (lastTarget ?? target))
        lastTarget = target
        rest = v < 0.008 ? Math.min(1, rest + dt * 4) : 0
        if (rest > 0 && target > 0.02 && target < STAGES.length - 1.02) {
          goal = target + (Math.round(target) - target) * rest
          ease = damp(Math.max(rate, 0.11), dt)
        }
      }

      idx += (goal - idx) * ease
      if (Math.abs(goal - idx) < 0.0002) idx = goal
      vel = idx - prev
      paintTorch(dt)
      paintGlyph(dt)
      paint()
      rafId = requestAnimationFrame(loop)
    }

    const onGlyphMove = (e) => {
      const gc = glyphRef.current
      if (!gc) return
      const r = gc.getBoundingClientRect()
      ptr.x = e.clientX - r.left
      ptr.y = e.clientY - r.top
      ptr.in = true
    }
    const onGlyphOut = () => {
      ptr.in = false
    }

    const hero = heroRef.current
    const onHeroMove = (e) => {
      const r = hero.getBoundingClientRect()
      torch.tx = e.clientX - r.left
      torch.ty = e.clientY - r.top
      if (!torch.on) {
        torch.x = torch.tx
        torch.y = torch.ty
        torch.on = true
      }
      torch.tr = 190
    }
    const onHeroLeave = () => {
      torch.tr = 0
    }

    if (!reduced) {
      window.addEventListener('mousemove', onGlyphMove, { passive: true })
      window.addEventListener('mouseout', onGlyphOut)
      if (hero) {
        hero.addEventListener('mousemove', onHeroMove)
        hero.addEventListener('mouseleave', onHeroLeave)
      }
    }

    // The numerals are rasterised from a webfont, so redraw once it has landed.
    let cancelled = false
    document.fonts?.ready.then(() => {
      if (!cancelled) glyphShown = -1
    })

    rafId = requestAnimationFrame(loop)

    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', onGlyphMove)
      window.removeEventListener('mouseout', onGlyphOut)
      if (hero) {
        hero.removeEventListener('mousemove', onHeroMove)
        hero.removeEventListener('mouseleave', onHeroLeave)
      }
      parts = []
    }
  }, [])

  return (
    <div className="ph">
      <svg aria-hidden="true" width="0" height="0" style={{ position: 'absolute', width: 0, height: 0 }}>
        <filter id="phBpEdges" colorInterpolationFilters="sRGB">
          <feColorMatrix type="saturate" values="0" />
          <feConvolveMatrix order="3" preserveAlpha="true" kernelMatrix="0 -1 0 -1 4 -1 0 -1 0" />
          <feComponentTransfer>
            <feFuncR type="linear" slope="3.2" />
            <feFuncG type="linear" slope="3.2" />
            <feFuncB type="linear" slope="3.2" />
          </feComponentTransfer>
          <feColorMatrix type="matrix" values="0 0 0 0 0.658 0 0 0 0 0.78 0 0 0 0 1 0.34 0.5 0.16 0 0" />
        </filter>
      </svg>

      <div className="ph-ambient" aria-hidden="true" data-ambient style={{ backgroundImage: `url(${ambientImg})` }} />
      <div className="ph-ambient-veil" aria-hidden="true" />

      <SiteNav />

      <section className="ph-hero" id="top" ref={heroRef}>
        <div className="ph-hero-photo" aria-hidden="true" style={{ backgroundImage: `url(${heroImg})` }} />
        <div className="ph-hero-bloom" aria-hidden="true" style={{ backgroundImage: `url(${heroImg})` }} />

        <div className="ph-blueprint" ref={bpRef} aria-hidden="true">
          <div className="ph-bp-grid" />
          <div className="ph-bp-edges" style={{ backgroundImage: `url(${heroImg})` }} />
          <svg className="ph-bp-lines" viewBox="0 0 1600 900" preserveAspectRatio="none">
            <g fill="none" stroke="#a8c7ff" strokeWidth="1" vectorEffect="non-scaling-stroke">
              <path className="flow-a" d="M-40 300 C 380 120, 900 250, 1660 90" strokeOpacity=".5" strokeDasharray="10 8" />
              <path className="flow-b" d="M-40 120 C 460 260, 1000 60, 1660 220" strokeOpacity=".38" strokeDasharray="6 10" />
              <path className="flow-c" d="M-40 430 C 520 330, 1040 420, 1660 330" strokeOpacity=".26" strokeDasharray="3 12" />
              <path d="M200 470 L 640 96 L 1180 470" strokeOpacity=".2" />
              <circle cx="640" cy="96" r="5" strokeOpacity=".8" />
              <circle cx="640" cy="96" r="58" strokeOpacity=".3" />
              <circle cx="640" cy="96" r="126" strokeOpacity=".17" />
              <circle cx="640" cy="96" r="210" strokeOpacity=".1" />
              <circle cx="1290" cy="250" r="4" strokeOpacity=".7" />
              <circle cx="1290" cy="250" r="46" strokeOpacity=".22" />
              <circle cx="1290" cy="250" r="104" strokeOpacity=".12" />
              <path d="M1290 250 L 1290 470" strokeOpacity=".18" strokeDasharray="2 6" />
              <path d="M640 96 L 640 470" strokeOpacity=".18" strokeDasharray="2 6" />
            </g>
            <g fontFamily="Fragment Mono, monospace" fontSize="11" letterSpacing="1.6" fill="#a8c7ff">
              <text x="662" y="88" fillOpacity=".7">VOR 112.30</text>
              <text x="1312" y="244" fillOpacity=".55">NDB 348</text>
              <text x="60" y="292" fillOpacity=".5">RTE W-16 · FL 340</text>
              <text x="60" y="112" fillOpacity=".38">RTE A-4 · FL 410</text>
            </g>
          </svg>
          <div className="ph-bp-v" />
          <div className="ph-bp-h" />
          <div className="ph-bp-box" />
          <div className="ph-bp-box-inner" />
          <div className="ph-bp-phi">φ 1.618</div>
          <div className="ph-bp-div">div. 0.618</div>
        </div>

        <div className="ph-ring" ref={ringRef} aria-hidden="true" />
        <div className="ph-hero-scrim" aria-hidden="true" />

        <div className="ph-hero-copy">
          <div className="ph-eyebrow">the secret behind</div>
          <h1 className="ph-hero-title">
            How an idea gets from a ridgeline at five in the morning to something you can hold in your hands.
          </h1>
        </div>
      </section>

      <section className="ph-statement" id="statement">
        <div className="inner">
          <p className="ph-statement-lead">I don&apos;t have ideas. I notice them, then get out of the way.</p>
          <p className="ph-statement-body">
            What follows is the whole method, such as it is. It is not a process diagram and it does not run
            in a straight line — it turns, and the same six stages keep coming back around. Scroll to move the dial.
          </p>
        </div>
      </section>

      <section className="ph-dial-track" id="dial" ref={trackRef}>
        <div className="ph-dial-stage">
          <div className="ph-dial-glow" aria-hidden="true" />
          <canvas className="ph-glyph" ref={glyphRef} aria-hidden="true" />

          <div className="ph-guide-l" aria-hidden="true" />
          <div className="ph-guide-r" aria-hidden="true" />

          <div className="ph-lens" aria-hidden="true">
            <div className="ph-lens-ticks" ref={ticksRef} />
            <div className="ph-lens-scale" ref={scaleRef}>
              {STAGES.map((stage) => (
                <div className="ph-lens-mark" key={stage.label}>
                  <span className="ph-lens-num">{stage.n}</span>
                  <span className="ph-lens-tick" />
                </div>
              ))}
            </div>
            <div className="ph-lens-index" ref={lensIndexRef} />
          </div>

          <div className="ph-dial" ref={dialRef} aria-hidden="true">
            {STAGES.map((stage) => (
              <div className="ph-dial-item" key={stage.label}>
                <span className="ph-dial-num">
                  <span className="ph-num-dim">{stage.n.slice(0, 1)}</span>
                  <span className="ph-num-hot">{stage.n.slice(1)}</span>
                </span>
                <span className="ph-dial-label">{stage.label}</span>
              </div>
            ))}
          </div>

          <div className="ph-dial-ui">
            <div className="ph-readout">
              <span className="dev now" ref={readRef}>०१</span>
              <span aria-hidden="true">/</span>
              <span className="dev">०६</span>
            </div>

            <div className="ph-copy" ref={copyRef}>
              {STAGES.map((stage) => (
                <div className="ph-copy-item" key={stage.label}>
                  <div className="ph-copy-cue">{stage.cue}</div>
                  <p className="ph-copy-body">{stage.body}</p>
                </div>
              ))}
            </div>

            <div className="ph-turn">
              <div>Scroll to turn</div>
              <div className="deg" ref={degRef}>0°</div>
            </div>
          </div>
        </div>
      </section>

      {/* The dial is aria-hidden — decorative — so the stages are also spelled
          out here in document order for screen readers and for no-JS. */}
      <ul className="visually-hidden">
        {STAGES.map((stage) => (
          <li key={stage.label}>
            <strong>{stage.cue}: {stage.label}.</strong> {stage.body}
          </li>
        ))}
      </ul>

      <section className="ph-mark">
        <div className="ph-mark-photo" aria-hidden="true" style={{ backgroundImage: `url(${markBandImg})` }} />
        <div className="ph-mark-scrim" aria-hidden="true" />
        <div className="ph-mark-band">
          <span className="ph-mark-text">with resilience. with</span>
          <div className="ph-mark-logo">
            <img src={markLogo} alt="greenhueblues" />
          </div>
        </div>
      </section>

      <section className="ph-practice">
        <div className="ph-practice-photo" aria-hidden="true" style={{ backgroundImage: `url(${practiceImg})` }} />
        <div className="ph-practice-scrim" aria-hidden="true" />
        <div className="ph-practice-blur" aria-hidden="true" />
        <div className="inner">
          <div className="ph-rule-row">
            <div className="ph-rule-label">In practice</div>
            <div className="ph-rule-line" />
            <div className="ph-rule-num">07</div>
          </div>
          <div className="ph-practice-cols">
            <p className="ph-practice-head">The dial does not stop.</p>
            <div className="ph-practice-body">
              <p>
                Release feeds noticing, and the next thing is already sitting in the archive waiting for its
                proportion. Most of what I collect never becomes anything, and that is the point — the archive
                is not a pipeline.
              </p>
              <p className="ph-practice-pull">It is a place to be wrong cheaply for a long time.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="ph-contact" id="contact">
        <div className="inner">
          <h2>Have something that needs noticing?</h2>
          <a className="ph-contact-link" href="mailto:hello@greenhueblues.com">hello@greenhueblues.com</a>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}

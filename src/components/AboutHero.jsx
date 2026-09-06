import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { useHeroTuner } from './useHeroTuner'
import mountainPhoto from '../assets/about/mountain-photo.webp'
import mountainRidge from '../assets/about/mountain-ridge.webp'
import mountainGlow from '../assets/about/mountain-glow.webp'
import skyMask from '../assets/about/sky-mask.webp'

// Faithful port of the "About.dc.html" parallax hero from the greenhueblues
// Claude Design project — a pinned day-to-night mountain reveal driven by
// scroll. Structure, defs, filters, masks and the GSAP timeline are kept
// as authored; only the DCLogic class scaffolding around them is React now.
//
// How the transition works (worth knowing before touching any of it): the
// night sky (`ghb-reveal` gradient + stars) is drawn inside a group masked by
// `ghb-mask`, whose content is a white rect sitting low in the frame plus
// blurred blobs pushed through `ghb-cloudshape` (feTurbulence +
// feDisplacementMap) to give the edge an organic, cloud-like ragged shape.
// Scrolling sweeps that mask upward (y: 275 → -520), so night rises up the
// sky from the horizon with a soft cloud edge, while `sky-mask.png` keeps all
// of it clipped to the sky above the ridgeline. Removing the mask does not
// "simplify" this — it paints the whole sky black at rest and kills the
// effect entirely.
const BG_POS = '26% -24vw'
const BG_SIZE = '150% auto'
const CUE_POINTS = '599,584 599,623 590,613 590,616 600,626 610,616 610,613 601,623 601,584'

// The authored values. Every one of these is dial-able in dev via Tweakpane
// (run the dev server and hit /about?tune) — see useHeroTuner.js. Tune by eye,
// then paste the result back in here.
const TUNING = {
  photoY: -78,          // base photo parallax travel
  layerY: -34,          // ridge / sky / tint travel
  cloudY: -330,         // cirrus drift
  maskY: -520,          // how far the night sweep rises
  nightTint: 1,         // night tint ceiling
  glowTo: 1,            // sunlit-peak glow at full night
  cloudDim: 0.4,        // cirrus brightness at full night
  lerp: 0.12,           // how hard the scrub lags the scroll
  appearAt: 0.1,        // standfirst reveals
  appearFadeFrom: 0.78, // standfirst + cue retire
}

export default function AboutHero() {
  const navigate = useNavigate()
  const photoRef = useRef(null)
  const fgRef = useRef(null)
  const glowRef = useRef(null)
  const nightSvgRef = useRef(null)
  const nighttintRef = useRef(null)
  const starsRef = useRef(null)
  const cloud1Ref = useRef(null)
  const cloud2Ref = useRef(null)
  const appearRef = useRef(null)
  const cueRef = useRef(null)
  const arrowRef = useRef(null)
  const btnRef = useRef(null)
  const distRef = useRef(null)

  // In production this stays === TUNING for the life of the page, so the
  // effect below runs exactly once; only the dev panel ever replaces it.
  const [t, setTuning] = useState(TUNING)
  useHeroTuner(TUNING, setTuning)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const appearEl = appearRef.current
    const btn = btnRef.current
    const arrow = arrowRef.current

    const onEnter = () => gsap.to(arrow, { y: 10, duration: 0.8, ease: 'back.inOut(3)', overwrite: 'auto' })
    const onLeave = () => gsap.to(arrow, { y: 0, duration: 0.5, ease: 'power3.out', overwrite: 'auto' })
    const onClick = () => navigate('/about#meet')
    btn?.addEventListener('mouseenter', onEnter)
    btn?.addEventListener('mouseleave', onLeave)
    btn?.addEventListener('click', onClick)

    const removeListeners = () => {
      btn?.removeEventListener('mouseenter', onEnter)
      btn?.removeEventListener('mouseleave', onLeave)
      btn?.removeEventListener('click', onClick)
    }

    if (reduced) {
      if (appearEl) {
        appearEl.style.opacity = '1'
        appearEl.style.transform = 'none'
        appearEl.style.filter = 'none'
      }
      return removeListeners
    }

    // The authored timeline, tween for tween (parallaxDepth = 1).
    const tl = gsap.timeline({ paused: true, defaults: { duration: 1, ease: 'none' } })
      .fromTo(photoRef.current, { y: 0 }, { y: t.photoY }, 0)
      .fromTo([fgRef.current, glowRef.current, nightSvgRef.current, nighttintRef.current], { y: 0 }, { y: t.layerY }, 0)
      .fromTo(nighttintRef.current, { opacity: 0 }, { opacity: t.nightTint }, 0)
      .fromTo(glowRef.current, { opacity: 0.35 }, { opacity: t.glowTo }, 0)
      .fromTo(starsRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.4)
      .fromTo(cloud1Ref.current, { filter: 'brightness(1) saturate(1)' }, { filter: 'brightness(0.34) saturate(0.72)' }, 0)
      .fromTo(cloud2Ref.current, { filter: 'brightness(1)' }, { filter: `brightness(${t.cloudDim})` }, 0)
      .fromTo(cloud2Ref.current, { y: -40 }, { y: t.cloudY }, 0)
      .fromTo(cloud1Ref.current, { y: 275 }, { y: t.maskY }, 0)
      // The scroll cue is hero furniture too — retire it with the section
      // rather than leaving it floating over the bio that scrolls up next.
      .fromTo(
        [arrowRef.current, cueRef.current],
        { opacity: 1 },
        { opacity: 0, duration: 1 - t.appearFadeFrom },
        t.appearFadeFrom
      )

    let eased = 0
    let appearArmed = false
    let appearDone = false
    let raf = 0

    const showAppear = () => {
      if (!appearEl) return
      appearEl.style.transition =
        'opacity 1.1s cubic-bezier(.2,.7,.2,1), transform 1.1s cubic-bezier(.2,.7,.2,1), filter 1.1s cubic-bezier(.2,.7,.2,1)'
      appearEl.style.opacity = '1'
      appearEl.style.transform = 'translateY(0)'
      appearEl.style.filter = 'blur(0px)'
      appearDone = true
    }

    const scrollProgress = () => {
      const y = window.pageYOffset || document.documentElement.scrollTop || 0
      const distHeight = distRef.current ? distRef.current.offsetHeight : window.innerHeight * 2
      const span = distHeight - window.innerHeight
      const raw = span > 0 ? Math.min(1, Math.max(0, y / span)) : 0
      return raw * raw * (3 - 2 * raw)
    }

    const tick = () => {
      const p = scrollProgress()
      eased += (p - eased) * t.lerp
      if (Math.abs(p - eased) < 0.0005) eased = p
      tl.progress(eased)

      if (!appearDone) {
        if (!appearArmed) {
          appearArmed = true
          if (appearEl && eased <= t.appearAt) {
            appearEl.style.transition = 'none'
            appearEl.style.opacity = '0'
            appearEl.style.transform = 'translateY(9px)'
            appearEl.style.filter = 'blur(6px)'
            void appearEl.offsetWidth
          }
        }
        if (eased > t.appearAt) showAppear()
      } else if (appearEl) {
        // Once revealed, the line tracks scroll on the way out: it fades over
        // the tail of the pinned range, and comes back if you scroll up.
        const out = eased > t.appearFadeFrom
          ? Math.min(1, (eased - t.appearFadeFrom) / (1 - t.appearFadeFrom))
          : 0
        // The cue's hit area is invisible but still clickable, so it has to
        // stand down with the arrow or it hijacks clicks meant for the bio.
        if (btn) btn.style.pointerEvents = out > 0 ? 'none' : ''
        if (out > 0) {
          appearEl.style.transition = 'none'
          appearEl.style.opacity = String(1 - out)
        } else if (appearEl.style.opacity !== '1') {
          appearEl.style.transition = 'opacity .4s cubic-bezier(.2,.7,.2,1)'
          appearEl.style.opacity = '1'
        }
      }

      raf = requestAnimationFrame(tick)
    }

    eased = scrollProgress()
    tl.progress(eased)
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      tl.kill()
      removeListeners()
    }
  }, [navigate, t])

  return (
    <div className="hero-wrap">
      <div className="hero-dist" ref={distRef} />
      <div className="hero-stage">
        <div
          className="hero-photo"
          ref={photoRef}
          aria-hidden="true"
          style={{ background: `url(${mountainPhoto}) ${BG_POS} / ${BG_SIZE} no-repeat` }}
        />
        <div className="hero-scrim" aria-hidden="true" />

        <svg
          ref={nightSvgRef}
          className="hero-night-svg"
          viewBox="0 0 1200 800"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
          style={{
            maskImage: `url(${skyMask})`,
            WebkitMaskImage: `url(${skyMask})`,
            maskSize: BG_SIZE,
            WebkitMaskSize: BG_SIZE,
            maskPosition: BG_POS,
            WebkitMaskPosition: BG_POS,
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
          }}
        >
          <g mask="url(#ghb-mask)">
            <rect fill="url(#ghb-reveal)" x="-200" y="-200" width="1600" height="1200" />
            <g ref={starsRef} fill="#dfe8ff">
              {STARS.map(([cx, cy, r, o], i) => (
                <circle key={i} cx={cx} cy={cy} r={r} opacity={o} />
              ))}
            </g>
            <polyline ref={cueRef} fill="rgba(255,255,255,.75)" points={CUE_POINTS} />
          </g>
        </svg>

        <div
          className="hero-fg"
          ref={fgRef}
          aria-hidden="true"
          style={{ background: `url(${mountainRidge}) ${BG_POS} / ${BG_SIZE} no-repeat` }}
        />
        <div className="hero-nighttint" ref={nighttintRef} aria-hidden="true" />
        <div
          className="hero-glow"
          ref={glowRef}
          aria-hidden="true"
          style={{ background: `url(${mountainGlow}) ${BG_POS} / ${BG_SIZE} no-repeat` }}
        />

        <svg className="hero-night-svg" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <g id="ghb-blobs">
              <ellipse cx="110" cy="624" rx="200" ry="42" />
              <ellipse cx="340" cy="610" rx="160" ry="50" />
              <ellipse cx="705" cy="606" rx="180" ry="52" />
              <ellipse cx="1085" cy="614" rx="170" ry="46" />
              <ellipse cx="470" cy="644" rx="260" ry="34" />
              <ellipse cx="860" cy="648" rx="270" ry="32" />
            </g>
            <filter id="ghb-cloudshape" x="-35%" y="-90%" width="170%" height="320%" colorInterpolationFilters="sRGB">
              <feTurbulence type="fractalNoise" baseFrequency="0.0072 0.0115" numOctaves="5" seed="17" result="n" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="s" />
              <feDisplacementMap in="s" in2="n" scale="165" xChannelSelector="R" yChannelSelector="G" result="d" />
              <feComponentTransfer in="d" result="m">
                <feFuncA type="table" tableValues="0 0 0.06 0.42 0.86 1 1" />
              </feComponentTransfer>
              <feGaussianBlur in="m" stdDeviation="2.5" />
            </filter>
            <filter id="ghb-cirrus" x="-30%" y="-260%" width="160%" height="620%" colorInterpolationFilters="sRGB">
              <feTurbulence type="fractalNoise" baseFrequency="0.0035 0.045" numOctaves="4" seed="5" result="n" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="s" />
              <feDisplacementMap in="s" in2="n" scale="130" xChannelSelector="R" yChannelSelector="G" result="d" />
              <feComponentTransfer in="d">
                <feFuncA type="table" tableValues="0 0 0.18 0.48 0.8 1" />
              </feComponentTransfer>
            </filter>
            <linearGradient id="ghb-reveal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#101f36" />
              <stop offset="0.46" stopColor="#0a1424" />
              <stop offset="1" stopColor="#060a14" />
            </linearGradient>
            <linearGradient id="ghb-cloud" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#d3e0ff" />
              <stop offset="0.55" stopColor="#a8c7ff" />
              <stop offset="1" stopColor="#8ba3cd" />
            </linearGradient>
            <mask id="ghb-mask" maskUnits="userSpaceOnUse" x="-400" y="-1200" width="2000" height="3600">
              <g ref={cloud1Ref}>
                <rect fill="#fff" x="-200" y="600" width="1600" height="2400" />
                <g fill="#fff" filter="url(#ghb-cloudshape)">
                  <use href="#ghb-blobs" />
                </g>
              </g>
            </mask>
          </defs>

          <g ref={cloud2Ref} opacity=".34">
            <g fill="url(#ghb-cloud)" filter="url(#ghb-cirrus)">
              <ellipse cx="260" cy="252" rx="270" ry="18" />
              <ellipse cx="760" cy="214" rx="320" ry="15" />
              <ellipse cx="1080" cy="272" rx="230" ry="16" />
            </g>
          </g>

          <polyline ref={arrowRef} className="hero-cue" points={CUE_POINTS} />
          <rect ref={btnRef} className="hero-arrowbtn" width="120" height="90" x="540" y="562" opacity="0" />
        </svg>

        <div className="hero-appear" ref={appearRef}>
          I believe in consciousness.<span>So Should You.</span>
        </div>
      </div>
      <div className="hero-spacer" />
    </div>
  )
}

// Star field, ported verbatim (coordinates in the 1200×800 viewBox).
const STARS = [
  [437, 99, 2.03, 0.58], [737, 413, 2.25, 0.72], [569, 391, 1.13, 0.59], [435, 65, 2.04, 0.57], [355, 27, 1.15, 0.73],
  [1211, -179, 2.44, 0.64], [1165, 331, 1.07, 0.44], [71, 252, 1.23, 0.30], [1203, -164, 1.92, 0.52], [38, -175, 1.35, 0.58],
  [1398, 394, 2.34, 0.42], [1095, 106, 1.45, 0.37], [1394, 4, 0.93, 0.50], [420, 152, 1.38, 0.62], [40, 238, 2.40, 0.45],
  [332, -67, 1.73, 0.55], [383, 386, 1.80, 0.61], [-73, 380, 2.31, 0.47], [-44, 1, 1.20, 0.40], [824, 64, 1.11, 0.52],
  [-28, -61, 1.33, 0.26], [-199, 286, 1.79, 0.52], [-190, 27, 1.69, 0.60], [336, -34, 2.40, 0.34], [809, 176, 1.17, 0.33],
  [-148, 194, 2.27, 0.30], [158, -17, 2.35, 0.37], [652, -176, 1.40, 0.54], [486, -71, 1.93, 0.73], [1364, 88, 1.88, 0.56],
  [-47, -182, 2.44, 0.58], [877, 277, 1.89, 0.63], [1240, 44, 2.07, 0.41], [388, -46, 1.33, 0.32], [1043, 117, 0.96, 0.66],
  [336, 285, 1.63, 0.60], [56, 5, 1.62, 0.40], [247, 134, 1.20, 0.35], [-129, -29, 1.89, 0.61], [-127, -48, 0.96, 0.51],
  [1161, 142, 1.07, 0.35], [34, -189, 2.47, 0.71], [-24, 421, 1.92, 0.60], [-45, 264, 1.63, 0.47], [1330, 127, 1.84, 0.53],
  [712, -158, 2.20, 0.34], [492, -149, 2.17, 0.41], [367, 331, 0.92, 0.71], [780, -67, 2.04, 0.40], [14, 4, 2.02, 0.51],
  [648, -86, 2.25, 0.54], [-84, 218, 1.75, 0.57], [1278, 190, 1.72, 0.62], [145, -38, 2.27, 0.41],
]

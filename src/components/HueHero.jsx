import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import HueLockup from './HueLockup.jsx'
import HuePansy from './HuePansy.jsx'
import marigolds from '../assets/about/hue/marigolds.webp'
import marigoldsSmall from '../assets/about/hue/marigolds-1200.webp'
import './HueHero.css'

gsap.registerPlugin(ScrollTrigger)

// The about page's opening, and the brand deck's first two slides in one
// frame: the lockup in off-white over the marigolds, then the same lockup in
// yellow on the blue. The blue plate is laid exactly over the photographic one
// and wiped up from the foot as the frame is scrolled, so the type stays put
// and the edge passes through it -- the slide changes under the reader rather
// than scrolling away.
//
// On load the photograph comes up out of the black it is printed over, the
// grotesk rises and "Blues" is written in.
//
// The blue plate carries a pansy drawn in words (HuePansy). The wipe is what
// shows it, so the wipe drives it: once the plate is mostly in, the pansy is
// written; while it is only partly in, its idle life holds; back on the
// photograph, it is unset, ready to be written again.
//
// Reduced motion gets the two slides as two plain screens, one after the
// other: nothing pinned, nothing wiped, the pansy drawn and still.

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// How far in the blue plate has to be before the pansy is written, and how
// near the photograph the reader has to come back for it to be unset.
const PANSY_IN = 0.85
const PANSY_OUT = 0.02

export default function HueHero() {
  const rootRef = useRef(null)
  const pansyRef = useRef(null)

  // Layout effect, so the pinned arrangement and the intro's first frame are
  // in place before the first paint rather than one frame after it.
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || reducedMotion()) return undefined

    root.classList.add('is-live')

    // The pansy's own layout effect has already run (a child's runs before
    // its parent's), so it is ready to be called from the first refresh.
    const syncPansy = ({ progress }) => {
      const pansy = pansyRef.current
      if (!pansy) return
      if (progress >= PANSY_IN) pansy.play()
      else if (progress <= PANSY_OUT) pansy.reset()
      else pansy.hold()
    }

    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .fromTo('.hue-photo img', { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 2, ease: 'power2.out' }, 0)
        .fromTo('.hue-plate--photo .gh-word', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1.1 }, 0.35)
        .fromTo('.hue-plate--photo .gh-wipe', { attr: { width: 0 } }, { attr: { width: 260 }, duration: 1.4, ease: 'power2.inOut' }, 0.8)
        .fromTo('.hue-plate--photo .hue-tag', { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.9 }, 1.5)

      gsap
        .timeline({
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: '+=100%',
            scrub: true,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: syncPansy,
            onRefresh: syncPansy,
          },
        })
        .fromTo(
          '.hue-plate--blue',
          { clipPath: 'inset(100% 0% 0% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none' },
          0
        )
        .to('.hue-photo', { scale: 1.06, ease: 'none' }, 0)
    }, root)

    let cancelled = false
    document.fonts?.ready.then(() => !cancelled && ScrollTrigger.refresh())

    return () => {
      cancelled = true
      ctx.revert()
      root.classList.remove('is-live')
    }
  }, [])

  return (
    <section className="hue-hero hero-wrap" ref={rootRef} aria-labelledby="hue-title">
      <div className="hue-plate hue-plate--photo">
        <div className="hue-photo" aria-hidden="true">
          <img
            src={marigolds}
            srcSet={`${marigoldsSmall} 1200w, ${marigolds} 2400w`}
            sizes="100vw"
            alt=""
            fetchPriority="high"
          />
        </div>
        <h1 className="hue-title" id="hue-title">
          <span className="visually-hidden">About Sumip Chaudhary (greenhueblues)</span>
          <HueLockup wipe="hue-wipe" />
        </h1>
        <p className="hue-tag">I believe in consciousness, so should you</p>
      </div>

      <div className="hue-plate hue-plate--blue">
        <HuePansy ref={pansyRef} />
        <div className="hue-title">
          <HueLockup />
        </div>
        <p className="hue-tag">Green keeps me grounded, blue keeps me limitless</p>
      </div>
    </section>
  )
}

import { useEffect, useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SiteNav } from '../components/SiteChrome'
import HomeFx from '../components/HomeFx.jsx'
import PhilosophyHero from '../components/PhilosophyHero.jsx'
import NightPreface from '../components/NightPreface.jsx'
import MethodPress from '../components/MethodPress.jsx'
import HomeFooter from '../components/HomeFooter.jsx'
import './Philosophy.css'

gsap.registerPlugin(ScrollTrigger)

// Philosophy, printed on the home page's press: the same stock and inks, the
// same masthead, the red band running down every sheet at the same x, and the
// same closing sheet -- the ink colophon.
//
//   paper   the hero: the title, and the plate the method makes
//   marine  the preface: the thesis over the night ridge
//   paper   the press: six stages, pinned, making the plate again
//   paper   the coda: what happens after release, and the imprint
//   ink     colophon

// The coda prints the way the contact sheet's lede does: the title locks into
// register, then the rule goes down and the type comes up off it. Played once, as it comes into view.
function useCodaPrint(rootRef) {
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined

    const ctx = gsap.context(() => {
      gsap.fromTo('.ph-coda-title', { '--mis': 1, y: 24, opacity: 0 }, {
        '--mis': 0,
        y: 0,
        opacity: 1,
        duration: 1.3,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.ph-coda-title', start: 'top 86%', once: true },
      })
      // Opacity only, never visibility: the copy stays in the reading order
      // whether or not it has been scrolled to.
      gsap
        .timeline({ scrollTrigger: { trigger: '.ph-coda-body', start: 'top 88%', once: true } })
        .fromTo('.ph-coda-rule', { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: 'power4.inOut' })
        .fromTo(
          '.ph-coda-body p',
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.12 },
          0.45
        )
      gsap.fromTo('.ph-imprint', { opacity: 0 }, {
        opacity: 1,
        duration: 1,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.ph-imprint', start: 'top 95%', once: true },
      })
    }, root)

    return () => ctx.revert()
  }, [rootRef])
}

export default function Philosophy() {
  const codaRef = useRef(null)

  useEffect(() => {
    const previous = document.title
    document.title = 'Philosophy | greenhueblues'
    return () => {
      document.title = previous
    }
  }, [])

  useCodaPrint(codaRef)

  return (
    <div className="ph">
      <SiteNav />
      <HomeFx />

      <main id="main">
        <PhilosophyHero />
        <NightPreface />
        <MethodPress />

        <section className="ph-coda" ref={codaRef} aria-labelledby="ph-coda-title">
          <div className="ph-coda-grid">
            <h2 className="ph-coda-title" id="ph-coda-title">The press does not stop</h2>
            <div className="ph-coda-body">
              <span className="ph-coda-rule" aria-hidden="true" />
              <p>
                Release feeds noticing, and the next thing is already sitting in the archive waiting for its
                proportion. Most of what I collect never becomes anything, and that is the point: the archive
                is not a pipeline.
              </p>
              <p className="ph-coda-pull">It is a place to be wrong cheaply for a long time.</p>
            </div>
          </div>

          {/* The imprint, where a book names its printer. */}
          <p className="ph-imprint">
            <span className="ph-imprint-with">with resilience. with</span>
            <span className="ph-imprint-mark">greenhueblues</span>
          </p>

          <span className="ph-coda-band" aria-hidden="true" />
        </section>
      </main>

      <HomeFooter />
    </div>
  )
}

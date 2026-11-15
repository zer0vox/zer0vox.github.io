import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useHeroFx } from './HeroFx.js'
import PortraitSlab from './PortraitSlab.jsx'
import portraitSrc from '../assets/about/portrait.webp'
import './AboutHero.css'

gsap.registerPlugin(ScrollTrigger)

// The about page's opening sheet, set the way the home hero is: paper stock,
// the title thrown up in ink at the foot of the page, the portrait standing
// under the masthead, and the red overprint band through it. The title and its
// slogan are the home hero's own markup (#heroTitle, .hero-sub), so they are
// set, thrown up and lifted off by exactly the same code (index.css,
// HeroFx) -- the two sheets cannot drift apart.
//
// The portrait is the photograph itself, in black and white. It is multiplied
// into the paper, so the studio wall reads as the sheet rather than as a grey
// rectangle, and it thins to paper at the foot, where the photograph is cut
// off at the forearms.
//
// The portrait is also the easter egg (PortraitSlab): from the third click of
// a run the photograph starts to slip out of register, a little more with
// every click, until the ninth hands over to the slab.
//
// Reduced motion gets the finished sheet with nothing moving.

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export default function AboutHero() {
  const heroRef = useRef(null)

  useHeroFx(heroRef)

  // The title's lines are thrown up from their masks once they are in the
  // document, as on the home page.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      heroRef.current?.querySelectorAll('#heroTitle .line').forEach((line) => line.classList.add('in'))
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  // The portrait comes up off the paper as the title is thrown up, and on the
  // way out it runs a little ahead of the page. The band, on the sheet
  // itself, stays put.
  useEffect(() => {
    const hero = heroRef.current
    if (!hero || reducedMotion()) return undefined

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.ab-print',
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 1.6, delay: 0.2, ease: 'power2.out' }
      )

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
        .fromTo('.ab-plate', { y: 0 }, { y: () => -hero.offsetHeight * 0.1 }, 0)
    }, hero)

    return () => ctx.revert()
  }, [])

  return (
    <header className="hero hero--print ab-hero" id="top" ref={heroRef} data-printed>
      <div className="ab-art">
        <PortraitSlab className="ab-plate">
          <img
            className="ab-print"
            src={portraitSrc}
            alt="Portrait of Sumip Chaudhary, arms folded"
            width="840"
            height="1260"
            decoding="async"
          />
        </PortraitSlab>

        {/* The portrait's credit, set on the sheet under it. */}
        <span className="ab-slip" aria-hidden="true">
          Er. Sumip Chaudhary, Kathmandu
        </span>

        <span className="ab-band" aria-hidden="true" />
      </div>

      <div className="copy">
        <h1 id="heroTitle">
          <span className="line"><span className="inner">Meet</span></span>
          <span className="line"><span className="inner">the man<span className="dot">.</span></span></span>
        </h1>
        {/* The rule and the slogan are split exactly as on the home hero, so
            HeroFx handles them exactly as it does there. */}
        <p className="hero-sub">
          <span className="hfx-rule" aria-hidden="true"><span className="hfx-rule-ink" /></span>
          <span className="hfx-sub-text">I believe in consciousness. So should you.</span>
        </p>
      </div>
    </header>
  )
}

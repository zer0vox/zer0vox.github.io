import { Suspense, lazy, useEffect, useRef } from 'react'
// The work carousel is a raw WebGL2 pipeline below the fold; split off so the
// hero renders first. (The old fixed Fibonacci backdrop is gone: every section
// on this page is now an opaque printed sheet, so it was never visible.)
const DitherHelixCarousel = lazy(() => import('../components/DitherHelixCarousel'))
import { SiteNav } from '../components/SiteChrome'
import WorkStatement from '../components/WorkStatement.jsx'
import DuskPlate from '../components/DuskPlate.jsx'
import ContactPrint from '../components/ContactPrint.jsx'
import HomeFooter from '../components/HomeFooter.jsx'
import HomeFx from '../components/HomeFx.jsx'
import { useHeroFx } from '../components/HeroFx.js'
import dnaImg from '../assets/dna.webp'
import visionImg from '../assets/vision.webp'
// Panel 3 is the one photograph here that did not come off Sumip's camera:
// "bottom view of concrete spiral stair" by Len Cruz (unsplash.com/@lendcruz,
// unsplash.com/photos/ScEKf8u7y-c), Unsplash License — free to use, including
// commercially, with no attribution required. Credited anyway.
import logicImg from '../assets/logic-spiral.webp'
import limitlessImg from '../assets/limitless.webp'
// Hero art: a marine-ink halftone relief printed on a butter-yellow shape.
// Both PNG/WebP carry real alpha, so the paper colour of the hero shows through.
import heroPrint from '../assets/hero/print.png'
import heroButter from '../assets/hero/butter.webp'

// The four featured projects, in the order they were shown as stacked panels.
const WORK = [
  { image: dnaImg, title: 'DNA' },
  { image: visionImg, title: 'Vision' },
  { image: logicImg, title: 'Logic' },
  { image: limitlessImg, title: 'Limitless' },
]

export default function Home() {
  const heroRef = useRef(null)
  const workRef = useRef(null)

  useHeroFx(heroRef)

  useEffect(() => {
    requestAnimationFrame(() => {
      document.querySelectorAll('#heroTitle .line').forEach((line) => line.classList.add('in'))
    })
  }, [])

  return (
    <>
      <SiteNav />
      <HomeFx />

      <main id="main">

      <header className="hero hero--print" id="top" ref={heroRef}>
        <div className="hero-art" aria-hidden="true">
          <img className="hero-butter" src={heroButter} alt="" />
          <img className="hero-print" src={heroPrint} alt="" />
          <span className="hero-band" />
        </div>
        <div className="copy">
          <h1 id="heroTitle">
            <span className="line"><span className="inner">The Sumip</span></span>
            <span className="line"><span className="inner">Chaudhary</span></span>
            <span className="line"><span className="inner">Collective<span className="dot">.</span></span></span>
          </h1>
          {/* The 2px rule is its own pair of spans so it can be laid in from
              the left and drawn back to the right (HeroFx); the slogan sits
              in a text-only span because the decode rewrites its text. */}
          <p className="hero-sub">
            <span className="hfx-rule" aria-hidden="true"><span className="hfx-rule-ink" /></span>
            <span className="hfx-sub-text">Building mindful systems for a conscious world.</span>
          </p>
        </div>
      </header>

      {/* Practice and work as one marine spread. The page's own scroll through
          this tall wrapper first prints the statement, then turns the helix;
          the stage pins to the viewport meanwhile. */}
      <section className="work-helix" id="work" aria-label="Practice and featured projects" ref={workRef}>
        <div className="work-helix-stage">
          <div className="work-helix-text">
            <WorkStatement scrollRef={workRef} />
          </div>
          <div className="work-helix-carousel">
            <Suspense fallback={null}>
              <DitherHelixCarousel
                items={WORK}
                cardRatio={1.8}
                shift={0.18}
                scrollRef={workRef}
                accent="#f4f2ed"
                ink="#f4f2ed"
              />
            </Suspense>
          </div>
          {/* The hero's red overprint band, carried on down the sheet. */}
          <span className="work-band" aria-hidden="true" />
        </div>
      </section>

      <DuskPlate />

      <ContactPrint />

      </main>
      <HomeFooter />
    </>
  )
}

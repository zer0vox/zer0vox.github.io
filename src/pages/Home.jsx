import { Suspense, lazy, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useRevealInView, EASE_PANEL } from '../components/reveal.js'
// The animated backdrop is decorative and aria-hidden, and it drags in ogl and
// GSAP's ScrollTrigger — ~30 kB gzip that first paint does not need. Split off
// so the hero text renders first and the canvas fades in behind it, which is
// the order it already appears in anyway thanks to its 0.9s fade.
const FibonacciPsyBackground = lazy(() => import('../components/FibonacciPsyBackground'))
import { SiteNav, SiteFooter } from '../components/SiteChrome'
import ContactCta from '../components/ContactCta.jsx'
import dnaImg from '../assets/dna.webp'
import visionImg from '../assets/vision.webp'
// Panel 3 is the one photograph here that did not come off Sumip's camera:
// "bottom view of concrete spiral stair" by Len Cruz (unsplash.com/@lendcruz,
// unsplash.com/photos/ScEKf8u7y-c), Unsplash License — free to use, including
// commercially, with no attribution required. Credited anyway.
import logicImg from '../assets/logic-spiral.webp'
import limitlessImg from '../assets/limitless.webp'

// Reveals a panel's number/name as it scrolls into view. The parent span keeps
// its translateY(-50%) centering; this inner span animates on its own axis, so
// the two transforms never conflict.
function PanelReveal({ children, delay = 0, from = 'left' }) {
  const ref = useRef(null)
  useRevealInView(ref, {
    x: from === 'right' ? 40 : -40,
    duration: 0.7,
    delay,
    ease: EASE_PANEL,
    amount: 0.5,
  })

  return (
    <span ref={ref} style={{ display: 'inline-block' }}>
      {children}
    </span>
  )
}

export default function Home() {
  const heroRef = useRef(null)

  useEffect(() => {
    requestAnimationFrame(() => {
      document.querySelectorAll('#heroTitle .line').forEach((line) => line.classList.add('in'))
    })

    const about = document.getElementById('aboutCopy')
    if (!about) return undefined

    let cancelled = false
    let teardown = null

    // split-type is needed for exactly one paragraph, below the fold, so it is
    // fetched after first paint rather than riding in the main chunk.
    import('split-type').then(({ default: SplitType }) => {
      // The route can unmount before this resolves.
      if (cancelled) return

      // split-type does the word splitting now, so the copy stays plain prose
      // in the markup instead of being hand-wrapped in <span class="w"> per
      // word (which meant re-splitting by hand on every copy edit, and left
      // the sentence unreadable to anything parsing the DOM).
      const split = new SplitType(about, {
        types: 'words',
        wordClass: 'w',
        tagName: 'span',
      })
      const words = split.words ?? []

      // How many words are lit right now. Tracked so a scroll frame only
      // touches the words whose state actually changed: the cutoff moves by a
      // word or two per frame, but this used to call classList.toggle on every
      // word in the paragraph on every single scroll event.
      let lit = 0
      let frame = 0

      const apply = () => {
        frame = 0
        const rect = about.getBoundingClientRect()
        const vh = window.innerHeight
        const startY = vh * 0.75
        const endY = vh * 0.25
        const total = startY - endY + rect.height
        const traveled = Math.max(0, startY - rect.top)
        const progress = Math.max(0, Math.min(1, traveled / total))
        const cutoff = Math.floor(progress * words.length)
        if (cutoff === lit) return

        // Walk only the span between the old and new cutoff, in whichever
        // direction the reader moved.
        if (cutoff > lit) for (let i = lit; i < cutoff; i++) words[i]?.classList.add('lit')
        else for (let i = lit - 1; i >= cutoff; i--) words[i]?.classList.remove('lit')
        lit = cutoff
      }

      // Coalesce to one measurement per frame: the listener fires far more
      // often than the screen refreshes, and each call forces a layout.
      const update = () => {
        if (!frame) frame = requestAnimationFrame(apply)
      }

      apply()
      window.addEventListener('scroll', update, { passive: true })
      window.addEventListener('resize', update)

      teardown = () => {
        if (frame) cancelAnimationFrame(frame)
        window.removeEventListener('scroll', update)
        window.removeEventListener('resize', update)
        split.revert()
      }
    })

    return () => {
      cancelled = true
      teardown?.()
    }
  }, [])


  return (
    <>
      <Suspense fallback={null}>
        <FibonacciPsyBackground />
      </Suspense>
      <SiteNav />

      <main id="main">

      <header className="hero" id="top" ref={heroRef}>
        <div className="bg" />
        <div className="hero-pattern" />
        <div className="hero-iridescence" aria-hidden="true">
          <span className="irid irid--a" />
          <span className="irid irid--b" />
        </div>
        <div className="copy">
          <h1 id="heroTitle">
            <span className="line"><span className="inner">Building mindful systems for a</span></span>
            <span className="line"><span className="inner">conscious world. Shaping enlightened</span></span>
            <span className="line"><span className="inner">design with purposeful vision.</span></span>
          </h1>
          <span className="scroll"><span className="par">(</span>Scroll<span className="par">)</span></span>
        </div>
      </header>

      <section className="panels" id="work" aria-label="Featured projects">
        <article className="panel p1">
          <div className="pbg" style={{ background: `linear-gradient(rgba(0,0,0,0.38), rgba(0,0,0,0.38)), url(${dnaImg}) center/cover no-repeat` }} />
          <span className="label"><PanelReveal>1</PanelReveal></span>
          <span className="name"><PanelReveal delay={0.08} from="right">DNA</PanelReveal></span>
        </article>
        <article className="panel p2">
          <div className="pbg" style={{ background: `linear-gradient(rgba(0,0,0,0.42), rgba(0,0,0,0.42)), url(${visionImg}) center/cover no-repeat` }}>
            <div className="grid" />
            <svg viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 100 C 80 20, 160 180, 240 100 S 400 20, 480 100 S 640 180, 720 100 S 880 20, 960 100 S 1120 180, 1200 100" fill="none" stroke="#F4D03F" strokeWidth="3" />
              <path d="M0 100 C 80 50, 160 150, 240 100 S 400 50, 480 100 S 640 150, 720 100 S 880 50, 960 100 S 1120 150, 1200 100" fill="none" stroke="rgba(244,208,63,.35)" strokeWidth="1.5" />
            </svg>
          </div>
          <span className="label"><PanelReveal>2</PanelReveal></span>
          <span className="name"><PanelReveal delay={0.08} from="right">Vision</PanelReveal></span>
        </article>
        <article className="panel p3">
          <div className="pbg" style={{ background: `linear-gradient(rgba(0,0,0,0.18), rgba(0,0,0,0.18)), url(${logicImg}) center/cover no-repeat` }} />
          <span className="label"><PanelReveal>3</PanelReveal></span>
          <span className="name"><PanelReveal delay={0.08} from="right">Logic</PanelReveal></span>
        </article>
        <article className="panel p4">
          <div className="pbg" style={{ background: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${limitlessImg}) center/cover no-repeat` }} />
          <span className="label"><PanelReveal>4</PanelReveal></span>
          <span className="name"><PanelReveal delay={0.08} from="right">Limitless</PanelReveal></span>
        </article>
      </section>

      <section className="about wrap" id="about">
        <p id="aboutCopy">
          greenhueblues is the personal creative practice of Sumip Chaudhary,
          based in Kathmandu and working globally.
        </p>
        <Link to="/about" className="about-more">More About →</Link>
      </section>

      <ContactCta />

      </main>
      <SiteFooter />
    </>
  )
}

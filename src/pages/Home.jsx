import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import FibonacciPsyBackground from '../components/FibonacciPsyBackground'
import { useHeroGlare } from '../components/useHeroGlare'
import dnaImg from '../assets/dna.png'
import visionImg from '../assets/vision.png'
import logicImg from '../assets/logic.JPG'
import limitlessImg from '../assets/limitless.JPG'

// Reveals a panel's number/name as it scrolls into view. The parent span keeps
// its translateY(-50%) centering; this inner span animates on its own axis, so
// the two transforms never conflict.
function PanelReveal({ children, delay = 0, from = 'left' }) {
  const offset = from === 'right' ? 40 : -40
  return (
    <motion.span
      style={{ display: 'inline-block' }}
      initial={{ opacity: 0, x: offset }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.7, ease: [0.22, 0.7, 0.18, 1], delay }}
    >
      {children}
    </motion.span>
  )
}

export default function Home() {
  const ctaHeadingRef = useRef(null)
  const footerWordRef = useRef(null)
  const heroRef = useRef(null)
  useHeroGlare(heroRef)

  // Landing on a deep link like /#about should jump to that section once the
  // page has mounted.
  useEffect(() => {
    const id = window.location.hash.slice(1)
    if (id && id !== 'top') {
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView()
      })
    }
  }, [])

  useEffect(() => {
    requestAnimationFrame(() => {
      document.querySelectorAll('#heroTitle .line').forEach((line) => line.classList.add('in'))
    })

    const about = document.getElementById('aboutCopy')
    if (about) {
      const words = Array.from(about.querySelectorAll('.w'))
      const update = () => {
        const rect = about.getBoundingClientRect()
        const vh = window.innerHeight
        const startY = vh * 0.75
        const endY = vh * 0.25
        const total = startY - endY + rect.height
        const traveled = Math.max(0, startY - rect.top)
        const progress = Math.max(0, Math.min(1, traveled / total))
        const cutoff = Math.floor(progress * words.length)
        words.forEach((word, idx) => word.classList.toggle('lit', idx < cutoff))
      }

      update()
      window.addEventListener('scroll', update, { passive: true })
      window.addEventListener('resize', update)

      return () => {
        window.removeEventListener('scroll', update)
        window.removeEventListener('resize', update)
      }
    }
    return undefined
  }, [])

  useEffect(() => {
    if (!ctaHeadingRef.current || !footerWordRef.current) return

    gsap.fromTo(
      ctaHeadingRef.current,
      { y: 28, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.85, ease: 'power3.out', delay: 0.15 }
    )

    gsap.fromTo(
      footerWordRef.current,
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.25 }
    )
  }, [])


  return (
    <>
      <FibonacciPsyBackground />
      <motion.nav
        className="top"
        id="nav"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
      >
        <div className="inner">
          <a href="#top" className="brand">greenhueblues<span className="reg">®</span></a>
          <ul>
            <li><a href="#work">Work</a></li>
            <li><a href="#about">About</a></li>
          </ul>
          <div className="right">
            <a href="#">X</a>
            <a href="#">Instagram</a>
            <a href="#">LinkedIn</a>
            <a href="#contact">Contact</a>
          </div>
        </div>
      </motion.nav>

      <header className="hero" id="top" ref={heroRef}>
        <div className="bg" />
        <div className="hero-pattern" />
        <div className="hero-iridescence" aria-hidden="true">
          <span className="irid irid--a" />
          <span className="irid irid--b" />
        </div>
        <div className="hero-glare" aria-hidden="true" />
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
          <div className="pbg" style={{ background: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${logicImg}) center/cover no-repeat` }} />
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
          <span className="w">greenhueblues</span> <span className="w">is</span> <span className="w">an</span> <span className="w">independent</span> <span className="w">design</span> <span className="w">studio</span> <span className="w">based</span> <span className="w">in</span> <span className="w">Kathmandu,</span> <span className="w">working</span> <span className="w">globally</span> <span className="w">with</span> <span className="w">brands</span> <span className="w">and</span> <span className="w">cultural</span> <span className="w">institutions.</span>
        </p>
        <a href="#about" className="about-more">More About Us →</a>
      </section>


      <section className="cta wrap" id="contact">
        <motion.h2
          ref={ctaHeadingRef}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.55 }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
        >
          Let&apos;s work together.
        </motion.h2>
      </section>

      <footer>
        <div className="ftr-inner">
          <div className="cols">
            <div className="col">
              <div className="h">Sitemap</div>
              <a href="#work">Work</a>
            </div>
            <div className="col">
              <div className="h">Studio</div>
              <a href="#about">About</a>
              <a href="#contact">Contact</a>
            </div>
            <div className="col">
              <div className="h">Social</div>
              <a href="#">X</a>
              <a href="#">Instagram</a>
              <a href="#">LinkedIn</a>
            </div>
          </div>
          <div className="word" ref={footerWordRef}>greenhueblues<span className="reg">®</span></div>
          <div className="baseline">
            <div />
            <div>Copyright 2026. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </>
  )
}

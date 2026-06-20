import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import FibonacciPsyBackground from '../components/FibonacciPsyBackground'
import PlaygroundSection from '../components/PlaygroundSection'
import LeadersSection from '../components/LeadersSection'
import DevSection from '../components/DevSection'
import AuthorizedSection from '../components/AuthorizedSection'
import dnaImg from '../assets/dna.png'
import visionImg from '../assets/vision.png'
import logicImg from '../assets/logic.JPG'
import limitlessImg from '../assets/limitless.JPG'

export default function Home() {
  const ctaHeadingRef = useRef(null)
  const footerWordRef = useRef(null)

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

  const indexRows = [
    ['E-Sikshya', 'React.js · Node.js · Google PaLM · Python', 'Full-Stack, AI/ML', '2025'],
    ['Blockchain Auth System', 'Solidity · Web3.js · React.js · Node.js', 'Blockchain, Full-Stack', '2025'],
    ['KaskoIsP', 'React.js · Node.js · REST API', 'Full-Stack, Web', '2025'],
    ['Coffee Vending FSM', 'Verilog · Xilinx ISE · FSM Design', 'Hardware, Simulation', '2024'],
  ]

  return (
    <>
      <FibonacciPsyBackground />
      <nav className="top" id="nav">
        <div className="inner">
          <a href="#top" className="brand">greenhueblues<span className="reg">®</span></a>
          <ul>
            <li><a href="#work">Work</a></li>
            <li><a href="#index">Index</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#playground">Playground</a></li>
            <li><a href="#leaders">Leaders</a></li>
            <li><a href="#dev">_dev</a></li>
            <li><a href="#authorized">_authorized</a></li>
          </ul>
          <div className="right">
            <a href="#">X</a>
            <a href="#">Instagram</a>
            <a href="#">LinkedIn</a>
            <a href="#contact">Contact</a>
          </div>
        </div>
      </nav>

      <header className="hero" id="top">
        <div className="bg" />
        <div className="hero-pattern" />
        <div className="copy">
          <h1 id="heroTitle">
            <span className="line"><span className="inner">Building mindful systems for a</span></span>
            <span className="line"><span className="inner">conscious world. Shaping enlightened</span></span>
            <span className="line"><span className="inner">design with purposeful vision.</span></span>
          </h1>
          <span className="scroll"><span className="par">(</span>Scroll<span className="par">)</span></span>
        </div>
      </header>

      <section className="panels" id="featured" aria-label="Featured projects">
        <article className="panel p1">
          <div className="pbg" style={{ background: `linear-gradient(rgba(0,0,0,0.38), rgba(0,0,0,0.38)), url(${dnaImg}) center/cover no-repeat` }} />
          <span className="label">1</span>
          <span className="name">DNA</span>
        </article>
        <article className="panel p2">
          <div className="pbg" style={{ background: `linear-gradient(rgba(0,0,0,0.42), rgba(0,0,0,0.42)), url(${visionImg}) center/cover no-repeat` }}>
            <div className="grid" />
            <svg viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 100 C 80 20, 160 180, 240 100 S 400 20, 480 100 S 640 180, 720 100 S 880 20, 960 100 S 1120 180, 1200 100" fill="none" stroke="#F4D03F" strokeWidth="3" />
              <path d="M0 100 C 80 50, 160 150, 240 100 S 400 50, 480 100 S 640 150, 720 100 S 880 50, 960 100 S 1120 150, 1200 100" fill="none" stroke="rgba(244,208,63,.35)" strokeWidth="1.5" />
            </svg>
          </div>
          <span className="label">2</span>
          <span className="name">Vision</span>
        </article>
        <article className="panel p3">
          <div className="pbg" style={{ background: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${logicImg}) center/cover no-repeat` }} />
          <span className="label">3</span>
          <span className="name">Logic</span>
        </article>
        <article className="panel p4">
          <div className="pbg" style={{ background: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${limitlessImg}) center/cover no-repeat` }} />
          <span className="label">4</span>
          <span className="name">Limitless</span>
        </article>
      </section>

      <section className="about wrap" id="about">
        <p id="aboutCopy">
          <span className="w">greenhueblues</span> <span className="w">is</span> <span className="w">an</span> <span className="w">independent</span> <span className="w">design</span> <span className="w">studio</span> <span className="w">based</span> <span className="w">in</span> <span className="w">Kathmandu,</span> <span className="w">working</span> <span className="w">globally</span> <span className="w">with</span> <span className="w">brands</span> <span className="w">and</span> <span className="w">cultural</span> <span className="w">institutions.</span>
        </p>
        <a href="#about" className="about-more">More About Us →</a>
      </section>

      <section className="index-sect wrap" id="work">
        <h2 id="index">Index</h2>
        <div className="index-table">
          {indexRows.map(([name, tech, cat, year]) => (
            <a className="index-row" href="#" key={name}>
              <span className="p-name">{name}</span>
              <span className="p-client">{tech}</span>
              <span className="p-cat">{cat}</span>
              <span className="p-yr">{year}</span>
              <span className="p-arr">→</span>
            </a>
          ))}
        </div>
      </section>

      <PlaygroundSection />

      <LeadersSection />

      <DevSection />

      <AuthorizedSection />

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
              <a href="#index">Index</a>
              <a href="#playground">Playground</a>
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

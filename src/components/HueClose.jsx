import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Link } from 'react-router-dom'
import { HomeLink } from './SiteChrome'
import { SocialTextLinks } from './social.jsx'
import Scribble from './Scribble.jsx'
import { CONTACT_EMAIL, CONTACT_MAILTO } from '../lib/contact.js'
import ghb from '../assets/brand/ghb.svg'
import './HueClose.css'

gsap.registerPlugin(ScrollTrigger)

// The about page's last screen and its footer in one: the address in white on
// the blue, the profiles under it, and a colophon signed with the "ghb"
// monogram, the same mark as the nav's. Everything the old closing sheets
// carried that a reader can act on, and nothing else.
//
// The one action is marked by hand: an arrow off "Say hello" at the address,
// and the address underlined, both written on as the screen comes up.
// Reduced motion gets them drawn.

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export default function HueClose() {
  const rootRef = useRef(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || reducedMotion()) return undefined

    const ctx = gsap.context(() => {
      gsap
        .timeline({
          defaults: { ease: 'power2.inOut' },
          scrollTrigger: { trigger: root, start: 'top 70%', once: true },
        })
        .fromTo('.hue-mail', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 0)
        .fromTo('.hue-close-arrow path', { strokeDashoffset: 1.01 }, { strokeDashoffset: 0, duration: 0.7 }, 0.35)
        .fromTo('.hue-mail-line path', { strokeDashoffset: 1.01 }, { strokeDashoffset: 0, duration: 0.9 }, 0.8)
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <footer className="hue-close" ref={rootRef}>
      <div className="hue-close-say">
        <h2 className="hue-close-tag">
          Say hello
          <Scribble kind="arrow" className="hue-close-arrow" />
        </h2>
        <a className="hue-mail" href={CONTACT_MAILTO}>
          {CONTACT_EMAIL}
          <Scribble kind="underline" className="hue-mail-line" />
        </a>
        <p className="hue-social">
          <SocialTextLinks />
        </p>
      </div>

      <div className="hue-foot">
        <img className="hue-foot-mark" src={ghb} alt="greenhueblues" width="52" height="40" />
        <nav className="hue-foot-nav" aria-label="Sitemap">
          <HomeLink>Home</HomeLink>
          <Link to="/philosophy">Philosophy</Link>
          <Link to="/about" aria-current="page">
            About
          </Link>
        </nav>
        <p className="hue-foot-copy">© 2026 greenhueblues</p>
      </div>
    </footer>
  )
}

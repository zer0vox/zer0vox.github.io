import { useCallback, useEffect, useState } from 'react'
import { SiteNav, SiteFooter } from '../components/SiteChrome'
import AboutHero from '../components/AboutHero'
import ExperienceTimeline from '../components/ExperienceTimeline'
import { CONTACT_EMAIL, CONTACT_MAILTO } from '../lib/contact.js'
import './About.css'

// Ported from the "About.dc.html" file in the greenhueblues Claude Design
// project. One piece of that design is intentionally not here: the
// Three.js/GLTF "logo story" scroll-section for the MandaapX building model
// (new dependency, separate brand, deferred on purpose). The mountain hero
// is real (see the note in AboutHero.jsx for what's placeholder vs. ported),
// and Meet the man, the Stack marquee, and contact are ported close to
// verbatim, restyled onto this site's own tokens.

// The stack as the logo row from the source design. The marks are hotlinked
// from two icon CDNs, so any of them can fail independently — `failed` below
// swaps a broken icon back to its name rather than leaving a gap. `flat` marks
// the icons those CDNs only serve in full colour, which need forcing to white.
const SI = (slug) => `https://cdn.simpleicons.org/${slug}/ffffff`
const IC = (name) => `https://api.iconify.design/${name}.svg?color=%23ffffff`

const STACK = [
  { name: 'React', icon: SI('react') },
  { name: 'Astro', icon: SI('astro') },
  { name: 'Python', icon: SI('python') },
  { name: 'C', icon: SI('c') },
  { name: 'C++', icon: SI('cplusplus') },
  { name: 'MATLAB', icon: IC('devicon-plain:matlab'), flat: true },
  { name: 'MongoDB', icon: SI('mongodb') },
  { name: 'Ethereum', icon: SI('ethereum') },
  { name: 'Remix IDE', icon: SI('remix') },
  { name: 'MetaMask', icon: IC('logos:metamask'), flat: true },
  { name: 'Flutter', icon: SI('flutter') },
  { name: 'Express', icon: SI('express') },
  { name: 'Node', icon: SI('nodedotjs') },
  { name: 'Proteus', icon: SI('proteus') },
  { name: 'Salesforce', icon: IC('simple-icons:salesforce') },
  { name: 'Photoshop', icon: IC('simple-icons:adobephotoshop') },
  { name: 'Illustrator', icon: IC('simple-icons:adobeillustrator') },
]

export default function About() {
  // Keyed by name, so both copies of a duplicated icon fall back together.
  const [failed, setFailed] = useState(() => new Set())

  useEffect(() => {
    const previous = document.title
    document.title = 'About — greenhueblues'
    return () => {
      document.title = previous
    }
  }, [])

  const markFailed = useCallback((name) => {
    setFailed((prev) => (prev.has(name) ? prev : new Set(prev).add(name)))
  }, [])

  // Doubled so the -50% keyframe loops seamlessly.
  const marquee = [...STACK, ...STACK]

  return (
    <div className="about-page">
      <SiteNav />

      <main id="main">

      <AboutHero />

      <section className="meet wrap" id="meet">
        <div className="section-row">
          <div className="section-label">Meet the man</div>
        </div>
        <div className="meet-cols">
          <div className="meet-portrait">
            <span>Portrait — 4:5</span>
          </div>
          <div className="meet-body">
            <p className="meet-lead">
              I&apos;m a tech enthusiast who loves to build — whether that means
              writing code, designing systems, or turning an idea into something
              real.
            </p>
            <p>
              Outside of tech, I&apos;m drawn to art, music, and most forms of
              creative expression. I also love meeting people and hearing their
              stories. I believe everyone has something unique about them, and
              there&apos;s always something to learn from another person.
            </p>
            <p>
              I believe in trying things, making mistakes, learning, and moving
              on. Don&apos;t be afraid to get it wrong — and don&apos;t waste time
              making excuses for it.
            </p>
            <div className="meet-credit">
              <div className="meet-credit-name">Sumip Chaudhary</div>
              <div className="meet-credit-role">Vision for greenhueblues</div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-story wrap" id="about-story">
        <div className="section-row">
          <div className="section-label">The name</div>
        </div>
        <div className="about-story-cols">
          <p className="about-story-head">Green keeps me grounded. Blue keeps me limitless.</p>
          <div className="about-story-body">
            <p>
              Green is nature — hiking trails, the animals I stop to watch, fields and trees I
              can&apos;t walk past without noticing. It&apos;s the part of me that stays grounded.
            </p>
            <p>
              Blue has two stories. One is the joke people make when they meet me — that I look
              like a fairly serious, maybe even a little sad, guy. The real one is the sea and
              the ocean, which is what actually moves me: that pull toward feeling limitless.
            </p>
            <p className="about-story-pull">
              Where green meets blue is where my thoughts actually resonate. That&apos;s
              greenhueblues.
            </p>
            <p>
              It&apos;s not a company. Not yet — that&apos;s a later-in-life plan. For now
              it&apos;s simply the name I put on the work.
            </p>
          </div>
        </div>
      </section>

      <section className="stack wrap" id="stack">
        <div className="section-row">
          <div className="section-label">Stack</div>
        </div>
        <div className="stack-mask">
          <div className="stack-track" aria-hidden="true">
            {marquee.map(({ name, icon, flat }, i) => {
              // The name is always rendered: it is the hover label normally,
              // and takes the icon's place in flow when the CDN has failed.
              const broken = failed.has(name)
              return (
                <span
                  className={broken ? 'stack-item is-fallback' : 'stack-item'}
                  key={`${name}-${i}`}
                >
                  {!broken && (
                    <img
                      className={flat ? 'stack-logo is-flat' : 'stack-logo'}
                      src={icon}
                      alt=""
                      loading="lazy"
                      draggable="false"
                      onError={() => markFailed(name)}
                    />
                  )}
                  <span className="stack-name">{name}</span>
                </span>
              )
            })}
          </div>
          {/* The marquee is decorative and duplicated; this is the real list. */}
          <ul className="visually-hidden">
            {STACK.map(({ name }) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      </section>

      <ExperienceTimeline />

      <section className="about-contact wrap" id="contact">
        <a className="about-contact-link" href={CONTACT_MAILTO}>
          {CONTACT_EMAIL}
        </a>
      </section>

      </main>
      <SiteFooter />
    </div>
  )
}

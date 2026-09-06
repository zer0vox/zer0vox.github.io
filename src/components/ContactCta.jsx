import { useEffect, useRef, useState } from 'react'
import { useRevealInView } from './reveal.js'
import { CONTACT_EMAIL, CONTACT_MAILTO } from '../lib/contact.js'

// The scintillation field. Positions are hand-placed rather than random so the
// composition is stable: they pool around the headline and thin out toward the
// edges, the way the hero's iridescence mask pools its sheen toward the frame.
//
// Fixed values also mean the field is identical on every render — a Math.random
// field would reshuffle itself on every re-render of the section.
//
// x/y are percentages, s is the dot size in px, d is the animation delay and
// `dur` its period. The spread of periods is deliberate: equal ones would beat
// in sync and read as a pulsing grid instead of a scatter.
const SCINTILLATIONS = [
  { x: 6, y: 18, s: 2, d: 0.0, dur: 4.2 },
  { x: 14, y: 62, s: 3, d: 1.7, dur: 5.6 },
  { x: 19, y: 31, s: 2, d: 3.1, dur: 4.8 },
  { x: 23, y: 78, s: 1, d: 0.9, dur: 3.7 },
  { x: 31, y: 12, s: 3, d: 2.4, dur: 6.1 },
  { x: 34, y: 47, s: 2, d: 4.3, dur: 4.4 },
  { x: 39, y: 88, s: 2, d: 1.2, dur: 5.2 },
  { x: 44, y: 24, s: 1, d: 3.6, dur: 3.9 },
  { x: 48, y: 66, s: 3, d: 0.4, dur: 5.9 },
  { x: 53, y: 39, s: 2, d: 2.8, dur: 4.6 },
  { x: 57, y: 84, s: 1, d: 4.9, dur: 4.1 },
  { x: 62, y: 16, s: 2, d: 1.5, dur: 5.4 },
  { x: 66, y: 55, s: 3, d: 3.3, dur: 6.3 },
  { x: 71, y: 29, s: 2, d: 0.7, dur: 4.0 },
  { x: 75, y: 72, s: 1, d: 2.1, dur: 5.1 },
  { x: 79, y: 43, s: 2, d: 4.6, dur: 4.7 },
  { x: 84, y: 21, s: 3, d: 1.9, dur: 5.8 },
  { x: 88, y: 61, s: 2, d: 3.8, dur: 4.3 },
  { x: 92, y: 35, s: 1, d: 0.2, dur: 3.8 },
  { x: 96, y: 74, s: 2, d: 2.6, dur: 5.5 }
]

// The chrome and the scintillations are continuous animations, so they are
// switched off whenever the section is not on screen. Without this the home
// page never has an idle frame once it has been scrolled past once.
function useLiveWhenVisible(ref) {
  const [live, setLive] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => setLive(entry.isIntersecting),
      // A margin so the metal is already flowing by the time it is looked at,
      // rather than starting from a standstill in view.
      { rootMargin: '200px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])

  return live
}

export default function ContactCta() {
  const sectionRef = useRef(null)
  const headingRef = useRef(null)
  const live = useLiveWhenVisible(sectionRef)

  useRevealInView(headingRef, {
    y: 28,
    duration: 0.85,
    delay: 0.15,
    ease: 'power3.out',
    amount: 0.55
  })

  return (
    <section
      className="cta wrap"
      id="contact"
      ref={sectionRef}
      data-live={live ? '' : undefined}
    >
      {/* Two decorative layers under the copy. Both aria-hidden: they carry no
          information, and a screen reader announcing twenty empty spans would
          be pure noise between the heading and the address. */}
      <div className="cta-chrome" aria-hidden="true">
        <span className="cta-chrome-flow" />
        <span className="cta-chrome-sheen" />
      </div>

      <div className="cta-scint" aria-hidden="true">
        {SCINTILLATIONS.map((p, i) => (
          <span
            key={i}
            className="cta-spark"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              '--s': `${p.s}px`,
              '--d': `${p.d}s`,
              '--dur': `${p.dur}s`
            }}
          />
        ))}
      </div>

      <div className="cta-inner">
        <p className="cta-eyebrow">Contact</p>
        <h2 className="cta-title" ref={headingRef}>
          Let&apos;s work together.
        </h2>
        <p className="cta-lede">
          A project, a question, or a half-formed idea that needs somewhere to go.
        </p>

        <a className="cta-mail" href={CONTACT_MAILTO}>
          <span className="cta-mail-face">
            <span className="cta-mail-text">{CONTACT_EMAIL}</span>
            <span className="cta-mail-arrow" aria-hidden="true">→</span>
          </span>
        </a>
      </div>
    </section>
  )
}

import { useEffect, useRef, useState } from 'react'
import { useRevealInView } from './reveal.js'
import { CONTACT_EMAIL, CONTACT_MAILTO } from '../lib/contact.js'
import { SocialIconLinks } from './social.jsx'

// The chrome is a set of continuous animations, so it is switched off whenever
// the banner is not on screen. Without this the home page never has an idle
// frame once it has been scrolled past once.
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
      className="cta"
      id="contact"
      ref={sectionRef}
      data-live={live ? '' : undefined}
    >
      {/* The three chrome layers. aria-hidden: they carry no information, and
          there is nothing here a screen reader could usefully announce between
          the heading and the address. */}
      <div className="cta-chrome" aria-hidden="true">
        <span className="cta-chrome-flow" />
        <span className="cta-chrome-sheen" />
        <span className="cta-chrome-ribbon" />
      </div>

      <div className="cta-inner">
        <div className="cta-copy">
          <p className="cta-eyebrow">Contact</p>
          <h2 className="cta-title" ref={headingRef}>
            Let&apos;s work together.
          </h2>
          <p className="cta-lede">
            A project, a question, or a half-formed idea that needs somewhere to go.
          </p>
        </div>

        <div className="cta-reach">
          <a className="cta-mail" href={CONTACT_MAILTO}>
            <span className="cta-mail-face">
              <span className="cta-mail-text">{CONTACT_EMAIL}</span>
              <span className="cta-mail-arrow" aria-hidden="true">→</span>
            </span>
          </a>

          {/* The profiles used to sit in the nav, where three of them competed
              with three routes in a bar that has to survive a 360px screen.
              They belong with the address: this is the block that answers "how
              do I reach you". */}
          <SocialIconLinks />
        </div>
      </div>
    </section>
  )
}

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './MeetSpread.css'

gsap.registerPlugin(ScrollTrigger)

// The about page's marine spread, as the work spread is on the home page: the
// lead in large paper type, printing in out of register as the reader scrolls
// in -- butter and red plates closing on the key -- with the quieter half of
// the bio on a rule beside it, and the creed and the signature across the foot
// of the sheet, the open marine between them being the point.
//
// Set on the same ten-column grid as the home contact sheet, stopping a gutter
// short of the band: the large voice across seven columns, the small one
// across three. Reduced motion gets the registered sheet with nothing moving.

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export default function MeetSpread() {
  const rootRef = useRef(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root || reducedMotion()) return undefined

    let cancelled = false
    let split = null
    const ctx = gsap.context(() => {}, root)

    // split-type is only needed here, below the fold, so it is fetched late,
    // as the home statement fetches it: the words are split long before the
    // reader can scroll to them.
    import('split-type').then(({ default: SplitType }) => {
      if (cancelled) return
      split = new SplitType(root.querySelector('.ms-lead'), { types: 'words', wordClass: 'ms-w', tagName: 'span' })
      root.classList.add('is-printing')

      ctx.add(() => {
        // Out of register -> in register, one word after another, over the
        // scroll that brings the sheet up to the masthead.
        gsap.fromTo(split.words ?? [], { '--mis': 1 }, {
          '--mis': 0,
          immediateRender: true,
          ease: 'power2.out',
          stagger: 0.1,
          duration: 0.4,
          scrollTrigger: {
            trigger: root,
            start: 'top 72%',
            end: 'top 4%',
            scrub: 0.5,
          },
        })

        // The quiet voice comes up off its own rule, once. Opacity only,
        // never visibility, so a screen reader has the text whether or not it
        // has been scrolled to.
        gsap
          .timeline({ scrollTrigger: { trigger: '.ms-aside', start: 'top 88%', once: true } })
          .fromTo('.ms-aside .ms-rule', { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: 'power4.inOut' })
          .fromTo('.ms-aside p', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 0.45)

        // The creed rises through its line masks; the signature's rule draws
        // and the name and the role come up on it, one after the other, in
        // opacity alone, as the aside does.
        gsap.fromTo('.ms-creed-ink', { yPercent: 110 }, {
          yPercent: 0,
          duration: 1.1,
          ease: 'expo.out',
          stagger: 0.08,
          scrollTrigger: { trigger: '.ms-creed', start: 'top 90%', once: true },
        })
        gsap
          .timeline({ scrollTrigger: { trigger: '.ms-sign', start: 'top 92%', once: true } })
          .fromTo('.ms-sign .ms-rule', { scaleX: 0 }, { scaleX: 1, duration: 1, ease: 'power4.inOut' })
          .fromTo('.ms-sign-name', { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 0.5)
          .fromTo('.ms-sign-role', { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 0.7)
      })

      document.fonts?.ready.then(() => !cancelled && ScrollTrigger.refresh())
    })

    return () => {
      cancelled = true
      ctx.revert()
      split?.revert()
      root.classList.remove('is-printing')
    }
  }, [])

  return (
    <section className="ms" id="meet" ref={rootRef} aria-labelledby="ms-lead">
      <div className="ms-sheet">
        <h2 className="ms-lead" id="ms-lead">
          I&apos;m a tech enthusiast who loves to build, whether that means writing code, designing
          systems, or turning an idea into something real
        </h2>

        <div className="ms-aside">
          <span className="ms-rule" aria-hidden="true" />
          <p>
            Outside of tech, I&apos;m drawn to art, music, and most forms of creative expression. I
            also love meeting people and hearing their stories. I believe everyone has something
            unique about them, and there&apos;s always something to learn from another person.
          </p>
        </div>

        {/* Each line is its own mask, so the creed can rise through them. The
            break is the sentence's own: what I believe, then the instruction. */}
        <p className="ms-creed">
          <span className="ms-creed-line">
            <span className="ms-creed-ink">
              I believe in trying things, making mistakes, learning, and moving on.
            </span>
          </span>{' '}
          <span className="ms-creed-line">
            <span className="ms-creed-ink">
              Don&apos;t be afraid to get it wrong, and don&apos;t waste time making excuses for it.
            </span>
          </span>
        </p>

        <div className="ms-sign">
          <span className="ms-rule" aria-hidden="true" />
          <p className="ms-sign-name">Sumip Chaudhary</p>
          <p className="ms-sign-role">Vision for greenhueblues</p>
        </div>
      </div>

      <span className="ms-band" aria-hidden="true" />
    </section>
  )
}

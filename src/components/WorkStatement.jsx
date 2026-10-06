import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { GLYPHS, scramble } from '../lib/textFx.js'
import './WorkStatement.css'

// The practice statement, set in the left column of the pinned work section so
// the "about" line and the work it describes are read as one spread.
//
// It prints the way the hero is printed: every word arrives out of register --
// a butter plate and a red plate offset over a faint key -- and locks into
// crisp ink as the reader scrolls into the section. The same scroll then goes
// on to turn the helix beside it, and once the second card has gone by the
// statement steps back a little, so the work leads. Scrubbed, so it reverses;
// reduced motion gets the registered state at full ink.

const COPY =
  'greenhueblues is the personal creative practice of Sumip Chaudhary, based in Kathmandu and working globally'

// Fraction of the section's scroll travel past which the statement recedes:
// halfway, where the helix has turned past its second card.
const RECEDE_AT = 0.5

export default function WorkStatement({ scrollRef }) {
  const rootRef = useRef(null)

  useEffect(() => {
    const root = rootRef.current
    const section = scrollRef?.current
    if (!root || !section) return undefined
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined

    gsap.registerPlugin(ScrollTrigger)
    root.classList.add('is-printing')

    let cancelled = false
    let split = null
    let reveal = null
    const ctx = gsap.context(() => {}, root)

    // A keyboard reader can tab into the column before the scroll has
    // revealed the link. Focus finishes the reveal at once, so nothing here is
    // ever focused while it is still invisible.
    const onFocusIn = () => reveal?.progress(1)
    root.addEventListener('focusin', onFocusIn)

    // A class, not a tween: the step back is a change of state that CSS eases,
    // so a reader scrubbing back and forth across the line never sees it
    // stutter between two scroll positions.
    ctx.add(() => {
      ScrollTrigger.create({
        trigger: section,
        start: () => `top+=${Math.round((section.offsetHeight - window.innerHeight) * RECEDE_AT)} top`,
        end: 'bottom top',
        invalidateOnRefresh: true,
        onToggle: (self) => root.classList.toggle('is-receded', self.isActive),
      })
    })

    // split-type is only needed here, below the fold, so it is fetched late.
    import('split-type').then(({ default: SplitType }) => {
      if (cancelled) return
      const copy = root.querySelector('.ws-copy')
      split = new SplitType(copy, { types: 'words', wordClass: 'w', tagName: 'span' })
      const words = split.words ?? []

      ctx.add(() => {
        gsap.from('.ws-rule', {
          scaleX: 0,
          transformOrigin: '0 50%',
          duration: 1.1,
          ease: 'power3.inOut',
          scrollTrigger: { trigger: section, start: 'top 55%', once: true },
        })

        // Out of register -> in register, one word after another, finishing
        // a little after the section pins so the first card turns on a
        // finished sentence.
        gsap.fromTo(words, { '--mis': 1 }, {
          '--mis': 0,
          immediateRender: true,
          duration: 0.3,
          ease: 'power2.out',
          stagger: 0.1,
          scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            end: () => `+=${Math.round(window.innerHeight * 1.15)}`,
            scrub: 0.5,
            invalidateOnRefresh: true,
          },
        })

        // Opacity, not autoAlpha: visibility: hidden would also take the link
        // out of the tab order and the accessibility tree until the reader had
        // scrolled this far.
        reveal = gsap.fromTo('.ws-more', { y: 12, opacity: 0 }, {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: { trigger: section, start: 'top 20%', once: true },
        })
        // Focus may already be inside by the time split-type has loaded.
        if (root.contains(document.activeElement)) reveal.progress(1)
      })

      // Fonts and the lazily-loaded carousel can move things after this runs;
      // re-measure once the type has settled.
      document.fonts?.ready.then(() => !cancelled && ScrollTrigger.refresh())
    })

    return () => {
      cancelled = true
      root.removeEventListener('focusin', onFocusIn)
      ctx.revert()
      split?.revert()
      root.classList.remove('is-printing', 'is-receded')
    }
  }, [scrollRef])

  // The link's words decode on hover and on keyboard focus. The listeners sit
  // on the link, so the arrow and the keyboard count too, but the effect runs
  // on a span holding only the words: scramble() rewrites text, and the arrow
  // has to survive it. (textFx honours reduced motion by setting the text.)
  useEffect(() => {
    const link = rootRef.current?.querySelector('.ws-more')
    const words = link?.querySelector('.ws-more-words')
    if (!link || !words) return undefined
    const text = words.textContent
    let cancel = null
    const run = () => {
      cancel?.()
      cancel = scramble(words, {
        text,
        duration: 0.42,
        spread: 0.5,
        fps: 30,
        chars: GLYPHS.ascii,
        lockWidth: true,
      })
    }
    link.addEventListener('pointerenter', run)
    link.addEventListener('focus', run)
    return () => {
      link.removeEventListener('pointerenter', run)
      link.removeEventListener('focus', run)
      cancel?.()
    }
  }, [])

  return (
    <div className="ws" id="about" ref={rootRef}>
      <span className="ws-rule" aria-hidden="true" />
      <p className="ws-copy">{COPY}</p>
      <Link to="/about" className="ws-more">
        <span className="ws-more-words">More About</span>{' '}
        <span className="ws-more-arrow">→</span>
      </Link>
    </div>
  )
}

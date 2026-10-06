import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { HomeLink } from './SiteChrome'
import { SocialTextLinks } from './social.jsx'
import { bindHoverScramble } from '../lib/textFx.js'
import himalayaNight from '../assets/himalaya-night.webp'
import './HomeFooter.css'

// The home page's last printed page: a colophon set in ink.
//
// It borrows the structure of a book's colophon -- a small ruled block on an
// otherwise empty page: a heavy rule, one hairline row per entry with a small
// label and its value, the copyright as the closing line, and the title run
// down a narrow spine at the block's edge. Under it the wordmark is printed
// across the full measure, its ink trimmed exactly to the page margins.
//
// The hero's red band runs down the whole page and stops at this sheet's top
// edge. Its end is marked the way a printer marks a trim: two hairline ticks
// carrying the band's edges a little way on, and a red square for its full
// stop. The colophon is locked to the same column: its spine is exactly the
// band's width, so the band's edges come back as the spine's rules.
//
// Motion is printing again: the rules go down before the type, the band's
// stop drops into register, and the wordmark's letters rise out of a baseline
// mask trailing loose butter and red plates that lock under the ink as each
// letter lands. Reduced motion gets the printed page as it is.

const WORD = 'greenhueblues'

// Ink side bearings of Neue Haas Unica Pro Bold, in em, measured off the
// rendered outlines at 1000px. The wordmark is sized by its INK, not its
// advance boxes: the g's bowl starts 0.035em inside its box and the full
// stop's ink ends 0.206em after its origin, so a word sized by its boxes sits
// visibly inside the margins at this scale -- 7px on the left alone at 1440.
const INK_LEFT_G = 0.035
const INK_RIGHT_STOP = 0.206

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Observers can deliver several records for one target in a single callback;
// only the newest describes where it is now.
const latest = (entries) => entries[entries.length - 1]

export default function HomeFooter() {
  const rootRef = useRef(null)

  // Fit the wordmark's ink to the measure. The stylesheet sizes the letters as
  // measure / --hf-k, where --hf-k is the ink's width in em, so resizing never
  // needs script; this only re-derives --hf-k from the letters as actually
  // set, which keeps the fit exact if the face ever falls back.
  useEffect(() => {
    const word = rootRef.current?.querySelector('.hf-word')
    const ink = word?.querySelector('.hf-word-ink')
    if (!ink) return undefined

    const fit = () => {
      const first = ink.querySelector('.hf-ch')
      const stop = ink.querySelector('.hf-stop')
      const size = parseFloat(getComputedStyle(ink).fontSize)
      if (!first || !stop || !size) return
      // Horizontal positions only, so the letters' rise does not disturb the
      // measurement; the ratio holds at any size, so one reading is enough.
      const span = stop.getBoundingClientRect().left - first.getBoundingClientRect().left
      word.style.setProperty('--hf-k', (span / size + INK_RIGHT_STOP - INK_LEFT_G).toFixed(4))
    }

    let cancelled = false
    fit()
    document.fonts?.ready.then(() => !cancelled && fit())
    // A weight requested after the first `ready` (font-display: swap) would
    // re-set the word without moving its container, so nothing else re-fits.
    document.fonts?.addEventListener?.('loadingdone', fit)

    return () => {
      cancelled = true
      document.fonts?.removeEventListener?.('loadingdone', fit)
      word.style.removeProperty('--hf-k')
    }
  }, [])

  // Reveals. Each part plays when it comes into view and is reset once the
  // whole footer is back below the fold, so arriving at the end of the page
  // prints it again. IntersectionObserver rather than ScrollTrigger: these are
  // timed, not scrubbed, and an observer cannot go stale when the sections
  // above change height after it was set up.
  useEffect(() => {
    const root = rootRef.current
    if (!root || reducedMotion()) return undefined

    // The rules' start state lives in the stylesheet under this class: they
    // are drawn by a staggered custom-property tween, and a row whose tween
    // has not begun reads the stylesheet, not the tween.
    root.classList.add('is-armed')

    const timelines = []
    const observers = []
    const playWhen = (target, tl, threshold) => {
      const io = new IntersectionObserver(
        (entries) => latest(entries).isIntersecting && tl.play(),
        { threshold }
      )
      io.observe(target)
      observers.push(io)
    }

    const ctx = gsap.context(() => {
      // The band's stop: the trim ticks come down from the sheet's edge, then
      // the square drops in a little off its axis and settles into register.
      // Offsets are relative; the stylesheet centres the square with margins,
      // so no transform of its own is there for these to fight.
      const term = gsap
        .timeline({ paused: true })
        .fromTo('.hf-term-tick', { scaleY: 0 }, { scaleY: 1, duration: 0.7, ease: 'power3.out', stagger: 0.06 })
        .fromTo(
          '.hf-term-stop',
          { xPercent: 45, yPercent: -140, autoAlpha: 0 },
          { xPercent: 0, yPercent: 0, autoAlpha: 1, duration: 0.8, ease: 'expo.out' },
          0.3
        )
      playWhen(root.querySelector('.hf-term'), term, 1)

      // The colophon: rules first, as the forme is locked up before it is
      // inked, then the rows, top to bottom, then the spine.
      const box = root.querySelector('.hf-colophon')
      const colophon = gsap
        .timeline({ paused: true })
        .fromTo(box, { '--hf-rule': 0 }, { '--hf-rule': 1, duration: 1.1, ease: 'power4.inOut' })
        .fromTo(
          '.hf-row',
          { '--hf-rule': 0 },
          { '--hf-rule': 1, duration: 0.9, ease: 'power3.inOut', stagger: 0.08 },
          0.2
        )
        // Opacity, not autoAlpha: visibility: hidden would take the links out
        // of the tab order and the text out of a screen reader's reading
        // until the reveal had played.
        .fromTo(
          '.hf-row > *, .hf-copy',
          { y: 14, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.05 },
          0.35
        )
        .fromTo(
          '.hf-spine > *',
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.8, ease: 'power2.out', stagger: 0.12 },
          0.6
        )
      playWhen(box, colophon, 0.35)

      // The wordmark. Each letter rises out of the line's mask on a long expo
      // curve. Its butter and red plates ride up with it but hang back below
      // and apart on a slower curve, catching up -- registering -- after the
      // letter has landed, and only then drop out under the ink. The full stop
      // lands last, on its own beat. Transforms and opacity only.
      const letters = gsap.utils.toArray('.hf-ch', root)
      const butter = gsap.utils.toArray('.hf-plate--butter', root)
      const red = gsap.utils.toArray('.hf-plate--red', root)
      const each = 0.045
      const mark = gsap
        .timeline({ paused: true })
        .fromTo(letters, { yPercent: 112 }, { yPercent: 0, duration: 1.15, ease: 'expo.out', stagger: each }, 0)
        // Offsets kept to a fringe: further out, the red plate reads as a
        // second, red word rising under the first -- a big red fill the page
        // never allows, however briefly.
        .fromTo(
          butter,
          { xPercent: 5, yPercent: 8 },
          { xPercent: 0, yPercent: 0, duration: 1.1, ease: 'power3.inOut', stagger: each },
          0.04
        )
        .fromTo(
          red,
          { xPercent: -4, yPercent: 14 },
          { xPercent: 0, yPercent: 0, duration: 1.2, ease: 'power3.inOut', stagger: each },
          0.08
        )
        // Held at strength while they are visibly out of register, then gone,
        // so a registered plate never leaves a coloured fringe round the
        // anti-aliased edge of the ink.
        .fromTo(
          [...butter, ...red],
          { autoAlpha: 0.9 },
          { autoAlpha: 0, duration: 1.25, ease: 'power4.in', stagger: each / 2 },
          0.04
        )
        .fromTo('.hf-stop', { yPercent: 112 }, { yPercent: 0, duration: 0.9, ease: 'expo.out' }, 0.95)
      playWhen(root.querySelector('.hf-word'), mark, 0.6)

      timelines.push(term, colophon, mark)
    }, root)

    // Back to the start once the footer is wholly below the viewport again --
    // never while any of it is on screen, so nothing visibly un-prints.
    const reset = new IntersectionObserver((entries) => {
      const entry = latest(entries)
      if (!entry.isIntersecting && entry.boundingClientRect.top > 0) {
        timelines.forEach((tl) => tl.pause(0))
      }
    })
    reset.observe(root)
    observers.push(reset)

    // Keyboard focus arriving in the footer finishes the printing at once:
    // a focused link has to be legible now, not when its row's turn comes.
    const finish = () => timelines.forEach((tl) => tl.progress(1))
    root.addEventListener('focusin', finish)

    return () => {
      root.removeEventListener('focusin', finish)
      observers.forEach((io) => io.disconnect())
      ctx.revert()
      root.classList.remove('is-armed')
    }
  }, [])

  // Links decode out of glyph noise on hover and on keyboard focus. Every
  // value link holds plain text only, which is what the scramble needs; the
  // social links keep their full names in aria-label throughout.
  useEffect(() => {
    const root = rootRef.current
    if (!root || reducedMotion()) return undefined

    const unbind = Array.from(root.querySelectorAll('.hf-value a'), (link) =>
      bindHoverScramble(link, { duration: 0.45 })
    )
    return () => unbind.forEach((fn) => fn())
  }, [])

  return (
    <footer className="hf" ref={rootRef}>
      {/* Where the band stops. Sits on the band's own x, from the same
          design-pixel unit the hero lays it out in. */}
      <span className="hf-term" aria-hidden="true">
        <span className="hf-term-tick" />
        <span className="hf-term-tick" />
        <span className="hf-term-stop" />
      </span>

      <div className="hf-inner">
        {/* The colophon's facing page: the painting on the left, the
            publishing details on the right, top edges level. */}
        <div className="hf-spread">
        <figure className="hf-art">
          <img
            src={himalayaNight}
            width="1120"
            height="794"
            loading="lazy"
            decoding="async"
            alt="Painting of a snow peak under a swirling starry sky and crescent moon, with a stupa and prayer flags in the foreground."
          />
        </figure>
        <div className="hf-colophon">
          <dl className="hf-rows">
            <div className="hf-row">
              <dt className="hf-label">
                <span className="hf-idx" aria-hidden="true">(01)</span>Sitemap
              </dt>
              <dd className="hf-value">
                <HomeLink>Home</HomeLink>
              </dd>
            </div>
            <div className="hf-row">
              <dt className="hf-label">
                <span className="hf-idx" aria-hidden="true">(02)</span>Practice
              </dt>
              <dd className="hf-value">
                <Link to="/philosophy">Philosophy</Link>
                <Link to="/about">About</Link>
                <Link to="/#contact">Contact</Link>
              </dd>
            </div>
            <div className="hf-row">
              <dt className="hf-label">
                <span className="hf-idx" aria-hidden="true">(03)</span>Social
              </dt>
              <dd className="hf-value">
                <SocialTextLinks />
              </dd>
            </div>
          </dl>

          <p className="hf-copy">Copyright 2026. All rights reserved.</p>

          {/* The spine: title at the head, year at the foot, set vertically.
              Decorative -- the wordmark below says the same thing aloud. */}
          <span className="hf-spine" aria-hidden="true">
            <span className="hf-spine-title">{WORD}</span>
            <span className="hf-spine-year">2026</span>
          </span>
        </div>
        </div>

        <p className="hf-word">
          <span className="hf-sr">{WORD}</span>
          {/* One box per letter so each can rise on its own, each carrying
              its two loose plates. Hidden from assistive tech, which reads the
              plain copy beside it instead of thirteen separate letters. */}
          <span className="hf-word-ink" aria-hidden="true">
            {Array.from(WORD, (ch, i) => (
              <span key={i} className="hf-ch">
                <span className="hf-plate hf-plate--butter">{ch}</span>
                <span className="hf-plate hf-plate--red">{ch}</span>
                {ch}
              </span>
            ))}
            <span className="hf-stop">.</span>
          </span>
        </p>
      </div>
    </footer>
  )
}

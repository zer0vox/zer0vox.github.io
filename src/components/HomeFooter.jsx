import { useEffect, useId, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { HomeLink } from './SiteChrome'
import { SocialTextLinks } from './social.jsx'
import { WORDMARK } from '../data/wordmark.js'
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
// stop drops into register, and the wordmark is drawn the way a fineline
// tattoo is: construction lines first, then each letter's outline traced in a
// single hairline, then packed solid with ink, the guides lifted away and the
// red full stop pressed in last. Reduced motion gets the printed page as it
// is.

const WORD = 'greenhueblues'

// The wordmark as outlines (src/data/wordmark.js), so each letter's contour
// can be traced before it is filled. The full stop is its own beat.
const LETTERS = WORDMARK.glyphs.filter((g) => g.ch !== '.')
const STOP = WORDMARK.glyphs.find((g) => g.ch === '.')
// The type's own lines, top to foot: ascender, x-height, baseline, descender.
const GUIDES = [0, WORDMARK.xHeight, WORDMARK.baseline, WORDMARK.height]
// The fill gates run a little past each letter's ink, so no anti-aliased
// edge is left unfilled.
const GATE_PAD = 12

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Observers can deliver several records for one target in a single callback;
// only the newest describes where it is now.
const latest = (entries) => entries[entries.length - 1]

export default function HomeFooter() {
  const rootRef = useRef(null)
  // An id the url() reference can carry as written.
  const gateId = `hf-gate-${useId().replace(/[^\w-]/g, '')}`

  // The hairlines are one device pixel at any size: the stroke is set in the
  // wordmark's own units, so it is re-derived whenever the measure changes.
  useEffect(() => {
    const svg = rootRef.current?.querySelector('.hf-word-ink')
    if (!svg) return undefined

    const ro = new ResizeObserver((entries) => {
      const width = latest(entries).contentRect.width
      if (width) svg.style.setProperty('--hf-px', (WORDMARK.width / width).toFixed(3))
    })
    ro.observe(svg)
    return () => ro.disconnect()
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

      // The wordmark, drawn. The type's four lines run out across the measure;
      // each letter's outline is traced over them in one hairline (pathLength
      // 1, so the dash runs 1 -> 0 whatever the contour's length -- outer
      // contour first, then the counters), and once its contour has closed
      // the ink packs it from the foot of its ink box up. Then the guides and
      // the tracing lift off together, leaving only the solid word, and the
      // red full stop is pressed in on its own beat.
      const guides = gsap.utils.toArray('.hf-guide', root)
      const traces = gsap.utils.toArray('.hf-trace path', root)
      const gates = gsap.utils.toArray('.hf-gate', root)
      const each = 0.06
      const trace = 1.3
      const pack = 0.75
      const traced = 0.2
      const packed = traced + trace * 0.85
      const settled = packed + (LETTERS.length - 1) * each + pack
      const mark = gsap
        .timeline({ paused: true })
        .set(['.hf-guides', '.hf-trace'], { autoAlpha: 1 }, 0)
        .fromTo(
          guides,
          { strokeDashoffset: 1 },
          { strokeDashoffset: 0, duration: 1.2, ease: 'power3.inOut', stagger: 0.1 },
          0
        )
        .fromTo(
          traces,
          { strokeDashoffset: 1 },
          { strokeDashoffset: 0, duration: trace, ease: 'power2.inOut', stagger: each },
          traced
        )
      gates.forEach((gate, i) => {
        const [, y, , h] = LETTERS[i].box
        mark.fromTo(
          gate,
          { attr: { y: y + h + GATE_PAD, height: 0 } },
          { attr: { y: y - GATE_PAD, height: h + 2 * GATE_PAD }, duration: pack, ease: 'power3.inOut' },
          packed + i * each
        )
      })
      mark
        .to(['.hf-guides', '.hf-trace'], { autoAlpha: 0, duration: 0.9, ease: 'power2.inOut' }, settled - 0.2)
        .fromTo(
          '.hf-stop',
          { scale: 0.4, autoAlpha: 0, transformOrigin: '50% 50%' },
          { scale: 1, autoAlpha: 1, duration: 0.7, ease: 'expo.out' },
          settled - 0.1
        )
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
          {/* Three layers of the same letters: the guides and the tracing
              (hairlines, shown only while it is being drawn) over the ink,
              which each letter's gate lets through. Hidden from assistive
              tech, which reads the plain copy beside it instead. */}
          <svg
            className="hf-word-ink"
            viewBox={`0 0 ${WORDMARK.width} ${WORDMARK.height}`}
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              <clipPath id={gateId}>
                {LETTERS.map(({ box: [x, y, w, h] }, i) => (
                  <rect
                    key={i}
                    className="hf-gate"
                    x={x - GATE_PAD}
                    y={y - GATE_PAD}
                    width={w + 2 * GATE_PAD}
                    height={h + 2 * GATE_PAD}
                  />
                ))}
              </clipPath>
            </defs>
            <g className="hf-guides">
              {GUIDES.map((y) => (
                <path key={y} className="hf-guide" d={`M0 ${y}H${WORDMARK.width}`} pathLength="1" />
              ))}
            </g>
            <g className="hf-fill" clipPath={`url(#${gateId})`}>
              {LETTERS.map(({ d }, i) => (
                <path key={i} d={d} />
              ))}
            </g>
            <g className="hf-trace">
              {LETTERS.map(({ d }, i) => (
                <path key={i} d={d} pathLength="1" />
              ))}
            </g>
            <path className="hf-stop" d={STOP.d} />
          </svg>
        </p>
      </div>
    </footer>
  )
}

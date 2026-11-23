import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { getLenis } from '../lib/lenis.js'
import portraitImg from '../assets/about/portrait.webp'
import cardArtImg from '../assets/about/card-art.webp'
import './PortraitSlab.css'

// The portrait, and the easter egg behind it: nine clicks and it comes back as
// a professionally graded 1/1 slab.
//
// The card is the format, not the franchise — an acrylic case, a grading label,
// holo foil, a population of one. Every mark on it is this site's own, which is
// the only way an in-joke like this can ship on a public page.

// High enough that nobody trips it while reading, low enough to be worth
// finishing once the frame starts answering back.
const CLICKS_TO_OPEN = 9

// A run, not a tally. Without the timeout the counter is still armed minutes
// later and the slab appears on some unrelated click, which reads as a bug
// rather than as a find.
const RUN_TIMEOUT_MS = 2500

// Where the frame starts giving something back. An egg that stays inert until
// it fires is an egg nobody finds, so the last two thirds of the run are
// visibly warmer than the first.
const NUDGE_FROM = 3

const reducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

export default function PortraitSlab() {
  const [open, setOpen] = useState(false)
  const [run, setRun] = useState(0)

  // The count is authoritative in a ref and mirrored into state only so the
  // frame can render the nudge. Reading state in the handler would drop clicks
  // from a fast run against a render that had not landed yet.
  const runRef = useRef(0)
  const timerRef = useRef(0)
  const slabRef = useRef(null)
  const closeRef = useRef(null)

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  const close = useCallback(() => setOpen(false), [])

  const onFrameClick = useCallback(() => {
    window.clearTimeout(timerRef.current)
    const next = runRef.current + 1

    if (next >= CLICKS_TO_OPEN) {
      runRef.current = 0
      setRun(0)
      setOpen(true)
      return
    }

    runRef.current = next
    setRun(next)
    timerRef.current = window.setTimeout(() => {
      runRef.current = 0
      setRun(0)
    }, RUN_TIMEOUT_MS)
  }, [])

  // Escape and a focus trap, on the same terms as the nav sheet: listeners
  // rather than state, so tabbing around the slab does not re-render it.
  useEffect(() => {
    if (!open) return undefined

    const slab = slabRef.current
    if (!slab) return undefined

    closeRef.current?.focus()

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
        return
      }

      if (event.key !== 'Tab') return

      const items = Array.from(
        slab.querySelectorAll('a[href], button:not([disabled])')
      ).filter((el) => el.offsetParent !== null)
      if (!items.length) return

      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement

      if (event.shiftKey && (active === first || !slab.contains(active))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, close])

  // Scroll lock. Lenis animates the scroll position itself, so overflow hidden
  // on the body is not enough on its own — it has to be told to stop.
  useEffect(() => {
    if (!open) return undefined

    const lenis = getLenis()
    lenis?.stop()

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      lenis?.start()
      document.body.style.overflow = previous
    }
  }, [open])

  // Tilt and holo travel, written straight to the element. A pointermove
  // handler that goes through setState is a re-render per pixel of travel, and
  // this one drives four custom properties.
  const onPointerMove = useCallback((event) => {
    const el = slabRef.current
    if (!el || reducedMotion()) return

    const rect = el.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width
    const py = (event.clientY - rect.top) / rect.height

    el.style.setProperty('--px', px.toFixed(4))
    el.style.setProperty('--py', py.toFixed(4))
    el.style.setProperty('--rx', ((0.5 - py) * 13).toFixed(2) + 'deg')
    el.style.setProperty('--ry', ((px - 0.5) * 15).toFixed(2) + 'deg')
  }, [])

  const onPointerLeave = useCallback(() => {
    const el = slabRef.current
    if (!el) return
    el.style.setProperty('--px', '0.5')
    el.style.setProperty('--py', '0.5')
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  }, [])

  return (
    <>
      {/* No role and no tabindex: this is a photograph that happens to react to
          a pointer, and announcing it as a control would put a promise in front
          of a screen reader that the egg does not keep. Once the slab is open it
          is a proper dialog — Escape, a focus trap, a real close button. */}
      <div
        className="meet-portrait"
        data-run={run >= NUDGE_FROM ? run : undefined}
        onClick={onFrameClick}
      >
        <img
          src={portraitImg}
          alt="Sumip Chaudhary"
          width="840"
          height="1260"
          loading="lazy"
          decoding="async"
        />
      </div>

      {open
        ? createPortal(
            // Portalled to the body so the fixed veil cannot be trapped by a
            // transformed or filtered ancestor further up the About page.
            <div className="slab-veil" onClick={close}>
              <div
                className="slab"
                ref={slabRef}
                role="dialog"
                aria-modal="true"
                aria-label="Graded collectible card, population one"
                onClick={(event) => event.stopPropagation()}
                onPointerMove={onPointerMove}
                onPointerLeave={onPointerLeave}
              >
                <div className="slab-case" aria-hidden="true" />

                <header className="slab-label">
                  <div className="slab-label-house">
                    <span className="slab-label-mark">ghb</span>
                    <span>greenhueblues authenticated</span>
                  </div>
                  <div className="slab-label-id">
                    <strong>Sumip Chaudhary</strong>
                    <span>Vision for greenhueblues · Kathmandu</span>
                  </div>
                  <div className="slab-grade">
                    <span className="slab-grade-word">Gem Mint</span>
                    <span className="slab-grade-num">10</span>
                  </div>
                </header>

                <div className="slab-window">
                  <article className="gcard">
                    <div className="gcard-holo" aria-hidden="true" />

                    <header className="gcard-head">
                      <h2 className="gcard-name">Sumip Chaudhary</h2>
                      <p className="gcard-hp">
                        <span>HP</span>180
                      </p>
                    </header>

                    <div className="gcard-art">
                      <img
                        src={cardArtImg}
                        alt="Sumip Chaudhary beside a Year of the Snake lantern"
                        width="720"
                        height="710"
                      />
                    </div>

                    <p className="gcard-kind">Builder — Creative Practice · 1/1</p>

                    <ul className="gcard-moves">
                      <li>
                        <span className="gcard-move-name">Ship It</span>
                        <span className="gcard-move-dmg">40</span>
                        <p>Turns an idea into something real. Works more often than it should.</p>
                      </li>
                      <li>
                        <span className="gcard-move-name">Be Wrong Cheaply</span>
                        <span className="gcard-move-dmg">90</span>
                        <p>Try, miss, learn, move on. Deals no damage to anyone making excuses.</p>
                      </li>
                    </ul>

                    <p className="gcard-rules">
                      Weakness — Meetings ×2 · Resistance — Deadlines −30
                    </p>

                    <footer className="gcard-foot">
                      <span>Illus. greenhueblues</span>
                      <span className="gcard-rarity">★ 1/1</span>
                    </footer>

                    <div className="gcard-glare" aria-hidden="true" />
                  </article>
                </div>

                <footer className="slab-cert">
                  <span>CERT 2026 0906 001</span>
                  <span>POP 1</span>
                </footer>

                <button className="slab-close" type="button" ref={closeRef} onClick={close}>
                  Close
                </button>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  )
}

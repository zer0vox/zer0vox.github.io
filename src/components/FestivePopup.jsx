import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { getLenis } from '../lib/lenis.js'
import illustration from '../assets/festive/dashain-tihar.webp'
import titleFont from '../assets/festive/ananda-fanko-2-title.woff'
import './FestivePopup.css'

// A Dashain and Tihar greeting shown once, the first time someone opens the
// site during the festival season (from the "Dashain Tihar Popup" design).
//
// * Once per browser, not per visit: a greeting repeated on every page load
//   stops being a greeting. Remembered in localStorage; if storage is blocked
//   it simply shows again next time, which is the harmless failure.
// * Seasonal: it stops appearing after Tihar, so nobody is wished a happy
//   festival in January.
// * The Nepali title is set in Ananda Fanko 2, a legacy font whose Latin code
//   points draw Devanagari ("ljhof bzdL /" prints as विजया दशमी र). In any other
//   font those code points read as gibberish, so the popup waits for the font
//   before it opens, and drops the Nepali lines if the font never arrives. The
//   heading's accessible name is the real Unicode Devanagari. The file is a
//   subset holding only the glyphs this title uses.
// * A modal dialog: focus moves in and is kept there, Escape and a click on
//   the scrim close it, focus returns to where it was, and the page (and
//   Lenis) stop scrolling underneath while it is open.

const STORAGE_KEY = 'ghb-festive-popup-2083-seen'
// The day after Bhai Tika, Tihar's last day (2083 BS), in Kathmandu time.
const SHOW_UNTIL = Date.parse('2026-11-12T00:00:00+05:45')
const OPEN_DELAY_MS = 600
const FONT_TIMEOUT_MS = 2500
const LEAVE_MS = 220

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

function alreadySeen() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function markSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // Storage blocked: it will show again next time, which is acceptable.
  }
}

// Loads the title face through the FontFace API and resolves to whether it is
// ready to draw. Never rejects; a timeout counts as not ready.
function loadTitleFont() {
  if (typeof FontFace === 'undefined' || !document.fonts) return Promise.resolve(false)
  const face = new FontFace('Ananda Fanko 2', `url(${titleFont}) format("woff")`, { display: 'block' })
  const loaded = face.load().then(
    (f) => {
      document.fonts.add(f)
      return true
    },
    () => false
  )
  const timeout = new Promise((resolve) => setTimeout(() => resolve(false), FONT_TIMEOUT_MS))
  return Promise.race([loaded, timeout])
}

export default function FestivePopup() {
  // 'closed' -> 'entering' -> 'open' -> 'leaving' -> 'closed'
  const [phase, setPhase] = useState('closed')
  const [nepali, setNepali] = useState(false)
  const dialogRef = useRef(null)
  const closeRef = useRef(null)
  const lastFocus = useRef(null)
  const leaveTimer = useRef(0)

  // Decide once, on first mount, whether to greet at all.
  useEffect(() => {
    if (alreadySeen() || Date.now() >= SHOW_UNTIL) return undefined
    let cancelled = false
    const started = performance.now()

    loadTitleFont().then((ready) => {
      if (cancelled) return
      setNepali(ready)
      const wait = Math.max(0, OPEN_DELAY_MS - (performance.now() - started))
      setTimeout(() => {
        if (cancelled) return
        lastFocus.current = document.activeElement
        setPhase('entering')
      }, wait)
    })

    return () => {
      cancelled = true
    }
  }, [])

  // Entering: one frame mounted in its start state, then transition in.
  useEffect(() => {
    if (phase !== 'entering') return undefined
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setPhase('open'))
    })
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [phase])

  // While mounted: hold the page still and move focus into the dialog.
  const mounted = phase !== 'closed'
  useEffect(() => {
    if (!mounted) return undefined
    const lenis = getLenis()
    const root = document.documentElement
    const prevOverflow = root.style.overflow
    lenis?.stop()
    root.style.overflow = 'hidden'
    dialogRef.current?.focus({ preventScroll: true })
    return () => {
      root.style.overflow = prevOverflow
      lenis?.start()
    }
  }, [mounted])

  useEffect(() => () => clearTimeout(leaveTimer.current), [])

  const close = useCallback(() => {
    if (phase === 'closed' || phase === 'leaving') return
    markSeen()
    setPhase('leaving')
    leaveTimer.current = setTimeout(
      () => {
        setPhase('closed')
        const el = lastFocus.current
        if (el && typeof el.focus === 'function' && el !== document.body) el.focus({ preventScroll: true })
      },
      reducedMotion() ? 0 : LEAVE_MS
    )
  }, [phase])

  // Escape closes; Tab stays inside (the close button is the only control).
  useEffect(() => {
    if (!mounted) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
      } else if (event.key === 'Tab') {
        event.preventDefault()
        closeRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mounted, close])

  if (!mounted) return null

  return createPortal(
    <div
      className="fp-scrim"
      data-state={phase === 'open' ? 'open' : 'closed'}
      onClick={close}
    >
      <div
        ref={dialogRef}
        className="fp-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fp-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="fp-plate">
          <img
            className="fp-art"
            src={illustration}
            width="1536"
            height="1024"
            alt="Watercolour illustration: a girl places tika on a boy's forehead beside a bowl of jamara, with kites over a pagoda skyline at dusk."
          />
          <div className="fp-copy">
            <h2 id="fp-title" className="fp-title" aria-label="विजया दशमी र तिहारको शुभकामना">
              {nepali ? (
                <>
                  <span aria-hidden="true">ljhof bzdL /</span>
                  <span aria-hidden="true">ltxf/sf] z&apos;esfdgf</span>
                </>
              ) : null}
            </h2>
            <p className="fp-en">
              Best wishes for Dashain and Tihar<span className="fp-stop">.</span>
            </p>
          </div>
          <button ref={closeRef} type="button" className="fp-close" aria-label="Close" onClick={close}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

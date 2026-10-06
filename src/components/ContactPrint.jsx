import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CONTACT_EMAIL, CONTACT_MAILTO } from '../lib/contact.js'
import { GLYPHS, bindHoverScramble, scramble } from '../lib/textFx.js'
import { SocialTextLinks } from './social.jsx'
import './ContactPrint.css'

gsap.registerPlugin(ScrollTrigger)

// The page's closing call to action, set as one printed sheet: the only butter
// field on the page, trimmed by crop marks, with the hero's red band still
// running through it. Everything that carries the message sits left of the
// band; the press furniture -- registration mark, running head, tint ramp --
// lives in the strip the band leaves at the fore-edge.
//
// It prints the way the rest of the page prints. The heading rises through its
// line masks with a marine and a red plate out of register over a faint key,
// and the plates lock into crisp ink as the reader scrolls in -- scrubbed, so
// it reverses, like the statement in the work spread. The rule, the lede, the
// address and the profiles then come off the press one after another, and the
// tint ramp develops with the same scroll.
//
// Reduced motion gets the registered sheet with nothing moving.

// The address in two halves, so on a phone it can break at the "@" instead of
// running under the band. Joined with no space, so the text is still exactly
// the address; the link carries it whole as its accessible name as well.
const AT = CONTACT_EMAIL.indexOf('@')
const MAIL_USER = CONTACT_EMAIL.slice(0, AT)
const MAIL_DOMAIN = CONTACT_EMAIL.slice(AT)

// Halftone screen. A 45-degree lattice, as a press would set a single colour,
// with the dot area following a ramp out of the bottom-right corner of the
// trim. Kept well under the point where neighbouring dots touch: this is a
// sparse tint at the edge of the sheet, not an image.
const SCREEN = 9 // px between dot centres along the screen angle
const MAX_COVER = 0.36 // fraction of each cell inked at the very corner
const RAMP_GAMMA = 1.6 // how quickly the tint falls away from the corner
const FRONT_SOFT = 0.35 // width of the developing front, in ramp units

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Draws the tint at development `p` (0 = blank paper, 1 = fully printed).
// Every dot is one arc in a single path and a single fill, so a redraw is a
// few hundred arcs -- cheap enough for scroll updates, and only scroll updates
// and resizes ever ask for one. There is no loop of its own to pause: off
// screen, nothing calls it.
function drawHalftone(canvas, p, color) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = canvas.width / dpr
  const h = canvas.height / dpr

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)
  if (p <= 0 || w < 2 || h < 2) return

  ctx.fillStyle = color
  ctx.beginPath()

  // A square lattice turned 45 degrees is a checkerboard of an axis-aligned
  // grid at SCREEN / sqrt(2) -- every other node of it, alternating by row.
  const step = SCREEN / Math.SQRT2
  const cols = Math.ceil(w / step) + 1
  const rows = Math.ceil(h / step) + 1
  const cell = SCREEN * SCREEN
  const front = p * (1 + FRONT_SOFT)
  const minR = 0.45 / dpr

  for (let j = 0; j < rows; j++) {
    const y = h - j * step
    const dy = (j * step) / h
    for (let i = j & 1; i < cols; i += 2) {
      // Ramp distance from the corner, 0 there and 1 along the far diagonal.
      // A straight diagonal rather than a radius, so the tint reads as a
      // printed ramp with a ruled edge, not as a glow.
      const d = (i * step) / w + dy
      if (d >= 1) break
      const develop = Math.min(1, Math.max(0, (front - d) / FRONT_SOFT))
      const cover = MAX_COVER * Math.pow(1 - d, RAMP_GAMMA) * develop
      const r = Math.sqrt((cover * cell) / Math.PI)
      if (r < minR) continue
      const x = w - i * step
      ctx.moveTo(x + r, y)
      ctx.arc(x, y, r, 0, Math.PI * 2)
    }
  }
  ctx.fill()
}

export default function ContactPrint() {
  const rootRef = useRef(null)

  // Layout effect, so the sheet's start state (plates apart, lines below their
  // masks) is in place before the first paint rather than one frame after it.
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return undefined

    const canvas = root.querySelector('.cp-halftone')
    const tint = { p: reducedMotion() ? 1 : 0, color: '#0f1b23' }
    const draw = () => drawHalftone(canvas, tint.p, tint.color)

    // The canvas is sized to its box at device resolution (capped at 2x) and
    // redrawn at whatever development the scroll has reached. The ink colour
    // is read here, once per resize, so a scroll frame never asks for style.
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const { width, height } = canvas.getBoundingClientRect()
      canvas.width = Math.max(1, Math.round(width * dpr))
      canvas.height = Math.max(1, Math.round(height * dpr))
      tint.color = getComputedStyle(canvas).color
      draw()
    }
    const resize = new ResizeObserver(fit)
    resize.observe(canvas)

    if (reducedMotion()) {
      return () => resize.disconnect()
    }

    root.classList.add('is-printing')

    let cancelled = false
    let eyebrowCancel = null
    const mailCancels = []
    const off = []
    const listen = (el, type, fn, opts) => {
      el.addEventListener(type, fn, opts)
      off.push(() => el.removeEventListener(type, fn, opts))
    }

    const mail = root.querySelector('.cp-mail')
    const mailWrap = root.querySelector('.cp-mail-wrap')
    const mailParts = [...root.querySelectorAll('.cp-mail-part')]
    const arrow = root.querySelector('.cp-mail-arrow')
    const eyebrow = root.querySelector('.cp-eyebrow-text')

    // Decode the address out of glyph noise, left to right, each half on its
    // own text-only span (the decode rewrites text, so it never touches the
    // arrow beside them). A new run replaces the last one on each half.
    // Each half is held at its printed width and clipped sideways while it
    // runs: lockWidth only sets a minimum, so a run of wide noise glyphs would
    // otherwise push the arrow along and back. Measured once, from the printed
    // text, and released when the decode lands.
    const decodeMail = (duration, delay = 0) => {
      mailParts.forEach((part, i) => {
        if (!part.style.width) {
          part.style.display = 'inline-block'
          part.style.width = `${part.getBoundingClientRect().width}px`
          part.style.overflowX = 'clip'
        }
        const release = () => {
          part.style.width = ''
          part.style.overflowX = ''
          part.style.display = ''
        }
        mailCancels[i] = scramble(part, {
          duration,
          delay: delay + i * duration * 0.35,
          chars: GLYPHS.ascii,
          order: 'ltr',
          spread: 0.4,
          fps: 30,
          onDone: release,
        })
      })
    }

    // The once-only reveals, so focus can finish them early (below).
    let reveals = []

    const ctx = gsap.context(() => {
      // Registration. One timeline for both lines, scrubbed to the scroll:
      // each line rises through its mask while its plates are still apart,
      // then the plates close onto the key and the key darkens to full ink.
      // The registration mark at the head of the spine closes with them.
      const lines = gsap.utils.toArray('.cp-ink')
      const print = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: '.cp-title',
          start: 'top 92%',
          end: 'top 30%',
          scrub: 0.6,
        },
      })
      lines.forEach((line, i) => {
        const at = i * 0.18
        print
          .fromTo(line, { yPercent: 118 }, { yPercent: 0, duration: 0.5, ease: 'power3.out' }, at)
          .fromTo(line, { '--mis': 1 }, { '--mis': 0, duration: 0.62, ease: 'power2.inOut' }, at + 0.2)
      })
      print.fromTo('.cp-reg', { '--mis': 1 }, { '--mis': 0, duration: 0.7, ease: 'power2.inOut' }, 0.2)

      // Trim marks are set before anything is printed inside them: the top
      // pair as the sheet arrives, the bottom pair just before its foot comes
      // up (a sheet exactly one screen tall never scrolls its foot any higher).
      const trim = (corners, start) => {
        const arm = (n) => corners.map((c) => `.cp-crop--${c} i:${n}-child`).join(',')
        gsap
          .timeline({ scrollTrigger: { trigger: root, start, once: true } })
          .fromTo(arm('first'), { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: 'expo.out', stagger: 0.06 }, 0)
          .fromTo(arm('last'), { scaleY: 0 }, { scaleY: 1, duration: 0.8, ease: 'expo.out', stagger: 0.06 }, 0.05)
      }
      trim(['tl', 'tr'], 'top 80%')
      trim(['bl', 'br'], 'bottom 104%')

      // The running head decodes once the spine is in view.
      ScrollTrigger.create({
        trigger: '.cp-spine',
        start: 'top 85%',
        once: true,
        onEnter: () => {
          eyebrowCancel = scramble(eyebrow, { duration: 0.7, chars: GLYPHS.upper, order: 'ltr', spread: 0.3 })
        },
      })

      // The rule draws, then the lede comes up off it. Opacity only, never
      // visibility: a hidden element would drop out of the accessibility tree
      // and the tab order until the reader happened to scroll to it.
      const lede = gsap
        .timeline({ scrollTrigger: { trigger: '.cp-lede-block', start: 'top 88%', once: true } })
        .fromTo('.cp-rule', { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: 'power4.inOut' })
        .fromTo('.cp-lede', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 0.45)

      // The address arrives decoding and its datum line draws under it; the
      // profiles follow down the column. clearProps hands everything back to
      // the stylesheet afterwards, where the hover states live.
      const reach = gsap
        .timeline({
          scrollTrigger: { trigger: mailWrap, start: 'top 92%', once: true },
          onStart: () => decodeMail(0.9, 0.05),
        })
        .fromTo(mailWrap, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', clearProps: 'opacity,transform' })
        .fromTo('.cp-mail-rule', { scaleX: 0 }, { scaleX: 1, duration: 1, ease: 'power4.inOut', clearProps: 'transform' }, 0.35)
        .fromTo(
          '.cp-social a',
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.07, clearProps: 'opacity,transform' },
          0.5
        )

      reveals = [lede, reach]

      // The tint develops over the scroll that brings the foot of the sheet
      // up to the bottom of the screen.
      gsap.fromTo(
        tint,
        { p: 0 },
        {
          p: 1,
          ease: 'none',
          onUpdate: draw,
          scrollTrigger: {
            trigger: canvas,
            start: 'top 95%',
            end: 'bottom bottom',
            scrub: 0.8,
          },
        }
      )
    }, root)

    // A keyboard user can tab in before the reveals have run; whatever takes
    // focus in here is finished at once rather than fading in under the ring.
    listen(root, 'focusin', () => reveals.forEach((tl) => tl.progress(1)))

    // Hover and focus: the address decodes again. Bound on the link rather
    // than on a text span, so the arrow is part of the hit area and keyboard
    // focus (which a span never receives) gets the same response.
    const redecode = () => decodeMail(0.5)
    listen(mail, 'pointerenter', redecode)
    listen(mail, 'focus', redecode)

    // The profiles decode their own names the same way.
    root.querySelectorAll('.cp-social a').forEach((a) => {
      off.push(bindHoverScramble(a, { chars: GLYPHS.upper, duration: 0.38 }))
    })

    // Magnetic pull, for a precise pointer only: the address leans a little
    // towards the cursor and the arrow leans further, so the two separate
    // slightly in depth. Measured off the untransformed wrapper, so the pull
    // never feeds back into its own reference point. The arrow's wrapper takes
    // the pull; the glyph inside keeps its own hover nudge in the stylesheet.
    if (window.matchMedia?.('(pointer: fine)').matches) {
      ctx.add(() => {
        const mailX = gsap.quickTo(mail, 'x', { duration: 0.7, ease: 'power3.out' })
        const mailY = gsap.quickTo(mail, 'y', { duration: 0.7, ease: 'power3.out' })
        const arrowX = gsap.quickTo(arrow, 'x', { duration: 0.7, ease: 'power3.out' })
        const arrowY = gsap.quickTo(arrow, 'y', { duration: 0.7, ease: 'power3.out' })
        const clamp = gsap.utils.clamp

        listen(mailWrap, 'pointermove', (e) => {
          const r = mailWrap.getBoundingClientRect()
          const dx = e.clientX - (r.left + r.width / 2)
          const dy = e.clientY - (r.top + r.height / 2)
          mailX(clamp(-14, 14, dx * 0.05))
          mailY(clamp(-10, 10, dy * 0.22))
          arrowX(clamp(-8, 8, dx * 0.03))
          arrowY(clamp(-8, 8, dy * 0.16))
        })
        listen(mailWrap, 'pointerleave', () => {
          mailX(0)
          mailY(0)
          arrowX(0)
          arrowY(0)
        })
      })
    }

    // Fonts move the heading's line boxes; re-measure once they have settled.
    document.fonts?.ready.then(() => !cancelled && ScrollTrigger.refresh())

    return () => {
      cancelled = true
      off.forEach((fn) => fn())
      eyebrowCancel?.()
      mailCancels.forEach((cancel) => cancel?.())
      ctx.revert()
      resize.disconnect()
      root.classList.remove('is-printing')
    }
  }, [])

  return (
    <section id="contact" className="cp" ref={rootRef} aria-labelledby="cp-title">
      {/* Trim marks at the four corners of the sheet. */}
      <span className="cp-crop cp-crop--tl" aria-hidden="true"><i /><i /></span>
      <span className="cp-crop cp-crop--tr" aria-hidden="true"><i /><i /></span>
      <span className="cp-crop cp-crop--bl" aria-hidden="true"><i /><i /></span>
      <span className="cp-crop cp-crop--br" aria-hidden="true"><i /><i /></span>

      {/* The spine: a registration mark over the running head, set vertically
          at the fore-edge, past the band. The index is set tate-chu-yoko --
          two figures upright inside the vertical line. */}
      <div className="cp-spine">
        <svg className="cp-reg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <g className="cp-reg-plate cp-reg-plate--marine">
            <circle cx="12" cy="12" r="6.5" />
            <path d="M12 0v24M0 12h24" />
          </g>
          <g className="cp-reg-plate cp-reg-plate--red">
            <circle cx="12" cy="12" r="6.5" />
            <path d="M12 0v24M0 12h24" />
          </g>
          <g className="cp-reg-key">
            <circle cx="12" cy="12" r="6.5" />
            <path d="M12 0v24M0 12h24" />
          </g>
        </svg>
        <p className="cp-eyebrow">
          <span className="cp-eyebrow-rule" aria-hidden="true" />
          <span className="cp-eyebrow-text">Contact</span>
        </p>
      </div>

      <div className="cp-sheet">
        <h2 className="cp-title" id="cp-title">
          <span className="cp-line">
            <span className="cp-ink">Let&apos;s work</span>
          </span>{' '}
          <span className="cp-line">
            <span className="cp-ink">
              together<span className="cp-dot">.</span>
            </span>
          </span>
        </h2>

        <div className="cp-lede-block">
          <span className="cp-rule" aria-hidden="true" />
          {/* The compound is held together so a narrow column never breaks
              the line at its hyphen. */}
          <p className="cp-lede">
            A project, a question, or a <span className="cp-nobr">half-formed</span> idea that needs somewhere to go.
          </p>
        </div>

        <div className="cp-mail-wrap">
          <a className="cp-mail" href={CONTACT_MAILTO} aria-label={CONTACT_EMAIL}>
            <span className="cp-mail-part">{MAIL_USER}</span>
            <span className="cp-mail-tail">
              <span className="cp-mail-part">{MAIL_DOMAIN}</span>
              <span className="cp-mail-arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <path d="M6 18 18 6M8.5 6H18v9.5" />
                </svg>
              </span>
            </span>
          </a>
          {/* The datum: one hairline under the whole column, level with the
              foot of the profile list beside it. */}
          <span className="cp-mail-rule" aria-hidden="true" />
        </div>

        <div className="cp-social">
          <SocialTextLinks />
        </div>
      </div>

      {/* The tint ramp, inside the trim at the foot of the fore-edge strip. */}
      <canvas className="cp-halftone" aria-hidden="true" />

      {/* The hero's red band, still running; it stops where the footer starts. */}
      <span className="cp-band" aria-hidden="true" />
    </section>
  )
}

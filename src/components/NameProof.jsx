import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { fitCanvas } from '../lib/halftone.js'
import './NameProof.css'

gsap.registerPlugin(ScrollTrigger)

// The name, set as the printer's proof of a two-colour job -- which is what
// greenhueblues is: two inks, green and blue, on one sheet.
//
// Each ink is a plate of its own, screened at its own angle (green at 75
// degrees, blue at 15: the angles a press gives magenta and cyan, which keeps
// two screens from beating into a coarse moire), and each prints one flat
// disc. As the sheet comes
// up the page the two plates slide together until each disc's centre lies on
// the other's rim: the vesica, the figure two equal circles make when they
// meet that way, ruled out in ink as a construction. Where they overlap the
// inks overprint, and the two screens knot into rosettes -- a third colour
// that is neither of them. The legend under the figure reads it in words:
// green, blue, and what the two make together.
//
// The screens are drawn on a 2D canvas, a dot to an arc and one fill per
// plate, and only when the scroll moves them; a plate that has finished
// developing is drawn from a bitmap of itself. Reduced motion gets the proof
// as printed.

// Screen angles, and the tint each disc is printed at.
const GREEN_ANGLE = (75 * Math.PI) / 180
const BLUE_ANGLE = (15 * Math.PI) / 180
const COVER = 0.5

// Separation of the centres, in radii: from apart, with air between the
// discs, to the vesica, where it is exactly one radius.
const APART = 2.24
const APART_NARROW = 2
const MET = 1

// Room kept in the figure's box over the discs, and under them for the
// overprint's label, in px.
const HEAD = 28
const FOOT = 52

// Width of the developing front, in units of a radius.
const SOFT = 0.5

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const clamp01 = (v) => Math.min(1, Math.max(0, v))

// One plate: a flat tint of dots at `angle`, on a lattice carried by the disc
// itself (the screen is on the plate, so it travels with it), developed from
// the centre out to `p` and clipped to the disc.
function tracePlate(ctx, cx, cy, R, pitch, angle, p) {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const full = Math.sqrt((COVER * pitch * pitch) / Math.PI)
  const n = Math.ceil(R / pitch) + 1
  const reach = p * (1 + SOFT)

  for (let j = -n; j <= n; j++) {
    for (let i = -n; i <= n; i++) {
      const u = i * pitch
      const v = j * pitch
      const d = Math.hypot(u, v) / R
      if (d > 1.04) continue
      const r = full * clamp01((reach - d) / SOFT)
      if (r < 0.25) continue
      const x = cx + u * cos - v * sin
      const y = cy + u * sin + v * cos
      ctx.moveTo(x + r, y)
      ctx.arc(x, y, r, 0, Math.PI * 2)
    }
  }
}

// A finished plate, printed once into a bitmap of its own: its disc of dots
// about a centre at (o, o), clipped to the rim. Kept on the box, so a resize
// (a new box) prints it afresh at the new size.
function platePrint(box, key, R, pitch, angle, color) {
  const cached = box.prints[key]
  if (cached && cached.R === R && cached.pitch === pitch && cached.color === color) return cached

  const o = R + 2
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = Math.ceil(2 * o * box.dpr)
  const c = canvas.getContext('2d')
  c.setTransform(box.dpr, 0, 0, box.dpr, 0, 0)
  c.beginPath()
  c.arc(o, o, R, 0, Math.PI * 2)
  c.clip()
  c.fillStyle = color
  c.beginPath()
  tracePlate(c, o, o, R, pitch, angle, 1)
  c.fill()

  const print = { canvas, o, size: canvas.width / box.dpr, R, pitch, color }
  box.prints[key] = print
  return print
}

// Draws the proof at `state` into the canvas `box` (fitCanvas), and places
// the labels. The geometry is recomputed from the box on every call, which is
// cheap next to the dots themselves.
function drawProof(box, labels, state, inks) {
  const { ctx, w, h } = box
  ctx.clearRect(0, 0, w, h)

  // The vesica is centred on the type column and has to fit it; the plates
  // apart have to fit the box, which on a phone runs on under the band to
  // the sheet's far margin (box.under); and the vesica's height needs room
  // for the labels over and under it. Whichever is tighter sets the radius.
  // A phone holds the plates closer to begin with, or the discs would be too
  // small to screen.
  const type = w - box.under
  const apart = w < 600 ? APART_NARROW : APART
  const R = Math.max(40, Math.min((h - HEAD - FOOT) / 2 - 2, (type - 4) / (2 + MET), (w - 4) / (2 + apart)))
  const pitch = Math.max(4.6, Math.min(7.5, R / 30))
  const s = R * (apart + (MET - apart) * state.meet)
  const mid = type / 2
  const cy = HEAD + (h - HEAD - FOOT) / 2
  const gx = mid - s / 2
  const bx = mid + s / 2
  // Half the chord through the points where the rims cross; 0 while apart.
  const half = s < 2 * R ? Math.sqrt(R * R - (s / 2) * (s / 2)) : 0

  // The plates, each clipped to its disc so the tint ends on a true circle.
  // While a plate develops its dots are traced as they grow; once it is
  // printed it only moves, so it is blitted from its own bitmap, snapped to
  // the device pixel grid so the dots stay crisp as it travels.
  const plate = (key, cx, angle, color, blend) => {
    if (state.p <= 0) return
    ctx.save()
    ctx.globalCompositeOperation = blend
    if (state.p >= 1) {
      const print = platePrint(box, key, R, pitch, angle, color)
      const snap = (v) => Math.round((v - print.o) * box.dpr) / box.dpr
      ctx.drawImage(print.canvas, snap(cx), snap(cy), print.size, print.size)
    } else {
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.clip()
      ctx.fillStyle = color
      ctx.beginPath()
      tracePlate(ctx, cx, cy, R, pitch, angle, state.p)
      ctx.fill()
    }
    ctx.restore()
  }
  plate('green', gx, GREEN_ANGLE, inks.green, 'source-over')
  // Overprinted: where the blue lands on green the two inks multiply.
  plate('blue', bx, BLUE_ANGLE, inks.blue, 'multiply')

  // The construction, ruled in ink over the print as it is drawn: the two
  // rims, the axis through the centres, a tick on each centre, and the chord
  // through the points where the rims cross.
  const q = state.rule
  if (q > 0) {
    ctx.save()
    ctx.strokeStyle = inks.ink
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(gx, cy, R, Math.PI, Math.PI + Math.PI * 2 * q)
    ctx.moveTo(bx + R, cy)
    ctx.arc(bx, cy, R, 0, Math.PI * 2 * q)
    ctx.stroke()

    // The axis, dashed, a little past both rims.
    const ax0 = gx - R - 18
    const ax1 = bx + R + 18
    ctx.setLineDash([3, 4])
    ctx.beginPath()
    ctx.moveTo(ax0, cy)
    ctx.lineTo(ax0 + (ax1 - ax0) * q, cy)
    ctx.stroke()

    // The chord exists only while the rims cross.
    if (half > 0) {
      ctx.beginPath()
      ctx.moveTo(mid, cy - half * q)
      ctx.lineTo(mid, cy + half * q)
      ctx.stroke()
    }
    ctx.setLineDash([])

    const t = 6 * q
    ctx.beginPath()
    for (const x of [gx, bx]) {
      ctx.moveTo(x - t, cy)
      ctx.lineTo(x + t, cy)
      ctx.moveTo(x, cy - t)
      ctx.lineTo(x, cy + t)
    }
    ctx.stroke()
    ctx.restore()
  }

  // The overprint's label hangs off the geometry: at the foot of the chord, on
  // a leader down past the discs, once the plates have met.
  labels.lens.style.transform = `translate(${mid}px, ${cy + half}px)`
  labels.lens.style.setProperty('--np-lead', `${R - half + 22}px`)
  labels.lens.style.opacity = String(clamp01((state.meet - 0.8) / 0.2))
}

export default function NameProof() {
  const rootRef = useRef(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return undefined

    const canvas = root.querySelector('.np-print')
    const labels = {
      lens: root.querySelector('.np-label--lens'),
    }
    const reduced = reducedMotion()
    const state = reduced ? { p: 1, meet: 1, rule: 1 } : { p: 0, meet: 0, rule: 0 }
    let box = null
    let inks = null

    const draw = () => box && drawProof(box, labels, state, inks)

    // Sized to its box at device resolution, and the inks read from the
    // stylesheet, once per resize, so a scroll frame never asks for style.
    // `under` is how far the box is let out past the type column (on a
    // phone, under the band), read off the figure's negative margin.
    const figure = root.querySelector('.np-figure')
    const fit = () => {
      box = fitCanvas(canvas)
      box.under = Math.max(0, -parseFloat(getComputedStyle(figure).marginRight) || 0)
      box.prints = {}
      const style = getComputedStyle(root)
      inks = {
        green: style.getPropertyValue('--green').trim(),
        blue: style.getPropertyValue('--marine').trim(),
        ink: style.getPropertyValue('--ink').trim(),
      }
      draw()
    }
    const resize = new ResizeObserver(fit)
    resize.observe(canvas)

    if (reduced) return () => resize.disconnect()

    const title = root.querySelector('.np-title')
    root.classList.add('is-printing')

    const ctx = gsap.context(() => {
      // The figure: the plates develop from their centres, the construction
      // is ruled, and the plates slide together to the vesica, over the
      // scroll that carries the figure up through the screen. Scrubbed, so
      // they part again on the way back.
      gsap
        .timeline({
          defaults: { ease: 'none' },
          onUpdate: draw,
          scrollTrigger: {
            trigger: '.np-figure',
            start: 'top 88%',
            end: 'bottom 62%',
            scrub: 0.6,
          },
        })
        .fromTo(state, { p: 0 }, { p: 1, duration: 0.55, ease: 'power1.out' }, 0)
        .fromTo(state, { rule: 0 }, { rule: 1, duration: 0.45, ease: 'power2.inOut' }, 0.12)
        .fromTo(state, { meet: 0 }, { meet: 1, duration: 0.6, ease: 'power3.inOut' }, 0.4)

      // The title: each line rises through its mask with its own ink as the
      // loose plate -- green under the first, blue under the second -- and
      // the plates close onto the key as the reader scrolls in.
      const lines = gsap.utils.toArray('.np-ink', title)
      const print = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: title, start: 'top 92%', end: 'top 40%', scrub: 0.6 },
      })
      lines.forEach((line, i) => {
        const at = i * 0.18
        print
          .fromTo(line, { yPercent: 118 }, { yPercent: 0, duration: 0.5, ease: 'power3.out' }, at)
          .fromTo(line, { '--mis': 1 }, { '--mis': 0, duration: 0.62, ease: 'power2.inOut' }, at + 0.2)
      })

      // The legend comes off the press column by column: its rule, then its
      // text. Each column on its own trigger, so where they stack (a phone)
      // each prints as it arrives; side by side they share a top, and the
      // delay staggers them. Opacity only, so a screen reader has it all along.
      gsap.utils.toArray('.np-key').forEach((key, i) => {
        gsap
          .timeline({ scrollTrigger: { trigger: key, start: 'top 88%', once: true }, delay: i * 0.12 })
          .fromTo(key.querySelector('.np-key-rule'), { scaleX: 0 }, { scaleX: 1, duration: 1, ease: 'power4.inOut' })
          .fromTo(key.querySelectorAll('.np-key-head, .np-key-body > *'), { opacity: 0, y: 12 }, {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'power3.out',
            stagger: 0.06,
          }, 0.35)
      })
    }, root)

    let cancelled = false
    document.fonts?.ready.then(() => !cancelled && ScrollTrigger.refresh())

    return () => {
      cancelled = true
      resize.disconnect()
      ctx.revert()
      root.classList.remove('is-printing')
    }
  }, [])

  return (
    <section className="np" id="the-name" ref={rootRef} aria-labelledby="np-title">
      <div className="np-sheet">
        <h2 className="np-title" id="np-title">
          <span className="np-line">
            <span className="np-ink np-ink--green">Green keeps me grounded.</span>
          </span>{' '}
          <span className="np-line">
            <span className="np-ink np-ink--blue">
              Blue keeps me limitless<span className="np-dot">.</span>
            </span>
          </span>
        </h2>

        {/* The figure is the name drawn; the legend below says it in words,
            so the drawing itself is not announced. */}
        <div className="np-figure" aria-hidden="true">
          <canvas className="np-print" />
          <span className="np-label np-label--lens">
            <span className="np-label-text">greenhueblues</span>
          </span>
        </div>

        <div className="np-legend">
          <div className="np-key np-key--green">
            <span className="np-key-rule" aria-hidden="true" />
            <p className="np-key-head">
              <i className="np-swatch" aria-hidden="true" />
              Green
            </p>
            <div className="np-key-body">
              <p>
                Green is nature: hiking trails, the animals I stop to watch, fields and trees I
                can&apos;t walk past without noticing. It&apos;s the part of me that stays grounded.
              </p>
            </div>
          </div>

          <div className="np-key np-key--blue">
            <span className="np-key-rule" aria-hidden="true" />
            <p className="np-key-head">
              <i className="np-swatch" aria-hidden="true" />
              Blue
            </p>
            <div className="np-key-body">
              <p>
                Blue has two stories. One is the joke people make when they meet me: that I look
                like a fairly serious, maybe even a little sad, guy. The real one is the sea and the
                ocean, which is what actually moves me: that pull toward feeling limitless.
              </p>
            </div>
          </div>

          <div className="np-key np-key--both">
            <span className="np-key-rule" aria-hidden="true" />
            <p className="np-key-head">
              <i className="np-swatch" aria-hidden="true" />
              Green + blue
            </p>
            <div className="np-key-body">
              <p className="np-pull">
                Where green meets blue is where my thoughts actually resonate. That&apos;s
                greenhueblues.
              </p>
              <p>
                It&apos;s not a company. Not yet. That&apos;s a later-in-life plan. For now it&apos;s
                simply the name I put on the work.
              </p>
            </div>
          </div>
        </div>
      </div>

      <span className="np-band" aria-hidden="true" />
    </section>
  )
}

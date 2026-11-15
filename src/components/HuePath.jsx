import { useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CustomEase } from 'gsap/CustomEase'
import { EXPERIENCE } from '../data/experience.js'
import Scribble from './Scribble.jsx'
import Sketch from './Sketch.jsx'
import './HuePath.css'

gsap.registerPlugin(ScrollTrigger, CustomEase)

// The hover modal's eases, the reference component's own cubic-beziers:
// in on (0.76, 0, 0.24, 1), out on (0.32, 0, 0.67, 0).
CustomEase.create('hueModalIn', 'M0,0 C0.76,0 0.24,1 1,1')
CustomEase.create('hueModalOut', 'M0,0 C0.32,0 0.67,0 1,1')

// The path: every step, oldest first, set in the deck's two inks -- the span
// in yellow, the role and the place in white -- with the wins folded into the
// step they were won in (in yellow, each behind a hand-drawn star), a sketch
// of the step at the end of its row, the current step ringed, and the open
// page last. The content is src/data/experience.js.
//
// Each row comes up as it reaches the reader: its rule drawn from the left,
// its type risen, its sketch written on stroke by stroke, then its marks --
// the stars and the ring. Reduced motion gets the list, drawn.
//
// With a mouse, the list works the way 21st.dev's "services with animated
// hover modal" does. A 1:1 modal scales up on the pointer while it is over
// the list and trails it (0.8s), and a round cursor carrying the step's year
// trails it closer (0.5s / 0.45s). Inside, one slide per step -- the step's
// square photo inset on yellow or off-white -- slides to the row under the
// pointer, and that row fades back with its type nudged along. A step with no
// photo shows its sketch in the blue. Touch screens never fetch the photos;
// reduced motion gets the modal without the trailing, scaling or sliding.

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// The open page that closes the path. Not a step yet, so not in the data.
const NEXT = {
  id: 'xp-next',
  year: 'Soon',
  period: 'Soon',
  role: 'The next one',
  org: 'Still sketching it.',
  sketch: 'pencil',
}

const STEPS = [...EXPERIENCE, NEXT]

// The hover photos: src/assets/about/path/<step id>.<ext> (README there).
// Where one name comes in two formats, the first in PREFER is used.
const PHOTO_FILES = import.meta.glob(
  '../assets/about/path/*.{webp,avif,jpg,jpeg,png,WEBP,AVIF,JPG,JPEG,PNG}',
  { eager: true, import: 'default' }
)
const PREFER = ['webp', 'avif', 'jpg', 'jpeg', 'png']
const PHOTOS = {}
Object.entries(PHOTO_FILES)
  .map(([path, url]) => {
    const [, name, ext] = path.match(/([^/]+)\.([^./]+)$/)
    return { name: name.toLowerCase(), rank: PREFER.indexOf(ext.toLowerCase()), url }
  })
  .sort((a, b) => a.rank - b.rank)
  .forEach(({ name, url }) => {
    if (!(name in PHOTOS)) PHOTOS[name] = url
  })

// The slides alternate the deck's two light inks, so the slide changing is
// seen as well as the photo.
const SLIDE_INKS = ['var(--hue-yellow)', 'var(--hue-paper)']

// The modal and its cursor, put on the body so no section painted after the
// path can cover them. One slide per step, in row order. Photos are left
// unloaded (data-src) until a pointer that can hover arrives.
function HoverModal({ modalRef, cursorRef, labelRef }) {
  return createPortal(
    <>
      <div className="hue-modal" ref={modalRef} aria-hidden="true">
        <div className="hue-modal-slider">
          {STEPS.map((step, index) => (
            <div className="hue-modal-slide" key={step.id} style={{ background: SLIDE_INKS[index % 2] }}>
              <div className="hue-modal-photo">
                {PHOTOS[step.id] ? (
                  <img data-src={PHOTOS[step.id]} alt="" decoding="async" />
                ) : (
                  <Sketch kind={step.sketch} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="hue-modal-cursor" ref={cursorRef} aria-hidden="true" />
      <div className="hue-modal-label" ref={labelRef} aria-hidden="true" />
    </>,
    document.body
  )
}

// What I build with, most-used first: the stack index the page used to carry,
// with the tools the experience data names.
const TOOLKIT = [
  'React',
  'TypeScript',
  'Python',
  'FastAPI',
  'Node',
  'Express',
  'MongoDB',
  'Docker',
  'AWS',
  'Git',
  'Flutter',
  'Astro',
  'C',
  'C++',
  'MATLAB',
  'Proteus',
  'Salesforce',
  'Ethereum',
  'Photoshop',
  'Illustrator',
]

function Step({ step, current }) {
  return (
    <li className="hue-year">
      <span className="hue-rule" aria-hidden="true" />
      <span className="hue-year-cell hue-year-when">
        {current ? (
          <span className="hue-now">
            {step.period}
            <Scribble kind="ring" className="hue-now-ring" />
          </span>
        ) : (
          step.period
        )}
      </span>
      <span className="hue-year-cell hue-year-role">{step.role}</span>
      <span className="hue-year-cell hue-year-org">
        {step.org}
        {step.place && <span className="hue-year-place">{step.place}</span>}
      </span>
      {step.wins?.length > 0 && (
        <ul className="hue-year-cell hue-year-wins">
          {step.wins.map((win) => (
            <li className="hue-year-win" key={win.title}>
              <Scribble kind="star" className="hue-win-star" />
              <span className="hue-win-title">{win.title}</span>
              <span className="hue-win-from">, {win.from}</span>
            </li>
          ))}
        </ul>
      )}
      <span className="hue-year-art" aria-hidden="true">
        <Sketch kind={step.sketch} />
      </span>
    </li>
  )
}

export default function HuePath() {
  const rootRef = useRef(null)
  const modalRef = useRef(null)
  const cursorRef = useRef(null)
  const labelRef = useRef(null)

  // The hover modal. Only for a pointer that can hover; matchMedia rebuilds
  // it (and reverts every tween and set) when that, or the motion
  // preference, changes.
  useEffect(() => {
    const root = rootRef.current
    const modal = modalRef.current
    const cursor = cursorRef.current
    const label = labelRef.current
    if (!root || !modal || !cursor || !label) return undefined

    const list = root.querySelector('.hue-years')
    const rows = Array.from(list.querySelectorAll('.hue-year'))
    const slider = modal.querySelector('.hue-modal-slider')
    const pieces = [modal, cursor, label]
    const mm = gsap.matchMedia()

    mm.add(
      { hover: '(hover: hover) and (pointer: fine)', still: '(prefers-reduced-motion: reduce)' },
      ({ conditions }) => {
        if (!conditions.hover) return undefined
        const still = conditions.still

        modal.querySelectorAll('img[data-src]').forEach((img) => {
          if (!img.getAttribute('src')) img.src = img.dataset.src
        })

        // Centred on the pointer, closed. Each piece trails it at its own
        // pace: the modal furthest behind, the label closest.
        gsap.set(pieces, { xPercent: -50, yPercent: -50, scale: 0 })
        const trail = [
          [modal, 0.8],
          [cursor, 0.5],
          [label, 0.45],
        ].map(([el, lag]) => [
          gsap.quickTo(el, 'x', { duration: still ? 0 : lag, ease: 'power3' }),
          gsap.quickTo(el, 'y', { duration: still ? 0 : lag, ease: 'power3' }),
        ])

        let active = false
        const setActive = (on) => {
          if (on === active) return
          active = on
          gsap.to(pieces, {
            scale: on ? 1 : 0,
            duration: still ? 0 : 0.4,
            ease: on ? 'hueModalIn' : 'hueModalOut',
            overwrite: 'auto',
          })
        }

        // A touch on a hover-capable screen is still a touch.
        const byMouse = (e) => e.pointerType === 'mouse' || e.pointerType === 'pen'

        // The pieces follow the pointer everywhere, open or not, so they
        // open where it is rather than sweeping in from where they were.
        const onMove = (e) => {
          if (!byMouse(e)) return
          trail.forEach(([toX, toY]) => {
            toX(e.clientX)
            toY(e.clientY)
          })
        }

        const enters = rows.map((row, index) => {
          const onEnter = (e) => {
            if (!byMouse(e)) return
            slider.style.transform = `translateY(${-index * 100}%)`
            label.textContent = STEPS[index].year
            setActive(true)
          }
          row.addEventListener('pointerenter', onEnter)
          return onEnter
        })
        const onLeave = () => setActive(false)

        window.addEventListener('pointermove', onMove, { passive: true })
        list.addEventListener('pointerleave', onLeave)

        return () => {
          window.removeEventListener('pointermove', onMove)
          list.removeEventListener('pointerleave', onLeave)
          rows.forEach((row, index) => row.removeEventListener('pointerenter', enters[index]))
        }
      }
    )

    return () => mm.revert()
  }, [])

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || reducedMotion()) return undefined

    const draw = { strokeDashoffset: 0, ease: 'power2.inOut' }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        root.querySelector('.hue-path-head'),
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: root, start: 'top 78%', once: true } }
      )

      root.querySelectorAll('.hue-year').forEach((row) => {
        const tl = gsap
          .timeline({
            defaults: { ease: 'power3.out' },
            scrollTrigger: { trigger: row, start: 'top 84%', once: true },
          })
          .fromTo(row.querySelector('.hue-rule'), { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: 'power2.inOut' }, 0)
          .fromTo(row.querySelectorAll('.hue-year-cell'), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.05 }, 0.15)
          .fromTo(row.querySelectorAll('.sketch path'), { strokeDashoffset: 1.01 }, { ...draw, duration: 0.5, stagger: 0.1 }, 0.3)

        const marks = row.querySelectorAll('.hue-win-star path, .hue-now-ring path')
        if (marks.length) tl.fromTo(marks, { strokeDashoffset: 1.01 }, { ...draw, duration: 0.7, stagger: 0.15 }, 0.9)
      })

      const tools = root.querySelector('.hue-tools')
      gsap.fromTo(
        tools,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: tools, start: 'top 90%', once: true } }
      )
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <section className="hue-path" ref={rootRef} aria-labelledby="hue-path-title">
      <div className="hue-path-head">
        <h2 id="hue-path-title">The path</h2>
        <span aria-hidden="true">{EXPERIENCE[0].year}–present</span>
      </div>

      <ol className="hue-years">
        {STEPS.map((step) => (
          <Step key={step.id} step={step} current={step === EXPERIENCE[EXPERIENCE.length - 1]} />
        ))}
      </ol>

      <HoverModal modalRef={modalRef} cursorRef={cursorRef} labelRef={labelRef} />

      <div className="hue-tools">
        <h3 className="hue-tools-label">Toolkit</h3>
        <ul className="hue-tools-list">
          {TOOLKIT.map((tool) => (
            <li key={tool}>{tool}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}

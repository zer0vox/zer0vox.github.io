import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import { scrollToOffset } from '../lib/lenis.js'
import { EXPERIENCE } from '../data/experience.js'
import './ExperienceTimeline.css'

// The Experience section: a scroll-scrubbed timeline on the about page, set
// as a pinned marine spread the way the work spread is on the home page. The
// copy lives in src/data/experience.js; the models and their halftone print
// live in ExperienceScene.jsx; this file is the part that reads the scroll,
// decides which chapter is current, and draws everything a person reads: the
// running head, the chapter's card, the year under the object, and the
// tategaki year rail, which is the one control on the stage.
//
// Two things are deliberate here:
//
// 1. The chapter index is measured every frame from the track's rect rather
//    than from scroll events. Lenis owns the scroll position on this site and
//    a rect never disagrees with it.
// 2. There is one source of truth for "which chapter", and it is a ref, not
//    state. React state would re-render the whole section 60 times a second;
//    the scene reads the ref inside its own frame loop, and state only changes
//    when the rounded chapter changes — a handful of times per scroll.

// Three.js is most of a megabyte, and this is one section near the bottom of
// one page — so the scene is a separate chunk that is only fetched once the
// section comes within a viewport of the reader.
const ExperienceScene = lazy(() => import('./ExperienceScene'))

// Frame-rate independent damping: `rate` is the fraction closed per 60fps frame.
const damp = (rate, dt) => 1 - Math.pow(1 - rate, dt * 60)

const pad2 = (n) => String(n).padStart(2, '0')
const clamp01 = (v) => Math.min(1, Math.max(0, v))

// The 3D telling needs WebGL, and it is a scroll-driven motion piece, so
// anyone who has asked for less motion gets the printed list instead. Both are
// decided once at mount — this is not worth re-deciding mid-scroll.
function canTellTheStory() {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  try {
    const probe = document.createElement('canvas')
    return Boolean(probe.getContext('webgl2') || probe.getContext('webgl'))
  } catch {
    return false
  }
}

export default function ExperienceTimeline({ entries = EXPERIENCE }) {
  const [story] = useState(canTellTheStory)

  if (!entries.length) return null
  return story ? <ExperienceStory entries={entries} /> : <ExperienceFlat entries={entries} />
}

// The sheet's heading, shared by both tellings. The pinned stage reads as
// what it is from its first card, so there it is kept for the outline only;
// the flat list sets it as its title.
function Heading({ shown = false }) {
  return (
    <h2 className={shown ? 'xp-title' : 'visually-hidden'} id="xp-title">
      Experience
      {shown && <span className="xp-title-dot" aria-hidden="true">.</span>}
    </h2>
  )
}

function ExperienceStory({ entries }) {
  const last = Math.max(1, entries.length - 1)

  const trackRef = useRef(null)
  const railRef = useRef(null)
  const easedRef = useRef(0)
  const liveRef = useRef(false)

  const [active, setActive] = useState(0)
  const [live, setLive] = useState(false)
  const [armed, setArmed] = useState(false)

  // Which chapters' objects have finished arriving. A Set rather than a count
  // because the four load in whatever order the network returns them, and what
  // the stage needs to know is whether THIS chapter is ready, not how many are.
  const [settled, setSettled] = useState(() => new Set())

  // Stable, so threading it down to each ChapterModel does not re-run the
  // effect that does the loading.
  const noteModelSettled = useCallback((index) => {
    setSettled((prev) => (prev.has(index) ? prev : new Set(prev).add(index)))
  }, [])

  // Only render while the section is anywhere near the viewport; the scene
  // parks its render loop on the same flag.
  useEffect(() => {
    const track = trackRef.current
    if (!track) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        liveRef.current = entry.isIntersecting
        setLive(entry.isIntersecting)
        // One-way: once the chunk is in, keep the scene mounted so scrolling
        // back up does not tear down and rebuild the WebGL context.
        if (entry.isIntersecting) setArmed(true)
      },
      { rootMargin: '25% 0px 25% 0px' }
    )
    observer.observe(track)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let rafId = 0
    let lastT = 0
    let ready = false
    let lastIndex = -1
    const shown = []

    const loop = (now) => {
      rafId = requestAnimationFrame(loop)
      const track = trackRef.current
      if (!track || !liveRef.current) {
        lastT = now
        return
      }

      const dt = Math.min(0.05, Math.max(0.001, (now - (lastT || now)) / 1000))
      lastT = now

      const rect = track.getBoundingClientRect()
      const total = Math.max(1, rect.height - window.innerHeight)
      const p = Math.min(1, Math.max(0, -rect.top / total))
      const target = p * last

      // A deep link can land mid-section; snap on the first frame rather than
      // sweeping through every chapter to get there.
      if (!ready) {
        easedRef.current = target
        ready = true
      } else {
        easedRef.current += (target - easedRef.current) * damp(0.14, dt)
      }

      const index = Math.max(0, Math.min(last, Math.round(easedRef.current)))
      if (index !== lastIndex) {
        lastIndex = index
        setActive(index)
      }

      // The rail's rules are a meter of the walk: each fills as the reader
      // comes up to its chapter, the first from the start. A custom property
      // rather than a transform, so the stylesheet can run the fill down a
      // side rule or along an underline as the rail turns. Written only when
      // a value moves.
      const fills = railRef.current?.querySelectorAll('.xp-rail-fill') ?? []
      fills.forEach((fill, i) => {
        const v = i === 0 ? 1 : Math.round(clamp01(easedRef.current - i + 1) * 1000) / 1000
        if (shown[i] === v) return
        shown[i] = v
        fill.style.setProperty('--fill', v)
      })
    }

    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [last])

  const goTo = useCallback(
    (index) => {
      const track = trackRef.current
      if (!track) return
      const top =
        window.scrollY +
        track.getBoundingClientRect().top +
        (index / last) * (track.offsetHeight - window.innerHeight)
      scrollToOffset(top)
    },
    [last]
  )

  // Attribution for whichever model is currently on the stage. Tied to the
  // visible chapter rather than listed once in a footer, because that is the
  // moment it is actually the credit for something on screen.
  const credit = entries[active]?.model?.credit ?? null

  // The stage is waiting if the chapter on it expects an object and that object
  // has not reported in. One condition covers both halves of the wait, which is
  // why the Suspense fallback below can stay null: before the scene's chunk has
  // even downloaded nothing has reported, so this is already true, and it stays
  // true until the active chapter's model is on the stage. Gated on `armed`
  // because until the section has been near the viewport, nothing is loading
  // and there is nothing to wait for.
  const stageWaiting =
    armed &&
    Boolean(entries[active]?.model?.src || entries[active]?.model?.builder) &&
    !settled.has(active)

  return (
    <section className="xp" id="experience" aria-labelledby="xp-title">
      {/* One viewport of run-up per chapter, plus one to land on the last. */}
      <div className="xp-track" ref={trackRef} style={{ height: `${(entries.length + 1) * 100}vh` }}>
        <div className="xp-stage">
          <div className="xp-gl-wrap" aria-hidden="true">
            {armed && (
              <Suspense fallback={null}>
                <ExperienceScene
                  entries={entries}
                  easedRef={easedRef}
                  live={live}
                  onModelSettled={noteModelSettled}
                />
              </Suspense>
            )}
          </div>

          {/* Outside .xp-gl-wrap on purpose: that wrapper is aria-hidden, being
              pure decoration, and a status message inside it would never be
              announced. Before .xp-ui in the DOM so the copy paints over it.

              The site's liquid-chrome loader is a glossy object, and this is
              a printed sheet; the wait here is the press's own: a
              registration mark whose plates slip out of register and back,
              where the object will print. The caption is only in the
              document while there is something to wait for, so the live
              region announces it once, as it starts. */}
          <p className="xp-wait" role="status" aria-live="polite" data-shown={stageWaiting ? '' : undefined}>
            <svg className="xp-wait-reg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <g className="xp-wait-plate xp-wait-plate--butter">
                <circle cx="12" cy="12" r="6.5" />
                <path d="M12 0v24M0 12h24" />
              </g>
              <g className="xp-wait-plate xp-wait-plate--red">
                <circle cx="12" cy="12" r="6.5" />
                <path d="M12 0v24M0 12h24" />
              </g>
              <g className="xp-wait-key">
                <circle cx="12" cy="12" r="6.5" />
                <path d="M12 0v24M0 12h24" />
              </g>
            </svg>
            <span className="xp-wait-text">{stageWaiting ? 'Loading model' : ''}</span>
          </p>

          <div className="xp-ui">
            <Heading />

            {/* The crossfading cards are the part that duplicates the outline
                below, so only they are hidden from assistive tech. */}
            <div className="xp-cards" aria-hidden="true">
              {entries.map((entry, i) => (
                <article className={i === active ? 'xp-card is-on' : 'xp-card'} key={entry.id}>
                  <p className="xp-card-period">{entry.period}</p>
                  <h3 className="xp-card-role">
                    {entry.role}
                    <span className="xp-dot">.</span>
                  </h3>
                  <p className="xp-card-org">
                    {entry.org} <span className="xp-card-sep">/</span> {entry.place}
                  </p>
                  <div className="xp-card-lede">
                    <span className="xp-card-rule" />
                    <p className="xp-card-lead">{entry.lead}</p>
                  </div>
                  <ul className="xp-card-notes">
                    {entry.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                  <p className="xp-card-tools">{entry.tools.join(' / ')}</p>
                </article>
              ))}
            </div>

            {/* Under the object: where the walk is, and the chapter's year in
                display type with the house stop. The year is simply reset when
                the chapter changes, as a compositor swaps a forme: the card
                above already crossfades, and the caption under it holds still. */}
            <div className="xp-caption" aria-hidden="true">
              <p className="xp-count">
                ({pad2(active + 1)}) <span className="xp-count-total">/ {pad2(entries.length)}</span>
              </p>
              <p className="xp-year">
                <span className="xp-year-text">{entries[active]?.year}</span>
                <span className="xp-dot">.</span>
              </p>
            </div>

            {/* Not aria-hidden: the year rail is a real control. Set tategaki,
                as the home page's work index is, one column per chapter. */}
            <ol className="xp-rail" ref={railRef} aria-label="Chapters">
              {entries.map((entry, i) => (
                <li className={i === active ? 'xp-rail-item is-on' : 'xp-rail-item'} key={entry.id}>
                  <button
                    type="button"
                    className="xp-rail-btn"
                    aria-label={`Go to ${entry.period}: ${entry.role}`}
                    aria-current={i === active ? 'true' : undefined}
                    onClick={() => goTo(i)}
                  >
                    <span className="xp-rail-num" aria-hidden="true">
                      (<span className="xp-rail-tcy">{pad2(i + 1)}</span>)
                    </span>
                    <span className="xp-rail-year" aria-hidden="true">
                      {entry.year}
                    </span>
                    <span className="xp-rail-rule" aria-hidden="true">
                      <span className="xp-rail-fill" />
                    </span>
                  </button>
                </li>
              ))}
            </ol>

            {credit && (
              <p className="xp-credit">
                <a href={credit.titleHref} target="_blank" rel="noreferrer noopener">
                  {credit.title}
                </a>{' '}
                by{' '}
                <a href={credit.authorHref} target="_blank" rel="noreferrer noopener">
                  {credit.author}
                </a>
                , licensed under{' '}
                <a href={credit.licenseHref} target="_blank" rel="noreferrer noopener">
                  {credit.license}
                </a>
                .
              </p>
            )}
          </div>
        </div>
      </div>

      {/* The stage above is a scrubbed animation showing one chapter at a time.
          This is the whole thing, in order, for screen readers and for anyone
          who lands here with JavaScript half-loaded. */}
      <ExperienceOutline entries={entries} className="visually-hidden" />

      {/* The red band, on the section rather than the pinned stage, so it runs
          unbroken down the whole walk. */}
      <span className="xp-band" aria-hidden="true" />
    </section>
  )
}

// The no-WebGL / reduced-motion telling: the same content, printed as a ruled
// list on the same marine sheet. Not a stub — it is the version most people
// will get on an old phone, so it is set as a real section.
function ExperienceFlat({ entries }) {
  return (
    <section className="xp is-flat" id="experience" aria-labelledby="xp-title">
      <div className="xp-flat-sheet">
        <Heading shown />
        <ol className="xp-flat">
          {entries.map((entry) => (
            <li className="xp-flat-row" key={entry.id}>
              <p className="xp-card-period">{entry.period}</p>
              <div className="xp-flat-body">
                <h3 className="xp-card-role">
                  {entry.role}
                  <span className="xp-dot" aria-hidden="true">.</span>
                </h3>
                <p className="xp-card-org">
                  {entry.org} <span className="xp-card-sep">/</span> {entry.place}
                </p>
                <p className="xp-card-lead">{entry.lead}</p>
                <ul className="xp-card-notes">
                  {entry.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
                <p className="xp-card-tools">{entry.tools.join(' / ')}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <span className="xp-band" aria-hidden="true" />
    </section>
  )
}

function ExperienceOutline({ entries, className }) {
  return (
    <ol className={className}>
      {entries.map((entry) => (
        <li key={entry.id}>
          <h3>
            {entry.role}, {entry.org} ({entry.period})
          </h3>
          <p>{entry.lead}</p>
          <ul>
            {entry.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
          <p>Tools: {entry.tools.join(', ')}</p>
        </li>
      ))}
    </ol>
  )
}

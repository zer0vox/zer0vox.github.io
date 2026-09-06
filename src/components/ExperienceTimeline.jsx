import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import { scrollToOffset } from '../lib/lenis.js'
import { EXPERIENCE } from '../data/experience.js'

// The Experience section: a scroll-scrubbed 3D timeline that sits between the
// Stack marquee and contact on the About page. The copy lives in
// src/data/experience.js; the helix lives in ExperienceScene.jsx; this file is
// the part that reads the scroll, decides which chapter is current, and draws
// everything a person actually reads.
//
// Two things are deliberate here:
//
// 1. The chapter index is measured every frame from the track's rect, the same
//    way the Philosophy dial does it, rather than from scroll events. Lenis
//    owns the scroll position on this site and a rect never disagrees with it.
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

// The 3D telling needs WebGL, and it is a scroll-driven motion piece, so
// anyone who has asked for less motion gets the plain list instead. Both are
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

function ExperienceStory({ entries }) {
  const last = Math.max(1, entries.length - 1)

  const trackRef = useRef(null)
  const easedRef = useRef(0)
  const liveRef = useRef(false)

  const [active, setActive] = useState(0)
  const [live, setLive] = useState(false)
  const [armed, setArmed] = useState(false)

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
    let settled = false
    let lastIndex = -1

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
      if (!settled) {
        easedRef.current = target
        settled = true
      } else {
        easedRef.current += (target - easedRef.current) * damp(0.14, dt)
      }

      const index = Math.max(0, Math.min(last, Math.round(easedRef.current)))
      if (index !== lastIndex) {
        lastIndex = index
        setActive(index)
      }
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

  return (
    <section className="xp" id="experience">
      {/* One viewport of run-up per chapter, plus one to land on the last. */}
      <div className="xp-track" ref={trackRef} style={{ height: `${(entries.length + 1) * 100}vh` }}>
        <div className="xp-stage">
          <div className="xp-gl-wrap" aria-hidden="true">
            {armed && (
              <Suspense fallback={null}>
                <ExperienceScene entries={entries} easedRef={easedRef} live={live} />
              </Suspense>
            )}
          </div>
          <div className="xp-veil" aria-hidden="true" />

          {/* Not aria-hidden: the year rail is a real control. The crossfading
              cards below are the part that duplicates the outline, so only they
              are hidden from assistive tech. */}
          <div className="xp-ui wrap">
            <header className="xp-head">
              <div className="section-label">Experience</div>
              <p className="xp-kicker">Oldest first. Scroll to walk it, or jump by year.</p>
            </header>

            <div className="xp-body">
              <ol className="xp-rail">
                {entries.map((entry, i) => (
                  <li className="xp-rail-row" key={entry.id}>
                    <button
                      type="button"
                      className={i === active ? 'xp-rail-btn is-on' : 'xp-rail-btn'}
                      aria-label={`Go to ${entry.period}: ${entry.role}`}
                      aria-current={i === active ? 'true' : undefined}
                      onClick={() => goTo(i)}
                    >
                      <span className="xp-rail-dot" />
                      <span className="xp-rail-year">{entry.year}</span>
                    </button>
                  </li>
                ))}
              </ol>

              <div className="xp-cards" aria-hidden="true">
                {entries.map((entry, i) => (
                  <article className={i === active ? 'xp-card is-on' : 'xp-card'} key={entry.id}>
                    <div className="xp-card-period">{entry.period}</div>
                    <h3 className="xp-card-role">{entry.role}</h3>
                    <div className="xp-card-org">
                      <span>{entry.org}</span>
                      <span className="xp-card-sep">/</span>
                      <span>{entry.place}</span>
                    </div>
                    <p className="xp-card-lead">{entry.lead}</p>
                    <ul className="xp-card-notes">
                      {entry.notes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                    <ul className="xp-card-tools">
                      {entry.tools.map((tool) => (
                        <li key={tool}>{tool}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>

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
    </section>
  )
}

// The no-WebGL / reduced-motion telling: same content, laid out as a plain
// timeline. Not a stub — it is the version most people will get on an old
// phone, so it is styled as a real section rather than a fallback.
function ExperienceFlat({ entries }) {
  return (
    <section className="xp is-flat wrap" id="experience">
      <div className="section-row">
        <div className="section-label">Experience</div>
      </div>
      <ol className="xp-flat">
        {entries.map((entry) => (
          <li className="xp-flat-row" key={entry.id}>
            <div className="xp-flat-year">{entry.period}</div>
            <div className="xp-flat-body">
              <h3 className="xp-card-role">{entry.role}</h3>
              <div className="xp-card-org">
                <span>{entry.org}</span>
                <span className="xp-card-sep">/</span>
                <span>{entry.place}</span>
              </div>
              <p className="xp-card-lead">{entry.lead}</p>
              <ul className="xp-card-notes">
                {entry.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
              <ul className="xp-card-tools">
                {entry.tools.map((tool) => (
                  <li key={tool}>{tool}</li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

function ExperienceOutline({ entries, className }) {
  return (
    <ol className={className}>
      {entries.map((entry) => (
        <li key={entry.id}>
          <h3>
            {entry.role} — {entry.org}, {entry.period}
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

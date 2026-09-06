import { useEffect, useState } from 'react'

// The site's loading state. The material is the same liquid chrome as the
// contact band (.cta-chrome in index.css) — near-black surface, a few
// screen-blended specular pools, the same contrast/saturate grade — poured into
// a small morphing blob instead of a wide band. Reusing the material rather
// than inventing a spinner is the point: a loader is the first thing a
// first-time visitor sees, and it should already be the site.
//
// Styles live in index.css under "Liquid chrome loader". The boot phase in
// index.html carries its own copy of them, for the part of the load that
// happens before any stylesheet exists.

// Long enough for the opacity transition in the stylesheet to finish (.5s)
// before the node leaves the tree, so the fade-out is never cut short.
const EXIT_MS = 560

/**
 * @param {boolean} show   false starts the fade-out; the node unmounts itself after.
 * @param {string}  label  what is being waited on. Shown under the wordmark and
 *                         announced — a loading screen that does not say what it
 *                         is loading is just a shape.
 * @param {boolean} inline waiting on one part of a page rather than the whole
 *                         of it: contained by its positioned parent instead of
 *                         covering the viewport, no opaque ground, and never
 *                         catching the pointer. The wordmark is dropped too —
 *                         it belongs to a boot screen, and repeating it inside
 *                         a section would put a second one on a page that
 *                         already has it in the nav.
 */
export default function LiquidLoader({ show = true, label = 'Loading', inline = false }) {
  const [mounted, setMounted] = useState(show)
  // Kept separate from `mounted` so the element is inserted at opacity 0 and
  // only then flipped — an element that mounts already in its final state has
  // nothing to transition from.
  const [shown, setShown] = useState(false)
  const [wasShowing, setWasShowing] = useState(show)

  // Adjusted during render rather than in an effect: both of these have to be
  // true of the very first frame the new `show` is painted in — the element
  // present but transparent on the way in, already dimming on the way out —
  // and an effect only gets to run after that frame has been committed.
  if (show !== wasShowing) {
    setWasShowing(show)
    if (show) setMounted(true)
    else setShown(false)
  }

  useEffect(() => {
    if (show) {
      // One frame later, so the browser has a transparent starting state to
      // interpolate away from.
      const frame = requestAnimationFrame(() => setShown(true))
      return () => cancelAnimationFrame(frame)
    }

    const timer = setTimeout(() => setMounted(false), EXIT_MS)
    return () => clearTimeout(timer)
  }, [show])

  if (!mounted) return null

  // One attribute drives everything: the stylesheet reads its absence as both
  // "not entered yet" and "leaving", which are the same state — invisible, no
  // enter delay, transparent to the pointer.
  return (
    <div
      className={inline ? 'ghb-loader ghb-loader--inline' : 'ghb-loader'}
      role="status"
      aria-live="polite"
      data-shown={shown ? '' : undefined}
    >
      <span className="ghb-blob-holder" aria-hidden="true">
        <span className="ghb-blob">
          {/* The filtered surface is its own box, fully opaque, so the grade
              never has a semi-transparent edge to work on — contrast() on one
              crushes the alpha and leaves a grey rim around the silhouette.
              The clipping to the blob shape happens on the unfiltered parent. */}
          <span className="ghb-blob-metal">
            <span className="ghb-blob-flow" />
            <span className="ghb-blob-ribbon" />
            <span className="ghb-blob-sheen" />
          </span>
        </span>
      </span>
      {/* aria-hidden: the wordmark is the same one in the nav and in the page
          title, and a screen reader has already been told where it is. The
          caption below is the part that carries information. */}
      {inline ? null : (
        <span className="ghb-loader-mark" aria-hidden="true">greenhueblues</span>
      )}
      <span className="ghb-loader-caption">{label}</span>
    </div>
  )
}

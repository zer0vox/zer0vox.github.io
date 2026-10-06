import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { bindHoverScramble } from '../lib/textFx.js'
import './HomeFx.css'

gsap.registerPlugin(ScrollTrigger)

// The home page's finishing layer: three small things that belong to the sheet
// as a whole rather than to any one section. The masthead links decode when
// pointed at, a red rule along the masthead measures how far down the page you
// are, and a paper grain lies over everything below the masthead. (The pointer
// itself is the macOS-style arrow and hand set site-wide in index.css; the
// registration-mark follower that used to live here was retired for it.) None
// of it is content, so all of it is aria-hidden, ignores the pointer and leaves
// with the page -- the elements are React's to remove, and every listener,
// observer, tween and class goes in the effects' cleanup.

const NAV = 'nav.top'
const NAV_LINKS = '.nav-links a, .nav-actions a'

// When the nav decode runs. gsap.matchMedia builds the effect when its query
// starts to match and reverts it when it stops, so a tablet that gains a
// trackpad, or a reader who turns on reduced motion mid-visit, gets the right
// page without a reload. Reduced motion gets the labels as they are.
const CAN_HOVER = '(any-hover: hover) and (prefers-reduced-motion: no-preference)'

// Masthead links decode out of glyph noise when pointed at or focused. The bar
// must not move while they do: lockWidth holds each link at its own width, and
// HomeFx.css stops the noise itself from taking up room, so a run of wide
// glyphs cannot push the next link along. The current-page square is the
// link's ::before, which a rewrite of its text never touches.
function useNavDecode() {
  useEffect(() => {
    const nav = document.querySelector(NAV)
    if (!nav) return undefined

    const mm = gsap.matchMedia()
    mm.add(CAN_HOVER, () => {
      const bound = new Map()

      // Bind the links that are there and let go of the ones that are not.
      const sync = () => {
        const links = new Set(nav.querySelectorAll(NAV_LINKS))
        bound.forEach((unbind, link) => {
          if (links.has(link)) return
          unbind()
          bound.delete(link)
        })
        links.forEach((link) => {
          if (!bound.has(link)) bound.set(link, bindHoverScramble(link, { duration: 0.45 }))
        })
      }

      // Run again only when a re-render of the bar swaps links in or out. The
      // decode's own churn -- spans and text replaced inside a link, two dozen
      // times a second -- adds no links, so it is let through untouched.
      const swapsLinks = (node) =>
        node.nodeType === Node.ELEMENT_NODE && (node.matches('a') || node.querySelector('a') !== null)

      const observer = new MutationObserver((records) => {
        if (records.some((r) => [...r.addedNodes, ...r.removedNodes].some(swapsLinks))) sync()
      })

      sync()
      observer.observe(nav, { childList: true, subtree: true })

      return () => {
        observer.disconnect()
        bound.forEach((unbind) => unbind())
        bound.clear()
      }
    })

    return () => mm.revert()
  }, [])
}

// A red rule along the masthead's bottom edge, drawn out with whole-page
// progress. It sits in the masthead's last two pixels, over the ink hairline,
// so the head of the sheet appears to fill in red as you read; the stylesheet
// shows it only while the paper strip is up (nav.top.is-glass). It is a plain
// readout of the scroll position, not an animation, so reduced motion keeps it.
function useScrollProgress(railRef, inkRef) {
  useEffect(() => {
    const rail = railRef.current
    const ink = inkRef.current
    if (!rail || !ink) return undefined
    const nav = document.querySelector(NAV)

    // The page's scroll length and the bar's height, measured when either can
    // have changed rather than on every frame. A section that grows after load
    // (fonts landing, a lazy part settling) lengthens the page without
    // resizing the window, which is why the body is watched and not just
    // `resize`.
    let max = 1
    const measure = () => {
      max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      if (nav) rail.style.setProperty('--hfx-mast', `${nav.offsetHeight}px`)
    }

    const draw = (scroll) => {
      ink.style.transform = `scaleX(${gsap.utils.clamp(0, 1, scroll / max)})`
    }

    const onResize = () => {
      measure()
      draw(window.scrollY)
    }

    // Measured before the trigger exists: it draws as soon as it is created,
    // and a page restored mid-scroll would otherwise be drawn against max = 1.
    measure()

    // A ScrollTrigger purely for its timing: App updates ScrollTrigger on every
    // Lenis step, so the rule moves in the same frame as the page instead of a
    // frame behind it on the next native scroll event.
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => draw(self.scroll()),
        onRefresh: (self) => draw(self.scroll()),
      })
    })

    const resizes = new ResizeObserver(onResize)
    resizes.observe(document.body)
    if (nav) resizes.observe(nav)
    window.addEventListener('resize', onResize)

    return () => {
      resizes.disconnect()
      window.removeEventListener('resize', onResize)
      ctx.revert()
      rail.style.removeProperty('--hfx-mast')
    }
  }, [railRef, inkRef])
}

export default function HomeFx() {
  const railRef = useRef(null)
  const inkRef = useRef(null)

  useNavDecode()
  useScrollProgress(railRef, inkRef)

  return (
    <div className="hfx" aria-hidden="true">
      <div className="hfx-grain" />

      <div className="hfx-progress" ref={railRef}>
        <span className="hfx-progress-ink" ref={inkRef} />
      </div>
    </div>
  )
}

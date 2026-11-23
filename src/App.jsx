import { Suspense, lazy, useEffect, useRef } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Lenis from 'lenis'
import { setLenis } from './lib/lenis.js'
import LiquidLoader from './components/LiquidLoader.jsx'
import Home from './pages/Home.jsx'

// Home stays a static import: it is the landing route and the one whose LCP
// matters, and making it lazy would put a second round trip in front of first
// paint for the most common entry to the site.
//
// The other two are split off. They are not small — between them they pull
// their own stylesheets, the About parallax hero and the whole Experience
// timeline — and none of it belongs in the bytes a first-time visitor to the
// home page has to download before anything appears.
const Philosophy = lazy(() => import('./pages/Philosophy.jsx'))
const About = lazy(() => import('./pages/About.jsx'))

// ...but a split route that is only fetched on click trades first-load bytes
// for a blank pause at the moment of navigation. Warming both chunks once the
// browser is idle gets the byte saving without the pause: by the time anyone
// reaches for the nav, the chunk is already in the module cache.
function usePrefetchRoutes() {
  useEffect(() => {
    let idle = 0
    const warm = () => {
      import('./pages/Philosophy.jsx')
      import('./pages/About.jsx')
    }

    if (typeof requestIdleCallback === 'function') {
      idle = requestIdleCallback(warm, { timeout: 3000 })
      return () => cancelIdleCallback(idle)
    }

    // Safari before 17.4 has no requestIdleCallback; a timeout past the point
    // where the landing page has settled is close enough.
    idle = setTimeout(warm, 2000)
    return () => clearTimeout(idle)
  }, [])
}

// What the loader says it is waiting for. A split route is fetched by name, so
// the name is known before a byte of it has arrived — and "Loading About" is
// the difference between a loading screen and a shape on a black page.
const ROUTE_NAMES = {
  '/philosophy': 'Loading Philosophy',
  '/about': 'Loading About'
}

export default function App() {
  const lenisRef = useRef(null)
  const { pathname, hash } = useLocation()

  usePrefetchRoutes()

  useEffect(() => {
    // A reader who has asked their OS for reduced motion should not be given
    // scroll they did not ask for: Lenis animates the scroll position itself,
    // which is exactly the kind of movement WCAG 2.3.3 is about. Native
    // scrolling is left in place for them, and the navigation effect below
    // falls back to an instant jump because there is no Lenis to hand it to.
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined

    const lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.2
    })
    lenisRef.current = lenis
    setLenis(lenis)

    let rafId = 0
    const raf = (time) => {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
      setLenis(null)
      lenisRef.current = null
    }
  }, [])

  // Lenis owns the scroll position, so navigation is resolved here rather than
  // by the browser: a plain route starts at the top, a `/#id` link glides to
  // that section once the target route has painted.
  useEffect(() => {
    const id = hash.slice(1)

    requestAnimationFrame(() => {
      const lenis = lenisRef.current
      const target = id && id !== 'top' ? document.getElementById(id) : null

      if (target) {
        if (lenis) lenis.scrollTo(target)
        else target.scrollIntoView()
      } else if (lenis) {
        lenis.scrollTo(0, { immediate: true })
      } else {
        window.scrollTo(0, 0)
      }
    })
  }, [pathname, hash])

  return (
    // A `null` fallback meant a split route that had not been warmed yet — a
    // cold visit straight to /about, or a click before the idle prefetch has
    // run — left the viewport empty for as long as the chunk took. The loader
    // carries its own entry delay, so on the common path (chunk already in the
    // module cache) it still resolves without ever painting.
    <Suspense fallback={<LiquidLoader label={ROUTE_NAMES[pathname] ?? 'Loading'} />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/philosophy" element={<Philosophy />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Suspense>
  )
}

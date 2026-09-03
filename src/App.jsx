import { useEffect, useRef } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Lenis from 'lenis'
import Home from './pages/Home.jsx'
import Philosophy from './pages/Philosophy.jsx'

export default function App() {
  const lenisRef = useRef(null)
  const { pathname, hash } = useLocation()

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.2
    })
    lenisRef.current = lenis

    let rafId = 0
    const raf = (time) => {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
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

      if (target) lenis?.scrollTo(target)
      else lenis?.scrollTo(0, { immediate: true })
    })
  }, [pathname, hash])

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/philosophy" element={<Philosophy />} />
    </Routes>
  )
}

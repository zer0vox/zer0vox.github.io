import Home from './pages/Home.jsx'
import Pzcel from './pages/Pzcel.jsx'
import { useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'

// Only `#pzcel` is a route; every other hash (#work, #about, …) is an
// in-page anchor on Home.
function getRoute() {
  return window.location.hash.replace(/^#\/?/, '') === 'pzcel' ? 'pzcel' : 'home'
}

export default function App() {
  const [route, setRoute] = useState(getRoute())
  const lenisRef = useRef(null)

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

  useEffect(() => {
    const onHash = () => {
      const next = getRoute()
      setRoute(next)
      if (next === 'pzcel') lenisRef.current?.scrollTo(0, { immediate: true })
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return route === 'pzcel' ? <Pzcel /> : <Home />
}

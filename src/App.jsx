import { useEffect } from 'react'
import Lenis from 'lenis'
import Home from './pages/Home.jsx'

// The site is a single page; every hash (#work, #about, #contact) is an
// in-page anchor that Lenis scrolls to.
export default function App() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.2
    })

    let rafId = 0
    const raf = (time) => {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [])

  return <Home />
}

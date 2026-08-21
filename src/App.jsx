import Home from './pages/Home.jsx'
import Pzcel from './pages/Pzcel.jsx'
import Mx from './pages/Mx.jsx'
import AudioProvider from './audio/AudioProvider.jsx'
import MiniPlayer from './components/MiniPlayer.jsx'
import { useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'

// `#pzcel` and `#mx` are routes; every other hash (#work, #about, …) is an
// in-page anchor on Home.
const ROUTES = ['pzcel', 'mx']

function getRoute() {
  const hash = window.location.hash.replace(/^#\/?/, '')
  return ROUTES.includes(hash) ? hash : 'home'
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
      if (next !== 'home') lenisRef.current?.scrollTo(0, { immediate: true })
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // The provider sits above the router so its <audio> element survives every
  // route change — leaving /mx pauses nothing.
  return (
    <AudioProvider>
      {route === 'pzcel' ? <Pzcel /> : route === 'mx' ? <Mx /> : <Home />}
      <MiniPlayer hidden={route === 'mx'} />
    </AudioProvider>
  )
}

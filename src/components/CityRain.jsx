import { useEffect, useRef } from 'react'

// The weather on the glass. Canvas rather than DOM because a few hundred
// particles at 60fps in absolutely-positioned divs is where layout thrash
// starts; here it is one composited layer.
//
// badal → rain streaks running down the pane, with the odd drop clinging to it.
// clear → slow dust drifting through the last of the sunset.
//
// `alive` (playing vs paused) scales speed and count, so the outside world
// settles down when the music stops.

const DROPS = 260
const MOTES = 90

export default function CityRain({ mode = 'badal', alive = true }) {
  const canvasRef = useRef(null)
  // Mirrored into a ref so the animation loop can read the latest values
  // without being torn down and rebuilt on every prop change.
  const stateRef = useRef({ mode, alive })
  useEffect(() => {
    stateRef.current = { mode, alive }
  }, [mode, alive])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = 0
    let height = 0
    let dpr = 1

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const rand = (min, max) => min + Math.random() * (max - min)

    const drops = Array.from({ length: DROPS }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      len: rand(8, 26),
      speed: rand(320, 760),
      // Far drops are dimmer and thinner — cheap depth.
      depth: rand(0.25, 1)
    }))

    const motes = Array.from({ length: MOTES }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: rand(0.4, 1.6),
      drift: rand(-6, 6),
      rise: rand(-14, -3),
      phase: Math.random() * Math.PI * 2
    }))

    let raf = 0
    let last = performance.now()

    const frame = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const { mode: m, alive: a } = stateRef.current
      const pace = reduced ? 0.15 : a ? 1 : 0.45

      ctx.clearRect(0, 0, width, height)

      if (m === 'badal') {
        // Wind leans the rain slightly, and breathes over ~11s.
        const lean = Math.sin(now / 11000) * 0.22 + 0.12
        ctx.lineCap = 'round'
        for (const d of drops) {
          d.y += d.speed * d.depth * pace * dt
          d.x += d.speed * d.depth * lean * pace * dt * 0.35
          if (d.y > height) {
            d.y = -d.len
            d.x = Math.random() * (width * 1.2) - width * 0.1
          }
          ctx.globalAlpha = 0.07 + d.depth * 0.16
          ctx.strokeStyle = '#cfe0f5'
          ctx.lineWidth = 0.5 + d.depth * 0.9
          ctx.beginPath()
          ctx.moveTo(d.x, d.y)
          ctx.lineTo(d.x - d.len * lean, d.y + d.len * d.depth)
          ctx.stroke()
        }
      } else {
        for (const p of motes) {
          p.phase += dt * 0.6
          p.x += (p.drift + Math.sin(p.phase) * 4) * pace * dt
          p.y += p.rise * pace * dt
          if (p.y < -4) {
            p.y = height + 4
            p.x = Math.random() * width
          }
          if (p.x < -4) p.x = width + 4
          if (p.x > width + 4) p.x = -4
          ctx.globalAlpha = 0.1 + (Math.sin(p.phase) + 1) * 0.09
          ctx.fillStyle = '#ffd9a0'
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      ctx.globalAlpha = 1
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [])

  return <canvas ref={canvasRef} className="mx-weather" aria-hidden="true" />
}

import { useEffect, useRef } from 'react'

// Drives a cursor-following iridescent glare over the hero.
//
// Design notes (why it's built this way, not with React state):
//  - Pointer moves fire far faster than React should re-render. We write the
//    position straight to CSS custom properties (--gx/--gy as 0..1, --gi as the
//    glare intensity 0..1) on the hero element and let a GPU-composited CSS layer
//    read them. Zero React re-renders per move → smooth.
//  - A single requestAnimationFrame loop LERPs the rendered position toward the
//    raw pointer, so the glare glides (a touch of inertia) instead of snapping —
//    the hallmark of a crafted sweep rather than a hard follow.
//  - Intensity ramps up while the pointer moves and DECAYS when it goes idle or
//    leaves ("sweep then fade out"), so the glare rakes across and settles back
//    to the resting sheen on its own.
export function useHeroGlare(ref) {
  const raf = useRef(0)
  const state = useRef({
    // rendered (smoothed) values
    x: 0.2, y: 0.15, i: 0,
    // targets
    tx: 0.2, ty: 0.15, ti: 0,
    // last raw pointer + last-move timestamp
    lastMove: 0,
    active: false,
    inside: false,
  })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Reduced motion: don't disable the flare (that hid it entirely for users
    // with the OS setting on). Instead run it calmly — a steady cursor-follow
    // glow without the punchy intensity ramp. `reduce` gates that below.
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    const s = state.current

    const onMove = (e) => {
      const rect = el.getBoundingClientRect()
      s.tx = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
      s.ty = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height))
      s.ti = 1
      s.active = true
      // Always use performance.now() — event.timeStamp can be on a different
      // time origin (0 or a huge value for synthetic events), which would make
      // the idle check fire instantly and kill the glare.
      s.lastMove = performance.now()
    }
    const onEnter = () => {
      s.inside = true
    }
    const onLeave = () => {
      s.active = false
      s.inside = false
      s.ti = 0 // only a full exit from the hero fully extinguishes the flare
    }

    el.addEventListener('pointerenter', onEnter, { passive: true })
    el.addEventListener('pointermove', onMove, { passive: true })
    el.addEventListener('pointerleave', onLeave, { passive: true })

    const lerp = (a, b, t) => a + (b - a) * t

    const RESTING = 0.42 // flare never fully vanishes while the cursor is inside

    const tick = () => {
      // While the cursor is inside the hero, hold at least a resting glow so the
      // flare stays visible even when still; a brisk move flares it to full.
      // Only leaving the hero extinguishes it (onLeave sets ti = 0).
      // Under reduced motion, hold a steady mid glow with no punchy flare-up.
      if (s.inside) {
        const moving = performance.now() - s.lastMove < 400
        s.ti = reduce ? 0.6 : moving ? 1 : RESTING
      }

      s.x = lerp(s.x, s.tx, 0.16)
      s.y = lerp(s.y, s.ty, 0.16)
      // Rise fast (a glint catching the surface); ease down toward the resting
      // glow, never snapping to black while the cursor is present.
      s.i = lerp(s.i, s.ti, s.ti > s.i ? 0.35 : 0.08)

      el.style.setProperty('--gx', s.x.toFixed(4))
      el.style.setProperty('--gy', s.y.toFixed(4))
      el.style.setProperty('--gi', s.i.toFixed(4))

      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf.current)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [ref])
}

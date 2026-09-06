import { useEffect } from 'react'

// Dev-only Tweakpane panel for the About hero.
//
// Every number in that hero (parallax depths, tint ceiling, cloud drift, when
// the standfirst retires) was originally picked by feel and never looked at on
// a real screen. This hands you the dials: drag, watch, and when it feels
// right, copy the values into AboutHero.jsx / About.css.
//
// `import.meta.env.DEV` is statically false in a production build, so Rollup
// drops this whole branch and Tweakpane never enters the bundle.
export function useHeroTuner(values, onChange) {
  useEffect(() => {
    if (!import.meta.env.DEV) return undefined
    if (new URLSearchParams(window.location.search).get('tune') === null) return undefined

    let pane
    let disposed = false

    // Loaded dynamically so it stays out of the graph unless ?tune is present.
    import('tweakpane').then(({ Pane }) => {
      if (disposed) return

      const state = { ...values }
      pane = new Pane({ title: 'hero — greenhueblues', expanded: true })

      const parallax = pane.addFolder({ title: 'parallax' })
      parallax.addBinding(state, 'photoY', { min: -240, max: 0, step: 1, label: 'photo y' })
      parallax.addBinding(state, 'layerY', { min: -240, max: 0, step: 1, label: 'ridge/sky y' })
      parallax.addBinding(state, 'cloudY', { min: -600, max: 0, step: 5, label: 'cirrus y' })
      parallax.addBinding(state, 'maskY', { min: -900, max: 400, step: 5, label: 'night sweep y' })

      const tone = pane.addFolder({ title: 'tone' })
      tone.addBinding(state, 'nightTint', { min: 0, max: 1, step: 0.01, label: 'night tint' })
      tone.addBinding(state, 'glowTo', { min: 0, max: 1.6, step: 0.01, label: 'glow peak' })
      tone.addBinding(state, 'cloudDim', { min: 0, max: 1, step: 0.01, label: 'cirrus dim' })

      const timing = pane.addFolder({ title: 'timing' })
      timing.addBinding(state, 'lerp', { min: 0.02, max: 0.4, step: 0.01, label: 'scroll lag' })
      timing.addBinding(state, 'appearAt', { min: 0, max: 0.6, step: 0.01, label: 'line in at' })
      timing.addBinding(state, 'appearFadeFrom', { min: 0.4, max: 1, step: 0.01, label: 'line out from' })

      pane.on('change', () => onChange({ ...state }))

      pane
        .addButton({ title: 'log values for pasting' })
        .on('click', () => console.log('[hero]', JSON.stringify(state, null, 2)))
    })

    return () => {
      disposed = true
      pane?.dispose()
    }
    // Mount-only: the panel owns its own state once open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

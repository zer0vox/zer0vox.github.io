// The philosophy plate: one picture, printed twice on the page -- finished on
// the hero, and made stage by stage in the press.
//
// It is the ridge photograph cut to a golden rectangle, 1 : 1.618, portrait
// (scripts/optimize-images.mjs makes the crop). The cut is placed so the
// rectangle's pole -- where its golden construction converges, 0.7236 of the
// way across and down -- falls on the small figure holding up a camera.
import plateSrc from '../assets/philosophy/print/plate.webp'

export { plateSrc }

export const POLE = 0.7236

// The tone curve the plate is screened with: the sky held to a tint just
// dark enough for the clouds to stand out of it as bare paper, the rock and
// grass keeping their structure, and the figure -- black in the photograph --
// printing as solid ink against the grass.
export const PLATE_TONE = { lo: 0.05, hi: 0.9, gamma: 1.35, max: 0.82 }

// Screen ruling: about ninety dots across the plate, never finer than 4.2px
// or coarser than 7px, so the dot stays a dot at every size.
export const platePitch = (w) => Math.max(4.2, Math.min(7, w / 92))

// The butter plate: a flat disc behind the summit, centred at (0.62, 0.465)
// of the plate, 0.19 of its width in radius.
export const SUN = { x: 0.62, y: 0.465, r: 0.19 }

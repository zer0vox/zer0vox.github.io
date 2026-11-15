import { SKETCHES, SKETCH_VIEWBOX } from '../lib/sketches.js'
import './Sketch.css'

// One of the achievement sketches (src/lib/sketches.js), in the marker and
// pen it was drawn with. Each stroke carries pathLength="1" so it can be
// written on by taking its dash offset from 1.01 to 0; drawn by default.
export default function Sketch({ kind }) {
  return (
    <svg className="sketch" viewBox={SKETCH_VIEWBOX} aria-hidden="true" focusable="false">
      {SKETCHES[kind].map(([type, d], i) => (
        <path key={i} className={type === 'm' ? 'sketch-m' : 'sketch-p'} d={d} pathLength="1" />
      ))}
    </svg>
  )
}

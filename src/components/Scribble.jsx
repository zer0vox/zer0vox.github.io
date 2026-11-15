import './Scribble.css'

// Marker marks, drawn the way the "ghb" monogram is drawn: one round-nibbed
// stroke, in the yellow. Each one marks something real -- a word circled, an
// address underlined, a pointer at it -- rather than decorating empty space.
//
// Every viewBox is the proportion of the box the mark is laid over (measured
// off the type, in em), so it can fill that box without its stroke being
// stretched. The stroke is in viewBox units and grows with the type.
//
// pathLength="1" lets a tween write the mark on by taking stroke-dashoffset
// from 1.01 to 0 (Scribble.css sets the dash). Each path is drawn in the order
// a hand would draw it: an arrow is its shaft, then its head.
const MARKS = {
  // Round a word, starting at the top right and running on past the start.
  loop: {
    viewBox: '0 0 383 100',
    stroke: 4.5,
    d: 'M330 10C250 2 110 2 40 12C6 18 2 70 34 88C110 104 300 100 360 84C392 74 388 24 340 12C300 4 250 6 214 12',
    tilt: 'rotate(-1.5 191 50)',
  },
  // The same loop for a short line of small type, drawn a touch heavier.
  ring: {
    viewBox: '0 0 395 100',
    stroke: 5.5,
    d: 'M340 18C260 6 110 6 46 20C8 30 6 74 50 88C140 102 310 98 368 80C396 70 392 30 348 18C316 10 270 10 236 14',
    tilt: 'rotate(1.2 197 50)',
  },
  // Under a long line: out, and a shorter stroke back.
  underline: {
    viewBox: '0 0 1080 20',
    stroke: 4.5,
    d: 'M6 12C300 6 700 4 1074 6C820 10 560 14 380 18',
  },
  // A star, drawn in one stroke without lifting, running on past its start:
  // the mark beside a win.
  star: {
    viewBox: '0 0 40 40',
    stroke: 3.4,
    d: 'M20 4L24.5 15.5L37 14.5L27.5 23L31.5 35.5L20.5 28L9 35L13.5 22.5L3 15L15.5 15L20.5 5.5',
  },
  // Out to the right, down, and back under to point at what is below.
  arrow: {
    viewBox: '0 0 100 80',
    stroke: 4.7,
    d: 'M8 10C60 0 92 24 70 62M82 55L70 62L70.5 48',
  },
}

export default function Scribble({ kind, className }) {
  const mark = MARKS[kind]

  return (
    <svg
      className={['scribble', className].filter(Boolean).join(' ')}
      viewBox={mark.viewBox}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d={mark.d} pathLength="1" strokeWidth={mark.stroke} transform={mark.tilt} />
    </svg>
  )
}

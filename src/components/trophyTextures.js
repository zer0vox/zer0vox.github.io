import * as THREE from 'three'

// The printed parts of the trophy — the engraved plaque on the pedestal and
// the emblem on the medallion — are drawn to a 2D canvas and mapped on, rather
// than modelled. That is what they are on the real object: flat artwork on a
// flat plate. It also means the type stays crisp at any camera distance and
// needs no font loading, no 3D text geometry and no extra dependency.
//
// Everything here is pure and side-effect free apart from allocating a canvas,
// so it can be called from a memo. Callers own disposal.

const GOLD_LIGHT = '#f6d97a'
const GOLD_MID = '#e0b447'
const GOLD_DEEP = '#c08d24'
const INK = '#160d01'
const RED = '#a8140f'

// A generic serif stack: the plate is set in a Times-ish face on the real
// award, and every platform has one of these without a webfont round-trip.
const SERIF = '"Times New Roman", Times, Georgia, serif'

function makeCanvas(width, height) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

function toTexture(canvas, anisotropy = 16) {
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = anisotropy
  texture.needsUpdate = true
  return texture
}

// The sheen across a gold plate: a diagonal gradient, so the plate does not
// read as flat paint under the environment reflection.
function paintGoldPlate(ctx, w, h) {
  const sheen = ctx.createLinearGradient(0, 0, w * 0.75, h)
  sheen.addColorStop(0, GOLD_LIGHT)
  sheen.addColorStop(0.28, GOLD_MID)
  sheen.addColorStop(0.52, '#f2d68e')
  sheen.addColorStop(1, GOLD_DEEP)
  ctx.fillStyle = sheen
  ctx.fillRect(0, 0, w, h)
}

function drawCentredLines(ctx, lines, x, y, lineHeight) {
  let cursor = y
  lines.forEach((line) => {
    if (line) ctx.fillText(line, x, cursor)
    cursor += lineHeight
  })
  return cursor
}

// The little diamond rule between the citation and the signature line.
function drawDivider(ctx, cx, cy, halfWidth) {
  ctx.strokeStyle = RED
  ctx.fillStyle = RED
  ctx.lineWidth = Math.max(2, halfWidth * 0.014)
  ctx.beginPath()
  ctx.moveTo(cx - halfWidth, cy)
  ctx.lineTo(cx - halfWidth * 0.2, cy)
  ctx.moveTo(cx + halfWidth * 0.2, cy)
  ctx.lineTo(cx + halfWidth, cy)
  ctx.stroke()

  const d = halfWidth * 0.09
  ctx.beginPath()
  ctx.moveTo(cx, cy - d)
  ctx.lineTo(cx + d * 1.5, cy)
  ctx.lineTo(cx, cy + d)
  ctx.lineTo(cx - d * 1.5, cy)
  ctx.closePath()
  ctx.fill()
}

export const DEFAULT_PLAQUE = {
  heading: ['AWARD OF', 'EXCELLENCE'],
  body: [
    'In Recognition of Outstanding',
    'Performance, Dedication',
    'and Technical Excellence',
    'Demonstrated Throughout the',
    'CloudMandap',
    'DAAI Fellowship Cohort-1',
    '',
    'Best Wishes for Your',
    'Future Endeavors!',
  ],
  signature: 'CloudMandap Pvt Ltd',
}

export function paintPlaque(plaque = DEFAULT_PLAQUE, anisotropy = 16) {
  // 0.94:1 — the plate on the real award is a touch taller than it is wide.
  // 1536 rather than 1024: the plate is read at a steep angle and small on
  // screen, which is where texture resolution actually shows.
  const W = 1536
  const H = 1644
  const canvas = makeCanvas(W, H)
  const ctx = canvas.getContext('2d')

  paintGoldPlate(ctx, W, H)

  // Double red rule, inset from the plate edge like the real plate.
  const pad = W * 0.045
  ctx.strokeStyle = RED
  ctx.lineWidth = W * 0.012
  ctx.strokeRect(pad, pad, W - pad * 2, H - pad * 2)
  ctx.lineWidth = W * 0.005
  const inner = pad + W * 0.02
  ctx.strokeRect(inner, inner, W - inner * 2, H - inner * 2)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Laid out top-down against fixed metrics rather than centred as a block:
  // the heading sits high, the citation fills the middle, and the signature is
  // pinned above the bottom rule, the way it is on the plate.
  ctx.fillStyle = RED
  ctx.font = `bold ${Math.round(W * 0.092)}px ${SERIF}`
  let y = drawCentredLines(ctx, plaque.heading, W / 2, H * 0.115, W * 0.1)

  ctx.fillStyle = INK
  ctx.font = `bold ${Math.round(W * 0.057)}px ${SERIF}`
  y = drawCentredLines(ctx, plaque.body, W / 2, y + W * 0.022, W * 0.06)

  drawDivider(ctx, W / 2, y + W * 0.02, W * 0.16)

  ctx.fillStyle = INK
  ctx.font = `bold ${Math.round(W * 0.06)}px ${SERIF}`
  ctx.fillText(plaque.signature, W / 2, y + W * 0.075)

  return toTexture(canvas, anisotropy)
}

// The pool of shade the base sits in. A real shadow map needs an opaque ground
// plane, which would show as a grey slab against a transparent canvas — so the
// contact shadow is a painted ellipse instead.
export function paintContactShadow(anisotropy = 16) {
  const S = 512
  const canvas = makeCanvas(S, S)
  const ctx = canvas.getContext('2d')
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2)
  g.addColorStop(0, 'rgba(0,0,0,.72)')
  g.addColorStop(0.42, 'rgba(0,0,0,.38)')
  g.addColorStop(0.72, 'rgba(0,0,0,.1)')
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, S, S)
  return toTexture(canvas, anisotropy)
}

// The medallion face. The real award carries two brand marks; those are
// artwork, not something worth approximating in code, so this sets the same
// thing in type instead: what the fellowship was, and where.
//
// Four fitted lines rather than a paragraph — a medallion is read at a glance
// and at a size where anything longer than a couple of words per line is a
// smudge. Caps on the first two because that is how a medal is struck; the
// company keeps its own casing.
export const DEFAULT_EMBLEM = {
  lead: 'DAAI',
  role: 'FELLOW',
  org: 'at CloudMandap',
}

export function paintEmblem(emblem = DEFAULT_EMBLEM, anisotropy = 16) {
  const S = 1024
  const canvas = makeCanvas(S, S)
  const ctx = canvas.getContext('2d')

  paintGoldPlate(ctx, S, S)

  // CircleGeometry maps this square across the disc's bounding box, so only the
  // inscribed circle is ever seen, and every line is sized against the diameter
  // rather than set at a fixed size. Each one is measured at a nominal 100px
  // and scaled to its target width, so a longer name shrinks itself instead of
  // running off the edge of the disc.
  const sizeFor = (weight, text, target) => {
    ctx.font = `${weight} 100px ${SERIF}`
    const measured = ctx.measureText(text).width || 1
    return (100 * target) / measured
  }

  const line = (weight, text, target, y) => {
    ctx.font = `${weight} ${Math.round(sizeFor(weight, text, target))}px ${SERIF}`
    ctx.fillText(text, S / 2, S / 2 + y)
  }

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = RED

  line('bold', emblem.lead, S * 0.42, -S * 0.19)
  line(600, emblem.role, S * 0.46, -S * 0.05)

  ctx.strokeStyle = RED
  ctx.lineWidth = S * 0.007
  ctx.beginPath()
  ctx.moveTo(S / 2 - S * 0.18, S / 2 + S * 0.045)
  ctx.lineTo(S / 2 + S * 0.18, S / 2 + S * 0.045)
  ctx.stroke()

  line(600, emblem.org, S * 0.58, S * 0.15)

  return toTexture(canvas, anisotropy)
}

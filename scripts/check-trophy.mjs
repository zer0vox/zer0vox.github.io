// Runs the trophy's geometry builders under Node and asserts the meshes are
// well formed. Pure three.js needs no WebGL to build a BufferGeometry, so the
// things that actually go wrong in swept geometry — NaN from a degenerate
// Frenet frame, out-of-range indices, a taper that inverts, a rounded box that
// does not come out the size it was asked for — are all catchable here rather
// than by squinting at a render.
//
//   node scripts/check-trophy.mjs

import * as THREE from 'three'
import {
  MEDALLION,
  PEDESTAL,
  PLAQUE,
  SCULPTURE,
  SCULPTURE_Y,
  ribbonGeometry,
  roundedBoxGeometry,
} from '../src/components/trophyGeometry.js'

let failures = 0

function check(label, condition, detail = '') {
  if (condition) {
    console.log(`  ok   ${label}`)
  } else {
    failures += 1
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ''}`)
  }
}

function finite(array) {
  for (let i = 0; i < array.length; i += 1) {
    if (!Number.isFinite(array[i])) return i
  }
  return -1
}

function inspect(name, geometry) {
  console.log(`\n${name}`)
  const position = geometry.getAttribute('position')
  const normal = geometry.getAttribute('normal')
  const index = geometry.getIndex()

  const badPosition = finite(position.array)
  check('positions are all finite', badPosition === -1, `first bad at ${badPosition}`)

  const badNormal = finite(normal.array)
  check('normals are all finite', badNormal === -1, `first bad at ${badNormal}`)

  // A zero-length normal means computeVertexNormals found only degenerate
  // triangles around that vertex — the classic pinched-tip failure.
  let zeroNormals = 0
  for (let i = 0; i < normal.count; i += 1) {
    const x = normal.getX(i)
    const y = normal.getY(i)
    const z = normal.getZ(i)
    if (Math.hypot(x, y, z) < 1e-6) zeroNormals += 1
  }
  check('no zero-length normals', zeroNormals === 0, `${zeroNormals} of ${normal.count}`)

  if (index) {
    let max = -1
    for (let i = 0; i < index.count; i += 1) max = Math.max(max, index.getX(i))
    check('indices in range', max < position.count, `max ${max}, vertices ${position.count}`)
    check('index count divisible by 3', index.count % 3 === 0, `${index.count}`)
  }

  geometry.computeBoundingBox()
  const box = geometry.boundingBox
  const size = box.getSize(new THREE.Vector3())
  console.log(
    `       bbox ${size.x.toFixed(3)} x ${size.y.toFixed(3)} x ${size.z.toFixed(3)}` +
      `  y ${box.min.y.toFixed(3)}..${box.max.y.toFixed(3)}  tris ${(index ? index.count : position.count) / 3}`
  )
  return { box, size, vertices: position.count }
}

console.log('Trophy geometry check')

const ribbons = {
  stem: ribbonGeometry(SCULPTURE.stem.spine, SCULPTURE.stem.profile, 120, 18),
  diagonal: ribbonGeometry(SCULPTURE.diagonal.spine, SCULPTURE.diagonal.profile, 200, 16),
  lobe: ribbonGeometry(SCULPTURE.lobe.spine, SCULPTURE.lobe.profile, 170, 16),
}

const measured = {}
for (const [name, geometry] of Object.entries(ribbons)) {
  measured[name] = inspect(`ribbon: ${name}`, geometry)
}

console.log('\nrounded boxes')
for (const [name, part] of Object.entries(PEDESTAL)) {
  const radius = name === 'block' ? 0.014 : 0.01
  const geometry = roundedBoxGeometry(part.w, part.h, part.d, radius)
  geometry.computeBoundingBox()
  const size = geometry.boundingBox.getSize(new THREE.Vector3())
  const off = Math.max(
    Math.abs(size.x - part.w),
    Math.abs(size.y - part.h),
    Math.abs(size.z - part.d)
  )
  check(
    `${name} is ${part.w} x ${part.h} x ${part.d}`,
    off < 1e-3,
    `got ${size.x.toFixed(3)} x ${size.y.toFixed(3)} x ${size.z.toFixed(3)}`
  )
  check(`${name} positions finite`, finite(geometry.getAttribute('position').array) === -1)
}

console.log('\ncomposition')

// The plaque has to fit on the face of the block it is mounted to.
check(
  'plaque fits the block face',
  PLAQUE.w < PEDESTAL.block.w && PLAQUE.h < PEDESTAL.block.h,
  `${PLAQUE.w}x${PLAQUE.h} vs ${PEDESTAL.block.w}x${PEDESTAL.block.h}`
)
const plaqueTop = PLAQUE.y + PLAQUE.h / 2
const blockTop = PEDESTAL.block.y + PEDESTAL.block.h / 2
check('plaque sits inside the block', plaqueTop < blockTop, `${plaqueTop.toFixed(3)} vs ${blockTop.toFixed(3)}`)

// The sculpture must start at the top of the pedestal cap, not float or sink.
const capTop = PEDESTAL.cap.y + PEDESTAL.cap.h / 2
check('sculpture starts at the cap top', Math.abs(capTop - SCULPTURE_Y) < 1e-6, `${capTop} vs ${SCULPTURE_Y}`)

// Every blade must be rooted at or below the foot and reach the height the
// photograph shows, and the medallion must clear the tallest blade's shoulder.
check('stem reaches the collar', measured.stem.box.max.y > 0.98, measured.stem.box.max.y.toFixed(3))
check('diagonal is the tallest blade', measured.diagonal.box.max.y > measured.lobe.box.max.y)
check(
  'medallion sits above the blades',
  MEDALLION.y > measured.diagonal.box.max.y - 0.12,
  `medallion ${MEDALLION.y}, blade top ${measured.diagonal.box.max.y.toFixed(3)}`
)

// The sculpture has to be one connected solid. A blade is attached if its base
// sits inside the foot ellipsoid, or if its tube overlaps the stem's tube
// anywhere along its run. Tuning a spine and leaving a blade hanging in space
// is the failure this guards against.
const FOOT = { x: 0, y: 0.035, z: 0, rx: 0.175, ry: 0.175 * 0.62, rz: 0.175 * 0.88 }

function insideFoot([x, y, z]) {
  return (
    ((x - FOOT.x) / FOOT.rx) ** 2 + ((y - FOOT.y) / FOOT.ry) ** 2 + ((z - FOOT.z) / FOOT.rz) ** 2 < 1
  )
}

function sample(spine, profile, n = 200) {
  const curve = new THREE.CatmullRomCurve3(
    spine.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    false,
    'centripetal',
    0.5
  )
  const out = []
  for (let i = 0; i <= n; i += 1) {
    const t = i / n
    out.push({ p: curve.getPointAt(t), r: profile(t)[0] })
  }
  return out
}

const stemSamples = sample(SCULPTURE.stem.spine, SCULPTURE.stem.profile)

for (const name of ['diagonal', 'lobe']) {
  const blade = SCULPTURE[name]
  const samples = sample(blade.spine, blade.profile)
  const rooted = insideFoot(blade.spine[0])

  let deepest = Infinity
  for (const a of samples) {
    for (const b of stemSamples) {
      deepest = Math.min(deepest, a.p.distanceTo(b.p) - (a.r + b.r))
    }
  }

  check(
    `${name} is joined to the sculpture`,
    rooted || deepest <= 0,
    `rooted in foot: ${rooted}, closest approach to stem: ${deepest.toFixed(3)}`
  )
  console.log(`       ${name}: rooted ${rooted}, stem overlap ${(-deepest).toFixed(3)}`)
}

check('stem is rooted in the foot', insideFoot(SCULPTURE.stem.spine[0]))

const total = SCULPTURE_Y + MEDALLION.y + MEDALLION.radius + MEDALLION.rim
const ratio = total / PEDESTAL.plinth.w
check('overall proportion is roughly 1 : 2.3 wide-to-tall', ratio > 2 && ratio < 2.6, ratio.toFixed(2))
console.log(`       total height ${total.toFixed(3)}, widest ${PEDESTAL.plinth.w}`)

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`)
process.exit(failures === 0 ? 0 : 1)

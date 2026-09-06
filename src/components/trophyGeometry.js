import * as THREE from 'three'

// The pure three.js half of the trophy: geometry builders, the measured
// proportions, and the studio environment. No React in here, which is what
// lets scripts/check-trophy.mjs run exactly this code under Node and assert
// the meshes are well formed before any of it reaches a GPU.
//
// Units: the pedestal block is 1.0 wide and everything is measured against it,
// with the base sitting on y = 0.

const TAU = Math.PI * 2

// ---------------------------------------------------------------- geometry --

// A ribbon: a lens-shaped cross-section swept along a spline, with the width
// and thickness driven by a profile function of t.
//
// Frenet frames give the sweep its orientation. Their known failure mode is a
// straight or collinear spine — the frame has no defined normal and the ribbon
// twists — so every spine below is given genuine curvature in all three axes.
// The tips close with a fan to a single centre vertex rather than letting the
// ring collapse, because a collapsed ring is a band of degenerate triangles and
// degenerate triangles produce NaN normals on a mirror material.
export function ribbonGeometry(spine, profile, segments = 180, radial = 16) {
  const curve = new THREE.CatmullRomCurve3(
    spine.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    false,
    'centripetal',
    0.5
  )
  const frames = curve.computeFrenetFrames(segments, false)

  const rings = segments + 1
  const positions = new Float32Array((rings * radial + 2) * 3)
  const point = new THREE.Vector3()
  const offset = new THREE.Vector3()

  let k = 0
  for (let i = 0; i < rings; i += 1) {
    const t = i / segments
    curve.getPointAt(t, point)
    const normal = frames.normals[i]
    const binormal = frames.binormals[i]
    const [halfWidth, halfThickness] = profile(t)

    for (let j = 0; j < radial; j += 1) {
      const a = (j / radial) * TAU
      offset
        .copy(normal)
        .multiplyScalar(Math.cos(a) * halfWidth)
        .addScaledVector(binormal, Math.sin(a) * halfThickness)
        .add(point)
      positions[k] = offset.x
      positions[k + 1] = offset.y
      positions[k + 2] = offset.z
      k += 3
    }
  }

  // The two tip centres, appended after every ring.
  curve.getPointAt(0, point)
  positions[k] = point.x
  positions[k + 1] = point.y
  positions[k + 2] = point.z
  curve.getPointAt(1, point)
  positions[k + 3] = point.x
  positions[k + 4] = point.y
  positions[k + 5] = point.z

  const headTip = rings * radial
  const tailTip = headTip + 1
  const lastRing = segments * radial
  const index = []

  for (let i = 0; i < segments; i += 1) {
    for (let j = 0; j < radial; j += 1) {
      const next = (j + 1) % radial
      const a = i * radial + j
      const b = i * radial + next
      const c = (i + 1) * radial + next
      const d = (i + 1) * radial + j
      index.push(a, b, d, b, c, d)
    }
  }
  // Winding: with (N, B, T) right-handed, quad (a, b, d) faces outward along
  // +N, the head fan faces -T and the tail fan +T. Get one of these backwards
  // and the blade renders inside-out under backface culling.
  for (let j = 0; j < radial; j += 1) {
    const next = (j + 1) % radial
    index.push(headTip, next, j)
    index.push(tailTip, lastRing + j, lastRing + next)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setIndex(index)
  // The ring wraps by index rather than duplicating a seam column, so the
  // averaged normals close smoothly the whole way round.
  geometry.computeVertexNormals()
  return geometry
}

// Widest in the middle, tapering to a near-point at both ends. `peak` slides
// the fat part along the blade; `tip` keeps the ends from reaching exactly zero.
export function taper(width, thickness, peak = 0.45, tip = 0.1) {
  return (t) => {
    const x = t < peak ? t / peak : (1 - t) / (1 - peak)
    const bulge = Math.pow(Math.sin(Math.max(0, x) * (Math.PI / 2)), 0.8)
    const scale = tip + (1 - tip) * bulge
    return [width * scale, thickness * scale]
  }
}

// A rounded box, sized so that extruding the shape with an equal bevel lands on
// the exact outer dimensions asked for: the shape is inset by r on each axis,
// and the bevel puts it back.
export function roundedBoxGeometry(w, h, d, r) {
  const iw = w - r * 2
  const ih = h - r * 2
  const shape = new THREE.Shape()
  const x = -iw / 2
  const y = -ih / 2
  shape.moveTo(x, y + r)
  shape.lineTo(x, y + ih - r)
  shape.quadraticCurveTo(x, y + ih, x + r, y + ih)
  shape.lineTo(x + iw - r, y + ih)
  shape.quadraticCurveTo(x + iw, y + ih, x + iw, y + ih - r)
  shape.lineTo(x + iw, y + r)
  shape.quadraticCurveTo(x + iw, y, x + iw - r, y)
  shape.lineTo(x + r, y)
  shape.quadraticCurveTo(x, y, x, y + r)

  const depth = d - r * 2
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    curveSegments: 6,
    steps: 1,
    bevelEnabled: true,
    bevelThickness: r,
    bevelSize: r,
    bevelOffset: 0,
    bevelSegments: 3,
  })
  geometry.translate(0, 0, -depth / 2)
  geometry.computeVertexNormals()
  return geometry
}

// ------------------------------------------------------------ proportions --

// Measured off the photograph, in units of one pedestal-block width.
export const PEDESTAL = {
  plinth: { w: 1.2, h: 0.14, d: 0.8, y: 0.07 },
  step: { w: 1.1, h: 0.06, d: 0.72, y: 0.17 },
  block: { w: 1.0, h: 0.86, d: 0.62, y: 0.63 },
  // y is derived, not eyeballed: cap top = y + h/2 must land exactly on
  // SCULPTURE_Y, or the sculpture's foot floats above the pedestal or sinks in.
  cap: { w: 1.04, h: 0.045, d: 0.655, y: 1.0775 },
}
export const PLAQUE = { w: 0.74, h: 0.79, y: 0.615 }
export const SCULPTURE_Y = 1.1

// Three ribbons and a foot. The stem carries the medallion; the long diagonal
// crosses in front of it; the lobe sweeps out to the left behind it. Crossings
// are separated in z as well as x, so the blades genuinely interlace instead of
// intersecting in a single plane.
//
// This is the tuning surface. Each spine is a list of [x, y, z] control points
// from the bottom of that blade to its tip; move one and only that blade moves.
export const SCULPTURE = {
  stem: {
    spine: [
      [0.0, 0.0, 0.0],
      [0.035, 0.22, 0.015],
      [0.03, 0.46, 0.005],
      [-0.005, 0.7, -0.012],
      [-0.04, 0.9, -0.006],
      [-0.05, 1.0, 0.002],
    ],
    // The stem does not end in a point — it runs into the foot and the collar —
    // so it keeps its section and its end caps are hidden inside both.
    profile: (t) => [0.09 - 0.034 * t, 0.064 - 0.016 * t],
  },
  diagonal: {
    spine: [
      [-0.3, 0.36, 0.05],
      [-0.13, 0.5, 0.095],
      [0.09, 0.69, 0.085],
      [0.28, 0.94, 0.032],
      [0.42, 1.18, -0.03],
      [0.5, 1.4, -0.062],
    ],
    profile: taper(0.115, 0.038, 0.42, 0.085),
  },
  lobe: {
    spine: [
      [0.05, 0.08, -0.03],
      [-0.08, 0.19, -0.075],
      [-0.21, 0.36, -0.08],
      [-0.29, 0.55, -0.04],
      [-0.29, 0.72, 0.006],
      [-0.23, 0.84, 0.03],
    ],
    profile: taper(0.092, 0.034, 0.46, 0.08),
  },
}

export const MEDALLION = { radius: 0.32, rim: 0.042, depth: 0.06, y: 1.36, x: -0.06 }

// --------------------------------------------------------------- lighting --

// A dark studio, built as a scene of emissive planes and pushed through
// PMREMGenerator. Gold at metalness 1 has no diffuse term at all: everything
// you see in it is the environment, so this — not the lights — is what decides
// whether it reads as polished metal or as a flat orange blob.
export function buildStudio() {
  const scene = new THREE.Scene()
  const panel = new THREE.PlaneGeometry(1, 1)
  const shell = new THREE.BoxGeometry(40, 40, 40)
  const materials = []

  const room = new THREE.Mesh(
    shell,
    new THREE.MeshStandardMaterial({ color: '#060606', side: THREE.BackSide, roughness: 1 })
  )
  materials.push(room.material)
  scene.add(room)

  const softbox = (w, h, color, intensity, position) => {
    const material = new THREE.MeshStandardMaterial({
      color: '#000000',
      emissive: new THREE.Color(color),
      emissiveIntensity: intensity,
      side: THREE.DoubleSide,
    })
    materials.push(material)
    const mesh = new THREE.Mesh(panel, material)
    mesh.scale.set(w, h, 1)
    mesh.position.set(position[0], position[1], position[2])
    mesh.lookAt(0, 0, 0)
    scene.add(mesh)
  }

  softbox(11, 14, '#fff4e0', 9, [-8, 6, 8]) // key, high and to the left
  softbox(3.6, 14, '#dae6ff', 6, [9, 3, -2]) // cool rim down the right edge
  softbox(9, 6, '#ffffff', 1.5, [2, -6, 8]) // low fill, keeps the base off black
  softbox(14, 3.2, '#fff0d2', 3.4, [0, 11, 1]) // top strip along the sculpture

  return {
    scene,
    dispose() {
      panel.dispose()
      shell.dispose()
      materials.forEach((m) => m.dispose())
    },
  }
}

// Cached per renderer, and deliberately never disposed by hand. The prefiltered
// map is a render target with no CPU-side source: dispose it and it comes back
// empty rather than re-uploading, which is exactly what StrictMode's
// mount/unmount/mount would do to it in development. R3F disposes the renderer
// when the Canvas unmounts, and that frees this along with everything else.
const STUDIO_BY_RENDERER = new WeakMap()

export function studioEnvMap(gl) {
  const cached = STUDIO_BY_RENDERER.get(gl)
  if (cached) return cached

  const studio = buildStudio()
  const pmrem = new THREE.PMREMGenerator(gl)
  const target = pmrem.fromScene(studio.scene, 0.03, 0.1, 120)
  pmrem.dispose()
  studio.dispose()

  STUDIO_BY_RENDERER.set(gl, target.texture)
  return target.texture
}

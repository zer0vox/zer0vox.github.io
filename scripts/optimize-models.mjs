// Geometry pass over the shipped GLB models.
//
// These files are lazily fetched — only when the About page's Experience
// section comes into view — so this is not first-load payload. It is still
// 4.2 MB, and most of it is geometry detail that cannot survive the trip to
// the screen: a chapter model is drawn at most 30% of the frame wide
// (MODEL_MAX_W in ExperienceScene.jsx) and fades to nothing one chapter away.
//
// Two changes, both geometry-only. Texture bytes are deliberately passed
// through untouched, so nothing here needs an image codec:
//
//   1. Drop TANGENT. Both normal-mapped meshes ship per-vertex tangents, which
//      welding and simplification invalidate anyway. three.js derives them
//      from screen-space derivatives when the attribute is absent.
//   2. Simplify, then re-encode with meshopt.
//
// Run with `npm run optimize:models`. Idempotent in the sense that re-running
// simplifies again — so run it against a pristine checkout of the models, not
// repeatedly over its own output.

import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { simplify, weld, dequantize, meshopt } from '@gltf-transform/functions'
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer'
import { statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// `error` is a fraction of the mesh's bounding-sphere radius. 0.0004 keeps the
// silhouette of a board that is never drawn large on screen.
const TARGETS = [
  { file: 'public/models/electronics.glb', error: 0.0004 },
  { file: 'public/models/radio.glb', error: 0.0004 },
]

await MeshoptDecoder.ready
await MeshoptEncoder.ready
await MeshoptSimplifier.ready

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    'meshopt.decoder': MeshoptDecoder,
    'meshopt.encoder': MeshoptEncoder,
  })

const kb = (n) => (n / 1024).toFixed(1).padStart(8) + ' kB'
let before = 0
let after = 0

for (const target of TARGETS) {
  const path = resolve(root, target.file)
  const sizeBefore = statSync(path).size
  const doc = await io.read(path)

  let tangents = 0
  let trisBefore = 0
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const idx = prim.getIndices()
      trisBefore += (idx ? idx.getCount() : prim.getAttribute('POSITION').getCount()) / 3
      if (prim.getAttribute('TANGENT')) {
        prim.setAttribute('TANGENT', null)
        tangents++
      }
    }
  }

  await doc.transform(
    // Quantized data has to be expanded before the simplifier can work on it,
    // and meshopt() re-quantizes at the end.
    dequantize(),
    weld(),
    simplify({ simplifier: MeshoptSimplifier, ratio: 0.3, error: target.error }),
    meshopt({ encoder: MeshoptEncoder, level: 'high' })
  )

  let trisAfter = 0
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const idx = prim.getIndices()
      trisAfter += (idx ? idx.getCount() : prim.getAttribute('POSITION').getCount()) / 3
    }
  }

  await io.write(path, doc)
  const sizeAfter = statSync(path).size
  before += sizeBefore
  after += sizeAfter

  console.log(
    `${kb(sizeBefore)} -> ${kb(sizeAfter)}  (-${(100 - (sizeAfter / sizeBefore) * 100).toFixed(0)}%)  ` +
      `${Math.round(trisBefore).toLocaleString()} -> ${Math.round(trisAfter).toLocaleString()} tris, ` +
      `${tangents} TANGENT dropped  ${target.file}`
  )
}

console.log(`\n${kb(before)} -> ${kb(after)}   saved ${kb(before - after)}`)

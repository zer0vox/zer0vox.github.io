import * as THREE from 'three'
import {
  MEDALLION,
  PEDESTAL,
  PLAQUE,
  SCULPTURE,
  SCULPTURE_Y,
  ribbonGeometry,
  roundedBoxGeometry,
} from '../components/trophyGeometry.js'
import { paintEmblem, paintPlaque } from '../components/trophyTextures.js'

// The DAAI chapter's object: the fellowship's own award, assembled as a plain
// Three.js subtree so it can go through exactly the same staging as the GLB
// chapters — same recentring, same fade, same fit — instead of needing a
// parallel path through the scene. It is the one model with no file behind it.
//
// The geometry and proportions live in components/trophyGeometry.js, which is
// also what scripts/check-trophy.mjs runs under Node. Nothing here sets an
// envMap: the Experience scene puts a studio on scene.environment and these
// materials inherit it, the same way the loaded models do.

export function buildTrophyObject() {
  const group = new THREE.Group()

  const gold = new THREE.MeshPhysicalMaterial({
    color: '#ffc65a',
    metalness: 1,
    roughness: 0.13,
  })
  const goldDeep = new THREE.MeshPhysicalMaterial({
    color: '#e8ab3c',
    metalness: 1,
    roughness: 0.2,
  })
  const lacquer = new THREE.MeshPhysicalMaterial({
    color: '#0a0a0a',
    metalness: 0.35,
    roughness: 0.06,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
  })
  // The printed faces are ink on metal, not metal. Kept mostly diffuse on
  // purpose: at metalness .5 the studio environment supplied half the surface
  // response and washed the artwork out to an unreadable shimmer. The plate
  // still reads as gold — that colour is in the texture, where it belongs.
  const plaqueFace = new THREE.MeshPhysicalMaterial({
    map: paintPlaque(),
    metalness: 0.15,
    roughness: 0.55,
  })
  const emblemFace = new THREE.MeshPhysicalMaterial({
    map: paintEmblem(),
    metalness: 0.15,
    roughness: 0.5,
  })

  const add = (geometry, material, position, rotation, scale) => {
    const mesh = new THREE.Mesh(geometry, material)
    if (position) mesh.position.set(position[0], position[1], position[2])
    if (rotation) mesh.rotation.set(rotation[0], rotation[1], rotation[2])
    if (scale) mesh.scale.set(scale[0], scale[1], scale[2])
    group.add(mesh)
    return mesh
  }

  // Pedestal.
  for (const [name, part] of Object.entries(PEDESTAL)) {
    const radius = name === 'block' ? 0.014 : 0.01
    add(roundedBoxGeometry(part.w, part.h, part.d, radius), lacquer, [0, part.y, 0])
  }

  // Plaque: a gold plate with the engraved artwork on a skin just proud of it.
  const faceZ = PEDESTAL.block.d / 2
  add(roundedBoxGeometry(PLAQUE.w, PLAQUE.h, 0.016, 0.006), goldDeep, [0, PLAQUE.y, faceZ + 0.008])
  add(
    new THREE.PlaneGeometry(PLAQUE.w - 0.012, PLAQUE.h - 0.012),
    plaqueFace,
    [0, PLAQUE.y, faceZ + 0.0165]
  )

  // Sculpture.
  const sculpture = new THREE.Group()
  sculpture.position.y = SCULPTURE_Y
  group.add(sculpture)

  const foot = new THREE.Mesh(new THREE.SphereGeometry(0.175, 40, 28), gold)
  foot.scale.set(1, 0.62, 0.88)
  foot.position.set(0, 0.035, 0)
  sculpture.add(foot)

  for (const name of ['lobe', 'stem', 'diagonal']) {
    const blade = SCULPTURE[name]
    const segments = name === 'stem' ? 120 : name === 'diagonal' ? 200 : 170
    const radial = name === 'stem' ? 18 : 16
    sculpture.add(new THREE.Mesh(ribbonGeometry(blade.spine, blade.profile, segments, radial), gold))
  }

  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.088, 0.14, 44), gold)
  collar.position.set(-0.05, 1.06, 0)
  collar.rotation.z = 0.04
  sculpture.add(collar)

  // Medallion: disc, raised rim, recessed printed face.
  const medallion = new THREE.Group()
  medallion.position.set(MEDALLION.x, MEDALLION.y, 0.01)
  medallion.rotation.set(-0.1, 0.06, 0.07)
  sculpture.add(medallion)

  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(MEDALLION.radius, MEDALLION.radius, MEDALLION.depth, 80),
    gold
  )
  disc.rotation.x = Math.PI / 2
  medallion.add(disc)
  medallion.add(
    new THREE.Mesh(new THREE.TorusGeometry(MEDALLION.radius, MEDALLION.rim, 22, 90), gold)
  )
  const face = new THREE.Mesh(new THREE.CircleGeometry(MEDALLION.radius - 0.045, 80), emblemFace)
  face.position.z = MEDALLION.depth / 2 + 0.001
  medallion.add(face)

  return group
}

import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'
import { buildTrophyObject } from './trophy.js'

// GLB loading for the Experience section's chapter models.
//
// The four files in public/models/ are meshopt-compressed and carry WebP
// textures (see MODELS.md for the pipeline that produced them, and for how to
// re-run it on a replacement). Meshopt rather than Draco on purpose: its
// decoder is an ES module inside the `three` package, so Vite bundles it and
// there is nothing to copy into public/ and keep in sync with the three
// version. Draco's decoder is a wasm pair that would have to be served
// separately.

let loader = null

function getLoader() {
  if (!loader) {
    loader = new GLTFLoader()
    loader.setMeshoptDecoder(MeshoptDecoder)
  }
  return loader
}

// Keyed by `src`. One entry per chapter, held for the life of the tab:
// re-fetching a model every time someone scrolls back to the section would be
// the more expensive mistake.
const cache = new Map()

// Models arrive at whatever scale and origin the author left them at — the
// radio is off-centre and a tenth the size of the board — so nothing can be
// positioned until it has been measured. This recentres each model on its own
// bounding box and returns the scale that makes its longest side exactly one
// world unit. One unit, not a final size: how large a unit should be drawn
// depends on the window, which only the scene knows.
function prepare(object) {
  object.position.set(0, 0, 0)
  object.updateMatrixWorld(true)

  const box = new THREE.Box3().setFromObject(object)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  const longest = Math.max(size.x, size.y, size.z) || 1

  object.position.set(-center.x, -center.y, -center.z)

  // Cloned per model so that fading one chapter cannot touch a material another
  // chapter happens to share, and started at zero so a model that finishes
  // loading mid-scroll fades up from nothing rather than popping in at full
  // strength for one frame before the loop takes over.
  object.traverse((child) => {
    if (!child.isMesh) return
    child.castShadow = false
    child.receiveShadow = false
    child.frustumCulled = false

    const source = Array.isArray(child.material) ? child.material : [child.material]
    const cloned = source.map((material) => {
      const copy = material.clone()
      copy.transparent = true
      // Kept writing depth while fading: a model that is see-through-itself
      // reads as a bug, whereas a whole object dimming reads as intended.
      copy.depthWrite = true
      copy.opacity = 0
      // The scene's environment is a full-strength studio; at that strength it
      // washes these models to a neutral grey and pulls them out of the page's
      // palette. Dialled back here rather than on the scene so the tinted key
      // lights keep their say in the colouring.
      if ('envMapIntensity' in copy) copy.envMapIntensity = 0.85
      return copy
    })
    child.material = Array.isArray(child.material) ? cloned : cloned[0]
  })

  return { object, fit: 1 / longest }
}

export function loadModel(src) {
  const key = src
  let entry = cache.get(key)
  if (!entry) {
    entry = getLoader()
      .loadAsync(src)
      .then((gltf) => prepare(gltf.scene))
      .catch((error) => {
        // A missing or corrupt model must not take the section down with it —
        // the chapter falls back to the abstract node, which is a real look.
        console.warn(`[experience] could not load ${src}`, error)
        cache.delete(key)
        return null
      })
    cache.set(key, entry)
  }
  return entry
}

// The DAAI chapter's trophy is generated rather than fetched, but it has to
// arrive at the stage in the same condition as a loaded model — recentred,
// normalised, materials cloned and faded to nothing — so it goes through the
// same prepare(). Built once and cached like the rest: the geometry is a few
// thousand triangles of swept curves, not free to rebuild on every scroll back.
const builders = { trophy: buildTrophyObject }

export function buildModel(name) {
  const key = `builder:${name}`
  let entry = cache.get(key)
  if (!entry) {
    const builder = builders[name]
    if (!builder) {
      console.warn(`[experience] no builder named ${name}`)
      return Promise.resolve(null)
    }
    // Deferred to an idle slot rather than run inline. The trophy builder is
    // not cheap — fourteen geometries, ~19k vertices of swept CatmullRom
    // ribbons, plus two canvas textures painted at 1536x1644 and 1024x1024 —
    // and measured at 11-63 ms of straight-line main-thread work. Called
    // synchronously it landed inside the very React commit that also creates
    // the WebGL context, runs the environment's PMREM pass and starts decoding
    // several MB of GLB, all while Lenis is animating the page scroll on rAF.
    // That is a felt stall. Nothing else here changes: the function still
    // returns a promise, every caller already awaits it, and prepare() starts
    // each material at opacity 0 so a late arrival fades in rather than pops.
    entry = new Promise((resolve) => {
      const run = () => resolve(prepare(builder()))
      // requestIdleCallback is absent in Safari before 17.4. The timeout stops
      // a busy main thread from starving the build indefinitely.
      if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 600 })
      else setTimeout(run, 0)
    })
    // Set before awaiting anything, so two chapters asking at once still share
    // one build rather than each starting their own.
    cache.set(key, entry)
  }
  return entry
}

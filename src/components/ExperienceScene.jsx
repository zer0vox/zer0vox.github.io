import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { buildModel, loadModel } from '../lib/models.js'

// The 3D half of the Experience section. The DOM half — the year rail and the
// chapter cards — lives in ExperienceTimeline.jsx, which owns the scroll maths
// and hands this scene a single number: `easedRef.current`, a fractional entry
// index (0 = the first chapter, entries.length - 1 = the last).
//
// This scene draws the chapter models and nothing else. There is no ribbon, no
// halo, no ring, no dust, no orbiting dots and no idle motion — an earlier
// version had all of them and they read as decoration for its own sake. The
// only thing that moves is what the reader is moving: scroll position.
//
// Nothing here reaches the screen as it was rendered. The page is a run of
// printed sheets, and this one is marine stock, so the scene is drawn into a
// target off screen and then printed onto the canvas through a halftone
// screen (HalftonePass, below): light becomes paper ink, the brightest
// highlights take the butter plate, and the dark of the stage is simply the
// sheet showing through. The models are still lit and still turn; what the
// reader sees of them is dots.
//
// Chapters still sit on a helix, but the helix is now purely a path, never
// drawn. Scrolling turns and lifts the whole group so the current chapter
// lands exactly on the world origin, where the camera is already pointed. That
// is what keeps the DOM card and the model locked together at any scroll
// position without projecting coordinates back into screen space every frame.
//
// For future edits: this is React Three Fiber, not Threlte. Threlte is the
// Svelte binding for the same Three.js underneath; R3F is the React one.

const PHI = (1 + Math.sqrt(5)) / 2
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

const RADIUS = 4.2
const SPREAD = GOLDEN_ANGLE / 4
const STEP = RADIUS / (PHI * PHI)

const DEG = Math.PI / 180

// Where the current chapter sits across the stage, as a normalized device x:
// -1 is the left edge, 0 the centre. Everything the reader looks at is pinned
// to the world origin, so aiming the camera is what places it.
//
// This has to be an angle derived from the aspect ratio, not a fixed distance.
// The camera used to look at a hard-coded x of 1.5, which put the model 29% in
// from the left at 16:9 — but horizontal field of view shrinks with the
// window, so the same aim slid the model to 14% at 1000x900 and pushed a wide
// model off the left edge entirely. Solving for the angle instead holds the
// model at the same place on screen at every size.
const MODEL_NDC_X = -0.429

// The same idea on the other axis, for the narrow layout only. Below 900px the
// year rail is pinned to the top of the stage and the card to the bottom, so the
// object belongs in the band between them. The aim used to be a hard-coded y of
// -1.15, which on a phone put the object about 20% down -- tucked up behind the
// nav bar, with the empty middle of the stage left over below it. +0.4 is about
// 30% down, the centre of that band.
const MODEL_NDC_Y_NARROW = 0.4

// How much of the stage a model may fill, as a fraction of the frame at the
// model's distance. Two limits rather than one: height alone lets a wide model
// run off the sides of a narrow window, width alone lets a tall one overrun a
// short one. Whichever is tighter wins.
const MODEL_MAX_H = 0.48
const MODEL_MAX_W = 0.3
// Narrow layouts put the card below the model rather than beside it, so the
// model may use more width and less height.
const MODEL_MAX_H_NARROW = 0.34
const MODEL_MAX_W_NARROW = 0.62

// How far, in chapters, a model stays on screen either side of the current
// one. Exactly 1: a neighbouring chapter reaches zero opacity precisely when
// it is one chapter away, so a settled chapter shows its own model and
// nothing else. Anything larger leaves the neighbours smudged faintly across
// the stage, which is most obvious on the chapter that has no model of its own.
const MODEL_RANGE = 1

// The camera's aim point. Written every frame by the one frame loop in this
// file, so it lives at module scope rather than being reallocated per tick.
const lookTarget = new THREE.Vector3()

function pointAt(p, out) {
  const a = p * SPREAD
  return out.set(Math.sin(a) * RADIUS, -p * STEP, Math.cos(a) * RADIUS)
}

// Wide screens read the card beside the model, narrow ones read it below. The
// breakpoint is shared with About.css — see the note above `.xp` there.
const isWide = (state) => state.size.width >= 900

// Solve the camera's aim so the world origin lands at MODEL_NDC_Y_NARROW on
// screen. Derived rather than dialled in, for the same reason MODEL_NDC_X is:
// the aim needed to put a point at a given screen position depends on where the
// camera is standing, so a constant that looks right on one phone drifts on the
// next.
function narrowLookY(state) {
  const camera = state.camera
  const pitchToOrigin = Math.atan2(-camera.position.y, camera.position.z)
  const pitchOfAxis = pitchToOrigin - MODEL_NDC_Y_NARROW * ((camera.fov * DEG) / 2)
  return camera.position.y + camera.position.z * Math.tan(pitchOfAxis)
}

// The frame at the world origin, in world units, for the camera as it is now.
// Both the camera aim and the model scale are solved from this, which is what
// keeps them agreeing at any window size.
function frameAt(state) {
  const camera = state.camera
  const height = 2 * camera.position.length() * Math.tan((camera.fov * DEG) / 2)
  return { height, width: height * camera.aspect }
}

// The world size a model should be drawn at, so that it holds the same share
// of the stage whatever shape the window is.
function modelSize(state) {
  const frame = frameAt(state)
  return isWide(state)
    ? Math.min(frame.height * MODEL_MAX_H, frame.width * MODEL_MAX_W)
    : Math.min(frame.height * MODEL_MAX_H_NARROW, frame.width * MODEL_MAX_W_NARROW)
}

// Chapter models are PBR, and some of them are metal: the motherboard's
// material is metalness 1. A metal surface shows almost nothing of a direct
// light — what it shows is its surroundings — so without an environment to
// reflect it renders black, which on this background means it renders as
// nothing at all. RoomEnvironment is a procedural studio that ships inside
// three, so this costs one offscreen render at mount and no download.
//
// Attached rather than assigned: `attach` puts the texture on the parent's
// `environment` and takes it back off on unmount, which is both the R3F way
// and the reason this component owns no mutation of its own.
function StageEnvironment() {
  const gl = useThree((state) => state.gl)

  const texture = useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const room = new RoomEnvironment()
    const target = pmrem.fromScene(room, 0.04)
    room.dispose?.()
    pmrem.dispose()
    return target.texture
  }, [gl])

  useEffect(() => () => texture.dispose(), [texture])

  return <primitive attach="environment" object={texture} />
}

// ── The print ───────────────────────────────────────────────────────────────
//
// A 45-degree screen, as the hero's portrait and the name sheet's plates are
// screened on the 2D canvas, here done per pixel on the GPU so it can run at
// the frame rate. Each pixel finds the cell of the lattice it falls in, reads
// the scene at that cell's centre (four taps, so a hairline catches a dot
// rather than flickering between cells), and is inked if it lies inside the
// dot the cell's tone asks for.
//
// The tone is light, not shadow: on marine stock the dots are the paper ink,
// so a lit face prints and a dark one is the sheet. A floor of cover wherever
// the model is present keeps a dark object's silhouette printing as a fine
// tint instead of vanishing into the stage. The brightest highlights print in
// butter, as the night ridge's lights do on the philosophy page.
//
// The screen is fine, and every dot is cut to the model's own outline. A
// coarse screen broke thin parts -- the wordmark's letters, the board's
// traces, the trophy's rim -- into a loose dot field with ragged edges; cut,
// each model keeps a clean silhouette with the dots inside it.

// CSS px between dot centres along the screen angle, on the 1440px board;
// scaled with the stage and held between these bounds.
const SCREEN_PITCH = 3.4
const SCREEN_MIN = 2.8
const SCREEN_MAX = 4.4

// Inks, as raw sRGB components: the shader writes them out as they are, with
// no colour management between it and the page.
const PAPER_INK = [0xf4 / 255, 0xf2 / 255, 0xed / 255]
const BUTTER_INK = [0xff / 255, 0xd9 / 255, 0x66 / 255]

// Straight to clip space: a full-screen quad, which ignores the camera.
const screenVertex = /* glsl */ `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const screenFragment = /* glsl */ `
  uniform sampler2D uScene;
  uniform vec2 uRes;
  uniform float uPitch;
  uniform vec3 uPaper;
  uniform vec3 uButter;

  // Into the lattice (turned 45 degrees) and back out of it.
  const mat2 TURN = mat2(0.70710678, -0.70710678, 0.70710678, 0.70710678);
  const mat2 BACK = mat2(0.70710678, 0.70710678, -0.70710678, 0.70710678);

  vec4 tap(vec2 px) {
    vec4 s = texture2D(uScene, px / uRes);
    // The target holds colour already multiplied by the models' fade.
    return vec4(s.a > 0.0001 ? s.rgb / s.a : vec3(0.0), s.a);
  }

  void main() {
    vec2 q = TURN * gl_FragCoord.xy / uPitch;
    vec2 cell = floor(q) + 0.5;
    vec2 centre = BACK * cell * uPitch;

    vec2 o = BACK * vec2(0.25, 0.25) * uPitch;
    vec2 o2 = BACK * vec2(0.25, -0.25) * uPitch;
    vec4 s = 0.25 * (tap(centre + o) + tap(centre - o) + tap(centre + o2) + tap(centre - o2));

    // Linear light to the eye's scale, then levelled: the darkest tenth of a
    // lit model prints at the floor, the top tenth as full dots.
    float l = pow(clamp(dot(s.rgb, vec3(0.2126, 0.7152, 0.0722)), 0.0, 1.0), 1.0 / 2.2);
    float tone = smoothstep(0.1, 0.9, l);
    float cover = s.a * mix(0.07, 0.76, tone);

    // Area to radius, in cells; the dot is cut with a one-pixel soft edge.
    float r = sqrt(cover / 3.14159265);
    float d = length(q - cell);
    float edge = 0.5 / uPitch;
    float ink = 1.0 - smoothstep(r - edge, r + edge, d);
    ink *= step(0.012, cover);

    // Cut to the outline: the model's coverage at this pixel, not at the
    // cell's centre. The target is multisampled, so the edge is smooth.
    float here = texture2D(uScene, gl_FragCoord.xy / uRes).a;
    ink *= smoothstep(0.08, 0.45, here);

    vec3 colour = mix(uPaper, uButter, smoothstep(0.88, 0.97, l));
    gl_FragColor = vec4(colour * ink, ink);
  }
`

function createPass() {
  // Multisampled, so a cut outline is anti-aliased rather than stair-stepped.
  const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 })
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uScene: { value: target.texture },
      uRes: { value: new THREE.Vector2(1, 1) },
      uPitch: { value: SCREEN_PITCH },
      uPaper: { value: new THREE.Vector3(...PAPER_INK) },
      uButter: { value: new THREE.Vector3(...BUTTER_INK) },
    },
    vertexShader: screenVertex,
    fragmentShader: screenFragment,
    // The canvas is composited premultiplied; the shader writes exactly that,
    // and nothing under it is worth blending with.
    blending: THREE.NoBlending,
    depthTest: false,
    depthWrite: false,
  })
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
  quad.frustumCulled = false
  const screen = new THREE.Scene()
  screen.add(quad)

  return {
    target,
    material,
    screen,
    camera: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1),
    dispose() {
      target.dispose()
      material.dispose()
      quad.geometry.dispose()
    },
  }
}

// Renders the scene into a target the size of the canvas, then prints it to
// the canvas through the screen. Registered at a positive priority, which
// tells R3F this component now does the rendering and its own render is off.
// The pass is a live GPU resource written every frame, so it lives in a ref,
// as the models' groups do, rather than in React state.
function HalftonePass() {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)
  const dpr = useThree((state) => state.viewport.dpr)
  const passRef = useRef(null)

  useEffect(() => {
    const pass = createPass()
    passRef.current = pass
    return () => {
      passRef.current = null
      pass.dispose()
    }
  }, [])

  // The target matches the drawing buffer pixel for pixel, and the pitch is
  // set in device pixels from a CSS size that follows the stage's width.
  // Declared after the effect above, so the pass exists by the time it runs.
  useEffect(() => {
    const pass = passRef.current
    if (!pass) return
    const w = Math.max(1, Math.round(size.width * dpr))
    const h = Math.max(1, Math.round(size.height * dpr))
    pass.target.setSize(w, h)
    pass.material.uniforms.uRes.value.set(w, h)
    const pitch = Math.min(SCREEN_MAX, Math.max(SCREEN_MIN, (SCREEN_PITCH * size.width) / 1440))
    pass.material.uniforms.uPitch.value = pitch * dpr
  }, [size, dpr])

  useFrame(() => {
    const pass = passRef.current
    if (!pass) return
    gl.setRenderTarget(pass.target)
    gl.setClearColor(0x000000, 0)
    gl.clear()
    gl.render(scene, camera)
    gl.setRenderTarget(null)
    gl.clear()
    gl.render(pass.screen, pass.camera)
  }, 1)

  return null
}

// One chapter's GLB, parked on that chapter's point on the helix — which is to
// say on the left of the stage, since the camera aims off to the right to
// leave room for the card. Being inside the helix group is what does the work:
// the model inherits the same turn-and-lift as its chapter, so it arrives as
// that chapter comes up and settles dead centre of the stage, without this
// component knowing anything about scroll.
//
// Split in two so that the half holding React state does no animating and the
// half doing the animating holds no state: a loaded model is a live Three.js
// subtree whose materials are written every frame, which is not something a
// state value may be.
function ChapterModel({ entry, index, easedRef, onSettled }) {
  const [model, setModel] = useState(null)

  const spec = entry.model

  useEffect(() => {
    let alive = true
    // A chapter's object is either a file or a builder. Both resolve to the
    // same prepared shape, so nothing below this line cares which it was.
    const arriving = spec.src ? loadModel(spec.src) : buildModel(spec.builder)
    arriving.then((loaded) => {
      if (!alive) return
      if (loaded) setModel(loaded)
      // Reported whether or not it arrived. A chapter whose model failed is
      // never going to produce one, and a spinner left up forever over a
      // chapter that has already fallen back to its abstract node is worse
      // than no spinner at all.
      onSettled?.(index)
    })
    return () => {
      alive = false
    }
  }, [spec.src, spec.builder, index, onSettled])

  // A model that has not arrived yet — or failed to — simply is not there.
  if (!model) return null

  return (
    <StagedModel
      model={model}
      index={index}
      easedRef={easedRef}
      rotation={spec.rotation}
      scale={spec.scale ?? 1}
    />
  )
}

function StagedModel({ model, index, easedRef, rotation, scale }) {
  const groupRef = useRef(null)
  // Gathered from the mounted subtree once, rather than traversed every frame
  // or carried on the loaded model: these are the materials actually on screen,
  // and the fade is then a flat walk over an array this component owns.
  const fadeRef = useRef([])

  useEffect(() => {
    const group = groupRef.current
    if (!group) return undefined

    const found = []
    group.traverse((child) => {
      if (!child.isMesh) return
      const list = Array.isArray(child.material) ? child.material : [child.material]
      for (let i = 0; i < list.length; i += 1) found.push(list[i])
    })
    fadeRef.current = found

    return () => {
      fadeRef.current = []
    }
  }, [model])

  useFrame((state) => {
    const group = groupRef.current
    if (!group) return

    const distance = Math.abs(index - easedRef.current)
    const f = Math.max(0, 1 - distance / MODEL_RANGE)
    const glow = f * f

    group.visible = glow > 0.004
    if (!group.visible) return

    // The helix group is rotated by -p * SPREAD; adding the chapter's own
    // angle back cancels it exactly when this chapter is the current one, so
    // every model comes to rest presenting the same face instead of stopping
    // at whatever angle its position on the helix happened to leave it. There
    // is no term for time here on purpose: a model at rest is still.
    group.rotation.y = index * SPREAD
    // model.fit normalizes the longest side to one world unit; the stage then
    // decides what a world unit is worth at this window size.
    group.scale.setScalar(model.fit * modelSize(state) * scale)

    const materials = fadeRef.current
    for (let i = 0; i < materials.length; i += 1) materials[i].opacity = glow
  })

  // Two groups, not one Euler on one group: the outer turns the model about
  // world Y to face the reader, the inner stands it up. Nesting them keeps the
  // two independent — combined on a single object they would compose in Euler
  // order and the upright correction would tilt with the facing rotation.
  const [rx, ry, rz] = rotation ?? [0, 0, 0]

  return (
    <group ref={groupRef} position={pointAt(index, new THREE.Vector3()).toArray()}>
      <group rotation={[rx * DEG, ry * DEG, rz * DEG]}>
        <primitive object={model.object} />
      </group>
    </group>
  )
}

function Scene({ entries, easedRef, onModelSettled }) {
  const groupRef = useRef(null)

  // Every chapter now carries an object, so this is on for the whole section —
  // it stays a check rather than a constant because a chapter that loses its
  // model should take the lights down with it, not sit lit and empty.
  const lit = useMemo(
    () => entries.some((entry) => Boolean(entry.model?.src || entry.model?.builder)),
    [entries]
  )

  useFrame((state) => {
    const p = easedRef.current

    // Turn and lift the helix so chapter `p` sits on the origin. The camera
    // never moves, so the card anchored beside it never drifts.
    const group = groupRef.current
    if (group) {
      group.rotation.y = -p * SPREAD
      group.position.set(0, p * STEP, -RADIUS)
    }

    // Wide screens read the card beside the model, narrow ones read it below,
    // so the camera aims off-centre rather than the layout moving the canvas.
    // The aim is solved from the frame so the current chapter holds the same
    // spot on screen at every window shape — see MODEL_NDC_X.
    const wide = isWide(state)
    state.camera.position.set(0, wide ? 0.25 : 0.1, wide ? 5.4 : 6.4)
    const lookX = wide ? -MODEL_NDC_X * 0.5 * frameAt(state).width : 0
    state.camera.lookAt(lookTarget.set(lookX, wide ? 0.08 : narrowLookY(state), 0))
  })

  return (
    <>
      {/* Nothing else in the scene is lit, so these exist purely for the
          chapter models and are skipped when no chapter has one. World-fixed
          rather than inside the helix group: the key light should stay put as
          the models turn past it. White, all three: the print reads only how
          much light falls, so a coloured light would only be a weaker one. */}
      {lit && (
        <>
          <StageEnvironment />
          <ambientLight intensity={0.35} />
          <directionalLight position={[3.5, 4, 5]} intensity={2.6} />
          <directionalLight position={[-4.5, -1, 2.5]} intensity={1.1} />
          <directionalLight position={[0, 2.5, -5]} intensity={1.4} />
        </>
      )}

      <group ref={groupRef}>
        {entries.map((entry, i) =>
          entry.model?.src || entry.model?.builder ? (
            <ChapterModel
              key={entry.id}
              entry={entry}
              index={i}
              easedRef={easedRef}
              onSettled={onModelSettled}
            />
          ) : null
        )}
      </group>

      <HalftonePass />
    </>
  )
}

export default function ExperienceScene({ entries, easedRef, live, onModelSettled }) {
  return (
    <Canvas
      className="xp-gl"
      // Parked whenever the section is off-screen: the rest of the page
      // should not pay for a stage nobody can see.
      frameloop={live ? 'always' : 'never'}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ fov: 40, position: [0, 0.25, 5.4], near: 0.1, far: 90 }}
    >
      <Scene entries={entries} easedRef={easedRef} onModelSettled={onModelSettled} />
    </Canvas>
  )
}

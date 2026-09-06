import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

// An iridescent field behind the chapter models — a soap-film / oil-slick
// gradient rather than a flat black stage.
//
// It renders inside the Experience section's existing canvas, as a screen-space
// quad drawn before everything else, so it costs no second WebGL context and
// inherits the section's frameloop gating for free: when the stage scrolls out
// of view the whole canvas parks and this stops with it. Readers on
// prefers-reduced-motion never reach this code at all — they get the flat list
// instead of the stage.
//
// Two things keep it from swamping the object it sits behind:
//
//  * Its brightness is authored in LINEAR space against a #0d0d0d page, so the
//    numbers look implausibly small. They are not: 0.03 linear is about 0.2 in
//    sRGB. Raise INTENSITY, not the palette constants.
//  * It is darkest in the middle and strongest at the edges, because the middle
//    of the stage is where the model and the copy are.

const INTENSITY = 1

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // Straight to clip space: this is a full-screen quad, so it deliberately
    // ignores the camera entirely.
    gl_Position = vec4(position.xy, 1.0, 1.0);
  }
`

const fragment = /* glsl */ `
  uniform float uTime;
  uniform float uProgress;
  uniform float uAspect;
  uniform float uIntensity;
  varying vec2 vUv;

  float wave(vec2 p, float freq, float speed, float t) {
    return sin(p.x * freq + t * speed) * cos(p.y * freq * 0.83 - t * speed * 0.72);
  }

  void main() {
    vec2 p = vUv - 0.5;
    p.x *= uAspect;

    float t = uTime;

    // Domain warping: each layer bends the coordinates the next one samples,
    // which is what turns plain sine bands into something that folds like a
    // film of oil instead of reading as stripes.
    vec2 q = p * 1.6;
    q += 0.30 * vec2(wave(q + 1.7, 1.9, 0.11, t), wave(q.yx - 0.4, 2.3, 0.09, t));
    q += 0.22 * vec2(wave(q * 1.7 + 4.1, 2.6, 0.14, t), wave(q.yx * 1.5 - 2.2, 3.1, 0.12, t));

    // The reader's scroll shifts the bands as well as the clock, so moving
    // through the chapters moves the field with you.
    float band = 0.5 + 0.5 * sin(q.x * 2.2 + q.y * 1.7 + uProgress * 1.4 + t * 0.07);

    // A cosine palette running green -> teal -> blue -> violet: the site's two
    // accents and the interference colours between them.
    vec3 a = vec3(0.016, 0.020, 0.026);
    vec3 b = vec3(0.014, 0.017, 0.022);
    vec3 d = vec3(0.26, 0.42, 0.60);
    vec3 col = a + b * cos(6.28318 * (band + d));

    // Hollow in the middle, where the object and the card live.
    float r = length(p * vec2(0.9, 1.25));
    col *= (0.25 + 0.75 * smoothstep(0.25, 1.05, r)) * uIntensity;

    gl_FragColor = vec4(col, 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

export default function ExperienceBackdrop({ easedRef }) {
  const materialRef = useRef(null)

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uAspect: { value: 1.6 },
      uIntensity: { value: INTENSITY },
    }),
    []
  )

  useFrame((state) => {
    // Written through the mounted material rather than the memo, so the frame
    // loop never mutates a value produced during render.
    const material = materialRef.current
    if (!material) return
    material.uniforms.uTime.value = state.clock.elapsedTime
    material.uniforms.uProgress.value = easedRef.current
    material.uniforms.uAspect.value = state.size.width / Math.max(1, state.size.height)
  })

  return (
    <mesh renderOrder={-1} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertex}
        fragmentShader={fragment}
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

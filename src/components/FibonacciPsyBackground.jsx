import { useEffect, useRef } from 'react'
import { Camera, Geometry, Mesh, Program, Renderer, Transform } from 'ogl'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion } from 'framer-motion'

const TAU = Math.PI * 2
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

export default function FibonacciPsyBackground() {
  const oglMountRef = useRef(null)
  const psyCanvasRef = useRef(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const mount = oglMountRef.current
    const psyCanvas = psyCanvasRef.current
    if (!mount || !psyCanvas) return undefined
    const psyCtx = psyCanvas.getContext('2d')
    if (!psyCtx) return undefined

    const renderer = new Renderer({ alpha: true, antialias: true, dpr: Math.min(window.devicePixelRatio, 2) })
    const gl = renderer.gl
    gl.clearColor(0, 0, 0, 0)
    mount.appendChild(gl.canvas)

    const camera = new Camera(gl, { fov: 42 })
    camera.position.set(0, 0, 5.5)
    const scene = new Transform()

    const count = 987
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    for (let i = 0; i < count; i += 1) {
      const y = 1 - (i / (count - 1)) * 2
      const radius = Math.sqrt(1 - y * y)
      const theta = GOLDEN_ANGLE * i
      positions[i * 3 + 0] = Math.cos(theta) * radius
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = Math.sin(theta) * radius
      seeds[i] = i / count
    }

    const geometry = new Geometry(gl, {
      position: { size: 3, data: positions },
      seed: { size: 1, data: seeds }
    })

    const program = new Program(gl, {
      vertex: `
        attribute vec3 position;
        attribute float seed;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform float uTime;
        varying float vSeed;
        varying float vDepth;
        void main() {
          vec3 p = position;
          float n = sin((p.y * 14.0) + uTime * 1.5 + seed * 16.0) * 0.06;
          p += normalize(position) * n;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          vDepth = -mv.z;
          vSeed = seed;
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (2.3 + seed * 2.7) * (7.0 / max(2.0, vDepth));
        }
      `,
      fragment: `
        precision highp float;
        uniform float uTime;
        varying float vSeed;
        varying float vDepth;
        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float d = length(uv);
          if (d > 0.5) discard;
          float hue = 0.58 + 0.12 * sin(uTime * 0.35 + vSeed * 20.0);
          vec3 cA = vec3(0.43, 0.58, 1.0);
          vec3 cB = vec3(0.74, 0.42, 1.0);
          vec3 col = mix(cA, cB, 0.5 + 0.5 * sin(vSeed * 16.0 + uTime * 0.45));
          float alpha = smoothstep(0.5, 0.0, d) * (0.28 + 0.55 / (1.0 + vDepth * 0.12));
          gl_FragColor = vec4(col, alpha);
        }
      `,
      uniforms: {
        uTime: { value: 0 }
      },
      transparent: true
    })

    const cloud = new Mesh(gl, { geometry, program, mode: gl.POINTS })
    cloud.setParent(scene)

    let width = 0
    let height = 0
    const psy = { intensity: 0 }

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      renderer.setSize(width, height)
      camera.perspective({ aspect: width / height })

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      psyCanvas.width = Math.floor(width * dpr)
      psyCanvas.height = Math.floor(height * dpr)
      psyCanvas.style.width = `${width}px`
      psyCanvas.style.height = `${height}px`
      psyCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const scrollTween = gsap.to(psy, {
      intensity: 1,
      paused: true,
      duration: 0.55,
      ease: 'power2.out'
    })

    const trigger = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate(self) {
        const velocity = Math.min(1, Math.abs(self.getVelocity()) / 1200)
        scrollTween.pause()
        gsap.to(psy, {
          intensity: Math.max(0.2, velocity),
          duration: 0.18,
          ease: 'power1.out',
          overwrite: true,
          onComplete: () => {
            gsap.to(psy, { intensity: 0.08, duration: 0.8, ease: 'power2.out' })
          }
        })
      }
    })

    const drawPsy = (time) => {
      psyCtx.clearRect(0, 0, width, height)
      const intense = psy.intensity
      if (intense < 0.015) return
      psyCtx.globalCompositeOperation = 'screen'
      const cx = width * 0.5
      const cy = height * 0.5
      for (let k = 0; k < 6; k += 1) {
        const base = Math.min(width, height) * (0.16 + k * 0.08)
        psyCtx.strokeStyle = `hsla(${245 + k * 18 + Math.sin(time * 0.001 + k) * 25}, 94%, 66%, ${0.14 + intense * 0.42})`
        psyCtx.lineWidth = 1.2 + k * 0.48
        psyCtx.beginPath()
        for (let i = 0; i <= 180; i += 1) {
          const a = (i / 180) * TAU
          const r =
            base +
            Math.sin(a * (3.2 + k) + time * 0.0023) * 32 * intense +
            Math.sin(a * (8.4 + k * 0.75) - time * 0.0015) * 19 * intense
          const x = cx + Math.cos(a) * r
          const y = cy + Math.sin(a) * r
          if (i === 0) psyCtx.moveTo(x, y)
          else psyCtx.lineTo(x, y)
        }
        psyCtx.closePath()
        psyCtx.stroke()
      }
      psyCtx.globalCompositeOperation = 'source-over'
    }

    let rafId = 0
    const render = (ms) => {
      const time = ms * 0.001
      program.uniforms.uTime.value = time
      cloud.rotation.y = time * 0.18
      cloud.rotation.x = Math.sin(time * 0.21) * 0.26
      renderer.render({ scene, camera })
      drawPsy(ms)
      rafId = requestAnimationFrame(render)
    }

    resize()
    window.addEventListener('resize', resize)
    rafId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
      trigger.kill()
      if (gl.canvas.parentNode) gl.canvas.parentNode.removeChild(gl.canvas)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [])

  return (
    <div className="fx-bg" aria-hidden="true">
      <motion.div
        className="fx-bg-ogl"
        ref={oglMountRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      />
      <canvas ref={psyCanvasRef} className="fx-bg-psy" />
    </div>
  )
}

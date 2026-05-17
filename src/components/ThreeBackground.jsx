import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function ThreeBackground() {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.z = 30

    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true 
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    containerRef.current.appendChild(renderer.domElement)

    // Create flowing geometric particles
    const particleCount = 3000
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)

    for (let i = 0; i < particleCount; i++) {
      // Spiral/wave formation
      const t = i / particleCount
      const angle = t * Math.PI * 20
      const radius = 15 + Math.sin(t * Math.PI * 4) * 5
      
      positions[i * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 3
      positions[i * 3 + 1] = (t - 0.5) * 60 + (Math.random() - 0.5) * 2
      positions[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 3

      // Color gradient (blue-purple-pink)
      const hue = 0.6 - t * 0.2 // Blue to magenta
      const color = new THREE.Color().setHSL(hue, 0.8, 0.6)
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b

      sizes[i] = Math.random() * 2 + 0.5
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        uniform float uTime;
        
        void main() {
          vColor = color;
          vec3 pos = position;
          
          // Flowing wave motion
          float wave = sin(pos.y * 0.1 + uTime * 0.5) * 2.0;
          pos.x += wave;
          pos.z += cos(pos.y * 0.1 + uTime * 0.5) * 2.0;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          // Circular point
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          if (dist > 0.5) discard;
          
          float alpha = 1.0 - (dist * 2.0);
          alpha = pow(alpha, 2.0);
          
          gl_FragColor = vec4(vColor, alpha * 0.6);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true
    })

    const particles = new THREE.Points(geometry, material)
    scene.add(particles)

    // Add ambient geometric shapes
    const torusGeometry = new THREE.TorusGeometry(12, 0.5, 16, 100)
    const torusMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x4466ff,
      wireframe: true,
      transparent: true,
      opacity: 0.15
    })
    const torus = new THREE.Mesh(torusGeometry, torusMaterial)
    torus.rotation.x = Math.PI / 4
    scene.add(torus)

    // Second torus
    const torus2 = new THREE.Mesh(
      new THREE.TorusGeometry(8, 0.3, 16, 100),
      new THREE.MeshBasicMaterial({ 
        color: 0xff6699,
        wireframe: true,
        transparent: true,
        opacity: 0.1
      })
    )
    torus2.rotation.y = Math.PI / 3
    scene.add(torus2)

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    // Animation loop
    let animationId
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      
      const time = performance.now() * 0.001
      material.uniforms.uTime.value = time
      
      particles.rotation.y = time * 0.05
      particles.rotation.x = Math.sin(time * 0.1) * 0.1
      
      torus.rotation.x += 0.003
      torus.rotation.y += 0.002
      
      torus2.rotation.y += 0.004
      torus2.rotation.z += 0.002
      
      renderer.render(scene, camera)
    }
    animate()

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement)
      }
      geometry.dispose()
      material.dispose()
      torusGeometry.dispose()
      torusMaterial.dispose()
      renderer.dispose()
    }
  }, [])

  return <div ref={containerRef} className="fx-bg-three" />
}

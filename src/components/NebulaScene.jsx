import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import * as THREE from 'three'

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uPixelRatio;
  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    float radius = length(p.xz);
    float angle = atan(p.z, p.x);

    float drift = uTime * (0.035 + 0.06 / (1.0 + radius));
    angle += drift;
    p.x = cos(angle) * radius;
    p.z = sin(angle) * radius;
    p.y += sin(uTime * 0.42 + aPhase + radius * 0.7) * (0.025 + radius * 0.008);

    vec2 influence = uPointer * 0.18;
    p.x += influence.x * (0.35 + 0.08 * radius);
    p.y += influence.y * (0.2 + 0.05 * radius);

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aSize * uPixelRatio * (8.0 / -mvPosition.z);

    float pulse = 0.72 + 0.28 * sin(uTime * 0.7 + aPhase);
    vAlpha = pulse * smoothstep(11.0, 1.5, radius);
    vColor = aColor;
  }
`

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    if (dist > 0.5) discard;
    float core = smoothstep(0.16, 0.0, dist);
    float halo = smoothstep(0.5, 0.08, dist);
    gl_FragColor = vec4(vColor * (1.0 + core * 1.8), (halo * 0.65 + core) * vAlpha);
  }
`

function seededRandom(seed) {
  const value = Math.sin(seed * 12.9898) * 43758.5453
  return value - Math.floor(value)
}

function NebulaParticles({ count = 11000 }) {
  const materialRef = useRef()
  const pointsRef = useRef()
  const { gl } = useThree()

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const phases = new Float32Array(count)
    const cool = new THREE.Color('#69d8ca')
    const pale = new THREE.Color('#d9eeea')
    const warm = new THREE.Color('#ffad63')
    const color = new THREE.Color()

    for (let i = 0; i < count; i += 1) {
      const seed = i + 1
      const radius = Math.pow(seededRandom(seed), 0.72) * 8.8 + 0.18
      const arm = i % 3
      const branchAngle = (arm / 3) * Math.PI * 2
      const spin = radius * 0.92
      const scatter = (seededRandom(seed * 2.1) - 0.5) * (0.32 + radius * 0.15)
      const angle = branchAngle + spin + scatter
      const radialJitter = 1 + (seededRandom(seed * 4.7) - 0.5) * 0.16

      positions[i * 3] = Math.cos(angle) * radius * radialJitter
      positions[i * 3 + 1] = (seededRandom(seed * 7.3) - 0.5) * (0.28 + radius * 0.09)
      positions[i * 3 + 2] = Math.sin(angle) * radius * radialJitter

      const warmth = seededRandom(seed * 9.9)
      if (warmth > 0.965) color.copy(warm)
      else color.copy(cool).lerp(pale, seededRandom(seed * 3.4) * 0.65)
      color.multiplyScalar(0.65 + seededRandom(seed * 5.2) * 0.55)

      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
      sizes[i] = 1.4 + seededRandom(seed * 11.2) * (warmth > 0.965 ? 7.5 : 4.0)
      phases[i] = seededRandom(seed * 15.8) * Math.PI * 2
    }

    const buffer = new THREE.BufferGeometry()
    buffer.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    buffer.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
    buffer.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    buffer.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
    return buffer
  }, [count])

  useFrame((state, delta) => {
    if (!materialRef.current || !pointsRef.current) return
    materialRef.current.uniforms.uTime.value += delta
    materialRef.current.uniforms.uPointer.value.lerp(state.pointer, 0.035)
    pointsRef.current.rotation.x = THREE.MathUtils.lerp(pointsRef.current.rotation.x, -0.35 + state.pointer.y * 0.035, 0.02)
    pointsRef.current.rotation.z += delta * 0.006
  })

  return (
    <points ref={pointsRef} geometry={geometry} rotation={[-0.35, 0, -0.16]}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{
          uTime: { value: 0 },
          uPointer: { value: new THREE.Vector2() },
          uPixelRatio: { value: Math.min(gl.getPixelRatio(), 2) },
        }}
      />
    </points>
  )
}

function MemoryCore() {
  const groupRef = useRef()

  useFrame(({ clock, pointer }) => {
    const time = clock.getElapsedTime()
    groupRef.current.rotation.y = time * 0.08
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, pointer.x * 0.18, 0.03)
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, pointer.y * 0.1, 0.03)
  })

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[0.38, 32, 32]} />
        <meshBasicMaterial color="#c8fff4" transparent opacity={0.58} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.78, 32, 32]} />
        <meshBasicMaterial color="#5bd8c5" transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>
      <pointLight color="#7dffe5" intensity={11} distance={4.5} decay={2} />
    </group>
  )
}

function CameraRig() {
  useFrame(({ camera, pointer }) => {
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 0.38, 0.018)
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 5.3 + pointer.y * 0.22, 0.018)
    camera.lookAt(0, 0, 0)
  })
  return null
}

export function NebulaScene() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const particleCount = reducedMotion ? 4500 : 11000

  return (
    <Canvas
      camera={{ position: [0, 5.3, 8.5], fov: 46, near: 0.1, far: 100 }}
      dpr={[1, 1.75]}
      gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.setClearColor('#06080b')
        gl.outputColorSpace = THREE.SRGBColorSpace
      }}
    >
      <fog attach="fog" args={['#06080b', 9, 22]} />
      <NebulaParticles count={particleCount} />
      <MemoryCore />
      {!reducedMotion && <CameraRig />}
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur intensity={1.3} luminanceThreshold={0.25} luminanceSmoothing={0.75} radius={0.7} />
      </EffectComposer>
    </Canvas>
  )
}

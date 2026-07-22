import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, Html, OrbitControls, Stars } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { gsap } from 'gsap'
import {
  Aperture,
  ArrowRight,
  Clock,
  Compass,
  Eye,
  Grid3X3,
  Orbit,
  Plus,
  Search,
  Tag,
  X,
} from 'lucide-react'
import * as THREE from 'three'
import { getAllPosts } from '../lib/mdx.js'
import { generateNebulaLayout, getCameraFlightDestination, getNebulaRadius } from '../lib/nebula-layout.js'

const POSTS = getAllPosts()
const LAYOUT_POSITIONS = generateNebulaLayout(POSTS.length)
const MEMORY_NODES = POSTS.map((post, index) => ({ ...post, position: LAYOUT_POSITIONS[index] }))
const NEBULA_RADIUS = getNebulaRadius(MEMORY_NODES.length) * 1.08
const HOME_CAMERA_DISTANCE = Math.max(7.8, NEBULA_RADIUS * 2.05)

const particleVertexShader = /* glsl */ `
  uniform float uTime;
  attribute float aSize;
  attribute float aPhase;
  attribute vec3 color;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    float radius = length(p.xz);
    float angle = atan(p.z, p.x) + uTime * (0.008 + 0.024 / (1.0 + radius));
    p.x = cos(angle) * radius;
    p.z = sin(angle) * radius;
    p.y += sin(uTime * 0.26 + aPhase + radius * 0.35) * 0.09;

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aSize * 8.0 * (8.0 / max(1.0, -mvPosition.z));
    vColor = color;
    vAlpha = 0.45 + 0.25 * sin(uTime * 0.42 + aPhase);
  }
`

const particleFragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float distanceToCenter = length(gl_PointCoord - 0.5);
    if (distanceToCenter > 0.5) discard;
    float halo = smoothstep(0.5, 0.05, distanceToCenter);
    float core = smoothstep(0.14, 0.0, distanceToCenter);
    gl_FragColor = vec4(vColor * (1.0 + core), (halo * 0.55 + core) * vAlpha);
  }
`

function seededRandom(seed) {
  const value = Math.sin(seed * 12.9898) * 43758.5453
  return value - Math.floor(value)
}

function MemoryNodeItem({ data, isSelected, onSelect, reducedMotion, dense }) {
  const crystalRef = useRef()
  const ringRef = useRef()
  const haloRef = useRef()
  const [hovered, setHovered] = useState(false)

  useFrame((state, delta) => {
    if (!crystalRef.current) return

    if (!reducedMotion) {
      crystalRef.current.rotation.x += delta * 0.34
      crystalRef.current.rotation.y += delta * 0.48
      if (ringRef.current) ringRef.current.rotation.z -= delta * 0.42
    }

    const pulse = reducedMotion ? 1 : 1 + Math.sin(state.clock.elapsedTime * 1.7 + data.position[0]) * 0.05
    const targetScale = hovered || isSelected ? 1.22 : pulse
    crystalRef.current.scale.setScalar(THREE.MathUtils.lerp(crystalRef.current.scale.x, targetScale, 0.1))
    if (haloRef.current) haloRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 1.2) * 0.06)
  })

  const setPointerState = (active) => {
    setHovered(active)
    document.body.style.cursor = active ? 'pointer' : 'default'
  }

  return (
    <Float
      speed={reducedMotion ? 0 : 1.25}
      rotationIntensity={reducedMotion ? 0 : 0.2}
      floatIntensity={reducedMotion ? 0 : dense ? 0.16 : 0.45}
      position={data.position}
    >
      <group
        onClick={(event) => {
          event.stopPropagation()
          onSelect(data)
        }}
        onPointerOver={(event) => {
          event.stopPropagation()
          setPointerState(true)
        }}
        onPointerOut={() => setPointerState(false)}
      >
        {(!dense || hovered || isSelected) && (
          <mesh ref={haloRef}>
            <sphereGeometry args={[dense ? 0.52 : 0.7, dense ? 12 : 24, dense ? 12 : 24]} />
            <meshBasicMaterial color={data.color} transparent opacity={hovered || isSelected ? 0.1 : 0.035} depthWrite={false} />
          </mesh>
        )}

        <mesh ref={crystalRef}>
          <icosahedronGeometry args={[dense ? 0.34 : 0.48, dense ? 0 : 1]} />
          {dense ? (
            <meshStandardMaterial
              color={data.color}
              emissive={data.color}
              emissiveIntensity={hovered || isSelected ? 2.4 : 1.05}
              roughness={0.2}
              metalness={0.18}
            />
          ) : (
            <meshPhysicalMaterial
              color={data.color}
              emissive={data.color}
              emissiveIntensity={hovered || isSelected ? 2.8 : 1.15}
              roughness={0.08}
              metalness={0.12}
              clearcoat={1}
              clearcoatRoughness={0.08}
              transparent
              opacity={0.92}
            />
          )}
        </mesh>

        {(!dense || hovered || isSelected) && (
          <mesh ref={ringRef} rotation={[Math.PI / 2.8, 0.22, 0]}>
            <torusGeometry args={[dense ? 0.62 : 0.82, 0.012, 8, dense ? 40 : 96]} />
            <meshBasicMaterial color={data.color} transparent opacity={hovered || isSelected ? 0.95 : 0.34} depthWrite={false} />
          </mesh>
        )}

        {hovered && !isSelected && (
          <Html distanceFactor={9} position={[0, -0.92, 0]} center occlude={false}>
            <div className="node-label max-w-[180px] truncate whitespace-nowrap border-ion/55 bg-ink/85 px-2.5 py-1 font-mono text-[10px] text-white">
              {data.title}
            </div>
          </Html>
        )}
      </group>
    </Float>
  )
}

function BackgroundParticles({ reducedMotion }) {
  const pointsRef = useRef()
  const materialRef = useRef()
  const count = reducedMotion ? 700 : 1800

  const [positions, colors, sizes, phases] = useMemo(() => {
    const positionData = new Float32Array(count * 3)
    const colorData = new Float32Array(count * 3)
    const sizeData = new Float32Array(count)
    const phaseData = new Float32Array(count)
    const palette = ['#79e1d0', '#d8e7e7', '#75aef2', '#ffbd6e']

    for (let index = 0; index < count; index += 1) {
      const seed = index + 1
      const radius = 4 + seededRandom(seed * 2.3) * 15
      const theta = seededRandom(seed * 5.1) * Math.PI * 2
      const phi = Math.acos(2 * seededRandom(seed * 8.7) - 1)
      positionData[index * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positionData[index * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positionData[index * 3 + 2] = radius * Math.cos(phi)

      const color = new THREE.Color(palette[Math.floor(seededRandom(seed * 11.9) * palette.length)])
      colorData[index * 3] = color.r
      colorData[index * 3 + 1] = color.g
      colorData[index * 3 + 2] = color.b
      sizeData[index] = 0.5 + seededRandom(seed * 14.3)
      phaseData[index] = seededRandom(seed * 17.7) * Math.PI * 2
    }

    return [positionData, colorData, sizeData, phaseData]
  }, [count])

  useFrame((_, delta) => {
    if (!pointsRef.current || !materialRef.current || reducedMotion) return
    materialRef.current.uniforms.uTime.value += delta
    pointsRef.current.rotation.y += delta * 0.004
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" count={count} array={sizes} itemSize={1} />
        <bufferAttribute attach="attributes-aPhase" count={count} array={phases} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
        uniforms={{ uTime: { value: 0 } }}
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function MemoryCenter({ reducedMotion }) {
  const ref = useRef()

  useFrame(({ clock }) => {
    if (!ref.current || reducedMotion) return
    ref.current.rotation.y = clock.elapsedTime * 0.1
    ref.current.rotation.x = Math.sin(clock.elapsedTime * 0.24) * 0.1
  })

  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[0.14, 24, 24]} />
        <meshBasicMaterial color="#eafffb" />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.15, 0.006, 8, 128]} />
        <meshBasicMaterial color="#79e1d0" transparent opacity={0.18} />
      </mesh>
      <pointLight color="#79e1d0" intensity={9} distance={5} decay={2} />
    </group>
  )
}

function CameraFlightController({ targetNode, controlsRef, homePosition, reducedMotion }) {
  const { camera } = useThree()
  const hasInitialized = useRef(false)

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return undefined

    const focus = controls.target.clone()
    const nextFocus = targetNode ? new THREE.Vector3(...targetNode.position) : new THREE.Vector3(0, 0, 0)
    let nextCameraPosition

    if (targetNode) {
      nextCameraPosition = new THREE.Vector3(
        ...getCameraFlightDestination(targetNode.position, camera.position.toArray()),
      )
    } else {
      nextCameraPosition = new THREE.Vector3(...homePosition)
    }

    const syncCameraTarget = () => {
      controls.target.copy(focus)
      camera.lookAt(focus)
    }

    if (!hasInitialized.current && !targetNode) {
      hasInitialized.current = true
      camera.position.copy(nextCameraPosition)
      focus.copy(nextFocus)
      syncCameraTarget()
      controls.enabled = true
      controls.autoRotate = !reducedMotion
      controls.update()
      return undefined
    }

    hasInitialized.current = true

    controls.enabled = false
    controls.autoRotate = false

    if (reducedMotion) {
      camera.position.copy(nextCameraPosition)
      focus.copy(nextFocus)
      syncCameraTarget()
      controls.enabled = true
      controls.update()
      return undefined
    }

    const timeline = gsap.timeline({
      defaults: {
        duration: targetNode ? 1.65 : 1.85,
        ease: targetNode ? 'power3.inOut' : 'power2.inOut',
      },
      onUpdate: syncCameraTarget,
      onComplete: () => {
        camera.position.copy(nextCameraPosition)
        focus.copy(nextFocus)
        syncCameraTarget()
        controls.enabled = true
        controls.autoRotate = !targetNode
        controls.update()
      },
    })

    timeline
      .to(camera.position, {
        x: nextCameraPosition.x,
        y: nextCameraPosition.y,
        z: nextCameraPosition.z,
      }, 0)
      .to(focus, {
        x: nextFocus.x,
        y: nextFocus.y,
        z: nextFocus.z,
      }, 0)

    return () => {
      timeline.kill()
      gsap.killTweensOf(camera.position)
      gsap.killTweensOf(focus)
    }
  }, [camera, controlsRef, homePosition, reducedMotion, targetNode])

  return null
}

function NebulaCanvas({ nodes, selectedNode, onSelect, reducedMotion }) {
  const controlsRef = useRef()
  const homePosition = useMemo(() => [0, 0, HOME_CAMERA_DISTANCE], [])
  const cameraFar = Math.max(120, HOME_CAMERA_DISTANCE * 8)
  const fogNear = Math.max(10, HOME_CAMERA_DISTANCE * 0.7)
  const fogFar = Math.max(27, HOME_CAMERA_DISTANCE * 1.9)

  return (
    <Canvas
      camera={{ position: homePosition, fov: 54, near: 0.1, far: cameraFar }}
      dpr={[1, 1.7]}
      gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.setClearColor('#06080b')
        gl.outputColorSpace = THREE.SRGBColorSpace
      }}
      onPointerMissed={() => onSelect(null)}
    >
      <fog attach="fog" args={['#06080b', fogNear, fogFar]} />
      <ambientLight intensity={0.38} />
      <pointLight position={[7, 8, 8]} intensity={14} color="#79e1d0" distance={24} />
      <pointLight position={[-8, -6, -5]} intensity={10} color="#ffbd6e" distance={20} />

      <Stars
        radius={Math.max(72, HOME_CAMERA_DISTANCE * 2.5)}
        depth={Math.max(35, HOME_CAMERA_DISTANCE)}
        count={reducedMotion ? 800 : 2200}
        factor={2.5}
        saturation={0.15}
        fade
        speed={reducedMotion ? 0 : 0.35}
      />
      <BackgroundParticles reducedMotion={reducedMotion} />
      <MemoryCenter reducedMotion={reducedMotion} />
      <CameraFlightController
        targetNode={selectedNode}
        controlsRef={controlsRef}
        homePosition={homePosition}
        reducedMotion={reducedMotion}
      />

      {nodes.map((node) => (
        <MemoryNodeItem
          key={node.id}
          data={node}
          isSelected={selectedNode?.id === node.id}
          onSelect={onSelect}
          reducedMotion={reducedMotion}
          dense={nodes.length > 80}
        />
      ))}

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableDamping
        dampingFactor={0.05}
        minDistance={2.2}
        maxDistance={HOME_CAMERA_DISTANCE * 1.35}
        minPolarAngle={Math.PI * 0.23}
        maxPolarAngle={Math.PI * 0.77}
        autoRotate={!selectedNode && !reducedMotion}
        autoRotateSpeed={0.22}
      />
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur intensity={1.15} luminanceThreshold={0.3} luminanceSmoothing={0.8} radius={0.65} />
      </EffectComposer>
    </Canvas>
  )
}

function ViewSwitch({ viewMode, onChange }) {
  return (
    <div className="flex h-9 items-center border border-white/10 bg-white/[0.035] p-1" role="group" aria-label="视图模式">
      <button
        type="button"
        onClick={() => onChange('3d')}
        className={`flex h-7 items-center gap-1.5 px-3 text-[11px] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ion ${
          viewMode === '3d' ? 'bg-ion/15 text-white' : 'text-mist/40 hover:text-mist/80'
        }`}
        aria-pressed={viewMode === '3d'}
      >
        <Compass className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">3D 星域</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('list')}
        className={`flex h-7 items-center gap-1.5 px-3 text-[11px] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ion ${
          viewMode === 'list' ? 'bg-ion/15 text-white' : 'text-mist/40 hover:text-mist/80'
        }`}
        aria-pressed={viewMode === 'list'}
      >
        <Grid3X3 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">记忆矩阵</span>
      </button>
    </div>
  )
}

function MemoryList({ nodes, onSelect }) {
  if (nodes.length === 0) {
    return (
      <div className="grid h-full place-items-center px-6 text-center">
        <div>
          <Aperture className="mx-auto h-7 w-7 text-mist/25" />
          <p className="mt-4 font-display text-xl text-mist/70">没有找到相符的记忆</p>
          <p className="mt-2 text-xs text-mist/35">换一个标题或标签继续搜索。</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto px-5 pb-10 pt-36 sm:px-8 sm:pt-28">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-2">
        {nodes.map((node) => (
          <button
            type="button"
            key={node.id}
            onClick={() => onSelect(node)}
            className="glass-card glass-card-hover group min-h-[210px] p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ion sm:p-6"
          >
            <div className="flex items-center justify-between gap-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: node.color }}>
                {node.category}
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[10px] text-mist/35">
                <Clock className="h-3 w-3" />
                {node.date}
              </span>
            </div>
            <h2 className="mt-5 font-display text-xl leading-snug text-white transition group-hover:text-ion sm:text-2xl">{node.title}</h2>
            <p className="mt-3 line-clamp-2 text-xs leading-6 text-mist/50">{node.summary}</p>
            <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
              <span className="truncate font-mono text-[10px] text-mist/35">{node.tags.map((tag) => `#${tag}`).join('  ')}</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-ion/60 transition-transform group-hover:translate-x-1" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

const markdownComponents = {
  h2: ({ children }) => <h2 className="mt-10 font-display text-2xl leading-snug text-white">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-8 font-display text-xl leading-snug text-mist/90">{children}</h3>,
  p: ({ children }) => <p className="mt-5 text-[14px] leading-7 text-mist/65">{children}</p>,
  ul: ({ children }) => <ul className="mt-5 space-y-2 pl-5 text-[14px] leading-7 text-mist/65 marker:text-ion/70">{children}</ul>,
  ol: ({ children }) => <ol className="mt-5 list-decimal space-y-2 pl-5 text-[14px] leading-7 text-mist/65 marker:font-mono marker:text-ion/70">{children}</ol>,
  li: ({ children }) => <li className="pl-1">{children}</li>,
  strong: ({ children }) => <strong className="font-medium text-mist/90">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="my-7 border-l-2 border-ember/55 bg-ember/[0.035] py-1 pl-5 pr-3 font-display text-base leading-7 text-mist/75">
      {children}
    </blockquote>
  ),
  code: ({ className, children }) => (
    <code className={`${className || ''} border border-white/10 bg-black/25 px-1.5 py-0.5 font-mono text-[12px] text-ion/85`}>
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="my-6 overflow-x-auto border border-white/10 bg-black/35 p-4 text-[12px] leading-6 [&_code]:border-0 [&_code]:bg-transparent [&_code]:p-0">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-7 overflow-x-auto border border-white/10">
      <table className="w-full min-w-[420px] border-collapse text-left text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-white/[0.055] text-mist/80">{children}</thead>,
  th: ({ children }) => <th className="border-b border-white/10 px-3 py-2.5 font-medium">{children}</th>,
  td: ({ children }) => <td className="border-b border-white/[0.07] px-3 py-2.5 leading-5 text-mist/55">{children}</td>,
  hr: () => <hr className="my-9 border-white/10" />,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-ion underline decoration-ion/30 underline-offset-4 hover:decoration-ion">
      {children}
    </a>
  ),
}

function MemoryDetail({ node, onClose }) {
  return (
    <aside
      className="liquid-glass fixed inset-y-0 right-0 z-50 w-full overflow-y-auto px-6 pb-10 backdrop-blur-2xl sm:w-[540px] sm:px-9"
      aria-labelledby={`memory-title-${node.id}`}
    >
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/[0.07] bg-void/60 py-5 backdrop-blur-xl">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: node.color }}>
          {node.category}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="grid h-9 w-9 place-items-center border border-white/10 text-mist/55 transition hover:border-white/25 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ion"
          aria-label="关闭详情"
          title="关闭"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <article className="relative z-10 pb-10 pt-12">
        <div className="mb-7 flex items-center gap-3">
          <span className="h-px w-10" style={{ backgroundColor: node.color }} />
          <Orbit className="h-4 w-4" style={{ color: node.color }} />
        </div>
        <h1 id={`memory-title-${node.id}`} className="font-display text-3xl leading-tight text-white sm:text-4xl">{node.title}</h1>
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-white/10 pb-6 font-mono text-[10px] text-mist/40">
          <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{node.date}</span>
          <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" />阅读 {node.readTime}</span>
        </div>
        <p className="mt-7 border-l border-ion/35 pl-4 text-[15px] leading-7 text-mist/72">{node.summary}</p>

        <div className="mt-8">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-mist/30">节点标签</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {node.tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1.5 border border-white/10 bg-white/[0.035] px-2.5 py-1.5 text-[10px] text-mist/55">
                <Tag className="h-3 w-3 text-ion/70" />
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-2">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {node.content || node.summary}
          </ReactMarkdown>
        </div>
      </article>
    </aside>
  )
}

export default function NebulaCoreCanvas() {
  const [selectedNode, setSelectedNode] = useState(null)
  const [viewMode, setViewMode] = useState('3d')
  const [searchTerm, setSearchTerm] = useState('')
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false,
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = (event) => setReducedMotion(event.matches)
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setSelectedNode(null)
    }

    mediaQuery.addEventListener('change', handleChange)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.cursor = 'default'
    }
  }, [])

  const filteredNodes = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return MEMORY_NODES
    return MEMORY_NODES.filter(
      (node) =>
        node.title.toLowerCase().includes(query) ||
        node.category.toLowerCase().includes(query) ||
        node.tags.some((tag) => tag.toLowerCase().includes(query)),
    )
  }, [searchTerm])

  return (
    <main className="relative h-screen min-h-[580px] overflow-hidden bg-void font-sans text-white selection:bg-ion/20">
      <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-6 sm:pt-5">
        <nav className="glass-nav mx-auto grid min-h-[68px] max-w-[1500px] grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 backdrop-blur-xl sm:grid-cols-[auto_minmax(220px,360px)_auto] sm:px-5" aria-label="主导航">
          <a href="#" className="flex w-fit items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-ion" aria-label="记忆星云首页">
            <span className="grid h-9 w-9 place-items-center border border-ion/25 bg-ion/[0.06] text-ion">
              <Orbit className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </span>
            <span>
              <strong className="block font-display text-sm font-normal text-white sm:text-base">记忆星云</strong>
              <span className="hidden font-mono text-[8px] uppercase tracking-[0.16em] text-mist/25 sm:block">Memory archive · Phase 5</span>
            </span>
          </a>

          <label className="relative order-3 col-span-2 block sm:order-none sm:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mist/35" />
            <span className="sr-only">搜索记忆节点</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="搜索标题、分类或标签"
              className="h-9 w-full border border-white/10 bg-white/[0.035] pl-9 pr-3 text-xs text-white outline-none placeholder:text-mist/25 focus:border-ion/45 focus:bg-black/25"
            />
          </label>

          <div className="flex items-center justify-end gap-2">
            <ViewSwitch viewMode={viewMode} onChange={setViewMode} />
            <button
              type="button"
              className="hidden h-9 items-center gap-2 border border-ion/25 bg-ion/[0.07] px-3 text-[11px] text-mist/70 transition hover:border-ion/50 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ion lg:flex"
            >
              <Plus className="h-3.5 w-3.5 text-ion" />
              添加记忆
            </button>
          </div>
        </nav>
      </header>

      {viewMode === '3d' ? (
        <div className="absolute inset-0">
          <NebulaCanvas
            nodes={filteredNodes}
            selectedNode={selectedNode}
            onSelect={setSelectedNode}
            reducedMotion={reducedMotion}
          />
          <div className="noise pointer-events-none absolute inset-0" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_170px_55px_rgba(0,0,0,0.48)]" aria-hidden="true" />
          <div className="pointer-events-none absolute bottom-5 left-5 border-l border-ion/35 pl-3 sm:bottom-7 sm:left-7">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-mist/30">Visible signals</p>
            <p className="mt-1 font-display text-lg text-mist/75">{filteredNodes.length} 个记忆节点</p>
          </div>
        </div>
      ) : (
        <MemoryList nodes={filteredNodes} onSelect={setSelectedNode} />
      )}

      {selectedNode && <MemoryDetail node={selectedNode} onClose={() => setSelectedNode(null)} />}
    </main>
  )
}

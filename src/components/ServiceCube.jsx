import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Edges, OrbitControls } from '@react-three/drei'

/**
 * Escena 3D Flat Design: poliedro geométrico minimalista en rotación suave,
 * con materiales básicos planos sin sombras ni degradados artificiales.
 * Permite interactuar arrastrando (órbita) e interactúa al posar el cursor.
 */
function ValueCore() {
  const ref = useRef()
  const [hovered, setHovered] = useState(false)

  useFrame((_, dt) => {
    ref.current.rotation.y += dt * 0.35
    ref.current.rotation.x += dt * 0.18
    const target = hovered ? 1.15 : 1
    ref.current.scale.lerp({ x: target, y: target, z: target }, 0.1)
  })

  return (
    <mesh
      ref={ref}
      onPointerOver={() => {
        setHovered(true)
        document.body.style.cursor = 'grab'
      }}
      onPointerOut={() => {
        setHovered(false)
        document.body.style.cursor = 'auto'
      }}
    >
      <icosahedronGeometry args={[1.4, 0]} />
      <meshBasicMaterial color="#000000" />
      <Edges color="#C6FF33" lineWidth={2.5} />
    </mesh>
  )
}

function Satellites() {
  const group = useRef()
  useFrame((_, dt) => (group.current.rotation.z -= dt * 0.25))
  return (
    <group ref={group}>
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 2.5, Math.sin(a) * 2.5, 0]}>
            <boxGeometry args={[0.26, 0.26, 0.26]} />
            <meshBasicMaterial color="#C6FF33" />
          </mesh>
        )
      })}
    </group>
  )
}

export default function ServiceCube() {
  return (
    <div className="scene" id="hero-3d">
      <Canvas
        camera={{ position: [0, 0, 5.8], fov: 45 }}
        dpr={[1, 2]}
        aria-label="Modelo 3D geométrico interactivo"
      >
        <ValueCore />
        <Satellites />
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  )
}

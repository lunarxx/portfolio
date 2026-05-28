'use client'

import { Suspense, useRef, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, OrbitControls, Environment } from '@react-three/drei'
import * as THREE from 'three'

function Model() {
  const { scene } = useGLTF('/whofits/3msforsaas.glb')
  const ref = useRef<THREE.Group>(null)
  const { pointer } = useThree()

  useFrame(() => {
    if (!ref.current) return
    ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, pointer.x * 0.4, 0.05)
    ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, -pointer.y * 0.15, 0.05)
  })

  return <primitive ref={ref} object={scene} scale={1.8} position={[0, -1.2, 0]} />
}

export function WhoFitsModel() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div style={{ width: '100%', height: 400 }} />

  return (
    <div style={{ width: '100%', height: 400, borderRadius: 20, overflow: 'hidden' }}>
      <Canvas camera={{ position: [0, 0.5, 4], fov: 45 }} dpr={[1, 1.5]}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <Model />
          <Environment preset="studio" />
          <OrbitControls enableZoom={false} enablePan={false} />
        </Suspense>
      </Canvas>
    </div>
  )
}

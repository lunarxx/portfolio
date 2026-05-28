'use client'

import { Suspense, useRef, useEffect, useState, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'

const DESIRED_HEIGHT = 1.51
const HEAD_BONE = 'mixamorigHead'
const L_LEG = 'mixamorigLeftLeg'
const R_LEG = 'mixamorigRightLeg'

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }

function Model() {
  const gltf = useGLTF('/whofits/3msforsaas.glb')
  const groupRef = useRef<THREE.Group>(null)
  const sceneRef = useRef<THREE.Group>(null)
  const bonesRef = useRef<Record<string, THREE.Bone>>({})
  const mouseNDC = useRef({ x: 0, y: 0 })
  const { camera } = useThree()
  const [ready, setReady] = useState(false)

  const { actions, names } = useAnimations(gltf.animations, sceneRef)

  const infoRef = useRef<{ scale: number; offsetY: number } | null>(null)
  if (!infoRef.current) {
    gltf.scene.scale.set(1, 1, 1)
    gltf.scene.position.set(0, 0, 0)
    gltf.scene.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(gltf.scene)
    const size = new THREE.Vector3()
    box.getSize(size)
    const s = DESIRED_HEIGHT / (size.y || 1)
    const off = -box.min.y * s
    infoRef.current = { scale: s, offsetY: off }
  }
  const info = infoRef.current
  gltf.scene.scale.set(info.scale, info.scale, info.scale)
  gltf.scene.position.y = info.offsetY

  useEffect(() => {
    const bones: Record<string, THREE.Bone> = {}
    gltf.scene.traverse((obj: THREE.Object3D) => {
      if ((obj as THREE.Bone).isBone) {
        bones[obj.name] = obj as THREE.Bone
      }
      if ('isMesh' in obj || 'isSkinnedMesh' in obj) {
        const mesh = obj as THREE.Mesh
        mesh.frustumCulled = false
        if (mesh.material) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
          mats.forEach((mat) => {
            const m = mat as THREE.MeshStandardMaterial
            if (m.name?.toLowerCase().includes('screen')) {
              m.emissive = new THREE.Color('#d4a574')
              m.emissiveIntensity = 14
            }
          })
        }
      }
    })
    bonesRef.current = bones

    if (names.length > 0) {
      const action = actions[names[0]]
      if (action) {
        action.reset().play()
        action.paused = true
        action.time = 0
        action.getMixer().setTime(0)
        action.getMixer().update(0)
      }
    }

    setReady(true)

    const onMove = (e: PointerEvent) => {
      mouseNDC.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouseNDC.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [gltf.scene, info, actions, names])

  useFrame(() => {
    if (!groupRef.current || !ready) return
    const bones = bonesRef.current

    const head = bones[HEAD_BONE]
    if (head) {
      const hw = new THREE.Vector3()
      head.getWorldPosition(hw)
      const ray = new THREE.Raycaster()
      ray.setFromCamera(new THREE.Vector2(mouseNDC.current.x, mouseNDC.current.y), camera)
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
      const cursor = new THREE.Vector3()
      ray.ray.intersectPlane(plane, cursor)
      if (cursor) {
        const dir = new THREE.Vector3().subVectors(cursor, hw).normalize()
        const pQ = new THREE.Quaternion()
        head.parent!.getWorldQuaternion(pQ)
        const ld = dir.clone().applyQuaternion(pQ.clone().invert())
        const yaw = Math.atan2(ld.x, ld.z)
        const pitch = Math.atan2(-ld.y, Math.sqrt(ld.x ** 2 + ld.z ** 2))
        head.rotation.y = lerp(head.rotation.y, clamp(yaw, -0.6, 0.6), 0.04)
        head.rotation.x = lerp(head.rotation.x, clamp(pitch, -0.35, 0.35), 0.04)
      }
    }

    const lLeg = bones[L_LEG]
    const rLeg = bones[R_LEG]
    if (lLeg && rLeg) {
      const px = mouseNDC.current.x
      lLeg.rotation.z = lerp(lLeg.rotation.z, px > 0 ? px * 0.3 : 0, 0.035)
      rLeg.rotation.z = lerp(rLeg.rotation.z, px < 0 ? px * 0.3 : 0, 0.035)
    }
  })

  return (
    <group ref={groupRef} position={[0, -0.78, 0]}>
      <primitive ref={sceneRef} object={gltf.scene} />
    </group>
  )
}

useGLTF.preload('/whofits/3msforsaas.glb')

export function WhoFitsModel() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div style={{ width: '100%', height: 420 }} />

  return (
    <div style={{ width: '100%', height: 420 }}>
      <Canvas
        camera={{ position: [0, 0.5, 2.6], fov: 36 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0)
        }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={1.2} />
          <directionalLight position={[5, 5, 5]} intensity={1.5} />
          <directionalLight position={[-3, 3, -3]} intensity={0.5} />
          <pointLight position={[0, 2, 2]} intensity={0.8} color="#d4a574" />
          <Model />
        </Suspense>
      </Canvas>
    </div>
  )
}

import { useEffect, useRef, useMemo } from 'react'
import * as THREE from 'three'

interface VehicleData {
  id: string; lat: number; lng: number; bearing: number
  speed: number; type: string; length: number
}

interface EdgeBearing {
  bearing: number; length_m: number; name?: string; lanes?: number
}

interface IntersectionCamera3DProps {
  vehicles: VehicleData[]
  cameraLat: number; cameraLng: number
  edgeStates: Record<string, string>
  edgeBearings: Record<string, EdgeBearing>
  outgoingBearings: Record<string, EdgeBearing>
  mode: string
  phaseIndex: number; totalPhases: number; timeLeft: number
  nodeId: string
}

const VEHICLE_COLORS = {
  car: 0x3b82f6, suv: 0x6366f1, bus: 0xd97706, truck: 0xea580c
}

// Global cache for vehicle procedural models so we don't recreate geometries on every render
const VEHICLE_MESH_CACHE = new Map<string, THREE.Group>()

function getProceduralVehicle(type: string, colorHex: number): THREE.Group {
  const cacheKey = `${type}_${colorHex}`
  if (VEHICLE_MESH_CACHE.has(cacheKey)) {
    return VEHICLE_MESH_CACHE.get(cacheKey)!.clone()
  }

  const group = new THREE.Group()
  const mat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.4, metalness: 0.3 })
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 })
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x050510, metalness: 0.9, roughness: 0.1 })

  if (type === 'bus') {
    const w = 2.8, h = 3.0, l = 11.0
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, l), mat)
    body.position.y = h/2 + 0.5
    group.add(body)
    
    const fw = new THREE.Mesh(new THREE.PlaneGeometry(w*0.9, h*0.6), glassMat)
    fw.position.set(0, h/2 + 0.8, l/2 + 0.02)
    group.add(fw)
    
    const rw = new THREE.Mesh(new THREE.PlaneGeometry(w*0.9, h*0.4), glassMat)
    rw.position.set(0, h/2 + 0.8, -l/2 - 0.02)
    rw.rotation.y = Math.PI
    group.add(rw)

    const sideGlassGeom = new THREE.PlaneGeometry(l*0.8, h*0.4)
    const sw1 = new THREE.Mesh(sideGlassGeom, glassMat)
    sw1.position.set(w/2 + 0.02, h/2 + 0.8, 0)
    sw1.rotation.y = Math.PI/2
    group.add(sw1)
    const sw2 = new THREE.Mesh(sideGlassGeom, glassMat)
    sw2.position.set(-w/2 - 0.02, h/2 + 0.8, 0)
    sw2.rotation.y = -Math.PI/2
    group.add(sw2)

    const tireGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16)
    tireGeom.rotateZ(Math.PI / 2)
    const wheelPos = [
      [w/2, 0.5, l*0.3], [-w/2, 0.5, l*0.3], 
      [w/2, 0.5, -l*0.3], [-w/2, 0.5, -l*0.3] 
    ]
    wheelPos.forEach(p => {
      const t = new THREE.Mesh(tireGeom, blackMat)
      t.position.set(p[0], p[1], p[2])
      group.add(t)
    })
  } else if (type === 'truck') {
    const w = 2.6, h = 3.2, l = 9.0
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(w, h*0.85, 2.5), mat)
    cabin.position.set(0, h*0.425 + 0.5, l/2 - 1.25)
    group.add(cabin)
    
    const tMat = new THREE.MeshStandardMaterial({ color: 0xdddddd }) 
    const trailer = new THREE.Mesh(new THREE.BoxGeometry(w, h, l - 3.0), tMat)
    trailer.position.set(0, h/2 + 0.6, -1.5)
    group.add(trailer)

    const tireGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16)
    tireGeom.rotateZ(Math.PI / 2)
    const wheelPos = [
      [w/2, 0.5, l/2 - 1.2], [-w/2, 0.5, l/2 - 1.2], 
      [w/2, 0.5, -1.0], [-w/2, 0.5, -1.0],
      [w/2, 0.5, -3.0], [-w/2, 0.5, -3.0]
    ]
    wheelPos.forEach(p => {
      const t = new THREE.Mesh(tireGeom, blackMat)
      t.position.set(p[0], p[1], p[2])
      group.add(t)
    })
  } else {
    const isSuv = type === 'suv'
    const w = isSuv ? 2.0 : 1.8, h = isSuv ? 0.9 : 0.7, l = isSuv ? 4.8 : 4.2
    
    const bodyGeom = new THREE.BoxGeometry(w, h, l)
    const body = new THREE.Mesh(bodyGeom, mat)
    body.position.y = h/2 + 0.3
    group.add(body)
    
    const cabinGeom = new THREE.BoxGeometry(w * 0.85, h * 0.8, l * 0.5)
    const cabin = new THREE.Mesh(cabinGeom, mat)
    cabin.position.set(0, h + 0.3 + (h*0.4), -0.2)
    group.add(cabin)

    const fw = new THREE.Mesh(new THREE.PlaneGeometry(w*0.8, h*0.8), glassMat)
    fw.position.set(0, cabin.position.y, cabin.position.z + (l*0.25) + 0.01)
    fw.rotation.x = -0.3
    group.add(fw)

    const rw = new THREE.Mesh(new THREE.PlaneGeometry(w*0.8, h*0.8), glassMat)
    rw.position.set(0, cabin.position.y, cabin.position.z - (l*0.25) - 0.01)
    rw.rotation.x = Math.PI + 0.3
    group.add(rw)

    const tireGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 16)
    tireGeom.rotateZ(Math.PI / 2)
    const wheelPos = [
      [w/2, 0.35, l*0.3], [-w/2, 0.35, l*0.3], 
      [w/2, 0.35, -l*0.3], [-w/2, 0.35, -l*0.3] 
    ]
    wheelPos.forEach(p => {
      const t = new THREE.Mesh(tireGeom, blackMat)
      t.position.set(p[0], p[1], p[2])
      group.add(t)
    })
  }
  
  // Expose these materials by name so we can override emissive later based on speed
  const hlMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffee, emissiveIntensity: 1.0 })
  const tlMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.5 })
  
  const getDims = () => {
    if (type === 'bus') return {w:2.8, h:3.0, l:11.0}
    if (type === 'truck') return {w:2.6, h:3.2, l:9.0}
    return type === 'suv' ? {w:2.0, h:0.9, l:4.8} : {w:1.8, h:0.7, l:4.2}
  }
  const dims = getDims()
  
  const frontPlane = new THREE.Mesh(new THREE.PlaneGeometry(dims.w*0.3, 0.2), hlMat)
  frontPlane.position.set(dims.w*0.35, dims.h*0.6, dims.l/2 + 0.01)
  frontPlane.name = "headlight"
  group.add(frontPlane)
  const fp2 = frontPlane.clone(); fp2.position.x = -dims.w*0.35; fp2.name = "headlight"; group.add(fp2)

  const backPlane = new THREE.Mesh(new THREE.PlaneGeometry(dims.w*0.3, 0.2), tlMat)
  backPlane.position.set(dims.w*0.35, dims.h*0.6, -dims.l/2 - 0.01)
  backPlane.rotation.y = Math.PI
  backPlane.name = "taillight"
  group.add(backPlane)
  const bp2 = backPlane.clone(); bp2.position.x = -dims.w*0.35; bp2.name = "taillight"; group.add(bp2)
  
  group.traverse(child => {
    if ((child as THREE.Mesh).isMesh) {
      child.castShadow = true; child.receiveShadow = true
    }
  })
  
  VEHICLE_MESH_CACHE.set(cacheKey, group)
  return group.clone()
}

// Maps lat/lng to roughly meters relative to the intersection center
function latlngToMeters(dlat: number, dlng: number, refLat: number) {
  const mPerLat = 111320
  const mPerLng = 111320 * Math.cos((refLat * Math.PI) / 180)
  return { x: dlng * mPerLng, z: -dlat * mPerLat } // -Z is Geographic North in our 3D space
}

function getGeoVector(angleDeg: number) {
  const rad = angleDeg * Math.PI / 180
  return { x: Math.sin(rad), z: -Math.cos(rad) }
}

export default function IntersectionCamera3D({
  vehicles, cameraLat, cameraLng, edgeStates, mode,
  edgeBearings, outgoingBearings,
  phaseIndex, totalPhases, timeLeft, nodeId
}: IntersectionCamera3DProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  
  const sceneRef = useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    vehicleMeshes: Map<string, THREE.Group>
    trafficLightGlows: Map<string, { r: THREE.Material, y: THREE.Material, g: THREE.Material }>
    animationId: number
  } | null>(null)

  const nearbyVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const dlat = Math.abs(v.lat - cameraLat)
      const dlng = Math.abs(v.lng - cameraLng)
      return dlat < 0.0015 && dlng < 0.002 // within ~150-200m
    })
  }, [vehicles, cameraLat, cameraLng])

  useEffect(() => {
    if (!mountRef.current) return
    const container = mountRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a2e)
    scene.fog = new THREE.FogExp2(0x1a1a2e, 0.006)

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 500)
    // Dynamic camera height based on intersection complexity, but generally CCTV style.
    camera.position.set(-15, 35, 25)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(renderer.domElement)

    // Lighting
    scene.add(new THREE.AmbientLight(0x404060, 0.8))
    const dirLight = new THREE.DirectionalLight(0xffeedd, 1.2)
    dirLight.position.set(50, 80, 20)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.width = 1024
    dirLight.shadow.mapSize.height = 1024
    dirLight.shadow.camera.near = 1
    dirLight.shadow.camera.far = 200
    dirLight.shadow.camera.left = -80
    dirLight.shadow.camera.right = 80
    dirLight.shadow.camera.top = 80
    dirLight.shadow.camera.bottom = -80
    scene.add(dirLight)
    
    // Intersection core
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x22222a, roughness: 0.9 })
    const baseGround = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), groundMat)
    baseGround.rotation.x = -Math.PI / 2
    baseGround.position.y = -0.1
    baseGround.receiveShadow = true
    scene.add(baseGround)

    const roadMat = new THREE.MeshStandardMaterial({ color: 0x33333d, roughness: 0.8 })
    
    // Central junction rounding
    const centerGeom = new THREE.CylinderGeometry(15, 15, 0.1, 32)
    const centerMesh = new THREE.Mesh(centerGeom, roadMat)
    centerMesh.position.y = -0.05
    scene.add(centerMesh)

    const trafficLightGlows = new Map()

    function drawRoadSegment(angleDeg: number, length: number) {
      const roadW = 12 // Sufficient for Multi-lane
      const geom = new THREE.PlaneGeometry(roadW, length)
      geom.translate(0, length / 2, 0)
      geom.rotateX(-Math.PI / 2)
      geom.rotateY(-angleDeg * Math.PI / 180)
      
      const mesh = new THREE.Mesh(geom, roadMat)
      mesh.position.y = 0.01
      mesh.receiveShadow = true
      scene.add(mesh)
    }

    function createTrafficLightPole(x: number, z: number, angleDeg: number, eid: string) {
      const rotY = -angleDeg * Math.PI / 180
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 8, 8), new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8 }))
      pole.position.set(x, 4, z)
      pole.castShadow = true
      scene.add(pole)

      const housing = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.4, 0.6), new THREE.MeshStandardMaterial({ color: 0x111111 }))
      housing.position.set(x, 7.5, z)
      housing.rotation.y = rotY
      scene.add(housing)

      const createBulb = (y: number, hex: number) => {
        const mat = new THREE.MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: 0.2 })
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), mat)
        bulb.position.set(x, y, z + Math.cos(rotY) * 0.35)
        scene.add(bulb)
        return mat
      }
      const rMat = createBulb(8.3, 0x550000)
      const yMat = createBulb(7.5, 0x554400)
      const gMat = createBulb(6.7, 0x005500)

      trafficLightGlows.set(eid, { r: rMat, y: yMat, g: gMat })
    }

    // Process Incoming Edges -> they extend AWAY from center at angle (bearing - 180)
    Object.entries(edgeBearings).forEach(([eid, eb]) => {
      const roadAngle = eb.bearing - 180
      drawRoadSegment(roadAngle, 120)
      
      // Place traffic light for this specific road
      const dir = getGeoVector(roadAngle)
      const right = getGeoVector(roadAngle + 90) // Right side of road when looking TO the center
      const tx = dir.x * 12 + right.x * 7
      const tz = dir.z * 12 + right.z * 7
      
      createTrafficLightPole(tx, tz, roadAngle, eid)
    })

    // Process Outgoing Edges -> they extend from center at angle (bearing)
    Object.values(outgoingBearings).forEach(ob => {
      drawRoadSegment(ob.bearing, 120)
    })

    const vehicleMeshes = new Map()

    sceneRef.current = {
      scene, camera, renderer, vehicleMeshes, trafficLightGlows, animationId: 0
    }

    let pX = camera.position.x, pZ = camera.position.z
    function animate() {
      if (!sceneRef.current) return
      sceneRef.current.animationId = requestAnimationFrame(animate)
      
      // Dynamic subtle camera hover
      const t = Date.now() * 0.0002
      camera.position.x = pX + Math.sin(t) * 3
      camera.position.y = 35 + Math.cos(t) * 1.5
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      if (sceneRef.current) cancelAnimationFrame(sceneRef.current.animationId)
      renderer.dispose()
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
  }, [cameraLat, cameraLng, edgeBearings, outgoingBearings]) // Rebuild if coordinates or road topology changes completely

  // Update Vehicles
  useEffect(() => {
    if (!sceneRef.current) return
    const { scene, vehicleMeshes } = sceneRef.current

    const activeIds = new Set(nearbyVehicles.map(v => v.id))

    vehicleMeshes.forEach((mesh, id) => {
      if (!activeIds.has(id)) {
        scene.remove(mesh)
        vehicleMeshes.delete(id)
      }
    })

    nearbyVehicles.forEach(v => {
      const pos = latlngToMeters(v.lat - cameraLat, v.lng - cameraLng, cameraLat)
      // ThreeJS Rotation: 0 means front (+Z) points to +Z.
      // Geographic Bearing 0 means vehicle travels towards North (-Z).
      // If +Z faces -Z, we rotate by PI.
      const targetRotY = -(v.bearing * Math.PI) / 180 + Math.PI

      let mesh = vehicleMeshes.get(v.id)
      if (!mesh) {
        const vColor = VEHICLE_COLORS[v.type as keyof typeof VEHICLE_COLORS] || VEHICLE_COLORS.car
        mesh = getProceduralVehicle(v.type, vColor)
        mesh.position.set(pos.x, 0, pos.z)
        mesh.rotation.y = targetRotY
        scene.add(mesh)
        vehicleMeshes.set(v.id, mesh)
      } else {
        // Smooth interpolation
        mesh.position.x += (pos.x - mesh.position.x) * 0.4
        mesh.position.z += (pos.z - mesh.position.z) * 0.4
        // Angle lerping handles wrapping correctly (basic diff check)
        let diff = targetRotY - mesh.rotation.y
        while (diff < -Math.PI) diff += Math.PI * 2
        while (diff > Math.PI) diff -= Math.PI * 2
        mesh.rotation.y += diff * 0.4
      }

      // Brake lights / dynamic effects
      const speedKmh = v.speed * 3.6
      mesh.traverse((m: any) => {
        if (m.name === 'taillight' && m.material) {
          m.material.emissiveIntensity = speedKmh < 3 ? 3.0 : 0.5
        }
      })
    })
  }, [nearbyVehicles, cameraLat, cameraLng])

  // Update specific traffic light states
  useEffect(() => {
    if (!sceneRef.current) return
    const { trafficLightGlows } = sceneRef.current

    trafficLightGlows.forEach(({ r, y, g }, eid) => {
      const state = edgeStates[eid] || 'Red'
      
      // Dim all 
      ;(r as THREE.MeshStandardMaterial).color.setHex(0x550000)
      ;(r as THREE.MeshStandardMaterial).emissiveIntensity = 0.2
      ;(y as THREE.MeshStandardMaterial).color.setHex(0x554400)
      ;(y as THREE.MeshStandardMaterial).emissiveIntensity = 0.2
      ;(g as THREE.MeshStandardMaterial).color.setHex(0x005500)
      ;(g as THREE.MeshStandardMaterial).emissiveIntensity = 0.2

      // Brighten active
      if (mode === 'flash_yellow') {
        const flash = (Date.now() % 1000) > 500
        if (flash) {
          ;(y as THREE.MeshStandardMaterial).color.setHex(0xffff00)
          ;(y as THREE.MeshStandardMaterial).emissiveIntensity = 4.0
        }
      } else {
        if (state === 'Green') {
          ;(g as THREE.MeshStandardMaterial).color.setHex(0x00ff00)
          ;(g as THREE.MeshStandardMaterial).emissiveIntensity = 4.0
        } else if (state === 'Yellow') {
          ;(y as THREE.MeshStandardMaterial).color.setHex(0xffaa00)
          ;(y as THREE.MeshStandardMaterial).emissiveIntensity = 4.0
        } else {
          ;(r as THREE.MeshStandardMaterial).color.setHex(0xff0000)
          ;(r as THREE.MeshStandardMaterial).emissiveIntensity = 4.0
        }
      }
    })
  }, [edgeStates, mode])

  return (
    <div className="flex flex-col h-full bg-[#12121f]">
      {/* 3D Viewport container */}
      <div ref={mountRef} className="flex-1 rounded-t-lg overflow-hidden border-b border-slate-700/50" />

      {/* Info HUD */}
      <div className="bg-[#1a1a2e] px-5 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">FAZA</span>
            <span className="text-white font-bold bg-white/10 px-2 py-0.5 rounded">{phaseIndex + 1}/{totalPhases}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">QALAN VAXT</span>
            <span className="text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded">{timeLeft}s</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-xs">
          <span className="text-slate-400">
            Kamera Rəsmiləşdirməsi: <span className="text-sky-400 font-medium ml-1">Real-Vaxt Nöqtəvi</span>
          </span>
          <span className="bg-sky-500/20 text-sky-400 px-3 py-1 rounded-full font-bold">
            {nearbyVehicles.length} MAŞIN
          </span>
        </div>
      </div>
    </div>
  )
}

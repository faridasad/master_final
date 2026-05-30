import { useEffect, useRef, useMemo } from 'react'
import * as THREE from 'three'

interface VehicleData {
  id: string
  lane: string      // edge ID — used to snap vehicle to the correct 3D road
  position: number  // meters from u-node along the edge
  speed: number; type: string; length: number
  lat: number; lng: number; bearing: number  // kept for rotation only
}
interface EdgeBearing {
  bearing: number; length_m: number; name?: string; lanes?: number
}
interface Props {
  vehicles: VehicleData[]
  cameraLat: number; cameraLng: number
  edgeStates: Record<string, string>
  edgeBearings: Record<string, EdgeBearing>
  outgoingBearings: Record<string, EdgeBearing>
  mode: string
  phaseIndex: number; totalPhases: number; timeLeft: number
  nodeId: string
}

// Geographic bearing → Three.js XZ direction vector
// 0° = North = -Z  |  90° = East = +X  |  180° = South = +Z  |  270° = West = -X
function bDir(deg: number): THREE.Vector3 {
  const r = (deg * Math.PI) / 180
  return new THREE.Vector3(Math.sin(r), 0, -Math.cos(r))
}

// Low-poly vehicle — front of vehicle faces local +Z
function makeVehicle(type: string): THREE.Group {
  const COLORS: Record<string, number> = {
    car: 0x3b82f6, suv: 0x8b5cf6, bus: 0xf59e0b, truck: 0xef4444,
  }
  const g = new THREE.Group()
  const col = COLORS[type] ?? 0x6b7280
  const mat = new THREE.MeshLambertMaterial({ color: col })

  if (type === 'bus') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.6, 10), mat)
    body.position.y = 1.6; g.add(body)
  } else if (type === 'truck') {
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.8, 2.5), mat)
    cab.position.set(0, 1.7, 3.25); g.add(cab)
    const tr = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.4, 5.5),
      new THREE.MeshLambertMaterial({ color: 0xd1d5db }))
    tr.position.set(0, 1.5, -2.25); g.add(tr)
  } else if (type === 'suv') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.1, 4.5), mat)
    body.position.y = 0.85; g.add(body)
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 2.4), mat)
    top.position.set(0, 1.8, -0.3); g.add(top)
  } else {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.85, 4.0), mat)
    body.position.y = 0.725; g.add(body)
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.65, 2.0), mat)
    top.position.set(0, 1.5, -0.15); g.add(top)
  }

  // Tail-light strip at back (-Z face)
  const halfZ = type === 'bus' ? 5 : type === 'truck' ? 8 / 2 : type === 'suv' ? 2.25 : 2.0
  const tlMat = new THREE.MeshBasicMaterial({ color: 0xff2200 })
  const tl = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.18), tlMat)
  tl.position.set(0, 0.9, -(halfZ + 0.01))
  tl.rotation.y = Math.PI
  tl.name = 'taillight'
  g.add(tl)

  g.traverse(c => { if ((c as THREE.Mesh).isMesh) { c.castShadow = true; c.receiveShadow = true } })
  return g
}

interface Signal {
  r: THREE.MeshStandardMaterial
  y: THREE.MeshStandardMaterial
  g: THREE.MeshStandardMaterial
  pLight: THREE.PointLight
}

export default function IntersectionCamera3D({
  vehicles, cameraLat, cameraLng,
  edgeStates, edgeBearings, outgoingBearings,
  mode, phaseIndex, totalPhases, timeLeft,
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null)

  // Refs so animation loop reads latest values without re-triggering scene rebuild
  const modeRef = useRef(mode)
  const edgeStatesRef = useRef(edgeStates)
  useEffect(() => { modeRef.current = mode }, [mode])
  useEffect(() => { edgeStatesRef.current = edgeStates }, [edgeStates])

  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    animId: number
    vehicles: Map<string, THREE.Group>
    signals: Map<string, Signal>
  } | null>(null)

  // Only show vehicles whose lane is an edge connected to THIS intersection
  const nearby = useMemo(() =>
    vehicles.filter(v => v.lane in edgeBearings || v.lane in outgoingBearings),
    [vehicles, edgeBearings, outgoingBearings]
  )

  // ── Scene init ────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = mountRef.current
    if (!el) return
    const W = el.clientWidth, H = el.clientHeight

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1e293b)
    scene.fog = new THREE.Fog(0x1e293b, 130, 270)

    // CCTV camera: elevated, angled down at intersection
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 500)
    camera.position.set(0, 45, 38)
    camera.lookAt(0, 0, 0)

    // Lighting — low-poly game style
    scene.add(new THREE.AmbientLight(0xffffff, 2.4))
    const sun = new THREE.DirectionalLight(0xfff8e7, 2.2)
    sun.position.set(40, 70, 40)
    sun.castShadow = true
    sun.shadow.mapSize.setScalar(2048)
    sun.shadow.camera.left = -100; sun.shadow.camera.right = 100
    sun.shadow.camera.top = 100; sun.shadow.camera.bottom = -100
    sun.shadow.camera.far = 250
    scene.add(sun)
    const fill = new THREE.DirectionalLight(0x90b8ff, 0.5)
    fill.position.set(-30, 30, -30)
    scene.add(fill)

    // Ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      new THREE.MeshLambertMaterial({ color: 0x1a2535 })
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    const ROAD_W = 12   // road width (m)
    const ROAD_LEN = 85 // road length from center (m)
    const PAD_R = 9     // central junction pad radius (m)

    const roadMat = new THREE.MeshLambertMaterial({ color: 0x4b5563 })
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    const yellowMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, side: THREE.DoubleSide })

    // Central junction pad
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(PAD_R, PAD_R, 0.08, 32), roadMat)
    pad.position.y = 0.01; pad.receiveShadow = true
    scene.add(pad)

    // Build a road segment extending from center in direction `fromCenterBearing`
    function addRoad(fromCenterBearing: number) {
      const dir = bDir(fromCenterBearing)
      // group: local +Z aligns with dir, centered at midpoint of road
      const groupRotY = Math.atan2(dir.x, dir.z)
      const centerDist = PAD_R + ROAD_LEN / 2  // center of road from intersection

      const grp = new THREE.Group()
      grp.rotation.y = groupRotY
      grp.position.set(dir.x * centerDist, 0, dir.z * centerDist)

      // Surface
      const surf = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W, ROAD_LEN), roadMat)
      surf.rotation.x = -Math.PI / 2; surf.receiveShadow = true
      grp.add(surf)

      // Dashed center line (local Z: -ROAD_LEN/2 = near intersection, +ROAD_LEN/2 = far)
      const SL = 3.0, SG = 2.5 // stripe length, gap
      for (let z = -ROAD_LEN / 2 + 2; z < ROAD_LEN / 2 - SL; z += SL + SG) {
        const s = new THREE.Mesh(new THREE.PlaneGeometry(0.2, SL), yellowMat)
        s.rotation.x = -Math.PI / 2; s.position.set(0, 0.02, z + SL / 2)
        grp.add(s)
      }

      // Stop line near intersection end (local z ≈ -ROAD_LEN/2 + 2)
      const stop = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W - 1, 0.6), whiteMat)
      stop.rotation.x = -Math.PI / 2; stop.position.set(0, 0.02, -ROAD_LEN / 2 + 2)
      grp.add(stop)

      // Lane edge lines
      for (const side of [-1, 1]) {
        const edge = new THREE.Mesh(new THREE.PlaneGeometry(0.15, ROAD_LEN), whiteMat)
        edge.rotation.x = -Math.PI / 2; edge.position.set(side * (ROAD_W / 2 - 0.2), 0.02, 0)
        grp.add(edge)
      }

      scene.add(grp)
    }

    // Build traffic light for an incoming edge
    const signals = new Map<string, Signal>()

    function addTrafficLight(incomingBearing: number, eid: string) {
      // Direction road extends from center (toward where traffic comes from)
      const along = bDir(incomingBearing + 180)
      // Right side of driver approaching at incomingBearing
      const right = bDir(incomingBearing + 90)

      const dist = 13, offset = 6.5
      const px = along.x * dist + right.x * offset
      const pz = along.z * dist + right.z * offset

      // Pole
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.15, 7, 8),
        new THREE.MeshLambertMaterial({ color: 0x6b7280 })
      )
      pole.position.set(px, 3.5, pz); pole.castShadow = true
      scene.add(pole)

      // Housing — faces the approaching driver (faceDir = along = toward where traffic comes from)
      const faceDir = along
      const hRotY = Math.atan2(faceDir.x, faceDir.z)
      const housing = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 2.1, 0.45),
        new THREE.MeshLambertMaterial({ color: 0x111827 })
      )
      housing.position.set(px, 7.0, pz)
      housing.rotation.y = hRotY
      housing.castShadow = true
      scene.add(housing)

      // Point light (active signal glow)
      const pLight = new THREE.PointLight(0xff0000, 0, 18)
      pLight.position.set(px + faceDir.x * 0.8, 7.0, pz + faceDir.z * 0.8)
      scene.add(pLight)

      // Bulbs offset from housing face
      const bx = px + faceDir.x * 0.28
      const bz = pz + faceDir.z * 0.28

      function makeBulb(y: number, hex: number): THREE.MeshStandardMaterial {
        const mat = new THREE.MeshStandardMaterial({
          color: hex, emissive: hex, emissiveIntensity: 0.1,
          roughness: 0.3, metalness: 0.05,
        })
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.21, 10, 10), mat)
        b.position.set(bx, y, bz)
        scene.add(b)
        return mat
      }

      const r = makeBulb(7.9, 0x3b0000)
      const y = makeBulb(7.2, 0x3b2800)
      const gm = makeBulb(6.5, 0x003b00)
      signals.set(eid, { r, y, g: gm, pLight })
    }

    // Build roads + lights from edge data
    Object.entries(edgeBearings).forEach(([eid, eb]) => {
      addRoad(eb.bearing + 180)      // road extends toward where traffic comes from
      addTrafficLight(eb.bearing, eid)
    })
    Object.values(outgoingBearings).forEach(ob => {
      addRoad(ob.bearing)            // road extends in outgoing direction
    })

    const vehicleMeshes = new Map<string, THREE.Group>()

    sceneRef.current = {
      renderer, scene, camera, animId: 0,
      vehicles: vehicleMeshes, signals,
    }

    // Animation loop — also handles signal updates (so flash_yellow actually flashes)
    let animId = 0
    function animate() {
      animId = requestAnimationFrame(animate)
      if (!sceneRef.current) return

      // Subtle CCTV hover
      const t = Date.now() * 0.00012
      camera.position.x = Math.sin(t) * 3.5
      camera.position.y = 45
      camera.position.z = 38 + Math.cos(t * 0.6) * 2
      camera.lookAt(0, 0, 0)

      // Signal update every frame (enables real flash)
      const flash = (Date.now() % 900) > 450
      const curMode = modeRef.current
      const curStates = edgeStatesRef.current

      signals.forEach(({ r, y, g, pLight }, eid) => {
        r.color.setHex(0x3b0000); r.emissiveIntensity = 0.08
        y.color.setHex(0x3b2800); y.emissiveIntensity = 0.08
        g.color.setHex(0x003b00); g.emissiveIntensity = 0.08

        if (curMode === 'flash_yellow') {
          if (flash) {
            y.color.setHex(0xfbbf24); y.emissiveIntensity = 6
            pLight.color.setHex(0xfbbf24); pLight.intensity = 25
          } else {
            pLight.intensity = 0
          }
        } else {
          const state = curStates[eid] ?? 'Red'
          if (state === 'Green') {
            g.color.setHex(0x22c55e); g.emissiveIntensity = 6
            pLight.color.setHex(0x22c55e); pLight.intensity = 22
          } else if (state === 'Yellow') {
            y.color.setHex(0xfbbf24); y.emissiveIntensity = 6
            pLight.color.setHex(0xfbbf24); pLight.intensity = 22
          } else {
            r.color.setHex(0xef4444); r.emissiveIntensity = 6
            pLight.color.setHex(0xef4444); pLight.intensity = 22
          }
        }
      })

      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      camera.aspect = el.clientWidth / el.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(el.clientWidth, el.clientHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
      sceneRef.current = null
    }
  }, [cameraLat, cameraLng, edgeBearings, outgoingBearings])

  // ── Vehicle updates ───────────────────────────────────────────────────────
  useEffect(() => {
    const s = sceneRef.current
    if (!s) return
    const { scene, vehicles: meshMap } = s

    const activeIds = new Set(nearby.map(v => v.id))
    meshMap.forEach((mesh, id) => {
      if (!activeIds.has(id)) { scene.remove(mesh); meshMap.delete(id) }
    })

    nearby.forEach(v => {
      // ── Compute world position from edge lane + position ──────────────────
      // This snaps vehicles exactly onto the drawn 3D roads.
      // Incoming edge: u=far node → v=intersection. Vehicle travels at eb.bearing.
      //   distFromIntersection = length_m - v.position
      //   worldPos = bDir(eb.bearing + 180) * distFromIntersection
      // Outgoing edge: u=intersection → v=far node. Vehicle travels at ob.bearing.
      //   worldPos = bDir(ob.bearing) * v.position
      const eb = edgeBearings[v.lane]
      const ob = outgoingBearings[v.lane]
      let p: THREE.Vector3
      let travelBearing: number
      if (eb) {
        travelBearing = eb.bearing
        const distFromCenter = Math.max(0, eb.length_m - v.position)
        p = bDir(eb.bearing + 180).multiplyScalar(distFromCenter)
      } else if (ob) {
        travelBearing = ob.bearing
        p = bDir(ob.bearing).multiplyScalar(v.position)
      } else {
        return
      }
      // Offset vehicle to right lane (2.5m right of road center for right-hand traffic)
      const rightOffset = bDir(travelBearing + 90).multiplyScalar(2.5)
      p.add(rightOffset)

      const targetRotY = Math.PI - (travelBearing * Math.PI) / 180

      let mesh = meshMap.get(v.id)
      if (!mesh) {
        mesh = makeVehicle(v.type)
        mesh.position.set(p.x, 0, p.z)
        mesh.rotation.y = targetRotY
        scene.add(mesh)
        meshMap.set(v.id, mesh)
      } else {
        mesh.position.x += (p.x - mesh.position.x) * 0.35
        mesh.position.z += (p.z - mesh.position.z) * 0.35
        let diff = targetRotY - mesh.rotation.y
        while (diff > Math.PI) diff -= Math.PI * 2
        while (diff < -Math.PI) diff += Math.PI * 2
        mesh.rotation.y += diff * 0.35
      }

      const kmh = v.speed * 3.6
      mesh.traverse((c: any) => {
        if (c.name === 'taillight' && c.material)
          (c.material as THREE.MeshBasicMaterial).color.setHex(kmh < 3 ? 0xff2200 : 0x550000)
      })
    })
  }, [nearby, edgeBearings, outgoingBearings])

  return (
    <div className="flex flex-col h-full bg-[#12121f]">
      <div ref={mountRef} className="flex-1 overflow-hidden border-b border-slate-700/50" />
      <div className="bg-[#1a1a2e] px-5 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">FAZA</span>
            <span className="text-white font-bold bg-white/10 px-2 py-0.5 rounded">
              {phaseIndex + 1}/{totalPhases}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">QALAN VAXT</span>
            <span className="text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded">
              {timeLeft}s
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-500">Real-Vaxt 3D</span>
          <span className="bg-sky-500/20 text-sky-400 px-3 py-1 rounded-full font-bold">
            {nearby.length} MAŞIN
          </span>
        </div>
      </div>
    </div>
  )
}

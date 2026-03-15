import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Radio, Cpu, Car, Gauge, BarChart3 } from 'lucide-react'

interface VehicleData {
  id: string; lane: string; position: number; speed: number; acceleration: number
  lat: number; lng: number; bearing: number
}

interface SimulationState {
  center: { lat: number; lng: number }
  vehicles: VehicleData[]
  status: string
  active_count: number
  total_edges: number
  total_nodes: number
}

// Persistent marker manager - no flickering
function VehicleLayer({ vehicles }: { vehicles: VehicleData[] }) {
  const map = useMap()
  const markersRef = useRef<Map<string, L.Marker>>(new Map())

  useEffect(() => {
    const currentMarkers = markersRef.current
    const activeIds = new Set(vehicles.map(v => v.id))

    // 1. Remove markers for vehicles that no longer exist
    currentMarkers.forEach((marker, id) => {
      if (!activeIds.has(id)) {
        map.removeLayer(marker)
        currentMarkers.delete(id)
      }
    })

    // 2. Update existing markers OR create new ones
    vehicles.forEach(v => {
      const speedKmh = v.speed * 3.6
      const isBraking = v.acceleration < -0.5

      // Color based on speed
      let color = '#00f0ff'
      if (speedKmh < 5) color = '#ff003c'
      else if (speedKmh < 20) color = '#fbbf24'
      else if (speedKmh > 45) color = '#39ff14'

      const existingMarker = currentMarkers.get(v.id)

      if (existingMarker) {
        // UPDATE position smoothly (no destroy/recreate)
        existingMarker.setLatLng([v.lat, v.lng])

        // Update icon HTML for color/rotation changes
        const iconEl = (existingMarker as any)._icon
        if (iconEl) {
          const inner = iconEl.querySelector('.car-body') as HTMLElement
          if (inner) {
            inner.style.background = color
            inner.style.boxShadow = `0 0 8px ${color}, 0 0 16px ${color}50`
            inner.style.transform = `rotate(${-v.bearing + 90}deg)`
          }
          const brake = iconEl.querySelector('.car-brake') as HTMLElement
          if (brake) {
            brake.style.background = isBraking ? '#ff003c' : '#fef08a'
            brake.style.boxShadow = `0 0 4px ${isBraking ? '#ff003c' : '#fef08a'}`
          }
        }
      } else {
        // CREATE new marker
        const carIcon = L.divIcon({
          className: 'vehicle-marker',
          html: `<div class="car-body" style="
            width: 14px; height: 8px;
            background: ${color};
            border-radius: 2px;
            transform: rotate(${-v.bearing + 90}deg);
            box-shadow: 0 0 8px ${color}, 0 0 16px ${color}50;
            border: 0.5px solid rgba(255,255,255,0.3);
            position: relative;
            transition: transform 0.1s linear;
          ">
            <div class="car-brake" style="
              position: absolute; right: -2px; top: 0; bottom: 0; width: 2px;
              background: ${isBraking ? '#ff003c' : '#fef08a'};
              border-radius: 0 1px 1px 0;
              box-shadow: 0 0 4px ${isBraking ? '#ff003c' : '#fef08a'};
            "></div>
          </div>`,
          iconSize: [14, 8],
          iconAnchor: [7, 4]
        })

        const marker = L.marker([v.lat, v.lng], {
          icon: carIcon,
          interactive: true
        })

        marker.bindTooltip(
          `🚗 ${v.id}<br/>Speed: ${speedKmh.toFixed(0)} km/h`,
          { direction: 'top', offset: [0, -10], className: 'vehicle-tooltip' }
        )
        marker.addTo(map)
        currentMarkers.set(v.id, marker)
      }
    })
  }, [vehicles, map])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => marker.remove())
      markersRef.current.clear()
    }
  }, [])

  return null
}

function App() {
  const [wsStatus, setWsStatus] = useState('Disconnected')
  const [simState, setSimState] = useState<SimulationState>({
    center: { lat: 40.4000, lng: 49.8525 },
    vehicles: [], status: 'Stopped', active_count: 0, total_edges: 0, total_nodes: 0
  })

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws')
    ws.onopen = () => setWsStatus('Connected')
    ws.onmessage = (event) => {
      try { setSimState(JSON.parse(event.data)) } catch (e) { console.error(e) }
    }
    ws.onclose = () => setWsStatus('Disconnected')
    return () => ws.close()
  }, [])

  const avgSpeedKmh = simState.vehicles.length > 0
    ? (simState.vehicles.reduce((a, v) => a + v.speed, 0) / simState.vehicles.length * 3.6).toFixed(1)
    : '0.0'
  
  const maxSpeed = simState.vehicles.length > 0
    ? (Math.max(...simState.vehicles.map(v => v.speed)) * 3.6).toFixed(1)
    : '0.0'

  return (
    <div className="h-screen bg-[var(--color-dark-bg)] text-slate-200 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-[var(--color-dark-border)] shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-900/30 rounded-lg neon-border-blue">
            <Cpu className="w-5 h-5 text-[var(--color-brand-neon)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-glow">
              Digital Twin <span className="text-[var(--color-brand-neon)] font-light">Simulation</span>
            </h1>
            <p className="text-xs text-slate-500">Bakı, Gənclik — Real-Time IDM Traffic Model</p>
          </div>
        </div>
        <div className="flex items-center gap-2 glass-panel px-4 py-2 rounded-full text-sm">
          <Radio className={`w-3 h-3 ${wsStatus === 'Connected' ? 'text-[var(--color-success-neon)] animate-pulse' : 'text-[var(--color-danger-neon)]'}`} />
          <span className="opacity-90 text-xs">{wsStatus}</span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer
            center={[simState.center.lat, simState.center.lng]}
            zoom={16}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <VehicleLayer vehicles={simState.vehicles} />
          </MapContainer>

          {/* Floating info */}
          <div className="absolute bottom-4 left-4 z-[1000] glass-panel px-4 py-2 rounded-lg text-xs text-slate-300 flex items-center gap-4">
            <span>🗺️ <strong>{simState.total_nodes}</strong> nodes, <strong>{simState.total_edges}</strong> roads</span>
            <span className="text-slate-600">|</span>
            <span>⚙️ <strong className="text-[var(--color-brand-neon)]">{simState.status}</strong></span>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-72 shrink-0 glass-panel border-l border-[var(--color-dark-border)] p-5 flex flex-col gap-4 overflow-y-auto">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 border-b border-[var(--color-dark-border)] pb-2">
            Live Analytics
          </h2>

          <div className="bg-[#0f172a]/60 p-4 rounded-lg border border-[var(--color-dark-border)]">
            <div className="flex items-center gap-2 mb-2">
              <Gauge className="w-4 h-4 text-[var(--color-brand-neon)]" />
              <span className="text-xs text-slate-400 uppercase tracking-wider">Avg Speed</span>
            </div>
            <div className="text-3xl font-light text-[var(--color-brand-neon)]">{avgSpeedKmh} <span className="text-sm text-slate-500">km/h</span></div>
          </div>

          <div className="bg-[#0f172a]/60 p-4 rounded-lg border border-[var(--color-dark-border)]">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-slate-400 uppercase tracking-wider">Max Speed</span>
            </div>
            <div className="text-3xl font-light text-blue-400">{maxSpeed} <span className="text-sm text-slate-500">km/h</span></div>
          </div>

          <div className="bg-[#0f172a]/60 p-4 rounded-lg border border-[var(--color-dark-border)]">
            <div className="flex items-center gap-2 mb-2">
              <Car className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-400 uppercase tracking-wider">Active Vehicles</span>
            </div>
            <div className="text-3xl font-light text-white">{simState.active_count}</div>
          </div>

          {/* Speed Legend */}
          <div className="bg-[#0f172a]/60 p-4 rounded-lg border border-[var(--color-dark-border)]">
            <span className="text-xs text-slate-400 uppercase tracking-wider block mb-3">Speed Legend</span>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex items-center gap-2"><div className="w-3 h-2 rounded-sm bg-[#ff003c]"></div> Stopped (&lt;5 km/h)</div>
              <div className="flex items-center gap-2"><div className="w-3 h-2 rounded-sm bg-[#fbbf24]"></div> Slow (5-20 km/h)</div>
              <div className="flex items-center gap-2"><div className="w-3 h-2 rounded-sm bg-[#00f0ff]"></div> Normal (20-45 km/h)</div>
              <div className="flex items-center gap-2"><div className="w-3 h-2 rounded-sm bg-[#39ff14]"></div> Fast (&gt;45 km/h)</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App

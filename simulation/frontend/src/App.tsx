import { useEffect, useState, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import { Radio, Cpu, Car, Gauge, BarChart3, TrafficCone, Zap, Play, Pause, MapPin, TrendingUp, Layers, Clock, Timer, Activity, Flame, X, Video } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts'
import IntersectionCamera3D from './components/IntersectionCamera3D'

// ---------- Types ----------

interface VehicleData {
  id: string; lane: string; position: number; speed: number; acceleration: number
  lat: number; lng: number; bearing: number
  type: string; length: number
}

interface TrafficLightData {
  node_id: string; lat: number; lng: number
  edge_states: Record<string, string>
  edge_bearings?: Record<string, { bearing: number; length_m: number; name?: string; lanes?: number }>
  outgoing_bearings?: Record<string, { bearing: number; length_m: number }>
  phase_index: number; time_left: number
  mode: string; total_phases: number
}

interface EdgeCongestion {
  id: string; name: string; vehicle_count: number
  avg_speed_kmh: number; length_m: number
}

interface AdaptiveData {
  enabled: boolean; update_interval: number
  min_green: number; max_green: number
}

interface KPISnapshot {
  time: number; active_count: number; avg_speed_kmh: number
  stopped_count: number; throughput_per_min: number
  avg_delay_s: number; stopped_ratio_pct: number; max_queue_length: number
  mode: string
}

interface KPIData {
  current_kpis: {
    avg_speed_kmh: number; throughput_per_min: number
    avg_delay_s: number; stopped_ratio_pct: number; max_queue_length: number
  }
  summary: { total_sim_time: number; total_delay: number; vehicles_completed: number; avg_travel_time: number }
  snapshots: KPISnapshot[]
  comparison: { fixed: KPISnapshot[]; adaptive: KPISnapshot[] }
}

interface ScenarioInfo {
  id: string; name: string; name_en: string; description: string
  spawn_interval: number; max_vehicles: number; active: boolean
}

interface ScenarioData {
  current: string; current_name: string; scenarios: ScenarioInfo[]
}

interface GreenWaveData {
  active: boolean; corridors_count: number
}

interface SimulationState {
  center: { lat: number; lng: number }
  vehicles: VehicleData[]
  traffic_lights: TrafficLightData[]
  edge_congestion: EdgeCongestion[]
  adaptive_controller: AdaptiveData
  kpi: KPIData
  scenario: ScenarioData
  green_wave: GreenWaveData
  status: string
  sim_clock: number
  active_count: number
  total_edges: number
  total_nodes: number
  total_intersections: number
}

// ---------- Vehicle Colors by Type ----------

const VEHICLE_TYPE_COLORS: Record<string, { body: string; label: string }> = {
  car:   { body: '#0284c7', label: 'Minik' },
  suv:   { body: '#6366f1', label: 'SUV' },
  bus:   { body: '#d97706', label: 'Avtobus' },
  truck: { body: '#ea580c', label: 'Yük' },
}

// ---------- Vehicle Layer ----------

function VehicleLayer({ vehicles }: { vehicles: VehicleData[] }) {
  const map = useMap()
  const markersRef = useRef<Map<string, L.Marker>>(new Map())

  useEffect(() => {
    const currentMarkers = markersRef.current
    const activeIds = new Set(vehicles.map(v => v.id))

    currentMarkers.forEach((marker, id) => {
      if (!activeIds.has(id)) {
        map.removeLayer(marker)
        currentMarkers.delete(id)
      }
    })

    vehicles.forEach(v => {
      const speedKmh = v.speed * 3.6
      const isBraking = v.acceleration < -0.5
      const vType = v.type || 'car'
      const typeInfo = VEHICLE_TYPE_COLORS[vType] || VEHICLE_TYPE_COLORS.car

      // Speed-based color override
      let color = typeInfo.body
      if (speedKmh < 5) color = '#ef4444'
      else if (speedKmh < 20) color = '#f59e0b'
      else if (speedKmh > 45) color = '#10b981'

      const brakeColor = isBraking ? '#ef4444' : 'rgba(255,255,255,0.2)'
      const rotation = v.bearing - 90

      // Adjust SVG size based on vehicle type
      const w = vType === 'bus' ? 30 : vType === 'truck' ? 28 : vType === 'suv' ? 24 : 22
      const h = vType === 'bus' ? 10 : 12

      const carSvg = `
        <div class="car-svg" style="--car-color: ${color}; transform: rotate(${rotation}deg); transition: transform 0.1s linear;">
          <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
            <rect class="car-body-fill" x="2" y="1" width="${w-4}" height="${h-2}" rx="3" ry="3" style="fill:${color}"/>
            <rect class="car-outline" x="2" y="1" width="${w-4}" height="${h-2}" rx="3" ry="3"/>
            <rect class="car-window" x="${w-10}" y="2.5" width="4.5" height="${h-5}" rx="1.5"/>
            <rect class="car-window" x="4.5" y="3" width="3.5" height="${h-6}" rx="1"/>
            <rect x="${w-3}" y="2" width="2" height="2" rx="0.5" fill="#f8fafc"/>
            <rect x="${w-3}" y="${h-4}" width="2" height="2" rx="0.5" fill="#f8fafc"/>
            <rect x="1" y="2.5" width="2" height="2" rx="0.5" fill="${brakeColor}"/>
            <rect x="1" y="${h-4.5}" width="2" height="2" rx="0.5" fill="${brakeColor}"/>
          </svg>
        </div>`

      const existingMarker = currentMarkers.get(v.id)

      if (existingMarker) {
        existingMarker.setLatLng([v.lat, v.lng])
        const iconEl = (existingMarker as any)._icon
        if (iconEl) {
          const wrapper = iconEl.querySelector('.car-svg') as HTMLElement
          if (wrapper) {
            wrapper.style.setProperty('--car-color', color)
            wrapper.style.transform = `rotate(${rotation}deg)`
            const bodyFill = wrapper.querySelector('.car-body-fill') as SVGElement
            if (bodyFill) bodyFill.style.fill = color
          }
        }
      } else {
        const carIcon = L.divIcon({
          className: 'vehicle-marker',
          html: carSvg,
          iconSize: [w, h],
          iconAnchor: [w/2, h/2]
        })

        const marker = L.marker([v.lat, v.lng], { icon: carIcon, interactive: true })
        marker.bindTooltip(
          `<div class="flex flex-col gap-1">
             <span class="text-slate-500 text-[10px] uppercase">${typeInfo.label} ${v.id}</span>
             <span class="font-bold text-slate-800">${speedKmh.toFixed(0)} <span class="font-normal text-slate-500">km/s</span></span>
           </div>`,
          { direction: 'top', offset: [0, -10], className: 'vehicle-tooltip' }
        )
        marker.addTo(map)
        currentMarkers.set(v.id, marker)
      }
    })
  }, [vehicles, map])

  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => marker.remove())
      markersRef.current.clear()
    }
  }, [])

  return null
}

// ---------- Traffic Light Layer ----------

function TrafficLightLayer({ trafficLights, onSelect }: { trafficLights: TrafficLightData[]; onSelect?: (tl: TrafficLightData) => void }) {
  const map = useMap()
  const markersRef = useRef<Map<string, L.Marker>>(new Map())

  useEffect(() => {
    const currentMarkers = markersRef.current
    const activeIds = new Set(trafficLights.map(tl => tl.node_id))

    currentMarkers.forEach((marker, id) => {
      if (!activeIds.has(id)) {
        map.removeLayer(marker)
        currentMarkers.delete(id)
      }
    })

    trafficLights.forEach(tl => {
      const states = Object.values(tl.edge_states)
      const hasGreen = states.includes('Green')
      const hasYellow = states.includes('Yellow')

      let bg = '#ef4444' // Red
      if (hasGreen) bg = '#10b981' // Green
      else if (hasYellow) bg = '#f59e0b' // Yellow

      const modeStr = tl.mode === 'adaptive' ? 'Süni İntellekt' : tl.mode === 'flash_yellow' ? 'Gecə' : 'Sabit'
      const iconStr = tl.mode === 'adaptive' ? '✨' : tl.mode === 'flash_yellow' ? '🌙' : '⏱️'

      const existingMarker = currentMarkers.get(tl.node_id)

      if (existingMarker) {
        existingMarker.setLatLng([tl.lat, tl.lng])
        const iconEl = (existingMarker as any)._icon
        if (iconEl) {
          const dot = iconEl.querySelector('.tl-dot') as HTMLElement
          if (dot) dot.style.background = bg
        }
        existingMarker.setTooltipContent(
          `<div class="flex flex-col gap-1">
             <span class="text-slate-500 text-[10px] uppercase font-bold flex items-center gap-1">${iconStr} Kəsişmə</span>
             <span class="text-slate-700">Faza: <b>${tl.phase_index + 1}/${tl.total_phases}</b></span>
             <span class="text-slate-700">Qalan vaxt: <b>${tl.time_left} san</b></span>
             <span class="text-slate-700">Rejim: <span class="${tl.mode === 'adaptive' ? 'text-blue-600' : 'text-slate-600'}">${modeStr}</span></span>
           </div>`
        )
      } else {
        const tlIcon = L.divIcon({
          className: 'traffic-light-marker',
          html: `<div class="tl-dot" style="background: ${bg};"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        })

        const marker = L.marker([tl.lat, tl.lng], { icon: tlIcon, interactive: true })
        marker.bindTooltip(
          `<div class="flex flex-col gap-1">
             <span class="text-slate-500 text-[10px] uppercase font-bold flex items-center gap-1">${iconStr} Kəsişmə</span>
             <span class="text-slate-700">Faza: <b>${tl.phase_index + 1}/${tl.total_phases}</b></span>
             <span class="text-slate-700">Qalan vaxt: <b>${tl.time_left} san</b></span>
             <span class="text-slate-700">Rejim: <span class="${tl.mode === 'adaptive' ? 'text-blue-600' : 'text-slate-600'}">${modeStr}</span></span>
             <span class="text-sky-500 text-[10px] mt-1">📷 Klik — 3D Kamera</span>
           </div>`,
          { direction: 'top', offset: [0, -10], className: 'tl-tooltip' }
        )
        marker.on('click', () => { if (onSelect) onSelect(tl) })
        marker.addTo(map)
        currentMarkers.set(tl.node_id, marker)
      }
    })
  }, [trafficLights, map])

  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => marker.remove())
      markersRef.current.clear()
    }
  }, [])

  return null
}

// ---------- Heatmap Layer ----------

function HeatmapLayer({ vehicles, enabled }: { vehicles: VehicleData[]; enabled: boolean }) {
  const map = useMap()
  const heatRef = useRef<any>(null)

  useEffect(() => {
    if (!enabled) {
      if (heatRef.current) {
        map.removeLayer(heatRef.current)
        heatRef.current = null
      }
      return
    }

    const heatData: [number, number, number][] = vehicles.map(v => [
      v.lat, v.lng, v.speed * 3.6 < 5 ? 1.0 : v.speed * 3.6 < 20 ? 0.6 : 0.2
    ])

    if (heatRef.current) {
      heatRef.current.setLatLngs(heatData)
    } else {
      heatRef.current = (L as any).heatLayer(heatData, {
        radius: 30,
        blur: 20,
        maxZoom: 18,
        max: 1.0,
        gradient: { 0.2: '#10b981', 0.4: '#0284c7', 0.6: '#f59e0b', 0.8: '#ef4444', 1.0: '#dc2626' }
      }).addTo(map)
    }
  }, [vehicles, enabled, map])

  useEffect(() => {
    return () => {
      if (heatRef.current) {
        heatRef.current.remove()
      }
    }
  }, [])

  return null
}

// ---------- Stat Card Component ----------

function StatCard({ icon, label, value, unit, colorBg, colorText }: {
  icon: React.ReactNode; label: string; value: string | number; unit?: string; colorBg: string; colorText: string
}) {
  return (
    <div className="modern-card p-5 relative overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-2 rounded-lg`} style={{ backgroundColor: colorBg, color: colorText }}>
          {icon}
        </div>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-3xl font-bold text-slate-800">
        {value} {unit && <span className="text-sm font-medium text-slate-400 ml-1">{unit}</span>}
      </div>
    </div>
  )
}

// ---------- Mini KPI Card ----------

function MiniKPI({ label, value, unit, color }: { label: string; value: string | number; unit: string; color: string }) {
  return (
    <div className="flex flex-col items-center p-3 rounded-xl border" style={{ backgroundColor: color + '10', borderColor: color + '30' }}>
      <span className="text-2xl font-bold" style={{ color }}>{value}</span>
      <span className="text-[10px] font-semibold uppercase mt-1" style={{ color: color + 'cc' }}>{label}</span>
      <span className="text-[10px] text-slate-400">{unit}</span>
    </div>
  )
}

// ---------- Scenario Button ----------
const SCENARIO_ICONS: Record<string, string> = {
  peak: '🔥', normal: '☀️', night: '🌙', stress: '⚡'
}
const SCENARIO_COLORS: Record<string, string> = {
  peak: 'bg-red-50 border-red-200 text-red-700',
  normal: 'bg-sky-50 border-sky-200 text-sky-700',
  night: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  stress: 'bg-amber-50 border-amber-200 text-amber-700',
}

// ---------- Format Time ----------
function formatSimTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ---------- Main App ----------

function App() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || ''
  const WS_BASE = import.meta.env.VITE_WS_BASE_URL || ''

  const [wsStatus, setWsStatus] = useState('Əlaqə kəsilib')
  const [simState, setSimState] = useState<SimulationState>({
    center: { lat: 40.4000, lng: 49.8525 },
    vehicles: [], traffic_lights: [], edge_congestion: [],
    adaptive_controller: { enabled: true, update_interval: 30, min_green: 8, max_green: 45 },
    kpi: {
      current_kpis: { avg_speed_kmh: 0, throughput_per_min: 0, avg_delay_s: 0, stopped_ratio_pct: 0, max_queue_length: 0 },
      summary: { total_sim_time: 0, total_delay: 0, vehicles_completed: 0, avg_travel_time: 0 },
      snapshots: [], comparison: { fixed: [], adaptive: [] }
    },
    scenario: { current: 'normal', current_name: '', scenarios: [] },
    green_wave: { active: false, corridors_count: 0 },
    status: 'Dayandırılıb', sim_clock: 0, active_count: 0, total_edges: 0, total_nodes: 0, total_intersections: 0
  })
  const [activeTab, setActiveTab] = useState<'analytics' | 'congestion' | 'control' | 'charts'>('analytics')
  const [heatmapOn, setHeatmapOn] = useState(false)
  const [selectedTL, setSelectedTL] = useState<string | null>(null)

  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE}/ws`)
    ws.onopen = () => setWsStatus('Qoşulub')
    ws.onmessage = (event) => {
      try { 
        const state = JSON.parse(event.data)
        // Translate running status
        if(state.status === "Running") state.status = "İşləyir"
        else if(state.status === "Stopped") state.status = "Dayandırılıb"
        setSimState(state) 
      } catch (e) { console.error(e) }
    }
    ws.onclose = () => setWsStatus('Əlaqə kəsilib')
    return () => ws.close()
  }, [])

  const toggleSimulation = useCallback(async () => {
    try { await fetch(`${API_BASE}/api/simulation/toggle`, { method: 'POST' }) }
    catch (e) { console.error(e) }
  }, [])

  const toggleAdaptiveAll = useCallback(async (enabled: boolean) => {
    try {
      await fetch(`${API_BASE}/api/adaptive/toggle-all?enabled=${enabled}`, { method: 'POST' })
    } catch (e) { console.error(e) }
  }, [])

  const setScenario = useCallback(async (scenarioId: string) => {
    try {
      await fetch(`${API_BASE}/api/scenario/set`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_id: scenarioId })
      })
    } catch (e) { console.error(e) }
  }, [])

  const toggleGreenWave = useCallback(async (enable: boolean) => {
    try {
      if (enable) {
        await fetch(`${API_BASE}/api/green-wave/apply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target_speed_kmh: 50 })
        })
      } else {
        await fetch(`${API_BASE}/api/green-wave/disable`, { method: 'POST' })
      }
    } catch (e) { console.error(e) }
  }, [])

  const resetComparison = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/api/kpi/reset-comparison`, { method: 'POST' })
    } catch (e) { console.error(e) }
  }, [])

  const avgSpeedKmh = simState.vehicles.length > 0
    ? (simState.vehicles.reduce((a, v) => a + v.speed, 0) / simState.vehicles.length * 3.6).toFixed(1)
    : '0.0'
  
  const maxSpeed = simState.vehicles.length > 0
    ? (Math.max(...simState.vehicles.map(v => v.speed)) * 3.6).toFixed(1)
    : '0.0'

  const stoppedCount = simState.vehicles.filter(v => v.speed * 3.6 < 5).length
  const greenLights = simState.traffic_lights.filter(tl => Object.values(tl.edge_states).includes('Green')).length
  const adaptiveCount = simState.traffic_lights.filter(tl => tl.mode === 'adaptive').length

  // Vehicle type counts
  const typeCounts: Record<string, number> = {}
  simState.vehicles.forEach(v => { typeCounts[v.type || 'car'] = (typeCounts[v.type || 'car'] || 0) + 1 })

  return (
    <div className="h-screen bg-slate-50 text-slate-800 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-sky-100 text-sky-600 rounded-xl">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Rəqəmsal Əkiz Simulyasiyası
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">Bakı, Gənclik — Real-Vaxt IDM + Adaptiv İdarəetmə</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Sim Clock */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm font-mono font-bold text-slate-700">
            <Clock className="w-4 h-4 text-slate-400" />
            {formatSimTime(simState.sim_clock || 0)}
          </div>

          {/* Status Indicators */}
          <div className="flex items-center gap-4 px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm font-medium">
            <div className="flex items-center gap-2 border-r border-slate-200 pr-4">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600"><b className="text-slate-800">{simState.total_edges}</b> yol</span>
            </div>
            <div className="flex items-center gap-2">
              <TrafficCone className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600"><b className="text-slate-800">{simState.total_intersections}</b> kəsişmə</span>
            </div>
          </div>

          {/* Heatmap Toggle */}
          <button onClick={() => setHeatmapOn(!heatmapOn)}
            className={`modern-btn flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold border cursor-pointer transition-all
              ${heatmapOn ? 'bg-orange-100 text-orange-700 border-orange-300' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
          >
            <Flame className="w-4 h-4" />
            Heatmap
          </button>

          <button onClick={toggleSimulation}
            className={`modern-btn flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white shadow-sm cursor-pointer
              ${simState.status === 'İşləyir' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
          >
            {simState.status === 'İşləyir' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {simState.status}
          </button>
          
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium border
            ${wsStatus === 'Qoşulub' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
            <Radio className={`w-4 h-4 ${wsStatus === 'Qoşulub' ? 'animate-pulse' : ''}`} />
            <span>{wsStatus}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative bg-slate-100">
          <MapContainer
            center={[simState.center.lat, simState.center.lng]}
            zoom={16}
            style={{ height: '100%', width: '100%', background: '#f8fafc' }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            <VehicleLayer vehicles={simState.vehicles} />
            <TrafficLightLayer trafficLights={simState.traffic_lights} onSelect={(tl) => setSelectedTL(tl.node_id)} />
            <HeatmapLayer vehicles={simState.vehicles} enabled={heatmapOn} />
          </MapContainer>

          {/* Scenario Badge (floating on map) */}
          {simState.scenario?.current_name && (
            <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg border border-slate-200/50 text-sm font-semibold text-slate-700 flex items-center gap-2">
              {SCENARIO_ICONS[simState.scenario.current] || '📍'}
              {simState.scenario.current_name}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-[380px] shrink-0 bg-slate-50 border-l border-slate-200 flex flex-col overflow-hidden shadow-[-4px_0_15px_rgba(0,0,0,0.02)] z-10">
          {/* Tabs */}
          <div className="flex flex-col p-4 bg-white border-b border-slate-200 shrink-0 gap-3">
            <h2 className="text-sm font-bold text-slate-800 px-1">Göstəricilər Paneli</h2>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {[
                { id: 'analytics' as const, label: 'Analitika' },
                { id: 'charts' as const, label: 'Qrafiklər' },
                { id: 'congestion' as const, label: 'Sıxlıq' },
                { id: 'control' as const, label: 'İdarəetmə' },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2 px-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer
                    ${activeTab === tab.id
                      ? 'bg-white text-sky-600 shadow-sm border border-slate-200/50'
                      : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            
            {/* ANALYTICS TAB */}
            {activeTab === 'analytics' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <StatCard
                    icon={<Gauge className="w-5 h-5" />}
                    label="Orta Sürət" value={avgSpeedKmh} unit="km/s"
                    colorBg="#e0f2fe" colorText="#0284c7"
                  />
                  <StatCard
                    icon={<BarChart3 className="w-5 h-5" />}
                    label="Maks Sürət" value={maxSpeed} unit="km/s"
                    colorBg="#fef3c7" colorText="#d97706"
                  />
                  <StatCard
                    icon={<Car className="w-5 h-5" />}
                    label="Aktiv Nəq." value={simState.active_count}
                    colorBg="#dcfce7" colorText="#059669"
                  />
                  <StatCard
                    icon={<TrafficCone className="w-5 h-5" />}
                    label="Dayanmış" value={stoppedCount}
                    colorBg="#fee2e2" colorText="#dc2626"
                  />
                </div>

                {/* KPI Cards */}
                {simState.kpi && (
                  <div className="modern-card p-5">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                      <Activity className="w-4 h-4" /> Performans Göstəriciləri (KPI)
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      <MiniKPI label="Throughput" value={simState.kpi.current_kpis.throughput_per_min} unit="maş/dəq" color="#0284c7" />
                      <MiniKPI label="Gecikmə" value={simState.kpi.current_kpis.avg_delay_s} unit="san" color="#ef4444" />
                      <MiniKPI label="Maks Növbə" value={simState.kpi.current_kpis.max_queue_length} unit="maşın" color="#f59e0b" />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500 font-medium bg-slate-50 rounded-lg p-3 border border-slate-100">
                      <span>Tamamlanmış: <b className="text-slate-700">{simState.kpi.summary.vehicles_completed}</b></span>
                      <span>Ort. Yol: <b className="text-slate-700">{simState.kpi.summary.avg_travel_time}s</b></span>
                    </div>
                  </div>
                )}

                {/* Vehicle Types */}
                <div className="modern-card p-5">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4">Nəqliyyat Tipləri</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(VEHICLE_TYPE_COLORS).map(([type, info]) => (
                      <div key={type} className="flex flex-col items-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-lg font-bold text-slate-800">{typeCounts[type] || 0}</span>
                        <span className="text-[10px] font-semibold uppercase" style={{ color: info.body }}>{info.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="modern-card p-5 mt-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4">İşıqforlar</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 flex flex-col items-center p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                      <span className="text-3xl font-bold text-emerald-600">{greenLights}</span>
                      <span className="text-xs font-medium text-emerald-700 mt-1 uppercase">Yaşıl İşıq</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center p-3 rounded-xl bg-red-50 border border-red-100">
                      <span className="text-3xl font-bold text-red-600">{simState.total_intersections - greenLights}</span>
                      <span className="text-xs font-medium text-red-700 mt-1 uppercase">Qırmızı/Sarı</span>
                    </div>
                  </div>
                </div>

                <div className="modern-card p-5">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4">Sürət Göstəricisi</h3>
                  <div className="flex flex-col gap-3 text-sm font-medium text-slate-600">
                    <div className="flex items-center gap-3"><div className="w-4 h-4 rounded shadow-sm" style={{backgroundColor: '#ef4444'}}></div> Dayanıb (&lt;5 km/s)</div>
                    <div className="flex items-center gap-3"><div className="w-4 h-4 rounded shadow-sm" style={{backgroundColor: '#f59e0b'}}></div> Yavaş (5-20 km/s)</div>
                    <div className="flex items-center gap-3"><div className="w-4 h-4 rounded shadow-sm" style={{backgroundColor: '#0284c7'}}></div> Normal (20-45 km/s)</div>
                    <div className="flex items-center gap-3"><div className="w-4 h-4 rounded shadow-sm" style={{backgroundColor: '#10b981'}}></div> Sürətli (&gt;45 km/s)</div>
                  </div>
                </div>
              </>
            )}

            {/* CHARTS TAB */}
            {activeTab === 'charts' && (
              <>
                {/* Real-time Speed Chart */}
                <div className="modern-card p-5">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Orta Sürət Dinamikası
                  </h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={simState.kpi?.snapshots || []}>
                      <defs>
                        <linearGradient id="speedGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="time" tick={{ fontSize: 10 }} tickFormatter={(v) => formatSimTime(v)} />
                      <YAxis tick={{ fontSize: 10 }} unit=" km/s" />
                      <Tooltip formatter={(v: number) => [`${v} km/s`, 'Orta Sürət']} labelFormatter={(v) => `Vaxt: ${formatSimTime(v as number)}`} />
                      <Area type="monotone" dataKey="avg_speed_kmh" stroke="#0284c7" fill="url(#speedGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Throughput Chart */}
                <div className="modern-card p-5">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" /> Throughput & Gecikmə
                  </h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={simState.kpi?.snapshots || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="time" tick={{ fontSize: 10 }} tickFormatter={(v) => formatSimTime(v)} />
                      <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                      <Tooltip labelFormatter={(v) => `Vaxt: ${formatSimTime(v as number)}`} />
                      <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />
                      <Line yAxisId="left" type="monotone" dataKey="throughput_per_min" name="Throughput (m/dəq)" stroke="#10b981" strokeWidth={2} dot={false} />
                      <Line yAxisId="right" type="monotone" dataKey="avg_delay_s" name="Gecikmə (san)" stroke="#ef4444" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Comparison: Fixed vs Adaptive */}
                <div className="modern-card p-5 border-l-4 border-l-violet-500">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                    <Layers className="w-4 h-4" /> Müqayisə: Sabit vs Adaptiv
                  </h3>
                  <p className="text-[11px] text-slate-400 mb-4">
                    Əvvəlcə "Sabit" rejimə keçib bir müddət izləyin, sonra "Adaptiv" rejimə qayıdın. Fərqi burada görəcəksiniz.
                  </p>
                  
                  {(simState.kpi?.comparison?.fixed?.length > 0 || simState.kpi?.comparison?.adaptive?.length > 0) ? (
                    <>
                      {/* Speed comparison */}
                      <div className="mb-4">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Orta Sürət Müqayisəsi</span>
                        <ResponsiveContainer width="100%" height={140}>
                          <LineChart>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="time" tick={{ fontSize: 9 }} tickFormatter={(v) => formatSimTime(v)} 
                              type="number" domain={['dataMin', 'dataMax']} allowDuplicatedCategory={false} />
                            <YAxis tick={{ fontSize: 9 }} unit=" km/s" />
                            <Tooltip labelFormatter={(v) => `Vaxt: ${formatSimTime(v as number)}`} />
                            <Legend wrapperStyle={{ fontSize: 10, fontWeight: 600 }} />
                            <Line data={simState.kpi.comparison.fixed} dataKey="avg_speed_kmh" name="Sabit" stroke="#94a3b8" strokeWidth={2} dot={false} />
                            <Line data={simState.kpi.comparison.adaptive} dataKey="avg_speed_kmh" name="Adaptiv" stroke="#0284c7" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Delay comparison */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Gecikmə Müqayisəsi</span>
                        <ResponsiveContainer width="100%" height={140}>
                          <LineChart>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="time" tick={{ fontSize: 9 }} tickFormatter={(v) => formatSimTime(v)} 
                              type="number" domain={['dataMin', 'dataMax']} allowDuplicatedCategory={false} />
                            <YAxis tick={{ fontSize: 9 }} unit=" s" />
                            <Tooltip labelFormatter={(v) => `Vaxt: ${formatSimTime(v as number)}`} />
                            <Legend wrapperStyle={{ fontSize: 10, fontWeight: 600 }} />
                            <Line data={simState.kpi.comparison.fixed} dataKey="avg_delay_s" name="Sabit" stroke="#94a3b8" strokeWidth={2} dot={false} />
                            <Line data={simState.kpi.comparison.adaptive} dataKey="avg_delay_s" name="Adaptiv" stroke="#ef4444" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-sm text-slate-400 py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      Hələ müqayisə verisi yoxdur.<br/>Əvvəlcə hər iki rejimi işlədin.
                    </div>
                  )}

                  <button onClick={resetComparison}
                    className="modern-btn w-full mt-4 py-2 text-xs font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 cursor-pointer"
                  >
                    Müqayisə Verisini Sıfırla
                  </button>
                </div>

                {/* Active Count Chart */}
                <div className="modern-card p-5">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Car className="w-4 h-4" /> Aktiv Maşın Sayı
                  </h3>
                  <ResponsiveContainer width="100%" height={140}>
                    <AreaChart data={simState.kpi?.snapshots || []}>
                      <defs>
                        <linearGradient id="countGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="time" tick={{ fontSize: 10 }} tickFormatter={(v) => formatSimTime(v)} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip labelFormatter={(v) => `Vaxt: ${formatSimTime(v as number)}`} />
                      <Area type="monotone" dataKey="active_count" stroke="#10b981" fill="url(#countGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {/* CONGESTION TAB */}
            {activeTab === 'congestion' && (
              <>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide px-1">Ən Sıx Yollar</h3>
                {simState.edge_congestion.length === 0 && (
                  <div className="modern-card p-8 text-center text-sm font-medium text-slate-500">Hələ məlumat yoxdur</div>
                )}
                {simState.edge_congestion.map((ec) => {
                  const maxVehicles = Math.max(...simState.edge_congestion.map(e => e.vehicle_count), 1)
                  const pct = (ec.vehicle_count / maxVehicles) * 100
                  let barColor = '#10b981' // Green
                  let bgBg = '#dcfce7'
                  if (ec.avg_speed_kmh < 10){ barColor = '#ef4444'; bgBg = '#fee2e2' }
                  else if (ec.avg_speed_kmh < 25){ barColor = '#f59e0b'; bgBg = '#fef3c7' }
                  else if (ec.avg_speed_kmh < 40){ barColor = '#0284c7'; bgBg = '#e0f2fe' }

                  return (
                    <div key={ec.id} className="modern-card p-4 hover:border-sky-200 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-sm font-bold text-slate-800 truncate max-w-[200px]" title={ec.name}>
                          {ec.name || ec.id.substring(0, 15) + '...'}
                        </span>
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{ec.length_m.toFixed(0)}m</span>
                      </div>
                      
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 opacity-80">
                          <Car className="w-4 h-4 text-slate-500" />
                          <span className="text-xs font-semibold text-slate-600">{ec.vehicle_count} avtomobil</span>
                        </div>
                        <div className="text-xs font-bold" style={{ color: barColor }}>{ec.avg_speed_kmh} km/s</div>
                      </div>

                      <div className="w-full h-2 rounded-full overflow-hidden" style={{backgroundColor: bgBg}}>
                        <div className="congestion-bar h-full rounded-full" style={{ width: `${pct}%`, background: barColor }}></div>
                      </div>
                    </div>
                  )
                })}
              </>
            )}

            {/* CONTROL TAB */}
            {activeTab === 'control' && (
              <>
                {/* Scenario Selection */}
                <div className="modern-card p-5 border-l-4 border-l-violet-500">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Timer className="w-4 h-4" /> Ssenari Rejimi
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {(simState.scenario?.scenarios || []).map(sc => (
                      <button key={sc.id} onClick={() => setScenario(sc.id)}
                        className={`modern-btn p-3 rounded-xl text-left border-2 cursor-pointer transition-all
                          ${sc.active
                            ? 'border-violet-400 bg-violet-50 shadow-sm'
                            : `${SCENARIO_COLORS[sc.id] || 'bg-slate-50 border-slate-200 text-slate-700'} border hover:shadow-sm`
                          }`}
                      >
                        <div className="text-lg mb-1">{SCENARIO_ICONS[sc.id] || '📍'}</div>
                        <div className="text-xs font-bold">{sc.name_en}</div>
                        <div className="text-[10px] opacity-70 mt-0.5">{sc.max_vehicles} maşın · {sc.spawn_interval}s</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Control */}
                <div className="modern-card p-5 border-l-4 border-l-sky-500">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-sky-100 p-1.5 rounded-lg text-sky-600"><Zap className="w-4 h-4" /></div>
                      <span className="font-bold text-slate-800">Süni İntellekt (AI) Rejimi</span>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${adaptiveCount > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {adaptiveCount > 0 ? 'AKTİV' : 'QAPALI'}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-500 mb-4 leading-relaxed">
                    <b>Sıraya-Mütənasib Yaşıl İşıq:</b> Real-vaxt yaranan tıxaca və qovşaqdakı avtomobil sıxlığına görə yaşıl işıq müddətini avtomatik uzadır və ya qısaldır.
                  </p>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => toggleAdaptiveAll(true)}
                      className="modern-btn w-full py-2.5 text-sm font-bold rounded-lg bg-sky-500 text-white hover:bg-sky-600 cursor-pointer"
                    >
                      Bütün Kəsişmələri Aktivləşdir (S.İ.)
                    </button>
                    <button onClick={() => toggleAdaptiveAll(false)}
                      className="modern-btn w-full py-2.5 text-sm font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 cursor-pointer"
                    >
                      Sabit Rejimə Qayıt
                    </button>
                  </div>
                </div>

                {/* Green Wave */}
                <div className="modern-card p-5 border-l-4 border-l-emerald-500">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-emerald-100 p-1.5 rounded-lg text-emerald-600">🌊</div>
                      <span className="font-bold text-slate-800">Yaşıl Dalğa</span>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${simState.green_wave?.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {simState.green_wave?.active ? 'AKTİV' : 'QAPALI'}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-500 mb-3 leading-relaxed">
                    Koridor boyunca işıqforları sinxronlaşdırır — maşın 50 km/s sürətlə gedəndə hər növbəti işıqfor yaşıl olur.
                  </p>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Aşkar edilmiş koridorlar: <b className="text-slate-700">{simState.green_wave?.corridors_count || 0}</b>
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => toggleGreenWave(true)}
                      className="modern-btn flex-1 py-2 text-xs font-bold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer"
                    >
                      Aktivləşdir
                    </button>
                    <button onClick={() => toggleGreenWave(false)}
                      className="modern-btn flex-1 py-2 text-xs font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 cursor-pointer"
                    >
                      Söndür
                    </button>
                  </div>
                </div>

                {/* Settings */}
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-2 px-1">Tənzimləmələr</h3>
                <div className="modern-card p-5">
                  <div className="flex flex-col gap-3 font-medium text-sm text-slate-600">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span>Yenilənmə Aralığı</span>
                      <span className="font-bold text-slate-800">{simState.adaptive_controller.update_interval} san</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span>Min. Yaşıl İşıq</span>
                      <span className="font-bold text-slate-800">{simState.adaptive_controller.min_green} san</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span>Maks. Yaşıl İşıq</span>
                      <span className="font-bold text-slate-800">{simState.adaptive_controller.max_green} san</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Adaptiv Kəsişmələr</span>
                      <span className="font-bold text-sky-600">{adaptiveCount} / {simState.total_intersections}</span>
                    </div>
                  </div>
                </div>

                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-2 px-1">Kəsişmələr Paneli</h3>
                {simState.traffic_lights.map(tl => {
                  const states = Object.values(tl.edge_states)
                  const hasGreen = states.includes('Green')
                  return (
                    <div key={tl.node_id} className="modern-card p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full shadow-sm ${hasGreen ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                          <span className="text-sm font-bold text-slate-800 font-mono">ID: {tl.node_id.substring(0, 8)}</span>
                        </div>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border 
                          ${tl.mode === 'adaptive' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                          : tl.mode === 'flash_yellow' ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {tl.mode === 'adaptive' ? 'S.İ.' : tl.mode === 'flash_yellow' ? 'Gecə' : 'Sabit'}
                        </span>
                      </div>
                      <div className="flex items-center gap-0 text-xs font-medium text-slate-500 bg-slate-50 rounded-lg border border-slate-100 divide-x divide-slate-200">
                        <span className="px-3 py-1.5 flex-1 text-center">Faza {tl.phase_index + 1}/{tl.total_phases}</span>
                        <span className="px-3 py-1.5 flex-1 text-center text-slate-700"><b>{tl.time_left}</b> san qaldı</span>
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </div>
      </main>

      {/* 3D Camera Modal */}
      {selectedTL && (() => {
        const liveTL = simState.traffic_lights.find(tl => tl.node_id === selectedTL)
        if (!liveTL) return null
        return (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setSelectedTL(null)}>
            <div className="relative w-[90vw] max-w-[900px] h-[75vh] bg-[#12121f] rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-3.5 bg-[#1a1a2e] border-b border-slate-700/50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-sky-500/20 rounded-lg text-sky-400">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-sm">Kəsişmə Kamerası — 3D Görüntü</h2>
                    <p className="text-slate-400 text-xs font-mono mt-0.5">ID: {liveTL.node_id.substring(0, 12)}... · {liveTL.lat.toFixed(5)}, {liveTL.lng.toFixed(5)}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedTL(null)} className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 3D Viewport */}
              <div className="flex-1 p-4">
                <IntersectionCamera3D
                  vehicles={simState.vehicles}
                  cameraLat={liveTL.lat}
                  cameraLng={liveTL.lng}
                  edgeStates={liveTL.edge_states}
                  edgeBearings={liveTL.edge_bearings || {}}
                  outgoingBearings={liveTL.outgoing_bearings || {}}
                  mode={liveTL.mode}
                  phaseIndex={liveTL.phase_index}
                  totalPhases={liveTL.total_phases}
                  timeLeft={liveTL.time_left}
                  nodeId={liveTL.node_id}
                />
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

export default App

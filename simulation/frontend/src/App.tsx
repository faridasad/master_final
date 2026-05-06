import { useEffect, useState, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import { Radio, Cpu, Car, Gauge, BarChart3, TrafficCone, Zap, Play, Pause, MapPin, TrendingUp, Layers, Clock, Timer, Activity, Flame, X, Video, Award, Sun, Moon } from 'lucide-react'
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
  los_grade?: string; queue_per_lane?: number
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
  los_grade?: string; co2_rate_g_per_s?: number; total_co2_kg?: number; mode: string
}

interface KPIData {
  current_kpis: {
    avg_speed_kmh: number; throughput_per_min: number
    avg_delay_s: number; stopped_ratio_pct: number; max_queue_length: number
    los_grade?: string; co2_rate_g_per_s?: number; total_co2_kg?: number
  }
  summary: { total_sim_time: number; total_delay: number; vehicles_completed: number; avg_travel_time: number; total_co2_kg?: number }
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

// ---------- Theme Color Systems ----------

const DARK = {
  bgDeep: '#070d1a', bgSurface: '#0a1220', headerBg: 'rgba(10,18,36,0.95)',
  tHi: '#e2eaff', tMid: '#7090b8', tMidHi: '#c0d4f0', tLo: '#3a5878',
  cyan: '#00d4ff', green: '#00e59a', red: '#ff5570', amber: '#ffa040', purple: '#a855f7',
  border: 'rgba(0,212,255,0.11)', borderHi: 'rgba(0,212,255,0.26)',
  bDim: 'rgba(0,212,255,0.08)', bSm: 'rgba(0,212,255,0.12)', bMd: 'rgba(0,212,255,0.2)',
  bgXs: 'rgba(0,212,255,0.04)', bgSm: 'rgba(0,212,255,0.06)', bgMd: 'rgba(0,212,255,0.12)', bgLg: 'rgba(0,212,255,0.15)',
  bgGreenSm: 'rgba(0,229,154,0.08)', bgGreenMd: 'rgba(0,229,154,0.12)',
  bgRedSm: 'rgba(255,85,112,0.08)',  bgRedMd: 'rgba(255,85,112,0.12)',
  bgAmberSm: 'rgba(255,160,64,0.08)', bgAmberMd: 'rgba(255,160,64,0.12)',
  bgPurpleSm: 'rgba(168,85,247,0.08)', bgPurpleMd: 'rgba(168,85,247,0.15)',
  grid: 'rgba(0,212,255,0.08)', tickFill: '#3a5878',
  tooltipBg: '#0a1628', tooltipBorder: 'rgba(0,212,255,0.2)', tooltipText: '#c0d4f0', tooltipLabel: '#7090b8',
  mapTile: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
}
const LIGHT = {
  bgDeep: '#edf2fa', bgSurface: '#f5f8ff', headerBg: 'rgba(245,248,255,0.97)',
  tHi: '#0d1f3c', tMid: '#4a6080', tMidHi: '#2a4060', tLo: '#8aaac8',
  cyan: '#0068d6', green: '#007858', red: '#cc2828', amber: '#b86800', purple: '#7a30c0',
  border: 'rgba(0,70,180,0.12)', borderHi: 'rgba(0,70,180,0.3)',
  bDim: 'rgba(0,70,180,0.09)', bSm: 'rgba(0,70,180,0.13)', bMd: 'rgba(0,70,180,0.22)',
  bgXs: 'rgba(0,104,214,0.05)', bgSm: 'rgba(0,104,214,0.08)', bgMd: 'rgba(0,104,214,0.11)', bgLg: 'rgba(0,104,214,0.15)',
  bgGreenSm: 'rgba(0,120,88,0.07)',   bgGreenMd: 'rgba(0,120,88,0.12)',
  bgRedSm: 'rgba(204,40,40,0.07)',    bgRedMd: 'rgba(204,40,40,0.12)',
  bgAmberSm: 'rgba(184,104,0,0.07)', bgAmberMd: 'rgba(184,104,0,0.12)',
  bgPurpleSm: 'rgba(122,48,192,0.07)', bgPurpleMd: 'rgba(122,48,192,0.13)',
  grid: 'rgba(0,70,180,0.1)', tickFill: '#8aaac8',
  tooltipBg: '#f0f5ff', tooltipBorder: 'rgba(0,70,180,0.2)', tooltipText: '#0d1f3c', tooltipLabel: '#4a6080',
  mapTile: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
}

// ---------- LOS Config ----------

const LOS_CONFIG: Record<string, { color: string; bg: string; border: string; label: string; desc: string }> = {
  A: { color: '#059669', bg: '#ecfdf5', border: '#6ee7b7', label: 'Əla',        desc: 'Azad axın — Gözləmə praktiki yoxdur' },
  B: { color: '#16a34a', bg: '#f0fdf4', border: '#86efac', label: 'Yaxşı',      desc: 'Stabil axın — Qısa gözləmə' },
  C: { color: '#ca8a04', bg: '#fefce8', border: '#fde047', label: 'Orta',       desc: 'Qənaətbəxş axın — Qəbul edilə bilən gecikmə' },
  D: { color: '#d97706', bg: '#fffbeb', border: '#fcd34d', label: 'Zəif',       desc: 'Həddə yaxın axın — Nəzərəçarpacaq gecikmə' },
  E: { color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', label: 'Pis',        desc: 'Qeyri-sabit axın — Uzun gözləmə' },
  F: { color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd', label: 'Böhran',     desc: 'Tıxac — Dözülməz gecikmə, axın pozulub' },
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
    <div className="modern-card p-5 relative overflow-hidden fade-up">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-lg" style={{ backgroundColor: colorBg + '22', color: colorText }}>
          {icon}
        </div>
        <span className="sec-label">{label}</span>
      </div>
      <div className="text-3xl data-num" style={{ color: colorText }}>
        {value}
        {unit && <span className="text-xs font-medium ml-1.5" style={{ color: colorText + '99' }}>{unit}</span>}
      </div>
    </div>
  )
}

// ---------- Mini KPI Card ----------

function MiniKPI({ label, value, unit, color }: { label: string; value: string | number; unit: string; color: string }) {
  return (
    <div className="flex flex-col items-center p-3 rounded-xl border" style={{ backgroundColor: color + '14', borderColor: color + '38' }}>
      <span className="text-xl data-num" style={{ color }}>{value}</span>
      <span className="text-[10px] font-semibold uppercase mt-1 tracking-wide" style={{ color: color + 'bb' }}>{label}</span>
      <span className="text-[10px]" style={{ color: 'var(--t-lo)' }}>{unit}</span>
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

  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const C = theme === 'dark' ? DARK : LIGHT
  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])

  const [wsStatus, setWsStatus] = useState('Əlaqə kəsilib')
  const [simState, setSimState] = useState<SimulationState>({
    center: { lat: 40.4000, lng: 49.8525 },
    vehicles: [], traffic_lights: [], edge_congestion: [],
    adaptive_controller: { enabled: true, update_interval: 30, min_green: 8, max_green: 45 },
    kpi: {
      current_kpis: { avg_speed_kmh: 0, throughput_per_min: 0, avg_delay_s: 0, stopped_ratio_pct: 0, max_queue_length: 0, los_grade: '?' },
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
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: C.bgDeep, color: C.tHi, fontFamily: "'Syne', sans-serif", position: 'relative', zIndex: 1 }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3.5 shrink-0 z-10" style={{ background: C.headerBg, borderBottom: `1px solid ${C.bSm}`, backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl" style={{ background: 'rgba(0,212,255,0.1)', color: C.cyan }}>
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight" style={{ color: C.tHi, letterSpacing: '-0.01em' }}>
              Rəqəmsal Əkiz Simulyasiyası
            </h1>
            <p className="text-xs font-medium mt-0.5" style={{ color: C.tLo }}>Bakı, Gənclik · Real-vaxt IDM + Adaptiv İdarəetmə</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {/* Sim Clock */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold data-num" style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.18)', color: C.cyan }}>
            <Clock className="w-3.5 h-3.5 live-dot" />
            {formatSimTime(simState.sim_clock || 0)}
          </div>

          {/* Network Info */}
          <div className="flex items-center gap-3.5 px-4 py-2 rounded-full text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,212,255,0.1)' }}>
            <div className="flex items-center gap-1.5" style={{ borderRight: '1px solid rgba(0,212,255,0.12)', paddingRight: '14px' }}>
              <MapPin className="w-3.5 h-3.5" style={{ color: C.tLo }} />
              <span style={{ color: C.tMid }}><b style={{ color: C.tMidHi }}>{simState.total_edges}</b> yol</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrafficCone className="w-3.5 h-3.5" style={{ color: C.tLo }} />
              <span style={{ color: C.tMid }}><b style={{ color: C.tMidHi }}>{simState.total_intersections}</b> kəsişmə</span>
            </div>
          </div>

          {/* Heatmap Toggle */}
          <button onClick={() => setHeatmapOn(!heatmapOn)}
            className="modern-btn flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold cursor-pointer"
            style={heatmapOn
              ? { background: 'rgba(255,160,64,0.15)', color: C.amber, border: '1px solid rgba(255,160,64,0.35)' }
              : { background: 'rgba(255,255,255,0.03)', color: C.tMid, border: '1px solid rgba(0,212,255,0.1)' }}
          >
            <Flame className="w-3.5 h-3.5" />
            Heatmap
          </button>

          <button onClick={toggleSimulation}
            className="modern-btn flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold cursor-pointer"
            style={simState.status === 'İşləyir'
              ? { background: 'rgba(255,160,64,0.18)', color: C.amber, border: '1px solid rgba(255,160,64,0.35)' }
              : { background: 'rgba(0,229,154,0.15)', color: C.green, border: '1px solid rgba(0,229,154,0.35)' }}
          >
            {simState.status === 'İşləyir' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {simState.status}
          </button>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold"
            style={wsStatus === 'Qoşulub'
              ? { background: 'rgba(0,229,154,0.1)', color: C.green, border: '1px solid rgba(0,229,154,0.25)' }
              : { background: 'rgba(255,85,112,0.1)', color: C.red, border: '1px solid rgba(255,85,112,0.25)' }}>
            <Radio className={`w-3.5 h-3.5 ${wsStatus === 'Qoşulub' ? 'live-dot' : ''}`} />
            <span>{wsStatus}</span>
          </div>

          {/* Theme Toggle */}
          <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            className="modern-btn p-2 rounded-full cursor-pointer transition-all"
            title={theme === 'dark' ? 'Açıq rejim' : 'Tünd rejim'}
            style={{ background: C.bgXs, border: `1px solid ${C.border}`, color: C.tMid }}>
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative bg-slate-100">
          <MapContainer
            center={[simState.center.lat, simState.center.lng]}
            zoom={16}
            style={{ height: '100%', width: '100%', background: C.bgSurface }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url={C.mapTile}
            />
            <VehicleLayer vehicles={simState.vehicles} />
            <TrafficLightLayer trafficLights={simState.traffic_lights} onSelect={(tl) => setSelectedTL(tl.node_id)} />
            <HeatmapLayer vehicles={simState.vehicles} enabled={heatmapOn} />
          </MapContainer>

          {/* Scenario Badge (floating on map) */}
          {simState.scenario?.current_name && (
            <div className="absolute top-4 left-4 z-1000 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold" style={{ background: C.headerBg, border: `1px solid ${C.bMd}`, color: C.tMidHi, backdropFilter: 'blur(8px)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
              {SCENARIO_ICONS[simState.scenario.current] || '📍'}
              {simState.scenario.current_name}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-[380px] shrink-0 flex flex-col overflow-hidden z-10" style={{ background: C.bgSurface, borderLeft: `1px solid ${C.border}` }}>
          {/* Tabs */}
          <div className="flex flex-col px-4 pt-4 pb-3 shrink-0 gap-3" style={{ borderBottom: '1px solid rgba(0,212,255,0.08)' }}>
            <h2 className="sec-label px-1 text-[0.6rem]">Göstəricilər Paneli</h2>
            <div className="flex p-1 rounded-xl gap-0.5" style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.08)' }}>
              {[
                { id: 'analytics' as const, label: 'Analitika' },
                { id: 'charts' as const, label: 'Qrafiklər' },
                { id: 'congestion' as const, label: 'Sıxlıq' },
                { id: 'control' as const, label: 'İdarəetmə' },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className="flex-1 py-2 px-1 text-[11px] font-bold rounded-lg transition-all duration-200 cursor-pointer"
                  style={activeTab === tab.id
                    ? { background: 'rgba(0,212,255,0.14)', color: C.cyan, border: '1px solid rgba(0,212,255,0.25)' }
                    : { color: C.tLo, border: '1px solid transparent' }}
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
                    <h3 className="sec-label mb-4 flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5" style={{ color: C.cyan }} /> Performans Göstəriciləri (KPI)
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      <MiniKPI label="Throughput" value={simState.kpi.current_kpis.throughput_per_min} unit="maş/dəq" color="#0284c7" />
                      <MiniKPI label="Gecikmə" value={simState.kpi.current_kpis.avg_delay_s} unit="san" color="#ef4444" />
                      <MiniKPI label="Maks Növbə" value={simState.kpi.current_kpis.max_queue_length} unit="maşın" color="#f59e0b" />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <MiniKPI
                        label="CO₂ Emissiya"
                        value={simState.kpi.current_kpis.co2_rate_g_per_s !== undefined
                          ? (simState.kpi.current_kpis.co2_rate_g_per_s * 3.6).toFixed(0)
                          : '0'}
                        unit="kg/saat"
                        color="#00e59a"
                      />
                      <MiniKPI
                        label="Ümumi CO₂"
                        value={simState.kpi.current_kpis.total_co2_kg ?? 0}
                        unit="kg"
                        color="#00c87a"
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs font-semibold rounded-lg p-3" style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.08)', color: C.tMid }}>
                      <span>Tamamlanmış: <b style={{ color: C.tMidHi }}>{simState.kpi.summary.vehicles_completed}</b></span>
                      <span>Ort. Yol: <b style={{ color: C.tMidHi }}>{simState.kpi.summary.avg_travel_time}s</b></span>
                    </div>
                  </div>
                )}

                {/* LOS Section */}
                {simState.kpi?.current_kpis?.los_grade && simState.kpi.current_kpis.los_grade !== '?' && (() => {
                  const grade = simState.kpi.current_kpis.los_grade
                  const cfg = LOS_CONFIG[grade]
                  return (
                    <div className="modern-card p-5">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <Award className="w-4 h-4" /> Xidmət Səviyyəsi (HCM LOS)
                      </h3>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-5xl font-black border-2 shrink-0"
                          style={{ backgroundColor: cfg.bg, borderColor: cfg.border, color: cfg.color }}>
                          {grade}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-base font-bold text-slate-800 mb-1">{cfg.label}</div>
                          <div className="text-xs text-slate-500 leading-relaxed mb-2">{cfg.desc}</div>
                          <div className="text-xs font-semibold text-slate-500">
                            Gecikmə: <span className="text-slate-700 font-bold">{simState.kpi.current_kpis.avg_delay_s} san/nəq</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex rounded-lg overflow-hidden h-5">
                        {['A','B','C','D','E','F'].map(g => (
                          <div key={g} className="flex-1 flex items-center justify-center text-[10px] font-black transition-all"
                            style={{
                              backgroundColor: LOS_CONFIG[g].color,
                              color: '#fff',
                              opacity: grade === g ? 1 : 0.3,
                            }}>
                            {g}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}

                {/* Vehicle Types */}
                <div className="modern-card p-5">
                  <h3 className="sec-label mb-4">Nəqliyyat Tipləri</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(VEHICLE_TYPE_COLORS).map(([type, info]) => (
                      <div key={type} className="flex flex-col items-center p-2 rounded-xl" style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.09)' }}>
                        <span className="text-xl font-bold data-num" style={{ color: info.body }}>{typeCounts[type] || 0}</span>
                        <span className="text-[9px] font-bold uppercase mt-1 tracking-wide" style={{ color: info.body + 'bb' }}>{info.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="modern-card p-5">
                  <h3 className="sec-label mb-4">İşıqforlar</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 flex flex-col items-center p-3 rounded-xl" style={{ background: 'rgba(0,229,154,0.08)', border: '1px solid rgba(0,229,154,0.22)' }}>
                      <span className="text-3xl font-bold data-num" style={{ color: C.green }}>{greenLights}</span>
                      <span className="text-[10px] font-bold uppercase mt-1 tracking-wide" style={{ color: C.green + '99' }}>Yaşıl İşıq</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center p-3 rounded-xl" style={{ background: 'rgba(255,85,112,0.08)', border: '1px solid rgba(255,85,112,0.22)' }}>
                      <span className="text-3xl font-bold data-num" style={{ color: C.red }}>{simState.total_intersections - greenLights}</span>
                      <span className="text-[10px] font-bold uppercase mt-1 tracking-wide" style={{ color: C.red + '99' }}>Qırmızı/Sarı</span>
                    </div>
                  </div>
                </div>

                <div className="modern-card p-5">
                  <h3 className="sec-label mb-4">Sürət Göstəricisi</h3>
                  <div className="flex flex-col gap-2.5 text-xs font-semibold" style={{ color: C.tMid }}>
                    {[
                      { color: C.red, label: 'Dayanıb (<5 km/s)' },
                      { color: C.amber, label: 'Yavaş (5–20 km/s)' },
                      { color: C.cyan, label: 'Normal (20–45 km/s)' },
                      { color: C.green, label: 'Sürətli (>45 km/s)' },
                    ].map(({ color, label }) => (
                      <div key={label} className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}88` }} />
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* CHARTS TAB */}
            {activeTab === 'charts' && (
              <>
                {/* Real-time Speed Chart */}
                <div className="modern-card p-5">
                  <h3 className="sec-label mb-4 flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5" style={{ color: C.cyan }} /> Orta Sürət Dinamikası
                  </h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={simState.kpi?.snapshots || []}>
                      <defs>
                        <linearGradient id="speedGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                      <XAxis dataKey="time" tick={{ fontSize: 9, fill: C.tickFill, fontFamily: 'JetBrains Mono' }} tickFormatter={(v) => formatSimTime(v)} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: C.tickFill, fontFamily: 'JetBrains Mono' }} unit=" km/s" axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: C.tooltipBg, border: `1px solid ${C.tooltipBorder}`, borderRadius: 8, color: C.tooltipText, fontSize: 11 }} labelStyle={{ color: C.tMid }} formatter={(v: number) => [`${v} km/s`, 'Orta Sürət']} labelFormatter={(v) => `Vaxt: ${formatSimTime(v as number)}`} />
                      <Area type="monotone" dataKey="avg_speed_kmh" stroke={C.cyan} fill="url(#speedGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Throughput Chart */}
                <div className="modern-card p-5">
                  <h3 className="sec-label mb-4 flex items-center gap-2">
                    <BarChart3 className="w-3.5 h-3.5" style={{ color: C.amber }} /> Throughput & Gecikmə
                  </h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={simState.kpi?.snapshots || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                      <XAxis dataKey="time" tick={{ fontSize: 9, fill: C.tickFill, fontFamily: 'JetBrains Mono' }} tickFormatter={(v) => formatSimTime(v)} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="left" tick={{ fontSize: 9, fill: C.tickFill, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: C.tickFill, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: C.tooltipBg, border: `1px solid ${C.tooltipBorder}`, borderRadius: 8, color: C.tooltipText, fontSize: 11 }} labelStyle={{ color: C.tMid }} labelFormatter={(v) => `Vaxt: ${formatSimTime(v as number)}`} />
                      <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700, color: C.tMid }} />
                      <Line yAxisId="left" type="monotone" dataKey="throughput_per_min" name="Throughput (m/dəq)" stroke={C.green} strokeWidth={2} dot={false} />
                      <Line yAxisId="right" type="monotone" dataKey="avg_delay_s" name="Gecikmə (san)" stroke={C.red} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Comparison: Fixed vs Adaptive */}
                <div className="modern-card p-5" style={{ borderLeft: '3px solid #a855f7', boxShadow: '-2px 0 12px rgba(168,85,247,0.12)' }}>
                  <h3 className="sec-label mb-2 flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" style={{ color: C.purple }} /> Müqayisə: Sabit vs Adaptiv
                  </h3>
                  <p className="text-[11px] mb-4" style={{ color: C.tLo }}>
                    Əvvəlcə "Sabit" rejimə keçib bir müddət izləyin, sonra "Adaptiv" rejimə qayıdın. Fərqi burada görəcəksiniz.
                  </p>
                  
                  {(simState.kpi?.comparison?.fixed?.length > 0 || simState.kpi?.comparison?.adaptive?.length > 0) ? (
                    <>
                      {/* Speed comparison */}
                      <div className="mb-4">
                        <span className="sec-label">Orta Sürət Müqayisəsi</span>
                        <ResponsiveContainer width="100%" height={140}>
                          <LineChart>
                            <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                            <XAxis dataKey="time" tick={{ fontSize: 9, fill: C.tickFill, fontFamily: 'JetBrains Mono' }} tickFormatter={(v) => formatSimTime(v)}
                              type="number" domain={['dataMin', 'dataMax']} allowDuplicatedCategory={false} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 9, fill: C.tickFill, fontFamily: 'JetBrains Mono' }} unit=" km/s" axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: C.tooltipBg, border: `1px solid ${C.tooltipBorder}`, borderRadius: 8, color: C.tooltipText, fontSize: 11 }} labelStyle={{ color: C.tMid }} labelFormatter={(v) => `Vaxt: ${formatSimTime(v as number)}`} />
                            <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700, color: C.tMid }} />
                            <Line data={simState.kpi.comparison.fixed} dataKey="avg_speed_kmh" name="Sabit" stroke="#4a6a9a" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                            <Line data={simState.kpi.comparison.adaptive} dataKey="avg_speed_kmh" name="Adaptiv" stroke={C.cyan} strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Delay comparison */}
                      <div>
                        <span className="sec-label">Gecikmə Müqayisəsi</span>
                        <ResponsiveContainer width="100%" height={140}>
                          <LineChart>
                            <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                            <XAxis dataKey="time" tick={{ fontSize: 9, fill: C.tickFill, fontFamily: 'JetBrains Mono' }} tickFormatter={(v) => formatSimTime(v)}
                              type="number" domain={['dataMin', 'dataMax']} allowDuplicatedCategory={false} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 9, fill: C.tickFill, fontFamily: 'JetBrains Mono' }} unit=" s" axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: C.tooltipBg, border: `1px solid ${C.tooltipBorder}`, borderRadius: 8, color: C.tooltipText, fontSize: 11 }} labelStyle={{ color: C.tMid }} labelFormatter={(v) => `Vaxt: ${formatSimTime(v as number)}`} />
                            <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700, color: C.tMid }} />
                            <Line data={simState.kpi.comparison.fixed} dataKey="avg_delay_s" name="Sabit" stroke="#4a6a9a" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                            <Line data={simState.kpi.comparison.adaptive} dataKey="avg_delay_s" name="Adaptiv" stroke={C.red} strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-xs py-8 rounded-xl" style={{ color: C.tLo, background: 'rgba(0,212,255,0.03)', border: '1px dashed rgba(0,212,255,0.12)' }}>
                      Hələ müqayisə verisi yoxdur.<br/>Əvvəlcə hər iki rejimi işlədin.
                    </div>
                  )}

                  <button onClick={resetComparison}
                    className="modern-btn w-full mt-4 py-2 text-xs font-bold rounded-lg cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.03)', color: C.tMid, border: '1px solid rgba(0,212,255,0.12)' }}
                  >
                    Müqayisə Verisini Sıfırla
                  </button>
                </div>

                {/* Active Count Chart */}
                <div className="modern-card p-5">
                  <h3 className="sec-label mb-4 flex items-center gap-2">
                    <Car className="w-3.5 h-3.5" style={{ color: C.green }} /> Aktiv Maşın Sayı
                  </h3>
                  <ResponsiveContainer width="100%" height={140}>
                    <AreaChart data={simState.kpi?.snapshots || []}>
                      <defs>
                        <linearGradient id="countGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00e59a" stopOpacity={0.22} />
                          <stop offset="95%" stopColor="#00e59a" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                      <XAxis dataKey="time" tick={{ fontSize: 9, fill: C.tickFill, fontFamily: 'JetBrains Mono' }} tickFormatter={(v) => formatSimTime(v)} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: C.tickFill, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: C.tooltipBg, border: `1px solid ${C.tooltipBorder}`, borderRadius: 8, color: C.tooltipText, fontSize: 11 }} labelStyle={{ color: C.tMid }} labelFormatter={(v) => `Vaxt: ${formatSimTime(v as number)}`} />
                      <Area type="monotone" dataKey="active_count" stroke={C.green} fill="url(#countGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* CO2 Emission Chart */}
                <div className="modern-card p-5" style={{ borderLeft: '3px solid #00e59a', boxShadow: '-2px 0 12px rgba(0,229,154,0.1)' }}>
                  <h3 className="sec-label mb-1 flex items-center gap-2">
                    🌿 CO₂ Emissiya Dinamikası
                  </h3>
                  <p className="text-[10px] mb-3" style={{ color: C.tLo }}>
                    COPERT sadələşdirilmiş modeli (Ntziachristos & Samaras, 2016) — anlıq emissiya sürəti
                  </p>
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={(simState.kpi?.snapshots || []).map(s => ({
                      ...s,
                      co2_kg_per_hr: s.co2_rate_g_per_s !== undefined ? +(s.co2_rate_g_per_s * 3.6).toFixed(1) : 0
                    }))}>
                      <defs>
                        <linearGradient id="co2Grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00e59a" stopOpacity={0.22} />
                          <stop offset="95%" stopColor="#00e59a" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                      <XAxis dataKey="time" tick={{ fontSize: 9, fill: C.tickFill, fontFamily: 'JetBrains Mono' }} tickFormatter={(v) => formatSimTime(v)} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: C.tickFill, fontFamily: 'JetBrains Mono' }} unit=" kg/h" axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: C.tooltipBg, border: `1px solid ${C.tooltipBorder}`, borderRadius: 8, color: C.tooltipText, fontSize: 11 }} labelStyle={{ color: C.tMid }} formatter={(v: number) => [`${v} kg/saat`, 'CO₂']} labelFormatter={(v) => `Vaxt: ${formatSimTime(v as number)}`} />
                      <Area type="monotone" dataKey="co2_kg_per_hr" stroke={C.green} fill="url(#co2Grad)" strokeWidth={2} name="CO₂ kg/saat" />
                    </AreaChart>
                  </ResponsiveContainer>

                  {/* Comparison: Fixed vs Adaptive CO2 */}
                  {(simState.kpi?.comparison?.fixed?.length > 0 || simState.kpi?.comparison?.adaptive?.length > 0) && (
                    <div className="mt-4">
                      <span className="sec-label">CO₂ Müqayisəsi: Sabit vs Adaptiv</span>
                      <ResponsiveContainer width="100%" height={130}>
                        <LineChart>
                          <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                          <XAxis dataKey="time" tick={{ fontSize: 9, fill: C.tickFill, fontFamily: 'JetBrains Mono' }} tickFormatter={(v) => formatSimTime(v)}
                            type="number" domain={['dataMin', 'dataMax']} allowDuplicatedCategory={false} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 9, fill: C.tickFill, fontFamily: 'JetBrains Mono' }} unit=" g/s" axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ background: C.tooltipBg, border: `1px solid ${C.tooltipBorder}`, borderRadius: 8, color: C.tooltipText, fontSize: 11 }} labelStyle={{ color: C.tMid }} labelFormatter={(v) => `Vaxt: ${formatSimTime(v as number)}`} />
                          <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700, color: C.tMid }} />
                          <Line data={simState.kpi.comparison.fixed} dataKey="co2_rate_g_per_s" name="Sabit" stroke="#4a6a9a" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                          <Line data={simState.kpi.comparison.adaptive} dataKey="co2_rate_g_per_s" name="Adaptiv" stroke={C.green} strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* CONGESTION TAB */}
            {activeTab === 'congestion' && (
              <>
                <h3 className="sec-label px-1">Ən Sıx Yollar</h3>
                {simState.edge_congestion.length === 0 && (
                  <div className="modern-card p-8 text-center text-xs font-semibold" style={{ color: C.tLo }}>Hələ məlumat yoxdur</div>
                )}
                {simState.edge_congestion.map((ec) => {
                  const maxVehicles = Math.max(...simState.edge_congestion.map(e => e.vehicle_count), 1)
                  const pct = (ec.vehicle_count / maxVehicles) * 100
                  let barColor = C.green
                  let trackBg = 'rgba(0,229,154,0.1)'
                  if (ec.avg_speed_kmh < 10){ barColor = C.red; trackBg = 'rgba(255,85,112,0.1)' }
                  else if (ec.avg_speed_kmh < 25){ barColor = C.amber; trackBg = 'rgba(255,160,64,0.1)' }
                  else if (ec.avg_speed_kmh < 40){ barColor = C.cyan; trackBg = 'rgba(0,212,255,0.1)' }

                  return (
                    <div key={ec.id} className="modern-card p-4">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-sm font-bold truncate max-w-[200px]" style={{ color: C.tMidHi }} title={ec.name}>
                          {ec.name || ec.id.substring(0, 15) + '...'}
                        </span>
                        <span className="text-[10px] font-bold data-num px-2 py-0.5 rounded-md" style={{ background: 'rgba(0,212,255,0.08)', color: C.tMid }}>{ec.length_m.toFixed(0)}m</span>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5" style={{ color: C.tLo }} />
                          <span className="text-xs font-semibold data-num" style={{ color: C.tMid }}>{ec.vehicle_count} nəq.</span>
                        </div>
                        <div className="text-xs font-bold data-num" style={{ color: barColor }}>{ec.avg_speed_kmh} km/s</div>
                      </div>

                      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: trackBg }}>
                        <div className="congestion-bar h-full rounded-full" style={{ width: `${pct}%`, background: barColor, boxShadow: `0 0 6px ${barColor}66` }}></div>
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
                <div className="modern-card p-5" style={{ borderLeft: '3px solid #a855f7' }}>
                  <h3 className="sec-label mb-3 flex items-center gap-2">
                    <Timer className="w-3.5 h-3.5" style={{ color: C.purple }} /> Ssenari Rejimi
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {(simState.scenario?.scenarios || []).map(sc => (
                      <button key={sc.id} onClick={() => setScenario(sc.id)}
                        className="modern-btn p-3 rounded-xl text-left cursor-pointer transition-all"
                        style={sc.active
                          ? { background: 'rgba(168,85,247,0.15)', border: '2px solid rgba(168,85,247,0.5)', color: '#d8b4fe' }
                          : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,212,255,0.1)', color: C.tMid }}
                      >
                        <div className="text-lg mb-1">{SCENARIO_ICONS[sc.id] || '📍'}</div>
                        <div className="text-xs font-bold" style={{ color: sc.active ? '#d8b4fe' : C.tMidHi }}>{sc.name_en}</div>
                        <div className="text-[10px] mt-0.5 data-num" style={{ color: C.tLo }}>{sc.max_vehicles} maşın · {sc.spawn_interval}s</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Control */}
                <div className="modern-card p-5" style={{ borderLeft: '3px solid #00d4ff' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg" style={{ background: 'rgba(0,212,255,0.12)', color: C.cyan }}><Zap className="w-4 h-4" /></div>
                      <span className="font-bold text-sm" style={{ color: C.tHi }}>Süni İntellekt (AI) Rejimi</span>
                    </div>
                    <span className="text-[10px] px-2.5 py-1 rounded-full font-bold"
                      style={adaptiveCount > 0
                        ? { background: 'rgba(0,229,154,0.12)', color: C.green, border: '1px solid rgba(0,229,154,0.3)' }
                        : { background: 'rgba(255,85,112,0.1)', color: C.red, border: '1px solid rgba(255,85,112,0.3)' }}>
                      {adaptiveCount > 0 ? 'AKTİV' : 'QAPALI'}
                    </span>
                  </div>
                  <p className="text-xs mb-4 leading-relaxed" style={{ color: C.tLo }}>
                    <b style={{ color: C.tMid }}>Sıraya-Mütənasib Yaşıl İşıq:</b> Real-vaxt tıxaca görə yaşıl işıq müddətini avtomatik tənzimləyir.
                  </p>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => toggleAdaptiveAll(true)}
                      className="modern-btn w-full py-2.5 text-xs font-bold rounded-lg cursor-pointer"
                      style={{ background: 'rgba(0,212,255,0.15)', color: C.cyan, border: '1px solid rgba(0,212,255,0.3)' }}>
                      Bütün Kəsişmələri Aktivləşdir (S.İ.)
                    </button>
                    <button onClick={() => toggleAdaptiveAll(false)}
                      className="modern-btn w-full py-2.5 text-xs font-bold rounded-lg cursor-pointer"
                      style={{ background: 'rgba(255,255,255,0.03)', color: C.tMid, border: '1px solid rgba(0,212,255,0.1)' }}>
                      Sabit Rejimə Qayıt
                    </button>
                  </div>
                </div>

                {/* Green Wave */}
                <div className="modern-card p-5" style={{ borderLeft: '3px solid #00e59a' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🌊</span>
                      <span className="font-bold text-sm" style={{ color: C.tHi }}>Yaşıl Dalğa</span>
                    </div>
                    <span className="text-[10px] px-2.5 py-1 rounded-full font-bold"
                      style={simState.green_wave?.active
                        ? { background: 'rgba(0,229,154,0.12)', color: C.green, border: '1px solid rgba(0,229,154,0.3)' }
                        : { background: 'rgba(255,255,255,0.04)', color: C.tLo, border: '1px solid rgba(0,212,255,0.1)' }}>
                      {simState.green_wave?.active ? 'AKTİV' : 'QAPALI'}
                    </span>
                  </div>
                  <p className="text-xs mb-2 leading-relaxed" style={{ color: C.tLo }}>
                    Koridor boyunca işıqforları sinxronlaşdırır — 50 km/s sürətdə hər işıqfor yaşıl olur.
                  </p>
                  <p className="text-[10px] mb-3 data-num" style={{ color: C.tLo }}>
                    Koridorlar: <b style={{ color: C.tMid }}>{simState.green_wave?.corridors_count || 0}</b>
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => toggleGreenWave(true)}
                      className="modern-btn flex-1 py-2 text-xs font-bold rounded-lg cursor-pointer"
                      style={{ background: 'rgba(0,229,154,0.15)', color: C.green, border: '1px solid rgba(0,229,154,0.3)' }}>
                      Aktivləşdir
                    </button>
                    <button onClick={() => toggleGreenWave(false)}
                      className="modern-btn flex-1 py-2 text-xs font-bold rounded-lg cursor-pointer"
                      style={{ background: 'rgba(255,255,255,0.03)', color: C.tMid, border: '1px solid rgba(0,212,255,0.1)' }}>
                      Söndür
                    </button>
                  </div>
                </div>

                {/* Settings */}
                <h3 className="sec-label mt-2 px-1">Tənzimləmələr</h3>
                <div className="modern-card p-5">
                  <div className="flex flex-col gap-3 text-xs font-semibold" style={{ color: C.tMid }}>
                    {[
                      { label: 'Yenilənmə Aralığı', value: `${simState.adaptive_controller.update_interval} san` },
                      { label: 'Min. Yaşıl İşıq',   value: `${simState.adaptive_controller.min_green} san` },
                      { label: 'Maks. Yaşıl İşıq',  value: `${simState.adaptive_controller.max_green} san` },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between pb-2.5" style={{ borderBottom: '1px solid rgba(0,212,255,0.07)' }}>
                        <span>{label}</span>
                        <span className="data-num font-bold" style={{ color: C.tMidHi }}>{value}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between">
                      <span>Adaptiv Kəsişmələr</span>
                      <span className="data-num font-bold" style={{ color: C.cyan }}>{adaptiveCount} / {simState.total_intersections}</span>
                    </div>
                  </div>
                </div>

                <h3 className="sec-label mt-2 px-1">Kəsişmələr Paneli</h3>
                {simState.traffic_lights.map(tl => {
                  const states = Object.values(tl.edge_states)
                  const hasGreen = states.includes('Green')
                  return (
                    <div key={tl.node_id} className="modern-card p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{
                            backgroundColor: hasGreen ? '#00e59a' : '#ff5570',
                            boxShadow: hasGreen ? '0 0 6px #00e59a88' : '0 0 6px #ff557088'
                          }}></div>
                          <span className="text-xs font-bold data-num" style={{ color: C.tMid }}>
                            {tl.node_id.substring(0, 10)}
                          </span>
                        </div>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full"
                          style={tl.mode === 'adaptive'
                            ? { background: 'rgba(0,212,255,0.1)', color: C.cyan, border: '1px solid rgba(0,212,255,0.25)' }
                            : tl.mode === 'flash_yellow'
                            ? { background: 'rgba(255,160,64,0.1)', color: C.amber, border: '1px solid rgba(255,160,64,0.3)' }
                            : { background: 'rgba(255,255,255,0.04)', color: C.tLo, border: '1px solid rgba(0,212,255,0.1)' }}>
                          {tl.mode === 'adaptive' ? 'S.İ.' : tl.mode === 'flash_yellow' ? 'Gecə' : 'Sabit'}
                        </span>
                      </div>
                      <div className="flex text-[10px] font-semibold rounded-lg overflow-hidden divide-x"
                        style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.08)', borderColor: 'rgba(0,212,255,0.08)', color: C.tMid }}>
                        <span className="px-2 py-1.5 flex-1 text-center">Faza {tl.phase_index + 1}/{tl.total_phases}</span>
                        <span className="px-2 py-1.5 flex-1 text-center data-num" style={{ color: C.tMidHi }}><b>{tl.time_left}</b>s</span>
                        {tl.los_grade && (
                          <span className="px-2 py-1.5 flex-1 text-center font-black"
                            style={{ color: LOS_CONFIG[tl.los_grade]?.color || '#7090b8' }}>
                            LOS {tl.los_grade}
                          </span>
                        )}
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
          <div className="fixed inset-0 z-9999 flex items-center justify-center backdrop-blur-sm" style={{ background: 'rgba(4,8,20,0.82)' }} onClick={() => setSelectedTL(null)}>
            <div className="relative w-[90vw] max-w-[900px] h-[75vh] rounded-2xl overflow-hidden flex flex-col" style={{ background: C.bgDeep, border: `1px solid ${C.bMd}`, boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 40px rgba(0,212,255,0.06)' }} onClick={e => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-3.5 shrink-0" style={{ background: C.headerBg, borderBottom: `1px solid ${C.bSm}` }}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ background: 'rgba(0,212,255,0.12)', color: C.cyan }}>
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm" style={{ color: C.tHi }}>Kəsişmə Kamerası — 3D Görüntü</h2>
                    <p className="text-[11px] data-num mt-0.5" style={{ color: C.tLo }}>ID: {liveTL.node_id.substring(0, 14)}… · {liveTL.lat.toFixed(5)}, {liveTL.lng.toFixed(5)}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedTL(null)} className="p-2 rounded-lg cursor-pointer transition-colors" style={{ color: C.tLo }}
                  onMouseEnter={e => (e.currentTarget.style.color = C.tHi)}
                  onMouseLeave={e => (e.currentTarget.style.color = C.tLo)}>
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

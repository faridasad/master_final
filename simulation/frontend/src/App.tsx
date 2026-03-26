import { useEffect, useState, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Radio, Cpu, Car, Gauge, BarChart3, TrafficCone, Zap, Play, Pause, MapPin } from 'lucide-react'

// ---------- Types ----------

interface VehicleData {
  id: string; lane: string; position: number; speed: number; acceleration: number
  lat: number; lng: number; bearing: number
}

interface TrafficLightData {
  node_id: string; lat: number; lng: number
  edge_states: Record<string, string>
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

interface SimulationState {
  center: { lat: number; lng: number }
  vehicles: VehicleData[]
  traffic_lights: TrafficLightData[]
  edge_congestion: EdgeCongestion[]
  adaptive_controller: AdaptiveData
  status: string
  active_count: number
  total_edges: number
  total_nodes: number
  total_intersections: number
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

      // Modern solid colors per speed
      let color = '#0284c7' // Primary blue (Normal 20-45)
      if (speedKmh < 5) color = '#ef4444' // Red (Stopped <5)
      else if (speedKmh < 20) color = '#f59e0b' // Amber (Slow 5-20)
      else if (speedKmh > 45) color = '#10b981' // Green (Fast >45)

      const brakeColor = isBraking ? '#ef4444' : 'rgba(255,255,255,0.2)'
      const rotation = v.bearing - 90

      const carSvg = `
        <div class="car-svg" style="--car-color: ${color}; transform: rotate(${rotation}deg); transition: transform 0.1s linear;">
          <svg width="22" height="12" viewBox="0 0 22 12" xmlns="http://www.w3.org/2000/svg">
            <rect class="car-body-fill" x="2" y="1" width="18" height="10" rx="3" ry="3" style="fill:${color}"/>
            <rect class="car-outline" x="2" y="1" width="18" height="10" rx="3" ry="3"/>
            <rect class="car-window" x="12" y="2.5" width="4.5" height="7" rx="1.5"/>
            <rect class="car-window" x="4.5" y="3" width="3.5" height="6" rx="1"/>
            <rect x="19" y="2" width="2" height="2" rx="0.5" fill="#f8fafc"/>
            <rect x="19" y="8" width="2" height="2" rx="0.5" fill="#f8fafc"/>
            <rect x="1" y="2.5" width="2" height="2" rx="0.5" fill="${brakeColor}"/>
            <rect x="1" y="7.5" width="2" height="2" rx="0.5" fill="${brakeColor}"/>
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
            const tails = wrapper.querySelectorAll('rect[fill]')
            tails.forEach((r, i) => {
              if (i >= 4) (r as SVGElement).setAttribute('fill', brakeColor)
            })
          }
        }
      } else {
        const carIcon = L.divIcon({
          className: 'vehicle-marker',
          html: carSvg,
          iconSize: [22, 12],
          iconAnchor: [11, 6]
        })

        const marker = L.marker([v.lat, v.lng], { icon: carIcon, interactive: true })
        marker.bindTooltip(
          `<div class="flex flex-col gap-1">
             <span class="text-slate-500 text-[10px] uppercase">Avtomobil ${v.id}</span>
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

function TrafficLightLayer({ trafficLights }: { trafficLights: TrafficLightData[] }) {
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

      const modeStr = tl.mode === 'adaptive' ? 'Süni İntellekt' : 'Sabit'
      const iconStr = tl.mode === 'adaptive' ? '✨' : '⏱️'

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
           </div>`,
          { direction: 'top', offset: [0, -10], className: 'tl-tooltip' }
        )
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

// ---------- Main App ----------

function App() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || ''
  const WS_BASE = import.meta.env.VITE_WS_BASE_URL || ''

  const [wsStatus, setWsStatus] = useState('Əlaqə kəsilib')
  const [simState, setSimState] = useState<SimulationState>({
    center: { lat: 40.4000, lng: 49.8525 },
    vehicles: [], traffic_lights: [], edge_congestion: [],
    adaptive_controller: { enabled: true, update_interval: 30, min_green: 8, max_green: 45 },
    status: 'Dayandırılıb', active_count: 0, total_edges: 0, total_nodes: 0, total_intersections: 0
  })
  const [activeTab, setActiveTab] = useState<'analytics' | 'congestion' | 'control'>('analytics')

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

  const avgSpeedKmh = simState.vehicles.length > 0
    ? (simState.vehicles.reduce((a, v) => a + v.speed, 0) / simState.vehicles.length * 3.6).toFixed(1)
    : '0.0'
  
  const maxSpeed = simState.vehicles.length > 0
    ? (Math.max(...simState.vehicles.map(v => v.speed)) * 3.6).toFixed(1)
    : '0.0'

  const stoppedCount = simState.vehicles.filter(v => v.speed * 3.6 < 5).length
  const greenLights = simState.traffic_lights.filter(tl => Object.values(tl.edge_states).includes('Green')).length
  const adaptiveCount = simState.traffic_lights.filter(tl => tl.mode === 'adaptive').length

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
        <div className="flex items-center gap-4">
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
        {/* Map - Using a clean, light base map */}
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
            <TrafficLightLayer trafficLights={simState.traffic_lights} />
          </MapContainer>
        </div>

        {/* Sidebar */}
        <div className="w-[360px] shrink-0 bg-slate-50 border-l border-slate-200 flex flex-col overflow-hidden shadow-[-4px_0_15px_rgba(0,0,0,0.02)] z-10">
          {/* Tabs */}
          <div className="flex flex-col p-4 bg-white border-b border-slate-200 shrink-0 gap-3">
            <h2 className="text-sm font-bold text-slate-800 px-1">Göstəricilər Paneli</h2>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {[
                { id: 'analytics' as const, label: 'Analitika' },
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

                <div className="modern-card p-5 mt-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4">Svetofor Düsturları</h3>
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

            {/* CONGESTION TAB */}
            {activeTab === 'congestion' && (
              <>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widepx-1">Ən Sıx Yollar</h3>
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
                <div className="modern-card p-5 border-l-4 border-l-sky-500 mb-2">
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
                          ${tl.mode === 'adaptive' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {tl.mode === 'adaptive' ? 'S.İ.' : 'Sabit'}
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
    </div>
  )
}

export default App

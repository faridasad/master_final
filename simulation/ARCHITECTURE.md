# Simulyasiya Arxitekturası

Bakı trafik rəqəmsal əkizi (digital twin) simulyasiyasının ümumi sxematik görünüşü.

- **Backend:** Python + FastAPI + asyncio (fizika 50 Hz, broadcast 10 Hz)
- **Frontend:** React 19 + TypeScript + Leaflet + Recharts
- **Rabitə:** WebSocket (real-vaxt vəziyyət) + REST (idarəetmə)

---

## 1. Yüksək Səviyyəli Arxitektura

İstifadəçi, frontend, backend və daxili modulların əlaqəsi.

```mermaid
graph LR
    User([İstifadəçi<br/>Browser])

    subgraph Frontend["Frontend (React + Vite, :5173)"]
        App[App.tsx<br/>Dashboard]
        Map[Leaflet Xəritə]
        Charts[Recharts KPI Qrafikləri]
        Controls[Senari / Adaptive / Green Wave<br/>İdarəetmə Paneli]
    end

    subgraph Backend["Backend (FastAPI, :8000)"]
        REST[REST API<br/>/api/*]
        WS[WebSocket<br/>/ws]
        Loop[simulation_loop<br/>asyncio task]

        subgraph Engine["SimulationEngine (core/engine.py)"]
            Vehicles[Vehicle siyahısı<br/>IDM dinamikası]
            Lights[İşıqfor siyahısı<br/>IntersectionTrafficLight]
            Adapt[AdaptiveController<br/>30s yenilənmə]
            GW[GreenWaveController]
            Scen[ScenarioManager]
            KPI[KPICollector<br/>5s snapshot]
        end
    end

    Data[(baku_map.json<br/>nodes + edges)]

    User -->|HTTP idarəetmə| REST
    User -->|WS abunəlik| WS
    REST --> Engine
    Loop -->|state broadcast 10Hz| WS
    WS -->|JSON state| App
    App --> Map
    App --> Charts
    App --> Controls
    Controls -->|POST| REST

    Loop -->|step dt=20ms| Engine
    Engine --> Vehicles
    Engine --> Lights
    Engine --> Adapt
    Engine --> GW
    Engine --> Scen
    Engine --> KPI
    Data -->|yüklənmə| Engine

    classDef ext fill:#e1f5ff,stroke:#0288d1
    classDef fe fill:#fff3e0,stroke:#f57c00
    classDef be fill:#f3e5f5,stroke:#7b1fa2
    classDef eng fill:#e8f5e9,stroke:#388e3c
    classDef data fill:#fce4ec,stroke:#c2185b
    class User ext
    class App,Map,Charts,Controls fe
    class REST,WS,Loop be
    class Vehicles,Lights,Adapt,GW,Scen,KPI eng
    class Data data
```

> PNG: [diagrams/01_architecture.png](diagrams/01_architecture.png)

---

## 2. Simulyasiya Tick Loop (bir addımın daxili axını)

`SimulationEngine.step(dt)` metodunun ardıcıllığı — hər 20 ms-də bir.

```mermaid
flowchart TD
    Start([Tick başlanır<br/>dt = 20 ms]) --> Clock[sim_clock += dt]
    Clock --> SpawnCheck{spawn_timer ><br/>spawn_interval?}
    SpawnCheck -->|Bəli| Spawn[1–3 yeni avtomobil əlavə et<br/>add_vehicle]
    SpawnCheck -->|Xeyr| TLStep
    Spawn --> TLStep[Hər işıqforu addımla<br/>tl.step dt]
    TLStep --> AdaptStep[AdaptiveController.step<br/>30s-də bir növbə uzunluğunu yenilə]
    AdaptStep --> EdgeLoop{Hər edge üçün}

    EdgeLoop --> TLInfo[Edge sonu üçün<br/>işıqforu məsafəsi və vəziyyəti]
    TLInfo --> VehLoop{Hər avtomobil üçün}
    VehLoop --> IDM[vehicle.update<br/>IDM: lider + işıqfor]
    IDM --> KPIRec[KPI: tick, dayanma,<br/>sürət qeyd et]
    KPIRec --> VehLoop
    VehLoop -->|Hamısı tamam| Transfer{Edge sonuna çatdı?}
    Transfer -->|Bəli + yaşıl| MoveNext[transfer_vehicle<br/>növbəti edge-ə keç]
    Transfer -->|Bəli + qırmızı/sarı| Hold[Kəsişmədə dayan<br/>speed = 0]
    Transfer -->|Xeyr| Keep[Eyni edge-də qal]
    MoveNext --> EdgeLoop
    Hold --> EdgeLoop
    Keep --> EdgeLoop

    EdgeLoop -->|Bütün edge-lər| KPIStep[KPICollector.step<br/>orta sürət, növbə uzunluqları,<br/>rejim fixed/adaptive]
    KPIStep --> End([Tick bitdi])

    classDef io fill:#e1f5ff,stroke:#0288d1
    classDef proc fill:#e8f5e9,stroke:#388e3c
    classDef dec fill:#fff3e0,stroke:#f57c00
    class Start,End io
    class Clock,Spawn,TLStep,AdaptStep,TLInfo,IDM,KPIRec,MoveNext,Hold,Keep,KPIStep proc
    class SpawnCheck,EdgeLoop,VehLoop,Transfer dec
```

> PNG: [diagrams/02_tick_loop.png](diagrams/02_tick_loop.png)

---

## 3. Məlumat Axını (Inputs → Processing → Outputs)

Konfiqurasiyadan istifadəçi ekranına qədər məlumat hərəkəti.

```mermaid
flowchart LR
    subgraph Inputs["GİRİŞLƏR"]
        Map[baku_map.json<br/>node + edge]
        Conf[Senari konfiqi<br/>peak/normal/night/stress]
        Cmd[REST əmrləri<br/>adaptive, green-wave, phase]
    end

    subgraph Processing["EMAL — SimulationEngine"]
        Phys[Vehicle Fizikası<br/>IDM: a_max, b, T, s0, v0]
        TL[İşıqforu növbələri<br/>fixed / adaptive / flash]
        AC[Adaptive Control<br/>növbə uzunluğuna görə yaşıl]
        GWp[Green Wave<br/>koridor offset hesablanması]
        KPIa[KPI Aggregation<br/>delay, throughput, queue]
    end

    subgraph Outputs["NƏTİCƏLƏR"]
        WSout[WebSocket state 10Hz<br/>vehicles, lights, congestion]
        RESTout[REST /api/kpi<br/>snapshot tarixçəsi]
        UI[Dashboard UI<br/>xəritə + qrafiklər]
    end

    Map --> Phys
    Map --> TL
    Conf --> Phys
    Conf --> TL
    Cmd --> AC
    Cmd --> GWp
    Cmd --> TL

    Phys --> KPIa
    TL --> KPIa
    AC --> TL
    GWp --> TL

    Phys --> WSout
    TL --> WSout
    KPIa --> WSout
    KPIa --> RESTout

    WSout --> UI
    RESTout --> UI

    classDef inp fill:#fce4ec,stroke:#c2185b
    classDef prc fill:#e8f5e9,stroke:#388e3c
    classDef out fill:#e1f5ff,stroke:#0288d1
    class Map,Conf,Cmd inp
    class Phys,TL,AC,GWp,KPIa prc
    class WSout,RESTout,UI out
```

> PNG: [diagrams/03_data_flow.png](diagrams/03_data_flow.png)

---

## 4. Frontend ↔ Backend Sequence

İstifadəçinin senari dəyişməsi və canlı state alması ssenarisi.

```mermaid
sequenceDiagram
    actor U as İstifadəçi
    participant FE as Frontend
    participant API as FastAPI REST
    participant ENG as SimulationEngine
    participant SIM as simulation_loop
    participant WS as WebSocket

    Note over SIM: Backend startup-da<br/>asyncio task kimi başlayır

    U->>FE: Səhifəni aç
    FE->>WS: WebSocket bağlantısı
    WS-->>FE: accept

    loop Hər 100 ms - 10 Hz
        SIM->>ENG: step dt=20ms (x5)
        ENG-->>SIM: daxili vəziyyət yenilənir
        SIM->>ENG: get_state()
        ENG-->>SIM: JSON state
        SIM->>WS: send_text state
        WS-->>FE: state payload
        FE->>FE: xəritə + qrafiklər render
    end

    U->>FE: Peak Hour senarisini seç
    FE->>API: POST /api/scenario/set
    API->>ENG: scenario_manager.apply_scenario
    ENG-->>API: success
    API-->>FE: result
    Note over SIM,FE: növbəti WS broadcast-da<br/>yeni spawn_interval və limitlər görsənir

    U->>FE: Green Wave tətbiq et
    FE->>API: POST /api/green-wave/apply
    API->>ENG: green_wave.apply_green_wave
    ENG-->>API: offset cədvəli
    API-->>FE: success + corridor info
```

> PNG: [diagrams/04_sequence.png](diagrams/04_sequence.png)

---

## Modul Cədvəli (sürətli istinad)

| Modul | Fayl | Məsuliyyət |
|-------|------|-----------|
| SimulationEngine | `backend/core/engine.py` | Master orkestrator: spawn, step, KPI, kəsişmələr |
| Vehicle (IDM) | `backend/models/vehicle.py` | Car-following dinamikası, işıqfora reaksiya |
| IntersectionTrafficLight | `backend/models/traffic_light.py` | Faza dövriyyəsi (fixed/adaptive/flash) |
| AdaptiveController | `backend/core/adaptive_controller.py` | Növbə uzunluğuna görə yaşıl vaxtı paylama (30s-də bir) |
| GreenWaveController | `backend/core/green_wave.py` | Koridorları aşkar et, faza offset-i tətbiq et |
| ScenarioManager | `backend/core/scenario_manager.py` | Peak/Normal/Night/Stress profilləri |
| KPICollector | `backend/core/kpi_collector.py` | delay, throughput, travel time, 5s snapshot |
| FastAPI App | `backend/main.py` | REST endpoints + WebSocket + simulation_loop |
| React App | `frontend/src/App.tsx` | Dashboard, xəritə, qrafiklər, idarəetmə |

---

## Diaqramları PNG kimi yeniləmək

```bash
cd simulation
npx -p @mermaid-js/mermaid-cli mmdc -i ARCHITECTURE.md -o diagrams/architecture.png
```

Hər diaqram üçün ayrıca `.mmd` fayl da `diagrams/` qovluğunda saxlanılır (yenidən render üçün).

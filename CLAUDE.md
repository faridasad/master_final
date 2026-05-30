# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Master's dissertation project for AzTU (Azerbaijan Technical University). Topic: **Computer modeling of traffic flows in urban transport systems and development of a web-based simulation environment (Baku city case study)**.

The codebase has two parts:
1. **Dissertation documents** — Azerbaijani-language `.md` / `.docx` files in the root
2. **Simulation system** — a digital twin of Baku's road network in `simulation/`

---

## Simulation: Running the System

Both backend and frontend must run simultaneously.

### Backend (FastAPI + WebSocket)

```bash
cd simulation/backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

The venv is already set up. `baku_map.json` must be present in `simulation/backend/` — the engine loads it at startup.

### Frontend (React + Vite)

```bash
cd simulation/frontend
npm run dev
```

Dev server proxies to `http://localhost:8000` (configured in `.env.development`).

### Build for production

```bash
cd simulation/frontend
npm run build       # outputs to dist/
npm run lint        # ESLint check
```

---

## Architecture

### Backend (`simulation/backend/`)

**Entry point:** `main.py` — FastAPI app with REST endpoints and a WebSocket at `/ws`.

Simulation runs as a background `asyncio` task at **50 Hz physics** (20 ms steps), broadcasting state to all WebSocket clients at **10 Hz** (every 100 ms).

**Core modules (`core/`):**
- `engine.py` — `SimulationEngine`: owns all state (vehicles, edges, traffic lights). Loads `baku_map.json`, auto-detects intersections (nodes with ≥2 incoming edges), runs the tick loop. Central hub that all other modules plug into.
- `adaptive_controller.py` — Queue-proportional green-time allocation. Re-evaluates every 30 s; adjusts phase durations between 8–45 s based on per-edge vehicle counts.
- `green_wave.py` — Detects linear road corridors and offsets traffic light phases so vehicles hitting the speed target (default 50 km/h) get a green wave.
- `kpi_collector.py` — Snapshots avg speed, stopped vehicles, queue lengths, and trip times every 5 s. Tracks fixed vs. adaptive mode separately for comparison experiments.
- `scenario_manager.py` — Named traffic scenarios (peak, normal, night, stress) that alter spawn rates and vehicle mix.
- `map_loader.py` — Utility for loading/validating `baku_map.json`.

**Models (`models/`):**
- `vehicle.py` — IDM (Intelligent Driver Model) car-following physics. Four vehicle types: car, SUV, bus, truck — each with distinct length, acceleration, deceleration, and speed-factor parameters.
- `traffic_light.py` — `IntersectionTrafficLight`: per-intersection phase state machine (Green → Yellow → Red). Supports `fixed`, `adaptive`, and `flash_yellow` modes.

**Map data:** `baku_map.json` — nodes (lat/lng) and directed edges (id, u, v, length\_m, maxspeed\_kmh, lanes, name). Two cached OSM query results in `cache/`.

### Frontend (`simulation/frontend/`)

React 19 + TypeScript + Vite + Tailwind CSS 4.

**Key libraries:** `react-leaflet` (map), `leaflet.heat` (heatmap overlay), `three.js` (3D intersection view), `recharts` (KPI charts), `lucide-react` (icons).

**Components:**
- `App.tsx` — root; manages WebSocket connection, all state, and renders the dashboard panels.
- `components/IntersectionCamera3D.tsx` — Three.js 3D view of a selected intersection (low-poly, CCTV-angle camera). Opened by clicking any traffic light marker on the map.

**IntersectionCamera3D — critical design decisions:**

*Coordinate system:* `bDir(deg)` converts geographic bearing to Three.js XZ: 0°=North=-Z, 90°=East=+X, 180°=South=+Z, 270°=West=-X. All road and traffic light geometry is built from this.

*Road geometry:* Each road is a `THREE.Group` positioned at `dir * (PAD_R + ROAD_LEN/2)` with `rotation.y = atan2(dir.x, dir.z)`. In the group's local space the road surface extends ±ROAD_LEN/2 along local Z. Incoming edges draw at `bearing + 180` (extends toward traffic source); outgoing edges draw at `bearing`.

*Traffic light placement:* For each incoming edge with bearing B:
- Along: `bDir(B + 180)` × 13 m (direction toward approaching traffic)
- Right: `bDir(B + 90)` × 6.5 m (right side of approaching driver)
- Housing `rotation.y = atan2(faceDir.x, faceDir.z)` so it faces the driver

*Vehicle positioning (edge-based, NOT GPS-based):* Vehicles use `v.lane` (edge ID) and `v.position` (meters from u-node) to snap exactly onto the drawn road — GPS lat/lng is not used for positioning.
- Incoming edge: `pos3D = bDir(eb.bearing + 180) × (length_m − v.position)`
- Outgoing edge: `pos3D = bDir(ob.bearing) × v.position`
- Right-lane offset: `+ bDir(travelBearing + 90) × 2.5 m`
- Only vehicles whose `v.lane` is in `edgeBearings` or `outgoingBearings` are rendered.

*Signal animation:* Traffic light colors (R/Y/G bulb materials + PointLight) are updated every animation frame inside the `requestAnimationFrame` loop (not in a `useEffect`) so `flash_yellow` mode actually flashes using `Date.now()`. `mode` and `edgeStates` are stored in refs updated by lightweight `useEffect`s.

**API surface (consumed by frontend):**

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/intersections` | List all traffic lights |
| POST | `/api/adaptive/toggle` | Toggle adaptive mode per intersection |
| POST | `/api/adaptive/toggle-all` | Toggle all intersections |
| POST | `/api/phase/update` | Manual phase duration override |
| POST | `/api/simulation/toggle` | Pause / resume |
| GET | `/api/scenarios` | List scenarios |
| POST | `/api/scenario/set` | Apply scenario |
| POST | `/api/green-wave/apply` | Apply green wave at target speed |
| POST | `/api/green-wave/disable` | Disable green wave |
| GET | `/api/kpi` | Full KPI history |
| POST | `/api/kpi/reset-comparison` | Reset fixed-vs-adaptive baseline |
| WS | `/ws` | 10 Hz state stream |

---

## KPI & Analytics

`kpi_collector.py` tracks LOS (HCM 6th Ed., delay-based A–F) and CO₂ (COPERT simplified: `ef(v) = 170 + 800/v` g/km, per-type multipliers). Both updated this session.
- Per-intersection LOS uses queue density proxy (vehicles/lane) since direct delay-per-intersection tracking requires major engine refactor.
- CO₂ display: `co2_rate_g_per_s * 3.6` = kg/hour for readability. Backend stores g/s.
- `speed_to_co2_g_per_s(speed_ms, vehicle_type)` in `kpi_collector.py` — call with `* dt` to get grams emitted per tick.
- `engine.py` calls `kpi_collector.record_vehicle_emission()` inside the vehicle loop per tick.

## Theme System

App uses a **hybrid theme system**: CSS variables handle passive elements; JS `DARK`/`LIGHT` color objects in `App.tsx` handle Recharts props and inline styles that can't use CSS vars.
- Toggle: `[data-theme="light"]` on `<html>` → `index.css` CSS vars switch automatically.
- `C = theme === 'dark' ? DARK : LIGHT` inside App; pass `C.xxx` to inline styles and Recharts props.
- **Recharts cannot use CSS vars** — must pass actual hex/rgba values via `C` object.
- Sub-components outside App (MiniKPI, StatCard, VehicleLayer) use `var(--t-lo)` etc. in inline styles rather than receiving theme props — keeps them self-contained.
- `replace_all` on `color: '#hex'` patterns is safe — DARK/LIGHT consts use `key: '#hex'` format (no `color:` prefix), so no collision.
- Map tile URL in `C.mapTile`: dark → CartoDB dark_all, light → CartoDB light_all.

## TypeScript / Build

- Type check: `npx tsc --noEmit` from `simulation/frontend/`
- Build check: `npx vite build` — faster than starting dev server for validating compilation.
- Large bundle warning (>500 kB) is pre-existing — Three.js + Recharts. Not a regression.
- New optional fields on existing interfaces use `?` to avoid type errors across the codebase.

---

## Dissertation Documents

Root-level `.md` files are Azerbaijani-language dissertation chapters edited alongside the code. `dissertation_plan.md` contains the full chapter structure and AzTU formatting requirements (Times New Roman 14pt, 1.5 line spacing, APA 7 references, min 30–35 sources). `research/` contains literature mapping and analysis notes.

When editing dissertation text, maintain Azerbaijani academic register and APA 7 citation format.

import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from core.engine import SimulationEngine

app = FastAPI(title="Digital Twin Simulation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = SimulationEngine()
engine.running = True

active_connections = []


# --- Request Models ---
class AdaptiveToggle(BaseModel):
    node_id: str
    enabled: bool

class PhaseUpdate(BaseModel):
    node_id: str
    phase_index: int
    duration: float

class ScenarioSet(BaseModel):
    scenario_id: str

class GreenWaveApply(BaseModel):
    target_speed_kmh: float = 50.0


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(simulation_loop())

async def simulation_loop():
    physics_dt = 0.02  # Physics step: 20ms (50 Hz) for smooth IDM
    send_interval = 0.1  # Send to frontend: 100ms (10 Hz) for no flicker
    time_since_send = 0.0
    
    while True:
        if engine.running:
            engine.step(physics_dt)
            time_since_send += physics_dt
            
            if time_since_send >= send_interval:
                time_since_send = 0.0
                state = engine.get_state()
                state_json = json.dumps(state)
                for conn in active_connections:
                    try:
                        await conn.send_text(state_json)
                    except Exception:
                        pass
        await asyncio.sleep(physics_dt)


# --- REST API Endpoints ---

@app.get("/")
def read_root():
    return {"message": "Digital Twin Engine is running"}


@app.get("/api/intersections")
def get_intersections():
    """List all intersections with traffic lights."""
    return {
        "intersections": [tl.to_dict() for tl in engine.traffic_lights.values()]
    }


@app.post("/api/adaptive/toggle")
def toggle_adaptive(body: AdaptiveToggle):
    """Enable/disable adaptive mode for a specific intersection."""
    tl = engine.traffic_lights.get(body.node_id)
    if not tl:
        return {"error": "Intersection not found"}
    
    if body.enabled:
        engine.adaptive_controller.enable_for_intersection(tl)
    else:
        engine.adaptive_controller.disable_for_intersection(tl)
    
    return {"success": True, "node_id": body.node_id, "mode": tl.mode}


@app.post("/api/adaptive/toggle-all")
def toggle_all_adaptive(enabled: bool = True):
    """Enable/disable adaptive mode for ALL intersections."""
    for tl in engine.traffic_lights.values():
        if enabled:
            engine.adaptive_controller.enable_for_intersection(tl)
        else:
            engine.adaptive_controller.disable_for_intersection(tl)
    return {"success": True, "mode": "adaptive" if enabled else "fixed"}


@app.post("/api/phase/update")
def update_phase(body: PhaseUpdate):
    """Manually update a traffic light phase duration."""
    tl = engine.traffic_lights.get(body.node_id)
    if not tl:
        return {"error": "Intersection not found"}
    
    tl.set_phase_duration(body.phase_index, body.duration)
    return {"success": True, "node_id": body.node_id}


@app.post("/api/simulation/toggle")
def toggle_simulation():
    """Pause/resume the simulation."""
    engine.running = not engine.running
    return {"running": engine.running}


# --- Scenario Endpoints ---

@app.get("/api/scenarios")
def list_scenarios():
    """List all available traffic scenarios."""
    return engine.scenario_manager.to_dict()


@app.post("/api/scenario/set")
def set_scenario(body: ScenarioSet):
    """Apply a traffic scenario (peak, normal, night, stress)."""
    result = engine.scenario_manager.apply_scenario(body.scenario_id, engine)
    return result


# --- Green Wave Endpoints ---

@app.post("/api/green-wave/apply")
def apply_green_wave(body: GreenWaveApply):
    """Apply green wave synchronization to detected corridors."""
    # Re-detect corridors (in case new traffic lights were added)
    engine.green_wave.detect_corridors(
        engine.edges, engine.traffic_lights, engine.outgoing
    )
    result = engine.green_wave.apply_green_wave(
        engine.traffic_lights, body.target_speed_kmh
    )
    return result


@app.post("/api/green-wave/disable")
def disable_green_wave():
    """Disable green wave synchronization."""
    engine.green_wave.disable()
    return {"success": True, "active": False}


# --- KPI Endpoints ---

@app.get("/api/kpi")
def get_kpi():
    """Get current KPI data and full snapshot history."""
    return engine.kpi_collector.to_dict()


@app.post("/api/kpi/reset-comparison")
def reset_kpi_comparison():
    """Reset comparison data for a fresh fixed-vs-adaptive experiment."""
    engine.kpi_collector.reset_comparison()
    return {"success": True}


# --- WebSocket ---

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        active_connections.remove(websocket)

import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
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

@app.get("/")
def read_root():
    return {"message": "Digital Twin Engine is running"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        active_connections.remove(websocket)

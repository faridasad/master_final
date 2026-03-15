import time
import random
import json
import math
from models.vehicle import Vehicle

class SimulationEngine:
    def __init__(self):
        try:
            with open("baku_map.json", "r", encoding="utf-8") as f:
                self.map_data = json.load(f)
        except Exception as e:
            print(f"Error loading map data: {e}")
            self.map_data = {"center": {"lat": 40.4, "lng": 49.8525}, "nodes": {}, "edges": []}

        self.edges = self.map_data["edges"]
        self.edge_ids = [edge["id"] for edge in self.edges]
        
        # Build adjacency: for each node, which edges START from it?
        self.outgoing = {}  # node_id -> list of edge objects
        for edge in self.edges:
            v_node = edge["v"]  # end node of this edge
            if v_node not in self.outgoing:
                self.outgoing[v_node] = []
            # Find edges that START from v_node
        for edge in self.edges:
            u_node = edge["u"]
            if u_node not in self.outgoing:
                self.outgoing[u_node] = []
            self.outgoing[u_node].append(edge)
        
        self.vehicles = {eid: [] for eid in self.edge_ids}
        self.running = False
        self.spawn_timer = 0.0
        self.spawn_interval = 1.2
        self.vehicle_counter = 0

    def get_edge(self, edge_id):
        for e in self.edges:
            if e["id"] == edge_id:
                return e
        return None

    def add_vehicle(self):
        if not self.edge_ids: return
        eid = random.choice(self.edge_ids)
        lane_vehicles = self.vehicles[eid]
        
        if lane_vehicles and lane_vehicles[-1].position < 12.0:
            return

        edge = self.get_edge(eid)
        if not edge: return
            
        self.vehicle_counter += 1
        vid = f"v_{self.vehicle_counter}"
        v = Vehicle(id=vid, lane=eid, initial_position=0.0)
        v.v0 = (edge["maxspeed_kmh"] / 3.6) * random.uniform(0.85, 1.1)
        lane_vehicles.append(v)

    def transfer_vehicle(self, vehicle, current_edge):
        """Move vehicle to a connected edge when it reaches the end."""
        end_node = current_edge["v"]
        next_edges = self.outgoing.get(end_node, [])
        
        if not next_edges:
            return False  # Dead end, remove vehicle
        
        # Pick a random outgoing edge (simple routing)
        next_edge = random.choice(next_edges)
        next_eid = next_edge["id"]
        
        # Check if there's space at the start of the next edge
        next_vehicles = self.vehicles.get(next_eid, [])
        if next_vehicles and next_vehicles[-1].position < 10.0:
            # No room, vehicle waits (clamp at end of current edge)
            vehicle.position = current_edge["length_m"] - 0.5
            vehicle.speed = 0
            return True  # Keep on current edge
        
        # Transfer
        overflow = vehicle.position - current_edge["length_m"]
        vehicle.position = max(0, overflow)
        vehicle.lane = next_eid
        vehicle.v0 = (next_edge["maxspeed_kmh"] / 3.6) * random.uniform(0.9, 1.05)
        
        # Remove from old, add to new
        self.vehicles.get(next_eid, []).append(vehicle)
        return False  # Remove from current edge list (already added to new)

    def step(self, dt):
        self.spawn_timer += dt
        if self.spawn_timer >= self.spawn_interval:
            for _ in range(random.randint(1, 2)):
                self.add_vehicle()
            self.spawn_timer = 0.0

        for eid in self.edge_ids:
            lane_vehicles = self.vehicles[eid]
            edge = self.get_edge(eid)
            if not edge: continue
            
            for i in range(len(lane_vehicles)):
                v = lane_vehicles[i]
                leading = lane_vehicles[i-1] if i > 0 else None
                v.update(dt=dt, leading_vehicle=leading)

            # Handle vehicles that reached end of edge
            remaining = []
            for v in lane_vehicles:
                if v.position >= edge["length_m"]:
                    keep = self.transfer_vehicle(v, edge)
                    if keep:
                        remaining.append(v)
                    # else: transferred to next edge or dead end
                else:
                    remaining.append(v)
            self.vehicles[eid] = remaining

    def get_vehicle_latlng(self, v, edge):
        u_node = self.map_data["nodes"].get(edge["u"])
        v_node = self.map_data["nodes"].get(edge["v"])
        if not u_node or not v_node:
            return None
        
        progress = v.position / max(edge["length_m"], 0.1)
        progress = max(0.0, min(progress, 1.0))
        
        lat = u_node["lat"] + (v_node["lat"] - u_node["lat"]) * progress
        lng = u_node["lng"] + (v_node["lng"] - u_node["lng"]) * progress
        
        dlat = v_node["lat"] - u_node["lat"]
        dlng = v_node["lng"] - u_node["lng"]
        bearing = math.degrees(math.atan2(dlng, dlat))
        
        return {"lat": round(lat, 7), "lng": round(lng, 7), "bearing": round(bearing, 1)}

    def get_state(self):
        all_vehicles = []
        for eid in self.edge_ids:
            edge = self.get_edge(eid)
            if not edge: continue
            for v in self.vehicles[eid]:
                pos = self.get_vehicle_latlng(v, edge)
                if pos:
                    vd = v.to_dict()
                    vd["lat"] = pos["lat"]
                    vd["lng"] = pos["lng"]
                    vd["bearing"] = pos["bearing"]
                    all_vehicles.append(vd)
            
        return {
            "center": self.map_data.get("center", {"lat": 40.4, "lng": 49.8525}),
            "vehicles": all_vehicles,
            "status": "Running" if self.running else "Stopped",
            "active_count": len(all_vehicles),
            "total_edges": len(self.edges),
            "total_nodes": len(self.map_data.get("nodes", {}))
        }

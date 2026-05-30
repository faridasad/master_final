import random
import json
import math
from models.vehicle import Vehicle, VEHICLE_TYPES
from models.traffic_light import IntersectionTrafficLight
from core.adaptive_controller import AdaptiveController
from core.kpi_collector import KPICollector, speed_to_co2_g_per_s
from core.scenario_manager import ScenarioManager
from core.green_wave import GreenWaveController


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
        self.edge_map = {edge["id"]: edge for edge in self.edges}  # Fast lookup
        
        # Build adjacency: for each node, which edges START from it?
        self.outgoing = {}  # node_id -> list of edge objects
        self.incoming = {}  # node_id -> list of edge objects
        for edge in self.edges:
            u_node = edge["u"]
            v_node = edge["v"]
            if u_node not in self.outgoing:
                self.outgoing[u_node] = []
            self.outgoing[u_node].append(edge)
            
            if v_node not in self.incoming:
                self.incoming[v_node] = []
            self.incoming[v_node].append(edge)
        
        self.vehicles = {eid: [] for eid in self.edge_ids}
        self.running = False
        self.spawn_timer = 0.0
        self.spawn_interval = 3.0
        self.vehicle_counter = 0
        self.max_vehicles = 80  # Increased from 30
        self.sim_clock = 0.0    # Total simulation time
        
        # --- Traffic Lights ---
        self.traffic_lights = {}  # node_id -> IntersectionTrafficLight
        self._detect_intersections()
        
        # --- Adaptive Controller ---
        self.adaptive_controller = AdaptiveController(update_interval=30.0)
        # Enable adaptive mode for all intersections by default
        for tl in self.traffic_lights.values():
            self.adaptive_controller.enable_for_intersection(tl)
        
        # --- KPI Collector ---
        self.kpi_collector = KPICollector(snapshot_interval=5.0)
        
        # --- Scenario Manager ---
        self.scenario_manager = ScenarioManager()
        
        # --- Green Wave Controller ---
        self.green_wave = GreenWaveController()
        self.green_wave.detect_corridors(self.edges, self.traffic_lights, self.outgoing)
        print(f"Green Wave: detected {len(self.green_wave.corridors)} corridors")

    def _detect_intersections(self):
        """
        Auto-detect intersections: nodes with >= 2 incoming edges.
        Place traffic lights at those nodes.
        """
        for node_id, inc_edges in self.incoming.items():
            if len(inc_edges) >= 2:
                incoming_edge_ids = [e["id"] for e in inc_edges]
                node_data = self.map_data["nodes"].get(node_id, {})
                tl = IntersectionTrafficLight(
                    node_id=node_id,
                    incoming_edge_ids=incoming_edge_ids,
                    position_lat=node_data.get("lat", 0),
                    position_lng=node_data.get("lng", 0)
                )
                self.traffic_lights[node_id] = tl
        
        print(f"Detected {len(self.traffic_lights)} intersections with traffic lights")

    def get_edge(self, edge_id):
        return self.edge_map.get(edge_id)

    def add_vehicle(self):
        if not self.edge_ids:
            return
        # Cap total vehicles
        total = sum(len(v) for v in self.vehicles.values())
        if total >= self.max_vehicles:
            return
        eid = random.choice(self.edge_ids)
        lane_vehicles = self.vehicles[eid]
        
        if lane_vehicles and lane_vehicles[-1].position < 12.0:
            return

        edge = self.get_edge(eid)
        if not edge:
            return
            
        self.vehicle_counter += 1
        vid = f"v_{self.vehicle_counter}"
        v = Vehicle(id=vid, lane=eid, initial_position=0.0)
        v.v0 = (edge["maxspeed_kmh"] / 3.6) * (VEHICLE_TYPES.get(v.vehicle_type, {}).get("speed_factor", 1.0)) * random.uniform(0.85, 1.1)
        v.birth_time = self.sim_clock
        lane_vehicles.append(v)

    def transfer_vehicle(self, vehicle, current_edge):
        """Move vehicle to a connected edge when it reaches the end."""
        end_node = current_edge["v"]
        next_edges = self.outgoing.get(end_node, [])
        
        if not next_edges:
            # Dead end — record trip completion for KPI
            travel_time = self.sim_clock - vehicle.birth_time
            self.kpi_collector.record_vehicle_completed(travel_time)
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
        
        # Record intersection passage for KPI
        self.kpi_collector.record_vehicle_passed_intersection()
        
        # Transfer
        overflow = vehicle.position - current_edge["length_m"]
        vehicle.position = max(0, overflow)
        vehicle.lane = next_eid
        vt_factor = VEHICLE_TYPES.get(vehicle.vehicle_type, {}).get("speed_factor", 1.0)
        vehicle.v0 = (next_edge["maxspeed_kmh"] / 3.6) * vt_factor * random.uniform(0.9, 1.05)
        
        # Remove from old, add to new
        self.vehicles.get(next_eid, []).append(vehicle)
        return False  # Remove from current edge list (already added to new)

    def _get_traffic_light_info(self, edge_id, edge):
        """
        Check if the END of this edge has a traffic light.
        Returns (distance_to_light, light_state) or (None, None).
        """
        end_node = edge["v"]
        tl = self.traffic_lights.get(end_node)
        if tl is None:
            return None, None
        
        state = tl.get_state_for_edge(edge_id)
        # The light is at the end of the edge (the intersection node)
        distance = edge["length_m"]
        return distance, state

    def step(self, dt):
        self.sim_clock += dt

        # --- Spawn vehicles ---
        self.spawn_timer += dt
        if self.spawn_timer >= self.spawn_interval:
            for _ in range(random.randint(1, 3)):
                self.add_vehicle()
            self.spawn_timer = 0.0

        # --- Step traffic lights ---
        for tl in self.traffic_lights.values():
            tl.step(dt)
        
        # --- Step adaptive controller ---
        vehicle_counts = {eid: len(vlist) for eid, vlist in self.vehicles.items()}
        self.adaptive_controller.step(dt, self.traffic_lights, vehicle_counts)

        # --- Step vehicles ---
        active_speeds = []
        stopped_count = 0

        for eid in self.edge_ids:
            lane_vehicles = self.vehicles[eid]
            edge = self.get_edge(eid)
            if not edge:
                continue
            
            # Get traffic light info for this edge
            tl_distance, tl_state = self._get_traffic_light_info(eid, edge)
            
            for i in range(len(lane_vehicles)):
                v = lane_vehicles[i]
                leading = lane_vehicles[i-1] if i > 0 else None
                v.update(
                    dt=dt,
                    leading_vehicle=leading,
                    traffic_light_distance=tl_distance,
                    traffic_light_state=tl_state
                )
                
                # KPI tracking
                self.kpi_collector.record_vehicle_tick()
                self.kpi_collector.record_vehicle_emission(
                    speed_to_co2_g_per_s(v.speed, v.vehicle_type) * dt
                )
                if v.speed < 1.0:
                    self.kpi_collector.record_vehicle_stopped(dt)
                    stopped_count += 1
                active_speeds.append(v.speed)

            # Handle vehicles that reached end of edge
            remaining = []
            for v in lane_vehicles:
                if v.position >= edge["length_m"]:
                    # Check traffic light - don't let vehicle pass on red/yellow
                    end_node = edge["v"]
                    tl = self.traffic_lights.get(end_node)
                    if tl and tl.mode != "flash_yellow" and tl.get_state_for_edge(eid) in ["Red", "Yellow"]:
                        # Force stop at intersection
                        v.position = edge["length_m"] - 0.5
                        v.speed = 0
                        remaining.append(v)
                    else:
                        keep = self.transfer_vehicle(v, edge)
                        if keep:
                            remaining.append(v)
                else:
                    remaining.append(v)
            self.vehicles[eid] = remaining

        # --- Step KPI Collector ---
        active_count = len(active_speeds)
        avg_speed = sum(active_speeds) / max(active_count, 1)
        queue_lengths = {eid: len(vlist) for eid, vlist in self.vehicles.items()}
        
        # Track current mode for KPI comparison
        adaptive_count = sum(1 for tl in self.traffic_lights.values() if tl.mode == "adaptive")
        current_mode = "adaptive" if adaptive_count > len(self.traffic_lights) / 2 else "fixed"
        self.kpi_collector.set_mode(current_mode)
        
        self.kpi_collector.step(dt, active_count, avg_speed, stopped_count, queue_lengths)

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
            if not edge:
                continue
            for v in self.vehicles[eid]:
                pos = self.get_vehicle_latlng(v, edge)
                if pos:
                    vd = v.to_dict()
                    vd["lat"] = pos["lat"]
                    vd["lng"] = pos["lng"]
                    vd["bearing"] = pos["bearing"]
                    all_vehicles.append(vd)
        
        # Serialize traffic lights with edge bearing info
        traffic_lights_data = []
        for tl in self.traffic_lights.values():
            tl_data = tl.to_dict()
            # Compute bearing for each incoming edge (road direction entering the intersection)
            edge_bearings = {}
            for eid in tl.incoming_edge_ids:
                edge = self.edge_map.get(eid)
                if edge:
                    u_node = self.map_data["nodes"].get(edge["u"])
                    v_node = self.map_data["nodes"].get(edge["v"])
                    if u_node and v_node:
                        dlat = v_node["lat"] - u_node["lat"]
                        dlng = v_node["lng"] - u_node["lng"]
                        bearing = math.degrees(math.atan2(dlng, dlat))
                        edge_bearings[eid] = {
                            "bearing": round(bearing, 1),
                            "length_m": round(edge["length_m"], 1),
                            "name": edge.get("name", ""),
                            "lanes": edge.get("lanes", 1),
                        }
            # Outgoing edges too
            outgoing_bearings = {}
            out_edges = self.outgoing.get(tl.node_id, [])
            for edge in out_edges:
                eid = edge["id"]
                u_node = self.map_data["nodes"].get(edge["u"])
                v_node = self.map_data["nodes"].get(edge["v"])
                if u_node and v_node:
                    dlat = v_node["lat"] - u_node["lat"]
                    dlng = v_node["lng"] - u_node["lng"]
                    bearing = math.degrees(math.atan2(dlng, dlat))
                    outgoing_bearings[eid] = {
                        "bearing": round(bearing, 1),
                        "length_m": round(edge["length_m"], 1),
                    }
            tl_data["edge_bearings"] = edge_bearings
            tl_data["outgoing_bearings"] = outgoing_bearings

            # Per-intersection LOS: queue density proxy (vehicles/lane on incoming edges)
            incoming_vehicles = sum(len(self.vehicles.get(eid, [])) for eid in tl.incoming_edge_ids)
            total_lanes = sum(
                self.edge_map.get(eid, {}).get("lanes", 1)
                for eid in tl.incoming_edge_ids
            )
            q_per_lane = incoming_vehicles / max(total_lanes, 1)
            if q_per_lane < 2:     tl_los = "A"
            elif q_per_lane < 4:   tl_los = "B"
            elif q_per_lane < 6:   tl_los = "C"
            elif q_per_lane < 8:   tl_los = "D"
            elif q_per_lane < 12:  tl_los = "E"
            else:                  tl_los = "F"
            tl_data["los_grade"] = tl_los
            tl_data["queue_per_lane"] = round(q_per_lane, 1)

            traffic_lights_data.append(tl_data)
        
        # Congestion per edge (for dashboard)
        edge_congestion = []
        for eid in self.edge_ids:
            edge = self.get_edge(eid)
            if not edge:
                continue
            count = len(self.vehicles[eid])
            if count > 0:
                avg_speed = sum(v.speed for v in self.vehicles[eid]) / count
            else:
                avg_speed = 0
            edge_congestion.append({
                "id": eid,
                "name": edge.get("name", ""),
                "vehicle_count": count,
                "avg_speed_kmh": round(avg_speed * 3.6, 1),
                "length_m": edge["length_m"]
            })
        
        # Sort by congestion (most vehicles first)
        edge_congestion.sort(key=lambda x: x["vehicle_count"], reverse=True)
            
        return {
            "center": self.map_data.get("center", {"lat": 40.4, "lng": 49.8525}),
            "vehicles": all_vehicles,
            "traffic_lights": traffic_lights_data,
            "edge_congestion": edge_congestion[:10],  # Top 10 most congested
            "adaptive_controller": self.adaptive_controller.to_dict(),
            "kpi": self.kpi_collector.to_dict(),
            "scenario": self.scenario_manager.to_dict(),
            "green_wave": self.green_wave.to_dict(),
            "status": "Running" if self.running else "Stopped",
            "sim_clock": round(self.sim_clock, 1),
            "active_count": len(all_vehicles),
            "total_edges": len(self.edges),
            "total_nodes": len(self.map_data.get("nodes", {})),
            "total_intersections": len(self.traffic_lights)
        }

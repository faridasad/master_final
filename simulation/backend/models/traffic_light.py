import math
import random


class IntersectionTrafficLight:
    """
    A traffic light controller for a single intersection (node).
    
    It manages phases for conflicting approach groups.
    Each 'phase' gives green to one group of non-conflicting incoming edges,
    while all other approaches see red.
    
    Supports:
    - Fixed-time cycling
    - Adaptive mode (external controller can adjust green durations)
    """
    
    def __init__(self, node_id, incoming_edge_ids, position_lat=0, position_lng=0):
        self.node_id = node_id
        self.position_lat = position_lat
        self.position_lng = position_lng
        self.incoming_edge_ids = incoming_edge_ids  # list of edge IDs approaching this node
        
        # Build phases: each incoming edge gets its own green phase
        # In a real system you'd group compatible directions; here we alternate
        self.phases = []
        if len(incoming_edge_ids) >= 2:
            # Group into 2 phases (simplified: split edges roughly in half)
            mid = max(1, len(incoming_edge_ids) // 2)
            group_a = incoming_edge_ids[:mid]
            group_b = incoming_edge_ids[mid:]
            self.phases = [
                {"green_edges": group_a, "duration": 20.0},
                {"yellow_edges": group_a, "duration": 3.0},
                {"green_edges": group_b, "duration": 20.0},
                {"yellow_edges": group_b, "duration": 3.0},
            ]
        elif len(incoming_edge_ids) == 1:
            # Single approach = always green
            self.phases = [
                {"green_edges": incoming_edge_ids, "duration": 30.0}
            ]
        
        self.current_phase_index = 0
        self.cycle_time = 0.0
        
        # Edge -> state mapping
        self.edge_states = {}  # edge_id -> "Green" / "Yellow" / "Red"
        self._update_states()
        
        # Mode: "fixed" or "adaptive"
        self.mode = "fixed"
    
    def _update_states(self):
        """Recalculate which edges are green/yellow/red based on current phase."""
        phase = self.phases[self.current_phase_index] if self.phases else {}
        green_edges = phase.get("green_edges", [])
        yellow_edges = phase.get("yellow_edges", [])
        
        for eid in self.incoming_edge_ids:
            if eid in green_edges:
                self.edge_states[eid] = "Green"
            elif eid in yellow_edges:
                self.edge_states[eid] = "Yellow"
            else:
                self.edge_states[eid] = "Red"
    
    def step(self, dt):
        """Advance the traffic light by dt seconds."""
        if not self.phases:
            return
            
        self.cycle_time += dt
        current_duration = self.phases[self.current_phase_index]["duration"]
        
        if self.cycle_time >= current_duration:
            self.cycle_time -= current_duration
            self.current_phase_index = (self.current_phase_index + 1) % len(self.phases)
            self._update_states()
    
    def get_state_for_edge(self, edge_id):
        """Get the traffic light state for a specific incoming edge."""
        return self.edge_states.get(edge_id, "Green")
    
    def get_time_left(self):
        """Seconds remaining in current phase."""
        if not self.phases:
            return 0
        return max(0, self.phases[self.current_phase_index]["duration"] - self.cycle_time)
    
    def set_phase_duration(self, phase_index, new_duration):
        """Adaptive control: change the duration of a specific phase."""
        if 0 <= phase_index < len(self.phases):
            self.phases[phase_index]["duration"] = max(5.0, min(new_duration, 60.0))
    
    def to_dict(self):
        """Serialize for WebSocket/frontend."""
        return {
            "node_id": self.node_id,
            "lat": self.position_lat,
            "lng": self.position_lng,
            "edge_states": self.edge_states.copy(),
            "phase_index": self.current_phase_index,
            "time_left": round(self.get_time_left(), 1),
            "mode": self.mode,
            "total_phases": len(self.phases)
        }

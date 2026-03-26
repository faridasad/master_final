"""
Adaptive Traffic Light Controller

Uses real-time queue length data from the simulation to dynamically
adjust traffic light phase durations. This implements a simplified
version of the adaptive control described in the research (Chapter 1.2):
AI-driven proactive decision-making for Digital Twin systems.

Algorithm: Queue-Proportional Green Time Allocation
- Monitors vehicle queue lengths on each incoming edge of an intersection
- Allocates more green time to directions with heavier traffic
- Maintains minimum/maximum green time bounds for safety
"""


class AdaptiveController:
    """
    Adjusts traffic light phase durations based on real-time congestion data.
    """
    
    def __init__(self, update_interval=30.0):
        self.update_interval = update_interval  # How often to re-evaluate (seconds)
        self.timer = 0.0
        self.enabled = True
        
        # Constraints
        self.min_green = 8.0    # Minimum green phase (seconds)
        self.max_green = 45.0   # Maximum green phase (seconds)
        self.yellow_time = 3.0  # Fixed yellow time
        
        # Analytics
        self.last_adjustments = {}  # node_id -> adjustment info
    
    def step(self, dt, traffic_lights, vehicle_counts_per_edge):
        """
        Called every simulation step.
        
        Args:
            dt: time step
            traffic_lights: dict of node_id -> IntersectionTrafficLight
            vehicle_counts_per_edge: dict of edge_id -> number of vehicles on that edge
        """
        if not self.enabled:
            return
            
        self.timer += dt
        if self.timer < self.update_interval:
            return
        
        self.timer = 0.0
        
        for node_id, tl in traffic_lights.items():
            if tl.mode != "adaptive":
                continue
            
            self._adjust_intersection(tl, vehicle_counts_per_edge)
    
    def _adjust_intersection(self, tl, vehicle_counts):
        """
        Adjust phase durations for a single intersection based on queue lengths.
        
        Strategy: Queue-Proportional Green Time
        - Total cycle time is kept roughly constant
        - Green time is distributed proportionally to queue lengths
        """
        if len(tl.phases) < 2:
            return
        
        # Collect queue data for each phase's green edges
        phase_demands = []
        for phase in tl.phases:
            green_edges = phase.get("green_edges", [])
            if not green_edges:
                # Yellow phase - skip
                phase_demands.append(None)
                continue
            
            # Sum vehicles on all edges that get green in this phase
            demand = sum(vehicle_counts.get(eid, 0) for eid in green_edges)
            phase_demands.append(max(demand, 1))  # At least 1 to avoid division by zero
        
        # Calculate total demand across green phases only
        green_demands = [d for d in phase_demands if d is not None]
        total_demand = sum(green_demands)
        
        if total_demand == 0:
            return
        
        # Available green time budget (total cycle minus yellow phases)
        yellow_phases_time = sum(
            p["duration"] for i, p in enumerate(tl.phases) 
            if phase_demands[i] is None
        )
        total_green_budget = max(30.0, 60.0 - yellow_phases_time)
        
        # Distribute green time proportionally
        adjustment_info = {"phases": []}
        for i, phase in enumerate(tl.phases):
            if phase_demands[i] is None:
                # Yellow phase - keep fixed
                phase["duration"] = self.yellow_time
                continue
            
            # Proportional allocation
            proportion = phase_demands[i] / total_demand
            new_green = total_green_budget * proportion
            
            # Clamp to bounds
            new_green = max(self.min_green, min(new_green, self.max_green))
            phase["duration"] = round(new_green, 1)
            
            adjustment_info["phases"].append({
                "index": i,
                "demand": phase_demands[i],
                "allocated_green": round(new_green, 1)
            })
        
        self.last_adjustments[tl.node_id] = adjustment_info
    
    def enable_for_intersection(self, traffic_light):
        """Enable adaptive mode for a specific intersection."""
        traffic_light.mode = "adaptive"
    
    def disable_for_intersection(self, traffic_light):
        """Disable adaptive mode, revert to fixed timing."""
        traffic_light.mode = "fixed"
    
    def to_dict(self):
        """Serialize for API/frontend."""
        return {
            "enabled": self.enabled,
            "update_interval": self.update_interval,
            "last_adjustments": self.last_adjustments,
            "min_green": self.min_green,
            "max_green": self.max_green
        }

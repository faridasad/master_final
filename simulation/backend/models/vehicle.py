import math
import random

# Vehicle type definitions with distinct physical properties
VEHICLE_TYPES = {
    "car": {
        "name": "Minik Avtomobili",
        "length": 4.5,
        "max_accel": 1.8,
        "comfortable_decel": 2.0,
        "min_gap": 2.0,
        "speed_factor": 1.0,    # multiplier on road speed limit
        "time_headway": 1.5,
        "color": "blue",         # frontend hint
    },
    "suv": {
        "name": "Yolsuz Avtomobil (SUV)",
        "length": 5.2,
        "max_accel": 1.5,
        "comfortable_decel": 1.8,
        "min_gap": 2.5,
        "speed_factor": 0.95,
        "time_headway": 1.6,
        "color": "slate",
    },
    "bus": {
        "name": "Avtobus",
        "length": 12.0,
        "max_accel": 0.8,
        "comfortable_decel": 1.2,
        "min_gap": 3.0,
        "speed_factor": 0.75,
        "time_headway": 2.0,
        "color": "amber",
    },
    "truck": {
        "name": "Yük Maşını",
        "length": 10.0,
        "max_accel": 0.6,
        "comfortable_decel": 1.0,
        "min_gap": 4.0,
        "speed_factor": 0.65,
        "time_headway": 2.2,
        "color": "orange",
    },
}

# Weighted probabilities for random vehicle type selection
VEHICLE_TYPE_WEIGHTS = {
    "car": 55,
    "suv": 25,
    "bus": 10,
    "truck": 10,
}


def random_vehicle_type():
    """Select a random vehicle type based on weighted probabilities."""
    types = list(VEHICLE_TYPE_WEIGHTS.keys())
    weights = list(VEHICLE_TYPE_WEIGHTS.values())
    return random.choices(types, weights=weights, k=1)[0]


class Vehicle:
    def __init__(self, id, lane, initial_position, desired_speed=15.0, vehicle_type=None):
        self.id = id
        self.lane = lane  # edge id
        self.position = initial_position  # distance from start of the lane (meters)
        self.speed = 0.0  # current speed (m/s)
        self.acceleration = 0.0  # current acceleration (m/s^2)
        
        # Vehicle type
        self.vehicle_type = vehicle_type or random_vehicle_type()
        vt = VEHICLE_TYPES.get(self.vehicle_type, VEHICLE_TYPES["car"])
        
        # IDM Parameters (Intelligent Driver Model) — set from vehicle type
        self.v0 = desired_speed * vt["speed_factor"]  # Desired speed in free traffic
        self.T = vt["time_headway"]     # Safe time headway (seconds)
        self.s0 = vt["min_gap"]         # Minimum gap in stopped traffic (meters)
        self.a = vt["max_accel"]        # Maximum acceleration (m/s^2)
        self.b = vt["comfortable_decel"]  # Comfortable deceleration (m/s^2)
        
        self.length = vt["length"]      # Vehicle length (meters)

        # KPI tracking
        self.birth_time = 0.0           # set by engine when spawned
        self.total_stopped_time = 0.0   # accumulated time spent stopped

    def update(self, dt, leading_vehicle=None, traffic_light_distance=None, traffic_light_state=None):
        """
        Updates the vehicle's position, speed, and acceleration based on IDM.
        dt: Time step (seconds)
        """
        # Track stopped time for KPI
        if self.speed < 1.0:
            self.total_stopped_time += dt

        # Determine the effective leading "obstacle"
        s_alpha = float('inf') # distance to leading vehicle
        delta_v = 0.0          # speed difference (my_speed - leader_speed)

        # 1. Check leading vehicle
        if leading_vehicle:
            s_alpha = leading_vehicle.position - self.position - self.length
            # Avoid negative gap if they somehow passed each other
            s_alpha = max(s_alpha, 0.001) 
            delta_v = self.speed - leading_vehicle.speed

        # 2. Check traffic light
        # If there is a red or yellow light ahead, and it is closer than the leading vehicle, treat it as a stopped vehicle
        if traffic_light_distance is not None and traffic_light_state in ['Red', 'Yellow']:
            dist_to_light = traffic_light_distance - self.position
            # Only care if the light is in front of us
            if 0 < dist_to_light < s_alpha:
                s_alpha = dist_to_light
                delta_v = self.speed - 0.0 # Light is "stopped"

        # --- IDM Equation ---
        # Desired gap
        s_star = self.s0 + max(0.0, self.speed * self.T + (self.speed * delta_v) / (2 * math.sqrt(self.a * self.b)))
        
        # Acceleration
        self.acceleration = self.a * (1 - (self.speed / max(self.v0, 0.01))**4 - (s_star / max(s_alpha, 0.01))**2)
        
        # --- Update Kinematics ---
        self.speed += self.acceleration * dt
        # Never go backward
        self.speed = max(0.0, self.speed) 
        
        self.position += self.speed * dt
        
    def to_dict(self):
        return {
            "id": self.id,
            "lane": self.lane,
            "position": round(self.position, 2),
            "speed": round(self.speed, 2),
            "acceleration": round(self.acceleration, 2),
            "type": self.vehicle_type,
            "length": self.length
        }

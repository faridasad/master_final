import math

class Vehicle:
    def __init__(self, id, lane, initial_position, desired_speed=15.0): # 15 m/s ~ 54 km/h
        self.id = id
        self.lane = lane  # e.g., 'north_to_south_lane_1'
        self.position = initial_position # distance from start of the lane (meters)
        self.speed = 0.0 # current speed (m/s)
        self.acceleration = 0.0 # current acceleration (m/s^2)
        
        # IDM Parameters (Intelligent Driver Model)
        self.v0 = desired_speed    # Desired speed in free traffic
        self.T = 1.5               # Safe time headway (seconds)
        self.s0 = 2.0              # Minimum gap in stopped traffic (meters)
        self.a = 1.5               # Maximum acceleration (m/s^2)
        self.b = 2.0               # Comfortable deceleration (m/s^2)
        
        self.length = 5.0          # Vehicle length (meters)

    def update(self, dt, leading_vehicle=None, traffic_light_distance=None, traffic_light_state=None):
        """
        Updates the vehicle's position, speed, and acceleration based on IDM.
        dt: Time step (seconds)
        """
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
        self.acceleration = self.a * (1 - (self.speed / self.v0)**4 - (s_star / s_alpha)**2)
        
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
            "acceleration": round(self.acceleration, 2)
        }

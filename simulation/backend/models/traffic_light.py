class TrafficLightController:
    def __init__(self, position=140.0):
        # We place all traffic lights at the same relative distance from the start of their respective lanes
        self.position = position
        self.cycle_time = 0.0
        
        # Phases
        self.phases = [
            {"ns": "Green", "sn": "Green", "ew": "Red", "we": "Red", "duration": 15.0},
            {"ns": "Yellow", "sn": "Yellow", "ew": "Red", "we": "Red", "duration": 3.0},
            {"ns": "Red", "sn": "Red", "ew": "Green", "we": "Green", "duration": 15.0},
            {"ns": "Red", "sn": "Red", "ew": "Yellow", "we": "Yellow", "duration": 3.0}
        ]
        self.current_phase_index = 0
        
        # Current States
        self.states = {
            "north_south": "Green",
            "south_north": "Green",
            "east_west": "Red",
            "west_east": "Red"
        }
        self.update_states()

    def update_states(self):
        phase = self.phases[self.current_phase_index]
        self.states["north_south"] = str(phase["ns"])
        self.states["south_north"] = str(phase["sn"])
        self.states["east_west"] = str(phase["ew"])
        self.states["west_east"] = str(phase["we"])

    def step(self, dt):
        self.cycle_time += dt
        current_phase_duration = float(self.phases[self.current_phase_index]["duration"])
        
        if self.cycle_time >= current_phase_duration:
            self.cycle_time -= current_phase_duration
            self.current_phase_index = (self.current_phase_index + 1) % len(self.phases)
            self.update_states()

    def get_state(self, lane):
        return self.states.get(lane, "Red")

    def to_dict(self):
        return {
            "states": self.states,
            "position": self.position,
            "phase_index": self.current_phase_index,
            "time_left": round(self.phases[self.current_phase_index]["duration"] - self.cycle_time, 1)
        }

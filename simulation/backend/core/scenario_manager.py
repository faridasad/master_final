"""
Scenario Manager

Provides pre-configured traffic scenarios for testing and demonstration.
Supports three scenarios as described in Chapter 3.3:
  - Peak Hour (Pik Saatı): High vehicle density, frequent spawning
  - Normal (Gündüz): Moderate traffic
  - Night (Gecə): Low traffic, yellow-flash mode for traffic lights

This enables quantitative comparison of system behavior under different
real-world conditions as required for the dissertation defense.
"""


# Pre-defined scenario configurations
SCENARIOS = {
    "peak": {
        "name": "Pik Saatı (08:00-09:00)",
        "name_en": "Peak Hour",
        "spawn_interval": 1.0,
        "max_vehicles": 80,
        "traffic_light_mode": "normal",    # normal cycling
        "description": "Yüksək sıxlıqlı pik saatı simulyasiyası — sürətli spawn, çox maşın"
    },
    "normal": {
        "name": "Normal (12:00-14:00)",
        "name_en": "Normal Daytime",
        "spawn_interval": 3.0,
        "max_vehicles": 45,
        "traffic_light_mode": "normal",
        "description": "Orta sıxlıqlı gündüz trafiği"
    },
    "night": {
        "name": "Gecə (23:00-02:00)",
        "name_en": "Night",
        "spawn_interval": 8.0,
        "max_vehicles": 12,
        "traffic_light_mode": "flash_yellow",  # all lights flash yellow
        "description": "Gecə rejimi — az trafik, sarı yanıb-sönmə"
    },
    "stress": {
        "name": "Stress Testi",
        "name_en": "Stress Test",
        "spawn_interval": 0.5,
        "max_vehicles": 120,
        "traffic_light_mode": "normal",
        "description": "Sistemin maksimum yüklənmə testləri — çox sıx trafik"
    }
}


class ScenarioManager:
    """Manages scenario selection and applies configs to the simulation engine."""

    def __init__(self):
        self.current_scenario = "normal"

    def get_available_scenarios(self):
        """Return list of available scenarios for the frontend."""
        result = []
        for key, cfg in SCENARIOS.items():
            result.append({
                "id": key,
                "name": cfg["name"],
                "name_en": cfg["name_en"],
                "description": cfg["description"],
                "spawn_interval": cfg["spawn_interval"],
                "max_vehicles": cfg["max_vehicles"],
                "active": key == self.current_scenario
            })
        return result

    def apply_scenario(self, scenario_id: str, engine):
        """
        Apply a scenario configuration to the simulation engine.
        
        Args:
            scenario_id: key from SCENARIOS dict
            engine: SimulationEngine instance
        """
        if scenario_id not in SCENARIOS:
            return {"error": f"Unknown scenario: {scenario_id}"}

        cfg = SCENARIOS[scenario_id]
        self.current_scenario = scenario_id

        # Apply spawn parameters
        engine.spawn_interval = cfg["spawn_interval"]
        engine.max_vehicles = cfg["max_vehicles"]

        # Handle traffic light mode
        if cfg["traffic_light_mode"] == "flash_yellow":
            for tl in engine.traffic_lights.values():
                tl.mode = "flash_yellow"
        else:
            # Restore to whatever mode engine had before (adaptive/fixed)
            for tl in engine.traffic_lights.values():
                if tl.mode == "flash_yellow":
                    tl.mode = "adaptive"

        return {
            "success": True,
            "scenario": scenario_id,
            "name": cfg["name"],
            "spawn_interval": cfg["spawn_interval"],
            "max_vehicles": cfg["max_vehicles"]
        }

    def to_dict(self):
        """Serialize current state for frontend."""
        return {
            "current": self.current_scenario,
            "current_name": SCENARIOS.get(self.current_scenario, {}).get("name", ""),
            "scenarios": self.get_available_scenarios()
        }

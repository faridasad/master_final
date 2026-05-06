"""
KPI (Key Performance Indicator) Collector

Collects real-time performance metrics from the simulation to enable
quantitative comparison between Fixed-time and Adaptive traffic control.

Tracked Metrics:
  - Average delay per vehicle at intersections
  - Throughput (vehicles passing through intersections per minute)
  - Average travel time across the network
  - Queue lengths over time
  - Average network speed over time
  - CO2 emissions (g/s) — COPERT simplified model

This module provides the data needed for Chapter 3.4:
"Əldə olunan nəticələrin qrafik analizləri və performansın dəyərləndirilməsi"
"""

from collections import deque

# HCM 6th Edition Table 19-8: LOS for signalized intersections based on control delay
_LOS_THRESHOLDS = [
    (10.0, 'A'),
    (20.0, 'B'),
    (35.0, 'C'),
    (55.0, 'D'),
    (80.0, 'E'),
]

def delay_to_los(delay_s: float) -> str:
    """Map average control delay (s/veh) to HCM Level of Service grade."""
    for threshold, grade in _LOS_THRESHOLDS:
        if delay_s < threshold:
            return grade
    return 'F'


# Simplified COPERT hot-emission model
# Source: Ntziachristos & Samaras, EMEP/EEA Air Pollutant Emission Inventory Guidebook (2016)
# ef(v) = 170 + 800/v  [g CO2/km]  — urban driving envelope for petrol Euro 4 average fleet
# Vehicle type multipliers scale relative to a mid-sized passenger car
_EMISSION_FACTORS = {
    'car':   1.00,   # baseline
    'suv':   1.30,   # heavier, higher drag
    'bus':   3.80,   # diesel, ~12 m
    'truck': 4.50,   # diesel HGV, ~10 m
}

def speed_to_co2_g_per_s(speed_ms: float, vehicle_type: str = 'car') -> float:
    """
    Instantaneous CO2 emission rate (g/s) from vehicle speed.
    Uses simplified COPERT polynomial calibrated for urban conditions.
    """
    factor = _EMISSION_FACTORS.get(vehicle_type, 1.0)
    v_kmh = speed_ms * 3.6
    if v_kmh < 0.5:
        return factor * 0.025          # idle: ~1.5 g/min per car
    ef_g_per_km = 170.0 + 800.0 / v_kmh
    speed_km_per_s = v_kmh / 3600.0
    return factor * ef_g_per_km * speed_km_per_s


class KPICollector:
    """
    Accumulates simulation KPIs and stores periodic snapshots
    for historical charting on the frontend.
    """

    def __init__(self, snapshot_interval=5.0, max_snapshots=500):
        self.snapshot_interval = snapshot_interval
        self.max_snapshots = max_snapshots
        self.timer = 0.0
        self.sim_clock = 0.0

        # --- Running Accumulators ---
        self.total_delay = 0.0
        self.total_vehicles_completed = 0
        self.total_travel_time = 0.0
        self.total_co2_g = 0.0          # cumulative CO2 in grams

        # Per-interval counters (reset each snapshot)
        self._interval_delay = 0.0
        self._interval_passed = 0
        self._interval_stopped_ticks = 0
        self._interval_vehicle_ticks = 0
        self._interval_co2_g = 0.0      # CO2 emitted this interval

        # --- Snapshot History ---
        self.snapshots = deque(maxlen=max_snapshots)

        # --- Comparison Mode ---
        self.comparison_data = {
            "fixed": [],
            "adaptive": []
        }
        self._current_mode = "adaptive"

    def set_mode(self, mode: str):
        self._current_mode = mode

    def record_vehicle_stopped(self, dt):
        self.total_delay += dt
        self._interval_delay += dt
        self._interval_stopped_ticks += 1

    def record_vehicle_tick(self):
        self._interval_vehicle_ticks += 1

    def record_vehicle_emission(self, co2_g: float):
        """Called each tick with the CO2 emitted (grams) by one vehicle."""
        self.total_co2_g += co2_g
        self._interval_co2_g += co2_g

    def record_vehicle_passed_intersection(self):
        self._interval_passed += 1

    def record_vehicle_completed(self, travel_time: float):
        self.total_vehicles_completed += 1
        self.total_travel_time += travel_time

    def step(self, dt, active_count, avg_speed_ms, stopped_count, queue_lengths):
        self.sim_clock += dt
        self.timer += dt

        if self.timer < self.snapshot_interval:
            return

        self.timer = 0.0

        throughput_per_min = (self._interval_passed / self.snapshot_interval) * 60.0
        avg_delay_per_vehicle = (
            self._interval_delay / max(self._interval_vehicle_ticks, 1)
        )
        stopped_ratio = (
            self._interval_stopped_ticks / max(self._interval_vehicle_ticks, 1)
        ) * 100.0
        max_queue = max(queue_lengths.values()) if queue_lengths else 0

        # CO2 rate in g/s (average over this interval)
        co2_rate_g_per_s = self._interval_co2_g / self.snapshot_interval

        snapshot = {
            "time": round(self.sim_clock, 1),
            "active_count": active_count,
            "avg_speed_kmh": round(avg_speed_ms * 3.6, 1),
            "stopped_count": stopped_count,
            "throughput_per_min": round(throughput_per_min, 1),
            "avg_delay_s": round(avg_delay_per_vehicle, 2),
            "stopped_ratio_pct": round(stopped_ratio, 1),
            "max_queue_length": max_queue,
            "los_grade": delay_to_los(avg_delay_per_vehicle),
            "co2_rate_g_per_s": round(co2_rate_g_per_s, 1),
            "total_co2_kg": round(self.total_co2_g / 1000, 2),
            "mode": self._current_mode
        }

        self.snapshots.append(snapshot)

        if self._current_mode in self.comparison_data:
            comp_list = self.comparison_data[self._current_mode]
            if len(comp_list) < self.max_snapshots:
                comp_list.append(snapshot)

        # Reset interval counters
        self._interval_delay = 0.0
        self._interval_passed = 0
        self._interval_stopped_ticks = 0
        self._interval_vehicle_ticks = 0
        self._interval_co2_g = 0.0

    def get_current_kpis(self):
        if not self.snapshots:
            return {
                "avg_speed_kmh": 0, "throughput_per_min": 0,
                "avg_delay_s": 0, "stopped_ratio_pct": 0,
                "max_queue_length": 0, "los_grade": "?",
                "co2_rate_g_per_s": 0, "total_co2_kg": 0,
            }
        latest = self.snapshots[-1]
        return {
            "avg_speed_kmh": latest["avg_speed_kmh"],
            "throughput_per_min": latest["throughput_per_min"],
            "avg_delay_s": latest["avg_delay_s"],
            "stopped_ratio_pct": latest["stopped_ratio_pct"],
            "max_queue_length": latest["max_queue_length"],
            "los_grade": latest.get("los_grade", "?"),
            "co2_rate_g_per_s": latest.get("co2_rate_g_per_s", 0),
            "total_co2_kg": latest.get("total_co2_kg", 0),
        }

    def get_summary(self):
        return {
            "total_sim_time": round(self.sim_clock, 1),
            "total_delay": round(self.total_delay, 1),
            "vehicles_completed": self.total_vehicles_completed,
            "avg_travel_time": round(
                self.total_travel_time / max(self.total_vehicles_completed, 1), 1
            ),
            "total_co2_kg": round(self.total_co2_g / 1000, 2),
        }

    def reset_comparison(self):
        self.comparison_data = {"fixed": [], "adaptive": []}

    def to_dict(self):
        return {
            "current_kpis": self.get_current_kpis(),
            "summary": self.get_summary(),
            "snapshots": list(self.snapshots),
            "comparison": {
                "fixed": self.comparison_data["fixed"][-60:],
                "adaptive": self.comparison_data["adaptive"][-60:]
            }
        }

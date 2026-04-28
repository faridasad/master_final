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

This module provides the data needed for Chapter 3.4:
"Əldə olunan nəticələrin qrafik analizləri və performansın dəyərləndirilməsi"
"""

import time
from collections import deque


class KPICollector:
    """
    Accumulates simulation KPIs and stores periodic snapshots
    for historical charting on the frontend.
    """

    def __init__(self, snapshot_interval=5.0, max_snapshots=500):
        self.snapshot_interval = snapshot_interval  # seconds between snapshots
        self.max_snapshots = max_snapshots
        self.timer = 0.0
        self.sim_clock = 0.0  # total simulation time elapsed

        # --- Running Accumulators ---
        self.total_delay = 0.0          # cumulative seconds vehicles spent stopped
        self.total_vehicles_completed = 0  # vehicles that left the network
        self.total_travel_time = 0.0    # cumulative travel time of completed vehicles

        # Per-step counters (reset each snapshot)
        self._interval_delay = 0.0
        self._interval_passed = 0       # vehicles passing intersections this interval
        self._interval_stopped_ticks = 0
        self._interval_vehicle_ticks = 0

        # --- Snapshot History ---
        self.snapshots = deque(maxlen=max_snapshots)

        # --- Comparison Mode ---
        self.comparison_data = {
            "fixed": [],    # snapshots recorded while in fixed mode
            "adaptive": []  # snapshots recorded while in adaptive mode
        }
        self._current_mode = "adaptive"

    def set_mode(self, mode: str):
        """Track which mode the system is currently in for comparison."""
        self._current_mode = mode

    def record_vehicle_stopped(self, dt):
        """Called each tick for each vehicle that is stopped (speed < 1 m/s)."""
        self.total_delay += dt
        self._interval_delay += dt
        self._interval_stopped_ticks += 1

    def record_vehicle_tick(self):
        """Called each tick for each active vehicle."""
        self._interval_vehicle_ticks += 1

    def record_vehicle_passed_intersection(self):
        """Called when a vehicle successfully crosses an intersection."""
        self._interval_passed += 1

    def record_vehicle_completed(self, travel_time: float):
        """Called when a vehicle exits the network (dead end reached)."""
        self.total_vehicles_completed += 1
        self.total_travel_time += travel_time

    def step(self, dt, active_count, avg_speed_ms, stopped_count, queue_lengths):
        """
        Called every simulation step. Periodically creates snapshots.
        
        Args:
            dt: simulation time step
            active_count: number of active vehicles
            avg_speed_ms: average speed in m/s
            stopped_count: vehicles with speed < 1 m/s
            queue_lengths: dict of edge_id -> queue length (vehicles waiting)
        """
        self.sim_clock += dt
        self.timer += dt

        if self.timer < self.snapshot_interval:
            return

        self.timer = 0.0

        # Calculate interval metrics
        throughput_per_min = (self._interval_passed / self.snapshot_interval) * 60.0
        avg_delay_per_vehicle = (
            self._interval_delay / max(self._interval_vehicle_ticks, 1)
        )
        stopped_ratio = (
            self._interval_stopped_ticks / max(self._interval_vehicle_ticks, 1)
        ) * 100.0

        # Max queue length
        max_queue = max(queue_lengths.values()) if queue_lengths else 0

        snapshot = {
            "time": round(self.sim_clock, 1),
            "active_count": active_count,
            "avg_speed_kmh": round(avg_speed_ms * 3.6, 1),
            "stopped_count": stopped_count,
            "throughput_per_min": round(throughput_per_min, 1),
            "avg_delay_s": round(avg_delay_per_vehicle, 2),
            "stopped_ratio_pct": round(stopped_ratio, 1),
            "max_queue_length": max_queue,
            "mode": self._current_mode
        }

        self.snapshots.append(snapshot)

        # Also store in comparison buckets
        if self._current_mode in self.comparison_data:
            comp_list = self.comparison_data[self._current_mode]
            if len(comp_list) < self.max_snapshots:
                comp_list.append(snapshot)

        # Reset interval counters
        self._interval_delay = 0.0
        self._interval_passed = 0
        self._interval_stopped_ticks = 0
        self._interval_vehicle_ticks = 0

    def get_current_kpis(self):
        """Return the latest KPI values for the dashboard."""
        if not self.snapshots:
            return {
                "avg_speed_kmh": 0, "throughput_per_min": 0,
                "avg_delay_s": 0, "stopped_ratio_pct": 0,
                "max_queue_length": 0
            }
        latest = self.snapshots[-1]
        return {
            "avg_speed_kmh": latest["avg_speed_kmh"],
            "throughput_per_min": latest["throughput_per_min"],
            "avg_delay_s": latest["avg_delay_s"],
            "stopped_ratio_pct": latest["stopped_ratio_pct"],
            "max_queue_length": latest["max_queue_length"],
        }

    def get_summary(self):
        """Overall simulation summary."""
        return {
            "total_sim_time": round(self.sim_clock, 1),
            "total_delay": round(self.total_delay, 1),
            "vehicles_completed": self.total_vehicles_completed,
            "avg_travel_time": round(
                self.total_travel_time / max(self.total_vehicles_completed, 1), 1
            ),
        }

    def reset_comparison(self):
        """Clear comparison data for a fresh experiment."""
        self.comparison_data = {"fixed": [], "adaptive": []}

    def to_dict(self):
        """Serialize for API/frontend."""
        return {
            "current_kpis": self.get_current_kpis(),
            "summary": self.get_summary(),
            "snapshots": list(self.snapshots),
            "comparison": {
                "fixed": self.comparison_data["fixed"][-60:],      # last 60 snapshots
                "adaptive": self.comparison_data["adaptive"][-60:]
            }
        }

"""
Headless simulation runner — runs SimulationEngine without FastAPI/WebSocket,
records all data needed for dissertation plots.

Usage:
  python headless_runner.py --mode fixed --scenario peak --duration 600 --out data/peak_fixed.json
  python headless_runner.py --mode adaptive --scenario peak --duration 600 --out data/peak_adaptive.json
"""

import argparse
import json
import sys
import os
import time
from pathlib import Path

# Add backend to sys.path and chdir there so engine can find baku_map.json
BACKEND = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND))
os.chdir(BACKEND)

from core.engine import SimulationEngine


def run(mode: str, scenario: str, duration: float, out_path: Path,
        green_wave: bool = False, target_speed: float = 50.0,
        corridor_record_top: int = 1, dt: float = 0.02):
    """
    Run a single simulation experiment, return JSON-serializable dict.

    Args:
        mode: "fixed" or "adaptive"
        scenario: "peak" | "normal" | "night" | "stress"
        duration: simulation seconds
        out_path: where to write JSON
        green_wave: apply green wave after warmup?
        corridor_record_top: how many corridors to record vehicle trajectories for
    """
    print(f"[init] mode={mode} scenario={scenario} duration={duration}s green_wave={green_wave}")
    engine = SimulationEngine()
    engine.running = True

    # Apply scenario
    engine.scenario_manager.apply_scenario(scenario, engine)

    # Configure mode for all intersections
    for tl in engine.traffic_lights.values():
        if tl.mode == "flash_yellow":
            continue
        tl.mode = mode
    if mode == "adaptive":
        engine.adaptive_controller.enabled = True
    else:
        engine.adaptive_controller.enabled = False

    # Optionally apply green wave at start
    if green_wave:
        engine.green_wave.apply_green_wave(engine.traffic_lights, target_speed)

    # Pick corridor edges to track for time-space plot
    tracked_corridor = None
    if engine.green_wave.corridors and corridor_record_top > 0:
        # Use the longest corridor
        tracked_corridor = max(engine.green_wave.corridors, key=len)
        tracked_edge_ids = [e["id"] for e in tracked_corridor]
        # Cumulative offset of each edge along corridor (start of each edge)
        offsets = []
        cum = 0.0
        for e in tracked_corridor:
            offsets.append(cum)
            cum += e["length_m"]
        tracked_edge_offsets = dict(zip(tracked_edge_ids, offsets))
        corridor_total_len = cum
        print(f"[corridor] tracking {len(tracked_edge_ids)} edges, total {corridor_total_len:.0f} m")
    else:
        tracked_edge_ids = []
        tracked_edge_offsets = {}
        corridor_total_len = 0

    # Data structures
    kpi_snapshots = []
    queue_snapshots = []     # per-edge queue counts, every 5s
    completions = []          # per-vehicle on completion
    corridor_trajectories = {}  # vehicle_id -> [(t, dist_in_corridor, edge_id)]
    corridor_vehicles_seen = set()
    phase_events = []         # (time, node_id, phase_index, duration_left)

    # Monkey-patch record_vehicle_completed to capture more data
    original_complete = engine.kpi_collector.record_vehicle_completed

    def patched_complete(travel_time):
        # Find the vehicle that completed — engine calls this from transfer_vehicle
        # We don't have direct access here, so we'll instrument differently below
        original_complete(travel_time)

    engine.kpi_collector.record_vehicle_completed = patched_complete

    # Pre-record vehicle metadata by capturing on spawn
    vehicle_meta = {}  # vid -> {type, birth_time, lane}

    def wrap_add_vehicle():
        original_add = engine.add_vehicle

        def wrapped():
            before_keys = {v.id for vlist in engine.vehicles.values() for v in vlist}
            original_add()
            after = {v.id: v for vlist in engine.vehicles.values() for v in vlist}
            for vid, v in after.items():
                if vid not in before_keys:
                    vehicle_meta[vid] = {
                        "type": v.vehicle_type,
                        "birth_time": v.birth_time,
                        "initial_lane": v.lane,
                    }
        return wrapped

    engine.add_vehicle = wrap_add_vehicle()

    # Sample loop
    snapshot_interval = 5.0
    last_snapshot = 0.0
    sim_time = 0.0
    start_wall = time.time()

    # Track vehicles still in network at each step (for completion detection)
    seen_vehicles = set()
    # Track per-vehicle state for stop count / travel time on completion
    vehicle_state = {}  # vid -> {first_seen, last_stopped_time, stop_count, last_speed}

    steps = int(duration / dt)
    print(f"[run] {steps} steps @ dt={dt}s")

    for step_i in range(steps):
        # Snapshot current vehicle ids before step
        before_vids = {v.id: (v.lane, v.position, v.speed, v.total_stopped_time)
                       for vlist in engine.vehicles.values() for v in vlist}

        engine.step(dt)
        sim_time = engine.sim_clock

        after_vids = {v.id: (v.lane, v.position, v.speed, v.total_stopped_time)
                      for vlist in engine.vehicles.values() for v in vlist}

        # Detect vehicles that disappeared this step → completed (or stuck removed)
        disappeared = set(before_vids) - set(after_vids)
        for vid in disappeared:
            lane, pos, spd, stopped_time = before_vids[vid]
            meta = vehicle_meta.get(vid, {"birth_time": 0, "type": "car"})
            travel_time = sim_time - meta["birth_time"]
            completions.append({
                "vid": vid,
                "type": meta.get("type", "car"),
                "travel_time": round(travel_time, 2),
                "total_stopped_time": round(stopped_time, 2),
                "birth_time": round(meta.get("birth_time", 0), 2),
                "completion_time": round(sim_time, 2),
                "final_edge": lane,
            })

        # Update vehicle_state for stop tracking (count transitions to stopped)
        for vid, (lane, pos, spd, st) in after_vids.items():
            prev = vehicle_state.get(vid)
            if prev is None:
                vehicle_state[vid] = {"prev_speed": spd, "stop_count": 0}
            else:
                if prev["prev_speed"] >= 1.0 and spd < 1.0:
                    prev["stop_count"] += 1
                prev["prev_speed"] = spd

        # Corridor trajectory recording
        if tracked_edge_ids:
            for vid, (lane, pos, spd, _) in after_vids.items():
                if lane in tracked_edge_offsets:
                    dist = tracked_edge_offsets[lane] + pos
                    if vid not in corridor_trajectories:
                        # Limit to first ~25 vehicles that enter corridor
                        if len(corridor_trajectories) < 25:
                            corridor_trajectories[vid] = []
                            corridor_vehicles_seen.add(vid)
                        else:
                            continue
                    # Sample every ~0.5s to keep size manageable
                    samples = corridor_trajectories[vid]
                    if not samples or sim_time - samples[-1][0] >= 0.5:
                        samples.append((round(sim_time, 2), round(dist, 1), lane))

        # Periodic snapshot for queue lengths + phase state
        if sim_time - last_snapshot >= snapshot_interval:
            last_snapshot = sim_time
            queue_snapshots.append({
                "t": round(sim_time, 1),
                "queues": {eid: len(vlist) for eid, vlist in engine.vehicles.items()},
            })
            # Phase utilization sample
            for nid, tl in engine.traffic_lights.items():
                if tl.phases:
                    cur = tl.phases[tl.current_phase_index]
                    phase_events.append({
                        "t": round(sim_time, 1),
                        "node": nid,
                        "phase_idx": tl.current_phase_index,
                        "phase_dur": cur.get("duration", 0),
                        "mode": tl.mode,
                    })

    # Final KPI snapshots from the collector
    kpi_snapshots = list(engine.kpi_collector.snapshots)

    # Augment completions with stop_count from vehicle_state
    completed_vids = {c["vid"] for c in completions}
    for c in completions:
        st = vehicle_state.get(c["vid"])
        c["stop_count"] = st["stop_count"] if st else 0

    summary = engine.kpi_collector.get_summary()
    elapsed_wall = time.time() - start_wall
    print(f"[done] sim_time={sim_time:.1f}s wall={elapsed_wall:.1f}s")
    print(f"[done] completions={len(completions)} kpi_snapshots={len(kpi_snapshots)}")

    out = {
        "metadata": {
            "mode": mode,
            "scenario": scenario,
            "duration": duration,
            "green_wave": green_wave,
            "target_speed_kmh": target_speed if green_wave else None,
            "dt": dt,
            "elapsed_wall_s": round(elapsed_wall, 1),
            "n_intersections": len(engine.traffic_lights),
            "n_edges": len(engine.edges),
        },
        "summary": summary,
        "kpi_snapshots": kpi_snapshots,
        "queue_snapshots": queue_snapshots,
        "completions": completions,
        "phase_events": phase_events[:5000],  # cap size
        "corridor": {
            "edge_ids": tracked_edge_ids,
            "edge_offsets": tracked_edge_offsets,
            "total_length_m": corridor_total_len,
            "trajectories": {
                vid: samples
                for vid, samples in corridor_trajectories.items()
            },
        } if tracked_edge_ids else None,
    }

    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
    print(f"[saved] {out_path}")
    return out


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["fixed", "adaptive"], default="adaptive")
    parser.add_argument("--scenario", default="normal")
    parser.add_argument("--duration", type=float, default=600.0)
    parser.add_argument("--out", required=True)
    parser.add_argument("--green-wave", action="store_true")
    parser.add_argument("--target-speed", type=float, default=50.0)
    parser.add_argument("--dt", type=float, default=0.02)
    args = parser.parse_args()

    run(
        mode=args.mode,
        scenario=args.scenario,
        duration=args.duration,
        out_path=Path(args.out),
        green_wave=args.green_wave,
        target_speed=args.target_speed,
        dt=args.dt,
    )


if __name__ == "__main__":
    main()

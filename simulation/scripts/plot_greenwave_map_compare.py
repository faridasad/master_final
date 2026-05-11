"""
Green Wave time-space, map visualizations, and comparison plots.

Generates:
  21_greenwave_timespace.png  — vehicle trajectories along corridor (GW on vs off)
  22_network_map.png          — Bakı network nodes + edges
  23_congestion_map.png       — edges colored by avg congestion (peak adaptive)
  24_corridors_map.png        — corridors highlighted on network
  25_fixed_vs_adaptive.png    — 4-panel comparison (peak scenario)
  26_scenario_radar.png       — KPIs per scenario × mode radar
"""

import json
from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.collections import LineCollection
import seaborn as sns

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
OUT = ROOT / "diagrams"
MAP = ROOT / "backend" / "baku_map.json"

sns.set_style("whitegrid")
plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 11})

MODE_COLORS = {"fixed": "#c62828", "adaptive": "#2e7d32"}
SCENARIO_LABELS = {"normal": "Normal", "peak": "Pik saatı",
                   "night": "Gecə", "stress": "Stress"}


def load_json(p):
    return json.loads(Path(p).read_text(encoding="utf-8"))


def load_map():
    return load_json(MAP)


# ---------- 21. Green Wave time-space ----------
def plot_greenwave_timespace():
    d_off = load_json(DATA / "normal_adaptive.json")
    d_on = load_json(DATA / "normal_adaptive_gw.json")

    fig, axes = plt.subplots(1, 2, figsize=(15, 6), sharey=True)
    for ax, label, d in zip(axes, ["GW söndürülmüş", "GW yandırılmış"], [d_off, d_on]):
        corr = d.get("corridor")
        if not corr or not corr["trajectories"]:
            ax.text(0.5, 0.5, "Koridor məlumatı yoxdur", ha="center", va="center",
                    transform=ax.transAxes)
            continue
        # Draw edge boundaries
        cum = 0.0
        for eid in corr["edge_ids"]:
            cum_next = corr["edge_offsets"].get(eid, cum)
            ax.axhline(cum_next, color="#888", lw=0.6, ls=":")
            cum = cum_next
        ax.axhline(corr["total_length_m"], color="#888", lw=0.6, ls=":")

        for vid, samples in corr["trajectories"].items():
            if len(samples) < 2:
                continue
            ts = [s[0] for s in samples]
            xs = [s[1] for s in samples]
            ax.plot(ts, xs, lw=1.0, alpha=0.6)
        ax.set_xlabel("Vaxt (s)")
        if ax is axes[0]:
            ax.set_ylabel("Koridor üzrə məsafə (m)")
        ax.set_title(f"{label}\n({len(corr['trajectories'])} avtomobil izi)")
        ax.set_ylim(0, corr["total_length_m"] + 5)

    fig.suptitle("Green Wave Zaman–Məsafə Diaqramı (normal senari, adaptive rejim)",
                 fontsize=13, y=1.00)
    fig.tight_layout()
    fig.savefig(OUT / "21_greenwave_timespace.png", dpi=150, bbox_inches="tight",
                facecolor="white")
    plt.close(fig)
    print("[OK] 21_greenwave_timespace.png")


def _draw_network(ax, mp, color_map=None, highlight_edges=None,
                  show_nodes=True, show_intersections=True):
    """Draw network: nodes as small dots, edges as lines."""
    nodes = mp["nodes"]
    edges = mp["edges"]

    # Edges
    segments = []
    colors = []
    for e in edges:
        u = nodes.get(e["u"])
        v = nodes.get(e["v"])
        if not u or not v:
            continue
        segments.append([(u["lng"], u["lat"]), (v["lng"], v["lat"])])
        if color_map and e["id"] in color_map:
            colors.append(color_map[e["id"]])
        elif highlight_edges and e["id"] in highlight_edges:
            colors.append("#d32f2f")
        else:
            colors.append("#999")
    lc = LineCollection(segments, colors=colors, linewidths=1.5, alpha=0.85)
    ax.add_collection(lc)

    # Highlight corridor edges with thicker lines
    if highlight_edges:
        hl_segs = []
        for e in edges:
            if e["id"] in highlight_edges:
                u = nodes[e["u"]]
                v = nodes[e["v"]]
                hl_segs.append([(u["lng"], u["lat"]), (v["lng"], v["lat"])])
        lc_hl = LineCollection(hl_segs, colors="#d32f2f", linewidths=3.5, alpha=0.9)
        ax.add_collection(lc_hl)

    # Intersection nodes (with traffic lights = nodes with >=2 incoming)
    if show_intersections:
        incoming_count = {}
        for e in edges:
            incoming_count[e["v"]] = incoming_count.get(e["v"], 0) + 1
        intersection_nodes = [n for n, c in incoming_count.items() if c >= 2]
        lats = [nodes[n]["lat"] for n in intersection_nodes if n in nodes]
        lngs = [nodes[n]["lng"] for n in intersection_nodes if n in nodes]
        ax.scatter(lngs, lats, color="#1976d2", s=40, zorder=5,
                   edgecolor="white", lw=1.2, label="İşıqforu olan kəsişmə")

    if show_nodes:
        node_lats = [n["lat"] for n in nodes.values()]
        node_lngs = [n["lng"] for n in nodes.values()]
        ax.scatter(node_lngs, node_lats, color="#999", s=4, alpha=0.5, zorder=3)

    ax.set_xlabel("Coğrafi uzunluq (lng)")
    ax.set_ylabel("Coğrafi en (lat)")
    ax.set_aspect("equal", adjustable="datalim")


# ---------- 22. Network map ----------
def plot_network_map():
    mp = load_map()
    fig, ax = plt.subplots(figsize=(12, 10))
    _draw_network(ax, mp)
    ax.set_title("Bakı Trafik Şəbəkəsi — Düyünlər və Edge-lər", fontsize=13)
    ax.legend(loc="lower right")
    ax.grid(alpha=0.3)
    fig.tight_layout()
    fig.savefig(OUT / "22_network_map.png", dpi=150, bbox_inches="tight",
                facecolor="white")
    plt.close(fig)
    print("[OK] 22_network_map.png")


# ---------- 23. Congestion heatmap (on map) ----------
def plot_congestion_map():
    mp = load_map()
    d = load_json(DATA / "peak_adaptive.json")
    queues = d["queue_snapshots"]
    if not queues:
        return
    # Avg queue per edge
    edge_ids = sorted({eid for q in queues for eid in q["queues"]})
    avg_q = {eid: np.mean([q["queues"].get(eid, 0) for q in queues]) for eid in edge_ids}
    max_q = max(avg_q.values()) if avg_q else 1
    cmap = plt.cm.get_cmap("hot_r")
    color_map = {eid: cmap(min(v / max_q, 1.0)) for eid, v in avg_q.items()}

    fig, ax = plt.subplots(figsize=(12, 10))
    _draw_network(ax, mp, color_map=color_map, show_intersections=True, show_nodes=False)
    sm = plt.cm.ScalarMappable(norm=plt.Normalize(0, max_q), cmap=cmap)
    sm.set_array([])
    cbar = plt.colorbar(sm, ax=ax, fraction=0.04, pad=0.04)
    cbar.set_label("Orta avtomobil sayı (peak senari, adaptive)")
    ax.set_title("Trafik sıxılma istilik xəritəsi — Peak senari", fontsize=13)
    ax.legend(loc="lower right")
    fig.tight_layout()
    fig.savefig(OUT / "23_congestion_map.png", dpi=150, bbox_inches="tight",
                facecolor="white")
    plt.close(fig)
    print("[OK] 23_congestion_map.png")


# ---------- 24. Corridors on map ----------
def plot_corridors_map():
    """Highlight green wave corridors using a quick engine init."""
    import sys
    import os
    backend = ROOT / "backend"
    sys.path.insert(0, str(backend))
    saved_cwd = os.getcwd()
    os.chdir(backend)
    try:
        from core.engine import SimulationEngine
        engine = SimulationEngine()
        corr_edge_ids = []
        for c in engine.green_wave.corridors:
            corr_edge_ids.extend(e["id"] for e in c)
    finally:
        os.chdir(saved_cwd)

    mp = load_map()
    fig, ax = plt.subplots(figsize=(12, 10))
    _draw_network(ax, mp, highlight_edges=set(corr_edge_ids), show_nodes=False)
    ax.set_title(f"Aşkar edilmiş Green Wave Koridorları "
                 f"({len(engine.green_wave.corridors)} koridor, "
                 f"{len(corr_edge_ids)} edge)", fontsize=13)
    legend_handles = [
        mpatches.Patch(color="#999", label="Adi yol"),
        mpatches.Patch(color="#d32f2f", label="Green Wave koridoru"),
    ]
    ax.legend(handles=legend_handles, loc="lower right")
    fig.tight_layout()
    fig.savefig(OUT / "24_corridors_map.png", dpi=150, bbox_inches="tight",
                facecolor="white")
    plt.close(fig)
    print("[OK] 24_corridors_map.png")


# ---------- 25. Fixed vs Adaptive 4-panel ----------
def plot_fixed_vs_adaptive():
    d_fix = load_json(DATA / "peak_fixed.json")
    d_ad = load_json(DATA / "peak_adaptive.json")

    fig, axes = plt.subplots(2, 2, figsize=(14, 9))

    # Speed
    ax = axes[0, 0]
    for d, mode in [(d_fix, "fixed"), (d_ad, "adaptive")]:
        snaps = d["kpi_snapshots"]
        ax.plot([s["time"] for s in snaps], [s["avg_speed_kmh"] for s in snaps],
                color=MODE_COLORS[mode], lw=1.8, label=mode.capitalize())
    ax.set_xlabel("Vaxt (s)"); ax.set_ylabel("Orta sürət (km/saat)")
    ax.set_title("Orta sürət"); ax.legend(); ax.grid(alpha=0.3)

    # Delay
    ax = axes[0, 1]
    for d, mode in [(d_fix, "fixed"), (d_ad, "adaptive")]:
        snaps = d["kpi_snapshots"]
        ax.plot([s["time"] for s in snaps], [s["avg_delay_s"] for s in snaps],
                color=MODE_COLORS[mode], lw=1.8, label=mode.capitalize())
    ax.set_xlabel("Vaxt (s)"); ax.set_ylabel("Orta gecikmə (s)")
    ax.set_title("Orta gecikmə"); ax.legend(); ax.grid(alpha=0.3)

    # Throughput
    ax = axes[1, 0]
    for d, mode in [(d_fix, "fixed"), (d_ad, "adaptive")]:
        snaps = d["kpi_snapshots"]
        ax.plot([s["time"] for s in snaps], [s["throughput_per_min"] for s in snaps],
                color=MODE_COLORS[mode], lw=1.8, label=mode.capitalize())
    ax.set_xlabel("Vaxt (s)"); ax.set_ylabel("Keçidlər (avt/dəq)")
    ax.set_title("Throughput"); ax.legend(); ax.grid(alpha=0.3)

    # Max queue
    ax = axes[1, 1]
    for d, mode in [(d_fix, "fixed"), (d_ad, "adaptive")]:
        snaps = d["kpi_snapshots"]
        ax.plot([s["time"] for s in snaps], [s["max_queue_length"] for s in snaps],
                color=MODE_COLORS[mode], lw=1.8, label=mode.capitalize())
    ax.set_xlabel("Vaxt (s)"); ax.set_ylabel("Max növbə uzunluğu")
    ax.set_title("Maksimum növbə"); ax.legend(); ax.grid(alpha=0.3)

    fig.suptitle("Fixed vs Adaptive — Peak senari müqayisəsi", fontsize=14, y=1.00)
    fig.tight_layout()
    fig.savefig(OUT / "25_fixed_vs_adaptive.png", dpi=150, bbox_inches="tight",
                facecolor="white")
    plt.close(fig)
    print("[OK] 25_fixed_vs_adaptive.png")


# ---------- 26. Scenario radar ----------
def plot_scenario_radar():
    """Radar chart: each scenario × mode, 5 axes."""
    SCENARIOS = ["normal", "peak", "night", "stress"]
    metrics = []
    for scn in SCENARIOS:
        for mode in ["fixed", "adaptive"]:
            d = load_json(DATA / f"{scn}_{mode}.json")
            snaps = d["kpi_snapshots"]
            if not snaps:
                continue
            avg_speed = np.mean([s["avg_speed_kmh"] for s in snaps])
            avg_delay = np.mean([s["avg_delay_s"] for s in snaps])
            avg_thr = np.mean([s["throughput_per_min"] for s in snaps])
            avg_q = np.mean([s["max_queue_length"] for s in snaps])
            stopped_pct = np.mean([s["stopped_ratio_pct"] for s in snaps])
            metrics.append({
                "scn": SCENARIO_LABELS[scn], "mode": mode,
                "speed": avg_speed, "delay": avg_delay,
                "thr": avg_thr, "queue": avg_q, "stopped": stopped_pct,
            })
    df = pd.DataFrame(metrics)

    # Normalize each metric to 0-1
    norm_keys = ["speed", "delay", "thr", "queue", "stopped"]
    norm = df.copy()
    for k in norm_keys:
        mn, mx = norm[k].min(), norm[k].max()
        norm[k] = (norm[k] - mn) / max(mx - mn, 1e-9)
    # Invert "delay", "queue", "stopped" so higher = better
    for k in ["delay", "queue", "stopped"]:
        norm[k] = 1.0 - norm[k]

    labels = ["Sürət", "Gecikmə\n(tərs)", "Throughput",
              "Növbə\n(tərs)", "Dayanma %\n(tərs)"]
    angles = np.linspace(0, 2 * np.pi, len(labels), endpoint=False).tolist()
    angles += angles[:1]

    fig, axes = plt.subplots(2, 2, figsize=(13, 13), subplot_kw=dict(projection="polar"))
    axes = axes.flatten()
    for i, scn in enumerate(SCENARIOS):
        ax = axes[i]
        for mode in ["fixed", "adaptive"]:
            row = norm[(norm["scn"] == SCENARIO_LABELS[scn]) & (norm["mode"] == mode)]
            if row.empty:
                continue
            vals = row[norm_keys].iloc[0].tolist()
            vals += vals[:1]
            ax.plot(angles, vals, lw=2, color=MODE_COLORS[mode], label=mode.capitalize())
            ax.fill(angles, vals, alpha=0.18, color=MODE_COLORS[mode])
        ax.set_xticks(angles[:-1])
        ax.set_xticklabels(labels, fontsize=9)
        ax.set_ylim(0, 1)
        ax.set_title(f"{SCENARIO_LABELS[scn]}", pad=18, fontsize=12)
        ax.legend(loc="upper right", bbox_to_anchor=(1.2, 1.1), fontsize=9)
        ax.grid(alpha=0.4)

    fig.suptitle("Senari Müqayisəsi — Normallaşdırılmış KPI Radar\n"
                 "(daha böyük sahə = daha yaxşı)", fontsize=13, y=0.99)
    fig.tight_layout()
    fig.savefig(OUT / "26_scenario_radar.png", dpi=150, bbox_inches="tight",
                facecolor="white")
    plt.close(fig)
    print("[OK] 26_scenario_radar.png")


if __name__ == "__main__":
    plot_greenwave_timespace()
    plot_network_map()
    plot_congestion_map()
    plot_corridors_map()
    plot_fixed_vs_adaptive()
    plot_scenario_radar()
    print(f"\nSaved to: {OUT}")

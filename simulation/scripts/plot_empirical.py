"""
Empirical KPI plots from simulation data.

Generates:
  14_speed_timeseries.png    — avg speed vs time, fixed vs adaptive
  15_delay_boxplot.png       — avg_delay distribution per scenario × mode
  16_throughput_bar.png      — throughput_per_min per scenario × mode
  17_queue_heatmap.png       — edge × time heatmap of queue lengths
  18_travel_time_cdf.png     — CDF of travel_time, fixed vs adaptive
  19_stop_count_hist.png     — histogram of stop_count per vehicle
  20_phase_utilization.png   — adaptive phase duration evolution
"""

import json
from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
OUT = ROOT / "diagrams"

sns.set_style("whitegrid")
plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 11})

SCENARIOS = ["normal", "peak", "night", "stress"]
MODES = ["fixed", "adaptive"]
SCENARIO_LABELS = {
    "normal": "Normal",
    "peak": "Pik saatı",
    "night": "Gecə",
    "stress": "Stress",
}
MODE_LABELS = {"fixed": "Sabit (Fixed)", "adaptive": "Adaptiv"}
MODE_COLORS = {"fixed": "#c62828", "adaptive": "#2e7d32"}


def load(scn, mode, suffix=""):
    p = DATA / f"{scn}_{mode}{suffix}.json"
    return json.loads(p.read_text(encoding="utf-8"))


# ---------- 14. Speed time series ----------
def plot_speed_timeseries():
    fig, axes = plt.subplots(2, 2, figsize=(14, 8), sharex=True)
    axes = axes.flatten()
    for i, scn in enumerate(SCENARIOS):
        ax = axes[i]
        for mode in MODES:
            d = load(scn, mode)
            snaps = d["kpi_snapshots"]
            if not snaps:
                continue
            ts = [s["time"] for s in snaps]
            sp = [s["avg_speed_kmh"] for s in snaps]
            ax.plot(ts, sp, color=MODE_COLORS[mode], lw=1.8,
                    label=MODE_LABELS[mode], alpha=0.85)
        ax.set_title(f"{SCENARIO_LABELS[scn]} senarisi")
        ax.set_xlabel("Simulyasiya vaxtı (s)")
        ax.set_ylabel("Orta sürət (km/saat)")
        ax.legend(loc="upper right", fontsize=9)
        ax.grid(alpha=0.3)
    fig.suptitle("Şəbəkə üzrə orta sürət — Fixed vs Adaptive (vaxt seriyası)",
                 fontsize=14, y=1.00)
    fig.tight_layout()
    fig.savefig(OUT / "14_speed_timeseries.png", dpi=150, bbox_inches="tight",
                facecolor="white")
    plt.close(fig)
    print("[OK] 14_speed_timeseries.png")


# ---------- 15. Delay box plot ----------
def plot_delay_boxplot():
    rows = []
    for scn in SCENARIOS:
        for mode in MODES:
            d = load(scn, mode)
            for s in d["kpi_snapshots"]:
                rows.append({"scn": SCENARIO_LABELS[scn], "mode": MODE_LABELS[mode],
                             "delay": s["avg_delay_s"]})
    df = pd.DataFrame(rows)
    fig, ax = plt.subplots(figsize=(11, 5.5))
    sns.boxplot(data=df, x="scn", y="delay", hue="mode", ax=ax,
                palette={MODE_LABELS["fixed"]: MODE_COLORS["fixed"],
                         MODE_LABELS["adaptive"]: MODE_COLORS["adaptive"]},
                width=0.6)
    ax.set_xlabel("Senari")
    ax.set_ylabel("Orta gecikmə (saniyə/avt-tick)")
    ax.set_title("Avtomobil başına gecikmənin paylanması — Fixed vs Adaptive")
    ax.legend(title="Rejim")
    fig.tight_layout()
    fig.savefig(OUT / "15_delay_boxplot.png", dpi=150, bbox_inches="tight",
                facecolor="white")
    plt.close(fig)
    print("[OK] 15_delay_boxplot.png")


# ---------- 16. Throughput bar chart ----------
def plot_throughput_bar():
    rows = []
    for scn in SCENARIOS:
        for mode in MODES:
            d = load(scn, mode)
            snaps = d["kpi_snapshots"]
            avg = np.mean([s["throughput_per_min"] for s in snaps]) if snaps else 0
            rows.append({"scn": SCENARIO_LABELS[scn], "mode": MODE_LABELS[mode],
                         "throughput": avg})
    df = pd.DataFrame(rows)
    fig, ax = plt.subplots(figsize=(10, 5.5))
    sns.barplot(data=df, x="scn", y="throughput", hue="mode", ax=ax,
                palette={MODE_LABELS["fixed"]: MODE_COLORS["fixed"],
                         MODE_LABELS["adaptive"]: MODE_COLORS["adaptive"]})
    for container in ax.containers:
        ax.bar_label(container, fmt="%.1f", padding=3, fontsize=9)
    ax.set_xlabel("Senari")
    ax.set_ylabel("Orta keçidlər (avt/dəq)")
    ax.set_title("Kəsişmə keçidləri (throughput) — Fixed vs Adaptive")
    ax.legend(title="Rejim")
    fig.tight_layout()
    fig.savefig(OUT / "16_throughput_bar.png", dpi=150, bbox_inches="tight",
                facecolor="white")
    plt.close(fig)
    print("[OK] 16_throughput_bar.png")


# ---------- 17. Queue heatmap ----------
def plot_queue_heatmap():
    """Edge × time queue heatmap for peak/adaptive run."""
    d = load("peak", "adaptive")
    queues = d["queue_snapshots"]
    if not queues:
        return
    times = [q["t"] for q in queues]
    edge_ids = sorted({eid for q in queues for eid in q["queues"]})
    # Filter to top 20 most-loaded edges
    avg_load = {eid: np.mean([q["queues"].get(eid, 0) for q in queues]) for eid in edge_ids}
    top_edges = sorted(avg_load, key=avg_load.get, reverse=True)[:20]

    mat = np.zeros((len(top_edges), len(times)))
    for j, q in enumerate(queues):
        for i, eid in enumerate(top_edges):
            mat[i, j] = q["queues"].get(eid, 0)

    fig, ax = plt.subplots(figsize=(13, 6))
    im = ax.imshow(mat, aspect="auto", cmap="hot_r", origin="lower",
                   extent=[min(times), max(times), 0, len(top_edges)])
    ax.set_xlabel("Simulyasiya vaxtı (s)")
    ax.set_ylabel("Edge sırası (top-20 ən sıxılan)")
    ax.set_yticks(np.arange(len(top_edges)) + 0.5)
    ax.set_yticklabels([eid[:20] for eid in top_edges], fontsize=8)
    plt.colorbar(im, ax=ax, label="Avtomobil sayı (queue)")
    ax.set_title("Növbə uzunluğu istilik xəritəsi — Peak senari / Adaptive rejim")
    fig.tight_layout()
    fig.savefig(OUT / "17_queue_heatmap.png", dpi=150, bbox_inches="tight",
                facecolor="white")
    plt.close(fig)
    print("[OK] 17_queue_heatmap.png")


# ---------- 18. Travel time CDF ----------
def plot_travel_time_cdf():
    fig, axes = plt.subplots(1, 2, figsize=(13, 5))
    # Left: peak comparison
    for ax_i, scn in enumerate(["peak", "stress"]):
        ax = axes[ax_i]
        for mode in MODES:
            d = load(scn, mode)
            tt = sorted([c["travel_time"] for c in d["completions"]])
            if not tt:
                continue
            cdf = np.arange(1, len(tt) + 1) / len(tt)
            ax.plot(tt, cdf, lw=2, color=MODE_COLORS[mode], label=MODE_LABELS[mode])
        ax.set_xlabel("Səfər vaxtı (s)")
        ax.set_ylabel("Kumulyativ tezlik (CDF)")
        ax.set_title(f"{SCENARIO_LABELS[scn]}")
        ax.legend()
        ax.grid(alpha=0.3)
    fig.suptitle("Səfər vaxtının CDF-i — Fixed vs Adaptive", fontsize=13, y=1.02)
    fig.tight_layout()
    fig.savefig(OUT / "18_travel_time_cdf.png", dpi=150, bbox_inches="tight",
                facecolor="white")
    plt.close(fig)
    print("[OK] 18_travel_time_cdf.png")


# ---------- 19. Stop count histogram ----------
def plot_stop_count_hist():
    fig, axes = plt.subplots(1, 2, figsize=(13, 5))
    for ax_i, scn in enumerate(["peak", "stress"]):
        ax = axes[ax_i]
        for mode in MODES:
            d = load(scn, mode)
            stops = [c.get("stop_count", 0) for c in d["completions"]]
            if not stops:
                continue
            bins = range(0, max(stops) + 2)
            ax.hist(stops, bins=bins, alpha=0.55, color=MODE_COLORS[mode],
                    edgecolor="black", label=f"{MODE_LABELS[mode]} (n={len(stops)})")
        ax.set_xlabel("Dayanma sayı")
        ax.set_ylabel("Avtomobil sayı")
        ax.set_title(f"{SCENARIO_LABELS[scn]}")
        ax.legend()
        ax.grid(alpha=0.3)
    fig.suptitle("Avtomobil başına dayanma sayının paylanması", fontsize=13, y=1.02)
    fig.tight_layout()
    fig.savefig(OUT / "19_stop_count_hist.png", dpi=150, bbox_inches="tight",
                facecolor="white")
    plt.close(fig)
    print("[OK] 19_stop_count_hist.png")


# ---------- 20. Phase utilization ----------
def plot_phase_utilization():
    """Show how adaptive controller varies phase durations over time."""
    d = load("peak", "adaptive")
    events = d["phase_events"]
    if not events:
        return
    df = pd.DataFrame(events)
    # Take top 4 intersections with most variance in phase duration
    var_by_node = df.groupby("node")["phase_dur"].var().sort_values(ascending=False)
    top_nodes = var_by_node.head(4).index.tolist()

    fig, axes = plt.subplots(2, 2, figsize=(13, 8), sharex=True)
    axes = axes.flatten()
    for ax, node in zip(axes, top_nodes):
        sub = df[df["node"] == node]
        for phase_idx in sorted(sub["phase_idx"].unique()):
            ph = sub[sub["phase_idx"] == phase_idx]
            ax.plot(ph["t"], ph["phase_dur"], lw=1.5,
                    label=f"Faza {phase_idx}", marker=".", markersize=3)
        ax.set_title(f"Kəsişmə {str(node)[:18]}")
        ax.set_xlabel("Vaxt (s)")
        ax.set_ylabel("Faza müddəti (s)")
        ax.legend(fontsize=8)
        ax.grid(alpha=0.3)
    fig.suptitle("Adaptive rejimdə faza müddətlərinin dinamikası (peak senari)",
                 fontsize=13, y=1.00)
    fig.tight_layout()
    fig.savefig(OUT / "20_phase_utilization.png", dpi=150, bbox_inches="tight",
                facecolor="white")
    plt.close(fig)
    print("[OK] 20_phase_utilization.png")


if __name__ == "__main__":
    plot_speed_timeseries()
    plot_delay_boxplot()
    plot_throughput_bar()
    plot_queue_heatmap()
    plot_travel_time_cdf()
    plot_stop_count_hist()
    plot_phase_utilization()
    print(f"\nSaved to: {OUT}")

"""
DOM structure visualizations for the Baku traffic simulation frontend.
Generates:
  30_dom_update_matrix.png  — heatmap: WS fields × components
  31_component_coupling.png — directed coupling/dependency graph
"""

import os
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import matplotlib.patheffects as pe

OUT = os.path.join(os.path.dirname(__file__), "..", "diagrams")
os.makedirs(OUT, exist_ok=True)

DARK_BG   = "#0f172a"
PANEL_BG  = "#1e293b"
GRID_COL  = "#334155"
TEXT_COL  = "#e2e8f0"
ACCENT    = "#38bdf8"
ACCENT2   = "#818cf8"
GREEN     = "#34d399"
ORANGE    = "#fb923c"
RED_COL   = "#f87171"

plt.rcParams.update({
    "figure.facecolor": DARK_BG,
    "axes.facecolor":   PANEL_BG,
    "axes.edgecolor":   GRID_COL,
    "axes.labelcolor":  TEXT_COL,
    "text.color":       TEXT_COL,
    "xtick.color":      TEXT_COL,
    "ytick.color":      TEXT_COL,
    "font.family":      "DejaVu Sans",
    "font.size":        10,
})

# ─── 30: DOM Update Matrix ────────────────────────────────────────────────────

def plot_dom_update_matrix():
    ws_fields = [
        "vehicles[ ]",
        "traffic_lights[ ]",
        "kpi { }",
        "scenario { }",
        "green_wave { }",
        "edge_congestion[ ]",
        "status / sim_clock\nactive_count / totals",
    ]

    components = [
        "VehicleLayer",
        "TrafficLightLayer",
        "HeatmapLayer",
        "Analytics Tab\n(StatCard · MiniKPI · LOS)",
        "Charts Tab\n(Recharts)",
        "Congestion Tab\n(edge bars)",
        "Control Tab\n(toggles · selectors)",
        "Header",
        "IntersectionCamera3D\n(Three.js)",
    ]

    # rows = ws_fields, cols = components
    matrix = np.array([
        # VL  TLL  HL  AN  CH  CO  CT  HDR  CAM
        [1,   0,   1,  0,  0,  0,  0,  0,   1],   # vehicles
        [0,   1,   0,  0,  0,  0,  0,  0,   1],   # traffic_lights
        [0,   0,   0,  1,  1,  0,  0,  0,   0],   # kpi
        [0,   0,   0,  0,  0,  0,  1,  0,   0],   # scenario
        [0,   0,   0,  0,  0,  0,  1,  0,   0],   # green_wave
        [0,   0,   0,  0,  0,  1,  0,  0,   0],   # edge_congestion
        [0,   0,   0,  0,  0,  0,  0,  1,   0],   # status / sim_clock
    ], dtype=float)

    nrows, ncols = matrix.shape
    fig, ax = plt.subplots(figsize=(14, 6))
    fig.patch.set_facecolor(DARK_BG)
    ax.set_facecolor(PANEL_BG)

    cmap = plt.cm.colors.LinearSegmentedColormap.from_list(
        "dom", [PANEL_BG, ACCENT], N=256
    )

    for r in range(nrows):
        for c in range(ncols):
            val = matrix[r, c]
            color = ACCENT if val else PANEL_BG
            rect = plt.Rectangle([c - 0.45, r - 0.45], 0.9, 0.9,
                                  facecolor=color, edgecolor=GRID_COL, linewidth=0.8)
            ax.add_patch(rect)
            if val:
                ax.text(c, r, "✓", ha="center", va="center",
                        fontsize=14, color=DARK_BG, fontweight="bold")

    ax.set_xlim(-0.5, ncols - 0.5)
    ax.set_ylim(-0.5, nrows - 0.5)
    ax.set_xticks(range(ncols))
    ax.set_xticklabels(components, rotation=35, ha="right", fontsize=8.5)
    ax.set_yticks(range(nrows))
    ax.set_yticklabels(ws_fields, fontsize=9)
    ax.invert_yaxis()

    ax.set_title(
        "DOM Update Matrix — WebSocket Payload Fields × React Components",
        fontsize=13, color=TEXT_COL, pad=16, fontweight="bold"
    )
    ax.set_xlabel("React Component", labelpad=10, color=ACCENT)
    ax.set_ylabel("WebSocket Message Field", labelpad=10, color=ACCENT)

    for spine in ax.spines.values():
        spine.set_edgecolor(GRID_COL)

    patch_active = mpatches.Patch(facecolor=ACCENT, label="Field drives component update")
    patch_none   = mpatches.Patch(facecolor=PANEL_BG, edgecolor=GRID_COL, label="No direct dependency")
    ax.legend(handles=[patch_active, patch_none], loc="upper right",
              framealpha=0.3, labelcolor=TEXT_COL, fontsize=9)

    fig.tight_layout(rect=[0, 0, 1, 0.97])
    path = os.path.join(OUT, "30_dom_update_matrix.png")
    fig.savefig(path, dpi=150, bbox_inches="tight", facecolor=DARK_BG)
    plt.close(fig)
    print(f"  Saved {path}")


# ─── 31: Component Coupling Graph ────────────────────────────────────────────

def plot_component_coupling():
    try:
        import networkx as nx
    except ImportError:
        print("  networkx not found — skipping diagram 31")
        return

    G = nx.DiGraph()

    nodes = {
        "App":                  {"group": "root",    "props": 0},
        "Header":               {"group": "ui",      "props": 5},
        "MapContainer":         {"group": "map",     "props": 2},
        "Sidebar":              {"group": "ui",      "props": 4},
        "VehicleLayer":         {"group": "map",     "props": 2},
        "TrafficLightLayer":    {"group": "map",     "props": 2},
        "HeatmapLayer":         {"group": "map",     "props": 2},
        "StatCard":             {"group": "atom",    "props": 5},
        "MiniKPI":              {"group": "atom",    "props": 4},
        "Recharts":             {"group": "charts",  "props": 6},
        "EdgeList":             {"group": "ui",      "props": 2},
        "ControlPanel":         {"group": "ui",      "props": 5},
        "Modal":                {"group": "overlay", "props": 1},
        "IntersectionCamera3D": {"group": "3d",      "props": 9},
    }

    for n, meta in nodes.items():
        G.add_node(n, **meta)

    edges = [
        # (parent, child, label)
        ("App", "Header",            "sim_clock · status\nwsStatus · counts"),
        ("App", "MapContainer",      "center"),
        ("App", "Sidebar",           "simState · theme\nactiveTab"),
        ("App", "Modal",             "selectedTL"),
        ("MapContainer", "VehicleLayer",      "vehicles[]"),
        ("MapContainer", "TrafficLightLayer", "traffic_lights[]\nonSelect cb"),
        ("MapContainer", "HeatmapLayer",      "vehicles[]\nheatmapOn"),
        ("Sidebar", "StatCard",      "value · label\nicon · colors"),
        ("Sidebar", "MiniKPI",       "label · value\nunit · color"),
        ("Sidebar", "Recharts",      "kpi snapshots\ncomparison"),
        ("Sidebar", "EdgeList",      "edge_congestion[]"),
        ("Sidebar", "ControlPanel",  "scenario · green_wave\nAP callbacks"),
        ("Modal",   "IntersectionCamera3D",
                                     "vehicles · edgeStates\nedgeBearings · mode\nphaseIndex · timeLeft"),
    ]

    for u, v, lbl in edges:
        G.add_edge(u, v, label=lbl)

    group_colors = {
        "root":    "#1e40af",
        "ui":      "#4c1d95",
        "map":     "#065f46",
        "atom":    "#7c2d12",
        "charts":  "#854d0e",
        "overlay": "#831843",
        "3d":      "#7c3aed",
    }

    pos = {
        "App":                  (0.50, 1.00),
        "Header":               (0.05, 0.70),
        "MapContainer":         (0.35, 0.70),
        "Sidebar":              (0.70, 0.70),
        "Modal":                (0.95, 0.70),
        "VehicleLayer":         (0.18, 0.40),
        "TrafficLightLayer":    (0.35, 0.40),
        "HeatmapLayer":         (0.52, 0.40),
        "StatCard":             (0.62, 0.40),
        "MiniKPI":              (0.72, 0.40),
        "Recharts":             (0.82, 0.40),
        "EdgeList":             (0.92, 0.40),
        "ControlPanel":         (1.02, 0.40),
        "IntersectionCamera3D": (0.95, 0.10),
    }

    node_sizes  = [400 + nodes[n]["props"] * 200 for n in G.nodes()]
    node_colors = [group_colors[nodes[n]["group"]] for n in G.nodes()]

    fig, ax = plt.subplots(figsize=(18, 9))
    fig.patch.set_facecolor(DARK_BG)
    ax.set_facecolor(DARK_BG)
    ax.set_xlim(-0.1, 1.15)
    ax.set_ylim(-0.05, 1.10)
    ax.axis("off")

    nx.draw_networkx_nodes(G, pos, ax=ax,
                           node_size=node_sizes,
                           node_color=node_colors,
                           alpha=0.92)

    nx.draw_networkx_labels(G, pos, ax=ax,
                            font_color=TEXT_COL,
                            font_size=7.5,
                            font_weight="bold")

    nx.draw_networkx_edges(G, pos, ax=ax,
                           edge_color=GRID_COL,
                           arrows=True,
                           arrowstyle="-|>",
                           arrowsize=16,
                           connectionstyle="arc3,rad=0.08",
                           min_source_margin=18,
                           min_target_margin=18,
                           width=1.4)

    edge_labels = {(u, v): d["label"] for u, v, d in G.edges(data=True)}
    nx.draw_networkx_edge_labels(G, pos, edge_labels=edge_labels,
                                 ax=ax,
                                 font_color=ACCENT,
                                 font_size=5.5,
                                 bbox=dict(boxstyle="round,pad=0.2",
                                           facecolor=PANEL_BG,
                                           edgecolor="none",
                                           alpha=0.7))

    legend_patches = [
        mpatches.Patch(color=c, label=g.capitalize())
        for g, c in group_colors.items()
    ]
    ax.legend(handles=legend_patches, loc="lower left",
              framealpha=0.3, labelcolor=TEXT_COL, fontsize=8,
              title="Component Group", title_fontsize=9)

    ax.set_title(
        "Component Coupling Graph — Props & Callback Dependencies",
        fontsize=14, color=TEXT_COL, pad=14, fontweight="bold"
    )

    note = "Node size ∝ prop count  ·  Edges = prop-passing / callback relationships  ·  Direction = data flow (parent → child)"
    ax.text(0.5, -0.02, note, transform=ax.transAxes,
            ha="center", va="top", fontsize=7.5, color=GRID_COL)

    path = os.path.join(OUT, "31_component_coupling.png")
    fig.savefig(path, dpi=150, bbox_inches="tight", facecolor=DARK_BG)
    plt.close(fig)
    print(f"  Saved {path}")


if __name__ == "__main__":
    print("Generating DOM structure diagrams...")
    plot_dom_update_matrix()
    plot_component_coupling()
    print("Done.")

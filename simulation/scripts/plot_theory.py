"""
Theoretical plots — no simulation needed.

Generates:
  11_idm_gap_explained.png   — annotated IDM gap diagram
  12_idm_accel_vs_gap.png    — IDM acceleration as function of gap
  13_fundamental_diagram.png — flow-density-speed (Greenshields)
"""

import math
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "diagrams"
OUT.mkdir(exist_ok=True)

plt.rcParams.update({
    "font.family": "DejaVu Sans",
    "font.size": 11,
    "axes.titlesize": 13,
    "axes.labelsize": 11,
})


def plot_idm_gap_explained():
    """Annotated diagram showing IDM variables s, s*, s0, v, leader."""
    fig, ax = plt.subplots(figsize=(12, 4.5))
    ax.set_xlim(0, 14)
    ax.set_ylim(-1.5, 2.5)
    ax.set_aspect("equal")
    ax.axis("off")

    # Road
    ax.axhline(0, color="#888", lw=1, ls=":")
    ax.axhline(-0.8, color="#444", lw=2)
    ax.axhline(0.8, color="#444", lw=2)

    # Following vehicle (ego)
    ax.add_patch(mpatches.FancyBboxPatch(
        (1.5, -0.4), 1.6, 0.8, boxstyle="round,pad=0.02",
        facecolor="#1976d2", edgecolor="black"))
    ax.text(2.3, 0, "EGO\nv", color="white", ha="center", va="center", fontsize=10, fontweight="bold")

    # Leading vehicle
    ax.add_patch(mpatches.FancyBboxPatch(
        (9.0, -0.4), 1.6, 0.8, boxstyle="round,pad=0.02",
        facecolor="#c62828", edgecolor="black"))
    ax.text(9.8, 0, "LİDER\nv_L", color="white", ha="center", va="center", fontsize=10, fontweight="bold")

    # Gap line
    ax.annotate("", xy=(9.0, 1.4), xytext=(3.1, 1.4),
                arrowprops=dict(arrowstyle="<->", color="#388e3c", lw=2))
    ax.text(6.05, 1.7, r"$s$  (faktiki məsafə)", color="#1b5e20", ha="center", fontsize=12, fontweight="bold")

    # Desired gap s*
    ax.annotate("", xy=(7.5, -1.2), xytext=(3.1, -1.2),
                arrowprops=dict(arrowstyle="<->", color="#f57c00", lw=2))
    ax.text(5.3, -1.45, r"$s^* = s_0 + \max(0,\, vT + \frac{v\Delta v}{2\sqrt{ab}})$",
            color="#e65100", ha="center", fontsize=11)

    # Speed arrows
    ax.annotate("", xy=(4.5, 0.6), xytext=(3.5, 0.6),
                arrowprops=dict(arrowstyle="->", color="#1976d2"))
    ax.text(4.0, 0.85, "v", color="#1976d2", ha="center")

    ax.annotate("", xy=(11.0, 0.6), xytext=(10.5, 0.6),
                arrowprops=dict(arrowstyle="->", color="#c62828"))
    ax.text(10.75, 0.85, r"$v_L$", color="#c62828", ha="center")

    # Formula box
    formula = (
        r"$a = a_{max}\left[1 - \left(\frac{v}{v_0}\right)^4 - \left(\frac{s^*}{s}\right)^2\right]$"
        "\n\n"
        r"$s_0$: minimum gap (dayanmış halda)" "\n"
        r"$T$: təhlükəsiz vaxt headway-i" "\n"
        r"$\Delta v = v - v_L$: sürət fərqi" "\n"
        r"$a$: max sürətlənmə,  $b$: rahat tormoz"
    )
    ax.text(0.2, -1.95, formula, fontsize=9, va="top",
            bbox=dict(boxstyle="round", facecolor="#fff9c4", edgecolor="#f9a825"))

    ax.set_title("Intelligent Driver Model (IDM) — Dəyişənlərin İzahı", pad=10)
    fig.tight_layout()
    fig.savefig(OUT / "11_idm_gap_explained.png", dpi=150, bbox_inches="tight",
                facecolor="white")
    plt.close(fig)
    print("[OK] 11_idm_gap_explained.png")


def idm_accel(v, s, v_lead, v0=15.0, T=1.5, s0=2.0, a=1.8, b=2.0):
    delta_v = v - v_lead
    s_star = s0 + max(0.0, v * T + (v * delta_v) / (2 * math.sqrt(a * b)))
    return a * (1 - (v / max(v0, 0.01))**4 - (s_star / max(s, 0.01))**2)


def plot_idm_accel_vs_gap():
    """IDM acceleration as function of gap for several scenarios."""
    fig, axes = plt.subplots(1, 2, figsize=(13, 5))

    gaps = np.linspace(2, 60, 200)

    # Left: at different ego speeds, leader stationary
    ax = axes[0]
    for v in [5, 10, 13.9, 20]:
        accs = [idm_accel(v, s, v_lead=0) for s in gaps]
        ax.plot(gaps, accs, lw=2, label=f"v = {v} m/s ({v*3.6:.0f} km/h)")
    ax.axhline(0, color="#444", lw=0.8, ls="--")
    ax.set_xlabel("Gap məsafəsi s (m)")
    ax.set_ylabel(r"Sürətlənmə $a$ (m/s²)")
    ax.set_title("Lider dayanmış (v_L = 0) — sürətə görə")
    ax.legend(loc="lower right")
    ax.grid(alpha=0.3)

    # Right: ego v=13.9, varying leader speed
    ax = axes[1]
    for v_lead in [0, 5, 10, 13.9]:
        accs = [idm_accel(13.9, s, v_lead=v_lead) for s in gaps]
        ax.plot(gaps, accs, lw=2, label=f"v_L = {v_lead} m/s")
    ax.axhline(0, color="#444", lw=0.8, ls="--")
    ax.set_xlabel("Gap məsafəsi s (m)")
    ax.set_ylabel(r"Sürətlənmə $a$ (m/s²)")
    ax.set_title("Ego v = 13.9 m/s — liderin sürətinə görə")
    ax.legend(loc="lower right")
    ax.grid(alpha=0.3)

    fig.suptitle("IDM Sürətlənmə Funksiyası — Parametrlər: a=1.8, b=2.0, T=1.5, s₀=2.0, v₀=15",
                 fontsize=12, y=1.02)
    fig.tight_layout()
    fig.savefig(OUT / "12_idm_accel_vs_gap.png", dpi=150, bbox_inches="tight",
                facecolor="white")
    plt.close(fig)
    print("[OK] 12_idm_accel_vs_gap.png")


def plot_fundamental_diagram():
    """Greenshields linear model: flow-density-speed fundamental diagram."""
    v_free = 50.0          # km/h
    k_jam = 150.0          # vehicles/km

    k = np.linspace(0, k_jam, 200)
    v = v_free * (1 - k / k_jam)
    q = k * v              # flow

    k_opt = k_jam / 2
    q_max = v_free * k_jam / 4

    fig, axes = plt.subplots(1, 3, figsize=(15, 4.5))

    # Speed vs Density
    ax = axes[0]
    ax.plot(k, v, color="#1976d2", lw=2.5)
    ax.fill_between(k, 0, v, alpha=0.1, color="#1976d2")
    ax.set_xlabel("Sıxlıq k (avt/km)")
    ax.set_ylabel("Sürət v (km/saat)")
    ax.set_title("Sürət–Sıxlıq")
    ax.grid(alpha=0.3)
    ax.set_xlim(0, k_jam)
    ax.set_ylim(0, v_free * 1.05)

    # Flow vs Density
    ax = axes[1]
    ax.plot(k, q, color="#388e3c", lw=2.5)
    ax.fill_between(k, 0, q, alpha=0.1, color="#388e3c")
    ax.scatter([k_opt], [q_max], color="red", s=80, zorder=5)
    ax.annotate(f"q_max = {q_max:.0f}\nk_opt = {k_opt:.0f}",
                xy=(k_opt, q_max), xytext=(k_opt + 20, q_max - 200),
                fontsize=10,
                arrowprops=dict(arrowstyle="->", color="red"))
    ax.set_xlabel("Sıxlıq k (avt/km)")
    ax.set_ylabel("Axın q (avt/saat)")
    ax.set_title("Axın–Sıxlıq")
    ax.grid(alpha=0.3)
    ax.axvline(k_opt, color="red", lw=0.8, ls="--", alpha=0.5)

    # Flow vs Speed
    ax = axes[2]
    ax.plot(v, q, color="#7b1fa2", lw=2.5)
    ax.fill_between(v, 0, q, alpha=0.1, color="#7b1fa2")
    ax.set_xlabel("Sürət v (km/saat)")
    ax.set_ylabel("Axın q (avt/saat)")
    ax.set_title("Axın–Sürət")
    ax.grid(alpha=0.3)

    fig.suptitle("Trafik Axınının Fundamental Diaqramı (Greenshields Modeli)",
                 fontsize=13, y=1.02)
    fig.tight_layout()
    fig.savefig(OUT / "13_fundamental_diagram.png", dpi=150, bbox_inches="tight",
                facecolor="white")
    plt.close(fig)
    print("[OK] 13_fundamental_diagram.png")


if __name__ == "__main__":
    plot_idm_gap_explained()
    plot_idm_accel_vs_gap()
    plot_fundamental_diagram()
    print(f"\nSaved to: {OUT}")

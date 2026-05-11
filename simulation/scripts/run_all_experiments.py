"""
Runs all experiments needed for dissertation plots:
- 4 scenarios × 2 modes = 8 runs
- Plus green-wave on/off comparison

Writes JSON to simulation/data/.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from headless_runner import run

DATA = Path(__file__).resolve().parent.parent / "data"
DATA.mkdir(exist_ok=True)

SCENARIOS = ["normal", "peak", "night", "stress"]
MODES = ["fixed", "adaptive"]
DURATION = 600.0   # 10 minutes simulated

def main():
    # Cross-product
    for scn in SCENARIOS:
        for mode in MODES:
            out = DATA / f"{scn}_{mode}.json"
            print(f"\n=== {scn} / {mode} → {out.name}")
            run(mode=mode, scenario=scn, duration=DURATION, out_path=out)

    # Green wave: normal scenario, adaptive mode, with and without GW
    print("\n=== Green Wave: normal adaptive WITH green wave")
    run(mode="adaptive", scenario="normal", duration=DURATION,
        out_path=DATA / "normal_adaptive_gw.json", green_wave=True)

    print("\nAll runs complete.")

if __name__ == "__main__":
    main()

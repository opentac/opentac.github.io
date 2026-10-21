---
description: Configure adaptive taxel selection, compare fixed and grow modes, and interpret their sampling budgets and measured rates.
---

# Adaptive acquisition with OpenTac-Xampling { #xampling }

OpenTac-Xampling reduces the number of taxel reads required per frame by concentrating measurements around contact. A coarse-to-fine search identifies taxels above a threshold, then expands into their neighbours. This trades complete spatial sampling in each frame for a higher update rate when contact occupies only part of the sensor.

<figure class="ot-clip" style="max-width: 34rem; margin: 1.2em auto 1.6em">
<div class="ot-media">
  <video data-loop muted loop playsinline preload="none" poster="../../assets/loops/xampling.jpg"
         aria-label="Two tennis-ball drops at 128 times slow motion: raster scanning misses the impact, Xampling at 32 taxels per frame captures it">
    <source src="../../assets/loops/xampling.mp4" type="video/mp4">
  </video>
</div>
<figcaption>Two 30&nbsp;cm tennis-ball drops at 128&times; slow motion: raster scanning misses the impact; Xampling at <code>XAMP_M</code>&nbsp;=&nbsp;32 captures it in this example. The displayed 996 updates/s is the measured rate of that recording.</figcaption>
</figure>

## Enable adaptive acquisition { #use-it }

Measure the unloaded baseline before enabling Xampling. The following commands select either a search budget with contact expansion or a fixed total sampling budget:

```sh
uv run opentac view --xampling 64             # 64 search reads, then grow around every contact
uv run opentac view --xampling 128 --fixed    # exactly 128 reads per frame, for a steady frame rate
```

```python
from opentac.device import Sensor

s = Sensor()
s.zero()                       # nothing touching: measures each taxel's zero and noise
s.xampling(budget=128)         # XAMP_M = 128, TAC_MODE = xamp_grow (grow=False for xamp_fixed)
frame = s.read()
frame.mask                     # True for the taxels read this frame
frame.taxels                   # counts above the zero; NaN where not read
s.raster()                     # back to reading every taxel
```

In the viewer, taxels not read this frame are drawn blue, and `b` zeroes the
board again.

## Search budget versus total budget { #the-two-modes }

| Mode | `TAC_MODE` | Reads per frame |
|---|---|---|
| grow (default) | `xamp_grow` (2) | `XAMP_M` search reads, plus every taxel growth reaches: expansion continues over the detected contact beyond the search budget |
| fixed | `xamp_fixed` (1) | exactly `XAMP_M`, growth included: a steady frame rate, but contact coverage is incomplete if it requires more reads than the budget |

Both modes reserve at least `XAMP_SEARCH_MIN` reads for searching before expanding detected contacts. This prevents previously detected contact from consuming the entire frame budget. Contact taxels found in one frame are prioritised in the next.

## Settings

| Parameter | Default | Meaning |
|---|---|---|
| `XAMP_M` | 128 | the budget: reads per frame (fixed) or search reads (grow) |
| `XAMP_THRESH` | 30 | counts above a taxel's own noise that count as contact |
| `XAMP_SEARCH_MIN` | 30 | search reads before any growth |
| `XAMP_ZERO_FRAMES` | 64 | raster frames the zero measures noise over |
| `XAMP_BUMP_FILL` | 0 | 1: growth reads each contact taxel's whole shear bump |
| `XAMP_CONFIRM_US` | 50 | a reading that would trigger is read again after this extra settle |

A taxel triggers when its baseline-subtracted reading exceeds its measured noise plus `XAMP_THRESH`. Restarting the board, changing the sensor, or changing `ROW_SETTLE_US`, `MUX_SETTLE_US` or gain invalidates this baseline. Xampling pauses until the baseline is measured again.

## Measured frame rates

Fixed-mode measurements on a 32 × 32 sensor (1024 taxels), `MUX_SETTLE_US` 8, IMU off,
including USB transfer. Two rounds each, averaged (2026-09-14).

| `XAMP_M` | 16 | 32 | 64 | 128 | 256 | 512 | 1024 | raster |
|---|---|---|---|---|---|---|---|---|
| frames/s | 1286 | 954 | 627 | 376 | 209 | 113 | 58 | 67 |
| Relative to raster | 19x | 14x | 9.3x | 5.6x | 3.1x | 1.7x | 0.9x | 1x |

Grow mode has no single frame rate: with nothing touching it reads `XAMP_M`
taxels like fixed mode, and each taxel that growth reads adds roughly 13 to 16 µs.
With the IMU on, its reads take about 40% of the frame time.

In grow mode at `XAMP_M` 128, a new 2 × 2 press was reached by the search after
1.1 frames on average and 7 frames at worst (32 × 32 sensor, hands-off
measurement of the search pattern).

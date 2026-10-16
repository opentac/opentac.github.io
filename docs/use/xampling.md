# Xampling

Xampling (OpenTac-Xampling) is OpenTac's compressive (sub-sampled) acquisition. Each frame the
board reads a chosen subset of the taxels instead of all of them: it searches
the sensor coarse-to-fine, and wherever a reading crosses its threshold it
reads the neighbours, growing around the contact. Fewer reads per frame means
more frames per second.

## Use it

Zero first, with nothing touching the sensor, then switch:

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

## The two modes

| Mode | `TAC_MODE` | Reads per frame |
|---|---|---|
| grow (default) | `xamp_grow` (2) | `XAMP_M` search reads, plus every taxel growth reaches: a large contact is read whole, never cut off |
| fixed | `xamp_fixed` (1) | exactly `XAMP_M`, growth included: a steady frame rate, but a contact larger than the budget is read in part |

In both, growth starts only after `XAMP_SEARCH_MIN` search reads, so last
frame's contact cannot use up a whole frame. Contacts found in one frame are
read first in the next.

## Settings

| Parameter | Default | Meaning |
|---|---|---|
| `XAMP_M` | 128 | the budget: reads per frame (fixed) or search reads (grow) |
| `XAMP_THRESH` | 30 | counts above a taxel's own noise that count as contact |
| `XAMP_SEARCH_MIN` | 30 | search reads before any growth |
| `XAMP_ZERO_FRAMES` | 64 | raster frames the zero measures noise over |
| `XAMP_BUMP_FILL` | 0 | 1: growth reads each contact taxel's whole shear bump |
| `XAMP_CONFIRM_US` | 50 | a reading that would trigger is read again after this extra settle |

A taxel triggers at its own noise plus `XAMP_THRESH`. The zero is lost when
the board restarts, and when the sensor, `ROW_SETTLE_US`, `MUX_SETTLE_US` or
the gain changes; the board then pauses xampling until the next zero.

## Measured frame rates

Fixed mode on a 32 x 32 sensor (1024 taxels), `MUX_SETTLE_US` 8, IMU off,
including USB transfer. Two rounds each, averaged (2026-09-14, on a 70-pin
readout board).

| `XAMP_M` | 16 | 32 | 64 | 128 | 256 | 512 | 1024 | raster |
|---|---|---|---|---|---|---|---|---|
| frames/s | 1286 | 954 | 627 | 376 | 209 | 113 | 58 | 67 |
| vs raster | 19x | 14x | 9.3x | 5.6x | 3.1x | 1.7x | 0.9x | 1x |

Grow mode has no single frame rate: with nothing touching it reads `XAMP_M`
taxels like fixed mode, and each taxel that growth reads adds roughly 13 to 16 µs.
With the IMU on, its reads take about 40% of the frame time.

In grow mode at `XAMP_M` 128, a new 2x2 press was reached by the search after
1.1 frames on average and 7 frames at worst (32 x 32 sensor, hands-off
measurement of the search pattern).

# Transfer

OpenTac-Transfer, the `opentac.transfer` module, takes a frame from skin A and gives the frame skin B would
have read for the same contact. A and B can have different taxel sizes,
outlines and taxel counts. Use it to reuse recorded or simulated data on a new
sensor design.

```python
from opentac import manifest
from opentac.transfer import transfer

a = manifest.load("skin_a.json")
b = manifest.load("skin_b.json")
frame_b = transfer(frame_a, a, b)      # frame_a in newtons per taxel
```

`examples/transfer.py` simulates a press on a 4 mm skin, transfers it to a
2.5 mm skin, and compares it with the same press simulated on that skin.

## Inputs

- `frame`: a `Frame` from skin A in **newtons** per taxel (`units == "N"`).
  Frames in counts are refused: transfer adds forces, which is only right for
  forces. Convert counts with the skin's calibration first. Unread taxels (NaN)
  count as zero.
- `a`, `b`: the two skins' manifests (a `Manifest`, a manifest.json path, a
  design .zip, or a dict). Each skin's taxels must sit on one square grid; the
  two grids can have different pitches.
- `center=True` (default): the contact's centre of pressure goes to the
  centroid of B's taxels, or to `target=(x, y)` in B's millimetres. The centre
  uses only taxels above 10 % of the frame's peak, so noise does not pull it.
- `center=False`: A's millimetres are used as B's, moved by `shift_mm`.
- `angle_deg`: turn the contact by this angle.
- `kernel`: `"box"` (default) or `"tent"` (smoother when B is finer than A).

## Output

A `Frame` on B: newtons per taxel in B's `pixels` order, `units == "N"`, the
input's `t`. `imu` is left empty, because it described A's board.

Force is conserved: what B reads plus what fell outside B's taxels equals what
A read. To see the lost part, or to apply one placement to many frames, use
`Transfer` directly:

```python
from opentac.transfer import Transfer

tr = Transfer.centered(a, b, frame_a.taxels)   # or Transfer(a, b, angle_deg=..., shift_mm=...)
fb = tr.force(frames_a)                        # (n_frames, n_A) -> (n_frames, n_B), N
tr.lost(frame_a.taxels)                        # N that landed outside B's taxels
```

## How it works

A taxel reads the force on its cell: a square one pitch wide around its
centre. So a frame in newtons is a pressure that is constant over each cell.

1. **Place A on B.** Rotate A's taxel positions by `angle_deg`, then shift
   them, so the contact sits where you want it on B.
2. **Resample by area.** Cut each A cell into small sub-cells, each carrying an
   equal share of that taxel's force. Each share goes to the B cell it lands
   in. This is one fixed matrix per placement: `F_B = M @ F_A`.
3. **Drop what B cannot see.** Shares that land outside B's taxels (past the
   outline, or in a gap) are dropped and counted in `lost()`.

## What transfers and what does not

The paper scored transfer on hand presses: four skins (409, 502, 96 and 174
taxels; 2.0 and 4.0 mm pitch), five objects, 1 to 8 N. Every method was given
the pose of the press it predicted. "Shape F1" is the overlap between the
taxels each frame reads above about a quarter of its own peak, so it compares
where the contact is and its shape, not how bright it is.

| predicting skin B's frame from | median shape F1 | frames |
|---|---|---|
| another press on skin B itself (repeatability limit) | 0.80 | 1857 |
| skin A, with `opentac.transfer` | 0.75 | 5290 |
| the same, scored only where A covers B | 0.79 | 5286 |
| skin A's counts, area-averaged onto B (no calibration) | 0.71 | 5291 |
| skin A's counts, stretched by row and column (no manifest) | 0.63 | 5077 |

`tests/sim/test_paper_numbers.py` recomputes these from the stored result rows
(`results_pose.json`, not in this repository; the test is skipped without it,
see [Simulation](sim.md#how-well-it-matches-real-presses)).

**Carries over: contact shape and size.** In a separate demo, three objects
were pressed freehand on skins of 4.2, 3.1 and 2.0 mm pitch. An allen key read
10.3, 9.7 and 9.5 mm wide on the three.

**Does not carry over:**

- **Detail finer than A's taxels.** Going from 4 mm to 2 mm taxels invents
  nothing. `"tent"` only smooths it.
- **Contact area as a coarse skin measures it.** A partly covered taxel
  reports its whole area. In the demo, the 4.2 mm skin read 28–54 % more
  contact area than the 2.0 mm skin for the same object (tape roll: 1504
  against 976 mm²). Transfer cannot undo what A's coarse taxels already
  blurred.
- **Counts.** The same objects peaked at about 200 counts per mm² on the 4.2 mm
  skin and 620–780 on the 2.0 mm skin. Counts depend on the design and the
  velostat, which is why transfer works in newtons.
- **Saturation.** A taxel that hit the ADC maximum on A is a lower bound, and
  stays one on B.
- **Placement.** Transfer does not know where the object sat on B. It centres
  the contact unless you give a target, shift or angle.

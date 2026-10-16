# Simulation

OpenTac-Sim, the `opentac.sim` module, presses an object into a flat OpenTac
sensor and returns a `Frame`: the same type a real board returns. Code written against frames runs
on simulated and real data alike.

```python
from opentac import manifest
from opentac.sim import Sensor

m = manifest.load("manifest.json")      # or the design .zip from OpenTac-CAD
s = Sensor(m)                           # foam model
frame = s.press("sphere", center_mm=(10, 12), force_n=5.0, radius_mm=5.0)

frame.taxels        # newtons per taxel, in manifest `pixels` order
frame.image(m)      # the same values as a 2-D array laid out like the sensor
```

`examples/sim_press.py` presses a 10 mm ball at 5 N and shows the image.

## Two models

| | `"foam"` | `"mujoco"` |
|---|---|---|
| Sensor | velostat under foam, **no bump sheet** | with the printed **TPU bump sheet** |
| Physics | rigid indenter into a foam layer | rigid bumps on springy joints (press, shear, tip) |
| Output | normal force per taxel | normal force per taxel, plus shear per bump |
| Needs | numpy | numpy; the full solver also needs `mujoco` (`uv sync --extra sim`) |

**The default is always `"foam"`.** Pass `model="mujoco"` if you print the
bump sheet. The manifest cannot decide this for you: OpenTac-CAD writes a
`shear` block (where bumps *would* go) into every manifest, whether or not a
sheet is printed. The skins in the paper had `shear` blocks and no bump sheet.

The `"mujoco"` model needs the `shear` block and refuses a manifest without
one.

## Foam model

The skin is velostat under a foam layer. Pressure follows a Winkler
foundation:

    p(x, y) = k · max(δ − z(x, y), 0)

`z` is the height of the indenter's surface above the skin and `δ` the
indentation depth. The pressure field is blurred by a Gaussian of width σ (the
foam spreads load sideways) and summed over each taxel. `δ` is solved so the
pressure adds up to the force you ask for, so the contact grows with load.

Two parameters, fitted once in the paper on one skin (robotiq_long: 96 taxels,
4 mm pitch) and used unchanged on every other skin:

- σ = 3.00 mm (`sigma_mm`)
- k = 0.00866 N/mm³ (`k_n_per_mm3`)

Indenters for `press(shape, ...)`:

| `shape` | size arguments | notes |
|---|---|---|
| `"sphere"` | `radius_mm` | |
| `"disc"` | `radius_mm` | a flat round punch |
| `"bar"` | `radius_mm`, `length_mm` | a cylinder lying on the skin; `angle_deg` turns it from +x |
| `"sphere_R10"`, `"sphere_R25"`, `"punch_D10"`, `"edge_R5_L40"`, `"alignment_tip_R3"` | none | the paper's indenters |

`center_mm` defaults to the centroid of the taxels. `force_n` is the load on
the skin. Load that falls outside the taxels (an indenter over the edge, foam
spreading past the outline) is not read, so a frame can sum to less than
`force_n`.

**Known quirk.** Each taxel sums the pressure over a square of
`(2·round(pitch) + 1) × 0.5` mm, not exactly one pitch. Where that is wider
than the pitch, neighbouring taxels overlap and a frame sums to more than the
force pressed. The port keeps this because the paper's numbers were made with
it. `tests/sim/test_foam.py` checks the formula.

| pitch (mm) | window (mm) | under uniform pressure, a taxel reads |
|---|---|---|
| 2.0 | 2.5 | 1.56 × the force on its own cell |
| 2.5 | 2.5 | 1.00 × |
| 3.1 | 3.5 | 1.27 × |
| 4.0 | 4.5 | 1.27 × |
| 4.2 | 4.5 | 1.15 × |

### How well it matches real presses

From the paper's hand-press experiment (`results_pose.json`): four skins
(409, 502, 96 and 174 taxels; 2.0 and 4.0 mm pitch), five objects, pressed by
hand and scored at 1, 2, 4, 6 and 8 N by each skin's own force calibration.
The model never saw the three skins it was scored on. The pose of each press
was given to the model. "Shape F1" is the overlap between the taxels each
frame reads above about a quarter of its own peak, after smoothing over one
taxel, so it compares contact shape, not intensity.

| | median shape F1 | frames scored |
|---|---|---|
| foam model | 0.73 | 954 |
| another press on the same skin (repeatability limit) | 0.80 | 1857 |

The model put the contact centre closer than a repeat press did (median
1.56 mm against 2.29 mm), but predicted a contact area 1.44 times too large.
`tests/sim/test_paper_numbers.py` recomputes these numbers from the stored
result rows, `results_pose.json` (29 MB). That file is not in this repository,
so the test is skipped unless `OPENTAC_PAPER_RESULTS` points at a copy.

## Bump model (`"mujoco"`)

Ported from TactileSim as `opentac.sim.mujoco`. Each bump of the bump sheet is
a rigid body on a joint with five springs: press, shear in x and y, and tip
about x and y. Shear is not measured directly. A bump pushed sideways tips and
loads the 2×2 taxels under it unevenly; `decode_shear` reads that difference
back as a force per bump.

```python
s = Sensor(m, model="mujoco")                      # BumpParams fields as keywords, e.g. e_eff_mpa=3.5
frame = s.press("sphere", force_n=5.0, radius_mm=10.0)
angles = [0, 0.25, 0.5, 1, 2]                      # degrees
frames = s.twist(angles, force_n=8.0, radius_mm=250.0)  # press, then turn the object
shear = s.decode_shear(frames[-1])                 # (n_bumps, 2) N
s.degenerate_axes()                                # True where a cut-short bump cannot read shear
s.bump_xy_mm                                       # bump centres, same order

before = s.decode_shear(frames[0])
for a, f in zip(angles, frames):                   # the largest shear the turn added to a bump, N
    print(a, abs(s.decode_shear(f) - before).max().round(2))
```

With `m` loaded from `tests/sim/fixtures/flat_square.json` (48 taxels at
2.5 mm pitch, 12 bumps 5 mm apart) the loop prints:

    0 0.0
    0.25 0.28
    0.5 0.53
    1 0.69
    2 0.69

The shear grows while the bumps stick and levels off once they slip, here from
1°. Compare with the frame before the turn: a curved object loads each bump
unevenly, and `decode_shear` reads that as shear too.

**Use an object that touches several bumps.** The object turns about
`center_mm`, by default the centre of one bump. That bump only turns in place
and reads no shear, so the turn shows up on the bumps around it. On this board
a 40 mm ball at 8 N touches only the centre bump and decodes 0.0 N at every
angle; the 250 mm ball above, close to flat, also loads its four neighbours.

Shapes: `"sphere"`, `"cylinder"` (axis along y) and `"plane"` (`tilt_deg`).
`center_mm` defaults to a bump near the middle of the board: between bumps a
small ball can touch nothing.

Two solvers:

- `solver="surrogate"` (default): each bump's force is its stiffness times how
  far the object pushes into it. No MuJoCo. 0.3–0.4 ms per press on boards of
  12–135 bumps.
- `solver="mujoco"`: the full MuJoCo scene, a ball on position servos pressed
  into real frustum-shaped bumps. Sphere only. 0.02–0.08 s per press on the
  same boards. The ball stops at the first step past the target force, so the
  total can overshoot: by 2–26 % over 12 test presses on the two test boards.
  In those presses the two solvers differed by 0.4–9.2 % of the peak bump
  force (RMS over bumps).

During `twist`, the surrogate holds the normal force constant; the full solver
holds the ball's height, so the force can drift.

The material values are estimates, not measurements.
`opentac.sim.mujoco.ESTIMATE_RANGES` gives the plausible spans: effective
modulus 3–44 MPa (default 15), friction 0.7–1.2, Poisson's ratio 0.40–0.49.
Results move most with the modulus.

## Counts instead of newtons

Give a `readout` and frames come back in ADC counts above baseline
(`frame.units == "counts"`):

```python
s = Sensor(m, readout="v3")
```

| profile | velostat | fitted on |
|---|---|---|
| `"v2"` | LINQSTAT | flat presses through foam, no bump sheet; 1.5, 2.0 and 4.0 mm pitch; up to 109 kPa |
| `"v3"` | Yunjia Textiles | the same; up to 215 kPa |

Each profile is a power law in taxel pressure, clipped at the ADC maximum.
`Readout.extrapolating(forces, pitch)` flags taxels pressed harder than the
calibration went. `readout` also takes a profile JSON path, or any object with
a `counts(newtons)` method, such as a calibration fitted for your own skin.
Frames are noise-free; `Readout.counts(..., rng=...)` adds read noise.

## Using frames in your own code

A simulated `Frame` has the same fields as one from a board:

- `taxels`: one value per taxel, in manifest `pixels` order.
- `units`: `"N"`, or `"counts"` with a readout.
- `mask`: all `True` (every taxel is simulated).
- `t`: `0.0`. `imu`: empty.

**Learning.** Loop over random centres, forces and shapes and stack
`frame.taxels` into an array; that is the same vector a real board streams.
For an image model use `np.nan_to_num(frame.image(m))`: rows and columns
follow the taxels' positions, not the scan order. Compare like with like:
either give the simulator the readout that matches your velostat, or convert
the board's counts to newtons.

**Your own physics simulator.** Neither model moves the object; both answer
"what does the sensor read with the object here". Each step, take the contact
point (in the manifest's millimetres) and the normal force from your
simulator and call `press`. For the bump model, `s.tactile.taxel_forces(surface)`
accepts any function `surface(x, y) -> z` giving the object's underside in
metres, in the sensor's frame, with z = 0 on the sheet the bumps stand on (bump
tips at `s.tactile.p.height`); for example from ray casts into your scene.

**Randomise what is uncertain**: `sigma_mm` and `k_n_per_mm3` (foam);
`e_eff_mpa`, `mu` (bumps); the readout gain (`Readout.gain_range`) and noise.

## Limits

- **Flat sensors only.** A manifest with a `sim3d` block (a sensor wrapped on a
  curved part) is refused by both models.
- **Foam: no shear, no dynamics.** The indenter is rigid and the press is
  static. Hysteresis and the speckle of real velostat are not modelled.
- **Readout profiles** were fitted without a bump sheet. Under a bump the
  pressure across a taxel is uneven, which a profile does not capture; for v3
  (pressure exponent 0.55) it then over-predicts counts.

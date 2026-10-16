# Read a sensor

You need a readout board with the OpenTac firmware ([flash it](flash.md)), a
sensor plugged into it, and that sensor's manifest: the `manifest.json` in the
design `.zip` from OpenTac-CAD.

On Linux, your user must be in the `dialout` group to open the board's port
(`sudo usermod -aG dialout $USER`, then log out and back in; see
[On Linux](flash.md#on-linux)).

## Which board

OpenTac-CAD's *readout board* setting picks the board a sensor is made for. A
sensor for the 30-pin board ends in a 30-position connector (up to 15 rows and
15 columns); a sensor for the 60-pin board ends in a 60-position one (up to 30
by 30). To check a design:

```sh
uv run opentac manifest check my_design.zip
```

## Set up once per sensor

```sh
uv run opentac setup my_design.zip
```

This sends the board what it needs to scan the sensor (a few hundred bytes; it is
stored in the board's flash and checked by CRC) and keeps a copy of the
manifest on this computer, in `~/.opentac/manifests/`. The board keeps the
sensor across power cycles and reflashing. After that, no command needs the
manifest again.

The board cannot tell which sensor is plugged in. After you swap sensors, run
`opentac setup` with the new one. With the wrong manifest the readings still
look plausible but land on the wrong taxels.

See what is attached:

```sh
uv run opentac info
```

## Live view

```sh
uv run opentac view
uv run opentac view --shear      # shear arrows, for a sensor with a bump sheet
```

Each taxel is drawn where it sits on the sensor. Click the window, then:

| Key | Does |
|---|---|
| `b` | zero: subtract the current reading. Press it with nothing touching. |
| `c` | clear the zero |
| `a` | autoscale on/off |
| `s` | shear arrows on/off |
| `Enter` | start/stop a take (with `--save DIR`) |
| `q` | quit |

Only one program can use the board's port at a time. Close the viewer before
running another `opentac` command.

## In Python

```python
from opentac.device import Sensor

with Sensor() as s:              # finds the board on USB
    frame = s.read()             # the next frame
    print(frame.taxels)          # one value per taxel, in manifest `pixels` order
    print(s.manifest.xy)         # where each taxel is, in mm
    for frame in s.frames(limit=100):   # every frame, as fast as the board sends
        ...
```

`frame.taxels` are 12-bit ADC counts (0 to 4095); more pressure, more counts.
`frame.t` is the computer's clock in seconds, `frame.imu` holds the IMU
readings when the IMU is on, and `frame.image(s.manifest)` lays the values out
as a 2-D array. `s.setup("my_design.zip")` does what `opentac setup` does.
`examples/read_sensor.py` is a complete script.

`Sensor()` starts every session the same way: full raster scan,
`MUX_SETTLE_US` 8, IMU off. Turn the IMU on with `Sensor(imu=True)` (or
`--imu`). On one board the IMU's reads disturbed the taxel reads just after
them.

## Board settings

Settings last until the board restarts. List them with `opentac info`; change
them per session:

```sh
uv run opentac view --set MUX_SETTLE_US=10
```

```python
s["MUX_SETTLE_US"] = 10
```

## Gain (60-pin board)

The 60-pin board has a gain switch. Four switches each put a resistor across
the amplifier's 10 kΩ feedback resistor. The board starts with all switches
open: 10 kΩ, the highest gain. If a firm press saturates (taxels stuck near
4095), lower the gain:

| `GAIN_SW` | Feedback |
|---|---|
| 0 | 10 kΩ (default) |
| 1 | 3.2 kΩ |
| 2 | 990 Ω |
| 4 | 263 Ω |
| 8 | 68 Ω |

Values add: 3 closes switches 1 and 2. In Python, `s.set_feedback(1000)` picks
the nearest setting and returns the feedback in ohms.

```sh
uv run opentac view --set GAIN_SW=2
```

## Record

```sh
uv run opentac record takes/ --seconds 10 --description "tape roll, edge-on"
uv run opentac view --save takes/           # Enter starts and stops a take
```

Each take is a folder holding `tactile.npz` (the counts, timestamps, IMU and
taxel positions), `manifest.json` and `take.json` (settings and notes).
`examples/record_take.py` records and reads one back:

```python
from opentac.record import load_take
take = load_take("takes/20261015_120000_tape_roll_edge_on")
take["raw"]          # frames x taxels, int16; -1 where a taxel was not read
take["t_host"]       # seconds
```

## Newtons

`opentac.calibrate` turns counts into newtons with a calibration file you
pass in. A calibration holds for one taxel design, one velostat, and the
stack and readout settings it was measured with.

```python
from opentac.calibrate import Calibration

force = Calibration("force_calibration.json").skin(s.manifest, velostat="v2")
newtons = force.taxels(frame, zero)     # N per taxel; zero = counts with nothing touching
total = force.total(frame, zero)
```

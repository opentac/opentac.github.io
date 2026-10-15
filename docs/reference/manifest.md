# Manifest

`manifest.json` describes one sensor. OpenTac-CAD writes it into every design
`.zip`. It is JSON, lengths are in millimetres, and coordinates are Y up with
the cable edge at the bottom.

```python
from opentac import manifest
m = manifest.load("my_design.zip")      # or manifest.json, or a dict
m.xy, m.row, m.col, m.w, m.h            # taxel centres (mm), scan indices, taxel size
```

`opentac manifest check FILE` validates a manifest and says which readout
boards it fits.

## Versions

The field `v` is the version. Each version added fields and changed none, so
code written for version 3 reads all of them.

| `v` | Added |
|---|---|
| 3 | the base fields below |
| 4 | `design`: the recipe OpenTac-CAD uses to rebuild or edit the board |
| 5 | `shear`: which taxels share a shear bump |
| 6 | `sim3d`: where each taxel sits on the 3-D part it was unrolled from |

## Fields

| Field | Meaning |
|---|---|
| `pixels` | one `[x, y, row, col]` per taxel. The authority on where taxels are. Its order is the order of every frame's values. |
| `w`, `h` | one taxel's width and height |
| `footprint` | the rest of the taxel copper: `trace_w`, `gap`, `center_clear`, `edge_clear`, `via_drill`, `via_dia` |
| `outline` | the shape the user drew |
| `edge_cuts` | the board as manufactured: grown board, cable tail and connector |
| `r`, `c` | number of scan rows and columns |
| `m` | which taxels exist: `r` strings of `c` characters, `1` for a taxel |
| `rp`, `cp` | connector pad of each scan row and column |
| `px`, `py`, `ox`, `oy` | scan-order pitch and origin. Not geometry; use `pixels`. |
| `shear` | `bumps`: bump centres. `b`: one entry per taxel, parallel to `pixels`, the taxel's bump index or -1 for none. |
| `design` | the CAD recipe (v4 on) |
| `sim3d` | 3-D placement (v6, sensors designed on a mesh) |
| `_readme` | notes for people; ignored by programs |

Scan row and column indices are in connector pad order, which is not
geometric order: OpenTac-CAD reverses the lower half of the rows so they meet
the routing on the right side. So `ox + col * px` does not place a taxel.
`pixels` does.

## Rules a manifest must follow

`manifest.load()` checks these and names the first one broken:

- `m` has `r` rows of `c` characters of `0`/`1`.
- `pixels` lists exactly the taxels `m` marks, in the order of reading `m`
  row by row.
- `rp` has `r` pads, `cp` has `c` pads, and no pad is used twice.
- `shear.b`, if present, has one entry per taxel.
- Positions are finite numbers; `w` and `h` are positive.

A readout board also needs the taxels on one regular grid: every taxel
position must be a whole number of pitches from the first one.

## What the readout board gets

`opentac setup` sends the board only what it needs to scan (241 bytes for a 9 x 9 sensor, at most 2,336):
the array size, the connector line of each row and column, which taxels exist,
the pitch and grid position of each row and column, and the shear grouping.
`pixels`, `outline`, `design` and the rest stay on the computer. The board
stores the CRC-32 of the manifest file's bytes as the sensor's id; the
computer keeps the file under that id in `~/.opentac/manifests/`.

## Pads and readout boards

A pad number in `rp`/`cp` is the pad on the sensor's cable tail. Which line of
the readout board it reaches belongs to the board, and is listed per board in
`opentac/device/boards/*.json`:

| Board | Pads | Pad p reaches |
|---|---|---|
| 60-pin | 1 to 60 | `62 - p`: pads 1-30 are read by mux channels 29..0, pads 31-60 are driven by shift-register steps 31..2 |
| 30-pin | 1 to 30 | pads 1-15 are driven by shift-register steps 14..0, pads 16-30 are read by mux channels 14..0 |

Every taxel needs one driven line and one read line. The readout firmware
accepts a skin with its rows on either side of the connector.

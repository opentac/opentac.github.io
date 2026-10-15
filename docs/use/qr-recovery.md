# Recover a manifest from the QR code

Sensors made with OpenTac-CAD carry a QR code on the back silkscreen. It
encodes the sensor's taxel grid: rows, columns, connector pads, which taxels
exist, where they sit, and the taxel footprint. If a sensor has lost its
files, the QR code is enough to read it.

## With a phone

Point the phone camera at the code and open the link it offers
(`opentac.github.io/q/...`). The [QR decoder page](../qr.md) opens, decodes
the code in the browser (nothing is uploaded), shows the grid, the pads and the
taxel positions, and has a *Download manifest.json* button. Set the board up
with that file, as usual:

```sh
uv run opentac setup manifest.json
```

## With the command line

Any QR scanner app gives the code's text. Rebuild the manifest from it:

```sh
uv run opentac manifest from-qr 'PASTE-THE-TEXT-HERE' -o my_sensor.json
uv run opentac setup my_sensor.json
```

The text can be the whole link (`HTTPS://OPENTAC.GITHUB.IO/Q/...`, in any case,
with or without `https://`) or the bare code from an older board. Use single
quotes: the text can contain `$`, which a shell expands inside double quotes,
and `*`, which it expands when unquoted. A bare code that starts with `-` reads
as an option; put `HTTPS://OPENTAC.GITHUB.IO/Q/` in front of it.

In Python:

```python
from opentac import manifest

m = manifest.from_qr(text)      # the link or the bare code
m.save("my_sensor.json")
```

The decoder page and the command line write the same file, byte for byte.

## Older boards and small boards

Boards exported before the QR became a link carry the bare code: a phone shows
it as text rather than a link (27 characters for the 81-taxel example sensor,
36 to 39 for sensors of about 100 taxels). Those codes still work: paste the
text into the [QR decoder page](../qr.md) or pass it to
`opentac manifest from-qr`.

The link adds 28 characters to the code, which makes the QR one version
larger (two on 1 of the 31 example designs), 1.4 mm more on each side per
version. A board without room for the link inside its outline gets the bare
code instead, and one without room for that gets no code. All 31
[example designs](../design/examples.md) have room for the link.

## What comes back, and what does not

A recovered manifest has the same rows, columns, pads and taxel mask as the
original. The QR stores the grid origin and pitch to 0.01 mm, so every taxel is
within 0.005 mm of its original position when the pitch is a whole number of
0.01 mm. A pitch with a third decimal moves the far taxels further: up to
0.12 mm on the example designs whose pitch was raised to fit the readout board.
That is all the readout board and the viewer need.

The QR does not carry:

- `outline` and `edge_cuts`, the sensor's drawn shape and cut edge,
- `design`, the recipe OpenTac-CAD needs to rebuild or edit the board,
- `shear`, which taxels share a shear bump, so there are no shear arrows.

Scanner apps sometimes trim or lowercase the text; both still decode. The
text carries a checksum, so a truncated or mistyped text is almost always
refused rather than decoded into the wrong pads: 8,997 of 9,000 random
one-character changes were refused in a test. Scan the code rather than type
it.

The recovered file is not byte-for-byte the original, so the board stores it
under a different id. If you find the original manifest later, run
`opentac setup` with it again.

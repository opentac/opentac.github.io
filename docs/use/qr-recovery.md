# Recover a manifest from the QR code

Sensors made with OpenTac-CAD carry a QR code on the back silkscreen. It
encodes the sensor's taxel grid: rows, columns, connector pads, which taxels
exist, where they sit, and the taxel footprint. If a sensor has lost its
files, the QR code is enough to read it.

1. Scan the QR code with a phone camera or any QR scanner app, and copy the
   text. It is short: 27 characters for the 81-taxel example sensor, 36 to
   39 for sensors of about 100 taxels.
2. Rebuild the manifest:

    ```sh
    uv run opentac manifest from-qr "PASTE-THE-TEXT-HERE" -o my_sensor.json
    ```

3. Set the board up with it, as usual:

    ```sh
    uv run opentac setup my_sensor.json
    ```

In Python:

```python
from opentac import manifest

m = manifest.from_qr(text)
m.save("my_sensor.json")
```

## What comes back, and what does not

A recovered manifest has the same rows, columns, pads and taxel mask as the
original, and every taxel within 0.005 mm of its original position (the QR
stores positions to 0.01 mm). That is all the readout board and the viewer
need.

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

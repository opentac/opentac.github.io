# Recover a manifest from the QR code

Sensors made with OpenTac-CAD carry a QR code on the back silkscreen. It
encodes the sensor's taxel grid: rows, columns, connector pads, which taxels
exist, where they sit, and the taxel footprint. If a sensor has lost its
files, the QR code is enough to read it.

## With a phone

Point the phone camera at the code and open the link it offers
(`opentac.github.io/q/...`). The [QR decoder page](../qr.md) opens and
decodes the code in the browser (nothing is uploaded). It draws the sensor to
scale from the code: every taxel with its copper, the row and column numbers
and the connector contact each one uses, the empty grid positions, and one
taxel's electrode pattern with its dimensions. Below that it lists every field
in the code with its value and the bits it takes, and it has a *Download
manifest.json* button.

<figure class="ot-fig ot-fig--clear" markdown>
<div class="ot-shots" markdown>
<figure markdown="span">
  ![KiCad render of the back of the 9 by 9 patch example: amber flex with a white 5 mm grid, the QR code in a white square, and the gold connector fingers at the end of the tail.](../assets/diagrams/qr_back.jpg){ loading=lazy width="601" height="900" }
  <figcaption>The code on the back</figcaption>
</figure>
<figure markdown="span">
  ![The QR decoder page's drawing of the same code: 81 taxels in 9 rows and 9 columns, each with its copper, row and column numbers, the connector contact of each row (7 to 15) and column (16 to 24) on a 30-contact cable, and a 5 mm scale bar.](../assets/screens/qr_decoder_drawing.webp){ loading=lazy width="592" height="721" }
  <figcaption>What the decoder page draws from it</figcaption>
</figure>
</div>
<figcaption>The 9&nbsp;&times;&nbsp;9 patch example design: its back silkscreen as KiCad renders it from the export, and the decoder page on the link that code holds. The lower four rows are numbered 8, 7, 6, 5 from the top: scan order, not geometric order.</figcaption>
</figure>

Set the board up with that file, as usual:

```sh
uv run opentac setup manifest.json
```

To see what a code holds without a sensor, open the code of the
[9 x 9 patch](../qr.md#YJ77YN9I2O-QN0AOBT.:VW3NG90){ data-design="strip-09x09" }
example design in the decoder. The decoder page links a few more.

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

<figure class="ot-fig" markdown="span" style="max-width: 22rem">
  ![Two QR codes at the same scale: the link, 55 characters, version 3, 12.95 mm square; and the bare code, 27 characters, version 2, 11.55 mm square.](../assets/diagrams/qr_forms.png){ loading=lazy width="1090" height="595" }
  <figcaption>The 9&nbsp;&times;&nbsp;9 patch's code both ways, at one scale, quiet zone included, as the export builds them (unmirrored here).</figcaption>
</figure>

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

<figure class="ot-fig" markdown="span" style="max-width: 34rem">
  [![Two drawings of the 9 by 9 patch. Left, the manifest from the export: 81 taxels coloured by shear bump, the drawn outline dashed and the board edge solid. Right, the manifest rebuilt from its QR code: the same 81 taxels in the same places, with no outline, no board edge and no bump groups.](../assets/diagrams/qr_recovered.png){ loading=lazy width="1263" height="750" }](../assets/diagrams/qr_recovered.png)
  <figcaption>The 9&nbsp;&times;&nbsp;9 patch's manifest, and the one <code>opentac manifest from-qr</code> rebuilds from its code: the same rows, columns and positions (here 0.000&nbsp;mm apart, at a 2&nbsp;mm pitch), without the outline, the board edge or the bump groups.</figcaption>
</figure>

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

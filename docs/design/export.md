---
title: What the export contains
description: Every file in the OpenTac-CAD download, what it is for, and the QR code on the back of the board.
---

# What the export contains

**Download ZIP** gives one archive with everything needed to manufacture, assemble and read the sensor, and to reopen the design later.

| File | What it is | Used for |
|---|---|---|
| `gerber/` | Gerber layers and the drill file | ordering the flex PCB ([Order the sensor](../build/order-sensor.md)) |
| `board.kicad_pcb` | the board in KiCad format | inspecting or editing the board in KiCad |
| `*_pos_0.5mm_FPC.kicad_mod` | the tail's connector footprint | opening the board in KiCad |
| `manifest.json` | machine-readable description of the sensor | the readout, the viewer, simulation and transfer |
| `design.json` | the design itself: outline, settings and hand-edited routes | reopening the design in OpenTac-CAD |
| `printable_1to1.pdf` | full-size paper template of the board | checking the fit before ordering |
| `velostat/velostat_cut.dxf` | outline of the sensing area, in mm | laser-cutting the piezoresistive layer |
| `velostat/velostat_fold_template.pdf` | the same outline, mirrored about a fold line | cutting the piezoresistive layer by hand |

The printed case is downloaded separately, as two STL files (**Download bottom**, **Download top**), after **Generate case**.

## The Gerbers

| File | Layer |
|---|---|
| `board-F_Cu.gtl`, `board-B_Cu.gbl` | top and bottom copper: taxel electrodes, columns on top, rows underneath |
| `board-In1_Cu.g1`, `board-In2_Cu.g2` | inner copper, 4-layer boards only: row wiring and notch links |
| `board-F_Mask.gts`, `board-B_Mask.gbs` | solder mask (coverlay) openings: the taxels on top, the connector fingers on the bottom |
| `board-F_Silkscreen.gto` | the design name, printed near the connector |
| `board-B_Silkscreen.gbo` | the QR code and registration grid (below) |
| `board-Edge_Cuts.gm1` | the board outline, including the tail and connector end |
| `board-User_Drawings.gbr` | the stiffener outline over the connector end |
| `board-User_Comments.gbr` | the stiffener note, for example `31.6x6 PI stiffener on TOP (taxel side), T = 0.3 total, contacts on BOTTOM` |
| `board.drl` | vias |

Zip the `gerber/` folder on its own for the board house. The two `User` layers are drawing layers: they are not fabricated as copper, they tell the board house where the stiffener goes and how thick the connector end must be.

## The manifest

`manifest.json` records, for every taxel, its physical position, its row and column scan index, its footprint, its bump group and its surface frame, plus the connector pad of every row and column. It is the one hand-off between the design and everything that reads it: the readout board stores it, the viewer draws with it, and the simulator and transfer tools build the sensor from it. The format is specified in [Manifest](../reference/manifest.md).

## The QR code on the back

The back silkscreen carries a small QR code and a millimetre registration grid. The QR holds the sensor's *taxel core*: grid size, pitches, taxel footprint, which connector pad drives each row and column, and which taxels exist. That is everything needed to read the sensor. A board that has been separated from its files can be read again from a photo of its back; see [Recover a manifest from the QR](../use/qr-recovery.md).

The code is a link, `HTTPS://OPENTAC.GITHUB.IO/Q/` followed by the taxel core. Scanned with a phone camera, it opens the [QR decoder page](../qr.md), which decodes it in the browser and offers the manifest as a download; `opentac manifest from-qr` reads the same text. The link is 28 characters longer than the bare taxel core, 1.4 mm more on each side of the code per QR version; on the 31 [example designs](examples.md) the code is 12.95 to 18.55 mm square, quiet zone included. A board without room for the link inside its outline gets the bare taxel core instead, which a phone shows as text to paste into the decoder page, and a board without room for that gets no code. The `/generate` response records which in `stats.back_qr`: `form` is `link`, `bare` or `null`, with a warning in `warnings` when it is not the link. Codes printed before the link, which carry the bare taxel core, still decode.

The grid sits on the manifest's coordinate frame, so a point read off a photo is a taxel coordinate. The QR is printed mirrored so that it reads correctly on the physical back of the board; in a top-view Gerber viewer it looks backwards, which is expected.

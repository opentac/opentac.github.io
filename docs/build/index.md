---
title: Build a sensor
description: Fabrication, stack alignment and assembly of an OpenTac sensor and its readout.
---

# Build a sensor

An OpenTac sensor combines a flex PCB and a piezoresistive layer inside a printed TPU case. The case comprises a tray and a lid; the lid can be flat, hatched, or fitted with bumps for shear sensing. OpenTac-CAD generates the board, case and cutting template from the same geometry, so the sensing layers and mechanical features align during assembly. The flex tail connects the assembled sensor to a readout board.

<figure class="ot-fig ot-fig--clear" markdown="span" style="max-width: 34rem">
  ![The parts of one sensor laid out on a desk: the printed TPU tray, the flex PCB with its tail, the black piezoresistive textile cut to shape, and the printed bump sheet.](../assets/video/assembly_poster.jpg){ loading=lazy width="1280" height="720" }
  <figcaption>The four layers of one sensor, from left: printed tray, flex PCB, piezoresistive textile, bump sheet (the lid).</figcaption>
</figure>

The [assembly guide](assembly.md) follows the complete procedure: verify the fit with a paper template, print the case, cut the piezoresistive layer, assemble the sensor, and inspect its readings. The remaining pages cover PCB ordering, materials and the [readout boards](../hardware.md).

[Assembly guide](assembly.md){ .md-button .md-button--primary }

## The printed case { #the-printed-case }

The case fixes the relative positions of the PCB, piezoresistive layer and bump sheet. Its bottom tray follows the board outline, while the lid places one bump over each 2&times;2 group of taxels. Generating both from the same design removes the need for a separate alignment jig.

Alignment matters because shear is estimated from differences in loading across the four taxels beneath a bump. Tangential force tilts the bump and shifts load toward one side ([How it works](../learn/index.md#2-how-do-four-taxels-under-one-bump-separate-normal-load-from-shear)). If the bump is off-centre, even a normal load can produce unequal readings and an apparent shear response.

<figure class="ot-fig ot-fig--clear" markdown="span">
  ![Close-up of a printed bump sheet seated on a flex PCB: each bump's cross-shaped base sits in the gaps between the gold taxel electrodes.](../assets/photos/alignment.jpg){ loading=lazy }
  <figcaption>The bumped lid on its board. The cross-shaped base of each bump seats in the gaps between taxels, which centres the bump over its 2&times;2 group.</figcaption>
</figure>

**Download ZIP** in OpenTac-CAD puts the case in the ZIP's `case/` folder: the bottom, the bumped lid as the primary one, the flat and hatched lids, and a README with the settings used ([What the export contains](../design/export.md)). The case panel in OpenTac-CAD (**Add a printed case**) previews the parts and changes their settings. The ZIPs of the [ready-to-order designs](../design/examples.md) include it too. Printing and fitting are in the assembly guide: [Print the case](assembly.md#print-the-case) and [Assemble](assembly.md#assemble).

## Fabrication and assembly sequence { #steps }

<div class="ot-steps" markdown>

| | Step | Time | Page |
|---|---|---|---|
| 1 | Design the sensor and download the ZIP: board files and the printed case | minutes | [Design](../design/index.md), [What the export contains](../design/export.md) |
| 2 | Print the 1:1 PDF and check the fit on the part | 10 min | [Assembly](assembly.md#check-the-fit-on-paper) |
| 3 | Order the flex PCB | days to weeks, shipping | [Order the sensor](order-sensor.md) |
| 4 | Order a readout board, if you don't have one | days to weeks, shipping | [Order the readout board](order-readout.md); files in the repository's [`hardware/`](https://github.com/opentac/opentac/tree/main/hardware) folder |
| 5 | Get the piezoresistive layer, TPU and tape | | [Materials and accessories](materials.md) |
| 6 | Print the case from the ZIP's `case/` folder: the tray and the bumped lid, in TPU | a few hours | [The printed case](#the-printed-case), [Assembly](assembly.md#print-the-case) |
| 7 | Cut the piezoresistive layer | 10 min | [Assembly](assembly.md#cut-the-piezoresistive-layer) |
| 8 | Assemble and plug in | 5 min | [Assembly](assembly.md#assemble) |
| 9 | Flash the readout board and read the sensor | 10 min | [Assembly](assembly.md#read-the-sensor), [Flash](../use/flash.md) |

</div>

PCB fabrication and shipping usually dominate the elapsed time. Order the sensor and readout boards together, and print the case while they are being manufactured.

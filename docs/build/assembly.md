---
title: Assembly guide
description: Check the fit, print the case, cut the piezoresistive layer, assemble an OpenTac sensor, and read it over USB. Includes fit verification, stack alignment and initial readout checks. No adhesive, fasteners or alignment jig are required.
---

# Assembly guide

This guide describes how to assemble and configure a sensor from an OpenTac-CAD export. First verify the board outline against the mounting surface, then print the case, cut the piezoresistive layer, assemble the stack and connect the readout board. The tray, cutting template and bump sheet share the PCB's design geometry, which constrains their alignment. Once the parts are available, assembly takes a few minutes and requires scissors and thin double-sided tape.

<div class="ot-media ot-media--video" style="margin: 1.2em 0 .4em">
  <video controls preload="none" playsinline poster="../../assets/video/assembly_poster.jpg"
         aria-label="Assembly video: the parts laid out, the flex board pressed into the printed tray, the black piezoresistive textile laid on top, the bump sheet pressed on, and the tail plugged into the readout board">
    <source src="../../assets/video/assembly.mp4" type="video/mp4">
    <track kind="captions" src="../../assets/video/assembly.vtt" srclang="en" label="English" default>
  </video>
</div>

The video follows the five [assembly steps](#assemble): arrange the parts, seat the PCB in the tray, add the piezoresistive textile, attach the bump sheet, and connect the tail to the readout board.

## What you need

- the flex PCB ([Order the sensor](order-sensor.md));
- a readout board that matches the sensor's connector ([Readout boards](../hardware.md)) and a USB cable;
- a piezoresistive sheet: film or fabric ([Materials](materials.md));
- TPU filament (85&ndash;95A) and a 3D printer;
- thin double-sided tape;
- printer paper and scissors.

The photos below are from a 15&times;11-taxel sensor for the jaw of an AgileX Piper gripper. Other designs follow the same steps with their own part and tail length.

## Check the fit on paper { #check-the-fit-on-paper }

Verify the outline and tail routing before ordering the PCB. A paper template lets you check these dimensions directly on the intended mounting surface.

1. Print `printable_1to1.pdf` from the export at **100% / Actual size**, not *Fit to page*.
2. Measure the ruler on the sheet: it must be exactly 100&nbsp;mm. If not, reprint.
3. Cut along the outline and hold it against the part. Wrap the tail along the path the cable will take to the readout board.

The PDF draws the board's real manufactured edge, including the tail, not just the shape you drew.

<div class="ot-photos" markdown>
<figure markdown="span">
  ![The printed 1:1 PDF with the board outline and taxel grid.](../assets/photos/steps/fit-pdf-printed.jpg){ loading=lazy }
  <figcaption>Full-scale board template.</figcaption>
</figure>
<figure markdown="span">
  ![The paper outline cut out.](../assets/photos/steps/fit-cutout.jpg){ loading=lazy }
  <figcaption>Cut along the manufactured board outline.</figcaption>
</figure>
<figure markdown="span">
  ![The paper cutout held against the gripper jaw.](../assets/photos/steps/fit-held-to-jaw.jpg){ loading=lazy }
  <figcaption>Check the sensing region against the gripper jaw.</figcaption>
</figure>
<figure markdown="span">
  ![The paper tail wrapped around the jaw toward the readout board.](../assets/photos/steps/fit-wrapped-on-jaw.jpg){ loading=lazy }
  <figcaption>Check the tail path to the readout board.</figcaption>
</figure>
</div>

If it does not fit, change the design and print again.

## Print the case { #print-the-case }

The case STLs are in the `case/` folder of the ZIP from **Download ZIP**: the bottom and three lids. Print the bottom and one lid. To change the case settings or preview the parts first, tick **Add a printed case** in OpenTac-CAD, choose the top piece and press **Generate case**. **Download bottom** and **Download top** save single parts, and the next **Download ZIP** uses the same settings.

- **Bottom (tray):** a shallow pocket cut to the board's exact outline, holding the flex and the piezoresistive layer.
- **Top:** *Flat*, *Hatched*, or *Shear-sensing bumps*. For shear, choose bumps: one bump sits over each 2&times;2 group of taxels.

Print both in TPU (85&ndash;95A). The bumps must be soft enough to tip; a rigid print reads normal force only.

<div class="ot-photos ot-photos--three" markdown>
<figure markdown="span">
  ![The two printed orange case parts side by side.](../assets/photos/steps/case-both-parts.jpg){ loading=lazy }
  <figcaption>TPU bump sheet and bottom tray.</figcaption>
</figure>
<figure markdown="span">
  ![Close-up of the top piece with rows of bumps and cross-shaped slits between them.](../assets/photos/steps/case-lid-bumps.jpg){ loading=lazy }
  <figcaption>The bump sheet.</figcaption>
</figure>
<figure markdown="span">
  ![The bottom piece with its recess and rib slots.](../assets/photos/steps/case-bottom-tray.jpg){ loading=lazy }
  <figcaption>Tray with a recess matching the PCB outline.</figcaption>
</figure>
</div>

## Cut the piezoresistive layer { #cut-the-piezoresistive-layer }

The export includes two versions of the sensing-area outline: `velostat/velostat_cut.dxf` for a laser cutter or cutting plotter, and `velostat/velostat_fold_template.pdf` for cutting with scissors. The PDF places mirrored outlines on either side of a fold line. Folding the paper around a thin film or textile holds it flat during cutting. The template covers the taxels and excludes the connector tail.

1. Print the fold template at 100%.
2. Fold it on the dashed line, printed side out, and trim the folded paper roughly around the shape.
3. Slide the sheet inside the fold. Both outlines line up, so the cut line shows on both sides.
4. Cut through paper and sheet together on the line, then peel the paper off.

<div class="ot-photos" markdown>
<figure markdown="span">
  ![The fold template: two mirrored outlines and a dashed fold line.](../assets/photos/steps/fold-template-printed.jpg){ loading=lazy }
  <figcaption>1. Print the cutting template at full scale.</figcaption>
</figure>
<figure markdown="span">
  ![The template folded on the dashed line.](../assets/photos/steps/fold-template-folded.jpg){ loading=lazy }
  <figcaption>2. Fold along the dashed line.</figcaption>
</figure>
<figure markdown="span">
  ![The folded template on the black piezoresistive fabric.](../assets/photos/steps/fabric-inside-fold.jpg){ loading=lazy }
  <figcaption>3. Place the piezoresistive sheet between the paper layers.</figcaption>
</figure>
<figure markdown="span">
  ![The finished black fabric piece in the shape of the sensing area.](../assets/photos/steps/fabric-cut-piece.jpg){ loading=lazy }
  <figcaption>4. Cut the sheet to the sensing-area outline.</figcaption>
</figure>
</div>

## Assemble { #assemble }

1. **Lay out the parts:** the printed tray, the flex PCB, the piezoresistive piece and the bump sheet.
2. **Board into the tray.** Put thin double-sided tape on the back of the flex and press it into the tray's pocket, taxels up. Seat the PCB flat within the matching outline.
3. **Piezoresistive layer on top.** Lay the cut piece over the taxels. It is cut from the same outline, so it covers every taxel.
4. **Press the bump sheet on.** Press it down all the way around the edge; a rib holds it shut. The bump sheet comes from the same design file as the board, so the cross-shaped base of each bump falls into the gaps between taxels and each bump centres itself over its 2&times;2 group. Check that the lid is seated around the full perimeter.
5. **Tail into the readout board.** Flip up the connector's latch, slide the tail in all the way with the stiffener (the taxel side) facing up and the contacts facing down, and press the latch closed. Then plug in USB.

<div class="ot-photos" markdown>
<figure markdown="span">
  ![The flex PCB sitting in the pocket of the tray, taxels up.](../assets/photos/steps/assembly-flex-in-tray.jpg){ loading=lazy }
  <figcaption>2. Board in the tray.</figcaption>
</figure>
<figure markdown="span">
  ![Black piezoresistive fabric laid over the taxels in the tray.](../assets/photos/steps/assembly-fabric-on-flex.jpg){ loading=lazy }
  <figcaption>3. Piezoresistive fabric covering the taxels.</figcaption>
</figure>
<figure markdown="span">
  ![The assembled sensor with the bumped top piece closed over it.](../assets/photos/steps/assembly-lid-on.jpg){ loading=lazy }
  <figcaption>4. Bump sheet seated on the tray.</figcaption>
</figure>
<figure markdown="span">
  ![The stiffened tail fully inserted in the readout board's connector, latch closed.](../assets/photos/steps/connector-inserted.jpg){ loading=lazy }
  <figcaption>5. Connector tail fully inserted, with the latch closed.</figcaption>
</figure>
</div>

<figure class="ot-fig ot-fig--clear" markdown="span">
  ![Close-up of the printed bump sheet seated on the flex PCB: the cross-shaped base of each bump sits in the gaps between the gold taxel electrodes.](../assets/photos/alignment.jpg){ loading=lazy }
  <figcaption>Mechanical alignment of the bump sheet: each cross-shaped base seats in the gaps between the four underlying taxels. The PCB and lid share the same design geometry.</figcaption>
</figure>


## Read the sensor { #read-the-sensor }

After connecting the tail, flash the readout board, upload the sensor manifest and verify the response in the live viewer. Initial setup takes about ten minutes. Run the commands from the code repository ([Get started](../get-started.md#run-it-on-your-computer)).

1. **Plug the readout board into the computer** with a micro-USB cable that carries data (some cables only charge). The board shows up as a serial port, with no adapter or programmer.
2. **Flash the firmware, once per board.** Install `dfu-util` (macOS: `brew install dfu-util`; Linux: `sudo apt install dfu-util`), or STM32CubeProgrammer on Windows, then:

    ```bash
    uv run opentac flash
    ```

    The command identifies the board, restarts it in bootloader mode and writes the corresponding firmware. A board fresh from assembly has no firmware and cannot answer: hold its BOOT0 button while you plug it in, release it, and name the board, `uv run opentac flash --board readout60` for the 60-pin board or `--board node16` for the 30-pin pair. [Flash the firmware](../use/flash.md) has the details and two other ways to flash.

    <figure class="ot-fig" markdown="span">
      ![BOOT0 buttons circled on the 60-pin board, near its lower-left corner, and the 30-pin top board, at its right edge.](../assets/diagrams/boot0_button.jpg){ loading=lazy width="1461" height="830" }
      <figcaption>The BOOT0 button (S4), circled. Renders of the boards' KiCad files, not to scale with each other.</figcaption>
    </figure>

3. **Upload the sensor manifest whenever the sensor changes.** Give it the ZIP you downloaded from OpenTac-CAD (or the `manifest.json` inside it):

    ```bash
    uv run opentac setup my_design.zip
    ```

    The board stores the sensor's layout in its own flash and keeps it through power cycles and reflashing. `uv run opentac info` shows what the board holds.

4. **Open the live view.** `--shear` adds the shear arrows; use it with the bump sheet.

    ```bash
    uv run opentac view --shear
    ```

    Click the window, then press `b` with nothing touching the sensor. That zeroes it: the reading at rest is subtracted from every frame.

### Verify normal and shear response { #what-you-should-see }

The viewer places each taxel at its physical coordinates, with axes in millimetres. With the sensor unloaded, press `b` to subtract the baseline; the taxels should then be near the bottom of the colour scale. Press a bump and observe the increase in its underlying taxel readings. The title reports the frame rate and the peak reading; readings are raw ADC counts from 0 to 4095, not calibrated forces in newtons.

With a bump sheet and `--shear` enabled, apply a tangential load without lifting your finger. An arrow at the bump should indicate the push direction. Arrows appear only after the group's summed reading exceeds a threshold of a few hundred counts. Flat and hatched lids do not provide the bump-mediated response assumed by this estimator; omit `--shear` for those lids.

<figure class="ot-fig" markdown="span" style="max-width: 24rem">
  ![Live-view rendering of a recorded 502-taxel AgileX jaw contact. A square press appears as a bright region; the colour scale spans 0–4095 ADC counts and the zeroed peak is 3890.](../assets/diagrams/view_frame.jpg){ loading=lazy width="890" height="948" }
  <figcaption>The live view's drawing of one recorded frame: a square block pressed by hand on a 502-taxel skin for an AgileX jaw, with no bump sheet, so no arrows.</figcaption>
</figure>

`a` switches autoscaling of the colours, `s` shows or hides the arrows, and `q` quits. [Read a sensor](../use/sensor.md) lists every key and covers recording, reading frames in Python, and converting counts to newtons.

<figure class="ot-fig">
<div class="ot-media ot-media--video">
  <video data-loop muted loop playsinline preload="none" data-poster="../../assets/loops/real_sensor.jpg"
         aria-label="A finger presses and twists a sensor with a bump sheet, wired to a 30-pin readout board; a live map beside it shows normal force as colour and shear as arrows">
    <source src="../../assets/loops/real_sensor.mp4" type="video/mp4">
  </video>
</div>
<figcaption>A finger presses and twists a sensor with a bump sheet. Colour is normal force; arrows are shear. The clip uses a separate visualisation; <code>opentac view</code> displays taxel readings and shear arrows with a different colour scheme.</figcaption>
</figure>

### Troubleshoot the readout { #if-something-looks-wrong }

| What you see | What to check |
|---|---|
| `no OpenTac readout board ... found on USB` | The cable carries data. No other program has the board's port open: close any other viewer or serial monitor. The board has been flashed. |
| `the board holds no skin` | Run `uv run opentac setup` with the sensor's ZIP. |
| Nothing responds to a press | The contacts face the wrong way somewhere. At the readout board the tail goes in with the stiffener up and the contacts down. Through an extension cable, the cable must be A type (contacts on the same face at both ends), with the contacts down into both connectors ([Cables and extension boards](materials.md#cables-and-extension-boards)). |
| A row or a column stays dark, or several | The tail is not fully seated. Open the latch, push the tail in square to the stop, and close the latch. Check the tail and the cable for a crease or a cut. |
| A press shows up in the wrong place, or mirrored | Through an extension: a cable of the wrong type, or one end the wrong way round ([Cables and extension boards](materials.md#cables-and-extension-boards)). Without one: the board holds another sensor's layout. Run `opentac setup` with this sensor's ZIP. |
| Taxels show a reading with nothing touching | Press `b` with hands off to zero again. |
| A firm press turns many taxels to the top of the scale, on the 60-pin board | Lower the gain: `uv run opentac view --set GAIN_SW=2` ([Gain](../use/sensor.md#gain-60-pin-board)). |

## Recording and multi-sensor readout { #next }

[Read a sensor](../use/sensor.md) covers recording takes, reading frames in Python, the board's settings and calibration to newtons. To read several 30-pin boards over one USB port, see [Daisy-chain boards](../use/daisy-chain.md).

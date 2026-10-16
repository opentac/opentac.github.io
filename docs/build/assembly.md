---
title: Assembly guide
description: Check the fit, print the case, cut the piezoresistive layer, assemble an OpenTac sensor, and read it over USB. No glue, screws or alignment jig.
---

# Assembly guide

This page takes a downloaded design to a working sensor: check the fit on paper, print the case, cut the piezoresistive layer, assemble, then plug the sensor in and read it. Assembly itself takes a few minutes and needs no tools beyond scissors. The tray, the piezoresistive cut and the bump sheet are all generated from the board's own outline, so each part drops onto the one below it in the right place.

<div class="ot-media ot-media--video" style="margin: 1.2em 0 .4em">
  <video controls preload="none" playsinline poster="../../assets/video/assembly_poster.jpg"
         aria-label="Assembly video: the parts laid out, the flex board pressed into the printed tray, the black piezoresistive textile laid on top, the bump sheet pressed on, and the tail plugged into the readout board">
    <source src="../../assets/video/assembly.mp4" type="video/mp4">
    <track kind="captions" src="../../assets/video/assembly.vtt" srclang="en" label="English" default>
  </video>
</div>

The video shows the five steps of [Assemble](#assemble) below: the parts laid out; the board into the tray; the textile on top; the bump sheet pressed on, which aligns itself; the tail into the readout board.

## What you need

- the flex PCB ([Order the sensor](order-sensor.md));
- a readout board that matches the sensor's connector ([Readout boards](../hardware.md)) and a USB cable;
- a piezoresistive sheet: film or fabric ([Materials](materials.md));
- TPU filament (85&ndash;95A) and a 3D printer;
- thin double-sided tape;
- printer paper and scissors.

The photos below are from a 15&times;11-taxel sensor for the jaw of an AgileX Piper gripper. Other designs follow the same steps with their own part and tail length.

## Check the fit on paper { #check-the-fit-on-paper }

Do this before ordering boards. It takes a minute and catches a wrong outline.

1. Print `printable_1to1.pdf` from the export at **100% / Actual size**, not *Fit to page*.
2. Measure the ruler on the sheet: it must be exactly 100&nbsp;mm. If not, reprint.
3. Cut along the outline and hold it against the part. Wrap the tail along the path the cable will take to the readout board.

The PDF draws the board's real manufactured edge, including the tail, not just the shape you drew.

<div class="ot-photos" markdown>
<figure markdown="span">
  ![The printed 1:1 PDF with the board outline and taxel grid.](../assets/photos/steps/fit-pdf-printed.jpg){ loading=lazy }
  <figcaption>The 1:1 print.</figcaption>
</figure>
<figure markdown="span">
  ![The paper outline cut out.](../assets/photos/steps/fit-cutout.jpg){ loading=lazy }
  <figcaption>Cut out.</figcaption>
</figure>
<figure markdown="span">
  ![The paper cutout held against the gripper jaw.](../assets/photos/steps/fit-held-to-jaw.jpg){ loading=lazy }
  <figcaption>Held to the part.</figcaption>
</figure>
<figure markdown="span">
  ![The paper tail wrapped around the jaw toward the readout board.](../assets/photos/steps/fit-wrapped-on-jaw.jpg){ loading=lazy }
  <figcaption>Tail wrapped to the board.</figcaption>
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
  <figcaption>Top and bottom, in TPU.</figcaption>
</figure>
<figure markdown="span">
  ![Close-up of the top piece with rows of bumps and cross-shaped slits between them.](../assets/photos/steps/case-lid-bumps.jpg){ loading=lazy }
  <figcaption>The bump sheet.</figcaption>
</figure>
<figure markdown="span">
  ![The bottom piece with its recess and rib slots.](../assets/photos/steps/case-bottom-tray.jpg){ loading=lazy }
  <figcaption>The tray: its pocket is the board outline.</figcaption>
</figure>
</div>

## Cut the piezoresistive layer { #cut-the-piezoresistive-layer }

The export has the sensing area's outline twice: `velostat/velostat_cut.dxf` for a laser cutter or cutting plotter, and `velostat/velostat_fold_template.pdf` for scissors. The fold template draws the outline twice, mirrored across a dashed line, so a thin sheet that curls can be held flat between two layers of paper while you cut. It covers the taxels only, not the tail.

1. Print the fold template at 100%.
2. Fold it on the dashed line, printed side out, and trim the folded paper roughly around the shape.
3. Slide the sheet inside the fold. Both outlines line up, so the cut line shows on both sides.
4. Cut through paper and sheet together on the line, then peel the paper off.

<div class="ot-photos" markdown>
<figure markdown="span">
  ![The fold template: two mirrored outlines and a dashed fold line.](../assets/photos/steps/fold-template-printed.jpg){ loading=lazy }
  <figcaption>1. The template.</figcaption>
</figure>
<figure markdown="span">
  ![The template folded on the dashed line.](../assets/photos/steps/fold-template-folded.jpg){ loading=lazy }
  <figcaption>2. Folded.</figcaption>
</figure>
<figure markdown="span">
  ![The folded template on the black piezoresistive fabric.](../assets/photos/steps/fabric-inside-fold.jpg){ loading=lazy }
  <figcaption>3. Sheet inside the fold.</figcaption>
</figure>
<figure markdown="span">
  ![The finished black fabric piece in the shape of the sensing area.](../assets/photos/steps/fabric-cut-piece.jpg){ loading=lazy }
  <figcaption>4. The cut piece.</figcaption>
</figure>
</div>

## Assemble { #assemble }

1. **Lay out the parts:** the printed tray, the flex PCB, the piezoresistive piece and the bump sheet.
2. **Board into the tray.** Put thin double-sided tape on the back of the flex and press it into the tray's pocket, taxels up. The pocket is the board's outline, so it drops into place.
3. **Piezoresistive layer on top.** Lay the cut piece over the taxels. It is cut from the same outline, so it covers every taxel.
4. **Press the bump sheet on.** Press it down all the way around the edge; a rib holds it shut. The bump sheet comes from the same design file as the board, so the cross-shaped base of each bump falls into the gaps between taxels and each bump centres itself over its 2&times;2 group. There is nothing to line up.
5. **Tail into the readout board.** Flip up the connector's latch, slide the tail in all the way with the stiffener (the taxel side) facing up and the contacts facing down, and press the latch closed. Then plug in USB.

<div class="ot-photos" markdown>
<figure markdown="span">
  ![The flex PCB sitting in the pocket of the tray, taxels up.](../assets/photos/steps/assembly-flex-in-tray.jpg){ loading=lazy }
  <figcaption>2. Board in the tray.</figcaption>
</figure>
<figure markdown="span">
  ![Black piezoresistive fabric laid over the taxels in the tray.](../assets/photos/steps/assembly-fabric-on-flex.jpg){ loading=lazy }
  <figcaption>3. Fabric on top.</figcaption>
</figure>
<figure markdown="span">
  ![The assembled sensor with the bumped top piece closed over it.](../assets/photos/steps/assembly-lid-on.jpg){ loading=lazy }
  <figcaption>4. Bump sheet on.</figcaption>
</figure>
<figure markdown="span">
  ![The stiffened tail fully inserted in the readout board's connector, latch closed.](../assets/photos/steps/connector-inserted.jpg){ loading=lazy }
  <figcaption>5. Tail in, latch down.</figcaption>
</figure>
</div>

<figure class="ot-fig ot-fig--clear" markdown="span">
  ![Close-up of the printed bump sheet seated on the flex PCB: the cross-shaped base of each bump sits in the gaps between the gold taxel electrodes.](../assets/photos/alignment.jpg){ loading=lazy }
  <figcaption>Why no jig is needed: the bump sheet and the board come from the same design file, so the cross-shaped bases of the bumps seat in the gaps between taxels.</figcaption>
</figure>


## Read the sensor { #read-the-sensor }

With the tail in the readout board, the sensor is ready to read. The first time takes about ten minutes. Run the commands in the repository folder ([Get started](../get-started.md#run-it-on-your-computer)).

1. **Plug the readout board into the computer** with a micro-USB cable that carries data (some cables only charge). The board shows up as a serial port, with no adapter or programmer.
2. **Flash the firmware, once per board.** Install `dfu-util` (macOS: `brew install dfu-util`; Linux: `sudo apt install dfu-util`), or STM32CubeProgrammer on Windows, then:

    ```bash
    uv run opentac flash
    ```

    It asks the board which board it is, restarts it into its bootloader and writes the matching firmware. A board fresh from assembly has no firmware and cannot answer: hold its BOOT0 button while you plug it in, release it, and name the board, `uv run opentac flash --board readout60` for the 60-pin board or `--board node16` for the 30-pin pair. [Flash the firmware](../use/flash.md) has the details and two other ways to flash.

3. **Tell the board which sensor it has, once per sensor.** Give it the ZIP you downloaded from OpenTac-CAD (or the `manifest.json` inside it):

    ```bash
    uv run opentac setup my_design.zip
    ```

    The board stores the sensor's layout in its own flash and keeps it through power cycles and reflashing. `uv run opentac info` shows what the board holds.

4. **Open the live view.** `--shear` adds the shear arrows; use it with the bump sheet.

    ```bash
    uv run opentac view --shear
    ```

    Click the window, then press `b` with nothing touching the sensor. That zeroes it: the reading at rest is subtracted from every frame.

### What you should see

The window draws every taxel where it sits on the sensor, inside the outline you drew, with axes in millimetres. After zeroing, every taxel is dark. Press one bump with a fingertip: the taxels under it turn bright, and the title line shows the frame rate and the peak reading. The colour scale is in raw ADC counts, 0 to 4095, not newtons. Then push the bump sideways without lifting your finger: with `--shear` and the bump sheet on, an arrow on that bump points the way you push. A bump gets an arrow only once its taxels read a few hundred counts in total. With a flat or hatched lid the arrows mean nothing; leave out `--shear`.

`a` switches autoscaling of the colours, `s` shows or hides the arrows, and `q` quits. [Read a sensor](../use/sensor.md) lists every key and covers recording, reading frames in Python, and converting counts to newtons.

<figure class="ot-fig">
<div class="ot-media ot-media--video">
  <video data-loop muted loop playsinline preload="none" data-poster="../../assets/loops/real_sensor.jpg"
         aria-label="A finger presses and twists a sensor with a bump sheet, wired to a 30-pin readout board; a live map beside it shows normal force as colour and shear as arrows">
    <source src="../../assets/loops/real_sensor.mp4" type="video/mp4">
  </video>
</div>
<figcaption>A finger presses and twists a sensor with a bump sheet. Colour is normal force; arrows are shear. The map in this clip was not drawn by <code>opentac view</code>, which shows the same two things in its own colours.</figcaption>
</figure>

### If something looks wrong

| What you see | What to check |
|---|---|
| `no OpenTac readout board ... found on USB` | The cable carries data. No other program has the board's port open: close any other viewer or serial monitor. The board has been flashed. |
| `the board holds no skin` | Run `uv run opentac setup` with the sensor's ZIP. |
| Nothing responds to a press | The contacts face the wrong way somewhere. At the readout board the tail goes in with the stiffener up and the contacts down. Through an extension cable, the cable must be A type (contacts on the same face at both ends), with the contacts down into both connectors ([Cables and extension boards](materials.md#cables-and-extension-boards)). |
| A row or a column stays dark, or several | The tail is not fully seated. Open the latch, push the tail in square to the stop, and close the latch. Check the tail and the cable for a crease or a cut. |
| A press shows up in the wrong place, or mirrored | Through an extension: a cable of the wrong type, or one end the wrong way round ([Cables and extension boards](materials.md#cables-and-extension-boards)). Without one: the board holds another sensor's layout. Run `opentac setup` with this sensor's ZIP. |
| Taxels show a reading with nothing touching | Press `b` with hands off to zero again. |
| A firm press turns many taxels to the top of the scale, on the 60-pin board | Lower the gain: `uv run opentac view --set GAIN_SW=2` ([Gain](../use/sensor.md#gain-60-pin-board)). |

## Next

[Read a sensor](../use/sensor.md) covers recording takes, reading frames in Python, the board's settings and calibration to newtons. To read several 30-pin boards over one USB port, see [Daisy-chain boards](../use/daisy-chain.md).

---
title: Assembly
description: Check the fit, print the case, cut the piezoresistive layer, and assemble an OpenTac sensor. No glue, screws or alignment jig.
---

# Assembly

Assembly takes a few minutes and needs no tools beyond scissors. The tray, the piezoresistive cut and the bump sheet are all generated from the board's own outline, so each part drops onto the one below it in the right place.

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

In OpenTac-CAD, after **Generate PCB**, tick **Add a printed case**, choose the top piece and press **Generate case**, then **Download bottom** and **Download top**.

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

1. Print the fold template at 100% and fold it on the dashed line, printed side out.
2. Trim the folded paper roughly around the shape.
3. Slide the sheet inside the fold. Both outlines line up, so the cut line shows on both sides.
4. Cut through paper and sheet together on the line, then peel the paper off.

<div class="ot-photos" markdown>
<figure markdown="span">
  ![The fold template: two mirrored outlines and a dashed fold line.](../assets/photos/steps/fold-template-printed.jpg){ loading=lazy }
  <figcaption>1. The template.</figcaption>
</figure>
<figure markdown="span">
  ![The template folded on the dashed line.](../assets/photos/steps/fold-template-folded.jpg){ loading=lazy }
  <figcaption>1. Folded.</figcaption>
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

<!-- CHECK: connector photos show the earlier 70-pin board; replace with the 60-pin board once photographed -->

## Next

[Flash the firmware](../use/flash.md) on the readout board (once per board), then [read the sensor](../use/sensor.md). Zero the sensor with nothing touching it before you look at readings.

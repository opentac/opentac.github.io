---
template: home.html
title: OpenTac
description: Open tools to design, fabricate, read and simulate flex-PCB tactile skins that sense normal and shear force, shaped to any robot surface.
hide:
  - navigation
  - toc
---

<!--
  Home page story. Layout classes live in docs/stylesheets/opentac.css:
    ot-story        one section: text + one visual (add ot-story--flip to swap sides)
    ot-media        a rounded media frame; data-loop videos autoplay when visible
    ot-strip        a row of clips of different shapes at one height
  Numbers here come only from the paper text; see results.md for the full list.
-->

<section class="ot-video" aria-labelledby="video">
<h2 id="video" class="ot-section-title">Overview</h2>
<p class="ot-video__lede">
OpenTac turns a robot surface into a tactile skin: it designs the flex PCB, the printed case and a machine-readable description of the sensor, and the same description drives the readout, the simulator and data transfer between sensors.
</p>
<div class="ot-media ot-media--video">
  <video controls preload="none" playsinline poster="assets/loops/overview.jpg"
         aria-label="Three-minute narrated overview of OpenTac, with subtitles in the picture">
    <source src="assets/loops/overview.mp4" type="video/mp4">
  </video>
</div>
</section>

<section class="ot-story" aria-labelledby="sense" markdown>
<div class="ot-story__text" markdown>

## Normal and shear force from one flex PCB { #sense }

Each skin is a two-layer flex PCB with a grid of interdigitated electrodes (taxels), a piezoresistive film on top, and a 3D-printed lid with one soft bump over every 2&times;2 group of taxels.

Pressing a bump raises all four taxels together; a sideways push tilts it, so the four read differently. Their sum gives the normal force and their differences give the two shear components.

[How it works](learn/index.md){ .ot-more }

</div>
<div class="ot-media">
  <video data-loop muted loop playsinline preload="none" poster="assets/loops/bump_principle.jpg"
         aria-label="Animation of the sensor layers and of a bump responding to press, shear and twist">
    <source src="assets/loops/bump_principle.mp4" type="video/mp4">
  </video>
</div>
</section>

<div class="ot-strip">
<figure class="ot-strip__item ot-strip__item--wide">
  <video data-loop muted loop playsinline preload="none" poster="assets/loops/real_sensor.jpg"
         aria-label="A finger presses and twists a bump sensor; the live map shows normal force as colour and shear as arrows">
    <source src="assets/loops/real_sensor.mp4" type="video/mp4">
  </video>
  <figcaption>A finger presses and twists a sensor. Colour is normal force; arrows are shear.</figcaption>
</figure>
<figure class="ot-strip__item ot-strip__item--tall">
  <video data-loop muted loop playsinline preload="none" poster="assets/video/dynamic_range_poster.jpg"
         aria-label="Pressure readings from about 0.1 newton to about 10 newtons">
    <source src="assets/video/dynamic_range.mp4" type="video/mp4">
  </video>
  <figcaption>From about 0.1&nbsp;N to about 10&nbsp;N.</figcaption>
</figure>
<figure class="ot-strip__item ot-strip__item--tall">
  <video data-loop muted loop playsinline preload="none" poster="assets/video/heat_gun_poster.jpg"
         aria-label="A heat gun blown at the sensor produces no false signal">
    <source src="assets/video/heat_gun.mp4" type="video/mp4">
  </video>
  <figcaption>A heat gun gives no false signal.</figcaption>
</figure>
</div>

<section class="ot-story ot-story--flip" aria-labelledby="design" markdown>
<div class="ot-story__text" markdown>

## Design a sensor for any surface { #design }

OpenTac-CAD fills a drawn outline, a DXF, or a surface picked on an STL model with taxels, routes every row and column to the connector, and writes the Gerbers, a printed case and the sensor's manifest. A coding agent can drive the same compiler from a one-sentence request.

Five representative designs compile in 0.7&ndash;2.6&nbsp;s and cover 75&ndash;93% of their target regions.

[Try it online](cad/){ .ot-more } [Design guide](design/index.md){ .ot-more }

</div>
<div class="ot-media">
  <video data-loop muted loop playsinline preload="none" poster="assets/loops/cad_demo.jpg"
         aria-label="Screen recording of OpenTac-CAD sensorizing a gripper finger: load the model, select the surface, set the cable edge and taxel size, generate, add the case and export">
    <source src="assets/loops/cad_demo.mp4" type="video/mp4">
  </video>
</div>
</section>

<figure class="ot-wide" markdown="span">
  ![All 31 fabricated OpenTac flex PCBs laid out flat, from small fingertip pads to a 1024-taxel square.](assets/figures/fabricated.png){ loading=lazy }
  <figcaption>The 31 sensors we have fabricated. All passed the design-rule check and work.</figcaption>
</figure>

<section class="ot-story" aria-labelledby="build" markdown>
<div class="ot-story__text" markdown>

## Order it, print it, press it together { #build }

The flex PCB is an ordinary order from a board house; the case and bump sheet print in TPU on a desktop printer. Assembly is a stack: board into the printed tray, piezoresistive film on top, bump sheet pressed on.

The bump sheet and the board come from the same design file, so the cross-shaped base of each bump drops into the gaps between taxels. No jig and no alignment step.

[Build guide](build/index.md){ .ot-more } [Assembly video](build/assembly.md){ .ot-more }

</div>
<figure class="ot-media" markdown="span">
  ![Close-up of an orange printed bump sheet seated on a flex PCB: the cross-shaped base of each bump sits in the gaps between the gold taxel electrodes.](assets/photos/alignment.jpg){ loading=lazy }
</figure>
</section>

<section class="ot-story ot-story--flip" aria-labelledby="read" markdown>
<div class="ot-story__text" markdown>

## Read it over USB { #read }

The 60-pin readout board reads up to 30&times;30 taxels in 37&nbsp;&times;&nbsp;34.3&nbsp;mm and plugs straight into USB; a stacked 30-pin pair reads up to 15&times;15 in a 16&nbsp;&times;&nbsp;22.8&nbsp;mm footprint. Each board carries an IMU, and 30-pin boards can be daisy-chained over I2C to read a whole hand from one USB port.

The board keeps the sensor's manifest, so after a one-time setup the live view knows the layout.

[Readout boards](hardware.md){ .ot-more } [Read a sensor](use/sensor.md){ .ot-more }

</div>
<div class="ot-media ot-media--board">
  <video data-loop muted loop playsinline preload="none" poster="assets/boards/readout60.png"
         aria-label="Turntable render of the 60-pin OpenTac readout board">
    <source src="assets/boards/readout60_spin.mp4" type="video/mp4">
  </video>
</div>
</section>

<section class="ot-story" aria-labelledby="xampling" markdown>
<div class="ot-story__text" markdown>

## Read faster where contact happens { #xampling }

Xampling is compressive sampling for touch: each frame reads only a few taxels, chosen around where contact is, instead of the whole array. It works on any sensor layout.

On a 1024-taxel skin, full raster scanning gives 67 frames/s; reading 16 taxels per frame gives 1286 partial frames/s. Raster scanning caught two of six ~3&nbsp;ms tennis-ball impacts; budgets of 16 to 256 taxels per frame caught all three impacts tested at each budget.

[Xampling](use/xampling.md){ .ot-more }

</div>
<div class="ot-media">
  <video data-loop muted loop playsinline preload="none" poster="assets/loops/xampling.jpg"
         aria-label="The same tennis-ball impact in slow motion: raster scanning misses it, Xampling captures it">
    <source src="assets/loops/xampling.mp4" type="video/mp4">
  </video>
</div>
</section>

<section class="ot-story ot-story--flip ot-story--pair" aria-labelledby="sim" markdown>
<div class="ot-story__text" markdown>

## Simulate it, and share data between sensors { #sim }

The manifest that drives the hardware also builds the sensor in simulation. OpenTac-Sim models a plain skin with a foam-contact model and a bump sheet with deformable MuJoCo pads that report normal and shear.
<!-- CHECK: sim scope at release (flat skins only, per RELEASE_PLAN) matches sim.md -->

OpenTac-Transfer maps calibrated contact between skins of different shape and taxel pitch, in physical coordinates and without paired data. Across four skins it reached a median shape F1 of 0.750, against 0.714 and 0.634 for two array-resizing baselines.

[Simulate](sim.md){ .ot-more } [Transfer](transfer.md){ .ot-more }

</div>
<div class="ot-pair">
  <div class="ot-media">
    <video data-loop muted loop playsinline preload="none" poster="assets/loops/sim_peg.jpg"
           aria-label="Simulated peg insertion with deformable tactile pads: the normal-and-shear policy inserts the peg, the normal-only policy fails">
      <source src="assets/loops/sim_peg.mp4" type="video/mp4">
    </video>
  </div>
  <div class="ot-media">
    <video data-loop muted loop playsinline preload="none" poster="assets/loops/transfer.jpg"
           aria-label="One block pressed into three skins of different shape and pitch, mapped onto one millimetre grid">
      <source src="assets/loops/transfer.mp4" type="video/mp4">
    </video>
  </div>
</div>
</section>

<section class="ot-robots" aria-labelledby="robots" markdown>
<div class="ot-robots__text" markdown>

## On robots { #robots }

We deployed the skins on four robots and a handheld gripper. On an SO-101 arm, policies with normal and shear touch had the highest success on both insertion tasks (82% peg-in-hole, 62% plug insertion); on plug insertion, normal-only touch did not beat joint angles alone. On a Dexmate Vega-1 Pro holding a cup under impulsive loading, shear feedback kept the grasp in 16 of 20 trials, against 9 of 20 with wrist force/torque or normal-only feedback.

[All results](results.md){ .ot-more }

</div>
<div class="ot-grid3">
  <div class="ot-media"><video data-loop muted loop playsinline preload="none" poster="assets/loops/so101.jpg" aria-label="SO-101 plug insertion: the normal-and-shear policy succeeds, the FlexiTac policy fails"><source src="assets/loops/so101.mp4" type="video/mp4"></video></div>
  <div class="ot-media"><video data-loop muted loop playsinline preload="none" poster="assets/loops/dexmate.jpg" aria-label="Dexmate humanoid holding a cup with two probes, force-only versus force-and-shear feedback"><source src="assets/loops/dexmate.mp4" type="video/mp4"></video></div>
  <div class="ot-media"><video data-loop muted loop playsinline preload="none" poster="assets/loops/umi_ball.jpg" aria-label="UMI gripper holding a ball that a hand turns, with live normal and shear maps from both finger skins"><source src="assets/loops/umi_ball.mp4" type="video/mp4"></video></div>
  <div class="ot-media"><video data-loop muted loop playsinline preload="none" poster="assets/loops/ur5.jpg" aria-label="UR5 rolling a ball under normal-force and shear-force controllers"><source src="assets/loops/ur5.mp4" type="video/mp4"></video></div>
  <div class="ot-media"><video data-loop muted loop playsinline preload="none" poster="assets/loops/yam.jpg" aria-label="Two YAM arms in teleoperation with tactile readout"><source src="assets/loops/yam.mp4" type="video/mp4"></video></div>
  <div class="ot-media"><video data-loop muted loop playsinline preload="none" poster="assets/loops/umi_external.jpg" aria-label="A hand pushes a screwdriver held by the UMI gripper; the contact shows in both finger skins"><source src="assets/loops/umi_external.mp4" type="video/mp4"></video></div>
</div>
</section>

<section class="ot-start" aria-labelledby="start" markdown>
<div markdown>

## Use it { #start }

Everything runs on your own computer. Clone the repository and double-click `Start_OpenTac.command` (macOS) or `Start_OpenTac.bat` (Windows); the CAD tool opens in your browser. Or try the hosted version first, no install needed.

```bash
git clone https://github.com/opentac/opentac.github.io opentac
cd opentac
uv run opentac cad
```

Working with an AI coding agent? The repository ships a skill for designing sensors: Claude Code loads it automatically, and other agents read `AGENTS.md`.

</div>
<div class="ot-hero__buttons ot-start__buttons">
  <a class="ot-btn ot-btn--primary" href="cad/">Try it online</a>
  <a class="ot-btn ot-btn--dark" href="get-started/">Get started</a>
  <a class="ot-btn ot-btn--dark" href="paper/">Paper and citation</a>
</div>
</section>

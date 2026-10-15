---
hide:
  - toc
---

# How it works

<link rel="stylesheet" href="learn.css">

Five interactive studies of how an OpenTac skin turns contact into numbers, and what those numbers can and cannot tell you. The layouts come from real sensor manifests, and studies 4 and 5 replay real recordings. Where a figure uses a model instead of data, it says so under the figure.

## 1. How does a press become a number?

<div class="otl otl-fig" data-study="anatomy"><div class="otl-loading">Loading…</div><noscript><p class="otl-loading">The figures on this page need JavaScript.</p></noscript></div>

An OpenTac skin is a two-layer flex PCB with a taxel at every row-column crossing, a piezoresistive film over it, and a top layer: a printed bump lid, or a flat foam or case top. Each taxel is two interdigitated copper combs with 0.2 mm traces and 0.2 mm gaps, and pressing the film lowers the resistance between them. The readout drives one row at a time, holds the other rows at the potential of the sensing amplifier, and switches one column at a time through a multiplexer into a transimpedance amplifier and a 12-bit ADC, so each taxel gives one number per frame.

<p class="otl otl-note"><b>Shows:</b> the stack in order, the real taxel copper at three pitches (from the footprint generator), and why the undriven rows are held at the amplifier's potential: turn that off and press three corners of a rectangle. <b>Does not show:</b> real layer thicknesses, the routing between taxels, or amplifier gain. The counts in the matrix are schematic.</p>

## 2. How do four taxels under one bump separate normal load from shear?

<div class="otl otl-fig" data-study="bump"><div class="otl-loading">Loading…</div></div>

A bump stands on a 2 × 2 block of taxels. Pressing it straight down loads all four; pushing it sideways tilts it, so the two taxels it leans toward read more and the other two read less. The sum h<sub>z</sub> = Σ z and the signed differences h<sub>x</sub> = Σ u·z and h<sub>y</sub> = Σ v·z separate the two, with each taxel's side (u, v = ±1) taken from the manifest's shear groups.

<p class="otl otl-note"><b>Shows:</b> a real 2 × 2 block from each skin's manifest, and a lumped model of the bump (TactileSim's statics, bump-sheet default size) read through the fitted film profiles, including saturation and one side unloading. A press off the bump's centre gives the same differential as shear. <b>Does not show:</b> measured data. Bump stiffness, friction and the calibration that maps h to newtons are left out; the decoded forces invert the model, not a calibration.</p>

## 3. What changes when a contact is sheared or twisted?

<div class="otl otl-fig" data-study="field"><div class="otl-loading">Loading…</div></div>

Over a whole skin, each bump group reports its own shear. A drag makes every loaded bump lean the same way. A twist makes them lean around the contact, so their forces cancel in the sum but the twisting moment does not. Groups that the outline cut short cannot resolve shear along an axis where all their taxels sit on one side.

<p class="otl otl-note"><b>Shows:</b> real layouts and shear groups, and shear decoded group by group from modelled counts, the way a host would decode a real frame. <b>Does not show:</b> a recorded shear field. The load is constructed (a Gaussian press, with traction proportional to the local normal load), and there is no contact mechanics, slip or coupling between bumps.</p>

## 4. Why does moving contact between skins need physical coordinates?

<div class="otl otl-fig" data-study="transfer"><div class="otl-loading">Loading the recorded presses…</div></div>

The same three objects were pressed by hand on three skins of different pitch. Through the manifests, every taxel becomes the area it covers, so a press recorded on one skin can be placed on another at its real size: each source cell is split into small equal shares, and each share goes to the target taxel under it. Mapped by array index instead, the press takes the other array's proportions. Measured at half of each press's peak, the allen key's bar came out 10.3, 9.7 and 9.5 mm wide on the three skins, while contact area did not transfer: the coarser skins report 30–50% more of it.

<p class="otl otl-note"><b>Shows:</b> real recordings (LEAP palm, 4.2 mm pitch; quadruped foot, 3.1 mm; AgileX jaw, 2.0 mm), the hardest press of each take, and the geometric step of OpenTac-Transfer, placed by each press's measured pose (centre and main axis). Contact area and extent use taxels above 25% of each panel's peak. <b>Does not show:</b> calibrated force. Two of these skins have no force calibration, so counts are moved as a proxy and colour is normalised per panel. The presses were freehand, so force, place and angle differ from skin to skin.</p>

## 5. What does a partial update actually observe?

<div class="otl otl-fig" data-study="sampling"><div class="otl-loading">Loading the recording…</div></div>

A raster frame reads every taxel. OpenTac-Xampling reads a budget of M taxels per frame: the taxels that triggered last frame, then a coarse-to-fine search pattern, then the neighbours of anything above threshold. A smaller M gives faster frames (measured on the 32 × 32 skin: 67 fps raster, 376 fps at M = 128, 954 fps at M = 32), but each frame sees less, and with a fixed budget a contact larger than M is never read whole. Here the firmware's fixed-budget selection is replayed on a raster recording, with each xampling frame reading the latest recorded frame at the rate measured for its M.

<p class="otl otl-note"><b>Shows:</b> which taxels the firmware reads, frame by frame. The selection is a port of the firmware's <code>ot_xampling.h</code>, checked to make identical choices on every frame of these replays, with its default settings (threshold 30 counts above each taxel's own noise, 30 reads reserved for search). <b>Does not show:</b> a live xampling recording. The contact is held between recorded frames (about 8 ms apart), the frame rates come from the 32 × 32 skin, and the noise is the raster recording's.</p>

---

<p class="otl otl-credit">Based on interactive studies by Krishna (TODO full name). The data behind these figures is generated by <code>scripts/learn/build_data.py</code> from the sensor manifests, the recordings and the firmware sources; <code>scripts/learn/check_xampling.py</code> and <code>check_transfer.py</code> compare the page's code with the firmware and with <code>opentac_transfer.py</code>.</p>

<script src="js/lib.js"></script>
<script src="js/bumpmodel.js"></script>
<script src="js/xampling.js"></script>
<script src="js/transfer.js"></script>
<script src="js/s1_anatomy.js"></script>
<script src="js/s2_bump.js"></script>
<script src="js/s3_field.js"></script>
<script src="js/s4_transfer.js"></script>
<script src="js/s5_sampling.js"></script>

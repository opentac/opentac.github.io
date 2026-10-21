---
description: Interactive explanations of piezoresistive readout, bump-mediated shear sensing, tactile fields, geometric transfer and adaptive acquisition, with model assumptions and recorded examples.
hide:
  - toc
---

# How it works

<link rel="stylesheet" href="learn.css">

These five interactive examples follow the tactile signal from a resistance change at one taxel to a spatial contact field, then examine how that field can be transferred and sampled. The sensor geometries come from real manifests. The first three examples use models to isolate sensing mechanisms; the last two use recorded contacts to examine geometric transfer and sampling. Each example states which quantities are measured and which are modelled.

## 1. Piezoresistive sensing and matrix readout { #1-how-does-a-press-become-a-number }

<div class="otl otl-fig" data-study="anatomy"><div class="otl-loading">Loading the sensor model…</div><noscript><p class="otl-loading">Enable JavaScript to use the interactive figures.</p></noscript></div>

The sensing stack consists of a flex PCB, a piezoresistive layer and a compliant contact layer. Each taxel has two interdigitated copper electrodes; in the illustrated geometry, the traces and gaps are both 0.2 mm wide. Pressure reduces the resistance of the material bridging the electrodes. The readout drives a row, selects a column through a multiplexer, and measures the resulting current with a transimpedance amplifier and 12-bit ADC.

A passive row-column matrix can also conduct through neighbouring pressed taxels. To suppress these unintended paths, the board holds unselected rows at the sensing amplifier's potential. In the figure, press three corners of a rectangle and toggle this constraint. Compare the reading at the unpressed fourth corner: with floating rows, it can show an apparent contact response.

<p class="otl otl-note"><b>Model and controls.</b> Inspect the stack, choose a taxel pitch and select individual layers. The electrode patterns use the footprint generator's geometry. The matrix illustrates resistive crosstalk; its counts are schematic. Layer thicknesses are exaggerated, and inter-taxel routing and amplifier gain are omitted.</p>

## 2. Normal and shear response beneath one bump { #2-how-do-four-taxels-under-one-bump-separate-normal-load-from-shear }

<div class="otl otl-fig" data-study="bump"><div class="otl-loading">Loading the bump model…</div></div>

A bump spans a 2 × 2 group of taxels. A centred normal load compresses the group approximately symmetrically. A tangential load tilts the bump, increasing pressure on one side and reducing it on the other. This converts shear into a differential normal response that the piezoresistive layer can measure.

Let z be a taxel's reading, and let u and v denote its side of the bump along x and y, with values ±1. Summing over the four taxels gives h<sub>z</sub> = Σ z; the signed sums h<sub>x</sub> = Σ u·z and h<sub>y</sub> = Σ v·z describe the differential response. These quantities are in ADC counts. Mapping them to force requires a model or calibration of the mechanical and electrical response.

Vary the normal and tangential loads, then offset a normal press from the bump centre. An off-centre normal load can produce a differential response similar to shear. Increasing the load also exposes two limits: one side may unload completely, or a taxel may saturate. In either case, information needed to recover the applied load is lost.

<p class="otl otl-note"><b>Model assumptions.</b> The geometry is a real 2 × 2 group from each manifest. Readings come from a lumped static bump model and fitted piezoresistive response profiles, including clipping and saturation. The displayed force estimates invert this model; they are not a measured force calibration. Bump stiffness and friction are omitted.</p>

## 3. Shear fields and twisting moments { #3-what-changes-when-a-contact-is-sheared-or-twisted }

<div class="otl otl-fig" data-study="field"><div class="otl-loading">Loading the tactile field model…</div></div>

Applying the same decoder to each bump produces a spatial shear field. Under uniform dragging, loaded bumps respond in a common tangential direction. Under twisting, their responses circulate around the contact centre. The net shear can then be small even when the twisting moment is substantial, because forces at opposite sides cancel while their moments add.

Compare the drag and twist presets, then move the contact toward the sensor boundary. Hollow circles mark bump groups truncated by the outline. A group cannot resolve shear along an axis if all its remaining taxels lie on the same side of that axis. The contact-width control specifies the Gaussian width σ in millimetres; the shear/normal ratio and twist amplitude scale tangential loading relative to the local normal load. Twist amplitude is dimensionless, rather than a rotation angle.

<p class="otl otl-note"><b>Model assumptions.</b> Layouts and bump groups come from manifests; the contact field is constructed. Normal loading follows a Gaussian distribution, and tangential loading is proportional to the local normal load. Shear is decoded from the resulting modelled counts. This example does not simulate slip, coupled deformation between bumps or a measured shear field.</p>

## 4. Transfer in physical coordinates { #4-why-does-moving-contact-between-skins-need-physical-coordinates }

<div class="otl otl-fig" data-study="transfer"><div class="otl-loading">Loading the recorded contacts…</div></div>

A tactile array index does not specify a physical distance: the same number of cells can span different areas on sensors with different pitches. A manifest provides each taxel's position and spatial extent, allowing a recorded contact to be resampled at its physical size. Compare this mapping with array resizing, which changes the contact's proportions to match the target array dimensions.

The example uses three objects pressed by hand onto three skins. At half of each recording's peak response, the Allen key's bar measured 10.3, 9.7 and 9.5 mm wide. Contact area was less consistent, varying by approximately 30–50% and remaining largest on the coarsest skin. Geometric transfer preserves coordinate scale, but cannot recover a boundary that was unresolved by the source taxels.

<p class="otl otl-note"><b>Data and mapping.</b> The recordings use a LEAP palm (4.2 mm pitch), quadruped foot (3.1 mm) and AgileX jaw (2.0 mm). The signal-level control selects a frame on the rising edge of each recording, relative to its peak summed response. Each source cell is divided into equal contributions and assigned to target taxels using the measured contact centre and principal axis. Contact area and extent use a threshold of 25% of each panel's peak. Two skins lack force calibration, so this example transfers counts as a proxy and normalises colour separately in each panel. It demonstrates geometric resampling, not calibrated force transfer. The freehand recordings also differ in force and pose.</p>

## 5. What an adaptive update observes { #5-what-does-a-partial-update-actually-observe }

<div class="otl otl-fig" data-study="sampling"><div class="otl-loading">Loading the sampling replay…</div></div>

Raster scanning reads every taxel in each frame. OpenTac-Xampling instead prioritises previously detected contact, searches the remaining region, and expands into neighbours whose readings exceed a threshold. In grow mode, M specifies the search budget; contact expansion can add reads beyond M, so detected contacts are sampled in full. The resulting update rate depends on both the search budget and the extent of detected contact.

Step through the replay and compare the sampled frame with the recorded raster frame. An unread taxel is unknown at that instant. Holding its last reading provides temporal continuity in the display, but that retained value is not a new measurement. Smaller budgets can increase the update rate while delaying discovery of a new contact; expansion improves coverage once contact is detected.

<p class="otl otl-note"><b>Replay assumptions.</b> The selection algorithm is a port of the firmware's <code>ot_xampling.h</code>, verified to make the same selections as the firmware on every frame of these replays. It uses a threshold of 30 counts above each taxel's noise and reserves 30 search reads before growth. Selection is replayed over raster recordings approximately 8 ms apart, with the contact held constant between recorded frames. Timing uses the measured 32 × 32-skin rates: 67 frames/s for raster, 376 at M = 128 and 954 at M = 32. These are reference rates for the replay, not measurements of live Xampling on the displayed skin. The replay uses a fixed period at each budget and does not add the hardware time required for contact expansion. It also cannot reveal changes faster than the underlying recording.</p>

<script src="js/lib.js"></script>
<script src="js/bumpmodel.js"></script>
<script src="js/xampling.js"></script>
<script src="js/transfer.js"></script>
<script src="js/s1_anatomy.js"></script>
<script src="js/s2_bump.js"></script>
<script src="js/s3_field.js"></script>
<script src="js/s4_transfer.js"></script>
<script src="js/s5_sampling.js"></script>

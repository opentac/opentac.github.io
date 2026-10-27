---
title: Paper
description: Abstract, authors, citation and related work for OpenTac.
---

# Paper

**OpenTac: An Open Ecosystem for Customizable, Scalable, and Transferable 3D Tactile Sensing**

<span class="ot-author">[Ariel Slepyan](https://arielslepyan.me/)<sup>1,2</sup></span>, <span class="ot-author">[Geeta Chandra Raju Bethala](https://bethalageetachandraraju.github.io/)<sup>1</sup></span>, <span class="ot-author">Jiafeng Gu<sup>1</sup></span>, <span class="ot-author">[Anagha Rajendra Dangle](https://anaghad01.github.io/)<sup>1</sup></span>, <span class="ot-author">[Yinzhe Zhou](https://stevenzhoooooooooooooou.github.io/)<sup>1</sup></span>, <span class="ot-author">Hongyuan Fu<sup>1</sup></span>, <span class="ot-author">Jade Sim<sup>1</sup></span>, <span class="ot-author">[Tuhin Basu](https://48tuhin-jpg.github.io/)<sup>1</sup></span>, <span class="ot-author">Xinyi Yin<sup>1</sup></span>, <span class="ot-author">[Md Faizal Karim](https://faizalkarim280280.github.io/)<sup>1</sup></span>, <span class="ot-author">[Gregory Hager](https://www.cs.jhu.edu/hager/)<sup>†1</sup></span>, <span class="ot-author">[Homanga Bharadhwaj](https://homangab.github.io/)<sup>†1</sup></span>, <span class="ot-author">[Anand Bhattad](https://anandbhattad.github.io/)<sup>†1</sup></span>, <span class="ot-author">[Krishna Murthy Jatavallabhula](https://krrish94.github.io/)<sup>†1</sup></span>, <span class="ot-author">[Nitish V. Thakor](https://neuroengineering.bme.jhu.edu/)<sup>†1</sup></span>

<small><sup>1</sup>&nbsp;Johns Hopkins University &nbsp;·&nbsp; <sup>2</sup>&nbsp;Massachusetts Institute of Technology &nbsp;·&nbsp; <sup>†</sup>&nbsp;Equal advising</small>

<small>Contact: <span class="ot-contact__person">Ariel Slepyan, <a href="mailto:aslepyan@mit.edu">aslepyan@mit.edu</a></span>; <span class="ot-contact__person">Nitish V. Thakor, <a href="mailto:nitish@jhu.edu">nitish@jhu.edu</a></span></small>

[Paper](https://arxiv.org/abs/2610.31661){ .md-button .md-button--primary } [Video](index.md#video){ .md-button } [Code](https://github.com/opentac/opentac){ .md-button }

## Abstract

We present OpenTac, a novel sensor and a full-stack ecosystem for tactile skins that are highly customizable, scalable, and readily deployed in downstream robot control and learning applications. Our core contribution is twofold. First, we develop a scalable resistive tactile skin with a structured deformable overlay that converts tangential loading into spatially varying pressure. Differential responses across neighboring &lsquo;taxels&rsquo; support decoding of local shear vectors, and the common-mode response provides normal-force information. Second, we provide a highly customizable sensor design tool that is able to automatically generate fabrication files for these tactile skins from 2D outlines and developable 3D surfaces, including from abstract descriptions such as text (e.g., &ldquo;*design a sensor for a size 9 shoe insole*&rdquo;). We develop an ecosystem around the OpenTac sensor, including the CAD design tool, a sensor simulator, cross-sensor transfer, and fast/adaptive data acquisition. We demonstrate the broad applicability of the OpenTac-CAD sensor design tool by designing and fabricating more than 30 sensors across a variety of robot embodiments. We characterize the three-dimensional tactile fields produced by OpenTac with a commercial, high-precision force/torque sensor. We demonstrate the broad applicability of 3D tactile sensing across contact-rich feedback control and manipulation policy learning on four real-world robot embodiments. Additionally, adaptive acquisition enables kilohertz-rate partial readouts, exceeding full-array raster scanning on the same sensor by 19.2&times; at 16 sampled taxels per update on a 1024-taxel skin.

<figure class="ot-fig" markdown="span">
  [![The OpenTac ecosystem: tactile skins on robot hands, grippers and feet; OpenTac-CAD turning a text request, a 2D drawing or a 3D model into Gerbers, a shear-bump case and a sensor manifest; OpenTac-Sim, Transfer and Xampling using the manifest; deployments on four robots.](assets/figures/overview.jpg){ loading=lazy }](assets/figures/overview.jpg)
  <figcaption>The OpenTac ecosystem. (A) Custom tactile skins for normal and shear sensing on robot hands, grippers, arms and feet. (B) OpenTac-CAD compiles a text description, 2D outline or 3D surface into a flex-PCB tactile sensor design, including the sensing layout, routing and shear-bump case. A shared sensor manifest connects the design to OpenTac-Sim, OpenTac-Transfer and OpenTac-Xampling. (C) Deployments on four robot platforms.</figcaption>
</figure>

## Citation

```bibtex
@misc{opentac2026,
  title         = {{OpenTac}: An Open Ecosystem for Customizable, Scalable, and Transferable {3D} Tactile Sensing},
  author        = {Slepyan, Ariel and Bethala, {Geeta Chandra Raju} and Gu, Jiafeng and Dangle, {Anagha Rajendra} and Zhou, Yinzhe and Fu, Hongyuan and Sim, Jade and Basu, Tuhin and Yin, Xinyi and Karim, {Md Faizal} and Hager, Gregory and Bharadhwaj, Homanga and Bhattad, Anand and Jatavallabhula, {Krishna Murthy} and Thakor, {Nitish V.}},
  year          = {2026},
  eprint        = {2610.31661},
  archivePrefix = {arXiv},
  primaryClass  = {cs.RO},
  doi           = {10.48550/arXiv.2610.31661},
  url           = {https://arxiv.org/abs/2610.31661}
}
```

## Related work { #background }

OpenTac relates to open tactile skins, to computational design tools for tactile sensors, and to adaptive readout methods for large tactile arrays.

**Tactile skins.**

- **FlexiTac** (B. Huang and Y. Li, *FlexiTac: A Low-Cost, Open-Source, Scalable Tactile Sensing Solution for Robotic Systems*, [arXiv:2604.28156](https://arxiv.org/abs/2604.28156), 2026; [project page](https://flexitac.github.io/)) is an open-source piezoresistive skin that estimates normal force. It comprises two flexible PCBs and a piezoresistive film sandwiched between them. Typical readout rates are around 100 Hz regardless of sparsity of contact. OpenTac measures both normal and shear forces due to our sensor design that places interdigitated row and column electrodes on a *single flexible PCB* beneath the film, so the load acts on the film directly, and adds bumps for shear sensing. More importantly, OpenTac-CAD provides design tools to automatically customize the sensor to any 2D or developable 3D surface. OpenTac-Xampling supports 1200 Hz+ readout rates that adapt based on the sparsity of contact, and this lets us capture contact events that occur at millisecond timescales.
- **TacGooseBumps (TacGB)** (W. Li, B. Yang, Y. Chen, A. Wang and M. Tomizuka, *TacGooseBumps (TacGB): Retrofitting Normal-Only Tactile Sensors with Shear Encoding for Learning Contact-Rich Manipulation*, [arXiv:2609.34006](https://arxiv.org/abs/2609.34006), 2026; [project page](https://jeffwli.github.io/tacgb/)) retrofits normal-only tactile sensors with a film of elastomeric domes (e.g., cabinet bumpers). Since the sensors are retrofitted, there isn't a precise mapping from each *dome* to its underlying taxels. Readout rates for TacGB still depend on those of the underlying sensors they customize. For OpenTac, the normal force sensor and bump strip are co-designed in OpenTac-CAD, ensuring sub-millimeter alignment. This enables cross-sensor transfer. Further, we support vibration and pose sensing in addition to normal and shear forces, and kilohertz-rate readouts for sparse contacts.

**Sensor design tools.**

- **GenTact** (C. Kohlbrenner, C. Escobedo, S. S. Bae, A. Dickhans and A. Roncone, *GenTact Toolbox: A Computational Design Pipeline to Procedurally Generate Context-Driven 3D Printed Whole-Body Artificial Skins*, ICRA 2025, [arXiv:2412.00711](https://arxiv.org/abs/2412.00711); C. Kohlbrenner, A. Soukhovei, C. Escobedo, N. Nechyporenko and A. Roncone, *Design, Mapping, and Contact Anticipation with 3D-printed Whole-Body Tactile and Proximity Sensors*, ICRA 2026, [arXiv:2603.04714](https://arxiv.org/abs/2603.04714); [project page](https://hiro-group.ronc.one/gentacttoolbox/websites/icra2026/icra2026.html)) generates 3D-printed capacitive skins for robot links. The reported arm carries 30 sensing points across six hand-wired units, read at about 100 Hz (15–30 Hz with the proximity sensing of GenTact-Prox).
- **Flex-Glove** (D. Murphy, Y. Li, C. E. Owens, L. Stanton, P. P. Liang, Y. Luo, A. Torralba and W. Matusik, *Fits like a Flex-Glove: Automatic Design of Personalized FPCB-Based Tactile Sensing Gloves*, CHI 2025 Extended Abstracts, [doi:10.1145/3706599.3720147](https://doi.org/10.1145/3706599.3720147)) generates hand-shaped flexible PCBs with a predefined 167-taxel layout from a photograph of the hand and measures normal pressure.
- **Capacitive touch sensing on 3D surfaces** (G. Palma, N. Pourjafarian, J. Steimle and P. Cignoni, *Capacitive Touch Sensing on General 3D Surfaces*, ACM Transactions on Graphics 43(4), 2024, [doi:10.1145/3658185](https://doi.org/10.1145/3658185); A. Ilic, J. Gao, Z. Li, Y. Jiang, R. Schuchert, M. Meier, P. Herholz and C. Holz, *Retrofitting Existing 3D Objects with Surface-Conforming Capacitive Sensing*, SIGGRAPH 2026 Conference Papers, [doi:10.1145/3799902.3811213](https://doi.org/10.1145/3799902.3811213)) places hand-wired mutual-capacitance electrode grids on 3D objects for touch localization at 10 Hz, with up to 450 intersections at about 7 mm spacing.

OpenTac-CAD generates a single flexible PCB with up to 1,024 taxels at down to 2 mm pitch, routes it to the readout board's connector with no hand wiring, and co-designs the bump strip for shear sensing.

**Adaptive readout.**

- **ACTS** (A. Slepyan, D. Li, A. Aug, S. Sankar, T. Tran and N. Thakor, *Adaptive Compressive Tactile Subsampling: Enabling High Spatiotemporal Resolution in Scalable Robotic Skin*, [arXiv:2410.13847](https://arxiv.org/abs/2410.13847)) samples a tactile array adaptively and reconstructs contact by sparse recovery.
- **ReLACS** (D. Poppert, A. Slepyan, N. Thakor and T. Tran, *ReLACS: Responsive Learned Adaptive Compressive Subsampling for Efficient Readout of Large-Area Tactile Skins*, [Data Compression Conference 2026](https://ieeexplore.ieee.org/abstract/document/11510445)) learns an adaptive sampling policy for the readout of large-area tactile skins.

Both are readout methods demonstrated on other sensor hardware. OpenTac-Xampling builds on ACTS and runs in the readout-board firmware on any OpenTac skin, configured from the skin's manifest.

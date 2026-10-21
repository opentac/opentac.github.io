---
title: Paper
description: Abstract, authors, citation and related work for OpenTac.
---

# Paper

**OpenTac: An Open Ecosystem for Customizable, Scalable, and Transferable 3D Tactile Sensing**

<span class="ot-author">[Ariel Slepyan](https://arielslepyan.me/)<sup>J, M</sup></span>, <span class="ot-author">[Geeta Chandra Raju Bethala](https://bethalageetachandraraju.github.io/)<sup>J</sup></span>, <span class="ot-author">Jiafeng Gu<sup>J</sup></span>, <span class="ot-author">[Anagha Rajendra Dangle](https://anaghad01.github.io/)<sup>J</sup></span>, <span class="ot-author">[Yinzhe Zhou](https://stevenzhoooooooooooooou.github.io/)<sup>J</sup></span>, <span class="ot-author">Hongyuan Fu<sup>J</sup></span>, <span class="ot-author">Jade Sim<sup>J</sup></span>, <span class="ot-author">[Tuhin Basu](https://48tuhin-jpg.github.io/)<sup>J</sup></span>, <span class="ot-author">Xinyi Yin<sup>J</sup></span>, <span class="ot-author">[Md Faizal Karim](https://faizalkarim280280.github.io/)<sup>J</sup></span>, <span class="ot-author">[Gregory Hager](https://www.cs.jhu.edu/hager/)<sup>J†</sup></span>, <span class="ot-author">[Homanga Bharadhwaj](https://homangab.github.io/)<sup>J†</sup></span>, <span class="ot-author">[Anand Bhattad](https://anandbhattad.github.io/)<sup>J†</sup></span>, <span class="ot-author">[Krishna Murthy Jatavallabhula](https://krrish94.github.io/)<sup>J†</sup></span>, <span class="ot-author">[Nitish V. Thakor](https://neuroengineering.bme.jhu.edu/)<sup>J†</sup></span>

<small><sup>J</sup>&nbsp;Johns Hopkins University &nbsp;·&nbsp; <sup>M</sup>&nbsp;Massachusetts Institute of Technology &nbsp;·&nbsp; <sup>†</sup>&nbsp;Equal advising</small>

<small>Contact: <span class="ot-contact__person">Ariel Slepyan, <a href="mailto:aslepyan@mit.edu">aslepyan@mit.edu</a></span>; <span class="ot-contact__person">Krishna Murthy Jatavallabhula, <a href="mailto:kmj@jhu.edu">kmj@jhu.edu</a></span>; <span class="ot-contact__person">Nitish V. Thakor, <a href="mailto:nitish@jhu.edu">nitish@jhu.edu</a></span></small>

[Video](index.md#video){ .md-button .md-button--primary } [Code](https://github.com/opentac/opentac){ .md-button }

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
  url           = {https://opentac.github.io/}
}
```

## Related work { #background }

OpenTac relates to open tactile skins and to adaptive readout methods for large tactile arrays.

**Tactile skins.**

- **FlexiTac** (B. Huang and Y. Li, *FlexiTac: A Low-Cost, Open-Source, Scalable Tactile Sensing Solution for Robotic Systems*, [arXiv:2604.28156](https://arxiv.org/abs/2604.28156), 2026; [project page](https://flexitac.github.io/)) is an open-source piezoresistive skin in which the piezoresistive film is laminated between two flexible PCBs carrying the row and column electrodes. Contact load reaches the film through the outer flexible PCB, which must deform for a signal to form, and the sensor estimates normal force only. OpenTac places interdigitated row and column electrodes on a single flexible PCB beneath the film, so the load acts on the film directly, and adds bumps for shear sensing.
- **TacGooseBumps (TacGB)** (W. Li, B. Yang, Y. Chen, A. Wang and M. Tomizuka, *TacGooseBumps (TacGB): Retrofitting Normal-Only Tactile Sensors with Shear Encoding for Learning Contact-Rich Manipulation*, [arXiv:2609.34006](https://arxiv.org/abs/2609.34006), 2026; [project page](https://jeffwli.github.io/tacgb/)) retrofits normal-only tactile sensors with a film of elastomeric domes. The domes are not aligned to the taxels: shear changes the recorded pressure pattern, and a learned policy uses that pattern directly, so shear is encoded in the signal but not recovered as a force. In OpenTac, OpenTac-CAD generates the bump sheet with the board, each bump sits over a known 2&times;2 group of taxels, and shear is decoded per bump from their differential response.

**Adaptive readout.**

- **ACTS** (A. Slepyan, D. Li, A. Aug, S. Sankar, T. Tran and N. Thakor, *Adaptive Compressive Tactile Subsampling: Enabling High Spatiotemporal Resolution in Scalable Robotic Skin*, [arXiv:2410.13847](https://arxiv.org/abs/2410.13847)) samples a tactile array adaptively and reconstructs contact by sparse recovery.
- **ReLACS** (D. Poppert, A. Slepyan, N. Thakor and T. Tran, *ReLACS: Responsive Learned Adaptive Compressive Subsampling for Efficient Readout of Large-Area Tactile Skins*, [Data Compression Conference 2026](https://ieeexplore.ieee.org/abstract/document/11510445)) learns an adaptive sampling policy for the readout of large-area tactile skins.

Both are readout methods demonstrated on other sensor hardware. OpenTac-Xampling builds on ACTS and runs in the readout-board firmware on any OpenTac skin, configured from the skin's manifest.

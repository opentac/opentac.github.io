---
title: Paper
description: The OpenTac paper, its abstract, and how to cite it.
---

# Paper

**OpenTac: An Open Ecosystem for Customizable, Scalable, and Transferable 3D Tactile Sensing**

<!-- AUTHORS TODO: author list and affiliations (the copy we have is the anonymous submission) -->
*Authors to be added.*

[Paper (arXiv)](#){ .md-button .md-button--primary } [Video](index.md#video){ .md-button } [Code](https://github.com/opentac/opentac.github.io){ .md-button }
<!-- TODO: replace "#" with the arXiv URL once the paper is posted -->

## Abstract

We present OpenTac, a novel sensor and a full-stack ecosystem for tactile skins that are highly customizable, scalable, and readily deployed in downstream robot control and learning applications. Our core contribution is twofold. First, we develop a scalable resistive tactile skin with a structured deformable overlay that converts tangential loading into spatially varying pressure. Differential responses across neighboring &lsquo;taxels&rsquo; support decoding of local shear vectors, and the common-mode response provides normal-force information. Second, we provide a highly customizable sensor design tool that is able to automatically generate fabrication files for these tactile skins from 2D outlines and developable 3D surfaces, including from abstract descriptions such as text (e.g., &ldquo;*design a sensor for a size 9 shoe insole*&rdquo;). We develop an ecosystem around the OpenTac sensor, including the CAD design tool, a sensor simulator, cross-sensor transfer, and fast/adaptive data acquisition. We demonstrate the broad applicability of the OpenTac-CAD sensor design tool by designing and fabricating more than 30 sensors across a variety of robot embodiments. We characterize the three-dimensional tactile fields produced by OpenTac with a commercial, high-precision force/torque sensor. We demonstrate the broad applicability of 3D tactile sensing across contact-rich feedback control and manipulation policy learning on four real-world robot embodiments. Additionally, adaptive acquisition enables kilohertz-rate partial readouts, exceeding full-array raster scanning on the same sensor by 19.2&times; at 16 sampled taxels per update on a 1024-taxel skin.

<figure class="ot-fig" markdown="span">
  ![The OpenTac ecosystem: tactile skins on robot hands, grippers and feet; OpenTac-CAD turning a text request, a 2D drawing or a 3D model into Gerbers, a shear-bump case and a sensor manifest; OpenTac-Sim, Transfer and Xampling using the manifest; deployments on four robots.](assets/figures/overview.jpg){ loading=lazy }
  <figcaption>The OpenTac ecosystem. (A) Custom normal-and-shear skins for robot hands, grippers, arms and feet. (B) OpenTac-CAD compiles a text description, 2D outline or 3D surface into a fabrication-ready flex-PCB tactile sensor, including the sensing layout, routing and shear-bump case. A shared sensor manifest connects the design to OpenTac-Sim, OpenTac-Transfer and OpenTac-Xampling. (C) Deployments on four robot platforms.</figcaption>
</figure>

## Citation

```bibtex
@misc{opentac2026,
  title         = {{OpenTac}: An Open Ecosystem for Customizable, Scalable, and Transferable {3D} Tactile Sensing},
  author        = {{The OpenTac authors}},
  year          = {2026},
  url           = {https://opentac.github.io/}
}
```
<!-- AUTHORS TODO: author list, and eprint + archivePrefix = {arXiv} once the arXiv version is up -->

## Background

OpenTac-Xampling builds on adaptive compressive tactile subsampling: A. Slepyan et al., *Adaptive compressive tactile subsampling: Enabling high spatiotemporal resolution in scalable robotic skin*, [arXiv:2410.13847](https://arxiv.org/abs/2410.13847), 2024.

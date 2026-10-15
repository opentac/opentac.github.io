---
title: Paper
description: The OpenTac paper, its abstract, and how to cite it.
---

# Paper

**OpenTac: Making Tactile Sensor Design Configurable for Robot Learning**

<!-- AUTHORS TODO: author list and affiliations (the copy we have is the anonymous submission) -->
*Authors to be added.*

[Paper (arXiv)](#){ .md-button .md-button--primary } [Video](index.md#video){ .md-button } [Code](https://github.com/opentac/opentac.github.io){ .md-button }
<!-- TODO: replace "#" with the arXiv URL once the paper is posted -->

## Abstract

Tactile observations depend on sensor geometry, material response, measured force components, and acquisition strategy, yet these choices are often fixed by the available hardware. We present OpenTac, an open design ecosystem that makes these choices configurable through a shared fabrication and readout pipeline. OpenTac-CAD compiles a 2D outline, 3D surface, or text request into a fabrication-ready flex-PCB-based tactile sensor and a machine-readable manifest shared by acquisition, simulation, and cross-sensor transfer tools. A structured overlay enables normal and shear sensing. We fabricated 31 functional sensors; five representative designs compile in 0.7&ndash;2.6&nbsp;s and cover 75&ndash;93% of their target regions. Material and taxel-pitch comparisons reveal changes in sensitivity, saturation, and spatial resolution. Adaptive readout on a 1024-taxel skin reaches 1286 partial frames/s versus 67 full frames/s, detecting brief impacts missed by raster scanning. Deployments on four robots demonstrate policy learning and contact-rich control. OpenTac enables researchers to vary tactile sensor design within a shared fabrication and acquisition pipeline.

<figure class="ot-fig" markdown="span">
  ![The OpenTac ecosystem: tactile skins on robot hands, grippers and feet; OpenTac-CAD turning a text request, a 2D drawing or a 3D model into Gerbers, a shear-bump case and a sensor manifest; OpenTac-Sim, Transfer and Xampling using the manifest; deployments on four robots.](assets/figures/overview.jpg){ loading=lazy }
  <figcaption>The OpenTac ecosystem. (A) Custom normal-and-shear skins for robot hands, grippers, arms and feet. (B) OpenTac-CAD compiles a text description, 2D outline or 3D surface into a fabrication-ready flex-PCB tactile sensor, including the sensing layout, routing and shear-bump case. A shared sensor manifest connects the design to OpenTac-Sim, OpenTac-Transfer and OpenTac-Xampling. (C) Deployments on four robot platforms.</figcaption>
</figure>

## Citation

```bibtex
@misc{opentac2026,
  title         = {{OpenTac}: Making Tactile Sensor Design Configurable for Robot Learning},
  author        = {TODO},
  year          = {2026},
  eprint        = {TODO},
  archivePrefix = {arXiv},
  url           = {https://opentac.github.io/}
}
```
<!-- AUTHORS TODO: fill author and eprint once the arXiv version is up -->

## Background

OpenTac-Xampling builds on adaptive compressive tactile subsampling: A. Slepyan et al., *Adaptive compressive tactile subsampling: Enabling high spatiotemporal resolution in scalable robotic skin*, [arXiv:2410.13847](https://arxiv.org/abs/2410.13847), 2024.

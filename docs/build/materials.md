---
title: Materials and accessories
description: Piezoresistive layers, printing materials, and the flat cables and extenders that fit the OpenTac readout boards.
---

# Materials and accessories

Besides the flex PCB and the readout board, a sensor needs a piezoresistive layer, a 3D-printed case, and sometimes a cable to put distance between the sensor and the board.

!!! info "As of October 2026"
    Part numbers below were checked on DigiKey and the makers' pages in October 2026. Generic equivalents work.

## Piezoresistive layer

The layer between the taxels and the lid is what turns pressure into a change in resistance. Its choice changes the sensor more than any other material: in the paper's load-cell tests, at 2.0&nbsp;mm pitch, LINQSTAT did not saturate through 60&nbsp;N, while Chibitronics Velostat saturated early ([Results](../results.md#material-and-spatial-response)).

| Material | What it is | Notes | Where |
|---|---|---|---|
| **LINQSTAT** | Velostat-like carbon-loaded polyethylene film | did not saturate through 60&nbsp;N in the paper's tests; used for the transfer experiments | [CAPLINQ conductive films](https://www.caplinq.com/conductive-plastic-films.html) <!-- TODO: exact LINQSTAT grade used in the paper (e.g. MVCF-4S50K / 8S50K?) --> |
| **Yunjia textile** | piezoresistive conductive fabric | one of the three materials in the paper's comparison; used in the build-guide sensor | <!-- TODO: product link from Arik --> |
| **Chibitronics Velostat** | pressure-sensitive conductive plastic sheet | saturated early in the paper's tests | [Chibitronics shop](https://shop.chibitronics.com/products/conductive-plastic-sheets-velostat-linqstat) |

Cut it with the fold template or the DXF from the export ([Cut the piezoresistive layer](assembly.md#cut-the-piezoresistive-layer)). One sheet covers many sensors.

## Printed parts

- **TPU filament, shore 85&ndash;95A**, for the case and the bump sheet. The bumps must be soft to tip under shear; a rigid plastic does not read shear. Any brand that your printer handles works. <!-- TODO: filament brand and print settings used for the paper's bump sheets (layer height, infill, speed) -->
- **Foam**, optional, as a compliant backing between the case and a rigid mount. <!-- TODO: foam type and thickness from Arik -->
- **Double-sided tape**, thin, to hold the flex PCB in the tray.

## Cables and extenders

The sensor's tail plugs straight into the readout board. When the board has to sit further away, add a flat flexible cable (FFC) jumper. Both readout boards use Molex 505110 connectors: 0.5&nbsp;mm pitch, bottom contact, for a 0.30&nbsp;mm thick cable end. Molex's Premo-Flex 15018 jumpers mate with them.

**Same side or opposite side.** A jumper has exposed contacts at both ends, on the same face (Molex "Type A", "same side contacts") or on opposite faces ("Type D", "opposite side contacts"). Because the 505110 contacts only the bottom of the cable, the contacts at each end must face the board that connector sits on:

- both connectors on the same face of a flat run: **Type A**;
- connectors on opposite faces, or one fold that flips the cable over: **Type D**;
- every 180&deg; fold flips which face is down, so count folds.

A jumper between two identical connectors facing each other also reverses the pin order end to end. <!-- CHECK: whether the firmware/manifest handles a reversed extension, or whether only "tail -> extender -> Type A jumper -> board" (pin order preserved) is supported -->

### Premo-Flex jumpers, 0.5 mm pitch

| Length | 60 conductors, Type A | 60 conductors, Type D | 30 conductors, Type A | 30 conductors, Type D |
|---|---|---|---|---|
| 51 mm | [0150180559](https://www.digikey.com/en/products/result?keywords=0150180559) | [0150180560](https://www.digikey.com/en/products/result?keywords=0150180560) | [0150180317](https://www.digikey.com/en/products/result?keywords=0150180317) | [0150180318](https://www.digikey.com/en/products/result?keywords=0150180318) |
| 102 mm | [0150180563](https://www.digikey.com/en/products/result?keywords=0150180563) | [0150180564](https://www.digikey.com/en/products/result?keywords=0150180564) | [0150180321](https://www.digikey.com/en/products/result?keywords=0150180321) | [0150180322](https://www.digikey.com/en/products/result?keywords=0150180322) |
| 152 mm | [0150180567](https://www.digikey.com/en/products/result?keywords=0150180567) | [0150180568](https://www.digikey.com/en/products/result?keywords=0150180568) | [0150180325](https://www.digikey.com/en/products/result?keywords=0150180325) | [0150180326](https://www.digikey.com/en/products/result?keywords=0150180326) |
| 305 mm | [0150180577](https://www.digikey.com/en/products/result?keywords=0150180577) | [0150180578](https://www.digikey.com/en/products/result?keywords=0150180578) | [0150180335](https://www.digikey.com/en/products/result?keywords=0150180335) | [0150180336](https://www.digikey.com/en/products/result?keywords=0150180336) |

Molex part numbers; the links search DigiKey. Molex's datasheet for 0150180568 states that it mates with the 505110-6091 on the 60-pin board.
<!-- TODO verify: Type A / Type D for each part number on its DigiKey page (confirmed directly only for 0150180568 = D); stock varies -->

### Extenders

To join a sensor's tail to a jumper, use an FFC extender: a small board with two ZIF connectors.

- **30 pins:** Adafruit 5204 (DigiKey 1528-5204-ND), for 0.3&nbsp;mm FPC and same-side (Type A) cables.
- **60 pins:** Adafruit's 60-pin version (5205) is discontinued, and DigiKey lists no other. <!-- TODO: OpenTac 60-to-60 and 30-to-30 extension boards (RELEASE_PLAN workstream L), if they ship -->

A run of *sensor tail &rarr; extender &rarr; Type A jumper &rarr; readout board* behaves like a longer tail: the extender and the jumper each reverse the pin order, and the two reversals cancel.

---
title: Order the readout board
description: Ordering an assembled OpenTac readout board from JLCPCB with the Gerber ZIP, BOM and placement file in hardware/. Option names as of October 2026.
---

# Order the readout board

The readout boards are ordered assembled (PCBA): the board house makes the PCB and solders the parts. Each board's `production/` folder in the repository has the three files JLCPCB needs. Which board to order: [Readout boards](../hardware.md).

!!! info "As of October 2026"
    Option names, prices and file names below are from October 2026. Check the [PCB assembly capabilities](https://jlcpcb.com/capabilities/pcb-assembly-capabilities) and [assembly price](https://jlcpcb.com/help/article/pcb-assembly-price) pages for current terms.

## The files

| Board | Folder | Gerber ZIP | BOM | Placement (CPL) |
|---|---|---|---|---|
| 60-pin | [`hardware/readout_60pin/production/`](https://github.com/opentac/opentac.github.io/tree/main/hardware/readout_60pin/production) | `stm-i2c-60-switch.zip` | `stm-i2c-60-switch_bom.csv` | `stm-i2c-60-switch_positions.csv` |
| 30-pin, top | [`hardware/readout_30pin/top/production/`](https://github.com/opentac/opentac.github.io/tree/main/hardware/readout_30pin/top/production) | `stm-i2c.zip` | `stm-i2c_bom.csv` | `stm-i2c_positions.csv` |
| 30-pin, bottom | [`hardware/readout_30pin/bottom/production/`](https://github.com/opentac/opentac.github.io/tree/main/hardware/readout_30pin/bottom/production) | `sensor_30.zip` | `sensor_30_bom.csv` | `sensor_30_positions.csv` |

<!-- CHECK: production file names after the assets port; update this table if they are renamed -->

The 30-pin version is two boards, so it is two PCBA orders (they can go in the same cart). Both orders include the 1.27&nbsp;mm headers that stack them.

The BOM lists every part with its LCSC number (the `LCSC Part #` column), which is how JLCPCB matches parts. The CPL gives each part's position, rotation and side.

## The order

1. On jlcpcb.com, start a quote and **Add gerber file** with the board's Gerber ZIP. Layers and size are read from the files: the 60-pin board and the 30-pin top board are 4-layer, the 30-pin bottom board is 2-layer, all 1.6&nbsp;mm FR-4.
2. Leave the PCB options at their defaults unless you have a reason to change them.
3. Turn on **PCB Assembly**.
    - **PCBA Type.** The 60-pin board has parts on one side only, so **Economic** works (cheaper, quicker; 2&ndash;50 boards). Both 30-pin boards have parts on both sides, which needs **Standard**.
    - **Tooling holes:** leave the default, which has JLCPCB add them. Don't pick "Added by Customer"; the boards have no tooling holes of their own.
4. Press **Confirm**, then upload the **BOM** and the **CPL** file (the `_positions.csv`) and press **Process BOM & CPL**.
5. **Check every line.** Each BOM line should show a matched part. A line marked as having no part selected needs a part: search by the LCSC number from the BOM. For a resistor or capacitor out of stock, a part of the same value, rating and package is fine. For a chip or connector, don't substitute; wait for stock or ask on the repository's issue tracker.
6. **Check the placement preview.** Look at the chips (pin-1 marks), the USB connector, the sensor connector and the LED. If a part sits rotated or off its pads, note it in the order or choose **Confirm Parts Placement** (an engineer checks placement before soldering; $0.45 in October 2026).
7. Add to cart.

## When the boards arrive

Plug the board into USB and [flash the firmware](../use/flash.md). A new board has no firmware, so the first flash needs the BOOT0 button held while plugging in; after that, the firmware can restart itself into the bootloader.
<!-- CHECK: first-flash procedure wording matches use/flash.md -->

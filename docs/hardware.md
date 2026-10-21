---
title: Readout boards
description: Architecture, interfaces and specifications of the 60-pin readout board and compact 30-pin pair.
---

# Readout boards

OpenTac provides two readout-board designs: a 60-pin board for sensors with up to 30 rows and 30 columns, and a compact 30-pin pair for up to 15 rows and 15 columns. Both use the same firmware codebase and USB interface, with the sensor-specific layout supplied through its manifest.

<div class="ot-boards">
<figure>
  <video data-loop muted loop playsinline preload="none" poster="../assets/boards/readout60_poster.jpg"
         aria-label="Turntable render of the 60-pin readout board">
    <source src="../assets/boards/readout60_spin.mp4" type="video/mp4">
  </video>
  <figcaption><strong>60-pin board.</strong> Up to 30&times;30 taxels; 37&nbsp;&times;&nbsp;34.3&nbsp;mm.</figcaption>
</figure>
<figure>
  <video data-loop muted loop playsinline preload="none" data-poster="../assets/boards/readout30_poster.jpg"
         aria-label="Turntable render of the stacked 30-pin readout boards">
    <source src="../assets/boards/readout30_spin.mp4" type="video/mp4">
  </video>
  <figcaption><strong>30-pin pair.</strong> Up to 15&times;15 taxels; two 16&nbsp;&times;&nbsp;22.8&nbsp;mm boards, stacked.</figcaption>
</figure>
</div>

Use the **60-pin board** for most sensors. Use the **30-pin pair** where space is tight, such as inside a finger or a small gripper. The limit is per direction: the 60-pin board takes up to 30 rows *and* 30 columns, the 30-pin pair up to 15 and 15.

## Firmware { #firmware }

| Board | Firmware |
|---|---|
| 60-pin board | `READOUT60` |
| 30-pin pair (two stacked boards) | `NODE16`, or `NODE16_bus` for each board in a daisy chain ([Daisy-chain boards](use/daisy-chain.md)) |
| Earlier 70-pin board | `READOUT32`, for boards already built |

Prebuilt binaries for all three are in [`firmware/prebuilt/`](https://github.com/opentac/opentac/tree/main/firmware/prebuilt); `opentac flash` picks the right one ([Flash the firmware](use/flash.md)).

## Readout architecture and interfaces { #what-the-boards-do }

<ol class="ot-features" markdown>
<li markdown>

**Zero-potential scanning suppresses crosstalk.** Each taxel is a resistive connection between a row and a column. In a passive matrix with floating, unselected rows, current can reach the measured column through other pressed taxels. The result is an apparent response at a location that was not pressed, often called ghosting.

The readout drives the selected row to the supply voltage and grounds the remaining rows. A multiplexer connects the selected column to an inverting amplifier whose non-inverting input is grounded, holding the measured column near virtual ground. The other taxels on that column therefore have approximately zero voltage across them and conduct negligible current. Current through other pressed taxels flows into the grounded rows rather than into the amplifier, so each reading reflects only the taxel at the driven row and selected column. The resistor-network animation below illustrates this mechanism.

<figure class="ot-clip">
<div class="ot-media ot-media--4x3">
  <video data-loop muted loop playsinline preload="none" data-poster="../assets/boards/zero_potential_poster.jpg"
         aria-label="Animation: a 4 by 4 sensor with three taxels pressed is scanned twice. With the other rows left open, current reaches the amplifier through the three pressed taxels and an unpressed taxel reads as pressed; with the other rows held at 0 V, that current drains into the grounded row and the unpressed taxel reads zero.">
    <source src="../assets/boards/zero_potential.mp4" type="video/mp4">
  </video>
</div>
<figcaption>Animation: a 4&nbsp;&times;&nbsp;4 sensor with three taxels pressed, read with the other rows left open, then held at 0&nbsp;V. The currents come from a resistor model of the grid, as in <a href="../learn/">How it works</a>.</figcaption>
</figure>

</li>
<li markdown>

**Inertial measurements.** Each board carries an ST LSM6DSV16BX inertial sensor. The firmware streams its accelerometer for vibration, at up to 1920&nbsp;Hz (960&nbsp;Hz by default), and its orientation as a quaternion computed on the chip by its own sensor-fusion block, at up to 480&nbsp;Hz (240&nbsp;Hz by default). On a gripper or a fingertip, that adds vibration and orientation alongside the tactile frames, from the same board.

<figure class="ot-clip">
<div class="ot-media ot-media--4x3">
  <video data-loop muted loop playsinline preload="none" data-poster="../assets/boards/imu_poster.jpg"
         aria-label="Recording from a gripper finger: a readout board turned by the quaternion from its IMU, the angle it has turned, the vibration from its accelerometer with gravity removed, and the tactile frame from the same board, as the gripper turns toward a can, grasps it while a hand moves the can, and turns back.">
    <source src="../assets/boards/imu.mp4" type="video/mp4">
  </video>
</div>
<figcaption>Recorded on a gripper finger turning toward a can and grasping it, at recorded speed: the board's orientation from its IMU's quaternion, the vibration its accelerometer picks up, and the tactile frame from the same board.</figcaption>
</figure>

</li>
<li markdown>

**Multiple sensors over an I2C bus.** Each board has two 4-pin JST-SH connectors (5&nbsp;V, GND, SCL, SDA). Chain several 30-pin boards with JST-SH cables and read them all through one controller, a Teensy 4.0, to cover a whole hand or several fingers from one USB port. See [Daisy-chain boards](use/daisy-chain.md). Chaining runs on the 30-pin boards; the 60-pin board has the connectors too, but the frame buffers for a 30&nbsp;&times;&nbsp;30 sensor do not fit in a chain node's memory.

<figure class="ot-clip">
<div class="ot-media ot-media--4x3">
  <video data-loop muted loop playsinline preload="none" data-poster="../assets/boards/daisy_chain_poster.jpg"
         aria-label="Illustration: close up, JST-SH cable plugs go into the sockets of stacked 30-pin readout boards; the view pulls back to three boards chained to a Teensy 4.0, whose USB cable runs to the computer, where opentac view shows one panel per board, and each board's LED lights in its panel's colour.">
    <source src="../assets/boards/daisy_chain.mp4" type="video/mp4">
  </video>
</div>
<figcaption>Illustration: three 30-pin pairs chained with JST-SH cables to a Teensy 4.0, the only board on USB. Each board's LED takes its panel's colour in <code>opentac view</code>.</figcaption>
</figure>

</li>
<li markdown>

**USB communication and firmware updates.** A micro-USB cable connects the board to the computer. It shows up as a serial port, with no adapter or programmer, and the same cable flashes new firmware ([Flash the firmware](use/flash.md)).

<figure class="ot-clip">
<div class="ot-media">
  <img src="../assets/boards/usb.jpg" width="1280" height="640" loading="lazy"
       alt="Render of the 60-pin readout board and the stacked 30-pin pair, each with a micro-USB cable plugged into the micro-USB socket at its edge.">
</div>
<figcaption>The 60-pin board and the 30-pin pair, each with a micro-USB cable plugged in.</figcaption>
</figure>

</li>
<li markdown>

**Board dimensions and component placement.** The 60-pin board is 37&nbsp;&times;&nbsp;34.3&nbsp;mm. The 30-pin version splits the circuit over two 16&nbsp;&times;&nbsp;22.8&nbsp;mm boards stacked on 1.27&nbsp;mm headers: the bottom board carries the sensor connector and the analog front end, the top board the microcontroller, IMU, USB and daisy-chain connectors.

<figure class="ot-fig" markdown="span">
  [![Exploded render of the 30-pin readout pair: the bottom board with the sensor connector and the top board with the microcontroller, separated above it.](assets/boards/readout30_exploded.png){ loading=lazy }](assets/boards/readout30_exploded.png)
  <figcaption>Exploded view of the 30-pin pair, showing the sensor interface below the controller board.</figcaption>
</figure>

</li>
</ol>

## Specifications

| | 60-pin board | 30-pin pair |
|---|---|---|
| Largest sensor | 30 rows &times; 30 columns | 15 rows &times; 15 columns |
| Size | 37 &times; 34.3 mm | two boards, 16 &times; 22.8 mm, stacked |
| Sensor connector | Molex 505110-6091, 60 positions, 0.5 mm pitch | Molex 505110-3091, 30 positions, 0.5 mm pitch |
| Connector pads | 1&ndash;30 rows, 31&ndash;60 columns | 1&ndash;15 columns, 16&ndash;30 rows |
| Microcontroller | STM32G431 | STM32G431 |
| Row drive | four 74HC595 shift registers | two 74HC595 shift registers |
| Column select | ADG732 (32:1) | ADG706 (16:1) |
| Gain | 16 settings: four feedback resistors switched in by a MAX14662 over I2C ([Gain](use/sensor.md#gain-60-pin-board)) | fixed |
| IMU | LSM6DSV16BX | LSM6DSV16BX |
| Computer link | micro-USB, serial | micro-USB, serial |
| Daisy chain | 2 &times; JST-SH 4-pin fitted (daisy-chaining runs on the 30-pin pair) | 2 &times; JST-SH 4-pin, I2C |
| Copper layers | 4 | 4 (top), 2 (bottom) |
| Files | [`hardware/readout_60pin/`](https://github.com/opentac/opentac/tree/main/hardware/readout_60pin) | [`hardware/readout_30pin/`](https://github.com/opentac/opentac/tree/main/hardware/readout_30pin) |

The connector is a bottom-contact ZIF type that takes a 0.30&nbsp;mm thick flex end, which is why the sensor's tail carries a [stiffener](build/order-sensor.md#stiffener).

## Files and ordering

Each board's folder in the repository ([`hardware/readout_60pin`](https://github.com/opentac/opentac/tree/main/hardware/readout_60pin), [`hardware/readout_30pin`](https://github.com/opentac/opentac/tree/main/hardware/readout_30pin)) has the KiCad project (schematic and layout) and a `production/` folder ready for JLCPCB assembly: a Gerber ZIP, a bill of materials with LCSC part numbers, and a placement (CPL) file. [Order the readout board](build/order-readout.md) walks through the order.

An earlier 70-pin board (READOUT32) is still supported by the firmware for boards already in use, but new designs use the 60-pin board or the 30-pin pair ([Firmware](#firmware)).

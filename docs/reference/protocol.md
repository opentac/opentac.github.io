---
description: USB serial records, commands, parameters, binary sensor configuration and bus-node addressing.
---

# Readout protocol

The readout board exposes a USB CDC serial interface; the nominal serial baud rate is ignored. Commands are text lines terminated by `\n`. Streaming records and command replies share the same connection, so a host must distinguish them by record type. The Python package implements this protocol in `opentac.device`; the specification below supports alternative host implementations.

## Records from the board

The first comma-separated field identifies the record type.

```
F,<frame>,<gen>,<mode>,<dt_us>,<dropped>,<N values>,<IMU>
X,<frame>,<gen>,<mode>,<dt_us>,<dropped>,<n>,<mask hex>,<n values>,<IMU>
V,<seq>,<ax>,<ay>,<az>
M,<gen>,<mode>,<tac_en>,<vib_en>,<ori_en>,<active>,<shear>
R,...
# ...
```

| Record | Meaning |
|---|---|
| `F` | a raster frame: one value per taxel, in manifest `pixels` order, 12-bit counts |
| `X` | an Xampling frame: only the `n` taxels read. `<mask hex>` is ceil(N/8) bytes; bit k of byte j marks taxel 8j+k (LSB first). Values follow in taxel order, as counts above the board's zero. |
| `V` | one accelerometer sample (mg), when `VIB_ENABLE` is 1 |
| `M` | status, once a second and on any change |
| `R` | a reply to a command |
| `#` | Human-readable diagnostic message |

`<IMU>` is 13 fields: accelerometer (mg, 3), gyroscope (mdps, 3), quaternion
(w, x, y, z) and Euler angles (roll, pitch, yaw, degrees). `<gen>` counts
accepted setting changes since boot; if it goes down, the board restarted and
its session settings are back at their defaults. `<mode>` is the `TAC_MODE`
that made the frame. `<dt_us>` is the time since the previous frame.

A board with no sensor set up sends no `F` or `X` records.

## Commands

| Command | Reply | Operation |
|---|---|---|
| `?` | `R,CAPS,...`, one `R,PARAM` per parameter, `R,END` | capabilities and the parameter table |
| `p <id> <value>` | `R,PARAM,<id>,<name>,<lo>,<hi>,<value>` | set a parameter; the reply gives the value stored (clamped to range) |
| `P [id]` | `R,PARAM,...` (all: then `R,END`) | read one parameter, or all |
| `G` | `R,CFG,...` or `R,NOCFG` | the stored sensor config |
| `S<len>` | `R,OK,S,<len>` | start sending a config of `len` bytes; scanning pauses |
| `D<offset>,<hex>` | `R,OK,D,<offset>,<n>` | config bytes at an offset (`opentac` sends 64 per line) |
| `E` | `R,CFG,...` | check the config, write it to flash, resume |
| `A` | `R,OK,A` | abandon a config being sent |
| `X` | `R,OK,X` | erase the stored config |
| `Z` | `R,OK,Z,<frames>,<zero mean>,<zero max>,<noise median>,<noise max>,<noisy>` | measure the xampling zero; nothing may touch the sensor |
| `t` / `z` | `R,STAT,<frames>,<vib dropped>,<scan us max>,<loop us max>,<gen>` / `R,OK,Z` | statistics / reset them |
| `c <r> <g> <b>` | `R,OK,C` | LED colour, in `LED_MODE` manual |
| `B` | `R,OK,B` | reboot into the STM32 USB bootloader (DFU) for flashing |

A rejected command returns `R,ERR,<reason>`. Reasons include `NOBASE`
(xampling before `Z`), `NOCFG` (no sensor set up), `NOTIMPL` (mode not
implemented), `GAIN` (gain switch did not answer), `NOPARAM`, `SYNTAX`, and
`FLASH,<stage>,<hal error>,<FLASH->SR>,<address>,<chip id>,<flash KB>`.
Match replies to commands by content, not by count: some commands answer with
more than one line.

`R,CAPS,<api>,<steps>,<channels>,<max taxels>,<modes hex>,<LED modes hex>,<params>,<modes needing shear hex>,<board>`.
`<board>` is `READOUT60`, `NODE16` or `READOUT32`; the host picks that
board's pad table from it.

`R,CFG,<version>,<rows>,<cols>,<active>,<pitch x um>,<pitch y um>,<shear>,<id hex>,<crc hex>,<bytes>`.
`<id>` is the CRC-32 of the manifest file the config was made from.

## Parameters

These parameters are session settings and return to their firmware defaults after a restart. The OpenTac host library overrides some defaults when opening a session, as indicated below.

| id | Name | Range | Default |
|---|---|---|---|
| 2 | `TAC_MODE` | 0 raster, 1 xamp_fixed, 2 xamp_grow | 0 |
| 3 | `LED_MODE` | 0 off, 1 manual, 3 heartbeat, 4 sensor | 3 |
| 4 | `LED_BRIGHT` | 0..255 | 255 |
| 5 | `ROW_SETTLE_US` | 1..50 | 2 |
| 6 | `MUX_SETTLE_US` | 1..50 | 1 (`opentac` sets 8) |
| 7 | `TAC_ENABLE` | 0/1 | 1 |
| 8 | `VIB_ENABLE` | 0/1 | 1 (0 on a bus node; `opentac` sets 0) |
| 9 | `ORIENT_ENABLE` | 0/1 | 1 (0 on a bus node; `opentac` sets 0) |
| 19 | `LED_RATE_HZ` | 1..100 | 1 |
| 24 | `FRAME_MAX_HZ` | 0..1000, 0 = free-running | 0 |
| 25 | `VIB_ODR_HZ` | 15..1920 | 960 |
| 26 | `ORIENT_ODR_HZ` | 15..480 | 240 |
| 27 | `ACC_FS_G` | 2, 4, 8, 16 | 4 |
| 28 | `GYRO_FS_DPS` | 125..4000 | 2000 |
| 29 | `XAMP_M` | 1..1024 | 128 |
| 30 | `XAMP_THRESH` | 1..4095 | 30 |
| 31 | `XAMP_SEARCH_MIN` | 0..1024 | 30 |
| 32 | `XAMP_ZERO_FRAMES` | 16..1024 | 64 |
| 33 | `XAMP_BUMP_FILL` | 0/1 | 0 |
| 34 | `XAMP_CONFIRM_US` | 0..500 | 50 |
| 35 | `GAIN_SW` | 0..15, 60-pin board only | 0 |

`GAIN_SW` bit k closes switch k+1 of the MAX14662 gain switch (I²C 0x4C,
register 0x00). Each switch puts a resistor across the 10 kΩ feedback
resistor: 4.7 kΩ, 1.1 kΩ, 270 Ω, 68 Ω.

## Binary sensor configuration { #the-sensor-config }

The `S`/`D`/`E` transaction uploads the following little-endian structure, defined in
`firmware/opentac_readout/ot_devcfg.h`:

| Offset | Size | Field |
|---|---|---|
| 0 | 4 | magic `OTC1` |
| 4 | 2 | version (2) |
| 6 | 1 | rows |
| 7 | 1 | columns |
| 8 | 4 | pitch x, µm |
| 12 | 4 | pitch y, µm |
| 16 | 2 | active taxels |
| 18 | 2 | shear entries (0, or = active taxels) |
| 20 | 4 | config id: CRC-32 of the manifest file |
| 24 | 4 | payload length |
| 28 | | row lines, column lines, row grid positions, column grid positions (1 byte each), the taxel mask (1 bit per row x column, LSB first), shear groups (2 bytes per taxel, 0xFFFF = none) |
| end | 4 | CRC-32 of everything before it |

A line is 0-31 for a shift-register step (driven) or 32-63 for mux channel
line-32 (read). The board validates the configuration before erasing flash;
a rejected configuration leaves the existing one intact.

## Bus controller

The Teensy bus controller speaks the same commands, addressed to a board:

| Line | Operation |
|---|---|
| `@<n> <command>` | send a command to node n |
| `N` | list nodes: `R,NODES,<count>`, `R,NODE,<n>,<addr>,<uid>,<board>,<online>`, `R,END` |
| `?` | `R,MCAPS,<bus version>,<max nodes>,<bus hz>`, `R,END` |

Lines from node n come back as `<n>|<line>`, and frames as
`<n>,<t_us>|F,...` with `t_us` on the controller's clock, shared by every node.
`J,<n>,<uid>,<board>,<how>` reports a node joining, `L,<n>` one lost.

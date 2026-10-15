# Flash the firmware

A readout board runs one firmware, built for that board:

| Board | Firmware | File |
|---|---|---|
| 60-pin board | `READOUT60` | `firmware/prebuilt/READOUT60.bin` |
| 30-pin board | `NODE16` | `firmware/prebuilt/NODE16.bin` |
| 30-pin board in a daisy chain | `NODE16` bus node | `firmware/prebuilt/NODE16_bus.bin` ([daisy chain](daisy-chain.md)) |

Flashing goes over the board's own USB cable. You do not need the BOOT0 button:
the running firmware reboots into the STM32's built-in bootloader (DFU) when it
receives the line `B`. The sensor the board holds survives a reflash.

There are three ways to flash. The first is the simplest.

## 1. Prebuilt firmware with `opentac flash`

Install one flashing tool:

- **dfu-util**: `brew install dfu-util` (macOS) or `sudo apt install dfu-util` (Linux).
- or **STM32CubeProgrammer**, from st.com. Use this on Windows.

Plug the board in by USB, then:

```sh
uv run opentac flash
```

It asks the board which board it is, reboots it into the bootloader, and
writes the matching file from `firmware/prebuilt/`. To see what it would do
without changing anything:

```sh
uv run opentac flash --dry-run
```

If the board has no firmware, or does not answer, name the board:

```sh
uv run opentac flash --board readout60     # or node16
```

**If the board never appears in the bootloader:** unplug it, hold the BOOT0
button while plugging it back in, release it, and run the command again with
`--board`.

dfu-util may print `Error during download get_status` after
`Submitting leave request`. This is harmless: the firmware is written and the
board has restarted.

## 2. Arduino IDE

One-time installs:

1. Arduino IDE 2.
2. In *Settings*, add this to *Additional boards manager URLs*:
   `https://github.com/stm32duino/BoardManagerFiles/raw/main/package_stmicroelectronics_index.json`
3. *Boards Manager*: install **STM32 MCU based boards**, version **2.7.1**.
4. *Library Manager*: install **STM32duino LSM6DSV16BX** (1.0.0) and
   **Adafruit NeoPixel** (1.15.5).
5. **STM32CubeProgrammer** from st.com. The IDE uploads with it.

To flash:

1. Open `firmware/opentac_readout/opentac_readout.ino`.
2. At the top of the file, delete the `//` in front of your board's line, for
   example `#define OT_BOARD_READOUT60`.
3. In the *Tools* menu set:
    - Board: **Generic STM32G4 series**
    - Board part number: **Generic G431KBUx**
    - U(S)ART support: **Enabled (generic 'Serial')**
    - USB support: **CDC (generic 'Serial' supersede U(S)ART)**
    - USB speed: **Low/Full Speed**
    - Upload method: **STM32CubeProgrammer (DFU)**
4. Open the *Serial Monitor*, set the line ending to **Newline**, type `B` and
   send it. The board's port disappears; that is expected.
5. Click *Upload*.

## 3. arduino-cli

One-time installs (arduino-cli 1.x):

```sh
arduino-cli config add board_manager.additional_urls https://github.com/stm32duino/BoardManagerFiles/raw/main/package_stmicroelectronics_index.json
arduino-cli core update-index
arduino-cli core install STMicroelectronics:stm32@2.7.1
```

Build every board's firmware into `firmware/build/`:

```sh
firmware/build.sh              # every target
firmware/build.sh readout60    # one: readout60, node16, node16_bus, bus_controller
```

`build.sh` installs the two Arduino libraries into `firmware/build/arduino/`
on its first run, so it does not touch your own sketchbook. Its output is
byte-for-byte the same as the files in `firmware/prebuilt/`
(`firmware/prebuilt/SHA256SUMS`).

To compile one board yourself, install the libraries once, then choose the
board with a compiler flag passed as `build.extra_flags`:

```sh
arduino-cli lib install "STM32duino LSM6DSV16BX@1.0.0" "Adafruit NeoPixel@1.15.5"
arduino-cli compile \
  --fqbn 'STMicroelectronics:stm32:GenG4:pnum=GENERIC_G431KBUX,usb=CDCgen,xusb=FS,xserial=generic' \
  --build-property 'build.extra_flags=-DOT_BOARD_READOUT60' \
  --output-dir firmware/build/manual firmware/opentac_readout
```

That writes `firmware/build/manual/opentac_readout.ino.bin`. Then flash a
binary, for example the one `build.sh` made:

```sh
uv run opentac flash --bin firmware/build/READOUT60.bin
```

or by hand, after sending `B` to the board:

```sh
dfu-util -a 0 -d 0483:df11 -s 0x08000000:leave -D firmware/build/READOUT60.bin
```

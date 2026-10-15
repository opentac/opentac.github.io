---
title: Get started
description: Try OpenTac CAD online, or clone the repository and run everything on your own computer.
---

# Get started

OpenTac is one repository: the CAD tool, the readout firmware and Python package, the readout-board hardware files and this website. Most people clone it and run it locally. The hosted version is there to try the CAD tool without installing anything.

## Try it online

Open [OpenTac CAD](../cad/){ .md-button .md-button--primary } in your browser. You can draw an outline, import a DXF or STL, generate a board and download the files.

The online tool runs its design engine on a free server that sleeps when idle, so the first **Generate** of the day can take up to a minute while it wakes. Locally, a design generates in a second or two and your files never leave your computer.

## Run it on your computer

You need [git](https://git-scm.com/downloads) (or download the repository as a ZIP from GitHub) and nothing else: the start script installs [uv](https://docs.astral.sh/uv/), a small Python installer, if you don't have it.

1. Get the code:

    ```bash
    git clone https://github.com/opentac/opentac.github.io opentac
    ```

2. Open the `opentac` folder and double-click the start script:

    | System | File |
    |---|---|
    | macOS | `Start_OpenTac.command` |
    | Windows | `Start_OpenTac.bat` |
    | Linux | run `bash Start_OpenTac.command` in a terminal |

3. The first run downloads what the tool needs into the folder's own environment (a few minutes, once). After that it starts in seconds and opens OpenTac CAD in your browser.

!!! note "If macOS blocks the double-click"
    Open Terminal, type `bash ` (with a trailing space), drag `Start_OpenTac.command` onto the window and press Enter.

From a terminal the same thing is one command, run in the repository folder:

```bash
uv run opentac cad
```

## Design with an AI agent

The repository includes a skill that teaches a coding agent to design sensors with the same compiler the CAD tool uses. [Claude Code](https://claude.com/claude-code) loads it automatically from `.claude/skills/opentac/` when you start it in the repository folder; other agents read [`AGENTS.md`](https://github.com/opentac/opentac.github.io/blob/main/AGENTS.md), which points them to the same instructions. Describe the sensor in your own words, with its size, shape and where the cable should leave. See [Design with an AI agent](design/agent.md).

## From a design to live readings

The whole path, with a page for each step:

1. **Design** the sensor in [OpenTac CAD](design/index.md) and download the ZIP.
2. **Print the 1:1 PDF** from the ZIP and hold it against the part to check the fit (see [Assembly](build/assembly.md#check-the-fit-on-paper)).
3. **Order** the [flex PCB](build/order-sensor.md) and, if you don't have one, a [readout board](build/order-readout.md).
4. **Gather** the [materials](build/materials.md): a piezoresistive film or fabric, TPU filament, a USB cable.
5. **Print the case**, cut the film, and [assemble](build/assembly.md).
6. **Flash** the readout board, **set it up** once with your design, and **view** the live map:

    ```bash
    uv run opentac flash                  # put firmware on the readout board
    uv run opentac setup my_design.zip    # tell the board which sensor is plugged in (once)
    uv run opentac view                   # live heatmap
    ```

    These are covered in [Flash the firmware](use/flash.md) and [Read a sensor](use/sensor.md).

## What you need on the bench

- the flex PCB from your design, as ordered;
- a readout board: the 60-pin board for sensors up to 30&times;30 taxels, or the 30-pin pair for up to 15&times;15 (see [Readout boards](hardware.md));
- a piezoresistive layer, such as LINQSTAT film or a piezoresistive textile (see [Materials](build/materials.md));
- a 3D printer and TPU filament (85&ndash;95A) for the case and bump sheet;
- double-sided tape, scissors, printer paper;
- a USB cable for the readout board.

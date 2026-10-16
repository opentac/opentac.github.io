---
title: Design a sensor
description: How OpenTac-CAD turns an outline or a surface into a routed flex PCB, a printed case and a manifest, and which settings matter.
---

# Design a sensor

OpenTac-CAD turns a shape into a sensor you can order. It packs taxels (sensing spots) into the shape, routes every row and column to a flat-cable connector, checks the result against design rules, and writes the fabrication files, a printed case and the sensor's manifest. The same tool runs [online](../cad/) and [on your computer](../get-started.md#run-it-on-your-computer).

<div class="ot-media" style="margin: 1.2em 0 1.6em">
  <video data-loop muted loop playsinline preload="none" poster="../../assets/loops/cad_demo.jpg"
         aria-label="Screen recording: load a gripper finger, select its contact surface, set the cable edge and taxel size, generate the board and case, export">
    <source src="../../assets/loops/cad_demo.mp4" type="video/mp4">
  </video>
</div>

## Online or local

| | Online, at `/cad/` | On your computer |
|---|---|---|
| Install | nothing | clone, then double-click `Start_OpenTac` ([Get started](../get-started.md)) |
| Speed | the free server sleeps; the first Generate of the day can take a minute | a second or two per design |
| Your files | sent to the server to generate | stay on your computer |
| Design from a sentence | **Describe** tab (a hosted chat assistant) | your own coding agent with the [OpenTac skill](agent.md) |

Both run the same code; a design saved in one opens in the other.

## Five ways to start

**Draw.** Sketch the outline with line, rectangle and arc tools. Select an edge or a vertex to type an exact length and angle, as in a CAD program.

**Import a DXF.** Upload a closed 2D outline from AutoCAD, Fusion, Onshape or similar. The tool takes the largest closed shape in the file and reads its units.

**Import an STL.** Upload a 3D model of the part, select the surface the sensor should cover, and unfold it flat at true scale. See [Shapes and surfaces](shapes.md) for which surfaces can be covered.

**Open a saved design.** Every download contains `design.json`; open the ZIP again (no need to unzip) and the board comes back as you left it, hand-moved routes included.

**Describe it.** The **Describe** tab takes a sentence ("an insole for a size 9 shoe, cable at the heel") and a chat assistant designs the board with the same generator, then loads it into the editor. See [Design with an AI agent](agent.md).

The robot gallery on the start screen has surfaces of real grippers, hands and feet already unfolded, and finished example designs to start from.

## The settings that matter

**Cable edge.** The edge where the flex tail leaves the sensor to plug into the readout board. Generate stays blocked until you set it, so a stray stroke never becomes the connector edge. Pick a straight edge at least as wide as the connector, on the side where the cable can run.

**Tail.** The tail is cut down to the traces it carries and widens back to the connector's width just before the connector, with rounded corners where it leaves the board. It is narrowed after routing, so it never costs a taxel. **Tail length** sets how far the connector sits from the board; a tail too short to narrow and widen again stays as wide as the connector.

**Taxel size and pitch.** The default is 4&nbsp;mm taxels on a 4.2&nbsp;mm pitch. Smaller pitch gives finer spatial resolution and more taxels; larger pitch gives more signal per taxel (see [Results](../results.md#material-and-spatial-response)). Width and height are set independently, so an elongated shape can have elongated taxels. Keep both above 1.5&nbsp;mm. You can instead give the rows and columns you want and let the tool solve the taxel size (grow mode only).

**Readout board.** Every row and every column is one wire to the connector. The 60-pin readout board reads up to 30 rows and 30 columns; the 30-pin board up to 15 and 15. The limit is per direction: a 20&times;10 sensor has 30 wires but does not fit the 30-pin board. Choose under **Board sizing &rarr; Readout board**:

- *picked automatically* (the default): the 30-pin board when the grid fits 15&times;15, otherwise the 60-pin board;
- *30-pin board*, or *60-pin board*, to match a board you already have.

The sensor's connector follows the choice: 30 or 60 positions at 0.5&nbsp;mm pitch, wired to match that board's pads. See [Readout boards](../hardware.md).

### Grow the board, or keep the outline fixed

| | Grow board to fit wiring (default) | Keep outline fixed, shrink sensor grid |
|---|---|---|
| Board edge | grows outward until every wire fits, then is shrink-wrapped about 2&nbsp;mm around the copper | exactly the shape you drew |
| Taxels | packed at full density inside your shape; none dropped for wiring | only where a wiring band just inside the edge leaves room |
| Use when | the shape is a starting point | the board must fit something real: a recess, a lid, a shoe |

Either way the result is checked for clearances, crossings and copper outside the edge. Print the 1:1 PDF to see the real edge before ordering.

### Two or four copper layers

On **2 layers**, columns run on the top copper and rows on the bottom, and every wire travels around the outside of the sensor field to the connector, so the board needs a wiring band around the field.

On **4 layers**, rows are wired on two inner layers instead: one carries each row straight through the field to the connector, the other joins rows that a notch in the outline cuts in two. Rows then need no band, so a fixed outline keeps more of its area for taxels. That matters on small, complex parts such as fingertips. A 4-layer flex costs more to fabricate.

## The printed case

Tick **Add a printed case** after generating. The case is two TPU parts cut from the board's own outline: a bottom tray with a pocket for the flex and the piezoresistive layer, and a lid held on by a rib around the edge, with no glue or screws. The lid comes in three versions:

- **Flat**: normal force only.
- **Hatched**: grooves or cuts between taxels, so a press stays where it lands instead of spreading to neighbours.
- **Shear-sensing bumps**: one bump over each 2&times;2 group of taxels. A sideways push tips the bump and loads its four taxels unequally, which is how the sensor reads shear.

The case and the board come from the same design, so each bump seats over its group when the lid goes on, with nothing to align by hand ([The printed case](../build/index.md#the-printed-case)). Print it soft (TPU around 85&ndash;95A); a rigid lid does not tip and does not read shear. The case fits one exact board, so pressing Generate again clears it on purpose.

You do not have to open the case panel to get a case: **Download ZIP** puts the bottom and all three lids in the ZIP's `case/` folder, built with the panel's settings (or its defaults). See [What the export contains](export.md).

## Before you order

1. Give the design a **name** in the download bar before generating: it is printed on the board.
2. Check that the design-rule check reports no violations.
3. Download the **printable PDF**, print it at 100% (measure the 100&nbsp;mm ruler), cut it out and hold it against the part. This catches a wrong outline before you pay for boards.
4. Download the **ZIP**. [What the export contains](export.md) lists every file; [Order the sensor](../build/order-sensor.md) covers the board order.

Then follow the [assembly guide](../build/assembly.md): it takes the ordered board, the printed case and the piezoresistive layer to a sensor showing live readings.

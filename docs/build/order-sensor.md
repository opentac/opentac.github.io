---
title: Order the sensor
description: Ordering the OpenTac sensor as a flex PCB from JLCPCB, with a polyimide stiffener on the connector end. Option names as of October 2026.
---

# Order the sensor (flex PCB)

The sensor is a flex PCB: polyimide about 0.1&nbsp;mm thick, so it bends around the part. Any board house that makes flex PCBs can build it from the Gerbers. This page walks through an order at [JLCPCB](https://jlcpcb.com/), which made the boards in the paper.

!!! info "As of October 2026"
    Option names and values below are from JLCPCB's quote form and capability pages in October 2026. Board houses change their forms; if something looks different, the [flex PCB capabilities page](https://jlcpcb.com/capabilities/flex-pcb-capabilities) is the reference.

## Before you upload

1. **Check the fit on paper first.** Print `printable_1to1.pdf` from the export at 100% and hold it against the part ([how](assembly.md#check-the-fit-on-paper)).
2. **Zip the `gerber/` folder** from the export on its own. That ZIP is what you upload.
3. **Look at the Gerbers** in a viewer (JLCPCB's own viewer after upload, or [KiCad's Gerber viewer](https://www.kicad.org/)). Check the outline, the tail, and the connector end with its stiffener outline.

<div class="ot-photos ot-photos--two ot-photos--contain" markdown>
<figure markdown="span">
  ![The fabricated flex PCB as delivered: yellow polyimide with a gold taxel grid, wires along the tail, and a darker stiffener on the connector end.](../assets/photos/steps/flex-pcb-delivered.jpg){ loading=lazy }
  <figcaption>A board as delivered, stiffener on the connector end.</figcaption>
</figure>
<figure markdown="span">
  ![Gerber view of a sensor: front copper red, back copper blue, cut line black, and the stiffener outline in amber over the connector contacts.](../assets/photos/steps/order-board-files.png){ loading=lazy }
  <figcaption>Its files: front copper red, back copper blue, outline black, stiffener outline amber.</figcaption>
</figure>
</div>

## The order form

On jlcpcb.com, start a quote and **Add gerber file** with your ZIP. The board size is read from the outline. Then set:

| Option | Choose | Why |
|---|---|---|
| Base Material | **Flex** | the sensor is a flex PCB |
| Layers | **2**, or **4** for a design made with 4 copper layers | must match the design |
| PCB Qty | 5 (the minimum) or more | |
| Substrate type | **25&micro;m dielectric thickness** <!-- TODO verify: exact on-screen label --> | the thinner, more flexible base |
| FPC Thickness | **0.11 mm** for 2 layers; for 4 layers the thinnest offered (0.2 mm) <!-- TODO verify: 4-layer choice on our 4L orders --> | the sensor is meant to be thin |
| Coverlay Color | **Yellow** (JLC's recommendation) or Black | cosmetic |
| Silkscreen | White | |
| Surface Finish | **ENIG**, 1u" | gold on the taxel electrodes and connector fingers |
| Copper weight | leave the default <!-- TODO verify: copper weight used for the paper's boards --> | |
| Stiffener | **Polyimide**, see below | the connector needs a 0.3 mm thick end |
| EMI Shielding Film | none | |
| Cutting Method | laser cutting (the default) | |
| Delivery Format | Single PCB | |

### Stiffener { #stiffener }

The readout boards use a Molex 505110 ZIF connector: a bottom-contact connector that takes a flex end **0.30&nbsp;mm** thick (&plusmn;0.05&nbsp;mm). The sensor tail's contacts are on its **bottom** copper; the export opens the solder mask there, at the connector fingers only, and leaves the top covered. A bare 2-layer flex is much thinner than 0.3&nbsp;mm, so the connector end gets a polyimide (PI) stiffener on the **top** of the tail (the taxel side), opposite the contacts.

The export already describes it:

- `board-User_Drawings.gbr` draws the stiffener outline: 6&nbsp;mm deep and as wide as the connector end (31.6&nbsp;mm for the 60-pin connector, 16.6&nbsp;mm for the 30-pin).
- `board-User_Comments.gbr` carries the note, for example `31.6x6 PI stiffener on TOP (taxel side), T = 0.3 total, contacts on BOTTOM`.

JLCPCB does not read these layers automatically, so also set the options by hand:

- **Stiffener: Polyimide, on the top side** over the connector area. JLC offers PI in 0.1, 0.15, 0.20, 0.225 and 0.25&nbsp;mm.
- **The total thickness at the connector fingers: 0.3&nbsp;mm.** If the form asks whether the board has gold fingers, answer yes and enter 0.3&nbsp;mm as the finger-area thickness. <!-- TODO verify: exact label of the gold-finger thickness field -->
- **Pick the PI thickness that gives 0.3&nbsp;mm in total** with JLC's [gold-finger PI thickness calculator](https://jlcpcb.com/gold-fingers-pi-thickness-calculator). JLC's own pages disagree slightly for a 0.11&nbsp;mm flex (the capability page gives 0.225&nbsp;mm PI, the calculator recommends 0.25&nbsp;mm); either lands inside the connector's tolerance. <!-- TODO verify: PI thickness JLC applied on our last order -->
- **Add a remark** to the order, for example: *"PI stiffener on the TOP side over the connector area, outline on layer User_Drawings, 0.3 mm total thickness at the gold fingers. Contacts are on the bottom."* <!-- TODO verify: name of JLC's remark field -->

### 2 or 4 layers: cost

A 4-layer flex costs noticeably more than a 2-layer one at the same size. Design on 2 layers unless 4 layers are what make your sensor fit (see [Two or four copper layers](../design/index.md#two-or-four-copper-layers)). The quote updates as you change the options, so compare both before deciding. <!-- TODO: typical 2L vs 4L price for a ~40 x 60 mm sensor, as of October 2026 -->

## If JLC asks

After you pay, JLCPCB's engineers review the files and sometimes send an engineering question (EQ) before production. Answer it on the order page; production waits until you do. Questions we have seen or expect:

**"Which side are the gold fingers on?" / "The stiffener overlaps the finger area; is this intended?"**
: The contacts are on the bottom side; the mask is open there, at the fingers only. The PI stiffener goes on the opposite side, the top, over the connector area. That is intended: the connector contacts the bottom of the flex.

**"Which side does the stiffener go on?"**
: The top (the taxel side), opposite the contacts, so that the connector end is 0.3&nbsp;mm thick in total.

**"Please confirm the stiffener size / thickness."**
: Size as drawn on User_Drawings (6&nbsp;mm by the connector width), polyimide, total thickness 0.3&nbsp;mm at the fingers.

**"There is text or a drawing on a user layer; should it be fabricated?"**
: No. User_Drawings and User_Comments are notes for the stiffener; they are not copper, mask or silkscreen.

## When the boards arrive

Check the connector end against the readout board's connector before assembly: it should slide in under the open latch with light force. Then [assemble](assembly.md).

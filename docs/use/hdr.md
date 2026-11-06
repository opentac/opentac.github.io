---
description: Read light and heavy contacts on one sensor in the same frame by re-reading saturated taxels at lower gains on the 60-pin readout board.
---

# High dynamic range (HDR) { #hdr }

With one fixed gain, a sensor either resolves light touch or measures heavy loads, not both: a gain high enough for a small weight saturates under a hand press. HDR removes that trade-off on the 60-pin readout board. Every taxel is first read at the highest gain. Taxels that saturate are read again at a lower gain in the same frame, and again at a lower one if they still saturate. Each taxel is therefore reported at the highest gain that does not saturate it, so light and heavy contacts on different parts of one sensor are measured at the same time.

<figure class="ot-clip" style="max-width: 46rem; margin: 1.2em auto 1.6em">
<div class="ot-media">
  <video data-loop muted loop playsinline preload="none" poster="../../assets/loops/reveal.jpg"
         aria-label="A small weight on one end of a sensor, then a dumbbell pressed by hand on the other end, each shown with its half of the tactile map and its reading; the two views then join into one view of a single sensor carrying both loads">
    <source src="../../assets/loops/reveal.mp4" type="video/mp4">
  </video>
</div>
<figcaption><b>Figure 1.</b> A small weight and a dumbbell pressed by hand on the two ends of one sensor, recorded in one take with HDR on. Each load is shown with its half of the viewer's tactile map, filmed off the monitor in the same frames, and with the viewer's reading (the small weight's averaged over 2&nbsp;s). The two views are adjacent crops of the same frames; joined, they show one sensor carrying both loads. The footage plays at normal speed from 3.0 to 7.2&nbsp;s; the frames before and after are held.</figcaption>
</figure>

<figure class="ot-clip" style="max-width: 46rem; margin: 1.2em auto 1.6em">
<div class="ot-media">
  <video data-loop muted loop playsinline preload="none" poster="../../assets/loops/hdr.jpg"
         aria-label="A small weight on one half of a sensor and stacked weights, then a dumbbell pressed by hand, on the other half; with HDR off the heavy half saturates, with HDR on both halves are measured">
    <source src="../../assets/loops/hdr.mp4" type="video/mp4">
  </video>
</div>
<figcaption><b>Figure 2.</b> A small weight on the right half of a sensor; stacked weights, then a dumbbell pressed by hand, on the left half. With HDR off, the stack saturates 42 taxels and the left half reads 0.78&nbsp;kg. With HDR on, both halves are measured; with the dumbbell, the clip pauses on a frame in which they differ by 1,170&nbsp;:&nbsp;1. Readings in grams are approximate.</figcaption>
</figure>

## Measured against a scale { #measured }

On a 360-taxel skin resting on a scale (Figure 3), one fixed gain saturates 26 of the 45 taxels in contact under a 78&nbsp;N press, and the force it reports levels off near 9&nbsp;N. HDR re-reads those taxels at gains of 1/3 and 1/10 in the same frame and follows the scale up to 80&nbsp;N, the largest load tested: above 20&nbsp;N, the median ratio of its estimate to the scale is 1.04, against 0.13 at one fixed gain. With a 3.7&nbsp;kg weight stack and a 20&nbsp;g weight on opposite ends of the skin, HDR reads the stack at gains of 1 and 1/3 and the small weight at gain&nbsp;1, in the same frame.

<figure class="ot-fig" markdown="span">
  [![(a) A photo of a 3.7 kg brass weight stack and a 20 gram weight on opposite ends of one skin, with the HDR tactile map and the gain each taxel was read at. (b) One frame at 78 N under a plunger: at one fixed gain 26 taxels saturate; HDR reads them at lower gains. (c) Estimated against reference force: one fixed gain levels off near 9 N; HDR follows the scale to 80 N.](../assets/figures/hdr_measured.png){ loading=lazy }](../assets/figures/hdr_measured.png)
  <figcaption><b>Figure 3.</b> A 360-taxel skin on a reference scale. (a)&nbsp;A 3.7&nbsp;kg weight stack (36&nbsp;N) and a 20&nbsp;g weight (0.2&nbsp;N) on opposite ends of the skin, one HDR frame; at one fixed gain, 99 of the stack's 195 taxels in contact saturate. (b)&nbsp;A plunger pressing the center of the skin, one frame at 78&nbsp;N in each mode; &times; marks saturated taxels. Color in (a) and (b) is the taxel load in counts at gain&nbsp;1. (c)&nbsp;Force estimated by the skin against the scale for the plunger in (b): median per 2&nbsp;N of reference force over all loading and holding samples. Both modes use one calibration, fitted to the same scale in a separate session, so (c) shows the measurable range rather than accuracy.</figcaption>
</figure>

## Enable HDR { #use-it }

HDR needs the 60-pin readout board and firmware with HDR (`uv run opentac flash`). It begins by measuring the zero at every gain it uses, which takes about 1&nbsp;s; nothing may touch the sensor during that time.

```sh
uv run opentac view --hdr            # h switches between HDR and one fixed gain; b zeroes again
uv run opentac view --hdr --xampling 128
uv run opentac record takes/ --hdr
```

```python
from opentac.device import Sensor

s = Sensor()
s.hdr()           # nothing touching: zero at every gain, then HDR on (HDR_GAINS 0x8421)
frame = s.read()
frame.taxels      # counts above the zero, at the highest gain
frame.gain        # the gain each taxel was read at, 1 to 1/148
s.hdr(False)      # one fixed gain again, in raw counts
```

Beside the tactile map, the viewer shows a gain map: the gain each taxel was read at in the current frame, lower under a load and the highest everywhere else. In HDR the tactile map's colour scale is logarithmic, so a light touch and a heavy press appear on one scale.

HDR is off whenever a program opens the sensor, and closing the sensor turns it off, so programs that do not use HDR receive the same frames as before. A recording made in HDR keeps the values as the board sent them, together with the zero at every gain; `opentac.record.hdr_counts(take)` converts them.

## How it works { #how-it-works }

The 60-pin board's gain switch sets the feedback resistance of the readout amplifier (see [Gain](sensor.md#gain-60-pin-board)). HDR uses five of its settings, each about three to four times lower in gain than the one before:

| Pass | `GAIN_SW` | Feedback | Gain |
|---|---|---|---|
| 0 | 0 | 10 kΩ | 1 |
| 1 | 1 | 3.2 kΩ | 1/3 |
| 2 | 2 | 991 Ω | 1/10 |
| 3 | 4 | 263 Ω | 1/38 |
| 4 | 8 | 67.5 Ω | 1/148 |

Pass 0 is an ordinary raster scan at `GAIN_SW` (the highest gain by default). Each further pass switches to the next gain and re-reads only the taxels whose reading in the pass before reached `HDR_CLIP`. The passes stop when no taxel needs another one, and the gain is back at its starting value before the frame is sent. The host divides each reading, less the zero at its gain, by that gain, so every taxel is reported in the same units.

[![(a) The raw reading of one taxel against its signal at the highest gain: with one fixed gain it stays at full scale from 4095 counts on; with HDR it drops back each time a lower gain is selected. (b) The value reported: one fixed gain saturates at 4095 counts; HDR follows the signal up to 148 times further.](../assets/figures/hdr_ladder.png){ loading=lazy }](../assets/figures/hdr_ladder.png)
<figcaption><b>Figure 4.</b> One taxel under an increasing load. (a) Raw reading: with one fixed gain the reading stays at full scale; with HDR the taxel is re-read at the next gain each time it reaches <code>HDR_CLIP</code>. (b) Value reported: HDR extends the measurable range by the ratio of the highest to the lowest gain, 148&times;, with full sensitivity kept at the low end.</figcaption>

## Settings

| Parameter | Default | Meaning |
|---|---|---|
| `HDR_GAINS` | 0 (off) | one hexadecimal digit per re-read pass, lowest first: the `GAIN_SW` of that pass. `0x8421` re-reads at `GAIN_SW` 1, 2, 4 and 8 |
| `HDR_CLIP` | 3800 | raw reading at or above which a taxel is read again in the next pass |

HDR is off at boot, so existing programs see no change. It works in raster scanning and in [Xampling](xampling.md), where the passes re-read only the taxels sampled in that frame; `Z` ignores `HDR_GAINS`.

## Frame format { #frame-format }

A re-read value carries its pass in the top four bits of the 16-bit reading: value = raw + 4096 &times; pass. Readings from pass 0 are unchanged, so a frame with nothing saturated is identical to one read without HDR. Programs that read the [protocol](../reference/protocol.md) directly take `value >> 12` as the pass and `value & 0x0FFF` as the raw reading. In an Xampling frame, values from pass 0 are counts above the board's zero, as without HDR, and a re-read value is the raw reading at its gain: the board keeps its zero at one gain only, so the host subtracts the zero it measured at that gain.

## Frame time { #frame-time }

HDR adds no time when no taxel reaches `HDR_CLIP`: on the 360-taxel skin of Figure 3, a raster frame takes 5.3&nbsp;ms with HDR on or off, and an Xampling frame of 128 reads 2.4&nbsp;ms. Each pass that has taxels to re-read adds a fixed 0.3&ndash;0.5&nbsp;ms to switch the gain, and each re-read adds 15&nbsp;µs, the same as reading one taxel in the raster scan. Re-reading 25 taxels over two passes, as under the 78&nbsp;N press in Figure 3, adds 1.2&nbsp;ms.

## Limits

- **60-pin board only.** The 30-pin board has no gain switch.
- **Gain ratios.** Readings are converted with the nominal feedback resistances, which agree with the measured ones to within 1 to 3%. A taxel whose load crosses from one gain to the next can therefore step by up to that amount.
- **Saturation at the lowest gain.** A taxel that reaches full scale at 1/148 is reported at full scale, as with one fixed gain.

---
title: Read a sensor's QR code
description: Decode the QR code on the back of an OpenTac sensor, see what it holds, and download its manifest.json. Decoding runs in the browser; nothing is uploaded.
hide:
  - toc
---

# Read a sensor's QR code

The QR code on the back of a sensor made with OpenTac-CAD holds the sensor's
taxel grid: rows, columns, connector contacts, which taxels exist, where they
sit and the copper pattern of each taxel. Scanning it with a phone opens this
page, which decodes it in the browser (nothing is uploaded), draws the sensor
from it, lists every field the code holds, and rebuilds the sensor's
`manifest.json`. See [Recover a manifest from the QR](use/qr-recovery.md) for
more on the format.

<div id="ot-qr" class="ot-qr">
<div class="ot-qr__result" aria-live="polite"></div>
<form class="ot-qr__form">
<label for="ot-qr-text">Text read off the code (the link or the bare code)</label>
<textarea id="ot-qr-text" rows="3" spellcheck="false" autocomplete="off" autocapitalize="characters"></textarea>
<button type="submit" class="ot-qr__btn">Decode</button>
</form>
</div>

## Examples

No sensor at hand? These open the codes of some of the
[example designs](design/examples.md):

<ul class="ot-qr__examples">
<li><a href="#YJ77YN9I2O-QN0AOBT.:VW3NG90" data-design="strip-09x09">9 x 9 patch</a>: 81 taxels, 2 mm pitch, a full grid.</li>
<li><a href="#PL7:SS6I27S70IFH007-11O7ITMPOLNBHN7DIOMQR-VHAVHAVHAVHAVHAVHAVHAVHAVHAVHAVHAVHAVHAJIAI20FYJFYJFYJ-NJ" data-design="calibration-lshape-p2p0-gap0p2">L-shape</a>: 405 taxels on a 27 x 27 grid with 324 empty positions.</li>
<li><a href="#VJ72IS1$45FC*E00ITNXZN209AT2YE*A0DSO06AHAT" data-design="yubi-finger-pad-08x27">YUBI finger pad</a>: 165 taxels, 3 mm pitch, a stepped outline.</li>
<li><a href="#135RQB9I2*DHSXTMSUR10SP76EU4TF$LTQCGNNQGT3" data-design="calibration-square-p2p0-gap0p5">Square, 0.5 mm electrode gap</a>: a taxel pattern that is not the default.</li>
<li><a href="#-L78TZ2D7XSRBQBJJ2IO2QBKFVVH.6:7IPYS1P301GIRA8HY1QJ" data-design="large-32x32">Large array</a>: 900 taxels on the 60-pin connector.</li>
</ul>

<script src="../javascripts/qr.js"></script>

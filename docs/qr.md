---
title: Read a sensor's QR code
description: Decode the QR code on the back of an OpenTac sensor and download its manifest.json. Decoding runs in the browser; nothing is uploaded.
hide:
  - toc
---

# Read a sensor's QR code

The QR code on the back of a sensor made with OpenTac-CAD holds the sensor's
taxel grid: rows, columns, connector pads, which taxels exist and where they
sit. Scanning it with a phone opens this page, which decodes it in the browser
(nothing is uploaded) and rebuilds the sensor's `manifest.json`. See
[Recover a manifest from the QR](use/qr-recovery.md) for what the code holds
and what it does not.

<div id="ot-qr" class="ot-qr">
<div class="ot-qr__result" aria-live="polite"></div>
<form class="ot-qr__form">
<label for="ot-qr-text">Text read off the code (the link or the bare code)</label>
<textarea id="ot-qr-text" rows="3" spellcheck="false" autocomplete="off" autocapitalize="characters"></textarea>
<button type="submit" class="ot-qr__btn">Decode</button>
</form>
</div>

<script src="../javascripts/qr.js"></script>

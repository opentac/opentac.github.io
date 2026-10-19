// Read the QR code on the back of an OpenTac sensor, in the browser.
//
// The code is a link, HTTPS://OPENTAC.GITHUB.IO/Q/<payload>. GitHub Pages
// serves 404.html for that path, which forwards to /qr/#<payload>, and this
// file decodes the payload there. Nothing is sent anywhere.
//
// A port of opentac/cad/export/taxel_core.py (base41, CRC-8, the taxel-core
// bit format, to_manifest) and of opentac.manifest.from_qr. fromText(text).json
// is the same bytes as `opentac manifest from-qr TEXT -o manifest.json`:
// the same keys in the same order, and numbers written the way Python's
// json.dumps writes them. scripts/check_qr_page.py checks that on every example
// design; run it after changing either side.
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.OpenTacQR = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var B41 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$-./:";
  var LINK_PREFIX = "HTTPS://OPENTAC.GITHUB.IO/Q/";
  var Q = 100.0;
  var MAGIC_VERSION = 0;
  var MANIFEST_V = 6;
  var CRC8_POLY = 0x07;
  var ABSENT = ["outline", "edge_cuts", "design", "shear"];
  // Insertion order matters: it is the key order Python writes.
  var FP_DEFAULT = [["trace_w", 0.2], ["gap", 0.2], ["center_clear", 0.2],
                    ["edge_clear", 0.1], ["via_drill", 0.15], ["via_dia", 0.35]];
  var FP_KEYS = FP_DEFAULT.map(function (kv) { return kv[0]; }).sort();

  function QRError(message) {
    var e = new Error(message);
    e.name = "QRError";
    return e;
  }

  // ---------------------------------------------------------------- text in

  // The characters Python's str.split() treats as whitespace.
  var WS = /[\t\n\v\f\r \x1c-\x1f\x85\xa0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]/g;
  var LINK = /^(?:HTTPS?:\/\/)?OPENTAC\.GITHUB\.IO\/(?:Q\/|QR\/?#)(.*)$/;

  // Whatever a scanner or a clipboard hands back -> the bare base41 payload.
  // Same rules as taxel_core.payload_from_text.
  function payloadFromText(text) {
    var t = String(text).replace(WS, "").toUpperCase();
    var m = LINK.exec(t);
    if (m) t = m[1];
    return t.split("*").join("/");
  }

  // --------------------------------------------------------------- base41

  function crc8(data) {
    var crc = 0;
    for (var i = 0; i < data.length; i++) {
      crc ^= data[i];
      for (var k = 0; k < 8; k++) crc = (crc & 0x80) ? ((crc << 1) ^ CRC8_POLY) & 0xFF : (crc << 1) & 0xFF;
    }
    return crc;
  }

  function b41decode(text) {
    var vals = [], out = [], i, n;
    for (i = 0; i < text.length; i++) {
      var v = B41.indexOf(text[i]);
      if (v < 0) throw QRError("not base41: unexpected character " + JSON.stringify(text[i]));
      vals.push(v);
    }
    for (i = 0; i + 2 < vals.length; i += 3) {
      n = vals[i] + vals[i + 1] * 41 + vals[i + 2] * 41 * 41;
      if (n > 0xFFFF) throw QRError("not a base41 payload: base41 triple out of range");
      out.push(n >> 8, n & 0xFF);
    }
    if (vals.length % 3 === 2) {
      n = vals[vals.length - 2] + vals[vals.length - 1] * 41;
      if (n > 0xFF) throw QRError("not a base41 payload: base41 tail out of range");
      out.push(n);
    }
    return out;
  }

  // -------------------------------------------------------------- bit reader

  function BitReader(data) {
    this.bits = [];
    for (var i = 0; i < data.length; i++)
      for (var k = 7; k >= 0; k--) this.bits.push((data[i] >> k) & 1);
    this.pos = 0;
  }
  BitReader.prototype.u = function (n) {
    if (this.pos + n > this.bits.length) throw QRError("payload truncated");
    var v = 0;
    for (var i = 0; i < n; i++) v = v * 2 + this.bits[this.pos++];
    return v;
  };
  BitReader.prototype.uvarint = function () {
    var v = 0, scale = 1;
    for (;;) {
      var more = this.u(1);
      v += this.u(7) * scale;
      scale *= 128;
      if (scale > 0x20000000000000) throw QRError("payload damaged: varint too long");
      if (!more) return v;
    }
  };
  BitReader.prototype.varint = function () {
    var v = this.uvarint();
    return (v % 2 === 0) ? v / 2 : -((v + 1) / 2);
  };

  function bitwidth(n) {
    // Bits needed to index n distinct values: max(1, ceil(log2(max(2, n)))).
    var b = 1;
    while (Math.pow(2, b) < n) b++;
    return b;
  }

  // ------------------------------------------------------------ taxel core

  // `trace`, if given, is filled with how many bits each field took (keys:
  // version, pitch, footprint, cols, rows, reserved, padPitch, grid, size,
  // origin, pads, perm, mask, padding, crc) and the mask coding. It is for the
  // page's table only; the return value does not depend on it.
  function decode(data, trace) {
    if (data.length < 2) throw QRError("payload too short to be a taxel core");
    var body = data.slice(0, -1), got = data[data.length - 1], want = crc8(body);
    if (got !== want)
      throw QRError("checksum mismatch: the scanned text was altered or is incomplete");
    var b = new BitReader(body), last = 0;
    function tally(key) {                     // bits read since the last tally go to `key`
      if (trace) trace[key] = (trace[key] || 0) + b.pos - last;
      last = b.pos;
    }
    var version = b.u(2); tally("version");
    if (version !== MAGIC_VERSION) throw QRError("unknown taxel-core version " + version);
    var square = b.u(1); tally("pitch");
    var fpDefault = b.u(1); tally("footprint");
    var sparseX = b.u(1); tally("cols");
    var sparseY = b.u(1); tally("rows");
    b.u(1); tally("reserved");                // reserved
    var padPitch05 = b.u(1); tally("padPitch");
    var r = b.u(6), c = b.u(6); tally("grid");
    var pitchX = b.uvarint() / Q;
    var pitchY = square ? pitchX : b.uvarint() / Q; tally("pitch");
    var w = pitchX + b.varint() / Q;
    var h = square ? w : pitchY + b.varint() / Q; tally("size");
    var x0 = b.varint() / Q;
    var y0 = b.varint() / Q; tally("origin");
    var rp0 = b.u(6); tally("pads");

    var footprint = FP_DEFAULT.map(function (kv) { return [kv[0], kv[1]]; });
    if (!fpDefault) {
      FP_KEYS.forEach(function (k) {
        if (b.u(1)) {
          var val = b.u(8) / Q;
          footprint.forEach(function (kv) { if (kv[0] === k) kv[1] = val; });
        }
      });
    }
    tally("footprint");

    var kx, ky = null, n, k;
    if (sparseX) {
      n = b.u(6); kx = [];
      for (k = 0; k < n; k++) if (b.u(1)) kx.push(k);
    } else {
      kx = []; for (k = 0; k < c; k++) kx.push(k);
    }
    tally("cols");
    if (sparseY) {
      n = b.u(6); ky = [];
      for (k = 0; k < n; k++) if (b.u(1)) ky.push(k);
    }
    tally("rows");
    var nRowsGeo = ky !== null ? ky.length : r;
    var nb = bitwidth(nRowsGeo), perm = [];
    for (k = 0; k < r; k++) perm.push(b.u(nb));
    if (ky === null) { ky = []; for (k = 0; k < nRowsGeo; k++) ky.push(k); }
    tally("perm");

    if (trace) trace.maskRle = b.bits[b.pos] === 1;
    var mask = readMask(b, r, c);
    tally("mask");
    if (trace) {
      trace.padding = b.bits.length - b.pos;
      trace.crc = 8;
      trace.crcValue = got;
    }
    var rp = [], cp = [];
    for (k = 0; k < r; k++) rp.push(rp0 + k);
    for (k = 0; k < c; k++) cp.push(rp0 + r + k);
    return {
      r: r, c: c, x0: x0, y0: y0, pitch_x: pitchX, pitch_y: pitchY, w: w, h: h,
      footprint: footprint, rp: rp, cp: cp, pad_pitch_mm: padPitch05 ? 0.5 : null,
      perm: perm, kx: kx, ky: ky, m: mask
    };
  }

  function readMask(b, r, c) {
    var total = r * c, bits = [];
    if (b.u(1)) {
      var value = b.u(1);
      while (bits.length < total) {
        var run = b.varint();
        for (var i = 0; i < run && bits.length < total; i++) bits.push(value);
        value ^= 1;
      }
    } else {
      for (var j = 0; j < total; j++) bits.push(b.u(1));
    }
    var rows = [];
    for (var y = 0; y < r; y++) rows.push(bits.slice(y * c, (y + 1) * c).join(""));
    return rows;
  }

  function at(list, i) {
    // Python raises IndexError here; a damaged payload must fail, not draw NaN.
    if (!(i >= 0 && i < list.length)) throw QRError("payload damaged: index out of range");
    return list[i];
  }

  // ------------------------------------------------------ taxel copper

  // One taxel's interdigitated copper, from its size and the footprint values
  // the code carries. A port of pixel_geometry in
  // opentac/cad/export/kicad_footprint.py, the rule that writes the KiCad
  // footprint; scripts/check_qr_page.py compares the two. Taxel-centred mm,
  // KiCad's y-down. Slot i holds a finger at y0 + i * pitch: even slots belong
  // to the row electrode (pad 1, spine at xL, ends at xEndLeftMax), odd slots
  // to the column electrode (pad 2, spine at xR, ends at colEndX[i]). The row
  // via sits at (viaX, viaY). Only the drawing uses this.
  function pixelGeometry(w, h, tracew, gap, centerClear, edgeClear, viaDia) {
    var ix1 = -w / 2 + edgeClear, iy1 = -h / 2 + edgeClear;
    var ix2 = w / 2 - edgeClear, iy2 = h / 2 - edgeClear;
    var innerW = ix2 - ix1, innerH = iy2 - iy1;
    if (innerW <= tracew || innerH <= tracew)
      throw QRError("edge clearance too large for this taxel size and trace width");
    var xL = ix1 + tracew / 2, xR = ix2 - tracew / 2, ymid = (iy1 + iy2) / 2;
    var pitch = tracew + gap;
    var totalSlots = Math.max(1, Math.trunc((innerH + gap) / pitch));
    var span = totalSlots * tracew + (totalSlots - 1) * gap;
    var y0 = (iy1 + iy2 - span) / 2 + tracew / 2;
    var xEndLeftMax = xR - (centerClear + tracew);
    var xEndRightMin = xL + (centerClear + tracew);
    var viaX = ix1 + viaDia / 2, viaY = ymid;
    var reach = viaDia / 2 + tracew / 2 + centerClear + 0.001;
    var colEndX = [];
    for (var i = 0; i < totalSlots; i++) {
      var dy = Math.abs(y0 + i * pitch - viaY), xEnd = xEndRightMin;
      if (i % 2 === 1 && dy < reach)
        xEnd = Math.min(xR, Math.max(xEnd, viaX + Math.sqrt(reach * reach - dy * dy)));
      colEndX.push(xEnd);
    }
    return {
      xL: xL, xR: xR, ymid: ymid, pitch: pitch, y0: y0,
      spineYLo: iy1 + tracew / 2, spineYHi: iy2 - tracew / 2,
      totalSlots: totalSlots, xEndLeftMax: xEndLeftMax, xEndRightMin: xEndRightMin,
      viaX: viaX, viaY: viaY, colEndX: colEndX
    };
  }

  // ---------------------------------------------------- Python number output

  // A float as Python's json.dumps writes it, kept apart from ints so 2.0
  // stays "2.0" and 2 stays "2".
  function PyFloat(v) { this.v = v; }

  // Python's round(x, nd): correctly rounded, exact ties to even.
  function pyRound(x, nd) {
    if (!isFinite(x) || x === 0) return x;
    var neg = x < 0, a = Math.abs(x);
    if (a >= 1e21) return x;
    var s = a.toFixed(nd);                   // ties go up here
    var exact = a.toFixed(100);              // every digit of a double this size
    var dot = exact.indexOf(".");
    if (/^50*$/.test(exact.slice(dot + 1 + nd))) {
      var trunc = exact.slice(0, dot + 1 + nd);
      if ((trunc.charCodeAt(trunc.length - 1) - 48) % 2 === 0) s = trunc;
    }
    var r = Number(s);
    return neg ? -r : r;
  }

  function f4(x) { return new PyFloat(pyRound(x, 4)); }

  // Python's float repr: shortest round-trip digits, exponent form below 1e-4
  // and from 1e16, and ".0" on whole numbers.
  function floatRepr(x) {
    if (x !== x) return "NaN";
    if (x === Infinity) return "Infinity";
    if (x === -Infinity) return "-Infinity";
    if (x === 0) return 1 / x < 0 ? "-0.0" : "0.0";
    var sign = x < 0 ? "-" : "";
    var m = /^(\d)(?:\.(\d+))?e([+-]\d+)$/.exec(Math.abs(x).toExponential());
    var digits = m[1] + (m[2] || ""), exp = parseInt(m[3], 10), decpt = exp + 1;
    if (decpt <= -4 || decpt > 16) {
      var ae = Math.abs(exp);
      return sign + digits[0] + (digits.length > 1 ? "." + digits.slice(1) : "") +
        "e" + (exp < 0 ? "-" : "+") + (ae < 10 ? "0" : "") + ae;
    }
    if (decpt <= 0) return sign + "0." + "0".repeat(-decpt) + digits;
    if (decpt >= digits.length) return sign + digits + "0".repeat(decpt - digits.length) + ".0";
    return sign + digits.slice(0, decpt) + "." + digits.slice(decpt);
  }

  function strRepr(s) {
    // json.dumps with ensure_ascii=True
    var out = '"';
    for (var i = 0; i < s.length; i++) {
      var ch = s[i], code = s.charCodeAt(i);
      if (ch === '"') out += '\\"';
      else if (ch === "\\") out += "\\\\";
      else if (ch === "\n") out += "\\n";
      else if (ch === "\r") out += "\\r";
      else if (ch === "\t") out += "\\t";
      else if (ch === "\b") out += "\\b";
      else if (ch === "\f") out += "\\f";
      else if (code < 0x20 || code > 0x7e) out += "\\u" + ("000" + code.toString(16)).slice(-4);
      else out += ch;
    }
    return out + '"';
  }

  // json.dumps(value, indent=2)
  function dumps(value, level) {
    level = level || 0;
    if (value === null) return "null";
    if (value === true) return "true";
    if (value === false) return "false";
    if (value instanceof PyFloat) return floatRepr(value.v);
    if (typeof value === "number") {
      if (!Number.isSafeInteger(value)) throw QRError("internal: non-integer written as int");
      return String(value);
    }
    if (typeof value === "string") return strRepr(value);
    var inner = "\n" + "  ".repeat(level + 1), outer = "\n" + "  ".repeat(level);
    if (Array.isArray(value)) {
      if (!value.length) return "[]";
      return "[" + inner + value.map(function (v) { return dumps(v, level + 1); }).join("," + inner) + outer + "]";
    }
    var keys = Object.keys(value);
    if (!keys.length) return "{}";
    return "{" + inner + keys.map(function (k) {
      return strRepr(k) + ": " + dumps(value[k], level + 1);
    }).join("," + inner) + outer + "}";
  }

  // ------------------------------------------------------- back to a manifest

  function taxels(core) {
    var out = [];
    for (var ri = 0; ri < core.r; ri++) {
      for (var ci = 0; ci < core.c; ci++) {
        if (core.m[ri][ci] !== "1") continue;
        var x = core.x0 + at(core.kx, ci) * core.pitch_x;
        var y = core.y0 - at(core.ky, at(core.perm, ri)) * core.pitch_y;
        out.push([pyRound(x, 4), pyRound(y, 4), ri, ci]);
      }
    }
    return out;
  }

  // taxel_core.to_manifest, with floats marked for the writer.
  function toManifest(core) {
    var tx = taxels(core);
    var oy = core.y0 - at(core.ky, at(core.perm, 0)) * core.pitch_y;
    var footprint = {};
    core.footprint.forEach(function (kv) { footprint[kv[0]] = new PyFloat(kv[1]); });
    return {
      _readme: [
        "OpenTac-CAD sensor manifest, RECOVERED from the back-silkscreen QR.",
        "Lengths in mm. Coordinates are Y-UP, the same frame the printed " +
        "registration grid uses, whose origin is this frame's (0, 0).",
        "Positions are quantized to 0.01 mm by the printed format; the " +
        "original manifest carried 0.0001 mm.",
        "MISSING, because the QR does not carry them: " + ABSENT.join(", ") +
        ". 'outline'/'edge_cuts' come from a photograph of the board - the " +
        "printed grid is what makes that photograph measurable. 'design' is " +
        "the recipe and 'shear' is the bump grouping; neither is recoverable.",
        "'pixels' is [x, y, row_index, col_index] per active taxel and is the " +
        "authority on where taxels physically sit.",
        "'ox'/'oy'/'px'/'py'/'m'/'rp'/'cp' are for MCU scan order, NOT geometry: " +
        "their row index is pad order, so ox+ci*px does not reproduce positions. " +
        "Use 'pixels' for geometry."
      ],
      v: MANIFEST_V,
      units: "mm",
      recovered: {
        source: "back-silkscreen taxel-core QR",
        quantization_mm: new PyFloat(1.0 / Q),
        absent: ABSENT.slice()
      },
      pixels: tx.map(function (t) { return [new PyFloat(t[0]), new PyFloat(t[1]), t[2], t[3]]; }),
      w: f4(core.w),
      h: f4(core.h),
      footprint: footprint,
      r: core.r,
      c: core.c,
      px: f4(core.pitch_x),
      py: f4(-core.pitch_y),
      ox: f4(core.x0),
      oy: f4(oy),
      rp: core.rp.slice(),
      cp: core.cp.slice(),
      m: core.m.slice(),
      pad_pitch_mm: core.pad_pitch_mm === null ? null : new PyFloat(core.pad_pitch_mm)
    };
  }

  // The checks opentac.manifest.validate(scan=True) can fail on a payload whose
  // checksum is good; the rest hold by construction.
  function validate(raw) {
    if (!raw.pixels.length) throw QRError("the QR describes no taxels");
    ["w", "h"].forEach(function (k) {
      if (!(raw[k].v > 0)) throw QRError("'" + k + "' must be a positive number, got " + floatRepr(raw[k].v));
    });
  }

  // Scanned text -> {payload, raw, json, core, trace, bytes}. `raw` holds
  // PyFloat objects; plain() turns it into ordinary JSON values. `core` is the
  // decoded taxel core (taxel_core.decode's dict) and `trace` the bits per field.
  function fromText(text) {
    var payload = payloadFromText(text);
    if (!payload) throw QRError("empty payload");
    if (payload.length % 3 === 1)
      throw QRError("the text is " + payload.length + " characters long, which base41 cannot be: " +
                    "it is truncated or had a character removed");
    var data = b41decode(payload), trace = {};
    var core = decode(data, trace);
    var raw = toManifest(core);
    validate(raw);
    // core and trace are for the page's drawing and table; json is the file.
    return { payload: payload, raw: raw, json: dumps(raw) + "\n",
             core: core, trace: trace, bytes: data.length };
  }

  function plain(value) {
    if (value instanceof PyFloat) return value.v;
    if (Array.isArray(value)) return value.map(plain);
    if (value && typeof value === "object") {
      var out = {};
      Object.keys(value).forEach(function (k) { out[k] = plain(value[k]); });
      return out;
    }
    return value;
  }

  function link(payload) { return LINK_PREFIX + payload.split("/").join("*"); }

  return {
    B41: B41, LINK_PREFIX: LINK_PREFIX, ABSENT: ABSENT, FP_DEFAULT: FP_DEFAULT,
    payloadFromText: payloadFromText, fromText: fromText, plain: plain, link: link,
    floatRepr: floatRepr, pyRound: pyRound, dumps: dumps, PyFloat: PyFloat,
    pixelGeometry: pixelGeometry
  };
});

// ------------------------------------------------------------------ the page
//
// After a decode the page shows what the code carries: a to-scale drawing of
// the taxels and their connector contacts, one taxel's copper, every field with
// the bits it took, and what the code does not carry. All of it is read from
// fromText()'s `core` and `raw`; nothing here feeds back into the file.

(function () {
  "use strict";
  if (typeof document === "undefined") return;

  var SVG = "http://www.w3.org/2000/svg";
  var FONT = 11;            // px, labels in the drawings
  var DIGIT = 6.4;          // px, about one digit at FONT
  var blobUrl = null;
  var shown = null;         // the last decode, for redrawing on resize

  // "0.2 mm" never breaks between the number and the unit.
  function nb(text) { return String(text).replace(/(\d) (mm|bits?|characters|bytes)\b/g, "$1\u00a0$2"); }

  function el(tag, attrs, text) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (text != null) e.textContent = nb(text);
    return e;
  }

  function svgEl(tag, attrs, text) {
    var e = document.createElementNS(SVG, tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (text != null) e.textContent = text;
    return e;
  }

  function px(x) { return String(Math.round(x * 100) / 100); }

  // A stored length: the code quantizes to 0.01 mm, so two decimals.
  function mm2(x) { return OpenTacQR.pyRound(x, 2).toFixed(2).replace(/^-/, "\u2212"); }

  // A length in running text: 2 -> "2", 0.15 -> "0.15".
  function mm(x) { return String(OpenTacQR.pyRound(x, 3)).replace(/^-/, "\u2212"); }

  function runs(list) {
    // [0, 1, 2, 3, 4, 8, 7, 6, 5] -> "0-4, 8-5", with en dashes that do not break
    var out = [], i = 0;
    while (i < list.length) {
      var j = i;
      if (i + 1 < list.length && Math.abs(list[i + 1] - list[i]) === 1) {
        var step = list[i + 1] - list[i];
        while (j + 1 < list.length && list[j + 1] - list[j] === step) j++;
      }
      out.push(i === j ? String(list[i]) : list[i] + "\u2060\u2013\u2060" + list[j]);
      i = j + 1;
    }
    return out.join(", ");
  }

  function plural(n, one, many) { return n + " " + (n === 1 ? one : many); }

  // ------------------------------------------------------------ the layout

  // Everything the drawings and tables need, from the decoded core.
  function layout(res) {
    var core = res.core, m = OpenTacQR.plain(res.raw);
    var r = core.r, c = core.c, i, j;
    var rowN = [], colN = [];
    for (i = 0; i < r; i++) rowN.push(0);
    for (j = 0; j < c; j++) colN.push(0);
    for (i = 0; i < r; i++)
      for (j = 0; j < c; j++) if (core.m[i][j] === "1") { rowN[i]++; colN[j]++; }

    // A row or column with no taxel has no stored position (taxel_core.analyze
    // gives it an arbitrary rank), so it is listed but not drawn.
    var rows = [], cols = [];
    for (i = 0; i < r; i++) {
      var ky = rowN[i] ? core.ky[core.perm[i]] : null;
      rows.push({ i: i, pad: core.rp[i], n: rowN[i], rank: ky,
                  y: ky === null ? null : core.y0 - ky * core.pitch_y });
    }
    for (j = 0; j < c; j++) {
      var kx = colN[j] ? core.kx[j] : null;
      cols.push({ i: j, pad: core.cp[j], n: colN[j], rank: kx,
                  x: kx === null ? null : core.x0 + kx * core.pitch_x });
    }
    var holes = [];
    for (i = 0; i < r; i++)
      for (j = 0; j < c; j++)
        if (core.m[i][j] !== "1" && rows[i].y !== null && cols[j].x !== null)
          holes.push([cols[j].x, rows[i].y, i, j]);

    // The connector. The code stores contact numbers, not where the cable is.
    // OpenTac-CAD puts the frame's origin at the middle of the cable edge,
    // centres the connector on it, and gives rows and columns one half of the
    // connector each, meeting at its centre (layout.connector_segment_pad_ranges).
    // So the last row contact is half the connector, and contact k sits at
    // x = (k - (N + 1) / 2) * pitch. Shown only when the numbers fit that rule.
    var conn = null, lastRow = core.rp[r - 1], lastCol = core.cp[c - 1];
    if (core.pad_pitch_mm && c <= lastRow) {
      var n = 2 * lastRow, contacts = [];
      for (var k = 1; k <= n; k++) {
        contacts.push({ k: k, x: (k - (n + 1) / 2) * core.pad_pitch_mm,
                        kind: k >= core.rp[0] && k <= lastRow ? "row" :
                              k > lastRow && k <= lastCol ? "col" : "none" });
      }
      conn = { n: n, pitch: core.pad_pitch_mm, contacts: contacts,
               x0: contacts[0].x, x1: contacts[n - 1].x };
    }

    var fp = {};
    core.footprint.forEach(function (kv) { fp[kv[0]] = kv[1]; });
    var geo = null;
    try {
      geo = OpenTacQR.pixelGeometry(core.w, core.h, fp.trace_w, fp.gap, fp.center_clear,
                                    fp.edge_clear, fp.via_dia);
    } catch (e) { /* drawn as plain rectangles */ }

    return { res: res, core: core, m: m, rows: rows, cols: cols, present: m.pixels,
             holes: holes, conn: conn, fp: fp, geo: geo };
  }

  // ------------------------------------------------------------ the sensor

  function niceLength(target) {
    var steps = [0.5, 1, 2, 5, 10, 20, 50, 100, 200];
    for (var i = 0; i < steps.length; i++) if (steps[i] >= target) return steps[i];
    return steps[steps.length - 1];
  }

  // Copper of one taxel as an SVG group, centred on (0, 0), `s` px per mm.
  function copper(g, s, withVia) {
    var geo = g.geo, fp = g.fp, grp = svgEl("g", {});
    var tw = px(Math.max(fp.trace_w * s, 0.6));
    function line(cls, x1, y1, x2, y2) {
      grp.appendChild(svgEl("line", { class: cls, "stroke-width": tw,
        x1: px(x1 * s), y1: px(y1 * s), x2: px(x2 * s), y2: px(y2 * s) }));
    }
    line("ot-qr-cu-row", geo.xL, geo.spineYLo, geo.xL, geo.spineYHi);
    line("ot-qr-cu-col", geo.xR, geo.spineYLo, geo.xR, geo.spineYHi);
    for (var i = 0; i < geo.totalSlots; i++) {
      var fy = geo.y0 + i * geo.pitch;
      if (i % 2 === 0) line("ot-qr-cu-row", geo.xL, fy, geo.xEndLeftMax, fy);
      else line("ot-qr-cu-col", geo.xR, fy, geo.colEndX[i], fy);
    }
    if (withVia) {
      grp.appendChild(svgEl("circle", { class: "ot-qr-via", cx: px(geo.viaX * s), cy: px(geo.viaY * s),
                                        r: px(fp.via_dia / 2 * s) }));
      grp.appendChild(svgEl("circle", { class: "ot-qr-drill", cx: px(geo.viaX * s), cy: px(geo.viaY * s),
                                        r: px(fp.via_drill / 2 * s) }));
    }
    return grp;
  }

  // The taxels to scale, seen from the taxel side, with row and column numbers,
  // their contacts, the origin and the connector. `avail` is the width in px.
  function drawBoard(g, avail) {
    var core = g.core, hw = core.w / 2, hh = core.h / 2;
    var all = g.present.concat(g.holes);
    var gx0 = Infinity, gx1 = -Infinity, gy0 = Infinity, gy1 = -Infinity;
    all.forEach(function (p) {
      gx0 = Math.min(gx0, p[0] - hw); gx1 = Math.max(gx1, p[0] + hw);
      gy0 = Math.min(gy0, p[1] - hh); gy1 = Math.max(gy1, p[1] + hh);
    });
    var cx0 = Math.min(gx0, 0), cx1 = Math.max(gx1, 0);
    if (g.conn) { cx0 = Math.min(cx0, g.conn.x0 - 0.3); cx1 = Math.max(cx1, g.conn.x1 + 0.3); }
    var cy0 = Math.min(gy0, 0);

    var maxPad = Math.max(core.rp[core.r - 1], core.cp[core.c - 1]);
    var title = 16;
    var idxW = Math.max(String(core.r - 1).length * DIGIT, 20) + 6;   // 20: "pad" / "col"
    var padW = String(maxPad).length * DIGIT + 6;
    var left = title + idxW, right = padW + title;
    var top = 36;
    var maxH = Math.max(300, Math.min(window.innerHeight * 0.7, 640));
    var s = Math.min((avail - left - right) / (cx1 - cx0), maxH / (gy1 - cy0), 28);
    var ox = Math.max(left - (gx0 - cx0) * s, 2);
    var width = Math.max(ox + (gx1 - cx0) * s + right, ox + (cx1 - cx0) * s + 2);
    var minW = Math.min(avail, 280);
    if (width < minW) { ox += (minW - width) / 2; width = minW; }
    function X(x) { return ox + (x - cx0) * s; }
    function Y(y) { return top + (gy1 - y) * s; }

    var svg = svgEl("svg", { class: "ot-qr__drawing", role: "img",
      "aria-label": "Drawing of the sensor: " + g.present.length + " taxels, " + core.r +
                    " rows by " + core.c + " columns" });
    var tw = core.w * s, th = core.h * s;
    var thin = tw < 8 ? 0.5 : 1;

    // empty grid positions, then taxels
    g.holes.forEach(function (p) {
      svg.appendChild(svgEl("rect", { class: "ot-qr-hole", "stroke-width": thin,
        x: px(X(p[0] - hw) + thin), y: px(Y(p[1] + hh) + thin),
        width: px(Math.max(tw - 2 * thin, 0.5)), height: px(Math.max(th - 2 * thin, 0.5)) }));
    });
    var detailed = g.geo && Math.min(tw, th) >= 30;
    var cu = detailed ? copper(g, s, true) : null;
    g.present.forEach(function (p) {
      var row = g.rows[p[2]], col = g.cols[p[3]];
      var grp = svgEl("g", { class: "ot-qr-taxel" });
      grp.appendChild(svgEl("title", {}, "row " + p[2] + " (contact " + row.pad + "), column " + p[3] +
        " (contact " + col.pad + "), x " + mm2(p[0]) + " mm, y " + mm2(p[1]) + " mm"));
      grp.appendChild(svgEl("rect", { class: "ot-qr-cell", "stroke-width": thin,
        x: px(X(p[0] - hw) + thin / 2), y: px(Y(p[1] + hh) + thin / 2),
        width: px(tw - thin), height: px(th - thin), rx: px(Math.min(tw, th) * 0.06) }));
      if (cu) {
        var c2 = cu.cloneNode(true);
        c2.setAttribute("transform", "translate(" + px(X(p[0])) + " " + px(Y(p[1])) + ")");
        grp.appendChild(c2);
      }
      svg.appendChild(grp);
    });

    // row numbers left, row contacts right; column contacts and numbers on top
    var kRow = Math.max(1, Math.ceil(13 / (core.pitch_y * s)));
    var kCol = Math.max(1, Math.ceil((String(maxPad).length * DIGIT + 5) / (core.pitch_x * s)));
    g.rows.forEach(function (row) {
      if (row.y === null || row.rank % kRow) return;
      var y = px(Y(row.y) + FONT * 0.36);
      svg.appendChild(svgEl("text", { x: px(X(gx0) - 5), y: y, "text-anchor": "end" }, row.i));
      svg.appendChild(svgEl("text", { class: "ot-qr-t-row", x: px(X(gx1) + 5), y: y }, row.pad));
    });
    g.cols.forEach(function (col) {
      if (col.x === null || col.rank % kCol) return;
      var x = px(X(col.x));
      svg.appendChild(svgEl("text", { class: "ot-qr-t-col", x: x, y: 13, "text-anchor": "middle" }, col.pad));
      svg.appendChild(svgEl("text", { x: x, y: 28, "text-anchor": "middle" }, col.i));
    });
    svg.appendChild(svgEl("text", { class: "ot-qr-t-muted", x: px(X(gx0) - 5), y: 13, "text-anchor": "end" }, "pad"));
    svg.appendChild(svgEl("text", { class: "ot-qr-t-muted", x: px(X(gx0) - 5), y: 28, "text-anchor": "end" }, "col"));
    var midY = px((Y(gy1) + Y(gy0)) / 2);
    var tx = px(X(gx0) - idxW - 4), tx2 = px(X(gx1) + padW + 10);
    svg.appendChild(svgEl("text", { class: "ot-qr-t-muted", x: tx, y: midY, "text-anchor": "middle",
                                    transform: "rotate(-90 " + tx + " " + midY + ")" }, "row"));
    svg.appendChild(svgEl("text", { class: "ot-qr-t-muted", x: tx2, y: midY, "text-anchor": "middle",
                                    transform: "rotate(-90 " + tx2 + " " + midY + ")" }, "pad"));

    // the origin: middle of the cable edge, and of the grid printed on the back
    var x0 = X(0), y0 = Y(0);
    svg.appendChild(svgEl("path", { class: "ot-qr-origin", d: "M" + px(x0 - 5) + " " + px(y0) + "h10M" +
                                    px(x0) + " " + px(y0 - 5) + "v10" }));
    var below = Math.max(Y(cy0), y0) + 6;
    var right0 = x0 > width / 2;
    svg.appendChild(svgEl("text", { class: "ot-qr-t-muted", x: px(right0 ? x0 - 8 : x0 + 8), y: px(y0 + 13),
                                    "text-anchor": right0 ? "end" : "start" }, "0, 0"));

    // the cable (length not stored) and the connector contacts at their x
    var y = below + 14;
    function line(cls, txt) {
      var half = txt.length * 3.1 + 2;          // about half its width at FONT
      var cx = Math.min(Math.max(x0, half), width - half);
      y += 15;
      svg.appendChild(svgEl("text", { class: cls, x: px(cx), y: px(y), "text-anchor": "middle" }, txt));
    }
    if (g.conn) {
      var conTop = below + 34;
      svg.appendChild(svgEl("path", { class: "ot-qr-cable",
        d: "M" + px(x0) + " " + px(y0 + 6) + "V" + px(conTop - 3) }));
      var mid = (y0 + 6 + conTop - 3) / 2;
      svg.appendChild(svgEl("path", { class: "ot-qr-break",
        d: "M" + px(x0 - 6) + " " + px(mid + 1) + "l12 -5M" + px(x0 - 6) + " " + px(mid + 5) + "l12 -5" }));
      var cw = Math.max(0.3 * s, 1);
      g.conn.contacts.forEach(function (k) {
        svg.appendChild(svgEl("rect", { class: "ot-qr-contact ot-qr-contact--" + k.kind,
          x: px(X(k.x) - cw / 2), y: px(conTop), width: px(cw), height: 12 }));
      });
      y = conTop + 12;
      line("ot-qr-t-row", "rows: contacts " + runs(core.rp));
      line("ot-qr-t-col", "columns: contacts " + runs(core.cp));
      line("ot-qr-t-muted", g.conn.n + " contacts, " + mm(g.conn.pitch) + " mm pitch; cable not to scale");
    } else {
      y = below + 4;
      line("ot-qr-t-row", "rows: contacts " + runs(core.rp));
      line("ot-qr-t-col", "columns: contacts " + runs(core.cp));
    }

    // scale bar
    var L = niceLength(70 / s), by = y + 20, bx = 4;
    svg.appendChild(svgEl("path", { class: "ot-qr-scale",
      d: "M" + px(bx) + " " + px(by - 4) + "v8M" + px(bx) + " " + px(by) + "h" + px(L * s) +
         "M" + px(bx + L * s) + " " + px(by - 4) + "v8" }));
    svg.appendChild(svgEl("text", { x: px(bx + L * s + 6), y: px(by + 4) }, mm(L) + " mm"));

    var height = by + 10;
    svg.setAttribute("width", px(width));
    svg.setAttribute("height", px(height));
    svg.setAttribute("viewBox", "0 0 " + px(width) + " " + px(height));
    return { svg: svg, thinned: kRow > 1 || kCol > 1, detailed: detailed };
  }

  // ------------------------------------------------------------ one taxel

  function drawTaxel(g, avail) {
    var core = g.core, geo = g.geo, fp = g.fp;
    var big = Math.max(Math.min(avail - 150, 260), 140);
    var s = big / Math.max(core.w, core.h);
    var wpx = core.w * s, hpx = core.h * s;
    var left = 34, top = 30, width = left + wpx + 110, height = top + hpx + 8;
    var cx = left + wpx / 2, cy = top + hpx / 2;
    var svg = svgEl("svg", { class: "ot-qr__drawing", role: "img", width: px(width), height: px(height),
      viewBox: "0 0 " + px(width) + " " + px(height),
      "aria-label": "One taxel's copper: " + mm(core.w) + " by " + mm(core.h) + " mm" });

    svg.appendChild(svgEl("rect", { class: "ot-qr-cell ot-qr-cell--big", x: px(left), y: px(top),
                                    width: px(wpx), height: px(hpx) }));
    var cu = copper(g, s, true);
    cu.setAttribute("transform", "translate(" + px(cx) + " " + px(cy) + ")");
    svg.appendChild(cu);

    // taxel width (top) and height (left)
    var d = "M" + px(left) + " " + (top - 16) + "v10M" + px(left + wpx) + " " + (top - 16) + "v10M" +
            px(left) + " " + (top - 11) + "H" + px(left + wpx) +
            "M" + (left - 16) + " " + px(top) + "h10M" + (left - 16) + " " + px(top + hpx) + "h10M" +
            (left - 11) + " " + px(top) + "V" + px(top + hpx);
    svg.appendChild(svgEl("path", { class: "ot-qr-dim", d: d }));
    svg.appendChild(svgEl("text", { x: px(cx), y: top - 15, "text-anchor": "middle" }, mm(core.w) + " mm"));
    var ly = px(cy), lx = left - 15;
    svg.appendChild(svgEl("text", { x: lx, y: ly, "text-anchor": "middle",
                                    transform: "rotate(-90 " + lx + " " + ly + ")" }, mm(core.h) + " mm"));

    // trace and gap, measured on the top two fingers
    var f0 = cy + geo.y0 * s, f1 = cy + (geo.y0 + geo.pitch) * s, half = fp.trace_w * s / 2;
    var bx = left + wpx + 8;
    var bars = [["trace " + mm(fp.trace_w), f0 - half, f0 + half],
                ["gap " + mm(fp.gap), f0 + half, f1 - half]];
    if (geo.totalSlots < 2) bars.pop();
    var lastY = -Infinity;
    bars.forEach(function (b) {
      svg.appendChild(svgEl("path", { class: "ot-qr-dim",
        d: "M" + px(bx) + " " + px(b[1]) + "h6M" + px(bx) + " " + px(b[2]) + "h6M" +
           px(bx + 3) + " " + px(b[1]) + "V" + px(b[2]) }));
      var t = Math.max((b[1] + b[2]) / 2 + FONT * 0.36, lastY + 13);
      lastY = t;
      svg.appendChild(svgEl("text", { x: px(bx + 11), y: px(t) }, b[0]));
    });
    return svg;
  }

  // ------------------------------------------------------------ the fields

  function fieldRows(g) {
    var res = g.res, core = g.core, t = res.trace, fp = g.fp;
    var nTaxels = g.present.length, nGrid = core.r * core.c;
    var square = core.pitch_x === core.pitch_y && core.w === core.h;
    var fpDefault = OpenTacQR.FP_DEFAULT.every(function (kv) { return fp[kv[0]] === kv[1]; });
    var names = { trace_w: "trace", gap: "gap", center_clear: "centre clearance",
                  edge_clear: "edge clearance", via_dia: "via", via_drill: "drill" };
    var fpText = ["trace_w", "gap", "center_clear", "edge_clear", "via_dia", "via_drill"].map(function (k) {
      var differs = OpenTacQR.FP_DEFAULT.some(function (kv) { return kv[0] === k && kv[1] !== fp[k]; });
      return names[k] + " " + mm2(fp[k]) + (differs ? " (not default)" : "");
    }).join(", ") + " mm";
    function lattice(k) {
      var full = k.length && k[k.length - 1] === k.length - 1;
      return full ? "every one on the pitch" :
        "lattice slots " + runs(k) + " (" + plural(k[k.length - 1] + 1 - k.length, "slot", "slots") + " skipped)";
    }
    var order = g.rows.filter(function (row) { return row.y !== null; })
      .sort(function (a, b) { return a.rank - b.rank; }).map(function (row) { return row.i; });
    var nb = core.r ? t.perm / core.r : 0;
    return [
      ["Format version", "0", t.version,
       "Identifies the encoded field layout. This decoder supports version 0."],
      ["Grid", core.r + " rows x " + core.c + " columns", t.grid,
       "Row and column lines the readout scans; 6 bits each, so up to 63."],
      ["Taxels", nTaxels + " of " + nGrid + " grid positions" +
       (nGrid > nTaxels ? " (" + (nGrid - nTaxels) + " empty)" : ""), t.mask,
       "One bit per row and column crossing: taxel or none. " +
       (t.maskRle ? "Run-length coded here, which was shorter." : "Stored bit by bit here, which was shorter.")],
      ["Pitch", square ? mm2(core.pitch_x) + " mm, x and y" :
       "x " + mm2(core.pitch_x) + " mm, y " + mm2(core.pitch_y) + " mm", t.pitch,
       "Centre-to-centre taxel spacing. One bit records whether the x and y pitches are equal."],
      ["Taxel size", mm2(core.w) + " x " + mm2(core.h) + " mm", t.size,
       "Outer dimensions of one taxel’s copper, encoded relative to its pitch."],
      ["Grid origin", "x " + mm2(core.x0) + ", y " + mm2(core.y0) + " mm", t.origin,
       "Centre of the leftmost column and the top row. Y points up; (0, 0) is the middle of the " +
       "cable edge and the origin of the grid printed on the back."],
      ["Column positions", lattice(core.kx), t.cols,
       "One bit, plus a map of the occupied slots when columns skip pitch positions."],
      ["Row positions", lattice(core.ky), t.rows,
       "The same for rows."],
      ["Row order", "top to bottom: " + runs(order), t.perm,
       "Rows are numbered in connector order, not top to bottom; " + plural(nb, "bit", "bits") +
       " per row give its place."],
      ["Row contacts", runs(core.rp), t.pads,
       "Connector contact of each row line. Only the first is stored; the rest follow in order."],
      ["Column contacts", runs(core.cp), 0,
       "Straight after the row contacts, so not stored."],
      ["Contact pitch", core.pad_pitch_mm ? mm2(core.pad_pitch_mm) + " mm" : "not 0.5 mm (not stored)",
       t.padPitch, "Pitch of the FPC contacts at the end of the cable."],
      ["Electrode pattern", (fpDefault ? "default: " : "") + fpText, t.footprint,
       "The interdigitated copper of each taxel, drawn above. One bit says all default; " +
       "otherwise each value that differs takes 8 bits."],
      ["Reserved", "0", t.reserved, "Unused. It was a flag on early boards."],
      ["Padding", "", t.padding, "Fills the last byte."],
      ["Checksum", "CRC-8 0x" + ("0" + t.crcValue.toString(16).toUpperCase()).slice(-2) + ", matches",
       t.crc, "Detects most changes to the encoded text, allowing damaged payloads to be rejected rather than " +
       "read as a different sensor."]
    ];
  }

  function fieldsTable(g) {
    var res = g.res, total = 0;
    var table = el("table", { class: "ot-qr__table" });
    var head = el("tr");
    head.appendChild(el("th", {}, "Field"));
    head.appendChild(el("th", {}, "Value"));
    head.appendChild(el("th", { class: "ot-qr__num" }, "Bits"));
    table.appendChild(el("thead")).appendChild(head);
    var body = table.appendChild(el("tbody"));
    fieldRows(g).forEach(function (f) {
      total += f[2];
      var tr = el("tr");
      var name = el("td");
      name.appendChild(el("strong", {}, f[0]));
      name.appendChild(el("span", { class: "ot-qr__meaning" }, f[3]));
      tr.appendChild(name);
      tr.appendChild(el("td", {}, f[1]));
      tr.appendChild(el("td", { class: "ot-qr__num" }, String(f[2])));
      body.appendChild(tr);
    });
    var foot = el("tr");
    var name = el("td");
    name.appendChild(el("strong", {}, "Total"));
    name.appendChild(el("span", { class: "ot-qr__meaning" },
      "Written as base41 text, 3 characters for every 2 bytes, after the link prefix " +
      OpenTacQR.LINK_PREFIX + "."));
    foot.appendChild(name);
    foot.appendChild(el("td", {}, res.payload.length + " characters, " + res.bytes + " bytes"));
    foot.appendChild(el("td", { class: "ot-qr__num" }, String(total)));
    table.appendChild(el("tfoot")).appendChild(foot);
    return table;
  }

  function derivedTable(g) {
    var core = g.core, geo = g.geo, rows = [];
    rows.push(["Taxel positions", g.present.length + " (x, y) pairs",
               "Origin plus lattice slot times pitch, for each taxel the grid map marks."]);
    if (g.conn) {
      var board = g.conn.n === 30 || g.conn.n === 60 ? "fits the OpenTac " + g.conn.n + "-pin readout board" :
                  "no OpenTac readout board has this size";
      rows.push(["Connector", g.conn.n + " contacts; " + board,
                 "OpenTac-CAD gives rows and columns one half of the connector each, so the last " +
                 "row contact is half the connector."]);
    }
    if (geo) {
      var nRow = Math.ceil(geo.totalSlots / 2), nCol = Math.floor(geo.totalSlots / 2);
      rows.push(["Fingers", nRow + " row, " + nCol + " column",
                 "From the taxel height, trace and gap, as OpenTac-CAD lays them out."]);
    }
    if (core.pitch_x === core.pitch_y)
      rows.push(["Calibration identifier", "p" + OpenTacQR.pyRound(core.pitch_x, 1).toFixed(1) + "_gap" +
                 OpenTacQR.pyRound(g.fp.gap, 1).toFixed(1),
                 "Pitch and gap identify a calibration entry. The material, readout settings and measured force mapping must be supplied separately."]);
    var table = el("table", { class: "ot-qr__table" });
    var head = el("tr");
    ["Derived field", "Value"].forEach(function (h) { head.appendChild(el("th", {}, h)); });
    table.appendChild(el("thead")).appendChild(head);
    var body = table.appendChild(el("tbody"));
    rows.forEach(function (f) {
      var tr = el("tr"), name = el("td");
      name.appendChild(el("strong", {}, f[0]));
      name.appendChild(el("span", { class: "ot-qr__meaning" }, f[2]));
      tr.appendChild(name);
      tr.appendChild(el("td", {}, f[1]));
      body.appendChild(tr);
    });
    return table;
  }

  function connections(g) {
    var det = el("details", { class: "ot-qr__details" });
    det.appendChild(el("summary", {}, "Row and column assignments (" + (g.core.r + g.core.c) + ")"));
    [["Row", "y (mm)", g.rows, "y"], ["Column", "x (mm)", g.cols, "x"]].forEach(function (spec) {
      var table = el("table", { class: "ot-qr__table ot-qr__table--lines" });
      var head = el("tr");
      [spec[0], "Contact", spec[1], "Taxels"].forEach(function (h) {
        head.appendChild(el("th", { class: "ot-qr__num" }, h));
      });
      table.appendChild(el("thead")).appendChild(head);
      var body = table.appendChild(el("tbody"));
      spec[2].forEach(function (line) {
        var tr = el("tr");
        tr.appendChild(el("td", { class: "ot-qr__num" }, String(line.i)));
        tr.appendChild(el("td", { class: "ot-qr__num" }, String(line.pad)));
        tr.appendChild(el("td", { class: "ot-qr__num" },
                          line[spec[3]] === null ? "not stored" : mm2(line[spec[3]])));
        tr.appendChild(el("td", { class: "ot-qr__num" }, String(line.n)));
        body.appendChild(tr);
      });
      det.appendChild(table);
    });
    return det;
  }

  function notCarried() {
    var wrap = el("div");
    var ul = el("ul");
    [
      "The board outline and cut edge, including the cable tail. Photograph the back: the 5 mm " +
      "grid printed there makes the photo measurable.",
      "The routing: the traces from each row and column to the connector.",
      "The design recipe OpenTac-CAD needs to edit or rebuild the board: the drawn shape, copper " +
      "layer count, board mode and the other settings.",
      "Which taxels share a shear bump, and the printed case and velostat cut files.",
      "A force calibration. The identifier above refers to a curve; the measured calibration is not encoded."
    ].forEach(function (t) { ul.appendChild(el("li", {}, t)); });
    wrap.appendChild(ul);
    var p = el("p", {}, "The design ZIP supplies the complete layout and design files. Force calibration must be provided separately. See ");
    p.appendChild(el("a", { href: "../use/qr-recovery/" }, "Recover a manifest from the QR code"));
    p.appendChild(document.createTextNode("."));
    wrap.appendChild(p);
    return wrap;
  }

  // ------------------------------------------------------------ the result

  function figures(root) {
    var out = root.querySelector(".ot-qr__result");
    var avail = out.clientWidth || 600;
    var board = out.querySelector(".ot-qr__fig--board"), taxel = out.querySelector(".ot-qr__fig--taxel");
    var b = drawBoard(shown, avail);
    board.replaceChild(b.svg, board.firstChild);
    board.lastChild.textContent = nb(
      "To scale, seen from the taxel side" + (b.detailed ? ", with each taxel's copper" : "") +
      ". Plain numbers: row and column as the readout reports them. Coloured numbers: their " +
      "connector contacts (blue rows, red columns)" + (b.thinned ? "; some are left out for room, " +
      "all are listed below" : "") + ". Dashed squares: grid positions with no taxel. The cross is " +
      "(0, 0), the middle of the cable edge; the cable leaves downwards, and the contacts are drawn " +
      "at their x positions.");
    if (taxel) taxel.replaceChild(drawTaxel(shown, avail), taxel.firstChild);
    shown.width = avail;
  }

  function show(root, text) {
    var out = root.querySelector(".ot-qr__result");
    out.textContent = "";
    shown = null;
    var res;
    try {
      res = OpenTacQR.fromText(text);
    } catch (e) {
      out.appendChild(el("p", { class: "ot-qr__error" },
        "Unable to decode this QR content: " + e.message + ". Rescan the code or paste the complete scanned text below."));
      return;
    }
    var g = layout(res), core = g.core;
    shown = g;

    out.appendChild(el("p", { class: "ot-qr__status" },
      "Read " + plural(g.present.length, "taxel", "taxels") + ": grid " + core.r + " x " + core.c +
      ", pitch " + mm(core.pitch_x) + (core.pitch_x === core.pitch_y ? "" : " x " + mm(core.pitch_y)) +
      " mm. The checksum matches."));

    if (blobUrl) URL.revokeObjectURL(blobUrl);
    blobUrl = URL.createObjectURL(new Blob([res.json], { type: "application/json" }));
    out.appendChild(el("a", { href: blobUrl, download: "manifest.json",
                              class: "ot-qr__btn ot-qr__btn--primary" }, "Download manifest.json"));
    // The link, in single quotes: the code can hold '$' and '*', which a shell
    // expands, and can start with '-', which reads as an option.
    out.appendChild(el("p", {}, "Or, with the OpenTac package installed:"));
    var pre = el("pre");
    pre.appendChild(el("code", {}, "uv run opentac manifest from-qr '" + OpenTacQR.link(res.payload) +
                                    "' -o manifest.json"));
    out.appendChild(pre);

    out.appendChild(el("h2", {}, "Recovered sensor layout"));
    var board = el("figure", { class: "ot-qr__fig ot-qr__fig--board" });
    board.appendChild(el("span"));
    board.appendChild(el("figcaption"));
    out.appendChild(board);

    if (g.geo) {
      out.appendChild(el("h2", {}, "Taxel electrode geometry"));
      var taxel = el("figure", { class: "ot-qr__fig ot-qr__fig--taxel" });
      taxel.appendChild(el("span"));
      var nRow = Math.ceil(g.geo.totalSlots / 2), nCol = Math.floor(g.geo.totalSlots / 2);
      taxel.appendChild(el("figcaption", {},
        "One taxel, seen from the taxel side, drawn from the size and electrode values in the code " +
        "with the rule OpenTac-CAD uses to write the KiCad footprint. Blue: the row electrode, a " +
        "spine on the left and " + plural(nRow, "finger", "fingers") + "; its via (" + mm(g.fp.via_dia) +
        " mm, " + mm(g.fp.via_drill) + " mm drill) joins the row line on another copper layer. Red: " +
        "the column electrode, a spine on the right and " + plural(nCol, "finger", "fingers") +
        ". Each finger stops " + mm(g.fp.center_clear) + " mm short of the other spine, and the " +
        "copper stays " + mm(g.fp.edge_clear) + " mm inside the taxel edge."));
      out.appendChild(taxel);
    }

    out.appendChild(el("h2", {}, "Encoded fields"));
    var wrap = el("div", { class: "ot-qr__tablewrap" });
    wrap.appendChild(fieldsTable(g));
    out.appendChild(wrap);
    var wrap2 = el("div", { class: "ot-qr__tablewrap" });
    wrap2.appendChild(derivedTable(g));
    out.appendChild(wrap2);
    out.appendChild(connections(g));

    out.appendChild(el("h2", {}, "Fields omitted from the QR code"));
    out.appendChild(notCarried());

    figures(root);
  }

  function setup() {
    var root = document.getElementById("ot-qr");
    if (!root) return;
    var input = root.querySelector("textarea");
    var form = root.querySelector("form");
    var hash = location.hash.replace(/^#/, "");
    try { hash = decodeURIComponent(hash); } catch (e) { /* keep it as it is */ }
    if (hash) {
      input.value = hash;
      show(root, hash);
    } else {
      root.querySelector(".ot-qr__result").appendChild(el("p", {},
        "No QR content was supplied. Scan the sensor’s code with a phone camera, " +
        "paste the scanned text, or select an example below."));
    }
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      show(root, input.value);
    });
    window.addEventListener("hashchange", function () {
      var h = location.hash.replace(/^#/, "");
      try { h = decodeURIComponent(h); } catch (e) { /* as it is */ }
      if (h) {
        input.value = h;
        show(root, h);
        root.scrollIntoView();
      }
    });
    var timer = null;
    window.addEventListener("resize", function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        var out = root.querySelector(".ot-qr__result");
        if (shown && Math.abs(out.clientWidth - shown.width) > 8) figures(root);
      }, 150);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup);
  else setup();
})();

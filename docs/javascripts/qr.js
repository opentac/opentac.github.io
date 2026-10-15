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

  function decode(data) {
    if (data.length < 2) throw QRError("payload too short to be a taxel core");
    var body = data.slice(0, -1), got = data[data.length - 1], want = crc8(body);
    if (got !== want)
      throw QRError("checksum mismatch: the scanned text was altered or is incomplete");
    var b = new BitReader(body);
    var version = b.u(2);
    if (version !== MAGIC_VERSION) throw QRError("unknown taxel-core version " + version);
    var square = b.u(1), fpDefault = b.u(1), sparseX = b.u(1), sparseY = b.u(1);
    b.u(1);                                   // reserved
    var padPitch05 = b.u(1);
    var r = b.u(6), c = b.u(6);
    var pitchX = b.uvarint() / Q;
    var pitchY = square ? pitchX : b.uvarint() / Q;
    var w = pitchX + b.varint() / Q;
    var h = square ? w : pitchY + b.varint() / Q;
    var x0 = b.varint() / Q;
    var y0 = b.varint() / Q;
    var rp0 = b.u(6);

    var footprint = FP_DEFAULT.map(function (kv) { return [kv[0], kv[1]]; });
    if (!fpDefault) {
      FP_KEYS.forEach(function (k) {
        if (b.u(1)) {
          var val = b.u(8) / Q;
          footprint.forEach(function (kv) { if (kv[0] === k) kv[1] = val; });
        }
      });
    }

    var kx, ky = null, n, k;
    if (sparseX) {
      n = b.u(6); kx = [];
      for (k = 0; k < n; k++) if (b.u(1)) kx.push(k);
    } else {
      kx = []; for (k = 0; k < c; k++) kx.push(k);
    }
    if (sparseY) {
      n = b.u(6); ky = [];
      for (k = 0; k < n; k++) if (b.u(1)) ky.push(k);
    }
    var nRowsGeo = ky !== null ? ky.length : r;
    var nb = bitwidth(nRowsGeo), perm = [];
    for (k = 0; k < r; k++) perm.push(b.u(nb));
    if (ky === null) { ky = []; for (k = 0; k < nRowsGeo; k++) ky.push(k); }

    var mask = readMask(b, r, c);
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

  // Scanned text -> {payload, raw, json}. `raw` holds PyFloat objects; plain()
  // turns it into ordinary JSON values.
  function fromText(text) {
    var payload = payloadFromText(text);
    if (!payload) throw QRError("empty payload");
    if (payload.length % 3 === 1)
      throw QRError("the text is " + payload.length + " characters long, which base41 cannot be: " +
                    "it is truncated or had a character removed");
    var raw = toManifest(decode(b41decode(payload)));
    validate(raw);
    return { payload: payload, raw: raw, json: dumps(raw) + "\n" };
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
    B41: B41, LINK_PREFIX: LINK_PREFIX, ABSENT: ABSENT,
    payloadFromText: payloadFromText, fromText: fromText, plain: plain, link: link,
    floatRepr: floatRepr, pyRound: pyRound, dumps: dumps, PyFloat: PyFloat
  };
});

// ------------------------------------------------------------------ the page

(function () {
  "use strict";
  if (typeof document === "undefined") return;

  var SVG = "http://www.w3.org/2000/svg";
  var blobUrl = null;

  function el(tag, attrs, text) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (text != null) e.textContent = text;
    return e;
  }

  function svgEl(tag, attrs) {
    var e = document.createElementNS(SVG, tag);
    Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  function fmt(x) { return String(Math.round(x * 100) / 100); }

  function ranges(list) {
    // [3, 4, 5, 9] -> "3-5, 9"
    var out = [], i = 0;
    while (i < list.length) {
      var j = i;
      while (j + 1 < list.length && list[j + 1] === list[j] + 1) j++;
      out.push(i === j ? String(list[i]) : list[i] + "-" + list[j]);
      i = j + 1;
    }
    return out.join(", ");
  }

  function drawTaxels(m) {
    var xs = m.pixels.map(function (p) { return p[0]; });
    var ys = m.pixels.map(function (p) { return p[1]; });
    var pad = Math.max(m.w, m.h);
    var x0 = Math.min.apply(null, xs) - pad, x1 = Math.max.apply(null, xs) + pad;
    var y0 = Math.min.apply(null, ys) - pad, y1 = Math.max.apply(null, ys) + pad;
    var svg = svgEl("svg", {
      viewBox: [x0, -y1, x1 - x0, y1 - y0].map(fmt).join(" "),
      role: "img", class: "ot-qr__svg",
      "aria-label": m.pixels.length + " taxels, " + m.r + " rows by " + m.c + " columns"
    });
    m.pixels.forEach(function (p) {
      svg.appendChild(svgEl("rect", {
        x: fmt(p[0] - m.w / 2), y: fmt(-p[1] - m.h / 2),
        width: fmt(m.w), height: fmt(m.h), rx: fmt(Math.min(m.w, m.h) * 0.08)
      }));
    });
    return svg;
  }

  function show(root, text) {
    var out = root.querySelector(".ot-qr__result");
    out.textContent = "";
    var res;
    try {
      res = OpenTacQR.fromText(text);
    } catch (e) {
      out.appendChild(el("p", { class: "ot-qr__error" },
        "Could not read this code: " + e.message + ". Scan it again, or paste the text below."));
      return;
    }
    var m = OpenTacQR.plain(res.raw);

    var pitch = m.px === -m.py ? fmt(m.px) + " mm" : fmt(m.px) + " x " + fmt(-m.py) + " mm";
    var size = m.w === m.h ? fmt(m.w) + " mm" : fmt(m.w) + " x " + fmt(m.h) + " mm";
    var dl = el("dl", { class: "ot-qr__facts" });
    [["Grid", m.r + " rows x " + m.c + " columns"],
     ["Taxels", String(m.pixels.length)],
     ["Pitch", pitch],
     ["Taxel size", size],
     ["Row pads", ranges(m.rp)],
     ["Column pads", ranges(m.cp)],
     ["Connector", m.pad_pitch_mm ? m.pad_pitch_mm + " mm pitch FPC, " + (m.rp.length + m.cp.length) +
       " pads used" : (m.rp.length + m.cp.length) + " pads used"]
    ].forEach(function (kv) { dl.appendChild(el("dt", {}, kv[0])); dl.appendChild(el("dd", {}, kv[1])); });
    out.appendChild(dl);

    var fig = el("figure", { class: "ot-qr__figure" });
    fig.appendChild(drawTaxels(m));
    fig.appendChild(el("figcaption", {},
      "Taxel positions decoded from the code, seen from the taxel side. The board outline is not in the code."));
    out.appendChild(fig);

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
    out.appendChild(el("p", {},
      "The file has no outline, edge cuts, design recipe or shear bump grouping: the code does not " +
      "carry them. It has what the readout board and the viewer need: rows, columns, pads, the taxel " +
      "mask and the taxel positions (the code stores the grid origin and pitch to 0.01 mm)."));
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
        "No code in the address. Scan the code on the back of the sensor with a phone camera, " +
        "or paste the text a QR scanner read off it."));
    }
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      show(root, input.value);
    });
    window.addEventListener("hashchange", function () {
      var h = location.hash.replace(/^#/, "");
      try { h = decodeURIComponent(h); } catch (e) { /* as it is */ }
      if (h) { input.value = h; show(root, h); }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup);
  else setup();
})();

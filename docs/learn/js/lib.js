/* Shared helpers for the "How it works" figures: data loading, theme colours,
 * canvas setup, small controls. Each study registers with OTL.study(). */
(function () {
  'use strict';
  var script = document.currentScript;
  var DATA = new URL('../data/', script ? script.src : location.href).href;
  var cache = {};
  var studies = {};
  var themeListeners = [];

  function loadJSON(name) {
    if (!cache[name]) {
      cache[name] = fetch(DATA + name).then(function (r) {
        if (!r.ok) throw new Error(name + ': ' + r.status);
        return r.json();
      });
    }
    return cache[name];
  }

  // ---- colours ---------------------------------------------------------------

  var theme = null;
  function parseColor(s) {
    s = (s || '').trim();
    var m;
    if ((m = s.match(/^#([0-9a-f]{6})$/i))) {
      var v = parseInt(m[1], 16);
      return [(v >> 16) & 255, (v >> 8) & 255, v & 255, 1];
    }
    if ((m = s.match(/^rgba?\(([^)]+)\)$/))) {
      var p = m[1].split(',').map(parseFloat);
      return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
    }
    return [128, 128, 128, 1];
  }
  function readTheme() {
    var el = document.querySelector('.otl') || document.body;
    var cs = getComputedStyle(el);
    var v = function (n) { return cs.getPropertyValue(n).trim(); };
    // Material's ink colours may be hsla(); let the browser resolve them.
    var probe = document.createElement('span');
    el.appendChild(probe);
    function resolve(name) { probe.style.color = 'var(' + name + ')'; return getComputedStyle(probe).color; }
    var t = {
      ink: resolve('--otl-ink'), ink2: resolve('--otl-ink-2'), ink3: resolve('--otl-ink-3'),
      line: resolve('--otl-line'), hair: resolve('--otl-hair'), bg: resolve('--otl-bg'),
      panel: v('--otl-panel'), accent: v('--otl-accent'), accent2: v('--otl-accent-2'),
      copper: v('--otl-copper'), copper2: v('--otl-copper-2'), pcb: v('--otl-pcb'),
      film: v('--otl-film'), textile: v('--otl-textile'), tpu: v('--otl-tpu'), base: v('--otl-base'),
      warn: v('--otl-warn'),
      font: cs.fontFamily || 'sans-serif',
      dark: document.body.getAttribute('data-md-color-scheme') === 'slate'
    };
    el.removeChild(probe);
    t.seq = [];
    for (var i = 0; i < 8; i++) t.seq.push(parseColor(v('--otl-seq-' + i)));
    theme = t;
    return t;
  }
  function getTheme() { return theme || readTheme(); }
  // Sequential colour for v in [0, 1].
  function seq(v) {
    var s = getTheme().seq;
    if (!(v > 0)) v = 0;
    if (v > 1) v = 1;
    var x = v * (s.length - 1), i = Math.min(s.length - 2, Math.floor(x)), f = x - i;
    var a = s[i], b = s[i + 1];
    return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * f) + ',' + Math.round(a[1] + (b[1] - a[1]) * f) +
      ',' + Math.round(a[2] + (b[2] - a[2]) * f) + ')';
  }
  function alpha(color, a) {
    var c = parseColor(color);
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (c[3] * a) + ')';
  }
  function onTheme(cb) { themeListeners.push(cb); }
  function themeChanged() {
    readTheme();
    themeListeners.forEach(function (cb) { cb(); });
  }

  // ---- canvas ----------------------------------------------------------------

  // A canvas that keeps its backing store at device resolution. height(w) gives
  // the CSS height for a CSS width. draw(ctx, w, h) is called on every redraw.
  function Canvas(canvas, height, draw) {
    this.el = canvas;
    this.height = height;
    this.drawFn = draw;
    this.w = 0; this.h = 0;
    var self = this, pending = false;
    this.redraw = function () {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () { pending = false; self.paint(); });
    };
    if (window.ResizeObserver) new ResizeObserver(this.redraw).observe(canvas.parentElement);
    onTheme(this.redraw);
  }
  Canvas.prototype.paint = function () {
    var cw = this.el.parentElement.clientWidth || 600;
    var ch = Math.round(this.height(cw));
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    if (this.el.width !== Math.round(cw * dpr) || this.el.height !== Math.round(ch * dpr)) {
      this.el.width = Math.round(cw * dpr);
      this.el.height = Math.round(ch * dpr);
      this.el.style.height = ch + 'px';
    }
    var ctx = this.el.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);
    this.w = cw; this.h = ch;
    this.drawFn(ctx, cw, ch);
  };

  // ---- drawing helpers -------------------------------------------------------

  var draw = {
    text: function (ctx, s, x, y, opt) {
      opt = opt || {};
      var t = getTheme();
      ctx.font = (opt.weight || '') + ' ' + (opt.size || 11) + 'px ' + t.font;
      ctx.fillStyle = opt.color || t.ink2;
      ctx.textAlign = opt.align || 'left';
      ctx.textBaseline = opt.base || 'alphabetic';
      ctx.fillText(s, x, y);
    },
    line: function (ctx, x1, y1, x2, y2, color, width, dash) {
      ctx.save();
      ctx.strokeStyle = color; ctx.lineWidth = width || 1;
      if (dash) ctx.setLineDash(dash);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.restore();
    },
    arrow: function (ctx, x, y, dx, dy, color, width, head) {
      var len = Math.hypot(dx, dy);
      if (len < 0.5) return;
      width = width || 1.5;
      var a = Math.atan2(dy, dx), hs = Math.min(head || 6 + width, len * 0.6);
      ctx.save();
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.lineTo(x + dx - hs * 0.7 * Math.cos(a), y + dy - hs * 0.7 * Math.sin(a)); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + dx, y + dy);
      ctx.lineTo(x + dx - hs * Math.cos(a - 0.42), y + dy - hs * Math.sin(a - 0.42));
      ctx.lineTo(x + dx - hs * Math.cos(a + 0.42), y + dy - hs * Math.sin(a + 0.42));
      ctx.closePath(); ctx.fill();
      ctx.restore();
    },
    poly: function (ctx, pts, fill, stroke, width) {
      ctx.beginPath();
      for (var i = 0; i < pts.length; i++) {
        if (i) ctx.lineTo(pts[i][0], pts[i][1]); else ctx.moveTo(pts[i][0], pts[i][1]);
      }
      ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width || 1; ctx.stroke(); }
    },
    circle: function (ctx, x, y, r, fill, stroke, width) {
      ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, 2 * Math.PI);
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width || 1; ctx.stroke(); }
    },
    // Horizontal colour bar with end labels.
    colorbar: function (ctx, x, y, w, label0, label1, caption) {
      for (var i = 0; i < 64; i++) {
        ctx.fillStyle = seq(i / 63);
        ctx.fillRect(x + i * w / 64, y, w / 64 + 0.6, 6);
      }
      ctx.strokeStyle = getTheme().hair; ctx.lineWidth = 1; ctx.strokeRect(x + .5, y + .5, w - 1, 5);
      draw.text(ctx, label0, x, y + 17, {size: 10});
      draw.text(ctx, label1, x + w, y + 17, {size: 10, align: 'right'});
      if (caption) draw.text(ctx, caption, x + w / 2, y + 17, {size: 10, align: 'center'});
    },
    scalebar: function (ctx, x, y, px, label) {
      var t = getTheme();
      draw.line(ctx, x, y, x + px, y, t.ink2, 1.5);
      draw.line(ctx, x, y - 3, x, y + 3, t.ink2, 1);
      draw.line(ctx, x + px, y - 3, x + px, y + 3, t.ink2, 1);
      draw.text(ctx, label, x + px / 2, y - 5, {size: 10, align: 'center'});
    }
  };

  // Map a millimetre box (Y up) into a pixel rectangle, preserving aspect.
  function fit(box, rect, pad) {
    pad = pad || 0;
    var bw = box[2] - box[0], bh = box[3] - box[1];
    var s = Math.min((rect[2] - 2 * pad) / bw, (rect[3] - 2 * pad) / bh);
    var ox = rect[0] + (rect[2] - bw * s) / 2, oy = rect[1] + (rect[3] - bh * s) / 2;
    return {
      s: s,
      x: function (mx) { return ox + (mx - box[0]) * s; },
      y: function (my) { return oy + (box[3] - my) * s; },
      mx: function (px) { return box[0] + (px - ox) / s; },
      my: function (py) { return box[3] - (py - oy) / s; }
    };
  }
  function bbox(points, extra) {
    var b = [Infinity, Infinity, -Infinity, -Infinity];
    points.forEach(function (p) {
      b[0] = Math.min(b[0], p[0]); b[1] = Math.min(b[1], p[1]);
      b[2] = Math.max(b[2], p[0]); b[3] = Math.max(b[3], p[1]);
    });
    if (extra) { b[0] -= extra; b[1] -= extra; b[2] += extra; b[3] += extra; }
    return b;
  }

  // ---- skins -----------------------------------------------------------------

  // Derived geometry for a skin from skins.json: bounding box, and each
  // taxel's (row, col) on the geometric grid (row 0 at the top), which is NOT
  // the scan index -- see the manifest readme.
  function skinGeom(skin) {
    if (skin._g) return skin._g;
    var xs = {}, ys = {};
    skin.xy.forEach(function (p) { xs[p[0].toFixed(2)] = p[0]; ys[p[1].toFixed(2)] = p[1]; });
    var xv = Object.keys(xs).map(function (k) { return xs[k]; }).sort(function (a, b) { return a - b; });
    var yv = Object.keys(ys).map(function (k) { return ys[k]; }).sort(function (a, b) { return b - a; });
    var p = skin.pitch;
    var row = skin.xy.map(function (q) { return Math.round((yv[0] - q[1]) / p); });
    var col = skin.xy.map(function (q) { return Math.round((q[0] - xv[0]) / p); });
    var box = bbox(skin.outline.concat(skin.xy), 0);
    var cx = 0, cy = 0;
    skin.xy.forEach(function (q) { cx += q[0]; cy += q[1]; });
    skin._g = {box: box, row: row, col: col,
               rows: Math.max.apply(null, row) + 1, cols: Math.max.apply(null, col) + 1,
               x0: xv[0], y0: yv[0], centroid: [cx / skin.n, cy / skin.n]};
    return skin._g;
  }

  // Taxels as their real footprints (w x h at pixels[k]); fill(k) gives a
  // colour or null to skip; stroke(k) an optional outline colour.
  function drawSkin(ctx, view, skin, fill, opt) {
    opt = opt || {};
    var t = getTheme(), hw = skin.w / 2, hh = skin.h / 2, s = view.s;
    if (opt.outline !== false) {
      draw.poly(ctx, skin.outline.map(function (q) { return [view.x(q[0]), view.y(q[1])]; }),
                null, t.ink3, 1);
    }
    for (var k = 0; k < skin.n; k++) {
      var c = fill(k);
      if (!c) continue;
      var x = view.x(skin.xy[k][0] - hw), y = view.y(skin.xy[k][1] + hh);
      var gap = s * skin.w > 5 ? 0.6 : 0.2;
      ctx.fillStyle = c;
      ctx.fillRect(x + gap / 2, y + gap / 2, skin.w * s - gap, skin.h * s - gap);
      if (opt.stroke) {
        var sc = opt.stroke(k);
        if (sc) { ctx.strokeStyle = sc; ctx.lineWidth = 1; ctx.strokeRect(x + 1, y + 1, skin.w * s - 2, skin.h * s - 2); }
      }
    }
  }

  // ---- controls -------------------------------------------------------------

  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else e.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }
  // Segmented single choice. options: [[value, label], ...]
  function seg(label, options, value, onChange) {
    var wrap = el('div', {class: 'otl-ctl'});
    if (label) wrap.appendChild(el('span', {class: 'otl-lab', text: label}));
    var group = el('div', {class: 'otl-seg', role: 'group', 'aria-label': label || ''});
    var buttons = options.map(function (o) {
      var b = el('button', {type: 'button', text: o[1], 'aria-pressed': String(o[0] === value)});
      b.addEventListener('click', function () { api.set(o[0]); onChange(o[0]); });
      group.appendChild(b);
      return b;
    });
    wrap.appendChild(group);
    var api = {
      el: wrap, value: value,
      set: function (v) {
        api.value = v;
        buttons.forEach(function (b, i) { b.setAttribute('aria-pressed', String(options[i][0] === v)); });
      }
    };
    return api;
  }
  function slider(label, min, max, step, value, fmt, onInput) {
    var wrap = el('label', {class: 'otl-ctl'});
    var input = el('input', {type: 'range', min: min, max: max, step: step, value: value});
    var out = el('output', {text: fmt(value)});
    wrap.appendChild(el('span', {class: 'otl-lab', text: label}));
    wrap.appendChild(input);
    wrap.appendChild(out);
    input.addEventListener('input', function () { out.textContent = fmt(+input.value); onInput(+input.value); });
    return {
      el: wrap, input: input,
      get value() { return +input.value; },
      set: function (v) { input.value = v; out.textContent = fmt(+input.value); }
    };
  }
  function check(label, value, onChange) {
    var wrap = el('label', {class: 'otl-check'});
    var input = el('input', {type: 'checkbox'});
    input.checked = value;
    wrap.appendChild(input);
    wrap.appendChild(document.createTextNode(label));
    input.addEventListener('change', function () { onChange(input.checked); });
    return {el: wrap, input: input, get value() { return input.checked; },
            set: function (v) { input.checked = v; }};
  }
  function button(label, onClick) {
    var b = el('button', {type: 'button', class: 'otl-btn', text: label});
    b.addEventListener('click', onClick);
    return b;
  }
  function metrics(container, items) {
    var row = el('div', {class: 'otl-metrics'}), out = {};
    items.forEach(function (it) {
      var b = el('b', {text: '—'});
      var lab = el('span');
      lab.innerHTML = it[1];            // static labels written in this page's scripts
      var m = el('div', {class: 'otl-metric'}, [lab, b]);
      row.appendChild(m);
      out[it[0]] = b;
    });
    container.appendChild(row);
    return out;
  }

  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Pointer drags on a canvas. cb(x, y, phase) with phase 'down'|'move'|'up';
  // returning false from 'down' ignores the drag.
  function drag(canvas, cb) {
    var active = false;
    function pos(e) { var r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    canvas.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      var p = pos(e);
      if (cb(p[0], p[1], 'down') === false) return;
      active = true;
      canvas.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!active) return;
      var p = pos(e); cb(p[0], p[1], 'move');
    });
    ['pointerup', 'pointercancel'].forEach(function (t) {
      canvas.addEventListener(t, function (e) {
        if (!active) return;
        active = false;
        var p = pos(e); cb(p[0], p[1], 'up');
      });
    });
  }

  // ---- registration ----------------------------------------------------------

  function study(name, init) { studies[name] = init; }

  function start() {
    var figs = document.querySelectorAll('.otl-fig[data-study]:not([data-ready])');
    if (!figs.length) return;
    readTheme();
    var run = function (fig) {
      if (fig.getAttribute('data-ready')) return;
      fig.setAttribute('data-ready', '1');
      var init = studies[fig.getAttribute('data-study')];
      if (!init) return;
      var loading = fig.querySelector('.otl-loading');
      Promise.resolve(init(fig)).then(function () {
        if (loading) loading.remove();
      }).catch(function (err) {
        console.error(err);
        if (loading) loading.textContent = 'This figure could not load its data (' + err.message + ').';
      });
    };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { io.unobserve(en.target); run(en.target); } });
      }, {rootMargin: '600px 0px'});
      figs.forEach(function (f) { io.observe(f); });
    } else {
      figs.forEach(run);
    }
  }

  // Material's palette toggle sets data-md-color-scheme on <body>.
  new MutationObserver(themeChanged).observe(document.body, {attributes: true, attributeFilter: ['data-md-color-scheme']});
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', function () { setTimeout(themeChanged, 50); });
  }

  window.OTL = {
    loadJSON: loadJSON, theme: getTheme, seq: seq, alpha: alpha, onTheme: onTheme,
    Canvas: Canvas, draw: draw, fit: fit, bbox: bbox, skinGeom: skinGeom, drawSkin: drawSkin,
    el: el, seg: seg, slider: slider, check: check, button: button, metrics: metrics,
    reducedMotion: reducedMotion, drag: drag, study: study, start: start
  };

  // Start once every study script has loaded. With Material's instant
  // navigation the page body is swapped without a reload; document$ fires then.
  function boot() { setTimeout(start, 0); }
  if (window.document$ && window.document$.subscribe) window.document$.subscribe(boot);
  else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

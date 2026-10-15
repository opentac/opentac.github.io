/* Study 1: the sensor stack and how one taxel is read.
 * Left: a 4 x 4-taxel patch of a real skin, exploded. Taxel copper is drawn
 * from the footprint numbers in skins.json (kicad_footprint.pixel_geometry);
 * bump size from bump_sheet.BumpParams defaults. Layer thickness is not to
 * scale. Right: the row-column readout as a resistor network, solved. */
(function () {
  'use strict';
  var L = window.OTL;
  var SKINS = [['umi', '4.0 mm (UMI)'], ['foot', '3.1 mm (foot)'], ['agileX_2mm', '2.0 mm (AgileX)']];
  var N = 4;

  var LAYER_TEXT = {
    all: 'Contact presses the lid; the film under it conducts more between the copper fingers; the readout measures that conductance taxel by taxel.',
    lid: null,
    film: null,
    pcb: 'Two-layer flex PCB. Each taxel is two interdigitated combs. The row comb reaches the row trace on the back through a via; the column comb joins the column trace on the front.',
    base: 'A printed base, or the robot part itself. It holds the stack and takes no part in sensing.'
  };

  L.study('anatomy', function (fig) {
    return Promise.all([L.loadJSON('meta.json'), L.loadJSON('skins.json')]).then(function (res) {
      var meta = res[0], skins = res[1], bp = meta.bump;
      var st = {skin: 'umi', sep: 0.7, yaw: -32, layer: 'all', film: 'v2', lid: 'bumps'};

      var controls = L.el('div', {class: 'otl-controls'});
      var cSkin = L.seg('Taxel pitch', SKINS, st.skin, function (v) { st.skin = v; redraw(); });
      var cLayer = L.seg('Show', [['all', 'All'], ['lid', 'Lid'], ['film', 'Film'], ['pcb', 'Flex PCB'], ['base', 'Base']],
                         st.layer, function (v) { st.layer = v; redraw(); });
      var cFilm = L.seg('Film', [['v2', 'LINQSTAT'], ['v3', 'Yunjia textile']], st.film, function (v) { st.film = v; redraw(); });
      var cLid = L.seg('Top', [['bumps', 'Bump lid'], ['flat', 'Flat (foam)']], st.lid, function (v) { st.lid = v; redraw(); });
      var cSep = L.slider('Separate', 0, 1, 0.01, st.sep, function (v) { return Math.round(v * 100) + '%'; }, function (v) { st.sep = v; redraw(); });
      [cSkin, cLayer, cFilm, cLid, cSep].forEach(function (c) { controls.appendChild(c.el); });
      fig.appendChild(controls);

      var stage = L.el('div', {class: 'otl-stage'});
      var c1 = L.el('div', {class: 'otl-cell'}), c2 = L.el('div', {class: 'otl-cell'});
      c1.style.flexBasis = '360px'; c2.style.flexBasis = '320px';
      var cv = L.el('canvas', {tabindex: '0', role: 'img',
        'aria-label': 'Exploded view of a four by four taxel patch: base, flex PCB with interdigitated copper, piezoresistive film, and the lid. Drag sideways or use the arrow keys to turn it.'});
      c1.appendChild(cv);
      stage.appendChild(c1); stage.appendChild(c2);
      fig.appendChild(stage);
      var status = L.el('div', {class: 'otl-status'}); fig.appendChild(status);

      function layerText() {
        if (st.layer === 'lid') {
          return st.lid === 'bumps'
            ? 'Printed TPU lid with one bump over each 2 × 2 block of taxels: ' + bp.height + ' mm tall, base ' + bp.base_frac + ' × the bump pitch, top ' + bp.top_ratio + ' × the base (bump-sheet defaults). The bumps turn shear into a difference between the four taxels (study 2).'
            : 'A flat top, foam or a printed case lid, spreads the press. It reads pressure only: no bumps, no shear.';
        }
        if (st.layer === 'film') {
          var p = meta.profiles[st.film];
          return 'Piezoresistive film over the electrodes (' + p.material + '). Pressure lowers its resistance between the fingers. Fitted response: counts ∝ pressure^' + p.b.toFixed(2) + ', up to the 12-bit ceiling.';
        }
        return LAYER_TEXT[st.layer];
      }

      // ---- the exploded stack ------------------------------------------------
      var canvas = new L.Canvas(cv, function (w) { return Math.max(300, Math.min(420, w * 0.85)); }, function (ctx, w, H) {
        var t = L.theme(), skin = skins[st.skin], p = skin.pitch, comb = skin.comb;
        var half = N * p / 2 + 0.6;
        var yaw = st.yaw * Math.PI / 180, E = 32 * Math.PI / 180, cy = Math.cos(yaw), sy = Math.sin(yaw);
        var sinE = Math.sin(E), cosE = Math.cos(E);
        var gap = st.sep * 1.25 * N * p / 4;                    // separation, scaled with the patch
        var vz = N * p / 16;                                    // thin layers drawn at a visible thickness
        var bumpH = st.lid === 'bumps' ? bp.height : 0;
        var layers = [
          {key: 'base', z: 0, t: 2.2 * vz, fill: t.base, label: 'Base'},
          {key: 'pcb', t: 0.5 * vz, fill: t.pcb, label: 'Flex PCB'},
          {key: 'film', t: 0.45 * vz, fill: st.film === 'v2' ? t.film : t.textile, label: st.film === 'v2' ? 'Film (LINQSTAT)' : 'Film (Yunjia textile)'},
          {key: 'lid', t: st.lid === 'bumps' ? bp.sheet * N * p / 16 * 1.2 : 2 * vz, fill: t.tpu,
           label: st.lid === 'bumps' ? 'TPU bump lid' : 'Flat top (foam)'}
        ];
        var z = 0;
        layers.forEach(function (Ly, i) { if (i) z += gap; Ly.z = z; z += Ly.t; });
        var topZ = z + bumpH;
        var narrow = w < 480, labelW = narrow ? 104 : 132;
        var s = Math.min((w - labelW - 24) / (2 * half * 1.5), (H - 40) / (2 * half * sinE * 1.45 + topZ * cosE + 2));
        var ox = (w - labelW) / 2 + 4, oyb = H / 2 + (topZ * cosE * s) / 2 + 10;
        function P(x, y, zz) {
          var xr = x * cy - y * sy, yr = x * sy + y * cy;
          return [ox + xr * s, oyb - (zz * cosE + yr * sinE) * s];
        }
        function depth(x, y) { return x * sy + y * cy; }       // larger = further away
        function slab(z0, th, fill, alpha) {
          var c = [[-half, -half], [half, -half], [half, half], [-half, half]];
          ctx.save(); ctx.globalAlpha = alpha;
          for (var i = 0; i < 4; i++) {
            var a = c[i], b = c[(i + 1) % 4];
            var nx = (a[1] - b[1]), ny = (b[0] - a[0]);   // outward normal of edge a->b (counter-clockwise)
            if (depth(-nx, -ny) >= 0) continue;          // faces away from the viewer
            var shade = 0.78 + 0.12 * Math.sign(nx * cy - ny * sy);
            L.draw.poly(ctx, [P(a[0], a[1], z0), P(b[0], b[1], z0), P(b[0], b[1], z0 + th), P(a[0], a[1], z0 + th)],
                        shadeColor(fill, shade), L.alpha(t.ink, 0.25), 0.8);
          }
          L.draw.poly(ctx, c.map(function (q) { return P(q[0], q[1], z0 + th); }), fill, L.alpha(t.ink, 0.3), 0.8);
          ctx.restore();
        }
        function frustum(x, y, z0, rb, rt, hh, alpha) {
          var n = 40, lo = [], hi = [];
          for (var k = 0; k < n; k++) {
            var a = 2 * Math.PI * k / n;
            lo.push([x + rb * Math.cos(a), y + rb * Math.sin(a)]); hi.push([x + rt * Math.cos(a), y + rt * Math.sin(a)]);
          }
          var faces = [];
          for (k = 0; k < n; k++) {
            var k2 = (k + 1) % n, am = 2 * Math.PI * (k + 0.5) / n;
            var nx = Math.cos(am), ny = Math.sin(am);
            if (depth(nx, ny) > 0.15) continue;          // back faces
            faces.push({d: depth(lo[k][0], lo[k][1]), pts: [P(lo[k][0], lo[k][1], z0), P(lo[k2][0], lo[k2][1], z0),
                        P(hi[k2][0], hi[k2][1], z0 + hh), P(hi[k][0], hi[k][1], z0 + hh)],
                        shade: 0.72 + 0.22 * (nx * Math.cos(yaw - 0.8) - ny * Math.sin(yaw - 0.8))});
          }
          faces.sort(function (p1, p2) { return p2.d - p1.d; });
          ctx.save(); ctx.globalAlpha = alpha;
          faces.forEach(function (f) { L.draw.poly(ctx, f.pts, shadeColor(t.tpu, f.shade), shadeColor(t.tpu, f.shade), 0.6); });
          L.draw.poly(ctx, hi.map(function (q) { return P(q[0], q[1], z0 + hh); }), t.tpu, L.alpha(t.ink, 0.35), 0.8);
          ctx.restore();
        }
        var ink = L.alpha(t.ink, 0.5);
        layers.forEach(function (Ly) {
          var alpha = st.layer === 'all' || st.layer === Ly.key ? 1 : 0.18;
          slab(Ly.z, Ly.t, Ly.fill, alpha);
          var zt = Ly.z + Ly.t;
          ctx.save(); ctx.globalAlpha = alpha;
          if (Ly.key === 'pcb') {
            // copper, from the footprint: row comb + via, column comb
            for (var i = 0; i < N; i++) for (var j = 0; j < N; j++) {
              var tx = (i - (N - 1) / 2) * p, ty = (j - (N - 1) / 2) * p;
              ctx.lineCap = 'round';
              [[comb.row, t.copper], [comb.col, t.copper2]].forEach(function (pair) {
                ctx.strokeStyle = pair[1]; ctx.lineWidth = Math.max(0.5, comb.trace * s * 0.9);
                pair[0].forEach(function (sg) {
                  var a = P(tx + sg[0], ty + sg[1], zt), b = P(tx + sg[2], ty + sg[3], zt);
                  ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
                });
              });
              var ring = [];
              for (var k = 0; k < 12; k++) {
                var a = 2 * Math.PI * k / 12;
                ring.push(P(tx + comb.via[0] + comb.via[2] / 2 * Math.cos(a), ty + comb.via[1] + comb.via[2] / 2 * Math.sin(a), zt));
              }
              L.draw.poly(ctx, ring, t.copper, null);
            }
          } else if (Ly.key === 'film' && st.film === 'v3') {
            ctx.strokeStyle = L.alpha(t.bg, 0.25); ctx.lineWidth = 0.7;
            for (var q = -half; q <= half; q += p / 3) {
              var a1 = P(q, -half, zt), b1 = P(q, half, zt);
              ctx.beginPath(); ctx.moveTo(a1[0], a1[1]); ctx.lineTo(b1[0], b1[1]); ctx.stroke();
            }
          } else if (Ly.key === 'lid' && st.lid === 'bumps') {
            var rb = bp.base_frac * p, rt = rb * bp.top_ratio;
            var bumps = [[-p, -p], [p, -p], [-p, p], [p, p]].sort(function (u, v) { return depth(v[0], v[1]) - depth(u[0], u[1]); });
            ctx.restore(); ctx.save();
            bumps.forEach(function (b) { frustum(b[0], b[1], zt, rb, rt, bumpH, alpha); });
          }
          ctx.restore();
          // label with a leader line
          if (st.sep > 0.25 || Ly.key === st.layer) {
            var anchor = P(half, 0, Ly.z + Ly.t / 2), lx = w - labelW;
            L.draw.line(ctx, anchor[0] + 4, anchor[1], lx - 6, anchor[1], L.alpha(t.ink, 0.3), 1);
            L.draw.text(ctx, Ly.label, lx, anchor[1] + 4, {size: narrow ? 10 : 11, color: st.layer === Ly.key ? t.ink : t.ink2, weight: st.layer === Ly.key ? '600' : ''});
          }
        });
        L.draw.text(ctx, N + ' × ' + N + ' taxels at ' + p + ' mm pitch' + (st.lid === 'bumps' ? ', 2 × 2 bumps' : ''), 12, 18, {size: 11, color: t.ink2});
        L.draw.text(ctx, 'layer thickness not to scale · drag to turn', 12, H - 10, {size: 10});
        status.textContent = layerText();
      });
      function shadeColor(color, f) {
        var c = color.match(/\d+(\.\d+)?/g);
        if (!c) return color;
        if (color[0] === '#') {
          var v = parseInt(color.slice(1), 16);
          c = [(v >> 16) & 255, (v >> 8) & 255, v & 255];
        }
        return 'rgb(' + Math.min(255, Math.round(c[0] * f)) + ',' + Math.min(255, Math.round(c[1] * f)) + ',' + Math.min(255, Math.round(c[2] * f)) + ')';
      }
      var dragYaw = null;
      L.drag(cv, function (x, y, phase) {
        if (phase === 'down') { dragYaw = [x, st.yaw]; return true; }
        st.yaw = Math.max(-80, Math.min(80, dragYaw[1] + (x - dragYaw[0]) * 0.4)); redraw();
      });
      cv.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') st.yaw = Math.max(-80, st.yaw - 4);
        else if (e.key === 'ArrowRight') st.yaw = Math.min(80, st.yaw + 4);
        else return;
        e.preventDefault(); redraw();
      });

      // ---- the readout ---------------------------------------------------------
      var rd = readout(c2, meta);
      function redraw() { canvas.redraw(); }
      redraw();
    });
  });

  // A 4 x 4 row-column matrix: one row driven, one column switched by the mux
  // into a transimpedance amplifier held at the sense potential (virtual
  // ground). The network is solved for the current into the amplifier.
  function readout(host, meta) {
    var NS = 'http://www.w3.org/2000/svg';
    var st = {row: 0, col: 0, hold: true, press: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], playing: false};
    var box = L.el('div');
    host.appendChild(box);
    var bar = L.el('div', {class: 'otl-controls'});
    bar.style.borderTop = '0';
    var bStep = L.button('Next taxel', function () { stop(); step(); });
    var bScan = L.button('Scan', function () { if (st.playing) stop(); else play(); });
    var cHold = L.check('Hold other rows at the sense potential', st.hold, function (v) { st.hold = v; paint(); });
    var bGhost = L.button('Press three corners', function () {
      st.press = [[1, 1, 0, 0], [0, 1, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]; st.row = 1; st.col = 0; paint();
    });
    var bClear = L.button('Release all', function () { st.press = st.press.map(function (r) { return r.map(function () { return 0; }); }); paint(); });
    [bStep, bScan, bGhost, bClear].forEach(function (b) { bar.appendChild(b); });
    bar.appendChild(cHold.el);
    host.appendChild(bar);
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 340 300');
    svg.setAttribute('class', 'otl-svg');
    svg.setAttribute('role', 'img');
    box.appendChild(svg);
    var info = L.el('div', {class: 'otl-status'});
    host.appendChild(info);

    function S(tag, attrs, text) {
      var e = document.createElementNS(NS, tag);
      Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
      if (text !== undefined) e.textContent = text;
      svg.appendChild(e);
      return e;
    }
    var RX = function (c) { return 92 + c * 52; }, RY = function (r) { return 46 + r * 42; };

    // Solve the network. Rows: driven row at 1 V; other rows at 0 V (held) or
    // floating. Columns: selected column at 0 V (amplifier input); the others
    // are switched off by the mux and float.
    var G_ON = 1, G_OFF = 0.002;
    function solve() {
      var g = st.press.map(function (r) { return r.map(function (v) { return v ? G_ON : G_OFF; }); });
      var nodes = [], known = {};
      for (var r = 0; r < N; r++) {
        if (r === st.row) known['r' + r] = 1;
        else if (st.hold) known['r' + r] = 0;
        else nodes.push('r' + r);
      }
      for (var c = 0; c < N; c++) {
        if (c === st.col) known['c' + c] = 0; else nodes.push('c' + c);
      }
      var n = nodes.length, A = [], b = [];
      var idx = {};
      nodes.forEach(function (nm, i) { idx[nm] = i; A.push(new Array(n).fill(0)); b.push(0); });
      function nb(nm) {   // neighbours with conductance
        var out = [], k = +nm.slice(1);
        for (var q = 0; q < N; q++) out.push(nm[0] === 'r' ? ['c' + q, g[k][q]] : ['r' + q, g[q][k]]);
        return out;
      }
      nodes.forEach(function (nm, i) {
        nb(nm).forEach(function (e) {
          A[i][i] += e[1];
          if (e[0] in known) b[i] += e[1] * known[e[0]]; else A[i][idx[e[0]]] -= e[1];
        });
      });
      // Gaussian elimination
      for (var i = 0; i < n; i++) {
        var piv = i;
        for (var k = i + 1; k < n; k++) if (Math.abs(A[k][i]) > Math.abs(A[piv][i])) piv = k;
        var tmp = A[i]; A[i] = A[piv]; A[piv] = tmp; var tb = b[i]; b[i] = b[piv]; b[piv] = tb;
        for (k = i + 1; k < n; k++) {
          var f = A[k][i] / A[i][i];
          for (var j = i; j < n; j++) A[k][j] -= f * A[i][j];
          b[k] -= f * b[i];
        }
      }
      var x = new Array(n);
      for (i = n - 1; i >= 0; i--) {
        var sum = b[i];
        for (j = i + 1; j < n; j++) sum -= A[i][j] * x[j];
        x[i] = sum / A[i][i];
      }
      var V = {};
      Object.keys(known).forEach(function (k2) { V[k2] = known[k2]; });
      nodes.forEach(function (nm, i2) { V[nm] = x[i2]; });
      var I = 0, cur = [];
      for (r = 0; r < N; r++) {
        cur.push([]);
        for (c = 0; c < N; c++) cur[r].push(g[r][c] * (V['r' + r] - V['c' + c]));
        I += cur[r][st.col];
      }
      return {I: I, V: V, cur: cur};
    }

    function paint() {
      var t = L.theme();
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.style.fontFamily = t.font;
      var sol = solve(), counts = Math.min(4095, Math.round(sol.I / G_ON * 2400));
      var pressed = st.press[st.row][st.col];
      // rows
      for (var r = 0; r < N; r++) {
        var drv = r === st.row, y = RY(r);
        S('line', {x1: 46, y1: y, x2: RX(N - 1) + 24, y2: y, stroke: drv ? t.accent : t.ink3, 'stroke-width': drv ? 2.2 : 1.2});
        var lab = drv ? 'V' : (st.hold ? '0 V' : 'float');
        S('text', {x: 8, y: y + 4, 'font-size': 11, fill: drv ? t.accent : t.ink2}, 'R' + (r + 1) + ' ' + lab);
      }
      // columns -> mux
      for (var c = 0; c < N; c++) {
        var sel = c === st.col, x = RX(c);
        S('line', {x1: x, y1: 26, x2: x, y2: 214, stroke: sel ? t.accent : t.ink3, 'stroke-width': sel ? 2.2 : 1.2});
        S('text', {x: x, y: 18, 'font-size': 11, 'text-anchor': 'middle', fill: sel ? t.accent : t.ink2}, 'C' + (c + 1));
      }
      // taxels
      for (r = 0; r < N; r++) for (c = 0; c < N; c++) {
        var sneak = !st.hold && Math.abs(sol.cur[r][c]) > 0.05 * Math.max(1e-6, Math.abs(sol.I)) && !(r === st.row && c === st.col) && st.press[r][c];
        var rect = S('rect', {x: RX(c) - 9, y: RY(r) - 9, width: 18, height: 18, rx: 3,
                              fill: st.press[r][c] ? L.seq(0.75) : t.bg,
                              stroke: (r === st.row && c === st.col) ? t.ink : (sneak ? t.accent : t.ink3),
                              'stroke-width': (r === st.row && c === st.col) ? 2 : (sneak ? 2 : 1),
                              'stroke-dasharray': sneak ? '3 2' : 'none',
                              tabindex: 0, role: 'button', style: 'cursor:pointer',
                              'aria-label': 'Taxel row ' + (r + 1) + ' column ' + (c + 1) + (st.press[r][c] ? ', pressed' : ', not pressed')});
        (function (rr, cc) {
          var toggle = function () { st.press[rr][cc] = st.press[rr][cc] ? 0 : 1; paint(); };
          rect.addEventListener('click', toggle);
          rect.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
        })(r, c);
      }
      // mux, amplifier, ADC
      S('path', {d: 'M 70 214 L 270 214 L 250 236 L 90 236 Z', fill: t.bg, stroke: t.ink2, 'stroke-width': 1.2});
      S('text', {x: 170, y: 229, 'font-size': 11, 'text-anchor': 'middle', fill: t.ink2}, 'mux: C' + (st.col + 1));
      S('line', {x1: 170, y1: 236, x2: 170, y2: 262, stroke: t.accent, 'stroke-width': 2});
      S('line', {x1: 170, y1: 262, x2: 196, y2: 262, stroke: t.accent, 'stroke-width': 2});
      S('path', {d: 'M 196 248 L 196 276 L 224 262 Z', fill: t.bg, stroke: t.ink2, 'stroke-width': 1.2});
      S('text', {x: 200, y: 258, 'font-size': 9, fill: t.ink2}, '−');
      S('text', {x: 200, y: 273, 'font-size': 9, fill: t.ink2}, '+');
      S('path', {d: 'M 186 262 L 186 242 L 232 242 L 232 262', fill: 'none', stroke: t.ink3, 'stroke-width': 1});
      S('text', {x: 209, y: 239, 'font-size': 9, 'text-anchor': 'middle', fill: t.ink2}, 'R_f');
      S('line', {x1: 224, y1: 262, x2: 252, y2: 262, stroke: t.ink2, 'stroke-width': 1.2});
      S('rect', {x: 252, y: 250, width: 34, height: 24, rx: 3, fill: t.bg, stroke: t.ink2});
      S('text', {x: 269, y: 266, 'font-size': 10, 'text-anchor': 'middle', fill: t.ink2}, 'ADC');
      S('text', {x: 190, y: 292, 'font-size': 10, 'text-anchor': 'end', fill: t.ink2}, '+ at the sense potential');
      S('line', {x1: 193, y1: 286, x2: 198, y2: 272, stroke: t.ink3, 'stroke-width': 1});
      S('text', {x: 294, y: 258, 'font-size': 10, fill: t.ink2}, 'counts');
      S('text', {x: 294, y: 274, 'font-size': 13, 'font-weight': 600, fill: t.ink}, String(counts));
      var ghost = !pressed && counts > 50;
      info.className = 'otl-status' + (ghost ? ' warn' : '');
      info.textContent = 'Reading R' + (st.row + 1) + ' C' + (st.col + 1) + ': ' + (pressed ? 'pressed' : 'not pressed') + ', ' + counts + ' counts. ' +
        (ghost ? 'A ghost: current reached the amplifier through three pressed taxels, because the other rows floated.'
               : (st.hold ? 'Every row but the driven one sits at the amplifier\'s potential, so only this taxel can pass current to it.'
                          : 'Other rows float. Press three corners of a rectangle to see current take a detour.'));
      svg.setAttribute('aria-label', info.textContent);
    }
    function step() {
      st.col++;
      if (st.col >= N) { st.col = 0; st.row = (st.row + 1) % N; }
      paint();
    }
    var timer = 0;
    function play() {
      st.playing = true; bScan.textContent = 'Stop';
      timer = setInterval(step, L.reducedMotion() ? 1200 : 450);
    }
    function stop() { st.playing = false; bScan.textContent = 'Scan'; clearInterval(timer); }
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); });
    L.onTheme(paint);
    st.press[1][2] = 1; st.press[2][1] = 1;
    paint();
    return {paint: paint};
  }
})();

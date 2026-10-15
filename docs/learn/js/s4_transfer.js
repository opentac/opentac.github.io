/* Study 4: transfer a recorded press from one skin to another.
 * Data: three real skins pressed with the same three objects
 * (data/takes/*.json, from recordings/transfer). The transfer is
 * opentac_transfer.py's geometric step (js/transfer.js). */
(function () {
  'use strict';
  var L = window.OTL, T = window.OTTransfer;
  var SKINS = [['leap_palm', 'LEAP 4.2 mm'], ['foot', 'Foot 3.1 mm'], ['agileX_2mm', 'AgileX 2.0 mm']];
  var OBJECTS = [['tape roll', 'Tape roll'], ['square block', 'Square block'], ['allen key', 'Allen key']];
  var ON_FRAC = 0.25;     // contact = taxels at or above 25% of the frame's peak (as in the paper's F1)

  function netFrames(take) {
    var z = take.zero;
    take.net = take.raw.map(function (f) { return f.map(function (v, k) { return Math.max(0, v - z[k]); }); });
    take.total = take.net.map(function (f) { return f.reduce(function (s, v) { return s + v; }, 0); });
  }
  // First frame of the rising edge at or above `frac` of the press peak.
  function frameAt(take, frac) {
    var pk = take.total[take.peak];
    for (var k = take.onset; k <= take.peak; k++) if (take.total[k] >= frac * pk) return k;
    return take.peak;
  }
  // Contact statistics over values on a skin: area (taxel footprints), 2-sigma extents.
  function contact(skin, vals) {
    var mx = 0, k;
    for (k = 0; k < vals.length; k++) if (vals[k] > mx) mx = vals[k];
    var on = [], sw = 0, cx = 0, cy = 0;
    if (mx <= 0) return {on: on, area: 0, major: 0, minor: 0, set: new Set()};
    for (k = 0; k < vals.length; k++) {
      if (vals[k] >= ON_FRAC * mx) {
        on.push(k); sw += vals[k]; cx += vals[k] * skin.xy[k][0]; cy += vals[k] * skin.xy[k][1];
      }
    }
    cx /= sw; cy /= sw;
    var sxx = 0, syy = 0, sxy = 0;
    on.forEach(function (j) {
      var dx = skin.xy[j][0] - cx, dy = skin.xy[j][1] - cy, w = vals[j];
      sxx += w * dx * dx; syy += w * dy * dy; sxy += w * dx * dy;
    });
    sxx /= sw; syy /= sw; sxy /= sw;
    var tr = sxx + syy, det = sxx * syy - sxy * sxy, d = Math.sqrt(Math.max(0, tr * tr / 4 - det));
    return {on: on, set: new Set(on), area: on.length * skin.w * skin.h,
            major: 2 * Math.sqrt(Math.max(0, tr / 2 + d)), minor: 2 * Math.sqrt(Math.max(0, tr / 2 - d))};
  }
  // "Resize, no manifest": treat both skins as plain arrays and resample A's
  // array to B's array size (bilinear), ignoring pitch and outline.
  function resize(skinA, valsA, skinB) {
    var ga = L.skinGeom(skinA), gb = L.skinGeom(skinB);
    var img = new Float64Array(ga.rows * ga.cols);
    for (var k = 0; k < skinA.n; k++) img[ga.row[k] * ga.cols + ga.col[k]] = valsA[k];
    var at = function (r, c) {
      if (r < 0 || c < 0 || r >= ga.rows || c >= ga.cols) return 0;
      return img[r * ga.cols + c];
    };
    var out = new Float64Array(skinB.n);
    for (var j = 0; j < skinB.n; j++) {
      var r = (gb.row[j] + 0.5) * ga.rows / gb.rows - 0.5, c = (gb.col[j] + 0.5) * ga.cols / gb.cols - 0.5;
      var r0 = Math.floor(r), c0 = Math.floor(c), fr = r - r0, fc = c - c0;
      out[j] = at(r0, c0) * (1 - fr) * (1 - fc) + at(r0, c0 + 1) * (1 - fr) * fc +
               at(r0 + 1, c0) * fr * (1 - fc) + at(r0 + 1, c0 + 1) * fr * fc;
    }
    return out;
  }

  L.study('transfer', function (fig) {
    return Promise.all([L.loadJSON('meta.json'), L.loadJSON('skins.json')]).then(function (res) {
      var meta = res[0], skins = res[1];
      var st = {obj: 'allen key', a: 'leap_palm', b: 'agileX_2mm', map: 'manifest', place: 'pose',
                frac: 0.5, rot: 0, off: [0, 0], overlay: true};
      var takes = {};
      function takeFor(skin, obj) {
        var e = meta.takes.filter(function (t) { return t.skin === skin && t.object === obj; })[0];
        var key = e.take;
        if (!takes[key]) {
          takes[key] = L.loadJSON('takes/' + key + '.json').then(function (t) { netFrames(t); return t; });
        }
        return takes[key];
      }
      var layouts = {};
      function layout(id) {
        if (!layouts[id]) layouts[id] = new T.Layout(skins[id].xy, skins[id].pitch);
        return layouts[id];
      }

      // ---- controls
      var controls = L.el('div', {class: 'otl-controls'});
      var cObj = L.seg('Object', OBJECTS, st.obj, function (v) { st.obj = v; st.rot = 0; st.off = [0, 0]; cRot.set(0); update(); });
      var cA = L.seg('From', SKINS, st.a, function (v) { st.a = v; st.off = [0, 0]; update(); });
      var cB = L.seg('To', SKINS, st.b, function (v) { st.b = v; st.off = [0, 0]; update(); });
      var cMap = L.seg('Map by', [['manifest', 'Physical coordinates'], ['resize', 'Array index (resize)']], st.map,
                       function (v) { st.map = v; update(); });
      var cPlace = L.seg('Place', [['pose', "B's recorded pose"], ['centre', 'Centre of B']], st.place,
                         function (v) { st.place = v; st.off = [0, 0]; update(); });
      var cFrac = L.slider('Load', 0.1, 1, 0.05, st.frac, function (v) { return Math.round(v * 100) + '% of peak'; },
                           function (v) { st.frac = v; update(); });
      var cRot = L.slider('Rotate', -180, 180, 1, st.rot, function (v) { return v + '°'; },
                          function (v) { st.rot = v; update(); });
      var cOver = L.check("Mark B's recorded contact (dots)", st.overlay, function (v) { st.overlay = v; canvas.redraw(); });
      [cObj, cA, cB, cMap, cPlace, cFrac, cRot].forEach(function (c) { controls.appendChild(c.el); });
      controls.appendChild(cOver.el);
      fig.appendChild(controls);

      var stage = L.el('div', {class: 'otl-stage'});
      var cell = L.el('div', {class: 'otl-cell'});
      var cv = L.el('canvas', {tabindex: '0', role: 'img',
        'aria-label': 'Three panels: the press recorded on skin A, the same press transferred onto skin B, and the press recorded on skin B. Drag the middle panel or use the arrow keys to move the transferred contact.'});
      cell.appendChild(cv); stage.appendChild(cell); fig.appendChild(stage);
      var m = L.metrics(fig, [['kept', 'Landed on B taxels'], ['area', 'Contact area, mm² (A · A→B · B)'],
                              ['ext', 'Length × width, mm (A→B · B)'], ['iou', 'Overlap of A→B with B (IoU)']]);
      var status = L.el('div', {class: 'otl-status'}); fig.appendChild(status);

      var cur = null;     // computed state for drawing
      var views = [];

      function update() {
        cPlace.el.style.display = st.map === 'manifest' ? '' : 'none';
        cRot.el.style.display = st.map === 'manifest' ? '' : 'none';
        Promise.all([takeFor(st.a, st.obj), takeFor(st.b, st.obj)]).then(function (tk) {
          var ta = tk[0], tb = tk[1], sa = skins[st.a], sb = skins[st.b];
          var ka = frameAt(ta, st.frac), kb = frameAt(tb, st.frac);
          var fa = ta.net[ka], fb = tb.net[kb];
          var pred, lost = 0, totalA = fa.reduce(function (s, v) { return s + v; }, 0);
          if (st.map === 'manifest') {
            var about = ta.pose.centre, angle, shift;
            if (st.place === 'pose') {
              angle = tb.pose.angle_deg - ta.pose.angle_deg + st.rot;
              shift = [tb.pose.centre[0] - about[0] + st.off[0], tb.pose.centre[1] - about[1] + st.off[1]];
            } else {
              var cb = layout(st.b).centroid;
              angle = st.rot;
              shift = [cb[0] - about[0] + st.off[0], cb[1] - about[1] + st.off[1]];
            }
            var tr = new T.Transfer(layout(st.a), layout(st.b), angle, shift, about);
            var r = tr.apply(fa);
            pred = r.values; lost = r.lost;
          } else {
            pred = resize(sa, fa, sb);
          }
          var c0 = contact(sa, fa), c1 = contact(sb, pred), c2 = contact(sb, fb);
          var inter = 0;
          c1.set.forEach(function (j) { if (c2.set.has(j)) inter++; });
          var uni = c1.set.size + c2.set.size - inter;
          cur = {ta: ta, tb: tb, sa: sa, sb: sb, ka: ka, kb: kb, fa: fa, fb: fb, pred: pred, c2: c2};
          m.kept.textContent = st.map === 'manifest'
            ? (100 * (1 - lost / Math.max(1, totalA))).toFixed(1) + '% of A\'s counts' : 'n/a (resize)';
          m.area.textContent = Math.round(c0.area) + ' · ' + Math.round(c1.area) + ' · ' + Math.round(c2.area);
          m.ext.textContent = c1.major.toFixed(1) + ' × ' + c1.minor.toFixed(1) + ' · ' +
                              c2.major.toFixed(1) + ' × ' + c2.minor.toFixed(1);
          m.iou.textContent = uni ? (inter / uni).toFixed(2) : '—';
          var msg;
          if (st.a === st.b) msg = 'Source and target are the same skin: the transfer maps a press onto a second press of the same object.';
          else if (st.map === 'resize') msg = 'Array resizing stretches A\'s rows and columns to B\'s, so the contact takes B\'s array proportions, not its millimetres.';
          else if (lost / Math.max(1, totalA) > 0.02) msg = Math.round(100 * lost / totalA) + '% of the contact fell outside B\'s taxels and is reported as lost, not renormalised.';
          else msg = 'Same millimetre scale in all three panels. Colour is normalised per panel: counts per mm² are not comparable across these skins.';
          status.textContent = msg;
          canvas.redraw();
        });
      }

      function layoutPanels(w) {
        var ids = [st.a, st.b, st.b];
        var boxes = ids.map(function (id) { return L.skinGeom(skins[id]).box; });
        var wide = w >= 640, pad = 10, head = 38, foot = 34;
        var colW = wide ? w / 3 : w;
        var s = Infinity;
        boxes.forEach(function (b) { s = Math.min(s, (colW - 2 * pad) / (b[2] - b[0] + 4)); });
        var maxH = Math.max.apply(null, boxes.map(function (b) { return (b[3] - b[1] + 4) * s; }));
        if (maxH > 460) { s *= 460 / maxH; maxH = 460; }
        var rowH = head + maxH + foot;
        return {wide: wide, s: s, colW: colW, rowH: rowH, head: head, pad: pad, boxes: boxes, ids: ids,
                height: wide ? rowH : boxes.reduce(function (acc, b) { return acc + head + (b[3] - b[1] + 4) * s + foot; }, 0)};
      }

      var canvas = new L.Canvas(cv, function (w) { return layoutPanels(w).height; }, function (ctx, w) {
        if (!cur) return;
        var t = L.theme(), P = layoutPanels(w), y = 0;
        var panels = [
          {skin: cur.sa, vals: cur.fa, title: 'Recorded on ' + cur.sa.label,
           sub: Math.round(st.frac * 100) + '% of peak, ' + Math.round(cur.ta.t_ms[cur.ka] - cur.ta.t_ms[cur.ta.onset]) + ' ms after onset'},
          {skin: cur.sb, vals: cur.pred, title: 'A transferred to ' + cur.sb.label,
           sub: st.map === 'manifest' ? 'by physical coordinates' : 'by array index (resize)', pred: true},
          {skin: cur.sb, vals: cur.fb, title: 'Recorded on ' + cur.sb.label,
           sub: Math.round(st.frac * 100) + '% of peak, ' + Math.round(cur.tb.t_ms[cur.kb] - cur.tb.t_ms[cur.tb.onset]) + ' ms after onset'}
        ];
        views = [];
        panels.forEach(function (p, i) {
          var b = P.boxes[i], bw = (b[2] - b[0] + 4) * P.s, bh = (b[3] - b[1] + 4) * P.s;
          var x0 = P.wide ? i * P.colW : 0, y0 = P.wide ? 0 : y;
          var ph = P.wide ? P.rowH - P.head - 34 : bh;
          if (i && P.wide) L.draw.line(ctx, x0 + 0.5, 8, x0 + 0.5, P.rowH - 8, t.hair, 1);
          L.draw.text(ctx, p.title, x0 + P.pad, y0 + 16, {size: 12, color: t.ink, weight: '500'});
          L.draw.text(ctx, p.sub, x0 + P.pad, y0 + 31, {size: 10.5});
          var rect = [x0 + (P.colW - bw) / 2, y0 + P.head + (ph - bh) / 2, bw, bh];
          var view = L.fit([b[0] - 2, b[1] - 2, b[2] + 2, b[3] + 2], rect, 0);
          view.hit = [x0, y0, P.colW, P.head + ph + 34];
          views.push(view);
          var area = p.skin.w * p.skin.h, mx = 0;
          for (var k = 0; k < p.vals.length; k++) mx = Math.max(mx, p.vals[k] / area);
          L.drawSkin(ctx, view, p.skin, function (k) {
            return L.seq(mx > 0 ? p.vals[k] / area / mx : 0);
          });
          if (p.pred && st.overlay) {
            cur.c2.on.forEach(function (k) {
              L.draw.circle(ctx, view.x(p.skin.xy[k][0]), view.y(p.skin.xy[k][1]), Math.max(1, Math.min(2.2, p.skin.w * view.s * 0.18)), t.accent);
            });
          }
          var fy = y0 + P.head + ph + 8;
          L.draw.scalebar(ctx, x0 + P.pad, fy + 16, 10 * P.s, '10 mm');
          L.draw.colorbar(ctx, x0 + P.colW - P.pad - 90, fy + 4, 90, '0', 'max', '');
          y += P.head + bh + 34;
        });
      });

      // Drag the transferred contact in the middle panel.
      var dragFrom = null;
      L.drag(cv, function (x, y, phase) {
        if (st.map !== 'manifest' || views.length < 3) return false;
        var v = views[1];
        if (phase === 'down') {
          var h = v.hit;
          if (x < h[0] || x > h[0] + h[2] || y < h[1] || y > h[1] + h[3]) return false;
          dragFrom = [v.mx(x), v.my(y), st.off[0], st.off[1]];
          return true;
        }
        if (!dragFrom) return;
        st.off = [dragFrom[2] + v.mx(x) - dragFrom[0], dragFrom[3] + v.my(y) - dragFrom[1]];
        update();
        if (phase === 'up') dragFrom = null;
      });
      cv.addEventListener('keydown', function (e) {
        if (st.map !== 'manifest') return;
        var d = e.shiftKey ? 5 : 1, k = e.key;
        if (k === 'ArrowLeft') st.off[0] -= d; else if (k === 'ArrowRight') st.off[0] += d;
        else if (k === 'ArrowUp') st.off[1] += d; else if (k === 'ArrowDown') st.off[1] -= d;
        else if (k === 'Home') st.off = [0, 0]; else return;
        e.preventDefault(); update();
      });

      update();
    });
  });
})();

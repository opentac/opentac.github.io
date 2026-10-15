/* Study 2: one bump over a 2x2 block of taxels. Real block geometry from a
 * manifest's shear groups; loads and responses from the model in
 * js/bumpmodel.js (TactileSim statics + fitted film profile). */
(function () {
  'use strict';
  var L = window.OTL, B = window.OTBump;
  var SKINS = [['umi', 'UMI 4.0 mm'], ['foot', 'Foot 3.1 mm'], ['agileX_2mm', 'AgileX 2.0 mm']];
  var FMAX = 1.5;    // N, tangential pad range

  // The full 2x2 group nearest the middle of the skin.
  function pickGroup(skin) {
    var members = {};
    skin.b.forEach(function (g, k) { if (g >= 0) (members[g] = members[g] || []).push(k); });
    var g0 = L.skinGeom(skin).centroid, best = null, bd = Infinity;
    Object.keys(members).forEach(function (g) {
      if (members[g].length !== 4) return;
      var c = skin.bumps[g], dd = Math.hypot(c[0] - g0[0], c[1] - g0[1]);
      if (dd < bd) { bd = dd; best = g; }
    });
    var c = skin.bumps[best];
    var taxels = members[best].map(function (k) {
      var dx = skin.xy[k][0] - c[0], dy = skin.xy[k][1] - c[1];
      return {k: k, dx: dx, dy: dy, u: dx > 0 ? 1 : -1, v: dy > 0 ? 1 : -1};
    });
    // order: (-x,+y), (+x,+y), (-x,-y), (+x,-y)
    taxels.sort(function (p, q) { return (q.v - p.v) * 10 + (p.u - q.u); });
    return {index: +best, centre: c, taxels: taxels};
  }

  function Pad(onChange) {
    var wrap = L.el('div', {class: 'otl-ctl'});
    wrap.appendChild(L.el('span', {class: 'otl-lab', text: 'Tangential load'}));
    var box = L.el('div', {class: 'otl-pad', tabindex: '0', role: 'slider',
                           'aria-label': 'Tangential load, x and y. Arrow keys change it; Home clears it.'});
    var cv = L.el('canvas'); box.appendChild(cv); wrap.appendChild(box);
    var out = L.el('output'); wrap.appendChild(out);
    var api = {el: wrap, fx: 0, fy: 0};
    function paint() {
      var t = L.theme(), dpr = Math.min(2, window.devicePixelRatio || 1), S = 120;
      cv.width = S * dpr; cv.height = S * dpr;
      var ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, S, S);
      L.draw.circle(ctx, 60, 60, 50, null, t.hair, 1);
      L.draw.circle(ctx, 60, 60, 25, null, t.line, 1);
      L.draw.line(ctx, 6, 60, 114, 60, t.hair, 1); L.draw.line(ctx, 60, 6, 60, 114, t.hair, 1);
      L.draw.text(ctx, '+x', 112, 56, {size: 9, align: 'right'}); L.draw.text(ctx, '+y', 64, 14, {size: 9});
      var px = 60 + api.fx / FMAX * 50, py = 60 - api.fy / FMAX * 50;
      L.draw.arrow(ctx, 60, 60, px - 60, py - 60, t.accent, 2);
      L.draw.circle(ctx, px, py, 6, t.accent, t.bg, 1.5);
      out.textContent = api.fx.toFixed(2) + ', ' + api.fy.toFixed(2) + ' N';
      box.setAttribute('aria-valuetext', 'x ' + api.fx.toFixed(2) + ' N, y ' + api.fy.toFixed(2) + ' N');
    }
    api.set = function (fx, fy) {
      var r = Math.hypot(fx, fy);
      if (r > FMAX) { fx *= FMAX / r; fy *= FMAX / r; }
      api.fx = Math.round(fx * 100) / 100; api.fy = Math.round(fy * 100) / 100; paint();
    };
    L.drag(cv, function (x, y) {
      api.set((x - 60) / 50 * FMAX, -(y - 60) / 50 * FMAX); onChange();
    });
    box.addEventListener('keydown', function (e) {
      var d = e.shiftKey ? 0.25 : 0.05;
      if (e.key === 'ArrowLeft') api.set(api.fx - d, api.fy); else if (e.key === 'ArrowRight') api.set(api.fx + d, api.fy);
      else if (e.key === 'ArrowUp') api.set(api.fx, api.fy + d); else if (e.key === 'ArrowDown') api.set(api.fx, api.fy - d);
      else if (e.key === 'Home') api.set(0, 0); else return;
      e.preventDefault(); onChange();
    });
    L.onTheme(paint);
    paint();
    return api;
  }

  L.study('bump', function (fig) {
    return Promise.all([L.loadJSON('meta.json'), L.loadJSON('skins.json')]).then(function (res) {
      var meta = res[0], skins = res[1], bump = meta.bump;
      var st = {skin: 'umi', film: 'v2', fz: 0.6, ex: 0};
      var controls = L.el('div', {class: 'otl-controls'});
      var cSkin = L.seg('Skin', SKINS, st.skin, function (v) { st.skin = v; cEx.input.max = topR().toFixed(2); cEx.input.min = (-topR()).toFixed(2); update(); });
      var cFilm = L.seg('Film', [['v2', 'LINQSTAT'], ['v3', 'Yunjia textile']], st.film, function (v) { st.film = v; update(); });
      var cFz = L.slider('Normal load', 0, 3, 0.05, st.fz, function (v) { return v.toFixed(2) + ' N'; }, function (v) { st.fz = v; update(); });
      var cEx = L.slider('Press off centre', -2.2, 2.2, 0.05, 0, function (v) { return v.toFixed(2) + ' mm'; }, function (v) { st.ex = v; update(); });
      var pad = Pad(update);
      var presets = L.el('div', {class: 'otl-ctl'}, [
        L.el('span', {class: 'otl-lab', text: 'Try'}),
        L.button('Press', function () { set(0.6, 0, 0, 0); }),
        L.button('Shear +x', function () { set(0.6, 0.25, 0, 0); }),
        L.button('Diagonal', function () { set(0.6, 0.18, 0.18, 0); }),
        L.button('Off-centre press', function () { set(0.6, 0, 0, topR() * 0.6); })
      ]);
      function set(fz, fx, fy, ex) {
        st.fz = fz; st.ex = ex; cFz.set(fz); cEx.set(ex); pad.set(fx, fy); update();
      }
      [cSkin, cFilm, cFz, cEx].forEach(function (c) { controls.appendChild(c.el); });
      controls.appendChild(pad.el);
      controls.appendChild(presets);
      fig.appendChild(controls);
      var stage = L.el('div', {class: 'otl-stage'}), cell = L.el('div', {class: 'otl-cell'});
      var cv = L.el('canvas', {role: 'img', 'aria-label': 'Side section of one bump, top view of its four taxels, and the four readings as bars.'});
      cell.appendChild(cv); stage.appendChild(cell); fig.appendChild(stage);
      var m = L.metrics(fig, [['hz', 'h<sub>z</sub> = Σ z (counts)'], ['hx', 'h<sub>x</sub> = Σ u·z'], ['hy', 'h<sub>y</sub> = Σ v·z'],
                              ['dec', 'Decoded F<sub>x</sub>, F<sub>y</sub>, F<sub>z</sub> (N)'], ['app', 'Applied (N)']]);
      var status = L.el('div', {class: 'otl-status'}); fig.appendChild(status);

      var cur = null;
      function f2(v) { var r = v.toFixed(2); return r === '-0.00' ? '0.00' : r; }
      function pitch() { return skins[st.skin].pitch; }
      function baseR() { return bump.base_frac * 2 * pitch() / 2; }
      function topR() { return baseR() * bump.top_ratio; }

      function update() {
        var skin = skins[st.skin], g = pickGroup(skin), p = pitch(), h = bump.height;
        var prof = new B.Profile(meta.profiles[st.film]);
        var signs = g.taxels.map(function (q) { return [q.u, q.v]; });
        var load = {fz: st.fz, fx: pad.fx, fy: pad.fy, ex: st.ex, ey: 0};
        var forces = B.taxelForces(load, signs, p, h);
        var counts = forces.map(function (f) { return prof.counts(f.f, p); });
        var dec = B.decode(counts, signs, p, h, prof);
        cur = {skin: skin, g: g, forces: forces, counts: counts, prof: prof, load: load, dec: dec};
        m.hz.textContent = Math.round(dec.hz);
        m.hx.textContent = Math.round(dec.hx);
        m.hy.textContent = Math.round(dec.hy);
        m.dec.textContent = f2(dec.fx) + ', ' + f2(dec.fy) + ', ' + f2(dec.fz);
        m.app.textContent = f2(load.fx) + ', ' + f2(load.fy) + ', ' + f2(load.fz);
        var sat = counts.some(function (c) { return prof.saturated(c); });
        var lift = forces.some(function (f) { return f.raw < 0; });
        var msg, warn = true;
        if (sat) msg = 'A taxel is at the ADC ceiling. Its reading is a lower bound, so the sums and differences no longer recover the load.';
        else if (lift) msg = 'One side of the bump has unloaded completely (clipped at zero). The decoded shear underestimates the load.';
        else if (Math.abs(st.ex) > 0.01) msg = 'An off-centre press tilts the readings the way shear does: it adds ' + f2(dec.fx - pad.fx) + ' N to the decoded Fx.';
        else { msg = 'Within range: hz follows the normal load, hx and hy follow the tangential load. Counts are not linear in force (film exponent b = ' + prof.p.b.toFixed(2) + ').'; warn = false; }
        status.textContent = msg;
        status.className = 'otl-status' + (warn ? ' warn' : '');
        canvas.redraw();
      }

      function regions(w) {
        var wide = w >= 620;
        if (wide) {
          var sw = w * 0.42, tw = w * 0.28;
          return {wide: true, h: 300, sec: [0, 0, sw, 300], top: [sw, 0, tw, 300], bars: [sw + tw, 0, w - sw - tw, 300]};
        }
        return {wide: false, h: 520, sec: [0, 0, w, 250], top: [0, 250, w / 2, 270], bars: [w / 2, 250, w / 2, 270]};
      }

      var canvas = new L.Canvas(cv, function (w) { return regions(w).h; }, function (ctx, w) {
        if (!cur) return;
        var t = L.theme(), R = regions(w), p = pitch(), h = bump.height, full = cur.prof.p.adc_max;
        var hdr = function (r, s1, s2) {
          L.draw.text(ctx, s1, r[0] + 12, r[1] + 18, {size: 12, color: t.ink, weight: '500'});
          if (s2) L.draw.text(ctx, s2, r[0] + 12, r[1] + 33, {size: 10.5});
        };
        // ---- side section (x-z through the bump centre); deformation exaggerated
        var S = R.sec;
        hdr(S, 'Side section', 'bump ' + h + ' mm tall; deformation exaggerated');
        var span = 2 * p + 1.2, sc = Math.min((S[2] - 100) / span, (S[3] - 120) / (h + 2.4));
        var cx = S[0] + (S[2] - 60) / 2, zb = S[1] + S[3] - 52;
        var X = function (mx) { return cx + mx * sc; }, Z = function (mz) { return zb - mz * sc; };
        var pcbT = 0.25, filmT = 0.18, sheet = bump.sheet;
        ctx.fillStyle = t.pcb; ctx.fillRect(X(-span / 2), Z(pcbT), span * sc, pcbT * sc);
        // two taxel columns under the section, coloured by the mean of each side's pair
        var left = (cur.counts[0] + cur.counts[2]) / 2, right = (cur.counts[1] + cur.counts[3]) / 2;
        var tw = p - 0.3;
        ctx.fillStyle = L.seq(left / full); ctx.fillRect(X(-p / 2 - tw / 2), Z(pcbT + filmT), tw * sc, filmT * sc);
        ctx.fillStyle = L.seq(right / full); ctx.fillRect(X(p / 2 - tw / 2), Z(pcbT + filmT), tw * sc, filmT * sc);
        ctx.fillStyle = t.copper;
        ctx.fillRect(X(-p / 2 - tw / 2), Z(pcbT) - 1.5, tw * sc, 1.5); ctx.fillRect(X(p / 2 - tw / 2), Z(pcbT) - 1.5, tw * sc, 1.5);
        var z0 = pcbT + filmT;
        var squash = Math.min(0.35, 0.08 * cur.load.fz), lean = cur.load.fx * 0.5;
        ctx.fillStyle = t.tpu; ctx.strokeStyle = t.ink3;
        ctx.fillRect(X(-span / 2), Z(z0 + sheet), span * sc, sheet * sc);
        var bR = baseR(), tR = topR(), top = z0 + sheet + h * (1 - squash / 1.0 * 0.4);
        var tilt = (cur.load.fx * h / 2 + cur.load.fz * st.ex) * 0.12;
        var tl = [X(-tR + lean), Z(top + tilt)], tr = [X(tR + lean), Z(top - tilt)];
        L.draw.poly(ctx, [[X(-bR), Z(z0 + sheet)], tl, tr, [X(bR), Z(z0 + sheet)]], t.tpu, t.ink3, 1);
        L.draw.text(ctx, 'TPU bump', X(bR) + 6, Z(z0 + sheet + h * 0.5), {size: 10});
        L.draw.text(ctx, 'film', X(span / 2) + 4, Z(z0) + 3, {size: 10});
        L.draw.text(ctx, 'flex PCB', X(span / 2) + 4, Z(0) + 2, {size: 10});
        L.draw.text(ctx, '−x taxels', X(-p / 2), Z(0) + 16, {size: 10, align: 'center'});
        L.draw.text(ctx, '+x taxels', X(p / 2), Z(0) + 16, {size: 10, align: 'center'});
        // loads on the top face
        var lx = (tl[0] + tr[0]) / 2 + st.ex * sc, ly = (tl[1] + tr[1]) / 2;
        if (cur.load.fz > 0.01) L.draw.arrow(ctx, lx, ly - 18 - 30 * cur.load.fz / 3, 0, 14 + 30 * cur.load.fz / 3, t.ink, 2);
        if (Math.abs(cur.load.fx) > 0.01) L.draw.arrow(ctx, (tl[0] + tr[0]) / 2, ly - 6, cur.load.fx / FMAX * 60, 0, t.accent, 2.5);

        // ---- top view of the real 2x2 block
        var T = R.top, comb = cur.skin.comb;
        hdr(T, 'Top view, real block', cur.skin.label + ', bump ' + cur.g.index);
        var ext = p + cur.skin.w / 2 + 0.6, ts = Math.min((T[2] - 24) / (2 * ext), (T[3] - 60) / (2 * ext));
        var ox = T[0] + T[2] / 2, oy = T[1] + 44 + (T[3] - 44) / 2;
        var tX = function (mx) { return ox + mx * ts; }, tY = function (my) { return oy - my * ts; };
        cur.g.taxels.forEach(function (q, i) {
          var x0 = q.dx - comb.w / 2, y1 = q.dy + comb.h / 2;
          ctx.fillStyle = L.alpha(L.seq(cur.counts[i] / full), 1);
          ctx.fillRect(tX(x0), tY(y1), comb.w * ts, comb.h * ts);
          ctx.save();
          ctx.strokeStyle = t.copper; ctx.lineWidth = Math.max(0.6, comb.trace * ts); ctx.lineCap = 'round';
          comb.row.concat(comb.col).forEach(function (sg) {
            ctx.beginPath(); ctx.moveTo(tX(q.dx + sg[0]), tY(q.dy + sg[1])); ctx.lineTo(tX(q.dx + sg[2]), tY(q.dy + sg[3])); ctx.stroke();
          });
          ctx.restore();
          L.draw.circle(ctx, tX(q.dx + comb.via[0]), tY(q.dy + comb.via[1]), comb.via[2] / 2 * ts, t.copper2);
        });
        cur.g.taxels.forEach(function (q, i) {
          var yl = q.v > 0 ? tY(q.dy + comb.h / 2) - 5 : tY(q.dy - comb.h / 2) + 13;
          L.draw.text(ctx, Math.round(cur.counts[i]), tX(q.dx), yl, {size: 10, align: 'center', color: t.ink});
        });
        L.draw.circle(ctx, ox, oy, baseR() * ts, null, t.ink2, 1.2);
        ctx.save(); ctx.setLineDash([3, 3]); L.draw.circle(ctx, ox, oy, topR() * ts, null, t.ink2, 1); ctx.restore();
        if (cur.dec.fx !== null && Math.hypot(cur.dec.fx, cur.dec.fy) > 0.01) {
          L.draw.arrow(ctx, ox, oy, cur.dec.fx / FMAX * ext * ts, -cur.dec.fy / FMAX * ext * ts, t.accent, 2.5);
        }
        L.draw.scalebar(ctx, T[0] + 12, T[1] + T[3] - 12, ts * (p >= 3 ? 2 : 1), (p >= 3 ? 2 : 1) + ' mm');

        // ---- bars
        var Bx = R.bars;
        hdr(Bx, 'Four readings', 'ADC counts, ' + cur.prof.p.material);
        var bx0 = Bx[0] + 34, bw = Bx[2] - 50, by0 = Bx[1] + Bx[3] - 34, bh = Bx[3] - 90;
        L.draw.line(ctx, bx0, by0 + .5, bx0 + bw, by0 + .5, t.ink3, 1);
        L.draw.line(ctx, bx0, by0 - bh, bx0 + bw, by0 - bh, t.ink2, 1, [4, 3]);
        L.draw.text(ctx, String(full), bx0 - 4, by0 - bh + 4, {size: 9.5, align: 'right'});
        L.draw.text(ctx, '0', bx0 - 4, by0 + 3, {size: 9.5, align: 'right'});
        var slot = bw / 4;
        cur.g.taxels.forEach(function (q, i) {
          var c = cur.counts[i], hh = c / full * bh, x = bx0 + i * slot + slot * 0.2, wb = slot * 0.6;
          ctx.fillStyle = L.seq(Math.max(0.35, c / full));
          ctx.fillRect(x, by0 - hh, wb, hh);
          L.draw.text(ctx, Math.round(c), x + wb / 2, by0 - hh - 4, {size: 10, align: 'center', color: t.ink});
          L.draw.text(ctx, (q.u > 0 ? '+x' : '−x') + (q.v > 0 ? '+y' : '−y'), x + wb / 2, by0 + 14, {size: 10, align: 'center'});
        });
      });
      pad.set(0.25, 0);
      update();
    });
  });
})();

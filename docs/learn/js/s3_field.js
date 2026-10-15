/* Study 3: a contact pressed, dragged or twisted on a whole skin. Real layout
 * and shear groups from the manifest; the load field is constructed and each
 * bump responds through js/bumpmodel.js. Arrows are DECODED from the modelled
 * counts, group by group, as a real board's host would decode them. */
(function () {
  'use strict';
  var L = window.OTL, B = window.OTBump;
  var SKINS = [['circle', 'Circle 2.0 mm'], ['agileX_2mm', 'AgileX 2.0 mm'], ['leap_palm', 'LEAP 4.2 mm']];

  function groups(skin) {
    if (skin._groups) return skin._groups;
    var gs = skin.bumps.map(function (c, i) { return {i: i, c: c, taxels: [], signs: []}; });
    skin.b.forEach(function (g, k) {
      if (g < 0) return;
      var c = skin.bumps[g];
      gs[g].taxels.push(k);
      gs[g].signs.push([skin.xy[k][0] > c[0] ? 1 : -1, skin.xy[k][1] > c[1] ? 1 : -1]);
    });
    skin._groups = gs.filter(function (g) { return g.taxels.length; });
    return skin._groups;
  }

  L.study('field', function (fig) {
    return Promise.all([L.loadJSON('meta.json'), L.loadJSON('skins.json')]).then(function (res) {
      var meta = res[0], skins = res[1], h = meta.bump.height;
      var prof = new B.Profile(meta.profiles.v2);
      var st = {skin: 'circle', fn: 10, sigma: 5, shear: 0, dir: 0, twist: 0.4, c: null, arrows: true};

      var controls = L.el('div', {class: 'otl-controls'});
      // a starting force that keeps the default contact below the ADC ceiling on each skin
      var FN0 = {circle: 10, agileX_2mm: 10, leap_palm: 2.5};
      var cSkin = L.seg('Skin', SKINS, st.skin, function (v) { st.skin = v; st.c = null; st.fn = FN0[v]; cFn.set(st.fn); update(); });
      var cFn = L.slider('Normal force', 0, 25, 0.5, st.fn, function (v) { return v.toFixed(1) + ' N'; }, function (v) { st.fn = v; update(); });
      var cSig = L.slider('Contact size σ', 2, 12, 0.5, st.sigma, function (v) { return v.toFixed(1) + ' mm'; }, function (v) { st.sigma = v; update(); });
      var cSh = L.slider('Drag ratio', 0, 0.6, 0.01, st.shear, function (v) { return v.toFixed(2); }, function (v) { st.shear = v; update(); });
      var cDir = L.slider('Drag direction', -180, 180, 5, st.dir, function (v) { return v + '°'; }, function (v) { st.dir = v; update(); });
      var cTw = L.slider('Twist', -0.6, 0.6, 0.01, st.twist, function (v) { return v.toFixed(2); }, function (v) { st.twist = v; update(); });
      var cArr = L.check('Show decoded shear', st.arrows, function (v) { st.arrows = v; canvas.redraw(); });
      var presets = L.el('div', {class: 'otl-ctl'}, [
        L.el('span', {class: 'otl-lab', text: 'Try'}),
        L.button('Press', function () { set(0, 0, 0); }),
        L.button('Drag', function () { set(0.35, 30, 0); }),
        L.button('Twist', function () { set(0, 0, 0.4); }),
        L.button('Reverse twist', function () { set(0, 0, -st.twist || -0.4); })
      ]);
      function set(sh, dir, tw) { st.shear = sh; st.dir = dir; st.twist = tw; cSh.set(sh); cDir.set(dir); cTw.set(tw); update(); }
      [cSkin, cFn, cSig, cSh, cDir, cTw].forEach(function (c) { controls.appendChild(c.el); });
      controls.appendChild(cArr.el); controls.appendChild(presets);
      fig.appendChild(controls);
      var stage = L.el('div', {class: 'otl-stage'}), cell = L.el('div', {class: 'otl-cell'});
      var cv = L.el('canvas', {tabindex: '0', role: 'img', class: 'otl-drag2d',
        'aria-label': 'A skin with modelled taxel readings and decoded shear arrows per bump. Drag on the skin, or use the arrow keys, to move the contact.'});
      cell.appendChild(cv); stage.appendChild(cell); fig.appendChild(stage);
      var m = L.metrics(fig, [['fz', 'Normal force, decoded (applied)'], ['ft', 'Net tangential force, decoded (applied)'],
                              ['tz', 'Twisting moment, decoded (applied)'], ['grp', 'Bumps loaded · cut by the outline']]);
      var status = L.el('div', {class: 'otl-status'}); fig.appendChild(status);

      var cur = null, view = null;
      function update() {
        var skin = skins[st.skin], p = skin.pitch, gs = groups(skin);
        if (!st.c) st.c = L.skinGeom(skin).centroid.slice();
        var cell = (2 * p) * (2 * p), s2 = st.sigma * st.sigma, dir = st.dir * Math.PI / 180;
        var counts = new Float64Array(skin.n), out = [];
        var A = {fz: 0, fx: 0, fy: 0, tz: 0}, D = {fz: 0, fx: 0, fy: 0, tz: 0}, loaded = 0, partial = 0;
        gs.forEach(function (g) {
          var dx = g.c[0] - st.c[0], dy = g.c[1] - st.c[1];
          // normal pressure: a Gaussian of total st.fn, integrated over the bump's cell
          var fz = st.fn * cell / (2 * Math.PI * s2) * Math.exp(-(dx * dx + dy * dy) / (2 * s2));
          // traction proportional to the local normal load: uniform drag + rotation about the contact
          var fx = fz * (st.shear * Math.cos(dir) - st.twist * dy / st.sigma);
          var fy = fz * (st.shear * Math.sin(dir) + st.twist * dx / st.sigma);
          var f = B.taxelForces({fz: fz, fx: fx, fy: fy}, g.signs, p, h);
          // the share of a missing taxel is not measured
          var cs = f.map(function (q) { return prof.counts(q.f, p); });
          cs.forEach(function (c, i) { counts[g.taxels[i]] = c; });
          var dec = B.decode(cs, g.signs, p, h, prof);
          // applied load on what the skin can feel: the taxels that exist
          var frac = g.taxels.length / 4;
          A.fz += fz * frac; A.fx += fx * frac; A.fy += fy * frac; A.tz += (dx * fy - dy * fx) * frac;
          if (dec.fz > 0.002) {
            loaded++;
            if (g.taxels.length < 4) partial++;
            D.fz += dec.fz;
            if (dec.fx !== null) { D.fx += dec.fx; D.tz -= dy * dec.fx; }
            if (dec.fy !== null) { D.fy += dec.fy; D.tz += dx * dec.fy; }
          }
          out.push({g: g, dec: dec});
        });
        cur = {skin: skin, counts: counts, groups: out};
        m.fz.textContent = D.fz.toFixed(2) + ' N (' + A.fz.toFixed(2) + ')';
        m.ft.textContent = Math.hypot(D.fx, D.fy).toFixed(2) + ' N (' + Math.hypot(A.fx, A.fy).toFixed(2) + ')';
        m.tz.textContent = D.tz.toFixed(1) + ' N·mm (' + A.tz.toFixed(1) + ')';
        m.grp.textContent = loaded + ' · ' + partial;
        var sat = 0;
        counts.forEach(function (c) { if (prof.saturated(c)) sat++; });
        var msg, warn = false;
        if (sat) { msg = sat + ' taxels are at the ADC ceiling; their groups decode low.'; warn = true; }
        else if (Math.abs(st.twist) > 0.01 && st.shear < 0.01) msg = 'Twist: the bumps lean around the contact. Their shear nearly cancels in the net force, but the moment does not.';
        else if (st.shear > 0.01) msg = 'Drag: every loaded bump leans the same way, by an amount proportional to its normal load.';
        else msg = 'Press: the normal map alone. Groups the outline cut short (hollow circles) cannot resolve shear along an axis with taxels on one side only.';
        status.textContent = msg;
        status.className = 'otl-status' + (warn ? ' warn' : '');
        canvas.redraw();
      }

      var canvas = new L.Canvas(cv, function (w) {
        var b = L.skinGeom(skins[st.skin]).box, ww = Math.min(w, 560);
        return Math.min(520, (b[3] - b[1] + 8) / (b[2] - b[0] + 8) * ww) + 56;
      }, function (ctx, w, H) {
        if (!cur) return;
        var t = L.theme(), skin = cur.skin, p = skin.pitch, b = L.skinGeom(skin).box;
        view = L.fit([b[0] - 4, b[1] - 4, b[2] + 4, b[3] + 4], [0, 8, w, H - 52], 6);
        var full = prof.p.adc_max;
        L.drawSkin(ctx, view, skin, function (k) { return L.seq(cur.counts[k] / full); });
        // one arrow scale for every bump: 0.3 x the most loaded bump's normal force = one bump pitch
        var fzmax = 0;
        cur.groups.forEach(function (o) { fzmax = Math.max(fzmax, o.dec.fz); });
        cur.groups.forEach(function (o) {
          var x = view.x(o.g.c[0]), y = view.y(o.g.c[1]);
          if (o.g.taxels.length < 4) L.draw.circle(ctx, x, y, Math.max(2.5, 0.35 * p * view.s), null, t.ink2, 1);
          if (!st.arrows) return;
          var fx = o.dec.fx || 0, fy = o.dec.fy || 0, sc = 2 * p * view.s / Math.max(1e-3, 0.3 * fzmax);
          if (Math.hypot(fx, fy) * sc > 1.5) L.draw.arrow(ctx, x, y, fx * sc, -fy * sc, t.accent, 1.8, 7);
        });
        // contact marker
        var cx = view.x(st.c[0]), cy = view.y(st.c[1]);
        L.draw.circle(ctx, cx, cy, st.sigma * view.s, null, t.ink2, 1);
        L.draw.line(ctx, cx - 6, cy, cx + 6, cy, t.ink, 1); L.draw.line(ctx, cx, cy - 6, cx, cy + 6, t.ink, 1);
        L.draw.colorbar(ctx, 12, H - 34, 110, '0', full + ' counts', '');
        L.draw.scalebar(ctx, w - 12 - 10 * view.s, H - 22, 10 * view.s, '10 mm');
        if (w >= 520) L.draw.text(ctx, 'ring: contact σ · arrows: shear decoded per bump, one scale', 140, H - 18, {size: 10});
        else L.draw.text(ctx, 'ring: contact σ · arrows: decoded shear', 12, H - 2, {size: 10});
      });

      L.drag(cv, function (x, y) {
        if (!view) return false;
        st.c = [view.mx(x), view.my(y)]; update();
      });
      cv.addEventListener('keydown', function (e) {
        var d = e.shiftKey ? 5 : 1;
        if (e.key === 'ArrowLeft') st.c[0] -= d; else if (e.key === 'ArrowRight') st.c[0] += d;
        else if (e.key === 'ArrowUp') st.c[1] += d; else if (e.key === 'ArrowDown') st.c[1] -= d;
        else return;
        e.preventDefault(); update();
      });
      update();
    });
  });
})();

/* Study 5: what an xampling frame (grow mode) reads, replayed on a real
 * raster recording. The selection is js/xampling.js, a port of the firmware's
 * ot_xampling.h whose selections match the firmware's on these replays. Frame
 * rates are the measured ones (xampling_m_vs_fps.csv). */
(function () {
  'use strict';
  var L = window.OTL, X = window.OTXamp;
  var SKINS = [['leap_palm', 'LEAP 4.2 mm'], ['foot', 'Foot 3.1 mm'], ['agileX_2mm', 'AgileX 2.0 mm']];
  var OBJECTS = [['tape roll', 'Tape roll'], ['square block', 'Square block'], ['allen key', 'Allen key']];
  var BUDGETS = [16, 32, 64, 128, 256, 512];
  var SLOW = 25;           // playback slow-down

  L.study('sampling', function (fig) {
    return Promise.all([L.loadJSON('meta.json'), L.loadJSON('skins.json')]).then(function (res) {
      var meta = res[0], skins = res[1], xm = meta.xampling, d = xm.defaults;
      var st = {skin: 'agileX_2mm', obj: 'tape roll', m: 64, t: 0, hold: false, playing: false};
      var take = null, run = null, skin = null, grid = null;
      var takes = {};

      var controls = L.el('div', {class: 'otl-controls'});
      var cSkin = L.seg("Sensor layout", SKINS, st.skin, function (v) { st.skin = v; load(); });
      var cObj = L.seg('Object', OBJECTS, st.obj, function (v) { st.obj = v; load(); });
      var cM = L.seg("Search budget M", BUDGETS.map(function (b) { return [b, String(b)]; }), st.m,
                     function (v) { st.m = v; replay(); });
      var cT = L.slider("Recording time", 0, 1, 0.1, 0, function (v) { return v.toFixed(1) + ' ms'; },
                        function (v) { st.t = v; stop(); draw(); });
      var bPlay = L.button('Play', function () { if (st.playing) stop(); else play(); });
      var bPrev = L.button('◀ frame', function () { stop(); stepFrame(-1); });
      var bNext = L.button('frame ▶', function () { stop(); stepFrame(1); });
      bPrev.setAttribute('aria-label', "Previous adaptive-sampling frame");
      bNext.setAttribute('aria-label', "Next adaptive-sampling frame");
      var cHold = L.check("Display last reading for unread taxels", st.hold, function (v) { st.hold = v; draw(); });
      [cSkin, cObj, cM].forEach(function (c) { controls.appendChild(c.el); });
      controls.appendChild(cT.el);
      [bPrev, bPlay, bNext].forEach(function (b) { controls.appendChild(b); });
      controls.appendChild(cHold.el);
      fig.appendChild(controls);

      var stage = L.el('div', {class: 'otl-stage'});
      var cell = L.el('div', {class: 'otl-cell'});
      var cv = L.el('canvas', {tabindex: '0', role: 'img',
        'aria-label': 'Left: the recorded raster frame. Right: the taxels one xampling frame reads. Below: a timeline of how much of the contact each xampling frame reads. Click the timeline to move in time.'});
      cell.appendChild(cv); stage.appendChild(cell); fig.appendChild(stage);
      var m = L.metrics(fig, [['rate', "Replay rate (32 × 32 benchmark)"], ['reads', "Reads: prior contact · search · growth"],
                              ['hit', 'Contact taxels read, this frame'], ['mean', "Mean contact coverage after onset"]]);
      var status = L.el('div', {class: 'otl-status'}); fig.appendChild(status);

      function load() {
        stop();
        var e = meta.takes.filter(function (t) { return t.skin === st.skin && t.object === st.obj; })[0];
        if (!takes[e.take]) takes[e.take] = L.loadJSON('takes/' + e.take + '.json');
        takes[e.take].then(function (tk) {
          take = tk; skin = skins[st.skin];
          grid = new X.Grid(skin.scan);
          var last = take.t_ms[take.t_ms.length - 1];
          cT.input.max = last.toFixed(1);
          if (st.fresh !== take.take) { st.t = take.t_ms[take.half]; st.fresh = take.take; }
          if (st.t > last) st.t = 0;
          cT.set(st.t);
          // Ground truth per recorded frame: value over the Z baseline, and
          // which taxels the firmware would count as triggered.
          take.trig = take.raw.map(function (f) {
            var out = new Uint8Array(f.length);
            for (var k = 0; k < f.length; k++) {
              var v = f[k] > take.z_base[k] ? f[k] - take.z_base[k] : 0;
              out[k] = v >= d.XAMP_THRESH + take.z_noise[k] ? 1 : 0;
            }
            return out;
          });
          replay();
        });
      }

      function replay() {
        if (!take) return;
        var fps = xm.fps[String(st.m)];
        var idx = X.schedule(take.t_ms, fps);
        var settings = {mode: X.GROW, m: st.m, threshold: d.XAMP_THRESH, searchMin: d.XAMP_SEARCH_MIN,
                        bumpFill: !!d.XAMP_BUMP_FILL};
        var frames = X.replay(grid, settings, take.z_base, take.z_noise, idx.length,
                              function (k) { return take.raw[idx[k]]; }, xm.pattern);
        var cover = frames.map(function (f, k) {
          var tr = take.trig[idx[k]], hit = 0, all = 0;
          for (var j = 0; j < tr.length; j++) if (tr[j]) { all++; if (f.sampled[j]) hit++; }
          return [hit, all];
        });
        run = {fps: fps, period: 1000 / fps, idx: idx, frames: frames, cover: cover};
        var sum = 0, n = 0, onT = take.t_ms[take.onset];
        cover.forEach(function (c, k) { if (k * run.period >= onT && c[1]) { sum += c[0] / c[1]; n++; } });
        m.mean.textContent = n ? Math.round(100 * sum / n) + '% (mean)' : '—';
        m.rate.textContent = Math.round(fps) + ' fps · ' + run.period.toFixed(2) + ' ms';
        run.maxContact = Math.max(st.m, Math.max.apply(null, cover.map(function (c) { return c[1]; })));
        draw();
      }

      function current() {
        var k = Math.min(run.frames.length - 1, Math.floor(st.t / run.period + 1e-9));
        return k;
      }
      function stepFrame(dir) {
        if (!run) return;
        var k = Math.max(0, Math.min(run.frames.length - 1, current() + dir));
        st.t = +(k * run.period).toFixed(2); cT.set(st.t); draw();
      }

      var raf = 0, lastTs = 0;
      function play() {
        if (!run) return;
        st.playing = true; bPlay.textContent = 'Pause';
        if (st.t >= take.t_ms[take.t_ms.length - 1]) st.t = 0;
        lastTs = performance.now();
        var tick = function (ts) {
          if (!st.playing) return;
          st.t += (ts - lastTs) / SLOW; lastTs = ts;
          var end = take.t_ms[take.t_ms.length - 1];
          if (st.t >= end) { st.t = end; stop(); }
          cT.set(st.t); draw();
          if (st.playing) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      }
      function stop() { st.playing = false; bPlay.textContent = 'Play'; cancelAnimationFrame(raf); }
      document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); });

      function geometry(w) {
        var box = L.skinGeom(skins[st.skin]).box, wide = w >= 600, pad = 10, head = 40, strip = 92;
        var colW = wide ? w / 2 : w;
        var s = (colW - 2 * pad) / (box[2] - box[0] + 4);
        var ph = (box[3] - box[1] + 4) * s;
        if (ph > 400) { s *= 400 / ph; ph = 400; }
        var panelsH = wide ? head + ph + 28 : 2 * (head + ph + 28);
        return {wide: wide, pad: pad, head: head, colW: colW, s: s, ph: ph, box: box,
                strip: [pad + 30, panelsH + 22, w - 2 * pad - 80, strip - 42], height: panelsH + strip + 10};
      }

      var hatch = null;
      function hatchPattern(ctx) {
        var t = L.theme(), c = document.createElement('canvas');
        c.width = 6; c.height = 6;
        var g = c.getContext('2d');
        g.strokeStyle = t.ink3; g.lineWidth = 0.8;
        g.beginPath(); g.moveTo(0, 6); g.lineTo(6, 0); g.stroke();
        return ctx.createPattern(c, 'repeat');
      }
      L.onTheme(function () { hatch = null; });

      var canvas = new L.Canvas(cv, function (w) { return geometry(w).height; }, function (ctx, w) {
        if (!run) return;
        var t = L.theme(), G = geometry(w), sk = skins[st.skin];
        if (!hatch) hatch = hatchPattern(ctx);
        var k = current(), fr = run.frames[k], ri = run.idx[k], raw = take.raw[ri];
        var full = 4095;
        // panel 1: recorded raster frame
        var panels = [0, 1].map(function (i) {
          var x0 = G.wide ? i * G.colW : 0, y0 = G.wide ? 0 : i * (G.head + G.ph + 28);
          var bw = (G.box[2] - G.box[0] + 4) * G.s;
          var rect = [x0 + (G.colW - bw) / 2, y0 + G.head, bw, G.ph];
          return {x0: x0, y0: y0, view: L.fit([G.box[0] - 2, G.box[1] - 2, G.box[2] + 2, G.box[3] + 2], rect, 0)};
        });
        if (G.wide) L.draw.line(ctx, G.colW + 0.5, 8, G.colW + 0.5, G.head + G.ph, t.hair, 1);
        var nTrig = 0;
        take.trig[ri].forEach(function (v) { nTrig += v; });
        L.draw.text(ctx, 'Recorded raster frame (every taxel)', panels[0].x0 + G.pad, panels[0].y0 + 16, {size: 12, color: t.ink, weight: '500'});
        L.draw.text(ctx, 'frame ' + (take.first_frame + ri) + ' at ' + take.t_ms[ri].toFixed(1) + ' ms · ' + nTrig + ' taxels above threshold',
                    panels[0].x0 + G.pad, panels[0].y0 + 31, {size: 10.5});
        L.drawSkin(ctx, panels[0].view, sk, function (j) {
          var v = raw[j] > take.z_base[j] ? raw[j] - take.z_base[j] : 0;
          return L.seq(v / full);
        });
        // panel 2: what this xampling frame read
        var nRead = 0;
        for (var j = 0; j < fr.sampled.length; j++) nRead += fr.sampled[j];
        L.draw.text(ctx, 'Xampling frame ' + k + ' (M = ' + st.m + ')', panels[1].x0 + G.pad, panels[1].y0 + 16, {size: 12, color: t.ink, weight: '500'});
        L.draw.text(ctx, 'at ' + (k * run.period).toFixed(2) + ' ms · read ' + nRead + ' of ' + sk.n + ' taxels',
                    panels[1].x0 + G.pad, panels[1].y0 + 31, {size: 10.5});
        var held = null;
        if (st.hold) {
          held = new Float64Array(sk.n).fill(-1);
          for (var q = 0; q <= k; q++) {
            var f2 = run.frames[q];
            for (var j2 = 0; j2 < sk.n; j2++) if (f2.sampled[j2]) held[j2] = f2.values[j2];
          }
        }
        L.drawSkin(ctx, panels[1].view, sk, function (j) {
          if (fr.sampled[j]) return L.seq(fr.values[j] / full);
          if (held && held[j] >= 0) return L.alpha(L.seq(held[j] / full), 0.45);
          return hatch;
        }, {stroke: function (j) { return fr.sampled[j] ? t.ink2 : null; }});
        // legend
        var lx = panels[1].x0 + G.pad + (G.wide ? 0 : 0), ly = panels[1].y0 + G.head + G.ph + 8;
        ctx.fillStyle = L.seq(0.6); ctx.fillRect(lx, ly, 9, 9); ctx.strokeStyle = t.ink2; ctx.strokeRect(lx + .5, ly + .5, 8, 8);
        L.draw.text(ctx, 'read this frame', lx + 14, ly + 8, {size: 10});
        ctx.fillStyle = hatch; ctx.fillRect(lx + 104, ly, 9, 9);
        L.draw.text(ctx, st.hold ? 'not read (faded: its last reading)' : 'not read this frame', lx + 118, ly + 8, {size: 10});
        L.draw.colorbar(ctx, panels[0].x0 + G.pad, panels[0].y0 + G.head + G.ph + 9, 90, '0', '4095 counts', '');

        // timeline strip: contact taxels in the recorded frame (area) and how
        // many of them this xampling frame read (line); dashed: the budget M.
        var S = G.strip, end = take.t_ms[take.t_ms.length - 1], X0 = S[0], W = S[2], Y0 = S[1], H = S[3];
        var tx = function (ms) { return X0 + ms / end * W; };
        var ymax = run.maxContact, ty = function (v) { return Y0 + H - v / ymax * H; };
        L.draw.text(ctx, G.wide ? 'Taxels above threshold: in the recorded frame (grey) and read by xampling (line)'
                                : 'Above threshold: recorded (grey), read (line)', X0, Y0 - 6, {size: 10.5, color: t.ink2});
        ctx.fillStyle = L.alpha(t.ink, 0.12);
        ctx.beginPath(); ctx.moveTo(tx(0), ty(0));
        take.t_ms.forEach(function (ms, q) {
          var v = 0, tr = take.trig[q];
          for (var j = 0; j < tr.length; j++) v += tr[j];
          ctx.lineTo(tx(ms), ty(v));
          if (q + 1 < take.t_ms.length) ctx.lineTo(tx(take.t_ms[q + 1]), ty(v));
        });
        ctx.lineTo(tx(end), ty(0)); ctx.closePath(); ctx.fill();
        L.draw.line(ctx, X0, Y0 + H + .5, X0 + W, Y0 + H + .5, t.ink3, 1);
        L.draw.line(ctx, X0, ty(st.m), X0 + W, ty(st.m), t.ink2, 1, [4, 3]);
        L.draw.text(ctx, 'M = ' + st.m, X0 + W + 4, ty(st.m) + 3, {size: 9.5});
        L.draw.text(ctx, String(ymax), X0 - 4, Y0 + 4, {size: 9.5, align: 'right'});
        L.draw.text(ctx, '0', X0 - 4, Y0 + H + 3, {size: 9.5, align: 'right'});
        var on = tx(take.t_ms[take.onset]);
        L.draw.line(ctx, on, Y0, on, Y0 + H, t.ink3, 1, [3, 3]);
        L.draw.text(ctx, 'press onset', on + 3, Y0 + 9, {size: 9.5});
        take.t_ms.forEach(function (ms) { L.draw.line(ctx, tx(ms), Y0 + H + 3, tx(ms), Y0 + H + 7, t.ink3, 1); });
        L.draw.text(ctx, '0 ms', X0, Y0 + H + 19, {size: 9.5});
        L.draw.text(ctx, 'ticks: recorded raster frames, ' + Math.round(take.fps) + ' fps', X0 + W / 2, Y0 + H + 19, {size: 9.5, align: 'center'});
        L.draw.text(ctx, end.toFixed(0) + ' ms', X0 + W, Y0 + H + 19, {size: 9.5, align: 'right'});
        ctx.save();
        ctx.strokeStyle = t.accent; ctx.lineWidth = 1.5; ctx.beginPath();
        run.cover.forEach(function (c, q) {
          var x = tx(q * run.period), y = ty(c[0]);
          if (q) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        });
        ctx.stroke(); ctx.restore();
        var cx = tx(k * run.period);
        L.draw.line(ctx, cx, Y0 - 2, cx, Y0 + H + 2, t.ink, 1.5);

        // metrics
        var c = run.cover[k];
        m.reads.textContent = fr.fromPriority + ' · ' + fr.fromPattern + ' · ' + fr.fromGrowth;
        m.hit.textContent = c[1] ? c[0] + ' of ' + c[1] : 'no contact';
        var msg;
        if (c[1] > st.m) msg = 'The contact covers ' + c[1] + ' taxels, more than M = ' + st.m + ": expansion adds reads beyond M. Hardware frames take longer; this replay keeps a fixed period.";
        else msg = "Unread taxels have no new measurement in this frame.";
        status.textContent = msg;
      });
      function draw() { canvas.redraw(); }

      // click / drag on the timeline to scrub
      L.drag(cv, function (x, y, phase) {
        if (!run) return false;
        var G = geometry(canvas.w), S = G.strip;
        if (phase === 'down' && (y < S[1] - 12 || y > S[1] + S[3] + 12)) return false;
        var end = take.t_ms[take.t_ms.length - 1];
        stop();
        st.t = Math.max(0, Math.min(end, (x - S[0]) / S[2] * end));
        cT.set(st.t); draw();
      });
      cv.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { stop(); stepFrame(1); e.preventDefault(); }
        else if (e.key === 'ArrowLeft') { stop(); stepFrame(-1); e.preventDefault(); }
      });

      load();
    });
  });
})();

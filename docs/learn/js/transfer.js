/* OpenTac-Transfer, geometric step: a port of Layout and Transfer from
 * opentac_transfer.py (tactile_imu_fast_cfg). A frame on skin A is placed on
 * skin B (rotate about a point, then shift), each A cell is cut into s x s
 * sub-cells carrying equal shares ("box" kernel), and each share lands in the
 * B cell that contains it. Shares that land on no B taxel are lost.
 *
 * Calibration and B's sensor model (the rest of opentac_transfer.py) are not
 * applied here; the page transfers counts as a proxy, see the page text.
 * scripts/learn/check_transfer.py compares this file with the Python.
 */
(function (root) {
  'use strict';

  // numpy's round(): half to even.
  function rint(x) {
    var r = Math.round(x);
    if (Math.abs(x - Math.trunc(x)) === 0.5) r = 2 * Math.round(x / 2);
    return r;
  }

  function Layout(xy, pitch) {
    this.xy = xy; this.pitch = pitch; this.n = xy.length; this.ref = xy[0];
    this.lookup = new Map();
    var cx = 0, cy = 0;
    for (var k = 0; k < xy.length; k++) {
      var i = rint((xy[k][0] - this.ref[0]) / pitch), j = rint((xy[k][1] - this.ref[1]) / pitch);
      this.lookup.set(i + ',' + j, k);
      cx += xy[k][0]; cy += xy[k][1];
    }
    this.centroid = [cx / this.n, cy / this.n];
  }
  Layout.prototype.indexOf = function (x, y) {
    var i = rint((x - this.ref[0]) / this.pitch), j = rint((y - this.ref[1]) / this.pitch);
    var k = this.lookup.get(i + ',' + j);
    return k === undefined ? -1 : k;
  };

  // angleDeg about `about` (A mm), then shift (mm): A's frame into B's.
  function Transfer(a, b, angleDeg, shift, about) {
    var s = Math.max(4, Math.ceil(4 * a.pitch / b.pitch));
    var offs = [];
    for (var v = 0; v < s; v++) for (var u = 0; u < s; u++) {
      offs.push([((u + 0.5) / s - 0.5) * a.pitch, ((v + 0.5) / s - 0.5) * a.pitch]);
    }
    var w = 1 / offs.length, th = angleDeg * Math.PI / 180, c = Math.cos(th), sn = Math.sin(th);
    this.a = a; this.b = b;
    this.rows = new Array(a.n);
    this.kept = new Float64Array(a.n);
    for (var i = 0; i < a.n; i++) {
      var acc = new Map();
      for (var q = 0; q < offs.length; q++) {
        var px = a.xy[i][0] + offs[q][0] - about[0], py = a.xy[i][1] + offs[q][1] - about[1];
        var bx = px * c - py * sn + about[0] + shift[0], by = px * sn + py * c + about[1] + shift[1];
        var j = b.indexOf(bx, by);
        if (j >= 0) { acc.set(j, (acc.get(j) || 0) + w); this.kept[i] += w; }
      }
      this.rows[i] = Array.from(acc.entries());
    }
  }
  Transfer.prototype.apply = function (fa) {
    var fb = new Float64Array(this.b.n), lost = 0;
    for (var i = 0; i < this.a.n; i++) {
      var f = fa[i];
      if (!f) continue;
      var row = this.rows[i];
      for (var r = 0; r < row.length; r++) fb[row[r][0]] += row[r][1] * f;
      lost += (1 - this.kept[i]) * f;
    }
    return {values: fb, lost: lost};
  };

  var api = {Layout: Layout, Transfer: Transfer, rint: rint};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.OTTransfer = api;
})(typeof window !== 'undefined' ? window : this);

/* The bump model used by studies 2 and 3. It is a model, not measured data.
 *
 * Mechanics: TactileSim's lumped statics (tactilesim/sim.py,
 * Lattice.base_moments and Lattice.taxel_forces). A tangential load F_t at the
 * bump top puts a base moment F_t * h / 2 into the bump's base (guided
 * cantilever); an off-centre normal load F_z at offset e adds F_z * e. The base
 * load is shared by the 2x2 taxels under the bump:
 *
 *     F_uv = F_z / 4 + (u * M_y + v * M_x') / (4 a),   a = pitch / 2,  clipped at 0
 *
 * with M_y = F_x h / 2 + F_z e_x and M_x' = F_y h / 2 + F_z e_y, u, v = +-1 the
 * side of the bump centre the taxel is on.
 *
 * Electronics: TactileSim's fitted film profiles (tactilesim/readout.py):
 *     counts = min(adc_max, k * A^s * p^b),  p = F / A in kPa,  A = pitch^2 in mm^2.
 *
 * Decoding: the paper's features h_z = sum z, h_x = sum u z, h_y = sum v z on
 * counts, and the model inverse (counts -> N per taxel -> forces).
 */
(function (root) {
  'use strict';

  function Profile(p) { this.p = p; }
  Profile.prototype.gain = function (pitch) { return this.p.k * Math.pow(pitch * pitch, this.p.s); };
  Profile.prototype.counts = function (force, pitch) {
    if (!(force > 0)) return 0;
    var kpa = force / (pitch * pitch) * 1e3;
    return Math.min(this.p.adc_max, this.gain(pitch) * Math.pow(kpa, this.p.b));
  };
  Profile.prototype.force = function (counts, pitch) {
    if (counts <= 3 * this.p.noise_counts) return 0;
    var kpa = Math.pow(counts / this.gain(pitch), 1 / this.p.b);
    return kpa * pitch * pitch * 1e-3;
  };
  Profile.prototype.saturated = function (counts) { return counts >= this.p.adc_max - 1e-6; };

  // Forces on the taxels of one bump. signs: [[u, v], ...] for the taxels that
  // exist (a group cut by the outline has fewer than four).
  function taxelForces(load, signs, pitch, height) {
    var a = pitch / 2;
    var my = load.fx * height / 2 + load.fz * (load.ex || 0);
    var mx = load.fy * height / 2 + load.fz * (load.ey || 0);
    return signs.map(function (s) {
      var f = load.fz / 4 + (s[0] * my + s[1] * mx) / (4 * a);
      return {raw: f, f: Math.max(0, f)};
    });
  }

  // Decode one group from counts. Returns features on counts and the model
  // inverse; an axis is null when the group has taxels on one side only.
  function decode(counts, signs, pitch, height, profile) {
    var hz = 0, hx = 0, hy = 0, fz = 0, sx = 0, sy = 0, has = {xp: 0, xm: 0, yp: 0, ym: 0};
    counts.forEach(function (c, i) {
      var u = signs[i][0], v = signs[i][1], f = profile.force(c, pitch);
      hz += c; hx += u * c; hy += v * c;
      fz += f; sx += u * f; sy += v * f;
      if (u > 0) has.xp++; else has.xm++;
      if (v > 0) has.yp++; else has.ym++;
    });
    var okx = has.xp && has.xm && has.xp === has.xm, oky = has.yp && has.ym && has.yp === has.ym;
    var n = counts.length, scale = 4 / Math.max(1, n);   // a full group has 4 taxels
    return {hz: hz, hx: okx ? hx : null, hy: oky ? hy : null,
            fz: fz * scale,
            fx: okx ? sx * pitch / height * scale : null,
            fy: oky ? sy * pitch / height * scale : null};
  }

  var api = {Profile: Profile, taxelForces: taxelForces, decode: decode};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.OTBump = api;
})(typeof window !== 'undefined' ? window : this);

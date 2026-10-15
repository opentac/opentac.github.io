/* OpenTac-Xampling, frame selection only: a line-by-line port of
 * ot_xampling.h (xampFrame and the functions it calls) from the
 * tactile_imu_fast_cfg firmware. Same passes, same order, same budgets:
 *
 *   1. last frame's trigger points (hot start), grown;
 *   2. the quadtree search pattern (SEARCH_MIN points in FIXED), grown;
 *   3. FIXED only: the rest of M from the pattern; its triggers grow next frame.
 *
 * Entries are scan-plan entries (built by buildScanPlan() on the board, and by
 * scripts/learn/build_data.py here). Bitsets in the C code are iterated in
 * increasing entry order; plain arrays scanned 0..n-1 reproduce that order.
 * scripts/learn/check_xampling.py runs this file against the C header compiled
 * on the host and checks the selections are identical.
 *
 * Works in the browser (window.OTXamp) and in node (module.exports).
 */
(function (root) {
  'use strict';
  var SIDE = 32, NONE = 0xFFFF, MAX_PRIORITY = 50, FIXED = 1, GROW = 2;

  // grid: {entryOut, entryPos, groupRadius, shear} from skins.json "scan".
  function Grid(scan) {
    var n = scan.entryOut.length;
    this.active = n;
    this.entryOut = scan.entryOut;
    this.entryPos = scan.entryPos;
    this.groupRadius = scan.groupRadius;
    this.shear = scan.shear;                       // per taxel, 0xFFFF = none
    this.gridEntry = new Array(SIDE * SIDE).fill(NONE);
    for (var e = 0; e < n; e++) this.gridEntry[scan.entryPos[e]] = e;
  }

  function State() { this.reset(); }
  State.prototype.reset = function () {
    this.priority = []; this.priorityValue = [];
    this.shiftRow = 0; this.shiftCol = 0;
  };

  // One frame. read(taxel) returns the raw count of that taxel now.
  // Returns {sampled: Uint8Array over TAXELS, values, tallies}.
  function frame(grid, settings, baseline, noise, state, read, pattern) {
    var n = grid.active, out = grid.entryOut;
    var sampled = new Uint8Array(n), pending = new Uint8Array(n), frontier = new Uint8Array(n);
    var values = new Int32Array(n), taxelMask = new Uint8Array(n);
    var st = {count: 0, limit: 0, peak: 0, fromPriority: 0, fromPattern: 0, fromGrowth: 0,
              batches: 0, confirms: 0};
    var margin = settings.threshold;

    function queue(entry) {
      if (entry === NONE || st.count >= st.limit) return false;
      if (sampled[entry] || pending[entry]) return false;
      pending[entry] = 1; st.count++;
      return true;
    }
    function remember(entry, value) {
      var pr = state.priority, pv = state.priorityValue, at = pr.length;
      if (at === MAX_PRIORITY) {
        if (value <= pv[at - 1]) return;
        at--;                                     // replace the weakest
      } else { pr.push(0); pv.push(0); }
      while (at > 0 && pv[at - 1] < value) { pr[at] = pr[at - 1]; pv[at] = pv[at - 1]; at--; }
      pr[at] = entry; pv[at] = value;
    }
    function rememberPass() {
      for (var e = 0; e < n; e++) if (frontier[e]) remember(e, values[out[e]]);
    }
    function readBatch() {
      st.batches++;
      for (var e = 0; e < n; e++) {
        if (!pending[e]) continue;
        sampled[e] = 1; pending[e] = 0;
        var taxel = out[e], raw = read(taxel), base = baseline[taxel];
        var value = raw > base ? raw - base : 0;
        var trigger = margin + (noise ? noise[taxel] : 0);
        if (value >= trigger) {                   // settle-and-confirm: a replay re-reads
          raw = read(taxel);                      // the same recorded value
          value = raw > base ? raw - base : 0;
          st.confirms++;
        }
        values[taxel] = value; taxelMask[taxel] = 1;
        if (value > st.peak) st.peak = value;
        if (value >= trigger) frontier[e] = 1;
      }
    }
    function queueWithBump(entry) {
      var group = (grid.groupRadius && settings.bumpFill) ? grid.shear[out[entry]] : NONE;
      if (group === NONE) { queue(entry); return; }
      var r0 = grid.entryPos[entry] >> 5, c0 = grid.entryPos[entry] & 31, rad = grid.groupRadius;
      for (var r = r0 - rad; r <= r0 + rad; r++) {
        if (r < 0 || r >= SIDE) continue;
        for (var c = c0 - rad; c <= c0 + rad; c++) {
          if (c < 0 || c >= SIDE) continue;
          var other = grid.gridEntry[(r << 5) | c];
          if (other !== NONE && grid.shear[out[other]] === group) queue(other);
        }
      }
    }
    function grow() {
      for (;;) {
        var wave = frontier.slice(), any = false;
        frontier.fill(0);
        for (var w = 0; w < n; w++) if (wave[w]) { any = true; break; }
        if (!any) return;
        var before = st.count;
        for (var e = 0; e < n; e++) {
          if (!wave[e]) continue;
          var r0 = grid.entryPos[e] >> 5, c0 = grid.entryPos[e] & 31;
          for (var r = r0 - 1; r <= r0 + 1; r++) {
            if (r < 0 || r >= SIDE) continue;
            for (var c = c0 - 1; c <= c0 + 1; c++) {
              if (c < 0 || c >= SIDE) continue;
              var near = grid.gridEntry[(r << 5) | c];
              if (near !== NONE) queueWithBump(near);
            }
          }
        }
        if (st.count === before) return;
        st.fromGrowth += st.count - before;
        readBatch();
      }
    }
    function patternEntry(index) {
      return grid.gridEntry[(((pattern.row[index] + state.shiftRow) & 31) << 5) |
                            ((pattern.col[index] + state.shiftCol) & 31)];
    }

    var fixed = settings.mode === FIXED;
    var m = settings.m ? settings.m : 1;
    if (m > n) m = n;
    st.limit = fixed ? m : n;
    var searchMin = settings.searchMin < st.limit ? settings.searchMin : st.limit;
    var patternTarget = fixed ? st.limit : (m > searchMin ? m : searchMin);

    var previous = state.priority.slice();
    state.priority = []; state.priorityValue = [];

    // Pass 1: last frame's seeds, grown first. In FIXED they may not eat into
    // the SEARCH_MIN reserve.
    var limit = st.limit;
    if (fixed) st.limit = limit > searchMin ? limit - searchMin : 0;
    for (var p = 0; p < previous.length; p++) if (queue(previous[p])) st.fromPriority++;
    readBatch(); rememberPass(); grow();
    st.limit = limit;

    // Pass 2: the search.
    var firstSearch = fixed ? searchMin : patternTarget, index = 0;
    while (st.fromPattern < firstSearch && st.count < st.limit && index < 1024) {
      if (queue(patternEntry(index++))) st.fromPattern++;
    }
    readBatch(); rememberPass(); grow();

    // Pass 3, FIXED only: fill the rest of M from the pattern.
    if (fixed && st.count < st.limit) {
      while (st.count < st.limit && index < 1024) {
        if (queue(patternEntry(index++))) st.fromPattern++;
      }
      readBatch(); rememberPass();
      frontier.fill(0);
    }

    // Slide the pattern one taxel diagonally, one extra column when the row wraps.
    state.shiftRow = (state.shiftRow + 1) & 31;
    state.shiftCol = (state.shiftCol + (state.shiftRow === 0 ? 2 : 1)) & 31;

    return {sampled: taxelMask, values: values,
            fromPriority: st.fromPriority, fromPattern: st.fromPattern,
            fromGrowth: st.fromGrowth, count: st.count};
  }

  // Run a whole replay: frameAt(k) gives the raw frame (array by taxel) that
  // xampling frame k reads.
  function replay(grid, settings, baseline, noise, nFrames, frameAt, pattern) {
    var state = new State(), outFrames = [];
    for (var k = 0; k < nFrames; k++) {
      var raw = frameAt(k);
      outFrames.push(frame(grid, settings, baseline, noise, state,
                           function (t) { return raw[t]; }, pattern));
    }
    return outFrames;
  }

  // Time model for replaying a raster recording: xampling frame k happens at
  // k * 1000 / fps ms and reads the latest recorded frame at or before then
  // (the contact is held between recorded frames). Returns raster indices.
  function schedule(tMs, fps) {
    var period = 1000 / fps, last = tMs[tMs.length - 1];
    var n = Math.floor(last / period) + 1, idx = new Array(n), j = 0;
    for (var k = 0; k < n; k++) {
      var t = k * period;
      while (j + 1 < tMs.length && tMs[j + 1] <= t) j++;
      idx[k] = j;
    }
    return idx;
  }

  var api = {Grid: Grid, State: State, frame: frame, replay: replay, schedule: schedule,
             FIXED: FIXED, GROW: GROW, NONE: NONE};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.OTXamp = api;
})(typeof window !== 'undefined' ? window : this);

// Şehir içi yol bulma: engellerden ızgara (0.75 m) çıkarılır, A* ile yol bulunur, görüş hattıyla kısaltılır.
// Tıklanan yer bir binanın arkasındaysa oyuncu binanın etrafından dolaşır.
const Nav = {
  C: 0.75, R: 36, grid: null, n: 0,
  build(world) {
    const n = this.n = Math.ceil(this.R * 2 / this.C), g = this.grid = new Uint8Array(n * n);
    for (const o of world.obstacles) {
      if (Math.max(Math.abs(o.x), Math.abs(o.z)) > this.R + o.r + 1) continue;
      const rr = o.r + 0.5, i0 = this.ix(o.x - rr), i1 = this.ix(o.x + rr), j0 = this.ix(o.z - rr), j1 = this.ix(o.z + rr);
      for (let j = Math.max(0, j0); j <= Math.min(n - 1, j1); j++) for (let i = Math.max(0, i0); i <= Math.min(n - 1, i1); i++) {
        const cx = this.wx(i), cz = this.wx(j);
        if (Math.hypot(cx - o.x, cz - o.z) < rr) g[j * n + i] = 1;
      }
    }
    this.world = world;
  },
  ix(v) { return Math.floor((v + this.R) / this.C); },
  wx(i) { return -this.R + (i + 0.5) * this.C; },
  inside(x, z) { return Math.abs(x) < this.R - 1 && Math.abs(z) < this.R - 1; },
  blocked(i, j) { return i < 0 || j < 0 || i >= this.n || j >= this.n || this.grid[j * this.n + i] === 1; },
  los(ax, az, bx, bz) {
    const d = Math.hypot(bx - ax, bz - az), steps = Math.ceil(d / (this.C * 0.5));
    for (let k = 1; k < steps; k++) { const t = k / steps; if (this.blocked(this.ix(ax + (bx - ax) * t), this.ix(az + (bz - az) * t))) return false; }
    return true;
  },
  nearestFree(i, j) {
    if (!this.blocked(i, j)) return [i, j];
    for (let r = 1; r < 8; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) if (Math.max(Math.abs(di), Math.abs(dj)) === r && !this.blocked(i + di, j + dj)) return [i + di, j + dj];
    return null;
  },
  // [{x,z}, ...] ya da null (yol yok / gerek yok)
  path(world, sx, sz, tx, tz) {
    if (!this.grid || this.world !== world) this.build(world);
    if (!this.inside(sx, sz) || !this.inside(tx, tz)) return null;
    if (this.los(sx, sz, tx, tz)) return null;
    const n = this.n, s = this.nearestFree(this.ix(sx), this.ix(sz)), t = this.nearestFree(this.ix(tx), this.ix(tz));
    if (!s || !t) return null;
    const start = s[1] * n + s[0], goal = t[1] * n + t[0];
    const gS = new Float32Array(n * n).fill(1e9), from = new Int32Array(n * n).fill(-1), closed = new Uint8Array(n * n);
    const open = [start]; gS[start] = 0;
    const h = k => Math.hypot((k % n) - t[0], Math.floor(k / n) - t[1]);
    const fS = new Float32Array(n * n).fill(1e9); fS[start] = h(start);
    let iter = 0;
    while (open.length && iter++ < 20000) {
      let bi = 0; for (let q = 1; q < open.length; q++) if (fS[open[q]] < fS[open[bi]]) bi = q;
      const cur = open[bi]; open[bi] = open[open.length - 1]; open.pop();
      if (cur === goal) break;
      closed[cur] = 1;
      const ci = cur % n, cj = Math.floor(cur / n);
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const ni = ci + di, nj = cj + dj;
        if (this.blocked(ni, nj) || (di && dj && (this.blocked(ci + di, cj) || this.blocked(ci, cj + dj)))) continue;
        const k = nj * n + ni; if (closed[k]) continue;
        const g2 = gS[cur] + (di && dj ? 1.414 : 1);
        if (g2 < gS[k]) { gS[k] = g2; fS[k] = g2 + h(k); from[k] = cur; if (!open.includes(k)) open.push(k); }
      }
    }
    if (from[goal] < 0) return null;
    const cells = []; for (let k = goal; k !== start && k >= 0; k = from[k]) cells.push({ x: this.wx(k % n), z: this.wx(Math.floor(k / n)) });
    cells.reverse();
    cells[cells.length - 1] = { x: tx, z: tz };
    // görüş hattıyla kısalt
    const out = []; let ax = sx, az = sz, i = 0;
    while (i < cells.length) {
      let j = cells.length - 1;
      while (j > i && !this.los(ax, az, cells[j].x, cells[j].z)) j--;
      out.push(cells[j]); ax = cells[j].x; az = cells[j].z; i = j + 1;
    }
    return out;
  }
};

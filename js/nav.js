// Yol bulma: engellerden ızgara çıkarılır, A* (ikili yığın) ile yol bulunur, görüş hattıyla kısaltılır.
// Şehirde ±36 m (0.75 m hücre); zindanda bütün harita (1 m hücre, duvarlar dahil).
const Nav = {
  grid: null, n: 0,
  build(world) {
    this.world = world;
    this.C = Dungeon.on ? 1 : 0.75; this.R = Dungeon.on ? 160 : 36;
    const n = this.n = Math.ceil(this.R * 2 / this.C), g = this.grid = new Uint8Array(n * n);
    if (Dungeon.on) for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const x = this.wx(i), z = this.wx(j); if (!(Dungeon.walk(x - 0.5, z - 0.5) && Dungeon.walk(x + 0.5, z + 0.5) && Dungeon.walk(x - 0.5, z + 0.5) && Dungeon.walk(x + 0.5, z - 0.5))) g[j * n + i] = 1; }
    for (const o of world.obstacles) {
      if (Math.max(Math.abs(o.x), Math.abs(o.z)) > this.R + o.r + 1) continue;
      const rr = o.r + 0.5, i0 = this.ix(o.x - rr), i1 = this.ix(o.x + rr), j0 = this.ix(o.z - rr), j1 = this.ix(o.z + rr);
      for (let j = Math.max(0, j0); j <= Math.min(n - 1, j1); j++) for (let i = Math.max(0, i0); i <= Math.min(n - 1, i1); i++) {
        if (Math.hypot(this.wx(i) - o.x, this.wx(j) - o.z) < rr) g[j * n + i] = 1;
      }
    }
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
    for (let r = 1; r < 10; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) if (Math.max(Math.abs(di), Math.abs(dj)) === r && !this.blocked(i + di, j + dj)) return [i + di, j + dj];
    return null;
  },
  path(world, sx, sz, tx, tz) {
    if (!this.grid || this.world !== world) this.build(world);
    if (!this.inside(sx, sz) || !this.inside(tx, tz)) return null;
    if (this.los(sx, sz, tx, tz)) return null;
    const n = this.n, s = this.nearestFree(this.ix(sx), this.ix(sz)), t = this.nearestFree(this.ix(tx), this.ix(tz));
    if (!s || !t) return null;
    const start = s[1] * n + s[0], goal = t[1] * n + t[0];
    const N = n * n;
    if (!this.gS || this.gS.length !== N) { this.gS = new Float32Array(N); this.from = new Int32Array(N); this.closed = new Uint8Array(N); }
    const gS = this.gS.fill(1e9), from = this.from.fill(-1), closed = this.closed.fill(0);
    const heap = [], hf = [];               // ikili yığın: düğüm, f
    const push = (k, f) => { heap.push(k); hf.push(f); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (hf[p] <= hf[i]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; [hf[p], hf[i]] = [hf[i], hf[p]]; i = p; } };
    const pop = () => { const top = heap[0], lk = heap.pop(), lf = hf.pop(); if (heap.length) { heap[0] = lk; hf[0] = lf; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && hf[l] < hf[m]) m = l; if (r < heap.length && hf[r] < hf[m]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; [hf[m], hf[i]] = [hf[i], hf[m]]; i = m; } } return top; };
    const h = k => Math.hypot((k % n) - t[0], Math.floor(k / n) - t[1]);
    gS[start] = 0; push(start, h(start));
    let iter = 0;
    while (heap.length && iter++ < 60000) {
      const cur = pop();
      if (cur === goal) break;
      if (closed[cur]) continue;
      closed[cur] = 1;
      const ci = cur % n, cj = Math.floor(cur / n);
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const ni = ci + di, nj = cj + dj;
        if (this.blocked(ni, nj) || (di && dj && (this.blocked(ci + di, cj) || this.blocked(ci, cj + dj)))) continue;
        const k = nj * n + ni; if (closed[k]) continue;
        const g2 = gS[cur] + (di && dj ? 1.414 : 1);
        if (g2 < gS[k]) { gS[k] = g2; from[k] = cur; push(k, g2 + h(k)); }
      }
    }
    if (from[goal] < 0) return null;
    const cells = []; for (let k = goal; k !== start && k >= 0; k = from[k]) cells.push({ x: this.wx(k % n), z: this.wx(Math.floor(k / n)) });
    cells.reverse();
    cells[cells.length - 1] = { x: tx, z: tz };
    const out = []; let ax = sx, az = sz, i = 0;
    while (i < cells.length) {
      let j = cells.length - 1;
      while (j > i && !this.los(ax, az, cells[j].x, cells[j].z)) j--;
      out.push(cells[j]); ax = cells[j].x; az = cells[j].z; i = j + 1;
    }
    return out;
  }
};

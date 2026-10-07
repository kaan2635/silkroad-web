// Hotbar: 4 sayfa x 8 yuva (iSRO gibi). Yuva: { t: 'atk' } | { t: 'zerk' } | { t: 'sk', id } | { t: 'it', base }
// Masaüstü: 1–8 (Shift+1–8 = sonraki sayfa), F1–F4 sayfa. Mobil: ⇅ düğmesi sayfa değiştirir.
// Yerleştirme modu: Yetenek / envanter penceresinde "📌" → bir yuvaya dokun.
const HOTBAR_SLOTS = 8, HOTBAR_PAGES = 4;

class Hotbar {
  constructor(player) {
    this.p = player;
    this.page = 0;
    this.pages = Array.from({ length: HOTBAR_PAGES }, () => new Array(HOTBAR_SLOTS).fill(null));
    this.placing = null;       // yerleştirilecek giriş
    this.onChange = null;
    this.reset();
  }
  reset() {
    this.pages = Array.from({ length: HOTBAR_PAGES }, () => new Array(HOTBAR_SLOTS).fill(null));
    this.pages[0][0] = { t: 'atk' };
    this.pages[0][5] = { t: 'it', base: 'hp1' };
    this.pages[0][6] = { t: 'it', base: 'mp1' };
    this.pages[0][7] = { t: 'it', base: 'ret' };
    this.pages[1][7] = { t: 'it', base: 'pill' };
  }
  get(page, i) { return this.pages[page] ? this.pages[page][i] : null; }
  setPage(p) { this.page = ((p % HOTBAR_PAGES) + HOTBAR_PAGES) % HOTBAR_PAGES; this.changed(); }
  nextPage() { return (this.page + 1) % HOTBAR_PAGES; }
  changed() { if (this.onChange) this.onChange(); }
  same(a, b) { return a && b && a.t === b.t && a.id === b.id && a.base === b.base; }
  has(e) { return this.pages.some(pg => pg.some(x => this.same(x, e))); }
  set(page, i, e) {
    // aynı giriş başka yuvadaysa oradan kaldır
    for (const pg of this.pages) for (let k = 0; k < pg.length; k++) if (e && this.same(pg[k], e)) pg[k] = null;
    this.pages[page][i] = e;
    this.changed();
  }
  // İlk boş yuvaya koy (yeni öğrenilen yetenek için)
  autoPlace(e) {
    if (this.has(e)) return true;
    for (let p = 0; p < HOTBAR_PAGES; p++) for (let i = 0; i < HOTBAR_SLOTS; i++) if (!this.pages[p][i]) { this.pages[p][i] = e; this.changed(); return true; }
    return false;
  }
  // Silinen / değişen iksir derecesi: hp1 → hp2 gibi daha iyi iksire geçir
  upgradePots(level) {
    for (const pg of this.pages) for (const e of pg) {
      if (!e || e.t !== 'it') continue;
      const m = /^(hp|mp)(\d)$/.exec(e.base);
      if (!m) continue;
      const best = potFor(level, m[1]);
      if (best !== e.base && this.p.inv.count(e.base) === 0 && this.p.inv.count(best) > 0) e.base = best;
    }
  }
  serialize() { return { pg: this.page, p: this.pages.map(pg => pg.map(e => (e ? (e.t === 'sk' ? 's:' + e.id : e.t === 'it' ? 'i:' + e.base : e.t) : null))) }; }
  load(d) {
    if (!d || !Array.isArray(d.p)) return;
    const dec = v => {
      if (!v) return null;
      if (v === 'atk' || v === 'zerk') return { t: v };
      if (v.startsWith('s:') && SKILLS_BY_ID[v.slice(2)]) return { t: 'sk', id: v.slice(2) };
      if (v.startsWith('i:') && ITEM_BASES[v.slice(2)]) return { t: 'it', base: v.slice(2) };
      return null;
    };
    this.pages = Array.from({ length: HOTBAR_PAGES }, (_, p) => { const a = new Array(HOTBAR_SLOTS).fill(null); (d.p[p] || []).slice(0, HOTBAR_SLOTS).forEach((v, i) => { a[i] = dec(v); }); return a; });
    this.page = clamp(d.pg | 0, 0, HOTBAR_PAGES - 1);
    this.changed();
  }
  // Giriş görünümü
  view(e) {
    if (!e) return null;
    if (e.t === 'atk') return { icon: icon('atk', 'phys'), name: 'Normal Saldırı', tip: 'Hedefe otomatik saldır (Space)' };
    if (e.t === 'zerk') return { icon: icon('zerk', 'fire'), name: 'Berserk', tip: '5 küre dolunca aç (Z)' };
    if (e.t === 'sk') { const s = SKILLS_BY_ID[e.id]; return { icon: skillIcon(e.id), name: s.name, tip: skillDetail(s, this.p.book.r(e.id)), mp: rankMp(s, Math.max(1, this.p.book.r(e.id))), learned: this.p.book.r(e.id) > 0 }; }
    if (e.t === 'it') { const b = ITEM_BASES[e.base]; return { icon: itemIcon(e.base), name: b.name, tip: b.sub || '', count: this.p.inv.count(e.base) }; }
    return null;
  }
}

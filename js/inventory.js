// Envanter (48 yuva, yığınlanan eşyalar) + 12 ekipman yuvası + depo (48 yuva).
const INV_SIZE = 48;
const STORAGE_SIZE = 48;

class Inventory {
  constructor(player) {
    this.p = player;
    this.invSize = INV_SIZE; this.stSize = STORAGE_SIZE;
    this.slots = new Array(INV_SIZE).fill(null);
    this.storage = new Array(STORAGE_SIZE).fill(null);
    this.equip = {};
    for (const k in EQUIP_SLOTS) this.equip[k] = null;
    this.onChange = null;
  }

  changed() { if (this.onChange) this.onChange(); }
  free(arr = this.slots) { return arr.indexOf(null); }
  freeCount(arr = this.slots) { let n = 0; for (const s of arr) if (!s) n++; return n; }

  // Eşya ekle (yığınlar birleşir). Sığmayan kısım döner (0 = hepsi girdi).
  add(item, arr = this.slots, silent = false) {
    if (isStack(item.base)) {
      const max = ITEM_BASES[item.base].stack;
      for (const s of arr) {
        if (s && s.base === item.base && s.n < max) {
          const k = Math.min(max - s.n, item.n); s.n += k; item.n -= k;
          if (item.n <= 0) break;
        }
      }
      while (item.n > 0) {
        const i = arr.indexOf(null);
        if (i < 0) break;
        const k = Math.min(max, item.n);
        arr[i] = makeStack(item.base, k); item.n -= k;
      }
      if (!silent) this.changed();
      return item.n <= 0;
    }
    const i = arr.indexOf(null);
    if (i < 0) return false;
    arr[i] = item;
    if (!silent) this.changed();
    return true;
  }
  addStack(base, n) { return this.add(makeStack(base, n)); }
  canAdd(base, n = 1) {
    if (!isStack(base)) return this.free() >= 0;
    const max = ITEM_BASES[base].stack;
    let room = 0;
    for (const s of this.slots) room += !s ? max : (s.base === base ? max - s.n : 0);
    return room >= n;
  }

  count(base) { let n = 0; for (const s of this.slots) if (s && s.base === base) n += s.n || 1; return n; }
  // Belirli bir türden n adet harca
  take(base, n = 1) {
    if (this.count(base) < n) return false;
    for (let i = this.slots.length - 1; i >= 0 && n > 0; i--) {
      const s = this.slots[i];
      if (!s || s.base !== base) continue;
      const k = Math.min(s.n, n); s.n -= k; n -= k;
      if (s.n <= 0) this.slots[i] = null;
    }
    this.changed();
    return true;
  }

  remove(i, arr = this.slots) {
    const it = arr[i];
    arr[i] = null;
    this.changed();
    return it;
  }

  weapon() { return this.equip.weapon ? ITEM_BASES[this.equip.weapon.base] : null; }
  weaponType() { const w = this.weapon(); return w ? w.wtype : null; }

  // Kuşanma kuralları: kalkan yalnızca tek elli silahla; yüzük iki yuvaya
  _slotFor(it) {
    const b = ITEM_BASES[it.base];
    if (b.slot !== 'ring') return b.slot;
    return !this.equip.ring1 ? 'ring1' : !this.equip.ring2 ? 'ring2' : 'ring1';
  }

  equipFrom(i) {
    const it = this.slots[i];
    if (!it || !isGear(it.base)) return { ok: false, msg: '' };
    const n = itemInfo(it);
    if (this.p.stats.level < n.req) return { ok: false, msg: 'Bu eşya için ' + n.req + '. seviye gerekli.' };
    const slot = this._slotFor(it);
    if (slot === 'shield') {
      const w = this.weapon();
      if (w && !WEAPON_TYPES[w.wtype].oneHand) return { ok: false, msg: 'Kalkan sadece kılıç veya bıçakla kullanılır.' };
    }
    const old = this.equip[slot];
    this.equip[slot] = it;
    this.slots[i] = old;
    // iki elli silah takılınca kalkanı çıkar
    if (slot === 'weapon' && !WEAPON_TYPES[n.wtype].oneHand && this.equip.shield) {
      const f = this.free();
      if (f < 0) { this.equip.weapon = old; this.slots[i] = it; return { ok: false, msg: 'Kalkanı çıkarmak için envanterde yer yok.' }; }
      this.slots[f] = this.equip.shield; this.equip.shield = null;
    }
    this.recalc();
    this.changed();
    if (this.p.onGearChange) this.p.onGearChange();
    return { ok: true, msg: n.name + ' kuşanıldı.' };
  }

  unequip(slot) {
    const it = this.equip[slot];
    if (!it) return { ok: false, msg: '' };
    const i = this.free();
    if (i < 0) return { ok: false, msg: 'Envanter dolu.' };
    this.slots[i] = it;
    this.equip[slot] = null;
    this.recalc();
    this.changed();
    if (this.p.onGearChange) this.p.onGearChange();
    return { ok: true, msg: itemInfo(it).name + ' çıkarıldı.' };
  }

  // Mall: kalıcı genişletme
  expand(kind) {
    if (kind === 'inv') { if (this.invSize >= 96) return false; this.invSize += 16; while (this.slots.length < this.invSize) this.slots.push(null); }
    else { if (this.stSize >= 120) return false; this.stSize += 24; while (this.storage.length < this.stSize) this.storage.push(null); }
    this.changed(); return true;
  }

  // Depo
  deposit(i) {
    const it = this.slots[i]; if (!it) return false;
    const copy = isStack(it.base) ? makeStack(it.base, it.n) : it;
    const ok = this.add(copy, this.storage, true);
    if (!ok) { if (isStack(it.base)) it.n = copy.n; this.changed(); return false; }
    this.slots[i] = null; this.changed(); return true;
  }
  withdraw(i) {
    const it = this.storage[i]; if (!it) return false;
    const copy = isStack(it.base) ? makeStack(it.base, it.n) : it;
    const ok = this.add(copy, this.slots, true);
    if (!ok) { if (isStack(it.base)) it.n = copy.n; this.changed(); return false; }
    this.storage[i] = null; this.changed(); return true;
  }

  // Envanteri sırala: ekipman önce (derece), sonra sarf
  sort() {
    const items = this.slots.filter(Boolean);
    const merged = [];
    for (const it of items) {
      if (isStack(it.base)) { const m = merged.find(x => x.base === it.base && x.n < ITEM_BASES[it.base].stack); if (m) { const k = Math.min(ITEM_BASES[it.base].stack - m.n, it.n); m.n += k; it.n -= k; if (it.n > 0) merged.push(it); continue; } }
      merged.push(it);
    }
    const order = { weapon: 0, shield: 1, armor: 2, acc: 3, use: 4, ammo: 5, mat: 6, quest: 7 };
    merged.sort((a, b) => {
      const A = ITEM_BASES[a.base], B = ITEM_BASES[b.base];
      return (order[A.cat] - order[B.cat]) || ((B.d || 0) - (A.d || 0)) || (a.base < b.base ? -1 : a.base > b.base ? 1 : 0);
    });
    this.slots = new Array(this.invSize).fill(null);
    merged.forEach((it, i) => { this.slots[i] = it; });
    this.changed();
  }

  recalc() { if (this.p.recalc) this.p.recalc(); }

  // Dayanıklılık kaybı
  wear(slot) {
    const it = this.equip[slot];
    if (!it || it.dur <= 0) return;
    it.dur--;
    if (it.dur === 0) { this.recalc(); if (this.p.onBroken) this.p.onBroken(it); }
  }
  repairCost() {
    let c = 0;
    for (const k in this.equip) { const it = this.equip[k]; if (it) c += (maxDur(it) - it.dur) * ITEM_BASES[it.base].d * 3; }
    for (const it of this.slots) if (it && isGear(it.base)) c += (maxDur(it) - it.dur) * ITEM_BASES[it.base].d * 3;
    return c;
  }
  repairAll() {
    for (const k in this.equip) { const it = this.equip[k]; if (it) it.dur = maxDur(it); }
    for (const it of this.slots) if (it && isGear(it.base)) it.dur = maxDur(it);
    this.recalc(); this.changed();
  }

  // --- Kayıt ---
  static enc(it) {
    if (!it) return null;
    if (isStack(it.base)) return [it.base, it.n];
    return [it.base, it.rarity, it.plus, it.blues, it.dur];
  }
  static dec(a) {
    if (!Array.isArray(a) || !ITEM_BASES[a[0]]) return null;
    if (isStack(a[0])) return makeStack(a[0], clamp(a[1] | 0, 1, ITEM_BASES[a[0]].stack));
    const blues = Array.isArray(a[3]) ? a[3].filter(b => Array.isArray(b) && BLUES[b[0]]).map(b => [b[0], clamp(b[1] | 0, 1, 99)]).slice(0, 6) : [];
    const it = makeItem(a[0], clamp(a[1] | 0, 0, RARITY.length - 1), clamp(a[2] | 0, 0, MAX_PLUS), blues);
    if (isFinite(a[4])) it.dur = clamp(a[4] | 0, 0, maxDur(it));
    return it;
  }
  serialize() {
    const eq = {};
    for (const k in this.equip) eq[k] = Inventory.enc(this.equip[k]);
    return { slots: this.slots.map(Inventory.enc), equip: eq, storage: this.storage.map(Inventory.enc), isz: this.invSize, ssz: this.stSize };
  }
  load(d) {
    this.invSize = clamp(d.isz | 0 || INV_SIZE, INV_SIZE, 96); this.stSize = clamp(d.ssz | 0 || STORAGE_SIZE, STORAGE_SIZE, 120);
    this.slots = new Array(this.invSize).fill(null);
    this.storage = new Array(this.stSize).fill(null);
    (d.slots || []).slice(0, this.invSize).forEach((a, i) => { this.slots[i] = Inventory.dec(a); });
    (d.storage || []).slice(0, this.stSize).forEach((a, i) => { this.storage[i] = Inventory.dec(a); });
    for (const k in this.equip) this.equip[k] = Inventory.dec((d.equip || {})[k]);
    this.recalc();
    this.changed();
  }

  // Yeni karakter başlangıç ekipmanı (silah seçimine göre)
  starter(wtype = 'blade') {
    this.slots.fill(null); this.storage.fill(null);
    for (const k in this.equip) this.equip[k] = null;
    this.equip.weapon = makeItem(wtype + '_1');
    if (WEAPON_TYPES[wtype].oneHand) this.equip.shield = makeItem('shield_1');
    this.equip.chest = makeItem('chest_protector_1');
    this.equip.feet = makeItem('feet_protector_1');
    this.add(makeStack('hp1', 30), this.slots, true);
    this.add(makeStack('mp1', 30), this.slots, true);
    this.add(makeStack('ret', 3), this.slots, true);
    this.add(makeStack('pill', 5), this.slots, true);
    if (wtype === 'bow') this.add(makeStack('arrow', 1000), this.slots, true);
    this.p.stats.gold = 200;
    this.recalc();
    this.changed();
  }
}

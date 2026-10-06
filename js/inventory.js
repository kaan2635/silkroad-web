// Envanter (24 slot) + ekipman (5 slot). İstatistik bonuslarını hesaplar.
const INV_SIZE = 24;

class Inventory {
  constructor(player) {
    this.p = player;
    this.slots = new Array(INV_SIZE).fill(null);
    this.equip = { weapon: null, helmet: null, armor: null, boots: null, ring: null };
    this.bonus = { atk: 0, def: 0, hp: 0, mp: 0 };
    this.onChange = null;
  }

  changed() { if (this.onChange) this.onChange(); }
  free() { return this.slots.indexOf(null); }

  add(item) {
    const i = this.free();
    if (i < 0) return false;
    this.slots[i] = item;
    this.changed();
    return true;
  }

  remove(i) {
    const it = this.slots[i];
    this.slots[i] = null;
    this.changed();
    return it;
  }

  totals() {
    const t = { atk: 0, def: 0, hp: 0, mp: 0 };
    for (const k in this.equip) {
      const it = this.equip[k];
      if (!it) continue;
      const n = itemInfo(it);
      t.atk += n.atk; t.def += n.def; t.hp += n.hp; t.mp += n.mp;
    }
    return t;
  }

  // Seviye + ekipmana göre azami can/mana
  recalc() {
    const s = this.p.stats, t = this.totals();
    s.maxHp = 100 + 20 * (s.level - 1) + t.hp;
    s.maxMp = 50 + 10 * (s.level - 1) + t.mp;
    s.hp = Math.min(s.hp, s.maxHp);
    s.mp = Math.min(s.mp, s.maxMp);
    this.bonus = t;
  }

  equipFrom(i) {
    const it = this.slots[i];
    if (!it) return { ok: false, msg: '' };
    const n = itemInfo(it);
    if (this.p.stats.level < n.req) return { ok: false, msg: 'Bu eşya için ' + n.req + '. seviye gerekli.' };
    const old = this.equip[n.slot];
    this.equip[n.slot] = it;
    this.slots[i] = old;
    this.recalc();
    this.changed();
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
    return { ok: true, msg: itemInfo(it).name + ' çıkarıldı.' };
  }

  serialize() {
    const enc = it => (it ? [it.base, it.rarity, it.plus] : null);
    const eq = {};
    for (const k in this.equip) eq[k] = enc(this.equip[k]);
    return { slots: this.slots.map(enc), equip: eq };
  }

  load(d) {
    const dec = a => (Array.isArray(a) && ITEM_BASES[a[0]] ? makeItem(a[0], clamp(a[1] | 0, 0, 3), clamp(a[2] | 0, 0, MAX_PLUS)) : null);
    this.slots = new Array(INV_SIZE).fill(null);
    (d.slots || []).slice(0, INV_SIZE).forEach((a, i) => { this.slots[i] = dec(a); });
    for (const k in this.equip) this.equip[k] = dec((d.equip || {})[k]);
    this.recalc();
    this.changed();
  }

  // Yeni karakter başlangıç ekipmanı
  starter() {
    this.slots.fill(null);
    for (const k in this.equip) this.equip[k] = null;
    this.equip.weapon = makeItem('w1');
    this.equip.boots = makeItem('b1');
    this.p.stats.gold = 50;
    this.p.stats.stones = 0;
    this.recalc();
    this.changed();
  }
}

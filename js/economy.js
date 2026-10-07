// Ekonomi: şehir pazarları ve fiyatlar.
// - Her şehirde kategori talep endeksi: saatlik dalgalanır (belirlenimci, herkes aynı eğriyi görür), şehre özgü eğilim
// - Şehir vergisi (alımlara eklenir), günün indirimi (bir kategori %20 ucuz)
// - Doygunluk: aynı kategoriden çok satarsan NPC'nin ödediği fiyat düşer, zamanla toparlanır
// - Eşya değerlemesi: derece, kademe, mühür, +seviye, mavi stat ve dayanıklılığa göre
// - Geri alım: son satılan 12 eşya aynı fiyattan geri alınabilir
// - Emanet Pazarı: eşyanı fiyat koyup ilana çıkar; sanal alıcılar fiyata göre satın alır (oyun kapalıyken de);
//   diğer tüccarların ilanlarından NPC'lerde bulunmayan eşyaları al
// - Hesap defteri: gelir/gider kalemleri, saatlik kazanç

const ECO_KEY = 'silkroad-web-economy';
const ECO_CATS = { weapon: 'Silah', shield: 'Kalkan', armor: 'Zırh', acc: 'Takı', pot: 'İksir', mat: 'Simya', scroll: 'Parşömen', pet: 'Evcil · Binek' };
const ECO_CAT_ICON = { weapon: 'sword', shield: 'shield', armor: 'chest', acc: 'necklace', pot: 'hp', mat: 'elx', scroll: 'ret', pet: 'horse' };
const TOWN_TAX = { jangan: 0.05, donwhang: 0.08, hotan: 0.1, samarkand: 0.1, asiaminor: 0.06, constantinople: 0.05, alexandria: 0.12, shambhala: 0.12 };
const ZONE_BIAS = {                      // şehre özgü talep: >1 pahalı (ve NPC daha çok öder)
  jangan:   { pot: 0.92, weapon: 1.0, armor: 1.0, acc: 1.06, mat: 1.05, scroll: 0.95 },
  donwhang: { weapon: 0.95, armor: 1.06, mat: 1.1, pot: 1.0, pet: 0.9 },
  hotan:    { acc: 0.9, mat: 0.96, pot: 1.12, weapon: 1.05, shield: 1.06 },
  samarkand: { pet: 0.88, armor: 1.08, acc: 1.05, pot: 1.06 },
  asiaminor: { mat: 1.08, weapon: 0.94, scroll: 0.95 },
  constantinople: { shield: 0.92, armor: 0.95, acc: 1.08, pot: 0.95 },
  alexandria: { acc: 0.9, mat: 1.12, weapon: 1.06, pot: 1.1 },
  shambhala: { pot: 1.15, scroll: 1.1, mat: 0.95 }
};
const LEDGER_NAMES = {
  inc: { mob: 'Canavar ganimeti', sell: 'NPC satışları', market: 'Emanet Pazarı satışları', quest: 'Görev ödülleri', trade: 'Ticaret ve meslek', other: 'Diğer' },
  exp: { buy: 'NPC alışverişi', tax: '— içindeki vergi', repair: 'Tamir', travel: 'Işınlanma', market: 'Pazardan alım', fee: 'İlan ücreti ve komisyon', trade: 'Ticaret malı alımı', other: 'Diğer' }
};
const SELLER_NAMES = ['KılıçUstası', 'AyKızı', 'Ejderhan', 'YeşimTüccar', 'KumFırtınası', 'GeceKartalı', 'SessizOk', 'AltınKervan', 'BuzKalbi', 'KızılYelpaze', 'DemirYumruk', 'İpekYolcusu', 'HotanBeyi', 'ÇölAslanı', 'MorBulut', 'KaraTilki', 'Bilgeİhtiyar', 'GökMızrak'];

const _eh = s => { const x = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const _zoneSeed = z => ({ jangan: 11, donwhang: 23, hotan: 37, samarkand: 41, asiaminor: 53, constantinople: 61, alexandria: 71, shambhala: 83 })[z] || 5;
const _catSeed = c => Object.keys(ECO_CATS).indexOf(c) + 1;

function ecoCat(base) {
  const b = ITEM_BASES[base]; if (!b) return null;
  if (b.cat === 'weapon' || b.cat === 'shield' || b.cat === 'armor' || b.cat === 'acc') return b.cat;
  if (b.cat === 'mat') return 'mat';
  if (b.cat === 'ammo') return 'pot';
  if (b.cat === 'use') {
    if (['hp', 'mp', 'cure', 'petpot'].includes(b.use)) return 'pot';
    if (['horse', 'camel', 'grabpet', 'atkpet'].includes(b.use)) return 'pet';
    if (b.value > 0) return 'scroll';
  }
  return null;
}

const Eco = {
  s: null,
  // ---------- durum ----------
  load(charName) {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(ECO_KEY)); } catch (e) { d = null; }
    if (!d || d.name !== charName) d = { name: charName, sat: {}, bb: [], list: [], bought: {}, led: { inc: {}, exp: {} }, last: Date.now(), hist: [] };
    d.sat = d.sat || {}; d.bb = d.bb || []; d.list = d.list || []; d.bought = d.bought || {}; d.led = d.led || { inc: {}, exp: {} };
    this.s = d;
    this.session = { t0: Date.now(), inc: 0, exp: 0 };
    this._settle(true);
  },
  save() { if (!this.s) return; try { localStorage.setItem(ECO_KEY, JSON.stringify(this.s)); } catch (e) { /* yoksay */ } },

  // ---------- endeksler ----------
  index(cat, zone = ZONE.id, t = Date.now()) {
    if (!cat) return 1;
    const H = t / 3.6e6, h0 = Math.floor(H), f = H - h0, sd = _zoneSeed(zone) * 31 + _catSeed(cat) * 7;
    const a = _eh(sd + h0), b = _eh(sd + h0 + 1), v = a + (b - a) * f * f * (3 - 2 * f);
    return ((ZONE_BIAS[zone] || {})[cat] || 1) * (0.9 + v * 0.22);
  },
  trend(cat) { const n = this.index(cat), p = this.index(cat, ZONE.id, Date.now() - 3.6e6); return n > p * 1.015 ? 1 : n < p * 0.985 ? -1 : 0; },
  history(cat, hours = 12) { const out = []; for (let i = hours; i >= 0; i--) out.push(this.index(cat, ZONE.id, Date.now() - i * 3.6e6)); return out; },
  tax() { return TOWN_TAX[ZONE.id] || 0.05; },
  dealCat(zone = ZONE.id) {               // günün indirimi (gerçek gün)
    const day = Math.floor(Date.now() / 8.64e7), keys = ['pot', 'weapon', 'armor', 'acc', 'scroll', 'shield'];
    return keys[Math.floor(_eh(day * 3 + _zoneSeed(zone)) * keys.length)];
  },
  satMult(cat) {                          // doygunluk: NPC'nin ödediği fiyat çarpanı
    const v = ((this.s && this.s.sat[ZONE.id]) || {})[cat] || 0;
    return clamp(1 - v, 0.55, 1);
  },

  // ---------- değerleme ----------
  value(it) {
    const b = ITEM_BASES[it.base]; if (!b) return 0;
    if (b.stack) return b.value;
    const r = RARITY[it.rarity] || RARITY[0];
    let v = b.value * r.val * (1 + 0.35 * (it.plus || 0) + 0.04 * (it.plus || 0) * (it.plus || 0));
    for (const [k, x] of it.blues || []) v *= 1 + 0.08 + 0.12 * x / Math.max(1, BLUES[k].max(b.d));
    return v;
  },
  durK(it) { if (ITEM_BASES[it.base].stack || it.dur == null) return 1; return 0.45 + 0.55 * clamp(it.dur / maxDur(it), 0, 1); },
  buyPrice(base) {
    const b = ITEM_BASES[base], cat = ecoCat(base);
    if (base === 'arrow') return 0.5;
    let p = b.value * this.index(cat) * (1 + this.tax());
    if (cat && cat === this.dealCat()) p *= 0.8;
    return Math.max(1, Math.round(p));
  },
  taxPart(price) { return Math.round(price - price / (1 + this.tax())); },
  sellUnit(it) {                          // NPC'nin bir adet için ödediği
    const cat = ecoCat(it.base);
    return this.value(it) * 0.3 * this.index(cat) * this.satMult(cat) * this.durK(it);
  },
  sellPrice(it) {
    const b = ITEM_BASES[it.base]; if (!b || b.cat === 'quest' || b.cat === 'avatar' && false) return 0;
    if (b.stack) return Math.max(0, Math.floor(this.sellUnit(it))) * (it.n || 1);
    return Math.max(1, Math.round(this.sellUnit(it)));
  },
  marketValue(it) {                       // oyuncular arasında adil fiyat (tane başı)
    const cat = ecoCat(it.base);
    return Math.max(1, Math.round(this.value(it) * 0.72 * this.index(cat) * this.durK(it)));
  },

  // ---------- olaylar ----------
  onSell(it, price) {
    const cat = ecoCat(it.base);
    if (cat) {
      const z = this.s.sat[ZONE.id] = this.s.sat[ZONE.id] || {};
      const scale = 400 + 60 * this.p_level();
      z[cat] = Math.min(0.6, (z[cat] || 0) + price / scale * 0.06);
    }
    this.s.bb.unshift({ e: Inventory.enc(it), p: price, z: ZONE.id });
    this.s.bb = this.s.bb.slice(0, 12);
    this.inc('sell', price);
  },
  p_level() { return (window.__game && window.__game.player.stats.level) || 1; },
  inc(k, v) { if (!this.s || !v) return; this.s.led.inc[k] = (this.s.led.inc[k] || 0) + v; this.session.inc += v; this._dirty = true; },
  exp(k, v) { if (!this.s || !v) return; this.s.led.exp[k] = (this.s.led.exp[k] || 0) + v; this.session.exp += v; this._dirty = true; },
  perHour() { const h = Math.max(1 / 60, (Date.now() - this.session.t0) / 3.6e6); return Math.round((this.session.inc - this.session.exp) / h); },

  // ---------- Emanet Pazarı ----------
  LIST_MAX: 8, FEE: 0.02, COMMISSION: 0.05, EXPIRE: 24 * 3.6e6,
  listItem(it, price) {
    if (this.s.list.length >= this.LIST_MAX) return { ok: false, msg: 'En fazla ' + this.LIST_MAX + ' ilan verebilirsin.' };
    const fee = Math.max(10, Math.round(price * this.FEE));
    this.s.list.push({ e: Inventory.enc(it), p: price, v: this.marketValue(it) * (it.n || 1), t: Date.now(), st: 'on', z: ZONE.id });
    this.exp('fee', fee);
    this.save();
    return { ok: true, fee };
  },
  // gerçek zamanlı satış simülasyonu: fiyat / adil değer oranına göre dakikalık olasılık
  _settle(silent) {
    if (!this.s) return [];
    const now = Date.now(), mins = clamp((now - (this.s.last || now)) / 6e4, 0, 24 * 60), sold = [];
    this.s.last = now;
    for (const L of this.s.list) {
      if (L.st !== 'on') continue;
      if (now - L.t > this.EXPIRE) { L.st = 'exp'; continue; }
      const ratio = L.p / Math.max(1, L.v), f = Math.pow(clamp(1.65 - ratio, 0.01, 1), 2);
      const pMin = 0.05 * f;
      if (mins > 0 && Math.random() < 1 - Math.pow(1 - pMin, mins)) { L.st = 'sold'; L.at = now; L.buyer = SELLER_NAMES[Math.floor(Math.random() * SELLER_NAMES.length)]; sold.push(L); }
    }
    if (sold.length) this.save();
    return sold;
  },
  _tick: 0,
  update(dt, hud) {
    if (!this.s) return;
    this._tick += dt;
    if (this._tick < 5) return;
    this._tick = 0;
    const sold = this._settle();
    for (const L of sold) {
      const it = Inventory.dec(L.e), n = it ? itemInfo(it) : null;
      if (hud && n) { hud.log('Pazar: ' + n.name + (it.n > 1 ? ' x' + it.n : '') + ' satıldı (' + L.p.toLocaleString('tr-TR') + ' altın) — Pazar Ağası\'ndan tahsil et.', 'lvl', '#ffd23a'); SFX.play('coin'); }
    }
    // doygunluk zamanla azalır (yarı ömür ~20 dk)
    const k = Math.pow(0.5, 5 / 1200);
    for (const z in this.s.sat) for (const c in this.s.sat[z]) this.s.sat[z][c] *= k;
    if (this._dirty) { this._dirty = false; this.save(); }
  },
  collectAll(inv, stats) {
    let gold = 0, items = 0, full = false;
    this.s.list = this.s.list.filter(L => {
      if (L.st === 'sold') { const net = Math.round(L.p * (1 - this.COMMISSION)); gold += net; this.inc('market', L.p); this.exp('fee', L.p - net); return false; }
      if (L.st === 'exp') { const it = Inventory.dec(L.e); if (it && inv.add(it)) { items++; return false; } full = true; return true; }
      return true;
    });
    stats.gold += gold;
    this.save();
    return { gold, items, full };
  },
  cancel(i, inv) {
    const L = this.s.list[i]; if (!L || L.st !== 'on') return false;
    const it = Inventory.dec(L.e); if (!it || !inv.add(it)) return false;
    this.s.list.splice(i, 1); this.save(); return true;
  },
  // diğer tüccarların ilanları: şehir + saat başına belirlenimci
  offers() {
    const hour = Math.floor(Date.now() / 3.6e6), key = ZONE.id + ':' + hour;
    if (this._offKey === key) return this._off;
    const rng = mulberry32(hour * 97 + _zoneSeed(ZONE.id) * 1013), bought = new Set(this.s.bought[key] || []);
    // eski saatlerin kayıtlarını temizle
    for (const k in this.s.bought) if (!k.endsWith(':' + hour)) delete this.s.bought[k];
    const out = [], degs = ZONE.shop.concat([Math.min(MAX_DEGREE, ZONE.shop[ZONE.shop.length - 1] + 1)]);
    const pick = a => a[Math.floor(rng() * a.length)];
    for (let i = 0; i < 9; i++) {           // ekipman
      const d = pick(degs), sf = pick(['', '', 'b', 'c']), r = rng();
      const kind = r < 0.3 ? pick(Object.keys(WEAPON_TYPES)) + '_' + d : r < 0.38 ? 'shield_' + d : r < 0.8 ? pick(ARMOR_PARTS) + '_' + pick(Object.keys(ARMOR_TYPES)) + '_' + d : pick(['earring', 'necklace', 'ring']) + '_' + d;
      const q = rng(), rar = q < 0.03 ? 3 : q < 0.1 ? 2 : q < 0.3 ? 1 : 0;
      const it = makeSeal(kind + sf, rar, rng); it.uid = 0;
      it.plus = rng() < 0.5 ? 0 : Math.floor(rng() * rng() * 7);
      out.push(it);
    }
    const stacks = [['elx_w', 3, 15], ['elx_a', 4, 20], ['elx_s', 2, 10], ['elx_c', 2, 10], ['luck', 2, 8], ['astral', 1, 2], ['ms_' + pick(Object.keys(BLUES)), 1, 4], ['ms_' + pick(Object.keys(BLUES)), 1, 4],
      [potFor(degreeReq(degs[1] || degs[0]), 'hp'), 50, 200], [potFor(degreeReq(degs[1] || degs[0]), 'mp'), 50, 200], ['zerk', 1, 5], ['rev', 2, 8], ['spd', 2, 6], ['immortal', 1, 1]];
    for (const [b, a, z] of stacks) { if (b === 'immortal' && rng() > 0.25) continue; if (ITEM_BASES[b]) out.push(makeStack(b, a + Math.floor(rng() * (z - a + 1)))); }
    this._off = out.map((it, i) => {
      const v = this.marketValue(it) * (it.n || 1), m = rng() < 0.12 ? 0.55 + rng() * 0.15 : 0.78 + rng() * 0.62;
      return { id: i, it, p: Math.max(1, Math.round(v * m)), v, seller: pick(SELLER_NAMES), cat: ecoCat(it.base), sold: bought.has(i) };
    });
    this._offKey = key;
    return this._off;
  },
  buyOffer(id, inv, stats) {
    const o = (this._off || []).find(x => x.id === id);
    if (!o || o.sold) return { ok: false, msg: 'Bu ilan artık yok.' };
    if (stats.gold < o.p) return { ok: false, msg: 'Yeterli altının yok.' };
    const it = JSON.parse(JSON.stringify(o.it)); it.uid = _itemUid++;
    if (!inv.add(it)) return { ok: false, msg: 'Envanterde yer yok.' };
    stats.gold -= o.p; o.sold = true;
    const key = this._offKey; (this.s.bought[key] = this.s.bought[key] || []).push(id);
    this.exp('market', o.p); this.save();
    return { ok: true, msg: itemInfo(it).name + (it.n > 1 ? ' x' + it.n : '') + ' satın alındı (' + o.seller + '). -' + o.p.toLocaleString('tr-TR') + ' altın' };
  }
};

// eşya satış fiyatı artık pazara bağlı
sellPrice = it => (Eco.s ? Eco.sellPrice(it) : Math.max(1, Math.round(itemInfo(it).value * 0.3)) * (it.n || 1));

// küçük fiyat eğrisi (SVG)
function ecoSpark(vals, w = 90, h = 24) {
  const mn = Math.min(...vals), mx = Math.max(...vals), r = Math.max(0.0001, mx - mn);
  const pts = vals.map((v, i) => (i / (vals.length - 1) * w).toFixed(1) + ',' + (h - 2 - (v - mn) / r * (h - 4)).toFixed(1)).join(' ');
  const up = vals[vals.length - 1] >= vals[0];
  return '<svg class="spark" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '"><polyline points="' + pts + '" fill="none" stroke="' + (up ? '#8fe07a' : '#ff8a7a') + '" stroke-width="1.6"/></svg>';
}

// Eşya verileri: nadirlik, slotlar, temel eşyalar, yükseltme, düşme tablosu.

const RARITY = [
  { name: 'Sıradan',  color: '#e8e8e8', hex: 0xe8e8e8, mult: 1.0,  val: 1.0 },
  { name: 'Güzel',    color: '#6aff8a', hex: 0x6aff8a, mult: 1.25, val: 1.5 },
  { name: 'Nadir',    color: '#5ab4ff', hex: 0x5ab4ff, mult: 1.55, val: 2.5 },
  { name: 'Destansı', color: '#c77aff', hex: 0xc77aff, mult: 2.0,  val: 5.0 }
];

const SLOTS = {
  weapon: { name: 'Silah',   icon: '⚔️' },
  helmet: { name: 'Miğfer',  icon: '🪖' },
  armor:  { name: 'Zırh',    icon: '🥋' },
  boots:  { name: 'Çizme',   icon: '👢' },
  ring:   { name: 'Yüzük',   icon: '💍' }
};

const ITEM_BASES = {
  w1: { name: 'Demir Kılıç',     slot: 'weapon', req: 1, atk: 6,  value: 120 },
  w2: { name: 'Çelik Kılıç',     slot: 'weapon', req: 3, atk: 12, value: 450 },
  w3: { name: 'Yeşim Kılıç',     slot: 'weapon', req: 5, atk: 20, value: 1200 },
  w4: { name: 'Ejderha Kılıcı',  slot: 'weapon', req: 7, atk: 30, value: 3200 },
  h1: { name: 'Hasır Şapka',     slot: 'helmet', req: 1, def: 2,  value: 50 },
  h2: { name: 'Demir Miğfer',    slot: 'helmet', req: 3, def: 5,  value: 280 },
  h3: { name: 'Çelik Miğfer',    slot: 'helmet', req: 5, def: 9,  value: 800 },
  h4: { name: 'Ejderha Miğferi', slot: 'helmet', req: 7, def: 14, value: 2200 },
  a1: { name: 'Kumaş Cüppe',     slot: 'armor',  req: 1, def: 4,  value: 100 },
  a2: { name: 'Deri Zırh',       slot: 'armor',  req: 3, def: 9,  value: 400 },
  a3: { name: 'Zincir Zırh',     slot: 'armor',  req: 5, def: 16, value: 1100 },
  a4: { name: 'Pullu Zırh',      slot: 'armor',  req: 7, def: 24, value: 3000 },
  b1: { name: 'Bez Çizme',       slot: 'boots',  req: 1, def: 1,  value: 40 },
  b2: { name: 'Deri Çizme',      slot: 'boots',  req: 3, def: 3,  value: 220 },
  b3: { name: 'Demir Çizme',     slot: 'boots',  req: 5, def: 6,  value: 700 },
  b4: { name: 'İpek Çizme',      slot: 'boots',  req: 7, def: 9,  value: 1800 },
  r1: { name: 'Bakır Yüzük',     slot: 'ring',   req: 1, hp: 20,  value: 150 },
  r2: { name: 'Gümüş Yüzük',     slot: 'ring',   req: 3, hp: 40,  mp: 10, value: 600 },
  r3: { name: 'Yeşim Yüzük',     slot: 'ring',   req: 5, hp: 70,  mp: 25, value: 1500 },
  r4: { name: 'Altın Yüzük',     slot: 'ring',   req: 7, hp: 110, mp: 40, value: 3800 }
};

// Demirci: hedef artı seviyesine göre başarı şansı (indeks = hedef +)
const MAX_PLUS = 7;
const PLUS_CHANCE = [1, 1, 1, 0.9, 0.75, 0.55, 0.4, 0.25];

let _itemUid = 1;
function makeItem(base, rarity = 0, plus = 0) { return { uid: _itemUid++, base, rarity, plus }; }

function itemInfo(it) {
  const b = ITEM_BASES[it.base], r = RARITY[it.rarity], pm = 1 + 0.18 * it.plus;
  const st = k => (b[k] ? Math.max(1, Math.round(b[k] * r.mult * pm)) : 0);
  return {
    name: b.name + (it.plus ? ' +' + it.plus : ''), baseName: b.name,
    slot: b.slot, req: b.req,
    atk: st('atk'), def: st('def'), hp: st('hp'), mp: st('mp'),
    value: Math.round(b.value * r.val * (1 + 0.5 * it.plus)),
    color: r.color, hex: r.hex, rarityName: r.name, icon: SLOTS[b.slot].icon
  };
}
function sellPrice(it) { return Math.max(1, Math.round(itemInfo(it).value * 0.4)); }
function upgradeCost(it) {
  const t = it.plus + 1, req = ITEM_BASES[it.base].req;
  return { target: t, stones: Math.ceil(t / 2), gold: t * (30 + 12 * req), chance: PLUS_CHANCE[t] };
}
function itemStatText(n) {
  const p = [];
  if (n.atk) p.push('Saldırı +' + n.atk);
  if (n.def) p.push('Savunma +' + n.def);
  if (n.hp) p.push('Can +' + n.hp);
  if (n.mp) p.push('Mana +' + n.mp);
  return p.join(' · ');
}

// Canavar seviyesine uygun rastgele eşya
function randomDrop(level, rng = Math.random) {
  const slots = Object.keys(SLOTS);
  const slot = slots[Math.floor(rng() * slots.length)];
  let cands = Object.keys(ITEM_BASES).filter(id => ITEM_BASES[id].slot === slot && ITEM_BASES[id].req <= level + 1);
  if (!cands.length) cands = Object.keys(ITEM_BASES).filter(id => ITEM_BASES[id].slot === slot).slice(0, 1);
  cands.sort((a, b) => ITEM_BASES[b].req - ITEM_BASES[a].req);
  const id = cands[rng() < 0.6 ? 0 : Math.min(1, cands.length - 1)];
  const r = rng(), bonus = 0.004 * level;
  const rarity = r < 0.01 + bonus ? 3 : r < 0.08 + bonus * 3 ? 2 : r < 0.30 + bonus * 5 ? 1 : 0;
  return makeItem(id, rarity);
}

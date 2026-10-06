// Pencereler: envanter + ekipman, Tüccar (al/sat), Demirci (yükselt).
const SHOP_STOCK = [
  { k: 'pot', stat: 'hpPots', name: 'Can İksiri', icon: '🧪', price: 20, sub: 'Canı yeniler' },
  { k: 'pot', stat: 'mpPots', name: 'Mana İksiri', icon: '💧', price: 25, sub: 'Manayı yeniler' },
  { k: 'stone', name: 'Yükseltme Taşı', icon: '💎', price: 80, sub: 'Demircide eşya yükseltir' },
  ...['w1', 'w2', 'h1', 'h2', 'a1', 'a2', 'b1', 'b2', 'r1'].map(id => ({ k: 'gear', base: id, price: ITEM_BASES[id].value }))
];

class UI {
  constructor(player, hud) {
    this.p = player; this.inv = player.inv; this.hud = hud;
    const $ = id => document.getElementById(id);
    this.invWin = $('inv'); this.equipEl = $('equip'); this.gridEl = $('inv-grid');
    this.infoEl = $('inv-info'); this.footEl = $('inv-foot');
    this.npcWin = $('npc-win'); this.npcTitle = $('npc-title'); this.npcTabs = $('npc-tabs');
    this.npcBody = $('npc-body'); this.npcFoot = $('npc-foot'); this.npcMsgEl = $('npc-msg');
    this.sel = null; this.confirmDrop = false; this.sellConfirm = null;
    this.npc = null; this.tab = null; this.msg = null;

    this.inv.onChange = () => this.refresh();

    $('btn-inv').addEventListener('click', () => this.toggleInv());
    for (const w of [this.invWin, this.npcWin]) {
      w.addEventListener('click', e => {
        if (e.target.closest('.x')) { if (w === this.invWin) this.toggleInv(false); else this.closeNpc(); }
      });
    }

    // envanter etkileşimi
    this.invWin.addEventListener('click', e => {
      const sl = e.target.closest('[data-i]'), eq = e.target.closest('[data-eq]'), btn = e.target.closest('[data-act]');
      if (sl) {
        const i = +sl.dataset.i;
        if (!this.inv.slots[i]) { this.sel = null; }
        else if (this.sel && this.sel.type === 'slot' && this.sel.i === i) { this._act('equip'); return; }   // ikinci dokunuş = kuşan
        else this.sel = { type: 'slot', i };
        this.confirmDrop = false; this.refresh();
      } else if (eq) {
        const k = eq.dataset.eq;
        this.sel = this.inv.equip[k] ? { type: 'equip', key: k } : null;
        this.confirmDrop = false; this.refresh();
      } else if (btn) this._act(btn.dataset.act);
    });

    // NPC pencere etkileşimi
    this.npcWin.addEventListener('click', e => {
      const tab = e.target.closest('[data-tab]'), btn = e.target.closest('[data-act]');
      if (tab) { this.tab = tab.dataset.tab; this.msg = null; this.refreshNpc(); }
      else if (btn) this._npcAct(btn);
    });

    window.addEventListener('keydown', e => {
      const a = document.activeElement;
      if (a && a.tagName === 'INPUT') return;
      if (e.code === 'KeyI') this.toggleInv();
      else if (e.code === 'Escape') { this.toggleInv(false); this.closeNpc(); }
    });
  }

  // ---------- Envanter ----------
  toggleInv(force) {
    const open = force === undefined ? this.invWin.classList.contains('hidden') : force;
    this.invWin.classList.toggle('hidden', !open);
    if (open) { this.sel = null; this.confirmDrop = false; this.refreshInv(); }
  }

  refresh() {
    if (!this.invWin.classList.contains('hidden')) this.refreshInv();
    if (this.npc) this.refreshNpc();
  }

  _slot(item, attrs, sel, emptyIcon) {
    if (!item) return '<div class="islot empty' + (sel ? ' sel' : '') + '" ' + attrs + '>' + (emptyIcon || '') + '</div>';
    const n = itemInfo(item);
    return '<div class="islot' + (sel ? ' sel' : '') + '" ' + attrs + ' style="border-color:' + n.color + '" title="' + n.name + '">' +
      n.icon + (item.plus ? '<i class="plus">+' + item.plus + '</i>' : '') + '</div>';
  }

  _selItem() {
    const s = this.sel;
    if (!s) return null;
    return s.type === 'slot' ? this.inv.slots[s.i] : this.inv.equip[s.key];
  }

  refreshInv() {
    const sel = this.sel, inv = this.inv, s = this.p.stats;
    this.equipEl.innerHTML = Object.keys(SLOTS).map(k =>
      this._slot(inv.equip[k], 'data-eq="' + k + '"', sel && sel.type === 'equip' && sel.key === k, SLOTS[k].icon)).join('');
    this.gridEl.innerHTML = inv.slots.map((it, i) =>
      this._slot(it, 'data-i="' + i + '"', sel && sel.type === 'slot' && sel.i === i, '')).join('');

    const it = this._selItem();
    if (!it) this.infoEl.innerHTML = '<div class="hint">Bir eşyaya dokun.<br>Tekrar dokunmak kuşanır.</div>';
    else {
      const n = itemInfo(it), bad = s.level < n.req;
      let h = '<div class="in-name" style="color:' + n.color + '">' + n.name + '</div>' +
        '<div class="in-sub">' + n.rarityName + ' · ' + SLOTS[n.slot].name + '</div>' +
        '<div class="in-st">' + itemStatText(n) + '</div>' +
        '<div class="in-req' + (bad ? ' bad' : '') + '">Gerekli seviye: ' + n.req + '</div>';
      if (sel.type === 'slot') {
        const cur = inv.equip[n.slot];
        if (cur) h += '<div class="in-cmp">Şu an: ' + itemInfo(cur).name + '</div>';
        h += '<button data-act="equip">Kuşan</button><button data-act="drop" class="warn">' + (this.confirmDrop ? 'Emin misin?' : 'At') + '</button>';
      } else h += '<button data-act="unequip">Çıkar</button>';
      this.infoEl.innerHTML = h;
    }

    const b = inv.bonus;
    this.footEl.innerHTML = '💰 <b>' + s.gold + '</b> &nbsp; 💎 <b>' + s.stones + '</b> &nbsp; 🧪 <b>' + s.hpPots + '</b> &nbsp; 💧 <b>' + s.mpPots + '</b>' +
      '<span class="stt">⚔ Saldırı <b>' + (10 + 4 * s.level + b.atk) + '</b> &nbsp; 🛡 Savunma <b>' + (2 * s.level + b.def) + '</b></span>';
  }

  _act(act) {
    const inv = this.inv, sel = this.sel;
    if (!sel) return;
    let res = null;
    if (act === 'equip' && sel.type === 'slot') {
      const n = inv.slots[sel.i] && itemInfo(inv.slots[sel.i]);
      res = inv.equipFrom(sel.i);
      if (res.ok) this.sel = { type: 'equip', key: n.slot };
    } else if (act === 'unequip' && sel.type === 'equip') {
      res = inv.unequip(sel.key);
      if (res.ok) this.sel = null;
    } else if (act === 'drop' && sel.type === 'slot') {
      if (!this.confirmDrop) { this.confirmDrop = true; this.refreshInv(); return; }
      const it = inv.remove(sel.i);
      this.hud.log(itemInfo(it).name + ' atıldı.');
      this.sel = null; this.confirmDrop = false;
      return;
    }
    this.confirmDrop = false;
    if (res && res.msg) this.hud.log(res.msg, res.ok ? 'sys' : 'dmg');
    this.refreshInv();
  }

  // ---------- NPC ----------
  openNpc(npc) {
    this.npc = npc;
    this.tab = npc.id === 'merchant' ? 'buy' : 'upgrade';
    this.msg = null; this.sellConfirm = null;
    this.npcWin.classList.remove('hidden');
    this.refreshNpc();
  }

  closeNpc() {
    this.npc = null;
    this.npcWin.classList.add('hidden');
  }

  refreshNpc() {
    const npc = this.npc, s = this.p.stats;
    if (!npc) return;
    this.npcTitle.textContent = npc.name + ' — ' + npc.title;
    const tabs = npc.id === 'merchant' ? [['buy', 'Satın Al'], ['sell', 'Sat']] : [['upgrade', 'Yükselt']];
    this.npcTabs.innerHTML = tabs.map(t => '<button data-tab="' + t[0] + '" class="' + (t[0] === this.tab ? 'on' : '') + '">' + t[1] + '</button>').join('');
    this.npcBody.innerHTML = this.tab === 'buy' ? this._buyHTML() : this.tab === 'sell' ? this._sellHTML() : this._upgradeHTML();
    this.npcFoot.innerHTML = '💰 <b>' + s.gold + '</b> &nbsp; 💎 <b>' + s.stones + '</b>' + (this.tab === 'upgrade' ? ' &nbsp; <small>Taşları Tüccar\'dan al veya canavarlardan topla.</small>' : '');
    this.npcMsgEl.innerHTML = this.msg ? '<span style="color:' + this.msg.color + '">' + this.msg.text + '</span>' : '';
  }

  _say(text, color = '#ffe9a8') { this.msg = { text, color }; this.refresh(); }

  _row(icon, name, sub, right, color) {
    return '<div class="srow"><span class="ic">' + icon + '</span><div class="nm"' + (color ? ' style="color:' + color + '"' : '') + '>' + name + '<small>' + sub + '</small></div>' + right + '</div>';
  }

  _buyHTML() {
    return SHOP_STOCK.map((s, idx) => {
      let icon = s.icon, name = s.name, sub = s.sub, color = null;
      if (s.k === 'gear') { const n = itemInfo({ base: s.base, rarity: 0, plus: 0 }); icon = n.icon; name = n.name; sub = itemStatText(n) + ' · Sv. ' + n.req; }
      const btns = '<b class="pr">' + s.price + ' 💰</b><button data-act="buy" data-idx="' + idx + '" data-n="1">Al</button>' +
        (s.k !== 'gear' ? '<button data-act="buy" data-idx="' + idx + '" data-n="5">x5</button>' : '');
      return this._row(icon, name, sub, btns, color);
    }).join('');
  }

  _sellHTML() {
    const rows = this.inv.slots.map((it, i) => {
      if (!it) return '';
      const n = itemInfo(it), conf = this.sellConfirm === it.uid;
      return this._row(n.icon, n.name, n.rarityName + ' · ' + itemStatText(n),
        '<b class="pr">' + sellPrice(it) + ' 💰</b><button data-act="sell" data-i="' + i + '" class="' + (conf ? 'warn' : '') + '">' + (conf ? 'Emin misin?' : 'Sat') + '</button>', n.color);
    }).join('');
    return rows || '<div class="hint">Satacak eşyan yok. (Kuşanılı eşyalar satılmaz.)</div>';
  }

  _upgradeList() {
    const list = [];
    for (const k in this.inv.equip) if (this.inv.equip[k]) list.push({ it: this.inv.equip[k], src: 'eq:' + k, worn: true });
    this.inv.slots.forEach((it, i) => { if (it) list.push({ it, src: 'sl:' + i, worn: false }); });
    return list;
  }

  _upgradeHTML() {
    const list = this._upgradeList();
    if (!list.length) return '<div class="hint">Yükseltilecek eşyan yok.</div>';
    return list.map(({ it, src, worn }) => {
      const n = itemInfo(it);
      if (it.plus >= MAX_PLUS) return this._row(n.icon, n.name + (worn ? ' ✔' : ''), 'En üst seviye', '<b class="pr">MAKS</b>', n.color);
      const c = upgradeCost(it);
      return this._row(n.icon, n.name + (worn ? ' ✔' : ''), '+' + it.plus + ' → +' + c.target + ' · Şans %' + Math.round(c.chance * 100) + ' · 💎' + c.stones + ' 💰' + c.gold,
        '<button data-act="upg" data-src="' + src + '">Yükselt</button>', n.color);
    }).join('');
  }

  _npcAct(btn) {
    const act = btn.dataset.act, s = this.p.stats, inv = this.inv;
    if (act === 'buy') {
      const st = SHOP_STOCK[+btn.dataset.idx], n = +btn.dataset.n, cost = st.price * n;
      if (s.gold < cost) return this._say('Yeterli altının yok.', '#ff8a7a');
      if (st.k === 'gear') {
        if (inv.free() < 0) return this._say('Envanter dolu.', '#ff8a7a');
        s.gold -= cost; inv.add(makeItem(st.base));
        return this._say(ITEM_BASES[st.base].name + ' satın alındı.', '#a8f0a0');
      }
      s.gold -= cost;
      if (st.k === 'pot') s[st.stat] += n; else s.stones += n;
      this._say(st.name + ' x' + n + ' satın alındı.', '#a8f0a0');
    } else if (act === 'sell') {
      const i = +btn.dataset.i, it = inv.slots[i];
      if (!it) return;
      if (it.rarity >= 2 && this.sellConfirm !== it.uid) { this.sellConfirm = it.uid; return this.refreshNpc(); }
      const price = sellPrice(it), name = itemInfo(it).name;
      s.gold += price; this.sellConfirm = null; inv.remove(i);
      this._say(name + ' satıldı. +' + price + ' 💰', '#a8f0a0');
    } else if (act === 'upg') {
      const [kind, ref] = btn.dataset.src.split(':');
      const it = kind === 'eq' ? inv.equip[ref] : inv.slots[+ref];
      if (!it || it.plus >= MAX_PLUS) return;
      const c = upgradeCost(it);
      if (s.stones < c.stones) return this._say('Yeterli Yükseltme Taşın yok.', '#ff8a7a');
      if (s.gold < c.gold) return this._say('Yeterli altının yok.', '#ff8a7a');
      s.stones -= c.stones; s.gold -= c.gold;
      if (Math.random() < c.chance) {
        it.plus++;
        inv.recalc(); inv.changed();
        this.hud.log(itemInfo(it).name + ' yükseltildi!', 'lvl');
        this._say('✅ ' + itemInfo(it).name + ' yükseltildi!', '#ffd23a');
      } else {
        inv.changed();
        this._say('❌ Yükseltme başarısız. Eşya zarar görmedi.', '#ff8a7a');
      }
    }
  }

  update() {
    if (!this.npc) return;
    const d = Math.hypot(this.p.pos.x - this.npc.x, this.p.pos.z - this.npc.z);
    if (d > NPC_RANGE + 6 || this.p.dead) this.closeNpc();
  }
}

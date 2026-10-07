// Pencereler: Envanter (I), Karakter (C), Yetenekler (K), Simya, NPC (dükkân / sat / tamir / depo / görev),
// Görev günlüğü (L), Dünya haritası (M). Hepsi dokunmatik için büyük hedeflerle tasarlandı.

// Piyasa tablosunda gösterilen diğer şehirler: yol zincirinde en yakın 3 şehir
const ecoTowns = () => { const i = ZONE_ORDER.indexOf(ZONE.id) < 0 ? 0 : ZONE_ORDER.indexOf(ZONE.id); return ZONE_ORDER.filter(z => z !== ZONE.id).sort((a, b) => Math.abs(ZONE_ORDER.indexOf(a) - i) - Math.abs(ZONE_ORDER.indexOf(b) - i)).slice(0, 3); };
// Şehir dükkânlarının satış listesi (derece aralığı bölgeye göre)
const SHOP_DEGREES = ZONE.shop;
function shopStock(kind) {
  const out = [];
  if (kind === 'herb') {
    POT_GRADES.forEach((g, i) => { out.push('hp' + (i + 1)); out.push('mp' + (i + 1)); });
    out.push('pill', 'ret', 'rev', 'spd');
  } else if (kind === 'weapon') {
    for (const d of SHOP_DEGREES) for (const T of TIERS) { for (const t of raceWeapons()) out.push(t + '_' + d + T.suf); out.push('shield_' + d + T.suf); }
    out.push('arrow');
  } else if (kind === 'armor') {
    for (const d of SHOP_DEGREES) for (const T of TIERS) for (const at of raceArmors()) for (const p of ARMOR_PARTS) out.push(p + '_' + at + '_' + d + T.suf);
  } else if (kind === 'stable') {
    out.push('horse', 'camel', 'pet_grab', 'pet_atk', 'pet_pot');
  } else if (kind === 'acc') {
    for (const d of SHOP_DEGREES) for (const T of TIERS) for (const a of ['earring', 'necklace', 'ring']) out.push(a + '_' + d + T.suf);
    out.push('luck');
  }
  return out;
}
const buyPrice = base => Eco.buyPrice(base);

const NPC_TABS = {
  merchant: [['buy:herb', 'Satın Al'], ['sell', 'Sat'], ['quests', 'Görevler']],
  smith: [['buy:weapon', 'Silahlar'], ['sell', 'Sat'], ['repair', 'Tamir'], ['alchemy', 'Simya'], ['quests', 'Görevler']],
  armor: [['buy:armor', 'Zırhlar'], ['sell', 'Sat'], ['repair', 'Tamir'], ['quests', 'Görevler']],
  acc: [['buy:acc', 'Takılar'], ['sell', 'Sat'], ['quests', 'Görevler']],
  storage: [['storage', 'Depo'], ['quests', 'Görevler']],
  captain: [['quests', 'Görevler'], ['unique', 'Unique']],
  tele: [['tele', 'Işınlan'], ['quests', 'Görevler']],
  job: [['job', 'Meslek'], ['quests', 'Görevler']],
  stable: [['buy:stable', 'Ahır'], ['sell', 'Sat']],
  special: [['trade', 'Ticaret']],
  den: [['den', 'Simsar']],
  market: [['mk:browse', 'Pazar'], ['mk:mine', 'İlanlarım'], ['mk:prices', 'Piyasa'], ['mk:ledger', 'Hesap Defteri'], ['sell', 'Sat']]
};

class UI {
  constructor(player, hud, quests, wmap, combat, hotbar) {
    this.p = player; this.inv = player.inv; this.hud = hud; this.quests = quests; this.wmap = wmap; this.combat = combat; this.hb = hotbar;
    const $ = id => document.getElementById(id);
    this.$ = $;
    this.w = { inv: $('inv'), npc: $('npc-win'), q: $('qlog'), map: $('wmap'), char: $('charw'), sk: $('skillw'), alc: $('alchw'), mall: $('mallw'), pet: $('petw') };
    this.mallTab = 'prem';
    this.equipEl = $('equip'); this.gridEl = $('inv-grid'); this.infoEl = $('inv-info'); this.footEl = $('inv-foot');
    this.npcTitle = $('npc-title'); this.npcTabs = $('npc-tabs'); this.npcBody = $('npc-body'); this.npcFoot = $('npc-foot'); this.npcMsgEl = $('npc-msg');
    this.qBody = $('qlog-body');
    this.sel = null; this.confirmDrop = false; this.sellConfirm = null;
    this.npc = null; this.tab = null; this.msg = null;
    this.skTab = 'bicheon';
    this.filter = { at: 'protector', d: SHOP_DEGREES[0] };
    this.onTravel = null; this.mm = null; this.jobs = null;
    this.alc = { sel: null, lucky: false, astral: false, msg: null, stone: null };

    this.inv.onChange = () => this.refresh();
    player.book.onChange = () => this.refresh();

    $('btn-inv').addEventListener('click', () => this.toggle('inv'));
    $('btn-char').addEventListener('click', () => this.toggle('char'));
    $('btn-skill').addEventListener('click', () => this.toggle('sk'));
    $('btn-quest').addEventListener('click', () => this.toggle('q'));
    $('btn-map').addEventListener('click', () => this.toggle('map'));
    $('btn-mall').addEventListener('click', () => this.toggle('mall'));
    $('btn-pet').addEventListener('click', () => this.toggle('pet'));
    $('petbar').addEventListener('click', () => this.toggle('pet', true));
    this.w.mall.addEventListener('click', e => {
      const t = e.target.closest('[data-mt]'), b = e.target.closest('[data-buy]');
      if (t) { this.mallTab = t.dataset.mt; SFX.play('tab'); this.refreshMall(); }
      else if (b) this._mallBuy(b.dataset.buy, +b.dataset.n, +b.dataset.c);
    });
    this.w.pet.addEventListener('click', e => {
      const f = e.target.closest('[data-pf]'), b = e.target.closest('[data-pb]'), a = e.target.closest('[data-pa]');
      const P = this.pets;
      if (f) { P.filter = f.dataset.pf; SFX.play('tab'); }
      else if (b) { if (!P.takeFromBag(+b.dataset.pb)) { SFX.play('error'); this.hud.log('Envanter dolu.'); } else SFX.play('tab'); }
      else if (a) {
        const k = a.dataset.pa;
        if (k === 'all') { const n = P.takeAll(); this.hud.log(n ? n + ' eşya envantere alındı.' : 'Alınacak eşya yok / envanter dolu.'); }
        else { const base = k; if (this.inv.count(base)) this.combat.useItem(base); else { this.hud.log(ITEM_BASES[base].name + ' sende yok. Ahır veya Item Mall\'dan al.'); SFX.play('error'); } }
      }
      this.refreshPet();
    });
    $('btn-menu').addEventListener('click', () => { $('menu-btns').classList.toggle('open'); SFX.play('tab'); });
    $('menu-btns').addEventListener('click', e => { if (e.target.closest('button') && e.target.id !== 'btn-menu') $('menu-btns').classList.remove('open'); });
    $('place-cancel').addEventListener('click', () => { this.hb.placing = null; });

    for (const k in this.w) {
      this.w[k].addEventListener('click', e => { if (e.target.closest('.x')) { if (k === 'npc') this.closeNpc(); else this.toggle(k, false); } });
    }

    // envanter etkileşimi
    this.w.inv.addEventListener('click', e => {
      if (this._dragged && Date.now() - this._dragged < 350) return;
      const sl = e.target.closest('[data-i]'), eq = e.target.closest('[data-eq]'), btn = e.target.closest('[data-act]');
      if (sl) {
        const i = +sl.dataset.i;
        if (!this.inv.slots[i]) this.sel = null;
        else if (this.sel && this.sel.w === 'inv' && this.sel.i === i) { this._invAct(isGear(this.inv.slots[i].base) ? 'equip' : 'use'); return; }   // ikinci dokunuş
        else this.sel = { w: 'inv', i };
        this.confirmDrop = false; this.refreshInv();
      } else if (eq) {
        const k = eq.dataset.eq;
        if (this.sel && this.sel.w === 'eq' && this.sel.key === k && this.inv.equip[k]) { this._invAct('unequip'); return; }
        this.sel = this.inv.equip[k] ? { w: 'eq', key: k } : null;
        this.confirmDrop = false; this.refreshInv();
      } else if (btn) this._invAct(btn.dataset.act);
    });
    // karakter
    this.w.char.addEventListener('click', e => {
      const b = e.target.closest('[data-stat]');
      if (b && this.combat.allocate(b.dataset.stat, +b.dataset.n)) { SFX.play('tab'); this.refreshChar(); }
    });
    // yetenekler
    this.w.sk.addEventListener('click', e => {
      const t = e.target.closest('[data-mtab]'), b = e.target.closest('[data-act]'), nd = e.target.closest('[data-sk]');
      if (t) { this.skTab = t.dataset.mtab; this.skSel = null; SFX.play('tab'); this.refreshSk(); return; }
      if (nd && this._dragged && Date.now() - this._dragged < 350) return;
      if (nd) { this.skSel = nd.dataset.sk; SFX.play('tab'); this.refreshSk(); return; }
      if (!b) return;
      const book = this.p.book, a = b.dataset.act;
      if (a === 'raise') { const r = book.raise(this.skTab); this._skSay(r); if (r.ok) SFX.play('upgrade'); else SFX.play('error'); this.p.recalc(); }
      else if (a === 'learn') {
        const r = book.learn(b.dataset.id); this._skSay(r);
        if (r.ok) { SFX.play('upgrade'); const s = SKILLS_BY_ID[b.dataset.id]; if (r.first && s.type !== 'passive') this.hb.autoPlace({ t: 'sk', id: s.id }); this.p.recalc(); } else SFX.play('error');
      } else if (a === 'pin') this._place({ t: 'sk', id: b.dataset.id });
      else if (a === 'pinatk') this._place({ t: 'atk' });
      else if (a === 'pinzerk') this._place({ t: 'zerk' });
      else if (a === 'clear') this._place('clear');
    });
    // simya
    this.w.alc.addEventListener('click', e => {
      const it = e.target.closest('[data-src]'), b = e.target.closest('[data-act]'), st = e.target.closest('[data-stone]');
      if (it) { this.alc.sel = it.dataset.src; this.alc.msg = null; SFX.play('tab'); this.refreshAlc(); }
      else if (st) { this.alc.stone = st.dataset.stone; SFX.play('tab'); this.refreshAlc(); }
      else if (b) this._alcAct(b.dataset.act);
    });
    // NPC
    this.w.npc.addEventListener('click', e => {
      const tab = e.target.closest('[data-tab]'), btn = e.target.closest('[data-act]'), f = e.target.closest('[data-f]');
      if (tab) {
        if (tab.dataset.tab === 'alchemy') { this.toggle('alc', true); return; }
        this.tab = tab.dataset.tab; this.msg = null; SFX.play('tab'); this.refreshNpc();
      } else if (f) { const [k, v] = f.dataset.f.split(':'); this.filter[k] = k === 'd' ? +v : v; SFX.play('tab'); this.refreshNpc(); }
      else if (btn) this._npcAct(btn);
    });

    this._initWindows(); this._initTips(); this._initDrag();

    window.addEventListener('keydown', e => {
      const a = document.activeElement;
      if (a && a.tagName === 'INPUT') return;
      if (e.code === 'KeyI') this.toggle('inv');
      else if (e.code === 'KeyC') this.toggle('char');
      else if (e.code === 'KeyK') this.toggle('sk');
      else if (e.code === 'KeyL') this.toggle('q');
      else if (e.code === 'KeyM') this.toggle('map');
      else if (e.code === 'KeyB') this.toggle('mall');
      else if (e.code === 'KeyP') this.toggle('pet');
      else if (e.code === 'Escape') {
        window.__escClosed = !!document.querySelector('.win:not(.hidden)') || !!this.hb.placing;
        this.hb.placing = null;
        for (const k in this.w) if (k !== 'npc') this.toggle(k, false, true);
        this.closeNpc();
        const st = document.getElementById('settings'); if (st && window.__escClosed) st.classList.add('hidden');
      }
    });
  }

  // ---------- Pencere yöneticisi: sürükle, öne getir, konumu hatırla, ekrana sığdır ----------
  _initWindows() {
    this.z = 10;
    try { this.winPos = JSON.parse(localStorage.getItem('srw-winpos')) || {}; } catch (e) { this.winPos = {}; }
    const all = [...document.querySelectorAll('.win')];
    for (const w of all) {
      w.addEventListener('pointerdown', () => { w.style.zIndex = ++this.z; }, true);
      const head = w.querySelector('.win-head');
      if (!head) continue;
      head.addEventListener('pointerdown', e => {
        if (e.target.closest('button') || CONFIG.isTouch) return;
        const ui = this.uiScale(), r = w.getBoundingClientRect();
        const ox = e.clientX - r.left, oy = e.clientY - r.top;
        const move = ev => this._placeWin(w, (ev.clientX - ox) / ui, (ev.clientY - oy) / ui);
        const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); this._saveWin(w); };
        window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
        e.preventDefault();
      });
      // pencere açılınca kayıtlı konum
      let vis = !w.classList.contains('hidden');
      new MutationObserver(() => {
        const now = !w.classList.contains('hidden');
        if (now && !vis) { w.style.zIndex = ++this.z; this._restoreWin(w); }
        vis = now;
      }).observe(w, { attributes: true, attributeFilter: ['class'] });
    }
    window.addEventListener('resize', () => all.forEach(w => { if (w.classList.contains('placed')) this._placeWin(w, parseFloat(w.style.left), parseFloat(w.style.top)); }));
  }
  uiScale() { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ui')) || 1; }
  _placeWin(w, x, y) {
    const ui = this.uiScale(), W = window.innerWidth / ui, H = window.innerHeight / ui;
    const ww = w.offsetWidth, wh = w.offsetHeight;
    w.classList.add('placed');
    w.style.left = clamp(x, 4, Math.max(4, W - ww - 4)) + 'px';
    w.style.top = clamp(y, 4, Math.max(4, H - wh - 4)) + 'px';
  }
  _saveWin(w) { this.winPos[w.id] = [parseFloat(w.style.left), parseFloat(w.style.top)]; try { localStorage.setItem('srw-winpos', JSON.stringify(this.winPos)); } catch (e) { /* yoksay */ } }
  _restoreWin(w) {
    const p = this.winPos[w.id];
    if (p && !CONFIG.isTouch) requestAnimationFrame(() => this._placeWin(w, p[0], p[1]));
    else if (w.classList.contains('placed')) { w.classList.remove('placed'); w.style.left = ''; w.style.top = ''; }
  }

  // ---------- Bilgi balonu (fare üstü / uzun dokunma) ----------
  _initTips() {
    const tip = this.tipEl = document.getElementById('tip');
    let cur = null, lt = null;
    const show = (el, x, y) => {
      const html = this.tipHTML(el.dataset.tip);
      if (!html) return hide();
      tip.innerHTML = html; tip.classList.remove('hidden');
      const r = tip.getBoundingClientRect();
      let tx = x + 16, ty = y + 18;
      if (tx + r.width > window.innerWidth - 6) tx = x - r.width - 12;
      if (ty + r.height > window.innerHeight - 6) ty = y - r.height - 12;
      tip.style.left = Math.max(4, tx) + 'px'; tip.style.top = Math.max(4, ty) + 'px';
    };
    const hide = () => { tip.classList.add('hidden'); cur = null; };
    this.hideTip = hide;
    document.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch') return;
      const el = e.target.closest && e.target.closest('[data-tip]');
      if (!el) { if (cur) hide(); return; }
      cur = el; show(el, e.clientX, e.clientY);
    });
    document.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'touch') { hide(); return; }
      const el = e.target.closest && e.target.closest('[data-tip]');
      clearTimeout(lt); hide();
      if (el) lt = setTimeout(() => { cur = el; show(el, e.clientX, e.clientY); this._tipShownAt = Date.now(); }, 420);
    }, true);
    document.addEventListener('pointerup', e => { if (e.pointerType === 'touch') { clearTimeout(lt); if (cur) setTimeout(hide, 2200); } }, true);
  }
  tipHTML(spec) {
    if (!spec) return '';
    const [k, v] = [spec.slice(0, spec.indexOf(':') < 0 ? spec.length : spec.indexOf(':')), spec.slice(spec.indexOf(':') + 1)];
    const P = this.p;
    if (k === 'sl') { const it = this.inv.slots[+v]; return it ? this.itemCard(it, isGear(it.base) ? this.inv.equip[ITEM_BASES[it.base].slot === 'ring' ? 'ring1' : ITEM_BASES[it.base].slot] : null) : ''; }
    if (k === 'eq') { const it = this.inv.equip[v]; return it ? this.itemCard(it) : '<div class="tn">' + EQUIP_SLOTS[v].name + '</div><div class="tm">Boş</div>'; }
    if (k === 'base') { const b = ITEM_BASES[v]; if (isStack(v)) return '<div class="tn">' + b.name + '</div><div class="te">' + (b.sub || '') + '</div>'; return this.itemCard(makeItem(v)); }
    if (k === 'mo') { const o = (Eco._off || []).find(o => o.id === +v); return o ? this.itemCard(o.it) + '<div class="in-eco">Satıcı: ' + o.seller + '</div>' : ''; }
    if (k === 'ml') { const L = Eco.s.list[+v]; const it = L && Inventory.dec(L.e); return it ? this.itemCard(it) : ''; }
    if (k === 'bb') { const x = Eco.s.bb[+v]; const it = x && Inventory.dec(x.e); return it ? this.itemCard(it) : ''; }
    if (k === 'eco') {
      const c = v, ix = Eco.index(c);
      return '<div class="tn">' + ECO_CATS[c] + ' talebi</div><div class="te">' + ecoSpark(Eco.history(c), 150, 34) + '</div><div class="tm">Şu an %' + Math.round(ix * 100) + ' · NPC alım çarpanı %' + Math.round(Eco.satMult(c) * 100) + '</div><div class="tm">Talep yüksekken NPC\'ler daha çok öder ama daha pahalı satar. Aynı türden çok satmak fiyatı geçici düşürür.</div>';
    }
    if (k === 'sk') {
      const x = SKILLS_BY_ID[v], r = P.book.r(v);
      return '<div class="tn">' + x.name + '</div><div class="tm">' + MASTERIES[x.m].name + ' · ' + SKILL_TYPE_NAMES[x.type] + ' · kademe ' + r + '/' + x.maxR + (x.mp ? ' · MP ' + rankMp(x, Math.max(1, r)) : '') + '</div><div>' + x.desc + '</div><div class="te">' + skillDetail(x, Math.max(1, r)) + '</div>' +
        (r < x.maxR ? '<div class="tm">Sonraki: ' + MASTERIES[x.m].name + ' ' + rankReq(x, r + 1) + ' · ' + rankCost(x, r + 1) + ' SP</div>' : '');
    }
    if (k === 'ms') { const M = MASTERIES[v]; return '<div class="tn">' + M.full + '</div><div>' + M.desc + '</div><div class="tm">Seviye ' + P.book.mastery[v] + ' · sonraki ' + masteryCost(P.book.mastery[v] + 1) + ' SP</div>'; }
    if (k === 'hb') {
      const e = this.hb.get(this.hb.page, +v);
      if (!e) return '<div class="tm">Boş yuva. Yetenek veya iksiri sürükle ya da Hotbar düğmesiyle yerleştir.</div>';
      if (e.t === 'sk') return this.tipHTML('sk:' + e.id);
      if (e.t === 'it') return this.tipHTML('base:' + e.base) + '<div class="tm">Envanterde: ' + this.inv.count(e.base) + '</div>';
      const vw = this.hb.view(e); return '<div class="tn">' + vw.name + '</div><div class="tm">' + vw.tip + '</div>';
    }
    if (k === 'bf') {
      const b = this.hud.buffList().find(x => x.key === v); if (!b) return '';
      let extra = '';
      if (v.startsWith('b_')) extra = '<div class="te">' + skillDetail(SKILLS_BY_ID[v.slice(2)], P.book.r(v.slice(2))) + '</div>';
      if (v === 'imbue' && P.imbue && P.imbue.id) extra = '<div class="te">' + skillDetail(SKILLS_BY_ID[P.imbue.id], P.book.r(P.imbue.id)) + '</div>';
      if (v === 'zerk') extra = '<div class="te">Saldırı x1.5, hız x1.6</div>';
      if (v === 'prem') extra = '<div class="te">EXP ve SP +%50, ganimet +%30</div>';
      if (v === 'bless') extra = '<div class="te">EXP ve SP +%100</div>';
      return '<div class="tn' + (b.bad ? ' tw' : '') + '">' + b.name + '</div>' + extra + '<div class="tm">Kalan ' + (b.t >= 60 ? Math.floor(b.t / 60) + ' dk ' + Math.floor(b.t % 60) + ' sn' : Math.ceil(b.t) + ' sn') + '</div>';
    }
    if (k === 'st') return '<div class="tn tw">' + (STATUS_NAMES[v] || v) + '</div>';
    if (k === 'zerk') return '<div class="tn">Berserk</div><div>Canavar öldürdükçe küreler dolar. 5 küre dolunca Z ile ya da kürelere tıklayarak 30 sn berserk olursun.</div><div class="tm">' + Math.floor(P.stats.zerk) + ' / 5</div>';
    if (k === 'pet') return '<div class="tn">Evcil hayvanlar</div><div class="tm">Ayrıntı ve çanta için tıkla (P)</div>';
    return '';
  }

  // ---------- Sürükle-bırak: yetenek / eşya → hotbar ----------
  _initDrag() {
    let st = null;
    document.addEventListener('pointerdown', e => {
      const el = e.target.closest && (e.target.closest('[data-drag]') || e.target.closest('[data-i]'));
      if (!el || !el.closest('.win')) return;
      let spec = el.dataset.drag;
      if (!spec && el.dataset.i !== undefined) { const it = this.inv.slots[+el.dataset.i]; if (it && ITEM_BASES[it.base].cat === 'use') spec = 'it:' + it.base; }
      if (!spec) return;
      st = { spec, x: e.clientX, y: e.clientY, ghost: null, src: el };
    });
    document.addEventListener('pointermove', e => {
      if (!st) return;
      if (!st.ghost) {
        if (Math.hypot(e.clientX - st.x, e.clientY - st.y) < 10) return;
        const [t, id] = st.spec.split(':');
        st.ghost = document.createElement('div'); st.ghost.className = 'drag-ghost';
        st.ghost.innerHTML = t === 'sk' ? skillIcon(id) : itemIcon(id);
        document.body.appendChild(st.ghost);
        this.hud.el.root.classList.add('placing');
        if (this.hideTip) this.hideTip();
      }
      st.ghost.style.transform = 'translate(' + (e.clientX - 22) + 'px,' + (e.clientY - 22) + 'px)';
    });
    const end = e => {
      if (!st) return;
      if (st.ghost) {
        st.ghost.remove(); this.hud.el.root.classList.remove('placing');
        const tgt = document.elementFromPoint(e.clientX, e.clientY), slot = tgt && tgt.closest('#hotbar .slot');
        if (slot) {
          const i = [...slot.parentNode.children].indexOf(slot), [t, id] = st.spec.split(':');
          this.hb.set(this.hb.page, i, t === 'sk' ? { t: 'sk', id } : { t: 'it', base: id });
          SFX.play('equip'); this.hud.log('Hotbara yerleştirildi.');
        }
        this._dragged = Date.now();
      }
      st = null;
    };
    document.addEventListener('pointerup', end); document.addEventListener('pointercancel', end);
  }

  // ---------- Genel ----------
  isOpen(k) { return !this.w[k].classList.contains('hidden'); }
  toggle(k, force, silent) {
    const open = force === undefined ? !this.isOpen(k) : force;
    if (open === this.isOpen(k)) return;
    this.w[k].classList.toggle('hidden', !open);
    if (!silent) SFX.play('ui');
    if (k === 'map') { this.wmap.open = open; if (open) this.wmap.draw(); }
    if (open) {
      // dar ekranda tek pencere
      if (window.innerWidth < 900) for (const o in this.w) if (o !== k && o !== 'npc' && this.isOpen(o)) this.w[o].classList.add('hidden');
      // geniş ekranda en çok iki pencere: en eskisi kapanır (ekranı boğmasın)
      this._order = (this._order || []).filter(o => o !== k && this.isOpen(o)); this._order.push(k);
      while (this._order.filter(o => o !== 'npc').length > 2) { const o = this._order.shift(); if (o !== 'npc') this.w[o].classList.add('hidden'); }
      if (k === 'inv') { this.sel = null; this.confirmDrop = false; }
      if (k === 'alc' && !this.alc.sel) { const w = this.inv.equip.weapon; this.alc.sel = w ? 'eq:weapon' : null; }
      this.refresh();
    }
  }
  _place(e) {
    this.hb.placing = e;
    for (const k in this.w) if (k !== 'npc') this.toggle(k, false, true);
    this.hud.log(e === 'clear' ? 'Boşaltmak için bir hotbar yuvasına dokun.' : 'Yerleştirmek için bir hotbar yuvasına dokun.', 'sys', '#7fe3ff');
  }

  refresh() {
    if (this.isOpen('q')) this.refreshQ();
    if (this.isOpen('inv')) this.refreshInv();
    if (this.isOpen('char')) this.refreshChar();
    if (this.isOpen('sk')) this.refreshSk();
    if (this.isOpen('alc')) this.refreshAlc();
    if (this.isOpen('mall')) this.refreshMall();
    if (this.isOpen('pet')) this.refreshPet();
    if (this.npc) this.refreshNpc();
  }

  // Eşya kartı (bilgi paneli)
  itemCard(it, cmp) {
    const n = itemInfo(it), lvl = this.p.stats.level;
    const eco = (it) => { if (!Eco.s || !ecoCat(it.base)) return ''; const sp = sellPrice(it); return sp ? '<div class="in-eco">NPC satış: <b>' + sp.toLocaleString('tr-TR') + '</b> · Pazar değeri ~<b>' + (Eco.marketValue(it) * (it.n || 1)).toLocaleString('tr-TR') + '</b> altın</div>' : ''; };
    if (n.stack) {
      return '<div class="in-name" style="color:' + n.color + '">' + n.name + '</div>' +
        '<div class="in-sub">Adet: ' + it.n + ' / ' + n.max + '</div><div class="in-st">' + (n.sub || '') + '</div>' +
        (n.req > 1 ? '<div class="in-req' + (lvl < n.req ? ' bad' : '') + '">Gerekli seviye: ' + n.req + '</div>' : '') + eco(it);
    }
    let h = '<div class="in-name" style="color:' + n.color + '">' + n.name + '</div>' +
      '<div class="in-sub">' + (it.rarity ? '<b style="color:' + n.color + '">' + n.rarityName + '</b> · ' : '') + n.d + '. derece · ' + (n.tier + 1) + '/3 kademe · ' + n.typeName + '</div>' +
      '<div class="in-st">' + itemStatText(n).split(' · ').join('<br>') + '</div>';
    const bt = blueText(n);
    if (bt) h += '<div class="in-blue">' + bt + '</div>';
    h += '<div class="in-dur' + (n.broken ? ' bad' : '') + '">Dayanıklılık ' + n.dur + ' / ' + n.maxDur + (n.broken ? ' — KIRIK (tamir et)' : '') + '</div>';
    h += '<div class="in-req' + (lvl < n.req ? ' bad' : '') + '">Gerekli seviye: ' + n.req + '</div>';
    if (cmp) h += '<div class="in-cmp">Kuşanılı: ' + itemInfo(cmp).name + '</div>';
    return h + eco(it);
  }

  _slot(item, attrs, sel, emptyIcon) {
    if (!item) return '<div class="islot empty' + (sel ? ' sel' : '') + '" ' + attrs + '>' + (emptyIcon || '') + '</div>';
    const n = itemInfo(item), pg = item.plus ? PLUS_GLOW(item.plus) : 0;
    return '<div class="islot' + (sel ? ' sel' : '') + (n.broken ? ' broken' : '') + (n.seal ? ' seal' : '') + (pg ? ' pglow' : '') + '" ' + attrs + ' style="--sc:' + n.color + ';border-color:' + n.color + (pg ? ';--pg:#' + pg.toString(16).padStart(6, '0') : '') + '">' +
      n.icon + (item.plus ? '<i class="plus">+' + item.plus + '</i>' : '') + (n.stack && item.n > 1 ? '<i class="num">' + item.n + '</i>' : '') +
      (n.seal ? '<i class="ssym" style="color:' + n.color + '">' + RARITY[n.seal].sym.trim() + '</i>' : '') +
      (!n.stack ? '<i class="deg">' + n.d + (n.tier ? '.' + (n.tier + 1) : '') + '</i>' : '') + '</div>';
  }

  // ---------- Envanter ----------
  _selItem() {
    const s = this.sel;
    if (!s) return null;
    return s.w === 'inv' ? this.inv.slots[s.i] : this.inv.equip[s.key];
  }

  refreshInv() {
    const sel = this.sel, inv = this.inv, s = this.p.stats;
    this.equipEl.innerHTML = Object.keys(EQUIP_SLOTS).map(k =>
      '<div class="eqc"><small>' + EQUIP_SLOTS[k].name + '</small>' + this._slot(inv.equip[k], 'data-eq="' + k + '" data-tip="eq:' + k + '"', sel && sel.w === 'eq' && sel.key === k, icon(k.replace(/\d$/, ''), 'menu')) + '</div>').join('');
    this.gridEl.innerHTML = inv.slots.map((it, i) =>
      this._slot(it, 'data-i="' + i + '" data-tip="sl:' + i + '"', sel && sel.w === 'inv' && sel.i === i, '')).join('');

    const it = this._selItem();
    if (!it) this.infoEl.innerHTML = '<div class="hint">Bir eşyaya dokun.<br>Tekrar dokunmak kuşanır / kullanır.</div><button data-act="sort">↕ Sırala</button>';
    else {
      const n = itemInfo(it), b = ITEM_BASES[it.base];
      let cmp = null;
      if (sel.w === 'inv' && isGear(it.base)) cmp = inv.equip[b.slot === 'ring' ? 'ring1' : b.slot];
      let h = this.itemCard(it, cmp) + '<div class="btns">';
      if (sel.w === 'inv') {
        if (isGear(it.base)) h += '<button data-act="equip">Kuşan</button><button data-act="alc">Simya</button>';
        if (b.cat === 'use') h += '<button data-act="use">Kullan</button><button data-act="pin">Hotbar\'a koy</button>';
        if (b.cat !== 'quest') h += '<button data-act="drop" class="warn">' + (this.confirmDrop ? 'Emin misin?' : 'At') + '</button>';
      } else h += '<button data-act="unequip">Çıkar</button><button data-act="alc">Simya</button>';
      this.infoEl.innerHTML = h + '</div>';
    }
    this.footEl.innerHTML = '<span>Altın <b>' + s.gold.toLocaleString('tr-TR') + '</b></span><span>Silk <b>' + (s.silk || 0) + '</b></span><span>Yuva <b>' + (inv.slots.length - inv.freeCount()) + ' / ' + inv.slots.length + '</b></span>' +
      '<span class="stt">Fiz. ' + this.p.d.phyMin + '–' + this.p.d.phyMax + ' · Büyü ' + this.p.d.magMin + '–' + this.p.d.magMax + ' · Savunma ' + this.p.d.pdef + ' / ' + this.p.d.mdef + '</span>';
  }

  _invAct(act) {
    const inv = this.inv, sel = this.sel;
    if (act === 'sort') { inv.sort(); this.sel = null; SFX.play('tab'); return; }
    if (!sel) return;
    let res = null;
    const it = this._selItem();
    if (act === 'equip' && sel.w === 'inv') {
      res = inv.equipFrom(sel.i);
      if (res.ok) { const b = ITEM_BASES[it.base]; this.sel = { w: 'eq', key: b.slot === 'ring' ? (inv.equip.ring1 === it ? 'ring1' : 'ring2') : b.slot }; SFX.play('equip'); } else SFX.play('error');
    } else if (act === 'unequip' && sel.w === 'eq') {
      res = inv.unequip(sel.key);
      if (res.ok) { this.sel = null; SFX.play('equip'); }
    } else if (act === 'use' && sel.w === 'inv' && it) {
      if (ITEM_BASES[it.base].cat === 'use') this.combat.useItem(it.base);
      if (!inv.slots[sel.i]) this.sel = null;
      this.refreshInv(); return;
    } else if (act === 'pin' && it) { this._place({ t: 'it', base: it.base }); return; }
    else if (act === 'alc' && it) { this.alc.sel = sel.w === 'inv' ? 'sl:' + sel.i : 'eq:' + sel.key; this.alc.msg = null; this.toggle('alc', true); return; }
    else if (act === 'drop' && sel.w === 'inv') {
      if (!this.confirmDrop) { this.confirmDrop = true; this.refreshInv(); return; }
      const x = inv.remove(sel.i);
      this.hud.log(itemInfo(x).name + ' atıldı.');
      this.sel = null; this.confirmDrop = false;
      return;
    }
    this.confirmDrop = false;
    if (res && res.msg) this.hud.log(res.msg, res.ok ? 'sys' : 'dmg');
    this.refreshInv();
  }

  // ---------- Karakter ----------
  refreshChar() {
    const p = this.p, s = p.stats, d = p.d, b = this.$('char-body');
    const pts = s.statPts;
    const btn = (st, n) => '<button data-stat="' + st + '" data-n="' + n + '"' + (pts < 1 ? ' disabled' : '') + '>+' + n + '</button>';
    const row = (k, v) => '<div class="cr"><span>' + k + '</span><b>' + v + '</b></div>';
    const wt = d.wtype ? WEAPON_TYPES[d.wtype].name : 'Yok';
    b.innerHTML =
      '<div class="ch-top"><div class="ch-av">' + (d.wtype ? itemIcon(p.inv.equip.weapon.base) : icon('menu_char', 'menu')) + '</div><div><div class="ch-n">' + p.name + '</div>' +
      '<div class="ch-l">Seviye ' + s.level + ' · EXP %' + (s.exp / s.maxExp * 100).toFixed(2) + '</div><div class="ch-l">SP ' + p.book.sp + ' · Silah: ' + wt + '</div></div></div>' +
      '<div class="ch-stats"><div class="st"><span>GÜÇ (STR)</span><b>' + s.STR + '</b>' + btn('str', 1) + btn('str', Math.min(5, Math.max(1, pts))) + '</div>' +
      '<div class="st"><span>ZEKÂ (INT)</span><b>' + s.INT + '</b>' + btn('int', 1) + btn('int', Math.min(5, Math.max(1, pts))) + '</div>' +
      '<div class="pts' + (pts ? ' on' : '') + '">Dağıtılacak puan: <b>' + pts + '</b></div></div>' +
      '<div class="hint">GÜÇ: can ve fiziksel saldırı (savaşçı). ZEKÂ: mana ve büyü saldırısı (büyücü). Her seviyede +1 GÜÇ, +1 ZEKÂ ve 3 serbest puan.</div>' +
      '<div class="ch-grid">' +
      row('Can', s.maxHp) + row('Mana', s.maxMp) +
      row('Fiz. saldırı', d.phyMin + '–' + d.phyMax) + row('Büyü saldırı', d.magMin + '–' + d.magMax) +
      row('Fiz. savunma', d.pdef) + row('Büyü savunma', d.mdef) +
      row('Kritik', '%' + d.crit) + row('Blok', '%' + d.block) +
      row('Hız', '%' + Math.round(d.speed * 100)) + row('Menzil', d.range.toFixed(1) + ' m') +
      row('Berserk', p.zerkT > 0 ? 'AÇIK' : Math.floor(s.zerk) + ' / 5') + row('Altın', s.gold.toLocaleString('tr-TR')) + '</div>';
  }

  // ---------- Yetenekler ----------
  _skSay(r) { this.skMsg = r.msg ? { text: r.msg, ok: r.ok } : null; this.refreshSk(); }
  // Silkroad tarzı: solda ustalık listesi, sağda ustalık seviyesine göre kademelenen yetenek ağacı, altta ayrıntı
  refreshSk() {
    if (MASTERIES[this.skTab].race !== RACE) this.skTab = raceMasteries()[0];
    const p = this.p, book = p.book, L = p.stats.level, k = this.skTab, M = MASTERIES[k], m = book.mastery[k];
    const cls = book.race === 'eu' ? book.classes() : null;
    const list = SKILL_DEFS.filter(x => x.m === k);
    if (!this.skSel || SKILLS_BY_ID[this.skSel].m !== k) this.skSel = list[0].id;
    const can = book.canRaise(k);
    let h = '<div class="sk-head"><span class="sp">' + book.sp.toLocaleString('tr-TR') + ' SP</span><span class="lim">Toplam ustalık ' + book.total() + ' / ' + book.limit() + ' · her ustalık en çok karakter seviyesi (' + L + ')' +
      (cls ? ' · Sınıf: ' + (cls.length ? cls.map((c, i) => MASTERIES[c].name + (i ? ' (yan)' : ' (ana)')).join(' / ') : 'seçilmedi (en çok 2)') : '') + '</span>' +
      '<span class="sk-tools"><button data-act="pinatk" class="small" title="Normal saldırıyı hotbara koy">' + icon('atk') + '</button><button data-act="pinzerk" class="small" title="Berserk düğmesini hotbara koy">' + icon('zerk', 'fire') + '</button><button data-act="clear" class="small warn">Yuvayı boşalt</button></span></div>' +
      '<div class="sk-msg" style="color:' + (this.skMsg && this.skMsg.ok ? '#a8f0a0' : '#ff8a7a') + '">' + (this.skMsg ? this.skMsg.text : '') + '</div><div class="sk-main"><div class="ml-list">' +
      raceMasteries().map(id => '<div class="ml-it' + (id === k ? ' on' : '') + (cls && cls.length >= 2 && !cls.includes(id) ? ' off' : '') + '" data-mtab="' + id + '" data-tip="ms:' + id + '">' + masteryIcon(id) +
        '<div class="t"><b>' + MASTERIES[id].name + '</b><small>' + MASTERIES[id].full.replace(' Ustalığı', '') + '</small></div><span class="lv">' + book.mastery[id] + '</span></div>').join('') + '</div>';
    h += '<div class="tree"><div class="tree-head">' + masteryIcon(k).replace('class="ico"', 'class="ico" style="width:44px;height:44px;flex:0 0 44px;border-radius:4px"') +
      '<div class="t"><b>' + M.full + '</b><small>' + M.desc + (M.weapons ? ' Silah: ' + M.weapons.map(w => WEAPON_TYPES[w].name).join(', ') : '') + '</small></div>' +
      '<div class="lv"><b>' + m + '</b><small>/ ' + L + '</small></div>' +
      '<button data-act="raise"' + (can.ok ? '' : ' class="dis"') + ' title="' + (can.ok ? '' : can.msg) + '">Yükselt<br><small>' + (m >= L ? 'seviye sınırı' : masteryCost(m + 1) + ' SP') + '</small></button></div><div class="tree-grid">';
    const tiers = {};
    list.forEach(x => { (tiers[x.reqM] = tiers[x.reqM] || []).push(x); });
    h += Object.keys(tiers).map(Number).sort((a, b) => a - b).map(req => '<div class="tier' + (m >= req ? ' open' : '') + '"><div class="lvl"><b>' + req + '</b>ustalık</div><div class="nodes">' +
      tiers[req].map(x => {
        const r = book.r(x.id), cl = book.canLearn(x.id);
        const st = (r ? ' have' : m < x.reqM ? ' lock' : '') + (cl.ok ? ' can' : '') + (this.skSel === x.id ? ' sel' : '');
        return '<div class="node' + st + '" data-sk="' + x.id + '" data-tip="sk:' + x.id + '"' + (r && x.type !== 'passive' ? ' data-drag="sk:' + x.id + '"' : '') + '>' + skillIcon(x.id) +
          (x.type === 'passive' ? '<span class="pass">P</span>' : '') + '<div class="pips">' + Array.from({ length: x.maxR }, (_, i) => '<i' + (i < r ? ' class="on"' : '') + '></i>').join('') + '</div></div>';
      }).join('') + '</div></div>').join('') + '</div>';
    const x = SKILLS_BY_ID[this.skSel], r = book.r(x.id), maxed = r >= x.maxR, need = maxed ? 0 : rankReq(x, r + 1), cost = maxed ? 0 : rankCost(x, r + 1), ok = !maxed && m >= need;
    h += '<div class="sk-detail">' + skillIcon(x.id) + '<div class="t"><b>' + x.name + '</b> <span class="meta">' + SKILL_TYPE_NAMES[x.type] + ' · kademe ' + r + '/' + x.maxR +
      (x.mp ? ' · MP ' + rankMp(x, Math.max(1, r)) : '') + (x.cd > 1 ? ' · bekleme ' + x.cd + ' sn' : '') + '</span><div>' + x.desc + '</div><div class="eff">' + skillDetail(x, Math.max(1, r)) + '</div>' +
      (maxed ? '<div class="next">En üst kademede.</div>' : '<div class="next' + (ok ? '' : ' bad') + '">' + (r ? 'Sonraki kademe' : 'Öğrenmek için') + ': ' + M.name + ' ' + need + ' · ' + cost + ' SP' + (r ? ' → ' + skillDetail(x, r + 1) : '') + '</div>') +
      '</div><div class="act">' + (maxed ? '' : '<button data-act="learn" data-id="' + x.id + '"' + (ok && book.sp >= cost ? '' : ' class="dis"') + '>' + (r ? 'Geliştir' : 'Öğren') + '</button>') +
      (r && x.type !== 'passive' ? '<button data-act="pin" data-id="' + x.id + '" class="small">Hotbara koy</button>' : '') + '</div></div></div></div>';
    this.$('skill-body').innerHTML = h;
  }

  // ---------- Simya ----------
  _alcItem(src) {
    if (!src) return null;
    const [w, k] = src.split(':');
    return w === 'eq' ? this.inv.equip[k] : this.inv.slots[+k];
  }
  refreshAlc() {
    const inv = this.inv, a = this.alc, it = this._alcItem(a.sel);
    if (a.sel && (!it || !isGear(it.base) || ITEM_BASES[it.base].cat === 'avatar')) a.sel = null;
    const gear = [];
    for (const k in inv.equip) if (inv.equip[k] && ITEM_BASES[inv.equip[k].base].cat !== 'avatar') gear.push(['eq:' + k, inv.equip[k], true]);
    inv.slots.forEach((x, i) => { if (x && isGear(x.base) && ITEM_BASES[x.base].cat !== 'avatar') gear.push(['sl:' + i, x, false]); });
    let h = '<div class="alc-list">' + (gear.length ? gear.map(([src, x, worn]) => {
      const n = itemInfo(x);
      return '<div class="alc-it' + (src === a.sel ? ' on' : '') + '" data-src="' + src + '">' + this._slot(x, '', false) + '<span style="color:' + n.color + '">' + n.name + (worn ? ' ✔' : '') + '</span></div>';
    }).join('') : '<div class="hint">Ekipmanın yok.</div>') + '</div>';
    if (!a.sel) h += '<div class="hint">Güçlendirmek istediğin eşyayı seç.</div>';
    else {
      const x = this._alcItem(a.sel), n = itemInfo(x), elx = elixirFor(x.base), have = inv.count(elx);
      const lucky = a.lucky && inv.count('luck') > 0, astral = a.astral && inv.count('astral') > 0, imm = a.imm && inv.count('immortal') > 0;
      const ch = alchemyChance(x, lucky);
      h += '<div class="alc-main"><div class="alc-card">' + this.itemCard(x) + '</div><div class="alc-ctl">' +
        '<h4>Güçlendirme (+)</h4>' +
        (x.plus >= MAX_PLUS ? '<div class="hint">En üst seviye (+' + MAX_PLUS + ').</div>' :
          '<div class="cr"><span>' + ITEM_BASES[elx].name + '</span><b' + (have ? '' : ' class="bad"') + '>' + have + '</b></div>' +
          '<div class="cr"><span>+' + x.plus + ' → +' + (x.plus + 1) + ' başarı şansı</span><b>%' + Math.round(ch * 100) + '</b></div>' +
          '<button data-act="tlucky" class="tg' + (lucky ? ' on' : '') + '">' + icon('luck', 'gold') + ' Şans Tozu (' + inv.count('luck') + ')</button> ' +
          '<button data-act="tastral" class="tg' + (astral ? ' on' : '') + '">' + icon('astral', 'cold') + ' Koruma Taşı (' + inv.count('astral') + ')</button> ' +
          '<button data-act="timm" class="tg' + (imm ? ' on' : '') + '">' + icon('immortal', 'mall') + ' Ölümsüz Taş (' + inv.count('immortal') + ')</button>' +
          '<div class="hint">Başarısız olursa eşya +0\'a düşer' + (imm ? ' — Ölümsüz Taş ile hiç düşmez.' : astral ? ' — Koruma Taşı ile sadece 1 seviye düşer.' : '. Koruma Taşı / Ölümsüz Taş (Item Mall) bunu engeller.') + '</div>' +
          '<button data-act="enhance" class="big"' + (have ? '' : ' disabled') + '>Güçlendir</button>');
      const stones = Object.keys(BLUES).filter(k => inv.count('ms_' + k) > 0 && BLUE_BY_KIND[ITEM_BASES[x.base].cat].includes(k));
      h += '<h4>Büyü Taşı (mavi stat)</h4>' + (stones.length ? '<div class="seg">' + stones.map(k => '<button data-stone="' + k + '" class="tg' + (a.stone === k ? ' on' : '') + '">' + BLUES[k].name + ' (' + inv.count('ms_' + k) + ')</button>').join('') + '</div>' +
        (a.stone && stones.includes(a.stone) ? '<button data-act="stone">Taşı Uygula (%60)</button>' : '') : '<div class="hint">Bu eşyaya uygun büyü taşın yok. Canavarlardan düşer.</div>');
      h += (a.msg ? '<div class="alc-msg" style="color:' + a.msg.color + '">' + a.msg.text + '</div>' : '') + '</div></div>';
    }
    this.$('alch-body').innerHTML = h;
  }
  _alcAct(act) {
    const a = this.alc, inv = this.inv, x = this._alcItem(a.sel);
    if (act === 'tlucky') { a.lucky = !a.lucky; SFX.play('tab'); return this.refreshAlc(); }
    if (act === 'tastral') { a.astral = !a.astral; SFX.play('tab'); return this.refreshAlc(); }
    if (act === 'timm') { a.imm = !a.imm; SFX.play('tab'); return this.refreshAlc(); }
    if (!x) return;
    if (act === 'enhance') {
      if (x.plus >= MAX_PLUS) return;
      const elx = elixirFor(x.base);
      if (!inv.count(elx)) { a.msg = { text: ITEM_BASES[elx].name + ' gerekli.', color: '#ff8a7a' }; SFX.play('error'); return this.refreshAlc(); }
      const lucky = a.lucky && inv.count('luck') > 0, astral = a.astral && inv.count('astral') > 0;
      const ch = alchemyChance(x, lucky);
      inv.take(elx, 1); if (lucky) inv.take('luck', 1);
      if (Math.random() < ch) {
        x.plus++;
        a.msg = { text: 'Başarılı! ' + itemInfo(x).name, color: '#ffd23a' };
        SFX.play('upgrade'); this.hud.log(itemInfo(x).name + ' güçlendirildi!', 'lvl');
        if (x.plus >= 7) this.hud.banner('+' + x.plus + '!', itemInfo(x).baseName, 'quest');
      } else {
        const old = x.plus, imm = a.imm && inv.count('immortal') > 0;
        if (imm) inv.take('immortal', 1);
        else if (astral) { inv.take('astral', 1); x.plus = Math.max(0, x.plus - 1); } else x.plus = 0;
        a.msg = { text: 'Başarısız. +' + old + ' → +' + x.plus, color: '#ff8a7a' };
        SFX.play('fail');
      }
      this.p.refreshLook(); inv.changed();
    } else if (act === 'stone' && a.stone) {
      const k = a.stone, base = 'ms_' + k, b = ITEM_BASES[x.base];
      if (!inv.take(base, 1)) return;
      const ex = x.blues.find(v => v[0] === k), mx = BLUES[k].max(b.d);
      if (Math.random() < 0.6) {
        if (ex) {
          if (ex[1] >= mx) { a.msg = { text: BLUES[k].name + ' zaten en üstte (' + mx + ').', color: '#ffe9a8' }; inv.addStack(base, 1); }
          else { ex[1] = Math.min(mx, ex[1] + 1 + (Math.random() < 0.3 ? 1 : 0)); a.msg = { text: BLUES[k].fmt(ex[1]), color: BLUE_COLOR }; SFX.play('upgrade'); }
        } else if (x.blues.length >= 5) { a.msg = { text: 'Bu eşyada yer yok (en çok 5 mavi stat).', color: '#ff8a7a' }; inv.addStack(base, 1); }
        else { x.blues.push([k, Math.max(1, Math.round(mx * 0.3))]); a.msg = { text: 'Yeni mavi stat: ' + BLUES[k].fmt(x.blues[x.blues.length - 1][1]), color: BLUE_COLOR }; SFX.play('upgrade'); }
        if (k === 'dur') x.dur = Math.min(maxDur(x), x.dur);
      } else { a.msg = { text: 'Taş tutmadı.', color: '#ff8a7a' }; SFX.play('fail'); }
      this.p.refreshLook(); inv.changed();
    }
    this.refreshAlc();
  }

  // ---------- Item Mall ----------
  refreshMall() {
    const s = this.p.stats, tab = MALL.find(t => t.id === this.mallTab) || MALL[0];
    let h = '<div class="mall-head"><span class="silk"><i class="silkc"></i> <b>' + (s.silk || 0).toLocaleString('tr-TR') + '</b> Silk</span>' +
      '<small>Silk kazan: seviye atlama +5 · görev +10 · Unique +50 · günlük giriş +20 · Şampiyon/Dev canavarlardan Silk Kesesi</small></div>' +
      '<div class="mtabs">' + MALL.map(t => '<button data-mt="' + t.id + '" class="' + (t.id === tab.id ? 'on' : '') + '">' + t.name.replace(/^\S+ /, '') + '</button>').join('') + '</div>';
    h += '<div class="mall-grid">' + tab.items.map(([base, n, c]) => {
      const b = ITEM_BASES[base];
      const sub = b.cat === 'avatar' ? EQUIP_SLOTS[b.slot].name + ' · ' + b.fb.map(x => BLUES[x[0]].fmt(x[1])).join(', ') : (b.sub || '');
      const own = b.keep && this.inv.count(base) ? ' <small class="own">sende var</small>' : '';
      return '<div class="mall-it" data-tip="base:' + base + '"><div class="mi-ic">' + itemIcon(base) + '</div><div class="mi-nm">' + b.name + (n > 1 ? ' x' + n : '') + own + '<small>' + sub + '</small></div>' +
        '<button data-buy="' + base + '" data-n="' + n + '" data-c="' + c + '"' + ((s.silk || 0) < c ? ' class="dis"' : '') + '><i class="silkc"></i> ' + c + '</button></div>';
    }).join('') + '</div>';
    this.$('mall-body').innerHTML = h;
  }
  _mallBuy(base, n, c) {
    const s = this.p.stats, b = ITEM_BASES[base];
    if ((s.silk || 0) < c) { SFX.play('error'); this.hud.log('Yeterli Silk yok.'); return; }
    if (!this.inv.canAdd(base, n)) { SFX.play('error'); this.hud.log('Envanterde yer yok.'); return; }
    s.silk -= c;
    this.inv.add(isStack(base) ? makeStack(base, n) : makeItem(base));
    SFX.play('coin');
    this.hud.log('Item Mall: ' + b.name + (n > 1 ? ' x' + n : '') + ' alındı (envanter).', 'lvl', '#ff9ae8');
    this.refreshMall();
  }

  // ---------- Evcil hayvanlar ----------
  refreshPet() {
    const P = this.pets, inv = this.inv;
    const pet = (base, on, label, extra) => this._row(itemIcon(base), ITEM_BASES[base].name + (on ? ' <small class="own">çağrılı</small>' : ''), extra || ITEM_BASES[base].sub,
      inv.count(base) ? '<button data-pa="' + base + '">' + (on ? 'Gönder' : 'Çağır') + '</button>' : '<span class="qs">Yok</span>');
    let h = '<div class="hint">Evcil hayvan ve binek kartları envanterde durur; buradan ya da hotbardan çağırılır. Toplayıcı (Ahır: Tilki, Item Mall: Altın Sincap) yerdeki ganimeti senin için toplar; envanterin dolarsa kendi çantasına koyar.</div>';
    h += pet('pet_grab', P.grab && P.grabKind === 1) + pet('pet_grab2', P.grab && P.grabKind === 2) +
      pet('pet_atk', !!P.atk, '', P.atk ? 'Can ' + Math.ceil(P.atk.hp) + ' / ' + P.atk.maxHp : null) +
      pet('horse', P.mounted && (P.horseSpeed || 1.7) < 2) + pet('horse2', P.mounted && P.horseSpeed >= 2);
    h += '<h4>Toplama filtresi</h4><div class="filt">' + [['all', 'Hepsi'], ['items', 'Sadece eşya'], ['gear', 'Sadece ekipman'], ['gold', 'Sadece altın']].map(([k, n]) => '<button data-pf="' + k + '" class="' + (P.filter === k ? 'on' : '') + '">' + n + '</button>').join('') + '</div>';
    const size = P.pinvSize();
    h += '<h4>Evcil çantası (' + P.pinv.slice(0, size).filter(Boolean).length + '/' + size + ') <button data-pa="all" class="small">Hepsini envantere al</button></h4>' +
      '<div class="st-grid">' + P.pinv.slice(0, size).map((it, i) => this._slot(it, 'data-pb="' + i + '"', false, '')).join('') + '</div>';
    this.$('pet-body').innerHTML = h;
  }

  // ---------- Görev günlüğü ----------
  refreshQ() {
    const qm = this.quests, list = qm.activeList();
    this.qBody.innerHTML = (list.length ? list.map(q => {
      const ready = qm.state[q.id].s === 'ready';
      return '<div class="qrow' + (ready ? ' ready' : '') + '"><div class="qt">' + q.name + '</div><div class="qd">' + q.desc + '</div>' +
        '<div class="qo">' + qm.objectiveText(q) + '</div><div class="qr">Ödül: ' + qm.rewardText(q) + '</div></div>';
    }).join('') : '<div class="hint">Aktif görevin yok.<br>Şehirdeki NPC\'lerin başındaki <b>!</b> işaretine bak.</div>') +
      '<div class="qfoot">Tamamlanan görev: <b>' + qm.doneCount() + ' / ' + qm.defs.length + '</b></div>';
  }

  // ---------- NPC ----------
  openNpc(npc) {
    this.npc = npc; SFX.play('ui');
    const tabs = NPC_TABS[npc.id] || [['quests', 'Görevler']];
    const mk = this.quests.markerFor(npc.id);
    this.tab = mk ? 'quests' : tabs[0][0];
    this.msg = null; this.sellConfirm = null;
    this.filter.d = SHOP_DEGREES.filter(d => degreeReq(d) <= this.p.stats.level).pop() || SHOP_DEGREES[0];
    if (window.innerWidth < 900) for (const k in this.w) if (k !== 'npc') this.toggle(k, false, true);
    this.w.npc.classList.remove('hidden');
    this.refreshNpc();
  }
  closeNpc() { this.npc = null; this.w.npc.classList.add('hidden'); }

  refreshNpc() {
    const npc = this.npc, s = this.p.stats;
    if (!npc) return;
    this.npcTitle.textContent = npc.name + ' — ' + npc.title;
    const mk = this.quests.markerFor(npc.id);
    const tabs = (NPC_TABS[npc.id] || [['quests', 'Görevler']]).filter(t => t[0] !== 'quests' || this.quests.forNpc(npc.id).length || npc.id === 'captain');
    this.npcTabs.innerHTML = tabs.map(t => '<button data-tab="' + t[0] + '" class="' + (t[0] === this.tab ? 'on' : '') + '">' + t[1] + (t[0] === 'quests' && mk ? ' ' + mk : '') + '</button>').join('');
    const t = this.tab;
    this.npcBody.innerHTML = t.startsWith('buy:') ? this._buyHTML(t.slice(4)) : t === 'sell' ? this._sellHTML() : t === 'repair' ? this._repairHTML() :
      t === 'storage' ? this._storageHTML() : t === 'tele' ? this._teleHTML() : t === 'job' ? this._jobHTML() : t === 'trade' ? this._tradeHTML() : t === 'den' ? this._denHTML() : t === 'unique' ? this._uniqueHTML() : t.startsWith('mk:') ? this._marketHTML(t.slice(3)) : this._questHTML();
    this.npcFoot.innerHTML = '<span>Altın <b>' + s.gold.toLocaleString('tr-TR') + '</b></span><span>Yuva <b>' + (this.inv.slots.length - this.inv.freeCount()) + ' / ' + this.inv.slots.length + '</b></span>';
    this.npcMsgEl.innerHTML = this.msg ? '<span style="color:' + this.msg.color + '">' + this.msg.text + '</span>' : '';
  }

  _say(text, color = '#ffe9a8') { this.msg = { text, color }; this.refresh(); }

  _row(icon, name, sub, right, color, cls = '') {
    return '<div class="srow ' + cls + '"><span class="ic">' + icon + '</span><div class="nm"' + (color ? ' style="color:' + color + '"' : '') + '>' + name + '<small>' + sub + '</small></div>' + right + '</div>';
  }

  _questHTML() {
    const qm = this.quests, list = qm.forNpc(this.npc.id);
    const greet = this.npc.id === 'captain' ? '<div class="hint">Şehrin güvenliği için yardımına ihtiyacımız var, yolcu.</div>' : '';
    if (!list.length) return greet + '<div class="hint">Şu an verecek görevim yok. Seviye atladıkça tekrar gel.</div>' + '<div class="qfoot">Tamamlanan görev: <b>' + qm.doneCount() + ' / ' + qm.defs.length + '</b></div>';
    const order = { ready: 0, none: 1, active: 2, locked: 3 };
    list.sort((a, b) => order[a.s] - order[b.s]);
    return greet + list.map(({ q, s }) => {
      let right = '';
      if (s === 'none') right = '<button data-act="qaccept" data-q="' + q.id + '">Kabul Et</button>';
      else if (s === 'ready') right = '<button data-act="qturn" data-q="' + q.id + '">Teslim Et</button>';
      else if (s === 'active') right = '<span class="qs">' + qm.objectiveText(q) + '</span>';
      else right = '<span class="qs lock">' + qm.lockText(q) + '</span>';
      return '<div class="qrow ' + s + '"><div class="qt">' + q.name + '<small> Sv. ' + q.minLevel + '+</small></div>' +
        (s === 'locked' ? '' : '<div class="qd">' + q.desc + '</div><div class="qr">Ödül: ' + qm.rewardText(q) + '</div>') +
        '<div class="qa">' + right + '</div></div>';
    }).join('');
  }

  _ecoHead(cats, mode) {
    const deal = Eco.dealCat(), tax = Math.round(Eco.tax() * 100);
    return '<div class="eco-head">' + cats.map(c => {
      const ix = Eco.index(c), tr = Eco.trend(c), sat = Eco.satMult(c);
      return '<span class="eco-c" data-tip="eco:' + c + '">' + icon(ECO_CAT_ICON[c], 'gold') + ECO_CATS[c] + ' <b class="' + (ix >= 1 ? 'up' : 'dn') + '">%' + Math.round(ix * 100) + (tr > 0 ? ' ▲' : tr < 0 ? ' ▼' : '') + '</b>' +
        (mode === 'sell' && sat < 0.97 ? ' <em class="sat">doygun %' + Math.round(sat * 100) + '</em>' : '') + (c === deal && mode === 'buy' ? ' <em class="deal">Günün indirimi −%20</em>' : '') + '</span>';
    }).join('') + '<span class="eco-tax">' + ZONE.town + ' vergisi %' + tax + (mode === 'buy' ? ' (fiyatlara dahil)' : '') + '</span></div>';
  }

  _buyHTML(kind) {
    let list = shopStock(kind), filt = '';
    const ecoCats = { herb: ['pot', 'scroll'], weapon: ['weapon', 'shield'], armor: ['armor'], acc: ['acc', 'mat'], stable: ['pet', 'pot'] }[kind] || [];
    const lvl = this.p.stats.level;
    const degF = SHOP_DEGREES.map(d => '<button data-f="d:' + d + '" class="' + (this.filter.d === d ? 'on' : '') + '">' + d + '. derece</button>').join('');
    if (kind === 'armor') {
      if (ARMOR_TYPES[this.filter.at].race !== RACE) this.filter.at = RACE === 'eu' ? 'light' : 'protector';
      filt = '<div class="filt">' + raceArmors().map(a => '<button data-f="at:' + a + '" class="' + (this.filter.at === a ? 'on' : '') + '">' + ARMOR_TYPES[a].name + '</button>').join('') + degF + '</div>';
      list = list.filter(b => ITEM_BASES[b].atype === this.filter.at && ITEM_BASES[b].d === this.filter.d);
    } else if (kind === 'weapon') {
      let wt = this.filter.wt || this.inv.weaponType() || raceWeapons()[0];
      if (wt !== 'shield' && WEAPON_TYPES[wt].race !== RACE) wt = raceWeapons()[0];
      filt = '<div class="filt">' + [...raceWeapons(), 'shield'].map(t => '<button data-f="wt:' + t + '" class="' + (wt === t ? 'on' : '') + '">' + (t === 'shield' ? 'Kalkan' : WEAPON_TYPES[t].name) + '</button>').join('') + degF + '</div>';
      list = list.filter(b => b === 'arrow' || ((ITEM_BASES[b].wtype || 'shield') === wt && ITEM_BASES[b].d === this.filter.d));
    } else if (kind === 'acc') {
      filt = '<div class="filt">' + degF + '</div>';
      list = list.filter(b => !ITEM_BASES[b].d || ITEM_BASES[b].d === this.filter.d);
    }
    return this._ecoHead(ecoCats, 'buy') + filt + list.map(base => {
      const b = ITEM_BASES[base], price = buyPrice(base);
      if (isStack(base)) {
        const ns = base === 'arrow' ? [250, 1000] : [1, 10, 50];
        const bad = (b.req || 1) > lvl;
        return this._row(itemIcon(base), b.name, (b.sub || '') + (b.req > 1 ? ' · Sv. ' + b.req : ''),
          '<b class="pr">' + (base === 'arrow' ? '0.5' : price) + ' <i class="coin"></i></b>' + ns.map(n => '<button data-act="buy" data-b="' + base + '" data-n="' + n + '">' + (n === 1 ? 'Al' : 'x' + n) + '</button>').join(''), bad ? '#9a8a6a' : null);
      }
      const n = itemInfo({ base, rarity: 0, plus: 0, blues: [], dur: 99 }), bad = b.req > lvl;
      return this._row(n.icon, n.name, n.typeName + ' · ' + itemStatText(n) + ' · Sv. ' + n.req,
        '<b class="pr">' + price.toLocaleString('tr-TR') + ' <i class="coin"></i></b><button data-act="buy" data-b="' + base + '" data-n="1">Al</button>', bad ? '#9a8a6a' : null);
    }).join('');
  }

  _sellHTML() {
    const cats = [...new Set(this.inv.slots.filter(Boolean).map(it => ecoCat(it.base)).filter(Boolean))];
    const bb = Eco.s ? Eco.s.bb : [];
    const bbHTML = bb.length ? '<h4>Geri al (son satılanlar)</h4>' + bb.map((x, i) => {
      const it = Inventory.dec(x.e); if (!it) return '';
      const n = itemInfo(it);
      return '<div class="srow" data-tip="bb:' + i + '"><span class="ic">' + this._slot(it, '', false) + '</span><div class="nm" style="color:' + n.color + '">' + n.name + (n.stack && it.n > 1 ? ' x' + it.n : '') + '<small>' + (x.z !== ZONE.id ? ZONES[x.z].town + ' · ' : '') + 'satış fiyatına geri alınır</small></div><b class="pr">' + x.p.toLocaleString('tr-TR') + ' <i class="coin"></i></b><button data-act="bb" data-i="' + i + '">Geri Al</button></div>';
    }).join('') : '';
    const rows = this.inv.slots.map((it, i) => {
      if (!it) return '';
      const n = itemInfo(it), conf = this.sellConfirm === it.uid, b = ITEM_BASES[it.base];
      if (b.cat === 'quest') return '';
      return this._row(n.icon, n.name + (n.stack && it.n > 1 ? ' x' + it.n : ''), n.stack ? (n.sub || '') : ((it.rarity ? n.rarityName + ' · ' : '') + n.d + '. derece'),
        '<b class="pr">' + sellPrice(it).toLocaleString('tr-TR') + ' <i class="coin"></i></b><button data-act="sell" data-i="' + i + '" class="' + (conf ? 'warn' : '') + '">' + (conf ? 'Emin misin?' : 'Sat') + '</button>', n.color);
    }).join('');
    return this._ecoHead(cats.length ? cats : ['pot'], 'sell') + (rows || '<div class="hint">Satacak eşyan yok. (Kuşanılı eşyalar satılmaz.)</div>') + bbHTML;
  }

  _repairHTML() {
    const c = this.inv.repairCost();
    const worn = [];
    for (const k in this.inv.equip) { const it = this.inv.equip[k]; if (it && it.dur < maxDur(it)) worn.push(it); }
    return '<div class="hint">Eşyalar savaşta aşınır. Dayanıklılığı 0 olan eşya kırılır ve gücünü kaybeder.</div>' +
      (worn.map(it => { const n = itemInfo(it); return this._row(n.icon, n.name, 'Dayanıklılık ' + n.dur + ' / ' + n.maxDur, '', n.broken ? '#ff8a7a' : n.color); }).join('') || '<div class="hint">Kuşanılı eşyalarının hepsi sağlam.</div>') +
      '<div class="srow"><span class="ic">' + icon('hammer', 'phys') + '</span><div class="nm">Tümünü tamir et<small>Kuşanılı ve envanterdeki tüm ekipman</small></div><b class="pr">' + c.toLocaleString('tr-TR') + ' <i class="coin"></i></b><button data-act="repair"' + (c ? '' : ' disabled') + '>Tamir Et</button></div>';
  }

  _teleHTML() {
    const L = this.p.stats.level;
    return '<div class="hint">' + (IS_DUNGEON ? 'Zindandan çıkabilir ya da başka kata geçebilirsin.' : 'Kervan yollarını aşmak uzun sürer. Ücreti öde, anında diğer şehre geç. Gemi seferleri İskenderiye\'ye gider. Zindanlara giriş ücretsizdir ama seviye ister.') + '</div>' +
      ZONE.tele.map(t => {
        const z = ZONES[t.zone], lock = t.min && L < t.min;
        const kind = t.dungeon ? 'Zindan' : t.ship ? 'Gemi seferi' : z.kind === 'dungeon' ? 'Zindan' : 'Şehir';
        return this._row(icon(t.dungeon || z.kind === 'dungeon' ? 'menu_map' : t.ship ? 'stexp' : 'rev', t.dungeon ? 'bad' : t.ship ? 'cold' : 'lightning'), z.town, kind + ' · ' + (z.lv || '') + (t.min ? ' · en az Sv. ' + t.min : ''),
          (t.cost ? '<b class="pr">' + t.cost.toLocaleString('tr-TR') + ' <i class="coin"></i></b>' : '') + '<button data-act="travel" data-z="' + t.zone + '" data-c="' + t.cost + '" data-min="' + (t.min || 0) + '"' + (lock ? ' class="dis"' : '') + '>' + (t.dungeon ? 'Gir' : t.ship ? 'Bin' : 'Işınlan') + '</button>');
      }).join('');
  }
  _jobHTML() {
    const J = this.jobs, s = this.p.stats;
    let h = '<div class="hint">Silkroad\'un üçgen sistemi: <b style="color:#ffd23a">Tüccar</b> mal taşır, <b style="color:#ff7a6a">Hırsız</b> kervan soyar, <b style="color:#6ab4ff">Avcı</b> kervanları korur. Katılmak için Sv. ' + JOB_MIN_LEVEL + '.</div>';
    if (J.job) {
      const J0 = JOBS[J.job], nx = J.nextExp();
      h += '<div class="mcard"><div class="mi">' + icon(J.job === 'trader' ? 'camel' : J.job === 'hunter' ? 'shield' : 'blade', J.job === 'thief' ? 'bad' : 'gold') + '</div><div class="mt"><b style="color:' + J0.color + '">' + J0.name + ' · Meslek Sv. ' + J.level() + '</b><small>' + J0.desc + '</small>' +
        '<div class="bar exp" style="margin-top:4px"><div class="fill" style="width:' + (nx ? (J.jexp / nx * 100) : 100) + '%"></div><span>' + J.jexp.toLocaleString('tr-TR') + (nx ? ' / ' + nx.toLocaleString('tr-TR') : ' (en üst)') + '</span></div></div></div>';
      if (J.job === 'hunter') h += this._row(icon('shield', 'cold'), 'Kervan Koruma', 'Kervanı yolun sonuna kadar hırsızlara karşı koru. Ödül: altın + Avcı EXP', J.mission ? '<span class="qs">' + J.status() + '</span>' : '<button data-act="escort">Başlat</button>');
      if (J.job === 'thief') h += this._row(icon('blade', 'bad'), 'Kervan Soygunu', 'Yoldaki tüccar kervanının devesini düşür, Çalıntı Malı simsara sat (' + ZONE.npc.den + ', ' + ZONE.ruinName + ')', J.mission ? '<span class="qs">' + J.status() + '</span>' : '<button data-act="raid">Başlat</button>');
      if (J.job === 'trader') h += this._row(icon('camel', 'pet'), 'Ticaret', 'Ahır\'dan Kervan Devesi Düdüğü al, Ticaret Ustası\'ndan mal yükle, başka şehirde sat. Teleport ve dönüş parşömeni kullanılamaz; yolun ucundaki kapılardan yürü.', '<span class="qs">Yük ' + J.cargoCount() + '/' + J.capacity() + '</span>');
      h += '<div class="btns"><button data-act="leave" class="warn">Loncadan Ayrıl</button></div>';
    }
    h += Object.keys(JOBS).filter(k => k !== J.job).map(k => this._row(icon(k === 'trader' ? 'camel' : k === 'hunter' ? 'shield' : 'blade', k === 'thief' ? 'bad' : 'gold'), JOBS[k].name + ' Loncası', JOBS[k].desc, '<button data-act="join" data-j="' + k + '"' + (s.level < JOB_MIN_LEVEL ? ' class="dis"' : '') + '>Katıl</button>', JOBS[k].color)).join('');
    return h;
  }
  _tradeHTML() {
    const J = this.jobs, g = J.localGood();
    let h = '<div class="hint">' + ZONE.town + ' malı: <b>' + g.name + '</b>. Uzak şehirlerde daha pahalı satılır. Fiyatlar saatlik değişir.</div>';
    h += '<div class="seg">' + ZONE_ORDER.map(z => { const pz = J.price(g.base, z); return '<span class="tag">' + ZONES[z].name + ': <b>' + pz + '</b></span>'; }).join('') + '</div>';
    if (J.job !== 'trader') return h + '<div class="hint">Mal almak için Meslek Loncası\'nda <b>Tüccar</b> olmalısın.</div>';
    h += this._row(icon('tg', 'gold'), g.name + ' <small>' + J.price(g.base) + ' <i class="coin"></i> / adet</small>', 'Kervan: ' + J.cargoCount() + ' / ' + J.capacity() + (J.transport ? '' : ' — önce deveyi çağır'),
      [5, 10, 'max'].map(n => '<button data-act="tbuy" data-n="' + n + '">' + (n === 'max' ? 'Doldur' : 'x' + n) + '</button>').join(''));
    const lines = Object.keys(J.cargo).map(b => { const o = TRADE_GOODS[goodOrigin(b)]; return this._row(icon('tg', 'gold'), o.name + ' x' + J.cargo[b], 'Buradaki fiyat: ' + J.price(b) + ' altın', ''); }).join('');
    if (lines) {
      let rev = 0; for (const b in J.cargo) rev += J.price(b) * J.cargo[b];
      h += '<h4>Kervandaki mallar</h4>' + lines + '<div class="srow"><span class="ic">' + icon('gold', 'gold') + '</span><div class="nm">Hepsini sat<small>Maliyet ' + J.cargoCost.toLocaleString('tr-TR') + ' → Gelir ' + rev.toLocaleString('tr-TR') + '</small></div><button data-act="tsell">Sat</button></div>';
    }
    if (J.transport && !J.cargoCount()) h += '<div class="btns"><button data-act="tdismiss">Deveyi Gönder</button></div>';
    return h;
  }
  _denHTML() {
    const n = this.inv.count('sg'), L = this.p.stats.level;
    return '<div class="hint">"Kervanlardan ne getirdiysen alırım, soru sormam."</div>' +
      this._row(itemIcon('sg'), 'Çalıntı Mal x' + n, 'Adet başı ~' + (60 + 8 * L) + ' altın + Hırsız EXP', '<button data-act="sgsell"' + (n ? '' : ' disabled') + '>Sat</button>');
  }
  _uniqueHTML() {
    const st = this.mm ? this.mm.uniqueStatus() : [];
    return '<div class="hint">Bölgenin efsanevi canavarları. Ortaya çıktıklarında bütün bölgeye duyurulur. Çok güçlüdürler; iyi hazırlan!</div>' +
      st.map(u => this._row(icon('crown', u.live ? 'bad' : 'pass'), u.name + ' <small>Sv. ' + u.level + '</small>', u.region, '<span class="qs">' + (u.live ? 'ŞU AN ORTADA!' : '~' + u.mins + ' dk sonra') + '</span>', u.live ? '#ff8ae8' : null)).join('');
  }

  _storageHTML() {
    const inv = this.inv;
    return '<div class="hint">Eşyaya dokun: envanterden depoya / depodan envantere taşınır. Depo tüm karakterlerinde ortaktır.</div>' +
      '<div class="st-wrap"><div><h4>Envanter</h4><div class="st-grid">' + inv.slots.map((it, i) => this._slot(it, 'data-act="dep" data-i="' + i + '"', false, '')).join('') + '</div></div>' +
      '<div><h4>Depo (' + (inv.storage.length - inv.freeCount(inv.storage)) + '/' + inv.storage.length + ')</h4><div class="st-grid">' + inv.storage.map((it, i) => this._slot(it, 'data-act="wd" data-i="' + i + '"', false, '')).join('') + '</div></div></div>';
  }

  // ---------- Emanet Pazarı ----------
  _marketHTML(t) {
    const s = this.p.stats, E = Eco, mk = this.mk = this.mk || { sel: -1, pct: 1 };
    if (t === 'browse') {
      const cat = this.filter.mc || 'all', offers = E.offers();
      const filt = '<div class="filt">' + [['all', 'Hepsi'], ...Object.keys(ECO_CATS).filter(c => offers.some(o => o.cat === c)).map(c => [c, ECO_CATS[c]])].map(([k, n]) => '<button data-f="mc:' + k + '" class="' + (cat === k ? 'on' : '') + '">' + n + '</button>').join('') + '</div>';
      const list = offers.filter(o => !o.sold && (cat === 'all' || o.cat === cat)).sort((a, b) => (a.p / a.v) - (b.p / b.v));
      const mins = 60 - new Date().getMinutes();
      return '<div class="hint">Diğer tüccarların ilanları. NPC dükkânlarında olmayan mühürlü, +\'lı ve mavi statlı eşyalar burada çıkar. İlanlar her saat yenilenir (~' + mins + ' dk).</div>' + filt +
        (list.map(o => {
          const n = itemInfo(o.it), r = o.p / o.v, tag = r < 0.85 ? '<em class="deal">Fırsat</em>' : r > 1.2 ? '<em class="sat">Pahalı</em>' : '';
          return '<div class="srow" data-tip="mo:' + o.id + '"><span class="ic">' + this._slot(o.it, '', false) + '</span><div class="nm" style="color:' + n.color + '">' + n.name + (n.stack && o.it.n > 1 ? ' x' + o.it.n : '') + ' ' + tag +
            '<small>' + o.seller + ' · adil değer ~' + Math.round(o.v).toLocaleString('tr-TR') + (n.stack ? '' : ' · Sv. ' + n.req) + '</small></div><b class="pr">' + o.p.toLocaleString('tr-TR') + ' <i class="coin"></i></b><button data-act="mkbuy" data-i="' + o.id + '"' + (s.gold < o.p ? ' class="dis"' : '') + '>Al</button></div>';
        }).join('') || '<div class="hint">Bu kategoride ilan kalmadı.</div>');
    }
    if (t === 'mine') {
      E._settle();
      const L = E.s.list, ready = L.filter(x => x.st !== 'on');
      const soldSum = L.filter(x => x.st === 'sold').reduce((a, x) => a + Math.round(x.p * (1 - E.COMMISSION)), 0);
      let h = '<div class="hint">İlan ücreti %2 (en az 10), satışta %5 komisyon. İlanlar 24 saat durur; oyun kapalıyken de satılabilir. Adil değerin altında fiyat = hızlı satış.</div>';
      if (ready.length) h += '<div class="srow hl"><span class="ic">' + icon('coinpile', 'gold') + '</span><div class="nm">Tahsil et<small>' + L.filter(x => x.st === 'sold').length + ' satış · ' + L.filter(x => x.st === 'exp').length + ' süresi dolan</small></div><b class="pr">' + soldSum.toLocaleString('tr-TR') + ' <i class="coin"></i></b><button data-act="mkcollect">Tahsil Et</button></div>';
      h += '<h4>İlanlarım (' + L.length + ' / ' + E.LIST_MAX + ')</h4>' + (L.map((x, i) => {
        const it = Inventory.dec(x.e); if (!it) return '';
        const n = itemInfo(it), left = Math.max(0, E.EXPIRE - (Date.now() - x.t));
        const st = x.st === 'sold' ? '<span class="qs ok">Satıldı · ' + (x.buyer || '') + '</span>' : x.st === 'exp' ? '<span class="qs lock">Süresi doldu</span>' : '<span class="qs">' + Math.floor(left / 3.6e6) + ' sa ' + Math.floor(left % 3.6e6 / 6e4) + ' dk</span><button data-act="mkcancel" data-i="' + i + '" class="small">Geri çek</button>';
        return '<div class="srow" data-tip="ml:' + i + '"><span class="ic">' + this._slot(it, '', false) + '</span><div class="nm" style="color:' + n.color + '">' + n.name + (n.stack && it.n > 1 ? ' x' + it.n : '') + '<small>Fiyat ' + x.p.toLocaleString('tr-TR') + ' · adil ~' + Math.round(x.v).toLocaleString('tr-TR') + '</small></div>' + st + '</div>';
      }).join('') || '<div class="hint">Aktif ilanın yok.</div>');
      // ilan ver
      h += '<h4>İlana koy</h4>';
      const grid = '<div class="st-grid mk-grid">' + this.inv.slots.map((it, i) => {
        const ok = it && ecoCat(it.base) && !ITEM_BASES[it.base].keep;
        return ok ? this._slot(it, 'data-act="mksel" data-i="' + i + '"', mk.sel === i) : '<div class="islot empty"></div>';
      }).join('') + '</div>';
      const it = this.inv.slots[mk.sel];
      if (!(it && ecoCat(it.base))) h += '<div class="hint">Satmak istediğin eşyaya dokun.</div>';
      if (it && ecoCat(it.base)) {
        const v = E.marketValue(it) * (it.n || 1), price = Math.max(1, Math.round(v * mk.pct)), fee = Math.max(10, Math.round(price * E.FEE));
        const f = Math.pow(clamp(1.65 - mk.pct, 0.01, 1), 2), eta = Math.round(1 / (0.05 * f));
        h += '<div class="mk-sel"><div class="nm" style="color:' + itemInfo(it).color + '">' + itemInfo(it).name + (it.n > 1 ? ' x' + it.n : '') + '<small>Adil değer ~' + v.toLocaleString('tr-TR') + ' · NPC\'ye satış ' + sellPrice(it).toLocaleString('tr-TR') + '</small></div>' +
          '<div class="mk-pct">' + [0.7, 0.85, 1, 1.15, 1.3, 1.5].map(p => '<button data-act="mkpct" data-p="' + p + '" class="' + (Math.abs(mk.pct - p) < 0.001 ? 'on' : '') + '">%' + Math.round(p * 100) + '</button>').join('') + '</div>' +
          '<div class="mk-sum">Fiyat <b>' + price.toLocaleString('tr-TR') + '</b> · ücret ' + fee.toLocaleString('tr-TR') + ' · eline geçecek ~' + Math.round(price * (1 - E.COMMISSION)).toLocaleString('tr-TR') + ' · tahmini satış ' + (eta > 600 ? 'çok yavaş' : eta >= 60 ? '~' + Math.round(eta / 60) + ' sa' : '~' + eta + ' dk') + '</div>' +
          '<button data-act="mklist"' + (s.gold < fee ? ' class="dis"' : '') + '>İlana Koy</button></div>';
      }
      return h + grid;
    }
    if (t === 'prices') {
      const deal = E.dealCat();
      let h = '<div class="hint">Talep endeksi her saat değişir. Yüksekken sat, düşükken al. Şehirler arası farklarla ticaret yapabilirsin.</div><table class="ptable"><tr><th></th><th>Kategori</th><th>' + ZONE.name + '</th><th>12 saat</th>' + ecoTowns().map(z => '<th>' + ZONES[z].name + '</th>').join('') + '<th>NPC alım</th></tr>';
      for (const c of Object.keys(ECO_CATS)) {
        const ix = E.index(c), tr = E.trend(c);
        h += '<tr><td>' + icon(ECO_CAT_ICON[c], 'gold') + '</td><td>' + ECO_CATS[c] + (c === deal ? ' <em class="deal">−%20</em>' : '') + '</td><td class="' + (ix >= 1 ? 'up' : 'dn') + '">%' + Math.round(ix * 100) + (tr > 0 ? ' ▲' : tr < 0 ? ' ▼' : '') + '</td><td>' + ecoSpark(E.history(c)) + '</td>' +
          ecoTowns().map(z => { const o = E.index(c, z); return '<td class="' + (o >= 1 ? 'up' : 'dn') + '">%' + Math.round(o * 100) + '</td>'; }).join('') + '<td>%' + Math.round(E.satMult(c) * 100) + '</td></tr>';
      }
      return h + '</table><div class="eco-tax">' + ZONE.town + ' vergisi %' + Math.round(E.tax() * 100) + ' · ' + ecoTowns().map(z => ZONES[z].name + ' %' + Math.round(TOWN_TAX[z] * 100)).join(' · ') + '</div>';
    }
    if (t === 'ledger') {
      const L = E.s.led, rows = (o, names, cls) => Object.keys(names).filter(k => o[k]).map(k => '<tr><td>' + names[k] + '</td><td class="' + cls + '">' + Math.round(o[k]).toLocaleString('tr-TR') + '</td></tr>').join('');
      const ti = Object.values(L.inc).reduce((a, b) => a + b, 0), te = Object.keys(L.exp).filter(k => k !== 'tax').reduce((a, k) => a + L.exp[k], 0);
      const mins = Math.round((Date.now() - E.session.t0) / 6e4), ph = E.perHour();
      return '<div class="led-top"><div><small>Bu oturum</small><b>' + mins + ' dk</b></div><div><small>Net</small><b class="' + (E.session.inc - E.session.exp >= 0 ? 'up' : 'dn') + '">' + Math.round(E.session.inc - E.session.exp).toLocaleString('tr-TR') + '</b></div><div><small>Saatlik</small><b class="' + (ph >= 0 ? 'up' : 'dn') + '">' + (mins >= 10 ? ph.toLocaleString('tr-TR') : '—') + '</b></div><div><small>Kasa</small><b>' + s.gold.toLocaleString('tr-TR') + '</b></div></div>' +
        '<table class="ptable led"><tr><th>Gelir</th><th></th></tr>' + (rows(L.inc, LEDGER_NAMES.inc, 'up') || '<tr><td colspan="2">—</td></tr>') + '<tr class="tot"><td>Toplam</td><td class="up">' + Math.round(ti).toLocaleString('tr-TR') + '</td></tr>' +
        '<tr><th>Gider</th><th></th></tr>' + (rows(L.exp, LEDGER_NAMES.exp, 'dn') || '<tr><td colspan="2">—</td></tr>') + '<tr class="tot"><td>Toplam</td><td class="dn">' + Math.round(te).toLocaleString('tr-TR') + '</td></tr></table>';
    }
    return '';
  }

  _marketAct(act, btn) {
    const s = this.p.stats, inv = this.inv, E = Eco, mk = this.mk = this.mk || { sel: -1, pct: 1 };
    if (act === 'mkbuy') {
      const r = E.buyOffer(+btn.dataset.i, inv, s);
      SFX.play(r.ok ? 'coin' : 'error'); this._say(r.msg, r.ok ? '#a8f0a0' : '#ff8a7a');
    } else if (act === 'mksel') { mk.sel = mk.sel === +btn.dataset.i ? -1 : +btn.dataset.i; mk.pct = 1; SFX.play('tab'); this.refreshNpc(); }
    else if (act === 'mkpct') { mk.pct = +btn.dataset.p; SFX.play('tab'); this.refreshNpc(); }
    else if (act === 'mklist') {
      const it = inv.slots[mk.sel]; if (!it) return;
      const price = Math.max(1, Math.round(E.marketValue(it) * (it.n || 1) * mk.pct)), fee = Math.max(10, Math.round(price * E.FEE));
      if (s.gold < fee) { SFX.play('error'); return this._say('İlan ücreti için altının yetmiyor.', '#ff8a7a'); }
      const r = E.listItem(it, price);
      if (!r.ok) { SFX.play('error'); return this._say(r.msg, '#ff8a7a'); }
      s.gold -= fee; inv.remove(mk.sel); mk.sel = -1; SFX.play('coin');
      this._say('İlan verildi: ' + price.toLocaleString('tr-TR') + ' altın (ücret ' + fee + ').', '#a8f0a0');
    } else if (act === 'mkcancel') {
      if (!E.cancel(+btn.dataset.i, inv)) { SFX.play('error'); return this._say('Envanterde yer yok.', '#ff8a7a'); }
      SFX.play('tab'); this._say('İlan geri çekildi (ücret iade edilmez).', '#ffe9a8');
    } else if (act === 'mkcollect') {
      const r = E.collectAll(inv, s);
      SFX.play('coin');
      this._say((r.gold ? '+' + r.gold.toLocaleString('tr-TR') + ' altın tahsil edildi. ' : '') + (r.items ? r.items + ' eşya geri alındı. ' : '') + (r.full ? 'Envanter dolu, bazı eşyalar bekliyor.' : ''), '#a8f0a0');
    }
  }

  _npcAct(btn) {
    const act = btn.dataset.act, s = this.p.stats, inv = this.inv;
    if (act === 'buy') {
      const base = btn.dataset.b, n = +btn.dataset.n, b = ITEM_BASES[base];
      const cost = base === 'arrow' ? Math.ceil(n * 0.5) : buyPrice(base) * n;
      if (s.gold < cost) { SFX.play('error'); return this._say('Yeterli altının yok.', '#ff8a7a'); }
      if (!inv.canAdd(base, n)) { SFX.play('error'); return this._say('Envanterde yer yok.', '#ff8a7a'); }
      s.gold -= cost;
      inv.add(isStack(base) ? makeStack(base, n) : makeItem(base));
      Eco.exp('buy', cost); Eco.exp('tax', Eco.taxPart(cost));
      SFX.play('coin');
      this.hb.upgradePots(s.level);
      this._say(b.name + (n > 1 ? ' x' + n : '') + ' satın alındı. -' + cost.toLocaleString('tr-TR') + ' altın', '#a8f0a0');
    } else if (act === 'qaccept' || act === 'qturn') {
      const r = act === 'qaccept' ? this.quests.accept(btn.dataset.q) : this.quests.turnIn(btn.dataset.q);
      this._say(r.msg, r.ok ? '#a8f0a0' : '#ff8a7a');
    } else if (act === 'sell') {
      const i = +btn.dataset.i, it = inv.slots[i];
      if (!it) return;
      if ((it.rarity >= 1 || (it.plus || 0) >= 3 || it.base === 'astral') && this.sellConfirm !== it.uid) { this.sellConfirm = it.uid; return this.refreshNpc(); }
      const price = sellPrice(it), name = itemInfo(it).name;
      s.gold += price; this.sellConfirm = null; Eco.onSell(it, price); inv.remove(i); SFX.play('coin');
      this._say(name + ' satıldı. +' + price.toLocaleString('tr-TR') + ' altın', '#a8f0a0');
    } else if (act === 'repair') {
      const c = inv.repairCost();
      if (s.gold < c) { SFX.play('error'); return this._say('Yeterli altının yok.', '#ff8a7a'); }
      s.gold -= c; inv.repairAll(); Eco.exp('repair', c); SFX.play('upgrade');
      this._say('Tüm eşyalar tamir edildi.', '#a8f0a0');
    } else if (['join', 'leave', 'escort', 'raid', 'tbuy', 'tsell', 'tdismiss', 'sgsell'].includes(act)) {
      const J = this.jobs;
      let r;
      if (act === 'join') r = J.join(btn.dataset.j);
      else if (act === 'leave') r = J.leave();
      else if (act === 'escort') r = J.startEscort();
      else if (act === 'raid') r = J.startRaid();
      else if (act === 'tbuy') r = J.buy(btn.dataset.n === 'max' ? 999 : +btn.dataset.n);
      else if (act === 'tsell') r = J.sellAll();
      else if (act === 'sgsell') r = J.sellStolen();
      else { J.dismissTransport(); r = { ok: true, msg: 'Deve ahıra döndü.' }; }
      SFX.play(r.ok ? (act === 'tsell' || act === 'sgsell' ? 'coin' : 'quest') : 'error');
      if (r.msg) this._say(r.msg, r.ok ? '#a8f0a0' : '#ff8a7a');
    } else if (act === 'travel') {
      const c = +btn.dataset.c;
      if (+btn.dataset.min > s.level) { SFX.play('error'); return this._say('Bu yer için en az ' + btn.dataset.min + '. seviye gerekli.', '#ff8a7a'); }
      if (s.gold < c) { SFX.play('error'); return this._say('Yeterli altının yok.', '#ff8a7a'); }
      if (this.p.dead) return;
      s.gold -= c; Eco.exp('travel', c); SFX.play('cast');
      if (this.onTravel) this.onTravel(btn.dataset.z, 'T');
    } else if (act === 'bb') {
      const x = Eco.s.bb[+btn.dataset.i]; if (!x) return;
      if (s.gold < x.p) { SFX.play('error'); return this._say('Yeterli altının yok.', '#ff8a7a'); }
      const it = Inventory.dec(x.e); if (!it || !inv.add(it)) { SFX.play('error'); return this._say('Envanterde yer yok.', '#ff8a7a'); }
      s.gold -= x.p; Eco.s.bb.splice(+btn.dataset.i, 1); Eco.inc('sell', -x.p); Eco.save(); SFX.play('coin');
      this._say(itemInfo(it).name + ' geri alındı.', '#a8f0a0');
    } else if (act && act.startsWith('mk')) {
      this._marketAct(act, btn);
    } else if (act === 'dep' || act === 'wd') {
      const i = +btn.dataset.i;
      const ok = act === 'dep' ? inv.deposit(i) : inv.withdraw(i);
      if (!ok && (act === 'dep' ? inv.slots[i] : inv.storage[i])) { SFX.play('error'); this._say(act === 'dep' ? 'Depo dolu.' : 'Envanter dolu.', '#ff8a7a'); }
      else SFX.play('tab');
    }
  }

  update() {
    if (!this.npc) return;
    const d = Math.hypot(this.p.pos.x - this.npc.x, this.p.pos.z - this.npc.z);
    if (d > NPC_RANGE + 6 || this.p.dead) this.closeNpc();
  }
}

// İpek Yolu Dünya Haritası (M): 1) Bölge Haritası (tıkla-yürü, alt bölgeler, NPC, Unique, sandık/sunak, kervan)
// 2) İpek Yolu Kıta Haritası (Jangan'dan Konstantinopolis ve İskenderiye'ye tüm şehirler, zindanlar ve kervan yolları)

const CONTINENT_NODES = [
  // Ana Şehirler (Doğu -> Batı / Güney)
  { id: 'jangan',         x: 405, y: 215, kind: 'town', name: 'Jangan',           lv: '1–20',    race: 'Çin Başkenti',     uniques: ['Kaplan Kız (Sv.20)'], desc: 'Tang Hanedanı başkenti. Doğu Kapısı, Mangyang Ovası, Bijak Vahası, Yeoha Ormanı ve Kaplan Dağı.' },
  { id: 'donwhang',       x: 325, y: 200, kind: 'town', name: 'Donwhang',         lv: '21–40',   race: 'Kervan Kavşağı',   uniques: ['Uruchi (Sv.40)'],     desc: 'Buda mağaraları ve kervan vahası. Çakji Vadisi, Tarım Havzası, Kara Soyguncu İni ve Toprak Hayalet Kanyonu.' },
  { id: 'hotan',          x: 245, y: 235, kind: 'town', name: 'Hotan',            lv: '41–76',   race: 'Taklamakan Sarayı',uniques: ['Isyutaru (Sv.60)', 'Lord Yarkan (Sv.80)'], desc: 'Yeşim taşı krallığı. Karakoram Buzulu, Niya Kalıntıları ve Taklamakan Çölü.' },
  { id: 'shambhala',      x: 265, y: 118, kind: 'town', name: 'Şambala',          lv: '130–140', race: 'Tanrıların Diyarı',uniques: ['Buz Kraliçesi (Sv.136)', 'Alev Lordu (Sv.140)'], desc: 'Kuzey zirvelerinin ötesindeki gizli kutsal diyar. Donmuş Kıyı ve Kor Vadisi.' },
  { id: 'samarkand',      x: 170, y: 185, kind: 'town', name: 'Semerkant',        lv: '75–100',  race: 'Orta Asya Tacı',   uniques: ['Demon Shaitan (Sv.90)', 'Roc (Sv.100)'], desc: 'Mavi kubbeli İpek Yolu kavşağı ve efsanevi Roc Dağı (Kalp, Pençe ve Kanat Zirveleri).' },
  { id: 'asiaminor',      x: 105, y: 195, kind: 'town', name: 'Küçük Asya',       lv: '25–55',   race: 'Anadolu Geçidi',   uniques: ['Kaptan Ivy (Sv.30)'], desc: 'Kleopatra Kapısı, antik Roma amfitiyatrosu, Kaptan Ivy Koyu ve Şeytan Kulesi.' },
  { id: 'constantinople', x: 52,  y: 145, kind: 'town', name: 'Konstantinopolis', lv: '1–30',    race: 'Avrupa Başkenti',  uniques: ['Cerberus (Sv.24)'],   desc: 'Doğu Roma başkenti. Desperado Tepesi, Alacakaranlık Ormanı ve Tanrılar Bahçesi.' },
  { id: 'alexandria',     x: 72,  y: 310, kind: 'town', name: 'İskenderiye',      lv: '100–125', race: 'Firavun Limanı',   uniques: ['Sfenks (Sv.118)'],    desc: 'Antik Fener ve Nil Deltası. Fırtına ve Bulut Çölü ile Krallar Vadisi.' },

  // Zindanlar (7 Zindan)
  { id: 'tomb1',          x: 422, y: 135, kind: 'dungeon', parent: 'jangan',     name: 'Qin-Shi Mezarı B1', lv: '85–95',   uniques: [], desc: 'İmparator Qin-Shi\'nin Toprak Asker ordusuyla korunan yeraltı anıt mezarı.' },
  { id: 'tomb2',          x: 422, y: 82,  kind: 'dungeon', parent: 'tomb1',      name: 'Qin-Shi Mezarı B2', lv: '95–105',  uniques: ['Medusa (Sv.105)'], desc: 'Mezarın en derin yılanlı salonu. Gorgon kraliçesi BeakYung / Medusa burada yaşar.' },
  { id: 'cave',           x: 335, y: 132, kind: 'dungeon', parent: 'donwhang',   name: 'Donwhang Mağarası', lv: '32–42',   uniques: ['Şeytan At (Sv.42)'], desc: 'Bin Buda kayalıklarının altındaki yeraltı tünelleri ve Mağara Böcekleri.' },
  { id: 'holywater',      x: 135, y: 345, kind: 'dungeon', parent: 'alexandria', name: 'Kutsal Su Tapınağı',lv: '110–120', uniques: ['Seth (Sv.120)'], desc: 'İskenderiye yeraltı sarnıcı. Kaos tanrısı Seth kutsal suları zehirliyor.' },
  { id: 'jupiter',        x: 45,  y: 375, kind: 'dungeon', parent: 'alexandria', name: 'Jüpiter Tapınağı',  lv: '120–130', uniques: ['Jüpiter (Sv.130)'], desc: 'Mermer sütunlu baş tanrı tapınağı ve Jüpiter\'in yıldırım tahtı.' },
  { id: 'icetemple',      x: 205, y: 65,  kind: 'dungeon', parent: 'shambhala',  name: 'Buz Tapınağı',      lv: '132–138', uniques: ['Buz Kraliçesi (Sv.136)'], desc: 'Şambala\'nın ebedi buzullarla kaplı kristal tapınağı.' },
  { id: 'firetemple',     x: 325, y: 65,  kind: 'dungeon', parent: 'shambhala',  name: 'Ateş Tapınağı',     lv: '135–140', uniques: ['Alev Lordu (Sv.140)'], desc: 'Yanardağ kalderasındaki lav tapınağı; en üst seviye boss Alev Lordu.' },

  // Unutulmuş Dünya (Forgotten World) Boyut Sütunları
  { id: 'fw_togui',       x: 372, y: 295, kind: 'fw', parent: 'jangan',    name: 'FGW: Togui Köyü ★',      lv: '35–70',  uniques: ['Yaşlı Togui (Sv.60)'],   desc: 'Unutulmuş Dünya (1★): 8 tılsım kitabını tamamlayana 8. Derece Seal of Sun silah!' },
  { id: 'fw_flame',       x: 235, y: 328, kind: 'fw', parent: 'hotan',     name: 'FGW: Alev Dağı ★★',       lv: '71–90',  uniques: ['Ateş Boğası (Sv.88)'],  desc: 'Unutulmuş Dünya (2★): 8 tılsım kitabını tamamlayana 9. Derece Seal of Sun silah!' },
  { id: 'fw_ship',        x: 145, y: 268, kind: 'fw', parent: 'asiaminor', name: 'FGW: Batık Gemi ★★★',     lv: '91–110', uniques: ['Hayalet Amiral (Sv.108)'],desc: 'Unutulmuş Dünya (3★): Hınç Denizi\'nin 8 tılsımını toplayana 11. Derece Seal of Nova silah!' }
];

const CARAVAN_LINKS = [
  ['jangan', 'donwhang'],
  ['donwhang', 'hotan'],
  ['hotan', 'samarkand'],
  ['samarkand', 'asiaminor'],
  ['asiaminor', 'constantinople'],
  ['asiaminor', 'alexandria'],
  ['hotan', 'shambhala']
];

class WorldMap {
  constructor(player, npcs, monsters, quests) {
    this.p = player; this.npcs = npcs; this.monsters = monsters; this.quests = quests;
    this.el = document.getElementById('wmap');
    this.cv = document.getElementById('wmap-canvas');
    this.ctx = this.cv.getContext('2d');
    this.tabsEl = document.getElementById('wmap-tabs');
    this.infoEl = document.getElementById('wmap-info');
    this.open = false;
    this.mode = 'zone'; // 'zone' | 'continent'
    this.selectedNode = null;
    this.hoverPos = null;
    this.el.querySelector('.x').addEventListener('click', () => this.toggle(false));
    this._bindEvents();
    this._renderTabs();
  }

  _renderTabs() {
    if (!this.tabsEl) return;
    this.tabsEl.innerHTML = [
      ['zone', '📍 Bölge Haritası'],
      ['continent', '🗺️ İpek Yolu Kıta Haritası']
    ].map(([id, label]) => `<button class="${this.mode === id ? 'on' : ''}" data-m="${id}">${label}</button>`).join('');
    this.tabsEl.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => {
        this.mode = b.dataset.m;
        this._renderTabs();
        this.draw();
      });
    });
  }

  _bindEvents() {
    const getCanvasPos = (e) => {
      const rect = this.cv.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: (clientX - rect.left) * (this.cv.width / rect.width),
        y: (clientY - rect.top) * (this.cv.height / rect.height)
      };
    };

    this.cv.addEventListener('mousemove', (e) => {
      if (!this.open) return;
      this.hoverPos = getCanvasPos(e);
      if (this.mode === 'zone') {
        const w = this.cv.width, h = this.cv.height, cx = w / 2, cy = h / 2, half = CONFIG.worldSize / 2;
        const sc = (Math.min(w, h) / 2 - 14) / half;
        const wx = Math.round((this.hoverPos.x - cx) / sc);
        const wz = Math.round((this.hoverPos.y - cy) / sc);
        const reg = typeof regionAt === 'function' ? regionAt(wx, wz) : ZONE.name;
        if (this.infoEl) {
          this.infoEl.innerHTML = `<b>${reg}</b> · Koordinat: <b>X:${wx}, Z:${wz}</b> · <span style="color:#ffd26a">Sol Tık: Oraya Yürü</span>`;
        }
      }
    });

    this.cv.addEventListener('click', (e) => {
      if (!this.open) return;
      const pt = getCanvasPos(e);
      if (this.mode === 'zone') {
        const w = this.cv.width, h = this.cv.height, cx = w / 2, cy = h / 2, half = CONFIG.worldSize / 2;
        const sc = (Math.min(w, h) / 2 - 14) / half;
        const wx = Math.max(-half + 8, Math.min(half - 8, (pt.x - cx) / sc));
        const wz = Math.max(-half + 8, Math.min(half - 8, (pt.y - cy) / sc));
        if (this.p && !this.p.dead) {
          this.p.setDestination(wx, wz);
          if (typeof SFX !== 'undefined') SFX.play('click');
          if (this.infoEl) {
            const reg = typeof regionAt === 'function' ? regionAt(wx, wz) : ZONE.name;
            this.infoEl.innerHTML = `🧭 Hedef belirlendi: <b>${reg}</b> (X:${Math.round(wx)}, Z:${Math.round(wz)}) — Karakter yürümeye başladı.`;
          }
          this.draw();
        }
      } else {
        // Kıta haritasında düğüm seçimi
        let hit = null, best = 24;
        for (const n of CONTINENT_NODES) {
          const d = Math.hypot(pt.x - n.x, pt.y - n.y);
          if (d < best) { best = d; hit = n; }
        }
        if (hit) {
          this.selectedNode = hit;
          if (typeof SFX !== 'undefined') SFX.play('click');
          this._updateContinentInfo(hit);
          this.draw();
        }
      }
    });
  }

  _updateContinentInfo(n) {
    if (!this.infoEl || !n) return;
    let tradeHtml = '';
    if (n.kind === 'town' && typeof TRADE_GOODS !== 'undefined' && TRADE_GOODS[n.id]) {
      const g = TRADE_GOODS[n.id];
      const hot = typeof Eco !== 'undefined' && Eco.hot === n.id ? ' <b style="color:#ff9a4a">🔥 KITLIK (%160 KÂR)</b>' : '';
      tradeHtml = `<br><span style="color:#8ae89a">🐪 Özel Kervan Malı: <b>${g.name}</b> (${g.price} Altın)${hot}</span>`;
    }
    const uStr = n.uniques && n.uniques.length ? ` · 👑 Unique: <b>${n.uniques.join(', ')}</b>` : '';
    const here = n.id === CUR_ZONE_ID ? ' <span style="color:#5ef29a">[Şu An Buradasın]</span>' : ' <span style="color:#9ec8ff">(Şehir Işınlayıcısından gidilir)</span>';
    this.infoEl.innerHTML = `<b>${n.name}</b> (Sv. ${n.lv})${here}${uStr}<br><span style="color:#cbb994">${n.desc}</span>${tradeHtml}`;
  }

  toggle(force) {
    this.open = force !== undefined ? force : !this.open;
    this.el.classList.toggle('hidden', !this.open);
    if (this.open) {
      this._renderTabs();
      if (this.mode === 'continent') {
        const cur = CONTINENT_NODES.find(n => n.id === CUR_ZONE_ID) || CONTINENT_NODES[0];
        this.selectedNode = cur;
        this._updateContinentInfo(cur);
      }
      this.draw();
    }
  }

  draw() {
    if (this.mode === 'continent') {
      this._drawContinent();
      return;
    }
    this._drawZone();
  }

  _drawZone() {
    const ctx = this.ctx, w = this.cv.width, h = this.cv.height, cx = w / 2, cy = h / 2, half = CONFIG.worldSize / 2;
    const sc = (Math.min(w, h) / 2 - 14) / half;
    const toX = x => cx + x * sc, toY = z => cy + z * sc;

    // Arka plan: bölge zemin rengi + parşömen dokusu
    const bgHex = '#' + (ZONE.col && ZONE.col.sand ? ZONE.col.sand : 0x3a2e1c).toString(16).padStart(6, '0');
    ctx.fillStyle = bgHex;
    ctx.fillRect(0, 0, w, h);
    const rg = ctx.createRadialGradient(cx, cy, 40, cx, cy, w * 0.52);
    rg.addColorStop(0, 'rgba(255,235,190,0.08)');
    rg.addColorStop(0.75, 'rgba(20,14,8,0.22)');
    rg.addColorStop(1, 'rgba(8,6,4,0.65)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, w, h);

    if (!IS_DUNGEON) {
      // Topografik bölge halkaları
      ctx.strokeStyle = 'rgba(255,220,150,0.16)';
      ctx.setLineDash([4, 4]);
      for (const r of (ZONE.rings || [])) {
        ctx.beginPath(); ctx.arc(cx, cy, r.r * sc, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.setLineDash([]);

      // Göller / vahalar
      ctx.fillStyle = '#2a6f8f';
      ctx.strokeStyle = '#6ec6e8';
      ctx.lineWidth = 1.5;
      for (const p of (PONDS || [])) {
        const pr = (p.r || POND_RADIUS || 9) * sc;
        ctx.beginPath(); ctx.arc(toX(p.x), toY(p.z), pr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }

      // 4 Ana Kervan Yolu
      ctx.strokeStyle = 'rgba(218, 185, 125, 0.55)';
      ctx.lineWidth = 6 * sc;
      ctx.beginPath();
      ctx.moveTo(cx, toY(-half)); ctx.lineTo(cx, toY(half));
      ctx.moveTo(toX(-half), cy); ctx.lineTo(toX(half), cy);
      ctx.stroke();

      // Harabeler / haydut kaleleri
      ctx.fillStyle = '#8b6f47';
      ctx.strokeStyle = '#ffd27a';
      ctx.lineWidth = 1.2;
      for (const c of (RUINS || [])) {
        const rx = Array.isArray(c) ? c[0] : c.x, rz = Array.isArray(c) ? c[1] : c.z;
        ctx.fillRect(toX(rx) - 5, toY(rz) - 5, 10, 10);
        ctx.strokeRect(toX(rx) - 5, toY(rz) - 5, 10, 10);
      }

      // Şehir suru ve meydanı
      const tr = (typeof TOWN_HALF !== 'undefined' ? TOWN_HALF : 30) * sc;
      ctx.fillStyle = 'rgba(195, 175, 138, 0.65)';
      ctx.strokeStyle = '#ffd87a';
      ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.arc(cx, cy, tr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      // Boyut Kapısı (Dimensional Gate)
      ctx.strokeStyle = '#6ae8ff';
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.arc(toX(0), toY(12), 4.2, 0, Math.PI * 2); ctx.stroke();

      // Bölge etiketleri
      ctx.fillStyle = '#fff0c8';
      ctx.font = 'bold 11px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText((ZONE.town || ZONE.name) + ' (Güvenli Şehir)', cx, cy - tr - 6);
      const rings = ZONE.rings || [];
      ctx.font = '10px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,240,200,0.86)';
      if (rings[0]) ctx.fillText(rings[0].name, cx + 52 * sc, cy - 42 * sc);
      if (rings[1]) ctx.fillText(rings[1].name, cx - 108 * sc, cy + 100 * sc);
      if (rings[2]) ctx.fillText(rings[2].name, cx + 115 * sc, cy - 195 * sc);
      if (PONDS && PONDS[0] && ZONE.pondNames && ZONE.pondNames[0]) {
        ctx.fillStyle = '#9fe6ff';
        ctx.fillText('💧 ' + ZONE.pondNames[0], toX(PONDS[0].x), toY(PONDS[0].z) - (PONDS[0].r || 9) * sc - 4);
      }
      if (RUINS && RUINS[0] && ZONE.ruinName) {
        const r0 = RUINS[0], rx = Array.isArray(r0) ? r0[0] : r0.x, rz = Array.isArray(r0) ? r0[1] : r0.z;
        ctx.fillStyle = '#ffd088';
        ctx.fillText('🏯 ' + ZONE.ruinName, toX(rx), toY(rz) - 8);
      }
    } else {
      // Zindan odaları ve koridorları
      const D = ZONE.dungeon || {};
      ctx.fillStyle = 'rgba(130, 115, 165, 0.35)';
      ctx.strokeStyle = '#b49cff';
      ctx.lineWidth = 1.8;
      for (const [ax, az, bx, bz, cw] of (D.halls || [])) {
        const dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz), a = Math.atan2(dz, dx);
        ctx.save(); ctx.translate(toX((ax + bx) / 2), toY((az + bz) / 2)); ctx.rotate(a);
        ctx.fillRect(-len * sc / 2, -(cw || 14) * sc / 2, len * sc, (cw || 14) * sc);
        ctx.restore();
      }
      for (const r of (D.rooms || [])) {
        ctx.beginPath(); ctx.arc(toX(r.x), toY(r.z), r.r * sc, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        if (r.name) {
          ctx.fillStyle = '#e8dcff'; ctx.font = 'bold 10px Georgia, serif'; ctx.textAlign = 'center';
          ctx.fillText(r.name, toX(r.x), toY(r.z) - r.r * sc - 4);
          ctx.fillStyle = 'rgba(130, 115, 165, 0.35)';
        }
      }
      for (const p of (D.portals || [])) {
        ctx.fillStyle = '#6ae2ff';
        ctx.beginPath(); ctx.arc(toX(p.x), toY(p.z), 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#bfefff'; ctx.font = '10px system-ui, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('🌀 ' + (p.name || p.label || ''), toX(p.x), toY(p.z) + 14);
      }
    }

    // Etkileşimli Hazine Sandıkları ve Kadim Sunaklar
    if (this.npcs && this.npcs.world && this.npcs.world.dungeonProps) {
      for (const dp of this.npcs.world.dungeonProps) {
        if (dp.used) continue;
        if (dp.kind === 'chest') {
          ctx.fillStyle = '#ffd84a';
          ctx.fillRect(toX(dp.x) - 3, toY(dp.z) - 3, 6, 6);
        } else if (dp.kind === 'shrine') {
          ctx.fillStyle = '#62f4ff';
          ctx.beginPath(); ctx.arc(toX(dp.x), toY(dp.z), 3.5, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    // Canavarlar ve Unique Bosslar
    for (const m of this.monsters.list) {
      if (m.dead) continue;
      if (m.def.unique) {
        ctx.fillStyle = '#b44cff';
        ctx.strokeStyle = '#ffd866';
        ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.arc(toX(m.pos.x), toY(m.pos.z), 6.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffe8ff'; ctx.font = 'bold 10px system-ui, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('👑 ' + m.def.name, toX(m.pos.x), toY(m.pos.z) - 9);
      } else {
        ctx.fillStyle = m.def.job ? '#ff8833' : '#e04838';
        ctx.fillRect(toX(m.pos.x) - 1.6, toY(m.pos.z) - 1.6, 3.2, 3.2);
      }
    }

    // NPC'ler
    for (const n of this.npcs.list) {
      const m = this.quests.markerForNpc(n.id);
      ctx.fillStyle = m === 'ready' ? '#ffd84a' : m === 'avail' ? '#5ee27a' : '#58c4ff';
      ctx.beginPath(); ctx.arc(toX(n.x), toY(n.z), 3.8, 0, Math.PI * 2); ctx.fill();
      if (m) {
        ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(m === 'ready' ? '?' : '!', toX(n.x), toY(n.z) - 6);
      }
    }

    // Aktif Kervan Devesi (varsa)
    if (typeof Job !== 'undefined' && Job.caravan && !Job.caravan.dead) {
      const cxp = toX(Job.caravan.pos.x), cyp = toY(Job.caravan.pos.z);
      ctx.fillStyle = '#ffb84a';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cxp, cyp, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffe29a'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('🐪 Kervan', cxp, cyp - 8);
    }

    // Oyuncunun yürüme hedefi (Tıkla-Yürü rotası)
    if (this.p.dest) {
      const px = toX(this.p.pos.x), py = toY(this.p.pos.z);
      const dx = toX(this.p.dest.x), dy = toY(this.p.dest.z);
      ctx.strokeStyle = 'rgba(110, 242, 168, 0.75)';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(dx, dy); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = '#5ef29a';
      ctx.beginPath();
      ctx.moveTo(dx - 5, dy); ctx.lineTo(dx + 5, dy);
      ctx.moveTo(dx, dy - 5); ctx.lineTo(dx, dy + 5);
      ctx.stroke();
    }

    // Oyuncu oku
    const px = toX(this.p.pos.x), py = toY(this.p.pos.z);
    ctx.save(); ctx.translate(px, py); ctx.rotate(-(this.p.heading || 0) + Math.PI);
    ctx.fillStyle = '#5ef29a'; ctx.strokeStyle = '#082012'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(5.5, 6); ctx.lineTo(0, 3); ctx.lineTo(-5.5, 6); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();

    // Sol-alt Lejant
    ctx.fillStyle = 'rgba(12, 10, 16, 0.76)';
    ctx.fillRect(8, h - 26, w - 16, 20);
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#5ef29a'; ctx.fillText('▲ Sen', 14, h - 12);
    ctx.fillStyle = '#58c4ff'; ctx.fillText('● NPC', 58, h - 12);
    ctx.fillStyle = '#e04838'; ctx.fillText('■ Canavar', 102, h - 12);
    ctx.fillStyle = '#b44cff'; ctx.fillText('👑 Unique', 165, h - 12);
    ctx.fillStyle = '#ffd84a'; ctx.fillText('■ Sandık', 228, h - 12);
    ctx.fillStyle = '#62f4ff'; ctx.fillText('● Sunak', 282, h - 12);
    ctx.fillStyle = '#ffe08a'; ctx.fillText('Sol Tık: Yürü', 342, h - 12);
  }

  _drawContinent() {
    const ctx = this.ctx, w = this.cv.width, h = this.cv.height;
    // Antik İpek Yolu Parşömen & Coğrafya Arka Planı
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#1e2736');
    g.addColorStop(0.45, '#3b2e1e');
    g.addColorStop(1, '#261c12');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Denizler (Akdeniz sol-alt, Karadeniz sol-üst)
    ctx.fillStyle = 'rgba(28, 78, 118, 0.55)';
    ctx.beginPath();
    ctx.ellipse(38, 255, 65, 52, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(90, 95, 55, 32, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // Coğrafi bölge yazıları
    ctx.fillStyle = 'rgba(255, 225, 165, 0.22)';
    ctx.font = 'italic bold 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('DOĞU ÇİN (TANG)', 395, 180);
    ctx.fillText('TAKLAMAKAN & ORTA ASYA', 245, 165);
    ctx.fillText('KUZEY ZİRVELERİ', 265, 36);
    ctx.fillText('AKDENİZ & MISIR', 95, 275);
    ctx.fillText('DOĞU ROMA', 65, 112);

    // Kervan Ticaret Yolları (Altın kesikli çizgiler)
    const byId = {};
    for (const n of CONTINENT_NODES) byId[n.id] = n;

    ctx.strokeStyle = 'rgba(255, 206, 98, 0.72)';
    ctx.lineWidth = 2.6;
    ctx.setLineDash([6, 4]);
    for (const [a, b] of CARAVAN_LINKS) {
      const na = byId[a], nb = byId[b];
      if (!na || !nb) continue;
      ctx.beginPath();
      ctx.moveTo(na.x, na.y);
      ctx.lineTo(nb.x, nb.y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Zindan ve FGW bağlantı çizgileri
    ctx.strokeStyle = 'rgba(175, 145, 255, 0.45)';
    ctx.lineWidth = 1.4;
    for (const n of CONTINENT_NODES) {
      if (!n.parent || !byId[n.parent]) continue;
      const p = byId[n.parent];
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(n.x, n.y); ctx.stroke();
    }

    // Düğümler (Şehirler, Zindanlar, FGW)
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.006);
    for (const n of CONTINENT_NODES) {
      const isCur = n.id === CUR_ZONE_ID;
      const isSel = this.selectedNode && this.selectedNode.id === n.id;
      const isHot = typeof Eco !== 'undefined' && Eco.hot === n.id;
      const r = n.kind === 'town' ? 11 : n.kind === 'dungeon' ? 7.5 : 7;

      if (isCur) {
        ctx.strokeStyle = `rgba(94, 242, 154, ${0.45 + pulse * 0.45})`;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(n.x, n.y, r + 6 + pulse * 3, 0, Math.PI * 2); ctx.stroke();
      }
      if (isSel) {
        ctx.strokeStyle = '#ffd866';
        ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.arc(n.x, n.y, r + 4, 0, Math.PI * 2); ctx.stroke();
      }

      ctx.fillStyle = n.kind === 'town' ? '#e6a83a' : n.kind === 'dungeon' ? '#9b5de5' : '#38b6ff';
      ctx.strokeStyle = isCur ? '#5ef29a' : '#fff2cc';
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      // Sembol
      ctx.fillStyle = '#1b1208';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(n.kind === 'town' ? '🏯' : n.kind === 'dungeon' ? '⚔' : '🌀', n.x, n.y);
      ctx.textBaseline = 'alphabetic';

      // İsim ve Seviye Etiketi
      ctx.font = n.kind === 'town' ? 'bold 11px Georgia, serif' : '10px system-ui, sans-serif';
      ctx.fillStyle = isCur ? '#7affb2' : n.kind === 'town' ? '#fff2cc' : '#dfd2ff';
      ctx.fillText(n.name + (isHot ? ' 🔥' : ''), n.x, n.y + r + 12);
      ctx.font = '9px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255, 230, 180, 0.78)';
      ctx.fillText('Sv.' + n.lv, n.x, n.y + r + 22);
    }

    // Alt Lejant
    ctx.fillStyle = 'rgba(12, 10, 16, 0.8)';
    ctx.fillRect(8, h - 26, w - 16, 20);
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#e6a83a'; ctx.fillText('● Şehir & Kervan Merkezi', 14, h - 12);
    ctx.fillStyle = '#9b5de5'; ctx.fillText('● Zindan (7)', 155, h - 12);
    ctx.fillStyle = '#38b6ff'; ctx.fillText('● Unutulmuş Dünya (FGW)', 235, h - 12);
    ctx.fillStyle = '#ff9a4a'; ctx.fillText('🔥 Kıtlık Kârı', 375, h - 12);
  }
}
